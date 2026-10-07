import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
if (oversized.length > 0) {
  console.error(`Cloudflare's 25 MiB per-asset limit exceeded:\n${oversized.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Deployment asset check passed: ${count} files, all <= 25 MiB.`);
}
