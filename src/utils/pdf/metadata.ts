/**
 * Document metadata and structural inspection / repair.
 */

import { PDFDocument, PDFDict, PDFName } from "@pdfme/pdf-lib";
import type { PdfMetadata } from "../../types.ts";

/** Technical information about a PDF document. */
export interface PdfInfo {
  pageCount: number;
  version: string;
  fileSize: number;
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  isEncrypted: boolean;
  pages: Array<{ width: number; height: number }>;
}

/**
 * Helper to format a Date object as an ISO-like datetime-local string
 * (`YYYY-MM-DDTHH:mm`) suitable for `<input type="datetime-local">`.
 */
function formatDateForInput(date: Date | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Read standard metadata fields from a PDF.
 *
 * Uses pdf-lib's built-in getters to extract title, author, subject,
 * keywords, creator, producer, creation date, and modification date.
 * Date values are converted to ISO-like strings for display.
 *
 * @param file - The PDF file to inspect.
 * @returns A `PdfMetadata` object with all standard fields.
 */
export async function getPdfMetadata(file: File): Promise<PdfMetadata> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { updateMetadata: false });

  return {
    title: pdf.getTitle() ?? "",
    author: pdf.getAuthor() ?? "",
    subject: pdf.getSubject() ?? "",
    keywords: pdf.getKeywords() ?? "",
    creator: pdf.getCreator() ?? "",
    producer: pdf.getProducer() ?? "",
    creationDate: formatDateForInput(pdf.getCreationDate()),
    modificationDate: formatDateForInput(pdf.getModificationDate()),
  };
}

/**
 * Write standard metadata fields to a PDF and return the modified bytes.
 *
 * Applies the provided metadata using pdf-lib's setters. Empty strings
 * are still written (clearing the field). Date strings are parsed back
 * from the `datetime-local` format used in the UI.
 *
 * @param file - The original PDF file.
 * @param metadata - The metadata values to set.
 * @returns Modified PDF bytes with updated metadata.
 */
export async function setPdfMetadata(file: File, metadata: PdfMetadata): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { updateMetadata: false });

  pdf.setTitle(metadata.title);
  pdf.setAuthor(metadata.author);
  pdf.setSubject(metadata.subject);
  pdf.setKeywords([metadata.keywords]);
  pdf.setCreator(metadata.creator);
  pdf.setProducer(metadata.producer);

  // Access the Info dictionary to allow removing date entries.
  // getInfoDict() is private on PDFDocument but available at runtime.
  const infoDict = (pdf as unknown as { getInfoDict(): PDFDict }).getInfoDict();
  if (metadata.creationDate) {
    pdf.setCreationDate(new Date(metadata.creationDate));
  } else {
    infoDict.delete(PDFName.of("CreationDate"));
  }
  if (metadata.modificationDate) {
    pdf.setModificationDate(new Date(metadata.modificationDate));
  } else {
    infoDict.delete(PDFName.of("ModDate"));
  }

  return pdf.save();
}

/**
 * Remove all document metadata and return the stripped bytes.
 *
 * Deletes every entry in the Info dictionary (title, author, subject,
 * keywords, creator, producer, creation/modification dates, trapped) and drops
 * the XMP metadata stream referenced from the catalog. Loaded with
 * `updateMetadata: false` so pdf-lib doesn't re-stamp Producer / ModDate on
 * save. Page content is untouched — only the metadata is gone.
 *
 * @param file - The PDF file to strip.
 * @returns PDF bytes with all metadata removed.
 */
export async function stripMetadata(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { updateMetadata: false });

  const infoDict = (pdf as unknown as { getInfoDict(): PDFDict }).getInfoDict();
  for (const key of [
    "Title",
    "Author",
    "Subject",
    "Keywords",
    "Creator",
    "Producer",
    "CreationDate",
    "ModDate",
    "Trapped",
  ]) {
    infoDict.delete(PDFName.of(key));
  }

  // Drop the XMP metadata stream (catalog → /Metadata).
  pdf.catalog.delete(PDFName.of("Metadata"));

  return pdf.save();
}

/**
 * Read technical information about a PDF file.
 *
 * Reads the PDF version from the file header bytes, page dimensions, and all
 * standard metadata fields. Loads with ignoreEncryption:true so encrypted files
 * can still be inspected without a password.
 *
 * @param file - The PDF file to inspect.
 * @returns A PdfInfo object with metadata and structural details.
 */
export async function getPdfInfo(file: File): Promise<PdfInfo> {
  const arrayBuffer = await file.arrayBuffer();

  // Read PDF version from the file header (first 20 bytes)
  const header = new TextDecoder("utf-8", { fatal: false }).decode(
    new Uint8Array(arrayBuffer.slice(0, 20)),
  );
  const versionMatch = header.match(/%PDF-(\d+\.\d+)/);
  const version = versionMatch ? versionMatch[1] : "Unknown";

  const pdf = await PDFDocument.load(arrayBuffer, {
    throwOnInvalidObject: false,
    ignoreEncryption: true,
    updateMetadata: false,
  });

  const isEncrypted = !!pdf.context.trailerInfo.Encrypt;

  return {
    pageCount: pdf.getPageCount(),
    version,
    fileSize: file.size,
    title: pdf.getTitle() ?? "",
    author: pdf.getAuthor() ?? "",
    subject: pdf.getSubject() ?? "",
    creator: pdf.getCreator() ?? "",
    producer: pdf.getProducer() ?? "",
    isEncrypted,
    pages: pdf.getPages().map((p) => p.getSize()),
  };
}

/**
 * Attempt to repair a PDF by re-parsing and re-saving it through pdf-lib.
 *
 * This fixes many common structural issues such as incorrect cross-reference
 * tables, duplicate object numbers, and minor dictionary inconsistencies.
 * The content is not altered — only the PDF structure is rebuilt.
 *
 * @param file - The PDF file to repair.
 * @returns A structurally clean PDF with the same content.
 */
export async function repairPdf(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, {
    throwOnInvalidObject: false,
    ignoreEncryption: true,
  });
  return pdf.save({ useObjectStreams: false });
}
