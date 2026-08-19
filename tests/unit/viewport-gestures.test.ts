/**
 * Pins the persistent editor's direct-manipulation geometry. These invariants
 * are what make pinch/trackpad zoom feel attached to the fingers instead of
 * scaling around the page centre, and keep tiny trackpad deltas fine-grained.
 */
import { describe, expect, it } from "vitest";
import type { ViewState } from "../../src/editor/types.ts";
import {
  MAX_VIEW_ZOOM,
  MIN_VIEW_ZOOM,
  keepPageReachable,
  viewFromPinch,
  viewFromWheelZoom,
  viewportTransform,
  wheelDeltaPixels,
  zoomViewAtPoint,
} from "../../src/editor/viewport-gestures.ts";

const origin = { x: 500, y: 400 };

function screenPoint(
  pageOffset: { x: number; y: number },
  view: ViewState,
): { x: number; y: number } {
  return {
    x: origin.x + view.panX + pageOffset.x * view.zoom,
    y: origin.y + view.panY + pageOffset.y * view.zoom,
  };
}

function pageOffsetAt(screen: { x: number; y: number }, view: ViewState) {
  return {
    x: (screen.x - origin.x - view.panX) / view.zoom,
    y: (screen.y - origin.y - view.panY) / view.zoom,
  };
}

const view: ViewState = { zoom: 1.25, panX: 40, panY: -30, gridCols: 3 };

describe("zoomViewAtPoint", () => {
  it("keeps the same page point beneath an off-centre focal point", () => {
    const focal = { x: 720, y: 265 };
    const pagePoint = pageOffsetAt(focal, view);
    const zoomed = zoomViewAtPoint(view, 2.5, focal, origin);

    expect(screenPoint(pagePoint, zoomed).x).toBeCloseTo(focal.x);
    expect(screenPoint(pagePoint, zoomed).y).toBeCloseTo(focal.y);
    expect(zoomed.gridCols).toBe(view.gridCols);
  });

  it("clamps the shared zoom range", () => {
    expect(zoomViewAtPoint(view, 100, origin, origin).zoom).toBe(MAX_VIEW_ZOOM);
    expect(zoomViewAtPoint(view, 0.001, origin, origin).zoom).toBe(MIN_VIEW_ZOOM);
  });
});

describe("viewFromPinch", () => {
  it("zooms less aggressively while following midpoint movement as pan", () => {
    const center = { x: 680, y: 310 };
    const pagePoint = pageOffsetAt(center, view);
    const movedCenter = { x: 715, y: 355 };
    const result = viewFromPinch({ view, distance: 100, center, origin }, 200, movedCenter);

    // A raw 2x spread is deliberately softened to 2^(3/4) = 1.68x.
    expect(result.zoom).toBeCloseTo(view.zoom * 2 ** (3 / 4));
    expect(screenPoint(pagePoint, result).x).toBeCloseTo(movedCenter.x);
    expect(screenPoint(pagePoint, result).y).toBeCloseTo(movedCenter.y);
  });

  it("supports a two-finger pan without changing zoom", () => {
    const result = viewFromPinch({ view, distance: 140, center: { x: 600, y: 300 }, origin }, 140, {
      x: 570,
      y: 350,
    });
    expect(result.zoom).toBe(view.zoom);
    expect(result.panX).toBe(view.panX - 30);
    expect(result.panY).toBe(view.panY + 50);
  });

  it("filters close-finger distance noise without delaying midpoint pan", () => {
    const center = { x: 600, y: 300 };
    const result = viewFromPinch({ view, distance: 4, center, origin }, 12, {
      x: center.x + 18,
      y: center.y - 9,
    });

    expect(result.zoom).toBe(view.zoom);
    expect(result.panX).toBe(view.panX + 18);
    expect(result.panY).toBe(view.panY - 9);
  });
});

describe("keepPageReachable", () => {
  it("allows generous overscroll but keeps a paper edge at the viewport centre", () => {
    expect(
      keepPageReachable(
        { zoom: 2, panX: 2_000, panY: -2_000, gridCols: 4 },
        { width: 600, height: 800 },
      ),
    ).toEqual({ zoom: 2, panX: 600, panY: -800, gridCols: 4 });
  });

  it("progressively recentres a displaced page as it zooms out", () => {
    expect(
      keepPageReachable(
        { zoom: 0.2, panX: -500, panY: 500, gridCols: 3 },
        { width: 600, height: 800 },
      ),
    ).toEqual({ zoom: 0.2, panX: -60, panY: 80, gridCols: 3 });
  });
});

describe("wheel viewport input", () => {
  it("uses continuous small-delta zoom and remains reversible", () => {
    const focal = { x: 640, y: 330 };
    const pagePoint = pageOffsetAt(focal, view);
    const zoomed = viewFromWheelZoom(view, -4, focal, origin);

    expect(zoomed.zoom / view.zoom).toBeCloseTo(Math.exp(4 / 500));
    expect(zoomed.zoom / view.zoom).toBeLessThan(1.01);
    expect(screenPoint(pagePoint, zoomed).x).toBeCloseTo(focal.x);
    expect(screenPoint(pagePoint, zoomed).y).toBeCloseTo(focal.y);

    const restored = viewFromWheelZoom(zoomed, 4, focal, origin);
    expect(restored.zoom).toBeCloseTo(view.zoom);
    expect(restored.panX).toBeCloseTo(view.panX);
    expect(restored.panY).toBeCloseTo(view.panY);
  });

  it("normalises pixel, line, and page wheel units", () => {
    expect(wheelDeltaPixels(3, 0, 700)).toBe(3);
    expect(wheelDeltaPixels(3, 1, 700)).toBe(48);
    expect(wheelDeltaPixels(1, 2, 700)).toBe(700);
  });
});

it("serialises a single compositor transform", () => {
  expect(viewportTransform(view)).toBe("translate(40px, -30px) scale(1.25)");
});
