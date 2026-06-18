// AnnotateTool.tsx — Overlay-object tool. The Stage draws vector marks (pen,
// highlighter, line, arrow, rectangle, oval) plus text labels as `annotation`
// overlay objects in fraction space; the Panel picks the mark, colour, an
// optional shape fill, and — for text — font family + Bold/Italic, size, and an
// optional opaque background.
//
// Interaction model (REDESIGN follow-up):
//   • A default **Select** mode hit-tests existing marks: tap to select, drag to
//     reposition, Delete/Backspace to remove, double-click a label to edit it.
//   • Drawing/text tools are **arm-once**: placing one mark auto-returns to
//     Select and selects the new mark, so a stray tap can't keep adding marks.
//   • Text is typed **inline on the page** (a focused input anchored at the tap
//     point), with its size auto-suggested from nearby page text. An empty box
//     is discarded — nothing is placed unless you actually type something.
//
// On Apply, `annotatePdf` burns the marks as real vector graphics + text
// (selectable text underneath is untouched), then the annotation objects are
// dropped (now in the bytes). See CLAUDE.md (overlay tools).

import {
  ArrowUpRight,
  Bold,
  Circle,
  Highlighter,
  Italic,
  Minus,
  MousePointer2,
  Pen,
  Square,
  Trash2,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ColorPicker, hexToRgb, rgbToHex } from "../../components/ColorPicker.tsx";
import { Select } from "../../components/Select.tsx";
import type {
  Annotation,
  AnnotationColor,
  FontFamily,
  TextFontId,
} from "../../utils/pdf-operations.ts";
import {
  annotatePdf,
  decomposeTextFont,
  resolveTextFont,
  TEXT_BG_HEIGHT_EM,
  TEXT_BG_PAD_EM,
  TEXT_LINE_EM,
  wrapTextToWidth,
} from "../../utils/pdf-operations.ts";
import { extractPageTextGeometry, type LayoutPage } from "../../utils/layout-extract.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";
import { type StagePoint, useInlineEditor, useStageProps } from "../stage.tsx";
import { Labeled, RangeField, Toggle } from "./controls.tsx";

const TOOL_ID = "annotate-pdf";
const DEFAULT_HEX = "#1e293b";
const DEFAULT_FILL_HEX = "#2563eb";
const DEFAULT_BG_HEX = "#ffffff";
const DEFAULT_TEXT_PT = 16;
/** Selection chrome + drag affordances use the single Ocean-Blue accent. */
const ACCENT = "#2563eb";

type Mode = "select" | "pen" | "highlight" | "line" | "arrow" | "rect" | "ellipse" | "text";
type TextAnnotation = Extract<Annotation, { kind: "text" }>;

const PEN_THICK = 0.0035;
const HIGHLIGHT_THICK = 0.022;
const SHAPE_THICK = 0.004;
/** Default text box (page fractions) when the text tool is tapped rather than
 *  dragged — a sensible starting region the user can then resize. */
