/** Air code controls: real placement, vector output, recovery and responsive states. */
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
pdf.setTitle("Code acceptance");
await pdf.attach(new TextEncoder().encode("REFERENCE"), "reference.txt");
const bytes = Array.from(await pdf.save());
pdf.setSubject("Clean layout review");
const reviewBytes = Array.from(await pdf.save());
await writeFile(join(output, "Air codes.pdf"), new Uint8Array(bytes));
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
const tool = async (id = "qr-stamp") => {
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
      w.airCode = useToolSlice("qr-stamp");
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
  const field = async (value: string) => {
    await page.$eval("#code-content", (e) => {
      (e as HTMLInputElement).focus();
      (e as HTMLInputElement).select();
    });
    await page.keyboard.press("Backspace");
    if (value) await page.keyboard.sendCharacter(value);
    await page.keyboard.press("Tab");
    await settle();
  };
  const stamps = () =>
    page.evaluate(() => (window as any).airRead.doc.objects.filter((o: any) => o.kind === "stamp"));
  const waitApplied = () =>
    page.waitForFunction(
      () =>
        !(window as any).airRead.busyLabel &&
        !(window as any).airRead.doc.objects.some((o: any) => o.kind === "stamp"),
    );
  const pickType = (type: string) =>
    page.locator(`[aria-label="Code type"] button::-p-text(${type})`).click();
  const ready = () => page.waitForSelector("#code-content");
  await ready();
  assert.equal(
    await page.$eval(
      ".pdf-code-panel .air-button--primary",
      (e) => (e as HTMLButtonElement).disabled,
    ),
    true,
  );
  await pickType("Barcode");
  await field("café😀");
  assert.equal(await page.$eval("#code-content", (e) => e.getAttribute("aria-invalid")), "true");
  assert.equal(await page.$('img[alt="Code preview"]'), null);
  await pickType("QR code");
  assert.ok(await page.$('img[alt="Code preview"]'), "Unicode QR preview");
  await field("x".repeat(2400));
  assert.equal(await page.$eval("#code-content", (e) => e.getAttribute("aria-invalid")), "true");
  await tool("organize-pages");
  await tool();
  await ready();
  assert.equal(
    await page.$eval("#code-content", (e) => (e as HTMLInputElement).value.length),
    2400,
    "invalid draft survives tool switch",
  );
  await field("https://cloakyard.com/verify/42");
  const before = await docBytes();
  // A page-edge tap preserves the entire quiet zone.
  const box = await page.$eval(".editor-paper img", (e) => {
    const r = e.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  await page.mouse.click(box.x + box.w * 0.99, box.y + box.h * 0.99);
  await settle();
  let placed = await stamps();
  assert.equal(placed.length, 1);
  assert.ok(placed[0].rect.xPct + placed[0].rect.wPct <= 1.000001);
  assert.ok(placed[0].rect.yPct + placed[0].rect.hPct <= 1.000001);
  // Keyboard alternatives work without dragging.
  await page.click('button[aria-label="Move left"]');
  await page.click('button[aria-label="Larger code"]');
  await page.click('button[aria-label="Smaller code"]');
  await clickText("Same spot on all");
  await settle();
  placed = await stamps();
  assert.equal(placed.length, 3);
  for (const o of placed) {
    const [w, h] = o.pageIndex === 1 ? [600, 400] : [400, 600];
    assert.ok(
      Math.abs(o.rect.wPct * w - o.rect.hPct * h) < 0.001,
      "QR remains square on mixed pages",
    );
    assert.ok(o.rect.xPct + o.rect.wPct <= 1.000001 && o.rect.yPct + o.rect.hPct <= 1.000001);
  }
  assert.equal(
    await page
      .locator("button::-p-text(Same spot on all)")
      .map((e) => (e as HTMLButtonElement).disabled)
      .wait(),
    true,
  );
  // Cross-page custom selection keeps its chosen code selected.
  await page.click("#code-selection");
  await page.locator('[role="option"]::-p-text(Code 2)').click();
  await settle();
  assert.equal(await page.evaluate(() => (window as any).airRead.selectedPage), 1);
  assert.ok(await page.$('[aria-label="Adjust selected code"]'));
  await clickText("Apply codes");
  await waitApplied();
  const qrSaved = await docBytes();
  // Inspect real PDF pixels, including every quiet-zone module, not just file size.
  const outputContent = await page.evaluate(
    async ({ input, placements }) => {
      const load = (s: string) => import(s);
      const { getPdfJs } = await load("/src/utils/pdf/raster.ts");
      const { encodeQr } = await load("/src/utils/pdf/qr.ts");
      const lib = await getPdfJs();
      const task = lib.getDocument({ data: new Uint8Array(input) });
      const pdf = await task.promise;
      try {
        const text = [];
        const checks = [];
        for (let i = 0; i < pdf.numPages; i++) {
          const p = await pdf.getPage(i + 1);
          const vp = p.getViewport({ scale: 3 });
          const c = document.createElement("canvas");
          c.width = vp.width;
          c.height = vp.height;
          const ctx = c.getContext("2d")!;
          await p.render({ canvas: c, canvasContext: ctx, viewport: vp }).promise;
          text.push((await p.getTextContent()).items.map((x: any) => x.str).join(" "));
          const ops = await p.getOperatorList();
          if (
            ops.fnArray.some((x: number) =>
              [lib.OPS.paintImageXObject, lib.OPS.paintInlineImageXObject].includes(x),
            )
          )
            throw new Error("Code exported as raster");
          const o = placements.find((o: any) => o.pageIndex === i);
          const qr = encodeQr(o.payload.content, "M");
          const n = qr.size + 8;
          let mismatches = 0;
          for (let y = 0; y < n; y++)
            for (let x = 0; x < n; x++) {
              const px = (o.rect.xPct + ((x + 0.5) / n) * o.rect.wPct) * vp.width;
              const py = (o.rect.yPct + ((y + 0.5) / n) * o.rect.hPct) * vp.height;
              const pixel = ctx.getImageData(Math.floor(px), Math.floor(py), 1, 1).data;
              const expected =
                x >= 4 && x < n - 4 && y >= 4 && y < n - 4 && qr.isDark(y - 4, x - 4);
              if (pixel[0] < 128 !== expected) mismatches++;
            }
          checks.push({ page: i + 1, mismatches });
        }
        return {
          text,
          checks,
          metadata: (await pdf.getMetadata()).info,
          attachments: Array.from((await pdf.getAttachments()).keys()),
        };
      } finally {
        await task.destroy();
      }
    },
    { input: qrSaved, placements: placed },
  );
  assert.deepEqual(
    outputContent.checks.map((x) => x.mismatches),
    [0, 0, 0],
  );
  assert.equal((outputContent.metadata as any).Title, "Code acceptance");
  assert.deepEqual(outputContent.attachments, ["reference.txt"]);
  for (let i = 0; i < 3; i++) assert.ok(outputContent.text[i].includes(`Original page ${i + 1}`));
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  assert.deepEqual(await docBytes(), before);
  assert.equal((await stamps()).length, 3, "Undo restores pending placed objects");
  await page.evaluate(() => (window as any).airActions.redo());
  await settle();
  assert.deepEqual(await docBytes(), qrSaved);
  assert.equal((await stamps()).length, 0);
  // New barcode keeps a caption below its bars; settings never mutate placed codes.
  await pickType("Barcode");
  await field("A".repeat(1000));
  assert.ok(
    await page.$eval(
      'img[alt="Code preview"]',
      (e) => (e as HTMLImageElement).naturalWidth <= 4096,
    ),
  );
  await field("CASE-0042");
  await clickText("Place on this page");
  await settle();
  const captioned = (await stamps())[0];
  await page.click('[aria-label="Show text under barcode"]');
  await clickText("Place on this page");
  await settle();
  let bars = await stamps();
  assert.equal(bars[0].payload.caption, true);
  assert.equal(bars[1].payload.caption, false);
  assert.ok(captioned.rect.hPct > bars[1].rect.hPct);
  await page.click('button[aria-label="Remove selected code"]');
  await settle();
  assert.equal((await stamps()).length, 1);
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent),
    "Place on this page",
  );
  await field("New draft");
  assert.equal((await stamps())[0].payload.content, "CASE-0042");
  // Mobile Done awaits the real write, preserves work on failure, then deduplicates retry.
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  await ready();
  await page.evaluate(() => ((window as any).failRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(
    () => !(window as any).airRead.busyLabel && !!(window as any).airRead.error,
  );
  assert.equal(await page.evaluate(() => (window as any).airTool), "qr-stamp");
  assert.deepEqual(await docBytes(), qrSaved);
  assert.equal((await stamps()).length, 1);
  await page.evaluate(() => ((window as any).holdRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.equal(await page.evaluate(() => (window as any).airTool), "qr-stamp");
  await page.evaluate(() => {
    void (window as any).airActions.flushPendingApply();
  }); // joins the pending operation; not awaited in page
  await page.evaluate(() => (window as any).releaseRead());
  await page.waitForFunction(() => (window as any).airTool === null);
  await waitApplied();
  const barcodeSaved = await docBytes();
  const captionText = await page.evaluate(async (input) => {
    const load = (s: string) => import(s);
    const { getPdfJs } = await load("/src/utils/pdf/raster.ts");
    const task = (await getPdfJs()).getDocument({ data: new Uint8Array(input) });
    const d = await task.promise;
    try {
      return (await (await d.getPage(2)).getTextContent()).items.map((x: any) => x.str).join(" ");
    } finally {
      await task.destroy();
    }
  }, barcodeSaved);
  assert.equal(captionText.split("CASE-0042").length - 1, 1, "one real selectable caption");
  await tool();
  await ready();
  await clickText("Place on this page");
  await page.click('button[aria-label="Cancel"]');
  await tool();
  await ready();
  assert.equal((await stamps()).length, 0);
  assert.equal(await page.$eval("#code-content", (e) => (e as HTMLInputElement).value), "");
  assert.deepEqual(await docBytes(), barcodeSaved);
  // Review populated QR, barcode and invalid content at all required sizes/themes.
  await page.evaluate(async (input) => {
    await (window as any).airActions.loadFile(new File([new Uint8Array(input)], "Air codes.pdf"));
  }, reviewBytes);
  await page.waitForFunction(() => !(window as any).airRead.opening);
  await tool();
  await ready();
  const layouts = [];
  const showRegion = async (region: string) => {
    await page.$eval(
      region === "settings" ? ".pdf-code-panel" : '[aria-label="Code placement"]',
      (e) => {
        const owner = e.closest(".editor-properties__body, .editor-mobile-sheet__body")!;
        for (let p = owner.parentElement; p; p = p.parentElement) p.scrollTop = 0;
        owner.scrollTop += e.getBoundingClientRect().top - owner.getBoundingClientRect().top;
      },
    );
  };
  await field("https://cloakyard.com/verify/42");
  await clickText("Place on this page");
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
      for (const state of ["qr", "barcode", "invalid"]) {
        await showRegion("settings");
        await pickType(state === "qr" ? "QR code" : "Barcode");
        await field(
          state === "qr"
            ? "https://cloakyard.com/verify/42"
            : state === "barcode"
              ? "CASE-0042"
              : "café😀",
        );
        for (const region of state === "qr" ? ["settings", "placement"] : ["settings"]) {
          await showRegion(region);
          await settle();
          const metrics = await page.evaluate(() => {
            const p = document.querySelector(".pdf-code-panel")!;
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
          const file = `codes-${state}-${region}-${width}x${height}-${theme}.png`;
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
      for (const region of ["settings", "placement"]) {
        await showRegion(region);
        await settle();
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        );
        await page.screenshot({
          path: join(output, `codes-text200-${region}-${width}-${theme}.png`),
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
  await settle();
  await page.screenshot({ path: join(output, "codes-forced-colors.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "codes-results.json"),
    JSON.stringify({ layouts, outputContent, captionText, errors }, null, 2),
  );
  console.log(
    "Codes: types, Unicode/capacity validation, quiet-zone pixels on three mixed pages, vector output/catalog, placement/edit/remove, settings persistence, Apply/Undo/Redo, mobile wait/failure/retry/Cancel, 88 layout captures, 12 text200 views, forced colours/reduced motion passed.",
  );
} catch (error) {
  console.error(
    await page.evaluate(() => ({
      tool: (window as any).airTool,
      error: (window as any).airRead?.error,
      text: document.querySelector(".pdf-code-panel")?.textContent,
    })),
  );
  await page.screenshot({ path: join(output, "codes-failure.png") });
  throw error;
} finally {
  await browser.close();
}
