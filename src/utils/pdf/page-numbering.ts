import type { PageNumberFormat, PageNumberOptions } from "../../types.ts";

/** One formatter for the live preview and saved PDF. Pages are one-based. */
export function pageNumberText(o: PageNumberOptions, page: number, total: number): string {
  if (page < o.firstPage) return "";
  const number = page - o.firstPage + o.startNumber;
  const last = total - o.firstPage + o.startNumber;
  const formats: Record<PageNumberFormat, string> = {
    "1": `${number}`,
    "Page 1": `Page ${number}`,
    "1 / N": `${number} / ${last}`,
    "Page 1 of N": `Page ${number} of ${last}`,
  };
  return formats[o.format];
}

export function validatePageNumbers(o: PageNumberOptions, total: number): void {
  if (!Number.isInteger(o.firstPage) || o.firstPage < 1 || o.firstPage > total)
    throw new Error(`First page must be a whole number from 1 to ${total}.`);
  if (!Number.isInteger(o.startNumber) || o.startNumber < 1 || o.startNumber > 999999)
    throw new Error("Start at must be a whole number from 1 to 999999.");
  if (!Number.isInteger(o.fontSize) || o.fontSize < 8 || o.fontSize > 24)
    throw new Error("Size must be a whole number from 8 to 24 pt.");
  if (!Number.isInteger(o.margin) || o.margin < 12 || o.margin > 72)
    throw new Error("Margin must be a whole number from 12 to 72 pt.");
  if (
    !/^(top|bottom)-(left|center|right)$/.test(o.position) ||
    !["1", "Page 1", "1 / N", "Page 1 of N"].includes(o.format)
  )
    throw new Error("Choose a page-number position and format.");
  if (
    Object.values(o.color).length !== 3 ||
    ![o.color.r, o.color.g, o.color.b].every((v) => Number.isFinite(v) && v >= 0 && v <= 255)
  )
    throw new Error("Choose a valid page-number colour.");
}
