// SmartEraseTool.tsx — Drag boxes over blemishes, logos, stains, or faces and
// make them vanish: Fill samples the surrounding colour and patches the box
// (best on solid backgrounds), Pixelate mosaics it (de-identify a face / plate).
//
// Like Redact it is destructive — but the burn is DEFERRED. Each box is stored
// as a persistent `erase` overlay object (carrying its method + coarseness in
// the payload), NON-destructive while you work; erasePdf rasterises the touched
// pages and burns the patch into the pixels only at export, or just before the
// next byte transform (see EditorContext.applyTransform + flattenDestructiveObjects).
// So the underlying content survives — and stays searchable — until you're done.
// The committed regions paint as the PdfStage base layer; the Stage here draws
// only the in-progress drag box. Method + coarseness live in the tool slice and
// are captured onto each region when it's drawn.

import { useCallback, useEffect, useRef, useState } from "react";
import type { EraseMode } from "../../utils/pdf-operations.ts";
import { type ErasePayload } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { drawEraseMark } from "../overlay-paint.ts";
import { type StagePoint, useStageProps } from "../stage.tsx";
import type { FractionRect } from "../types.ts";
import { SegmentedControl } from "../../components/SegmentedControl.tsx";
import { PendingMarkList } from "./PendingMarkList.tsx";

const TOOL_ID = "smart-erase";

type Coarseness = "subtle" | "medium" | "strong";

const BLOCK_FRAC: Record<Coarseness, number> = { subtle: 0.06, medium: 0.12, strong: 0.22 };
interface EraseSettings {
  mode: EraseMode;
  coarseness: Coarseness;
}

function readSettings(slice: Record<string, unknown>): EraseSettings {
  return {
    mode: (slice.mode as EraseMode) ?? "fill",
    coarseness: (slice.coarseness as Coarseness) ?? "medium",
  };
}

export function Stage() {
  const { selectedPage } = useEditorRead();
  const { mode, coarseness } = readSettings(useToolSlice(TOOL_ID));
  const { addObject, patchToolState } = useEditorActions();
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [box, setBox] = useState<FractionRect | null>(null);

  // rAF-coalesce the in-progress drag box (see RedactTool for the rationale): at
  // most one setBox → one overlay repaint per frame regardless of pointer Hz.
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

  // Committed regions paint as the PdfStage base layer; here we draw only the
  // in-progress drag box — with a live preview of the chosen method/coarseness
  // (sampled from the page bitmap PdfStage hands us) so the result is visible
  // while you size it, not just after you let go.
  const paintOverlay = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      _page: number,
      src: HTMLCanvasElement | null,
    ) => {
      if (box) drawEraseMark(ctx, box, w, h, src, mode, BLOCK_FRAC[coarseness]);
    },
    [box, mode, coarseness],
  );

  const onPointerDown = useCallback(
    (p: StagePoint) => {
      patchToolState(TOOL_ID, { selectedId: undefined });
      startRef.current = { x: p.xPct, y: p.yPct };
    },
    [patchToolState],
  );
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
        const payload: ErasePayload = { mode, blockFrac: BLOCK_FRAC[coarseness] };
        addObject({ kind: "erase", pageIndex: selectedPage, rect, payload });
      }
    },
    [addObject, selectedPage, mode, coarseness, cancelFrame],
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
  const { patchToolState, moveObject } = useEditorActions();
  const { doc, selectedPage } = useEditorRead();
  const slice = useToolSlice(TOOL_ID);
  const selected = doc?.objects.find(
    (o) => o.id === slice.selectedId && o.kind === "erase" && o.pageIndex === selectedPage,
  );
  const payload = selected?.payload as ErasePayload | undefined;
  const defaults = readSettings(slice);
  const mode = payload?.mode ?? defaults.mode;
  const coarseness =
    (Object.keys(BLOCK_FRAC) as Coarseness[]).find((k) => BLOCK_FRAC[k] === payload?.blockFrac) ??
    defaults.coarseness;
  function change(mode: EraseMode, coarseness: Coarseness) {
    if (selected)
      moveObject(
        selected.id,
        { payload: { mode, blockFrac: BLOCK_FRAC[coarseness] } },
        "Edit erase area",
      );
    else patchToolState(TOOL_ID, { mode, coarseness });
  }
  return (
    <div className="pdf-mark-panel">
      <p>
        {selected
          ? "Editing the selected erase area."
          : "Draw a box to erase, or choose an existing area below."}
      </p>
      <fieldset className="air-choice-group">
        <legend>Method</legend>
        <SegmentedControl
          value={mode}
          ariaLabel="Erase method"
          fullWidth
          onChange={(value: EraseMode) => change(value, coarseness)}
          options={[
            { value: "fill", label: "Fill" },
            { value: "inpaint", label: "Blend" },
            { value: "pixelate", label: "Pixelate" },
          ]}
        />
        <p className="air-help">
          {mode === "fill"
            ? "Match a solid surrounding colour."
            : mode === "inpaint"
              ? "Reconstruct a gradient or soft background."
              : "Break the area into blocks. Pixelation may leave details recognisable; use Redact for sensitive information."}
        </p>
      </fieldset>
      {mode === "pixelate" && (
        <fieldset className="air-choice-group">
          <legend>Coarseness</legend>
          <SegmentedControl
            value={coarseness}
            ariaLabel="Pixelation coarseness"
            fullWidth
            onChange={(value: Coarseness) => change(mode, value)}
            options={[
              { value: "subtle", label: "Subtle" },
              { value: "medium", label: "Medium" },
              { value: "strong", label: "Strong" },
            ]}
          />
        </fieldset>
      )}
      {selected?.rect && (
        <section>
          <p>Selected area on page {selectedPage + 1}</p>
          {(["xPct", "yPct", "wPct", "hPct"] as const).map((key, i) => {
            const r = selected.rect!;
            const max = [1 - r.wPct, 1 - r.hPct, 1 - r.xPct, 1 - r.yPct][i];
            return (
              <label className="pdf-property-field" key={key}>
                {["Left", "Top", "Width", "Height"][i]} (%)
                <input
                  className="air-field"
                  key={r[key]}
                  type="number"
                  step="0.1"
                  min={i < 2 ? 0 : 0.1}
                  max={Number((max * 100).toFixed(3))}
                  defaultValue={Number((r[key] * 100).toFixed(2))}
                  onBlur={(e) => {
                    const v = Number(e.target.value) / 100;
                    if (
                      !e.target.value ||
                      !Number.isFinite(v) ||
                      v < (i < 2 ? 0 : 0.001) ||
                      v > max + 0.0001
                    ) {
                      e.target.value = String(r[key] * 100);
                      return;
                    }
                    if (Math.abs(v - r[key]) > 0.00005)
                      moveObject(
                        selected.id,
                        { rect: { ...r, [key]: Math.min(v, max) } },
                        "Resize erase area",
                      );
                  }}
                />
              </label>
            );
          })}
          <button
            className="air-button"
            onClick={() => patchToolState(TOOL_ID, { selectedId: undefined })}
          >
            Done editing area
          </button>
        </section>
      )}
      <PendingMarkList
        kind="erase"
        onSelect={(selectedId) => patchToolState(TOOL_ID, { selectedId })}
      />
      <p className="air-help">
        Existing marks stay editable until export or another operation changes the PDF. Marked pages
        then become images, losing selectable text; the file may grow.
      </p>
    </div>
  );
}
