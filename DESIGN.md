---
name: CloakPDF — Cloakyard Air
version: 1.3.0
status: approved
date: 2026-10-29
scope: complete-web-product
source-repository: https://github.com/cloakyard/cloakyard
source-directory: design/air
family-contract-sha256: 6d62642bad78134466bad7527964fb304ad436610bb9b61b6bf1deafd99b70cb
---

<!-- BEGIN CLOAKYARD AIR CONTRACT -->

# Cloakyard Air design contract

Version: **1.3.0 — deliberate artwork replay** · Direction: **Air** · Updated: **2026-10-29**

The detailed Air system is **locked for implementation**. On 2026-10-13 the user
authorized one final agent review followed by implementation; that review is
complete. The reference remains an interactive design study, not proof of product
conformance. Each adopted surface still passes its own feature and device gates.

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

### Canonical source and inheritance

The main **cloakyard/cloakyard** repository owns `design/air/`: this contract,
tokens, component shells, reference interactions, motion and product appendices.
Every existing or future web app derives from that source. Product `DESIGN.md`
files are generated snapshots, not separate design authorities.

1. Change a shared pattern in Cloakyard first, including its anatomy, states,
   keyboard/touch behavior, responsive/theme rules and reference example.
2. Validate it there, then copy the complete contract and local assets as one
   revision. Each bundle records its source repository, directory, review status,
   contract SHA-256 and asset hashes. A bundle paired with another contract fails
   validation even if its individual assets are intact.
3. Product wrappers may adapt framework APIs and domain behavior, but cannot
   redefine tokens, geometry, states or motion. Product appendices add constraints;
   they do not override the family contract. Proposed exceptions return upstream.
4. Keep a product's adopted revision pinned until its affected feature and visual
   checks pass. Synchronization updates the candidate reference; it is not runtime
   adoption. Never fetch the live specification or CSS at app startup.
5. Record changes and migration requirements with the source commit. During design
   review, content hashes identify exact candidate revisions; `1.0.0` is the target
   contract version, not a production-release claim. After approval, breaking
   changes increment major, additive patterns minor, and compatible fixes patch.

A new app starts with the complete portable contract, its own surface inventory
and product appendix, the same local bundle and the same drift/portability checks.
Standalone builds work offline without another checkout. The central component
review matrix records remaining design work; each app still owns proof that its
real features and custom widgets conform.

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
- Focus outlines and selection use shared blue; hyperlinks use neutral ink. Logo colours may remain;
  they never tint the whole app or create a rainbow of tool categories.
- A landing may express its product through the material artwork defined below.
  The existing low-contrast light horizon remains a family option: two offset, softly lit
  planes echo the family mark's overlapping geometry. It occupies the space below
  hero copy and above product entries. Its light follows the app mark, using the
  primary gradient stop in light mode and the highlight stop in dark mode. Text
  remains on a solid, quiet background.
  No generic purple glow, animated blob, cosmic backdrop or GPU effect in editors.

The landing artwork uses the following original logo colours. Set the horizon's
CSS `color` to its canonical `--air-light-{app}` token (lowercase app name); the
shader reads that computed colour and static
SVG edges use `currentColor`. Keep the page and planes neutral. This artwork-only
palette never overrides `--air-accent`, focus, controls, or document/image output.

| Landing     | Light artwork | Dark artwork |
| ----------- | ------------- | ------------ |
| Cloakyard   | `#3975F6`     | `#6FC3FF`    |
| CloakPDF    | `#2563EB`     | `#74C7FF`    |
| CloakDrop   | `#338DAB`     | `#5FCDD6`    |
| CloakResume | `#10B981`     | `#6EE7B7`    |
| CloakIMG    | `#F4512C`     | `#FF9A76`    |

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
| `accent`        | `#285ad7` | `#9ebcff` | Focus, selection, active indicators   |
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

`paper-accent` keeps the light accent (`#285ad7`) on white document paper in either
appearance. Use it for on-paper selection handles and inline editing focus, where
the surrounding dark theme's brighter accent would lose contrast against white.
It never changes author content or exported colours.

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
- Shared component sizes use relative tokens: `text-body` .875rem, `text-label`
  .8125rem, `text-meta` .75rem, `text-editable` 1rem. The pixel values above describe
  a 16px root, not fixed text boxes. Let controls grow at enlarged text; never alter
  document artwork dimensions to compensate.
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

Touch target sizing is independent of layout width. A tablet or touch laptop must
not inherit 32px/40px targets from a desktop breakpoint. Check the effective hit
area of the whole labelled control, including inline clear, reorder, formatting,
calendar and review actions; a 16px checkbox is acceptable inside a 44px label row.

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

| Component                       | Required shared behaviour and appearance                                                                                                                                                                                                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand/header/footer             | Same wordmark spacing and header rhythm; existing family mark at 36×36px across landing, reading and editor headers, including tablet and phone. Never shrink the mark to fit chrome; retain at least a 44px interactive target. Compact neutral footer with product links, privacy, source, and version where useful. |
| Buttons                         | Sans label; stable box; neutral secondary; monochrome primary; visible hover/press/focus; descriptive action verb; busy state preserves width.                                                                                                                                                                         |
| Icon buttons                    | Accessible name, tooltip for unfamiliar meaning, 40px fine/44px touch target; selected and disabled semantics.                                                                                                                                                                                                         |
| Text/number/date fields         | Visible persistent label; shared boundary, height, radius, focus; unit beside value; help/error beneath; correct input type and autocomplete.                                                                                                                                                                          |
| Select/listbox                  | Native semantics or established accessible primitive; same field shell; arrow inset; wrapping long labels; keyboard navigation; viewport-aware menu.                                                                                                                                                                   |
| Check/radio/switch              | Label and control share hit target; explicit state; keyboard operation; same accent/focus.                                                                                                                                                                                                                             |
| Slider/scrubber                 | Label, current value/unit, keyboard input, touch-friendly hit area, reset or precise entry when needed; no hidden critical gesture.                                                                                                                                                                                    |
| Segments/tabs                   | Neutral group, one clear selection, correct roles/states and arrow keys where expected; same radius/density.                                                                                                                                                                                                           |
| Tool/section rail               | Stable order, labels/accessible names, neutral selected tile and blue indicator; search/more access on small screens; no coloured tool rainbow.                                                                                                                                                                        |
| Inspector/entry group           | Consistent heading, help, spacing and primary action; advanced settings disclosed; controls stay in reach on short screens.                                                                                                                                                                                            |
| Colour picker/curves            | UI shell follows Air; actual colour field/histogram/curve are functional data, not branding. Provide labels, numeric entry, focus, clipping protection.                                                                                                                                                                |
| Lists/layers/history            | Same row states, selection/focus, progress and empty-state language; long names wrap/truncate with full-name access; accessible reorder alternatives.                                                                                                                                                                  |
| Drop zone/import                | Clear local-file action and supported types; equivalent browse action; drag-over, wrong type, encrypted/invalid/large-file states; readable progress.                                                                                                                                                                  |
| Dialog/sheet                    | Named title/description; close, scroll body, action region; focus containment/return; Escape; background inert; preserve state across resizing.                                                                                                                                                                        |
| Popover/menu/tooltip            | Anchored, viewport-aware, opaque; common elevation/radius; keyboard dismissal; no clipping inside parent scroll regions.                                                                                                                                                                                               |
| Toast/notice/error              | Shared icon/text/action layout, semantic role/live region, understandable recovery; never cover primary or modal actions.                                                                                                                                                                                              |
| Progress/AI model state         | Honest determinate progress when known; explicit size, consent, download/cancel/retry/error/cached/ready states; no fake percentages.                                                                                                                                                                                  |
| Rich text/signature/drawing     | Air toolbar and focus; preserve content formatting; keyboard/tap alternative where feasible; undo/reset; visible selection.                                                                                                                                                                                            |
| Privacy/help/404/error boundary | Same typography, width, navigation and controls; clear return/retry path; technical detail only when relevant.                                                                                                                                                                                                         |
| PWA/install/update              | Same notice/dialog language; do not reload over unsaved work; readable offline/cache/download distinctions.                                                                                                                                                                                                            |

### Field anatomy and validation

- One persistent label, 8px gap to the field, then help/error 8px below. Related
  fields share a 12–24px gap. Use the shared relative label/body/help typography;
  do not force equal-height error areas or truncate long assistance text.
- The single contour uses 10px corners and 8px block/12px inline padding. Height
  is at least 40px fine / 44px coarse and grows with its content. Editable text is
  at least 1rem on coarse pointers and narrow screens, independent of layout mode.
  A multiline field starts at 7.5rem and permits vertical resizing.
- Populated, empty, focused, invalid, read-only and disabled are different states.
  Read-only content stays full contrast on `surface-soft`, focusable and copyable;
  disabled controls cannot accept input or focus and explain why nearby. Never
  simulate read-only with disabled or hide a stored value behind placeholder text.
- Focus replaces the resting or invalid boundary with one blue contour. Keep the
  actual error and `aria-invalid` while focused. Hover does not add a new edge,
  shadow or motion. Numeric suffixes stay outside the editable value.
- Use native labels/types, meaningful names, appropriate autocomplete and input
  modes; placeholders are examples only. Connect help and errors with
  `aria-describedby`. Required and optional labels are explicit in ambiguous forms.
- Validate at blur/submit or the product's established completion boundary, not
  halfway through composition. On submit, preserve all values, expose actionable
  errors, announce the outcome and focus the first invalid field. Correcting a
  value clears its error at the next validation boundary; never report success
  while another field is invalid. Allow paste, undo and IME without interception.

### Compound search and numeric fields

- A compound field has one `air-field-group` boundary and no interior input
  border, underline or shadow. Input focus replaces only that outer contour.
  Focusing an embedded action instead identifies that action with an inset ring;
  it must not add a second field contour. Invalid, disabled and read-only styles
  belong to the complete group, with help and errors outside it.
- Keep 12px text inset, 10px corners and shared field typography. Units sit after
  the value with a 12px trailing inset. Let an unusually long unit wrap within
  half the field; preserve room for editing. Never append a unit to the editable
  string or shrink the number to fit. Expose the unit in the label or description,
  and hide a duplicate visual suffix from assistive technology.
- Search has a persistent label and one named clear button. Its glyph remains
  small, but its target is at least 44×44px; the containing field may grow to 46px
  to enclose it. Reserve this space when empty to avoid value-width movement.
  An empty clear action is visually hidden and absent from focus/accessibility.
  Clearing restores focus to the input and the full result set. Suppress the
  platform's duplicate search-cancel decoration only when this equivalent exists.
