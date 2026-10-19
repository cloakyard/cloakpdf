/**
 * Unit tests for reading-order text selection (text-select.ts) — the ordering
 * and nearest-word hit-testing the Select-text tool maps drags onto.
 */
import { describe, expect, it } from "vite-plus/test";
import {
  nearestWordIndex,
  orderReading,
  type SelWord,
  selectedText,
  selectionRange,
  textSelectionBounds,
} from "../../src/utils/text-select.ts";

/** Word at a row (y) and column (x), each cell 0.1 wide × 0.04 tall. */
function w(text: string, col: number, row: number): SelWord {
  return { text, rect: { xPct: col * 0.1, yPct: row * 0.05, wPct: 0.09, hPct: 0.04 } };
}

describe("orderReading", () => {
  it("orders rows top-to-bottom, words left-to-right", () => {
    // Supplied out of order across two lines.
    const words = [w("world", 1, 0), w("Bye", 1, 1), w("Hello", 0, 0), w("now", 2, 1)];
    expect(orderReading(words).map((x) => x.text)).toEqual(["Hello", "world", "Bye", "now"]);
  });

  it("drops empty words", () => {
    expect(orderReading([w("a", 0, 0), w("", 1, 0)]).map((x) => x.text)).toEqual(["a"]);
  });
});

describe("nearestWordIndex", () => {
  const words = orderReading([w("Hello", 0, 0), w("world", 1, 0), w("Bye", 0, 1)]);

  it("returns the word containing the point", () => {
    // Centre of "world" (col 1, row 0).
    expect(words[nearestWordIndex(words, 0.14, 0.02)].text).toBe("world");
  });

  it("snaps to the closest word when the point is in whitespace", () => {
    // Far below everything → nearest is the last row's word.
    expect(words[nearestWordIndex(words, 0.02, 0.9)].text).toBe("Bye");
  });

  it("returns -1 for no words", () => {
    expect(nearestWordIndex([], 0.5, 0.5)).toBe(-1);
  });
});

describe("selectionRange + selectedText", () => {
  const words = orderReading([w("The", 0, 0), w("quick", 1, 0), w("brown", 2, 0), w("fox", 0, 1)]);

  it("normalises anchor/focus order", () => {
    expect(selectionRange(3, 1)).toEqual([1, 3]);
    expect(selectionRange(0, 2)).toEqual([0, 2]);
  });

  it("joins the selected words across lines", () => {
    const [lo, hi] = selectionRange(1, 3);
    expect(selectedText(words, lo, hi)).toBe("quick brown fox");
  });

  it("returns empty for an unset selection", () => {
    expect(selectedText(words, -1, -1)).toBe("");
  });
});

describe("selection ink bounds", () => {
  const tr = [20, 0, 0, 20, 50, 100];
  const style = { ascent: 0.8, descent: -0.2 };
  it("includes descenders below the baseline, including a small ink allowance", () => {
    const r = textSelectionBounds(tr, 100, 20, style, (x, y) => [x, 300 - y]);
    expect(r).toEqual({ x: 50, y: 183, width: 100, height: 22 });
  });
  it("preserves ink bounds under cropped, rotated and scaled viewports", () => {
    const r = textSelectionBounds(tr, 100, 20, style, (x, y) => [(y - 30) * 2, (x - 20) * 2]);
    expect(r).toEqual({ x: 130, y: 60, width: 44, height: 200 });
  });
  it("covers all four corners of independently rotated text", () => {
    const r = textSelectionBounds([0, 20, -20, 0, 50, 100], 100, 20, style, (x, y) => [x, y]);
    expect(r.x).toBeCloseTo(33);
    expect(r.y).toBeCloseTo(100);
    expect(r.width).toBeCloseTo(22);
    expect(r.height).toBeCloseTo(100);
  });
  it("has conservative bounds without font metrics and for vertical runs", () => {
    const fallback = textSelectionBounds(tr, 100, 20, {}, (x, y) => [x, y]);
    expect(fallback).toEqual({ x: 50, y: 94, width: 100, height: 27 });
    const vertical = textSelectionBounds(tr, 20, 100, { ...style, vertical: true }, (x, y) => [
      x,
      y,
    ]);
    expect(vertical.x).toBeCloseTo(45);
    expect(vertical.y).toBeCloseTo(0);
    expect(vertical.width).toBeCloseTo(22);
    expect(vertical.height).toBeCloseTo(100);
  });
});

describe("rotated page reading order", () => {
  it.each([0, 90, 180, 270])("preserves paragraph order at %i degrees", (rotation) => {
    const original = [w("First", 0, 0), w("line", 1, 0), w("Second", 0, 1)];
    const visible = original
      .map((word) => {
        const r = word.rect;
        const rect =
          rotation === 90
            ? { xPct: 1 - r.yPct - r.hPct, yPct: r.xPct, wPct: r.hPct, hPct: r.wPct }
            : rotation === 180
              ? { ...r, xPct: 1 - r.xPct - r.wPct, yPct: 1 - r.yPct - r.hPct }
              : rotation === 270
                ? { xPct: r.yPct, yPct: 1 - r.xPct - r.wPct, wPct: r.hPct, hPct: r.wPct }
                : r;
        return { ...word, rect };
      })
      .reverse();
    expect(orderReading(visible, rotation).map((word) => word.text)).toEqual([
      "First",
      "line",
      "Second",
    ]);
  });
});

it("selection bounds follow a sheared text matrix instead of dropping its slant", () => {
  const bounds = textSelectionBounds(
    [20, 0, 10, 20, 50, 100],
    100,
    Math.hypot(10, 20),
    { ascent: 0.8, descent: -0.2 },
    (x, y) => [x, y],
  );
  expect(bounds.x).toBeCloseTo(47.5);
  expect(bounds.y).toBeCloseTo(95);
  expect(bounds.width).toBeCloseTo(111);
  expect(bounds.height).toBeCloseTo(22);
});
