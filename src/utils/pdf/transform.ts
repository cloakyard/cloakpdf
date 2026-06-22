/**
 * Raster- and geometry-based page transforms: compression, grayscale,
 * images-to-PDF, N-up, and crop/uncrop.
 */

import { PDFDocument, PDFName, rgb } from "@pdfme/pdf-lib";
import type { CropMargins } from "../../types.ts";
import { PDFJS_WASM_URL } from "../pdfjs-config.ts";
import { clampScaleForCanvas, decodeImageToPngBytes, getPdfJs } from "./raster.ts";

/**
 * Compress a PDF by re-rendering each page as a JPEG image.
 *
 * This is a lossy compression strategy: every page is rasterised via PDF.js
 * at a configurable scale, converted to JPEG at a given quality, and then
 * re-embedded into a brand-new PDF document. Vector content and selectable
 * text are lost, but the file size can be dramatically reduced.
 *
 * The render `scale` is pure supersampling — the output page is always sized
 * at 1.0× (`origViewport` below), so `scale` only sets how many pixels the JPEG
 * carries. More pixels → bigger JPEG. Higher compression therefore renders at a
 * *lower* scale (fewer pixels, also faster + less memory), not a higher one.
 *
 * Quality presets:
 *   - `low`    → scale 2.0×, JPEG quality 82% (sharpest pages, lightest drop)
 *   - `medium` → scale 1.5×, JPEG quality 68% (balanced)
 *   - `high`   → scale 1.0×, JPEG quality 50% (smallest file, softest pages)
 *
 * Rasterising a text/vector PDF can produce a *larger* file than the original
 * at any preset, so we keep the smaller of (original, rasterised) and never
 * hand back an inflated "compressed" file.
 *
 * @param file - The PDF file to compress.
 * @param quality - Compression preset: "low", "medium", or "high".
 * @returns Compressed PDF bytes.
 */
export async function compressPdf(
  file: File,
  quality: "low" | "medium" | "high" = "medium",
  onProgress?: (rendered: number, total: number) => void,
): Promise<Uint8Array> {
  const qualitySettings = {
    low: { scale: 2.0, jpegQuality: 0.82 },
    medium: { scale: 1.5, jpegQuality: 0.68 },
    high: { scale: 1.0, jpegQuality: 0.5 },
  };

  const { scale, jpegQuality } = qualitySettings[quality];

  const pdfjsLib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: PDFJS_WASM_URL });
  const sourcePdf = await loadingTask.promise;
  const newPdf = await PDFDocument.create();

  try {
    for (let i = 1; i <= sourcePdf.numPages; i++) {
      const page = await sourcePdf.getPage(i);
      // Clamp the render scale to the platform canvas ceiling (mobile ~4096
      // px/side); a large page would otherwise render blank → a blank output
      // page. Output size uses origViewport below, so this only affects fidelity.
      const base = page.getViewport({ scale });
      const safeScale = clampScaleForCanvas(base.width, base.height, scale);
      const viewport = page.getViewport({ scale: safeScale });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error(`Failed to acquire 2D canvas context for page ${i}`);

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;

      // Convert to JPEG via toBlob (avoids the overhead of a data-URL round-trip)
      const jpegBytes = await new Promise<Uint8Array>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Canvas toBlob returned null"));
            blob.arrayBuffer().then((ab) => resolve(new Uint8Array(ab)), reject);
          },
          "image/jpeg",
          jpegQuality,
        );
      });

      // Release canvas bitmap memory
      canvas.width = 0;
      canvas.height = 0;

      const image = await newPdf.embedJpg(jpegBytes);

      // Use original page dimensions (in PDF points)
      const origViewport = page.getViewport({ scale: 1.0 });
      const newPage = newPdf.addPage([origViewport.width, origViewport.height]);
      newPage.drawImage(image, {
        x: 0,
        y: 0,
        width: origViewport.width,
        height: origViewport.height,
      });

      onProgress?.(i, sourcePdf.numPages);
      await new Promise((r) => setTimeout(r, 0));
    }

    const compressed = await newPdf.save({
      useObjectStreams: true,
    });

    // Rasterising a text/vector PDF can weigh more than the original. If we
    // didn't actually shrink it, return the source bytes untouched rather than
    // hand back a bigger "compressed" file. Re-read from the File — the
    // arrayBuffer above may have been detached by the PDF.js worker.
    if (compressed.byteLength >= file.size) {
      return new Uint8Array(await file.arrayBuffer());
    }
    return compressed;
  } finally {
    // Always release the PDF.js document + worker session, even on a mid-page throw.
    void loadingTask.destroy();
  }
}

