/**
 * Canvas-based signature drawing pad.
 *
 * Input goes through the **Pointer Events API**, so one code path serves a
 * mouse, a touchpad, a finger, and digital styluses (Apple Pencil, Wacom,
 * Android/S-Pen, Surface Pen). For a stylus we read real `pressure` and sample
 * high-rate coalesced points; for a mouse/touch (no real pressure) the realistic
 * renderer falls back to a speed-based weight. Pointer capture keeps a stroke
 * alive when the pointer leaves the canvas, and pen input takes priority over a
 * stray finger/palm (basic palm rejection).
 *
 * Stroke paths (with per-point pressure) are stored so the whole signature can
 * be replayed in a new colour or re-rendered when the ink mode toggles. On
 * pointer-up the canvas is exported as a PNG data-URL via `onSignature`.
 *
 * Two ink renderers share the stored strokes:
 *   • default — a uniform 2px smooth Bézier line (clean, vector-like).
 *   • realistic (`inkBleed`) — a felt-tip feel: stroke WEIGHT tracks real stylus
 *     pressure (or drawing speed when there's none), under a soft, low-alpha
 *     blurred copy that simulates ink bleeding into paper.
 *
 * Coordinate scaling (`scaleX/scaleY`) keeps strokes accurate when the canvas is
 * CSS-resized to fill its container.
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { focusRing } from "../config/theme.ts";

interface SignaturePadProps {
  /** Called with the PNG data-URL every time the user finishes a stroke. Empty string on clear. */
  onSignature: (dataUrl: string) => void;
  /** Hex colour string for the stroke ink (e.g. "#1e293b"). */
  color: string;
  /** Render with the realistic pen look (pressure/speed weight + ink bleed). */
  inkBleed?: boolean;
  /** Intrinsic canvas width in pixels (default 600). */
  width?: number;
  /** Intrinsic canvas height in pixels (default 360). The display width is
   *  bound by the panel, so height follows the intrinsic ratio — a taller
   *  ~5:3 ratio (vs the old 5:2) gives more room to sign on a tablet/pencil,
   *  and the higher resolution keeps strokes crisp on hi-DPI screens. */
  height?: number;
}

/** A captured sample. `p` is real stylus pressure (0–1) when the input is a pen,
 *  else undefined — a mouse/touchpad reports no meaningful pressure. */
type Point = { x: number; y: number; p?: number };

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// Realistic-ink tuning. Weight ramps between MIN_W and MAX_W — driven by real
// pressure when present, otherwise by point spacing (a speed proxy, since
// pointer events fire at a roughly steady rate). BLEED_* controls the soft halo
// painted under the crisp ink. Eyeballed on a 500×200 pad — adjust together.
const MIN_W = 1.3;
const MAX_W = 3.4;
const MIN_D = 1.2; // px spacing at/below which the speed model draws at MAX_W
const MAX_D = 16; // px spacing at/above which it thins to MIN_W
const EMA = 0.5; // weight smoothing so it doesn't jitter sample-to-sample
const BLEED_BLUR = 1.6; // px blur radius of the bleed halo
const BLEED_ALPHA = 0.5; // opacity of the bleed halo under the crisp ink

/** Once-per-module check for Canvas 2D `filter` support (the bleed halo uses
 *  `filter: blur(...)`). Falls back to weight-only realism where unsupported. */
let filterSupported: boolean | null = null;
function canvasFilterSupported(): boolean {
  if (filterSupported === null) {
    const c = document.createElement("canvas").getContext("2d");
    filterSupported = !!c && "filter" in c;
  }
  return filterSupported;
}

/** Map a raw pointer event to canvas-space coordinates + pressure. */
function toPoint(canvas: HTMLCanvasElement, ev: PointerEvent | MouseEvent): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / (rect.width || 1);
  const scaleY = canvas.height / (rect.height || 1);
  const isPen = "pointerType" in ev && ev.pointerType === "pen";
  return {
    x: (ev.clientX - rect.left) * scaleX,
    y: (ev.clientY - rect.top) * scaleY,
    p: isPen ? (ev as PointerEvent).pressure : undefined,
  };
}

/** Draws a stroke as a smooth quadratic Bézier curve using the midpoint technique. */
function drawSmooth(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) {
    // Single tap — draw a small filled circle
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle as string;
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const mid = {
      x: (points[i].x + points[i + 1].x) / 2,
      y: (points[i].y + points[i + 1].y) / 2,
    };
    // Control point = points[i], end point = midpoint between points[i] and points[i+1]
    ctx.quadraticCurveTo(points[i].x, points[i].y, mid.x, mid.y);
  }
  // Draw to the final point
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

