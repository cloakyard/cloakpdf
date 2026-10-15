/** Air privacy panels: real provider, async ownership, controls and responsive states. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-marks";
await mkdir(output, { recursive: true });
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (let i = 0; i < 2; i++) {
  const p = pdf.addPage([480, 640]);
  p.drawText("A little room to think.", { x: 40, y: 540, size: 24, font });
  p.drawText("hello@example.com", { x: 40, y: 490, size: 18, font });
  p.drawText("Private reference 7429", { x: 40, y: 440, size: 18, font });
}
const bytes = Array.from(await pdf.save());
await writeFile(join(output, "Air marks.pdf"), new Uint8Array(bytes));
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
const clickText = async (text: string) => page.locator(`button::-p-text(${text})`).click();
const count = () => page.evaluate(() => (window as any).airRead.doc.objects.length);
const tool = async (id: string) => {
  await page.evaluate((id) => (window as any).airActions.setActiveTool(id), id);
  await page.waitForSelector(".pdf-mark-panel");
};
try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(process.env.E2E_URL ?? "http://127.0.0.1:8122", { waitUntil: "networkidle2" });
  const eraseOutput = await page.evaluate(async (input) => {
    const load = async (path: string) => import(path);
    const { erasePdf } = await load("/src/utils/pdf/erase.ts");
    const { getPdfJs } = await load("/src/utils/pdf/raster.ts");
    const pdfjs = await getPdfJs();
    const file = new File([new Uint8Array(input)], "output.pdf");
    const inspect = async (bytes: Uint8Array) => {
      const task = pdfjs.getDocument({ data: bytes.slice() });
      try {
        const pdf = await task.promise,
          page = await pdf.getPage(1),
          untouched = await pdf.getPage(2);
        const text = (await page.getTextContent()).items.map((i: any) => i.str ?? "").join(" ");
        const native = (await untouched.getTextContent()).items
          .map((i: any) => i.str ?? "")
          .join(" ");
        const viewport = page.getViewport({ scale: 1 }),
          canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const pixels = ctx.getImageData(24, 122, 400, 60).data.slice();
        canvas.width = canvas.height = 0;
        return { text, native, pixels };
      } finally {
        await task.destroy();
      }
    };
    const original = await inspect(new Uint8Array(input));
    const rows = [];
    for (const mode of ["fill", "inpaint", "pixelate"]) {
      const bytes = await erasePdf(file, [
        { pageIndex: 0, xPct: 0.05, yPct: 0.19, wPct: 0.85, hPct: 0.1, mode, blockFrac: 0.22 },
      ]);
      const result = await inspect(bytes);
      const changed = result.pixels.reduce(
        (n: number, v: number, i: number) => n + (v !== original.pixels[i] ? 1 : 0),
        0,
      );
      if (result.text.trim() || result.native !== original.native || changed < 100)
        throw new Error(`Invalid ${mode} output`);
      rows.push({
        mode,
        changedPixels: changed,
        touchedPageHasNoTextOperators: true,
        untouchedTextPreserved: true,
      });
    }
    return rows;
  }, bytes);
  await page.evaluate(async (input) => {
    const load = async (path: string) => import(path);
    const React = (await load("/node_modules/.vite/deps/react.js")).default;
    const { createRoot } = (await load("/node_modules/.vite/deps/react-dom_client.js")).default;
    const source = await (await fetch("/src/editor/EditorShell.tsx")).text();
    const context = source.match(/from ["']([^"']*EditorContext\.tsx[^"']*)["']/)![1];
    const { EditorProvider, useEditorRead, useEditorActions } = await load(context);
    const { EditorShell } = await load("/src/editor/EditorShell.tsx");
    const { StageProvider } = await load("/src/editor/stage.tsx");
    const { MotionProvider } = await load("/src/components/motion.tsx");
    const w = window as any;
    function Probe() {
      w.airRead = useEditorRead();
      w.airActions = useEditorActions();
      return React.createElement(EditorShell);
    }
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    root.render(
      React.createElement(
        EditorProvider,
        {
          initialFile: new File([new Uint8Array(input)], "Air marks.pdf"),
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
      if (w.failRead) {
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
  await tool("redact-pdf");
  await page.type("#redaction-search", "Private");
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await page.click('[aria-label="Find and redact"]');
  await page.waitForSelector('#redaction-query-status[role="alert"]');
  assert.equal(
    await page.$eval("#redaction-search", (n) => (n as HTMLInputElement).value),
    "Private",
  );
  assert.notEqual(
    await page.$eval("#redaction-search", (n) => n.getAttribute("aria-invalid")),
    "true",
  );
  assert.equal(await count(), 0);
  await page.evaluate(() => {
    (window as any).holdRead = true;
  });
  await page.click('[aria-label="Find and redact"]');
  await page.waitForFunction(() => !!(window as any).releaseRead);
  await page.evaluate(() => {
    const b = document.querySelector<HTMLButtonElement>('[aria-label="Find and redact"]')!;
    b.click();
    b.click(); // Same task, before React can disable the initiator.
  });
  await clickText("Cancel scan");
  await page.evaluate(() => {
    (window as any).releaseRead();
  });
  await page.waitForFunction(() =>
    document.querySelector("#redaction-query-status")?.textContent?.includes("Cancelled"),
  );
  assert.equal(await count(), 0);
  await page.click('[aria-label="Find and redact"]');
  await page.waitForFunction(() => (window as any).airRead.doc.objects.length === 2);
  // Actual native-text matching and source bytes remain available until burn.
  await clickText("Detect & add boxes");
  await page.waitForFunction(() => (window as any).airRead.doc.objects.length === 4);
  await page.click('[aria-label="Remove box 4"]');
  assert.equal(await count(), 3);
  assert.ok(
    await page.evaluate(() =>
      document.activeElement?.classList.contains("pdf-mark-list__location"),
    ),
  );
  await page.evaluate(() => (window as any).airActions.undo());
  await page.waitForFunction(() => (window as any).airRead.doc.objects.length === 4);
  await clickText("Clear all");
  await page.waitForFunction(() => !(window as any).airRead.doc.objects.length);
  await page.evaluate(() => (window as any).airActions.undo());
  await page.waitForFunction(() => (window as any).airRead.doc.objects.length === 4);
  // Re-enter resets the geometry cache. A byte transform keeps doc.id but must
  // invalidate an old scan; navigation must also abandon it.
  for (const change of ["bytes", "tool"]) {
    await tool("smart-erase");
    await tool("redact-pdf");
    await page.type("#redaction-search", "Private");
    await page.evaluate(() => {
      (window as any).holdRead = true;
      (window as any).releaseRead = null;
    });
    await page.click('[aria-label="Find and redact"]');
    await page.waitForFunction(() => !!(window as any).releaseRead);
    if (change === "bytes")
      await page.evaluate(async () => {
        const w = window as any;
        w.beforeId = w.airRead.doc.id;
        await w.airActions.applyTransform(async (doc: any) => ({
          bytes: doc.bytes.slice(),
          label: "Test byte revision",
        }));
        if (w.airRead.doc.id !== w.beforeId) throw new Error("fixture should preserve id");
      });
    else await tool("smart-erase");
    const before = await count();
    await page.evaluate(() => {
      (window as any).releaseRead();
    });
    await page.evaluate(async () => {
      for (let i = 0; i < 10; i++) await new Promise(requestAnimationFrame);
    });
    assert.equal(await count(), before, `abandoned ${change} scan added marks`);
  }
  // Restore native text and add a pending mark for visual collection inspection.
  await page.evaluate(() => {
    const w = window as any;
    w.airActions.undo();
    w.airActions.addObject({
      kind: "erase",
      pageIndex: 0,
      rect: { xPct: 0.1, yPct: 0.6, wPct: 0.3, hPct: 0.1 },
      payload: { mode: "pixelate", blockFrac: 0.12 },
    });
  });
  await tool("redact-pdf");
  const popup = '[aria-label="Custom color picker"]';
  const trigger = '.pdf-color button[aria-label^="Custom color"]';
  await page.locator(trigger).click();
  await page.waitForSelector(popup);
  await page.click(`${popup} summary`);
  await page.focus('[aria-label="Saturation"]');
  const beforeSat = await page.$eval(
    '[aria-label="Saturation"]',
    (n) => +(n as HTMLInputElement).value,
  );
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page.$eval('[aria-label="Saturation"]', (n) => +(n as HTMLInputElement).value),
    beforeSat + 1,
  );
  await page.focus('input[name="hex-color"]');
  await page.$eval('input[name="hex-color"]', (n) => (n as HTMLInputElement).select());
  await page.keyboard.type("#zz");
  await page.focus('[aria-label="Close color picker"]');
  await page.waitForFunction(
    () =>
      document.querySelector('input[name="hex-color"]')?.getAttribute("aria-invalid") === "true",
    { timeout: 3000 },
  );
  assert.equal(
    await page.$eval('input[name="hex-color"]', (n) => n.getAttribute("aria-invalid")),
    "true",
  );
  await page.focus('input[name="hex-color"]');
  await page.$eval('input[name="hex-color"]', (n) => (n as HTMLInputElement).select());
  await page.keyboard.type("#123456");
  await page.keyboard.press("Escape");
  await page.waitForSelector(popup, { hidden: true });
  assert.ok(
    await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label")?.startsWith("Custom color"),
    ),
  );
  const layouts: unknown[] = [];
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
  for (const theme of ["light", "dark"]) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    for (const [width, height] of sizes) {
      await page.setViewport({ width, height });
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: width <= 1024 });
      for (const id of ["redact-pdf", "smart-erase"]) {
        await tool(id);
        if (id === "smart-erase") await clickText("Pixelate");
        await page.evaluate(async () => {
          for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
        });
        const row = await page.evaluate(() => {
          const panel = document.querySelector<HTMLElement>(".pdf-mark-panel")!;
          const b = panel.getBoundingClientRect();
          const bad = [
            ...panel.querySelectorAll<HTMLElement>(
              "button, input:not([type=checkbox]), .air-check-label",
            ),
          ]
            .filter((n) => {
              const r = n.getBoundingClientRect();
              return (
                r.width &&
                (r.left < b.left - 1 ||
                  r.right > b.right + 1 ||
                  (matchMedia("(pointer: coarse)").matches && r.height < 43))
              );
            })
            .map((n) => n.outerHTML.slice(0, 160));
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            panelOverflow: panel.scrollWidth > panel.clientWidth + 1,
            bad,
          };
        });
        assert.equal(row.overflow, false, `${id} ${width} page overflow`);
        assert.equal(row.panelOverflow, false, `${id} ${width} panel overflow`);
        assert.deepEqual(row.bad, [], `${id} ${width} controls`);
        layouts.push({ theme, width, height, id, ...row });
        if ([390, 768, 1280, 1440].includes(width)) {
          await page.$eval(".pdf-mark-panel", (n) => {
            for (let parent = n.parentElement; parent; parent = parent.parentElement)
              parent.scrollTop = 0;
          });
          await page.screenshot({ path: join(output, `${id}-${width}-${theme}.png`) });
        }
      }
      await tool("redact-pdf");
      await page.locator(trigger).click();
      await page.waitForSelector(popup);
      const box = await page.$eval(popup, (n) => {
        const r = n.getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
      });
      assert.ok(
        box.x >= 15 && box.y >= 15 && box.right <= width - 15 && box.bottom <= height - 15,
        JSON.stringify({ width, height, box }),
      );
      if (width === 390 || width === 1440)
        await page.screenshot({ path: join(output, `colour-${width}-${theme}.png`) });
      await page.keyboard.press("Escape");
    }
  }
  // Resizing an already-open picker can move its anchor outside the scroller.
  // Its content must remain reachable even before the anchor is scrolled back.
  await page.setViewport({ width: 1440, height: 900 });
  await tool("redact-pdf");
  await page.locator(trigger).click();
  await page.setViewport({ width: 1440, height: 420 });
  await page.waitForFunction(() => {
    const b = document.querySelector('[aria-label="Custom color picker"]')?.getBoundingClientRect();
    return b && b.top >= 15 && b.bottom <= innerHeight - 15;
  });
  await page.keyboard.press("Escape");
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  await tool("redact-pdf");
  await page.locator(trigger).click();
  await page.waitForSelector(popup);
  assert.ok(await page.$eval(popup, (n) => n.scrollWidth <= n.clientWidth + 1));
  await page.screenshot({ path: join(output, "colour-phone-text-200.png") });
  await page.keyboard.press("Escape");
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  assert.equal(await page.$eval(".air-check", (n) => getComputedStyle(n).appearance), "auto");
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "privacy-panels.json"),
    JSON.stringify(
      {
        layouts,
        eraseOutput,
        asyncOwnership: true,
        searchAndDetection: true,
        removeUndo: true,
        colourKeyboardAndInvalid: true,
        colourLayouts: 22,
        text200: true,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `PASS ${layouts.length} panel states, 22 colour popovers, text enlargement, actual search/PII, cancellation/failure/retry, stale bytes/tool results and mark undo.`,
  );
} finally {
  await browser.close();
}
