/**
 * Runtime colour values for canvas output and user-selectable swatches.
 * Portable interface tokens live in `tokens.css`; Tailwind aliases are mapped
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
  /** Light border around thumbnails / cells */
  border: "#E2E8F0",
  /** Label text colour */
  label: "#64748B",
  /** Product accent used for canvas selection chrome */
  accent: "#2563EB",
  /** Strong accent stroke for active crop/trim boundaries */
  accentStrong: "rgba(37, 99, 235, 0.95)",
  /** Medium accent stroke for detected regions */
  accentMedium: "rgba(37, 99, 235, 0.70)",
  /** Soft accent fill for detected regions */
  accentSoft: "rgba(37, 99, 235, 0.10)",
  /** Neutral dim applied outside a retained canvas selection */
  selectionDim: "rgba(15, 23, 42, 0.45)",
  /** Redaction box fill */
  redactFill: "rgba(0,0,0,0.85)",
  /** Redaction box stroke (red — intentionally distinct from theme) */
  redactStroke: "#FF4444",
  /** Pixel-diff highlight for ComparePdf (RGBA channels 0–255) */
  diffHighlight: { r: 239, g: 68, b: 68, a: 180 },
} as const;
