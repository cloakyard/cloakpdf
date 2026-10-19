import { useEffect, useState } from "react";
import type { EditorToolId } from "../tools.ts";
import { getPdfMetadata } from "../../utils/pdf-operations.ts";
import { useEditorActions, useEditorRead } from "../EditorContext.tsx";

export type TextOverlayContext = { bytes: Uint8Array; title: string; timestamp: number };

/** A title/clock snapshot belongs to exact bytes, never to a later tool visit. */
export function useTextOverlayContext(tool: EditorToolId, slice: Record<string, unknown>) {
  const { doc } = useEditorRead();
  const { patchToolState } = useEditorActions();
  const context = slice.context as TextOverlayContext | undefined;
  const initialized = !!slice.initialized;
  const bytes = doc?.bytes,
    fileName = doc?.fileName;
  const [attempt, setAttempt] = useState(0);
  const [readFailed, setReadFailed] = useState(false);
  useEffect(() => {
    if (!bytes || context?.bytes === bytes) return;
    let live = true;
    setReadFailed(false);
    const file = new File([bytes as Uint8Array<ArrayBuffer>], fileName ?? "document.pdf");
    void getPdfMetadata(file).then(
      (metadata) => {
        if (!live) return;
        patchToolState(tool, {
          context: { bytes, title: metadata.title, timestamp: Date.now() },
          ...(!initialized ? { initialized: true, sourceBytes: bytes } : {}),
        });
      },
      () => {
        if (live) setReadFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, [tool, bytes, fileName, attempt, initialized, patchToolState, context]);
  return {
    current: context?.bytes === bytes ? context : undefined,
    readFailed,
    retryRead: () => setAttempt((n) => n + 1),
  };
}
