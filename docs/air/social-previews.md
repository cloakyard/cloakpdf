# Air social previews

Each website owns `artwork/social.json` (copy, asset paths and landing-artwork selector).
The pinned `social.html`, `render-social.mjs` and `check-social.mjs` in this directory
provide the same 1200×630 composition and metadata checks in a standalone checkout.
The renderer captures only the existing landing artwork at its reduced-motion rest
pose. It never opens user files or captures editor state. README/PWA screenshots
remain separate real application captures.

Build the website first, then run from the repository root:

```sh
node docs/air/render-social.mjs
# Rebuild the website to include the new PNG, then:
node docs/air/check-social.mjs
```

The renderer needs Chrome/Chromium and development-only `puppeteer-core`.
PDF, IMG and Resume already declare it. For another website, set
`PUPPETEER_MODULE` to the absolute module entry of an existing tooling installation;
no sibling repository is required. Set `CHROME_PATH` for a nonstandard browser.
It starts and stops its own loopback server for the production build and rejects
external artwork/font requests. Optional `AIR_SOCIAL_OUTPUT` writes a comparison
PNG; `AIR_SOCIAL_EVIDENCE` writes the measured layout and browser errors.

Inspect native size and 600px/320px previews against light and dark surroundings.
The card itself intentionally remains light. Update OG and Twitter image URLs and
image descriptions together; the revision query changes when artwork changes.
Existing cached third-party previews may need the sharing platform's refresh tool.
All generated HTML, including static privacy/recovery pages, must carry the same
product image. SPA editor/tool views inherit that generic card, never user content.

`check-social.mjs` checks every built HTML document without executing JavaScript,
rejects duplicate or incomplete social tags, validates the PNG dimensions/size and
proves that the built image matches its source. Serve the build and check HTTP
image content types/accessibility as part of release verification.
