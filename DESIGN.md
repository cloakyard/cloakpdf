---
name: CloakPDF — Cloakyard Workbench
description: >-
  A technical-editorial design system for an advanced, open-source PDF web app.
  It shares Archivo, JetBrains Mono, large declarative headlines, proof ledgers,
  flat paper surfaces, hairline rules, and dark engineering chapters with
  CloakDrop while keeping CloakPDF's Ocean Blue accent and browser-native story.
mode: light-and-dark
genre: modern-minimal
design-system: app-wide
primary: "#2563EB"
paper: "oklch(0.975 0.009 255)"
ink: "oklch(0.225 0.031 255)"
fonts:
  display: Archivo
  body: Archivo
  mono: JetBrains Mono
macrostructures:
  marketing: Workbench
  utility: Instrument page
  editor: Persistent canvas workbench
  content: Long document
navigation: N1b three-zone solid header
footer: Ft5 statement band
---

# CloakPDF design system

## Family signature

CloakPDF and CloakDrop should look authored by the same developer, not like one
product was reskinned to impersonate the other. Their shared signature is:

- Archivo for forceful, tightly set headlines and durable UI text.
- JetBrains Mono for status, provenance, counts, tool IDs, and system labels.
- Cool paper, dark ink, one product accent, and slate hairline rules.
- Real product instruments as the visual proof. Never draw fake browser or OS chrome.
- Large declarative copy paired with operational ledgers rather than generic feature cards.
- A dark engineering/privacy chapter and statement footer.
- Restrained interaction: border, colour, one-pixel press, and functional progress motion.

CloakDrop's native-macOS, transfer, and provenance narrative does not transfer.
CloakPDF is a web app with a persistent canvas editor, focused utilities, advanced
PDF toolkits, open source code, and local document processing.

## Product truth

The central line is: **“A complete PDF workbench. Nothing uploaded.”**

“Nothing uploaded” refers to document content. The app may download static code,
PDF workers, OCR language data, or on-device model weights. Copy must preserve that
distinction. Do not claim that every cold-cache AI or OCR flow works offline.

The proof path is always shown as:

1. PDF bytes enter browser memory through a local file handle.
2. PDF.js, pdf-lib, and WASM process the document in the tab.
3. The browser writes a local result for download.

The absent routes are upload server, user account, and analytics.

## Colour

`tokens.css` is the source of truth.

- Ocean Blue `#2563EB` is the only product accent. Use it for CTAs, active tools,
  links, focus rings, progress, and proof markers.
- Keep the Ocean Blue scale fixed across themes. On Night surfaces, small accent
  copy uses the lighter 400 tint while primary CTAs retain the 600 fill.
- Paper is a cool near-white, not pure white. Dark mode uses navy paper rather
  than pure black.
- Resting boundaries are Slate-200-like hairlines. Stronger rules organise major
  chapters and instruments.
- Red, amber, and green are reserved for semantic error, warning, and success states.
- Per-tool and per-category colours must not appear on interactive surfaces.
- Marketing backgrounds are flat. Grainient, aurora glows, cursor spotlights, and
  decorative radial gradients are not part of this system.

## Typography

Archivo is self-hosted from `public/fonts/archivo-latin.woff2`; JetBrains Mono is
self-hosted from `public/fonts/jetbrains-mono-latin.woff2`.

- Hero display: Archivo 760, `clamp(2.75rem, 5.5vw, 5.6rem)`, 0.91 line-height,
  `-0.065em` tracking. Keep the line under roughly eleven characters of measure.
- Section display: Archivo 720, `clamp(2.15rem, 4.7vw, 4.9rem)`, 0.98 line-height.
- Utility title: Archivo 740, `clamp(2.75rem, 6vw, 6.2rem)`, 0.92 line-height.
- Body: Archivo 400–600, 1.5–1.6 line-height.
- Operational label: JetBrains Mono 600, 10–11px, uppercase, 0.05–0.10em tracking.
- Never use mono for paragraphs or oversized display text.