- Filtering preserves the typed query, handles composition before updating
  results, and announces meaningful result-count/no-results changes without
  moving focus. No-results copy offers recovery. A product search still needs its
  real loading, failure, result-navigation and selection behavior validated.
- Numeric controls use native number semantics, explicit bounds/step and suitable
  input mode. The reference hides platform spinner chrome while retaining native
  arrow-key stepping and direct entry; do not add a second keyboard implementation.
  If visible steppers are needed in a product, specify and validate them upstream.
- Empty, out-of-range and fractional values remain editable; validate on blur or
  apply, preserve the draft and last committed value, and focus invalid input on
  submission. Never silently clamp, round, reset or apply an invalid number.
  Disabled/read-only values keep the base field rules. No typing or focus motion.

### Action states and stability

- Use a real button for actions. Ready, busy, success and recoverable failure
  retain the same geometry and hierarchy. Reserve the intrinsic size of all
  translated labels (including wrapped height), using shared `air-action-labels`;
  expose only the current accessible name. Do not hardcode a pixel width or
  shrink labels to hide layout movement.
- Busy begins when work actually starts, remains until it settles, and prevents
  duplicate pointer, keyboard and programmatic activation. A focused action may
  use `aria-disabled` with a guarded handler to preserve focus; ARIA alone does
  not block execution. `aria-busy` identifies work, with a separate concise live
  status outside that busy subtree. Keep the label readable at full contrast.
- Give successful completion a truthful result and clear next action. Recoverable
  failure keeps input/work intact, explains the failure and offers retry. Do not
  automatically reset a result on a timer or move focus for an ordinary outcome.
  Cancellation must actually stop or safely disregard pending work; stale results
  must not overwrite a newer attempt. Production adapters own and test that lifecycle.
- Frequent action-state changes are immediate, with no pulsing text, perpetual
  decorative spinner or artificial delay. If real work supplies progress, use an
  honest progress component; never invent a percentage. Existing pointer press
  feedback respects disabled/busy, keyboard and reduced-motion rules.
- The reference provides explicit start/resolve/cancel controls for a deterministic
  state study. Its outcomes are simulated and process no files. Only those study
  controls return focus before disabling themselves; this does not authorize
  production focus jumps. Validate real async cancellation/races in each adapter.

### File acquisition and measured progress

A file area has one matte surface, one control-strength contour, an explicit
browse action and visible format/count/size help. The drag state changes the
same plane to `accent-soft` with an `accent` edge; never add a second inset frame,
a pulsing outline or a decorative upload animation. The filename, size and Remove
belong in a ruled row within that plane. Wrap long names without widening the
page. Keep the preview in its own working region, not behind the drop target.
At 960px and below, the reference stacks selection before preview; this documented
content breakpoint accommodates two readable columns. Use the same 32/24/16px
page gutters and inherited theme/control rules. This composition is a study, not
a requirement to replace each editor's established panel ordering.

- Browse, drop and paste feed the same validation and selection operation.
  Browse remains available to keyboard, touch and assistive technology; dragging
  is never required. Keep the actual native file picker. Reset its value after a
  pick so choosing the same file works. Cancelling the picker leaves work intact.
- Define supported types, count and size in the product adapter, and show them
  before selection. The HTML `accept` hint is not validation. Validate decoded
  contents where the format requires it; an extension or MIME type alone does not
  prove validity. Wrong type/count/size retains the previous valid selection and
  offers a specific correction. Corrupt/encrypted files need domain-specific
  recovery, not a generic network-error message.
- A missed file drop must not navigate away from work. Nested drag targets must
  not flicker. Stop accepted drop propagation to avoid opening the same file twice.
  Do not intercept links/text dragging or paste into editable fields. Paste controls
  explain empty, unavailable or denied clipboard access and keep Browse available.
  A pending clipboard read cannot replace a newer selection or removed item.
- Reserve action geometry for every translated state. There is one primary next
  action: Browse when empty, Preview/Process when ready, Continue when manually
  paused, Retry on recoverable failure. A busy initiator remains focusable with
  guarded `aria-disabled`; never dispatch twice. Removing a focused control returns
  focus to a surviving action. Do not steal focus for background progress updates.
- Known progress reflects completed work in its actual unit, with an accessible
  name, minimum, maximum, current value and readable count. Unknown totals use
  phase/received-work text and an indeterminate progress role without `aria-valuenow`;
  hide the determinate fill. Never invent percentages, ETA, completion or timed
  progress. An empty file gets an explicit message without a misleading full bar.
  A 6px accent fill has no interpolation, shimmer, spinner or shader work.
- Announce phase changes/errors politely outside busy content, not every byte.
  Keep errors next to the operation with a recovery action and preserved input.
  Cancellation stops the underlying reader/worker/request when supported, invalidates
  stale results, releases pending waits/resources and preserves useful partial work.
  Replacement, removal and teardown invalidate earlier completions too. Retry has a
  defined restart/resume policy; do not imply resumability that the engine lacks.
- The standalone `files.html` reference actually reads local UTF-8 `.txt`/`.json`
  files up to 4 MiB, with a bounded 1,200-code-point text preview and safe text rendering.
  It does not parse JSON, import a résumé, decode images, read PDF structures, upload,
  persist or modify originals. The optional halfway pause, interruption and hidden
  total are labelled study controls. Retry rereads from byte zero. Product adapters
  still require their real error/cancellation/export and cleanup tests.

### Choice anatomy and semantics

- Checkbox/radio glyphs occupy 18×18px with a 1px `line-control` boundary. Checkbox
  corners are 4px; radio corners are circular. Selected glyphs use `accent` and a
  contrasting `surface` tick/dot. Mixed checkbox state is an 8×2px dash, exposed
  through the native `indeterminate` property, never a misleading checked value.
- The entire label is a minimum 44px target with 12px glyph/text separation. Align
  the glyph to the first line when the label wraps. Disable the actual input,
  not just its styling; keep the reason visible. Use a fieldset/legend for a group.
- Native inputs own checkbox Space, radio arrow-key traversal and form values.
  Mutually exclusive segmented choices use one native radio group (or an already
  established accessible equivalent); all-selected and partial-selected checkbox
  groups accurately reflect their children. Tabs control named panels and retain
  tab semantics; action/toggle groups must not pretend to be tabs.
- Segments keep the shared neutral selected plane and 2×16px blue marker. Native
  radio inputs inside those segments retain one group Tab stop; focus outlines the
  selected label, without exposing a second invisible-control contour. Buttons
  retain `aria-pressed` only when they truly toggle or act as an existing choice
  adapter. Explicitly test disabled choices and arrow navigation.
- Selection changes are immediate. No tick drawing, bounce, sliding selection
  pill or delayed state change in frequently used controls. Forced-colour mode
  uses native checkbox/radio glyphs and system focus/selection colours. Both
  ordinary themes keep the exact same geometry and contrast-tested indicators.

### Overlay anatomy and acceptance

- Dialogs use the native modal top layer or an established accessible primitive:
  a visible title, concise description, clear dismissal, scrollable content and
  one primary completion action. The background is inert. Choose initial focus
  according to the task; dangerous actions never receive automatic primary focus.
- The 576px maximum reference dialog has 24px padding, 20px corners and shared
  elevation. At 640px and below it becomes a full-width bottom sheet with safe-area
  padding. Keep 16px viewport clearance above it; never force a minimum body height
  that pushes actions off a short screen. Footer actions wrap at enlarged text.
- Scroll stays in the overlay, keyboard-focused content cannot hide behind sticky
  actions, and long names/validation never widen it. Preserve entered values on
  viewport/theme changes. Nested selects use the top layer and close before the
  containing dialog when Escape is pressed. Closing returns focus to the trigger.
- Test open, mid-transition dismissal/reopening, invalid input, long content,
  nested picker, short screen, enlarged text, focus traversal and reduced motion.
  A popover, tooltip, context menu or destructive confirmation needs its own real
  state example before adoption; an export dialog alone does not certify them.

### Floating surfaces and safe action handoffs

- A settings popover is a small, non-modal form; an action menu is a keyboard
  command list; a tooltip is supplemental text. Do not interchange their roles.
  Use established accessible primitives for focus, dismissal, typeahead, pointer
  handling and positioning. The reference uses locally bundled Base UI 1.9.0;
  wrappers may adapt frameworks, but must preserve this contract and its behavior.
- Floating content uses an opaque `surface`, `line` edge, 12px corners and the
  shared menu shadow. Keep 8px from the trigger and at least 16px from viewport
  edges. Portals escape clipping ancestors; flip/shift near edges, constrain to
  available space, wrap labels and scroll inside the surface. Resizing, scrolling
  and theme changes preserve the current state and keep actions reachable.
- Menus are 18rem wide before viewport constraints, with 8px padding. Rows have
  8px block/12px inline padding, 8px corners and 40px fine/44px coarse minimum
  height. Hover uses a neutral surface; keyboard focus adds an inset 2px blue
  outline. Checked actions use a trailing blue tick and checked semantics.
  Disabled items explain their unavailable state and cannot activate. A divider
  separates destructive actions; danger colour always accompanies explicit text.
- Enter/Space or arrow keys open the visible action trigger. Menu primitives own
  arrows, Home/End, typeahead, selection, Tab and Escape. A contextual menu exposes
  the same actions through a visible button on touch/keyboard; right-click or long
  press can never be the only path. Dismissal returns to the actual source control.
- Popovers use 20px padding and a 20rem preferred width, with named title and
  description. Keep native fields, labels and validation inside. Touch opening
  focuses the surface instead of unnecessarily raising a software keyboard;
  keyboard navigation enters the controls normally. Non-modal outside interaction
  and Escape dismiss; nested pickers dismiss before their containing popover.
- Tooltips have 8px block/12px inline padding, 13px relative text and an 18rem
  maximum width. Hover waits 400ms; focused controls show the hint immediately.
  Adjacent hints may appear immediately. Keep the hint hoverable and dismissible
  with Escape; never put a required instruction or interactive control only in a
  tooltip. Its trigger keeps a meaningful name and works on touch without the hint.
  Expose the visible hint as `role="tooltip"` and connect it with `aria-describedby`;
  verify this association in the rendered adapter instead of assuming a library adds it.
