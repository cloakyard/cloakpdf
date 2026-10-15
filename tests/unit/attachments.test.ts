import {
  PDFDocument,
  PDFDict,
  PDFArray,
  PDFName,
  PDFHexString,
  PDFString,
  PDFRawStream,
  decodePDFRawStream,
} from "@pdfme/pdf-lib";
import { describe, it, expect } from "vite-plus/test";
import {
  attachFilesToPdf,
  listPdfAttachments,
  removeAttachmentsFromPdf,
} from "../../src/utils/pdf/attachments.ts";
const n = PDFName.of;
const file = (bytes: Uint8Array) => new File([bytes as BlobPart], "source.pdf");
const enc = new TextEncoder();
async function fixture() {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  pdf.setAuthor("Preserved author");
  pdf.addJavaScript("unrelated", "void(0)");
  await pdf.attach(enc.encode("first secret"), "résumé-東京.txt", { mimeType: "text/plain" });
  await pdf.attach(enc.encode("second secret"), "résumé-東京.txt", { mimeType: "text/plain" });
  await pdf.flush();
  const names = pdf.catalog.lookup(n("Names"), PDFDict);
  const tree = names.lookup(n("EmbeddedFiles"), PDFDict);
  const pairs = tree.lookup(n("Names"), PDFArray);
  const first = pairs.lookup(1, PDFDict);
  const second = pairs.lookup(3, PDFDict);
  pairs.set(0, PDFString.of("internal-a"));
  pairs.set(2, PDFHexString.fromText("internal-b"));
  return { pdf, names, tree, pairs, first, second };
}
const contents = (pdf: PDFDocument) =>
  pdf.context
    .enumerateIndirectObjects()
    .flatMap(([, obj]) =>
      obj instanceof PDFRawStream && obj.dict.lookup(n("Type")) === n("EmbeddedFile")
        ? [new TextDecoder().decode(decodePDFRawStream(obj).decode())]
        : [],
    );

