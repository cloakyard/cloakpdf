// registry.tsx — Binds editor tool ids to their implementation: an optional
// Stage (canvas interaction, registers via useStageProps; focus tools only)
// and a Panel (right-side options). This is the id → {Stage, Panel} map the
// two dispatchers (EditorToolStage / ToolControls) read, mirroring CloakIMG's
// Tool/Panel split. Every editor tool id has one entry here; panel-only tools
// omit Stage while canvas-interaction tools provide both components.

import type { ComponentType } from "react";
import type { EditorToolId } from "./tools.ts";
import * as Annotate from "./panels/AnnotateTool.tsx";
import * as Attachments from "./panels/AttachmentsTool.tsx";
import * as AutoFill from "./panels/AutoFillTool.tsx";
import * as Bookmarks from "./panels/BookmarksTool.tsx";
import * as CodeStamp from "./panels/CodeStampTool.tsx";
import * as Crop from "./panels/CropTool.tsx";
import * as FillForm from "./panels/FillFormTool.tsx";
import * as FindAct from "./panels/FindActTool.tsx";
import * as Metadata from "./panels/MetadataTool.tsx";
import * as Ocr from "./panels/OcrTool.tsx";
import * as Organize from "./panels/OrganizeTool.tsx";
import * as Redact from "./panels/RedactTool.tsx";
import * as Scrub from "./panels/ScrubTool.tsx";
import * as SelectText from "./panels/SelectTextTool.tsx";
import * as Signature from "./panels/SignatureTool.tsx";
import * as SmartErase from "./panels/SmartEraseTool.tsx";
import * as StripFurniture from "./panels/StripFurnitureTool.tsx";
import {
  BatesPanel,
  BatesStage,
  HeaderFooterPanel,
  HeaderFooterStage,
  PageNumbersPanel,
  PageNumbersStage,
  WatermarkPanel,
  WatermarkStage,
} from "./panels/StampTools.tsx";
import { NupPanel } from "./panels/SimpleTools.tsx";

export interface ToolImpl {
  /** Registers canvas interaction for focus tools; absent for overview/options tools. */
  Stage?: ComponentType;
  /** The right-panel options body. */
  Panel: ComponentType;
}

const TOOL_IMPL: Record<EditorToolId, ToolImpl> = {
  "redact-pdf": { Stage: Redact.Stage, Panel: Redact.Panel },
  // Find-by-content: a Stage that paints the staged matches + a search/act Panel.
  "find-act": { Stage: FindAct.Stage, Panel: FindAct.Panel },
  // Smart Erase: destructive-drag like Redact, but fills/pixelates the box.
  "smart-erase": { Stage: SmartErase.Stage, Panel: SmartErase.Panel },
  "annotate-pdf": { Stage: Annotate.Stage, Panel: Annotate.Panel },
  // Real text selection: drag-select the page's text, then highlight/box/redact/copy.
  "select-text": { Stage: SelectText.Stage, Panel: SelectText.Panel },
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
  // Content-additive stamp-family tools — each paints a live preview on the
  // focused page (Stage) before Apply burns the same text into the bytes.
  "add-page-numbers": { Stage: PageNumbersStage, Panel: PageNumbersPanel },
  "header-footer": { Stage: HeaderFooterStage, Panel: HeaderFooterPanel },
  "bates-numbering": { Stage: BatesStage, Panel: BatesPanel },
  // QR / barcode: place on the page (tap), drag to move, corner-drag to resize;
  // a vector code burns in at Apply.
  "qr-stamp": { Stage: CodeStamp.Stage, Panel: CodeStamp.Panel },
  // Watermark: a live-preview Stage (paints the diagonal text as you tune it) +
  // the options Panel; Apply still burns it into the bytes.
  "stamp-pdf": { Stage: WatermarkStage, Panel: WatermarkPanel },
  // Document tools: panel-only field/list editors.
  "fill-pdf-form": { Panel: FillForm.Panel },
  // Auto-fill: detect + fill flat (non-AcroForm) form blanks, with a saved profile.
  "auto-fill": { Stage: AutoFill.Stage, Panel: AutoFill.Panel },
  "add-bookmarks": { Panel: Bookmarks.Panel },
  "file-attachment": { Panel: Attachments.Panel },
  // OCR: searchable-text pipeline (panel-only; available on mobile too).
  ocr: { Panel: Ocr.Panel },
};

export function toolImpl(id: string | null): ToolImpl | null {
  return id ? (TOOL_IMPL[id as EditorToolId] ?? null) : null;
}
