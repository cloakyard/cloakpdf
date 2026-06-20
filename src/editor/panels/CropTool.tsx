// CropTool.tsx — Whole-page geometry tool. The Stage lets the user drag a
// "keep" rectangle on the focused page (everything outside it dims); the Panel
// applies that fractional crop to every page (or just this one). Crop lives in
// the tool slice — not as a doc object — because it maps to per-page crop boxes,
// not an overlay mark. On Apply, `cropPagesIndividual` sets each page's crop box
// from the SAME fractional rect (so mixed-size pages crop consistently); the
// trim is non-destructive (hidden content stays in the file). Reuses the crop
// geometry the standalone Crop Pages tool proved. See CLAUDE.md.

import { Loader2, Scan, Wand2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CropMargins } from "../../types.ts";
import { cropPagesIndividual, detectContentBox, deskewPdf } from "../../utils/pdf-operations.ts";
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
  const { doc, selectedPage } = useEditorRead();
  const { patchToolState, applyTransform } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const keep = (slice.keep as FractionRect | null) ?? null;
  const scope = (slice.scope as "all" | "page") ?? "all";

  // Auto clean-ups (content trim / straighten) run an async PDF.js render with no
  // global busy overlay, so track their own state for the buttons + status line.
  const [busy, setBusy] = useState<"content" | "deskew" | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Detect the focused page's ink bounding box and set it as the keep rect — the
  // user can then nudge it and Apply through the normal crop flow.
  const trimToContent = useCallback(async () => {
    if (!doc) return;
    setBusy("content");
    setStatus(null);
    try {
      const box = await detectContentBox(docToFile(doc), selectedPage);
      if (!box) {
        setStatus("This page already fills the frame — nothing to trim.");
        return;
      }
      patchToolState(TOOL_ID, { keep: box });
      setStatus(`Set a crop to the content of page ${selectedPage + 1}. Adjust or Apply.`);
    } catch {
      setStatus("Couldn't analyse this page.");
    } finally {
      setBusy(null);
    }
  }, [doc, selectedPage, patchToolState]);

  // Detect skew and rotate skewed pages upright (destructive — affected pages
  // become images). Undoable, so a misfire is one ⌘Z away.
  const straighten = useCallback(() => {
    if (!doc) return;
    setBusy("deskew");
    setStatus(null);
    const indices = scope === "all" ? undefined : [selectedPage];
    void applyTransform(async (d) => {
      const { bytes, deskewed } = await deskewPdf(docToFile(d), { pageIndices: indices });
      return { bytes, label: "Straighten pages", objects: deskewed > 0 ? [] : undefined };
    })
      .then(() => setStatus("Straightened skewed pages."))
      .catch(() => setStatus("Couldn't straighten the pages."))
      .finally(() => setBusy(null));
  }, [doc, scope, selectedPage, applyTransform]);

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

      {/* One-tap clean-ups for scans: trim white margins, or straighten skew. */}
      <Labeled label="Auto">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => void trimToContent()}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-2 pointer-coarse:min-h-11 text-sm font-medium text-slate-700 dark:text-dark-text hover:border-primary-400 hover:text-primary-700 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {busy === "content" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Scan className="h-4 w-4" />
            )}
            Trim to content
          </button>
          <button
            type="button"
            onClick={straighten}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-2 pointer-coarse:min-h-11 text-sm font-medium text-slate-700 dark:text-dark-text hover:border-primary-400 hover:text-primary-700 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {busy === "deskew" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            Straighten
          </button>
        </div>
      </Labeled>
      {status && (
        <p role="status" className="-mt-1 text-xs text-slate-500 dark:text-dark-text-muted">
          {status}
        </p>
      )}

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
