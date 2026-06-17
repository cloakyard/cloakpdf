// OcrTool.tsx — Make a scanned / image-only PDF searchable, with a layout-aware
// side-by-side preview. Two phases:
//   1. Extract — read digital pages from the text layer (liteparse) and OCR
//      scanned pages (Tesseract); show the recognised text NEXT TO the source
//      page so the user can verify it before committing.
//   2. Make searchable — burn an invisible, correctly-positioned text layer over
//      the original pages (createSearchablePdfFromLayout); page visuals are
//      untouched, the text becomes selectable/searchable (and the editor's own
//      PII auto-detect can then find it).
// Falls back to the Tesseract-only path (line-stacked text, no geometry) when
// the layout parse comes back empty. The preview lives in the center stage
// (OcrPreview, rendered by EditorShell when this tool has an extraction); the
// Panel owns the language picker + the two actions.
//
// Runs on mobile too (enabled by request): the recognised-text/page preview
// fills the canvas area above the tool sheet, and the Extract / Make-searchable
// actions live in the sheet. The OCR engine + page rasterisation are memory-
// hungry, so a very large scanned PDF can still strain a low-RAM phone — that
// trade-off was accepted deliberately (the standalone OCR card stays desktop-
// only via its own `desktopOnly` flag).

import { AlertTriangle, Loader2, ScanText } from "lucide-react";
import { useMemo, useState } from "react";
import { Select } from "../../components/Select.tsx";
import {
  extractLayout,
  type LayoutPage,
  layoutToReadingOrderText,
} from "../../utils/layout-extract.ts";
import {
  createSearchablePdf,
  createSearchablePdfFromLayout,
  extractTextOcr,
} from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { PageThumb } from "../PageThumb.tsx";
import { Segmented } from "./WholeDocPanel.tsx";

export const OCR_ID = "ocr";

const LANGUAGES = [
  { code: "auto", label: "Auto detect" },
  { code: "eng", label: "English" },
  { code: "ara", label: "Arabic" },
  { code: "chi_sim", label: "Chinese" },
  { code: "nld", label: "Dutch" },
  { code: "fra", label: "French" },
  { code: "deu", label: "German" },
  { code: "hin", label: "Hindi" },
  { code: "ita", label: "Italian" },
  { code: "jpn", label: "Japanese" },
  { code: "kor", label: "Korean" },
  { code: "por", label: "Portuguese" },
  { code: "rus", label: "Russian" },
  { code: "spa", label: "Spanish" },
] as const;

type PreviewMode = "layout" | "text";

/** Whether this tool has an extraction ready to preview / apply for THIS doc.
 *  The extraction is tagged with the doc id at write time, so a stale result —
 *  a different document, or an in-flight extraction that resolved after the doc
 *  was replaced — is never shown or applied. */
export function ocrHasPreview(slice: Record<string, unknown>, docId: string | undefined): boolean {
  return Array.isArray(slice.pageTexts) && slice.docId === docId;
}

