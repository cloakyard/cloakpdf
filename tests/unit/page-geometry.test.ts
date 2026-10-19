import { describe, expect, it } from "vite-plus/test";
import { PDFDocument, PDFName, PDFNumber, degrees } from "@pdfme/pdf-lib";
import { cropPagesIndividual } from "../../src/utils/pdf/transform.ts";
import { visiblePageGeometry } from "../../src/utils/pdf/page-geometry.ts";
import { fillPdfForm } from "../../src/utils/pdf/forms.ts";

const file = (bytes: Uint8Array) => new File([bytes.slice()], "geometry.pdf");

describe("visible page cropping", () => {
  it.each([0, 90, 180, 270])(
    "trims the current visible box twice at %i degrees",
    async (rotation) => {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([600, 800]);
      page.setCropBox(50, 70, 400, 300);
      page.setRotation(degrees(rotation));
      page.node.set(PDFName.of("UserUnit"), PDFNumber.of(2));
      const initial = visiblePageGeometry(page);
      const margins = new Map([[0, { left: 10, right: 20, top: 30, bottom: 40 }]]);
      let bytes: Uint8Array = await pdf.save();
      for (let n = 1; n <= 2; n++) {
        const result = await cropPagesIndividual(file(bytes), margins);
        expect(result.croppedCount).toBe(1);
        bytes = result.bytes;
        const saved = (await PDFDocument.load(bytes)).getPage(0);
        const visible = visiblePageGeometry(saved);
        expect(visible.width).toBeCloseTo(initial.width - 30 * n);
        expect(visible.height).toBeCloseTo(initial.height - 70 * n);
        expect(saved.getRotation().angle).toBe(rotation);
        expect(saved.getMediaBox()).toEqual(page.getMediaBox());
      }
    },
  );

  it("ignores invalid, expanding and empty crop requests", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage([400, 300]).setCropBox(20, 30, 200, 150);
    for (const left of [-1, NaN, Infinity, 200]) {
      const result = await cropPagesIndividual(
        file(await pdf.save()),
        new Map([[0, { left, right: 0, top: 0, bottom: 0 }]]),
      );
      expect(result.croppedCount).toBe(0);
      expect((await PDFDocument.load(result.bytes)).getPage(0).getCropBox()).toEqual(
        pdf.getPage(0).getCropBox(),
      );
    }
  });
});

describe("native form geometry stays owned by the PDF", () => {
  it.each([0, 90, 180, 270])(
    "preserves widget bounds and page boxes at %i degrees",
    async (rotation) => {
      const pdf = await PDFDocument.create();
      const page = pdf.addPage([600, 800]);
      page.setCropBox(50, 70, 400, 300);
      page.setRotation(degrees(rotation));
      const field = pdf.getForm().createTextField("name");
      field.addToPage(page, { x: 100, y: 200, width: 180, height: 24 });
      const rect = field.acroField.getWidgets()[0].getRectangle();
      const result = await fillPdfForm(file(await pdf.save()), { name: "Air" });
      const saved = await PDFDocument.load(result);
      const filled = saved.getForm().getTextField("name");
      expect(filled.getText()).toBe("Air");
      expect(filled.acroField.getWidgets()[0].getRectangle()).toEqual(rect);
      expect(saved.getPage(0).getCropBox()).toEqual(page.getCropBox());
      expect(saved.getPage(0).getRotation().angle).toBe(rotation);
    },
  );
});
