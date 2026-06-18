/**
 * Layout-aware PDF extraction powered by LlamaParse Lite (liteparse-wasm).
 *
 * Where {@link ./ocr-text.ts | extractPdfText} produces a flat reading-order
 * string per page (discarding geometry), this module preserves each text
 * item's bounding box. That geometry is what makes two features possible:
 *
 *   1. Layout-aware OCR — a *correctly positioned* invisible text layer for
 *      searchable PDFs (the old layer was stacked at a synthetic line height
 *      and never aligned with the page).
 *   2. Smart redaction — mapping a detected PII span back to a draw-able
 *      rectangle on the page.
 *
 * liteparse runs 100 % client-side as a ~4 MB Rust→WASM module. It extracts
 * the native text layer of digital PDFs directly (no OCR, no model weights).
 * Its *in-browser* OCR/rasterisation path is broken on the published 2.0.4
 * wasm (it traps and hangs — see the orchestration section), so for scanned /
 * text-sparse pages we OCR ourselves with PDF.js + Tesseract.js — the same
 * engine the rest of the app already uses — and convert the word boxes back to
 * the same geometry shape. Everything stays local; no file ever leaves the
 * browser.
 *
 * Coordinate convention (verified against fixtures): liteparse emits item
 * positions in PDF *point* space with a **top-left** origin (y grows
 * downward) — identical to the fraction convention RedactPdf uses, so the
 * conversion in {@link itemFractionRect} is a plain divide with no axis flip.
 *
 * The wasm-loading + Tesseract orchestration lives in {@link extractLayout}
 * (browser-only — it resolves the `.wasm` via a Vite `?url` import). The
 * shape-normalisation and geometry maths are split into pure exported helpers
 * ({@link normalizeParseResult}, {@link itemFractionRect},
 * {@link layoutToReadingOrderText}, {@link detectPiiRects}) so they unit-test
 * without a browser.
 */
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { clampScaleForCanvas, getPdfJs } from "./pdf/raster.ts";
import { PDFJS_WASM_URL } from "./pdfjs-config.ts";
import { detectPii, type PiiType } from "./pii.ts";

/** A single positioned text run. Coordinates are PDF points, top-left origin. */
export interface LayoutItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

/** One page of extracted layout. */
export interface LayoutPage {
  /** 1-based page index. */
  pageNumber: number;
  /** Page width in PDF points. */
  width: number;
  /** Page height in PDF points. */
  height: number;
  /** liteparse's layout-preserved page text (whitespace approximates layout). */
  text: string;
  /** Positioned text runs in document order. */
  items: LayoutItem[];
}

/** A rectangle expressed as fractions (0–1) of page width/height, top-left origin. */
export interface FractionRect {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

export interface ExtractLayoutOptions {
  /** Tesseract language code for OCR of scanned pages. Defaults to `"eng"`. */
  language?: string;
  /** Set `false` to skip OCR entirely (digital text layer only). */
  ocr?: boolean;
  /** Render DPI used when OCR'ing scanned pages. Higher = sharper, slower. Defaults to 200. */
  dpi?: number;
  /** Password for an encrypted PDF. */
  password?: string;
  /**
   * Called once per page that goes through the Tesseract OCR callback, so a
   * UI can show a determinate progress bar on scanned documents. `done` is the
   * running number of OCR'd pages; `total` is how many pages need OCR.
   */
  onOcrPage?: (done: number, total: number) => void;
  /**
   * Called once per page during the primary text-geometry pass of
   * {@link extractTextGeometry}, so a UI can show a determinate "reading page
   * X of N" bar on large documents. Not fired by {@link extractLayout} — its
   * liteparse `parse()` is a single opaque call with no per-page granularity.
   */
  onProgress?: (done: number, total: number) => void;
}

// ── pure helpers (no wasm — unit-testable) ────────────────────────────────

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** Raw page shape returned by liteparse's `parse()` (loose by design). */
interface RawLiteParsePage {
  pageNum?: number;
  width?: number;
  height?: number;
  text?: string;
  textItems?: Array<{
    text?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fontSize?: number;
  }>;
}

/**
 * Convert liteparse's raw `{ text, pages }` result into our typed
 * {@link LayoutPage}[]. Pure — accepts the parsed object so it can be tested
 * against a real fixture without going through the browser wasm loader.
 */
export function normalizeParseResult(result: { pages?: RawLiteParsePage[] } | null): LayoutPage[] {
  const pages = result?.pages ?? [];
  return pages.map((p, idx) => ({
    pageNumber: typeof p.pageNum === "number" ? p.pageNum : idx + 1,
    width: p.width ?? 0,
    height: p.height ?? 0,
    text: p.text ?? "",
    items: (p.textItems ?? [])
      .filter((it) => typeof it.x === "number" && typeof it.y === "number")
      .map((it) => ({
        text: it.text ?? "",
        x: it.x ?? 0,
        y: it.y ?? 0,
        width: it.width ?? 0,
        height: it.height ?? 0,
        fontSize: it.fontSize ?? 0,
      })),
  }));
}

/** Bounding box of a whole item as a page-fraction rectangle. */
export function itemFractionRect(item: LayoutItem, page: LayoutPage): FractionRect {
  const w = page.width || 1;
  const h = page.height || 1;
  return {
    xPct: clamp01(item.x / w),
    yPct: clamp01(item.y / h),
    wPct: clamp01(item.width / w),
    hPct: clamp01(item.height / h),
  };
}

/**
 * Page-fraction rectangle for a substring `[start, end)` of an item's text.
 *
 * liteparse items are line/phrase granularity (no per-glyph geometry), so for
 * PII embedded mid-line we estimate the sub-span horizontally by proportional
 * character offset and pad outward by `padChars` characters' worth of width on
 * each side. Redaction favours over-covering: the pad guarantees we never
 * leave a sliver of the matched value exposed. The rect is clamped to the
 * item's own box.
 */
export function substringFractionRect(
  item: LayoutItem,
  page: LayoutPage,
  start: number,
  end: number,
  padChars = 0.75,
): FractionRect {
  const len = item.text.length || 1;
  // Guard against a missing/bogus item width: liteparse occasionally reports 0,
  // and degenerate OCR word boxes can too. A zero charW would collapse the box
  // to zero area — silently leaving the matched PII fully visible after
  // redaction. Estimate a per-char width from the glyph height instead so a
  // detected match always produces a covering box.
  let charW = item.width / len;
  if (!Number.isFinite(charW) || charW <= 0) charW = (item.height || item.fontSize || 8) * 0.6;
  const x0 = item.x + Math.max(0, start - padChars) * charW;
  let x1 = item.x + Math.min(len, end + padChars) * charW;
  if (x1 <= x0) x1 = x0 + Math.max(1, end - start) * charW;
  const w = page.width || 1;
  const h = page.height || 1;
  // Floor the drawn box to a small visible size so a real match is never
  // reported as redacted while painting nothing.
  const minW = 8 / w;
  const itemH = item.height || item.fontSize || 8;
  const minH = 6 / h;
  return {
    xPct: clamp01(x0 / w),
    yPct: clamp01(item.y / h),
    wPct: Math.max(minW, clamp01((x1 - x0) / w)),
    hPct: Math.max(minH, clamp01(itemH / h)),
  };
}

/**
 * Reconstruct clean reading-order text from positioned items.
 *
 * liteparse's own `page.text` preserves layout by padding with whitespace
 * (multi-column gutters become long space runs). For display and downstream
 * text use we instead group items into rows by their y-baseline (within
 * `rowTolerance` points), order rows top-to-bottom and items left-to-right,
 * and join with single spaces / newlines. This keeps multi-column reading
 * order correct without the gutters.
 */
export function layoutToReadingOrderText(page: LayoutPage, rowTolerance = 3): string {
  const items = page.items.filter((i) => i.text.trim().length > 0);
  if (items.length === 0) return page.text.trim();

  const rows: LayoutItem[][] = [];
  for (const item of [...items].sort((a, b) => a.y - b.y)) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row[0].y - item.y) <= rowTolerance) {
      row.push(item);
    } else {
      rows.push([item]);
    }
  }

  return rows
    .map((row) =>
      [...row]
        .sort((a, b) => a.x - b.x)
        .map((i) => i.text.trim())
        .filter(Boolean)
        .join(" "),
    )
    .join("\n")
    .trim();
}

