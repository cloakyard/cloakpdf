/** Attach identity, output, retry ownership and responsive Air acceptance. */
import { createEvidenceDirectory } from "./helpers/evidence-directory.ts";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFRawStream,
  decodePDFRawStream,
  StandardFonts,
} from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
const output = createEvidenceDirectory("cloakpdf-air-review");
await mkdir(join(output, "a"), { recursive: true });
await mkdir(join(output, "b"), { recursive: true });
const filename = "Project-notes-with-a-complete-readable-name-résumé-東京.txt";
await writeFile(join(output, "a", filename), "FIRST_NEW_FILE");
await writeFile(join(output, "b", filename), "SECOND_NEW_FILE");
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
pdf.addPage([480, 640]).drawText("A little room to think.", { x: 40, y: 540, size: 24, font });
pdf.setAuthor("Synthetic author");
await pdf.attach(new TextEncoder().encode("ORIGINAL_ATTACHMENT"), "reference.txt");
const bytes = Array.from(await pdf.save());
await writeFile(join(output, "Air attachments.pdf"), new Uint8Array(bytes));
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
const panel = ".pdf-attachments-panel";
const primary = panel + " .air-button--primary";
const clickText = async (text: string) => page.locator(`button::-p-text(${text})`).click();
const settle = () =>
  page.evaluate(async () => {
    for (let i = 0; i < 10; i++) await new Promise(requestAnimationFrame);
  });
const tool = async (id = "file-attachment") => {
  await page.evaluate((id) => (window as any).airActions.setActiveTool(id), id);
  if (id === "file-attachment") await page.waitForSelector(panel);
  await settle();
};
const ready = () =>
  page.waitForFunction(
    () =>
      document
        .querySelector(".pdf-attachments-panel .air-button--primary")
        ?.getAttribute("aria-disabled") === "false",
  );
const docBytes = () =>
  page.evaluate(() => Array.from((window as any).airRead.doc.bytes as Uint8Array));
const items = () =>
  page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { listPdfAttachments } = await load("/src/utils/pdf/attachments.ts");
    const list = await listPdfAttachments(new File([(window as any).airRead.doc.bytes], "out.pdf"));
    return list.map((i: any) => ({
      id: i.id,
      name: i.name,
      text: new TextDecoder().decode(i.data),
    }));
  });
