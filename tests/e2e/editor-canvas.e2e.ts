/** Air canvas: responsive paper/focus, shared brand size and inline editing ownership. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";

const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-canvas";
await mkdir(output, { recursive: true });
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (const size of [
  [480, 640],
  [640, 480],
]) {
  const p = pdf.addPage(size as [number, number]);
  p.drawText("A little room to think.", { x: 40, y: size[1] - 64, size: 24, font });
  p.drawText("Your ideas. On your terms.", { x: 40, y: size[1] - 94, size: 12, font });
  p.drawRectangle({ x: 40, y: 40, width: 80, height: 4, color: rgb(0.15, 0.35, 0.8) });
}
const file = join(output, "Air canvas study.pdf");
await writeFile(file, await pdf.save());
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage();
await page.setBypassServiceWorker(true);
const cdp = await page.createCDPSession();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
const rows: unknown[] = [];
const stage = '.editor-paper[role="region"]';
const field = ".editor-inline-text";
const clickText = async (label: string) =>
  page.evaluate((text) => {
    const b = [...document.querySelectorAll("button")].find((n) => n.textContent?.trim() === text);
    if (!b) throw new Error(`Missing button: ${text}`);
    b.click();
  }, label);
async function draw(from: [number, number], to: [number, number]) {
  const b = (await (await page.$(stage))!.boundingBox())!;
  await page.mouse.move(b.x + b.width * from[0], b.y + b.height * from[1]);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * to[0], b.y + b.height * to[1], { steps: 8 });
  await page.mouse.up();
}
try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(process.env.E2E_URL ?? "http://localhost:5173", { waitUntil: "networkidle2" });
  assert.deepEqual(
    await page.$eval(".air-page-mark", (n) => [n.clientWidth, n.clientHeight]),
    [36, 36],
  );
  await (await page.$('input[type="file"]'))!.uploadFile(file);
  await page.waitForSelector(stage);
  await page
    .waitForSelector('[aria-label="Dismiss cache status"]', { timeout: 10000 })
    .then(() => page.click('[aria-label="Dismiss cache status"]'))
    .catch(() => {});
  await page.click('[aria-label="Annotate"]');
  await clickText("Rectangle");
  await draw([0.15, 0.3], [0.7, 0.5]);
  await page.waitForFunction(() => /1 mark/.test(document.body.innerText));
  await page.focus(stage);
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
    [767, 1024],
    [769, 1024],
    [1279, 720],
    [1281, 720],
    [844, 499],
    [844, 501],
  ];
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    for (const [width, height] of sizes) {
      await page.setViewport({ width, height });
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: width <= 1024 });
      for (const root of [16, 32]) {
        await page.evaluate((size) => {
          document.documentElement.style.fontSize = `${size}px`;
        }, root);
        await page.waitForFunction(() => {
          const p = document.querySelector<HTMLElement>(".editor-paper");
          const img = p?.querySelector("img");
          const o = document.querySelector(".editor-canvas")!.getBoundingClientRect();
          const b = p?.getBoundingClientRect();
          return (
            p &&
            b &&
            b.left >= o.left + 3 &&
            b.right <= o.right - 3 &&
            b.top >= o.top + 3 &&
            b.bottom <= o.bottom - 3 &&
            img &&
            Math.abs(p.clientWidth / p.clientHeight - img.naturalWidth / img.naturalHeight) < 0.01
          );
        });
        await page.evaluate(async () => {
          for (let frame = 0; frame < 3; frame++) await new Promise(requestAnimationFrame);
        });
        await page.keyboard.press("Tab");
        await page.focus(stage);
        const metrics = await page.evaluate(async () => {
          await new Promise(requestAnimationFrame);
          const outer = document.querySelector<HTMLElement>(".editor-canvas")!;
          const paper = document.querySelector<HTMLElement>(".editor-paper")!;
          const image = paper.querySelector("img")!;
          const logo = document.querySelector<HTMLElement>(".editor-topbar .air-page-mark")!;
          const o = outer.getBoundingClientRect(),
            p = paper.getBoundingClientRect();
          const style = getComputedStyle(paper),
            canvas = paper.querySelector("canvas")!,
            ctx = canvas.getContext("2d")!;
          // Selection paints in the light Air accent on white document paper in both appearances.
          const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let blue = 0;
          for (let i = 0; i < pixels.length; i += 4)
            if (
              Math.abs(pixels[i] - 40) <= 2 &&
              Math.abs(pixels[i + 1] - 90) <= 2 &&
              Math.abs(pixels[i + 2] - 215) <= 2 &&
              pixels[i + 3] > 80
            )
              blue++;
          return {
            canvasColor: getComputedStyle(canvas).color,
            scheme: getComputedStyle(canvas).colorScheme,
            overflow: document.documentElement.scrollWidth > innerWidth,
            stageHeight: o.height,
            within:
              p.left >= o.left + 3 &&
              p.right <= o.right - 3 &&
              p.top >= o.top + 3 &&
              p.bottom <= o.bottom - 3,
            aspect: p.width / p.height,
            natural: image.naturalWidth / image.naturalHeight,
            logo: [logo.clientWidth, logo.clientHeight],
            toolbar: document.querySelector(".editor-topbar")!.getBoundingClientRect().height,
            outline: [style.outlineWidth, style.outlineOffset],
            background: getComputedStyle(outer).backgroundColor,
            blue,
          };
        });
        assert.equal(metrics.overflow, false);
        assert.ok(
          metrics.stageHeight >= 64 && metrics.within,
          JSON.stringify({ width, height, root, metrics }),
        );
        assert.ok(Math.abs(metrics.aspect - metrics.natural) < 0.01);
        assert.deepEqual(metrics.logo, [36, 36]);
        if (root === 16) assert.equal(metrics.toolbar, 64);
        assert.deepEqual(metrics.outline, ["2px", "3px"]);
        assert.equal(
          metrics.background,
          theme === "light" ? "rgb(240, 242, 246)" : "rgb(35, 40, 48)",
        );
        assert.ok(
          metrics.blue > 10,
          `Air selection colour missing: ${width}/${theme}/${root} ${JSON.stringify(metrics)}`,
        );
        rows.push({ width, height, root, theme, ...metrics });
        if (root === 16 && [390, 768, 1280, 1440].includes(width))
          await page.screenshot({ path: join(output, `canvas-${width}-${theme}.png`) });
      }
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "16px";
  });
  await clickText("Text");
  await draw([0.15, 0.6], [0.8, 0.8]);
  await page.waitForSelector(field);
  await page.type(field, "An idea in progress");
  const contour = await page.$eval(field, (n) => {
    const s = getComputedStyle(n);
    return [s.borderColor, s.outlineWidth, s.outlineOffset, s.boxShadow, s.backgroundColor];
  });
  assert.deepEqual(contour, ["rgba(0, 0, 0, 0)", "2px", "0px", "none", "rgb(255, 255, 255)"]);
  const nativeCommands = await page.$eval(stage, (n) => {
    const before = (n as HTMLElement).style.transform;
    const prevented = ["Control", "Meta", "Alt"].map((modifier) => {
      const event = new KeyboardEvent("keydown", {
        key: "+",
        bubbles: true,
        cancelable: true,
        ctrlKey: modifier === "Control",
        metaKey: modifier === "Meta",
        altKey: modifier === "Alt",
      });
      n.dispatchEvent(event);
      return event.defaultPrevented;
    });
    return { prevented, unchanged: before === (n as HTMLElement).style.transform };
  });
  assert.deepEqual(nativeCommands, { prevented: [false, false, false], unchanged: true });
  // Synthetic composition checks event ownership, not physical OS IME acceptance.
  await page.$eval(field, (n) => {
    n.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "文" }));
    n.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
        isComposing: true,
      }),
    );
    n.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
        isComposing: true,
      }),
    );
  });
  assert.equal(
    await page.$eval(field, (n) => (n as HTMLInputElement).value),
    "An idea in progress",
  );
  await page.$eval(field, (n) =>
    n.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "文" })),
  );
  await page.keyboard.press("Escape");
  await page.waitForSelector(field, { hidden: true });
  assert.equal(await page.evaluate(() => document.activeElement?.className), "editor-paper");
  assert.match(await page.$eval("body", (n) => n.innerText), /1 mark/);
  // Normal Enter stays multiline; a click outside commits exactly once and keeps its focus.
  await clickText("Text");
  await draw([0.15, 0.6], [0.8, 0.8]);
  await page.waitForSelector(field);
  await page.type(field, "First line");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second line");
  assert.equal(
    await page.$eval(field, (n) => (n as HTMLInputElement).value),
    "First line\nSecond line",
  );
  await page.click('[aria-label="Zoom in"]');
  await page.waitForSelector(field, { hidden: true });
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Zoom in",
  );
  await page.waitForFunction(() => /2 marks/.test(document.body.innerText));
  // Touch editing remains legible when zoomed out, and a long value stays in paper bounds.
  await page.setViewport({ width: 390, height: 844 });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  await page.focus(stage);
  await page.keyboard.press("0");
  await page.keyboard.press("-");
  await page.keyboard.press("-");
  await clickText("Text");
  await draw([0.75, 0.25], [0.95, 0.45]);
  await page.waitForSelector(field);
  await page.type(field, "A long thought that should stay inside its editing area.");
  const inline = await page.$eval(field, (n) => {
    const r = n.getBoundingClientRect(),
      p = n.parentElement!.getBoundingClientRect();
    return {
      font:
        parseFloat(getComputedStyle(n).fontSize) *
        (p.width / (n.parentElement as HTMLElement).offsetWidth),
      within:
        r.left >= p.left - 1 &&
        r.right <= p.right + 1 &&
        r.top >= p.top - 1 &&
        r.bottom <= p.bottom + 1,
    };
  });
  assert.ok(inline.font >= 15.9 && inline.within, JSON.stringify(inline));
  await page.screenshot({ path: join(output, "inline-phone-dark.png") });
  await page.keyboard.press("Escape");
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await page.focus(stage);
  assert.equal(await page.$eval(stage, (n) => getComputedStyle(n).outlineStyle), "solid");
  assert.equal(
    await page.$eval(stage + " > canvas", (n) => getComputedStyle(n).forcedColorAdjust),
    "none",
  );
  assert.deepEqual(errors, []);
  await writeFile(join(output, "canvas.json"), JSON.stringify({ rows, inline, errors }, null, 2));
  console.log(
    `PASS: ${rows.length} canvas layouts; 36px brand; selection colours; composition/focus/multiline/touch editing.`,
  );
} catch (e) {
  await page.screenshot({ path: join(output, "failure.png") }).catch(() => {});
  throw e;
} finally {
  await browser.close();
}
