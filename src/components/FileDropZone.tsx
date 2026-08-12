/** Reusable local-file acquisition surface for every PDF workflow. */

import { ArrowRight, FileUp } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { EncryptedPdfNotice } from "./EncryptedPdfNotice.tsx";

interface FileDropZoneProps {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
  size?: "default" | "hero";
  encryptedFile?: File | null;
  onClearEncrypted?: () => void;
}

export function FileDropZone({
  accept,
  multiple = false,
  onFiles,
  label = "Drop files here",
  hint,
  size = "default",
  encryptedFile = null,
  onClearEncrypted,
}: FileDropZoneProps) {
  const hero = size === "hero";
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [onFiles],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (files.length > 0) onFiles(files);
      event.target.value = "";
    },
    [onFiles],
  );

  if (encryptedFile && onClearEncrypted) {
    return <EncryptedPdfNotice file={encryptedFile} onChangeFile={onClearEncrypted} />;
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      data-dragging={isDragOver}
      style={{ touchAction: "manipulation" }}
      className={`cloak-dropzone ${hero ? "cloak-dropzone--hero" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        aria-label={label}
        className="absolute inset-0 z-20 size-full cursor-pointer opacity-0"
      />

      <span className="cloak-dropzone__bar">
        <span>Local input / {multiple ? "multiple files" : "one document"}</span>
        <span>{isDragOver ? "Release to open" : "No upload route"}</span>
      </span>

      <span className="cloak-dropzone__body">
        <FileUp
          className={`cloak-dropzone__icon ${hero ? "size-9" : "size-7"} shrink-0 text-primary-600`}
          strokeWidth={1.6}
          aria-hidden="true"
        />
        <span className="min-w-0">
          <span
            className={`${hero ? "text-xl sm:text-2xl" : "text-lg"} block font-semibold tracking-[-0.025em] text-[var(--color-ink)]`}
          >
            {label}
          </span>
          {hint && (
            <span className="mt-2 block text-sm leading-relaxed text-[var(--color-ink-3)]">
              {hint}
            </span>
          )}
        </span>
        <span className="cloak-solid-link cloak-dropzone__action">
          Browse <ArrowRight className="cloak-link-arrow size-3.5" aria-hidden="true" />
        </span>
      </span>
    </label>
  );
}
