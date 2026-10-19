// RedactTool.tsx — Redaction-marking tool. The Stage lets the user drag
// redaction boxes on the focused page; the Panel auto-detects PII or finds a
// term and boxes every match. Boxes are stored as persistent `redaction` overlay
// objects in fraction space — NON-destructive while you work, so you can keep
// searching and redacting the same pages. They're rasterised into the pixels
// (text physically destroyed) only at export, or just before the next byte
// transform — see EditorContext.applyTransform + doc.ts flattenDestructiveObjects.
// The committed boxes paint as an always-on base layer in PdfStage; the Stage
// here only draws the in-progress drag box. Shares the geometry + PII pipeline with text extraction. See CLAUDE.md (redaction is destructive).

import { AlertTriangle, ScanSearch, Search } from "lucide-react";
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
import { ColorPicker, hexToRgb, rgbToHex } from "../../components/ColorPicker.tsx";
import type { Rgb } from "./controls.tsx";
import { PendingMarkList } from "./PendingMarkList.tsx";

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
  const { doc, busyLabel } = useEditorRead();
  const { addObjects, patchToolState } = useEditorActions();
  const { fillColor, borderColor } = readStyle(useToolSlice(TOOL_ID));
  const [piiTypes, setPiiTypes] = useState<Set<PiiType>>(
    () => new Set(PII_TYPES.filter((t) => t !== "date")),
  );
  type Operation = "scan" | "query";
  type Message = { tone: "muted" | "error"; text: string };
  const [summary, setSummary] = useState<Partial<Record<Operation, Message>>>({});
  const [pending, setPending] = useState<Operation | null>(null);
  const [progress, setProgress] = useState("");
  const [term, setTerm] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const request = useRef<AbortController | null>(null);
  const geometry = useRef<{ key: Uint8Array; pages: LayoutPage[] } | null>(null);
  const current = useRef(doc);
  current.current = doc;
  const blocked = !!pending || !!busyLabel;

  // Byte transforms preserve the document ID. Own the actual byte revision,
  // not only its ID; undo, replacement and tool exit invalidate in-flight OCR.
  useEffect(() => {
    setPending(null);
    setProgress("");
    setSummary({});
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [doc?.id, doc?.bytes, busyLabel]);

  const run = async (operation: Operation) => {
    const q = term.trim();
    if (!doc || busyLabel || request.current || (operation === "scan" ? !piiTypes.size : !q))
      return;
    const controller = new AbortController();
    const { signal } = controller;
    request.current = controller;
    setPending(operation);
    setSummary((s) => ({ ...s, [operation]: undefined }));
    setProgress("Reading document…");
    const ownsRequest = () =>
      !signal.aborted &&
      request.current === controller &&
      current.current?.id === doc.id &&
      current.current?.bytes === doc.bytes;
    try {
      let pages = geometry.current?.key === doc.bytes ? geometry.current.pages : null;
      if (!pages) {
        pages = await extractTextGeometry(docToFile(doc), {
          ocr: true,
          signal,
          onProgress: (done, total) => {
            if (ownsRequest()) setProgress(`Reading pages… (${done}/${total})`);
          },
          onOcrPage: (done, total) => {
            if (ownsRequest()) setProgress(`Reading scanned pages… (${done}/${total})`);
          },
        });
        if (!ownsRequest()) return;
        geometry.current = { key: doc.bytes, pages };
      }
      if (!ownsRequest()) return;
      const found =
        operation === "scan"
          ? detectPiiRects(pages, [...piiTypes])
          : findTextRects(pages, [q], { caseSensitive, wholeWord });
      if (found.length) {
        addObjects(
          found.map((r) => ({
            kind: "redaction" as const,
            pageIndex: r.pageIndex,
            rect: { xPct: r.xPct, yPct: r.yPct, wPct: r.wPct, hPct: r.hPct },
            payload: { fill: fillColor, border: borderColor } satisfies RedactionPayload,
          })),
          operation === "scan" ? "Detect PII" : `Find “${q}”`,
        );
        if (operation === "query") setTerm("");
      }
      setSummary((s) => ({
        ...s,
        [operation]: {
          tone: "muted",
          text: found.length
            ? `Added ${found.length} box${found.length === 1 ? "" : "es"}${operation === "query" ? ` for “${q}”` : ""}. Review every box before exporting.`
            : operation === "scan"
              ? "No matching sensitive data found. You can draw boxes by hand."
              : `No matches for “${q}”. Check the spelling or draw a box over the text.`,
        },
      }));
    } catch {
      if (ownsRequest())
        setSummary((s) => ({
          ...s,
          [operation]: {
            tone: "error",
            text: `Couldn't ${operation === "scan" ? "scan for sensitive data" : "find that text"}. Your marks are safe. Try again.`,
          },
        }));
    } finally {
      if (request.current === controller) {
        request.current = null;
        setPending(null);
        setProgress("");
      }
    }
  };

  const feedback = (operation: Operation) => {
    const message = summary[operation];
    return (
      <p
        id={`redaction-${operation}-status`}
        role={message?.tone === "error" ? "alert" : "status"}
        className={message?.tone === "error" ? "air-notice air-notice--error" : "air-help"}
      >
        {message?.tone === "error" && <AlertTriangle size={16} aria-hidden="true" />}
        <span>{pending === operation ? progress : message?.text}</span>
      </p>
    );
  };

  return (
    <div className="pdf-mark-panel">
      <p>Find sensitive text or draw boxes on the page. Review each mark before exporting.</p>
      <section aria-label="Smart redaction">
        <fieldset className="air-choice-group" disabled={blocked}>
          <legend>Detect sensitive data</legend>
          <div className="pdf-mark-choices">
            {PII_TYPES.map((type) => (
              <label key={type} className="air-check-label">
                <input
                  className="air-check"
                  type="checkbox"
                  checked={piiTypes.has(type)}
                  onChange={() =>
                    setPiiTypes((prev) => {
                      const next = new Set(prev);
                      if (next.has(type)) next.delete(type);
                      else next.add(type);
                      return next;
                    })
                  }
                />
                <span>{PII_LABELS[type]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          className="air-button air-button--primary"
          aria-disabled={blocked || !piiTypes.size}
          aria-busy={pending === "scan"}
          aria-describedby="redaction-scan-status"
          onClick={() => void run("scan")}
        >
          <ScanSearch size={16} aria-hidden="true" />
          <span className="air-action-labels">
            <span data-active={pending !== "scan" || undefined} aria-hidden={pending === "scan"}>
              Detect &amp; add boxes
            </span>
            <span data-active={pending === "scan" || undefined} aria-hidden={pending !== "scan"}>
              Scanning…
            </span>
          </span>
        </button>
        {feedback("scan")}
      </section>
      <section className="pdf-mark-query" aria-label="Find text">
        <label htmlFor="redaction-search" className="air-label">
          Text to redact
        </label>
        <div className="pdf-mark-search">
          <input
            id="redaction-search"
            className="air-field"
            type="text"
            name="redaction-search"
            autoComplete="off"
            value={term}
            placeholder="Search text…"
            readOnly={blocked}
            aria-describedby="redaction-query-status redaction-search-help"
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                e.preventDefault();
                void run("query");
              }
            }}
          />
          <button
            type="button"
            className="air-button"
            aria-label="Find and redact"
            aria-disabled={blocked || !term.trim()}
            aria-busy={pending === "query"}
            onClick={() => void run("query")}
          >
            <Search size={16} aria-hidden="true" />
            <span className="air-action-labels">
              <span
                data-active={pending !== "query" || undefined}
                aria-hidden={pending === "query"}
              >
                Find
              </span>
              <span
                data-active={pending === "query" || undefined}
                aria-hidden={pending !== "query"}
              >
                Finding…
              </span>
            </span>
          </button>
        </div>
        <p className="air-help" id="redaction-search-help">
          Every match becomes an editable box. Names need a text search or a hand-drawn box.
        </p>
        <div className="pdf-mark-choices">
          <label className="air-check-label">
            <input
              type="checkbox"
              className="air-check"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              disabled={blocked}
            />
            Match case
          </label>
          <label className="air-check-label">
            <input
              type="checkbox"
              className="air-check"
              checked={wholeWord}
              onChange={(e) => setWholeWord(e.target.checked)}
              disabled={blocked}
            />
            Whole word
          </label>
        </div>
        {feedback("query")}
      </section>
      {pending && (
        <button
          type="button"
          className="air-button"
          onClick={() => {
            request.current?.abort();
            request.current = null;
            setSummary((s) => ({
              ...s,
              [pending]: { tone: "muted", text: "Cancelled. Your marks are unchanged." },
            }));
            setPending(null);
            setProgress("");
            document.getElementById("redaction-search")?.focus();
          }}
        >
          Cancel scan
        </button>
      )}
      <section aria-label="New box appearance">
        <ColorPicker
          label="Fill colour"
          value={rgbToHex(fillColor.r, fillColor.g, fillColor.b)}
          onChange={(hex) => patchToolState(TOOL_ID, { fillColor: hexToRgb(hex) })}
        />
        <ColorPicker
          label="Border colour"
          value={rgbToHex(borderColor.r, borderColor.g, borderColor.b)}
          onChange={(hex) => patchToolState(TOOL_ID, { borderColor: hexToRgb(hex) })}
        />
        <p className="air-help">Colours apply to the next boxes you add.</p>
      </section>
      <PendingMarkList kind="redaction" />
      <p className="air-help">
        Marks stay editable until export or another operation changes the PDF. Then marked pages
        become images: covered text is permanently removed, selectable text is lost on those pages,
        and the file may grow.
      </p>
    </div>
  );
}
