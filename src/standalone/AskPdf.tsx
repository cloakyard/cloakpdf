/** Ask PDF owns a document-scoped session; models and retrieval stay in the RAG layer. */
import { ArrowDown, ArrowUpRight, BookOpen, RotateCcw, Send } from "lucide-react";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ActiveModelBar } from "../components/ActiveModelBar.tsx";
import { AiConsentModal } from "../components/AiConsentModal.tsx";
import { AiModelDetailsModal } from "../components/AiModelDetailsModal.tsx";
import { AiModelGate } from "../components/AiModelGate.tsx";
import { AlertBox } from "../components/AlertBox.tsx";
import { ChatModelPickerModal } from "../components/ChatModelPickerModal.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { FileInfoBar } from "../components/FileInfoBar.tsx";
import { ProgressBar } from "../components/ProgressBar.tsx";
import { usePdfFile } from "../hooks/usePdfFile.ts";
import { useRagModels } from "../hooks/useRagModels.ts";
import { createRagSession, type IndexingProgress, type RagSession } from "../rag/index.ts";
import { errorMessage, formatFileSize } from "../utils/file-helpers.ts";

// Reserve the model's context for document excerpts as well as the question.
const MAX_QUESTION_CHARS = 500;
const COUNTER_WARN_AT = 400;

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  citedPages?: number[];
  streaming?: boolean;
  request?: string;
  error?: string;
}
type DocumentState = "preparing" | "ready" | "empty" | "error";

