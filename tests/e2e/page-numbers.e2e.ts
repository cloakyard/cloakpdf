/** Page-number drafts, precision controls, actual PDF output and Air acceptance. */
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
}
pdf.setTitle("Numbering acceptance");
pdf.setAuthor("Synthetic author");
await pdf.attach(new TextEncoder().encode("REFERENCE"), "reference.txt");
const bytes = Array.from(await pdf.save());
await writeFile(join(output, "Air numbers.pdf"), new Uint8Array(bytes));
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
const tool = async (id = "add-page-numbers") => {
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
      w.airNumbers = useToolSlice("add-page-numbers");
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
      return w.airNumbers.sourceBytes === w.airRead.doc?.bytes;
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
  // The actual custom menu supports keyboard selection and complete format names.
  await page.focus("#page-number-format");
  await page.keyboard.press("Space");
  await page.waitForSelector('[role="listbox"]');
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  assert.equal(await page.$eval("#page-number-format", (e) => e.textContent), "Page 1 of N");
  await field("#number-firstPage", "2");
  await field("#number-startNumber", "7");
  assert.equal(await overlay(), 0, "cover excluded from preview");
  await page.evaluate(() => (window as any).airActions.setSelectedPage(1));
  await settle();
  assert.ok((await overlay()) > 20);
  assert.match(await page.$eval("#page-number-preview", (e) => e.textContent!), /Page 7 of 8/);
  // Invalid raw input survives tool switches and responsive remounts.
  for (const [key, bad, good] of [
    ["fontSize", "25", "12"],
    ["margin", "", "36"],
    ["firstPage", "4", "2"],
    ["startNumber", "1.5", "7"],
  ]) {
    await field(`#number-${key}`, bad);
    assert.equal(await page.$eval(`#number-${key}`, (e) => e.getAttribute("aria-invalid")), "true");
    assert.equal(
      await page.$eval(
        ".pdf-numbering-panel .air-button--primary",
        (e) => (e as HTMLButtonElement).disabled,
      ),
      true,
    );
    await tool("crop-pages");
    await tool();
    await ready();
    await page.setViewport({ width: 390, height: 844 });
    await settle();
    assert.equal(await page.$eval(`#number-${key}`, (e) => (e as HTMLInputElement).value), bad);
    await page.setViewport({ width: 1440, height: 900 });
    await settle();
    await field(`#number-${key}`, good);
  }
  // Native keyboard stepping and the slider share one last-valid value.
  await page.focus("#number-fontSize");
  await page.keyboard.press("ArrowUp");
  await settle();
  assert.equal(
    await page.$eval('input[aria-label="Size slider"]', (e) => (e as HTMLInputElement).value),
    "13",
  );
  await field("#number-fontSize", "12");
  const before = await docBytes();
  await clickText("Add page numbers");
  await page.waitForFunction(
    () => !(window as any).airRead.busyLabel && !(window as any).airNumbers.sourceBytes,
  );
  await settle();
  assert.equal(await overlay(), 0);
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Page number settings",
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
  assert.ok(!outputContent.text[0].includes("of 8"));
  assert.ok(outputContent.text[1].includes("Page 7 of 8"));
  assert.ok(outputContent.text[2].includes("Page 8 of 8"));
  for (let i = 0; i < 3; i++)
    assert.ok(outputContent.text[i].includes(`Body content on page ${i + 1}`));
  assert.equal((outputContent.metadata as any).Title, "Numbering acceptance");
  assert.deepEqual(outputContent.attachments, ["reference.txt"]);
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  assert.deepEqual(await docBytes(), before);
  assert.equal(await overlay(), 0, "Undo cannot revive applied preview");
  await clickText("Start another numbering");
  await ready();
  // Mobile Done waits for output and retains its settings on a real writer failure.
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  await page.evaluate(() => ((window as any).failRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(
    () => !(window as any).airRead.busyLabel && !!(window as any).airRead.error,
  );
  assert.equal(await page.evaluate(() => (window as any).airTool), "add-page-numbers");
  assert.deepEqual(await docBytes(), before);
  assert.equal(await page.$eval("#number-startNumber", (e) => (e as HTMLInputElement).value), "7");
  await page.evaluate(() => ((window as any).holdRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.equal(await page.evaluate(() => (window as any).airTool), "add-page-numbers");
  await page.evaluate(() => (window as any).releaseRead());
  await page.waitForFunction(() => (window as any).airTool === null);
  await tool();
  await settle();
  assert.equal(await overlay(), 0);
  await clickText("Start another numbering");
  await field("#number-startNumber", "123");
  await page.click('button[aria-label="Cancel"]');
  await tool();
  await ready();
  assert.equal(await page.$eval("#number-startNumber", (e) => (e as HTMLInputElement).value), "1");
  await page.evaluate(() => (window as any).airActions.setSelectedPage(0));
  const showRegion = async (region: string) => {
    await page.$eval(
      region === "position" ? ".pdf-numbering-panel" : ".pdf-numbering-values",
      (e) => {
        const owner = e.closest(".editor-properties__body, .editor-mobile-sheet__body")!;
        for (let p = owner.parentElement; p; p = p.parentElement) p.scrollTop = 0;
        owner.scrollTop += e.getBoundingClientRect().top - owner.getBoundingClientRect().top;
      },
    );
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
      for (const region of ["position", "values"]) {
        await showRegion(region);
        await settle();
        const metrics = await page.evaluate(() => {
          const p = document.querySelector(".pdf-numbering-panel")!;
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
        const file = `numbers-${region}-${width}x${height}-${theme}.png`;
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
      for (const region of ["position", "values"]) {
        await showRegion(region);
        await settle();
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        );
        await page.screenshot({
          path: join(output, `numbers-${region}-text200-${width}-${theme}.png`),
        });
      }
    }
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  await settle();
  await page.screenshot({ path: join(output, "numbers-forced-colors.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "numbers-results.json"),
    JSON.stringify({ layouts, outputContent, errors }, null, 2),
  );
  console.log(
    "Page numbers: six positions/custom format menu, sequence/precision validation and persistence, PDF output/text/catalog, Apply/Undo ownership, mobile failure/wait/retry/Cancel, 44 layout regions, 12 enlarged-text cases, forced colours and reduced motion passed.",
  );
} catch (error) {
  console.error(
    await page.evaluate(() => ({
      tool: (window as any).airTool,
      busy: (window as any).airRead?.busyLabel,
      text: document.querySelector(".pdf-numbering-panel")?.textContent,
      error: (window as any).airRead?.error,
    })),
  );
  await page.screenshot({ path: join(output, "numbers-failure.png") });
  throw error;
} finally {
  await browser.close();
}
