---
name: CloakPDF — Cloakyard Air
version: 1.0.0
status: design-review
date: 2026-10-11
scope: complete-web-product
family-contract-sha256: 2b0b13f20830fc01ed37bcbc0f02af03df6e72523e72797df2683122d0ee21b5
---

<!-- BEGIN CLOAKYARD AIR CONTRACT -->

# Cloakyard Air design contract

Version: **1.0.0 — refinement 03 candidate** · Direction: **Air** · Updated: **2026-10-11**

The Air direction is approved. This detailed refinement is **under design review**;
product migration waits for that review. The reference is an interactive design
study, not an implementation of the products.

This is the portable design contract for the Cloakyard web family.
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

## 2. Visual signature — the Air identity

Air should be recognisable with the logo covered. Its identity comes from the
relationship between open space, precise edges, neutral working surfaces, and one
quiet blue indicator. It does not depend on a framework's default component skin.

### Open composition

- Group by proximity: 8px for one control's parts, 12px between related controls,
  24px between tasks, 48–64px between page sections. Start with open space; add a
  divider only for a genuine boundary. Do not put every group in a card.
- Landing pages have a light, centred promise and an open product row. An editor
  has one containing surface, a persistent canvas and unboxed inspector groups.
  Quiet family navigation gives way to task actions inside the workspace.
- Hero/section display uses weight 400 with tight optical tracking. Headings must
  have natural line breaks at each size; do not simply scale a desktop screenshot.
- Product text explains the job. Avoid technical ledgers, invented readouts,
  template-like feature grids and marketing counts.

### Matte surfaces and precise edges

- Opaque, subtly separated planes. No frosted forms or translucent reading areas.
  Small shadows explain elevation; surface steps do most of the work.
- Inputs, textareas and selects have one continuous 1px `line-control` border,
  a solid surface and no inset shadow or bottom-edge accent. On focus, replace the
  resting border with a single 2px blue outline at zero offset; make the border
  transparent so two contours never compete. Field geometry does not move.
- Buttons may use a soft top/side edge and a firmer lower edge. That elevation
  treatment never carries into data-entry fields. Persistent labels and nearby
  help provide clarity without decoration.
- Neutral primary actions, 10px corners, 14px/500 labels, 16–18px icons, 8px icon
  gap, and 16px side padding. A standalone icon is optically centred in its box.
- Nested geometry is deliberate: an 18px outer surface with an 8px inset gives a
  10px inner corner. Do not accumulate unrelated radii or padded card layers.
- Icon art uses the existing Lucide family at 1.6 stroke for 18–24px UI icons;
  preserve original family/product marks. No decorative icon backplates everywhere.

### A restrained, ownable blue signature

- Selected rails use a neutral tile plus a 2×16px blue marker. It sits on the
  leading edge of a vertical rail and the bottom edge of a horizontal tool dock.
  Selected segments use the same neutral surface and a small blue marker.
- Focus, meaningful links and selection use shared blue. Logo colours may remain;
  they never tint the whole app or create a rainbow of tool categories.
- The landing signature is a low-contrast light horizon: two offset, softly lit
  planes echo the family mark's overlapping geometry. It occupies the space below
  hero copy and above product entries. Text remains on a solid, quiet background.
  No generic purple glow, animated blob, cosmic backdrop or GPU effect in editors.

### Two equally designed appearances

- Light: near-white page, white working surfaces, cool matte canvas surround,
  graphite text and discreet contact shadows.
- Dark: graphite page, raised solid surfaces, visible edge separation and brighter
  blue indicators. Never obtain dark mode by simply inverting a light screenshot.
- Every selected, focused, disabled, error, warning and busy state is reviewed in
  both themes. Disabled controls stay identifiable, even though contrast exceptions
  apply to disabled content. Colour is never the only carrier of meaning.
- System appearance is the default. An explicit user choice may select light or
  dark. Switching theme is immediate; it does not animate the whole workspace.
- Paper stays white and actual image colours stay intact. The surrounding UI
  adapts; user-created content and export typography do not.

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
- Weight 400 for body and display; 500 for labels/workspace headings; 600 for limited emphasis.
  No 700–900 display or control weights. Logos and document output are exempt.
