import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const doc = await readFile(resolve(root, "DESIGN.md"), "utf8");
const expected = doc.match(/^family-contract-sha256: ([a-f0-9]{64})$/m)?.[1];
const contract = doc
  .split("<!-- BEGIN CLOAKYARD AIR CONTRACT -->")[1]
  ?.split("<!-- END CLOAKYARD AIR CONTRACT -->")[0]
  ?.trim();
const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};
if (!contract || !expected)
  fail("DESIGN.md is missing the portable Air contract or revision hash.");
else {
  const actual = createHash("sha256").update(contract).digest("hex");
  if (actual !== expected)
    fail("Air contract drift: update the family source and synchronized copies.");
  if (/\/(?:Users|home)\/[^\s/]+\//.test(doc))
    fail("DESIGN.md contains a non-portable machine path.");
}
const inventory = JSON.parse(await readFile(resolve(root, "docs/air/surfaces.json"), "utf8"));
const names = inventory.surfaces.map((entry) => entry.path);
if (new Set(names).size !== names.length) fail("Duplicate entries in the Air surface inventory.");
for (const surface of inventory.surfaces) {
  if (surface.validated && (!surface.sourceReviewed || !surface.evidence.length)) {
    fail(`Validation needs source review and evidence: ${surface.path}`);
  }
}
if (!process.exitCode) {
  console.log(
    `Air contract and ${names.length} inventory records are valid. Runtime conformance is audited separately.`,
  );
}