- These frequently used floating surfaces appear immediately. Reserve motion for
  occasional dialogs: pointer entry 240ms, exit 160ms, shared curves; keyboard
  opening/dismissal and reduced motion are immediate. The desktop dialog moves
  4px/.98; the phone sheet rises from below. Animate transform/opacity only.
- Menu-to-dialog handoffs must move focus into the dialog without a menu's closing
  callback pulling it away. Form dialogs focus the first field on fine pointers
  and the surface on touch, retain invalid drafts, show nearby error text, and
  focus the invalid field on submit. A long filename never changes dialog width.
- Destructive confirmation names the object and consequence, focuses the safe
  action first and ignores backdrop presses. Escape cancels. On removal, return
  focus to the logical recovery/next control if the original trigger no longer
  exists. Restoration preserves the object's name/state. Real permanent actions
  must describe their actual recovery limits; study-only undo is not a product promise.
- The reference's rename/remove/restore operations affect only an in-memory sample.
  Its lazy bundle, licenses and revision hashes travel with the portable gallery;
  loading errors have a retry path. Validate actual product operations, layered
  overlays, assistive technology, software keyboards and browser engines separately.

### Select anatomy

- Every single-value dropdown uses the shared field contour, 12px inline inset,
  16px chevron and at least 12px between its value and icon. The chevron has a
  stable reserved box; it never touches the field's trailing edge. Focus remains
  one replacement contour, including while validation text is present.
- The open picker uses the opaque `surface`, `line` edge, 12px menu radius,
  shared menu shadow and 8px inset. Its width follows the trigger, with a 15rem
  readable minimum capped by the viewport. Long labels wrap; lists scroll within
  the available space above or below the trigger. Rows use 8px block/12px inline
  padding, 8px corners, 40px fine/44px coarse minimum height, and the UI sans family.
- Selected rows have a neutral surface and blue checkmark at the trailing edge.
  Hover uses `surface-hover`; keyboard focus has a 2px inset blue outline.
  Selection, opening and dismissal are immediate in frequently used selects.
  Disabled choices remain identifiable and cannot be selected.
- The reference styles native `base-select` pickers so semantics, typeahead,
  keyboard traversal, form values and top-layer placement remain native. Its
  unsupported-browser fallback preserves native operation and the inset arrow,
  but does not certify a custom menu appearance. The collection reference uses
  pinned Base UI Select with this same Air trigger, popup, options and focus rules.
  Production React selects use this accessible adapter across all target engines
  rather than switching their visual language with browser support. Validate form
  association, disabled/invalid/read-only states, typeahead, dismissal and portal
  nesting in each integration. Native progressive enhancement remains appropriate
  for the static reference and minimal-script sites. Do not hand-roll a second
  keyboard/focus system or import the study's bundled React into an app.

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

### Colour selection

- Use a circular hue/saturation wheel for arbitrary author colours: red at the top,
  hue clockwise, white at the centre, full saturation at the rim. Keep it 208px
  across when space permits, shrinking with the panel. The cursor follows the
  exact same polar mapping as the displayed colours; no animated selection lag.
- One labelled brightness control follows the wheel, then exact hex entry and an
  optional “Fine tune hue & saturation” disclosure with independent native ranges.
  Those ranges provide full keyboard and assistive access without a two-axis ARIA
  slider. Show each value and unit. Do not require dragging or colour perception.
- The wheel shows available colours at full brightness. Its thumb and swatch show
  the actual selected colour. Preserve brightness when choosing hue/saturation;
  when starting at black (brightness zero), a deliberate wheel choice restores
  full brightness so it produces a visible colour. Merely opening never changes it.
- Preserve hue/saturation while moving through black/grey; an external value or
  Undo updates the picker. Invalid hex drafts show an associated error on blur and
  never change output. Pointer cancellation restores the colour before the drag.
- Keep presets as shortcuts. Use one shared implementation per product across
  text, shapes, strokes, fills, stamps and other tool colours. Opacity remains a
  separate labelled author setting. Eye-dropper features remain available where
  supported. Never tint UI surfaces to match the chosen author colour.
- Use the shared opaque popover and visual-viewport anchoring; scroll internally
  at short heights and enlarged text. Escape/close restores the trigger; fine-pointer
  opening focuses brightness, coarse-pointer opening does not summon a software keyboard.
  Wheel/colour pixels retain their colours in forced-colour mode while labels,
  focus and precise controls respect system contrast. Physical touch and spoken
  assistive acceptance remain product gates.

### Writing and structured entry

- **Rich text:** use the same single-contour field as plain text. Place the label
  and formatting toolbar above it, with 8px separation from the field; wrap the
  toolbar onto its own row when space is short. No second bordered container or
  underline around the field/toolbar group. Toolbar buttons use neutral selected
  surfaces and expose pressed state. Preserve the active field, caret and selection
  when activating formatting by pointer or keyboard. A toolbar shared by several
  fields must stay scoped to its entry and never format a different entry.
- **Long writing:** grow multiline fields without resetting the working panel's
  scroll position or moving the caret. The focused line must remain reachable
  with a software keyboard open. Preserve rich-text syntax, explicit line breaks,
  paste, undo and IME composition. Product-specific title limits are explained
  beside the field; do not truncate stored text to fit the chrome.
- **Repeated entries:** one plain heading/action row per role, project or group,
  followed by its fields. Use 24px between entries and 12px within a related field
  group; add one divider only where a long list needs a clear boundary. Nested
  bullets use open rows rather than another padded card. Keep reorder and removal
  actions separate from the editable area and give them the item's context in
  their accessible names. On narrow panels, move actions to a row rather than
  squeezing prose between two permanent action columns. Reorder keeps the edited
  item's identity/focus and announces its new position; removal is confirmable or
  undoable, with predictable focus after completion.
- **Partial dates:** month/year, year-only, empty and Present are distinct values.
  Do not replace them with a full-day picker or silently normalize imported text.
  Start/end fields share the normal shell; Current job is a labelled checkbox
  with a 44px row. Preserve the previous end date when toggling Current job during
  an edit. Month and year choices keep 44px touch targets at every width, use
  tabular sans numerals, and return focus after selection or Escape.
- **Writing hints:** validation errors and optional writing suggestions are
  distinct. Reserve space for a named hint action so it cannot cover text or the
  caret. Suggestions use readable text and explicit replacement actions in an
  opaque, viewport-contained popover; opening it never changes content. Returning
  from review lands on the named field, with one focus contour. Scores, counts and
  progress retain textual labels; no colour-only interpretation.
- **Pickers and review:** searchable icon/template libraries, colour controls and
  review tabs follow the shared overlay rules. Search has clear and no-results
  states; close returns to the originating control. Keep the chosen document
  template/colour separate from the application theme. A reduced study must name
  its limits and must not present invented controls as existing product features.

## 5. Composition and workflow

### Landing pages

Shared sequence: quiet header → short centred promise → direct primary action →
real product entry/preview where useful → concise capability groups → factual
privacy explanation → compact family footer. A subtle app-coloured light field may sit
below the hero copy. Avoid fake product capabilities, excessive feature counts,
industrial grids, oversized decorative icons, or compulsory dark sections.

The family home is a product directory. Each card says what the app does, its
platform, and how to open it. KERR is a text exploration link with brief context;
no screenshot, simulation, orbital illustration, animated preview, or embedded app.

### Product landing artwork

The approved extension keeps Air's header, typography, spacing, neutral links,
controls and surrounding surfaces. One contained composition between the promise
and primary entry gives an app its own identity. It replaces that landing's horizon;
do not stack multiple decorative effects or use an app screenshot as the hero hook.
An accurate product screenshot may remain in the following feature section.

- **Cloakyard:** the family opens out from its mark into five small, recognisable
  materials: paper, download pixels, résumé lines, an image and a photo strip. This
  explains the family without a product screenshot. One finite arrival uses 1,800ms
  ease-out transforms with a 60ms object stagger; details start at 640ms with 45ms
  staggering and finish within 4,300ms. Product artwork colours remain confined to
  these materials. Settle into a quiet collection; no looping orbit or moving text.
- **PDF:** five white pages start as a compact stack. The four rear sheets spread
  left and right over 2,200ms with the shared spatial curve and 60ms stagger,
  keeping their stacking order. The front page and real dropzone stay anchored.
  Settle open after one unveiling; do not loop, reorder, or animate file intake.
- **Drop:** square teal pixels descend into file, package, disc and archive forms.
  Show FILE, PKG, ISO and ZIP once per run, then keep the final form still. Use 720ms
  arrivals, a 3ms bottom-to-top row stagger plus at most 9ms scatter, 180ms
  dispersal with at most 24ms stagger and a 320ms hold between forms. The complete
  sequence stays under five seconds (4,764ms maximum active timeline). Use shared
  spatial/exit curves and linear descent with a gentle landing; never loop.
  These are illustrative file types, never a simulated real transfer or progress bar.
- **Resume:** a green career path with three milestones gathers into the spine of
  one white résumé over 3,400ms with the shared spatial curve. Keep the paper's
  name and content illustrative; do not imply automatic writing or hiring results.
  Run once and settle into a complete static résumé. No playback controls.
  The headline and real Start blank/sample/import/restore actions never move.
- Artwork uses only the product's existing `light-{app}` colour, neutral planes
  and truthful paper/image colours. The UI's focus, links and controls retain Air.
  Document lettering inside decorative paper is artwork, not a new UI font.
  White paper uses the fixed light `paper-ink` and `paper-line` tokens in either
  theme, alongside the existing `paper-accent`; surrounding controls use live themes.
- Static artwork renders without the animation module. Reduced motion, forced
  colours and constrained/save-data visits do not start decorative motion.
  For this lightweight transform/opacity artwork, constrained means a reported
  device memory of 4 GiB or less. Missing memory information is not a restriction.
  Never gate it on CPU count: WebKit's privacy-rounded four-thread value is not
  evidence that an iPhone cannot render it. The heavier reference shader retains
  its separate resource policy. Test artwork with four reported threads and no
  memory API in WebKit as well as Chrome; do not normalize every test to eight.
  Live preference changes settle immediately. Suspend offscreen and hidden; resume
  the same finite sequence on return. Cancel animations/listeners on departure.
