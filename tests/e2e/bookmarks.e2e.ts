/** Real bookmark output, recovery, detection ownership and responsive Air acceptance. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PDFDocument,
  StandardFonts,
  PDFName,
  PDFString,
  PDFArray,
  PDFDict,
  PDFHexString,
} from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-review";
await mkdir(output, { recursive: true });
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (let i = 0; i < 2; i++) {
  const p = pdf.addPage([480, 640]);
  p.drawText("A little room to think.", { x: 40, y: 540, size: 24, font });
  p.drawText("hello@example.com", { x: 40, y: 490, size: 18, font });
  for (let n = 0; n < 8; n++)
    p.drawText("This is a synthetic paragraph for reading and heading detection.", {
      x: 40,
      y: 420 - n * 20,
      size: 10,
      font,
    });
}
pdf.setAuthor("Synthetic author");
pdf.addJavaScript("test-script", "void('SYNTHETIC_SCRIPT')");
await pdf.attach(new TextEncoder().encode("SYNTHETIC_ATTACHMENT"), "example.txt");
pdf.catalog.set(
  PDFName.of("Metadata"),
  pdf.context.register(pdf.context.stream("SYNTHETIC_XMP", { Type: "Metadata", Subtype: "XML" })),
);
const annotation = pdf.context.obj({
  Type: "Annot",
  Subtype: "Square",
  Rect: [30, 200, 90, 230],
  Contents: PDFString.of("Synthetic note"),
});
pdf.getPage(0).node.set(PDFName.of("Annots"), pdf.context.obj([pdf.context.register(annotation)]));
const bytes = Array.from(await pdf.save());
await writeFile(join(output, "Air review.pdf"), new Uint8Array(bytes));
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
const tool = async (id: string) => {
  await page.evaluate((id) => (window as any).airActions.setActiveTool(id), id);
  if (id === "add-bookmarks") await page.waitForSelector(".pdf-bookmarks-panel");
  else if (id === "metadata") await page.waitForSelector(".pdf-metadata-panel");
};
const enter = async (selector: string, text: string) => {
  await page.$eval(selector, (n) => (n as HTMLInputElement).select());
  await page.type(selector, text);
};
const title = '[aria-label="Bookmark title"]';
const target = '[aria-label="Target page"]';
const apply = () => page.locator(".pdf-bookmarks-panel .air-button--primary").click();
const saved = () =>
  page.waitForFunction(
    () =>
      !(window as any).airRead.busyLabel &&
      document.querySelector<HTMLInputElement>('[aria-label="Bookmark title"]')?.value === "",
  );
const outputPdf = async () =>
  PDFDocument.load(
    new Uint8Array(
      await page.evaluate(() => Array.from((window as any).airRead.doc.bytes as Uint8Array)),
    ),
    { updateMetadata: false },
  );
const titles = () =>
  page.$$eval('[aria-label="Bookmark title"]', (nodes) =>
    nodes.map((n) => (n as HTMLInputElement).value),
  );
const reset = async () => {
  await page.evaluate(async (input) => {
    const w = window as any;
    await w.airActions.loadFile(new File([new Uint8Array(input)], "Air review.pdf"));
  }, bytes);
  await tool("add-bookmarks");
  await settle();
};
const settle = async () =>
  page.evaluate(async () => {
    for (let i = 0; i < 10; i++) await new Promise(requestAnimationFrame);
  });
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
      w.airBookmarks = useToolSlice("add-bookmarks");
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
      if (w.failRead) {
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
  await tool("add-bookmarks");
  await enter(title, "Chapter one");
  await enter(target, "8");
  await page.keyboard.press("Tab");
  await page.waitForSelector('[aria-label="Target page"][aria-invalid="true"]');
  await apply();
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("aria-label") === "Target page",
  );
  await page.waitForSelector('[aria-label="Target page"][aria-invalid="true"]');
  assert.equal(await page.$eval(target, (n) => (n as HTMLInputElement).value), "8");
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    "Target page",
  );
  assert.equal((await outputPdf()).catalog.has(PDFName.of("Outlines")), false);
  await enter(target, "1");
  await clickText("Add current page");
  await page.keyboard.type("Section two");
  await page.$$eval(target, (nodes) => (nodes[1] as HTMLInputElement).select());
  await page.keyboard.type("2");
  await page.locator('[aria-label="Nesting for bookmark 2"]').click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.locator('[aria-label="Move bookmark 2 up"]').click();
  assert.deepEqual(await titles(), ["Section two", "Chapter one"]);
  await page.locator('[aria-label="Move bookmark 1 down"]').click();
  await page.locator('[aria-label="Remove bookmark 2"]').click();
  assert.equal((await titles()).length, 1);
  assert.match(
    await page.evaluate(() => document.activeElement?.textContent ?? ""),
    /Add current page/,
  );
  await clickText("Restore previous list");
  assert.deepEqual(await titles(), ["Chapter one", "Section two"]);
  await tool("metadata");
  await tool("add-bookmarks");
  assert.deepEqual(await titles(), ["Chapter one", "Section two"]);
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await apply();
  await page.waitForFunction(() =>
    document
      .querySelector('.pdf-bookmarks-panel [role="alert"]')
      ?.textContent?.includes("Couldn't add bookmarks"),
  );
  assert.deepEqual(await titles(), ["Chapter one", "Section two"]);
  assert.equal((await outputPdf()).catalog.has(PDFName.of("Outlines")), false);
  await apply();
  await saved();
  let result = await outputPdf();
  let outline = result.catalog.lookup(PDFName.of("Outlines"), PDFDict);
  const chapter = outline.lookup(PDFName.of("First"), PDFDict);
  assert.equal(chapter.lookup(PDFName.of("Title"), PDFHexString).decodeText(), "Chapter one");
  const child = chapter.lookup(PDFName.of("First"), PDFDict);
  assert.equal(child.lookup(PDFName.of("Title"), PDFHexString).decodeText(), "Section two");
  assert.equal(
    child.lookup(PDFName.of("Dest"), PDFArray).get(0).toString(),
    result.getPage(1).ref.toString(),
  );
  await page.evaluate(() => (window as any).airActions.undo());
  assert.equal((await outputPdf()).catalog.has(PDFName.of("Outlines")), false);
  assert.deepEqual(await titles(), [""], "Undo cannot resurrect an already applied draft");

  await enter(title, "Contents target");
  await page.locator('.pdf-bookmarks-panel input[type="checkbox"]').click();
  await page.evaluate(() =>
    (window as any).airActions.addObjects(
      [
        {
          kind: "text",
          pageIndex: 0,
          rect: { xPct: 0.1, yPct: 0.1, wPct: 0.3, hPct: 0.1 },
          payload: { text: "Pending annotation", fontSize: 16, color: "#000000" },
        },
      ],
      "Pending annotation",
    ),
  );
  await page.waitForSelector(".pdf-bookmarks-panel .air-notice--warning");
  assert.equal(
    await page.$eval(
      ".pdf-bookmarks-panel .air-button--primary",
      (n) => (n as HTMLButtonElement).disabled,
    ),
    true,
  );
  assert.equal(await page.evaluate(() => (window as any).airRead.doc.objects.length), 1);
  await page.evaluate(() => (window as any).airActions.undo());
  await apply();
  await saved();
  result = await outputPdf();
  assert.equal(result.getPageCount(), 3);
  const link = result.getPage(0).node.lookup(PDFName.of("Annots"), PDFArray).lookup(0, PDFDict);
  assert.equal(
    link.lookup(PDFName.of("Dest"), PDFArray).get(0).toString(),
    result.getPage(1).ref.toString(),
  );
  await page.evaluate(() => (window as any).airActions.undo());
  assert.equal((await outputPdf()).getPageCount(), 2);

  await enter(title, "Keep this draft");
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await clickText("Auto-detect headings");
  await page.waitForFunction(() =>
    document
      .querySelector('.pdf-bookmarks-panel [role="alert"]')
      ?.textContent?.includes("Couldn't detect headings"),
  );
  assert.deepEqual(await titles(), ["Keep this draft"]);
  await clickText("Auto-detect headings");
  await page.waitForFunction(
    () => document.querySelector(".pdf-bookmarks-panel")?.textContent?.includes("Found 4 headings"),
    { timeout: 60000 },
  );
  assert.deepEqual(await titles(), [
    "A little room to think.",
    "hello@example.com",
    "A little room to think.",
    "hello@example.com",
  ]);
  await clickText("Restore previous list");
  assert.deepEqual(await titles(), ["Keep this draft"]);

  for (const action of ["cancel", "tool", "bytes"]) {
    await page.evaluate(() => {
      const w = window as any;
      w.holdRead = true;
      w.releaseRead = null;
    });
    await clickText("Auto-detect headings");
    await page.waitForFunction(() => !!(window as any).releaseRead);
    if (action === "cancel") await clickText("Cancel detection");
    else if (action === "tool") {
      await tool("metadata");
      await tool("add-bookmarks");
    } else
      await page.evaluate(() =>
        (window as any).airActions.applyTransform(async (d: any) => ({
          bytes: d.bytes,
          label: "New byte revision",
        })),
      );
    await page.evaluate(() => (window as any).releaseRead());
    await page.waitForFunction(
      () => !document.querySelector('.pdf-bookmarks-panel [aria-busy="true"]'),
    );
    await settle();
    assert.deepEqual(await titles(), action === "bytes" ? [""] : ["Keep this draft"]);
  }

  const flat = await PDFDocument.create();
  const flatPage = flat.addPage([480, 640]);
  for (let i = 0; i < 8; i++)
    flatPage.drawText("Uniform body text with no heading or section title.", {
      x: 40,
      y: 560 - i * 24,
      size: 11,
    });
  await page.evaluate(
    async (input) =>
      (window as any).airActions.loadFile(new File([new Uint8Array(input)], "No headings.pdf")),
    Array.from(await flat.save()),
  );
  await tool("add-bookmarks");
  await enter(title, "Keep manual heading");
  await clickText("Auto-detect headings");
  await page.waitForFunction(() =>
    document.querySelector(".pdf-bookmarks-panel")?.textContent?.includes("No headings found"),
  );
  assert.deepEqual(await titles(), ["Keep manual heading"]);
  await reset();
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  await enter(title, "Mobile outline");
  await enter(target, "0");
  await page.click('[aria-label="Done"]');
  await page.waitForFunction(
    () => document.activeElement?.getAttribute("aria-label") === "Target page",
  );
  await settle();
  await page.waitForSelector('[aria-label="Target page"][aria-invalid="true"]');
  assert.equal(await page.evaluate(() => (window as any).airTool), "add-bookmarks");
  await enter(target, "2");
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await page.locator('[aria-label="Done"]').click();
  await page.waitForSelector('.pdf-bookmarks-panel [role="alert"]');
  assert.equal(await page.evaluate(() => (window as any).airTool), "add-bookmarks");
  await page.evaluate(() => {
    const b = document.querySelector<HTMLButtonElement>('[aria-label="Done"]')!;
    b.click();
    b.click();
  });
  await page.waitForFunction(
    () => (window as any).airTool === null && !(window as any).airRead.busyLabel,
  );
  assert.equal((await outputPdf()).catalog.has(PDFName.of("Outlines")), true);
  await page.evaluate(() => (window as any).airActions.undo());
  assert.equal((await outputPdf()).catalog.has(PDFName.of("Outlines")), false);
  await tool("add-bookmarks");
  await enter(title, "Cancel me");
  await page.click('[aria-label="Cancel"]');
  await page.waitForFunction(() => (window as any).airTool === null);
  await tool("add-bookmarks");
  assert.deepEqual(await titles(), [""]);
  await enter(
    title,
    "A long chapter title that remains editable without shrinking the surrounding controls",
  );
  await enter(target, "90");
  await page.click('[aria-label="Done"]');
  const layouts: unknown[] = [];
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
      const state = await page.$eval(".pdf-bookmarks-panel", (p) => ({
        overflow: p.scrollWidth > p.clientWidth + 1,
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
        minHeight: Math.min(
          ...[...p.querySelectorAll('button,input:not([type="checkbox"])')].map(
            (n) => n.getBoundingClientRect().height,
          ),
        ),
      }));
      assert.equal(state.overflow, false, JSON.stringify({ width, theme, state }));
      assert.equal(state.pageOverflow, false);
      assert.ok(state.minHeight >= (width <= 1024 ? 43.9 : 39.9), JSON.stringify({ width, state }));
      await page.focus(target);
      await page.keyboard.press("Tab");
      await page.waitForSelector('[aria-label="Target page"][aria-invalid="true"]');
      await page.locator('[aria-label="Nesting for bookmark 1"]').click();
      await page.waitForSelector('[role="listbox"]');
      const menu = await page.$eval('[role="listbox"]', (n) => {
        const b = n.getBoundingClientRect();
        return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
      });
      assert.ok(
        menu.left >= 0 && menu.right <= width + 1 && menu.top >= 0 && menu.bottom <= height + 1,
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
        "Nesting for bookmark 1",
      );
      if ([320, 390, 768, 1280, 1440].includes(width)) {
        await page.$eval(".pdf-bookmarks-panel", (n) => {
          for (let p = n.parentElement; p; p = p.parentElement) p.scrollTop = 0;
        });
        await page.screenshot({ path: join(output, `bookmarks-${width}-${theme}.png`) });
      }
      layouts.push({ width, height, theme, ...state, menu });
    }
  }
  const boundaries: unknown[] = [];
  await page.setViewport({ width: 1440, height: 900 });
  await settle();
  for (const theme of ["light", "dark"]) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    for (const width of [271, 272, 273]) {
      await page.$eval(
        ".pdf-bookmarks-panel",
        (n, width) => {
          (n as HTMLElement).style.width = `${width}px`;
        },
        width,
      );
      await settle();
      const columns = await page.$eval(
        ".pdf-bookmark-target",
        (n) => getComputedStyle(n).gridTemplateColumns.split(" ").length,
      );
      assert.equal(columns, width <= 272 ? 1 : 2);
      assert.ok(
        await page.$eval(".pdf-bookmarks-panel", (n) => n.scrollWidth <= n.clientWidth + 1),
      );
      boundaries.push({ width, theme, columns });
    }
  }
  await page.$eval(".pdf-bookmarks-panel", (n) => {
    (n as HTMLElement).style.removeProperty("width");
  });
  const edgeStates: unknown[] = [];
  for (const theme of ["light", "dark"]) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    for (const width of [390, 1440]) {
      await page.setViewport({ width, height: 900 });
      await settle();
      await page.evaluate(() => {
        (window as any).failRead = true;
      });
      await clickText("Auto-detect headings");
      await page.waitForSelector('.pdf-bookmarks-panel [role="alert"]');
      await page.screenshot({ path: join(output, `bookmarks-error-${width}-${theme}.png`) });
      await page.evaluate(() => {
        const w = window as any;
        w.holdRead = true;
        w.releaseRead = null;
      });
      await clickText("Auto-detect headings");
      await page.waitForFunction(() => !!(window as any).releaseRead);
      assert.equal(
        await page.$eval(
          '[aria-label="Remove bookmark 1"]',
          (n) => (n as HTMLButtonElement).disabled,
        ),
        true,
      );
      await page.screenshot({ path: join(output, `bookmarks-pending-${width}-${theme}.png`) });
      await clickText("Cancel detection");
      await page.evaluate(() => (window as any).releaseRead());
      await page.locator('[aria-label="Remove bookmark 1"]').click();
      await page.waitForFunction(() =>
        document
          .querySelector(".pdf-bookmarks-panel")
          ?.textContent?.includes("No bookmarks in this draft"),
      );
      await page.screenshot({ path: join(output, `bookmarks-empty-${width}-${theme}.png`) });
      await clickText("Restore previous list");
      edgeStates.push({ width, theme, failed: true, busy: true, empty: true, restored: true });
    }
  }
  for (const width of [320, 390, 1440]) {
    await page.setViewport({ width, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });
    await settle();
    assert.ok(await page.$eval(".pdf-bookmarks-panel", (n) => n.scrollWidth <= n.clientWidth + 1));
    await page.locator('[aria-label="Nesting for bookmark 1"]').click();
    await page.keyboard.press("Escape");
  }
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await page.focus(target);
  assert.equal(await page.$eval(target, (n) => getComputedStyle(n).outlineWidth), "2px");
  await page.screenshot({ path: join(output, "bookmarks-forced-200.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "bookmarks.json"),
    JSON.stringify(
      {
        layouts,
        edgeStates,
        boundaries,
        nestedOutput: true,
        contentsLinks: true,
        overlayProtection: true,
        invalidTargetRetained: true,
        failureRetry: true,
        detectionAndRestore: true,
        abandonedDetectionIgnored: true,
        mobileDoneOnce: true,
        cancelDiscards: true,
        text200: true,
        forcedColours: true,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `PASS bookmark output, validation, retry, cancellation, mobile Done and ${layouts.length} layouts.`,
  );
} catch (error) {
  console.log(
    await page.evaluate(() => {
      const w = window as any;
      return {
        failedReadAt: w.failedReadAt,
        failRead: w.failRead,
        tool: w.airTool,
        pending: w.airRead.pendingApply,
        draftRows: w.airBookmarks.rows,
      };
    }),
  );
  await page.screenshot({ path: join(output, "bookmarks-failure.png") });
  console.log(
    await page.evaluate(() => document.querySelector(".pdf-bookmarks-panel")?.textContent),
  );
  throw error;
} finally {
  await browser.close();
}
