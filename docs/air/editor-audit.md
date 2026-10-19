# Existing PDF editor — full default-panel audit

2026-10-11. Baseline inspection before Air migration. No production UI changed.
The fixture was `tests/fixtures/demo/multipage.pdf`, a synthetic four-page document.

## Coverage and evidence

All **22 editor tools** were opened at **1440×900, light**. Their live accessible
panel contents are saved in `editor-panel-audit.json`. All 22 were then opened at
**390×844, dark, coarse pointer**; dimensions and text-field sizes are saved in
`editor-mobile-audit.json`. Mobile panels were exited with **Cancel**, preserving
the fixture rather than applying each tool. This is a UI audit, not an export or
feature-correctness pass. Browser emulation does not certify a physical device.

The phone sweep found no document/panel horizontal overflow, no Cancel/Done action
outside the viewport, and no inspected text/number field below 16px. Disabled Done
in an empty transactional tool is intentional; it is not a broken close button.

Additional states: Annotate → Highlight/Icons, Signature → Choose, Metadata →
date/time popup. Date picker Escape returned focus to its original trigger. The
calendar measured **288×479px** with roughly **37.4×44px** day targets on touch.
A reviewed capture is `evidence/baseline-date-picker-phone-dark.jpg`.

## Tool-by-tool migration requirements

| Tool            | Observed controls/state                                                                                     | Air preservation requirement                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Annotate        | Select, Pen, Highlight, Line, Arrow, Rectangle, Oval, Text, Icons; colour; empty mark count; disabled Apply | Preserve actual nine-mode roster; selected mode and selected object remain distinct; icon/font/object states still require their own review.       |
| Signature       | Draw/Choose, drawing canvas, colour, independent realistic-ink/background switches, placement count         | Preserve drawing and PNG/JPEG source choice, transparency/backing and placement/resize. No replacement by an unsupported typed-signature workflow. |
| Fill form       | No form fields in this fixture                                                                              | Preserve meaningful empty state; inspect text, check, radio and select fields with a form fixture later.                                           |
| Select text     | Reading-order selection instructions, no selection                                                          | Keep native-like selection plus highlight/box/redact/copy; retain scanned-page OCR explanation.                                                    |
| Auto-fill       | Detect fields; expandable local profile                                                                     | Distinguish detection, no matches, field assignment, saved profile and Apply.                                                                      |
| Organize        | Four-page overview, rotate/reorder/delete/restore, quick actions and disabled Apply                         | Preserve keyboard reorder, pending changes, output count and Cancel rollback.                                                                      |
| Redact          | Category chips, phrase search, case/word options, fill/border colour, editable marks                        | Keep export-time permanence explanation and searched/detected/editable states.                                                                     |
| Find & Act      | Highlight/Box, colour, query, disabled Find, case/word options                                              | Keep reviewable results before applying; no conflation with redaction.                                                                             |
| Scrub           | Five privacy-report counts, optional annotation removal, destructive action                                 | Preserve factual counts, consequences, busy/error and recovery.                                                                                    |
| Metadata        | File facts, six fields, Created/Modified date-time controls, Save/Clear                                     | Field trigger, nested calendar/year/time pickers and focus return all need Air styling.                                                            |
| Crop            | All/This page, trim-to-content, straighten, empty crop box                                                  | Preserve non-destructive explanation, rotated-page handling and canvas geometry.                                                                   |
| Strip furniture | Detected header/footer rows, selection and crop summary                                                     | Keep quotes as actual document data; selection/counts and no-result/error states remain clear.                                                     |
| Erase           | Fill/Blend/Pixelate, empty region, export-time explanation                                                  | Method-specific options and canvas handles are separate states; preserve permanence disclosure.                                                    |
| OCR             | Custom language select, Extract, one-time engine explanation                                                | Preserve extraction/searchable-output stages, download/progress/cancel/error states.                                                               |
| N-up            | Five layout choices, sheet preview and output summary                                                       | Geometry thumbnails remain functional data; labels and controls use Air.                                                                           |
| Stamp           | Text, six insertion chips, shape, finish, colour and three sliders                                          | Preserve caret insertion and live output; precise numeric values should accompany sliders.                                                         |
| Page numbers    | 3×2 position grid, four formats, colour, size/margin                                                        | Keep spatial placement meaningful and touch targets reachable.                                                                                     |
| Header & footer | Six aligned fields, insertion chips, colour/size, skip-first switch                                         | Preserve field/caret focus, all positions and independent switch semantics.                                                                        |
| Bates           | Prefix/suffix, start slider, digits, position grid, colour                                                  | Numeric start needs exact entry in Air; preview must preserve identifier formatting.                                                               |
| QR / barcode    | Source-mode segments, content, empty preview, colour, placement count                                       | Preserve vector/output fidelity, real validation and placement/resize states.                                                                      |
| Bookmarks       | Nesting control, title/page row, add/remove, optional contents page                                         | Shared open rows must retain hierarchy, keyboard actions and page target validity.                                                                 |
| Attach          | Empty attachment state and file chooser                                                                     | Preserve list, names, sizes, download/remove/add and error states.                                                                                 |

## Shared design decisions

The existing panel header stays outside the scrolling body. Air should retain that
hierarchy and move a single transactional primary action into a persistent action
region where needed. The current `PrimaryAction` registers readiness with mobile
Done; multiple-action tools retain their distinct controls. This behaviour must
survive restyling. A generic “Done closes preview” mockup is not a replacement for
these transactions.

Replace uppercase monospace labels and repeated bordered groups with Air labels,
open groups and one field contour. Keep current values, functional output colours,
selected-state semantics and error feedback. Standardise position grids, insertion
chips, switches, report rows and nested date/select popovers before migration.

A touch calendar needs seven 44px columns: use a wide popover where space permits,
or the Air full-width sheet with reduced calendar-grid inset at 320px. Do not
shrink touch targets to retain the present 288px desktop popup width.

## Still required

- All default panels in the opposite themes and other layout classes; rendered
  long/invalid/populated/busy/error states; keyboard-only and physical touch review.
- Form/scan/attachment fixtures; all annotation properties, signature placement,
  crop/rotate, search results, profile detection, OCR and destructive-operation flows.
- Seven standalone utilities, AI consent/model states, command palette, full
  export choices/progress/errors, app/PWA notices, privacy and landing surfaces.
- Real exported bytes/pixels, undo/redo, restore, multi-page correctness and the
  existing smoke/extended/AI suites applicable to each eventual production piece.

No source is marked Air implemented or fully validated by this baseline audit.
