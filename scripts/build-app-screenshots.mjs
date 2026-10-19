/** Capture the real editor with a synthetic PDF. Run against a local production preview. */
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "@pdfme/pdf-lib";
import { launch } from "puppeteer-core";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "public/screenshots");
const url = process.env.SCREENSHOT_URL ?? "http://127.0.0.1:4173/";
const temporary = await mkdtemp(resolve(tmpdir(), "cloakpdf-previews-"));
const fixture = resolve(temporary, "Studio notes.pdf");
await mkdir(output, { recursive: true });

// Author content is real PDF text/vector artwork, never a simulated editor canvas.
const pdf = await PDFDocument.create();
pdf.setTitle("Studio notes");
pdf.setCreationDate(new Date("2026-01-01T00:00:00Z"));
pdf.setModificationDate(new Date("2026-01-01T00:00:00Z"));
const font = await pdf.embedFont(StandardFonts.Helvetica);
const ink = rgb(0.13, 0.15, 0.18);
const muted = rgb(0.33, 0.36, 0.41);
for (const [index, title] of [
  "A little room\nto think.",
  "Ideas to explore.",
  "Next steps.",
].entries()) {
  const page = pdf.addPage([595, 842]);
  const text = (value, x, y, size, color = ink) =>
    page.drawText(value, { x, y, size, color, font, lineHeight: size * 1.15 });
  text("Studio notes", 52, 780, 12, muted);
  text(title, 52, 690, 44);
  page.drawRectangle({ x: 52, y: 430, width: 355, height: 100, color: rgb(0.94, 0.95, 0.97) });
  page.drawRectangle({ x: 142, y: 405, width: 355, height: 100, color: rgb(0.87, 0.91, 0.99) });
  text("Make space for what matters.", 52, 345, 18);
  text(
    "Gather your ideas. Keep the useful details.\nLeave a little room for something unexpected.",
    52,
    310,
    12,
    muted,
  );
  text("A simple plan", 52, 225, 18);
  text(
    "01   Collect the notes\n02   Shape the story\n03   Share the finished work",
    52,
    190,
    12,
    muted,
  );
  page.drawLine({
    start: { x: 52, y: 78 },
    end: { x: 543, y: 78 },
    thickness: 0.5,
    color: rgb(0.88, 0.9, 0.92),
  });
  text("Synthetic example / CloakPDF", 52, 54, 10, muted);
  text(String(index + 1).padStart(2, "0"), 528, 54, 10, muted);
}
await writeFile(fixture, await pdf.save());

let browser;
try {
  browser = await launch({
    executablePath:
      process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  for (const theme of ["light", "dark"]) {
    for (const [name, width, height, scale, touch] of [
      ["wide", 1440, 900, 1, false],
      ["narrow", 390, 844, 2, true],
    ]) {
      // A new context prevents saved-session prompts without touching user storage.
      const context = await browser.createBrowserContext();
      try {
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(String(error)));
        await page.setBypassServiceWorker(true);
        await page.setViewport({
          width,
          height,
          deviceScaleFactor: scale,
          isMobile: touch,
          hasTouch: touch,
        });
        await page.emulateMediaFeatures([
          { name: "prefers-color-scheme", value: theme },
          { name: "prefers-reduced-motion", value: "reduce" },
        ]);
        await page.goto(url, { waitUntil: "networkidle0" });
        await (await page.waitForSelector('input[type="file"]')).uploadFile(fixture);
        await page.waitForSelector('img[alt="Page 1"]');
        const notice = await page.$(
          '.pdf-toast button[aria-label="Dismiss cache status"], .pdf-toast-actions > button:first-child',
        );
        if (notice) await notice.click();
        if (touch) {
          await page.locator('[aria-label="Open tools"]').click();
          await page.waitForSelector(".editor-mobile-tool-list", { visible: true });
        }
        await page
          .locator(
            `${touch ? ".editor-mobile-tool-list" : ".editor-toolrail"} button[aria-label="Annotate"]`,
          )
          .click();
        await page.waitForFunction(() =>
          [...document.querySelectorAll("h2")].some((n) => n.textContent === "Annotate"),
        );
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all([...document.images].map((img) => img.decode()));
          document.activeElement?.blur();
          await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
        });
        await page.mouse.move(0, 0);
        assert.deepEqual(errors, []);
        const path = resolve(output, `editor-${name}-${theme}.png`);
        await page.screenshot({ path, captureBeyondViewport: false });
        console.log(`${path}: ${width * scale}x${height * scale}, ${theme}, real Annotate editor`);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser?.close();
  await rm(temporary, { recursive: true, force: true });
}