const choose = async (...paths: string[]) => {
  const input = await page.$('.pdf-attachments-panel input[type="file"]');
  await input!.uploadFile(...paths);
};
const reset = async () => {
  await tool("add-bookmarks");
  await page.evaluate(async (data) => {
    await (window as any).airActions.loadFile(
      new File([new Uint8Array(data)], "Air attachments.pdf"),
    );
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
      w.airAttachments = useToolSlice("file-attachment");
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
  await ready();
  await page.evaluate(() =>
    (window as any).airActions.addObject({
      kind: "redaction",
      pageIndex: 0,
      rect: { xPct: 0.1, yPct: 0.1, wPct: 0.2, hPct: 0.1 },
    }),
  );
  await page.waitForSelector(".pdf-attachments-panel .air-notice--warning");
  assert.equal(await page.$eval(primary, (n) => n.getAttribute("aria-disabled")), "true");
  await page.evaluate(() => (window as any).airActions.undo());
  await ready();
  // Failed selection survives tool changes and a desktop/mobile remount.
  await page.evaluate((name) => {
    (window as any).failName = name;
  }, filename);
  await choose(join(output, "a", filename), join(output, "b", filename));
  await page.waitForSelector(".pdf-attachment-selection");
  await page.waitForFunction(() =>
    document.querySelector(".pdf-attachments-panel")?.textContent?.includes("Couldn't attach"),
  );
  assert.deepEqual(await docBytes(), bytes);
  await tool("add-bookmarks");
  await tool();
  await ready();
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  await ready();
  assert.equal(await page.$$eval(".pdf-attachment-selection li", (n) => n.length), 2);
  await page.screenshot({ path: join(output, "attachments-retry-phone-dark.png") });
  // Synchronous repeated activation must add one pair, and one Undo must restore source.
  await page.$eval(primary, (n) => {
    (n as HTMLElement).click();
    (n as HTMLElement).click();
  });
  await page.waitForFunction(
    () =>
      !document.querySelector(".pdf-attachment-selection") &&
      document.querySelectorAll(".pdf-attachment-list li").length === 3,
  );
  await ready();
  assert.deepEqual((await items()).map((i: any) => i.text).sort(), [
    "FIRST_NEW_FILE",
    "ORIGINAL_ATTACHMENT",
    "SECOND_NEW_FILE",
  ]);
  const added = await docBytes();
  assert.equal((await PDFDocument.load(new Uint8Array(added))).getAuthor(), "Synthetic author");
  await page.evaluate(() => (window as any).airActions.undo());
  await ready();
  assert.deepEqual(await docBytes(), bytes);
  assert.equal(await page.$(".pdf-attachment-selection"), null);
  await page.evaluate(() => (window as any).airActions.redo());
  await ready();
  // Remove one of two identical displayed filenames; failed remove retains focus/action.
  const remove = '.pdf-attachment-list button[aria-label^="Remove file 1:"]';
  const first = (await items())[0];
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await page.locator(remove).click();
  await page.waitForFunction(() =>
    document.querySelector(".pdf-attachments-panel")?.textContent?.includes("Couldn't remove"),
  );
  assert.deepEqual(await docBytes(), added);
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
    `Remove file 1: ${first.name}`,
  );
  await page.locator(remove).click();
  await page.waitForFunction(
    () => document.querySelectorAll(".pdf-attachment-list li").length === 2,
  );
  await ready();
  assert.equal(
    (await items()).some((i: any) => i.text === first.text),
    false,
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent?.includes("Attach files")),
    true,
  );
  const removed = await PDFDocument.load(new Uint8Array(await docBytes()));
  const embedded = removed.context
    .enumerateIndirectObjects()
    .flatMap(([, obj]) =>
      obj instanceof PDFRawStream &&
      obj.dict.lookup(PDFName.of("Type")) === PDFName.of("EmbeddedFile")
        ? [new TextDecoder().decode(decodePDFRawStream(obj).decode())]
        : [],
    );
  assert.equal(embedded.includes(first.text), false);
  assert.equal(
    removed.catalog.lookup(PDFName.of("Names"), PDFDict).has(PDFName.of("EmbeddedFiles")),
    true,
  );
  await page.evaluate(() => (window as any).airActions.undo());
  await ready();
  assert.deepEqual(await docBytes(), added);
  // Failed list is not empty; retry and stale list resolution cannot overwrite a newer source.
  await tool("add-bookmarks");
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await tool();
  await page.waitForFunction(() =>
    document
      .querySelector(".pdf-attachments-panel")
      ?.textContent?.includes("Couldn't read attachments"),
  );
  assert.equal(await page.$(".pdf-attachment-list"), null);
  assert.equal(await page.$eval(primary, (n) => n.getAttribute("aria-disabled")), "true");
  await clickText("Read attachments again");
  await ready();
  await tool("add-bookmarks");
  await page.evaluate(() => {
    (window as any).holdRead = true;
    (window as any).releaseRead = null;
  });
  await tool();
  await page.waitForFunction(() => !!(window as any).releaseRead);
  await reset();
  await page.evaluate(() => (window as any).releaseRead());
  await settle();
  assert.equal(await page.$$eval(".pdf-attachment-list li", (n) => n.length), 1);
  // Discard and explicit Cancel retire a failed draft; Done preserves an uncommitted selection.
  await page.evaluate((name) => {
    (window as any).failName = name;
  }, filename);
  await choose(join(output, "a", filename));
  await page.waitForFunction(() =>
    document.querySelector(".pdf-attachments-panel")?.textContent?.includes("Couldn't attach"),
  );
  await page.click('[aria-label="Done"]');
  await tool();
  await ready();
  assert.ok(await page.$(".pdf-attachment-selection"));
  await clickText("Discard selection");
  assert.equal(await page.$(".pdf-attachment-selection"), null);
  await page.evaluate((name) => {
    (window as any).failName = name;
  }, filename);
  await choose(join(output, "a", filename));
  await page.waitForFunction(() =>
    document.querySelector(".pdf-attachments-panel")?.textContent?.includes("Couldn't attach"),
  );
  await page.click('[aria-label="Cancel"]');
  await tool();
  await ready();
  assert.equal(await page.$(".pdf-attachment-selection"), null);
  assert.deepEqual(await docBytes(), bytes);
  await choose(join(output, "a", filename), join(output, "b", filename));
  await page.waitForFunction(
    () => document.querySelectorAll(".pdf-attachment-list li").length === 3,
  );
  await ready();
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
      await ready();
      const state = await page.$eval(panel, (p) => ({
        overflow: p.scrollWidth > p.clientWidth + 1,
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
        minTarget: Math.min(
          ...[...p.querySelectorAll("button")].map((n) => n.getBoundingClientRect().height),
        ),
        filenamesWrap: [...p.querySelectorAll(".pdf-attachment-list p")].every(
          (n) => n.scrollWidth <= n.clientWidth + 1,
        ),
      }));
      assert.equal(state.overflow, false, JSON.stringify({ width, theme, state }));
      assert.equal(state.pageOverflow, false);
      assert.ok(state.filenamesWrap);
      assert.ok(state.minTarget >= (width <= 1024 ? 43.9 : 39.9));
      await page.$eval(primary, (n) => n.scrollIntoView({ block: "nearest" }));
      const actionBounds = await page.$eval(primary, (n) => {
        const b = n.getBoundingClientRect();
        return { top: b.top, bottom: b.bottom };
      });
      assert.ok(actionBounds.top >= 0 && actionBounds.bottom <= height + 1);
      await page.$eval(panel, (n) => {
        for (let parent = n.parentElement; parent; parent = parent.parentElement)
          parent.scrollTop = 0;
      });
      await page.screenshot({ path: join(output, `attachments-${width}-${theme}.png`) });
      layouts.push({ width, height, theme, ...state });
    }
  }
  const edgeStates: unknown[] = [];
  for (const theme of ["light", "dark"]) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    for (const width of [390, 1440]) {
      await page.setViewport({ width, height: 900 });
      await settle();
      await reset();
      await page.locator(".pdf-attachment-list button").click();
      await page.waitForFunction(() =>
        document
          .querySelector(".pdf-attachments-panel")
          ?.textContent?.includes("No files attached yet"),
      );
      await page.screenshot({ path: join(output, `attachments-empty-${width}-${theme}.png`) });
      await tool("add-bookmarks");
      await page.evaluate(() => {
        (window as any).failRead = true;
      });
      await tool();
      await page.waitForFunction(() =>
        document
          .querySelector(".pdf-attachments-panel")
          ?.textContent?.includes("Couldn't read attachments"),
      );
      await page.screenshot({ path: join(output, `attachments-read-error-${width}-${theme}.png`) });
      await page.evaluate(() => {
        (window as any).holdRead = true;
        (window as any).releaseRead = null;
      });
      await clickText("Read attachments again");
      await page.waitForFunction(() => !!(window as any).releaseRead);
      assert.equal(await page.$eval(primary, (n) => n.getAttribute("aria-disabled")), "true");
      await page.screenshot({ path: join(output, `attachments-reading-${width}-${theme}.png`) });
      await page.evaluate(() => (window as any).releaseRead());
      await ready();
      await page.evaluate((name) => {
        (window as any).failName = name;
      }, filename);
      await choose(join(output, "a", filename));
      await page.waitForFunction(() =>
        document.querySelector(".pdf-attachments-panel")?.textContent?.includes("Couldn't attach"),
      );
      await page.screenshot({ path: join(output, `attachments-retry-${width}-${theme}.png`) });
      edgeStates.push({ width, theme, empty: true, readError: true, reading: true, retry: true });
    }
  }
  for (const width of [320, 390, 1440]) {
    await page.setViewport({ width, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });
    await settle();
    await ready();
    assert.ok(await page.$eval(panel, (n) => n.scrollWidth <= n.clientWidth + 1));
    await page.screenshot({ path: join(output, `attachments-text200-${width}.png`) });
  }
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await page.keyboard.press("Tab");
  await page.focus(primary);
  assert.equal(await page.$eval(primary, (n) => getComputedStyle(n).outlineWidth), "2px");
  await page.screenshot({ path: join(output, "attachments-forced-200.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "attachments.json"),
    JSON.stringify(
      {
        layouts,
        edgeStates,
        exactEmbeddedBytes: true,
        distinctDuplicateRemoval: true,
        physicalRemoval: true,
        failedSelectionRetained: true,
        failureRetry: true,
        staleReadIgnored: true,
        undoRedo: true,
        cancelDiscards: true,
        donePreservesSelection: true,
        text200: true,
        forcedColours: true,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`PASS attachment output, retry, identity, undo and ${layouts.length} layouts.`);
} catch (error) {
  console.log(
    await page.evaluate(() => ({
      text: document.querySelector(".pdf-attachments-panel")?.textContent,
      failedReadAt: (window as any).failedReadAt,
      tool: (window as any).airTool,
    })),
  );
  await page.screenshot({ path: join(output, "attachments-failure.png") });
  throw error;
} finally {
  await browser.close();
}
