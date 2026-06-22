/**
 * Unit tests for the pure pixel-analysis helpers behind Crop's auto clean-ups:
 * inkBoundingBox (trim-to-content) and detectSkewAngle (straighten). The PDF.js
 * render + rotation are browser-only (covered by the editor smoke); here we pin
 * the maths on synthetic grayscale buffers.
 */
import { describe, expect, it } from "vitest";
import { detectSkewAngle, inkBoundingBox } from "../../src/utils/pdf/page-analyze.ts";

/** A white (255) grayscale buffer. */
function blank(w: number, h: number): Uint8Array {
  return new Uint8Array(w * h).fill(255);
}

describe("inkBoundingBox", () => {
  it("finds the tight box around dark pixels", () => {
    const w = 100;
    const h = 100;
    const g = blank(w, h);
    // Ink rectangle from (20,30) to (60,70) exclusive.
    for (let y = 30; y < 70; y++) for (let x = 20; x < 60; x++) g[y * w + x] = 0;
    expect(inkBoundingBox(g, w, h)).toEqual({ x0: 20, y0: 30, x1: 60, y1: 70 });
  });

  it("returns null for a blank page", () => {
    expect(inkBoundingBox(blank(50, 50), 50, 50)).toBeNull();
  });
});

describe("detectSkewAngle", () => {
  /** Build a page of horizontal "text" rows sheared by `deg` degrees. */
  function skewed(w: number, h: number, deg: number): Uint8Array {
    const g = blank(w, h);
    const t = Math.tan((deg * Math.PI) / 180);
    for (let y0 = 30; y0 < h - 30; y0 += 18) {
      for (let x = 10; x < w - 10; x++) {
        const y = Math.round(y0 + x * t);
        // 3px-thick line so it survives subsampling.
        for (let dy = 0; dy < 3; dy++) {
          const yy = y + dy;
          if (yy >= 0 && yy < h) g[yy * w + x] = 0;
        }
      }
    }
    return g;
  }

  it("detects a positive skew angle", () => {
    const a = detectSkewAngle(skewed(400, 400, 3), 400, 400, { step: 0.25 });
    expect(a).toBeGreaterThan(2.4);
    expect(a).toBeLessThan(3.6);
  });

  it("detects a negative skew angle", () => {
    const a = detectSkewAngle(skewed(400, 400, -4), 400, 400, { step: 0.25 });
    expect(a).toBeLessThan(-3.4);
    expect(a).toBeGreaterThan(-4.6);
  });

  it("reports ~0 for straight text", () => {
    const a = detectSkewAngle(skewed(400, 400, 0), 400, 400, { step: 0.25 });
    expect(Math.abs(a)).toBeLessThan(0.6);
  });

  it("returns 0 when there's too little ink", () => {
    expect(detectSkewAngle(blank(200, 200), 200, 200)).toBe(0);
  });
});
