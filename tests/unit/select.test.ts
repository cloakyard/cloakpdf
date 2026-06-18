/**
 * Static-render contract for the custom Select dropdown.
 *
 * The repo's Vitest runs in a Node environment (no jsdom / Testing Library), so
 * the component is exercised through react-dom/server's renderToStaticMarkup —
 * which only ever renders the CLOSED trigger (the option list is portaled and
 * opens via client effects, untestable here). The interactive behaviour
 * (keyboard nav, portal placement, outside-close, type-ahead) is covered by the
 * live browser checks; this guards the render contract that everything else
 * builds on: the trigger is a `combobox`, it shows the selected option's label
 * (falling back to the placeholder), it reflects `disabled`, and — crucially —
 * it renders NO listbox while closed (the accidental-always-open regression).
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Select, type SelectOption } from "../../src/components/Select.tsx";

const OPTS: SelectOption<string>[] = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana" },
  { value: "c", label: "Cherry" },
];

const render = (props: Parameters<typeof Select<string>>[0]): string =>
  renderToStaticMarkup(createElement(Select<string>, props));

describe("Select (static render)", () => {
  it("renders a closed combobox with no listbox", () => {
    const html = render({ value: "a", options: OPTS, onChange: () => {} });
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-haspopup="listbox"');
    // The list is portaled and only mounts when open — never at rest.
    expect(html).not.toContain('role="listbox"');
    expect(html).not.toContain('role="option"');
  });

  it("shows the selected option's label", () => {
    const html = render({ value: "b", options: OPTS, onChange: () => {} });
    expect(html).toContain("Banana");
    expect(html).not.toContain("Apple");
  });

  it("falls back to the placeholder when the value matches no option", () => {
    const html = render({
      value: "",
      options: OPTS,
      onChange: () => {},
      placeholder: "— Select —",
    });
    expect(html).toContain("— Select —");
  });

  it("reflects the disabled state", () => {
    const html = render({ value: "a", options: OPTS, onChange: () => {}, disabled: true });
    expect(html).toContain("disabled");
  });

  it("applies the accessible name", () => {
    const html = render({ value: "a", options: OPTS, onChange: () => {}, ariaLabel: "Fruit" });
    expect(html).toContain('aria-label="Fruit"');
  });
});
