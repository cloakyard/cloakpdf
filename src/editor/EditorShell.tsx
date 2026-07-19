// EditorShell.tsx — Arranges the editor chrome around the center stage and
// switches between the desktop/tablet three-pane layout and the mobile
// canvas-dominant layout, mirroring CloakIMG's UnifiedEditor shell. Also owns
// the loading state, the no-doc intake (used by landing-search deep links),
// encrypted/open-failure handling, the busy overlay, and the error banner.
// `min-h-0` / `min-w-0` on the growth axes is load-bearing.

import { AlertTriangle, History, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CommandPalette } from "./CommandPalette.tsx";
import { EncryptedPdfNotice } from "../components/EncryptedPdfNotice.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { useActiveTool, useEditorActions, useEditorRead, useToolSlice } from "./EditorContext.tsx";
import { EditorToolStage } from "./EditorToolStage.tsx";
import { EditorTopBar } from "./EditorTopBar.tsx";
import { MobileEditorSurface } from "./MobileEditorSurface.tsx";
import { OverviewMode } from "./OverviewMode.tsx";
import { PdfStage } from "./PdfStage.tsx";
import { PropertiesPanel } from "./PropertiesPanel.tsx";
import { ToolRail } from "./ToolRail.tsx";
import { OCR_ID, OcrPreview, ocrHasPreview } from "./panels/OcrTool.tsx";

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
      <div
        className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600"
        aria-hidden="true"
      />
      <p className="font-mono text-sm text-slate-500 dark:text-dark-text-muted">{label}</p>
    </div>
  );
}

/** True when the keystroke landed in a text field — let native text undo/redo
 *  win there rather than hijacking it for document history. */