/** Per-point stroke weights. Uses real stylus pressure when a point carries it
 *  (eased so light writing still shows ink), otherwise a speed proxy from local
 *  point spacing — both EMA-smoothed so the line swells and tapers organically. */
function inkWidths(points: Point[]): number[] {
  const widths: number[] = [];
  let w = MAX_W; // a pen lands with firm contact, then modulates as it moves
  for (let i = 0; i < points.length; i++) {
    let target = MAX_W;
    const pr = points[i].p;
    if (pr != null && pr > 0) {
      target = MIN_W + Math.sqrt(Math.min(1, pr)) * (MAX_W - MIN_W);
    } else if (i > 0) {
      const t = clamp01((dist(points[i - 1], points[i]) - MIN_D) / (MAX_D - MIN_D));
      target = MAX_W - t * (MAX_W - MIN_W);
    }
    w = i === 0 ? target : w * (1 - EMA) + target * EMA;
    widths.push(w);
  }
  return widths;
}

/** Draws one stroke as weight-varied straight segments; round caps/joins blend
 *  the joints so it reads as a continuous, modulated pen line. */
function drawInkStroke(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, MAX_W / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle as string;
    ctx.fill();
    return;
  }
  const widths = inkWidths(points);
  for (let i = 1; i < points.length; i++) {
    ctx.beginPath();
    ctx.lineWidth = (widths[i - 1] + widths[i]) / 2;
    ctx.moveTo(points[i - 1].x, points[i - 1].y);
    ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }
}

