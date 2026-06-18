/**
 * Unit tests for the pure geometry helpers in layout-extract.ts.
 *
 * These cover the maths that turns liteparse's point-space items into the
 * page-fraction rectangles RedactPdf consumes, plus reading-order
 * reconstruction. The wasm extraction itself is exercised by the browser
 * smoke (it needs a real Vite/WebAssembly environment); here we pin the
 * shape-normalisation and coordinate logic that must stay correct for
 * redaction to land on the right place.
 */
import { describe, expect, it } from "vitest";
import {
  detectHeadings,
  detectPiiRects,
  detectRunningFurniture,
  findTextRects,
  type FurnitureGroup,
  furnitureCropMargins,
  itemFractionRect,
  type LayoutItem,
  type LayoutPage,
  layoutToMarkdown,
  layoutToPlainText,
  layoutToReadingOrderText,
  normalizeParseResult,
  substringFractionRect,
} from "../../src/utils/layout-extract.ts";

function item(partial: Partial<LayoutItem>): LayoutItem {
  return { text: "", x: 0, y: 0, width: 0, height: 0, fontSize: 0, ...partial };
}
function page(partial: Partial<LayoutPage>): LayoutPage {
  return { pageNumber: 1, width: 100, height: 200, text: "", items: [], ...partial };
}

