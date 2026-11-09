# Component corners — 2026-11-09

Air 1.7.1 pins corner roles for controls, chips, panels, menus, dialogs and flush
working panes. The smallest calendar now uses 20px top sheet corners. Its seven
day columns use the full scrollport, retaining 44px targets beside the native
scrollbar. Range/disclosure corners stay unchanged on focus. No PDF processing,
model or output code changes.

Checks pass: 461 units; required type/check/build/dead-code/design/portability;
176 tool selections and 148 navigation layouts; 88 collection layouts; six real
standalone processing workflows; export/redaction downloads and 64-case export/
AI-state matrices. Metadata/calendar acceptance covers 28 layouts and actual
output, drafts, retry, keyboard and mobile Apply. A further 44 built calendar
cases pass in Chromium/WebKit at all eleven sizes and both themes, including
44px day targets and retained scrolling.

The shared editor comparator passes 66 Chromium and 66 WebKit cases against an
isolated Air reference. Family public/privacy/recovery, 264 dialog/classic-scrollbar
and 396 real-worker notice cases pass. Reviewed phone/tablet/laptop/desktop captures
are recorded in Cloakyard's `docs/air/component-corners-2026-11-09.md`.

The collection test now waits for the existing animation-frame scroll restoration
before asserting visibility; it retains the same ownership and visible bounds.
The fresh final run passes with observation enabled; production behavior is unchanged.

Original unrelated AI work stays outside this checkout. The approved pre-existing
Compact long-document limitation remains documented. This UI-only pass does not
repeat model inference. Physical-device, keyboard/IME, real zoom and spoken assistive
acceptance remain separate. The release PR records exact-main deployment and dev
synchronization after merge.
