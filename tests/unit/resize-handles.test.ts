/**
 * Unit tests for the shared drag-to-resize machinery (resize-handles.ts) that
 * powers the editor's place-then-drag-resize tools (annotation shapes/boxes,
 * signatures, code stamps). Geometry is pure and resolution-independent, so we
 * pin the handle hit-testing, free resize (opposite edge pinned + min clamp),
 * and aspect-locked corner resize (never distorts, stays on the page).
 */
import { describe, expect, it } from "vitest";
import {
  type Box,
  CORNER_IDS,
  handleCenters,
  hitHandle,
  MIN_BOX_FRAC,
  resizeBBox,
  resizeBBoxAspect,
} from "../../src/editor/resize-handles.ts";

// A 1000×1000 device-px overlay keeps fraction→px conversions easy to read.
const W = 1000;
const H = 1000;
const box: Box = { x: 0.2, y: 0.3, w: 0.4, h: 0.2 }; // px: x 200..600, y 300..500

describe("handleCenters", () => {
  it("places the eight handles around the padded bbox", () => {
    const c = handleCenters(box, W, H);
    // Corners sit just outside the bbox (SELECT_PAD = 3px).
    expect(c.nw.x).toBeCloseTo(197);
    expect(c.nw.y).toBeCloseTo(297);
    expect(c.se.x).toBeCloseTo(603);
    expect(c.se.y).toBeCloseTo(503);
    // Edge midpoints are centered on each side.
    expect(c.n.x).toBeCloseTo((197 + 603) / 2);
    expect(c.e.y).toBeCloseTo((297 + 503) / 2);
  });
});

describe("hitHandle", () => {
  it("hits a handle within the tolerance and misses outside it", () => {
    const c = handleCenters(box, W, H);
    expect(hitHandle(box, c.se.x, c.se.y, W, H)).toBe("se");
    expect(hitHandle(box, c.se.x + 40, c.se.y + 40, W, H)).toBeNull();
  });

  it("only reports corner handles when restricted to the corner set", () => {
    const c = handleCenters(box, W, H);
    // The east edge midpoint is a handle for the full set but not the corner set.
    expect(hitHandle(box, c.e.x, c.e.y, W, H)).toBe("e");
    expect(hitHandle(box, c.e.x, c.e.y, W, H, CORNER_IDS)).toBeNull();
    expect(hitHandle(box, c.ne.x, c.ne.y, W, H, CORNER_IDS)).toBe("ne");
  });
});

describe("resizeBBox (free)", () => {
  it("drags the SE corner, pinning the NW corner", () => {
    const r = resizeBBox(box, "se", 0.1, 0.1);
    expect(r.x).toBeCloseTo(0.2); // NW pinned
    expect(r.y).toBeCloseTo(0.3);
    expect(r.w).toBeCloseTo(0.5);
    expect(r.h).toBeCloseTo(0.3);
  });

  it("drags the W edge, pinning the right edge", () => {
    const r = resizeBBox(box, "w", 0.1, 0);
    expect(r.x).toBeCloseTo(0.3);
    expect(r.w).toBeCloseTo(0.3); // right edge (0.6) stays put
    expect(r.y).toBeCloseTo(0.3); // vertical untouched
    expect(r.h).toBeCloseTo(0.2);
  });

  it("clamps to the minimum box size instead of inverting", () => {
    const r = resizeBBox(box, "se", -1, -1);
    expect(r.w).toBeCloseTo(MIN_BOX_FRAC);
    expect(r.h).toBeCloseTo(MIN_BOX_FRAC);
  });
});

describe("resizeBBoxAspect (locked corners)", () => {
  const sq: Box = { x: 0.4, y: 0.4, w: 0.2, h: 0.2 }; // square, aspect 1

  it("keeps the aspect ratio when dragging a corner", () => {
    // Pull SE outward by an uneven delta; the box must stay square.
    const r = resizeBBoxAspect(sq, "se", 0.2, 0.05, 1);
    expect(r.w / r.h).toBeCloseTo(1);
    expect(r.x).toBeCloseTo(0.4); // NW anchor pinned
    expect(r.y).toBeCloseTo(0.4);
  });

  it("preserves a non-square aspect (e.g. a wide barcode)", () => {
    const wide: Box = { x: 0.1, y: 0.4, w: 0.4, h: 0.1 }; // aspect 4
    const r = resizeBBoxAspect(wide, "se", 0.1, 0.3, 4);
    expect(r.w / r.h).toBeCloseTo(4);
  });

  it("never leaves the page when a corner is dragged past an edge", () => {
    const r = resizeBBoxAspect(sq, "se", 5, 5, 1); // yank far beyond the page
    expect(r.x + r.w).toBeLessThanOrEqual(1 + 1e-9);
    expect(r.y + r.h).toBeLessThanOrEqual(1 + 1e-9);
    expect(r.w / r.h).toBeCloseTo(1); // still square
  });

  it("pins the opposite corner when dragging NW", () => {
    const r = resizeBBoxAspect(sq, "nw", -0.1, -0.1, 1);
    // SE corner (0.6, 0.6) stays fixed.
    expect(r.x + r.w).toBeCloseTo(0.6);
    expect(r.y + r.h).toBeCloseTo(0.6);
    expect(r.w / r.h).toBeCloseTo(1);
  });

  it("falls back to free resize for an edge handle", () => {
    const r = resizeBBoxAspect(sq, "e", 0.1, 0, 1);
    expect(r.w).toBeCloseTo(0.3); // width grew, height unchanged (not locked)
    expect(r.h).toBeCloseTo(0.2);
  });
});
