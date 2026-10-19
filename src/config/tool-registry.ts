/**
 * Single source of truth for the standalone tool cards on the home screen and
 * their lazy-loaded components.
 *
 * The home is editor-first: dropping a PDF opens the unified canvas editor,
 * which reaches every single-PDF edit/transform tool (plus PDF→image /
 * contact-sheet / split via its Export dialog and reverse / extract / remove-blank
 * via Organize). Only tools that can't be a single-PDF "edit then export" flow
 * stay as cards here — the multi-input constructors (merge, images→PDF), the
 * dual-input compare, terminal-output extract-images, the security flows
 * (password, digital signature), and on-device AI chat. The standalone and
 * editor rosters are disjoint.
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

// ── Tool metadata ────────────────────────────────────────────────

export const HOME_CARD_TOOLS = [
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
  },
  {
    id: "images-to-pdf",
    title: "Images to PDF",
    description: "Convert images into a PDF document",
    icon: Images,
    category: "combine",
  },
  {
    id: "extract-images",
    title: "Extract Images",
    description: "Pull all embedded images from a PDF and download as PNG or ZIP",
    icon: ImageDown,
    category: "combine",
  },

  // ── Secure & Sign ────────────────────────────────────────
  {
    id: "pdf-password",
    title: "PDF Password",
    description: "Add or remove a password and control print, copy, and edit rights",
    icon: Lock,
    category: "security",
  },
  {
    id: "compare-pdf",
    title: "Compare PDFs",
    description: "Visual side-by-side diff of two PDFs with pixel-level change detection",
    icon: ArrowLeftRight,
    category: "security",
  },
  {
    id: "digital-signature",
    title: "Digital Signature",
    description: "Sign PDFs with a cryptographic certificate for authenticity verification",
    icon: FileKey2,
    category: "security",
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
  },
] as const satisfies readonly Tool[];

/** Route identities come from the two metadata rosters. */
export type StandaloneToolId = (typeof HOME_CARD_TOOLS)[number]["id"];
export type ToolId = StandaloneToolId | EditorToolId;

// Metadata stays on the home path; heavy implementations load only on selection.
const toolComponents: Record<StandaloneToolId, React.LazyExoticComponent<React.ComponentType>> = {
  merge: lazy(() => import("../standalone/MergePdf.tsx")),
  "images-to-pdf": lazy(() => import("../standalone/ImagesToPdf.tsx")),
  "extract-images": lazy(() => import("../standalone/ExtractImages.tsx")),
  "pdf-password": lazy(() => import("../standalone/PdfPassword.tsx")),
  "compare-pdf": lazy(() => import("../standalone/ComparePdf.tsx")),
  "digital-signature": lazy(() => import("../standalone/DigitalSignature.tsx")),
  "ask-pdf": lazy(() => import("../standalone/AskPdf.tsx")),
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

/** Look up a tool's metadata by id, or `null` if unknown. */
export function findTool(id: string): Tool | null {
  return HOME_CARD_TOOLS.find((t) => t.id === id) ?? null;
}

/** Look up a tool's lazy component by id, or `null` if unknown. */
export function findToolComponent(
  id: string,
): React.LazyExoticComponent<React.ComponentType> | null {
  return Object.hasOwn(toolComponents, id) ? toolComponents[id as StandaloneToolId] : null;
}
