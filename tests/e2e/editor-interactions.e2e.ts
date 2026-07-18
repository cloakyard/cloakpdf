/**
 * Focused keyboard regression for the persistent editor stage:
 *   annotate rectangle → focus canvas → Arrow nudges only the annotation →
 *   one undo reverts the full nudge burst → Delete removes it → with no
 *   selected content, Arrow pans, + zooms, and 0 resets the viewport.
 *
 * Requirements: Chrome at CHROME_PATH and `vp dev` at E2E_URL (5173 by default).
 * Fixture: tests/fixtures/multipage.pdf.
 *
 * Run: node --experimental-strip-types tests/e2e/editor-interactions.e2e.ts
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { KeyInput, Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FIXTURE_PATH = resolve(import.meta.dirname, "../fixtures/multipage.pdf");
const USER_DATA_DIR =
  process.env.E2E_USER_DATA_DIR ??
  resolve(import.meta.dirname, "../.puppeteer-profile-editor-interactions");
const STAGE = 'div[role="region"][aria-label^="Page 1 editing canvas"]';
const OVERLAY = `${STAGE} > canvas[aria-hidden="true"]`;

interface OverlayBounds {
  minX: number;
  maxX: number;
}

interface ViewTransform {
  panX: number;
  panY: number;
  zoom: number;
}

function fail(message: string): never {
  throw new Error(message);
}

if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH} (set CHROME_PATH).`);
if (!existsSync(FIXTURE_PATH)) fail(`Fixture not found at ${FIXTURE_PATH}.`);

async function clickByText(page: Page, label: string): Promise<boolean> {
  return page.evaluate((text) => {
    const elements = Array.from(document.querySelectorAll("button, a, [role=button]"));
    const element = elements.find(
      (candidate) =>
        (candidate.textContent ?? "").trim().toLowerCase() === text.trim().toLowerCase(),
    );
    if (!element) return false;
    (element as HTMLElement).click();
    return true;
  }, label);
}

async function waitForText(page: Page, pattern: RegExp, timeout = 10_000): Promise<void> {
  await page.waitForFunction(
    (source: string, flags: string) => new RegExp(source, flags).test(document.body.innerText),
    { timeout },
    pattern.source,
    pattern.flags,
  );
}

async function pageBox(
  page: Page,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const image = await page.$('img[alt="Page 1"]');
  if (!image) fail("Focused page image not found.");
  const box = await image.boundingBox();
  if (!box) fail("Focused page image has no layout box.");
  return box;
}

async function drawRect(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Promise<void> {
  const box = await pageBox(page);
  const x1 = box.x + box.width * from.x;
  const y1 = box.y + box.height * from.y;
  const x2 = box.x + box.width * to.x;
  const y2 = box.y + box.height * to.y;
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move(x2, y2, { steps: 10 });
  await page.mouse.up();
}

async function readOverlayBounds(page: Page): Promise<OverlayBounds | null> {
  return page.$eval(OVERLAY, (node) => {
    const canvas = node as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    if (!context || canvas.width === 0 || canvas.height === 0) return null;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width;
    let maxX = -1;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] === 0) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
    return maxX >= 0 ? { minX, maxX } : null;
  });
}

async function readView(page: Page): Promise<ViewTransform> {
  return page.$eval(STAGE, (node) => {
    const raw = (node as HTMLElement).style.transform;
    const match = raw.match(/^translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)\s+scale\((-?[\d.]+)\)$/);
    if (!match) throw new Error(`Unexpected stage transform: ${raw}`);
    return { panX: Number(match[1]), panY: Number(match[2]), zoom: Number(match[3]) };
  });
}

async function waitUntil<T>(
  read: () => Promise<T>,
  predicate: (value: T) => boolean,
  label: string,
  timeout = 8_000,
): Promise<T> {
  const deadline = Date.now() + timeout;
  let lastValue: T | undefined;
  while (Date.now() < deadline) {
    const value = await read();
    lastValue = value;
    if (predicate(value)) return value;
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }
  fail(`Timed out waiting for ${label}; last value: ${JSON.stringify(lastValue)}.`);
}

async function pressMeta(page: Page, key: KeyInput, shift = false): Promise<void> {
  await page.keyboard.down("Meta");
  if (shift) await page.keyboard.down("Shift");
  await page.keyboard.press(key);
  if (shift) await page.keyboard.up("Shift");
  await page.keyboard.up("Meta");
}

function sameView(a: ViewTransform, b: ViewTransform): boolean {
  return a.panX === b.panX && a.panY === b.panY && a.zoom === b.zoom;
}

async function main(): Promise<void> {
  const errors: string[] = [];
  const browser = await launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();

  try {
    page.setDefaultTimeout(20_000);
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error: unknown) =>
      errors.push(`pageerror: ${error instanceof Error ? error.message : String(error)}`),
    );

    await page.goto(DEV_URL, { waitUntil: "networkidle2" });
    await page.evaluate(
      () =>
        new Promise<void>((resolveDelete) => {
          const request = indexedDB.deleteDatabase("cloakpdf-editor");
          request.onsuccess = request.onerror = request.onblocked = () => resolveDelete();
        }),
    );
    await page.waitForSelector("input[type=file]", { timeout: 15_000 });
    const input = await page.$("input[type=file]");
    if (!input) fail("Home PDF input not found.");
    await (input as unknown as { uploadFile: (...paths: string[]) => Promise<void> }).uploadFile(
      FIXTURE_PATH,
    );
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 20_000 });

    await page.click('button[aria-label="Annotate"]');
    await waitForText(page, /Apply annotations/i);
    if (!(await clickByText(page, "Rectangle"))) fail("Rectangle annotation tool not found.");
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll('button[aria-pressed="true"]')).some(
        (button) => (button.textContent ?? "").trim() === "Rectangle",
      ),
    );
    await drawRect(page, { x: 0.25, y: 0.3 }, { x: 0.55, y: 0.5 });
    await waitForText(page, /\b1 mark\b/i);
    await waitForText(page, /Mark selected/i);

    await page.focus(STAGE);
    const focused = await page.$eval(STAGE, (node) => document.activeElement === node);
    if (!focused) fail("Editing canvas did not accept keyboard focus.");
    const shortcuts = await page.$eval(
      STAGE,
      (node) => node.getAttribute("aria-keyshortcuts") ?? "",
    );
    if (!shortcuts.includes("Delete") || !shortcuts.includes("Backspace"))
      fail(`Selected-annotation shortcuts are not exposed accessibly: ${shortcuts}`);

    const initialBounds = await readOverlayBounds(page);
    if (!initialBounds) fail("Selected annotation did not paint on the overlay.");
    const fixedView = await readView(page);

    // A burst of content Arrow keys moves only the selected mark. Waiting past
    // the debounce then undoing once must restore the entire burst.
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const movedBounds = await waitUntil(
      () => readOverlayBounds(page),
      (bounds) => bounds != null && bounds.minX > initialBounds.minX + 1,
      "annotation Arrow nudge",
    );
    await new Promise((resolveWait) => setTimeout(resolveWait, 450));
    const viewAfterNudge = await readView(page);
    if (!sameView(viewAfterNudge, fixedView))
      fail(`Annotation Arrow also changed the viewport: ${JSON.stringify(viewAfterNudge)}`);

    await pressMeta(page, "z");
    await waitUntil(
      () => readOverlayBounds(page),
      (bounds) => bounds?.minX === initialBounds.minX && bounds.maxX === initialBounds.maxX,
      "coalesced nudge undo",
    );
    await pressMeta(page, "z", true);
    await waitUntil(
      () => readOverlayBounds(page),
      (bounds) =>
        bounds != null &&
        movedBounds != null &&
        bounds.minX === movedBounds.minX &&
        bounds.maxX === movedBounds.maxX,
      "coalesced nudge redo",
    );
    if (!sameView(await readView(page), fixedView)) fail("Undo/redo changed the viewport.");
    console.log("  ✓ annotation Arrow keys nudge without panning; burst is one undo step");

    await page.keyboard.press("Delete");
    await waitForText(page, /\b0 marks\b/i);
    await page.waitForFunction(
      (selector) =>
        !(document.querySelector(selector)?.getAttribute("aria-keyshortcuts") ?? "").includes(
          "Delete",
        ),
      {},
      STAGE,
    );
    console.log("  ✓ Delete removes the selected annotation from the focused canvas");

    // No selected content claims the keys now, so the stage's ordinary view
    // shortcuts take over again.
    await page.focus(STAGE);
    const resetView = await readView(page);
    await page.keyboard.press("ArrowRight");
    const pannedView = await waitUntil(
      () => readView(page),
      (view) => view.panX > resetView.panX,
      "viewport Arrow pan",
    );
    await page.keyboard.down("Shift");
    await page.keyboard.press("=");
    await page.keyboard.up("Shift");
    const zoomedView = await waitUntil(
      () => readView(page),
      (view) => view.zoom > pannedView.zoom,
      "viewport + zoom",
    );
    if (zoomedView.panX !== pannedView.panX) fail("Zoom unexpectedly changed the viewport pan.");
    await page.keyboard.press("0");
    const finalView = await waitUntil(
      () => readView(page),
      (view) => view.panX === 0 && view.panY === 0 && view.zoom === 1,
      "viewport reset",
    );
    if (!sameView(finalView, { panX: 0, panY: 0, zoom: 1 })) fail("Viewport did not reset.");
    console.log("  ✓ unhandled Arrow pans; + zooms; 0 resets the viewport");

    // Shared disclosure controls: Metadata's date picker keeps a valid
    // trigger→popover relationship and a single roving calendar tab stop even
    // when day 31 is carried into a shorter month.
    await page.click('button[aria-label="Metadata"]');
    await waitForText(page, /Edit the document properties/i);
    const dateTrigger = 'aside button[aria-haspopup="dialog"]';
    const controlledId = await page.$eval(dateTrigger, (button) =>
      button.getAttribute("aria-controls"),
    );
    if (!controlledId) fail("Date/time trigger does not expose aria-controls.");
    await page.click(dateTrigger);
    const dateDialog = 'div[role="dialog"][aria-label="Date and time picker"]';
    await page.waitForSelector(dateDialog);
    const openedId = await page.$eval(dateDialog, (dialog) => dialog.id);
    if (openedId !== controlledId)
      fail(`Date/time aria-controls points to ${controlledId}, not ${openedId}.`);

    if (!(await clickByText(page, "Clear"))) fail("Date/time Clear action not found.");
    await page.waitForSelector(dateDialog, { hidden: true });
    await page.click(dateTrigger);
    const unsetPeriods = await page.$$eval(`${dateDialog} button`, (buttons) =>
      buttons
        .filter((button) => ["AM", "PM"].includes((button.textContent ?? "").trim()))
        .map((button) => button.getAttribute("aria-pressed")),
    );
    if (unsetPeriods.length !== 2 || unsetPeriods.some((pressed) => pressed !== "false")) {
      fail(`Unset date/time exposes a selected period: ${JSON.stringify(unsetPeriods)}.`);
    }
    if (!(await clickByText(page, "Now"))) fail("Date/time Now action not found.");

    const thirtyOneBeforeShorter = new Set(["January", "March", "May", "August", "October"]);
    let foundTransition = false;
    for (let attempts = 0; attempts < 12; attempts++) {
      const state = await page.$eval(dateDialog, (dialog) => {
        const table = dialog.querySelector("table[aria-label]");
        const month = (table?.getAttribute("aria-label") ?? "").split(" ")[0];
        const day31 = dialog.querySelector<HTMLButtonElement>(
          'button[data-day="31"]:not(:disabled)',
        );
        const next = dialog.querySelector<HTMLButtonElement>('button[aria-label="Next month"]');
        return { month, has31: Boolean(day31), canGoNext: Boolean(next && !next.disabled) };
      });
      if (state.has31 && state.canGoNext && thirtyOneBeforeShorter.has(state.month)) {
        foundTransition = true;
        break;
      }
      await page.click(`${dateDialog} button[aria-label="Previous month"]`);
    }
    if (!foundTransition) fail("Could not find a past 31-day → shorter-month calendar transition.");
    await page.click(`${dateDialog} button[data-day="31"]`);
    await page.click(`${dateDialog} button[aria-label="Next month"]`);
    const calendarTabStops = await page.$$eval(
      `${dateDialog} button[data-day][tabindex="0"]:not(:disabled)`,
      (buttons) => buttons.map((button) => button.getAttribute("data-day")),
    );
    if (calendarTabStops.length !== 1 || Number(calendarTabStops[0]) > 30) {
      fail(`Calendar lost its clamped roving tab stop: ${JSON.stringify(calendarTabStops)}.`);
    }
    if (!(await clickByText(page, "Done"))) fail("Date/time Done action not found.");
    console.log("  ✓ date/time disclosure semantics and shorter-month focus clamp");

    // The custom colour field is a non-modal disclosure with two independent
    // native values, so keyboard/screen-reader users can adjust both axes.
    await page.click('button[aria-label="Signature"]');
    await waitForText(page, /Draw or upload a signature/i);
    const colorTrigger = 'button[aria-label^="Custom color"]';
    await page.click(colorTrigger);
    const colorDialog = 'div[role="dialog"][aria-label="Custom color picker"]';
    await page.waitForSelector(colorDialog);
    const colorControls = await page.$eval(colorTrigger, (button) =>
      button.getAttribute("aria-controls"),
    );
    const colorDialogId = await page.$eval(colorDialog, (dialog) => dialog.id);
    if (!colorControls || colorControls !== colorDialogId) {
      fail(`Custom colour aria-controls points to ${colorControls}, not ${colorDialogId}.`);
    }
    const axes = await page.$$eval(`${colorDialog} input[type="range"]`, (inputs) =>
      inputs.map((input) => input.getAttribute("aria-label")),
    );
    if (!axes.includes("Saturation") || !axes.includes("Brightness")) {
      fail(`Custom colour field does not expose both axes: ${JSON.stringify(axes)}.`);
    }
    const saturation = `${colorDialog} input[aria-label="Saturation"]`;
    await page.focus(saturation);
    const saturationBefore = await page.$eval(saturation, (input) =>
      Number((input as HTMLInputElement).value),
    );
    await page.keyboard.press("ArrowRight");
    const saturationAfter = await page.$eval(saturation, (input) =>
      Number((input as HTMLInputElement).value),
    );
    if (saturationAfter <= saturationBefore)
      fail("Saturation slider did not respond to ArrowRight.");
    await page.keyboard.press("Tab");
    const focusedAxis = await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    );
    if (focusedAxis !== "Brightness") fail(`Tab moved to ${focusedAxis}, not Brightness.`);
    await page.keyboard.press("Escape");
    await page.waitForSelector(colorDialog, { hidden: true });
    const colorFocusRestored = await page.$eval(
      colorTrigger,
      (button) => document.activeElement === button,
    );
    if (!colorFocusRestored) fail("Custom colour picker did not return focus to its trigger.");
    console.log("  ✓ custom colour exposes independent saturation and brightness controls");

    if (errors.length > 0) fail(`Console/page errors:\n${errors.join("\n")}`);
    console.log("✓ editor keyboard interactions passed");
  } finally {
    await browser.close();
  }
}

void main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
