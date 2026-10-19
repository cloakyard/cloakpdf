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

## 2026-10-14 — Command palette interior

The palette now uses the shared Air compound search, quiet clear action, normal
case category labels, neutral selected rows and a small blue selection marker.
Descriptions wrap; keyboard hints remain readable on phones. The command modal
uses the same full-width phone sheet as other dialogs. Empty results have a real
recovery action outside the listbox, with no nested scroller clipping the action.

Replaced numbered rows, tiny mono labels, the tinted ledger and old search contour.
Removed post-paint reset/clamp effects and pointer-driven auto-scrolling. Content
mounts fresh for every opening, including Cmd/Ctrl-K toggles. IME composition holds
filtering until confirmation and cannot execute commands or dismiss the modal.
A stable trigger key preserves focus across desktop/mobile control replacement.
No dependencies, token overrides or parallel component implementations were added.

Passing: format/lint/types, dead-code, 366 units in 36 files, production/PWA build
and 127-asset deployment limit, 84 surface records and 17 portability assertions.
Command palette, shared-modal, real Export outputs, AI states/recovery and responsive
motion suites pass. The palette covers real Crop, Page numbers and Attach handoffs,
name-first ranking, actual Undo/Redo/Reset history, keyboard wrapping/scrolling,
clear/no-results recovery, composition, reopen, focus return and forced colours.

192 layout cases cover default/filtered/empty states, 16 viewport sizes including
640/1024px neighbors, both themes and 16/32px root text. Query state survives the
matrix. Three additional short/enlarged cases check focused recovery visibility.
Export's 320 and AI dialogs' 192 layout cases also pass after shared changes.
Native Safari/Firefox keyboard and actual 200% zoom inspected. Firefox's final
recovery check used the updated production preview after its cached build was
replaced. Physical touch/software keyboard, real OS IME and assistive speech gates
remain open (`validated: false`). The rest of the editor remains explicitly pending.

Editor JavaScript decreases 303.46 → 302.42 kB raw / 86.60 → 86.41 kB gzip; shared
CSS grows 142.88 → 144.03 kB raw / 24.63 → 24.86 kB gzip. Production adds 127 net
lines for composition and input behavior. Only two synthetic-document proof PNGs
and compact evidence enter Git; larger browser captures stay local. No push/deploy.
Next: Ask PDF chat, indexing, citations and recovery, then remaining editor surfaces.

Evidence: [record](evidence/palette-2026-10-14.json),
[checks](evidence/palette-checks-2026-10-14.log),
[desktop](evidence/palette-desktop-1440-light.png),
[phone](evidence/palette-phone-390-dark.png).

## 2026-10-14 — Ask PDF conversation and recovery

Ask PDF now uses an Air reading panel, labelled single-contour composer, quiet
source-page actions and normal sentence-case author/status labels. Text/OCR and
search preparation report actual page/passage units; unknown work has no invented
percentage. Markdown keeps readable prose, locally scrolling code/tables and safe
links. Answers do not embed remote images. Source actions open the original local
PDF in a new tab, with page fragments and object-URL cleanup.

A synchronous send guard protects the next draft while answering. Failed answers
retain partial text and their original question; retry preserves the next draft
and returns focus. Preparation errors wait for an explicit retry instead of
restarting themselves. Per-attempt ownership ignores obsolete indexing results,
and session/turn ownership ignores late tokens after file replacement/navigation.
Model readiness now depends on stable loader methods, avoiding preparation resets
on every render. Streaming updates are immediate and scroll only the transcript;
scrolling up preserves the reader's position, with a keyboard-accessible return.

Passing: format/lint/types, dead-code, 366 units in 36 files, production/PWA build
and 128-asset size gate, 83 inventory records and 17 portability assertions.
The chat suite covers 448 viewport/theme/root-text cases across seven states,
including all contract sizes and 640/1024px neighbors. It checks unknown and all
measured progress stages, explicit errors/retry, duplicate sends, synthetic IME,
Shift+Enter, the 500-character limit, partial answers, focus/draft retention,
byte-identical source links, unsafe markdown, scroll ownership, replacement,
navigation, URL revocation, reduced motion and forced colours.

Real-model integration passes against the production build: initial/warm answers,
exact factual extraction, tier swap, preserved document history and free/reload.
AI modal recovery/storage/download tests also pass (192 layout cases), plus the
real-model details/picker layouts. Native Safari/Firefox keyboard and actual 200%
zoom inspected with deterministic synthetic answers. Safari source navigation
opens the original PDF. Physical touch/software keyboard, real OS IME and assistive
speech acceptance remain open (`validated: false`). Underlying extraction/embedding
is not abortable; replacement discards obsolete results rather than pretending the
work stopped. The full editor and family migration remain pending.

Removed the old weighted progress helper, transcript/composer skins, per-token
smooth scrolling, destructive answer-error clearing and obsolete model comments.
Deleted the unused InfoCallout component and its centre-only selector; the base
notice still has live FindAct/Redact consumers and stays on the editor TODO.
Production removes 216 net lines with zero dependencies. Ask PDF JavaScript drops
596.21 → 589.71 kB raw / 179.08 → 177.51 kB gzip; shared CSS drops 144.03 → 142.91 kB
raw / 24.86 → 24.72 kB gzip. The test-only RAG double is isolated in the browser
harness and adds no production switch. Only two synthetic proof images and compact
evidence enter Git; private real-model replies and the larger capture matrix stay
local. No push/deploy.

Next: editor header/tool navigation, then properties/page navigation/thumbnails,
canvas surround and all remaining panels/overlays.

Evidence: [record](evidence/chat-2026-10-14.json),
[checks](evidence/chat-checks-2026-10-14.log),
[desktop](evidence/chat-desktop-1440-light.png),
[phone](evidence/chat-phone-390-dark.png).

## 2026-10-14 — Editor navigation and compact toolbar

The filename, shared page selector, view controls, history and Export now share
one 64px toolbar at normal text size across the required widths. Desktop shows
the filename alone. Tablet/phone use the document mark to disclose the full name
and Back to home; pointer hover, keyboard activation, tap, Escape and outside
dismissal work without a second permanent row. Pending redaction/erase marks
remain visible as a compact badge with detail in that disclosure. Enlarged text
may reflow instead of clipping controls.

The 72px labelled Air rail has neutral selection and one blue marker. The mobile
picker uses full tool names, persistent single-contour search, ranked matches,
clear/empty states and immediate navigation. Expand/split preserves the mounted
document and tool values; Cancel/Done returns focus to the picker. Width-led
768/1024px breakpoints keep ordinary 1280×720 laptops in desktop mode and use the
working sheet for short sub-tablet landscape.

Palette commands now run after the outgoing modal releases inertness. First and
repeated tool selection focus the tool heading in Chromium and native Firefox.
Safari document-disclosure activation explicitly focuses its trigger so Escape
returns correctly. Global history shortcuts respect modal and busy ownership.

Passing: format/lint/types, dead-code, 366 unit tests in 36 files, production/PWA
build with all 128 deploy assets within the 25 MiB limit, 83 inventory records
and 17 portability assertions. The navigation suite covers 176 layouts across
18 sizes, both themes, normal/200% root text, coarse targets, expanded controls,
changed-breakpoint neighbors and four additional long-filename cases. It verifies
page/zoom and actual stage-node preservation, density changes, real apply/undo,
modal shortcut ownership, mobile search/focus, document disclosure, reduced
motion and forced colours. Existing desktop/mobile editor, feature, interaction,
palette, export, modal and responsive-motion suites pass. Organize's smoke gate
now waits for the committed board and busy state, rather than the removed subtitle.

Final desktop/laptop/tablet/mobile light and dark renders inspected. Native Safari
and Firefox keyboard paths and actual 200% browser zoom pass, including the new
document disclosure and Escape return. Only synthetic-document proof images and
compact records enter Git; larger captures remain local. Physical touch/software
keyboard, real OS IME and assistive speech acceptance remain open (`validated: false`).

Removed the duplicate editor stepper, previous header/rail/mobile skins, old
short-edge breakpoint rules and unused rail/ledger icon motion selectors. Existing
legacy panel/canvas consumers remain tracked for their own replacement. No added
dependencies. This completes the navigation slice, not the full editor or family.

Next: properties/page context, overview and thumbnails, then remaining canvas
chrome, panel interiors and overlays with the same validation and commit gates.

Evidence: [record](evidence/navigation-2026-10-14.json),
[checks](evidence/navigation-checks-2026-10-14.log),
[desktop](evidence/navigation-desktop-1440-light.png),
[phone](evidence/navigation-phone-390-dark.png).

## 2026-10-14 — Inspector and page collections

The inspector now uses the Air type scale and controls, with a pinned tool heading,
secondary description and reachable Cancel. The empty panel offers a direct path
to Organize, without a repeated page-count subtitle. Tool changes are immediate.
The shared Apply action adopts the family skin across desktop panels while mobile
keeps its single Done action.

Browse and Organize now share responsive grid geometry and quiet page cards.
Selected pages use a neutral surface and one blue marker. Page identity is separate
from output position; deleted pages retain readable Restore controls and an explicit
Removed label. Four named page actions reflow to two columns when necessary. Moving
a page keeps the same action focused and visible, including at boundaries and in
long collections, and announces its new position. Saved and pending rotations show
the whole thumbnail. Unavailable previews retain labelled geometry.

Real output/history tests exposed and fixed a stale count after Undo/Reset: restored
bytes, page metadata and page count now agree. New page geometry invalidates an old
Organize plan even when its count is unchanged. Explicit Cancel clears the active
draft; ordinary tool navigation still preserves it. Desktop Apply registration also
exposes Cancel before a pending edit is committed. Blank scanning reports a recoverable
failure instead of claiming no blanks were found, and discards obsolete results.

Passing: 88 collection layouts (all 11 required sizes, light/dark, normal/200% root
text, both collection modes), no horizontal overflow or undersized page actions.
The suite checks portrait/landscape rotations, keyboard and real pointer reordering,
delete/restore/all-removed safeguards, scan failure/retry, thumbnail fallback,
overview-to-canvas focus, real exported page count/order/rotation, Apply/Undo/Redo/
Reset/Cancel, one-page density, and visible focus in a 60-page document. Reduced
motion and forced colours inspected. Native Safari and Firefox named-action keyboard
paths and actual 200% browser zoom pass; Safari uses its standard Option-Tab path.

The nine existing navigation, desktop/mobile editor, feature, interaction, palette,
export, modal and responsive-motion suites pass. The combined desktop/mobile suites
mount all 22 tools. Format/lint/types, dead-code, 366 unit tests in 36 files,
production/PWA build and 128-asset size gate, 84 surface records, and 17 portability
assertions pass. Physical touch/software keyboard, real OS IME and assistive speech
acceptance remain open (`validated: false`).

Removed the former inspector/collection/Organize/Apply skins, the unused panel
entrance animation and thumbnail class override, stale milestone/animation comments,
and the count-only plan reset. Reused family styles and one small grid wrapper; no
new dependency. Only two synthetic proof images and compact evidence enter Git.
The shared contract remains 1.0.0; its portable PDF appendix records the new rules.

Next: canvas surround, page/selection chrome, zoom/pan and context overlays, followed
by every remaining tool interior. This completes the collection slice, not the editor.

Evidence: [record](evidence/collections-2026-10-14.json),
[checks](evidence/collections-checks-2026-10-14.log),
[desktop](evidence/collections-desktop-1440-light.png),
[phone](evidence/collections-phone-390-dark.png).

## 2026-10-14 — Canvas and consistent header identity

