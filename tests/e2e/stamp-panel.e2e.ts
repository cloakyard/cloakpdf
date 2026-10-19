/** Stamp drafts, precision controls, actual PDF output and Air acceptance. */
import { createEvidenceDirectory } from "./helpers/evidence-directory.ts";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
const output = createEvidenceDirectory("cloakpdf-air-review");
await mkdir(output, { recursive: true });
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (let i = 0; i < 3; i++) {
  const p = pdf.addPage(i === 1 ? [600, 400] : [400, 600]);
  p.drawText("Cloakyard - a thoughtful place for everyday documents", {
    x: 30,
    y: 565,
    size: 11,
    font,
  });
  p.drawText(`Body content on page ${i + 1}`, { x: 70, y: 340, size: 18, font });
  p.drawText(`Page ${i + 1}`, { x: 170, y: 20, size: 10, font });
}
pdf.setTitle("Stamp acceptance");
pdf.setAuthor("Synthetic author");
await pdf.attach(new TextEncoder().encode("REFERENCE"), "reference.txt");
const bytes = Array.from(await pdf.save());
await writeFile(join(output, "Air stamp.pdf"), new Uint8Array(bytes));
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage();
const cdp = await page.createCDPSession();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.setBypassServiceWorker(true);
const settle = () =>
  page.evaluate(async () => {
    for (let i = 0; i < 10; i++) await new Promise(requestAnimationFrame);
  });
const tool = async (id = "stamp-pdf") => {
  await page.evaluate((id) => (window as any).airActions.setActiveTool(id), id);
  await settle();
};
const clickText = (text: string) => page.locator(`button::-p-text(${text})`).click();
const docBytes = () =>
  page.evaluate(() => Array.from((window as any).airRead.doc.bytes as Uint8Array));
