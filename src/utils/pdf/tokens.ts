/**
 * Dynamic field tokens for stamp text (headers/footers, watermarks).
 *
 * A user types `{page}`, `{date}`, `{title}`, etc. into a free-text stamp slot
 * and the writer expands it per page at apply time — so "Page {page} of {total}
 * · {date}" or a "{title}" watermark stays correct no matter how the document is
 * later split or reordered. The earlier header/footer code only knew the
 * double-brace `{{page}}`/`{{total}}`; this module is the single source of truth
 * for the richer set and accepts both brace styles so nothing regresses.
 *
 * Pure and side-effect free: the caller supplies the resolved values (page,
 * total, title, filename, and a captured Date) so the same text renders
 * deterministically across every page in one pass.
 */

/** The values a token can expand to for a given page. */
export interface TokenContext {
  /** 1-based number shown for this page. */
  page: number;
  /** Total page count (or the last numbered page). */
  total: number;
  /** Document title (from PDF metadata); empty string when unset. */
  title: string;
  /** Source file name without the `.pdf` extension. */
  filename: string;
  /** A single timestamp captured once per apply, so {date}/{time} agree. */
  date: Date;
}

/** A token the UI can offer as a tap-to-insert chip, with a human label. */
export interface TokenDef {
  /** The literal inserted into the field, e.g. "{page}". */
  token: string;
  /** Short label shown on the chip. */
  label: string;
}

/** The tokens offered in the insert bar, in display order. */
export const STAMP_TOKENS: readonly TokenDef[] = [
  { token: "{page}", label: "Page #" },
  { token: "{total}", label: "Total" },
  { token: "{date}", label: "Date" },
  { token: "{time}", label: "Time" },
  { token: "{title}", label: "Title" },
  { token: "{filename}", label: "File name" },
] as const;

// Matches `{name}` and the legacy `{{name}}` (and tolerates inner spaces),
// case-insensitively, so existing `{{page}}` headers keep working.
const TOKEN_RE = /\{\{?\s*(page|total|date|time|title|filename)\s*\}?\}/gi;

/**
 * Expand every token in `text` against `ctx`. Unknown `{words}` are left
 * untouched (so a literal brace the user wanted survives). Date and time use
 * the browser locale's short forms.
 */
export function resolveStampTokens(text: string, ctx: TokenContext): string {
  return text.replace(TOKEN_RE, (_match, rawName: string) => {
    switch (rawName.toLowerCase()) {
      case "page":
        return String(ctx.page);
      case "total":
        return String(ctx.total);
      case "date":
        return ctx.date.toLocaleDateString();
      case "time":
        return ctx.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      case "title":
        return ctx.title;
      case "filename":
        return ctx.filename;
      default:
        return _match;
    }
  });
}

/** Strip the trailing ".pdf" (case-insensitive) for a clean {filename} value. */
export function baseFileName(name: string): string {
  return name.replace(/\.pdf$/i, "");
}
