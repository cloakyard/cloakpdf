import { PDFDocument, PDFName, PDFNumber, degrees } from "@pdfme/pdf-lib";

export async function formFixture() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 800]);
  const second = pdf.addPage([600, 800]);
  second.setRotation(degrees(90));
  second.setCropBox(20, 30, 540, 700);
  second.node.set(PDFName.of("UserUnit"), PDFNumber.of(1.5));
  const form = pdf.getForm();
  page.drawText("Application", { x: 36, y: 750, size: 24 });
  const name = form.createTextField("Full name");
  name.enableRequired();
  name.setMaxLength(28);
  name.setText("Avery Chen");
  name.addToPage(page, { x: 36, y: 660, width: 260, height: 28 });
  const notes = form.createTextField("Notes");
  notes.enableMultiline();
  notes.setText("First line\nSecond line");
  notes.addToPage(page, { x: 36, y: 545, width: 360, height: 70 });
  const check = form.createCheckBox("Subscribe");
  check.addToPage(page, { x: 36, y: 485, width: 20, height: 20 });
  check.check();
  const region = form.createDropdown("Region");
  region.addOptions([
    "North",
    "South",
    "A deliberately long regional option that should wrap in the picker",
  ]);
  region.select("North");
  region.addToPage(page, { x: 36, y: 420, width: 260, height: 28 });
  const delivery = form.createRadioGroup("Delivery");
  delivery.addOptionToPage("Email", page, { x: 36, y: 355, width: 20, height: 20 });
  delivery.addOptionToPage("Post", page, { x: 90, y: 355, width: 20, height: 20 });
  delivery.select("Email");
  const interests = form.createOptionList("Interests");
  interests.addOptions(["Design", "Engineering", "Research"]);
  interests.enableMultiselect();
  interests.select(["Design", "Research"]);
  interests.addToPage(page, { x: 36, y: 220, width: 260, height: 75 });
  const custom = form.createDropdown("Occupation");
  custom.addOptions(["Designer", "Engineer"]);
  custom.enableEditing();
  custom.select("Writer");
  custom.addToPage(page, { x: 36, y: 155, width: 260, height: 28 });
  const record = form.createTextField("Record ID");
  record.setText("AIR-2048");
  record.enableReadOnly();
  record.addToPage(page, { x: 36, y: 80, width: 180, height: 28 });
  const other = form.createTextField("Contact.名字");
  other.setText("Sam");
  other.addToPage(second, { x: 100, y: 200, width: 220, height: 28 });
  pdf.setTitle("Interactive form acceptance");
  await pdf.attach(new TextEncoder().encode("REFERENCE"), "reference.txt");
  return pdf.save();
}
