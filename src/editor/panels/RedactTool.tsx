// RedactTool.tsx — Redaction-marking tool. The Stage lets the user drag
// redaction boxes on the focused page; the Panel auto-detects PII or finds a
// term and boxes every match. Boxes are stored as persistent `redaction` overlay
// objects in fraction space — NON-destructive while you work, so you can keep
// searching and redacting the same pages. They're rasterised into the pixels
// (text physically destroyed) only at export, or just before the next byte
// transform — see EditorContext.applyTransform + doc.ts flattenDestructiveObjects.
// The committed boxes paint as an always-on base layer in PdfStage; the Stage
// here only draws the in-progress drag box. Reuses the geometry + PII pipeline
// the standalone RedactPdf tool proved. See CLAUDE.md (redaction is destructive).

import { AlertTriangle, Loader2, ScanSearch, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  detectPiiRects,
  extractTextGeometry,
  findTextRects,
  type LayoutPage,
} from "../../utils/layout-extract.ts";
import { PII_LABELS, PII_TYPES, type PiiType } from "../../utils/pii.ts";
import {
  DEFAULT_REDACTION_BORDER,
  DEFAULT_REDACTION_FILL,
  docToFile,
  type RedactionPayload,
} from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { drawRedactionMark } from "../overlay-paint.ts";
import { type StagePoint, useStageProps } from "../stage.tsx";
import type { FractionRect } from "../types.ts";
import { ColorRow, Labeled, type Rgb } from "./controls.tsx";

const TOOL_ID = "redact-pdf";

/** The box appearance shared by the Stage (in-progress box) and Panel (pickers).
 *  Lives in the tool slice so both read the same colours; each drawn box also
 *  captures them into its payload so the burn matches the preview. */
interface RedactStyle {
  fillColor: Rgb;
  borderColor: Rgb;
}

function readStyle(slice: Record<string, unknown>): RedactStyle {
  return {
    fillColor: (slice.fillColor as Rgb) ?? DEFAULT_REDACTION_FILL,
    borderColor: (slice.borderColor as Rgb) ?? DEFAULT_REDACTION_BORDER,
  };
}

export function Stage() {
  const { selectedPage } = useEditorRead();
  const { addObject } = useEditorActions();
  const { fillColor, borderColor } = readStyle(useToolSlice(TOOL_ID));
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [box, setBox] = useState<FractionRect | null>(null);

  // rAF-coalesce the in-progress drag box: a 120Hz pointer stream otherwise
  // fires setBox (→ a Stage re-render → an overlay repaint) on every raw move.
  // Buffer the latest rect in a ref and flush at most once per frame — mirrors
  // PdfStage's scheduleView idiom.
  const pendingRef = useRef<FractionRect | null>(null);
  const frameRef = useRef<number | null>(null);
  const scheduleBox = useCallback((r: FractionRect) => {
    pendingRef.current = r;
    if (frameRef.current != null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      if (pendingRef.current) setBox(pendingRef.current);
    });
  }, []);
  const cancelFrame = useCallback(() => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    pendingRef.current = null;
  }, []);
  useEffect(() => cancelFrame, [cancelFrame]);

  // Committed redaction boxes paint as the PdfStage base layer (always visible);
  // here we draw only the in-progress drag box, in the current chosen colours.
  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (box) drawRedactionMark(ctx, box, w, h, fillColor, borderColor);
    },
    [box, fillColor, borderColor],
  );

  // Memoised handlers so the stage-props registration shallow-bails on renders
  // that don't change the draft box (keeps the overlay from re-registering per
  // frame). The final rect is recomputed from startRef + the up-point, so it
  // never depends on the throttled draft state.
  const onPointerDown = useCallback((p: StagePoint) => {
    startRef.current = { x: p.xPct, y: p.yPct };
  }, []);
  const onPointerMove = useCallback(
    (p: StagePoint) => {
      const s = startRef.current;
      if (!s) return;
      scheduleBox({
        xPct: Math.min(s.x, p.xPct),
        yPct: Math.min(s.y, p.yPct),
        wPct: Math.abs(p.xPct - s.x),
        hPct: Math.abs(p.yPct - s.y),
      });
    },
    [scheduleBox],
  );
  const onPointerUp = useCallback(
    (p: StagePoint) => {
      const s = startRef.current;
      startRef.current = null;
      cancelFrame();
      setBox(null);
      if (!s) return;
      const rect: FractionRect = {
        xPct: Math.min(s.x, p.xPct),
        yPct: Math.min(s.y, p.yPct),
        wPct: Math.abs(p.xPct - s.x),
        hPct: Math.abs(p.yPct - s.y),
      };
      if (rect.wPct > 0.01 && rect.hPct > 0.01) {
        addObject({
          kind: "redaction",
          pageIndex: selectedPage,
          rect,
          payload: { fill: fillColor, border: borderColor } satisfies RedactionPayload,
        });
      }
    },
    [addObject, selectedPage, fillColor, borderColor, cancelFrame],
  );
  const onPointerCancel = useCallback(() => {
    startRef.current = null;
    cancelFrame();
    setBox(null);
  }, [cancelFrame]);

  useStageProps({
    cursor: "crosshair",
    paintOverlay,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  });

  return null;
}

