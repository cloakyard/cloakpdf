// AnnotateTool.tsx — Overlay-object tool. The Stage draws vector marks (pen,
// highlighter, line, arrow, rectangle, oval) plus text labels as `annotation`
// overlay objects in fraction space; the Panel picks the mark, colour, an
// optional shape fill, and — for text — font family + Bold/Italic, size, and an
// optional opaque background.
//
// Interaction model:
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
  Check,
  Circle,
  CircleDot,
  Highlighter,
  Italic,
  Minus,
  MousePointer2,
  Pen,
  Square,
  SquareCheck,
  Trash2,
  Type,
  Underline,
  X,
} from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { canvasAccent } from "../../config/theme.ts";
import { ColorPicker, hexToRgb, rgbToHex } from "../../components/ColorPicker.tsx";
import { Select } from "../../components/Select.tsx";
import type {
  Annotation,
  AnnotationColor,
  FontFamily,
  IconId,
  TextFontId,
} from "../../utils/pdf-operations.ts";
import {
  annotatePdf,
  decomposeTextFont,
  FONT_FAMILIES,
  iconGeometry,
  resolveTextFont,
  TEXT_BG_HEIGHT_EM,
  TEXT_BG_PAD_EM,
  TEXT_LINE_EM,
  UNDERLINE_DROP_EM,
  UNDERLINE_WEIGHT_EM,
  wrapTextToWidth,
} from "../../utils/pdf-operations.ts";
import { extractPageTextGeometry, type LayoutPage } from "../../utils/layout-extract.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";
import {
  type StageKeyboardEvent,
  type StagePoint,
  useInlineEditor,
  useStageProps,
} from "../stage.tsx";
import {
  type Box,
  CORNER_IDS,
  drawSelectionChrome,
  type HandleId,
  HANDLE_CURSOR,
  HANDLE_IDS,
  hitHandle,
  resizeBBox,
  resizeBBoxAspect,
} from "../resize-handles.ts";
import { PrecisionField } from "./PrecisionField.tsx";

const TOOL_ID = "annotate-pdf";
const DEFAULT_HEX = "#1e293b";
const DEFAULT_FILL_HEX = "#2563eb";
const DEFAULT_BG_HEX = "#ffffff";
const DEFAULT_TEXT_PT = 16;

type Mode =
  | "select"
  | "pen"
  | "highlight"
  | "line"
  | "arrow"
  | "rect"
  | "ellipse"
  | "text"
  | "icon";
type TextAnnotation = Extract<Annotation, { kind: "text" }>;

/** Default stamped-icon box, as a fraction of page WIDTH (kept square via the
 *  page aspect at placement). ~5% ≈ a checkbox-sized tick on a Letter page. */
const ICON_DEFAULT_W = 0.05;
/** The form-glyph palette shown when the Icon tool is armed. */
const ICON_CHOICES: { id: IconId; label: string; icon: typeof Check }[] = [
  { id: "check", label: "Tick", icon: Check },
  { id: "cross", label: "Cross", icon: X },
  { id: "dot", label: "Filled dot", icon: CircleDot },
  { id: "circle", label: "Circle", icon: Circle },
];

const PEN_THICK = 0.0035;
const HIGHLIGHT_THICK = 0.022;
const SHAPE_THICK = 0.004;
/** Default text box (page fractions) when the text tool is tapped rather than
 *  dragged — a sensible starting region the user can then resize. */
const DEFAULT_TEXT_W = 0.34;
const DEFAULT_TEXT_H = 0.1;
/** Smallest box a drag must cover to count as a custom region (else a tap). */
const MIN_DRAG_FRAC = 0.02;
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

// Font picker data, derived from the single FONT_FAMILIES registry in annotate.ts
// so the UI, the on-canvas preview, and the PDF burn can never disagree. Each
// family's CSS stack mirrors what gets embedded; the @font-face that backs an
// embedded family is declared in src/fonts.css.
const FAMILY_CSS = Object.fromEntries(FONT_FAMILIES.map((f) => [f.id, f.cssStack])) as Record<
  FontFamily,
  string
>;
const FAMILY_LABEL = Object.fromEntries(FONT_FAMILIES.map((f) => [f.id, f.label])) as Record<
  FontFamily,
  string
>;
/** Whether a family ships italic variants (false → Italic toggle is a no-op). */
const FAMILY_HAS_ITALIC = Object.fromEntries(
  FONT_FAMILIES.map((f) => [f.id, f.hasItalic]),
) as Record<FontFamily, boolean>;
const FAMILIES: FontFamily[] = FONT_FAMILIES.map((f) => f.id);

