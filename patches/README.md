# Build-only node-resolve patch — 2026-10-28

`@rollup/plugin-node-resolve@16.0.3` uses `deepmerge` once, to copy its fixed
`defaults` object before recursively freezing the public `DEFAULTS` export.
The defaults contain only arrays, strings and booleans. Options are combined
separately with object spread; package metadata is not passed to deepmerge.

[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) was updated
on 2026-10-27 and has no patched deepmerge release. Replace that one copy with
Node's native `structuredClone` in both published CJS and ESM entry points, then
remove the now-unused dependency through a version-scoped pnpm override.
The repositories build on Node 24. No replacement library or advisory suppression
is added. The normal pnpm patch hash pins these edits; unused patches fail install.

Remove this patch and its override when the upstream resolver no longer depends
on deepmerge. The patch applies only to 16.0.3 and must be reassessed on upgrades.

Validation: frozen install, both CJS/ESM entry points, identical recursively frozen
default values, resolver creation, absence of the removed dependency, production
build and exact pre/post application/service-worker bytes. OSV scans the resulting
lockfile; existing separately approved exceptions remain explicit. Evidence is in
`docs/air/evidence/consistency-2026-10-28/`.
