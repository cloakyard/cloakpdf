/** Actual anchored select placement, keyboard selection and Escape across Air layouts. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");

const out = process.env.AIR_EVIDENCE_DIR || "/tmp/cloakpdf-air-selects";
await mkdir(out, { recursive: true });
const rows = [],
  errors = [];
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
for (const engine of ["chromium", "webkit"]) {
  const browser = await (engine === "webkit"
    ? webkit.launch()
    : chromium.launch({
        executablePath:
          process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      }));
  try {
    for (const [width, height] of sizes)
      for (const theme of ["light", "dark"]) {
        const page = await browser.newPage({
          viewport: { width, height },
          hasTouch: width < 1100,
          colorScheme: theme,
          reducedMotion: "reduce",
          serviceWorkers: "block",
        });
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(process.env.BASE_URL || "http://127.0.0.1:8521");
        await page
          .locator("input[type=file]")
          .first()
          .setInputFiles(new URL("../tests/fixtures/multipage.pdf", import.meta.url).pathname);
        await page.getByRole("button", { name: "Export", exact: true }).waitFor();
        await page.locator(".editor-toolrail,.editor-mobile-sheet").first().waitFor();
        const rail = page.locator(".editor-toolrail");
        if (await rail.count())
          await rail.getByRole("button", { name: "N-up", exact: true }).click();
        else {
          await page.getByRole("button", { name: "Open tools", exact: true }).click();
          await page
            .locator(".editor-mobile-sheet")
            .getByRole("button", { name: "N-up", exact: true })
            .click();
        }
        const trigger = page.getByRole("combobox", { name: "Layout", exact: true });
        await page.mouse.move(0, 0);
        await trigger.focus();
        const before = await trigger.textContent();
        await page.keyboard.press("ArrowDown");
        const menu = page.getByRole("listbox");
        await menu.waitFor();
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        const t = await trigger.boundingBox(),
          m = await menu.boundingBox();
        const gap = m.y >= t.y + t.height ? m.y - t.y - t.height : t.y - m.y - m.height;
        assert(Math.abs(gap - 8) < 1, `${engine} ${width} ${theme}: gap ${gap}`);
        assert(
          m.x >= 15 && m.x + m.width <= width - 15 && m.y >= 15 && m.y + m.height <= height - 15,
          "Menu must remain inside the viewport",
        );
        await page.screenshot({ path: `${out}/${engine}-${width}-${theme}.png` });
        await page.keyboard.press("Home");
        await page.waitForFunction(() =>
          document
            .querySelector('[role="option"][data-highlighted]')
            ?.textContent.includes("side by side"),
        );
        await page.keyboard.press("ArrowDown");
        await page.waitForFunction(() =>
          document
            .querySelector('[role="option"][data-highlighted]')
            ?.textContent.includes("stacked"),
        );
        await page.keyboard.press("Enter");
        await menu.waitFor({ state: "hidden" });
        assert.notEqual(
          await trigger.textContent(),
          before,
          "Keyboard selection updates the value",
        );
        const selected = await trigger.textContent();
        await page.keyboard.press("ArrowDown");
        await menu.waitFor();
        await page.keyboard.press("Escape");
        await menu.waitFor({ state: "hidden" });
        assert.equal(await trigger.textContent(), selected, "Escape preserves selection");
        assert(
          await trigger.evaluate((e) => document.activeElement === e),
          "Focus returns to trigger",
        );
        rows.push({ engine, width, height, theme, gap, selected });
        await page.close();
      }
  } finally {
    await browser.close();
    await writeFile(`${out}/results.json`, JSON.stringify({ rows, errors }, null, 2));
  }
}
assert.deepEqual(errors, []);
console.log(`${rows.length} select layouts and keyboard journeys passed`);
