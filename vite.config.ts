import { readFileSync, readdirSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { defaultClientConditions, defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

declare const process: { env: Record<string, string | undefined> };

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as {
  version: string;
};
// Keep the standalone recovery footer on the same version as the application.
process.env.VITE_APP_VERSION = pkg.version;
const appBasePath = process.env.VITE_APP_BASE_PATH || "/";

// pdfjs-dist v6 fetches WASM image decoders (jbig2 / openjpeg / qcms, plus JS
// fallbacks and the quickjs scripting runtime) on demand to decode CCITT-fax,
// JBIG2, JPEG2000 and ICC-colour images. Without them, such images — common in
// scanned documents — render as black boxes. They live in node_modules, so we
// serve them at /pdfjs-wasm/ in dev and copy them into the build output; the
// matching `wasmUrl` getDocument option lives in src/utils/pdfjs-config.ts.
const pdfjsWasmDir = fileURLToPath(new URL("./node_modules/pdfjs-dist/wasm/", import.meta.url));
const pdfjsWasmFiles = readdirSync(pdfjsWasmDir).filter((f) => /\.(wasm|js)$/.test(f));

function pdfjsWasmAssets() {
  return {
    name: "pdfjs-wasm-assets",
    // Dev: stream the decoder files straight from node_modules.
    configureServer(server: { middlewares: { use: (fn: unknown) => void } }) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const path = (req.url ?? "").split("?")[0];
        const prefix = "/pdfjs-wasm/";
        if (!path.startsWith(prefix)) return next();
        const name = path.slice(prefix.length);
        if (!pdfjsWasmFiles.includes(name)) return next();
        res.setHeader(
          "Content-Type",
          name.endsWith(".wasm") ? "application/wasm" : "text/javascript",
        );
        res.end(readFileSync(pdfjsWasmDir + name));
      });
    },
    // Build: emit them as static assets under dist/pdfjs-wasm/.
    generateBundle() {
      for (const name of pdfjsWasmFiles) {
        // @ts-ignore — Rollup plugin context provides emitFile at build time.
        this.emitFile({
          type: "asset",
          fileName: `pdfjs-wasm/${name}`,
          source: readFileSync(pdfjsWasmDir + name),
        });
      }
    },
  };
}

export default defineConfig({
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
  },
  base: appBasePath,
  build: {
    rolldownOptions: {
      input: {
        app: fileURLToPath(new URL("./index.html", import.meta.url)),
        notFound: fileURLToPath(new URL("./404.html", import.meta.url)),
      },
    },
  },
  resolve: {
    // Transformers.js already loads version-matched ORT WASM from its CDN.
    // Select ORT's supported external-WASM entry so Vite does not also emit
    // its 25.6 MiB fallback binary (Workers assets are limited to 25 MiB).
    // Keep Vite's defaults for all other conditional package exports.
    conditions: ["onnxruntime-web-use-extern-wasm", ...defaultClientConditions],
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    allowedHosts: true,
  },
  plugins: [
    pdfjsWasmAssets(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/favicon.svg", "icons/favicon.ico", "icons/apple-touch-icon.png"],
      manifest: {
        name: "CloakPDF",
        short_name: "CloakPDF",
        description:
          "Edit, organise and sign PDFs on your device. Open-source tools for redaction, OCR, comparison and on-device AI.",
        theme_color: "#fafbfc",
        background_color: "#fafbfc",
        display: "standalone",
        // Every top-level surface now has an intentional landscape layout.
        // Individual workflows can still show their own narrow-screen guidance,
        // but the installed app must not globally lock landing/privacy/editor.
        orientation: "any",
        scope: appBasePath,
        start_url: appBasePath,
        icons: [
          {
            src: "icons/pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshots/editor-narrow-light.png",
            sizes: "780x1688",
            type: "image/png",
            form_factor: "narrow",
            label: "Annotating a sample PDF in the light phone editor",
          },
          {
            src: "screenshots/editor-narrow-dark.png",
            sizes: "780x1688",
            type: "image/png",
            form_factor: "narrow",
            label: "Annotating a sample PDF in the dark phone editor",
          },
          {
            src: "screenshots/editor-wide-light.png",
            sizes: "1440x900",
            type: "image/png",
            form_factor: "wide",
            label: "Annotating a sample PDF in the light desktop editor",
          },
          {
            src: "screenshots/editor-wide-dark.png",
            sizes: "1440x900",
            type: "image/png",
            form_factor: "wide",
            label: "Annotating a sample PDF in the dark desktop editor",
          },
        ],
      },
      workbox: {
        // App views use in-memory state. Unknown URLs must reach the host's 404,
        // even after installation, instead of being rewritten to the home screen.
        navigateFallbackAllowlist: [
          new RegExp(
            `^${appBasePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:index\\.html)?(?:\\?.*)?$`,
          ),
        ],
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // The pdfjs WASM decoders + JS fallbacks are large and only needed for
        // scanned CCITT/JBIG2/JPEG2000 images; cache them on demand via
        // runtimeCaching below rather than bloating every install's precache.
        globIgnores: ["**/pdfjs-wasm/**"],
        skipWaiting: false,
        cleanupOutdatedCaches: true,
        navigationPreload: true,
        runtimeCaching: [
          {
            // Annotate text fonts — bundled TTFs (not precached, since the glob
            // omits .ttf to keep the install lean). Fetched on demand for the
            // on-canvas preview and PDF embedding; CacheFirst so a font used once
            // keeps rendering/exporting offline. Immutable per-file.
            urlPattern: /\/fonts\/.*\.ttf$/,
            handler: "CacheFirst",
            options: {
              cacheName: "annotate-fonts-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // pdfjs WASM image decoders — immutable per pdfjs version, fetched
            // on demand. CacheFirst so scanned-document decoding keeps working
            // offline after the first use.
            urlPattern: /\/pdfjs-wasm\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "pdfjs-wasm-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/unpkg\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "unpkg-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "jsdelivr-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/tessdata\.projectnaptha\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tesseract-lang-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // language data is versioned by URL
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Hugging Face hosts the AI model weights used by the on-device
          // AI tools. Files are immutable per-revision so CacheFirst is
          // safe; we keep a generous entry budget because each model can
          // span 4–8 files (config.json, tokenizer.json, model weights).
          {
            urlPattern: /^https:\/\/huggingface\.co\/.*\/resolve\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "huggingface-models-cache",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          // Transformers.js falls back to a CDN mirror for some assets.
          {
            urlPattern: /^https:\/\/cdn-lfs\.huggingface\.co\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "huggingface-lfs-cache",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
        // Service-worker precache shouldn't try to swallow large model
        // bytes — they're delivered via the runtime cache rules above.
        // Bump the inlined-asset budget so the build doesn't refuse to
        // precache the WASM glue Transformers.js ships with.
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
      },
    }),
  ],
  staged: {
    "*": "vp check --fix",
  },
  // Repository-local agent skills are vendored reference material, not app
  // source. Keep the project's format gate focused on files we own instead of
  // rewriting that third-party instruction corpus.
  fmt: {
    ignorePatterns: [".agents/**", ".claude/skills/**", "docs/air/assets/**"],
  },
  lint: {
    ignorePatterns: [".agents/**", ".claude/skills/**", "docs/air/assets/**"],
    options: { typeAware: true, typeCheck: true },
  },
});
