/** Signature source ownership, real image/PDF output, keyboard placement and Air acceptance. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";
const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-review";
await mkdir(output, { recursive: true });
const pdf = await PDFDocument.create();
const font = await pdf.embedFont(StandardFonts.Helvetica);
for (let i = 0; i < 3; i++) {
  const p = pdf.addPage(i === 1 ? [600, 400] : [400, 600]);
  p.drawText("Cloakyard - a thoughtful place for everyday documents", {
    x: 30,
    y: 565,
    size: 11,
    font,
  });
  p.drawText(`Body content on page ${i + 1}`, { x: 70, y: 340, size: 18, font });
  p.drawText(`Page ${i + 1}`, { x: 170, y: 20, size: 10, font });
}
pdf.setTitle("Signature acceptance");
pdf.setAuthor("Synthetic author");
await pdf.attach(new TextEncoder().encode("REFERENCE"), "reference.txt");
const bytes = Array.from(await pdf.save());
await writeFile(join(output, "Air signature.pdf"), new Uint8Array(bytes));
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
const tool = async (id = "signature") => {
  await page.evaluate((id) => (window as any).airActions.setActiveTool(id), id);
  await settle();
};
const clickText = (text: string) => page.locator(`button::-p-text(${text})`).click();
const docBytes = () =>
  page.evaluate(() => Array.from((window as any).airRead.doc.bytes as Uint8Array));
const reset = async (input = bytes) => {
  await tool("add-bookmarks");
  await page.evaluate(async (input) => {
    await (window as any).airActions.loadFile(
      new File([new Uint8Array(input)], "Air signature.pdf"),
    );
  }, input);
  await page.waitForFunction(() => !(window as any).airRead.busyLabel);
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
      w.airSignature = useToolSlice("signature");
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
  const stroke = async () => {
    const canvas = await page.$(".pdf-signature-pad__canvas");
    await canvas!.scrollIntoView();
    const b = (await canvas!.boundingBox())!;
    await page.mouse.move(b.x + b.width * 0.15, b.y + b.height * 0.55);
    await page.mouse.down();
    for (const [x, y] of [
      [0.3, 0.25],
      [0.4, 0.7],
      [0.55, 0.4],
      [0.7, 0.5],
      [0.85, 0.35],
    ])
      await page.mouse.move(b.x + b.width * x, b.y + b.height * y, { steps: 5 });
    await page.mouse.up();
    await page.waitForSelector('img[alt="Signature preview"]');
  };
  const state = () =>
    page.evaluate(() => ({
      source: (window as any).airSignature,
      objects: (window as any).airRead.doc.objects,
    }));
  const count = (n: number) =>
    page.waitForFunction(
      (n) =>
        (window as any).airRead.doc.objects.filter((o: any) => o.kind === "signature").length === n,
      {},
      n,
    );
  const upload = async (path: string) => {
    const input = await page.$('input[accept="image/png,image/jpeg"]');
    await input!.uploadFile(path);
    await page.waitForFunction(
      () =>
        !document.querySelector(".pdf-signature-panel")?.textContent?.includes("Preparing image…"),
    );
    await settle();
  };
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 240;
    c.height = 120;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 240, 120);
    ctx.fillStyle = "#e00000";
    ctx.fillRect(40, 40, 160, 40);
    return c.toDataURL();
  });
  const imagePath = join(output, "signature-paper.png");
  const badPath = join(output, "signature-broken.png");
  await writeFile(imagePath, Buffer.from(png.split(",")[1], "base64"));
  await writeFile(badPath, "not an image");
  await stroke();
  const drawn = (await state()).source.drawn;
  assert.equal(drawn.strokes.length, 1);
  await clickText("Choose");
  await upload(imagePath);
  assert.equal((await state()).source.uploaded.aspect, 2);
  await upload(badPath);
  assert.match(await page.$eval('[role="alert"]', (e) => e.textContent!), /could not be opened/);
  assert.equal((await state()).source.uploaded.aspect, 2);
  await upload(badPath); // same-file retry must fire change again
  assert.ok(await page.$('[role="alert"]'));
  await upload(imagePath);
  assert.equal(await page.$('[role="alert"]'), null);
  await clickText("Draw");
  assert.equal((await state()).source.drawn.strokes.length, 1);
  assert.equal((await state()).source.drawn.dataUrl, drawn.dataUrl);
  await page.click('[role="switch"][aria-label="Realistic ink"]');
  assert.notEqual((await state()).source.drawn.dataUrl, drawn.dataUrl);
  await tool("crop-pages");
  await tool();
  assert.equal((await state()).source.drawn.strokes.length, 1);
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  assert.equal((await state()).source.drawn.strokes.length, 1);
  await page.setViewport({ width: 1440, height: 900 });
  await settle();
  assert.equal((await state()).source.drawn.strokes.length, 1);
  // Cancelling a partial stroke preserves prior finished ink.
  const beforeCancel = (await state()).source.drawn.dataUrl;
  await page.$eval(".pdf-signature-pad__canvas", (canvas) => {
    const r = canvas.getBoundingClientRect();
    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        pointerId: 19,
        pointerType: "pen",
        clientX: r.x + 20,
        clientY: r.y + 20,
        pressure: 0.8,
      }),
    );
    canvas.dispatchEvent(
      new PointerEvent("pointercancel", { bubbles: true, pointerId: 19, pointerType: "pen" }),
    );
  });
  assert.equal((await state()).source.drawn.dataUrl, beforeCancel);
  await clickText("Choose");
  // Pixel checks: white paper removed, saturated ink kept, transparent white logo preserved.
  const pixels = await page.evaluate(async () => {
    const load = (s: string) => import(s);
    const { prepareSignature } = await load("/src/editor/signature.ts");
    const pixel = async (url: string, x: number, y: number) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return Array.from(ctx.getImageData(x, y, 1, 1).data);
    };
    const src = (window as any).airSignature.uploaded.dataUrl;
    const c = document.createElement("canvas");
    c.width = 10;
    c.height = 10;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(3, 3, 4, 4);
    const logo = await prepareSignature(c.toDataURL());
    const backed = await prepareSignature(src, { background: "#123456" });
    const jpeg = await prepareSignature(c.toDataURL("image/jpeg"));
    const controller = new AbortController();
    controller.abort();
    let cancelled = false;
    try {
      await prepareSignature(src, { signal: controller.signal });
    } catch (error) {
      cancelled = (error as Error).name === "AbortError";
    }
    let limited = false;
    try {
      await prepareSignature(
        new File([new Uint8Array(21 * 1024 * 1024)], "large.png", { type: "image/png" }),
      );
    } catch {
      limited = true;
    }

    return {
      cancelled,
      limited,
      jpegAspect: jpeg.aspect,
      paper: await pixel(src, 0, 0),
      ink: await pixel(src, 60, 60),
      logo: await pixel(logo.dataUrl, 5, 5),
      backed: await pixel(backed.dataUrl, 0, 0),
    };
  });
  assert.equal(pixels.cancelled, true);
  assert.equal(pixels.limited, true);
  assert.equal(pixels.jpegAspect, 1);
  assert.equal(pixels.paper[3], 0);
  assert.equal(pixels.ink[3], 255);
  assert.deepEqual(pixels.logo, [255, 255, 255, 255]);
  assert.deepEqual(pixels.backed, [18, 52, 86, 255]);
  await clickText("Place on this page");
  await count(1);
  const first = (await state()).objects[0].rect;
  await page.click('[aria-label="Move right"]');
  assert.ok((await state()).objects[0].rect.xPct > first.xPct);
  await page.click('[aria-label="Larger signature"]');
  assert.ok((await state()).objects[0].rect.wPct > first.wPct);
  await clickText("Copy to remaining pages");
  await count(3);
  const placed = (await state()).objects;
  for (const obj of placed) {
    const p = obj.pageIndex === 1 ? { w: 600, h: 400 } : { w: 400, h: 600 };
    assert.ok(Math.abs((obj.rect.wPct * p.w) / (obj.rect.hPct * p.h) - 2) < 1e-6);
  }
  await page.click("#signature-selection");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await settle();
  assert.equal(await page.evaluate(() => (window as any).airRead.selectedPage), 2);
  await page.click('[aria-label="Remove selected signature"]');
  await count(2);
  await page.evaluate(() => (window as any).airActions.undo());
  await count(3);
  // Backing, output text and catalog survive embedding; failure keeps pending marks.
  await page.click('[role="switch"][aria-label="Signature background"]');
  await page.evaluate(() => ((window as any).failRead = true));
  await clickText("Apply signatures");
  await page.waitForFunction(() => !(window as any).airRead.busyLabel);
  await count(3);
  assert.deepEqual(await docBytes(), bytes);
  await clickText("Apply signatures");
  await count(0);
  const saved = await docBytes();
  const signed = await PDFDocument.load(new Uint8Array(saved));
  assert.equal(signed.getTitle(), "Signature acceptance");
  assert.equal(signed.getPageCount(), 3);
  const outputContent = await page.evaluate(async (input) => {
    const load = (s: string) => import(s);
    const { getPdfJs } = await load("/src/utils/pdf/raster.ts");
    const { getDocument } = await getPdfJs();
    const task = getDocument({ data: new Uint8Array(input) });
    const pdf = await task.promise;
    const pages = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const p = await pdf.getPage(n);
      const vp = p.getViewport({ scale: 1 });
      const c = document.createElement("canvas");
      c.width = vp.width;
      c.height = vp.height;
      await p.render({ canvas: c, viewport: vp }).promise;
      const px = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
      let red = 0;
      for (let i = 0; i < px.length; i += 4)
        if (px[i] > 150 && px[i + 1] < 80 && px[i + 2] < 80) red++;
      const text = await p.getTextContent();
      pages.push({ red, text: text.items.map((i: any) => i.str).join(" ") });
    }
    const attachments = await pdf.getAttachments();
    await task.destroy();
    return { pages, attachments: Array.from(attachments?.keys() ?? []) };
  }, saved);
  assert.deepEqual(outputContent.attachments, ["reference.txt"]);
  for (const p of outputContent.pages) {
    assert.ok(p.red > 100);
    assert.match(p.text, /Body content/);
  }
  await page.evaluate(() => (window as any).airActions.undo());
  await count(3);
  assert.deepEqual(await docBytes(), bytes);
  // Mobile Done waits, rejects cleanly and can be retried without losing the tool.
  await page.setViewport({ width: 390, height: 844 });
  await settle();
  await page.evaluate(() => ((window as any).failRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(() => !(window as any).airRead.busyLabel);
  assert.equal(await page.evaluate(() => (window as any).airTool), "signature");
  await count(3);
  await page.evaluate(() => ((window as any).holdRead = true));
  await page.click('button[aria-label="Done"]');
  await page.waitForFunction(() => !!(window as any).releaseRead);
  assert.equal(await page.evaluate(() => (window as any).airTool), "signature");
  await page.evaluate(() => (window as any).releaseRead());
  await page.waitForFunction(() => (window as any).airTool === null);
  await count(0);
  // New documents start clean. Cancel rolls the complete pending placement back.
  await reset();
  assert.equal((await state()).source.drawn, undefined);
  await clickText("Choose");
  await upload(imagePath);
  await clickText("Place on this page");
  await count(1);
  await page.click('button[aria-label="Cancel"]');
  await count(0);
  await tool();
  await clickText("Choose");
  await upload(imagePath);
  await clickText("Place on this page");
  await clickText("Draw");
  await stroke();
  const layouts = [];
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
  for (const mode of ["Draw", "Choose"]) {
    await clickText(mode);
    await page.evaluate(() => {
      const w = window as any;
      for (const o of w.airRead.doc.objects)
        if (o.kind === "signature") w.airActions.removeObject(o.id);
    });
    await settle();
    await clickText("Place on this page");
    await count(1);
    for (const [width, height] of sizes)
      for (const theme of ["light", "dark"]) {
        await page.setViewport({ width, height });
        await cdp.send("Emulation.setTouchEmulationEnabled", {
          enabled: width < 1100,
          maxTouchPoints: 5,
        });
        await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
        await settle();
        // Tool panel remains scrollable; show its source and the edited page together.
        await page.$eval(".pdf-signature-panel", (e) => e.scrollIntoView({ block: "start" }));
        await settle();
        const metrics = await page.evaluate(() => {
          const p = document.querySelector(".pdf-signature-panel")!;
          const narrow = matchMedia("(pointer:coarse)").matches;
          const bad = Array.from(p.querySelectorAll('button,input[role="switch"]'))
            .filter((e) => {
              const r = e.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && r.height < (narrow ? 43 : 35);
            })
            .map((e) => e.getAttribute("aria-label") ?? e.textContent);
          return { overflow: document.documentElement.scrollWidth > innerWidth + 1, bad };
        });
        assert.equal(metrics.overflow, false);
        assert.deepEqual(metrics.bad, []);
        const file = `signature-${mode.toLowerCase()}-${width}x${height}-${theme}.png`;
        await page.screenshot({ path: join(output, file) });
        layouts.push({ mode, width, height, theme, ...metrics, file });
      }
    for (const width of [320, 768, 1440])
      for (const theme of ["light", "dark"]) {
        await page.setViewport({ width, height: 900 });
        await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
        await page.evaluate(() => (document.documentElement.style.fontSize = "32px"));
        await settle();
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
          false,
        );
        await page.screenshot({
          path: join(output, `signature-${mode.toLowerCase()}-text200-${width}-${theme}.png`),
        });
      }
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
  }
  await page.setViewport({ width: 844, height: 390 });
  await settle();
  await page.click('button[aria-label="Expand controls"]');
  await clickText("Draw");
  await settle();
  await page.$eval(".pdf-signature-panel", (e) => e.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: join(output, "signature-landscape-expanded.png") });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  await settle();
  await page.screenshot({ path: join(output, "signature-forced-colors.png") });
  assert.deepEqual(errors, []);
  await writeFile(
    join(output, "signature-results.json"),
    JSON.stringify({ layouts, pixels, outputContent, errors }, null, 2),
  );
  console.log(
    "Signature: drawing persistence/cancel, upload retry/alpha, keyboard placement, mixed-page copies, PDF output/catalog/text, Undo, mobile failure/wait/retry/Cancel and 44 layouts + 12 enlarged-text cases passed.",
  );
} catch (error) {
  console.error(
    await page.evaluate(() => ({
      tool: (window as any).airTool,
      busy: (window as any).airRead?.busyLabel,
      text: document.querySelector(".pdf-signature-panel")?.textContent,
      errors: (window as any).airRead?.error,
    })),
  );
  await page.screenshot({ path: join(output, "signature-failure.png") });
  throw error;
} finally {
  await browser.close();
}
