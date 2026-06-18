/**
 * Shared TypeScript type definitions used across the application.
 */

import type { ComponentType } from "react";

/** A 1-based inclusive page range used by the Split PDF tool. */
export interface PageRange {
  start: number;
  end: number;
}

/** Configuration options for the Add Watermark tool. */
export interface WatermarkOptions {
  /** The watermark text to display. */
  text: string;
  /** Font size in PDF points. */
  fontSize: number;
  /** RGB colour with values in the 0–255 range. */
  color: { r: number; g: number; b: number };
  /** Opacity from 0 (fully transparent) to 1 (fully opaque). */
  opacity: number;
  /** Rotation angle in degrees (negative = counter-clockwise). */
  rotation: number;
}

/** Standard PDF document metadata fields. */
export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
}

/** Absolute position and dimensions (in PDF points) for signature placement. */
export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Metadata describing a single PDF tool shown on the home screen. */
export interface Tool {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  category?: string;
  /**
   * When `true`, the tool card renders a small "Beta" badge next to
   * the title. Use it for tools that are functional but still
   * iterating on quality / UX — sets expectations without hiding
   * the feature.
   */
  beta?: boolean;
  /**
   * Requirement note shown beneath the description on the tool card
   * and as a callout inside the tool. Use for tools whose footprint
   * is meaningfully heavier than the rest of the suite (e.g. on-
   * device AI tools that load 1 GB+ of weights into RAM) so users
   * self-select before clicking through.
   */
  requirements?: string;
  /**
   * Hard-gate the tool to non-mobile devices. When `true` the home-
   * screen card is hidden on mobile and direct-routing to the tool
   * shows a friendly "desktop only" placeholder instead of mounting
   * the tool. Reserved for tools that genuinely don't work on phone
   * GPUs / RAM ceilings — e.g. the on-device AI tools, where
   * WebGPU device-lost errors and OOM tab crashes are the dominant
   * mobile experience.
   */
  desktopOnly?: boolean;
  /**
   * Keep this tool as a standalone home-screen card. The home page is
   * editor-first — a PDF dropped on the home dropzone opens the unified
   * editor, which already reaches every single-PDF edit/transform tool
   * (plus PDF→image / contact-sheet / split via its Export menu). Only
   * tools that can't be a single-PDF "edit then export" flow stay as
   * cards: multi-input constructors (merge, images→PDF), the dual-input
   * compare, and special single-input tools (AI chat, image extraction,
   * security cert/password). Tools without this flag are not shown as
   * cards — they live inside the editor.
   */
  standaloneOnly?: boolean;
}

/** Position of page numbers on the page. */
export type PageNumberPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/** Display format for page numbers. */
export type PageNumberFormat = "1" | "Page 1" | "1 / N" | "Page 1 of N";

/** Configuration options for the Add Page Numbers tool. */
export interface PageNumberOptions {
  position: PageNumberPosition;
  format: PageNumberFormat;
  fontSize: number;
  color: { r: number; g: number; b: number };
  margin: number;
  startNumber: number;
  firstPage: number;
}

/** Configuration options for the Header & Footer tool. */
export interface HeaderFooterOptions {
  headerLeft: string;
  headerCenter: string;
  headerRight: string;
  footerLeft: string;
  footerCenter: string;
  footerRight: string;
  fontSize: number;
  color: { r: number; g: number; b: number };
  margin: number;
  skipFirstPage: boolean;
}

/** Crop margins in PDF points. */
export interface CropMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Position of Bates numbers on the page. */
export type BatesPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/** Configuration options for the Bates Numbering tool. */
export interface BatesNumberOptions {
  prefix: string;
  suffix: string;
  startNumber: number;
  digits: number;
  position: BatesPosition;
  fontSize: number;
  color: { r: number; g: number; b: number };
  margin: number;
}

// NOTE: `ToolId` is no longer hand-written here — it's derived from the tool
// data (the home cards + the editor roster) in `src/config/tool-registry.ts`,
// so it can never drift from the actual tool list. Import it from there.
