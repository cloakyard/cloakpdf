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
 * left-to-right within each row. Undo the page's display rotation for ordering;
 * retain each word's visible rectangle for hit testing and painting. Pure.
 */
export function orderReading(words: SelWord[], rotation = 0): SelWord[] {
  const readingRect = ({ rect: r }: SelWord) => {
    switch (((rotation % 360) + 360) % 360) {
      case 90:
        return { xPct: r.yPct, yPct: 1 - r.xPct - r.wPct, wPct: r.hPct, hPct: r.wPct };
      case 180:
        return { ...r, xPct: 1 - r.xPct - r.wPct, yPct: 1 - r.yPct - r.hPct };
      case 270:
        return { xPct: 1 - r.yPct - r.hPct, yPct: r.xPct, wPct: r.hPct, hPct: r.wPct };
      default:
        return r;
    }
  };
  const ws = words.filter((w) => w.text.length > 0);
  if (ws.length === 0) return [];
  const sorted = [...ws].sort((a, b) => readingRect(a).yPct - readingRect(b).yPct);
  const rows: SelWord[][] = [];
  for (const w of sorted) {
    const row = rows[rows.length - 1];
    if (row) {
      const ref = readingRect(row[0]);
      const rect = readingRect(w);
      const tol = Math.max(ref.hPct, rect.hPct) * 0.6;
      // Same row when the vertical centres are within tolerance.
      const refMid = ref.yPct + ref.hPct / 2;
      const wMid = rect.yPct + rect.hPct / 2;
      if (Math.abs(refMid - wMid) <= tol) {
        row.push(w);
        continue;
      }
    }
    rows.push([w]);
  }
  return rows.flatMap((row) => [...row].sort((a, b) => readingRect(a).xPct - readingRect(b).xPct));
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

/** Font ascent/descent, text direction and all four transformed corners matter
 * for marks: a baseline-only box leaves descenders visible after redaction. */
export function textSelectionBounds(
  transform: number[],
  width: number,
  height: number,
  style: { ascent?: number; descent?: number; vertical?: boolean },
  toViewport: (x: number, y: number) => number[],
) {
  const [a, b, c, d, x, y] = transform;
  const fontHeight = Math.hypot(c, d) || height;
  const advance = style.vertical ? height : width;
  const baseline = Math.hypot(a, b) || 1;
  const ux = style.vertical ? -c / fontHeight : a / baseline;
  const uy = style.vertical ? -d / fontHeight : b / baseline;
  const vx = style.vertical ? a / baseline : c / fontHeight;
  const vy = style.vertical ? b / baseline : d / fontHeight;
  // Font metrics describe an em; include a small edge allowance for ink overshoot.
  const top = (Math.max(0, style.ascent ?? 1) + 0.05) * fontHeight;
  const bottom = (Math.min(0, style.descent ?? -0.25) - 0.05) * fontHeight;
  const points = [0, advance].flatMap((along) =>
    [bottom, top].map((up) => toViewport(x + ux * along + vx * up, y + uy * along + vy * up)),
  );
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}
