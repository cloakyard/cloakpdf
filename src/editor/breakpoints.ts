import type { Layout } from "./types";

// Air's shared widths. A short, sub-tablet landscape gets the working sheet;
// ordinary 720px-high laptops keep their rail and inspector.
export function detectLayout(width: number, height: number): Layout {
  if (width < 768 || (width < 1024 && height < 500)) return "mobile";
  return width < 1024 ? "tablet" : "desktop";
}
