/** Development-server integration: PDF.js is the independent geometry/render oracle. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  PDFDocument,
  PDFName,
  PDFNumber,
  StandardFonts,
  degrees,
  rgb,
  concatTransformationMatrix,
} from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";

const output = process.env.AIR_EVIDENCE_DIR ?? "/tmp/cloakpdf-air-geometry";
await mkdir(output, { recursive: true });
const fixture = await PDFDocument.create();
const sourceFont = await fixture.embedFont(StandardFonts.Helvetica);
for (const unit of [1, 2])
  for (const rotation of [0, 90, 180, 270]) {
    const quarter = rotation % 180 !== 0;
    const w = (quarter ? 300 : 400) / unit,
      h = (quarter ? 400 : 300) / unit;
    const p = fixture.addPage([w + 100, h + 140]);
    p.setCropBox(50, 70, w, h);
    p.setRotation(degrees(rotation));
    p.drawText("Source ink", {
      x: 90,
      y: 100,
      size: 12 / unit,
      font: sourceFont,
      color: rgb(0, 0, 1),
    });
    p.node.set(PDFName.of("UserUnit"), PDFNumber.of(unit));
    p.drawRectangle({ x: 60, y: 80, width: 12, height: 20, color: rgb(0, 0, 1) });
    // A source stream may leave a transformed graphics state behind. New overlays
    // must not inherit it, and must preserve the source blue pixels exactly.
    p.pushOperators(concatTransformationMatrix(2, 0, 0, 2, 17, 23));
  }
const intersect = fixture.addPage([400, 300]);
intersect.setMediaBox(-50, -30, 400, 300);
intersect.setCropBox(-100, -80, 500, 400);
const disjoint = fixture.addPage([400, 300]);
disjoint.setCropBox(1000, 1000, 100, 100);
const reversed = fixture.addPage([500, 440]);
reversed.node.set(PDFName.of("CropBox"), fixture.context.obj([450, 370, 50, 70]));
const negative = fixture.addPage([400, 500]);
negative.setCropBox(50, 70, 300, 400);
negative.setRotation(degrees(-90));
const file = join(output, "Rotated and cropped pages.pdf");
const fixtureBytes = await fixture.save();
await writeFile(file, fixtureBytes);
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage();
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.setBypassServiceWorker(true);
try {
  await page.goto(process.env.E2E_URL ?? "http://127.0.0.1:8122", { waitUntil: "networkidle2" });
  const result = await page.evaluate(async (input) => {
    const module = async (path: string) => import(path);
    const ops = await module("/src/utils/pdf-operations.ts");
    const { getPdfJs } = await module("/src/utils/pdf/raster.ts");
    const { createDocFromFile, flattenDestructiveObjects, revokeThumbnails } =
      await module("/src/editor/doc.ts");
    const { cropDoc } = await module("/src/editor/crop.ts");
    const { extractTextGeometry } = await module("/src/utils/layout-extract.ts");
    const { cropPagesIndividual } = await module("/src/utils/pdf/transform.ts");
    const pdfjs = await getPdfJs();
    const asFile = (b: Uint8Array) =>
      new File([b.slice()], "geometry.pdf", { type: "application/pdf" });
    const bytes = new Uint8Array(input);
    const source = asFile(bytes);
    const doc = await createDocFromFile(source);
    const check = (ok: boolean, message: string) => {
      if (!ok) throw new Error(message);
    };
    type Render = { width: number; height: number; pixels: Uint8ClampedArray };
    async function render(b: Uint8Array): Promise<Render[]> {
      const task = pdfjs.getDocument({ data: b.slice() });
      const pdf = await task.promise;
      const rows: Render[] = [];
      try {
        for (let i = 1; i <= pdf.numPages; i++) {
          const p = await pdf.getPage(i),
            v = p.getViewport({ scale: 1 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(v.width);
          canvas.height = Math.round(v.height);
          const context = canvas.getContext("2d")!;
          await p.render({ canvasContext: context, canvas, viewport: v }).promise;
          rows.push({
            width: canvas.width,
            height: canvas.height,
            pixels: context.getImageData(0, 0, canvas.width, canvas.height).data,
          });
          p.cleanup();
        }
      } finally {
        await task.destroy();
      }
      return rows;
    }
    const baseline = await render(bytes);
    const textGeometry = await extractTextGeometry(source, { ocr: false });
    for (let i = 0; i < 8; i++)
      check(Math.abs(textGeometry[i].items[0].fontSize - 12) < 0.01, `physical font size ${i}`);
    doc.pages.forEach((p: { widthPt: number; heightPt: number }, i: number) => {
      check(p.widthPt === baseline[i].width && p.heightPt === baseline[i].height, `metadata ${i}`);
      check(p.widthPt === 400 && p.heightPt === 300, `fixture ${i}`);
    });
    const count = doc.pages.length;
    const indices = Array.from({ length: count }, (_, i) => i);
    const color = { r: 220, g: 20, b: 20 };
    const annotations = indices.flatMap((pageIndex) => [
      {
        pageIndex,
        kind: "rect",
        x: 0.1,
        y: 0.15,
        w: 0.15,
        h: 0.12,
        thicknessFrac: 0.003,
        color,
        fill: { color },
      },
      { pageIndex, kind: "ellipse", x: 0.4, y: 0.2, w: 0.1, h: 0.1, thicknessFrac: 0.003, color },
      {
        pageIndex,
        kind: "arrow",
        x1: 0.12,
        y1: 0.45,
        x2: 0.35,
        y2: 0.55,
        thicknessFrac: 0.004,
        color,
      },
      {
        pageIndex,
        kind: "stroke",
        points: [
          { x: 0.6, y: 0.5 },
          { x: 0.7, y: 0.55 },
        ],
        thicknessFrac: 0.003,
        color,
        opacity: 1,
      },
      {
        pageIndex,
        kind: "text",
        x: 0.15,
        y: 0.7,
        w: 0.5,
        h: 0.15,
        sizeFrac: 0.06,
        text: "Visible page",
        color,
      },
    ]);
    const png = document.createElement("canvas");
    png.width = 100;
    png.height = 40;
    const ink = png.getContext("2d")!;
    ink.fillStyle = "#dc1414";
    ink.fillRect(0, 0, 100, 40);
    ink.clearRect(0, 0, 20, 20);
    const positions = indices.map((pageIndex) => ({
      pageIndex,
      x: 80,
      y: 130,
      width: 120,
      height: 80,
    }));
    const operations: [string, () => Promise<Uint8Array>, boolean?][] = [
      ["annotations", () => ops.annotatePdf(source, annotations)],
      [
        "signature",
        () =>
          ops.addSignature(source, png.toDataURL(), indices, {
            x: 60,
            y: 100,
            width: 120,
            height: 48,
          }),
      ],
      [
        "qr",
        () =>
          ops.addCodeStampAt(
            source,
            { type: "qr", content: "https://cloakyard.com", color },
            positions,
          ),
      ],
      [
        "barcode",
        () =>
          ops.addCodeStampAt(
            source,
            { type: "barcode", content: "AIR-123", color, caption: true },
            positions,
          ),
      ],
      [
        "watermark",
        () =>
          ops.addWatermark(source, { text: "AIR", fontSize: 30, opacity: 1, rotation: 27, color }),
      ],
      [
        "seal",
        () =>
          ops.addWatermark(source, {
            text: "AIR",
            fontSize: 18,
            opacity: 1,
            rotation: 27,
            color,
            shape: "rect",
            finish: "digital",
          }),
      ],
      [
        "numbers",
        () =>
          ops.addPageNumbers(source, {
            fontSize: 16,
            color,
            margin: 22,
            position: "top-right",
            firstPage: 1,
            startNumber: 1,
            format: "1",
          }),
      ],
      [
        "headers",
        () =>
          ops.addHeaderFooter(source, {
            fontSize: 14,
            color,
            margin: 22,
            headerLeft: "Left",
            headerCenter: "Center",
            headerRight: "Right",
            footerLeft: "Foot",
            footerCenter: "Center",
            footerRight: "Right",
          }),
      ],
      [
        "bates",
        () =>
          ops.addBatesNumbers(source, {
            fontSize: 14,
            color,
            margin: 22,
            position: "bottom-left",
            startNumber: 1,
            digits: 3,
            prefix: "AIR",
            suffix: "",
          }),
      ],
      [
        "flat-form",
        () =>
          ops.fillFlatFormFields(
            source,
            indices.map((pageIndex) => ({
              pageIndex,
              rect: { xPct: 0.15, yPct: 0.4, wPct: 0.5, hPct: 0.07 },
              text: "Air form",
            })),
          ),
        true,
      ],
    ];
    const metrics: unknown[] = [];
    const red = (r: number, g: number, b: number) => r > 100 && g < r * 0.6 && b < r * 0.6;
    const dark = (r: number, g: number, b: number) => r < 100 && g < 100 && b < 100;
    function mask(row: Render, predicate = red) {
      const selected: number[] = [];
      let left = row.width,
        top = row.height,
        right = 0,
        bottom = 0;
      for (let p = 0; p < row.pixels.length; p += 4)
        if (predicate(row.pixels[p], row.pixels[p + 1], row.pixels[p + 2])) {
          const at = p / 4,
            x = at % row.width,
            y = Math.floor(at / row.width);
          selected.push(at);
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      return { selected: new Set(selected), bounds: [left, top, right, bottom] };
    }
    for (const [name, operation, black] of operations) {
      const rows = await render(await operation());
      const reference = mask(rows[0], black ? dark : red);
      check(reference.selected.size > 15, `${name}: empty output`);
      rows.forEach((row, i) => {
        check(row.width === 400 && row.height === 300, `${name} changed page ${i}`);
        const marks = mask(row, black ? dark : red);
        // Page numbers/Bates have different text; their vertical position remains fixed.
        if (name === "numbers" || name === "bates") {
          check(
            Math.abs(marks.bounds[1] - reference.bounds[1]) <= 2 &&
              Math.abs(marks.bounds[3] - reference.bounds[3]) <= 2,
            `${name} placement ${i}`,
          );
          if (name === "numbers")
            check(Math.abs(marks.bounds[2] - reference.bounds[2]) <= 2, `${name} right edge ${i}`);
          else check(marks.bounds[0] === reference.bounds[0], `${name} left edge ${i}`);
        } else {
          const differences =
            [...marks.selected].filter((v) => !reference.selected.has(v)).length +
            [...reference.selected].filter((v) => !marks.selected.has(v)).length;
          check(
            differences / reference.selected.size < 0.06,
            `${name} pixel mismatch ${i}: ${differences}/${reference.selected.size}`,
          );
        }
        // All source blue pixels outside the overlay retain their original location.
        for (let p = 0; p < row.pixels.length; p += 4) {
          if (
            ((p / 4) % row.width < marks.bounds[0] - 1 ||
              (p / 4) % row.width > marks.bounds[2] + 1 ||
              Math.floor(p / 4 / row.width) < marks.bounds[1] - 1 ||
              Math.floor(p / 4 / row.width) > marks.bounds[3] + 1) &&
            baseline[i].pixels[p + 2] > 240 &&
            baseline[i].pixels[p] < 10 &&
            baseline[i].pixels[p + 1] < 10
          )
            check(row.pixels[p + 2] > 240 && row.pixels[p] < 10, `${name} changed source ${i}`);
        }
      });
      metrics.push({ operation: name, pages: rows.length, referenceBounds: reference.bounds });
    }
    const marked = await ops.annotatePdf(source, annotations);
    const margins = new Map(indices.map((i) => [i, { left: 24, right: 40, top: 30, bottom: 18 }]));
    const cropped = await cropPagesIndividual(asFile(marked), margins);
    check(cropped.croppedCount === count, "crop skips a page");
    const beforeCrop = await render(marked),
      afterCrop = await render(cropped.bytes);
    afterCrop.forEach((row, i) => {
      check(row.width === 336 && row.height === 252, `crop size ${i}`);
      let differences = 0;
      for (let y = 0; y < row.height; y++)
        for (let x = 0; x < row.width; x++) {
          const old = ((y + 30) * 400 + x + 24) * 4,
            next = (y * row.width + x) * 4;
          for (let c = 0; c < 3; c++)
            if (Math.abs(row.pixels[next + c] - beforeCrop[i].pixels[old + c]) > 30) differences++;
        }
      check(differences / row.pixels.length < 0.01, `crop pixels ${i}`);
    });
    // Cropping pending marks must match cropping already exported marks.
    const cropKeep = { xPct: 0.06, yPct: 0.1, wPct: 0.84, hPct: 0.84 };
    const croppedDoc = await cropDoc(
      {
        ...doc,
        objects: annotations.map((a, i) => ({
          id: `mark-${i}`,
          kind: "annotation",
          pageIndex: a.pageIndex,
          payload: a,
        })),
      },
      new Map(indices.map((i) => [i, cropKeep])),
    );
    const remapped = await render(
      await ops.annotatePdf(
        asFile(croppedDoc.bytes),
        croppedDoc.objects.map((o: { payload: unknown }) => o.payload),
      ),
    );
    remapped.forEach((row, i) => {
      const a = mask(row),
        b = mask(afterCrop[i]);
      const delta =
        [...a.selected].filter((p) => !b.selected.has(p)).length +
        [...b.selected].filter((p) => !a.selected.has(p)).length;
      check(delta / b.selected.size < 0.03, `pending crop alignment ${i}`);
    });
    metrics.push({ operation: "crop and pending marks", pages: count });
    // Erase/redact flatten only affected pages. Adding vector text afterwards
    // must stay in the same physical frame even though /Rotate was flattened.
    const regions = indices.map((pageIndex) => ({
      pageIndex,
      xPct: 0.1,
      yPct: 0.15,
      wPct: 0.2,
      hPct: 0.2,
    }));
    const erased = await ops.erasePdf(
      asFile(marked),
      regions.map((r) => ({ ...r, mode: "fill" })),
    );
    const erasedRows = await render(erased);
    erasedRows.forEach((row, i) =>
      check(
        mask(row).selected.size < mask(beforeCrop[i]).selected.size * 0.9,
        `erase removes ink ${i}`,
      ),
    );
    const flattened = await flattenDestructiveObjects({
      ...doc,
      bytes: marked,
      objects: regions.map((rect, i) => ({
        id: `red-${i}`,
        kind: "redaction",
        pageIndex: i,
        rect,
      })),
    });
    const burned = await render(flattened);
    burned.forEach((row, i) => {
      const p = (60 * row.width + 60) * 4;
      check(
        row.width === 400 && row.height === 300 && row.pixels[p] < 40 && row.pixels[p + 2] < 70,
        `redact placement ${i}`,
      );
    });
    const afterFlatten = await render(
      await ops.addSignature(asFile(flattened), png.toDataURL(), indices, {
        x: 260,
        y: 150,
        width: 100,
        height: 40,
      }),
    );
    afterFlatten.forEach((row, i) => {
      const p = (120 * 400 + 300) * 4;
      check(
        red(row.pixels[p], row.pixels[p + 1], row.pixels[p + 2]),
        `post-flatten placement ${i}`,
      );
    });
    metrics.push({ operation: "erase/redact then vector placement", pages: count });
    revokeThumbnails(doc.pages.map((p: { thumbUrl: string }) => p.thumbUrl));
    return { pages: count, metrics };
  }, Array.from(fixtureBytes));
  console.log(JSON.stringify(result, null, 2));
  await writeFile(join(output, "outputs.json"), JSON.stringify(result, null, 2));
  await (await page.$('input[type="file"]'))!.uploadFile(file);
  await page.waitForSelector('.editor-paper[role="region"]');
  await page
    .waitForSelector('[aria-label="Dismiss cache status"]', { timeout: 10000 })
    .then(() => page.click('[aria-label="Dismiss cache status"]'))
    .catch(() => {});
  const layouts: unknown[] = [];
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [768, 1024],
      [1024, 768],
      [1280, 720],
      [1440, 900],
    ]) {
      await page.setViewport({ width, height });
      for (let index = 0; index < 4; index++) {
        await page.focus('.editor-paper[role="region"]');
        if (index) await page.click('[aria-label="Next page"]');
        await page.waitForFunction(
          (number) => {
            const paper = document.querySelector<HTMLElement>('.editor-paper[role="region"]'),
              img = paper?.querySelector("img");
            return (
              img?.alt === `Page ${number}` &&
              img.complete &&
              img.naturalWidth > 0 &&
              paper &&
              Math.abs(
                paper.clientWidth / paper.clientHeight - img.naturalWidth / img.naturalHeight,
              ) < 0.01
            );
          },
          {},
          index + 1,
        );
        const metrics = await page.$eval('.editor-paper[role="region"]', (paper) => {
          const p = paper.getBoundingClientRect(),
            outer = document.querySelector(".editor-canvas")!.getBoundingClientRect();
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            fits:
              p.left >= outer.left &&
              p.top >= outer.top &&
              p.right <= outer.right &&
              p.bottom <= outer.bottom,
            ratio: p.width / p.height,
          };
        });
        assert.equal(metrics.overflow, false);
        assert.equal(metrics.fits, true);
        assert.ok(Math.abs(metrics.ratio - 4 / 3) < 0.01);
        layouts.push({ theme, width, height, page: index + 1, ...metrics });
      }
      if (width === 1440 || width === 390)
        await page.screenshot({ path: join(output, `${width}-${theme}.png`) });
      for (let i = 0; i < 3; i++) await page.click('[aria-label="Previous page"]');
    }
  }
  assert.deepEqual(errors, []);
  await writeFile(join(output, "layouts.json"), JSON.stringify(layouts, null, 2));
  console.log(`PASS ${layouts.length} responsive rotated-page layouts; no page errors.`);
} finally {
  await browser.close();
}