## Macrostructure

### Marketing — Workbench

Header → split declaration → functional local-file pipeline → derived fact strip →
searchable utility ledgers → dark local-processing receipt → statement footer.

The hero's enrichment is the actual PDF input and pipeline. It is not a screenshot,
window mockup, abstract illustration, or decorative animation.

### Standalone utilities — Instrument page

Each utility shares a large title/description split, an execution/upload fact ledger,
and a bordered instrument body. Tool logic remains bespoke inside this shared shell.
The page must feel like a mode of the same workbench, not a separate microsite.

### Editor — Persistent canvas workbench

Preserve the full-screen composition, top-bar height, rail width, properties widths,
stage persistence, and mobile 50:50 canvas/sheet split. Style the chrome with flat
paper surfaces, hairline borders, compact radii, Ocean Blue active cues, and mono
operational labels. Never introduce a marketing header inside the editor.

### Content — Long document

Privacy and explanatory content use a narrow reading measure with a strong title,
mono section markers, hairline chapter divisions, and the same dark statement footer.

## Surfaces and components

- Header: always solid or 96% paper; 1px bottom rule; 72px high; no floating pill.
  The family mark is a full 40px circle with a 0.6rem wordmark gap, matching CloakDrop.
- Cards: 1px border, 6–8px radius, no resting shadow. Hover changes border and paper tint.
- Tool cards: tool ID and icon are metadata, not an icon tile. Title and description carry hierarchy.
- Drop zone: bordered local-input instrument with a status rail, document prompt, and Browse control.
- Buttons: 6px radius, mono label, one Ocean Blue primary and neutral outlined secondary.
- Inputs: stable height, bottom rule or 1px box, visible focus ring, no layout shift on error.
- Proof ledgers: numbered rows with title, operational metadata, and local status.
- Dark chapters: use the Night tokens; Ocean Blue remains the only accent.
- Modals and popovers: solid paper, compact 8px corners, a named scrim/elevation token,
  and no decorative glass. Functional elevation is allowed; resting page cards remain flat.
- Privacy and explanatory pages always close with the dark statement footer. Utilities
  and editor exits retain a compact branded footer instead of dropping the family close.

## Layout and spacing

Use the named 4px-based scale in `tokens.css`. The maximum frame is 88rem with a
16px phone gutter and 24px gutter from 640px upward. Major sections use 64–160px
vertical space; internal instruments use 12–32px. Avoid nested padded cards.

Desktop may use 7/5, 5/5, and 3/9 splits. Below 860px, split layouts stack. Below
640px, four-column fact strips become 2×2 and file input instruments become a
single-column action. The UI must be checked at 320, 375, 414, and 768px.

## Motion and interaction

- Use one-time reveals only at the structural level: the hero may stagger its three major blocks,
  and major sections may settle once as they enter the viewport. Do not animate every paragraph,
  row, or repeated control, and do not add a continuously moving marketing backdrop.
- Hover may change border, tint, icon position, link colour, or lift a card by up to 2px in
  160–260ms. Icon rotations stay within 5 degrees and never obscure meaning.
- Tool/panel changes may fade and settle up to 6px on fine-pointer layouts. Coarse-pointer panels
  use a shorter 4px translation without text scaling. Never animate editor geometry: in particular,
  the mobile editor sheet keeps its exact 50:50 height while only inner content moves.
- Responsive bottom sheets translate from their anchored edge without scaling their full-width
  surface; centered dialogs use the same calm timing so modal behavior stays consistent.
- Active controls move at most one pixel and never overshoot.
- Spinners, progress, drag-over feedback, editor gestures, and model streaming remain functional
  motion. Status accents may animate once on arrival; decorative infinite loops are not allowed.
- Respect `prefers-reduced-motion`; never disable essential loading status.
- All interactive controls require visible focus, accurate accessible names, and at least 44px touch targets where practical.

