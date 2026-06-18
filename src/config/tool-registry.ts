/**
 * Single source of truth for the standalone tool cards on the home screen and
 * their lazy-loaded components.
 *
 * The home is editor-first: dropping a PDF opens the unified canvas editor,
 * which reaches every single-PDF edit/transform tool (plus PDF→image /
 * contact-sheet / split via its Export menu and reverse / extract / remove-blank
 * via Organize). Only tools that can't be a single-PDF "edit then export" flow
 * stay as cards here — the multi-input constructors (merge, images→PDF), the
 * dual-input compare, terminal-output extract-images, the security flows
 * (password, digital signature), and on-device AI chat. See
 * `Tool.standaloneOnly`.
 *
 * Tool order within each category encodes importance / frequency of use — the
 * home grid displays them in this order.
 */

import {
  ArrowLeftRight,
  FileKey2,
  GitMerge,
  ImageDown,
  Images,
  Lock,
  MessageSquare,
} from "lucide-react";
import { lazy } from "react";
import type { EditorToolId } from "../editor/tools.ts";
import type { Tool } from "../types.ts";

// ── Lazy-loaded tool components (code-split per tool) ────────────

const MergePdf = lazy(() => import("../standalone/MergePdf.tsx"));
const ImagesToPdf = lazy(() => import("../standalone/ImagesToPdf.tsx"));
const ExtractImages = lazy(() => import("../standalone/ExtractImages.tsx"));
const PdfPassword = lazy(() => import("../standalone/PdfPassword.tsx"));
const ComparePdf = lazy(() => import("../standalone/ComparePdf.tsx"));
const DigitalSignature = lazy(() => import("../standalone/DigitalSignature.tsx"));
const AskPdf = lazy(() => import("../standalone/AskPdf.tsx"));

// ── Tool metadata ────────────────────────────────────────────────

export const tools = [
  // ── Combine & Convert ────────────────────────────────────
  // Multi-file constructors + format conversion — the jobs the single-PDF
  // editor can't do (it edits one document, these build one from many or
  // convert between PDF and images).
  {
    id: "merge",
    title: "Merge PDFs",
    description: "Combine multiple PDF files into one document",
    icon: GitMerge,
    category: "combine",
    standaloneOnly: true, // multi-input constructor (merge/convert → download)
  },
  {
    id: "images-to-pdf",
    title: "Images to PDF",
    description: "Convert images into a PDF document",
    icon: Images,
    category: "combine",
    standaloneOnly: true, // multi-input constructor (merge/convert → download)
  },
  {
    id: "extract-images",
    title: "Extract Images",
    description: "Pull all embedded images from a PDF and download as PNG or ZIP",
    icon: ImageDown,
    category: "combine",
    standaloneOnly: true, // terminal output (embedded images → PNG/ZIP), not a PDF edit
  },

  // ── Secure & Sign ────────────────────────────────────────
  {
    id: "pdf-password",
    title: "PDF Password",
    description: "Add or remove a password and control print, copy, and edit rights",
    icon: Lock,
    category: "security",
    standaloneOnly: true, // security flow (encrypt/decrypt), not a single-PDF edit step
  },
  {
    id: "compare-pdf",
    title: "Compare PDFs",
    description: "Visual side-by-side diff of two PDFs with pixel-level change detection",
    icon: ArrowLeftRight,
    category: "security",
    standaloneOnly: true, // dual-input (needs two PDFs)
  },
  {
    id: "digital-signature",
    title: "Digital Signature",
    description: "Sign PDFs with a cryptographic certificate for authenticity verification",
    icon: FileKey2,
    category: "security",
    standaloneOnly: true, // security flow (cert signing), not a single-PDF edit step
  },

  // ── On-device AI ─────────────────────────────────────────
  {
    id: "ask-pdf",
    title: "Ask your PDF",
    description: "Ask questions and get answers extracted from the PDF — runs entirely on-device",
    icon: MessageSquare,
    category: "ai",
    // Surfaced as a "Beta" badge on the tool card. The AI tool ships
    // a functional end-to-end pipeline (chunking → hybrid retrieval
    // → relevance gate → small chat model) but answer quality is
    // bounded by the small-model ceiling we're stuck with in-browser,
    // and we're still iterating on prompt + retrieval tuning. Badge
    // sets expectations.
    beta: true,
    // Two chat tiers ship today (see `CHAT_VARIANT_IDS` in
    // `src/utils/ai-models.ts`): LFM2.5-1.2B-Instruct Compact
    // (~810 MB / 2 GB peak) and LFM2-2.6B Quality (~1.55 GB / 3.5 GB
    // peak). Both are Liquid AI's LFM family — the cross-tier e2e
    // showed they dominate SmolLM2-1.7B on speed AND extraction
    // discipline, so we dropped SmolLM2 entirely. The embedder is
    // shared — EmbeddingGemma 300M (~320 MB / ~500 MB peak RAM,
    // tokenizer included). A 23 MB MS MARCO MiniLM reranker rides
    // alongside. Aggregate first-time download: ~1.15 GB on Compact,
    // ~1.9 GB on Quality.
    // With OS + browser + tab overhead the practical floor for the
    // Quality tier is ~16 GB; users on lower-RAM machines should
    // pick Compact in the gate's tier picker. The `desktopOnly` flag below hides the tool on mobile
    // entirely — phone WebGPU drivers reliably lose the device mid-
    // inference ("Failed to execute 'mapAsync' on 'GPUBuffer':
    // [Device] is lost.") and iOS just runs out of memory and
    // crashes the tab. We tried a 360 M mobile-tier override and a
    // ≥ 12 GB RAM hint, but neither was enough to make the experience
    // reliable — better to set the boundary honestly than to ship a
    // feature that crashes the user's browser.
    requirements: "Best on devices with ≥ 16 GB RAM — pick the Compact tier on lower-RAM machines",
    desktopOnly: true,
    standaloneOnly: true, // on-device AI chat, not a PDF edit-and-export flow
  },
] as const satisfies readonly Tool[];

