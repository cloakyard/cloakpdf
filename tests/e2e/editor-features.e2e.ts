/**
 * Multi-fixture verification for the editor's place / preview features, run
 * across EVERY PDF in tests/fixtures so the flows are proven on digital,
 * multi-page, and scanned documents alike:
 *   • Signature  — draw on the pad → place → drag a corner to resize (aspect-locked).
 *   • QR code    — type content → place → "Same spot on all N pages" → count == pages.
 *   • Page numbers / Header & footer / Bates — live on-canvas preview (Stage) mounts.
 *   • Auto-fill  — detect blanks (0 is fine on a scan with no text layer).
 * Fails on any console / page error on any fixture.
 *
 * Requirements: Chrome at CHROME_PATH and the dev server at http://localhost:5173.
 *
 * Run:  node --experimental-strip-types tests/e2e/editor-features.e2e.ts
 */

import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FIXTURE_DIR = resolve(import.meta.dirname, "../fixtures");
const USER_DATA_DIR =
  process.env.E2E_USER_DATA_DIR ??
  resolve(import.meta.dirname, "../.puppeteer-profile-editor-feat");

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}
if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH} (set CHROME_PATH).`);

const FIXTURES = readdirSync(FIXTURE_DIR).filter((f) => f.toLowerCase().endsWith(".pdf"));
if (FIXTURES.length === 0) fail("No PDF fixtures found.");

async function pageBox(page: Page) {
  const img = await page.$('img[alt="Page 1"]');
  if (!img) fail("Focus page image not found.");
  const bb = await img.boundingBox();
  if (!bb) fail("Focus page image has no layout box.");
  return bb;
}
async function tapFrac(page: Page, fx: number, fy: number) {
  const bb = await pageBox(page);
  await page.mouse.click(bb.x + bb.width * fx, bb.y + bb.height * fy);
}
async function dragFrac(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const bb = await pageBox(page);
  await page.mouse.move(bb.x + bb.width * from.x, bb.y + bb.height * from.y);
  await page.mouse.down();
  await page.mouse.move(
    bb.x + bb.width * ((from.x + to.x) / 2),
    bb.y + bb.height * ((from.y + to.y) / 2),
    { steps: 6 },
  );
  await page.mouse.move(bb.x + bb.width * to.x, bb.y + bb.height * to.y, { steps: 8 });
  await page.mouse.up();
}
async function waitText(page: Page, re: RegExp, timeout = 30_000) {
  await page.waitForFunction(
    (src: string, flags: string) => new RegExp(src, flags).test(document.body.innerText),
    { timeout },
    re.source,
    re.flags,
  );
}
async function clickByText(page: Page, label: string): Promise<boolean> {
  return page.evaluate((text) => {
    const els = Array.from(document.querySelectorAll("button, a, [role=button]"));
    const el = els.find((e) => (e.textContent ?? "").trim().toLowerCase() === text.toLowerCase());
    if (!el) return false;
    (el as HTMLElement).click();
    return true;
  }, label);
}
async function scribblePad(page: Page) {
  const pad = await page.$('canvas[aria-label^="Signature drawing area"]');
  if (!pad) fail("Signature pad not found.");
  const bb = await pad.boundingBox();
  if (!bb) fail("Signature pad has no box.");
  const cy = bb.y + bb.height / 2;
  await page.mouse.move(bb.x + bb.width * 0.2, cy);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width * 0.5, cy - bb.height * 0.3, { steps: 6 });
  await page.mouse.move(bb.x + bb.width * 0.8, cy, { steps: 6 });
  await page.mouse.up();
}
/** Total page count from the top-bar "1 / N" indicator. */
async function pageCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const m = document.body.innerText.match(/\b1\s*\/\s*(\d+)\b/);
    return m ? parseInt(m[1], 10) : 1;
  });
}

async function runFixture(page: Page, fixture: string, errors: string[]) {
  const path = resolve(FIXTURE_DIR, fixture);
  await page.goto(DEV_URL, { waitUntil: "networkidle2" });
  await page.evaluate(
    () =>
      new Promise<void>((res) => {
        const r = indexedDB.deleteDatabase("cloakpdf-editor");
        r.onsuccess = r.onerror = r.onblocked = () => res();
      }),
  );
  await page.waitForSelector("input[type=file]", { timeout: 15_000 });
  const input = await page.$("input[type=file]");
  await (input as unknown as { uploadFile: (...p: string[]) => Promise<void> }).uploadFile(path);
  await page.waitForSelector('img[alt="Page 1"]', { timeout: 30_000 });
  const pages = await pageCount(page);
  const bb = await pageBox(page);
  const aspect = bb.width / bb.height;

  // 1. Signature: draw → place → corner-resize (aspect-locked).
  await page.click('button[aria-label="Signature"]');
  await waitText(page, /Draw or upload a signature/i, 10_000);
  await scribblePad(page);
  await waitText(page, /Tap the page to place/i, 10_000);
  await tapFrac(page, 0.45, 0.4);
  await waitText(page, /\b1 signature\b/i, 10_000);
  // SE corner of the placed box (default wPct 0.28, aspect from the scribble ~ pad).
  const sw = 0.28;
  const sh = (sw * aspect) / 2.4; // rough; the drag just needs to land on/near the handle
  await dragFrac(
    page,
    { x: 0.45 + sw / 2, y: 0.4 + sh / 2 },
    { x: 0.45 + sw / 2 + 0.1, y: 0.4 + sh / 2 + 0.1 },
  );
  await waitText(page, /\b1 signature\b/i, 5_000);

  // 2. QR: place → same spot on all pages → count == pages.
  await page.click('button[aria-label="QR / barcode"]');
  await waitText(page, /Enter content to place|Tap the page to place the code/i, 10_000);
  await page.type('input[placeholder^="https://example"]', "https://cloakpdf.app/v/1");
  await waitText(page, /Tap the page to place the code/i, 10_000);
  await tapFrac(page, 0.8, 0.12);
  await waitText(page, /\b1 code\b/i, 10_000);
  if (pages > 1) {
    const clicked = await page.evaluate(() => {
      const x = [...document.querySelectorAll("button")].find((e) =>
        /Same spot on all/i.test(e.textContent ?? ""),
      );
      if (x) (x as HTMLElement).click();
      return !!x;
    });
    if (!clicked) fail(`[${fixture}] 'Same spot on all pages' button missing.`);
    await page.waitForFunction(
      (n: number) => {
        const m = document.body.innerText.match(/(\d+)\s+codes?\s+placed/i);
        return m ? parseInt(m[1], 10) === n : false;
      },
      { timeout: 10_000 },
      pages,
    );
  }

  // 3. Stamp previews mount (Stage paints live; assert no error + panel active).
  for (const [label, panelRe] of [
    ["Page numbers", /Add page numbers/i],
    ["Header & footer", /Add header . footer/i],
    ["Bates", /Add Bates numbers/i],
  ] as const) {
    await page.click(`button[aria-label="${label}"]`);
    await waitText(page, panelRe, 10_000);
    await new Promise((r) => setTimeout(r, 200)); // let the Stage paint a frame
  }

  // 4. Auto-fill: detect (0 fields is fine on a scan with no text layer).
  await page.click('button[aria-label="Auto-fill"]');
  await waitText(page, /Detect fields/i, 10_000);
  await clickByText(page, "Detect fields");
  await waitText(page, /fields?\s+·|No blank fields/i, 60_000);

  if (errors.length > 0) {
    console.error(`✗ [${fixture}] console/page errors:`);
    for (const e of errors) console.error(`   ${e}`);
    fail(`Errors on fixture ${fixture}`);
  }
  console.log(`  ✓ ${fixture} (${pages} pages)`);
}

async function main() {
  const browser = await launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  try {
    page.setDefaultTimeout(30_000);
    console.log(`→ Testing ${FIXTURES.length} fixtures: ${FIXTURES.join(", ")}`);
    for (const fixture of FIXTURES) {
      const errors: string[] = [];
      const onConsole = (m: import("puppeteer-core").ConsoleMessage) => {
        if (m.type() === "error") errors.push(m.text());
      };
      const onError = (e: unknown) =>
        errors.push(`pageerror: ${e instanceof Error ? e.message : String(e)}`);
      page.on("console", onConsole);
      page.on("pageerror", onError);
      await runFixture(page, fixture, errors);
      page.off("console", onConsole);
      page.off("pageerror", onError);
    }
    console.log(`✓ editor-features passed on all ${FIXTURES.length} fixtures.`);
  } catch (e) {
    console.error(`✗ Failed: ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

void main();
