/**
 * Unit tests for the shared PagePreviewNav stepper.
 *
 * The repo's Vitest runs in a Node environment (no jsdom / Testing
 * Library), so the component is exercised through react-dom/server's
 * renderToStaticMarkup and assertions are made against the emitted
 * HTML. This covers every branch the component has: the single-page
 * null gate, the disabled-at-both-ends guard (which is what actually
 * stops a user paging past the document — the internal Math clamp is a
 * belt-and-suspenders backstop), the page-count label, and the three
 * size / variant class selections.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PagePreviewNav } from "../../src/components/PagePreviewNav.tsx";

const noop = () => {};

/** Render the stepper to static HTML. */
function render(props: Parameters<typeof PagePreviewNav>[0]): string {
  return renderToStaticMarkup(createElement(PagePreviewNav, props));
}

/** Extract the opening `<button>` tag carrying the given aria-label. */
function buttonTag(html: string, ariaLabel: string): string {
  const match = html.match(new RegExp(`<button[^>]*aria-label="${ariaLabel}"[^>]*>`));
  return match ? match[0] : "";
}

/**
 * True when a button tag carries the real `disabled` HTML attribute.
 * Note: the className always contains the Tailwind `disabled:` variants,
 * so we must match the rendered boolean attribute (`disabled=""`), not a
 * bare "disabled" substring.
 */
function isDisabled(buttonHtml: string): boolean {
  return buttonHtml.includes('disabled=""');
}

describe("PagePreviewNav — visibility gate", () => {
  it("renders nothing for a single-page document", () => {
    expect(render({ page: 0, total: 1, onChange: noop })).toBe("");
  });

  it("renders nothing for an empty document", () => {
    expect(render({ page: 0, total: 0, onChange: noop })).toBe("");
  });

  it("renders the cluster once there is more than one page", () => {
    const html = render({ page: 0, total: 3, onChange: noop });
    expect(html).toContain('aria-label="Previous page"');
    expect(html).toContain('aria-label="Next page"');
    expect(html).toContain("1 / 3");
  });
});

describe("PagePreviewNav — disabled at the ends", () => {
  it("disables Previous (only) on the first page", () => {
    const html = render({ page: 0, total: 5, onChange: noop });
    expect(isDisabled(buttonTag(html, "Previous page"))).toBe(true);
    expect(isDisabled(buttonTag(html, "Next page"))).toBe(false);
  });

  it("disables Next (only) on the last page", () => {
    const html = render({ page: 4, total: 5, onChange: noop });
    expect(isDisabled(buttonTag(html, "Next page"))).toBe(true);
    expect(isDisabled(buttonTag(html, "Previous page"))).toBe(false);
  });

  it("enables both controls in the middle of the document", () => {
    const html = render({ page: 2, total: 5, onChange: noop });
    expect(isDisabled(buttonTag(html, "Previous page"))).toBe(false);
    expect(isDisabled(buttonTag(html, "Next page"))).toBe(false);
  });
});

describe("PagePreviewNav — label reflects the 1-based page", () => {
  it("shows the current page over the total", () => {
    expect(render({ page: 2, total: 9, onChange: noop })).toContain("3 / 9");
  });
});

describe("PagePreviewNav — size and variant", () => {
  it("uses compact padding for the default sm size, floored to 44px only on touch", () => {
    const tag = buttonTag(render({ page: 0, total: 3, onChange: noop }), "Previous page");
    expect(tag).toContain("p-1 ");
    // Compact on fine pointers; the 44px tap target only kicks in on coarse
    // (touch) pointers via the pointer-coarse: variant.
    expect(tag).toContain("pointer-coarse:min-w-11");
    expect(tag).toContain("pointer-coarse:min-h-11");
    // …but never an UNCONDITIONAL 44px min — that's the `size="touch"` variant.
    expect(tag).not.toContain("min-w-11 min-h-11");
  });

  it("uses 44px touch targets for size=touch", () => {
    const tag = buttonTag(
      render({ page: 0, total: 3, onChange: noop, size: "touch" }),
      "Previous page",
    );
    expect(tag).toContain("min-w-11");
    expect(tag).toContain("min-h-11");
  });

  it("uses the bordered treatment for variant=bordered", () => {
    const html = render({ page: 0, total: 3, onChange: noop, variant: "bordered" });
    expect(buttonTag(html, "Previous page")).toContain("rounded-lg border");
    // Centred, fixed-width count keeps the prominent pager from reflowing.
    expect(html).toContain("min-w-20");
  });
});
