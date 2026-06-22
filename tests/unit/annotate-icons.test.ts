/**
 * Coverage for the stampable form-filling icons (tick / cross / dot / circle):
 *   1. `iconGeometry` returns a well-formed unit-square description for each id
 *      (points in range, the right primitive set per icon).
 *   2. `annotatePdf` burns every icon kind without throwing and grows the
 *      content stream (the glyph actually drew something), and a batch of mixed
 *      annotations including icons round-trips to a valid PDF.
 */
import { PDFDocument } from "@pdfme/pdf-lib";
import { describe, expect, it } from "vitest";
import { annotatePdf, type IconId, iconGeometry } from "../../src/utils/pdf-operations.ts";

const ICONS: IconId[] = ["check", "cross", "dot", "circle"];

const toFile = (bytes: Uint8Array) =>
  new File([bytes as BlobPart], "f.pdf", { type: "application/pdf" });
const blankPdf = async () => {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.addPage([300, 400]);
  return doc.save();
};
const black = { r: 0, g: 0, b: 0 };

describe("iconGeometry", () => {
  it("returns in-range geometry for every icon", () => {
    for (const id of ICONS) {
      const g = iconGeometry(id);
      expect(g.weight).toBeGreaterThanOrEqual(0);
      for (const stroke of g.strokes) {
        for (const p of stroke) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(1);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(1);
        }
      }
      for (const c of [g.disc, g.ring]) {
        if (!c) continue;
        expect(c.r).toBeGreaterThan(0);
        expect(c.r).toBeLessThanOrEqual(0.5);
      }
    }
  });

  it("uses the right primitive per icon", () => {
    expect(iconGeometry("check").strokes).toHaveLength(1); // single polyline
    expect(iconGeometry("cross").strokes).toHaveLength(2); // two crossing strokes
    expect(iconGeometry("dot").disc).toBeDefined(); // filled disc
    expect(iconGeometry("dot").strokes).toHaveLength(0);
    expect(iconGeometry("circle").ring).toBeDefined(); // outlined ring
  });
});

describe("annotatePdf — icon stamps", () => {
  it("burns each icon without throwing and emits drawing ops", async () => {
    const base = await blankPdf();
    for (const id of ICONS) {
      const out = await annotatePdf(toFile(base), [
        {
          kind: "icon",
          pageIndex: 0,
          icon: id,
          x: 0.4,
          y: 0.4,
          w: 0.1,
          h: 0.1,
          color: black,
        },
      ]);
      // The stamped page's content stream must be longer than the blank page's.
      expect(out.length).toBeGreaterThan(base.length);
      const reopened = await PDFDocument.load(out);
      expect(reopened.getPageCount()).toBe(1);
    }
  });

  it("round-trips a mixed batch (icon + rect + text) to a valid PDF", async () => {
    const out = await annotatePdf(toFile(await blankPdf()), [
      { kind: "icon", pageIndex: 0, icon: "check", x: 0.1, y: 0.1, w: 0.08, h: 0.08, color: black },
      {
        kind: "rect",
        pageIndex: 0,
        x: 0.3,
        y: 0.3,
        w: 0.2,
        h: 0.1,
        color: black,
        thicknessFrac: 0.004,
      },
      {
        kind: "text",
        pageIndex: 0,
        x: 0.1,
        y: 0.6,
        text: "ok",
        sizeFrac: 0.04,
        color: black,
      },
    ]);
    const reopened = await PDFDocument.load(out);
    expect(reopened.getPageCount()).toBe(1);
  });
});
