// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, truncateSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vite-plus/test";

const script = fileURLToPath(new URL("../../scripts/check-deploy-assets.mjs", import.meta.url));
const directories: string[] = [];
const limit = 25 * 1024 * 1024;

function fixture(): string {
  const directory = mkdtempSync(join(tmpdir(), "cloakpdf-asset-limit-"));
  directories.push(directory);
  mkdirSync(join(directory, "assets"));
  return directory;
}

function run(directory: string): string {
  return execFileSync(process.execPath, [script, directory], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function sparseFile(path: string, bytes: number): void {
  writeFileSync(path, "");
  truncateSync(path, bytes);
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("Cloudflare deployment asset budget", () => {
  it("allows an asset exactly at the 25 MiB limit", () => {
    const directory = fixture();
    sparseFile(join(directory, "assets", "boundary.wasm"), limit);
    expect(run(directory)).toContain("1 files, all <= 25 MiB");
  });

  it("rejects oversized nested assets and names the offending file", () => {
    const directory = fixture();
    sparseFile(join(directory, "assets", "oversized.wasm"), limit + 1);
    expect(() => run(directory)).toThrow("assets/oversized.wasm");
  });

  it("fails when the build output is missing", () => {
    expect(() => run(join(fixture(), "missing-dist"))).toThrow("ENOENT");
  });
});
