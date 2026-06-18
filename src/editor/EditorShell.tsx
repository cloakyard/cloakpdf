// EditorShell.tsx — Arranges the editor chrome around the center stage and
// switches between the desktop/tablet three-pane layout and the mobile
// canvas-dominant layout, mirroring CloakIMG's UnifiedEditor shell. Also owns
// the loading state, the no-doc fallback (encrypted-PDF notice / open-failure
// message — never a dropzone, since the editor is always entered with a file
// from home), the busy overlay, and the error banner. `min-h-0` / `min-w-0` on
// the growth axes is load-bearing.

import { AlertTriangle, History, X } from "lucide-react";
import { createPortal } from "react-dom";
import { EncryptedPdfNotice } from "../components/EncryptedPdfNotice.tsx";
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
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
      <p className="text-sm text-slate-500 dark:text-dark-text-muted">{label}</p>
    </div>
  );
}

export function EditorShell() {
  const { doc, loading, busyLabel, error, encryptedFile, layout, viewMode, pendingDraft } =
    useEditorRead();
  const { restoreDraft, dismissDraft, clearError, exit } = useEditorActions();
  const activeTool = useActiveTool();
  const ocrSlice = useToolSlice(OCR_ID);
  const isMobile = layout === "mobile";
  const isTablet = layout === "tablet";

  // OCR's side-by-side preview takes over the center once an extraction exists
  // for the current doc, regardless of focus/overview; otherwise the normal
  // stage / page grid. On mobile it fills the canvas area (≥60%) above the tool
  // sheet — the recognised-text/page panels stack under that width.
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
    <main className="fixed inset-0 z-100 flex flex-col overflow-hidden bg-slate-50 dark:bg-dark-bg font-sans text-slate-800 dark:text-dark-text">
      <EditorTopBar />

      {doc && error && (
        <div
          role="alert"
          className="flex items-center gap-2 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-300"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">{error}</span>
          <button
            type="button"
            onClick={clearError}
            aria-label="Dismiss error"
            className="shrink-0 rounded-md p-1 hover:bg-red-100 dark:hover:bg-red-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {doc && pendingDraft && (
        <div className="flex items-center gap-3 border-b border-primary-200 dark:border-primary-900/50 bg-primary-50 dark:bg-primary-900/30 px-4 py-2 text-sm text-primary-800 dark:text-primary-200">
          <History className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            Found unsaved edits for this file from a previous session.
          </span>
          <button
            type="button"
            onClick={() => void restoreDraft()}
            className="shrink-0 rounded-md bg-primary-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Restore
          </button>
          <button
            type="button"
            onClick={dismissDraft}
            className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 dark:text-primary-300 dark:hover:bg-primary-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
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
        // Open failed (corrupt file, etc.). The editor is always entered with a
        // file from home, so there is no dropzone here — just a way back.
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-slate-300 dark:text-dark-text-muted" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700 dark:text-dark-text">
              {error ? "Couldn't open this PDF" : "No PDF is open"}
            </p>
            {error && (
              <p className="max-w-md text-xs text-slate-500 dark:text-dark-text-muted">{error}</p>
            )}
          </div>
          <button
            type="button"
            onClick={exit}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Back to home
          </button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          {!isMobile && <ToolRail />}

          <div className="flex min-w-0 flex-1 flex-col">
            {center}
            {isMobile && <MobileEditorSurface />}
          </div>

          {!isMobile && <PropertiesPanel collapsed={isTablet} />}
        </div>
      )}

      {/* Busy overlay is portaled to <body> at z-250 so a long-running op (export
          / render) always paints ABOVE the export modal (z-200) — the editor
          <main> is a z-100 stacking context, so an in-tree overlay would sit
          behind a modal whose close lagged the busy state by a frame. */}
      {busyLabel &&
        createPortal(
          <div
            className="fixed inset-0 z-250 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm"
            aria-busy="true"
            aria-live="polite"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-dark-border bg-white/95 dark:bg-dark-surface/95 px-5 py-4 shadow-xl">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
              <span className="text-card-desc font-medium text-slate-700 dark:text-dark-text">
                {busyLabel}
              </span>
            </div>
          </div>,
          document.body,
        )}
    </main>
  );
}
