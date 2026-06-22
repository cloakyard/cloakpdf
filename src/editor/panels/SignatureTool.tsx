// SignatureTool.tsx — Canvas-placement tool. The Panel captures a signature
// (draw on the pad or upload an image) into the tool slice; the Stage lets the
// user TAP a page to drop it, DRAG it to reposition, and DRAG A CORNER HANDLE to
// resize it (aspect-locked, so a signature never stretches). Signatures are
// stored as `signature` overlay objects carrying the PNG data-URL in payload.
// An optional opaque background can be placed behind the ink (e.g. to sit a
// signature cleanly over existing page content); the default is transparent.
//
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
import {
  type Box,
  CORNER_IDS,
  drawSelectionChrome,
  type HandleId,
  HANDLE_CURSOR,
  hitHandle,
  resizeBBoxAspect,
} from "../resize-handles.ts";
import { Switch, TRANSPARENCY_CHECKER } from "./controls.tsx";

const TOOL_ID = "signature";
const DEFAULT_WIDTH_PCT = 0.28;
const FALLBACK_ASPECT = 2.5; // typical signature is wider than tall
const DEFAULT_INK = "#1e293b";
const DEFAULT_BG = "#ffffff";
/** Selection chrome + handle affordances use the single Ocean-Blue accent. */
const ACCENT = "#2563eb";
/** Pointer travel (device px) before a press counts as a drag, not a tap. */
const MOVE_THRESHOLD_PX = 4;

interface SigPayload {
  dataUrl: string;
  /** Opaque background colour (hex) painted behind the ink; absent = transparent. */
  bgHex?: string;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const rectToBox = (r: FractionRect): Box => ({ x: r.xPct, y: r.yPct, w: r.wPct, h: r.hPct });
const boxToRect = (b: Box): FractionRect => ({ xPct: b.x, yPct: b.y, wPct: b.w, hPct: b.h });

/** Composite the (transparent) signature onto an opaque background of `bgHex`,
 *  returning a new PNG data-URL. Used at Apply so the embedded image already
 *  carries the chosen backing — preview and output stay identical. */
function withBackground(dataUrl: string, bgHex: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth || 1;
      c.height = img.naturalHeight || 1;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.fillStyle = bgHex;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function Stage() {
  const { doc, selectedPage } = useEditorRead();
  const { addObject, updateObject, moveObject, removeObject, patchToolState } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const dataUrl = (slice.dataUrl as string) ?? "";
  const selectedId = slice.selectedId as string | undefined;
  const bgEnabled = (slice.bgEnabled as boolean) ?? false;
  const bgHex = (slice.bgHex as string) ?? DEFAULT_BG;

  const docRef = useRef(doc);
  docRef.current = doc;

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

  // Pre-decode every placed signature's image on (re)mount. The cache is cleared
  // on unmount, so without this a signature placed earlier, left unapplied, and
  // returned to would have no decoded image for the first paint — the box showed
  // empty even though Apply still embedded it. Decoding here bumps imgVersion
  // once each image is ready, forcing the preview to repaint in. (Bug fix.)
  useEffect(() => {
    for (const o of docRef.current?.objects ?? []) {
      if (o.kind !== "signature") continue;
      const url = (o.payload as SigPayload | undefined)?.dataUrl;
      if (url) getImg(url);
    }
  }, [getImg]);

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

  // Live, history-free geometry while moving/resizing — committed once on
  // pointerup so a drag is a single undo step (mirrors the annotate tool).
  const dragRef = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const resizeRef = useRef<{
    id: string;
    handle: HandleId;
    sx: number;
    sy: number;
    orig: FractionRect;
    aspect: number;
  } | null>(null);
  const [live, setLive] = useState<{ id: string; rect: FractionRect } | null>(null);
  const [hoverHandle, setHoverHandle] = useState<HandleId | null>(null);
  const paintWHRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // Drop selection + any in-flight drag when the focused page changes (and on
  // mount, so stale cross-page state never lingers).
  useEffect(() => {
    dragRef.current = null;
    resizeRef.current = null;
    setLive(null);
    setHoverHandle(null);
    patchToolState(TOOL_ID, { selectedId: undefined });
  }, [selectedPage, patchToolState]);

  const sigsOnPage = useCallback(
    (pageIndex: number) =>
      (docRef.current?.objects ?? []).filter(
        (o) => o.kind === "signature" && o.pageIndex === pageIndex && o.rect,
      ),
    [],
  );

  // Resolve a signature's current rect, preferring the live drag/resize preview.
  const rectOf = useCallback(
    (id: string, rect: FractionRect): FractionRect => (live && live.id === id ? live.rect : rect),
    [live],
  );

  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, pageIndex: number) => {
      paintWHRef.current = { w, h };
      for (const o of doc?.objects ?? []) {
        if (o.kind !== "signature" || o.pageIndex !== pageIndex || !o.rect) continue;
        const r = rectOf(o.id, o.rect);
        const x = r.xPct * w;
        const y = r.yPct * h;
        const bw = r.wPct * w;
        const bh = r.hPct * h;
        const payload = o.payload as SigPayload | undefined;
        if (payload?.bgHex) {
          ctx.save();
          ctx.fillStyle = payload.bgHex;
          ctx.fillRect(x, y, bw, bh);
          ctx.restore();
        }
        const img = getImg(payload?.dataUrl ?? "");
        if (img) ctx.drawImage(img, x, y, bw, bh);
        if (o.id === selectedId) {
          drawSelectionChrome(ctx, rectToBox(r), w, h, { handles: CORNER_IDS, accent: ACCENT });
        } else {
          // Unselected: a faint dashed outline so every placed signature stays
          // discoverable (and visibly present before it's applied).
          ctx.save();
          ctx.strokeStyle = "rgba(100, 116, 139, 0.7)";
          ctx.setLineDash([5, 4]);
          ctx.lineWidth = 1.25;
          ctx.strokeRect(x, y, bw, bh);
          ctx.restore();
        }
      }
    },
    [doc, getImg, imgVersion, selectedId, rectOf],
  );

