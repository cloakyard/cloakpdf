/**
 * PDF page rendering utilities powered by PDF.js.
 *
 * Renders individual or all pages of a PDF to off-screen canvases and
 * returns the result as Blob object URLs — used for page thumbnails
 * across the Split, Rotate, Delete, Reorder, Watermark, and Signature tools.
 *
 * Callers must revoke the returned URLs when they are no longer needed
 * (e.g. when the component unmounts or a new file is loaded) using
 * {@link revokeThumbnails}.
 */

import type { PDFDocumentProxy } from "pdfjs-dist";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?worker&url";
import { PDFJS_WASM_URL } from "./pdfjs-config.ts";

// PDF.js requires a Web Worker for parsing. The `?worker&url` Vite suffix
// ensures the worker file is emitted as a standalone asset with the correct
// base path, even when deployed under a subpath like /cloakpdf/.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/** Re-export the configured PDF.js library so other modules don't need to set up the worker. */
export { pdfjsLib };

/**
 * Render scale for full-panel page previews (e.g. the large image shown in
 * Stamp, Bates, Header/Footer, Page Numbers, Signature, Crop, Redact).
 *
 * Grid thumbnails get by on ~0.4 because they display at ~120 CSS px. Large
 * previews fill the preview panel (often 500–800 CSS px) and then get doubled
 * on HiDPI displays, so a 0.4 render upscales by ~4–8× and looks blurry.
 *
 * We pick `max(1.5, devicePixelRatio)` so the bitmap has enough pixels for any
 * reasonable panel width on both standard and retina screens, without paying
 * the cost of a very high scale on every page.
 */
export const PREVIEW_SCALE = Math.max(
  1.5,
  typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
);

/** Convert a canvas to a Blob object URL (PNG). ~33% smaller than data-URLs. */
function canvasToBlobUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(URL.createObjectURL(blob));
      else reject(new Error("Canvas toBlob returned null"));
    }, "image/png");
  });
}

/**
 * Revoke an array of Blob object URLs to free browser memory.
 * Safe to call with data-URLs or empty strings — they are silently skipped.
 */
export function revokeThumbnails(urls: string[]): void {
  for (const url of urls) {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }
}

/**
 * Render a single PDF page (1-based) onto a canvas at the given scale.
 * Returns both the canvas and its 2D context so callers can do pixel-level
 * work (e.g. whiteness scoring) without a second getContext() call.
 * The caller is responsible for zeroing canvas dimensions to release bitmap memory.
 *
 * @param pdf - An already-loaded PDFDocumentProxy.
 * @param pageNum - 1-based page number to render.
 * @param scale - Render scale factor.
 * @returns `{ canvas, ctx }` ready for use.
 */
async function renderPage(
  pdf: PDFDocumentProxy,
  pageNum: number,
  scale: number,
  cleanup = true,
): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error(`Failed to acquire 2D canvas context for page ${pageNum}`);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  // Release this page's decoded fonts / operator list / images now, so a
  // full-document render doesn't pile every page's cache onto the proxy until
  // the final destroy() (peak-memory spike on large PDFs at retina scale).
  // The OCR scan path passes cleanup=false: it re-reads the page's text layer
  // straight after and runs its own cleanup() once it's done with both.
  if (cleanup) page.cleanup();
  return { canvas, ctx };
}

/**
 * Return the total number of pages in a PDF file.
 *
 * @param file - The PDF file to inspect.
 * @returns Total page count.
 */
export async function getPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: PDFJS_WASM_URL });
  try {
    const pdf = await loadingTask.promise;
    return pdf.numPages;
  } finally {
    void loadingTask.destroy();
  }
}

/**
 * Render specific pages of a PDF (1-based page numbers) from a single document
 * load. Rendering from one load (rather than once per page) is required because
 * PDF.js transfers (detaches) the ArrayBuffer to its Web Worker on the first
 * call, so a second load of the same buffer would fail.
 *
 * @param file - The PDF file to render from.
 * @param pageNums - 1-based page numbers to render, in any order.
 * @param scale - Render scale factor (default 0.4).
 * @returns Blob object URLs in the same order as `pageNums`. Caller must revoke when done.
 */
