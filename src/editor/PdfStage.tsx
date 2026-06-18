// PdfStage.tsx — The single persistent focus-mode canvas. Mounted once in
// EditorShell and never torn down on tool switch (the StageProps seam swaps the
// active tool's overlay instead). Shows the selected page's preview with an
// overlay canvas on top; pointer events are normalised to page-fraction space
// and forwarded to the active tool, or used to pan when no tool is active.
//
// Generalized from RedactPdf's proven surface: <img> page preview +
// absolutely-positioned <canvas> overlay synced by a ResizeObserver, fraction
// coordinates via getBoundingClientRect.

import {
  type PointerEvent as ReactPointerEvent,
  type Ref,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useEditorActions, useEditorRead, useEditorView } from "./EditorContext.tsx";
import { paintDestructiveMarks } from "./overlay-paint.ts";
import {
  type InlineEditorDescriptor,
  type StagePoint,
  useActiveInlineEditor,
  useActiveStageProps,
} from "./stage.tsx";
import type { ViewState } from "./types.ts";

type Pt = { x: number; y: number };
const distance = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);

// One reused offscreen 2d context for sizing the inline editor's input to its
// content (native <input> doesn't auto-grow).
let _measureCtx: CanvasRenderingContext2D | null = null;
function measureInlineWidth(text: string, font: string): number {
  if (!_measureCtx) _measureCtx = document.createElement("canvas").getContext("2d");
  if (!_measureCtx) return text.length * 8;
  _measureCtx.font = font;
  return _measureCtx.measureText(text).width;
}

/** Decode a page's preview thumbnail into an offscreen canvas so the overlay
 *  painters can sample its pixels (Smart-Erase paints a true fill / mosaic
 *  preview from it). Re-decodes when the URL changes (page switch, re-render);
 *  willReadFrequently because the erase preview reads it back with getImageData.
 *  Same-origin blob: URL, so the canvas is never tainted. */
function usePageBitmap(thumbUrl: string | null | undefined): HTMLCanvasElement | null {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!thumbUrl) {
      setCanvas(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      setCanvas(c);
    };
    img.onerror = () => {
      if (!cancelled) setCanvas(null);
    };
    img.src = thumbUrl;
    return () => {
      cancelled = true;
    };
  }, [thumbUrl]);
  return canvas;
}

/** Coarse-pointer (touch) primary input — phones/tablets, where the fit-to-screen
 *  page renders small and the OS soft keyboard is in play. `pointer: coarse` is
 *  true only when the PRIMARY input is touch (a touchscreen laptop with a
 *  trackpad reports `fine`), which is exactly the set of devices that need the
 *  legible editing floor below. */
