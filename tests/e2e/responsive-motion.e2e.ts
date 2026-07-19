/**
 * Responsive motion contract for the landing page, editor panels, and modals.
 *
 * Covers fine-pointer desktop, coarse-pointer tablet portrait/landscape,
 * phone portrait at 390px and 320px, and phone landscape. The assertions keep
 * decorative motion paint-only, preserve the mobile editor's 50:50 geometry,
 * avoid touch-only hover residue, and verify the reduced-motion fallback.
 *
 * Run: node --experimental-strip-types tests/e2e/responsive-motion.e2e.ts
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FIXTURE_PATH = resolve(import.meta.dirname, "../fixtures/multipage.pdf");

type ExpectedLayout = "desktop" | "tablet" | "mobile";

interface ViewportCase {
  name: string;
  width: number;
  height: number;
  touch: boolean;
  layout: ExpectedLayout;
}

const VIEWPORTS: ViewportCase[] = [
  { name: "desktop", width: 1440, height: 900, touch: false, layout: "desktop" },
  { name: "tablet landscape", width: 1024, height: 768, touch: true, layout: "tablet" },
  { name: "tablet portrait", width: 768, height: 1024, touch: true, layout: "tablet" },
  { name: "mobile", width: 390, height: 844, touch: true, layout: "mobile" },
  { name: "small mobile", width: 320, height: 568, touch: true, layout: "mobile" },
  { name: "mobile landscape", width: 844, height: 390, touch: true, layout: "mobile" },
];

function fail(message: string): never {
  throw new Error(message);
}

function closeTo(actual: number, expected: number, tolerance = 0.75): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

function matrixScale(transform: string): number {
  if (transform === "none") return 1;
  const match = transform.match(/^matrix\(([^,]+)/);
  return match ? Number(match[1]) : Number.NaN;
}

function attachErrorCapture(page: Page, errors: string[]) {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));
}

async function setViewport(page: Page, viewport: ViewportCase) {
  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    hasTouch: viewport.touch,
    isMobile: viewport.touch,
    deviceScaleFactor: 1,
  });
}

async function openHome(page: Page) {
  await page.goto(DEV_URL, { waitUntil: "networkidle2" });
  await page.waitForSelector(".cloak-tool-card", { timeout: 15_000 });
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
}

async function auditHome(page: Page, viewport: ViewportCase) {
  await openHome(page);
  const state = await page.evaluate(() => {
    const status = getComputedStyle(document.querySelector(".cloak-status-dot") as Element);
    const card = getComputedStyle(document.querySelector(".cloak-tool-card") as Element);
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      hover: window.matchMedia("(hover: hover)").matches,
      coarse: window.matchMedia("(pointer: coarse)").matches,
      cardTransform: card.transform,
      statusAnimation: status.animationName,
      statusIterations: status.animationIterationCount,
      hero: Array.from(document.querySelectorAll(".cloak-hero > *")).map((element) => {
        const style = getComputedStyle(element);
        return { opacity: style.opacity, transform: style.transform };
      }),
    };
  });

  if (state.overflow > 1) fail(`${viewport.name}: home motion caused horizontal overflow.`);
  if (state.hover === viewport.touch || state.coarse !== viewport.touch) {
    fail(`${viewport.name}: pointer media did not match the audit input mode.`);
  }
  if (state.cardTransform !== "none") {
    fail(`${viewport.name}: a resting tool card retained ${state.cardTransform}.`);
  }
  if (state.statusAnimation !== "cloak-status-arrive" || state.statusIterations !== "1") {
    fail(`${viewport.name}: connection status must animate once, never loop.`);
  }
  if (state.hero.some(({ opacity, transform }) => opacity !== "1" || transform !== "none")) {
    fail(`${viewport.name}: hero did not settle to its stable resting state.`);
  }

  if (!viewport.touch) {
    await page.$eval(".cloak-tool-card", (element) =>
      element.scrollIntoView({ block: "center", behavior: "auto" }),
    );
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
    const before = await page.$eval(".cloak-tool-card", (element) =>
      element.getBoundingClientRect().toJSON(),
    );
    await page.hover(".cloak-tool-card");
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 220));
    const hovered = await page.$eval(".cloak-tool-card", (element) => {
      const card = getComputedStyle(element);
      const icon = getComputedStyle(element.querySelector(".cloak-tool-card__icon") as Element);
      const arrow = getComputedStyle(element.querySelector(".cloak-tool-card__arrow") as Element);
      return {
        rect: element.getBoundingClientRect().toJSON(),
        card: card.transform,
        icon: icon.transform,
        arrow: arrow.transform,
      };
    });
    if (!closeTo(hovered.rect.top, before.top - 2)) {
      fail(`${viewport.name}: tool-card hover lift was not the intended 2px.`);
    }
    if (hovered.card === "none" || hovered.icon === "none" || hovered.arrow === "none") {
      fail(`${viewport.name}: fine-pointer card feedback did not fully engage.`);
    }
  }
}

async function clearDraftStore(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolveDelete) => {
        const request = indexedDB.deleteDatabase("cloakpdf-editor");
        request.onsuccess = request.onerror = request.onblocked = () => resolveDelete();
      }),
  );
}

async function openEditor(page: Page) {
  await openHome(page);
  await clearDraftStore(page);
  const input = await page.$('input[type="file"]');
  if (!input) fail("Home PDF input was not available.");
  await (input as { uploadFile: (...paths: string[]) => Promise<void> }).uploadFile(FIXTURE_PATH);
  await page.waitForSelector('img[alt="Page 1"]', { timeout: 20_000 });
}

async function panelState(page: Page) {
  return page.evaluate(() => {
    const panel = document.querySelector(".cloak-panel-enter") as HTMLElement | null;
    const sheet = document.querySelector('[data-testid="mobile-tool-sheet"]') as HTMLElement | null;
    const column = sheet?.parentElement as HTMLElement | null;
    const properties = document.querySelector(".editor-properties") as HTMLElement | null;
    const style = panel ? getComputedStyle(panel) : null;
    return {
      animation: style?.animationName ?? "",
      duration: style?.animationDuration ?? "",
      opacity: style?.opacity ?? "",
      transform: style?.transform ?? "none",
      sheetFraction:
        sheet && column
          ? sheet.getBoundingClientRect().height / column.getBoundingClientRect().height
          : null,
      properties: properties?.getBoundingClientRect().toJSON() ?? null,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
}

async function auditEditor(page: Page, viewport: ViewportCase) {
  await openEditor(page);
  const shell = await page.evaluate(() => ({
    rail: Boolean(document.querySelector('nav[aria-label="Editor tools"]')),
    sheet: Boolean(document.querySelector('[data-testid="mobile-tool-sheet"]')),
    properties: Boolean(document.querySelector(".editor-properties")),
  }));
  const shouldUseSheet = viewport.layout === "mobile";
  if (
    shell.sheet !== shouldUseSheet ||
    shell.rail === shouldUseSheet ||
    shell.properties === shouldUseSheet
  ) {
    fail(`${viewport.name}: editor resolved to the wrong responsive shell.`);
  }

  if (shouldUseSheet) {
    await page.click('button[aria-label="Open tools"]');
    await page.waitForSelector('button[aria-label="Crop"]');
  }
  const propertiesBefore = shouldUseSheet
    ? null
    : await page.$eval(".editor-properties", (element) => element.getBoundingClientRect().toJSON());
  await page.click('button[aria-label="Crop"]');

  const opening = await panelState(page);
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 300));
  const settled = await panelState(page);
  if (opening.overflow > 1 || settled.overflow > 1) {
    fail(`${viewport.name}: tool-panel motion caused horizontal overflow.`);
  }

  if (viewport.touch) {
    if (opening.animation !== "cloak-panel-enter-touch" || opening.duration !== "0.22s") {
      fail(`${viewport.name}: coarse-pointer panel did not use the compact motion profile.`);
    }
    if (!closeTo(matrixScale(opening.transform), 1, 0.001)) {
      fail(`${viewport.name}: touch panel scaled text during its entrance.`);
    }
  } else if (opening.animation !== "cloak-panel-enter" || opening.duration !== "0.26s") {
    fail(`${viewport.name}: desktop panel did not use the full motion profile.`);
  }

  // CSS animations may retain an identity matrix under `animation-fill-mode:
  // both`; `none` and an identity matrix are both stable resting states.
  const settledScale = matrixScale(settled.transform);
  if (settled.opacity !== "1" || !closeTo(settledScale, 1, 0.001)) {
    fail(`${viewport.name}: tool panel did not settle cleanly.`);
  }

  if (shouldUseSheet) {
    for (const [label, fraction] of [
      ["opening", opening.sheetFraction],
      ["settled", settled.sheetFraction],
    ] as const) {
      if (fraction === null || fraction < 0.49 || fraction > 0.51) {
        fail(`${viewport.name}: ${label} sheet was not an exact 50:50 split.`);
      }
    }
  } else if (
    !propertiesBefore ||
    !opening.properties ||
    !settled.properties ||
    !closeTo(opening.properties.width, propertiesBefore.width, 0.01) ||
    !closeTo(opening.properties.height, propertiesBefore.height, 0.01) ||
    !closeTo(settled.properties.width, propertiesBefore.width, 0.01) ||
    !closeTo(settled.properties.height, propertiesBefore.height, 0.01)
  ) {
    fail(`${viewport.name}: properties-panel geometry changed during its animation.`);
  }

  // Full-width mobile sheets should translate from the bottom edge rather than
  // scale inward and briefly expose side gutters.
  if (viewport.name === "mobile") {
    await page.click('button[aria-label="Cancel"]');
    await page.waitForSelector('button[aria-label="Open tools"]');
    await page.click('button[aria-label="Export"]');
    await page.waitForSelector('[data-testid="export-dialog"]');
    const modal = await page.$eval('[data-testid="export-dialog"]', (element) => {
      const rect = element.getBoundingClientRect();
      return {
        transform: getComputedStyle(element).transform,
        left: rect.left,
        right: rect.right,
        width: window.innerWidth,
      };
    });
    if (
      !closeTo(matrixScale(modal.transform), 1, 0.001) ||
      !closeTo(modal.left, 0, 0.75) ||
      !closeTo(modal.right, modal.width, 0.75)
    ) {
      fail("mobile: export sheet scaled away from its anchored viewport edges.");
    }
  }
}

async function auditReducedMotion(page: Page) {
  await page.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await openHome(page);
  const home = await page.evaluate(() => {
    const status = getComputedStyle(document.querySelector(".cloak-status-dot") as Element);
    const icon = getComputedStyle(document.querySelector(".cloak-tool-card__icon") as Element);
    return {
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      statusAnimation: status.animationName,
      iconTransition: icon.transitionDuration,
      iconTransform: icon.transform,
    };
  });
  if (
    !home.reduced ||
    home.statusAnimation !== "none" ||
    home.iconTransition !== "0s" ||
    home.iconTransform !== "none"
  ) {
    fail("Reduced-motion home retained decorative animation.");
  }

  await clearDraftStore(page);
  const input = await page.$('input[type="file"]');
  if (!input) fail("Reduced-motion PDF input was not available.");
  await (input as { uploadFile: (...paths: string[]) => Promise<void> }).uploadFile(FIXTURE_PATH);
  await page.waitForSelector('img[alt="Page 1"]', { timeout: 20_000 });
  await page.click('button[aria-label="Open tools"]');
  await page.click('button[aria-label="Crop"]');
  const panel = await panelState(page);
  if (panel.animation !== "none" || panel.transform !== "none" || panel.opacity !== "1") {
    fail("Reduced-motion editor retained decorative panel motion.");
  }
}

async function main() {
  if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH}.`);
  if (!existsSync(FIXTURE_PATH)) fail(`Fixture not found at ${FIXTURE_PATH}.`);

  const browser = await launch({ executablePath: CHROME_PATH, headless: true });
  const errors: string[] = [];
  try {
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage();
      attachErrorCapture(page, errors);
      await setViewport(page, viewport);
      await auditHome(page, viewport);
      await page.close();
      console.log(`  ✓ ${viewport.name} landing motion`);
    }

    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage();
      attachErrorCapture(page, errors);
      await setViewport(page, viewport);
      await auditEditor(page, viewport);
      await page.close();
      console.log(`  ✓ ${viewport.name} editor motion`);
    }

    const reducedPage = await browser.newPage();
    attachErrorCapture(reducedPage, errors);
    await auditReducedMotion(reducedPage);
    await reducedPage.close();
    console.log("  ✓ reduced-motion profile");

    if (errors.length > 0) fail(`Runtime errors:\n${errors.join("\n")}`);
    console.log(
      "✓ Responsive motion audit passed — desktop, tablet portrait/landscape, mobile portrait/landscape, 320px, modal anchoring, and reduced motion.",
    );
  } finally {
    await browser.close();
  }
}

await main();
