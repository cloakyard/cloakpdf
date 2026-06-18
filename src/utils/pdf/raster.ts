/**
 * Shared PDF.js + canvas raster layer for the PDF operation modules.
 *
 * These helpers were previously private to `pdf-operations.ts`. They are
 * `export`ed here only so sibling `pdf/*` modules can import them — they are
 * intentionally NOT re-exported from the `pdf-operations.ts` barrel, keeping
 * the public API surface identical.
 */

import type { PDFDocumentProxy } from "pdfjs-dist";

/**
 * Lazily load PDF.js and configure its Web Worker exactly once.
 * `compressPdf`, `grayscalePdf`, and `extractTextOcr` all need PDF.js
 * but it is not imported at the top level to avoid loading the worker
 * until one of these functions is actually called.
 */
let _pdfjsLib: typeof import("pdfjs-dist") | null = null;
export async function getPdfJs(): Promise<typeof import("pdfjs-dist")> {
  if (!_pdfjsLib) {
    const { default: workerSrc } = await import("pdfjs-dist/build/pdf.worker.min.mjs?worker&url");
    _pdfjsLib = await import("pdfjs-dist");
    _pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
  }
  return _pdfjsLib;
}

/**
 * Decode an image the browser can render but pdf-lib can't embed natively
 * (e.g. WebP) into PNG bytes via an off-screen canvas, so it can be passed to
 * `embedPng`. Prefers `OffscreenCanvas`; falls back to a DOM canvas.
 */
export async function decodeImageToPngBytes(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  try {
    if (typeof OffscreenCanvas !== "undefined") {
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error(`Could not decode image "${file.name}".`);
      ctx.drawImage(bitmap, 0, 0);
      const blob = await canvas.convertToBlob({ type: "image/png" });
      return new Uint8Array(await blob.arrayBuffer());
    }
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(`Could not decode image "${file.name}".`);
    ctx.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error(`Could not encode image "${file.name}" as PNG.`);
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    bitmap.close();
  }
}

/**
 * Preprocess a canvas for improved OCR accuracy.
 *
 * Converts to grayscale and applies contrast stretching so that
 * Tesseract's internal binarisation produces cleaner results.
 */
export function preprocessCanvasForOcr(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Pass 1: convert to grayscale and find min/max for contrast stretch
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = data[i + 1] = data[i + 2] = gray;
    if (gray < min) min = gray;
    if (gray > max) max = gray;
  }

  // Pass 2: contrast stretch (map [min, max] → [0, 255])
  const range = max - min || 1;
  for (let i = 0; i < data.length; i += 4) {
    const stretched = Math.round(((data[i] - min) / range) * 255);
    data[i] = data[i + 1] = data[i + 2] = stretched;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Hard cap on a rendered canvas's longest side, in pixels.
 *
 * Mobile browsers reject (or silently mis-render) canvases far smaller than
 * desktop does — iOS/Android cap a canvas at roughly 4096 px per side and by
 * total area, where desktop allows up to 32767. OCR renders at 3× (~216 DPI),
 * so a poster-sized scanned page (A1/A0) blows past the mobile ceiling: the
 * render yields a blank canvas and OCR "reads" nothing, or the tab is killed
 * for memory. Clamping the effective scale so the long edge never exceeds this
 * keeps OCR working on phones (a deliberately-supported surface) — the only
 * cost is slightly lower OCR DPI on unusually large pages, far better than a
 * blank result. Normal Letter/A4/A3 pages at OCR scale stay well under the cap,
 * so they're never touched.
 */
export const MAX_CANVAS_DIM = 4096;

/**
 * Reduce `scale` if rendering at it would produce a canvas whose longest side
 * exceeds {@link MAX_CANVAS_DIM}. `scaledWidth`/`scaledHeight` are the viewport
 * dimensions already computed at `scale`. Returns the original scale when it
 * already fits.
 */
export function clampScaleForCanvas(
  scaledWidth: number,
  scaledHeight: number,
  scale: number,
): number {
  const longest = Math.max(scaledWidth, scaledHeight);
  if (longest <= MAX_CANVAS_DIM) return scale;
  return scale * (MAX_CANVAS_DIM / longest);
}

/**
 * Render a single PDF page to a preprocessed canvas for OCR.
 * Extracted as a helper to avoid duplication between detect + recognize passes.
 */
export async function renderPageToCanvas(
  pdfDoc: PDFDocumentProxy,
  pageNum: number,
  scale: number,
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNum);
  let viewport = page.getViewport({ scale });
  // Cap oversized pages so the canvas stays inside mobile limits (see
  // MAX_CANVAS_DIM) — otherwise a poster-sized scan renders blank or OOMs.
  const safeScale = clampScaleForCanvas(viewport.width, viewport.height, scale);
  if (safeScale !== scale) viewport = page.getViewport({ scale: safeScale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(`Failed to acquire 2D canvas context for page ${pageNum}`);

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  preprocessCanvasForOcr(canvas);
  return canvas;
}

/** Encode a canvas to image bytes via `toBlob` (async, memory-friendly). */
export function canvasToImageBytes(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode redacted page image"));
          return;
        }
        blob
          .arrayBuffer()
          .then((buf) => resolve(new Uint8Array(buf)))
          .catch(reject);
      },
      type,
      quality,
    );
  });
}
