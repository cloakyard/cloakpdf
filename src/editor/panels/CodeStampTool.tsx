// CodeStampTool.tsx — Canvas-placement tool for a scannable QR code or Code 128
// barcode (from a URL, case number, or hash). The Panel captures the symbology,
// payload, colour, and (barcodes) a caption into the tool slice and shows a live
// preview; the Stage lets the user TAP the page to drop the code, DRAG it to
// reposition, and DRAG A CORNER to resize it (aspect-locked, so QR stays square
// and a barcode keeps its proportions). Placed codes are `stamp` overlay objects
// carrying the rendered preview image + payload.
//
// On Apply, `addCodeStampAt` burns each placed code as sharp vector art (not the
// raster preview) sized to its box; the stamp objects are then dropped. An
// "Apply to all pages" shortcut replicates the placement across the document for
// the every-page workflow the old corner-anchored tool covered. See CLAUDE.md
// (canvas placement, sibling of the signature tool).

import { AlertTriangle, Layers } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addCodeStampAt,
  type CodeStampType,
  encodeCode128B,
  encodeQr,
} from "../../utils/pdf-operations.ts";
import { ColorPicker, hexToRgb } from "../../components/ColorPicker.tsx";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";
import { PlacementActions } from "./PlacementActions.tsx";
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
import { SegmentedControl } from "../../components/SegmentedControl.tsx";
import { Select } from "../../components/Select.tsx";
import { canvasAccent } from "../../config/theme.ts";

const TOOL_ID = "qr-stamp";
const DEFAULT_COLOR = "#111827";
const MOVE_THRESHOLD_PX = 4;
/** Default placement width as a fraction of page width (QR is square-ish; a
 *  barcode is wide, so it starts wider). */
const DEFAULT_QR_W = 0.18;
const DEFAULT_BAR_W = 0.42;

interface StampPayload {
  type: CodeStampType;
  content: string;
  colorHex: string;
  caption: boolean;
  /** Rendered preview PNG for the on-canvas overlay (burn re-draws as vector). */
  dataUrl: string;
}

