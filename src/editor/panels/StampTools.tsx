// StampTools.tsx — Content-additive overlay tools that place repeating text on
// every page: page numbers, header/footer, Bates numbering, and watermark. Each
// is an option form + Apply (reusing WholeDocPanel for the busy-aware button)
// with a visual position picker so the layout is obvious without freeform drag.
// All are additive (page count/geometry unchanged) so overlay objects are
// preserved.
//
// Each tool renders a LIVE preview on the focused page so the placement, size,
// colour, and format read as WYSIWYG before you commit — Apply then burns the
// same text into the bytes. The form state therefore lives in the shared tool
// slice (not local useState) so a sibling Stage can read it, exactly as the
// watermark tool does. The preview geometry below mirrors each writer in
// utils/pdf/stamps.ts (margin / position / baseline) so preview == output.

import { useCallback } from "react";
import type {
  BatesNumberOptions,
  HeaderFooterOptions,
  PageNumberFormat,
  PageNumberOptions,
  PageNumberPosition,
  StampFinish,
  StampShape,
  WatermarkOptions,
} from "../../types.ts";
import { paintStamp } from "../../utils/pdf/stamp-render.ts";
import {
  addBatesNumbers,
  addHeaderFooter,
  addPageNumbers,
  addWatermark,
  baseFileName,
  resolveStampTokens,
} from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { useStageProps } from "../stage.tsx";
import {
  ColorRow,
  Labeled,
  PositionGrid,
  RangeField,
  type Rgb,
  TextField,
  Toggle,
  TokenBar,
  useTokenInsert,
} from "./controls.tsx";
import { Segmented, WholeDocPanel } from "./WholeDocPanel.tsx";

const INK = { r: 30, g: 41, b: 59 };
const GREY = { r: 100, g: 116, b: 139 };

const HELVETICA = "Helvetica, Arial, sans-serif";
const COURIER = "'Courier New', Courier, monospace";

const PAGE_NUMBERS_TOOL_ID = "add-page-numbers";
const HEADER_FOOTER_TOOL_ID = "header-footer";
const BATES_TOOL_ID = "bates-numbering";

/**
 * Paint one stamp run onto the overlay, mirroring the pdf-lib writers: the page
 * point-space maps to the overlay's (zoom-aware) `w`×`h`, so a point size and a
 * point margin convert through `s = w / widthPt`. `isTop` puts the baseline a
 * margin + one line down from the top; otherwise a margin up from the bottom —
 * matching `height - margin - fontSize` vs `margin` in the burn (PDF y is
 * bottom-up; the canvas is top-down, so the bottom case lands at `h - margin·s`).
 */
function paintStampText(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: number,
  opts: {
    text: string;
    fontSizePt: number;
    marginPt: number;
    isTop: boolean;
    align: "left" | "center" | "right";
    color: Rgb;
    fontFamily: string;
  },
): void {
  if (!opts.text.trim()) return;
  const fontPx = opts.fontSizePt * s;
  if (fontPx < 1) return;
  ctx.save();
  ctx.fillStyle = `rgb(${opts.color.r}, ${opts.color.g}, ${opts.color.b})`;
  ctx.font = `${fontPx}px ${opts.fontFamily}`;
  ctx.textBaseline = "alphabetic";
  const tw = ctx.measureText(opts.text).width;
  const mx = opts.marginPt * s;
  const x = opts.align === "left" ? mx : opts.align === "right" ? w - tw - mx : (w - tw) / 2;
  const baselineY = opts.isTop ? (opts.marginPt + opts.fontSizePt) * s : h - opts.marginPt * s;
  ctx.fillText(opts.text, x, baselineY);
  ctx.restore();
}

/** Decompose a six-cell position into vertical (top?) + horizontal alignment. */
function splitPosition(p: PageNumberPosition): {
  isTop: boolean;
  align: "left" | "center" | "right";
} {
  return {
    isTop: p.startsWith("top"),
    align: p.endsWith("left") ? "left" : p.endsWith("right") ? "right" : "center",
  };
}

// ── Page numbers ───────────────────────────────────────────────────────────

