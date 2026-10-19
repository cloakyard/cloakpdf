/** Page collections: responsive geometry, keyboard ownership and real staged PDF edits. */
import { createEvidenceDirectory } from "./helpers/evidence-directory.ts";
import assert from "node:assert/strict";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";

const output = createEvidenceDirectory("cloakpdf-air-collections");
await mkdir(output, { recursive: true });
const downloads = join(output, `downloads-${Date.now()}`);
await mkdir(downloads);
const fixture = await PDFDocument.create();
const font = await fixture.embedFont(StandardFonts.Helvetica);
for (let i = 0; i < 6; i++) {
  const p = fixture.addPage(i % 2 ? [600, 400] : [400, 600]);
  if (i === 5) continue;
  p.drawText(`A little room to think. ${i + 1}`, { x: 24, y: p.getHeight() - 48, size: 18, font });
  p.drawText("Made for focus. Kept on your device.", {
    x: 24,
    y: p.getHeight() - 76,
    size: 10,
    font,
  });
  p.drawRectangle({ x: 24, y: 24, width: 80, height: 12, color: rgb(0.15, 0.35, 0.8) });
}
const file = join(output, "Air page collection.pdf");
await writeFile(file, await fixture.save());
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage();
await page.setBypassServiceWorker(true);
const cdp = await page.createCDPSession();
await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
const rows: unknown[] = [];
const clickText = async (text: string) => page.locator(`button::-p-text(${text})`).click();
const order = () =>
  page.$$eval(".editor-page-organize", (nodes) =>
    nodes.map((n) => n.getAttribute("aria-label")?.split(",")[0]),
  );