export default function AskPdf() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [indexing, setIndexing] = useState<IndexingProgress | null>(null);
  const [documentState, setDocumentState] = useState<DocumentState>("preparing");
  const [indexError, setIndexError] = useState("");
  const [indexAttempt, setIndexAttempt] = useState(0);
  const [answering, setAnswering] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  const [modelDetailsOpen, setModelDetailsOpen] = useState(false);
  const rag = useRagModels();
  const sessionRef = useRef<RagSession | null>(null);
  const answerRef = useRef<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const retryRef = useRef<HTMLButtonElement | null>(null);
  const restoreRetryFocus = useRef(false);
  const tokenRafRef = useRef<number | null>(null);

  const clearSession = useCallback(() => {
    sessionRef.current?.interrupt();
    sessionRef.current = null;
    answerRef.current = null;
    if (tokenRafRef.current !== null) cancelAnimationFrame(tokenRafRef.current);
    tokenRafRef.current = null;
  }, []);
  const pdf = usePdfFile({
    onReset: () => {
      clearSession();
      setQuestion("");
      setTurns([]);
      setAnswering(false);
      setDocumentState("preparing");
      setIndexing(null);
      setIndexError("");
      restoreRetryFocus.current = false;
    },
  });

  useEffect(() => {
    if (documentState === "preparing" || !restoreRetryFocus.current) return;
    restoreRetryFocus.current = false;
    if (document.activeElement === document.body) {
      (documentState === "ready" ? composerRef.current : retryRef.current)?.focus();
    }
  }, [documentState]);

  useEffect(() => {
    if (!pdf.file) return;
    const url = URL.createObjectURL(pdf.file);
    setSourceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pdf.file]);

  // An effect owns exactly one indexing attempt. Progress never restarts it;
  // failed attempts wait for Retry. Late results from another PDF are discarded.
  useEffect(() => {
    clearSession();
    setAnswering(false);
    setDocumentState("preparing");
    setIndexing(null);
    setIndexError("");
    if (!pdf.file || rag.status !== "ready") return;
    let current = true;
    const file = pdf.file;
    void (async () => {
      try {
        const { chat, embed, rerank } = await rag.ensureReady();
        if (!current) return;
        const session = await createRagSession({
          chatPipe: chat,
          chatInfo: rag.chat.info,
          embedPipe: embed,
          rerankPipe: rerank,
          file,
          onIndexProgress: (progress) => {
            if (current) setIndexing(progress);
          },
        });
        if (!current) return;
        sessionRef.current = session;
        setDocumentState("ready");
      } catch (error) {
        if (!current) return;
        setIndexError(errorMessage(error, "Couldn't prepare this PDF. Please try again."));
        setDocumentState(
          error instanceof Error && /no usable text/i.test(error.message) ? "empty" : "error",
        );
      }
    })();
    return () => {
      current = false;
      clearSession();
    };
  }, [
    pdf.file,
    rag.status,
    rag.chatVariant,
    rag.chat.info,
    rag.ensureReady,
    indexAttempt,
    clearSession,
  ]);

  const handleAsk = useCallback(async (draft: string, retry?: ChatTurn) => {
    const session = sessionRef.current;
    const q = retry?.request ?? draft.trim();
    // Guard before appending turns or clearing the draft, including Enter while busy.
    if (!session || answerRef.current || !q) return;
    const id = retry?.id ?? crypto.randomUUID();
    answerRef.current = id;
    setAnswering(true);
    if (retry) {
      composerRef.current?.focus({ preventScroll: true });
      setTurns((previous) =>
        previous.map((turn) =>
          turn.id === id
            ? { ...turn, content: "", error: undefined, citedPages: undefined, streaming: true }
            : turn,
        ),
      );
    } else {
      setTurns((previous) => [
        ...previous,
        { id: crypto.randomUUID(), role: "user", content: q },
        { id, role: "assistant", content: "", streaming: true, request: q },
      ]);
      setQuestion("");
    }
    let pending = "";
    const current = () => sessionRef.current === session && answerRef.current === id;
    const flush = () => {
      tokenRafRef.current = null;
      if (!current() || !pending) return;
      const delta = pending;
      pending = "";
      setTurns((previous) =>
        previous.map((turn) =>
          turn.id === id ? { ...turn, content: turn.content + delta } : turn,
        ),
      );
    };
    try {
      const result = await session.ask({
        question: q,
        onToken: (delta) => {
          if (!current()) return;
          pending += delta;
          if (tokenRafRef.current === null) tokenRafRef.current = requestAnimationFrame(flush);
        },
      });
      if (!current()) return;
      setTurns((previous) =>
        previous.map((turn) =>
          turn.id === id
            ? {
                ...turn,
                content: result.answer,
                streaming: false,
                citedPages:
                  result.intent === "question"
                    ? [...new Set(result.citedPages)].filter(
                        (page) => Number.isInteger(page) && page > 0,
                      )
                    : undefined,
              }
            : turn,
        ),
      );
    } catch (error) {
      if (!current()) return;
      // Retain the partial answer and original question; retry never consumes a new draft.
      if (tokenRafRef.current !== null) cancelAnimationFrame(tokenRafRef.current);
      flush();
      setTurns((previous) =>
        previous.map((turn) =>
          turn.id === id
            ? {
                ...turn,
                streaming: false,
                error: errorMessage(error, "Couldn't finish this answer. Try again."),
              }
            : turn,
        ),
      );
    } finally {
      if (current()) {
        if (tokenRafRef.current !== null) cancelAnimationFrame(tokenRafRef.current);
        tokenRafRef.current = null;
        answerRef.current = null;
        setAnswering(false);
      }
    }
  }, []);
  const retryAnswer = useCallback((turn: ChatTurn) => handleAsk("", turn), [handleAsk]);

  const dialogOpen = ["awaiting-consent", "downloading", "loading", "error"].includes(rag.status);
  const busy = answering || (pdf.file !== null && documentState === "preparing");

  return (
    <div
      className="pdf-chat-workspace"
      data-rag-status={rag.status}
      data-rag-chat-status={rag.chat.status}
    >
      <AiModelGate
        status={rag.status}
        cached={rag.cached}
        models={[rag.chat.info, rag.embed.info, rag.rerank.info]}
        chatVariant={rag.chatVariant}
        onChatVariantChange={rag.setChatVariant}
        onDownload={rag.confirm}
        onViewDetails={() => setModelDetailsOpen(true)}
      >
        {pdf.file && (
          <FileInfoBar
            fileName={pdf.file.name}
            details={formatFileSize(pdf.file.size)}
            onChangeFile={() => {
              pdf.reset();
              requestAnimationFrame(() =>
                document
                  .querySelector<HTMLInputElement>('.pdf-chat-workspace input[type="file"]')
                  ?.focus(),
              );
            }}
          />
        )}
        {!pdf.file ? (
          <FileDropZone
            accept=".pdf,application/pdf"
            onFiles={pdf.onFiles}
            encryptedFile={pdf.encryptedFile}
            onClearEncrypted={pdf.reset}
            label="Drop a PDF file here"
            hint="Models are ready — open a PDF to start a conversation"
          />
        ) : documentState === "preparing" ? (
          <IndexingCard progress={indexing} />
        ) : documentState === "empty" || documentState === "error" ? (
          <section className="pdf-chat-preparing" aria-labelledby="pdf-chat-recovery-title">
            <h2 id="pdf-chat-recovery-title">
              {documentState === "empty" ? "No readable text found" : "Let's try that again"}
            </h2>
            {documentState === "empty" ? (
              <p role="status">
                Text extraction and OCR couldn't find usable text. Try a clearer copy or a different
                PDF.
              </p>
            ) : (
              <AlertBox message={indexError} />
            )}
            <button
              className="air-button"
              ref={retryRef}
              onClick={() => {
                restoreRetryFocus.current = true;
                setIndexAttempt((attempt) => attempt + 1);
              }}
            >
              <RotateCcw aria-hidden="true" />
              Try preparing again
            </button>
          </section>
        ) : (
          <>
            <ChatPanel
              turns={turns}
              sourceUrl={sourceUrl}
              answering={answering}
              onRetry={retryAnswer}
            >
              <form
                className="pdf-chat-composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleAsk(question);
                }}
              >
                <label className="air-label" htmlFor="pdf-chat-question">
                  Your question
                </label>
                <textarea
                  ref={composerRef}
                  id="pdf-chat-question"
                  className="air-field"
                  rows={2}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  maxLength={MAX_QUESTION_CHARS}
                  placeholder="What would you like to know?"
                  aria-describedby="pdf-chat-question-help"
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing &&
                      event.keyCode !== 229
                    ) {
                      event.preventDefault();
                      void handleAsk(question);
                    }
                  }}
                />
                <div className="pdf-chat-composer-footer">
                  <p id="pdf-chat-question-help" className="air-help">
                    Enter to send · Shift+Enter for a new line. Up to 500 characters.
                  </p>
                  <button
                    className="air-button air-button--primary"
                    type="submit"
                    disabled={answering || !question.trim()}
                  >
                    <Send aria-hidden="true" />
                    {answering ? "Answering…" : "Send"}
                  </button>
                </div>
                {question.length >= COUNTER_WARN_AT && (
                  <span className="pdf-chat-counter" aria-hidden="true">
                    {question.length} / {MAX_QUESTION_CHARS}
                  </span>
                )}
                <span className="sr-only" role="status">
                  {question.length >= MAX_QUESTION_CHARS
                    ? "Question length limit of 500 characters reached."
                    : question.length >= COUNTER_WARN_AT
                      ? "Approaching the 500 character question limit."
                      : ""}
                </span>
              </form>
            </ChatPanel>
            <p className="pdf-chat-caveat">
              AI can make mistakes. Check answers against your source document.
            </p>
          </>
        )}
        {pdf.loadError && <AlertBox message={pdf.loadError} />}
      </AiModelGate>
      {rag.status === "ready" && (
        <ActiveModelBar
          models={[rag.chat.info, rag.embed.info, rag.rerank.info]}
          onViewDetails={() => setModelDetailsOpen(true)}
          onChange={() => setVariantPickerOpen(true)}
          disabled={busy}
          onFreeMemory={async () => {
            await rag.dispose();
            requestAnimationFrame(() =>
              document.querySelector<HTMLButtonElement>("[data-ai-load-models]")?.focus(),
            );
          }}
          canFreeMemory={rag.canFreeMemory}
        />
      )}
      <AiModelDetailsModal
        open={modelDetailsOpen}
        onClose={() => setModelDetailsOpen(false)}
        models={[rag.chat.info, rag.embed.info, rag.rerank.info]}
        roles={["chat", "retrieval", "rerank"]}
        onFreeMemory={rag.dispose}
        onDelete={rag.evict}
        canFreeMemory={rag.canFreeMemory}
        canDelete={rag.canDelete}
        storageActionsDisabled={busy}
      />
      <AiConsentModal
        open={dialogOpen}
        models={[rag.chat.info, rag.embed.info, rag.rerank.info]}
        roles={["chat", "retrieval", "rerank"]}
        status={rag.status}
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

