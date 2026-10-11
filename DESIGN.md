---
name: CloakPDF — Cloakyard Air
version: 1.0.0
status: authoritative-target
date: 2026-10-11
scope: complete-web-product
family-contract-sha256: d5c2e7f5e07afc0b9949d1ba28bb4dd35f0b1d8bcad5ff26e5d12f08c3f0eeea
---

<!-- BEGIN CLOAKYARD AIR CONTRACT -->

# Cloakyard Air design contract

Version: **1.0.0** · Approved direction: **Air** · Effective: **2026-10-11**

This is the portable, normative design contract for the Cloakyard web family.
It applies to existing and future products, all routes, all states, and every
custom or third-party control rendered inside a product. A landing page alone
cannot establish conformance. Product-specific requirements follow this contract
in each repository's `DESIGN.md`.

Air supersedes the former Workbench visual specification: heavy Archivo display,
uppercase mono control labels, product-tinted application surfaces, compact square
cards, obligatory dark statement footers, and decorative technical ledgers.
Existing functional requirements, privacy boundaries, output fidelity, and data
integrity remain requirements. This document describes the target; completion is
recorded separately in the refresh TODO and validation evidence.

## 1. Priority and ownership

1. Accessible, correct operation and preservation of user work.
2. Consistency across the family, including custom components and edge states.
3. Clear hierarchy, comfortable reading, direct actions, and responsive layouts.
4. Air's quiet visual character and restrained motion.

The family contract owns typography, semantic colour, component geometry, spacing,
elevation, focus, icons, overlays, responsive behaviour, and motion. A product may
choose its tools, content, document format, and task-specific composition. It may
not invent a different control skin. New shared patterns are added to this contract
and the shared assets first, then adopted by all affected products.

Every exception must name the exact surface, its functional reason, owner, and
validation. An exception cannot be justified by preference, convenience, or an
existing hardcoded value. Document and image output are explicit exceptions to UI
colour/typography; their surrounding controls are not exceptions.

## 2. Visual signature

- Open neutral space, softly separated solid surfaces, light borders, restrained
  shadows, rounded controls, and readable sentence-case labels.
- Display typography is regular/medium with natural line lengths. Body copy
  explains the user's task. Technical architecture belongs in details or docs.
- A low-contrast blue light field may enrich a landing hero. It never sits behind
  editable content, reading text, a document canvas, or an inspector.
- One monochrome primary action treatment across all apps; one shared blue for
  links, selection, focus, and interactive indicators. Product logo artwork may
  retain its established colour; it must not recolour the surrounding UI.
- An editor is a calm place to work. Content, selection, and the next useful action
  have priority over branding and decoration.

## 3. Portable foundations

Implement these as semantic CSS properties with an `--air-` prefix. Framework
theme utilities and legacy aliases must reference these properties, never maintain
parallel literal palettes. Values are identical across products. The maintained
family bundle is versioned and copied into each repository; builds must work from
a standalone checkout without sibling repositories, a CDN, or a private package.
Copies have a revision/hash check. Local component overrides cannot redefine the
family tokens. System appearance is the default in every app.

### Colour