export async function renderSpecificThumbnails(
  file: File,
  pageNums: number[],
  scale = 0.4,
): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: PDFJS_WASM_URL });
  try {
    const pdf = await loadingTask.promise;
    const results: string[] = [];

    for (const pageNum of pageNums) {
      const { canvas } = await renderPage(pdf, pageNum, scale);
      results.push(await canvasToBlobUrl(canvas));
      canvas.width = 0;
      canvas.height = 0;
    }

    return results;
  } finally {
    void loadingTask.destroy();
  }
}

/**
 * Render selected pages of a PDF to image Blobs at a given DPI.
 *
 * Pages are rendered sequentially to avoid excessive memory usage.
 * The PDF document is destroyed after all pages are processed.
 *
 * @param file - The PDF file whose pages should be rendered.
 * @param pageIndices - 0-based indices of the pages to render.
 * @param dpi - Output resolution (72 / 150 / 300).
 * @param format - MIME type for the output image ("image/png" or "image/jpeg").
 * @param quality - JPEG quality in 0–1 range (ignored for PNG).
 * @param onProgress - Optional callback invoked after each page: (rendered, total).
 * @returns Array of `{ pageIndex, blob }` in the same order as `pageIndices`.
 */
export async function renderPagesToBlobs(
  file: File,
  pageIndices: number[],
  dpi: number,
  format: "image/png" | "image/jpeg",
  quality = 0.92,
  onProgress?: (rendered: number, total: number) => void,
): Promise<{ pageIndex: number; blob: Blob }[]> {
  const arrayBuffer = await file.arrayBuffer();
  const scale = dpi / 72;
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: PDFJS_WASM_URL });
  try {
    const pdf = await loadingTask.promise;
    const results: { pageIndex: number; blob: Blob }[] = [];

    for (let i = 0; i < pageIndices.length; i++) {
      const pageIndex = pageIndices[i];
      const { canvas } = await renderPage(pdf, pageIndex + 1, scale);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error(`Failed to render page ${pageIndex + 1} to image`));
          },
          format,
          quality,
        );
      });

      canvas.width = 0;
      canvas.height = 0;

      results.push({ pageIndex, blob });
      onProgress?.(i + 1, pageIndices.length);
    }

    return results;
  } finally {
    void loadingTask.destroy();
  }
}

/**
 * Render every page of a PDF file into an array of PNG Blob object URL thumbnails.
 *
 * Pages are rendered sequentially to avoid excessive memory usage.
 * The PDF document is destroyed after all pages are processed.
 *
 * @param file - The PDF file whose pages should be rendered.
 * @param scale - Render scale factor (default 0.4 for lighter thumbnails).
 * @param onProgress - Optional callback invoked after each page: (rendered, total).
 *   Lets tools show a determinate progress bar while a large PDF renders.
 * @returns An ordered array of `blob:…` URLs, one per page. Caller must revoke when done.
 */
export async function renderAllThumbnails(
  file: File,
  scale = 0.4,
  onProgress?: (rendered: number, total: number) => void,
): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: PDFJS_WASM_URL });
  try {
    const pdf = await loadingTask.promise;
    const thumbnails: string[] = [];
    const total = pdf.numPages;

    for (let i = 1; i <= total; i++) {
      const { canvas } = await renderPage(pdf, i, scale);
      thumbnails.push(await canvasToBlobUrl(canvas));
      canvas.width = 0;
      canvas.height = 0;
      onProgress?.(i, total);
    }

    return thumbnails;
  } finally {
    void loadingTask.destroy();
  }
}

/** Result of {@link renderThumbnailsAndScan}: previews + digital/scanned split. */
export interface ThumbnailsScanResult {
  thumbnails: string[];
  /** Total page count. */
  total: number;
  /** 1-based page numbers with no usable text layer (need Tesseract OCR). */
  scannedPages: number[];
}

