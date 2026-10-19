/** Header/footer drafts, precision controls, actual PDF output and Air acceptance. */
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
pdf.setTitle("Header proof");
pdf.setAuthor("Synthetic author");
await pdf.attach(new TextEncoder().encode("REFERENCE"), "reference.txt");
const bytes = Array.from(await pdf.save());
await writeFile(join(output, "Air header-footer.pdf"), new Uint8Array(bytes));
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
const tool = async (id = "header-footer") => {
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
      w.airHeaderFooter = useToolSlice("header-footer");
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
      return w.airHeaderFooter.sourceBytes === w.airRead.doc?.bytes;
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
  assert.equal(await overlay(), 0);
  // Inserting before focusing a text field has an explicit default destination.
  await clickText("Title");
  assert.equal(await page.$eval("#hf-headerLeft", (e) => (e as HTMLInputElement).value), "{title}");
  assert.match(await page.$eval("#hf-preview", (e) => e.textContent!), /Header proof/);
  await field("#hf-headerCenter", "OLD");
  await page.$eval("#hf-headerCenter", (e) => {
    (e as HTMLInputElement).focus();
    (e as HTMLInputElement).select();
  });
  await clickText("Date");
  assert.equal(
    await page.$eval("#hf-headerCenter", (e) => (e as HTMLInputElement).value),
    "{date}",
  );
  assert.equal(
    await page.$eval("#hf-headerCenter", (e) => (e as HTMLInputElement).selectionStart),
    6,
  );
  await field("#hf-headerRight", "{time}");
  await clickText("Footer");
  await field("#hf-footerLeft", "{filename}");
  await field("#hf-footerCenter", "Page {page} of {total}");
  await field("#hf-footerRight", "Private");
  await page.click('input[role="switch"]');
  await settle();
  assert.equal(await overlay(), 0, "cover excluded from preview");
  await page.evaluate(() => (window as any).airActions.setSelectedPage(1));
  await settle();
  assert.ok((await overlay()) > 20);
  for (const [key, bad, good] of [
    ["fontSize", "19", "10"],
    ["margin", "", "36"],
  ]) {
    await field(`#hf-${key}`, bad);
    assert.equal(await page.$eval(`#hf-${key}`, (e) => e.getAttribute("aria-invalid")), "true");
    assert.equal(
      await page.$eval(
        ".pdf-header-footer-panel .air-button--primary",
        (e) => (e as HTMLButtonElement).disabled,
      ),
      true,
    );
    await tool("crop-pages");
    await tool();
    await ready();
    await page.setViewport({ width: 390, height: 844 });
    await settle();
    assert.equal(await page.$eval(`#hf-${key}`, (e) => (e as HTMLInputElement).value), bad);
    assert.equal(
      await page.$eval("#hf-footerRight", (e) => (e as HTMLInputElement).value),
      "Private",
    );
    await page.setViewport({ width: 1440, height: 900 });
    await settle();
    await field(`#hf-${key}`, good);
  }
  await page.focus("#hf-fontSize");
  await page.keyboard.press("ArrowUp");
  await settle();
  assert.equal(
    await page.$eval('input[aria-label="Size slider"]', (e) => (e as HTMLInputElement).value),
    "11",
  );
  await field("#hf-fontSize", "10");
  await field("#hf-footerLeft", "UnbrokenText".repeat(40));
  assert.match(
    await page.$eval(".pdf-header-footer-panel", (e) => e.textContent!),
    /does not fit|overlaps/,
  );
  assert.equal(
    await page.$eval(
      ".pdf-header-footer-panel .air-button--primary",
      (e) => (e as HTMLButtonElement).disabled,
    ),
    true,
  );
  assert.equal(
    await page.$eval("#hf-preview", (e) => e.scrollWidth <= e.clientWidth + 1),
    true,
    "long field preview wraps",
  );
  await field("#hf-footerLeft", "{filename}");
  const clock = await page.evaluate(() => {
    const d = new Date((window as any).airHeaderFooter.context.timestamp);
    return [
      d.toLocaleDateString(),
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ];
  });
  const before = await docBytes();
  await clickText("Add header & footer");
  await page.waitForFunction(
    () => !(window as any).airRead.busyLabel && !(window as any).airHeaderFooter.sourceBytes,
  );
  await settle();
  assert.equal(await overlay(), 0);
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Header and footer settings",
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
  assert.ok(!outputContent.text[0].includes("Header proof"));
  for (let i = 1; i < 3; i++) {
    for (const text of ["Header proof", ...clock, "Air review", `Page ${i + 1} of 3`, "Private"])
      assert.ok(outputContent.text[i].includes(text), `saved page ${i + 1} contains ${text}`);
  }
  for (let i = 0; i < 3; i++)
    assert.ok(outputContent.text[i].includes(`Body content on page ${i + 1}`));
  assert.equal((outputContent.metadata as any).Title, "Header proof");
  assert.deepEqual(outputContent.attachments, ["reference.txt"]);
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  assert.deepEqual(await docBytes(), before);
  assert.equal(await overlay(), 0, "Undo cannot revive applied preview");
  await clickText("Start another header & footer");
  await ready();
  // Mobile Done waits for output and retains its settings on a real writer failure.
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  await page.evaluate(() => ((window as any).failRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(
    () => !(window as any).airRead.busyLabel && !!(window as any).airRead.error,
  );
  assert.equal(await page.evaluate(() => (window as any).airTool), "header-footer");
  assert.deepEqual(await docBytes(), before);
  assert.equal(
    await page.$eval("#hf-footerRight", (e) => (e as HTMLInputElement).value),
    "Private",
  );
  await page.evaluate(() => ((window as any).holdRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.equal(await page.evaluate(() => (window as any).airTool), "header-footer");
  await page.evaluate(() => (window as any).releaseRead());
  await page.waitForFunction(() => (window as any).airTool === null);
  await tool();
  await settle();
  assert.equal(await overlay(), 0);
  await clickText("Start another header & footer");
  await field("#hf-footerRight", "Discard this");
  await page.click('button[aria-label="Cancel"]');
  await tool();
  await ready();
  assert.equal(await page.$eval("#hf-headerLeft", (e) => (e as HTMLInputElement).value), "");
  await page.evaluate(() => (window as any).airActions.setSelectedPage(0));
  // A failed property read can retry; an abandoned read cannot publish into a later visit.
  await tool("crop-pages");
  await page.evaluate(() => {
    const w = window as any;
    w.airActions.patchToolState("header-footer", { context: undefined });
    w.failRead = true;
  });
  await tool();
  await page.waitForSelector('.pdf-header-footer-panel [role="alert"]');
  await clickText("Read fields again");
  await page.waitForFunction(
    () => (window as any).airHeaderFooter.context?.bytes === (window as any).airRead.doc.bytes,
  );
  await tool("crop-pages");
  await page.evaluate(() => {
    const w = window as any;
    w.airActions.patchToolState("header-footer", { context: undefined });
    w.holdRead = true;
  });
  await tool();
  await page.waitForFunction(() => !!(window as any).releaseRead);
  await tool("crop-pages");
  await page.evaluate(() => (window as any).releaseRead());
  await settle();
  assert.equal(await page.evaluate(() => (window as any).airHeaderFooter.context), undefined);
  await tool();
  await page.waitForFunction(
    () => (window as any).airHeaderFooter.context?.bytes === (window as any).airRead.doc.bytes,
  );
  await field("#hf-headerLeft", "{title}");
  await clickText("Footer");
  await field("#hf-footerCenter", "Page {page} of {total}");
  await clickText("Header");
  const showRegion = async (region: string) => {
    await page.$eval(
      region === "text" ? ".pdf-header-footer-fields" : ".pdf-header-footer-values",
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
      for (const region of ["text", "values"]) {
        await showRegion(region);
        await settle();
        const metrics = await page.evaluate(() => {
          const p = document.querySelector(".pdf-header-footer-panel")!;
          const coarse = matchMedia("(pointer:coarse)").matches;
          const bad = Array.from(
            p.querySelectorAll("button,input:not([role=switch]),.air-switch-row"),
          )
            .filter((e) => {
              const r = e.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && r.height < (coarse ? 43 : 31);
            })
            .map((e) => e.getAttribute("aria-label") ?? e.textContent);
          return { overflow: document.documentElement.scrollWidth > innerWidth + 1, bad };
        });
        assert.equal(metrics.overflow, false);
        assert.deepEqual(metrics.bad, []);
        const file = `header-footer-${region}-${width}x${height}-${theme}.png`;
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
      for (const region of ["text", "values"]) {
        await showRegion(region);
        await settle();
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        );
        await page.screenshot({
          path: join(output, `header-footer-${region}-text200-${width}-${theme}.png`),
        });
      }
    }
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  await settle();
  await page.screenshot({ path: join(output, "header-footer-forced-colors.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "header-footer-results.json"),
    JSON.stringify({ layouts, outputContent, errors }, null, 2),
  );
  console.log(
    "Header/footer: all six fields/token selection, precise values/persistence, overlap prevention, actual output/catalog/clock, Apply/Undo ownership, mobile failure/wait/retry/Cancel, 44 layout regions, 12 enlarged-text cases, forced colours and reduced motion passed.",
  );
} catch (error) {
  console.error(
    await page.evaluate(() => ({
      tool: (window as any).airTool,
      busy: (window as any).airRead?.busyLabel,
      text: document.querySelector(".pdf-header-footer-panel")?.textContent,
      error: (window as any).airRead?.error,
    })),
  );
  await page.screenshot({ path: join(output, "header-footer-failure.png") });
  throw error;
} finally {
  await browser.close();
}
