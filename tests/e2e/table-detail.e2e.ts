/** Exercise both tools from the shipping picker through clipboard and downloaded PDF. */
import assert from "node:assert/strict";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { degrees, PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
import { createEvidenceDirectory } from "./helpers/evidence-directory.ts";

const evidence = createEvidenceDirectory("table-detail");
const downloads = join(evidence, "downloads");
await mkdir(downloads);
const pdf = await PDFDocument.create();
const from = pdf.addPage([400, 500]),
  to = pdf.addPage([400, 500]);
from.drawText("See Figure 4", { x: 50, y: 450, size: 12 });
const rows = [
  ["Item", "Area", "Count"],
  ["East wing", "", "12"],
  ["West", "35", "-3"],
];
for (const [i, row] of rows.entries())
  for (const [j, cell] of row.entries())
    if (cell) from.drawText(cell, { x: [50, 165, 280][j], y: 390 - i * 25, size: 12 });
to.setCropBox(10, 20, 380, 460);
to.setRotation(degrees(90));
to.node.set(PDFName.of("UserUnit"), PDFNumber.of(1.5));
to.drawText("Figure 4", { x: 100, y: 250, size: 16 });
const fixture = join(evidence, "study.pdf");
await writeFile(fixture, await pdf.save());

const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const sizes = [
  [320, 568],
  [375, 812],
  [390, 844],
  [430, 932],
  [535, 320],
  [536, 320],
  [537, 320],
  [568, 320],
  [844, 390],
  [768, 1024],
  [1024, 768],
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];
try {
  const page = await browser.newPage();
  const cdp = await page.createCDPSession();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloads });
  const clickText = (label: string) => page.locator("button::-p-text(" + label + ")").click();
  const paper = '.editor-paper[role="region"]';
  const area = async () =>
    page.$eval(paper, (e) => {
      const { x, y, width, height } = e.getBoundingClientRect();
      return { x, y, width, height };
    });
  const point = async (x: number, y: number) => {
    const a = await area();
    return { x: a.x + a.width * x, y: a.y + a.height * y };
  };
  const drag = async (x: number, y: number, x1: number, y1: number) => {
    const a = await point(x, y),
      b = await point(x1, y1);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 5 });
    await page.mouse.up();
  };
  const tap = async (x: number, y: number) => {
    const p = await point(x, y);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  const settle = () =>
    page.evaluate(async () => {
      for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    });
  const measurements: unknown[] = [];
  async function matrix(mode: string, selector: string) {
    for (const [width, height] of sizes) {
      await page.setViewport({ width, height });
      await cdp.send("Emulation.setTouchEmulationEnabled", {
        enabled: width <= 1024,
        maxTouchPoints: 5,
      });
      for (const theme of ["light", "dark"])
        for (const root of [16, 32]) {
          await page.emulateMediaFeatures([
            { name: "prefers-color-scheme", value: theme },
            { name: "prefers-reduced-motion", value: "reduce" },
          ]);
          await page.evaluate(
            ({ theme, root }) => {
              document.documentElement.dataset.airTheme = theme;
              document.documentElement.style.fontSize = root + "px";
            },
            { theme, root },
          );
          await page.waitForSelector(selector, { visible: true });
          await settle();
          const res = await page.evaluate((selector) => {
            const body = document.querySelector<HTMLElement>(
              '.editor-properties__body,.editor-mobile-sheet__body[aria-label="Tool controls"]',
            )!;
            const preview = document.querySelector<HTMLElement>(".editor-paper")!;
            const panel = body.querySelector(selector);
            return {
              overflow: Math.max(
                body.scrollWidth - body.clientWidth,
                document.documentElement.scrollWidth - innerWidth,
              ),
              paper: Math.round(Math.min(preview.offsetWidth, preview.offsetHeight)),
              panelHeight: body.clientHeight,
              visible: !!panel,
            };
          }, selector);
          assert.ok(
            res.overflow <= 2 && res.paper >= 40 && res.panelHeight >= 44 && res.visible,
            JSON.stringify({ mode, width, height, theme, root, res }),
          );
          measurements.push({ mode, width, height, theme, root, ...res });
          if ([390, 844, 1440].includes(width) && root === 16 && theme === "light") {
            await page.screenshot({ path: join(evidence, mode + "-" + width + ".png") });
          }
        }
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(process.env.E2E_URL ?? "http://127.0.0.1:5173");
  await (await page.waitForSelector("input[type=file]"))!.uploadFile(fixture);
  await page.locator('button[aria-label="Select text"]').click();
  await clickText("Capture a table");
  await page.waitForSelector('section[aria-label="Table capture"]');
  await drag(0.07, 0.17, 0.9, 0.39);
  await page.waitForSelector(".pdf-table-preview tbody td");
  const cells = () =>
    page.$$eval(".pdf-table-preview tbody tr", (rs) =>
      rs.map((r) => Array.from(r.cells, (c) => c.textContent)),
    );
  assert.deepEqual(await cells(), rows);
  const expected = rows.map((r) => r.join("\t")).join("\n");
  await browser
    .defaultBrowserContext()
    .overridePermissions(new URL(page.url()).origin, [
      "clipboard-read",
      "clipboard-write",
      "clipboard-sanitized-write",
    ]);
  await clickText("Copy table");
  await page.waitForFunction(() =>
    document
      .querySelector('section[aria-label="Table capture"]')
      ?.textContent?.includes("Table copied."),
  );
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined }),
  );
  await clickText("Copy table");
  await page.waitForSelector("#capture-tsv");
  assert.equal(await page.$eval("#capture-tsv", (e) => (e as HTMLTextAreaElement).value), expected);
  await page.locator(".pdf-selection-help summary").click();
  await clickText("Add divider");
  assert.equal(await page.$$eval(".pdf-column-control input", (r) => r.length), 3);
  await page.locator('[aria-label="Remove divider 3"]').click();
  await page.focus("#table-cut-0");
  await page.keyboard.press("ArrowRight");
  await drag(0.07, 0.17, 0.9, 0.39);
  assert.deepEqual(await cells(), rows);
  // Move a real on-paper divider far enough to merge two cells into the first column.
  const firstCut = await page.$eval("#table-cut-0", (e) => (e as HTMLInputElement).valueAsNumber);
  await drag(firstCut, 0.27, 0.56, 0.27);
  assert.equal((await cells())[0][0], "Item Area");
  await drag(0.07, 0.17, 0.9, 0.39);
  await page.setViewport({ width: 390, height: 844 });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await settle();
  await tap(0.03, 0.55);
  await tap(0.92, 0.7);
  await page.waitForFunction(() => document.body.textContent?.includes("No text in this area."));
  await tap(0.07, 0.17);
  await tap(0.9, 0.39);
  await page.waitForSelector(".pdf-table-preview");
  assert.deepEqual(await cells(), rows);
  await matrix("table", ".pdf-table-preview");
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "16px";
  });
  await page.locator('button[aria-label="Annotate"]').click();
  const annotationMode = (label: string) =>
    page.locator('[aria-label="Annotation tool"] button::-p-text(' + label + ")").click();
  await annotationMode("Rectangle");
  await drag(0.05, 0.72, 0.28, 0.81);
  await annotationMode("Link");
  await page.waitForSelector(".pdf-detail-link");
  await page.setViewport({ width: 390, height: 844 });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await settle();
  await tap(0.15, 0.092);
  await page.waitForFunction(() =>
    document.querySelector(".pdf-detail-link")?.textContent?.includes("Choose the detail"),
  );
  await page.locator('[aria-label="Next page"]').click();
  await page.waitForSelector('.editor-paper[aria-label^="Page 2 "]');
  await settle();
  await matrix("link-placement", ".pdf-detail-link");
  await page.setViewport({ width: 390, height: 844 });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await settle();
  await tap(0.25, 0.25);
  await tap(0.75, 0.75);
  const destination = '[aria-label="Link destination"]';
  await page.waitForSelector(destination);
  assert.match(await page.$eval(destination, (e) => e.textContent!), /page 2/);
  // Reopen the destination, cancel once, then change it without duplicating the annotation.
  await clickText("Change destination");
  await page.waitForSelector('.editor-paper[aria-label^="Page 2 "]');
  await clickText("Back to annotations");
  await page.waitForSelector(destination);
  await clickText("Change destination");
  await page.waitForSelector('.editor-paper[aria-label^="Page 2 "]');
  await settle();
  await tap(0.2, 0.25);
  await tap(0.8, 0.75);
  await page.waitForSelector(destination);
  await clickText("Delete annotation");
  await page.waitForFunction(() =>
    document.querySelector('[aria-label="Apply annotations"]')?.textContent?.includes("1 mark"),
  );
  await page.setViewport({ width: 1440, height: 900 });
  await page.locator('button[aria-label="Undo"]').click();
  await page.waitForFunction(() =>
    document.querySelector('[aria-label="Apply annotations"]')?.textContent?.includes("2 marks"),
  );
  // The selector can also recover a reference too small to hit precisely on a phone.
  await page.locator("#annotation-selection").click();
  await page.locator("[role=option]::-p-text(Link)").click();
  await page.waitForSelector(destination);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "16px";
  });
  await settle();
  await drag(0.125, 0.083, 0.07, 0.05);
  await page.focus(paper);
  await page.keyboard.press("ArrowRight");
  await matrix("link", destination);
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "16px";
  });
  await page.locator('.editor-mobile-sheet__header button[aria-label="Apply"]').click();
  await page.waitForSelector(".pdf-annotate-panel", { hidden: true });
  await page.locator('button[aria-label="Export"]').click();
  await page.locator("[role=dialog] button::-p-text(Download)").click();
  let file: string | undefined;
  for (let i = 0; i < 120 && !file; i++) {
    file = (await readdir(downloads)).find((n) => n.endsWith(".pdf"));
    if (!file) await delay(100);
  }
  assert.ok(file, "PDF download");
  const exported = await readFile(join(downloads, file));
  const saved = await PDFDocument.load(exported);
  const link = saved.getPage(0).node.lookup(PDFName.of("Annots"), PDFArray).lookup(0, PDFDict);
  assert.equal(link.get(PDFName.of("Subtype"))?.toString(), "/Link");
  const source = link.lookup(PDFName.of("Rect"), PDFArray).asRectangle();
  assert.ok(
    source.x < 40 &&
      source.width > 70 &&
      source.x + source.width >= 60 &&
      source.y <= 454 &&
      source.y + source.height >= 454,
  );
  const dest = link.lookup(PDFName.of("Dest"), PDFArray);
  assert.equal(dest.get(0).toString(), saved.getPage(1).ref.toString());
  assert.equal(dest.get(1).toString(), "/FitR");
  [105, 112, 295, 388].forEach((n, i) =>
    assert.ok(Math.abs(dest.lookup(i + 2, PDFNumber).asNumber() - n) < 4),
  );
  // Use the shipping PDF.js reader to resolve the link, including after a linked
  // destination is rasterized by redaction. No second copy of that page can survive.
  const afterRedaction = await page.evaluate(async (bytes) => {
    const load = async (path: string) => import(path);
    const { redactPdf } = await load("/src/utils/pdf-operations.ts");
    const { pdfjsLib } = await load("/src/utils/pdf-renderer.ts");
    const output = await redactPdf(new File([new Uint8Array(bytes)], "linked.pdf"), [
      { pageIndex: 1, xPct: 0, yPct: 0, wPct: 1, hPct: 1 },
    ]);
    const task = pdfjsLib.getDocument({ data: new Uint8Array(output) });
    try {
      const document = await task.promise;
      const [link] = await (await document.getPage(1)).getAnnotations();
      const text = await (await document.getPage(2)).getTextContent();
      return {
        target: await document.getPageIndex(link.dest[0]),
        fit: link.dest[1].name,
        words: text.items.length,
        bytes: Array.from(output) as number[],
      };
    } finally {
      await task.destroy();
    }
  }, Array.from(exported));
  assert.equal(afterRedaction.target, 1);
  assert.equal(afterRedaction.fit, "FitR");
  assert.equal(afterRedaction.words, 0);
  const redacted = await PDFDocument.load(new Uint8Array(afterRedaction.bytes));
  assert.equal(
    redacted.context
      .enumerateIndirectObjects()
      .filter(([, o]) => o instanceof PDFDict && o.get(PDFName.of("Type")) === PDFName.of("Page"))
      .length,
    2,
  );
  await page.keyboard.press("Escape");
  await page.setViewport({ width: 1440, height: 900 });
  // Undo restores both editable marks; redo commits them together again.
  await page.locator('button[aria-label="Undo"]').click();
  await page.locator('button[aria-label="Annotate"]').click();
  await page.waitForFunction(() =>
    document.querySelector('[aria-label="Apply annotations"]')?.textContent?.includes("2 marks"),
  );
  await page.locator('button[aria-label="Redo"]').click();
  await page.waitForFunction(() =>
    document.querySelector('[aria-label="Apply annotations"]')?.textContent?.includes("0 marks"),
  );
  assert.deepEqual(errors, []);
  await writeFile(join(evidence, "sizes.json"), JSON.stringify(measurements));
  console.log(
    "PASS clipboard, table controls, touch placement, mixed annotation Apply, Undo/Redo, downloaded link and " +
      measurements.length +
      " responsive states.",
  );
} finally {
  await browser.close();
}