const PAGE_NUMBER_DEFAULTS: PageNumberOptions = {
  position: "bottom-center",
  format: "1",
  fontSize: 12,
  color: INK,
  margin: 36,
  startNumber: 1,
  firstPage: 1,
};

function readPageNumbers(slice: Record<string, unknown>): PageNumberOptions {
  return {
    position: (slice.position as PageNumberPosition) ?? PAGE_NUMBER_DEFAULTS.position,
    format: (slice.format as PageNumberFormat) ?? PAGE_NUMBER_DEFAULTS.format,
    fontSize: (slice.fontSize as number) ?? PAGE_NUMBER_DEFAULTS.fontSize,
    color: (slice.color as Rgb) ?? PAGE_NUMBER_DEFAULTS.color,
    margin: (slice.margin as number) ?? PAGE_NUMBER_DEFAULTS.margin,
    startNumber: (slice.startNumber as number) ?? PAGE_NUMBER_DEFAULTS.startNumber,
    firstPage: (slice.firstPage as number) ?? PAGE_NUMBER_DEFAULTS.firstPage,
  };
}

/** The page-number string for one page — mirrors the format switch in the burn. */
function formatPageNumber(format: PageNumberFormat, displayNum: number, lastNum: number): string {
  switch (format) {
    case "Page 1":
      return `Page ${displayNum}`;
    case "1 / N":
      return `${displayNum} / ${lastNum}`;
    case "Page 1 of N":
      return `Page ${displayNum} of ${lastNum}`;
    default:
      return `${displayNum}`;
  }
}

export function PageNumbersStage() {
  const { doc, selectedPage } = useEditorRead();
  const o = readPageNumbers(useToolSlice(PAGE_NUMBERS_TOOL_ID));
  const page = doc?.pages[selectedPage] ?? null;
  const widthPt = page?.widthPt ?? 0;
  const total = doc?.pageCount ?? 1;
  const { position, format, fontSize, margin, startNumber, firstPage } = o;
  const { r, g, b } = o.color;
  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (widthPt <= 0) return;
      // Pages before `firstPage` carry no number (the cover-skip), so the preview
      // shows nothing there either.
      if (selectedPage < firstPage - 1) return;
      const displayNum = selectedPage - (firstPage - 1) + startNumber;
      const lastNum = total - firstPage + startNumber;
      const text = formatPageNumber(format, displayNum, lastNum);
      const { isTop, align } = splitPosition(position);
      paintStampText(ctx, w, h, w / widthPt, {
        text,
        fontSizePt: fontSize,
        marginPt: margin,
        isTop,
        align,
        color: { r, g, b },
        fontFamily: HELVETICA,
      });
    },
    [
      widthPt,
      selectedPage,
      firstPage,
      startNumber,
      total,
      format,
      position,
      fontSize,
      margin,
      r,
      g,
      b,
    ],
  );
  useStageProps({ paintOverlay });
  return null;
}

export function PageNumbersPanel() {
  const { applyTransform, patchToolState } = useEditorActions();
  const o = readPageNumbers(useToolSlice(PAGE_NUMBERS_TOOL_ID));
  const set = (p: Partial<PageNumberOptions>) => patchToolState(PAGE_NUMBERS_TOOL_ID, p);
  return (
    <WholeDocPanel
      blurb="Stamp page numbers in a corner of every page."
      applyLabel="Add page numbers"
      onApply={() =>
        void applyTransform(async (d) => ({
          bytes: await addPageNumbers(docToFile(d), o),
          label: "Page numbers",
        }))
      }
    >
      <PositionGrid value={o.position} onChange={(position) => set({ position })} />
      <Labeled label="Format">
        <Segmented<PageNumberFormat>
          value={o.format}
          onChange={(format) => set({ format })}
          options={[
            { value: "1", label: "1" },
            { value: "Page 1", label: "Page 1" },
            { value: "1 / N", label: "1 / N" },
            { value: "Page 1 of N", label: "of N" },
          ]}
        />
      </Labeled>
      <ColorRow value={o.color} onChange={(color) => set({ color })} />
      <RangeField
        label="Size"
        value={o.fontSize}
        min={8}
        max={24}
        suffix="pt"
        onChange={(fontSize) => set({ fontSize })}
      />
      <RangeField
        label="Margin"
        value={o.margin}
        min={12}
        max={72}
        suffix="pt"
        onChange={(margin) => set({ margin })}
      />
    </WholeDocPanel>
  );
}

