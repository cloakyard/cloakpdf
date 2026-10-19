import { describe, expect, it } from "vite-plus/test";
import {
  HOME_CARD_TOOLS,
  categories,
  findTool,
  findToolComponent,
} from "../../src/config/tool-registry.ts";
import { EDITOR_TOOLS, EDITOR_TOOL_IDS } from "../../src/editor/tools.ts";

describe("tool routing boundaries", () => {
  it("keeps standalone/editor identities unique and categories reachable", () => {
    const ids = [...HOME_CARD_TOOLS, ...EDITOR_TOOLS].map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const tool of HOME_CARD_TOOLS) {
      expect(findTool(tool.id)).toBe(tool);
      expect(categories.some((category) => category.key === tool.category)).toBe(true);
      expect(EDITOR_TOOL_IDS.has(tool.id)).toBe(false);
    }
  });

  it("keeps every standalone implementation lazy", () => {
    for (const tool of HOME_CARD_TOOLS)
      expect(findToolComponent(tool.id)?.$$typeof).toBe(Symbol.for("react.lazy"));
  });

  it("rejects unknown, inherited and editor identities at the standalone boundary", () => {
    for (const id of ["", "missing", "constructor", "toString", "__proto__", ...EDITOR_TOOL_IDS]) {
      expect(findTool(id)).toBeNull();
      expect(findToolComponent(id)).toBeNull();
    }
  });
});
