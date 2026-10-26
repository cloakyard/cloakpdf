/** Exercise the portable bundle and its drift guards without a sibling checkout. */
import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute, basename } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const source = resolve(
  args.find((arg) => !arg.startsWith("--")) ||
    resolve(dirname(fileURLToPath(import.meta.url)), ".."),
);
assert(
  args.every((arg) => !arg.startsWith("--") || arg === "--keep"),
  "Unknown option",
);
const fixture = await mkdtemp(resolve(tmpdir(), "air-portability-"));
const manifestPath = "docs/air/bundle.json";
const manifestText = await readFile(resolve(source, manifestPath), "utf8");
const manifest = JSON.parse(manifestText);
const assets = Object.keys(manifest.studyAssets).map((asset) => `docs/air/${asset}`);
const files = [
  "DESIGN.md",
  manifestPath,
  "docs/air/surfaces.json",
  "scripts/check-air-design.mjs",
  manifest.stylesheet,
  ...assets,
];
const checks = [];
try {
  for (const file of new Set(files)) {
    const target = resolve(fixture, file);
    assert(
      !isAbsolute(file) && !relative(fixture, target).startsWith(".."),
      `Non-portable path: ${file}`,
    );
    await mkdir(dirname(target), { recursive: true });
    await copyFile(resolve(source, file), target);
  }
  // A portable design bundle does not include product implementation sources.
  // Keep the real repository inventory intact; isolate only its bundled CSS
  // entry in this temporary fixture. Runtime conformance uses the full inventory.
  const inventoryPath = resolve(fixture, "docs/air/surfaces.json");
  const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  inventory.surfaces = inventory.surfaces.filter((surface) => surface.path === manifest.stylesheet);
  assert.equal(inventory.surfaces.length, 1, "Portable CSS must have exactly one inventory entry");
  await writeFile(inventoryPath, JSON.stringify(inventory));
  function verify() {
    const result = spawnSync(process.execPath, [resolve(fixture, "scripts/check-air-design.mjs")], {
      cwd: fixture,
      encoding: "utf8",
    });
    if (result.error) throw result.error;
    return result;
  }
  const baseline = verify();
  assert.equal(baseline.status, 0, baseline.stderr);
  checks.push("isolated bundle passes with no dependencies or sibling files");

  const withoutLightRuntime = structuredClone(manifest);
  delete withoutLightRuntime.studyAssets["light-runtime.mjs"];
  await writeFile(resolve(fixture, manifestPath), JSON.stringify(withoutLightRuntime));
  assert.notEqual(verify().status, 0, "Missing shared light lifecycle hash must fail");
  checks.push("missing light lifecycle hash rejected");
  await writeFile(resolve(fixture, manifestPath), manifestText);
  const lightRuntimePath = resolve(fixture, "docs/air/light-runtime.mjs");
  const lightRuntime = await readFile(lightRuntimePath, "utf8");
  await writeFile(lightRuntimePath, lightRuntime + "\n// changed lifecycle\n");
  assert.notEqual(verify().status, 0, "Altered light lifecycle must fail");
  checks.push("altered light lifecycle rejected");
  await writeFile(lightRuntimePath, lightRuntime);

  const canonicalProbe = resolve(fixture, "design/air/contract.md");
  await mkdir(dirname(canonicalProbe), { recursive: true });
  await writeFile(canonicalProbe, "Deliberately unsynchronized canonical contract.\n");
  const staleSource = verify();
  assert.notEqual(staleSource.status, 0);
  assert.match(staleSource.stderr, /Canonical Air contract differs from DESIGN.md/);
  checks.push("unsynchronized canonical source rejected when present");
  await rm(resolve(fixture, "design"), { recursive: true });

  const wrongSource = structuredClone(manifest);
  wrongSource.source.contractSha256 = "0".repeat(64);
  await writeFile(resolve(fixture, manifestPath), JSON.stringify(wrongSource));
  const sourceDrift = verify();
  assert.notEqual(sourceDrift.status, 0);
  assert.match(sourceDrift.stderr, /Air bundle provenance does not match/);
  checks.push("bundle paired with a different contract rejected");
  await writeFile(resolve(fixture, manifestPath), manifestText);

  const designPath = resolve(fixture, "DESIGN.md");
  const design = await readFile(designPath, "utf8");
  await writeFile(designPath, design.replace(/^version: .+$/m, "version: 0.0.0-probe"));
  const versionDrift = verify();
  assert.notEqual(versionDrift.status, 0);
  assert.match(versionDrift.stderr, /Bundle and DESIGN.md contract versions differ/);
  checks.push("mismatched document version rejected");
  await writeFile(designPath, design);

  const withoutMotion = structuredClone(manifest);
  delete withoutMotion.studyAssets["motion.mjs"];
  await writeFile(resolve(fixture, manifestPath), JSON.stringify(withoutMotion));
  const missingHash = verify();
  assert.notEqual(missingHash.status, 0);
  assert.match(missingHash.stderr, /Missing Air study asset hash: motion\.mjs/);
  checks.push("missing motion hash rejected");
  await writeFile(resolve(fixture, manifestPath), manifestText);

  const motionPath = resolve(fixture, "docs/air/motion.mjs");
  const motion = await readFile(motionPath, "utf8");
  await writeFile(motionPath, `${motion}\n// Deliberate portability-test drift.\n`);
  const drift = verify();
  assert.notEqual(drift.status, 0);
  assert.match(drift.stderr, /Air study asset drift: motion\.mjs/);
  checks.push("altered motion module rejected");
  await writeFile(motionPath, motion);

  const withoutNotice = structuredClone(manifest);
  delete withoutNotice.studyAssets["update-notice.tsx"];
  await writeFile(resolve(fixture, manifestPath), JSON.stringify(withoutNotice));
  const missingNotice = verify();
  assert.notEqual(missingNotice.status, 0);
  assert.match(missingNotice.stderr, /Missing Air study asset hash: update-notice\.tsx/);
  checks.push("missing shared update notice rejected");
  await writeFile(resolve(fixture, manifestPath), manifestText);
  const noticePath = resolve(fixture, "docs/air/update-notice.tsx");
  const notice = await readFile(noticePath, "utf8");
  await writeFile(noticePath, `${notice}\n// Deliberate shared-notice drift.\n`);
  const noticeDrift = verify();
  assert.notEqual(noticeDrift.status, 0);
  assert.match(noticeDrift.stderr, /Air study asset drift: update-notice\.tsx/);
  checks.push("altered shared update notice rejected");
  await writeFile(noticePath, notice);

  const colourPath = resolve(fixture, "docs/air/colour.mjs");
  const colour = await readFile(colourPath, "utf8");
  await writeFile(colourPath, `${colour}\n// Deliberate colour-math drift.\n`);
  const colourDrift = verify();
  assert.notEqual(colourDrift.status, 0);
  assert.match(colourDrift.stderr, /Air study asset drift: colour\.mjs/);
  checks.push("altered colour math rejected");
  await writeFile(colourPath, colour);

  const withoutOverlays = structuredClone(manifest);
  delete withoutOverlays.studyAssets["assets/air-overlays.js"];
  await writeFile(resolve(fixture, manifestPath), JSON.stringify(withoutOverlays));
  const missingOverlayHash = verify();
  assert.notEqual(missingOverlayHash.status, 0);
  assert.match(missingOverlayHash.stderr, /Missing Air study asset hash: assets\/air-overlays\.js/);
  checks.push("missing overlay bundle hash rejected");
  await writeFile(resolve(fixture, manifestPath), manifestText);

  const overlayPath = resolve(fixture, "docs/air/assets/air-overlays.js");
  const overlay = await readFile(overlayPath, "utf8");
  await writeFile(overlayPath, `${overlay}\n// Deliberate portability-test drift.\n`);
  const overlayDrift = verify();
  assert.notEqual(overlayDrift.status, 0);
  assert.match(overlayDrift.stderr, /Air study asset drift: assets\/air-overlays\.js/);
  checks.push("altered overlay module rejected");
  await writeFile(overlayPath, overlay);

  const artworkPath = resolve(fixture, "docs/air/artwork.mjs");
  const artwork = await readFile(artworkPath, "utf8");
  await writeFile(artworkPath, `${artwork}\n// Deliberate portability-test drift.\n`);
  const artworkDrift = verify();
  assert.notEqual(artworkDrift.status, 0);
  assert.match(artworkDrift.stderr, /Air study asset drift: artwork\.mjs/);
  checks.push("altered artwork lifecycle rejected");
  await writeFile(artworkPath, artwork);

  const withoutArtwork = structuredClone(manifest);
  delete withoutArtwork.studyAssets["artwork.mjs"];
  await writeFile(resolve(fixture, manifestPath), JSON.stringify(withoutArtwork));
  const missingArtwork = verify();
  assert.notEqual(missingArtwork.status, 0);
  assert.match(missingArtwork.stderr, /Missing Air study asset hash: artwork\.mjs/);
  checks.push("missing artwork lifecycle hash rejected");
  await writeFile(resolve(fixture, manifestPath), manifestText);

  const withoutPages = structuredClone(manifest);
  delete withoutPages.studyAssets["pages.mjs"];
  await writeFile(resolve(fixture, manifestPath), JSON.stringify(withoutPages));
  const missingPagesHash = verify();
  assert.notEqual(missingPagesHash.status, 0);
  assert.match(missingPagesHash.stderr, /Missing Air study asset hash: pages\.mjs/);
  checks.push("missing reading/recovery behavior hash rejected");
  await writeFile(resolve(fixture, manifestPath), manifestText);

  const readingPath = resolve(fixture, "docs/air/reading.html");
  const reading = await readFile(readingPath, "utf8");
  await writeFile(readingPath, `${reading}\n<!-- Deliberate portability-test drift. -->\n`);
  const readingDrift = verify();
  assert.notEqual(readingDrift.status, 0);
  assert.match(readingDrift.stderr, /Air study asset drift: reading\.html/);
  checks.push("altered reading page rejected");
  await writeFile(readingPath, reading);

  const withoutFiles = structuredClone(manifest);
  delete withoutFiles.studyAssets["files.mjs"];
  await writeFile(resolve(fixture, manifestPath), JSON.stringify(withoutFiles));
  const missingFilesHash = verify();
  assert.notEqual(missingFilesHash.status, 0);
  assert.match(missingFilesHash.stderr, /Missing Air study asset hash: files\.mjs/);
  checks.push("missing file lifecycle behavior hash rejected");
  await writeFile(resolve(fixture, manifestPath), manifestText);

  const filesPath = resolve(fixture, "docs/air/files.html");
  const filePage = await readFile(filesPath, "utf8");
  await writeFile(filesPath, `${filePage}\n<!-- Deliberate portability-test drift. -->\n`);
  const filePageDrift = verify();
  assert.notEqual(filePageDrift.status, 0);
  assert.match(filePageDrift.stderr, /Air study asset drift: files\.html/);
  checks.push("altered file study rejected");
  await writeFile(filesPath, filePage);

  const collectionsPath = resolve(fixture, "docs/air/collections.html");
  const collectionsPage = await readFile(collectionsPath, "utf8");
  await writeFile(
    collectionsPath,
    `${collectionsPage}\n<!-- Deliberate portability-test drift. -->\n`,
  );
  const collectionsDrift = verify();
  assert.notEqual(collectionsDrift.status, 0);
  assert.match(collectionsDrift.stderr, /Air study asset drift: collections\.html/);
  checks.push("altered collection study rejected");
  await writeFile(collectionsPath, collectionsPage);

  await rm(resolve(fixture, manifestPath));
  const missingManifest = verify();
  assert.notEqual(missingManifest.status, 0);
  assert.match(missingManifest.stderr, /Missing portable Air bundle manifest/);
  checks.push("missing manifest rejected");
  await writeFile(resolve(fixture, manifestPath), manifestText);

  const restored = verify();
  assert.equal(restored.status, 0, restored.stderr);
  checks.push("restored bundle passes");
  console.log(
    JSON.stringify(
      {
        product: basename(source),
        checks,
        files: files.length,
        fixture: args.includes("--keep") ? fixture : null,
      },
      null,
      2,
    ),
  );
} finally {
  if (!args.includes("--keep")) await rm(fixture, { recursive: true });
}