| Token suffix    | Light     | Dark      | Purpose                               |
| --------------- | --------- | --------- | ------------------------------------- |
| `page`          | `#fafbfc` | `#101216` | Page background                       |
| `surface`       | `#ffffff` | `#1a1d23` | Controls, panels, dialogs             |
| `surface-soft`  | `#f0f2f6` | `#232830` | Canvas surround, selected neutral row |
| `surface-hover` | `#e9edf3` | `#2d333e` | Hovered neutral surface               |
| `ink`           | `#202329` | `#f1f3f7` | Primary text                          |
| `ink-secondary` | `#525b68` | `#b6becb` | Body/supporting text                  |
| `ink-muted`     | `#646b76` | `#a7afbc` | Secondary metadata                    |
| `line`          | `#e1e5eb` | `#363d48` | Surface separation                    |
| `line-control`  | `#858e9b` | `#778395` | Required control boundary             |
| `action`        | `#222831` | `#e9eef7` | Primary button                        |
| `on-action`     | `#ffffff` | `#18212e` | Primary button content                |
| `accent`        | `#285ad7` | `#9ebcff` | Focus, links, active indicators       |
| `accent-soft`   | `#edf2ff` | `#202f4e` | Selected accent surface               |
| `danger`        | `#b42335` | `#ff9ea8` | Destructive/error content             |
| `danger-soft`   | `#fff0f1` | `#382229` | Error surface                         |
| `warning`       | `#875700` | `#f4ca7c` | Warning content                       |
| `warning-soft`  | `#fff6df` | `#352d1c` | Warning surface                       |
| `success`       | `#236444` | `#8dd5b0` | Success content                       |
| `success-soft`  | `#eaf7ef` | `#1c3027` | Success surface                       |
| `checker-a`     | `#f0f2f6` | `#232830` | Transparency grid                     |
| `checker-b`     | `#dce1e8` | `#363d48` | Transparency grid                     |

Muted text is not disabled text. Check actual foreground/background contrast, not
just individual token values: 4.5:1 normal text, 3:1 large text and required UI
indicators. `line` is decorative separation and cannot be the sole indicator of a
control. Errors/warnings/success also use text and an appropriate icon.

### Type

- UI and display: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
  This reproduces Air's native, light typography without remote font requests.
- Code and machine identifiers only: `ui-monospace, "SFMono-Regular", Consolas,
  monospace`. Button labels, navigation, ordinary status, and headings use UI sans.
- Weight 400 for body; 500 for labels/headings; 600 only for limited emphasis.
  No 700–900 display or control weights. Logos and document output are exempt.
- Hero: `clamp(2.5rem, 5.5vw, 4.5rem)`, weight 500, line-height 1.05, tracking
  `-0.045em`. Section title: `clamp(1.75rem, 3vw, 2.75rem)`, 500, 1.15,
  `-0.03em`. Workspace/dialog heading: 20–24px, 500, 1.25.
- Page prose 16–18px/1.6; UI body 14px/1.5; labels 13px/1.4; metadata minimum
  12px/1.5. Mobile editable text remains at least 16px to avoid focus zoom.
- Sentence case. Tabular numerals for dimensions, sizes, percentages, and aligned
  counts. No tracked uppercase eyebrows, pipeline IDs, or marketing tool counts.
- Natural word boundaries; wrap long filenames/URLs without forcing normal prose
  into arbitrary letter breaks. Never shrink text to conceal overflow.

### Geometry

| Primitive              | Normative value                                       |
| ---------------------- | ----------------------------------------------------- |
| Spacing scale          | 4, 8, 12, 16, 20, 24, 32, 48, 64, 96px                |
| Page max width         | 1200px                                                |
| Page gutters           | 16px phone; 24px tablet; 32px laptop/desktop          |
| Marketing header       | 72px desktop; at least 64px narrow                    |
| Editor top bar         | 64px; may wrap/reflow on narrow screens               |
| Icon rail              | 72px with visible labels or accessible tooltips       |
| Inspector              | 288–360px; 328px default desktop                      |
| Content entry panel    | 328px default; up to 560px if writing needs the space |
| Control radius         | 10px                                                  |
| Small chip/tab radius  | 8px                                                   |
| Panel/card radius      | 18px                                                  |
| Dialog radius          | 20px                                                  |
| Floating menu radius   | 12px                                                  |
| Normal control height  | 40px; 44px minimum touch target                       |
| Compact control height | 32px on fine pointers only                            |
| Field/row interior     | 12–16px; section group gap 24px                       |
| Reading measure        | 65ch maximum                                          |

Full-bleed app rails may meet an edge without rounded outer corners. Do not nest
several padded cards. Use whitespace and modest section dividers inside inspectors.
Primary action groups contain one dominant action. A 2px focus outline with 3px
offset uses `accent` and remains visible inside scrolling and clipped containers.

