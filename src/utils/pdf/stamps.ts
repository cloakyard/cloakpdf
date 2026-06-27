/**
 * Overlay operations that draw onto pages: watermarks, seal/rectangle stamps,
 * signature placement, page numbers, headers/footers, and Bates numbering.
 */

import { PDFDocument, rgb, degrees, StandardFonts } from "@pdfme/pdf-lib";
import type {
  WatermarkOptions,
  Position,
  PageNumberOptions,
  HeaderFooterOptions,
  BatesNumberOptions,
} from "../../types.ts";
import { baseFileName, resolveStampTokens, type TokenContext } from "./tokens.ts";
import { renderStampDataUrl } from "./stamp-render.ts";

/** Decode a `data:image/png;base64,…` URL to raw bytes (no fetch round-trip). */
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const b64 = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Stamp text across the centre of each target page.
 *
 * Two visual modes share this entry point:
 *   • Plain watermark (`shape:"none"`, `finish:"digital"`, the default) — crisp
 *     Helvetica-Bold vector text, drawn directly with pdf-lib.
 *   • Shaped and/or inked stamp — a rounded box / circular seal around the text,
 *     and/or a distressed rubber-stamp "ink" finish. These are rendered to a
 *     supersampled PNG by the shared canvas painter (`renderStampDataUrl`) and
 *     embedded, because the border + ink-bleed look can't be expressed as plain
 *     pdf-lib vector ops. The same painter drives the editor's live preview, so
 *     preview and output match.
 *
 * Colour is 0–255 RGB; opacity and rotation are applied as-is. When `pageIndices`
 * is provided only those pages are stamped, otherwise every page is.
 *
 * @param file - The PDF file to stamp.
 * @param options - Stamp settings (text, fontSize, color, opacity, rotation, shape, finish).
 * @param pageIndices - Optional array of 0-based page indices to stamp.
 * @returns PDF bytes with the stamp applied.
 */
export async function addWatermark(
  file: File,
  options: WatermarkOptions,
  pageIndices?: number[],
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);

  // Token context shared across pages: {title}/{filename}/{date} are constant,
  // {page}/{total} vary, so the text is resolved per page below.
  const allPages = pdf.getPages();
  const ctxBase = {
    total: allPages.length,
    title: pdf.getTitle() ?? "",
    filename: baseFileName(file.name),
    date: new Date(),
  };
  const targets = pageIndices
    ? pageIndices
        .filter((i) => i >= 0 && i < allPages.length)
        .map((i) => ({ page: allPages[i], index: i }))
    : allPages.map((page, index) => ({ page, index }));

  const shape = options.shape ?? "none";
  const finish = options.finish ?? "digital";

  // Reverse-rotate the centre-to-origin offset so the stamp's visual centre stays
  // at the page centre after pdf-lib rotates about the draw origin (bottom-left).
  // `rotation` is the maths convention (counter-clockwise positive) — exactly
  // pdf-lib's own, so no sign flip.
  const place = (w: number, h: number, pageW: number, pageH: number) => {
    const rad = (options.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
      x: pageW / 2 - (w / 2) * cos + (h / 2) * sin,
      y: pageH / 2 - (w / 2) * sin - (h / 2) * cos,
    };
  };

  // Shaped / inked stamps render to a raster the canvas painter produces; plain
  // digital watermarks stay crisp vector text.
  if (shape !== "none" || finish === "ink") {
    const cache = new Map<
      string,
      { image: Awaited<ReturnType<typeof pdf.embedPng>>; widthPt: number; heightPt: number }
    >();
    for (const { page, index } of targets) {
      const text = resolveStampTokens(options.text, { ...ctxBase, page: index + 1 });
      if (!text.trim()) continue;
      let entry = cache.get(text);
      if (!entry) {
        const rendered = renderStampDataUrl(options.fontSize, {
          text,
          color: options.color,
          shape,
          finish,
          texture: options.inkTexture,
        });
        if (!rendered) continue;
        const image = await pdf.embedPng(dataUrlToBytes(rendered.dataUrl));
        entry = { image, widthPt: rendered.widthPt, heightPt: rendered.heightPt };
        cache.set(text, entry);
      }
      const { width, height } = page.getSize();
      const { x, y } = place(entry.widthPt, entry.heightPt, width, height);
      page.drawImage(entry.image, {
        x,
        y,
        width: entry.widthPt,
        height: entry.heightPt,
        rotate: degrees(options.rotation),
        opacity: options.opacity,
      });
    }
    return pdf.save();
  }

  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  for (const { page, index } of targets) {
    const text = resolveStampTokens(options.text, { ...ctxBase, page: index + 1 });
    if (!text) continue;
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);
    const { x, y } = place(textWidth, textHeight, width, height);
    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(options.color.r / 255, options.color.g / 255, options.color.b / 255),
      opacity: options.opacity,
      rotate: degrees(options.rotation),
    });
  }

  return pdf.save();
}

