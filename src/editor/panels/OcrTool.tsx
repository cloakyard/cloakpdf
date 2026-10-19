import { AlertTriangle, Loader2, ScanText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SegmentedControl } from "../../components/SegmentedControl.tsx";
import { Select } from "../../components/Select.tsx";
import { extractTextGeometry, type LayoutPage } from "../../utils/layout-extract.ts";
import { createSearchablePdfFromLayout } from "../../utils/pdf-operations.ts";
import { type CanvasDoc, docToFile, hasPendingDestructive } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { PageThumb } from "../PageThumb.tsx";

export const OCR_ID = "ocr";
const LANGUAGES = [
  { value: "eng", label: "English" },
  { value: "ara", label: "Arabic" },
  { value: "chi_sim", label: "Chinese" },
  { value: "nld", label: "Dutch" },
  { value: "fra", label: "French" },
  { value: "deu", label: "German" },
  { value: "hin", label: "Hindi" },
  { value: "ita", label: "Italian" },
  { value: "jpn", label: "Japanese" },
  { value: "kor", label: "Korean" },
  { value: "por", label: "Portuguese" },
  { value: "rus", label: "Russian" },
  { value: "spa", label: "Spanish" },
];
const PENDING_TOOLS = [
  { kind: "annotation", id: "annotate-pdf", label: "Review annotations" },
  { kind: "signature", id: "signature", label: "Review signatures" },
  { kind: "stamp", id: "qr-stamp", label: "Review codes" },
];

/** Document identity includes byte edits AND pending marks; the stable id alone
 * cannot distinguish a crop, rotation, undo or new redaction from its source. */
export function ocrHasPreview(slice: Record<string, unknown>, doc: CanvasDoc | null): boolean {
  return !!doc && slice.sourceDoc === doc && Array.isArray(slice.layout);
}

