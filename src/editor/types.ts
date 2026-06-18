// types.ts — Core type vocabulary for the canvas editor.
//
// Kept separate from src/types.ts (the app-wide tool metadata types) so the
// editor's document / layout / tool model can evolve without churning the
// home-grid tooling. See CLAUDE.md for the architecture these types encode.

/** Responsive layout bucket resolved from the viewport (see breakpoints.ts). */
export type Layout = "mobile" | "tablet" | "desktop";

/**
 * What the center stage is showing:
 *  - `focus`    — one page fills the canvas; the place editing happens.
 *  - `overview` — a grid of every page for browsing + page-board edits.
 */
export type ViewMode = "focus" | "overview";

/** Canonical top-left fraction rectangle (0–1 of the page box). Resolution-
 *  independent so a box drawn at one zoom stays correct at any display size —
 *  the same shape RedactPdf and the PII detectors already converge on. */
export interface FractionRect {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

/** Pan/zoom of the focus-mode stage. `zoom` is a multiplier on fit-scale
 *  (1 === fit-to-stage); pan is in screen pixels from the centered origin.
 *  `gridCols` is the overview-mode page-grid density (columns per row) chosen
 *  via the top-bar density control; ignored in focus mode. */
export interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
  gridCols: number;
}

export const DEFAULT_VIEW: ViewState = { zoom: 1, panX: 0, panY: 0, gridCols: 3 };
