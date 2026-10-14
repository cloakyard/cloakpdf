/**
 * Runtime colour values for canvas output and user-selectable swatches.
 * Portable interface tokens live in `styles/air.css`; Tailwind aliases are mapped
 * to those tokens in `index.css`. Keep values here only when JavaScript must
 * paint pixels or pass a colour through an inline canvas style.
 */

/** Focus-ring shadow used on interactive canvas/input elements. */
export const focusRing = "color-mix(in oklab, var(--color-focus) 24%, transparent)" as const;

/** Preset colours shared by Signature & Watermark colour pickers. */
export const colorPresets = [
  { label: "Black", hex: "#1E293B" },
  { label: "Grey", hex: "#64748B" },
  { label: "Blue", hex: "#1D4ED8" },
  { label: "Red", hex: "#DC2626" },
] as const;

/** Canvas rendering colours for tools that draw on an HTML5 canvas. */
export const canvas = {
  /** Background fill for generated sheets/images */
  background: "#FFFFFF",
  /** Neutral dim applied outside a retained canvas selection */
  selectionDim: "rgba(15, 23, 42, 0.45)",
  /** Pixel-diff highlight for ComparePdf (RGBA channels 0–255) */
  diffHighlight: { r: 239, g: 68, b: 68, a: 180 },
} as const;

/** Resolve Air's on-paper accent once per overlay paint, without a second palette. */
export function canvasAccent(ctx: CanvasRenderingContext2D): string {
  return getComputedStyle(ctx.canvas).color;
}