export function Panel() {
  const { doc } = useEditorRead();
  const { addObjects, removeObject, removeObjects, patchToolState, setSelectedPage, setViewMode } =
    useEditorActions();
  const { fillColor, borderColor } = readStyle(useToolSlice(TOOL_ID));
  const [piiTypes, setPiiTypes] = useState<Set<PiiType>>(
    () => new Set(PII_TYPES.filter((t) => t !== "date")),
  );
  const [detecting, setDetecting] = useState(false);
  type StatusMessage = { tone: "muted" | "error"; text: string };
  // Scan and text-query feedback stay independent. A PII scan failure must not
  // make the separate text field invalid (or vice versa).
  const [scanSummary, setScanSummary] = useState<StatusMessage | null>(null);
  const [querySummary, setQuerySummary] = useState<StatusMessage | null>(null);
  // Find-text-and-redact: type a name/phrase, black out every occurrence.
  const [term, setTerm] = useState("");
  const [finding, setFinding] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [ocr, setOcr] = useState<{ done: number; total: number } | null>(null);

  // Geometry cache keyed by the doc's byte buffer — Detect and Find share one
  // extraction (and one OCR pass) instead of re-reading the whole document on
  // every click. Adding redaction objects keeps the same bytes, so the cache
  // survives a detect→find sequence; applyTransform mints fresh bytes on Apply,
  // which invalidates it automatically (the reference comparison fails).
  const geomRef = useRef<{ key: Uint8Array; pages: LayoutPage[] } | null>(null);

  // Detect/Find run a (possibly long) OCR pass with NO busy overlay, so the user
  // can undo / switch tools / apply another transform meanwhile. Track the live
  // doc id so a scan that started against an old doc drops its results instead of
  // committing redaction boxes at fraction coords that no longer line up.
  const docIdRef = useRef(doc?.id);
  docIdRef.current = doc?.id;

  const ensureGeometry = useCallback(async (): Promise<LayoutPage[]> => {
    if (!doc) return [];
    const cached = geomRef.current;
    if (cached && cached.key === doc.bytes) return cached.pages;
    const pages = await extractTextGeometry(docToFile(doc), {
      ocr: true,
      onOcrPage: (done, total) => setOcr({ done, total }),
    });
    geomRef.current = { key: doc.bytes, pages };
    return pages;
  }, [doc]);

  const redactions = (doc?.objects ?? []).filter((o) => o.kind === "redaction");
  const count = redactions.length;

  const toggle = (t: PiiType) =>
    setPiiTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const detect = useCallback(async () => {
    if (!doc || piiTypes.size === 0) return;
    const startId = doc.id;
    setDetecting(true);
    setScanSummary(null);
    setOcr(null);
    try {
      const pages = await ensureGeometry();
      if (docIdRef.current !== startId) return; // doc changed mid-scan — drop stale results
      const found = detectPiiRects(pages, [...piiTypes]);
      if (found.length === 0) {
        setScanSummary({
          tone: "muted",
          text: "No matching sensitive data found — draw boxes by hand if needed.",
        });
        return;
      }
      addObjects(
        found.map((r) => ({
          kind: "redaction" as const,
          pageIndex: r.pageIndex,
          rect: { xPct: r.xPct, yPct: r.yPct, wPct: r.wPct, hPct: r.hPct },
          payload: { fill: fillColor, border: borderColor } satisfies RedactionPayload,
        })),
        "Detect PII",
      );
      setScanSummary({
        tone: "muted",
        text: `Added ${found.length} box${found.length > 1 ? "es" : ""}.`,
      });
    } catch {
      setScanSummary({ tone: "error", text: "Couldn't scan this document for sensitive data." });
    } finally {
      setDetecting(false);
      setOcr(null);
    }
  }, [doc, piiTypes, addObjects, ensureGeometry, fillColor, borderColor]);

  const find = useCallback(async () => {
    const q = term.trim();
    if (!doc || !q) return;
    const startId = doc.id;
    setFinding(true);
    setQuerySummary(null);
    setOcr(null);
    try {
      const pages = await ensureGeometry();
      if (docIdRef.current !== startId) return; // doc changed mid-search — drop stale results
      const rects = findTextRects(pages, [q], { caseSensitive, wholeWord });
      if (rects.length === 0) {
        setQuerySummary({
          tone: "muted",
          text: `No text-layer matches for “${q}”. It may be an image — run OCR first.`,
        });
        return;
      }
      addObjects(
        rects.map((r) => ({
          kind: "redaction" as const,
          pageIndex: r.pageIndex,
          rect: { xPct: r.xPct, yPct: r.yPct, wPct: r.wPct, hPct: r.hPct },
          payload: { fill: fillColor, border: borderColor } satisfies RedactionPayload,
        })),
        `Find “${q}”`,
      );
      const onPages = [...new Set(rects.map((r) => r.pageIndex + 1))].sort((a, b) => a - b);
      setQuerySummary({
        tone: "muted",
        text: `Added ${rects.length} box${rects.length === 1 ? "" : "es"} for “${q}” on page${
          onPages.length === 1 ? "" : "s"
        } ${onPages.join(", ")}.`,
      });
      setTerm("");
    } catch {
      setQuerySummary({ tone: "error", text: "Couldn't search this document for that text." });
    } finally {
      setFinding(false);
      setOcr(null);
    }
  }, [doc, term, caseSensitive, wholeWord, addObjects, ensureGeometry, fillColor, borderColor]);

  const clearAll = () => {
    const ids = (doc?.objects ?? []).filter((o) => o.kind === "redaction").map((o) => o.id);
    if (ids.length > 0) removeObjects(ids, "Clear redactions");
  };

  return (
    <div className="flex flex-col gap-4">
      <section
        className="space-y-3 border-y border-[var(--color-rule)] py-3"
        aria-label="Smart redaction"
      >
        <div className="flex items-start gap-2">
          <ScanSearch className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
          <p className="text-xs text-[var(--color-ink-3)]">
            Auto-detect emails, phones & IDs, or drag boxes on the page.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-input)] border border-[var(--color-rule)] bg-[var(--color-rule)]">
          {PII_TYPES.map((t) => {
            const on = piiTypes.has(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t)}
                disabled={detecting}
                aria-pressed={on}
                className={`cloak-focus min-h-9 px-2.5 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.04em] transition-[color,background-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11 ${
                  on
                    ? "bg-[var(--color-accent-soft)] text-primary-700 shadow-[inset_2px_0_0_var(--color-accent)]"
                    : "bg-[var(--color-surface)] text-[var(--color-ink-3)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]"
                }`}
              >
                {PII_LABELS[t]}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => void detect()}
          disabled={detecting || finding || piiTypes.size === 0}
          aria-describedby={
            detecting && ocr
              ? "redaction-scan-progress"
              : scanSummary
                ? "redaction-scan-status"
                : undefined
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary-600 px-3 py-2.5 font-mono text-xs font-semibold text-[var(--color-accent-ink)] hover:bg-primary-700 active:translate-y-px pointer-coarse:min-h-11 disabled:cursor-not-allowed disabled:opacity-50 transition-[color,background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          {detecting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ScanSearch className="h-4 w-4" aria-hidden="true" />
          )}
          {detecting ? "Scanning…" : "Detect & add boxes"}
        </button>
        {detecting && ocr && (
          <p
            id="redaction-scan-progress"
            role="status"
            className="text-xs text-[var(--color-ink-3)]"
          >
            Reading scanned pages… ({ocr.done}/{ocr.total})
          </p>
        )}
        {scanSummary && (
          <p
            id="redaction-scan-status"
            role={scanSummary.tone === "error" ? "alert" : "status"}
            className={
              scanSummary.tone === "error"
                ? "cloak-notice cloak-notice--danger text-xs"
                : "text-xs text-[var(--color-ink-3)]"
            }
          >
            {scanSummary.tone === "error" && (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{scanSummary.text}</span>
          </p>
        )}
      </section>

      {/* Find text & redact — black out every occurrence of a name or phrase. */}
      <section
        className="space-y-2 border-b border-[var(--color-rule)] pb-3"
        aria-label="Find text"
      >
        <p className="text-xs text-[var(--color-ink-3)]">
          Type a name or phrase to black out every occurrence — what auto-detect cannot catch.
        </p>
        <label htmlFor="redaction-search" className="cloak-field-label">
          Text to redact
        </label>
        <div className="flex items-center gap-1.5">
          <div className="cloak-search-field min-w-0 flex-1 px-2.5">
            <Search className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
            <input
              id="redaction-search"
              type="text"
              aria-label="Text to redact"
              aria-describedby="redaction-search-status"
              aria-invalid={querySummary?.tone === "error"}
              name="redaction-search"
              autoComplete="off"
              value={term}
              placeholder="Search text…"
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void find();
                }
              }}
              className="h-11 px-2 text-sm placeholder:text-[var(--color-ink-3)]"
            />
          </div>
          <button
            type="button"
            onClick={() => void find()}
            disabled={detecting || finding || !term.trim()}
            aria-label="Find and redact"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary-600 px-3 py-2 font-mono text-xs font-semibold text-[var(--color-accent-ink)] hover:bg-primary-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 transition-[color,background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            {finding && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {finding ? "Finding…" : "Find"}
          </button>
        </div>
        {querySummary ? (
          <p
            id="redaction-search-status"
            role={querySummary.tone === "error" ? "alert" : "status"}
            className={
              querySummary.tone === "error"
                ? "cloak-notice cloak-notice--danger text-xs"
                : "text-xs text-[var(--color-ink-3)]"
            }
          >
            {querySummary.tone === "error" && (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{querySummary.text}</span>
          </p>
        ) : (
          <p
            id="redaction-search-status"
            role={finding ? "status" : undefined}
            className="min-h-[1lh] text-xs text-[var(--color-ink-3)]"
          >
            {finding
              ? ocr
                ? `Reading scanned pages… (${ocr.done}/${ocr.total})`
                : "Finding matches…"
              : "Search one phrase at a time; every match becomes an editable redaction box."}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <label className="flex items-center gap-2 text-xs text-[var(--color-ink-2)]">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              disabled={finding}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus-visible:ring-primary-500"
            />
            Match case
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--color-ink-2)]">
            <input
              type="checkbox"
              checked={wholeWord}
              onChange={(e) => setWholeWord(e.target.checked)}
              disabled={finding}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus-visible:ring-primary-500"
            />
            Whole word
          </label>
        </div>
      </section>

      {/* Box appearance — fill + border, the same colour picker + presets every
          tool uses. Applies to new boxes (detect / find / hand-drawn). */}
      <div className="flex flex-col gap-3">
        <Labeled label="Fill colour">
          <ColorRow value={fillColor} onChange={(c) => patchToolState(TOOL_ID, { fillColor: c })} />
        </Labeled>
        <Labeled label="Border colour">
          <ColorRow
            value={borderColor}
            onChange={(c) => patchToolState(TOOL_ID, { borderColor: c })}
          />
        </Labeled>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-ink-2)]">
            {count} redaction{count === 1 ? "" : "s"}
          </span>
          {count > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="cloak-focus inline-flex min-h-11 items-center px-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-primary-600 hover:text-primary-700"
            >
              Clear all
            </button>
          )}
        </div>
        {count > 0 && (
          <ul className="cloak-ledger thin-scrollbar max-h-40 overflow-y-auto">
            {redactions.map((r, i) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-1 px-2.5 py-1.5 text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPage(r.pageIndex);
                    setViewMode("focus");
                  }}
                  className="cloak-focus min-h-9 min-w-0 flex-1 truncate text-left text-[var(--color-ink-2)] hover:text-primary-600 pointer-coarse:min-h-11"
                >
                  Box {i + 1} · page {r.pageIndex + 1}
                </button>
                <button
                  type="button"
                  onClick={() => removeObject(r.id)}
                  aria-label={`Remove box ${i + 1}`}
                  className="cloak-focus inline-flex min-h-9 min-w-9 items-center justify-center text-[var(--color-ink-3)] hover:bg-[var(--color-paper)] hover:text-[var(--color-danger)] pointer-coarse:min-h-11 pointer-coarse:min-w-11"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-[var(--color-ink-3)]">
        Redactions stay editable — your text remains searchable — and are burned into the pages
        permanently when you export.
      </p>
    </div>
  );
}
