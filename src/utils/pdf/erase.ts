/**
 * Smart Erase — cover regions of a page with a colour-matched patch or a
 * pixelated mosaic, destructively.
 *
 * Like {@link ./redact.ts | redactPdf}, any page that carries an erase region
 * is rasterised, has the patches burned into the pixels, and is rebuilt as an
 * image-only page — so whatever sat under the patch (a stain, a logo, a face)
 * is physically gone, not merely hidden behind a vector shape the original
 * content survives beneath. Pages without regions are copied through untouched,
 * keeping their crisp vector text and small size.
 *
 * Two modes per region:
 *   • "fill"     — sample the colour just outside the box and flood it, so the
 *                  patch blends into a solid background (white paper, a form
 *                  field). Best on uniform backgrounds; over texture it reads as
 *                  a flat rectangle, so the UI steers those cases to pixelate.
 *   • "pixelate" — mosaic the region into coarse blocks, de-identifying a face
 *                  or licence plate while keeping the surrounding page legible.
 */

import { PDFDocument } from "@pdfme/pdf-lib";
import { PDFJS_WASM_URL } from "../pdfjs-config.ts";
import { canvasToImageBytes, clampScaleForCanvas, getPdfJs } from "./raster.ts";

export type EraseMode = "fill" | "pixelate";

export interface EraseRegion {
  /** 0-based page index. */
  pageIndex: number;
  /** Box in page fractions (0–1) from the top-left. */
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  mode: EraseMode;
  /** Pixelate block size as a fraction of the region's smaller dimension —
   *  larger = coarser mosaic. Ignored for fill. Default ≈ 0.12 (~8 blocks). */
  blockFrac?: number;
}

function clampBlockFrac(f: number | undefined): number {
  if (f === undefined || !Number.isFinite(f)) return 0.12;
  return Math.min(0.4, Math.max(0.02, f));
}

/** Running RGB sum over sampled pixels — used to average the ring colour. */
interface ColorAcc {
  r: number;
  g: number;
  b: number;
  n: number;
}

/** Add a rectangular strip's pixels into `acc`. No-op for an empty/degenerate
 *  strip; silently skips a tainted canvas (getImageData throws). */
function accumulateStrip(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  acc: ColorAcc,
): void {
  if (sw <= 0 || sh <= 0) return;
  try {
    const { data } = ctx.getImageData(sx, sy, sw, sh);
    for (let o = 0; o < data.length; o += 4) {
      acc.r += data[o];
      acc.g += data[o + 1];
      acc.b += data[o + 2];
      acc.n++;
    }
  } catch {
    // getImageData throws on a tainted canvas — caller falls through to white.
  }
}

/** Average colour of a thin ring just OUTSIDE the box, then flood the box with
 *  it so the patch blends into a solid background. Reads only the four ring
 *  strips (top / bottom / left / right) — never the box interior we're about to
 *  cover — so a large fill never pulls back megapixels just to discard them.
 *  Falls back to white when no ring pixels are sampleable (box at the page edge,
 *  or a tainted canvas). */
function fillRegion(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const ring = Math.max(2, Math.round(Math.min(w, h) * 0.08));
  const ox = Math.max(0, x - ring);
  const oy = Math.max(0, y - ring);
  const ex = Math.min(canvasW, x + w + ring);
  const ey = Math.min(canvasH, y + h + ring);
  const acc: ColorAcc = { r: 0, g: 0, b: 0, n: 0 };
  // Four disjoint strips that together tile the ring around the box: full-width
  // bands above and below, then the slivers either side between them.
  accumulateStrip(ctx, ox, oy, ex - ox, y - oy, acc); // top
  accumulateStrip(ctx, ox, y + h, ex - ox, ey - (y + h), acc); // bottom
  accumulateStrip(ctx, ox, y, x - ox, h, acc); // left
  accumulateStrip(ctx, x + w, y, ex - (x + w), h, acc); // right
  ctx.fillStyle =
    acc.n > 0
      ? `rgb(${Math.round(acc.r / acc.n)}, ${Math.round(acc.g / acc.n)}, ${Math.round(acc.b / acc.n)})`
      : "#ffffff";
  ctx.fillRect(x, y, w, h);
}

