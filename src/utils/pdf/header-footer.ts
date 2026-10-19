import type { HeaderFooterOptions } from "../../types.ts";
import { resolveStampTokens, type TokenContext } from "./tokens.ts";

export const HEADER_FOOTER_SLOTS = [
  "headerLeft",
  "headerCenter",
  "headerRight",
  "footerLeft",
  "footerCenter",
  "footerRight",
] as const;
export type HeaderFooterSlot = (typeof HEADER_FOOTER_SLOTS)[number];
export const slotLabel = (slot: HeaderFooterSlot) => slot.replace(/([A-Z])/g, " $1").toLowerCase();

export function validateHeaderFooter(o: HeaderFooterOptions, total: number): void {
  if (!Number.isInteger(o.fontSize) || o.fontSize < 7 || o.fontSize > 18)
    throw new Error("Size must be a whole number from 7 to 18 pt.");
  if (!Number.isInteger(o.margin) || o.margin < 12 || o.margin > 72)
    throw new Error("Margin must be a whole number from 12 to 72 pt.");
  if (![o.color.r, o.color.g, o.color.b].every((v) => Number.isFinite(v) && v >= 0 && v <= 255))
    throw new Error("Choose a valid text colour.");
  if (o.timestamp !== undefined && !Number.isFinite(new Date(o.timestamp).getTime()))
    throw new Error("Read document fields again to refresh the preview time.");
  if (o.skipFirstPage && total < 2)
    throw new Error("This PDF has one page. Turn off Skip first page.");
  if (!HEADER_FOOTER_SLOTS.some((key) => o[key].trim()))
    throw new Error("Enter header or footer text first.");
}

/** Shared top-left geometry; the writer supplies exact embedded-font metrics. */
export function headerFooterRuns(
  o: HeaderFooterOptions,
  context: TokenContext,
  width: number,
  height: number,
  measure: (text: string) => number,
) {
  if (o.skipFirstPage && context.page === 1) return [];
  const runs = HEADER_FOOTER_SLOTS.flatMap((slot) => {
    const text = resolveStampTokens(o[slot], context);
    if (!text.trim()) return [];
    const where = `${slotLabel(slot)} on page ${context.page}`;
    if (/[\r\n\t]/.test(text)) throw new Error(`Use a single line for ${where}.`);
    let tw: number;
    try {
      tw = measure(text);
    } catch {
      throw new Error(
        `The ${where} contains characters Helvetica cannot print. Replace unsupported characters.`,
      );
    }
    if (tw + 2 * o.margin > width || 2 * (o.margin + o.fontSize) > height)
      throw new Error(`The ${where} does not fit. Shorten the text or reduce Size or Margin.`);
    const x = slot.endsWith("Left")
      ? o.margin
      : slot.endsWith("Right")
        ? width - o.margin - tw
        : (width - tw) / 2;
    return [
      {
        slot,
        text,
        x,
        y: slot.startsWith("header") ? o.margin + o.fontSize : height - o.margin,
        width: tw,
      },
    ];
  });
  for (const row of ["header", "footer"]) {
    const ordered = runs.filter((r) => r.slot.startsWith(row)).sort((a, b) => a.x - b.x);
    for (let i = 1; i < ordered.length; i++)
      if (ordered[i - 1].x + ordered[i - 1].width + 4 > ordered[i].x)
        throw new Error(
          `The ${row} text overlaps on page ${context.page}. Shorten a field or reduce Size.`,
        );
  }
  return runs;
}
