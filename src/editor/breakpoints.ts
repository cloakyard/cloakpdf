// breakpoints.ts — Single source of truth for the viewport thresholds the
// canvas editor uses to switch between mobile / tablet / desktop layouts.
//
// Ported in spirit from CloakIMG's editor/breakpoints.ts. The editor reads
// `layout` once from a window-resize listener in EditorContext; every region
// (rail, properties panel, mobile sheet) keys off the resolved value so the
// breakpoint logic lives in exactly one place.

import type { Layout } from "./types";

/** Viewport width (px) below which the editor swaps from the desktop / tablet
 *  split-pane to the mobile sheet-based UI. */
export const MOBILE_MAX_PX = 760;

/** Below this width we use the tablet shell (tool rail + collapsed property
 *  panel) but still render the desktop-style top bar. */
export const TABLET_MAX_PX = 1180;

/**
 * Resolve a viewport width to a layout bucket.
 *
 * Uses `min(innerWidth, innerHeight)` rather than width alone so a phone held
 * in landscape (short but wide) still resolves to the mobile sheet UI instead
 * of stranding the user in a cramped three-pane desktop layout — the landscape
 * flip CloakIMG's width-only check is prone to.
 */
export function detectLayout(width: number, height: number): Layout {
  const shortEdge = Math.min(width, height);
  if (shortEdge < MOBILE_MAX_PX) return "mobile";
  if (width < TABLET_MAX_PX) return "tablet";
  return "desktop";
}