/**
 * Every valid tool identifier — derived from the data so it can't drift: the 8
 * standalone home cards above plus every editor tool id (`EditorToolId`). Most
 * ids route to the unified editor; only the `standaloneOnly` ones mount a
 * standalone view. Replaces the hand-maintained union that used to live in
 * `src/types.ts`.
 */
export type ToolId = (typeof tools)[number]["id"] | EditorToolId;

// ── Map tool IDs → lazy-loaded components ────────────────────────

export const toolComponents: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  merge: MergePdf,
  "images-to-pdf": ImagesToPdf,
  "extract-images": ExtractImages,
  "pdf-password": PdfPassword,
  "compare-pdf": ComparePdf,
  "digital-signature": DigitalSignature,
  "ask-pdf": AskPdf,
};

// ── Category definitions for the home screen ─────────────────────

// Categories cover only the standalone home cards — the jobs that can't be a
// single-PDF "edit then export" editor flow. Page management, compress,
// metadata, watermarking, etc. moved into the unified editor, so the old
// "Organise & Edit" / "Transform & Convert" / "Security & Properties" buckets
// no longer describe what's left here. These three do.
export const categories = [
  {
    key: "combine",
    label: "Combine & Convert",
    description: "Build a PDF from several files, or pull its contents out",
  },
  {
    key: "security",
    label: "Secure & Sign",
    description: "Protect, sign, and compare your documents",
  },
  {
    key: "ai",
    label: "On-device AI",
    description: "Chat with your PDF, right in your browser",
  },
];

/**
 * Tools shown as standalone cards on the editor-first home screen — the
 * multi-input constructors and special single-input tools that can't be a
 * single-PDF "edit then export" editor flow (see `Tool.standaloneOnly`).
 * Everything else is reached by dropping a PDF on the home dropzone, which
 * opens the unified editor.
 */
export const HOME_CARD_TOOLS: Tool[] = tools.filter((t) => t.standaloneOnly);

/** Look up a tool's metadata by id, or `null` if unknown. */
export function findTool(id: string): Tool | null {
  return tools.find((t) => t.id === id) ?? null;
}

/** Look up a tool's lazy component by id, or `null` if unknown. */
export function findToolComponent(
  id: ToolId,
): React.LazyExoticComponent<React.ComponentType> | null {
  return toolComponents[id] ?? null;
}
