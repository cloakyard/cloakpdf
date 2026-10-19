import { mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vite-plus/test";
import { createEvidenceDirectory } from "../e2e/helpers/evidence-directory.ts";

const parents: string[] = [];
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  for (const parent of parents.splice(0)) rmSync(parent, { recursive: true, force: true });
});

it("isolates concurrent evidence runs with private permissions", () => {
  const parent = mkdtempSync(join(tmpdir(), "cloakpdf-evidence-test-"));
  parents.push(parent);
  vi.stubEnv("AIR_EVIDENCE_DIR", parent);
  vi.spyOn(console, "log").mockImplementation(() => {});
  const first = createEvidenceDirectory("audit");
  const second = createEvidenceDirectory("audit");
  expect(first).not.toBe(second);
  expect(first.startsWith(join(parent, "audit-"))).toBe(true);
  expect(statSync(first).mode & 0o777).toBe(0o700);
  writeFileSync(join(first, "result.json"), "first");
  writeFileSync(join(second, "result.json"), "second");
  expect(readFileSync(join(first, "result.json"), "utf8")).toBe("first");
});

it("never reuses a predictable evidence path or follows its symlink", () => {
  const parent = mkdtempSync(join(tmpdir(), "cloakpdf-evidence-test-"));
  parents.push(parent);
  vi.stubEnv("AIR_EVIDENCE_DIR", parent);
  vi.spyOn(console, "log").mockImplementation(() => {});
  const target = join(parent, "keep.txt");
  writeFileSync(target, "unchanged");
  symlinkSync(target, join(parent, "audit"));
  const directory = createEvidenceDirectory("audit");
  writeFileSync(join(directory, "result.json"), "new evidence");
  expect(readFileSync(target, "utf8")).toBe("unchanged");
});