describe("normalizeParseResult", () => {
  it("maps raw liteparse pages to typed LayoutPages", () => {
    const out = normalizeParseResult({
      pages: [
        {
          pageNum: 1,
          width: 595,
          height: 842,
          text: "hello",
          textItems: [{ text: "a", x: 1, y: 2, width: 3, height: 4, fontSize: 5 }],
        },
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ pageNumber: 1, width: 595, height: 842, text: "hello" });
    expect(out[0].items[0]).toEqual({ text: "a", x: 1, y: 2, width: 3, height: 4, fontSize: 5 });
  });

  it("drops items with no coordinates and defaults missing fields", () => {
    const out = normalizeParseResult({
      pages: [{ textItems: [{ text: "keep", x: 0, y: 0 }, { text: "drop — no coords" }] }],
    });
    expect(out[0].pageNumber).toBe(1); // falls back to index+1
    expect(out[0].items).toHaveLength(1);
    expect(out[0].items[0]).toMatchObject({ text: "keep", width: 0, height: 0, fontSize: 0 });
  });

  it("handles null / empty input", () => {
    expect(normalizeParseResult(null)).toEqual([]);
    expect(normalizeParseResult({})).toEqual([]);
  });
});

describe("itemFractionRect", () => {
  it("converts point-space box to page fractions (top-left origin, no flip)", () => {
    const p = page({ width: 200, height: 400 });
    const r = itemFractionRect(item({ x: 50, y: 100, width: 100, height: 20 }), p);
    expect(r).toEqual({ xPct: 0.25, yPct: 0.25, wPct: 0.5, hPct: 0.05 });
  });

  it("clamps out-of-range coordinates into [0,1]", () => {
    const p = page({ width: 100, height: 100 });
    const r = itemFractionRect(item({ x: -10, y: 120, width: 999, height: 50 }), p);
    expect(r.xPct).toBe(0);
    expect(r.yPct).toBe(1);
    expect(r.wPct).toBe(1);
  });
});

describe("substringFractionRect", () => {
  it("locates a substring by proportional character offset (no pad)", () => {
    const p = page({ width: 100, height: 200 });
    // text length 10, spans the full page width → 10pt per char
    const it = item({ text: "0123456789", x: 0, y: 50, width: 100, height: 10 });
    const r = substringFractionRect(it, p, 2, 5, 0);
    expect(r.xPct).toBeCloseTo(0.2, 5);
    expect(r.wPct).toBeCloseTo(0.3, 5);
    expect(r.yPct).toBeCloseTo(0.25, 5);
    expect(r.hPct).toBeCloseTo(0.05, 5);
  });

  it("pads outward so the match is never left exposed, clamped to the item", () => {
    const p = page({ width: 100, height: 200 });
    const it = item({ text: "0123456789", x: 0, y: 0, width: 100, height: 10 });
    const padded = substringFractionRect(it, p, 2, 5, 0.75);
    const tight = substringFractionRect(it, p, 2, 5, 0);
    expect(padded.xPct).toBeLessThan(tight.xPct);
    expect(padded.wPct).toBeGreaterThan(tight.wPct);
    // never extends past the item's own box
    const full = substringFractionRect(it, p, 0, it.text.length, 5);
    expect(full.xPct).toBe(0);
    expect(full.wPct).toBeCloseTo(1, 5);
  });

  it("floors to a visible box when item.width is 0 (would otherwise leave PII exposed)", () => {
    const p = page({ width: 100, height: 200 });
    // A bogus width:0 item must not collapse the redaction box to zero area.
    const r = substringFractionRect(
      item({ text: "0123456789", x: 0, y: 50, width: 0, height: 10 }),
      p,
      2,
      5,
    );
    expect(r.wPct).toBeGreaterThan(0);
    expect(r.hPct).toBeGreaterThan(0);
  });
});

describe("layoutToReadingOrderText", () => {
  it("orders two columns top-to-bottom, left-to-right within a row", () => {
    const p = page({
      items: [
        item({ text: "RIGHT-TOP", x: 300, y: 10, width: 80, height: 10 }),
        item({ text: "LEFT-TOP", x: 10, y: 10, width: 80, height: 10 }),
        item({ text: "RIGHT-BOT", x: 300, y: 40, width: 80, height: 10 }),
        item({ text: "LEFT-BOT", x: 10, y: 40, width: 80, height: 10 }),
      ],
    });
    expect(layoutToReadingOrderText(p)).toBe("LEFT-TOP RIGHT-TOP\nLEFT-BOT RIGHT-BOT");
  });

  it("groups items within the row tolerance onto one line", () => {
    const p = page({
      items: [
        item({ text: "a", x: 0, y: 10, width: 5, height: 10 }),
        item({ text: "b", x: 10, y: 12, width: 5, height: 10 }), // within 3pt tolerance
        item({ text: "c", x: 0, y: 40, width: 5, height: 10 }),
      ],
    });
    expect(layoutToReadingOrderText(p)).toBe("a b\nc");
  });

  it("falls back to liteparse page text when there are no items", () => {
    expect(layoutToReadingOrderText(page({ items: [], text: "  raw text  " }))).toBe("raw text");
  });
});

describe("detectHeadings", () => {
  // A long body line (≥25 chars) so it votes for the body font size.
  const body = (y: number) =>
    item({
      text: "This is an ordinary paragraph line of body copy, well over twenty-five characters.",
      x: 0,
      y,
      width: 400,
      height: 11,
    });

  it("detects large + ALL-CAPS headings and excludes body lines", () => {
    const p = page({
      items: [
        item({ text: "Annual Report 2025", x: 0, y: 10, width: 200, height: 24 }),
        item({ text: "FINANCIAL OVERVIEW", x: 0, y: 60, width: 180, height: 14 }),
        body(90),
        body(110),
        body(130),
      ],
    });
    expect(detectHeadings([p]).map((h) => h.text)).toEqual([
      "Annual Report 2025",
      "FINANCIAL OVERVIEW",
    ]);
  });

  it("bands nesting levels by font size (largest = level 1)", () => {
    const p = page({
      items: [
        item({ text: "Big Title", x: 0, y: 10, width: 200, height: 24 }),
        item({ text: "SECTION", x: 0, y: 60, width: 120, height: 14 }),
        body(90),
        body(110),
        body(130),
      ],
    });
    const heads = detectHeadings([p]);
    expect(heads.find((h) => h.text === "Big Title")?.level).toBe(1);
    expect(heads.find((h) => h.text === "SECTION")?.level).toBe(2);
  });

  it("detects a short ALL-CAPS label even at body size", () => {
    const p = page({
      items: [
        item({ text: "CONTACT", x: 0, y: 10, width: 60, height: 11 }),
        body(40),
        body(60),
        body(80),
      ],
    });
    expect(detectHeadings([p]).map((h) => h.text)).toContain("CONTACT");
  });

  it("skips page numbers + TOC dot-leaders and returns nothing for body-only pages", () => {
    const p = page({
      items: [
        item({ text: "12", x: 0, y: 10, width: 10, height: 11 }), // no letters → skipped
        item({ text: "Introduction......... 3", x: 0, y: 30, width: 200, height: 14 }), // dot-leaders → skipped
        body(60),
        body(80),
        body(100),
      ],
    });
    expect(detectHeadings([p])).toHaveLength(0);
  });
});

describe("detectPiiRects", () => {
  it("maps a PII span inside an item to a redaction rect on the right page", () => {
    const p = page({
      pageNumber: 2,
      width: 600,
      height: 800,
      items: [
        item({ text: "admin@slicedinvoices.com", x: 60, y: 200, width: 180, height: 10 }),
        item({ text: "Web Design service", x: 60, y: 240, width: 120, height: 10 }),
      ],
    });
    const rects = detectPiiRects([p], ["email"]);
    expect(rects).toHaveLength(1);
    expect(rects[0]).toMatchObject({
      pageIndex: 1,
      type: "email",
      value: "admin@slicedinvoices.com",
    });
    // The rect lands on the email item's row (yPct ≈ 200/800) and is within [0,1].
    expect(rects[0].yPct).toBeCloseTo(0.25, 4);
    expect(rects[0].xPct).toBeGreaterThanOrEqual(0);
    expect(rects[0].xPct + rects[0].wPct).toBeLessThanOrEqual(1);
  });

  it("locates a mid-item match (offset > 0) further right than a leading one", () => {
    // Full-width item so the substring's char offset maps onto page fractions.
    const p = page({
      width: 600,
      height: 800,
      items: [item({ text: "Mail: x@y.com", x: 0, y: 10, width: 600, height: 10 })],
    });
    const [rect] = detectPiiRects([p], ["email"]);
    // "x@y.com" starts at char 6 of 13 → roughly the right half of the item.
    expect(rect.xPct).toBeGreaterThan(0.3);
  });

  it("respects the type filter", () => {
    const p = page({
      width: 600,
      height: 800,
      items: [item({ text: "call 123-456-7890", x: 0, y: 10, width: 100, height: 10 })],
    });
    expect(detectPiiRects([p], ["email"])).toHaveLength(0);
    expect(detectPiiRects([p], ["phone"])).toHaveLength(1);
  });

  it("covers a phone split across word-items on one row (OCR/PDF.js word split)", () => {
    // Tesseract emits one item per word, so "123 456 7890" arrives split. Per-item
    // detection would miss it entirely; row-based detection must catch it and the
    // box must span all three words.
    const p = page({
      width: 600,
      height: 800,
      items: [
        item({ text: "123", x: 0, y: 100, width: 30, height: 12 }),
        item({ text: "456", x: 40, y: 100, width: 30, height: 12 }),
        item({ text: "7890", x: 80, y: 100, width: 40, height: 12 }),
      ],
    });
    const rects = detectPiiRects([p], ["phone"]);
    expect(rects).toHaveLength(1);
    expect(rects[0].type).toBe("phone");
    expect(rects[0].xPct).toBeLessThan(0.05); // starts at the first word (x≈0)
    const right = rects[0].xPct + rects[0].wPct;
    expect(right).toBeGreaterThan(80 / 600); // extends across to the last word
    expect(right).toBeLessThanOrEqual(1);
  });

  it("does not merge values that sit on different rows", () => {
    // Two unrelated numbers on different lines must not be joined into one match.
    const p = page({
      width: 600,
      height: 800,
      items: [
        item({ text: "555", x: 0, y: 100, width: 30, height: 12 }),
        item({ text: "999", x: 0, y: 400, width: 30, height: 12 }),
      ],
    });
    // Neither lone 3-digit token is a phone (needs ≥7 digits across ≥2 groups).
    expect(detectPiiRects([p], ["phone"])).toHaveLength(0);
  });

  it("never emits a zero-area box for a detected match on a width-0 item", () => {
    const p = page({
      width: 600,
      height: 800,
      items: [item({ text: "admin@slicedinvoices.com", x: 60, y: 200, width: 0, height: 10 })],
    });
    const [rect] = detectPiiRects([p], ["email"]);
    expect(rect).toBeDefined();
    expect(rect.wPct).toBeGreaterThan(0);
    expect(rect.hPct).toBeGreaterThan(0);
  });
});

describe("findTextRects", () => {
  it("finds every case-insensitive occurrence with page geometry + context", () => {
    const p = page({
      pageNumber: 3,
      width: 600,
      height: 800,
      items: [
        item({
          text: "Contact John about the John Deere invoice",
          x: 0,
          y: 100,
          width: 420,
          height: 10,
        }),
      ],
    });
    const hits = findTextRects([p], ["john"]);
    expect(hits).toHaveLength(2);
    expect(hits[0]).toMatchObject({ pageIndex: 2, pageNumber: 3, term: "john", value: "John" });
    // both land on the same row, and the second occurrence sits further right
    expect(hits.every((h) => Math.abs(h.yPct - 100 / 800) < 0.02)).toBe(true);
    expect(hits[1].xPct).toBeGreaterThan(hits[0].xPct);
  });

  it("respects caseSensitive", () => {
    const p = page({
      items: [item({ text: "John and john", x: 0, y: 10, width: 120, height: 10 })],
    });
    expect(findTextRects([p], ["John"], { caseSensitive: true })).toHaveLength(1);
    expect(findTextRects([p], ["John"], { caseSensitive: false })).toHaveLength(2);
  });

  it("wholeWord skips the term inside larger words", () => {
    const p = page({
      items: [item({ text: "Sam met Samuel and Samantha", x: 0, y: 10, width: 260, height: 10 })],
    });
    expect(findTextRects([p], ["Sam"], { wholeWord: false }).length).toBeGreaterThanOrEqual(3);
    const whole = findTextRects([p], ["Sam"], { wholeWord: true });
    expect(whole).toHaveLength(1);
    expect(whole[0].value).toBe("Sam");
  });

  it("matches a term split across word-items on a row (OCR / PDF.js split)", () => {
    const p = page({
      width: 600,
      height: 800,
      items: [
        item({ text: "John", x: 0, y: 100, width: 40, height: 12 }),
        item({ text: "Doe", x: 50, y: 100, width: 30, height: 12 }),
      ],
    });
    const hits = findTextRects([p], ["John Doe"]);
    expect(hits).toHaveLength(1);
    expect(hits[0].value).toBe("John Doe");
    expect(hits[0].xPct).toBeLessThan(0.05);
    expect(hits[0].xPct + hits[0].wPct).toBeGreaterThan(50 / 600);
  });

  it("searches several terms, deduped, ordered by page then top-to-bottom", () => {
    const p1 = page({
      pageNumber: 1,
      width: 600,
      height: 800,
      items: [
        item({ text: "alpha", x: 0, y: 400, width: 50, height: 10 }),
        item({ text: "beta", x: 0, y: 100, width: 40, height: 10 }),
      ],
    });
    const p2 = page({
      pageNumber: 2,
      width: 600,
      height: 800,
      items: [item({ text: "alpha again", x: 0, y: 50, width: 90, height: 10 })],
    });
    const hits = findTextRects([p1, p2], ["alpha", "beta", "alpha"]);
    expect(hits.map((h) => h.value)).toEqual(["beta", "alpha", "alpha"]);
    expect(hits.map((h) => h.pageNumber)).toEqual([1, 1, 2]);
  });

  it("collapses case-variant terms in a case-insensitive search (no doubled hits)", () => {
    const p = page({
      items: [item({ text: "John and john", x: 0, y: 10, width: 120, height: 10 })],
    });
    // Case-insensitive: "John" and "john" fold to one term → each occurrence once.
    expect(findTextRects([p], ["John", "john"])).toHaveLength(2);
    // Case-sensitive: they stay distinct, but each still matches exactly once.
    expect(findTextRects([p], ["John", "john"], { caseSensitive: true })).toHaveLength(2);
  });

  it("ignores blank terms and returns nothing on a miss", () => {
    const p = page({
      items: [item({ text: "nothing here", x: 0, y: 10, width: 100, height: 10 })],
    });
    expect(findTextRects([p], ["  ", ""])).toHaveLength(0);
    expect(findTextRects([p], ["zzz"])).toHaveLength(0);
  });

  it("captures the line + match offsets for the hit-list", () => {
    const p = page({
      items: [item({ text: "Email: bob@x.com now", x: 0, y: 10, width: 200, height: 10 })],
    });
    const [hit] = findTextRects([p], ["bob@x.com"]);
    expect(hit.line).toBe("Email: bob@x.com now");
    expect(hit.line.slice(hit.matchStart, hit.matchEnd)).toBe("bob@x.com");
  });
});

describe("layoutToPlainText", () => {
  it("joins pages' reading-order text, separated by a blank line", () => {
    const p1 = page({
      pageNumber: 1,
      items: [
        item({ text: "Hello", x: 0, y: 10, width: 50, height: 10 }),
        item({ text: "World", x: 0, y: 40, width: 50, height: 10 }),
      ],
    });
    const p2 = page({
      pageNumber: 2,
      items: [item({ text: "Second page", x: 0, y: 10, width: 90, height: 10 })],
    });
    expect(layoutToPlainText([p1, p2])).toBe("Hello\nWorld\n\nSecond page\n");
  });

  it("returns an empty string when there is no text", () => {
    expect(layoutToPlainText([page({ items: [] })])).toBe("");
  });

  it("reads two columns top-to-bottom each (not interleaved across the gutter)", () => {
    const p = page({
      width: 600,
      height: 800,
      items: [
        item({ text: "Left one", x: 20, y: 100, width: 200, height: 11 }),
        item({ text: "Right one", x: 340, y: 100, width: 200, height: 11 }),
        item({ text: "Left two", x: 20, y: 130, width: 200, height: 11 }),
        item({ text: "Right two", x: 340, y: 130, width: 200, height: 11 }),
        item({ text: "Left three", x: 20, y: 160, width: 200, height: 11 }),
        item({ text: "Right three", x: 340, y: 160, width: 200, height: 11 }),
      ],
    });
    expect(layoutToPlainText([p])).toBe(
      "Left one\nLeft two\nLeft three\nRight one\nRight two\nRight three\n",
    );
  });

  it("keeps a single-column page in y-order (no false split)", () => {
    const p = page({
      width: 600,
      height: 800,
      items: [
        item({ text: "First line of the paragraph", x: 20, y: 100, width: 400, height: 11 }),
        item({ text: "Second line of the paragraph", x: 20, y: 130, width: 400, height: 11 }),
        item({ text: "Third line of the paragraph", x: 20, y: 160, width: 400, height: 11 }),
      ],
    });
    expect(layoutToPlainText([p])).toBe(
      "First line of the paragraph\nSecond line of the paragraph\nThird line of the paragraph\n",
    );
  });
});

describe("layoutToMarkdown", () => {
  // A long body line (≥25 chars) so it votes for the body font size.
  const bodyLine = (y: number) =>
    item({
      text: "This is an ordinary paragraph line of body copy, well over twenty-five characters.",
      x: 0,
      y,
      width: 400,
      height: 11,
    });

  it("promotes detected headings to ATX headings, banded by size, and keeps body text", () => {
    const p = page({
      items: [
        item({ text: "Big Title", x: 0, y: 10, width: 200, height: 24 }),
        item({ text: "SECTION", x: 0, y: 60, width: 120, height: 14 }),
        bodyLine(90),
        bodyLine(110),
        bodyLine(130),
      ],
    });
    const md = layoutToMarkdown([p]);
    expect(md).toContain("# Big Title");
    expect(md).toContain("## SECTION");
    expect(md).toContain("This is an ordinary paragraph line");
  });

  it("emits plain paragraphs (no #) when heading inference is disabled", () => {
    const p = page({
      items: [
        item({ text: "Big Title", x: 0, y: 10, width: 200, height: 24 }),
        bodyLine(60),
        bodyLine(80),
        bodyLine(100),
      ],
    });
    const md = layoutToMarkdown([p], { headings: false });
    expect(md).not.toContain("#");
    expect(md).toContain("Big Title");
  });

  it("does not promote a wordless ligature fragment to a heading", () => {
    // Some PDFs emit stray "fi"/"fl" ligature glyphs as their own larger-set
    // items; they must stay body text, never become `# fi`.
    const p = page({
      items: [
        item({ text: "fi", x: 0, y: 10, width: 20, height: 24 }),
        bodyLine(60),
        bodyLine(80),
        bodyLine(100),
      ],
    });
    const md = layoutToMarkdown([p]);
    expect(md).not.toContain("# fi");
    expect(md).toContain("fi");
  });
});

describe("detectRunningFurniture", () => {
  // Four pages sharing a top header + a bottom page number; body text differs.
  const built = (pageNumber: number, body: string) =>
    page({
      pageNumber,
      width: 600,
      height: 800,
      items: [
        item({ text: "Annual Report 2025", x: 40, y: 24, width: 220, height: 12 }),
        item({ text: body, x: 40, y: 300, width: 400, height: 11 }),
        item({ text: String(pageNumber), x: 300, y: 770, width: 12, height: 12 }),
      ],
    });
  const pages = [
    built(1, "Intro paragraph one"),
    built(2, "Body paragraph two"),
    built(3, "Body paragraph three"),
    built(4, "Body paragraph four"),
  ];

  it("detects a running header and recurring page numbers, ignoring body text", () => {
    const groups = detectRunningFurniture(pages);
    const header = groups.find((g) => g.region === "top");
    const folio = groups.find((g) => g.region === "bottom");
    expect(header).toBeDefined();
    expect(header?.kind).toBe("header");
    expect(header?.sampleText).toBe("Annual Report 2025");
    expect(header?.pageCount).toBe(4);
    expect(folio?.kind).toBe("page-number");
    expect(folio?.pageCount).toBe(4);
    // No body line became furniture (each page's body text is unique).
    expect(groups).toHaveLength(2);
  });

  it("reports margins that trim into the margin but never the body", () => {
    const { topPct, bottomPct } = furnitureCropMargins(detectRunningFurniture(pages));
    expect(topPct).toBeGreaterThan(0.04);
    expect(bottomPct).toBeGreaterThan(0);
    // header bottom ≈ 36/800 = 0.045; body top = 300/800 = 0.375 — the cut sits
    // between them, well clear of the body.
    expect(topPct).toBeLessThan(0.375);
  });

  it("returns nothing when text does not recur (body-only pages)", () => {
    const bodyOnly = [1, 2, 3].map((n) =>
      page({
        pageNumber: n,
        width: 600,
        height: 800,
        items: [item({ text: `Unique line ${n}`, x: 40, y: 300, width: 400, height: 11 })],
      }),
    );
    expect(detectRunningFurniture(bodyOnly)).toHaveLength(0);
  });

  it("needs at least 3 pages to call something running", () => {
    expect(detectRunningFurniture([pages[0], pages[1]])).toHaveLength(0);
  });
});

describe("furnitureCropMargins", () => {
  it("takes the deepest selected band on each edge", () => {
    const groups: FurnitureGroup[] = [
      {
        id: "top-0",
        region: "top",
        kind: "header",
        sampleText: "h",
        pageCount: 5,
        marginPct: 0.05,
      },
      {
        id: "top-1",
        region: "top",
        kind: "page-number",
        sampleText: "",
        pageCount: 5,
        marginPct: 0.09,
      },
      {
        id: "bottom-0",
        region: "bottom",
        kind: "footer",
        sampleText: "f",
        pageCount: 5,
        marginPct: 0.07,
      },
    ];
    expect(furnitureCropMargins(groups)).toEqual({ topPct: 0.09, bottomPct: 0.07 });
  });

  it("returns zero margins for an empty selection", () => {
    expect(furnitureCropMargins([])).toEqual({ topPct: 0, bottomPct: 0 });
  });
});
