// Inspect the supported hidden-data categories before a reversible byte transform.
import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  analyzePdfHiddenData,
  type ScrubAnalysis,
  type ScrubCategory,
  scrubPdf,
} from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

const LABELS: Record<ScrubCategory, string> = {
  metadata: "Document metadata",
  xmp: "XMP metadata packet",
  javascript: "Scripts & auto-actions",
  attachments: "Embedded files",
  annotations: "Annotations & markup",
};
const TOOL_ID = "pdf-scrub";

export function Panel() {
  const { doc, busyLabel } = useEditorRead();
  const { applyTransform, patchToolState } = useEditorActions();
  const removeAnnotations = (useToolSlice(TOOL_ID).removeAnnotations as boolean) ?? false;
  const [report, setReport] = useState<{
    bytes: Uint8Array;
    analysis?: ScrubAnalysis;
    error?: boolean;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [applyError, setApplyError] = useState(false);
  const applying = useRef(false);
  const bytes = doc?.bytes;
  const fileName = doc?.fileName;

  useEffect(() => {
    if (!bytes) return;
    let live = true;
    setReport(null);
    const file = new File([bytes as Uint8Array<ArrayBuffer>], fileName ?? "document.pdf", {
      type: "application/pdf",
    });
    void analyzePdfHiddenData(file).then(
      (analysis) => {
        if (live) setReport({ bytes, analysis });
      },
      () => {
        if (live) setReport({ bytes, error: true });
      },
    );
    return () => {
      live = false;
    };
  }, [bytes, fileName, attempt]);

  const current = report?.bytes === bytes ? report : null;
  const counts = current?.analysis?.counts;
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const selectedCount = total - (removeAnnotations ? 0 : (counts?.annotations ?? 0));
  const busy = busyLabel !== null;
  const apply = async () => {
    if (!counts || !selectedCount || busy || applying.current) return;
    applying.current = true;
    setApplyError(false);
    try {
      await applyTransform(async (d) => ({
        bytes: await scrubPdf(docToFile(d), removeAnnotations),
        label: "Scrub hidden data",
      }));
    } catch (error) {
      setApplyError(true);
      throw error;
    } finally {
      applying.current = false;
    }
  };

  return (
    <div className="pdf-mark-panel pdf-scrub-panel">
      <p>Review metadata, scripts and embedded files before removing them from this PDF.</p>
      <section aria-label="Hidden data report">
        <p
          role={current?.error ? "alert" : "status"}
          className={current?.error ? "air-notice air-notice--error" : "air-help"}
        >
          {current?.error && <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />}
          <span>
            {current?.error
              ? "Couldn't inspect this PDF. Your document is unchanged. Try scanning again."
              : !counts
                ? "Scanning for hidden data…"
                : total === 0
                  ? "No data found in the categories below."
                  : `${selectedCount} ${selectedCount === 1 ? "item" : "items"} selected for removal.`}
          </span>
        </p>
        {(current?.error || attempt > 0) && (
          <button
            type="button"
            className="air-button"
            aria-disabled={busy || !current}
            onClick={() => {
              if (current && !busy) setAttempt((n) => n + 1);
            }}
          >
            Scan again
          </button>
        )}
        {counts && (
          <dl className="pdf-scrub-report">
            {(Object.keys(LABELS) as ScrubCategory[]).map((category) => (
              <div key={category}>
                <dt>{LABELS[category]}</dt>
                <dd>{counts[category]}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      <section aria-label="Removal options">
        <label className="air-check-label">
          <input
            type="checkbox"
            className="air-check"
            checked={removeAnnotations}
            disabled={busy}
            onChange={(e) => patchToolState(TOOL_ID, { removeAnnotations: e.target.checked })}
          />
          Also remove annotations & markup
        </label>
        <p className="air-help">
          This also removes page links and form widgets. Kept annotations may contain author details
          or actions.
        </p>
      </section>
      <p className="air-notice air-notice--warning">
        <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
        <span>
          Scrub rebuilds the PDF. Bookmarks and interactive form registration are lost. Page content
          is kept; visible sensitive text needs Redact.
        </span>
      </p>
      <section aria-label="Apply scrub">
        {applyError && (
          <p role="alert" className="air-notice air-notice--error">
            <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
            <span>
              Couldn't scrub this PDF. Your document and choices are unchanged. Try again.
            </span>
          </p>
        )}
        <PrimaryAction
          label="Scrub hidden data"
          onApply={apply}
          disabled={!counts || selectedCount === 0}
          danger
        />
        <p className="air-help">
          Undo restores the previous document while you work. Export saves the scrubbed version;
          your original file is unchanged.
        </p>
      </section>
    </div>
  );
}
