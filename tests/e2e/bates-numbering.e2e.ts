/** Bates-number drafts, precision controls, actual PDF output and Air acceptance. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-review";
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
}
pdf.setTitle("Bates acceptance");
pdf.setAuthor("Synthetic author");
await pdf.attach(new TextEncoder().encode("REFERENCE"), "reference.txt");
const bytes = Array.from(await pdf.save());
await writeFile(join(output, "Air Bates.pdf"), new Uint8Array(bytes));
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
const tool = async (id = "bates-numbering") => {
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
      w.airBates = useToolSlice("bates-numbering");
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
      return w.airBates.sourceBytes === w.airRead.doc?.bytes;
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
  assert.ok((await overlay()) > 20);
  for (const position of [
    "top left",
    "top center",
    "top right",
    "bottom left",
    "bottom center",
    "bottom right",
  ]) {
    await page.click(`button[aria-label="${position}"]`);
    assert.equal(
      await page.$eval(`button[aria-label="${position}"]`, (e) => e.getAttribute("aria-pressed")),
      "true",
    );
  }
  await field("#bates-prefix", "CASE-");
  await field("#bates-suffix", "-A");
  for (const digits of [4, 6, 8]) {
    await page.locator(`[aria-label="Minimum digits"] button::-p-text(${digits})`).click();
    assert.equal(
      await page.$eval('[aria-label="Minimum digits"] [aria-pressed="true"]', (e) => e.textContent),
      String(digits),
    );
    assert.match(
      await page.$eval("#bates-preview", (e) => e.textContent!),
      new RegExp(`CASE-${"1".padStart(digits, "0")}-A`),
    );
  }
  // A digit boundary grows naturally; every resulting identifier remains distinct.
  await page.locator('[aria-label="Minimum digits"] button::-p-text(4)').click();
  await field("#bates-startNumber", "9999");
  await page.evaluate(() => (window as any).airActions.setSelectedPage(1));
  await settle();
  assert.match(await page.$eval("#bates-preview", (e) => e.textContent!), /CASE-10000-A/);
  assert.ok((await overlay()) > 20);
  await field("#bates-prefix", "A".repeat(120));
  assert.equal(
    await page.$eval(
      ".pdf-bates-panel .air-button--primary",
      (e) => (e as HTMLButtonElement).disabled,
    ),
    true,
  );
  assert.equal(await overlay(), 0, "clipped identifiers are not painted");
  await field("#bates-prefix", "CASE-");
  // Invalid raw input survives tool switches and responsive remounts.
  for (const [key, bad, good] of [
    ["fontSize", "25", "12"],
    ["margin", "", "36"],
    ["startNumber", "1.5", "9999"],
    ["startNumber", "1000000000", "9999"],
  ]) {
    await field(`#bates-${key}`, bad);
    assert.equal(await page.$eval(`#bates-${key}`, (e) => e.getAttribute("aria-invalid")), "true");
    assert.equal(
      await page.$eval(
        ".pdf-bates-panel .air-button--primary",
        (e) => (e as HTMLButtonElement).disabled,
      ),
      true,
    );
    await tool("crop-pages");
    await tool();
    await ready();
    await page.setViewport({ width: 390, height: 844 });
    await settle();
    assert.equal(await page.$eval(`#bates-${key}`, (e) => (e as HTMLInputElement).value), bad);
    await page.setViewport({ width: 1440, height: 900 });
    await settle();
    await field(`#bates-${key}`, good);
  }
  // Native keyboard stepping and the slider share one last-valid value.
  await page.focus("#bates-fontSize");
  await page.keyboard.press("ArrowUp");
  await settle();
  assert.equal(
    await page.$eval('input[aria-label="Size slider"]', (e) => (e as HTMLInputElement).value),
    "13",
  );
  await field("#bates-fontSize", "12");
  // The full supported start value remains visible and valid.
  await field("#bates-startNumber", "999999999");
  assert.equal(
    await page.$eval("#bates-startNumber", (e) => e.getAttribute("aria-invalid")),
    "false",
  );
  assert.match(await page.$eval("#bates-preview", (e) => e.textContent!), /1000000000/);
  await field("#bates-startNumber", "9999");
  const before = await docBytes();
  // Unsupported standard-font text fails recoverably in the real writer.
  await field("#bates-prefix", "証拠-");
  await clickText("Add Bates numbers");
  await page.waitForFunction(
    () => !(window as any).airRead.busyLabel && !!(window as any).airRead.error,
  );
  assert.match(await page.evaluate(() => (window as any).airRead.error), /Courier cannot print/);
  assert.deepEqual(await docBytes(), before);
  assert.equal(await page.$eval("#bates-prefix", (e) => (e as HTMLInputElement).value), "証拠-");
  await field("#bates-prefix", "CASE-");
  await clickText("Add Bates numbers");
  await page.waitForFunction(
    () => !(window as any).airRead.busyLabel && !(window as any).airBates.sourceBytes,
  );
  await settle();
  assert.equal(await overlay(), 0);
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Bates number settings",
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
    const identifier = `CASE-${9999 + i}-A`;
    assert.equal(
      outputContent.text[i].split(identifier).length - 1,
      1,
      "one selectable identifier per page",
    );
  }
  for (let i = 0; i < 3; i++)
    assert.ok(outputContent.text[i].includes(`Body content on page ${i + 1}`));
  assert.equal((outputContent.metadata as any).Title, "Bates acceptance");
  assert.deepEqual(outputContent.attachments, ["reference.txt"]);
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  assert.deepEqual(await docBytes(), before);
  assert.equal(await overlay(), 0, "Undo cannot revive applied preview");
  await page.evaluate(() => (window as any).airActions.redo());
  await settle();
  assert.deepEqual(await docBytes(), saved);
  assert.equal(await overlay(), 0, "Redo cannot revive applied preview");
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  await clickText("Start another Bates numbering");
  await ready();
  // Mobile Done waits for output and retains its settings on a real writer failure.
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  await page.evaluate(() => ((window as any).failRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(
    () => !(window as any).airRead.busyLabel && !!(window as any).airRead.error,
  );
  assert.equal(await page.evaluate(() => (window as any).airTool), "bates-numbering");
  assert.deepEqual(await docBytes(), before);
  assert.equal(
    await page.$eval("#bates-startNumber", (e) => (e as HTMLInputElement).value),
    "9999",
  );
  await page.evaluate(() => ((window as any).holdRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.equal(await page.evaluate(() => (window as any).airTool), "bates-numbering");
  await page.evaluate(() => (window as any).releaseRead());
  await page.waitForFunction(() => (window as any).airTool === null);
  await tool();
  await settle();
  assert.equal(await overlay(), 0);
  await clickText("Start another Bates numbering");
  await field("#bates-startNumber", "123");
  await page.click('button[aria-label="Cancel"]');
  await tool();
  await ready();
  assert.equal(await page.$eval("#bates-startNumber", (e) => (e as HTMLInputElement).value), "1");
  // Review one pending preview on the original source, not over an applied number.
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  assert.deepEqual(await docBytes(), before);
  await clickText("Start another Bates numbering");
  await ready();
  await page.evaluate(() => (window as any).airActions.setSelectedPage(0));
  const showRegion = async (region: string) => {
    await page.$eval(
      region === "identifier" ? ".pdf-bates-panel" : '[aria-label="Number sequence and layout"]',
      (e) => {
        const owner = e.closest(".editor-properties__body, .editor-mobile-sheet__body")!;
        for (let p = owner.parentElement; p; p = p.parentElement) p.scrollTop = 0;
        owner.scrollTop += e.getBoundingClientRect().top - owner.getBoundingClientRect().top;
      },
    );
  };
  await field("#bates-prefix", "CASE-");
  await field("#bates-suffix", "-A");
  await field("#bates-startNumber", "999999999");
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
      for (const region of ["identifier", "values"]) {
        await showRegion(region);
        await settle();
        const metrics = await page.evaluate(() => {
          const p = document.querySelector(".pdf-bates-panel")!;
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
        const file = `bates-${region}-${width}x${height}-${theme}.png`;
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
      for (const region of ["identifier", "values"]) {
        await showRegion(region);
        await settle();
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        );
        await page.screenshot({
          path: join(output, `bates-${region}-text200-${width}-${theme}.png`),
        });
      }
    }
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  await settle();
  await page.screenshot({ path: join(output, "bates-forced-colors.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "bates-results.json"),
    JSON.stringify({ layouts, outputContent, errors }, null, 2),
  );
  console.log(
    "Bates: six positions, prefix/suffix/digit presets, nine-digit entry and digit boundary, precision persistence, encoding/fit failure recovery, selectable PDF identifiers/catalog, Apply/Undo ownership, mobile wait/retry/Cancel, 44 layout regions, 12 enlarged-text cases, forced colours and reduced motion passed.",
  );
} catch (error) {
  console.error(
    await page.evaluate(() => ({
      tool: (window as any).airTool,
      busy: (window as any).airRead?.busyLabel,
      text: document.querySelector(".pdf-bates-panel")?.textContent,
      error: (window as any).airRead?.error,
    })),
  );
  await page.screenshot({ path: join(output, "bates-failure.png") });
  throw error;
} finally {
  await browser.close();
}
