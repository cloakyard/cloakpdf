// PropertiesPanel.tsx — The right options panel. Header (active tool name +
// group caption + Cancel when the tool has rollback-able work) over a
// per-tool body. When no tool is selected, the panel shows a short document
// guidance and a direct path to page organization.

import { ArrowRight, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useActiveTool, useEditorActions, useEditorRead } from "./EditorContext.tsx";
import { ToolControls } from "./ToolControls.tsx";
import { findEditorTool } from "./tools.ts";

export function PropertiesPanel({ collapsed = false }: { collapsed?: boolean }) {
  const activeTool = useActiveTool();
  const { canCancelCurrentTool } = useEditorRead();
  const { cancelCurrentTool, setActiveTool, setViewMode } = useEditorActions();
  const tool = findEditorTool(activeTool);
  const headingId = useId();

  // When a tool is activated (from the rail), move focus into the panel so a
  // keyboard user lands on the tool's options instead of having to Tab past the
  // whole rail + canvas. Focus the (pinned, non-scrolling) heading — not the
  // scroll body — so the hidden-scrollbar surface is untouched, and pass
  // preventScroll so the canvas never jumps. Guarded on `activeTool` so
  // deactivating a tool doesn't yank focus to the "Document" heading.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousTool = useRef(activeTool);
  useEffect(() => {
    // Preserve focus on surviving chrome when a responsive panel mounts.
    if (
      activeTool &&
      (previousTool.current !== activeTool || document.activeElement === document.body)
    )
      headingRef.current?.focus({ preventScroll: true });
    previousTool.current = activeTool;
  }, [activeTool]);

  return (
    <aside
      aria-labelledby={headingId}
      className="editor-properties"
      data-compact={collapsed || undefined}
    >
      <div className="editor-properties__header">
        <div className="min-w-0">
          <h2 id={headingId} ref={headingRef} tabIndex={-1} className="editor-properties__title">
            {tool ? tool.name : "Document"}
          </h2>
          {tool && <p className="editor-properties__description">{tool.description}</p>}
        </div>
        {tool && canCancelCurrentTool && (
          <button
            type="button"
            onClick={() => {
              void cancelCurrentTool().then(() => {
                document.querySelector<HTMLButtonElement>('[aria-label="Search tools"]')?.focus();
              });
            }}
            className="air-icon-button air-button--quiet"
            aria-label="Cancel current tool"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="editor-properties__body thin-scrollbar">
        <div key={tool?.id ?? "document"}>
          {tool ? (
            <ToolControls />
          ) : (
            <div className="editor-properties__empty">
              <p>Room to work.</p>
              <p>Choose a tool from the rail to edit this PDF. Your document stays in view.</p>
              <button
                type="button"
                className="air-button"
                onClick={() => {
                  setActiveTool("organize-pages");
                  setViewMode("overview");
                }}
              >
                Organize pages <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
