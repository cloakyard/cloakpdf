/** Open every registered canvas tool on the shipping mobile and desktop surfaces. */
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
import { detectLayout } from "../../src/editor/breakpoints.ts";
import { EDITOR_TOOLS } from "../../src/editor/tools.ts";
import { createEvidenceDirectory } from "./helpers/evidence-directory.ts";

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
const evidence = createEvidenceDirectory("cloakpdf-canvas-layout");
const fixture = join(evidence, "agreement.pdf");
const pdf = await PDFDocument.create();
for (let number = 1; number <= 7; number++) {
  const page = pdf.addPage([432, 648]);
  page.drawText("Agreement", { x: 30, y: 615 });
  page.drawText("Name and contact information", { x: 30, y: 400 });
  page.drawText("Page " + number, { x: 30, y: 15 });
}
pdf
  .getForm()
  .createTextField("Full name")
  .addToPage(pdf.getPage(0), { x: 30, y: 360, width: 180, height: 24 });
await writeFile(fixture, await pdf.save());

const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  const results = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  const cdp = await page.createCDPSession();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(process.env.E2E_URL ?? "http://127.0.0.1:5173");
  await (await page.waitForSelector("input[type=file]"))!.uploadFile(fixture);
  await page.waitForSelector(".editor-toolrail");
  for (const [width, height] of sizes) {
    await page.setViewport({ width, height });
    await page.waitForFunction(
      (layout) => document.querySelector(".editor-topbar")?.getAttribute("data-layout") === layout,
      {},
      detectLayout(width, height),
    );
    await cdp.send("Emulation.setTouchEmulationEnabled", {
      enabled: width <= 1024,
      maxTouchPoints: 5,
    });
    for (const theme of ["light", "dark"]) {
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: theme },
        { name: "prefers-reduced-motion", value: "reduce" },
      ]);
      for (const root of [16, 32]) {
        await page.evaluate(
          ({ theme, root }) => {
            document.documentElement.dataset.airTheme = theme;
            document.documentElement.style.fontSize = root + "px";
          },
          { theme, root },
        );
        for (const { name } of EDITOR_TOOLS) {
          const issue = await page.evaluate(async (name) => {
            const tick = () => new Promise(requestAnimationFrame);
            const button = (label: string) =>
              Array.from(document.querySelectorAll<HTMLButtonElement>("button[aria-label]")).find(
                (node) =>
                  node.getAttribute("aria-label") === label && node.getBoundingClientRect().width,
              );
            if (!document.querySelector(".editor-toolrail")) {
              button("Back to tools")?.click();
              await tick();
              button("All tools")?.click();
              await tick();
            }
            const action = button(name);
            if (!action) return "Missing tool button";
            action.click();
            const deadline = performance.now() + 3000;
            while (performance.now() < deadline) {
              await tick();
              const title = document.querySelector(
                ".editor-properties__title,.editor-mobile-sheet__header h2",
              );
              const body = document.querySelector(
                '.editor-properties__body,.editor-mobile-sheet__body[aria-label="Tool controls"]',
              );
              if (title?.textContent !== name || !body?.textContent?.trim()) continue;
              await tick();
              if (!body.isConnected || !title.isConnected) continue;
              if (body.scrollWidth > body.clientWidth + 2)
                return "Tool panel overflows horizontally";
              if (document.documentElement.scrollWidth > innerWidth + 1)
                return "Page overflows horizontally";
              const sheet = document.querySelector(".editor-mobile-sheet");
              if (sheet) {
                const preview = sheet.previousElementSibling!.getBoundingClientRect();
                const panel = sheet.getBoundingClientRect();
                if (
                  innerWidth >= 536 &&
                  innerHeight < 500 &&
                  innerWidth > innerHeight &&
                  (preview.right > panel.left + 1 ||
                    preview.width < (preview.width + panel.width) * 0.4 - 1)
                )
                  return "Short landscape must leave the preview beside the controls with at least 40% of the workspace";
                if (Math.min(preview.height, preview.width) < 64 || body.clientHeight < 44)
                  return `Preview ${Math.round(preview.width)}×${Math.round(preview.height)}, controls ${body.clientHeight}px`;
                for (const control of sheet.querySelectorAll<HTMLButtonElement>(
                  ".editor-mobile-sheet__header button",
                )) {
                  const rect = control.getBoundingClientRect();
                  if (
                    rect.width < 44 ||
                    rect.height < 44 ||
                    rect.right > innerWidth + 1 ||
                    rect.bottom > innerHeight + 1
                  )
                    return "Tool action is too small or outside the viewport";
                }
              }
              return null;
            }
            return "Tool controls did not open";
          }, name);
          results.push({ tool: name, width, height, theme, root, issue });
        }
      }
    }
  }
  await writeFile(join(evidence, "canvas-layout.json"), JSON.stringify({ results, errors }));
  assert.deepEqual(errors, []);
  assert.deepEqual(
    results.filter((row) => row.issue),
    [],
  );
  console.log(
    "Verified " + results.length + " canvas layouts across " + EDITOR_TOOLS.length + " tools.",
  );
} finally {
  await browser.close();
}
