import { Trash2 } from "lucide-react";
import { useRef } from "react";
import { type ErasePayload } from "../doc.ts";
import { useEditorActions, useEditorRead } from "../EditorContext.tsx";

const METHOD = { fill: "Fill", inpaint: "Blend", pixelate: "Pixelate" } as const;

/** Deferred marks share one collection and the editor's persistent undo history. */
export function PendingMarkList({ kind }: { kind: "redaction" | "erase" }) {
  const { doc } = useEditorRead();
  const { removeObject, removeObjects, setSelectedPage, setViewMode } = useEditorActions();
  const clearRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const marks = doc?.objects.filter((o) => o.kind === kind) ?? [];
  const noun = kind === "redaction" ? "box" : "area";
  const countLabel = kind === "redaction" ? "redaction" : "area";
  return (
    <section
      className="pdf-mark-list"
      aria-label={`Pending ${kind === "redaction" ? "redactions" : "erase areas"}`}
    >
      <div className="pdf-mark-list__heading">
        <h3>
          {marks.length} {countLabel}
          {marks.length === 1 ? "" : "s"}
        </h3>
        <button
          ref={clearRef}
          type="button"
          className="air-button"
          aria-disabled={!marks.length}
          onClick={() => {
            if (marks.length)
              removeObjects(
                marks.map((m) => m.id),
                `Clear ${countLabel}s`,
              );
          }}
        >
          Clear all
        </button>
      </div>
      {marks.length ? (
        <ul ref={listRef} className="thin-scrollbar">
          {marks.map((mark, index) => (
            <li key={mark.id}>
              <button
                type="button"
                className="pdf-mark-list__location"
                onClick={() => {
                  setSelectedPage(mark.pageIndex);
                  setViewMode("focus");
                }}
              >
                <span>
                  {kind === "redaction" ? "Box" : "Area"} {index + 1}
                </span>
                <span className="air-help">
                  Page {mark.pageIndex + 1}
                  {kind === "erase"
                    ? ` · ${METHOD[(mark.payload as ErasePayload)?.mode ?? "fill"]}`
                    : ""}
                </span>
              </button>
              <button
                type="button"
                className="air-icon-button"
                aria-label={`Remove ${noun} ${index + 1}`}
                onClick={() => {
                  // Move focus before removing its owner, to the next surviving row
                  // or the persistent clear action. Undo is in the fixed toolbar.
                  const rows = listRef.current?.querySelectorAll<HTMLButtonElement>(
                    ".pdf-mark-list__location",
                  );
                  (rows?.[index + 1] ?? rows?.[index - 1] ?? clearRef.current)?.focus();
                  removeObject(mark.id);
                }}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="air-help">
          No marks yet. Draw on the page
          {kind === "redaction" ? " or find text above" : " to mark an area"}.
        </p>
      )}
      <p className="air-help">
        Review a mark by opening its page. Undo in the toolbar restores removed marks.
      </p>
    </section>
  );
}
