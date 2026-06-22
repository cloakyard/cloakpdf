/**
 * Pixel analysis of rendered pages — the engine behind the Crop tool's two
 * one-tap clean-ups for scanned documents:
 *
 *   • "Trim to content" — find the ink bounding box and crop the white margins
 *     away (non-destructive: just a tighter crop box).
 *   • "Straighten"      — detect each page's skew angle from its text rows and
 *     rotate it upright (destructive: the page is rasterised, like erase).
 *
 * Both read the page through PDF.js at a modest resolution. The maths that turns
 * pixels into a bounding box / angle is split into pure exported helpers
 * ({@link inkBoundingBox}, {@link detectSkewAngle}) so it unit-tests without a
 * browser. Everything runs client-side; no file leaves the browser.
 */

import { PDFDocument, degrees } from "@pdfme/pdf-lib";
import type { PDFPageProxy } from "pdfjs-dist";
import { PDFJS_WASM_URL } from "../pdfjs-config.ts";
import { canvasToImageBytes, clampScaleForCanvas, getPdfJs } from "./raster.ts";

/** A rectangle as fractions (0–1) of page width/height, top-left origin. */
export interface ContentBox {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

// ── pure helpers (no browser — unit-testable) ──────────────────────────────

/**
 * Tightest box around the "ink" (pixels darker than `threshold`, 0–255) in a
 * grayscale buffer. Returns pixel bounds `[x0, y0)`–`[x1, y1)` (x1/y1
 * exclusive), or null when the page is blank. Pure.
 */
export function inkBoundingBox(
  gray: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
  threshold = 235,
): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (gray[row + x] < threshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < x0 || y1 < y0) return null;
  return { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

export interface SkewOptions {
  /** Largest skew to search for, degrees. Default 10. */
  maxAngle?: number;
  /** Angular search step, degrees. Default 0.25. */
  step?: number;
  /** A pixel counts as ink below this gray value (0–255). Default 160. */
  inkThreshold?: number;
}

/**
 * Estimate a page's skew angle (degrees) from its text rows, by the classic
 * projection-profile method: the angle whose horizontal ink histogram is
 * "peakiest" (maximum sum-of-squares) is the one that flattens the text lines.
 * Positive = the page is rotated clockwise and should be turned back by the same
 * amount. Returns 0 when there's too little ink to be confident. Pure.
 */
export function detectSkewAngle(
  gray: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
  options: SkewOptions = {},
): number {
  const maxAngle = options.maxAngle ?? 10;
  const step = options.step ?? 0.25;
  const inkThreshold = options.inkThreshold ?? 160;

  // Collect ink-pixel coordinates once, subsampled so a dense page stays cheap.
  const coords: number[] = [];
  let inkCount = 0;
  for (let i = 0; i < w * h; i++) if (gray[i] < inkThreshold) inkCount++;
  const stride = Math.max(1, Math.floor(inkCount / 60_000));
  let seen = 0;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (gray[row + x] < inkThreshold && seen++ % stride === 0) coords.push(x, y);
    }
  }
  if (coords.length < 40) return 0;

  const rad = Math.PI / 180;
  const offset = Math.ceil(w * Math.tan(maxAngle * rad)) + 1;
  const histLen = h + 2 * offset + 2;
  let best = 0;
  let bestScore = -1;
  for (let a = -maxAngle; a <= maxAngle + 1e-9; a += step) {
    const t = Math.tan(a * rad);
    const hist = new Float64Array(histLen);
    for (let i = 0; i < coords.length; i += 2) {
      const bucket = Math.round(coords[i + 1] - coords[i] * t) + offset;
      if (bucket >= 0 && bucket < histLen) hist[bucket]++;
    }
    let score = 0;
    for (let k = 0; k < histLen; k++) score += hist[k] * hist[k];
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

// ── browser orchestration (PDF.js render) ──────────────────────────────────

/**
 * Render an already-open PDF.js page proxy to a downscaled grayscale buffer.
 * Pure of any document lifecycle — the caller owns opening/destroying the doc —
 * so a multi-page pass (e.g. deskew) can reuse ONE parsed document instead of
 * re-opening the file per page. Releases its scratch canvas before returning.
 */
async function pageToGray(
  page: PDFPageProxy,
  maxDim: number,
): Promise<{ gray: Uint8Array; w: number; h: number } | null> {
  const base = page.getViewport({ scale: 1 });
  const s = Math.min(1, maxDim / Math.max(base.width, base.height));
  const viewport = page.getViewport({ scale: s });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(viewport.width));
  canvas.height = Math.max(1, Math.round(viewport.height));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;
  const gray = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    // Rec. 601 luma.
    gray[j] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
  }
  // Release the scratch canvas's backing store promptly (it can be large).
  canvas.width = canvas.height = 0;
  return { gray, w, h };
}