  // Find the topmost signature on this page whose box contains the point.
  const hitTest = useCallback(
    (xPct: number, yPct: number) => {
      const sigs = sigsOnPage(selectedPage);
      for (let i = sigs.length - 1; i >= 0; i--) {
        const r = rectOf(sigs[i].id, sigs[i].rect!);
        if (xPct >= r.xPct && xPct <= r.xPct + r.wPct && yPct >= r.yPct && yPct <= r.yPct + r.hPct)
          return sigs[i];
      }
      return null;
    },
    [sigsOnPage, selectedPage, rectOf],
  );

  useStageProps({
    cursor: hoverHandle ? HANDLE_CURSOR[hoverHandle] : dataUrl ? "copy" : "default",
    paintOverlay,
    onPointerDown: (p) => {
      const { w, h } = paintWHRef.current;
      // A corner handle of the selected signature wins → start an aspect-locked
      // resize.
      const sel = sigsOnPage(selectedPage).find((o) => o.id === selectedId);
      if (sel?.rect) {
        const r = rectOf(sel.id, sel.rect);
        const handle = hitHandle(rectToBox(r), p.xPct * w, p.yPct * h, w, h, CORNER_IDS);
        if (handle) {
          resizeRef.current = {
            id: sel.id,
            handle,
            sx: p.xPct,
            sy: p.yPct,
            orig: r,
            aspect: r.hPct > 0 ? r.wPct / r.hPct : 1,
          };
          return;
        }
      }
      // Otherwise hit-test a placed signature → select + drag to reposition.
      const hit = hitTest(p.xPct, p.yPct);
      if (hit?.rect) {
        const r = rectOf(hit.id, hit.rect);
        dragRef.current = { id: hit.id, dx: p.xPct - r.xPct, dy: p.yPct - r.yPct, moved: false };
        if (selectedId !== hit.id) patchToolState(TOOL_ID, { selectedId: hit.id });
        return;
      }
      // Empty space: deselect, or place a new signature if one is staged.
      if (!dataUrl) {
        if (selectedId) patchToolState(TOOL_ID, { selectedId: undefined });
        return;
      }
      const page = doc?.pages[selectedPage];
      const img = imgCache.current.get(dataUrl);
      // Guard naturalHeight too: a 0-height (corrupt) image would make aspect
      // Infinity → a zero-height signature placed and embedded.
      const aspect =
        img?.naturalWidth && img.naturalHeight
          ? img.naturalWidth / img.naturalHeight
          : FALLBACK_ASPECT;
      const wPct = DEFAULT_WIDTH_PCT;
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
      const id = addObject({
        kind: "signature",
        pageIndex: selectedPage,
        rect,
        payload: { dataUrl, ...(bgEnabled ? { bgHex } : {}) },
      });
      // Select the new signature so its resize handles appear immediately.
      if (id) patchToolState(TOOL_ID, { selectedId: id });
    },
    onPointerMove: (p) => {
      const { w, h } = paintWHRef.current;
      const rs = resizeRef.current;
      if (rs) {
        const nb = resizeBBoxAspect(
          rectToBox(rs.orig),
          rs.handle,
          p.xPct - rs.sx,
          p.yPct - rs.sy,
          rs.aspect,
        );
        setLive({ id: rs.id, rect: boxToRect(nb) });
        return;
      }
      const d = dragRef.current;
      if (d) {
        const obj = sigsOnPage(selectedPage).find((o) => o.id === d.id);
        if (!obj?.rect) return;
        const targetX = p.xPct - d.dx;
        const targetY = p.yPct - d.dy;
        if (!d.moved) {
          const dxPx = (targetX - obj.rect.xPct) * w;
          const dyPx = (targetY - obj.rect.yPct) * h;
          if (Math.hypot(dxPx, dyPx) < MOVE_THRESHOLD_PX) return;
          d.moved = true;
        }
        const { wPct, hPct } = obj.rect;
        setLive({
          id: d.id,
          rect: {
            xPct: clamp01(Math.min(targetX, 1 - wPct)),
            yPct: clamp01(Math.min(targetY, 1 - hPct)),
            wPct,
            hPct,
          },
        });
        return;
      }
      // Idle hover: light the resize cursor when over the selected signature's
      // corner handles.
      const sel = sigsOnPage(selectedPage).find((o) => o.id === selectedId);
      const over = sel?.rect
        ? hitHandle(rectToBox(rectOf(sel.id, sel.rect)), p.xPct * w, p.yPct * h, w, h, CORNER_IDS)
        : null;
      setHoverHandle((prev) => (prev === over ? prev : over));
    },
    onPointerUp: () => {
      const rs = resizeRef.current;
      resizeRef.current = null;
      const d = dragRef.current;
      dragRef.current = null;
      const l = live;
      setLive(null);
      if (rs && l && l.id === rs.id) {
        moveObject(rs.id, { rect: l.rect }, "Resize signature");
        return;
      }
      if (d?.moved && l && l.id === d.id) {
        moveObject(d.id, { rect: l.rect }, "Move signature");
      }
    },
    // Pinch interrupted a drag/resize — abandon it. The live edits aren't
    // committed (no `moveObject`), so undo still sees one step.
    onPointerCancel: () => {
      dragRef.current = null;
      resizeRef.current = null;
      setLive(null);
    },
  });

