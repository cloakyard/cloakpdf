/**
 * Reusable drag-and-drop file input component.
 *
 * Supports both drag-over drop and traditional click-to-browse. Visual
 * feedback (border/background color change) is provided while a file
 * is being dragged over the zone. The hidden `<input>` is reset after
 * each selection so the same file can be picked again if needed.
 */

import { FileUp } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { categoryGlow } from "../config/theme.ts";
import { useSpotlightGlow } from "../hooks/useSpotlightGlow.ts";
import { EncryptedPdfNotice } from "./EncryptedPdfNotice.tsx";

interface FileDropZoneProps {
  /** MIME type filter for the hidden file input (e.g. ".pdf,application/pdf"). */
  accept: string;
  /** Whether to allow selecting multiple files at once. */
  multiple?: boolean;
  /** Callback invoked with the selected/dropped File objects. */
  onFiles: (files: File[]) => void;
  /** Primary label text shown in the drop zone. */
  label?: string;
  /** Optional secondary hint text below the label. */
  hint?: string;
  /**
   * Visual scale. "hero" is the larger, more prominent variant used as the
   * home-screen centerpiece (bigger padding, icon, and label); "default" is
   * the in-tool size. Same drag/click behaviour and design language either way.
   */
  size?: "default" | "hero";
  /**
   * CSS color for the cursor/touch spotlight glow (e.g. "rgba(37,99,235,0.18)").
   * Defaults to a neutral blue matching the primary palette.
   */
  glowColor?: string;
  /**
   * CSS color for the icon tint (e.g. "rgb(37,99,235)").
   * Should match the tool's category accent. Defaults to slate.
   */
  iconColor?: string;
  /**
   * When set, the dropzone is replaced with an `EncryptedPdfNotice`
   * pointing the user at the PDF Password tool. Wired from
   * `usePdfFile`'s `encryptedFile` so tools just forward the value;
   * setting it to `null` (the default) keeps the standard dropzone.
   */
  encryptedFile?: File | null;
  /**
   * Clear the encrypted-file state and return the dropzone (the
   * "Choose another file" button on the notice). Typically
   * `pdf.reset` from `usePdfFile`. Required when `encryptedFile` is
   * passed.
   */
  onClearEncrypted?: () => void;
}

export function FileDropZone({
  accept,
  multiple = false,
  onFiles,
  label = "Drop files here or click to browse",
  hint,
  size = "default",
  glowColor = categoryGlow.organise,
  iconColor,
  encryptedFile = null,
  onClearEncrypted,
}: FileDropZoneProps) {
  const hero = size === "hero";
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    ref: zoneRef,
    glowStyle,
    handlers: glowHandlers,
  } = useSpotlightGlow({
    color: glowColor,
    radius: 300,
  });

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [onFiles],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) onFiles(files);
      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [onFiles],
  );

  // The hook detected the user dropped an encrypted PDF — render the
  // notice (with a deep-link to PDF Password) in place of the dropzone.
  // Render only when the caller wired the clear callback, otherwise the
  // notice's "Choose another file" button would be a dead-end.
  if (encryptedFile && onClearEncrypted) {
    return <EncryptedPdfNotice file={encryptedFile} onChangeFile={onClearEncrypted} />;
  }

  return (
    <button
      type="button"
      ref={zoneRef}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      {...glowHandlers}
      style={{ touchAction: "manipulation" }}
      className={`group relative w-full overflow-hidden border-2 border-dashed text-center cursor-pointer
        ${hero ? "rounded-3xl p-8 sm:p-16" : "rounded-xl p-10"}
        transition-[border-color,background-color,transform] duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2
        ${
          isDragOver
            ? "border-primary-400 bg-primary-50/80 dark:bg-primary-900/40 scale-[1.005]"
            : "border-slate-300 dark:border-dark-border bg-white/70 dark:bg-dark-surface/70 hover:border-primary-300 hover:bg-white/90 dark:hover:bg-dark-surface/90 active:border-primary-300 active:bg-white/90 dark:active:bg-dark-surface/90"
        }`}
    >
      {/* Cursor / touch spotlight glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
        style={glowStyle}
      />

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        aria-label={label}
        className="hidden"
      />

      {/* Icon container */}
      <div
        className={`relative z-10 mx-auto mb-4 rounded-2xl flex items-center justify-center
          ${hero ? "w-20 h-20" : "w-16 h-16"}
          transition-[background-color,transform] duration-200
          motion-safe:group-hover:-translate-y-1 motion-safe:[&:has(~*)]:translate-y-0
          ${
            isDragOver
              ? "bg-primary-100 dark:bg-primary-900/50 motion-safe:-translate-y-1"
              : "bg-slate-100 dark:bg-dark-surface group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30"
          }`}
      >
        {/* Rests at full opacity in a muted slate (a dimmed icon reads
            disabled on the page's primary CTA); the accent colour arrives on
            hover/drag via a CSS variable so the inline `iconColor` doesn't
            override the resting class. */}
        <FileUp
          className={`${hero ? "w-10 h-10" : "w-8 h-8"} transition-colors duration-200 ${
            isDragOver
              ? iconColor
                ? "text-(--dz-accent)"
                : "text-primary-500"
              : `text-slate-400 dark:text-dark-text-muted ${
                  iconColor ? "group-hover:text-(--dz-accent)" : "group-hover:text-primary-400"
                }`
          }`}
          style={iconColor ? ({ "--dz-accent": iconColor } as React.CSSProperties) : undefined}
          strokeWidth={1.5}
        />
      </div>

      <p
        className={`relative z-10 font-semibold transition-colors duration-200 ${hero ? "text-lg sm:text-xl" : "font-medium"} ${isDragOver ? "text-primary-600 dark:text-primary-400" : "text-slate-700 dark:text-dark-text"}`}
      >
        {label}
      </p>
      {hint && (
        <p
          className={`relative z-10 text-slate-500 dark:text-dark-text-muted mt-1 ${hero ? "text-sm sm:text-card-title" : "text-sm"}`}
        >
          {hint}
        </p>
      )}
    </button>
  );
}
