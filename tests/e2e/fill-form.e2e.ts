/** Real native form output, retained drafts and responsive Air controls. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { launch } from "puppeteer-core";
import { PDFDocument, PDFName, PDFDict } from "@pdfme/pdf-lib";
import { formFixture } from "../helpers/form-fixture.ts";
const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-review";
await mkdir(output, { recursive: true });
const bytes = Array.from(await formFixture());
await writeFile(join(output, "Air form.pdf"), new Uint8Array(bytes));
const empty = await PDFDocument.create();
empty.addPage();
const emptyBytes = Array.from(await empty.save());
const unsupported = await PDFDocument.load(new Uint8Array(bytes));
unsupported.getForm().createButton("Submit");
unsupported.getForm().createTextField("constructor").setText("Field name");
const unsupportedBytes = Array.from(await unsupported.save());
const xfa = await PDFDocument.load(new Uint8Array(bytes));
xfa.catalog
  .lookup(PDFName.of("AcroForm"), PDFDict)
  .set(PDFName.of("XFA"), xfa.context.register(xfa.context.stream("<xfa/>")));
const xfaBytes = Array.from(await xfa.save({ updateFieldAppearances: false }));
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage();
const cdp = await page.createCDPSession();
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(String(error)));
await page.setBypassServiceWorker(true);
const settle = () =>
  page.evaluate(async () => {
    for (let i = 0; i < 8; i++) await new Promise(requestAnimationFrame);
  });
const tool = async (id = "fill-pdf-form") => {
  await page.evaluate((id) => (window as any).airActions.setActiveTool(id), id);
  await settle();
};
const ready = () =>
  page.waitForFunction(() => {
    const w = window as any;
    return w.airForm.draft?.bytes === w.airRead.doc?.bytes;
  });
const field = async (name: string, value: string) => {
  const el = await page.$(`[name="${name}"]`);
  assert.ok(el);
  await el.evaluate((e) => {
    (e as HTMLInputElement).focus();
    (e as HTMLInputElement).select();
  });
  await page.keyboard.sendCharacter(value);
  await settle();
};
const values = () => page.evaluate(() => (window as any).airForm.draft.values);
const docBytes = () =>
  page.evaluate(() => Array.from((window as any).airRead.doc.bytes) as number[]);
const save = () =>
  page.evaluate(() =>
    (window as any).airActions.flushPendingApply().then(
      () => true,
      () => false,
    ),
  );
const reset = async (input = bytes) => {
  await tool("add-bookmarks");
  await page.evaluate(async (input) => {
    await (window as any).airActions.loadFile(new File([new Uint8Array(input)], "Air form.pdf"));
    (window as any).airActions.dismissDraft();
  }, input);
  await tool();
  await ready();
  await settle();
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
      w.airForm = useToolSlice("fill-pdf-form");
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
  await page.evaluate(() => (window as any).airActions.dismissDraft());
  assert.equal(
    await page.$eval('[name="Record ID"]', (e) => (e as HTMLInputElement).readOnly),
    true,
  );
  assert.deepEqual((await values()).Interests, ["Design", "Research"]);
  assert.equal((await values()).Occupation, "Writer");
  await field("Full name", "Manual draft");
  await tool("auto-fill");
  await tool();
  await ready();
  assert.equal((await values())["Full name"], "Manual draft");
  await page.click('[aria-label="Show Contact.名字 on page 2"]');
  assert.equal(await page.evaluate(() => (window as any).airRead.selectedPage), 1);
  assert.equal((await values())["Full name"], "Manual draft");
  await field("Full name", "x".repeat(35));
  await page.keyboard.press("Tab");
  assert.match(await page.$eval(".pdf-fillform-panel", (e) => e.textContent!), /28 characters/);
  assert.equal(await save(), false);
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("name")),
    "Full name",
  );
  assert.deepEqual(await docBytes(), bytes);
  await field("Full name", "漢字");
  assert.equal(await save(), false);
  assert.match(await page.$eval(".pdf-fillform-panel", (e) => e.textContent!), /cannot print/);
  assert.equal((await values())["Full name"], "漢字");
  await field("Full name", "Avery updated");
  await field("Notes", "Preserved line one\nAnd line two");
  await page.click('[name="Subscribe"]');
  // Real custom menu clears a formerly selected dropdown and radio value.
  for (const name of ["Region", "Delivery"]) {
    const button = await page.$(`[role="combobox"][aria-label="${name}"]`);
    assert.ok(button);
    await button.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");
  }
  await page.click('fieldset input[type="checkbox"]');
  await field("Occupation", "Independent maker");
  await page.evaluate(() => ((window as any).failRead = true));
  assert.equal(await save(), false);
  assert.equal((await values())["Full name"], "Avery updated");
  assert.deepEqual(await docBytes(), bytes);
  await page.evaluate(() => {
    const w = window as any;
    w.holdRead = true;
    w.saveCount = 0;
    const a = w.airActions.flushPendingApply();
    const b = w.airActions.flushPendingApply();
    w.saveWork = Promise.all([a, b]).then(() => (w.saveCount = 2));
  });
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.equal(await page.evaluate(() => (window as any).saveCount), 0);
  await page.evaluate(() => {
    (window as any).releaseRead();
    (window as any).releaseRead = null;
  });
  await page.waitForFunction(() => (window as any).saveCount === 2);
  await ready();
  await page.waitForFunction(() =>
    document.querySelector(".pdf-fillform-panel")?.textContent?.includes("Form saved."),
  );
  await settle();
  assert.equal(
    await page.evaluate(() => document.activeElement?.classList.contains("pdf-fillform-panel")),
    true,
  );
  const savedBytes = await docBytes();
  const saved = await PDFDocument.load(new Uint8Array(savedBytes));
  const form = saved.getForm();
  assert.equal(form.getTextField("Full name").getText(), "Avery updated");
  assert.equal(form.getTextField("Notes").getText(), "Preserved line one\nAnd line two");
  assert.equal(form.getCheckBox("Subscribe").isChecked(), false);
  assert.deepEqual(form.getDropdown("Region").getSelected(), []);
  assert.equal(form.getRadioGroup("Delivery").getSelected(), undefined);
  assert.deepEqual(form.getOptionList("Interests").getSelected(), ["Research"]);
  assert.deepEqual(form.getDropdown("Occupation").getSelected(), ["Independent maker"]);
  await writeFile(join(output, "Air form saved.pdf"), new Uint8Array(savedBytes));
  await page.evaluate(() => (window as any).airActions.undo());
  await ready();
  assert.deepEqual(await docBytes(), bytes);
  assert.equal((await values())["Full name"], "Avery Chen");
  assert.doesNotMatch(await page.$eval(".pdf-fillform-panel", (e) => e.textContent!), /Form saved/);
  await page.evaluate(() => (window as any).airActions.redo());
  await ready();
  assert.deepEqual(await docBytes(), savedBytes);
  await page.click('input[role="switch"]');
  assert.equal(await save(), true);
  await ready();
  const flattened = await docBytes();
  assert.equal((await PDFDocument.load(new Uint8Array(flattened))).getForm().getFields().length, 0);
  await writeFile(join(output, "Air form flattened.pdf"), new Uint8Array(flattened));
  assert.match(
    await page.$eval(".pdf-fillform-panel", (e) => e.textContent!),
    /no interactive form fields/,
  );
  await page.evaluate(() => (window as any).airActions.undo());
  await ready();
  assert.deepEqual(await docBytes(), savedBytes);
  // Read failures, stale reads after exit/replacement, and genuine empty forms.
  await tool("add-bookmarks");
  await page.evaluate(() => {
    const w = window as any;
    w.airActions.patchToolState("fill-pdf-form", { draft: undefined });
    w.failRead = true;
  });
  await tool();
  await page.waitForSelector('.pdf-fillform-panel [role="alert"]');
  await page.locator("button::-p-text(Retry reading fields)").click();
  await ready();
  await tool("add-bookmarks");
  await page.evaluate(() => {
    const w = window as any;
    w.airActions.patchToolState("fill-pdf-form", { draft: undefined });
    w.holdRead = true;
  });
  await tool();
  await page.waitForFunction(() => !!(window as any).releaseRead);
  await tool("auto-fill");
  await page.evaluate(() => {
    (window as any).releaseRead();
    (window as any).releaseRead = null;
  });
  await settle();
  assert.equal(await page.evaluate(() => (window as any).airForm.draft), undefined);
  await tool("add-bookmarks");
  await page.evaluate(async (input) => {
    await (window as any).airActions.loadFile(new File([new Uint8Array(input)], "XFA form.pdf"));
  }, xfaBytes);
  await tool();
  await page.waitForSelector('.pdf-fillform-panel [role="alert"]');
  assert.match(
    await page.$eval(".pdf-fillform-panel", (e) => e.textContent!),
    /uses XFA form fields/,
  );
  assert.doesNotMatch(
    await page.$eval(".pdf-fillform-panel", (e) => e.textContent!),
    /Retry reading fields/,
  );
  assert.equal(await page.$(".pdf-fillform-panel input"), null);
  await reset(emptyBytes);
  assert.match(
    await page.$eval(".pdf-fillform-panel", (e) => e.textContent!),
    /no interactive form fields/,
  );
  await reset(unsupportedBytes);
  assert.equal(
    await page.$eval('[name="constructor"]', (e) => (e as HTMLInputElement).value),
    "Field name",
  );
  assert.equal(
    await page.$eval('input[role="switch"]', (e) => (e as HTMLInputElement).disabled),
    true,
  );
  assert.match(
    await page.$eval(".pdf-fillform-panel", (e) => e.textContent!),
    /cannot be edited here/,
  );
  await reset();
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  await field("Full name", "Mobile save");
  await page.evaluate(() => ((window as any).failRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForSelector('.pdf-fillform-panel [role="alert"]');
  assert.equal((await values())["Full name"], "Mobile save");
  await page.evaluate(() => ((window as any).holdRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.equal(await page.evaluate(() => (window as any).airTool), "fill-pdf-form");
  await page.evaluate(() => {
    (window as any).releaseRead();
    (window as any).releaseRead = null;
  });
  await page.waitForFunction(() => (window as any).airTool === null);
  await tool();
  await ready();
  await field("Full name", "Discard this");
  await page.evaluate(() => (window as any).airActions.cancelCurrentTool());
  await tool();
  await ready();
  assert.equal((await values())["Full name"], "Mobile save");
  await reset();
  await page.evaluate(() =>
    (window as any).airActions.addObject({
      kind: "redaction",
      pageIndex: 0,
      rect: { xPct: 0.1, yPct: 0.1, wPct: 0.2, hPct: 0.1 },
      payload: {},
    }),
  );
  await settle();
  assert.match(await page.$eval(".pdf-fillform-panel", (e) => e.textContent!), /pending redaction/);
  assert.equal(await page.$('input[name="Full name"]'), null);
  await reset();
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
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      await cdp.send("Emulation.setTouchEmulationEnabled", {
        enabled: width < 1100,
        maxTouchPoints: 1,
      });
      await settle();
      for (const region of ["text", "choice", "finish"]) {
        const selector =
          region === "text"
            ? '[name="Full name"]'
            : region === "choice"
              ? "#form-field-3"
              : 'input[role="switch"]';
        await page.focus(selector);
        await settle();
        const metrics = await page.$eval(".pdf-fillform-panel", (e) => ({
          overflow: e.scrollWidth > e.clientWidth + 1,
          bodyOverflow: document.documentElement.scrollWidth > innerWidth + 1,
          coarse: matchMedia("(pointer: coarse)").matches,
          minimumTargetHeight: Math.min(
            ...Array.from(
              e.querySelectorAll("button, .air-field, .air-check-label, .air-switch-row"),
            )
              .map((control) => control.getBoundingClientRect().height)
              .filter((height) => height > 0),
          ),
        }));
        assert.equal(metrics.overflow, false, `${width} ${theme} ${region}`);
        assert.equal(metrics.bodyOverflow, false);
        if (metrics.coarse)
          assert.ok(metrics.minimumTargetHeight >= 44, `${width}px coarse targets`);
        if (region === "choice") {
          await page.keyboard.press("Enter");
          await settle();
          const rect = await page.$eval('[role="listbox"]', (e) => {
            const r = e.getBoundingClientRect();
            return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
          });
          assert.ok(
            rect.left >= 0 && rect.right <= width && rect.top >= 0 && rect.bottom <= height,
          );
        }
        const capture = `fill-form-${width}x${height}-${theme}-${region}.png`;
        await page.screenshot({ path: join(output, capture) });
        layouts.push({ width, height, theme, region, ...metrics, capture });
        if (region === "choice") await page.keyboard.press("Escape");
      }
    }
  const enlarged = [];
  for (const width of [320, 768, 1440])
    for (const theme of ["light", "dark"]) {
      await page.setViewport({ width, height: 900 });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
      await settle();
      await page.focus('[name="Notes"]');
      assert.equal(
        await page.$eval(".pdf-fillform-panel", (e) => e.scrollWidth > e.clientWidth + 1),
        false,
      );
      const capture = `fill-form-text200-${width}-${theme}.png`;
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
  await page.focus('[name="Subscribe"]');
  await page.screenshot({ path: join(output, "fill-form-forced-colours.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "fill-form-results.json"),
    JSON.stringify(
      {
        layouts,
        enlarged,
        errors,
        assertions: [
          "all native field types and stored values",
          "read-only/unsupported fields",
          "custom menus and clearing",
          "named validation failures",
          "drafts across navigation/reflow",
          "read retry and stale-result isolation",
          "atomic Apply/retry/dedup",
          "editable and flattened real PDF output",
          "Undo/Redo/Cancel",
          "mobile Done waits",
          "privacy marks gate",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS Fill form: lifecycle/output, ${layouts.length} layout states, ${enlarged.length} enlarged-text states`,
  );
} finally {
  await cdp.detach();
  await browser.close();
}
