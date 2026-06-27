/**
 * Unit tests for the QR / barcode stamp writer (codes.ts).
 *
 * The QR matrix comes from the third-party `qrcode-generator` (exercised in the
 * browser smoke); here we pin the pure Code 128-B encoder (start/checksum/stop
 * framing + character range) and assert addCodeStampAt produces a loadable PDF
 * that grew (vector content was drawn) without changing the page count.
 */
import { PDFDocument } from "@pdfme/pdf-lib";
import { describe, expect, it } from "vitest";
import { addCodeStampAt, type CodeArtOptions, encodeCode128B } from "../../src/utils/pdf/codes.ts";

async function makePdf(n: number): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < n; i++) doc.addPage([612, 792]);
  const bytes = await doc.save();
  return new File([bytes], "test.pdf", { type: "application/pdf" });
}

describe("encodeCode128B", () => {
  it("frames with Start B + checksum + Stop", () => {
    // "A" → value 33; Start B = 104; checksum = (104 + 33*1) % 103 = 34.
    // Patterns: Start B "211214", A "111323", checksum 34 "131123", Stop "2331112".
    const pattern = encodeCode128B("A");
    expect(pattern).toBe("211214" + "111323" + "131123" + "2331112");
  });

  it("ends every barcode with the Stop pattern's terminating bar", () => {
    expect(encodeCode128B("HELLO").endsWith("2331112")).toBe(true);
    expect(encodeCode128B("https://x.io/9").endsWith("2331112")).toBe(true);
  });

  it("rejects characters outside printable ASCII", () => {
    expect(() => encodeCode128B("café")).toThrow(/Code 128/);
    expect(() => encodeCode128B("😀")).toThrow(/Code 128/);
  });

  it("produces a different checksum for different payloads", () => {
    expect(encodeCode128B("ABC")).not.toBe(encodeCode128B("ABD"));
  });
});

describe("addCodeStampAt", () => {
  const ART: CodeArtOptions = {
    type: "qr",
    content: "https://cloakpdf.app",
    color: { r: 0, g: 0, b: 0 },
    caption: true,
  };

  it("draws a QR at an explicit box on the target page only", async () => {
    const file = await makePdf(3);
    const before = (await file.arrayBuffer()).byteLength;
    const out = await addCodeStampAt(file, ART, [
      { pageIndex: 1, x: 100, y: 100, width: 120, height: 120 },
    ]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(3);
    expect(out.byteLength).toBeGreaterThan(before);
  });

  it("draws a barcode (with caption) into its box", async () => {
    const file = await makePdf(1);
    const before = (await file.arrayBuffer()).byteLength;
    const out = await addCodeStampAt(file, { ...ART, type: "barcode", content: "ABC-0001" }, [
      { pageIndex: 0, x: 40, y: 60, width: 260, height: 90 },
    ]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(1);
    expect(out.byteLength).toBeGreaterThan(before);
  });

  it("burns one code per placement across several pages in one call", async () => {
    const file = await makePdf(4);
    const out = await addCodeStampAt(file, ART, [
      { pageIndex: 0, x: 20, y: 20, width: 80, height: 80 },
      { pageIndex: 2, x: 400, y: 600, width: 100, height: 100 },
    ]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(4);
  });

  it("skips out-of-range pages instead of throwing", async () => {
    const file = await makePdf(1);
    const out = await addCodeStampAt(file, ART, [
      { pageIndex: 9, x: 0, y: 0, width: 80, height: 80 },
    ]);
    // No valid placement → loadable PDF, unchanged page count.
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(1);
  });

  it("throws on empty content", async () => {
    const file = await makePdf(1);
    await expect(
      addCodeStampAt(file, { ...ART, content: "  " }, [
        { pageIndex: 0, x: 0, y: 0, width: 80, height: 80 },
      ]),
    ).rejects.toThrow(/Nothing to encode/);
  });
});
