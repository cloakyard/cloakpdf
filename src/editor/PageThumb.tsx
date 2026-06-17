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

import type { CSSProperties } from "react";
import type { PageMeta } from "./doc.ts";

export function PageThumb({
  page,
  alt,
  aspect,
  rotation = 0,
  fit = false,
  className = "",
  imgClassName = "",
  loading,
}: {
  page: Pick<PageMeta, "widthPt" | "heightPt" | "thumbUrl">;
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
  /** Extra classes for the <img> on top of the shared object-contain base. */
  imgClassName?: string;
  loading?: "lazy" | "eager";
}) {
  const imgStyle: CSSProperties | undefined = rotation
    ? { transform: `rotate(${rotation}deg)` }
    : undefined;

  // Fit mode: the image alone, capped to the parent and never stretched. With no
  // explicit width/height the element box IS the bitmap (correct aspect), so the
  // page can't read as vertically stretched no matter how tall the parent is.
  if (fit) {
    return page.thumbUrl ? (
      <img
        src={page.thumbUrl}
        alt={alt}
        className={`max-h-full max-w-full object-contain ${className} ${imgClassName}`}
        style={imgStyle}
        draggable={false}
        {...(loading ? { loading } : {})}
      />
    ) : (
      <div className={`h-full w-full bg-white ${className}`} />
    );
  }

  const ratio = aspect ?? page.widthPt / page.heightPt;
  return (
    <div className={`overflow-hidden bg-white ${className}`} style={{ aspectRatio: String(ratio) }}>
      {page.thumbUrl ? (
        <img
          src={page.thumbUrl}
          alt={alt}
          className={`h-full w-full object-contain bg-white ${imgClassName}`}
          style={imgStyle}
          draggable={false}
          {...(loading ? { loading } : {})}
        />
      ) : (
        <div className="h-full w-full bg-white" />
      )}
    </div>
  );
}
