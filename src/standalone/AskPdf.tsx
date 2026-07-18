/**
 * Ask PDF — chat-style Q&A over a PDF, powered by a LangChain/LangGraph
 * hybrid-RAG session running on-device.
 *
 * This component is a thin shell around `createRagSession`. Per file:
 *
 *   1. Wait for both AI models to be ready.
 *   2. Build a `RagSession` — caches hit IndexedDB; cache misses run
 *      text-layer extraction (+ OCR fallback), chunk, embed, persist.
 *   3. Drive a typewriter chat: every question runs through the graph
 *      (classify → retrieve → generate, or → chitchat → END).
 *
 * Indexing happens *eagerly* the moment models are ready and a PDF is
 * loaded — not lazily on the first question — so the user isn't left
 * staring at a "Thinking…" spinner that's really doing extraction.
 */
import { AlertTriangle, Database, Loader2, MemoryStick, ScanSearch, Send } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ActiveModelBar } from "../components/ActiveModelBar.tsx";
import { AiConsentModal } from "../components/AiConsentModal.tsx";
import { AiModelGate } from "../components/AiModelGate.tsx";
import { AlertBox } from "../components/AlertBox.tsx";
import { ChatModelPickerModal } from "../components/ChatModelPickerModal.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { FileInfoBar } from "../components/FileInfoBar.tsx";
import { InfoCallout } from "../components/InfoCallout.tsx";
import { findTool } from "../config/tool-registry.ts";
import { useAsyncProcess } from "../hooks/useAsyncProcess.ts";
import { usePdfFile } from "../hooks/usePdfFile.ts";
import { useRagModels } from "../hooks/useRagModels.ts";
import { createRagSession, type IndexingProgress, type RagSession } from "../rag/index.ts";
import { formatFileSize } from "../utils/file-helpers.ts";

/**
 * Hard cap on user-question length. The chat model tiers we ship have
 * context windows from 2 K (SmolLM2-1.7B) up to 32 K (LFM2-2.6B); we
 * reserve most of the smallest tier's window for the document anchor
 * + relevant excerpts + system prompt, leaving the question slot at
 * ~100-150 tokens. 500 characters is a comfortable English-prose cap
 * for that slot — long enough for a detailed multi-clause question,
 * short enough that the smallest tier never has to truncate retrieved
 * context to fit. The textarea's `maxLength` enforces the cap at the
 * keystroke level so users can't paste a 10 KB blob and trigger
 * silent context-window overflow downstream.
 */
const MAX_QUESTION_CHARS = 500;
/** Threshold at which the character counter switches to the amber "near limit" colour. */
const COUNTER_WARN_AT = 400;

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Pages cited as context for an assistant reply. */
  citedPages?: number[];
  /** `true` while the assistant message is still being streamed. */
  streaming?: boolean;
}

