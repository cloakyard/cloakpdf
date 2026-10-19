import { describe, expect, it } from "vite-plus/test";
import { PDFDocument, PDFName, PDFNumber, StandardFonts, degrees } from "@pdfme/pdf-lib";
import type { BatesNumberOptions } from "../../src/types.ts";
import { addBatesNumbers } from "../../src/utils/pdf/stamps.ts";
import {
  batesNumberText,
  batesNumberRun,
  validateBatesNumbers,
} from "../../src/utils/pdf/bates-numbering.ts";

const options: BatesNumberOptions = {
  prefix: "CASE-",
  suffix: "-A",
  startNumber: 9999,
  digits: 4,
  position: "bottom-right",
  fontSize: 10,
  margin: 36,
  color: { r: 30, g: 41, b: 59 },
};
const file = (bytes: Uint8Array) => new File([bytes.slice()], "bates.pdf");
describe("Bates numbering", () => {
  it("keeps identifiers distinct as padding grows and supports blank affixes", () => {
    expect([1, 2, 3].map((p) => batesNumberText(options, p))).toEqual([
      "CASE-9999-A",
      "CASE-10000-A",
      "CASE-10001-A",
    ]);
    expect(
      batesNumberText({ ...options, startNumber: 1, digits: 6, prefix: "", suffix: "" }, 1),
    ).toBe("000001");
    expect(batesNumberText({ ...options, startNumber: 999999999 }, 2)).toBe("CASE-1000000000-A");
  });
  it("rejects invalid sequences and dimensions without mutating the source", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    pdf.addPage();
    const source = file(await pdf.save()),
      original = await source.arrayBuffer();
    for (const patch of [
      { startNumber: 0 },
      { startNumber: 1.5 },
      { startNumber: Infinity },
      { startNumber: 1000000000 },
      { digits: 0 },
      { digits: 13 },
      { digits: 1.5 },
      { fontSize: NaN },
      { fontSize: 7 },
      { fontSize: 25 },
      { margin: -1 },
      { margin: 73 },
      { color: { r: 300, g: 0, b: 0 } },
    ])
      await expect(addBatesNumbers(source, { ...options, ...patch })).rejects.toThrow();
    expect(() => validateBatesNumbers(options, Number.MAX_SAFE_INTEGER)).toThrow("unique");
    expect(await source.arrayBuffer()).toEqual(original);
  });
  it("reports the precise mixed-size page that cannot fit", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage([600, 800]);
    pdf.addPage([110, 60]);
    const source = file(await pdf.save());
    await expect(addBatesNumbers(source, options)).rejects.toThrow("page 2 does not fit");
    const result = await addBatesNumbers(source, { ...options, fontSize: 8, margin: 12 });
    expect((await PDFDocument.load(result)).getPageCount()).toBe(2);
  });
  it("rejects multiline and unsupported affixes with actionable messages", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    const source = file(await pdf.save());
    for (const prefix of ["A\nB", "A\rB", "A\tB"])
      await expect(addBatesNumbers(source, { ...options, prefix })).rejects.toThrow("single line");
    await expect(addBatesNumbers(source, { ...options, suffix: "証拠" })).rejects.toThrow(
      "Courier cannot print",
    );
  });
  it("shares exact Courier widths and all six physical baselines", async () => {
    const font = await (await PDFDocument.create()).embedFont(StandardFonts.Courier);
    for (const position of [
      "top-left",
      "top-center",
      "top-right",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ] as const) {
      const o = { ...options, position, prefix: "Évidence-€", suffix: "" };
      const run = batesNumberRun(o, 1, 400, 600);
      expect(run).toEqual(
        batesNumberRun(o, 1, 400, 600, (text) => font.widthOfTextAtSize(text, o.fontSize)),
      );
      const tw = font.widthOfTextAtSize(run.text, o.fontSize);
      expect(run.x).toBe(
        position.endsWith("left")
          ? 36
          : position.endsWith("right")
            ? 400 - 36 - tw
            : (400 - tw) / 2,
      );
      expect(run.y).toBe(position.startsWith("top") ? 46 : 564);
    }
  });
  it.each([0, 90, 180, 270])(
    "preserves cropped page geometry and metadata at %i degrees",
    async (rotation) => {
      const pdf = await PDFDocument.create();
      pdf.setTitle("Bates proof");
      const page = pdf.addPage([600, 800]);
      page.setCropBox(50, 70, 400, 300);
      page.setRotation(degrees(rotation));
      page.node.set(PDFName.of("UserUnit"), PDFNumber.of(2));
      const result = await PDFDocument.load(await addBatesNumbers(file(await pdf.save()), options));
      expect(result.getTitle()).toBe("Bates proof");
      expect(result.getPage(0).getCropBox()).toEqual(page.getCropBox());
      expect(result.getPage(0).getRotation().angle).toBe(rotation);
      expect(result.getPage(0).node.lookup(PDFName.of("UserUnit"), PDFNumber).asNumber()).toBe(2);
    },
  );
});
