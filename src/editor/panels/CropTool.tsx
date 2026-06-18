// CropTool.tsx — Whole-page geometry tool. The Stage lets the user drag a
// "keep" rectangle on the focused page (everything outside it dims); the Panel
// applies that fractional crop to every page (or just this one). Crop lives in
// the tool slice — not as a doc object — because it maps to per-page crop boxes,
// not an overlay mark. On Apply, `cropPagesIndividual` sets each page's crop box
// from the SAME fractional rect (so mixed-size pages crop consistently); the
// trim is non-destructive (hidden content stays in the file). Reuses the crop
// geometry the standalone Crop Pages tool proved. See CLAUDE.md.

import { useCallback, useEffect, useRef, useState } from "react";
import type { CropMargins } from "../../types.ts";
import { cropPagesIndividual } from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { type StagePoint, useStageProps } from "../stage.tsx";
import type { FractionRect } from "../types.ts";
import { Labeled } from "./controls.tsx";
import { Segmented, WholeDocPanel } from "./WholeDocPanel.tsx";

const TOOL_ID = "crop-pages";
const DIM = "rgba(15, 23, 42, 0.45)";

export function Stage() {
  const slice = useToolSlice(TOOL_ID);
  const { patchToolState } = useEditorActions();
  const keep = (slice.keep as FractionRect | null) ?? null;

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
  useEffect(() => cancelFrame, [cancelFrame]);

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
      ctx.fillStyle = DIM;
      ctx.fillRect(0, 0, w, y); // top
      ctx.fillRect(0, y + bh, w, h - (y + bh)); // bottom
      ctx.fillRect(0, y, x, bh); // left
      ctx.fillRect(x + bw, y, w - (x + bw), bh); // right
      ctx.strokeStyle = "rgba(37, 99, 235, 0.95)";
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
      if (rect.wPct > 0.02 && rect.hPct > 0.02) patchToolState(TOOL_ID, { keep: rect });
    },
    [cancelFrame, patchToolState],
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
  const { selectedPage } = useEditorRead();
  const { patchToolState, applyTransform } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const keep = (slice.keep as FractionRect | null) ?? null;
  const scope = (slice.scope as "all" | "page") ?? "all";

  const apply = useCallback(() => {
    if (!keep) return;
    void applyTransform(async (d) => {
      const targets = scope === "all" ? d.pages.map((p) => p.index) : [selectedPage];
      const map = new Map<number, CropMargins>();
      for (const idx of targets) {
        const page = d.pages[idx];
        if (!page) continue;
        const W = page.widthPt;
        const H = page.heightPt;
        map.set(idx, {
          left: keep.xPct * W,
          right: (1 - keep.xPct - keep.wPct) * W,
          top: keep.yPct * H,
          bottom: (1 - keep.yPct - keep.hPct) * H,
        });
      }
      const { bytes } = await cropPagesIndividual(docToFile(d), map);
      return { bytes, label: "Crop pages" };
    }).then(() => patchToolState(TOOL_ID, { keep: null }));
  }, [keep, scope, selectedPage, applyTransform, patchToolState]);

  return (
    <WholeDocPanel
      blurb="Drag a box on the page to keep — everything outside is trimmed away."
      applyLabel="Crop pages"
      disabled={!keep}
      onApply={apply}
    >
      <Labeled label="Apply to">
        <Segmented
          value={scope}
          onChange={(v) => patchToolState(TOOL_ID, { scope: v })}
          options={[
            { value: "all", label: "All pages" },
            { value: "page", label: "This page" },
          ]}
        />
      </Labeled>

      <div className="rounded-lg bg-slate-50 dark:bg-dark-bg px-3 py-2 text-xs text-slate-500 dark:text-dark-text-muted">
        {keep ? (
          <span>
            Keeping{" "}
            <span className="tabular-nums font-medium text-slate-700 dark:text-dark-text">
              {Math.round(keep.wPct * 100)}% × {Math.round(keep.hPct * 100)}%
            </span>{" "}
            of the page.{" "}
            <button
              type="button"
              onClick={() => patchToolState(TOOL_ID, { keep: null })}
              className="text-primary-600 hover:underline"
            >
              Reset
            </button>
          </span>
        ) : (
          "Drag on the page to set the area to keep."
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-dark-text-muted">
        Cropping is non-destructive — hidden content stays in the file but won't print. Rotated
        pages are skipped.
      </p>
    </WholeDocPanel>
  );
}