// Font id ↔ (family, bold, italic) resolution lives with the font model in
// annotate.ts so the burn path and this UI agree (and it's unit-tested there).
const resolveFont = resolveTextFont;
const decomposeFont = decomposeTextFont;

/** Canvas `font` string for a label — italic prefix, weight, px size, css stack.
 *  Shared by the overlay painter and the hit-test text measurer so the clickable
 *  box matches what's drawn (and burned). */
function cssFont(id: TextFontId | undefined, sizePx: number): string {
  const { family, bold, italic } = decomposeFont(id ?? "helvetica");
  // Only synthesize italic when the family actually ships one — otherwise the
  // browser fakes an oblique that the PDF burn can't (it falls back to upright),
  // which would break WYSIWYG for e.g. an old `oswald-italic` draft.
  const useItalic = italic && FAMILY_HAS_ITALIC[family];
  return `${useItalic ? "italic " : ""}${bold ? 700 : 400} ${sizePx}px ${FAMILY_CSS[family]}`;
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
    case "icon":
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
    a.kind === "rect" ||
    a.kind === "ellipse" ||
    a.kind === "icon" ||
    (a.kind === "text" && a.w != null && a.h != null)
  );
}

/** Write a new bbox back onto a resizable mark (rect/ellipse/icon/box-text). */
function applyBBox(a: Annotation, b: { x: number; y: number; w: number; h: number }): Annotation {
  if (a.kind === "rect" || a.kind === "ellipse" || a.kind === "text" || a.kind === "icon") {
    return { ...a, x: b.x, y: b.y, w: b.w, h: b.h };
  }
  return a;
}

/** Icons are aspect-true (a square glyph) → corner-only handles + aspect-locked
 *  resize, exactly like a placed signature/QR stamp, so they never distort. Every
 *  other resizable mark uses the full eight-handle free resize. */
