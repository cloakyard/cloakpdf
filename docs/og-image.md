# Open Graph image

`public/icons/og-image.png` is a 1200x630 capture of the real CloakPDF landing
page. It is not a separate illustration or a hand-maintained mockup. That keeps
the shared preview aligned with the current logo scale, Ocean Blue accent,
typography, product copy, and Workbench layout.

## Regenerate

```bash
pnpm generate-og
```

The command starts a temporary Vite+ server on `127.0.0.1:4179`, opens the app
in headless Chrome with a light colour scheme and reduced motion, waits for the
local fonts, and replaces `public/icons/og-image.png` with the exact viewport.

Requirements:

- dependencies installed;
- Google Chrome at the standard macOS path, or `CHROME_PATH` set to another
  Chrome/Chromium binary.

To capture an already-running local or preview build instead:

```bash
OG_URL=http://127.0.0.1:5173 pnpm generate-og
```

After regenerating, confirm the file is still 1200x630 and visually inspect it.
The matching Open Graph and Twitter metadata lives in `index.html`.

When the logo changes, regenerate the PWA assets first and the social card
second:

```bash
pnpm generate-icons
pnpm generate-og
```

The shared geometry and naming contract for those source assets is documented in
[`logo-spec.md`](logo-spec.md).

## Why the live page is the source

The landing page itself is the product's strongest design artifact. Capturing it
avoids a second, drifting visual system and makes the social card reproducible.
Any landing-page refinement can be reflected by rerunning one command after the
UI audit is complete.