The landing and editor now share the same 36×36px mark at every required width.
The document trigger remains at least 44px and the normal-text toolbar stays 64px.
Air 1.0.1 records this family rule and a dedicated on-paper accent, so dark mode
keeps readable selection handles against white PDF paper. The surrounding canvas
uses quiet Air surfaces, responsive 16/24/32px space and one paper focus contour.

Inline text has an opaque background and a single focus contour. Author font,
colour, exported size and multiline leading remain intact. Zoomed-out touch
editing keeps a visible 16px font floor; the field stays inside the page. Composition
candidate Enter/Escape does not commit or cancel, explicit cancellation returns
focus to paper, and clicking another control commits once without stealing focus.
Browser/OS modifier shortcuts keep native ownership. Overlapping resize targets
choose the nearest handle, with 44px touch targets and unchanged visible handles.

Passing: 68 canvas layouts across the 11 required sizes plus six breakpoint
neighbors, light/dark and normal/200% root text; no document overflow or clipped
paper. Desktop/laptop/tablet/phone captures inspected in both themes. Synthetic
composition, keyboard/blur ownership, selection pixels, forced colours and reduced
motion pass. Native Safari text cancellation/focus and native Safari/Firefox actual
200% browser zoom pass. Physical touch/software keyboard, real OS IME and assistive
speech acceptance remain open (`validated: false`).

All 15 applicable browser suites pass: canvas, desktop/mobile editor smoke, features,
interactions, palette, navigation (176 layouts), collections (88), export, modals,
responsive motion, annotation fonts, desktop/mobile placement/resize and stamp
preview. These include real exported annotations, embedded fonts, signature/QR
Apply and history. Format/lint/types, dead-code, 367 units in 36 files, production/
PWA build, the 128-asset size gate, design integrity and 17 isolated portability
assertions pass. Mobile placement now waits for its real signature canvas rather
than a description deliberately removed from compact controls in the earlier slice.

Removed unused canvas palette fields, duplicate accent literals/options, old
canvas/inline-field skins and small-logo overrides. Inventories read the pinned
manifest version instead of a separate hardcoded version. No new dependencies.
Only two synthetic proof images and compact results are checked in.

Follow-up: saved /Rotate and non-origin CropBox placement must be checked through
preview and every export writer together; their pre-existing coordinate mismatch
is not changed here. Preview failure handling and the remaining tool interiors/
overlays also remain pending. This is a bounded canvas slice, not a completed editor.

Evidence: [record](evidence/canvas-2026-10-14.json),
[checks](evidence/canvas-checks-2026-10-14.log),
[desktop](evidence/canvas-desktop-1440-light.png),
[phone](evidence/canvas-phone-390-dark.png).

## 2026-10-14 — Visible page geometry and export placement

The focus canvas, thumbnails and point-sized tools now share the visible rotated
page frame, including CropBox/MediaBox intersection, non-origin boxes and UserUnit.
A single graphics-state wrapper maps vector overlays back into PDF coordinates.
Source streams and saved rotation remain intact. Annotations, signatures, QR and
barcode, watermark/seal, numbers, headers/footers, Bates and flat form text use it.
Native form widgets retain their own PDF coordinates.

Crop and Strip furniture now trim rotated pages and existing crops. Pending marks
are remapped to stay attached to content at the same physical size; undo restores
the prior geometry/objects. Invalid/empty crops are ignored. Font suggestions use
physical points and no longer skip saved rotation. Removed raw rotation metadata,
the duplicate thumbnail rotation adjustment, duplicated crop conversions, the unused
crop barrel export, obsolete skip branches and stale copy. No new dependencies.

The new integration suite compares outputs with PDF.js across 12 configurations:
all four rotations with UserUnit 1/2, non-origin/intersecting/disjoint/reversed boxes,
and negative rotation. It checks 10 overlay writers, source pixels, crop pixels,
pending-mark equivalence, erase/redaction followed by vector placement and font size.
48 rotated-page layouts pass in six sizes/light/dark. Desktop/laptop/tablet/phone
renders inspected; direct UI crop/undo keeps an annotation around sideways text.
Four native-form round trips preserve field value, widget bounds and page boxes.

All 16 smoke and seven extended browser suites pass (synthetic demo fixtures).
The geometry suite uses the dev server because it exercises source modules directly:
`E2E_URL=http://127.0.0.1:8122 node --experimental-strip-types tests/e2e/page-geometry.e2e.ts`.
The final production build also passes canvas (68 layouts), collections (88) and
rotate/apply/export regressions. Format/lint/types, knip, 376 unit tests/37 files,
production/PWA build and the 128-asset gate pass. The first five crop regressions
failed against the old implementation and pass after the fix.

N-up/booklet and searchable OCR output require a separate geometry matrix. Preview
recovery and remaining panel/overlay interiors remain pending. Native form visual/
assistive acceptance, physical touch/software keyboard and OS IME remain open.
Air 1.0.1 and the portable contract are unchanged; this implements existing output
fidelity requirements and does not complete the PDF migration.

Evidence: [record](evidence/geometry-2026-10-14.json),
[checks](evidence/geometry-checks-2026-10-14.log),
[desktop](evidence/geometry-desktop-1440-dark.png),
[phone](evidence/geometry-phone-390-light.png).

## N-up/booklet and shared custom select — 2026-10-14

This slice replaces the N-up inspector's old layout picker/toggle/preview skin
with Air. The preview is a single gapless sheet, uses the writer's booklet order
(including blank padding), and shows fold/trim marks only when enabled. Options
survive tool navigation. Pending annotations, signatures and code drafts disable
Apply and provide direct review links; their owning tools retain responsibility
for applying appearance settings before the page structure changes.

The writer embeds the visible CropBox/MediaBox intersection using the inverse
visible-page matrix. Output sheet sizes and letterboxing use physical points,
including saved rotation and UserUnit. Source text stays vector/searchable, form
appearances are fixed into the sheet, and content-free blank pages occupy their
cells without failing. One placement loop serves grids and booklet sides.

The shared Select now uses Air's field, inset icon, menu rows, focus and 40/44px
anatomy. Its existing portal/keyboard/typeahead behavior is retained. A Safari
pointer click now explicitly focuses the combobox so subsequent keys work;
menus anchor at their actual edge and track trigger reflow with a cleaned-up
ResizeObserver. The obsolete Select skins and unused popover-row CSS are removed. Shared
whole-document help text now uses Air semantic colours.
`SimpleTools.tsx` is replaced by the explicit `NupTool.tsx` name. No dependencies.

Validation:

- Five new unit cases failed against the old writer (four physical page sizes and
  an empty stream) and pass after the fix. Full suite: 381 tests in 37 files.
- `nup-layout.e2e.ts`: 23 real PDF output sheets compared against independently
  rendered PDF.js source pages across all five layouts. Eight rotated/unit cases,
  cropped offsets, mixed portrait/landscape, true blank pages and a native field;
  the form text is searchable and appearance pixels are retained.
- 70 layout cases: 1440×900, 1280×720, 1024×768, 768×1024, 390×844, 844×390,
  320×568; light/dark, fine/coarse targets, keyboard picker, blank padding, mark
  toggling, pending-annotation review, Apply/Undo and exact page counts. Additional
  desktop/phone 200% text, forced-colour and reduced-motion checks pass.
- Representative desktop/laptop/tablet/mobile images inspected in both themes;
  native Safari and Firefox pointer-open + keyboard selection and enlarged zoom
  inspected. Firefox's toolbar confirmed 200%. Safari's pointer focus issue was
  reproduced before the fix and verified after it.
- The existing colour-picker interaction test now waits for its scheduled opening
  focus before checking Tab order, removing a race without changing picker behavior.

Evidence: `evidence/nup-2026-10-14.json`, selected screenshots and the check log.
Physical touch/software keyboard, OS IME, assistive speech, non-widget annotation
appearance and the full product migration remain open. Searchable OCR geometry and
stale-result recovery are next. This implements Air 1.0.1; the family contract is
unchanged and the PDF product appendix is regenerated from Cloakyard.

Final gates: 381 unit tests, 16 production smoke + seven extended browser suites
and N-up integration (24 suites), lint/types/format, dead-code, build/PWA/128 asset
limits, design inventory, isolated/adversarial portability and exact family sync
all pass. Main-repo lint/types/build pass. Existing large-bundle advisory remains;
no dependency was added. No push or deployment.

## Searchable OCR and review surface — 2026-10-14

The OCR inspector now uses Air labels, language select, actions and notices. The
preview uses theme-aware reading chrome and unchanged white document paper. Wide
areas show two panes; a container query switches narrow areas to Text/Source,
retaining their working height. Recognised text wraps and can be selected and
keyboard-scrolled. Page navigation remains in the compact toolbar.

Recognition uses PDF.js's visible physical frame for native text and Tesseract's
word boxes for image-only pages. Structured blocks are explicitly requested from
Tesseract 7; previously its text-only default left the writer without positioned
words. OCR dimensions now always follow the rendered crop/rotation/UserUnit frame,
including the shared layout/export extraction path. The writer uses the existing
visible-page matrix and fits each word's width and height. Independent PDF.js
inspection confirms the invisible layer leaves every original pixel unchanged.
Native text is preserved once rather than duplicated.

The preview is tied to the immutable document revision, including pending marks.
Navigation/document changes abort between pages and discard an in-flight result;
workers, canvases and PDF resources are released. Pending destructive marks have
an explicit apply action before recognition, while other drafts link to their
owning tools. This prevents previously extracted text from reintroducing redacted
content. Extraction errors remain visible; writer failures retain the preview for
copy/retry. Unsupported characters and missing positions now fail explicitly,
rather than silently omitting text. Language selection is explicit: the former
Auto entry merely selected English on the primary path.

Removed the unused Tesseract-only OCR helper, synthetic top-stacked text writer,
their raster/preprocessing helpers and stale barrel/comment references. Replaced
the panel's legacy Segmented/colour skins and duplicate layout/plain-text modes
with one extraction path and the shared Air primitives. No dependency added.

Validation:

- 381 unit tests in 37 files; lint/format/types, dead-code and production build pass.
- `ocr-layout.e2e.ts` exercises actual OCR, eight combinations of 0/90/180/270°
  rotation and UserUnit 1/2 with offset CropBoxes, native and blank pages, known
  word-box placement, real recognised-line bounds and identical page pixels.
  Missing geometry and unencodable output reject explicitly. The shared liteparse
  export path also returns real OCR boxes in the correct physical frame.
- Real UI extract/apply/re-extract/undo, persistent extraction failure, application
  retry, delayed abandoned reads, pending-redaction protection, and absence of
  redacted text both before and after searchable output all pass.
- 20 preview states across 1440×900, 1280×720, 1024×768, 768×1024, 390×844,
  844×390 and 320×568, light/dark and fine/coarse input. Menu containment, 40/44px
  controls, 200% text, forced colours and reduced motion checked. Representative
  desktop/laptop/tablet/phone images inspected in both themes.
- Native Safari and Firefox performed actual extraction and apply; the shared
  language select accepted pointer-open + End/Home/Enter. Preview reviewed and
  temporary tabs closed. This is not physical-touch or assistive-speech evidence.
- 16 production smoke suites, seven extended editor suites and the OCR/geometry
  integrations pass (25 browser suites). The geometry regression includes 48
  responsive layouts and the existing writer/output matrix.

Evidence: `evidence/ocr-2026-10-14.json`, selected screenshots and check log.
Unicode font embedding beyond WinAnsi and scanned regions on mixed native/image
pages remain tracked follow-ups. Existing native layers are deliberately retained;
unsupported OCR export raises a visible error without changing the document.
Physical touch/software keyboard, OS IME, assistive speech and full product/family
migration remain open. This implements Air 1.0.1; the family contract is unchanged.

