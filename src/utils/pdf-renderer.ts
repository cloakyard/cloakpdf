/**
 * PDF page rendering utilities powered by PDF.js.
 *
 * Renders individual or all pages of a PDF to off-screen canvases and
 * returns the result as Blob object URLs — used for page thumbnails
 * in the editor, image export and blank-page analysis.
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
const PREVIEW_SCALE = Math.max(
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
  preview = false,
): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  const page = await pdf.getPage(pageNum);
  const natural = page.getViewport({ scale: 1 });
  // Preview memory is bounded independently of document geometry/export DPI.
  const boundedScale = preview
    ? Math.min(
        scale,
        4096 / Math.max(natural.width, natural.height),
        Math.sqrt(8_000_000 / (natural.width * natural.height)),
      )
    : scale;
  const viewport = page.getViewport({ scale: boundedScale });
  const canvas = document.createElement("canvas");
  try {
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(`Failed to acquire 2D canvas context for page ${pageNum}`);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    return { canvas, ctx };
  } catch (error) {
    canvas.width = canvas.height = 0;
    throw error;
  } finally {
    page.cleanup();
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

      try {
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

        results.push({ pageIndex, blob });
      } finally {
        canvas.width = canvas.height = 0;
      }
      onProgress?.(i + 1, pageIndices.length);
    }

    return results;
  } finally {
    void loadingTask.destroy();
  }
}

/** Render only the requested previews. A failed page stays null; successful
 * pages remain usable. Abort/fatal failures release every newly created URL.
 * Callers own the returned URLs. Never use this tolerant path for exports. */
export async function renderPagePreviews(
  file: File,
  pageIndices: number[],
  onProgress?: (rendered: number, total: number) => void,
  signal?: AbortSignal,
): Promise<(string | null)[]> {
  signal?.throwIfAborted();
  const data = await file.arrayBuffer();
  signal?.throwIfAborted();
  const task = pdfjsLib.getDocument({ data, wasmUrl: PDFJS_WASM_URL });
  const previews: (string | null)[] = [];
  try {
    const pdf = await task.promise;
    for (const index of pageIndices) {
      signal?.throwIfAborted();
      let canvas: HTMLCanvasElement | undefined;
      try {
        ({ canvas } = await renderPage(pdf, index + 1, PREVIEW_SCALE, true));
        previews.push(await canvasToBlobUrl(canvas));
      } catch {
        previews.push(null);
      } finally {
        if (canvas) canvas.width = canvas.height = 0;
      }
      signal?.throwIfAborted();
      onProgress?.(previews.length, pageIndices.length);
    }
    return previews;
  } catch (error) {
    revokeThumbnails(previews.filter((url): url is string => url !== null));
    throw error;
  } finally {
    void task.destroy();
  }
}

/** Fraction of near-white pixels per page. A failed render is never classified
 * as blank. This scan needs no encoded thumbnails or object URLs. */
export async function pageWhitenessScores(file: File): Promise<number[]> {
  const data = await file.arrayBuffer();
  const task = pdfjsLib.getDocument({ data, wasmUrl: PDFJS_WASM_URL });
  try {
    const pdf = await task.promise;
    const scores: number[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      let canvas: HTMLCanvasElement | undefined;
      try {
        const rendered = await renderPage(pdf, i, 0.3, true);
        canvas = rendered.canvas;
        const { data: pixels } = rendered.ctx.getImageData(0, 0, canvas.width, canvas.height);
        let nearWhite = 0;
        for (let p = 0; p < pixels.length; p += 4)
          if (pixels[p] >= 240 && pixels[p + 1] >= 240 && pixels[p + 2] >= 240) nearWhite++;
        scores.push(nearWhite / (canvas.width * canvas.height));
      } catch {
        scores.push(0);
      } finally {
        if (canvas) canvas.width = canvas.height = 0;
      }
    }
    return scores;
  } finally {
    void task.destroy();
  }
}
