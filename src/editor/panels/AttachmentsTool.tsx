// Immediate, undoable attachment actions; failed selections belong to exact bytes.
import { AlertTriangle, Paperclip, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatFileSize } from "../../utils/file-helpers.ts";
import {
  attachFilesToPdf,
  listPdfAttachments,
  type PdfAttachment,
  removeAttachmentsFromPdf,
} from "../../utils/pdf/attachments.ts";
import { docToFile, hasPendingDestructive } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";

const TOOL = "file-attachment";
export function Panel() {
  const { doc, busyLabel } = useEditorRead();
  const { applyTransform, patchToolState } = useEditorActions();
  const draft = useToolSlice(TOOL);
  const [report, setReport] = useState<{
    bytes: Uint8Array;
    items?: PdfAttachment[];
    failed?: boolean;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const applying = useRef(false);
  const bytes = doc?.bytes;
  const fileName = doc?.fileName;
  useEffect(() => {
    if (!bytes) return;
    let live = true;
    setReport(null);
    void listPdfAttachments(
      new File([bytes as Uint8Array<ArrayBuffer>], fileName ?? "document.pdf"),
    ).then(
      (items) => {
        if (live) setReport({ bytes, items });
      },
      () => {
        if (live) setReport({ bytes, failed: true });
      },
    );
    return () => {
      live = false;
    };
  }, [bytes, fileName, attempt]);
  const current = report?.bytes === bytes ? report : null;
  const files = draft.sourceBytes === bytes ? (draft.files as File[] | undefined) : undefined;
  const failed = draft.sourceBytes === bytes ? (draft.failed as string | undefined) : undefined;
  const busy = busyLabel !== null;
  const privacyMarks = !!doc && hasPendingDestructive(doc);
  const unavailable = busy || !current?.items || privacyMarks;
  const clear = () =>
    patchToolState(TOOL, { sourceBytes: undefined, files: undefined, failed: undefined });
  const run = async (selection?: File[], item?: PdfAttachment) => {
    if (unavailable || applying.current) return;
    if (selection) addRef.current?.focus();
    applying.current = true;
    patchToolState(TOOL, { sourceBytes: bytes, files: selection, failed: undefined });
    try {
      await applyTransform(async (d) => ({
        bytes: selection
          ? await attachFilesToPdf(docToFile(d), selection)
          : await removeAttachmentsFromPdf(docToFile(d), new Set([item!.id])),
        label: selection
          ? `Attach ${selection.length} file${selection.length === 1 ? "" : "s"}`
          : "Remove attachment",
      }));
      clear();
      addRef.current?.focus();
    } catch {
      // applyTransform reports the shared error; keep the local action recoverable.
      patchToolState(TOOL, {
        sourceBytes: bytes,
        files: selection,
        failed: selection
          ? "Couldn't attach these files. Your selection is kept for retry."
          : `Couldn't remove ${item!.name}. Your PDF is unchanged. Try its remove button again.`,
      });
    } finally {
      applying.current = false;
    }
  };
  return (
    <div className="pdf-mark-panel pdf-attachments-panel">
      <section aria-label="Attached files">
        <p>Keep supporting files inside your PDF. Each change can be undone.</p>
        <p
          role={current?.failed ? "alert" : "status"}
          className={current?.failed ? "air-notice air-notice--error" : "air-help"}
        >
          {current?.failed && <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />}
          <span>
            {current?.failed
              ? "Couldn't read attachments. Your PDF is unchanged. Try again."
              : !current
                ? "Reading attachments…"
                : current.items?.length === 0
                  ? "No files attached yet."
                  : ""}
          </span>
        </p>
        {(current?.failed || attempt > 0) && (
          <button
            type="button"
            className="air-button"
            aria-disabled={!current || busy}
            onClick={() => {
              if (current && !busy) setAttempt((n) => n + 1);
            }}
          >
            Read attachments again
          </button>
        )}
        {!!current?.items?.length && (
          <ul className="pdf-attachment-list">
            {current.items.map((item, index) => (
              <li key={item.id}>
                <Paperclip size={16} aria-hidden="true" />
                <div>
                  <p>{item.name}</p>
                  <span className="air-help">
                    {formatFileSize(item.size)} · File {index + 1}
                  </span>
                </div>
                <button
                  type="button"
                  className="air-button air-icon-button air-button--quiet"
                  aria-disabled={unavailable || !!files}
                  aria-label={`Remove file ${index + 1}: ${item.name}`}
                  onClick={(event) => {
                    event.currentTarget.focus();
                    if (!files) void run(undefined, item);
                  }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-label="Attach files">
        {privacyMarks && (
          <p className="air-notice air-notice--warning">
            Apply or clear pending redaction and erase marks before managing attachments.
          </p>
        )}
        {failed && (
          <p role="alert" className="air-notice air-notice--error">
            <AlertTriangle size={16} className="shrink-0" aria-hidden="true" />
            <span>{failed}</span>
          </p>
        )}
        {files && (
          <>
            <p className="air-label">Ready to retry</p>
            <ul className="pdf-attachment-selection">
              {files.map((file, index) => (
                <li key={index}>
                  {file.name}
                  <span className="air-help">{formatFileSize(file.size)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const selection = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (selection.length) void run(selection);
          }}
        />
        <button
          ref={addRef}
          data-busy-focus-fallback
          type="button"
          className="air-button air-button--primary"
          aria-disabled={unavailable}
          onClick={(event) => {
            event.currentTarget.focus();
            if (!unavailable) {
              if (files) void run(files);
              else fileRef.current?.click();
            }
          }}
        >
          <Plus size={16} aria-hidden="true" />
          {files ? "Retry attaching files" : "Attach files"}
        </button>
        {files && (
          <button
            type="button"
            className="air-button air-button--quiet"
            aria-disabled={busy}
            onClick={() => {
              if (!busy) {
                clear();
                addRef.current?.focus();
              }
            }}
          >
            Discard selection
          </button>
        )}
        <p className="air-help">Files stay on this device. Attaching adds their size to the PDF.</p>
      </section>
    </div>
  );
}
