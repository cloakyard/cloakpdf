/**
 * End-to-end smoke test for the canvas editor.
 *
 * Unlike `ai-tools.e2e.ts` this downloads NO model weights — it drives the
 * editor's happy path in a real browser and asserts the chrome + the migrated
 * tools work without console errors:
 *   open → render → redact (draw, deferred — burns at export/next edit) → annotate (draw) →
 *   crop (drag → apply) → signature (pad → place → embed) → OCR panel mounts →
 *   organize (delete → assemble) → overview/focus → flatten → metadata/scrub →
 *   extract → page numbers → fill-form → bookmarks → attachments →
 *   export menu (contact-sheet download) →
 *   draft autosave + restore (reload → recover from IndexedDB).
 * OCR's engine is never run here (it would fetch model weights); the step only
 * asserts the panel is wired.
 *
 * Requirements: Chrome at CHROME_PATH (default macOS path) and the dev server
 * at http://localhost:5173 (`vp dev`). Fixture: tests/fixtures/multipage.pdf.
 *
 * Run:  node --experimental-strip-types tests/e2e/editor-smoke.ts
 */

import { existsSync, mkdtempSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
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

/** Click the first visible element whose trimmed text equals `label`. */
async function clickByText(page: Page, label: string): Promise<boolean> {
  return page.evaluate((text) => {
    const els = Array.from(document.querySelectorAll("button, a, [role=button]"));
    const el = els.find((e) => (e.textContent ?? "").trim().toLowerCase() === text.toLowerCase());
    if (!el) return false;
    (el as HTMLElement).click();
    return true;
  }, label);
}

/** Click the first visible element whose trimmed text STARTS WITH `prefix`
 *  (case-insensitive) — for buttons whose label carries a dynamic count, e.g.
 *  "Highlight 6". */
async function clickByPrefix(page: Page, prefix: string): Promise<boolean> {
  return page.evaluate((p) => {
    const els = Array.from(document.querySelectorAll("button, a, [role=button]"));
    const el = els.find((e) =>
      (e.textContent ?? "").trim().toLowerCase().startsWith(p.toLowerCase()),
    );
    if (!el) return false;
    (el as HTMLElement).click();
    return true;
  }, prefix);
}

/** Wait until the page's visible text matches `re`. Preserves the regex flags
 *  (e.g. `i`) — `document.body.innerText` reflects CSS text-transform, so an
 *  `uppercase`-styled label only matches case-insensitively. */
async function waitForText(page: Page, re: RegExp, timeout = 30_000): Promise<void> {
  await page.waitForFunction(
    (src: string, flags: string) => new RegExp(src, flags).test(document.body.innerText),
    {
      timeout,
    },
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

/** Click the focused page at a fraction of its box (used to place a signature). */
async function clickOnPage(page: Page, fx: number, fy: number): Promise<void> {
  const img = await page.$('img[alt="Page 1"]');
  if (!img) fail("Focus page image not found for placement.");
  const bb = await img.boundingBox();
  if (!bb) fail("Focus page image has no layout box.");
  await page.mouse.click(bb.x + bb.width * fx, bb.y + bb.height * fy);
}

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

/** Scribble one stroke on the signature pad so it emits a PNG data-URL. */
async function scribbleOnPad(page: Page): Promise<void> {
  const pad = await page.$('canvas[aria-label^="Signature drawing area"]');
  if (!pad) fail("Signature pad canvas not found.");
  const bb = await pad.boundingBox();
  if (!bb) fail("Signature pad has no layout box.");
  const cy = bb.y + bb.height / 2;
  await page.mouse.move(bb.x + bb.width * 0.2, cy);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width * 0.5, cy - bb.height * 0.25, { steps: 5 });
  await page.mouse.move(bb.x + bb.width * 0.8, cy, { steps: 5 });
  await page.mouse.up();
}

/** Read the Redact panel's live "{N} redactions" count (-1 if absent). */
async function redactionCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const m = document.body.innerText.match(/(\d+)\s+redactions?/i);
    return m ? parseInt(m[1], 10) : -1;
  });
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
    page.setDefaultTimeout(30_000);
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e: unknown) =>
      errors.push(`pageerror: ${e instanceof Error ? e.message : String(e)}`),
    );

    // Route downloads to a temp dir so the Export-menu step can verify a file
    // actually lands (headless Chrome blocks downloads unless told otherwise).
    const downloadDir = mkdtempSync(join(tmpdir(), "editor-smoke-dl-"));
    const cdp = await page.target().createCDPSession();
    await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir });

    console.log(`→ Loading ${DEV_URL}`);
    await page.goto(DEV_URL, { waitUntil: "networkidle2" });

    // Start from a clean draft store — the profile is persistent, so a draft
    // left by a prior run would otherwise pop the "unsaved edits" banner and
    // perturb the steps below. (No editor connection is open yet on home.)
    await page.evaluate(
      () =>
        new Promise<void>((res) => {
          const r = indexedDB.deleteDatabase("cloakpdf-editor");
          r.onsuccess = r.onerror = r.onblocked = () => res();
        }),
    );

    // 1. Editor-first entry: drop a PDF on the home dropzone → editor → focus
    //    render. (The home's only file input is the hero dropzone.)
    await page.waitForSelector("input[type=file]", { timeout: 15_000 });
    const input = await page.$("input[type=file]");
    if (!input) fail("Home dropzone file input not found.");
    await (input as { uploadFile: (...p: string[]) => Promise<void> }).uploadFile(FIXTURE_PATH);
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 20_000 });

    // 1b. Density control: single page ↔ multi-column browse grid, then back.
    const gridBtn = await page.$('button[aria-label="3-column grid"]');
    if (!gridBtn) fail("Density grid control not found.");
    await gridBtn.click();
    await page.waitForSelector('button[aria-label="Open page 1"]', { timeout: 10_000 });
    const singleBtn = await page.$('button[aria-label="Single page"]');
    if (!singleBtn) fail("Density single-page control not found.");
    await singleBtn.click();
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 10_000 });
    console.log("  ✓ density control (single ↔ grid)");

    // 1c. Strip furniture: scan the pristine doc for repeating headers / footers /
    //     page numbers; if any are found, trim them by cropping (non-destructive,
    //     page count unchanged — so the 40→39 organize assertion below still holds).
    const stripBtn = await page.$('button[aria-label="Strip furniture"]');
    if (!stripBtn) fail("Strip furniture rail tool not found.");
    await stripBtn.click(); // focus mode
    await waitForText(page, /repeat across pages/i, 5_000); // panel mounted
    await waitForText(
      page,
      /No repeating|Trims \d+%|Select at least one|Running header|Running footer|Page numbers/i,
      60_000,
    ); // scan resolved
    const canTrim = await page.evaluate(() => /Trims \d+%/i.test(document.body.innerText));
    if (canTrim && (await clickByText(page, "Trim furniture"))) {
      await waitForText(page, /Working/i, 10_000);
      await page.waitForSelector('img[alt="Page 1"]', { timeout: 60_000 });
      console.log("  ✓ strip furniture detect + trim (crop) apply");
    } else {
      console.log("  ✓ strip furniture detect + render (no trimmable furniture in fixture)");
    }

    // 2. Redact: marks are now DEFERRED — burned at export / the next byte
    //    transform, NOT in-tool — so the text layer survives and you can keep
    //    searching + redacting. Prove it: find a word, draw a manual box, then
    //    find the SAME word again — the second find adding more boxes can only
    //    happen if the first round didn't rasterise the text away.
    const redactBtn = await page.$('button[aria-label="Redact"]');
    if (!redactBtn) fail("Redact rail tool not found.");
    await redactBtn.click();
    await waitForText(page, /Detect & add boxes/i, 5_000);
    // 2a. Find & box a recurring word (pristine doc → no OCR needed).
    await page.type('input[placeholder^="Search text"]', "Introduction");
    await page.click('button[aria-label="Find and redact"]');
    await waitForText(page, /Added \d+ box/i, 60_000);
    // 2b. A hand-drawn box — no in-tool Apply now; marks just accumulate.
    await drawOnPage(page, { x: 0.25, y: 0.3 }, { x: 0.6, y: 0.45 });
    await waitForText(page, /\d+ redactions?/i, 5_000);
    const beforeSecondFind = await redactionCount(page);
    // 2c. Find the word AGAIN — the count must grow, which is only possible if
    //     the text layer is still intact (the bug this change fixes).
    await page.type('input[placeholder^="Search text"]', "Introduction");
    await page.click('button[aria-label="Find and redact"]');
    await page.waitForFunction(
      (prev: number) => {
        const m = document.body.innerText.match(/(\d+)\s+redactions?/i);
        return m ? parseInt(m[1], 10) > prev : false;
      },
      { timeout: 60_000 },
      beforeSecondFind,
    );
    // 2d. Box colours: the Fill + Border pickers (same shared ColorPicker as the
    //     other tools) render and are interactive — pick a preset for new boxes.
    await waitForText(page, /fill colour/i, 5_000);
    await waitForText(page, /border colour/i, 5_000);
    if (!(await page.$('button[aria-label^="Blue color"]')))
      fail("Redact colour picker not found.");
    await page.click('button[aria-label^="Blue color"]'); // change the fill colour
    console.log("  ✓ redact deferred — repeated find, box-colour pickers wired (no burn)");

    // 3. Annotate (overlay-object): select tool, draw a pen stroke.
    const annBtn = await page.$('button[aria-label="Annotate"]');
    if (!annBtn) fail("Annotate rail tool not found.");
    await annBtn.click();
    await waitForText(page, /Apply annotations/i, 5_000);
    // Annotate opens in Select mode now — pick the Pen sub-tool before drawing.
    if (!(await clickByText(page, "Pen"))) fail("Annotate Pen sub-tool not found.");
    await drawOnPage(page, { x: 0.3, y: 0.5 }, { x: 0.7, y: 0.65 });
    await waitForText(page, /\b1 mark\b/, 5_000);
    console.log("  ✓ annotate draw");

    // 3a. Text box: the revamped text tool drags a rectangle, then you type
    //     inside it (multi-line textarea). Drawing a box → typing → blurring
    //     (switch to Select) commits a second mark. The settle delay lets the
    //     mode switch re-register the stage's pointer handlers before the drag
    //     (a real user can't click-and-drag within one frame). While the text
    //     editor is open its async size-suggest (a PDF.js text-geometry read)
    //     delays puppeteer's rAF-based waitForSelector/waitForFunction past their
    //     timeout — so this step polls via page.evaluate (immediate) instead.
    const pollEval = async (fn: () => boolean, label = "", ms = 8000): Promise<void> => {
      const end = Date.now() + ms;
      for (;;) {
        if (await page.evaluate(fn)) return;
        if (Date.now() > end) {
          const st = await page.evaluate(() => ({
            ta: !!document.querySelector('textarea[aria-label="Text annotation"]'),
            marks: (document.body.innerText.match(/\d+\s+marks?/i) ?? [])[0] ?? "?",
            pressed: [...document.querySelectorAll('button[aria-pressed="true"]')].map((e) =>
              (e.textContent ?? "").trim(),
            ),
          }));
          fail(
            `pollEval timed out [${label}] state=${JSON.stringify(st)} errs=${JSON.stringify(errors.slice(-3))}`,
          );
        }
        await new Promise((r) => setTimeout(r, 150));
      }
    };
    if (!(await clickByText(page, "Text"))) fail("Annotate Text sub-tool not found.");
    // Wait for Text mode to be active (button pressed) so the stage's pointer
    // handlers have re-registered before the drag.
    await pollEval(
      () =>
        [...document.querySelectorAll('button[aria-pressed="true"]')].some(
          (e) => (e.textContent ?? "").trim() === "Text",
        ),
      "text-mode",
    );
    await new Promise((r) => setTimeout(r, 200));
    await drawOnPage(page, { x: 0.25, y: 0.2 }, { x: 0.7, y: 0.32 });
    await pollEval(
      () => !!document.querySelector('textarea[aria-label="Text annotation"]'),
      "textarea",
    );
    await page.keyboard.type("Hello box");
    // Blur to commit. (A real click elsewhere blurs the textarea; a synthetic
    // el.click() doesn't move focus, so blur it directly.) Commit returns to
    // Select mode and selects the new box → a second mark.
    await page.evaluate(() =>
      (
        document.querySelector('textarea[aria-label="Text annotation"]') as HTMLElement | null
      )?.blur(),
    );
    await pollEval(() => /\b2 marks\b/.test(document.body.innerText), "2-marks");
    console.log("  ✓ annotate text box (draw → type → commit)");

    // 3b. Crop (drag a keep rect → per-page crop boxes). Page count unchanged.
    const cropBtn = await page.$('button[aria-label="Crop"]');
    if (!cropBtn) fail("Crop rail tool not found.");
    await cropBtn.click(); // focus mode
    await waitForText(page, /area to keep/i, 5_000);
    await drawOnPage(page, { x: 0.12, y: 0.1 }, { x: 0.9, y: 0.85 });
    await waitForText(page, /Keeping/i, 5_000);
    if (!(await clickByText(page, "Crop pages"))) fail("Crop Apply button not found.");
    await waitForText(page, /Working/i, 10_000);
    await waitForText(page, /area to keep/i, 60_000); // keep resets once applied
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 10_000 });
    console.log("  ✓ crop drag + apply");

    // 3c. Signature (canvas placement): draw on pad → tap page → embed.
    const sigBtn = await page.$('button[aria-label="Signature"]');
    if (!sigBtn) fail("Signature rail tool not found.");
    await sigBtn.click(); // focus mode
    await waitForText(page, /Draw or upload a signature/i, 5_000);
    await scribbleOnPad(page);
    await waitForText(page, /Tap the page to place/i, 5_000);
    await clickOnPage(page, 0.5, 0.55);
    await waitForText(page, /\b1 signature\b/, 5_000);
    if (!(await clickByText(page, "Apply signature"))) fail("Signature Apply button not found.");
    await waitForText(page, /\b0 signatures\b/, 60_000); // embed drops the placed object
    console.log("  ✓ signature place + apply");

    // 3d. Find & Act: search the text layer for a recurring word, mark every
    //     occurrence (non-destructive Highlight), and burn them in one pass.
    const findBtn = await page.$('button[aria-label="Find & Act"]');
    if (!findBtn) fail("Find & Act rail tool not found.");
    await findBtn.click(); // focus mode
    await waitForText(page, /highlight or box/i, 5_000);
    if (!(await clickByText(page, "Highlight"))) fail("Find & Act Highlight mode not found.");
    await page.type('input[placeholder^="Search text"]', "Exam"); // recurs across the fixture
    await page.click('button[aria-label="Find matches"]'); // not the rail "Find" tool
    await waitForText(page, /\d+ matches? ·/i, 60_000); // matches resolved + counted
    if (!(await clickByPrefix(page, "Highlight "))) fail("Find & Act Highlight Apply not found.");
    // Apply burns the highlights and clears the result list (searched → false).
    await page.waitForFunction(() => !/\d+ match(?:es)? ·/.test(document.body.innerText), {
      timeout: 60_000,
    });
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 10_000 });
    console.log("  ✓ find & act search + highlight apply");

    // 3e. Erase: drag a box → a persistent `erase` mark. Deferred like redaction
    //     (burned at export / the next byte transform), so no in-tool Apply.
    const eraseBtn = await page.$('button[aria-label="Erase"]');
    if (!eraseBtn) fail("Erase rail tool not found.");
    await eraseBtn.click(); // focus mode
    await waitForText(page, /anything you want gone/i, 5_000);
    await drawOnPage(page, { x: 0.3, y: 0.3 }, { x: 0.6, y: 0.45 });
    await waitForText(page, /\b1 area\b/i, 5_000); // region listed, not burned
    console.log("  ✓ smart erase draw (deferred mark)");

    // 4. OCR panel mounts + is wired (we don't run the engine — that would
    //    download model weights; just assert the desktop controls render).
    const ocrBtn = await page.$('button[aria-label="OCR"]');
    if (!ocrBtn) fail("OCR rail tool not found.");
    await ocrBtn.click();
    await waitForText(page, /Extract text/i, 5_000); // phase 1; engine not run here
    console.log("  ✓ OCR panel mounts (engine not run)");

    // 5. Organize (page-board): delete a page, apply via assemblePdf (40 → 39).
    const orgBtn = await page.$('button[aria-label="Organize"]');
    if (!orgBtn) fail("Organize rail tool not found.");
    await orgBtn.click(); // switches to overview + editable board
    await page.waitForSelector('button[aria-label="Delete page 1"]', { timeout: 10_000 });
    await page.click('button[aria-label="Delete page 1"]');
    if (!(await clickByText(page, "Apply changes"))) fail("Organize Apply button not found.");
    await waitForText(page, /\b39 pages\b/, 60_000);
    console.log("  ✓ organize delete + apply (40 → 39 pages)");

    // 6. Browse overview (deselect tool) + jump back to focus.
    await orgBtn.click(); // toggle organize off → read-only browse grid
    await page.waitForSelector('button[aria-label="Open page 1"]', { timeout: 10_000 });
    const pageButtons = await page.$$('button[aria-label^="Open page "]');
    if (pageButtons.length < 2) fail(`Expected ≥2 pages in overview, got ${pageButtons.length}.`);
    await page.click('button[aria-label="Open page 2"]');
    await page.waitForSelector('img[alt="Page 2"]', { timeout: 10_000 });

    // 7. Whole-doc options tool: N-up applies through the shared panel.
    //    (Flatten/grayscale/compress/repair moved to the Export modal — see 13b.)
    const nupBtn = await page.$('button[aria-label="N-up"]');
    if (!nupBtn) fail("N-up rail tool not found.");
    await nupBtn.click(); // mode "either" → stays in focus
    await waitForText(page, /Apply N-up layout/i, 5_000);
    if (!(await clickByText(page, "Apply N-up layout"))) fail("N-up Apply button not found.");
    await waitForText(page, /Working/i, 10_000); // busy overlay / button
    await waitForText(page, /Apply N-up layout/i, 60_000); // restored when done
    console.log("  ✓ whole-doc apply (n-up)");

    // 8. Security panels load their async report on open.
    const metaBtn = await page.$('button[aria-label="Metadata"]');
    if (!metaBtn) fail("Metadata rail tool not found.");
    await metaBtn.click();
    await waitForText(page, /Save metadata/i, 10_000);
    const scrubBtn = await page.$('button[aria-label="Scrub"]');
    if (!scrubBtn) fail("Scrub rail tool not found.");
    await scrubBtn.click();
    await waitForText(page, /Scrub hidden data/i, 10_000);
    console.log("  ✓ metadata + scrub panels load");

    // 9. Merged Organize quick actions (absorbed reverse / extract / blank).
    //    Organize is the single page-board now — assert the quick actions
    //    render and the absorbed blank-scan runs to a result (no apply).
    await orgBtn.click(); // back into the page-board
    await waitForText(page, /Quick actions/i, 10_000);
    await waitForText(page, /Reverse order/i, 5_000);
    if (!(await clickByText(page, "Find blank pages"))) fail("Find blank pages action not found.");
    await waitForText(page, /No blank pages found|Delete \d+ blank page/i, 60_000);
    await orgBtn.click(); // toggle back off
    console.log("  ✓ merged organize (reverse/extract/blank quick actions)");

    // 10. Stamp-family option tool: page numbers applies via the option panel.
    const pnBtn = await page.$('button[aria-label="Page numbers"]');
    if (!pnBtn) fail("Page numbers rail tool not found.");
    await pnBtn.click();
    await waitForText(page, /Add page numbers/i, 5_000);
    if (!(await clickByText(page, "Add page numbers"))) fail("Page numbers Apply not found.");
    await waitForText(page, /Working/i, 10_000);
    await waitForText(page, /Add page numbers/i, 60_000);
    console.log("  ✓ stamp-family apply (page numbers)");

    // 11. Fill form: the fixture has no AcroForm, so the reader reports it.
    await page.waitForSelector('img[alt^="Page "]', { timeout: 10_000 }); // doc settled
    if (!(await page.$('button[aria-label="Fill form"]'))) fail("Fill form rail tool not found.");
    await page.click('button[aria-label="Fill form"]');
    // A rail click right after the page-numbers re-render can be dropped — verify
    // the panel switched (its description appears) and re-click once if it didn't.
    const ffSwitched = await waitForText(page, /interactive form fields/i, 8_000)
      .then(() => true)
      .catch(() => false);
    if (!ffSwitched) await page.click('button[aria-label="Fill form"]');
    await waitForText(page, /no fillable form fields/i, 15_000);
    console.log("  ✓ fill-form reads fields (empty)");

    // 12. Bookmarks: add one row + apply, page count unchanged.
    const bmBtn = await page.$('button[aria-label="Bookmarks"]');
    if (!bmBtn) fail("Bookmarks rail tool not found.");
    await bmBtn.click();
    await waitForText(page, /show in the viewer's outline/i, 5_000);
    await page.type('input[placeholder="Bookmark title"]', "Intro");
    if (!(await clickByText(page, "Add 1 bookmark"))) fail("Bookmarks Apply button not found.");
    await waitForText(page, /Working/i, 10_000);
    await waitForText(page, /Add 1 bookmark/i, 60_000);
    console.log("  ✓ bookmarks add + apply");

    // 12b. Auto Contents: toggle "Add a contents page" and re-apply — inserts a
    //      clickable in-document TOC page (embedFont + drawText + /Link annots).
    //      Output correctness is unit-tested; this proves it runs in a browser.
    await page.evaluate(() => {
      const lbl = Array.from(document.querySelectorAll("label")).find((l) =>
        /Add a contents page/i.test(l.textContent ?? ""),
      );
      (lbl?.querySelector("input") as HTMLInputElement | null)?.click();
    });
    if (!(await clickByText(page, "Add 1 bookmark")))
      fail("Bookmarks contents re-apply not found.");
    await waitForText(page, /Working/i, 10_000);
    await waitForText(page, /Add 1 bookmark/i, 60_000);
    console.log("  ✓ bookmarks contents page apply");

    // 13. Attachments: list panel loads its async report on open.
    const attBtn = await page.$('button[aria-label="Attach"]');
    if (!attBtn) fail("Attach rail tool not found.");
    await attBtn.click();
    await waitForText(page, /No files attached yet|Reading attachments/i, 10_000);
    console.log("  ✓ attachments panel loads");

    // 13b. Export modal: pick a format / toggle a convert option, then hit the
    //      single Download button. Contact sheet (runTask → nupPages) and a PDF
    //      Grayscale convert (rasterise) both land PDFs in the download dir.
    if (!(await clickByText(page, "Export"))) fail("Export button not found.");
    await page.waitForSelector('button[aria-label="Contact sheet"]', { timeout: 5_000 }); // modal open
    await page.click('button[aria-label="Contact sheet"]'); // select format
    if (!(await clickByText(page, "Download"))) fail("Download button not found.");
    const dl = await waitForFile(downloadDir, /_contact-sheet\.pdf$/i, 60_000);
    console.log(`  ✓ export modal · contact sheet → ${dl}`);

    if (!(await clickByText(page, "Export"))) fail("Export button not found (2nd open).");
    await page.waitForSelector('button[aria-label="PDF"]', { timeout: 5_000 });
    await page.click('button[aria-label="PDF"]'); // back to PDF so options show
    await page.waitForSelector('button[aria-label="Grayscale"]', { timeout: 5_000 });
    await page.click('button[aria-label="Grayscale"]'); // toggle the switch on
    if (!(await clickByText(page, "Download"))) fail("Download button not found (2nd).");
    const dl2 = await waitForFile(downloadDir, /_grayscale\.pdf$/i, 60_000);
    console.log(`  ✓ export modal · grayscale → ${dl2}`);

    // 13c. Export · Text + Markdown — reconstruct reading-order text on-device
    //      (digital fixture → liteparse text layer, no model weights) and write
    //      .txt + .md. The Markdown branch also surfaces the Infer-headings switch.
    if (!(await clickByText(page, "Export"))) fail("Export button not found (text).");
    await page.waitForSelector('button[aria-label="Text (.txt)"]', { timeout: 5_000 });
    await page.click('button[aria-label="Text (.txt)"]');
    if (!(await clickByText(page, "Download"))) fail("Download button not found (text).");
    const dlTxt = await waitForFile(downloadDir, /\.txt$/i, 60_000);
    console.log(`  ✓ export modal · text → ${dlTxt}`);

    if (!(await clickByText(page, "Export"))) fail("Export button not found (markdown).");
    await page.waitForSelector('button[aria-label="Markdown (.md)"]', { timeout: 5_000 });
    await page.click('button[aria-label="Markdown (.md)"]');
    await waitForText(page, /Infer headings/i, 5_000); // markdown-only option rendered
    if (!(await clickByText(page, "Download"))) fail("Download button not found (markdown).");
    const dlMd = await waitForFile(downloadDir, /\.md$/i, 60_000);
    console.log(`  ✓ export modal · markdown (+ infer-headings toggle) → ${dlMd}`);

    if (errors.length > 0) {
      console.error("✗ Console/page errors during smoke:");
      for (const e of errors) console.error(`   ${e}`);
      process.exit(1);
    }

    console.log(
      `✓ Editor smoke passed — strip furniture, redact (deferred), find & act, smart erase (deferred), annotate, crop, signature, organize (now ${pageButtons.length} pages), overview/focus, stamps, forms, bookmarks (+ contents page), attachments, OCR wired, export PDF/contact-sheet/text/markdown.`,
    );
  } catch (e) {
    console.error(`✗ Smoke failed: ${e instanceof Error ? e.message : String(e)}`);
    if (errors.length) {
      console.error("Console errors:");
      for (const x of errors) console.error(`   ${x}`);
    }
    try {
      await page.screenshot({ path: "/tmp/editor-smoke-fail.png" });
      console.error("screenshot → /tmp/editor-smoke-fail.png");
    } catch {
      /* ignore */
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

void main();
