// SignatureTool.tsx — Canvas-placement tool. The Panel captures a signature
// (draw on the pad or upload an image) into the tool slice; the Stage lets the
// user TAP a page to drop it and DRAG a placed signature to reposition it
// (stored as `signature` overlay objects carrying the PNG data-URL in payload).
// On Apply, `addSignature` embeds each placed signature as a real image (the
// page text underneath is untouched), then the signature objects are dropped —
// they now live in the bytes. Reuses the proven SignaturePad + addSignature
// pipeline from the standalone Add Signature tool. See CLAUDE.md (canvas
// placement, sibling of the overlay tools).

import { Copy, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ColorPicker } from "../../components/ColorPicker.tsx";
import { SignaturePad } from "../../components/SignaturePad.tsx";
import { addSignature } from "../../utils/pdf-operations.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";
import { useStageProps } from "../stage.tsx";
import type { FractionRect } from "../types.ts";
import { RangeField } from "./controls.tsx";

const TOOL_ID = "signature";
const DEFAULT_WIDTH_PCT = 0.28;
const FALLBACK_ASPECT = 2.5; // typical signature is wider than tall
const DEFAULT_INK = "#1e293b";

interface SigPayload {
  dataUrl: string;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function Stage() {
  const { doc, selectedPage } = useEditorRead();
  const { addObject, updateObject, commit } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const dataUrl = (slice.dataUrl as string) ?? "";
  const widthPct = (slice.widthPct as number) ?? DEFAULT_WIDTH_PCT;

  // Lazy <img> cache so placed signatures can be painted on the overlay canvas.
  // A version counter flips the paintOverlay identity once an image decodes, so
  // PdfStage repaints it in (images decode async after the data-URL is set).
  const imgCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imgVersion, setImgVersion] = useState(0);
  const getImg = useCallback((url: string): HTMLImageElement | null => {
    if (!url) return null;
    const cache = imgCache.current;
    let img = cache.get(url);
    if (!img) {
      img = new Image();
      img.onload = () => setImgVersion((v) => v + 1);
      img.src = url;
      cache.set(url, img);
    }
    return img.complete && img.naturalWidth ? img : null;
  }, []);

  // Drop every decoded image on unmount so nothing lingers past the tool's life.
  useEffect(() => () => imgCache.current.clear(), []);

  // Prune the cache down to URLs still referenced by a live signature object,
  // plus the currently-staged pad data-URL (read by the place handler for its
  // aspect ratio — it must NOT be evicted even before it's placed).
  useEffect(() => {
    const live = new Set<string>();
    for (const o of doc?.objects ?? []) {
      if (o.kind !== "signature") continue;
      const url = (o.payload as SigPayload | undefined)?.dataUrl;
      if (url) live.add(url);
    }
    if (dataUrl) live.add(dataUrl);
    for (const key of imgCache.current.keys()) {
      if (!live.has(key)) imgCache.current.delete(key);
    }
  }, [doc, dataUrl]);

