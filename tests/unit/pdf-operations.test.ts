/**
 * Unit tests for byte-level PDF operations that carry a correctness-of-claim
 * promise the UI makes to the user.
 *
 * `flattenPdf` advertises "removes form fields and annotations". The AcroForm
 * flatten is exercised by the e2e suite in a real browser; here we pin the
 * annotation-stripping half — a privacy promise that's easy to silently
 * regress, since `getForm().flatten()` alone leaves non-widget annotations
 * (comments, highlights, links) on the page.
 */
import {
  PDFArray,
  PDFDocument,
  PDFDict,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFString,
  degrees,
  rgb,
} from "@pdfme/pdf-lib";
import { describe, expect, it } from "vitest";
import {
  addPdfBookmarks,
  analyzePdfHiddenData,
  annotatePdf,
  assemblePdf,
  flattenPdf,
  listPdfAttachments,
  nupPages,
  scrubPdf,
  stripMetadata,
} from "../../src/utils/pdf-operations.ts";

/** An n-page blank PDF as a File, for outline / page-shift assertions. */
async function pagesFile(n: number): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < n; i++) doc.addPage([612, 792]);
  const bytes = await doc.save();
  return new File([bytes], "pages.pdf", { type: "application/pdf" });
}

/** Resolve a dict value (following an indirect ref) to a PDFDict, or throw. */
function lookupDict(doc: PDFDocument, value: unknown): PDFDict {
  const resolved = doc.context.lookup(value as never);
  if (!(resolved instanceof PDFDict)) throw new Error("expected a PDFDict");
  return resolved;
}

/** A one-page PDF whose page carries a single non-widget annotation. */
async function makeAnnotatedPdfBytes(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  // Low-level annotation dict (a square markup) added straight to /Annots —
  // pdf-lib has no high-level API for non-widget annotations.
  const annot = doc.context.obj({
    Type: "Annot",
    Subtype: "Square",
    Rect: [50, 700, 120, 760],
  });
  const annotRef = doc.context.register(annot);
  page.node.set(PDFName.of("Annots"), doc.context.obj([annotRef]));
  return doc.save();
}

describe("flattenPdf", () => {
  it("strips non-widget annotations from every page", async () => {
    const bytes = await makeAnnotatedPdfBytes();

    // Sanity-check the fixture actually has an annotation before flattening.
    const src = await PDFDocument.load(bytes);
    expect(src.getPages()[0].node.get(PDFName.of("Annots"))).toBeDefined();

    const file = new File([bytes as BlobPart], "annotated.pdf", { type: "application/pdf" });
    const flattened = await flattenPdf(file);

    const out = await PDFDocument.load(flattened);
    expect(out.getPages()[0].node.get(PDFName.of("Annots"))).toBeUndefined();
  });

  it("round-trips a clean multi-page PDF without dropping pages", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([612, 792]);
    doc.addPage([612, 792]);
    const bytes = await doc.save();
    const file = new File([bytes as BlobPart], "blank.pdf", { type: "application/pdf" });

    const flattened = await flattenPdf(file);
    const out = await PDFDocument.load(flattened);
    expect(out.getPageCount()).toBe(2);
  });
});

/**
 * A two-page PDF deliberately laced with one of every hidden-data vector
 * Scrub claims to remove: Info metadata, an XMP packet, a JavaScript
 * open-action, an embedded file, and a markup annotation.
 */