/**
 * Convert all pages of a PDF to grayscale.
 *
 * Each page is rendered at 2× via PDF.js, its pixels are converted to
 * grayscale using the standard luminance formula (Y = 0.299R + 0.587G +
 * 0.114B), and then re-embedded as a PNG in a new pdf-lib document.
 * PNG is used (rather than JPEG) to avoid compression artefacts on text.
 *
 * @param file - The PDF file to convert.
 * @returns Grayscale PDF bytes.
 */
export async function grayscalePdf(
  file: File,
  onProgress?: (rendered: number, total: number) => void,
): Promise<Uint8Array> {
  const SCALE = 2.0;

  const pdfjsLib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: PDFJS_WASM_URL });
  const sourcePdf = await loadingTask.promise;
  const newPdf = await PDFDocument.create();

  try {
    for (let i = 1; i <= sourcePdf.numPages; i++) {
      const page = await sourcePdf.getPage(i);
      // Clamp to the platform canvas ceiling so a large page doesn't render blank
      // (output size comes from origViewport below, so fidelity-only).
      const base = page.getViewport({ scale: SCALE });
      const safeScale = clampScaleForCanvas(base.width, base.height, SCALE);
      const viewport = page.getViewport({ scale: safeScale });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error(`Failed to acquire 2D canvas context for page ${i}`);

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;

      // Convert pixels to grayscale in-place using luminance formula
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let p = 0; p < data.length; p += 4) {
        const gray = Math.round(0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]);
        data[p] = gray;
        data[p + 1] = gray;
        data[p + 2] = gray;
      }
      ctx.putImageData(imageData, 0, 0);

      const pngBytes = await new Promise<Uint8Array>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Canvas toBlob returned null"));
          blob.arrayBuffer().then((ab) => resolve(new Uint8Array(ab)), reject);
        }, "image/png");
      });

      // Release canvas bitmap memory
      canvas.width = 0;
      canvas.height = 0;

      const image = await newPdf.embedPng(pngBytes);
      const origViewport = page.getViewport({ scale: 1.0 });
      const newPage = newPdf.addPage([origViewport.width, origViewport.height]);
      newPage.drawImage(image, {
        x: 0,
        y: 0,
        width: origViewport.width,
        height: origViewport.height,
      });

      onProgress?.(i, sourcePdf.numPages);
      await new Promise((r) => setTimeout(r, 0));
    }

    return await newPdf.save({ useObjectStreams: true });
  } finally {
    // Always release the PDF.js document + worker session, even on a mid-page throw.
    void loadingTask.destroy();
  }
}

/**
 * Convert one or more image files (PNG / JPEG / WebP) into a single PDF.
 *
 * Each image is placed on its own page. When `pageSize` is "a4" or "letter",
 * the image is scaled to fit within the standard page dimensions while
 * preserving its aspect ratio and centred on the page. When "fit" is
 * selected, the page dimensions match the image exactly.
 *
 * @param images - Array of image File objects (PNG, JPEG, or WebP).
 * @param pageSize - Target page size: "a4" (595×842pt), "letter" (612×792pt), or "fit".
 * @param onProgress - Optional callback invoked with (completed, total) after each image.
 * @returns PDF bytes containing all images, one per page.
 */
