/**
 * QR-code and barcode stamping.
 *
 * Both symbologies are drawn as **vector** rectangles straight into the page
 * content stream (no canvas, no embedded raster), so they stay razor-sharp at
 * any zoom or print DPI and add only a few KB. QR matrices come from our own
 * dependency-free encoder ([qr.ts](./qr.ts)); Code 128 is encoded here by a
 * compact self-contained encoder — no QR or barcode library is pulled in.
 *
 * Use cases this unlocks that no other in-browser PDF editor offers: dropping a
 * scannable verification URL, case number, or document hash onto a corner of
 * every page (or just the cover) — handy for legal/Bates workflows and signed
 * documents. Everything runs client-side; no file leaves the browser.
 */

import { PDFDocument, rgb, StandardFonts } from "@pdfme/pdf-lib";
import { encodeQr } from "./qr.ts";

export type CodeStampType = "qr" | "barcode";

// ── Code 128 (variant B) ───────────────────────────────────────────────────
//
// The 107 canonical Code 128 bar-width patterns (indices 0–106). Each is six
// digits giving the widths, in modules, of alternating bar/space/bar/space/…
// starting with a bar — except the Stop pattern (index 106) which carries the
// extra terminating bar. Code-set B maps a printable-ASCII char `c` to value
// `c - 32` (covers 32–126), which is everything a URL / case number needs.

const CODE128_PATTERNS = [
  "212222",
  "222122",
  "222221",
  "121223",
  "121322",
  "131222",
  "122213",
  "122312",
  "132212",
  "221213",
  "221312",
  "231212",
  "112232",
  "122132",
  "122231",
  "113222",
  "123122",
  "123221",
  "223211",
  "221132",
  "221231",
  "213212",
  "223112",
  "312131",
  "311222",
  "321122",
  "321221",
  "312212",
  "322112",
  "322211",
  "212123",
  "212321",
  "232121",
  "111323",
  "131123",
  "131321",
  "112313",
  "132113",
  "132311",
  "211313",
  "231113",
  "231311",
  "112133",
  "112331",
  "132131",
  "113123",
  "113321",
  "133121",
  "313121",
  "211331",
  "231131",
  "213113",
  "213311",
  "213131",
  "311123",
  "311321",
  "331121",
  "312113",
  "312311",
  "332111",
  "314111",
  "221411",
  "431111",
  "111224",
  "111422",
  "121124",
  "121421",
  "141122",
  "141221",
  "112214",
  "112412",
  "122114",
  "122411",
  "142112",
  "142211",
  "241211",
  "221114",
  "413111",
  "241112",
  "134111",
  "111242",
  "121142",
  "121241",
  "114212",
  "124112",
  "124211",
  "411212",
  "421112",
  "421211",
  "212141",
  "214121",
  "412121",
  "111143",
  "111341",
  "131141",
  "114113",
  "114311",
  "411113",
  "411311",
  "113141",
  "114131",
  "311141",
  "411131",
  "211412",
  "211214",
  "211232",
  "2331112",
] as const;

const CODE128_START_B = 104;
const CODE128_STOP = 106;

/**
 * Encode a printable-ASCII string to the concatenated Code 128-B bar-width
 * pattern (Start B · data · checksum · Stop). Pure and exported so the
 * encoding + checksum are unit-testable without a PDF. Throws on any character
 * outside the 32–126 range Code-set B can represent.
 */
export function encodeCode128B(content: string): string {
  const values: number[] = [CODE128_START_B];
  let checksum = CODE128_START_B;
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);
    if (code < 32 || code > 126) {
      throw new Error(`Barcode character "${content[i]}" is not encodable in Code 128-B.`);
    }
    const value = code - 32;
    values.push(value);
    checksum += value * (i + 1);
  }
  values.push(checksum % 103);
  values.push(CODE128_STOP);
  return values.map((v) => CODE128_PATTERNS[v]).join("");
}

/** Total module width of a Code 128 width-pattern string (sum of its digits). */
function patternModuleWidth(pattern: string): number {
  let total = 0;
  for (const ch of pattern) total += Number(ch);
  return total;
}

// ── explicit-rect placement (canvas editor) ─────────────────────────────────

/** A code's target box on one page, in PDF points (bottom-left origin) — the
 *  geometry the editor's place-then-drag-resize flow produces. */