Final gates also include isolated/adversarial portability, 84-surface inventory,
exact six-document/five-bundle sync and main-repo lint/types/build. The 128 output
assets meet the deployment size limit; the existing large-chunk advisory remains.
No push or deployment.

## 2026-10-14 — Preview failure recovery and retained work

The editor keeps valid PDF bytes when a preview fails, and names unavailable
content in the canvas, page grids, OCR source and print preview. One Air retry
strip sits outside the scaled paper. It preserves the mobile preview area, including
at 200% root text. The unavailable-canvas label stays in the surround so it remains
readable at small fit sizes. Direct canvas placement is unavailable until recovery.

Retry renders only missing pages. Thumbnails are explicitly a transient cache:
repair preserves the document and page-array identity, form drafts, pending masks,
Organize plans, actual OCR review and the history cursor/redo branch. Retired URLs
are revoked only when no snapshot still uses them. Byte replacement/unmount aborts
late work; generated partial URLs and canvas memory are released. Preview rasters
are limited to 8 million pixels and a 4096px side independently of output DPI; a
10,000pt-square original retains its physical geometry with a 2828px preview.
Image exports still fail explicitly when rendering/encoding fails.

Cleanup removes the all-or-nothing thumbnail API, unused renderer cleanup option,
redundant thumbnail PNG creation during blank-page scanning, PageThumb's duplicate
local failure state, an obsolete hook example and stale OCR architecture references.
No dependency or family-contract revision; the PDF appendix specifies recovery.

Validation:

- 44 canvas/grid layouts across all eleven Air viewport sizes in light/dark;
  coarse emulation, reduced motion, 200% root text, reachable retry and keyboard
  focus return. Synthetic documents only in committed screenshots.
- Faulted initial encode, failed retry, broken image decode, partial render,
  cancelled work, unchanged geometry, retained redaction/page plan/OCR result,
  Undo/Redo, late retry after replacement, bounded poster and fail-closed PNG export.
- Native Safari and Firefox: the real editor/provider with a synthetic PDF and
  one-shot encoder failure. Both restore the rendered page; Firefox also verifies
  Export focus return at normal scale; actual 200% Firefox zoom retains a reachable
  retry and restores the page. The temporary harness adds no production testing API.
- 384 units in 39 files; lint/format/types, dead-code, production build and all
  128 deployment/PWA assets. All 16 production browser smoke suites, seven extended
  suites, geometry, N-up, OCR and preview-recovery integrations pass. Geometry
  covers 48 responsive layouts; N-up covers 70 layouts/23 real output sheets;
  OCR covers 20 review states plus actual recognition/output/privacy checks.
- A repeated AI modal retry failure exposed a pre-existing preparation race:
  cancelling during module/GPU setup could let the older load abort a newer retry.
  Commit `cf2cbed` checks loader ownership before starting downloads. A deterministic unit
  regression and real browser cancel/retry pass. The actual multipage AI suite also
  passes indexing, grounded questions, warm return, tier swap and memory release/reload.
- Product/root portable-design, isolation and exact bundle/document synchronization
  checks pass. Existing large-chunk build advisory remains; no push or deployment.

Evidence: `evidence/preview-recovery-2026-10-14.json`, three adjacent PNGs and
`evidence/preview-recovery-checks-2026-10-14.log`. Full synthetic captures and native
harness stay in `/tmp/cloakpdf-air-preview/`. Physical touch/software keyboards,
OS IME and assistive speech remain open. This does not approve unmigrated tool
panels. Next: Redact and Smart Erase interiors, including their custom controls,
selection states, destructive-output verification and removal of replaced skins.

## 2026-10-15 — Redact, Smart Erase and shared colour controls

Redact and Erase now use Air open groups, choices, actions, fields and one shared
pending-mark list. Clear/remove retains Undo and transfers focus to a surviving
control. Existing box colours and erase payloads remain output data. Pixelation
copy distinguishes its visible result from actual redaction; both tools preserve
the rasterisation, selectable-text and file-growth disclosure.

Detect/Find share a byte-keyed geometry cache and one synchronous request guard.
Cancellation, byte changes (which retain the document ID) and tool exit invalidate
late extraction. Read/OCR errors retain the phrase and marks, offer retry, and do
not mark valid input as invalid. Enter respects composition. The colour picker
uses non-overlapping 40/44px targets, explicit selection, visible native keyboard
axes, a single-contour hex field, draft validation and a measured Air popover.
Pointer cancellation restores the colour before the drag. The popup stays inside
the viewport when its anchor moves offscreen during resize or browser zoom.

Validation and evidence:

- `tests/e2e/privacy-panels.e2e.ts`: 44 panel/theme layouts at all 11 required
  sizes, 22 colour popup layouts, short-screen open-popup resize, 200% root text,
  forced colours and reduced motion. Actual PII detection/text search, repeated
  dispatch, failed reads/retry, cancellation, stale byte/tool completions, removal
  focus and undo pass. Independent PDF.js inspection verifies Fill, Blend and
  Pixelate change pixels, remove touched-page text operators and retain untouched
  text. This does not assert that pixelation makes visual details unrecoverable.
- Geometry integration: 48 responsive cases and real redaction/erase placement
  across CropBox, rotation and UserUnit, followed by vector placement, pass.
- Native Safari: real PII detection, colour keyboard adjustment, Escape and focus
  return. Native Firefox: real text search and colour hex entry; open-popup resize
  at actual 200% zoom exposed an offscreen-position bug, now fixed and rechecked.
- `vp check --fix`, `pnpm check:dead`, 384 units, build/PWA/128 deploy-asset limits
  and inventory checks pass. Seven extended browser suites pass, including
  signature colour/background and desktop/mobile placement. All 16 production
  smoke suites pass, including six-format redaction privacy and shared colour/date
  keyboard controls. Both focused integrations and isolated/adversarial portability
  pass. Final label-spacing cleanup passes the full 44/22 focused matrix again.
  No real-model inference rerun was needed; AI runtime is unchanged, with its
  modal/chat lifecycle covered by the production smoke suite.

Source review removed the old uppercase/tinted panel markup, duplicated mark-list
markup and duplicate detection/search lifecycle. The shared colour picker replaces
its overlapping hit areas, hidden axes and popover animation state. No dependency
was added. Remaining legacy controls still used by other tools are deliberately
tracked for their own migration; they are not dead code. The portable PDF appendix
now records the adopted behaviour. Air 1.0.1 and family token hashes are unchanged.

Evidence: `evidence/privacy-panels-2026-10-15.json`, the dated checks log,
`redact-desktop-dark.png`, `erase-phone-light.png`, and `colour-phone-text-200.png`.
Full source images were reviewed at phone, tablet, laptop and desktop sizes in both
appearances. Physical touch/software keyboards, OS IME and assistive speech remain
open; all migrated surfaces retain `validated: false` for those acceptance gaps.

## 2026-10-15 — Find & Act and Scrub interiors

Find & Act now uses Air search/choice/colour controls, removable terms and open
match rows. Search owns one abortable byte revision, preserves query/results and
individual inclusion after failure/cancellation, guards repeated dispatch and
ignores stale tool/byte completions. IME Enter does not submit. Completed matches
cannot paint or apply against a different revision; re-search preserves valid
inclusions. Failed applies keep the selection and surface an actionable error.

Scrub reports failure and retry instead of indefinite scanning. Its action counts
only selected categories (annotations remain optional), states the rebuild loss
of bookmarks/form registration, and avoids claiming a clean report proves safety.
Kept annotations can retain identity/actions. Analysis follows bytes, not overlay
object edits. Retry retains focus. Mobile Done now awaits a promised operation,
blocks repeated activation and keeps the tool open on failure; desktop primary
buttons consume already-reported promise rejections. Other tools still returning
void retain their existing lifecycle pending their own interior audit.

Validation passed:

- `pnpm exec vp check --fix`, `pnpm check:dead`, `pnpm test`: 384 units / 39 files.
- `pnpm run build`: 128 assets within 25 MiB; 77 PWA entries. Existing large-chunk
  advisory remains informational; no dependency or runtime API was added.
- `pnpm design:check`, `pnpm design:portability`: 86 surfaces; standalone and
  adversarial bundle tests. Main-repo lint/types/build/design/portability and exact
  six-document/five-bundle sync pass. Air 1.0.1 contract/tokens are unchanged.
- Production `test:e2e:smoke`: all 16 suites pass with explicit synthetic demo
  fixtures. Includes desktop/mobile apply, all export formats, deterministic AI
  states/chat, modal ownership, navigation/collections/canvas and motion.
- `test:e2e:extended`: all seven suites pass. Shared colour/redaction/erase
  `privacy-panels.e2e.ts` also passes, including real destructive output.
- New `search-scrub.e2e.ts`: real multi-term search, case/whole-word/no-match,
  selection retention, failed search/apply, cancel, stale bytes/tool exit, IME Enter,
  box/highlight apply, selectable source text, scrub category keep/remove output,
  undo, mobile failure/retry and duplicate Done prevention. 44 layouts across all
  11 required sizes × both themes × both panels; 16 busy/error/long-term states at
  desktop/phone in both themes; 200% root text and forced-colour/reduced-motion.
- Native Safari search/highlight/scrub and Firefox search/page navigation/highlight/
  scrub/keyboard Apply pass. Firefox actual browser zoom at 200% was inspected;
  it is separate from root-text enlargement. Native tabs closed and zoom reset.

25 browser suites pass (16 smoke + seven extended + two focused). The last term
spacing polish was followed by a complete focused responsive/output rerun plus
format/types/unit/build. Initial validation caught a wrong field-shell classname;
using the canonical `air-field` corrected tablet target geometry. Visual review
also caught a shrinking warning icon and cramped multiline terms; both corrected.
Real model inference was not rerun because its runtime is unchanged; the full
smoke includes deterministic AI regressions. No failed required check is waived.

Cleanup: removed 127 lines of unused legacy field-label, search-field, ledger,
notice, progress/state-entry and status-dot CSS, including reduced-motion and
starting-style references. Repository-wide searches confirm no consumers remain.
Removed the panels' old ColorRow/Labeled/Segmented/spinner paths and source-only
obsolete design commentary. Remaining legacy shared controls still have live
consumers and are tracked for migration, not deleted indiscriminately. Knip passes;
no dependency added. Runtime source grows only 24 net lines for the new behavior;
regression tests and compact evidence are separate.

Evidence: `evidence/search-scrub-2026-10-15.json`, adjacent check log and three
synthetic-document PNGs. Other captures and output PDFs remain in the temporary
validation directory. Physical touch/software keyboard, real OS IME and assistive
speech remain open; inventories retain `validated: false`. Next: Metadata,
Bookmarks and Attach interiors, then remaining shared adapters and shell states.
No push or deployment. This is not a complete PDF or family migration.

## 2026-10-15 — Metadata and complete date/time picker

Metadata now uses an open document report, labelled Air fields and a complete Air
calendar/year/time picker. Read failures expose retry rather than blank editable
properties; drafts survive tool changes and failed reads/saves. Reads and drafts
belong to exact bytes. Successful Save retires its draft so Undo restores actual
properties. Cancel discards pending values. Mobile Done awaits completion, retains
failure for retry and cannot apply twice. Clear describes its standard-field scope:
XMP remains, with Scrub offered for hidden-data review.

Calendar targets remain at least 44px across all seven columns. The smallest phone
uses the contract's full-width surface and 4px grid inset. Hour/minute use the existing
Air Select; AM/PM uses the shared segments. Created/Modified have distinct names,
nested Escape dismisses the menu first, and calendar focus is assigned before paint
so rapid arrow navigation cannot race a delayed animation frame. The lower-year
boundary can traverse the remaining months of that year. All controls and completion
remain reachable while scrolling or zooming.

Passed:

