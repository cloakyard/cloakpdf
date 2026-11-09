# Tablet follow-up — 2026-11-09

Air remains 1.7.1. The stable scrollbar gutter made “Signature” and “Bookmarks”
break inside words in the tool rail. Existing short labels now display “Sign” and
“Outline”; complete names remain in accessible names, search, tooltips and panels.
There is no processing, export or shared skin change.

The new `test:air-rail-labels` checks real rendered word bounds and touch targets
with classic scrollbars in Chrome and WebKit: 13 viewport profiles, both themes,
16/32px root text, 104 observations. The old build failed 36 observations; the
final build passes all 104, including opening both original named tools.

Fresh tablet coverage includes all 22 tools (176 selections), 24 navigation and
32 collection layouts, 208 standalone empty/file-selected states in both engines,
16 calendar cases, and the existing 64-case matrices for each AI dialog state.
Shared PDF/IMG/Resume comparison passes 42 Chrome + 42 WebKit touch cases and 12
fine-pointer cases across phone, four tablet profiles, laptop and desktop. Dialog
scrolling and retained actions pass 96 cases; real-worker PWA notices pass 144.
The canonical audit provides the per-view ledger and compressed receipts.

Required gates pass: `vp check`, `pnpm check:dead`, 461 unit tests, production build,
Air design check and the applicable browser suites. A package script registers the
new regression with the dead-code graph. No unused production code was added.

Raw evidence: `/Users/sumitsahoo/Developer/.air-mobile-2026-11-09/evidence/tablet`.
Family record: https://github.com/cloakyard/cloakyard/blob/dev/docs/air/tablet-audit-2026-11-09.md
Physical tablets, OS keyboards/IME, real browser zoom and spoken assistive checks
remain open. Model-state UI checks do not repeat model inference; the previously
approved Compact long-document limitation is unchanged.
