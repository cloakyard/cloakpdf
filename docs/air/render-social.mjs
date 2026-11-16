/** Render the shared Air card from a product's built, static landing artwork. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const bundle = dirname(fileURLToPath(import.meta.url));
const root = resolve(bundle, "../..");
const config = JSON.parse(await readFile(resolve(root, process.argv[2] || "artwork/social.json")));
const dist = resolve(root, config.dist);
await stat(resolve(dist, "index.html")).catch(() => {
  throw new Error("Build this website before generating its social image.");
});
const { default: puppeteer } = await import(process.env.PUPPETEER_MODULE || "puppeteer-core");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".json": "application/json",
};
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const file = resolve(
      dist,
      `.${decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)}`,
    );
    if (!file.startsWith(dist + sep)) throw new Error("Outside build");
    const bytes = await readFile(file);
    response.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    response.end(bytes);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((ready) => server.listen(0, "127.0.0.1", ready));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await puppeteer.launch({
    executablePath:
      process.env.CHROME_PATH ||
      process.env.CHROME_BIN ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--disable-gpu"],
    defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 2 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setBypassServiceWorker(true);
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().startsWith(origin + "/") || /^(data:|blob:|about:)/.test(request.url()))
      request.continue();
    else {
      errors.push(`Unexpected network request: ${request.url()}`);
      request.abort();
    }
  });
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: "light" },
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.goto(origin, { waitUntil: "networkidle0" });
  await page.waitForSelector(config.artwork);
  await page.evaluate(() => document.fonts.ready);
  const clip = await page.evaluate((selector) => {
    const boxes = [...document.querySelectorAll(selector)].map((element) =>
      element.getBoundingClientRect(),
    );
    if (!boxes.length || boxes.some((box) => !box.width || !box.height))
      throw new Error("Artwork has no bounds");
    const x = Math.floor(Math.min(...boxes.map((box) => box.left)) + scrollX - 16);
    const y = Math.floor(Math.min(...boxes.map((box) => box.top)) + scrollY - 16);
    return {
      x,
      y,
      width: Math.ceil(Math.max(...boxes.map((box) => box.right)) + scrollX + 16 - x),
      height: Math.ceil(Math.max(...boxes.map((box) => box.bottom)) + scrollY + 16 - y),
    };
  }, config.artwork);
  const artwork = Buffer.from(await page.screenshot({ clip, captureBeyondViewport: true }));
  const manifest = JSON.parse(await readFile(resolve(bundle, "bundle.json")));
  const stylesheet = await readFile(resolve(root, manifest.stylesheet), "utf8");
  const logo = await readFile(resolve(root, config.logo));
  const escape = (text) =>
    String(text).replace(
      /[&<>"']/g,
      (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
    );
  const values = {
    NAME: escape(config.name),
    HOST: escape(new URL(config.url).hostname),
    TITLE: escape(config.headline[0]),
    SUBTITLE: escape(config.headline[1]),
    DESCRIPTION: config.description.map(escape).join("<br />"),
    ART_ALT: escape(config.artAlt),
    AIR_CSS: stylesheet,
    LOGO: `data:image/svg+xml;base64,${logo.toString("base64")}`,
    ARTWORK: `data:image/png;base64,${artwork.toString("base64")}`,
  };
  const html = (await readFile(resolve(bundle, "social.html"), "utf8")).replace(
    /__([A-Z_]+)__/g,
    (_, key) => {
      assert(key in values, `Unknown template value ${key}`);
      return values[key];
    },
  );
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  const layout = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll("header, h1, p, .artwork, footer")];
    return nodes.map((node) => {
      const { x, y, width, height } = node.getBoundingClientRect();
      return {
        element: node.tagName,
        x,
        y,
        width,
        height,
        overflow: node.scrollWidth > node.clientWidth + 1,
      };
    });
  });
  assert(
    layout.every(
      (box) =>
        box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width <= 1200 &&
        box.y + box.height <= 630 &&
        !box.overflow,
    ),
    "Social card content overflows",
  );
  assert.deepEqual(errors, []);
  const output = resolve(root, process.env.AIR_SOCIAL_OUTPUT || config.output);
  await mkdir(dirname(output), { recursive: true });
  await page.screenshot({ path: output, captureBeyondViewport: false });
  if (process.env.AIR_SOCIAL_EVIDENCE) {
    await writeFile(
      resolve(process.env.AIR_SOCIAL_EVIDENCE),
      JSON.stringify(
        { name: config.name, size: [1200, 630], artwork: config.artwork, clip, layout, errors },
        null,
        2,
      ) + "\n",
    );
  }
  console.log(`Rendered ${config.name}: ${output} (1200×630).`);
} finally {
  if (browser) await browser.close();
  server.closeAllConnections();
  await new Promise((done) => server.close(done));
}