Elevations: surface `0 8px 28px #1822340a`; menu `0 12px 32px #1018281a`;
dialog `0 24px 64px #10182826`. In dark mode use opaque surfaces and `line`
separation in addition to shadow. Scrim: `rgb(12 18 28 / 40%)`.
No glass blur behind forms, body copy, tables, or document content.

## 4. Component contracts — custom controls included

| Component                       | Required shared behaviour and appearance                                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand/header/footer             | Same wordmark spacing and header rhythm; existing family mark, 32px in editor and 36px marketing. Compact neutral footer with product links, privacy, source, and version where useful. |
| Buttons                         | Sans label; stable box; neutral secondary; monochrome primary; visible hover/press/focus; descriptive action verb; busy state preserves width.                                          |
| Icon buttons                    | Accessible name, tooltip for unfamiliar meaning, 40px fine/44px touch target; selected and disabled semantics.                                                                          |
| Text/number/date fields         | Visible persistent label; shared boundary, height, radius, focus; unit beside value; help/error beneath; correct input type and autocomplete.                                           |
| Select/listbox                  | Native semantics or established accessible primitive; same field shell; arrow inset; wrapping long labels; keyboard navigation; viewport-aware menu.                                    |
| Check/radio/switch              | Label and control share hit target; explicit state; keyboard operation; same accent/focus.                                                                                              |
| Slider/scrubber                 | Label, current value/unit, keyboard input, touch-friendly hit area, reset or precise entry when needed; no hidden critical gesture.                                                     |
| Segments/tabs                   | Neutral group, one clear selection, correct roles/states and arrow keys where expected; same radius/density.                                                                            |
| Tool/section rail               | Stable order, labels/accessible names, neutral selected tile and blue indicator; search/more access on small screens; no coloured tool rainbow.                                         |
| Inspector/entry group           | Consistent heading, help, spacing and primary action; advanced settings disclosed; controls stay in reach on short screens.                                                             |
| Colour picker/curves            | UI shell follows Air; actual colour field/histogram/curve are functional data, not branding. Provide labels, numeric entry, focus, clipping protection.                                 |
| Lists/layers/history            | Same row states, selection/focus, progress and empty-state language; long names wrap/truncate with full-name access; accessible reorder alternatives.                                   |
| Drop zone/import                | Clear local-file action and supported types; equivalent browse action; drag-over, wrong type, encrypted/invalid/large-file states; readable progress.                                   |
| Dialog/sheet                    | Named title/description; close, scroll body, action region; focus containment/return; Escape; background inert; preserve state across resizing.                                         |
| Popover/menu/tooltip            | Anchored, viewport-aware, opaque; common elevation/radius; keyboard dismissal; no clipping inside parent scroll regions.                                                                |
| Toast/notice/error              | Shared icon/text/action layout, semantic role/live region, understandable recovery; never cover primary or modal actions.                                                               |
| Progress/AI model state         | Honest determinate progress when known; explicit size, consent, download/cancel/retry/error/cached/ready states; no fake percentages.                                                   |
| Rich text/signature/drawing     | Air toolbar and focus; preserve content formatting; keyboard/tap alternative where feasible; undo/reset; visible selection.                                                             |
| Privacy/help/404/error boundary | Same typography, width, navigation and controls; clear return/retry path; technical detail only when relevant.                                                                          |
| PWA/install/update              | Same notice/dialog language; do not reload over unsaved work; readable offline/cache/download distinctions.                                                                             |

A custom implementation is reviewed against the same contract. Native controls,
accessible existing primitives, and shared shells are preferred to new widgets.
Every component must define default, hover, focus, pressed/selected, disabled,
busy, empty, success, error, and overflow behaviour where applicable. Mark truly
inapplicable states with a reason in the inventory; do not silently skip them.

## 5. Composition and workflow

### Landing pages

Shared sequence: quiet header → short centred promise → direct primary action →
real product entry/preview where useful → concise capability groups → factual
privacy explanation → compact family footer. A subtle blue light field may sit
below the hero copy. Avoid fake product capabilities, excessive feature counts,
industrial grids, oversized decorative icons, or compulsory dark sections.

