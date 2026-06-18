// ToolControls.tsx — Right-panel body dispatcher. Renders the active tool's
// Panel (its real options) for migrated tools, or a placeholder for tools that
// haven't moved into the editor yet. Shared by the desktop PropertiesPanel and
// the mobile bottom sheet so a tool's options render identically in both.

import { useActiveTool } from "./EditorContext.tsx";
import { toolImpl } from "./registry.tsx";
import { findEditorTool } from "./tools.ts";

/** Placeholder body for tools whose editor migration is still pending. */
export function ToolPlaceholder({ toolId }: { toolId: string }) {
  const tool = findEditorTool(toolId);
  if (!tool) return null;
  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-dark-border bg-slate-50/60 dark:bg-dark-bg/40 p-4 text-center">
      <p className="text-sm font-medium text-slate-600 dark:text-dark-text">{tool.name}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-dark-text-muted">
        This tool moves into the editor in a later milestone.
      </p>
    </div>
  );
}

/**
 * Renders the active tool's options body. `toolId` overrides the active tool —
 * the mobile sheet passes the just-deactivated tool's id so the panel keeps
 * rendering through its slide-down animation (the active tool clears the moment
 * the user taps Done/Cancel). Defaults to the live active tool.
 */
export function ToolControls({ toolId }: { toolId?: string } = {}) {
  const activeTool = useActiveTool();
  const id = toolId ?? activeTool;
  if (!id) return null;
  const impl = toolImpl(id);
  if (impl) {
    const Panel = impl.Panel;
    return <Panel />;
  }
  return <ToolPlaceholder toolId={id} />;
}