- `pnpm exec vp check --fix`, `pnpm check:dead`, 384 units across 39 files,
  `pnpm run build` (128 assets within limit; existing non-failing large-chunk advisory),
  `pnpm design:check`, `pnpm design:portability`.
- All 16 production smoke suites with explicit synthetic/demo fixtures and all seven
  extended suites. The production interaction suite was rerun against the final
  build after the immediate-focus fix, including shorter-month focus clamping.
- `metadata-calendar.e2e.ts`: real output/readback, clear retaining XMP/pages,
  save failure/retry, undo, draft retention across tools, Cancel, stale revision
  reads, mobile failed Done/retry and duplicate activation. 22 required viewport/theme
  panel/calendar cases plus six checks at 359/360/361px, four width/theme error/loading pairs, long filenames and
  field values, focus contours, year/day/time/AM-PM controls, nested Escape, 200%
  root text, forced colours and reduced motion. No uncaught page errors.
- Native Safari: date/hour keyboard selection, nested Escape/focus return, Save/Undo.
  Native Firefox: real 200% zoom verified in browser chrome, keyboard selection,
  nested dismissal and Tab reaching visible Done. Rendered screenshots reviewed for
  desktop/laptop/tablet/phone in both themes, plus error/loading/enlarged states.

Earlier failing checks were resolved: an applied draft reappeared after Undo;
calendar initial focus waited a frame; old smoke assertions used retired wording
and a generic picker name before loading completed. Test-harness corrections now
navigate the actual `add-bookmarks` tool and wait for responsive reflow before typing.
No assertion was removed to accept a broken feature.

Cleanup removed the old report/date skins, icon wrappers, duplicate AM/PM markup,
date popover motion state/RAF and unused `.cloak-popover` CSS. Modal portal suspension
now recognises actual Air surfaces; its regression probe was updated with it.
The calendar is 76 lines shorter; source changes add no dependency. Other legacy
classes still have live consumers and remain in their tracked migration slices.

Evidence: `evidence/metadata-calendar-2026-10-15.json`, the matching check log and
three compact PNGs. Full temporary render artifacts are in
`/tmp/cloakpdf-air-review/metadata-*.png`. Physical touch/software keyboards, actual
OS IME and assistive speech remain unverified (`validated: false`). Next: Bookmarks
and Attach, including invalid page targets, detection ownership and attachment
read/remove/retry semantics. This is not a completed PDF or family migration.

## 2026-10-15 — Bookmarks and pending Apply recovery

**Scope:** Bookmarks' complete panel, including manual/detected lists, shared Air
nesting select, labelled title/page fields, keyboard reorder, remove/restore,
contents-page choice, empty/error/pending/cancel/retry and mobile completion.
Air 1.0.1 remains pinned. Attach is the next separate bounded piece; it is not
claimed migrated by this checkpoint.

Targets no longer silently clamp. Empty/fractional/out-of-range entries stay in
the draft, receive nearby feedback and take focus on submission. Drafts survive
tool/viewport changes, belong to exact source bytes, and retire after Apply or
Cancel. Detection has a synchronous duplicate guard, AbortSignal and exact
byte/object ownership; failure/no-match/cancellation preserves manual work and a
successful replacement offers restoration. First-use download copy is explicit.

Contents insertion no longer discards pending overlays. Unapplied annotation,
signature and code objects block insertion with a clear recovery instruction;
ordinary outline changes preserve them, while existing destructive-mark baking
still precedes byte transforms. Printed-title shortening/glyph substitution and
outline replacement are disclosed. Unicode outline titles remain complete.
The byte utility validates targets, preserves metadata and removes two unused
outline-node properties plus its obsolete target-clamping helper.

The focused regression exposed a shared mobile bug: a validation rejection could
consume the pending action without changing readiness; the next Done then closed
without applying. Pending Apply now remains registered on failure. Concurrent
flush callers await one promise, and a successful flush retires only its own
registration. Tests retain the invalid input, retry a real file-read failure,
double-activate Done and verify that one Undo removes exactly one applied outline.

**Rendered acceptance:** all 11 required sizes in both themes (22 layouts), fine/
coarse targets, three 17rem container-boundary neighbors per theme, 200% root text,
forced colours/reduced motion, long titles, custom-menu containment/Escape/focus,
and 12 empty/pending/failure states across phone/desktop and both themes. Native
Safari checks invalid-field focus, nesting keyboard/Escape and contents Apply/Undo;
Firefox checks actual browser 200% zoom, visible menu bounds, keyboard Add,
remove/restore focus and Apply. Representative laptop/tablet/phone images were
visually inspected. Remaining physical-device, OS IME and assistive-speech gates
stay open; inventory `validated` remains false.

**Output:** real nested outline destinations and parent relationships; clickable
contents destinations after page insertion; 70-entry multi-page contents retains
all original page references and metadata; invalid targets reject; Unicode title
and existing leading-H2 cases pass. Existing PDF bytes/objects remain unchanged
on failure. Cancelled, abandoned-tool and replaced-byte scans cannot publish late
results. A uniform-text PDF returns no headings without replacing its manual draft.

**Cleanup and cost:** the old tinted/mono/dashed skins, cycling heading control,
spinner, Toggle import and global row counter are removed. Existing shared Toggle
consumers remain in other tools. No dependency or extra abstraction is introduced.
Editor JS is 291.21 kB raw / 88.29 kB gzip (+1.32 kB gzip); CSS is 144.23 / 25.24 kB
(+0.03 kB gzip). Build retains 128 deployable files under 25 MiB and 77 PWA entries.
Only compact JSON/log evidence and three synthetic proof images enter Git.

Passing: format/lint/type, dead-code, 390 units in 39 files, production build, design/portability, 16 production smoke suites, seven extended suites and the focused Bookmarks/Metadata suites (25 browser suites in total). Commands and final outcomes are recorded in
`evidence/bookmarks-checks-2026-10-15.log`. An initial broad run missed an existing
AI-modal animation timing assertion; no assertion or production motion was changed.
The final serial production suite passes all 16 suites. A metadata harness run reloaded while
build/spec generation ran alongside it; its stable rerun passes all 28 layouts
and output/retry checks. No blocked run is counted as a pass.

## 2026-10-15 — Attach, identity and recovery

Attach now uses Air open rows, full wrapping filenames, decoded sizes, distinct
accessible removal names, 40/44px targets and explicit reading/failure/retry states.
Failed selections survive tool and viewport changes, remain byte-scoped, and can
be retried or discarded. Cancel retires drafts; successful edits retire them before
Undo. Repeated activation is guarded. Pending privacy marks block identity-based
attachment edits until resolved. Mobile Done preserves a failed selection.

The former name-based remover confused Unicode display names with name-tree keys.
The new reader supports nested Kids and PDFHexString names, identifies duplicate
filenames independently, and rejects malformed/cyclic trees instead of returning
an empty report. New entries use unique sorted keys while preserving display names.
Removal cleans standard AF/attachment-annotation references and unshared filespecs,
streams and obsolete tree objects. Shared data survives; unsupported remaining
references fail without changing the source. This is not a blanket PDF sanitisation
claim. Catalog EmbeddedFiles is the managed scope.

Browser testing exposed shared busy-state focus always returning to Export. It now
returns to the initiating control or a surviving action when a removed row vanishes;
closed dialogs retain their Export fallback. Real export regression checks pass.
Safari native add/remove/Undo and chooser cancellation pass; Firefox keyboard removal,
Undo and actual 200% zoom pass. Final production preview add/remove/Undo passes.
An isolated native dev harness became stale after HMR; final verification used
the actual production preview. No production test hook was added. Temporary native tabs are closed and Firefox zoom restored.

Passing gates: `pnpm exec vp check`, `pnpm check:dead`, 400 unit tests in 40 files,
`pnpm run build`, design check (86 inventory records), isolated portability (17
assertions), all 16 production smoke suites, seven extended suites and the focused
Attach/Bookmarks suites (25 browser suites total). Synthetic fixtures were used
explicitly. Final chooser-focus/traversal cleanup received fresh checks/units/build
and focused Attach validation, plus production UI review. AI runtime was untouched.
The focused suite covers all 22 required size/theme layouts, 16 empty/read/error/
retry examples, 200% root text, forced colours/reduced motion, complete decoded
output, physical stream removal, duplicate identity, repeat actions, stale reads,
focus, source preservation, Undo/Redo, mobile Done/Cancel and privacy-mark guards.

Removed old panel skins, truncated-name rows, void uncaught operations, name-only
identity, dead barrel exports and redundant graph traversal. Existing FileEmbedder
is reused; no dependency was added. Editor 290.52 kB raw / 88.34 kB gzip (previously
291.21 / 88.29), CSS 144.58 / 25.29 (previously 144.23 / 25.24); build has 128 assets
under 25 MiB and 77 precache entries. Existing chunk-size warning remains nonfailing.
The canonical PDF appendix and generated DESIGN are synchronized; Air 1.0.1 is unchanged.

Evidence: `evidence/attachments-2026-10-15.json`, dated checks log and three proof
images. Physical touch/software keyboards, real OS IME and assistive speech remain
open; inventory stays `validated: false`. Next: Crop and Strip furniture interiors,
including shared whole-document controls and promised failure/retry handling, then
remaining tools and shell loading/error/restored-draft banners. Full PDF/family
migration remains unfinished. No push or deployment.

## 2026-10-15 — Crop and Strip furniture interiors

Crop now shares Air scope segments and four labelled percentage fields. Keyboard
entry and pointer drawing feed the same geometry; invalid/empty drafts remain
editable, opposite margins must leave a positive area, and the primary action is
next to the crop fields. Drafts belong to exact source bytes. Trim to content is
cancellable and cannot overwrite a changed page, scope, marks or manual draft.
Blank/full-frame pages are distinguished from failed analysis. Both tools await
Apply before mobile Done closes; failures keep their fields/selections for retry.
Successful Apply retires drafts before Undo. Busy focus stays in the panel.

Strip furniture uses open Air checkbox rows with full wrapping samples and page
coverage. Reading, too few pages, no selectable text, no matches, cancellation and
failure are distinct. Selections persist across tool/viewport changes. The Stage
derives preview margins directly from the selected result, removing duplicated
margin state and its synchronising effect. Both tools explain crop's data-retention
limit: it hides content rather than deleting sensitive information.

Straighten previously rebuilt the entire PDF and copied /Rotate after rendering an
already rotated page. It now replaces affected page streams in place, preserves
catalog/page references and maps pixels through the existing visible-page geometry.
Tests cover all four rotations with UserUnit 1/2 and offset CropBoxes, corrected
pixel rows, preserved title/author/attachments, untouched text/form fields and exact
no-op bytes. Changed pages with native annotations/widgets fail explicitly before
writing; pending editor marks block automatic adjustments. Text rasterisation,
possible size growth and edge clipping are explained. This is not sanitisation.

Passing gates: 404 units in 41 files; format/lint/types; dead-code audit; production
build; design/inventory (86 records); isolated portability (17 assertions); all 16
production smoke suites, seven extended suites and focused Crop/furniture plus
visible-page geometry suites (25 browser suites). The updated smoke waits on actual
scan/apply completion rather than rail labels or unchanged help text. The focused
suite covers 44 size/theme layouts, 12 enlarged-text cases, forced colours/reduced
motion, failed mobile Done/retry/concurrent flush, cancelled and superseded scans,
retained selections, output geometry and Undo. Required layout images were inspected.
Safari production keyboard/suggestion/crop/furniture/Undo and focus checks pass;
Firefox invalid/valid crop, Apply/Undo and keyboard furniture selection pass at
actual 200% zoom. Native review tabs are closed and Firefox zoom restored.

