/**
 * Unit tests for the QR / barcode stamp writer (codes.ts).
 *
 * The QR matrix comes from the third-party `qrcode-generator` (exercised in the
 * browser smoke); here we pin the pure Code 128-B encoder (start/checksum/stop
 * framing + character range) and assert addCodeStamp produces a loadable PDF
 * that grew (vector content was drawn) without changing the page count.
 */
import { PDFDocument } from "@pdfme/pdf-lib";
import { describe, expect, it } from "vitest";
import { addCodeStamp, type CodeStampOptions, encodeCode128B } from "../../src/utils/pdf/codes.ts";

async function makePdf(n: number): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < n; i++) doc.addPage([612, 792]);
  const bytes = await doc.save();
  return new File([bytes], "test.pdf", { type: "application/pdf" });
}

const BASE: Omit<CodeStampOptions, "type" | "content"> = {
  position: "bottom-right",
  size: 96,
  margin: 24,
  color: { r: 0, g: 0, b: 0 },
  caption: true,
};

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

describe("addCodeStamp", () => {
  it("draws a QR code on every page without changing the page count", async () => {
    const file = await makePdf(3);
    const before = (await file.arrayBuffer()).byteLength;
    const out = await addCodeStamp(file, { ...BASE, type: "qr", content: "https://cloakpdf.app" });
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(3);
    expect(out.byteLength).toBeGreaterThan(before);
  });

  it("stamps only the requested pages", async () => {
    const file = await makePdf(4);
    const out = await addCodeStamp(file, { ...BASE, type: "barcode", content: "ABC-0001" }, [0]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(4);
  });

  it("throws on empty content", async () => {
    const file = await makePdf(1);
    await expect(addCodeStamp(file, { ...BASE, type: "qr", content: "   " })).rejects.toThrow(
      /Nothing to encode/,
    );
  });
});