export default function AskPdf() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [indexing, setIndexing] = useState<IndexingProgress | null>(null);
  const [scannedHint, setScannedHint] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);

  const rag = useRagModels();

  const sessionRef = useRef<RagSession | null>(null);
  // Token-stream coalescing: tokens arrive faster than a frame; buffer the
  // deltas and flush to React state at most once per animation frame so the
  // transcript re-renders (and the smooth-scroll effect re-fires) ~60×/s instead
  // of once per token. The final answer is written authoritatively after the
  // stream resolves, so the buffered tail is then dropped.
  const pendingDeltaRef = useRef("");
  const tokenRafRef = useRef<number | null>(null);
  // Tracks live-mount so the async indexing task below never setState (or
  // leaves a freshly-built chat session orphaned) after the user navigates
  // away mid-index. A per-effect "cancelled" flag can't be used there: the
  // indexing effect's deps churn while it runs (onIndexProgress flips
  // `indexing`/`isIndexing`), so its own cleanup would false-fire on its own
  // progress; a mount ref only flips on a real unmount.
  const mountedRef = useRef(true);

  const pdf = usePdfFile({
    onReset: () => {
      // Stop any in-flight answer before dropping the session — loading/changing
      // the PDF orphans the old chat pipeline, which would otherwise keep
      // generating to the token cap on-device (wasted WebGPU/WASM compute on the
      // exact low-RAM hardware this tool targets). interrupt() is a safe no-op
      // when nothing is streaming; mirrors the tier-swap / dispose / unmount paths.
      sessionRef.current?.interrupt();
      setTurns([]);
      setScannedHint(false);
      setIndexing(null);
      setSessionReady(false);
      sessionRef.current = null;
    },
  });
  const task = useAsyncProcess();

  // Auto-scroll the conversation to the latest message. The trigger
  // collapses "number of turns" and "current-turn length" into one
  // primitive so the effect re-runs both on new turns and as tokens
  // stream into the in-progress assistant turn.
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);
  const scrollTrigger = turns.length * 1_000_000 + (turns.at(-1)?.content.length ?? 0);
  useEffect(() => {
    if (scrollTrigger === 0) return;
    // Don't yank the user back to the bottom if they've scrolled up to re-read
    // mid-stream — only auto-follow while they're already pinned near the
    // bottom. This kills the "follow fights the user" problem the per-token
    // smooth scroll caused.
    const log = logRef.current;
    if (log && log.scrollHeight - log.scrollTop - log.clientHeight > 64) return;
    // Honour prefers-reduced-motion: smooth token-by-token scrolling
    // is a near-continuous animation, exactly what the media query
    // asks us to suppress. Fall back to an instant jump for users who
    // opt out.
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollAnchorRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
  }, [scrollTrigger]);

  const dialogOpen =
    rag.status === "awaiting-consent" ||
    rag.status === "downloading" ||
    rag.status === "loading" ||
    rag.status === "error";

  /** `true` while we're building the RAG session for the loaded PDF. */
  const isIndexing = indexing !== null;

  /**
   * Invalidate the RAG session whenever the user swaps chat tiers.
   * The session captured the previous chat pipeline by reference; that
   * pipeline gets `unloadModel`'d by `setChatVariant` so the next
   * `session.ask` would call into a disposed handle. Rebuilding is
   * cheap — the IndexedDB vector cache survives (embedder didn't
   * change) so it's a pipeline rewire, not a re-index.
   *
   * Chat turns are intentionally preserved: each question runs
   * through the graph independently, so the displayed history stays
   * coherent across a tier swap even though the answering model is
   * now different.
   */
  useEffect(() => {
    // Stop any in-flight answer before dropping the session — the old chat
    // pipeline is about to be unloaded, so let generation halt cleanly instead
    // of running to the token cap against a soon-to-be-disposed handle.
    sessionRef.current?.interrupt();
    sessionRef.current = null;
    setSessionReady(false);
    setIndexing(null);
  }, [rag.chatVariant]);

  /**
   * Same idea, different trigger. The session also captures the
   * embedder + reranker pipes by reference; if `disposeAllModels` ran
   * (e.g. user clicked "Free model memory" mid-session) the rollup
   * status drops out of `"ready"` and every pipe handle the session
   * is holding becomes a disposed-runtime call waiting to happen.
   *
   * Clearing the session ref here makes the next "models ready"
   * transition rebuild the session against the fresh pipes — the
   * same code path that runs after the initial cold load.
   */
  useEffect(() => {
    if (rag.status !== "ready") {
      sessionRef.current = null;
      setSessionReady(false);
    }
  }, [rag.status]);

  /**
   * Abort any in-flight on-device generation when the tool unmounts (user
   * navigates home / to another tool mid-answer). Without this the LLM keeps
   * running to its token cap in the background — wasted compute on the very
   * low-RAM devices this tool warns about — and its onToken callback keeps
   * writing into a component that's gone. interrupt() stops both at once.
   */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      sessionRef.current?.interrupt();
      if (tokenRafRef.current !== null) {
        cancelAnimationFrame(tokenRafRef.current);
        tokenRafRef.current = null;
      }
    };
  }, []);

  /**
   * Build the RAG session as soon as the PDF is loaded *and* both
   * models are ready. Idempotent — re-renders short-circuit on
   * `sessionRef.current`.
   */
  useEffect(() => {
    if (!pdf.file) return;
    if (rag.status !== "ready") return;
    if (sessionRef.current || isIndexing || scannedHint) return;
    const file = pdf.file;
    void task.run(async () => {
      try {
        const { chat, embed, rerank } = await rag.ensureReady();
        const session = await createRagSession({
          chatPipe: chat,
          chatInfo: rag.chat.info,
          embedPipe: embed,
          rerankPipe: rerank,
          file,
          onIndexProgress: setIndexing,
        });
        // Unmounted while indexing — don't touch state, and stop the freshly
        // built session so its chat pipeline isn't left live in the background
        // on a tool the user has already navigated away from.
        if (!mountedRef.current) {
          session.interrupt();
          return;
        }
        sessionRef.current = session;
        setSessionReady(true);
        setIndexing(null);
      } catch (e) {
        if (!mountedRef.current) return;
        setIndexing(null);
        if (e instanceof Error && /no usable text/i.test(e.message)) {
          setScannedHint(true);
          return;
        }
        throw e;
      }
    }, "Failed to index the PDF. Please try again.");
    // Depend on the specific stable values the effect reads — not the whole
    // `rag`/`task` objects, which get new identities on every streaming-token
    // render and would otherwise re-evaluate this expensive effect needlessly.
    // `rag.ensureReady`/`task.run` are useCallback-stable, `rag.chat.info` is
    // registry-derived (stable per chatModelId), and the in-body guard still
    // short-circuits when a session exists / is indexing / scanned.
  }, [pdf.file, rag.status, rag.ensureReady, rag.chat.info, task.run, isIndexing, scannedHint]);

  const handleAsk = useCallback(async () => {
    if (!pdf.file || !sessionRef.current) return;
    const session = sessionRef.current;
    const q = question.trim();
    if (!q) return;

    const userId = `u-${Date.now()}`;
    const assistantId = `a-${Date.now()}`;
    setTurns((prev) => [
      ...prev,
      { id: userId, role: "user", content: q },
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setQuestion("");

    const flushDeltas = () => {
      tokenRafRef.current = null;
      const delta = pendingDeltaRef.current;
      if (!delta) return;
      pendingDeltaRef.current = "";
      setTurns((prev) =>
        prev.map((t) => (t.id === assistantId ? { ...t, content: t.content + delta } : t)),
      );
    };

    await task.run(async () => {
      const result = await session.ask({
        question: q,
        onToken: (delta) => {
          pendingDeltaRef.current += delta;
          if (tokenRafRef.current === null) {
            tokenRafRef.current = requestAnimationFrame(flushDeltas);
          }
        },
      });
      // The final setTurns below writes the authoritative full answer, so cancel
      // any queued frame and drop the buffered tail to avoid a double-append.
      if (tokenRafRef.current !== null) {
        cancelAnimationFrame(tokenRafRef.current);
        tokenRafRef.current = null;
      }
      pendingDeltaRef.current = "";
      setTurns((prev) =>
        prev.map((t) =>
          t.id === assistantId
            ? {
                ...t,
                content: result.answer,
                // Citation footer only makes sense for grounded answers
                // — chitchat and off-topic refusals don't reference
                // document pages, so we drop the field entirely for them.
                citedPages: result.intent === "question" ? result.citedPages : undefined,
                streaming: false,
              }
            : t,
        ),
      );
    }, "Failed to answer question. Please try again.");
  }, [pdf.file, question, task]);

  // On task error, mark any streaming assistant turn as failed.
  useEffect(() => {
    if (!task.error) return;
    // Drop any queued token frame so a stray flush can't re-add content to the
    // turn we're about to clear.
    if (tokenRafRef.current !== null) {
      cancelAnimationFrame(tokenRafRef.current);
      tokenRafRef.current = null;
    }
    pendingDeltaRef.current = "";
    setTurns((prev) =>
      prev.map((t) => (t.streaming ? { ...t, content: "", streaming: false } : t)),
    );
  }, [task.error]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleAsk();
      }
    },
    [handleAsk],
  );

  // RAM heads-up — always shown until the model is ready (warning
  // is moot at that point). We tried gating this on
  // `navigator.deviceMemory < 8` to hide it on machines that look
  // comfortable, but the signal is too unreliable to use as a
  // visibility switch:
  //   - Chrome caps the reading at 8 GB for privacy, so a 16 / 32 GB
  //     desktop reports the same value as an 8 GB one — we'd hide
  //     the hint on devices we can't actually verify.
  //   - Firefox / Safari don't ship the API at all (returns `null`).
  //
  // The detected RAM line still lives in `AiModelDetailsModal` for
  // users who want to inspect what we read; this surface just gives
  // every user the recommendation up-front. Mobile users never reach
  // this code — `App.tsx` short-circuits to a "desktop only" view
  // when `tool.desktopOnly` and `isMobileDevice()` both hold.
  const askPdfTool = findTool("ask-pdf");
  const ramRequirement = askPdfTool?.requirements ?? null;
  const showRamNote = ramRequirement !== null && rag.status !== "ready";

  return (
    <div className="space-y-6" data-rag-status={rag.status} data-rag-chat-status={rag.chat.status}>
      {showRamNote && (
        // Compact single-line RAM heads-up rendered at the *top* of
        // the tool so users see it before they bother uploading a
        // file — on a low-RAM device that decision matters before
        // the download cost is paid. Lives outside the file-state
        // conditional so it stays visible across the drop-zone /
        // gate / indexing / scanned-hint stages, and hides once the
        // model is loaded (warning is moot at that point).
        // Amber icon flags it as a "watch out", not a hard block —
        // users can still proceed.
        <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-dark-text-muted px-1">
          <MemoryStick
            className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500 dark:text-amber-400"
            aria-hidden="true"
          />
          <span>
            {ramRequirement}. The two models load into memory together — lower-RAM devices may run
            slowly or close this tab during inference.
          </span>
        </p>
      )}

      {/*
        Sequential flow — gate first, PDF second.
        ─────────────────────────────────────────
        Old layout asked for a PDF upload *before* downloading the
        models, which meant the user committed a file (and looked at
        an unactionable "Loading…" state) before they'd even seen the
        download size or picked a chat tier. New layout walks the
        user through one step at a time:
            (1) gate card — tier picker + Download CTA
            (2) PDF drop zone — only shown once the rollup says all
                three pipelines are loaded
            (3) indexing card — while the embedder chunks the file
            (4) chat panel — with the composer enabled

        The gate's `ready`/`loading` overrides take the *rollup*
        status (`rag.status`) instead of just the chat status — that
        way the children only mount when every pipeline is actually
        usable, not the moment chat alone resolves. Without the
        override the gate would render an unusable chat panel during
        the brief window where chat is "ready" but embed/rerank are
        still mid-load (partial-cache return-visit edge case).
      */}
      <AiModelGate
        ai={rag.chat}
        models={[rag.chat.info, rag.embed.info, rag.rerank.info]}
        roles={["chat", "retrieval", "rerank"]}
        chatVariant={rag.chatVariant}
        onChatVariantChange={rag.setChatVariant}
        // Copy that matches the *current* state. The "Download AI
        // models…" headline only makes sense on a first-run download
        // (or an explicit re-download via the consent dialog); on a
        // returning visitor with the bytes already cached we're not
        // downloading, we're restoring — and the headline shouldn't
        // claim otherwise. Mapping by rollup status keeps the gate
        // honest across all three lifecycle paths the user can land
        // on (cold first-visit, warm reload, partial cache).
        title={
          rag.status === "loading"
            ? "Restoring AI models from your device cache…"
            : rag.status === "downloading"
              ? "Downloading AI models…"
              : "Download AI models to chat with your PDFs"
        }
        blurb={
          rag.status === "loading"
            ? "We're loading the models you already downloaded — no network needed. This usually takes a few seconds."
            : rag.status === "downloading"
              ? "Hang tight — the models are streaming into your browser cache. After this, every future visit loads in seconds."
              : "Ask your PDF runs entirely on your device. Pick a chat-model size below, download it once, then choose a PDF to start chatting."
        }
        ready={rag.status === "ready"}
        loading={
          rag.status === "downloading" ||
          rag.status === "loading" ||
          rag.status === "awaiting-consent"
        }
        // Gate's "Download model" click should kick off the actual
        // download for every pipeline in the bundle. We use
        // `rag.confirm` (not `rag.ensureReady`) deliberately:
        //
        //   - `ensureReady` would push each model through the
        //     `awaiting-consent` state and the user would have to
        //     click "Download model" *again* in the consent dialog
        //     that opens. Two identical buttons for the same
        //     decision is bad UX — the gate already shows the
        //     picker, the aggregate footprint, and a "View details"
        //     link covering everything the consent body would
        //     repeat. The dialog's job from here is just to show
        //     progress, not to gather a second confirmation.
        //   - `confirm` calls each sub-hook's confirm directly,
        //     which calls `startDownload` and flips status
        //     `idle → downloading` in one shot. The dialog opens
        //     in download state (per `dialogOpen` below covering
        //     `downloading`), the progress UI renders, no extra
        //     click needed.
        //   - Also fixes the partial-cache edge case
        //     (migrateLegacyChatReadyFlag clears the rerank flag
        //     once): confirm iterates all three sub-models, so
        //     even if chat is already cached and ready, embed +
        //     rerank still get a fresh startDownload call.
        onDownload={rag.confirm}
        // Storage actions in the gate-side details modal — covers
        // the "I freed memory and now I want to delete the disk
        // cache too" path without forcing the user to re-download
        // just to surface a delete button. canFreeMemory is false
        // here (gate only shows when not ready), so the dialog
        // hides Free Memory; canDelete may be true if disk cache
        // survives, so Delete appears when there's something to do.
        onFreeMemory={rag.dispose}
        onDeleteCachedModels={rag.evict}
        canFreeMemory={rag.canFreeMemory}
        canDelete={rag.canDelete}
      >
        {/* Children render only when all three models are ready. */}
        {pdf.file && (
          <FileInfoBar
            fileName={pdf.file.name}
            details={formatFileSize(pdf.file.size)}
            onChangeFile={pdf.reset}
          />
        )}

        {!pdf.file ? (
          <FileDropZone
            accept=".pdf,application/pdf"
            onFiles={pdf.onFiles}
            encryptedFile={pdf.encryptedFile}
            onClearEncrypted={pdf.reset}
            label="Drop a PDF file here"
            hint="Models are ready — drop a PDF to start chatting"
          />
        ) : scannedHint ? (
          <InfoCallout icon={ScanSearch} title="Couldn't extract any text" accent="warning">
            This PDF has no usable text — even after OCR. It may be encrypted, password-protected,
            or low-resolution. Try a different file.
          </InfoCallout>
        ) : isIndexing ? (
          <IndexingCard progress={indexing} />
        ) : (
          <>
            <ChatPanel
              turns={turns}
              scrollAnchorRef={scrollAnchorRef}
              logRef={logRef}
              composer={
                <Composer
                  value={question}
                  onChange={setQuestion}
                  onKeyDown={onKeyDown}
                  onSubmit={handleAsk}
                  disabled={task.processing || !sessionReady}
                  inputDisabled={!sessionReady}
                  placeholder="Ask something about this PDF…"
                  busyLabel={task.processing ? "Thinking…" : "Preparing…"}
                />
              }
            />
            {/*
              Persistent caveat shown beneath the chat panel while
              chatting. On-device chat models in the 1-3 B range
              occasionally misread digits, mis-attribute facts, or
              paraphrase loosely — true across all the tiers we ship
              today. Users should treat answers as a search assist,
              not as authoritative extracts.
            */}
            <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-dark-text-muted px-1">
              <AlertTriangle
                className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500 dark:text-amber-400"
                aria-hidden="true"
              />
              <span>
                AI answers may be inaccurate — always verify against the source document before
                relying on them.
              </span>
            </p>
          </>
        )}
      </AiModelGate>

      {/*
        Single storage / status bar at the bottom, shown only when
        the rollup says everything is ready. While the gate is up
        the gate itself surfaces "View details" + the same storage
        actions, so a second bar would just stack two model-info
        widgets on top of each other.
      */}
      {rag.status === "ready" && (
        <ActiveModelBar
          models={[rag.chat.info, rag.embed.info, rag.rerank.info]}
          roles={["chat", "retrieval", "rerank"]}
          ready
          onChange={() => setVariantPickerOpen(true)}
          disabled={task.processing || isIndexing}
          onFreeMemory={rag.dispose}
          onDeleteCachedModels={rag.evict}
          canFreeMemory={rag.canFreeMemory}
          canDelete={rag.canDelete}
        />
      )}

      {task.error && <AlertBox message={task.error} />}

      <AiConsentModal
        open={dialogOpen}
        models={[rag.chat.info, rag.embed.info, rag.rerank.info]}
        roles={["chat", "retrieval", "rerank"]}
        status={rag.status}
        progress={rag.progress}
        // Per-model arrays parallel to `models` — drive the per-model
        // breakdown beneath the overall bar so users see *which*
        // pipeline the current bytes are flowing into.
        perModelStatus={[rag.chat.status, rag.embed.status, rag.rerank.status]}
        perModelProgress={[rag.chat.progress, rag.embed.progress, rag.rerank.progress]}
        error={rag.error}
        onConfirm={rag.confirm}
        onRetry={rag.retry}
        onCancel={rag.cancel}
      />

      <ChatModelPickerModal
        open={variantPickerOpen}
        current={rag.chatVariant}
        onConfirm={(next) => {
          rag.setChatVariant(next);
          setVariantPickerOpen(false);
        }}
        onCancel={() => setVariantPickerOpen(false)}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

/**
 * Centred card shown while the RAG index is being built for the
 * uploaded PDF. Replaces the previous inline `<ProgressBar>` + disabled
 * composer combo, which looked like a frozen chat with a tiny progress
 * detail tacked above it. Now it's a single dominant card: the user
 * sees one focused state instead of a half-rendered chat UI.
 *
 * The stage label maps the underlying {@link IndexingProgress} kind
 * to a sentence that explains what's happening *to the user*, not in
 * pipeline terms ("extract" / "embed" become "Reading text" /
 * "Building search index").
 */
function IndexingCard({ progress }: { progress: IndexingProgress | null }) {
  const { label, hint } = describeIndexProgress(progress);
  // **Why a custom bar instead of `<ProgressBar>`**: the indexing
  // pipeline runs in two distinct phases (`extract` then `embed`),
  // each with its own current/total. Using `<ProgressBar>` per phase
  // means the bar climbs to ~100 % during extract, *resets to 0 %* the
  // moment embed starts, then snaps to 100 % at the end — visually
  // the bar moves backwards. We compute a single monotonic percent
  // across both phases here and let the label carry the per-phase
  // "(3/4)" detail.
  const percent = overallIndexingPercent(progress);
  return (
    <div className="border-y border-[var(--color-rule)] py-5" role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink)]">
            Preparing your document
          </p>
          <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-1 leading-relaxed">
            {hint} This happens once per PDF — re-opening the same file later is instant.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="flex justify-between text-sm text-slate-600 dark:text-dark-text-muted">
          <span className="min-w-0 truncate pr-2">{label}</span>
          <span className="tabular-nums shrink-0">{percent}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-dark-border rounded-full h-2 overflow-hidden">
          {/* No CSS transition: the bar snaps to the new width in
              the same React render that updates the percent text. A
              300ms `transition-[width]` was causing the bar's visual
              fill to lag the displayed percent — bar at ~50 % while
              the label already read 62 %, which looks broken. Embed
              batches fire every couple of seconds so a snap reads as
              progress, not a glitch. */}
          <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}