export function OcrPreview() {
  const { doc, selectedPage } = useEditorRead();
  const slice = useToolSlice(OCR_ID);
  const { patchToolState } = useEditorActions();
  if (!doc || !ocrHasPreview(slice, doc)) return null;
  const layout = slice.layout as LayoutPage[];
  const page = doc.pages[selectedPage];
  const text = layout.find((p) => p.pageNumber === selectedPage + 1)?.text ?? "";
  const view = (slice.previewView as "text" | "source") ?? "text";
  return (
    <section className="pdf-ocr-preview" aria-label="OCR preview" data-view={view}>
      <div className="pdf-ocr-preview__switch">
        <SegmentedControl
          value={view}
          onChange={(previewView) => patchToolState(OCR_ID, { previewView })}
          ariaLabel="Preview content"
          fullWidth
          options={[
            { value: "text", label: "Text" },
            { value: "source", label: "Source" },
          ]}
        />
      </div>
      <div className="pdf-ocr-preview__panes">
        <section
          className="pdf-ocr-preview__text"
          aria-label={`Recognised text, page ${selectedPage + 1}`}
        >
          <h3 className="air-label">Recognised text</h3>
          <pre tabIndex={0}>{text.trim() || "No text detected on this page."}</pre>
        </section>
        <section
          className="pdf-ocr-preview__source"
          aria-label={`Source, page ${selectedPage + 1}`}
        >
          <h3 className="air-label">Source</h3>
          <div className="pdf-ocr-preview__paper">
            {page && (
              <PageThumb
                fit
                page={page}
                alt={`Page ${selectedPage + 1}`}
                className="bg-white shadow-sm"
              />
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

export function Panel() {
  const { doc, busyLabel } = useEditorRead();
  const { applyTransform, patchToolState, setActiveTool } = useEditorActions();
  const slice = useToolSlice(OCR_ID);
  const language = (slice.language as string) ?? "eng";
  const hasPreview = ocrHasPreview(slice, doc);
  const layout = hasPreview ? (slice.layout as LayoutPage[]) : [];
  const newPages = layout.filter((p) => p.source === "ocr" && p.items.length > 0).length;
  const missingPositions = layout.some(
    (p) => p.source === "ocr" && p.text.trim() && !p.items.length,
  );
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const busy = busyLabel !== null;
  const pending = !!doc?.objects.length;

  useEffect(() => {
    setExtracting(false);
    setProgress(null);
    setError(null);
    return () => {
      request.current?.abort();
    };
  }, [doc]);
  useEffect(() => {
    if (slice.sourceDoc && slice.sourceDoc !== doc)
      patchToolState(OCR_ID, {
        sourceDoc: null,
        layout: null,
        notice: "Document changed. Extract again to use the current pages.",
      });
  }, [doc, slice.sourceDoc, patchToolState]);

  const extract = async () => {
    if (!doc || busy || pending || extracting) return;
    const controller = new AbortController();
    request.current?.abort();
    request.current = controller;
    const { signal } = controller;
    setExtracting(true);
    setError(null);
    setProgress("Reading pages…");
    patchToolState(OCR_ID, { sourceDoc: null, layout: null, notice: null });
    try {
      const pages = await extractTextGeometry(docToFile(doc), {
        language,
        ocr: "image-only",
        signal,
        onProgress: (done, total) => {
          if (!signal.aborted)
            setProgress(
              done === total ? "Checking scanned pages…" : `Reading page ${done} of ${total}…`,
            );
        },
        onOcrPage: (done, total) => {
          if (!signal.aborted) setProgress(`Recognised ${done} of ${total} scanned pages…`);
        },
      });
      if (!signal.aborted)
        patchToolState(OCR_ID, { sourceDoc: doc, layout: pages, previewView: "text" });
    } catch (e) {
      if (!signal.aborted)
        setError(
          e instanceof Error
            ? `Couldn't extract text. ${e.message}`
            : "Couldn't extract text. Please try again.",
        );
    } finally {
      if (!signal.aborted) {
        setExtracting(false);
        setProgress(null);
      }
    }
  };

  const makeSearchable = async () => {
    if (!hasPreview || !newPages || missingPositions || pending || busy) return;
    try {
      let applied = false;
      await applyTransform(async (d) => {
        if (d !== slice.sourceDoc) throw new Error("Document changed. Extract text again first.");
        const bytes = await createSearchablePdfFromLayout(docToFile(d), layout);
        applied = true;
        return { bytes, label: "OCR — searchable text" };
      });
      if (applied)
        patchToolState(OCR_ID, {
          sourceDoc: null,
          layout: null,
          notice: "Searchable text added. You can undo this change.",
        });
    } catch {
      /* The editor's error banner preserves the preview for retry/copy. */
    }
  };

  return (
    <div className="pdf-ocr-panel">
      <p>
        Make scanned pages searchable. Review the text alongside your original before adding it.
      </p>
      <div>
        <label htmlFor="ocr-language" className="air-label">
          Text language
        </label>
        <Select
          id="ocr-language"
          value={language}
          options={LANGUAGES}
          disabled={extracting || busy}
          onChange={(value) =>
            patchToolState(OCR_ID, { language: value, sourceDoc: null, layout: null, notice: null })
          }
        />
      </div>
      {pending && (
        <div className="air-notice pdf-ocr-panel__notice" role="status">
          <p>Apply pending marks before extracting text, so recognition uses the finished page.</p>
          {hasPendingDestructive(doc) && (
            <button
              type="button"
              className="air-button"
              disabled={busy}
              onClick={() => {
                void applyTransform(async (d) => ({
                  bytes: d.bytes,
                  label: "Apply redactions & erase marks",
                })).catch(() => {});
              }}
            >
              Apply redactions & erase marks
            </button>
          )}
          {PENDING_TOOLS.filter((t) => doc?.objects.some((o) => o.kind === t.kind)).map((t) => (
            <button
              key={t.id}
              type="button"
              className="air-button"
              disabled={busy}
              onClick={() => setActiveTool(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {hasPreview ? (
        <>
          <p className="air-help" role="status">
            {missingPositions
              ? "Word positions are missing. Re-extract before making this PDF searchable."
              : newPages
                ? `${newPages} ${newPages === 1 ? "page is" : "pages are"} ready. Check the recognised text before applying.`
                : layout.some((p) => p.items.length)
                  ? "This document already has searchable text. Its existing text layer will be kept."
                  : "No text detected. Check the source and language, then try again."}
          </p>
          <button
            type="button"
            className="air-button air-button--primary"
            onClick={() => void makeSearchable()}
            disabled={busy || !newPages || missingPositions || pending}
            aria-busy={busy}
          >
            Make searchable
          </button>
          <button
            type="button"
            className="air-button"
            disabled={busy || pending}
            onClick={() => void extract()}
          >
            Re-extract
          </button>
        </>
      ) : (
        <button
          type="button"
          className="air-button air-button--primary"
          onClick={() => void extract()}
          disabled={!doc || extracting || busy || pending}
          aria-busy={extracting}
        >
          {extracting ? (
            <Loader2
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <ScanText className="size-4" aria-hidden="true" />
          )}
          {extracting ? "Working…" : "Extract text"}
        </button>
      )}
      {progress && (
        <p role="status" className="air-help">
          {progress}
        </p>
      )}
      {typeof slice.notice === "string" && (
        <p role="status" className="air-help">
          {slice.notice}
        </p>
      )}
      {error && (
        <p role="alert" className="air-notice air-notice--error">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      <p className="air-help">
        Existing text is kept. Pages without a text layer are recognised on your device. The first
        scan downloads a language model; your PDF stays in this browser.
      </p>
    </div>
  );
}
