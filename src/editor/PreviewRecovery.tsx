import { useRef } from "react";
import { useEditorActions, useEditorRead } from "./EditorContext.tsx";

/** One recovery action serves the canvas, page grids, OCR and print previews. */
export function PreviewRecovery() {
  const { doc, previewRetry, busyLabel } = useEditorRead();
  const { retryPreviews } = useEditorActions();
  const ownsFocus = useRef(false);
  const missing = doc?.pages.filter((page) => !page.thumbUrl).length ?? 0;
  if (!missing) return null;
  return (
    <div className="editor-preview-recovery">
      <p role="status">
        <strong>
          {previewRetry.pending
            ? "Rebuilding previews…"
            : `${missing === 1 ? "A preview is" : `${missing} previews are`} unavailable.`}
        </strong>{" "}
        {previewRetry.failed
          ? "Couldn't rebuild every preview. Your file and edits are safe; try again."
          : "Your file and edits are safe."}
      </p>
      <button
        type="button"
        className="air-button"
        aria-disabled={previewRetry.pending || !!busyLabel}
        onFocus={() => {
          ownsFocus.current = true;
        }}
        onBlur={() => {
          ownsFocus.current = false;
        }}
        onClick={async () => {
          if (previewRetry.pending || busyLabel) return;
          await retryPreviews();
          requestAnimationFrame(() => {
            // A successful retry removes this strip. Return keyboard focus to
            // the persistent document actions only if the user stayed here.
            if (ownsFocus.current && document.activeElement === document.body)
              document.querySelector<HTMLButtonElement>('button[aria-label="Export"]')?.focus();
          });
        }}
      >
        Retry previews
      </button>
    </div>
  );
}