function IndexingCard({ progress }: { progress: IndexingProgress | null }) {
  const label = !progress
    ? "Opening your PDF"
    : progress.kind === "embed"
      ? "Preparing searchable passages"
      : progress.phase === "ocr"
        ? "Reading scanned pages"
        : "Reading text pages";
  return (
    <section className="pdf-chat-preparing" aria-labelledby="pdf-chat-index-title">
      <BookOpen aria-hidden="true" />
      <h2 id="pdf-chat-index-title">Getting to know your document</h2>
      <p>Reading the pages and preparing them for your questions. Your PDF stays on this device.</p>
      <ProgressBar label={label} current={progress?.current ?? 0} total={progress?.total ?? 0} />
    </section>
  );
}

function ChatPanel({
  turns,
  sourceUrl,
  answering,
  onRetry,
  children,
}: {
  turns: ChatTurn[];
  sourceUrl: string;
  answering: boolean;
  onRetry: (turn: ChatTurn) => Promise<void>;
  children: React.ReactNode;
}) {
  const logRef = useRef<HTMLDivElement | null>(null);
  const followRef = useRef(true);
  const [following, setFollowing] = useState(true);
  useLayoutEffect(() => {
    const log = logRef.current;
    if (log && followRef.current) log.scrollTop = log.scrollHeight;
  }, [turns]);
  return (
    <section className="pdf-chat" aria-label="PDF conversation">
      <header className="pdf-chat-header">
        <h2>A conversation with your PDF</h2>
        <span>On your device</span>
      </header>
      <div
        className="pdf-chat-log"
        ref={logRef}
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        aria-busy={answering}
        tabIndex={0}
        onScroll={() => {
          const log = logRef.current!;
          const follow = log.scrollHeight - log.scrollTop - log.clientHeight < 64;
          followRef.current = follow;
          setFollowing(follow);
        }}
      >
        {!turns.length ? (
          <div className="pdf-chat-empty">
            <BookOpen aria-hidden="true" />
            <h3>Start with a little curiosity.</h3>
            <p>
              Ask for a summary, find a detail, or explore an idea. Sources will appear beside
              answers that reference your PDF.
            </p>
          </div>
        ) : (
          turns.map((turn) => (
            <Bubble
              key={turn.id}
              turn={turn}
              sourceUrl={sourceUrl}
              retryDisabled={answering && !!turn.error}
              onRetry={onRetry}
            />
          ))
        )}
      </div>
      {!following && (
        <button
          className="air-button pdf-chat-latest"
          onClick={() => {
            followRef.current = true;
            setFollowing(true);
            const log = logRef.current!;
            log.scrollTop = log.scrollHeight;
            log.focus({ preventScroll: true });
          }}
        >
          <ArrowDown aria-hidden="true" />
          Latest answer
        </button>
      )}
      {children}
    </section>
  );
}

