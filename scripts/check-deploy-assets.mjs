import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Validate the actual output, including copied public/ assets, before CI
// reaches Wrangler's upload step. Do not hide or delete oversized files.
const root = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL("../dist/", import.meta.url));
const maxBytes = 25 * 1024 * 1024;
const oversized = [];
let count = 0;

function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      inspect(path);
    } else {
      const size = statSync(path).size;
      count += 1;
      if (size > maxBytes) {
        oversized.push(`${relative(root, path)} (${size} bytes)`);
      }
    }
  }
}

inspect(root);
// Validate generated metadata against shipped bytes, not source declarations alone.
const manifest = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
for (const asset of [...manifest.icons, ...manifest.screenshots]) {
  const image = await sharp(join(root, asset.src)).metadata();
  assert.equal(asset.type, `image/${image.format}`, `Manifest media type: ${asset.src}`);
  assert.equal(asset.sizes, `${image.width}x${image.height}`, `Manifest dimensions: ${asset.src}`);
  if (asset.form_factor) {
    assert.ok(asset.label?.trim(), `Screenshot needs a descriptive label: ${asset.src}`);
    assert.equal(asset.form_factor, image.width > image.height ? "wide" : "narrow");
  }
}
const social = await sharp(join(root, "icons/og-image.png")).metadata();
assert.equal(`${social.width}x${social.height}`, "1200x630", "Social card dimensions");
console.log("Manifest icons/screenshots and social card match shipped image dimensions.");
if (oversized.length > 0) {
  console.error(`Cloudflare's 25 MiB per-asset limit exceeded:\n${oversized.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Deployment asset check passed: ${count} files, all <= 25 MiB.`);
}