async function makeDirtyPdfBytes(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);
  doc.addPage([612, 792]);

  // 1. Document metadata.
  doc.setTitle("SECRET_TITLE");
  doc.setAuthor("SECRET_AUTHOR");

  // 2. XMP metadata packet (catalog /Metadata stream).
  const xmpBytes = new TextEncoder().encode(
    "<?xpacket?><x:xmpmeta>SECRET_XMP</x:xmpmeta><?xpacket end?>",
  );
  const xmpDict = doc.context.obj({
    Type: "Metadata",
    Subtype: "XML",
    Length: xmpBytes.length,
  }) as PDFDict;
  doc.catalog.set(PDFName.of("Metadata"), doc.context.register(PDFRawStream.of(xmpDict, xmpBytes)));

  // 3. JavaScript that runs on open.
  const jsAction = doc.context.obj({
    Type: "Action",
    S: "JavaScript",
    JS: PDFString.of("app.alert('SECRET_JS')"),
  });
  doc.catalog.set(PDFName.of("OpenAction"), doc.context.register(jsAction));

  // 4. Embedded file.
  await doc.attach(new TextEncoder().encode("SECRET_ATTACHMENT"), "secret.txt", {
    mimeType: "text/plain",
  });

  // 5. Markup annotation carrying author-visible text.
  const annot = doc.context.obj({
    Type: "Annot",
    Subtype: "Square",
    Rect: [50, 700, 120, 760],
    Contents: PDFString.of("SECRET_NOTE"),
  });
  doc.getPages()[0].node.set(PDFName.of("Annots"), doc.context.obj([doc.context.register(annot)]));

  return doc.save();
}

const toFile = (bytes: Uint8Array) =>
  new File([bytes as BlobPart], "dirty.pdf", { type: "application/pdf" });

/**
 * Count "ghost" objects still physically present in a document by walking
 * every indirect object — not just those reachable from the catalog. This
 * is what catches pdf-lib's lack of garbage-collection: a dereferenced
 * object is invisible to the catalog yet still written to the bytes.
 */
function ghostCounts(doc: PDFDocument) {
  let xmp = 0;
  let js = 0;
  let embeddedFile = 0;
  let square = 0;
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    const dict = obj instanceof PDFRawStream ? obj.dict : obj instanceof PDFDict ? obj : null;
    if (!dict) continue;
    const type = dict.lookupMaybe(PDFName.of("Type"), PDFName)?.decodeText();
    const subtype = dict.lookupMaybe(PDFName.of("Subtype"), PDFName)?.decodeText();
    const action = dict.lookupMaybe(PDFName.of("S"), PDFName)?.decodeText();
    if (type === "Metadata") xmp++;
    if (type === "EmbeddedFile") embeddedFile++;
    if (action === "JavaScript") js++;
    if (subtype === "Square") square++;
  }
  return { xmp, js, embeddedFile, square };
}

describe("analyzePdfHiddenData", () => {
  it("detects every hidden-data vector", async () => {
    const analysis = await analyzePdfHiddenData(toFile(await makeDirtyPdfBytes()));
    expect(analysis.counts.metadata).toBeGreaterThanOrEqual(2);
    expect(analysis.counts.xmp).toBe(1);
    expect(analysis.counts.javascript).toBeGreaterThanOrEqual(1);
    expect(analysis.counts.attachments).toBe(1);
    expect(analysis.counts.annotations).toBe(1);
  });

  it("reports a clean PDF as having nothing hidden", async () => {
    const doc = await PDFDocument.create({ updateMetadata: false });
    doc.addPage([612, 792]);
    const analysis = await analyzePdfHiddenData(toFile(await doc.save()));
    expect(analysis.counts).toEqual({
      metadata: 0,
      xmp: 0,
      javascript: 0,
      attachments: 0,
      annotations: 0,
    });
  });
});

describe("scrubPdf", () => {
  it("physically removes catalog-level hidden data and keeps annotations by default", async () => {
    const scrubbed = await scrubPdf(toFile(await makeDirtyPdfBytes()));

    // Catalog no longer references any hidden data...
    const analysis = await analyzePdfHiddenData(toFile(scrubbed));
    expect(analysis.counts.metadata).toBe(0);
    expect(analysis.counts.xmp).toBe(0);
    expect(analysis.counts.javascript).toBe(0);
    expect(analysis.counts.attachments).toBe(0);
    expect(analysis.counts.annotations).toBe(1); // visible markup preserved
    expect(await listPdfAttachments(toFile(scrubbed))).toHaveLength(0);

    // ...and the objects are physically gone, not merely orphaned.
    const ghosts = ghostCounts(await PDFDocument.load(scrubbed));
    expect(ghosts.xmp).toBe(0);
    expect(ghosts.js).toBe(0);
    expect(ghosts.embeddedFile).toBe(0);
    expect(ghosts.square).toBe(1); // kept annotation is genuinely retained
  });

  it("removes annotations when asked, leaving no orphaned annotation object", async () => {
    const scrubbed = await scrubPdf(toFile(await makeDirtyPdfBytes()), true);
    const analysis = await analyzePdfHiddenData(toFile(scrubbed));
    expect(analysis.counts.annotations).toBe(0);
    expect(ghostCounts(await PDFDocument.load(scrubbed)).square).toBe(0);
  });

  it("preserves the page count", async () => {
    const scrubbed = await scrubPdf(toFile(await makeDirtyPdfBytes()));
    expect((await PDFDocument.load(scrubbed)).getPageCount()).toBe(2);
  });
});

