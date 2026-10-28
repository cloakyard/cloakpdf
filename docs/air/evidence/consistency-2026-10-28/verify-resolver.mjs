import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve, dirname } from "node:path";
const req = createRequire(resolve(process.argv[2], "package.json"));
const pwa = createRequire(req.resolve("vite-plugin-pwa"));
const wb = createRequire(pwa.resolve("workbox-build"));
const path = wb.resolve("@rollup/plugin-node-resolve");
const cjs = wb("@rollup/plugin-node-resolve"),
  esm = await import(pathToFileURL(resolve(dirname(path), "../es/index.js")).href);
const defaults = {
  dedupe: [],
  extensions: [".mjs", ".js", ".json", ".node"],
  resolveOnly: [],
  moduleDirectories: ["node_modules"],
  modulePaths: [],
  ignoreSideEffectsForRoot: false,
  allowExportsFolderMapping: true,
};
for (const api of [cjs, esm]) {
  assert.deepEqual(api.DEFAULTS, defaults);
  assert(Object.isFrozen(api.DEFAULTS));
  for (const value of Object.values(api.DEFAULTS))
    if (Array.isArray(value)) assert(Object.isFrozen(value));
  assert.equal(api.nodeResolve().name, "node-resolve");
}
assert.throws(() => createRequire(path).resolve("deepmerge"), { code: "MODULE_NOT_FOUND" });
console.log("CJS/ESM resolver, immutable defaults and removed dependency pass");
