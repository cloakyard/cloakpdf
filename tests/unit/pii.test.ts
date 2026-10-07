/**
 * Unit tests for the shared PII detector.
 *
 * Covers each pattern, the Luhn gate on card numbers, overlap resolution,
 * offset accuracy, and the false-positive guards that matter for redaction
 * (a bare ID run must not be flagged as a phone; an email must not also be
 * reported as a date). Strings are drawn from the real résumé / invoice
 * fixtures so the detector is pinned against actual document shapes.
 */
import { describe, expect, it } from "vite-plus/test";
import { detectPii, EMAIL_RE, isLuhnValid, PHONE_RE, type PiiType } from "../../src/utils/pii.ts";

const typesOf = (text: string, types?: PiiType[]) =>
  detectPii(text, types ? { types } : undefined).map((m) => `${m.type}:${m.value}`);

describe("detectPii — emails", () => {
  it("finds every email with correct offsets", () => {
    const text = "Contact admin@slicedinvoices.com or test@test.com today";
    const hits = detectPii(text, { types: ["email"] });
    expect(hits.map((h) => h.value)).toEqual(["admin@slicedinvoices.com", "test@test.com"]);
    expect(text.slice(hits[0].start, hits[0].end)).toBe("admin@slicedinvoices.com");
  });
});

describe("detectPii — phones", () => {
  it("matches international and separated domestic numbers", () => {
    expect(typesOf("Call +91 98765 43210 now", ["phone"])).toEqual(["phone:+91 98765 43210"]);
    expect(typesOf("Tel (555) 123-4567", ["phone"])).toEqual(["phone:(555) 123-4567"]);
    expect(typesOf("ph 123-456-7890", ["phone"])).toEqual(["phone:123-456-7890"]);
  });

  it("does NOT flag a bare digit run (e.g. an order/ID number)", () => {
    expect(detectPii("Order Number 12345678", { types: ["phone"] })).toEqual([]);
  });

  it("does not trip on a date range with an en-dash", () => {
    expect(detectPii("Mar 2020 – Present", { types: ["phone"] })).toEqual([]);
  });

  it("ignores decimal amounts and other sub-7-digit groups (invoice noise)", () => {
    expect(detectPii("Total Due $93.50 and Sub Total $85.00", { types: ["phone"] })).toEqual([]);
    // but a real ≥7-digit grouped number (e.g. a bank account) is kept
    expect(typesOf("ACC # 1234 1234", ["phone"])).toEqual(["phone:1234 1234"]);
  });
});

describe("detectPii — URLs (web pages)", () => {
  it("matches http(s) and www. links", () => {
    expect(typesOf("see https://github.com/sumitsahoo here", ["url"])).toEqual([
      "url:https://github.com/sumitsahoo",
    ]);
    expect(typesOf("visit www.example.com today", ["url"])).toEqual(["url:www.example.com"]);
  });

  it("matches a bare domain.tld/path link (no scheme)", () => {
    expect(typesOf("portfolio github.com/sumitsahoo done", ["url"])).toEqual([
      "url:github.com/sumitsahoo",
    ]);
  });

  it("ignores file names, bare domains without a path, and email domains", () => {
    expect(detectPii("the file report.pdf is attached", { types: ["url"] })).toEqual([]);
    expect(detectPii("just example.com alone", { types: ["url"] })).toEqual([]);
    expect(detectPii("mail me at a@b.com", { types: ["url"] })).toEqual([]);
  });

  it("an email is reported as email, not url, when both could match", () => {
    const hits = detectPii("contact a.b@host.com now");
    expect(hits).toHaveLength(1);
    expect(hits[0].type).toBe("email");
  });
});

describe("detectPii — SSN", () => {
  it("matches dashed and spaced US SSNs", () => {
    expect(typesOf("SSN 123-45-6789", ["ssn"])).toEqual(["ssn:123-45-6789"]);
    expect(typesOf("ssn 123 45 6789", ["ssn"])).toEqual(["ssn:123 45 6789"]);
  });
});

describe("detectPii — credit cards (Luhn-gated)", () => {
  it("accepts a Luhn-valid number and rejects an invalid one", () => {
    expect(isLuhnValid("4111 1111 1111 1111")).toBe(true);
    expect(isLuhnValid("4111 1111 1111 1112")).toBe(false);
    expect(typesOf("Card 4111 1111 1111 1111", ["credit-card"])).toEqual([
      "credit-card:4111 1111 1111 1111",
    ]);
    expect(detectPii("Card 4111 1111 1111 1112", { types: ["credit-card"] })).toEqual([]);
  });
});

describe("detectPii — IBAN / IP / date", () => {
  it("matches an IBAN", () => {
    expect(typesOf("IBAN GB82 WEST 1234 5698 7654 32", ["iban"])[0]).toContain("iban:GB82");
  });

  it("matches IPv4 and IPv6", () => {
    expect(typesOf("from 192.168.1.254", ["ip"])).toEqual(["ip:192.168.1.254"]);
    expect(typesOf("v6 2001:0db8:85a3:0000:0000:8a2e:0370:7334", ["ip"])[0]).toContain("ip:2001");
  });

  it("rejects an out-of-range IPv4 octet", () => {
    expect(detectPii("999.1.1.1", { types: ["ip"] })).toEqual([]);
  });

  it("matches the invoice's month-name dates", () => {
    expect(typesOf("Invoice Date January 25, 2016", ["date"])).toEqual(["date:January 25, 2016"]);
    expect(typesOf("2016-01-31 is ISO", ["date"])).toEqual(["date:2016-01-31"]);
  });
});

describe("detectPii — overlap resolution", () => {
  it("reports an email once, not also as a date/phone fragment", () => {
    const hits = detectPii("ping bob2016@host.com");
    expect(hits.filter((h) => h.start < "ping bob2016@host.com".length)).toHaveLength(1);
    expect(hits[0].type).toBe("email");
  });

  it("prefers the more specific type when spans coincide", () => {
    // A Luhn-valid card is reported as credit-card, not phone, despite digits.
    const hits = detectPii("4111 1111 1111 1111");
    expect(hits).toHaveLength(1);
    expect(hits[0].type).toBe("credit-card");
  });

  it("returns matches sorted by position", () => {
    const text = "a@b.co then 192.168.0.1";
    const hits = detectPii(text);
    expect(hits.map((h) => h.type)).toEqual(["email", "ip"]);
    expect(hits[0].start).toBeLessThan(hits[1].start);
  });
});

describe("shared fast-path regexes (relocated, unchanged behaviour)", () => {
  it("EMAIL_RE / PHONE_RE are non-global first-match patterns", () => {
    expect(EMAIL_RE.global).toBe(false);
    expect(PHONE_RE.global).toBe(false);
    expect("reach me at a@b.com".match(EMAIL_RE)?.[0]).toBe("a@b.com");
    // bare 7+ digit run still matches the fast-path PHONE_RE (résumé contact use)
    expect(PHONE_RE.test("9876543")).toBe(true);
  });
});
