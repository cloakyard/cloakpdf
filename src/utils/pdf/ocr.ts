/**
 * OCR text extraction and searchable-PDF generation.
 */

import { PDFDocument, rgb, StandardFonts } from "@pdfme/pdf-lib";
import { PDFJS_WASM_URL } from "../pdfjs-config.ts";
import type { LayoutPage } from "../layout-extract.ts";
import { getPdfJs, renderPageToCanvas } from "./raster.ts";

/**
 * Map Tesseract script detection results to the most common language code.
 * Used by auto-detection to pick the right language for OCR.
 */
const SCRIPT_TO_LANGUAGE: Record<string, string> = {
  Latin: "eng",
  Han: "chi_sim",
  Hangul: "kor",
  Japanese: "jpn",
  Arabic: "ara",
  Devanagari: "hin",
  Cyrillic: "rus",
  Greek: "ell",
  Thai: "tha",
  Hebrew: "heb",
};

/**
 * Extract text from a PDF using OCR (Tesseract.js).
 *
 * Each page is rendered to a high-DPI canvas via PDF.js, preprocessed
 * for contrast, and then recognised with Tesseract.js. The structured
 * block/paragraph/line hierarchy is used to reconstruct spatially-aware
 * text output — preserving where text appears on the page.
 *
 * When `language` is `"auto"`, the first page is analysed with Tesseract's
 * script detection to automatically pick the best language model.
 *
 * @param file - The PDF file to OCR.
 * @param language - Tesseract language code, or "auto" for auto-detection.
 * @param onProgress - Optional callback: (currentPage, totalPages, status).
 * @returns Array of per-page extracted text strings.
 */
export async function extractTextOcr(
  file: File,
  language = "eng",
  onProgress?: (current: number, total: number, status?: string) => void,
): Promise<string[]> {
  const { createWorker, PSM } = await import("tesseract.js");
  const pdfjsLib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: PDFJS_WASM_URL });
  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;
  const OCR_SCALE = 3; // 3× ≈ 216 DPI for typical 72-DPI PDFs

  // --- Auto-detect language from first page ---
  let resolvedLang = language;
  if (language === "auto") {
    onProgress?.(0, totalPages, "Detecting language…");
    const detectCanvas = await renderPageToCanvas(pdfDoc, 1, OCR_SCALE);
    const detectWorker = await createWorker("osd");
    try {
      const { data } = await detectWorker.detect(detectCanvas);
      if (data.script && SCRIPT_TO_LANGUAGE[data.script]) {
        resolvedLang = SCRIPT_TO_LANGUAGE[data.script];
      } else {
        resolvedLang = "eng"; // Default fallback
      }
    } catch {
      resolvedLang = "eng";
    } finally {
      await detectWorker.terminate();
      detectCanvas.width = 0;
      detectCanvas.height = 0;
    }
  }

  const pageTexts: string[] = [];

  // `worker` is created inside the try so that a createWorker / setParameters
  // rejection still runs the finally that destroys the PDF.js document; the
  // finally only terminates a worker that was actually created.
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  try {
    // Create Tesseract worker once, reuse across all pages
    worker = await createWorker(resolvedLang);
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: "1",
    });

    for (let i = 1; i <= totalPages; i++) {
      onProgress?.(i, totalPages, `Extracting page ${i} of ${totalPages}…`);

      const canvas = await renderPageToCanvas(pdfDoc, i, OCR_SCALE);
      try {
        const { data } = await worker.recognize(canvas);

        // Build spatially-aware text from the block hierarchy
        let pageText = "";
        if (data.blocks && data.blocks.length > 0) {
          for (const block of data.blocks) {
            for (const paragraph of block.paragraphs) {
              for (const line of paragraph.lines) {
                pageText += `${line.text}\n`;
              }
              pageText += "\n"; // paragraph break
            }
          }
        } else {
          // Fallback to raw text if blocks aren't available
          pageText = data.text;
        }

        pageTexts.push(pageText.trim());
      } finally {
        // Release canvas memory even if recognition throws.
        canvas.width = 0;
        canvas.height = 0;
      }

      onProgress?.(i, totalPages);
    }
  } finally {
    await worker?.terminate();
    void loadingTask.destroy();
  }

  return pageTexts;
}

