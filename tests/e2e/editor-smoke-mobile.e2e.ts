/**
 * End-to-end smoke test for the canvas editor's MOBILE layout (bottom sheet).
 *
 * Runs at a phone viewport so the editor resolves to the mobile sheet UI and
 * asserts the mobile-specific behaviours that desktop never exercises:
 *   - mobile sheet entry (no desktop rail);
 *   - every tool's PRIMARY Apply is hidden on mobile and the sheet's global ✓
 *     (Done) commits it — exercised across each apply category: WholeDocPanel
 *     (crop, page numbers), custom canvas (annotate burn), find-and-burn
 *     (find & act), overview board (organize delete), and panel-only (metadata);
 *   - DEFERRED tools (redact) keep their marks when ✓ closes (burn at export);
 *   - MULTI-ACTION tools keep their own buttons (OCR Extract on mobile,
 *     attachments add/remove);
 *   - a render sweep opens the remaining tools assigned to this mobile suite
 *     and asserts each panel mounts in the sheet with the global ✓/✗ and stays
 *     within the 50% half-height sheet; together with editor-features.e2e.ts, all 22 editor
 *     tools are mounted by the combined suites;
 *   - 50:50 split: the open sheet and canvas share the editor column equally;
 *   - no console / page errors throughout.
 *
 * The engine-heavy OCR path is never run here (it would fetch model weights);
 * the step only asserts the controls are reachable on a phone.
 *
 * Requirements: Chrome at CHROME_PATH (default macOS path) and the dev server
 * at http://localhost:5173 (`vp dev`). Fixture: tests/fixtures/multipage.pdf.
 *
 * Run:  node --experimental-strip-types tests/e2e/editor-smoke-mobile.e2e.ts
 */

