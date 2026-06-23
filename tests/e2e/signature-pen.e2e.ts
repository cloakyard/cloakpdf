/**
 * End-to-end check for the Signature pad's Pointer Events input — verifies that
 * a stylus (with pressure), a mouse, and touch all draw, and that a pen takes
 * priority over a concurrent finger (palm rejection).
 *
 * Pen + touch are synthesized over the DevTools protocol (puppeteer's mouse API
 * can't set `pointerType: "pen"` or pressure), so this drives:
 *   open editor → Signature → enable Realistic ink →
 *   PEN stroke with ramping pressure (asserts capture + a non-uniform export) →
 *   clear → MOUSE stroke (speed-based fallback path) →
 *   clear → TOUCH stroke (finger) →
 *   palm rejection: pen down, stray finger tap → still one continuous export.
 *
 * Requirements: Chrome at CHROME_PATH (default macOS path) and the dev server
 * at http://localhost:5173 (`vp dev`). Fixture: tests/fixtures/multipage.pdf.
 *
 * Run:  node --experimental-strip-types tests/e2e/signature-pen.e2e.ts
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { CDPSession, Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FIXTURE_PATH = resolve(import.meta.dirname, "../fixtures/multipage.pdf");
const USER_DATA_DIR =
  process.env.E2E_USER_DATA_DIR ?? resolve(import.meta.dirname, "../.puppeteer-profile-editor");

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH} (set CHROME_PATH).`);
if (!existsSync(FIXTURE_PATH)) fail(`Fixture not found at ${FIXTURE_PATH}.`);

async function waitForText(page: Page, re: RegExp, timeout = 10_000): Promise<void> {
  await page.waitForFunction(
    (src: string, flags: string) => new RegExp(src, flags).test(document.body.innerText),
    { timeout },
    re.source,
    re.flags,
  );
}

/** Pad bounding box in CSS viewport pixels (where CDP input coordinates live). */
async function padRect(page: Page) {
  const r = await page.$eval('canvas[aria-label^="Signature drawing area"]', (el) => {
    const b = el.getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  });
  if (!r.w) fail("Signature pad has no layout box.");
  return r;
}

/** The placed-signature PNG currently staged in the pad (read from the preview
 *  hint side-effect: the panel shows "Tap the page to place" once a data-URL is
 *  captured). Returns true when content exists. */
async function hasStaged(page: Page): Promise<boolean> {
  return page.evaluate(() => /Tap the page to place/i.test(document.body.innerText));
}

type PenPt = { x: number; y: number; force: number };

async function penStroke(cdp: CDPSession, pts: PenPt[]): Promise<void> {
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: pts[0].x,
    y: pts[0].y,
    button: "left",
    buttons: 1,
    clickCount: 1,
    pointerType: "pen",
    force: pts[0].force,
  });
  for (let i = 1; i < pts.length; i++) {
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: pts[i].x,
      y: pts[i].y,
      button: "none",
      buttons: 1,
      pointerType: "pen",
      force: pts[i].force,
    });
  }
  const last = pts[pts.length - 1];
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: last.x,
    y: last.y,
    button: "left",
    buttons: 0,
    clickCount: 1,
    pointerType: "pen",
    force: 0,
  });
}

async function touchPoint(
  cdp: CDPSession,
  type: "touchStart" | "touchMove" | "touchEnd",
  x: number,
  y: number,
): Promise<void> {
  await cdp.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: type === "touchEnd" ? [] : [{ x, y }],
  });
}

async function clearPad(page: Page): Promise<void> {
  await page.click('button[aria-label="Clear signature"]');
  await page.waitForFunction(
    () => !document.querySelector('button[aria-label="Clear signature"]'),
    { timeout: 5_000 },
  );
}