/** A PDF whose pages carry distinct sizes so they're identifiable after assembly. */
async function makeSizedPdf(sizes: [number, number][]): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  for (const [w, h] of sizes) doc.addPage([w, h]);
  return doc.save();
}

const widths = async (bytes: Uint8Array) =>
  (await PDFDocument.load(bytes)).getPages().map((p) => Math.round(p.getSize().width));

describe("assemblePdf", () => {
  it("reorders, duplicates, and drops pages per the plan", async () => {
    const src = await makeSizedPdf([
      [100, 100],
      [200, 200],
      [300, 300],
    ]);
    // Output: page 3, page 1, page 1 again — page 2 omitted.
    const out = await assemblePdf(
      [src],
      [
        { kind: "page", sourceIndex: 0, pageIndex: 2 },
        { kind: "page", sourceIndex: 0, pageIndex: 0 },
        { kind: "page", sourceIndex: 0, pageIndex: 0 },
      ],
    );
    expect(await widths(out)).toEqual([300, 100, 100]);
  });

  it("inserts a blank page of the requested size", async () => {
    const src = await makeSizedPdf([[100, 100]]);
    const out = await assemblePdf(
      [src],
      [
        { kind: "page", sourceIndex: 0, pageIndex: 0 },
        { kind: "blank", width: 400, height: 500 },
      ],
    );
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
    const last = doc.getPages()[1].getSize();
    expect([Math.round(last.width), Math.round(last.height)]).toEqual([400, 500]);
  });

  it("adds rotation on top of the page's existing rotation", async () => {
    const doc = await PDFDocument.create({ updateMetadata: false });
    doc.addPage([100, 100]).setRotation(degrees(90));
    const src = await doc.save();
    const out = await assemblePdf(
      [src],
      [{ kind: "page", sourceIndex: 0, pageIndex: 0, rotation: 90 }],
    );
    expect((await PDFDocument.load(out)).getPages()[0].getRotation().angle).toBe(180);
  });

  it("splices pages from multiple source PDFs", async () => {
    const a = await makeSizedPdf([[111, 111]]);
    const b = await makeSizedPdf([[222, 222]]);
    const out = await assemblePdf(
      [a, b],
      [
        { kind: "page", sourceIndex: 1, pageIndex: 0 },
        { kind: "page", sourceIndex: 0, pageIndex: 0 },
      ],
    );
    expect(await widths(out)).toEqual([222, 111]);
  });

  it("rejects an empty plan", async () => {
    await expect(assemblePdf([], [])).rejects.toThrow();
  });
});

/** Like makeSizedPdf but each page carries a drawn rectangle, so the page has a
 *  content stream and can be embedded (nupPages embeds every source page). */
async function makeContentPdf(sizes: [number, number][]): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  for (const [w, h] of sizes) {
    doc
      .addPage([w, h])
      .drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(0.9, 0.9, 0.9) });
  }
  return doc.save();
}

describe("nupPages", () => {
  it("packs pages onto sheets the size of page 1, with the right sheet count", async () => {
    // 5 pages, 2x2 (4 per sheet) → ceil(5/4) = 2 sheets, each the size of page 1.
    const src = await makeContentPdf(
      Array.from({ length: 5 }, () => [612, 792] as [number, number]),
    );
    const out = await nupPages(toFile(src), "2x2");
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
    const { width, height } = doc.getPages()[0].getSize();
    expect([Math.round(width), Math.round(height)]).toEqual([612, 792]);
  });

  it("letterboxes when the cell aspect doesn't match the page aspect", async () => {
    // Portrait pages in a 2x1 grid: the cell is wider-than-tall while the page
    // is taller-than-wide, so nupPages must scale-to-fit + centre (letterbox)
    // rather than stretch. 3 pages, 2 per sheet → 2 sheets; output stays valid.
    const src = await makeContentPdf(
      Array.from({ length: 3 }, () => [400, 800] as [number, number]),
    );
    const out = await nupPages(toFile(src), "2x1");
    expect((await PDFDocument.load(out)).getPageCount()).toBe(2);
  });
});

