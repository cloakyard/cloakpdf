import { Check, X } from "lucide-react";
import { useRef } from "react";
import { useEditorActions, useEditorRead } from "./EditorContext.tsx";

/** One compact completion pair, outside the independently scrolling controls. */
export function ToolCompletion({ onClose }: { onClose: () => void }) {
  const { pendingApply, canCancelCurrentTool, busyLabel } = useEditorRead();
  const { flushPendingApply, cancelCurrentTool, setActiveTool } = useEditorActions();
  const finishing = useRef(false);
  const finish = async (cancel: boolean) => {
    if (finishing.current || busyLabel || (!cancel && pendingApply && !pendingApply.ready)) return;
    finishing.current = true;
    try {
      if (cancel) await cancelCurrentTool();
      else {
        await flushPendingApply();
        setActiveTool(null);
      }
      onClose();
    } catch {
      // The owning operation reports its error. Keep failed drafts available for retry.
    } finally {
      finishing.current = false;
    }
  };
  return (
    <div
      className="air-editor-actions air-editor-actions--compact"
      role="group"
      aria-label="Edit actions"
    >
      {canCancelCurrentTool && (
        <button
          type="button"
          className="air-button air-icon-button"
          disabled={busyLabel !== null}
          onClick={() => void finish(true)}
          aria-label="Cancel"
          title="Cancel"
        >
          <X aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        className={`air-button${pendingApply ? " air-icon-button air-button--primary" : " air-button--quiet"}`}
        disabled={busyLabel !== null || (pendingApply !== null && !pendingApply.ready)}
        onClick={() => void finish(false)}
        aria-label={pendingApply ? "Apply" : "Close"}
        title={pendingApply ? "Apply" : "Close"}
      >
        {pendingApply ? <Check aria-hidden="true" /> : "Close"}
      </button>
    </div>
  );
}