- Landing artwork has no separate visible Play, Pause or Replay controls. Each
  automatic arrival finishes within five seconds and remains still; returning
  visibility or removing a motion restriction must not restart a completed sequence.
  After completion, click/tap the artwork itself to replay the same finite sequence.
  Ignore presses begun before completion and all rapid/repeated activation during a
  run; never interrupt, queue, or loop. The completed artwork is a native button
  overlay named “Replay {app} animation”, with Air's inset keyboard focus outline
  and a pointer cursor when ready; it has no background, border or hover motion.
  Enter/Space explicitly request the same replay (this is a media-like action,
  not animation attached to an unrelated keyboard command). Ignore held keys.
  Preserve focus during a replay, mark the target aria-disabled, and remove it from
  sequential Tab navigation until settled. Reduced-motion, forced-colour,
  resource/data restrictions, missing APIs and no-JS visits expose no replay action.
  Keep illustrative children hidden from assistive technology. The button covers
  only the reserved artwork, never the real upload, download or editor action.
- Keep the action usable before, during and after motion. Reserve the artwork's
  layout space, contain only its moving marks, and shrink ornamental space first
  in short landscape. Text and controls reflow at enlarged sizes. No fake upload,
  automatic file access, moving headline, or animation-dependent navigation.
- Use local transform/opacity animation with no new graphics/runtime dependency
  when it can express the approved material. Remove superseded production shader
  wrappers, styles, build artifacts and checks; preserve canonical reference assets
  still used by other products. Adopt new motifs only after their own visual review.

### Landing navigation and text resilience

The portable `air-page-*` shells own public header/footer geometry. Product classes
only arrange destinations and content: 36px marks; 12px mark/wordmark gap;
1.125rem/500 wordmarks with −.03em tracking; 72px wide/at least 64px narrow
headers; 44px brand and navigation targets; 14px-relative/500 navigation, 16px
icons and 8px icon gaps. Footers use 32px block padding, one top rule, 14px-relative
neutral copy, 8px/24px navigation gaps and 16px/32px group gaps. Public headers and
footers normalize macOS font smoothing to antialiased/grayscale; document output
keeps its existing rendering. Inline credit links
inherit copy and its persistent underline. Do not use a separate mark size or
wordmark scale on a reading/recovery route.

Public shell content follows the same recipe across the family:

- Header: product home identity, task/section destinations in their meaningful
  product order, then **Source** with ArrowUpRight linking to that product's exact
  repository. Desktop and compact navigation repeat identical labels, destinations,
  order and new-tab behavior. Use `Primary navigation` as the landmark name.
  Recovery pages may reduce task navigation to **Home**, followed by **Source**.
- Footer identity: product name (and the existing app version, where applicable),
  then **Built by Sumit Sahoo**, with the author name linked and underlined. Use
  `air-page-identity` for the two lines. Keep the version in the same text style;
  static recovery pages derive it from the same package version as the application.
- Footer navigation has exactly five destinations: **Privacy → Source → MIT license
  → Cloakyard → Buy me a coffee**. Source and License target the product repository and main-branch
  LICENSE. The family destination keeps ArrowUpRight. Use `Footer navigation` as
  its landmark. Privacy opens the actual policy; the directory links to its own policy and uses **All apps** (`/#tools`) in the fourth slot.
- The support link targets `https://ko-fi.com/sumitsahoo21`, uses ArrowUpRight,
  neutral ink in every state, and opens in a new tab with `noopener noreferrer`.
  It is a plain link: no widget, badge, tracking request, popup or extra footer row.
  Public home, privacy and recovery pages include it; editing workspaces and native
  applications retain their task-focused controls.
- Keep the footer one identity group plus one navigation group. Product directories,
  repeated Download actions and marketing copy belong in the main page, not an
  additional footer row. Preserve the directory copyright and existing app versions.
- The shared footer reserves the same 16rem identity and 48rem navigation bases,
  with five equal navigation tracks; compact containers use two tracks, then one
  at enlarged text when needed. At equal viewport/font/input settings all adopted
  footers have the same natural height. Do not force a fixed height or hide overflow.
  Validate cross-product bounding boxes, including reading and recovery pages.
- Reading and recovery pages retain the same identity, credit, labels, order and
  destinations. Recovery-specific reporting links belong with recovery actions.
  Editor toolbars remain functional variants; do not add marketing navigation to
  editing workspaces. Validate actual content and destinations as well as geometry.

- Hyperlinks with a directional cue use the angled Lucide ArrowUpRight shape
  (or its matching static SVG): Source, product/family destinations and reading
  links. Preserve the approved angled cue; consistency work must not substitute
  a different direction. Plain text links do not need an added icon.
- Forward app actions and same-page jumps retain ArrowRight. Back, download and
  disclosure controls keep their meaningful icons; editor artwork remains data.
  Preserve destinations, new-tab behavior and decorative icon hiding. Existing
  fine-pointer hover motion follows the arrow (2px right/up for angled links);
  keyboard focus and reduced motion stay still.
- Hyperlink text uses neutral ink throughout public pages: header/footer, product
  destinations, source/privacy invitations, installation guidance and reading prose.
  Standalone text links use `ink`; supporting navigation and Source use
  `ink-secondary`; inline links inherit the surrounding neutral prose. Preserve
  these colours in default, visited, hover, focus and active states. Never use
  `accent`, a product colour or browser-default blue/purple for hyperlink text.
- Inline prose links are always underlined, with a 1px current-colour line and
  3px offset. Standalone links keep their angled cue and gain an underline on
  fine-pointer hover. Neutral navigation may strengthen to `ink` on hover.
  Do not add arrow icons to every inline citation or remove existing link cues.
- Keyboard focus remains an immediate 2px shared-blue outline, with sufficient
  offset; active navigation may keep its blue marker/underline. These indicators
  do not recolour the link text. Forced colours respect system LinkText/VisitedText
  and focus colours. Button-styled links retain their neutral button hierarchy.
- Check every link in page content as well as navigation, including nested text,
  inline help, compact menus and all light/dark responsive states. Verify hover,
  keyboard focus and enlarged text. Run the portable `test:air-links` command
  against the built preview before committing public-page CSS. Do not infer
  conformance from Source alone. Document/image output links retain author colours; editor selection and semantic
  state colours remain separate from this public-page link treatment.

- Keep every destination available at every width. A compact header uses a native,
  in-flow disclosure; its links expand below the brand row without covering the
  page. Opening changes layout immediately, with no animated text/reflow. The
  family uses the same 40rem container boundary (compact at or below it), so larger
  text enters compact mode earlier. Inside the disclosure, the shared header shell
  owns one grid of links with no row gap, 12px top margin, a 1px rule and 8px top
  padding. Each link has 8px block/12px inline padding, at least 44px height and
  left-aligned content with the normal 8px icon gap. Compare menu mode and row
  geometry across apps; product link counts may change the open height.
  The summary chevron points up while open and down while closed, changing
  immediately. Use a 44×44px minimum brand/summary target independently of pointer type.
- Below 22rem of content width, use the family mark with the complete accessible
  home-link name. Do not fragment the wordmark across lines. The mark and chevron
  render without JavaScript. Native Enter/Space activation and Tab order work;
  an enhanced Escape closes the disclosure and returns focus to its summary.
  Link activation closes it when scripts run. Without scripts it stays in flow,
  leaving the destination unobscured and the explicit toggle available.
- Keep the promise, explanation and actions in one reading group. On short
  landscape screens, reduce ornamental gaps/light-field height before reducing
  type or moving the primary action out of the composition. Do not bottom-align
  unrelated hero columns. Body copy wraps naturally; avoid forced desktop breaks.
- Interpret UI type sizes as the 16px-root reference: author text with rem/em so
  user font preferences are respected. Preserve fixed document/canvas output as
  an explicit exception. Fields and labels must eventually follow the same rule;
  the current landing study does not certify all editor controls at enlarged text.
- Test both container bounds and actual text bounds, with menus open/closed.
  At 200% root font, let actions wrap and groups grow. A long product name may
  wrap at a deliberate word boundary; never reduce its type to hide overflow.

### Reading and recovery pages

- Public privacy uses the portable `air-policy` recipe in every product: an explicit
  **Back to {product}** link with ArrowLeft, **{product} · Privacy**, **Privacy policy**,
  a concise lead, the genuine revision date, then **On this page** and the document.
  The back link has a real home URL and works on a direct visit without history.
  Preserve meaningful product navigation and the same family header/footer.
  The footer marks Privacy with `aria-current="page"` and a neutral 1px underline
  at 3px offset; its label never turns blue.
- The shared recipe owns 48px top/64px bottom space (32px top on compact screens),
  a 32px gap after the return link, 48px before contents/document, a 14rem contents
  column and 65ch prose with a 64px gap. At 60rem containers or enlarged text the
  columns stack with 32px separation. Contents use the shared chevron disclosure,
  neutral links and blue location marker. No numbered technical eyebrows or fact
  grids above the policy. All section headings use 1.5rem/500 with 48px ruled spacing.
- Public privacy is a reading page, not a modal. Editors may retain an in-place
  policy dialog to protect work, using the exact same policy content and existing
  focus/close safeguards. Returning from public privacy never clears a saved draft.
- Keep policy facts and dates intact during a visual refresh. Native and website
  privacy are distinct; a shared layout does not authorize new privacy claims.

- Privacy, help and recovery use the same family mark, navigation, theme, footer
  and controls as the product. They are complete layouts, not unstyled text below
  a marketing header. Use one main heading, a skip link and stable section anchors.
  Active navigation uses text plus the shared 2px blue marker.
- Reading copy is 1rem/1.6, with a 65ch maximum measure; the lead is 1.125rem/1.65
  at up to 58ch. Use 1.5rem/500 section headings, ordinary paragraph/list rhythm
  and 48px between ruled sections. Keep information in open groups; do not turn
  each policy paragraph into a card. Long URLs/identifiers wrap without page overflow.
- Wide pages may pair a 14rem contents column with the reading measure and a 64px
  gap. At 60rem or narrower, contents return to document flow above the text.
  Use a native disclosure with at least a 44px summary and link targets, preserved
  without JavaScript. Escape may close it and return focus. Anchor targets have
  scroll clearance and are focusable for the next keyboard action. Never hide
  important prose in hover-only content or impose a fixed-height reading area.
- Page gutters are 32px wide, 24px below 60rem and 16px below 40rem. Header/footer
  links wrap without clipping or horizontal scrolling. At enlarged text, switch
  composition earlier; retain readable type and complete destinations.
- Keep a real product policy's meaning, supported features and revision date.
  Local processing, local drafts, model/resource downloads and native-app network
  activity are distinct facts. A family layout cannot make them interchangeable.
  The illustrative reading study is explicitly not a replacement product policy.
