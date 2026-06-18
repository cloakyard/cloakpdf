// FillFormTool.tsx — Fill a PDF's interactive AcroForm fields. Reads every
// fillable field when the tool opens (sorted top-to-bottom in reading order),
// renders the right input per field type, and writes the values back via
// fillPdfForm — optionally flattening so the result is no longer editable.
// Panel-only (no canvas interaction), so it's identical on desktop + mobile.
// Mirrors the field enumeration the standalone Fill PDF Form tool proved.

import { PDFCheckBox, PDFDocument, PDFDropdown, PDFRadioGroup, PDFTextField } from "@pdfme/pdf-lib";
import { useEffect, useState } from "react";
import { Select } from "../../components/Select.tsx";
import { fillPdfForm, getFieldPageIndices } from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead } from "../EditorContext.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";
import { Labeled, Toggle } from "./controls.tsx";

type FieldType = "text" | "checkbox" | "dropdown" | "radio";

interface FieldInfo {
  name: string;
  type: FieldType;
  defaultValue: string | boolean;
  options?: string[];
  multiline?: boolean;
  pageIndex: number;
  y: number;
}

/** Enumerate fillable fields in reading order (top-to-bottom, page order). */
async function readFields(file: File): Promise<FieldInfo[]> {
  const [pageMap, ab] = await Promise.all([getFieldPageIndices(file), file.arrayBuffer()]);
  const pdf = await PDFDocument.load(ab);
  const infos = pdf
    .getForm()
    .getFields()
    .map((field): FieldInfo | null => {
      const name = field.getName();
      const pos = pageMap.get(name);
      const pageIndex = pos?.pageIndex ?? 0;
      const y = pos?.y ?? 0;
      if (field instanceof PDFTextField)
        return {
          name,
          type: "text",
          defaultValue: field.getText() ?? "",
          multiline: field.isMultiline(),
          pageIndex,
          y,
        };
      if (field instanceof PDFCheckBox)
        return { name, type: "checkbox", defaultValue: field.isChecked(), pageIndex, y };
      if (field instanceof PDFDropdown)
        return {
          name,
          type: "dropdown",
          defaultValue: field.getSelected()[0] ?? "",
          options: field.getOptions(),
          pageIndex,
          y,
        };
      if (field instanceof PDFRadioGroup)
        return {
          name,
          type: "radio",
          defaultValue: field.getSelected() ?? "",
          options: field.getOptions(),
          pageIndex,
          y,
        };
      return null;
    })
    .filter((f): f is FieldInfo => f !== null);
  infos.sort((a, b) => a.pageIndex - b.pageIndex || b.y - a.y);
  return infos;
}

const INPUT_CLS =
  "w-full rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface px-2.5 py-1.5 text-sm text-slate-800 dark:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

export function Panel() {
  const { doc } = useEditorRead();
  const { applyTransform } = useEditorActions();
  const [fields, setFields] = useState<FieldInfo[] | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [flatten, setFlatten] = useState(false);

  // (Re)read fields whenever the doc changes. `live` guards a stale result and
  // is StrictMode-safe (a ref guard would bail on the second mount).
  useEffect(() => {
    if (!doc) return;
    let live = true;
    void readFields(docToFile(doc)).then(
      (fs) => {
        if (!live) return;
        setFields(fs);
        setValues(Object.fromEntries(fs.map((f) => [f.name, f.defaultValue])));
      },
      () => {
        if (live) setFields([]);
      },
    );
    return () => {
      live = false;
    };
  }, [doc]);

  if (!fields) {
    return <p className="text-sm text-slate-500 dark:text-dark-text-muted">Reading form fields…</p>;
  }

  if (fields.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-dark-text-muted">
        This PDF has no fillable form fields.
      </p>
    );
  }

  const set = (name: string, v: string | boolean) => setValues((prev) => ({ ...prev, [name]: v }));

  const apply = () =>
    void applyTransform(async (d) => ({
      bytes: await fillPdfForm(docToFile(d), values, flatten),
      label: flatten ? "Fill & flatten form" : "Fill form",
    }));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500 dark:text-dark-text-muted">
        {fields.length} fillable field{fields.length === 1 ? "" : "s"}.
      </p>
      {fields.map((f) => {
        const v = values[f.name];
        return (
          <Labeled key={f.name} label={f.name} normalCase>
            {f.type === "text" && f.multiline ? (
              <textarea
                rows={3}
                value={typeof v === "string" ? v : ""}
                onChange={(e) => set(f.name, e.target.value)}
                className={INPUT_CLS}
              />
            ) : f.type === "text" ? (
              <input
                type="text"
                value={typeof v === "string" ? v : ""}
                onChange={(e) => set(f.name, e.target.value)}
                className={INPUT_CLS}
              />
            ) : f.type === "checkbox" ? (
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-text-muted">
                <input
                  type="checkbox"
                  checked={v === true}
                  onChange={(e) => set(f.name, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus-visible:ring-primary-500"
                />
                Checked
              </label>
            ) : (
              <Select
                value={typeof v === "string" ? v : ""}
                onChange={(val) => set(f.name, val)}
                ariaLabel={f.name}
                placeholder="— Select —"
                options={[
                  { value: "", label: "— Select —" },
                  ...(f.options ?? []).map((opt) => ({ value: opt, label: opt })),
                ]}
              />
            )}
          </Labeled>
        );
      })}

      <Toggle
        label="Flatten after filling (locks the form)"
        checked={flatten}
        onChange={setFlatten}
      />
      <PrimaryAction label={flatten ? "Fill & flatten" : "Fill form"} onApply={apply} />
    </div>
  );
}
