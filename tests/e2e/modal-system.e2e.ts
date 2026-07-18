/** Shared modal frame, focus ownership, and responsive geometry checks. */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { KeyInput, Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FIXTURE_PATH = resolve(import.meta.dirname, "../fixtures/multipage.pdf");
const MODAL_SELECTOR = '[role="dialog"][aria-modal="true"]';
const TABBABLE_SELECTOR =
  'a[href]:not([tabindex="-1"]),button:not([disabled]):not([tabindex="-1"]),textarea:not([disabled]):not([tabindex="-1"]),input:not([disabled]):not([tabindex="-1"]),select:not([disabled]):not([tabindex="-1"]),[contenteditable="true"]:not([tabindex="-1"]),[tabindex]:not([tabindex="-1"])';

function fail(message: string): never {
  throw new Error(message);
}

async function pressMeta(page: Page, key: KeyInput): Promise<void> {
  await page.keyboard.down("Meta");
  await page.keyboard.press(key);
  await page.keyboard.up("Meta");
}

async function clickButtonWithText(page: Page, label: string): Promise<void> {
  const buttons = await page.$$("button");
  for (const button of buttons) {
    const state = await button.evaluate((candidate) => ({
      label: (candidate.textContent ?? "").trim(),
      disabled: (candidate as HTMLButtonElement).disabled,
      visible: (candidate as HTMLElement).offsetParent !== null,
    }));
    if (state.label !== label || state.disabled || !state.visible) continue;
    await button.click();
    return;
  }
  fail(`Could not click “${label}”.`);
}

async function assertInViewport(page: Page, selector: string, label: string) {
  const geometry = await page.$eval(selector, (element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: window.innerWidth,
      height: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  if (
    geometry.left < -1 ||
    geometry.top < -1 ||
    geometry.right > geometry.width + 1 ||
    geometry.bottom > geometry.height + 1
  ) {
    fail(`${label} escaped the viewport: ${JSON.stringify(geometry)}`);
  }
  if (geometry.scrollWidth > geometry.width + 1) fail(`${label} caused horizontal overflow.`);
}

async function waitClosed(page: Page): Promise<void> {
  await page.waitForFunction(
    (selector) => document.querySelectorAll(selector).length === 0,
    { timeout: 5_000 },
    MODAL_SELECTOR,
  );
}

async function assertModalReleased(
  page: Page,
  overflowBefore: string,
  label: string,
): Promise<void> {
  const state = await page.evaluate(() => ({
    inert: (document.getElementById("app") as HTMLElement | null)?.inert ?? false,
    overflow: document.body.style.overflow,
  }));
  if (state.inert || state.overflow !== overflowBefore) {
    fail(`${label} left modal state behind: ${JSON.stringify(state)}.`);
  }
}

async function focusBoundaryIndex(page: Page, selector: string, edge: "first" | "last") {
  return page.$eval(
    selector,
    (dialog, tabbableSelector, requestedEdge) => {
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(tabbableSelector)).filter(
        (element) =>
          (element.offsetParent !== null || element === document.activeElement) &&
          !element.closest("[inert]") &&
          !element.closest('[aria-hidden="true"]'),
      );
      const target = requestedEdge === "first" ? nodes[0] : nodes[nodes.length - 1];
      target?.focus();
      return { count: nodes.length, active: nodes.indexOf(document.activeElement as HTMLElement) };
    },
    TABBABLE_SELECTOR,
    edge,
  );
}

async function activeBoundaryIndex(page: Page, selector: string) {
  return page.$eval(
    selector,
    (dialog, tabbableSelector) => {
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(tabbableSelector)).filter(
        (element) =>
          (element.offsetParent !== null || element === document.activeElement) &&
          !element.closest("[inert]") &&
          !element.closest('[aria-hidden="true"]'),
      );
      return { count: nodes.length, active: nodes.indexOf(document.activeElement as HTMLElement) };
    },
    TABBABLE_SELECTOR,
  );
}

async function main() {
  if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH}.`);
  if (!existsSync(FIXTURE_PATH)) fail(`Fixture not found at ${FIXTURE_PATH}.`);
  const errors: string[] = [];
  const browser = await launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  try {
    await page.goto(DEV_URL, { waitUntil: "networkidle2" });
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) fail("Home PDF input not found.");
    await (fileInput as { uploadFile: (...paths: string[]) => Promise<void> }).uploadFile(
      FIXTURE_PATH,
    );
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 20_000 });
    const overflowBefore = await page.evaluate(() => document.body.style.overflow);
    const appWasInert = await page.evaluate(
      () => (document.getElementById("app") as HTMLElement | null)?.inert ?? false,
    );
    if (appWasInert) fail("Editor started inert before any modal opened.");

    // Desktop trigger path proves focus restoration and suspends any body-level
    // disclosure that was open before the true modal took ownership.
    const railTrigger = 'button[aria-label="Search tools"]';
    await page.evaluate(() => {
      const popover = document.createElement("div");
      popover.id = "modal-system-popover-probe";
      popover.className = "cloak-popover";
      popover.textContent = "Popover probe";
      document.body.append(popover);
      document.addEventListener(
        "cloakpdf:modal-open",
        () => {
          document.body.dataset.modalOpenEventReceived = "true";
        },
        { once: true },
      );
    });
    await page.click(railTrigger);
    await page.waitForSelector('[data-testid="command-palette"]');
    await page.waitForFunction(() => {
      const probe = document.getElementById("modal-system-popover-probe") as HTMLElement | null;
      return (
        probe?.hidden &&
        probe.inert &&
        probe.getAttribute("aria-hidden") === "true" &&
        document.body.dataset.modalOpenEventReceived === "true"
      );
    });
    const initialPaletteFocus = await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    );
    if (initialPaletteFocus !== "Search tools and actions") {
      fail(`Palette initial focus was ${initialPaletteFocus ?? "missing"}.`);
    }
    const closeSize = await page.$eval('button[aria-label="Close command palette"]', (button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    if (closeSize.width < 43.5 || closeSize.height < 43.5) {
      fail(`Palette close target is ${closeSize.width}×${closeSize.height}px.`);
    }
    await page.click('button[aria-label="Close command palette"]');
    await waitClosed(page);
    await assertModalReleased(page, overflowBefore, "Desktop palette close");
    const restoredToRail = await page.evaluate(
      (selector) => document.activeElement === document.querySelector(selector),
      railTrigger,
    );
    if (!restoredToRail) fail("Palette did not restore focus to its rail trigger.");
    const popoverRestored = await page.evaluate(() => {
      const probe = document.getElementById("modal-system-popover-probe") as HTMLElement | null;
      if (!probe) return false;
      const restored = !probe.hidden && !probe.inert && !probe.hasAttribute("aria-hidden");
      probe.remove();
      delete document.body.dataset.modalOpenEventReceived;
      return restored;
    });
    if (!popoverRestored) fail("Body-level popover was not restored after the modal closed.");

    // Force the real palette opener programmatically while Export is active to
    // exercise the shared stack. User ⌘K remains suppressed below; this path is
    // deliberately test-only so registration order, layering, and ref counts run.
    await page.click('button[aria-label="Export"]');
    await page.waitForSelector('[data-testid="export-dialog"]');
    await page.focus('[data-testid="export-dialog"] button[role="switch"][aria-label="Compress"]');
    await page.$eval(
      '[data-testid="export-dialog"] [role="radio"][aria-label^="Markdown"]',
      (radio) => (radio as HTMLButtonElement).click(),
    );
    await page.waitForFunction(() => {
      const focused = document.activeElement;
      return (
        focused?.getAttribute("role") === "radio" &&
        focused.getAttribute("aria-checked") === "true" &&
        focused.getAttribute("aria-label")?.startsWith("Markdown")
      );
    });
    // Restore the default export state before exercising the nested layer.
    await page.keyboard.press("Home");
    const forcedPalette = await page.evaluate((selector) => {
      const trigger = document.querySelector(selector);
      return trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }, railTrigger);
    if (forcedPalette === undefined) fail("Could not resolve the palette trigger for stack test.");
    await page.waitForSelector('[data-testid="command-palette"]');
    const stackState = await page.evaluate(() => {
      const exportDialog = document.querySelector('[data-testid="export-dialog"]');
      const paletteDialog = document.querySelector('[data-testid="command-palette"]');
      const exportRoot = exportDialog?.closest<HTMLElement>('[data-cloak-modal-root="true"]');
      const paletteRoot = paletteDialog?.closest<HTMLElement>('[data-cloak-modal-root="true"]');
      return {
        count: document.querySelectorAll('[role="dialog"][aria-modal="true"]').length,
        exportInert: exportRoot?.inert,
        exportHidden: exportRoot?.getAttribute("aria-hidden"),
        exportLayer: Number.parseFloat(exportRoot ? getComputedStyle(exportRoot).zIndex : "NaN"),
        paletteInert: paletteRoot?.inert,
        paletteHidden: paletteRoot?.getAttribute("aria-hidden"),
        paletteLayer: Number.parseFloat(paletteRoot ? getComputedStyle(paletteRoot).zIndex : "NaN"),
        focusInPalette: Boolean(document.activeElement?.closest('[data-testid="command-palette"]')),
        appInert: (document.getElementById("app") as HTMLElement | null)?.inert,
        overflow: document.body.style.overflow,
      };
    });
    if (
      stackState.count !== 2 ||
      !stackState.exportInert ||
      stackState.exportHidden !== "true" ||
      stackState.paletteInert ||
      stackState.paletteHidden !== null ||
      !stackState.focusInPalette ||
      !stackState.appInert ||
      stackState.overflow !== "hidden" ||
      !(stackState.paletteLayer > stackState.exportLayer)
    ) {
      fail(`Nested modal ownership was invalid: ${JSON.stringify(stackState)}.`);
    }
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector('[data-testid="command-palette"]'));
    const revealedExport = await page.evaluate(() => {
      const dialog = document.querySelector('[data-testid="export-dialog"]');
      const root = dialog?.closest<HTMLElement>('[data-cloak-modal-root="true"]');
      return {
        count: document.querySelectorAll('[role="dialog"][aria-modal="true"]').length,
        inert: root?.inert,
        hidden: root?.getAttribute("aria-hidden"),
        focusInside: Boolean(document.activeElement?.closest('[data-testid="export-dialog"]')),
        appInert: (document.getElementById("app") as HTMLElement | null)?.inert,
        overflow: document.body.style.overflow,
      };
    });
    if (
      revealedExport.count !== 1 ||
      revealedExport.inert ||
      revealedExport.hidden !== null ||
      !revealedExport.focusInside ||
      !revealedExport.appInert ||
      revealedExport.overflow !== "hidden"
    ) {
      fail(
        `Closing the top layer did not restore Export ownership: ${JSON.stringify(revealedExport)}.`,
      );
    }
    await page.keyboard.press("Escape");
    await waitClosed(page);
    await assertModalReleased(page, overflowBefore, "Nested modal close");

    for (const width of [320, 375, 414, 768, 1280]) {
      await page.setViewport({ width, height: width < 768 ? 760 : 900, deviceScaleFactor: 1 });

      await pressMeta(page, "k");
      await page.waitForSelector('[data-testid="command-palette"]');
      await new Promise((resolve) => setTimeout(resolve, 300));
      await assertInViewport(page, '[data-testid="command-palette"]', `${width}px palette`);
      const modalState = await page.evaluate(() => ({
        count: document.querySelectorAll('[role="dialog"][aria-modal="true"]').length,
        inert: (document.getElementById("app") as HTMLElement | null)?.inert,
        overflow: document.body.style.overflow,
      }));
      if (modalState.count !== 1 || !modalState.inert || modalState.overflow !== "hidden") {
        fail(`${width}px palette did not own modal state: ${JSON.stringify(modalState)}`);
      }
      await page.keyboard.press("Escape");
      await waitClosed(page);
      await assertModalReleased(page, overflowBefore, `${width}px palette close`);

      await page.click('button[aria-label="Export"]');
      await page.waitForSelector('[data-testid="export-dialog"]');
      await new Promise((resolve) => setTimeout(resolve, 300));
      await assertInViewport(page, '[data-testid="export-dialog"]', `${width}px export`);
      const exportFocus = await page.evaluate(() => ({
        role: document.activeElement?.getAttribute("role"),
        checked: document.activeElement?.getAttribute("aria-checked"),
      }));
      if (exportFocus.role !== "radio" || exportFocus.checked !== "true") {
        fail(`${width}px export did not focus its selected format.`);
      }

      await page.keyboard.press("Home");
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-testid="export-dialog"] [role="radio"]')
            ?.getAttribute("aria-checked") === "true",
      );
      if (width === 1280) await page.screenshot({ path: "/tmp/export-modal-refined.png" });

      // Global ⌘K must be suppressed while Export owns the modal layer.
      await pressMeta(page, "k");
      const stacked = await page.$$eval('[role="dialog"][aria-modal="true"]', (dialogs) =>
        dialogs.map((dialog) => dialog.textContent?.slice(0, 80)),
      );
      if (stacked.length !== 1 || !stacked[0]?.includes("Export document")) {
        fail(`${width}px: Command Palette stacked over Export.`);
      }

      await page.keyboard.press("End");
      const selectedFormat = await page.$eval(
        '[data-testid="export-dialog"] [role="radio"][aria-checked="true"]',
        (radio) => radio.textContent,
      );
      if (!selectedFormat?.includes("Markdown"))
        fail("Export End key did not select the last format.");

      // Assert both focus-loop boundaries using the actual visible tab sequence.
      const lastBoundary = await focusBoundaryIndex(page, '[data-testid="export-dialog"]', "last");
      if (lastBoundary.count < 2 || lastBoundary.active !== lastBoundary.count - 1) {
        fail(
          `${width}px: Could not focus Export's final tab stop: ${JSON.stringify(lastBoundary)}.`,
        );
      }
      await page.keyboard.press("Tab");
      const wrappedForward = await activeBoundaryIndex(page, '[data-testid="export-dialog"]');
      if (wrappedForward.active !== 0) {
        fail(`${width}px: Tab did not wrap last → first: ${JSON.stringify(wrappedForward)}.`);
      }
      await page.keyboard.down("Shift");
      await page.keyboard.press("Tab");
      await page.keyboard.up("Shift");
      const wrappedBackward = await activeBoundaryIndex(page, '[data-testid="export-dialog"]');
      if (wrappedBackward.active !== wrappedBackward.count - 1) {
        fail(
          `${width}px: Shift+Tab did not wrap first → last: ${JSON.stringify(wrappedBackward)}.`,
        );
      }

      await page.keyboard.press("Escape");
      await waitClosed(page);
      await assertModalReleased(page, overflowBefore, `${width}px export close`);
      const exportRestored = await page.evaluate(
        () => document.activeElement === document.querySelector('button[aria-label="Export"]'),
      );
      if (!exportRestored) fail(`${width}px: Export did not restore trigger focus.`);
      console.log(`  ✓ ${width}px palette/export bounds, focus, and single-stack ownership`);
    }

    // A fresh browser profile reaches the pre-download AI gate without model
    // network traffic. Audit both information and consent dialogs in their real
    // caller, including initial focus, responsive bounds, and focus restore.
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.goto(DEV_URL, { waitUntil: "networkidle2" });
    const homeOverflow = await page.evaluate(() => document.body.style.overflow);
    const askOpened = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll("h3")).find((candidate) =>
        candidate.textContent?.includes("Ask your PDF"),
      );
      const button = heading?.closest("button");
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    });
    if (!askOpened) fail("Could not open Ask PDF for the AI modal audit.");
    await page.waitForFunction(() => /download ai models?/i.test(document.body.innerText));

    await clickButtonWithText(page, "View details");
    await page.waitForSelector('[data-testid="ai-model-details-dialog"]');
    await assertInViewport(page, '[data-testid="ai-model-details-dialog"]', "AI model details");
    const detailsFocus = await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    );
    if (detailsFocus !== "Close")
      fail(`AI details initial focus was ${detailsFocus ?? "missing"}.`);
    await page.click('[data-testid="ai-model-details-dialog"] button[aria-label="Close"]');
    await waitClosed(page);
    await assertModalReleased(page, homeOverflow, "AI model details close");
    const detailsRestored = await page.evaluate(
      () => document.activeElement?.textContent?.trim() === "View details",
    );
    if (!detailsRestored) fail("AI model details did not restore its trigger focus.");

    await clickButtonWithText(page, "Download model");
    await page.waitForSelector('[data-testid="ai-consent-dialog"]');
    await assertInViewport(page, '[data-testid="ai-consent-dialog"]', "AI consent");
    const consentState = await page.evaluate(() => ({
      focus: document.activeElement?.textContent?.trim(),
      dialogs: document.querySelectorAll('[role="dialog"][aria-modal="true"]').length,
      inert: (document.getElementById("app") as HTMLElement | null)?.inert,
      overflow: document.body.style.overflow,
    }));
    if (
      consentState.focus !== "Cancel" ||
      consentState.dialogs !== 1 ||
      !consentState.inert ||
      consentState.overflow !== "hidden"
    ) {
      fail(`AI consent did not own focus/state: ${JSON.stringify(consentState)}.`);
    }
    await page.keyboard.press("Escape");
    const consentStayedOpen = await page.$('[data-testid="ai-consent-dialog"]');
    if (!consentStayedOpen) fail("Escape dismissed the active AI download dialog.");
    await clickButtonWithText(page, "Cancel");
    await waitClosed(page);
    await assertModalReleased(page, homeOverflow, "AI consent close");
    console.log("  ✓ AI details and consent dialogs share modal ownership");

    // OrientationLock is a non-dismissible system modal. Emulate a coarse
    // landscape phone, enter a standalone tool, then rotate to portrait and
    // prove focus/inert/scroll ownership is released automatically.
    await page.setViewport({
      width: 844,
      height: 390,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    await page.goto(DEV_URL, { waitUntil: "networkidle2" });
    const coarse = await page.evaluate(() => window.matchMedia("(pointer: coarse)").matches);
    if (!coarse) fail("Phone emulation did not expose a coarse pointer.");
    const mergeOpened = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll("h3")).find((candidate) =>
        candidate.textContent?.includes("Merge PDFs"),
      );
      const button = heading?.closest("button");
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    });
    if (!mergeOpened) fail("Could not open Merge PDFs for OrientationLock audit.");
    await page.waitForSelector('[aria-labelledby="orientation-lock-title"]');
    const orientationState = await page.evaluate(() => {
      const dialog = document.querySelector<HTMLElement>(
        '[aria-labelledby="orientation-lock-title"]',
      );
      return {
        focused: document.activeElement === dialog,
        inert: (document.getElementById("app") as HTMLElement | null)?.inert,
        overflow: document.body.style.overflow,
      };
    });
    if (
      !orientationState.focused ||
      !orientationState.inert ||
      orientationState.overflow !== "hidden"
    ) {
      fail(`OrientationLock did not own system-modal state: ${JSON.stringify(orientationState)}.`);
    }
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    });
    await page.waitForFunction(
      () => !document.querySelector('[aria-labelledby="orientation-lock-title"]'),
    );
    await assertModalReleased(page, homeOverflow, "OrientationLock portrait release");
    console.log("  ✓ OrientationLock owns landscape focus and releases in portrait");

    if (errors.length) fail(`Console errors:\n${errors.join("\n")}`);
    console.log("✓ Shared modal system passed.");
  } finally {
    await browser.close();
  }
}

void main().catch((error) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