try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(process.env.E2E_URL ?? "http://127.0.0.1:8122", { waitUntil: "networkidle2" });
  await page.evaluate(async (input) => {
    const load = async (path: string) => import(path);
    const React = (await load("/node_modules/.vite/deps/react.js")).default;
    const { createRoot } = (await load("/node_modules/.vite/deps/react-dom_client.js")).default;
    const source = await (await fetch("/src/editor/EditorShell.tsx")).text();
    const context = source.match(/from ["']([^"']*EditorContext\.tsx[^"']*)["']/)![1];
    const { EditorProvider, useEditorRead, useEditorActions, useToolSlice, useActiveTool } =
      await load(context);
    const { EditorShell } = await load("/src/editor/EditorShell.tsx");
    const { StageProvider } = await load("/src/editor/stage.tsx");
    const { MotionProvider } = await load("/src/components/motion.tsx");
    const w = window as any;
    function Probe() {
      w.airRead = useEditorRead();
      w.airActions = useEditorActions();
      w.airStamp = useToolSlice("stamp-pdf");
      w.airTool = useActiveTool();
      return React.createElement(EditorShell);
    }
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    root.render(
      React.createElement(
        EditorProvider,
        {
          initialFile: new File([new Uint8Array(input)], "Air review.pdf"),
          onExit: () => root.unmount(),
        },
        React.createElement(
          MotionProvider,
          null,
          React.createElement(StageProvider, null, React.createElement(Probe)),
        ),
      ),
    );
    // Delay/fail the real file read, leaving PDF.js/extraction and the panel intact.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const read = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = async function () {
      if (w.failRead || w.failName === this.name) {
        w.failName = null;
        w.failedReadAt = { name: this.name, stack: new Error().stack };
        w.failRead = false;
        throw new Error("Controlled read failure");
      }
      if (w.holdRead) {
        w.holdRead = false;
        await new Promise<void>((resolve) => {
          w.releaseRead = resolve;
        });
      }
      return read.call(this);
    };
  }, bytes);

  await page.waitForSelector(".editor-paper img");
  await tool();
  const ready = () =>
    page.waitForFunction(() => {
      const w = window as any;
      return w.airStamp.context?.bytes === w.airRead.doc?.bytes;
    });
  await ready();
  const field = async (selector: string, text: string) => {
    await page.$eval(selector, (el) => {
      (el as HTMLInputElement).focus();
      (el as HTMLInputElement).select();
    });
    await page.keyboard.press("Backspace");
    if (text) await page.keyboard.type(text);
    await page.keyboard.press("Tab");
    await settle();
  };
  const overlay = () =>
    page.evaluate(() => {
      const c = document.querySelector("canvas.absolute.inset-0") as HTMLCanvasElement;
      const data = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i]) n++;
      return n;
    });
  assert.ok((await overlay()) > 100);
  // First-use token insertion does not require a previous click in the field.
  await clickText("Title");
  assert.equal(
    await page.$eval("#stamp-text", (e) => (e as HTMLInputElement).value),
    "CONFIDENTIAL{title}",
  );
  await field("#stamp-text", "Reviewed {title} - {page}/{total} - {filename} - {date} {time}");
  assert.match(
    await page.$eval("#stamp-preview-text", (e) => e.textContent!),
    /Stamp acceptance - 1\/3/,
  );
  const timestamp = await page.evaluate(() => (window as any).airStamp.context.timestamp);
  await tool("crop-pages");
  await tool();
  await ready();
  assert.equal(await page.evaluate(() => (window as any).airStamp.context.timestamp), timestamp);
  // Text insertion replaces the selection and restores the caret.
  await page.$eval("#stamp-text", (e) => {
    const i = e as HTMLInputElement;
    i.focus();
    i.setSelectionRange(0, 8);
  });
  await clickText("Date");
  assert.ok(
    (await page.$eval("#stamp-text", (e) => (e as HTMLInputElement).value)).startsWith(
      "{date} {title}",
    ),
  );
  assert.equal(await page.evaluate(() => document.activeElement?.id), "stamp-text");
  // Invalid drafts survive reflow; the last valid preview remains unchanged.
  await field("#stamp-fontSize", "121");
  assert.equal(await page.$eval("#stamp-fontSize", (e) => e.getAttribute("aria-invalid")), "true");
  assert.equal(
    await page.$eval(
      ".pdf-stamp-panel .air-button--primary",
      (e) => (e as HTMLButtonElement).disabled,
    ),
    true,
  );
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  assert.equal(await page.$eval("#stamp-fontSize", (e) => (e as HTMLInputElement).value), "121");
  await page.setViewport({ width: 1440, height: 900 });
  await settle();
  await field("#stamp-fontSize", "24");
  await field("#stamp-opacity", "55");
  await field("#stamp-rotation", "0");
  await field("#stamp-text", "{title} {page}/{total} {time}");
  const expectedTime = await page.evaluate(() =>
    new Date((window as any).airStamp.context.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const before = await docBytes();
  await clickText("Add stamp");
  await page.waitForFunction(
    () => !(window as any).airRead.busyLabel && !(window as any).airStamp.sourceBytes,
  );
  await ready();
  await settle();
  assert.equal(await overlay(), 0, "preview retired after Apply");
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Stamp text",
  );
  const saved = await docBytes();
  const outputContent = await page.evaluate(async (input) => {
    const load = (s: string) => import(s);
    const { getPdfJs } = await load("/src/utils/pdf/raster.ts");
    const task = (await getPdfJs()).getDocument({ data: new Uint8Array(input) });
    const pdf = await task.promise;
    try {
      const text = [];
      for (let i = 1; i <= pdf.numPages; i++)
        text.push(
          (await (await pdf.getPage(i)).getTextContent()).items.map((x: any) => x.str).join(" "),
        );
      return {
        text,
        metadata: (await pdf.getMetadata()).info,
        attachments: Array.from((await pdf.getAttachments()).keys()),
      };
    } finally {
      await task.destroy();
    }
  }, saved);
  for (let i = 0; i < 3; i++) {
    assert.ok(outputContent.text[i].includes(`Stamp acceptance ${i + 1}/3 ${expectedTime}`));
    assert.ok(outputContent.text[i].includes(`Body content on page ${i + 1}`));
  }
  assert.equal((outputContent.metadata as any).Title, "Stamp acceptance");
  assert.deepEqual(outputContent.attachments, ["reference.txt"]);
  await page.evaluate(() => (window as any).airActions.undo());
  await ready();
  await settle();
  assert.deepEqual(await docBytes(), before);
  assert.equal(await overlay(), 0, "Undo must not resurrect an applied draft");
  await clickText("Start another stamp");
  await settle();
  // A real encoder failure is actionable and never changes the document.
  await field("#stamp-text", "東京");
  await clickText("Add stamp");
  await page.waitForFunction(
    () => !(window as any).airRead.busyLabel && !!(window as any).airRead.error,
  );
  assert.deepEqual(await docBytes(), before);
  assert.match(await page.evaluate(() => (window as any).airRead.error), /Choose a Box/);
  await clickText("Box");
  await clickText("Ink stamp");
  await field("#stamp-text", "APPROVED");
  // Same buffer supplies preview and output; fractional sizes do not alias.
  const raster = await page.evaluate(async () => {
    const load = (s: string) => import(s);
    const { paintStamp, renderStampDataUrl, clearStampCache } = await load(
      "/src/utils/pdf/stamp-render.ts",
    );
    const opts = {
      text: "APPROVED",
      color: { r: 220, g: 20, b: 20 },
      shape: "rect",
      finish: "ink",
      texture: 0.25,
    };
    const img = renderStampDataUrl(24, opts);
    const c = document.createElement("canvas");
    c.width = img.widthPt * 3;
    c.height = img.heightPt * 3;
    paintStamp(c.getContext("2d"), c.width / 2, c.height / 2, 24, 3, 0, 1, opts);
    const same = c.toDataURL() === img.dataUrl;
    const small = renderStampDataUrl(24.1, opts),
      large = renderStampDataUrl(24.2, opts);
    let bounded = false;
    try {
      renderStampDataUrl(120, { ...opts, text: "W".repeat(3000), shape: "circle" });
    } catch {
      bounded = true;
    }
    clearStampCache();
    const repeat = renderStampDataUrl(24, opts).dataUrl === img.dataUrl;
    return { same, distinct: small.dataUrl !== large.dataUrl, bounded, repeat };
  });
  assert.deepEqual(raster, { same: true, distinct: true, bounded: true, repeat: true });
  await field("#stamp-fontSize", "120");
  await clickText("Circle");
  await field("#stamp-text", "W".repeat(160));
  assert.match(await page.$eval(".pdf-stamp-panel", (e) => e.textContent!), /too large to render/);
  await field("#stamp-text", "APPROVED");
  await clickText("Box");
  await field("#stamp-fontSize", "24");
  // Mobile Done awaits actual work, keeps failed input and prevents duplicate saves.
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  await page.evaluate(() => ((window as any).failRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(() => !(window as any).airRead.busyLabel);
  assert.equal(await page.evaluate(() => (window as any).airTool), "stamp-pdf");
  assert.deepEqual(await docBytes(), before);
  await page.evaluate(() => ((window as any).holdRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.equal(await page.evaluate(() => (window as any).airTool), "stamp-pdf");
  await page.evaluate(() => (window as any).releaseRead());
  await page.waitForFunction(() => (window as any).airTool === null);
  await tool();
  await ready();
  await settle();
  assert.equal(await overlay(), 0);
  // Cancel rolls back the tool transaction, including stamp settings.
  await clickText("Start another stamp");
  await field("#stamp-text", "CANCEL ME");
  await page.click('button[aria-label="Cancel"]');
  await tool();
  await ready();
  assert.equal(
    await page.$eval("#stamp-text", (e) => (e as HTMLInputElement).value),
    "CONFIDENTIAL",
  );
  // Failed metadata reads have a retry; late work from a closed tool is ignored.
  await tool("crop-pages");
  await page.evaluate(() =>
    (window as any).airActions.patchToolState("stamp-pdf", { context: undefined }),
  );
  await page.evaluate(() => ((window as any).failRead = true));
  await tool();
  await page.waitForSelector('.pdf-stamp-panel [role="alert"]');
  await clickText("Read fields again");
  await ready();
  await tool("crop-pages");
  await page.evaluate(() => {
    const w = window as any;
    w.airActions.patchToolState("stamp-pdf", { context: undefined });
    w.holdRead = true;
  });
  await tool();
  await page.waitForFunction(() => !!(window as any).releaseRead);
  await tool("crop-pages");
  await page.evaluate(() => (window as any).releaseRead());
  await settle();
  assert.equal(await page.evaluate(() => (window as any).airStamp.context), undefined);
  await tool();
  await ready();
  await clickText("Ink stamp");
  await clickText("Box");
  const showRegion = async (region: string) => {
    await page.$eval(region === "text" ? ".pdf-stamp-panel" : ".pdf-stamp-numbers", (e) => {
      const owner = e.closest(".editor-properties__body, .editor-mobile-sheet__body")!;
      for (let p = owner.parentElement; p; p = p.parentElement) p.scrollTop = 0;
      owner.scrollTop += e.getBoundingClientRect().top - owner.getBoundingClientRect().top;
    });
  };
  const layouts = [];
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
  for (const [width, height] of sizes)
    for (const theme of ["light", "dark"]) {
      await page.setViewport({ width, height });
      await cdp.send("Emulation.setTouchEmulationEnabled", {
        enabled: width < 1100,
        maxTouchPoints: 5,
      });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      await settle();
      for (const region of ["text", "numbers"]) {
        await showRegion(region);
        await settle();
        const metrics = await page.evaluate(() => {
          const p = document.querySelector(".pdf-stamp-panel")!;
          const coarse = matchMedia("(pointer:coarse)").matches;
          const bad = Array.from(p.querySelectorAll("button,input"))
            .filter((e) => {
              const r = e.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && r.height < (coarse ? 43 : 31);
            })
            .map((e) => e.getAttribute("aria-label") ?? e.textContent);
          return { overflow: document.documentElement.scrollWidth > innerWidth + 1, bad };
        });
        assert.equal(metrics.overflow, false);
        assert.deepEqual(metrics.bad, []);
        const file = `stamp-${region}-${width}x${height}-${theme}.png`;
        await page.screenshot({ path: join(output, file) });
        layouts.push({ width, height, theme, region, ...metrics, file });
      }
    }
  for (const width of [320, 768, 1440])
    for (const theme of ["light", "dark"]) {
      await page.setViewport({ width, height: 900 });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      await page.evaluate(() => (document.documentElement.style.fontSize = "32px"));
      await settle();
      for (const region of ["text", "numbers"]) {
        await showRegion(region);
        await settle();
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        );
        await page.screenshot({
          path: join(output, `stamp-${region}-text200-${width}-${theme}.png`),
        });
      }
    }
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  await settle();
  await page.screenshot({ path: join(output, "stamp-forced-colors.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "stamp-results.json"),
    JSON.stringify({ layouts, outputContent, raster, errors }, null, 2),
  );
  console.log(
    "Stamp: token/caret ownership, numeric validation, vector PDF output/catalog/text, bounded stable raster, draft retirement/Undo, mobile failure/wait/retry/Cancel, metadata retry, 44 layout regions and 12 enlarged-text cases passed.",
  );
} catch (error) {
  console.error(
    await page.evaluate(() => ({
      tool: (window as any).airTool,
      busy: (window as any).airRead?.busyLabel,
      text: document.querySelector(".pdf-stamp-panel")?.textContent,
      error: (window as any).airRead?.error,
    })),
  );
  await page.screenshot({ path: join(output, "stamp-failure.png") });
  throw error;
} finally {
  await browser.close();
}
