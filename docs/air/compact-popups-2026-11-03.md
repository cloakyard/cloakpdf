# Compact update notices and dialog scrolling — 2026-11-03

Adopts Air 1.6.0. Update notices are fixed at the bottom right, max 384px wide,
with one quiet 44px dismiss target. Existing update deferral, busy/retry state,
focus restoration and same-tab consent remain intact. Dialogs use the common
close target and shared native scroll styling. Local legacy scrollbar skins are removed.

PDF keeps its title/actions outside the scrollable body and moves long filenames
into the body. IMG prevents flex children from shrinking/clipping inside a dialog
and exposes focused fields in WebKit. Resume uses the same close/scroll primitives.
No document/image processing, model selection or template output changes.

Validation: Air design/provenance and standalone portability pass. Family checks
cover 648 home / 288 secondary layouts. The PWA comparison covers 396 layouts;
real worker/update protection checks pass. Dialog checks cover 264 engine/theme/
viewport/text cases. Unit suites pass (PDF 461, IMG 488, Resume 373); PDF exports
and IMG exact PNG output pass. Full commands and evidence are in the canonical
`cloakyard/docs/air/compact-popups-2026-11-03.md` record.

Classic scrollbar visuals and drag/wheel interaction are tested with the browser's
`--hide-scrollbars` default removed. Physical Windows/iPhone, OS IME, software
keyboard and spoken-assistive acceptance remain separate.

Release status: verified locally; promotion pending.