/**
 * Place a signature image onto one or more pages of a PDF.
 *
 * The signature is provided as a PNG data-URL (typically drawn on an
 * HTML canvas). It is embedded at the supplied position and size on
 * every page specified by `pageIndices`.
 *
 * @param file - The PDF file to sign.
 * @param signatureDataUrl - A `data:image/png;base64,…` string of the signature.
 * @param pageIndices - Array of 0-based page indices to place the signature on.
 * @param position - `{ x, y, width, height }` in PDF points for placement.
 * @returns PDF bytes with the signature embedded on the specified pages.
 */
export async function addSignature(
  file: File,
  signatureDataUrl: string,
  pageIndices: number[],
  position: Position | Map<number, Position>,
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);

  // Decode data URL to Uint8Array without fetch() overhead
  const commaIndex = signatureDataUrl.indexOf(",");
  if (commaIndex === -1) throw new Error("Invalid signature data URL: missing base64 payload.");
  const header = signatureDataUrl.slice(0, commaIndex);
  const signatureBytes = Uint8Array.from(atob(signatureDataUrl.slice(commaIndex + 1)), (c) =>
    c.charCodeAt(0),
  );

  const isJpeg = header.includes("image/jpeg") || header.includes("image/jpg");
  const signatureImage = isJpeg
    ? await pdf.embedJpg(signatureBytes)
    : await pdf.embedPng(signatureBytes);

  const isMap = position instanceof Map;
  const pageCount = pdf.getPageCount();

  for (const idx of pageIndices) {
    if (idx < 0 || idx >= pageCount) continue; // skip stale/out-of-range indices
    const fallback = isMap ? position.values().next().value : position;
    const pos = isMap ? (position.get(idx) ?? fallback) : position;
    if (!pos) continue;
    const page = pdf.getPage(idx);
    page.drawImage(signatureImage, {
      x: pos.x,
      y: pos.y,
      width: pos.width,
      height: pos.height,
    });
  }

  return pdf.save();
}

/**
 * Add page numbers to every (or a subset of) pages in a PDF.
 *
 * Supports six edge positions and four format presets. The total shown in
 * "1 / N" style formats accounts for the `firstPage` skip offset so numbering
 * stays consistent when a cover page is excluded.
 *
 * @param file - The source PDF file.
 * @param options - Page number styling and placement options.
 * @returns New PDF bytes with page numbers drawn.
 */
export async function addPageNumbers(file: File, options: PageNumberOptions): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const totalPages = pages.length;
  // Last visible page number = totalPages - firstPage + startNumber
  const lastPageNum = totalPages - options.firstPage + options.startNumber;

  for (let i = 0; i < totalPages; i++) {
    if (i < options.firstPage - 1) continue;

    const displayNum = i - (options.firstPage - 1) + options.startNumber;

    let text: string;
    switch (options.format) {
      case "Page 1":
        text = `Page ${displayNum}`;
        break;
      case "1 / N":
        text = `${displayNum} / ${lastPageNum}`;
        break;
      case "Page 1 of N":
        text = `Page ${displayNum} of ${lastPageNum}`;
        break;
      default:
        text = `${displayNum}`;
    }

    const page = pages[i];
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const { margin } = options;

    const isLeft = options.position === "top-left" || options.position === "bottom-left";
    const isRight = options.position === "top-right" || options.position === "bottom-right";
    const isTop =
      options.position === "top-left" ||
      options.position === "top-center" ||
      options.position === "top-right";

    const x = isLeft ? margin : isRight ? width - textWidth - margin : (width - textWidth) / 2;
    const y = isTop ? height - margin - options.fontSize : margin;

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(options.color.r / 255, options.color.g / 255, options.color.b / 255),
    });
  }

  return pdf.save();
}