## Invariants

1. One accent: Ocean Blue owns interaction.
2. Hairline rules, no resting card shadows.
3. Real app proof, no fake chrome.
4. Archivo + JetBrains Mono across every CloakPDF surface.
5. Functional composition and test-sensitive labels remain stable during visual changes.
6. The open editor mobile sheet and canvas divide the available content height 50:50.

## Exports

### `tokens.css`

```css
:root {
  --color-paper: oklch(0.975 0.009 255);
  --color-paper-2: oklch(0.947 0.014 255);
  --color-surface: oklch(0.992 0.004 255);
  --color-ink: oklch(0.225 0.031 255);
  --color-ink-2: oklch(0.43 0.035 255);
  --color-ink-3: oklch(0.48 0.03 255);
  --color-rule: oklch(0.865 0.022 255);
  --color-accent: oklch(0.546 0.245 262.881);
  --color-accent-hover: oklch(0.488 0.243 264.376);
  --color-accent-ink: oklch(0.985 0.004 255);
  --color-overlay: color-mix(in oklab, var(--color-night) 58%, transparent);
  --font-display: "Archivo", sans-serif;
  --font-body: "Archivo", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --space-3xs: 0.25rem;
  --space-2xs: 0.5rem;
  --space-xs: 0.75rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;
  --space-2xl: 4.5rem;
  --space-3xl: 7rem;
  --text-cloak-xs: 0.75rem;
  --text-cloak-sm: 0.875rem;
  --text-cloak-md: 1rem;
  --text-cloak-lg: 1.25rem;
  --text-cloak-xl: 1.75rem;
  --text-cloak-display: clamp(2.75rem, 6.4vw, 6.75rem);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-short: 160ms;
  --radius-card: 0.5rem;
  --radius-input: 0.375rem;
  --shadow-popover: 0 0.75rem 2rem color-mix(in oklab, var(--color-night) 14%, transparent);
  --shadow-overlay: 0 1.5rem 4rem color-mix(in oklab, var(--color-night) 22%, transparent);
}
```

### Tailwind v4 `@theme`

```css
@theme {
  --font-sans: "Archivo", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --color-primary-400: oklch(0.707 0.165 254.624);
  --color-primary-500: var(--color-focus);
  --color-primary-600: var(--color-accent);
  --color-primary-700: var(--color-accent-hover);
  --color-page-bg: var(--color-paper);
  --color-border: var(--color-rule);
  --spacing-md: 1.5rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`

```json
{
  "color": {
    "paper": { "$value": "oklch(0.975 0.009 255)", "$type": "color" },
    "ink": { "$value": "oklch(0.225 0.031 255)", "$type": "color" },
    "accent": { "$value": "oklch(0.546 0.245 262.881)", "$type": "color" },
    "rule": { "$value": "oklch(0.865 0.022 255)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Archivo", "$type": "fontFamily" },
    "body": { "$value": "Archivo", "$type": "fontFamily" },
    "mono": { "$value": "JetBrains Mono", "$type": "fontFamily" }
  },
  "space": {
    "sm": { "$value": "1rem", "$type": "dimension" },
    "md": { "$value": "1.5rem", "$type": "dimension" },
    "lg": { "$value": "2rem", "$type": "dimension" }
  }
}
```

### shadcn/ui CSS variables

```css
:root {
  --background: 97.5% 0.009 255;
  --foreground: 22.5% 0.031 255;
  --card: 99.2% 0.004 255;
  --card-foreground: 22.5% 0.031 255;
  --primary: 54.6% 0.245 262.881;
  --primary-foreground: 98.5% 0.004 255;
  --muted: 94.7% 0.014 255;
  --muted-foreground: 57% 0.027 255;
  --border: 86.5% 0.022 255;
  --input: 86.5% 0.022 255;
  --ring: 62.3% 0.214 259.815;
  --radius: 0.375rem;
}
```
