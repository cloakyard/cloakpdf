/** Dev-server integration: real OCR and independent PDF.js output geometry. */
import { createEvidenceDirectory } from "./helpers/evidence-directory.ts";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PDFDocument,
  PDFName,
  PDFNumber,
  StandardFonts,
  degrees,
  concatTransformationMatrix,
} from "@pdfme/pdf-lib";
import sharp from "sharp";
import { launch } from "puppeteer-core";

const output = createEvidenceDirectory("cloakpdf-air-ocr");
await mkdir(output, { recursive: true });
const fixture = await PDFDocument.create();
const scan = await sharp(
  Buffer.from(
    `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="600" fill="white"/><g font-family="Arial" font-size="36" fill="black"><text x="64" y="128">Air readable document</text><text x="64" y="240">Private number 7429</text></g></svg>`,
  ),
)
  .png()
  .toBuffer();
const image = await fixture.embedPng(scan);
for (const unit of [1, 2])
  for (const rotation of [0, 90, 180, 270]) {
    const quarter = rotation % 180 !== 0;
    const w = (quarter ? 300 : 400) / unit,
      h = (quarter ? 400 : 300) / unit;
    const page = fixture.addPage([w + 100, h + 140]);
    page.setCropBox(50, 70, w, h);
    page.setRotation(degrees(rotation));
    page.node.set(PDFName.of("UserUnit"), PDFNumber.of(unit));
    const s = 1 / unit;
    const m: [number, number, number, number, number, number] =
      rotation === 0
        ? [s, 0, 0, s, 50, 70]
        : rotation === 90
          ? [0, s, -s, 0, 50 + w, 70]
          : rotation === 180
            ? [-s, 0, 0, -s, 50 + w, 70 + h]
            : [0, -s, s, 0, 50, 70 + h];
    page.pushOperators(concatTransformationMatrix(...m));
    page.drawImage(image, { x: 0, y: 0, width: 400, height: 300 });
  }
