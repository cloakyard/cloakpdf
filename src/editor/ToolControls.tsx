// ToolControls.tsx — Right-panel body dispatcher. Shared by the desktop
// PropertiesPanel and the mobile bottom sheet so a tool's options render
// identically in both.

import { useActiveTool } from "./EditorContext.tsx";
import { toolImpl } from "./registry.tsx";

/**
 * Renders the active tool's options body. The mobile surface passes its selected
 * tool explicitly; the desktop inspector uses the live active tool.
 */
export function ToolControls({ toolId }: { toolId?: string } = {}) {
  const activeTool = useActiveTool();
  const id = toolId ?? activeTool;
  if (!id) return null;
  const impl = toolImpl(id);
  if (!impl) return null;
  const Panel = impl.Panel;
  return <Panel />;
}