function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export function EditorShell() {
  const {
    doc,
    loading,
    busyLabel,
    error,
    encryptedFile,
    layout,
    viewMode,
    pendingDraft,
    canUndo,
    canRedo,
  } = useEditorRead();
  const { loadFile, restoreDraft, dismissDraft, clearError, exit, undo, redo } = useEditorActions();
  const activeTool = useActiveTool();
  const ocrSlice = useToolSlice(OCR_ID);
  const isMobile = layout === "mobile";
  const isTablet = layout === "tablet";
  const [paletteOpen, setPaletteOpen] = useState(false);
  const busyOverlayRef = useRef<HTMLDivElement>(null);
  const busyRestoreRef = useRef<HTMLElement | null>(null);
  const wasBusyRef = useRef(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);

  // A local transform/export is a blocking state, even though it is not a
  // dismissible dialog. Move focus to its status surface while the editor is
  // inert, then return to the Export trigger once the operation settles.
  useEffect(() => {
    if (busyLabel) {
      if (!wasBusyRef.current) {
        busyRestoreRef.current =
          document.querySelector<HTMLElement>('button[aria-label="Export"]') ??
          (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      }
      wasBusyRef.current = true;
      const frame = requestAnimationFrame(() => busyOverlayRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
    if (!wasBusyRef.current) return;
    wasBusyRef.current = false;
    const restore = busyRestoreRef.current;
    busyRestoreRef.current = null;
    const frame = requestAnimationFrame(() => {
      if (restore?.isConnected && !restore.hasAttribute("disabled")) restore.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [busyLabel]);

  // Editor-level keyboard shortcuts. ⌘/Ctrl-K toggles the command palette (any
  // focus); ⌘/Ctrl-Z and ⌘/Ctrl-(Shift-)Z / ⌘/Ctrl-Y drive document undo/redo,
  // but only when not typing in a field — there native text history must win.
  // Only armed once a doc is open; per-tool handlers (Escape/Delete) are
  // untouched since none of them bind ⌘-Z/K.
  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "k") {
        // Never stack Command Palette over Export (or another modal). A second
        // focus trap would make both dialogs compete for Tab/Escape ownership.
        // When the palette itself is open, the same shortcut still toggles it.
        if (!paletteOpen && document.querySelector('[role="dialog"][aria-modal="true"]')) return;
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (isEditableTarget(e.target)) return;
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else if (canUndo) {
          undo();
        }
      } else if (key === "y") {
        e.preventDefault();
        if (canRedo) redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, canUndo, canRedo, undo, redo, paletteOpen]);

  // OCR's side-by-side preview takes over the center once an extraction exists
  // for the current doc, regardless of focus/overview; otherwise the normal
  // stage / page grid. On mobile it fills the canvas half above the tool sheet —
  // the recognised-text/page panels stack under that width.
  const showOcrPreview = activeTool === OCR_ID && ocrHasPreview(ocrSlice, doc?.id);
  const center = showOcrPreview ? (
    <OcrPreview />
  ) : viewMode === "overview" ? (
    <OverviewMode />
  ) : (
    <>
      <PdfStage />
      <EditorToolStage />
    </>
  );

  return (
    <main
      className="fixed inset-0 z-[var(--z-editor)] flex flex-col overflow-hidden bg-[var(--color-paper-2)] font-sans text-[var(--color-ink)]"
      aria-label="PDF editor"
      aria-busy={busyLabel ? true : undefined}
      inert={busyLabel ? true : undefined}
    >
      <h1 className="sr-only">CloakPDF editor</h1>
      <EditorTopBar />

      {doc && error && (
        <div
          role="alert"
          className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">{error}</span>
          <button
            type="button"
            onClick={clearError}
            aria-label="Dismiss error"
            className="shrink-0 rounded-md p-1 hover:bg-red-100 pointer-coarse:min-h-11 pointer-coarse:min-w-11 dark:hover:bg-red-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {doc && pendingDraft && (
        <div className="flex items-center gap-3 border-b border-primary-200 bg-primary-50 px-4 py-2 text-sm text-primary-800 dark:border-primary-900/50 dark:bg-primary-900/30 dark:text-primary-200">
          <History className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">
            Found unsaved edits for this file from a previous session.
          </span>
          <button
            type="button"
            onClick={() => void restoreDraft()}
            className="shrink-0 rounded-md bg-primary-600 px-2.5 py-1 font-mono text-xs font-semibold text-white hover:bg-primary-700 pointer-coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Restore
          </button>
          <button
            type="button"
            onClick={dismissDraft}
            className="shrink-0 rounded-md px-2.5 py-1 font-mono text-xs font-medium text-primary-700 hover:bg-primary-100 pointer-coarse:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-300 dark:hover:bg-primary-900/40"
          >
            Discard
          </button>
        </div>
      )}

      {loading ? (
        <Spinner label="Opening PDF…" />
      ) : encryptedFile ? (
        // Password-protected drop — point the user at the one tool that can
        // strip the password, then come back. No dropzone fallback: the editor
        // is only ever entered with a file from the home page.
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <div className="w-full max-w-xl">
            <EncryptedPdfNotice file={encryptedFile} onChangeFile={exit} />
          </div>
        </div>
      ) : !doc ? (
        // Landing search can deep-link to an editor tool before a PDF exists.
        // Keep that intent selected and acquire the file here instead of
        // routing to a dead-end empty shell.
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4 sm:p-8">
          <div className="w-full max-w-2xl border-y border-[var(--color-rule-strong)] bg-[var(--color-surface)] py-5 sm:py-7">
            <div className="mb-4 flex items-start justify-between gap-4 px-1">
              <div>
                <p className="cloak-mono-label text-primary-600">Workbench / local input</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[var(--color-ink)]">
                  {error ? "Choose another PDF" : "Open a PDF to continue"}
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--color-ink-3)]">
                  {error
                    ? "That file could not be opened. Try another PDF; your selected tool will stay ready."
                    : "Your selected editor tool is ready. The document opens locally and never leaves this browser."}
                </p>
              </div>
              {error && (
                <AlertTriangle
                  className="mt-1 h-5 w-5 shrink-0 text-[var(--color-danger)]"
                  aria-hidden="true"
                />
              )}
            </div>
            <FileDropZone
              accept="application/pdf,.pdf"
              onFiles={(files) => files[0] && void loadFile(files[0])}
              label="Drop a PDF here"
              hint="One PDF · processed entirely on this device"
            />
            <div className="mt-4 flex justify-start">
              <button
                type="button"
                onClick={exit}
                className="cloak-focus inline-flex min-h-11 items-center px-1 font-mono text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-3)] hover:text-primary-600"
              >
                Back to toolkit
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          {!isMobile && <ToolRail onOpenPalette={openPalette} />}

          <div className="flex min-w-0 flex-1 flex-col">
            {center}
            {isMobile && <MobileEditorSurface />}
          </div>

          {!isMobile && <PropertiesPanel collapsed={isTablet} />}
        </div>
      )}

      {doc && <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />}

      {/* Busy overlay is portaled to <body> at the system-overlay layer so a
          long-running op (export / render) always paints above the dialog layer.
          The editor <main> is its own stacking context, so an in-tree overlay would sit
          behind a modal whose close lagged the busy state by a frame. */}
      {busyLabel &&
        createPortal(
          <div
            ref={busyOverlayRef}
            className="fixed inset-0 z-[var(--z-system-overlay)] flex items-center justify-center bg-[var(--color-overlay)]"
            role="status"
            aria-busy="true"
            aria-live="polite"
            aria-label={busyLabel}
            tabIndex={-1}
          >
            <div className="flex w-[min(24rem,calc(100%_-_2rem))] items-center gap-3 border-y border-[var(--color-rule-strong)] bg-[var(--color-surface)] px-5 py-4 shadow-[var(--shadow-popover)]">
              <div
                className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-primary-600">
                  Processing / local
                </p>
                <p className="mt-0.5 text-card-desc font-medium text-[var(--color-ink)]">
                  {busyLabel}
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </main>
  );
}
