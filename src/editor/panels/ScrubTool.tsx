// ScrubTool.tsx — Find and permanently remove hidden data (metadata, XMP,
// JavaScript, embedded files, annotations). Analyses the document when the tool
// opens, shows a per-category findings report, and strips it via scrubPdf.
// Panel-only — identical on desktop + mobile.

import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  analyzePdfHiddenData,
  type ScrubAnalysis,
  type ScrubCategory,
  scrubPdf,
} from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead } from "../EditorContext.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

const LABELS: Record<ScrubCategory, string> = {
  metadata: "Document metadata",
  xmp: "XMP metadata packet",
  javascript: "JavaScript & auto-actions",
  attachments: "Embedded files",
  annotations: "Annotations & markup",
};

export function Panel() {
  const { doc } = useEditorRead();
  const { applyTransform } = useEditorActions();
  const [analysis, setAnalysis] = useState<ScrubAnalysis | null>(null);
  const [removeAnnotations, setRemoveAnnotations] = useState(false);

  // (Re)analyse whenever the document changes. `live` ignores stale results;
  // no ref guard (it would bail on StrictMode's second mount and never run).
  useEffect(() => {
    if (!doc) return;
    setAnalysis(null);
    let live = true;
    void analyzePdfHiddenData(docToFile(doc)).then(
      (a) => {
        if (live) setAnalysis(a);
      },
      () => {
        if (live) setAnalysis(null);
      },
    );
    return () => {
      live = false;
    };
  }, [doc]);

  const counts = analysis?.counts;
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;

  const apply = () =>
    void applyTransform(async (d) => ({
      bytes: await scrubPdf(docToFile(d), removeAnnotations),
      label: "Scrub hidden data",
    }));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-dark-text-muted">
        Permanently remove hidden data that can leak who made the file and how.
      </p>

      {!counts ? (
        <p className="text-sm text-slate-500 dark:text-dark-text-muted">
          Scanning for hidden data…
        </p>
      ) : total === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-primary-200 dark:border-primary-900/40 bg-primary-50 dark:bg-primary-900/20 p-3 text-sm text-primary-700 dark:text-primary-300">
          {/* One-accent rule: info/success surfaces collapse to primary tints —
              green survives only on the literal check glyph (see DESIGN.md). */}
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          No hidden data found — this document is already clean.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-dark-border rounded-xl border border-slate-200 dark:border-dark-border bg-white/70 dark:bg-dark-surface">
          {(Object.keys(LABELS) as ScrubCategory[]).map((cat) => {
            const n = counts[cat];
            return (
              <li key={cat} className="flex items-center justify-between px-3 py-2 text-sm">
                <span
                  className={
                    n > 0
                      ? "text-slate-700 dark:text-dark-text"
                      : "text-slate-500 dark:text-dark-text-muted"
                  }
                >
                  {LABELS[cat]}
                </span>
                <span
                  className={`tabular-nums ${n > 0 ? "font-medium text-slate-800 dark:text-dark-text" : "text-slate-500 dark:text-dark-text-muted"}`}
                >
                  {n}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-text-muted">
        <input
          type="checkbox"
          checked={removeAnnotations}
          onChange={(e) => setRemoveAnnotations(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus-visible:ring-primary-500"
        />
        Also remove annotations & markup
      </label>

      <PrimaryAction label="Scrub hidden data" onApply={apply} disabled={total === 0} danger />
    </div>
  );
}