export async function imagesToPdf(
  images: File[],
  pageSize: "a4" | "letter" | "fit" = "a4",
  onProgress?: (completed: number, total: number) => void,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  const pageDimensions: Record<string, [number, number]> = {
    a4: [595.28, 841.89],
    letter: [612, 792],
  };

  for (let i = 0; i < images.length; i++) {
    const imageFile = images[i];
    const uint8 = new Uint8Array(await imageFile.arrayBuffer());

    // pdf-lib embeds PNG and JPEG directly. WebP (and any other format the
    // dropzone accepts) isn't natively embeddable, so decode it to PNG via a
    // canvas first — the tool advertises WebP, so honour it instead of
    // throwing at Create-PDF time.
    let image: Awaited<ReturnType<typeof pdf.embedPng>>;
    if (imageFile.type === "image/png") {
      image = await pdf.embedPng(uint8);
    } else if (imageFile.type === "image/jpeg" || imageFile.type === "image/jpg") {
      image = await pdf.embedJpg(uint8);
    } else {
      image = await pdf.embedPng(await decodeImageToPngBytes(imageFile));
    }

    let pageWidth: number;
    let pageHeight: number;

    if (pageSize === "fit") {
      pageWidth = image.width;
      pageHeight = image.height;
    } else {
      [pageWidth, pageHeight] = pageDimensions[pageSize];
    }

    const page = pdf.addPage([pageWidth, pageHeight]);

    // Scale image to fit within page while maintaining aspect ratio
    const scale = Math.min(pageWidth / image.width, pageHeight / image.height);
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    page.drawImage(image, {
      x: (pageWidth - scaledWidth) / 2,
      y: (pageHeight - scaledHeight) / 2,
      width: scaledWidth,
      height: scaledHeight,
    });

    onProgress?.(i + 1, images.length);
    // Yield so the main thread can paint progress between (often multi-MB) images.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return pdf.save();
}

/** The N-up arrangements: fixed grids, plus saddle-stitch booklet imposition. */
export type NupLayout = "2x1" | "1x2" | "2x2" | "3x3" | "booklet";

export interface NupOptions {
  /** Draw a dashed centre fold line + corner trim ticks on each booklet sheet
   *  to guide folding and trimming. Ignored for the fixed grids. */
  cropMarks?: boolean;
}

/**
 * Saddle-stitch booklet imposition order for `pageCount` pages.
 *
 * Returns the 0-based source page indices in the sequence they are placed into
 * the 2-up cells (left, then right, for each printed side), padded with `-1`
 * blank leaves so the count is a multiple of 4. Printing the result
 * double-sided (flip on the short edge) and folding the stack in half yields
 * the pages in reading order. Pure and exported for unit testing.
 *
 * For an 8-page document the (1-based) side order is 8|1, 2|7, 6|3, 4|5.
 */
export function bookletOrder(pageCount: number): number[] {
  const P = Math.max(4, Math.ceil(pageCount / 4) * 4);
  const order: number[] = [];
  for (let k = 0; k < P / 2; k++) {
    // Sides alternate which source page sits on the left of the spread.
    const left = k % 2 === 0 ? P - k : k + 1;
    const right = k % 2 === 0 ? k + 1 : P - k;
    order.push(left - 1, right - 1); // 1-based spec → 0-based indices
  }
  // Padding leaves (index ≥ real page count) print as blanks.
  return order.map((i) => (i >= pageCount ? -1 : i));
}

/** Draw a dashed centre fold line and small corner trim ticks on a booklet
 *  sheet — printer's marks that help fold down the middle and trim square. */
function drawBookletMarks(page: ReturnType<PDFDocument["addPage"]>, w: number, h: number): void {
  const gray = rgb(0.55, 0.55, 0.55);
  // Centre fold line (dashed), full height.
  page.drawLine({
    start: { x: w / 2, y: 0 },
    end: { x: w / 2, y: h },
    thickness: 0.5,
    color: gray,
    dashArray: [3, 3],
  });
  // L-shaped trim ticks just inside each corner.
  const t = 12;
  const corners: Array<[number, number, number, number]> = [
    [0, 0, 1, 1],
    [w, 0, -1, 1],
    [0, h, 1, -1],
    [w, h, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx + sx * t, y: cy },
      thickness: 0.5,
      color: gray,
    });
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx, y: cy + sy * t },
      thickness: 0.5,
      color: gray,
    });
  }
}

