import { describe, it, expect } from "vite-plus/test";
import { PDFDocument, PDFDict, PDFName, PDFNumber } from "@pdfme/pdf-lib";
import { readFormFields, fillPdfForm } from "../../src/utils/pdf/forms.ts";
import { formFixture } from "../helpers/form-fixture.ts";
const file = (bytes: Uint8Array) => new File([bytes.slice()], "form.pdf");
describe("native forms", () => {
  it("reads all field values, flags and pages without discarding multi-select/custom answers", async () => {
    const fields = await readFormFields(file(await formFixture()));
    expect(fields).toHaveLength(9);
    expect(fields[0]).toMatchObject({
      name: "Full name",
      maxLength: 28,
      required: true,
      value: "Avery Chen",
      pages: [0],
    });
    expect(fields.find((f) => f.name === "Interests")).toMatchObject({
      multiple: true,
      value: ["Design", "Research"],
    });
    expect(fields.find((f) => f.name === "Occupation")).toMatchObject({
      editable: true,
      value: "Writer",
    });
    expect(fields.find((f) => f.name === "Record ID")?.readOnly).toBe(true);
    expect(fields.at(-1)).toMatchObject({ name: "Contact.名字", pages: [1] });
  });
  it("writes all supported types, clears choices and preserves flags, geometry and catalog", async () => {
    const bytes = await formFixture();
    const original = await PDFDocument.load(bytes);
    const output = await fillPdfForm(file(bytes), {
      "Full name": "Sam",
      Notes: "Line one\nLine two",
      Subscribe: false,
      Region: "",
      Delivery: "",
      Interests: ["Engineering"],
      Occupation: "Researcher",
    });
    const pdf = await PDFDocument.load(output);
    const form = pdf.getForm();
    expect(form.getTextField("Full name").getText()).toBe("Sam");
    expect(form.getTextField("Full name").isRequired()).toBe(true);
    expect(form.getTextField("Notes").getText()).toBe("Line one\nLine two");
    expect(form.getCheckBox("Subscribe").isChecked()).toBe(false);
    expect(form.getDropdown("Region").getSelected()).toEqual([]);
    expect(form.getRadioGroup("Delivery").getSelected()).toBeUndefined();
    expect(form.getOptionList("Interests").getSelected()).toEqual(["Engineering"]);
    expect(form.getDropdown("Occupation").getSelected()).toEqual(["Researcher"]);
    expect(form.getTextField("Record ID").getText()).toBe("AIR-2048");
    expect(form.getTextField("Contact.名字").acroField.getWidgets()[0].getRectangle()).toEqual(
      original.getForm().getTextField("Contact.名字").acroField.getWidgets()[0].getRectangle(),
    );
    expect(pdf.getPage(1).getCropBox()).toEqual(original.getPage(1).getCropBox());
    expect(pdf.getPage(1).getRotation().angle).toBe(90);
    expect(pdf.getPage(1).node.lookup(PDFName.of("UserUnit"), PDFNumber).asNumber()).toBe(1.5);
    expect(pdf.getTitle()).toBe("Interactive form acceptance");
    expect(pdf.catalog.has(PDFName.of("Names"))).toBe(true);
  });
  it.each([
    ["Full name", "x".repeat(29), "28 characters"],
    ["Full name", "漢字", "cannot print"],
    ["Record ID", "changed", "read-only"],
    ["Region", "Elsewhere", "available option"],
    ["Delivery", "Other", "available option"],
    ["missing", "value", "no form field"],
  ])("reports an atomic named failure for %s", async (name, value, message) => {
    await expect(fillPdfForm(file(await formFixture()), { [name]: value })).rejects.toMatchObject({
      fieldName: name,
      message: expect.stringContaining(message),
    });
  });
  it("supports clearing a multi-select without changing other values", async () => {
    const pdf = await PDFDocument.load(
      await fillPdfForm(file(await formFixture()), { Interests: [] }),
    );
    expect(pdf.getForm().getOptionList("Interests").getSelected()).toEqual([]);
    expect(pdf.getForm().getTextField("Full name").getText()).toBe("Avery Chen");
  });
  it("flattens supported appearances while keeping the page geometry and attachment", async () => {
    const pdf = await PDFDocument.load(
      await fillPdfForm(file(await formFixture()), { "Full name": "Printed answer" }, true),
    );
    expect(pdf.getForm().getFields()).toHaveLength(0);
    expect(pdf.getPage(1).getRotation().angle).toBe(90);
    expect(pdf.catalog.has(PDFName.of("Names"))).toBe(true);
  });
  it("refuses XFA without silently removing its data", async () => {
    const pdf = await PDFDocument.load(await formFixture());
    pdf.catalog
      .lookup(PDFName.of("AcroForm"), PDFDict)
      .set(PDFName.of("XFA"), pdf.context.stream("<xfa/>"));
    const source = file(await pdf.save({ updateFieldAppearances: false }));
    await expect(readFormFields(source)).rejects.toThrow("uses XFA");
    await expect(fillPdfForm(source, { "Full name": "Edited" })).rejects.toThrow("uses XFA");
  });
  it("exposes unsupported fields and prevents destructive partial flattening", async () => {
    const pdf = await PDFDocument.load(await formFixture());
    pdf.getForm().createButton("Submit");
    const source = file(await pdf.save());
    expect((await readFormFields(source)).find((f) => f.name === "Submit")?.type).toBe(
      "unsupported",
    );
    await expect(fillPdfForm(source, {}, true)).rejects.toThrow("cannot be flattened");
    const saved = await PDFDocument.load(await fillPdfForm(source, { "Full name": "Partial" }));
    expect(saved.getForm().getButton("Submit")).toBeDefined();
  });
});
