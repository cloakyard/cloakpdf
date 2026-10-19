/** Dev-server integration: real PDF rendering, fault recovery and editor state. */
import { createEvidenceDirectory } from "./helpers/evidence-directory.ts";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, degrees } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";

const output = createEvidenceDirectory("cloakpdf-air-preview");
await mkdir(output, { recursive: true });
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (let i = 0; i < 3; i++) {
  const p = pdf.addPage([400, 600]);
  p.drawText(`Room to recover. Page ${i + 1}`, { x: 30, y: 500, size: 20, font });
  if (i === 1) {
    p.setCropBox(20, 40, 340, 480);
    p.setRotation(degrees(90));
  }
}
const bytes = Array.from(await pdf.save());
const poster = await PDFDocument.create();
poster.addPage([10000, 10000]).drawText("Large original, bounded preview");
const posterBytes = Array.from(await poster.save());
await writeFile(join(output, "Air recovery.pdf"), new Uint8Array(bytes));
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.setBypassServiceWorker(true);
try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(process.env.E2E_URL ?? "http://127.0.0.1:8122", { waitUntil: "networkidle2" });
  const renderer = await page.evaluate(
    async ({ input, posterBytes }) => {
      const load = async (path: string) => import(path);
      const { renderPagePreviews, renderPagesToBlobs, pageWhitenessScores, revokeThumbnails } =
        await load("/src/utils/pdf-renderer.ts");
      const { createDocFromFile } = await load("/src/editor/doc.ts");
      const file = new File([new Uint8Array(input)], "recovery.pdf");
      const check = (value: unknown, message: string) => {
        if (!value) throw new Error(message);
      };
      // Save only for restoration and bound invocation; never invoke unbound.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const original = HTMLCanvasElement.prototype.toBlob;
      const canvases: HTMLCanvasElement[] = [];
      let count = 0;
      HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
        canvases.push(this);
        if (++count === 2) callback(null);
        else original.call(this, callback, ...args);
      };
      let doc;
      try {
        doc = await createDocFromFile(file);
      } finally {
        HTMLCanvasElement.prototype.toBlob = original;
      }
      check(
        doc.pages[0].thumbUrl && !doc.pages[1].thumbUrl && doc.pages[2].thumbUrl,
        "partial render must preserve good pages",
      );
      check(
        doc.pages[1].widthPt === 480 && doc.pages[1].heightPt === 340,
        "missing preview must preserve cropped/rotated geometry",
      );
      check(
        canvases.every((c) => !c.width && !c.height),
        "all encoder canvases released",
      );
      const repaired = await renderPagePreviews(file, [1]);
      const image = new Image();
      image.src = repaired[0];
      await image.decode();
      check(Math.abs(image.width / image.height - 480 / 340) < 0.002, "repaired geometry agrees");
      revokeThumbnails([
        ...doc.pages.map((p: { thumbUrl: string | null }) => p.thumbUrl).filter(Boolean),
        ...repaired,
      ]);
      HTMLCanvasElement.prototype.toBlob = function (callback) {
        callback(null);
      };
      let exportFailed = false;
      try {
        await renderPagesToBlobs(file, [0], 150, "image/png");
      } catch {
        exportFailed = true;
      } finally {
        HTMLCanvasElement.prototype.toBlob = original;
      }
      check(exportFailed, "image export must fail explicitly, never export a blank");
      const controller = new AbortController();
      const made: string[] = [],
        retired: string[] = [];
      const create = URL.createObjectURL.bind(URL),
        revoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = (b) => {
        const u = create(b);
        made.push(u);
        return u;
      };
      URL.revokeObjectURL = (u) => {
        retired.push(u);
        revoke(u);
      };
      try {
        await renderPagePreviews(file, [0, 1, 2], () => controller.abort(), controller.signal);
        throw new Error("abort must reject");
      } catch (e) {
        check((e as Error).name === "AbortError", "abort error identity");
      } finally {
        URL.createObjectURL = create;
        URL.revokeObjectURL = revoke;
      }
      check(
        made.length === 1 && made.every((u) => retired.includes(u)),
        "aborted partial render must revoke URLs",
      );
      const posterDoc = await createDocFromFile(
        new File([new Uint8Array(posterBytes)], "poster.pdf"),
      );
      const posterImage = new Image();
      posterImage.src = posterDoc.pages[0].thumbUrl;
      await posterImage.decode();
      check(
        posterDoc.pages[0].widthPt === 10000 && posterDoc.pages[0].heightPt === 10000,
        "preview cap must not change document dimensions",
      );
      check(
        posterImage.width <= 4096 &&
          posterImage.height <= 4096 &&
          posterImage.width * posterImage.height <= 8_000_000,
        "poster preview must fit memory budget",
      );
      revokeThumbnails([posterDoc.pages[0].thumbUrl]);
      // No thumbnail encodes are needed for blank-page analysis.
      HTMLCanvasElement.prototype.toBlob = () => {
        throw new Error("unexpected encoding");
      };
      try {
        check(
          (await pageWhitenessScores(file)).every((s: number) => s > 0 && s < 0.995),
          "blank scan reads pixels only",
        );
      } finally {
        HTMLCanvasElement.prototype.toBlob = original;
      }
      return {
        partialFailure: true,
        geometry: true,
        encoderCleanup: true,
        failClosedExport: true,
        cancelledUrls: made.length,
        scoreWithoutEncoding: true,
        largePageCap: { width: posterImage.width, height: posterImage.height, physicalSize: 10000 },
      };
    },
    { input: bytes, posterBytes },
  );
  console.log("PASS renderer failure/geometry/cleanup and fail-closed export.");
  // Mount the real provider/shell, with a test-only context observer. No test API
  // ships in production. This permits assertions on preserved byte/object identity.
  await page.evaluate(async (input) => {
    const load = async (path: string) => import(path);
    const React = (await load("/node_modules/.vite/deps/react.js")).default;
    const { createRoot } = (await load("/node_modules/.vite/deps/react-dom_client.js")).default;
    // Use the shell's exact Vite URL, including its HMR revision, so this
    // observer shares the production component's context instance.
    const shellSource = await (await fetch("/src/editor/EditorShell.tsx")).text();
    const contextUrl = shellSource.match(/from ["']([^"']*EditorContext\.tsx[^"']*)["']/)![1];
    const { EditorProvider, useEditorRead, useEditorActions, useToolSlice } =
      await load(contextUrl);
    const { EditorShell } = await load("/src/editor/EditorShell.tsx");
    const { StageProvider } = await load("/src/editor/stage.tsx");
    const { MotionProvider } = await load("/src/components/motion.tsx");
    const w = window as any;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    function Probe() {
      w.airRead = useEditorRead();
      w.airActions = useEditorActions();
      w.airOrganize = useToolSlice("organize-pages");
      w.airOcr = useToolSlice("ocr");
      return React.createElement(EditorShell);
    }
    w.airDispose = () => {
      root.unmount();
      host.remove();
    };
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = HTMLCanvasElement.prototype.toBlob;
    let count = 0;
    HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
      if (++count === 1) {
        HTMLCanvasElement.prototype.toBlob = original;
        callback(null);
      } else original.call(this, callback, ...args);
    };
    root.render(
      React.createElement(
        EditorProvider,
        {
          initialFile: new File([new Uint8Array(input)], "Air recovery.pdf"),
          onExit: w.airDispose,
        },
        React.createElement(
          MotionProvider,
          null,
          React.createElement(StageProvider, null, React.createElement(Probe)),
        ),
      ),
    );
  }, bytes);
  await page.waitForSelector(".editor-preview-recovery");
  await page.waitForSelector('.editor-canvas [aria-label="Page 1: preview unavailable"]');
  const read = async () =>
    page.evaluate(() => {
      const { doc, canUndo, canRedo, selectedPage, previewRetry } = (window as any).airRead;
      return {
        urls: doc.pages.map((p: any) => p.thumbUrl),
        objects: doc.objects.length,
        canUndo,
        canRedo,
        selectedPage,
        previewRetry,
      };
    });
  const initial = await read();
  assert.equal(initial.canUndo, false);
  assert.equal(initial.urls[0], null);
  await page.evaluate(() => {
    const w = window as any;
    w.originalDoc = w.airRead.doc;
    w.airActions.setActiveTool("redact-pdf");
  });
  const paper = await page.$eval(".editor-paper", (n) => {
    const r = n.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  await page.mouse.move(paper.x + paper.w * 0.2, paper.y + paper.h * 0.2);
  await page.mouse.down();
  await page.mouse.move(paper.x + paper.w * 0.5, paper.y + paper.h * 0.3);
  await page.mouse.up();
  assert.equal((await read()).objects, 0, "cannot place a mark on an unavailable page");
  await page.evaluate(() => {
    const w = window as any;
    w.airActions.addObject({
      kind: "redaction",
      pageIndex: 1,
      rect: { x: 0.1, y: 0.1, w: 0.2, h: 0.1 },
    });
    w.airActions.setActiveTool("organize-pages");
    w.airActions.setViewMode("overview");
  });
  await page.waitForSelector('[aria-label="Organize pages"] li');
  await page.evaluate(() =>
    (window as any).airActions.patchToolState("organize-pages", { rotations: { 1: 90 } }),
  );
  await page.evaluate(() => {
    const w = window as any;
    w.beforeRetry = w.airRead.doc;
    // One failed retry; show a durable inline error while preserving drafts.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback) {
      HTMLCanvasElement.prototype.toBlob = original;
      callback(null);
    };
  });
  await page.locator("button::-p-text(Retry previews)").click();
  await page.waitForFunction(() => (window as any).airRead.previewRetry.failed);
  assert.match(
    await page.$eval(".editor-preview-recovery", (n) => n.textContent!),
    /Couldn't rebuild/,
  );
  await page.evaluate(() => {
    const w = window as any;
    if (w.airRead.doc !== w.beforeRetry || w.airOrganize.rotations[1] !== 90)
      throw new Error("retry reset document or page plan");
  });
  console.log("PASS failed retry preserves pending marks and page plan.");
  const layouts: unknown[] = [];
  const cdp = await page.createCDPSession();
  for (const surface of ["grid", "canvas"]) {
    await page.evaluate((surface) => {
      const actions = (window as any).airActions;
      actions.setActiveTool(surface === "grid" ? "organize-pages" : "redact-pdf");
      actions.setViewMode(surface === "grid" ? "overview" : "focus");
    }, surface);
    for (const theme of ["light", "dark"]) {
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: theme },
        { name: "prefers-reduced-motion", value: "reduce" },
      ]);
      for (const [width, height] of [
        [1920, 1080],
        [1440, 900],
        [1366, 768],
        [1280, 720],
        [1024, 768],
        [768, 1024],
        [430, 932],
        [390, 844],
        [375, 812],
        [320, 568],
        [844, 390],
      ]) {
        await page.setViewport({ width, height });
        await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: width < 1024 });
        await cdp.send("Emulation.setEmulatedMedia", {
          features: [
            { name: "prefers-color-scheme", value: theme },
            { name: "prefers-reduced-motion", value: "reduce" },
            { name: "pointer", value: width < 1024 ? "coarse" : "fine" },
          ],
        });
        await page.evaluate(() => new Promise(requestAnimationFrame));
        const geometry = await page.$eval(".editor-preview-recovery", (n) => {
          const b = n.querySelector("button")!.getBoundingClientRect(),
            r = n.getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            x: b.x,
            y: b.y,
            right: b.right,
            bottom: b.bottom,
            width: b.width,
            height: b.height,
            stripHeight: r.height,
            contentWidth: n.scrollWidth,
            stripWidth: n.clientWidth,
          };
        });
        assert.ok(
          !geometry.overflow && geometry.contentWidth <= geometry.stripWidth + 1,
          `recovery overflow ${width}/${theme}`,
        );
        assert.ok(
          geometry.x >= 0 &&
            geometry.right <= width &&
            geometry.bottom <= height &&
            geometry.height >= 39,
          `reachable retry ${width}/${theme}`,
        );
        layouts.push({ surface, theme, viewportWidth: width, viewportHeight: height, ...geometry });
        if ([1440, 390, 320, 844].includes(width))
          await page.screenshot({
            path: join(output, `recovery-${surface}-${width}-${theme}.png`),
          });
      }
    }
  }
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  assert.ok(
    await page.$eval(".editor-canvas", (n) => n.getBoundingClientRect().height >= 64),
    "recovery must preserve a mobile preview at enlarged text",
  );
  await page.screenshot({ path: join(output, "recovery-phone-text-200.png") });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
  await page.setViewport({ width: 1440, height: 900 });
  await page.focus("button::-p-text(Retry previews)");
  await page.keyboard.press("Enter");
  await page.waitForSelector(".editor-preview-recovery", { hidden: true });
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Export");
  await page.evaluate(() => {
    const w = window as any;
    if (
      w.airRead.doc !== w.beforeRetry ||
      w.airOrganize.rotations[1] !== 90 ||
      w.airRead.doc.objects.length !== 1
    )
      throw new Error("successful retry reset work");
    w.airActions.undo();
  });
  await page.waitForFunction(() => !(window as any).airRead.canUndo);
  assert.ok((await read()).urls[0]);
  assert.equal((await read()).objects, 0);
  await page.evaluate(() => (window as any).airActions.redo());
  await page.waitForFunction(() => (window as any).airRead.doc.objects.length === 1);
  assert.ok((await read()).urls[0]);
  // Real image decode failure: a revoked replacement URL reports centrally.
  await page.evaluate(() => {
    const w = window as any;
    w.airActions.setActiveTool(null);
    w.airActions.setViewMode("focus");
    w.airActions.setSelectedPage(2);
  });
  await page.waitForSelector('.editor-paper-image[alt="Page 3"]');
  await page.$eval(".editor-paper-image", (n) => {
    URL.revokeObjectURL((n as HTMLImageElement).src);
    (n as HTMLImageElement).src += "#decode-failure";
  });
  await page.waitForSelector(".editor-preview-recovery");
  assert.equal((await read()).urls[2], null);
  // Hold a retry's encoder callback, change bytes, then release. No stale URL
  // may overwrite the newly loaded document; cancellation releases it.
  await page.evaluate(() => {
    const w = window as any;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
      HTMLCanvasElement.prototype.toBlob = original;
      original.call(
        this,
        (blob) => {
          w.releasePreview = () => callback(blob);
        },
        ...args,
      );
    };
    void w.airActions.retryPreviews();
  });
  await page.waitForFunction(() => !!(window as any).releasePreview);
  await page.evaluate(async (input) => {
    await (window as any).airActions.loadFile(new File([new Uint8Array(input)], "Replacement.pdf"));
  }, bytes);
  await page.waitForFunction(() => (window as any).airRead.doc?.fileName === "Replacement.pdf");
  const fresh = await read();
  await page.evaluate(() => (window as any).releasePreview());
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 100)));
  assert.deepEqual((await read()).urls, fresh.urls);
  assert.equal((await read()).objects, 0);
  // A thumbnail repair must preserve an actual OCR review of native text.
  await page.evaluate(() => (window as any).airActions.setActiveTool("ocr"));
  await page.locator("button::-p-text(Extract text)").click();
  await page.waitForSelector(".pdf-ocr-preview");
  const recognised = await page.$eval(".pdf-ocr-preview pre", (n) => n.textContent);
  await page.evaluate(() => {
    const w = window as any;
    w.airActions.reportPreviewFailure(0, w.airRead.doc.pages[0].thumbUrl);
  });
  await page.locator("button::-p-text(Retry previews)").click();
  await page.waitForSelector(".editor-preview-recovery", { hidden: true });
  assert.equal(await page.$eval(".pdf-ocr-preview pre", (n) => n.textContent), recognised);
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "preview-recovery.json"),
    JSON.stringify(
      {
        renderer,
        layouts,
        features: [
          "missing page load",
          "failed retry",
          "page-plan and pending marks retained",
          "keyboard focus return",
          "undo/redo preview cache",
          "broken image recovery",
          "late retry discarded",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS preview recovery: ${layouts.length} responsive/theme states, renderer cleanup, export failure, drafts, history, decode and stale retry.`,
  );
} catch (error) {
  console.error({ errors, body: (await page.$eval("body", (n) => n.innerText)).slice(-2200) });
  await page.screenshot({ path: join(output, "failure.png") });
  throw error;
} finally {
  await browser.close();
}