- Hero: `clamp(2.5rem, 5.5vw, 4.5rem)`, weight 400, line-height 1.05, tracking
  `-0.045em`. Section title: `clamp(1.75rem, 3vw, 2.75rem)`, 400, 1.15,
  `-0.03em`. Workspace/dialog heading: 20–24px, 500, 1.25.
- Page prose 16–18px/1.6; UI body 14px/1.5; labels 13px/1.4; metadata minimum
  12px/1.5. Mobile editable text remains at least 16px to avoid focus zoom.
- Sentence case. Tabular numerals for dimensions, sizes, percentages, and aligned
  counts. No tracked uppercase eyebrows, pipeline IDs, or marketing tool counts.
- Natural word boundaries; wrap long filenames/URLs without forcing normal prose
  into arbitrary letter breaks. Never shrink text to conceal overflow.

### Geometry

| Primitive              | Normative value                                   |
| ---------------------- | ------------------------------------------------- |
| Spacing scale          | 4, 8, 12, 16, 20, 24, 32, 48, 64, 96px            |
| Page max width         | 1200px                                            |
| Page gutters           | 16px phone; 24px tablet; 32px laptop/desktop      |
| Marketing header       | 72px desktop; at least 64px narrow                |
| Editor top bar         | 64px; may wrap/reflow on narrow screens           |
| Icon rail              | 72px desktop; 64px compact, with labels/tooltips  |
| Inspector              | 288–360px; 328px default desktop                  |
| Content entry panel    | 420px writing default; 360px compact; up to 560px |
| Control radius         | 10px                                              |
| Small chip/tab radius  | 8px                                               |
| Panel/card radius      | 18px                                              |
| Dialog radius          | 20px                                              |
| Floating menu radius   | 12px                                              |
| Normal control height  | 40px; 44px minimum touch target                   |
| Compact control height | 32px on fine pointers only                        |
| Field/row interior     | 12–16px; section group gap 24px                   |
| Reading measure        | 65ch maximum                                      |

Full-bleed app rails may meet an edge without rounded outer corners. Do not nest
several padded cards. Use whitespace and modest section dividers inside inspectors.
Primary action groups contain one dominant action. A 2px focus outline with 3px
offset uses `accent` and remains visible inside scrolling and clipped containers.
Fields use the single-contour exception above: zero-offset outline, transparent
resting border during focus, no box shadow. Invalid fields retain a nearby error
message when the blue focus contour replaces their red resting border.

Elevations use a contact shadow plus a diffuse shadow, never a thick glow:

| Surface | Light shadows                                | Dark shadows                                 |
| ------- | -------------------------------------------- | -------------------------------------------- |
| Panel   | `0 2px 6px #18223404, 0 12px 32px #18223408` | `0 2px 6px #00000012, 0 12px 32px #00000020` |
| Menu    | `0 2px 4px #10182806, 0 12px 32px #10182814` | `0 2px 4px #00000020, 0 12px 32px #00000040` |
| Dialog  | `0 2px 8px #10182808, 0 24px 64px #10182824` | `0 2px 8px #00000024, 0 24px 64px #00000060` |

Dark mode also requires opaque surfaces and `line` separation. Scrim:
`rgb(12 18 28 / 40%)`.
No glass blur behind forms, body copy, tables, or document content.

## 4. Component contracts — custom controls included

