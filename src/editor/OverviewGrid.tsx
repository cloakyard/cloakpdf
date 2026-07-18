// OverviewGrid.tsx — Overview mode: a responsive grid of every page for
// browsing. Clicking a page selects it and drops into focus mode. Page-board
// editing (reorder / rotate / delete / extract) lands in M2 with the
// organize-pages tool; M0 ships read-only browse + jump-to-focus.

import { useEditorActions, useEditorRead, useEditorView } from "./EditorContext.tsx";
import { PageThumb } from "./PageThumb.tsx";

export function OverviewGrid() {
  const { doc, selectedPage, layout } = useEditorRead();
  const view = useEditorView();
  const { setSelectedPage, setViewMode } = useEditorActions();

  if (!doc) return null;

  const open = (index: number) => {
    setSelectedPage(index);
    setViewMode("focus");
  };

  // Clamp columns the same way the Organize board does, so the two overview
  // surfaces match at a given width: a 3-col density set on desktop then
  // resized to a phone would otherwise leave this read-only grid tighter than
  // the Organize board (which clamps to 2 on mobile).
  const cols = layout === "mobile" ? Math.min(view.gridCols, 2) : view.gridCols;

  return (
    <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-100 dark:bg-dark-bg p-4 sm:p-6">
      <div
        className="mx-auto grid max-w-5xl gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {doc.pages.map((page) => {
          const active = page.index === selectedPage;
          return (
            <button
              key={page.index}
              type="button"
              onClick={() => open(page.index)}
              aria-label={`Open page ${page.index + 1}`}
              aria-current={active}
              className={`page-cell group relative flex flex-col items-center gap-1.5 rounded-lg border bg-white dark:bg-dark-surface p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                active
                  ? "border-primary-400 ring-1 ring-primary-300"
                  : "border-slate-200 dark:border-dark-border hover:border-primary-300"
              }`}
            >
              <PageThumb
                page={page}
                alt={`Page ${page.index + 1}`}
                className="w-full rounded-md ring-1 ring-slate-200/70 dark:ring-dark-border"
                loading="lazy"
              />
              <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-dark-text-muted">
                {page.index + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