- A missing page gives a useful destination using a real link; never assume a
  browser-history entry exists. Product 404 pages must also return the correct
  route/server status; the reference only demonstrates their appearance.
- A recoverable failure explains what failed, what work is preserved and the next
  available action. Keep the content/editable draft and alternative actions visible.
  An unavailable network or storage layer is not an invalid text field: do not add
  `aria-invalid` to valid content. Retry must not reset input or move focus without
  a reason. Announce the outcome in a nearby polite live region.
- Offer an independent backup when saving cannot succeed. Claim a save only after
  the storage/write operation succeeds; distinguish a requested download from a
  verified file. Warn before leaving unsaved edits. Recovery must not rely on the
  same failed storage mechanism or a decorative completion animation.
- Reading, navigation, contents disclosure and static recovery guidance remain
  useful without JavaScript. Reveal enhanced study actions only after handlers
  exist. The recovery specimen explicitly simulates preview/storage failures and
  saves only a sample note to this tab's session storage; real product processing,
  persistence, race/cancellation and unsaved-work behavior require separate tests.

### Collections, layers and history

- Use open ruled rows, not a card for every item. A selected row uses the neutral
  soft surface plus a checked control; blue is reserved for the meaningful marker.
  Keep names readable and wrapping, with muted type/visibility metadata below.
  Thumbnails are optional context, never the only way to identify a row.
- Selection and secondary actions are separate controls. Never put buttons inside
  another button or a row with button semantics. Icon actions stay available without
  hover, are named for their item, and retain 44px targets for coarse pointers.
- “Select visible” operates on the current filter only. Preserve selections outside
  the filter, state their count explicitly, and show the total affected by bulk
  actions. Empty results preserve data and offer clear filters; an empty collection
  offers its appropriate create/import/undo route. Do not silently deselect work.
- Supply named Move up/down/top/bottom actions where stacking order matters.
  Dragging is optional. In a filtered stack, disable rearrangement with a visible
  explanation; clear the filter to work in the complete order. Preserve item IDs,
  selection and focus through moves; announce the resulting position.
- Rename preserves the previous value until a valid save. An empty name stays in
  the field with its error. Dirty dismissal requires a safe discard decision.
  A removed row returns focus to a persistent recovery control; clearing selection
  returns to the selection control or filter. Undo/redo controls may use guarded
  `aria-disabled` to retain focus when reaching a history boundary.
- History distinguishes current, previous and redo steps without relying on colour.
  A new edit after undo replaces the future branch. Local selection/filter changes
  do not create document-history entries. Removing objects cannot leave stale IDs
  selected. Reversible removals need a persistent Undo route, not a timed-only toast.
- Long lists preserve semantic reading order and keyboard reachability. The sample
  uses `content-visibility` above 50 rows; production virtualisation must prove
  focus, selection, find/filter and announcements before adoption. Reflow collection
  and history columns using available width and text size; never shrink text to fit.
- Real loading/error states retain valid rows and selections, explain the failed
  operation and provide retry/cancel as applicable. Do not apply optimistic edits
  without an exact rollback. The local collection study has no server or async edits;
  production loading/race/rollback evidence belongs to the responsible adapter.
- Preserve domain semantics: PDF stages page order/deletion/rotation until Apply
  and must keep at least one page; IMG uses its real Fabric object order and snapshot
  history, excluding transient tool objects; Resume keeps structured entries,
  its existing edit timing, accessible move controls and removal protection.
  Shared row appearance is not permission to add unsupported batch/layer features.

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
- Precision controls display domain values, never internal normalized percentages:
  exposure in EV, rotation in degrees, dimensions in px/mm, levels in 0–255 and
  gamma as a decimal. Signed controls mark their neutral point. Keep labels above
  the track, values aligned at the trailing edge, and units outside the editable
  number in a reserved 20px unit slot. Value fields are 32px high for fine pointers
  and 44px on touch; leave 4px between the value row and track, and 16px between
  numeric groups. Do not animate a value, thumb or canvas response while editing.
- Curves use an undistorted plot, inset endpoints and a quiet identity reference.
  Keep histogram data separate from the editable line; name channels in addition
  to colouring them. Provide selectable points, precise input/output fields,
  arrow-key movement, explicit add/remove/reset and protected endpoints. A drag
  gesture must not be the only way to edit or remove a point. Pointer cancellation
  restores the pre-drag state. Small screens can separate adjustments and curves
  into labelled views; changing view preserves every value and allows scrolling
  outside the plot. Open detailed curves in expanded controls on compact layouts,
  retaining the preview and a return-to-split action. Use a 224px square compact
  plot (up to 288px in a narrow inspector), with at least 44px point hit areas.
  Never stretch the graph to fill a shallow drawer.
- Layer rows separate selection from visibility/delete/filter actions; no nested
  buttons. Keep image layers, vector objects and baked image history distinct.
  Do not invent an adjustment-layer model when the product bakes edits into history.
  Supply keyboard reorder actions alongside dragging and name every icon action.
- Preserve each tool's commit boundary explicitly. Cancel restores both pending
  values and edits made since tool entry; Done applies once and creates the expected
  history entry. Tool switches and export flush only the pending edits the product
  already promises to save. Test re-entry after Cancel, not only drawer dismissal.
- Writing rows combine type, value and keyboard reorder actions with open grouping.
  Rich text, image/logo pickers and date fields retain their full behaviour and
  follow the same field/focus rules. Do not replace these with plain text inputs
  during migration merely because a reduced design specimen uses plain text.
- Small screens use one active tool/section, a persistent preview, and a reachable
  working panel. Default split can be 50:50 when usable; short heights and software
  keyboards require an expanded editing/preview mode instead of clipped controls.
- Opening, replacing, editing, undoing, cancelling, saving/exporting, and returning
  must have consistent feedback. Destructive actions require confirmation or undo.

### PWA update and offline notices

- Use the pinned `update-notice.tsx` presentation and `air-update` shell. Products
  own service-worker registration, work protection and activation; do not duplicate
  the visual markup, labels or notice CSS. Sites without a service worker (Yard and
  Drop website) do not show fabricated update/offline notices.
- Place the same opaque, 18px-radius panel in normal flow above the public header
  or editor. Reserve space so no editor/modal commands are covered. Use 16px panel
  padding, 20px leading icon, 14px/500 heading, 14px/1.5 copy and 8px action gaps.
  Constrain the status region to 45dvh with reachable scrollable controls.
- Shared titles: **Update available**, **Updating…**, **Update paused**, **Core app
  cached**. Standard copy is shared; only blocked/error instructions may vary to
  explain actual work protection. Never imply all optional assets are cached.
- Update actions are **Later** and **Update and reload**; busy **Updating…**, failed
  **Try again**. Do not add a second dismissal control or a redundant eyebrow/icon
  in the action. Offline status has one **Dismiss offline status** icon button.
- Announce status politely and errors assertively; arrival never steals focus.
  Keep focused busy actions reachable and restore prior connected focus on dismiss.
  Pause offline auto-dismiss while hovered/focused. Pending updates do not expire.
  Preserve each app's draft/save/task deferral and same-tab update consent.
- Compare actual update/offline panels across PWA products, including text, geometry,
  buttons, themes, enlarged text and narrow/short layouts. Exercise real worker
  activation, cross-tab updates and work preservation separately from visual checks.

### Overlays

Standard dialog width 576px; wide gallery/review 1040px; viewport gutter 16px
mobile/24px desktop. Maximum height `calc(100dvh - 32px)` with internal body
scroll and reachable actions. At ≤640px, use the same content in a bottom sheet
with 20px upper corners and safe-area padding. Large/complex work may use a full
screen dialog with an explicit close/back. Never hide essential actions on mobile.

Z levels: sticky 30; navigation 50; editor 100; toast 150; dialog 200; popover 900;
system recovery 1000. Preserve nesting/portal correctness; avoid ad-hoc z-indexes.
One nested confirmation uses the shared backdrop/viewport offsets `dialog + 2/3`.
The parent remains mounted and inactive. Escape dismisses only the top layer;
safe cancellation returns to the parent draft. Explicit discard closes both and
returns to the original trigger, or a persistent recovery control if it disappeared.
Submenus follow the same topmost-first Escape rule. A menu-to-dialog handoff must
not restore menu focus over the opening dialog. Keyboard and reduced-motion
handoffs are immediate; never animate routine list navigation or rearrangement.

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
zoom are required cases. Also test 200% root-font enlargement as a separate
text-reflow stress case; it is not proof of browser zoom support. Pinch zoom stays enabled. Respect safe-area insets and
software keyboards. DOM order follows reading/focus order.

Semantic buttons/links/landmarks, labels, visible focus, contrast, screen-reader
state, keyboard alternatives to drag, and recoverable errors are release criteria.
Test real rendered light and dark themes, keyboard-only operation, coarse and fine
pointers, reduced motion, and no-WebGPU/static fallback. Automated checks support
human visual inspection; passing a linter does not establish UX conformance.

## 7. Motion and shader discipline