/**
 * Map the phase-specific {@link IndexingProgress} onto a single
 * monotonic 0–100 progress percent.
 *
 * **Weight choice** (extract = 30 %, embed = 70 %): on a typical
 * text-layer PDF, extraction is fast (a few ms per page) while
 * embedding is the long pole — each batch is a WASM forward pass
 * against a ~320 MB int8 embedder. Roughly matches the wall-clock split
 * we see on the résumé fixture. OCR-heavy PDFs invert this, but we
 * accept the small lie there because OCR users see the dedicated
 * "Running OCR on scanned pages…" label and know it's slow.
 */
function overallIndexingPercent(progress: IndexingProgress | null): number {
  if (!progress) return 0;
  const ratio = progress.total > 0 ? Math.min(1, progress.current / progress.total) : 0;
  if (progress.kind === "extract") return Math.round(ratio * 30);
  return Math.round(30 + ratio * 70);
}

function describeIndexProgress(progress: IndexingProgress | null): {
  label: string;
  hint: string;
} {
  if (!progress) {
    return {
      label: "Starting…",
      hint: "Reading text from the PDF and building a search index so the assistant can answer questions about it.",
    };
  }
  if (progress.kind === "extract") {
    return progress.phase === "ocr"
      ? {
          label: `Running OCR on scanned pages (${progress.current}/${progress.total})…`,
          hint: "Pages without a text layer are being read with OCR — slower than plain text, but the answers will be just as grounded.",
        }
      : {
          label: `Reading PDF text (${progress.current}/${progress.total})…`,
          hint: "Extracting the text layer from your PDF so the assistant has something to search.",
        };
  }
  return {
    label: `Building search index (${progress.current}/${progress.total} chunks)…`,
    hint: "Turning the text into vectors the assistant can search through when you ask a question.",
  };
}