/** Open the file, render one page to grayscale, and tear the document down.
 *  For one-off analysis (content trim / single-page skew); multi-page callers
 *  should open a document once and use {@link pageToGray} directly. */
async function renderPageGray(
  file: File,
  pageIndex: number,
  maxDim: number,
): Promise<{ gray: Uint8Array; w: number; h: number } | null> {
  const pdfjs = await getPdfJs();
  const ab = await file.arrayBuffer();
  const task = pdfjs.getDocument({ data: ab, wasmUrl: PDFJS_WASM_URL });
  const doc = await task.promise;
  try {
    if (pageIndex < 0 || pageIndex >= doc.numPages) return null;
    const page = await doc.getPage(pageIndex + 1);
    try {
      return await pageToGray(page, maxDim);
    } finally {
      page.cleanup();
    }
  } finally {
    void task.destroy();
  }
}

/**
 * Detect the content (ink) bounding box of a page as a page-fraction rectangle,
 * padded slightly so descenders aren't clipped. Returns null when the page is
 * blank or already fills its frame (nothing worth trimming).
 *
 * @param file - The source PDF.
 * @param pageIndex - 0-based page to analyse.
 */
export async function detectContentBox(file: File, pageIndex: number): Promise<ContentBox | null> {
  const r = await renderPageGray(file, pageIndex, 1000);
  if (!r) return null;
  const box = inkBoundingBox(r.gray, r.w, r.h, 235);
  if (!box) return null;
  // Pad outward by ~1% of the page so glyph edges aren't shaved.
  const padX = r.w * 0.01;
  const padY = r.h * 0.01;
  const x0 = Math.max(0, box.x0 - padX);
  const y0 = Math.max(0, box.y0 - padY);
  const x1 = Math.min(r.w, box.x1 + padX);
  const y1 = Math.min(r.h, box.y1 + padY);
  const xPct = x0 / r.w;
  const yPct = y0 / r.h;
  const wPct = (x1 - x0) / r.w;
  const hPct = (y1 - y0) / r.h;
  // Already full-bleed → nothing to trim.
  if (wPct >= 0.98 && hPct >= 0.98) return null;
  return { xPct, yPct, wPct, hPct };
}

/** Detect a single page's skew angle (degrees) via PDF.js render + projection
 *  profile. Returns 0 when the page is too sparse or essentially straight. */
export async function detectPageSkew(file: File, pageIndex: number): Promise<number> {
  const r = await renderPageGray(file, pageIndex, 900);
  if (!r) return 0;
  return detectSkewAngle(r.gray, r.w, r.h);
}

export interface DeskewOptions {
  /** 0-based pages to straighten (default: all). */
  pageIndices?: number[];
  /** Skip rotation below this angle (degrees) — avoids re-rasterising pages that
   *  are already straight. Default 0.4. */
  minAngle?: number;
  onProgress?: (done: number, total: number) => void;
}

/**
 * Auto-straighten skewed pages: detect each target page's skew and, when it
 * exceeds `minAngle`, rasterise the page and rotate it upright on a white
 * background (destructive — the page becomes an image, like erase). Pages that
 * are already straight (or below the threshold) are copied through untouched,
 * keeping their vector text. Returns the original bytes when nothing needed
 * straightening.
 *
 * @returns `{ bytes, deskewed }` — the new PDF and how many pages were rotated.
 */
