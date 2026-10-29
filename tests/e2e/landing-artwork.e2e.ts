/** Production paper unveiling: layout, lifecycle and real file-entry regression. */
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { launch } from "puppeteer-core";
import { createEvidenceDirectory } from "./helpers/evidence-directory.ts";

const output = createEvidenceDirectory("cloakpdf-air-artwork");
const url = process.env.E2E_URL ?? "http://127.0.0.1:8155";
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: process.env.E2E_HEADED !== "1",
});
const layouts: unknown[] = [];
const lifecycle: string[] = [];
const errors: string[] = [];
try {
  const page = await browser.newPage();
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
          const root = document.querySelector<HTMLElement>(".pdf-page-stack")!;
          const sheets = [...root.querySelectorAll<HTMLElement>(".pdf-page-stack-sheet")];
          return {
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            contained: sheets.every((sheet) => {
              const b = sheet.getBoundingClientRect();
              return b.left >= 0 && b.right <= innerWidth + 1;
            }),
            count: sheets.length,
            state: root.dataset.artState,
            hidden: root.querySelector(".pdf-page-stack-board")!.getAttribute("aria-hidden"),
            replayHidden: root.querySelector<HTMLButtonElement>(".air-artwork-replay")!.hidden,
            animations: root.getAnimations({ subtree: true }).length,
            paperInk: getComputedStyle(root.querySelector(".pdf-page-stack-front")!).color,
            input: Boolean(document.querySelector("input[type=file]:not(:disabled)")),
          };
        }, text);
        assert.equal(state.overflow, false, JSON.stringify({ width, height, theme, text, state }));
        assert.equal(state.contained, true);
        assert.equal(state.count, 5);
        assert.equal(state.state, "reduced");
        assert.equal(state.hidden, "true");
        assert.equal(state.replayHidden, true);
        assert.equal(state.animations, 0);
        assert.equal(
          state.paperInk,
          "rgb(32, 35, 41)",
          "White paper keeps readable dark ink in both themes",
        );
        assert.equal(state.input, true);
        layouts.push({ width, height, theme, text, ...state });
        if (text === 16 && [320, 390, 1280, 1440].includes(width))
          await page.screenshot({
            path: resolve(output, `home-${width}-${theme}.png`),
            fullPage: true,
          });
      }
    }
  }
  await page.close();
  for (const mode of ["normal", "unsupported", "constrained", "save-data", "forced"] as const) {
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(String(e)));
    await p.setViewport({ width: 1440, height: 1000 });
    await p.evaluateOnNewDocument(() => {
      // Isolate artwork geometry from the asynchronous first-cache notice.
      // Real worker/update behavior is covered by the dedicated PWA suites.
      Object.defineProperty(navigator, "serviceWorker", { value: undefined });
      Object.defineProperty(navigator, "hardwareConcurrency", { value: 8, configurable: true });
      Object.defineProperty(navigator, "deviceMemory", { value: 8, configurable: true });
    });
    if (mode === "unsupported")
      await p.evaluateOnNewDocument(() => {
        Element.prototype.animate = undefined as unknown as typeof Element.prototype.animate;
      });
    if (mode === "constrained")
      await p.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "deviceMemory", { value: 4 });
      });
    if (mode === "save-data")
      await p.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "connection", { value: { saveData: true } });
      });
    if (mode === "forced") {
      const cdp = await p.createCDPSession();
      await cdp.send("Emulation.setEmulatedMedia", {
        features: [{ name: "forced-colors", value: "active" }],
      });
    }
    await p.goto(url, { waitUntil: "domcontentloaded" });
    await p.waitForSelector(".pdf-page-stack");
    if (mode === "normal") {
      await p.waitForFunction(
        () =>
          document.querySelector<HTMLElement>(".pdf-page-stack")!.dataset.artState === "playing",
      );
      const geometry = () =>
        p.evaluate(() =>
          [".pdf-page-stack-front", "#workbench"].map((s) => {
            const b = document.querySelector(s)!.getBoundingClientRect();
            return { x: b.x, y: b.y, width: b.width, height: b.height };
          }),
        );
      const before = await geometry();
      await p.screenshot({ path: resolve(output, "unveiling.png") });
      await p.evaluate(() => scrollTo(0, document.body.scrollHeight));
      await p.waitForFunction(
        () =>
          document.querySelector<HTMLElement>(".pdf-page-stack")!.dataset.artState === "offscreen",
      );
      assert.equal(
        await p.$eval(".pdf-page-stack", (e) =>
          e.getAnimations({ subtree: true }).every((a) => a.playState === "paused"),
        ),
        true,
      );
      await p.evaluate(() => scrollTo(0, 0));
      await p.evaluate(() =>
        dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })),
      );
      await p.waitForFunction(
        () => document.querySelector<HTMLElement>(".pdf-page-stack")!.dataset.artState === "hidden",
      );
      await p.evaluate(() =>
        dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })),
      );
      await p.waitForFunction(
        () =>
          document.querySelector<HTMLElement>(".pdf-page-stack")!.dataset.artState === "complete",
      );
      assert.deepEqual(await geometry(), before, "Front sheet and real entry must remain anchored");
      assert.equal(
        await p.$eval(".pdf-page-stack", (e) => e.getAnimations({ subtree: true }).length),
        0,
        "Finite animation releases all effects",
      );
      await p.reload({ waitUntil: "domcontentloaded" });
      await p.waitForSelector(".pdf-page-stack");
      const detached = await p.$(".pdf-page-stack");
      const file = await p.waitForSelector('input[type="file"]');
      await file!.uploadFile(resolve(import.meta.dirname, "../fixtures/demo/single.pdf"));
      await p.waitForSelector('img[alt="Page 1"]');
      assert.equal(await p.$(".pdf-page-stack"), null);
      assert.equal(await detached!.evaluate((e) => e.getAnimations({ subtree: true }).length), 0);
      await p.click('[aria-label="Back to home"]');
      await p.waitForSelector(".pdf-page-stack");
      await p.locator("button::-p-text(Merge PDFs)").click();
      await p.waitForSelector("input[type=file][multiple]");
      assert.equal(await p.$(".pdf-page-stack"), null);
      lifecycle.push(
        "finite unveil; fixed front/entry/order; offscreen pause; pagehide/pageshow; real file entry; workspace cleanup",
      );
    } else {
      await p.waitForFunction(
        (expected) =>
          document.querySelector<HTMLElement>(".pdf-page-stack")!.dataset.artState === expected,
        {},
        mode,
      );
      assert.equal(
        await p.$eval(".pdf-page-stack", (e) => e.getAnimations({ subtree: true }).length),
        0,
      );
      lifecycle.push(mode);
    }
    await ctx.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(output, "results.json"),
    JSON.stringify({ layouts, lifecycle, errors }, null, 2),
  );
  console.log(
    `PASS: ${layouts.length} layouts, finite unveiling, lifecycle/fallbacks and real file entry.`,
  );
} finally {
  await browser.close();
}