/**
 * Bounded chat panel: a flex column that fills available vertical
 * space within sensible bounds, with the conversation scrolling
 * *inside* the panel and the composer anchored at the bottom edge.
 *
 * Why a bounded panel instead of a sticky composer with page-level
 * scroll:
 *
 *   - The composer never visually jumps when the user scrolls back to
 *     re-read an earlier turn — page scroll stops at the panel's
 *     edges.
 *   - As more turns accumulate the panel never pushes other tool
 *     chrome (FileInfoBar / ActiveModelBar) off-screen — they stay
 *     pinned, which matches what users expect from a chat surface.
 *   - The visual frame creates a clear "this is a conversation"
 *     affordance vs. the plain document flow the page uses elsewhere.
 *
 * Heights are responsive: on phones the panel caps at ~60 svh / 520 px
 * so the composer (the primary interaction) stays above the fold even
 * with the title block + file-info card stacked above. At `sm:` and up
 * we relax to the original 72 svh / 720 px envelope where there's more
 * viewport to spend on transcript history.
 */
function ChatPanel({
  turns,
  composer,
  scrollAnchorRef,
  logRef,
}: {
  turns: ChatTurn[];
  composer: React.ReactNode;
  scrollAnchorRef: React.RefObject<HTMLDivElement | null>;
  logRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex h-[min(58svh,520px)] min-h-80 flex-col overflow-hidden rounded-lg border border-[var(--color-rule)] bg-[var(--color-paper)] sm:h-[min(72svh,720px)] sm:min-h-115">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-rule)] bg-[var(--color-surface)] px-4 py-2.5">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink)]">
          Document transcript
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--color-ink-3)]">
          On-device session
        </span>
      </div>
      {/* `thin-scrollbar` matches the scrollbar idiom used in modals
          (AiConsentModal, AiModelDetailsModal) so
          the chat panel doesn't read as a different surface from the
          rest of the app's overflow containers.

          `role="log"` + `aria-live="polite"` turn the transcript into
          an announced region: the "Thinking…" placeholder and each
          streamed assistant token are read out as they append.
          `aria-atomic="false"` keeps the reader from re-announcing the
          whole conversation on every token — only the newly appended
          text is voiced. */}
      <div
        ref={logRef}
        className="flex-1 overflow-y-auto thin-scrollbar px-4 py-4"
        role="log"
        aria-live="polite"
        aria-atomic="false"
      >
        {turns.length === 0 ? (
          <EmptyChatHint />
        ) : (
          <>
            <div className="divide-y divide-[var(--color-rule)]">
              {turns.map((turn) => (
                <Bubble key={turn.id} turn={turn} />
              ))}
            </div>
            <div ref={scrollAnchorRef} />
          </>
        )}
      </div>
      <div className="shrink-0 border-t border-[var(--color-rule)] bg-[var(--color-surface)]">
        {composer}
      </div>
    </div>
  );
}

