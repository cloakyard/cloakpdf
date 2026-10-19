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
| Active-work PWA updates                                             | `pwa-update-2026-10-19.json`; real waiting workers, two tabs, pending drafts, standalone queue, export and handoff-race protection; 44 layouts                                      |
| Static missing-page recovery                                        | `recovery-page-2026-10-19.json`; built shared CSS, actual HTTP 404, installed/offline routing, no-JS recovery and 66 responsive/theme/text cases                                    |

## Final AI software matrix — 2026-10-19

The shipped choices and estimates come from `src/utils/ai-models.ts`, not retired
model descriptions. A fresh visitor receives Compact; the test explicitly seeds
its starting tier. The test's default remains Quality for repeatable comparisons.

| Tier                    | Exact repository / dtype                  | Chat estimate                        | UI guidance     |
| ----------------------- | ----------------------------------------- | ------------------------------------ | --------------- |
| Compact (`lfm2.5-1.2b`) | `LiquidAI/LFM2.5-1.2B-Instruct-ONNX` / q4 | 810 MiB download, ~2 GiB peak RAM    | 3–4 GB free RAM |
| Quality (`lfm2-2.6b`)   | `onnx-community/LFM2-2.6B-ONNX` / q4f16   | 1.55 GiB download, ~3.5 GiB peak RAM | ≥8 GB free RAM  |

Both load EmbeddingGemma (`onnx-community/embeddinggemma-300m-ONNX`, q8,
320 MiB, forced WASM) and MS MARCO MiniLM (`Xenova/ms-marco-MiniLM-L-6-v2`,
int8, 23 MiB). Chat and reranking request WebGPU when an adapter is available;
without it the runtime delegates to the library default. The reranker is **not**
forced to WASM. Full registry estimates total ~1.13/1.89 GiB, excluding runtime
resources. Estimates are not measured whole-app memory peaks or minimum guarantees.
Both chat samplers use 256 maximum new tokens, temperature .3, min-p .15,
repetition penalty 1.05 and no-repeat n-gram size 6. No model/settings changed here.

| Device / engine                               | Eligibility and evidence                                                                                                                                                                                                    |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop/laptop Chrome                         | Real runs: Apple M2 Max, 32 GiB RAM, macOS 27.0.1, Chrome 155.0.8059.85, Apple Metal 3 WebGPU adapter available. Both tiers × both original fixtures pass.                                                                  |
| Desktop Safari / Firefox                      | Prior native layout, keyboard and 200% zoom reviews remain dated evidence. No real inference certification on these engines in this matrix.                                                                                 |
| Phones/tablets                                | Ask PDF is desktop-only via the existing mobile-UA heuristic. Phone-sized captures resize a desktop session; they do not establish mobile model support. Desktop-mode iPad UA is not reliably classified by this heuristic. |
| No WebGPU / lower-memory devices / other GPUs | Runtime fallback and UI estimates exist; actual model execution, whole-app memory and performance on these combinations remain unverified.                                                                                  |

The ignored original fixtures were parsed before testing: a four-page résumé and
the 33-page skills guide, with all asserted ground-truth facts present. Hashes,
exact commands, timings and coverage are in `evidence/ai-acceptance-2026-10-19.json`.
Every run covers initial loading, warm return/index reuse, required facts, keyboard
tier change/cancel, a generated answer after swapping, and memory release/reload.
The résumé's overview/contact answers use deterministic fast paths; the subsequent
summary exercises actual generation. The longer fixture exercises real retrieval
and generation. Reranking and HyDE were left enabled. Existing cache bytes were
preserved; these runs **do not** establish a fresh full-model download or meaningful
byte-progress transitions. Synthetic consent/cache/failure tests cover those UI states
separately. 256 tier-picker viewport/theme/text observations accompany the four runs.

All assertions passed without weaker ground truth. This is bounded integration
acceptance, not universal answer accuracy: generated long-document overviews
paraphrased the title imprecisely, and one Compact security reply prefaced the correct
three facts with a contradictory statement. Keep the Beta framing and source checks;
no quality claim is inferred from keyword assertions. The first Quality/multipage
attempt navigated during indexing; a held-steady rerun passed. Its failed log is
retained locally; no product fix or definitive cause is claimed.

PWA waiting-worker integration and the broader source/state/output reconciliation
remain covered by the dated records above. The software checkpoint allows the corrected
CloakDrop website rollout to proceed; physical and cross-device gates below remain open.

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

The user revised the remaining rollout on 2026-10-19: CloakDrop's website next,
then CloakResume, with CloakIMG last. KERR and native macOS interfaces are excluded. No push or deployment is part
of this work.
