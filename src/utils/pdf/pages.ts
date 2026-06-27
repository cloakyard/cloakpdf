/**
 * Structural page operations: merge, multi-part split, and the unified
 * Organize-Pages assembly engine (reorder / rotate / duplicate / delete / insert
 * blanks all flow through `assemblePdf`).
 */

import { PDFDocument, degrees } from "@pdfme/pdf-lib";

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
 * Split a PDF into multiple parts in a single pass.
 *
 * Parses the source document exactly once, then copies the page ranges for
 * each part — an N-part split parses the source once rather than N times.
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
      // Validate indices rather than coercing a malformed op to source 0 / page
      // 0 — that would silently splice the wrong page into the output.
      if (
        op.sourceIndex == null ||
        op.sourceIndex < 0 ||
        op.sourceIndex >= sources.length ||
        op.pageIndex == null ||
        op.pageIndex < 0
      ) {
        throw new Error("Malformed assembly plan: page op has an invalid source or page index.");
      }
      const src = await getSource(op.sourceIndex);
      if (op.pageIndex >= src.getPageCount()) {
        throw new Error("Malformed assembly plan: page index out of range.");
      }
      const [page] = await out.copyPages(src, [op.pageIndex]);
      if (op.rotation) {
        page.setRotation(degrees(norm(page.getRotation().angle + op.rotation)));
      }
      out.addPage(page);
    }
  }

  return out.save();
}
