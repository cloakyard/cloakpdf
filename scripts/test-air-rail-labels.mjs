/** Whole-word rail labels with real scroll gutters, touch targets and enlarged text. */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument } from "@pdfme/pdf-lib";
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const out =
  process.env.AIR_EVIDENCE_DIR || (await mkdtemp(join(tmpdir(), "cloakpdf-rail-labels-")));
await mkdir(out, { recursive: true });
const pdf = await PDFDocument.create();
pdf.addPage([595, 842]);
const buffer = Buffer.from(await pdf.save());
const sizes = [
  [320, 568],
  [390, 844],
  [844, 390],
  [767, 1024],
  [768, 1024],
  [820, 1180],
  [1023, 768],
  [1024, 768],
  [1025, 768],
  [1180, 820],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
];
const rows = [],
  errors = [];
for (const engine of ["chromium", "webkit"]) {
  const browser = await (engine === "webkit"
    ? webkit.launch()
    : chromium.launch({
        executablePath:
          process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        ignoreDefaultArgs: ["--hide-scrollbars"],
      }));
  try {
    for (const theme of ["light", "dark"]) {
      const p = await browser.newPage({
        viewport: { width: 1440, height: 900 },
        hasTouch: true,
        colorScheme: theme,
        reducedMotion: "reduce",
        serviceWorkers: "block",
      });
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(process.env.BASE_URL || "http://127.0.0.1:8721");
      await p
        .locator("input[type=file]")
        .first()
        .setInputFiles({ name: "Rail study.pdf", mimeType: "application/pdf", buffer });
      await p.locator('img[alt="Page 1"]').waitFor();
      for (const [width, height] of sizes)
        for (const font of [16, 32]) {
          await p.setViewportSize({ width, height });
          await p.evaluate((f) => (document.documentElement.style.fontSize = `${f}px`), font);
          await p.evaluate(async () => {
            await document.fonts.ready;
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          });
          const row = await p.evaluate(() => {
            const rail = document.querySelector(".editor-toolrail");
            if (!rail) return { rail: false, issues: [] };
            const issues = [];
            for (const button of rail.querySelectorAll("button")) {
              const r = button.getBoundingClientRect(),
                span = button.querySelector("span");
              if (r.width < 44 || r.height < 44)
                issues.push({
                  kind: "target",
                  name: button.ariaLabel,
                  width: r.width,
                  height: r.height,
                });
              if (!span?.firstChild) continue;
              const text = span.firstChild;
              for (const match of text.textContent.matchAll(/[\p{L}\p{N}]+/gu)) {
                const range = document.createRange();
                range.setStart(text, match.index);
                range.setEnd(text, match.index + match[0].length);
                if (range.getClientRects().length > 1)
                  issues.push({ kind: "split-word", name: button.ariaLabel, word: match[0] });
                const bounds = range.getBoundingClientRect();
                if (bounds.left < r.left - 1 || bounds.right > r.right + 1)
                  issues.push({ kind: "clipped-word", name: button.ariaLabel, word: match[0] });
              }
            }
            return {
              rail: true,
              issues,
              overflow: document.documentElement.scrollWidth > innerWidth + 1,
            };
          });
          rows.push({ engine, theme, width, height, font, ...row });
          if ([768, 1024, 1280, 1440].includes(width) && font === 16)
            await p.screenshot({ path: `${out}/${engine}-${width}-${theme}.png` });
        }
      await p.setViewportSize({ width: 768, height: 1024 });
      await p.evaluate(() => (document.documentElement.style.fontSize = "16px"));
      for (const name of ["Signature", "Bookmarks"]) {
        await p
          .getByRole("navigation", { name: "Editor tools" })
          .getByRole("button", { name, exact: true })
          .click();
        await p.getByRole("heading", { name, exact: true }).waitFor();
      }
      await p.close();
    }
  } finally {
    await browser.close();
  }
}
await writeFile(`${out}/results.json`, JSON.stringify({ rows, errors }, null, 2) + "\n");
assert.deepEqual(errors, []);
assert.deepEqual(
  rows.filter((r) => r.issues.length || r.overflow),
  [],
);
console.log(`${rows.length} rail/layout observations passed`);