describe("attachments", () => {
  it("lists Unicode names with distinct identities and exact decoded bytes", async () => {
    const { pdf } = await fixture();
    const items = await listPdfAttachments(file(await pdf.save()));
    expect(items.map((i) => i.name)).toEqual(["résumé-東京.txt", "résumé-東京.txt"]);
    expect(new Set(items.map((i) => i.id)).size).toBe(2);
    expect(items.map((i) => new TextDecoder().decode(i.data))).toEqual([
      "first secret",
      "second secret",
    ]);
    expect(items.map((i) => i.size)).toEqual([12, 13]);
    expect(items[0].mimeType).toBe("text/plain");
  });
  it("removes only the chosen identity, its AF association, annotation and unshared bytes", async () => {
    const { pdf, pairs } = await fixture();
    const annotation = pdf.context.register(
      pdf.context.obj({
        Type: "Annot",
        Subtype: "FileAttachment",
        Rect: [0, 0, 20, 20],
        FS: pairs.get(1),
      }),
    );
    pdf.getPage(0).node.set(n("Annots"), pdf.context.obj([annotation]));
    const source = file(await pdf.save());
    const [chosen] = await listPdfAttachments(source);
    const result = await removeAttachmentsFromPdf(source, new Set([chosen.id]));
    const out = await PDFDocument.load(result, { updateMetadata: false });
    expect(contents(out)).toEqual(["second secret"]);
    expect(out.catalog.lookup(n("AF"), PDFArray).size()).toBe(1);
    expect(out.getPage(0).node.has(n("Annots"))).toBe(false);
    expect(out.getAuthor()).toBe("Preserved author");
    expect(out.catalog.lookup(n("Names"), PDFDict).has(n("JavaScript"))).toBe(true);
    expect(await listPdfAttachments(source)).toHaveLength(2);
    expect(await listPdfAttachments(file(result))).toHaveLength(1);
  });
  it("reads nested Kids and preserves siblings while removing obsolete tree objects", async () => {
    const { pdf, tree, pairs } = await fixture();
    const kids = [0, 2].map((i) =>
      pdf.context.register(pdf.context.obj({ Names: [pairs.get(i), pairs.get(i + 1)] })),
    );
    tree.delete(n("Names"));
    tree.set(n("Kids"), pdf.context.obj(kids));
    const source = file(await pdf.save());
    const items = await listPdfAttachments(source);
    const out = await PDFDocument.load(
      await removeAttachmentsFromPdf(source, new Set([items[1].id])),
    );
    expect(contents(out)).toEqual(["first secret"]);
    for (const ref of kids) expect(out.context.lookup(ref)).toBeUndefined();
  });
  it("keeps streams and filespec aliases still used by surviving entries", async () => {
    const { pdf, pairs, first, second } = await fixture();
    second.set(n("EF"), first.lookup(n("EF"), PDFDict));
    pairs.push(PDFString.of("alias"));
    pairs.push(pairs.get(1));
    const source = file(await pdf.save());
    const items = await listPdfAttachments(source);
    const result = file(await removeAttachmentsFromPdf(source, new Set([items[0].id])));
    expect((await listPdfAttachments(result)).map((i) => new TextDecoder().decode(i.data))).toEqual(
      ["first secret", "first secret"],
    );
    const next = await listPdfAttachments(result);
    const final = await removeAttachmentsFromPdf(result, new Set([next[1].id]));
    expect((await listPdfAttachments(file(final)))[0].data).toEqual(enc.encode("first secret"));
  });
  it("adds same-name files to nested trees using unique sorted keys without renaming display names", async () => {
    const { pdf, tree, pairs } = await fixture();
    tree.delete(n("Names"));
    tree.set(n("Kids"), pdf.context.obj([pdf.context.register(pdf.context.obj({ Names: pairs }))]));
    const result = await attachFilesToPdf(file(await pdf.save()), [
      new File(["third"], "résumé-東京.txt"),
      new File(["fourth"], "résumé-東京.txt"),
    ]);
    const items = await listPdfAttachments(file(result));
    expect(items).toHaveLength(4);
    expect(items.every((i) => i.name === "résumé-東京.txt")).toBe(true);
    const out = await PDFDocument.load(result);
    const array = out.catalog
      .lookup(n("Names"), PDFDict)
      .lookup(n("EmbeddedFiles"), PDFDict)
      .lookup(n("Names"), PDFArray);
    const keys = [0, 2, 4, 6].map((i) => (array.lookup(i) as PDFString).decodeText());
    expect(new Set(keys).size).toBe(4);
    expect(out.getPageCount()).toBe(1);
  });
  it("supports /UF-only embedded streams and trusts decoded length over stale Size", async () => {
    const { pdf, first } = await fixture();
    const ef = first.lookup(n("EF"), PDFDict);
    ef.set(n("UF"), ef.get(n("F"))!);
    ef.delete(n("F"));
    (ef.lookup(n("UF")) as PDFRawStream).dict.set(n("Params"), pdf.context.obj({ Size: 999 }));
    expect((await listPdfAttachments(file(await pdf.save())))[0].size).toBe(12);
  });
  it("deletes the final entry and all unshared attachment streams", async () => {
    const { pdf } = await fixture();
    const source = file(await pdf.save());
    const items = await listPdfAttachments(source);
    const result = await removeAttachmentsFromPdf(source, new Set(items.map((i) => i.id)));
    expect(await listPdfAttachments(file(result))).toEqual([]);
    const out = await PDFDocument.load(result);
    expect(contents(out)).toEqual([]);
    expect(out.catalog.has(n("AF"))).toBe(false);
  });
  it("rejects malformed and cyclic trees instead of pretending they are empty", async () => {
    const { pdf, tree } = await fixture();
    tree.set(n("Names"), pdf.context.obj([PDFString.of("orphan")]));
    await expect(listPdfAttachments(file(await pdf.save()))).rejects.toThrow("unreadable");
    tree.delete(n("Names"));
    const ref = pdf.context.register(tree);
    tree.set(n("Kids"), pdf.context.obj([ref]));
    const source = file(await pdf.save());
    await expect(listPdfAttachments(source)).rejects.toThrow("unreadable");
    await expect(attachFilesToPdf(source, [new File(["x"], "x.txt")])).rejects.toThrow(
      "unreadable",
    );
  });
  it("rejects nonstandard surviving references rather than reporting a false removal", async () => {
    const { pdf, pairs } = await fixture();
    pdf.catalog.set(n("CustomAttachment"), pairs.get(1));
    const source = file(await pdf.save());
    const [chosen] = await listPdfAttachments(source);
    await expect(removeAttachmentsFromPdf(source, new Set([chosen.id]))).rejects.toThrow(
      "cannot be removed safely",
    );
    expect(await listPdfAttachments(source)).toHaveLength(2);
  });
  it("rejects stale identities and failed file reads without changing source bytes", async () => {
    const { pdf } = await fixture();
    const source = file(await pdf.save());
    const before = await source.arrayBuffer();
    await expect(removeAttachmentsFromPdf(source, new Set(["missing"]))).rejects.toThrow("changed");
    const broken = new File(["x"], "x.txt");
    broken.arrayBuffer = () => Promise.reject(new Error("unavailable"));
    await expect(attachFilesToPdf(source, [broken])).rejects.toThrow("unavailable");
    expect(await source.arrayBuffer()).toEqual(before);
  });
});