/**
 * Add a header and/or footer to every page of a PDF.
 *
 * Each of the six slots (header-left/center/right, footer-left/center/right)
 * supports `{{page}}` and `{{total}}` tokens that are expanded per page.
 * Center and right text is measured before drawing so it lands correctly.
 *
 * @param file - The source PDF file.
 * @param options - Header/footer text, styling, and layout options.
 * @returns New PDF bytes with the header and footer applied.
 */
export async function addHeaderFooter(
  file: File,
  options: HeaderFooterOptions,
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const totalPages = pages.length;
  // {title}/{filename}/{date} are constant; {page}/{total} vary per page.
  const ctxBase: Omit<TokenContext, "page"> = {
    total: totalPages,
    title: pdf.getTitle() ?? "",
    filename: baseFileName(file.name),
    date: new Date(),
  };

  for (let i = 0; i < totalPages; i++) {
    if (options.skipFirstPage && i === 0) continue;

    const page = pages[i];
    const { width, height } = page.getSize();

    const resolve = (t: string) => resolveStampTokens(t, { ...ctxBase, page: i + 1 });

    const drawSlot = (raw: string, x: number, y: number) => {
      if (!raw.trim()) return;
      const text = resolve(raw);
      page.drawText(text, {
        x,
        y,
        size: options.fontSize,
        font,
        color: rgb(options.color.r / 255, options.color.g / 255, options.color.b / 255),
      });
    };

    const m = options.margin;
    const yTop = height - m - options.fontSize;
    const yBot = m;

    // Header row
    drawSlot(options.headerLeft, m, yTop);
    if (options.headerCenter.trim()) {
      const tw = font.widthOfTextAtSize(resolve(options.headerCenter), options.fontSize);
      drawSlot(options.headerCenter, (width - tw) / 2, yTop);
    }
    if (options.headerRight.trim()) {
      const tw = font.widthOfTextAtSize(resolve(options.headerRight), options.fontSize);
      drawSlot(options.headerRight, width - m - tw, yTop);
    }

    // Footer row
    drawSlot(options.footerLeft, m, yBot);
    if (options.footerCenter.trim()) {
      const tw = font.widthOfTextAtSize(resolve(options.footerCenter), options.fontSize);
      drawSlot(options.footerCenter, (width - tw) / 2, yBot);
    }
    if (options.footerRight.trim()) {
      const tw = font.widthOfTextAtSize(resolve(options.footerRight), options.fontSize);
      drawSlot(options.footerRight, width - m - tw, yBot);
    }
  }

  return pdf.save();
}

/**
 * Add Bates numbering to every page of a PDF.
 *
 * Stamps a sequential identifier (prefix + zero-padded number + suffix) at a
 * configurable position on each page. Commonly used in legal and compliance
 * workflows to uniquely identify every page in a disclosure set.
 *
 * @param file - The PDF file to number.
 * @param options - Bates numbering configuration.
 * @returns New PDF bytes with Bates numbers applied.
 */
export async function addBatesNumbers(
  file: File,
  options: BatesNumberOptions,
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const font = await pdf.embedFont(StandardFonts.Courier);

  const pages = pdf.getPages();
  const totalPages = pages.length;

  for (let i = 0; i < totalPages; i++) {
    const num = options.startNumber + i;
    const padded = String(num).padStart(options.digits, "0");
    const text = `${options.prefix}${padded}${options.suffix}`;

    const page = pages[i];
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);
    const { margin } = options;

    const isLeft = options.position === "top-left" || options.position === "bottom-left";
    const isRight = options.position === "top-right" || options.position === "bottom-right";
    const isTop =
      options.position === "top-left" ||
      options.position === "top-center" ||
      options.position === "top-right";

    const x = isLeft ? margin : isRight ? width - textWidth - margin : (width - textWidth) / 2;
    const y = isTop ? height - margin - options.fontSize : margin;

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(options.color.r / 255, options.color.g / 255, options.color.b / 255),
    });
  }

  return pdf.save();
}