/**
 * Arrange multiple PDF pages onto single sheets — fixed N-up grids or a
 * saddle-stitch booklet.
 *
 * Each output sheet has the same dimensions as the first source page; source
 * pages are scaled to fit their cell, preserving aspect ratio (letterboxed).
 * `"booklet"` reorders + pads the pages (see {@link bookletOrder}) and lays them
 * 2-up so the printed, folded stack reads in order — with optional fold/trim
 * marks via `options.cropMarks`.
 *
 * @param file - The source PDF file.
 * @param layout - "2x1", "1x2", "2x2", "3x3", or "booklet".
 * @param options - Booklet print-mark options.
 * @returns A new PDF with pages arranged in the chosen layout.
 */
export async function nupPages(
  file: File,
  layout: NupLayout,
  options: NupOptions = {},
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const source = await PDFDocument.load(arrayBuffer);
  const result = await PDFDocument.create();

  const pageCount = source.getPageCount();
  if (pageCount === 0) throw new Error("The PDF has no pages.");

  const { width: outW, height: outH } = source.getPage(0).getSize();
  // Embed all source pages into the result document as reusable XObjects.
  const embeddedPages = await Promise.all(source.getPages().map((page) => result.embedPage(page)));

  // ── Booklet: 2-up in imposition order, padded to a multiple of 4 ──────────
  if (layout === "booklet") {
    const cellW = outW / 2;
    const order = bookletOrder(pageCount);
    for (let side = 0; side < order.length / 2; side++) {
      const outPage = result.addPage([outW, outH]);
      for (let slot = 0; slot < 2; slot++) {
        const srcIdx = order[side * 2 + slot];
        if (srcIdx < 0) continue; // blank padding leaf
        const { width: pw, height: ph } = source.getPage(srcIdx).getSize();
        const scale = Math.min(cellW / pw, outH / ph);
        const drawW = pw * scale;
        const drawH = ph * scale;
        const x = slot * cellW + (cellW - drawW) / 2;
        const y = (outH - drawH) / 2;
        outPage.drawPage(embeddedPages[srcIdx], { x, y, width: drawW, height: drawH });
      }
      if (options.cropMarks) drawBookletMarks(outPage, outW, outH);
    }
    return result.save();
  }

  // ── Fixed grids ──────────────────────────────────────────────────────────
  const cols = layout === "1x2" ? 1 : layout === "3x3" ? 3 : 2;
  const rows = layout === "2x1" ? 1 : layout === "3x3" ? 3 : 2;
  const perSheet = cols * rows;
  const cellW = outW / cols;
  const cellH = outH / rows;
  const totalSheets = Math.ceil(pageCount / perSheet);

  for (let sheet = 0; sheet < totalSheets; sheet++) {
    const outPage = result.addPage([outW, outH]);

    for (let slot = 0; slot < perSheet; slot++) {
      const srcIdx = sheet * perSheet + slot;
      if (srcIdx >= pageCount) break;

      const col = slot % cols;
      const row = Math.floor(slot / cols);

      // Scale the source page to fit inside its cell while preserving aspect
      // ratio, then centre it (letterbox). Drawing it stretched to cellW×cellH
      // distorts any page whose aspect differs from the cell's (e.g. portrait
      // pages in a 2x1 grid) — the live preview shows the letterboxed result.
      const { width: pw, height: ph } = source.getPage(srcIdx).getSize();
      const scale = Math.min(cellW / pw, cellH / ph);
      const drawW = pw * scale;
      const drawH = ph * scale;

      // PDF y-axis is bottom-up; row 0 visually is the top row.
      const x = col * cellW + (cellW - drawW) / 2;
      const y = outH - (row + 1) * cellH + (cellH - drawH) / 2;

      outPage.drawPage(embeddedPages[srcIdx], { x, y, width: drawW, height: drawH });
    }
  }

  return result.save();
}

/**
 * Remap edge margins expressed against the *displayed* (rotated) page into the
 * page's unrotated user space, so a crop box set with `setCropBox` trims the
 * edge the user actually sees in the preview. `angle` is the page's `/Rotate`
 * (clockwise degrees). Without this, cropping a 90/270 page trims the wrong
 * side because the preview applies `/Rotate` but the crop box does not.
 */
