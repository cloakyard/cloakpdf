# Clear mobile editor actions — 2 November 2026

CloakPDF now shares Air 1.3.3's labelled mobile Cancel / Apply row with CloakIMG.
It stays outside the scrolling controls. Expand / Split view is separate from
completion. The tablet/desktop Cancel action also has a visible text label.
Inspection, multi-action and deferred-export panels use Close when no staged
operation is registered; their actual operations and permanence notices remain.
Autosaved writing in CloakResume retains its existing semantics.

Apply awaits the pending operation, rejects repeated activation and ignores a
conflicting Cancel in the same event turn. Both actions are disabled during busy
work. Failed applies keep the tool open for retry. Existing document operations,
output formats and deferred redaction are unchanged. Removed icon imports, old
header action styling and stale mobile Done selectors keep the implementation lean.

## Verification

- 461 units in 48 files; format/lint/types, Knip, production build, deployment
  metadata and independent Air portability pass.
- All 16 production smoke suites pass using the existing explicit demo-fixture
  option for the standalone suite. Real documents are uploaded and real artifacts
  downloaded. Desktop/mobile tool apply, deferred redaction, navigation, modal
  ownership, collections, canvas, export and responsive motion are covered.
- Twelve actual phone action journeys in Chromium/WebKit, light/dark at 320/390/430:
  Cancel discards metadata; view expansion preserves the draft; rapid Apply is
  accepted once; Undo/Redo retain the intended boundary; Attach uses Close; exported
  PDFs retain the applied title, author, page count and dimensions.
- The metadata/calendar suite passes failure/retry, discarded draft, same-event
  activation, real output and 28 panel/calendar layouts.
- Family comparison: 648 home/288 secondary layouts and 390 interactions with no
  deviations/errors. Real-worker PWA notices match in 396 layouts/162 captures.
- Real-editor README/PWA captures regenerated for phone/desktop light/dark; image
  dimensions agree with the manifest. Selected action captures/results are in
  [the evidence directory](evidence/simple-actions-2026-11-02/verification.json).

Reproduce the phone journey with `vp run test:air-actions`, external
`PLAYWRIGHT_MODULE`, `BASE_URL` and `AIR_EVIDENCE_DIR`. Existing production suites
use `E2E_URL` and a disposable `E2E_USER_DATA_DIR`. The metadata fault-injection
suite uses a stable dev server. Scratch: `/tmp/air-simple-actions-2026-11-02/`.
The first broad smoke invocation lacked optional local source PDFs; rerunning with
its documented `E2E_DEMO_FIXTURES=1` completes all 16 suites. New harness assertions
were corrected to use the real Attach label and verify the action row's position
outside the scrolling body, rather than requiring a non-clipping sheet.

Physical iPhone/software-keyboard, OS IME and spoken assistive acceptance remain
open. The previously documented Compact beta long-document limitation remains
under the user's existing exception; this UI pass does not claim new AI acceptance.
