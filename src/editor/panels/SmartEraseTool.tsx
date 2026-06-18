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

import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EraseMode } from "../../utils/pdf-operations.ts";
import { type ErasePayload } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { drawEraseMark } from "../overlay-paint.ts";
import { type StagePoint, useStageProps } from "../stage.tsx";
import type { FractionRect } from "../types.ts";
import { Labeled } from "./controls.tsx";
import { Segmented } from "./WholeDocPanel.tsx";

const TOOL_ID = "smart-erase";

type Coarseness = "subtle" | "medium" | "strong";

const BLOCK_FRAC: Record<Coarseness, number> = { subtle: 0.06, medium: 0.12, strong: 0.22 };
const MODE_LABEL: Record<EraseMode, string> = { fill: "Fill", pixelate: "Pixelate" };

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
  const { addObject } = useEditorActions();
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
  // in-progress drag box.
  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (box) drawEraseMark(ctx, box, w, h);
    },
    [box],
  );

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
  const { doc } = useEditorRead();
  const { patchToolState, removeObject, removeObjects, setSelectedPage, setViewMode } =
    useEditorActions();
  const { mode, coarseness } = readSettings(useToolSlice(TOOL_ID));

  const regions = (doc?.objects ?? []).filter((o) => o.kind === "erase");

  const clearAll = () => {
    const ids = regions.map((o) => o.id);
    if (ids.length > 0) removeObjects(ids, "Clear erase areas");
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-dark-text-muted">
        Drag a box over anything you want gone — a stain, a logo, a face. It stays editable until
        you export, when it's burned into the page for good.
      </p>

      <Labeled label="Method">
        <Segmented
          value={mode}
          onChange={(m: EraseMode) => patchToolState(TOOL_ID, { mode: m })}
          options={[
            { value: "fill", label: "Fill", sub: "solid bg" },
            { value: "pixelate", label: "Pixelate", sub: "faces" },
          ]}
        />
      </Labeled>

      {mode === "pixelate" && (
        <Labeled label="Coarseness">
          <Segmented
            value={coarseness}
            onChange={(c: Coarseness) => patchToolState(TOOL_ID, { coarseness: c })}
            options={[
              { value: "subtle", label: "Subtle" },
              { value: "medium", label: "Medium" },
              { value: "strong", label: "Strong" },
            ]}
          />
        </Labeled>
      )}

      {regions.length === 0 ? (
        <div className="rounded-lg bg-slate-50 dark:bg-dark-bg px-3 py-2 text-xs text-slate-500 dark:text-dark-text-muted">
          Drag on the page to mark an area to erase. Method &amp; coarseness apply to the next area
          you draw.
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400 dark:text-dark-text-muted">
              {regions.length} area{regions.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
            >
              Clear all
            </button>
          </div>
          <ul className="thin-scrollbar max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-dark-border divide-y divide-slate-100 dark:divide-dark-border">
            {regions.map((r, i) => {
              const m = (r.payload as Partial<ErasePayload> | undefined)?.mode ?? "fill";
              return (
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
                    className="min-w-0 flex-1 truncate rounded text-left text-slate-600 dark:text-dark-text-muted hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    Area {i + 1} · page {r.pageIndex + 1} · {MODE_LABEL[m]}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeObject(r.id)}
                    aria-label={`Remove area ${i + 1}`}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-dark-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-500 dark:text-dark-text-muted">
        Fill matches a solid surrounding colour; for textured areas or faces, use Pixelate. Erased
        pages are flattened to images on export, so the covered content is permanently removed.
      </p>
    </div>
  );
}
