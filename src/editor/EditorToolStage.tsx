// EditorToolStage.tsx — Mounts the active focus tool's Stage component so it can
// register its overlay paint + pointer handlers on the persistent PdfStage via
// useStageProps. Returns null itself (the Stage renders nothing); switching
// tools unmounts the old Stage, whose useStageProps cleanup clears the overlay
// so nothing bleeds into the next tool. Mirrors CloakIMG's ToolStage.

import { useActiveTool } from "./EditorContext.tsx";
import { toolImpl } from "./registry.tsx";

export function EditorToolStage() {
  const activeTool = useActiveTool();
  const Stage = toolImpl(activeTool)?.Stage;
  return Stage ? <Stage /> : null;
}
