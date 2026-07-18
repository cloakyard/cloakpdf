/**
 * Capture the real CloakPDF landing page as the Open Graph card.
 *
 * The script starts a dedicated Vite+ dev server unless OG_URL is supplied,
 * loads the production UI in Chrome at the canonical 1200x630 card size, and
 * writes the exact viewport to public/icons/og-image.png.
 *
 * Usage:
 *   pnpm generate-og
 *   OG_URL=http://127.0.0.1:5173 pnpm generate-og
 */

import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = resolve(SCRIPT_DIR, "..");
const OUT_PATH = resolve(PROJECT_DIR, "public", "icons", "og-image.png");
const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CHROME_PATH = process.env.CHROME_PATH || DEFAULT_CHROME;
const CAPTURE_URL = process.env.OG_URL || "http://127.0.0.1:4179/";
const ownsServer = !process.env.OG_URL;

if (!existsSync(CHROME_PATH)) {
  console.error(`Chrome not found at ${CHROME_PATH}.`);
  console.error("Set CHROME_PATH=/absolute/path/to/chrome and re-run.");
  process.exit(1);
}

/** Wait until the target responds so the screenshot never races Vite startup. */
async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "no response";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error(`CloakPDF did not become ready at ${url}: ${lastError}`);
}

let devServer = null;
let serverLog = "";

if (ownsServer) {
  devServer = spawn(
    "pnpm",
    ["exec", "vp", "dev", "--host", "127.0.0.1", "--port", "4179", "--strictPort"],
    {
      cwd: PROJECT_DIR,
      stdio: ["ignore", "pipe", "pipe"],
      // Give the package-manager wrapper and its Vite child one process group.
      // Killing only the wrapper leaves Vite orphaned and the port occupied.
      detached: process.platform !== "win32",
    },
  );
  const collect = (chunk) => {
    serverLog = `${serverLog}${chunk.toString()}`.slice(-8_000);
  };
  devServer.stdout?.on("data", collect);
  devServer.stderr?.on("data", collect);
}

/** Stop the package-manager wrapper and every dev-server child it spawned. */
function stopDevServer(child) {
  if (!child?.pid) return;
  try {
    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });
      killer.unref();
    } else {
      process.kill(-child.pid, "SIGTERM");
    }
  } catch (error) {
    // ESRCH means the server already exited (for example, a strict-port error).
    if (!(error instanceof Error && "code" in error && error.code === "ESRCH")) throw error;
  }
}

let browser = null;
try {
  await waitForServer(CAPTURE_URL);
  browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  page.on("pageerror", (error) => console.error(`[page error] ${error.message}`));
  page.on("requestfailed", (request) =>
    console.error(
      `[request failed] ${request.url()} — ${request.failure()?.errorText ?? "unknown"}`,
    ),
  );
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: "light" },
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("cloakpdf-theme", "light");
    } catch {
      // A blocked storage API is harmless; the light media preference still applies.
    }
  });

  await page.goto(CAPTURE_URL, { waitUntil: "networkidle0" });
  await page.waitForFunction(
    () => document.querySelector("h1")?.textContent?.includes("A complete PDF workbench"),
    { timeout: 15_000 },
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    const style = document.createElement("style");
    style.textContent =
      "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";
    document.head.append(style);
    window.scrollTo(0, 0);
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  });

  await page.screenshot({
    path: OUT_PATH,
    type: "png",
    captureBeyondViewport: false,
    omitBackground: false,
  });
  console.log(`Wrote ${OUT_PATH} from ${CAPTURE_URL} (1200x630).`);
} catch (error) {
  if (serverLog.trim()) console.error(`Vite+ output:\n${serverLog.trim()}`);
  throw error;
} finally {
  try {
    await browser?.close();
  } finally {
    // Browser teardown can itself fail after a renderer crash; the capture
    // server must still be reaped on that error path.
    stopDevServer(devServer);
  }
}