function rotateCropMargins(m: CropMargins, angle: number): CropMargins {
  switch (((angle % 360) + 360) % 360) {
    case 90:
      return { left: m.top, right: m.bottom, top: m.right, bottom: m.left };
    case 180:
      return { left: m.right, right: m.left, top: m.bottom, bottom: m.top };
    case 270:
      return { left: m.bottom, right: m.top, top: m.left, bottom: m.right };
    default:
      return m;
  }
}

/**
 * Crop pages by setting a crop box that hides the specified margins.
 *
 * The crop box is a non-destructive trim — the hidden content remains in the
 * file but won't be rendered or printed. At least one target page must have
 * positive remaining dimensions for the operation to succeed. Margins are
 * interpreted against the displayed (rotated) page and remapped per page so
 * rotated pages crop the edge the user selected, not a transposed one.
 *
 * @param file - The source PDF file.
 * @param margins - Margin values in PDF points to hide on each displayed edge.
 * @param pageIndices - Optional 0-based indices to crop; defaults to all pages.
 * @returns New PDF bytes with crop boxes applied.
 */
export async function cropPages(
  file: File,
  margins: CropMargins,
  pageIndices?: number[],
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const allPages = pdf.getPages();
  const targets = pageIndices ? pageIndices.map((i) => allPages[i]) : allPages;

  for (const page of targets) {
    const { width, height } = page.getSize();
    const m = rotateCropMargins(margins, page.getRotation().angle);
    const x = m.left;
    const y = m.bottom;
    const w = width - m.left - m.right;
    const h = height - m.top - m.bottom;
    if (w > 0 && h > 0) {
      page.setCropBox(x, y, w, h);
    }
  }

  return pdf.save();
}

/**
 * Crop each page to its own crop box — the per-page counterpart of
 * {@link cropPages}, used by auto-crop where every page is trimmed to fit its
 * own content. `marginsByIndex` maps a 0-based page index to the margins (in
 * PDF points) to hide on that page; pages absent from the map are left as-is.
 *
 * Rotated pages (/Rotate 90/180/270) are skipped: the caller computes margins
 * in the rendered (rotated) frame while the crop box lives in unrotated user
 * space, so applying them there would mis-place the box. Leaving rotated pages
 * untouched is the safe choice (the manual margin tool still handles them).
 *
 * Returns the new bytes plus `croppedCount` — how many pages actually got a
 * crop box — so the caller can tell the user when nothing was trimmable (e.g.
 * every candidate page was rotated) instead of silently handing back an
 * unchanged file.
 */
export async function cropPagesIndividual(
  file: File,
  marginsByIndex: Map<number, CropMargins>,
): Promise<{ bytes: Uint8Array; croppedCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  let croppedCount = 0;
  for (const [index, m] of marginsByIndex) {
    const page = pages[index];
    if (!page) continue;
    if (page.getRotation().angle % 360 !== 0) continue;
    const { width, height } = page.getSize();
    const w = width - m.left - m.right;
    const h = height - m.top - m.bottom;
    if (w > 0 && h > 0) {
      page.setCropBox(m.left, m.bottom, w, h);
      croppedCount++;
    }
  }
  return { bytes: await pdf.save(), croppedCount };
}

/**
 * Remove the crop box from pages to restore the full visible area. Because
 * cropping is non-destructive (the original content is never removed), this
 * effectively reverses any crop applied by `cropPages` or any other tool.
 *
 * @param file - The PDF file to modify.
 * @param pageIndices - Optional 0-based indices to uncrop; defaults to all pages.
 * @returns New PDF bytes with crop boxes removed.
 */
export async function uncropPages(file: File, pageIndices?: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const allPages = pdf.getPages();
  const targets = pageIndices ? pageIndices.map((i) => allPages[i]) : allPages;
  for (const page of targets) {
    page.node.delete(PDFName.of("CropBox"));
  }
  return pdf.save();
}
