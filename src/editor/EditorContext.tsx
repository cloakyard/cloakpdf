// EditorContext.tsx — Single source of truth for the canvas editor: the
// document, per-tool state, view (zoom/pan/page/mode), history, and layout.
//
// Ported in spirit from CloakIMG's EditorContext but PDF-shaped: the document
// is multi-page, history is byte+object snapshots (never rasters), and per-tool
// state is namespaced (Record<toolId, slice>) rather than one flat struct.
//
// State is split across focused contexts so a slider drag in one tool doesn't
// re-render the rail / top bar / every other panel:
//   • ActionsCtx    — stable callbacks; identity never changes after mount.
//   • ToolStateCtx  — the namespaced per-tool option slices (high-frequency).
//   • ActiveToolCtx — just the active tool id (flips only on tool switch).
//   • ViewCtx       — zoom/pan/page-grid view state (changes EVERY pan/zoom
//                     frame; isolated so the ~20 ReadCtx consumers don't
//                     re-render per frame — only the stage / top bar / grids do).
//   • ReadCtx       — doc, layout, history flags (infrequent).

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { detectLayout } from "./breakpoints.ts";
import {
  type CanvasDoc,
  type CanvasObject,
  createDocFromBytes,
  createDocFromFile,
  flattenDestructiveObjects,
  hasPendingDestructive,
  nextId,
  revokeThumbnails,
  withoutDestructive,
} from "./doc.ts";
import {
  deleteDraft,
  type EditorDraft,
  hashDocBytes,
  loadDraft,
  saveDraft,
} from "./draft-store.ts";
import { EditorHistory } from "./history.ts";
import { findEditorTool } from "./tools.ts";
import { DEFAULT_VIEW, type Layout, type ViewMode, type ViewState } from "./types.ts";
import { isPdfEncrypted } from "../utils/pdf-security.ts";

/** A serializable byte transform — the single funnel every byte mutation runs
 *  through (canvas Apply buttons, right-panel Apply).
 *  Receives the live doc, returns new bytes + a history label, and optionally
 *  the overlay object list to keep. Destructive/overlay-burn tools (redact,
 *  annotate) return `objects` to DROP the marks they just baked into pixels;
 *  omitting it preserves the current objects (valid in fraction space). */
export type DocTransform = (
  doc: CanvasDoc,
) => Promise<{ bytes: Uint8Array; label: string; objects?: CanvasObject[] }>;

/** The active tool's primary "apply" action, surfaced to the mobile sheet's
 *  global ✓. `ready` is false when that apply is currently disabled (no input
 *  yet, or a transform is running) so the ✓ can grey out — matching the
 *  desktop Apply button's disabled state. Tools with no single primary apply
 *  (deferred Redact/Erase, multi-action OCR/Attachments) register nothing, so
 *  the ✓ stays enabled and simply closes the tool. */
export interface PendingApply {
  run: () => void | Promise<void>;
  ready: boolean;
}