/**
 * Placeholder shown when there are no turns yet. Lives in the same
 * scroll area the conversation will populate so the panel doesn't
 * collapse to a hairline before the first question.
 */
function EmptyChatHint() {
  // On mobile the panel is short, so we top-anchor the hint (small
  // top padding) — vertical-centring in a 520 px box leaves the hint
  // floating in the middle of empty grey, which reads as "broken" on
  // a phone. On `sm:` and up the panel is taller and centring looks
  // intentional, so we flip back to `justify-center`.
  return (
    <div className="h-full flex flex-col items-center justify-start sm:justify-center text-center px-6 pt-10 sm:pt-0">
      <Database className="mb-3 h-4 w-4 text-primary-600" aria-hidden="true" />
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink)]">
        Ready to chat about this PDF
      </p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-[var(--color-ink-3)]">
        Ask anything about the document&apos;s contents. Answers are generated on-device and stay
        grounded in the selected file.
      </p>
    </div>
  );
}

/**
 * Markdown renderer for assistant turns. Wraps `react-markdown` with a
 * minimal Tailwind component map so the rendered output inherits the
 * bubble's typography instead of `react-markdown`'s default unstyled
 * HTML. `remark-gfm` enables tables, task lists, strikethrough, and
 * autolinks — features the prompt allows the model to use when the
 * question warrants.
 *
 * **Safety**: `react-markdown` does NOT render raw HTML by default,
 * so even if the chat model emits a `<script>` tag verbatim it lands
 * as literal text in the DOM. We do not add `rehype-raw`. The model
 * output is the only untrusted input on this path.
 */
