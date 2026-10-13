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

## 2026-10-13 — Air entry implementation

Implemented the homepage, ranked tool index, common navigation/footer, privacy
reading page, shared file acquisition, encrypted-file recovery, and update/offline
notices. Canonical `src/styles/air.css` now imports through the application entry;
`air-entry.css` contains composition only. Home search metadata stays independent
of the lazy editor graph. Route changes focus the new main region immediately.
Search clear/Escape retain focus, and encrypted-file replacement focuses Browse.
Missed file drops are prevented without intercepting text/link dragging.

Removed the old ToolCard, landing panel/pipeline/stat/receipt CSS, duplicated shell
footer branches, generic technical labels and font preloads. Actual editor/output
fonts remain because pending surfaces still use them. Replaced stale CLAUDE design
instructions. Refreshed the real 1200×630 social screenshot and its capture selector.
No shared token, PDF engine, export-byte or AI-pipeline change is included.

Verified:

- `vp check --fix`, dead-code check, 355/355 units, TypeScript, production/PWA build,
  and deployment asset limits. Contract/source inventory and portability checks pass.
- 88 DOM layout cases: home + policy, eleven contract dimensions × light/dark ×
  16/32px root text. No horizontal overflow or clipped inspected controls/headings.
  112 computed text pairs have minimum 5.1886:1 contrast. Screenshots inspected on
  desktop/phone and tablet policy; this does not claim 88 independent visual reviews.
- Landing-search and home-routing E2E pass against both dev and production preview:
  anchored search, ranking/highlighting/counts, shortcuts, clear/no-result recovery,
  selected-tool intent, PDF open and Merge & edit hand-off.
- All six non-AI standalone workflows pass using the documented generated demo
  fixtures, with output page counts, extracted ZIP, encryption and signature checks.
  The original scanned/guide fixture PDFs are absent and were not tested.
- Mobile editor smoke passes: actual operations plus twelve additional panel
  render checks, preserved 50:50 sheet and Markdown export. The desktop editor
  sweep was not rerun in this slice.
  Responsive motion passes six dimensions, editor/modal anchoring and reduced motion.
  A first concurrent run failed the tablet-portrait settle assertion; a serial rerun
  passed unchanged, with added failure-state diagnostics. No failure was waived.
- Native Safari: rendered entry/search, one visible clear action/outline and Escape.
  Native Firefox: real 200% browser zoom and toolkit anchor/focus. Chromium: 44px
  clear action, forced colours and reduced motion, missed file/text drop handling,
  real synthetic-PDF drop → rendered editor page, encrypted notice → replacement
  focus and PDF Password navigation.
- Update/offline notices: twelve layout/theme/text cases using a disposable fixture,
  both states, busy keyboard focus preserved and repeated update dispatch guarded.
  The fixture was removed after verification. An installed previous build displayed
  its old update notice; clicking its real Update now action loaded the new build.
  The final phone screenshot reflects that updated build. First-install cache
  notification remains real service-worker state; no production toggle was added.

Evidence: `evidence/entry-2026-10-13.json` and `entry-*.png`. The production preview
uses port 8132. Existing product/reference servers were preserved.

Still open: physical touch/software keyboard, screen-reader speech/navigation,
full standalone bodies, editor/canvas/overlays, global loading/error boundary and
AI states. Those sources remain pending. This is a bounded entry implementation,
not a completed CloakPDF refresh. The user's “commit then continue” instruction
retains the documented physical/assistive follow-ups; no push or deployment.

Portability initially exposed product-only inventory entries in the isolated test
fixture. The canonical fixture now retains only its bundled CSS entry; complete
product inventory checks remain in the real repository. All fifteen assertions
pass after the shared fix. Legacy Archivo remains requested during startup by
unmigrated global surfaces; font removal waits for their migration.

## 2026-10-13 — utility headers and global recovery

The six standalone utilities now share a quiet Air header and open workspace.
Removed the duplicate instrument frame, execution labels and legacy receipt-like
metadata. Tool requirements and desktop AI eligibility remain intact. Route chunk
loading uses a visible text status with no invented progress. The real error
boundary shares the brand/navigation/prose/buttons: original diagnostics and
GitHub issue preparation remain available, and no report is sent automatically.
Clipboard failure now offers manual copying; retry restores focus to the new main.
Reload explains the risk to unsaved changes.

Validation: 132 header layout/theme cases (six tools × eleven sizes × two themes),
plus 88 real error/loading component cases (eleven sizes × two themes × 16/32px
root text); no horizontal overflow or inspected heading/control clipping. The
error fixture was disposable and removed. Keyboard copy success/failure, retry
focus, real document reload and coarse targets pass. Desktop light/phone dark
Merge and phone dark recovery screenshots were inspected.

Fresh check/type, dead-code, 355/355 units, production/PWA build and 137-file asset
limits pass. The initial Icon size prop failed type checking and was corrected to
the registry's supported className interface. All six standalone workflows pass
again against production, using the explicitly documented synthetic demo fixtures,
including valid merge/image/extract/encrypt/compare/sign outputs. Home PDF-open
and merge-to-editor routing pass. No PDF processing or output format changed.

Source search removed obsolete site/header/footer/navigation, instrument/status
selectors and their unused animation. Active editor/tool-body primitives remain.
The existing phone landscape orientation overlay, standalone file lists/actions/
results, editor/canvas, AI and deeper loading states remain pending. The layout
cases do not claim feature parity for those pending surfaces. Physical touch,
software keyboard and screen-reader speech remain open.

[Evidence](evidence/recovery-utility-2026-10-13.json) ·
[Merge desktop](evidence/utility-merge-desktop-light.png) ·
[Merge phone](evidence/utility-merge-phone-dark.png) ·
[Recovery phone](evidence/recovery-phone-dark.png).

The shared shader runtime/declarations are synchronized as portable design assets,
with all seventeen isolated assertions passing. PDF does not import that renderer;
its editor remains free of decorative GPU work. No push or deployment.
