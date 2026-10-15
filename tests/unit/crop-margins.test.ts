import { describe, expect, it } from "vite-plus/test";
import { cropMarginsFromRect, parseCropMargins } from "../../src/editor/crop.ts";
const zero = { top: "0", right: "0", bottom: "0", left: "0" };
describe("crop margin drafts", () => {
  it("does not turn blank or invalid text into a crop", () => {
    for (const value of ["", " ", "-1", "100", "NaN", "Infinity", "ten"])
      expect(parseCropMargins({ ...zero, top: value })).toMatchObject({
        keep: null,
        error: expect.any(String),
      });
  });
  it("requires a positive visible area on both axes", () => {
    expect(parseCropMargins({ ...zero, top: "50", bottom: "50" }).error).toContain("less than 100");
    expect(parseCropMargins({ ...zero, left: "60", right: "50" }).keep).toBeNull();
  });
  it("leaves a full frame unchanged and maps decimal margins to top-left geometry", () => {
    expect(parseCropMargins(zero)).toEqual({ keep: null, error: "" });
    const { keep, error } = parseCropMargins({ top: "10.5", right: "5", bottom: "20", left: "15" });
    expect(error).toBe("");
    expect(keep?.xPct).toBe(0.15);
    expect(keep?.yPct).toBe(0.105);
    expect(keep?.wPct).toBeCloseTo(0.8);
    expect(keep?.hPct).toBeCloseTo(0.695);
  });
  it("round-trips a pointer rectangle without negative floating-point edge margins", () => {
    const margins = cropMarginsFromRect({ xPct: 0.2, yPct: 0.1, wPct: 0.8, hPct: 0.7 });
    expect(margins).toEqual({ top: "10", right: "0", bottom: "20", left: "20" });
    expect(parseCropMargins(margins).keep?.wPct).toBeCloseTo(0.8);
  });
});