/** A heading detected from the document's visual structure. */
export interface DetectedHeading {
  /** Heading text (whitespace-collapsed). */
  text: string;
  /** 1-based page the heading appears on. */
  pageNumber: number;
  /** Nesting level: 1 = largest/top-level, 2, 3 … by font-size band. */
  level: number;
}

/** Max item glyph height in a visual row — our dependable font-size proxy. */
function rowMaxHeight(row: LayoutItem[]): number {
  let m = 0;
  for (const it of row) m = Math.max(m, it.height || it.fontSize || 0);
  return m;
}

function rowToText(row: LayoutItem[]): string {
  return row
    .map((i) => i.text.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detect section headings from a document's visual structure — used to
 * auto-generate a bookmark outline.
 *
 * Heuristic (validated across digital + scanned fixtures): a row is a heading
 * when it is short and set noticeably larger than the body text, or a short
 * ALL-CAPS label at/above body size (résumés/reports label sections in caps).
 * Size is taken from the item bbox **height**, not liteparse's `fontSize` —
 * the latter is reliable on some PDFs but degenerate (~1) on many others,
 * whereas height tracks the real glyph size everywhere.
 *
 * Headings keep document order; `level` is assigned by font-size band (largest
 * = 1). Pure-numeric rows (page numbers) and runs of dot-leaders (a table of
 * contents) are skipped. Pure — no wasm; operates on extracted {@link LayoutPage}s.
 */
export function detectHeadings(
  pages: LayoutPage[],
  options: { maxHeadings?: number; rowTolerance?: number } = {},
): DetectedHeading[] {
  // Safety bound on pathological inputs. 150 comfortably covers real documents
  // (a 30-page guide has ~10-15 headings) so it effectively never truncates;
  // it only caps a degenerate PDF that would emit hundreds of false headings.
  const maxHeadings = options.maxHeadings ?? 150;
  const rowTolerance = options.rowTolerance ?? 3;

  // Group every page into visual rows (y-baseline), keeping page + order.
  const rows: { page: number; text: string; size: number }[] = [];
  const bodyVotes = new Map<number, number>();
  for (const page of pages) {
    const items = page.items.filter((i) => i.text.trim().length > 0);
    const grouped: LayoutItem[][] = [];
    for (const item of [...items].sort((a, b) => a.y - b.y)) {
      const row = grouped[grouped.length - 1];
      if (row && Math.abs(row[0].y - item.y) <= rowTolerance) row.push(item);
      else grouped.push([item]);
    }
    for (const row of grouped) {
      const text = rowToText([...row].sort((a, b) => a.x - b.x));
      if (!text) continue;
      const size = rowMaxHeight(row);
      rows.push({ page: page.pageNumber, text, size });
      // Only long lines vote for body size (headings are short).
      if (text.length >= 25) {
        const k = Math.round(size * 2) / 2;
        bodyVotes.set(k, (bodyVotes.get(k) ?? 0) + 1);
      }
    }
  }

  // Body font = the most common rounded height among long lines.
  let bodyFont = 0;
  let bestN = -1;
  for (const [size, n] of bodyVotes) {
    if (n > bestN) {
      bestN = n;
      bodyFont = size;
    }
  }
  if (!bodyFont) bodyFont = 11;

  const isAllCaps = (t: string): boolean => {
    const letters = t.replace(/[^A-Za-z]/g, "");
    return letters.length >= 2 && letters === letters.toUpperCase();
  };

  // Candidate headings, with their size (for level banding).
  const candidates: { page: number; text: string; size: number }[] = [];
  const sizes = new Set<number>();
  let lastKey = "";
  for (const row of rows) {
    const { text, size, page } = row;
    if (text.length < 2 || text.length > 80) continue;
    if (!/[A-Za-z]/.test(text)) continue; // skip page numbers / pure punctuation
    if (/\.{4,}/.test(text)) continue; // skip TOC dot-leaders
    const isHeading =
      size >= bodyFont * 1.15 || (isAllCaps(text) && text.length <= 40 && size >= bodyFont * 0.98);
    if (!isHeading) continue;
    const key = `${page}:${text.toLowerCase()}`;
    if (key === lastKey) continue; // collapse immediate repeats
    lastKey = key;
    const banded = Math.round(size * 2) / 2;
    candidates.push({ page, text, size: banded });
    sizes.add(banded);
  }

  // Level = rank of the heading's size band (largest size → level 1, capped at 3).
  const orderedSizes = [...sizes].sort((a, b) => b - a);
  const levelOf = (size: number): number => Math.min(3, orderedSizes.indexOf(size) + 1) || 1;

  return candidates
    .slice(0, maxHeadings)
    .map((c) => ({ text: c.text, pageNumber: c.page, level: levelOf(c.size) }));
}

// ── Reading-order reflow (plain-text / Markdown export) ────────────────────
//
// Turn extracted layout back into a clean, linear document for the editor's
// "Export → Text / Markdown" formats. Unlike layoutToReadingOrderText (which
// reads strictly by y-baseline and so interleaves side-by-side columns), these
// detect a two-column gutter and read each column top-to-bottom before moving
// right — the reading order a human follows. They then compose pages and, for
// Markdown, promote detected heading rows to ATX (`#`/`##`/`###`) headings
// reusing detectHeadings. Pure — operate on extracted LayoutPages, so they
// unit-test without a browser.

/** Group a page's non-empty items into visual rows (y-baseline), each row's
 *  items left-to-right. The shared grouping behind the Markdown serialiser and
 *  furniture detection — same tolerance logic as layoutToReadingOrderText. */
function groupRows(page: LayoutPage, rowTolerance: number): LayoutItem[][] {
  const items = page.items.filter((i) => i.text.trim().length > 0);
  const rows: LayoutItem[][] = [];
  for (const item of [...items].sort((a, b) => a.y - b.y)) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row[0].y - item.y) <= rowTolerance) row.push(item);
    else rows.push([item]);
  }
  return rows.map((r) => [...r].sort((a, b) => a.x - b.x));
}

