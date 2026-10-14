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

## 2026-10-13 — PDF constructors and shared utility controls

Merge PDFs and Images to PDF now use one Air file queue: open ruled rows, full
wrapped filenames, optional previews, natural sorting, explicit start/up/down/end
moves, handle-only drag, keyboard reorder and persistent removal/Undo. Sorting
preserves manual order. Undo restores focus even while sorted or after removing
the final file. Previews retain lazy decoding and release their object URLs.
Populated file acquisition compacts above 640px so the queue owns the workspace.

Shared actions preserve their geometry and keyboard focus during real work,
guard duplicate activation, and announce busy state separately. Segments, errors
and measured progress use the pinned Air skins. Unknown progress invents neither
percentage nor fill. Constructors retain inputs on errors, reject invalid intake,
guard late delivery after navigation and show persistent, truthful download status.
The old orientation gate is removed: all six non-AI utility entries remain
reachable at 844×390, and rotating a populated constructor preserves its result.

Validation includes 112 final DOM layout/theme/text cases (two populated tools ×
14 dimensions × 16/32px text × light/dark), including 639/640/641px neighbours.
No page overflow, inspected control clipping or undersized coarse control height
was found. Desktop light and phone dark screenshots were reviewed; this is not
112 independent visual reviews. Native Safari and Firefox shared-component checks
pass at actual 200% browser zoom using an explicitly labelled disposable fixture.
Chromium forced colours/reduced motion, sorted/unsorted Undo, boundary action
focus and keyboard reorder pass. Physical touch/software keyboard and screen-reader
speech/navigation remain open, so inventory `validated` remains false.

Real outputs were inspected: reordered Merge pages have distinctive dimensions
500×600, 300×400, 400×500; reordered Fit images produce 1200×630 then 180×180 pages.
A held real image operation verifies duplicate guarding, stable action width/height,
blocked intake/queue edits, and zero late downloads after leaving. Both previews
are revoked. The temporary fixture and all owned test tabs/emulation were removed.

Required check, dead-code, 355/355 units, production/PWA build and 139-file asset
limits pass. All six standalone production workflows pass, including a new sorted
Undo focus/manual-order regression and actual PDF/ZIP/encryption/signature checks.
Generated demo PDFs were used explicitly because the original scanned/guide
fixtures are absent. Home routing, responsive motion, fresh-profile desktop/mobile
editor smokes and extended keyboard/pointer/date/colour interactions pass.
The separate placement/preview suite passes on all three available root fixtures
(33, 1 and 4 pages), including signature resize and QR placement on every page.
Smoke-deferred destructive redaction/smart-erase and full OCR/AI processing remain
on their dedicated pending migration gates.

Regression testing exposed a real editor registration defect: an outgoing tool's
passive cleanup could erase the incoming tool's layout registration, making Crop
pan the canvas. Cleanup now runs in the layout phase; clean production suites pass.
One persistent-profile retry still served the prior build. A cold-profile cache
notice also covered the date field during the test; the test now dismisses its
visible action first and retains diagnostic failure capture. Reserved hidden busy
labels required the standalone test to match visible source labels. No assertion
or timeout was weakened and no failure was waived.

Removed duplicate queue JSX, the old action skin/hover motion, sliding segment
thumb, orientation component/rotation animation, unused drag type and stale source
references. PDF engine/output formats and AI are unchanged. The shared canonical
bundle is unchanged. Other utility-specific option/result bodies, AI and editor
chrome/panels/overlays remain upcoming pieces; this is not a completed PDF refresh.
No push or deployment.

Evidence: [state/layout record](evidence/constructors-2026-10-13.json),
[test output](evidence/constructors-checks-2026-10-13.log),
[desktop](evidence/queue-images-desktop-light.png),
[phone](evidence/queue-images-phone-dark.png),
[Safari](evidence/queue-safari-200.png), [Firefox](evidence/queue-firefox-200.png).

## 2026-10-14 — Extract Images and shared file identity

Extract Images now uses Air file identity, an open thumbnail gallery with native
checkboxes, full-resolution captions, guarded bulk selection, selected count/size,
and shared actions/notices. Previews preserve artwork on neutral functional planes;
this is product composition using existing skins, not a new family control or
palette. Selection stays immediate. Valid PDFs without images retain their filename
and show an empty result; malformed/unsupported files offer a readable recovery.
Encrypted files keep the existing Password hand-off and focus-safe replacement.

