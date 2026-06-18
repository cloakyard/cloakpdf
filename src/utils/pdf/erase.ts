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
import { canvasToImageBytes, getPdfJs } from "./raster.ts";

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
        const viewport = page.getViewport({ scale });
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
        const ptW = viewport.width / scale;
        const ptH = viewport.height / scale;
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