const settle = () => page.waitForFunction(() => !document.querySelector('main[aria-busy="true"]'));
try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(process.env.E2E_URL ?? "http://localhost:5173", { waitUntil: "networkidle2" });
  await (await page.$('input[type="file"]'))!.uploadFile(file);
  await page.waitForSelector('img[alt="Page 1"]');
  assert.doesNotMatch(await page.$eval(".editor-properties", (n) => n.textContent!), /6 pages/i);
  await clickText("Organize pages");
  await page.waitForSelector(".editor-page-organize");
  await page.focus('[aria-label="Move page 2 up"]');
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () =>
      document.activeElement?.getAttribute("aria-label") === "Move page 2 up" &&
      document.activeElement.getAttribute("aria-disabled") === "true",
  );
  assert.equal((await order())[0], "Page 2");
  await page.keyboard.press("Enter");
  assert.equal((await order())[0], "Page 2");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Move page 2 down",
  );
  await page.keyboard.press("Enter");
  assert.equal((await order())[0], "Page 1");
  assert.match(
    await page.$eval('.sr-only[role="status"]', (n) => n.textContent!),
    /position 2 of 6/,
  );
  // Portrait AND landscape rotations must show the complete bitmap, not clip its ends.
  for (const id of [1, 2]) {
    for (let turn = 1; turn <= 4; turn++) {
      await page.click(`[aria-label="Rotate page ${id}"]`);
      const box = await page.$eval(`img[alt="Page ${id}"]`, (img) => {
        const a = img.getBoundingClientRect();
        const b = img.parentElement!.getBoundingClientRect();
        return [a.left - b.left, a.top - b.top, b.right - a.right, b.bottom - a.bottom];
      });
      assert.ok(
        box.every((v) => Math.abs(v - 1) < 1.5),
        `Rotation ${id}/${turn}: ${JSON.stringify(box)}`,
      );
    }
  }
  await page.click('[aria-label="Delete page 2"]');
  assert.match(
    await page.$eval(".editor-page-organize[data-deleted]", (n) => n.textContent!),
    /Removed/,
  );
  await page.click('[aria-label="Restore page 2"]');
  await clickText("Delete all");
  assert.ok(await page.$("button[disabled]::-p-text(Apply changes)"));
  assert.match(await page.$eval(".editor-organize-warning", (n) => n.textContent!), /at least one/);
  await clickText("Restore all");
  // Fail a single local file read, then retry through the actual renderer.
  await page.evaluate(() => {
    File.prototype.arrayBuffer = function () {
      Reflect.deleteProperty(File.prototype, "arrayBuffer");
      return Promise.reject(new Error("Synthetic scan read failure"));
    };
  });
  await clickText("Find blank pages");
  await page.waitForSelector('.editor-organize-warning[role="alert"]');
  assert.match(await page.$eval(".editor-organize-warning", (n) => n.textContent!), /Try again/);
  assert.equal((await page.$("button::-p-text(Apply changes)")) !== null, true);
  await clickText("Find blank pages");
  await page.waitForSelector("button::-p-text(Delete 1 blank page)");
  await clickText("Delete 1 blank page");
  assert.ok(await page.$('[aria-label="Restore page 6"]'));
  await clickText("Reset pending changes");
  // Real pointer drag uses the same staged ordering as named keyboard actions.
  await page.setDragInterception(true);
  const first = (await page.$(".editor-page-organize"))!;
  const second = (await page.$$(".editor-page-organize"))[1];
  const a = (await first.boundingBox())!,
    b = (await second.boundingBox())!;
  await page.mouse.dragAndDrop({ x: a.x + 20, y: a.y + 20 }, { x: b.x + 30, y: b.y + 30 });
  assert.equal((await order())[0], "Page 2");
  await page.setDragInterception(false);
  await clickText("Reset pending changes");

  const sizes = [
    [320, 568],
    [375, 812],
    [390, 844],
    [430, 932],
    [844, 390],
    [768, 1024],
    [1024, 768],
    [1280, 720],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
  ];
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    for (const [width, height] of sizes) {
      await page.setViewport({ width, height });
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: width <= 1024 });
      const mobile = width < 768 || (width < 1024 && height < 500);
      await page.waitForSelector(
        mobile ? '[data-testid="mobile-tool-sheet"]' : ".editor-properties",
      );
      for (const root of [16, 32]) {
        await page.evaluate((size) => {
          document.documentElement.style.fontSize = `${size}px`;
        }, root);
        for (const state of ["organize", "overview"]) {
          if (state === "overview") {
            await page.click(mobile ? '[aria-label="Cancel"]' : '[aria-label="Organize"]');
            await page.waitForSelector(".editor-page-open");
          }
          const geometry = await page.evaluate(async () => {
            await new Promise(requestAnimationFrame);
            const areas = [
              ...document.querySelectorAll<HTMLElement>(
                ".editor-page-collection,.editor-page-grid,.editor-properties,.editor-properties__header,.editor-properties__body,.editor-organize-panel,.editor-page-card",
              ),
            ];
            const visible = (n: HTMLElement) =>
              n.getClientRects().length && n.getBoundingClientRect().top < innerHeight;
            const min = matchMedia("(pointer:coarse)").matches ? 44 : 40;
            return {
              overflow: areas
                .filter((n) => visible(n) && n.scrollWidth > n.clientWidth + 1)
                .map((n) => n.className),
              targets: [
                ...document.querySelectorAll<HTMLElement>(
                  ".editor-page-actions button,.editor-organize-panel button,.editor-properties__header button",
                ),
              ]
                .filter(visible)
                .filter((n) => {
                  const r = n.getBoundingClientRect();
                  return r.width < min - 1 || r.height < min - 1;
                })
                .map((n) => n.getAttribute("aria-label") ?? n.textContent),
              canvasWidth: document
                .querySelector(".editor-page-collection")!
                .getBoundingClientRect().width,
              columns: getComputedStyle(document.querySelector(".editor-page-grid")!)
                .gridTemplateColumns,
              headerHeight: document.querySelector(".editor-topbar")!.getBoundingClientRect()
                .height,
            };
          });
          rows.push({ theme, width, height, root, state, ...geometry });
          assert.deepEqual(geometry.overflow, [], JSON.stringify(rows.at(-1)));
          assert.deepEqual(geometry.targets, [], JSON.stringify(rows.at(-1)));
          assert.ok(geometry.canvasWidth >= 150, JSON.stringify(rows.at(-1)));
          if (root === 16) assert.equal(geometry.headerHeight, 64);
          if (root === 16 && [390, 768, 1280, 1440].includes(width))
            await page.screenshot({ path: join(output, `${state}-${width}-${theme}.png`) });
          if (state === "overview") {
            if (mobile) {
              const cacheNotice = await page.$(
                '.pdf-toast button[aria-label="Dismiss cache status"], .pdf-toast-actions > button:first-child',
              );
              if (cacheNotice) {
                await cacheNotice.click();
                await page.waitForSelector(".pdf-toast", { hidden: true });
              }
              await page.locator('[aria-label="Open tools"]').click();
              await page.locator('[aria-label="Organize"]').click();
            } else await clickText("Organize pages");
            await page.waitForSelector(".editor-page-organize");
          }
        }
      }
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "16px";
  });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
    { name: "prefers-color-scheme", value: "light" },
  ]);
  assert.equal(
    await page.$eval(".editor-properties__body", (n) => getComputedStyle(n).transitionDuration),
    "0s",
  );
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  await page.screenshot({ path: join(output, "forced-colors.png") });
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  // Native image-error fallback is labelled and keeps the page's geometry.
  const thumb = (await page.$('img[alt="Page 1"]'))!;
  await thumb.evaluate((img) => img.dispatchEvent(new Event("error")));
  await page.waitForSelector('[aria-label="Page 1: Preview unavailable"]');
  await page.click('[aria-label="Organize"]');
  await page.click('[aria-label="Open page 3"]');
  await page.waitForFunction(() =>
    document.activeElement?.getAttribute("aria-label")?.startsWith("Page 3 editing canvas"),
  );
  await clickText("Organize pages");
  await page.click('[aria-label="Rotate page 1"]');
  await page.click('[aria-label="Delete page 6"]');
  await clickText("Reverse order");
  await clickText("Apply changes");
  await page.waitForFunction(() => document.querySelectorAll(".editor-page-organize").length === 5);
  await settle();
  assert.equal(
    await page.$eval("button::-p-text(Apply changes)", (n) => (n as HTMLButtonElement).disabled),
    true,
  );
  await page.click('[aria-label="Export"]');
  await page.waitForSelector("[data-export-download]");
  await page.click("[data-export-download]");
  await page.waitForSelector('[data-testid="export-dialog"]', { hidden: true });
  const files = await readdir(downloads);
  const saved = files.find((name) => name.endsWith(".pdf"))!;
  assert.ok(saved, "Real PDF downloaded");
  const result = await PDFDocument.load(await readFile(join(downloads, saved)));
  assert.equal(result.getPageCount(), 5);
  assert.deepEqual(
    result.getPages().map((p) => p.getRotation().angle),
    [0, 0, 0, 0, 90],
  );
  assert.deepEqual(
    result.getPages().map((p) => p.getWidth()),
    [400, 600, 400, 600, 400],
  );
  await page.click('[aria-label="Undo"]');
  await page.waitForFunction(() => document.querySelectorAll(".editor-page-organize").length === 6);
  await page.click('[aria-label="Rotate page 2"]');
  await page.click('[aria-label="Cancel current tool"]');
  await page.waitForSelector(".editor-page-open");
  await clickText("Organize pages");
  assert.equal(
    await page.$eval("button::-p-text(Apply changes)", (n) => (n as HTMLButtonElement).disabled),
    true,
  );
  // Same-count Apply/Undo must not carry a plan onto different page geometry.
  await page.click('[aria-label="Rotate page 1"]');
  await clickText("Apply changes");
  await page.waitForFunction(
    () =>
      (
        document.querySelector(
          ".editor-organize-panel button.air-button--primary",
        ) as HTMLButtonElement
      )?.disabled && !document.querySelector('main[aria-busy="true"]'),
  );
  await page.click('[aria-label="Delete page 2"]');
  await page.click('[aria-label="Undo"]');
  await page.waitForFunction(() => !document.querySelector('[aria-label="Restore page 2"]'));
  assert.equal((await order()).length, 6);
  await page.click('[aria-label="Redo"]');
  await page.waitForFunction(
    () =>
      parseFloat(
        (document.querySelector(".editor-page-thumb") as HTMLElement)?.style.aspectRatio,
      ) === 1.5,
  );
  await page.click('[aria-label="Reset to original"]');
  await page.waitForFunction(() =>
    (document.querySelector(".editor-page-thumb") as HTMLElement)?.style.aspectRatio.startsWith(
      "0.66",
    ),
  );
  assert.equal((await order()).length, 6);
  for (const count of [1, 60]) {
    const edgePdf = await PDFDocument.create();
    for (let i = 0; i < count; i++) edgePdf.addPage((await edgePdf.copyPages(fixture, [i % 6]))[0]);
    const path = join(output, `${count} pages.pdf`);
    await writeFile(path, await edgePdf.save());
    await page.reload({ waitUntil: "networkidle2" });
    await (await page.$('input[type="file"]'))!.uploadFile(path);
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 60000 });
    await clickText("Organize pages");
    await page.waitForFunction(
      (size) => document.querySelectorAll(".editor-page-organize").length === size,
      {},
      count,
    );
    if (count === 1) {
      const widths = await page.evaluate(() => [
        document.querySelector(".editor-page-card")!.getBoundingClientRect().width,
        document.querySelector(".editor-page-grid")!.getBoundingClientRect().width,
      ]);
      assert.ok(widths[0] < widths[1] / 2, "One page respects the requested thumbnail density");
      await page.click('[aria-label="Delete page 1"]');
      await page.waitForSelector(".editor-organize-warning");
      await page.click('[aria-label="Restore page 1"]');
    } else {
      await page.focus('[aria-label="Move page 60 up"]');
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") === "Move page 60 up" &&
          document.activeElement.closest("li")?.getAttribute("aria-label")?.includes("position 59"),
      );
      const visible = await page.evaluate(() => {
        const r = document.activeElement!.getBoundingClientRect();
        return r.top >= 64 && r.bottom <= innerHeight;
      });
      assert.ok(visible, "Moved action remains visible in the long collection");
    }
  }
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "collections.json"),
    JSON.stringify(
      {
        cases: rows.length,
        rows,
        features: [
          "keyboard reorder/boundary/focus/announcement",
          "portrait/landscape rotation fits",
          "delete/restore/all-deleted guard",
          "blank-page scan failure/retry",
          "real pointer drag",
          "overview-to-canvas focus",
          "thumbnail error",
          "real export rotation/order/page count",
          "Apply/Undo/Redo/Reset/Cancel",
          "single-page density and 60-page offscreen focus",
          "reduced motion/forced colors",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS: ${rows.length} collection layouts, staged edits, real PDF output and keyboard ownership.`,
  );
} catch (error) {
  await page.screenshot({ path: join(output, "failure.png") });
  throw error;
} finally {
  await browser.close();
}