Loading exposes real page progress and Cancel scan. Cancellation/unmount aborts the
scan, destroys its PDF.js task and releases canvases; late results cannot overwrite
a replacement document. Busy ZIP work preserves action geometry/focus and blocks
selection/replacement/repeated dispatch. Leaving prevents a late download. Errors
retain images and selection for retry; completion truthfully says download requested.
Shared FileInfoBar consumers inherit wrapped names, plain metadata and the same
change action. Password's remaining options/results and the other utilities are
separate upcoming slices. AskPDF's loaded-model consumer remains on its AI gate.

Validation: 176 DOM cases cover selected/success, busy ZIP, empty and corrupt
recovery at all eleven contract dimensions × light/dark × 16/32px root text.
There is no document overflow, inspected clipping or undersized coarse target.
These are geometry checks, not 176 independent visual reviews. Representative
phone, tablet, laptop and desktop screenshots were reviewed. Safari and Firefox
loaded the actual three-image synthetic PDF at native 200% browser zoom; selection,
scrolling and reachable actions pass. Forced colours preserve checkbox/check/focus
indicators; reduced motion reports no running animation. Physical touch/software
keyboard and screen-reader speech/navigation remain open (`validated: false`).

The enhanced six-tool production regression verifies an individual full-resolution
PNG signature/dimensions, full/partial ZIP entry counts and names, byte equality
for the individual PNG and both partial-archive entries, document-order output
despite reverse selection, failed ZIP retry with selection
intact, zero-selection guards, empty results and intake focus. Holding the second
real canvas conversion verifies measured 1-of-3 progress, focused Cancel scan,
worker termination, zeroed canvas and a replacement PDF surviving the obsolete
callback. A separate held ZIP read verifies fixed 358×44 action geometry, one
operation despite repeated native key activation and zero downloads after leaving.

Passing required gates: `vp check`, `pnpm check:dead`, `pnpm test` (355/355 in 34
files), `vp run build` (production/PWA and 139 deployable assets), and
`E2E_URL=http://127.0.0.1:8132 E2E_DEMO_FIXTURES=1 node --experimental-strip-types tests/e2e/standalone-tools.e2e.ts`
(all six). Design inventory/source/portability and canonical sync checks are recorded
in the companion log. The original scanned/guide fixtures are absent; generated
demo fixtures are explicitly used. Full editor, OCR and AI gates stay with their
pending migrations; no engine algorithms/output format changed in this slice.

Initial verification found the replaced spinner unused; it and its old hook example
were removed. Lint findings in test method wrappers were corrected. ZIP byte
inspection first exceeded Node's 1 MiB subprocess buffer; only the test's `unzip -p`
buffer was increased to 64 MiB. A final rerun first used an incorrect environment
variable and attempted port 5173; using the documented `E2E_URL` passed all six.
No assertions/timeouts were weakened and no required failure was waived.

Removed LoadingSpinner, the old file-info selector and replaced extractor styles.
Canonical skins/tokens are unchanged. Own browser tabs/emulation are cleaned up;
the synthetic test download was moved to temporary storage. No user tab reload,
push or deployment. Evidence: [state record](evidence/extract-2026-10-14.json),
[checks](evidence/extract-checks-2026-10-14.log),
[desktop](evidence/extract-desktop-light.png), [phone](evidence/extract-phone-dark.png),
[tablet](evidence/extract-tablet-light.png), [laptop](evidence/extract-laptop-dark.png),
[recovery](evidence/extract-recovery-phone-dark.png),
[forced colours](evidence/extract-forced-colours.png),
[Safari](evidence/extract-safari-200.png), [Firefox](evidence/extract-firefox-200.png).

## 2026-10-14 — Password options and results

PDF Password now uses Air's single-contour grouped fields, labelled visibility
controls, native permission choices, open layout and shared actions/notices. Add
and remove modes retain the selected file and clear, focused recovery. Permission
restrictions are explicitly enabled; the six bits/defaults and AES-256 engine are
unchanged. The viewer-compatibility disclosure remains next to the choices.
Malformed PDFs now offer a real retry/change-file state instead of falling through
to protection options. Wrong passwords receive one inline error and focused input.

