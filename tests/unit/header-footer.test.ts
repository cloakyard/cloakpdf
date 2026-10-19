import { describe, expect, it } from "vite-plus/test";
import { PDFDocument, PDFName, PDFNumber, degrees } from "@pdfme/pdf-lib";
import type { HeaderFooterOptions } from "../../src/types.ts";
import { addHeaderFooter } from "../../src/utils/pdf/stamps.ts";
import { headerFooterRuns } from "../../src/utils/pdf/header-footer.ts";

const options: HeaderFooterOptions = {
  headerLeft: "{title}",
  headerCenter: "",
  headerRight: "{date}",
  footerLeft: "",
  footerCenter: "Page {page} of {total}",
  footerRight: "",
  fontSize: 10,
  margin: 36,
  color: { r: 100, g: 116, b: 139 },
  skipFirstPage: false,
  timestamp: new Date(2026, 9, 15, 12, 34).getTime(),
};
const context = {
  title: "Proof",
  page: 2,
  total: 3,
  filename: "example",
  date: new Date(options.timestamp!),
};
const file = (bytes: Uint8Array) => new File([bytes.slice()], "header-footer.pdf");
describe("header and footer", () => {
  it("expands metadata, numbering and a captured clock with all six alignments", () => {
    const runs = headerFooterRuns(
      { ...options, headerCenter: "Center", footerLeft: "{filename}", footerRight: "{time}" },
      context,
      600,
      800,
      (t) => t.length * 5,
    );
    expect(runs).toHaveLength(6);
    expect(runs[0]).toMatchObject({ text: "Proof", x: 36, y: 46 });
    expect(runs[1]).toMatchObject({ text: "Center", x: 285, y: 46 });
    expect(runs[2].x + runs[2].width).toBe(564);
    expect(runs[3]).toMatchObject({ text: "example", x: 36, y: 764 });
    expect(runs[4]).toMatchObject({ text: "Page 2 of 3", x: 272.5, y: 764 });
    expect(runs[5].text).toBe(
      context.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    );
    expect(
      headerFooterRuns(
        { ...options, skipFirstPage: true },
        { ...context, page: 1 },
        600,
        800,
        () => 10,
      ),
    ).toEqual([]);
  });
  it("rejects overlapping fields and multiline values before drawing", () => {
    expect(() => headerFooterRuns(options, context, 400, 600, () => 200)).toThrow(
      "overlaps on page 2",
    );
    expect(() =>
      headerFooterRuns({ ...options, headerLeft: "Line\nbreak" }, context, 600, 800, () => 20),
    ).toThrow("single line");
  });
  it("reports invalid dimensions, blank expansion and unsupported characters without modifying input", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();
    pdf.addPage();
    const source = file(await pdf.save()),
      original = await source.arrayBuffer();
    for (const patch of [
      { fontSize: 19 },
      { fontSize: NaN },
      { fontSize: 7.5 },
      { margin: 0 },
      { margin: 73 },
      { timestamp: Infinity },
      { color: { r: 300, g: 0, b: 0 } },
    ])
      await expect(addHeaderFooter(source, { ...options, ...patch })).rejects.toThrow();
    await expect(addHeaderFooter(source, { ...options, headerLeft: "😀" })).rejects.toThrow(
      "header left on page 1 contains characters",
    );
    await expect(
      addHeaderFooter(source, { ...options, headerRight: "", footerCenter: "" }),
    ).rejects.toThrow("resolve to empty");
    await expect(
      addHeaderFooter(source, { ...options, headerLeft: " ", headerRight: "", footerCenter: "" }),
    ).rejects.toThrow("Enter header");
    expect(await source.arrayBuffer()).toEqual(original);
  });
  it("rejects an excluded single page and identifies a later page that cannot fit", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage([600, 800]);
    await expect(
      addHeaderFooter(file(await pdf.save()), { ...options, skipFirstPage: true }),
    ).rejects.toThrow("one page");
    pdf.addPage([60, 60]);
    await expect(addHeaderFooter(file(await pdf.save()), options)).rejects.toThrow("page 2");
  });
  it.each([0, 90, 180, 270])(
    "preserves crop, rotation, units and catalog at %i degrees",
    async (rotation) => {
      const pdf = await PDFDocument.create();
      pdf.setTitle("Proof");
      await pdf.attach(new Uint8Array([1, 2, 3]), "proof.txt");
      const p = pdf.addPage([600, 800]);
      p.setCropBox(50, 70, 400, 300);
      p.setRotation(degrees(rotation));
      p.node.set(PDFName.of("UserUnit"), PDFNumber.of(2));
      const result = await PDFDocument.load(await addHeaderFooter(file(await pdf.save()), options));
      expect(result.getTitle()).toBe("Proof");
      expect(result.catalog.has(PDFName.of("Names"))).toBe(true);
      expect(result.getPage(0).getCropBox()).toEqual(p.getCropBox());
      expect(result.getPage(0).getRotation().angle).toBe(rotation);
      expect(result.getPage(0).node.lookup(PDFName.of("UserUnit"), PDFNumber).asNumber()).toBe(2);
    },
  );
});
