/** Shared Air colour wheel: all consumers, exact colour, gesture recovery and layouts. */
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
pdf.setTitle("Annotation acceptance");
await pdf.attach(new TextEncoder().encode("REFERENCE"), "reference.txt");
const bytes = Array.from(await pdf.save());
pdf.setSubject("Clean layout review");
await writeFile(join(output, "Air annotations.pdf"), new Uint8Array(bytes));
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
const tool = async (id = "annotate-pdf") => {
  await page.evaluate((id) => (window as any).airActions.setActiveTool(id), id);
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
      w.airAnnotation = useToolSlice("annotate-pdf");
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
  }, bytes);

  await page.waitForSelector(".editor-paper img");
  await tool();
  const popup = '[aria-label="Custom color picker"]';
  const trigger = '.pdf-color button[aria-label^="Custom color"]';
  const hex = `${popup} input[name="hex-color"]`;
  const open = async () => {
    await page.locator(trigger).click();
    await page.waitForSelector(`${popup} .air-colour-wheel`);
    await settle();
  };
  const value = () => page.$eval(hex, (e) => (e as HTMLInputElement).value);
  const typeHex = async (next: string) => {
    await page.$eval(hex, (e) => {
      (e as HTMLInputElement).focus();
      (e as HTMLInputElement).select();
    });
    await page.keyboard.sendCharacter(next);
    await settle();
  };
  const close = async () => {
    await page.keyboard.press("Escape");
    await page.waitForSelector(popup, { hidden: true });
  };
  const wheelPoint = async (x: number, y: number) =>
    page.$eval(
      ".air-colour-wheel",
      (e, p) => {
        const r = e.getBoundingClientRect();
        return { x: r.x + r.width * p.x, y: r.y + r.height * p.y };
      },
      { x, y },
    );
  const pick = async (x: number, y: number) => {
    const p = await wheelPoint(x, y);
    const center = await wheelPoint(0.5, 0.5);
    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.mouse.move(p.x, p.y);
    await page.mouse.up();
    await settle();
  };
  await page.locator('[aria-label="Annotation tool"] button::-p-text(Pen)').click();
  await open();
  assert.equal(
    await page.$eval('[aria-label="Brightness"]', (e) => document.activeElement === e),
    true,
  );
  await typeHex("#ff0001");
  assert.equal(await page.$eval('[aria-label="Hue"]', (e) => +(e as HTMLInputElement).value), 360);
  assert.equal(await value(), "#ff0001", "rounding the hue label must not change near-red output");
  await typeHex("#000000");
  await pick(0.5, 0);
  assert.equal(await value(), "#ff0000", "black must yield a visible wheel choice");
  await pick(0.5, 1);
  assert.equal(await value(), "#00ffff", "bottom of displayed wheel is cyan");
  await pick(0.5, 0.5);
  assert.equal(await value(), "#ffffff");
  await pick(0.5, 0.25);
  assert.equal(await value(), "#ff8080");
  await page.focus('[aria-label="Brightness"]');
  await page.keyboard.press("Home");
  assert.equal(await value(), "#000000");
  await page.keyboard.press("End");
  assert.equal(await value(), "#ff8080", "brightness round-trip must retain hue and saturation");
  await page.click(`${popup} summary`);
  await page.focus('[aria-label="Hue"]');
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.$eval('[aria-label="Hue"]', (e) => +(e as HTMLInputElement).value), 1);
  await page.focus('[aria-label="Saturation"]');
  await page.keyboard.press("ArrowLeft");
  assert.equal(
    await page.$eval('[aria-label="Saturation"]', (e) => +(e as HTMLInputElement).value),
    49,
  );
  await page.click(`${popup} summary`);
  await typeHex("#123456");
  const start = await wheelPoint(0.7, 0.3);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 300, start.y, { steps: 8 });
  const duringDrag = await value();
  await page.$eval(".air-colour-wheel", (e) =>
    e.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: 999 })),
  );
  assert.equal(await value(), duringDrag, "a secondary pointer must not cancel the active drag");
  await page.$eval(".air-colour-wheel", (e) =>
    e.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true, pointerId: 1 })),
  );
  await page.mouse.up();
  await settle();
  assert.equal(await value(), "#123456");
  await typeHex("#xyz");
  await page.focus('[aria-label="Brightness"]');
  assert.equal(await page.$eval(hex, (e) => e.getAttribute("aria-invalid")), "true");
  assert.equal(await page.evaluate(() => (window as any).airAnnotation.colorHex), "#123456");
  await typeHex("#285ad7");
  assert.equal(await page.$eval(hex, (e) => e.getAttribute("aria-invalid")), "false");
  await close();
  assert.equal(await page.$eval(trigger, (e) => document.activeElement === e), true);
  await open();
  assert.equal(await value(), "#285ad7");
  await close();

  // Every direct consumer gets the same wheel and preserves the committed colour.
  const consumers = [];
  for (const id of [
    "signature",
    "stamp-pdf",
    "add-page-numbers",
    "header-footer",
    "bates-numbering",
    "qr-stamp",
    "redact-pdf",
    "find-act",
    "annotate-pdf",
  ]) {
    await tool(id);
    if (id === "find-act") await page.locator("button::-p-text(Highlight)").click();
    await page.waitForSelector(trigger);
    const count = await page.$$(".pdf-color");
    for (let index = 0; index < count.length; index++) {
      const triggers = await page.$$(trigger);
      await triggers[index].click();
      await page.waitForSelector(`${popup} .air-colour-wheel`);
      await settle();
      await typeHex("#337755");
      await pick(0.5, 0.25);
      const chosen = await value();
      assert.notEqual(chosen, "#337755");
      await close();
      await (await page.$$(trigger))[index].click();
      await settle();
      assert.equal(await value(), chosen, `${id} colour ${index} must round-trip`);
      await close();
      consumers.push({ id, index, chosen });
    }
  }
  // An externally changed selected object's colour must not leave a stale cursor/hex.
  await page.evaluate(() =>
    (window as any).airActions.patchToolState("annotate-pdf", { colorHex: "#123456" }),
  );
  await open();
  await page.evaluate(() =>
    (window as any).airActions.patchToolState("annotate-pdf", { colorHex: "#abcdef" }),
  );
  await settle();
  assert.equal(await value(), "#abcdef");
  await close();

  await page.setViewport({ width: 390, height: 844 });
  await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await settle();
  await open();
  await typeHex("#000000");
  const touch = await wheelPoint(0.5, 0.01);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: touch.x, y: touch.y }],
  });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await settle();
  assert.notEqual(await value(), "#000000");
  const beforeTouchCancel = await value();
  const target = await wheelPoint(0.9, 0.5);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: target.x, y: target.y }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: target.x + 15, y: target.y + 20 }],
  });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  await settle();
  assert.equal(await value(), beforeTouchCancel);
  await close();

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
      await open();
      const metrics = await page.$eval(popup, (e) => {
        const r = e.getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          w: r.width,
          h: r.height,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          coarse: matchMedia("(pointer:coarse)").matches,
        };
      });
      assert.equal(metrics.overflow, false);
      assert.equal(metrics.coarse, width < 1100);
      assert.ok(
        metrics.x >= 15 &&
          metrics.y >= 15 &&
          metrics.x + metrics.w <= width - 15 &&
          metrics.y + metrics.h <= height - 15,
      );
      assert.equal(
        await page.$eval(
          `${popup} .air-colour-wheel`,
          (e) => Math.abs(e.clientWidth - e.clientHeight) < 2,
        ),
        true,
      );
      const file = `colour-wheel-${width}x${height}-${theme}.png`;
      await page.screenshot({ path: join(output, file) });
      layouts.push({ width, height, theme, ...metrics, file });
      await page.click(`${popup} summary`);
      await page.focus('[aria-label="Saturation"]');
      await page.keyboard.press("Home");
      await page.keyboard.press("End");
      assert.equal(
        await page.$eval('[aria-label="Saturation"]', (e) => +(e as HTMLInputElement).value),
        100,
      );
      await close();
    }
  }
  for (const width of [320, 768, 1440])
    for (const theme of ["light", "dark"]) {
      await page.setViewport({ width, height: 900 });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      await page.evaluate(() => (document.documentElement.style.fontSize = "32px"));
      await settle();
      await open();
      await page.click(`${popup} summary`);
      await page.focus('[aria-label="Saturation"]');
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      );
      await page.screenshot({ path: join(output, `colour-wheel-text200-${width}-${theme}.png`) });
      await close();
    }
  await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "forced-colors", value: "active" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await open();
  await page.screenshot({ path: join(output, "colour-wheel-forced-colors.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "colour-wheel-results.json"),
    JSON.stringify({ consumers, layouts, errors }, null, 2),
  );
  console.log(
    "Colour wheel: cardinal/centre mapping, black/grey continuity, pointer capture/cancel, precise keyboard controls, hex errors, external updates, all nine consumer tools, 22 size/theme + six text200 captures and forced colours passed.",
  );
} catch (error) {
  await page.screenshot({ path: join(output, "colour-wheel-failure.png") });
  throw error;
} finally {
  await cdp.detach();
  await page.close();
  await browser.close();
}
