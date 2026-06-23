/**
 * End-to-end check for the editor's command palette + keyboard shortcuts.
 *
 * Drives the real browser, no model weights:
 *   open editor → rail Search button opens palette → Escape closes →
 *   ⌘K opens palette → type "page numbers" → Enter selects that tool →
 *   apply it (commits history) → ⌘Z undoes (Undo greys, Redo lights) →
 *   ⌘⇧Z redoes (Redo greys, Undo lights) — all asserted with no console errors.
 *
 * Requirements: Chrome at CHROME_PATH (default macOS path) and the dev server
 * at http://localhost:5173 (`vp dev`). Fixture: tests/fixtures/multipage.pdf.
 *
 * Run:  node --experimental-strip-types tests/e2e/command-palette.e2e.ts
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { KeyInput, Page } from "puppeteer-core";
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

async function waitForText(page: Page, re: RegExp, timeout = 15_000): Promise<void> {
  await page.waitForFunction(
    (src: string, flags: string) => new RegExp(src, flags).test(document.body.innerText),
    { timeout },
    re.source,
    re.flags,
  );
}

/** Read whether a top-bar icon button (by aria-label) is currently disabled. */
async function btnDisabled(page: Page, label: string): Promise<boolean> {
  return page.$eval(`button[aria-label="${label}"]`, (b) => (b as HTMLButtonElement).disabled);
}

/** Fire ⌘K (Meta on macOS — the handler also accepts Ctrl). */
async function pressMeta(page: Page, key: KeyInput, shift = false): Promise<void> {
  await page.keyboard.down("Meta");
  if (shift) await page.keyboard.down("Shift");
  await page.keyboard.press(key);
  if (shift) await page.keyboard.up("Shift");
  await page.keyboard.up("Meta");
}

const PALETTE = 'div[aria-label="Command palette"]';