Detection cancellation restores intake focus and invalidates old callbacks; it does
not claim to abort the parser. Replacing the file clears secrets, visibility,
permission choices and prior feedback. Busy operations keep drafts read-only,
disable settings/replacement, guard duplicate dispatch synchronously and suppress
late download/editor delivery after navigation. Completion says download requested
and preserves the source. A forced file-read failure followed by an unchanged-input
retry successfully opened the editor.

Validation records 264 DOM geometry observations across six states (add/mismatch
with permissions, protection busy, detection, corrupt recovery, wrong password and
unlock success), every eleven contract dimensions, both themes and 16/32px root
text. Another 44 observations recheck the final canonical icon-button geometry.
No document overflow, inspected clipping or undersized coarse target was found.
These are geometry observations, not 308 independent visual reviews. Representative
phone/tablet/laptop/desktop screenshots were inspected. Native Safari and Firefox
passed actual 200% zoom with populated fields, visibility and permission controls.
Forced colours retain labels/focus; reduced motion has no running animation.
Physical touch/software keyboard and screen-reader speech/navigation acceptance
remain open (`validated: false`).

Final keyboard review caught a product fallback focus rule overriding the shared
field action's inset outline. The fallback now excludes canonical Air buttons and
icons; the field action computes to the specified -4px inset. The field group has
one 1px border, the input has zero border and no shadow. No shared tokens/skins
changed. The wrong-password error is inline only, and the visibility control uses
the canonical icon-button class. A corrected mismatch now clears immediately while
typing instead of waiting for blur; the production test asserts that behavior.
Evidence JSON formatting was corrected before the final passing check. Final build
and standalone checks were repeated after these corrections.

The six-tool production regression verifies show/hide, mismatch correction,
permission mask -44 and AES-256 encryption dictionary, complete raw-stream equality
after protection/unlocking, unencrypted output/page count, wrong-password retry,
empty-password compatibility and real editor handoff. It holds a real file read to
verify cancellation focus and replacement surviving obsolete detection. A separate
held operation keeps a 358×44 action, accepts one read despite repeated native key
activation, and delivers zero downloads after leaving.

Required checks pass: `vp check`, `pnpm check:dead`, `pnpm test` (355/355 in 34
files), `vp run build` (production/PWA, 135 assets within 25 MiB), all six standalone
production flows with `E2E_URL=http://127.0.0.1:8132 E2E_DEMO_FIXTURES=1`, design
inventory/source/portability and canonical sync. Generated demo fixtures explicitly
substitute for absent scanned/guide originals. Editor, OCR and AI migration gates
remain separate. No assertions or timeouts were weakened and no required failure
was waived.

Removed the replaced password input skin, uppercase mono headings, tinted status
icons, old disclosure/info-callout usage and redundant async state. Existing
components still used by unmigrated tools remain tracked. Own native/IAB tabs,
zoom/emulation and synthetic download were cleaned up; browser password saving was
declined. No user tab reload, push or deployment.

Evidence: [state record](evidence/password-2026-10-14.json),
[checks](evidence/password-checks-2026-10-14.log),
[desktop](evidence/password-desktop-light.png), [phone](evidence/password-phone-dark.png),
[tablet recovery](evidence/password-tablet-recovery-light.png),
[laptop recovery](evidence/password-laptop-recovery-dark.png),
[forced colours](evidence/password-forced-colours.png),
[Safari](evidence/password-safari-200.png), [Firefox](evidence/password-firefox-200.png).

## 2026-10-14 — Digital Signature options and results

Digital Signature now uses the pinned Air file summaries, single-contour fields,
grouped certificate-password visibility control, segmented source choice, shared
actions/notices and open metadata groups. Import, generation, existing signatures,
optional details, loading, completion and recovery all share the same language.
Long names and filenames wrap. Self-signed trust and existing-signature invalidation
disclosures remain visible; embedded details explicitly do not claim validation.

