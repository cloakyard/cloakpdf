import { describe, expect, it } from "vite-plus/test";
import { degrees, PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber } from "@pdfme/pdf-lib";
import { readingRect, type FracRect } from "../../src/utils/text-select.ts";
import {
  spreadsheetText,
  suggestDividers,
  tableCells,
  tableLines,
} from "../../src/utils/table-capture.ts";
import { cropDoc } from "../../src/editor/crop.ts";
import { isLinkObject, remapLink } from "../../src/editor/link-regions.ts";
import type { CanvasDoc } from "../../src/editor/doc.ts";
import { assemblePdf, splitPdfIntoParts } from "../../src/utils/pdf/pages.ts";
import { prepareDetailLinkCopy } from "../../src/utils/pdf/links.ts";
import { annotatePdf } from "../../src/utils/pdf/annotate.ts";

const box = (xPct: number, yPct: number, wPct: number, hPct: number) => ({
  xPct,
  yPct,
  wPct,
  hPct,
});
const words = [
  ["Room", 0.1, 0.1],
  ["Area", 0.42, 0.1],
  ["Count", 0.72, 0.1],
  ["East", 0.1, 0.2],
  ["wing", 0.155, 0.201],
  ["12", 0.72, 0.2],
  ["West", 0.1, 0.3],
  ["35", 0.42, 0.3],
  ["-3", 0.72, 0.3],
  ["outside", 0.1, 0.9],
] as const;
const visible = box(0.075, 0.07, 0.8, 0.3);
describe("table capture", () => {
  it.each([0, 90, 180, 270])("preserves column gaps and word order at %i degrees", (rotation) => {
    const onPaper = (r: FracRect) => readingRect(r, -rotation);
    const lines = tableLines(
      words.map(([text, x, y]) => ({ text, rect: onPaper(box(x, y, text.length * 0.012, 0.026)) })),
      onPaper(visible),
      rotation,
    );
    const cuts = suggestDividers(lines, visible);
    expect(cuts).toHaveLength(2);
    expect(tableCells(lines, cuts)).toEqual([
      ["Room", "Area", "Count"],
      ["East wing", "", "12"],
      ["West", "35", "-3"],
    ]);
    expect(tableCells(lines, [])[1]).toEqual(["East wing 12"]);
    expect(tableCells(lines, [0.05, ...cuts])[0]).toEqual(["", "Room", "Area", "Count"]);
  });
  it("supports empty areas, a single cell and literal spreadsheet expressions", () => {
    expect(suggestDividers([], visible)).toEqual([]);
    expect(tableCells([[{ text: "single cell", rect: visible }]], [])).toEqual([["single cell"]]);
    expect(
      spreadsheetText([
        ["=4+4", "", "-1.25"],
        ["@SUM(A1)", "+12%", "-SUM(A2)"],
      ]),
    ).toBe("'=4+4\t\t-1.25\n'@SUM(A1)\t+12%\t'-SUM(A2)");
  });
});

it("adds a native detail link without replacing existing interactive content", async () => {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Details");
  const src = pdf.addPage([400, 500]),
    dst = pdf.addPage([400, 500]);
  pdf.getForm().createTextField("existing").addToPage(src, { x: 10, y: 15, width: 80, height: 18 });
  dst.setCropBox(10, 20, 380, 460);
  dst.setRotation(degrees(90));
  dst.node.set(PDFName.of("UserUnit"), PDFNumber.of(1.5));
  const original = new File([new Uint8Array(await pdf.save())], "two.pdf");
  const annotation = {
    kind: "link",
    pageIndex: 0,
    x: 0.1,
    y: 0.2,
    w: 0.3,
    h: 0.1,
    target: { pageIndex: 1, rect: box(0.25, 0.25, 0.5, 0.5) },
  } as const;
  const output = await annotatePdf(original, [annotation]);
  const result = await PDFDocument.load(output);
  expect(result.getTitle()).toBe("Details");
  expect(result.getForm().getTextField("existing")).toBeDefined();
  const annotations = result.getPage(0).node.lookup(PDFName.of("Annots"), PDFArray);
  expect(annotations.size()).toBe(2);
  const link = annotations.lookup(1, PDFDict);
  expect(link.get(PDFName.of("Subtype"))?.toString()).toBe("/Link");
  expect(link.lookup(PDFName.of("Rect"), PDFArray).asRectangle()).toEqual({
    x: 40,
    y: expect.closeTo(350, 6),
    width: 120,
    height: 50,
  });
  const dest = link.lookup(PDFName.of("Dest"), PDFArray);
  expect(dest.get(0)).toEqual(result.getPage(1).ref);
  expect(dest.get(1)?.toString()).toBe("/FitR");
  expect([2, 3, 4, 5].map((i) => dest.lookup(i, PDFNumber).asNumber())).toEqual([
    105, 135, 295, 365,
  ]);
  await expect(annotatePdf(original, [{ ...annotation, w: 0 }])).rejects.toThrow("area");
});

