/**
 * Annotate — vector overlay (pen / highlighter / shapes / text).
 */

import { PDFDocument, rgb, LineCapStyle, StandardFonts } from "@pdfme/pdf-lib";

// ── Annotate — vector overlay (pen / highlighter / shapes / text) ─

/** RGB colour in the 0–255 range for an annotation. */
export interface AnnotationColor {
  r: number;
  g: number;
  b: number;
}

/** Font for a text annotation: one of three standard-14 families × Bold × Italic
 *  (12 combinations), which every viewer renders natively — no embedding, no
 *  licensing, no file bloat, and the on-canvas preview matches the output via
 *  each family's CSS stack.
 *
 *  Ids use a UNIFORM `-bold`/`-italic` suffix scheme: the all-off case is the
 *  bare family (`helvetica`), so the original 6 ids stay byte-identical and
 *  persisted drafts keep resolving. The Helvetica/Courier "Oblique" vs Times
 *  "Italic" naming asymmetry is absorbed entirely by {@link STANDARD_FONT} — the
 *  id scheme never branches on family. */
export type TextFontId =
  | "helvetica"
  | "helvetica-bold"
  | "helvetica-italic"
  | "helvetica-bold-italic"
  | "times"
  | "times-bold"
  | "times-italic"
  | "times-bold-italic"
  | "courier"
  | "courier-bold"
  | "courier-italic"
  | "courier-bold-italic";

/**
 * A single annotation, in page-relative fraction coordinates (0–1 from the
 * top-left) so it maps to any page size. Sizes are fractions too — stroke
 * thickness as a fraction of page width, text size as a fraction of page
 * height — so a stroke drawn on the preview lands at the same relative
 * weight in the output regardless of page dimensions.
 */
export type Annotation =
  | {
      kind: "stroke";
      pageIndex: number;
      points: { x: number; y: number }[];
      color: AnnotationColor;
      thicknessFrac: number;
      opacity: number;
    }
  | {
      kind: "rect" | "ellipse";
      pageIndex: number;
      x: number;
      y: number;
      w: number;
      h: number;
      color: AnnotationColor;
      thicknessFrac: number;
      /** Optional interior fill. Omit for an outline-only shape. */
      fill?: { color: AnnotationColor; opacity?: number };
    }
  | {
      kind: "line" | "arrow";
      pageIndex: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: AnnotationColor;
      thicknessFrac: number;
    }
  | {
      kind: "text";
      pageIndex: number;
      /** Top-left anchor of the text, in page fractions (0–1, top-left origin). */
      x: number;
      y: number;
      /** Text box size in page fractions. When set, the text wraps to `w` and the
       *  box is the resizable/movable region; the background (when present) fills
       *  it. Omitted on legacy point-anchored labels, which render as a single
       *  auto-width line (the original behaviour). */
      w?: number;
      h?: number;
      text: string;
      sizeFrac: number;
      color: AnnotationColor;
      /** One of the standard-14 families; defaults to Helvetica when absent. */
      font?: TextFontId;
      /** Optional opaque background drawn behind the text — lets a label sit on
       *  top of (and mask) existing page content. Omit for transparent text. */
      bg?: { color: AnnotationColor; opacity?: number };
    };

/** Text-font id → the pdf-lib standard font it embeds as. The only place the
 *  Oblique-vs-Italic naming asymmetry lives (Helvetica/Courier use `-Oblique`,
 *  Times uses `-Italic`). */
const STANDARD_FONT: Record<TextFontId, StandardFonts> = {
  helvetica: StandardFonts.Helvetica,
  "helvetica-bold": StandardFonts.HelveticaBold,
  "helvetica-italic": StandardFonts.HelveticaOblique,
  "helvetica-bold-italic": StandardFonts.HelveticaBoldOblique,
  times: StandardFonts.TimesRoman,
  "times-bold": StandardFonts.TimesRomanBold,
  "times-italic": StandardFonts.TimesRomanItalic,
  "times-bold-italic": StandardFonts.TimesRomanBoldItalic,
  courier: StandardFonts.Courier,
  "courier-bold": StandardFonts.CourierBold,
  "courier-italic": StandardFonts.CourierOblique,
  "courier-bold-italic": StandardFonts.CourierBoldOblique,
};

/** Every valid {@link TextFontId}, for exhaustiveness checks / tests. */
export const TEXT_FONT_IDS: readonly TextFontId[] = Object.keys(STANDARD_FONT) as TextFontId[];

/** The three standard-14 families a text annotation can use. */
export type FontFamily = "helvetica" | "times" | "courier";

/** (family, bold, italic) → the resolved {@link TextFontId}. Uniform suffix
 *  scheme: the all-off case is the bare family, byte-identical to the original
 *  6 ids — so persisted drafts keep resolving. The Oblique-vs-Italic naming
 *  asymmetry lives only in {@link STANDARD_FONT}, never here. */
