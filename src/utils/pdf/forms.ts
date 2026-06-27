/**
 * Form-field operations and the private AcroForm helpers they share.
 */

import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFDict,
  PDFArray,
  PDFName,
  PDFNumber,
  PDFString,
} from "@pdfme/pdf-lib";

/** Walk the /Parent chain collecting /T values to build the dotted full name. */
function deriveFullFieldName(pdf: PDFDocument, dict: PDFDict): string | null {
  const parts: string[] = [];
  let next: PDFDict | null = dict;
  while (next !== null) {
    const current: PDFDict = next;
    const t = current.get(PDFName.of("T"));
    if (t) parts.unshift(decodePdfString(t));
    const parentEntry = current.get(PDFName.of("Parent"));
    if (!parentEntry) break;
    const resolved = pdf.context.lookup(parentEntry);
    next = resolved instanceof PDFDict ? (resolved as PDFDict) : null;
  }
  return parts.length > 0 ? parts.join(".") : null;
}

function decodePdfString(obj: { toString(): string } | undefined): string {
  if (!obj) return "";
  if (obj instanceof PDFString) return obj.decodeText();
  // Fallback for any other PDFObject (e.g. PDFHexString): strip delimiters.
  return obj
    .toString()
    .replace(/^\(|\)$/g, "")
    .replace(/^<|>$/g, "");
}

/**
 * Build a map of fully-qualified field name → { pageIndex, y } by scanning
 * each page's widget annotations. The y value is the top of the widget's Rect
 * in PDF user-space units (higher = closer to top of page). Useful for grouping
 * and sorting form fields by their visual position in the document.
 * Fields that appear on multiple pages are mapped to their first occurrence.
 *
 * @param file - The source PDF file.
 * @returns Map of field name → pageIndex and y position.
 */
export async function getFieldPageIndices(
  file: File,
): Promise<Map<string, { pageIndex: number; y: number }>> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const map = new Map<string, { pageIndex: number; y: number }>();
  for (let pageIdx = 0; pageIdx < pdf.getPageCount(); pageIdx++) {
    const page = pdf.getPage(pageIdx);
    const annotsEntry = page.node.get(PDFName.of("Annots"));
    if (!annotsEntry) continue;
    const annots = pdf.context.lookup(annotsEntry);
    if (!(annots instanceof PDFArray)) continue;
    for (let j = 0; j < annots.size(); j++) {
      const annot = pdf.context.lookup(annots.get(j));
      if (!(annot instanceof PDFDict)) continue;
      const subtype = annot.get(PDFName.of("Subtype"));
      if (!subtype || subtype.toString() !== "/Widget") continue;
      const name = deriveFullFieldName(pdf, annot);
      if (!name || map.has(name)) continue;
      // Extract the upper-left y from the Rect [llx, lly, urx, ury].
      // ury is the top edge; higher value = higher on page.
      let y = 0;
      const rectEntry = annot.get(PDFName.of("Rect"));
      if (rectEntry) {
        const rect = pdf.context.lookup(rectEntry);
        if (rect instanceof PDFArray && rect.size() >= 4) {
          const ury = rect.get(3);
          if (ury instanceof PDFNumber) y = ury.asNumber();
        }
      }
      map.set(name, { pageIndex: pageIdx, y });
    }
  }
  return map;
}

/**
 * Fill interactive form fields in a PDF with the provided values.
 *
 * Handles text fields, checkboxes, dropdowns, and radio groups. Fields whose
 * names are not found in `fieldValues` are left unchanged. Silently skips
 * any field that errors (e.g. read-only or unsupported type). Optionally
 * flattens the form after filling to produce a non-editable document.
 *
 * @param file - The source PDF file containing form fields.
 * @param fieldValues - Map of field name → value (string for text/dropdown/radio, boolean for checkboxes).
 * @param flatten - If true, flattens the form after filling (default false).
 * @returns New PDF bytes with fields filled (and optionally flattened).
 */
export async function fillPdfForm(
  file: File,
  fieldValues: Record<string, string | boolean>,
  flatten = false,
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const form = pdf.getForm();

  for (const [name, value] of Object.entries(fieldValues)) {
    try {
      const field = form.getField(name);
      if (field instanceof PDFTextField) {
        field.setText(typeof value === "string" ? value : "");
      } else if (field instanceof PDFCheckBox) {
        if (value === true || value === "true") field.check();
        else field.uncheck();
      } else if (field instanceof PDFDropdown) {
        if (typeof value === "string" && value) field.select(value);
      } else if (field instanceof PDFRadioGroup) {
        if (typeof value === "string" && value) field.select(value);
      }
    } catch {
      // Skip fields that cannot be set (read-only, unknown type, etc.)
    }
  }

  if (flatten) form.flatten();

  return pdf.save();
}

/**
 * Flatten a PDF by removing all interactive form fields and annotations,
 * converting them to static content.
 *
 * Useful for locking down filled forms and removing comments before sharing.
 *
 * @param file - The source PDF file.
 * @returns The flattened PDF as raw bytes.
 */
export async function flattenPdf(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  pdf.getForm().flatten();
  // flatten() bakes form-field widgets into page content and drops them from
  // each page's /Annots. Remove any remaining annotations — sticky-note
  // comments, highlights, text markup, links — so the output truly carries no
  // annotation layer, which is what "removes annotations" promises.
  for (const page of pdf.getPages()) {
    page.node.delete(PDFName.of("Annots"));
  }
  return pdf.save();
}
