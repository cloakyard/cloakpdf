/**
 * wrapTextToWidth — the word-wrap shared by the text-box burn path and its
 * on-canvas preview. A monospace measure (every char = 1 unit) makes line
 * breaks exact and assertable.
 *
 * Guards: greedy fill (as many words as fit), honouring explicit newlines
 * (including blank lines), and breaking a single word longer than the box so it
 * never silently overflows.
 */
import { describe, expect, it } from "vitest";
import { wrapTextToWidth } from "../../src/utils/pdf-operations.ts";

/** Width = character count (a perfect monospace font). */
const mono = (s: string) => s.length;

describe("wrapTextToWidth", () => {
  it("greedily fills lines up to the width", () => {
    // "the cat sat" → width 7: "the cat"(7) fits, "the cat sat"(11) doesn't.
    expect(wrapTextToWidth("the cat sat on", 7, mono)).toEqual(["the cat", "sat on"]);
  });

  it("keeps explicit newlines, including blank lines", () => {
    expect(wrapTextToWidth("a\n\nb", 10, mono)).toEqual(["a", "", "b"]);
  });

  it("breaks a word longer than the box", () => {
    expect(wrapTextToWidth("abcdefgh", 3, mono)).toEqual(["abc", "def", "gh"]);
  });

  it("breaks a too-long word that follows a fitting word", () => {
    expect(wrapTextToWidth("hi abcdef", 3, mono)).toEqual(["hi", "abc", "def"]);
  });

  it("returns paragraphs unwrapped when the width is non-positive", () => {
    expect(wrapTextToWidth("a b\nc", 0, mono)).toEqual(["a b", "c"]);
  });
});