PDF detection cancellation ignores obsolete results and restores intake focus.
Certificate generation cancellation terminates the actual crypto worker; cancelled
imports skip parsing after their file read finishes. A new import can complete
before that obsolete read resolves: the cancellable operation owns its synchronous
guard, so ActionButton does not retain a second pending guard. Replacement/mode
changes clear stale identities and secrets. Busy drafts are read-only, duplicate
signing is guarded, and leaving suppresses late downloads. Wrong passwords and
malformed certificates retain the file and focus the password field. Signing
failures retain identity and details for retry. Completion says download requested.

Output verification exposed two pre-existing encoding issues. PDF Contents padding
now permits only zero bytes after the complete DER object, without trimming real
DER nibbles. Self-signed names explicitly use UTF8String; imported attribute display
and CMS issuer encoding preserve Unicode instead of double-encoding the signer
identifier. The embedded original certificate/chain, RSA-2048 and SHA-256 remain
intact. The production suite independently verifies generated Unicode signatures,
imported leaf/issuer chains and empty-password PKCS#12 output using OpenSSL/LibreSSL
CMS. It skips CA trust for these synthetic certificates, not signature integrity.
ByteRange coverage, page counts, exact source streams and reopened metadata pass.

484 DOM geometry observations cover eleven contract sizes, both themes and
16/32px root text across generated-ready, signing-busy, success, existing signature,
certificate error, imported-ready, corrupt PDF, detection, generation, import busy
and encrypted PDF states. No document overflow, inspected clipping or undersized
coarse targets were found. These are geometry observations, not independent visual
reviews; representative desktop/laptop/tablet/phone screenshots were inspected.
Native Safari and Firefox passed actual 200% zoom with generation and metadata
fields. Forced colours preserve labels and focus; reduced motion has zero running
animations. Physical touch/software keyboard and screen-reader speech/navigation
remain open, so inventory `validated` stays false.

Required checks: `vp check`, `pnpm check:dead`, `pnpm test` (359/359 in 35 files),
`vp run build` (production/PWA; 129 deployment assets within 25 MiB), all six
standalone production workflows with `E2E_URL=http://127.0.0.1:8132
E2E_DEMO_FIXTURES=1`, design inventory/source/portability and canonical sync. The
E2E harness now selects icon controls by accessible label and retires already
verified synthetic downloads before same-name replacement; no assertion or timeout
was weakened. Generated demo PDFs substitute for missing original fixtures. AI,
OCR, editor migrations and full product acceptance remain separate.

Removed the old signature input skin, boxed/tinted metadata, uppercase mono
labels, custom action presentation, obsolete imports and redundant async state.
The cancelled import no longer leaves a dangling action guard. InfoCallout and
useAsyncProcess still have real consumers in other tools and are retained. New
CSS only composes shared tokens; no new palette, breakpoint or control skin was
introduced. No contract change, push or deployment.

Evidence: [state record](evidence/signature-2026-10-14.json),
[checks](evidence/signature-checks-2026-10-14.log),
[desktop](evidence/signature-generated-desktop-light.png),
[phone](evidence/signature-generated-phone-dark.png),
[existing signature](evidence/signature-existing-tablet-light.png),
[import recovery](evidence/signature-import-recovery-laptop-dark.png),
[imported identity](evidence/signature-imported-phone-light.png),
[forced colours](evidence/signature-forced-colours.png),
[Safari](evidence/signature-safari-200.png), [Firefox](evidence/signature-firefox-200.png).

## 2026-10-14 — Compare inputs and results

Compare now uses Air file identity, segmented modes, page navigation, native
labelled difference selection and thumbnail controls. Both names remain visible;
missing pages and changed pixels have explicit text. Different page sizes keep
original pixel coordinates instead of stretching the documents. The selected
thumbnail stays visible on navigation and resize without scrolling the document.

Cancellation owns both PDF.js tasks and active renders. Failed or cancelled reads,
encoders and partially built pages release all canvases/URLs, including URLs created
before a result is added. Replacement/reset/unmount revoke finished previews;
obsolete reads cannot replace new files. Failures retain inputs and focus recovery.
Original bytes are untouched. Comparison remains visual, not metadata comparison.