  // Delete / Backspace removes the selected signature (never while typing).
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const obj = docRef.current?.objects.find((o) => o.id === selectedId);
      if (!obj || obj.pageIndex !== selectedPage) return;
      e.preventDefault();
      removeObject(selectedId);
      patchToolState(TOOL_ID, { selectedId: undefined });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selectedPage, removeObject, patchToolState]);

  // Toggling background on/off (or its colour) updates the SELECTED signature so
  // the panel control edits the placed mark, not just the next placement.
  const prevBgRef = useRef<{ enabled: boolean; hex: string } | null>(null);
  useEffect(() => {
    const prev = prevBgRef.current;
    prevBgRef.current = { enabled: bgEnabled, hex: bgHex };
    if (!prev || (prev.enabled === bgEnabled && prev.hex === bgHex)) return;
    if (!selectedId) return;
    const obj = docRef.current?.objects.find((o) => o.id === selectedId);
    if (obj?.kind !== "signature") return;
    const payload = obj.payload as SigPayload;
    updateObject(selectedId, {
      payload: { dataUrl: payload.dataUrl, ...(bgEnabled ? { bgHex } : {}) },
    });
  }, [bgEnabled, bgHex, selectedId, updateObject]);

  return null;
}

export function Panel() {
  const { doc } = useEditorRead();
  const { patchToolState, applyTransform, addObjects } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const dataUrl = (slice.dataUrl as string) ?? "";
  const inkHex = (slice.inkHex as string) ?? DEFAULT_INK;
  const mode = (slice.mode as "draw" | "upload") ?? "draw";
  const bgEnabled = (slice.bgEnabled as boolean) ?? false;
  const bgHex = (slice.bgHex as string) ?? DEFAULT_BG;
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
        const payload = o.payload as SigPayload;
        // Bake an opaque backing into the image when one was chosen, so the
        // embedded signature matches the on-canvas preview exactly.
        const url = payload.bgHex
          ? await withBackground(payload.dataUrl, payload.bgHex)
          : payload.dataUrl;
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
            <div
              className="mx-auto flex max-h-24 w-fit items-center justify-center rounded-md border border-slate-200 p-1 dark:border-dark-border"
              // The preview mirrors the choice: a transparency checker when the
              // signature is ink-only (so it never misreads as a white box), or
              // the chosen colour when a background is on.
              style={bgEnabled ? { backgroundColor: bgHex } : TRANSPARENCY_CHECKER}
            >
              <img src={dataUrl} alt="Signature preview" className="max-h-20" />
            </div>
          )}
        </div>
      )}

      {/* Background: ink-only (transparent) by default, or an opaque colour
          behind the ink — a switch, not a checkbox, so the binary mode reads
          clearly. */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-dark-border p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700 dark:text-dark-text">Background</p>
            <p className="text-xs text-slate-500 dark:text-dark-text-muted">
              {bgEnabled ? "Solid colour behind the ink" : "Ink only — transparent"}
            </p>
          </div>
          <Switch
            checked={bgEnabled}
            onChange={(v) => patchToolState(TOOL_ID, { bgEnabled: v })}
            label="Signature background"
          />
        </div>
        {bgEnabled && (
          <ColorPicker value={bgHex} onChange={(hex) => patchToolState(TOOL_ID, { bgHex: hex })} />
        )}
      </div>

      <p className="rounded-lg bg-slate-50 dark:bg-dark-bg px-3 py-2 text-xs text-slate-500 dark:text-dark-text-muted">
        {dataUrl
          ? "Tap the page to place it, drag to reposition, then pull a corner to resize. Delete removes the selected one."
          : "Draw or upload a signature to begin."}
      </p>

      <span className="text-sm text-slate-600 dark:text-dark-text-muted">
        {count} signature{count === 1 ? "" : "s"} placed
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
