/**
 * Structural page operations: merge, split, reorder, delete, insert, duplicate,
 * and the unified Organize-Pages assembly engine.
 */

import { PDFDocument, degrees } from "@pdfme/pdf-lib";
import type { PageRange } from "../../types.ts";
import { clonePageFormFields } from "./forms.ts";

/**
 * Merge multiple PDF files into a single document.
 *
 * Pages are appended in the order the files appear in the array.
 * Each source PDF's pages are copied (not referenced) into the merged document
 * so the originals can be safely discarded.
 *
 * @param files - Two or more PDF File objects to combine.
 * @returns The merged PDF as raw bytes.
 */
export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  if (files.length === 0) throw new Error("At least one PDF file is required to merge.");
  const merged = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
  }

  return merged.save();
}

/**
 * Extract specific page ranges from a PDF into a new document.
 *
 * Accepts an array of 1-based page ranges. Duplicate page numbers are
 * de-duplicated, and pages exceeding the source page count are silently skipped.
 *
 * @param file - The source PDF file.
 * @param ranges - Array of `{ start, end }` ranges (1-based, inclusive).
 * @returns A new PDF containing only the requested pages.
 */
export async function splitPdf(file: File, ranges: PageRange[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const source = await PDFDocument.load(arrayBuffer);
  const result = await PDFDocument.create();

  const seen = new Set<number>();
  const pageIndices: number[] = [];
  for (const range of ranges) {
    for (let i = range.start; i <= range.end && i <= source.getPageCount(); i++) {
      if (!seen.has(i - 1)) {
        seen.add(i - 1);
        pageIndices.push(i - 1);
      }
    }
  }

  const copiedPages = await result.copyPages(source, pageIndices);
  for (const page of copiedPages) {
    result.addPage(page);
  }

  return result.save();
}

/**
 * Rotate specific pages of a PDF by the given angles.
 *
 * Rotation is additive — the angle is added to any existing page rotation.
 * Only pages present in the `rotations` map are affected; all others
 * remain unchanged.
 *
 * @param file - The PDF file to modify.
 * @param rotations - Map of 0-based page index → rotation angle in degrees (e.g. 90, -90, 180).
 * @returns PDF bytes with the updated rotations.
 */
export async function rotatePages(file: File, rotations: Map<number, number>): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);

  for (const [pageIndex, angle] of rotations) {
    const page = pdf.getPage(pageIndex);
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + angle));
  }

  return pdf.save();
}

/**
 * Remove pages from a PDF by their 0-based indices.
 *
 * Creates a new document containing only those pages whose index is NOT
 * in `pageIndicesToDelete`. At least one page must remain.
 *
 * @param file - The source PDF file.
 * @param pageIndicesToDelete - Array of 0-based page indices to remove.
 * @returns A new PDF with the specified pages removed.
 */
export async function deletePages(file: File, pageIndicesToDelete: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const source = await PDFDocument.load(arrayBuffer);
  const result = await PDFDocument.create();

  const deleteSet = new Set(pageIndicesToDelete);
  const keepIndices = source.getPageIndices().filter((i) => !deleteSet.has(i));
  if (keepIndices.length === 0)
    throw new Error("Cannot delete all pages — at least one page must remain.");

  const copiedPages = await result.copyPages(source, keepIndices);
  for (const page of copiedPages) {
    result.addPage(page);
  }

  return result.save();
}

/**
 * Reorder the pages of a PDF according to a new sequence.
 *
 * `newOrder` must be an array of 0-based page indices in the desired output
 * order. Pages are copied from the source into a fresh document so the
 * original is never mutated.
 *
 * @param file - The source PDF file.
 * @param newOrder - Array of 0-based page indices defining the new page sequence.
 * @returns A new PDF with pages in the specified order.
 */
export async function reorderPages(file: File, newOrder: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const source = await PDFDocument.load(arrayBuffer);
  const result = await PDFDocument.create();

  const copiedPages = await result.copyPages(source, newOrder);
  for (const page of copiedPages) {
    result.addPage(page);
  }

  return result.save();
}

/**
 * Insert a blank page into a PDF at the specified position.
 *
 * The blank page dimensions are copied from the adjacent page so the new
 * page blends seamlessly. Falls back to A4 if the PDF has no pages.
 *
 * @param file - The source PDF file.
 * @param position - 0-based index at which to insert (0 = before first page).
 * @returns New PDF bytes with the blank page inserted.
 */
