/**
 * Flat-form field detection + fill — the engine behind "Auto-fill", which fills
 * forms that have NO interactive AcroForm fields (printed / exported / scanned
 * forms) by reading their text layer.
 *
 * Two visual cues, both from positioned text runs (PDF.js geometry), tell us
 * where a blank waiting to be filled is:
 *   • an underline run — three or more underscores ("____"); the value goes on it.
 *   • a label followed by empty space — a run ending in ":" (or a known field
 *     word like "Name"/"Email") with a gap to the next run; the value goes there.
 *
 * Detection is pure (unit-tested on synthetic layouts); the fill writer draws the
 * entered values into the PDF at those positions with pdf-lib. A saved profile
 * (handled in the tool) maps common labels → values for one-tap autofill. Scanned
 * forms work once OCR'd. Everything client-side; no file leaves the browser.
 */

import { PDFDocument, rgb, StandardFonts } from "@pdfme/pdf-lib";
import type { LayoutItem, LayoutPage } from "../layout-extract.ts";
import type { FracRect } from "../text-select.ts";

/** Profile keys a detected label can map to, for one-tap autofill. */
export type ProfileKey = "name" | "email" | "phone" | "address" | "date" | "company";

export interface FlatField {
  /** 0-based page. */
  pageIndex: number;
  /** Human label (the text before the blank), cleaned of a trailing colon. */
  label: string;
  /** Where the value should be written (page fractions, top-left origin). */
  rect: FracRect;
  /** Mapped profile key, when the label is a recognised one. */
  profileKey?: ProfileKey;
}

const LABEL_KEYS: { re: RegExp; key: ProfileKey }[] = [
  { re: /\b(full name|name)\b/i, key: "name" },
  { re: /\b(e-?mail)\b/i, key: "email" },
  { re: /\b(phone|telephone|tel|mobile|cell)\b/i, key: "phone" },
  { re: /\b(address|street)\b/i, key: "address" },
  { re: /\b(date|d\.?o\.?b\.?|date of birth)\b/i, key: "date" },
  { re: /\b(company|organi[sz]ation|employer)\b/i, key: "company" },
];

/** Map a label to a profile key, or undefined when it's not a known field. */
export function profileKeyForLabel(label: string): ProfileKey | undefined {
  for (const { re, key } of LABEL_KEYS) if (re.test(label)) return key;
  return undefined;
}

/** Strip a trailing colon + whitespace and collapse internal runs. */
function cleanLabel(text: string): string {
  return text
    .replace(/[:：]\s*$/, "")
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function groupRows(items: LayoutItem[], rowTol: number): LayoutItem[][] {
  const rows: LayoutItem[][] = [];
  for (const it of [...items].sort((a, b) => a.y - b.y)) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row[0].y - it.y) <= rowTol) row.push(it);
    else rows.push([it]);
  }
  return rows.map((r) => [...r].sort((a, b) => a.x - b.x));
}

export interface DetectFlatFieldsOptions {
  /** Right edge (page fraction) a label's blank can extend to. Default 0.94. */
  rightMargin?: number;
  /** Minimum blank width (page fraction) for a label field to count. Default 0.08. */
  minWidth?: number;
  /** Row grouping tolerance in points. Default 3. */
  rowTol?: number;
}

/**
 * Detect fillable blanks on flat (non-AcroForm) pages from their text layer.
 * Returns one {@link FlatField} per detected blank, ordered by page then
 * top-to-bottom. Pure — operates on extracted {@link LayoutPage}s.
 */
