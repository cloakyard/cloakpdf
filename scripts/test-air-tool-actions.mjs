// Real phone interactions and exported bytes in Chromium and WebKit.
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument } from "@pdfme/pdf-lib";
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const out =
  process.env.AIR_EVIDENCE_DIR || (await mkdtemp(join(tmpdir(), "cloakpdf-tool-actions-")));
await mkdir(out, { recursive: true });
const source = await PDFDocument.create();
source.addPage([400, 600]);
source.setTitle("Original title");
source.setAuthor("Local example");
const bytes = Buffer.from(await source.save());
const results = [],
  errors = [];
for (const engine of ["chromium", "webkit"]) {
  const browser =
    engine === "webkit"
      ? await webkit.launch()
      : await chromium.launch({
          executablePath:
            process.env.CHROME_PATH ||
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        });
  try {
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [430, 932],
    ]) {
      for (const theme of ["light", "dark"]) {
        const page = await browser.newPage({
          viewport: { width, height },
          hasTouch: true,
          colorScheme: theme,
          reducedMotion: "reduce",
          serviceWorkers: "block",
        });
        page.setDefaultTimeout(20000);
        page.on("pageerror", (e) => errors.push({ engine, width, theme, message: e.message }));
        await page.goto(process.env.BASE_URL || "http://127.0.0.1:8462");
        await page
          .locator("input[type=file]")
          .first()
          .setInputFiles({ name: "Actions.pdf", mimeType: "application/pdf", buffer: bytes });
        await page.locator('img[alt="Page 1"]').waitFor();
        const sheet = page.locator(".editor-mobile-sheet");
        const actions = sheet.locator(".air-editor-actions");
        const button = (name) => actions.getByRole("button", { name, exact: true });
        const open = async (name) => {
          await page.getByRole("button", { name: "Open tools", exact: true }).click();
          await sheet.getByRole("button", { name, exact: true }).click();
          await actions.waitFor();
        };
        await open("Metadata");
        const title = page.locator("#metadata-title");
        await title.fill("Discard this title");
        assert.deepEqual(await actions.locator("button").allTextContents(), ["Cancel", "Apply"]);
        await button("Cancel").click();
        await open("Metadata");
        assert.equal(await title.inputValue(), "Original title");
        await title.fill("Applied title");
        await page.getByRole("button", { name: "Expand controls", exact: true }).click();
        assert.equal(await title.inputValue(), "Applied title");
        await page.getByRole("button", { name: "Return to split view", exact: true }).click();
        for (const name of ["Cancel", "Apply"]) {
          const box = await button(name).boundingBox();
          assert(
            box &&
              box.height >= 44 &&
              box.x >= 0 &&
              box.y >= 0 &&
              box.x + box.width <= width + 1 &&
              box.y + box.height <= height + 1,
          );
          assert.equal(await button(name).locator("svg").count(), 0);
        }
        assert.equal(
          await actions.evaluate((e) => !!e.closest(".editor-mobile-sheet__body")),
          false,
          "Actions stay outside the scrolling controls",
        );
        await page.screenshot({ path: `${out}/${engine}-${width}-${theme}-metadata.png` });
        await button("Apply").evaluate((e) => {
          e.click();
          e.click();
          e.parentElement.querySelector('[aria-label="Cancel"]').click();
        });
        await page.getByRole("button", { name: "Open tools", exact: true }).waitFor();
        await page.getByRole("button", { name: "Undo", exact: true }).click();
        await open("Metadata");
        assert.equal(
          await title.inputValue(),
          "Original title",
          "A repeated Apply must create only one undo step",
        );
        await button("Cancel").click();
        await page.getByRole("button", { name: "Redo", exact: true }).click();
        await open("Metadata");
        assert.equal(await title.inputValue(), "Applied title");
        await button("Cancel").click();
        await open("Attach");
        assert.deepEqual(await actions.locator("button").allTextContents(), ["Cancel", "Close"]);
        await button("Close").click();
        await page.getByRole("button", { name: "Export", exact: true }).click();
        const dialog = page.getByRole("dialog", { name: "Export" });
        const downloading = page.waitForEvent("download");
        await dialog.getByRole("button", { name: "Download", exact: true }).click();
        const download = await downloading;
        const path = `${out}/${engine}-${width}-${theme}.pdf`;
        await download.saveAs(path);
        const output = await PDFDocument.load(await readFile(path));
        assert.equal(output.getTitle(), "Applied title");
        assert.equal(output.getAuthor(), "Local example");
        assert.equal(output.getPageCount(), 1);
        assert.deepEqual(output.getPage(0).getSize(), { width: 400, height: 600 });
        results.push({
          engine,
          width,
          height,
          theme,
          cancel: true,
          applyOnce: true,
          undoRedo: true,
          close: true,
          download: { title: output.getTitle(), pages: output.getPageCount() },
        });
        console.log(engine, width, theme, "passed");
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(`${out}/results.json`, JSON.stringify({ results, errors }, null, 2) + "\n");
assert.deepEqual(errors, []);
console.log(`${results.length} phone action journeys and actual PDF downloads passed`);
