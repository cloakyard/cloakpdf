// tools.ts — Rail metadata for the canvas editor's single-PDF tools.
//
// This is metadata only (id / label / icon / group / which view mode it drives
// / build status). The actual Tool behaviour (canvas interaction) and Panel
// (right-side options) are bound per id in the dispatchers, mirroring CloakIMG.
// The roster is the single-PDF tools that live in the editor (incl. redact +
// ocr) — see CLAUDE.md for the disposition of every CloakPDF tool. Multi-file /
// terminal / security-cert / AI tools are NOT here; they live outside the editor.
//
// Order is by real user priority / frequency of use — top of the rail is the
// tool a typical user reaches for most. Tools stay grouped into thematic
// families (the group label shows in the Properties panel and the rail draws a
// hairline between families); families and the tools inside them are then sorted
// by frequency. The everyday core leads — Annotate, Signature, Fill form,
// Organize, Redact — then privacy clean-up, transforms, repeating page
// "furniture" (stamps / numbering), and finally the rarely-touched extras.

import {
  AlignCenter,
  AlignVerticalSpaceAround,
  BookMarked,
  ClipboardList,
  Crop,
  Eraser,
  EyeOff,
  FileText,
  Grid2x2,
  Hash,
  Highlighter,
  LayoutGrid,
  Paperclip,
  PenTool,
  QrCode,
  Scale,
  Sparkles,
  ScanText,
  Search,
  SprayCan,
  Stamp,
  TextCursor,
} from "lucide-react";
import type { ComponentType } from "react";

export type EditorToolGroup =
  | "annotate"
  | "pages"
  | "security"
  | "transform"
  | "stamps"
  | "document";

/** Which stage the tool operates in. `overview` tools act on the page grid;
 *  `focus` tools draw on / configure a single page; `either` work in both. */
export type EditorToolMode = "focus" | "overview" | "either";

/** Build status — lets the rail render the full target roster now while tools
 *  land milestone by milestone. `soon` tools show a placeholder panel. */
export type EditorToolStatus = "ready" | "soon";

export interface EditorTool {
  id: string;
  name: string;
  /** One-line, action-first summary of what the tool does. Shown in the
   *  Properties panel header and the mobile tool sheet — per-tool, never the
   *  group label, so sibling tools in a family read distinctly. */
  description: string;
  /** Optional short label for the rail / mobile picker, used when the tool
   *  name's first word loses meaning on its own (e.g. "Page numbers" → "Page"
   *  reads as page management). When unset, the rail falls back to the first
   *  word of `name`, so most tools need nothing here. Keep ≤8 chars to fit the
   *  ~64px rail button. */
  railLabel?: string;
  icon: ComponentType<{ className?: string }>;
  group: EditorToolGroup;
  mode: EditorToolMode;
  status: EditorToolStatus;
}

export const EDITOR_GROUP_LABELS: Record<EditorToolGroup, string> = {
  annotate: "Annotate & Sign",
  pages: "Pages",
  security: "Privacy & Security",
  transform: "Transform",
  stamps: "Stamps & Numbering",
  document: "Document",
};

