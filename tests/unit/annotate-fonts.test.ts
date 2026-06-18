/**
 * Font model for text annotations — the family × Bold × Italic → standard-14 id
 * scheme and its burn-time mapping.
 *
 * Two regressions this guards against:
 *   1. A renamed/missing id breaking the (family,bold,italic) ↔ id round-trip —
 *      or the all-off case drifting off the *bare* legacy id, which would
 *      fragment persisted drafts.
 *   2. A wrong STANDARD_FONT entry (e.g. Times mapped to an "-Oblique" that
 *      doesn't exist) silently dropping the label inside annotatePdf's
 *      un-encodable-glyph try/catch. We assert the burned BaseFont per id.
 */
import { PDFDict, PDFDocument, PDFName } from "@pdfme/pdf-lib";
import { describe, expect, it } from "vitest";
import {
  annotatePdf,
  decomposeTextFont,
  type FontFamily,
  resolveTextFont,
  TEXT_FONT_IDS,
  type TextFontId,
} from "../../src/utils/pdf-operations.ts";

const FAMILIES: FontFamily[] = ["helvetica", "times", "courier"];

/** id → the BaseFont string pdf-lib embeds (the StandardFonts enum value). */
const EXPECTED_BASEFONT: Record<TextFontId, string> = {
  helvetica: "Helvetica",
  "helvetica-bold": "Helvetica-Bold",
  "helvetica-italic": "Helvetica-Oblique",
  "helvetica-bold-italic": "Helvetica-BoldOblique",
  times: "Times-Roman",
  "times-bold": "Times-Bold",
  "times-italic": "Times-Italic",
  "times-bold-italic": "Times-BoldItalic",
  courier: "Courier",
  "courier-bold": "Courier-Bold",
  "courier-italic": "Courier-Oblique",
  "courier-bold-italic": "Courier-BoldOblique",
};

const toFile = (bytes: Uint8Array) =>
  new File([bytes as BlobPart], "f.pdf", { type: "application/pdf" });
const blankPdf = async () => {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.addPage([300, 400]);
  return doc.save();
};

/** Every embedded BaseFont name in the document. */
function baseFonts(doc: PDFDocument): Set<string> {
  const names = new Set<string>();
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFDict)) continue;
    const bf = obj.lookupMaybe(PDFName.of("BaseFont"), PDFName)?.decodeText();
    if (bf) names.add(bf);
  }
  return names;
}

describe("resolveTextFont / decomposeTextFont", () => {
  it("round-trips all family × bold × italic combinations", () => {
    for (const family of FAMILIES) {
      for (const bold of [false, true]) {
        for (const italic of [false, true]) {
          const id = resolveTextFont(family, bold, italic);
          expect(decomposeTextFont(id)).toEqual({ family, bold, italic });
        }
      }
    }
  });

  it("maps the all-off case to the bare family id (legacy-compatible)", () => {
    expect(resolveTextFont("helvetica", false, false)).toBe("helvetica");
    expect(resolveTextFont("times", false, false)).toBe("times");
    expect(resolveTextFont("courier", false, false)).toBe("courier");
  });

  it("keeps the six legacy ids verbatim and valid", () => {
    const legacy: TextFontId[] = [
      "helvetica",
      "helvetica-bold",
      "times",
      "times-bold",
      "courier",
      "courier-bold",
    ];
    for (const id of legacy) {
      expect(TEXT_FONT_IDS).toContain(id);
      // they must still decompose to a bold-only (never italic) style.
      expect(decomposeTextFont(id).italic).toBe(false);
    }
  });

  it("exposes exactly the twelve ids", () => {
    expect([...TEXT_FONT_IDS].sort()).toEqual(Object.keys(EXPECTED_BASEFONT).sort());
  });
});

describe("annotatePdf — text font embedding", () => {
  it("burns each of the twelve ids to its expected standard BaseFont", async () => {
    const src = await blankPdf();
    for (const id of TEXT_FONT_IDS) {
      const out = await annotatePdf(toFile(src), [
        {
          kind: "text",
          pageIndex: 0,
          x: 0.2,
          y: 0.2,
          text: "Sample 123",
          sizeFrac: 0.05,
          color: { r: 0, g: 0, b: 0 },
          font: id,
        },
      ]);
      const doc = await PDFDocument.load(out);
      expect(out.length).toBeGreaterThan(src.length);
      expect(baseFonts(doc)).toContain(EXPECTED_BASEFONT[id]);
    }
  });

  it("falls back to Helvetica (no throw) for an unknown font id", async () => {
    const out = await annotatePdf(toFile(await blankPdf()), [
      {
        kind: "text",
        pageIndex: 0,
        x: 0.2,
        y: 0.2,
        text: "Fallback",
        sizeFrac: 0.05,
        color: { r: 0, g: 0, b: 0 },
        // a corrupt/legacy-unknown id should render, not vanish.
        font: "garbage-id" as TextFontId,
      },
    ]);
    expect(baseFonts(await PDFDocument.load(out))).toContain("Helvetica");
  });
});