export function resolveTextFont(family: FontFamily, bold: boolean, italic: boolean): TextFontId {
  return `${family}${bold ? "-bold" : ""}${italic ? "-italic" : ""}` as TextFontId;
}

/** Inverse of {@link resolveTextFont}. */
export function decomposeTextFont(id: TextFontId): {
  family: FontFamily;
  bold: boolean;
  italic: boolean;
} {
  return {
    family: id.split("-")[0] as FontFamily,
    bold: id.includes("-bold"),
    italic: id.includes("-italic"),
  };
}

// Text-annotation box geometry, shared (by value) with the on-canvas preview in
// AnnotateTool so what you place is what you get. The anchor `y` is the box top;
// the baseline drops one font size below it, and the background — when present —
// spans from the anchor down past the descenders, padded sideways off the glyphs.
export const TEXT_BG_HEIGHT_EM = 1.25;
export const TEXT_BG_PAD_EM = 0.12;
/** Baseline-to-baseline spacing for wrapped text-box lines, in font ems. Shared
 *  by the burn path and the on-canvas preview so wrapping matches what you place. */
export const TEXT_LINE_EM = 1.2;

/** Greedy word-wrap a string to `maxWidth`, honouring explicit `\n` and breaking
 *  words longer than the box. `measure(s)` returns the rendered width of `s` in
 *  the same unit as `maxWidth` — canvas `measureText` for the preview, pdf-lib's
 *  `widthOfTextAtSize` for the burn — so both paths produce identical line breaks.
 */
export function wrapTextToWidth(
  text: string,
  maxWidth: number,
  measure: (s: string) => number,
): string[] {
  if (maxWidth <= 0) return text.split("\n");
  const breakWord = (word: string): string[] => {
    const chunks: string[] = [];
    let chunk = "";
    for (const ch of word) {
      if (chunk !== "" && measure(chunk + ch) > maxWidth) {
        chunks.push(chunk);
        chunk = ch;
      } else {
        chunk += ch;
      }
    }
    if (chunk) chunks.push(chunk);
    return chunks;
  };
  const out: string[] = [];
  for (const para of text.split("\n")) {
    if (para === "") {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of para.split(" ")) {
      const candidate = line === "" ? word : `${line} ${word}`;
      if (measure(candidate) <= maxWidth) {
        line = candidate;
      } else {
        if (line !== "") out.push(line);
        if (measure(word) <= maxWidth) {
          line = word;
        } else {
          const parts = breakWord(word);
          for (let i = 0; i < parts.length - 1; i++) out.push(parts[i]);
          line = parts[parts.length - 1] ?? "";
        }
      }
    }
    out.push(line);
  }
  return out;
}

/**
 * Burn annotations onto a PDF as vector graphics.
 *
 * Unlike redaction, this is additive and non-destructive: the existing
 * page content (including selectable text) is untouched — pen strokes,
 * highlights, boxes, and text labels are drawn on top via pdf-lib's
 * vector primitives, so the result stays a real PDF, not a flattened
 * image. Coordinates arrive top-left-origin in fractions and are
 * converted to pdf-lib's bottom-left point space per page.
 *
 * @param file - The source PDF.
 * @param annotations - Annotations to draw, each tagged with its page.
 * @returns Annotated PDF bytes.
 */