// Rail order = frequency of use, highest first. Within a family, most-used first.
// Families are ordered by their lead (most-used) tool, so the rail reads top-to-
// bottom roughly as a single priority list while keeping related tools adjacent.
export const EDITOR_TOOLS = [
  // Annotate & Sign — the everyday core: mark up, sign, fill in.
  {
    id: "annotate-pdf",
    name: "Annotate",
    description: "Draw, highlight, add shapes, and place text on the page.",
    icon: Highlighter,
    group: "annotate",
    mode: "focus",
    status: "ready",
  },
  {
    id: "signature",
    name: "Signature",
    description: "Draw or upload a signature and place it on the page.",
    icon: PenTool,
    group: "annotate",
    mode: "focus",
    status: "ready",
  },
  {
    id: "fill-pdf-form",
    name: "Fill form",
    description: "Fill in interactive form fields, then optionally flatten them.",
    icon: ClipboardList,
    group: "annotate",
    mode: "focus",
    status: "ready",
  },
  {
    id: "select-text",
    name: "Select text",
    railLabel: "Select",
    description: "Drag to select real text, then highlight, box, redact, or copy it.",
    icon: TextCursor,
    group: "annotate",
    mode: "focus",
    status: "ready",
  },
  {
    id: "auto-fill",
    name: "Auto-fill",
    description: "Fill printed forms with no interactive fields, using a saved profile.",
    icon: Sparkles,
    group: "annotate",
    mode: "either",
    status: "ready",
  },

  // Pages — page management (reorder / delete / rotate / extract). One of the
  // most common reasons to open a PDF editor at all.
  {
    id: "organize-pages",
    name: "Organize",
    description: "Reorder, rotate, and remove pages in a visual grid.",
    icon: Grid2x2,
    group: "pages",
    mode: "overview",
    status: "ready",
  },

  // Privacy & Security — brand-defining; redact leads, then the clean-up tools.
  {
    id: "redact-pdf",
    name: "Redact",
    description: "Black out searched text or detected PII — burned into the pixels.",
    icon: EyeOff,
    group: "security",
    mode: "focus",
    status: "ready",
  },
  {
    id: "find-act",
    name: "Find & Act",
    description: "Search any text, then highlight or box every match at once.",
    icon: Search,
    group: "security",
    mode: "focus",
    status: "ready",
  },
  {
    id: "pdf-scrub",
    name: "Scrub",
    description: "Strip hidden data: metadata, scripts, attachments, and annotations.",
    icon: Eraser,
    group: "security",
    mode: "either",
    status: "ready",
  },
  {
    id: "metadata",
    name: "Metadata",
    description: "View and edit the title, author, subject, and keywords.",
    icon: FileText,
    group: "security",
    mode: "either",
    status: "ready",
  },

  // Transform — reshape the pages themselves.
  {
    id: "crop-pages",
    name: "Crop",
    description: "Trim page margins to a custom area.",
    icon: Crop,
    group: "transform",
    mode: "focus",
    status: "ready",
  },
  {
    id: "strip-furniture",
    name: "Strip furniture",
    description: "Auto-detect and trim repeating headers, footers, and page numbers.",
    icon: AlignVerticalSpaceAround,
    group: "transform",
    mode: "focus",
    status: "ready",
  },
  {
    id: "smart-erase",
    name: "Erase",
    description: "Cover a blemish, logo, or face with a colour-matched patch or a mosaic.",
    icon: SprayCan,
    group: "transform",
    mode: "focus",
    status: "ready",
  },
  {
    id: "ocr",
    name: "OCR",
    description: "Recognize text in scanned pages and add a searchable layer.",
    icon: ScanText,
    group: "transform",
    mode: "either",
    status: "ready",
  },
  {
    id: "nup-pages",
    name: "N-up",
    description: "Arrange multiple pages per sheet (2-up, 4-up, …).",
    icon: LayoutGrid,
    group: "transform",
    mode: "either",
    status: "ready",
  },

  // Stamps & Numbering — repeating content laid over every page.
  {
    id: "stamp-pdf",
    name: "Stamp",
    description: "Stamp text across every page — boxed or sealed, digital or inked.",
    icon: Stamp,
    group: "stamps",
    mode: "either",
    status: "ready",
  },
  {
    id: "add-page-numbers",
    name: "Page numbers",
    // "Page" alone (the first word) reads as page management on the rail; under
    // the Hash icon "Numbers" is unambiguous.
    railLabel: "Numbers",
    description: "Add page numbers with a choice of format, position, and size.",
    icon: Hash,
    group: "stamps",
    mode: "either",
    status: "ready",
  },
  {
    id: "header-footer",
    name: "Header & footer",
    description: "Add repeating header and footer text to every page.",
    icon: AlignCenter,
    group: "stamps",
    mode: "either",
    status: "ready",
  },
  {
    id: "bates-numbering",
    name: "Bates",
    description: "Apply sequential Bates numbers for legal documents.",
    icon: Scale,
    group: "stamps",
    mode: "either",
    status: "ready",
  },
  {
    id: "qr-stamp",
    name: "QR / barcode",
    railLabel: "QR code",
    description:
      "Place a scannable QR code or barcode from a URL, ID, or hash, then drag to size it.",
    icon: QrCode,
    mode: "focus",
    group: "stamps",
    status: "ready",
  },

  // Document — structural extras, reached for least often.
  {
    id: "add-bookmarks",
    name: "Bookmarks",
    description: "Build a bookmark outline for quick navigation.",
    icon: BookMarked,
    group: "document",
    mode: "either",
    status: "ready",
  },
  {
    id: "file-attachment",
    name: "Attach",
    description: "Embed or remove file attachments inside the PDF.",
    icon: Paperclip,
    group: "document",
    mode: "either",
    status: "ready",
  },
] as const satisfies readonly EditorTool[];

/** Literal union of every editor tool id — derived from `EDITOR_TOOLS` so it
 *  can't drift. Feeds the app-wide `ToolId` (see `src/config/tool-registry.ts`). */
export type EditorToolId = (typeof EDITOR_TOOLS)[number]["id"];

export function findEditorTool(id: string | null): EditorTool | null {
  if (!id) return null;
  return EDITOR_TOOLS.find((t) => t.id === id) ?? null;
}

/** Ids of the single-PDF tools that live INSIDE the editor. Home tool cards for
 *  these route into the editor (tool preselected) rather than a standalone view.
 *  Plain strings only — safe to import on the home critical path without pulling
 *  the editor's component graph (that lives in registry.tsx). */
export const EDITOR_TOOL_IDS: ReadonlySet<string> = new Set(EDITOR_TOOLS.map((t) => t.id));

/** Rail groups in display order (most-used family first), each with its tools. */
export function editorToolGroups(): {
  group: EditorToolGroup;
  label: string;
  tools: EditorTool[];
}[] {
  const order: EditorToolGroup[] = [
    "annotate",
    "pages",
    "security",
    "transform",
    "stamps",
    "document",
  ];
  return order.map((group) => ({
    group,
    label: EDITOR_GROUP_LABELS[group],
    tools: EDITOR_TOOLS.filter((t) => t.group === group),
  }));
}
