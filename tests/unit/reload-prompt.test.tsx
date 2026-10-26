import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vite-plus/test";
import { AirUpdateNotice } from "../../docs/air/update-notice.tsx";

function render(state: "update" | "offline" | "updating", blocked = false): string {
  return renderToStaticMarkup(
    <AirUpdateNotice
      state={state}
      blocked={blocked}
      detail={blocked ? "Save or download your work, then return home to update." : undefined}
      onClose={vi.fn()}
      onUpdate={vi.fn()}
      onPause={vi.fn()}
    />,
  );
}

describe("AirUpdateNotice", () => {
  it("offers an explicit update with one deferral action", () => {
    const html = render("update");
    expect(html).toContain("Update available");
    expect(html).toContain("Later");
    expect(html).toContain("Update and reload");
    expect(html).not.toContain('aria-label="Dismiss offline status"');
    expect(html.match(/<button /g)).toHaveLength(2);
  });
  it("announces and locks the updater without removing keyboard focus", () => {
    const html = render("updating");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Applying the new version.");
    expect(html).toContain("Updating…");
    expect(html.match(/aria-disabled="true"/g)).toHaveLength(2);
    expect(html).not.toContain(' disabled=""');
  });
  it("keeps cache feedback dismissible without claiming every feature is offline", () => {
    const html = render("offline");
    expect(html).toContain("Core app cached");
    expect(html).toContain("Some features may still need a connection.");
    expect(html).toContain('aria-label="Dismiss offline status"');
    expect(html).not.toContain("Later");
    expect(html.match(/<button /g)).toHaveLength(1);
  });
  it("explains how to finish work and keeps deferral available", () => {
    const html = render("update", true);
    expect(html).toContain("Save or download your work, then return home to update.");
    expect(html.match(/aria-disabled="true"/g)).toHaveLength(1);
    expect(html).toContain("aria-describedby=");
    expect(html).toContain("Later");
  });
});