/** Mosaic the region into coarse blocks by averaging each block's pixels. */
function pixelateRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  blockFrac: number,
): void {
  const block = Math.max(4, Math.round(Math.min(w, h) * clampBlockFrac(blockFrac)));
  let img: ImageData;
  try {
    img = ctx.getImageData(x, y, w, h);
  } catch {
    return; // tainted canvas — leave the region untouched rather than throw
  }
  const px = img.data;
  for (let by = 0; by < h; by += block) {
    for (let bx = 0; bx < w; bx += block) {
      const bw = Math.min(block, w - bx);
      const bh = Math.min(block, h - by);
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let yy = 0; yy < bh; yy++) {
        for (let xx = 0; xx < bw; xx++) {
          const o = ((by + yy) * w + (bx + xx)) * 4;
          r += px[o];
          g += px[o + 1];
          b += px[o + 2];
          n++;
        }
      }
      if (n === 0) continue;
      ctx.fillStyle = `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
      ctx.fillRect(x + bx, y + by, bw, bh);
    }
  }
}

/**
 * Render a WYSIWYG preview of how one erase region will look after export, onto
 * an arbitrary destination context (the editor's overlay canvas).
 *
 * It reuses the very same {@link fillRegion} / {@link pixelateRegion} the export
 * path runs, so the on-canvas preview and the burned-in result can't drift: we
 * lift the region (plus, for fill, the surrounding ring the sampler needs) out
 * of the already-rendered page bitmap into a small offscreen canvas, run the
 * real erase op on it, then blit just the box onto the overlay at display scale.
 *
 * The mosaic's block COUNT is resolution-invariant (block size scales with the
 * region's smaller dimension), so working at the page bitmap's native region
 * resolution — capped for safety — reproduces the export's granularity exactly.
 *
 * @param dst - Destination 2D context (drawn in the overlay's CSS-px space).
 * @param r - Region box in page fractions (0–1) from the top-left.
 * @param dstW - Overlay width in the same units `r` maps into (CSS px).
 * @param dstH - Overlay height.
 * @param src - The rendered page bitmap to sample (same-origin, never tainted).
 * @param mode - "fill" or "pixelate".
 * @param blockFrac - Pixelate block fraction; ignored for fill.
 * @returns true if a preview was painted; false if the caller should fall back
 *          to a placeholder (degenerate box, unreadable bitmap).
 */
const PREVIEW_MAX_DIM = 1400;

export function renderErasePreview(
  dst: CanvasRenderingContext2D,
  r: { xPct: number; yPct: number; wPct: number; hPct: number },
  dstW: number,
  dstH: number,
  src: HTMLCanvasElement,
  mode: EraseMode,
  blockFrac: number | undefined,
): boolean {
  const srcW = src.width;
  const srcH = src.height;
  if (srcW <= 0 || srcH <= 0) return false;

  const dx = r.xPct * dstW;
  const dy = r.yPct * dstH;
  const dw = r.wPct * dstW;
  const dh = r.hPct * dstH;
  if (dw < 1 || dh < 1) return false;

  // Box in source-bitmap pixels.
  const sx = r.xPct * srcW;
  const sy = r.yPct * srcH;
  const sbw = r.wPct * srcW;
  const sbh = r.hPct * srcH;
  if (sbw < 1 || sbh < 1) return false;

  if (mode === "fill") {
    // fillRegion samples a ring just OUTSIDE the box, so the offscreen canvas
    // must include that ring. Mirror the export's 8%-of-smaller-dim ring and
    // its edge clamping so the sampled colour matches.
    const ring = Math.max(2, Math.round(Math.min(sbw, sbh) * 0.08));
    const ox = Math.max(0, Math.floor(sx - ring));
    const oy = Math.max(0, Math.floor(sy - ring));
    const ex = Math.min(srcW, Math.ceil(sx + sbw + ring));
    const ey = Math.min(srcH, Math.ceil(sy + sbh + ring));
    const ow = ex - ox;
    const oh = ey - oy;
    if (ow < 1 || oh < 1) return false;
    const off = document.createElement("canvas");
    off.width = ow;
    off.height = oh;
    const octx = off.getContext("2d", { willReadFrequently: true });
    if (!octx) return false;
    octx.drawImage(src, ox, oy, ow, oh, 0, 0, ow, oh);
    const bx = Math.round(sx - ox);
    const by = Math.round(sy - oy);
    const bw = Math.round(sbw);
    const bh = Math.round(sbh);
    fillRegion(octx, ow, oh, bx, by, bw, bh);
    dst.drawImage(off, bx, by, bw, bh, dx, dy, dw, dh);
    return true;
  }

  // Pixelate: blit the box alone, mosaic it, then upscale crisply to the overlay.
  let pw = Math.round(sbw);
  let ph = Math.round(sbh);
  const cap = Math.max(pw, ph);
  if (cap > PREVIEW_MAX_DIM) {
    const k = PREVIEW_MAX_DIM / cap;
    pw = Math.max(1, Math.round(pw * k));
    ph = Math.max(1, Math.round(ph * k));
  }
  const off = document.createElement("canvas");
  off.width = pw;
  off.height = ph;
  const octx = off.getContext("2d", { willReadFrequently: true });
  if (!octx) return false;
  octx.drawImage(src, sx, sy, sbw, sbh, 0, 0, pw, ph);
  pixelateRegion(octx, 0, 0, pw, ph, blockFrac ?? 0.12);
  const smooth = dst.imageSmoothingEnabled;
  dst.imageSmoothingEnabled = false; // keep mosaic block edges hard when upscaled
  dst.drawImage(off, 0, 0, pw, ph, dx, dy, dw, dh);
  dst.imageSmoothingEnabled = smooth;
  return true;
}

/**
 * Permanently erase regions of a PDF — destructively, mirroring redactPdf's
 * rasterise-touched-pages approach so the covered content can't be recovered.
 *
 * Coordinates are fractions (0–1) of page width/height from the top-left.
 *
 * @param file - The source PDF file.
 * @param regions - Regions to erase, each tagged with its page + mode.
 * @returns A new PDF with the erased areas permanently replaced.
 */
export async function erasePdf(
  file: File,
  regions: EraseRegion[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const src = await PDFDocument.load(arrayBuffer);
  const pageCount = src.getPageCount();

  const byPage = new Map<number, EraseRegion[]>();
  for (const r of regions) {
    if (r.pageIndex < 0 || r.pageIndex >= pageCount) continue;
    if (r.wPct <= 0 || r.hPct <= 0) continue;
    const list = byPage.get(r.pageIndex) ?? [];
    list.push(r);
    byPage.set(r.pageIndex, list);
  }
  if (byPage.size === 0) return src.save();

  const pdfjsLib = await getPdfJs();
  // PDF.js may detach the backing buffer — hand it its own copy so `src` (used
  // for copying untouched pages) stays valid.
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0), wasmUrl: PDFJS_WASM_URL });
  const pdfjsDoc = await loadingTask.promise;
  const ERASE_DPI = 150;
  const scale = ERASE_DPI / 72;

  const total = byPage.size;
  let done = 0;

  const out = await PDFDocument.create();
  try {
    for (let i = 0; i < pageCount; i++) {
      const regs = byPage.get(i);
      if (!regs) {
        const [copied] = await out.copyPages(src, [i]);
        out.addPage(copied);
        continue;
      }

      const page = await pdfjsDoc.getPage(i + 1);
      try {
        // Clamp to the platform canvas ceiling (mobile ~4096 px/side) so a large-
        // format page at 150 DPI doesn't render blank and erase onto nothing; the
        // output page keeps its true point size (ptW/ptH divide by safeScale).
        const base = page.getViewport({ scale });
        const safeScale = clampScaleForCanvas(base.width, base.height, scale);
        const viewport = page.getViewport({ scale: safeScale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        // willReadFrequently: fillRegion / pixelateRegion read this canvas back
        // with getImageData, so opt into the CPU-readback-optimised path.
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Failed to acquire 2D canvas context");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        for (const r of regs) {
          const x = Math.max(0, Math.round(r.xPct * canvas.width));
          const y = Math.max(0, Math.round(r.yPct * canvas.height));
          // Clamp the extent to the canvas: independent rounding of x and w can
          // push x+w one pixel past the edge, and getImageData would then fold
          // out-of-bounds transparent-black pixels into the edge mosaic block.
          const w = Math.min(canvas.width - x, Math.round(r.wPct * canvas.width));
          const h = Math.min(canvas.height - y, Math.round(r.hPct * canvas.height));
          if (w <= 0 || h <= 0) continue;
          if (r.mode === "pixelate") pixelateRegion(ctx, x, y, w, h, r.blockFrac ?? 0.12);
          else fillRegion(ctx, canvas.width, canvas.height, x, y, w, h);
        }

        const jpeg = await canvasToImageBytes(canvas, "image/jpeg", 0.92);
        const img = await out.embedJpg(jpeg);
        const ptW = viewport.width / safeScale;
        const ptH = viewport.height / safeScale;
        const outPage = out.addPage([ptW, ptH]);
        outPage.drawImage(img, { x: 0, y: 0, width: ptW, height: ptH });

        canvas.width = 0;
        canvas.height = 0;
      } finally {
        page.cleanup();
      }
      onProgress?.(++done, total);
    }
    return out.save();
  } finally {
    void loadingTask.destroy();
  }
}
