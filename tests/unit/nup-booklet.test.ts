/**
 * Unit tests for saddle-stitch booklet imposition (bookletOrder) and that
 * nupPages("booklet") produces a correctly-sized 2-up output.
 *
 * The imposition order is the part that must be exactly right — get it wrong and
 * the printed, folded booklet reads out of sequence — so it's pinned against the
 * known side order for 4- and 8-page documents, including blank-leaf padding.
 */
import { PDFDocument, PDFName, PDFNumber, degrees, rgb } from "@pdfme/pdf-lib";
import { describe, expect, it } from "vite-plus/test";
import { bookletOrder, nupPages } from "../../src/utils/pdf/transform.ts";

async function makePdf(n: number): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < n; i++) {
    // Visible source ink complements the separate content-free page case.
    const page = doc.addPage([400, 600]);
    page.drawRectangle({ x: 10, y: 10, width: 50, height: 50, color: rgb(0, 0, 0) });
  }
  const bytes = await doc.save();
  return new File([bytes], "test.pdf", { type: "application/pdf" });
}

describe("bookletOrder", () => {
  it("orders an 8-page document as 8|1 2|7 6|3 4|5 (0-based)", () => {
    // 1-based spec: 8,1, 2,7, 6,3, 4,5 → subtract 1.
    expect(bookletOrder(8)).toEqual([7, 0, 1, 6, 5, 2, 3, 4]);
  });

  it("orders a 4-page document as 4|1 2|3 (0-based)", () => {
    expect(bookletOrder(4)).toEqual([3, 0, 1, 2]);
  });

  it("pads up to a multiple of 4 with -1 blank leaves", () => {
    // 5 pages → padded to 8 leaves; indices ≥ 5 become blanks.
    const order = bookletOrder(5);
    expect(order).toHaveLength(8);
    expect(order.filter((i) => i === -1)).toHaveLength(3); // leaves 6,7,8 → blanks
    expect(order.filter((i) => i >= 0).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4]);
  });

  it("every real page appears exactly once", () => {
    const order = bookletOrder(6).filter((i) => i >= 0);
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('nupPages("booklet")', () => {
  it.each([0, 90, 180, 270])(
    "uses visible physical sheet dimensions at %i degrees",
    async (rotation) => {
      const source = await PDFDocument.create();
      const page = source.addPage([600, 800]);
      page.setCropBox(40, 60, 200, 300);
      page.setRotation(degrees(rotation));
      page.node.set(PDFName.of("UserUnit"), PDFNumber.of(2));
      page.drawText("Visible page");
      const out = await nupPages(new File([await source.save()], "geometry.pdf"), "booklet");
      const sheet = (await PDFDocument.load(out)).getPage(0);
      expect(sheet.getSize()).toEqual(
        rotation % 180 ? { width: 600, height: 400 } : { width: 400, height: 600 },
      );
      expect(sheet.getRotation().angle).toBe(0);
    },
  );

  it("keeps genuinely blank pages without requiring a content stream", async () => {
    const source = await PDFDocument.create();
    source.addPage([400, 600]);
    const out = await nupPages(new File([await source.save()], "blank.pdf"), "booklet");
    expect((await PDFDocument.load(out)).getPageCount()).toBe(2);
  });

  it("emits two 2-up sides per 4 source pages, sheet-sized", async () => {
    const file = await makePdf(8); // → 4 printed sides
    const out = await nupPages(file, "booklet", { cropMarks: true });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(4);
    const p0 = doc.getPage(0).getSize();
    expect(p0.width).toBe(400);
    expect(p0.height).toBe(600);
  });

  it("pads a non-multiple-of-4 document to whole sheets", async () => {
    const file = await makePdf(5); // padded to 8 leaves → 4 sides
    const out = await nupPages(file, "booklet");
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(4);
  });
});