// Hoisted to module scope: this map captures no props and never changes, so
// rebuilding it per render — once per streamed token while an answer comes in —
// is pure waste.
const ASSISTANT_MD_COMPONENTS: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-5 mb-2 last:mb-0 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-5 mb-2 last:mb-0 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h3 className="font-semibold text-base mb-1.5">{children}</h3>,
  h2: ({ children }) => <h3 className="font-semibold text-base mb-1.5">{children}</h3>,
  h3: ({ children }) => <h3 className="font-semibold text-base mb-1.5">{children}</h3>,
  code: ({ children }) => (
    <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-dark-bg text-xs font-mono">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 p-3 rounded-lg bg-slate-100 dark:bg-dark-bg text-xs font-mono overflow-x-auto thin-scrollbar">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-slate-300 dark:border-dark-border pl-3 italic text-slate-600 dark:text-dark-text-muted my-2">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-primary-600 dark:text-primary-400 underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-slate-200 dark:border-dark-border" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto thin-scrollbar">
      <table className="text-xs border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-slate-200 dark:border-dark-border px-2 py-1 font-semibold text-left">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-200 dark:border-dark-border px-2 py-1">{children}</td>
  ),
};

function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed text-slate-800 dark:text-dark-text wrap-anywhere">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={ASSISTANT_MD_COMPONENTS}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

