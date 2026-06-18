// StripFurnitureTool.tsx — Auto-detect and remove "page furniture": running
// headers, footers, and page numbers that repeat at the same position across
// pages. Mirrors CropTool's split: the Stage previews the bands that will be
// trimmed on the focused page; the Panel analyses the document on open
// (extractTextGeometry → detectRunningFurniture), lists what it found, and
// crops the selected top/bottom margin on Apply.
//
// Removal is a non-destructive crop (the band stays in the file but won't show
// or print) — never a rasterising redaction — so the rest of the document keeps
// its selectable text. The detector already clamps each band so it can't reach
// into body content. Identical on desktop + mobile (the Panel is a plain column
// of controls; PrimaryAction routes Apply to the mobile sheet's ✓).

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  detectRunningFurniture,
  extractTextGeometry,
  type FurnitureGroup,
  furnitureCropMargins,
} from "../../utils/layout-extract.ts";
import { cropPagesIndividual } from "../../utils/pdf-operations.ts";
import type { CropMargins } from "../../types.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { useStageProps } from "../stage.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

const TOOL_ID = "strip-furniture";
// The same slate dim CropTool uses for the trimmed-away area — one calm accent.
const DIM = "rgba(15, 23, 42, 0.45)";

const KIND_LABELS: Record<FurnitureGroup["kind"], string> = {
  header: "Running header",
  footer: "Running footer",
  "page-number": "Page numbers",
};

export function Stage() {
  const slice = useToolSlice(TOOL_ID);
  const topPct = (slice.topPct as number) ?? 0;
  const bottomPct = (slice.bottomPct as number) ?? 0;

  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const top = Math.max(0, topPct) * h;
      const bot = Math.max(0, bottomPct) * h;
      if (top <= 0 && bot <= 0) return;
      ctx.save();
      ctx.fillStyle = DIM;
      if (top > 0) ctx.fillRect(0, 0, w, top);
      if (bot > 0) ctx.fillRect(0, h - bot, w, bot);
      ctx.strokeStyle = "rgba(37, 99, 235, 0.95)";
      ctx.lineWidth = 1.5;
      if (top > 0) {
        ctx.beginPath();
        ctx.moveTo(0, top);
        ctx.lineTo(w, top);
        ctx.stroke();
      }
      if (bot > 0) {
        ctx.beginPath();
        ctx.moveTo(0, h - bot);
        ctx.lineTo(w, h - bot);
        ctx.stroke();
      }
      ctx.restore();
    },
    [topPct, bottomPct],
  );

  useStageProps({ cursor: "default", paintOverlay });
  return null;
}