async function paletteOpen(page: Page): Promise<boolean> {
  return (await page.$(PALETTE)) !== null;
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

    console.log(`→ Loading ${DEV_URL}`);
    await page.goto(DEV_URL, { waitUntil: "networkidle2" });

    // Clean draft store so the "unsaved edits" banner can't perturb the steps.
    await page.evaluate(
      () =>
        new Promise<void>((res) => {
          const r = indexedDB.deleteDatabase("cloakpdf-editor");
          r.onsuccess = r.onerror = r.onblocked = () => res();
        }),
    );

    // Editor-first entry: drop the fixture on the home dropzone.
    await page.waitForSelector("input[type=file]", { timeout: 15_000 });
    const input = await page.$("input[type=file]");
    if (!input) fail("Home dropzone file input not found.");
    await (input as { uploadFile: (...p: string[]) => Promise<void> }).uploadFile(FIXTURE_PATH);
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 20_000 });
    console.log("  ✓ editor opened");

    // 1. Rail Search button opens the palette; Escape closes it.
    const railSearch = await page.$('button[aria-label="Search tools"]');
    if (!railSearch) fail("Rail Search (palette) button not found.");
    await railSearch.click();
    await page.waitForSelector(PALETTE, { timeout: 5_000 });
    await page.screenshot({ path: "/tmp/command-palette.png" });
    await page.keyboard.press("Escape");
    await page.waitForFunction((sel) => !document.querySelector(sel), { timeout: 5_000 }, PALETTE);
    console.log(
      "  ✓ rail Search opens palette · Escape closes (screenshot → /tmp/command-palette.png)",
    );

    // 2. ⌘K opens; ⌘K again toggles closed.
    await pressMeta(page, "k");
    await page.waitForSelector(PALETTE, { timeout: 5_000 });
    if (!(await paletteOpen(page))) fail("⌘K did not open the palette.");
    await pressMeta(page, "k");
    await page.waitForFunction((sel) => !document.querySelector(sel), { timeout: 5_000 }, PALETTE);
    console.log("  ✓ ⌘K toggles palette open/closed");

    // 3. ⌘K → type an unambiguous query → Enter runs the top result.
    await pressMeta(page, "k");
    await page.waitForSelector(`${PALETTE} input`, { timeout: 5_000 });
    await page.type(`${PALETTE} input`, "crop"); // "crop" matches only the Crop tool
    await page.waitForFunction(
      (sel) => /crop/i.test(document.querySelector(`${sel} [role=option]`)?.textContent ?? ""),
      { timeout: 5_000 },
      PALETTE,
    );
    await page.keyboard.press("Enter");
    await page.waitForFunction((sel) => !document.querySelector(sel), { timeout: 5_000 }, PALETTE);
    await waitForText(page, /area to keep/i, 8_000); // Crop panel mounted = tool selected
    console.log("  ✓ ⌘K search → Enter selects the Crop tool");

    // 3b. Name-first ranking. "page numbers" also matches Strip furniture's
    //     description ("…page numbers"), but the NAME match must rank first — so
    //     the top row is Page numbers (Strip furniture still appears, lower), and
    //     a plain Enter selects the right tool.
    await pressMeta(page, "k");
    await page.waitForSelector(`${PALETTE} input`, { timeout: 5_000 });
    await page.type(`${PALETTE} input`, "page numbers");
    // Wait for the filtered list to settle with the name match on top (typing
    // updates React state async — reading options immediately races the render).
    await page.waitForFunction(
      (sel) =>
        (document.querySelector(`${sel} [role=option]`)?.textContent ?? "")
          .trim()
          .startsWith("Page numbers"),
      { timeout: 5_000 },
      PALETTE,
    );
    const labels = await page.$$eval(`${PALETTE} [role=option]`, (els) =>
      els.map((e) => (e.textContent ?? "").trim()),
    );
    if (!labels[0]?.startsWith("Page numbers"))
      fail(`Expected Page numbers ranked first, got: ${labels[0]}`);
    if (!labels.some((l) => l.startsWith("Strip furniture")))
      fail("Strip furniture should still appear via description match.");
    await page.keyboard.press("Enter"); // top result = Page numbers
    await page.waitForFunction((sel) => !document.querySelector(sel), { timeout: 5_000 }, PALETTE);
    await waitForText(page, /Add page numbers/i, 8_000); // panel mounted = tool selected
    console.log("  ✓ name-first ranking: Page numbers tops the desc match (Strip furniture)");

    // 4. Undo/redo keyboard shortcuts. At base both should be disabled; applying
    //    page numbers commits one history entry → Undo lights.
    if (!(await btnDisabled(page, "Undo"))) fail("Undo should be disabled at base.");
    if (!(await clickByText(page, "Add page numbers"))) fail("Page numbers Apply not found.");
    await waitForText(page, /Working/i, 10_000);
    await waitForText(page, /Add page numbers/i, 60_000); // restored after apply
    await page.waitForFunction(
      () => !(document.querySelector('button[aria-label="Undo"]') as HTMLButtonElement)?.disabled,
      { timeout: 10_000 },
    );
    console.log("  ✓ apply page numbers → Undo enabled");

    // ⌘Z undoes: Undo greys back out, Redo lights.
    await pressMeta(page, "z");
    await page.waitForFunction(
      () =>
        (document.querySelector('button[aria-label="Undo"]') as HTMLButtonElement)?.disabled &&
        !(document.querySelector('button[aria-label="Redo"]') as HTMLButtonElement)?.disabled,
      { timeout: 10_000 },
    );
    console.log("  ✓ ⌘Z undo (Undo→disabled, Redo→enabled)");

    // ⌘⇧Z redoes: Redo greys, Undo lights.
    await pressMeta(page, "z", true);
    await page.waitForFunction(
      () =>
        !(document.querySelector('button[aria-label="Undo"]') as HTMLButtonElement)?.disabled &&
        (document.querySelector('button[aria-label="Redo"]') as HTMLButtonElement)?.disabled,
      { timeout: 10_000 },
    );
    console.log("  ✓ ⌘⇧Z redo (Redo→disabled, Undo→enabled)");

    // 5. Auto-scroll: selecting a tool below the rail's fold (Attach is last)
    //    must scroll it into view. Assert it starts off-screen, then sits inside
    //    the rail viewport after selection.
    const attachVisible = () =>
      page.evaluate(() => {
        const rail = document.querySelector('button[aria-label="Search tools"]')
          ?.parentElement as HTMLElement | null;
        const btn = rail?.querySelector('button[aria-label="Attach"]') as HTMLElement | null;
        if (!rail || !btn) return null;
        const r = rail.getBoundingClientRect();
        const b = btn.getBoundingClientRect();
        return {
          overflows: rail.scrollHeight > rail.clientHeight,
          inView: b.top >= r.top - 1 && b.bottom <= r.bottom + 1,
        };
      });
    const pre = await attachVisible();
    if (!pre?.overflows) fail("Rail does not overflow at this viewport — can't test auto-scroll.");
    if (pre.inView) fail("Attach is already visible before selection — test precondition broken.");
    await pressMeta(page, "k");
    await page.waitForSelector(`${PALETTE} input`, { timeout: 5_000 });
    await page.type(`${PALETTE} input`, "attach");
    // "attach" also hits Scrub's description ("…attachments…"); name-first
    // ranking must still put the Attach tool on top, so Enter selects it.
    await page.waitForFunction(
      (sel) =>
        (document.querySelector(`${sel} [role=option]`)?.textContent ?? "")
          .trim()
          .startsWith("Attach"),
      { timeout: 5_000 },
      PALETTE,
    );
    await page.keyboard.press("Enter"); // top result = Attach
    await page.waitForFunction((sel) => !document.querySelector(sel), { timeout: 5_000 }, PALETTE);
    await page.waitForFunction(
      () => {
        const rail = document.querySelector('button[aria-label="Search tools"]')
          ?.parentElement as HTMLElement | null;
        const btn = rail?.querySelector('button[aria-label="Attach"]') as HTMLElement | null;
        if (!rail || !btn) return false;
        const r = rail.getBoundingClientRect();
        const b = btn.getBoundingClientRect();
        return b.top >= r.top - 1 && b.bottom <= r.bottom + 1;
      },
      { timeout: 5_000 },
    );
    console.log("  ✓ selecting a bottom tool auto-scrolls it into view");

    if (errors.length > 0) {
      console.error("✗ Console/page errors:");
      for (const e of errors) console.error(`   ${e}`);
      process.exit(1);
    }

    console.log("✓ Command palette + keyboard shortcuts passed.");
  } catch (e) {
    console.error(`✗ Failed: ${e instanceof Error ? e.message : String(e)}`);
    if (errors.length) for (const x of errors) console.error(`   ${x}`);
    try {
      await page.screenshot({ path: "/tmp/command-palette-fail.png" });
      console.error("screenshot → /tmp/command-palette-fail.png");
    } catch {
      /* ignore */
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

void main();