interface ActionsValue {
  loadFile: (file: File) => Promise<void>;
  setActiveTool: (id: string | null) => void;
  patchToolState: (toolId: string, partial: Record<string, unknown>) => void;
  setView: (v: ViewState | ((prev: ViewState) => ViewState)) => void;
  setViewMode: (m: ViewMode) => void;
  setSelectedPage: (i: number) => void;
  /** Apply a byte transform under the busy spinner, re-render pages, commit. */
  applyTransform: (t: DocTransform) => Promise<void>;
  /** Append an overlay object and push one history entry; returns its
   *  freshly-minted id so callers can immediately select it (arm-once). */
  addObject: (obj: Omit<CanvasObject, "id">) => string;
  /** Add many overlay objects in a single history entry (e.g. PII auto-detect).
   *  Returns the minted ids, in order. */
  addObjects: (objs: Omit<CanvasObject, "id">[], label?: string) => string[];
  /** Merge `patch` into the live doc WITHOUT pushing history — for live drag /
   *  in-flight edits the caller commits separately. */
  updateObject: (id: string, patch: Partial<CanvasObject>) => void;
  /** Merge `patch` into one object AND push a single undoable history entry.
   *  Use for a finished move/edit; `updateObject` (no history) is for the
   *  in-flight preview. */
  moveObject: (id: string, patch: Partial<CanvasObject>, label: string) => void;
  removeObject: (id: string) => void;
  /** Remove many objects in a single undoable history entry (e.g. "Clear all"
   *  pending redaction / erase marks). */
  removeObjects: (ids: string[], label?: string) => void;
  commit: (label: string) => void;
  undo: () => void;
  redo: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
  registerPendingApply: (action: PendingApply | null) => void;
  flushPendingApply: () => Promise<void>;
  cancelCurrentTool: () => Promise<void>;
  /** Run an async task under the busy spinner WITHOUT committing to history
   *  (export, contact-sheet, etc. don't mutate the doc). The task receives a
   *  `setLabel` updater so long jobs (e.g. on-device OCR during Text/Markdown
   *  export) can report determinate progress ("Recognising page X / Y…") in the
   *  same overlay; callers that don't need it just ignore the argument. */
  runTask: (
    label: string,
    fn: (setLabel: (label: string) => void) => void | Promise<void>,
  ) => Promise<void>;
  /** Restore the draft offered for the just-loaded file (the banner's action). */
  restoreDraft: () => Promise<void>;
  /** Discard the offered draft and keep the freshly-loaded original. */
  dismissDraft: () => void;
  /** Dismiss the error banner. */
  clearError: () => void;
  exit: () => void;
}

interface ReadValue {
  doc: CanvasDoc | null;
  loading: boolean;
  busyLabel: string | null;
  error: string | null;
  /** The dropped PDF is password-protected; the shell shows the unlock notice. */
  encryptedFile: File | null;
  viewMode: ViewMode;
  selectedPage: number;
  layout: Layout;
  canUndo: boolean;
  canRedo: boolean;
  canReset: boolean;
  canCancelCurrentTool: boolean;
  /** The active tool's primary apply (or null). The mobile sheet's ✓ greys out
   *  when this is present but `ready` is false. */
  pendingApply: PendingApply | null;
  /** Bumps on every history mutation so consumers re-derive from the doc. */
  historyVersion: number;
  /** Unsaved edits recovered for the just-loaded file, pending the user's
   *  Restore / Discard choice (null when none). */
  pendingDraft: EditorDraft | null;
}

interface ToolStateValue {
  toolState: Record<string, Record<string, unknown>>;
}

const ActionsCtx = createContext<ActionsValue | null>(null);
const ReadCtx = createContext<ReadValue | null>(null);
const ToolStateCtx = createContext<ToolStateValue | null>(null);
const ActiveToolCtx = createContext<string | null>(null);
// View (zoom/pan/page grid) lives in its own context because it changes on
// every pan/zoom frame; isolating it keeps per-frame re-renders to the handful
// of consumers that actually paint the viewport (stage, top bar, page grids).
const ViewCtx = createContext<ViewState | null>(null);

interface ProviderProps {
  initialFile?: File | null;
  initialTool?: string | null;
  onExit: () => void;
  children: ReactNode;
}

