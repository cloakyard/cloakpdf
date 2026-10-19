/** Select text: real pointer/keyboard selection, failure recovery and PDF output. */
import { createEvidenceDirectory } from "./helpers/evidence-directory.ts";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, PDFName, PDFNumber, degrees } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
const output = createEvidenceDirectory("cloakpdf-air-review");
await mkdir(output, { recursive: true });
const pdf = await PDFDocument.create();
pdf.setTitle("Air text selection study");
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (const rotation of [0, 90]) {
  const p = pdf.addPage([500, 650]);
  p.setCropBox(20, 30, 460, 590);
  p.setRotation(degrees(rotation));
  p.node.set(PDFName.of("UserUnit"), PDFNumber.of(1.25));
  p.drawText("Outside visible crop", { x: 1, y: 5, size: 12, font });
  for (const [i, text] of [
    "A little room to think.",
    "Quiet tools. Clear ideas.",
    "Select a passage and make it yours.",
    "Highlight the part that matters.",
    "Keep the original within reach.",
    "Every detail deserves a little care.",
  ].entries())
    p.drawText(text, { x: 55, y: 550 - i * 42, size: i === 0 ? 24 : 16, font });
}
pdf.addPage([500, 650]);
const bytes = Array.from(await pdf.save());
await writeFile(join(output, "Air text study.pdf"), new Uint8Array(bytes));
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
    for (let i = 0; i < 8; i++) await new Promise(requestAnimationFrame);
  });
const tool = async (id = "select-text") => {
  await page.evaluate((id) => (window as any).airActions.setActiveTool(id), id);
  await settle();
};
const ready = () =>
  page.waitForFunction(() => {
    const w = window as any;
    return (
      w.airSelection.page?.bytes === w.airRead.doc?.bytes &&
      w.airSelection.page.pageIndex === w.airRead.selectedPage
    );
  });
const button = (name: string) => page.locator(`.pdf-selecttext-panel button::-p-text(${name})`);
const text = () => page.$eval("#selected-page-text", (e) => (e as HTMLTextAreaElement).value);
const docBytes = () =>
  page.evaluate(() => Array.from((window as any).airRead.doc.bytes) as number[]);
