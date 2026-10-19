/** Real PDF crop/scan/straighten output, async recovery and Air layout acceptance. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, PDFName, PDFNumber, degrees } from "@pdfme/pdf-lib";
import { drawOnVisiblePage } from "../../src/utils/pdf/page-geometry.ts";
import { launch } from "puppeteer-core";
const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-review";
await mkdir(output, { recursive: true });
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (let i = 0; i < 3; i++) {
  const p = pdf.addPage([400, 600]);
  p.drawText("Cloakyard - a thoughtful place for everyday documents", {
    x: 30,
    y: 565,
    size: 11,
    font,
  });
  p.drawText(`Body content on page ${i + 1}`, { x: 70, y: 340, size: 18, font });
  p.drawText(`Page ${i + 1}`, { x: 170, y: 20, size: 10, font });
}
pdf.setTitle("Crop acceptance");
pdf.setAuthor("Synthetic author");
await pdf.attach(new TextEncoder().encode("REFERENCE"), "reference.txt");
const bytes = Array.from(await pdf.save());
await writeFile(join(output, "Air crop.pdf"), new Uint8Array(bytes));
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
const tool = async (id = "crop-pages") => {
  await page.evaluate((id) => (window as any).airActions.setActiveTool(id), id);
  await settle();
};
const clickText = (text: string) => page.locator(`button::-p-text(${text})`).click();
const docBytes = () =>
  page.evaluate(() => Array.from((window as any).airRead.doc.bytes as Uint8Array));
const reset = async (input = bytes) => {
  await tool("add-bookmarks");
  await page.evaluate(async (input) => {
    await (window as any).airActions.loadFile(new File([new Uint8Array(input)], "Air crop.pdf"));
  }, input);
  await page.waitForFunction(() => !(window as any).airRead.busyLabel);
  await settle();
  await tool();
};
const margin = async (edge: string, value: string) => {
  await page.$eval(`#crop-${edge}`, (e) => (e as HTMLInputElement).select());
  await page.type(`#crop-${edge}`, value);
  await page.$eval(`#crop-${edge}`, (e) => (e as HTMLElement).blur());
  await settle();
};
const finished = () => page.waitForFunction(() => !(window as any).airRead.busyLabel);
const groupsReady = () =>
  page.waitForFunction(() => document.querySelectorAll(".pdf-furniture-list li").length >= 2);
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
      w.airCrop = useToolSlice("crop-pages");
      w.airFurniture = useToolSlice("strip-furniture");
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
  await margin("top", "101");
  assert.ok(await page.$('#crop-top[aria-invalid="true"]'));
  assert.equal(
    await page.$eval(
      ".pdf-crop-panel .air-button--primary",
      (n) => (n as HTMLButtonElement).disabled,
    ),
    true,
  );
  await margin("top", "10");
  await margin("right", "5");
  await margin("bottom", "10");
  await margin("left", "5");
  await clickText("This page");
  await page.evaluate(() => (window as any).airActions.setSelectedPage(1));
  await settle();
  await clickText("Crop pages");
  await finished();
  let cropped = await PDFDocument.load(new Uint8Array(await docBytes()));
  assert.equal(cropped.getTitle(), "Crop acceptance");
  assert.equal(cropped.getPages()[0].getCropBox().height, 600);
  assert.equal(cropped.getPages()[1].getCropBox().height, 480);
  assert.equal(cropped.getPages()[1].getCropBox().width, 360);
  assert.ok(cropped.catalog.get(PDFName.of("Names")));
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  assert.deepEqual(await docBytes(), bytes);
  assert.equal(await page.$eval("#crop-top", (e) => (e as HTMLInputElement).value), "0");

  // An old scan cannot replace an edited draft, a cancelled request or another page.
  await margin("top", "8");
  await page.evaluate(() => {
    (window as any).holdRead = true;
    (window as any).releaseRead = null;
  });
  await clickText("Trim to content");
  await page.waitForFunction(() => !!(window as any).releaseRead);
  await margin("top", "12");
  await page.evaluate(() => (window as any).releaseRead());
  await settle();
  assert.equal(await page.$eval("#crop-top", (e) => (e as HTMLInputElement).value), "12");
  await page.evaluate(() => {
    (window as any).holdRead = true;
    (window as any).releaseRead = null;
  });
  await clickText("Trim to content");
  await page.waitForFunction(() => !!(window as any).releaseRead);
  await clickText("Cancel analysis");
  await page.evaluate(() => (window as any).releaseRead());
  await settle();
  assert.equal(await page.$eval("#crop-top", (e) => (e as HTMLInputElement).value), "12");
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await clickText("Trim to content");
  await page.waitForFunction(() =>
    document.querySelector(".pdf-crop-panel")?.textContent?.includes("Couldn't analyse"),
  );
  await clickText("Trim to content");
  await page.waitForFunction(() =>
    document.querySelector(".pdf-crop-panel")?.textContent?.includes("Suggested a crop"),
  );
  assert.ok(Number(await page.$eval("#crop-top", (e) => (e as HTMLInputElement).value)) > 0);

  // Failed mobile Done retains fields; concurrent Done awaits one crop and closes only on success.
  await reset();
  await margin("top", "10");
  await tool("add-bookmarks");
  await tool();
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  assert.equal(await page.$eval("#crop-top", (e) => (e as HTMLInputElement).value), "10");
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await page.click('[aria-label="Done"]');
  await page.waitForFunction(() =>
    document.querySelector(".pdf-crop-panel")?.textContent?.includes("Couldn't crop"),
  );
  assert.deepEqual(await docBytes(), bytes);
  await page.evaluate(() => {
    (window as any).holdRead = true;
    (window as any).releaseRead = null;
  });
  await page.click('[aria-label="Done"]');
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.ok(await page.$(".pdf-crop-panel"));
  await page.evaluate(() => {
    (window as any).secondDone = (window as any).airActions.flushPendingApply();
  }); // synchronous registration shares the in-flight promise
  await page.evaluate(() => (window as any).releaseRead());
  await page.waitForFunction(() => (window as any).airTool === null);
  cropped = await PDFDocument.load(new Uint8Array(await docBytes()));
  assert.equal(cropped.getPages()[0].getCropBox().height, 540);
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  assert.deepEqual(await docBytes(), bytes);

  await reset();
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await tool("strip-furniture");
  await page.waitForFunction(() =>
    document.querySelector(".pdf-furniture-panel")?.textContent?.includes("Couldn't read"),
  );
  assert.equal(await page.$(".pdf-furniture-list"), null);
  await clickText("Scan again");
  await groupsReady();
  await page.click(".pdf-furniture-list input");
  const chosen = await page.$$eval(".pdf-furniture-list input", (els) =>
    els.map((e) => (e as HTMLInputElement).checked),
  );
  await tool();
  await tool("strip-furniture");
  assert.deepEqual(
    await page.$$eval(".pdf-furniture-list input", (els) =>
      els.map((e) => (e as HTMLInputElement).checked),
    ),
    chosen,
  );
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await page.click('[aria-label="Done"]');
  await page.waitForFunction(() =>
    document.querySelector(".pdf-furniture-panel")?.textContent?.includes("Couldn't trim"),
  );
  assert.deepEqual(await docBytes(), bytes);
  await page.click('[aria-label="Done"]');
  await page.waitForFunction(() => (window as any).airTool === null);
  cropped = await PDFDocument.load(new Uint8Array(await docBytes()));
  assert.ok(
    cropped.getPages().every((p) => p.getCropBox().height < 600 && p.getCropBox().height > 450),
  );
  assert.equal(cropped.getTitle(), "Crop acceptance");
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  assert.deepEqual(await docBytes(), bytes);
  await tool("strip-furniture");
  assert.equal(
    await page.$(".pdf-furniture-list"),
    null,
    "successful draft retired even after Undo",
  );
  await clickText("Scan again");
  await groupsReady();
  await page.evaluate(() => {
    (window as any).holdRead = true;
    (window as any).releaseRead = null;
  });
  await clickText("Scan again");
  await page.waitForFunction(() => !!(window as any).releaseRead);
  await clickText("Cancel scan");
  await page.evaluate(() => (window as any).releaseRead());
  await settle();
  assert.ok(await page.$(".pdf-furniture-list"));

  const layouts: unknown[] = [];
  for (const id of ["crop-pages", "strip-furniture"]) {
    await tool(id);
    const panel = id === "crop-pages" ? ".pdf-crop-panel" : ".pdf-furniture-panel";
    if (id === "crop-pages") await margin("top", "10");
    for (const theme of ["light", "dark"]) {
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
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
      ]) {
        await page.setViewport({ width, height });
        await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: width <= 1024 });
        await settle();
        const state = await page.$eval(panel, (p) => ({
          overflow: p.scrollWidth > p.clientWidth + 1,
          pageOverflow: document.documentElement.scrollWidth > innerWidth,
          minTarget: Math.min(
            ...[
              ...p.querySelectorAll(
                'button:not(.air-segments > button),input[type="text"],.air-check-label',
              ),
            ].map((n) => n.getBoundingClientRect().height),
          ),
        }));
        assert.equal(state.overflow, false, JSON.stringify({ id, width, theme, state }));
        assert.equal(state.pageOverflow, false);
        assert.ok(
          state.minTarget >= (width <= 1024 ? 43.9 : 39.9),
          JSON.stringify({ id, width, state }),
        );
        const primary = width < 1024 ? '[aria-label="Done"]' : panel + " .air-button--primary";
        // Actual layout decides where the primary action lives (landscape may retain desktop chrome).
        const action = (await page.$(panel + " .air-button--primary"))
          ? panel + " .air-button--primary"
          : primary;
        await page.$eval(action, (n) => n.scrollIntoView({ block: "nearest" }));
        const bounds = await page.$eval(action, (n) => {
          const b = n.getBoundingClientRect();
          return [b.top, b.bottom];
        });
        assert.ok(bounds[0] >= 0 && bounds[1] <= height + 1);
        await page.$eval(panel, (n) => {
          for (let p = n.parentElement; p; p = p.parentElement) p.scrollTop = 0;
        });
        await page.screenshot({ path: join(output, `${id}-${width}-${theme}.png`) });
        layouts.push({ id, width, height, theme, ...state });
      }
    }
  }
  const edges: unknown[] = [];
  for (const id of ["crop-pages", "strip-furniture"]) {
    await tool(id);
    for (const theme of ["light", "dark"]) {
      await page.emulateMediaFeatures([
        { name: "prefers-color-scheme", value: theme },
        { name: "prefers-reduced-motion", value: "reduce" },
      ]);
      for (const width of [320, 768, 1440]) {
        await page.setViewport({ width, height: 900 });
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "200%";
        });
        await settle();
        const overflow = await page.$eval(
          ".pdf-mark-panel",
          (n) => n.scrollWidth > n.clientWidth + 1,
        );
        assert.equal(overflow, false);
        await page.screenshot({ path: join(output, `${id}-${width}-${theme}-text200.png`) });
        edges.push({ id, width, theme, text200: true, overflow });
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "";
        });
      }
    }
  }
  await page.setViewport({ width: 1440, height: 900 });
  await tool();
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  await page.keyboard.press("Tab");
  await page.focus("#crop-top");
  assert.equal(await page.$eval("#crop-top", (n) => getComputedStyle(n).outlineStyle), "solid");
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  // Empty/short documents distinguish unsupported detection from successful no matches.
  for (const count of [1, 3]) {
    const blank = await PDFDocument.create();
    for (let i = 0; i < count; i++) blank.addPage([400, 600]);
    await reset(Array.from(await blank.save()));
    await tool("strip-furniture");
    await page.waitForFunction(
      (count) =>
        document
          .querySelector(".pdf-furniture-panel")
          ?.textContent?.includes(count === 1 ? "at least 3" : "No selectable text"),
      {},
      count,
    );
    await page.screenshot({ path: join(output, `furniture-empty-${count}.png`) });
  }
  // Straighten preserves catalog, dimensions, CropBox/UserUnit/Rotate and untouched text.
  const scan = await PDFDocument.create();
  scan.setTitle("Deskew preserves the catalog");
  scan.setAuthor("Synthetic author");
  await scan.attach(new TextEncoder().encode("KEEP_ATTACHMENT"), "original.txt");
  for (const unit of [1, 2])
    for (const rotation of [0, 90, 180, 270]) {
      const quarter = rotation % 180 !== 0;
      const w = (quarter ? 300 : 400) / unit,
        h = (quarter ? 400 : 300) / unit;
      const p = scan.addPage([w + 100, h + 140]);
      p.setCropBox(50, 70, w, h);
      p.setRotation(degrees(rotation));
      p.node.set(PDFName.of("UserUnit"), PDFNumber.of(unit));
      await drawOnVisiblePage(p, () => {
        for (let y = 50; y < 250; y += 20)
          p.drawLine({ start: { x: 40, y }, end: { x: 360, y: y + 16 }, thickness: 3 });
      });
    }
  const untouched = scan.addPage([400, 300]);
  untouched.drawText("UNCHANGED_TEXT", { x: 50, y: 160, size: 20 });
  const form = scan.getForm().createTextField("Preserved field");
  form.setText("KEEP_FORM");
  form.addToPage(untouched, { x: 40, y: 40, width: 120, height: 30 });
  const scanBytes = Array.from(await scan.save());
  const deskew = await page.evaluate(async (data) => {
    const load = (path: string) => import(path);
    const { deskewPdf, detectContentBox } = await load("/src/utils/pdf/page-analyze.ts");
    const { getPdfJs } = await load("/src/utils/pdf/raster.ts");
    const result = await deskewPdf(new File([new Uint8Array(data)], "scan.pdf"), {
      pageIndices: [0, 1, 2, 3, 4, 5, 6, 7],
    });
    const task = (await getPdfJs()).getDocument({ data: result.bytes.slice() });
    const doc = await task.promise;
    const frames: unknown[] = [];
    for (let i = 1; i <= 8; i++) {
      const p = await doc.getPage(i);
      const vp = p.getViewport({ scale: 1 });
      const canvas = document.createElement("canvas");
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext("2d")!;
      await p.render({ canvas, canvasContext: ctx, viewport: vp }).promise;
      // After correcting a 2.86° skew the middle line remains close to horizontal.
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const firstInk = (x: number) => {
        for (let y = 100; y < 130; y++) if (pixels[(y * canvas.width + x) * 4] < 100) return y;
        return -1;
      };
      frames.push({
        width: vp.width,
        height: vp.height,
        left: firstInk(90),
        right: firstInk(310),
        text: (await p.getTextContent()).items.length,
      });
      canvas.width = canvas.height = 0;
      p.cleanup();
    }
    const final = await doc.getPage(9);
    const text = (await final.getTextContent()).items.map((x: any) => x.str).join(" ");
    await task.destroy();
    const controller = new AbortController();
    controller.abort();
    let cancelled = false;
    try {
      await detectContentBox(new File([new Uint8Array(data)], "scan.pdf"), 0, controller.signal);
    } catch {
      cancelled = true;
    }
    return {
      bytes: Array.from(result.bytes as Uint8Array),
      deskewed: result.deskewed,
      frames,
      text,
      cancelled,
    };
  }, scanBytes);
  assert.equal(deskew.deskewed, 8);
  assert.ok(deskew.cancelled);
  for (const f of deskew.frames as any[]) {
    assert.equal(f.width, 400);
    assert.equal(f.height, 300);
    assert.equal(f.text, 0);
    assert.ok(f.left > 0 && Math.abs(f.left - f.right) <= 2, JSON.stringify(f));
  }
  assert.ok(deskew.text.includes("UNCHANGED_TEXT"));
  const straight = await PDFDocument.load(new Uint8Array(deskew.bytes));
  assert.equal(straight.getTitle(), "Deskew preserves the catalog");
  assert.equal(straight.getAuthor(), "Synthetic author");
  assert.equal(straight.getForm().getTextField("Preserved field").getText(), "KEEP_FORM");
  assert.ok(straight.catalog.get(PDFName.of("Names")));
  // A link on a changed page is rejected atomically; a no-op returns identical bytes.
  scan
    .getPages()[0]
    .node.set(
      PDFName.of("Annots"),
      scan.context.obj([
        scan.context.register(
          scan.context.obj({ Type: "Annot", Subtype: "Link", Rect: [50, 70, 100, 90] }),
        ),
      ]),
    );
  const guarded = await page.evaluate(
    async (data) => {
      const load = (path: string) => import(path);
      const { deskewPdf } = await load("/src/utils/pdf/page-analyze.ts");
      try {
        await deskewPdf(new File([new Uint8Array(data)], "scan.pdf"), { pageIndices: [0] });
        return "";
      } catch (e) {
        return String(e);
      }
    },
    Array.from(await scan.save()),
  );
  assert.ok(guarded.includes("Flatten them"));
  const noop = await page.evaluate(async (data) => {
    const load = (path: string) => import(path);
    const { deskewPdf } = await load("/src/utils/pdf/page-analyze.ts");
    const r = await deskewPdf(new File([new Uint8Array(data)], "scan.pdf"), { pageIndices: [] });
    return Array.from(r.bytes);
  }, scanBytes);
  assert.deepEqual(noop, scanBytes);
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "crop-furniture.json"),
    JSON.stringify(
      { layouts, edges, deskew: { ...deskew, bytes: undefined }, guards: true, errors },
      null,
      2,
    ),
  );
  console.log(
    `PASS Crop/Strip furniture: ${layouts.length} layouts, ${edges.length} enlarged-text states, actual crop/deskew output, preserved catalog/forms/attachments, scan cancellation and mobile failure/retry.`,
  );
} catch (e) {
  console.log(
    await page.evaluate(() => ({
      text: document.body.innerText,
      busy: (window as any).airRead?.busyLabel,
      error: (window as any).airRead?.error,
      active: (window as any).airTool,
      errors: [],
    })),
  );
  console.log(errors);
  await page.screenshot({ path: join(output, "crop-failure.png") });
  throw e;
} finally {
  await browser.close();
}
