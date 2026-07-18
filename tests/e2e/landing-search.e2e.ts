/** Landing search refinement checks at the design-system breakpoints. */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function fail(message: string): never {
  throw new Error(message);
}

async function searchGeometry(page: Page) {
  return page.$eval('input[aria-label="Search PDF tools"]', (input) => {
    const rect = input.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
}

async function main() {
  if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH}.`);
  const errors: string[] = [];
  const browser = await launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  try {
    await page.setViewport({ width: 320, height: 800, deviceScaleFactor: 1 });
    await page.goto(DEV_URL, { waitUntil: "networkidle2" });
    for (const width of [320, 375, 414, 768]) {
      await page.setViewport({ width, height: 800, deviceScaleFactor: 1 });
      const selector = 'input[aria-label="Search PDF tools"]';
      await page.waitForSelector(selector);
      await page.$eval(selector, (input) => input.scrollIntoView({ block: "center" }));
      await page.focus(selector);

      const before = await searchGeometry(page);
      await page.type(selector, "r");
      await page.waitForFunction(
        () =>
          Boolean(document.querySelector('[aria-label="Matching PDF tools"]')) ||
          document.body.innerText.includes("No tools found"),
        { timeout: 5_000 },
      );
      const after = await searchGeometry(page);

      if (after.top < 0 || after.bottom > after.viewportHeight) {
        fail(`${width}px: focused search left the viewport (${after.top}–${after.bottom}).`);
      }
      if (Math.abs(after.top - before.top) > 2) {
        fail(`${width}px: search shifted ${Math.round(after.top - before.top)}px on first input.`);
      }
      if (after.scrollWidth > after.viewportWidth + 1) {
        fail(`${width}px: search results introduced horizontal overflow.`);
      }

      const resultCount = await page.$$eval(
        '[aria-label="Matching PDF tools"] > li > button',
        (rows) => rows.length,
      );
      if (resultCount === 0) fail(`${width}px: expected at least one ranked result for “r”.`);

      await page.keyboard.press("Escape");
      const value = await page.$eval(selector, (input) => (input as HTMLInputElement).value);
      if (value !== "") fail(`${width}px: Escape did not clear search.`);
      console.log(`  ✓ ${width}px search stays anchored, ranked, and overflow-free`);
    }

    // Shortcut, singular grammar, and explicit clear target.
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.$eval('input[aria-label="Search PDF tools"]', (input) =>
      input.scrollIntoView({ block: "center" }),
    );
    console.log("  → checking shortcut and singular result copy");
    await page.keyboard.down("Meta");
    await page.keyboard.press("k");
    await page.keyboard.up("Meta");
    const focusedName = await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    );
    if (focusedName !== "Search PDF tools") fail("⌘K did not focus landing search.");

    const selector = 'input[aria-label="Search PDF tools"]';
    await page.type(selector, "compare pdf");
    await page.waitForFunction(
      (inputSelector) =>
        (document.querySelector(inputSelector) as HTMLInputElement | null)?.value === "compare pdf",
      {},
      selector,
    );
    const summary = await page.$eval('[data-testid="tool-search-count"]', (element) =>
      element.textContent?.trim(),
    );
    const desktopResultCount = await page.$$eval(
      '[aria-label="Matching PDF tools"] > li > button',
      (rows) => rows.length,
    );
    const expectedSummary = `${desktopResultCount} matching ${
      desktopResultCount === 1 ? "tool" : "tools"
    }`;
    if (summary !== expectedSummary) {
      fail(`Expected “${expectedSummary}”, got “${summary ?? "missing"}”.`);
    }
    const clearSize = await page.$eval('button[aria-label="Clear search"]', (button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    if (clearSize.width < 44 || clearSize.height < 44) fail("Clear search target is below 44px.");

    const rankedFirst = await page.$eval(
      '[aria-label="Matching PDF tools"] > li:first-child > button',
      (row) => row.textContent?.trim() ?? "",
    );
    if (!rankedFirst.includes("Compare PDFs")) {
      fail(`Expected name-first ranking to lead with Compare PDFs, got “${rankedFirst}”.`);
    }
    const resultListTag = await page.$eval('[aria-label="Matching PDF tools"]', (list) =>
      list.tagName.toLowerCase(),
    );
    if (resultListTag !== "ol") fail("Landing search results are not a semantic ordered list.");
    await page.screenshot({ path: "/tmp/landing-search-refined.png", fullPage: true });

    // Token-aware highlighting should explain a non-contiguous shorthand query.
    await page.click('button[aria-label="Clear search"]');
    await page.type(selector, "page num");
    await page.waitForSelector('[aria-label="Matching PDF tools"] > li');
    const highlightedTokens = await page.$$eval(
      '[aria-label="Matching PDF tools"] > li:first-child mark',
      (marks) => marks.map((mark) => mark.textContent?.toLowerCase()),
    );
    if (!highlightedTokens.includes("page") || !highlightedTokens.includes("num")) {
      fail(`Expected visible highlights for “page num”, got ${highlightedTokens.join(", ")}.`);
    }

    // Empty search has its own recovery action, not only the field affordance.
    await page.click('button[aria-label="Clear search"]');
    await page.type(selector, "definitely-not-a-cloakpdf-tool");
    await page.waitForSelector('[data-testid="empty-tool-search-clear"]');
    await page.click('[data-testid="empty-tool-search-clear"]');
    const recoveredValue = await page.$eval(selector, (input) => (input as HTMLInputElement).value);
    if (recoveredValue !== "") fail("Empty-state Clear search did not restore the toolkit index.");

    // An editor result must acquire a PDF instead of opening a dead empty shell,
    // and the selected tool intent must survive through document load.
    await page.type(selector, "redact");
    await page.waitForSelector('[aria-label="Matching PDF tools"] > li:first-child > button');
    await page.click('[aria-label="Matching PDF tools"] > li:first-child > button');
    await page.waitForFunction(() => document.body.innerText.includes("Open a PDF to continue"));
    const editorDropInput = await page.$('input[aria-label="Drop a PDF here"]');
    if (!editorDropInput) fail("Editor result did not expose the local PDF dropzone.");
    await editorDropInput.uploadFile(resolve("tests/fixtures/sample.pdf"));
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("aside h2")].some(
          (heading) => heading.textContent?.trim() === "Redact",
        ),
      { timeout: 20_000 },
    );

    if (errors.length) fail(`Console errors:\n${errors.join("\n")}`);
    console.log("✓ Landing search refinement passed.");
  } finally {
    await browser.close();
  }
}

void main().catch((error) => {
  console.log(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
