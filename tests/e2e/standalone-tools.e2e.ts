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
 *   - the local PDFs documented in tests/fixtures/README.md, or generated
 *     demo PDFs with E2E_DEMO_FIXTURES=1
 *
 * Run:
 *   node --experimental-strip-types tests/e2e/standalone-tools.e2e.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { PDFDocument } from "@pdfme/pdf-lib";
import type { Browser, Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

declare global {
  interface Window {
    __extractProbe?: {
      calls: number;
      terminated: number;
      release?: () => void;
      canvas?: HTMLCanvasElement;
    };
  }
}

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const FIXTURE_DIR = resolve(import.meta.dirname, "../fixtures");
const DEMO = process.env.E2E_DEMO_FIXTURES === "1";
const FIXTURES = DEMO
  ? ({
      sample: join(FIXTURE_DIR, "demo/single.pdf"),
      multipage: join(FIXTURE_DIR, "demo/multipage.pdf"),
      scanned: join(FIXTURE_DIR, "demo/scanned.pdf"),
      generativeAi: join(FIXTURE_DIR, "demo/text.pdf"),
    } as const)
  : ({
      sample: join(FIXTURE_DIR, "sample.pdf"),
      multipage: join(FIXTURE_DIR, "multipage.pdf"),
      scanned: join(FIXTURE_DIR, "Sample Scanned Doc.pdf"),
      generativeAi: join(FIXTURE_DIR, "The Complete Generative AI Leader.pdf"),
    } as const);

// Reuse shipped bitmap assets instead of adding generated image fixtures.
const IMAGE_FIXTURES = [
  resolve(import.meta.dirname, "../../public/icons/apple-touch-icon.png"),
  resolve(import.meta.dirname, "../../public/icons/og-image.png"),
] as const;

const EXPECTED_PAGE_COUNTS = DEMO
  ? ({
      sample: 1,
      multipage: 4,
      scanned: 3,
      generativeAi: 16,
    } as const)
  : ({
      sample: 4,
      multipage: 33,
      scanned: 7,
      generativeAi: 16,
    } as const);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}

