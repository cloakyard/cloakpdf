/**
 * Cross-component tool navigation.
 *
 * App.tsx owns the active-view state and routes purely via React state
 * (no URL hash). Tools deep inside the tree can't `setView` directly,
 * so they fire a `CustomEvent` and App subscribes. Keeps the routing
 * surface tiny — one event, one listener — without dragging a context
 * provider through the entire tree for a once-per-feature deep-link.
 *
 * Current use site: the encrypted-PDF notice surfaced by `usePdfFile`
 * deep-links into the PDF Password tool so users can unlock the file
 * and come back.
 */
import type { ToolId } from "../config/tool-registry.ts";

export const NAVIGATE_TOOL_EVENT = "cloakpdf:navigate-tool";

export function navigateToTool(toolId: ToolId): void {
  window.dispatchEvent(new CustomEvent<ToolId>(NAVIGATE_TOOL_EVENT, { detail: toolId }));
}

export const OPEN_EDITOR_EVENT = "cloakpdf:open-editor";

/**
 * Open a freshly-produced PDF in the canvas editor. Backs the secondary
 * "& edit" action on tools whose output is a single PDF (Merge, Images→PDF,
 * PDF Password's unlock) — it saves the download-then-re-upload round trip
 * when the user wants to keep working on the result. Same decoupling as
 * {@link navigateToTool}: the tool fires an event, App owns the view state
 * and subscribes.
 */
export function openEditorWithFile(file: File): void {
  window.dispatchEvent(new CustomEvent<File>(OPEN_EDITOR_EVENT, { detail: file }));
}