const selectAll = async () => {
  await button("Select page text").click();
  await settle();
};
const stage = '.editor-paper[role="region"]';
const reset = async () => {
  await tool("add-bookmarks");
  await page.evaluate(async (input) => {
    const w = window as any;
    await w.airActions.loadFile(new File([new Uint8Array(input)], "Air text study.pdf"));
    w.airActions.dismissDraft();
  }, bytes);
  await tool();
  await ready();
};
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
      w.airSelection = useToolSlice("select-text");
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
          initialFile: new File([new Uint8Array(input)], "Air text study.pdf"),
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
  await ready();
  await page.evaluate(() => (window as any).airActions.dismissDraft());
  // Empty selection still explains and exposes the four actions.
  assert.equal(await page.$$eval(".pdf-selection-actions button:disabled", (e) => e.length), 5);
  await page.focus(stage);
  await page.keyboard.press("Home");
  assert.equal(await text(), "A little room to think.");
  const initialView = await page.evaluate(() => (window as any).airRead.view);
  await page.keyboard.down("Shift");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.up("Shift");
  assert.equal(await text(), "A little room to think. Quiet tools. Clear ideas.");
  assert.deepEqual(await page.evaluate(() => (window as any).airRead.view), initialView);
  await page.keyboard.press("Escape");
  assert.equal(await page.$("#selected-page-text"), null);
  await page.keyboard.press("End");
  assert.equal(await text(), "Every detail deserves a little care.");
  await page.keyboard.down("Shift");
  await page.keyboard.press("Home");
  await page.keyboard.up("Shift");
  const all = await text();
  assert.match(all, /^A little room.*little care\.$/);
  // Copy has a stable label, truthful feedback and manual recovery.
  await page.evaluate(() => {
    const w = window as any;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          if (w.failCopy) throw new Error("Controlled clipboard refusal");
          w.copiedText = text;
        },
      },
    });
  });
  await button("Copy text").click();
  await page.waitForFunction(() =>
    document.querySelector(".pdf-selecttext-panel")?.textContent?.includes("Text copied."),
  );
  assert.equal(await page.evaluate(() => (window as any).copiedText), all);
  await page.evaluate(() => ((window as any).failCopy = true));
  await button("Copy text").click();
  await page.waitForSelector('.pdf-selecttext-panel [role="alert"]');
  assert.equal(await text(), all);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined }),
  );
  await button("Copy text").click();
  assert.match(
    await page.$eval('.pdf-selecttext-panel [role="alert"]', (e) => e.textContent!),
    /manually/,
  );
  // Pointer drag across two extracted runs and cancellation preserve the previous selection.
  const positions = await page.evaluate(() =>
    (window as any).airSelection.page.words.map((w: any) => [
      w.rect.xPct + w.rect.wPct / 2,
      w.rect.yPct + w.rect.hPct / 2,
    ]),
  );
  const box = (await (await page.$(stage))!.boundingBox())!;
  const at = (i: number) => ({
    x: box.x + positions[i][0] * box.width,
    y: box.y + positions[i][1] * box.height,
  });
  await page.mouse.move(at(0).x, at(0).y);
  await page.mouse.down();
  await page.mouse.move(at(1).x, at(1).y, { steps: 6 });
  await page.mouse.up();
  const dragged = await text();
  assert.equal(dragged, "A little room to think. Quiet tools. Clear ideas.");
  await page.mouse.move(at(4).x, at(4).y);
  await page.mouse.down();
  await page.$eval(stage, (e) =>
    e.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: 1 })),
  );
  await page.mouse.up();
  assert.equal(await text(), dragged);
  // Selection persists across tool and layout changes, but not page/revision changes.
  await tool("add-bookmarks");
  await tool();
  await ready();
  assert.equal(await text(), dragged);
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  assert.equal(await text(), dragged);
  await page.setViewport({ width: 1440, height: 900 });
  await settle();
  await page.evaluate(() => (window as any).airActions.setSelectedPage(1));
  await ready();
  assert.equal(await page.$("#selected-page-text"), null);
  await selectAll();
  assert.equal(await text(), all);
  // Real write failure leaves both bytes and selection intact; retry commits once.
  await page.evaluate(() => ((window as any).failRead = true));
  await button("Highlight").click();
  await page.waitForSelector('.pdf-selecttext-panel [role="alert"]');
  assert.equal(await text(), all);
  assert.deepEqual(await docBytes(), bytes);
  await page.evaluate(() => ((window as any).holdRead = true));
  await button("Highlight").click();
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.deepEqual(await docBytes(), bytes);
  await page.evaluate(() => {
    (window as any).releaseRead();
    (window as any).releaseRead = null;
  });
  await page.waitForFunction(() =>
    document.querySelector(".pdf-selecttext-panel")?.textContent?.includes("Highlight added."),
  );
  await ready();
  const highlighted = await docBytes();
  assert.notDeepEqual(highlighted, bytes);
  assert.equal(await page.$("#selected-page-text"), null);
  assert.equal(
    await page.evaluate(() => document.activeElement?.classList.contains("pdf-selecttext-panel")),
    true,
  );
  await writeFile(join(output, "Air text highlighted.pdf"), new Uint8Array(highlighted));
  const saved = await PDFDocument.load(new Uint8Array(highlighted));
  assert.equal(saved.getTitle(), pdf.getTitle());
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(saved.getPage(i).getCropBox(), pdf.getPage(i).getCropBox());
    assert.equal(saved.getPage(i).getRotation().angle, pdf.getPage(i).getRotation().angle);
    assert.equal(
      saved.getPage(i).node.get(PDFName.of("UserUnit"))?.toString(),
      pdf.getPage(i).node.get(PDFName.of("UserUnit"))?.toString(),
    );
  }
  // Provider history guards also cover direct calls in the same frame as a task,
  // before React paints the inert workspace, and while async work is pending.
  const beforeTask = await page.evaluate(() => (window as any).airRead.historyVersion);
  await page.evaluate(() => {
    const w = window as any;
    w.historyTask = w.airActions.runTask(
      "Checking history ownership…",
      () =>
        new Promise<void>((resolve) => {
          w.releaseHistoryTask = resolve;
        }),
    );
    w.airActions.undo();
    w.airActions.reset();
    w.airActions.redo();
  });
  await page.waitForFunction(() => !!(window as any).releaseHistoryTask);
  await page.evaluate(() => {
    const w = window as any;
    w.airActions.undo();
    w.airActions.reset();
    w.airActions.redo();
  });
  await settle();
  assert.deepEqual(await docBytes(), highlighted);
  assert.equal(await page.evaluate(() => (window as any).airRead.historyVersion), beforeTask);
  await page.evaluate(async () => {
    const w = window as any;
    w.releaseHistoryTask();
    await w.historyTask;
  });
  await page.evaluate(() => (window as any).airActions.undo());
  await ready();
  assert.deepEqual(await docBytes(), bytes);
  assert.doesNotMatch(
    await page.$eval(".pdf-selecttext-panel", (e) => e.textContent!),
    /Highlight added/,
  );
  await page.evaluate(() => (window as any).airActions.redo());
  await ready();
  assert.deepEqual(await docBytes(), highlighted);
  await selectAll();
  await button("Box").click();
  await page.waitForFunction(() =>
    document.querySelector(".pdf-selecttext-panel")?.textContent?.includes("Box added."),
  );
  await ready();
  const boxed = await docBytes();
  await writeFile(join(output, "Air text boxed.pdf"), new Uint8Array(boxed));
  await selectAll();
  await page.evaluate(() => (window as any).airActions.cancelCurrentTool());
  // These actions apply immediately: Cancel clears the selection, Undo restores bytes.
  assert.deepEqual(await docBytes(), boxed);
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  assert.deepEqual(await docBytes(), bytes);
  await tool();
  await ready();
  await page.evaluate(() => (window as any).airActions.setSelectedPage(0));
  await ready();
  await page.focus(stage);
  await page.keyboard.press("Home");
  await page.keyboard.down("Shift");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.up("Shift");
  await button("Redact").click();
  await settle();
  assert.equal(await page.$("#selected-page-text"), null);
  assert.match(
    await page.$eval(".pdf-selecttext-panel", (e) => e.textContent!),
    /covered text cannot be copied/,
  );
  assert.equal(await page.evaluate(() => (window as any).airRead.doc.objects.length), 4);
  const redacted = await page.evaluate(async () => {
    const load = async (path: string) => import(path);
    const { flattenDestructiveObjects } = await load("/src/editor/doc.ts");
    const { extractPageTextGeometry } = await load("/src/utils/layout-extract.ts");
    const bytes = await flattenDestructiveObjects((window as any).airRead.doc);
    const file = new File([bytes], "redacted.pdf");
    const pages = await Promise.all([1, 2].map((n) => extractPageTextGeometry(file, n)));
    return {
      bytes: Array.from(bytes) as number[],
      text: pages.map((p) => p.items.map((item: any) => item.text).join(" ")),
    };
  });
  await writeFile(join(output, "Air text redacted.pdf"), new Uint8Array(redacted.bytes));
  assert.doesNotMatch(redacted.text[0], /A little room/);
  assert.match(redacted.text[1], /A little room/);
  await page.evaluate(() => (window as any).airActions.undo());
  await ready();
  assert.equal(await page.$(".pdf-selecttext-panel button::-p-text(Review redactions)"), null);
  // Empty page, OCR handoff, failed reading/retry and late results after tool exit.
  await page.evaluate(() => (window as any).airActions.setSelectedPage(2));
  await ready();
  assert.match(
    await page.$eval(".pdf-selecttext-panel", (e) => e.textContent!),
    /no selectable text/,
  );
  await button("Open OCR").click();
  assert.equal(await page.evaluate(() => (window as any).airTool), "ocr");
  await reset();
  await tool("add-bookmarks");
  await page.evaluate(() => {
    const w = window as any;
    w.airActions.patchToolState("select-text", { page: undefined });
    w.failRead = true;
  });
  await tool();
  await ready();
  await page.waitForSelector('.pdf-selecttext-panel [role="alert"]');
  await button("Retry reading text").click();
  await ready();
  await selectAll();
  assert.equal(await text(), all);
  await tool("add-bookmarks");
  await page.evaluate(() => {
    const w = window as any;
    w.airActions.patchToolState("select-text", { page: undefined });
    w.holdRead = true;
  });
  await tool();
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.match(
    await page.$eval(".pdf-selecttext-panel", (e) => e.textContent!),
    /Reading page text/,
  );
  await tool("add-bookmarks");
  await page.evaluate(() => {
    (window as any).releaseRead();
    (window as any).releaseRead = null;
  });
  await settle();
  assert.equal(await page.evaluate(() => (window as any).airSelection.page), undefined);
  await tool();
  await ready();
  await selectAll();
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
    [767, 1024],
    [769, 1024],
  ])
    for (const theme of ["light", "dark"]) {
      await page.setViewport({ width, height });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      await cdp.send("Emulation.setTouchEmulationEnabled", {
        enabled: width <= 1024,
        maxTouchPoints: 1,
      });
      await settle();
      for (const region of ["selection", "actions"]) {
        await page.focus(
          region === "selection" ? "#selected-page-text" : ".pdf-selection-help summary",
        );
        await settle();
        const metrics = await page.$eval(".pdf-selecttext-panel", (e) => ({
          overflow: e.scrollWidth > e.clientWidth + 1,
          bodyOverflow: document.documentElement.scrollWidth > innerWidth + 1,
          coarse: matchMedia("(pointer: coarse)").matches,
          minTarget: Math.min(
            ...Array.from(e.querySelectorAll("button,summary"))
              .map((c) => c.getBoundingClientRect().height)
              .filter((h) => h > 0),
          ),
        }));
        assert.equal(metrics.overflow, false, `${width} ${theme} ${region}`);
        assert.equal(metrics.bodyOverflow, false);
        if (metrics.coarse)
          assert.ok(metrics.minTarget >= 44, `${width} target ${metrics.minTarget}`);
        const capture = `select-text-${width}x${height}-${theme}-${region}.png`;
        await page.screenshot({ path: join(output, capture) });
        layouts.push({ width, height, theme, region, ...metrics, capture });
      }
      assert.equal(await text(), all);
    }
  const enlarged = [];
  for (const width of [320, 768, 1440])
    for (const theme of ["light", "dark"]) {
      await page.setViewport({ width, height: 900 });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
      await settle();
      await page.focus(".pdf-selection-help summary");
      assert.equal(
        await page.$eval(".pdf-selecttext-panel", (e) => e.scrollWidth > e.clientWidth + 1),
        false,
      );
      const capture = `select-text-text200-${width}-${theme}.png`;
      await page.screenshot({ path: join(output, capture) });
      enlarged.push({ width, theme, capture });
    }
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await page.focus("#selected-page-text");
  await page.screenshot({ path: join(output, "select-text-forced-colours.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "select-text-results.json"),
    JSON.stringify(
      {
        layouts,
        enlarged,
        errors,
        assertions: [
          "keyboard/pointer/cancel",
          "copy success/refusal/unavailable",
          "page/byte ownership and stale reads",
          "read retry/empty/OCR",
          "failed write preserves selection",
          "highlight/box real output",
          "Undo/Redo/Cancel",
          "redaction output/privacy gate",
          "responsive retention and targets",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS Select text: lifecycle/output, ${layouts.length} layouts, ${enlarged.length} enlarged-text states`,
  );
} finally {
  await cdp.detach();
  await browser.close();
}