Removed both legacy panel skins, tiny/truncated result controls, void apply chains,
unused imports, duplicated preview state and an obsolete Crop reference in Signature.
Live legacy WholeDocPanel/Segmented consumers remain for the next bounded migration.
No dependencies added. Editor 294.35 kB raw / 89.70 gzip (+1.36 gzip); CSS 144.17 /
25.23 (-0.06 gzip). 128 deployment assets remain below 25 MiB; 77 PWA precache entries.
The existing large-chunk warning is nonfailing. Air 1.0.1 remains unchanged; canonical
PDF appendix and portable DESIGN are synchronized.

Evidence: `evidence/crop-furniture-2026-10-15.json`, dated checks log and three proof
images. Physical touch/software keyboards, real OS IME and assistive speech remain
open (`validated: false`). Next: Signature interior and its shared legacy controls,
then Stamp/numbering interiors and shell loading/error/restored-draft banners.
This does not complete PDF or the family refresh. No push or deployment.

## 2026-10-15 — Signature interior and drawing pad

Signature now uses Air source segments, open labelled switch rows, the shared
colour picker/select and named placement controls. The white drawing paper and
actual ink/alpha remain document output in both themes; the old border-plus-glow
focus treatment is replaced by one contour. The pad keeps its aspect ratio and
caps its display width at 360px (240px on short screens). Four move controls remain
on one row; size and removal occupy the next. Long filenames and previews contain
within the panel; the mobile controls remain scrollable and expandable.

Draw and Choose retain separate sources. Completed strokes survive mode/tool and
responsive remounts, and can be recoloured/replayed; clear returns focus to the pad.
Single taps and the final stroke segment now export correctly. Pointer cancellation
abandons only the unfinished stroke and only its owning pointer; the extended pen
regression caught and verified the stray-finger cancellation fix. Image preparation
uses one decoder/compositor with released scratch canvases/object URLs, explicit
size/decode failure, same-file retry, preserved previous source and abort-on-exit.
PNG/JPEG limits are visible. Existing alpha/white logos stay intact; neutral paper
is removed from opaque images without erasing saturated ink.

Keyboard/tap placement, a page-labelled object selector, move/size/remove actions
and page-focused Arrow/Delete handling supplement canvas dragging. Initial images
stay inside the page, including extreme aspect ratios. Copy to remaining pages
preserves the physical image aspect on mixed page sizes and leaves occupied pages
unchanged. Copy stages objects; Apply awaits embedding and fails explicitly on
incomplete objects. Mobile Done waits, remains open on failure and retries without
losing placements. Successful Apply removes signature objects only; Undo restores
prior bytes and placements. Background compositing is cached per source for the
operation. Ink affects new placements; the panel explains the global background.

Validation: 405 units in 42 files; all 16 production smoke and seven extended suites;
focused Signature and visible-page geometry suites (25 distinct browser suites).
44 mode/size/theme cases, twelve enlarged-text cases, a short-landscape expanded
pad, forced colours and reduced motion were inspected. Tests cover actual PDF.js
raster ink on all three mixed pages, retained selectable text, metadata and embedded
attachments, precise Undo, corrupt upload/retry, PNG alpha, JPEG decoding, file-size
rejection, abort, source remounts, movement/resize, copy/remove and failed/delayed
mobile Done. The final display-only refinements were checked again with the focused
suite and production responsive-motion suite. Native Safari passes drawing tap,
realistic ink, place/copy/Apply and focus return; Firefox passes drawing, selection
Escape, movement and Apply at actual 200% browser zoom. Temporary native tabs closed;
Firefox zoom restored. Physical pen/touch/software keyboard and assistive speech
remain open, so inventory entries retain `validated: false`.

Removed legacy signature skins, the unused Switch wrapper and focusRing export,
the ignored legacy payload property, global Delete listener, silent decode fallbacks
and void Apply chain. Live WholeDocPanel/Segmented consumers remain for Stamp tools.
No dependencies added. Editor: 297.54 kB raw / 91.13 gzip (+1.43 gzip); CSS: 143.80 /
25.14 (-0.09 gzip). All 128 assets are below 25 MiB; 77 PWA precache entries. The
existing large-chunk advisory is nonfailing. Format/lint/types, dead-code, build,
design/inventory and isolated portability pass. Air 1.0.1 remains locked; the PDF
appendix and standalone DESIGN are synchronized.

Evidence: `evidence/signature-panel-2026-10-15.json`, companion checks log and three
proof images. Next: Stamp/numbering interiors, then remaining controls/panels and
shell loading/error/restored-draft banners. This does not complete PDF or the family
refresh. Local commits only; no push or deployment.

## 2026-10-15 — Stamp interior

Stamp now has its own WatermarkTool adapter with Air text/token insertion, neutral
shape/finish segments, colour and labelled numeric fields paired with sliders.
Invalid numbers remain editable across layout changes and cannot apply; the preview
retains the last valid value. Values remain aligned at enlarged text, native arrow
stepping remains, and forced colours identify selected options. Title expansion
reads the actual PDF metadata. A captured preview timestamp reaches saved tokens.
Token insertion replaces the selection and cannot steal focus from a later field.

Apply and mobile Done await the real writer, keep failed drafts for retry and retire
successful previews before Undo. Start another stamp explicitly re-arms settings.
Safari exposed a post-save focus jump; the stable Stamp text region now receives
fallback focus, verified in both Safari and Firefox. Failed/abandoned metadata reads
cannot publish stale data. Vector text reports unsupported characters with a shape/
ink recovery path. Actual PDF.js text checks retain all three pages, original body
text, metadata and attachments; geometry tests cover rotations, CropBox and UserUnit.

Ink/shape previews reuse the exact supersampled output buffer, including at zoom.
Fractional cache keys no longer alias. Raster storage has a 16-million-pixel total
budget, twelve-entry cap and 8192px maximum side. Oversized input fails before large
allocation; temporary/evicted buffers are released, and tool exit clears the cache.
Removed the old Stamp panel/painter, void Apply, obsolete imports and unreachable
null branch. Live numbering adapters remain until their consumers migrate. No new
dependency. Editor 303.86 kB raw / 93.05 gzip (+1.92); CSS 146.05 / 25.50 (+0.36).

405 units in 42 files, all 16 production smoke + seven extended suites, focused
Stamp and page-geometry suites pass (25 distinct browser suites). The focused and
production motion suites were rerun after final refinements. Inspected 44 region/
size/theme captures, twelve enlarged-text cases and forced colours/reduced motion.
The screenshot harness now scrolls the intended inspector only, avoiding artificial
scrolling of the fixed outer editor. Native Safari validates tokens/ink/size/save
and final focus; Firefox validates Circle/Ink, numeric and slider-key input, Apply
and Undo at actual 200% zoom. Native test tabs closed and Firefox zoom reset.

Format/lint/types, dead-code, build, inventory/design and isolated portability pass;
128 deploy assets are below 25 MiB and 77 PWA entries remain. Air 1.0.1 tokens are
unchanged. Physical touch/software keyboards, real OS IME and assistive speech
remain open (`validated: false`). Evidence: `evidence/stamp-panel-2026-10-15.json`,
its checks log and desktop/mobile/enlarged-text images. The captured document shows
an applied APPROVED stamp plus a pending CONFIDENTIAL stamp, deliberately distinct
from an accidentally doubled preview. Next: Page numbers, Header & footer, Bates,
then remaining panels and shell feedback. PDF/family migration is not complete.

## 2026-10-15 — Page numbers and shared precision controls

Page numbers has a dedicated Air panel: spatial 3×2 position picker, custom format
menu, colour, precise numeric fields and sliders. First page and Start at expose
existing writer capabilities with clear sequence semantics. Invalid raw values
survive layout/tool changes; associated errors appear after blur and Apply stays
unavailable. Preview/output share one formatter. Writer validation rejects invalid
sequences/dimensions and identifies the exact mixed-size page where text cannot fit.

Apply/mobile Done awaits output, preserves failed drafts, retains panel focus and
retires the byte-scoped preview before Undo. Explicit Start another numbering
re-arms settings; Cancel restores the checkpoint. PDF.js verifies skipped covers,
custom initial labels, selectable text, metadata and attachments; unit/output
checks cover rotation, CropBox, UserUnit, small pages and unchanged source bytes.

Stamp and Page numbers now share PrecisionField. Inspection caught missing spacing
between nested numeric rows; both groups now have explicit 16px separation. Bates
uses the same revised position grid. Removed old PageNumbers UI/painter/default
reader, duplicate formatting and Stamp-specific numeric styles. Remaining legacy
controls still serve Header/footer and Bates; they are not dead code. No dependency
added. Editor 307.60 kB raw / 94.92 kB gzip (+1.87); CSS 145.95 / 25.47 (-0.03 gzip).

Validation passes: format/lint/types, dead code, **412 units in 43 files**, build/PWA
and asset limits, design inventory, exact synchronization and standalone portability.
**26 distinct browser suites** pass: sixteen production smoke, seven extended, plus
focused Page numbers, Stamp and page geometry. Legacy smoke clicked an initially
disabled Apply button and waited for a transient spinner; it now waits for an
enabled control and confirmed completion. The complete smoke rerun passes.

Inspected all 44 Page numbers regions (eleven sizes × light/dark × two regions),
twelve enlarged-text captures, forced colours and reduced motion. Focused Stamp
regressions pass and its desktop/light and phone/dark numeric layouts were rechecked.
Native Safari passed menu/validation/Apply/focus/Undo. Native Firefox passed the
production build at actual 200% zoom; zoom reset and temporary native tabs closed.
The in-app production tab holds a synthetic PDF with Page 1 of N pending for review.

Evidence: `docs/air/evidence/page-numbers-2026-10-15.json`, three proof images and
`page-numbers-2026-10-15-checks.log`; full layout captures remain in
`/tmp/cloakpdf-air-review/numbers-*.png`. Canonical product rules and the portable
DESIGN are synchronized; family Air 1.0.1 is unchanged. Physical touch/software
keyboards, real OS IME and assistive speech remain open. Full PDF/family migration
is unfinished. Next: Header & footer, then Bates and remaining shell states.

## 2026-10-15 — Header & footer and shared text controls

Header & footer now uses Air Header/Footer segments, three full-width labelled
alignment fields per group, explicit insertion destination/expanded text, shared
colour/precision controls and the Air cover-page switch. All six values persist
across group, tool and viewport changes. Raw invalid Size/Margin drafts survive;
feedback associates with their fields and the last valid values stay in preview.
Long resolved text wraps; insertion replaces selection without late focus theft.

Stamp and Header/footer share TextTokens and the byte-scoped title/clock reader.
Read failures offer retry; abandoned work cannot update a later tool visit. One
captured timestamp reaches preview/output. Shared layout resolves all six slots;
the writer checks exact font widths on every visible page and rejects overlap,
clipping, multiline or unsupported text and empty expansion. Failed output keeps
the original bytes/draft. Apply/mobile Done awaits saving; success retires the
preview before Undo and explicit Start another re-arms it. Busy focus stays inside
settings. Cancel restores the checkpoint. Real output preserves text, metadata,
attachments and rotation/CropBox/UserUnit geometry.

Removed TripleRow, old Header/footer panel/stage/default reader, duplicate slot
layout and the unused native-value token setter/event path. Remaining controls
have live consumers. No dependencies added. Editor 311.08 kB raw / 95.94 kB gzip
(+1.02); CSS 145.94 / 25.47 (unchanged gzip). 128 assets, 77 PWA entries.

Checks pass: format/lint/types, dead code, **420 units in 44 files**, production
build/asset limits, design inventory, portable bundle and exact synchronization.
**26 browser suites** pass: sixteen production smoke, seven extended, Header/footer,
Stamp and page geometry. Compression's byte comparison initially crossed a clock
boundary; it now fixes creation time for the preset comparison and restores Date
in finally. Assertions remain strict; explicit date parsing stays unchanged.