Motion is part of Air's design acceptance, not a later decorative pass. Before
locking the system, the reference must demonstrate a working, locally bundled
light treatment using [Shaders](https://shaders.com/) and its
[open-source library](https://github.com/shader-effects-inc/shaders). Compose it
around Air's two offset planes and quiet app-coloured light rather than adopting a preset
unchanged. Review the short arrival and deliberate pointer response in both
themes, alongside touch, reduced-motion, static and no-WebGPU alternatives.
The reference now demonstrates this custom Shaders composition. Its working
implementation is review evidence; it does not itself grant visual or production
performance approval.

- Shared motion: pointer press 120ms; hover arrow 160ms; occasional popover ceiling 180ms; dialog 240ms;
  exit 160ms. Ease-out `cubic-bezier(0.23, 1, 0.32, 1)`; reversible spatial motion
  `cubic-bezier(0.77, 0, 0.175, 1)`. Sheet easing: `cubic-bezier(0.32, 0.72, 0, 1)`. No per-app timing scale.
- CSS time tokens may serialize in seconds or milliseconds after production
  optimization. JavaScript must convert both units to milliseconds before passing
  them to WAAPI or using a deadline. Verify the actual production effect duration,
  not only its playing/complete states; the landing light arrival remains 900ms.
- A completion acknowledgement may settle from 8px/0.90 scale over 240ms, once.
  A landing entry may use a single 900ms light arrival. These are the moments for
  playful character. Avoid bouncing controls, moving text, repeated reveals and
  continuous decorative activity during work.
- Pointer hover may move a directional arrow by 2px over 160ms. Press uses 0.98
  scale for 120ms; release is immediate. Keyboard presses never compress controls.
  Control colours, selection, focus and appearance changes are immediate. No hover
  lift on touch; a focused keyboard control never acquires decorative hover motion.
- Dialogs enter from 4px/0.98 over 240ms and exit over 160ms. On phones they rise
  from the bottom with sheet easing. Keyboard activation and Escape are immediate.
  Focus moves as soon as opened; animation cannot delay access to controls.
- Shared `motion.mjs` demonstrates native-dialog and completion behaviour. Dialog
  exits sample the current composited pose before cancelling an entrance; repeated
  close requests do not restart the exit. Completion replay uses its current pose
  and remaining duration. A live reduced-motion change settles either immediately.
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
- Suspend offscreen/hidden effects and settle reduced-motion/constrained visits.
  Landing artwork uses one entrance of at most five seconds or deliberate pointer
  response, with no autonomous loop or playback controls. Content and actions
  never depend on GPU support or successful effect loading.
- The reference's light follows a mass 1 / stiffness 100 / damping 10 spring,
  confined to the middle 70% of the artwork. It settles within 1.8s after the last
  pointer input. The 900ms arrival uses `motion-arrival` and the shared ease-out;
  interrupted replay continues from its current opacity. Keyboard replay is immediate.
- Cap this study at 30 submitted frames/second and effective pixel ratio 1.5.
  Submit no frames at rest. Release the GPU device offscreen/hidden and cancel
  pending initialization. Reduced motion, Save-Data, unavailable WebGPU, and
  reported memory/core counts of 4 or fewer use the static artwork. These browser
  hints supplement, rather than replace, real-device performance validation.
- Bundle Shaders locally, pinned to 4.0.5 for this candidate, with no telemetry,
  hosted presets or remote assets. The lazy study bundle is approximately 369 kB
  gzip, with a 400 kB build ceiling. This is a measured study budget, not an
  approved production payload. Preserve dependency licenses and asset hashes.
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
   After the initial design refinement, retire each replaced surface's obsolete
   styles, components, assets, dependencies and authoritative design references.
   Check dynamic consumers before removal; record justified output/native/history
   exceptions and re-scan for legacy cues before final family sign-off.
3. Review source and rendered output, including light/dark, mobile/laptop/desktop,
   keyboard, touch, reduced motion, error/loading/empty and long-content states.
4. Run the repository's required format/lint/type, unit/logic, build/dead-code and
   applicable browser tests. Inspect exported artifacts when the flow changes.
5. Record commands, results, screenshots, exceptions and feature coverage. A
   blocked test is not a pass. Fix failures before committing that piece.
6. Review the complete diff, then make a focused commit with validation evidence.
   Never silently bless a visual regression or weaken a functional assertion.

Maintain a gallery/reference of shared controls and editor states. CI checks token/contract provenance, asset drift and forbidden arbitrary UI
styling. Rendered screenshot evidence is reviewed separately; the static checker
does not certify pixels, accessibility or product behavior. Screenshot updates
require visual review. A new state/component is incomplete
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
- Editor navigation uses the 72px labelled rail and neutral selected tile with a
  2×16px blue marker. Labels enlarge with text settings; a 4.5rem minimum lets
  the rail grow rather than squeezing enlarged words. Search retains the full
  tool names and descriptions. The filename, page controls, view controls and
  document actions share one 64px toolbar at normal text size, retaining real
  40/44px targets. Tablet/phone chrome hides the filename and back action in a
  document-mark popover, available by hover or keyboard/touch activation; the
  full filename remains accessible. Enlarged text may reflow without clipping.
  Keep the desktop filename alone beside the mark; the page selector owns the count.
- Editor widths follow 768/1024px. Below 1024px, a height under 500px uses the
  working sheet to avoid a shallow three-pane layout. A 1280×720 laptop keeps
  its desktop rail. The phone picker uses full-name rows and persistent search.
- The mobile working sheet starts at half height, reserving at least 18rem for
  controls when possible while keeping 64px of preview. Expand controls uses
  the available editor region; Return to split view preserves tool values and
  the mounted document. Cancel/Done return focus to the tool selector.
- Tool navigation is immediate, including active-rail scrolling. Global history
  shortcuts cannot change the document behind a modal or during a busy operation.
- Inspector headers use sentence case and secondary descriptions; omit the repeated
  document page-count subtitle. Use the shared primary/secondary action skins and
  immediate tool changes. Keep Cancel reachable for pending desktop work too.
- Browse and Organize share one responsive page grid. The density is a maximum:
  fewer columns preserve readable text and 40/44px actions; a single page keeps
  the requested thumbnail size. Keep page identity separate from output position.
  Selected browse tiles use a neutral surface and one blue marker. Deleted pages
  keep readable Restore controls and an explicit state label. Named reorder actions
  retain visible focus at boundaries and in long lists; announce the new position.
- Thumbnail geometry includes saved and pending rotation without cropping the
  bitmap. An unavailable preview has a labelled fallback. Apply/Undo/Redo/Reset
  must keep bytes, page count, thumbnails and pending plans in agreement; explicit
  Cancel discards the tool draft while ordinary tool navigation preserves it.

- The canvas surround inherits Air surface-soft, with 16/24/32px space according
  to the available viewport. Keep navigation in the compact toolbar, not another
  canvas row. Page focus has one visible contour; direct manipulation is immediate.
- On white PDF paper, selection chrome uses Air's light accent in both themes for
  contrast. Author content retains its own colours and fonts. Inline document text
  editing is an output-aligned exception to ordinary field height/radius: its box
  follows the placed text, uses 4px corners and one focus contour, and remains
  opaque. Touch editing has a 16px visible floor even when the page is zoomed out.
  Composition owns Enter/Escape; explicit completion/cancellation returns canvas
  focus, while blur follows the user's new target. Touch resize targets are 44px
  with nearest-handle resolution when targets overlap.

- N-up previews use one gapless paper sheet at the first visible page's physical
  size. Share booklet imposition order with output, including blank leaves; show
  fold/trim marks only when enabled. Retain page crop, rotation, physical units,
  vector text and native form appearances. Explain the print-layout tradeoff.
  Pending annotation/signature/code drafts must be applied in their owning tools
  before rearranging pages; preserve the selected layout while reviewing them.
- Custom selects use the local Air field/menu anatomy, 40/44px targets and an inset
  icon. Keep keyboard ownership on the trigger even after a Safari pointer click;
  anchor the menu through inspector reflow, scrolling, zoom and short viewports.

- OCR uses the shared Air language select and actions. Wide preview areas show
  text beside unmodified paper; narrow areas switch between Text and Source so
  neither pane loses half its working height. Recognised text is selectable,
  keyboard-scrollable and wraps at enlarged text sizes. Use the toolbar's page
  navigation, without duplicating its count in the preview.
- OCR results belong to one immutable document revision, including pending marks.
  Discard late extraction results after navigation or document changes. Apply
  destructive marks before recognition, and review other drafts in their owning
  tools. Never reuse pre-redaction text or duplicate an existing native text layer.
- Fit invisible OCR text to word boxes in the cropped, rotated physical page frame.
  Missing positions or unencodable characters must fail explicitly and retain the
  preview for copy/retry; never report success after silently dropping words.

- Preview failure must not discard readable PDF bytes or represent missing content
  as a blank page. Name unavailable previews across the canvas and page collections;
  keep a reachable Air retry action outside the scaled document. Disable direct
  canvas editing until the page preview is available.
- Retry only failed previews from the current bytes. Preserve tool drafts, OCR
  results, pending marks, page plans, geometry and undo/redo. Preview cache repair
  is not a document edit. Discard late repairs after replacement or byte changes,
  release retired URLs/canvases, and bound preview memory independently of export
  resolution. A failed image export must fail explicitly, never emit blank output.

- Redact and Smart Erase use open Air groups, labelled choices and one shared
  pending-mark collection. Reviewing, removing and clearing marks preserves the
  persistent Undo path and moves focus to a surviving control. Appearance settings
  affect new marks; keep existing mark colours and erase methods intact.
- Detection and text search own one cancellable request tied to the source byte
  revision, not only the document ID. Ignore abandoned work after a transform,
  replacement or tool exit; prevent duplicate dispatch and retain valid inputs on
  failure. A processing error does not make the search phrase invalid.
- Colour presets have separate 40/44px targets and explicit selected state. The
  shared custom picker uses the family hue/saturation wheel, a brightness track,
  exact hex entry and optional native hue/saturation controls. Use this same picker
  in every annotation, signature, stamp, numbering, redaction and search colour.
  Preserve raw invalid hex and the last valid output; external Undo updates the
  cursor. Cancelled drags restore their starting colour, and unrelated pointers
  cannot cancel a live gesture. Keep the popup reachable after scrolling, resizing
  or zooming, even when its anchor moves offscreen. Escape returns focus.
- Redaction/erase remain deferred until export or a byte operation. Explain the
  permanent removal, loss of selectable text on marked pages and possible file
  growth. Pixelation can retain recognisable details; it is not a substitute for
  redaction of sensitive information.

- Find & Act stages review matches against their exact byte revision. Keep the query,
  previous valid results and individual selections when search fails or is cancelled;
  never apply stale coordinates after another edit. Match-case/whole-word choices,
  removable terms, per-match inclusion and page navigation use shared Air controls.
  Appearance colours belong to document marks; result snippets use readable UI tokens.
- Search and analysis have explicit pending, no-match, failed and retry states. IME
  composition owns Enter. Scrub counts describe the supported categories, never a
  blanket claim that a PDF is safe. Only selected removal categories enable Apply.
  Explain loss of bookmarks/form registration and the limits of keeping annotations.
- Mobile Done waits for a promised operation to finish before closing the tool.
  Failures retain the tool, input and choices for retry; repeat activation must not
  apply twice. Desktop primary actions consume reported failures without an unhandled
  rejection. Undo remains the recovery path for successfully applied byte changes.

- Metadata uses an open document report, persistent field labels and the family
  date/time picker. Read errors must never become blank editable properties;
  expose retry and disable Apply until the current revision has been read.
  Preserve drafts through tool/viewport changes and failures, scope them to exact
  bytes, discard them on Cancel and retire them after a successful save so Undo
  cannot resurrect an applied draft. Clearing the standard fields does not remove
  XMP; explain that limit without claiming the PDF has been sanitised.
- Calendar days have seven 44px columns even on the smallest phone. The 320px
  composition uses a full-width surface and 4px grid inset; other controls keep
  their normal gutter. Date restrictions, local time, year selection, hour/minute
  menus, AM/PM, Clear and Now remain available. Give Created and Modified distinct
  accessible names, focus the day before paint, dismiss nested menus first and
  return focus to the actual field. Scrolling/zoom must keep completion reachable.
- True modals suspend the actual Air popover/menu/tooltip portals. Remove retired
  legacy skins and selectors together; stale class names cannot own focus behavior.

- Bookmarks use open, named rows with persistent title, target-page and nesting
  labels; the shared select owns keyboard selection. Reorder controls retain row
  identity and focus; removal and heading replacement offer draft-list recovery.
  Invalid targets remain editable with nearby feedback, never silently clamp.
- Bookmark drafts belong to exact source bytes, survive ordinary tool/viewport
  navigation and retire after Apply or Cancel. Heading scans cancel or ignore
  abandoned results after tool exit, document changes or mark changes. Failed or
  empty detection preserves manual input. Explain first-use resource downloads.
- Applying an outline replaces the previous one and remains undoable. Contents
  pages preserve original page references and adjust link targets; unapplied
  overlays must be resolved in their owning tools before pages are inserted.
  Explain printed-title shortening/unsupported-glyph limits without changing
  complete Unicode outline titles. Do not silently discard pending objects.
- Pending Apply remains registered when validation rejects before processing.
  Concurrent flush callers wait for the same operation; failed mobile Done keeps
  the tool and its draft available for correction and retry.

- Attach uses open file rows, complete wrapping filenames, decoded sizes and
  named 40/44px remove controls. Duplicate names remain distinct files. Show read
  errors and retry explicitly; never substitute an empty list for a failed read.
- Failed attachment selections belong to exact source bytes, survive tool/viewport
  navigation and remain available for retry or discard. Cancel retires them;
  successful actions retire them before Undo. Immediate actions are guarded,
  promised and undoable; mobile Done closes without discarding a failed selection.
- Attachment handling preserves Unicode names and nested name trees. Remove by
  revision-scoped identity, clear standard associated-file/annotation references,
  delete unshared embedded bytes and preserve shared streams and unrelated content.
  Unsupported surviving references fail explicitly, without changing the source.
  Pending privacy marks must be resolved before attachment edits use listed identities.
- After a blocking operation, restore the initiating control when it survives.
  A removed row supplies a surviving action as its focus destination. Closed
  dialogs fall back to Export; failed tool operations must not jump there.

- Crop uses the shared Air scope segments and four persistent percentage fields.
  Dragging and keyboard entry describe the same visible page frame. Preserve
  incomplete/invalid drafts with nearby feedback; opposing margins must leave a
  positive area. Keep the primary crop action near its fields. A successful crop
  retires its draft; failure retains it. Scope drafts to exact source bytes.
- Trim to content is a cancellable suggestion. A result must still belong to the
  same bytes, page, scope, marks and draft before replacing margins. Blank and
  full-frame pages are legitimate no-result cases; read failures require retry.
- Straighten is an immediate undoable operation. Explain image-only text, possible
  file growth and clipped edges. Require pending marks to be applied first; reject
  changed pages with native annotations/widgets until flattened. Preserve the PDF
  catalog, page references, metadata, attachments, untouched forms and original
  rotated/CropBox/UserUnit geometry. A no-skew pass returns the original bytes.
- Strip furniture presents full wrapping text samples and named Air check rows.
  Distinguish too few pages, no selectable text, no matches, reading, cancellation
  and failure. Selection belongs to exact bytes and survives tool/viewport changes
  and failed Apply. Derive preview bands directly from the selected result; do not
  maintain a second copy of crop margins. Retire applied selections before Undo.
- Crop and Strip furniture await their byte operation before mobile Done closes.
  Failures keep the tool and draft ready for retry. Cropping hides content without
  deleting it; both tools must explain that it is not sensitive-data removal.

- Signature uses Air source segments, labelled ink/background controls and a single
  drawing-surface focus contour. White drawing paper and actual ink/alpha are output
  data in both themes. Draw and Choose retain separate sources through tool and
  viewport changes; completed strokes remain editable. Cancelling a pointer stroke
  discards only that unfinished stroke. Clear returns focus to the drawing surface.
- Image preparation exposes progress and recoverable decode/size errors. Choosing
  the same file can retry; failure preserves the previous ready image. Cancel reads
  on tool exit/document replacement and ignore superseded results. PNG/JPEG inputs
  are limited to 20 MB and 16 million pixels; preserve existing alpha, including
  white ink, and remove near-white paper only from opaque images.
- Offer a keyboard placement action, named placed-object selector, move/resize and
  remove controls alongside canvas gestures. Arrow/Delete keys act on a focused
  page, never globally while using panel controls. Keep images fully on the visible
  page and preserve their physical aspect when copying to mixed page sizes.
- Copying to remaining pages stages placements from the first signed page; it is
  distinct from Apply and leaves occupied pages unchanged. Apply awaits embedding,
  preserves unrelated marks and PDF content, and removes only successful signature
  drafts. Failed mobile Done keeps the tool and placements ready for retry. Undo
  restores the prior bytes/placements. Never silently omit an incomplete signature.

- Stamp owns a byte-scoped preview and Air text, field-insertion, shape/finish,
  colour and precision controls. Retain raw invalid numeric drafts through layout
  and tool changes; preview the last valid value and prevent invalid Apply. Numeric
  values stay at the trailing edge when enlarged text wraps. Keep native keyboard
  stepping while suppressing duplicate platform spinner chrome. Selected segments
  remain distinguishable in forced colours.
- Read the actual document title for field expansion and capture one preview time
  for both preview and saved date/time tokens. Field insertion replaces the current
  selection, restores the caret and never steals focus from a subsequent action.
  Failed/abandoned property reads preserve the PDF and cannot publish stale results.
- Ink and shaped previews reuse the supersampled output buffer, so zoom does not
  reshuffle texture. Bound cached canvases to 16 million pixels in total, twelve
  entries and an 8192px maximum side; release evicted buffers and clear on tool exit.
  Oversized stamps report a recoverable error. Plain digital text stays vector;
  unsupported encoding offers a shape/ink correction without changing the PDF.
- Stamp Apply awaits saving, retains a failed draft and retires a successful preview
  before Undo. Start another stamp explicitly re-arms the settings. Keep busy focus
  in the panel and mobile Done open until success. Preserve existing text, metadata,
  attachments and visible-page geometry. A watermark is not redaction.

- Page numbers uses the shared six-position grid, custom Air format menu and colour
  picker. Keep the 3×2 spatial layout, named 44px cells and a neutral selected surface
  with a blue marker. Full format names remain visible in the menu. The same grid
  serves Bates; do not fork it for another numbering tool.
- Stamp and Page numbers share one precision-field adapter and its styling. Keep
  16px between numeric rows, including rows without sliders. First page and Start at
  use whole-number entry; Size and Margin pair entry with a slider. Preserve invalid
  drafts through tool/layout changes, show field-associated errors after blur and
  preview the last valid settings while preventing Apply. First page skips earlier
  PDF pages; Start at chooses the initial label. Totals show the last sequence label.
- Use one formatter for page-number preview and output. Validate the sequence,
  dimensions and actual text fit on every visible page, including mixed sizes,
  rotation, CropBox and UserUnit. Report the page that cannot fit; never silently
  clip numbers or change the working PDF on failure. Preserve text and catalog data.
- Scope the pending numbering preview to exact document bytes. Await Apply/mobile
  Done, retain failed drafts and prevent duplicate saves. Retire successful previews
  before Undo; Start another numbering explicitly re-arms them. Keep busy focus in
  Page number settings. Cancel restores the tool checkpoint.

- Header & footer uses shared Air Header/Footer segments and three full-width,
  persistently labelled alignment fields per group. Preserve all six values when
  switching groups, tools or viewport. Show the token insertion destination and
  its expanded preview; default to the left field of the selected group. Insertion
  replaces the selection, returns the caret and yields to subsequent focus changes.
- Share token controls and the byte-scoped document-title/clock reader with Stamp.
  Use one captured timestamp in preview and output; failed reads offer retry and
  abandoned reads cannot update a later visit. Long resolved text wraps in help.
- Reuse PrecisionField for Size (7–18 pt) and Margin (12–72 pt), keeping raw invalid
  drafts, associated errors and the last valid preview. Skip first page is the Air
  switch and must not leave a one-page PDF with no eligible pages.
- Share header/footer token expansion and alignment geometry between preview and
  output. Check exact embedded-font widths on every visible page; keep 4 pt clear
  between occupied fields. Reject clipped/overlapping text, multiline fields,
  unsupported characters and empty expanded output with an actionable message.
  Preserve catalog data, source text, rotation, CropBox and UserUnit on success.
- Await Apply/mobile Done, retain failed drafts, keep busy focus in settings, retire
  successful previews before Undo and explicitly re-arm Start another header & footer.
  Cancel restores the checkpoint. Replaced TripleRow and native-value token insertion
  paths must not remain; retain only shared controls with live consumers.

- Bates numbering uses full-width Air Prefix/Suffix fields, the shared minimum-digit
  segments, spatial position grid and colour picker. Minimum digits adds leading
  zeros; identifiers grow across digit boundaries without truncating or wrapping.
  Use precise Start at entry (1–999999999), with enough width for all nine digits,
  and the shared Size (8–24 pt) and Margin (12–72 pt) entry/slider controls.
- Retain invalid numeric drafts through tool/layout changes, associate errors after
  blur and preview the last valid numeric settings. Share one identifier formatter
  and Courier layout between preview/output. Check every visible page with exact
  embedded-font widths; report fit, multiline, unsupported-character and sequence
  precision errors without changing the PDF. Keep identifiers selectable and retain
  page geometry, text and catalog data.
- Scope the pending Bates preview to exact source bytes. Await Apply/mobile Done,
  keep failed settings ready for retry, retire successful previews before Undo and
  explicitly re-arm Start another Bates numbering. Keep busy focus in settings;
  Cancel restores the checkpoint. Remove replaced StampTools and unused adapters;
  retain shared controls only where live consumers remain.

- Editor loading uses the shared Air status and measured preview progress: unknown
  parsing work has no invented percentage; once page count is known, show completed
  previews out of that total. Name the local file with wrapping, retain an exit to
  the toolkit and keep short/enlarged layouts scrollable. Late reads, progress and
  saved-draft lookups cannot replace a newer file or a departed editor; release
  thumbnails created by ignored results. React effect replay must still finish.
- Error and saved-session notices use neutral Air surfaces, semantic icons, sans
  labels and shared buttons. Wrap text/actions; cap their combined scrolling area
  at 40% of the editor to retain canvas space. Keyboard must reach every action
  even with enlarged text. Discard names the saved edits it removes; it preserves
  the open original and other files' saved sessions.
- Restoring saved edits keeps the original bytes and the offered draft until it
  succeeds. Failed restoration keeps Restore available and exposes the error without
  an unhandled rejection. Retry is awaited and duplicate work is guarded. Processing
  status lives outside the inert/busy editor; keep a stable status surface with no
  decorative spinner or invented progress. Return focus to the initiator or Export
  when a successful restore/discard removes that initiator. Reuse LoadingState and
  ProgressBar; remove replaced loading spinners and one-off coloured banners.

- QR / barcode uses shared Air type segments, a persistently labelled content field,
  colour controls and caption switch. Associate encoding errors with Content; retain
  invalid values through tool/viewport changes. Preview on a quiet neutral surround;
  the artwork keeps its white backing in both themes and forced colours. Cap raster
  preview memory for long barcodes; output remains vector. Changes affect new codes.
- Provide keyboard-accessible Place, custom placed-code selection, movement, resizing
  and removal alongside canvas tap/drag/corner handles. Keep complete quiet zones on
  the page at placement and preserve physical proportions when copying between mixed
  page sizes. Copy from the first stamped page only to pages without codes. Restore
  sensible focus after removal; use the shared on-paper selection accent.
- Preserve four-module QR and ten-module barcode quiet zones and caption geometry
  between preview/output. Await Apply/mobile Done, retain placed objects after failed
  output, and prevent duplicate writes. Successful Apply removes pending objects;
  Undo restores their snapshot and Redo reapplies the output. Cancel restores the tool
  checkpoint. Keep original text/catalog data and verify vector output. Remove the
  retired WholeDocPanel Segmented implementation; retain adapters with live consumers.

- Annotate uses quiet Air tool/style groups, a full-width custom font selector,
  shared colour controls, switches and precise size/opacity entry. Keep controls
  labelled and reflow their groups at enlarged text sizes. Text size accepts whole
  points from 5–96, matching nearby-text suggestions; opacity accepts 0–100%.
  Retain invalid numeric drafts across tool/layout changes without writing invalid
  ink; show associated errors and disable Apply until the visible draft is valid.
- A custom placed-annotation selector exposes every page's marks to keyboard users.
  Selecting a mark shows its actual font, styles, colour, fill/background and icon.
  Keep shape fill and glyph choices available in Select mode; Undo must refresh
  displayed values. Drawing/text remain arm-once and icons retain repeat stamping.
  Preserve inline typing, wrapping, geometry, resize handles and keyboard nudges.
- Coalesce live style/nudge edits without allowing deferred work to recreate history
  after Undo, Cancel, removal or Apply. Await Apply/mobile Done; failed output retains
  pending objects and selection, successful output removes only annotation overlays,
  and Undo restores them. Preserve embedded fonts, vector marks, selectable original
  text, metadata and attachments. Remove retired StyleToggle/FontControls skins and
  RangeField. Retain only shared adapters with verified live consumers.

- Auto-fill uses open Air detection/profile/answer groups, complete field labels and
  named page-navigation actions. The saved profile is independent of PDF Apply/Cancel;
  validate stored values, report failed local storage and retain the in-memory draft.
  Filling from a profile changes only empty answers; detection preserves matching
  manually entered answers when scanning the same bytes again. Keep profile-fill
  focus stable when the last empty match is filled.
- Detection belongs to exact source bytes and pending marks. Cancel or ignore stale
  work after exit, replacement or document edits; failed/empty rescans retain valid
  answers. Distinguish no selectable text from no detected blanks and offer OCR or
  manual annotation guidance. Pending privacy marks must be resolved first.
- Auto-fill preview and output share visible-page text sizing, baseline and inset.
  Preserve the existing shrink/ellipsis behaviour for long answers and explain it
  beside the fields. Unsupported output characters fail explicitly with the draft
  intact. Preserve original vector text, rotated/cropped physical page geometry,
  metadata and attachments. Await Apply/mobile Done, deduplicate, retire applied
  drafts before Undo, and preserve failure/retry and explicit Cancel semantics.

- Fill form uses open Air rows, full native field names, page-navigation actions,
  labelled text/multiline fields, custom single-choice menus and native check rows.
  Read-only values remain copyable; unsupported fields stay visible and unchanged.
  Preserve native choices, multi-selection, required flags and text-length limits.
  Required labels describe the PDF; saving a partially completed form is allowed.
- Field reads and drafts belong to exact source bytes. Retain drafts across tool,
  viewport and appearance changes; ignore abandoned reads and offer real read-error
  retry separately from an empty form. XFA forms must show an explicit unsupported
  state rather than dropping their data. Resolve pending privacy marks before editing.
- Save only changed writable values. Clearing choices must clear their PDF value;
  unsupported/read-only values cannot be silently overwritten. Field errors retain
  all input and identify the correction. Flattening is explicit and unavailable
  when unsupported fields would be lost. Await Apply/mobile Done, preserve failed
  work and prevent duplicate output. Verify field values/flags/widget geometry,
  catalog data, fixed appearances, Undo/Redo and Cancel before committing. Success
  feedback belongs to the editor's committed bytes and disappears on Undo; preserve
  focus inside the inspector when the saving control becomes disabled.

- Select text uses Air actions, a labelled read-only excerpt and a single inspector
  scroll area. Keep separate Highlight, Box, Redact and Copy actions; none is a
  staged Apply operation. Provide whole-page selection and focus-scoped keyboard
  selection (Left/Right, Shift to extend, Home/End and Escape), preserving viewport
  shortcuts and ordinary text-field editing.
- Text geometry and selections belong to exact bytes and the visible page. Preserve
  selection across tool/layout changes, ignore abandoned reads and retire it after
  a page or byte revision. Reading, read-error/retry and no-text/OCR are distinct.
  Clipboard refusal/unavailability needs visible feedback and a manual-copy path;
  failed PDF writes preserve the selection. Apply once, retain Undo/Redo and keep
  focus in the inspector. Explicitly applied marks remain after Cancel; Undo reverses
  those actions, while Cancel discards the current selection.
- Selection bounds include font ascent/descent and transformed corners, respect
  CropBox/UserUnit/page rotation, and omit text fully outside the visible crop.
  Use the family paper accent for the overlay; actual yellow highlight/red box ink
  stays document content. Redaction marks remain removable until export or another
  transform applies them; explain this beside the action. Pause text selection while
  privacy marks are pending so covered text cannot be copied from the source layer.

- Undo/Redo/Reset retain keyboard and pointer focus when reaching a history boundary.
  Use guarded aria-disabled actions with the shared icon-button disabled treatment;
  unavailable actions neither mutate history nor animate on hover/press. The provider
  rejects history changes during a blocking task, including immediate repeated calls.
  Responsive panel remounts preserve focus on surviving toolbar controls; explicit
  tool selection still moves focus to its heading.
- Keep editor entry, tool dispatch and stage registration as small ownership seams.
  Remove provider actions/helpers without runtime consumers. A single-use composition
  belongs with its tool; N-up uses PrimaryAction directly and retains a settings focus
  destination after processing. Do not reintroduce the retired WholeDocPanel wrapper.

- Root styling, editor backgrounds, processing scrims and modal layers consume Air
  directly. Do not restore the retired Workbench token file, Ocean Blue aliases,
  uppercase/mono UI labels or bundled Archivo/JetBrains UI fonts. Framework font
  aliases may only point to the corresponding Air system stack.
- Frequent selects open, select and dismiss immediately for pointer and keyboard;
  their chevrons use the shared open-state rule. Full labels wrap, menu width has
  a 15rem readable minimum capped by the viewport, and anchoring preserves scroll/
  resize/visual-viewport placement. Do not retain animation-only state or classes.
- Annotation font faces are output data. Keep fonts.css, the embedded-family roster
  and bundled TTFs in exact agreement; preview and export use the same bytes. Removing
  UI fonts must not remove document fonts or change their output metrics.

- Keep standalone and editor tool rosters disjoint, with derived identities and
  complete implementation maps. Unknown IDs cannot select inherited object properties
  or replace a valid active tool. Standalone navigation and document handoff retain
  their specific boundaries; metadata must not load the editor implementation graph.
- Queued editor work belongs to the session that created it. Do not start it after
  departure or install a late transform into discarded history. Check ownership
  before generating previews and release any previews that finish after departure.
  Tool changes clear old canvas handlers/overlays while preserving document pages;
  keep these lifecycle seams even when their components render no visible content.

- Static recovery is a build entry using the same locally pinned Air CSS as the app.
  Keep useful no-JavaScript home/skip navigation, safe wrapping requested-path text,
  both themes, 36px identity and responsive/enlarged-text behavior. Do not restore
  the retired public 404 palette, UI fonts, technical receipt or statement footer.
- The host returns HTTP 404 for unknown URLs before and after PWA installation.
  Limit the service-worker navigation fallback to the app base and index entry,
  preserving valid offline entry/query URLs without masking missing routes.
- Install/README previews show the real application with synthetic content and
  truthful dimensions/layout/theme labels. Social artwork uses the canonical Air
  CSS, original mark and real capture. Validate shipped metadata against image bytes;
  include static HTML/artwork in the surface inventory alongside React sources.

- PWA Update and reload is deferred while an editor or standalone workspace is open.
  Explain saving/downloading and returning home; keep Later available and restore
  update availability on return home. A worker activated by another tab must not
  reload this tab's work. Recheck the current route before the delayed reload so a
  new editor handoff remains safe. First-install cache feedback must not suppress
  later update notices. Validate with real waiting-worker/two-tab tests and output.

- The landing unveils four rear paper sheets to either side of an anchored front
  sheet, once, using the portable artwork lifecycle. Keep their stacking order and
  the real PDF dropzone fixed throughout. Static/reduced-motion visits show the
  opened stack. Pause offscreen/hidden and cancel on workspace/privacy departure.
  This replaces the landing shader; no editor decoration or animation dependency.
