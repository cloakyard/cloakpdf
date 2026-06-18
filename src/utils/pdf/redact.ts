/**
 * Destructive redaction — rasterise box-carrying pages and burn the boxes in.
 */

import { PDFDocument } from "@pdfme/pdf-lib";
import { PDFJS_WASM_URL } from "../pdfjs-config.ts";
import { getPdfJs, canvasToImageBytes } from "./raster.ts";

/** One redaction box, in page fractions, with an optional burned-in appearance.
 *  `fillColor` / `borderColor` are any CSS colour string; defaults keep the
 *  conventional solid-black bar with no border for callers that omit them. */
export interface RedactionRegion {
  pageIndex: number;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  /** Box fill burned into the pixels. Default `#000000`. */
  fillColor?: string;
  /** Box border burned into the pixels. Omit for no border. */
  borderColor?: string;
}

/**
 * Permanently redact regions of a PDF — destructively.
 *
 * A black rectangle drawn on top of a page is NOT a redaction: the text and
 * images underneath survive in the byte stream and are trivially recovered by
 * copy/paste or text extraction. So instead, any page that carries a redaction
 * is **rasterised, has the boxes burned into the pixels, and is rebuilt as an
 * image-only page** — the original text/vectors under (and around) the boxes no
 * longer exist in the output. Pages without redactions are copied through
 * untouched, so they keep their crisp vector text and small size.
 *
 * Box appearance (fill + optional border colour) is per-region so the user's
 * chosen colours burn in exactly as previewed; content destruction is identical
 * regardless of colour (the page is rasterised either way).
 *
 * Trade-off (surfaced in the UI): redacted pages become flattened images —
 * their remaining text is no longer selectable and the file grows. That is the
 * standard, defensible cost of true redaction.
 *
 * Coordinates are fractions (0-1) of page width/height from the top-left.
 *
 * @param file - The source PDF file.
 * @param redactions - Array of redaction regions per page.
 * @returns A new PDF with the redacted areas permanently destroyed.
 */
export async function redactPdf(
  file: File,
  redactions: RedactionRegion[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const src = await PDFDocument.load(arrayBuffer);
  const pageCount = src.getPageCount();

  // Group redaction rects by page.
  const byPage = new Map<number, typeof redactions>();
  for (const r of redactions) {
    if (r.pageIndex < 0 || r.pageIndex >= pageCount) continue;
    const list = byPage.get(r.pageIndex) ?? [];
    list.push(r);
    byPage.set(r.pageIndex, list);
  }
  if (byPage.size === 0) return src.save();

  const pdfjsLib = await getPdfJs();
  // PDF.js may detach the backing buffer — hand it its own copy so `src`
  // (used for copying untouched pages) stays valid.
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0), wasmUrl: PDFJS_WASM_URL });
  const pdfjsDoc = await loadingTask.promise;
  const REDACT_DPI = 150;
  const scale = REDACT_DPI / 72;

  // Only the box-carrying pages do real (slow) rasterisation work — report
  // progress over those, since the copy-through pages are near-instant.
  const total = byPage.size;
  let done = 0;

  const out = await PDFDocument.create();
  try {
    for (let i = 0; i < pageCount; i++) {
      const rects = byPage.get(i);
      if (!rects) {
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
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Failed to acquire 2D canvas context");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        // Burn the redaction boxes into the pixels, each with its own colours.
        for (const r of rects) {
          const x = r.xPct * canvas.width;
          const y = r.yPct * canvas.height;
          const w = r.wPct * canvas.width;
          const h = r.hPct * canvas.height;
          ctx.fillStyle = r.fillColor ?? "#000000";
          ctx.fillRect(x, y, w, h);
          if (r.borderColor) {
            ctx.strokeStyle = r.borderColor;
            ctx.lineWidth = Math.max(1, Math.round(scale)); // ~1 pt at REDACT_DPI
            ctx.strokeRect(x, y, w, h);
          }
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