| Component                       | Required shared behaviour and appearance                                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Brand/header/footer             | Same wordmark spacing and header rhythm; existing family mark, 28px in editor (24px compact) and 36px marketing. Compact neutral footer with product links, privacy, source, and version where useful. |
| Buttons                         | Sans label; stable box; neutral secondary; monochrome primary; visible hover/press/focus; descriptive action verb; busy state preserves width.                                                         |
| Icon buttons                    | Accessible name, tooltip for unfamiliar meaning, 40px fine/44px touch target; selected and disabled semantics.                                                                                         |
| Text/number/date fields         | Visible persistent label; shared boundary, height, radius, focus; unit beside value; help/error beneath; correct input type and autocomplete.                                                          |
| Select/listbox                  | Native semantics or established accessible primitive; same field shell; arrow inset; wrapping long labels; keyboard navigation; viewport-aware menu.                                                   |
| Check/radio/switch              | Label and control share hit target; explicit state; keyboard operation; same accent/focus.                                                                                                             |
| Slider/scrubber                 | Label, current value/unit, keyboard input, touch-friendly hit area, reset or precise entry when needed; no hidden critical gesture.                                                                    |
| Segments/tabs                   | Neutral group, one clear selection, correct roles/states and arrow keys where expected; same radius/density.                                                                                           |
| Tool/section rail               | Stable order, labels/accessible names, neutral selected tile and blue indicator; search/more access on small screens; no coloured tool rainbow.                                                        |
| Inspector/entry group           | Consistent heading, help, spacing and primary action; advanced settings disclosed; controls stay in reach on short screens.                                                                            |
| Colour picker/curves            | UI shell follows Air; actual colour field/histogram/curve are functional data, not branding. Provide labels, numeric entry, focus, clipping protection.                                                |
| Lists/layers/history            | Same row states, selection/focus, progress and empty-state language; long names wrap/truncate with full-name access; accessible reorder alternatives.                                                  |
| Drop zone/import                | Clear local-file action and supported types; equivalent browse action; drag-over, wrong type, encrypted/invalid/large-file states; readable progress.                                                  |
| Dialog/sheet                    | Named title/description; close, scroll body, action region; focus containment/return; Escape; background inert; preserve state across resizing.                                                        |
| Popover/menu/tooltip            | Anchored, viewport-aware, opaque; common elevation/radius; keyboard dismissal; no clipping inside parent scroll regions.                                                                               |
| Toast/notice/error              | Shared icon/text/action layout, semantic role/live region, understandable recovery; never cover primary or modal actions.                                                                              |
| Progress/AI model state         | Honest determinate progress when known; explicit size, consent, download/cancel/retry/error/cached/ready states; no fake percentages.                                                                  |
| Rich text/signature/drawing     | Air toolbar and focus; preserve content formatting; keyboard/tap alternative where feasible; undo/reset; visible selection.                                                                            |
| Privacy/help/404/error boundary | Same typography, width, navigation and controls; clear return/retry path; technical detail only when relevant.                                                                                         |
| PWA/install/update              | Same notice/dialog language; do not reload over unsaved work; readable offline/cache/download distinctions.                                                                                            |

### Dense editor controls

These patterns are required by the existing PDF tools; they also govern the
same controls in IMG, Resume and future apps.

- **Mode/position grids:** compact labelled mode choices share the neutral selected
  surface and blue marker. Preserve spatial meaning for a 3×2 page-position grid;
  do not flatten it into a list. Every cell has a meaningful accessible name and
  a 44px touch target. A selected mode is distinct from a selected document object.
- **Signature/image sources:** Draw and Choose are source modes. Drawing has a
  clear/reset action and an equivalent image chooser; neither a typed-name generator
  nor a style selector may replace those existing capabilities. Realistic ink and
  opaque background are independent switches. Actual ink, alpha and image preview
  are output data; the surrounding canvas border, labels and controls use Air.
- **Switch rows:** one unboxed label/help group with a 44×44px control target.
  Inside it, a 40×24px track contains an 18px thumb. Off is neutral; on uses accent.
  The thumb position and exposed switch state convey the value without colour alone.
  Focus replaces the track edge with one 2px zero-offset outline; do not draw a
  second box around its larger hit area. Space toggles a focused switch; the
  associated label is clickable. Keep dangerous
  bulk operations as explicit actions, not switches.
- **Date/time:** the field trigger uses the same single-contour shell. Calendar,
  year list, hour/minute menus and AM/PM controls share panel/menu styling, focus
  return and viewport containment. Preserve the current date restrictions and time
  semantics. Coarse calendars need room for seven 44px columns; use a full-width
  sheet on a 320px phone with a 4px calendar-grid inset, rather than shrinking cells.
  The other sheet content keeps the normal gutter. Short screens scroll the body
  while dismissal and completion stay reachable.
