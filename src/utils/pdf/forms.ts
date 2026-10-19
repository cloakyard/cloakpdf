/** Native form schema and writes share one set of supported field types. */
import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFRadioGroup,
  PDFOptionList,
  PDFDict,
  PDFArray,
  PDFName,
} from "@pdfme/pdf-lib";
import { visiblePageGeometry } from "./page-geometry.ts";

function assertNativeForm(pdf: PDFDocument) {
  if (pdf.catalog.lookupMaybe(PDFName.of("AcroForm"), PDFDict)?.has(PDFName.of("XFA")))
    throw new FormFieldError(
      "",
      "This PDF uses XFA form fields, which cannot be edited here. Open it in a PDF reader that supports XFA.",
    );
}

export type FormValue = string | boolean | string[];
export interface FormFieldInfo {
  name: string;
  type: "text" | "checkbox" | "choice" | "unsupported";
  value: FormValue;
  pages: number[];
  readOnly: boolean;
  required: boolean;
  options?: string[];
  multiple?: boolean;
  editable?: boolean;
  multiline?: boolean;
  password?: boolean;
  maxLength?: number;
}

/** One parse; widget identity avoids decoding or traversing user-supplied names. */
export async function readFormFields(file: File): Promise<FormFieldInfo[]> {
  const pdf = await PDFDocument.load(await file.arrayBuffer());
  assertNativeForm(pdf);
  const pages = pdf.getPages();
  const widgetPages = new Map<PDFDict, number>();
  pages.forEach((page, i) => {
    const annots = page.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
    if (annots)
      for (let j = 0; j < annots.size(); j++) {
        const dict = pdf.context.lookup(annots.get(j));
        if (dict instanceof PDFDict) widgetPages.set(dict, i);
      }
  });
  return pdf
    .getForm()
    .getFields()
    .map((field) => {
      const positions = field.acroField
        .getWidgets()
        .flatMap((widget) => {
          const pageIndex = widgetPages.get(widget.dict);
          if (pageIndex === undefined) return [];
          const {
            height,
            matrix: [a, b, c, d, e, f],
          } = visiblePageGeometry(pages[pageIndex]);
          const { x, y, width, height: h } = widget.getRectangle();
          const det = a * d - b * c;
          const corners = [
            [x, y],
            [x + width, y],
            [x, y + h],
            [x + width, y + h],
          ].map(([px, py]) => ({
            x: (d * (px - e) - c * (py - f)) / det,
            y: height - (-b * (px - e) + a * (py - f)) / det,
          }));
          return [
            {
              pageIndex,
              x: Math.min(...corners.map((p) => p.x)),
              y: Math.min(...corners.map((p) => p.y)),
            },
          ];
        })
        .sort((a, b) => a.pageIndex - b.pageIndex || a.y - b.y || a.x - b.x);
      const info: FormFieldInfo = {
        name: field.getName(),
        type: "unsupported",
        value: "",
        pages: [...new Set(positions.map((p) => p.pageIndex))],
        readOnly: field.isReadOnly(),
        required: field.isRequired(),
      };
      if (field instanceof PDFTextField)
        Object.assign(info, {
          type: "text",
          value: field.getText() ?? "",
          multiline: field.isMultiline(),
          password: field.isPassword(),
          maxLength: field.getMaxLength(),
        });
      else if (field instanceof PDFCheckBox)
        Object.assign(info, { type: "checkbox", value: field.isChecked() });
      else if (field instanceof PDFDropdown || field instanceof PDFOptionList)
        Object.assign(info, {
          type: "choice",
          value: field.isMultiselect() ? field.getSelected() : (field.getSelected()[0] ?? ""),
          options: field.getOptions(),
          multiple: field.isMultiselect(),
          editable: field instanceof PDFDropdown && field.isEditable(),
        });
      else if (field instanceof PDFRadioGroup)
        Object.assign(info, {
          type: "choice",
          value: field.getSelected() ?? "",
          options: field.getOptions(),
        });
      return { info, position: positions[0] };
    })
    .sort(
      (a, b) =>
        (a.position?.pageIndex ?? Infinity) - (b.position?.pageIndex ?? Infinity) ||
        (a.position?.y ?? 0) - (b.position?.y ?? 0) ||
        (a.position?.x ?? 0) - (b.position?.x ?? 0),
    )
    .map(({ info }) => info);
}

export class FormFieldError extends Error {
  fieldName: string;
  constructor(fieldName: string, message: string) {
    super(message);
    this.fieldName = fieldName;
  }
}

/** Changing a form is atomic: an invalid value cannot masquerade as a saved field. */
export async function fillPdfForm(
  file: File,
  fieldValues: Record<string, FormValue>,
  flatten = false,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(await file.arrayBuffer());
  assertNativeForm(pdf);
  const form = pdf.getForm();
  if (
    flatten &&
    form
      .getFields()
      .some(
        (f) =>
          !(
            f instanceof PDFTextField ||
            f instanceof PDFCheckBox ||
            f instanceof PDFDropdown ||
            f instanceof PDFOptionList ||
            f instanceof PDFRadioGroup
          ),
      )
  )
    throw new Error(
      "This form contains fields that cannot be flattened here. Keep the form editable.",
    );
  for (const [name, value] of Object.entries(fieldValues)) {
    try {
      const field = form.getField(name);
      if (field.isReadOnly()) throw new Error("This field is read-only.");
      if (field instanceof PDFTextField) {
        if (typeof value !== "string") throw new Error("Enter a text value.");
        const max = field.getMaxLength();
        if (max !== undefined && value.length > max)
          throw new Error(`Use ${max} characters or fewer.`);
        field.setText(value);
      } else if (field instanceof PDFCheckBox) {
        if (typeof value !== "boolean") throw new Error("Choose checked or unchecked.");
        if (value) field.check();
        else field.uncheck();
      } else if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
        const selections = Array.isArray(value)
          ? value
          : typeof value === "string" && value
            ? [value]
            : [];
        if (typeof value === "boolean" || (!field.isMultiselect() && selections.length > 1))
          throw new Error("Choose one available option.");
        if (
          !(field instanceof PDFDropdown && field.isEditable()) &&
          selections.some((v) => !field.getOptions().includes(v))
        )
          throw new Error("Choose an available option.");
        if (selections.length) field.select(selections);
        else field.clear();
      } else if (field instanceof PDFRadioGroup) {
        if (typeof value !== "string" || (value && !field.getOptions().includes(value)))
          throw new Error("Choose an available option.");
        if (value) field.select(value);
        else field.clear();
      } else throw new Error("This field type cannot be edited here.");
      // Update changed appearances here so encoding failures identify their field.
      if (
        field instanceof PDFTextField ||
        field instanceof PDFDropdown ||
        field instanceof PDFOptionList
      )
        field.defaultUpdateAppearances(form.getDefaultFont());
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Couldn't save this value.";
      throw new FormFieldError(
        name,
        /encode|WinAnsi/i.test(reason)
          ? "This field's font cannot print one or more characters. Change those characters and try again."
          : reason,
      );
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
