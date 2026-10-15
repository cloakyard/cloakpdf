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
// they now live in the bytes. The editor retains separate drawing/upload sources
// for further placements; Cancel discards the tool transaction.

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Copy,
  Minus,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ColorPicker } from "../../components/ColorPicker.tsx";
import { SignaturePad, type SignatureStroke } from "../../components/SignaturePad.tsx";
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
import { TRANSPARENCY_CHECKER } from "./controls.tsx";
import { SegmentedControl } from "../../components/SegmentedControl.tsx";
import { Select } from "../../components/Select.tsx";
import { canvasAccent } from "../../config/theme.ts";
import { prepareSignature, signatureRect, type SignatureImage } from "../signature.ts";

const TOOL_ID = "signature";
const DEFAULT_INK = "#1e293b";
const DEFAULT_BG = "#ffffff";
/** Pointer travel (device px) before a press counts as a drag, not a tap. */
const MOVE_THRESHOLD_PX = 4;

interface SigPayload {
  dataUrl: string;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const rectToBox = (r: FractionRect): Box => ({ x: r.xPct, y: r.yPct, w: r.wPct, h: r.hPct });
const boxToRect = (b: Box): FractionRect => ({ xPct: b.x, yPct: b.y, wPct: b.w, hPct: b.h });

type DrawnSignature = SignatureImage & { strokes: SignatureStroke[] };
const sourceOf = (slice: Record<string, unknown>) =>
  (slice.mode === "upload" ? slice.uploaded : slice.drawn) as SignatureImage | undefined;

export function Stage() {
  const { doc, selectedPage } = useEditorRead();
  const { addObject, moveObject, removeObject, patchToolState } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const source = sourceOf(slice);
  const dataUrl = source?.dataUrl ?? "";
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
  useEffect(
    () => () => {
      for (const img of imgCache.current.values()) img.onload = null;
      imgCache.current.clear();
    },
    [],
  );

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
      if (!live.has(key)) {
        imgCache.current.get(key)!.onload = null;
        imgCache.current.delete(key);
      }
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
    if (!docRef.current?.objects.some((o) => o.id === selectedId && o.pageIndex === selectedPage)) {
      patchToolState(TOOL_ID, { selectedId: undefined });
    }
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
        // Background is a single global setting: paint the chosen colour behind
        // EVERY placed signature the instant the switch is on, so the live
        // preview always matches what Apply will bake — no selection required.
        if (bgEnabled) {
          ctx.save();
          ctx.fillStyle = bgHex;
          ctx.fillRect(x, y, bw, bh);
          ctx.restore();
        }
        const img = getImg(payload?.dataUrl ?? "");
        if (img) ctx.drawImage(img, x, y, bw, bh);
        if (o.id === selectedId) {
          drawSelectionChrome(ctx, rectToBox(r), w, h, { handles: CORNER_IDS });
        } else {
          // Unselected: a faint dashed outline so every placed signature stays
          // discoverable (and visibly present before it's applied).
          ctx.save();
          ctx.strokeStyle = canvasAccent(ctx);
          ctx.globalAlpha = 0.65;
          ctx.setLineDash([5, 4]);
          ctx.lineWidth = 1.25;
          ctx.strokeRect(x, y, bw, bh);
          ctx.restore();
        }
      }
    },
    [doc, getImg, imgVersion, selectedId, rectOf, bgEnabled, bgHex],
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
    keyboardHelp:
      "Select a signature in the panel. Arrow keys move it; Shift moves faster. Delete removes it.",
    keyboardShortcuts: "ArrowLeft ArrowRight ArrowUp ArrowDown Delete Backspace",
    onKeyDown: (e) => {
      const selected = sigsOnPage(selectedPage).find((o) => o.id === selectedId);
      if (!selected?.rect || e.metaKey || e.ctrlKey || e.altKey) return false;
      if (e.key === "Delete" || e.key === "Backspace") {
        removeObject(selected.id);
        patchToolState(TOOL_ID, { selectedId: undefined });
        return true;
      }
      const direction = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }[e.key];
      if (!direction) return false;
      const step = e.shiftKey ? 0.05 : 0.01;
      const r = selected.rect;
      moveObject(
        selected.id,
        {
          rect: {
            ...r,
            xPct: Math.max(0, Math.min(1 - r.wPct, r.xPct + direction[0] * step)),
            yPct: Math.max(0, Math.min(1 - r.hPct, r.yPct + direction[1] * step)),
          },
        },
        "Move signature",
      );
      return true;
    },
    cursor: hoverHandle ? HANDLE_CURSOR[hoverHandle] : dataUrl ? "copy" : "default",
    paintOverlay,
    onPointerDown: (p, e) => {
      const { w, h } = paintWHRef.current;
      // A corner handle of the selected signature wins → start an aspect-locked
      // resize.
      const sel = sigsOnPage(selectedPage).find((o) => o.id === selectedId);
      if (sel?.rect) {
        const r = rectOf(sel.id, sel.rect);
        const handle = hitHandle(
          rectToBox(r),
          p.xPct * w,
          p.yPct * h,
          w,
          h,
          CORNER_IDS,
          e.pointerType === "touch" ? 22 : undefined,
        );
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
      if (!page || !source) return;
      const rect = signatureRect(source.aspect, page, p.xPct, p.yPct);
      const id = addObject({
        kind: "signature",
        pageIndex: selectedPage,
        rect,
        payload: { dataUrl },
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

  return null;
}

export function Panel() {
  const { doc, selectedPage, busyLabel } = useEditorRead();
  const {
    patchToolState,
    applyTransform,
    addObject,
    addObjects,
    moveObject,
    removeObject,
    setSelectedPage,
  } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const source = sourceOf(slice);
  const drawn = slice.drawn as DrawnSignature | undefined;
  const inkHex = (slice.inkHex as string) ?? DEFAULT_INK;
  const inkBleed = (slice.inkBleed as boolean) ?? false;
  const mode = (slice.mode as "draw" | "upload") ?? "draw";
  const bgEnabled = (slice.bgEnabled as boolean) ?? false;
  const bgHex = (slice.bgHex as string) ?? DEFAULT_BG;
  const uploadRef = useRef<HTMLInputElement>(null);
  const placeRef = useRef<HTMLButtonElement>(null);
  const readRef = useRef<AbortController | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const busy = busyLabel !== null;
  const sigs = (doc?.objects ?? []).filter((o) => o.kind === "signature");
  const count = sigs.length;
  const selected = sigs.find((o) => o.id === slice.selectedId && o.pageIndex === selectedPage);
  const pageCount = doc?.pageCount ?? 0;
  const unsignedPages = pageCount - new Set(sigs.map((o) => o.pageIndex)).size;

  useEffect(() => {
    setUploading(false);
    setUploadError("");
    return () => {
      readRef.current?.abort();
    };
  }, [doc?.id]);

  const onPadSignature = useCallback(
    (dataUrl: string, strokes: SignatureStroke[], aspect: number) =>
      patchToolState(TOOL_ID, { drawn: { dataUrl, strokes, aspect } }),
    [patchToolState],
  );
  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    readRef.current?.abort();
    const controller = new AbortController();
    readRef.current = controller;
    setUploading(true);
    setUploadError("");
    try {
      const image = await prepareSignature(file, { signal: controller.signal });
      if (!controller.signal.aborted)
        patchToolState(TOOL_ID, { uploaded: image, uploadName: file.name });
    } catch (error) {
      if (!controller.signal.aborted)
        setUploadError(
          error instanceof Error ? error.message : "This image could not be opened. Try again.",
        );
    } finally {
      if (!controller.signal.aborted) setUploading(false);
    }
  };

  const place = () => {
    const page = doc?.pages[selectedPage];
    if (!source?.dataUrl || !page || busy || uploading) return;
    const id = addObject({
      kind: "signature",
      pageIndex: selectedPage,
      rect: signatureRect(source.aspect, page),
      payload: { dataUrl: source.dataUrl },
    });
    if (id) patchToolState(TOOL_ID, { selectedId: id });
  };
  const adjust = (dx: number, dy: number, scale = 1) => {
    if (!selected?.rect || busy) return;
    const r = selected.rect;
    const factor = Math.min(scale, 1 / r.wPct, 1 / r.hPct);
    const wPct = r.wPct * factor;
    const hPct = r.hPct * factor;
    if (Math.min(wPct, hPct) < 0.005) return;
    moveObject(
      selected.id,
      {
        rect: {
          wPct,
          hPct,
          xPct: Math.max(0, Math.min(1 - wPct, r.xPct + dx + (r.wPct - wPct) / 2)),
          yPct: Math.max(0, Math.min(1 - hPct, r.yPct + dy + (r.hPct - hPct) / 2)),
        },
      },
      scale === 1 ? "Move signature" : "Resize signature",
    );
  };
  const copyToRemainingPages = () => {
    if (!doc || !count || busy) return;
    const firstPage = Math.min(...sigs.map((o) => o.pageIndex));
    const template = sigs.filter((o) => o.pageIndex === firstPage && o.rect && o.payload);
    const occupied = new Set(sigs.map((o) => o.pageIndex));
    const additions = [];
    for (let p = 0; p < pageCount; p++) {
      if (occupied.has(p)) continue;
      for (const t of template) {
        const r = t.rect!;
        // Preserve the image's physical aspect on mixed portrait/landscape pages.
        const from = doc.pages[firstPage];
        const to = doc.pages[p];
        const aspect = (r.wPct * from.widthPt) / (r.hPct * from.heightPt);
        const h = (r.wPct * to.widthPt) / (aspect * to.heightPt);
        const scale = Math.min(1, 1 / h);
        const wPct = r.wPct * scale;
        const hPct = h * scale;
        additions.push({
          kind: "signature" as const,
          pageIndex: p,
          rect: { xPct: Math.min(r.xPct, 1 - wPct), yPct: Math.min(r.yPct, 1 - hPct), wPct, hPct },
          payload: { ...(t.payload as SigPayload) },
        });
      }
    }
    if (additions.length) addObjects(additions, "Signature on remaining pages");
  };
  const apply = useCallback(async () => {
    await applyTransform(async (d) => {
      let bytes = d.bytes;
      const signatures = d.objects.filter((o) => o.kind === "signature");
      const backgrounds = new Map<string, string>();
      for (const o of signatures) {
        const page = d.pages[o.pageIndex];
        const r = o.rect;
        const payload = o.payload as SigPayload | undefined;
        if (!page || !r || !payload?.dataUrl)
          throw new Error("A signature is incomplete. Remove it and place it again.");
        let url = payload.dataUrl;
        if (bgEnabled) {
          let prepared = backgrounds.get(url);
          if (!prepared) {
            prepared = (await prepareSignature(url, { background: bgHex })).dataUrl;
            backgrounds.set(url, prepared);
          }
          url = prepared;
        }
        bytes = await addSignature(
          new File([bytes.slice(0)], d.fileName, { type: "application/pdf" }),
          url,
          [o.pageIndex],
          {
            x: r.xPct * page.widthPt,
            y: (1 - r.yPct - r.hPct) * page.heightPt,
            width: r.wPct * page.widthPt,
            height: r.hPct * page.heightPt,
          },
        );
      }
      return {
        bytes,
        label: `Signature ${signatures.length}`,
        objects: d.objects.filter((o) => o.kind !== "signature"),
      };
    });
  }, [applyTransform, bgEnabled, bgHex]);

  return (
    <div className="pdf-mark-panel pdf-signature-panel">
      <section aria-label="Signature source">
        <SegmentedControl
          value={mode}
          onChange={(value) => patchToolState(TOOL_ID, { mode: value })}
          ariaLabel="Signature source"
          fullWidth
          disabled={busy}
          options={[
            { value: "draw", label: "Draw" },
            { value: "upload", label: "Choose" },
          ]}
        />
        {mode === "draw" ? (
          <>
            <SignaturePad
              key={doc?.id}
              initialStrokes={drawn?.strokes}
              onSignature={onPadSignature}
              color={inkHex}
              inkBleed={inkBleed}
            />
            <ColorPicker
              label="Ink colour"
              value={inkHex}
              onChange={(hex) => patchToolState(TOOL_ID, { inkHex: hex })}
            />
            <label className="air-switch-row">
              <span>
                Realistic ink<small>Pen-like weight and ink bleed</small>
              </span>
              <input
                className="air-switch"
                type="checkbox"
                role="switch"
                aria-label="Realistic ink"
                checked={inkBleed}
                disabled={busy}
                onChange={(e) => patchToolState(TOOL_ID, { inkBleed: e.target.checked })}
              />
            </label>
          </>
        ) : (
          <>
            <button
              className="air-button"
              type="button"
              data-busy-focus-fallback
              onClick={() => uploadRef.current?.click()}
              disabled={busy}
            >
              <Upload className="size-4" aria-hidden="true" />
              Choose signature image
            </button>
            <input
              ref={uploadRef}
              type="file"
              accept="image/png,image/jpeg"
              hidden
              aria-label="Signature image"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                void onUpload(file);
              }}
            />
            <p className="air-help">
              PNG or JPEG, up to 20 MB and 16 million pixels. White paper becomes transparent;
              existing transparency stays intact.
            </p>
            {uploading && (
              <p className="air-help" role="status">
                Preparing image…
              </p>
            )}
            {uploadError && (
              <p className="air-help air-help--error" role="alert">
                {uploadError} {source?.dataUrl && "Your previous image is still ready."}
              </p>
            )}
            {source?.dataUrl && (
              <p className="pdf-signature-filename">
                {(slice.uploadName as string) ?? "Signature image"}
              </p>
            )}
          </>
        )}
      </section>
      <section aria-label="Signature appearance">
        <label className="air-switch-row">
          <span>
            Background
            <small>{bgEnabled ? "Solid colour behind the ink" : "Ink only — transparent"}</small>
          </span>
          <input
            className="air-switch"
            type="checkbox"
            role="switch"
            aria-label="Signature background"
            checked={bgEnabled}
            disabled={busy}
            onChange={(e) => patchToolState(TOOL_ID, { bgEnabled: e.target.checked })}
          />
        </label>
        {bgEnabled && (
          <ColorPicker
            label="Background colour"
            value={bgHex}
            onChange={(hex) => patchToolState(TOOL_ID, { bgHex: hex })}
          />
        )}
        {source?.dataUrl && (
          <div
            className="pdf-signature-preview"
            style={bgEnabled ? { backgroundColor: bgHex } : TRANSPARENCY_CHECKER}
          >
            <img src={source.dataUrl} alt="Signature preview" />
          </div>
        )}
        <p className="air-help">
          Ink changes affect new placements. Background applies to every placed signature.
        </p>
      </section>
      <section aria-label="Signature placement">
        <button
          type="button"
          className="air-button"
          data-busy-focus-fallback
          disabled={!source?.dataUrl || uploading || busy}
          ref={placeRef}
          onClick={place}
        >
          Place on this page
        </button>
        <p className="air-help">
          Or tap the page to place it. Drag to move; pull a corner to resize.
        </p>
        <p role="status">
          {count} signature{count === 1 ? "" : "s"} placed
        </p>
        {count > 0 && (
          <>
            <div className="pdf-property-field">
              <label className="air-label" htmlFor="signature-selection">
                Placed signature
              </label>
              <Select
                id="signature-selection"
                value={selected?.id ?? ""}
                placeholder="Choose a placed signature"
                disabled={busy}
                options={sigs.map((o, i) => ({
                  value: o.id,
                  label: `Signature ${i + 1} · Page ${o.pageIndex + 1}`,
                }))}
                onChange={(id) => {
                  const o = sigs.find((s) => s.id === id);
                  if (o) {
                    setSelectedPage(o.pageIndex);
                    patchToolState(TOOL_ID, { selectedId: id });
                  }
                }}
              />
            </div>
            {selected && (
              <div
                className="pdf-signature-adjust"
                role="group"
                aria-label="Adjust selected signature"
              >
                {[
                  { label: "Move left", Icon: ArrowLeft, dx: -0.01, dy: 0 },
                  { label: "Move up", Icon: ArrowUp, dx: 0, dy: -0.01 },
                  { label: "Move down", Icon: ArrowDown, dx: 0, dy: 0.01 },
                  { label: "Move right", Icon: ArrowRight, dx: 0.01, dy: 0 },
                ].map(({ label, Icon, dx, dy }) => (
                  <button
                    key={label}
                    type="button"
                    className="air-button air-icon-button air-button--quiet"
                    aria-label={label}
                    title={label}
                    disabled={busy}
                    onClick={() => adjust(dx, dy)}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </button>
                ))}
                <button
                  type="button"
                  className="air-button air-icon-button air-button--quiet"
                  aria-label="Smaller signature"
                  title="Smaller signature"
                  disabled={busy}
                  onClick={() => adjust(0, 0, 0.9)}
                >
                  <Minus className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="air-button air-icon-button air-button--quiet"
                  aria-label="Larger signature"
                  title="Larger signature"
                  disabled={busy}
                  onClick={() => adjust(0, 0, 1.1)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="air-button air-icon-button air-button--quiet"
                  aria-label="Remove selected signature"
                  title="Remove selected signature"
                  disabled={busy}
                  onClick={() => {
                    removeObject(selected.id);
                    patchToolState(TOOL_ID, { selectedId: undefined });
                    placeRef.current?.focus();
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            )}
            {pageCount > 1 && (
              <>
                <button
                  type="button"
                  className="air-button"
                  disabled={!unsignedPages || busy}
                  onClick={copyToRemainingPages}
                >
                  <Copy className="size-4" aria-hidden="true" />
                  Copy to remaining pages
                </button>
                <p className="air-help">
                  Copies placements from the first signed page. Pages with a signature stay
                  unchanged.
                </p>
              </>
            )}
          </>
        )}
      </section>
      <PrimaryAction
        label={`Apply signature${count === 1 ? "" : "s"}`}
        onApply={apply}
        disabled={count === 0 || uploading}
      />
      <p className="air-help">
        Signatures embed as images — the page text underneath stays selectable.
      </p>
    </div>
  );
}
