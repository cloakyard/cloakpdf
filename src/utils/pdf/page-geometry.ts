/** Visible, rotated page points shared by the editor and PDF overlay writers. */
import {
  PDFName,
  PDFNumber,
  type PDFPage,
  concatTransformationMatrix,
  popGraphicsState,
  pushGraphicsState,
} from "@pdfme/pdf-lib";

export function visiblePageGeometry(page: PDFPage) {
  // Match PDF.js: intersect CropBox with MediaBox, falling back to MediaBox
  // when they do not intersect. Normalize reversed box coordinates as well.
  const bounds = ({ x, y, width, height }: ReturnType<PDFPage["getMediaBox"]>) => ({
    left: Math.min(x, x + width),
    bottom: Math.min(y, y + height),
    right: Math.max(x, x + width),
    top: Math.max(y, y + height),
  });
  const media = bounds(page.getMediaBox());
  const crop = bounds(page.getCropBox());
  let left = Math.max(media.left, crop.left),
    bottom = Math.max(media.bottom, crop.bottom);
  let right = Math.min(media.right, crop.right),
    top = Math.min(media.top, crop.top);
  if (right <= left || top <= bottom) ({ left, bottom, right, top } = media);
  const rawRotation = page.getRotation().angle;
  const rotation = rawRotation % 90 === 0 ? ((rawRotation % 360) + 360) % 360 : 0;
  const unitValue = page.node.lookupMaybe(PDFName.of("UserUnit"), PDFNumber)?.asNumber();
  const unit = unitValue && unitValue > 0 ? unitValue : 1;
  const s = 1 / unit;
  // Inverse of PDF.js's display rotation, with a bottom-left visible origin.
  // Include UserUnit so text sizes, image boxes and margins remain physical points.
  const matrix: [number, number, number, number, number, number] =
    rotation === 90
      ? [0, s, -s, 0, right, bottom]
      : rotation === 180
        ? [-s, 0, 0, -s, right, top]
        : rotation === 270
          ? [0, -s, s, 0, left, top]
          : [s, 0, 0, s, left, bottom];
  const quarterTurn = rotation === 90 || rotation === 270;
  return {
    width: (quarterTurn ? top - bottom : right - left) * unit,
    height: (quarterTurn ? right - left : top - bottom) * unit,
    matrix,
  };
}

/** Isolate an overlay from source content and restore graphics state even on failure. */
export async function drawOnVisiblePage(
  page: PDFPage,
  draw: (size: ReturnType<typeof visiblePageGeometry>) => void | Promise<void>,
): Promise<void> {
  const geometry = visiblePageGeometry(page);
  // pdf-lib normalizes existing streams into their own q/Q pair on first write.
  page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...geometry.matrix));
  try {
    await draw(geometry);
  } finally {
    page.pushOperators(popGraphicsState());
  }
}

/** Convert a visible bottom-left rectangle to the unrotated PDF CropBox. */
export function visibleRectToPdf(
  page: PDFPage,
  rect: { x: number; y: number; width: number; height: number },
) {
  const [a, b, c, d, e, f] = visiblePageGeometry(page).matrix;
  const x0 = a * rect.x + c * rect.y + e;
  const y0 = b * rect.x + d * rect.y + f;
  const x1 = a * (rect.x + rect.width) + c * (rect.y + rect.height) + e;
  const y1 = b * (rect.x + rect.width) + d * (rect.y + rect.height) + f;
  return {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0),
  };
}
