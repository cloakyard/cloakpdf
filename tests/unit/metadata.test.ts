/**
 * Coverage for metadata read/write — in particular the fix where an EMPTY
 * keywords field must CLEAR the entry rather than write a single blank keyword
 * (`[""]`), mirroring how the date fields clear.
 */
import { PDFDocument } from "@pdfme/pdf-lib";
import { describe, expect, it } from "vitest";
import { getPdfMetadata, setPdfMetadata } from "../../src/utils/pdf-operations.ts";

const toFile = (bytes: Uint8Array) =>
  new File([bytes as BlobPart], "f.pdf", { type: "application/pdf" });
const blankPdf = async () => {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.addPage([300, 400]);
  return doc.save();
};
const base = {
  title: "",
  author: "",
  subject: "",
  keywords: "",
  creator: "",
  producer: "",
  creationDate: "",
  modificationDate: "",
};

describe("setPdfMetadata / getPdfMetadata", () => {
  it("round-trips standard fields", async () => {
    const out = await setPdfMetadata(toFile(await blankPdf()), {
      ...base,
      title: "Hello",
      author: "Ada",
      keywords: "a, b, c",
    });
    const read = await getPdfMetadata(toFile(out));
    expect(read.title).toBe("Hello");
    expect(read.author).toBe("Ada");
    expect(read.keywords).toBe("a, b, c");
  });

  it("clears Keywords when empty (no blank [''] entry)", async () => {
    // First write keywords, then clear them.
    const withKw = await setPdfMetadata(toFile(await blankPdf()), { ...base, keywords: "x, y" });
    const cleared = await setPdfMetadata(toFile(withKw), { ...base, keywords: "" });
    const read = await getPdfMetadata(toFile(cleared));
    expect(read.keywords).toBe("");
    // The raw Keywords entry must be gone, not present-but-empty.
    const doc = await PDFDocument.load(cleared);
    expect(doc.getKeywords() ?? "").toBe("");
  });
});