The family home is a product directory. Each card says what the app does, its
platform, and how to open it. KERR is a text exploration link with brief context;
no screenshot, simulation, orbital illustration, animated preview, or embedded app.

### Editors and canvases

- Consistent action placement: identity/document at start; undo/view/tool context
  in the middle when space permits; export/finish at end. No marketing navigation
  inside a working editor.
- Persistent content stage. Tool changes cannot remount the document, lose edits,
  reset selection/zoom/history, or trigger a decorative page transition.
- Neutral canvas surround. PDF/résumé paper stays white and output-accurate;
  photos retain their actual colours; transparency uses the shared checkerboard.
- Real selection handles, masks, redaction marks, rulers and annotations remain
  distinct from UI decoration. Their controls and surrounding panels use Air.
- Large screens use rail + stage + inspector, or rail + entry form + preview for
  writing. Preserve task-specific placement while sharing widths and controls.
- Small screens use one active tool/section, a persistent preview, and a reachable
  working panel. Default split can be 50:50 when usable; short heights and software
  keyboards require an expanded editing/preview mode instead of clipped controls.
- Opening, replacing, editing, undoing, cancelling, saving/exporting, and returning
  must have consistent feedback. Destructive actions require confirmation or undo.

### Overlays

Standard dialog width 576px; wide gallery/review 1040px; viewport gutter 16px
mobile/24px desktop. Maximum height `calc(100dvh - 32px)` with internal body
scroll and reachable actions. At ≤640px, use the same content in a bottom sheet
with 20px upper corners and safe-area padding. Large/complex work may use a full
screen dialog with an explicit close/back. Never hide essential actions on mobile.

Z levels: sticky 30; navigation 50; editor 100; toast 150; dialog 200; popover 900;
system recovery 1000. Preserve nesting/portal correctness; avoid ad-hoc z-indexes.

## 6. Responsive and accessibility contract

| Class           | Required inspection sizes (CSS pixels) |
| --------------- | -------------------------------------- |
| Minimum/phones  | 320×568, 375×812, 390×844, 430×932     |
| Landscape phone | 844×390 with coarse pointer            |
| Tablet          | 768×1024, 1024×768                     |
| Laptop          | 1280×720, 1366×768                     |
| Desktop         | 1440×900, 1920×1080                    |

Use content-driven reflow with shared breakpoints at 640, 1024, and 1280px. Inspect
one pixel either side of changed breakpoints. A product may add a breakpoint only
for a documented content collision, without inventing a new visual language.

No horizontal document overflow, cropped controls, inaccessible tool options, or
forced orientation as a substitute for responsive design. Editing regions may
scroll deliberately; the surrounding page may not hide layout bugs with overflow
clipping. Long filenames, translated labels, empty/large lists and 200% browser
zoom are required cases. Pinch zoom stays enabled. Respect safe-area insets and
software keyboards. DOM order follows reading/focus order.

Semantic buttons/links/landmarks, labels, visible focus, contrast, screen-reader
state, keyboard alternatives to drag, and recoverable errors are release criteria.
Test real rendered light and dark themes, keyboard-only operation, coarse and fine
pointers, reduced motion, and no-WebGPU/static fallback. Automated checks support
human visual inspection; passing a linter does not establish UX conformance.

## 7. Motion and shader discipline

- Shared motion: press 120ms; hover/colour 160ms; popover 180ms; dialog 240ms;
  exit 160ms. Ease-out `cubic-bezier(0.23, 1, 0.32, 1)`; reversible spatial motion
  `cubic-bezier(0.77, 0, 0.175, 1)`. No unapproved spring or per-app timing scale.
- Frequent tool/section switching and keyboard commands are immediate. Motion
  explains state or confirms an action; it must never delay editing.
- Animate transform/opacity; scale from 0.98, translate at most 4px for small
  surfaces; sheets enter from their edge. No layout-property animation or
  `transition: all`. Hover movement is fine-pointer/hover-capable only.
- Reduced motion removes spatial/decorative movement, preserves immediate state
  and progress, and uses opacity only when useful. Focus never animates.
