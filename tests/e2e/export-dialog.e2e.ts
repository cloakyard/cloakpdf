/** Real Export outputs, native choices, recovery, and the full Air dialog matrix. */
import { createEvidenceDirectory } from "./helpers/evidence-directory.ts";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, writeFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  PDFDocument,
  PDFName,
  PDFRawStream,
  decodePDFRawStream,
  rgb,
  StandardFonts,
} from "@pdfme/pdf-lib";
import { launch, type HTTPRequest } from "puppeteer-core";
import sharp from "sharp";
import { auditAirDialog } from "./helpers/air-dialog-audit.ts";

const root = await mkdtemp(join(tmpdir(), "air-export-"));
const downloads = join(root, "downloads");
const evidence = createEvidenceDirectory("cloakpdf-air-export");
await mkdir(downloads);
await mkdir(evidence, { recursive: true });
// Synthetic, non-personal fixture: searchable text, colour, form data and metadata.
const fixture = await PDFDocument.create();
fixture.setTitle("Air export study");
fixture.setAuthor("Cloakyard test fixture");
const font = await fixture.embedFont(StandardFonts.Helvetica);
for (let index = 0; index < 2; index++) {
  const page = fixture.addPage([360, 480]);
  page.drawText(`Air export study ${index + 1}`, { x: 24, y: 370, size: 24, font });
  page.drawText(`Page ${index + 1}: local documents, carefully made.`, {
    x: 24,
    y: 330,
    size: 12,
    font,
  });
  page.drawRectangle({ x: 24, y: 250, width: 100, height: 70, color: rgb(0.9, 0.1, 0.2) });
}
const field = fixture.getForm().createTextField("note");
field.setText("Keep this form value");
field.addToPage(fixture.getPage(0), { x: 24, y: 180, width: 220, height: 32 });
const original = Buffer.from(await fixture.save());
const fixturePath = join(evidence, "Air export study.pdf");
await writeFile(fixturePath, original);
const single = await PDFDocument.create();
single.addPage((await single.copyPages(fixture, [1]))[0]);
const singlePath = join(root, "One page.pdf");
await writeFile(singlePath, await single.save());

const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();
await page.setBypassServiceWorker(true);
page.setDefaultTimeout(30_000);
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(String(error)));
const cdp = await page.createCDPSession();
await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads });
const modal = '[data-testid="export-dialog"]';
const select = async (value: string) =>
  page.click(`${modal} input[name="export-format"][value="${value}"]`);
const open = async () => {
  await page.click('button[aria-label="Export"]');
  await page.waitForSelector(modal);
};
const upload = async (path: string) => {
  await page.goto(process.env.E2E_URL ?? "http://localhost:5173", { waitUntil: "networkidle2" });
  await page.waitForSelector('input[type="file"]');
  await (await page.$('input[type="file"]'))!.uploadFile(path);
  await page.waitForSelector('img[alt="Page 1"]');
};
async function downloadSnapshot() {
  return Object.fromEntries(
    await Promise.all(
      (await readdir(downloads))
        .filter((name) => !name.endsWith(".crdownload"))
        .map(async (name) => [name, (await stat(join(downloads, name))).mtimeMs]),
    ),
  );
}
async function waitDownload(before: Record<string, number>) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const current = await downloadSnapshot();
    const name = Object.keys(current).find(
      (candidate) => current[candidate] !== before[candidate] && !candidate.endsWith(".crdownload"),
    );
    if (name) {
      await page.waitForSelector(modal, { hidden: true });
      assert.equal(
        await page.$eval('button[aria-label="Export"]', (node) => node === document.activeElement),
        true,
      );
      return join(downloads, name);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Export produced no completed download");
}
async function download() {
  const before = await downloadSnapshot();
  await page.click("[data-export-download]");
  return waitDownload(before);
}
const unzip = (path: string) =>
  execFileSync("unzip", ["-Z1", path], { encoding: "utf8" }).trim().split("\n");
