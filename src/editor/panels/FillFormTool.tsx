/** Interactive form drafts belong to exact bytes, independently of inspector mounts. */
import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Select } from "../../components/Select.tsx";
import {
  fillPdfForm,
  readFormFields,
  FormFieldError,
  type FormFieldInfo,
  type FormValue,
} from "../../utils/pdf/forms.ts";
import { docToFile, hasPendingDestructive } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

const TOOL = "fill-pdf-form";
interface Draft {
  bytes: Uint8Array;
  fields: FormFieldInfo[];
  values: Record<string, FormValue>;
  errors: Record<string, string>;
  flatten: boolean;
}
const same = (a: FormValue, b: FormValue) => JSON.stringify(a) === JSON.stringify(b);
const textValue = (v: FormValue) =>
  Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Checked" : "Unchecked") : v;
const valueError = (f: FormFieldInfo, v: FormValue) =>
  f.maxLength !== undefined && typeof v === "string" && v.length > f.maxLength
    ? `Use ${f.maxLength} characters or fewer.`
    : "";

export function Panel() {
  const { doc, busyLabel } = useEditorRead();
  const { applyTransform, patchToolState, setSelectedPage, setViewMode, setActiveTool } =
    useEditorActions();
  const slice = useToolSlice(TOOL);
  const stored = slice.draft as Draft | undefined;
  const draft = stored?.bytes === doc?.bytes ? stored : undefined;
  const bytes = doc?.bytes;
  const busy = busyLabel !== null;
  const blocked = hasPendingDestructive(doc);
  const [retry, setRetry] = useState(0);
  const [readFailure, setReadFailure] = useState<{
    bytes: Uint8Array;
    message: string;
    retryable: boolean;
  }>();
  const [note, setNote] = useState<{ bytes?: Uint8Array; text: string; failed?: boolean }>();
  // The editor owns a copy of writer output. Bind feedback on the committed render.
  useEffect(() => {
    if (note && !note.bytes && bytes) setNote({ ...note, bytes });
  }, [bytes, note]);
  const applying = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!doc || draft || blocked) return;
    let live = true;
    setReadFailure(undefined);
    void readFormFields(docToFile(doc)).then(
      (fields) => {
        if (live)
          patchToolState(TOOL, {
            draft: {
              bytes: doc.bytes,
              fields,
              values: Object.fromEntries(fields.map((f) => [f.name, f.value])),
              flatten: false,
              errors: {},
            } satisfies Draft,
          });
      },
      (error: unknown) => {
        if (live)
          setReadFailure({
            bytes: doc.bytes,
            message:
              error instanceof FormFieldError
                ? error.message
                : "Couldn't read the form fields. Your PDF is unchanged.",
            retryable: !(error instanceof FormFieldError),
          });
      },
    );
    return () => {
      live = false;
    };
    // Document objects and view changes do not invalidate native fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bytes, stored?.bytes, blocked, retry, patchToolState]);
  const update = (partial: Partial<Draft>) => {
    if (draft) patchToolState(TOOL, { draft: { ...draft, ...partial } });
  };
  const set = (name: string, value: FormValue) => {
    if (!draft || busy || blocked) return;
    update({ values: { ...draft.values, [name]: value } });
    setNote(undefined);
  };
  const validate = (f: FormFieldInfo) => {
    if (draft)
      update({ errors: { ...draft.errors, [f.name]: valueError(f, draft.values[f.name]) } });
  };
  const focusField = (name: string) => {
    const index = draft?.fields.findIndex((f) => f.name === name);
    panel.current?.querySelector<HTMLElement>(`#form-field-${index}`)?.focus();
  };
  const changes = draft
    ? Object.fromEntries(
        draft.fields
          .filter(
            (f) => !f.readOnly && f.type !== "unsupported" && !same(f.value, draft.values[f.name]),
          )
          .map((f) => [f.name, draft.values[f.name]]),
      )
    : {};
  const changed = Object.keys(changes).length;
  const unsupported = draft?.fields.some((f) => f.type === "unsupported");
  const apply = async () => {
    if (!draft || blocked || busy || applying.current || (!changed && !draft.flatten)) return;
    const invalid = draft.fields.find((f) => !f.readOnly && valueError(f, draft.values[f.name]));
    if (invalid) {
      validate(invalid);
      focusField(invalid.name);
      throw new Error(valueError(invalid, draft.values[invalid.name]));
    }
    applying.current = true;
    setNote(undefined);
    try {
      await applyTransform(async (d) => {
        if (d.bytes !== draft.bytes)
          throw new Error("The document changed. Review its fields before saving.");
        const output = await fillPdfForm(docToFile(d), changes, draft.flatten);
        return { bytes: output, label: draft.flatten ? "Fill & flatten form" : "Fill form" };
      });
      patchToolState(TOOL, { draft: undefined });
      setNote({
        text: draft.flatten
          ? "Form flattened. Undo restores its interactive fields."
          : "Form saved. Its fields remain editable.",
      });
    } catch (error) {
      if (error instanceof FormFieldError) {
        update({ errors: { ...draft.errors, [error.fieldName]: error.message } });
        focusField(error.fieldName);
      }
      setNote({
        bytes: draft.bytes,
        failed: true,
        text: `Couldn't save the form. Your answers are preserved. ${error instanceof Error ? error.message : "Try again."}`,
      });
      throw error;
    } finally {
      applying.current = false;
    }
  };

  return (
    <div
      className="pdf-mark-panel pdf-fillform-panel"
      ref={panel}
      tabIndex={-1}
      data-busy-focus-fallback
    >
      {blocked ? (
        <p className="air-notice">
          Apply or remove pending redaction and erase marks before editing form fields.
        </p>
      ) : !draft ? (
        <section aria-label="Read form fields">
          {readFailure?.bytes === bytes && readFailure ? (
            <>
              <p className="air-notice air-notice--error" role="alert">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>{readFailure.message}</span>
              </p>
              {readFailure.retryable && (
                <button className="air-button" type="button" onClick={() => setRetry((n) => n + 1)}>
                  Retry reading fields
                </button>
              )}
            </>
          ) : (
            <p className="air-help" role="status">
              Reading form fields…
            </p>
          )}
        </section>
      ) : !draft.fields.length ? (
        <section aria-label="No form fields">
          <p className="air-notice">
            This PDF has no interactive form fields. For a printed form, try Auto-fill or place text
            with Annotate.
          </p>
          <button className="air-button" type="button" onClick={() => setActiveTool("auto-fill")}>
            Open Auto-fill
          </button>
        </section>
      ) : (
        <>
          <section aria-label="Form answers">
            <p className="air-help">
              Edit your answers here, then save to update the PDF. Required fields are marked by the
              form; you can save partial work.
            </p>
            <ol className="pdf-form-fields">
              {draft.fields.map((f, i) => {
                const value = draft.values[f.name];
                const id = `form-field-${i}`;
                const helpId = `${id}-help`;
                const error = Object.hasOwn(draft.errors, f.name) ? draft.errors[f.name] : "";
                const help =
                  error ||
                  (f.readOnly
                    ? "Read-only in this PDF."
                    : f.maxLength !== undefined
                      ? `Up to ${f.maxLength} characters.`
                      : f.multiple
                        ? "Choose any that apply."
                        : "");
                const shared = {
                  id,
                  name: f.name,
                  autoComplete: "off",
                  disabled: busy,
                  "aria-describedby": help ? helpId : undefined,
                  "aria-invalid": !!error,
                };
                const label = `${f.name}${f.required ? " (required)" : ""}`;
                return (
                  <li className="pdf-property-field" key={f.name}>
                    <div className="pdf-form-heading">
                      {f.type === "unsupported" || f.multiple ? (
                        <span className="air-label" id={`${id}-label`}>
                          {label}
                        </span>
                      ) : (
                        <label className="air-label" id={`${id}-label`} htmlFor={id}>
                          {label}
                        </label>
                      )}
                      {f.pages.map((page) => (
                        <button
                          type="button"
                          key={page}
                          className="air-button air-button--quiet"
                          disabled={busy}
                          aria-label={`Show ${f.name} on page ${page + 1}`}
                          onClick={() => {
                            setSelectedPage(page);
                            setViewMode("focus");
                          }}
                        >
                          Page {page + 1}
                        </button>
                      ))}
                    </div>
                    {f.type === "unsupported" ? (
                      <p className="air-help">
                        This field type cannot be edited here. It will stay unchanged.
                      </p>
                    ) : f.readOnly ? (
                      f.multiline ? (
                        <textarea
                          {...shared}
                          className="air-field"
                          readOnly
                          value={textValue(value)}
                        />
                      ) : (
                        <input
                          {...shared}
                          className="air-field"
                          type={f.password ? "password" : "text"}
                          readOnly
                          value={textValue(value)}
                        />
                      )
                    ) : f.type === "text" ? (
                      f.multiline ? (
                        <textarea
                          {...shared}
                          className="air-field"
                          rows={3}
                          value={textValue(value)}
                          onBlur={() => validate(f)}
                          onChange={(e) => set(f.name, e.target.value)}
                        />
                      ) : (
                        <input
                          {...shared}
                          className="air-field"
                          type={f.password ? "password" : "text"}
                          value={textValue(value)}
                          onBlur={() => validate(f)}
                          onChange={(e) => set(f.name, e.target.value)}
                        />
                      )
                    ) : f.type === "checkbox" ? (
                      <label className="air-check-label">
                        <input
                          {...shared}
                          aria-label={f.name}
                          className="air-check"
                          type="checkbox"
                          checked={value === true}
                          onChange={(e) => set(f.name, e.target.checked)}
                        />
                        <span>Checked</span>
                      </label>
                    ) : f.multiple ? (
                      <fieldset
                        className="air-choice-group"
                        id={id}
                        tabIndex={-1}
                        aria-labelledby={`${id}-label`}
                        aria-describedby={helpId}
                        disabled={busy}
                      >
                        {[
                          ...new Set([
                            ...(f.options ?? []),
                            ...(Array.isArray(value) ? value : []),
                          ]),
                        ].map((option) => (
                          <label className="air-check-label" key={option}>
                            <input
                              className="air-check"
                              type="checkbox"
                              checked={Array.isArray(value) && value.includes(option)}
                              onChange={(e) => {
                                const selected = Array.isArray(value) ? value : [];
                                set(
                                  f.name,
                                  e.target.checked
                                    ? [...selected, option]
                                    : selected.filter((v) => v !== option),
                                );
                              }}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </fieldset>
                    ) : (
                      <>
                        <Select
                          id={f.editable ? `${id}-suggestion` : id}
                          ariaLabel={f.editable ? `${f.name} suggestions` : label}
                          disabled={busy}
                          ariaDescribedBy={help ? helpId : undefined}
                          ariaInvalid={!!error}
                          value={textValue(value)}
                          placeholder="Choose an option"
                          options={[
                            { value: "", label: "No selection" },
                            ...(f.options ?? []).map((option) => ({
                              value: option,
                              label: option,
                            })),
                            ...(typeof value === "string" && value && !f.options?.includes(value)
                              ? [{ value, label: value }]
                              : []),
                          ]}
                          onChange={(value) => set(f.name, value)}
                        />
                        {f.editable && (
                          <>
                            <label className="air-label" htmlFor={id}>
                              Or enter an answer
                            </label>
                            <input
                              {...shared}
                              className="air-field"
                              value={textValue(value)}
                              onChange={(e) => set(f.name, e.target.value)}
                            />
                          </>
                        )}
                      </>
                    )}
                    {help && (
                      <p
                        id={helpId}
                        className={error ? "air-help air-field-error" : "air-help"}
                        role={error ? "alert" : undefined}
                      >
                        {help}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
          <section aria-label="Save form">
            <label className="air-switch-row">
              <span>Flatten after filling</span>
              <input
                className="air-switch"
                role="switch"
                type="checkbox"
                checked={draft.flatten}
                disabled={busy || unsupported}
                onChange={(e) => update({ flatten: e.target.checked })}
              />
            </label>
            <p className="air-help">
              {unsupported
                ? "Flattening is unavailable because this PDF contains unsupported fields."
                : "Makes all form fields fixed page content. Keep this off to edit them later."}
            </p>
          </section>
        </>
      )}
      {note && (!note.bytes || note.bytes === bytes) && (
        <p
          role={note.failed ? "alert" : "status"}
          className={note.failed ? "air-notice air-notice--error" : "air-help"}
        >
          {note.text}
        </p>
      )}
      {(!draft || !!draft.fields.length) && (
        <PrimaryAction
          label={draft?.flatten ? "Save & flatten" : "Save form"}
          disabled={
            !draft || blocked || (!changed && !draft.flatten) || (draft.flatten && unsupported)
          }
          onApply={apply}
        />
      )}
    </div>
  );
}
