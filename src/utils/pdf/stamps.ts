/**
 * Overlay operations that draw onto pages: watermarks, seal/rectangle stamps,
 * signature placement, page numbers, headers/footers, and Bates numbering.
 */

import {
  PDFDocument,
  PDFNumber,
  PDFOperator,
  PDFOperatorNames,
  rgb,
  degrees,
  StandardFonts,
} from "@pdfme/pdf-lib";
import type {
  WatermarkOptions,
  Position,
  PageNumberOptions,
  HeaderFooterOptions,
  BatesNumberOptions,
} from "../../types.ts";

/**
 * Add a text watermark to pages of a PDF.
 *
 * The watermark is drawn at the centre of each target page using Helvetica Bold.
 * Colour is specified in 0–255 RGB and converted to the 0–1 range required
 * by pdf-lib. Opacity and rotation are applied as-is.
 *
 * When `pageIndices` is provided, only the specified pages receive the
 * watermark. Otherwise every page is watermarked.
 *
 * @param file - The PDF file to watermark.
 * @param options - Watermark settings (text, fontSize, color, opacity, rotation).
 * @param pageIndices - Optional array of 0-based page indices to watermark.
 * @returns PDF bytes with the watermark applied.
 */
export async function addWatermark(
  file: File,
  options: WatermarkOptions,
  pageIndices?: number[],
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);

  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pages = pageIndices ? pageIndices.map((i) => pdf.getPage(i)) : pdf.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    // pdf-lib rotates text around its draw origin (bottom-left of glyph).
    // To keep the visual center of the rotated text at the page center,
    // we reverse-rotate the text-center-to-origin offset from page center.
    // Negate rotation: CSS uses clockwise-positive, pdf-lib uses
    // counter-clockwise-positive.
    const pdfRotation = -options.rotation;
    const rad = (pdfRotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const x = width / 2 - (textWidth / 2) * cos + (textHeight / 2) * sin;
    const y = height / 2 - (textWidth / 2) * sin - (textHeight / 2) * cos;

    page.drawText(options.text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(options.color.r / 255, options.color.g / 255, options.color.b / 255),
      opacity: options.opacity,
      rotate: degrees(pdfRotation),
    });
  }

  return pdf.save();
}

/**
 * Apply a seal-style stamp to pages of a PDF.
 *
 * Draws a classic rubber-seal graphic: two concentric circles forming a
 * border ring, two small decorative "★" markers at the 9-o'clock and
 * 3-o'clock positions, and the stamp text centered horizontally inside
 * the inner circle. All elements inherit the caller's colour and opacity.
 *
 * @param file - The PDF file to stamp.
 * @param text - The stamp label (e.g. "APPROVED").
 * @param fontSize - Font size in PDF points for the label.
 * @param color - RGB colour with values in the 0–255 range.
 * @param opacity - Opacity from 0 (fully transparent) to 1 (fully opaque).
 * @param pageIndices - Optional array of 0-based page indices to stamp.
 * @returns PDF bytes with the seal stamp applied.
 */
