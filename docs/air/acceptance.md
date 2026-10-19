# Air acceptance reconciliation — 2026-10-19

This map replaces stale “next panel” suggestions in the baseline audit. The dated
records in `validation.md` and `evidence/` remain the detailed proof. Implemented
source is not full device or all-state acceptance. The inventory includes 94
sources after adding root/static/artwork HTML; interactive validation flags stay
open for the human/device gates below.

| Scope                                                               | Current implementation and software evidence in `docs/air/evidence/`                                                                                                                |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entry, privacy, intake, global recovery, PWA notice appearance      | `entry-2026-10-13.json`; utility/recovery checkpoints in `validation.md`                                                                                                            |
| Constructors, extraction, password, certificate signing, comparison | `constructors-2026-10-13.json`, `extract-2026-10-14.json`, `password-2026-10-14.json`, `signature-2026-10-14.json`, `compare-2026-10-14.json`; real output checks                   |
| AI setup, consent, model cache/recovery and chat                    | `ai-setup-2026-10-14.json`, `ai-modals-2026-10-14.json`, `chat-2026-10-14.json`; real-model integration is dated evidence, not every tier/state on every device                     |
| Header, tool navigation, page collections and canvas                | `navigation-2026-10-14.json`, `collections-2026-10-14.json`, `canvas-2026-10-14.json`; 176 navigation layouts rechecked in `previews-2026-10-19.json`                               |
| Export and command palette                                          | `export-2026-10-14.json`, `palette-2026-10-14.json`; all six export formats and destructive-mark output                                                                             |
| Shared fields/selects/switches/precision and colour wheel           | Panel evidence below; `colour-wheel-2026-10-15.json`, `foundation-2026-10-19.json`; keyboard/menu/output and all nine picker consumers                                              |
| Redact, Smart Erase, Find & Act, Scrub                              | `privacy-panels-2026-10-15.json`, `search-scrub-2026-10-15.json`; source-bound matches, failed drafts, privacy output and Undo                                                      |
| Metadata/date-time, Bookmarks, Attach                               | `metadata-calendar-2026-10-15.json`, `bookmarks-2026-10-15.json`, `attachments-2026-10-15.json`; nested controls, catalog data and output                                           |
| Crop, Strip furniture, Signature                                    | `crop-furniture-2026-10-15.json`, `signature-panel-2026-10-15.json`; geometry, gestures, recovery, real output and Cancel                                                           |
| Stamp, Page numbers, Header & footer, Bates                         | `stamp-panel-2026-10-15.json`, `page-numbers-2026-10-15.json`, `header-footer-2026-10-15.json`, `bates-2026-10-15.json`; fitted complete output, pending drafts and Apply lifecycle |
| QR/barcode and Annotate                                             | `codes-2026-10-15.json`, `annotate-2026-10-15.json`; vector output, fonts/alpha, keyboard placement and history                                                                     |
| Auto-fill, Fill form, Select text                                   | `autofill-2026-10-15.json`, `fill-form-2026-10-19.json`, `select-text-2026-10-19.json`; retained field values, native flags, selection geometry and real output                     |
| N-up, OCR and cross-tool geometry                                   | `nup-2026-10-14.json`, `ocr-2026-10-14.json`, `geometry-2026-10-14.json`; physical page geometry and actual exported sheets/text/pixels                                             |
| Recovery, history, provider and dispatch lifecycle                  | `preview-recovery-2026-10-14.json`, `editor-recovery-2026-10-15.json`, `editor-wrappers-2026-10-19.json`, `registry-lifecycle-2026-10-19.json`                                      |
| Install/README/social previews and metadata                         | `previews-2026-10-19.json`; real synthetic captures, shipped PNG dimensions/paths, OG/Twitter metadata and Chromium installability                                                  |
| Static missing-page recovery                                        | `recovery-page-2026-10-19.json`; built shared CSS, actual HTTP 404, installed/offline routing, no-JS recovery and 66 responsive/theme/text cases                                    |

## Remaining software acceptance

- Reproduce and protect PWA **Update now** during an active editor or standalone
  task. Source review found no route/unsaved-work guard in `ReloadPrompt`; entry
  notice geometry and busy-button tests do not establish editor integration safety.
  Test a real waiting service worker with pending work, cancellation/defer, export
  and return-to-home update. Do not label this gap passed from the 404 route suite.
- Before final PDF sign-off, record the exact supported AI tier/device matrix and
  final real-model run. Prior real initial/warm/tier-swap/reload tests are preserved,
  but not generalized to untested combinations. Keep synthetic response/state tests
  distinct from actual inference. Do not silently replace missing ground-truth PDFs.
- Recheck any findings uncovered by the PWA integration and final source/state audit.
  Full 2026-10-19 regression coverage does not make physical acceptance automatic.

## Human/device acceptance

- Physical touch and real software keyboards, including compact/landscape editors
  and popovers, are still open. Emulated pointer/viewport tests are supporting proof.
- Actual OS IME and spoken assistive technology remain open across acquisition,
  editor controls, nested overlays, AI output, error/recovery and export.
- Scan QR/barcode output at final physical size. Vector quiet-zone/output tests do
  not replace this test.
- Native Safari and Firefox light recovery/navigation were reviewed for the new 404;
  Firefox also passed actual 200% zoom/scroll. Installed/offline route tests and dark
  coverage for this piece ran in Chromium. Broader native panel evidence remains dated.
- Family shader GPU/battery/thermal acceptance needs real devices. PDF has no
  decorative shader in its editor.

## Existing output limits, kept separate

OCR still lacks wider Unicode font embedding and mixed scanned-region recognition
on pages with native text. Unsupported output fails explicitly; original text and
copyable OCR previews remain available. Some processing cannot be interrupted;
late results are discarded safely. These are documented product limits, not proof
of missing Air styling or permission to drop content.

CloakIMG, CloakResume and CloakDrop's website remain the next family rollout in that
order. KERR and native macOS interfaces are excluded. No push or deployment is part
of this work.
