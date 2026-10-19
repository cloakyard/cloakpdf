# Application and social previews

Install and README previews are unaltered captures of the real Air editor,
with a generated three-page **Studio notes** PDF. All text and vector artwork
are synthetic. No personal document or existing browser profile is used.

| Asset                     | CSS viewport | Pixel dimensions | Appearance |
| ------------------------- | ------------ | ---------------- | ---------- |
| `editor-wide-light.png`   | 1440×900     | 1440×900         | Light      |
| `editor-wide-dark.png`    | 1440×900     | 1440×900         | Dark       |
| `editor-narrow-light.png` | 390×844      | 780×1688         | Light      |
| `editor-narrow-dark.png`  | 390×844      | 780×1688         | Dark       |

These files live in `public/screenshots/`. Narrow captures emulate touch at 2×
pixel density; they are not evidence of physical-device acceptance. The manifest
labels describe the layout and appearance without claiming a particular device.
The README uses a light/dark `<picture>` with descriptive alternative text.

## Regenerate

With dependencies installed and Chrome available, build and start a local preview:

```bash
pnpm build
pnpm preview --host 127.0.0.1 --port 4173 --strictPort
```

Then, in another terminal:

```bash
pnpm generate-screenshots
pnpm generate-og
pnpm build
```

Use `SCREENSHOT_URL` for another running local preview and `CHROME_PATH` for a
nonstandard Chrome/Chromium binary. The capture script opens isolated contexts,
selects Annotate through the real UI, waits for decoded pages/fonts, captures both
appearances and removes its temporary PDF. It never clears user storage.

`artwork/og.html` composes the 1200×630 social card from the pinned local Air CSS,
the original family mark and the real light editor capture. Its headline matches
the landing promise. `pnpm generate-og` renders it directly from local files;
no dev server, network artwork, extra font or duplicated editor UI is needed.
The PNG is `public/icons/og-image.png`; OG/Twitter titles, dimensions and image
alternatives are in `index.html`. Inspect the PNG at full size and card scale.

After regeneration, inspect every published capture and responsive live light/dark
states. Build validation checks manifest image paths against actual pixel sizes.
An image update does not establish complete feature or device coverage.

Logo sources and launcher icons are separate. Regenerate them with
`pnpm generate-icons` only when their SVG source changes; see [logo-spec.md](logo-spec.md).