const handlesFor = (a: Annotation): HandleId[] => (a.kind === "icon" ? CORNER_IDS : HANDLE_IDS);
function resizeAnnBBox(orig: Box, handle: HandleId, dx: number, dy: number, a: Annotation): Box {
  if (a.kind === "icon") {
    return resizeBBoxAspect(orig, handle, dx, dy, orig.h > 0 ? orig.w / orig.h : 1);
  }
  return resizeBBox(orig, handle, dx, dy);
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
    case "icon":
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

/** Paint a stamped form glyph into the largest centred square of its box, from
 *  the shared unit-square geometry — the same description the pdf-lib burn uses,
 *  so the preview matches the output. */
function drawIconGlyph(
  ctx: CanvasRenderingContext2D,
  a: Extract<Annotation, { kind: "icon" }>,
  w: number,
  h: number,
) {
  const bx = a.x * w;
  const by = a.y * h;
  const bw = a.w * w;
  const bh = a.h * h;
  const s = Math.min(bw, bh);
  const ox = bx + (bw - s) / 2;
  const oy = by + (bh - s) / 2;
  const ux = (u: number) => ox + u * s;
  const uy = (v: number) => oy + v * s;
  const g = iconGeometry(a.icon);
  const col = fillStyle(a.color);
  ctx.save();
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1.5, g.weight * s);
  for (const stroke of g.strokes) {
    ctx.beginPath();
    stroke.forEach((p, i) => (i ? ctx.lineTo(ux(p.x), uy(p.y)) : ctx.moveTo(ux(p.x), uy(p.y))));
    ctx.stroke();
  }
  if (g.disc) {
    ctx.beginPath();
    ctx.arc(ux(g.disc.cx), uy(g.disc.cy), g.disc.r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  if (g.ring) {
    ctx.beginPath();
    ctx.arc(ux(g.ring.cx), uy(g.ring.cy), g.ring.r * s, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
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
        if (!ln) return;
        const bx = a.x * w + padX;
        const by = a.y * h + size + i * lineH;
        ctx.fillText(ln, bx, by);
        if (a.underline)
          ctx.fillRect(
            bx,
            by + size * UNDERLINE_DROP_EM,
            ctx.measureText(ln).width,
            Math.max(0.5, size * UNDERLINE_WEIGHT_EM),
          );
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
      const by = a.y * h + size;
      ctx.fillText(a.text, a.x * w, by);
      if (a.underline)
        ctx.fillRect(
          a.x * w,
          by + size * UNDERLINE_DROP_EM,
          ctx.measureText(a.text).width,
          Math.max(0.5, size * UNDERLINE_WEIGHT_EM),
        );
    }
    ctx.restore();
  } else if (a.kind === "icon") {
    drawIconGlyph(ctx, a, w, h);
  }
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
  const { addObject, moveObject, updateObject, removeObject, patchToolState } = useEditorActions();
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
  const textUnderline = (slice.textUnderline as boolean) ?? false;
  const textSizePt = (slice.textSizePt as number) ?? DEFAULT_TEXT_PT;
  const bgEnabled = (slice.bgEnabled as boolean) ?? false;
  const bgHex = (slice.bgHex as string) ?? DEFAULT_BG_HEX;
  const bgOpacity = (slice.bgOpacity as number) ?? 1;
  const iconId = (slice.iconId as IconId) ?? "check";

  const color = useMemo(() => hexToRgb(colorHex), [colorHex]);
  const fillColor = useMemo(() => hexToRgb(fillHex), [fillHex]);
  const bgColor = useMemo(() => hexToRgb(bgHex), [bgHex]);
  const pageWidthPt = doc?.pages[selectedPage]?.widthPt ?? 0;
  const pageHeightPt = doc?.pages[selectedPage]?.heightPt ?? 0;

  // Latch the live doc so stable handlers/effects read the freshest objects.
  const docRef = useRef(doc);
  docRef.current = doc;
  const textSizePtRef = useRef(textSizePt);
  textSizePtRef.current = textSizePt;

  // Embedded fonts paint on the overlay canvas only once their FontFace has
  // loaded (the inline-edit textarea auto-loads via @font-face; the canvas can't
  // wait, so it'd fall back). Load the faces every placed text label needs (plus
  // the current placement font), and bump `fontTick` to repaint when one lands.
  const [fontTick, setFontTick] = useState(0);
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    const ids = new Set<string>();
    for (const o of doc?.objects ?? []) {
      const ann = o.kind === "annotation" ? (o.payload as Annotation | undefined) : undefined;
      if (ann?.kind === "text" && ann.font) ids.add(ann.font);
    }
    ids.add(resolveFont(textFamily, textBold, textItalic));
    let cancelled = false;
    for (const id of ids) {
      const f = cssFont(id as TextFontId, 16);
      if (document.fonts.check(f)) continue;
      document.fonts
        .load(f)
        .then(() => {
          if (!cancelled) setFontTick((t) => t + 1);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [doc, textFamily, textBold, textItalic]);

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
  const iconMode = mode === "icon";

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
      if (ph <= 0) return;
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
      fontStyle: textItalic && FAMILY_HAS_ITALIC[textFamily] ? "italic" : "normal",
      textDecoration: textUnderline ? "underline" : "none",
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
              ...(textUnderline ? { underline: true } : {}),
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
    textUnderline,
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
  }, [selectedPage]);
  useEffect(() => {
    if (
      selectedId &&
      !doc?.objects.some((o) => o.id === selectedId && o.pageIndex === selectedPage)
    )
      patchToolState(TOOL_ID, { selectedId: undefined });
  }, [doc, selectedId, selectedPage, patchToolState]);

  // Keep inline text editing aligned with the selected object, including Undo.
  const selectedObject = doc?.objects.find((o) => o.id === selectedId);
  useEffect(() => {
    const obj = selectedObject;
    const ann = obj?.payload as Annotation | undefined;
    if (!obj || ann?.kind !== "text") return;
    const ph = docRef.current?.pages[obj.pageIndex]?.heightPt ?? 0;
    const { family, bold, italic } = decomposeFont(ann.font ?? "helvetica");
    patchToolState(TOOL_ID, {
      textFamily: family,
      textBold: bold,
      textItalic: italic,
      textUnderline: !!ann.underline,
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
  }, [selectedObject, patchToolState]);

  // Keyboard on the selected mark: Delete/Backspace removes it; arrow keys nudge
  // it for precise placement (Shift = bigger step). PdfStage calls this only
  // while its focusable canvas region owns the event, then consumes handled keys
  // before viewport panning. Arrow nudges coalesce into one undo step (a burst
  // commits once the keys go idle, and on selection/tool teardown).
  const nudgeTimerRef = useRef<number | null>(null);
  const pendingNudge = useRef<(() => void) | null>(null);
  const flushNudge = useCallback(() => {
    if (nudgeTimerRef.current == null) return;
    clearTimeout(nudgeTimerRef.current);
    nudgeTimerRef.current = null;
    pendingNudge.current?.();
    pendingNudge.current = null;
  }, []);
  useEffect(() => () => flushNudge(), [selectedId, flushNudge]);

  const onStageKeyDown = useCallback(
    (e: StageKeyboardEvent): boolean => {
      if (!selectedId) return false;
      const isDelete = e.key === "Delete" || e.key === "Backspace";
      const dir = ARROW_DIRS[e.key];
      if (!isDelete && !dir) return false;

      const obj = docRef.current?.objects.find((o) => o.id === selectedId);
      if (!obj || obj.pageIndex !== selectedPage || !obj.payload) return false;
      if (isDelete) {
        if (nudgeTimerRef.current != null) {
          clearTimeout(nudgeTimerRef.current);
          nudgeTimerRef.current = null;
        }
        removeObject(selectedId);
        patchToolState(TOOL_ID, { selectedId: undefined });
        return true;
      }

      const { w, h } = paintWHRef.current;
      // A selected annotation owns Arrow keys even during the first paint. If
      // geometry is not ready (or the mark is clamped at an edge), consume the
      // key without unexpectedly panning the document underneath it.
      if (!w || !h || !dir) return true;
      const step = e.shiftKey ? 10 : 1; // on-screen px
      const ann = obj.payload as Annotation;
      const { dx, dy } = clampDelta(
        annotationBBox(ann, w, h),
        (dir[0] * step) / w,
        (dir[1] * step) / h,
      );
      if (dx === 0 && dy === 0) return true;
      // Live, history-free move; the burst commits once via the debounce below.
      const payload = translateAnnotation(ann, dx, dy);
      updateObject(selectedId, { payload });
      pendingNudge.current = () => moveObject(selectedId, { payload }, "Move annotation", payload);
      if (nudgeTimerRef.current != null) clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = window.setTimeout(flushNudge, 350);
      return true;
    },
    [selectedId, selectedPage, removeObject, updateObject, moveObject, flushNudge, patchToolState],
  );

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
          ctx.strokeStyle = canvasAccent(ctx);
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
        drawSelectionChrome(ctx, annotationBBox(live, w, h), w, h, {
          handles: isResizable(live) ? handlesFor(live) : [],
        });
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
      fontTick,
    ],
  );

  const onPointerDown = useCallback(
    (p: StagePoint, e: ReactPointerEvent<HTMLElement>) => {
      startRef.current = { x: p.xPct, y: p.yPct };
      // Select AND Icon mode share the interactive path: a handle starts a
      // resize, a hit starts a drag. They differ only on a miss — Select just
      // deselects; Icon stamps a new glyph on the tap-up (handled in onPointerUp),
      // so an icon can be placed, then immediately moved or resized like a
      // signature/QR stamp, all without leaving the tool.
      if (selectMode || iconMode) {
        const { w, h } = paintWHRef.current;
        // A handle of the currently-selected resizable mark wins over hit-testing
        // other marks underneath — start a resize.
        const selObj = doc?.objects.find((o) => o.id === selectedId);
        const selAnn = selObj?.payload as Annotation | undefined;
        if (selObj && selObj.pageIndex === selectedPage && selAnn && isResizable(selAnn)) {
          const bbox = annotationBBox(selAnn, w, h);
          const handle = hitHandle(
            bbox,
            p.xPct * w,
            p.yPct * h,
            w,
            h,
            handlesFor(selAnn),
            e.pointerType === "touch" ? 22 : undefined,
          );
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
          // In Icon mode only existing icons are grabbable, so a tap on empty
          // page (or over other marks) still stamps a new glyph.
          if (
            o.kind === "annotation" &&
            o.pageIndex === selectedPage &&
            o.payload &&
            (selectMode || (o.payload as Annotation).kind === "icon") &&
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
    [
      selectMode,
      boxMode,
      lineMode,
      textMode,
      iconMode,
      doc,
      selectedPage,
      selectedId,
      patchToolState,
    ],
  );

  const onPointerMove = useCallback(
    (p: StagePoint) => {
      if (selectMode || iconMode) {
        const { w, h } = paintWHRef.current;
        const rs = resizeStartRef.current;
        if (rs) {
          const nb = resizeAnnBBox(rs.bbox, rs.handle, p.xPct - rs.sx, p.yPct - rs.sy, rs.orig);
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
              ? hitHandle(
                  annotationBBox(selAnn, w, h),
                  p.xPct * w,
                  p.yPct * h,
                  w,
                  h,
                  handlesFor(selAnn),
                )
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
    [selectMode, boxMode, lineMode, textMode, iconMode, doc, selectedId, selectedPage],
  );

  const onPointerUp = useCallback(
    (p: StagePoint, e: { timeStamp: number }) => {
      const s = startRef.current;
      startRef.current = null;
      if (selectMode || iconMode) {
        const rs = resizeStartRef.current;
        if (rs) {
          resizeStartRef.current = null;
          setResizeGeom(null);
          const nb = resizeAnnBBox(rs.bbox, rs.handle, p.xPct - rs.sx, p.yPct - rs.sy, rs.orig);
          moveObject(rs.id, { payload: applyBBox(rs.orig, nb) }, "Resize annotation");
          return;
        }
        const ds = dragStartRef.current;
        dragStartRef.current = null;
        setDragGeom(null);
        if (!ds) {
          // Nothing was grabbed. In Icon mode that's a tap on empty page → stamp
          // a new glyph (sized square via the page aspect), staying armed so a
          // form's many ticks go down one tap each. It is NOT auto-selected: tap
          // it again to select/move/resize it.
          if (iconMode && s) {
            const aspect = pageWidthPt > 0 && pageHeightPt > 0 ? pageWidthPt / pageHeightPt : 1;
            const wPct = ICON_DEFAULT_W;
            const hPct = wPct * aspect;
            const x = Math.min(Math.max(0, p.xPct - wPct / 2), Math.max(0, 1 - wPct));
            const y = Math.min(Math.max(0, p.yPct - hPct / 2), Math.max(0, 1 - hPct));
            addObject({
              kind: "annotation",
              pageIndex: selectedPage,
              payload: {
                kind: "icon",
                icon: iconId,
                pageIndex: selectedPage,
                x,
                y,
                w: wPct,
                h: hPct,
                color,
              },
            });
          }
          return;
        }
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
      iconMode,
      iconId,
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
      pageWidthPt,
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
    // Over a selected mark's resize handle → directional cursor (Select + Icon).
    // Otherwise: Select rests at default; Icon shows "copy" (tap to drop a stamp,
    // like signature/QR); the drawing tools show a crosshair.
    cursor: hoverHandle
      ? HANDLE_CURSOR[hoverHandle]
      : selectMode
        ? "default"
        : iconMode
          ? "copy"
          : "crosshair",
    paintOverlay,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onKeyDown: selectedId ? onStageKeyDown : undefined,
    keyboardHelp: selectedId
      ? "An annotation is selected. Use arrow keys to move it, Shift plus arrow keys to move it farther, and Delete or Backspace to remove it."
      : undefined,
    keyboardShortcuts: selectedId ? "Delete Backspace" : undefined,
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
  { id: "icon", label: "Icons", icon: SquareCheck },
];

const TEXT_STYLES = [
  { key: "bold", label: "Bold", icon: Bold },
  { key: "italic", label: "Italic", icon: Italic },
  { key: "underline", label: "Underline", icon: Underline },
] as const;
type NumberKey = "sizePt" | "bgOpacity" | "fillOpacity";
type NumberDraft = { raw: string; value: number; touched?: boolean };

export function Panel() {
  const { doc, selectedPage, busyLabel } = useEditorRead();
  const {
    patchToolState,
    updateObject,
    moveObject,
    removeObject,
    applyTransform,
    setSelectedPage,
  } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const mode = (slice.mode as Mode) ?? "select";
  const selectedId = slice.selectedId as string | undefined;
  const objects = (doc?.objects ?? []).filter((o) => o.kind === "annotation");
  const selected = objects.find((o) => o.id === selectedId && o.pageIndex === selectedPage);
  const ann = selected?.payload as Annotation | undefined;
  const text = ann?.kind === "text" ? ann : undefined;
  const shape = ann?.kind === "rect" || ann?.kind === "ellipse" ? ann : undefined;
  const font = text
    ? decomposeFont(text.font ?? "helvetica")
    : {
        family: (slice.textFamily as FontFamily) ?? "helvetica",
        bold: (slice.textBold as boolean) ?? false,
        italic: (slice.textItalic as boolean) ?? false,
      };
  const textStyle = {
    ...font,
    underline: text ? !!text.underline : ((slice.textUnderline as boolean) ?? false),
    sizePt:
      text && selected
        ? Math.round(text.sizeFrac * (doc?.pages[selected.pageIndex]?.heightPt ?? 0))
        : ((slice.textSizePt as number) ?? DEFAULT_TEXT_PT),
    colorHex: ann
      ? rgbToHex(ann.color.r, ann.color.g, ann.color.b)
      : ((slice.colorHex as string) ?? DEFAULT_HEX),
    bgEnabled: text ? !!text.bg : ((slice.bgEnabled as boolean) ?? false),
    bgHex: text?.bg
      ? rgbToHex(text.bg.color.r, text.bg.color.g, text.bg.color.b)
      : ((slice.bgHex as string) ?? DEFAULT_BG_HEX),
    bgOpacity: text?.bg ? (text.bg.opacity ?? 1) : ((slice.bgOpacity as number) ?? 1),
  };
  const fill = {
    enabled: shape ? !!shape.fill : ((slice.fillEnabled as boolean) ?? false),
    hex: shape?.fill
      ? rgbToHex(shape.fill.color.r, shape.fill.color.g, shape.fill.color.b)
      : ((slice.fillHex as string) ?? DEFAULT_FILL_HEX),
    opacity: shape?.fill ? (shape.fill.opacity ?? 1) : ((slice.fillOpacity as number) ?? 0.3),
  };
  const busy = busyLabel !== null;
  const showText = !!text || mode === "text";
  const showFill = !!shape || isFillable(mode);
  const showIcons = ann?.kind === "icon" || mode === "icon";
  const selectRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | null>(null);
  const pending = useRef<(() => void) | null>(null);
  const flush = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    const edit = pending.current;
    pending.current = null;
    edit?.();
  }, []);
  useEffect(() => () => flush(), [selectedId, flush]);
  const editSelected = (payload: Annotation, label: string) => {
    if (!selected || busy) return;
    updateObject(selected.id, { payload });
    pending.current = () => moveObject(selected.id, { payload }, label, payload);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 400);
  };
  const onTextChange = (patch: Partial<typeof textStyle>) => {
    const next = { ...textStyle, ...patch };
    patchToolState(TOOL_ID, {
      textFamily: next.family,
      textBold: next.bold,
      textItalic: next.italic,
      textUnderline: next.underline,
      textSizePt: next.sizePt,
      colorHex: next.colorHex,
      bgEnabled: next.bgEnabled,
      bgHex: next.bgHex,
      bgOpacity: next.bgOpacity,
      sizeHint: undefined,
    });
    const height = selected ? doc?.pages[selected.pageIndex]?.heightPt : 0;
    if (text && height)
      editSelected(
        {
          ...text,
          font: resolveFont(next.family, next.bold, next.italic),
          underline: next.underline,
          sizeFrac: next.sizePt / height,
          color: hexToRgb(next.colorHex),
          bg: next.bgEnabled ? { color: hexToRgb(next.bgHex), opacity: next.bgOpacity } : undefined,
        },
        "Edit text style",
      );
  };
  const onFillChange = (patch: Partial<typeof fill>) => {
    const next = { ...fill, ...patch };
    patchToolState(TOOL_ID, {
      fillEnabled: next.enabled,
      fillHex: next.hex,
      fillOpacity: next.opacity,
    });
    if (shape)
      editSelected(
        {
          ...shape,
          fill: next.enabled ? { color: hexToRgb(next.hex), opacity: next.opacity } : undefined,
        },
        "Edit shape fill",
      );
  };
  // Raw invalid entry survives panel/layout changes, but never replaces valid ink.
  // A different selection or Undo uses that object's own committed value.
  const owner = selected?.id ?? "new";
  const numbers =
    slice.numberOwner === owner
      ? ((slice.numbers as Partial<Record<NumberKey, NumberDraft>>) ?? {})
      : {};
  const numeric = (
    key: NumberKey,
    label: string,
    value: number,
    min: number,
    max: number,
    unit: string,
    change: (v: number) => void,
  ) => {
    const draft = numbers[key]?.value === value ? numbers[key] : undefined;
    const raw = draft?.raw ?? String(value);
    const valid =
      raw.trim() !== "" &&
      Number.isInteger(Number(raw)) &&
      Number(raw) >= min &&
      Number(raw) <= max;
    return {
      valid,
      control: (
        <PrecisionField
          key={key}
          id={`annotate-${key}`}
          label={label}
          unit={unit}
          min={min}
          max={max}
          raw={raw}
          value={value}
          error={
            !valid && draft?.touched ? `Enter a whole number from ${min} to ${max}.` : undefined
          }
          onChange={(raw) => {
            const n = Number(raw);
            const ok = raw.trim() !== "" && Number.isInteger(n) && n >= min && n <= max;
            patchToolState(TOOL_ID, {
              numberOwner: owner,
              numbers: {
                ...numbers,
                [key]: { raw, value: ok ? n : value, touched: draft?.touched },
              },
            });
            if (ok) change(n);
          }}
          onBlur={() =>
            patchToolState(TOOL_ID, {
              numberOwner: owner,
              numbers: { ...numbers, [key]: { raw, value, touched: true } },
            })
          }
        />
      ),
    };
  };
  const size = numeric("sizePt", "Text size", textStyle.sizePt, 5, 96, "pt", (v) =>
    onTextChange({ sizePt: v }),
  );
  const background = numeric(
    "bgOpacity",
    "Background opacity",
    Math.round(textStyle.bgOpacity * 100),
    0,
    100,
    "%",
    (v) => onTextChange({ bgOpacity: v / 100 }),
  );
  const opacity = numeric(
    "fillOpacity",
    "Fill opacity",
    Math.round(fill.opacity * 100),
    0,
    100,
    "%",
    (v) => onFillChange({ opacity: v / 100 }),
  );
  const invalid = showText
    ? !size.valid || (textStyle.bgEnabled && !background.valid)
    : showFill && fill.enabled && !opacity.valid;
  const apply = async () => {
    flush();
    await applyTransform(async (d) => {
      const anns = d.objects
        .filter((o) => o.kind === "annotation" && o.payload)
        .map((o) => o.payload as Annotation);
      return {
        bytes: await annotatePdf(docToFile(d), anns),
        label: `Annotate ${anns.length}`,
        objects: d.objects.filter((o) => o.kind !== "annotation"),
      };
    });
    patchToolState(TOOL_ID, { selectedId: undefined });
  };
  return (
    <div className="pdf-mark-panel pdf-annotate-panel">
      <section aria-label="Annotation settings" tabIndex={-1} data-busy-focus-fallback>
        <fieldset className="pdf-overlay-settings" disabled={busy}>
          <legend className="sr-only">Annotation settings</legend>
          <div className="pdf-property-field">
            <span className="air-label">Tool</span>
            <div className="pdf-annotate-tools" role="group" aria-label="Annotation tool">
              {MODES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className="air-button air-button--quiet"
                  ref={id === "select" ? selectRef : undefined}
                  aria-pressed={mode === id}
                  onClick={() => {
                    flush();
                    patchToolState(TOOL_ID, {
                      mode: id,
                      ...(id === "select" ? {} : { selectedId: undefined }),
                    });
                  }}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          {objects.length > 0 && (
            <div className="pdf-property-field">
              <label className="air-label" htmlFor="annotation-selection">
                Placed annotation
              </label>
              <Select
                id="annotation-selection"
                value={selected?.id ?? ""}
                placeholder="Choose an annotation"
                disabled={busy}
                options={objects.map((o, i) => ({
                  value: o.id,
                  label: `${i + 1} · ${((o.payload as Annotation).kind === "text" ? "Text" : MODES.find((m) => m.id === (o.payload as Annotation).kind)?.label) ?? "Mark"} · Page ${o.pageIndex + 1}`,
                }))}
                onChange={(id) => {
                  flush();
                  const o = objects.find((o) => o.id === id);
                  if (o) {
                    setSelectedPage(o.pageIndex);
                    patchToolState(TOOL_ID, { selectedId: id, mode: "select" });
                  }
                }}
              />
            </div>
          )}
          {showText ? (
            <>
              <div className="pdf-property-field">
                <label className="air-label" htmlFor="annotation-font">
                  Font
                </label>
                <Select
                  id="annotation-font"
                  ariaLabel="Font family"
                  value={textStyle.family}
                  disabled={busy}
                  onChange={(family) =>
                    onTextChange(FAMILY_HAS_ITALIC[family] ? { family } : { family, italic: false })
                  }
                  options={FAMILIES.map((f) => ({
                    value: f,
                    label: <span style={{ fontFamily: FAMILY_CSS[f] }}>{FAMILY_LABEL[f]}</span>,
                    searchText: FAMILY_LABEL[f],
                  }))}
                />
                <div className="pdf-annotate-styles" role="group" aria-label="Text style">
                  {TEXT_STYLES.map(({ key, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={key}
                      className="air-button air-button--quiet"
                      aria-label={
                        key === "italic" && !FAMILY_HAS_ITALIC[textStyle.family]
                          ? "Italic (unavailable for this font)"
                          : label
                      }
                      title={label}
                      aria-pressed={
                        textStyle[key] && (key !== "italic" || FAMILY_HAS_ITALIC[textStyle.family])
                      }
                      disabled={key === "italic" && !FAMILY_HAS_ITALIC[textStyle.family]}
                      onClick={() => onTextChange({ [key]: !textStyle[key] })}
                    >
                      <Icon size={16} aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {size.control}
              {typeof slice.sizeHint === "string" && !text && (
                <p className="air-help">{slice.sizeHint}</p>
              )}
              <ColorPicker
                label="Text colour"
                value={textStyle.colorHex}
                onChange={(colorHex) => onTextChange({ colorHex })}
              />
              <label className="air-switch-row">
                <span>Background</span>
                <input
                  className="air-switch"
                  type="checkbox"
                  role="switch"
                  checked={textStyle.bgEnabled}
                  onChange={(e) => onTextChange({ bgEnabled: e.target.checked })}
                />
              </label>
              {textStyle.bgEnabled && (
                <>
                  <ColorPicker
                    label="Background colour"
                    value={textStyle.bgHex}
                    onChange={(bgHex) => onTextChange({ bgHex })}
                  />
                  {background.control}
                </>
              )}
            </>
          ) : (
            <>
              {showIcons && (
                <div className="pdf-property-field">
                  <span className="air-label">Icon</span>
                  <div className="pdf-annotate-icons" role="group" aria-label="Annotation icon">
                    {ICON_CHOICES.map(({ id, label, icon: Icon }) => (
                      <button
                        type="button"
                        key={id}
                        className="air-icon-button"
                        aria-label={label}
                        title={label}
                        aria-pressed={
                          (ann?.kind === "icon" ? ann.icon : (slice.iconId ?? "check")) === id
                        }
                        onClick={() => {
                          patchToolState(TOOL_ID, { iconId: id });
                          if (ann?.kind === "icon")
                            editSelected({ ...ann, icon: id }, "Change icon");
                        }}
                      >
                        <Icon size={20} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(mode !== "select" || selected) && (
                <ColorPicker
                  label={showFill ? "Stroke colour" : "Mark colour"}
                  value={textStyle.colorHex}
                  onChange={(colorHex) => {
                    patchToolState(TOOL_ID, { colorHex });
                    if (ann) editSelected({ ...ann, color: hexToRgb(colorHex) }, "Edit colour");
                  }}
                />
              )}
              {showFill && (
                <>
                  <label className="air-switch-row">
                    <span>Fill shape</span>
                    <input
                      className="air-switch"
                      type="checkbox"
                      role="switch"
                      checked={fill.enabled}
                      onChange={(e) => onFillChange({ enabled: e.target.checked })}
                    />
                  </label>
                  {fill.enabled && (
                    <>
                      <ColorPicker
                        label="Fill colour"
                        value={fill.hex}
                        onChange={(hex) => onFillChange({ hex })}
                      />
                      {opacity.control}
                    </>
                  )}
                </>
              )}
            </>
          )}
          {selected && (
            <button
              type="button"
              className="air-button air-button--quiet pdf-annotate-delete"
              onClick={() => {
                flush();
                removeObject(selected.id);
                patchToolState(TOOL_ID, { selectedId: undefined });
                selectRef.current?.focus();
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
              Delete annotation
            </button>
          )}
        </fieldset>
        <p className="air-help">
          {mode === "select"
            ? selected
              ? "Drag to move. Arrow keys nudge; Shift moves further. Pull a handle to resize. Double-click text to edit it."
              : "Choose a tool to add a mark, or select an annotation on the page to edit it."
            : mode === "text"
              ? "Drag a text box or tap the page, then type. Text wraps inside the box."
              : mode === "icon"
                ? "Tap the page to place this icon. Drag or resize it after placing."
                : "Draw on the page. Each new mark is selected so you can adjust it."}
        </p>
      </section>
      <section aria-label="Apply annotations">
        <p role="status">
          {objects.length} mark{objects.length === 1 ? "" : "s"}
        </p>
        <PrimaryAction
          label="Apply annotations"
          onApply={apply}
          disabled={objects.length === 0 || invalid}
        />
        <p className="air-help">
          Apply adds your marks to the PDF. Existing page text stays selectable.
        </p>
      </section>
    </div>
  );
}
