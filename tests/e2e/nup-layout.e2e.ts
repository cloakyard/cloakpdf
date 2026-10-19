/** Development-server integration: compare print output with independently rendered source pages. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, PDFName, PDFNumber, StandardFonts, degrees, rgb } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";

const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-nup";
await mkdir(output, { recursive: true });
const fixture = await PDFDocument.create();
const font = await fixture.embedFont(StandardFonts.Helvetica);
for (const unit of [1, 2])
  for (const rotation of [0, 90, 180, 270]) {
    const quarter = rotation % 180 !== 0;
    const w = (quarter ? 300 : 400) / unit,
      h = (quarter ? 400 : 300) / unit;
    const p = fixture.addPage([w + 100, h + 140]);
    p.setCropBox(50, 70, w, h);
    p.setRotation(degrees(rotation));
    p.node.set(PDFName.of("UserUnit"), PDFNumber.of(unit));
    p.drawRectangle({ x: 0, y: 0, width: w + 100, height: h + 140, color: rgb(1, 0, 0) });
    p.drawRectangle({ x: 50, y: 70, width: w, height: h, color: rgb(0.96, 0.97, 1) });
    p.drawRectangle({ x: 60, y: 80, width: 20, height: 35, color: rgb(0.2, 0.4, 0.7) });
    p.drawText(`Source ${fixture.getPageCount()}`, { x: 80, y: 110, size: 14 / unit, font });
  }
fixture.addPage([400, 300]); // Truly blank, no Contents.
const tall = fixture.addPage([200, 600]);
tall.drawRectangle({ x: 10, y: 10, width: 180, height: 580, color: rgb(0.8, 0.9, 0.8) });
const formPage = fixture.addPage([500, 600]);
formPage.setCropBox(50, 70, 300, 400);
formPage.setRotation(degrees(90));
const field = fixture.getForm().createTextField("name");
field.addToPage(formPage, { x: 100, y: 150, width: 180, height: 30 });
field.setText("Air form value");
const bytes = await fixture.save();
const short = await PDFDocument.create();
for (const p of await short.copyPages(fixture, [0, 1, 2, 3, 4])) short.addPage(p);
const file = join(output, "Air print study.pdf");
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
    const { nupPages } = await module("/src/utils/pdf/transform.ts");
    const { getPdfJs } = await module("/src/utils/pdf/raster.ts");
    const pdfjs = await getPdfJs();
    const source = new Uint8Array(input);
    async function render(bytes: Uint8Array) {
      const task = pdfjs.getDocument({ data: bytes.slice() });
      const doc = await task.promise;
      const pages: { canvas: HTMLCanvasElement; text: string }[] = [];
      try {
        for (let i = 1; i <= doc.numPages; i++) {
          const p = await doc.getPage(i),
            viewport = p.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await p.render({ canvas, canvasContext: canvas.getContext("2d"), viewport }).promise;
          const content = await p.getTextContent();
          pages.push({
            canvas,
            text: content.items.map((i: { str?: string }) => i.str ?? "").join(" "),
          });
          p.cleanup();
        }
      } finally {
        await task.destroy();
      }
      return pages;
    }
    const original = await render(source);
    const observations = [];
    for (const layout of ["2x1", "1x2", "2x2", "3x3", "booklet"]) {
      const bytes = await nupPages(new File([source.slice()], "print.pdf"), layout);
      const actual = await render(bytes);
      const [cols, rows] = layout === "booklet" ? [2, 1] : layout.split("x").map(Number);
      // Independent known order for the 11-page fixture, padded to 12 leaves.
      const order =
        layout === "booklet" ? [-1, 0, 1, 10, 9, 2, 3, 8, 7, 4, 5, 6] : original.map((_, i) => i);
      if (actual.length !== Math.ceil(order.length / (cols * rows)))
        throw new Error(`Page count: ${layout}`);
      if (
        !actual
          .map((p) => p.text)
          .join(" ")
          .includes("Air form value")
      )
        throw new Error(`Lost form: ${layout}`);
      for (let sheet = 0; sheet < actual.length; sheet++) {
        const canvas = actual[sheet].canvas,
          expected = document.createElement("canvas");
        expected.width = original[0].canvas.width;
        expected.height = original[0].canvas.height;
        if (canvas.width !== expected.width || canvas.height !== expected.height)
          throw new Error(`Sheet geometry: ${layout}`);
        const ctx = expected.getContext("2d")!;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, expected.width, expected.height);
        const cw = expected.width / cols,
          ch = expected.height / rows;
        for (let slot = 0; slot < cols * rows; slot++) {
          const p = original[order[sheet * cols * rows + slot]]?.canvas;
          if (!p) continue;
          const scale = Math.min(cw / p.width, ch / p.height),
            w = p.width * scale,
            h = p.height * scale;
          ctx.drawImage(
            p,
            (slot % cols) * cw + (cw - w) / 2,
            Math.floor(slot / cols) * ch + (ch - h) / 2,
            w,
            h,
          );
        }
        const want = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const got = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
        let total = 0,
          changed = 0;
        for (let i = 0; i < got.length; i += 4) {
          let delta = 0;
          for (let c = 0; c < 3; c++) delta += Math.abs(got[i + c] - want[i + c]);
          total += delta;
          if (delta > 90) changed++;
        }
        const mean = total / ((got.length / 4) * 3),
          fraction = changed / (got.length / 4);
        if (mean > 1.5 || fraction > 0.02)
          throw new Error(`Print pixels ${layout}/${sheet}: ${mean}, ${fraction}`);
        observations.push({ layout, sheet, mean, fraction });
      }
    }
    return observations;
  }, Array.from(bytes));
  await writeFile(join(output, "outputs.json"), JSON.stringify(metrics, null, 2));
  console.log(
    `PASS ${metrics.length} output sheets: crop/rotation/units, blanks, mixed dimensions, form appearance and searchable vectors.`,
  );

  await (await page.$('input[type="file"]'))!.uploadFile(file);
  await page.waitForSelector('img[alt="Page 1"]');
  await page.click('[aria-label="N-up"]');
  // Pointer opening is immediate too, including the arrow; keyboard assertions
  // below repeat across all layouts, themes and enlarged text.
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
  await page.click("#nup-layout");
  assert.deepEqual(
    await page.$eval("[role=listbox]", (n) => ({
      animations: n.getAnimations({ subtree: true }).length,
      transition: getComputedStyle(n).transitionDuration,
      arrowTransition: getComputedStyle(document.querySelector("#nup-layout svg")!)
        .transitionDuration,
    })),
    { animations: 0, transition: "0s", arrowTransition: "0s" },
  );
  await page.keyboard.press("Escape");
  const select = async (index: number) => {
    await page.focus("#nup-layout");
    await page.keyboard.press("Enter");
    await page.waitForSelector('[role="listbox"]', { visible: true });
    // Opening can auto-scroll the inspector; let its ResizeObserver/rAF placement settle.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await page.waitForFunction(() => {
      const node = document.querySelector('[role="listbox"]');
      const trigger = document.querySelector("#nup-layout");
      if (!node || !trigger) return false;
      const a = node.getBoundingClientRect(),
        b = trigger.getBoundingClientRect();
      const gap = a.bottom <= b.top ? b.top - a.bottom : a.top - b.bottom;
      return Math.abs(gap - 4) < 1;
    });
    const popup = await page.$eval('[role="listbox"]', (node) => {
      const r = node.getBoundingClientRect(),
        trigger = document.querySelector("#nup-layout")!.getBoundingClientRect();
      return {
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        gap: r.bottom <= trigger.top ? trigger.top - r.bottom : r.top - trigger.bottom,
        width: innerWidth,
        height: innerHeight,
        target: node.querySelector('[role="option"]')!.getBoundingClientRect().height,
        touch: matchMedia("(pointer: coarse)").matches,
        clippedLabels: Array.from(node.querySelectorAll("[role=option] > span")).filter(
          (label) => label.scrollWidth > label.clientWidth + 1,
        ).length,
        animationCount: node.getAnimations({ subtree: true }).length,
        transition: getComputedStyle(node).transitionDuration,
      };
    });
    assert.ok(
      popup.left >= 15 &&
        popup.right <= popup.width - 15 &&
        popup.top >= 15 &&
        popup.bottom <= popup.height - 15,
      JSON.stringify(popup),
    );
    assert.ok(Math.abs(popup.gap - 4) < 1, JSON.stringify(popup));
    assert.ok(popup.target >= (popup.touch ? 44 : 40), JSON.stringify(popup));
    assert.equal(popup.clippedLabels, 0, "Full choice labels remain readable");
    assert.equal(popup.animationCount, 0, "Frequent selects are immediate");
    assert.equal(popup.transition, "0s");
    await page.keyboard.press("Home");
    for (let i = 0; i < index; i++) await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.waitForSelector('[role="listbox"]', { hidden: true });
  };
  await select(4);
  assert.equal(
    await page.$eval(".pdf-nup-preview__paper", (n) => n.getAttribute("aria-label")),
    "Print preview: blank, page 1",
  );
  await page.click(".air-switch-row input");
  assert.equal(await page.$(".pdf-nup-preview__marks"), null);
  await page.click(".air-switch-row input");
  await page.click('[aria-label="Annotate"]');
  await page.locator("button::-p-text(Rectangle)").click();
  const paper = (await page.$('.editor-paper[role="region"]'))!;
  const bounds = (await paper.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * 0.2, bounds.y + bounds.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.45, bounds.y + bounds.height * 0.45, {
    steps: 5,
  });
  await page.mouse.up();
  await page.click('[aria-label="N-up"]');
  assert.equal(
    await page.$eval("button::-p-text(Make booklet)", (n) => (n as HTMLButtonElement).disabled),
    true,
  );
  await page.locator("button::-p-text(Review annotations)").click();
  await page.locator("button::-p-text(Apply annotations)").click();
  await page.waitForFunction(() => !document.querySelector('main[aria-busy="true"]'));
  await page.click('[aria-label="N-up"]');
  assert.equal(await page.$(".pdf-nup-pending"), null);
  assert.match(await page.$eval("#nup-layout", (n) => n.textContent!), /Booklet/);

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
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const open = await page.$('[aria-label="Open tools"]');
      if (open) await open.click();
      await page.waitForSelector("#nup-layout", { visible: true });
      for (let choice = 0; choice < 5; choice++) {
        await select(choice);
        const result = await page.$eval(".pdf-nup-preview", (n) => {
          const p = n.querySelector(".pdf-nup-preview__paper")!;
          const box = p.getBoundingClientRect();
          const select = document.querySelector("#nup-layout")!.getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            ratio: box.width / box.height,
            white: getComputedStyle(p).backgroundColor,
            target: select.height,
            controlWidth: select.width,
          };
        });
        assert.equal(result.overflow, false);
        assert.ok(Math.abs(result.ratio - 4 / 3) < 0.02, JSON.stringify(result));
        assert.equal(result.white, "rgb(255, 255, 255)");
        assert.ok(
          result.target >= (width <= 1024 ? 44 : 40),
          JSON.stringify({ width, height, choice, ...result }),
        );
        layouts.push({ theme, width, height, choice, ...result });
      }
      if ([1440, 1280, 768, 390].includes(width))
        await page.screenshot({ path: join(output, `${width}-${theme}.png`) });
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await page.focus("#nup-layout");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Home");
  await page.keyboard.press("Escape");
  assert.match(await page.$eval("#nup-layout", (n) => n.textContent!), /Booklet/);
  // Enlarged text must keep the popup, each choice, and switch reachable.
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ]) {
    await page.setViewport({ width, height });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
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
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const open = await page.$('[aria-label="Open tools"]');
    if (open) await open.click();
    await select(4);
    await page.focus(".air-switch-row input");
    await page.keyboard.press("Space");
    assert.equal(await page.$(".pdf-nup-preview__marks"), null);
    await page.keyboard.press("Space");
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "16px";
  });
  await page.setViewport({ width: 1440, height: 900 });
  await page.waitForSelector(".editor-properties");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  await select(4);
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  await page.locator("button::-p-text(Make booklet)").click();
  await page.waitForFunction(
    () =>
      !document.querySelector('main[aria-busy="true"]') &&
      document.querySelector('[aria-label="Next page"]'),
  );
  await page.waitForSelector('[aria-label="Page 1 of 4"]');
  await page.click('[aria-label="Undo"]');
  await page.waitForFunction(() => !document.querySelector('main[aria-busy="true"]'));
  await page.waitForSelector('[aria-label="Page 1 of 5"]');
  assert.equal(
    await page.$eval(".pdf-nup-preview__paper", (n) => n.getAttribute("aria-label")),
    "Print preview: blank, page 1",
  );
  await writeFile(join(output, "layouts.json"), JSON.stringify(layouts, null, 2));
  assert.deepEqual(errors, []);
  console.log(
    `PASS ${layouts.length} N-up layouts, keyboard picker, padding/mark preview, draft guard, apply and undo.`,
  );
} finally {
  await browser.close();
}
