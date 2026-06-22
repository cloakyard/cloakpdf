/**
 * Reading-order text selection over positioned words — the maths behind the
 * editor's "Select text" tool, which lets you drag across a page to select the
 * real text (like a PDF reader) and then highlight / box / redact / copy it.
 *
 * Kept framework-free and pure so the ordering + hit-testing unit-test without a
 * browser; the tool wires these to PDF.js page geometry and pointer events.
 */

/** A rectangle as fractions (0–1) of page width/height, top-left origin. */
export interface FracRect {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

/** One positioned word: its box (page fractions) and text. */
export interface SelWord {
  rect: FracRect;
  text: string;
}

/**
 * Sort positioned words into human reading order: group into rows by vertical
 * overlap (text on the same line), order rows top-to-bottom, and words
 * left-to-right within each row. `rowTol` is the fraction of a word's height two
 * words may differ in `y` and still count as the same row. Pure.
 */
export function orderReading(words: SelWord[], rowTol = 0.6): SelWord[] {
  const ws = words.filter((w) => w.text.length > 0);
  if (ws.length === 0) return [];
  const sorted = [...ws].sort((a, b) => a.rect.yPct - b.rect.yPct);
  const rows: SelWord[][] = [];
  for (const w of sorted) {
    const row = rows[rows.length - 1];
    if (row) {
      const ref = row[0].rect;
      const tol = Math.max(ref.hPct, w.rect.hPct) * rowTol;
      // Same row when the vertical centres are within tolerance.
      const refMid = ref.yPct + ref.hPct / 2;
      const wMid = w.rect.yPct + w.rect.hPct / 2;
      if (Math.abs(refMid - wMid) <= tol) {
        row.push(w);
        continue;
      }
    }
    rows.push([w]);
  }
  return rows.flatMap((row) => [...row].sort((a, b) => a.rect.xPct - b.rect.xPct));
}

/** Distance² from a point to the nearest spot on (or in) a rect. */
function distToRect(r: FracRect, x: number, y: number): number {
  const dx = x < r.xPct ? r.xPct - x : x > r.xPct + r.wPct ? x - (r.xPct + r.wPct) : 0;
  const dy = y < r.yPct ? r.yPct - y : y > r.yPct + r.hPct ? y - (r.yPct + r.hPct) : 0;
  return dx * dx + dy * dy;
}

/**
 * Index of the word nearest to a point: the word whose box contains the point,
 * else the closest by edge distance. Returns -1 for an empty list. Pure.
 */
export function nearestWordIndex(words: SelWord[], x: number, y: number): number {
  let best = -1;
  let bestD = Number.POSITIVE_INFINITY;
  for (let i = 0; i < words.length; i++) {
    const d = distToRect(words[i].rect, x, y);
    if (d === 0) return i; // inside a word — exact hit
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** Inclusive [lo, hi] selection range from an anchor + focus index (any order). */
export function selectionRange(anchor: number, focus: number): [number, number] {
  return anchor <= focus ? [anchor, focus] : [focus, anchor];
}

/** The selected words' boxes, in reading order, for the inclusive range. */
export function selectedRects(words: SelWord[], lo: number, hi: number): FracRect[] {
  if (lo < 0 || hi < 0) return [];
  return words.slice(lo, hi + 1).map((w) => w.rect);
}

/** The selected text, words joined by single spaces. */
export function selectedText(words: SelWord[], lo: number, hi: number): string {
  if (lo < 0 || hi < 0) return "";
  return words
    .slice(lo, hi + 1)
    .map((w) => w.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
