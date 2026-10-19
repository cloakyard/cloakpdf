import { describe, expect, it } from "vite-plus/test";
import { PDFDocument, PDFName, PDFNumber, degrees } from "@pdfme/pdf-lib";
import type { PageNumberOptions } from "../../src/types.ts";
import { addPageNumbers } from "../../src/utils/pdf/stamps.ts";
import { pageNumberText } from "../../src/utils/pdf/page-numbering.ts";

const options: PageNumberOptions = {
  position: "bottom-center",
  format: "Page 1 of N",
  firstPage: 2,
  startNumber: 7,
  fontSize: 12,
  margin: 36,
  color: { r: 30, g: 41, b: 59 },
};
const file = (bytes: Uint8Array) => new File([bytes.slice()], "numbering.pdf");
describe("page numbering", () => {
  it("skips a cover and counts the final label consistently in each format", () => {
    expect(pageNumberText(options, 1, 4)).toBe("");
    expect(pageNumberText(options, 2, 4)).toBe("Page 7 of 9");
    expect(pageNumberText(options, 4, 4)).toBe("Page 9 of 9");
    expect(pageNumberText({ ...options, format: "1 / N" }, 3, 4)).toBe("8 / 9");
    expect(pageNumberText({ ...options, format: "Page 1" }, 3, 4)).toBe("Page 8");
    expect(pageNumberText({ ...options, format: "1" }, 3, 4)).toBe("8");
  });
  it("rejects invalid sequences and dimensions without mutating the source", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    pdf.addPage();
    const source = file(await pdf.save());
    const original = await source.arrayBuffer();
    for (const patch of [
      { firstPage: 0 },
      { firstPage: 3 },
      { firstPage: 1.5 },
      { startNumber: 0 },
      { startNumber: Infinity },
      { startNumber: 1000000 },
      { fontSize: NaN },
      { fontSize: 7 },
      { fontSize: 25 },
      { margin: -1 },
      { margin: 73 },
      { color: { r: 300, g: 0, b: 0 } },
    ])
      await expect(addPageNumbers(source, { ...options, ...patch })).rejects.toThrow();
    expect(await source.arrayBuffer()).toEqual(original);
  });
  it("reports the exact mixed-size page that cannot fit the text", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage([600, 800]);
    pdf.addPage([50, 60]);
    const source = file(await pdf.save());
    await expect(addPageNumbers(source, { ...options, firstPage: 1 })).rejects.toThrow("page 2");
    const result = await addPageNumbers(source, {
      ...options,
      format: "1",
      fontSize: 8,
      margin: 12,
    });
    expect((await PDFDocument.load(result)).getPageCount()).toBe(2);
  });
  it.each([0, 90, 180, 270])(
    "preserves cropped page geometry and metadata at %i degrees",
    async (rotation) => {
      const pdf = await PDFDocument.create();
      pdf.setTitle("Numbering proof");
      const page = pdf.addPage([600, 800]);
      page.setCropBox(50, 70, 400, 300);
      page.setRotation(degrees(rotation));
      page.node.set(PDFName.of("UserUnit"), PDFNumber.of(2));
      const result = await PDFDocument.load(
        await addPageNumbers(file(await pdf.save()), { ...options, firstPage: 1 }),
      );
      expect(result.getTitle()).toBe("Numbering proof");
      expect(result.getPage(0).getCropBox()).toEqual(page.getCropBox());
      expect(result.getPage(0).getRotation().angle).toBe(rotation);
      expect(result.getPage(0).node.lookup(PDFName.of("UserUnit"), PDFNumber).asNumber()).toBe(2);
    },
  );
});