export function Panel() {
  const { doc } = useEditorRead();
  const { applyTransform, patchToolState } = useEditorActions();

  const [groups, setGroups] = useState<FurnitureGroup[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [hadText, setHadText] = useState(true);

  const pageCount = doc?.pageCount ?? 0;
  const tooFew = pageCount < 3;

  // Analyse whenever the document changes (also re-runs after Apply re-mints the
  // bytes, confirming the furniture is gone). `live` ignores a stale result.
  useEffect(() => {
    if (!doc || tooFew) {
      setGroups(tooFew ? [] : null);
      return;
    }
    setGroups(null);
    setScanning(true);
    setHadText(true);
    let live = true;
    void extractTextGeometry(docToFile(doc), { ocr: false })
      .then((pages) => {
        if (!live) return;
        setHadText(pages.some((p) => p.items.length > 0));
        const found = detectRunningFurniture(pages);
        setGroups(found);
        setSelected(new Set(found.map((g) => g.id)));
      })
      .catch(() => {
        if (live) setGroups([]);
      })
      .finally(() => {
        if (live) setScanning(false);
      });
    return () => {
      live = false;
    };
  }, [doc, tooFew]);

  const { topPct, bottomPct } = useMemo(
    () => furnitureCropMargins((groups ?? []).filter((g) => selected.has(g.id))),
    [groups, selected],
  );

  // Keep the Stage's preview bands in sync with the current selection.
  useEffect(() => {
    patchToolState(TOOL_ID, { topPct, bottomPct });
  }, [topPct, bottomPct, patchToolState]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const nothingSelected = topPct <= 0 && bottomPct <= 0;

  const apply = useCallback(() => {
    if (nothingSelected) return;
    void applyTransform(async (d) => {
      const map = new Map<number, CropMargins>();
      for (const p of d.pages) {
        map.set(p.index, {
          left: 0,
          right: 0,
          top: topPct * p.heightPt,
          bottom: bottomPct * p.heightPt,
        });
      }
      const { bytes } = await cropPagesIndividual(docToFile(d), map);
      return { bytes, label: "Strip furniture" };
    }).then(() => patchToolState(TOOL_ID, { topPct: 0, bottomPct: 0 }));
  }, [nothingSelected, topPct, bottomPct, applyTransform, patchToolState]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-dark-text-muted">
        Find headers, footers, and page numbers that repeat across pages, then trim them by cropping
        the margin — non-destructively.
      </p>

      {tooFew ? (
        <p className="rounded-lg bg-slate-50 dark:bg-dark-bg px-3 py-2 text-xs text-slate-500 dark:text-dark-text-muted">
          Needs at least 3 pages to tell repeating furniture from body text.
        </p>
      ) : scanning || groups === null ? (
        <p
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-dark-text-muted"
          role="status"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Scanning pages for repeating text…
        </p>
      ) : groups.length === 0 ? (
        <div className="rounded-lg bg-slate-50 dark:bg-dark-bg px-3 py-2 text-xs text-slate-500 dark:text-dark-text-muted">
          {hadText
            ? "No repeating headers, footers, or page numbers found."
            : "No selectable text found — run OCR first to detect furniture on a scanned PDF."}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-slate-100 dark:divide-dark-border rounded-xl border border-slate-200 dark:border-dark-border bg-white/70 dark:bg-dark-surface">
            {groups.map((g) => (
              <li key={g.id}>
                <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(g.id)}
                    onChange={() => toggle(g.id)}
                    aria-label={`Trim ${KIND_LABELS[g.kind]}`}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary-600 focus-visible:ring-primary-500"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-700 dark:text-dark-text">
                        {KIND_LABELS[g.kind]}
                        <span className="ml-1.5 text-xs font-normal text-slate-400 dark:text-dark-text-muted">
                          {g.region}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums text-xs text-slate-400 dark:text-dark-text-muted">
                        {g.pageCount}/{pageCount}
                      </span>
                    </span>
                    {g.kind !== "page-number" && g.sampleText && (
                      <span
                        className="mt-0.5 block truncate text-xs text-slate-500 dark:text-dark-text-muted"
                        title={g.sampleText}
                      >
                        “{g.sampleText}”
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className="rounded-lg bg-slate-50 dark:bg-dark-bg px-3 py-2 text-xs text-slate-500 dark:text-dark-text-muted">
            {nothingSelected ? (
              "Select at least one item to trim."
            ) : (
              <>
                Trims{" "}
                {topPct > 0 && (
                  <span className="font-medium tabular-nums text-slate-700 dark:text-dark-text">
                    {Math.round(topPct * 100)}% off the top
                  </span>
                )}
                {topPct > 0 && bottomPct > 0 && " and "}
                {bottomPct > 0 && (
                  <span className="font-medium tabular-nums text-slate-700 dark:text-dark-text">
                    {Math.round(bottomPct * 100)}% off the bottom
                  </span>
                )}{" "}
                of every page.
              </>
            )}
          </div>

          <PrimaryAction label="Trim furniture" onApply={apply} disabled={nothingSelected} />

          <p className="text-xs text-slate-500 dark:text-dark-text-muted">
            Cropping is non-destructive — the content stays in the file but won't show or print.
            Rotated pages are skipped.
          </p>
        </>
      )}
    </div>
  );
}
