/**
 * QR-code and barcode stamping.
 *
 * Both symbologies are drawn as **vector** rectangles straight into the page
 * content stream (no canvas, no embedded raster), so they stay razor-sharp at
 * any zoom or print DPI and add only a few KB. QR matrices come from the tiny
 * dependency-free `qrcode-generator`; Code 128 is encoded here by a compact
 * self-contained encoder so we pull in no barcode library.
 *
 * Use cases this unlocks that no other in-browser PDF editor offers: dropping a
 * scannable verification URL, case number, or document hash onto a corner of
 * every page (or just the cover) — handy for legal/Bates workflows and signed
 * documents. Everything runs client-side; no file leaves the browser.
 */

import { PDFDocument, rgb, StandardFonts } from "@pdfme/pdf-lib";
import qrcode from "qrcode-generator";
import type { PageNumberPosition } from "../../types.ts";

export type CodeStampType = "qr" | "barcode";

export interface CodeStampOptions {
  /** Which symbology to draw. */
  type: CodeStampType;
  /** The encoded payload — a URL, case number, hash, etc. */
  content: string;
  /** Which corner / edge of the page to place it on. */
  position: PageNumberPosition;
  /** QR side length, or barcode bar height, in PDF points. */
  size: number;
  /** Gap from the page edge, in PDF points. */
  margin: number;
  /** Foreground (module / bar) colour in 0–255 RGB. Background is always white
   *  so scanners get the dark-on-light contrast they need. */
  color: { r: number; g: number; b: number };
  /** Print the payload as human-readable text under a barcode (ignored for QR). */
  caption: boolean;
}

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

// ── geometry ───────────────────────────────────────────────────────────────

/** Bottom-left origin (PDF points) for a footprint at the chosen corner. */
function cornerOrigin(
  position: PageNumberPosition,
  pageW: number,
  pageH: number,
  boxW: number,
  boxH: number,
  margin: number,
): { x: number; y: number } {
  const isLeft = position === "top-left" || position === "bottom-left";
  const isRight = position === "top-right" || position === "bottom-right";
  const isTop = position === "top-left" || position === "top-center" || position === "top-right";
  const x = isLeft ? margin : isRight ? pageW - boxW - margin : (pageW - boxW) / 2;
  const y = isTop ? pageH - boxH - margin : margin;
  return { x, y };
}

// ── public writer ────────────────────────────────────────────────────────

/**
 * Stamp a QR code or Code 128 barcode onto a PDF.
 *
 * Drawn as vector rectangles in the page content stream. When `pageIndices` is
 * omitted every page is stamped; pass `[0]` for the cover only, or a single
 * index for the current page.
 *
 * @param file - The source PDF.
 * @param options - Symbology, payload, placement, size, colour.
 * @param pageIndices - Optional 0-based pages to stamp (default: all pages).
 * @returns New PDF bytes with the code drawn.
 */
export async function addCodeStamp(
  file: File,
  options: CodeStampOptions,
  pageIndices?: number[],
): Promise<Uint8Array> {
  const content = options.content.trim();
  if (!content) throw new Error("Nothing to encode — enter the text or URL for the code.");

  const pdf = await PDFDocument.load(await file.arrayBuffer());
  const fg = rgb(options.color.r / 255, options.color.g / 255, options.color.b / 255);
  const white = rgb(1, 1, 1);

  // Caption only applies to barcodes and only when asked for.
  const captionFontSize = options.type === "barcode" && options.caption ? options.size * 0.16 : 0;
  const captionGap = captionFontSize > 0 ? captionFontSize * 0.5 : 0;
  const captionBlock = captionFontSize > 0 ? captionFontSize + captionGap : 0;
  const font = captionFontSize > 0 ? await pdf.embedFont(StandardFonts.Helvetica) : null;

  const allPages = pdf.getPages();
  const targets = pageIndices
    ? pageIndices.filter((i) => i >= 0 && i < allPages.length).map((i) => allPages[i])
    : allPages;

  // Precompute the QR matrix once (identical on every page).
  let qrCount = 0;
  let qrIsDark: (row: number, col: number) => boolean = () => false;
  if (options.type === "qr") {
    const qr = qrcode(0, "M");
    qr.addData(content);
    qr.make();
    qrCount = qr.getModuleCount();
    qrIsDark = (row, col) => qr.isDark(row, col);
  }

  // Precompute the barcode pattern once; its module count drives the per-page
  // width (the quiet zones are 10 modules each side).
  const barPattern = options.type === "barcode" ? encodeCode128B(content) : "";
  const barTotalModules = barPattern ? patternModuleWidth(barPattern) + 20 : 0;
  const idealModuleW = Math.max(0.8, options.size / 34);

  for (const page of targets) {
    const { width: pageW, height: pageH } = page.getSize();

    if (options.type === "qr") {
      const boxW = options.size;
      const boxH = options.size;
      const { x: ox, y: oy } = cornerOrigin(
        options.position,
        pageW,
        pageH,
        boxW,
        boxH,
        options.margin,
      );
      // White backing square so the QR reads over dark page content, then the
      // dark modules with a 4-module quiet zone (the QR spec minimum).
      page.drawRectangle({ x: ox, y: oy, width: boxW, height: boxH, color: white });
      const quiet = 4;
      const ms = options.size / (qrCount + quiet * 2);
      for (let row = 0; row < qrCount; row++) {
        for (let col = 0; col < qrCount; col++) {
          if (!qrIsDark(row, col)) continue;
          page.drawRectangle({
            x: ox + (quiet + col) * ms,
            // row 0 is the top; PDF y grows upward.
            y: oy + options.size - (quiet + row + 1) * ms,
            width: ms,
            height: ms,
            color: fg,
          });
        }
      }
    } else {
      // Clamp the module width so the whole code — bars + quiet zones — never
      // overflows the page; a long Code 128 payload otherwise drew off the edge.
      const avail = Math.max(0, pageW - 2 * options.margin);
      const moduleW = Math.max(0.1, Math.min(idealModuleW, avail / barTotalModules));
      const boxW = barTotalModules * moduleW;
      const boxH = options.size + captionBlock;
      const { x: ox, y: oy } = cornerOrigin(
        options.position,
        pageW,
        pageH,
        boxW,
        boxH,
        options.margin,
      );
      // White backing covers bars + quiet zones + caption block.
      page.drawRectangle({ x: ox, y: oy, width: boxW, height: boxH, color: white });
      const barH = options.size;
      const barBottom = oy + captionBlock;
      let cursor = ox + 10 * moduleW; // left quiet zone
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
        // Shrink the caption if it would be wider than the (clamped) code.
        let capSize = captionFontSize;
        let tw = font.widthOfTextAtSize(content, capSize);
        if (tw > boxW && tw > 0) {
          capSize = Math.max(4, (capSize * boxW) / tw);
          tw = font.widthOfTextAtSize(content, capSize);
        }
        page.drawText(content, {
          x: ox + (boxW - tw) / 2,
          y: oy,
          size: capSize,
          font,
          color: fg,
        });
      }
    }
  }

  return pdf.save();
}
