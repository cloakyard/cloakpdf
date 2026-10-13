import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const doc = await readFile(resolve(root, "DESIGN.md"), "utf8");
const expected = doc.match(/^family-contract-sha256: ([a-f0-9]{64})$/m)?.[1];
const sourceRepository = "https://github.com/cloakyard/cloakyard";
const contract = doc
  .split("<!-- BEGIN CLOAKYARD AIR CONTRACT -->")[1]
  ?.split("<!-- END CLOAKYARD AIR CONTRACT -->")[0]
  ?.trim();
const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};
const canonicalContract = await readFile(resolve(root, "design/air/contract.md"), "utf8").catch(
  (error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  },
);
const fromCanonical = canonicalContract !== null && canonicalContract.trim() === contract;
if (canonicalContract !== null && !fromCanonical)
  fail("Canonical Air contract differs from DESIGN.md; regenerate the bundle.");
if (!contract || !expected)
  fail("DESIGN.md is missing the portable Air contract or revision hash.");
else {
  const actual = createHash("sha256").update(contract).digest("hex");
  if (actual !== expected)
    fail("Air contract drift: update the family source and synchronized copies.");
  if (/\/(?:Users|home)\/[^\s/]+\//.test(doc))
    fail("DESIGN.md contains a non-portable machine path.");
}
if (
  !doc.includes(`source-repository: ${sourceRepository}\n`) ||
  !doc.includes("source-directory: design/air\n")
)
  fail("DESIGN.md must identify Cloakyard's canonical Air source.");
const inventory = JSON.parse(await readFile(resolve(root, "docs/air/surfaces.json"), "utf8"));
const names = inventory.surfaces.map((entry) => entry.path);
if (new Set(names).size !== names.length) fail("Duplicate entries in the Air surface inventory.");
for (const surface of inventory.surfaces) {
  if (surface.validated && (!surface.sourceReviewed || !surface.evidence.length)) {
    fail(`Validation needs source review and evidence: ${surface.path}`);
  }
}
const bundle = await readFile(resolve(root, "docs/air/bundle.json"), "utf8").catch(() => null);
if (!bundle) fail("Missing portable Air bundle manifest.");
else {
  const { stylesheet, sha256, version, source, studyAssets = {} } = JSON.parse(bundle);
  if (
    source?.repository !== sourceRepository ||
    source?.directory !== "design/air" ||
    source?.contractSha256 !== expected ||
    source?.status !== doc.match(/^status: (.+)$/m)?.[1]
  )
    fail("Air bundle provenance does not match the pinned family contract.");
  for (const asset of [
    "components.html",
    "reading.html",
    "recovery.html",
    "pages.mjs",
    "files.html",
    "files.mjs",
    "motion.mjs",
    "light-controller.mjs",
    "assets/air-light-shader.js",
    "assets/THIRD_PARTY_LICENSES.txt",
    "overlays-loader.mjs",
    "assets/air-overlays.js",
    "assets/OVERLAY_LICENSES.txt",
  ]) {
    if (!studyAssets[asset]) fail(`Missing Air study asset hash: ${asset}`);
  }
  for (const [asset, hash] of Object.entries(studyAssets)) {
    const content = await readFile(resolve(root, "docs/air", asset));
    if (createHash("sha256").update(content).digest("hex") !== hash)
      fail(`Air study asset drift: ${asset}`);
    if (fromCanonical) {
      let canonical = await readFile(resolve(root, "design/air", asset), "utf8");
      if (asset === "overlays-loader.mjs")
        canonical = canonical.replace(
          "__AIR_OVERLAY_REVISION__",
          studyAssets["assets/air-overlays.js"]?.slice(0, 12) ?? "missing",
        );
      if (["reading.html", "recovery.html", "files.html"].includes(asset))
        canonical = canonical
          .replace("__AIR_STYLESHEET__", `../../${stylesheet}?air=${sha256.slice(0, 12)}`)
          .replace("__AIR_PAGES_REVISION__", studyAssets["pages.mjs"]?.slice(0, 12) ?? "missing")
          .replace("__AIR_FILES_REVISION__", studyAssets["files.mjs"]?.slice(0, 12) ?? "missing");
      if (asset === "components.html")
        canonical = canonical
          .replace("__AIR_STYLESHEET__", `../../${stylesheet}?air=${sha256.slice(0, 12)}`)
          .replace(
            "__AIR_OVERLAY_LOADER_REVISION__",
            studyAssets["overlays-loader.mjs"]?.slice(0, 12) ?? "missing",
          );
      if (content.toString("utf8") !== canonical)
        fail(`Canonical Air study asset differs from its generated copy: ${asset}`);
    }
  }
  const css = await readFile(resolve(root, stylesheet), "utf8");
  if (fromCanonical && css !== (await readFile(resolve(root, "design/air/air.css"), "utf8")))
    fail("Canonical Air CSS differs from the generated bundle.");
  if (createHash("sha256").update(css).digest("hex") !== sha256) {
    fail("Family CSS drift: update the canonical bundle and synchronize all products.");
  }
  if (version !== inventory.contractVersion) fail("Bundle and inventory versions differ.");
  if (
    version !== doc.match(/^version: (.+)$/m)?.[1] ||
    version !== contract.match(/^Version: \*\*([0-9]+\.[0-9]+\.[0-9]+)/m)?.[1]
  )
    fail("Bundle and DESIGN.md contract versions differ.");
  const palette = [
    ...contract.matchAll(/^\| `([\w-]+)`\s*\|\s*`(#[a-f\d]{6})`\s*\|\s*`(#[a-f\d]{6})`/gm),
  ];
  if (palette.length !== 21) fail("The contract colour table is incomplete.");
  for (const [, token, light, dark] of palette) {
    const pair = css.match(
      new RegExp(`--air-${token}:\\s*light-dark\\((${"#[a-f\\d]{6}"}),\\s*(${"#[a-f\\d]{6}"})\\);`),
    );
    if (pair?.[1] !== light || pair?.[2] !== dark)
      fail(`CSS colours do not match DESIGN.md: --air-${token}`);
  }
  const scanRoot = await readdir(resolve(root, "src")).then(
    () => resolve(root, "src"),
    () => resolve(root, "apps/site/src"),
  );
  async function inspect(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await inspect(path);
      else if (/\.(css|tsx|astro)$/.test(entry.name) && path !== resolve(root, stylesheet)) {
        const source = await readFile(path, "utf8");
        if (/--air-[\w-]+\s*:/.test(source)) fail(`Family token override outside bundle: ${path}`);
      }
    }
  }
  await inspect(scanRoot);
  for (const surface of inventory.surfaces.filter(
    (item) =>
      item.airImplemented && item.kind !== "output-preservation" && item.path !== stylesheet,
  )) {
    const source = await readFile(resolve(root, surface.path), "utf8");
    // Functional visual data belongs in the documented output/template exceptions.
    // Enforce migrated UI sources now; pending legacy sources remain visible in the inventory.
    if (/font-weight:\s*[7-9]\d\d|\bfont-(?:bold|extrabold|black)\b/.test(source))
      fail(`Non-Air UI font weight: ${surface.path}`);
    if (/transition:\s*all\b|\btransition-all\b/.test(source))
      fail(`Unbounded UI transition: ${surface.path}`);
    if (/text-transform:\s*uppercase|\bclassName="[^"]*\buppercase\b/.test(source))
      fail(`Uppercase UI label: ${surface.path}`);
    if (/font-family:\s*["'](?:Archivo|JetBrains Mono)/.test(source))
      fail(`Legacy UI font: ${surface.path}`);
    if (surface.path.endsWith(".css")) {
      const declarations = source.replace(/\/\*[\s\S]*?\*\//g, "");
      if (/#[a-f\d]{3,8}\b|\b(?:oklch|oklab|rgb|rgba|hsl|hsla)\(/i.test(declarations))
        fail(`Literal UI colour outside the family bundle: ${surface.path}`);
      if (/border-radius:\s*(?!0(?:\s|;)|var\(|50%|100%|999px)[\d.]/.test(declarations))
        fail(`Arbitrary UI radius: ${surface.path}`);
    }
  }
}
if (!process.exitCode) {
  console.log(
    `Air contract and ${names.length} inventory records are valid. Runtime conformance is audited separately.`,
  );
}
