import { useCallback } from "react";
import type { LinkAnnotation } from "../../utils/pdf/annotate.ts";
import type { LinkRegion } from "../../utils/pdf/links.ts";
import type { FracRect } from "../../utils/text-select.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import type { PdfStageProps } from "../stage.tsx";
import { RegionStage } from "../RegionStage.tsx";
import { usePageText } from "../usePageText.ts";

const TOOL = "annotate-pdf";
interface Placement {
  bytes: Uint8Array;
  source: LinkRegion;
  editingId?: string;
}
function usePlacement() {
  const { doc, selectedPage, busyLabel } = useEditorRead();
  const stored = useToolSlice(TOOL).linkPlacement as Placement | undefined;
  const placement =
    stored?.bytes === doc?.bytes &&
    (!stored?.editingId || doc?.objects.some((o) => o.id === stored.editingId))
      ? stored
      : undefined;
  return { doc, selectedPage, busy: !!busyLabel, placement };
}

export function DetailLinkStage({ paintMarks }: { paintMarks: PdfStageProps["paintOverlay"] }) {
  const { doc, selectedPage, busy, placement } = usePlacement();
  const { patchToolState, addObject, moveObject, setSelectedPage } = useEditorActions();
  const page = usePageText(!placement);
  const place = useCallback(
    (rect: FracRect) => {
      if (!doc || busy) return;
      const region = { pageIndex: selectedPage, rect };
      if (!placement) {
        patchToolState(TOOL, {
          linkPlacement: { bytes: doc.bytes, source: region } satisfies Placement,
        });
        return;
      }
      const { source, editingId } = placement;
      const payload: LinkAnnotation = {
        kind: "link",
        pageIndex: source.pageIndex,
        x: source.rect.xPct,
        y: source.rect.yPct,
        w: source.rect.wPct,
        h: source.rect.hPct,
        target: region,
      };
      const id =
        editingId ?? addObject({ kind: "annotation", pageIndex: source.pageIndex, payload });
      if (editingId) moveObject(editingId, { payload }, "Change link destination");
      setSelectedPage(source.pageIndex);
      patchToolState(TOOL, { mode: "select", selectedId: id, linkPlacement: undefined });
    },
    [doc, selectedPage, busy, placement, patchToolState, addObject, moveObject, setSelectedPage],
  );
  const tapText = useCallback(
    (p: Pick<FracRect, "xPct" | "yPct">) => {
      const hit = page?.words.find(
        ({ rect: r }) =>
          p.xPct >= r.xPct &&
          p.xPct <= r.xPct + r.wPct &&
          p.yPct >= r.yPct &&
          p.yPct <= r.yPct + r.hPct,
      );
      if (!hit) return false;
      place(hit.rect);
      return true;
    },
    [page, place],
  );
  const oldTarget = placement?.editingId
    ? (
        doc?.objects.find((o) => o.id === placement.editingId)?.payload as
          | LinkAnnotation
          | undefined
      )?.target
    : undefined;
  const area = [oldTarget, placement?.source].find((r) => r?.pageIndex === selectedPage)?.rect;
  return (
    <RegionStage
      paintUnderlay={paintMarks}
      key={(placement ? "target" : "source") + selectedPage}
      revision={doc?.bytes}
      area={area}
      onBox={place}
      onTap={placement ? undefined : tapText}
      busy={busy}
    />
  );
}

export function DetailLinkPanel() {
  const { busy, placement } = usePlacement();
  const { patchToolState, setSelectedPage } = useEditorActions();
  return (
    <div className="pdf-mark-panel pdf-detail-link">
      <section aria-label="Link to a detail">
        <p role="status" className="air-label">
          {placement ? "Choose the detail" : "Choose the reference"}
        </p>
        <p className="air-help">
          {placement
            ? "Go to the detail’s page. Draw a box or tap opposite corners to set the destination."
            : "Tap the reference text, draw a box, or tap two opposite corners around the clickable area."}
        </p>
        {placement && (
          <p className="air-help">Reference on page {placement.source.pageIndex + 1}</p>
        )}
        <details className="pdf-selection-help">
          <summary>Keyboard placement</summary>
          <p className="air-help">
            Focus the page. Move with the arrow keys and press Enter at each corner. Hold Shift for
            larger steps.
          </p>
        </details>
        <button
          className="air-button air-button--quiet"
          type="button"
          disabled={busy}
          onClick={() => {
            if (placement) setSelectedPage(placement.source.pageIndex);
            patchToolState(TOOL, {
              mode: "select",
              selectedId: placement?.editingId,
              linkPlacement: undefined,
            });
          }}
        >
          Back to annotations
        </button>
      </section>
    </div>
  );
}
