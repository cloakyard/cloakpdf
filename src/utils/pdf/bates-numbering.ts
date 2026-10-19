import type { BatesNumberOptions } from "../../types.ts";

/** Pages are one-based. Padding is a minimum; identifiers never wrap or truncate. */
export function batesNumberText(o: BatesNumberOptions, page: number): string {
  return `${o.prefix}${String(o.startNumber + page - 1).padStart(o.digits, "0")}${o.suffix}`;
}

export function validateBatesNumbers(o: BatesNumberOptions, total: number): void {
  if (!Number.isInteger(o.startNumber) || o.startNumber < 1 || o.startNumber > 999999999)
    throw new Error("Start at must be a whole number from 1 to 999999999.");
  if (!Number.isSafeInteger(total) || total < 1 || !Number.isSafeInteger(o.startNumber + total - 1))
    throw new Error("The sequence is too large to keep every identifier unique.");
  if (!Number.isInteger(o.digits) || o.digits < 1 || o.digits > 12)
    throw new Error("Minimum digits must be a whole number from 1 to 12.");
  if (!Number.isInteger(o.fontSize) || o.fontSize < 8 || o.fontSize > 24)
    throw new Error("Size must be a whole number from 8 to 24 pt.");
  if (!Number.isInteger(o.margin) || o.margin < 12 || o.margin > 72)
    throw new Error("Margin must be a whole number from 12 to 72 pt.");
  if (!/^(top|bottom)-(left|center|right)$/.test(o.position))
    throw new Error("Choose a Bates-number position.");
  if (![o.color.r, o.color.g, o.color.b].every((v) => Number.isFinite(v) && v >= 0 && v <= 255))
    throw new Error("Choose a valid identifier colour.");
}

/** Courier is fixed-width (0.6 em). The writer also verifies its exact encoding. */
export function batesNumberRun(
  o: BatesNumberOptions,
  page: number,
  width: number,
  height: number,
  measure: (text: string) => number = (text) => Array.from(text).length * o.fontSize * 0.6,
) {
  const text = batesNumberText(o, page);
  if (/[\r\n\t]/.test(text)) throw new Error("Use a single line for the prefix and suffix.");
  let tw: number;
  try {
    tw = measure(text);
  } catch {
    throw new Error(
      `The identifier on page ${page} contains characters Courier cannot print. Replace unsupported characters in Prefix or Suffix.`,
    );
  }
  if (tw + 2 * o.margin > width || 2 * o.margin + o.fontSize > height)
    throw new Error(
      `The identifier on page ${page} does not fit. Shorten Prefix or Suffix, or reduce Size or Margin.`,
    );
  return {
    text,
    x: o.position.endsWith("left")
      ? o.margin
      : o.position.endsWith("right")
        ? width - tw - o.margin
        : (width - tw) / 2,
    y: o.position.startsWith("top") ? o.margin + o.fontSize : height - o.margin,
  };
}
