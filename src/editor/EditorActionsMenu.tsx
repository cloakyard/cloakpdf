/** Compact commands share the family Actions sheet; document state stays mounted. */
import { MoreVertical, Redo2, RotateCcw, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState } from "react";
import { ModalCloseButton, ModalShell } from "../components/ModalShell.tsx";
import { countPendingDestructive } from "./doc.ts";
import { useEditorActions, useEditorRead, useEditorView } from "./EditorContext.tsx";
import { DEFAULT_VIEW } from "./types.ts";

export function EditorActionsMenu() {
  const [open, setOpen] = useState(false);
  const afterClose = useRef<(() => void) | undefined>(undefined);
  const { doc, canUndo, canRedo, canReset } = useEditorRead();
  const { undo, redo, reset, setView } = useEditorActions();
  const view = useEditorView();
  const pending = countPendingDestructive(doc);
  return (
    <>
      <button
        type="button"
        className="air-icon-button air-button--quiet"
        aria-label="More actions"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event) => {
          event.currentTarget.focus();
          setOpen(true);
        }}
      >
        <MoreVertical aria-hidden="true" />
      </button>
      <ModalShell
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="editor-actions-title"
        onAfterClose={() => {
          const action = afterClose.current;
          afterClose.current = undefined;
          action?.();
        }}
      >
        <header className="pdf-dialog__header">
          <h2 id="editor-actions-title" className="pdf-dialog__title">
            Actions
          </h2>
          <ModalCloseButton onClick={() => setOpen(false)} label="Close actions" />
        </header>
        <div className="air-scroll pdf-dialog__body air-editor-menu">
          <p className="air-editor-menu__context">{doc?.fileName ?? "No file loaded"}</p>
          {pending > 0 && (
            <p className="air-help">{pending} pending marks will be applied when you export.</p>
          )}
          <button
            type="button"
            className="air-button air-button--quiet air-editor-menu__item"
            aria-label="Undo"
            aria-disabled={!canUndo}
            onClick={(event) => {
              event.currentTarget.focus();
              if (canUndo) undo();
            }}
          >
            <Undo2 aria-hidden="true" /> Undo
          </button>
          <button
            type="button"
            className="air-button air-button--quiet air-editor-menu__item"
            aria-label="Redo"
            aria-disabled={!canRedo}
            onClick={(event) => {
              event.currentTarget.focus();
              if (canRedo) redo();
            }}
          >
            <Redo2 aria-hidden="true" /> Redo
          </button>
          <div className="air-editor-menu__zoom">
            <span>Zoom · {Math.round(view.zoom * 100)}%</span>
            <button
              type="button"
              className="air-icon-button air-button--quiet"
              aria-label="Zoom out"
              disabled={view.zoom <= 0.2}
              onClick={() => setView((v) => ({ ...v, zoom: Math.max(0.2, v.zoom / 1.2) }))}
            >
              <ZoomOut aria-hidden="true" />
            </button>
            <button
              type="button"
              className="air-icon-button air-button--quiet"
              aria-label="Zoom in"
              disabled={view.zoom >= 8}
              onClick={() => setView((v) => ({ ...v, zoom: Math.min(8, v.zoom * 1.2) }))}
            >
              <ZoomIn aria-hidden="true" />
            </button>
            <button
              type="button"
              className="air-button air-button--quiet"
              onClick={() => setView((v) => ({ ...DEFAULT_VIEW, gridCols: v.gridCols }))}
            >
              Fit
            </button>
          </div>
          <button
            type="button"
            className="air-button air-button--quiet air-editor-menu__item"
            disabled={!canReset}
            onClick={() => {
              afterClose.current = reset;
              setOpen(false);
            }}
          >
            <RotateCcw aria-hidden="true" /> Reset to original
          </button>
        </div>
      </ModalShell>
    </>
  );
}
