// overlay-paint.ts — Canvas painters for the editor's PERSISTENT destructive
// overlay marks (redaction + erase).
//
// These marks are non-destructive until export: they live in `doc.objects`,
// stay editable while you work, and are burned into the pixels only at export
// (or just before the next byte transform — see EditorContext's applyTransform).
// So the canvas has to keep showing them no matter which tool is active —
// PdfStage paints them as an always-on BASE layer beneath the active tool's
// overlay, using the painters here. The Redact / Smart-Erase tool stages reuse
// the same painters for the in-progress drag box, so one look is used everywhere.
// Redaction boxes carry the user's chosen fill + border colours in their payload;
// the preview renders those (fill at reduced opacity so you can still see what
// you're covering) and the burn (redactPdf) lays them down solid.

import { type EraseMode, renderErasePreview } from "../utils/pdf-operations.ts";
import {
  type CanvasObject,
  DEFAULT_REDACTION_BORDER,
  DEFAULT_REDACTION_FILL,
  type ErasePayload,
  type RedactionPayload,
  type RgbColor,
} from "./doc.ts";
import type { FractionRect } from "./types.ts";

/** A redaction box — the user's fill (drawn semi-opaque so the covered content
 *  stays visible while editing) plus a border, matching the burned look. */
export function drawRedactionMark(
  ctx: CanvasRenderingContext2D,
  r: FractionRect,
  w: number,
  h: number,
  fill: RgbColor = DEFAULT_REDACTION_FILL,
  border: RgbColor = DEFAULT_REDACTION_BORDER,
): void {
  const x = r.xPct * w;
  const y = r.yPct * h;
  const bw = r.wPct * w;
  const bh = r.hPct * h;
  ctx.fillStyle = `rgba(${fill.r}, ${fill.g}, ${fill.b}, 0.85)`;
  ctx.fillRect(x, y, bw, bh);
  ctx.strokeStyle = `rgb(${border.r}, ${border.g}, ${border.b})`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, bw, bh);
}

/** An erase region. When the page bitmap is available we paint a true WYSIWYG
 *  preview of the fill / mosaic exactly as it will export (see renderErasePreview)
 *  with a soft dashed outline so it still reads as an editable mark; otherwise
 *  (bitmap still decoding) we fall back to the translucent slate placeholder. */
export function drawEraseMark(
  ctx: CanvasRenderingContext2D,
  r: FractionRect,
  w: number,
  h: number,
  src?: HTMLCanvasElement | null,
  mode: EraseMode = "fill",
  blockFrac?: number,
): void {
  const x = r.xPct * w;
  const y = r.yPct * h;
  const bw = r.wPct * w;
  const bh = r.hPct * h;
  const previewed = src ? renderErasePreview(ctx, r, w, h, src, mode, blockFrac) : false;
  ctx.save();
  if (!previewed) {
    ctx.fillStyle = "rgba(100, 116, 139, 0.30)";
    ctx.fillRect(x, y, bw, bh);
  }
  // Editable-region affordance: dashed slate outline — softer once the real
  // preview is showing through it, stronger over the bare placeholder.
  ctx.strokeStyle = previewed ? "rgba(71, 85, 105, 0.55)" : "rgba(71, 85, 105, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(x, y, bw, bh);
  ctx.restore();
}

/** Paint every committed destructive mark (redaction + erase) for one page —
 *  the always-on base layer drawn under the active tool's overlay. Each mark's
 *  appearance comes from its own payload. */
export function paintDestructiveMarks(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pageIndex: number,
  objects: readonly CanvasObject[],
  pageBitmap?: HTMLCanvasElement | null,
): void {
  for (const o of objects) {
    if (o.pageIndex !== pageIndex || !o.rect) continue;
    if (o.kind === "redaction") {
      const p = (o.payload ?? {}) as Partial<RedactionPayload>;
      drawRedactionMark(ctx, o.rect, w, h, p.fill, p.border);
    } else if (o.kind === "erase") {
      const p = (o.payload ?? {}) as Partial<ErasePayload>;
      drawEraseMark(ctx, o.rect, w, h, pageBitmap, p.mode ?? "fill", p.blockFrac);
    }
  }
}