export function detectFlatFields(
  pages: LayoutPage[],
  options: DetectFlatFieldsOptions = {},
): FlatField[] {
  const rightMargin = options.rightMargin ?? 0.94;
  const minWidth = options.minWidth ?? 0.08;
  const rowTol = options.rowTol ?? 3;

  const out: FlatField[] = [];
  for (const page of pages) {
    const W = page.width || 1;
    const H = page.height || 1;
    const pageIndex = page.pageNumber - 1;
    const items = page.items.filter((i) => i.text.trim().length > 0);
    for (const row of groupRows(items, rowTol)) {
      for (let i = 0; i < row.length; i++) {
        const it = row[i];
        const text = it.text;

        // Underline run: the value sits on the underscores.
        if (/_{3,}/.test(text)) {
          const wPct = it.width / W;
          if (wPct >= 0.03) {
            // Prefer the preceding run as the label; fall back to any words on
            // the same item ("Name: ____" in one run).
            const label = i > 0 ? cleanLabel(row[i - 1].text) : cleanLabel(text);
            out.push(
              makeField(pageIndex, label || "Field", {
                xPct: it.x / W,
                yPct: it.y / H,
                wPct,
                hPct: it.height / H,
              }),
            );
          }
          continue;
        }

        // Label + empty space: "Name:" (or a known field word) with room after it.
        const cleaned = cleanLabel(text);
        const looksLikeLabel =
          (/[:：]\s*$/.test(text) || profileKeyForLabel(cleaned) !== undefined) &&
          cleaned.length > 0 &&
          cleaned.split(/\s+/).length <= 5;
        if (!looksLikeLabel) continue;
        const labelRight = it.x + it.width;
        const next = row[i + 1];
        const fillRight = next ? next.x : W * rightMargin;
        const wPct = (fillRight - labelRight - 2) / W;
        if (wPct >= minWidth) {
          out.push(
            makeField(pageIndex, cleaned, {
              xPct: (labelRight + 2) / W,
              yPct: it.y / H,
              wPct,
              hPct: it.height / H,
            }),
          );
        }
      }
    }
  }
  // Stable order, then drop near-duplicate boxes (same page + overlapping rect).
  out.sort(
    (a, b) => a.pageIndex - b.pageIndex || a.rect.yPct - b.rect.yPct || a.rect.xPct - b.rect.xPct,
  );
  return dedupe(out);
}

function makeField(pageIndex: number, label: string, rect: FracRect): FlatField {
  const profileKey = profileKeyForLabel(label);
  return profileKey ? { pageIndex, label, rect, profileKey } : { pageIndex, label, rect };
}

function dedupe(fields: FlatField[]): FlatField[] {
  const kept: FlatField[] = [];
  for (const f of fields) {
    const clash = kept.some(
      (k) =>
        k.pageIndex === f.pageIndex &&
        Math.abs(k.rect.yPct - f.rect.yPct) < 0.01 &&
        Math.abs(k.rect.xPct - f.rect.xPct) < 0.02,
    );
    if (!clash) kept.push(f);
  }
  return kept;
}

// ── fill writer ────────────────────────────────────────────────────────────

export interface FieldFill {
  pageIndex: number;
  rect: FracRect;
  text: string;
}

/**
 * Draw entered values into a flat form at the detected field positions. Text is
 * additive (the page keeps its vector content), left-aligned at the blank, sized
 * to the blank's height. Empty values are skipped.
 *
 * @param file - The source PDF.
 * @param fills - Field rects (page fractions, top-left) + the text to write.
 * @returns New PDF bytes with the values drawn in.
 */
export async function fillFlatFormFields(file: File, fills: FieldFill[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(await file.arrayBuffer());
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const ink = rgb(0.06, 0.09, 0.16);

  for (const f of fills) {
    const text = f.text.trim();
    if (!text) continue;
    const page = pages[f.pageIndex];
    if (!page) continue;
    const { width: W, height: H } = page.getSize();
    const boxTop = f.rect.yPct * H;
    const boxH = f.rect.hPct * H;
    const x = f.rect.xPct * W + 1;
    // Fit the value within the blank: start from a height-keyed size, shrink to a
    // floor, then truncate with an ellipsis if it still overflows — so a long
    // answer never runs across neighbouring text or off the page.
    const avail = Math.max(1, f.rect.wPct * W - 2);
    let size = Math.min(14, Math.max(8, boxH * 0.85));
    let drawn = text;
    if (font.widthOfTextAtSize(drawn, size) > avail) {
      const floor = 6;
      const shrunk = (size * avail) / font.widthOfTextAtSize(drawn, size);
      size = Math.max(floor, shrunk);
      if (font.widthOfTextAtSize(drawn, size) > avail) {
        while (drawn.length > 1 && font.widthOfTextAtSize(`${drawn}…`, size) > avail) {
          drawn = drawn.slice(0, -1);
        }
        drawn = `${drawn}…`;
      }
    }
    // top-left box → pdf-lib bottom-left baseline, nudged up off the line.
    const y = H - (boxTop + boxH) + boxH * 0.22;
    page.drawText(drawn, { x, y, size, font, color: ink });
  }

  return pdf.save();
}
