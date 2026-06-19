/**
 * Regression smoke for page rotation in the editor's Organize tool.
 *
 * Guards the two bugs fixed in this area:
 *   1. Rotate → Apply → Export must bake the rotation into the bytes (a single
 *      90° turn lands /Rotate = 90; it was previously lost / not committed).
 *   2. After Apply the pending plan must be CLEARED, so a second rotate+apply
 *      adds exactly another 90° (→ 180). With the old stale-state bug the plan
 *      survived the first Apply, double-applied in the preview, and a second
 *      Apply compounded to 270° instead of 180°.
 *   3. With unapplied page changes pending, the Export modal warns rather than
 *      silently dropping them.
 *
 * Requirements: Chrome at CHROME_PATH and the dev server at localhost:5173
 * (`vp dev`). Fixture: tests/fixtures/multipage.pdf (page 1 is portrait).
 *
 * Run:  node --experimental-strip-types tests/e2e/rotate.e2e.ts
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Page } from "puppeteer-core";
import { launch } from "puppeteer-core";
import { PDFDocument } from "@pdfme/pdf-lib";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FIXTURE_PATH = resolve(import.meta.dirname, "../fixtures/multipage.pdf");
const USER_DATA_DIR = resolve(import.meta.dirname, "../.puppeteer-profile-editor");

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
async function bodyText(page: Page): Promise<string> {
  return page.evaluate(() => document.body.innerText);
}
async function waitForFile(dir: string, re: RegExp, timeout = 60_000): Promise<string> {
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
  const browser = await launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  const errors: string[] = [];
  try {
    page.setDefaultTimeout(30_000);
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e: unknown) => errors.push(String(e instanceof Error ? e.message : e)));

    const dir = mkdtempSync(join(tmpdir(), "rotate-e2e-"));
    const cdp = await page.target().createCDPSession();
    await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: dir });

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
    await (input as { uploadFile: (...p: string[]) => Promise<void> }).uploadFile(FIXTURE_PATH);
    await page.waitForSelector('img[alt="Page 1"]', { timeout: 20_000 });

    const boardShown = (): Promise<boolean> =>
      page
        .waitForSelector('button[aria-label="Rotate page 1"]', { timeout: 8_000 })
        .then(() => true)
        .catch(() => false);
    // Open the Organize board regardless of the tool's current toggle state.
    const enterOrganize = async (): Promise<void> => {
      if (await boardShown()) return;
      await page.click('button[aria-label="Organize"]');
      if (!(await boardShown())) {
        await page.click('button[aria-label="Organize"]');
        if (!(await boardShown())) fail("Could not open the Organize board.");
      }
    };
    const rotatePage1 = async (): Promise<void> => {
      await page.click('button[aria-label="Rotate page 1"]');
      await new Promise((r) => setTimeout(r, 300));
    };
    const applyChanges = async (): Promise<void> => {
      if (!(await clickByText(page, "Apply changes"))) fail("Apply changes button not found.");
      await new Promise((r) => setTimeout(r, 2500)); // rebuild doc + re-render thumbnails
    };
    const hasButton = (label: string): Promise<boolean> =>
      page.evaluate(
        (t) =>
          Array.from(document.querySelectorAll("button, a, [role=button]")).some(
            (e) => (e.textContent ?? "").trim().toLowerCase() === t,
          ),
        label.toLowerCase(),
      );
    // The top-bar Export is hidden while the Organize tool is active — toggle it
    // off if needed so Export is reachable.
    const ensureExportable = async (): Promise<void> => {
      if (await hasButton("Export")) return;
      await page.click('button[aria-label="Organize"]');
      await new Promise((r) => setTimeout(r, 700));
      if (!(await hasButton("Export"))) fail("Export button never became available.");
    };
    // Export a plain PDF and return page 0's baked /Rotate angle.
    const exportRotation = async (): Promise<number> => {
      await ensureExportable();
      for (const f of readdirSync(dir))
        if (statSync(join(dir, f)).isFile()) unlinkSync(join(dir, f));
      if (!(await clickByText(page, "Export"))) fail("Export button not found.");
      await page.waitForSelector('button[aria-label="PDF"]', { timeout: 5_000 });
      await page.click('button[aria-label="PDF"]');
      if (!(await clickByText(page, "Download"))) fail("Download button not found.");
      const dl = await waitForFile(dir, /\.pdf$/i);
      const pdf = await PDFDocument.load(readFileSync(join(dir, dl)));
      return pdf.getPage(0).getRotation().angle;
    };

    // 1. Rotate but DON'T apply → Export must warn (bug #1: the pending plan
    //    lives in tool state, not the bytes, so export would otherwise silently
    //    drop it).
    await enterOrganize();
    await rotatePage1();
    await ensureExportable();
    if (!(await clickByText(page, "Export"))) fail("Export button not found (warn check).");
    await page.waitForSelector('button[aria-label="PDF"]', { timeout: 5_000 });
    if (!/unapplied page changes/i.test(await bodyText(page)))
      fail("Export modal did not warn about unapplied page changes.");
    await page.keyboard.press("Escape");
    await new Promise((r) => setTimeout(r, 400));
    console.log("  ✓ export warns about unapplied page changes");

    // 2. Apply, Export: a single 90° turn is baked.
    await enterOrganize();
    await applyChanges();
    const rot1 = await exportRotation();
    if (rot1 !== 90) fail(`After one rotate+apply, expected /Rotate 90, got ${rot1}.`);
    console.log("  ✓ rotate + apply bakes /Rotate = 90 into the export");

    // 3. Rotate + apply AGAIN: the first plan must have been cleared, so this
    //    adds exactly one more 90° (→ 180). The old stale-state bug compounded
    //    to 270° here.
    await enterOrganize();
    await rotatePage1();
    await applyChanges();
    const rot2 = await exportRotation();
    if (rot2 !== 180)
      fail(
        `After a second rotate+apply, expected /Rotate 180, got ${rot2} (stale plan compounded?).`,
      );
    console.log("  ✓ second rotate + apply compounds to 180 (no stale double-apply)");

    if (errors.length > 0) {
      console.error("✗ Console/page errors during rotation smoke:");
      for (const e of errors) console.error(`   ${e}`);
      process.exit(1);
    }
    console.log("✓ Rotation smoke passed — bake, no stale compounding, export warns when pending.");
  } catch (e) {
    console.error(`✗ Rotation smoke failed: ${e instanceof Error ? e.message : String(e)}`);
    try {
      await page.screenshot({ path: "/tmp/rotate-e2e-fail.png" });
      console.error("screenshot → /tmp/rotate-e2e-fail.png");
    } catch {
      /* ignore */
    }
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
void main();
