// Air document identity, history and view controls. Canvas state stays in the provider.
import {
  ChevronLeft,
  Grid2x2,
  Grid3x3,
  Maximize2,
  Redo2,
  RotateCcw,
  ShieldAlert,
  Square,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { PagePreviewNav } from "../components/PagePreviewNav.tsx";
import { EditorActionsMenu } from "./EditorActionsMenu.tsx";
import { countPendingDestructive } from "./doc.ts";
import { useEditorActions, useEditorRead, useEditorView } from "./EditorContext.tsx";
import { ExportButton } from "./ExportModal.tsx";
import { DEFAULT_VIEW } from "./types.ts";

const DENSITIES = [
  { cols: 1, icon: Square, label: "Single page" },
  { cols: 2, icon: Grid2x2, label: "2-column grid" },
  { cols: 3, icon: Grid3x3, label: "3-column grid" },
] as const;
const ICON = "air-icon-button air-button--quiet";

export function EditorTopBar() {
  const { doc, viewMode, selectedPage, canUndo, canRedo, canReset, layout } = useEditorRead();
  const view = useEditorView();
  const { exit, setViewMode, setView, setSelectedPage, undo, redo, reset } = useEditorActions();
  const isMobile = layout === "mobile";
  const isCompact = layout !== "desktop";
  const headerRef = useRef<HTMLElement>(null);
  const focusedControl = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const previous = focusedControl.current;
    if (previous && !previous.isConnected && document.activeElement === document.body) {
      const label = isCompact ? "More actions" : previous.getAttribute("aria-label");
      const target = [
        ...(headerRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []),
      ].find((button) => button.getAttribute("aria-label") === label);
      (
        target ?? headerRef.current?.querySelector<HTMLButtonElement>('[aria-label="Export"]')
      )?.focus();
    }
  }, [layout, isCompact]);
  const pendingMarks = countPendingDestructive(doc);
  const activeCols = Math.min(3, Math.max(1, viewMode === "focus" ? 1 : view.gridCols));

  return (
    <header
      ref={headerRef}
      onFocusCapture={(event) => {
        focusedControl.current = event.target as HTMLElement;
      }}
      className={`editor-topbar${isCompact ? " air-editor-header--compact" : ""}`}
      data-layout={layout}
    >
      <div className="editor-topbar__identity">
        {isCompact ? (
          <button
            type="button"
            className={`${ICON} editor-document-trigger`}
            onClick={exit}
            aria-label="Back to home"
            title="Back to home"
          >
            <img src="/cloakpdf-mark.svg" alt="" width="36" height="36" className="air-page-mark" />
            {pendingMarks > 0 && (
              <span
                className="editor-document-pending"
                data-testid="pending-marks"
                role="status"
                aria-label={`${pendingMarks} pending marks, applied when you export`}
              >
                {pendingMarks}
              </span>
            )}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={exit}
              className={ICON}
              aria-label="Back to home"
              title="Back to home"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <img src="/cloakpdf-mark.svg" alt="" width="36" height="36" className="air-page-mark" />
            <div className="editor-topbar__file">
              <span title={doc?.fileName}>{doc?.fileName ?? "CloakPDF"}</span>
            </div>
          </>
        )}
      </div>
      {doc && (
        <div className="editor-topbar__views" aria-label="Document view" role="group">
          {viewMode === "focus" && (
            <PagePreviewNav
              page={selectedPage}
              total={doc.pageCount}
              onChange={setSelectedPage}
              compact
            />
          )}
          {!isMobile && (
            <>
              {doc.pageCount > 1 && (
                <div className="editor-topbar__group" role="group" aria-label="Page layout">
                  {DENSITIES.map(({ cols, icon: Icon, label }) => (
                    <button
                      key={cols}
                      type="button"
                      onClick={() => {
                        if (cols > 1) setView((v) => ({ ...v, gridCols: cols }));
                        setViewMode(cols === 1 ? "focus" : "overview");
                      }}
                      aria-label={label}
                      aria-pressed={activeCols === cols}
                      title={label}
                      className={ICON}
                    >
                      <Icon aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
              {viewMode === "focus" && (
                <div className="editor-topbar__group" role="group" aria-label="Zoom">
                  <button
                    type="button"
                    onClick={() => setView((v) => ({ ...v, zoom: Math.max(0.2, v.zoom / 1.2) }))}
                    disabled={view.zoom <= 0.2}
                    className={ICON}
                    aria-label="Zoom out"
                  >
                    <ZoomOut aria-hidden="true" />
                  </button>
                  <span className="editor-topbar__value">{Math.round(view.zoom * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setView((v) => ({ ...v, zoom: Math.min(8, v.zoom * 1.2) }))}
                    disabled={view.zoom >= 8}
                    className={ICON}
                    aria-label="Zoom in"
                  >
                    <ZoomIn aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView((v) => ({ ...DEFAULT_VIEW, gridCols: v.gridCols }))}
                    className={ICON}
                    aria-label="Fit to screen"
                    title="Fit to screen"
                  >
                    <Maximize2 aria-hidden="true" />
                  </button>
                </div>
              )}
            </>
          )}
          {pendingMarks > 0 && !isCompact && (
            <span
              className="editor-pending-marks"
              data-testid="pending-marks"
              role="status"
              aria-label={`${pendingMarks} ${pendingMarks === 1 ? "mark" : "marks"} pending, applied when you export`}
              title="Redaction and erase marks are applied when you export"
            >
              <ShieldAlert aria-hidden="true" />
              {pendingMarks} pending
            </span>
          )}
        </div>
      )}
      <div className="editor-topbar__actions">
        {!isCompact && (
          <div className="editor-topbar__group" role="group" aria-label="Document history">
            <button
              type="button"
              onClick={(event) => {
                event.currentTarget.focus();
                if (canUndo) undo();
              }}
              aria-disabled={!canUndo}
              className={ICON}
              aria-label="Undo"
              title="Undo (⌘Z / Ctrl+Z)"
            >
              <Undo2 aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.currentTarget.focus();
                if (canRedo) redo();
              }}
              aria-disabled={!canRedo}
              className={ICON}
              aria-label="Redo"
              title="Redo (⌘⇧Z / Ctrl+Shift+Z)"
            >
              <Redo2 aria-hidden="true" />
            </button>
            {!isMobile && (
              <button
                type="button"
                onClick={(event) => {
                  event.currentTarget.focus();
                  if (canReset) reset();
                }}
                aria-disabled={!canReset}
                className={ICON}
                aria-label="Reset to original"
                title="Reset to original"
              >
                <RotateCcw aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <ExportButton />
        {isCompact && <EditorActionsMenu />}
      </div>
    </header>
  );
}
