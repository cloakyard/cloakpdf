/**
 * Regression smoke for the Compress tool (compressPdf in src/utils/pdf/transform.ts).
 *
 * Guards the two bugs fixed in this area:
 *   1. The render-scale axis was inverted — "high / smallest file" rendered at
 *      2× (4× the pixels of "low"), so it routinely produced a LARGER + slower
 *      result than "low". Corrected so more compression = lower render scale.
 *      Assert: high <= medium <= low in output size for an image-heavy PDF.
 *   2. No size guard — rasterising a text/vector PDF produced a bigger file than
 *      the original and handed it back as "compressed". Now we keep the smaller
 *      of (original, rasterised). Assert: no preset ever exceeds the original.
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

const FIXTURES = ["sample.pdf", "multipage.pdf", "The Complete Generative AI Leader.pdf"];
type Quality = "low" | "medium" | "high";
const QUALITIES: Quality[] = ["low", "medium", "high"];

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}
if (!existsSync(CHROME_PATH)) fail(`Chrome not found at ${CHROME_PATH} (set CHROME_PATH).`);

function kb(n: number): string {
  return `${(n / 1024).toFixed(1)} KB`;
}

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
    page.setDefaultTimeout(60_000);
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e: unknown) => errors.push(String(e instanceof Error ? e.message : e)));

    await page.goto(DEV_URL, { waitUntil: "networkidle2" });

    let allOk = true;
    for (const name of FIXTURES) {
      const path = resolve(import.meta.dirname, "../fixtures", name);
      if (!existsSync(path)) fail(`Fixture not found at ${path}.`);
      const bytes = readFileSync(path);
      const original = bytes.byteLength;

      // Push the bytes into the page and call compressPdf via the dev module
      // graph for each preset.
      const sizes = (await page.evaluate(
        async (b64: string, fileName: string, qualities: Quality[]) => {
          const bin = atob(b64);
          const u8 = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          // Specifier kept in a variable so tsc doesn't try to resolve this
          // browser-only dev-server URL; Vite serves it from the module graph.
          const spec = "/src/utils/pdf-operations.ts";
          const mod = await import(/* @vite-ignore */ spec);
          const out: Record<string, number> = {};
          for (const q of qualities) {
            const file = new File([u8], fileName, { type: "application/pdf" });
            const result = await mod.compressPdf(file, q);
            out[q] = result.byteLength;
          }
          return out;
        },
        bytes.toString("base64"),
        name,
        QUALITIES,
      )) as Record<Quality, number>;

      console.log(`\n${name}  (original ${kb(original)})`);
      for (const q of QUALITIES) {
        const pct = (((original - sizes[q]) / original) * 100).toFixed(1);
        console.log(`  ${q.padEnd(7)} → ${kb(sizes[q]).padStart(11)}  (${pct}% smaller)`);
      }

      // Assertion 1: size guard — no preset may exceed the original.
      for (const q of QUALITIES) {
        if (sizes[q] > original) {
          console.error(
            `  ✗ ${q} (${kb(sizes[q])}) exceeds original (${kb(original)}) — guard failed`,
          );
          allOk = false;
        }
      }
      // Assertion 2: scale axis correct — more compression never weighs more.
      // (Equality is allowed: the guard can return the original for both.)
      if (sizes.high > sizes.low) {
        console.error(
          `  ✗ high (${kb(sizes.high)}) > low (${kb(sizes.low)}) — axis still inverted`,
        );
        allOk = false;
      }
      if (sizes.medium > sizes.low) {
        console.error(`  ✗ medium (${kb(sizes.medium)}) > low (${kb(sizes.low)}) — axis inverted`);
        allOk = false;
      }
    }

    if (errors.length > 0) {
      console.error("\n✗ Console/page errors during compress smoke:");
      for (const e of errors) console.error(`   ${e}`);
      process.exit(1);
    }
    if (!allOk) fail("Compress smoke failed — see assertions above.");
    console.log("\n✓ Compress smoke passed — size guard holds, scale axis correct.");
  } catch (e) {
    console.error(`✗ Compress smoke failed: ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
void main();