  const dragRef = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);

  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, pageIndex: number) => {
      for (const o of doc?.objects ?? []) {
        if (o.kind !== "signature" || o.pageIndex !== pageIndex || !o.rect) continue;
        const r = o.rect;
        const x = r.xPct * w;
        const y = r.yPct * h;
        const bw = r.wPct * w;
        const bh = r.hPct * h;
        const img = getImg((o.payload as SigPayload | undefined)?.dataUrl ?? "");
        if (img) ctx.drawImage(img, x, y, bw, bh);
        ctx.save();
        ctx.strokeStyle = "rgba(37, 99, 235, 0.9)";
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, bw, bh);
        ctx.restore();
      }
    },
    // imgVersion: re-derive once a signature image decodes so PdfStage repaints
    // it in (the overlay identity must change to trigger a repaint).
    [doc, getImg, imgVersion],
  );

  // Find the topmost signature on this page whose box contains the point.
  const hitTest = useCallback(
    (xPct: number, yPct: number) => {
      const sigs = (doc?.objects ?? []).filter(
        (o) => o.kind === "signature" && o.pageIndex === selectedPage && o.rect,
      );
      for (let i = sigs.length - 1; i >= 0; i--) {
        const r = sigs[i].rect!;
        if (xPct >= r.xPct && xPct <= r.xPct + r.wPct && yPct >= r.yPct && yPct <= r.yPct + r.hPct)
          return sigs[i];
      }
      return null;
    },
    [doc, selectedPage],
  );

  useStageProps({
    cursor: dataUrl ? "copy" : "default",
    paintOverlay,
    onPointerDown: (p) => {
      const hit = hitTest(p.xPct, p.yPct);
      if (hit?.rect) {
        dragRef.current = {
          id: hit.id,
          dx: p.xPct - hit.rect.xPct,
          dy: p.yPct - hit.rect.yPct,
          moved: false,
        };
        return;
      }
      if (!dataUrl) return;
      // Place a new signature centred on the tap, sized from the panel slider
      // and the image's own aspect ratio so it never looks squashed.
      const page = doc?.pages[selectedPage];
      const img = imgCache.current.get(dataUrl);
      const aspect = img?.naturalWidth ? img.naturalWidth / img.naturalHeight : FALLBACK_ASPECT;
      const wPct = widthPct;
      const hPct =
        page && page.heightPt > 0
          ? (wPct * (page.widthPt / page.heightPt)) / aspect
          : wPct / aspect;
      const rect: FractionRect = {
        xPct: clamp01(p.xPct - wPct / 2),
        yPct: clamp01(p.yPct - hPct / 2),
        wPct,
        hPct,
      };
      addObject({ kind: "signature", pageIndex: selectedPage, rect, payload: { dataUrl } });
    },
    onPointerMove: (p) => {
      const d = dragRef.current;
      if (!d) return;
      const obj = (doc?.objects ?? []).find((o) => o.id === d.id);
      if (!obj?.rect) return;
      d.moved = true;
      updateObject(d.id, {
        rect: {
          ...obj.rect,
          xPct: clamp01(p.xPct - d.dx),
          yPct: clamp01(p.yPct - d.dy),
        },
      });
    },
    onPointerUp: () => {
      const d = dragRef.current;
      dragRef.current = null;
      if (d?.moved) commit("Move signature");
    },
    // Pinch interrupted a reposition drag — abandon it. The live `updateObject`
    // edits aren't committed (no `commit` call), so undo still sees one step.
    onPointerCancel: () => {
      dragRef.current = null;
    },
  });

  return null;
}