it("clips each end of a pending link independently and retires a missing destination", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage([400, 500]);
  pdf.addPage([400, 500]);
  const doc: CanvasDoc = {
    id: "crop",
    fileName: "crop.pdf",
    bytes: await pdf.save(),
    pageCount: 2,
    pages: [0, 1].map((index) => ({ index, widthPt: 400, heightPt: 500, thumbUrl: null })),
    objects: [
      {
        id: "reference",
        kind: "annotation",
        pageIndex: 0,
        payload: {
          kind: "link",
          pageIndex: 0,
          x: 0.1,
          y: 0.1,
          w: 0.2,
          h: 0.1,
          target: { pageIndex: 1, rect: box(0.2, 0.3, 0.4, 0.4) },
        },
      },
    ],
  };
  const result = await cropDoc(doc, new Map([[1, box(0.3, 0.0, 0.5, 1)]]));
  const link = result.objects[0];
  expect(isLinkObject(link)).toBe(true);
  if (!isLinkObject(link)) throw new Error("Missing link");
  expect(link.payload.x).toBe(0.1);
  expect(link.payload.target.rect).toEqual({
    xPct: 0,
    yPct: 0.3,
    wPct: expect.closeTo(0.6, 6),
    hPct: expect.closeTo(0.4, 6),
  });
  const swapped = remapLink(link, (r) => ({ ...r, pageIndex: 1 - r.pageIndex }));
  expect(swapped[0]).toMatchObject({ pageIndex: 1, payload: { target: { pageIndex: 0 } } });
  expect(remapLink(link, (r) => (r.pageIndex === 1 ? undefined : r))).toEqual([]);
  expect((await cropDoc(doc, new Map([[0, box(0.5, 0.5, 0.5, 0.5)]]))).objects).toEqual([]);
});

it("keeps detail destinations in the page tree after extraction and omits an excluded target", async () => {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < 3; i++) pdf.addPage([400, 500]);
  const file = new File([new Uint8Array(await pdf.save())], "three.pdf");
  const bytes = await annotatePdf(file, [
    {
      kind: "link",
      pageIndex: 0,
      x: 0.1,
      y: 0.2,
      w: 0.2,
      h: 0.1,
      target: { pageIndex: 2, rect: visible },
    },
  ]);
  const assembled = await assemblePdf(
    [bytes],
    [2, 0].map((pageIndex) => ({ kind: "page", pageIndex, sourceIndex: 0 })),
    true,
  );
  const dest = (pdf: PDFDocument, index: number) =>
    pdf.getPage(index).node.Annots()!.lookup(0, PDFDict).lookup(PDFName.of("Dest"), PDFArray);
  const kept = await PDFDocument.load(assembled);
  expect(dest(kept, 1).get(0)).toEqual(kept.getPage(0).ref);
  const [without, targetFirst] = await splitPdfIntoParts(
    new File([new Uint8Array(bytes)], "links.pdf"),
    [[0], [2, 0]],
  );
  const removed = await PDFDocument.load(without);
  expect(removed.getPage(0).node.Annots()?.size()).toBe(0);
  const physicalPages = removed.context
    .enumerateIndirectObjects()
    .filter(([, o]) => o instanceof PDFDict && o.get(PDFName.of("Type")) === PDFName.of("Page"));
  expect(physicalPages).toHaveLength(1);
  const reordered = await PDFDocument.load(targetFirst);
  expect(dest(reordered, 1).get(0)).toEqual(reordered.getPage(0).ref);
});

it("keeps a linked detail in view when its rotated, cropped target is rebuilt as pixels", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage([400, 500]);
  const originalTarget = pdf.addPage([400, 500]);
  originalTarget.setCropBox(10, 20, 380, 460);
  originalTarget.setRotation(degrees(90));
  originalTarget.node.set(PDFName.of("UserUnit"), PDFNumber.of(1.5));
  const bytes = await annotatePdf(new File([new Uint8Array(await pdf.save())], "rotate.pdf"), [
    {
      kind: "link",
      pageIndex: 0,
      x: 0.1,
      y: 0.1,
      w: 0.2,
      h: 0.1,
      target: { pageIndex: 1, rect: box(0.2, 0.25, 0.6, 0.5) },
    },
  ]);
  const original = await PDFDocument.load(bytes),
    out = await PDFDocument.create();
  const bind = prepareDetailLinkCopy(original);
  const [from] = await out.copyPages(original, [0]);
  out.addPage(from);
  const raster = out.addPage([690, 570]);
  bind([
    { page: from, index: 0 },
    { page: raster, index: 1, rasterized: true },
  ]);
  const dest = from.node.Annots()!.lookup(0, PDFDict).lookup(PDFName.of("Dest"), PDFArray);
  expect(dest.get(0)).toEqual(raster.ref);
  expect([2, 3, 4, 5].map((i) => dest.lookup(i, PDFNumber).asNumber())).toEqual([
    138, 142.5, 552, 427.5,
  ]);
});