/**
 * Create a searchable PDF by overlaying invisible OCR text on each page.
 *
 * This takes the original PDF file and the per-page OCR text, then embeds
 * the text as a transparent layer on each page using pdf-lib. The result
 * looks identical to the original but is now searchable and selectable.
 *
 * @param file - The original PDF file.
 * @param pageTexts - Array of per-page OCR text strings.
 * @returns Uint8Array of the new searchable PDF.
 */
export async function createSearchablePdf(
  file: File,
  pageTexts: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pageCount = pdfDoc.getPageCount();

  for (let i = 0; i < pageCount && i < pageTexts.length; i++) {
    const text = pageTexts[i];
    if (!text) {
      onProgress?.(i + 1, pageCount);
      continue;
    }

    const page = pdfDoc.getPage(i);
    const { height } = page.getSize();

    // Split text into lines and draw each as invisible text.
    // We use a very small font size (1pt) and fully transparent colour
    // so the text is embedded in the PDF for search/select but not visible.
    const lines = text.split("\n");
    const fontSize = 1;
    const lineHeight = fontSize * 1.2;
    let y = height - fontSize; // start from top

    for (const line of lines) {
      if (!line.trim()) {
        y -= lineHeight;
        continue;
      }

      // Clamp y so we don't go below page bottom
      if (y < 0) break;

      page.drawText(line, {
        x: 0,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
        opacity: 0,
      });

      y -= lineHeight;
    }
    onProgress?.(i + 1, pageCount);
    if (i % 16 === 15) await new Promise<void>((r) => setTimeout(r, 0));
  }

  return pdfDoc.save();
}

/**
 * Create a searchable PDF whose invisible text layer is positioned at each
 * text item's true bounding box.
 *
 * This is the layout-aware successor to {@link createSearchablePdf}: instead
 * of stacking lines at a synthetic line height from the top of the page (which
 * never aligned with the underlying image), every run from
 * {@link extractLayout} is drawn at its own x/y so selecting text in a viewer
 * highlights the right place — the prerequisite for word-accurate select and
 * copy on scanned PDFs.
 *
 * liteparse reports item positions in PDF points with a top-left origin; we
 * convert to pdf-lib's bottom-left space. Each `drawText` is wrapped because
 * the standard Helvetica font can only encode WinAnsi — items with characters
 * it can't represent (e.g. CJK OCR output) are skipped rather than failing the
 * whole document; the original page image keeps them visible regardless.
 *
 * @param file  - The original PDF file.
 * @param pages - Per-page layout from {@link extractLayout}.
 * @returns Uint8Array of the new searchable PDF.
 */
export async function createSearchablePdfFromLayout(
  file: File,
  pages: LayoutPage[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pageCount = pdfDoc.getPageCount();

  const byNumber = new Map(pages.map((p) => [p.pageNumber, p]));

  for (let i = 0; i < pageCount; i++) {
    const layout = byNumber.get(i + 1);
    if (!layout) {
      onProgress?.(i + 1, pageCount);
      continue;
    }

    const page = pdfDoc.getPage(i);
    const { width: pdfW, height: pdfH } = page.getSize();
    // liteparse coordinates are in the source page's point space; scale to the
    // pdf-lib page in case the two differ (defensive — usually identical).
    const sx = layout.width ? pdfW / layout.width : 1;
    const sy = layout.height ? pdfH / layout.height : 1;

    for (const item of layout.items) {
      const text = item.text.trim();
      if (!text) continue;
      const size = Math.max(1, (item.fontSize || item.height) * sy);
      // Baseline sits at the bottom of the item box; convert top-left → bottom-left.
      const x = item.x * sx;
      const y = pdfH - (item.y + item.height) * sy;
      try {
        page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0), opacity: 0 });
      } catch {
        // Unencodable glyphs for Helvetica — skip this run, keep the rest.
      }
    }
    onProgress?.(i + 1, pageCount);
    // Yield every 16 pages so React can repaint the progress bar on big docs.
    if (i % 16 === 15) await new Promise<void>((r) => setTimeout(r, 0));
  }

  return pdfDoc.save();
}
