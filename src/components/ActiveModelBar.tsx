/**
 * Small strip rendered alongside an AI tool's primary controls that
 * shows the model(s) currently in use, the total on-device footprint,
 * and quick-action buttons.
 *
 * Layout intent: a single flex-wrapping row of segments separated by
 * subtle bullets, so the line breaks cleanly on phones (each segment
 * lands on its own row at the natural wrap point — no orphan bullets,
 * no half-rendered "≈" symbols, no awkward 3-line stack).
 *
 * **Direct-action buttons on the bar** (one-click from anywhere the
 * bar renders):
 *
 *   - **Change model** — opens the tier picker. Hidden when there's
 *     only one tier registered.
 *   - **Free memory** — releases the in-tab pipelines (RAM); the disk
 *     cache stays warm so re-loading is fast. The single most common
 *     management action, so it gets pulled out of the details modal
 *     and onto the bar itself.
 *
 * The destructive **Delete cached models** action lives one click
 * deeper, inside {@link AiModelDetailsModal} via "View details" —
 * intentionally not at the bar level because it needs a two-step
 * confirm and a clear warning about the re-download cost.
 *
 * Per-model details (names, repos, licences, Hugging Face links) and
 * the destructive delete action live in {@link AiModelDetailsModal}
 * one tap away.
 */
import { MemoryStick, RefreshCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { type AiModelInfo, formatApproxSize } from "../utils/ai-models.ts";
import { AiModelDetailsModal } from "./AiModelDetailsModal.tsx";

interface ActiveModelBarProps {
  /**
   * Active models for the running tool — typically `[chat, embed,
   * rerank]` for the RAG stack. `models[0]` drives the single-model
   * label when only one is loaded; multi-model bundles render a
   * count-aware "Running N AI models — ≈ X total" strip.
   */
  models: AiModelInfo[];
  /**
   * Optional role labels matching {@link models} by index, e.g.
   * `["chat", "retrieval", "rerank"]`. Used by the details modal —
   * the strip itself stays terse.
   */
  roles?: string[];
  /**
   * Fired when the user clicks "Change model". When omitted the
   * button is hidden — useful when only one tier is registered, since
   * "change" has nothing to swap to. Reintroduce by passing a handler.
   */
  onChange?: () => void;
  /**
   * Disables the change button. Set this while a tool task is
   * running so the user can't yank the model out from under it.
   * Ignored when `onChange` is omitted.
   */
  disabled?: boolean;
  /**
   * Release in-tab pipelines (RAM only). Passed through to the
   * details modal's Storage section. Wire from `useRagModels.dispose`.
   * Omit to hide the affordance.
   */
  onFreeMemory?: () => void | Promise<unknown>;
  /**
   * Destructive: release pipelines **and** evict CacheStorage bytes
   * + clear consent flags so the user re-experiences the consent
   * dialog on next use. Wire from `useRagModels.evict`. Omit to hide.
   */
  onDeleteCachedModels?: () => void | Promise<unknown>;
  /**
   * `true` when there's actually anything in RAM for "Free memory"
   * to release. Drives both the inline bar button visibility and
   * the matching dialog button. Wire from `useRagModels.canFreeMemory`.
   */
  canFreeMemory: boolean;
  /**
   * `true` when there's anything cached on disk or loaded in RAM
   * for "Delete cached models" to evict. After a successful delete
   * this flips to `false` and the dialog's Delete button hides —
   * preventing a click on an already-empty cache. Wire from
   * `useRagModels.canDelete`.
   */
  canDelete: boolean;
}

export function ActiveModelBar({
  models,
  roles,
  onChange,
  disabled,
  onFreeMemory,
  onDeleteCachedModels,
  canFreeMemory,
  canDelete,
}: ActiveModelBarProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const totalBytes = models.reduce((sum, m) => sum + m.approxSizeBytes, 0);
  const primary = models[0];

  // Build the line as discrete segments so the flex-wrap layout below
  // can break them onto separate rows naturally. `formatApproxSize`
  // already produces a leading "≈" — don't prepend another one here.
  const segments: string[] =
    models.length > 1
      ? [`Running ${models.length} AI models`, formatApproxSize(totalBytes), "on-device"]
      : [
          `Running ${primary.displayName}`,
          formatApproxSize(primary.approxSizeBytes),
          primary.license,
          "on-device",
        ];

  return (
    <>
      <div className="border-y border-slate-200 py-2.5 flex items-start gap-2 font-mono text-xxs text-slate-500 dark:border-dark-border dark:text-dark-text-muted">
        <ShieldCheck
          className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary-600 dark:text-primary-400"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {segments.map((seg, i) => (
            <span key={seg} className="inline-flex items-center gap-x-1.5">
              {i > 0 && (
                <span aria-hidden="true" className="text-slate-300 dark:text-dark-border">
                  ·
                </span>
              )}
              <span>{seg}</span>
            </span>
          ))}
          <span aria-hidden="true" className="text-slate-300 dark:text-dark-border">
            ·
          </span>
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="cloak-focus rounded-sm font-medium text-primary-600 underline-offset-2 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
          >
            View details
          </button>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          {onFreeMemory && canFreeMemory && (
            <button
              type="button"
              onClick={() => void onFreeMemory()}
              disabled={disabled}
              aria-label="Free memory"
              title="Release loaded models from RAM. Files stay cached on disk so re-loading is fast."
              className="cloak-focus inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11 dark:border-dark-border dark:text-dark-text-muted dark:hover:bg-dark-surface-alt dark:hover:text-dark-text"
            >
              <MemoryStick className="w-3 h-3" aria-hidden="true" />
              <span className="hidden sm:inline">Free memory</span>
            </button>
          )}
          {onChange && (
            <button
              type="button"
              onClick={onChange}
              disabled={disabled}
              aria-label="Change model"
              className="cloak-focus inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11 dark:border-dark-border dark:text-dark-text-muted dark:hover:bg-dark-surface-alt dark:hover:text-dark-text"
            >
              <RefreshCcw className="w-3 h-3" aria-hidden="true" />
              <span className="hidden sm:inline">Change model</span>
            </button>
          )}
        </div>
      </div>

      <AiModelDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        models={models}
        roles={roles}
        onFreeMemory={onFreeMemory}
        onDelete={onDeleteCachedModels}
        storageActionsDisabled={disabled}
        canFreeMemory={canFreeMemory}
        canDelete={canDelete}
      />
    </>
  );
}
