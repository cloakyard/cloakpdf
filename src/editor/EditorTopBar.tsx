// EditorTopBar.tsx — The editor's top chrome, laid out as three grid zones so
// the centre never drifts:
//   • left   — back, logo, file pill (desktop).
//   • centre — desktop/tablet: the canvas controls, each in its own bordered
//              pill so they read as peer groups — the page stepper (focus/single
//              view only), the page-density toggle (with a sliding indicator),
//              and the zoom group (focus only). Pinned to the true middle
//              (grid-cols-[1fr_auto_1fr]). mobile: the page stepper (centred).
//   • right  — undo/redo/(reset desktop), Export.
// On mobile the file pill, logo, density toggle and zoom buttons collapse (no
// room); view mode is driven by the tool you pick, and zoom is pinch-to-zoom.

import {
  ChevronLeft,
  ChevronRight,
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
import { PagePreviewNav } from "../components/PagePreviewNav.tsx";
import { countPendingDestructive } from "./doc.ts";
import { useEditorActions, useEditorRead, useEditorView } from "./EditorContext.tsx";
import { ExportButton } from "./ExportModal.tsx";
import { DEFAULT_VIEW } from "./types.ts";

// Page-density options for the view control: single page (focus, editable) vs
// a 2- or 3-column browse grid. The active icon reflects the current density.
const DENSITIES = [
  { cols: 1, icon: Square, label: "Single page" },
  { cols: 2, icon: Grid2x2, label: "2-column grid" },
  { cols: 3, icon: Grid3x3, label: "3-column grid" },
] as const;

// Width (px) of one segment in the density toggle — must match the SEG_BTN
// `w-8` (2rem) so the sliding indicator lands exactly under the active icon.
const SEG_W = 32;

const ICON_BTN =
  "flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-dark-text-muted dark:hover:bg-dark-surface-alt dark:hover:text-dark-text disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

// Segmented button shared by the centre cluster — the page stepper chevrons and
// the density/grid icons use the exact same shape so they read as one section.
const SEG_BTN =
  "flex h-7 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";
const SEG_IDLE =
  "text-slate-500 hover:text-slate-800 dark:text-dark-text-muted dark:hover:text-dark-text disabled:opacity-30 disabled:pointer-events-none";

// Smaller icon button for the centre zoom pill — h-7 to match the density pill.
const ZOOM_BTN =
  "flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-dark-text-muted dark:hover:bg-dark-surface-alt dark:hover:text-dark-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

export function EditorTopBar() {
  const { doc, viewMode, selectedPage, canUndo, canRedo, canReset, layout } = useEditorRead();
  const view = useEditorView();
  const { exit, setViewMode, setView, setSelectedPage, undo, redo, reset } = useEditorActions();
  const isMobile = layout === "mobile";
  const isDesktop = layout === "desktop";

  // Icon buttons get a 44px hit area on mobile (touch), keeping the dense 36px
  // glyph box on desktop where a mouse is precise and the bar is height-limited.
  const iconBtn = isMobile ? ICON_BTN.replace("h-9 w-9", "h-11 w-11") : ICON_BTN;

  // Redaction / erase marks are burned in at export, not at Apply — surface a
  // persistent count so the un-applied destructive state is visible no matter
  // which tool is active (or none).
  const pendingMarks = countPendingDestructive(doc);

  const zoomPct = Math.round(view.zoom * 100);

  // Density: 1 column === focus (single editable page); >1 === overview grid.
  // Clamp to the 1–3 segments the toggle renders so the sliding indicator can
  // never translate past the last segment if gridCols is ever set out of range.
  const activeCols = Math.min(3, Math.max(1, viewMode === "focus" ? 1 : view.gridCols));
  const setDensity = (cols: number) => {
    if (cols === 1) {
      setViewMode("focus");
    } else {
      setView((v) => ({ ...v, gridCols: cols }));
      setViewMode("overview");
    }
  };

  // Mobile keeps a touch-sized stepper on its own (density is dropped on phones
  // for space). Focus/single view only — in overview you page by tapping a thumb.
  const mobileStepper =
    doc && viewMode === "focus" ? (
      <PagePreviewNav
        page={selectedPage}
        total={doc.pageCount}
        onChange={setSelectedPage}
        size="touch"
      />
    ) : null;

  // Page stepper — its own bordered pill so it reads as a peer of the zoom pill
  // rather than sharing a container with the density toggle. Present in
  // focus/single view only (it's how you page through edits); in overview you
  // page by tapping a thumbnail.
  const stepperControl =
    doc && doc.pageCount > 1 && viewMode === "focus" ? (
      <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white/70 dark:bg-dark-surface p-0.5">
        <button
          type="button"
          onClick={() => setSelectedPage(Math.max(0, selectedPage - 1))}
          disabled={selectedPage <= 0}
          aria-label="Previous page"
          className={`${SEG_BTN} ${SEG_IDLE}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span
          role="status"
          aria-live="polite"
          className="px-1.5 text-center text-xs font-medium tabular-nums text-slate-600 dark:text-dark-text-muted"
        >
          {selectedPage + 1} / {doc.pageCount}
        </span>
        <button
          type="button"
          onClick={() => setSelectedPage(Math.min(doc.pageCount - 1, selectedPage + 1))}
          disabled={selectedPage >= doc.pageCount - 1}
          aria-label="Next page"
          className={`${SEG_BTN} ${SEG_IDLE}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    ) : null;

  // Density toggle — its own bordered pill, present for any multipage doc. The
  // thumb sits behind the icons and translates to the active segment, so changing
  // density glides rather than hard-swapping the highlight.
  const densityControl =
    doc && doc.pageCount > 1 ? (
      <div className="flex items-center rounded-lg border border-slate-200 dark:border-dark-border bg-white/70 dark:bg-dark-surface p-0.5">
        <div className="relative flex">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-7 w-8 rounded-md bg-primary-600 duration-200 ease-out motion-safe:transition-transform"
            style={{ transform: `translateX(${(activeCols - 1) * SEG_W}px)` }}
          />
          {DENSITIES.map(({ cols, icon: Icon, label }) => {
            const on = activeCols === cols;
            return (
              <button
                key={cols}
                type="button"
                onClick={() => setDensity(cols)}
                aria-label={label}
                aria-pressed={on}
                title={label}
                className={`relative z-10 ${SEG_BTN} ${
                  on
                    ? "text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-dark-text-muted dark:hover:text-dark-text"
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  // Zoom controls live in the centre too — they act on the PDF in the canvas,
  // like the stepper and density toggle. Focus/single view only (overview has no
  // zoom); rendered only off mobile (phones use pinch-to-zoom).
  const zoomControl =
    doc && viewMode === "focus" ? (
      <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white/70 dark:bg-dark-surface p-0.5">
        <button
          type="button"
          onClick={() => setView((v) => ({ ...v, zoom: Math.max(0.2, v.zoom / 1.2) }))}
          className={ZOOM_BTN}
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="min-w-10 text-center text-xs font-medium tabular-nums text-slate-600 dark:text-dark-text-muted">
          {zoomPct}%
        </span>
        <button
          type="button"
          onClick={() => setView((v) => ({ ...v, zoom: Math.min(8, v.zoom * 1.2) }))}
          className={ZOOM_BTN}
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <span className="mx-0.5 h-5 w-px bg-slate-200 dark:bg-dark-border" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setView((v) => ({ ...DEFAULT_VIEW, gridCols: v.gridCols }))}
          className={ZOOM_BTN}
          aria-label="Fit to screen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    ) : null;

  return (
    <header
      className={`grid h-16 shrink-0 items-center overflow-x-clip border-b border-slate-200/70 dark:border-dark-border bg-slate-50/90 dark:bg-dark-surface/90 px-3 ${
        isMobile ? "grid-cols-[auto_1fr_auto]" : "grid-cols-[1fr_auto_1fr]"
      }`}
    >
      {/* LEFT zone */}
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={exit} className={iconBtn} aria-label="Back to home">
          <ChevronLeft className="h-5 w-5" />
        </button>

        {!isMobile && (
          <img
            src="/icons/favicon.svg"
            alt=""
            width="40"
            height="40"
            className="h-10 w-10 drop-shadow-sm"
          />
        )}

        {/* File pill is desktop-only: at tablet width the centre pill + right
            controls leave the left grid zone too narrow, which truncated the
            filename to an orphan "· N pages". */}
        {doc && isDesktop && (
          <div className="ml-1 flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 dark:border-dark-border bg-white/70 dark:bg-dark-surface px-3 py-1.5">
            <span className="max-w-50 truncate text-sm font-medium text-slate-700 dark:text-dark-text">
              {doc.fileName}
            </span>
            <span className="text-xs tabular-nums text-slate-500 dark:text-dark-text-muted">
              · {doc.pageCount} {doc.pageCount === 1 ? "page" : "pages"}
            </span>
          </div>
        )}
      </div>

      {/* CENTRE zone — desktop/tablet: page stepper + density toggle + zoom, the
          canvas controls grouped at the true middle; mobile: the touch stepper. */}
      <div className="flex items-center justify-center gap-2">
        {isMobile ? (
          mobileStepper
        ) : (
          <>
            {stepperControl}
            {densityControl}
            {zoomControl}
          </>
        )}
      </div>

      {/* RIGHT zone */}
      <div className="flex items-center justify-self-end gap-1">
        {pendingMarks > 0 && (
          <div
            role="status"
            title={`${pendingMarks} redaction/erase ${
              pendingMarks === 1 ? "mark" : "marks"
            } pending — burned into the file when you export`}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
          >
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">{pendingMarks}</span>
            <span className="hidden sm:inline">pending</span>
            <span className="sr-only">
              {pendingMarks === 1 ? "mark" : "marks"} pending, applied when you export
            </span>
          </div>
        )}
        <div className="flex items-center">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className={iconBtn}
            aria-label="Undo"
          >
            <Undo2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className={iconBtn}
            aria-label="Redo"
          >
            <Redo2 className="h-5 w-5" />
          </button>
          {/* Reset stays desktop-only: a 4th 44px button would crowd the
              mobile centre stepper off-screen on 320px phones. Mobile reach to
              "reset to original" is a tracked follow-up (overflow menu). */}
          {!isMobile && (
            <button
              type="button"
              onClick={reset}
              disabled={!canReset}
              className={iconBtn}
              aria-label="Reset to original"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          )}
        </div>

        <ExportButton />
      </div>
    </header>
  );
}
