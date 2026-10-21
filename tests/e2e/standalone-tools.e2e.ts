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
 *   - OpenSSL/LibreSSL with `cms` for independent signature verification
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
import { PDFDocument, PDFDict, PDFName, PDFNumber, PDFRawStream, rgb } from "@pdfme/pdf-lib";
import forge from "node-forge";
import { buildSelfSignedCert } from "../../src/utils/self-signed-cert.ts";
import { protectPdf, unlockPdf } from "../../src/utils/pdf-security.ts";
import type { Browser, Page } from "puppeteer-core";
import { launch } from "puppeteer-core";

declare global {
  interface Window {
    __compareProbe?: {
      created: string[];
      revoked: string[];
      release?: () => void;
      restore: () => void;
    };
    __signatureImport?: {
      original: typeof File.prototype.arrayBuffer;
      release?: () => Promise<void>;
    };
    __signatureWorker?: { calls: number; terminated: number; original: typeof Worker };
    __passwordProbe?: {
      release?: () => Promise<void>;
      original: typeof File.prototype.arrayBuffer;
    };
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
  // A remote module can still be loading when networkidle2 allows two active
  // requests. Wait for the actual tool before inspecting/clicking its card.
  await page.waitForFunction(
    (expected) =>
      Array.from(document.querySelectorAll("button, a, [role=button]")).some(
        (candidate) => (candidate.querySelector("h3")?.textContent ?? "").trim() === expected,
      ),
    { timeout: 30_000 },
    title,
  );
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
        await page.click('[aria-label="Show new password"]');
        assert(
          await page.$eval("#new-password", (input) => (input as HTMLInputElement).type === "text"),
          "Password visibility did not change.",
        );
        await page.click('[aria-label="Hide new password"]');
        await page.type("#confirm-password", "different");
        await page.focus("#new-password");
        assert(
          await page.$eval(
            "#confirm-password",
            (input) => input.getAttribute("aria-invalid") === "true",
          ),
          "Mismatch was not exposed on blur.",
        );
        await page.$eval("#confirm-password", (input) => {
          (input as HTMLInputElement).select();
        });
        await page.type("#confirm-password", "cloakpdf-e2e-password");
        assert(
          await page.$eval("#confirm-password", (input) => !input.hasAttribute("aria-invalid")),
          "Corrected mismatch stayed invalid until blur.",
        );
        await page.click(".pdf-password-permissions > label input");
        await page.click('input[aria-label="Copy text & images"]');
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
        const encryption = protectedPdf.context.lookup(
          protectedPdf.context.trailerInfo.Encrypt,
          PDFDict,
        );
        assert(
          encryption.lookup(PDFName.of("P"), PDFNumber).asNumber() === -44,
          "Selected permission bits were not preserved.",
        );
        assert(
          encryption.lookup(PDFName.of("V"), PDFNumber).asNumber() === 5,
          "Protection changed from AES-256.",
        );
        const encryptedFile = new File([readFileSync(output)], "protected.pdf", {
          type: "application/pdf",
        });
        const decoded = await PDFDocument.load(
          await unlockPdf(encryptedFile, "cloakpdf-e2e-password"),
        );
        const original = await PDFDocument.load(readFileSync(FIXTURES.sample));
        const streams = (doc: PDFDocument) =>
          doc.context
            .enumerateIndirectObjects()
            .map(([, object]) => object)
            .filter((object): object is PDFRawStream => object instanceof PDFRawStream)
            .map((object) => Buffer.from(object.contents).toString("base64"))
            .sort();
        assert(
          JSON.stringify(streams(decoded)) === JSON.stringify(streams(original)),
          "Protection roundtrip changed source streams.",
        );
        await clickButton(page, "Change file");
        assert(
          await page.$eval('input[type="file"]', (input) => input === document.activeElement),
          "File change lost intake focus.",
        );
        await uploadFiles(page, 'input[type="file"]', output);
        await page.waitForSelector("#current-password");
        await page.type("#current-password", "incorrect");
        await clickButton(page, "Unlock & Download");
        await page.waitForFunction(
          () =>
            document.querySelector("#current-password")?.getAttribute("aria-invalid") === "true",
        );
        assert(
          await page.$eval(
            "#current-password",
            (input) =>
              input === document.activeElement && (input as HTMLInputElement).value === "incorrect",
          ),
          "Wrong-password recovery discarded value or failed to focus input.",
        );
        await page.$eval("#current-password", (input) => {
          (input as HTMLInputElement).select();
        });
        await page.type("#current-password", "cloakpdf-e2e-password");
        const unlockedPath = await clickAndDownload(page, directory, "Unlock & Download");
        const unlocked = await PDFDocument.load(readFileSync(unlockedPath));
        assert(
          !unlocked.context.trailerInfo.Encrypt &&
            unlocked.getPageCount() === original.getPageCount(),
          "Unlocked output is encrypted or changed page count.",
        );
        assert(
          JSON.stringify(streams(unlocked)) === JSON.stringify(streams(original)),
          "Unlocked output changed source streams.",
        );
        await clickButton(page, "Unlock & edit");
        await page.waitForSelector('img[alt="Page 1"]', { timeout: 60_000 });
        console.log(
          `  ✓ AES-256/permissions, visibility/mismatch recovery, wrong-password retry, source-stream fidelity and unlock-to-editor pass`,
        );
        await openTool(page, "PDF Password");
        const emptyProtected = join(directory, "empty-password.pdf");
        await writeFile(
          emptyProtected,
          await protectPdf(new File([readFileSync(FIXTURES.sample)], "sample.pdf"), ""),
        );
        await uploadFiles(page, 'input[type="file"]', emptyProtected);
        await page.waitForSelector("#current-password");
        const emptyUnlocked = await clickAndDownload(page, directory, "Unlock & Download");
        assert(
          (await PDFDocument.load(readFileSync(emptyUnlocked))).getPageCount() ===
            original.getPageCount(),
          "Empty-password unlock failed.",
        );
        console.log("  ✓ Empty-password PDF unlock remains supported");
        await clickButton(page, "Change file");
        await page.evaluate(() => {
          const original = Reflect.get(
            File.prototype,
            "arrayBuffer",
          ) as typeof File.prototype.arrayBuffer;
          window.__passwordProbe = { original };
          File.prototype.arrayBuffer = function () {
            return new Promise((resolve, reject) => {
              window.__passwordProbe!.release = async () => {
                try {
                  resolve(await original.call(this));
                } catch (error) {
                  reject(error);
                }
              };
            });
          };
        });
        await uploadFiles(page, 'input[type="file"]', output);
        await page.waitForFunction(() => document.activeElement?.textContent === "Cancel check");
        await clickButton(page, "Cancel check");
        assert(
          await page.$eval('input[type="file"]', (input) => input === document.activeElement),
          "Cancelled detection did not focus intake.",
        );
        await page.evaluate(() => {
          File.prototype.arrayBuffer = window.__passwordProbe!.original;
        });
        await uploadFiles(page, 'input[type="file"]', FIXTURES.sample);
        await page.waitForSelector("#new-password");
        await page.evaluate(async () => {
          await window.__passwordProbe!.release!();
        });
        // Two browser frames let the old parser's promise and React updates settle.
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        assert(
          (await page.$("#new-password")) && !(await page.$("#current-password")),
          "Obsolete encrypted-file detection replaced the newer plain PDF.",
        );
        console.log("  ✓ Cancelling detection preserves the newer file and restores intake focus");
      },
    );

    await withTool(
      browser,
      downloadRoot,
      "Compare PDFs",
      "compare-pdfs",
      async (page, directory) => {
        const originalInput = 'input[type="file"][aria-label="Drop the original PDF"]';
        const modifiedInput = 'input[type="file"][aria-label="Drop the modified PDF"]';
        const startComparison = async (pages: number) => {
          await clickButton(page, "Compare PDFs");
          await page.waitForFunction(
            (count) =>
              document.querySelector("#comparison-heading")?.textContent ===
              `${count} ${count === 1 ? "page" : "pages"} compared`,
            { timeout: 120_000 },
            pages,
          );
        };
        await page.evaluate(() => {
          const create = URL.createObjectURL.bind(URL),
            revoke = URL.revokeObjectURL.bind(URL);
          const probe = {
            created: [] as string[],
            revoked: [] as string[],
            restore: () => {
              URL.createObjectURL = create;
              URL.revokeObjectURL = revoke;
            },
          };
          window.__compareProbe = probe;
          URL.createObjectURL = (blob) => {
            const url = create(blob);
            probe.created.push(url);
            return url;
          };
          URL.revokeObjectURL = (url) => {
            probe.revoked.push(url);
            revoke(url);
          };
        });
        await uploadFiles(page, originalInput, compareFixture);
        await uploadFiles(page, modifiedInput, compareFixture);
        await startComparison(1);
        assert(
          (await page.$('img[alt="Original — page 1"]')) &&
            (await page.$('img[alt="Modified — page 1"]')),
          "Both comparison sides must render.",
        );
        assert(
          (await page.$eval(".pdf-compare-page-status", (el) => el.textContent))?.includes(
            "Identical",
          ),
          "Same-page comparison should be identical.",
        );
        await clickButton(page, "Difference overlay");
        await page.waitForSelector('img[alt="Differences — page 1"]');
        const transparent = await page.$eval('img[alt="Differences — page 1"]', async (element) => {
          const image = element as HTMLImageElement;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext("2d")!;
          context.drawImage(image, 0, 0);
          const bytes = context.getImageData(0, 0, canvas.width, canvas.height).data;
          const clear = bytes.every((value, index) => index % 4 !== 3 || value === 0);
          canvas.width = canvas.height = 0;
          return clear;
        });
        assert(transparent, "Identical overlay retained raster-noise highlights.");
        await page.locator('input[type="checkbox"]').click();
        assert(
          !(await page.$('img[alt^="Differences"]')),
          "Difference toggle did not hide the overlay.",
        );
        await clickButton(page, "New comparison");
        assert(
          await page.evaluate(
            () => document.activeElement?.getAttribute("aria-label") === "Drop the original PDF",
          ),
          "Reset did not restore intake focus.",
        );
        assert(
          await page.evaluate(() =>
            window.__compareProbe!.created.every((url) =>
              window.__compareProbe!.revoked.includes(url),
            ),
          ),
          "Reset leaked result URLs.",
        );

        // One real content edit, one missing page and different page geometry.
        const sourceBytes = readFileSync(compareFixture);
        const modified = await PDFDocument.load(sourceBytes);
        modified
          .getPage(0)
          .drawRectangle({ x: 20, y: 20, width: 100, height: 100, color: rgb(0, 0, 0) });
        modified
          .getPage(0)
          .setSize(modified.getPage(0).getWidth() + 60, modified.getPage(0).getHeight());
        modified.addPage([300, 200]).drawText("Extra page");
        const changed = join(directory, "changed.pdf");
        await writeFile(changed, await modified.save());
        await uploadFiles(page, originalInput, compareFixture);
        await uploadFiles(page, modifiedInput, changed);
        await startComparison(2);
        assert(
          (await page.$eval(".pdf-compare-page-status", (el) => el.textContent))?.includes(
            "% changed",
          ),
          "Content and size changes were not detected.",
        );
        await clickButton(page, "Difference overlay");
        await page.waitForSelector('img[alt="Differences — page 1"]');
        const geometry = await page.$$eval(".pdf-compare-plane img", (images) =>
          images.map((image) => {
            const node = image as HTMLImageElement;
            return { width: node.getBoundingClientRect().width, natural: node.naturalWidth };
          }),
        );
        assert(
          geometry[0].width < geometry[1].width &&
            Math.abs(
              geometry[0].width / geometry[1].width - geometry[0].natural / geometry[1].natural,
            ) < 0.005,
          "Different page sizes were stretched in the overlay.",
        );
        await page.locator('button[aria-label="Next page"]').click();
        assert(
          (await page.$eval(".pdf-compare-page-status", (el) => el.textContent))?.includes(
            "Only in modified PDF",
          ),
          "Missing original page status is absent.",
        );
        assert(
          await page.$eval(
            'button[aria-label="Next page"]',
            (el) => (el as HTMLButtonElement).disabled,
          ),
          "Next should be disabled at the last page.",
        );
        await page.setViewport({ width: 320, height: 568 });
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "32px";
        });
        await page.waitForFunction(() => {
          const strip = document.querySelector(".pdf-compare-pages")!.getBoundingClientRect();
          const selected = document
            .querySelector('.pdf-compare-pages [aria-pressed="true"]')!
            .getBoundingClientRect();
          return selected.left >= strip.left && selected.right <= strip.right;
        });
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "";
        });
        await page.setViewport({ width: 1280, height: 900 });
        await clickButton(page, "Side by side");
        assert(
          (await page.$eval(".pdf-compare-missing", (el) => el.textContent))?.includes("No page 2"),
          "Missing-page preview disappeared.",
        );
        await page.focus('.pdf-compare-pages button[aria-label^="Page 1:"]');
        await page.keyboard.press("Enter");
        await page.waitForFunction(
          () =>
            document
              .querySelector('.pdf-compare-pages button[aria-label^="Page 1:"]')
              ?.getAttribute("aria-pressed") === "true",
        );
        assert(
          readFileSync(compareFixture).equals(sourceBytes),
          "Comparison modified its source file.",
        );
        await page.locator('[data-compare-side="1"] .pdf-file-info button').click();
        assert(
          await page.evaluate(() =>
            window.__compareProbe!.created.every((url) =>
              window.__compareProbe!.revoked.includes(url),
            ),
          ),
          "Replacing one file leaked comparison URLs.",
        );
        assert(
          await page.$('[data-compare-side="0"] .pdf-file-info'),
          "Replacing modified PDF lost the original.",
        );
        const broken = join(directory, "broken.pdf");
        await writeFile(broken, "Not a PDF");
        await uploadFiles(page, modifiedInput, broken);
        await page.waitForSelector(".pdf-compare-read-error");
        await page.locator('[data-compare-side="1"] .pdf-file-info button').click();
        const encrypted = join(directory, "encrypted.pdf");
        await writeFile(
          encrypted,
          await protectPdf(new File([sourceBytes], "source.pdf"), "test-password", "test-owner"),
        );
        await uploadFiles(page, modifiedInput, encrypted);
        await page.waitForSelector(".pdf-encrypted");
        await clickButton(page, "Choose another file");
        await uploadFiles(page, modifiedInput, compareFixture);
        // Hold a real encoder callback so cancel/error/retry are deterministic.
        await page.evaluate(() => {
          // Preserve the native receiver when invoking the held encoder.
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const original = HTMLCanvasElement.prototype.toBlob;
          HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
            HTMLCanvasElement.prototype.toBlob = original;
            window.__compareProbe!.release = () => original.call(this, callback, ...args);
          };
        });
        await clickButton(page, "Compare PDFs");
        await page.waitForFunction(() => !!window.__compareProbe!.release);
        await clickButton(page, "Cancel comparison");
        assert(
          await page.evaluate(() => document.activeElement?.textContent?.includes("Compare PDFs")),
          "Cancel did not restore compare focus.",
        );
        await page.evaluate(() => {
          window.__compareProbe!.release!();
          delete window.__compareProbe!.release;
        });
        await page.evaluate(() => {
          // Preserve the native receiver when invoking the held encoder.
          // eslint-disable-next-line @typescript-eslint/unbound-method
          const original = HTMLCanvasElement.prototype.toBlob;
          HTMLCanvasElement.prototype.toBlob = function (callback) {
            HTMLCanvasElement.prototype.toBlob = original;
            callback(null);
          };
        });
        await clickButton(page, "Compare PDFs");
        await page.waitForSelector("#comparison-error");
        assert(
          (await page.$$(".pdf-file-info")).length === 2,
          "Failed comparison discarded inputs.",
        );
        await startComparison(1);
        await page.locator('button[aria-label="Back to home"]').click();
        await page.waitForFunction(() => !document.querySelector(".pdf-compare"));
        assert(
          await page.evaluate(() =>
            window.__compareProbe!.created.every((url) =>
              window.__compareProbe!.revoked.includes(url),
            ),
          ),
          "Leaving Compare leaked result URLs.",
        );
        await page.evaluate(() => window.__compareProbe!.restore());
        console.log(
          "  ✓ identical pixels/overlay; changed content and page geometry; missing page; keyboard navigation; source preservation; reset/replacement/unmount URL cleanup; encrypted/corrupt input; cancel and retry",
        );
      },
    );

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
        await page.type("#common-name", "CloakPDF E2E — Zoë");
        await clickButton(page, "Generate certificate");
        await page.waitForSelector("#certificate-loaded", { timeout: 120_000 });
        await page.type("#sig-reason", "Standalone tool regression");
        await page.type("#sig-location", "Local browser");
        await page.type("#sig-contact", "e2e@cloakpdf.test");
        const output = await clickAndDownload(page, directory, "Sign & Download PDF", 120_000);
        assert(
          basename(output) === `${basename(FIXTURES.sample, ".pdf")}_signed.pdf`,
          "Unexpected signed filename.",
        );
        const verifyOutput = async (
          path: string,
          expectedName: string,
          expectedCertificates: number,
        ) => {
          const bytes = readFileSync(path);
          const text = bytes.toString("latin1");
          const ranges = [
            ...text.matchAll(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/g),
          ];
          assert(ranges.length === 1, "Expected one signature ByteRange.");
          const [start, length, second, tail] = ranges[0].slice(1).map(Number);
          assert(
            start === 0 && second + tail === bytes.length && second > length,
            "Signature ByteRange is incomplete.",
          );
          const content = Buffer.concat([bytes.subarray(0, length), bytes.subarray(second)]);
          const fromDer = forge.asn1.fromDer as unknown as (
            bytes: string,
            options: { parseAllBytes: boolean },
          ) => forge.asn1.Asn1;
          const der = fromDer(
            forge.util.hexToBytes(bytes.subarray(length + 1, second - 1).toString("ascii")),
            { parseAllBytes: false },
          );
          const message = forge.pkcs7.messageFromAsn1(der) as forge.pkcs7.PkcsSignedData;
          assert(
            message.certificates.length === expectedCertificates,
            "Certificate chain was lost.",
          );
          assert(
            forge.util.decodeUtf8(message.certificates[0].subject.getField("CN")?.value) ===
              expectedName,
            "Signer identity changed.",
          );
          const derFile = path + ".der",
            contentFile = path + ".content",
            verifiedFile = path + ".verified";
          await writeFile(derFile, Buffer.from(forge.asn1.toDer(der).getBytes(), "binary"));
          await writeFile(contentFile, content);
          // Independently verify cryptographic integrity, not CA trust for test certificates.
          execFileSync(
            "openssl",
            [
              "cms",
              "-verify",
              "-binary",
              "-inform",
              "DER",
              "-in",
              derFile,
              "-content",
              contentFile,
              "-noverify",
              "-out",
              verifiedFile,
            ],
            { stdio: "pipe" },
          );
          assert(readFileSync(verifiedFile).equals(content), "CMS verified content differs.");
          const original = await PDFDocument.load(readFileSync(FIXTURES.sample));
          const signed = await PDFDocument.load(bytes);
          const streams = (doc: PDFDocument) =>
            doc.context
              .enumerateIndirectObjects()
              .map(([, object]) => object)
              .filter((object): object is PDFRawStream => object instanceof PDFRawStream)
              .map((object) => Buffer.from(object.contents).toString("base64"))
              .sort();
          assert(signed.getPageCount() === original.getPageCount(), "Signing changed page count.");
          assert(
            JSON.stringify(streams(original)) === JSON.stringify(streams(signed)),
            "Signing changed source streams.",
          );
        };
        await verifyOutput(output, "CloakPDF E2E — Zoë", 1);
        await page.waitForFunction(() =>
          document
            .querySelector(".air-notice--success")
            ?.textContent?.includes("Download requested"),
        );
        await page.type("#common-name", " changed");
        assert(
          !(await page.$("#certificate-loaded")),
          "Edited name retained an older signing identity.",
        );
        assert(
          await page.$eval(
            ".pdf-signature > .pdf-operation-actions button",
            (button) => button.getAttribute("aria-disabled") === "true",
          ),
          "Stale identity still permits signing.",
        );
        await clickButton(page, "Change file");
        await uploadFiles(page, 'input[type="file"]', output);
        await page.waitForSelector("#existing-signatures");
        assert(
          await page.$eval(
            ".pdf-signature-record",
            (node) =>
              node.textContent?.includes("CloakPDF E2E") &&
              node.textContent.includes("Standalone tool regression"),
          ),
          "Existing signer/metadata missing.",
        );
        assert(
          await page.$eval(".air-notice--warning", (node) =>
            node.textContent?.includes("invalidate"),
          ),
          "Existing-signature disclosure missing.",
        );
        console.log(
          "  ✓ generated signature verifies with OpenSSL CMS; source streams and reopened metadata survive; editing identity invalidates the old certificate",
        );

        await clickButton(page, "Change file");
        await uploadFiles(page, 'input[type="file"]', FIXTURES.sample);
        await page.waitForSelector("#certificate-heading");
        const leaf = buildSelfSignedCert("Imported fixture signer");
        const issuer = buildSelfSignedCert("Fixture issuer");
        leaf.cert.setIssuer(issuer.cert.subject.attributes);
        leaf.cert.sign(issuer.key as forge.pki.rsa.PrivateKey, forge.md.sha256.create());
        const p12 = join(
          directory,
          "Certificate with a deliberately long filename for wrapping and recovery.p12",
        );
        const emptyP12 = join(directory, "empty-password.p12");
        const makeP12 = async (path: string, password: string) =>
          writeFile(
            path,
            Buffer.from(
              forge.asn1
                .toDer(
                  forge.pkcs12.toPkcs12Asn1(
                    leaf.key as forge.pki.rsa.PrivateKey,
                    [leaf.cert, issuer.cert],
                    password,
                    {
                      algorithm: "3des",
                    },
                  ),
                )
                .getBytes(),
              "binary",
            ),
          );
        await makeP12(p12, "air-certificate-password");
        await makeP12(emptyP12, "");
        await uploadFiles(page, 'input[accept=".p12,.pfx,application/x-pkcs12"]', p12);
        await page.type("#cert-password", "incorrect");
        await page.locator('button[aria-label="Show certificate password"]').click();
        assert(
          await page.$eval(
            "#cert-password",
            (input) => (input as HTMLInputElement).type === "text",
          ),
          "Certificate visibility failed.",
        );
        await page.locator('button[aria-label="Hide certificate password"]').click();
        await clickButton(page, "Load certificate");
        await page.waitForFunction(() =>
          document
            .querySelector('[role="alert"]')
            ?.textContent?.includes("Couldn’t load this certificate"),
        );
        assert(
          await page.$eval(
            "#cert-password",
            (input) =>
              input === document.activeElement && (input as HTMLInputElement).value === "incorrect",
          ),
          "Certificate recovery lost input/focus.",
        );
        await page.$eval("#cert-password", (input) => (input as HTMLInputElement).select());
        await page.type("#cert-password", "air-certificate-password");
        await clickButton(page, "Load certificate");
        await page.waitForSelector("#certificate-loaded");
        // Headless Chromium replaces an existing same-name download. Retire the
        // already-verified synthetic output so the next download is observable.
        await rm(output);
        const imported = await clickAndDownload(page, directory, "Sign & Download PDF");
        await verifyOutput(imported, "Imported fixture signer", 2);
        await clickButton(page, "Change certificate");
        assert(
          await page.$eval(
            'input[accept=".p12,.pfx,application/x-pkcs12"]',
            (input) => input === document.activeElement,
          ),
          "Certificate replacement lost intake focus.",
        );
        await uploadFiles(page, 'input[accept=".p12,.pfx,application/x-pkcs12"]', emptyP12);
        await clickButton(page, "Load certificate");
        await page.waitForSelector("#certificate-loaded");
        await rm(imported);
        const emptySigned = await clickAndDownload(page, directory, "Sign & Download PDF");
        await verifyOutput(emptySigned, "Imported fixture signer", 2);
        console.log(
          "  ✓ imported PKCS#12 chain, wrong-password retry, visibility and empty-password certificate produce independently verified output",
        );

        await clickButton(page, "Change certificate");
        const corruptCert = join(directory, "corrupt.p12");
        await writeFile(corruptCert, "Not a certificate");
        await uploadFiles(page, 'input[accept=".p12,.pfx,application/x-pkcs12"]', corruptCert);
        await clickButton(page, "Load certificate");
        await page.waitForFunction(() =>
          document
            .querySelector('[role="alert"]')
            ?.textContent?.includes("Couldn’t load this certificate"),
        );
        await page.evaluate(() => {
          const original = Reflect.get(
            File.prototype,
            "arrayBuffer",
          ) as typeof File.prototype.arrayBuffer;
          window.__signatureImport = { original };
          File.prototype.arrayBuffer = function () {
            if (this.name !== "corrupt.p12") return original.call(this);
            return new Promise((resolve) => {
              window.__signatureImport!.release = async () => resolve(await original.call(this));
            });
          };
        });
        await clickButton(page, "Load certificate");
        await page.waitForFunction(() => Boolean(window.__signatureImport!.release));
        await clickButton(page, "Cancel certificate load");
        assert(
          await page.$eval("#cert-password", (input) => input === document.activeElement),
          "Cancelled import lost field focus.",
        );
        await clickButton(page, "Change certificate");
        await uploadFiles(page, 'input[accept=".p12,.pfx,application/x-pkcs12"]', emptyP12);
        await clickButton(page, "Load certificate");
        // The replacement must complete before the cancelled read resolves.
        await page.waitForSelector("#certificate-loaded");
        await page.evaluate(async () => {
          File.prototype.arrayBuffer = window.__signatureImport!.original;
          await window.__signatureImport!.release!();
        });
        assert(
          !(await page.$('[role="alert"]')) &&
            (await page.$eval(".pdf-signature-record", (node) => node.textContent))?.includes(
              "Imported fixture signer",
            ),
          "An obsolete certificate read replaced or errored over the new identity.",
        );
        await clickButton(page, "Generate");
        await page.type("#common-name", "Cancelled fixture");
        await page.evaluate(() => {
          const original = window.Worker;
          window.__signatureWorker = { original, calls: 0, terminated: 0 };
          window.Worker = class extends original {
            postMessage() {
              window.__signatureWorker!.calls++;
            }
            terminate() {
              window.__signatureWorker!.terminated++;
              super.terminate();
            }
          };
        });
        await clickButton(page, "Generate certificate");
        await clickButton(page, "Cancel certificate generation");
        assert(
          await page.evaluate(
            () =>
              window.__signatureWorker!.calls === 1 && window.__signatureWorker!.terminated === 1,
          ),
          "Cancellation did not terminate the real worker.",
        );
        assert(
          await page.$eval(
            "#common-name",
            (input) =>
              input === document.activeElement &&
              (input as HTMLInputElement).value === "Cancelled fixture",
          ),
          "Cancelled generation lost name/focus.",
        );
        await page.evaluate(() => {
          window.Worker = window.__signatureWorker!.original;
        });
        await clickButton(page, "Generate certificate");
        await page.waitForSelector("#certificate-loaded");
        console.log(
          "  ✓ malformed certificate recovery, import cancellation/replacement and real-worker cancellation/retry preserve input and focus",
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