async function clickButton(page: Page, label: string, timeout = 30_000): Promise<void> {
  await page.waitForFunction(
    (expected) =>
      Array.from(document.querySelectorAll("button")).some((button) => {
        // Ignore reserved hidden labels while preserving the source casing;
        // innerText applies legacy uppercase CSS on unmigrated controls.
        const copy = button.cloneNode(true) as HTMLElement;
        copy.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
        return (
          copy.textContent?.trim() === expected &&
          !button.disabled &&
          button.getAttribute("aria-disabled") !== "true"
        );
      }),
    { timeout },
    label,
  );

  const clicked = await page.evaluate((expected) => {
    const button = Array.from(document.querySelectorAll("button")).find((candidate) => {
      const copy = candidate.cloneNode(true) as HTMLElement;
      copy.querySelectorAll('[aria-hidden="true"]').forEach((node) => node.remove());
      return (
        copy.textContent?.trim() === expected &&
        !candidate.disabled &&
        candidate.getAttribute("aria-disabled") !== "true"
      );
    });
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
      await page.waitForFunction(() => document.querySelectorAll(".pdf-queue-row").length === 4);
      await clickButton(page, "A → Z");
      const removeLabel = `Remove ${basename(FIXTURES.multipage)}`;
      await page.locator(`button[aria-label="${removeLabel}"]`).click();
      await page.waitForFunction(
        () => document.activeElement?.textContent?.trim() === "Undo removal",
      );
      await clickButton(page, "Undo removal");
      await page.waitForFunction(
        (label) => document.activeElement?.getAttribute("aria-label") === label,
        {},
        removeLabel,
      );
      await clickButton(page, "None");
      const order = await page.$$eval(".air-collection-name p", (nodes) =>
        nodes.map((node) => node.textContent),
      );
      assert(
        JSON.stringify(order) ===
          JSON.stringify(Object.values(FIXTURES).map((file) => basename(file))),
        "Sort/remove/undo changed the manual merge order.",
      );
      console.log("  ✓ sorted removal/undo restores keyboard focus and original manual order");
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
          () =>
            /\d+ images? found/.test(
              document.querySelector("[data-extract-heading]")?.textContent ?? "",
            ),
          { timeout: 120_000 },
        );
        const found = await page.evaluate(() => {
          const match = (document.querySelector("[data-extract-heading]")?.textContent ?? "").match(
            /(\d+) images? found/,
          );
          return match ? Number(match[1]) : 0;
        });
        assert(found > 1, `Expected multiple embedded images in scanned fixture; found ${found}.`);
        const choices = await page.$$('.pdf-extract-grid input[type="checkbox"]');
        assert(choices.length === found, "Extracted image count and checkbox count differ.");
        assert(
          await page.$eval(
            ".pdf-operation-actions button",
            (button) => button.getAttribute("aria-disabled") === "true",
          ),
          "Empty selection can download.",
        );
        await choices[0].focus();
        await page.keyboard.press("Space");
        await page.waitForFunction(
          () => document.querySelector<HTMLInputElement>(".pdf-extract-grid input")?.checked,
        );
        const png = await clickAndDownload(page, directory, "Download image");
        const pngBytes = readFileSync(png);
        assert(
          pngBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
          "Single-image output is not a PNG.",
        );
        const displayedSize = await page.$eval(".pdf-extract-caption .air-help", (node) =>
          node.textContent
            ?.match(/(\d+) × (\d+)/)
            ?.slice(1)
            .map(Number),
        );
        assert(
          displayedSize &&
            pngBytes.readUInt32BE(16) === displayedSize[0] &&
            pngBytes.readUInt32BE(20) === displayedSize[1],
          "Downloaded PNG does not retain the displayed full resolution.",
        );
        await page.waitForFunction(() =>
          /Download requested/.test(document.querySelector(".pdf-result")?.textContent ?? ""),
        );
        await clickButton(page, "Select all");
        // Fail one actual PNG read in ZIP assembly, then retry without replacing
        // the file or selection. No production test switches are involved.
        await page.evaluate(() => {
          const original = Reflect.get(
            Blob.prototype,
            "arrayBuffer",
          ) as typeof Blob.prototype.arrayBuffer;
          Blob.prototype.arrayBuffer = function () {
            if (this.type === "image/png") {
              Blob.prototype.arrayBuffer = original;
              return Promise.reject(new Error("Deliberate ZIP read failure"));
            }
            return original.call(this);
          };
        });
        await clickButton(page, `Download ${found} as ZIP`);
        await page.waitForFunction(() =>
          /Your images and selection are still here/.test(
            document.querySelector('[role="alert"]')?.textContent ?? "",
          ),
        );
        assert(
          (await page.$$eval(".pdf-extract-grid input:checked", (nodes) => nodes.length)) === found,
          "Download failure discarded selection.",
        );
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
        const allNames = execFileSync("unzip", ["-Z1", output], { encoding: "utf8" })
          .trim()
          .split("\n");
        assert(
          execFileSync("unzip", ["-p", output, basename(png)], {
            maxBuffer: 64 * 1024 * 1024,
          }).equals(pngBytes),
          "ZIP changed the individually downloaded PNG bytes.",
        );
        const allArchive = join(directory, "all-images.zip");
        await writeFile(allArchive, readFileSync(output));
        await rm(output);
        await clickButton(page, "Clear");
        // Select in reverse order; the archive must preserve document order.
        await choices[choices.length - 1].click();
        await choices[0].click();
        const partial = await clickAndDownload(page, directory, "Download 2 as ZIP");
        const partialNames = execFileSync("unzip", ["-Z1", partial], { encoding: "utf8" })
          .trim()
          .split("\n");
        assert(
          JSON.stringify(partialNames) ===
            JSON.stringify([allNames[0], allNames[allNames.length - 1]]),
          "Partial ZIP did not preserve the selected images in document order.",
        );
        for (const name of partialNames)
          assert(
            execFileSync("unzip", ["-p", partial, name], { maxBuffer: 64 * 1024 * 1024 }).equals(
              execFileSync("unzip", ["-p", allArchive, name], { maxBuffer: 64 * 1024 * 1024 }),
            ),
            "Partial selection changed image bytes.",
          );
        await clickButton(page, "Change file");
        assert(
          await page.$eval('input[type="file"]', (input) => document.activeElement === input),
          "Change file did not return focus to intake.",
        );
        const emptyPath = join(directory, "no-images.pdf");
        const empty = await PDFDocument.create();
        empty.addPage();
        await writeFile(emptyPath, await empty.save());
        await uploadFiles(page, 'input[type="file"]', emptyPath);
        await page.waitForFunction(() =>
          /No embedded images found/.test(
            document.querySelector("[data-extract-heading]")?.textContent ?? "",
          ),
        );
        assert(
          (await page.$(".pdf-file-info")) !== null && (await page.$('[role="alert"]')) === null,
          "A valid image-free PDF became a load error or lost its identity.",
        );
        console.log(
          `  ✓ keyboard selection, full-resolution PNG, all ${found} images and partial ZIPs preserve bytes/order; empty result and intake focus pass`,
        );
        await clickButton(page, "Change file");
        await page.evaluate(() => {
          window.__extractProbe = { calls: 0, terminated: 0 };
          const original = Reflect.get(
            HTMLCanvasElement.prototype,
            "toBlob",
          ) as typeof HTMLCanvasElement.prototype.toBlob;
          HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
            return original.call(
              this,
              (blob) => {
                const probe = window.__extractProbe!;
                probe.calls++;
                if (probe.calls === 2) {
                  probe.canvas = this;
                  probe.release = () => callback(blob);
                } else callback(blob);
              },
              ...args,
            );
          };
          const terminate = Reflect.get(
            Worker.prototype,
            "terminate",
          ) as typeof Worker.prototype.terminate;
          Worker.prototype.terminate = function () {
            window.__extractProbe!.terminated++;
            return terminate.call(this);
          };
        });
        await uploadFiles(page, 'input[type="file"]', FIXTURES.scanned);
        await page.waitForFunction(
          () =>
            document.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow") === "1" &&
            typeof window.__extractProbe?.release === "function",
        );
        assert(
          await page.evaluate(() => document.activeElement?.textContent?.trim() === "Cancel scan"),
          "Loading did not retain a reachable cancellation focus.",
        );
        await clickButton(page, "Cancel scan");
        await uploadFiles(page, 'input[type="file"]', emptyPath);
        await page.waitForFunction(
          () =>
            document.querySelector("[data-extract-heading]")?.textContent ===
            "No embedded images found",
        );
        await page.evaluate(() => window.__extractProbe!.release!());
        await page.waitForFunction(
          () =>
            window.__extractProbe!.canvas!.width === 0 && window.__extractProbe!.terminated >= 2,
        );
        assert(
          await page.$eval(
            "[data-extract-heading]",
            (node) => node.textContent === "No embedded images found",
          ),
          "Cancelled scan overwrote its replacement.",
        );
        console.log(
          "  ✓ ZIP failure/retry retains selection; cancelling a measured scan releases the worker/canvas and cannot replace newer results",
        );
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
          basename(output) === `${basename(FIXTURES.sample, ".pdf")}_protected.pdf`,
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
        console.log(`  ✓ AES-256 encrypted ${EXPECTED_PAGE_COUNTS.sample}-page output downloaded`);
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
          basename(output) === `${basename(FIXTURES.sample, ".pdf")}_signed.pdf`,
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
        console.log(
          `  ✓ generated a self-signed certificate and downloaded a signed ${EXPECTED_PAGE_COUNTS.sample}-page PDF`,
        );
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
