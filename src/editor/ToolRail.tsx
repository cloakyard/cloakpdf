// ToolRail.tsx — The left tool rail (desktop + tablet). Mobile uses the
// MobileEditorSurface bottom sheet for tool selection, so the rail never
// renders below the mobile breakpoint. Tools are grouped with hairline
// separators; the active tool gets a single Ocean-Blue left edge-bar (one cue,
// per DESIGN.md), mirroring CloakIMG's reduced-cue rail.

import { Command } from "lucide-react";
import { memo, useEffect, useRef } from "react";
import { useActiveTool, useEditorActions } from "./EditorContext.tsx";
import { editorToolGroups } from "./tools.ts";

export const ToolRail = memo(function ToolRail({ onOpenPalette }: { onOpenPalette: () => void }) {
  const activeTool = useActiveTool();
  const { setActiveTool, setViewMode } = useEditorActions();
  const groups = editorToolGroups();

  // Selecting a tool from the command palette (⌘K) can target one below the
  // fold of this scrollable rail — bring the active button into view so the
  // selection is always visible. `block: "nearest"` scrolls the minimum amount
  // and no-ops when it's already on screen (e.g. a normal rail click).
  const activeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!activeTool) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    activeBtnRef.current?.scrollIntoView({
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [activeTool]);

  return (
    <div className="no-scrollbar flex w-18 shrink-0 flex-col overflow-y-auto border-r border-slate-200/70 dark:border-dark-border py-2 pr-1 pl-0">
      {/* Quick switcher (⌘K) — the keyboard-first way to jump to any of the
          tools below. Lives above the families so it reads as a search affordance
          rather than a tool. */}
      <button
        type="button"
        onClick={onOpenPalette}
        title="Search tools (⌘K)"
        aria-label="Search tools"
        aria-keyshortcuts="Meta+K Control+K"
        className="relative my-0.5 flex h-11 w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-dark-text-muted dark:hover:bg-dark-surface-alt dark:hover:text-dark-text"
      >
        <Command className="h-4.5 w-4.5" />
        <span className="max-w-full truncate px-0.5 text-xxs font-medium leading-none">Search</span>
      </button>
      <div className="mx-3 my-1.5 h-px bg-slate-200/70 dark:bg-dark-border" />
      {groups.map((group, gi) => (
        <div key={group.group} className="flex flex-col">
          {gi > 0 && <div className="mx-3 my-1.5 h-px bg-slate-200/70 dark:bg-dark-border" />}
          {group.tools.map((tool) => {
            const Icon = tool.icon;
            const active = tool.id === activeTool;
            return (
              <button
                key={tool.id}
                ref={active ? activeBtnRef : undefined}
                type="button"
                onClick={() => {
                  if (active) {
                    setActiveTool(null);
                    return;
                  }
                  setActiveTool(tool.id);
                  if (tool.mode === "focus") setViewMode("focus");
                  else if (tool.mode === "overview") setViewMode("overview");
                }}
                title={tool.name}
                aria-label={tool.name}
                aria-pressed={active}
                className={`relative my-0.5 flex h-11 w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  active
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-dark-text-muted dark:hover:bg-dark-surface-alt dark:hover:text-dark-text"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="max-w-full truncate px-0.5 text-xxs font-medium leading-none">
                  {tool.railLabel ?? tool.name.split(" ")[0]}
                </span>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-[18%] left-0 bottom-[18%] w-0.75 rounded-r-sm bg-primary-500"
                  />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
});