export async function addSealStamp(
  file: File,
  text: string,
  fontSize: number,
  color: { r: number; g: number; b: number },
  opacity: number,
  pageIndices?: number[],
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);

  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pages = pageIndices ? pageIndices.map((i) => pdf.getPage(i)) : pdf.getPages();

  const pdfColor = rgb(color.r / 255, color.g / 255, color.b / 255);

  // Measure the text so we can size the seal around it
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const textHeight = font.heightAtSize(fontSize);

  // The inner radius must be large enough that the full text fits inside
  // with comfortable padding on each side.
  const horizontalPadding = fontSize * 0.8;
  const innerRadius = textWidth / 2 + horizontalPadding;
  const outerRadius = innerRadius + fontSize * 0.6;
  const borderThickness = fontSize * 0.15;

  // Rotation angle in degrees — positive here because PDF Y-axis points up,
  // which mirrors the visual direction vs SVG/CSS (which use -12).
  const rotationDeg = 12;
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const cx = width / 2;
    const cy = height / 2;

    // Apply rotation around page center using a content stream transform.
    // The cm operator sets a transformation matrix: [cos sin -sin cos tx ty]
    // We translate origin to center, rotate, then translate back.
    const tx = cx - cos * cx + sin * cy;
    const ty = cy - sin * cx - cos * cy;
    page.pushOperators(
      PDFOperator.of(PDFOperatorNames.PushGraphicsState),
      PDFOperator.of(PDFOperatorNames.ConcatTransformationMatrix, [
        PDFNumber.of(cos),
        PDFNumber.of(sin),
        PDFNumber.of(-sin),
        PDFNumber.of(cos),
        PDFNumber.of(tx),
        PDFNumber.of(ty),
      ]),
    );

    // Outer circle
    page.drawCircle({
      x: cx,
      y: cy,
      size: outerRadius,
      borderColor: pdfColor,
      borderWidth: borderThickness,
      opacity: 0,
      borderOpacity: opacity,
    });

    // Inner circle
    page.drawCircle({
      x: cx,
      y: cy,
      size: innerRadius,
      borderColor: pdfColor,
      borderWidth: borderThickness * 0.7,
      opacity: 0,
      borderOpacity: opacity,
    });

    // Horizontal divider lines above and below the text
    const lineHalfWidth = innerRadius * 0.75;
    const lineGap = textHeight * 1.2;

    // Line above text
    page.drawLine({
      start: { x: cx - lineHalfWidth, y: cy + lineGap },
      end: { x: cx + lineHalfWidth, y: cy + lineGap },
      thickness: borderThickness * 0.5,
      color: pdfColor,
      opacity,
    });

    // Line below text
    page.drawLine({
      start: { x: cx - lineHalfWidth, y: cy - lineGap },
      end: { x: cx + lineHalfWidth, y: cy - lineGap },
      thickness: borderThickness * 0.5,
      color: pdfColor,
      opacity,
    });

    // Decorative dots at 9-o'clock and 3-o'clock
    const midRingRadius = (innerRadius + outerRadius) / 2;
    const dotRadius = fontSize * 0.12;

    // Left dot (9-o'clock)
    page.drawCircle({
      x: cx - midRingRadius,
      y: cy,
      size: dotRadius,
      color: pdfColor,
      opacity,
    });

    // Right dot (3-o'clock)
    page.drawCircle({
      x: cx + midRingRadius,
      y: cy,
      size: dotRadius,
      color: pdfColor,
      opacity,
    });

    // Main stamp text — centered
    page.drawText(text, {
      x: cx - textWidth / 2,
      y: cy - textHeight / 2,
      size: fontSize,
      font,
      color: pdfColor,
      opacity,
    });

    // Restore graphics state (end rotation)
    page.pushOperators(PDFOperator.of(PDFOperatorNames.PopGraphicsState));
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

  for (const idx of pageIndices) {
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

  for (let i = 0; i < totalPages; i++) {
    if (options.skipFirstPage && i === 0) continue;

    const page = pages[i];
    const { width, height } = page.getSize();
    const pageNum = i + 1;

    const resolve = (t: string) =>
      t.replace(/\{\{page\}\}/g, String(pageNum)).replace(/\{\{total\}\}/g, String(totalPages));

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

/**
 * Add a rectangle stamp with rounded corners to PDF pages.
 *
 * Uses the @pdfme/pdf-lib `radius` option on `drawRectangle`.
 */
export async function addRectangleStamp(
  file: File,
  text: string,
  fontSize: number,
  color: { r: number; g: number; b: number },
  opacity: number,
  pageIndices?: number[],
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);

  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pageIndices ? pageIndices.map((i) => pdf.getPage(i)) : pdf.getPages();
  const pdfColor = rgb(color.r / 255, color.g / 255, color.b / 255);

  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const textHeight = font.heightAtSize(fontSize);
  const padX = fontSize * 1.2;
  const padY = fontSize * 0.6;
  const rectWidth = textWidth + padX * 2;
  const rectHeight = textHeight + padY * 2;
  const borderThickness = fontSize * 0.12;
  const cornerRadius = fontSize * 0.4;

  const rotationDeg = -12;
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const cx = width / 2;
    const cy = height / 2;

    const tx = cx - cos * cx + sin * cy;
    const ty = cy - sin * cx - cos * cy;
    page.pushOperators(
      PDFOperator.of(PDFOperatorNames.PushGraphicsState),
      PDFOperator.of(PDFOperatorNames.ConcatTransformationMatrix, [
        PDFNumber.of(cos),
        PDFNumber.of(sin),
        PDFNumber.of(-sin),
        PDFNumber.of(cos),
        PDFNumber.of(tx),
        PDFNumber.of(ty),
      ]),
    );

    page.drawRectangle({
      x: cx - rectWidth / 2,
      y: cy - rectHeight / 2,
      width: rectWidth,
      height: rectHeight,
      borderColor: pdfColor,
      borderWidth: borderThickness,
      borderOpacity: opacity,
      color: pdfColor,
      opacity: opacity * 0.08,
      radius: cornerRadius,
    });

    page.drawText(text, {
      x: cx - textWidth / 2,
      y: cy - textHeight / 2,
      size: fontSize,
      font,
      color: pdfColor,
      opacity,
    });

    page.pushOperators(PDFOperator.of(PDFOperatorNames.PopGraphicsState));
  }

  return pdf.save();
}
