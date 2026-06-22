/**
 * Reusable visual-verification harness: open the editor, activate a tool, and
 * screenshot it on BOTH the desktop right-panel layout and the mobile bottom
 * sheet. Used to eyeball new editor tools/panels during development.
 *
 * Env:
 *   SHOT_TOOL   aria-label of the rail/sheet tool (e.g. "QR / barcode")  [required]
 *   SHOT_NAME   output filename prefix                                    [required]
 *   SHOT_FILL_SELECTOR / SHOT_FILL_TEXT  optional: type text into a field before the shot
 *   SHOT_PRE_CLICK   optional: click a button whose exact text matches this, before the shot
 *
 * Writes /tmp/shots/<name>-desktop.png and /tmp/shots/<name>-mobile.png.
 * Requires Chrome at CHROME_PATH and the dev server at localhost:5173.
 *
 * Run:  SHOT_TOOL="QR / barcode" SHOT_NAME=qr node --experimental-strip-types tests/e2e/shot.ts
 */

import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Browser, Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FIXTURE = resolve(import.meta.dirname, "../fixtures/multipage.pdf");
const OUT_DIR = "/tmp/shots";

const TOOL = process.env.SHOT_TOOL ?? "";
const NAME = process.env.SHOT_NAME ?? "shot";
const FILL_SELECTOR = process.env.SHOT_FILL_SELECTOR ?? "";
const FILL_TEXT = process.env.SHOT_FILL_TEXT ?? "";
const PRE_CLICK = process.env.SHOT_PRE_CLICK ?? "";

function fail(m: string): never {
  console.error(`✗ ${m}`);
  process.exit(1);
}
if (!TOOL) fail("SHOT_TOOL is required.");
if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH}.`);
mkdirSync(OUT_DIR, { recursive: true });

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function clickByText(page: Page, label: string): Promise<boolean> {
  // Prefix match (case-insensitive) so a segmented control whose button carries
  // a sub-label (e.g. "Booklet" + "fold") still resolves from "Booklet".
  return page.evaluate((text) => {
    const els = Array.from(document.querySelectorAll("button, a, [role=button]"));
    const el = els.find((e) =>
      (e.textContent ?? "").trim().toLowerCase().startsWith(text.toLowerCase()),
    );
    if (!el) return false;
    (el as HTMLElement).click();
    return true;
  }, label);
}

async function openEditor(page: Page): Promise<void> {
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
  if (!input) fail("Home dropzone file input not found.");
  await (input as { uploadFile: (...p: string[]) => Promise<void> }).uploadFile(FIXTURE);
  await page.waitForSelector('img[alt="Page 1"]', { timeout: 20_000 });
}

async function fillAndShoot(page: Page, file: string): Promise<void> {
  if (PRE_CLICK) await clickByText(page, PRE_CLICK);
  if (FILL_SELECTOR && FILL_TEXT) {
    await page.waitForSelector(FILL_SELECTOR, { timeout: 8_000 });
    await page.type(FILL_SELECTOR, FILL_TEXT);
  }
  await wait(900); // let previews/layout settle
  await page.screenshot({ path: file });
  console.log(`  → ${file}`);
}

async function shootDesktop(browser: Browser): Promise<string[]> {
  const errors: string[] = [];
  const page = await browser.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e: unknown) => errors.push(String(e instanceof Error ? e.message : e)));
  await page.setViewport({ width: 1280, height: 900 });
  await openEditor(page);
  await page.waitForSelector(`button[aria-label="${TOOL}"]`, { timeout: 10_000 });
  await page.click(`button[aria-label="${TOOL}"]`);
  await wait(500);
  await fillAndShoot(page, `${OUT_DIR}/${NAME}-desktop.png`);
  await page.close();
  return errors;
}

async function shootMobile(browser: Browser): Promise<string[]> {
  const errors: string[] = [];
  const page = await browser.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e: unknown) => errors.push(String(e instanceof Error ? e.message : e)));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await openEditor(page);
  // Open the mobile tool picker, then pick the tool.
  const toggle = await page.$('button[aria-label="Open tools"]');
  if (toggle) {
    await toggle.click();
    await page
      .waitForSelector('button[aria-label="Close tools"]', { timeout: 5_000 })
      .catch(() => {});
  }
  await page.waitForSelector(`button[aria-label="${TOOL}"]`, { timeout: 10_000 });
  await page.click(`button[aria-label="${TOOL}"]`);
  await page.waitForSelector('button[aria-label="Done"]', { timeout: 10_000 });
  await wait(500);
  await fillAndShoot(page, `${OUT_DIR}/${NAME}-mobile.png`);
  await page.close();
  return errors;
}

async function main() {
  const browser = await launch({
    executablePath: CHROME_PATH,
    userDataDir: resolve(import.meta.dirname, "../.puppeteer-profile-shot"),
    headless: true,
  });
  try {
    console.log(`→ Shooting "${TOOL}" → ${NAME}`);
    const e1 = await shootDesktop(browser);
    const e2 = await shootMobile(browser);
    const errors = [...new Set([...e1, ...e2])];
    if (errors.length) {
      console.error("✗ Console/page errors:");
      for (const e of errors) console.error(`   ${e}`);
      process.exitCode = 1;
    } else {
      console.log("✓ Shots captured, no console errors.");
    }
  } finally {
    await browser.close();
  }
}

void main();