export interface CodePlacement {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The symbology + payload + look; the target box is supplied per placement. */
export interface CodeArtOptions {
  type: CodeStampType;
  content: string;
  color: { r: number; g: number; b: number };
  caption: boolean;
}

/** Caption block height as a fraction of barcode bar height (0.16 font + 0.5·font gap). */
const BARCODE_CAPTION_RATIO = 0.16 * 1.5;

/**
 * Stamp a QR code or Code 128 barcode into EXPLICIT per-page boxes, drawn as
 * sharp vector art sized to fill each box. This is the editor's
 * place-then-drag-resize path — one box per placed object.
 *
 * @param file - The source PDF.
 * @param options - Symbology, payload, colour, caption.
 * @param placements - Per-page target boxes in PDF points.
 */
export async function addCodeStampAt(
  file: File,
  options: CodeArtOptions,
  placements: CodePlacement[],
): Promise<Uint8Array> {
  const content = options.content.trim();
  if (!content) throw new Error("Nothing to encode — enter the text or URL for the code.");

  const pdf = await PDFDocument.load(await file.arrayBuffer());
  const fg = rgb(options.color.r / 255, options.color.g / 255, options.color.b / 255);
  const white = rgb(1, 1, 1);
  const allPages = pdf.getPages();

  // Precompute the matrix / pattern once (identical for every placement).
  let qrCount = 0;
  let qrIsDark: (row: number, col: number) => boolean = () => false;
  if (options.type === "qr") {
    const qr = encodeQr(content, "M");
    qrCount = qr.size;
    qrIsDark = (row, col) => qr.isDark(row, col);
  }
  const barPattern = options.type === "barcode" ? encodeCode128B(content) : "";
  const barTotalModules = barPattern ? patternModuleWidth(barPattern) + 20 : 0;
  const needFont = options.type === "barcode" && options.caption;
  const font = needFont ? await pdf.embedFont(StandardFonts.Helvetica) : null;

  for (const pl of placements) {
    const page = allPages[pl.pageIndex];
    if (!page) continue;

    if (options.type === "qr") {
      // QR is square: use the box's smaller side, top-left anchored within it.
      const side = Math.max(1, Math.min(pl.width, pl.height));
      const ox = pl.x;
      const oy = pl.y + (pl.height - side); // box top
      page.drawRectangle({ x: ox, y: oy, width: side, height: side, color: white });
      const quiet = 4;
      const ms = side / (qrCount + quiet * 2);
      for (let row = 0; row < qrCount; row++) {
        for (let col = 0; col < qrCount; col++) {
          if (!qrIsDark(row, col)) continue;
          page.drawRectangle({
            x: ox + (quiet + col) * ms,
            y: oy + side - (quiet + row + 1) * ms,
            width: ms,
            height: ms,
            color: fg,
          });
        }
      }
    } else {
      const boxW = Math.max(1, pl.width);
      const boxH = Math.max(1, pl.height);
      // Split the box height into the bar band + (optional) caption block, with
      // the same proportions addCodeStamp uses so a placed code looks the same.
      const barH = options.caption ? boxH / (1 + BARCODE_CAPTION_RATIO) : boxH;
      const captionFontSize = options.caption ? barH * 0.16 : 0;
      const captionBlock = boxH - barH;
      const moduleW = boxW / barTotalModules;
      page.drawRectangle({ x: pl.x, y: pl.y, width: boxW, height: boxH, color: white });
      const barBottom = pl.y + captionBlock;
      let cursor = pl.x + 10 * moduleW; // left quiet zone
      let isBar = true;
      for (const ch of barPattern) {
        const runW = Number(ch) * moduleW;
        if (isBar) {
          page.drawRectangle({ x: cursor, y: barBottom, width: runW, height: barH, color: fg });
        }
        cursor += runW;
        isBar = !isBar;
      }
      if (font && captionFontSize > 0) {
        let capSize = captionFontSize;
        let tw = font.widthOfTextAtSize(content, capSize);
        if (tw > boxW && tw > 0) {
          capSize = Math.max(4, (capSize * boxW) / tw);
          tw = font.widthOfTextAtSize(content, capSize);
        }
        page.drawText(content, {
          x: pl.x + (boxW - tw) / 2,
          y: pl.y + capSize * 0.25,
          size: capSize,
          font,
          color: fg,
        });
      }
    }
  }

  return pdf.save();
}
