# Air validation record

## 2026-10-11 — portable contract and inventory

`vp check`, `pnpm check:dead`, 355/355 unit tests and production build/asset limits pass.

`node scripts/check-air-design.mjs` passes both in this repository and in a
separate temporary directory with only DESIGN.md, the checker and inventory.
Regenerating the inventory preserves its contents. The contract is copied in full;
there is no sibling-checkout or runtime service dependency. CI checks document
integrity and inventory drift; source files default to pending until reviewed.

This commit establishes governance only. Runtime Air styles, component/state audits,
responsive screenshots and feature sweeps are still pending. The full phased plan
is maintained in Cloakyard's `UX_REFRESH_TODO.md`; this repository's surface record
tracks local evidence so it remains usable independently.

## 2026-10-11 — shared component bundle

The pinned local CSS and working `docs/air/components.html` reference are identical
across the family. They are not yet imported into product screens. Contract/bundle
hashes, palette equality and standalone-copy validation pass. All 15 required and
breakpoint-neighbour viewport sizes have no document overflow in light and dark.
The reference was visually inspected on desktop, laptop and phone, including the
390px dark sheet and 320px light controls. Evidence images are recorded in the
family repository's `docs/air/evidence/reference-*.jpg`.

Verified: field/select editing; checkbox and segment selection; slider keyboard
increment; dialog initial focus, forward/reverse focus wrap, Escape, Done and focus
return; 44px coarse-pointer controls; 16px mobile inputs; zero-duration reduced
motion. Fixed the native dialog's default max-width narrowing the phone sheet.
Contrast calculations: all tested normal text/semantic pairs >=4.5:1; required
field boundaries >=3:1 (light 3.31:1, dark 4.39:1). Source review covers disabled,
busy, hover/press and status variants. Product-specific controls, real app state
sweeps, 200% browser zoom and software-keyboard behaviour remain separate gates.

The CSS is an explicit standalone reference entry for PDF's dead-code tool because
its HTML reference imports it; it is not a dead-code ignore. Product migration will
replace this entry with the application's normal stylesheet import.

## 2026-10-11 — full default-panel audit

See [editor-audit.md](editor-audit.md) for all 22 editor default panels inspected at
1440×900/light and 390×844/dark/coarse, along with conditional signature/annotation
states and the date/time popup. Source records include this evidence without
marking production components implemented or validated. Date day cells measured
~37.4×44px on touch, which informs Air's wider-calendar requirement.

The opt-in Air bundle is synchronized with the detailed family contract, including
single-contour fields, 44px switches, source-faithful signature controls, writing-panel
geometry and expanded mobile controls. Production entrypoints do not import it.

`vp check`, `pnpm check:dead` and all 355/355 units pass for this documentation/bundle
checkpoint. Actual features, output bytes, full overlays, utilities, AI and cross-browser
flows remain subject to the later migration gates; default-panel inspection alone
is not feature parity or a passing production E2E suite.

## 2026-10-12 — refinement 03 reference checkpoint

Saved the canonical Air candidate from Cloakyard checkpoint `340aee8`, contract
`dc6032235f40` (SHA-256 prefix). The standalone bundle includes refined fields,
choices, compound controls, motion, floating menus/popovers/tooltips and safe
rename/remove/restore studies, plus local shader/overlay modules and licenses.
`design:portability` exposes the isolated validation command. Generated vendor
assets are covered by hash verification, not reformatted as app-owned source.

The exact-copy contract checker and all ten isolated portability assertions pass
for this product (13 files, no app dependencies or sibling checkout). Shared
reference visual and interaction evidence is recorded in Cloakyard's
`docs/air/validation.md`, including 224 floating-surface checks and 15 journeys.
This is a documentation/reference checkpoint; the runtime does not import Air CSS
or the study modules, and full product visual/feature migration is still pending.

`vp check`, `pnpm check:dead`, all **355/355 unit tests** (34 files),
`vp run build` (TypeScript, production and PWA) and the 138-file deployment
asset check (all ≤25 MiB) pass. The initially unreferenced portability script
was connected through `design:portability`; the dead-code check then passed.

Existing product behavior and appearance are unchanged. Runtime editor/AI/export
E2E sweeps are reserved for affected production pieces; this checkpoint does not
claim those have passed. No push or deployment was performed.
