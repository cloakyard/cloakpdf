/**
 * Unit tests for the self-contained QR encoder (qr.ts).
 *
 * Scannability (the payload decoding back correctly) is the real contract; that
 * was verified out-of-band by rendering the matrix and decoding it with jsQR
 * across payloads spanning versions 1–40 and all four EC levels. jsQR is not a
 * project dependency, so here we pin the deterministic, decoder-free invariants:
 * version/size selection, the fixed function patterns (finders, timing, dark
 * module), determinism, and the capacity limit.
 */
import { describe, expect, it } from "vitest";
import { encodeQr } from "../../src/utils/pdf/qr.ts";

describe("encodeQr", () => {
  it("selects the smallest version that fits (size = 4·version + 17)", () => {
    expect(encodeQr("A", "M").size).toBe(21); // version 1
    expect(encodeQr("https://cloakpdf.app", "M").size).toBe(25); // version 2
    // Every size is a valid QR side length in [21, 177].
    for (const text of ["", "x".repeat(50), "y".repeat(400), "z".repeat(1000)]) {
      const { size } = encodeQr(text, "M");
      expect((size - 17) % 4).toBe(0);
      expect(size).toBeGreaterThanOrEqual(21);
      expect(size).toBeLessThanOrEqual(177);
    }
  });

  it("grows the version monotonically with payload length", () => {
    const a = encodeQr("x".repeat(10), "M").size;
    const b = encodeQr("x".repeat(100), "M").size;
    const c = encodeQr("x".repeat(1000), "M").size;
    expect(a).toBeLessThanOrEqual(b);
    expect(b).toBeLessThan(c);
  });

  it("needs a larger version for stronger error correction", () => {
    const body = "x".repeat(120);
    expect(encodeQr(body, "L").size).toBeLessThanOrEqual(encodeQr(body, "H").size);
  });

  it("draws the three finder patterns", () => {
    const qr = encodeQr("hello", "M");
    const s = qr.size;
    // Finder = dark 3×3 core, light ring, dark border; separator ring is light.
    for (const [oy, ox] of [
      [0, 0],
      [0, s - 7],
      [s - 7, 0],
    ]) {
      expect(qr.isDark(oy + 3, ox + 3)).toBe(true); // centre
      expect(qr.isDark(oy + 1, ox + 1)).toBe(false); // inner light ring
      expect(qr.isDark(oy + 0, ox + 3)).toBe(true); // outer border
      expect(qr.isDark(oy + 6, ox + 6)).toBe(true); // opposite border corner
    }
  });

  it("draws the alternating timing pattern on row/col 6", () => {
    const qr = encodeQr("timing", "M");
    // Between the finders, row 6 and column 6 alternate dark/light on even index.
    for (let i = 8; i < qr.size - 8; i++) {
      expect(qr.isDark(6, i)).toBe(i % 2 === 0);
      expect(qr.isDark(i, 6)).toBe(i % 2 === 0);
    }
  });

  it("sets the always-dark module", () => {
    const qr = encodeQr("dark-module", "M");
    expect(qr.isDark(qr.size - 8, 8)).toBe(true);
  });

  it("is deterministic for the same input", () => {
    const a = encodeQr("https://cloakpdf.app/verify?doc=8f3a", "M");
    const b = encodeQr("https://cloakpdf.app/verify?doc=8f3a", "M");
    expect(a.size).toBe(b.size);
    for (let r = 0; r < a.size; r++)
      for (let c = 0; c < a.size; c++) expect(a.isDark(r, c)).toBe(b.isDark(r, c));
  });

  it("throws when the payload exceeds the largest version", () => {
    expect(() => encodeQr("9".repeat(5000), "H")).toThrow(/too long/);
  });
});