Visually inspected 44 Header/footer regions (eleven sizes, both themes, two regions),
twelve enlarged-text captures, forced colours and reduced motion. Stamp regression
and its desktop/light + phone/dark token controls pass. Native Safari validates
insertion, keyboard traversal, group changes, Apply/panel focus/Undo/re-arm. Native
Firefox validates actual 200% zoom, invalid-number feedback, keyboard slider recovery
and Apply. Zoom reset; temporary native tabs closed. The in-app tab at 8132 holds
synthetic Air header-footer.pdf with title and centered page/total footer pending.

Evidence: `docs/air/evidence/header-footer-2026-10-15.json`, two proof PNGs and the
adjacent checks log. Full captures remain in `/tmp/cloakpdf-air-review/`. Portable
DESIGN includes the canonical product rules; family Air 1.0.1 is unchanged. Physical
touch/software keyboard, actual OS IME and assistive speech stay open. Next: Bates,
then remaining editor/shell states. Full PDF and family migration are unfinished.

## 2026-10-15 — Bates numbering

Bates now uses full-width Air Prefix/Suffix fields, minimum-digit segments and the
shared position, colour and precision controls. Start at supports nine digits;
Size and Margin expose the existing layout options. Raw invalid numeric drafts
survive tool and layout changes, while preview retains the last valid settings.
One formatter and Courier geometry serve preview/output. Identifiers remain complete
across digit boundaries; the writer checks safe sequence precision, every visible
page's exact font fit, single-line affixes and supported encoding. Failures preserve
bytes/settings. Selectable identifiers retain source text, metadata, attachments
and rotation/CropBox/UserUnit. Awaited Apply/mobile Done, failed retry, busy focus,
preview retirement, Undo/Redo, explicit restart and Cancel are covered.

Removed the final StampTools panel/stage/default/paint paths, unused ColorRow bridge,
duplicate position union and unused exported type. Remaining controls have live
annotation/form/code/N-up consumers. No dependency added. Editor 314.55 kB raw /
96.27 gzip (+0.33); CSS 146.06 / 25.50 (+0.03). 128 assets and 77 PWA entries.

Required automated gates pass: format/lint/types, dead code, **429 units in 45 files**,
build/deployment limits, design/17 portability assertions and canonical sync.
**25 browser suites** pass: sixteen production smoke, seven extended, Bates and
page geometry. Reviewed 44 regions across eleven sizes/both themes and twelve
200% root-text cases, plus forced colours and reduced motion. The final screenshot
fixture restores original bytes before its pending preview, avoiding an intentional
second numbering over the already applied first sequence in the initial captures.

Firefox passes actual 200% zoom, keyboard affixes/nine-digit entry, invalid-size
feedback, slider correction, Apply/focus/Undo/re-arm using the real production app
with a temporary in-memory synthetic File. Its native chooser stayed disabled for
new and older PDFs; that check remains open. Safari stayed at Opening PDF before
Bates opened, even after reload and a clean-origin in-memory fixture. Native Safari
acceptance is **unavailable**, not passed; the cause is not established. Carry this
into the shell-loading audit and rerun Bates. Per the rollout plan, unavailable
browser/device checks remain open. Physical touch/software keyboard, OS IME and
assistive speech acceptance also remain open; no full-product completion claim.

Temporary harness/server (8133) removed/stopped; native tabs closed and Firefox zoom
reset. The existing 8132 in-app preview holds synthetic Air Bates.pdf with CASE-
prefix/-A suffix and default six digits/start 1/size 10/margin 36, pending on page 1.
Compact evidence, two proof PNGs and checks log: `docs/air/evidence/bates-2026-10-15*`.
Canonical product appendix/portable DESIGN updated; Air 1.0.1 unchanged. Next: diagnose
native loading and finish shell loading/error/restored-draft states, then QR/barcode,
annotation/form interiors and remaining surfaces. Local commits only; no push/deploy.

## 2026-10-15 — Editor loading and saved-session recovery

The shell now shares Air LoadingState/ProgressBar, neutral notices, sans labels and
shared buttons. Unknown work has no invented percentage; preview preparation reports
measured pages. The file-error intake uses plain recovery guidance, safe scrolling
and the same frame; the selected tool survives a failed file/retry. Error and saved-
session strips wrap and share a bounded scroll region, preserving canvas space.
Processing status stays outside the inert/busy editor. Successful restore/discard
returns focus to Export when the initiating action disappears; failure keeps Restore.

Failed restoration preserves the original bytes and saved draft. Retry is awaited,
duplicate work stays guarded and UI consumes the rejected promise after the notice
owns feedback. Discard removes only the offered saved session. Newer-file ownership
covers delayed reads, progress, encryption checks and draft hashing/lookup. Leaving
while opening or restoring releases late previews; StrictMode replay completes.
Removed the old Spinner, bespoke coloured banners, legacy intake skins and one-use
applyDraft wrapper. No new dependencies. Editor 313.87/95.90 kB raw/gzip (-0.37 gzip),
CSS 144.28/25.25 (-0.25); 128 deployment assets, 77 PWA entries.

429 units in 45 files and 26 browser suites pass: 16 production smoke, 7 extended,
focused shell recovery, preview recovery and Bates. Full smoke was repeated after
the restore-exit guard; final intake/short-landscape polish reran focused recovery,
production landing search and responsive motion. Final copy/spacing reran focused
recovery and build. Reviewed 141 captures: 110 base layouts (five states × eleven
sizes × both themes), 30 enlarged-text cases, plus measured progress. Coarse pointer
emulation is explicitly asserted. Keyboard reaches notice actions in the scroll
region at 320px/200% text; forced colours/reduced motion, no uncaught errors and
zero unreleased thumbnail URLs pass. Check/dead/build/design/17 portability checks
and canonical sync pass. Portable DESIGN and canonical PDF appendix updated;
Air 1.0.1 unchanged.

Safari native file selection/loading passed; the instrumented real editor passes
saved-draft failure/retry/focus and Bates Apply. Intermittent stalls were observed:
a stalled reload reports visibility hidden, 0 of 1 frames delivered, 2 of 2 reads
complete and no PNG encoding. Visible runs deliver all frames and finish. This
identifies hidden-page scheduling in that run, not a proven cause for every earlier
stall; no speculative rendering or runBusy change was made. The final rebuilt
production app passes Safari native opening, Bates Apply/focus, Undo and re-arm. Firefox native chooser
and loading pass; real-editor saved-draft failure/retry/Return/focus/discard pass at
actual 200% zoom. The former disabled chooser is no longer reproduced. Temporary
harnesses removed; native review tabs closed and Firefox zoom reset. Physical touch/
software keyboard, actual OS IME and assistive speech remain open.

Evidence/log/two proofs: `docs/air/evidence/editor-recovery-2026-10-15*`; full captures
in `/tmp/cloakpdf-air-review/shell-*.png`. Existing in-app synthetic Bates draft is
preserved. Next: QR/barcode placement/payload/caption controls, then annotation/form
interiors and final legacy cleanup. Full PDF/family migration remains unfinished.
Local commits only; no push/deployment.

## 2026-10-15 — QR / barcode controls and placement

Air type segments, labelled payload/encoding feedback, colour picker and caption
switch replace the legacy controls. Preview artwork retains a white backing in
both themes/forced colours; its surround is neutral. Long barcode preview width
is bounded to 4096 pixels, while its natural aspect and vector output are retained.
Barcode caption baseline and raster rounding now match the vector writer. Settings
apply to new placements; existing codes keep their captured payload/appearance.

Place, custom code selection, movement, resize and removal are keyboard-accessible.
Signature/code adjustment buttons share PlacementActions rather than duplicate
markup. Taps near a page edge preserve the whole code/quiet zone; all-pages copy
preserves physical proportions on mixed sizes and skips already occupied pages.
Selection survives choosing a code on another page. Apply returns its actual promise
so mobile Done waits, failures keep the draft and retry is deduplicated. Successful
Apply removes pending objects; Undo restores them and Redo reapplies. Cancel restores
its checkpoint. Removed obsolete WholeDocPanel Segmented, measurement/observer/thumb
animation, old QR skins/imports and duplicated signature buttons/CSS. WholeDocPanel
remains live in N-up; other shared adapters remain for their actual consumers.

429 units / 45 files and 24 browser suites pass: focused codes, all 16 production
smoke suites and 7 extended suites. The first smoke run sampled no active animation
in the AI modal entrance timing assertion; that unchanged suite passed in isolation,
then the full clean smoke run passed. No timing assertion was relaxed or modal
runtime changed. Focused coverage verifies invalid/over-capacity/Unicode/long content,
settings persistence, every QR module plus four-module quiet zone on three real
mixed-page exports, no raster image operators, original text/metadata/attachments,
selectable barcode caption, placement/removal/copy, Undo/Redo, failed mobile Apply,
held/deduplicated retry and Cancel. Preview/export encoders also retain existing
unit coverage; real-device final-size scanning remains an acceptance gate.

101 focused captures: 88 regions/states across eleven viewport sizes and light/dark,
12 enlarged-text views and one forced-colours/reduced-motion view. Coarse/fine input
is actually emulated and asserted; no horizontal overflow or undersized controls.
Contact sheets and selected full-size captures inspected, including error alignment,
320px enlarged text, short landscape, tablet and desktop. No uncaught page errors.
Native Safari passes invalid barcode recovery, placement/resize/all-pages/Apply/focus/
Undo. Firefox passes QR placement/resize/all-pages/custom selection via Down/Return
and mobile Done at actual 200% browser zoom. Both native choosers load the fixture;
review tabs closed and Firefox zoom reset. Physical touch/software keyboard, OS IME
and assistive speech remain open.

Required check/dead/build/design/17 portability assertions and exact canonical sync
pass. Air remains 1.0.1; canonical product appendix and portable DESIGN are updated.
No dependencies added. Editor 315.07/96.37 kB raw/gzip (+0.47 gzip), CSS 144.17/25.21
(-0.04); 128 deployment assets and 77 PWA entries. Compact results, checks log and
two proofs: `docs/air/evidence/codes-2026-10-15*`; full captures in
`/tmp/cloakpdf-air-review/codes-*`. Next: Annotate interiors, then form controls,
remaining legacy adapters and final product audit. Full PDF/family work remains
unfinished. Local commits only; no push/deployment.

## 2026-10-15 — Annotate inspector and live edit ownership

Air tool/style groups, full-width custom font selection, named colour controls,
switches and shared numeric precision fields replace the legacy annotation skins.
The placed-annotation selector works across pages; selected text, shapes and icons
show their own values, including fill and glyph choices in Select mode. Text size
covers the existing nearby-text suggestion range (5–96pt); opacity is 0–100%.
Invalid drafts survive tool/layout changes and cannot write invalid values.

Apply/mobile Done now returns and awaits the transform. Failure retains marks and
selection; retry deduplicates, success retires overlays, Undo restores them and Redo
reapplies. Style/nudge coalescers commit only when their original live payload still
owns the object. Undo/Cancel/removal/Apply cannot receive a delayed stale snapshot;
style edits no longer advance the tool's Cancel checkpoint. Drawing/text placement,
repeat icon stamping, keyboard nudging, geometry and inline text remain intact.

**Validation:** check/dead, 429 units in 45 files, build/asset limits, 24 distinct
browser suites (focused annotation, 16 production smoke, seven extended), design,
17 portability assertions and exact family sync pass. The initial mobile smoke
expected an empty Select panel colour picker; it now selects Pen before testing
that same popover. The interaction suite checks the selected Rectangle through
its custom selector instead of the removed blue-card text. A rotation-suite race
sent input during export-modal exit; it now waits for the dialog to close and uses
the configured isolated profile. Both 90° and 180° output assertions remain intact;
the entire extended rerun passes. No runtime assertion was relaxed.