export async function addBlankPage(file: File, position: number): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pageCount = pdf.getPageCount();
  const refIndex = Math.min(Math.max(position, 0), pageCount - 1);
  const { width, height } =
    pageCount > 0 ? pdf.getPage(refIndex).getSize() : { width: 595, height: 842 };
  pdf.insertPage(position, [width, height]);
  return pdf.save();
}

/**
 * Insert multiple blank pages into a PDF in a single pass.
 *
 * @param file - The source PDF file.
 * @param positions - Sorted (ascending) array of 0-based insertion positions,
 *   computed as if no blanks have been inserted yet.  Internally each position
 *   is offset by the number of blanks already inserted so they land in the
 *   correct spots.
 * @returns New PDF bytes with all blank pages inserted.
 */
export async function addBlankPages(file: File, positions: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pageCount = pdf.getPageCount();
  const { width, height } = pageCount > 0 ? pdf.getPage(0).getSize() : { width: 595, height: 842 };

  // Sort ascending so each offset is simply the loop index.
  const sorted = [...positions].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    pdf.insertPage(sorted[i] + i, [width, height]);
  }
  return pdf.save();
}

/**
 * Duplicate a page in a PDF and insert the copy at a target position.
 *
 * The source page is copied from a fresh load of the same file to avoid
 * internal reference issues. Any interactive form fields on the copied page
 * are registered as new standalone AcroForm fields with unique names so that
 * FillPdfForm (and any PDF viewer) treats them independently from the originals.
 *
 * @param file - The source PDF file.
 * @param sourceIndex - 0-based index of the page to duplicate.
 * @param targetPosition - 0-based index at which to insert the copy.
 * @returns New PDF bytes with the duplicated page inserted.
 */
export async function duplicatePage(
  file: File,
  sourceIndex: number,
  targetPosition: number,
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const source = await PDFDocument.load(arrayBuffer);
  const result = await PDFDocument.load(arrayBuffer);
  const [copiedPage] = await result.copyPages(source, [sourceIndex]);
  result.insertPage(targetPosition, copiedPage);
  clonePageFormFields(result, targetPosition);
  return result.save();
}

/**
 * Duplicate multiple pages in a PDF in a single pass.
 *
 * @param file - The source PDF file.
 * @param copies - Array of `{ sourceIndex, position }` objects where `position`
 *   is the 0-based insertion index relative to the *original* page list (before
 *   any copies are inserted).  Internally each position is offset by the number
 *   of copies already inserted so they land in the correct spots.
 * @returns New PDF bytes with all copies inserted.
 */
export async function duplicatePages(
  file: File,
  copies: { sourceIndex: number; position: number }[],
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const source = await PDFDocument.load(arrayBuffer);
  const result = await PDFDocument.load(arrayBuffer);

  // Sort ascending by position so each offset is simply the loop index.
  const sorted = [...copies].sort((a, b) => a.position - b.position);
  for (let i = 0; i < sorted.length; i++) {
    const { sourceIndex, position } = sorted[i];
    const adjustedPosition = position + i;
    const [copiedPage] = await result.copyPages(source, [sourceIndex]);
    result.insertPage(adjustedPosition, copiedPage);
    clonePageFormFields(result, adjustedPosition);
  }
  return result.save();
}

/**
 * Reverse the page order of a PDF.
 *
 * @param file - The source PDF file.
 * @returns A new PDF with pages in reverse order.
 */
export async function reversePages(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const source = await PDFDocument.load(arrayBuffer);
  const result = await PDFDocument.create();
  const reversedIndices = [...source.getPageIndices()].reverse();
  const copiedPages = await result.copyPages(source, reversedIndices);
  for (const page of copiedPages) {
    result.addPage(page);
  }
  return result.save();
}

/**
 * Extract a specific set of pages from a PDF into a new document.
 *
 * Pages are included in the order given by `pageIndices`.
 *
 * @param file - The source PDF file.
 * @param pageIndices - 0-based indices of pages to keep.
 * @returns A new PDF containing only the selected pages.
 */
