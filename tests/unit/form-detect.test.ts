/**
 * Unit tests for flat-form field detection (form-detect.ts) — the heuristics
 * that find fillable blanks (underline runs + "Label:" + space) on forms with no
 * AcroForm, and map common labels to profile keys.
 */
import { PDFDocument } from "@pdfme/pdf-lib";
import { describe, expect, it } from "vitest";
import type { LayoutItem, LayoutPage } from "../../src/utils/layout-extract.ts";
import {
  detectFlatFields,
  fillFlatFormFields,
  profileKeyForLabel,
} from "../../src/utils/pdf/form-detect.ts";

function item(text: string, x: number, y: number, width: number, height = 10): LayoutItem {
  return { text, x, y, width, height, fontSize: height };
}

/** A 600×800-point page from a flat list of items. */
function page(items: LayoutItem[]): LayoutPage {
  return { pageNumber: 1, width: 600, height: 800, text: "", items };
}

describe("profileKeyForLabel", () => {
  it("maps common labels to keys", () => {
    expect(profileKeyForLabel("Full Name")).toBe("name");
    expect(profileKeyForLabel("E-mail")).toBe("email");
    expect(profileKeyForLabel("Phone")).toBe("phone");
    expect(profileKeyForLabel("Date of Birth")).toBe("date");
    expect(profileKeyForLabel("Favourite colour")).toBeUndefined();
  });
});

describe("detectFlatFields", () => {
  it("detects a label followed by empty space", () => {
    // "Name:" at x=40..90, nothing after → blank to the right margin.
    const fields = detectFlatFields([page([item("Name:", 40, 100, 50)])]);
    expect(fields).toHaveLength(1);
    expect(fields[0].label).toBe("Name");
    expect(fields[0].profileKey).toBe("name");
    // Blank starts just past the label.
    expect(fields[0].rect.xPct).toBeGreaterThan(90 / 600 - 0.01);
  });

  it("detects an underline run with the preceding label", () => {
    const fields = detectFlatFields([
      page([item("Signature", 40, 200, 70), item("__________", 120, 200, 200)]),
    ]);
    expect(fields).toHaveLength(1);
    expect(fields[0].label).toBe("Signature");
    // The blank sits on the underscores (x≈120).
    expect(fields[0].rect.xPct).toBeCloseTo(120 / 600, 2);
  });

  it("does not treat a long sentence with a colon as a field", () => {
    const sentence = item(
      "Note: please complete every field below before you submit this application:",
      40,
      300,
      500,
    );
    expect(detectFlatFields([page([sentence])])).toHaveLength(0);
  });

  it("skips a label with no room after it", () => {
    // Label immediately followed by another run → no blank.
    const fields = detectFlatFields([
      page([item("Name:", 40, 100, 50), item("(required)", 92, 100, 60)]),
    ]);
    expect(fields).toHaveLength(0);
  });

  it("orders fields top-to-bottom and finds several", () => {
    const fields = detectFlatFields([
      page([
        item("Email:", 40, 100, 50),
        item("Phone:", 40, 140, 50),
        item("Address:", 40, 180, 70),
      ]),
    ]);
    expect(fields.map((f) => f.label)).toEqual(["Email", "Phone", "Address"]);
    expect(fields.map((f) => f.profileKey)).toEqual(["email", "phone", "address"]);
  });
});

describe("fillFlatFormFields", () => {
  async function blankPdf(): Promise<File> {
    const doc = await PDFDocument.create();
    doc.addPage([600, 800]).drawRectangle({ x: 0, y: 0, width: 1, height: 1 });
    const bytes = await doc.save();
    return new File([bytes], "form.pdf", { type: "application/pdf" });
  }

  it("draws values and grows the file, keeping the page count", async () => {
    const file = await blankPdf();
    const before = (await file.arrayBuffer()).byteLength;
    const out = await fillFlatFormFields(file, [
      { pageIndex: 0, rect: { xPct: 0.2, yPct: 0.1, wPct: 0.5, hPct: 0.02 }, text: "Jane Doe" },
    ]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(1);
    expect(out.byteLength).toBeGreaterThan(before);
  });

  it("skips empty values and out-of-range pages without throwing", async () => {
    const file = await blankPdf();
    const out = await fillFlatFormFields(file, [
      { pageIndex: 0, rect: { xPct: 0.2, yPct: 0.1, wPct: 0.5, hPct: 0.02 }, text: "   " },
      { pageIndex: 9, rect: { xPct: 0.2, yPct: 0.2, wPct: 0.5, hPct: 0.02 }, text: "off page" },
    ]);
    expect((await PDFDocument.load(out)).getPageCount()).toBe(1);
  });

  it("fits a long value into a narrow blank without throwing", async () => {
    // A long answer in a tiny blank exercises the shrink-then-truncate path.
    const file = await blankPdf();
    const out = await fillFlatFormFields(file, [
      {
        pageIndex: 0,
        rect: { xPct: 0.1, yPct: 0.1, wPct: 0.06, hPct: 0.015 },
        text: "An extremely long answer that cannot possibly fit the blank",
      },
    ]);
    expect((await PDFDocument.load(out)).getPageCount()).toBe(1);
    expect(out.byteLength).toBeGreaterThan(0);
  });
});
