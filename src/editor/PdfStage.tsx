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
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type Ref,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { m, useMotionValue } from "../components/motion.tsx";
import { useEditorActions, useEditorRead, useEditorView } from "./EditorContext.tsx";
import { paintDestructiveMarks } from "./overlay-paint.ts";
import {
  type InlineEditorDescriptor,
  type StagePoint,
  useActiveInlineEditor,
  useActiveStageProps,
} from "./stage.tsx";
import type { ViewState } from "./types.ts";
import {
  distanceBetween,
  MAX_VIEW_ZOOM,
  MIN_VIEW_ZOOM,
  type PinchSnapshot,
  type ViewportPoint,
  keepPageReachable,
  viewFromPinch,
  viewFromWheelZoom,
  viewportTransform,
  wheelDeltaPixels,
} from "./viewport-gestures.ts";

const WHEEL_COMMIT_DELAY_MS = 120;

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
    // Drop the prior page's bitmap up front so a sampler (erase preview) never
    // reads the wrong page during the async decode; it falls back to the
    // placeholder for the frame or two until the new page decodes.
    setCanvas(null);
    if (!thumbUrl) return;
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
    textDecoration,
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
    // Keep mouse/pen editing gestures inside the field. Touch pointers reach
    // the canvas gesture tracker so a second finger can still form a pinch;
    // the stage explicitly leaves the first touch owned by this editor.
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType !== "touch" && e.isPrimary) e.stopPropagation();
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType !== "touch" && e.isPrimary) e.stopPropagation();
    },
    style: {
      left: `${left}px`,
      top: `${top}px`,
      width: `${widthPx}px`,
      height: `${boxH}px`,
      fontFamily: fontCss,
      fontWeight,
      fontStyle,
      textDecoration: textDecoration ?? "none",
      fontSize: `${fontSizePx}px`,
      color: colorHex,
      userSelect: "text" as const,
      WebkitUserSelect: "text" as const,
      touchAction: "auto" as const,
    },
    "aria-label": "Text annotation",
  };

  // Escape the stage's `select-none`, which would otherwise suppress
  // the caret / soft keyboard (notably on iOS Safari).
  const baseClass =
    "absolute m-0 select-text touch-auto rounded-[3px] border border-primary-500/80 bg-white/90 outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

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
  const panStart = useRef<{
    pointerId: number;
    x: number;
    y: number;
    view: ViewState;
  } | null>(null);
  const toolPointerIdRef = useRef<number | null>(null);
  // Active touch points for pinch-to-zoom — the only way to zoom on a phone,
  // where the top-bar zoom buttons are hidden (no room) and Ctrl/Cmd+wheel can't
  // happen. `pinchActive` suppresses single-finger tool/pan for the rest of a
  // two-finger gesture so a lifted finger doesn't draw a stray mark.
  const pointersRef = useRef(new Map<number, ViewportPoint>());
  const pinchRef = useRef<PinchSnapshot | null>(null);
  const pinchActiveRef = useRef(false);
  const [fit, setFit] = useState<{ w: number; h: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // Gesture values are transient: Motion writes the full compositor transform
  // without re-rendering React for every 120Hz pointer/wheel event. The final
  // value is committed to ViewCtx once on release (or shortly after wheel idle),
  // which keeps the top-bar percentage and keyboard controls in sync.
  const transformValue = useMotionValue(viewportTransform(view));
  const liveViewRef = useRef<ViewState>(view);
  const reactViewRef = useRef(view);
  const transientActiveRef = useRef(false);
  const transientDirtyRef = useRef(false);
  const wheelCommitTimerRef = useRef<number | null>(null);
  const wheelGeometryRef = useRef<{
    origin: ViewportPoint;
    width: number;
    height: number;
  } | null>(null);

  const setTransientView = useCallback(
    (next: ViewState) => {
      const bounded = fit ? keepPageReachable(next, { width: fit.w, height: fit.h }) : next;
      const current = liveViewRef.current;
      if (
        bounded.zoom === current.zoom &&
        bounded.panX === current.panX &&
        bounded.panY === current.panY
      ) {
        return;
      }
      liveViewRef.current = bounded;
      transientActiveRef.current = true;
      transientDirtyRef.current = true;
      transformValue.set(viewportTransform(bounded));
    },
    [fit, transformValue],
  );

  const commitTransientView = useCallback(() => {
    transientActiveRef.current = false;
    if (!transientDirtyRef.current) return;
    transientDirtyRef.current = false;
    const next = liveViewRef.current;
    setView((prev) =>
      prev.zoom === next.zoom && prev.panX === next.panX && prev.panY === next.panY
        ? prev
        : { ...prev, zoom: next.zoom, panX: next.panX, panY: next.panY },
    );
  }, [setView]);

  const finishWheelInteraction = useCallback(() => {
    if (wheelCommitTimerRef.current != null) {
      window.clearTimeout(wheelCommitTimerRef.current);
      wheelCommitTimerRef.current = null;
    }
    wheelGeometryRef.current = null;
    commitTransientView();
  }, [commitTransientView]);

  const queueWheelCommit = useCallback(() => {
    if (wheelCommitTimerRef.current != null) {
      window.clearTimeout(wheelCommitTimerRef.current);
    }
    wheelCommitTimerRef.current = window.setTimeout(() => {
      wheelCommitTimerRef.current = null;
      wheelGeometryRef.current = null;
      commitTransientView();
    }, WHEEL_COMMIT_DELAY_MS);
  }, [commitTransientView]);

  // A top-bar control can be activated before the wheel idle timer fires. End
  // that burst during capture so the control composes with the view the user is
  // actually looking at instead of being overwritten by a late wheel commit.
  useEffect(() => {
    const finishOutsideWheel = (event: Event) => {
      if (wheelCommitTimerRef.current == null) return;
      const target = event.target;
      if (target instanceof Node && stageRef.current?.contains(target)) return;
      finishWheelInteraction();
    };
    document.addEventListener("pointerdown", finishOutsideWheel, true);
    document.addEventListener("keydown", finishOutsideWheel, true);
    document.addEventListener("click", finishOutsideWheel, true);
    return () => {
      document.removeEventListener("pointerdown", finishOutsideWheel, true);
      document.removeEventListener("keydown", finishOutsideWheel, true);
      document.removeEventListener("click", finishOutsideWheel, true);
    };
  }, [finishWheelInteraction]);

  // External controls (zoom buttons, reset, keyboard) remain the source of
  // truth whenever no direct-manipulation gesture is in flight.
  useLayoutEffect(() => {
    const externalViewChanged = reactViewRef.current !== view;
    reactViewRef.current = view;
    if (transientActiveRef.current) {
      if (!externalViewChanged || wheelCommitTimerRef.current == null) return;
      window.clearTimeout(wheelCommitTimerRef.current);
      wheelCommitTimerRef.current = null;
      wheelGeometryRef.current = null;
      transientActiveRef.current = false;
      transientDirtyRef.current = false;
    }
    const bounded = fit ? keepPageReachable(view, { width: fit.w, height: fit.h }) : view;
    liveViewRef.current = bounded;
    transformValue.set(viewportTransform(bounded));
    if (bounded.panX !== view.panX || bounded.panY !== view.panY) {
      setView((prev) => {
        const corrected = fit ? keepPageReachable(prev, { width: fit.w, height: fit.h }) : prev;
        return corrected.panX === prev.panX && corrected.panY === prev.panY ? prev : corrected;
      });
    }
    // The object dependency is deliberate: reset can produce numeric values
    // equal to the last React state while Motion still holds a newer transient
    // wheel transform. The new ViewState identity must still force this sync.
  }, [fit, setView, transformValue, view]);

  useEffect(
    () => () => {
      if (wheelCommitTimerRef.current != null) {
        window.clearTimeout(wheelCommitTimerRef.current);
      }
      wheelGeometryRef.current = null;
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
  }, [stageProps, selectedPage, doc?.objects, pageBitmap, view.zoom]);

  // Always call the freshest repaint without re-subscribing the observer.
  const repaintRef = useRef(repaint);
  repaintRef.current = repaint;

  // (a) Repaint whenever the paint inputs change (draft box, tool overlay, marks).
  useEffect(() => {
    repaint();
  }, [repaint]);

  // (b) Observe layout-size changes ONCE for the component's lifetime — keyed
  // on nothing, so a new box / page switch / tool switch never tears it down.
  // CSS transforms do not trigger ResizeObserver, so `view.zoom` above performs
  // one crisp backing-store repaint after a transient gesture commits.
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

  // Measure once at the start of a direct-manipulation burst. Reading layout on
  // every 120Hz wheel event causes avoidable main-thread work and visible
  // stepping on large documents; geometry cannot meaningfully change mid-burst.
  const measureViewport = useCallback(() => {
    const stageRect = stageRef.current?.getBoundingClientRect();
    const availRect = availRef.current?.getBoundingClientRect();
    return {
      origin: availRect
        ? { x: availRect.left + availRect.width / 2, y: availRect.top + availRect.height / 2 }
        : { x: 0, y: 0 },
      width: stageRect?.width || 1,
      height: stageRect?.height || 1,
    };
  }, []);

  // (Re)base a pinch from the current live view. Re-basing also makes a third
  // finger entering/leaving harmless instead of jumping to a new pointer pair.
  const beginPinch = useCallback(() => {
    const [a, b] = [...pointersRef.current.values()];
    if (!a || !b) return;
    const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const stage = stageRef.current;
    if (stage) {
      for (const pointerId of pointersRef.current.keys()) {
        if (stage.hasPointerCapture(pointerId)) continue;
        try {
          stage.setPointerCapture(pointerId);
        } catch {
          // A browser may already have cancelled a pointer between events.
          continue;
        }
      }
    }
    pinchRef.current = {
      view: liveViewRef.current,
      distance: distanceBetween(a, b),
      center,
      origin: measureViewport().origin,
    };
    transientActiveRef.current = true;
  }, [measureViewport]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const isTouch = e.pointerType === "touch";
      const isMiddleButton = !isTouch && e.button === 1;
      if (!isTouch && e.button !== 0 && !isMiddleButton) return;
      if (isMiddleButton) e.preventDefault();

      finishWheelInteraction();
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Second finger down → enter pinch: zoom + two-finger pan the view,
      // overriding any tool draw or single-finger pan already in progress.
      if (pointersRef.current.size >= 2) {
        panStart.current = null;
        setIsPanning(false);
        // Tell the active tool to drop the draft the first finger started, so a
        // half-drawn box/line/stroke doesn't get stuck on the overlay (the
        // tool's onPointerUp won't fire — we end the pinch silently).
        if (!pinchActiveRef.current && toolPointerIdRef.current != null) {
          stageProps.onPointerCancel?.();
        }
        toolPointerIdRef.current = null;
        pinchActiveRef.current = true;
        beginPinch();
        return;
      }
      if (pinchActiveRef.current) return; // residual finger from a pinch — ignore

      const target = e.target;
      const inlineTarget =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      // The text field keeps its one-finger caret/selection interaction. We
      // still retain the pointer above so another touch can promote it to pinch.
      if (inlineTarget) return;
      // A lone non-primary touch means the browser did not expose its primary
      // partner to this surface. Never reinterpret that finger as a tool stroke.
      if (isTouch && !e.isPrimary) return;

      e.currentTarget.setPointerCapture(e.pointerId);
      wrapRef.current?.focus({ preventScroll: true });

      // An open inline editor owns the single-finger gesture: a tap elsewhere on
      // the page just blurs (commits) it; don't also start a tool/pan underneath.
      if (editorOpen) return;

      const pageHit = target instanceof Node && Boolean(wrapRef.current?.contains(target));
      if (hasToolPointer && pageHit && !isMiddleButton) {
        toolPointerIdRef.current = e.pointerId;
        stageProps.onPointerDown?.(toPoint(e), e);
        return;
      }
      // Empty canvas always pans. With a tool active, a middle-button drag also
      // provides the conventional editor hand-pan without changing tools.
      panStart.current = {
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        view: liveViewRef.current,
      };
      setIsPanning(true);
      transientActiveRef.current = true;
    },
    [beginPinch, editorOpen, finishWheelInteraction, hasToolPointer, stageProps, toPoint],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const tracked = pointersRef.current.has(e.pointerId);
      if (tracked) {
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      const pinch = pinchRef.current;
      if (pinch && pointersRef.current.size >= 2) {
        const [a, b] = [...pointersRef.current.values()];
        if (!a || !b) return;
        setTransientView(
          viewFromPinch(pinch, distanceBetween(a, b) || 1, {
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2,
          }),
        );
        return;
      }
      if (pinchActiveRef.current) return;

      if (toolPointerIdRef.current === e.pointerId) {
        stageProps.onPointerMove?.(toPoint(e), e);
        return;
      }
      const p = panStart.current;
      if (p?.pointerId === e.pointerId) {
        setTransientView({
          ...p.view,
          panX: p.view.panX + e.clientX - p.x,
          panY: p.view.panY + e.clientY - p.y,
        });
        return;
      }
      if (tracked || e.pointerType === "touch" || !hasToolPointer) return;

      // Preserve tool hover affordances (resize cursors, handle hit tests) now
      // that pointer routing lives on the full canvas instead of the paper.
      const target = e.target;
      if (target instanceof Node && wrapRef.current?.contains(target)) {
        stageProps.onPointerMove?.(toPoint(e), e);
      }
    },
    [hasToolPointer, setTransientView, stageProps, toPoint],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size >= 2) {
        beginPinch();
        return;
      }
      pinchRef.current = null;
      if (pointersRef.current.size > 0) return; // residual pinch finger

      // Last finger up: end a pinch silently, otherwise finalise the tool/pan.
      if (pinchActiveRef.current) {
        pinchActiveRef.current = false;
        setIsPanning(false);
        commitTransientView();
        return;
      }
      if (toolPointerIdRef.current === e.pointerId) {
        toolPointerIdRef.current = null;
        stageProps.onPointerUp?.(toPoint(e), e);
        return;
      }
      if (panStart.current?.pointerId === e.pointerId) {
        panStart.current = null;
        setIsPanning(false);
        commitTransientView();
      }
    },
    [beginPinch, commitTransientView, stageProps, toPoint],
  );

  // Pointer cancellation is an interruption, never a successful release. Drop
  // all local gesture state and tell the active tool to discard its draft
  // without committing a partial mark.
  const onPointerCancel = useCallback(() => {
    const toolWasActive = toolPointerIdRef.current != null;
    pointersRef.current.clear();
    pinchRef.current = null;
    pinchActiveRef.current = false;
    panStart.current = null;
    toolPointerIdRef.current = null;
    setIsPanning(false);
    // Viewport movement is safe to retain on interruption; only a tool draft
    // must be discarded.
    commitTransientView();
    if (toolWasActive) stageProps.onPointerCancel?.();
  }, [commitTransientView, stageProps]);

  // The page surface is keyboard-focusable. Give the active tool first refusal
  // so a content key (e.g. Arrow to nudge a selected annotation) cannot also
  // trigger the viewport shortcut. Events only reach this seam while focus is
  // inside the canvas region; typing controls remain untouched.
  const onStageKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      if (stageProps.onKeyDown?.(e)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      finishWheelInteraction();
      const panStep = e.shiftKey ? 64 : 24;
      switch (e.key) {
        case "ArrowLeft":
          setView((prev) => ({ ...prev, panX: prev.panX - panStep }));
          break;
        case "ArrowRight":
          setView((prev) => ({ ...prev, panX: prev.panX + panStep }));
          break;
        case "ArrowUp":
          setView((prev) => ({ ...prev, panY: prev.panY - panStep }));
          break;
        case "ArrowDown":
          setView((prev) => ({ ...prev, panY: prev.panY + panStep }));
          break;
        case "+":
        case "=":
          setView((prev) => ({ ...prev, zoom: Math.min(MAX_VIEW_ZOOM, prev.zoom * 1.2) }));
          break;
        case "-":
          setView((prev) => ({ ...prev, zoom: Math.max(MIN_VIEW_ZOOM, prev.zoom / 1.2) }));
          break;
        case "0":
          setView((prev) => ({ ...prev, zoom: 1, panX: 0, panY: 0 }));
          break;
        default:
          return;
      }
      e.preventDefault();
    },
    [finishWheelInteraction, setView, stageProps],
  );

  // Native wheel handling gives the focus canvas document-viewer behaviour:
  // ordinary wheel/trackpad input pans, while Ctrl/Cmd + wheel (including a
  // trackpad pinch) continuously zooms around the cursor. It must be non-passive
  // so the browser's own page zoom/scroll cannot run alongside the canvas.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (pointersRef.current.size > 0) return;
      const geometry = wheelGeometryRef.current ?? measureViewport();
      wheelGeometryRef.current = geometry;
      const deltaX = wheelDeltaPixels(e.deltaX, e.deltaMode, geometry.width);
      const deltaY = wheelDeltaPixels(e.deltaY, e.deltaMode, geometry.height);

      if (e.ctrlKey || e.metaKey) {
        if (deltaY === 0) {
          wheelGeometryRef.current = null;
          return;
        }
        e.preventDefault();
        setTransientView(
          viewFromWheelZoom(
            liveViewRef.current,
            deltaY,
            { x: e.clientX, y: e.clientY },
            geometry.origin,
          ),
        );
        queueWheelCommit();
        return;
      }

      let panX = deltaX;
      let panY = deltaY;
      // Traditional mouse wheels report Shift+wheel on the Y axis; trackpads
      // generally supply deltaX themselves. Support both without doubling it.
      if (e.shiftKey && Math.abs(panX) < Math.abs(panY)) {
        panX = panY;
        panY = 0;
      }
      if (panX === 0 && panY === 0) {
        wheelGeometryRef.current = null;
        return;
      }
      e.preventDefault();
      const current = liveViewRef.current;
      setTransientView({
        ...current,
        // Match native document scrolling: content moves opposite the wheel.
        panX: current.panX - panX,
        panY: current.panY - panY,
      });
      queueWheelCommit();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [measureViewport, queueWheelCommit, setTransientView]);

  if (!page) return <div className="flex min-h-0 flex-1" />;

  const cursor = isPanning
    ? "grabbing"
    : hasToolPointer
      ? (stageProps.cursor ?? "crosshair")
      : "grab";
  const keyboardHelp =
    stageProps.keyboardHelp ?? "Use arrow keys to pan the page within the canvas.";
  const keyboardShortcuts = [
    "ArrowLeft ArrowRight ArrowUp ArrowDown + - 0",
    stageProps.keyboardShortcuts,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={stageRef}
      className="relative flex min-h-0 flex-1 touch-none select-none overflow-hidden bg-slate-100 p-4 dark:bg-dark-bg sm:p-8"
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div ref={availRef} className="relative flex h-full w-full items-center justify-center">
        <m.div
          ref={wrapRef}
          role="region"
          tabIndex={0}
          aria-label={`Page ${selectedPage + 1} editing canvas. ${keyboardHelp} Scroll to pan; pinch or Control or Command plus scroll to zoom; use 0 to reset the view.`}
          aria-keyshortcuts={keyboardShortcuts}
          className="relative shadow-sm ring-1 ring-slate-200/70 dark:ring-dark-border touch-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          style={{
            transform: transformValue,
            transformOrigin: "center center",
            willChange: "transform",
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
          onKeyDown={onStageKeyDown}
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
          <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
          {editorOpen &&
            fit &&
            inlineEditor && (
              // Key by session id so a new edit always remounts (re-seeds its
              // value); a style-only update (same id) re-renders in place.
              <InlineTextEditor key={inlineEditor.editorId} descriptor={inlineEditor} fit={fit} />
            )}
        </m.div>
      </div>
    </div>
  );
}