- **Field insertion:** page/date/file-name chips insert at the last active text
  caret and return focus there. They wrap into rows and keep 44px touch targets;
  ordinary chip labels are sans. Template variables may remain verbatim user data.
- **Lists and reports:** bookmark nesting/page targets, attached files, form fields,
  detected matches and privacy counts use open rows with labels and aligned actions.
  Preserve user-supplied field-name casing. Empty, detecting, ready, no-match, failed,
  disabled and destructive states need separate examples and recovery paths.
- **Apply semantics:** a tool with one staged operation has one Apply action. On
  mobile the persistent Done action may execute it; it is disabled until ready.
  Cancel rolls back the tool's pending transaction. Tools with multiple operations
  keep their distinct actions, and export-time redaction must retain its explicit
  permanence notice. Do not reinterpret Done as a harmless preview toggle in a real
  transactional editor. The reduced study must label its narrower behaviour.

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
- Two shared editor compositions preserve the existing task flow. PDF and IMG use
  rail → stage → right inspector (328px, 288px compact). Resume uses rail → left
  writing panel → preview (420px reference; 400–560px where space allows, 360px
  compact). These are family variants, not permission to vary control styling.
- Numerical controls pair a slider with an editable, labelled value and unit.
  Both share the same value, limits and keyboard behaviour. Invalid intermediate
  input remains editable and receives nearby feedback; never silently coerce it.
  Use the same single-contour field, 32px minimum only for fine-pointer density,
  44px on touch. Histograms/curves remain functional content within neutral shells.
- Writing rows combine type, value and keyboard reorder actions with open grouping.
  Rich text, image/logo pickers and date fields retain their full behaviour and
  follow the same field/focus rules. Do not replace these with plain text inputs
  during migration merely because a reduced design specimen uses plain text.
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

Use content-driven reflow with shared breakpoints at 640, 768, 1024, and 1280px. Inspect
one pixel either side of changed breakpoints. A product may add a breakpoint only
for a documented content collision, without inventing a new visual language.

The breakpoints have defined jobs: 640px changes page composition and dialogs to
sheets; 768px moves an editor from side-by-side chrome to preview + working
panel with a persistent tool selector and relevant actions; 1024px restores full inspector/rail density; 1280px expands page
composition. Preserve all tools when reflowing. Tablet is designed deliberately,
not treated as a stretched phone. A writing app may keep a form/preview split
instead of an image-editor ordering, with the same component geometry.

Mobile tool selection and Apply/Cancel (for transactional tools) stay outside the
panel's scrolling body. An always-visible second dock is not required; use the
shared tool picker when it gives the active controls more space. Autosaved writing
must not acquire a misleading Apply/Cancel transaction. Short landscape uses a
scrollable working region or explicit edit/preview modes, never a rotation gate.

At minimum phone width, the editor must reserve space for the document and the
working control region. Each scrolls intentionally. Expanded preview returns to
the same tool and input values. A short landscape screen and an open software
keyboard must not hide the close, apply, export or navigation actions.

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
  `cubic-bezier(0.77, 0, 0.175, 1)`. Sheet easing: `cubic-bezier(0.32, 0.72, 0, 1)`. No per-app timing scale.
- A completion acknowledgement may settle from 4px/0.96 scale over 240ms, once.
  A landing entry may use a single 600ms light arrival. These are the moments for
  playful character. Avoid bouncing controls, moving text, repeated reveals and
  continuous decorative activity during work.
- Pointer hover may move a directional arrow by 2px over 160ms. Press uses 0.98
  scale for 120ms; release returns from the current state. No hover lift on touch.
- Dialogs enter from 4px/0.98 over 240ms and exit over 160ms. On phones they rise
  from the bottom with sheet easing. Keyboard activation and Escape are immediate.
  Focus moves as soon as opened; animation cannot delay access to controls.
- Rapid repeat actions retarget/cancel the current motion. Never queue entrances,
  restart progress, remount a content stage, or wait for animation to accept input.
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