export function Panel() {
  const { doc } = useEditorRead();
  const { patchToolState, applyTransform, addObjects } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const dataUrl = (slice.dataUrl as string) ?? "";
  const inkHex = (slice.inkHex as string) ?? DEFAULT_INK;
  const widthPct = (slice.widthPct as number) ?? DEFAULT_WIDTH_PCT;
  const mode = (slice.mode as "draw" | "upload") ?? "draw";
  const uploadRef = useRef<HTMLInputElement>(null);

  const count = (doc?.objects ?? []).filter((o) => o.kind === "signature").length;
  const pageCount = doc?.pageCount ?? 0;

  // Replicate the signature(s) placed on the first signed page onto every other
  // page, at the same fractional position (so it lands consistently even on
  // mixed page sizes). One history entry. Useful for signing every page of a
  // multi-page contract from a single placement.
  const applyToAllPages = useCallback(() => {
    const d = doc;
    if (!d) return;
    const sigs = d.objects.filter((o) => o.kind === "signature" && o.rect && o.payload);
    if (sigs.length === 0) return;
    const firstSignedPage = Math.min(...sigs.map((o) => o.pageIndex));
    const template = sigs.filter((o) => o.pageIndex === firstSignedPage);
    const occupied = new Set(sigs.map((o) => o.pageIndex));
    const additions = [];
    for (let p = 0; p < d.pageCount; p++) {
      if (occupied.has(p)) continue;
      for (const t of template) {
        additions.push({
          kind: "signature" as const,
          pageIndex: p,
          rect: { ...t.rect! },
          payload: { ...(t.payload as SigPayload) },
        });
      }
    }
    if (additions.length > 0) addObjects(additions, "Signature on all pages");
  }, [doc, addObjects]);

  const onPadSignature = useCallback(
    (url: string) => patchToolState(TOOL_ID, { dataUrl: url }),
    [patchToolState],
  );

  const onUpload = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () =>
        patchToolState(TOOL_ID, {
          dataUrl: typeof reader.result === "string" ? reader.result : "",
        });
      reader.readAsDataURL(file);
    },
    [patchToolState],
  );

  const apply = useCallback(() => {
    void applyTransform(async (d) => {
      let bytes = d.bytes;
      const sigs = d.objects.filter((o) => o.kind === "signature" && o.rect && o.payload);
      for (const o of sigs) {
        const page = d.pages[o.pageIndex];
        if (!page) continue;
        const r = o.rect!;
        const url = (o.payload as SigPayload).dataUrl;
        const widthPt = r.wPct * page.widthPt;
        const heightPt = r.hPct * page.heightPt;
        const x = r.xPct * page.widthPt;
        // PDF user space is bottom-left origin; our yPct is from the top.
        const y = (1 - r.yPct) * page.heightPt - heightPt;
        const file = new File([bytes.slice(0)], d.fileName, { type: "application/pdf" });
        bytes = await addSignature(file, url, [o.pageIndex], {
          x,
          y,
          width: widthPt,
          height: heightPt,
        });
      }
      return {
        bytes,
        label: `Signature ${sigs.length}`,
        objects: d.objects.filter((o) => o.kind !== "signature"),
      };
    });
  }, [applyTransform]);

  const modes: { id: "draw" | "upload"; label: string }[] = [
    { id: "draw", label: "Draw" },
    { id: "upload", label: "Upload" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1.5">
        {modes.map((m) => {
          const on = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => patchToolState(TOOL_ID, { mode: m.id })}
              aria-pressed={on}
              // Selected = solid primary fill, matching the rest of the editor's
              // pick-one controls (Segmented / PositionGrid / Annotate's modes).
              className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                on
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-slate-200 dark:border-dark-border text-slate-600 dark:text-dark-text-muted hover:bg-slate-50 dark:hover:bg-dark-surface-alt"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {mode === "draw" ? (
        <div className="space-y-2">
          <SignaturePad onSignature={onPadSignature} color={inkHex} />
          <ColorPicker
            value={inkHex}
            onChange={(hex) => patchToolState(TOOL_ID, { inkHex: hex })}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-dark-border px-3 py-4 text-sm text-slate-500 dark:text-dark-text-muted hover:border-primary-400 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Upload className="h-4 w-4" />
            Upload signature image
          </button>
          <input
            ref={uploadRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => onUpload(e.target.files?.[0])}
          />
          {dataUrl && (
            <img
              src={dataUrl}
              alt="Signature preview"
              className="mx-auto max-h-20 rounded-md border border-slate-200 dark:border-dark-border bg-white p-1"
            />
          )}
        </div>
      )}

      <RangeField
        label="Size"
        value={Math.round(widthPct * 100)}
        min={10}
        max={60}
        suffix="%"
        onChange={(v) => patchToolState(TOOL_ID, { widthPct: v / 100 })}
      />

      <p className="rounded-lg bg-slate-50 dark:bg-dark-bg px-3 py-2 text-xs text-slate-500 dark:text-dark-text-muted">
        {dataUrl
          ? "Tap the page to place it, then drag to reposition."
          : "Draw or upload a signature to begin."}
      </p>

      <span className="text-sm text-slate-600 dark:text-dark-text-muted">
        {count} signature{count === 1 ? "" : "s"}
      </span>

      {count > 0 && pageCount > 1 && (
        <button
          type="button"
          onClick={applyToAllPages}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-dark-border px-3 py-2 text-sm font-medium text-slate-700 dark:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-surface-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <Copy className="h-4 w-4" />
          Apply to all {pageCount} pages
        </button>
      )}

      <PrimaryAction
        label={`Apply signature${count === 1 ? "" : "s"}`}
        onApply={apply}
        disabled={count === 0}
      />
      <p className="text-xs text-slate-500 dark:text-dark-text-muted">
        Signatures embed as images — the page text underneath stays selectable.
      </p>
    </div>
  );
}
