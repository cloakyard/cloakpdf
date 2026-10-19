import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "../components/ActionButton.tsx";
import { AlertBox } from "../components/AlertBox.tsx";
import { FileDropZone } from "../components/FileDropZone.tsx";
import { FileQueue } from "../components/FileQueue.tsx";
import { ProgressBar } from "../components/ProgressBar.tsx";
import { SegmentedControl } from "../components/SegmentedControl.tsx";
import { useAsyncProcess } from "../hooks/useAsyncProcess.ts";
import { useFileQueue } from "../hooks/useFileQueue.ts";
import { downloadPdf } from "../utils/file-helpers.ts";
import { openEditorWithFile } from "../utils/nav.ts";
import { imagesToPdf } from "../utils/pdf-operations.ts";

export default function ImagesToPdf() {
  const queue = useFileQueue();
  const task = useAsyncProcess();
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "fit">("a4");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [completed, setCompleted] = useState<{
    input: typeof queue.displayed;
    pageSize: string;
  } | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const handleFiles = (files: File[]) => {
    if (task.processing) return;
    if (
      files.some(
        (file) =>
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
          !/\.(jpe?g|png|webp)$/i.test(file.name),
      )
    ) {
      task.setError("Choose JPEG, PNG or WebP images. Your existing image order has been kept.");
      return;
    }
    task.setError(null);
    queue.append(files);
  };
  const runConvert = async (edit: boolean) => {
    if (!queue.displayed.length) return;
    setCompleted(null);
    const input = queue.displayed;
    setProgress({ done: 0, total: input.length });
    await task.run(async () => {
      const bytes = await imagesToPdf(
        input.map((item) => item.file),
        pageSize,
        (done, total) => {
          if (alive.current) setProgress({ done, total });
        },
      );
      if (!alive.current) return;
      if (edit)
        openEditorWithFile(new File([bytes.slice()], "images.pdf", { type: "application/pdf" }));
      else {
        downloadPdf(bytes, "images.pdf");
        setCompleted({ input, pageSize });
      }
    }, "Failed to create PDF from images. Please try again.");
  };
  return (
    <div className="pdf-constructor">
      <FileDropZone
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        disabled={task.processing}
        onFiles={handleFiles}
        label="Drop images here"
        hint="Supports JPEG, PNG, and WebP images"
      />
      {queue.items.length > 0 && (
        <div className="pdf-page-size">
          <p className="air-label">Page size</p>
          <SegmentedControl
            fullWidth
            ariaLabel="Page size"
            value={pageSize}
            onChange={setPageSize}
            disabled={task.processing}
            options={[
              { value: "a4", label: "A4" },
              { value: "letter", label: "Letter" },
              { value: "fit", label: "Fit" },
            ]}
          />
        </div>
      )}
      <FileQueue queue={queue} disabled={task.processing} previews />
      {task.processing && (
        <ProgressBar current={progress.done} total={progress.total} label="Creating PDF…" />
      )}
      {queue.items.length > 0 && (
        <ActionButton
          onClick={() => runConvert(false)}
          processing={task.processing}
          label={
            queue.items.length === 1
              ? "Create PDF & Download"
              : `Combine ${queue.items.length} images & Download`
          }
          secondaryLabel={queue.items.length === 1 ? "Create & edit" : "Combine & edit"}
          onSecondaryClick={() => runConvert(true)}
          processingLabel="Creating PDF…"
        />
      )}
      {completed?.input === queue.displayed && completed.pageSize === pageSize && (
        <div className="air-notice air-notice--success pdf-result" role="status">
          <Check size={18} strokeWidth={1.6} aria-hidden="true" />
          <p>
            images.pdf is ready. Download requested. Your images remain here to combine again or
            open in the editor.
          </p>
        </div>
      )}
      {task.error && <AlertBox message={task.error} />}
    </div>
  );
}
