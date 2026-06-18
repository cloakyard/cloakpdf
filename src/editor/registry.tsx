// registry.tsx — Binds editor tool ids to their implementation: an optional
// Stage (canvas interaction, registers via useStageProps; focus tools only)
// and a Panel (right-side options). This is the id → {Stage, Panel} map the
// two dispatchers (EditorToolStage / ToolControls) read, mirroring CloakIMG's
// Tool/Panel split. Tools land here milestone by milestone; ids absent from the
// map render a placeholder panel and no canvas behaviour.

import type { ComponentType } from "react";
import * as Annotate from "./panels/AnnotateTool.tsx";
import * as Attachments from "./panels/AttachmentsTool.tsx";
import * as Bookmarks from "./panels/BookmarksTool.tsx";
import * as Crop from "./panels/CropTool.tsx";
import * as FillForm from "./panels/FillFormTool.tsx";
import * as FindAct from "./panels/FindActTool.tsx";
import * as Metadata from "./panels/MetadataTool.tsx";
import * as Ocr from "./panels/OcrTool.tsx";
import * as Organize from "./panels/OrganizeTool.tsx";
import * as Redact from "./panels/RedactTool.tsx";
import * as Scrub from "./panels/ScrubTool.tsx";
import * as Signature from "./panels/SignatureTool.tsx";
import * as SmartErase from "./panels/SmartEraseTool.tsx";
import * as StripFurniture from "./panels/StripFurnitureTool.tsx";
import {
  BatesPanel,
  HeaderFooterPanel,
  PageNumbersPanel,
  WatermarkPanel,
} from "./panels/StampTools.tsx";
import { NupPanel } from "./panels/SimpleTools.tsx";

export interface ToolImpl {
  /** Registers canvas interaction for focus tools; absent for overview/options tools. */
  Stage?: ComponentType;
  /** The right-panel options body. */
  Panel: ComponentType;
}

export const TOOL_IMPL: Record<string, ToolImpl> = {
  "redact-pdf": { Stage: Redact.Stage, Panel: Redact.Panel },
  // Find-by-content: a Stage that paints the staged matches + a search/act Panel.
  "find-act": { Stage: FindAct.Stage, Panel: FindAct.Panel },
  // Smart Erase: destructive-drag like Redact, but fills/pixelates the box.
  "smart-erase": { Stage: SmartErase.Stage, Panel: SmartErase.Panel },
  "annotate-pdf": { Stage: Annotate.Stage, Panel: Annotate.Panel },
  // Canvas-placement tools: a Stage to place/drag on the page + a Panel.
  signature: { Stage: Signature.Stage, Panel: Signature.Panel },
  "crop-pages": { Stage: Crop.Stage, Panel: Crop.Panel },
  // Strip Furniture: a passive Stage that previews the trimmed margin bands + a
  // detect-and-crop Panel.
  "strip-furniture": { Stage: StripFurniture.Stage, Panel: StripFurniture.Panel },
  // Overview tools: their Board lives in OverviewMode (center), so no focus
  // Stage here — only the Panel. Organize now also absorbs reverse / extract /
  // remove-blank as in-panel quick actions.
  "organize-pages": { Panel: Organize.Panel },
  // Whole-document, options-only tools (no canvas interaction).
  "nup-pages": { Panel: NupPanel },
  // Security panels: load an async report on open, then apply.
  metadata: { Panel: Metadata.Panel },
  "pdf-scrub": { Panel: Scrub.Panel },
  // Content-additive stamp-family option tools.
  "add-page-numbers": { Panel: PageNumbersPanel },
  "header-footer": { Panel: HeaderFooterPanel },
  "bates-numbering": { Panel: BatesPanel },
  "stamp-pdf": { Panel: WatermarkPanel },
  // Document tools: panel-only field/list editors.
  "fill-pdf-form": { Panel: FillForm.Panel },
  "add-bookmarks": { Panel: Bookmarks.Panel },
  "file-attachment": { Panel: Attachments.Panel },
  // OCR: desktop-only searchable-text pipeline (panel-only).
  ocr: { Panel: Ocr.Panel },
};

export function toolImpl(id: string | null): ToolImpl | null {
  return id ? (TOOL_IMPL[id] ?? null) : null;
}
