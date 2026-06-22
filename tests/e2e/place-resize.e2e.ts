/**
 * Visual verification for the place-then-drag-resize UX upgrade:
 *   • Signature — upload → place → drag a CORNER handle to resize (aspect-locked)
 *     → toggle an opaque Background → apply. Asserts the Size slider is gone.
 *   • QR / barcode — type content → place on the page → drag a corner to resize
 *     → apply (vector burn).
 *
 * Drives a real browser and writes screenshots to /tmp for eyeball review, and
 * fails on any console / page error. A known-aspect (2:1) PNG is uploaded for the
 * signature so the placed box geometry — and thus the resize-handle location — is
 * deterministic.
 *
 * Requirements: Chrome at CHROME_PATH and the dev server at http://localhost:5173.
 * Fixture: tests/fixtures/multipage.pdf.
 *
 * Run:  node --experimental-strip-types tests/e2e/place-resize.e2e.ts
 */

import { existsSync, writeFileSync } from "node:fs";
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
  process.env.E2E_USER_DATA_DIR ?? resolve(import.meta.dirname, "../.puppeteer-profile-editor");
const SHOT_DIR = process.env.SHOT_DIR ?? tmpdir();

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}
if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH} (set CHROME_PATH).`);
if (!existsSync(FIXTURE_PATH)) fail(`Fixture not found at ${FIXTURE_PATH}.`);

// ── tiny solid-colour PNG encoder (no deps) ────────────────────────────────
const CRC_TABLE = (() => {
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
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function makePng(w: number, h: number, [r, g, b]: [number, number, number]): Buffer {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  const row = Buffer.alloc(1 + w * 3);
  for (let x = 0; x < w; x++) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function pageBox(
  page: Page,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const img = await page.$('img[alt="Page 1"]');
  if (!img) fail("Focus page image not found.");
  const bb = await img.boundingBox();
  if (!bb) fail("Focus page image has no layout box.");
  return bb;
}
async function clickFrac(page: Page, fx: number, fy: number): Promise<void> {
  const bb = await pageBox(page);
  await page.mouse.click(bb.x + bb.width * fx, bb.y + bb.height * fy);
}
async function dragFrac(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Promise<void> {
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
async function clickByText(page: Page, label: string): Promise<boolean> {
  return page.evaluate((text) => {
    const els = Array.from(document.querySelectorAll("button, a, [role=button]"));
    const el = els.find((e) => (e.textContent ?? "").trim().toLowerCase() === text.toLowerCase());
    if (!el) return false;
    (el as HTMLElement).click();
    return true;
  }, label);
}
async function waitText(page: Page, re: RegExp, timeout = 15_000): Promise<void> {
  await page.waitForFunction(
    (src: string, flags: string) => new RegExp(src, flags).test(document.body.innerText),
    { timeout },
    re.source,
    re.flags,
  );
}

async function main() {
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
    const bb = await pageBox(page);
    const pageAspect = bb.width / bb.height;

    // ── Signature ──────────────────────────────────────────────────────────
    await page.click('button[aria-label="Signature"]');
    await waitText(page, /Draw or upload a signature/i);

    // No Size slider any more — the audit's core change.
    const sliderCount = await page.$$eval('input[type="range"]', (els) => els.length);
    if (sliderCount !== 0) fail(`Signature panel still shows a slider (${sliderCount}).`);
    console.log("  ✓ signature Size slider removed");

    // Upload a known 2:1 PNG so the placed box geometry is deterministic.
    const pngPath = join(SHOT_DIR, "sig-known.png");
    writeFileSync(pngPath, makePng(240, 120, [30, 41, 59]));
    if (!(await clickByText(page, "Upload"))) fail("Signature Upload mode not found.");
    const sigUpload = (await page.$(
      'input[accept="image/png,image/jpeg"]',
    )) as ElementHandle<HTMLInputElement> | null;
    if (!sigUpload) fail("Signature upload input not found.");
    await sigUpload.uploadFile(pngPath);
    await waitText(page, /Tap the page to place/i);

    // Place centred at (0.45, 0.4). wPct = 0.28, aspect(img)=2 →
    // hPct = wPct * pageAspect / 2.
    const wPct = 0.28;
    const hPct = (wPct * pageAspect) / 2;
    const cx = 0.45;
    const cy = 0.4;
    await clickFrac(page, cx, cy);
    await waitText(page, /\b1 signature\b/i);
    await page.screenshot({ path: join(SHOT_DIR, "sig-1-placed.png") });
    console.log("  ✓ signature placed (corner handles drawn)");

    // Drag the SE corner handle outward — aspect-locked resize.
    const seX = cx + wPct / 2;
    const seY = cy + hPct / 2;
    await dragFrac(page, { x: seX, y: seY }, { x: seX + 0.14, y: seY + 0.14 });
    await page.screenshot({ path: join(SHOT_DIR, "sig-2-resized.png") });
    // Still exactly one signature (resize must not place a second).
    await waitText(page, /\b1 signature\b/i);
    console.log("  ✓ signature corner-resize (still 1 signature)");

    // Background switch (ink-only → with background) → recolour to blue.
    await page.click('button[role="switch"][aria-label="Signature background"]');
    await page.waitForSelector('button[aria-label^="Blue color"]', { timeout: 5_000 });
    await page.click('button[aria-label^="Blue color"]');
    await page.screenshot({ path: join(SHOT_DIR, "sig-3-background.png") });
    console.log("  ✓ signature background toggle + colour");

    if (!(await clickByText(page, "Apply signature"))) fail("Signature Apply not found.");
    await waitText(page, /\b0 signatures\b/i, 60_000);
    console.log("  ✓ signature apply (embedded, object dropped)");

    // ── QR / barcode ─────────────────────────────────────────────────────────
    await page.click('button[aria-label="QR / barcode"]');
    await waitText(page, /Enter content to place|Tap the page to place the code/i);
    await page.type('input[placeholder^="https://example"]', "https://cloakpdf.app/verify/42");
    await waitText(page, /Tap the page to place the code/i);
    await page.screenshot({ path: join(SHOT_DIR, "qr-0-preview.png") });

    const qcx = 0.3;
    const qcy = 0.3;
    await clickFrac(page, qcx, qcy);
    await waitText(page, /\b1 code\b/i);
    await page.screenshot({ path: join(SHOT_DIR, "qr-1-placed.png") });
    console.log("  ✓ QR placed");

    const qW = 0.18; // DEFAULT_QR_W
    const qH = qW * pageAspect; // square, aspect 1
    await dragFrac(
      page,
      { x: qcx + qW / 2, y: qcy + qH / 2 },
      { x: qcx + qW / 2 + 0.12, y: qcy + qH / 2 + 0.12 },
    );
    await page.screenshot({ path: join(SHOT_DIR, "qr-2-resized.png") });
    await waitText(page, /\b1 code\b/i);
    console.log("  ✓ QR corner-resize (still 1 code)");

    if (!(await clickByText(page, "Apply codes"))) fail("QR Apply not found.");
    await waitText(page, /\b0 codes\b/i, 60_000);
    console.log("  ✓ QR apply (vector burn, object dropped)");

    if (errors.length > 0) {
      console.error("✗ Console/page errors:");
      for (const e of errors) console.error(`   ${e}`);
      process.exit(1);
    }
    console.log(`✓ place-resize verification passed — screenshots in ${SHOT_DIR}`);
  } catch (e) {
    console.error(`✗ Failed: ${e instanceof Error ? e.message : String(e)}`);
    if (errors.length) for (const x of errors) console.error(`   ${x}`);
    try {
      await page.screenshot({ path: join(SHOT_DIR, "place-resize-fail.png") });
      console.error(`screenshot → ${join(SHOT_DIR, "place-resize-fail.png")}`);
    } catch {
      /* ignore */
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

void main();
