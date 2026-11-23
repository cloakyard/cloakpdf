import { existsSync, readFileSync } from "node:fs";
import { expect, it } from "vite-plus/test";

it("keeps the local entry points in package scripts runnable", () => {
  const root = new URL("../../", import.meta.url);
  const { scripts } = JSON.parse(readFileSync(new URL("package.json", root), "utf8")) as {
    scripts: Record<string, string>;
  };
  for (const [name, command] of Object.entries(scripts)) {
    for (const argument of command.split(/\s+/u)) {
      if (/^(?:tests|scripts|docs)\/.*\.(?:m?js|ts)$/u.test(argument)) {
        expect(existsSync(new URL(argument, root)), `${name} references ${argument}`).toBe(true);
      }
    }
  }
});
