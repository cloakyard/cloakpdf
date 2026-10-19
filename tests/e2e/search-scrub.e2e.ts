/** Real search, scrub, retry/ownership and responsive Air panel acceptance. */
import { createEvidenceDirectory } from "./helpers/evidence-directory.ts";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, PDFName, PDFString } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
const output = createEvidenceDirectory("cloakpdf-air-review");
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
  await page.waitForSelector(id === "find-act" ? ".pdf-find-panel" : ".pdf-scrub-panel");
};
const find = async (text: string) => {
  await page.$eval("#find-and-act-query", (n) => (n as HTMLInputElement).select());
  await page.type("#find-and-act-query", text);
  await page.click('[aria-label="Find matches"]');
};
const waitMatches = async (n: number) =>
  page.waitForFunction((n) => (window as any).airFind.matches?.length === n, {}, n);
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
      w.airFind = useToolSlice("find-act");
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
  await tool("find-act");
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await find("Private");
  await page.waitForSelector('#find-and-act-status[role="alert"]');
  assert.equal(
    await page.$eval("#find-and-act-query", (n) => (n as HTMLInputElement).value),
    "Private",
  );
  assert.notEqual(
    await page.$eval("#find-and-act-query", (n) => n.getAttribute("aria-invalid")),
    "true",
  );
  await page.click('[aria-label="Find matches"]');
  await waitMatches(2);
  await page.click(".pdf-find-results input");
  await find("hello");
  await waitMatches(4);
  assert.equal(
    await page.evaluate(() => (window as any).airFind.matches.filter((m: any) => m.on).length),
    3,
  );
  await clickText("None");
  assert.equal(
    await page.$eval(
      ".pdf-find-panel .air-button--primary",
      (n) => (n as HTMLButtonElement).disabled,
    ),
    true,
  );
  await clickText("All");
  await clickText("Box");
  await page.evaluate(() => {
    const w = window as any;
    w.original = w.airRead.doc.bytes;
    w.failRead = true;
  });
  await clickText("Box 4");
  await page.waitForFunction(() =>
    document.querySelector("#find-and-act-status")?.textContent?.includes("Couldn't apply"),
  );
  assert.equal(
    await page.evaluate(() => (window as any).original === (window as any).airRead.doc.bytes),
    true,
  );
  await waitMatches(4);
  await clickText("Box 4");
  await page.waitForFunction(
    () => (window as any).airFind.matches?.length === 0 && !(window as any).airRead.busyLabel,
  );
  const marked = await page.evaluate(
    () => Array.from((window as any).airRead.doc.bytes) as number[],
  );
  await writeFile(join(output, "boxed.pdf"), new Uint8Array(marked));
  assert.notDeepEqual(marked, bytes);
  const markedText = await page.evaluate(async () => {
    const load = (path: string) => import(path);
    const { getPdfJs } = await load("/src/utils/pdf/raster.ts");
    const task = (await getPdfJs()).getDocument({
      data: (window as any).airRead.doc.bytes.slice(),
    });
    const pdf = await task.promise;
    const text = (await (await pdf.getPage(1)).getTextContent()).items
      .map((x: any) => x.str ?? "")
      .join(" ");
    await task.destroy();
    return text;
  });
  assert.match(markedText, /Private reference 7429/);
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  await find("Private");
  await waitMatches(2);
  // Failed repeat searches preserve the old result selection and new input.
  await tool("pdf-scrub");
  await tool("find-act");
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await find("hello");
  await page.waitForSelector('#find-and-act-status[role="alert"]');
  await waitMatches(2);
  assert.equal(
    await page.$eval("#find-and-act-query", (n) => (n as HTMLInputElement).value),
    "hello",
  );
  // IME Enter must not dispatch. A subsequent ordinary search is cancellable.
  await page.evaluate(() => {
    const w = window as any;
    w.holdRead = true;
    w.releaseRead = null;
    document
      .querySelector("#find-and-act-query")!
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true }),
      );
  });
  await settle();
  assert.equal(await page.evaluate(() => !!(window as any).releaseRead), false);
  await page.click('[aria-label="Find matches"]');
  await page.waitForFunction(() => !!(window as any).releaseRead);
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('[aria-label="Find matches"]')!.click();
  });
  await clickText("Cancel search");
  await page.evaluate(() => (window as any).releaseRead());
  await settle();
  await waitMatches(2);
  for (const kind of ["bytes", "tool"]) {
    await tool("pdf-scrub");
    await tool("find-act");
    await clickText("Clear search");
    await page.evaluate(() => {
      const w = window as any;
      w.holdRead = true;
      w.releaseRead = null;
    });
    await find("Private");
    await page.waitForFunction(() => !!(window as any).releaseRead);
    if (kind === "bytes")
      await page.evaluate(async () => {
        const w = window as any;
        await w.airActions.applyTransform(async (d: any) => ({
          bytes: d.bytes.slice(),
          label: "Test revision",
        }));
      });
    else await tool("pdf-scrub");
    await page.evaluate(() => (window as any).releaseRead());
    await settle();
    assert.equal(await page.evaluate(() => (window as any).airFind.matches?.length ?? 0), 0);
  }
  // Scrub reports real failures and supports retry; output is verified independently.
  await tool("find-act");
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await tool("pdf-scrub");
  await page.waitForSelector('.pdf-scrub-panel [role="alert"]');
  await clickText("Scan again");
  await page.waitForSelector(".pdf-scrub-report");
  await clickText("Scrub hidden data");
  await page.waitForFunction(() =>
    document
      .querySelector('.pdf-scrub-panel [role="status"]')
      ?.textContent?.includes("0 items selected"),
  );
  // An annotation-only result is not actionable until the optional choice is enabled.
  assert.equal(
    await page.$eval(
      ".pdf-scrub-panel .air-button--danger",
      (n) => (n as HTMLButtonElement).disabled,
    ),
    true,
  );
  const analyse = async () =>
    page.evaluate(async () => {
      const load = (path: string) => import(path);
      const { analyzePdfHiddenData } = await load("/src/utils/pdf/scrub.ts");
      return (await analyzePdfHiddenData(new File([(window as any).airRead.doc.bytes], "test.pdf")))
        .counts;
    });
  assert.deepEqual(await analyse(), {
    metadata: 0,
    xmp: 0,
    javascript: 0,
    attachments: 0,
    annotations: 1,
  });
  await page.click(".pdf-scrub-panel input");
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await clickText("Scrub hidden data");
  await page.waitForFunction(() =>
    document.querySelector(".pdf-scrub-panel")?.textContent?.includes("Couldn't scrub"),
  );
  assert.equal(
    await page.$eval(".pdf-scrub-panel input", (n) => (n as HTMLInputElement).checked),
    true,
  );
  await clickText("Scrub hidden data");
  await page.waitForFunction(() =>
    document
      .querySelector('.pdf-scrub-panel [role="status"]')
      ?.textContent?.includes("No data found"),
  );
  assert.deepEqual(await analyse(), {
    metadata: 0,
    xmp: 0,
    javascript: 0,
    attachments: 0,
    annotations: 0,
  });
  await writeFile(
    join(output, "scrubbed.pdf"),
    new Uint8Array(
      await page.evaluate(() => Array.from((window as any).airRead.doc.bytes) as number[]),
    ),
  );
  await page.evaluate(() => (window as any).airActions.undo());
  await page.waitForFunction(() =>
    document
      .querySelector('.pdf-scrub-panel [role="status"]')
      ?.textContent?.includes("1 item selected"),
  );
  // Mobile Done keeps the panel on failure and applies once on repeat activation.
  await page.setViewport({ width: 390, height: 844 });
  await tool("find-act");
  await find("Private");
  await waitMatches(2);
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await clickText("Highlight");
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(() =>
    document.querySelector("#find-and-act-status")?.textContent?.includes("Couldn't apply"),
  );
  assert.equal(await page.evaluate(() => (window as any).airTool), "find-act");
  await page.evaluate(() => {
    const b = document.querySelector<HTMLButtonElement>('button[aria-label="Done"]')!;
    b.click();
    b.click();
  });
  await page.waitForFunction(
    () => (window as any).airTool === null && !(window as any).airRead.busyLabel,
  );
  await page.evaluate(() => (window as any).airActions.undo());
  await tool("find-act");
  await clickText("Clear search");
  await find("PRIVATE");
  await waitMatches(2);
  await page.click(".pdf-mark-choices input");
  await waitMatches(0);
  await page.click(".pdf-mark-choices input");
  await waitMatches(2);
  await clickText("Clear search");
  await find("Priv");
  await waitMatches(2);
  await page.click(".pdf-mark-choices label:last-child input");
  await waitMatches(0);
  await page.click(".pdf-mark-choices label:last-child input");
  await waitMatches(2);
  await clickText("Clear search");
  // Layout, full-name row wrapping and both themes at every family size.
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
  await tool("find-act");
  await find("Private");
  await waitMatches(2);
  for (const theme of ["light", "dark"]) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    for (const [width, height] of sizes) {
      await page.setViewport({ width, height });
      await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: width <= 1024 });
      for (const id of ["find-act", "pdf-scrub"]) {
        await tool(id);
        await settle();
        const row = await page.evaluate(() => {
          const panel = document.querySelector<HTMLElement>(".pdf-find-panel,.pdf-scrub-panel")!;
          const b = panel.getBoundingClientRect();
          const bad = [
            ...panel.querySelectorAll<HTMLElement>(
              "button,input:not([type=checkbox]),.air-check-label",
            ),
          ]
            .filter((n) => {
              const r = n.getBoundingClientRect();
              return (
                r.width &&
                (r.left < b.left - 1 ||
                  r.right > b.right + 1 ||
                  (matchMedia("(pointer:coarse)").matches && r.height < 43))
              );
            })
            .map((n) => n.outerHTML.slice(0, 150));
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            panelOverflow: panel.scrollWidth > panel.clientWidth + 1,
            bad,
          };
        });
        assert.equal(row.overflow, false, `${id} ${width}`);
        assert.equal(row.panelOverflow, false, `${id} ${width}`);
        assert.deepEqual(row.bad, [], `${id} ${width}`);
        layouts.push({ theme, width, height, id, ...row });
        if ([390, 768, 1280, 1440].includes(width)) {
          await page.$eval(".pdf-mark-panel", (n) => {
            for (let p = n.parentElement; p; p = p.parentElement) p.scrollTop = 0;
          });
          await page.screenshot({ path: join(output, `${id}-${width}-${theme}.png`) });
        }
      }
    }
  }
  const edgeStates: unknown[] = [];
  for (const theme of ["light", "dark"]) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    for (const width of [390, 1440]) {
      await page.setViewport({ width, height: width === 390 ? 844 : 900 });
      await tool("pdf-scrub");
      await tool("find-act");
      await clickText("Clear search");
      if (width === 390) await page.locator('[aria-label="Expand controls"]').click();
      await page.evaluate(() => {
        const w = window as any;
        w.holdRead = true;
        w.releaseRead = null;
      });
      await find("A-long-unmatched-phrase-".repeat(5));
      await page.waitForFunction(() => !!(window as any).releaseRead);
      await page.screenshot({ path: join(output, `find-busy-${width}-${theme}.png`) });
      await clickText("Cancel search");
      await page.evaluate(() => (window as any).releaseRead());
      await settle();
      await page.evaluate(() => {
        (window as any).failRead = true;
      });
      await page.click('[aria-label="Find matches"]');
      await page.waitForSelector('#find-and-act-status[role="alert"]');
      await page.screenshot({ path: join(output, `find-error-${width}-${theme}.png`) });
      await page.click('[aria-label="Find matches"]');
      await waitMatches(0);
      await page.waitForFunction(() => (window as any).airFind.terms?.[0]?.startsWith("A-long"));
      assert.ok(await page.$eval(".pdf-find-panel", (n) => n.scrollWidth <= n.clientWidth + 1));
      await page.screenshot({ path: join(output, `find-empty-${width}-${theme}.png`) });
      await page.evaluate(() => {
        (window as any).failRead = true;
      });
      await tool("pdf-scrub");
      await page.waitForSelector('.pdf-scrub-panel [role="alert"]');
      await page.screenshot({ path: join(output, `scrub-error-${width}-${theme}.png`) });
      await page.evaluate(() => {
        const w = window as any;
        w.holdRead = true;
        w.releaseRead = null;
      });
      await clickText("Scan again");
      await page.waitForFunction(() => !!(window as any).releaseRead);
      await page.evaluate(() => (window as any).releaseRead());
      await page.waitForSelector(".pdf-scrub-report");
      assert.equal(
        await page.evaluate(() => document.activeElement?.textContent?.trim()),
        "Scan again",
      );
      edgeStates.push({
        theme,
        width,
        searchBusy: true,
        searchError: true,
        longTermNoMatch: true,
        scrubError: true,
        retryFocus: true,
      });
      if (width === 390) await page.locator('[aria-label="Return to split view"]').click();
    }
  }
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "32px";
  });
  for (const id of ["find-act", "pdf-scrub"]) {
    await tool(id);
    await settle();
    assert.ok(await page.$eval(".pdf-mark-panel", (n) => n.scrollWidth <= n.clientWidth + 1));
    await page.screenshot({ path: join(output, `${id}-text-200.png`) });
  }
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  assert.equal(await page.$eval(".air-check", (n) => getComputedStyle(n).appearance), "auto");
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "search-scrub.json"),
    JSON.stringify(
      {
        layouts,
        edgeStates,
        searchFailureCancelRetry: true,
        staleBytesAndTool: true,
        selectionRetained: true,
        boxOutput: true,
        scrubOutput: true,
        mobileFailureRetry: true,
        compositionEnter: true,
        text200: true,
        errors,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `PASS ${layouts.length} layouts, text enlargement, search/selection/retry/ownership, real box + scrub output and mobile apply failure/retry.`,
  );
} finally {
  await browser.close();
}