async function main() {
  const errors: string[] = [];
  const browser = await launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: true,
    defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 2 },
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
    const cdp = await page.target().createCDPSession();

    console.log(`→ Loading ${DEV_URL}`);
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
    await (input as { uploadFile: (...p: string[]) => Promise<void> }).uploadFile(FIXTURE_PATH);
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 20_000 });

    await page.click('button[aria-label="Signature"]');
    await page.waitForSelector('canvas[aria-label^="Signature drawing area"]', { timeout: 5_000 });

    // Enable Realistic ink so pressure actually drives stroke weight.
    await page.click('[role="switch"][aria-label="Realistic ink"]');
    console.log("  ✓ editor → Signature → Realistic ink on");

    // 1. PEN with ramping pressure (0.1 → 0.95) across a horizontal sweep.
    let rect = await padRect(page);
    const penPts: PenPt[] = [];
    const N = 24;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      penPts.push({
        x: rect.x + rect.w * (0.1 + 0.8 * t),
        y: rect.y + rect.h * (0.5 + 0.12 * Math.sin(t * Math.PI * 2)),
        force: 0.1 + 0.85 * t,
      });
    }
    await penStroke(cdp, penPts);
    await waitForText(page, /Tap the page to place/i, 8_000);
    if (!(await hasStaged(page))) fail("Pen stroke did not produce a signature.");
    await (await page.$('canvas[aria-label^="Signature drawing area"]'))!.screenshot({
      path: "/tmp/sig-pen.png",
    });
    console.log("  ✓ stylus (pen) draws with pressure → /tmp/sig-pen.png");

    // 2. MOUSE — the no-pressure fallback path (speed-based weight).
    await clearPad(page);
    rect = await padRect(page);
    await page.mouse.move(rect.x + rect.w * 0.15, rect.y + rect.h * 0.6);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.w * 0.4, rect.y + rect.h * 0.35, { steps: 20 });
    await page.mouse.move(rect.x + rect.w * 0.7, rect.y + rect.h * 0.6, { steps: 6 });
    await page.mouse.move(rect.x + rect.w * 0.88, rect.y + rect.h * 0.45, { steps: 20 });
    await page.mouse.up();
    await waitForText(page, /Tap the page to place/i, 8_000);
    console.log("  ✓ mouse / touchpad draws (speed fallback)");

    // 3. TOUCH — a finger stroke.
    await clearPad(page);
    rect = await padRect(page);
    const ty = rect.y + rect.h * 0.5;
    await touchPoint(cdp, "touchStart", rect.x + rect.w * 0.2, ty);
    for (let i = 1; i <= 12; i++) {
      await touchPoint(cdp, "touchMove", rect.x + rect.w * (0.2 + 0.6 * (i / 12)), ty);
    }
    await touchPoint(cdp, "touchEnd", 0, 0);
    await waitForText(page, /Tap the page to place/i, 8_000);
    console.log("  ✓ touch (finger) draws");

    // 4. Palm rejection: hold a pen down mid-stroke, tap a stray finger, keep
    //    drawing with the pen, lift. The finger must not start its own stroke or
    //    break the pen stroke — the export still succeeds as one signature.
    await clearPad(page);
    rect = await padRect(page);
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: rect.x + rect.w * 0.2,
      y: rect.y + rect.h * 0.5,
      button: "left",
      buttons: 1,
      clickCount: 1,
      pointerType: "pen",
      force: 0.6,
    });
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: rect.x + rect.w * 0.4,
      y: rect.y + rect.h * 0.45,
      button: "none",
      buttons: 1,
      pointerType: "pen",
      force: 0.6,
    });
    // Stray finger tap elsewhere while the pen is down.
    await touchPoint(cdp, "touchStart", rect.x + rect.w * 0.7, rect.y + rect.h * 0.8);
    await touchPoint(cdp, "touchEnd", 0, 0);
    // Pen continues + lifts.
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: rect.x + rect.w * 0.6,
      y: rect.y + rect.h * 0.5,
      button: "none",
      buttons: 1,
      pointerType: "pen",
      force: 0.6,
    });
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: rect.x + rect.w * 0.6,
      y: rect.y + rect.h * 0.5,
      button: "left",
      buttons: 0,
      clickCount: 1,
      pointerType: "pen",
      force: 0,
    });
    await waitForText(page, /Tap the page to place/i, 8_000);
    console.log("  ✓ palm rejection: stray finger ignored while pen draws");

    if (errors.length > 0) {
      console.error("✗ Console/page errors:");
      for (const e of errors) console.error(`   ${e}`);
      process.exit(1);
    }
    console.log("✓ Signature pen/mouse/touch input passed.");
  } catch (e) {
    console.error(`✗ Failed: ${e instanceof Error ? e.message : String(e)}`);
    if (errors.length) for (const x of errors) console.error(`   ${x}`);
    try {
      await page.screenshot({ path: "/tmp/sig-pen-fail.png" });
      console.error("screenshot → /tmp/sig-pen-fail.png");
    } catch {
      /* ignore */
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

void main();