const font = await fixture.embedFont(StandardFonts.Helvetica);
fixture.addPage([400, 300]).drawText("Already searchable.", { x: 32, y: 240, size: 18, font });
fixture.addPage([400, 300]);
const bytes = await fixture.save();
const short = await PDFDocument.create();
for (const page of await short.copyPages(fixture, [5, 8, 9])) short.addPage(page);
const file = join(output, "Air OCR study.pdf");
await writeFile(file, await short.save());
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage();
const cdp = await page.createCDPSession();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.setBypassServiceWorker(true);
try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(process.env.E2E_URL ?? "http://127.0.0.1:8122", { waitUntil: "networkidle2" });
  const metrics = await page.evaluate(async (input) => {
    const module = async (path: string) => import(path);
    const { createSearchablePdfFromLayout } = await module("/src/utils/pdf/ocr.ts");
    const { extractTextGeometry, extractLayout } = await module("/src/utils/layout-extract.ts");
    const { getPdfJs } = await module("/src/utils/pdf/raster.ts");
    const pdfjs = await getPdfJs();
    const source = new Uint8Array(input);
    const asFile = (b: Uint8Array) => new File([b.slice()], "scan.pdf");
    const check = (ok: boolean, message: string) => {
      if (!ok) throw new Error(message);
    };
    async function inspect(bytes: Uint8Array) {
      const task = pdfjs.getDocument({ data: bytes.slice() });
      const pdf = await task.promise;
      const rows = [];
      try {
        for (let n = 1; n <= pdf.numPages; n++) {
          const p = await pdf.getPage(n),
            viewport = p.getViewport({ scale: 1 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await p.render({ canvas, canvasContext: ctx, viewport }).promise;
          const content = await p.getTextContent();
          const items = content.items
            .filter((i: { str?: string }) => i.str?.trim())
            .map((i: { str: string; width: number; transform: number[] }) => {
              const t = pdfjs.Util.transform(viewport.transform, i.transform);
              return {
                text: i.str,
                x: t[4],
                y: t[5] - Math.hypot(t[2], t[3]),
                width: i.width * p.userUnit,
                height: Math.hypot(t[2], t[3]),
              };
            });
          rows.push({ items, pixels: ctx.getImageData(0, 0, canvas.width, canvas.height).data });
          canvas.width = canvas.height = 0;
          p.cleanup();
        }
      } finally {
        await task.destroy();
      }
      return rows;
    }
    const original = await inspect(source);
    const synthetic = Array.from({ length: 8 }, (_, i) => ({
      pageNumber: i + 1,
      width: 400,
      height: 300,
      text: "Air document",
      items: [{ text: "Air document", x: 32, y: 42, width: 190, height: 20, fontSize: 18 }],
    }));
    const positioned = await inspect(
      await createSearchablePdfFromLayout(asFile(source), synthetic),
    );
    for (let i = 0; i < 8; i++) {
      const actual = positioned[i].items[0];
      check(!!actual, `missing positioned text on page ${i + 1}`);
      for (const [key, value] of Object.entries({ x: 32, y: 42, width: 190, height: 20 }))
        check(
          Math.abs((actual[key as keyof typeof actual] as number) - value) < 0.05,
          `page ${i + 1} ${key}: ${JSON.stringify(actual)}`,
        );
      check(
        positioned[i].pixels.every((v, p) => v === original[i].pixels[p]),
        `visible image changed ${i + 1}`,
      );
    }
    for (const variant of [
      { ...synthetic[0], items: [{ ...synthetic[0].items[0], text: "日本語" }] },
      { ...synthetic[0], items: [] },
    ]) {
      let rejected = false;
      try {
        await createSearchablePdfFromLayout(asFile(source), [variant]);
      } catch {
        rejected = true;
      }
      check(rejected, "partial/empty searchable output must not succeed silently");
    }
    const progress: number[] = [];
    const layout = await extractTextGeometry(asFile(source), {
      ocr: "image-only",
      onOcrPage: (done: number) => progress.push(done),
    });
    for (let i = 0; i < 8; i++) {
      check(
        layout[i].source === "ocr" && layout[i].items.length >= 6,
        `real OCR boxes missing on page ${i + 1}: ${JSON.stringify(layout[i])}`,
      );
      check(layout[i].width === 400 && layout[i].height === 300, `visible OCR size ${i + 1}`);
      check(
        /Air readable document/.test(layout[i].text),
        `recognition ${i + 1}: ${layout[i].text}`,
      );
    }
    check(
      layout[8].source === "text" && layout[9].items.length === 0,
      "native and blank page classification",
    );
    const searchable = await inspect(await createSearchablePdfFromLayout(asFile(source), layout));
    // PDF.js coalesces neighbouring words into lines; compare each resulting
    // line against the union of its original, independently recognised boxes.
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 2; j++) {
        const words = layout[i].items.slice(j * 3, j * 3 + 3);
        const expected = {
          text: words.map((w: { text: string }) => w.text).join(" "),
          x: words[0].x,
          y: Math.min(...words.map((w: { y: number }) => w.y)),
          width: words[2].x + words[2].width - words[0].x,
          height: words[0].height,
        };
        const actual = searchable[i].items[j];
        check(actual?.text === expected.text, `line roundtrip ${i + 1}/${j}`);
        for (const key of ["x", "y", "width", "height"] as const)
          check(
            Math.abs(actual[key] - expected[key]) < 0.1,
            `real text bounds ${i + 1}/${j}/${key}`,
          );
      }
    check(searchable[8].items.length === original[8].items.length, "native text duplicated");
    check(
      searchable.every((row, i) => row.pixels.every((v, p) => v === original[i].pixels[p])),
      "real OCR changed page pixels",
    );
    // The legacy layout/export pipeline must request blocks and use the rendered
    // frame too, even when liteparse supplies nonzero raw page dimensions.
    const legacy = await extractLayout(asFile(source));
    check(
      legacy[5].width === 400 && legacy[5].height === 300 && legacy[5].items.length >= 6,
      "layout export OCR coordinates",
    );
    const controller = new AbortController();
    controller.abort();
    let cancelled = false;
    try {
      await extractTextGeometry(asFile(source), { signal: controller.signal });
    } catch (e) {
      cancelled = e instanceof DOMException && e.name === "AbortError";
    }
    check(cancelled, "aborted extraction not stopped");
    return { positionedPages: 8, realOcrPages: 8, blankPages: 1, nativePages: 1, progress, layout };
  }, Array.from(bytes));
  await writeFile(join(output, "output.json"), JSON.stringify(metrics, null, 2));
  console.log(
    "PASS real OCR, rotated/cropped/UserUnit word bounds, invisible pixels, native text, blank pages and explicit failures.",
  );
  const input = await page.$('input[type="file"][accept*="pdf"]');
  assert.ok(input);
  await input.uploadFile(file);
  await page.waitForSelector('button[aria-label="OCR"]', { timeout: 30000 });
  await page.click('button[aria-label="OCR"]');
  await page.locator("button::-p-text(Extract text)").click();
  await page.waitForSelector(".pdf-ocr-preview", { timeout: 120000 });
  assert.match(
    await page.$eval(".pdf-ocr-preview pre", (n) => n.textContent!),
    /Air readable document/,
  );
  const layouts = [];
  for (const theme of ["light", "dark"]) {
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: theme },
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
    await page.evaluate((t) => {
      document.documentElement.dataset.airTheme = t;
      document.documentElement.classList.toggle("dark", t === "dark");
    }, theme);
    for (const [width, height] of [
      [1440, 900],
      [1280, 720],
      [1024, 768],
      [768, 1024],
      [390, 844],
      [844, 390],
      [320, 568],
    ]) {
      await page.setViewport({ width, height });
      await cdp.send("Emulation.setTouchEmulationEnabled", {
        enabled: width <= 1024,
        maxTouchPoints: 5,
      });
      await page.waitForFunction(
        ({ width, height }) =>
          !!document.querySelector(".editor-mobile-sheet") ===
          (width < 768 || (width < 1024 && height < 500)),
        {},
        { width, height },
      );
      await page.evaluate(
        () =>
          new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
      );
      const open = await page.$('[aria-label="Open tools"]');
      if (open) await open.click();
      await page.waitForSelector("#ocr-language", { visible: true });
      const narrow = await page.$eval(
        ".pdf-ocr-preview__switch",
        (n) => getComputedStyle(n).display !== "none",
      );
      for (const view of narrow ? ["Text", "Source"] : ["Both"]) {
        if (narrow) await page.locator(`.pdf-ocr-preview__switch button::-p-text(${view})`).click();
        const observation = await page.$eval(".pdf-ocr-preview", (n) => {
          const pre = n.querySelector("pre")!,
            paper = n.querySelector("img")!;
          const p = paper.getBoundingClientRect(),
            t = pre.getBoundingClientRect();
          const trigger = document.querySelector("#ocr-language")!;
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            previewHeight: n.getBoundingClientRect().height,
            textHeight: t.height,
            paperHeight: p.height,
            paperRatio: p.height ? p.width / p.height : 0,
            target: trigger.getBoundingClientRect().height,
            coarse: matchMedia("(pointer: coarse)").matches,
          };
        });
        assert.equal(
          observation.overflow,
          false,
          JSON.stringify({ width, height, view, observation }),
        );
        assert.ok(observation.previewHeight >= 64, JSON.stringify(observation));
        if (view !== "Source") assert.ok(observation.textHeight > 0, JSON.stringify(observation));
        if (view !== "Text")
          assert.ok(Math.abs(observation.paperRatio - 4 / 3) < 0.01, JSON.stringify(observation));
        assert.ok(
          observation.target >= (observation.coarse ? 44 : 40),
          JSON.stringify(observation),
        );
        layouts.push({ theme, width, height, view, ...observation });
        if ([1440, 1280, 768, 390].includes(width))
          await page.screenshot({ path: join(output, `${width}-${theme}-${view}.png`) });
      }
      await page.focus("#ocr-language");
      await page.keyboard.press("Enter");
      await page.waitForSelector('[role="listbox"]', { visible: true });
      const menu = await page.$eval('[role="listbox"]', (n) => {
        const r = n.getBoundingClientRect();
        return {
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          width: innerWidth,
          height: innerHeight,
        };
      });
      assert.ok(
        menu.left >= 15 &&
          menu.right <= menu.width - 15 &&
          menu.top >= 15 &&
          menu.bottom <= menu.height - 15,
        JSON.stringify(menu),
      );
      await page.keyboard.press("Escape");
    }
  }
  // Text enlargement and forced colours retain each preview and reachable controls.
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ]) {
    await page.setViewport({ width, height });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });
    await page.waitForFunction(
      (width) => !!document.querySelector(".editor-mobile-sheet") === width < 768,
      {},
      width,
    );
    await page.evaluate(
      () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
    );
    const open = await page.$('[aria-label="Open tools"]');
    if (open) await open.click();
    await page.focus("#ocr-language");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.screenshot({ path: join(output, `${width}-enlarged.png`) });
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "16px";
  });
  await page.setViewport({ width: 1440, height: 900 });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  await page.waitForSelector(".editor-properties");
  await page.screenshot({ path: join(output, "forced-colours.png") });
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  // Read native and blank pages without inventing content.
  await page.click('[aria-label="Next page"]');
  assert.match(
    await page.$eval(".pdf-ocr-preview pre", (n) => n.textContent!),
    /Already searchable/,
  );
  await page.click('[aria-label="Next page"]');
  assert.match(await page.$eval(".pdf-ocr-preview pre", (n) => n.textContent!), /No text detected/);
  await page.click('[aria-label="Previous page"]');
  await page.click('[aria-label="Previous page"]');
  // A failed application retains the recognised text for retry and copy.
  const failNextRead = async () =>
    page.evaluate(() => {
      // Restored verbatim; invoked with its original receiver via call(this).
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const read = File.prototype.arrayBuffer;
      File.prototype.arrayBuffer = function () {
        File.prototype.arrayBuffer = read;
        return Promise.reject(new Error("OCR test read failed"));
      };
    });
  await failNextRead();
  await page.locator("button::-p-text(Make searchable)").click();
  await page.waitForFunction(() => document.body.innerText.includes("OCR test read failed"));
  assert.ok(await page.$(".pdf-ocr-preview"));
  await page.locator("button::-p-text(Make searchable)").click();
  await page.waitForFunction(() => document.body.innerText.includes("Searchable text added"));
  await page.locator("button::-p-text(Extract text)").click();
  await page.waitForFunction(
    () => document.body.innerText.includes("already has searchable text"),
    { timeout: 120000 },
  );
  await page.click('[aria-label="Undo"]');
  await page.waitForSelector(".pdf-ocr-preview", { hidden: true });
  // Extraction failure persists after the busy state ends and can be retried.
  await failNextRead();
  await page.locator("button::-p-text(Extract text)").click();
  await page.waitForFunction(() =>
    document
      .querySelector('.pdf-ocr-panel [role="alert"]')
      ?.textContent?.includes("OCR test read failed"),
  );
  assert.equal(
    await page.$eval(
      ".pdf-ocr-panel button.air-button--primary",
      (n) => (n as HTMLButtonElement).disabled,
    ),
    false,
  );
  // Hold an in-flight read, leave the tool, then release it. No late preview may appear.
  await page.evaluate(() => {
    // Restored verbatim; invoked with its original receiver via call(this).
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const read = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = function () {
      File.prototype.arrayBuffer = read;
      return new Promise<ArrayBuffer>((resolve) => {
        (window as unknown as { releaseOcr: () => void }).releaseOcr = () => {
          void read.call(this).then(resolve);
        };
      });
    };
  });
  await page.locator("button::-p-text(Extract text)").click();
  await page.waitForFunction(() => !!(window as unknown as { releaseOcr?: unknown }).releaseOcr);
  await page.click('[aria-label="Redact"]');
  await page.evaluate(() => (window as unknown as { releaseOcr: () => void }).releaseOcr());
  // Add a mark at unchanged page count; previous recognition must never be reused.
  const paper = (await page.$('.editor-paper[role="region"]'))!,
    bounds = (await paper.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * 0.06, bounds.y + bounds.height * 0.32);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.6, bounds.y + bounds.height * 0.45, {
    steps: 5,
  });
  await page.mouse.up();
  await page.click('[aria-label="OCR"]');
  await page.waitForFunction(() => document.body.innerText.includes("Apply pending marks"));
  assert.equal(await page.$(".pdf-ocr-preview"), null);
  assert.equal(
    await page.$eval(
      ".pdf-ocr-panel button.air-button--primary",
      (n) => (n as HTMLButtonElement).disabled,
    ),
    true,
  );
  await page.locator("button::-p-text(Apply redactions & erase marks)").click();
  await page.waitForFunction(
    () =>
      !document.querySelector('main[aria-busy="true"]') &&
      !document.body.innerText.includes("Apply pending marks"),
  );
  await page.locator("button::-p-text(Extract text)").click();
  await page.waitForSelector(".pdf-ocr-preview", { timeout: 120000 });
  assert.doesNotMatch(
    await page.$eval(".pdf-ocr-preview pre", (n) => n.textContent!),
    /Private|7429/,
  );
  await page.locator("button::-p-text(Make searchable)").click();
  await page.waitForFunction(() => document.body.innerText.includes("Searchable text added"));
  await page.locator("button::-p-text(Extract text)").click();
  await page.waitForFunction(
    () => document.body.innerText.includes("already has searchable text"),
    { timeout: 120000 },
  );
  assert.doesNotMatch(
    await page.$eval(".pdf-ocr-preview pre", (n) => n.textContent!),
    /Private|7429/,
  );
  await writeFile(join(output, "layouts.json"), JSON.stringify(layouts, null, 2));
  console.log(
    `PASS ${layouts.length} responsive/theme preview states, keyboard language menu, 200% text, forced colours, errors/retry, apply/undo, stale extraction and redaction privacy.`,
  );
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