/** True if any indirect object is a Helvetica font dict (i.e. text was drawn). */
function hasHelvetica(doc: PDFDocument): boolean {
  return doc.context.enumerateIndirectObjects().some(([, obj]) => {
    if (!(obj instanceof PDFDict)) return false;
    return obj.lookupMaybe(PDFName.of("BaseFont"), PDFName)?.decodeText() === "Helvetica";
  });
}

const blankPdf = async () => {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.addPage([300, 400]);
  return doc.save();
};

describe("annotatePdf", () => {
  it("draws a stroke without changing the page count, and adds content", async () => {
    const src = await blankPdf();
    const out = await annotatePdf(toFile(src), [
      {
        kind: "stroke",
        pageIndex: 0,
        points: [
          { x: 0.1, y: 0.1 },
          { x: 0.9, y: 0.9 },
        ],
        color: { r: 255, g: 0, b: 0 },
        thicknessFrac: 0.01,
        opacity: 1,
      },
    ]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(1);
    expect(out.length).toBeGreaterThan(src.length);
    // A stroke embeds no font.
    expect(hasHelvetica(doc)).toBe(false);
  });

  it("embeds a font only when a text annotation is present", async () => {
    const out = await annotatePdf(toFile(await blankPdf()), [
      {
        kind: "text",
        pageIndex: 0,
        x: 0.2,
        y: 0.2,
        text: "HELLO",
        sizeFrac: 0.05,
        color: { r: 0, g: 0, b: 0 },
      },
    ]);
    expect(hasHelvetica(await PDFDocument.load(out))).toBe(true);
  });

  it("ignores annotations targeting a non-existent page", async () => {
    const out = await annotatePdf(toFile(await blankPdf()), [
      {
        kind: "rect",
        pageIndex: 9,
        x: 0.1,
        y: 0.1,
        w: 0.2,
        h: 0.2,
        color: { r: 0, g: 0, b: 0 },
        thicknessFrac: 0.01,
      },
    ]);
    expect((await PDFDocument.load(out)).getPageCount()).toBe(1);
  });

  it("skips degenerate strokes with fewer than two points", async () => {
    const out = await annotatePdf(toFile(await blankPdf()), [
      {
        kind: "stroke",
        pageIndex: 0,
        points: [{ x: 0.5, y: 0.5 }],
        color: { r: 0, g: 0, b: 0 },
        thicknessFrac: 0.01,
        opacity: 1,
      },
    ]);
    expect((await PDFDocument.load(out)).getPageCount()).toBe(1);
  });

  it("draws shape annotations (ellipse, line, arrow) and adds content", async () => {
    const src = await blankPdf();
    const out = await annotatePdf(toFile(src), [
      {
        kind: "ellipse",
        pageIndex: 0,
        x: 0.1,
        y: 0.1,
        w: 0.3,
        h: 0.3,
        color: { r: 0, g: 0, b: 255 },
        thicknessFrac: 0.01,
      },
      {
        kind: "line",
        pageIndex: 0,
        x1: 0.1,
        y1: 0.1,
        x2: 0.8,
        y2: 0.8,
        color: { r: 255, g: 0, b: 0 },
        thicknessFrac: 0.01,
      },
      {
        kind: "arrow",
        pageIndex: 0,
        x1: 0.2,
        y1: 0.8,
        x2: 0.8,
        y2: 0.2,
        color: { r: 0, g: 128, b: 0 },
        thicknessFrac: 0.01,
      },
    ]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(1);
    expect(out.length).toBeGreaterThan(src.length);
    expect(hasHelvetica(doc)).toBe(false); // shapes embed no font
  });

  it("draws filled rect + ellipse shapes (fill is optional)", async () => {
    const src = await blankPdf();
    const out = await annotatePdf(toFile(src), [
      {
        kind: "rect",
        pageIndex: 0,
        x: 0.1,
        y: 0.1,
        w: 0.3,
        h: 0.2,
        color: { r: 0, g: 0, b: 0 },
        thicknessFrac: 0.01,
        fill: { color: { r: 255, g: 230, b: 0 }, opacity: 0.4 },
      },
      {
        kind: "ellipse",
        pageIndex: 0,
        x: 0.5,
        y: 0.5,
        w: 0.3,
        h: 0.3,
        color: { r: 0, g: 0, b: 255 },
        thicknessFrac: 0.01,
        fill: { color: { r: 0, g: 0, b: 255 } }, // opacity defaults to 1
      },
    ]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(1);
    expect(out.length).toBeGreaterThan(src.length);
  });
});

describe("stripMetadata", () => {
  it("clears Info-dict fields + the XMP stream and keeps page content", async () => {
    const src = await PDFDocument.create();
    src.addPage([612, 792]);
    src.setTitle("Secret Title");
    src.setAuthor("Jane Doe");
    src.setSubject("Confidential");
    src.setKeywords(["alpha", "beta"]);
    src.setCreator("CloakPDF Test");
    src.setProducer("CloakPDF Test");
    src.setCreationDate(new Date("2020-01-01T00:00:00Z"));
    src.setModificationDate(new Date("2021-01-01T00:00:00Z"));
    // Attach an XMP metadata object to the catalog so the strip has one to drop.
    const metaRef = src.context.register(src.context.obj({ Type: "Metadata", Subtype: "XML" }));
    src.catalog.set(PDFName.of("Metadata"), metaRef);
    const bytes = await src.save();

    // Sanity-check the fixture carries metadata before stripping.
    const before = await PDFDocument.load(bytes, { updateMetadata: false });
    expect(before.getTitle()).toBe("Secret Title");
    expect(before.getAuthor()).toBe("Jane Doe");
    expect(before.catalog.get(PDFName.of("Metadata"))).toBeDefined();

    const file = new File([bytes as BlobPart], "meta.pdf", { type: "application/pdf" });
    const stripped = await stripMetadata(file);

    const after = await PDFDocument.load(stripped, { updateMetadata: false });
    expect(after.getTitle()).toBeUndefined();
    expect(after.getAuthor()).toBeUndefined();
    expect(after.getSubject()).toBeUndefined();
    expect(after.getKeywords()).toBeUndefined();
    expect(after.getCreator()).toBeUndefined();
    expect(after.getProducer()).toBeUndefined();
    expect(after.getCreationDate()).toBeUndefined();
    expect(after.getModificationDate()).toBeUndefined();
    expect(after.catalog.get(PDFName.of("Metadata"))).toBeUndefined();
    // Page content is untouched.
    expect(after.getPageCount()).toBe(1);
  });
});

describe("addPdfBookmarks", () => {
  it("builds a flat outline (no level) and opens the bookmarks panel", async () => {
    const out = await addPdfBookmarks(await pagesFile(3), [
      { title: "One", pageIndex: 0 },
      { title: "Two", pageIndex: 2 },
    ]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(3); // no contents page inserted
    const outlines = lookupDict(doc, doc.catalog.get(PDFName.of("Outlines")));
    expect((outlines.lookup(PDFName.of("Count")) as PDFNumber).asNumber()).toBe(2);
    expect(doc.catalog.get(PDFName.of("PageMode"))?.toString()).toBe("/UseOutlines");
    // First/Last differ for two top-level siblings.
    expect(outlines.get(PDFName.of("First"))).not.toBe(outlines.get(PDFName.of("Last")));
  });

  it("nests an entry under its parent by level", async () => {
    const out = await addPdfBookmarks(await pagesFile(4), [
      { title: "Chapter", pageIndex: 0, level: 1 },
      { title: "Section", pageIndex: 1, level: 2 },
    ]);
    const doc = await PDFDocument.load(out);
    const outlines = lookupDict(doc, doc.catalog.get(PDFName.of("Outlines")));
    // Count is the total open subtree (chapter + section); one top-level node.
    expect((outlines.lookup(PDFName.of("Count")) as PDFNumber).asNumber()).toBe(2);
    const firstRef = outlines.get(PDFName.of("First"));
    expect(firstRef).toBe(outlines.get(PDFName.of("Last")));

    const chapter = lookupDict(doc, firstRef);
    expect((chapter.lookup(PDFName.of("Title")) as PDFString).decodeText()).toBe("Chapter");
    expect((chapter.lookup(PDFName.of("Count")) as PDFNumber).asNumber()).toBe(1);

    const childRef = chapter.get(PDFName.of("First"));
    const child = lookupDict(doc, childRef);
    expect((child.lookup(PDFName.of("Title")) as PDFString).decodeText()).toBe("Section");
    // The child points back up to its parent.
    expect(child.get(PDFName.of("Parent"))).toBe(firstRef);
  });

  it("inserts a clickable contents page, shifts targets, and adds a Contents bookmark", async () => {
    const out = await addPdfBookmarks(
      await pagesFile(3),
      [
        { title: "Intro", pageIndex: 0, level: 1 },
        { title: "Body", pageIndex: 1, level: 1 },
      ],
      { contentsPage: true },
    );
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(4); // one TOC page prepended

    // The TOC page carries one /Link annotation per entry.
    const annots = doc.getPage(0).node.lookup(PDFName.of("Annots"));
    expect(annots).toBeInstanceOf(PDFArray);
    expect((annots as PDFArray).size()).toBe(2);
    const link0 = lookupDict(doc, (annots as PDFArray).get(0));
    expect(link0.get(PDFName.of("Subtype"))?.toString()).toBe("/Link");

    // The outline now leads with a synthetic "Contents" bookmark (3 total).
    const outlines = lookupDict(doc, doc.catalog.get(PDFName.of("Outlines")));
    expect((outlines.lookup(PDFName.of("Count")) as PDFNumber).asNumber()).toBe(3);
    const first = lookupDict(doc, outlines.get(PDFName.of("First")));
    expect((first.lookup(PDFName.of("Title")) as PDFHexString).decodeText()).toBe("Contents");
  });

  it("round-trips a non-Latin outline title (UTF-16 via PDFHexString)", async () => {
    const out = await addPdfBookmarks(await pagesFile(2), [{ title: "第一章 概要", pageIndex: 0 }]);
    const doc = await PDFDocument.load(out);
    const outlines = lookupDict(doc, doc.catalog.get(PDFName.of("Outlines")));
    const first = lookupDict(doc, outlines.get(PDFName.of("First")));
    expect((first.lookup(PDFName.of("Title")) as PDFHexString).decodeText()).toBe("第一章 概要");
  });

  it("keeps a leading H2 at top level when a contents page is added", async () => {
    const out = await addPdfBookmarks(
      await pagesFile(3),
      [
        { title: "Sub", pageIndex: 0, level: 2 },
        { title: "Top", pageIndex: 1, level: 1 },
      ],
      { contentsPage: true },
    );
    const doc = await PDFDocument.load(out);
    const outlines = lookupDict(doc, doc.catalog.get(PDFName.of("Outlines")));
    // Roots are Contents, Sub, Top — the synthetic Contents must capture NO
    // children (a leading H2 stays a top-level sibling, not its child).
    const contents = lookupDict(doc, outlines.get(PDFName.of("First")));
    expect((contents.lookup(PDFName.of("Title")) as PDFHexString).decodeText()).toBe("Contents");
    expect(contents.get(PDFName.of("First"))).toBeUndefined();
    expect(contents.get(PDFName.of("Count"))).toBeUndefined();
    const sub = lookupDict(doc, contents.get(PDFName.of("Next")));
    expect((sub.lookup(PDFName.of("Title")) as PDFHexString).decodeText()).toBe("Sub");
    // Sub's parent is the outline root, not the Contents node.
    expect(sub.get(PDFName.of("Parent"))).toBe(doc.catalog.get(PDFName.of("Outlines")));
  });
});