484 geometry observations cover 11 states × 11 contract sizes × light/dark ×
16/32px root text. Representative screenshots were reviewed; thumbnail containment
was corrected before the final result pass. Coarse controls are at least 44px;
forced-colour keyboard toggling and reduced motion pass. The compact editor pager
works at 320px. Native Safari and Firefox render, toggle and navigate at actual
200% zoom. The full-page forced-colour screenshot includes an off-viewport fixed
skip link; a live geometry check confirms its bottom is -28px and it is hidden
until focus. Physical touch/software keyboard and screen-reader acceptance remain
open; inventory `validated` remains false.

Passing: format/lint/type, dead-code, 366 tests in 36 files, build/PWA and 128-asset
limits, all six standalone production workflows, desktop and mobile editor smoke,
portable design integrity/inventory and canonical sync. Expanded comparison tests
verify identical transparent overlays, real changed pixels, unequal dimensions,
missing pages, keyboard/resize navigation, source equality, encrypted/corrupt
recovery, cancellation/retry and URL cleanup on reset, replacement and unmount.

Removed the old inline comparison pipeline, unused average, colour badges,
uppercase mono labels, thumbnail skin and unused stepper size/variant API/tests.
No dependencies, shared tokens or contract changes. Compare's chunk is 11.20 kB raw / 4.14 kB gzip (previously 12.37 /
3.69 kB). The gzip increase pays for cancellation/recovery and geometry preservation.
Only two representative screenshots enter Git; the larger local review set is
referenced by the evidence record. No push or deployment.

Evidence: [state record](evidence/compare-2026-10-14.json),
[checks](evidence/compare-checks-2026-10-14.log),
[desktop](evidence/compare-side-by-side-1440-light-16.png),
[phone](evidence/compare-overlay-390-dark-16.png).

## 2026-10-14 — AI setup and shared model tier picker

The setup gate now presents native Air radio choices, full-bundle download and
estimated peak-RAM totals, model-source/privacy disclosure and a neutral download
action. One controlled status replaces unused overrides and the gate's duplicate
chat-only loader; `useRagModels` owns return-visitor loading for the full bundle.
A partial cache waits for the explicit download action. Removed old palette,
monospace controls, fake radio-button bookkeeping, duplicate warning and stale
single/two-model API commentary. No dependencies added.

88 geometry cases cover both tiers × all 11 required viewports × light/dark ×
16/32px root text, without page overflow or undersized targets. Reviewed desktop,
laptop, tablet and narrow screenshots. Coarse landscape gives 44px buttons;
forced colours use native radios; reduced motion has no setup animations. Native
Safari and Firefox radio navigation and real 200% page zoom pass.

Required format/lint/types, dead code, 366 unit tests, production build and design/
portability checks pass. The real AI suite passes cold loading, cached return,
questions/extraction and Quality→Compact model switching with a generated answer.
The shared-modal suite passes ownership/stack/focus plus native tier arrows,
Home/End, one Tab stop, changed estimates, persistence and the partial-cache guard.
One initial network-idle timeout did not recur on the diagnostic rerun; no product
failure was observed. The old shared modal motion still reports an invalid numeric
translateY warning and is queued with the modal-frame migration.

Evidence: `evidence/ai-setup-2026-10-14.json`, compact check log, and two representative
screenshots. Remaining screenshots and raw geometry stay outside Git. Modal
interiors, download/error/progress, storage actions, chat and editor are **not**
certified by this slice. Physical touch/assistive speech remain open.

## 2026-10-14 — Shared modal frame and AI model dialogs

The shared modal frame now follows Air geometry and motion, with a scrollable
phone sheet, consistent 44px close target and ownership retained through exit.
Consent/loading/error, model details, confirmed cache deletion, model switching
and loaded-model actions use the same controls. Export and command palette adopt
the frame; their interior migrations remain separate work.

Progress reports models actually ready and bytes received, never an estimated
percentage. Free memory stays idle until explicit reload. Warm-load cancellation
remains recoverable. Cache deletion handles CacheStorage denial and aborted IDB
transactions without false success; successful deletion waits for the IDB commit.
Other cached tiers remain discoverable. Pending tier selection resets before a
reopened dialog paints. Safari's default Tab behavior exposed skipped model links;
the shared focus loop now includes every eligible control while preserving one
Tab stop per native radio group. AI triggers explicitly retain return focus.