// ── Header & footer ──────────────────────────────────────────────────────────

function TripleRow({
  label,
  values,
  onChange,
}: {
  label: string;
  values: [string, string, string];
  onChange: (v: [string, string, string]) => void;
}) {
  const cls =
    "w-full rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface px-2 py-1.5 text-sm text-slate-800 dark:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";
  return (
    <Labeled label={label}>
      <div className="grid grid-cols-3 gap-1.5">
        {(["Left", "Center", "Right"] as const).map((ph, i) => (
          <input
            key={ph}
            type="text"
            placeholder={ph}
            value={values[i]}
            aria-label={`${label} ${ph}`}
            onChange={(e) => {
              const next: [string, string, string] = [...values];
              next[i] = e.target.value;
              onChange(next);
            }}
            className={cls}
          />
        ))}
      </div>
    </Labeled>
  );
}

const HEADER_FOOTER_DEFAULTS: HeaderFooterOptions = {
  headerLeft: "",
  headerCenter: "",
  headerRight: "",
  footerLeft: "",
  footerCenter: "",
  footerRight: "",
  fontSize: 10,
  color: GREY,
  margin: 36,
  skipFirstPage: false,
};

function readHeaderFooter(slice: Record<string, unknown>): HeaderFooterOptions {
  const str = (k: keyof HeaderFooterOptions) => (slice[k] as string) ?? "";
  return {
    headerLeft: str("headerLeft"),
    headerCenter: str("headerCenter"),
    headerRight: str("headerRight"),
    footerLeft: str("footerLeft"),
    footerCenter: str("footerCenter"),
    footerRight: str("footerRight"),
    fontSize: (slice.fontSize as number) ?? HEADER_FOOTER_DEFAULTS.fontSize,
    color: (slice.color as Rgb) ?? HEADER_FOOTER_DEFAULTS.color,
    margin: (slice.margin as number) ?? HEADER_FOOTER_DEFAULTS.margin,
    skipFirstPage: (slice.skipFirstPage as boolean) ?? HEADER_FOOTER_DEFAULTS.skipFirstPage,
  };
}

export function HeaderFooterStage() {
  const { doc, selectedPage } = useEditorRead();
  const o = readHeaderFooter(useToolSlice(HEADER_FOOTER_TOOL_ID));
  const page = doc?.pages[selectedPage] ?? null;
  const widthPt = page?.widthPt ?? 0;
  const total = doc?.pageCount ?? 1;
  const fileName = doc?.fileName ?? "";
  const { fontSize, margin, skipFirstPage } = o;
  const { r, g, b } = o.color;
  const slots = [
    o.headerLeft,
    o.headerCenter,
    o.headerRight,
    o.footerLeft,
    o.footerCenter,
    o.footerRight,
  ];
  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (widthPt <= 0) return;
      if (skipFirstPage && selectedPage === 0) return;
      const resolve = (t: string) =>
        resolveStampTokens(t, {
          page: selectedPage + 1,
          total,
          title: "",
          filename: baseFileName(fileName),
          date: new Date(),
        });
      const rows: { raw: string; isTop: boolean; align: "left" | "center" | "right" }[] = [
        { raw: slots[0], isTop: true, align: "left" },
        { raw: slots[1], isTop: true, align: "center" },
        { raw: slots[2], isTop: true, align: "right" },
        { raw: slots[3], isTop: false, align: "left" },
        { raw: slots[4], isTop: false, align: "center" },
        { raw: slots[5], isTop: false, align: "right" },
      ];
      for (const row of rows) {
        if (!row.raw.trim()) continue;
        paintStampText(ctx, w, h, w / widthPt, {
          text: resolve(row.raw),
          fontSizePt: fontSize,
          marginPt: margin,
          isTop: row.isTop,
          align: row.align,
          color: { r, g, b },
          fontFamily: HELVETICA,
        });
      }
    },
    // slots spread so each text edit repaints; primitive deps cover the rest.
    [widthPt, selectedPage, skipFirstPage, total, fileName, fontSize, margin, r, g, b, ...slots],
  );
  useStageProps({ paintOverlay });
  return null;
}

