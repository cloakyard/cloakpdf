import { describe, expect, it } from "vite-plus/test";
import { signatureRect } from "../../src/editor/signature.ts";

describe("signature placement", () => {
  it("keeps wide and tall images inside every corner without stretching", () => {
    for (const page of [
      { widthPt: 400, heightPt: 600 },
      { widthPt: 600, heightPt: 400 },
    ]) {
      for (const aspect of [0.02, 0.5, 2, 80]) {
        for (const [x, y] of [
          [0, 0],
          [1, 1],
          [0.5, 0.5],
        ]) {
          const r = signatureRect(aspect, page, x, y);
          expect(r.xPct).toBeGreaterThanOrEqual(0);
          expect(r.yPct).toBeGreaterThanOrEqual(0);
          expect(r.xPct + r.wPct).toBeLessThanOrEqual(1);
          expect(r.yPct + r.hPct).toBeLessThanOrEqual(1);
          expect((r.wPct * page.widthPt) / (r.hPct * page.heightPt)).toBeCloseTo(aspect);
        }
      }
    }
  });
});