export function EditorProvider({
  initialFile = null,
  initialTool = null,
  onExit,
  children,
}: ProviderProps) {
  const [doc, setDoc] = useState<CanvasDoc | null>(null);
  // Start in the loading state when the editor opens with a file (the only way
  // in, post-redesign) so the no-doc fallback never flashes before loadFile runs.
  const [loading, setLoading] = useState(initialFile != null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The dropped PDF turned out to be password-protected — pdf-lib/PDF.js can't
  // parse it, so we surface the PDF Password tool instead of a raw load error.
  const [encryptedFile, setEncryptedFile] = useState<File | null>(null);

  const [activeTool, setActiveToolState] = useState<string | null>(null);
  const [toolState, setToolState] = useState<Record<string, Record<string, unknown>>>({});
  const [view, setViewState] = useState<ViewState>(DEFAULT_VIEW);
  const [viewMode, setViewModeState] = useState<ViewMode>("focus");
  const [selectedPage, setSelectedPageState] = useState(0);
  const [historyVersion, setHistoryVersion] = useState(0);

  // Draft autosave: pendingDraft is offered after loading a file that has saved
  // edits from a previous session.
  const [pendingDraft, setPendingDraft] = useState<EditorDraft | null>(null);
  // SHA-256 of the ORIGINAL loaded bytes — the draft key, stable across byte
  // transforms; null suspends autosave (no file, or hashing in flight).
  const draftKeyRef = useRef<string | null>(null);
  const pendingDraftRef = useRef<EditorDraft | null>(null);
  pendingDraftRef.current = pendingDraft;

  const [layout, setLayout] = useState<Layout>(() =>
    typeof window === "undefined" ? "desktop" : detectLayout(window.innerWidth, window.innerHeight),
  );
  useEffect(() => {
    const onResize = () => setLayout(detectLayout(window.innerWidth, window.innerHeight));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Latch the live doc so the (stable-identity) actions below always read the
  // freshest value without re-creating their closures. Mirrors CloakIMG's
  // docRef / undoRef pattern.
  const docRef = useRef<CanvasDoc | null>(null);
  docRef.current = doc;

  const historyRef = useRef(new EditorHistory());
  const pendingApplyRef = useRef<PendingApply | null>(null);
  const [pendingApplyVersion, setPendingApplyVersion] = useState(0);
  const toolCheckpointRef = useRef(0);

  // Revoke every thumbnail the editor still holds — across ALL history entries
  // (redo branches included) plus the live doc, not just the currently-visible
  // page set. The old teardown only freed the live doc's thumbs, leaking any
  // held by non-current entries (e.g. a redo branch after an undo).
  const revokeAllThumbs = useCallback(() => {
    const urls = new Set(historyRef.current.thumbUrls());
    for (const p of docRef.current?.pages ?? []) if (p.thumbUrl) urls.add(p.thumbUrl);
    revokeThumbnails([...urls]);
  }, []);

  // A history entry's thumbnails stay alive as long as that entry — or one that
  // shares its `pages` array (overlay-only commits do) — is on the stack. When
  // entries drop off (redo-tail discard, cap-trim, clear), revoke only the URLs
  // no surviving entry references. This replaces the old "revoke on every
  // transform" path, which freed blob URLs the prior undo target still pointed
  // at, so Undo restored a state with dead previews.
  useEffect(() => {
    const history = historyRef.current;
    history.setOnEvict((evicted) => {
      const survivors = new Set(history.thumbUrls());
      const dead: string[] = [];
      for (const e of evicted)
        for (const p of e.pages)
          if (p.thumbUrl && !survivors.has(p.thumbUrl)) dead.push(p.thumbUrl);
      if (dead.length > 0) revokeThumbnails(dead);
    });
  }, []);

  // Revoke everything on unmount so previews never leak across sessions.
  useEffect(() => {
    return () => revokeAllThumbs();
  }, [revokeAllThumbs]);

  const runBusy = useCallback(
    (
      label: string,
      fn: (setLabel: (label: string) => void) => void | Promise<void>,
    ): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        setError(null); // clear any stale error from a prior operation
        setBusyLabel(label);
        requestAnimationFrame(() => {
          requestAnimationFrame(async () => {
            try {
              // Hand the task setBusyLabel so it can refine the overlay text mid-run.
              await fn(setBusyLabel);
              resolve();
            } catch (e) {
              // Surface the failure in the editor's error banner. Every byte
              // transform (Apply) and background task (Export, draft restore)
              // funnels through here, so this is the one place to wire failure
              // feedback — without it a thrown transform/export just made the
              // spinner vanish with no diagnosis. Still reject so success-only
              // `.then` chains (e.g. OCR "make searchable" clearing its preview)
              // correctly skip on failure.
              setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
              reject(e);
            } finally {
              setBusyLabel(null);
            }
          });
        });
      });
    },
    [],
  );

  /** Set a brand-new doc as the base of a fresh history timeline. */
  const installDoc = useCallback((next: CanvasDoc) => {
    // The outgoing doc + its whole timeline are torn down by history.clear()
    // below: its evict sink frees every thumbnail URL no surviving entry holds.
    setDoc(next);
    setSelectedPageState(0);
    setViewState(DEFAULT_VIEW);
    setToolState({});
    historyRef.current.clear();
    historyRef.current.push({
      label: "Open",
      bytes: next.bytes,
      pages: next.pages,
      objects: next.objects,
    });
    toolCheckpointRef.current = historyRef.current.index();
    setHistoryVersion((v) => v + 1);
  }, []);

  // After installing a freshly-loaded file, key the autosave to its original
  // bytes and offer back any saved edits for that same file.
  const detectDraft = useCallback(async (next: CanvasDoc) => {
    try {
      const key = await hashDocBytes(next.bytes);
      draftKeyRef.current = key;
      const existing = await loadDraft(key);
      if (existing) setPendingDraft(existing);
    } catch {
      // IndexedDB / SubtleCrypto unavailable — autosave silently disabled.
    }
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      setEncryptedFile(null);
      setPendingDraft(null);
      draftKeyRef.current = null; // suspend autosave until re-keyed for this file
      try {
        const next = await createDocFromFile(file);
        installDoc(next);
        void detectDraft(next);
      } catch (e) {
        // pdf-lib throws an "is encrypted" error for password-protected PDFs.
        // Re-check and route the user to the PDF Password tool instead of
        // surfacing the raw error (mirrors usePdfFile's gate for standalone
        // tools). `.catch` guards a genuinely corrupt file failing the recheck.
        if (await isPdfEncrypted(file).catch(() => false)) {
          setEncryptedFile(file);
        } else {
          setError(e instanceof Error ? e.message : "Could not open this PDF.");
        }
      } finally {
        setLoading(false);
      }
    },
    [installDoc, detectDraft],
  );

  // Load the file the editor was opened with (if any), once.
  const initialLoadedRef = useRef(false);
  useEffect(() => {
    if (initialLoadedRef.current) return;
    if (!initialFile) return;
    initialLoadedRef.current = true;
    void loadFile(initialFile);
  }, [initialFile, loadFile]);

  /** Commit a new doc state to history and make it live. */
  const commitDoc = useCallback((next: CanvasDoc, label: string) => {
    setDoc(next);
    historyRef.current.push({
      label,
      bytes: next.bytes,
      pages: next.pages,
      objects: next.objects,
    });
    toolCheckpointRef.current = historyRef.current.index();
    setHistoryVersion((v) => v + 1);
  }, []);

  const commit = useCallback(
    (label: string) => {
      const cur = docRef.current;
      if (!cur) return;
      commitDoc(cur, label);
    },
    [commitDoc],
  );

  const restoreEntry = useCallback(() => {
    const entry = historyRef.current.current();
    const cur = docRef.current;
    if (!entry || !cur) return;
    setDoc({ ...cur, bytes: entry.bytes, pages: entry.pages, objects: entry.objects });
    setHistoryVersion((v) => v + 1);
  }, []);

  const undo = useCallback(() => {
    if (!historyRef.current.undo()) return;
    restoreEntry();
  }, [restoreEntry]);

  const redo = useCallback(() => {
    if (!historyRef.current.redo()) return;
    restoreEntry();
  }, [restoreEntry]);

  const jumpTo = useCallback(
    (index: number) => {
      historyRef.current.jumpTo(index);
      restoreEntry();
    },
    [restoreEntry],
  );

  // Hard reset: discard ALL edits and wipe the timeline, so undo/redo have
  // nothing left to restore. (jumpTo(0) used to keep the redo tail, letting the
  // user step right back into the edits they just cleared.)
  const reset = useCallback(() => {
    const base = historyRef.current.resetToBase();
    const cur = docRef.current;
    if (!base || !cur) return;
    setDoc({ ...cur, bytes: base.bytes, pages: base.pages, objects: base.objects });
    toolCheckpointRef.current = historyRef.current.index();
    setHistoryVersion((v) => v + 1);
  }, []);

  const setActiveTool = useCallback((id: string | null) => {
    setActiveToolState(id);
    toolCheckpointRef.current = historyRef.current.index();
  }, []);

  const patchToolState = useCallback((toolId: string, partial: Record<string, unknown>) => {
    setToolState((prev) => ({ ...prev, [toolId]: { ...prev[toolId], ...partial } }));
  }, []);

  const setView = useCallback((v: ViewState | ((prev: ViewState) => ViewState)) => {
    setViewState((prev) => (typeof v === "function" ? v(prev) : v));
  }, []);
  const setViewMode = useCallback((m: ViewMode) => setViewModeState(m), []);
  const setSelectedPage = useCallback((i: number) => setSelectedPageState(i), []);

  // Preselect the tool the editor was opened with (a home card routed here),
  // once. Mirrors the rail's click behaviour — set the active tool and the view
  // mode it drives. Independent of the file load: the tool stays active through
  // the dropzone until a PDF arrives.
  const initialToolLoadedRef = useRef(false);
  useEffect(() => {
    if (initialToolLoadedRef.current || !initialTool) return;
    initialToolLoadedRef.current = true;
    setActiveTool(initialTool);
    const t = findEditorTool(initialTool);
    if (t?.mode === "focus") setViewModeState("focus");
    else if (t?.mode === "overview") setViewModeState("overview");
  }, [initialTool, setActiveTool]);

  const addObject = useCallback((obj: Omit<CanvasObject, "id">): string => {
    const cur = docRef.current;
    if (!cur) return "";
    const full: CanvasObject = { ...obj, id: nextId(obj.kind) };
    const next: CanvasDoc = { ...cur, objects: [...cur.objects, full] };
    setDoc(next);
    historyRef.current.push({
      label: `Add ${obj.kind}`,
      bytes: next.bytes,
      pages: next.pages,
      objects: next.objects,
    });
    setHistoryVersion((v) => v + 1);
    return full.id;
  }, []);

  const addObjects = useCallback((objs: Omit<CanvasObject, "id">[], label?: string): string[] => {
    const cur = docRef.current;
    if (!cur || objs.length === 0) return [];
    const full = objs.map((o) => ({ ...o, id: nextId(o.kind) }));
    const next: CanvasDoc = { ...cur, objects: [...cur.objects, ...full] };
    setDoc(next);
    historyRef.current.push({
      label: label ?? `Add ${objs.length} objects`,
      bytes: next.bytes,
      pages: next.pages,
      objects: next.objects,
    });
    setHistoryVersion((v) => v + 1);
    return full.map((o) => o.id);
  }, []);

  const updateObject = useCallback((id: string, patch: Partial<CanvasObject>) => {
    const cur = docRef.current;
    if (!cur) return;
    setDoc({
      ...cur,
      objects: cur.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  }, []);

  // Like updateObject, but pushes ONE history entry so a finished move/edit is a
  // single undoable step. (Mirrors removeObject's snapshot; the live preview the
  // caller paints between pointerdown and pointerup never touches the doc.)
  const moveObject = useCallback((id: string, patch: Partial<CanvasObject>, label: string) => {
    const cur = docRef.current;
    if (!cur) return;
    const next: CanvasDoc = {
      ...cur,
      objects: cur.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    };
    setDoc(next);
    historyRef.current.push({
      label,
      bytes: next.bytes,
      pages: next.pages,
      objects: next.objects,
    });
    setHistoryVersion((v) => v + 1);
  }, []);

  const removeObject = useCallback((id: string) => {
    const cur = docRef.current;
    if (!cur) return;
    const next: CanvasDoc = { ...cur, objects: cur.objects.filter((o) => o.id !== id) };
    setDoc(next);
    historyRef.current.push({
      label: "Remove object",
      bytes: next.bytes,
      pages: next.pages,
      objects: next.objects,
    });
    setHistoryVersion((v) => v + 1);
  }, []);

  // Remove many objects in ONE history entry — e.g. "Clear all" of the pending
  // redaction / erase marks, so undo restores them in a single step.
  const removeObjects = useCallback((ids: string[], label?: string) => {
    const cur = docRef.current;
    if (!cur || ids.length === 0) return;
    const drop = new Set(ids);
    const next: CanvasDoc = { ...cur, objects: cur.objects.filter((o) => !drop.has(o.id)) };
    setDoc(next);
    historyRef.current.push({
      label: label ?? `Remove ${ids.length} objects`,
      bytes: next.bytes,
      pages: next.pages,
      objects: next.objects,
    });
    setHistoryVersion((v) => v + 1);
  }, []);

  const applyTransform = useCallback(
    async (t: DocTransform) => {
      const cur = docRef.current;
      if (!cur) return;
      await runBusy("Applying…", async () => {
        // Burn any pending destructive marks (redaction / erase) FIRST, so they
        // land on the geometry they were drawn on before this transform changes
        // the bytes or page structure. Redact/erase themselves never call
        // applyTransform (they only add overlay objects), so multiple rounds
        // stay non-destructive — the marks materialise here (a different edit)
        // or at export, never the moment a box is placed.
        let base = cur;
        if (hasPendingDestructive(cur)) {
          const burned = await flattenDestructiveObjects(cur);
          base = { ...cur, bytes: burned, objects: withoutDestructive(cur.objects) };
        }
        const { bytes, label, objects } = await t(base);
        // Re-derive page geometry + thumbnails from the new bytes. Keep the
        // objects the transform returned (used to drop just-burned marks), or
        // preserve the current ones (still valid in fraction space).
        const rebuilt = await createDocFromBytes(bytes, base.fileName);
        // Do NOT revoke cur's thumbnails here: the prior history entry (the undo
        // target) still references them. They're freed when that entry is
        // evicted from the stack — see history.setOnEvict above.
        commitDoc({ ...rebuilt, id: cur.id, objects: objects ?? base.objects }, label);
      });
    },
    [runBusy, commitDoc],
  );

  const registerPendingApply = useCallback((action: PendingApply | null) => {
    const prev = pendingApplyRef.current;
    pendingApplyRef.current = action;
    // Re-render only when PRESENCE or READINESS changes — that's all the mobile
    // ✓ keys off (greys out on !ready, enabled-to-close when nothing registered).
    const changed =
      (prev === null) !== (action === null) || (prev?.ready ?? false) !== (action?.ready ?? false);
    if (changed) setPendingApplyVersion((v) => v + 1);
  }, []);

  const flushPendingApply = useCallback(async () => {
    const action = pendingApplyRef.current;
    if (!action || !action.ready) return; // nothing to apply, or not ready yet
    pendingApplyRef.current = null;
    setPendingApplyVersion((v) => v + 1);
    await action.run();
  }, []);

  const cancelCurrentTool = useCallback(async () => {
    pendingApplyRef.current = null;
    setPendingApplyVersion((v) => v + 1);
    const checkpoint = toolCheckpointRef.current;
    while (historyRef.current.index() > checkpoint) {
      const before = historyRef.current.index();
      historyRef.current.undo();
      if (historyRef.current.index() === before) break;
    }
    restoreEntry();
    setActiveToolState(null);
  }, [restoreEntry]);

  const clearError = useCallback(() => setError(null), []);

  const exit = useCallback(() => {
    revokeAllThumbs();
    onExit();
  }, [onExit, revokeAllThumbs]);

  // ── Draft autosave: restore / discard ───────────────────────────────
  const applyDraft = useCallback(
    async (draft: EditorDraft) => {
      setPendingDraft(null);
      await runBusy("Restoring your edits…", async () => {
        const restored = await createDocFromBytes(draft.bytes, draft.fileName);
        restored.objects = draft.objects;
        draftKeyRef.current = draft.key; // keep the same original-bytes key
        installDoc(restored);
      });
    },
    [runBusy, installDoc],
  );

  const restoreDraft = useCallback(async () => {
    const draft = pendingDraftRef.current;
    if (draft) await applyDraft(draft);
  }, [applyDraft]);

  const dismissDraft = useCallback(() => {
    const draft = pendingDraftRef.current;
    setPendingDraft(null);
    if (draft) void deleteDraft(draft.key);
  }, []);

  // Persist the live document, debounced, whenever it carries real edits — so
  // an accidental unmount / tab-close doesn't destroy unsaved overlay work.
  useEffect(() => {
    const key = draftKeyRef.current;
    if (!key || !doc) return;
    if (historyRef.current.index() <= 0) return; // pristine — nothing to save yet
    // Privacy guard: while redaction / erase marks are pending, the original
    // text is still present in `bytes` (the burn is deferred to export). Do NOT
    // persist that to IndexedDB — a draft that looks redacted but isn't would
    // leak. Autosave resumes once the marks are flattened (export / next edit).
    if (hasPendingDestructive(doc)) return;
    const id = setTimeout(() => {
      void saveDraft({
        key,
        fileName: doc.fileName,
        bytes: doc.bytes,
        objects: doc.objects,
        savedAt: Date.now(),
      });
    }, 800);
    return () => clearTimeout(id);
  }, [doc, historyVersion]);

  const actions = useMemo<ActionsValue>(
    () => ({
      loadFile,
      setActiveTool,
      patchToolState,
      setView,
      setViewMode,
      setSelectedPage,
      applyTransform,
      addObject,
      addObjects,
      updateObject,
      moveObject,
      removeObject,
      removeObjects,
      commit,
      undo,
      redo,
      jumpTo,
      reset,
      registerPendingApply,
      flushPendingApply,
      cancelCurrentTool,
      runTask: runBusy,
      restoreDraft,
      dismissDraft,
      clearError,
      exit,
    }),
    [
      loadFile,
      setActiveTool,
      patchToolState,
      setView,
      setViewMode,
      setSelectedPage,
      applyTransform,
      addObject,
      addObjects,
      updateObject,
      moveObject,
      removeObject,
      removeObjects,
      commit,
      undo,
      redo,
      jumpTo,
      reset,
      registerPendingApply,
      flushPendingApply,
      cancelCurrentTool,
      runBusy,
      restoreDraft,
      dismissDraft,
      clearError,
      exit,
    ],
  );

  const readValue = useMemo<ReadValue>(
    () => ({
      doc,
      loading,
      busyLabel,
      error,
      encryptedFile,
      viewMode,
      selectedPage,
      layout,
      canUndo: historyVersion >= 0 && historyRef.current.canUndo(),
      canRedo: historyVersion >= 0 && historyRef.current.canRedo(),
      canReset: historyVersion >= 0 && historyRef.current.index() > 0,
      canCancelCurrentTool:
        activeTool !== null &&
        pendingApplyVersion >= 0 &&
        (pendingApplyRef.current !== null ||
          historyRef.current.index() > toolCheckpointRef.current),
      // Read fresh on every pendingApplyVersion bump (registration/readiness change).
      pendingApply: pendingApplyVersion >= 0 ? pendingApplyRef.current : null,
      historyVersion,
      pendingDraft,
    }),
    [
      doc,
      loading,
      busyLabel,
      error,
      encryptedFile,
      viewMode,
      selectedPage,
      layout,
      historyVersion,
      activeTool,
      pendingApplyVersion,
      pendingDraft,
    ],
  );

  const toolStateValue = useMemo<ToolStateValue>(() => ({ toolState }), [toolState]);

  return (
    <ActionsCtx.Provider value={actions}>
      <ToolStateCtx.Provider value={toolStateValue}>
        <ActiveToolCtx.Provider value={activeTool}>
          <ViewCtx.Provider value={view}>
            <ReadCtx.Provider value={readValue}>{children}</ReadCtx.Provider>
          </ViewCtx.Provider>
        </ActiveToolCtx.Provider>
      </ToolStateCtx.Provider>
    </ActionsCtx.Provider>
  );
}

export function useEditorActions(): ActionsValue {
  const v = useContext(ActionsCtx);
  if (!v) throw new Error("useEditorActions must be used inside <EditorProvider />");
  return v;
}

export function useEditorRead(): ReadValue {
  const v = useContext(ReadCtx);
  if (!v) throw new Error("useEditorRead must be used inside <EditorProvider />");
  return v;
}

export function useActiveTool(): string | null {
  return useContext(ActiveToolCtx);
}

/** The zoom/pan/page-grid view state. Separate from useEditorRead() so a
 *  per-frame pan/zoom only re-renders the stage / top bar / page grids, not
 *  every ReadCtx consumer. */
export function useEditorView(): ViewState {
  const v = useContext(ViewCtx);
  if (!v) throw new Error("useEditorView must be used inside <EditorProvider />");
  return v;
}

/** The namespaced option slice for one tool (empty object if unset). */
export function useToolSlice(toolId: string): Record<string, unknown> {
  const v = useContext(ToolStateCtx);
  if (!v) throw new Error("useToolSlice must be used inside <EditorProvider />");
  return v.toolState[toolId] ?? {};
}