/** Group an arbitrary item list into y-baseline rows (x-sorted) — the column-
 *  local counterpart of {@link groupRows}, run per detected column. */
function rowsOfItems(items: LayoutItem[], rowTolerance: number): LayoutItem[][] {
  const rows: LayoutItem[][] = [];
  for (const item of [...items].sort((a, b) => a.y - b.y)) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row[0].y - item.y) <= rowTolerance) row.push(item);
    else rows.push([item]);
  }
  return rows.map((r) => [...r].sort((a, b) => a.x - b.x));
}

/**
 * Detect a single dominant two-column gutter on a page and return its x, or
 * null for single-column. Heuristic: across visual rows, find each row's widest
 * internal horizontal gap; if a gap ≥ 6% of page width recurs at a consistent x
 * (away from the margins) on enough rows, that x is the column boundary. Robust
 * to full-width headings/footers — those are single-run rows that simply don't
 * vote. Pure; only two columns are detected (the overwhelmingly common case).
 */
function detectColumnSplit(rows: LayoutItem[][], pageWidth: number): number | null {
  const W = pageWidth || 1;
  const minGap = W * 0.06;
  const gapXs: number[] = [];
  for (const row of rows) {
    if (row.length < 2) continue;
    let bestGap = 0;
    let bestMid = 0;
    for (let i = 1; i < row.length; i++) {
      const prevRight = row[i - 1].x + row[i - 1].width;
      const gap = row[i].x - prevRight;
      if (gap > bestGap) {
        bestGap = gap;
        bestMid = (prevRight + row[i].x) / 2;
      }
    }
    if (bestGap >= minGap && bestMid > W * 0.2 && bestMid < W * 0.8) gapXs.push(bestMid);
  }
  // The gutter must recur — a one-off paragraph gap is not a column boundary.
  if (gapXs.length < Math.max(3, rows.length * 0.3)) return null;
  const sorted = [...gapXs].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  // …and the votes must agree on roughly the same x.
  const consistent = gapXs.filter((x) => Math.abs(x - median) <= W * 0.1).length;
  if (consistent < Math.max(3, gapXs.length * 0.6)) return null;
  return median;
}

/**
 * A page's rows in true reading order: single-column pages group by y-baseline;
 * two-column pages split at the detected gutter and read the left column fully
 * before the right. Each row is one visual line within its column, x-sorted.
 */
function orderedRows(page: LayoutPage, rowTolerance: number): LayoutItem[][] {
  const rows = groupRows(page, rowTolerance);
  const split = detectColumnSplit(rows, page.width);
  if (split == null) return rows;
  const items = page.items.filter((i) => i.text.trim().length > 0);
  const left: LayoutItem[] = [];
  const right: LayoutItem[] = [];
  for (const it of items) (it.x + it.width / 2 < split ? left : right).push(it);
  return [...rowsOfItems(left, rowTolerance), ...rowsOfItems(right, rowTolerance)];
}

/** One page's reading-order text (column-aware), falling back to liteparse's
 *  own page text when there are no positioned items. */
function pageReadingText(page: LayoutPage, rowTolerance = 3): string {
  const rows = orderedRows(page, rowTolerance);
  if (rows.length === 0) return page.text.trim();
  return rows.map(rowToText).filter(Boolean).join("\n").trim();
}

/** Join every page's reading-order text into one plain-text document, pages
 *  separated by a blank line. Trailing newline so the file ends cleanly. */
export function layoutToPlainText(pages: LayoutPage[]): string {
  const body = pages
    .map((p) => pageReadingText(p))
    .filter(Boolean)
    .join("\n\n")
    .trim();
  return body ? `${body}\n` : "";
}

export interface MarkdownOptions {
  /** Promote heading rows to `#`/`##`/`###` (default true). Off → every line is
   *  a plain paragraph: the escape hatch when font-size banding misfires. */
  headings?: boolean;
  /** Row-grouping tolerance in points (default 3, matching detectHeadings). */
  rowTolerance?: number;
}

/**
 * Serialise extracted layout to Markdown: reading-order body text with detected
 * headings promoted to ATX headings by font-size band. Heading rows are matched
 * to {@link detectHeadings} output by `(page, normalized text)`, so the two
 * agree; everything else is emitted as body lines (soft-wrapped into paragraphs
 * by Markdown). Pure — operates on the extracted {@link LayoutPage}s.
 */
