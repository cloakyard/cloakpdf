/** Cross-tool regression. Verify the actual downloaded PDF and the working document independently. */
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
const directory = await mkdtemp(join(tmpdir(), "cloak-canvas-edits-"));
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
try {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < 3; i++)
    pdf.addPage([400, 620]).drawText("Alpha beta gamma", { x: 32, y: 550, size: 20 });
  const name = pdf.getForm().createTextField("Full name");
  name.enableRequired();
  name.addToPage(pdf.getPage(0), { x: 30, y: 440, width: 200, height: 28 });
  const path = join(directory, "canvas.pdf");
  await writeFile(path, await pdf.save());
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(process.env.E2E_URL ?? "http://127.0.0.1:5173");
  await (await page.waitForSelector("input[type=file]"))!.uploadFile(path);
  const tool = async (name: string) => {
    await page.waitForSelector('[data-testid="export-dialog"]', { hidden: true });
    await page.locator(`.editor-toolrail [aria-label="${name}"]`).click();
    await page.waitForFunction(
      (name) => document.querySelector(".editor-properties__title")?.textContent === name,
      {},
      name,
    );
  };
  const button = (name: string) => page.locator(`button::-p-text(${name})`).click();
  await tool("Fill form");
  await page.waitForSelector('input.pdf-canvas-field[aria-label="Full name on page 1"]');
  await button("Next empty required field");
  await page.type("input.pdf-canvas-field", "Marie L");
  assert.equal(
    await page.$eval("#form-field-0", (el) => (el as HTMLInputElement).value),
    "Marie L",
  );
  await page.locator(".pdf-fillform-panel .air-button--primary").click();
  await page.waitForFunction(() => document.body.innerText.includes("Form saved"));
  await tool("Select text");
  await page.waitForSelector(".pdf-selection-actions");
  const cdp = await page.createCDPSession();
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  const bounds = await (await page.$(".editor-paper img"))!.boundingBox();
  assert.ok(bounds);
  for (const x of [102, 156])
    await page.touchscreen.tap(
      bounds.x + (bounds.width * x) / 400,
      bounds.y + (bounds.height * 64) / 620,
    );
  assert.equal(
    await page.$eval("#selected-page-text", (el) => (el as HTMLTextAreaElement).value),
    "beta gamma",
  );
  await page.locator(".pdf-touch-selection button::-p-text(Box)").click();
  await page.waitForFunction(() => document.body.innerText.includes("Box added"));
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  console.log(
    "Verified two real touch taps select individual words and invoke a contextual action.",
  );
  const content = "CLOAK-42";
  await tool("QR / barcode");
  await page.locator("#code-content").fill(content);
  await button("Place on this page");
  await button("Test scan");
  await page.waitForFunction(() => /Decoded at 150 dpi.*CLOAK-42/.test(document.body.innerText));
  await page.locator('button[aria-label="Export"]:enabled').click();
  await page.waitForSelector('[aria-label="Unapplied edits"]');
  assert.equal(
    await page.$eval("[data-export-download]", (el) => (el as HTMLButtonElement).disabled),
    true,
  );
  await button("Review and apply codes");
  await page.waitForSelector(".pdf-code-panel");
  console.log("Verified on-page form editing, local QR decoding and export review.");
  await tool("Organize");
  await page.click('[aria-label="Select page 1 for extraction"]');
  await page.click('[aria-label="Rotate page 1"]');
  await page.evaluate(() => {
    const files: Promise<Blob>[] = [];
    Object.assign(window, { downloads: files });
    // Delegate non-downloads with the original anchor as the receiver.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const native = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download && this.href.startsWith("blob:")) {
        files.push(fetch(this.href).then((response) => response.blob()));
        return;
      }
      native.call(this);
    };
  });
  const readOutput = async (index: number) => {
    await page.waitForFunction((i) => (window as any).downloads.length > i, {}, index);
    return new Uint8Array(
      await page.evaluate(
        async (i) =>
          Array.from(new Uint8Array(await (await (window as any).downloads[i]).arrayBuffer())),
        index,
      ),
    );
  };
  // Read QR from the PDF renderer's raster, including the actual saved rotation.
  async function decodeOutput(index: number) {
    return page.evaluate(async (i) => {
      const load = (url: string) => import(url);
      const { renderPagesToBlobs } = await load("/src/utils/pdf-renderer.ts");
      const source = await (await fetch("/src/editor/panels/CodeStampTool.tsx")).text();
      const zxing = source.match(/import\(["']([^"']*zxing_library[^"']*)["']\)/)![1];
      const { QRCodeReader, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } = await load(zxing);
      const [image] = await renderPagesToBlobs(
        new File([await (window as any).downloads[i]], "output.pdf"),
        [0],
        150,
        "image/png",
      );
      const bmp = await createImageBitmap(image.blob);
      const canvas = new OffscreenCanvas(bmp.width, bmp.height);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const gray = new Uint8ClampedArray(canvas.width * canvas.height);
      for (let j = 0; j < gray.length; j++)
        gray[j] = (data[j * 4] + 2 * data[j * 4 + 1] + data[j * 4 + 2]) / 4;
      return new QRCodeReader()
        .decode(
          new BinaryBitmap(
            new HybridBinarizer(new RGBLuminanceSource(gray, canvas.width, canvas.height)),
          ),
        )
        .getText();
    }, index);
  }
  await button("Extract selected as PDF");
  const copy = await PDFDocument.load(await readOutput(0));
  assert.equal(copy.getPageCount(), 1);
  assert.equal(copy.getPage(0).getRotation().angle, 90);
  assert.equal(await decodeOutput(0), content);
  assert.equal(
    await page.$$eval('input[aria-label*="for extraction"]', (nodes) => nodes.length),
    3,
  );
  await button("Apply marks and rotate");
  await page.waitForFunction(() => !document.body.innerText.includes("Apply marks and rotate"));
  await page.locator('button[aria-label="Export"]:enabled').click();
  await page.locator("[data-export-download]").click();
  const output = await PDFDocument.load(await readOutput(1));
  assert.equal(output.getPageCount(), 3);
  assert.equal(output.getForm().getTextField("Full name").getText(), "Marie L");
  assert.equal(output.getPage(0).getRotation().angle, 90);
  assert.equal(await decodeOutput(1), content);
  console.log(
    "Decoded the original QR from a rotated extracted copy and the rotated three-page export.",
  );
  await page.waitForSelector("[role=dialog]", { hidden: true });
  await page.locator('button[aria-label="Undo"]:enabled').click();
  await page.locator('button[aria-label="Export"]:enabled').click();
  await page.waitForSelector('[aria-label="Unapplied edits"]');
  await button("Review and apply codes");
  await tool("Signature");
  await button("Type");
  await page.type("#signature-name", "ML");
  await page.waitForSelector('img[alt="Typed signature preview"]');
  await button("Place on this page");
  await page.locator('button[aria-label="Export"]:enabled').click();
  await button("Review and apply signatures");
  await tool("Redact");
  await page.waitForSelector('[aria-label="Pending redactions"]');
  const paper = await (await page.$(".editor-paper img"))!.boundingBox();
  assert.ok(paper);
  await page.mouse.move(paper.x + paper.width * 0.22, paper.y + paper.height * 0.22);
  await page.mouse.down();
  await page.mouse.move(paper.x + paper.width * 0.78, paper.y + paper.height * 0.78, { steps: 8 });
  await page.mouse.up();
  await page.waitForSelector('[data-testid="pending-marks"]');
  await tool("Signature");
  await page.locator(".pdf-signature-panel .air-button--primary").click();
  await page.waitForFunction(() => document.body.innerText.includes("0 signatures placed"));
  await page.locator('button[aria-label="Export"]:enabled').click();
  await page.locator("[data-export-download]").click();
  await readOutput(2);
  const privacy = await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { pdfjsLib, renderPagesToBlobs } = await load("/src/utils/pdf-renderer.ts");
    const blob = await (window as any).downloads[2];
    const task = pdfjsLib.getDocument({ data: await blob.arrayBuffer() });
    const pdf = await task.promise;
    try {
      const marked = await (await pdf.getPage(1)).getTextContent();
      const other = await (await pdf.getPage(2)).getTextContent();
      const [raster] = await renderPagesToBlobs(
        new File([blob], "redacted.pdf"),
        [0],
        72,
        "image/png",
      );
      const bitmap = await createImageBitmap(raster.blob),
        canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      return {
        ink: Array.from(
          ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data,
        ),
        marked: marked.items.length,
        other: other.items.length,
      };
    } finally {
      await task.destroy();
    }
  });
  assert.equal(privacy.marked, 0);
  assert.ok(privacy.other > 0);
  assert.deepEqual(privacy.ink, [30, 41, 59, 255]);
  await assert.rejects(decodeOutput(2));
  console.log(
    "Verified a redaction over the signature and QR remains opaque and removes text only on the marked page.",
  );
  assert.deepEqual(errors, []);
  console.log(
    "Verified undo restores the editable code and typed initials can be reviewed and applied.",
  );
} finally {
  await browser.close();
  await rm(directory, { recursive: true, force: true });
}
