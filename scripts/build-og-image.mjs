/** Render the Air social composition from local CSS, mark and real editor capture. */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { launch } from "puppeteer-core";

const root = resolve(import.meta.dirname, "..");
const browser = await launch({
  executablePath:
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 1 },
});
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(resolve(root, "artwork/og.html")).href, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => img.decode()));
  });
  const path = resolve(root, "public/icons/og-image.png");
  await page.screenshot({ path, captureBeyondViewport: false });
  console.log(`Wrote ${path} (1200x630).`);
} finally {
  await browser.close();
}