// A row worth promoting to a heading has at least one real word (a run of ≥ 3
// letters). This drops stray ligature glyphs ("fi", "fl") that some PDFs emit
// as their own larger-set items — detectHeadings can't tell them from a real
// short heading, but they make ugly `# fi` lines in the serialised output.
const HEADING_WORD = /\p{L}{3,}/u;

export function layoutToMarkdown(pages: LayoutPage[], options: MarkdownOptions = {}): string {
  const useHeadings = options.headings !== false;
  const rowTolerance = options.rowTolerance ?? 3;

  const headingLevel = new Map<string, number>();
  if (useHeadings) {
    for (const h of detectHeadings(pages, { rowTolerance })) {
      headingLevel.set(`${h.pageNumber} ${h.text.toLowerCase()}`, h.level);
    }
  }

  const lines: string[] = [];
  const pushBlank = () => {
    if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push("");
  };
  for (const page of pages) {
    for (const row of orderedRows(page, rowTolerance)) {
      const text = rowToText(row);
      if (!text) continue;
      const level =
        useHeadings && HEADING_WORD.test(text)
          ? headingLevel.get(`${page.pageNumber} ${text.toLowerCase()}`)
          : undefined;
      if (level) {
        pushBlank();
        lines.push(`${"#".repeat(level)} ${text}`);
        lines.push("");
      } else {
        lines.push(text);
      }
    }
  }
  const body = lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return body ? `${body}\n` : "";
}

// ── Running-furniture detection (Strip Furniture editor tool) ──────────────
//
// Headers, footers, page numbers, and leaked watermark lines are "page
// furniture": short text that recurs at the SAME position across many pages.
// Body text doesn't — so furniture can be found purely by positional
// recurrence, with no model. The Strip Furniture tool removes detected bands by
// cropping the top/bottom margin (non-destructive, reversible), so the detector
// reports, per group, a safe margin fraction to trim — already clamped so a
// crop never reaches into body text. Pure — runs on the trustworthy per-run
// geometry from extractTextGeometry.

/** A page-number-ish folio: a bare number / roman numeral, optionally prefixed
 *  with "Page" or wrapped in dashes, optionally "X of Y" / "X / Y". */
const PAGE_NUMBER_RE =
  /^[\s.–—-]*(?:p(?:age|g)?\.?\s*)?[0-9ivxlcdm]+(?:\s*(?:of|\/|–|—|-)\s*[0-9ivxlcdm]+)?[\s.–—-]*$/i;

export type FurnitureRegion = "top" | "bottom";

/** One cluster of recurring page furniture, ready for the tool's checklist. */
export interface FurnitureGroup {
  /** Stable id for the UI checklist (region + slot). */
  id: string;
  region: FurnitureRegion;
  /** Best-guess kind — drives the label only. */
  kind: "header" | "footer" | "page-number";
  /** A representative line of the recurring text (the running header itself). */
  sampleText: string;
  /** How many pages carry this furniture. */
  pageCount: number;
  /** Fraction (0–1) to trim from this group's page edge to remove it cleanly,
   *  clamped so it never crosses into body text and never exceeds 30%. */
  marginPct: number;
}

export interface FurnitureOptions {
  /** A cluster counts as furniture once it appears on at least this fraction of
   *  pages. Default 0.5. */
  minPageFraction?: number;
  /** How far from each edge (page-height fraction) to look for furniture.
   *  Default 0.18 (top 18% / bottom 18%). */
  marginBand?: number;
  rowTolerance?: number;
}

/**
 * Detect running headers, footers, and page numbers by positional recurrence.
 *
 * For each page we group margin-region rows, normalise their text (masking
 * digit runs so "Page 3" and "Page 4" cluster), and bucket by
 * `region · quantised-y · masked-text`. A bucket spanning enough pages is
 * furniture. Body bounds are taken from every non-furniture row so the reported
 * `marginPct` can be clamped to never clip body content. Needs ≥ 3 pages — with
 * fewer there's no recurrence to distinguish furniture from body.
 */
