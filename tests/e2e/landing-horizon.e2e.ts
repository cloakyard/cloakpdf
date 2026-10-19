/** Production landing artwork, fallbacks and workspace teardown. */
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { launch } from "puppeteer-core";
import { createEvidenceDirectory } from "./helpers/evidence-directory.ts";

const output = createEvidenceDirectory("cloakpdf-air-horizon");
const url = process.env.E2E_URL ?? "http://127.0.0.1:8155";
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: process.env.E2E_HEADED !== "1",
});
const layouts: unknown[] = [];
const lifecycle: unknown[] = [];
const errors: string[] = [];
try {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.goto(url, { waitUntil: "networkidle0" });
  for (const [width, height] of [
    [320, 568],
    [375, 812],
    [390, 844],
    [430, 932],
    [639, 800],
    [640, 800],
    [641, 800],
    [768, 1024],
    [959, 768],
    [960, 768],
    [961, 768],
    [1024, 768],
    [1280, 720],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
    [844, 390],
  ]) {
    await page.setViewport({ width, height, hasTouch: width <= 1024 });
    for (const theme of ["light", "dark"]) {
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: theme },
        { name: "prefers-reduced-motion", value: "reduce" },
      ]);
      for (const text of [16, 32]) {
        const state = await page.evaluate(async (size) => {
          document.documentElement.style.fontSize = `${size}px`;
          await document.fonts.ready;
          await new Promise(requestAnimationFrame);
          const field = document.querySelector<HTMLElement>(".pdf-horizon")!;
          const box = field.getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            contained: box.left >= 0 && box.right <= innerWidth + 1,
            artworkHeight: box.height,
            fallback: getComputedStyle(field.querySelector("svg")!).visibility,
            canvas: getComputedStyle(field.querySelector("canvas")!).visibility,
            state: field.dataset.lightState,
            hiddenFromAssistive: field.getAttribute("aria-hidden"),
          };
        }, text);
        assert.equal(state.overflow, false, JSON.stringify({ width, height, theme, text, state }));
        assert.equal(state.contained, true);
        assert.equal(state.fallback, "visible");
        assert.equal(state.canvas, "hidden");
        assert.equal(state.state, "reduced");
        assert.equal(state.hiddenFromAssistive, "true");
        if (height === 390) assert.equal(state.artworkHeight, 64);
        layouts.push({ width, height, theme, text, ...state });
        if (text === 16 && [390, 1280, 1440].includes(width))
          await page.screenshot({
            path: resolve(output, `home-${width}-${theme}.png`),
            fullPage: true,
          });
      }
    }
  }
  assert.ok(
    !requests.some((r) => r.includes("air-light-shader")),
    "Reduced-motion/install must not fetch the shader",
  );
  await context.close();

  // The normal capable profile must actually render; separate contexts verify
  // static restrictions before any optional renderer has been requested.
  for (const mode of ["normal", "unsupported", "constrained", "save-data", "forced"] as const) {
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    const fetched: string[] = [];
    p.on("request", (r) => fetched.push(r.url()));
    p.on("pageerror", (e) => errors.push(String(e)));
    await p.setViewport({ width: 1440, height: 900 });
    if (mode === "unsupported")
      await p.evaluateOnNewDocument(() =>
        Object.defineProperty(navigator, "gpu", { value: undefined }),
      );
    if (mode === "constrained")
      await p.evaluateOnNewDocument(() =>
        Object.defineProperty(navigator, "deviceMemory", { value: 4 }),
      );
    if (mode === "save-data")
      await p.evaluateOnNewDocument(() =>
        Object.defineProperty(navigator, "connection", {
          value: { saveData: true, addEventListener() {}, removeEventListener() {} },
        }),
      );
    const cdp = await p.createCDPSession();
    if (mode === "forced")
      await cdp.send("Emulation.setEmulatedMedia", {
        features: [{ name: "forced-colors", value: "active" }],
      });
    await p.goto(url, { waitUntil: "networkidle0" });
    await p.waitForFunction(
      () =>
        ["idle", "unsupported", "constrained", "failed", "forced"].includes(
          document.querySelector<HTMLElement>(".pdf-horizon")!.dataset.lightState!,
        ),
      { timeout: 15_000 },
    );
    const state = await p.$eval(".pdf-horizon", (e) =>
      Object.fromEntries(Object.entries((e as HTMLElement).dataset)),
    );
    if (mode === "normal") {
      assert.equal(
        state.lightState,
        "idle",
        `Real GPU renderer must run: ${JSON.stringify(state)}`,
      );
      assert.equal(state.lightReady, "true");
      assert.ok(Number(state.lightFrames) > 0);
      await new Promise((r) => setTimeout(r, 400));
      assert.equal(
        await p.$eval(".pdf-horizon", (e) => (e as HTMLElement).dataset.lightFrames),
        state.lightFrames,
        "No idle frames",
      );
      await p.mouse.move(1100, 200);
      await p.waitForFunction(
        (before) =>
          Number(document.querySelector<HTMLElement>(".pdf-horizon")!.dataset.lightFrames) >
          Number(before),
        {},
        state.lightFrames,
      );
      await p.waitForFunction(
        () => document.querySelector<HTMLElement>(".pdf-horizon")!.dataset.lightState === "idle",
      );
      await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
      await p.waitForFunction(
        () => document.querySelector<HTMLElement>(".pdf-horizon")!.dataset.lightState === "idle",
      );
      await p.screenshot({ path: resolve(output, "live-dark.png") });
      await p.evaluate(() => scrollTo(0, document.body.scrollHeight));
      await p.waitForFunction(
        () =>
          document.querySelector<HTMLElement>(".pdf-horizon")!.dataset.lightState === "offscreen",
      );
      assert.equal(
        await p.$eval(".pdf-horizon", (e) => (e as HTMLElement).dataset.lightReady),
        undefined,
      );
      await p.evaluate(() => scrollTo(0, 0));
      await p.waitForFunction(
        () => document.querySelector<HTMLElement>(".pdf-horizon")!.dataset.lightState === "idle",
      );
      await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await p.waitForFunction(
        () => document.querySelector<HTMLElement>(".pdf-horizon")!.dataset.lightState === "reduced",
      );
      await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
      await p.waitForFunction(
        () => document.querySelector<HTMLElement>(".pdf-horizon")!.dataset.lightState === "idle",
      );
      const fileInput = await p.waitForSelector('input[type="file"]');
      assert.ok(fileInput);
      await fileInput.uploadFile(resolve(import.meta.dirname, "../fixtures/demo/single.pdf"));
      await p.waitForSelector('img[alt="Page 1"]');
      assert.equal(await p.$(".pdf-horizon"), null, "Editor must unmount the renderer");
      await p.click('[aria-label="Back to home"]');
      await p.waitForSelector(".pdf-horizon");
      await p.locator("button::-p-text(Merge PDFs)").click();
      await p.waitForSelector('[aria-label="Files to combine"], input[type=file][multiple]');
      assert.equal(
        await p.$(".pdf-horizon"),
        null,
        "Standalone workspace must unmount the renderer",
      );
    } else {
      assert.equal(state.lightState, mode === "save-data" ? "constrained" : mode);
      assert.ok(
        !fetched.some((r) => r.includes("air-light-shader")),
        `${mode} must not fetch the renderer`,
      );
    }
    lifecycle.push({ mode, ...state });
    await ctx.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(output, "results.json"),
    JSON.stringify({ layouts, lifecycle, errors }, null, 2),
  );
  console.log(
    `PASS: ${layouts.length} responsive/theme/text layouts; real GPU arrival, pointer response, idle/offscreen/reduced cleanup, editor/standalone teardown and all static fallbacks.`,
  );
} finally {
  await browser.close();
}
