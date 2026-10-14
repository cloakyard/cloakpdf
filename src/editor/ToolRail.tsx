// Quiet Air tool navigation. Selection and keyboard navigation are immediate.
import { Search } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import { useActiveTool, useEditorActions } from "./EditorContext.tsx";
import { EDITOR_GROUP_LABELS, editorToolGroups } from "./tools.ts";

const groups = editorToolGroups();

export const ToolRail = memo(function ToolRail({ onOpenPalette }: { onOpenPalette: () => void }) {
  const activeTool = useActiveTool();
  const { setActiveTool, setViewMode } = useEditorActions();
  const activeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeBtnRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [activeTool]);

  return (
    <nav aria-label="Editor tools" className="editor-toolrail thin-scrollbar">
      <button
        type="button"
        onClick={(event) => {
          event.currentTarget.focus();
          onOpenPalette();
        }}
        title="Search tools (⌘K / Ctrl+K)"
        data-dialog-return-focus="editor-tool-picker"
        aria-label="Search tools"
        aria-keyshortcuts="Meta+K Control+K"
        className="editor-toolrail__button"
      >
        <Search aria-hidden="true" />
        <span>Search</span>
      </button>
      {groups.map((group) => (
        <div
          key={group.group}
          className="editor-toolrail__group"
          role="group"
          aria-label={EDITOR_GROUP_LABELS[group.group]}
        >
          {group.tools.map((tool) => {
            const Icon = tool.icon;
            const active = tool.id === activeTool;
            return (
              <button
                key={tool.id}
                ref={active ? activeBtnRef : undefined}
                type="button"
                onClick={() => {
                  setActiveTool(active ? null : tool.id);
                  if (!active && (tool.mode === "focus" || tool.mode === "overview"))
                    setViewMode(tool.mode);
                }}
                title={tool.name}
                aria-label={tool.name}
                aria-pressed={active}
                className="editor-toolrail__button"
              >
                <Icon aria-hidden="true" />
                <span>{tool.railLabel ?? tool.name}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
});
