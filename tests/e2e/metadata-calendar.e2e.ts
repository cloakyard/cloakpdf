/** Real metadata, calendar, failure/retry and responsive Air acceptance. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, PDFName, PDFString } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-review";
await mkdir(output, { recursive: true });
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (let i = 0; i < 2; i++) {
  const p = pdf.addPage([480, 640]);
  p.drawText("A little room to think.", { x: 40, y: 540, size: 24, font });
  p.drawText("hello@example.com", { x: 40, y: 490, size: 18, font });
  p.drawText("Private reference 7429", { x: 40, y: 440, size: 18, font });
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
  if (id === "metadata") await page.waitForSelector(".pdf-metadata-panel");
};
const ready = () => page.waitForSelector(".pdf-document-facts");
const enter = async (selector: string, text: string) => {
  await page.$eval(selector, (n) => (n as HTMLInputElement).select());
  await page.type(selector, text);
};
const readMetadata = () =>
  page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { getPdfMetadata } = await load("/src/utils/pdf/metadata.ts");
    return getPdfMetadata(new File([(window as any).airRead.doc.bytes], "out.pdf"));
  });
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
      w.airMetadata = useToolSlice("metadata");
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
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await tool("metadata");
  await page.waitForSelector('#metadata-read-status[role="alert"]');
  assert.equal(await page.$("#metadata-title"), null);
  assert.equal(
    await page.$eval(
      ".pdf-metadata-panel .air-button--primary",
      (n) => (n as HTMLButtonElement).disabled,
    ),
    true,
  );
  await clickText("Read properties again");
  await ready();
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent?.trim()),
    "Read properties again",
  );
  await enter("#metadata-title", "A considered title");
  await enter("#metadata-author", "Air reviewer");
  await tool("add-bookmarks");
  await page.waitForSelector('[aria-label="Bookmark title"]');
  await tool("metadata");
  await ready();
  assert.equal(
    await page.$eval("#metadata-title", (n) => (n as HTMLInputElement).value),
    "A considered title",
  );
  // One contour and normal field semantics.
  await page.focus("#metadata-title");
  assert.equal(await page.$eval("#metadata-title", (n) => getComputedStyle(n).outlineWidth), "2px");
  await page.evaluate(() => {
    const w = window as any;
    w.original = w.airRead.doc.bytes;
    w.failRead = true;
  });
  await clickText("Save metadata");
  await page.waitForSelector('#metadata-save-status[role="alert"]');
  assert.equal(
    await page.evaluate(() => (window as any).original === (window as any).airRead.doc.bytes),
    true,
  );
  assert.equal(
    await page.$eval("#metadata-title", (n) => (n as HTMLInputElement).value),
    "A considered title",
  );
  await clickText("Save metadata");
  await page.waitForFunction(() =>
    document.querySelector("#metadata-save-status")?.textContent?.includes("Metadata saved"),
  );
  await ready();
  assert.equal((await readMetadata()).title, "A considered title");
  assert.equal((await readMetadata()).author, "Air reviewer");
  await page.evaluate(() => (window as any).airActions.undo());
  await ready();
  await page.waitForFunction(
    () =>
      (document.querySelector("#metadata-author") as HTMLInputElement)?.value ===
      "Synthetic author",
  );
  // Calendar keyboard selection, nested time menus and AM/PM retain their semantics.
  await page.locator("#metadata-creationDate").click();
  await page.waitForSelector(".pdf-date-calendar");
  const selectedDay = await page.$eval(".pdf-date-calendar [aria-pressed=true]", (n) =>
    Number(n.textContent),
  );
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Enter");
  assert.ok(await page.$(".pdf-date-calendar [aria-pressed=true]"));
  if (selectedDay > 1)
    assert.equal(
      await page.$eval(".pdf-date-calendar [aria-pressed=true]", (n) => Number(n.textContent)),
      selectedDay - 1,
    );
  await page.locator(".pdf-date-time [role=combobox]").click();
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await page.locator(".pdf-date-time [role=combobox]").click();
  await page.keyboard.press("Escape");
  assert.ok(await page.$(".pdf-date-popover"), "nested Escape must keep calendar open");
  await page.click(".pdf-date-popover .air-segments button:last-child");
  assert.equal(
    await page.$eval(".pdf-date-popover .air-segments button:last-child", (n) =>
      n.getAttribute("aria-pressed"),
    ),
    "true",
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "metadata-creationDate");
  await page.locator("#metadata-creationDate").click();
  await page.click('[aria-label="Select year"]');
  await page.waitForSelector(".pdf-date-years");
  assert.ok(await page.$eval(".pdf-date-years", (n) => n.contains(document.activeElement)));
  await page.keyboard.press("Enter");
  await page.waitForSelector(".pdf-date-calendar");
  await page.locator(".pdf-date-actions button:last-child").click();
  const dateDraft = await page.evaluate(() => (window as any).airMetadata.fields.creationDate);
  await clickText("Save metadata");
  await page.waitForFunction(
    () =>
      !(window as any).airRead.busyLabel &&
      document.querySelector("#metadata-save-status")?.textContent?.includes("Metadata saved"),
  );
  assert.equal((await readMetadata()).creationDate, dateDraft);
  // Clear edits only these fields. XMP and page content must survive this operation.
  await clickText("Clear all fields");
  assert.equal(await page.$eval("#metadata-author", (n) => (n as HTMLInputElement).value), "");
  await clickText("Save metadata");
  await page.waitForFunction(
    () =>
      !(window as any).airRead.busyLabel &&
      document.querySelector("#metadata-save-status")?.textContent?.includes("Metadata saved"),
  );
  assert.ok(Object.values(await readMetadata()).every((value) => value === ""));
  const cleared = await PDFDocument.load(
    new Uint8Array(
      await page.evaluate(() => Array.from((window as any).airRead.doc.bytes) as number[]),
    ),
    { updateMetadata: false },
  );
  assert.ok(cleared.catalog.has(PDFName.of("Metadata")));
  assert.equal(cleared.getPageCount(), 2);
  // A slow read from an abandoned revision cannot replace the replacement's report.
  await tool("add-bookmarks");
  await page.waitForSelector('[aria-label="Bookmark title"]');
  await page.evaluate(() => {
    const w = window as any;
    w.holdRead = true;
    w.releaseRead = null;
  });
  await tool("metadata");
  await page.waitForFunction(() => !!(window as any).releaseRead);
  await page.evaluate(async () => {
    const w = window as any;
    const load = (path: string) => import(path);
    const { setPdfMetadata, getPdfMetadata } = await load("/src/utils/pdf/metadata.ts");
    await w.airActions.applyTransform(async (d: any) => {
      const file = new File([d.bytes], "working.pdf");
      return {
        bytes: await setPdfMetadata(file, {
          ...(await getPdfMetadata(file)),
          title: "Replacement properties",
        }),
        label: "Test replacement",
      };
    });
  });
  await page.waitForFunction(
    () =>
      (document.querySelector("#metadata-title") as HTMLInputElement)?.value ===
      "Replacement properties",
  );
  await page.evaluate(() => (window as any).releaseRead());
  await settle();
  assert.equal(
    await page.$eval("#metadata-title", (n) => (n as HTMLInputElement).value),
    "Replacement properties",
  );
  // Mobile Done waits, keeps failed drafts and ignores a repeated activation.
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  await enter("#metadata-title", "Mobile properties");
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await page.click('button[aria-label="Done"]');
  await page.waitForSelector('#metadata-save-status[role="alert"]');
  assert.equal(await page.evaluate(() => (window as any).airTool), "metadata");
  await page.evaluate(() => {
    const b = document.querySelector<HTMLButtonElement>('button[aria-label="Done"]')!;
    b.click();
    b.click();
  });
  await page.waitForFunction(
    () => (window as any).airTool === null && !(window as any).airRead.busyLabel,
  );
  assert.equal((await readMetadata()).title, "Mobile properties");
  await page.evaluate(() => (window as any).airActions.undo());
  assert.equal(
    (await readMetadata()).title,
    "Replacement properties",
    "one undo must undo one mobile save",
  );
  await tool("metadata");
  await ready();
  await enter("#metadata-title", "Discard this draft");
  await page.click('button[aria-label="Cancel"]');
  await page.waitForFunction(() => (window as any).airTool === null);
  await tool("metadata");
  await ready();
  assert.equal(
    await page.$eval("#metadata-title", (n) => (n as HTMLInputElement).value),
    "Replacement properties",
  );
  // Long names and populated inputs belong to the source, not a truncated report.
  await page.evaluate(async () => {
    const w = window as any;
    await w.airActions.loadFile(new File([w.airRead.doc.bytes], "Air-review-".repeat(12) + ".pdf"));
  });
  await tool("metadata");
  await ready();
  await enter("#metadata-keywords", "A long metadata value — ".repeat(12));
  const edgeStates: unknown[] = [];
  for (const theme of ["light", "dark"]) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    for (const width of [390, 1440]) {
      await page.setViewport({ width, height: width === 390 ? 844 : 900 });
      await settle();
      await tool("add-bookmarks");
      await page.waitForSelector('[aria-label="Bookmark title"]');
      await page.evaluate(() => {
        const w = window as any;
        w.failRead = true;
      });
      await tool("metadata");
      await page.waitForSelector('#metadata-read-status[role="alert"]');
      assert.ok(
        await page.$eval("#metadata-keywords", (n) =>
          (n as HTMLInputElement).value.startsWith("A long metadata value"),
        ),
      );
      await page.screenshot({ path: join(output, `metadata-read-error-${width}-${theme}.png`) });
      await page.evaluate(() => {
        const w = window as any;
        w.holdRead = true;
        w.releaseRead = null;
      });
      await clickText("Read properties again");
      await page.waitForFunction(() => !!(window as any).releaseRead);
      await page.screenshot({ path: join(output, `metadata-reading-${width}-${theme}.png`) });
      await page.evaluate(() => (window as any).releaseRead());
      await ready();
      assert.equal(
        await page.evaluate(() => document.activeElement?.textContent?.trim()),
        "Read properties again",
      );
      edgeStates.push({
        width,
        theme,
        readFailure: true,
        retainedDraft: true,
        retryFocus: true,
        pending: true,
      });
    }
  }
  const layouts: unknown[] = [];
  const sizes = [
    [320, 568],
    [359, 812],
    [360, 812],
    [361, 812],
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
      await settle();
      assert.ok(await page.$eval(".pdf-metadata-panel", (n) => n.scrollWidth <= n.clientWidth + 1));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if ([390, 768, 1280, 1440].includes(width)) {
        await page.$eval(".pdf-mark-panel", (n) => {
          for (let p = n.parentElement; p; p = p.parentElement) p.scrollTop = 0;
        });
        await page.screenshot({ path: join(output, `metadata-panel-${width}-${theme}.png`) });
      }
      await page.locator("#metadata-creationDate").click();
      await page.waitForSelector(".pdf-date-calendar");
      await settle();
      const check = await page.evaluate(() => {
        const p = document.querySelector<HTMLElement>(".pdf-date-popover")!;
        const b = p.getBoundingClientRect();
        return {
          left: b.left,
          right: b.right,
          top: b.top,
          bottom: b.bottom,
          overflow: p.scrollWidth > p.clientWidth + 1,
          targets: [...p.querySelectorAll("[data-day]")].map((n) => {
            const b = n.getBoundingClientRect();
            return [b.width, b.height];
          }),
        };
      });
      assert.ok(
        check.left >= -1 &&
          check.right <= width + 1 &&
          check.top >= -1 &&
          check.bottom <= height + 1,
        JSON.stringify({ width, height, check }),
      );
      assert.equal(check.overflow, false);
      assert.ok(
        check.targets.every(([w, h]) => w >= 43.9 && h >= 43.9),
        JSON.stringify({ width, check }),
      );
      if ([320, 390, 768, 1280, 1440].includes(width))
        await page.screenshot({ path: join(output, `metadata-calendar-${width}-${theme}.png`) });
      await page.locator('[aria-label="Close date picker"]').click();
      layouts.push({ width, height, theme, ...check });
    }
  }
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  await page.locator("#metadata-creationDate").click();
  await settle();
  assert.ok(await page.$eval(".pdf-date-popover", (n) => n.scrollWidth <= n.clientWidth + 1));
  await page.locator(".pdf-date-actions button:last-child").click();
  assert.equal(await page.evaluate(() => document.activeElement?.id), "metadata-creationDate");
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await page.locator("#metadata-creationDate").click();
  await page.locator(".pdf-date-actions button:nth-child(2)").click();
  assert.equal(
    await page.$eval(
      ".pdf-date-calendar [aria-pressed=true]",
      (n) => getComputedStyle(n).outlineWidth,
    ),
    "2px",
  );
  await page.screenshot({ path: join(output, "metadata-forced-200.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "metadata-calendar.json"),
    JSON.stringify(
      {
        layouts,
        edgeStates,
        cancelDiscardsDraft: true,
        readFailureRetry: true,
        draftPreserved: true,
        saveFailureRetry: true,
        realOutput: true,
        clearRetainsXmp: true,
        staleReadDiscarded: true,
        mobileDoneOnce: true,
        keyboardNestedMenus: true,
        text200: true,
        forcedColours: true,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `PASS metadata output, recovery, drafts, mobile Done, date/time keyboard and ${layouts.length} panel/calendar layouts.`,
  );
} catch (error) {
  await page.screenshot({ path: join(output, "metadata-failure.png") });
  console.log(error);
  console.log(
    await page.evaluate(() => document.querySelector(".pdf-metadata-panel")?.textContent),
  );
  throw error;
} finally {
  await browser.close();
}