const markdownComponents: Components = {
  img: ({ alt }) => <span>{alt}</span>,
  h1: ({ children }) => <h3>{children}</h3>,
  h2: ({ children }) => <h3>{children}</h3>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ),
  table: ({ children }) => (
    <div className="pdf-chat-table" role="region" aria-label="Answer table" tabIndex={0}>
      <table>{children}</table>
    </div>
  ),
};
const Bubble = memo(function Bubble({
  turn,
  sourceUrl,
  retryDisabled,
  onRetry,
}: {
  turn: ChatTurn;
  sourceUrl: string;
  retryDisabled: boolean;
  onRetry: (turn: ChatTurn) => Promise<void>;
}) {
  const user = turn.role === "user";
  return (
    <article
      className="pdf-chat-turn"
      data-bubble={turn.role}
      data-streaming={turn.streaming ? "true" : "false"}
    >
      <p className="pdf-chat-author">{user ? "You" : "CloakPDF"}</p>
      {user || turn.streaming ? (
        <p className="pdf-chat-plain">{turn.content || "Finding an answer…"}</p>
      ) : (
        turn.content && (
          <div className="pdf-chat-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {turn.content}
            </ReactMarkdown>
          </div>
        )
      )}
      {turn.error && (
        <div className="pdf-chat-recovery">
          <AlertBox message={turn.error} />
          <button
            className="air-button"
            disabled={retryDisabled}
            onClick={() => void onRetry(turn)}
          >
            <RotateCcw aria-hidden="true" />
            Retry answer
          </button>
        </div>
      )}
      {!!turn.citedPages?.length && sourceUrl && (
        <nav className="pdf-chat-sources" aria-label="Source pages">
          <span>Check the source</span>
          {turn.citedPages.map((page) => (
            <a
              className="air-button air-button--quiet"
              key={page}
              href={`${sourceUrl}#page=${page}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open source page ${page} (new tab)`}
            >
              Page {page}
              <ArrowUpRight aria-hidden="true" />
            </a>
          ))}
        </nav>
      )}
    </article>
  );
});
