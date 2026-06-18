/**
 * Embedded-file attachment operations (list / attach / remove).
 */

import {
  PDFDocument,
  PDFDict,
  PDFArray,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFString,
  decodePDFRawStream,
} from "@pdfme/pdf-lib";

/** Metadata for a single file attachment embedded in a PDF. */
export interface PdfAttachment {
  name: string;
  size: number;
  mimeType: string;
  data: Uint8Array;
}

/**
 * List all file attachments embedded in a PDF.
 *
 * Reads the /Names → /EmbeddedFiles name tree from the document catalog
 * and extracts the name, size, MIME type, and raw bytes of each entry.
 */
export async function listPdfAttachments(file: File): Promise<PdfAttachment[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { updateMetadata: false });
  const catalog = pdf.catalog;
  if (!catalog) return [];

  const namesDict = catalog.lookup(PDFName.of("Names"));
  if (!(namesDict instanceof PDFDict)) return [];

  const efDict = namesDict.lookup(PDFName.of("EmbeddedFiles"));
  if (!(efDict instanceof PDFDict)) return [];

  const namesArray = efDict.lookup(PDFName.of("Names"));
  if (!(namesArray instanceof PDFArray)) return [];

  const attachments: PdfAttachment[] = [];

  for (let i = 0; i < namesArray.size(); i += 2) {
    const nameObj = namesArray.lookup(i);
    const fileSpec = namesArray.lookup(i + 1);
    if (!(fileSpec instanceof PDFDict)) continue;

    // Prefer /UF (Unicode filename) or /F from the filespec dict; fall back to name tree key
    const ufObj = fileSpec.lookup(PDFName.of("UF"));
    const fObj = fileSpec.lookup(PDFName.of("F"));
    const specName =
      ufObj instanceof PDFString
        ? ufObj.decodeText()
        : fObj instanceof PDFString
          ? fObj.decodeText()
          : null;
    const treeName =
      nameObj instanceof PDFString
        ? nameObj.decodeText()
        : nameObj instanceof PDFName
          ? nameObj.decodeText()
          : null;
    const name = specName || treeName || `Attachment ${i / 2 + 1}`;

    const efObj = fileSpec.lookup(PDFName.of("EF"));
    if (!(efObj instanceof PDFDict)) continue;

    const stream = efObj.lookup(PDFName.of("F"));
    if (!(stream instanceof PDFRawStream)) continue;

    // `getContents()` returns the raw, still-encoded bytes — embedded files
    // are typically FlateDecode-compressed, so we must run the stream's
    // filter chain to recover the original file bytes.
    const data = decodePDFRawStream(stream).decode();
    const streamDict = stream.dict;
    // `Params` and `Subtype` are optional in the EmbeddedFile stream dict,
    // so use `lookupMaybe` — the typed `lookup` overload throws when the
    // key is absent.
    const paramsDict = streamDict.lookupMaybe(PDFName.of("Params"), PDFDict);
    const sizeNum = paramsDict?.lookupMaybe(PDFName.of("Size"), PDFNumber);

    const subtypeObj = streamDict.lookupMaybe(PDFName.of("Subtype"), PDFName);
    const mimeType = subtypeObj
      ? subtypeObj.decodeText().replace(/^\//, "")
      : "application/octet-stream";

    attachments.push({
      name,
      size: sizeNum ? sizeNum.asNumber() : data.length,
      mimeType,
      data,
    });
  }

  return attachments;
}

/**
 * Attach one or more files to a PDF document.
 *
 * Uses the @pdfme/pdf-lib `attach()` API to embed files into the PDF's
 * EmbeddedFiles name tree.
 */
export async function attachFilesToPdf(pdfFile: File, attachments: File[]): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { updateMetadata: false });

  for (const attachment of attachments) {
    const data = new Uint8Array(await attachment.arrayBuffer());
    await pdf.attach(data, attachment.name, {
      mimeType: attachment.type || "application/octet-stream",
      creationDate: new Date(),
      modificationDate: new Date(),
    });
  }

  return pdf.save();
}

/**
 * Remove specific attachments from a PDF by name.
 *
 * Modifies the /Names → /EmbeddedFiles name tree to remove entries
 * matching the given names.
 */
export async function removeAttachmentsFromPdf(
  file: File,
  namesToRemove: Set<string>,
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { updateMetadata: false });
  const catalog = pdf.catalog;

  const namesDict = catalog.lookup(PDFName.of("Names"));
  if (!(namesDict instanceof PDFDict)) return pdf.save();

  const efDict = namesDict.lookup(PDFName.of("EmbeddedFiles"));
  if (!(efDict instanceof PDFDict)) return pdf.save();

  const namesArray = efDict.lookup(PDFName.of("Names"));
  if (!(namesArray instanceof PDFArray)) return pdf.save();

  const keepIndices: number[] = [];
  for (let i = 0; i < namesArray.size(); i += 2) {
    const nameObj = namesArray.lookup(i);
    const name =
      nameObj instanceof PDFString
        ? nameObj.decodeText()
        : nameObj instanceof PDFName
          ? nameObj.decodeText()
          : "";
    if (!namesToRemove.has(name)) {
      keepIndices.push(i);
    }
  }

  const context = pdf.context;
  const newArray = context.obj([]);
  for (const idx of keepIndices) {
    (newArray as PDFArray).push(namesArray.get(idx));
    (newArray as PDFArray).push(namesArray.get(idx + 1));
  }

  efDict.set(PDFName.of("Names"), newArray);

  return pdf.save();
}
