/**
 * Headless end-to-end regression suite for CloakPDF's six non-AI
 * standalone tools.
 *
 * The suite drives the same card -> upload -> action flow a user does,
 * then validates the downloaded artifact (PDF page counts, encryption,
 * ZIP entries, or an embedded digital signature) where the tool produces
 * a file. Compare PDFs is validated through its rendered result summary.
 *
 * Requirements:
 *   - `vp dev` running at http://localhost:5173 (override with E2E_URL)
 *   - Chrome at CHROME_PATH
 *   - the four local PDFs documented in tests/fixtures/README.md
 *
 * Run:
 *   node --experimental-strip-types tests/e2e/standalone-tools.e2e.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { PDFDocument } from "@pdfme/pdf-lib";
import type { Browser, Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const FIXTURE_DIR = resolve(import.meta.dirname, "../fixtures");
const FIXTURES = {
  sample: join(FIXTURE_DIR, "sample.pdf"),
  multipage: join(FIXTURE_DIR, "multipage.pdf"),
  scanned: join(FIXTURE_DIR, "Sample Scanned Doc.pdf"),
  generativeAi: join(FIXTURE_DIR, "The Complete Generative AI Leader.pdf"),
} as const;

// Reuse shipped bitmap assets instead of adding generated image fixtures.
const IMAGE_FIXTURES = [
  resolve(import.meta.dirname, "../../public/icons/apple-touch-icon.png"),
  resolve(import.meta.dirname, "../../public/icons/og-image.png"),
] as const;

const EXPECTED_PAGE_COUNTS = {
  sample: 4,
  multipage: 40,
  scanned: 7,
  generativeAi: 16,
} as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}

async function clickButton(page: Page, label: string, timeout = 30_000): Promise<void> {
  await page.waitForFunction(
    (expected) =>
      Array.from(document.querySelectorAll("button")).some(
        (button) =>
          (button.textContent ?? "").trim() === expected &&
          !(button instanceof HTMLButtonElement && button.disabled),
      ),
    { timeout },
    label,
  );

  const clicked = await page.evaluate((expected) => {
    const button = Array.from(document.querySelectorAll("button")).find(
      (candidate) =>
        (candidate.textContent ?? "").trim() === expected &&
        !(candidate instanceof HTMLButtonElement && candidate.disabled),
    );
    if (!(button instanceof HTMLButtonElement)) return false;
    button.click();
    return true;
  }, label);
  assert(clicked, `Enabled button "${label}" vanished before it could be clicked.`);
}

async function uploadFiles(page: Page, selector: string, ...paths: string[]): Promise<void> {
  await page.waitForSelector(selector, { timeout: 30_000 });
  const input = await page.$(selector);
  assert(input, `File input not found: ${selector}`);
  await (input as { uploadFile: (...files: string[]) => Promise<void> }).uploadFile(...paths);
}

async function openTool(page: Page, title: string): Promise<void> {
  await page.goto(DEV_URL, { waitUntil: "networkidle2" });
  const clicked = await page.evaluate((expected) => {
    const cards = Array.from(document.querySelectorAll("button, a, [role=button]"));
    const card = cards.find(
      (candidate) => (candidate.querySelector("h3")?.textContent ?? "").trim() === expected,
    );
    if (!(card instanceof HTMLElement)) return false;
    card.click();
    return true;
  }, title);
  assert(clicked, `Home card not found: ${title}`);
  await page.waitForFunction(
    (expected) =>
      Array.from(document.querySelectorAll("h1")).some(
        (heading) => (heading.textContent ?? "").trim() === expected,
      ),
    { timeout: 30_000 },
    title,
  );
}

async function waitForDownload(
  directory: string,
  before: ReadonlySet<string>,
  timeout = 120_000,
): Promise<string> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const names = await readdir(directory);
    const completed = names.filter(
      (name) => !before.has(name) && !name.endsWith(".crdownload") && !name.endsWith(".tmp"),
    );
    for (const name of completed) {
      const path = join(directory, name);
      try {
        if ((await stat(path)).size > 0) return path;
      } catch {
        // Chrome may rename its temporary file between readdir and stat.
      }
    }
    await sleep(100);
  }
  throw new Error(`No completed download appeared in ${directory} within ${timeout}ms.`);
}

async function clickAndDownload(
  page: Page,
  directory: string,
  label: string,
  timeout = 120_000,
): Promise<string> {
  const before = new Set(await readdir(directory));
  await clickButton(page, label, 60_000);
  return waitForDownload(directory, before, timeout);
}

async function pdfPageCount(path: string): Promise<number> {
  const document = await PDFDocument.load(readFileSync(path), { ignoreEncryption: true });
  return document.getPageCount();
}

async function makeSinglePageFixture(source: string, destination: string): Promise<void> {
  const sourcePdf = await PDFDocument.load(readFileSync(source));
  const singlePagePdf = await PDFDocument.create();
  const [firstPage] = await singlePagePdf.copyPages(sourcePdf, [0]);
  singlePagePdf.addPage(firstPage);
  await writeFile(destination, await singlePagePdf.save());
}

/** Read the entry count from the ZIP end-of-central-directory record. */
function zipEntryCount(path: string): number {
  const bytes = readFileSync(path);
  const earliest = Math.max(0, bytes.length - 65_557);
  for (let offset = bytes.length - 22; offset >= earliest; offset--) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) return bytes.readUInt16LE(offset + 10);
  }
  throw new Error(`ZIP end-of-central-directory record missing: ${path}`);
}

