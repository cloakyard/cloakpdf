/**
 * Regression smoke for the Watermark/Stamp tool's LIVE canvas preview.
 *
 * The Stamp tool's Stage paints a diagonal watermark onto the editor's overlay
 * canvas as you tune it (added in the editor redesign). It's faint grey at the
 * default 0.3 opacity, so this asserts by SAMPLING the overlay canvas for
 * painted pixels rather than by eye — guarding the preview wiring (useStageProps
 * → PdfStage repaint) from silently regressing, and confirming it CLEARS when
 * the tool is switched away (no bleed into the next tool).
 *
 * Requirements: Chrome at CHROME_PATH and the dev server at localhost:5173.
 * Run:  node --experimental-strip-types tests/e2e/stamp-preview.e2e.ts
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FIXTURE = resolve(import.meta.dirname, "../fixtures/multipage.pdf");
const USER_DATA_DIR = resolve(import.meta.dirname, "../.puppeteer-profile-editor");

function fail(m: string): never {
  console.error(`✗ ${m}`);
  process.exit(1);
}
if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH} (set CHROME_PATH).`);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Count painted (non-transparent) pixels on the editor's focus overlay canvas.
async function overlayPaintedPixels(page: Page): Promise<number> {
  return page.evaluate(() => {
    const c = document.querySelector("canvas.absolute.inset-0") as HTMLCanvasElement | null;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || !c.width || !c.height) return -1;
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let painted = 0;
    for (let k = 3; k < d.length; k += 4) if (d[k] > 0) painted++;
    return painted;
  });
}

async function main() {
  const browser = await launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  const errors: string[] = [];
  try {
    page.setDefaultTimeout(20_000);
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e: unknown) => errors.push(String(e instanceof Error ? e.message : e)));

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
    await (input as { uploadFile: (...p: string[]) => Promise<void> }).uploadFile(FIXTURE);
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 20_000 });

    // Activate the Stamp tool → its Stage should paint the default "CONFIDENTIAL"
    // watermark onto the overlay.
    const stampBtn = await page.$('button[aria-label="Stamp"]');
    if (!stampBtn) fail("Stamp rail tool not found.");
    await stampBtn.click();
    await wait(1200); // let useStageProps register + PdfStage repaint
    const painted = await overlayPaintedPixels(page);
    if (painted < 100)
      fail(`Stamp live preview did not paint (overlay had ${painted} painted px, expected > 100).`);
    console.log(`  ✓ stamp watermark live preview paints (${painted} px)`);

    // Switch to another focus tool (Annotate) — the watermark overlay must clear
    // (useStageProps cleanup), i.e. it must not bleed into the next tool.
    const annBtn = await page.$('button[aria-label="Annotate"]');
    if (!annBtn) fail("Annotate rail tool not found.");
    await annBtn.click();
    await wait(900);
    const afterSwitch = await overlayPaintedPixels(page);
    // Annotate's idle overlay paints nothing until you draw, so the watermark
    // pixels should be gone (allow a tiny margin for AA dust).
    if (afterSwitch > 50)
      fail(`Watermark preview bled into the next tool (${afterSwitch} px still painted).`);
    console.log(`  ✓ preview clears on tool switch (${afterSwitch} px)`);

    if (errors.length) {
      console.error("✗ Console/page errors:");
      for (const e of new Set(errors)) console.error(`   ${e}`);
      process.exit(1);
    }
    console.log("✓ Stamp preview smoke passed — paints live, clears on switch.");
  } catch (e) {
    console.error(`✗ Stamp preview smoke failed: ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
void main();