export function detectRunningFurniture(
  pages: LayoutPage[],
  options: FurnitureOptions = {},
): FurnitureGroup[] {
  const minFraction = options.minPageFraction ?? 0.5;
  const band = options.marginBand ?? 0.18;
  const rowTolerance = options.rowTolerance ?? 3;
  const n = pages.length;
  if (n < 3) return [];

  const Q = 0.04; // y-band quantisation (4% of page height)
  interface MarginRow {
    pageNumber: number;
    text: string;
    key: string;
    region: FurnitureRegion;
    yTopPct: number;
    yBotPct: number;
  }
  const marginRows: MarginRow[] = [];
  // Every row's bounds + (furniture key | null), to derive body bounds later.
  const rowBounds: { yTopPct: number; yBotPct: number; key: string | null }[] = [];

  for (const page of pages) {
    const h = page.height || 1;
    for (const row of groupRows(page, rowTolerance)) {
      const text = rowToText(row);
      if (!text) continue;
      let yTop = Number.POSITIVE_INFINITY;
      let yBot = Number.NEGATIVE_INFINITY;
      for (const it of row) {
        yTop = Math.min(yTop, it.y);
        yBot = Math.max(yBot, it.y + (it.height || it.fontSize || 0));
      }
      const yTopPct = clamp01(yTop / h);
      const yBotPct = clamp01(yBot / h);
      const yMidPct = (yTopPct + yBotPct) / 2;
      const region: FurnitureRegion | null =
        yMidPct <= band ? "top" : yMidPct >= 1 - band ? "bottom" : null;
      if (region) {
        const key = `${region}|${Math.round(yMidPct / Q)}|${text.toLowerCase().replace(/\d+/g, "#")}`;
        marginRows.push({ pageNumber: page.pageNumber, text, key, region, yTopPct, yBotPct });
        rowBounds.push({ yTopPct, yBotPct, key });
      } else {
        rowBounds.push({ yTopPct, yBotPct, key: null });
      }
    }
  }

  // Cluster margin rows by key; a bucket spanning ≥ minPages distinct pages is
  // furniture.
  const buckets = new Map<
    string,
    { region: FurnitureRegion; rows: MarginRow[]; pages: Set<number> }
  >();
  for (const r of marginRows) {
    let b = buckets.get(r.key);
    if (!b) {
      b = { region: r.region, rows: [], pages: new Set() };
      buckets.set(r.key, b);
    }
    b.rows.push(r);
    b.pages.add(r.pageNumber);
  }
  const minPages = Math.max(2, Math.ceil(minFraction * n));
  const furnitureKeys = new Set<string>();
  for (const [key, b] of buckets) if (b.pages.size >= minPages) furnitureKeys.add(key);
  if (furnitureKeys.size === 0) return [];

  // Body bounds from rows NOT classified as furniture, so a crop never clips it.
  let bodyTop = 1;
  let bodyBottom = 0;
  let sawBody = false;
  for (const r of rowBounds) {
    if (r.key && furnitureKeys.has(r.key)) continue;
    sawBody = true;
    bodyTop = Math.min(bodyTop, r.yTopPct);
    bodyBottom = Math.max(bodyBottom, r.yBotPct);
  }

  const PAD = 0.006; // clear the glyphs
  const GAP = 0.004; // keep clear of body
  const MAX = 0.3; // never trim more than 30% for furniture
  const groups: FurnitureGroup[] = [];
  let topIdx = 0;
  let botIdx = 0;
  for (const [key, b] of buckets) {
    if (!furnitureKeys.has(key)) continue;

    const counts = new Map<string, number>();
    for (const r of b.rows) counts.set(r.text, (counts.get(r.text) ?? 0) + 1);
    let sampleText = "";
    let best = -1;
    for (const [t, c] of counts) {
      if (c > best) {
        best = c;
        sampleText = t;
      }
    }

    const allNumeric = b.rows.every((r) => PAGE_NUMBER_RE.test(r.text));
    const kind = allNumeric ? "page-number" : b.region === "top" ? "header" : "footer";

    let marginPct: number;
    if (b.region === "top") {
      let cut = Math.max(...b.rows.map((r) => r.yBotPct)) + PAD;
      if (sawBody) cut = Math.min(cut, Math.max(0, bodyTop - GAP));
      marginPct = Math.min(MAX, Math.max(0, cut));
    } else {
      let keep = Math.min(...b.rows.map((r) => r.yTopPct)) - PAD;
      if (sawBody) keep = Math.max(keep, bodyBottom + GAP);
      marginPct = Math.min(MAX, Math.max(0, 1 - keep));
    }

    groups.push({
      id: b.region === "top" ? `top-${topIdx++}` : `bottom-${botIdx++}`,
      region: b.region,
      kind,
      sampleText,
      pageCount: b.pages.size,
      marginPct,
    });
  }

  // Top groups first, then bottom; within a region the deeper trim leads.
  groups.sort((a, z) =>
    a.region === z.region ? z.marginPct - a.marginPct : a.region === "top" ? -1 : 1,
  );
  return groups;
}

/**
 * Reduce a set of (selected) furniture groups to a single crop spec: the
 * fraction to trim from the top and from the bottom of every page. Each edge
 * takes the deepest selected band on that side. Pure.
 */
export function furnitureCropMargins(groups: FurnitureGroup[]): {
  topPct: number;
  bottomPct: number;
} {
  let topPct = 0;
  let bottomPct = 0;
  for (const g of groups) {
    if (g.region === "top") topPct = Math.max(topPct, g.marginPct);
    else bottomPct = Math.max(bottomPct, g.marginPct);
  }
  return { topPct, bottomPct };
}

/** A detected PII span resolved to a redaction rectangle on a specific page. */
export interface PiiRect extends FractionRect {
  /** 0-based page index (matches RedactPdf's `pageIndex`). */
  pageIndex: number;
  type: PiiType;
  /** The matched text — for the review summary, never drawn into the output. */
  value: string;
}

/**
 * Detect PII across extracted pages and resolve each hit to a page-fraction
 * rectangle ready for redaction.
 *
 * We run {@link detectPii} per text item (PII values — emails, phones, IDs —
 * sit within a single line/phrase item), then map the matched character span
 * to geometry with {@link substringFractionRect}. The result drops straight
 * into RedactPdf's redaction map for user review. Pure — operates on the
 * extracted {@link LayoutPage}s, no wasm.
 */
/** A char-span match within a reconstructed line — the shape both the PII
 *  detector and the literal text matcher emit, so {@link collectRowRects} can
 *  resolve either to page-fraction rectangles through one code path. */
interface SpanMatch {
  value: string;
  start: number;
  end: number;
}

/**
 * Group a page's items into visual rows, reconstruct each row's text, run a
 * line-level `matcher`, and union every match's character span into a single
 * page-fraction rectangle.
 *
 * This is the shared geometry core behind {@link detectPiiRects} (PII matcher)
 * and {@link findTextRects} (literal search). A value — a phone number or a
 * searched name — can arrive split across several whitespace-separated
 * word-items on one line (Tesseract OCR always splits on spaces, and PDF.js can
 * split a run too), so we match over the *reconstructed line* instead of
 * per-item and map the hit back to geometry. Pure — no wasm.
 */
function collectRowRects<M extends SpanMatch>(
  page: LayoutPage,
  matcher: (line: string) => M[],
  rowTolerance: number,
  padChars: number,
): { rect: FractionRect; match: M; line: string }[] {
  const out: { rect: FractionRect; match: M; line: string }[] = [];
  const withText = page.items.filter((i) => i.text.length > 0);
  if (withText.length === 0) return out;

  // Group items into visual rows by y-baseline (same grouping as
  // layoutToReadingOrderText).
  const rows: LayoutItem[][] = [];
  for (const item of [...withText].sort((a, b) => a.y - b.y)) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row[0].y - item.y) <= rowTolerance) row.push(item);
    else rows.push([item]);
  }

  for (const row of rows) {
    const sorted = [...row].sort((a, b) => a.x - b.x);
    // Build the line text, recording each item's [start, end) char range in it.
    let line = "";
    const spans: { item: LayoutItem; start: number; end: number }[] = [];
    for (const item of sorted) {
      if (line.length > 0) line += " ";
      const start = line.length;
      line += item.text;
      spans.push({ item, start, end: line.length });
    }

    for (const match of matcher(line)) {
      // Every item the match overlaps — usually one, but several for a
      // space-separated value (phone "123 456 7890", spaced card, IBAN…).
      const touched = spans.filter((s) => s.start < match.end && s.end > match.start);
      if (touched.length === 0) continue;
      // Union the per-item sub-rects so a multi-word value gets one box that
      // covers the whole span (partial first/last item, full interior items).
      let xMin = 1;
      let yMin = 1;
      let xMax = 0;
      let yMax = 0;
      for (const { item, start } of touched) {
        const localStart = Math.max(0, match.start - start);
        const localEnd = Math.min(item.text.length, match.end - start);
        const sub = substringFractionRect(item, page, localStart, localEnd, padChars);
        xMin = Math.min(xMin, sub.xPct);
        yMin = Math.min(yMin, sub.yPct);
        xMax = Math.max(xMax, sub.xPct + sub.wPct);
        yMax = Math.max(yMax, sub.yPct + sub.hPct);
      }
      out.push({
        rect: {
          xPct: clamp01(xMin),
          yPct: clamp01(yMin),
          wPct: clamp01(xMax - xMin),
          hPct: clamp01(yMax - yMin),
        },
        match,
        line,
      });
    }
  }
  return out;
}

