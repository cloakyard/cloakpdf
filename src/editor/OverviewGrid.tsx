// Browse every page; opening a preview returns to the editing canvas.
import { useEditorActions, useEditorRead, useEditorView } from "./EditorContext.tsx";
import { PageCollection } from "./PageCollection.tsx";
import { PageThumb } from "./PageThumb.tsx";

export function OverviewGrid() {
  const { doc, selectedPage } = useEditorRead();
  const view = useEditorView();
  const { setSelectedPage, setViewMode } = useEditorActions();
  if (!doc) return null;

  return (
    <PageCollection columns={view.gridCols} label="Document pages">
      {doc.pages.map((page) => (
        <li key={page.index} className="page-cell">
          <button
            type="button"
            onClick={() => {
              setSelectedPage(page.index);
              setViewMode("focus");
              requestAnimationFrame(() => {
                document
                  .querySelector<HTMLElement>('[aria-label^="Page "][tabindex="0"]')
                  ?.focus({ preventScroll: true });
              });
            }}
            aria-label={`Open page ${page.index + 1}`}
            aria-current={page.index === selectedPage ? "page" : undefined}
            className="editor-page-card editor-page-open"
          >
            <PageThumb page={page} alt={`Page ${page.index + 1}`} loading="lazy" />
            <span className="editor-page-caption">Page {page.index + 1}</span>
          </button>
        </li>
      ))}
    </PageCollection>
  );
}