interface RenderedCode {
  dataUrl: string;
  /** Natural width / height of the rendered image. */
  aspect: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const rectToBox = (r: FractionRect): Box => ({ x: r.xPct, y: r.yPct, w: r.wPct, h: r.hPct });
const boxToRect = (b: Box): FractionRect => ({ xPct: b.x, yPct: b.y, wPct: b.w, hPct: b.h });

/** Keep the complete code, including its quiet zone, inside the visible page. */
function codeRect(
  type: CodeStampType,
  aspect: number,
  page: { widthPt: number; heightPt: number },
  x = 0.5,
  y = 0.5,
): FractionRect {
  const width = type === "qr" ? DEFAULT_QR_W : DEFAULT_BAR_W;
  const height = (width * page.widthPt) / page.heightPt / aspect;
  const scale = Math.min(1, 1 / height);
  const wPct = width * scale;
  const hPct = height * scale;
  return {
    xPct: Math.max(0, Math.min(x - wPct / 2, 1 - wPct)),
    yPct: Math.max(0, Math.min(y - hPct / 2, 1 - hPct)),
    wPct,
    hPct,
  };
}

/** Barcode caption block as a fraction of bar height — matches addCodeStampAt. */
const BARCODE_CAPTION_RATIO = 0.16 * 1.5;

/** Render a QR / barcode to a coloured PNG data-URL (white backing, foreground
 *  in `colorHex`) plus its aspect ratio. Proportions mirror the vector burn so
 *  the placed preview matches the applied output. Returns null on invalid input. */
function renderCode(
  type: CodeStampType,
  content: string,
  colorHex: string,
  caption: boolean,
): RenderedCode | null {
  const text = content.trim();
  if (!text) return null;
  if (type === "qr") {
    try {
      const qr = encodeQr(text, "M");
      const n = qr.size;
      const quiet = 4;
      const cell = 6;
      const dim = (n + quiet * 2) * cell;
      const c = document.createElement("canvas");
      c.width = dim;
      c.height = dim;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, dim, dim);
      ctx.fillStyle = colorHex;
      for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
          if (qr.isDark(row, col))
            ctx.fillRect((quiet + col) * cell, (quiet + row) * cell, cell, cell);
        }
      }
      return { dataUrl: c.toDataURL("image/png"), aspect: 1 };
    } catch {
      return null;
    }
  }
  try {
    const pattern = encodeCode128B(text);
    let totalModules = 20; // 10-module quiet zones each side
    for (const ch of pattern) totalModules += Number(ch);
    const moduleW = 2;
    const barH = 64;
    const capFS = caption ? barH * 0.16 : 0;
    const captionBlock = caption ? barH * BARCODE_CAPTION_RATIO : 0;
    const W = totalModules * moduleW;
    const H = barH + captionBlock;
    const c = document.createElement("canvas");
    // Bound preview memory for long payloads; the PDF remains vector art.
    c.width = Math.min(4096, Math.ceil(W));
    c.height = Math.ceil(H);
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.scale(c.width / W, c.height / H);
    ctx.fillStyle = colorHex;
    let cursor = 10 * moduleW;
    let isBar = true;
    for (const ch of pattern) {
      const runW = Number(ch) * moduleW;
      if (isBar) ctx.fillRect(cursor, 0, runW, barH);
      cursor += runW;
      isBar = !isBar;
    }
    if (caption && capFS > 0) {
      ctx.fillStyle = colorHex;
      ctx.font = `${capFS}px Helvetica, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(text, W / 2, H - capFS * 0.25);
    }
    return { dataUrl: c.toDataURL("image/png"), aspect: W / H };
  } catch {
    return null;
  }
}

export function Stage() {
  const { doc, selectedPage } = useEditorRead();
  const { addObject, moveObject, removeObject, patchToolState } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const type = (slice.type as CodeStampType) ?? "qr";
  const content = (slice.content as string) ?? "";
  const colorHex = (slice.colorHex as string) ?? DEFAULT_COLOR;
  const caption = (slice.caption as boolean) ?? true;
  const selectedId = slice.selectedId as string | undefined;

  const docRef = useRef(doc);
  docRef.current = doc;

  // The staged code (current panel settings) → preview image + aspect, used when
  // a tap places a new code. Memoised so it only re-renders on a settings change.
  const staged = useMemo(
    () => renderCode(type, content, colorHex, caption),
    [type, content, colorHex, caption],
  );

  // Lazy <img> cache for painting placed codes onto the overlay canvas.
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
  useEffect(() => () => imgCache.current.clear(), []);
  // Pre-decode placed codes on (re)mount so returning to the tool always
  // repaints the preview (the cache is cleared on unmount).
  useEffect(() => {
    for (const o of docRef.current?.objects ?? []) {
      if (o.kind !== "stamp") continue;
      const url = (o.payload as StampPayload | undefined)?.dataUrl;
      if (url) getImg(url);
    }
  }, [getImg]);
  useEffect(() => {
    const live = new Set<string>();
    for (const o of doc?.objects ?? []) {
      if (o.kind !== "stamp") continue;
      const url = (o.payload as StampPayload | undefined)?.dataUrl;
      if (url) live.add(url);
    }
    if (staged) live.add(staged.dataUrl);
    for (const key of imgCache.current.keys()) {
      if (!live.has(key)) imgCache.current.delete(key);
    }
  }, [doc, staged]);

  const dragRef = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const resizeRef = useRef<{
    id: string;
    handle: HandleId;
    sx: number;
    sy: number;
    orig: FractionRect;
    aspect: number;
  } | null>(null);
  const [liveGeom, setLiveGeom] = useState<{ id: string; rect: FractionRect } | null>(null);
  const [hoverHandle, setHoverHandle] = useState<HandleId | null>(null);
  const paintWHRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    dragRef.current = null;
    resizeRef.current = null;
    setLiveGeom(null);
    setHoverHandle(null);
  }, [selectedPage]);
  useEffect(() => {
    if (
      selectedId &&
      !docRef.current?.objects.some((o) => o.id === selectedId && o.pageIndex === selectedPage)
    )
      patchToolState(TOOL_ID, { selectedId: undefined });
  }, [selectedPage, selectedId, patchToolState]);

  const stampsOnPage = useCallback(
    (pageIndex: number) =>
      (docRef.current?.objects ?? []).filter(
        (o) => o.kind === "stamp" && o.pageIndex === pageIndex && o.rect,
      ),
    [],
  );

  const rectOf = useCallback(
    (id: string, rect: FractionRect): FractionRect =>
      liveGeom && liveGeom.id === id ? liveGeom.rect : rect,
    [liveGeom],
  );

  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, pageIndex: number) => {
      paintWHRef.current = { w, h };
      for (const o of doc?.objects ?? []) {
        if (o.kind !== "stamp" || o.pageIndex !== pageIndex || !o.rect) continue;
        const r = rectOf(o.id, o.rect);
        const x = r.xPct * w;
        const y = r.yPct * h;
        const bw = r.wPct * w;
        const bh = r.hPct * h;
        const img = getImg((o.payload as StampPayload | undefined)?.dataUrl ?? "");
        if (img) ctx.drawImage(img, x, y, bw, bh);
        if (o.id === selectedId) {
          drawSelectionChrome(ctx, rectToBox(r), w, h, { handles: CORNER_IDS });
        } else {
          ctx.save();
          ctx.strokeStyle = canvasAccent(ctx);
          ctx.setLineDash([5, 4]);
          ctx.lineWidth = 1.25;
          ctx.strokeRect(x, y, bw, bh);
          ctx.restore();
        }
      }
    },
    [doc, getImg, imgVersion, selectedId, rectOf],
  );

  const hitTest = useCallback(
    (xPct: number, yPct: number) => {
      const stamps = stampsOnPage(selectedPage);
      for (let i = stamps.length - 1; i >= 0; i--) {
        const r = rectOf(stamps[i].id, stamps[i].rect!);
        if (xPct >= r.xPct && xPct <= r.xPct + r.wPct && yPct >= r.yPct && yPct <= r.yPct + r.hPct)
          return stamps[i];
      }
      return null;
    },
    [stampsOnPage, selectedPage, rectOf],
  );

  useStageProps({
    cursor: hoverHandle ? HANDLE_CURSOR[hoverHandle] : staged ? "copy" : "default",
    paintOverlay,
    onPointerDown: (p, e) => {
      const { w, h } = paintWHRef.current;
      const sel = stampsOnPage(selectedPage).find((o) => o.id === selectedId);
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
      const hit = hitTest(p.xPct, p.yPct);
      if (hit?.rect) {
        const r = rectOf(hit.id, hit.rect);
        dragRef.current = { id: hit.id, dx: p.xPct - r.xPct, dy: p.yPct - r.yPct, moved: false };
        if (selectedId !== hit.id) patchToolState(TOOL_ID, { selectedId: hit.id });
        return;
      }
      if (!staged) {
        if (selectedId) patchToolState(TOOL_ID, { selectedId: undefined });
        return;
      }
      const page = doc?.pages[selectedPage];
      if (!page) return;
      const rect = codeRect(type, staged.aspect, page, p.xPct, p.yPct);
      const payload: StampPayload = { type, content, colorHex, caption, dataUrl: staged.dataUrl };
      const id = addObject({ kind: "stamp", pageIndex: selectedPage, rect, payload });
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
        setLiveGeom({ id: rs.id, rect: boxToRect(nb) });
        return;
      }
      const d = dragRef.current;
      if (d) {
        const obj = stampsOnPage(selectedPage).find((o) => o.id === d.id);
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
        setLiveGeom({
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
      const sel = stampsOnPage(selectedPage).find((o) => o.id === selectedId);
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
      const l = liveGeom;
      setLiveGeom(null);
      if (rs && l && l.id === rs.id) {
        moveObject(rs.id, { rect: l.rect }, "Resize code");
        return;
      }
      if (d?.moved && l && l.id === d.id) {
        moveObject(d.id, { rect: l.rect }, "Move code");
      }
    },
    onPointerCancel: () => {
      dragRef.current = null;
      resizeRef.current = null;
      setLiveGeom(null);
    },
  });

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
  const type = (slice.type as CodeStampType) ?? "qr";
  const content = (slice.content as string) ?? "";
  const colorHex = (slice.colorHex as string) ?? DEFAULT_COLOR;
  const caption = (slice.caption as boolean) ?? true;

  const trimmed = content.trim();
  // Code 128-B only encodes printable ASCII; flag anything outside so a barcode
  // can't be placed with un-encodable content.
  const barcodeValid = /^[\x20-\x7e]+$/.test(trimmed);
  const preview = useMemo(
    () => renderCode(type, content, colorHex, caption),
    [type, content, colorHex, caption],
  );
  const canPlace = type === "qr" ? !!preview : barcodeValid && !!preview;

  const stamps = (doc?.objects ?? []).filter((o) => o.kind === "stamp");
  const count = stamps.length;
  const selected = stamps.find((o) => o.id === slice.selectedId && o.pageIndex === selectedPage);
  const pageCount = doc?.pageCount ?? 0;
  const remainingPages = pageCount - new Set(stamps.map((o) => o.pageIndex)).size;
  const busy = busyLabel !== null;
  const placeRef = useRef<HTMLButtonElement>(null);
  const error = !trimmed
    ? ""
    : type === "barcode" && !barcodeValid
      ? "Use letters, numbers and printable ASCII symbols. Emoji and accented characters need a QR code."
      : !preview
        ? "This content cannot be previewed. Shorten it and try again."
        : "";
  const place = () => {
    const page = doc?.pages[selectedPage];
    if (!preview || !page || busy) return;
    const id = addObject({
      kind: "stamp",
      pageIndex: selectedPage,
      rect: codeRect(type, preview.aspect, page),
      payload: { type, content, colorHex, caption, dataUrl: preview.dataUrl },
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
      scale === 1 ? "Move code" : "Resize code",
    );
  };

  // Replicate the placed code(s) from the first stamped page onto every other
  // page, preserving physical proportions even on mixed page sizes.
  const applyToAllPages = useCallback(() => {
    const d = doc;
    if (!d || busy) return;
    const stamps = d.objects.filter((o) => o.kind === "stamp" && o.rect && o.payload);
    if (stamps.length === 0) return;
    const firstPage = Math.min(...stamps.map((o) => o.pageIndex));
    const template = stamps.filter((o) => o.pageIndex === firstPage);
    const occupied = new Set(stamps.map((o) => o.pageIndex));
    const additions = [];
    for (let p = 0; p < d.pageCount; p++) {
      if (occupied.has(p)) continue;
      for (const t of template) {
        const r = t.rect!;
        const from = d.pages[firstPage];
        const to = d.pages[p];
        const aspect = (r.wPct * from.widthPt) / (r.hPct * from.heightPt);
        const h = (r.wPct * to.widthPt) / (aspect * to.heightPt);
        const scale = Math.min(1, 1 / h);
        const wPct = r.wPct * scale;
        const hPct = h * scale;
        additions.push({
          kind: "stamp" as const,
          pageIndex: p,
          rect: { xPct: Math.min(r.xPct, 1 - wPct), yPct: Math.min(r.yPct, 1 - hPct), wPct, hPct },
          payload: { ...(t.payload as StampPayload) },
        });
      }
    }
    if (additions.length > 0) addObjects(additions, "Code on all pages");
  }, [doc, busy, addObjects]);

  const apply = useCallback(async () => {
    await applyTransform(async (d) => {
      const stamps = d.objects.filter((o) => o.kind === "stamp" && o.rect && o.payload);
      // Group placements by payload identity (type/content/colour/caption) so one
      // addCodeStampAt call burns every box that shares the same code.
      const groups = new Map<
        string,
        {
          payload: StampPayload;
          placements: { pageIndex: number; x: number; y: number; width: number; height: number }[];
        }
      >();
      for (const o of stamps) {
        const payload = o.payload as StampPayload;
        const r = o.rect!;
        const page = d.pages[o.pageIndex];
        if (!page) continue;
        const key = `${payload.type}|${payload.content}|${payload.colorHex}|${payload.caption}`;
        const width = r.wPct * page.widthPt;
        const height = r.hPct * page.heightPt;
        const x = r.xPct * page.widthPt;
        const y = (1 - r.yPct) * page.heightPt - height;
        const g = groups.get(key) ?? { payload, placements: [] };
        g.placements.push({ pageIndex: o.pageIndex, x, y, width, height });
        groups.set(key, g);
      }
      let bytes = d.bytes;
      for (const { payload, placements } of groups.values()) {
        const file = new File([bytes.slice(0)], d.fileName, { type: "application/pdf" });
        bytes = await addCodeStampAt(
          file,
          {
            type: payload.type,
            content: payload.content,
            color: hexToRgb(payload.colorHex),
            caption: payload.caption,
          },
          placements,
        );
      }
      return {
        bytes,
        label: stamps.length === 1 ? "Code stamp" : `Code stamp ×${stamps.length}`,
        objects: d.objects.filter((o) => o.kind !== "stamp"),
      };
    });
  }, [applyTransform]);

  return (
    <div className="pdf-mark-panel pdf-code-panel">
      <section aria-label="Code settings" tabIndex={-1} data-busy-focus-fallback>
        <SegmentedControl<CodeStampType>
          ariaLabel="Code type"
          fullWidth
          disabled={busy}
          value={type}
          onChange={(v) => patchToolState(TOOL_ID, { type: v })}
          options={[
            { value: "qr", label: "QR code" },
            { value: "barcode", label: "Barcode" },
          ]}
        />
        <div className="pdf-property-field">
          <label className="air-label" htmlFor="code-content">
            Content
          </label>
          <input
            id="code-content"
            name="code-content"
            type="text"
            className="air-field"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={busy}
            value={content}
            onChange={(e) => patchToolState(TOOL_ID, { content: e.target.value })}
            placeholder={type === "qr" ? "https://example.com" : "ABC-0001"}
            aria-invalid={!!error}
            aria-describedby={error ? "code-error" : "code-content-help"}
          />
          <p className="air-help" id="code-content-help">
            {type === "qr"
              ? "A link, message or document reference."
              : "Code 128 · Letters, numbers and printable ASCII symbols."}
          </p>
          {error && (
            <p
              id="code-error"
              className="air-help air-help--error flex items-start gap-2"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}
        </div>
        <div className="pdf-code-preview">
          {preview ? (
            <img
              src={preview.dataUrl}
              alt="Code preview"
              style={{ aspectRatio: preview.aspect }}
              className={type === "qr" ? "pdf-code-preview__qr" : "pdf-code-preview__barcode"}
            />
          ) : (
            <p className="air-help">{error ? "Preview unavailable" : "Enter content to preview"}</p>
          )}
        </div>
        <fieldset className="pdf-overlay-settings" disabled={busy}>
          <legend className="sr-only">Code appearance</legend>
          <ColorPicker
            label="Code colour"
            value={colorHex}
            onChange={(hex) => patchToolState(TOOL_ID, { colorHex: hex })}
          />
          {type === "barcode" && (
            <label className="air-switch-row">
              <span>
                Show text under barcode<small>Include the content as a caption</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                className="air-switch"
                aria-label="Show text under barcode"
                checked={caption}
                onChange={(e) => patchToolState(TOOL_ID, { caption: e.target.checked })}
              />
            </label>
          )}
        </fieldset>
        <p className="air-help">
          Settings affect new placements. Use a dark colour on the white backing and test a scan at
          the final size.
        </p>
      </section>
      <section aria-label="Code placement">
        <button
          type="button"
          className="air-button"
          ref={placeRef}
          onClick={place}
          disabled={!canPlace || busy}
        >
          Place on this page
        </button>
        <p className="air-help">
          {canPlace
            ? "Tap the page to place the code, drag to reposition, then pull a corner to resize."
            : "Enter content to place a code."}
        </p>
        <p role="status">
          {count} code{count === 1 ? "" : "s"} placed
        </p>
        {count > 0 && (
          <>
            <div className="pdf-property-field">
              <label className="air-label" htmlFor="code-selection">
                Placed code
              </label>
              <Select
                id="code-selection"
                value={selected?.id ?? ""}
                placeholder="Choose a placed code"
                disabled={busy}
                options={stamps.map((o, i) => ({
                  value: o.id,
                  label: `Code ${i + 1} · Page ${o.pageIndex + 1}`,
                }))}
                onChange={(id) => {
                  const o = stamps.find((s) => s.id === id);
                  if (o) {
                    setSelectedPage(o.pageIndex);
                    patchToolState(TOOL_ID, { selectedId: id });
                  }
                }}
              />
            </div>
            {selected && (
              <PlacementActions
                noun="code"
                disabled={busy}
                onAdjust={adjust}
                onRemove={() => {
                  removeObject(selected.id);
                  patchToolState(TOOL_ID, { selectedId: undefined });
                  if (canPlace) placeRef.current?.focus();
                  else document.getElementById("code-content")?.focus();
                }}
              />
            )}
            {pageCount > 1 && (
              <>
                <button
                  type="button"
                  className="air-button"
                  disabled={busy || !remainingPages}
                  onClick={applyToAllPages}
                >
                  <Layers className="size-4" aria-hidden="true" />
                  Same spot on all {pageCount} pages
                </button>
                <p className="air-help">
                  Copies placements from the first page with a code. Pages that already have codes
                  stay unchanged. Proportions stay intact on different page sizes.
                </p>
              </>
            )}
          </>
        )}
      </section>
      <section aria-label="Apply codes">
        <PrimaryAction label="Apply codes" onApply={apply} disabled={count === 0} />
        <p className="air-help">
          Codes apply as sharp vector graphics. Keep the white space around each code clear.
        </p>
      </section>
    </div>
  );
}
