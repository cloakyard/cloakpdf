/**
 * Regression smoke for the smart Compress tool (compressPdf in
 * src/utils/pdf/transform.ts).
 *
 * compressPdf picks the best strategy per page by measured bytes: light
 * text/vector pages are copied through losslessly (selectable text preserved,
 * ~15-25% structural shrink), while heavy pages (scans, photo pages, Type3 /
 * vector-dense pages) are rasterised to a JPEG and kept only when that's
 * actually smaller. A final guard returns the original if nothing shrank.
 *
 * This guards:
 *   1. Size guard — no preset ever yields a file larger than the original.
 *   2. Monotonicity — higher compression never weighs more than lower.
 *   3. Text preservation — text-dominant PDFs keep (nearly) all their
 *      selectable text AND still shrink (the lossless structural win), instead
 *      of being rasterised to image-only as the old whole-doc rasteriser did.
 *   4. Image win — an image/Type3-heavy PDF compresses substantially at high.
 *
 * Calls compressPdf directly through the Vite dev module graph (real browser
 * canvas + PDF.js), rather than driving the editor UI.
 *
 * Requirements: Chrome at CHROME_PATH and the dev server at localhost:5173
 * (`vp dev`). Fixtures: tests/fixtures/*.pdf.
 *
 * Run:  node --experimental-strip-types tests/e2e/compress.e2e.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { launch } from "puppeteer-core";

const DEV_URL = process.env.E2E_URL ?? "http://localhost:5173";
const CHROME_PATH =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const USER_DATA_DIR = resolve(import.meta.dirname, "../.puppeteer-profile-editor");

type Quality = "low" | "medium" | "high";
const QUALITIES: Quality[] = ["low", "medium", "high"];

// `textDominant`: text-heavy PDFs that must stay selectable and still shrink.
// `imageWin`: heavy (Type3-font) PDF where rasterising should win big at high.
const FIXTURES: { name: string; textDominant: boolean; imageWin: boolean }[] = [
  { name: "multipage.pdf", textDominant: true, imageWin: false },
  { name: "The Complete Generative AI Leader.pdf", textDominant: true, imageWin: false },
  { name: "sample.pdf", textDominant: false, imageWin: true },
];

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}
if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH} (set CHROME_PATH).`);

function kb(n: number): string {
  return `${(n / 1024).toFixed(1)} KB`;
}

type Result = { size: number; textLen: number };

async function main() {
  const browser = await launch({
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  const errors: string[] = [];
  try {
    page.setDefaultTimeout(90_000);
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e: unknown) => errors.push(String(e instanceof Error ? e.message : e)));

    await page.goto(DEV_URL, { waitUntil: "networkidle2" });

    let allOk = true;
    for (const fx of FIXTURES) {
      const path = resolve(import.meta.dirname, "../fixtures", fx.name);
      if (!existsSync(path)) fail(`Fixture not found at ${path}.`);
      const bytes = readFileSync(path);
      const original = bytes.byteLength;

      // In the page: compress at each preset and measure output size + the
      // total selectable-text length of the compressed result (via PDF.js).
      const { origTextLen, results } = (await page.evaluate(
        async (b64: string, fileName: string, qualities: Quality[]) => {
          const bin = atob(b64);
          const u8 = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);

          const opsSpec = "/src/utils/pdf-operations.ts";
          const rasterSpec = "/src/utils/pdf/raster.ts";
          const ops = await import(/* @vite-ignore */ opsSpec);
          const { getPdfJs } = await import(/* @vite-ignore */ rasterSpec);
          const pdfjsLib = await getPdfJs();

          const textLenOf = async (data: Uint8Array): Promise<number> => {
            const task = pdfjsLib.getDocument({ data: data.slice(0) });
            const doc = await task.promise;
            let len = 0;
            for (let i = 1; i <= doc.numPages; i++) {
              const tc = await (await doc.getPage(i)).getTextContent();
              for (const it of tc.items) if ("str" in it) len += it.str.length;
            }
            await task.destroy();
            return len;
          };

          const origTextLen = await textLenOf(u8);
          const results: Record<string, { size: number; textLen: number }> = {};
          for (const q of qualities) {
            const file = new File([u8], fileName, { type: "application/pdf" });
            const out = await ops.compressPdf(file, q);
            results[q] = { size: out.byteLength, textLen: await textLenOf(out) };
          }
          return { origTextLen, results };
        },
        bytes.toString("base64"),
        fx.name,
        QUALITIES,
      )) as { origTextLen: number; results: Record<Quality, Result> };

      console.log(`\n${fx.name}  (original ${kb(original)}, ${origTextLen} chars)`);
      for (const q of QUALITIES) {
        const r = results[q];
        const pct = (((original - r.size) / original) * 100).toFixed(1);
        const txt = origTextLen ? ((100 * r.textLen) / origTextLen).toFixed(0) : "—";
        console.log(
          `  ${q.padEnd(7)} → ${kb(r.size).padStart(11)}  (${pct}% smaller, text ${txt}%)`,
        );
      }

      // 1. Size guard — no preset may exceed the original.
      for (const q of QUALITIES) {
        if (results[q].size > original) {
          console.error(`  ✗ ${q} (${kb(results[q].size)}) exceeds original — guard failed`);
          allOk = false;
        }
      }
      // 2. Monotonicity — more compression never weighs more.
      if (results.high.size > results.low.size) {
        console.error(`  ✗ high > low — axis inverted`);
        allOk = false;
      }
      if (results.medium.size > results.low.size) {
        console.error(`  ✗ medium > low — axis inverted`);
        allOk = false;
      }
      // 3. Text-dominant PDFs must stay (nearly) fully selectable AND shrink.
      if (fx.textDominant) {
        for (const q of QUALITIES) {
          if (results[q].textLen < origTextLen * 0.95) {
            console.error(
              `  ✗ ${q} kept only ${results[q].textLen}/${origTextLen} chars — text not preserved`,
            );
            allOk = false;
          }
        }
        if (results.medium.size >= original) {
          console.error(`  ✗ text PDF did not shrink at medium (lossless win missing)`);
          allOk = false;
        }
      }
      // 4. Image/Type3-heavy PDFs should compress substantially at high.
      if (fx.imageWin && results.high.size > original * 0.6) {
        console.error(`  ✗ image-heavy PDF only reached ${kb(results.high.size)} at high`);
        allOk = false;
      }
    }

    if (errors.length > 0) {
      console.error("\n✗ Console/page errors during compress smoke:");
      for (const e of errors) console.error(`   ${e}`);
      process.exit(1);
    }
    if (!allOk) fail("Compress smoke failed — see assertions above.");
    console.log("\n✓ Compress smoke passed — guard holds, text preserved, images crushed.");
  } catch (e) {
    console.error(`✗ Compress smoke failed: ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
void main();