export async function annotatePdf(file: File, annotations: Annotation[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const pages = pdf.getPages();
  // Embed each text font at most once, lazily — only the families actually used.
  const fontCache = new Map<TextFontId, Awaited<ReturnType<typeof pdf.embedFont>>>();
  const getFont = async (id: TextFontId) => {
    let f = fontCache.get(id);
    if (!f) {
      // A font id absent from the map (e.g. a corrupt draft) would otherwise make
      // embedFont(undefined) throw inside the per-label try/catch below and drop
      // the label silently — indistinguishable from an un-encodable-glyph skip.
      // Surface it and fall back to Helvetica so the text still renders.
      const std = STANDARD_FONT[id] as StandardFonts | undefined;
      if (!std) console.warn(`annotatePdf: unknown text font id "${id}", using Helvetica`);
      f = await pdf.embedFont(std ?? StandardFonts.Helvetica);
      fontCache.set(id, f);
    }
    return f;
  };

  for (const a of annotations) {
    const page = pages[a.pageIndex];
    if (!page) continue;
    const { width: W, height: H } = page.getSize();
    const color = rgb(a.color.r / 255, a.color.g / 255, a.color.b / 255);

    if (a.kind === "stroke") {
      if (a.points.length < 2) continue;
      const thickness = Math.max(0.5, a.thicknessFrac * W);
      for (let i = 1; i < a.points.length; i++) {
        const p0 = a.points[i - 1];
        const p1 = a.points[i];
        page.drawLine({
          start: { x: p0.x * W, y: (1 - p0.y) * H },
          end: { x: p1.x * W, y: (1 - p1.y) * H },
          thickness,
          color,
          opacity: a.opacity,
          lineCap: LineCapStyle.Round,
        });
      }
    } else if (a.kind === "rect") {
      const fill = a.fill
        ? rgb(a.fill.color.r / 255, a.fill.color.g / 255, a.fill.color.b / 255)
        : undefined;
      page.drawRectangle({
        x: a.x * W,
        y: (1 - a.y - a.h) * H,
        width: a.w * W,
        height: a.h * H,
        borderColor: color,
        borderWidth: Math.max(0.5, a.thicknessFrac * W),
        color: fill,
        opacity: a.fill ? (a.fill.opacity ?? 1) : 0,
        borderOpacity: 1,
      });
    } else if (a.kind === "ellipse") {
      const fill = a.fill
        ? rgb(a.fill.color.r / 255, a.fill.color.g / 255, a.fill.color.b / 255)
        : undefined;
      page.drawEllipse({
        x: (a.x + a.w / 2) * W,
        y: (1 - (a.y + a.h / 2)) * H,
        xScale: (a.w / 2) * W,
        yScale: (a.h / 2) * H,
        borderColor: color,
        borderWidth: Math.max(0.5, a.thicknessFrac * W),
        color: fill,
        opacity: a.fill ? (a.fill.opacity ?? 1) : 0,
        borderOpacity: 1,
      });
    } else if (a.kind === "line" || a.kind === "arrow") {
      const thickness = Math.max(0.5, a.thicknessFrac * W);
      const start = { x: a.x1 * W, y: (1 - a.y1) * H };
      const end = { x: a.x2 * W, y: (1 - a.y2) * H };
      page.drawLine({ start, end, thickness, color, lineCap: LineCapStyle.Round });
      if (a.kind === "arrow") {
        // Two short segments off the end point form the arrowhead.
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = Math.max(6, thickness * 3.5);
        for (const spread of [Math.PI - 0.45, Math.PI + 0.45]) {
          page.drawLine({
            start: end,
            end: {
              x: end.x + headLen * Math.cos(angle + spread),
              y: end.y + headLen * Math.sin(angle + spread),
            },
            thickness,
            color,
            lineCap: LineCapStyle.Round,
          });
        }
      }
    } else if (a.kind === "text") {
      if (!a.text) continue;
      // The standard-14 fonts only encode WinAnsi (Latin-1). A label containing
      // glyphs they can't represent (emoji, CJK, …) throws inside pdf-lib's
      // encoder; catch it per-label so one bad mark can't abort the whole batch
      // (the on-canvas preview happily renders those glyphs, so this is the one
      // place the two paths can diverge). The label is simply skipped.
      try {
        const font = await getFont(a.font ?? "helvetica");
        const size = a.sizeFrac * H;
        const top = (1 - a.y) * H; // top edge of the text in pdf (bottom-left) space
        if (a.w != null && a.h != null) {
          // Box text: wrap to the box width, draw lines from the top down. The
          // background (when present) fills the whole box; padded sideways so
          // glyphs don't touch the edge.
          const padX = size * TEXT_BG_PAD_EM;
          const boxW = a.w * W;
          const boxH = a.h * H;
          if (a.bg) {
            page.drawRectangle({
              x: a.x * W,
              y: top - boxH,
              width: boxW,
              height: boxH,
              color: rgb(a.bg.color.r / 255, a.bg.color.g / 255, a.bg.color.b / 255),
              opacity: a.bg.opacity ?? 1,
            });
          }
          const lines = wrapTextToWidth(a.text, Math.max(1, boxW - padX * 2), (s) =>
            font.widthOfTextAtSize(s, size),
          );
          const lineH = size * TEXT_LINE_EM;
          lines.forEach((ln, i) => {
            if (ln)
              page.drawText(ln, {
                x: a.x * W + padX,
                y: top - size - i * lineH,
                size,
                font,
                color,
              });
          });
        } else {
          // Legacy point-anchored single line: baseline one size below the anchor.
          const baseline = top - size;
          if (a.bg) {
            // Opaque backing so the label masks whatever sits under it. Spans from
            // the anchor down past the descenders; padded sideways off the glyphs.
            const padX = size * TEXT_BG_PAD_EM;
            const bgH = size * TEXT_BG_HEIGHT_EM;
            page.drawRectangle({
              x: a.x * W - padX,
              y: top - bgH,
              width: font.widthOfTextAtSize(a.text, size) + padX * 2,
              height: bgH,
              color: rgb(a.bg.color.r / 255, a.bg.color.g / 255, a.bg.color.b / 255),
              opacity: a.bg.opacity ?? 1,
            });
          }
          page.drawText(a.text, { x: a.x * W, y: baseline, size, font, color });
        }
      } catch {
        // Un-encodable label — skip it rather than failing every other mark.
      }
    }
  }

  return pdf.save();
}