export function HeaderFooterPanel() {
  const { applyTransform, patchToolState } = useEditorActions();
  const { containerProps, insert } = useTokenInsert();
  const o = readHeaderFooter(useToolSlice(HEADER_FOOTER_TOOL_ID));
  const set = (p: Partial<HeaderFooterOptions>) => patchToolState(HEADER_FOOTER_TOOL_ID, p);
  const empty =
    !o.headerLeft &&
    !o.headerCenter &&
    !o.headerRight &&
    !o.footerLeft &&
    !o.footerCenter &&
    !o.footerRight;
  return (
    <WholeDocPanel
      blurb="Add repeating text to the top and/or bottom of every page."
      applyLabel="Add header & footer"
      disabled={empty}
      onApply={() =>
        void applyTransform(async (d) => ({
          bytes: await addHeaderFooter(docToFile(d), o),
          label: "Header & footer",
        }))
      }
    >
      <div className="flex flex-col gap-4" {...containerProps}>
        <TripleRow
          label="Header"
          values={[o.headerLeft, o.headerCenter, o.headerRight]}
          onChange={([l, c, r]) => set({ headerLeft: l, headerCenter: c, headerRight: r })}
        />
        <TripleRow
          label="Footer"
          values={[o.footerLeft, o.footerCenter, o.footerRight]}
          onChange={([l, c, r]) => set({ footerLeft: l, footerCenter: c, footerRight: r })}
        />
        <TokenBar onInsert={insert} />
      </div>
      <ColorRow value={o.color} onChange={(color) => set({ color })} />
      <RangeField
        label="Size"
        value={o.fontSize}
        min={7}
        max={18}
        suffix="pt"
        onChange={(fontSize) => set({ fontSize })}
      />
      <Toggle
        label="Skip first page"
        checked={o.skipFirstPage}
        onChange={(skipFirstPage) => set({ skipFirstPage })}
      />
    </WholeDocPanel>
  );
}

// ── Bates numbering ──────────────────────────────────────────────────────────

const BATES_DEFAULTS: BatesNumberOptions = {
  prefix: "",
  suffix: "",
  startNumber: 1,
  digits: 6,
  position: "bottom-right",
  fontSize: 10,
  color: INK,
  margin: 36,
};

function readBates(slice: Record<string, unknown>): BatesNumberOptions {
  return {
    prefix: (slice.prefix as string) ?? BATES_DEFAULTS.prefix,
    suffix: (slice.suffix as string) ?? BATES_DEFAULTS.suffix,
    startNumber: (slice.startNumber as number) ?? BATES_DEFAULTS.startNumber,
    digits: (slice.digits as number) ?? BATES_DEFAULTS.digits,
    position: (slice.position as PageNumberPosition) ?? BATES_DEFAULTS.position,
    fontSize: (slice.fontSize as number) ?? BATES_DEFAULTS.fontSize,
    color: (slice.color as Rgb) ?? BATES_DEFAULTS.color,
    margin: (slice.margin as number) ?? BATES_DEFAULTS.margin,
  };
}

export function BatesStage() {
  const { doc, selectedPage } = useEditorRead();
  const o = readBates(useToolSlice(BATES_TOOL_ID));
  const page = doc?.pages[selectedPage] ?? null;
  const widthPt = page?.widthPt ?? 0;
  const { prefix, suffix, startNumber, digits, position, fontSize, margin } = o;
  const { r, g, b } = o.color;
  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (widthPt <= 0) return;
      const num = startNumber + selectedPage;
      const text = `${prefix}${String(num).padStart(digits, "0")}${suffix}`;
      const { isTop, align } = splitPosition(position);
      paintStampText(ctx, w, h, w / widthPt, {
        text,
        fontSizePt: fontSize,
        marginPt: margin,
        isTop,
        align,
        color: { r, g, b },
        fontFamily: COURIER,
      });
    },
    [
      widthPt,
      selectedPage,
      prefix,
      suffix,
      startNumber,
      digits,
      position,
      fontSize,
      margin,
      r,
      g,
      b,
    ],
  );
  useStageProps({ paintOverlay });
  return null;
}

