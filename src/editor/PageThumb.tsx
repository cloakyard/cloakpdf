// PageThumb.tsx — The one place page previews get their aspect ratio. Every
// thumbnail surface (overview grid, organize board, OCR source pane, N-up cells)
// renders through this so the rule lives in a single file: an aspect-locked box
// (reserves the page's true shape even before the bitmap loads) with an
// object-contain image inside (the bitmap is letterboxed within that box, never
// stretched). Pass `aspect` to override the box ratio (e.g. an N-up cell is the
// page aspect × rows/cols); otherwise it's the page's own width/height.

import type { CSSProperties } from "react";
import type { PageMeta } from "./doc.ts";

export function PageThumb({
  page,
  alt,
  aspect,
  rotation = 0,
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
  /** Classes for the aspect-locked box (rounding, ring, background, layout). */
  className?: string;
  /** Extra classes for the <img> on top of the shared object-contain base. */
  imgClassName?: string;
  loading?: "lazy" | "eager";
}) {
  const ratio = aspect ?? page.widthPt / page.heightPt;
  const boxStyle: CSSProperties = { aspectRatio: String(ratio) };
  const imgStyle: CSSProperties | undefined = rotation
    ? { transform: `rotate(${rotation}deg)` }
    : undefined;
  return (
    <div className={`overflow-hidden bg-white ${className}`} style={boxStyle}>
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