268 geometry cases cover details, deletion confirmation, loading, download error
and model switching across every Air viewport, both themes and 16/32px root text;
four states also include 639/640/641px breakpoint neighbors. No horizontal overflow
or undersized coarse targets. Screenshots reviewed, including short landscape,
forced colours, enlarged text and actual Safari/Firefox 200% browser zoom.
Pointer timing, keyboard/reduced motion, exit inertness and reopen pass. Physical
touch/software keyboard and assistive speech remain open (`validated: false`).

Passing: formatting/lint/types, dead-code, 366 unit tests, production build/PWA and
127-asset limit; shared-modal, model-state/recovery, real AI, command palette,
responsive-motion and three-fixture editor feature suites; design/portability.
The real AI suite verifies questions/extraction, warm return, cancelled pending
choice, model switching, one radio Tab stop, RAM release and explicit reload of
the existing document session. Persistent tests now bypass old service-worker
builds while retaining actual model/index caches. The modal-state test similarly
bypasses the service worker to intercept model requests reliably.

Removed the old dialog skin, unused animation presets, aggregate progress helper,
single-model consent API, duplicated details owners/storage markup and local
geometry overrides. No dependencies or contract changes. Ask PDF decreases from
611.72/181.88 to 596.20/179.08 kB raw/gzip. Two proof images enter Git; the larger
review set remains local. No push/deploy. Chat/indexing/citations, export/palette
interiors, every remaining editor surface and sibling apps remain tracked.

Evidence: [state record](evidence/ai-modals-2026-10-14.json),
[checks](evidence/ai-modals-checks-2026-10-14.log),
[desktop](evidence/ai-modals-details-1440-light.png),
[phone](evidence/ai-modals-loading-390-dark.png).

## 2026-10-14 — Export dialog interior

All six formats now use native Air radios, open switch rows, native compression
segments and neutral actions. Long filenames wrap. The compact Export trigger
stays icon-only below 1024px to avoid tablet crowding. Removed the numbered grid,
accent strips, unused modal-label helper/CSS and obsolete adapter imports/comments.
Other editor consumers still use the old Switch/Segmented adapters and remain tracked.

Export owns its phase and retry feedback inside the dialog. A synchronous guard
prevents duplicate work; choices and dismissal are protected during preparation.
The existing processing routines have no cancellation API, so the status explicitly
asks the user to keep the window open until settlement. Failure retains settings
and focus, and Retry works. Temporary download anchors/URLs now clean up on failure.

Passing: format/lint/types, dead-code, 366 tests in 36 files, production build/PWA,
127-asset deployment limits, design integrity and 17 portability assertions.
Export, shared-modal, AI-state/recovery, command-palette, desktop/mobile editor,
rotation, embedded-font and responsive-motion browser suites pass. The shared frame
now stops global editor key listeners from reaching background work; native field
keys and the palette toggle are retained. A pending-redaction shortcut regression
and 192 additional AI state layouts pass. The output suite verifies every format, all compression
levels/modifiers and combinations, exact unchanged source bytes/history, PNG geometry,
ZIP page order, grayscale pixel channels, flattened forms and stripped metadata.
All six formats burn pending redactions; PDF operators, PNG pixels and OCR extraction
prove covered content cannot survive. Unapplied Organize warnings remain explicit.

320 layout cases cover five states across all required viewports and 640/1024px
neighbors, both themes and 16/32px root text. Label targets are checked as well as
buttons. Native Safari/Firefox keyboard operation, trigger return and actual 200%
zoom pass. Forced colours and reduced motion reviewed. Physical touch, software
keyboard and assistive speech acceptance remain open (`validated: false`).

No dependencies or contract changes. Net production change: 20 lines removed.
Editor chunk: 305.35 → 303.46 kB raw, 86.61 → 86.60 kB gzip. CSS grows 0.16 kB gzip
for native choice composition. Two synthetic-document proof PNGs are committed;
full captures and geometry remain local. No push/deploy. Command palette is next,
then Ask PDF chat/indexing/citations and every remaining editor surface.

Evidence: [record](evidence/export-2026-10-14.json),
[checks](evidence/export-checks-2026-10-14.log),
[desktop](evidence/export-desktop-1440-light.png),
[phone](evidence/export-images-390-dark.png).