const entry = (path: string, name: string) =>
  execFileSync("unzip", ["-p", path, name], { maxBuffer: 64 * 1024 * 1024 });
const pdf = async (path: string) =>
  PDFDocument.load(await readFile(path), { updateMetadata: false });

try {
  await upload(fixturePath);
  await open();
  assert.equal(
    await page.evaluate(() => (document.activeElement as HTMLInputElement).value),
    "pdf",
  );
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page.$eval('input[name="export-format"]:checked', (node) => node.value),
    "images",
  );
  await page.keyboard.press("Home");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Compress",
  );
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => (document.activeElement as HTMLInputElement).value),
    "medium",
  );
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page.$eval('input[name="export-quality"]:checked', (node) => node.value),
    "high",
  );
  await auditAirDialog(page, "export-pdf-options", evidence);
  await page.click('input[aria-label="Compress"]');
  const plain = await download();
  assert.ok(original.equals(await readFile(plain)), "Plain PDF export changed the source bytes");
  console.log(
    "✓ Native format/quality groups have one Tab stop, arrow keys and persistent choices; plain PDF bytes are exact",
  );

  // Hold the actual lazy ZIP module so busy behavior is exercised deterministically.
  let held: HTTPRequest | undefined;
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (/(?:\/zip-[^/]+\.js|\/src\/utils\/zip\.ts)(?:\?|$)/.test(request.url()) && !held)
      held = request;
    else void request.continue();
  });
  await open();
  await select("split");
  const before = await downloadSnapshot();
  await page.click("[data-export-download]");
  const deadline = Date.now() + 30_000;
  while (!held && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 50));
  assert.ok(held, "ZIP writer module request was not held");
  await page.keyboard.press("Escape");
  assert.ok(await page.$(modal), "Escape dismissed an active export");
  assert.equal(
    await page.$eval('input[name="export-format"]', (node) => node.matches(":disabled")),
    true,
  );
  assert.equal(
    await page.$eval("[data-export-download]", (node) => node.getAttribute("aria-busy")),
    "true",
  );
  // Programmatic duplicate activation also must be guarded.
  await page.$eval("[data-export-download]", (node) => (node as HTMLButtonElement).click());
  await auditAirDialog(page, "export-preparing", evidence);
  await held.continue();
  const split = await waitDownload(before);
  const splitNames = unzip(split);
  assert.deepEqual(splitNames, ["Air export study_p001.pdf", "Air export study_p002.pdf"]);
  for (const name of splitNames)
    assert.equal((await PDFDocument.load(entry(split, name))).getPageCount(), 1);
  assert.equal(
    (await readdir(downloads)).length,
    Object.keys(before).length + 1,
    "Duplicate activation downloaded twice",
  );
  console.log(
    "✓ Busy state retains focus and blocks editing/dismissal/duplicate work; split ZIP contains two valid single-page PDFs",
  );

  await open();
  await select("images");
  await auditAirDialog(page, "export-images", evidence);
  const images = await download();
  const imageNames = unzip(images);
  assert.equal(imageNames.length, 2);
  for (const name of imageNames) {
    const metadata = await sharp(entry(images, name)).metadata();
    assert.equal(metadata.format, "png");
    assert.equal(metadata.width, 750);
    assert.equal(metadata.height, 1000);
  }
  await open();
  await select("contact");
  assert.equal((await pdf(await download())).getPageCount(), 1);
  for (const format of ["text", "markdown"]) {
    await open();
    await select(format);
    const content = await readFile(await download(), "utf8");
    assert.ok(content.includes("Air export study 1") && content.includes("Air export study 2"));
    assert.ok(
      content.indexOf("study 1") < content.indexOf("study 2"),
      "Export changed reading order",
    );
  }
  console.log(
    "✓ Images preserve 150 DPI dimensions; contact sheet, text and Markdown contain both pages in order",
  );

  // Fail a real download dispatch once; verify URL/anchor cleanup and in-place retry.
  await open();
  await select("pdf");
  await page.click('input[aria-label="Strip metadata"]');
  await page.evaluate(() => {
    // Restored on the prototype before throwing; never invoked without its receiver.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      HTMLAnchorElement.prototype.click = originalClick;
      throw new Error("Download blocked for this test. Allow downloads, then retry.");
    };
  });
  await page.click("[data-export-download]");
  await page.waitForFunction(
    () =>
      document.querySelector("[data-export-download]")?.textContent?.includes("Retry download") &&
      document.querySelector(".pdf-export-feedback")?.textContent?.includes("Download blocked"),
  );
  assert.equal(
    await page.$eval('input[aria-label="Strip metadata"]', (node) => node.checked),
    true,
  );
  assert.equal(
    await page.$$eval("a[download]", (nodes) => nodes.length),
    0,
    "Failed download leaked an anchor",
  );
  assert.equal(
    await page.$eval("[data-export-download]", (node) => node === document.activeElement),
    true,
  );
  await auditAirDialog(page, "export-error", evidence);
  const stripped = await pdf(await download());
  assert.equal(stripped.getTitle(), undefined);
  assert.equal(stripped.getAuthor(), undefined);
  console.log(
    "✓ Failure keeps options and focus, cleans up its download anchor, and retries successfully with metadata removed",
  );

  // Every modifier, all quality settings, then the combined pipeline.
  for (const option of ["Flatten", "Grayscale", "Repair", "Compress"]) {
    for (const quality of option === "Compress" ? ["low", "medium", "high"] : [null]) {
      await open();
      for (const input of await page.$$('input[role="switch"]:checked')) await input.click();
      await page.click(`input[aria-label="${option}"]`);
      if (quality) await page.click(`input[name="export-quality"][value="${quality}"]`);
      console.log(`→ Export option ${option}${quality ? ` / ${quality}` : ""}`);
      const result = await pdf(await download());
      assert.equal(result.getPageCount(), 2);
      if (option === "Flatten") assert.equal(result.getForm().getFields().length, 0);
      if (option === "Grayscale") {
        const images = result.context
          .enumerateIndirectObjects()
          .map(([, object]) => object)
          .filter(
            (object): object is PDFRawStream =>
              object instanceof PDFRawStream &&
              object.dict.get(PDFName.of("ColorSpace")) === PDFName.of("DeviceRGB"),
          );
        assert.equal(images.length, 2);
        for (const image of images) {
          const pixels = decodePDFRawStream(image).decode();
          for (let i = 0; i < pixels.length; i += 3) {
            assert.equal(pixels[i], pixels[i + 1]);
            assert.equal(pixels[i + 1], pixels[i + 2]);
          }
        }
      }
    }
  }
  await open();
  for (const input of await page.$$('input[role="switch"]:not(:checked)')) await input.click();
  const combined = await pdf(await download());
  assert.equal(combined.getPageCount(), 2);
  assert.equal(combined.getForm().getFields().length, 0);
  assert.equal(combined.getAuthor(), undefined);
  await open();
  for (const input of await page.$$('input[role="switch"]:checked')) await input.click();
  assert.ok(
    original.equals(await readFile(await download())),
    "PDF modifiers mutated the working source",
  );
  assert.equal(
    await page.$eval(
      'button[aria-label="Undo"]',
      (node) => node.getAttribute("aria-disabled") === "true",
    ),
    true,
    "Exports added history entries",
  );
  console.log(
    "✓ Flatten, grayscale, repair, all three compression levels and combined options produce valid PDFs without changing source/history",
  );

  await upload(singlePath);
  await open();
  await select("images");
  assert.equal((await sharp(await readFile(await download())).metadata()).format, "png");
  // A pending destructive mark must be burned into every output, while staying
  // editable in the source. Cover this synthetic page's complete content area.
  await page.click('button[aria-label="Redact"]');
  const box = await (await page.$('img[alt="Page 1"]'))!.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + box.width * 0.03, box.y + box.height * 0.12);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.97, box.y + box.height * 0.9, { steps: 8 });
  await page.mouse.up();
  await open();
  assert.match(await page.$eval(modal, (node) => node.textContent ?? ""), /permanently burned/);
  await page.focus("[data-export-download]");
  for (const modifier of ["Meta", "Control"] as const) {
    await page.keyboard.down(modifier);
    await page.keyboard.press("z");
    await page.keyboard.up(modifier);
  }
  await page.keyboard.press("Delete");
  assert.match(
    await page.$eval(modal, (node) => node.textContent ?? ""),
    /1 redaction\/erase mark/,
    "A global editor shortcut changed the document behind the modal",
  );
  for (const format of ["pdf", "images", "split", "contact", "text", "markdown"]) {
    if (!(await page.$(modal))) await open();
    await select(format);
    const path = await download();
    if (format === "images") {
      const pixel = await sharp(await readFile(path))
        .extract({ left: 300, top: 300, width: 1, height: 1 })
        .removeAlpha()
        .raw()
        .toBuffer();
      assert.deepEqual(
        [...pixel],
        [30, 41, 59],
        "Redaction did not preserve the selected ink colour",
      );
    } else if (format === "text" || format === "markdown") {
      assert.ok(
        !(await readFile(path, "utf8")).includes("local documents"),
        "Text leaked through redaction",
      );
    } else {
      const document = await PDFDocument.load(
        format === "split" ? entry(path, unzip(path)[0]) : await readFile(path),
      );
      const commands = document.context
        .enumerateIndirectObjects()
        .map(([, object]) => object)
        .filter(
          (object): object is PDFRawStream =>
            object instanceof PDFRawStream &&
            object.dict.get(PDFName.of("Subtype")) !== PDFName.of("Image"),
        )
        .map((object) => Buffer.from(decodePDFRawStream(object).decode()).toString("latin1"))
        .join("\n");
      assert.ok(
        /\bDo\b/.test(commands) && !/\b(?:Tj|TJ|Tf)\b/.test(commands),
        "Redacted PDF retained original text operators",
      );
    }
  }
  assert.equal(
    await page.$eval(
      'button[aria-label="Undo"]',
      (node) => node.getAttribute("aria-disabled") === "true",
    ),
    false,
  );
  console.log(
    "✓ All six formats burn pending redaction; PDF streams contain no original text, PNG pixels retain the redaction ink, OCR exports cannot recover the covered text",
  );
  const longPath = join(
    root,
    "Quarterly review — international collaboration, accessibility, document quality and release readiness with extended notes for every contributor.pdf",
  );
  await writeFile(longPath, original);
  await upload(longPath);
  await open();
  await auditAirDialog(page, "export-long-name", evidence);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  await page.screenshot({ path: join(evidence, "export-forced-colors.png") });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.keyboard.press("Escape");
  await page.waitForSelector(modal, { hidden: true });
  await open();
  assert.equal(
    await page.$eval(
      modal,
      (node) =>
        node
          .getAnimations({ subtree: true })
          .filter((animation) => animation.playState === "running").length,
    ),
    0,
  );
  console.log(
    "✓ Long filenames reflow at every viewport/theme/text size; reduced-motion reopen is immediate",
  );
  assert.deepEqual(errors, []);
  await writeFile(
    join(evidence, "output-summary.json"),
    JSON.stringify(
      { downloads: await readdir(downloads), errors, evidence, downloadsDirectory: downloads },
      null,
      2,
    ),
  );
  console.log("✓ Single-page Images downloads a PNG; no uncaught errors. Export suite passed.");
} catch (error) {
  await page.screenshot({ path: join(evidence, "failure.png") });
  console.error(
    await page
      .$eval(modal, (node) => (node as HTMLElement).innerText)
      .catch(() => "No open dialog"),
  );
  throw error;
} finally {
  await browser.close();
}