export function detectPiiRects(
  pages: LayoutPage[],
  types?: PiiType[],
  rowTolerance = 3,
): PiiRect[] {
  const rects: PiiRect[] = [];
  const opts = types ? { types } : undefined;
  for (const page of pages) {
    // padChars 0.75 (substringFractionRect's default) — redaction over-covers
    // so no sliver of the matched value is ever left exposed.
    for (const { rect, match } of collectRowRects(
      page,
      (line) => detectPii(line, opts),
      rowTolerance,
      0.75,
    )) {
      rects.push({
        pageIndex: page.pageNumber - 1,
        type: match.type,
        value: match.value,
        xPct: rect.xPct,
        yPct: rect.yPct,
        wPct: rect.wPct,
        hPct: rect.hPct,
      });
    }
  }
  return rects;
}

/** Options for {@link findTextRects} literal search. */
export interface TextSearchOptions {
  /** Match case exactly. Default false (case-insensitive). */
  caseSensitive?: boolean;
  /** Require the term to sit on word boundaries, so "Sam" skips "Samuel". */
  wholeWord?: boolean;
}

/** A literal text hit resolved to a rectangle on a specific page, carrying the
 *  surrounding line so a review hit-list can show it in context. */
export interface TextMatchRect extends FractionRect {
  /** 0-based page index (matches RedactPdf / annotatePdf `pageIndex`). */
  pageIndex: number;
  /** 1-based page number, for display. */
  pageNumber: number;
  /** The query term that produced this hit (a search can carry several). */
  term: string;
  /** The exact text matched on the page. */
  value: string;
  /** The full reconstructed line the hit sits on — context for the hit-list. */
  line: string;
  /** Offset of the match within {@link line} (for emphasising it in the list). */
  matchStart: number;
  matchEnd: number;
}

/** Word-character test for whole-word matching — Unicode-aware so accented
 *  names ("José") and digits count as part of a word. */
const WORD_CHAR = /[\p{L}\p{N}_]/u;

/** Build a line-level matcher that finds every (non-overlapping) occurrence of
 *  `term`, honouring the case / whole-word options. */
function literalMatcher(
  term: string,
  { caseSensitive = false, wholeWord = false }: TextSearchOptions,
): (line: string) => SpanMatch[] {
  const needle = caseSensitive ? term : term.toLowerCase();
  return (line: string): SpanMatch[] => {
    if (!needle) return [];
    const hay = caseSensitive ? line : line.toLowerCase();
    const out: SpanMatch[] = [];
    let from = 0;
    for (;;) {
      const idx = hay.indexOf(needle, from);
      if (idx < 0) break;
      const end = idx + needle.length;
      const before = idx > 0 ? line[idx - 1] : "";
      const after = end < line.length ? line[end] : "";
      if (!wholeWord || (!WORD_CHAR.test(before) && !WORD_CHAR.test(after))) {
        out.push({ value: line.slice(idx, end), start: idx, end });
      }
      from = end; // advance past this hit — matches never overlap
    }
    return out;
  };
}

/**
 * Trim, drop-empty, and de-duplicate search terms. The dedup key folds case
 * when the search is case-insensitive, so adding both "John" and "john" can't
 * double every match (they resolve to the same hits). Order is preserved.
 */
