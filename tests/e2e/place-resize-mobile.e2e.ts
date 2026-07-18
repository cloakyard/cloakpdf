/**
 * Mobile (bottom-sheet) visual verification for the place-then-drag-resize UX:
 * signature and QR placement + corner-resize with touch, at a phone viewport.
 * Confirms the panels read in the 40%-capped sheet, the signature Size slider is
 * gone, placement + resize work, and apply runs via the global ✓. Screenshots to
 * /tmp for review; fails on any console / page error.
 *
 * Run:  node --experimental-strip-types tests/e2e/place-resize-mobile.e2e.ts
 */

import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { deflateSync } from "node:zlib";
import type { ElementHandle, Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FIXTURE_PATH = resolve(import.meta.dirname, "../fixtures/multipage.pdf");
const USER_DATA_DIR =
  process.env.E2E_USER_DATA_DIR ?? resolve(import.meta.dirname, "../.puppeteer-profile-editor-m");
// A per-run unique temp dir (not a predictable path in the shared temp dir) so
// the screenshots/fixtures can't collide or be pre-created by another process.
const SHOT_DIR = process.env.SHOT_DIR ?? mkdtempSync(join(tmpdir(), "cloakpdf-e2e-m-"));

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}
if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH}.`);
if (!existsSync(FIXTURE_PATH)) fail(`Fixture not found at ${FIXTURE_PATH}.`);

// Minimal solid-colour PNG encoder (so the signature box geometry is known).
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, crc]);
}
function makePng(w: number, h: number, [r, g, b]: [number, number, number]): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = Buffer.alloc(1 + w * 3);
  for (let x = 0; x < w; x++) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

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
async function waitText(page: Page, re: RegExp, timeout = 15_000) {
  await page.waitForFunction(
    (src: string, flags: string) => new RegExp(src, flags).test(document.body.innerText),
    { timeout },
    re.source,
    re.flags,
  );
}
async function pickTool(page: Page, name: string) {
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), {
    timeout: 60_000,
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    const toggle = await page.$('button[aria-label="Open tools"]');
    if (!toggle) break;
    await toggle.click();
    const opened = await page
      .waitForSelector('button[aria-label="Close tools"]', { timeout: 3_000 })
      .then(() => true)
      .catch(() => false);
    if (opened) break;
  }
  await page.waitForSelector(`button[aria-label="${name}"]`, { timeout: 10_000 });
  await page.click(`button[aria-label="${name}"]`);
  await page.waitForSelector('button[aria-label="Done"]', { timeout: 10_000 });
}
async function sheetFraction(page: Page): Promise<number> {
  return page.evaluate(() => {
    const sheet = document.querySelector('[data-testid="mobile-tool-sheet"]') as HTMLElement | null;
    const col = sheet?.parentElement as HTMLElement | null;
    if (!sheet || !col) return -1;
    const sh = sheet.getBoundingClientRect().height;
    const ch = col.getBoundingClientRect().height;
    return ch > 0 ? sh / ch : -1;
  });
}

async function main() {
  const errors: string[] = [];
  const browser = await launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: true,
    defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
  });
  const page = await browser.newPage();
  try {
    page.setDefaultTimeout(25_000);
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e: unknown) =>
      errors.push(`pageerror: ${e instanceof Error ? e.message : String(e)}`),
    );

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
    await (input as unknown as { uploadFile: (...p: string[]) => Promise<void> }).uploadFile(
      FIXTURE_PATH,
    );
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 20_000 });
    await page.waitForSelector('button[aria-label="Open tools"]', { timeout: 10_000 });
    const bb = await pageBox(page);
    const pageAspect = bb.width / bb.height;

    // ── Signature ──────────────────────────────────────────────────────────
    await pickTool(page, "Signature");
    await waitText(page, /Draw or upload a signature/i);
    const sliders = await page.$$eval('input[type="range"]', (els) => els.length);
    if (sliders !== 0) fail(`Mobile signature panel still has a slider (${sliders}).`);

    const pngPath = join(SHOT_DIR, "sig-known-m.png");
    writeFileSync(pngPath, makePng(240, 120, [30, 41, 59]));
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find(
        (e) => (e.textContent ?? "").trim() === "Choose",
      );
      (b as HTMLElement | null)?.click();
    });
    const up = (await page.$(
      'input[accept="image/png,image/jpeg"]',
    )) as ElementHandle<HTMLInputElement> | null;
    if (!up) fail("Signature upload input not found.");
    await up.uploadFile(pngPath);
    await waitText(page, /Tap the page to place/i);

    const f = await sheetFraction(page);
    if (f < 0 || f > 0.43) fail(`Signature sheet exceeds 40% cap: ${(f * 100).toFixed(1)}%.`);

    const wPct = 0.28;
    const hPct = (wPct * pageAspect) / 2;
    const cx = 0.45;
    const cy = 0.26; // upper page, clear of the bottom sheet
    await tapFrac(page, cx, cy);
    await waitText(page, /\b1 signature\b/i);
    await page.screenshot({ path: join(SHOT_DIR, "m-sig-1-placed.png") });
    await dragFrac(
      page,
      { x: cx + wPct / 2, y: cy + hPct / 2 },
      { x: cx + wPct / 2 + 0.12, y: cy + hPct / 2 + 0.12 },
    );
    await waitText(page, /\b1 signature\b/i);
    await page.screenshot({ path: join(SHOT_DIR, "m-sig-2-resized.png") });
    console.log("  ✓ mobile signature place + corner-resize (no slider, sheet capped)");

    await page.click('button[aria-label="Done"]'); // ✓ applies
    await page.waitForSelector('button[aria-label="Open tools"]', { timeout: 60_000 });
    await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), {
      timeout: 60_000,
    });
    console.log("  ✓ mobile signature apply (global ✓)");

    // ── QR ───────────────────────────────────────────────────────────────────
    await pickTool(page, "QR / barcode");
    await waitText(page, /Enter content to place|Tap the page to place the code/i);
    await page.type('input[placeholder^="https://example"]', "https://cloakpdf.app/v/9");
    await waitText(page, /Tap the page to place the code/i);
    const qcx = 0.35;
    const qcy = 0.24;
    await tapFrac(page, qcx, qcy);
    await waitText(page, /\b1 code\b/i);
    await page.screenshot({ path: join(SHOT_DIR, "m-qr-1-placed.png") });
    const qW = 0.18;
    const qH = qW * pageAspect;
    await dragFrac(
      page,
      { x: qcx + qW / 2, y: qcy + qH / 2 },
      { x: qcx + qW / 2 + 0.1, y: qcy + qH / 2 + 0.1 },
    );
    await waitText(page, /\b1 code\b/i);
    await page.screenshot({ path: join(SHOT_DIR, "m-qr-2-resized.png") });
    console.log("  ✓ mobile QR place + corner-resize");

    if (errors.length > 0) {
      console.error("✗ Console/page errors:");
      for (const e of errors) console.error(`   ${e}`);
      process.exit(1);
    }
    console.log(`✓ mobile place-resize verification passed — screenshots in ${SHOT_DIR}`);
  } catch (e) {
    console.error(`✗ Failed: ${e instanceof Error ? e.message : String(e)}`);
    if (errors.length) for (const x of errors) console.error(`   ${x}`);
    try {
      await page.screenshot({ path: join(SHOT_DIR, "m-place-resize-fail.png") });
    } catch {
      /* ignore */
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

void main();
