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
