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
import { LoadingState } from "../components/LoadingState.tsx";
import { ProgressBar } from "../components/ProgressBar.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { useActiveTool, useEditorActions, useEditorRead, useToolSlice } from "./EditorContext.tsx";
import { EditorToolStage } from "./EditorToolStage.tsx";
import { EditorTopBar } from "./EditorTopBar.tsx";
import { MobileEditorSurface } from "./MobileEditorSurface.tsx";
import { OverviewMode } from "./OverviewMode.tsx";
import { PreviewRecovery } from "./PreviewRecovery.tsx";
import { PdfStage } from "./PdfStage.tsx";
import { PropertiesPanel } from "./PropertiesPanel.tsx";
import { ToolRail } from "./ToolRail.tsx";
import { OCR_ID, OcrPreview, ocrHasPreview } from "./panels/OcrTool.tsx";

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
    opening,
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

  // An editor transform is a blocking state, even though it is not a
  // dismissible dialog. Move focus to its status surface while the editor is
  // inert, then restore the initiating control. Removed rows can nominate a
  // surviving action; closed dialogs fall back to Export.
  useEffect(() => {
    if (busyLabel) {
      if (!wasBusyRef.current) {
        busyRestoreRef.current =
          document.activeElement instanceof HTMLElement && document.activeElement !== document.body
            ? document.activeElement
            : null;
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
      const target =
        restore?.isConnected && !restore.hasAttribute("disabled")
          ? restore
          : (document.querySelector<HTMLElement>("[data-busy-focus-fallback]") ??
            document.querySelector<HTMLElement>('button[aria-label="Export"]'));
      target?.focus();
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
      if (busyLabel || !(e.metaKey || e.ctrlKey) || e.altKey) return;
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
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
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
  }, [doc, busyLabel, canUndo, canRedo, undo, redo, paletteOpen]);

  // OCR's side-by-side preview takes over the center once an extraction exists
  // for the current doc, regardless of focus/overview; otherwise the normal
  // stage / page grid. On mobile it fills the canvas half above the tool sheet —
  // the text/source switch preserves the available height on narrow screens.
  const showOcrPreview = activeTool === OCR_ID && ocrHasPreview(ocrSlice, doc);
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
      className="fixed inset-0 z-[var(--air-z-editor)] flex flex-col overflow-hidden bg-[var(--air-surface-soft)] font-sans text-[var(--air-ink)]"
      aria-label="PDF editor"
      aria-busy={busyLabel ? true : undefined}
      inert={busyLabel ? true : undefined}
    >
      <h1 className="sr-only">CloakPDF editor</h1>
      <EditorTopBar />

      {doc && !opening && (error || pendingDraft) && (
        <div className="editor-notices" aria-label="Document notices" role="region" tabIndex={0}>
          {error && (
            <div className="editor-notice" data-tone="danger">
              <AlertTriangle size={18} aria-hidden="true" />
              <div role="alert">
                <strong>That action couldn't finish</strong>
                <p>{error}</p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  if (event.currentTarget === document.activeElement)
                    document
                      .querySelector<HTMLButtonElement>('button[aria-label="Export"]')
                      ?.focus();
                  clearError();
                }}
                aria-label="Dismiss error"
                className="air-icon-button air-button--quiet"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          )}
          {pendingDraft && (
            <div className="editor-notice">
              <History size={18} aria-hidden="true" />
              <div role="status">
                <strong>Saved edits available</strong>
                <p>
                  Restore your previous session from this browser, or discard it to keep the
                  original.
                </p>
              </div>
              <div className="editor-notice__actions">
                <button
                  type="button"
                  onClick={() =>
                    void restoreDraft().catch(() => {
                      /* The error notice owns feedback. */
                    })
                  }
                  className="air-button air-button--primary"
                >
                  Restore edits
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    if (event.currentTarget === document.activeElement)
                      document
                        .querySelector<HTMLButtonElement>('button[aria-label="Export"]')
                        ?.focus();
                    dismissDraft();
                  }}
                  className="air-button"
                  aria-label="Discard saved edits"
                >
                  Discard edits
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {opening ? (
        <section className="editor-opening" aria-label="Opening PDF">
          <div className="editor-opening__body">
            <p className="air-page-eyebrow">On your device</p>
            <h2>Opening your PDF</h2>
            <p className="editor-opening__file">{opening.fileName}</p>
            <LoadingState label={opening.total ? "Preparing page previews…" : "Reading PDF…"} />
            {opening.total > 0 && (
              <ProgressBar current={opening.rendered} total={opening.total} label="Page previews" />
            )}
            <p className="air-help">Your document stays in this browser.</p>
            <button type="button" className="air-button" onClick={exit}>
              Back to toolkit
            </button>
          </div>
        </section>
      ) : encryptedFile ? (
        // Password-protected drop — point the user at the one tool that can
        // strip the password, then come back. No dropzone fallback: the editor
        // is only ever entered with a file from the home page.
        <div className="editor-opening">
          <div className="m-auto w-full max-w-xl">
            <EncryptedPdfNotice file={encryptedFile} onChangeFile={exit} />
          </div>
        </div>
      ) : !doc ? (
        // Landing search can deep-link to an editor tool before a PDF exists.
        // Keep that intent selected and acquire the file here instead of
        // routing to a dead-end empty shell.
        <div className="editor-opening">
          <div className="editor-opening__body editor-intake">
            <p className="air-page-eyebrow">On your device</p>
            <h2>{error ? "Choose another PDF" : "Open a PDF to continue"}</h2>
            <p className="air-help">
              {error
                ? "Your selected tool will stay ready. The next file opens here, on your device."
                : "Your selected editor tool is ready. Open a document to get started."}
            </p>
            {error && (
              <p className="editor-intake-error" role="alert" tabIndex={0}>
                This file couldn't be read. Check that it's a valid PDF and try again.
              </p>
            )}
            <FileDropZone
              accept="application/pdf,.pdf"
              onFiles={(files) => files[0] && void loadFile(files[0])}
              label="Drop a PDF here"
              hint="One PDF · processed entirely on this device"
            />
            <button type="button" onClick={exit} className="air-button">
              Back to toolkit
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          {!isMobile && <ToolRail onOpenPalette={openPalette} />}

          <div className="flex min-w-0 flex-1 flex-col">
            <PreviewRecovery />
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{center}</div>
              {isMobile && <MobileEditorSurface />}
            </div>
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
            className="editor-busy"
            role="group"
            aria-label={busyLabel}
            tabIndex={-1}
          >
            <div className="editor-busy__body">
              <p className="air-page-eyebrow">Working on your device</p>
              <LoadingState label={busyLabel} />
            </div>
          </div>,
          document.body,
        )}
    </main>
  );
}