function isCoarsePointer(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

/**
 * The in-place text-editing input, a child of the transformed page wrap so pan /
 * zoom / pinch apply to it for free. Anchored at the annotation's top-left
 * fraction; font-size is `sizeFrac · fit.h` (unscaled box px) so the wrap's own
 * `scale(zoom)` matches it to the painted/burned text at any zoom — never read a
 * post-scale rect or it double-applies zoom. Commit fires once (Enter or blur);
 * Escape cancels; an empty value commits nothing (the accidental-add guard).
 *
 * Mobile legibility: on a phone the fit-to-screen page is tiny (≈130 pt wide),
 * so a body-size label maps to a 3–6 px input — illegible to type into, and
 * under iOS Safari's 16 px focus-zoom threshold (which yanks the whole canvas).
 * On coarse pointers we therefore floor the *editing* font to 16 px while the
 * placed annotation keeps its true `sizeFrac`. WYSIWYG still holds wherever the
 * real size is already legible (desktop, or a zoomed-in / large label) — the
 * floor only ever kicks in when the true size is too small to edit at all.
 */
function InlineTextEditor({
  descriptor,
  fit,
}: {
  descriptor: InlineEditorDescriptor;
  fit: { w: number; h: number };
}) {
  const {
    xPct,
    yPct,
    fontCss,
    fontWeight,
    fontStyle,
    colorHex,
    sizeFrac,
    boxWFrac,
    boxHFrac,
    onCommit,
    onCancel,
  } = descriptor;
  const isBox = boxWFrac != null && boxHFrac != null;
  const [value, setValue] = useState(descriptor.initialText);
  const valueRef = useRef(value);
  valueRef.current = value;
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const committedRef = useRef(false);
  const escapedRef = useRef(false);
  // Latest callbacks via refs: the owning tool rebuilds onCommit/onCancel every
  // render (and on a font-size auto-suggest snap), so depending on their
  // identity in the unmount effect would fire a premature commit mid-edit.
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const commit = useCallback(() => {
    if (committedRef.current || escapedRef.current) return;
    committedRef.current = true;
    onCommitRef.current(valueRef.current);
  }, []);
  const cancel = useCallback(() => {
    if (committedRef.current || escapedRef.current) return;
    escapedRef.current = true;
    onCancelRef.current();
  }, []);

  // Focus + caret-to-end once on mount (a new edit session always remounts — the
  // owner clears the descriptor to null between sessions). The wrap captures the
  // placing pointer, so focus programmatically rather than relying on the click.
  // NOTE: do NOT commit/cancel on unmount — React StrictMode double-invokes
  // effects in dev (mount→unmount→mount), which would fire a spurious commit and
  // tear the editor down. Commit is driven entirely by blur / Enter / Escape;
  // any UI that closes the editor (page rail, tool buttons, Apply) blurs the
  // input first, so the value is never silently lost.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    const n = el.value.length;
    el.setSelectionRange(n, n);
  }, []);

  // True on-page size; floored to a legible editing size on touch (see above).
  const truePx = sizeFrac * fit.h;
  const fontSizePx = Math.max(isCoarsePointer() ? 16 : 6, truePx);
  const font = `${fontStyle} ${fontWeight} ${fontSizePx}px ${fontCss}`;
  const padX = fontSizePx * 0.12; // mirrors TEXT_BG_PAD_EM in the burn/preview path

  // Box mode → the editor fills the drawn box (multi-line, word-wrapping);
  // line mode → a single-line input that auto-grows with its content. Either way,
  // keep the box inside the page so the stage's overflow-hidden doesn't clip it.
  // VISUAL ONLY: the committed annotation anchor stays xPct/yPct.
  const widthPx = isBox
    ? (boxWFrac as number) * fit.w
    : Math.max(fontSizePx * 1.5, measureInlineWidth(value, font) + fontSizePx * 0.7);
  const boxH = isBox ? (boxHFrac as number) * fit.h : fontSizePx * 1.25;
  const left = Math.max(0, Math.min(xPct * fit.w, fit.w - widthPx));
  const top = Math.max(0, Math.min(yPct * fit.h, fit.h - boxH));

  const onKeyDown = (e: {
    key: string;
    preventDefault: () => void;
    stopPropagation: () => void;
  }) => {
    // In box mode Enter inserts a newline (multi-line text); only Escape exits.
    // In line mode Enter commits, matching a one-line label.
    if (e.key === "Enter" && !isBox) {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
    // Keep editor keystrokes (incl. Backspace) off the window-level
    // delete-selected listener; that listener also bails on a focused input.
    e.stopPropagation();
  };
  const shared = {
    value,
    onChange: (e: { target: { value: string } }) => setValue(e.target.value),
    onKeyDown,
    onBlur: commit,
    // Only swallow PRIMARY pointers so a second finger still reaches the wrap
    // and a pinch can form while editing.
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.isPrimary) e.stopPropagation();
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.isPrimary) e.stopPropagation();
    },
    style: {
      left: `${left}px`,
      top: `${top}px`,
      width: `${widthPx}px`,
      height: `${boxH}px`,
      fontFamily: fontCss,
      fontWeight,
      fontStyle,
      fontSize: `${fontSizePx}px`,
      color: colorHex,
      userSelect: "text" as const,
      WebkitUserSelect: "text" as const,
      touchAction: "auto" as const,
    },
    "aria-label": "Text annotation",
  };

  // Escape the wrap's `touch-none select-none`, which would otherwise suppress
  // the caret / soft keyboard (notably on iOS Safari).
  const baseClass =
    "absolute m-0 select-text touch-auto rounded-[3px] border border-primary-500/80 bg-white/90 outline-none";

  return isBox ? (
    <textarea
      {...shared}
      ref={inputRef as Ref<HTMLTextAreaElement>}
      className={`${baseClass} resize-none leading-[1.2]`}
      style={{ ...shared.style, padding: `0 ${padX}px`, overflowY: "auto", overflowX: "hidden" }}
    />
  ) : (
    <input
      {...shared}
      ref={inputRef as Ref<HTMLInputElement>}
      type="text"
      className={`${baseClass} p-0 leading-tight`}
    />
  );
}

