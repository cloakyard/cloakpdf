/**
 * End-to-end check for the Annotate text tool's expanded font picker + underline.
 *
 *   open editor → Annotate → Text → font dropdown lists 10+ families →
 *   pick an embedded family (Roboto) + Underline → draw a text box → type →
 *   Apply annotations → export PDF → assert the bytes embed a Roboto subset
 *   (proves the bundled TTF is fetched + fontkit-embedded, i.e. WYSIWYG export).
 *
 * Requirements: Chrome at CHROME_PATH (default macOS path) and the dev server
 * at http://localhost:5173 (`vp dev`). Fixture: tests/fixtures/multipage.pdf.
 *
 * Run:  node --experimental-strip-types tests/e2e/annotate-fonts.e2e.ts
 */

import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PDFDict, PDFDocument, PDFName } from "@pdfme/pdf-lib";
import type { Page } from "puppeteer-core";
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

async function clickByText(page: Page, label: string): Promise<boolean> {
  return page.evaluate((text) => {
    const els = Array.from(document.querySelectorAll("button, a, [role=button]"));
    const el = els.find((e) => (e.textContent ?? "").trim().toLowerCase() === text.toLowerCase());
    if (!el) return false;
    (el as HTMLElement).click();
    return true;
  }, label);
}

async function waitForText(page: Page, re: RegExp, timeout = 15_000): Promise<void> {
  await page.waitForFunction(
    (src: string, flags: string) => new RegExp(src, flags).test(document.body.innerText),
    { timeout },
    re.source,
    re.flags,
  );
}

