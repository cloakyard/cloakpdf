// PageThumb.tsx — The one place page previews get their aspect ratio. Two modes,
// one rule (never stretch the bitmap):
//
//   • Box mode (default) — an aspect-locked box (reserves the page's true shape
//     even before the bitmap loads) with an object-contain image inside. Use it
//     in a GRID where the cell width is known and the height should follow the
//     page aspect: the overview grid, organize board, N-up cells.
//   • Fit mode (`fit`) — just the image, sized with max-width/height + object-
//     contain so it grows to the largest copy that fits the parent while keeping
//     its real aspect, centred by the parent's flexbox. Use it when the page must
//     fit INSIDE a container whose height is set by something else (the OCR source
//     pane, beside a tall recognised-text column) — a forced box would take the
//     full column height and letterbox into the wrong shape.
//
// Pass `aspect` (box mode) to override the ratio, e.g. an N-up cell is the page
// aspect × rows/cols.

import { type CSSProperties } from "react";
import { FileImage } from "lucide-react";
import { useEditorActions } from "./EditorContext.tsx";
import type { PageMeta } from "./doc.ts";

export function PageThumb({
  page,
  alt,
  aspect,
  rotation = 0,
  fit = false,
  className = "",
  loading,
}: {
  page: Pick<PageMeta, "index" | "widthPt" | "heightPt" | "thumbUrl">;
  alt: string;
  /** Box aspect ratio override; defaults to the page's own width / height. */
  aspect?: number;
  /** Degrees to rotate the bitmap inside the box (organize preview). */
  rotation?: number;
  /** Fit-inside-parent mode: image sizes itself (max-w/h + object-contain),
   *  no aspect-locked box. The parent should centre it (e.g. flex + items-center). */
  fit?: boolean;
  /** Classes for the aspect-locked box (box mode) or the image (fit mode). */
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const { reportPreviewFailure } = useEditorActions();
  const thumbUrl = page.thumbUrl;
  const unavailable = !thumbUrl;
  const quarterTurn = Math.abs(rotation % 180) === 90;
  // Page metadata and PDF.js bitmap already include saved rotation. CSS adds
  // only the pending organize rotation.
  const baseRatio = page.widthPt / page.heightPt;
  const ratio = aspect ?? (quarterTurn ? 1 / baseRatio : baseRatio);
  const imgStyle: CSSProperties | undefined = rotation
    ? {
        position: "absolute",
        maxWidth: "none",
        left: "50%",
        top: "50%",
        width: quarterTurn ? `${100 / ratio}%` : "100%",
        height: quarterTurn ? `${100 * ratio}%` : "100%",
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }
    : undefined;
  const fallback = (
    <span
      className="editor-thumb-unavailable"
      role="img"
      aria-label={`${alt ? `${alt}: ` : ""}Preview unavailable`}
    >
      <FileImage size={20} aria-hidden="true" />
      <span>Preview unavailable</span>
    </span>
  );
  const image = (
    <img
      key={thumbUrl}
      src={thumbUrl ?? undefined}
      alt={alt}
      className={
        fit
          ? `max-h-full max-w-full object-contain ${className}`
          : "h-full w-full object-contain bg-white"
      }
      style={fit ? (rotation ? { transform: `rotate(${rotation}deg)` } : undefined) : imgStyle}
      draggable={false}
      loading={loading}
      onError={() => thumbUrl && reportPreviewFailure(page.index, thumbUrl)}
    />
  );

  if (fit) return unavailable ? fallback : image;
  return (
    <div
      className={`editor-page-thumb relative overflow-hidden bg-white ${className}`}
      style={{ aspectRatio: String(ratio) }}
    >
      {unavailable ? fallback : image}
    </div>
  );
}
