import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActionButton } from "../components/ActionButton.tsx";
import { AlertBox } from "../components/AlertBox.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { FileQueue } from "../components/FileQueue.tsx";
import { useAsyncProcess } from "../hooks/useAsyncProcess.ts";
import { useFileQueue } from "../hooks/useFileQueue.ts";
import { downloadPdf } from "../utils/file-helpers.ts";
import { openEditorWithFile } from "../utils/nav.ts";
import { mergePdfs } from "../utils/pdf-operations.ts";
import { isPdfEncrypted } from "../utils/pdf-security.ts";

export default function MergePdf() {
  const queue = useFileQueue();
  const task = useAsyncProcess();
  const [encryptedFile, setEncryptedFile] = useState<File | null>(null);
  const [checking, setChecking] = useState(false);
  const [completed, setCompleted] = useState<typeof queue.displayed | null>(null);
  const alive = useRef(true);
  const accepting = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const handleFiles = async (files: File[]) => {
    if (task.processing || accepting.current) return;
    if (files.some((file) => file.type !== "application/pdf" && !/\.pdf$/i.test(file.name))) {
      task.setError("Choose PDF files only. Your existing file order has been kept.");
      return;
    }
    accepting.current = true;
    setChecking(true);
    task.setError(null);
    try {
      for (const file of files) {
        if (await isPdfEncrypted(file)) {
          if (alive.current) setEncryptedFile(file);
          return;
        }
      }
      if (alive.current) {
        setEncryptedFile(null);
        queue.append(files);
      }
    } catch {
      if (alive.current)
        task.setError(
          "Couldn’t read these PDFs. Choose valid PDF files and try again; your file order has been kept.",
        );
    } finally {
      accepting.current = false;
      if (alive.current) setChecking(false);
    }
  };
  const clearEncrypted = useCallback(() => setEncryptedFile(null), []);
  const runMerge = async (edit: boolean) => {
    if (queue.displayed.length < 2 || accepting.current) return;
    setCompleted(null);
    const input = queue.displayed;
    await task.run(async () => {
      const bytes = await mergePdfs(input.map((item) => item.file));
      if (!alive.current) return;
      if (edit)
        openEditorWithFile(new File([bytes.slice()], "merged.pdf", { type: "application/pdf" }));
      else {
        downloadPdf(bytes, "merged.pdf");
        setCompleted(input);
      }
    }, "Failed to merge PDFs. Please check your files and try again.");
  };
  return (
    <div className="pdf-constructor">
      <FileDropZone
        accept=".pdf,application/pdf"
        multiple
        onFiles={handleFiles}
        disabled={checking || task.processing}
        encryptedFile={encryptedFile}
        onClearEncrypted={clearEncrypted}
        label="Drop PDF files here"
        hint="Select 2 or more PDF files to merge"
      />
      <span className="sr-only" role="status">
        {checking ? "Checking PDF files…" : ""}
      </span>
      <FileQueue queue={queue} disabled={checking || task.processing} />
      {queue.displayed.length > 0 && (
        <ActionButton
          onClick={() => runMerge(false)}
          processing={task.processing}
          disabled={checking || queue.displayed.length < 2}
          label={`Merge ${queue.displayed.length} files & Download`}
          processingLabel="Merging…"
          secondaryLabel="Merge & edit"
          onSecondaryClick={() => runMerge(true)}
        />
      )}
      {queue.displayed.length === 1 && (
        <p className="air-help">Add one more PDF to merge these files.</p>
      )}
      {completed === queue.displayed && (
        <div className="air-notice air-notice--success pdf-result" role="status">
          <Check size={18} strokeWidth={1.6} aria-hidden="true" />
          <p>
            merged.pdf is ready. Download requested. Your files remain here to combine again or open
            in the editor.
          </p>
        </div>
      )}
      {task.error && <AlertBox message={task.error} />}
    </div>
  );
}
