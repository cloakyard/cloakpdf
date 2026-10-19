/** Real built SW lifecycle with disposable work and two tabs. Run after pnpm build. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { PDFDocument } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";

const root = resolve(import.meta.dirname, "../..");
const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-pwa-update";
await mkdir(output, { recursive: true });
const downloads = await mkdtemp(resolve(output, "downloads-"));
let revision = 1;
const mime: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".wasm": "application/wasm",
};
const server = createServer(async (req, res) => {
  try {
    let path = new URL(req.url ?? "/", "http://localhost").pathname;
    if (path === "/") path = "/index.html";
    const file = resolve(root, "dist", `.${path}`);
    assert.ok(file.startsWith(resolve(root, "dist") + "/"));
    let data = await readFile(file);
    // Change only the test server's SW bytes, leaving dist and user servers intact.
    if (path === "/sw.js")
      data = Buffer.concat([data, Buffer.from(`\n// Test revision ${revision}\n`)]);
    res
      .writeHead(200, {
        "Content-Type": mime[extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      })
      .end(data);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
const address = server.address();
assert.ok(address && typeof address !== "string");
const base = `http://127.0.0.1:${address.port}`;
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  defaultViewport: { width: 1440, height: 900, hasTouch: true },
});
const rows: unknown[] = [];
const errors: string[] = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(String(error)));
  page.setDefaultTimeout(30_000);
  const cdp = await page.createCDPSession();
  await cdp.send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloads,
  });
  await page.goto(base);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForSelector('[aria-label="Dismiss cache status"]');
  await page.waitForSelector(".pdf-toast-host", { hidden: true });
  // Auto-dismissed first-install feedback must not hide future home updates.
  revision++;
  await page.evaluate(async () => (await navigator.serviceWorker.ready).update());
  await page.waitForSelector(".pdf-toast-actions button:last-child", { visible: true });
  assert.notEqual(
    await page.$eval(".pdf-toast-actions button:last-child", (n) =>
      n.getAttribute("aria-disabled"),
    ),
    "true",
  );
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click(".pdf-toast-actions button:last-child"),
  ]);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const source = resolve(output, "update-review.pdf");
  const pdf = await PDFDocument.create();
  pdf.addPage([420, 595]);
  pdf.setTitle("Original title");
  await writeFile(source, await pdf.save());
  await (await page.$("input[type=file]"))!.uploadFile(source);
  await page.waitForSelector('[aria-label="Metadata"]', { visible: true });
  await page.click('[aria-label="Metadata"]');
  await page.waitForSelector("#metadata-title");
  await page.$eval("#metadata-title", (n) => (n as HTMLInputElement).select());
  await page.type("#metadata-title", "Saved after deferred update");
  revision++;
  await page.evaluate(async () => (await navigator.serviceWorker.ready).update());
  await page.waitForSelector(".pdf-toast-actions button:last-child", { visible: true });
  assert.equal(
    await page.$eval(".pdf-toast-actions button:last-child", (n) =>
      n.getAttribute("aria-disabled"),
    ),
    "true",
  );
  await page.click(".pdf-toast-actions button:last-child");
  await page.focus(".pdf-toast-actions button:last-child");
  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 1700));
  assert.equal(
    await page.$eval("#metadata-title", (n) => (n as HTMLInputElement).value),
    "Saved after deferred update",
  );
  assert.equal(
    await page.evaluate(async () => !!(await navigator.serviceWorker.ready).waiting),
    true,
  );
  const sizes = [
    [320, 568],
    [375, 812],
    [390, 844],
    [430, 932],
    [844, 390],
    [768, 1024],
    [1024, 768],
    [1280, 720],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
  ];
  for (const [width, height] of sizes) {
    await page.setViewport({ width, height, hasTouch: true });
    for (const theme of ["light", "dark"]) {
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      for (const font of [16, 32]) {
        const result = await page.evaluate(async (font) => {
          document.documentElement.style.fontSize = `${font}px`;
          await document.fonts.ready;
          const toast = document.querySelector<HTMLElement>(".pdf-toast")!;
          const rect = toast.getBoundingClientRect();
          const buttons = [...toast.querySelectorAll("button")];
          const ranges = [...toast.querySelectorAll("p, button")].flatMap((n) => {
            const range = document.createRange();
            range.selectNodeContents(n);
            return [...range.getClientRects()];
          });
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            overflow: toast.scrollWidth > toast.clientWidth,
            textOverflow: ranges.some(
              (r) => r.width > 0 && (r.left < -1 || r.right > innerWidth + 1),
            ),
            smallTargets: buttons.filter(
              (n) =>
                n.getBoundingClientRect().height <
                (matchMedia("(pointer:coarse)").matches ? 43.5 : 39.5),
            ).length,
            deferred: buttons.at(-1)?.getAttribute("aria-disabled"),
          };
        }, font);
        assert.ok(
          result.left >= 0 &&
            result.right <= width + 1 &&
            result.top >= 0 &&
            result.bottom <= height + 1,
          JSON.stringify({ width, height, theme, font, result }),
        );
        assert.equal(result.overflow, false);
        assert.equal(result.textOverflow, false);
        assert.equal(result.smallTargets, 0);
        assert.equal(result.deferred, "true");
        rows.push({ width, height, theme, font, ...result });
        if ([320, 390, 768, 1280, 1440].includes(width))
          await page.screenshot({
            path: resolve(output, `deferred-${width}-${theme}-${font}.png`),
          });
      }
    }
  }
  await page.setViewport({ width: 1440, height: 900, hasTouch: true });
  await page.evaluate(() => (document.documentElement.style.fontSize = "16px"));
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-reduced-motion", value: "reduce" },
      { name: "forced-colors", value: "active" },
    ],
  });
  await page.focus(".pdf-toast-actions button:last-child");
  await page.screenshot({ path: resolve(output, "deferred-forced-colours.png") });
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  await page.click("button::-p-text(Later)");
  await page.waitForSelector(".pdf-toast-host", { hidden: true });
  await page.click("button::-p-text(Save metadata)");
  await page.waitForFunction(() =>
    document.querySelector("#metadata-save-status")?.textContent?.includes("Metadata saved"),
  );
  await page.click('[aria-label="Export"]');
  await page.waitForSelector("[data-export-download]");
  await page.click("[data-export-download]");
  let downloaded: string | undefined;
  for (let attempt = 0; attempt < 100 && !downloaded; attempt++) {
    downloaded = (await readdir(downloads)).find((n) => n.endsWith(".pdf"));
    if (!downloaded) await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(downloaded, "Real PDF download completed");
  const saved = await PDFDocument.load(await readFile(resolve(downloads, downloaded)));
  assert.equal(saved.getTitle(), "Saved after deferred update");
  assert.equal(saved.getPageCount(), 1);
  await page.keyboard.press("Escape");
  await page.waitForSelector('[role="dialog"]', { hidden: true });
  // A second home tab activates the same waiting worker. This working tab stays put.
  const other = await browser.newPage();
  await other.goto(base);
  await other.waitForSelector(".pdf-toast-actions button:last-child");
  await Promise.all([
    other.waitForNavigation({ waitUntil: "networkidle2" }),
    other.click(".pdf-toast-actions button:last-child"),
  ]);
  await new Promise((r) => setTimeout(r, 1700));
  assert.equal(
    await page.$eval("#metadata-title", (n) => (n as HTMLInputElement).value),
    "Saved after deferred update",
  );
  await other.close();
  await page.click('[aria-label="Back to home"]');
  await page.waitForSelector(".pdf-toast-actions button:last-child", { visible: true });
  assert.notEqual(
    await page.$eval(".pdf-toast-actions button:last-child", (n) =>
      n.getAttribute("aria-disabled"),
    ),
    "true",
  );
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click(".pdf-toast-actions button:last-child"),
  ]);
  await page.waitForSelector("#toolkit");
  // Standalone inputs retain their files while an update waits.
  await page.click("button::-p-text(Merge PDFs)");
  await page.waitForSelector("input[type=file]");
  await (await page.$("input[type=file]"))!.uploadFile(source);
  await page.waitForSelector('[aria-label="Files to combine"] [role="listitem"]');
  revision++;
  await page.evaluate(async () => (await navigator.serviceWorker.ready).update());
  await page.waitForSelector(".pdf-toast-actions button:last-child", { visible: true });
  assert.equal(
    await page.$eval(".pdf-toast-actions button:last-child", (n) =>
      n.getAttribute("aria-disabled"),
    ),
    "true",
  );
  await page.click(".pdf-toast-actions button:last-child");
  await new Promise((r) => setTimeout(r, 1700));
  assert.ok(await page.$('[aria-label="Files to combine"] [role="listitem"]'));
  assert.ok(await page.$("body::-p-text(update-review.pdf)"));
  await page.click("button::-p-text(Later)");
  await page.click('[aria-label="Back to home"]');
  await page.waitForSelector(".pdf-toast-actions button:last-child", { visible: true });
  // A route handoff racing an accepted update must also prevent the delayed reload.
  const sourceBytes = [...(await readFile(source))];
  await page.evaluate((bytes) => {
    const update = [...document.querySelectorAll("button")].find((n) =>
      n.textContent?.includes("Update now"),
    )!;
    update.click();
    window.dispatchEvent(
      new CustomEvent("cloakpdf:open-editor", {
        detail: new File([new Uint8Array(bytes)], "update-review.pdf", { type: "application/pdf" }),
      }),
    );
  }, sourceBytes);
  await page.waitForSelector('[aria-label="Metadata"]', { visible: true });
  await page.click('[aria-label="Metadata"]');
  await page.waitForSelector("#metadata-title");
  await new Promise((r) => setTimeout(r, 1700));
  assert.equal(
    await page.$eval("#metadata-title", (n) => (n as HTMLInputElement).value),
    "Original title",
  );
  await page.click('[aria-label="Back to home"]');
  await page.waitForSelector(".pdf-toast-actions button:last-child", { visible: true });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click(".pdf-toast-actions button:last-child"),
  ]);
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(output, "results.json"),
    JSON.stringify(
      {
        rows,
        errors,
        checks: [
          "pending editor draft protected from pointer/keyboard update",
          "Later retains draft and resurfaces on home",
          "Save + real PDF export retains metadata/page",
          "Other-tab activation preserves working tab",
          "Standalone file queue survives waiting update",
          "Route handoff during update prevents delayed reload",
          "Explicit home update completes",
          "Reduced motion/forced colours inspected",
        ],
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `PASS: ${rows.length} deferred-update layouts; real waiting-worker, editor, export, two-tab, standalone and race checks.`,
  );
} finally {
  await browser.close();
  await new Promise<void>((done) => server.close(() => done()));
}
