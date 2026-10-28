# Air consistency audit — 2026-10-28

Air 1.2.4 pins the same public compact navigation and correct CSS time conversion
for both seconds and milliseconds. The production light arrival stays 900ms.

Removed duplicate compact-menu styles and the surviving 16px row-gap override. The shared 40rem menu and open-chevron treatment now govern the public header. All 461 unit tests, all 16 production smoke suites (documented demo fixtures), build/check/dead-code/design/portability and artwork checks pass.

The four refreshed websites pass 1,152 Chrome/Firefox shell layouts with zero
deviations/errors. PDF/Resume share 264 PWA layouts and 54 exact visual pairs.
The common notices preserve each app's update/work-safety lifecycle. Yard and
Drop's website have no PWA worker. Link states remain neutral, including hover.

[Local evidence](evidence/consistency-2026-10-28/) preserves this candidate's verification.
[The family audit](https://github.com/cloakyard/cloakyard/blob/main/docs/air/consistency-2026-10-28.md)
contains the before/after review, full test ledger and production release tracking.
Deployment is tracked separately from these pre-merge acceptance results.

Full product, physical/assistive/hardware and existing output/security acceptance
items remain open. This audit does not mark those surfaces fully validated.

## Build dependency follow-up

The 2026-10-28 CI scan surfaced GHSA-gcqx-w48m-w2h4 in deepmerge 4.3.1, a
transitive Workbox build dependency with no patched release. Its sole consumer
clones fixed resolver defaults. A version-pinned CJS/ESM patch uses Node's native
structuredClone; a scoped pnpm override removes the unused dependency. See
[patch rationale and removal condition](../../patches/README.md). No advisory
suppression or replacement library was added. Frozen install, both resolver
entry points, unchanged frozen defaults, full build and exact pre/post output
hashes pass. OSV passes with only any separately approved existing exception.

All 130 public application/service-worker files remain byte-identical to the verified Air candidate.
