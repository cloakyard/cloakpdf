import { useCallback, useEffect, useRef, useState } from "react";
import { canvasAccent } from "../config/theme.ts";
import type { FracRect } from "../utils/text-select.ts";
import {
  useStageProps,
  type PdfStageProps,
  type StagePoint,
  type StageKeyboardEvent,
} from "./stage.tsx";

type Point = Pick<StagePoint, "xPct" | "yPct">;
const center: Point = { xPct: 0.5, yPct: 0.5 };
const rectangle = (a: Point, b: Point): FracRect => ({
  xPct: Math.min(a.xPct, b.xPct),
  yPct: Math.min(a.yPct, b.yPct),
  wPct: Math.abs(a.xPct - b.xPct),
  hPct: Math.abs(a.yPct - b.yPct),
});

/** A drag, two taps or two keyboard corners all produce the same visible-page rectangle.
 * Callers key this surface to the page/revision and active placement step. */
export function RegionStage({
  area,
  onBox,
  onTap,
  guides,
  onGuideMove,
  busy,
  revision,
  paintUnderlay,
}: {
  area?: FracRect;
  paintUnderlay?: PdfStageProps["paintOverlay"];
  onBox: (area: FracRect) => void;
  onTap?: (point: Point) => boolean;
  guides?: FracRect[];
  onGuideMove?: (index: number, point: Point) => void;
  busy: boolean;
  revision: Uint8Array | undefined;
}) {
  const keyboard = useRef(false);
  const guide = useRef<number | null>(null);
  const size = useRef({ w: 1, h: 1 });
  const down = useRef<Point | null>(null);
  const [anchor, setAnchor] = useState<Point | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);
  const reset = useCallback(() => {
    down.current = null;
    guide.current = null;
    setAnchor(null);
    setCursor(null);
  }, []);
  useEffect(reset, [revision, reset]);
  const place = useCallback(
    (p: Point, start: Point | null) => {
      if (start) {
        const box = rectangle(start, p);
        if (box.wPct > 0.001 && box.hPct > 0.001) {
          onBox(box);
          reset();
          return;
        }
      }
      if (!start && onTap?.(p)) {
        reset();
        return;
      }
      setAnchor(start ?? p);
      setCursor(p);
    },
    [onBox, onTap, reset],
  );
  const onPointerDown = useCallback(
    (p: StagePoint, e: React.PointerEvent<HTMLElement>) => {
      keyboard.current = false;
      if (guides && onGuideMove && !anchor) {
        let closest = e.pointerType === "touch" ? 16 : 7;
        guides.forEach((g, i) => {
          const x = Math.max(g.xPct, Math.min(g.xPct + g.wPct, p.xPct));
          const y = Math.max(g.yPct, Math.min(g.yPct + g.hPct, p.yPct));
          const distance = Math.hypot((x - p.xPct) * size.current.w, (y - p.yPct) * size.current.h);
          if (distance < closest) {
            closest = distance;
            guide.current = i;
          }
        });
      }
      down.current = p;
      setCursor(p);
    },
    [anchor, guides, onGuideMove],
  );
  const onPointerMove = useCallback((p: StagePoint) => {
    if (down.current) setCursor(p);
  }, []);
  const onPointerUp = useCallback(
    (p: StagePoint) => {
      if (guide.current !== null && onGuideMove) {
        onGuideMove(guide.current, p);
        reset();
        return;
      }
      const first = down.current;
      if (!first) return;
      down.current = null;
      const dragged =
        Math.max(Math.abs(p.xPct - first.xPct), Math.abs(p.yPct - first.yPct)) > 0.012;
      place(p, anchor ?? (dragged ? first : null));
    },
    [anchor, place, onGuideMove, reset],
  );
  const onKeyDown = useCallback(
    (e: StageKeyboardEvent) => {
      if (busy || e.nativeEvent.isComposing) return false;
      if (e.key === "Escape" && (cursor || anchor)) {
        reset();
        return true;
      }
      keyboard.current = true;
      const p = cursor ?? center;
      if (e.key === "Enter" || e.key === " ") {
        place(p, anchor);
        return true;
      }
      const step = e.shiftKey ? 0.05 : 0.01;
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      if (!dx && !dy) return false;
      setCursor({
        xPct: Math.max(0, Math.min(1, p.xPct + dx)),
        yPct: Math.max(0, Math.min(1, p.yPct + dy)),
      });
      return true;
    },
    [anchor, busy, cursor, place, reset],
  );
  const paintOverlay = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      pageIndex: number,
      bitmap: HTMLCanvasElement | null,
    ) => {
      paintUnderlay?.(ctx, w, h, pageIndex, bitmap);
      size.current = { w, h };
      const start = guide.current === null ? (anchor ?? down.current) : null;
      const box = start && cursor ? rectangle(start, cursor) : area;
      ctx.save();
      ctx.strokeStyle = canvasAccent(ctx);
      ctx.lineWidth = 2;
      if (box) ctx.strokeRect(box.xPct * w, box.yPct * h, box.wPct * w, box.hPct * h);
      if (box === area)
        for (const [i, line] of (guides ?? []).entries()) {
          const g =
            i === guide.current && cursor
              ? { ...line, ...(line.wPct === 0 ? { xPct: cursor.xPct } : { yPct: cursor.yPct }) }
              : line;
          ctx.beginPath();
          ctx.moveTo(g.xPct * w, g.yPct * h);
          ctx.lineTo((g.xPct + g.wPct) * w, (g.yPct + g.hPct) * h);
          ctx.stroke();
        }
      if (cursor) {
        const x = cursor.xPct * w,
          y = cursor.yPct * h;
        ctx.beginPath();
        ctx.moveTo(x - 7, y);
        ctx.lineTo(x + 7, y);
        ctx.moveTo(x, y - 7);
        ctx.lineTo(x, y + 7);
        ctx.stroke();
      }
      ctx.restore();
    },
    [area, anchor, cursor, guides, paintUnderlay],
  );
  useStageProps({
    paintOverlay,
    cursor: busy ? "default" : "crosshair",
    onPointerDown: busy ? undefined : onPointerDown,
    onPointerMove,
    onPointerUp: busy ? undefined : onPointerUp,
    onPointerCancel: reset,
    onKeyDown,
    keyboardHelp:
      "Move the crosshair with the arrow keys. Hold Shift for larger steps. Press Enter at each corner, or Escape to start again.",
    keyboardShortcuts: "ArrowLeft ArrowRight ArrowUp ArrowDown Enter Space Escape",
  });
  return (
    <span className="sr-only" role="status">
      {keyboard.current && cursor
        ? `${anchor ? "Second corner" : "First corner"}, ${Math.round(cursor.xPct * 100)}% across, ${Math.round(cursor.yPct * 100)}% down.`
        : ""}
    </span>
  );
}
