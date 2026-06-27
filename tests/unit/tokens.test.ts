/**
 * Unit tests for the dynamic stamp-token resolver (tokens.ts).
 *
 * Pins the {page}/{total}/{title}/{filename} expansions, legacy `{{page}}`
 * compatibility, and that unknown braces are left untouched — the behaviour the
 * header/footer + watermark writers depend on to render per-page text in one
 * pass.
 */
import { describe, expect, it } from "vitest";
import { baseFileName, resolveStampTokens, type TokenContext } from "../../src/utils/pdf/tokens.ts";

const CTX: TokenContext = {
  page: 3,
  total: 10,
  title: "Quarterly Report",
  filename: "q3-report",
  date: new Date("2026-06-20T14:30:00"),
};

describe("resolveStampTokens", () => {
  it("expands {page} and {total}", () => {
    expect(resolveStampTokens("Page {page} of {total}", CTX)).toBe("Page 3 of 10");
  });

  it("stays compatible with the legacy {{page}} / {{total}}", () => {
    expect(resolveStampTokens("{{page}} / {{total}}", CTX)).toBe("3 / 10");
  });

  it("expands {title} and {filename}", () => {
    expect(resolveStampTokens("{title} — {filename}", CTX)).toBe("Quarterly Report — q3-report");
  });

  it("is case-insensitive and tolerates inner spaces", () => {
    expect(resolveStampTokens("{ PAGE } of {Total}", CTX)).toBe("3 of 10");
  });

  it("leaves unknown braces untouched", () => {
    expect(resolveStampTokens("Ref {clause} {page}", CTX)).toBe("Ref {clause} 3");
  });

  it("expands {date} to a non-empty localized string", () => {
    const out = resolveStampTokens("{date}", CTX);
    expect(out.length).toBeGreaterThan(0);
    expect(out).not.toContain("{date}");
  });
});

describe("baseFileName", () => {
  it("strips a trailing .pdf case-insensitively", () => {
    expect(baseFileName("Report.PDF")).toBe("Report");
    expect(baseFileName("a.b.pdf")).toBe("a.b");
    expect(baseFileName("noext")).toBe("noext");
  });
});