export function dedupeTerms(terms: string[], caseSensitive: boolean): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of terms) {
    const t = raw.trim();
    if (!t) continue;
    const key = caseSensitive ? t : t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/**
 * Find every occurrence of one or more literal search terms across extracted
 * pages and resolve each to a page-fraction rectangle — the engine behind the
 * Find & Act editor tool (search → redact / highlight / box). Unlike
 * {@link detectPiiRects} (a fixed PII taxonomy), the terms are user-supplied
 * arbitrary strings; there is no model in the loop, so it is deterministic and
 * works identically on every device.
 *
 * Boxes over-cover slightly (`padChars`, default 0.75) so a redaction never
 * leaves a sliver of the term exposed. Results are ordered by page, then
 * top-to-bottom. Pure — operates on the extracted {@link LayoutPage}s.
 *
 * NOTE on completeness: this matches the *text layer* only (scanned pages must
 * be OCR'd first by the caller). A term rendered as an image, or split mid-word
 * by the text layer, can be missed — the UI must never present "0 matches" as
 * proof of absence on scanned input.
 */
export function findTextRects(
  pages: LayoutPage[],
  terms: string[],
  options: TextSearchOptions & { rowTolerance?: number; padChars?: number } = {},
): TextMatchRect[] {
  const rowTolerance = options.rowTolerance ?? 3;
  const padChars = options.padChars ?? 0.75;
  const cleaned = dedupeTerms(terms, options.caseSensitive ?? false);
  if (cleaned.length === 0) return [];

  const out: TextMatchRect[] = [];
  for (const page of pages) {
    for (const term of cleaned) {
      const matcher = literalMatcher(term, options);
      for (const { rect, match, line } of collectRowRects(page, matcher, rowTolerance, padChars)) {
        out.push({
          pageIndex: page.pageNumber - 1,
          pageNumber: page.pageNumber,
          term,
          value: match.value,
          line,
          matchStart: match.start,
          matchEnd: match.end,
          xPct: rect.xPct,
          yPct: rect.yPct,
          wPct: rect.wPct,
          hPct: rect.hPct,
        });
      }
    }
  }
  out.sort((a, b) => a.pageIndex - b.pageIndex || a.yPct - b.yPct || a.xPct - b.xPct);
  return out;
}

// ── browser orchestration (wasm + Tesseract) ──────────────────────────────
//
// IMPORTANT: liteparse extracts the digital text layer + geometry perfectly
// in the browser, but its *in-browser OCR/rasterisation* path traps
// (`RuntimeError: unreachable`) on the published 2.0.4 wasm and leaves the
// parse promise hung — verified in a real browser. So we run liteparse with
// `ocrEnabled: false` (text layer only) and OCR scanned / text-sparse pages
// ourselves with PDF.js + Tesseract, capturing word boxes so geometry is
// preserved on either path. A timeout guard turns any future wasm hang into a
// recoverable rejection instead of a frozen UI.

/** Below this many non-whitespace chars a page is treated as scanned → OCR. */
const MIN_TEXT_CHARS = 16;
/** Hard ceiling on a single liteparse parse() before we treat it as hung. */
const PARSE_TIMEOUT_MS = 30_000;

let _initPromise: Promise<typeof import("@llamaindex/liteparse-wasm")> | null = null;

/**
 * Lazily load + initialise the liteparse wasm module exactly once. The `.wasm`
 * is resolved via Vite's `?url` import so the ~4 MB binary is emitted as a
 * hashed asset and fetched on demand — digital-PDF tools that never touch
 * layout extraction pay nothing.
 */
async function getLiteParse(): Promise<typeof import("@llamaindex/liteparse-wasm")> {
  if (!_initPromise) {
    _initPromise = (async () => {
      const mod = await import("@llamaindex/liteparse-wasm");
      const { default: wasmUrl } =
        await import("@llamaindex/liteparse-wasm/liteparse_wasm_bg.wasm?url");
      await mod.default({ module_or_path: wasmUrl });
      return mod;
    })();
  }
  return _initPromise;
}

/** Reject if `promise` hasn't settled within `ms` — guards against a wasm hang. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/** Non-whitespace character count across a page's items. */
function pageTextLength(page: LayoutPage): number {
  let n = 0;
  for (const item of page.items) n += item.text.replace(/\s+/g, "").length;
  return n;
}

/**
 * OCR the given page numbers with Tesseract and write positioned items back
 * onto the matching {@link LayoutPage}s. We render each page with PDF.js at
 * `dpi`, recognise it, and convert Tesseract's pixel-space word boxes to PDF
 * points (`point = pixel / scale`, top-left origin — matching liteparse), so
 * a scanned page ends up with the same geometry shape as a digital one.
 */
async function ocrScannedPages(
  file: File,
  pages: LayoutPage[],
  pageNumbers: number[],
  language: string,
  dpi: number,
  onOcrPage: ((done: number, total: number) => void) | undefined,
  existingPdf?: PDFDocumentProxy,
): Promise<void> {
  const { createWorker } = await import("tesseract.js");
  // Reuse the caller's already-open PDF.js document when given one (saves a
  // second full decode + parse of the same file); otherwise open our own and
  // destroy it when done.
  let pdf: PDFDocumentProxy;
  // When we open our own document (no caller-provided one) we must tear it down
  // via its loading task — pdf.js v6 removed PDFDocumentProxy.destroy().
  let ownLoadingTask: PDFDocumentLoadingTask | null = null;
  if (existingPdf) {
    pdf = existingPdf;
  } else {
    const pdfjsLib = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    ownLoadingTask = pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: PDFJS_WASM_URL });
    pdf = await ownLoadingTask.promise;
  }
  const scale = dpi / 72;
  const total = pageNumbers.length;
  let done = 0;
  try {
    // Create the worker *inside* the try so a createWorker rejection still
    // hits the outer finally that destroys our PDF.js document — and only
    // terminate a worker that was actually created.
    const worker = await createWorker(language);
    try {
      for (const pageNumber of pageNumbers) {
        const target = pages.find((p) => p.pageNumber === pageNumber);
        if (!target || pageNumber < 1 || pageNumber > pdf.numPages) continue;
        const page = await pdf.getPage(pageNumber);
        try {
          // Cap oversized pages to the canvas limit (mobile browsers reject
          // huge canvases — a poster-sized scan would render blank). Use the
          // clamped scale for both the render and the bbox→point conversion.
          const baseViewport = page.getViewport({ scale });
          const pageScale = clampScaleForCanvas(baseViewport.width, baseViewport.height, scale);
          const viewport =
            pageScale === scale ? baseViewport : page.getViewport({ scale: pageScale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) continue;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          const { data } = await worker.recognize(canvas);
          canvas.width = 0;
          canvas.height = 0;

          // Page dimensions in points (liteparse may report 0 for image-only pages).
          if (!target.width || !target.height) {
            const base = page.getViewport({ scale: 1 });
            target.width = base.width;
            target.height = base.height;
          }

          const items: LayoutItem[] = [];
          for (const block of data.blocks ?? []) {
            for (const paragraph of block.paragraphs) {
              for (const line of paragraph.lines) {
                for (const word of line.words) {
                  const text = word.text?.trim();
                  if (!text) continue;
                  const { x0, y0, x1, y1 } = word.bbox;
                  items.push({
                    text,
                    x: x0 / pageScale,
                    y: y0 / pageScale,
                    width: (x1 - x0) / pageScale,
                    height: (y1 - y0) / pageScale,
                    fontSize: (y1 - y0) / pageScale,
                  });
                }
              }
            }
          }
          target.items = items;
          target.text = items.length ? layoutToReadingOrderText(target) : (data.text ?? "").trim();
        } finally {
          page.cleanup();
        }
        onOcrPage?.(++done, total);
        await new Promise<void>((r) => setTimeout(r, 0));
      }
    } finally {
      await worker.terminate();
    }
  } finally {
    if (ownLoadingTask) void ownLoadingTask.destroy();
  }
}

/**
 * Extract layout-aware text + per-item geometry from a PDF, 100 % in-browser.
 *
 * Digital pages are read from the text layer by liteparse; scanned /
 * text-sparse pages are OCR'd with PDF.js + Tesseract (see the note above for
 * why we don't use liteparse's own OCR). Returns one {@link LayoutPage} per
 * page in document order.
 */
