/**
 * End-to-end smoke for the editor-first home routing.
 *
 * Two behaviours the home now owns:
 *   1. The home drop zone opens the canvas editor with the dropped PDF
 *      (drop a PDF on "Drop a PDF to start editing" → editor → page renders).
 *   2. The multi-file constructors hand their output to the editor:
 *      Merge → drop 2 PDFs → "Merge 2 files & edit" → editor opens on the result.
 *
 * Requirements: Chrome at CHROME_PATH and the dev server at http://localhost:5173.
 * Run:  node --experimental-strip-types tests/e2e/home-routing.ts
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FIXTURE_A = resolve(import.meta.dirname, "../fixtures/sample.pdf");
const FIXTURE_B = resolve(import.meta.dirname, "../fixtures/multipage.pdf");

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH} (set CHROME_PATH).`);
if (!existsSync(FIXTURE_A) || !existsSync(FIXTURE_B)) fail("Fixtures missing.");

/** Click the first card/button whose heading or text equals `label`. */
async function clickByText(page: Page, label: string): Promise<boolean> {
  return page.evaluate((text) => {
    const els = Array.from(document.querySelectorAll("button, a, [role=button]"));
    const el = els.find((e) => {
      const head = e.querySelector("h3")?.textContent ?? e.textContent ?? "";
      return head.trim().toLowerCase() === text.toLowerCase();
    });
    if (!el) return false;
    (el as HTMLElement).click();
    return true;
  }, label);
}

async function uploadInto(page: Page, ...fixtures: string[]): Promise<void> {
  // Multi-file uploads target the tool's `multiple` input directly: during the
  // view transition the home's single hero input can still be mounted (mid
  // exit), so a bare `input[type=file]` may resolve to the wrong one.
  const sel = fixtures.length > 1 ? "input[type=file][multiple]" : "input[type=file]";
  await page.waitForSelector(sel, { timeout: 15_000 });
  const input = await page.$(sel);
  if (!input) fail("File input not found.");
  await (input as { uploadFile: (...p: string[]) => Promise<void> }).uploadFile(...fixtures);
}

async function main() {
  const errors: string[] = [];
  const browser = await launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  try {
    page.setDefaultTimeout(30_000);
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e: unknown) =>
      errors.push(`pageerror: ${e instanceof Error ? e.message : String(e)}`),
    );

    console.log(`→ Loading ${DEV_URL}`);
    await page.goto(DEV_URL, { waitUntil: "networkidle2" });

    // 1. Editor-first entry: dropping a PDF on the home drop zone opens the
    //    canvas editor on that file (the focus page renders). The home page's
    //    only file input is the hero drop zone.
    await uploadInto(page, FIXTURE_A);
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 30_000 });
    console.log("  ✓ home drop zone → editor (focus page rendered)");

    // 2. Constructor hand-off: back home, merge two PDFs, land in the editor.
    await page.goto(DEV_URL, { waitUntil: "networkidle2" });
    if (!(await clickByText(page, "Merge PDFs"))) fail("'Merge PDFs' tool card not found.");
    await uploadInto(page, FIXTURE_A, FIXTURE_B);
    // The secondary "Merge & edit" button is the one that hands off to the
    // editor (the primary "Merge … & Download" just downloads).
    await page
      .waitForFunction(
        () =>
          Array.from(document.querySelectorAll("button")).some((b) =>
            (b.textContent ?? "").includes("Merge & edit"),
          ),
        { timeout: 15_000 },
      )
      .catch(() => fail("'Merge & edit' button did not appear after dropping 2 PDFs."));
    const clicked = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) =>
        (x.textContent ?? "").includes("Merge & edit"),
      );
      if (!b) return false;
      (b as HTMLElement).click();
      return true;
    });
    if (!clicked) fail("Merge action button vanished before click.");
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 30_000 });
    console.log("  ✓ merge → editor hand-off (focus page rendered)");

    if (errors.length > 0) {
      console.error("✗ Console/page errors during home routing:");
      for (const e of errors) console.error(`   ${e}`);
      process.exit(1);
    }
    console.log("✓ Home routing smoke passed — editor-card preselect + constructor hand-off.");
  } catch (e) {
    console.error(`✗ Home routing smoke failed: ${e instanceof Error ? e.message : String(e)}`);
    try {
      await page.screenshot({ path: "/tmp/home-routing-fail.png" });
      console.error("screenshot → /tmp/home-routing-fail.png");
    } catch {
      /* ignore */
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

void main();
