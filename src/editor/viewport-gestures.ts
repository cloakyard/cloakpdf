// Pure viewport math shared by PdfStage's touch and wheel gestures. Keeping
// this separate from the DOM handlers makes the focal-point invariant explicit:
// the page point beneath the fingers/cursor must stay beneath it while zooming.

import type { ViewState } from "./types.ts";

export interface ViewportPoint {
  x: number;
  y: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export interface PinchSnapshot {
  view: ViewState;
  distance: number;
  center: ViewportPoint;
  origin: ViewportPoint;
}

export const MIN_VIEW_ZOOM = 0.2;
export const MAX_VIEW_ZOOM = 8;

// A 2x finger spread produces 2^(3/4) = 1.68x canvas zoom. That keeps the
// gesture responsive while taking the edge off the raw 1:1 distance mapping.
const PINCH_ZOOM_RESPONSE = 3 / 4;

// Ignore distance noise until the two touch centres are at least half a
// standard 48px touch target apart. Midpoint movement still pans immediately.
const MIN_PINCH_DISTANCE = 24;

// Continuous wheel response: a full 100px wheel notch is about a 22% zoom,
// while the 1–5px deltas emitted by a trackpad remain fine-grained.
const WHEEL_ZOOM_RESPONSE = 1 / 500;
const MAX_WHEEL_ZOOM_DELTA = 100;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function distanceBetween(a: ViewportPoint, b: ViewportPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function viewportTransform(view: Pick<ViewState, "zoom" | "panX" | "panY">): string {
  return `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})`;
}

/** Keep the paper reachable while still allowing generous canvas overscroll:
 * either paper edge may move as far as the viewport centre, but never beyond
 * it. Zooming out therefore brings a displaced page naturally back toward the
 * middle instead of letting a tiny page disappear off-canvas. */
export function keepPageReachable(view: ViewState, pageSize: ViewportSize): ViewState {
  const maxPanX = (pageSize.width * view.zoom) / 2;
  const maxPanY = (pageSize.height * view.zoom) / 2;
  return {
    ...view,
    panX: clamp(view.panX, -maxPanX, maxPanX),
    panY: clamp(view.panY, -maxPanY, maxPanY),
  };
}

/** Zoom while keeping the same page-space point under `focalPoint`. Pan is in
 * screen pixels because PdfStage applies translate before scale in CSS. */
export function zoomViewAtPoint(
  view: ViewState,
  requestedZoom: number,
  focalPoint: ViewportPoint,
  transformOrigin: ViewportPoint,
): ViewState {
  const zoom = clamp(requestedZoom, MIN_VIEW_ZOOM, MAX_VIEW_ZOOM);
  const zoomRatio = zoom / view.zoom;
  const focalX = focalPoint.x - transformOrigin.x;
  const focalY = focalPoint.y - transformOrigin.y;

  return {
    ...view,
    zoom,
    panX: focalX - (focalX - view.panX) * zoomRatio,
    panY: focalY - (focalY - view.panY) * zoomRatio,
  };
}

/** Resolve a pinch from its start snapshot. Scaling stays anchored at the
 * initial midpoint; movement of that midpoint is added as a simultaneous pan. */
export function viewFromPinch(
  start: PinchSnapshot,
  currentDistance: number,
  currentCenter: ViewportPoint,
): ViewState {
  const distanceRatio =
    Math.max(currentDistance, MIN_PINCH_DISTANCE) / Math.max(start.distance, MIN_PINCH_DISTANCE);
  const requestedZoom = start.view.zoom * distanceRatio ** PINCH_ZOOM_RESPONSE;
  const anchored = zoomViewAtPoint(start.view, requestedZoom, start.center, start.origin);

  return {
    ...anchored,
    panX: anchored.panX + currentCenter.x - start.center.x,
    panY: anchored.panY + currentCenter.y - start.center.y,
  };
}

/** Convert WheelEvent units to CSS pixels before applying pan/zoom. */
export function wheelDeltaPixels(delta: number, deltaMode: number, viewportSize: number): number {
  // DOM_DELTA_LINE = 1; DOM_DELTA_PAGE = 2. Sixteen pixels matches the app's
  // base line height and page mode follows the actual stage dimension.
  if (deltaMode === 1) return delta * 16;
  if (deltaMode === 2) return delta * viewportSize;
  return delta;
}

/** Continuous Ctrl/Cmd-wheel (including trackpad pinch) zoom around the cursor. */
export function viewFromWheelZoom(
  view: ViewState,
  deltaPixels: number,
  focalPoint: ViewportPoint,
  transformOrigin: ViewportPoint,
): ViewState {
  const boundedDelta = clamp(deltaPixels, -MAX_WHEEL_ZOOM_DELTA, MAX_WHEEL_ZOOM_DELTA);
  const requestedZoom = view.zoom * Math.exp(-boundedDelta * WHEEL_ZOOM_RESPONSE);
  return zoomViewAtPoint(view, requestedZoom, focalPoint, transformOrigin);
}
