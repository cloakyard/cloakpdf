// Standard PDF properties; drafts belong to the exact source byte revision.
import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DateTimeInput } from "../../components/DateTimeInput.tsx";
import type { PdfMetadata } from "../../types.ts";
import { formatFileSize } from "../../utils/file-helpers.ts";
import {
  getPdfInfo,
  getPdfMetadata,
  setPdfMetadata,
  type PdfInfo,
} from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

const TOOL_ID = "metadata";
const EMPTY: PdfMetadata = {
  title: "",
  author: "",
  subject: "",
  keywords: "",
  creator: "",
  producer: "",
  creationDate: "",
  modificationDate: "",
};
const TEXT_FIELDS = [
  ["title", "Title"],
  ["author", "Author"],
  ["subject", "Subject"],
  ["keywords", "Keywords"],
  ["creator", "Creator"],
  ["producer", "Producer"],
] as const;

function pageSizeLabel(pages: PdfInfo["pages"]): string {
  if (!pages.length) return "Unavailable";
  const round = (p: { width: number; height: number }) =>
    `${Math.round(p.width)} × ${Math.round(p.height)}`;
  const first = round(pages[0]);
  return `${first} pt${pages.every((p) => round(p) === first) ? "" : " · varies"}`;
}

export function Panel() {
  const { doc, busyLabel } = useEditorRead();
  const { applyTransform, patchToolState } = useEditorActions();
  const draft = useToolSlice(TOOL_ID);
  const [report, setReport] = useState<{
    bytes: Uint8Array;
    fields?: PdfMetadata;
    info?: PdfInfo;
    failed?: boolean;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "failed" | "saved">("idle");
  const applying = useRef(false);
  const savedFields = useRef<PdfMetadata | null>(null);
  const bytes = doc?.bytes;
  const fileName = doc?.fileName;
  useEffect(() => {
    if (!bytes) return;
    let live = true;
    setReport(null);
    const file = new File([bytes as Uint8Array<ArrayBuffer>], fileName ?? "document.pdf", {
      type: "application/pdf",
    });
    void Promise.all([getPdfMetadata(file), getPdfInfo(file)]).then(
      ([fields, info]) => {
        if (live) setReport({ bytes, fields, info });
      },
      () => {
        if (live) setReport({ bytes, failed: true });
      },
    );
    return () => {
      live = false;
    };
  }, [bytes, fileName, attempt]);

  const current = report?.bytes === bytes ? report : null;
  const fields = draft.sourceBytes === bytes ? (draft.fields as PdfMetadata) : current?.fields;
  const busy = busyLabel !== null;
  const setFields = (next: PdfMetadata) => {
    setSaveState("idle");
    patchToolState(TOOL_ID, { sourceBytes: bytes, fields: next });
  };
  const apply = async () => {
    if (!fields || !current?.info || busy || applying.current) return;
    applying.current = true;
    setSaveState("idle");
    try {
      await applyTransform(async (d) => {
        const bytes = await setPdfMetadata(docToFile(d), fields);
        return { bytes, label: "Edit metadata" };
      });
      patchToolState(TOOL_ID, { sourceBytes: undefined, fields: undefined });
      savedFields.current = fields;
      setSaveState("saved");
    } catch (error) {
      setSaveState("failed");
      throw error;
    } finally {
      applying.current = false;
    }
  };

  return (
    <div className="pdf-mark-panel pdf-metadata-panel">
      <section aria-label="Document properties">
        <p>Review this document and edit its standard properties.</p>
        {current?.info && (
          <dl className="pdf-document-facts">
            {[
              ["File name", fileName],
              ["File size", formatFileSize(current.info.fileSize)],
              ["PDF version", current.info.version],
              ["Pages", current.info.pageCount],
              ["Page size", pageSizeLabel(current.info.pages)],
              ["Encrypted", current.info.isEncrypted ? "Yes" : "No"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        <p
          id="metadata-read-status"
          role={current?.failed ? "alert" : "status"}
          className={current?.failed ? "air-notice air-notice--error" : "air-help"}
        >
          {current?.failed && <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />}
          <span>
            {current?.failed
              ? "Couldn't read the document properties. Your PDF and any draft are unchanged. Try again."
              : !current
                ? "Reading document properties…"
                : ""}
          </span>
        </p>
        {(current?.failed || attempt > 0) && (
          <button
            type="button"
            className="air-button"
            aria-disabled={!current || busy}
            onClick={() => {
              if (current && !busy) setAttempt((n) => n + 1);
            }}
          >
            Read properties again
          </button>
        )}
      </section>
      {fields && (
        <>
          <section aria-label="Editable metadata">
            {TEXT_FIELDS.map(([key, label]) => (
              <div className="pdf-property-field" key={key}>
                <label className="air-label" htmlFor={`metadata-${key}`}>
                  {label}
                </label>
                <input
                  className="air-field"
                  id={`metadata-${key}`}
                  name={`metadata-${key}`}
                  autoComplete="off"
                  value={fields[key]}
                  disabled={busy}
                  onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
                />
              </div>
            ))}
            {(
              [
                ["creationDate", "Created"],
                ["modificationDate", "Modified"],
              ] as const
            ).map(([key, label]) => (
              <div className="pdf-property-field" key={key}>
                <label className="air-label" htmlFor={`metadata-${key}`}>
                  {label}
                </label>
                <DateTimeInput
                  id={`metadata-${key}`}
                  label={label}
                  value={fields[key]}
                  disabled={busy}
                  onChange={(v) => setFields({ ...fields, [key]: v })}
                />
              </div>
            ))}
            <p className="air-help">
              Dates use your local time. Changes are saved when you apply this tool.
            </p>
          </section>
          <section aria-label="Save metadata">
            <button
              type="button"
              className="air-button air-button--quiet"
              disabled={busy}
              onClick={() => setFields({ ...EMPTY })}
            >
              Clear all fields
            </button>
            <p className="air-help">
              Clearing these fields does not remove XMP or other hidden data. Use Scrub to review
              those categories.
            </p>
          </section>
        </>
      )}
      <section aria-label="Apply metadata">
        <p
          id="metadata-save-status"
          role={saveState === "failed" ? "alert" : "status"}
          className={saveState === "failed" ? "air-notice air-notice--error" : "air-help"}
        >
          {saveState === "failed" && (
            <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
          )}
          <span>
            {saveState === "failed"
              ? "Couldn't save metadata. Your document and draft are unchanged. Try saving again."
              : saveState === "saved" &&
                  current?.fields &&
                  (Object.keys(EMPTY) as (keyof PdfMetadata)[]).every(
                    (key) => current.fields?.[key] === savedFields.current?.[key],
                  )
                ? "Metadata saved. Undo restores the previous properties."
                : ""}
          </span>
        </p>
        <PrimaryAction label="Save metadata" disabled={!fields || !current?.info} onApply={apply} />
      </section>
    </div>
  );
}