export async function extractPages(file: File, pageIndices: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const source = await PDFDocument.load(arrayBuffer);
  const result = await PDFDocument.create();
  const valid = pageIndices.filter((i) => i >= 0 && i < source.getPageCount());
  if (valid.length === 0) throw new Error("No valid pages selected.");
  const copiedPages = await result.copyPages(source, valid);
  for (const page of copiedPages) {
    result.addPage(page);
  }
  return result.save();
}

/**
 * Split a PDF into multiple parts in a single pass.
 *
 * Parses the source document exactly once, then copies the page ranges for
 * each part — equivalent to calling {@link extractPages} per part but without
 * re-reading and re-parsing the whole source for every output (an N-part
 * split previously parsed the source N times).
 *
 * @param file - The source PDF.
 * @param parts - One array of 0-based page indices per output part, in order.
 * @returns One PDF (as bytes) per part, in the same order as `parts`.
 */
export async function splitPdfIntoParts(file: File, parts: number[][]): Promise<Uint8Array[]> {
  const arrayBuffer = await file.arrayBuffer();
  const source = await PDFDocument.load(arrayBuffer);
  const pageCount = source.getPageCount();
  const out: Uint8Array[] = [];
  for (const indices of parts) {
    const valid = indices.filter((i) => i >= 0 && i < pageCount);
    if (valid.length === 0) throw new Error("No valid pages selected.");
    const result = await PDFDocument.create();
    const copied = await result.copyPages(source, valid);
    for (const page of copied) result.addPage(page);
    out.push(await result.save());
  }
  return out;
}

// ── Organize Pages — unified page assembly ───────────────────────

/** One page in an Organize-Pages assembly plan. */
export interface AssembleOp {
  /** `"page"` copies an existing page; `"blank"` inserts an empty page. */
  kind: "page" | "blank";
  /** Index into the `sources` array — required for `kind: "page"`. */
  sourceIndex?: number;
  /** 0-based page index within that source — required for `kind: "page"`. */
  pageIndex?: number;
  /** Clockwise rotation in degrees to add on top of the page's own rotation. */
  rotation?: number;
  /** Blank-page width in points (defaults to US Letter). */
  width?: number;
  /** Blank-page height in points (defaults to US Letter). */
  height?: number;
}

/**
 * Assemble a new PDF from an ordered plan of page operations.
 *
 * This is the engine behind the Organize Pages tool: a single pass that
 * reorders, rotates, duplicates, deletes (by omission), inserts blanks,
 * and splices pages drawn from several source PDFs — all expressed as a
 * flat list of {@link AssembleOp}s in final output order.
 *
 * Each `page` op copies its source page fresh, so the same source page
 * can appear multiple times (duplication) and in any order. Source
 * documents are loaded lazily and at most once. Like merge/reorder, the
 * output is rebuilt from page content, so catalog-level extras
 * (bookmarks, form registration) do not carry over.
 *
 * @param sources - Raw bytes of every source PDF referenced by the plan.
 * @param ops - The output pages, in order.
 * @returns The assembled PDF bytes.
 */
export async function assemblePdf(sources: Uint8Array[], ops: AssembleOp[]): Promise<Uint8Array> {
  if (ops.length === 0) {
    throw new Error("Nothing to assemble — the document has no pages.");
  }

  const out = await PDFDocument.create();
  const loaded: (PDFDocument | undefined)[] = Array.from({ length: sources.length });
  const getSource = async (i: number): Promise<PDFDocument> => {
    const existing = loaded[i];
    if (existing) return existing;
    const doc = await PDFDocument.load(sources[i], {
      throwOnInvalidObject: false,
      ignoreEncryption: true,
    });
    loaded[i] = doc;
    return doc;
  };

  const norm = (deg: number) => ((deg % 360) + 360) % 360;

  for (const op of ops) {
    if (op.kind === "blank") {
      const page = out.addPage([op.width ?? 612, op.height ?? 792]);
      if (op.rotation) page.setRotation(degrees(norm(op.rotation)));
    } else {
      const src = await getSource(op.sourceIndex ?? 0);
      const [page] = await out.copyPages(src, [op.pageIndex ?? 0]);
      if (op.rotation) {
        page.setRotation(degrees(norm(page.getRotation().angle + op.rotation)));
      }
      out.addPage(page);
    }
  }

  return out.save();
}