async function withTool(
  browser: Browser,
  downloadRoot: string,
  title: string,
  slug: string,
  exercise: (page: Page, downloadDirectory: string) => Promise<void>,
): Promise<void> {
  const downloadDirectory = join(downloadRoot, slug);
  await mkdir(downloadDirectory, { recursive: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(60_000);

  const runtimeErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    runtimeErrors.push(`pageerror: ${error instanceof Error ? error.message : String(error)}`);
  });

  const cdp = await page.createCDPSession();
  await cdp.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadDirectory,
  });

  try {
    console.log(`\n→ ${title}`);
    await openTool(page, title);
    await exercise(page, downloadDirectory);
    assert(
      runtimeErrors.length === 0,
      `${title} emitted browser errors:\n${runtimeErrors.map((error) => `  ${error}`).join("\n")}`,
    );
  } catch (error) {
    const screenshot = `/tmp/cloakpdf-${slug}-e2e-fail.png`;
    await page.screenshot({ path: screenshot, fullPage: true }).catch(() => undefined);
    throw new Error(
      `${title}: ${error instanceof Error ? error.message : String(error)} (screenshot: ${screenshot})`,
      { cause: error },
    );
  } finally {
    await cdp.detach().catch(() => undefined);
    await page.close();
  }
}

async function main(): Promise<void> {
  assert(existsSync(CHROME_PATH), `Chrome not found at ${CHROME_PATH}. Set CHROME_PATH.`);
  for (const path of [...Object.values(FIXTURES), ...IMAGE_FIXTURES]) {
    assert(existsSync(path), `Required local fixture missing: ${path}`);
  }

  const downloadRoot = await mkdtemp(join(tmpdir(), "cloakpdf-standalone-e2e-"));
  // Compare renders two copies of every page at 1.5x and retains three
  // thumbnails per result. A one-page derivative keeps this smoke test focused
  // on the real comparison path without making headless Chrome reload under
  // the image-heavy four-page résumé's peak canvas memory.
  const compareFixture = join(downloadRoot, "sample-first-page.pdf");
  await makeSinglePageFixture(FIXTURES.sample, compareFixture);
  const browser = await launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
  });

  try {
    await withTool(browser, downloadRoot, "Merge PDFs", "merge", async (page, directory) => {
      await uploadFiles(
        page,
        'input[type="file"][aria-label="Drop PDF files here"]',
        FIXTURES.sample,
        FIXTURES.multipage,
        FIXTURES.scanned,
        FIXTURES.generativeAi,
      );
      const output = await clickAndDownload(page, directory, "Merge 4 files & Download");
      assert(basename(output) === "merged.pdf", `Unexpected merge filename: ${basename(output)}`);
      const expectedPages = Object.values(EXPECTED_PAGE_COUNTS).reduce(
        (sum, count) => sum + count,
        0,
      );
      assert(
        (await pdfPageCount(output)) === expectedPages,
        `Merged PDF did not contain all ${expectedPages} fixture pages.`,
      );
      console.log(`  ✓ uploaded 4 PDFs; merged.pdf has ${expectedPages} pages`);
    });

    await withTool(
      browser,
      downloadRoot,
      "Images to PDF",
      "images-to-pdf",
      async (page, directory) => {
        await uploadFiles(
          page,
          'input[type="file"][aria-label="Drop images here"]',
          ...IMAGE_FIXTURES,
        );
        const output = await clickAndDownload(page, directory, "Combine 2 images & Download");
        assert(basename(output) === "images.pdf", `Unexpected image PDF name: ${basename(output)}`);
        assert((await pdfPageCount(output)) === 2, "Images to PDF output did not have 2 pages.");
        console.log("  ✓ uploaded 2 shipped PNG assets; images.pdf has 2 pages");
      },
    );

    await withTool(
      browser,
      downloadRoot,
      "Extract Images",
      "extract-images",
      async (page, directory) => {
        await uploadFiles(
          page,
          'input[type="file"][aria-label="Drop a PDF file here"]',
          FIXTURES.scanned,
        );
        await page.waitForFunction(
          () => /\(\d+ images? found\)/.test(document.body.textContent ?? ""),
          { timeout: 120_000 },
        );
        const found = await page.evaluate(() => {
          const match = (document.body.textContent ?? "").match(/\((\d+) images? found\)/);
          return match ? Number(match[1]) : 0;
        });
        assert(found > 1, `Expected multiple embedded images in scanned fixture; found ${found}.`);
        await clickButton(page, "Select all");
        const output = await clickAndDownload(page, directory, `Download ${found} as ZIP`);
        assert(
          output.endsWith(".zip"),
          `Extract Images produced a non-ZIP file: ${basename(output)}`,
        );
        assert(
          zipEntryCount(output) === found,
          `Extracted ZIP entry count did not match the ${found} selected images.`,
        );
        assert(
          readFileSync(output).toString("latin1").includes(".png"),
          "Extracted ZIP did not contain PNG filenames.",
        );
        console.log(`  ✓ found, selected, and downloaded ${found} images as a validated ZIP`);
      },
    );

    await withTool(
      browser,
      downloadRoot,
      "PDF Password",
      "pdf-password",
      async (page, directory) => {
        await uploadFiles(
          page,
          'input[type="file"][aria-label="Drop a PDF file here"]',
          FIXTURES.sample,
        );
        await page.waitForSelector("#new-password", { timeout: 30_000 });
        await page.type("#new-password", "cloakpdf-e2e-password");
        await page.type("#confirm-password", "cloakpdf-e2e-password");
        const output = await clickAndDownload(page, directory, "Protect & Download");
        assert(
          basename(output) === "sample_protected.pdf",
          `Unexpected protected PDF name: ${basename(output)}`,
        );
        const protectedPdf = await PDFDocument.load(readFileSync(output), {
          ignoreEncryption: true,
        });
        assert(
          protectedPdf.getPageCount() === EXPECTED_PAGE_COUNTS.sample,
          "Protection changed page count.",
        );
        assert(
          protectedPdf.context.trailerInfo.Encrypt,
          "Protected PDF has no Encrypt trailer entry.",
        );
        await page.waitForFunction(() =>
          (document.body.textContent ?? "").includes("Password added successfully"),
        );
        console.log("  ✓ protected sample.pdf with AES-256; encrypted 4-page output downloaded");
      },
    );

    await withTool(browser, downloadRoot, "Compare PDFs", "compare-pdfs", async (page) => {
      await uploadFiles(
        page,
        'input[type="file"][aria-label="Drop the original PDF"]',
        compareFixture,
      );
      await uploadFiles(
        page,
        'input[type="file"][aria-label="Drop the modified PDF"]',
        compareFixture,
      );
      await clickButton(page, "Compare PDFs");
      await page.waitForFunction(
        () =>
          (document.body.textContent ?? "").includes("1 page compared") &&
          (document.body.textContent ?? "").includes("1 identical") &&
          !!document.querySelector('img[alt="Original — page 1"]') &&
          !!document.querySelector('img[alt="Modified — page 1"]'),
        { timeout: 120_000 },
      );
      const identicalBadge = await page.evaluate(() =>
        Array.from(document.querySelectorAll("span")).some(
          (span) => (span.textContent ?? "").trim() === "Identical",
        ),
      );
      assert(identicalBadge, "Comparing the same page was not classified as Identical.");
      console.log("  ✓ compared sample.pdf page 1 with itself; both sides rendered as Identical");
    });

    await withTool(
      browser,
      downloadRoot,
      "Digital Signature",
      "digital-signature",
      async (page, directory) => {
        await uploadFiles(
          page,
          'input[type="file"][aria-label="Drop a PDF file here"]',
          FIXTURES.sample,
        );
        await clickButton(page, "Generate");
        await page.waitForSelector("#common-name");
        await page.type("#common-name", "CloakPDF E2E");
        await clickButton(page, "Generate Certificate");
        await page.waitForFunction(
          () => (document.body.textContent ?? "").includes("Certificate Loaded"),
          { timeout: 120_000 },
        );
        await page.type("#sig-reason", "Standalone tool regression");
        await page.type("#sig-location", "Local browser");
        await page.type("#sig-contact", "e2e@cloakpdf.test");
        const output = await clickAndDownload(page, directory, "Sign & Download PDF", 120_000);
        assert(
          basename(output) === "sample_signed.pdf",
          `Unexpected signed PDF name: ${basename(output)}`,
        );
        assert(
          (await pdfPageCount(output)) === EXPECTED_PAGE_COUNTS.sample,
          "Signing changed page count.",
        );
        const signedBytes = readFileSync(output).toString("latin1");
        assert(
          /\/ByteRange\s*\[/.test(signedBytes),
          "Signed PDF has no ByteRange signature entry.",
        );
        assert(
          /\/SubFilter\s*\/adbe\.pkcs7\.detached/.test(signedBytes),
          "Signed PDF has no detached PKCS#7 signature marker.",
        );
        await page.waitForFunction(() =>
          (document.body.textContent ?? "").includes("PDF signed and downloaded successfully"),
        );
        console.log("  ✓ generated a self-signed certificate and downloaded a signed 4-page PDF");
      },
    );

    console.log("\n✓ All 6 non-AI standalone tools passed their headless browser workflows.");
  } finally {
    await browser.close();
    await rm(downloadRoot, { recursive: true, force: true });
  }
}

void main().catch((error) => {
  console.error(
    `\n✗ Standalone tools e2e failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