- One optional Air light effect on a landing page, never in an active workspace.
  Code is local/lazy; use the approved Shaders library only if it improves the
  chosen light treatment. A static CSS/image fallback must render first.
- Pause offscreen, hidden, reduced-motion, and constrained-device effects. An
  autonomous loop longer than five seconds needs a visible pause/stop control.
  Prefer one short entrance or deliberate pointer response. Content and actions
  never depend on GPU support or successful effect loading.
- Measure impact on startup, scrolling, input, memory, and battery-sensitive
  devices; no shader competes with document rendering or on-device AI work.

## 8. Scope exceptions

- Native macOS software keeps SwiftUI, SF Symbols, system materials, system fonts,
  native navigation, and platform conventions. Its website follows Air. Shared
  brand assets do not justify replacing native controls with web imitations.
- KERR's application is excluded. Only its listing on the family home changes.
- User-created PDF, image, and résumé content retains its chosen appearance and
  export fidelity. Document themes, image pixels, colour-picker gradients,
  semantic charts and selection overlays are functional data exceptions.
- Existing app-specific security/privacy/data-loss requirements remain in force.

## 9. Governance and release gate

Each repository ships a self-contained `DESIGN.md`, pinned family tokens/styles,
its product appendix, a surface inventory and its validation command. No absolute
machine path, sibling import, external font dependency, or private service is
required to apply this specification. A new app adopts these before its first UI.

For each bounded implementation piece:

1. Name the affected surfaces, states, behaviours, and test matrix in the TODO.
2. Implement with shared primitives/tokens; update custom component shells too.
3. Review source and rendered output, including light/dark, mobile/laptop/desktop,
   keyboard, touch, reduced motion, error/loading/empty and long-content states.
4. Run the repository's required format/lint/type, unit/logic, build/dead-code and
   applicable browser tests. Inspect exported artifacts when the flow changes.
5. Record commands, results, screenshots, exceptions and feature coverage. A
   blocked test is not a pass. Fix failures before committing that piece.
6. Review the complete diff, then make a focused commit with validation evidence.
   Never silently bless a visual regression or weaken a functional assertion.

Maintain a gallery/reference of shared controls and editor states. CI checks token
and contract drift, forbidden arbitrary UI styling, and reference screenshots.
Screenshot updates require visual review. A new state/component is incomplete
until its inventory and tests are added. Final family sign-off repeats the same
journeys across all apps; it is not inferred from the pilot alone.

<!-- END CLOAKYARD AIR CONTRACT -->

## CloakPDF product requirements

- Scope: landing, all standalone utilities, persistent editor, every tool panel,
  overview/thumbnails, canvas overlays, command palette, export, privacy, AI model
  flows, loading/error boundary, encrypted-file notices and PWA updates.
- Document content remains local. Static code, OCR language data and optional AI
  models may require downloads. Do not promise cold-cache offline availability.
- Keep the stage mounted when tools change; preserve zoom, selection, history,
  document bytes, cancellation, progress and export behaviour. Mobile retains a
  reachable preview and working panel; short/landscape layouts need real reflow.
- PDF content, annotation colour, redaction masks and signature strokes are user
  content. The canvas surround, selection controls and every custom widget use Air.
- Redaction must permanently remove selected content using the existing verified
  export path. Preserve rasterisation/file-size/selectable-text disclosures.
- Keep standalone multi-input/security/read-only tools distinct from single-document
  editor operations. Registries own tool identity and availability.
- Preserve model consent, hardware requirements, download size/progress/cancel,
  cache/error/retry states, and source-grounded Ask PDF behaviour.
- Required gates before a code commit: `vp check`, `pnpm check:dead`, `pnpm test`,
  `pnpm run build`, and applicable `pnpm test:e2e:smoke`, `pnpm test:e2e:extended`
  and `pnpm test:e2e` suites. Inspect exported results and run the family visual
  matrix; never infer all-feature coverage from the home page.
- Keep a per-component/state inventory and evidence in `docs/air/`. Local tokens
  and this complete contract travel with the repository.