The focused suite exercises every drawing mode, per-object styles/fill/icon,
unavailable italic controls, invalid draft retention, cross-page selection, deletion
focus, Undo during coalescing, Cancel during coalescing, mobile failure/wait/retry,
PDF vector operators, selectable annotation/original text, title and attachment
preservation. The existing embedded-font suite verifies a real Roboto subset.
110 responsive region captures across eleven sizes and both themes, 18 enlarged-
text views and forced-colours/reduced-motion were inspected; no horizontal overflow
or undersized coarse-pointer controls. No uncaught browser errors.

Native Safari: chooser, Roboto menu typeahead, underlined inline text, invalid size/
recovery, Apply/focus, Undo and restored font/size pass. Firefox at actual **200%**
browser zoom: chooser, pointer icon placement, Down/Return custom selection, glyph
change in Select mode, mobile Done/focus and Undo pass. Reset zoom and close review
tabs. Physical touch/software keyboard, actual OS IME and assistive speech remain
open; this does not complete the PDF or family refresh.

Removed RangeField's final consumer/export, StyleToggle and FontControls legacy
skins, duplicated labels and old selected-card styling. Remaining shared controls
have live form/N-up/privacy/numbering consumers. No dependencies added. Editor
315.12/96.56 kB raw/gzip (+0.19 gzip); CSS 142.03/24.78 (-0.43 gzip); 128 deployment
assets, 77 PWA entries; inventory remains 92. Canonical PDF appendix and standalone
DESIGN synced; contract remains Air 1.0.1 (`201f7c381b5f`). Evidence JSON/check log and
two proofs: `docs/air/evidence/annotate-2026-10-15*`; full images/contacts and synthetic
fixture in `/tmp/cloakpdf-air-review/annotate-*`. Local commit only.

Next: FillFormTool — field types, custom selectors/switches, field-error and empty
states, geometry, raw value persistence, fill/flatten output, awaited mobile Apply,
failure/retry, Undo/Cancel and all responsive/theme states. Then AutoFillTool and
NupTool; remove their remaining adapters only after verifying all consumers.

## 2026-10-15 — Shared colour wheel

Air 1.0.2 replaces the shared picker square with a hue/saturation wheel, brightness
track, exact hex and optional independent native hue/saturation ranges. All nine
PDF tool consumers use the same adapter; ten visible instances round-trip through
real tool state. Reused presets, popover anchoring and focus handoff. Removed the
obsolete plane/point styles and per-axis callbacks, extracted one portable math
module used by the reference and PDF. No dependency added; ColorPicker itself is
smaller. Editor 315.68/96.79 kB raw/gzip (+0.23 gzip); CSS 143.18/25.02 (+0.24 gzip versus
Annotate); 128 deployment assets, 77 PWA entries.

Exact spectrum/cursor mapping, 4096 RGB round trips, centre/rim clipping, hue at the
red seam, black/grey continuity, external values, invalid hex retention/recovery,
mouse capture/cancel, primary-pointer ownership, emulated touch/cancel, native
keyboard axes and Escape return are covered. Twenty-two required size/theme views,
six text200 views and forced-colours/reduced-motion inspected, without horizontal
overflow. Scrollable popovers keep precise controls accessible in short viewports.

429 units, check/dead/build/asset limits, focused wheel suite, all 16 production
smoke suites, seven extended suites and focused privacy panels pass. Existing
mobile test now targets the wheel; keyboard test follows the revised disclosure
and native axis order. No output assertion removed. The wheel harness explicitly
detaches its CDP session before closing to avoid retaining a Node resource.
Native Safari verifies wheel pointer selection, black-to-colour, brightness keys,
reopening and Escape focus. Firefox verifies precise keyboard controls, invalid
hex recovery and internal scrolling at actual 200% browser zoom. Physical touch,
software keyboards and spoken assistive acceptance remain open.

Evidence: `docs/air/evidence/colour-wheel-2026-10-15*`; full captures and JSON in
`/tmp/cloakpdf-air-review/colour-wheel-*`. Canonical rules, CSS, math/types, reference
and portable DESIGN/bundle are synchronized; standalone drift checks include the
colour module. This completes the shared PDF picker piece, not the whole product.
Next: FillFormTool, then AutoFillTool/NupTool; IMG/Resume picker adoption is tracked
upstream separately. Local commits only; no deployment.

## 2026-10-15 — Auto-fill printed forms

Replaced the legacy detection/profile/answer card with open Air groups, full-width
labelled inputs and named page-navigation actions. Answers use the inspector's
scroll region; profile controls reflow with enlarged text. Stored profiles are
whitelisted and type-checked. Storage failure keeps an in-memory profile and shows
an honest retry message; profile edits save independently of PDF Apply/Cancel.
Filling from the profile changes only empty answers and retains keyboard focus
when the last match is filled. Re-detection preserves matching manual answers,
including deliberately emptied values.

Detection reports page progress, supports cancellation and belongs to the exact
source bytes/pending objects. Abandoned or superseded scans cannot replace newer
work. Failed/empty rescans retain valid answers; no text and no blanks have distinct
recovery instructions. Pending redaction/erase blocks detection and filling.
Apply/mobile Done awaits output, deduplicates work and retains failed drafts.
Successful output retires the answer preview; Undo/Redo restores exact bytes and
Undo removes stale success feedback. Cancel restores the tool checkpoint.

Preview and writer share physical text sizing, inset and baseline; the writer uses
embedded Helvetica metrics. Existing long-answer shrink/ellipsis behavior is now
explained. Unsupported characters fail explicitly without modifying the PDF. Actual
selectable answers/original text, rotated/CropBox/UserUnit geometry, title and
attachment preservation are verified in a synthetic two-page PDF.

Focused validation passes 44 answer/profile regions across eleven sizes and both
themes, six enlarged-text states and forced-colours/reduced-motion. Reviewed clean
captures include desktop/laptop, tablet, short landscape and 320px phone; inputs
remain reachable without horizontal page overflow. Native Safari detect/edit/
re-scan/Apply/focus/Undo passes. Firefox at actual 200% browser zoom verifies profile
disclosure/editing, profile fill, answer correction, Apply/focus and Undo. Native
review found the stale success note and profile-fill focus loss; both fixes pass
explicit focused regressions. Native review tabs were closed, zoom restored and
the synthetic Firefox profile name cleared. Physical touch/software keyboard,
actual OS IME and spoken assistive acceptance remain open.

432 unit tests in 45 files, format/lint/types, dead-code, production build/asset
limits, design and all 18 standalone portability checks pass. All 16 production smoke and seven extended development suites pass, alongside the
focused suite (24 distinct suites). Extended compression imports source modules,
so its production-server attempt stopped at module loading; the complete rerun
uses the required development server. The legacy smoke selector was
updated for reserved accessible action labels and distinct empty/no-text messages;
its now-unused click helper was removed. No output assertions were relaxed.

Removed the unused TextField adapter/useId, exported FieldFill bridge and retired
Auto-fill skins. Labeled/Toggle still serve FillForm; PositionGrid and Rgb retain
verified consumers. No dependency added. Editor 317.04/96.88 kB raw/gzip (+0.09 gzip
from the wheel checkpoint); CSS 142.66/24.92 (-0.10 gzip). 128 deployment assets,
77 PWA entries, inventory remains 92. PDF appendix and standalone DESIGN match
Air 1.0.2 (`bb90f52e0b0a`). Evidence/proofs/check log: `docs/air/evidence/autofill-2026-10-15*`;
full captures and synthetic source/output in `/tmp/cloakpdf-air-review/autofill-*`
and `Air autofill*.pdf`. Final IAB review tab19 shows three entered answers; old
tab12 draft is preserved. No push/deployment.

Next: FillFormTool and NupTool. Their remaining controls/empty/error/output and
mobile completion semantics still need migration. This completes the bounded
Auto-fill implementation, not the whole PDF/family refresh.

## 2026-10-19 — Native Fill form

The interactive AcroForm inspector now shares Auto-fill's Air field rows, full-width
inputs, page links, native check rows and custom choice menus. It includes option
lists with multiple selections, editable dropdown answers, multiline/password flags,
required labels, length errors and copyable read-only values. Unsupported fields
remain visible and unchanged; flattening is disabled for those documents. XFA is
explicitly unsupported instead of being silently stripped by the PDF library.

Reads and drafts belong to exact source bytes. Tool/page/layout changes retain
answers; abandoned reads cannot revive stale state. Read failures have Retry;
empty forms offer Auto-fill. Pending privacy marks block field editing. Saving
changes only writable edited values, clears empty choices, reports the affected
field on encoding/validation failure and keeps all answers. Apply/mobile Done
awaits output and deduplicates; Cancel, Undo and Redo retain their existing semantics.
Success feedback binds to the editor's committed byte copy and Undo hides it. The
same correction applies to Auto-fill; focus returns to the form after Save.

Validation: 444 units in 46 files; Fill form and Auto-fill focused integrations;
all 16 production smoke and seven extended development suites (25 distinct suites).
Final focused form regressions and production editor smoke recheck the save-feedback
and focus correction. The initial smoke failure used the retired empty-state copy;
it now asserts the semantic empty-form region. Auto-fill's empty-list assertion
uses the new shared class. No output assertion was weakened.

66 Fill form captures cover text, choice and finish regions at eleven sizes in
light/dark, plus six enlarged-text captures and forced colours/reduced motion.
Emulated coarse targets are at least 44px; menus remain within the viewport.
Contact sheets and full desktop/laptop/tablet/phone/short-landscape views inspected.
Safari verifies text, custom menu typeahead, multi-selection, Save and Undo. Firefox
at actual 200% verifies custom keyboard clearing and read-only values; final normal
zoom Save/Undo confirms feedback and focus. Native review tabs closed and zoom reset.
Physical touch/software keyboard, actual OS IME and spoken assistive acceptance
remain open, so inventory records remain validated:false.

Real output checks cover text, multiline, checkbox, radio, single/multi-choice and
custom answers, native flags, widget positions, rotation/CropBox/UserUnit, metadata
and an attachment. An independent Poppler render of saved and flattened two-page
outputs has zero pixel-channel differences (3,645,000 samples at 900px maximum size).
Both pages inspected. Unsupported/readonly/unknown fields and unsupported characters
fail atomically. The browser test also covers prototype-like field names.

Removed the duplicate field parser/name decoder, unused barrel exports, final
Labeled/Toggle/SwitchTrack and obsolete switch CSS. Remaining PositionGrid, Rgb and
transparency checker have live consumers. No dependency or family contract change;
Air stays 1.0.2 (`bb90f52e0b0a`). Required check/dead/build/asset/design/18 portability
and exact standalone design sync pass. Final bundle measurements and full command
results are recorded in the adjacent evidence JSON/log.

Evidence: `evidence/fill-form-2026-10-19.json`, two proof PNGs and
`evidence/fill-form-checks-2026-10-19.log`. Larger captures and synthetic PDFs remain
in `/tmp/cloakpdf-air-review/`. IAB tab1 on 8132 shows the synthetic form for review.
No push or deployment. N-up was already implemented and validated on 2026-10-14;
the earlier handoff was stale. Next bounded tool: Select text, followed by the
remaining wrapper/stage/provider and legacy-style consumer audit. Full PDF/family
migration and the physical/assistive acceptance gates remain unfinished.

## 2026-10-19 — Select text