export async function deskewPdf(
  file: File,
  options: DeskewOptions = {},
): Promise<{ bytes: Uint8Array; deskewed: number }> {
  const minAngle = options.minAngle ?? 0.4;
  const ab = await file.arrayBuffer();
  const src = await PDFDocument.load(ab);
  const pageCount = src.getPageCount();
  const targets = new Set(options.pageIndices ?? src.getPages().map((_, i) => i));

  // Open the rendered document ONCE and reuse it for both skew detection and the
  // rotate render — re-opening the file per page made a multi-page straighten
  // re-parse the whole PDF dozens of times.
  const pdfjs = await getPdfJs();
  const task = pdfjs.getDocument({ data: ab.slice(0), wasmUrl: PDFJS_WASM_URL });
  const pdfjsDoc = await task.promise;
  const DPI = 150;
  const scale = DPI / 72;
  const out = await PDFDocument.create();
  const total = pageCount;
  let done = 0;
  try {
    // Detect skew per target page first (cheap, low-res), reusing pdfjsDoc.
    const angles = new Map<number, number>();
    for (const i of targets) {
      if (i < 0 || i >= pageCount) continue;
      const page = await pdfjsDoc.getPage(i + 1);
      try {
        const gray = await pageToGray(page, 900);
        if (gray) {
          const a = detectSkewAngle(gray.gray, gray.w, gray.h);
          if (Math.abs(a) >= minAngle) angles.set(i, a);
        }
      } finally {
        page.cleanup();
      }
    }
    if (angles.size === 0) return { bytes: await src.save(), deskewed: 0 };

    for (let i = 0; i < pageCount; i++) {
      const angle = angles.get(i);
      if (angle === undefined) {
        const [copied] = await out.copyPages(src, [i]);
        out.addPage(copied);
        options.onProgress?.(++done, total);
        continue;
      }
      const page = await pdfjsDoc.getPage(i + 1);
      try {
        const base = page.getViewport({ scale });
        const safeScale = clampScaleForCanvas(base.width, base.height, scale);
        const viewport = page.getViewport({ scale: safeScale });
        const src2 = document.createElement("canvas");
        src2.width = Math.round(viewport.width);
        src2.height = Math.round(viewport.height);
        const sctx = src2.getContext("2d");
        if (!sctx) throw new Error("no 2D context");
        sctx.fillStyle = "#ffffff";
        sctx.fillRect(0, 0, src2.width, src2.height);
        await page.render({ canvasContext: sctx, viewport, canvas: src2 }).promise;

        // Rotate the rendered page by -angle about its centre onto a same-size
        // white canvas (typical scan skew is a few degrees → corners don't clip).
        const dst = document.createElement("canvas");
        dst.width = src2.width;
        dst.height = src2.height;
        const dctx = dst.getContext("2d");
        if (!dctx) throw new Error("no 2D context");
        dctx.fillStyle = "#ffffff";
        dctx.fillRect(0, 0, dst.width, dst.height);
        dctx.translate(dst.width / 2, dst.height / 2);
        dctx.rotate((-angle * Math.PI) / 180);
        dctx.drawImage(src2, -src2.width / 2, -src2.height / 2);
        dctx.setTransform(1, 0, 0, 1, 0, 0);

        const jpeg = await canvasToImageBytes(dst, "image/jpeg", 0.92);
        const img = await out.embedJpg(jpeg);
        const ptW = viewport.width / safeScale;
        const ptH = viewport.height / safeScale;
        const outPage = out.addPage([ptW, ptH]);
        outPage.drawImage(img, { x: 0, y: 0, width: ptW, height: ptH });
        // Preserve any page /Rotate so orientation is unchanged.
        const srcRot = src.getPage(i).getRotation().angle;
        if (srcRot) outPage.setRotation(degrees(srcRot));

        src2.width = src2.height = 0;
        dst.width = dst.height = 0;
      } finally {
        page.cleanup();
      }
      options.onProgress?.(++done, total);
    }
    return { bytes: await out.save(), deskewed: angles.size };
  } finally {
    void task.destroy();
  }
}