export function SignaturePad({
  onSignature,
  color,
  inkBleed = false,
  width = 600,
  height = 360,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const strokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[]>([]);
  // Tracks the last drawn midpoint so each frame only adds one smooth segment
  const lastMidRef = useRef<Point | null>(null);
  // The one pointer currently drawing (id + type). A second pointer is ignored,
  // except that a pen preempts an in-progress finger stroke (palm rejection).
  const activeRef = useRef<{ id: number; type: string } | null>(null);
  // Offscreen buffer for the realistic renderer: the crisp ink is drawn here
  // once, then composited (blurred halo + crisp copy) so overlapping segments
  // don't darken the bleed. Lazily created / resized to the canvas.
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  // Latch inkBleed so the pointer callbacks (stable identities) read the live
  // value without re-binding listeners on every toggle.
  const inkBleedRef = useRef(inkBleed);
  inkBleedRef.current = inkBleed;

  const getOffscreen = useCallback((w: number, h: number) => {
    let off = offscreenRef.current;
    if (!off) {
      off = document.createElement("canvas");
      offscreenRef.current = off;
    }
    if (off.width !== w) off.width = w;
    if (off.height !== h) off.height = h;
    return off;
  }, []);

  /** Realistic renderer: crisp variable-weight ink on an offscreen buffer, then
   *  a soft blurred halo (the bleed) under a full-opacity crisp copy. */
  const renderInk = useCallback(
    (strokes: Point[][], strokeColor: string) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const off = getOffscreen(canvas.width, canvas.height);
      const octx = off.getContext("2d");
      if (!octx) return;
      octx.clearRect(0, 0, off.width, off.height);
      octx.strokeStyle = strokeColor;
      octx.fillStyle = strokeColor;
      octx.lineCap = "round";
      octx.lineJoin = "round";
      for (const s of strokes) if (s.length > 0) drawInkStroke(octx, s);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (canvasFilterSupported()) {
        ctx.save();
        ctx.filter = `blur(${BLEED_BLUR}px)`;
        ctx.globalAlpha = BLEED_ALPHA;
        ctx.drawImage(off, 0, 0);
        ctx.restore();
      }
      ctx.drawImage(off, 0, 0);
    },
    [getOffscreen],
  );

  /** Replay all stored strokes onto the canvas in the given colour, honouring
   *  the current ink mode. */
  const replayStrokes = useCallback(
    (strokeColor: string) => {
      if (inkBleedRef.current) {
        renderInk(strokesRef.current, strokeColor);
        return;
      }
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const stroke of strokesRef.current) {
        if (stroke.length === 0) continue;
        drawSmooth(ctx, stroke);
      }
    },
    [renderInk],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  // When colour OR ink mode changes, replay all existing strokes accordingly and
  // re-export so the placed/preview image tracks the new look.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    if (strokesRef.current.length > 0) {
      replayStrokes(color);
      onSignature(canvasRef.current!.toDataURL("image/png"));
    } else {
      ctx.strokeStyle = color;
    }
  }, [color, inkBleed, replayStrokes, onSignature]);

  const startDrawing = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const active = activeRef.current;
      if (active) {
        // A pen preempts an in-progress finger/mouse stroke; otherwise a second
        // pointer (palm, extra finger) is ignored.
        const penPreempt = e.pointerType === "pen" && active.type !== "pen";
        if (!penPreempt) return;
        try {
          canvas.releasePointerCapture(active.id);
        } catch {
          /* not captured */
        }
        currentStrokeRef.current = [];
        if (inkBleedRef.current) renderInk(strokesRef.current, color);
        else replayStrokes(color);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      activeRef.current = { id: e.pointerId, type: e.pointerType };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* capture unsupported — falls back to plain pointer flow */
      }
      const pt = toPoint(canvas, e.nativeEvent);
      currentStrokeRef.current = [pt];
      lastMidRef.current = pt;
      setIsDrawing(true);
      setHasContent(true);
      // Realistic mode paints the whole canvas each frame (so the bleed halo is
      // applied once over the full ink) — kick off the first paint now.
      if (inkBleedRef.current) renderInk([...strokesRef.current, currentStrokeRef.current], color);
    },
    [color, renderInk, replayStrokes],
  );

  const draw = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing) return;
      const active = activeRef.current;
      if (!active || active.id !== e.pointerId) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      // High-rate coalesced samples for a pen (it samples faster than the event
      // loop); a single event for mouse/touch (keeps the tuned speed look).
      const native = e.nativeEvent;
      const samples =
        e.pointerType === "pen" && typeof native.getCoalescedEvents === "function"
          ? native.getCoalescedEvents()
          : [native];
      const list = samples.length > 0 ? samples : [native];

      for (const ev of list) {
        const pt = toPoint(canvas, ev);
        const prev = currentStrokeRef.current[currentStrokeRef.current.length - 1];
        currentStrokeRef.current.push(pt);
        if (!inkBleedRef.current && prev) {
          // Default: one smooth quadratic segment from the last midpoint to the
          // new midpoint, using the previous raw point as the Bézier control.
          const mid = { x: (prev.x + pt.x) / 2, y: (prev.y + pt.y) / 2 };
          ctx.beginPath();
          const from = lastMidRef.current ?? prev;
          ctx.moveTo(from.x, from.y);
          ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
          ctx.stroke();
          lastMidRef.current = mid;
        }
      }

      if (inkBleedRef.current) {
        // Full redraw (committed strokes + the in-progress one) so the bleed is
        // computed over the whole signature, not stamped per segment.
        renderInk([...strokesRef.current, currentStrokeRef.current], color);
      }
    },
    [isDrawing, color, renderInk],
  );

  const stopDrawing = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const active = activeRef.current;
      if (active && active.id !== e.pointerId) return;
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (active && canvas) {
        try {
          canvas.releasePointerCapture(active.id);
        } catch {
          /* already released */
        }
      }
      activeRef.current = null;
      if (currentStrokeRef.current.length > 0) {
        strokesRef.current.push([...currentStrokeRef.current]);
        currentStrokeRef.current = [];
      }
      if (!canvas) return;
      // Realistic mode: one final clean render of the committed strokes (drops
      // the now-merged in-progress copy) before exporting.
      if (inkBleedRef.current) renderInk(strokesRef.current, color);
      onSignature(canvas.toDataURL("image/png"));
    },
    [isDrawing, onSignature, color, renderInk],
  );

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current = [];
    currentStrokeRef.current = [];
    activeRef.current = null;
    setHasContent(false);
    onSignature("");
  }, [onSignature]);

  return (
    <div className="space-y-1.5">
      <div
        className={`relative border rounded-xl overflow-hidden bg-white transition-[border-color,box-shadow] duration-200 ${
          isDrawing
            ? "border-primary-400 dark:border-primary-500"
            : "border-slate-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-600"
        }`}
        style={isDrawing ? { boxShadow: `0 0 0 3px ${focusRing}` } : undefined}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          aria-label="Signature drawing area — draw with mouse, touch, or a stylus"
          className="w-full cursor-crosshair touch-none block"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
        />

        {/* Empty-state hint — hidden once drawing starts */}
        {!hasContent && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-7 gap-2 select-none">
            <p className="text-sm text-slate-300 dark:text-slate-600 font-medium tracking-wide">
              Sign here
            </p>
            <div className="w-2/3 border-b border-dashed border-slate-200 dark:border-slate-700" />
          </div>
        )}
      </div>

      {hasContent && (
        <div className="flex justify-end">
          <button
            onClick={clear}
            aria-label="Clear signature"
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-dark-text-muted hover:text-red-500 dark:hover:text-red-400 motion-safe:transition-colors duration-150 rounded px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
          >
            <Trash2 className="w-3 h-3" aria-hidden="true" />
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