// memo so only the bubble whose object identity changed re-renders. Each token
// rebuilds just the in-flight assistant turn (setTurns maps a new object for
// that id only); every finished bubble keeps its reference and is skipped —
// turning a per-token "re-render the whole transcript" into "re-render one node".
const Bubble = memo(function Bubble({ turn }: { turn: ChatTurn }) {
  const isUser = turn.role === "user";
  return (
    // `data-bubble` is the stable hook the e2e probe uses to count
    // turns and find the last assistant reply. Without it the tests
    // would have to grep Tailwind class names — exactly the coupling
    // that broke when we swapped the assistant rendering from plain
    // `<p whitespace-pre-wrap>` to markdown components.
    //
    // `data-streaming` toggles to "true" while a token stream is in
    // flight so tests can wait for it to clear (and a screen reader
    // can interpret aria-busy from the same primitive).
    <div className="py-3 first:pt-0 last:pb-0">
      {/* 42rem cap on top of the 85%: the panel spans the full app shell,
          and an answer running past ~75ch becomes unreadable. */}
      <div className={`max-w-[min(92%,42rem)] text-sm leading-relaxed ${isUser ? "ml-auto" : ""}`}>
        <div className={`mb-2 flex items-center gap-2 ${isUser ? "justify-end" : ""}`}>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-3)]">
            {isUser ? "You / question" : "CloakPDF / local answer"}
          </span>
          {turn.streaming && (
            <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-primary-600">
              Processing
            </span>
          )}
        </div>
        <div
          className={
            isUser
              ? "border-l-2 border-primary-500 bg-primary-50/60 px-3 py-2 text-[var(--color-ink)] dark:bg-primary-900/20"
              : "text-[var(--color-ink)]"
          }
          data-bubble={turn.role}
          data-streaming={turn.streaming ? "true" : "false"}
          aria-busy={turn.streaming ? true : undefined}
        >
          {turn.streaming && !turn.content ? (
            <span className="inline-flex items-center gap-2 text-[var(--color-ink-3)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Thinking…
            </span>
          ) : isUser ? (
            // User turns are plain text — we don't want their question
            // rendered as markdown (a stray "#" or "*" should appear
            // verbatim). Whitespace-pre-wrap keeps any line breaks
            // the user typed with Shift+Enter.
            <p className="whitespace-pre-wrap wrap-anywhere">{turn.content}</p>
          ) : turn.streaming ? (
            // While streaming, render the partial answer as plain text. Re-running
            // the full remark-gfm + rehype markdown parse on every token is
            // O(tokens × length) of wasted main-thread work; the final frame
            // (streaming=false, below) renders markdown — which is what the e2e
            // probe asserts on.
            <p className="whitespace-pre-wrap wrap-anywhere">{turn.content}</p>
          ) : (
            // Assistant turns are markdown — the prompt allows the model
            // to use lists, headings, bold, and code spans when the
            // question warrants. The caret lives outside the markdown
            // so a partial token stream (e.g. an unfinished `**bold**`)
            // doesn't disturb the streaming indicator.
            <AssistantMarkdown content={turn.content} />
          )}
          {!isUser && turn.streaming && turn.content && (
            <span
              aria-hidden="true"
              className="inline-block w-1.5 h-4 ml-0.5 -mb-0.5 align-middle bg-current opacity-60 animate-pulse"
            />
          )}
          {!isUser && turn.citedPages && turn.citedPages.length > 0 && !turn.streaming && (
            <p className="mt-2 border-t border-[var(--color-rule)] pt-2 font-mono text-[10px] uppercase tracking-[0.05em] text-[var(--color-ink-3)]">
              Context from {turn.citedPages.length === 1 ? "page" : "pages"}{" "}
              {turn.citedPages.join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

function Composer({
  value,
  onChange,
  onKeyDown,
  onSubmit,
  disabled,
  inputDisabled,
  placeholder,
  busyLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  /** Gates the Send button + busy label (true while streaming OR not ready). */
  disabled: boolean;
  /** Gates only the textarea's editability (true only when the session isn't
   *  ready). Kept separate from `disabled` so the user can keep typing their
   *  next question while the current answer streams — the single-flight guard
   *  still prevents sending until streaming finishes. */
  inputDisabled: boolean;
  placeholder?: string;
  busyLabel?: string;
}) {
  // The composer is rendered *inside* the `ChatPanel`'s flex column,
  // anchored to the panel's bottom edge. It no longer needs `sticky`
  // positioning, a border, or a card shadow — the panel provides all
  // of those. We keep just the padding so the textarea has room to
  // breathe.
  return (
    // The textarea drops its own outline (so a long pasted question
    // scrolls cleanly without a clipped ring); the visible focus
    // indicator moves to this wrapper via `focus-within` so keyboard
    // users still get the one-accent ring around the whole composer.
    //
    // The ring is `inset`, not offset: the composer is the full-bleed
    // bottom section of the chat panel, whose `overflow-hidden rounded-lg`
    // box clips anything drawn outside its edges. An outset ring (the old
    // `ring-offset-1`) got sheared off on the left/right/bottom, leaving
    // only the top edge visible. An inset ring is painted inside the
    // composer's own border-box, so it renders whole.
    //
    // The *bottom* corners also match the panel's `rounded-lg` radius. The
    // composer's bottom edge coincides with the panel's bottom edge, so a
    // matching radius lets the inset ring follow the same arc as the
    // clip and sit just inside it. The top corners sit at the mid-panel
    // divider, nowhere near a clipped corner, so they keep the softer 8px.
    <div className="rounded-b-lg p-3 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-600">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={inputDisabled}
        aria-label="Ask a question about this PDF"
        placeholder={placeholder ?? "Ask something about this PDF…"}
        rows={2}
        maxLength={MAX_QUESTION_CHARS}
        // `thin-scrollbar` matches the styled scrollbar used elsewhere
        // (modals, chat panel) so a long pasted question scrolls
        // inside the textarea consistently with the rest of the app.
        // Placeholder is slate-500 (not slate-400) so the only label
        // these users see before typing clears WCAG 1.4.3 AA.
        className="thin-scrollbar w-full resize-none bg-transparent text-sm text-slate-800 dark:text-dark-text placeholder-slate-500 dark:placeholder-dark-text-muted focus-visible:outline-none disabled:opacity-50"
      />
      <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-slate-100 dark:border-dark-border/60">
        <p className="text-xs text-slate-500 dark:text-dark-text-muted hidden sm:block">
          Press{" "}
          <kbd className="rounded-sm bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600 dark:bg-dark-bg dark:text-dark-text-muted">
            Enter
          </kbd>{" "}
          to send,{" "}
          <kbd className="rounded-sm bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600 dark:bg-dark-bg dark:text-dark-text-muted">
            Shift+Enter
          </kbd>{" "}
          for a new line.
        </p>
        {/* Character counter — hidden until the user is close to the
            limit so it doesn't clutter the composer during normal use.
            Switches to amber once `COUNTER_WARN_AT` is reached so the
            constraint feels advisory rather than punitive. Tabular
            numerals keep the count from jiggling as digits change.

            The visual counter is *not* an aria-live region: voicing
            the running "401/500 … 402/500 …" tally on every keystroke
            is noise, not help. Instead the screen-reader announcement
            lives in the dedicated polite region below, whose content
            only changes at the two thresholds — so it fires once when
            the user is approaching the limit and once when they hit
            it, and stays silent in between. */}
        {value.length >= COUNTER_WARN_AT && (
          <span
            aria-hidden="true"
            className={`text-xs tabular-nums ${
              value.length >= MAX_QUESTION_CHARS
                ? "text-amber-600 dark:text-amber-400 font-medium"
                : "text-amber-500 dark:text-amber-400"
            }`}
          >
            {value.length}/{MAX_QUESTION_CHARS}
          </span>
        )}
        <span role="status" aria-live="polite" className="sr-only">
          {value.length >= MAX_QUESTION_CHARS
            ? `Question length limit of ${MAX_QUESTION_CHARS} characters reached.`
            : value.length >= COUNTER_WARN_AT
              ? `Approaching the ${MAX_QUESTION_CHARS} character question limit.`
              : ""}
        </span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary-600 dark:focus-visible:ring-offset-dark-surface"
        >
          {disabled ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {busyLabel ?? "Thinking…"}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              Send
            </>
          )}
        </button>
      </div>
    </div>
  );
}
