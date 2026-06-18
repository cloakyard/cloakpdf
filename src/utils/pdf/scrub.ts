/**
 * PDF Scrub — privacy sanitiser. Detect and permanently strip hidden /
 * non-visible data that leaks identity or poses a security risk.
 */

import { PDFDocument, PDFDict, PDFArray, PDFName } from "@pdfme/pdf-lib";

// ── PDF Scrub — privacy sanitiser ────────────────────────────────

/**
 * The categories of hidden / non-visible data that {@link scrubPdf}
 * removes. Surfaced one-to-one in the PDF Scrub findings report.
 */
export const SCRUB_CATEGORIES = [
  "metadata",
  "xmp",
  "javascript",
  "attachments",
  "annotations",
] as const;

export type ScrubCategory = (typeof SCRUB_CATEGORIES)[number];

/** Per-category count of hidden-data items detected in a PDF. */
export interface ScrubAnalysis {
  counts: Record<ScrubCategory, number>;
}

/**
 * Scan a PDF for hidden / non-visible data that leaks identity or poses
 * a security risk, returning a per-category count. This powers the PDF
 * Scrub findings report; it never mutates the document.
 *
 * The five vectors:
 *
 * - **metadata** — populated standard Info-dictionary fields (author,
 *   creator/producer software fingerprints, creation/modification dates).
 * - **xmp** — the catalog `/Metadata` XMP packet, which can carry GPS
 *   tags, original author, and an edit history the Info dict doesn't.
 * - **javascript** — embedded JavaScript (`/Names → /JavaScript`) plus
 *   auto-run hooks (`/OpenAction`, document `/AA`, per-page `/AA`).
 * - **attachments** — files embedded via the `/EmbeddedFiles` name tree.
 * - **annotations** — sticky notes, highlights, and other markup whose
 *   `/T` author and `/Contents` text travel with the page.
 *
 * @param file - The PDF file to inspect.
 * @returns Counts keyed by {@link ScrubCategory}.
 */
export async function analyzePdfHiddenData(file: File): Promise<ScrubAnalysis> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, {
    updateMetadata: false,
    throwOnInvalidObject: false,
    ignoreEncryption: true,
  });
  const catalog = pdf.catalog;

  // 1. Document metadata — count non-empty standard Info fields. Dates
  //    are read defensively: a malformed date string makes pdf-lib's
  //    getter throw, which shouldn't fail the whole scan.
  let metadata = 0;
  for (const value of [
    pdf.getTitle(),
    pdf.getAuthor(),
    pdf.getSubject(),
    pdf.getKeywords(),
    pdf.getCreator(),
    pdf.getProducer(),
  ]) {
    if (value && value.trim()) metadata++;
  }
  try {
    if (pdf.getCreationDate()) metadata++;
  } catch {
    /* unparseable date still counts as present */ metadata++;
  }
  try {
    if (pdf.getModificationDate()) metadata++;
  } catch {
    metadata++;
  }

  // 2. XMP metadata packet (catalog /Metadata stream).
  const xmp = catalog.lookup(PDFName.of("Metadata")) ? 1 : 0;

  // The /Names dictionary backs both the JavaScript and EmbeddedFiles
  // name trees, so resolve it once.
  const namesDict = catalog.lookup(PDFName.of("Names"));

  // 3. Scripts & auto-actions.
  let javascript = 0;
  if (namesDict instanceof PDFDict) {
    const jsTree = namesDict.lookup(PDFName.of("JavaScript"));
    if (jsTree instanceof PDFDict) {
      const arr = jsTree.lookup(PDFName.of("Names"));
      if (arr instanceof PDFArray) javascript += Math.floor(arr.size() / 2);
    }
  }
  if (catalog.lookup(PDFName.of("OpenAction"))) javascript++;
  if (catalog.lookup(PDFName.of("AA"))) javascript++;
  for (const page of pdf.getPages()) {
    if (page.node.lookup(PDFName.of("AA"))) javascript++;
  }

  // 4. Embedded files.
  let attachments = 0;
  if (namesDict instanceof PDFDict) {
    const efTree = namesDict.lookup(PDFName.of("EmbeddedFiles"));
    if (efTree instanceof PDFDict) {
      const arr = efTree.lookup(PDFName.of("Names"));
      if (arr instanceof PDFArray) attachments = Math.floor(arr.size() / 2);
    }
  }

  // 5. Annotations & comments.
  let annotations = 0;
  for (const page of pdf.getPages()) {
    const annots = page.node.lookup(PDFName.of("Annots"));
    if (annots instanceof PDFArray) annotations += annots.size();
  }

  return { counts: { metadata, xmp, javascript, attachments, annotations } };
}

/**
 * Permanently strip hidden / non-visible data from a PDF.
 *
 * **Why a rebuild, not in-place deletion.** pdf-lib does not
 * garbage-collect: deleting a `/Names` or `/Annots` reference leaves the
 * underlying JavaScript / attachment / annotation objects orphaned but
 * still written into the saved bytes — useless for a privacy tool. So we
 * instead rebuild the document from page content only. A fresh
 * `PDFDocument` inherits none of the source catalog, and `copyPages`
 * copies just the objects reachable from each page (content streams,
 * fonts, images, kept annotations). Every catalog-level vector —
 * embedded JavaScript, `/OpenAction`, the `/Names` trees (JavaScript +
 * EmbeddedFiles), the XMP `/Metadata` packet, and the Info dictionary —
 * is simply never reached, so it is physically absent from the output,
 * not merely dereferenced. (Verified by scanning the output bytes in the
 * unit tests.)
 *
 * Page-level vectors are stripped on the source *before* copying so the
 * reachability walk can't pull them across: per-page `/AA` actions
 * always, and `/Annots` when `removeAnnotations` is set.
 *
 * Trade-off, surfaced in the UI: the document outline/bookmarks and any
 * interactive form registration live at catalog level and do not survive
 * the rebuild.
 *
 * @param file - The source PDF (must be decrypted).
 * @param removeAnnotations - Also strip annotations/comments (sticky
 *   notes, highlights, markup). Off by default so visible markup is
 *   preserved unless the user opts in.
 * @returns Scrubbed PDF bytes.
 */
export async function scrubPdf(file: File, removeAnnotations = false): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const src = await PDFDocument.load(arrayBuffer, {
    updateMetadata: false,
    throwOnInvalidObject: false,
    ignoreEncryption: true,
  });

  // Strip page-level vectors on the SOURCE first so copyPages' reachable-
  // object walk never reaches them (see the function doc for why this
  // matters — orphaned objects would otherwise persist in the bytes).
  for (const page of src.getPages()) {
    page.node.delete(PDFName.of("AA"));
    if (removeAnnotations) page.node.delete(PDFName.of("Annots"));
  }

  // Rebuild from page content only — the new catalog carries no
  // JavaScript, attachments, XMP, OpenAction, or Info metadata.
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, src.getPageIndices());
  for (const page of copied) out.addPage(page);

  // PDFDocument.create() stamps a default Producer string and
  // creation/modification timestamps. Clear them so the scrubbed file
  // carries no software fingerprint or "scrubbed-at" timestamp.
  const infoDict = (out as unknown as { getInfoDict(): PDFDict }).getInfoDict();
  for (const key of [
    "Title",
    "Author",
    "Subject",
    "Keywords",
    "Creator",
    "Producer",
    "CreationDate",
    "ModDate",
  ]) {
    infoDict.delete(PDFName.of(key));
  }

  return out.save();
}
