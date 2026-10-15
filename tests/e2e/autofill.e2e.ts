/** Auto-fill: real detection/output, retained drafts, async ownership and Air layouts. */
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
for (let i = 0; i < 2; i++) {
  const p = pdf.addPage([420, 600]);
  if (i) {
    p.setCropBox(20, 30, 360, 520);
    p.setRotation(degrees(90));
    p.node.set(PDFName.of("UserUnit"), PDFNumber.of(1.5));
  }
  await drawOnVisiblePage(p, ({ height }) => {
    p.drawText(`Application - page ${i + 1}`, { x: 30, y: height - 45, size: 18, font });
    for (const [j, label] of ["Full name:", "Email:", "Company:"].entries())
      p.drawText(label, { x: 30, y: height - 105 - j * 60, size: 12, font });
  });
}
pdf.setTitle("Auto-fill acceptance");
await pdf.attach(new TextEncoder().encode("REFERENCE"), "reference.txt");
const bytes = Array.from(await pdf.save());
await writeFile(join(output, "Air autofill.pdf"), new Uint8Array(bytes));
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
const tool = async (id = "auto-fill") => {
  await page.evaluate((id) => (window as any).airActions.setActiveTool(id), id);
  await settle();
};
const clickText = (text: string) => page.locator(`button::-p-text(${text})`).click();
const values = () => page.evaluate(() => (window as any).airAuto.answers?.values);
const field = async (selector: string, value: string) => {
  await page.$eval(selector, (e) => {
    (e as HTMLInputElement).focus();
    (e as HTMLInputElement).select();
  });
  await page.keyboard.sendCharacter(value);
  await settle();
};
const scan = async () => {
  await clickText("Detect fields");
  await page.waitForFunction(
    () =>
      (window as any).airAuto.answers?.fields.length === 6 &&
      document
        .querySelector(".pdf-autofill-panel [data-busy-focus-fallback]")
        ?.getAttribute("aria-busy") === "false",
  );
  await settle();
};
const finished = () => page.waitForFunction(() => !(window as any).airRead.busyLabel);
const reset = async (input = bytes) => {
  await tool("add-bookmarks");
  await page.evaluate(async (input) => {
    await (window as any).airActions.loadFile(new File([new Uint8Array(input)], "Air review.pdf"));
  }, input);
  await finished();
  await settle();
  await tool();
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
      w.airAuto = useToolSlice("auto-fill");
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
    // The original method is deliberately called with the receiving Storage object.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const store = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (w.failStorage && key === "cloakpdf-autofill-profile") throw new Error("Storage denied");
      return store.call(this, key, value);
    };
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
  await page.evaluate(() =>
    localStorage.setItem(
      "cloakpdf-autofill-profile",
      JSON.stringify({ name: 42, email: null, extra: "ignored" }),
    ),
  );
  await tool("annotate-pdf");
  await tool();
  await clickText("Your profile");
  assert.equal(
    await page.$eval("#autofill-profile-name", (e) => (e as HTMLInputElement).value),
    "",
  );
  await field("#autofill-profile-name", "Avery Chen");
  await field("#autofill-profile-email", "avery@example.com");
  await page.evaluate(() => {
    (window as any).failStorage = true;
  });
  await field("#autofill-profile-company", "Local draft");
  assert.match(
    await page.$eval("#autofill-profile", (e) => e.textContent!),
    /Couldn't save on this device/,
  );
  await tool("annotate-pdf");
  await tool();
  assert.equal(
    await page.$eval("#autofill-profile-company", (e) => (e as HTMLInputElement).value),
    "Local draft",
  );
  await page.evaluate(() => {
    (window as any).failStorage = false;
  });
  await field("#autofill-profile-company", "Northline Studio");
  await clickText("Your profile");
  await scan();
  assert.deepEqual(Object.values(await values()), [
    "Avery Chen",
    "avery@example.com",
    "Northline Studio",
    "Avery Chen",
    "avery@example.com",
    "Northline Studio",
  ]);
  await field("#autofill-answer-0", "Manual answer");
  await scan();
  assert.equal((await values())[0], "Manual answer", "re-detection must preserve entered answers");
  await field("#autofill-answer-2", "");
  await clickText("Fill empty answers from profile");
  assert.equal((await values())[0], "Manual answer");
  assert.equal((await values())[2], "Northline Studio");
  assert.deepEqual(
    await page.evaluate(() => ({
      label: document.activeElement?.textContent?.trim(),
      disabled: document.activeElement?.getAttribute("aria-disabled"),
    })),
    { label: "Fill empty answers from profile", disabled: "true" },
    "profile fill must keep keyboard focus when no empty matches remain",
  );
  await page.click('[aria-label="Show Full name on page 2"]');
  assert.equal(await page.evaluate(() => (window as any).airRead.selectedPage), 1);

  const before = await values();
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await clickText("Detect fields");
  await page.waitForFunction(() =>
    document
      .querySelector(".pdf-autofill-panel")
      ?.textContent?.includes("Couldn't read the fields"),
  );
  assert.deepEqual(await values(), before);
  await page.evaluate(() => {
    (window as any).holdRead = true;
  });
  await clickText("Detect fields");
  await page.waitForFunction(() => !!(window as any).releaseRead);
  await clickText("Cancel detection");
  await page.evaluate(() => {
    (window as any).releaseRead();
    (window as any).releaseRead = null;
  });
  await settle();
  assert.deepEqual(await values(), before);
  assert.equal(
    await page.$eval(
      ".pdf-autofill-panel [data-busy-focus-fallback]",
      (e) => e === document.activeElement,
    ),
    true,
  );
  await page.evaluate(() => {
    (window as any).holdRead = true;
  });
  await clickText("Detect fields");
  await page.waitForFunction(() => !!(window as any).releaseRead);
  await tool("annotate-pdf");
  await page.evaluate(() => {
    (window as any).releaseRead();
    (window as any).releaseRead = null;
  });
  await settle();
  await tool();
  assert.deepEqual(await values(), before);

  // A changed revision cannot reuse the old page coordinates, even after a late scan.
  await page.evaluate(() => {
    (window as any).holdRead = true;
  });
  await clickText("Detect fields");
  await page.waitForFunction(() => !!(window as any).releaseRead);
  await page.evaluate(async () => {
    await (window as any).airActions.applyTransform(async (d: any) => ({
      bytes: d.bytes.slice(),
      label: "New byte revision",
    }));
  });
  await page.evaluate(() => {
    (window as any).releaseRead();
    (window as any).releaseRead = null;
  });
  await settle();
  assert.equal(await page.$$(".pdf-autofill-fields input").then((a) => a.length), 0);
  assert.match(await page.$eval(".pdf-autofill-panel", (e) => e.textContent!), /document changed/);
  await scan();

  // Unsupported text fails atomically; the draft survives for correction/retry.
  await field("#autofill-answer-0", "漢字");
  await clickText("Fill 6 fields");
  await finished();
  await settle();
  assert.match(
    await page.$eval(".pdf-autofill-panel", (e) => e.textContent!),
    /characters Helvetica cannot print/,
  );
  assert.equal((await values())[0], "漢字");
  await field("#autofill-answer-0", "Manual answer");
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await clickText("Fill 6 fields");
  await finished();
  await settle();
  assert.equal((await values())[0], "Manual answer");
  await page.evaluate(() => {
    (window as any).holdRead = true;
    (window as any).applyCalls = 0;
  });
  await page.evaluate(() => {
    const w = window as any;
    const a = w.airActions.flushPendingApply();
    const b = w.airActions.flushPendingApply();
    w.sameApply = a === b;
    w.pendingFill = Promise.all([a, b]).then(() => {
      w.applyCalls++;
    });
  });
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.equal(await page.evaluate(() => (window as any).sameApply), true);
  assert.ok(await values());
  await page.evaluate(() => {
    (window as any).releaseRead();
    (window as any).releaseRead = null;
  });
  await page.evaluate(async () => {
    await (window as any).pendingFill;
  });
  await finished();
  await settle();
  assert.equal(await page.evaluate(() => (window as any).applyCalls), 1);
  assert.equal(await values(), undefined);
  const outputBytes = await page.evaluate(() =>
    Array.from((window as any).airRead.doc.bytes as Uint8Array),
  );
  const result = await PDFDocument.load(new Uint8Array(outputBytes));
  assert.equal(result.getTitle(), "Auto-fill acceptance");
  assert.ok(result.catalog.get(PDFName.of("Names")));
  assert.equal(result.getPage(1).getRotation().angle, 90);
  assert.equal(result.getPage(1).node.get(PDFName.of("UserUnit"))?.toString(), "1.5");
  const text = await page.evaluate(async () => {
    const load = async (path: string) => import(path);
    const { extractTextGeometry } = await load("/src/utils/layout-extract.ts");
    const d = (window as any).airRead.doc;
    return extractTextGeometry(new File([d.bytes], "output.pdf"), { ocr: false });
  });
  assert.match(text[0].text, /Manual answer/);
  assert.match(text[1].text, /Avery Chen/);
  assert.match(text[0].text, /Application/);
  assert.match(text[1].text, /Northline Studio/);
  for (const p of text)
    for (const item of p.items) {
      assert.ok(item.x >= 0 && item.x + item.width < p.width + 2);
      assert.ok(item.y >= 0 && item.y + item.height < p.height + 2);
    }
  await writeFile(join(output, "Air autofill output.pdf"), new Uint8Array(outputBytes));
  await page.evaluate(() => (window as any).airActions.undo());
  await settle();
  assert.equal(await values(), undefined, "applied draft must not reappear after Undo");
  assert.doesNotMatch(
    await page.$eval(".pdf-autofill-panel", (e) => e.textContent!),
    /Answers added to the PDF/,
  );
  await page.evaluate(() => (window as any).airActions.redo());
  await settle();
  assert.deepEqual(
    await page.evaluate(() => Array.from((window as any).airRead.doc.bytes as Uint8Array)),
    outputBytes,
  );

  // Empty and text-free pages offer different recovery, without invented results.
  const empty = await PDFDocument.create();
  empty.addPage([420, 600]);
  await reset(Array.from(await empty.save()));
  await clickText("Detect fields");
  await page.waitForFunction(() => !!(window as any).airAuto.answers);
  assert.match(
    await page.$eval(".pdf-autofill-panel", (e) => e.textContent!),
    /No selectable text/,
  );
  const plain = empty.getPage(0);
  plain.drawText("A short plain document", {
    x: 40,
    y: 200,
    size: 14,
    font: await empty.embedFont(StandardFonts.Helvetica),
  });
  await reset(Array.from(await empty.save()));
  await clickText("Detect fields");
  await page.waitForFunction(() => !!(window as any).airAuto.answers);
  assert.match(await page.$eval(".pdf-autofill-panel", (e) => e.textContent!), /No blank fields/);
  await reset();
  await scan();

  // Mobile Done waits for failure/success and retains its correction route.
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  await page.evaluate(() => {
    (window as any).failRead = true;
  });
  await page.click('button[aria-label="Done"]');
  await finished();
  await settle();
  assert.equal(await page.evaluate(() => (window as any).airTool), "auto-fill");
  assert.ok(await values());
  await page.click('button[aria-label="Done"]');
  await finished();
  await settle();
  assert.equal(await page.evaluate(() => (window as any).airTool), null);
  await tool();
  assert.equal(await values(), undefined);
  await reset();
  await scan();
  await field("#autofill-answer-0", "Cancel this draft");
  await page.evaluate(() => (window as any).airActions.cancelCurrentTool());
  await settle();
  await tool();
  assert.equal(await values(), undefined);
  await scan();

  await page.evaluate(() => {
    const w = window as any;
    w.privacyMark = w.airActions.addObject({
      kind: "redaction",
      pageIndex: 0,
      rect: { xPct: 0.1, yPct: 0.1, wPct: 0.2, hPct: 0.05 },
      payload: { fill: { r: 0, g: 0, b: 0 }, border: { r: 0, g: 0, b: 0 } },
    });
  });
  await settle();
  assert.equal(
    await page.$eval(".pdf-autofill-panel [data-busy-focus-fallback]", (e) =>
      e.getAttribute("aria-disabled"),
    ),
    "true",
  );
  assert.equal(
    await page.$eval("#autofill-answer-0", (e) => (e as HTMLInputElement).disabled),
    true,
  );
  await page.evaluate(() => {
    const w = window as any;
    w.airActions.removeObject(w.privacyMark);
    w.airActions.dismissDraft();
  });
  await settle();
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
  ]) {
    for (const theme of ["light", "dark"]) {
      await page.setViewport({ width, height });
      await cdp.send("Emulation.setTouchEmulationEnabled", {
        enabled: width < 1100,
        maxTouchPoints: 1,
      });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      await settle();
      for (const region of ["answers", "profile"]) {
        if (region === "profile") await clickText("Your profile");
        const selector = region === "answers" ? "#autofill-answer-0" : "#autofill-profile-name";
        await page.focus(selector);
        await settle();
        const metrics = await page.$eval(".pdf-autofill-panel", (e) => ({
          overflow:
            e.scrollWidth > e.clientWidth + 1 ||
            document.documentElement.scrollWidth > innerWidth + 1,
          coarse: matchMedia("(pointer:coarse)").matches,
          controls: [...e.querySelectorAll<HTMLElement>("input,button")]
            .filter((n) => n.getClientRects().length)
            .map((n) => ({
              w: n.getBoundingClientRect().width,
              h: n.getBoundingClientRect().height,
            })),
        }));
        assert.equal(metrics.overflow, false, `${width} ${theme} ${region} overflow`);
        assert.equal(metrics.coarse, width < 1100);
        if (metrics.coarse)
          assert.ok(
            metrics.controls.every((r) => r.h >= 43.5),
            `${width} touch targets`,
          );
        const file = `autofill-${width}x${height}-${theme}-${region}.png`;
        await page.screenshot({ path: join(output, file) });
        layouts.push({ width, height, theme, region, ...metrics, file });
        if (region === "profile") await clickText("Your profile");
      }
    }
  }
  const enlarged = [];
  for (const width of [320, 768, 1440])
    for (const theme of ["light", "dark"]) {
      await page.setViewport({ width, height: 900 });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await settle();
      await clickText("Your profile");
      await page.focus("#autofill-profile-name");
      await settle();
      assert.equal(
        await page.$eval(".pdf-autofill-panel", (e) => e.scrollWidth > e.clientWidth + 1),
        false,
      );
      const file = `autofill-text200-${width}-${theme}.png`;
      await page.screenshot({ path: join(output, file) });
      enlarged.push({ width, theme, file });
      await clickText("Your profile");
    }
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await page.focus("#autofill-answer-0");
  await page.screenshot({ path: join(output, "autofill-forced-colors.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "autofill-results.json"),
    JSON.stringify(
      {
        layouts,
        enlarged,
        outputPages: text.length,
        errors,
        assertions: [
          "profile persistence/failure/retry",
          "scan failure/cancellation/exit/revision ownership",
          "manual answers survive rescan/profile",
          "profile-fill focus survives completion",
          "apply failure/deduplication/Undo/Redo/Cancel",
          "Undo clears applied success feedback",
          "mobile Done promise",
          "real mixed-page PDF text/catalog output",
          "empty/no-text recovery",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS Auto-fill: output/lifecycle and ${layouts.length} layout regions, ${enlarged.length} enlarged-text states`,
  );
} finally {
  await cdp.detach();
  await page.close();
  await browser.close();
}