async function drawOnPage(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Promise<void> {
  const img = await page.$('img[alt="Page 1"]');
  if (!img) fail("Focus page image not found.");
  const bb = await img.boundingBox();
  if (!bb) fail("Focus page image has no layout box.");
  const x1 = bb.x + bb.width * from.x;
  const y1 = bb.y + bb.height * from.y;
  const x2 = bb.x + bb.width * to.x;
  const y2 = bb.y + bb.height * to.y;
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move((x1 + x2) / 2, (y1 + y2) / 2, { steps: 6 });
  await page.mouse.move(x2, y2, { steps: 6 });
  await page.mouse.up();
}

async function waitForFile(dir: string, re: RegExp, timeout = 30_000): Promise<string> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const hit = readdirSync(dir).find(
      (f) => re.test(f) && !f.endsWith(".crdownload") && statSync(join(dir, f)).size > 0,
    );
    if (hit) return hit;
    await new Promise((r) => setTimeout(r, 200));
  }
  fail(`No file matching ${re} appeared in ${dir} within ${timeout}ms.`);
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

    const downloadDir = mkdtempSync(join(tmpdir(), "annotate-fonts-dl-"));
    const cdp = await page.target().createCDPSession();
    await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir });

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

    await page.click('button[aria-label="Annotate"]');
    await waitForText(page, /Apply annotations/i, 5_000);
    if (!(await clickByText(page, "Text"))) fail("Annotate Text sub-tool not found.");
    await page.waitForSelector('[role="combobox"][aria-label="Font family"]', { timeout: 5_000 });
    console.log("  ✓ editor → Annotate → Text");

    // 1. Font dropdown lists the expanded roster (10+ families).
    await page.click('[role="combobox"][aria-label="Font family"]');
    await page.waitForSelector('[role="listbox"] [role="option"]', { timeout: 5_000 });
    const families = await page.$$eval('[role="listbox"] [role="option"]', (els) =>
      els.map((e) => (e.textContent ?? "").trim()),
    );
    if (families.length < 10)
      fail(`Expected ≥10 font families, got ${families.length}: ${families.join(", ")}`);
    for (const want of ["Roboto", "Merriweather", "Roboto Mono"]) {
      if (!families.includes(want))
        fail(`Font picker missing "${want}" (got: ${families.join(", ")})`);
    }
    console.log(`  ✓ font picker lists ${families.length} families incl. embedded ones`);

    // 2. Pick Roboto (an embedded family) + Underline.
    await page.evaluate(() => {
      const o = Array.from(document.querySelectorAll('[role="listbox"] [role="option"]')).find(
        (e) => (e.textContent ?? "").trim() === "Roboto",
      );
      (o as HTMLElement)?.click();
    });
    await page.waitForFunction(() => !document.querySelector('[role="listbox"]'), {
      timeout: 5_000,
    });
    await page.click('button[aria-label="Underline"]');

    // 3. Draw a text box, type, commit (blur → Select).
    await new Promise((r) => setTimeout(r, 200));
    await drawOnPage(page, { x: 0.18, y: 0.18 }, { x: 0.8, y: 0.3 });
    await page.waitForSelector('textarea[aria-label="Text annotation"]', { timeout: 8_000 });
    await page.keyboard.type("Roboto underlined");
    await page.evaluate(() =>
      (
        document.querySelector('textarea[aria-label="Text annotation"]') as HTMLElement | null
      )?.blur(),
    );
    await waitForText(page, /\b1 mark\b/, 8_000);
    await (await page.$('img[alt="Page 1"]'))!.screenshot({ path: "/tmp/annotate-font.png" });
    console.log("  ✓ placed Roboto + underline text → /tmp/annotate-font.png");

    // 4. Apply annotations (burns + embeds the font), then export a PDF.
    if (!(await clickByText(page, "Apply annotations"))) fail("Apply annotations not found.");
    // The burn fetches the bundled TTF and fontkit-embeds it — wait for the busy
    // overlay to mount and then clear (the persistent page <img> is no signal).
    await new Promise((r) => setTimeout(r, 300));
    await page.waitForFunction(
      () =>
        !document.querySelector('[aria-busy="true"]') &&
        !/Applying|Working/i.test(document.body.innerText),
      { timeout: 60_000 },
    );
    if (!(await clickByText(page, "Export"))) fail("Export button not found.");
    await page.waitForSelector('button[aria-label="PDF"]', { timeout: 5_000 });
    await page.click('button[aria-label="PDF"]');
    if (!(await clickByText(page, "Download"))) fail("Download button not found.");
    const dl = await waitForFile(downloadDir, /\.pdf$/i, 60_000);

    // 5. Parse the exported PDF (pdf-lib decompresses object streams, which a raw
    //    byte grep can't) and assert a Roboto subset is embedded — proof the
    //    bundled TTF was fetched + fontkit-embedded, not silently fallen back.
    const bytes = readFileSync(join(downloadDir, dl));
    const doc = await PDFDocument.load(new Uint8Array(bytes));
    const baseFonts = new Set<string>();
    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
      if (!(obj instanceof PDFDict)) continue;
      const bf = obj.lookupMaybe(PDFName.of("BaseFont"), PDFName)?.decodeText();
      if (bf) baseFonts.add(bf);
    }
    console.log("   embedded BaseFonts:", JSON.stringify([...baseFonts]));
    if (![...baseFonts].some((b) => /Roboto/.test(b)))
      fail("Exported PDF does not embed Roboto — the bundled TTF was not embedded.");
    console.log(`  ✓ export embeds a Roboto subset → ${dl}`);

    if (errors.length > 0) {
      console.error("✗ Console/page errors:");
      for (const e of errors) console.error(`   ${e}`);
      process.exit(1);
    }
    console.log("✓ Annotate fonts + underline passed.");
  } catch (e) {
    console.error(`✗ Failed: ${e instanceof Error ? e.message : String(e)}`);
    if (errors.length) for (const x of errors) console.error(`   ${x}`);
    try {
      await page.screenshot({ path: "/tmp/annotate-font-fail.png" });
      console.error("screenshot → /tmp/annotate-font-fail.png");
    } catch {
      /* ignore */
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

void main();
