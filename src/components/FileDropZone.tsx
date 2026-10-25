/** Reusable local-file acquisition surface for every PDF workflow. */

import { ArrowRight, FileUp } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { EncryptedPdfNotice } from "./EncryptedPdfNotice.tsx";

interface FileDropZoneProps {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
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
  disabled = false,
  label = "Drop files here",
  hint,
  size = "default",
  encryptedFile = null,
  onClearEncrypted,
}: FileDropZoneProps) {
  const hero = size === "hero";
  const [isDragOver, setIsDragOver] = useState(false);
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const wasEncrypted = useRef(false);
  useEffect(() => {
    if (wasEncrypted.current && !encryptedFile) inputRef.current?.focus();
    wasEncrypted.current = Boolean(encryptedFile);
  }, [encryptedFile]);
  useEffect(() => {
    // Missing the acquisition target must not replace the app with a dropped
    // file. Text/link dragging keeps its normal browser behaviour.
    const preventFileNavigation = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    };
    document.addEventListener("dragover", preventFileNavigation);
    document.addEventListener("drop", preventFileNavigation);
    return () => {
      document.removeEventListener("dragover", preventFileNavigation);
      document.removeEventListener("drop", preventFileNavigation);
    };
  }, []);
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
      const files = Array.from(event.dataTransfer.files);
      if (!disabled && files.length > 0) onFiles(files);
    },
    [onFiles, disabled],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (!disabled && files.length > 0) onFiles(files);
      event.target.value = "";
    },
    [onFiles, disabled],
  );

  if (encryptedFile && onClearEncrypted) {
    return <EncryptedPdfNotice file={encryptedFile} onChangeFile={onClearEncrypted} />;
  }

  return (
    <label
      className={`air-file-drop pdf-file-drop ${hero ? "pdf-file-drop--hero" : ""}`}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        if (!disabled) setIsDragOver(true);
      }}
      onDragLeave={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          event.currentTarget.contains(event.relatedTarget)
        )
          return;
        setIsDragOver(false);
      }}
      onDrop={handleDrop}
      data-dragging={(!disabled && isDragOver) || undefined}
      data-disabled={disabled || undefined}
    >
      <input
        disabled={disabled}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        aria-label={label}
        aria-describedby={hintId}
      />
      {!hero && <FileUp className="pdf-file-icon" strokeWidth={1.5} aria-hidden="true" />}
      <span className="air-file-invitation">{isDragOver ? "Release to open" : label}</span>
      <span id={hintId} className="air-help">
        {hint ||
          `${multiple ? "Choose one or more files" : "Choose one file"}. ${accept.includes("image/") ? "Images" : "PDF"} opened on your device.`}
      </span>
      <span className="air-button air-button--primary pdf-file-browse" aria-hidden="true">
        Browse files <ArrowRight size={16} />
      </span>
    </label>
  );
}