/**
 * Render thumbnails AND classify each page (digital vs scanned) in a single
 * pass over one decoded document.
 *
 * Used by the OCR tool so it can be upfront about what was uploaded and hide
 * the Tesseract engine/language download UI for fully-digital PDFs — without
 * paying a second `getDocument()` decode (the previous "render, then classify
 * separately" path opened the file twice). Per-page work is wrapped so a single
 * page that fails to render or whose text layer can't be read degrades that one
 * page (blank thumbnail / treated as scanned) instead of failing the whole
 * load. A document that won't open at all still rejects — it can't be OCR'd
 * either way.
 */
export async function renderThumbnailsAndScan(
  file: File,
  scale = 0.4,
  minTextChars = 16,
  onProgress?: (rendered: number, total: number) => void,
): Promise<ThumbnailsScanResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: PDFJS_WASM_URL });
  const thumbnails: string[] = [];
  const scannedPages: number[] = [];
  let total = 0;
  try {
    // Inside the try so the finally's destroy() also runs if the doc won't open.
    const pdf = await loadingTask.promise;
    total = pdf.numPages;
    for (let i = 1; i <= total; i++) {
      try {
        // cleanup=false: we re-read this same page's text layer just below and
        // run page.cleanup() once after both, so renderPage must not clean early.
        const { canvas } = await renderPage(pdf, i, scale, false);
        thumbnails.push(await canvasToBlobUrl(canvas));
        canvas.width = 0;
        canvas.height = 0;
      } catch {
        // One unrenderable page shouldn't blank the whole preview strip.
        thumbnails.push("");
      }
      try {
        // pdf.js caches getPage, so this re-uses the page renderPage just fetched.
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        let chars = 0;
        for (const raw of content.items as Array<{ str?: string }>) {
          chars += (raw.str ?? "").replace(/\s+/g, "").length;
          if (chars >= minTextChars) break;
        }
        if (chars < minTextChars) scannedPages.push(i);
        page.cleanup();
      } catch {
        // Unreadable text layer → treat the page as scanned (conservative: the
        // user gets the OCR controls rather than a wrong "digital" banner).
        scannedPages.push(i);
      }
      onProgress?.(i, total);
    }
  } finally {
    void loadingTask.destroy();
  }
  return { thumbnails, total, scannedPages };
}

/**
 * Render every page of a PDF and return both thumbnails and per-page whiteness scores.
 *
 * Each whiteness score is the fraction of pixels (0–1) whose R, G, and B channels
 * are all ≥ 240. A score near 1.0 indicates a near-blank (white) page.
 * Both arrays are in page order and have the same length.
 *
 * @param file - The PDF file to analyse.
 * @param scale - Render scale factor (default 0.3 — small size is enough for detection).
 * @returns `{ thumbnails, scores }` where thumbnails are Blob object URLs and scores are 0–1.
 */
export async function renderThumbnailsAndScores(
  file: File,
  scale = 0.3,
): Promise<{ thumbnails: string[]; scores: number[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: PDFJS_WASM_URL });
  try {
    const pdf = await loadingTask.promise;
    const thumbnails: string[] = [];
    const scores: number[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      let canvas: HTMLCanvasElement;
      let ctx: CanvasRenderingContext2D;
      try {
        ({ canvas, ctx } = await renderPage(pdf, i, scale));
      } catch {
        thumbnails.push("");
        scores.push(0);
        continue;
      }

      thumbnails.push(await canvasToBlobUrl(canvas));

      // Count pixels where all channels are near-white (≥ 240)
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let nearWhite = 0;
      const totalPixels = canvas.width * canvas.height;
      for (let p = 0; p < data.length; p += 4) {
        if (data[p] >= 240 && data[p + 1] >= 240 && data[p + 2] >= 240) nearWhite++;
      }
      scores.push(totalPixels > 0 ? nearWhite / totalPixels : 0);

      canvas.width = 0;
      canvas.height = 0;
    }

    return { thumbnails, scores };
  } finally {
    void loadingTask.destroy();
  }
}