export function BatesPanel() {
  const { applyTransform, patchToolState } = useEditorActions();
  const o = readBates(useToolSlice(BATES_TOOL_ID));
  const set = (p: Partial<BatesNumberOptions>) => patchToolState(BATES_TOOL_ID, p);
  return (
    <WholeDocPanel
      blurb="Stamp sequential identifiers for legal & compliance workflows."
      applyLabel="Add Bates numbers"
      onApply={() =>
        void applyTransform(async (d) => ({
          bytes: await addBatesNumbers(docToFile(d), o),
          label: "Bates numbering",
        }))
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <TextField
          label="Prefix"
          value={o.prefix}
          onChange={(prefix) => set({ prefix })}
          placeholder="ABC-"
        />
        <TextField
          label="Suffix"
          value={o.suffix}
          onChange={(suffix) => set({ suffix })}
          placeholder="-X"
        />
      </div>
      <RangeField
        label="Start at"
        value={o.startNumber}
        min={1}
        max={1000}
        onChange={(startNumber) => set({ startNumber })}
      />
      <Labeled label="Digits">
        <Segmented
          value={String(o.digits)}
          onChange={(v) => set({ digits: Number(v) })}
          options={[
            { value: "4", label: "4" },
            { value: "6", label: "6" },
            { value: "8", label: "8" },
          ]}
        />
      </Labeled>
      <PositionGrid value={o.position} onChange={(position) => set({ position })} />
      <ColorRow value={o.color} onChange={(color) => set({ color })} />
    </WholeDocPanel>
  );
}

// ── Watermark: live-previewed across the focused page ─────────────────────
//
// Watermark renders a real-time preview on the canvas so Size / Opacity / Angle /
// colour read as WYSIWYG before you commit. Apply still burns it into the bytes
// through addWatermark, so the preview geometry below mirrors that function's
// centre + rotation math.
const WATERMARK_TOOL_ID = "stamp-pdf";

const WATERMARK_DEFAULTS: Required<WatermarkOptions> = {
  text: "CONFIDENTIAL",
  fontSize: 48,
  color: GREY,
  opacity: 0.3,
  rotation: 45,
  shape: "none",
  finish: "digital",
  inkTexture: 0.25,
};

function readWatermark(slice: Record<string, unknown>): Required<WatermarkOptions> {
  return {
    text: (slice.text as string) ?? WATERMARK_DEFAULTS.text,
    fontSize: (slice.fontSize as number) ?? WATERMARK_DEFAULTS.fontSize,
    color: (slice.color as WatermarkOptions["color"]) ?? WATERMARK_DEFAULTS.color,
    opacity: (slice.opacity as number) ?? WATERMARK_DEFAULTS.opacity,
    rotation: (slice.rotation as number) ?? WATERMARK_DEFAULTS.rotation,
    shape: (slice.shape as StampShape) ?? WATERMARK_DEFAULTS.shape,
    finish: (slice.finish as StampFinish) ?? WATERMARK_DEFAULTS.finish,
    inkTexture: (slice.inkTexture as number) ?? WATERMARK_DEFAULTS.inkTexture,
  };
}

/** Paint the watermark onto the overlay exactly as addWatermark will burn it:
 *  Helvetica-Bold text centred on the page, rotated about that centre. `w` is
 *  the overlay's (zoom-aware) width so fontSize-in-points maps to display px via
 *  the page's point width — the preview tracks zoom for free. `rotation` is the
 *  maths convention (counter-clockwise positive); canvas rotates clockwise for a
 *  positive angle, so we negate it here to match the burned PDF. */
function drawWatermarkPreview(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  widthPt: number,
  o: WatermarkOptions,
): void {
  const fontPx = o.fontSize * (w / widthPt);
  if (fontPx < 1) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, o.opacity));
  ctx.fillStyle = `rgb(${o.color.r}, ${o.color.g}, ${o.color.b})`;
  ctx.font = `bold ${fontPx}px Helvetica, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(w / 2, h / 2);
  ctx.rotate((-o.rotation * Math.PI) / 180);
  ctx.fillText(o.text, 0, 0);
  ctx.restore();
}

export function WatermarkStage() {
  const { doc, selectedPage } = useEditorRead();
  const o = readWatermark(useToolSlice(WATERMARK_TOOL_ID));
  const page = doc?.pages[selectedPage] ?? null;
  const widthPt = page?.widthPt ?? 0;
  const { text, fontSize, opacity, rotation, shape, finish, inkTexture } = o;
  const { r, g, b } = o.color;
  // Resolve {page}/{date}/… for the focused page so the preview shows the real
  // burned text, not the raw template. {title} isn't in the doc model → "".
  const resolved = resolveStampTokens(text, {
    page: selectedPage + 1,
    total: doc?.pageCount ?? 1,
    title: "",
    filename: baseFileName(doc?.fileName ?? ""),
    date: new Date(),
  });
  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      if (!resolved.trim() || widthPt <= 0) return;
      // Plain watermark → direct vector-style text (mirrors the pdf-lib burn).
      // Any shape or the ink finish → the shared raster painter that also draws
      // the burned PNG, so the box/seal/ink-bleed preview matches the output.
      if (shape === "none" && finish === "digital") {
        drawWatermarkPreview(ctx, w, h, widthPt, {
          text: resolved,
          fontSize,
          color: { r, g, b },
          opacity,
          rotation,
        });
        return;
      }
      paintStamp(ctx, w / 2, h / 2, fontSize * (w / widthPt), rotation, opacity, {
        text: resolved,
        color: { r, g, b },
        shape,
        finish,
        texture: inkTexture,
      });
    },
    [resolved, fontSize, r, g, b, opacity, rotation, shape, finish, inkTexture, widthPt],
  );
  useStageProps({ paintOverlay });
  return null;
}

export function WatermarkPanel() {
  const { applyTransform, patchToolState } = useEditorActions();
  const { containerProps, insert } = useTokenInsert();
  const o = readWatermark(useToolSlice(WATERMARK_TOOL_ID));
  const set = (p: Partial<WatermarkOptions>) => patchToolState(WATERMARK_TOOL_ID, p);
  return (
    <WholeDocPanel
      blurb="Stamp text across every page — plain, in a box or seal, with a crisp digital or distressed ink-stamp finish."
      applyLabel="Add stamp"
      disabled={!o.text.trim()}
      onApply={() =>
        void applyTransform(async (d) => ({
          bytes: await addWatermark(docToFile(d), o),
          label: "Watermark",
        }))
      }
    >
      <div className="flex flex-col gap-4" {...containerProps}>
        <TextField
          label="Text"
          value={o.text}
          onChange={(text) => set({ text })}
          placeholder="CONFIDENTIAL"
        />
        <TokenBar onInsert={insert} />
      </div>
      <Labeled label="Shape">
        <Segmented<StampShape>
          value={o.shape}
          onChange={(shape) => set({ shape })}
          options={[
            { value: "none", label: "None" },
            { value: "rect", label: "Box" },
            { value: "circle", label: "Circle" },
          ]}
        />
      </Labeled>
      <Labeled label="Finish">
        <Segmented<StampFinish>
          value={o.finish}
          onChange={(finish) => set({ finish })}
          options={[
            { value: "digital", label: "Digital" },
            { value: "ink", label: "Ink stamp" },
          ]}
        />
      </Labeled>
      {o.finish === "ink" && (
        <RangeField
          label="Texture"
          value={Math.round(o.inkTexture * 100)}
          min={0}
          max={50}
          step={5}
          suffix="%"
          onChange={(v) => set({ inkTexture: v / 100 })}
        />
      )}
      <ColorRow value={o.color} onChange={(color) => set({ color })} />
      <RangeField
        label="Size"
        value={o.fontSize}
        min={16}
        max={120}
        suffix="pt"
        onChange={(fontSize) => set({ fontSize })}
      />
      <RangeField
        label="Opacity"
        value={Math.round(o.opacity * 100)}
        min={5}
        max={100}
        step={5}
        suffix="%"
        onChange={(v) => set({ opacity: v / 100 })}
      />
      <RangeField
        label="Angle"
        value={o.rotation}
        min={-90}
        max={90}
        step={5}
        suffix="°"
        onChange={(rotation) => set({ rotation })}
      />
    </WholeDocPanel>
  );
}
