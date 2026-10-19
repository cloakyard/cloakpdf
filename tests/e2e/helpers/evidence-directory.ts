import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Keep fixtures and diagnostics in a private, unique directory for each run. */
export function createEvidenceDirectory(prefix: string): string {
  const parent = process.env.AIR_EVIDENCE_DIR ?? tmpdir();
  mkdirSync(parent, { recursive: true });
  const directory = mkdtempSync(join(parent, `${prefix}-`));
  console.log(`Evidence: ${directory}`);
  return directory;
}
