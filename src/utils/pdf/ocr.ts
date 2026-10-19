import {
  PDFDocument,
  StandardFonts,
  pushGraphicsState,
  popGraphicsState,
  concatTransformationMatrix,
} from "@pdfme/pdf-lib";
import type { LayoutPage } from "../layout-extract.ts";
import { drawOnVisiblePage } from "./page-geometry.ts";

/** Embed OCR word boxes in the visible physical page frame. Native text is kept
 * once; unsupported characters fail explicitly instead of silently losing words. */
export async function createSearchablePdfFromLayout(
  file: File,
  pages: LayoutPage[],
  onProgress?: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const byNumber = new Map(pages.map((p) => [p.pageNumber, p]));
  const pageCount = pdfDoc.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const layout = byNumber.get(i + 1);
    if (layout && layout.source !== "text") {
      if (layout.text.trim() && !layout.items.length)
        throw new Error(
          "Word positions are missing. Extract text again before making this PDF searchable.",
        );
      const page = pdfDoc.getPage(i);
      await drawOnVisiblePage(page, ({ width, height }) => {
        const sx = layout.width ? width / layout.width : 1;
        const sy = layout.height ? height / layout.height : 1;
        for (const item of layout.items) {
          const text = item.text.trim();
          if (!text) continue;
          const x = item.x * sx,
            size = item.height * sy,
            wordWidth = item.width * sx;
          if (![x, item.y, size, wordWidth].every(Number.isFinite) || size <= 0 || wordWidth <= 0)
            throw new Error(
              "Invalid word positions. Extract text again before making this PDF searchable.",
            );
          let naturalWidth: number;
          try {
            naturalWidth = font.widthOfTextAtSize(text, size);
          } catch {
            throw new Error(
              "This text contains characters the searchable PDF font cannot represent. Your document is unchanged; you can still select and copy the recognised text.",
            );
          }
          // Match both dimensions of the recognised word, independent of the
          // fallback font's advance widths. The outer matrix handles crop/rotate/unit.
          page.pushOperators(
            pushGraphicsState(),
            concatTransformationMatrix(
              wordWidth / naturalWidth,
              0,
              0,
              1,
              x,
              height - (item.y + item.height) * sy,
            ),
          );
          try {
            page.drawText(text, { x: 0, y: 0, size, font, opacity: 0 });
          } finally {
            page.pushOperators(popGraphicsState());
          }
        }
      });
    }
    onProgress?.(i + 1, pageCount);
    if (i % 16 === 15) await new Promise<void>((r) => setTimeout(r, 0));
  }
  return pdfDoc.save();
}
