/**
 * Unit tests for reading-order text selection (text-select.ts) — the ordering
 * and nearest-word hit-testing the Select-text tool maps drags onto.
 */
import { describe, expect, it } from "vitest";
import {
  nearestWordIndex,
  orderReading,
  type SelWord,
  selectedText,
  selectionRange,
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
