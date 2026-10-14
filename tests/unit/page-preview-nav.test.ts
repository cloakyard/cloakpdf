/** Page boundaries and accessible labels; visual geometry is browser-tested. */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
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
    expect(html).toContain("Page 1 of 3");
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
    expect(render({ page: 2, total: 9, onChange: noop })).toContain("Page 3 of 9");
  });

  it("uses a non-wrapping tight count in compact chrome", () => {
    const html = render({ page: 2, total: 9, onChange: noop, compact: true });
    expect(html).toContain("3/9");
    expect(html).toContain('aria-label="Page 3 of 9"');
  });
});
