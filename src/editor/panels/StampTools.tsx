// Bates numbering; shared overlay controls remain until this final legacy panel migrates.
import { useCallback } from "react";
import type { BatesNumberOptions, PageNumberPosition } from "../../types.ts";
import { addBatesNumbers } from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { useStageProps } from "../stage.tsx";
import { ColorRow, Labeled, PositionGrid, RangeField, type Rgb, TextField } from "./controls.tsx";
import { Segmented, WholeDocPanel } from "./WholeDocPanel.tsx";

const INK = { r: 30, g: 41, b: 59 };

const COURIER = "'Courier New', Courier, monospace";

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