const DEFAULT_TEXT_W = 0.34;
const DEFAULT_TEXT_H = 0.1;
/** Smallest box a drag must cover to count as a custom region (else a tap). */
const MIN_DRAG_FRAC = 0.02;
/** Min box size (fractions) a resize can shrink a rect/oval/text box to. */
const MIN_BOX_FRAC = 0.015;
/** Hit slop (device px) around a resize handle. */
const HANDLE_TOL_PX = 11;
/** Painted half-size (device px) of a resize handle square. */
const HANDLE_HALF_PX = 4;
/** The eight resize handles, by compass id. */
type HandleId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
const HANDLE_IDS: HandleId[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const HANDLE_CURSOR: Record<HandleId, string> = {
  nw: "nwse-resize",
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize",
};
/** Pointer travel (device px) before a select-mode press counts as a drag, not a
 *  click — keeps a tap-to-select from committing a zero-distance move. */
const MOVE_THRESHOLD_PX = 4;
/** Hit-test slop (device px) around a mark. */
const HIT_TOL_PX = 8;
/** Max gap (ms) between two taps on the same label to count as a double-click. */
const DOUBLE_TAP_MS = 300;
/** Arrow key → [dx, dy] nudge direction for keyboard repositioning. */
const ARROW_DIRS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** CSS family stack mirroring each standard-14 family for the on-canvas preview. */
const FAMILY_CSS: Record<FontFamily, string> = {
  helvetica: "Helvetica, Arial, sans-serif",
  times: '"Times New Roman", Times, serif',
  courier: '"Courier New", Courier, monospace',
};
const FAMILY_LABEL: Record<FontFamily, string> = {
  helvetica: "Helvetica",
  times: "Times",
  courier: "Courier",
};
const FAMILIES: FontFamily[] = ["helvetica", "times", "courier"];

// Font id ↔ (family, bold, italic) resolution lives with the font model in
// annotate.ts so the burn path and this UI agree (and it's unit-tested there).
const resolveFont = resolveTextFont;
const decomposeFont = decomposeTextFont;

/** Canvas `font` string for a label — italic prefix, weight, px size, css stack.
 *  Shared by the overlay painter and the hit-test text measurer so the clickable
 *  box matches what's drawn (and burned). */
function cssFont(id: TextFontId | undefined, sizePx: number): string {
  const { family, bold, italic } = decomposeFont(id ?? "helvetica");
  return `${italic ? "italic " : ""}${bold ? 700 : 400} ${sizePx}px ${FAMILY_CSS[family]}`;
}

// One reused offscreen 2d ctx for measuring label widths in hit-testing (kept
// off the live overlay ctx, whose font/state churns during paint).
let _annMeasureCtx: CanvasRenderingContext2D | null = null;
function measureAnnText(text: string, font: string): number {
  if (!_annMeasureCtx) _annMeasureCtx = document.createElement("canvas").getContext("2d");
  if (!_annMeasureCtx) return text.length * 8;
  _annMeasureCtx.font = font;
  return _annMeasureCtx.measureText(text).width;
}

/** Closed shapes can carry an interior fill; freehand/line marks cannot. */
const isFillable = (m: Mode): boolean => m === "rect" || m === "ellipse";

function fillStyle(c: AnnotationColor): string {
  return `rgb(${c.r}, ${c.g}, ${c.b})`;
}

/** Axis-aligned bbox of a mark in fraction space (0–1). `w`,`h` are the painted
 *  canvas px (needed to measure a label's width + convert the bg padding). */
function annotationBBox(a: Annotation, w: number, h: number) {
  switch (a.kind) {
    case "stroke": {
      let minX = 1;
      let minY = 1;
      let maxX = 0;
      let maxY = 0;
      for (const p of a.points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      return { x: minX, y: minY, w: Math.max(0, maxX - minX), h: Math.max(0, maxY - minY) };
    }
    case "rect":
    case "ellipse":
      return { x: a.x, y: a.y, w: a.w, h: a.h };
    case "line":
    case "arrow":
      return {
        x: Math.min(a.x1, a.x2),
        y: Math.min(a.y1, a.y2),
        w: Math.abs(a.x2 - a.x1),
        h: Math.abs(a.y2 - a.y1),
      };
    case "text": {
      // Box text: the bbox IS the box. Legacy point text: anchor + measured
      // single line (mirrors the burn geometry — measureText width + bg ems).
      if (a.w != null && a.h != null) return { x: a.x, y: a.y, w: a.w, h: a.h };
      const sizePx = a.sizeFrac * h;
      const padX = sizePx * TEXT_BG_PAD_EM;
      const textW = measureAnnText(a.text, cssFont(a.font, sizePx));
      return {
        x: a.x - padX / w,
        y: a.y,
        w: (textW + padX * 2) / w,
        h: a.sizeFrac * TEXT_BG_HEIGHT_EM,
      };
    }
  }
}

/** A mark whose bounding box can be freely resized via corner/edge handles
 *  (rectangles, ovals, and box-mode text). Legacy point text and thin marks
 *  (stroke/line/arrow) are move-only. */
function isResizable(a: Annotation): boolean {
  return (
    a.kind === "rect" || a.kind === "ellipse" || (a.kind === "text" && a.w != null && a.h != null)
  );
}

/** Device-px centres of the eight handles around a fraction bbox (+chrome pad). */
function handleCenters(
  b: { x: number; y: number; w: number; h: number },
  w: number,
  h: number,
): Record<HandleId, { x: number; y: number }> {
  const pad = 3;
  const x0 = b.x * w - pad;
  const y0 = b.y * h - pad;
  const x1 = (b.x + b.w) * w + pad;
  const y1 = (b.y + b.h) * h + pad;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  return {
    nw: { x: x0, y: y0 },
    n: { x: mx, y: y0 },
    ne: { x: x1, y: y0 },
    e: { x: x1, y: my },
    se: { x: x1, y: y1 },
    s: { x: mx, y: y1 },
    sw: { x: x0, y: y1 },
    w: { x: x0, y: my },
  };
}

/** Which handle (if any) the device-px point lands on for the given bbox. */
function hitHandle(
  b: { x: number; y: number; w: number; h: number },
  px: number,
  py: number,
  w: number,
  h: number,
): HandleId | null {
  const centers = handleCenters(b, w, h);
  for (const id of HANDLE_IDS) {
    const c = centers[id];
    if (Math.abs(px - c.x) <= HANDLE_TOL_PX && Math.abs(py - c.y) <= HANDLE_TOL_PX) return id;
  }
  return null;
}

/** Resize a fraction bbox by dragging `handle` by a fraction delta, keeping the
 *  opposite edge(s) pinned and clamping to a minimum size within the page. */
function resizeBBox(
  orig: { x: number; y: number; w: number; h: number },
  handle: HandleId,
  dx: number,
  dy: number,
): { x: number; y: number; w: number; h: number } {
  let { x, y, w, h } = orig;
  const right = orig.x + orig.w;
  const bottom = orig.y + orig.h;
  if (handle.includes("w")) {
    x = Math.min(orig.x + dx, right - MIN_BOX_FRAC);
    x = Math.max(0, x);
    w = right - x;
  }
  if (handle.includes("e")) {
    w = Math.max(MIN_BOX_FRAC, Math.min(orig.w + dx, 1 - orig.x));
  }
  if (handle.includes("n")) {
    y = Math.min(orig.y + dy, bottom - MIN_BOX_FRAC);
    y = Math.max(0, y);
    h = bottom - y;
  }
  if (handle.includes("s")) {
    h = Math.max(MIN_BOX_FRAC, Math.min(orig.h + dy, 1 - orig.y));
  }
  return { x, y, w, h };
}

/** Write a new bbox back onto a resizable mark (rect/ellipse/box-text). */
function applyBBox(a: Annotation, b: { x: number; y: number; w: number; h: number }): Annotation {
  if (a.kind === "rect" || a.kind === "ellipse" || a.kind === "text") {
    return { ...a, x: b.x, y: b.y, w: b.w, h: b.h };
  }
  return a;
}

/** Distance (px) from point (px,py) to segment (ax,ay)-(bx,by). */
function pointSegDistPx(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Does fraction point (fx,fy) hit mark `a`? Thin marks (line/stroke) test by
 *  distance-to-segment in px; areas test a padded bbox. */
function hitTest(a: Annotation, fx: number, fy: number, w: number, h: number): boolean {
  const px = fx * w;
  const py = fy * h;
  if (a.kind === "stroke") {
    const tol = Math.max(HIT_TOL_PX, (a.thicknessFrac * w) / 2 + 3);
    if (a.points.length === 1) {
      return Math.hypot(px - a.points[0].x * w, py - a.points[0].y * h) <= tol;
    }
    for (let i = 1; i < a.points.length; i++) {
      const p0 = a.points[i - 1];
      const p1 = a.points[i];
      if (pointSegDistPx(px, py, p0.x * w, p0.y * h, p1.x * w, p1.y * h) <= tol) return true;
    }
    return false;
  }
  if (a.kind === "line" || a.kind === "arrow") {
    const tol = Math.max(HIT_TOL_PX, (a.thicknessFrac * w) / 2 + 3);
    return pointSegDistPx(px, py, a.x1 * w, a.y1 * h, a.x2 * w, a.y2 * h) <= tol;
  }
  const b = annotationBBox(a, w, h);
  return (
    px >= b.x * w - HIT_TOL_PX &&
    px <= (b.x + b.w) * w + HIT_TOL_PX &&
    py >= b.y * h - HIT_TOL_PX &&
    py <= (b.y + b.h) * h + HIT_TOL_PX
  );
}

/** Translate a mark's geometry by a fraction delta. */
function translateAnnotation(a: Annotation, dx: number, dy: number): Annotation {
  switch (a.kind) {
    case "stroke":
      return { ...a, points: a.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    case "rect":
    case "ellipse":
      return { ...a, x: a.x + dx, y: a.y + dy };
    case "line":
    case "arrow":
      return { ...a, x1: a.x1 + dx, y1: a.y1 + dy, x2: a.x2 + dx, y2: a.y2 + dy };
    case "text":
      return { ...a, x: a.x + dx, y: a.y + dy };
  }
}

/** Clamp a fraction delta so the mark's bbox stays within the page [0,1]. */
function clampDelta(bbox: { x: number; y: number; w: number; h: number }, dx: number, dy: number) {
  let cdx = dx;
  let cdy = dy;
  if (bbox.x + cdx < 0) cdx = -bbox.x;
  if (bbox.x + bbox.w + cdx > 1) cdx = 1 - bbox.w - bbox.x;
  if (bbox.y + cdy < 0) cdy = -bbox.y;
  if (bbox.y + bbox.h + cdy > 1) cdy = 1 - bbox.h - bbox.y;
  return { dx: cdx, dy: cdy };
}

/** Nearest body-text point size to a tap, for the font-size suggestion. Returns
 *  null when there's no usable text nearby (e.g. a scanned/image page). */
function suggestSizePt(geom: LayoutPage, xPct: number, yPct: number): number | null {
  const items = geom.items.filter((i) => i.text.trim().length > 0 && i.fontSize > 0);
  if (items.length === 0) return null;
  const px = xPct * (geom.width || 1);
  const py = yPct * (geom.height || 1);
  // 1) the run whose box contains the tap.
  const inside = items.find(
    (i) => px >= i.x && px <= i.x + i.width && py >= i.y && py <= i.y + i.height,
  );
  if (inside) return clampSnapPt(inside.fontSize);
  // 2) else the nearest run, biasing vertical distance so we stay on the local
  //    row/column rather than grabbing a header far above.
  let best: LayoutPage["items"][number] | null = null;
  let bestD = Infinity;
  for (const i of items) {
    const cx = i.x + i.width / 2;
    const cy = i.y + i.height / 2;
    const d = Math.hypot(px - cx, (py - cy) * 1.5);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  if (!best || bestD > best.height * 6) return null; // nothing reasonably close
  return clampSnapPt(best.fontSize);
}

/** Round a raw glyph height to a tidy point size, snapping to common sizes;
 *  reject degenerate values (PDF.js heights are ~1 on some PDFs). */
function clampSnapPt(raw: number): number | null {
  if (!Number.isFinite(raw) || raw < 5 || raw > 96) return null;
  for (const c of [8, 9, 10, 11, 12, 14, 16, 18, 20, 24]) if (Math.abs(raw - c) <= 0.6) return c;
  return Math.round(raw);
}

function drawEllipsePath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
}

function drawAnnotation(ctx: CanvasRenderingContext2D, a: Annotation, w: number, h: number) {
  const col = fillStyle(a.color);
  if (a.kind === "stroke") {
    if (a.points.length < 1) return;
    ctx.save();
    ctx.globalAlpha = a.opacity;
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(1, a.thicknessFrac * w);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    a.points.forEach((p, i) => (i ? ctx.lineTo(p.x * w, p.y * h) : ctx.moveTo(p.x * w, p.y * h)));
    ctx.stroke();
    ctx.restore();
  } else if (a.kind === "rect" || a.kind === "ellipse") {
    ctx.save();
    const x = a.x * w;
    const y = a.y * h;
    const ww = a.w * w;
    const hh = a.h * h;
    if (a.fill) {
      ctx.globalAlpha = a.fill.opacity ?? 1;
      ctx.fillStyle = fillStyle(a.fill.color);
      if (a.kind === "rect") ctx.fillRect(x, y, ww, hh);
      else {
        drawEllipsePath(ctx, x, y, ww, hh);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(1, a.thicknessFrac * w);
    if (a.kind === "rect") ctx.strokeRect(x, y, ww, hh);
    else {
      drawEllipsePath(ctx, x, y, ww, hh);
      ctx.stroke();
    }
    ctx.restore();
  } else if (a.kind === "line" || a.kind === "arrow") {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(1, a.thicknessFrac * w);
    ctx.lineCap = "round";
    const x1 = a.x1 * w;
    const y1 = a.y1 * h;
    const x2 = a.x2 * w;
    const y2 = a.y2 * h;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    if (a.kind === "arrow") {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = Math.max(6, ctx.lineWidth * 3.5);
      for (const spread of [Math.PI - 0.45, Math.PI + 0.45]) {
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 + headLen * Math.cos(angle + spread),
          y2 + headLen * Math.sin(angle + spread),
        );
        ctx.stroke();
      }
    }
    ctx.restore();
  } else if (a.kind === "text") {
    if (!a.text) return;
    const size = a.sizeFrac * h;
    ctx.save();
    ctx.font = cssFont(a.font, size);
    ctx.textBaseline = "alphabetic";
    if (a.w != null && a.h != null) {
      // Box text: bg fills the box; lines wrap to the box width and stack down
      // from the top (mirrors annotate.ts's burn geometry exactly).
      const padX = size * TEXT_BG_PAD_EM;
      if (a.bg) {
        ctx.globalAlpha = a.bg.opacity ?? 1;
        ctx.fillStyle = fillStyle(a.bg.color);
        ctx.fillRect(a.x * w, a.y * h, a.w * w, a.h * h);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = col;
      const lines = wrapTextToWidth(
        a.text,
        Math.max(1, a.w * w - padX * 2),
        (s) => ctx.measureText(s).width,
      );
      const lineH = size * TEXT_LINE_EM;
      lines.forEach((ln, i) => {
        if (ln) ctx.fillText(ln, a.x * w + padX, a.y * h + size + i * lineH);
      });
    } else {
      // Legacy point text: anchor `y` is the box top, baseline one size below it,
      // background spanning down past the descenders.
      if (a.bg) {
        const padX = size * TEXT_BG_PAD_EM;
        ctx.globalAlpha = a.bg.opacity ?? 1;
        ctx.fillStyle = fillStyle(a.bg.color);
        ctx.fillRect(
          a.x * w - padX,
          a.y * h,
          ctx.measureText(a.text).width + padX * 2,
          size * TEXT_BG_HEIGHT_EM,
        );
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = col;
      ctx.fillText(a.text, a.x * w, a.y * h + size);
    }
    ctx.restore();
  }
}

/** Dashed selection box around a mark's bbox, with square resize handles when
 *  the mark is resizable (rect / oval / box-text) — corners only for thin marks. */
function drawSelectionChrome(
  ctx: CanvasRenderingContext2D,
  b: { x: number; y: number; w: number; h: number },
  w: number,
  h: number,
  resizable: boolean,
) {
  const pad = 3;
  const x = b.x * w - pad;
  const y = b.y * h - pad;
  const bw = b.w * w + pad * 2;
  const bh = b.h * h + pad * 2;
  ctx.save();
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(x, y, bw, bh);
  ctx.setLineDash([]);
  if (resizable) {
    // Eight grab handles (white fill + accent border so they read on any page).
    const centers = handleCenters(b, w, h);
    ctx.lineWidth = 1.5;
    for (const id of HANDLE_IDS) {
      const c = centers[id];
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        c.x - HANDLE_HALF_PX,
        c.y - HANDLE_HALF_PX,
        HANDLE_HALF_PX * 2,
        HANDLE_HALF_PX * 2,
      );
      ctx.strokeStyle = ACCENT;
      ctx.strokeRect(
        c.x - HANDLE_HALF_PX,
        c.y - HANDLE_HALF_PX,
        HANDLE_HALF_PX * 2,
        HANDLE_HALF_PX * 2,
      );
    }
  } else {
    ctx.fillStyle = ACCENT;
    const hs = 3;
    for (const [hx, hy] of [
      [x, y],
      [x + bw, y],
      [x, y + bh],
      [x + bw, y + bh],
    ]) {
      ctx.fillRect(hx - hs, hy - hs, hs * 2, hs * 2);
    }
  }
  ctx.restore();
}

/** What the inline editor is anchored to. Style is read live from the slice so
 *  panel changes (and the size auto-suggest) reflect in the editor immediately. */
interface Editing {
  editorId: string;
  mode: "new" | "edit";
  objId?: string;
  pageIndex: number;
  xPct: number;
  yPct: number;
  /** Box size (fractions) — present for box-mode text, absent for legacy labels. */
  wPct?: number;
  hPct?: number;
  initialText: string;
}

export function Stage() {
  const { doc, selectedPage } = useEditorRead();
  const { addObject, moveObject, updateObject, commit, removeObject, patchToolState } =
    useEditorActions();
  const setInlineEditor = useInlineEditor();
  const slice = useToolSlice(TOOL_ID);
  const mode = (slice.mode as Mode) ?? "select";
  const colorHex = (slice.colorHex as string) ?? DEFAULT_HEX;
  const fillEnabled = (slice.fillEnabled as boolean) ?? false;
  const fillHex = (slice.fillHex as string) ?? DEFAULT_FILL_HEX;
  const fillOpacity = (slice.fillOpacity as number) ?? 0.3;
  const selectedId = slice.selectedId as string | undefined;
  // Text placement defaults (also the live style of an open editor).
  const textFamily = (slice.textFamily as FontFamily) ?? "helvetica";
  const textBold = (slice.textBold as boolean) ?? false;
  const textItalic = (slice.textItalic as boolean) ?? false;
  const textSizePt = (slice.textSizePt as number) ?? DEFAULT_TEXT_PT;
  const bgEnabled = (slice.bgEnabled as boolean) ?? false;
  const bgHex = (slice.bgHex as string) ?? DEFAULT_BG_HEX;
  const bgOpacity = (slice.bgOpacity as number) ?? 1;

  const color = useMemo(() => hexToRgb(colorHex), [colorHex]);
  const fillColor = useMemo(() => hexToRgb(fillHex), [fillHex]);
  const bgColor = useMemo(() => hexToRgb(bgHex), [bgHex]);
  const pageHeightPt = doc?.pages[selectedPage]?.heightPt ?? 0;

  // Latch the live doc so stable handlers/effects read the freshest objects.
  const docRef = useRef(doc);
  docRef.current = doc;
  const textSizePtRef = useRef(textSizePt);
  textSizePtRef.current = textSizePt;

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [draftPoints, setDraftPoints] = useState<{ x: number; y: number }[] | null>(null);
  const [draftBox, setDraftBox] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );
  const [draftLine, setDraftLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  // Freehand pen: accumulate raw points in a ref and flush to draftPoints state
  // at most once per animation frame. The old per-move `setDraftPoints(prev =>
  // [...prev, pt])` was O(points) per raw event (so O(n²) over a stroke) AND put
  // draftPoints in onPointerUp's deps, which re-registered the stage props on
  // every pen move. The ref is the source of truth the commit reads from; state
  // only drives the in-progress repaint.
  const penBufferRef = useRef<{ x: number; y: number }[]>([]);
  const penFrameRef = useRef<number | null>(null);
  const flushPenFrame = useCallback(() => {
    if (penFrameRef.current != null) {
      cancelAnimationFrame(penFrameRef.current);
      penFrameRef.current = null;
    }
  }, []);
  useEffect(() => flushPenFrame, [flushPenFrame]);

  // Select-mode drag: original geometry + a local live-preview geometry so the
  // move never touches the doc until pointerup (one history entry, no chrome
  // re-render of the whole editor each frame — mirrors the draft* pattern).
  const dragStartRef = useRef<{
    id: string;
    sx: number;
    sy: number;
    orig: Annotation;
    bbox: { x: number; y: number; w: number; h: number };
    moved: boolean;
  } | null>(null);
  const [dragGeom, setDragGeom] = useState<{ id: string; ann: Annotation } | null>(null);
  // Select-mode resize: like the drag, a local live-preview geometry so the
  // resize never touches the doc until pointerup (one history entry).
  const resizeStartRef = useRef<{
    id: string;
    handle: HandleId;
    sx: number;
    sy: number;
    orig: Annotation;
    bbox: { x: number; y: number; w: number; h: number };
  } | null>(null);
  const [resizeGeom, setResizeGeom] = useState<{ id: string; ann: Annotation } | null>(null);
  // Handle currently hovered in select mode → directional resize cursor.
  const [hoverHandle, setHoverHandle] = useState<HandleId | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);
  // Painted device-px dims, stashed each paint so hit-test can convert px tol.
  const paintWHRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const [editing, setEditing] = useState<Editing | null>(null);
  const editingRef = useRef<Editing | null>(null);
  editingRef.current = editing;
  const editSeqRef = useRef(0);
  // Per-page text geometry cache for the size suggestion, invalidated when the
  // doc bytes change (any Apply/undo/redo reflows text).
  const geomCacheRef = useRef<Map<number, Promise<LayoutPage | null>>>(new Map());
  const geomBytesRef = useRef<Uint8Array | null>(null);

  const boxMode = mode === "rect" || mode === "ellipse";
  const lineMode = mode === "line" || mode === "arrow";
  const textMode = mode === "text";
  const selectMode = mode === "select";

  const strokeOpacity = mode === "highlight" ? 0.4 : 1;
  const strokeThick = mode === "highlight" ? HIGHLIGHT_THICK : PEN_THICK;
  const fill = useMemo(
    () =>
      fillEnabled && isFillable(mode) ? { color: fillColor, opacity: fillOpacity } : undefined,
    [fillEnabled, mode, fillColor, fillOpacity],
  );

  const getPageGeometry = useCallback((pageIndex: number): Promise<LayoutPage | null> => {
    const d = docRef.current;
    if (!d) return Promise.resolve(null);
    if (geomBytesRef.current !== d.bytes) {
      geomBytesRef.current = d.bytes;
      geomCacheRef.current.clear();
    }
    let p = geomCacheRef.current.get(pageIndex);
    if (!p) {
      p = extractPageTextGeometry(docToFile(d), pageIndex + 1).catch(() => null);
      geomCacheRef.current.set(pageIndex, p);
    }
    return p;
  }, []);

  // Open the inline editor for a fresh text box at (x,y) with size (boxW,boxH);
  // suggest a size from nearby page text without blocking the caret.
  const openNewText = useCallback(
    (x: number, y: number, boxW: number, boxH: number) => {
      const page = selectedPage;
      const editorId = `new-${(editSeqRef.current += 1)}`;
      setEditing({
        editorId,
        mode: "new",
        pageIndex: page,
        xPct: x,
        yPct: y,
        wPct: boxW,
        hPct: boxH,
        initialText: "",
      });
      const ph = docRef.current?.pages[page]?.heightPt ?? 0;
      const rotation = docRef.current?.pages[page]?.rotation ?? 0;
      // Skip the suggestion on rotated pages — pt→sizeFrac via heightPt skews.
      if (ph <= 0 || rotation !== 0) return;
      const openSizePt = textSizePtRef.current;
      void (async () => {
        const geom = await getPageGeometry(page);
        if (!geom) return;
        const pt = suggestSizePt(geom, x, y);
        if (pt == null) return;
        const ed = editingRef.current;
        if (!ed || ed.editorId !== editorId) return; // a different session now
        if (textSizePtRef.current !== openSizePt) return; // user already set a size
        patchToolState(TOOL_ID, { textSizePt: pt, sizeHint: `Matched ~${pt} pt nearby` });
      })();
    },
    [selectedPage, getPageGeometry, patchToolState],
  );

  const openEditText = useCallback((obj: { id: string; pageIndex: number }, a: TextAnnotation) => {
    setEditing({
      editorId: `edit-${obj.id}-${(editSeqRef.current += 1)}`,
      mode: "edit",
      objId: obj.id,
      pageIndex: obj.pageIndex,
      xPct: a.x,
      yPct: a.y,
      ...(a.w != null && a.h != null ? { wPct: a.w, hPct: a.h } : {}),
      initialText: a.text,
    });
  }, []);

  // Build / update the inline-editor descriptor from the editing anchor + the
  // live slice style. Re-runs on any style change so the box stays WYSIWYG; the
  // same editorId keeps the typed text across a style-only update.
  useEffect(() => {
    if (!editing || pageHeightPt <= 0) {
      setInlineEditor(null);
      return;
    }
    const ed = editing;
    const fontId = resolveFont(textFamily, textBold, textItalic);
    const sizeFrac = textSizePt / pageHeightPt;
    setInlineEditor({
      editorId: ed.editorId,
      pageIndex: ed.pageIndex,
      xPct: ed.xPct,
      yPct: ed.yPct,
      initialText: ed.initialText,
      fontCss: FAMILY_CSS[textFamily],
      fontWeight: textBold ? 700 : 400,
      fontStyle: textItalic ? "italic" : "normal",
      colorHex,
      sizeFrac,
      ...(ed.wPct != null && ed.hPct != null ? { boxWFrac: ed.wPct, boxHFrac: ed.hPct } : {}),
      onCommit: (text: string) => {
        const t = text.trim();
        setEditing(null);
        patchToolState(TOOL_ID, { sizeHint: undefined });
        const box = ed.wPct != null && ed.hPct != null ? { w: ed.wPct, h: ed.hPct } : {};
        if (ed.mode === "new") {
          if (!t) return; // empty box → place nothing (accidental-add guard)
          const id = addObject({
            kind: "annotation",
            pageIndex: ed.pageIndex,
            payload: {
              kind: "text",
              pageIndex: ed.pageIndex,
              x: ed.xPct,
              y: ed.yPct,
              ...box,
              text: t,
              sizeFrac,
              color,
              font: fontId,
              ...(bgEnabled ? { bg: { color: bgColor, opacity: bgOpacity } } : {}),
            },
          });
          // Arm-once: return to Select and select the new label so it can be
          // nudged immediately.
          if (id) patchToolState(TOOL_ID, { mode: "select", selectedId: id });
        } else {
          const cur = docRef.current?.objects.find((o) => o.id === ed.objId);
          const ann = cur?.payload as Annotation | undefined;
          if (!cur || ann?.kind !== "text") return;
          if (!t) {
            removeObject(ed.objId as string);
            patchToolState(TOOL_ID, { selectedId: undefined });
            return;
          }
          moveObject(ed.objId as string, { payload: { ...ann, text: t } }, "Edit text");
          patchToolState(TOOL_ID, { selectedId: ed.objId });
        }
      },
      onCancel: () => {
        setEditing(null);
        patchToolState(TOOL_ID, { sizeHint: undefined });
      },
    });
  }, [
    editing,
    textFamily,
    textBold,
    textItalic,
    textSizePt,
    colorHex,
    color,
    bgEnabled,
    bgColor,
    bgOpacity,
    pageHeightPt,
    setInlineEditor,
    addObject,
    moveObject,
    removeObject,
    patchToolState,
  ]);

  // Clear the inline editor when the tool unmounts (tool switch).
  useEffect(() => () => setInlineEditor(null), [setInlineEditor]);

  // Drop selection + any in-flight drag or open editor when the focused page
  // changes (and on mount, so stale cross-page state never lingers). Switching
  // pages via the UI blurs the input first (committing it); this is the fallback
  // that discards an editor still open after a programmatic page change.
  useEffect(() => {
    setDragGeom(null);
    dragStartRef.current = null;
    setResizeGeom(null);
    resizeStartRef.current = null;
    setHoverHandle(null);
    setEditing(null);
    patchToolState(TOOL_ID, { selectedId: undefined });
  }, [selectedPage, patchToolState]);

  // Sync a newly-selected label's style into the panel slice so the controls
  // reflect (and edit) it. Only on selection change — panel edits don't re-fire.
  const prevSelRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (selectedId === prevSelRef.current) return;
    prevSelRef.current = selectedId;
    if (!selectedId) return;
    const obj = docRef.current?.objects.find((o) => o.id === selectedId);
    const ann = obj?.payload as Annotation | undefined;
    if (!obj || ann?.kind !== "text") return;
    const ph = docRef.current?.pages[obj.pageIndex]?.heightPt ?? 0;
    const { family, bold, italic } = decomposeFont(ann.font ?? "helvetica");
    patchToolState(TOOL_ID, {
      textFamily: family,
      textBold: bold,
      textItalic: italic,
      ...(ph > 0 ? { textSizePt: Math.round(ann.sizeFrac * ph) } : {}),
      colorHex: rgbToHex(ann.color.r, ann.color.g, ann.color.b),
      bgEnabled: !!ann.bg,
      ...(ann.bg
        ? {
            bgHex: rgbToHex(ann.bg.color.r, ann.bg.color.g, ann.bg.color.b),
            bgOpacity: ann.bg.opacity ?? 1,
          }
        : {}),
    });
  }, [selectedId, patchToolState]);

  // Keyboard on the selected mark: Delete/Backspace removes it; arrow keys nudge
  // it for precise placement (Shift = bigger step). Never fires while typing in
  // the inline editor or any field. Arrow nudges coalesce into one undo step (a
  // burst commits once the keys go idle, and on teardown).
  const nudgeTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!selectedId) return;
    const flushNudge = () => {
      if (nudgeTimerRef.current == null) return;
      clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = null;
      commit("Move annotation");
    };
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;
      const obj = docRef.current?.objects.find((o) => o.id === selectedId);
      if (!obj || obj.pageIndex !== selectedPage || !obj.payload) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (nudgeTimerRef.current != null) {
          clearTimeout(nudgeTimerRef.current);
          nudgeTimerRef.current = null;
        }
        removeObject(selectedId);
        patchToolState(TOOL_ID, { selectedId: undefined });
        return;
      }
      const dir = ARROW_DIRS[e.key];
      if (!dir) return;
      e.preventDefault();
      const { w, h } = paintWHRef.current;
      if (!w || !h) return;
      const step = e.shiftKey ? 10 : 1; // on-screen px
      const ann = obj.payload as Annotation;
      const { dx, dy } = clampDelta(
        annotationBBox(ann, w, h),
        (dir[0] * step) / w,
        (dir[1] * step) / h,
      );
      if (dx === 0 && dy === 0) return;
      // Live, history-free move; the burst commits once via the debounce below.
      updateObject(selectedId, { payload: translateAnnotation(ann, dx, dy) });
      if (nudgeTimerRef.current != null) clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = window.setTimeout(() => {
        nudgeTimerRef.current = null;
        commit("Move annotation");
      }, 350);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      flushNudge();
    };
  }, [selectedId, selectedPage, removeObject, updateObject, commit, patchToolState]);

  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, pageIndex: number) => {
      paintWHRef.current = { w, h };
      for (const o of doc?.objects ?? []) {
        if (o.kind !== "annotation" || o.pageIndex !== pageIndex || !o.payload) continue;
        // Hide the label being inline-edited (the input shows it instead).
        if (editing?.mode === "edit" && editing.objId === o.id) continue;
        if (resizeGeom && resizeGeom.id === o.id) {
          drawAnnotation(ctx, resizeGeom.ann, w, h);
          continue;
        }
        if (dragGeom && dragGeom.id === o.id) {
          drawAnnotation(ctx, dragGeom.ann, w, h);
          continue;
        }
        drawAnnotation(ctx, o.payload as Annotation, w, h);
      }
      if (draftPoints) {
        drawAnnotation(
          ctx,
          {
            kind: "stroke",
            pageIndex,
            points: draftPoints,
            color,
            thicknessFrac: strokeThick,
            opacity: strokeOpacity,
          },
          w,
          h,
        );
      }
      if (draftBox) {
        if (textMode) {
          // Text tool: preview the box you're dragging as a dashed accent rect.
          ctx.save();
          ctx.strokeStyle = ACCENT;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(draftBox.x * w, draftBox.y * h, draftBox.w * w, draftBox.h * h);
          ctx.restore();
        } else {
          drawAnnotation(
            ctx,
            {
              kind: mode === "ellipse" ? "ellipse" : "rect",
              pageIndex,
              x: draftBox.x,
              y: draftBox.y,
              w: draftBox.w,
              h: draftBox.h,
              color,
              thicknessFrac: SHAPE_THICK,
              ...(fill ? { fill } : {}),
            },
            w,
            h,
          );
        }
      }
      if (draftLine) {
        drawAnnotation(
          ctx,
          {
            kind: mode === "arrow" ? "arrow" : "line",
            pageIndex,
            ...draftLine,
            color,
            thicknessFrac: SHAPE_THICK,
          },
          w,
          h,
        );
      }
      // Selection chrome (skip while the label is being inline-edited).
      const sel = doc?.objects.find((o) => o.id === selectedId);
      if (
        sel &&
        sel.pageIndex === pageIndex &&
        sel.payload &&
        !(editing?.mode === "edit" && editing.objId === sel.id)
      ) {
        const live =
          resizeGeom && resizeGeom.id === sel.id
            ? resizeGeom.ann
            : dragGeom && dragGeom.id === sel.id
              ? dragGeom.ann
              : (sel.payload as Annotation);
        drawSelectionChrome(ctx, annotationBBox(live, w, h), w, h, isResizable(live));
      }
    },
    [
      doc,
      draftPoints,
      draftBox,
      draftLine,
      mode,
      textMode,
      color,
      strokeThick,
      strokeOpacity,
      fill,
      selectedId,
      dragGeom,
      resizeGeom,
      editing,
    ],
  );

  const onPointerDown = useCallback(
    (p: StagePoint) => {
      startRef.current = { x: p.xPct, y: p.yPct };
      if (selectMode) {
        const { w, h } = paintWHRef.current;
        // A handle of the currently-selected resizable mark wins over hit-testing
        // other marks underneath — start a resize.
        const selObj = doc?.objects.find((o) => o.id === selectedId);
        const selAnn = selObj?.payload as Annotation | undefined;
        if (selObj && selObj.pageIndex === selectedPage && selAnn && isResizable(selAnn)) {
          const bbox = annotationBBox(selAnn, w, h);
          const handle = hitHandle(bbox, p.xPct * w, p.yPct * h, w, h);
          if (handle) {
            resizeStartRef.current = {
              id: selObj.id,
              handle,
              sx: p.xPct,
              sy: p.yPct,
              orig: selAnn,
              bbox,
            };
            return;
          }
        }
        const objs = doc?.objects ?? [];
        let hit: (typeof objs)[number] | null = null;
        for (let i = objs.length - 1; i >= 0; i--) {
          const o = objs[i];
          if (
            o.kind === "annotation" &&
            o.pageIndex === selectedPage &&
            o.payload &&
            hitTest(o.payload as Annotation, p.xPct, p.yPct, w, h)
          ) {
            hit = o;
            break;
          }
        }
        if (hit) {
          const ann = hit.payload as Annotation;
          dragStartRef.current = {
            id: hit.id,
            sx: p.xPct,
            sy: p.yPct,
            orig: ann,
            bbox: annotationBBox(ann, w, h),
            moved: false,
          };
          if (selectedId !== hit.id) patchToolState(TOOL_ID, { selectedId: hit.id });
        } else {
          dragStartRef.current = null;
          if (selectedId) patchToolState(TOOL_ID, { selectedId: undefined });
        }
        return;
      }
      // Text + shape boxes both drag out a rectangle; line/arrow drag a segment;
      // pen accumulates points.
      if (boxMode || textMode) setDraftBox({ x: p.xPct, y: p.yPct, w: 0, h: 0 });
      else if (lineMode) setDraftLine({ x1: p.xPct, y1: p.yPct, x2: p.xPct, y2: p.yPct });
      else {
        penBufferRef.current = [{ x: p.xPct, y: p.yPct }];
        setDraftPoints([{ x: p.xPct, y: p.yPct }]);
      }
    },
    [selectMode, boxMode, lineMode, textMode, doc, selectedPage, selectedId, patchToolState],
  );

  const onPointerMove = useCallback(
    (p: StagePoint) => {
      if (selectMode) {
        const { w, h } = paintWHRef.current;
        const rs = resizeStartRef.current;
        if (rs) {
          const nb = resizeBBox(rs.bbox, rs.handle, p.xPct - rs.sx, p.yPct - rs.sy);
          setResizeGeom({ id: rs.id, ann: applyBBox(rs.orig, nb) });
          return;
        }
        const ds = dragStartRef.current;
        if (!ds) {
          // No drag in progress — update the hover cursor over the selected
          // mark's handles so the user knows they can resize.
          const selObj = doc?.objects.find((o) => o.id === selectedId);
          const selAnn = selObj?.payload as Annotation | undefined;
          const over =
            selObj && selObj.pageIndex === selectedPage && selAnn && isResizable(selAnn)
              ? hitHandle(annotationBBox(selAnn, w, h), p.xPct * w, p.yPct * h, w, h)
              : null;
          setHoverHandle((prev) => (prev === over ? prev : over));
          return;
        }
        const dxPct = p.xPct - ds.sx;
        const dyPct = p.yPct - ds.sy;
        if (!ds.moved) {
          if (Math.hypot(dxPct * w, dyPct * h) < MOVE_THRESHOLD_PX) return;
          ds.moved = true;
        }
        const { dx, dy } = clampDelta(ds.bbox, dxPct, dyPct);
        setDragGeom({ id: ds.id, ann: translateAnnotation(ds.orig, dx, dy) });
        return;
      }
      const s = startRef.current;
      if (!s) return;
      if (boxMode || textMode) {
        setDraftBox({
          x: Math.min(s.x, p.xPct),
          y: Math.min(s.y, p.yPct),
          w: Math.abs(p.xPct - s.x),
          h: Math.abs(p.yPct - s.y),
        });
      } else if (lineMode) {
        setDraftLine({ x1: s.x, y1: s.y, x2: p.xPct, y2: p.yPct });
      } else {
        // Append to the ref every raw move (O(1)); flush a snapshot to state at
        // most once per frame so the repaint coalesces instead of firing per event.
        penBufferRef.current.push({ x: p.xPct, y: p.yPct });
        if (penFrameRef.current == null) {
          penFrameRef.current = requestAnimationFrame(() => {
            penFrameRef.current = null;
            setDraftPoints(penBufferRef.current.slice());
          });
        }
      }
    },
    [selectMode, boxMode, lineMode, textMode, doc, selectedId, selectedPage],
  );

  const onPointerUp = useCallback(
    (p: StagePoint, e: { timeStamp: number }) => {
      const s = startRef.current;
      startRef.current = null;
      if (selectMode) {
        const rs = resizeStartRef.current;
        if (rs) {
          resizeStartRef.current = null;
          setResizeGeom(null);
          const nb = resizeBBox(rs.bbox, rs.handle, p.xPct - rs.sx, p.yPct - rs.sy);
          moveObject(rs.id, { payload: applyBBox(rs.orig, nb) }, "Resize annotation");
          return;
        }
        const ds = dragStartRef.current;
        dragStartRef.current = null;
        setDragGeom(null);
        if (!ds) return;
        if (ds.moved) {
          // Recompute the final geometry from the start ref + this point (like
          // the draft-box commit) so it never depends on the live dragGeom state.
          const { dx, dy } = clampDelta(ds.bbox, p.xPct - ds.sx, p.yPct - ds.sy);
          moveObject(ds.id, { payload: translateAnnotation(ds.orig, dx, dy) }, "Move annotation");
          return;
        }
        // A tap (no real movement): double-tap a label to edit it, else remember
        // this tap for the next one.
        const obj = doc?.objects.find((o) => o.id === ds.id);
        const ann = obj?.payload as Annotation | undefined;
        const now = e.timeStamp;
        if (
          ann?.kind === "text" &&
          lastTapRef.current?.id === ds.id &&
          now - lastTapRef.current.time < DOUBLE_TAP_MS
        ) {
          lastTapRef.current = null;
          openEditText(obj as { id: string; pageIndex: number }, ann);
        } else {
          lastTapRef.current = { id: ds.id, time: now };
        }
        return;
      }
      if (!s) return;
      if (textMode) {
        const drag = {
          x: Math.min(s.x, p.xPct),
          y: Math.min(s.y, p.yPct),
          w: Math.abs(p.xPct - s.x),
          h: Math.abs(p.yPct - s.y),
        };
        setDraftBox(null);
        // Drag → use the box you drew; tap (tiny) → a default box at the tap,
        // clamped to stay on the page.
        const custom = drag.w >= MIN_DRAG_FRAC && drag.h >= MIN_DRAG_FRAC;
        const bw = custom ? drag.w : DEFAULT_TEXT_W;
        const bh = custom ? drag.h : DEFAULT_TEXT_H;
        const bx = custom ? drag.x : Math.min(s.x, Math.max(0, 1 - bw));
        const by = custom ? drag.y : Math.min(s.y, Math.max(0, 1 - bh));
        if (pageHeightPt > 0) openNewText(bx, by, Math.min(bw, 1 - bx), Math.min(bh, 1 - by));
        return;
      }
      if (boxMode) {
        const box = {
          x: Math.min(s.x, p.xPct),
          y: Math.min(s.y, p.yPct),
          w: Math.abs(p.xPct - s.x),
          h: Math.abs(p.yPct - s.y),
        };
        setDraftBox(null);
        if (box.w > 0.01 && box.h > 0.01) {
          const id = addObject({
            kind: "annotation",
            pageIndex: selectedPage,
            payload: {
              kind: mode === "ellipse" ? "ellipse" : "rect",
              pageIndex: selectedPage,
              ...box,
              color,
              thicknessFrac: SHAPE_THICK,
              ...(fill ? { fill } : {}),
            },
          });
          if (id) patchToolState(TOOL_ID, { mode: "select", selectedId: id });
        }
      } else if (lineMode) {
        const line = { x1: s.x, y1: s.y, x2: p.xPct, y2: p.yPct };
        setDraftLine(null);
        if (Math.hypot(line.x2 - line.x1, line.y2 - line.y1) > 0.01) {
          const id = addObject({
            kind: "annotation",
            pageIndex: selectedPage,
            payload: {
              kind: mode === "arrow" ? "arrow" : "line",
              pageIndex: selectedPage,
              ...line,
              color,
              thicknessFrac: SHAPE_THICK,
            },
          });
          if (id) patchToolState(TOOL_ID, { mode: "select", selectedId: id });
        }
      } else {
        // Read the authoritative point list from the ref (the rAF-flushed state
        // can lag by a frame); cancel any pending flush before committing.
        flushPenFrame();
        const points = penBufferRef.current;
        penBufferRef.current = [];
        setDraftPoints(null);
        if (points.length >= 2) {
          const id = addObject({
            kind: "annotation",
            pageIndex: selectedPage,
            payload: {
              kind: "stroke",
              pageIndex: selectedPage,
              points,
              color,
              thicknessFrac: strokeThick,
              opacity: strokeOpacity,
            },
          });
          if (id) patchToolState(TOOL_ID, { mode: "select", selectedId: id });
        }
      }
    },
    [
      selectMode,
      boxMode,
      lineMode,
      textMode,
      mode,
      color,
      fill,
      strokeThick,
      strokeOpacity,
      selectedPage,
      addObject,
      moveObject,
      patchToolState,
      flushPenFrame,
      doc,
      pageHeightPt,
      openNewText,
      openEditText,
    ],
  );

  const onPointerCancel = useCallback(() => {
    startRef.current = null;
    dragStartRef.current = null;
    resizeStartRef.current = null;
    flushPenFrame();
    penBufferRef.current = [];
    setDragGeom(null);
    setResizeGeom(null);
    setDraftBox(null);
    setDraftLine(null);
    setDraftPoints(null);
  }, [flushPenFrame]);

  useStageProps({
    cursor: textMode
      ? "crosshair"
      : selectMode
        ? hoverHandle
          ? HANDLE_CURSOR[hoverHandle]
          : "default"
        : "crosshair",
    paintOverlay,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  });

  return null;
}