The Select text inspector now shares Air buttons, a labelled read-only excerpt,
quiet page/clear actions and a keyboard-help disclosure. The canvas uses the family
paper accent. Geometry and ranges belong to exact bytes and page; selections
survive tool/layout changes, stale reads are ignored, and page or byte changes
retire the selection. Loading, failed reading/retry and no-text/OCR are distinct.
Clipboard refusal/unavailability offers a manual-copy path. Failed writes preserve
selection; applied marks keep the existing explicit-apply checkpoint, with Undo/Redo
restoring exact bytes. Cancel discards the selection, not already-applied marks.

Independent PDF renders exposed the old baseline-only rectangles leaving glyph
descenders outside marks. Selection bounds now include ascent/descent, a small ink
allowance and all four transformed corners (including shear); visible fractions
respect CropBox/UserUnit and reading order compensates for page rotation. Fully
cropped-out runs are excluded. Other geometry consumers retain their existing
bounds through an opt-in selection mode. Yellow highlights and red boxes remain
output ink. Redaction remains deferred until export/another edit; pending privacy
marks pause source-text selection. Real redacted output has no extractable covered
text, keeps the other page's text and renders without descender fragments.

453 units in 46 files; focused selection lifecycle/output, Auto-fill and search/scrub
regressions; seven extended editor suites. The complete 16-suite production smoke
command passes serially after an initial parallel run missed a 240ms AI modal
entrance; the unchanged timing assertion also passed alone. Final command outcomes are
in the evidence log. No assertion was weakened. The first focused Cancel assertion
was corrected to the editor's existing committed-action semantics, with separate
Undo assertions verifying original-byte restoration.

52 rendered selection/action regions cover eleven required sizes and 767/769px
neighbors in both themes; six root-text200 cases, forced colours and reduced motion
also pass. Emulated coarse targets are at least 44px. Contact sheets and full-size
views inspected. Safari production verifies apply, focus, success and Undo;
Firefox actual 200% preserves selection and scroll access. Native review tabs closed
and zoom restored. Physical touch/software keyboards, OS IME and spoken assistive
acceptance remain open; inventory stays validated:false. Complex multi-column
logical reading order remains a spatial text-run heuristic.

Removed private ActionButton/HILITE/readSlice, duplicate selected text/rectangle
payload, unmanaged copy timeout and legacy palette/monospace/ring classes. All new
classes and shared helpers have live consumers; knip passes with no dependency
added. Regenerated the surface table to reflect previously completed form/control
work too. Editor bundle 327.17/99.50 kB raw/gzip (+1.11 gzip), CSS 138.20/24.02
(-0.62 gzip). All 128 assets meet the 25 MiB limit; 77 PWA entries. Air remains
1.0.2 / bb90f52e0b0a; the canonical PDF appendix and standalone DESIGN are synchronized.

Evidence: `evidence/select-text-2026-10-19.json`, desktop-light/phone-dark proof PNGs
and `evidence/select-text-checks-2026-10-19.log`. Full captures, native zoom proof,
synthetic source and three outputs remain in `/tmp/cloakpdf-air-review/`. The
production review tab shows the selected synthetic study on 8132. Local commits
only. Next: EditorContext, EditorToolStage, EditorView, OverviewMode, WholeDocPanel
and stage ownership/legacy-consumer audits, including focus when Undo disables its
button. Full PDF/family refresh remains open.

## 2026-10-19 — Editor wrappers and history

Undo, Redo and Reset now retain keyboard focus when they reach a history boundary.
Unavailable actions reject pointer/Enter/Space activation; the provider also guards
history calls synchronously during processing. Responsive inspector mounts preserve
focus on surviving toolbar controls, while selecting a tool still focuses its heading.
N-up now composes PrimaryAction directly and provides a settings focus fallback for
Safari pointer activation. Shared Air aria-disabled icon styling keeps hover/press
inert and the keyboard focus contour at full contrast. The canonical correction is
synchronized to all five standalone bundles; Air remains 1.0.2 / bb90f52e0b0a.

Removed unused provider commit/jumpTo, history base/size/jumpTo/labels and the
single-consumer WholeDocPanel/danger API. Tests inspect actual history entries.
Reviewed EditorContext, EditorToolStage, EditorView, OverviewMode and stage consumers;
live dispatch and lifecycle seams remain. No dependency added. The inventory has
91 surfaces and keeps physical/assistive acceptance open.

453 unit tests in 46 files pass. Navigation covers 176 states across all eleven
required sizes, breakpoint neighbors, both themes and enlarged text. N-up covers
70 layouts and 23 real output sheets, including crop/rotation/UserUnit, blank slots,
mixed dimensions, form appearance and searchable vectors. Select text's provider
harness verifies exact bytes/history during same-frame and already-busy history
calls. Safari verifies apply/fallback and all history boundaries; Firefox actual
200% retains focus and scroll access. Final screenshots inspect desktop/laptop/
tablet/phone, light/dark, forced colours and reduced motion. Physical touch/software
keyboard, actual OS IME and spoken assistive acceptance remain open.

Validation found and fixed responsive focus stealing, Safari pointer focus and a
dimmed disabled focus ring. A recurring AI entrance test miss came from sampling
after the 240ms animation had ended. The test now records real native animation
creation before clicking and forwards execution unchanged; the same duration
assertion remains. An intermediate regression was stopped for the final CSS rebuild.
The final complete 16-suite production smoke and seven extended suites pass; with
focused N-up and Select text this is 25 distinct suites. The extended command ran
unchanged on a fresh dev8133 after the long-lived dev8122 failed once with a destroyed
compression context and once before the rotation fixture opened. These failed
attempts are recorded separately; no runtime/assertion change was used for the retry.

Editor bundle 327.04/99.39 kB raw/gzip (gzip -0.11), CSS 138.43/24.05 (+0.03);
128 deployment assets and 77 PWA entries. Required format/lint/types, dead-code,
build/assets, design, 18 portability checks and exact family bundle sync pass.
Evidence: `evidence/editor-wrappers-2026-10-19.json`, desktop/phone PNGs and
`evidence/editor-wrappers-checks-2026-10-19.log`. Full temporary captures and native
proofs are in `/tmp/cloakpdf-air-review/wrappers-*`. Next: legacy CSS/output font
exceptions and registry/lifecycle consumers, followed by full PDF closure.
Local commits only; full PDF/family migration is unfinished.

## 2026-10-19 — Air foundation and Select cleanup

The PDF root, editor shell, processing scrim and modal stack now consume canonical
Air fonts, surfaces and layers directly. Removed tokens.css and the retired
Workbench/Ocean Blue palette, typography aliases, unused label/selection/scrollbar/
pulse rules and dropdown/disclosure motion. Fine-pointer internal scrollbars remain;
touch keeps native scrollbars. The page-grid rendering optimization is preserved.

Select follows Air's immediate frequent-control rule for pointer and keyboard use.
Full labels wrap, the popup keeps a 15rem minimum when space permits and remains
bounded to the viewport. Removed animation and placement-only state; placement,
keyboard/typeahead, focus, dismissal and disabled behavior remain covered.

Deleted the unused Archivo and JetBrains UI assets (75,332 bytes). The 42 document
TTF faces are unchanged from b9738c0 and exactly match CSS and FONT_FAMILIES: eleven
embedded families plus the existing built-in PDF choices. Real Roboto annotation
output still embeds correctly. The shared SIL license remains. fonts.css is now
classified as output-preservation in the 91-surface inventory. No dependency added.

453 unit tests in 46 files, 70 N-up layouts with 23 real output sheets and 141
recovery captures pass. Full 16-suite production smoke plus seven extended suites
pass serially without retries: 25 distinct suites with focused N-up/recovery.
Coverage includes all eleven viewport classes, both themes, enlarged text, coarse
input emulation, forced colours and reduced motion. New assertions check complete
choice labels, immediate opening/arrow feedback, system UI fonts and processing
pointer ownership. Desktop/laptop/tablet/phone contact sheets and full-size phone
views inspected. Safari production validates selection/Escape/Apply/Undo and focus;
Firefox actual 200% validates selection and lower action access. Native review tabs
closed and Firefox zoom restored. Physical touch/software keyboard, actual OS IME
and spoken assistive acceptance remain open; inventory validation stays false.

Editor bundle 326.91/99.33 kB raw/gzip (gzip -0.06), CSS 132.38/22.81 (-1.24);
126 deployment assets and 75 PWA entries. Required code/dead/build/assets/design/
portability and exact family sync outcomes are recorded in the evidence log.
Air remains 1.0.2 / bb90f52e0b0a; canonical PDF requirements and standalone DESIGN
are synchronized. Evidence: `evidence/foundation-2026-10-19.json`, desktop/phone
PNGs and `evidence/foundation-checks-2026-10-19.log`; full captures and native proof
remain in `/tmp/cloakpdf-air-review/foundation-*`.

Next: non-visible registry/lifecycle consumers and remaining full-PDF acceptance,
then IMG/Resume colour wheel adoption and family rollout. Local commits only;
this bounded cleanup does not complete the PDF or family migration.

## 2026-10-19 — Tool registries and session lifecycle

The two disjoint rosters derive route identities and require complete implementation
maps. All seven standalone components remain lazy. Removed all-true standaloneOnly
flags/filter, seven redundant lazy aliases and obsolete contributor references.
Standalone event navigation now states the routes it actually handles; editor
search/preselection and constructor handoff remain intact. Unknown/inherited ids
are rejected. Live stage/provider/entry and cleanup seams remain; no dependency added.

Reproduced queued work running after editor departure. The existing session revision
now guards queued busy tasks, status updates and transform output. Work abandoned
before paint never starts; late transform output does not build previews; previews
already being generated are retired. Already-running computation can finish, but
its result cannot install in a departed editor.

456 units/47 files, 176 editor-tool selections (22 tools × four device classes ×
two themes), 176 navigation layouts, 141 recovery captures and 70 N-up layouts with
23 real output sheets pass. Complete 16 production smoke and seven extended suites
pass; with focused recovery/N-up, 25 distinct suites. Stage handlers clear on tool
departure; document/page/history and heading focus persist. StrictMode, load/draft
failure/retry, stale ownership and thumbnail release pass without console errors.

Responsive evidence spans all eleven required sizes, both themes, enlarged text,
forced colours and reduced motion. Desktop/laptop/tablet/phone captures inspected.
Production IAB review confirms Stamp overlay cleanup, Metadata Save/Undo and retained
Page 2 with a synthetic PDF. Previous foundation Safari/Firefox evidence remains;
those browsers were not rerun in this slice. Physical touch/software keyboard, OS
IME and spoken assistive acceptance remain open. All 91 inventory sources are now
source-reviewed/implemented; final validation flags remain false.

The baseline failure is recorded. Early harness context/heading errors were corrected;
a route run passed all selections then clicked during responsive layout, now guarded
by a visible-control wait. A concurrent recovery run was stopped; the final fresh
serial run passes all captures and lifecycle assertions. No output assertion weakened.

Required code/dead/unit/build/assets/design/18 portability and root checks/six-document
sync pass. Editor 327.18/98.80 kB raw/gzip (gzip -0.53); CSS 132.38/22.81 unchanged;
126 deployment assets/75 PWA entries. Air 1.0.2 / bb90f52e0b0a stays unchanged.
The canonical PDF appendix and standalone DESIGN carry the registry/ownership rules.
Evidence: `evidence/registry-lifecycle-2026-10-19.json`, desktop/phone PNGs and
`evidence/registry-lifecycle-checks-2026-10-19.log`; full captures/logs remain under
`/tmp/cloakpdf-air-review/registry-*`.

Next: replace legacy PWA install/README screenshots and audit associated metadata,
then remaining full-PDF acceptance and family rollout. Local commits only; this
does not complete the full PDF/family migration.