export async function extractLayout(
  file: File,
  options: ExtractLayoutOptions = {},
): Promise<LayoutPage[]> {
  const language = options.language ?? "eng";
  const ocrEnabled = options.ocr !== false;
  const dpi = options.dpi ?? 200;
  const mod = await getLiteParse();
  const bytes = new Uint8Array(await file.arrayBuffer());

  const config: Record<string, unknown> = {
    ocrEnabled: false, // liteparse in-browser OCR is broken; we OCR ourselves
    outputFormat: "json",
    quiet: true,
  };
  if (options.password) config.password = options.password;

  const parser = new mod.LiteParse(config);
  let pages: LayoutPage[];
  try {
    const result = await withTimeout(parser.parse(bytes), PARSE_TIMEOUT_MS, "liteparse parse");
    pages = normalizeParseResult(result);
  } finally {
    (parser as { free?: () => void }).free?.();
  }

  if (ocrEnabled) {
    const sparse = pages.filter((p) => pageTextLength(p) < MIN_TEXT_CHARS).map((p) => p.pageNumber);
    if (sparse.length > 0) {
      await ocrScannedPages(file, pages, sparse, language, dpi, options.onOcrPage);
    }
  }

  return pages;
}

/**
 * Extract per-item geometry for **redaction** using PDF.js's text layer.
 *
 * Why a second extractor instead of {@link extractLayout}? liteparse is great
 * at reading-order text, but it *merges* runs and occasionally reports an
 * unreliable item width (e.g. 29 pt for a 69-character line) — which throws a
 * sub-line PII box to the wrong place and can leave the value exposed. PDF.js
 * `getTextContent` gives each run a trustworthy width + position, which is
 * exactly what redaction needs to land the box precisely.
 *
 * Coordinates are converted to the same top-left point space the rest of this
 * module uses (PDF.js reports a bottom-left baseline). Scanned / text-sparse
 * pages fall back to Tesseract word boxes via {@link ocrScannedPages}, so the
 * output shape is identical for digital and scanned input.
 */
/**
 * Read one page's native text runs into a {@link LayoutPage} via PDF.js.
 *
 * The default viewport applies the page's /Rotate, so its width/height and
 * `convertToViewportPoint()` live in the same rotated, top-left frame that
 * renderAllThumbnails (preview/manual boxes) and redactPdf (burn-in) use.
 * Mapping each run's baseline-left and opposite (top-right) corners through it,
 * then taking the axis-aligned bounding box, keeps geometry correct on rotated
 * pages, not just upright ones. Shared by {@link extractTextGeometry} (all
 * pages) and {@link extractPageTextGeometry} (one page) so the corner maths
 * never drifts between them.
 */
async function pageLayoutFromTextLayer(
  page: PDFPageProxy,
  pageNumber: number,
): Promise<LayoutPage> {
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const items: LayoutItem[] = [];
  for (const raw of content.items) {
    const it = raw as { str?: string; transform?: number[]; width?: number; height?: number };
    const text = it.str ?? "";
    if (!text.trim() || !it.transform) continue;
    const tr = it.transform;
    const height = it.height || Math.hypot(tr[1], tr[3]) || 0;
    const width = it.width ?? 0;
    const [ax, ay] = viewport.convertToViewportPoint(tr[4], tr[5]);
    const [bx, by] = viewport.convertToViewportPoint(tr[4] + width, tr[5] + height);
    items.push({
      text,
      x: Math.min(ax, bx),
      y: Math.min(ay, by),
      width: Math.abs(bx - ax),
      height: Math.abs(by - ay),
      fontSize: height,
    });
  }
  return { pageNumber, width: viewport.width, height: viewport.height, text: "", items };
}

export async function extractTextGeometry(
  file: File,
  options: ExtractLayoutOptions = {},
): Promise<LayoutPage[]> {
  const language = options.language ?? "eng";
  const ocrEnabled = options.ocr !== false;
  const dpi = options.dpi ?? 200;
  const pdfjsLib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: PDFJS_WASM_URL });
  const pdf = await loadingTask.promise;

  const pages: LayoutPage[] = [];
  try {
    const total = pdf.numPages;
    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i);
      try {
        pages.push(await pageLayoutFromTextLayer(page, i));
      } finally {
        page.cleanup();
      }
      options.onProgress?.(i, total);
    }

    if (ocrEnabled) {
      const sparse = pages
        .filter((p) => pageTextLength(p) < MIN_TEXT_CHARS)
        .map((p) => p.pageNumber);
      if (sparse.length > 0) {
        // Hand our already-open document to the OCR pass so it doesn't decode +
        // parse the same file a second time.
        await ocrScannedPages(file, pages, sparse, language, dpi, options.onOcrPage, pdf);
      }
    }
  } finally {
    void loadingTask.destroy();
  }
  for (const p of pages) if (!p.text) p.text = layoutToReadingOrderText(p);
  return pages;
}

/**
 * Extract positioned text for a SINGLE page via PDF.js's text layer.
 *
 * A deliberately light path for the annotate tool's font-size auto-suggest:
 * unlike {@link extractTextGeometry} it never loops the whole document and never
 * OCRs — a scanned / text-sparse page simply returns zero items, and the caller
 * falls back to a default size. Coordinates are the same top-left point space
 * (with /Rotate applied), and each item's `fontSize` is the glyph-bbox height —
 * the dependable size proxy (PDF.js's own font-size is degenerate on many PDFs).
 *
 * @param pageNumber - 1-based page index.
 * @returns the page's {@link LayoutPage}, or null when the index is out of range.
 */
export async function extractPageTextGeometry(
  file: File,
  pageNumber: number,
): Promise<LayoutPage | null> {
  const pdfjsLib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, wasmUrl: PDFJS_WASM_URL });
  const pdf = await loadingTask.promise;
  try {
    if (pageNumber < 1 || pageNumber > pdf.numPages) return null;
    const page = await pdf.getPage(pageNumber);
    try {
      return await pageLayoutFromTextLayer(page, pageNumber);
    } finally {
      page.cleanup();
    }
  } finally {
    void loadingTask.destroy();
  }
}
