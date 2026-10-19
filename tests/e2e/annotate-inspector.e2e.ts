/** Air annotation inspector: selection, live edits, output and responsive states. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-review";
await mkdir(output, { recursive: true });
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (const size of [
  [400, 600],
  [600, 400],
  [400, 600],
]) {
  const p = pdf.addPage(size as [number, number]);
  p.drawText(`Original page ${pdf.getPageCount()}`, { x: 30, y: 340, size: 18, font });
}
pdf.setTitle("Annotation acceptance");
await pdf.attach(new TextEncoder().encode("REFERENCE"), "reference.txt");
const bytes = Array.from(await pdf.save());
pdf.setSubject("Clean layout review");
const reviewBytes = Array.from(await pdf.save());
await writeFile(join(output, "Air annotations.pdf"), new Uint8Array(bytes));
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
const tool = async (id = "annotate-pdf") => {
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
      w.airAnnotation = useToolSlice("annotate-pdf");
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
  const marks = () =>
    page.evaluate(() =>
      (window as any).airRead.doc.objects.filter((o: any) => o.kind === "annotation"),
    );
  const selected = async () => {
    const all = await marks();
    const id = await page.evaluate(() => (window as any).airAnnotation.selectedId);
    return all.find((o: any) => o.id === id);
  };
  const mode = (label: string) =>
    page.locator(`[aria-label="Annotation tool"] button::-p-text(${label})`).click();
  const field = async (key: string, value: string) => {
    await page.$eval(`#annotate-${key}`, (e) => {
      (e as HTMLInputElement).focus();
      (e as HTMLInputElement).select();
    });
    await page.keyboard.press("Backspace");
    if (value) await page.keyboard.sendCharacter(value);
    await page.keyboard.press("Tab");
    await settle();
  };
  const idle = () => new Promise((r) => setTimeout(r, 500)); // exercise the actual edit coalescer
  const switchControl = (label: string) =>
    page.locator(`::-p-aria([name="${label}"][role="switch"])`).click();
  const chooseFont = async (label: string) => {
    await page.click('[aria-label="Font family"]');
    await page.locator(`[role="option"]::-p-text(${label})`).click();
    await settle();
  };
  const draw = async (x: number, y: number, w: number, h: number) => {
    const b = await page.$eval(".editor-paper img", (e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    await page.mouse.move(b.x + b.w * x, b.y + b.h * y);
    await page.mouse.down();
    await page.mouse.move(b.x + b.w * (x + w), b.y + b.h * (y + h), { steps: 8 });
    await page.mouse.up();
    await settle();
  };
  const selectMark = async (id: string) => {
    await page.click("#annotation-selection");
    const option = await page.$(`[role="option"][data-value="${id}"]`);
    // Shared Select's options expose their accessible label; the fixture knows its index.
    if (option) await option.click();
    else {
      const all = await marks();
      const index = all.findIndex((o: any) => o.id === id);
      await page.locator(`[role="option"]::-p-text(${index + 1} ·)`).click();
    }
    await settle();
  };
  assert.equal(
    await page.$eval(
      ".pdf-annotate-panel .air-button--primary",
      (e) => (e as HTMLButtonElement).disabled,
    ),
    true,
  );
  await mode("Rectangle");
  await switchControl("Fill shape");
  await field("fillOpacity", "35");
  await draw(0.2, 0.18, 0.35, 0.18);
  let rect = await selected();
  assert.equal(rect.payload.kind, "rect");
  assert.equal(rect.payload.fill.opacity, 0.35);
  assert.equal(await page.evaluate(() => (window as any).airAnnotation.mode), "select");
  assert.ok(await page.$("#annotate-fillOpacity"), "selected shape retains fill controls");
  await field("fillOpacity", "65");
  await idle();
  assert.equal((await selected()).payload.fill.opacity, 0.65);
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  assert.equal((await selected()).payload.fill.opacity, 0.35);
  assert.equal(
    await page.$eval("#annotate-fillOpacity", (e) => (e as HTMLInputElement).value),
    "35",
  );
  await page.evaluate(() => (window as any).airActions.redo());
  await settle();
  // Invalid numeric drafts are retained across both remount and tool switches.
  await field("fillOpacity", "101");
  assert.equal(
    await page.$eval("#annotate-fillOpacity", (e) => e.getAttribute("aria-invalid")),
    "true",
  );
  assert.equal((await selected()).payload.fill.opacity, 0.65);
  assert.equal(
    await page.$eval(
      ".pdf-annotate-panel .air-button--primary",
      (e) => (e as HTMLButtonElement).disabled,
    ),
    true,
  );
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  assert.equal(
    await page.$eval("#annotate-fillOpacity", (e) => (e as HTMLInputElement).value),
    "101",
  );
  await tool("organize-pages");
  await tool();
  assert.equal(
    await page.$eval("#annotate-fillOpacity", (e) => (e as HTMLInputElement).value),
    "101",
  );
  await field("fillOpacity", "65");
  await idle();
  await page.setViewport({ width: 1440, height: 900 });
  await settle();
  await mode("Text");
  await chooseFont("Roboto");
  await page.click('button[aria-label="Bold"]');
  await page.click('button[aria-label="Underline"]');
  await draw(0.15, 0.45, 0.7, 0.15);
  await page.waitForSelector('textarea[aria-label="Text annotation"]');
  await page.keyboard.sendCharacter("Air annotation\nSecond line");
  await page.keyboard.press("Tab");
  await settle();
  let text = await selected();
  assert.equal(text.payload.kind, "text");
  assert.equal(text.payload.font, "roboto-bold");
  assert.equal(text.payload.underline, true);
  await field("sizePt", "24");
  await switchControl("Background");
  await field("bgOpacity", "80");
  await idle();
  assert.equal((await selected()).payload.sizeFrac * 600, 24);
  assert.equal((await selected()).payload.bg.opacity, 0.8);
  await page.click('button[aria-label="Italic"]');
  await chooseFont("Oswald");
  assert.equal(
    await page.$eval(
      'button[aria-label="Italic (unavailable for this font)"]',
      (e) => (e as HTMLButtonElement).disabled,
    ),
    true,
  );
  await chooseFont("Roboto");
  assert.equal(
    await page.$eval('button[aria-label="Italic"]', (e) => e.getAttribute("aria-pressed")),
    "false",
  );
  await idle();
  // All drawing modes still arm once and select their own new object.
  for (const label of ["Pen", "Highlight", "Line", "Arrow", "Oval", "Icons"]) {
    await mode(label);
    await draw(0.65, 0.14, 0.15, 0.12);
    if (label === "Icons") {
      assert.equal(
        await page.evaluate(() => (window as any).airAnnotation.mode),
        "icon",
        "repeat glyph stamping stays armed",
      );
      await selectMark((await marks()).at(-1).id);
    } else {
      assert.ok(await selected(), label);
      assert.equal(await page.evaluate(() => (window as any).airAnnotation.mode), "select");
    }
  }
  const icon = await selected();
  await page.click('[aria-label="Cross"]');
  await idle();
  assert.equal((await selected()).payload.icon, "cross", "selected icon can change glyph");
  await selectMark(rect.id);
  assert.equal((await selected()).id, rect.id);
  // New cross-page selection is preserved, including the editor's page-change effect.
  const page2 = await page.evaluate(() =>
    (window as any).airActions.addObject({
      kind: "annotation",
      pageIndex: 1,
      payload: {
        kind: "text",
        pageIndex: 1,
        x: 0.1,
        y: 0.1,
        w: 0.7,
        h: 0.2,
        text: "Second page label",
        font: "helvetica",
        color: { r: 30, g: 41, b: 59 },
        sizeFrac: 18 / 400,
      },
    }),
  );
  await settle();
  await selectMark(page2);
  assert.equal(await page.evaluate(() => (window as any).airRead.selectedPage), 1);
  assert.equal((await selected()).id, page2);
  await selectMark(icon.id);
  await clickText("Delete annotation");
  await settle();
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), "Select");
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  assert.ok((await marks()).some((o: any) => o.id === icon.id));
  // A deferred style edit must not destroy the redo tail after an immediate Undo.
  await selectMark(text.id);
  await page.click('button[aria-label="Bold"]');
  await page.evaluate(() => (window as any).airActions.undo());
  await idle();
  await settle();
  assert.equal(await page.evaluate(() => (window as any).airRead.canRedo), true);
  await page.evaluate(() => (window as any).airActions.redo());
  await settle();
  await selectMark(text.id);
  const original = await docBytes();
  const pending = await marks();
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  await page.evaluate(() => ((window as any).failRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(
    () => !(window as any).airRead.busyLabel && !!(window as any).airRead.error,
  );
  assert.deepEqual(await marks(), pending);
  assert.deepEqual(await docBytes(), original);
  assert.equal((await selected()).id, text.id);
  assert.equal(await page.evaluate(() => (window as any).airTool), "annotate-pdf");
  await page.evaluate(() => ((window as any).holdRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.equal(
    await page.$eval(".pdf-annotate-panel fieldset", (e) => (e as HTMLFieldSetElement).disabled),
    true,
  );
  assert.equal(await page.evaluate(() => (window as any).airTool), "annotate-pdf");
  await page.evaluate(() => {
    void (window as any).airActions.flushPendingApply();
  });
  await page.evaluate(() => (window as any).releaseRead());
  await page.waitForFunction(
    () => (window as any).airTool === null && !(window as any).airRead.busyLabel,
  );
  assert.equal((await marks()).length, 0);
  const saved = await docBytes();
  const outputContent = await page.evaluate(async (input) => {
    const load = (s: string) => import(s);
    const { getPdfJs } = await load("/src/utils/pdf/raster.ts");
    const engine = await getPdfJs();
    const task = engine.getDocument({ data: new Uint8Array(input) });
    const d = await task.promise;
    try {
      const pages = [];
      for (let n = 1; n <= d.numPages; n++) {
        const p = await d.getPage(n);
        const ops = await p.getOperatorList();
        pages.push({
          text: (await p.getTextContent()).items.map((i: any) => i.str).join(" "),
          images: ops.fnArray.filter((x: number) =>
            [engine.OPS.paintImageXObject, engine.OPS.paintInlineImageXObject].includes(x),
          ).length,
          paths: ops.fnArray.filter((x: number) => x === engine.OPS.constructPath).length,
        });
      }
      return { pages, attachments: Array.from((await d.getAttachments()).keys()) };
    } finally {
      await task.destroy();
    }
  }, saved);
  assert.ok(outputContent.pages[0].text.includes("Original page 1"));
  assert.equal(outputContent.pages[0].text.split("Air annotation").length - 1, 1);
  assert.ok(outputContent.pages[1].text.includes("Second page label"));
  assert.ok(outputContent.pages[0].paths > 0);
  assert.ok(outputContent.pages.every((p) => p.images === 0));
  assert.ok(outputContent.attachments.includes("reference.txt"));
  const savedPdf = await PDFDocument.load(new Uint8Array(saved));
  assert.equal(savedPdf.getTitle(), "Annotation acceptance");
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  assert.deepEqual(await marks(), pending);
  await page.evaluate(() => (window as any).airActions.redo());
  await settle();
  assert.equal((await marks()).length, 0);
  // Cancel during the coalescing interval cannot write a new history entry on unmount.
  await page.setViewport({ width: 1440, height: 900 });
  await tool();
  await mode("Rectangle");
  await draw(0.1, 0.7, 0.2, 0.1);
  await switchControl("Fill shape");
  await page.evaluate(() => (window as any).airActions.cancelCurrentTool());
  await idle();
  await settle();
  assert.equal((await marks()).length, 0);
  assert.deepEqual(await docBytes(), saved);
  // Representative live objects for every viewport and both themes.
  await page.evaluate(async (input) => {
    await (window as any).airActions.loadFile(
      new File([new Uint8Array(input)], "Air annotations.pdf"),
    );
  }, reviewBytes);
  await page.waitForFunction(() => !(window as any).airRead.opening);
  await tool();
  const reviewIds = await page.evaluate(() =>
    (window as any).airActions.addObjects(
      [
        {
          kind: "annotation",
          pageIndex: 0,
          payload: {
            kind: "text",
            pageIndex: 0,
            x: 0.12,
            y: 0.13,
            w: 0.76,
            h: 0.15,
            text: "A little clarity.\nMade with Air.",
            font: "roboto",
            color: { r: 30, g: 41, b: 59 },
            sizeFrac: 24 / 600,
            bg: { color: { r: 255, g: 255, b: 255 }, opacity: 0.8 },
          },
        },
        {
          kind: "annotation",
          pageIndex: 0,
          payload: {
            kind: "rect",
            pageIndex: 0,
            x: 0.12,
            y: 0.48,
            w: 0.6,
            h: 0.18,
            color: { r: 30, g: 41, b: 59 },
            thicknessFrac: 0.004,
            fill: { color: { r: 37, g: 99, b: 235 }, opacity: 0.3 },
          },
        },
        {
          kind: "annotation",
          pageIndex: 0,
          payload: {
            kind: "icon",
            pageIndex: 0,
            x: 0.76,
            y: 0.5,
            w: 0.1,
            h: 0.067,
            color: { r: 30, g: 41, b: 59 },
            icon: "check",
          },
        },
      ],
      "Review annotations",
    ),
  );
  await settle();
  const showRegion = async (region: string) =>
    page.$eval(
      region === "tools"
        ? ".pdf-annotate-panel"
        : region === "style"
          ? "#annotation-font"
          : "#annotate-bgOpacity",
      (e) => {
        const owner = e.closest(".editor-properties__body, .editor-mobile-sheet__body")!;
        for (let p = owner.parentElement; p; p = p.parentElement) p.scrollTop = 0;
        owner.scrollTop += e.getBoundingClientRect().top - owner.getBoundingClientRect().top;
      },
    );
  const layouts = [];
  for (const [width, height] of [
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
  ])
    for (const theme of ["light", "dark"]) {
      await page.setViewport({ width, height });
      await cdp.send("Emulation.setTouchEmulationEnabled", {
        enabled: width < 1100,
        maxTouchPoints: 1,
      });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      await settle();
      for (const [state, id] of [
        ["text", reviewIds[0]],
        ["shape", reviewIds[1]],
        ["icon", reviewIds[2]],
      ] as const) {
        await selectMark(id);
        for (const region of state === "text" ? ["tools", "style", "background"] : ["tools"]) {
          await showRegion(region);
          await settle();
          const metrics = await page.evaluate(() => {
            const p = document.querySelector(".pdf-annotate-panel")!;
            const coarse = matchMedia("(pointer:coarse)").matches;
            const bad = Array.from(p.querySelectorAll("button,input"))
              .filter((e) => {
                const r = e.getBoundingClientRect();
                return r.width > 0 && r.height > 0 && r.height < (coarse ? 43 : 31);
              })
              .map((e) => e.getAttribute("aria-label") ?? e.textContent);
            return { overflow: document.documentElement.scrollWidth > innerWidth + 1, bad, coarse };
          });
          assert.equal(metrics.overflow, false);
          assert.deepEqual(metrics.bad, []);
          assert.equal(metrics.coarse, width < 1100);
          const file = `annotate-${state}-${region}-${width}x${height}-${theme}.png`;
          await page.screenshot({ path: join(output, file) });
          layouts.push({ width, height, theme, state, region, ...metrics, file });
        }
      }
    }
  for (const width of [320, 768, 1440])
    for (const theme of ["light", "dark"]) {
      await page.setViewport({ width, height: 900 });
      await cdp.send("Emulation.setTouchEmulationEnabled", {
        enabled: width < 1100,
        maxTouchPoints: 1,
      });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      await page.evaluate(() => (document.documentElement.style.fontSize = "32px"));
      await settle();
      await selectMark(reviewIds[0]);
      for (const region of ["tools", "style", "background"]) {
        await showRegion(region);
        await settle();
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        );
        await page.screenshot({
          path: join(output, `annotate-text200-${region}-${width}-${theme}.png`),
        });
      }
    }
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await showRegion("style");
  await settle();
  await page.screenshot({ path: join(output, "annotate-forced-colors.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "annotate-results.json"),
    JSON.stringify({ layouts, outputContent, errors }, null, 2),
  );
  console.log(
    "Annotations: all drawing modes, per-object text/fill/icon controls, font styles, numeric drafts, cross-page selection, deletion focus, live Undo/Cancel safety, mobile wait/failure/retry, vector/text/catalog output, 110 size/theme captures, 18 text200 states and forced colours/reduced motion passed.",
  );
} catch (error) {
  console.error(
    await page.evaluate(() => ({
      tool: (window as any).airTool,
      error: (window as any).airRead?.error,
      text: document.querySelector(".pdf-annotate-panel")?.textContent,
    })),
  );
  await page.screenshot({ path: join(output, "annotate-failure.png") });
  throw error;
} finally {
  await browser.close();
}
