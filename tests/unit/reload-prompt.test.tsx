import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ReloadNotice } from "../../src/components/ReloadPrompt.tsx";

function render(variant: "update" | "offline", updating = false): string {
  return renderToStaticMarkup(
    <ReloadNotice variant={variant} updating={updating} onClose={vi.fn()} onUpdate={vi.fn()} />,
  );
}

describe("ReloadNotice", () => {
  it("renders an update receipt with one deferral action", () => {
    const html = render("update");

    expect(html).toContain("System update");
    expect(html).toContain("Update CloakPDF");
    expect(html).toContain("Later");
    expect(html).toContain("Update now");
    expect(html).not.toContain('aria-label="Dismiss cache status"');
  });

  it("announces and locks the updater while the new build is applied", () => {
    const html = render("update", true);

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Applying update…");
    expect(html).toContain("Updating…");
    expect(html.match(/disabled=""/g)).toHaveLength(2);
  });

  it("keeps the offline-ready notice compact and dismissible", () => {
    const html = render("offline");

    expect(html).toContain("Offline support");
    expect(html).toContain("Core app cached");
    expect(html).toContain('aria-label="Dismiss cache status"');
    expect(html).not.toContain("Update now");
    expect(html).not.toContain("Later");
  });
});