export function PdfStage() {
  const { doc, selectedPage } = useEditorRead();
  const view = useEditorView();
  const { setView } = useEditorActions();
  const stageProps = useActiveStageProps();
  const inlineEditor = useActiveInlineEditor();
  // The inline editor is open over the focused page → a tap on the page (off the
  // input) must not start a pan/draw/select; it only blurs (commits) the editor.
  const editorOpen = inlineEditor != null && inlineEditor.pageIndex === selectedPage;

  const stageRef = useRef<HTMLDivElement>(null);
  const availRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  // Active touch points for pinch-to-zoom — the only way to zoom on a phone,
  // where the top-bar zoom buttons are hidden (no room) and Ctrl/Cmd+wheel can't
  // happen. `pinchActive` suppresses single-finger tool/pan for the rest of a
  // two-finger gesture so a lifted finger doesn't draw a stray mark.
  const pointersRef = useRef(new Map<number, Pt>());
  const pinchRef = useRef<{
    dist: number;
    zoom: number;
    panX: number;
    panY: number;
    cx: number;
    cy: number;
  } | null>(null);
  const pinchActiveRef = useRef(false);
  const [fit, setFit] = useState<{ w: number; h: number } | null>(null);

  // Coalesce pan / pinch / wheel view updates into one setView per animation
  // frame. High-Hz pointermove/wheel events otherwise call setView many times a
  // frame; `view` lives in its own ViewCtx so each setView re-renders only the
  // stage / top bar / page grids (not every panel), and rAF folding keeps that to
  // once per frame. Folding the queued updaters keeps both absolute (pan/pinch)
  // and multiplicative (wheel) updates correct — the last absolute update wins,
  // multiplicative ones accumulate.
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<Array<(v: ViewState) => ViewState>>([]);
  const scheduleView = useCallback(
    (updater: (v: ViewState) => ViewState) => {
      pendingRef.current.push(updater);
      if (frameRef.current != null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const updaters = pendingRef.current;
        pendingRef.current = [];
        setView((prev) => updaters.reduce((acc, u) => u(acc), prev));
      });
    },
    [setView],
  );
  useEffect(
    () => () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const page = doc?.pages[selectedPage] ?? null;
  // Decoded raster of the focused page — fed to the overlay painters so erase
  // marks render as a true fill / mosaic preview rather than a flat placeholder.
  const pageBitmap = usePageBitmap(page?.thumbUrl);

  // Fit-contain: size the page box to the largest rect with the page's exact
  // aspect ratio that fits the available area — never stretches, in either
  // orientation. (Pure-CSS aspect-ratio + max-height over-constrains and
  // distorts a portrait page on a wide stage, which is what we're avoiding.)
  useLayoutEffect(() => {
    const avail = availRef.current;
    if (!avail || !page) return;
    const aspect = page.widthPt / page.heightPt;
    const measure = () => {
      const aw = avail.clientWidth;
      const ah = avail.clientHeight;
      if (!aw || !ah) return;
      let w = aw;
      let h = aw / aspect;
      if (h > ah) {
        h = ah;
        w = ah * aspect;
      }
      setFit({ w: Math.round(w), h: Math.round(h) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(avail);
    return () => ro.disconnect();
  }, [page]);

  // Keep the overlay canvas's backing store synced to the displayed image size,
  // then let the active tool paint into it.
  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    // getBoundingClientRect is post-transform, so `width`/`height` already track
    // zoom. Back the canvas at DEVICE resolution (×DPR) so overlay text + marks
    // stay crisp on retina screens — the page <img> is already high-DPI, so a
    // CSS-resolution canvas made annotation text look soft next to it.
    const { width, height } = wrap.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = window.devicePixelRatio || 1;
    const bw = Math.round(width * dpr);
    const bh = Math.round(height * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Draw in CSS px so every tool's geometry + hit-test tolerances are unchanged;
    // the DPR transform renders that into the higher-res backing.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    // Always-on base layer: the pending destructive marks (redaction / erase),
    // so they stay visible no matter which tool is active — they aren't burned
    // into the page until export. The active tool's overlay paints on top.
    paintDestructiveMarks(ctx, width, height, selectedPage, doc?.objects ?? [], pageBitmap);
    stageProps.paintOverlay?.(ctx, width, height, selectedPage, pageBitmap);
  }, [stageProps, selectedPage, doc?.objects, pageBitmap]);

  // Always call the freshest repaint without re-subscribing the observer.
  const repaintRef = useRef(repaint);
  repaintRef.current = repaint;

  // (a) Repaint whenever the paint inputs change (draft box, tool overlay, marks).
  useEffect(() => {
    repaint();
  }, [repaint]);

  // (b) Observe the overlay wrap ONCE for the component's lifetime — keyed on
  // nothing, so a new box / page switch / tool switch never tears down and
  // recreates the ResizeObserver. It always fires the latest repaint via the ref,
  // which reads wrap.getBoundingClientRect() fresh, preserving the zoom/DPR resync.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => repaintRef.current());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const toPoint = useCallback(
    (e: ReactPointerEvent<HTMLElement>): StagePoint => {
      const wrap = wrapRef.current;
      const rect = wrap?.getBoundingClientRect();
      if (!rect || !rect.width || !rect.height) {
        return { xPct: 0, yPct: 0, pageIndex: selectedPage };
      }
      return {
        xPct: Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1),
        yPct: Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1),
        pageIndex: selectedPage,
      };
    },
    [selectedPage],
  );

  const hasToolPointer = Boolean(stageProps.onPointerDown);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Second finger down → enter pinch: zoom + two-finger pan the view,
      // overriding any tool draw or single-finger pan already in progress.
      if (pointersRef.current.size >= 2) {
        panStart.current = null;
        // Tell the active tool to drop the draft the first finger started, so a
        // half-drawn box/line/stroke doesn't get stuck on the overlay (the
        // tool's onPointerUp won't fire — we end the pinch silently).
        stageProps.onPointerCancel?.();
        pinchActiveRef.current = true;
        const [a, b] = [...pointersRef.current.values()];
        pinchRef.current = {
          dist: distance(a, b) || 1,
          zoom: view.zoom,
          panX: view.panX,
          panY: view.panY,
          cx: (a.x + b.x) / 2,
          cy: (a.y + b.y) / 2,
        };
        return;
      }
      if (pinchActiveRef.current) return; // residual finger from a pinch — ignore

      // An open inline editor owns the single-finger gesture: a tap elsewhere on
      // the page just blurs (commits) it; don't also start a tool/pan underneath.
      if (editorOpen) return;

      if (hasToolPointer) {
        stageProps.onPointerDown?.(toPoint(e), e);
        return;
      }
      // No active tool → drag to pan.
      panStart.current = { x: e.clientX, y: e.clientY, panX: view.panX, panY: view.panY };
    },
    [editorOpen, hasToolPointer, stageProps, toPoint, view.panX, view.panY, view.zoom],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (pointersRef.current.has(e.pointerId)) {
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      const pinch = pinchRef.current;
      if (pinch && pointersRef.current.size >= 2) {
        const [a, b] = [...pointersRef.current.values()];
        const ratio = (distance(a, b) || 1) / pinch.dist;
        const zoom = Math.min(8, Math.max(0.2, pinch.zoom * ratio));
        const cx = (a.x + b.x) / 2;
        const cy = (a.y + b.y) / 2;
        scheduleView((prev) => ({
          ...prev,
          zoom,
          panX: pinch.panX + (cx - pinch.cx),
          panY: pinch.panY + (cy - pinch.cy),
        }));
        return;
      }
      if (pinchActiveRef.current) return;

      if (hasToolPointer) {
        stageProps.onPointerMove?.(toPoint(e), e);
        return;
      }
      const p = panStart.current;
      if (!p) return;
      scheduleView((prev) => ({
        ...prev,
        panX: p.panX + (e.clientX - p.x),
        panY: p.panY + (e.clientY - p.y),
      }));
    },
    [hasToolPointer, stageProps, toPoint, scheduleView],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size < 2) pinchRef.current = null;
      if (pointersRef.current.size > 0) return; // gesture still in progress

      // Last finger up: end a pinch silently, otherwise finalise the tool/pan.
      if (pinchActiveRef.current) {
        pinchActiveRef.current = false;
        return;
      }
      if (hasToolPointer) {
        stageProps.onPointerUp?.(toPoint(e), e);
        return;
      }
      panStart.current = null;
    },
    [hasToolPointer, stageProps, toPoint],
  );

  // Ctrl/Cmd + wheel zooms; clamped to a sane range. Attached as a NON-passive
  // native listener — React's onWheel binds at the passive root, where
  // preventDefault() is ignored, so the browser's own Ctrl/Cmd+wheel page-zoom
  // would fire alongside ours. A native { passive: false } listener lets the
  // preventDefault actually suppress it.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      scheduleView((prev) => ({ ...prev, zoom: Math.min(8, Math.max(0.2, prev.zoom * factor)) }));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [scheduleView]);

  if (!page) return <div className="flex min-h-0 flex-1" />;

  const cursor = hasToolPointer
    ? (stageProps.cursor ?? "crosshair")
    : view.zoom > 1
      ? "grab"
      : "default";

  return (
    <div
      ref={stageRef}
      className="relative flex min-h-0 flex-1 overflow-hidden bg-slate-100 dark:bg-dark-bg p-4 sm:p-8"
    >
      <div ref={availRef} className="relative flex h-full w-full items-center justify-center">
        <div
          ref={wrapRef}
          className="relative shadow-sm ring-1 ring-slate-200/70 dark:ring-dark-border touch-none select-none"
          style={{
            transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})`,
            transformOrigin: "center center",
            cursor,
            // Before the first measure, fall back to the page's natural aspect
            // (max-constrained) so it's never invisible and never stretched.
            ...(fit
              ? { width: `${fit.w}px`, height: `${fit.h}px` }
              : {
                  aspectRatio: `${page.widthPt} / ${page.heightPt}`,
                  maxWidth: "100%",
                  maxHeight: "100%",
                }),
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {page.thumbUrl ? (
            <img
              src={page.thumbUrl}
              alt={`Page ${selectedPage + 1}`}
              className="block h-full w-full object-contain pointer-events-none bg-white"
              draggable={false}
            />
          ) : (
            <div className="h-full w-full bg-white" />
          )}
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          {editorOpen &&
            fit &&
            inlineEditor && (
              // Key by session id so a new edit always remounts (re-seeds its
              // value); a style-only update (same id) re-renders in place.
              <InlineTextEditor key={inlineEditor.editorId} descriptor={inlineEditor} fit={fit} />
            )}
        </div>
      </div>
    </div>
  );
}
