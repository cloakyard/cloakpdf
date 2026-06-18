// OverviewMode.tsx — Chooses what the overview stage shows: the editable
// page-board when the Organize tool is active, otherwise the read-only browse
// grid (click a page → focus). Keeps EditorShell ignorant of the active tool.

import { useActiveTool } from "./EditorContext.tsx";
import { OverviewGrid } from "./OverviewGrid.tsx";
import { Board as OrganizeBoard, ORGANIZE_ID } from "./panels/OrganizeTool.tsx";

export function OverviewMode() {
  const activeTool = useActiveTool();
  if (activeTool === ORGANIZE_ID) return <OrganizeBoard />;
  return <OverviewGrid />;
}
