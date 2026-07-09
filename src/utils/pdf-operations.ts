/**
 * Core PDF manipulation operations — barrel.
 *
 * Every function here runs entirely in the browser using pdf-lib for
 * structural manipulation and PDF.js for raster-based operations
 * (compression). No files are uploaded to any server.
 *
 * This file is a thin re-export barrel over the cohesive modules in
 * `./pdf/*`. Shared private helpers in `./pdf/raster.ts` (getPdfJs,
 * renderPageToCanvas, canvasToImageBytes, decodeImageToPngBytes) and the
 * per-module private helpers are intentionally NOT re-exported.
 */

export type { AssembleOp } from "./pdf/pages.ts";
export { mergePdfs, splitPdfIntoParts, assemblePdf } from "./pdf/pages.ts";

export { getFieldPageIndices, fillPdfForm, flattenPdf } from "./pdf/forms.ts";

export type {
  FlatField,
  ProfileKey,
  FieldFill,
  DetectFlatFieldsOptions,
} from "./pdf/form-detect.ts";
export { detectFlatFields, fillFlatFormFields, profileKeyForLabel } from "./pdf/form-detect.ts";

export type { NupLayout, NupOptions } from "./pdf/transform.ts";
export {
  compressPdf,
  grayscalePdf,
  imagesToPdf,
  nupPages,
  bookletOrder,
  cropPagesIndividual,
} from "./pdf/transform.ts";

export {
  addWatermark,
  addSignature,
  addPageNumbers,
  addHeaderFooter,
  addBatesNumbers,
} from "./pdf/stamps.ts";

export type { CodeStampType, CodeArtOptions, CodePlacement } from "./pdf/codes.ts";
export { addCodeStampAt, encodeCode128B } from "./pdf/codes.ts";
export type { QrEcl, QrMatrix } from "./pdf/qr.ts";
export { encodeQr } from "./pdf/qr.ts";

export type { TokenContext, TokenDef } from "./pdf/tokens.ts";
export { STAMP_TOKENS, resolveStampTokens, baseFileName } from "./pdf/tokens.ts";

export type { PdfInfo } from "./pdf/metadata.ts";
export {
  getPdfMetadata,
  setPdfMetadata,
  getPdfInfo,
  repairPdf,
  stripMetadata,
} from "./pdf/metadata.ts";

export { extractTextOcr, createSearchablePdf, createSearchablePdfFromLayout } from "./pdf/ocr.ts";

export { redactPdf } from "./pdf/redact.ts";

export type { ContentBox, SkewOptions, DeskewOptions } from "./pdf/page-analyze.ts";
export {
  inkBoundingBox,
  detectSkewAngle,
  detectContentBox,
  deskewPdf,
} from "./pdf/page-analyze.ts";

export type { EraseMode, EraseRegion } from "./pdf/erase.ts";
export { erasePdf, renderErasePreview } from "./pdf/erase.ts";

export type { ScrubCategory, ScrubAnalysis } from "./pdf/scrub.ts";
export { SCRUB_CATEGORIES, analyzePdfHiddenData, scrubPdf } from "./pdf/scrub.ts";

export type {
  AnnotationColor,
  Annotation,
  IconId,
  IconGeometry,
  TextFontId,
  FontFamily,
  FontCategory,
  FontFamilyMeta,
} from "./pdf/annotate.ts";
export {
  annotatePdf,
  decomposeTextFont,
  embeddedFontUrl,
  FONT_FAMILIES,
  fontFamilyMeta,
  iconGeometry,
  resolveTextFont,
  TEXT_BG_HEIGHT_EM,
  TEXT_BG_PAD_EM,
  TEXT_LINE_EM,
  TEXT_FONT_IDS,
  UNDERLINE_DROP_EM,
  UNDERLINE_WEIGHT_EM,
  wrapTextToWidth,
} from "./pdf/annotate.ts";

export type { BookmarkEntry, BookmarkOptions } from "./pdf/bookmarks.ts";
export { addPdfBookmarks } from "./pdf/bookmarks.ts";

export type { PdfAttachment } from "./pdf/attachments.ts";
export {
  listPdfAttachments,
  attachFilesToPdf,
  removeAttachmentsFromPdf,
} from "./pdf/attachments.ts";
