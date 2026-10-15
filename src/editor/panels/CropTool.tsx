// CropTool.tsx — Whole-page geometry tool. The Stage lets the user drag a
// "keep" rectangle on the focused page (everything outside it dims); the Panel
// applies that fractional crop to every page (or just this one). Crop lives in
// the tool slice — not as a doc object — because it maps to per-page crop boxes,
// not an overlay mark. On Apply, `cropDoc` sets each page's crop box and remaps
// pending marks from the same fractional rect, including mixed sizes and saved
// rotation. Hidden content stays in the file.

import { cropDoc, cropMarginsFromRect, parseCropMargins, type CropMargins } from "../crop.ts";
import { AlertTriangle, Scan, Wand2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { canvas as canvasTheme, canvasAccent } from "../../config/theme.ts";
import { detectContentBox, deskewPdf } from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { type StagePoint, useStageProps } from "../stage.tsx";
import type { FractionRect } from "../types.ts";
import { SegmentedControl } from "../../components/SegmentedControl.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

const TOOL_ID = "crop-pages";
const EMPTY: CropMargins = { top: "0", right: "0", bottom: "0", left: "0" };

export function Stage() {
  const slice = useToolSlice(TOOL_ID);
  const { patchToolState } = useEditorActions();
  const { doc, selectedPage } = useEditorRead();
  const margins =
    slice.sourceBytes === doc?.bytes ? ((slice.margins as CropMargins) ?? EMPTY) : EMPTY;
  const { keep } = parseCropMargins(margins);

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<FractionRect | null>(null);

  // rAF-coalesce the in-progress keep rect (see RedactTool for rationale).
  const pendingRef = useRef<FractionRect | null>(null);
  const frameRef = useRef<number | null>(null);
  const scheduleDraft = useCallback((r: FractionRect) => {
    pendingRef.current = r;
    if (frameRef.current != null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      if (pendingRef.current) setDraft(pendingRef.current);
    });
  }, []);
  const cancelFrame = useCallback(() => {
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    pendingRef.current = null;
  }, []);
  useEffect(() => {
    startRef.current = null;
    setDraft(null);
    cancelFrame();
    return cancelFrame;
  }, [cancelFrame, doc?.bytes, selectedPage]);

  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const r = draft ?? keep;
      if (!r) return;
      const x = r.xPct * w;
      const y = r.yPct * h;
      const bw = r.wPct * w;
      const bh = r.hPct * h;
      // Dim everything outside the keep rect (four bands), then outline it.
      ctx.save();
      ctx.fillStyle = canvasTheme.selectionDim;
      ctx.fillRect(0, 0, w, y); // top
      ctx.fillRect(0, y + bh, w, h - (y + bh)); // bottom
      ctx.fillRect(0, y, x, bh); // left
      ctx.fillRect(x + bw, y, w - (x + bw), bh); // right
      ctx.strokeStyle = canvasAccent(ctx);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, bw, bh);
      ctx.restore();
    },
    [draft, keep],
  );

  const onPointerDown = useCallback((p: StagePoint) => {
    startRef.current = { x: p.xPct, y: p.yPct };
    setDraft({ xPct: p.xPct, yPct: p.yPct, wPct: 0, hPct: 0 });
  }, []);
  const onPointerMove = useCallback(
    (p: StagePoint) => {
      const s = startRef.current;
      if (!s) return;
      scheduleDraft({
        xPct: Math.min(s.x, p.xPct),
        yPct: Math.min(s.y, p.yPct),
        wPct: Math.abs(p.xPct - s.x),
        hPct: Math.abs(p.yPct - s.y),
      });
    },
    [scheduleDraft],
  );
  const onPointerUp = useCallback(
    (p: StagePoint) => {
      const s = startRef.current;
      startRef.current = null;
      cancelFrame();
      setDraft(null);
      if (!s) return;
      const rect: FractionRect = {
        xPct: Math.min(s.x, p.xPct),
        yPct: Math.min(s.y, p.yPct),
        wPct: Math.abs(p.xPct - s.x),
        hPct: Math.abs(p.yPct - s.y),
      };
      if (rect.wPct > 0.02 && rect.hPct > 0.02)
        patchToolState(TOOL_ID, { sourceBytes: doc?.bytes, margins: cropMarginsFromRect(rect) });
    },
    [cancelFrame, patchToolState, doc?.bytes],
  );
  const onPointerCancel = useCallback(() => {
    startRef.current = null;
    cancelFrame();
    setDraft(null);
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
  const { doc, selectedPage, busyLabel } = useEditorRead();
  const { patchToolState, applyTransform } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const margins =
    slice.sourceBytes === doc?.bytes ? ((slice.margins as CropMargins) ?? EMPTY) : EMPTY;
  const { keep, error } = parseCropMargins(margins);
  const scope = (slice.scope as "all" | "page") ?? "all";
  const [scanning, setScanning] = useState(false);
  const [note, setNote] = useState({ text: "", failed: false });
  const [saveFailed, setSaveFailed] = useState(false);
  const request = useRef<AbortController | null>(null);
  const applying = useRef(false);
  const current = useRef({ doc, selectedPage, scope, margins });
  current.current = { doc, selectedPage, scope, margins };
  const trimButton = useRef<HTMLButtonElement>(null);
  const busy = !!busyLabel;
  const pendingMarks = !!doc?.objects.length;

  useEffect(() => {
    setScanning(false);
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [doc?.bytes, doc?.objects, selectedPage, scope, margins]);

  const setMargins = (next: CropMargins) => {
    setNote({ text: "", failed: false });
    setSaveFailed(false);
    patchToolState(TOOL_ID, { sourceBytes: doc?.bytes, margins: next });
  };
  const trimToContent = async () => {
    if (!doc || busy || request.current || pendingMarks) return;
    const controller = new AbortController();
    request.current = controller;
    setScanning(true);
    setNote({ text: "", failed: false });
    const ownsRequest = () =>
      !controller.signal.aborted &&
      request.current === controller &&
      current.current.doc?.bytes === doc.bytes &&
      current.current.doc.objects === doc.objects &&
      current.current.selectedPage === selectedPage &&
      current.current.scope === scope &&
      current.current.margins === margins;
    try {
      const box = await detectContentBox(docToFile(doc), selectedPage, controller.signal);
      if (!ownsRequest()) return;
      if (box) setMargins(cropMarginsFromRect(box));
      setNote({
        text: box
          ? `Suggested a crop from page ${selectedPage + 1}. Review the margins before applying${scope === "all" ? " to every page" : ""}.`
          : "No smaller content area found. This page may be blank or already fill the frame. Your draft is unchanged.",
        failed: false,
      });
    } catch {
      if (ownsRequest())
        setNote({
          text: "Couldn't analyse this page. Your draft is unchanged. Try Trim to content again.",
          failed: true,
        });
    } finally {
      if (ownsRequest()) {
        request.current = null;
        setScanning(false);
      }
    }
  };

  const straighten = async () => {
    if (!doc || busy || request.current || applying.current || pendingMarks) return;
    applying.current = true;
    setNote({ text: "", failed: false });
    let count = 0;
    try {
      await applyTransform(async (d) => {
        if (d.objects.length) throw new Error("Apply pending marks before straightening.");
        const result = await deskewPdf(docToFile(d), {
          pageIndices: scope === "all" ? undefined : [selectedPage],
        });
        count = result.deskewed;
        return { bytes: result.bytes, label: "Straighten pages" };
      });
      patchToolState(TOOL_ID, { sourceBytes: undefined, margins: undefined });
      setNote({
        text: count
          ? `Straightened ${count} ${count === 1 ? "page" : "pages"}. Review the edges; Undo restores the original.`
          : "No skew detected. No pages were rasterised.",
        failed: false,
      });
    } catch (e) {
      setNote({
        text: e instanceof Error ? e.message : "Couldn't straighten the pages. Try again.",
        failed: true,
      });
    } finally {
      applying.current = false;
    }
  };

  const apply = async () => {
    if (!keep || !doc || busy || request.current || applying.current) return;
    applying.current = true;
    setSaveFailed(false);
    try {
      await applyTransform(async (d) => ({
        ...(await cropDoc(
          d,
          new Map(
            (scope === "all" ? d.pages.map((p) => p.index) : [selectedPage]).map((i) => [i, keep]),
          ),
        )),
        label: "Crop pages",
      }));
      patchToolState(TOOL_ID, { sourceBytes: undefined, margins: undefined });
      setNote({ text: "Crop applied. Undo restores the previous page frame.", failed: false });
    } catch (e) {
      setSaveFailed(true);
      throw e;
    } finally {
      applying.current = false;
    }
  };

  return (
    <div className="pdf-mark-panel pdf-crop-panel">
      <section aria-label="Crop area">
        <p>Drag on the page to set the area to keep, or enter the margins to trim.</p>
        <div className="pdf-property-field">
          <span className="air-label">Apply to</span>
          <SegmentedControl
            value={scope}
            onChange={(v) => {
              setNote({ text: "", failed: false });
              patchToolState(TOOL_ID, { scope: v });
            }}
            options={[
              { value: "all", label: "All pages" },
              { value: "page", label: "This page" },
            ]}
            ariaLabel="Apply crop to"
            fullWidth
            disabled={busy}
          />
        </div>
        <div className="pdf-crop-margins">
          {(["top", "right", "bottom", "left"] as const).map((edge) => (
            <div className="pdf-property-field" key={edge}>
              <label className="air-label" htmlFor={`crop-${edge}`}>
                {edge[0].toUpperCase() + edge.slice(1)} (%)
              </label>
              <input
                id={`crop-${edge}`}
                data-busy-focus-fallback={edge === "top" || undefined}
                className="air-field"
                type="text"
                inputMode="decimal"
                value={margins[edge]}
                aria-invalid={!!error}
                aria-describedby={error ? "crop-error" : "crop-help"}
                disabled={busy}
                onChange={(e) => setMargins({ ...margins, [edge]: e.target.value })}
              />
            </div>
          ))}
        </div>
        {error && (
          <p id="crop-error" className="air-help air-help--error" role="alert">
            {error}
          </p>
        )}
        <p id="crop-help" className="air-help">
          Percentages use each page’s visible width and height.
        </p>
        <p className="air-help" role="status">
          {keep
            ? `Keeping ${(keep.wPct * 100).toFixed(1)}% × ${(keep.hPct * 100).toFixed(1)}% of ${scope === "all" ? "every page" : `page ${selectedPage + 1}`}.`
            : "Set at least one margin to crop."}
        </p>
        <button
          type="button"
          className="air-button air-button--quiet"
          disabled={busy || margins === EMPTY}
          onClick={() => setMargins(EMPTY)}
        >
          Reset margins
        </button>
      </section>
      {saveFailed && (
        <p className="air-notice air-notice--error" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>Couldn't crop the pages. Your margins are saved. Try again.</span>
        </p>
      )}
      <PrimaryAction label="Crop pages" onApply={apply} disabled={!keep || scanning} />
      <p className="air-help">
        Cropping hides content; it does not remove it from the file. Use Redact to remove sensitive
        information.
      </p>
      <section aria-label="Automatic page adjustments">
        <button
          type="button"
          className="air-button"
          ref={trimButton}
          aria-disabled={busy || scanning || pendingMarks}
          aria-busy={scanning}
          onClick={() => void trimToContent()}
        >
          <Scan size={16} aria-hidden="true" />
          Trim to content
        </button>
        {scanning && (
          <>
            <p className="air-help" role="status">
              Reading page {selectedPage + 1}…
            </p>
            <button
              type="button"
              className="air-button air-button--quiet"
              onClick={() => {
                request.current?.abort();
                request.current = null;
                setScanning(false);
                setNote({ text: "Analysis cancelled. Your draft is unchanged.", failed: false });
                trimButton.current?.focus();
              }}
            >
              Cancel analysis
            </button>
          </>
        )}
        <button
          type="button"
          className="air-button"
          aria-disabled={busy || scanning || pendingMarks}
          onClick={() => void straighten()}
        >
          <Wand2 size={16} aria-hidden="true" />
          Straighten
        </button>
        <p className="air-help">
          Straighten acts immediately on{" "}
          {scope === "all" ? "all pages" : `page ${selectedPage + 1}`}. Changed pages become images:
          text is no longer selectable, file size may grow, and edges may be clipped. Pages with
          links, comments or form fields must be flattened first.
        </p>
        {pendingMarks && (
          <p className="air-notice air-notice--warning">
            Apply pending marks in their tools before using automatic adjustments.
          </p>
        )}
        {note.text && (
          <p
            role={note.failed ? "alert" : "status"}
            className={note.failed ? "air-notice air-notice--error" : "air-help"}
          >
            {note.failed && <AlertTriangle size={16} aria-hidden="true" />}
            <span>{note.text}</span>
          </p>
        )}
      </section>
    </div>
  );
}
