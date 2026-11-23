import { useCallback } from "react";
import type { LinkAnnotation } from "../../utils/pdf/annotate.ts";
import type { LinkRegion } from "../../utils/pdf/links.ts";
import type { FracRect } from "../../utils/text-select.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { isLinkObject } from "../link-regions.ts";
import type { PdfStageProps } from "../stage.tsx";
import { RegionStage } from "../RegionStage.tsx";
import { usePageText } from "../usePageText.ts";

const TOOL = "annotate-pdf";
type Placement = { bytes: Uint8Array } & ({ source: LinkRegion } | { editingId: string });

function usePlacement() {
  const { doc, selectedPage, busyLabel } = useEditorRead();
  const stored = useToolSlice(TOOL).linkPlacement as Placement | undefined;
  const current = doc && stored?.bytes === doc.bytes ? stored : undefined;
  const object =
    current && "editingId" in current
      ? doc?.objects.find((item) => item.id === current.editingId)
      : undefined;
  const editing = object && isLinkObject(object) ? object : undefined;
  const source = editing
    ? {
        pageIndex: editing.pageIndex,
        rect: {
          xPct: editing.payload.x,
          yPct: editing.payload.y,
          wPct: editing.payload.w,
          hPct: editing.payload.h,
        },
      }
    : current && "source" in current
      ? current.source
      : undefined;
  return { doc, selectedPage, busy: !!busyLabel, source, editing };
}

export function DetailLinkStage({ paintMarks }: { paintMarks: PdfStageProps["paintOverlay"] }) {
  const { doc, selectedPage, busy, source, editing } = usePlacement();
  const { patchToolState, addObject, moveObject, setSelectedPage } = useEditorActions();
  const page = usePageText(!source);
  const place = useCallback(
    (rect: FracRect) => {
      if (!doc || busy) return;
      const region = { pageIndex: selectedPage, rect };
      if (!source) {
        patchToolState(TOOL, {
          linkPlacement: { bytes: doc.bytes, source: region } satisfies Placement,
        });
        return;
      }
      let id: string;
      if (editing) {
        id = editing.id;
        moveObject(
          id,
          { payload: { ...editing.payload, target: region } },
          "Change link destination",
          editing.payload,
        );
      } else {
        const payload: LinkAnnotation = {
          kind: "link",
          pageIndex: source.pageIndex,
          x: source.rect.xPct,
          y: source.rect.yPct,
          w: source.rect.wPct,
          h: source.rect.hPct,
          target: region,
        };
        id = addObject({ kind: "annotation", pageIndex: source.pageIndex, payload });
      }
      setSelectedPage(source.pageIndex);
      patchToolState(TOOL, { mode: "select", selectedId: id, linkPlacement: undefined });
    },
    [
      doc,
      selectedPage,
      busy,
      source,
      editing,
      patchToolState,
      addObject,
      moveObject,
      setSelectedPage,
    ],
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
  const area = [editing?.payload.target, source].find((r) => r?.pageIndex === selectedPage)?.rect;
  return (
    <RegionStage
      paintUnderlay={paintMarks}
      key={(source ? "target" : "source") + selectedPage}
      revision={doc?.bytes}
      area={area}
      onBox={place}
      onTap={source ? undefined : tapText}
      busy={busy}
    />
  );
}

export function DetailLinkPanel({ onBack }: { onBack: (editing: boolean) => void }) {
  const { busy, source, editing } = usePlacement();
  const { patchToolState, setSelectedPage } = useEditorActions();
  return (
    <div className="pdf-mark-panel pdf-detail-link">
      <section aria-label="Link to a detail">
        <p role="status" className="air-label">
          {source ? "Choose the detail" : "Choose the reference"}
        </p>
        <p className="air-help">
          {source
            ? "Go to the detail’s page. Draw a box or tap opposite corners to set the destination."
            : "Tap the reference text, draw a box, or tap two opposite corners around the clickable area."}
        </p>
        {source && <p className="air-help">Reference on page {source.pageIndex + 1}</p>}
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
            onBack(!!editing);
            if (source) setSelectedPage(source.pageIndex);
            patchToolState(TOOL, {
              mode: "select",
              selectedId: editing?.id,
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