// ── Center surface: source page ↔ recognised text, per page ──────────
export function OcrPreview() {
  const { doc, selectedPage } = useEditorRead();
  const slice = useToolSlice(OCR_ID);
  const layout = (slice.layout as LayoutPage[] | null) ?? null;
  const pageTexts = (slice.pageTexts as string[] | undefined) ?? [];
  const previewMode = (slice.previewMode as PreviewMode) ?? "layout";
  const { patchToolState } = useEditorActions();

  if (!doc || !ocrHasPreview(slice, doc.id)) return null;
  const page = doc.pages[selectedPage];
  const lp = layout?.[selectedPage];
  const hasLayout = layout != null && layout.length > 0;
  const text = previewMode === "layout" && lp ? lp.text : (pageTexts[selectedPage] ?? "");

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-100 dark:bg-dark-bg p-4 sm:p-6">
      <div className="mx-auto mb-3 flex w-full max-w-5xl items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-600 dark:text-dark-text-muted">
          Recognised text
        </span>
        {hasLayout && (
          <div className="w-44">
            <Segmented<PreviewMode>
              value={previewMode}
              onChange={(v) => patchToolState(OCR_ID, { previewMode: v })}
              options={[
                { value: "layout", label: "Layout" },
                { value: "text", label: "Plain text" },
              ]}
            />
          </div>
        )}
      </div>

      <div className="mx-auto grid min-h-0 w-full max-w-5xl flex-1 gap-4 md:grid-cols-2">
        {/* Recognised text */}
        <pre
          className={`thin-scrollbar min-h-0 min-w-0 overflow-auto rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface p-3 text-slate-700 dark:text-dark-text ${
            previewMode === "layout" && hasLayout
              ? "whitespace-pre text-xs"
              : "whitespace-pre-wrap text-sm"
          }`}
        >
          {text.trim() || "(No text detected on this page)"}
        </pre>

        {/* Source page — aspect-locked so it never stretches to the (taller)
            recognised-text column beside it. */}
        <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface p-2">
          {page ? (
            <PageThumb
              page={page}
              alt={`Page ${selectedPage + 1}`}
              className="h-full max-w-full rounded-md"
            />
          ) : (
            <div className="h-full w-full bg-white" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Panel: language + extract + make searchable ──────────────────────
export function Panel() {
  const { doc, busyLabel } = useEditorRead();
  const { applyTransform, patchToolState } = useEditorActions();
  const slice = useToolSlice(OCR_ID);
  const language = (slice.language as string) ?? "auto";
  const langOptions = useMemo<{ value: string; label: string }[]>(
    () => LANGUAGES.map((l) => ({ value: l.code, label: l.label })),
    [],
  );
  const hasPreview = ocrHasPreview(slice, doc?.id);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  // Separate from `progress` so a failure SURVIVES the `.finally()` that clears
  // the transient status (previously the error was set into `progress` and
  // immediately wiped, so it never rendered). Cleared at the next run start.
  const [error, setError] = useState<string | null>(null);
  const busy = busyLabel !== null;

  const extract = () => {
    if (!doc) return;
    const docId = doc.id;
    setExtracting(true);
    setError(null);
    setProgress("Analysing pages…");
    const lang = language === "auto" ? "eng" : language;
    void extractLayout(docToFile(doc), {
      language: lang,
      onOcrPage: (done, total) => setProgress(`Recognising page ${done} / ${total}…`),
    })
      .then(
        async (layoutPages) => {
          const texts = layoutPages.map((p) => layoutToReadingOrderText(p));
          const dense = texts.join("").replace(/\s+/g, "").length;
          if (dense > 0) {
            patchToolState(OCR_ID, {
              docId,
              layout: layoutPages,
              pageTexts: texts,
              previewMode: "layout",
            });
            return;
          }
          // liteparse came back empty — fall back to Tesseract-only (no geometry).
          setProgress("Recognising text…");
          const flat = await extractTextOcr(docToFile(doc), language, (done, total) =>
            setProgress(`Recognising page ${done} / ${total}…`),
          );
          patchToolState(OCR_ID, { docId, layout: null, pageTexts: flat, previewMode: "text" });
        },
        () => setError("Couldn't read this document. It may be corrupt or password-protected."),
      )
      .finally(() => {
        setExtracting(false);
        setProgress(null);
      });
  };

  const makeSearchable = () => {
    void applyTransform(async (d) => {
      const layout = (slice.layout as LayoutPage[] | null) ?? null;
      const pageTexts = (slice.pageTexts as string[] | undefined) ?? [];
      const bytes =
        layout && layout.length > 0
          ? await createSearchablePdfFromLayout(docToFile(d), layout)
          : await createSearchablePdf(docToFile(d), pageTexts);
      return { bytes, label: "OCR — searchable text" };
    }).then(() => patchToolState(OCR_ID, { layout: null, pageTexts: undefined }));
  };

  const langPicker = (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-slate-600 dark:text-dark-text-muted">
        Language
      </span>
      <Select
        value={language}
        options={langOptions}
        onChange={(v) => patchToolState(OCR_ID, { language: v })}
        disabled={extracting || busy}
        ariaLabel="OCR language"
      />
    </label>
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-dark-text-muted">
        Add an invisible text layer so a scanned PDF becomes selectable and searchable. The page
        visuals stay exactly as they are.
      </p>

      {langPicker}

      {!hasPreview ? (
        <button
          type="button"
          onClick={extract}
          disabled={extracting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          {extracting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ScanText className="h-4 w-4" />
          )}
          {extracting ? "Working…" : "Extract text"}
        </button>
      ) : (
        <>
          <p className="rounded-lg bg-slate-50 dark:bg-dark-bg px-3 py-2 text-xs text-slate-500 dark:text-dark-text-muted">
            Recognised text is shown with each page — side by side on wide screens, stacked on small
            ones. Step through to verify, then embed it as a searchable layer.
          </p>
          <button
            type="button"
            onClick={makeSearchable}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            {busy ? "Working…" : "Make searchable"}
          </button>
          <button
            type="button"
            onClick={() => patchToolState(OCR_ID, { layout: null, pageTexts: undefined })}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-dark-text-muted dark:hover:text-dark-text"
          >
            Re-extract
          </button>
        </>
      )}

      {progress && (
        <p role="status" className="text-xs text-slate-500 dark:text-dark-text-muted">
          {progress}
        </p>
      )}
      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-red-700 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      <p className="text-xs text-slate-500 dark:text-dark-text-muted">
        Digital pages read instantly. Scanned pages download a one-time OCR engine (~10–15 MB), then
        recognise on-device — nothing leaves your browser.
      </p>
    </div>
  );
}
