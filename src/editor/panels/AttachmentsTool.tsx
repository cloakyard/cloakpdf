// AttachmentsTool.tsx — Manage files embedded in the PDF (the /EmbeddedFiles
// name tree). Lists current attachments on open, lets the user attach more
// files or remove existing ones; each action runs through applyTransform so it
// lands in history and re-reads the refreshed list. Panel-only (no canvas
// interaction); identical on desktop + mobile. Reuses the attach/list/remove
// pipeline the standalone File Attachment tool proved.

import { Paperclip, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatFileSize } from "../../utils/file-helpers.ts";
import {
  attachFilesToPdf,
  listPdfAttachments,
  type PdfAttachment,
  removeAttachmentsFromPdf,
} from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead } from "../EditorContext.tsx";

export function Panel() {
  const { doc, busyLabel } = useEditorRead();
  const { applyTransform } = useEditorActions();
  const [items, setItems] = useState<PdfAttachment[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // (Re)list attachments whenever the doc changes. `live` guards a stale result
  // and is StrictMode-safe (a ref guard would bail on the second mount).
  useEffect(() => {
    if (!doc) return;
    let live = true;
    void listPdfAttachments(docToFile(doc)).then(
      (list) => {
        if (live) setItems(list);
      },
      () => {
        if (live) setItems([]);
      },
    );
    return () => {
      live = false;
    };
  }, [doc]);

  const busy = busyLabel !== null;

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = [...files];
    void applyTransform(async (d) => ({
      bytes: await attachFilesToPdf(docToFile(d), list),
      label: `Attach ${list.length} file${list.length === 1 ? "" : "s"}`,
    }));
  };

  const removeOne = (name: string) =>
    void applyTransform(async (d) => ({
      bytes: await removeAttachmentsFromPdf(docToFile(d), new Set([name])),
      label: "Remove attachment",
    }));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500 dark:text-dark-text-muted">
        Embed files inside the PDF, or remove ones already attached.
      </p>

      {items === null ? (
        <p className="text-sm text-slate-500 dark:text-dark-text-muted">Reading attachments…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg bg-slate-50 dark:bg-dark-bg px-3 py-3 text-center text-xs text-slate-500 dark:text-dark-text-muted">
          No files attached yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((a) => (
            <li
              key={a.name}
              className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface px-2.5 py-2"
            >
              <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-dark-text">
                {a.name}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-dark-text-muted">
                {formatFileSize(a.size)}
              </span>
              <button
                type="button"
                onClick={() => removeOne(a.name)}
                disabled={busy}
                aria-label={`Remove ${a.name}`}
                className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-40 dark:hover:bg-dark-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 dark:border-dark-border px-3 py-3 text-sm text-slate-500 dark:text-dark-text-muted hover:border-primary-400 hover:text-primary-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <Plus className="h-4 w-4" />
        {busy ? "Working…" : "Attach files"}
      </button>
    </div>
  );
}
