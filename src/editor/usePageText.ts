import { useEffect } from "react";
import { extractPageTextGeometry } from "../utils/layout-extract.ts";
import { orderReading, type SelWord } from "../utils/text-select.ts";
import { docToFile, hasPendingDestructive } from "./doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "./EditorContext.tsx";

const TOOL = "select-text";
export interface TextPage {
  bytes: Uint8Array;
  pageIndex: number;
  words: SelWord[];
  touchWords?: SelWord[];
  rotation?: number;
  failed?: boolean;
}

export function useVisibleTextPage() {
  const { doc, selectedPage, busyLabel } = useEditorRead();
  const slice = useToolSlice(TOOL);
  const blocked = hasPendingDestructive(doc);
  const stored = slice.page as TextPage | undefined;
  const page =
    !blocked && stored?.bytes === doc?.bytes && stored?.pageIndex === selectedPage
      ? stored
      : undefined;
  return { doc, selectedPage, busy: busyLabel !== null, blocked, page, slice };
}

export function usePageText(enabled = true) {
  const { doc, selectedPage, blocked, page, slice } = useVisibleTextPage();
  const { patchToolState } = useEditorActions();
  const bytes = doc?.bytes;
  const retry = slice.retry;
  useEffect(() => {
    if (!enabled || !doc || blocked || page) return;
    let live = true;
    patchToolState(TOOL, { selection: undefined, capture: undefined });
    void extractPageTextGeometry(docToFile(doc), selectedPage + 1, { selectionBounds: true }).then(
      (layout) => {
        if (!live) return;
        const readWords = (items: NonNullable<typeof layout>["items"]) =>
          layout
            ? orderReading(
                items
                  .filter(
                    (item) =>
                      item.text.trim() &&
                      item.width > 0 &&
                      item.height > 0 &&
                      item.x < layout.width &&
                      item.y < layout.height &&
                      item.x + item.width > 0 &&
                      item.y + item.height > 0,
                  )
                  .map((item) => ({
                    text: item.text,
                    rect: {
                      xPct: Math.max(0, item.x) / layout.width,
                      yPct: Math.max(0, item.y) / layout.height,
                      wPct:
                        (Math.min(layout.width, item.x + item.width) - Math.max(0, item.x)) /
                        layout.width,
                      hPct:
                        (Math.min(layout.height, item.y + item.height) - Math.max(0, item.y)) /
                        layout.height,
                    },
                  })),
                layout.rotation,
              )
            : [];
        patchToolState(TOOL, {
          page: {
            bytes: doc.bytes,
            pageIndex: selectedPage,
            rotation: layout?.rotation,
            words: readWords(layout?.items ?? []),
            touchWords: readWords(layout?.selectionWords ?? layout?.items ?? []),
            failed: !layout,
          } satisfies TextPage,
        });
      },
      () => {
        if (live)
          patchToolState(TOOL, {
            page: {
              bytes: doc.bytes,
              pageIndex: selectedPage,
              words: [],
              failed: true,
            } satisfies TextPage,
          });
      },
    );
    return () => {
      live = false;
    };
    // Only byte/page changes or an explicit retry invalidate the text geometry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, bytes, selectedPage, blocked, retry, patchToolState]);

  return page;
}