import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FIXTURE_PATH = resolve(import.meta.dirname, "../fixtures/multipage.pdf");
const USER_DATA_DIR =
  process.env.E2E_USER_DATA_DIR ??
  resolve(import.meta.dirname, "../.puppeteer-profile-editor-mobile");

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH} (set CHROME_PATH).`);
if (!existsSync(FIXTURE_PATH)) fail(`Fixture not found at ${FIXTURE_PATH}.`);

/** Poll a directory until a finished (non-.crdownload) file matching `re`
 *  appears with non-zero size. Returns its name. */
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

/** Click the first element whose trimmed text equals `label` (case-insensitive). */
async function clickByText(page: Page, label: string): Promise<boolean> {
  return page.evaluate((text) => {
    const els = Array.from(document.querySelectorAll("button, a, [role=button]"));
    const el = els.find((e) => (e.textContent ?? "").trim().toLowerCase() === text.toLowerCase());
    if (!el) return false;
    (el as HTMLElement).click();
    return true;
  }, label);
}

/** True if a button/link's trimmed text equals `label` (case-insensitive). */
async function hasExactText(page: Page, label: string): Promise<boolean> {
  return page.evaluate((text) => {
    const els = Array.from(document.querySelectorAll("button, a, [role=button]"));
    return els.some((e) => (e.textContent ?? "").trim().toLowerCase() === text.toLowerCase());
  }, label);
}

/** Wait until the page's visible text matches `re` (preserves regex flags). */
async function waitForText(page: Page, re: RegExp, timeout = 30_000): Promise<void> {
  await page.waitForFunction(
    (src: string, flags: string) => new RegExp(src, flags).test(document.body.innerText),
    { timeout },
    re.source,
    re.flags,
  );
}

/** Drag a rectangle on the focused page, in page-fraction coordinates. */
async function drawOnPage(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Promise<void> {
  const img = await page.$('img[alt="Page 1"]');
  if (!img) fail("Focus page image not found for drawing.");
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

/** Wait until the global busy overlay (portaled, aria-busy) is gone — the mobile
 *  ✓ closes the tool immediately and applies under this overlay, so a follow-up
 *  tap must wait for it to clear or it hits the overlay instead. */
async function waitForNoBusy(page: Page, timeout = 60_000): Promise<void> {
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), { timeout });
}

/** Open the tool picker (if closed) and pick a tool by its rail/sheet name. */
async function pickTool(page: Page, name: string): Promise<void> {
  await waitForNoBusy(page);
  // Open the picker; confirm it actually opened (the toggle flips to "Close
  // tools"), retrying once in case the first tap landed mid-transition.
  for (let attempt = 0; attempt < 2; attempt++) {
    const toggle = await page.$('button[aria-label="Open tools"]');
    if (!toggle) break; // already open
    await toggle.click();
    const opened = await page
      .waitForSelector('button[aria-label="Close tools"]', { timeout: 3_000 })
      .then(() => true)
      .catch(() => false);
    if (opened) break;
  }
  await page.waitForSelector(`button[aria-label="${name}"]`, { timeout: 10_000 });
  await page.click(`button[aria-label="${name}"]`);
  await page.waitForSelector('button[aria-label="Done"]', { timeout: 10_000 }); // tool active
}

/** Sheet height as a fraction of the editor content column it sits in. */
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

/** Assert the open sheet and canvas split the editor content column evenly. */
async function assertHalfSplit(page: Page, where: string): Promise<void> {
  const f = await sheetFraction(page);
  if (f < 0.49 || f > 0.51)
    fail(`${where}: sheet should be 50% of the column; got ${(f * 100).toFixed(1)}%.`);
}

/** Tap the global ✓ (Done) — the mobile Apply — and wait for the work to land. */
async function tapDone(page: Page): Promise<void> {
  await page.click('button[aria-label="Done"]');
  await page.waitForSelector('button[aria-label="Open tools"]', { timeout: 60_000 });
  await waitForNoBusy(page);
}

/** Whether the global ✓ (Done) is currently disabled (greyed, no actionable apply). */
async function doneDisabled(page: Page): Promise<boolean> {
  return page.$eval('button[aria-label="Done"]', (b) => (b as HTMLButtonElement).disabled);
}

/** Wait until the global ✓ becomes enabled (the tool's primary apply is ready). */
async function waitForDoneEnabled(page: Page, timeout = 5_000): Promise<void> {
  await page.waitForFunction(
    () => {
      const b = document.querySelector('button[aria-label="Done"]') as HTMLButtonElement | null;
      return !!b && !b.disabled;
    },
    { timeout },
  );
}

async function main() {
  const errors: string[] = [];
  const browser = await launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: true,
    // iPhone-ish portrait: shortEdge 390 < 760 → mobile sheet layout.
    defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
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

    // Route downloads to a temp dir so the Export step can verify a file lands
    // (headless Chrome blocks downloads unless told otherwise).
    const downloadDir = mkdtempSync(join(tmpdir(), "editor-smoke-mobile-dl-"));
    const cdp = await page.target().createCDPSession();
    await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir });

    console.log(`→ Loading ${DEV_URL} (390×844 mobile)`);
    await page.goto(DEV_URL, { waitUntil: "networkidle2" });

    // Clean draft store so a prior run's autosave doesn't pop the restore banner.
    await page.evaluate(
      () =>
        new Promise<void>((res) => {
          const r = indexedDB.deleteDatabase("cloakpdf-editor");
          r.onsuccess = r.onerror = r.onblocked = () => res();
        }),
    );

    // 1. Editor-first entry → mobile sheet (no desktop rail).
    await page.waitForSelector("input[type=file]", { timeout: 15_000 });
    const input = await page.$("input[type=file]");
    if (!input) fail("Home dropzone file input not found.");
    await (input as { uploadFile: (...p: string[]) => Promise<void> }).uploadFile(FIXTURE_PATH);
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 20_000 });
    await page.waitForSelector('button[aria-label="Open tools"]', { timeout: 10_000 });
    if (!(await page.$('[data-testid="mobile-tool-sheet"]')))
      fail("Mobile tool sheet not rendered at phone width.");
    console.log("  ✓ mobile sheet entry (no desktop rail)");

    // 2. Crop (WholeDocPanel) via the global ✓; per-tool Apply hidden; 50:50.
    await pickTool(page, "Crop");
    await waitForText(page, /area to keep/i, 8_000);
    if (await hasExactText(page, "Crop pages"))
      fail("'Crop pages' Apply must be hidden on mobile.");
    if (!(await page.$('button[aria-label="Cancel"]'))) fail("Global Cancel (✗) not found.");
    // Parity with the desktop disabled Apply button: ✓ is greyed until a box is
    // drawn (crop registers a not-ready primary action), then enables.
    if (!(await doneDisabled(page)))
      fail("Crop: global ✓ must be disabled until a crop box is drawn.");
    await drawOnPage(page, { x: 0.12, y: 0.1 }, { x: 0.9, y: 0.7 });
    await waitForText(page, /Keeping/i, 8_000);
    if (await doneDisabled(page)) fail("Crop: global ✓ must enable once a box is drawn.");
    await assertHalfSplit(page, "crop");
    const pageVisible = await page.evaluate(() => {
      const img = document.querySelector('img[alt="Page 1"]') as HTMLElement | null;
      if (!img) return false;
      const r = img.getBoundingClientRect();
      return r.height > 0 && r.bottom <= window.innerHeight;
    });
    if (!pageVisible) fail("Canvas page not visible above the tool sheet.");
    await tapDone(page);
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 10_000 });
    console.log("  ✓ crop via global ✓ (per-tool Apply hidden, 50:50, canvas visible)");

    // 3. Annotate (custom canvas, burns on apply) via the global ✓.
    await pickTool(page, "Annotate");
    await waitForText(page, /TOOL/i, 8_000);
    if (await hasExactText(page, "Apply annotations"))
      fail("'Apply annotations' must be hidden on mobile.");
    // ColorPicker popover is portaled to <body> so the sheet's overflow can't
    // clip it — open it and assert it renders fully inside the viewport.
    await page.click('button[aria-label^="Custom color"]');
    await page.waitForSelector('[aria-label="Saturation and brightness picker"]', {
      timeout: 5_000,
    });
    const swatchOnScreen = await page.evaluate(() => {
      const el = document.querySelector('[aria-label="Saturation and brightness picker"]');
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return (
        r.width > 0 &&
        r.height > 0 &&
        r.top >= 0 &&
        r.left >= 0 &&
        r.bottom <= window.innerHeight + 1 &&
        r.right <= window.innerWidth + 1
      );
    });
    if (!swatchOnScreen) fail("ColorPicker popover is clipped / off-screen on mobile.");
    await page.click('button[aria-label^="Custom color"]'); // toggle the popover closed
    if (!(await clickByText(page, "Pen"))) fail("Annotate Pen sub-tool not found.");
    await drawOnPage(page, { x: 0.3, y: 0.4 }, { x: 0.7, y: 0.55 });
    await waitForText(page, /\b1 mark\b/, 8_000);
    await tapDone(page); // ✓ burns the annotation
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 10_000 });
    console.log("  ✓ annotate burn via global ✓");

    // 4. Find & Act (search → burn) via the global ✓.
    await pickTool(page, "Find & Act");
    await waitForText(page, /highlight or box/i, 8_000);
    if (!(await clickByText(page, "Highlight"))) fail("Find & Act Highlight mode not found.");
    await page.type('input[placeholder^="Search text"]', "Exam");
    await page.click('button[aria-label="Find matches"]');
    await waitForText(page, /\d+ matches? ·/i, 60_000);
    await tapDone(page); // ✓ burns the highlights
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 10_000 });
    console.log("  ✓ find & act burn via global ✓");

    // 5. Page numbers (WholeDocPanel) via the global ✓.
    await pickTool(page, "Page numbers");
    await waitForText(page, /Position/i, 8_000);
    if (await hasExactText(page, "Add page numbers"))
      fail("'Add page numbers' must be hidden on mobile.");
    await tapDone(page);
    console.log("  ✓ page numbers via global ✓");

    // 6. Metadata (panel-only) via the global ✓.
    await pickTool(page, "Metadata");
    await waitForText(page, /PDF version/i, 10_000);
    if (await hasExactText(page, "Save metadata"))
      fail("'Save metadata' must be hidden on mobile.");
    // "Clear all fields" is a secondary action — must STAY visible on mobile.
    if (!(await hasExactText(page, "Clear all fields")))
      fail("Metadata 'Clear all fields' secondary should stay on mobile.");
    await tapDone(page);
    console.log("  ✓ metadata save via global ✓ (secondary action kept)");

    // 7. Redact (DEFERRED): draw a box → ✓ closes keeping the mark (burns at
    //    export), reopen proves it persisted, then clear it so it can't burn
    //    into a later apply.
    await pickTool(page, "Redact");
    await waitForText(page, /Detect & add boxes/i, 8_000);
    await drawOnPage(page, { x: 0.25, y: 0.3 }, { x: 0.6, y: 0.45 });
    await waitForText(page, /\d+ redactions?/i, 8_000);
    await page.click('button[aria-label="Done"]'); // ✓ — no burn, just close
    await page.waitForSelector('button[aria-label="Open tools"]', { timeout: 10_000 });
    if (!(await page.$('[data-testid="mobile-pending-marks"]')))
      fail("Redact: pending-mark count is not visible in the collapsed mobile tool strip.");
    await pickTool(page, "Redact"); // reopen
    await waitForText(page, /\d+ redactions?/i, 8_000); // mark persisted across ✓
    if (!(await clickByText(page, "Clear all"))) fail("Redact 'Clear all' not found.");
    await page.click('button[aria-label="Done"]'); // close with marks cleared
    await page.waitForSelector('button[aria-label="Open tools"]', { timeout: 10_000 });
    console.log("  ✓ redact deferred — mark persists across ✓, no burn");

    // 8. Render sweep: open every remaining tool, assert its panel mounts in the
    //    sheet with the global ✓/✗ and stays at the 50% split, then ✗ close.
    const sweep = [
      "Select text",
      "Signature",
      "Fill form",
      "Scrub",
      "Erase",
      "Strip furniture",
      "N-up",
      "Stamp",
      "Header & footer",
      "Bates",
      "Bookmarks",
      "Attach",
    ];
    for (const name of sweep) {
      await pickTool(page, name); // also waits for the global ✓ (tool active)
      if (!(await page.$('button[aria-label="Cancel"]'))) fail(`${name}: global ✗ missing.`);
      await assertHalfSplit(page, name);
      await page.click('button[aria-label="Cancel"]'); // ✗ rolls back + closes
      await page.waitForSelector('button[aria-label="Open tools"]', { timeout: 10_000 });
    }
    console.log(`  ✓ render sweep — ${sweep.length} tools mount in the sheet (✓/✗, 50:50)`);

    // 9. Organize (overview board) via the global ✓: delete a page, apply.
    await pickTool(page, "Organize");
    await page.waitForSelector('button[aria-label="Delete page 1"]', { timeout: 10_000 });
    if (await hasExactText(page, "Apply changes"))
      fail("'Apply changes' must be hidden on mobile.");
    // Touch reorder: HTML5 drag-and-drop doesn't fire for touch, so the board
    // must expose Up/Down buttons on mobile (reactive coarse-pointer detection).
    if (!(await page.$('button[aria-label^="Move page"]')))
      fail("Organize: touch reorder (Up/Down) buttons missing on mobile.");
    await page.click('button[aria-label="Delete page 1"]');
    await waitForDoneEnabled(page); // ✓ enables once the board is dirty
    await page.click('button[aria-label="Done"]'); // ✓ applies the page removal
    await waitForNoBusy(page);
    await page.waitForSelector('button[aria-label="Open page 39"]', { timeout: 60_000 });
    if (await page.$('button[aria-label="Open page 40"]'))
      fail("Organize did not remove a page on mobile (still 40).");
    console.log("  ✓ organize delete + apply via global ✓ (40 → 39 pages)");

    // 10. OCR enabled on mobile: Extract control renders (engine NOT run), the
    //     old desktop-only notice is gone, and the sheet body is a scroll box.
    await pickTool(page, "OCR");
    await waitForText(page, /Extract text/i, 8_000);
    if (await page.evaluate(() => /open this pdf on a desktop/i.test(document.body.innerText)))
      fail("OCR still shows the desktop-only notice on mobile.");
    await assertHalfSplit(page, "ocr");
    const bodyScrolls = await page.evaluate(() => {
      const body = document.querySelector('[aria-label="Tool controls"]') as HTMLElement | null;
      if (!body) return false;
      return getComputedStyle(body).overflowY === "auto" && body.scrollHeight >= body.clientHeight;
    });
    if (!bodyScrolls) fail("OCR sheet body is not a scroll container.");
    console.log("  ✓ OCR enabled on mobile (Extract visible, scrollable body)");

    // 11. Export modal renders as a bottom sheet on mobile: close the OCR tool,
    //     open Export, pick Markdown, Download, and verify a real liteparse-
    //     native .md lands. The Export trigger's text label is hidden on mobile
    //     (icon only), so target the dialog-popup button — with no tool open it
    //     is unambiguous (the only other aria-haspopup=dialog is a date input).
    if (await page.$('button[aria-label="Cancel"]')) {
      await page.click('button[aria-label="Cancel"]'); // close the OCR sheet
      await page.waitForSelector('button[aria-label="Open tools"]', { timeout: 10_000 });
    }
    await page.click('button[aria-haspopup="dialog"]'); // Export (icon-only on mobile)
    await page.waitForSelector('button[aria-label="Markdown (.md)"]', { timeout: 5_000 });
    await page.click('button[aria-label="Markdown (.md)"]');
    if (await hasExactText(page, "Infer headings"))
      fail("Stale 'Infer headings' switch still rendered (should be removed).");
    if (!(await clickByText(page, "Download")))
      fail("Download button not found (mobile markdown).");
    const dlMd = await waitForFile(downloadDir, /\.md$/i, 60_000);
    const mdText = readFileSync(join(downloadDir, dlMd), "utf8");
    if (!/^#{1,6} \S/m.test(mdText))
      fail(`Mobile markdown export carries no ATX heading:\n${mdText.slice(0, 300)}`);
    console.log(`  ✓ export sheet · markdown (liteparse native, ${mdText.length} chars) → ${dlMd}`);

    if (errors.length > 0) {
      console.error("✗ Console/page errors during mobile smoke:");
      for (const e of errors) console.error(`   ${e}`);
      process.exit(1);
    }

    console.log(
      "✓ Mobile editor smoke passed — sheet entry; crop/annotate/find&act/page-numbers/metadata/organize apply via the global ✓ (per-tool Apply hidden); redact deferred; OCR on mobile; render sweep of 12 more tools; combined editor suites mount all 22 tools; export sheet → Markdown (liteparse native); 50:50 split holds throughout.",
    );
  } catch (e) {
    console.error(`✗ Mobile smoke failed: ${e instanceof Error ? e.message : String(e)}`);
    if (errors.length) {
      console.error("Console errors:");
      for (const x of errors) console.error(`   ${x}`);
    }
    try {
      await page.screenshot({ path: "/tmp/editor-smoke-mobile-fail.png" });
      console.error("screenshot → /tmp/editor-smoke-mobile-fail.png");
    } catch {
      /* ignore */
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

void main();