const MODES: { id: Mode; label: string; icon: typeof Pen }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "pen", label: "Pen", icon: Pen },
  { id: "highlight", label: "Highlight", icon: Highlighter },
  { id: "line", label: "Line", icon: Minus },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight },
  { id: "rect", label: "Rectangle", icon: Square },
  { id: "ellipse", label: "Oval", icon: Circle },
  { id: "text", label: "Text", icon: Type },
];

/** A square Bold / Italic toggle, matching the selected-look used across pickers. */
function StyleToggle({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: typeof Bold;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        active
          ? "border-primary-600 bg-primary-600 text-white"
          : "border-slate-200 dark:border-dark-border text-slate-600 dark:text-dark-text-muted hover:bg-slate-50 dark:hover:bg-dark-surface-alt"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/** Family select + Bold/Italic toggles in one row, Word-style. */
function FontControls({
  family,
  bold,
  italic,
  onChange,
}: {
  family: FontFamily;
  bold: boolean;
  italic: boolean;
  onChange: (patch: { family?: FontFamily; bold?: boolean; italic?: boolean }) => void;
}) {
  return (
    <Labeled label="Font">
      <div className="flex items-center gap-1.5">
        <div className="min-w-0 flex-1">
          <Select
            value={family}
            onChange={(f) => onChange({ family: f })}
            ariaLabel="Font family"
            options={FAMILIES.map((f) => ({
              value: f,
              label: <span style={{ fontFamily: FAMILY_CSS[f] }}>{FAMILY_LABEL[f]}</span>,
              searchText: FAMILY_LABEL[f],
            }))}
          />
        </div>
        <StyleToggle
          active={bold}
          onClick={() => onChange({ bold: !bold })}
          label="Bold"
          icon={Bold}
        />
        <StyleToggle
          active={italic}
          onClick={() => onChange({ italic: !italic })}
          label="Italic"
          icon={Italic}
        />
      </div>
    </Labeled>
  );
}

export function Panel() {
  const { doc } = useEditorRead();
  const { patchToolState, updateObject, commit, removeObject, applyTransform } = useEditorActions();
  const setInlineEditor = useInlineEditor();
  const slice = useToolSlice(TOOL_ID);
  const mode = (slice.mode as Mode) ?? "select";
  const colorHex = (slice.colorHex as string) ?? DEFAULT_HEX;
  const fillEnabled = (slice.fillEnabled as boolean) ?? false;
  const fillHex = (slice.fillHex as string) ?? DEFAULT_FILL_HEX;
  const fillOpacity = (slice.fillOpacity as number) ?? 0.3;
  const selectedId = slice.selectedId as string | undefined;
  const textFamily = (slice.textFamily as FontFamily) ?? "helvetica";
  const textBold = (slice.textBold as boolean) ?? false;
  const textItalic = (slice.textItalic as boolean) ?? false;
  const textSizePt = (slice.textSizePt as number) ?? DEFAULT_TEXT_PT;
  const bgEnabled = (slice.bgEnabled as boolean) ?? false;
  const bgHex = (slice.bgHex as string) ?? DEFAULT_BG_HEX;
  const bgOpacity = (slice.bgOpacity as number) ?? 1;
  const sizeHint = slice.sizeHint as string | undefined;

  const objects = doc?.objects ?? [];
  const count = objects.filter((o) => o.kind === "annotation").length;
  const selObj = selectedId ? objects.find((o) => o.id === selectedId) : undefined;
  const selAnn = selObj?.payload as Annotation | undefined;
  const isTextSel = selAnn?.kind === "text";
  const selPageHeightPt = selObj ? (doc?.pages[selObj.pageIndex]?.heightPt ?? 0) : 0;

  // Coalesce live object edits into one undo step (a slider drag = one entry).
  const commitTimer = useRef<number | null>(null);
  const scheduleCommit = useCallback(
    (label: string) => {
      if (commitTimer.current) clearTimeout(commitTimer.current);
      commitTimer.current = window.setTimeout(() => {
        commit(label);
        commitTimer.current = null;
      }, 400);
    },
    [commit],
  );
  useEffect(
    () => () => {
      if (commitTimer.current) {
        clearTimeout(commitTimer.current);
        commit("Edit annotation");
      }
    },
    [commit],
  );

  // Apply current text-style slice values to the selected text object, live.
  const applyTextToSelected = useCallback(
    (next: {
      family: FontFamily;
      bold: boolean;
      italic: boolean;
      sizePt: number;
      colorHex: string;
      bgEnabled: boolean;
      bgHex: string;
      bgOpacity: number;
    }) => {
      if (!selObj || selAnn?.kind !== "text" || selPageHeightPt <= 0) return;
      const payload: TextAnnotation = {
        ...selAnn,
        font: resolveFont(next.family, next.bold, next.italic),
        sizeFrac: next.sizePt / selPageHeightPt,
        color: hexToRgb(next.colorHex),
        bg: next.bgEnabled ? { color: hexToRgb(next.bgHex), opacity: next.bgOpacity } : undefined,
      };
      updateObject(selObj.id, { payload });
      scheduleCommit("Edit text style");
    },
    [selObj, selAnn, selPageHeightPt, updateObject, scheduleCommit],
  );

  // A text-style change: write the slice (placement default + mirror) and, when
  // a text label is selected, the object too.
  const onTextChange = useCallback(
    (
      patch: Partial<{
        family: FontFamily;
        bold: boolean;
        italic: boolean;
        sizePt: number;
        colorHex: string;
        bgEnabled: boolean;
        bgHex: string;
        bgOpacity: number;
      }>,
    ) => {
      const merged = {
        family: textFamily,
        bold: textBold,
        italic: textItalic,
        sizePt: textSizePt,
        colorHex,
        bgEnabled,
        bgHex,
        bgOpacity,
        ...patch,
      };
      patchToolState(TOOL_ID, {
        textFamily: merged.family,
        textBold: merged.bold,
        textItalic: merged.italic,
        textSizePt: merged.sizePt,
        colorHex: merged.colorHex,
        bgEnabled: merged.bgEnabled,
        bgHex: merged.bgHex,
        bgOpacity: merged.bgOpacity,
        sizeHint: undefined,
      });
      if (isTextSel) applyTextToSelected(merged);
    },
    [
      textFamily,
      textBold,
      textItalic,
      textSizePt,
      colorHex,
      bgEnabled,
      bgHex,
      bgOpacity,
      isTextSel,
      applyTextToSelected,
      patchToolState,
    ],
  );

  // Stroke colour of a selected non-text mark.
  const onShapeColor = useCallback(
    (hex: string) => {
      patchToolState(TOOL_ID, { colorHex: hex });
      if (selObj && selAnn && selAnn.kind !== "text") {
        updateObject(selObj.id, { payload: { ...selAnn, color: hexToRgb(hex) } });
        scheduleCommit("Edit colour");
      }
    },
    [selObj, selAnn, updateObject, scheduleCommit, patchToolState],
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    removeObject(selectedId);
    patchToolState(TOOL_ID, { selectedId: undefined });
  }, [selectedId, removeObject, patchToolState]);

  const apply = useCallback(() => {
    // Tear down selection + any open editor BEFORE the burn drops all marks, so
    // a stale id can't linger and an open editor can't re-add a mark afterward.
    setInlineEditor(null);
    patchToolState(TOOL_ID, { selectedId: undefined });
    void applyTransform(async (d) => {
      const anns = d.objects
        .filter((o) => o.kind === "annotation" && o.payload)
        .map((o) => o.payload as Annotation);
      const bytes = await annotatePdf(docToFile(d), anns);
      return {
        bytes,
        label: `Annotate ${anns.length}`,
        objects: d.objects.filter((o) => o.kind !== "annotation"),
      };
    });
  }, [applyTransform, setInlineEditor, patchToolState]);

  const showFill = isFillable(mode);
  // Text controls show when placing text OR a text label is selected.
  const showText = mode === "text" || isTextSel;
  const showShapeColor = !showText;

  return (
    <div className="flex flex-col gap-4">
      <Labeled label="Tool">
        <div className="grid grid-cols-3 gap-1.5">
          {MODES.map((m) => {
            const Icon = m.icon;
            const on = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() =>
                  patchToolState(TOOL_ID, {
                    mode: m.id,
                    ...(m.id === "select" ? {} : { selectedId: undefined }),
                  })
                }
                aria-pressed={on}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  on
                    ? "border-primary-600 bg-primary-600 text-white"
                    : "border-slate-200 dark:border-dark-border text-slate-600 dark:text-dark-text-muted hover:bg-slate-50 dark:hover:bg-dark-surface-alt"
                }`}
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </button>
            );
          })}
        </div>
      </Labeled>

      {selObj && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-primary-200 dark:border-primary-900/50 bg-primary-50/60 dark:bg-primary-900/20 px-3 py-2">
          <span className="text-xs font-medium text-primary-800 dark:text-primary-200">
            {isTextSel ? "Text label selected" : "Mark selected"}
          </span>
          <button
            type="button"
            onClick={deleteSelected}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      )}

      {showText ? (
        <>
          <FontControls
            family={textFamily}
            bold={textBold}
            italic={textItalic}
            onChange={(patch) => onTextChange(patch)}
          />
          <RangeField
            label="Text size"
            value={textSizePt}
            min={8}
            max={72}
            suffix=" pt"
            onChange={(v) => onTextChange({ sizePt: v })}
          />
          {sizeHint && !isTextSel && (
            <p className="-mt-2 text-xs text-primary-600 dark:text-primary-400">{sizeHint}</p>
          )}
          <Labeled label="Text colour">
            <ColorPicker value={colorHex} onChange={(hex) => onTextChange({ colorHex: hex })} />
          </Labeled>
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-dark-border p-3">
            <Toggle
              label="Background"
              checked={bgEnabled}
              onChange={(v) => onTextChange({ bgEnabled: v })}
            />
            {bgEnabled && (
              <>
                <Labeled label="Background colour">
                  <ColorPicker value={bgHex} onChange={(hex) => onTextChange({ bgHex: hex })} />
                </Labeled>
                <RangeField
                  label="Background opacity"
                  value={Math.round(bgOpacity * 100)}
                  min={10}
                  max={100}
                  suffix="%"
                  onChange={(v) => onTextChange({ bgOpacity: v / 100 })}
                />
              </>
            )}
          </div>
        </>
      ) : (
        showShapeColor && (
          <>
            <Labeled label={showFill ? "Stroke" : "Colour"}>
              <ColorPicker value={colorHex} onChange={onShapeColor} />
            </Labeled>
            {showFill && !selObj && (
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-dark-border p-3">
                <Toggle
                  label="Fill shape"
                  checked={fillEnabled}
                  onChange={(v) => patchToolState(TOOL_ID, { fillEnabled: v })}
                />
                {fillEnabled && (
                  <>
                    <Labeled label="Fill">
                      <ColorPicker
                        value={fillHex}
                        onChange={(hex) => patchToolState(TOOL_ID, { fillHex: hex })}
                      />
                    </Labeled>
                    <RangeField
                      label="Fill opacity"
                      value={Math.round(fillOpacity * 100)}
                      min={10}
                      max={100}
                      suffix="%"
                      onChange={(v) => patchToolState(TOOL_ID, { fillOpacity: v / 100 })}
                    />
                  </>
                )}
              </div>
            )}
          </>
        )
      )}

      <span className="text-sm text-slate-600 dark:text-dark-text-muted">
        {count} mark{count === 1 ? "" : "s"}
      </span>

      <PrimaryAction label="Apply annotations" onApply={apply} disabled={count === 0} />
      <p className="text-xs text-slate-500 dark:text-dark-text-muted">
        {mode === "select"
          ? "Tap a mark to select, drag to move (arrow keys nudge, Shift = bigger step), pull a handle to resize, Delete to remove. Double-click a text box to edit it."
          : mode === "text"
            ? "Drag a box on the page, then type inside it — text wraps to the box. Or tap for a default box. Drag or resize it any time."
            : "Draw on the page; the mark is selected so you can drag or resize it. Page text stays selectable."}
      </p>
    </div>
  );
}
