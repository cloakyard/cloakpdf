# Cloakyard family logo specification

**Version:** `v1`

**Scope:** Every app published by Cloakyard

This is the canonical construction and export contract for Cloakyard product
marks. Every app shares the same geometry, lighting, stroke language, asset
names, and PWA treatment. A product remains distinct through only its gradient
palette and its central pictogram.

## Family signature

Every product uses:

- a `64 × 64` source artboard;
- the same centred keylines;
- a light-to-dark product gradient;
- the same top-left white bloom;
- a white, round-capped central pictogram;
- a circular mark for product UI and favicons;
- a separate full-bleed launcher source for installed apps.

Do not add letters, secondary colours, shadows, transparent launcher edges, or
product-specific outer shapes. The pictogram must communicate the product at
small sizes without relying on the wordmark.

## Asset contract

Each product repository must contain:

| Asset                                    | Purpose                                                            |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `public/<product>-mark.svg`              | Circular family mark used in headers, footers, and brand surfaces. |
| `public/icons/<product>-app-icon.svg`    | Full-bleed master used to generate PWA and home-screen icons.      |
| `public/icons/favicon.svg`               | The circular mark geometry with a product-specific title.          |
| `public/icons/pwa-64x64.png`             | Small PWA icon.                                                    |
| `public/icons/pwa-192x192.png`           | Standard install icon.                                             |
| `public/icons/pwa-512x512.png`           | High-resolution install icon.                                      |
| `public/icons/maskable-icon-512x512.png` | Opaque maskable icon.                                              |
| `public/icons/apple-touch-icon.png`      | Opaque `180 × 180` iOS home-screen icon.                           |
| `public/icons/favicon.ico`               | Legacy `48 × 48` browser icon.                                     |

Use product-specific filenames such as `cloakyard-mark.svg` and
`cloakpdf-mark.svg`; do not use an ambiguous `logo.svg`.

## Geometry

All dimensions below are in the `64 × 64` source coordinate system.

| Element                  | Constraint                                   |
| ------------------------ | -------------------------------------------- |
| Artboard                 | `64 × 64`, centre `(32, 32)`                 |
| Circular mark disc       | diameter `60`, radius `30`                   |
| Inner pictogram keyline  | diameter `42`, radius `21`                   |
| PWA guaranteed safe zone | diameter `51.2`, radius `25.6`               |
| Pictogram stroke         | `3`, white, round caps and joins             |
| Mark inner ring          | radius `29.25`, white at `0.28`, width `1.5` |

The pictogram keyline is exactly **70% of the circular mark disc**:

```text
42 / 60 = 0.7
```

Every pictogram path centre line must stay inside the diameter-42 circle. A
3-unit centred stroke produces a maximum visible diameter of `45`, which remains
inside the diameter-51.2 PWA safe zone. Filled shapes must also stay inside that
safe zone.

Scale pictograms uniformly from `(32, 32)`. Do not stretch separate axes or size
by bounding-box width alone. Optical corrections may move internal details, but
the outer pictogram keyline and centre remain fixed.

## Circular product mark

The UI mark uses a transparent `64 × 64` canvas:

1. Draw the product-gradient disc at `(32, 32)` with radius `30`.
2. Draw the shared top-left bloom over the disc.
3. Draw the radius-`29.25` white inner ring.
4. Draw the white product pictogram on the diameter-42 keyline.

The two transparent pixels around the disc preserve its circular silhouette in
headers and browser tabs. Set these machine-readable root attributes:

```xml
data-logo-spec="cloakyard-mark-v1"
data-glyph-keyline="42"
```

## Installed app icon

The launcher source uses the same `64 × 64` artboard, gradient, bloom, pictogram,
and keyline, with two deliberate differences:

- the gradient is a full-bleed rectangle with no transparent pixels;
- the circular inner ring is omitted because the operating system supplies the
  outer circle, squircle, or rounded-square mask.

The Web Application Manifest specification guarantees a central safe circle
with a radius equal to 40% of the icon size. On a 64-unit canvas that is radius
`25.6`; the complete diameter-45 stroked pictogram fits inside it. Pixels
outside that zone are background only and may be cropped safely. See the
[W3C icon masks and safe-zone specification](https://www.w3.org/TR/appmanifest/#icon-masks).

Set these root attributes on the launcher master:

```xml
data-logo-spec="cloakyard-app-icon-v1"
data-glyph-keyline="42"
```

Never generate maskable icons from the transparent circular mark. Always use the
full-bleed app-icon master.

## Shared lighting

The family uses the same direction and intensity of light:

```xml
<radialGradient
  id="<product>-light"
  cx="0"
  cy="0"
  r="1"
  gradientTransform="translate(20 13) rotate(48) scale(35)"
>
  <stop stop-color="white" stop-opacity="0.42"/>
  <stop offset="0.58" stop-color="white" stop-opacity="0"/>
</radialGradient>
```

The main gradient runs from `(11, 6)` to `(51, 58)`. Each product may select
three stops within its product accent family, but must keep enough midpoint
contrast for the white pictogram to remain immediately readable.

## Product distinction

Only these elements vary:

1. **Product pictogram** — one simple concept, no text, no fine detail.
2. **Gradient palette** — a recognisable product hue within the shared lighting
   construction.
3. **Accessible title and wordmark suffix** — for example, `CloakPDF`.

All products keep the same outer construction. When several Cloakyard apps sit
next to each other on a phone, the matching lighting and proportions establish
the family while the pictogram and palette prevent confusion.

## PWA generation and manifest

Generate raster assets from the full-bleed app-icon master:

```bash
pnpm generate-icons
```

Each app must keep a `pwa-assets.config.ts` that sets `padding: 0` and
`fit: "cover"` for ordinary, maskable, and Apple assets. The generator's
built-in maskable/Apple defaults add 30% padding on white; those defaults are
not compatible with this family because they create a white frame around the
blue launcher field. The product script then performs the generator's filename
normalisation:

```bash
mv public/icons/apple-touch-icon-180x180.png public/icons/apple-touch-icon.png
```

The manifest must include both ordinary and explicitly maskable icons:

```json
{
  "icons": [
    { "src": "icons/pwa-64x64.png", "sizes": "64x64", "type": "image/png" },
    { "src": "icons/pwa-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/pwa-512x512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "icons/maskable-icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

## Release checklist

- [ ] Circular mark and app icon use a `64 × 64` viewBox.
- [ ] Pictogram centre lines fit the diameter-42 keyline.
- [ ] The complete pictogram, including stroke, fits diameter `51.2`.
- [ ] Launcher master and maskable PNG have no transparent pixels.
- [ ] Pictogram remains legible at `32 px` and the real `40 px` header size.
- [ ] App icon is checked under circle, squircle, and rounded-square masks.
- [ ] App icon is checked on light and dark phone wallpapers.
- [ ] Pictogram is recognisably different from every other Cloakyard product.
- [ ] The manifest declares a `512 × 512` icon with `purpose: "maskable"`.
- [ ] Generated PNGs and `favicon.ico` are refreshed after SVG changes.
- [ ] Product social/OG artwork is regenerated after the mark changes.
