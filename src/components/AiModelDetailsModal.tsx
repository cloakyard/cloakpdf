/**
 * Read-only modal that lists every AI model loaded by a tool — name,
 * Hugging Face repo, size, license, source link, and optional role
 * label ("chat", "retrieval", …).
 *
 * Reached from both {@link AiModelGate} (before download) and
 * {@link ActiveModelBar} (after load). Keeping the per-model details
 * here instead of inline on the surrounding chrome means the gate
 * card and the active-model strip stay compact on phones, while users
 * who want to know exactly what's running on their device are one tap
 * away from the full picture.
 *
 * Different from {@link AiConsentModal}: that modal drives the
 * download / consent flow with progress, retry, and cancel actions.
 * This one is purely informational and dismissible from any state.
 *
 * **Visual pattern.** A solid-paper bottom sheet on mobile and compact
 * centered dialog on desktop. One `fixed inset-0` wrapper paints the named
 * scrim, with the inner sheet rising in and settling out through Motion
 * (the shared `scrim`/`sheet` variants via AnimatePresence).
 * One painting layer keeps iOS Safari from getting confused about
 * which element should scroll.
 */
import { AlertTriangle, HardDrive, MemoryStick, ShieldCheck, Trash2 } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { type AiModelInfo, formatApproxSize } from "../utils/ai-models.ts";
import { ModelCard } from "./ModelCard.tsx";
import { ModalCloseButton, ModalShell } from "./ModalShell.tsx";

interface AiModelDetailsModalProps {
  open: boolean;
  onClose: () => void;
  /** Models to list. Render order is preserved. */
  models: AiModelInfo[];
  /**
   * Optional human-readable role per model — same length and order as
   * `models`. E.g. `["chat", "retrieval"]`. Pass `undefined` when role
   * labels aren't meaningful.
   */
  roles?: string[];
  /**
   * Release the in-tab pipelines (RAM only). The browser keeps the
   * downloaded weight files in CacheStorage so re-loading is fast.
   * Wire from `useRagModels.dispose`. The dialog hides the "Free
   * memory" affordance entirely when this is omitted (e.g. opened
   * from the pre-download gate, where there's no RAM to free yet).
   */
  onFreeMemory?: () => void | Promise<unknown>;
  /**
   * Destructive: also delete the model weights from CacheStorage
   * and clear the consent flags so the user re-experiences the
   * download dialog on next use. Wire from `useRagModels.evict`.
   * Hidden when omitted; rendered with an inline two-step confirm
   * when present so a stray click can't nuke a 1+ GB download.
   */
  onDelete?: () => void | Promise<unknown>;
  /**
   * Disables both storage actions while another AI task is running
   * (e.g. mid-question, mid-indexing). The host knows the task
   * state; we don't try to second-guess it from the model status.
   */
  storageActionsDisabled?: boolean;
  /**
   * `true` when at least one pipeline is resident in RAM — i.e.
   * there's something for {@link onFreeMemory} to actually free.
   * When `false` (e.g. right after a dispose/evict), the "Free
   * memory" button hides so the user isn't offered a no-op action.
   * Wire from `useRagModels.canFreeMemory`. Default `true`
   * preserves the old always-show behaviour for callers that
   * haven't been updated yet.
   */
  canFreeMemory?: boolean;
  /**
   * `true` when at least one model is loaded in RAM *or* known to
   * have weights cached on disk. When `false` (cache evicted, no
   * pipelines loaded), the destructive "Delete cached models"
   * button hides — nothing to delete, so the affordance would be a
   * no-op. Wire from `useRagModels.canDelete`.
   */
  canDelete?: boolean;
}

export function AiModelDetailsModal({
  open,
  onClose,
  models,
  roles,
  onFreeMemory,
  onDelete,
  storageActionsDisabled,
  canFreeMemory = true,
  canDelete = true,
}: AiModelDetailsModalProps) {
  // Two-step confirm state for "Delete cached models" — clicking the
  // button arms it ("Click again to confirm"); clicking the armed
  // button fires the actual delete. Resets whenever the dialog opens
  // or closes so a future visit starts cleanly disarmed.
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const confirmDeleteRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setDeleteArmed(false);
    setBusy(false);
    setActionError(null);
  }, [open]);

  useEffect(() => {
    if (!deleteArmed) return;
    const frame = requestAnimationFrame(() => confirmDeleteRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [deleteArmed]);

  const totalBytes = models.reduce((sum, m) => sum + m.approxSizeBytes, 0);
  // An individual button shows iff its callback is wired AND there's
  // actually something for it to act on. The whole storage section
  // hides when neither button has anything to do — keeps the modal
  // tidy after a successful evict (nothing to free, nothing to
  // delete) instead of leaving two ghost rows of "this won't do
  // anything" buttons.
  const showFreeMemory = Boolean(onFreeMemory) && canFreeMemory;
  const showDelete = Boolean(onDelete) && canDelete;
  const showStorageActions = showFreeMemory || showDelete;

  async function handleFreeMemory() {
    if (!onFreeMemory || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await onFreeMemory();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not free model memory.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteClick() {
    if (!onDelete || busy) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      await onDelete();
      // After a successful evict the modal's content (model badges,
      // memory line) is still accurate metadata, but the in-page
      // state has changed — close so the host can re-render the
      // gate/consent flow from scratch.
      onClose();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not delete cached models.");
    } finally {
      setBusy(false);
      setDeleteArmed(false);
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      labelledBy="ai-model-details-title"
      describedBy="ai-model-details-description"
      dismissOnBackdrop={!busy}
      dismissOnEscape={!busy}
      panelClassName="max-h-[86svh] sm:max-h-[min(680px,calc(100svh-64px))] sm:w-[min(580px,100%)]"
      testId="ai-model-details-dialog"
    >
      <header className="cloak-dialog__header">
        <div className="min-w-0 flex-1">
          <p className="cloak-dialog__eyebrow">Model runtime / local storage</p>
          <h2 id="ai-model-details-title" className="cloak-dialog__title">
            {models.length > 1 ? "AI models in use" : "AI model in use"}
          </h2>
          <p id="ai-model-details-description" className="cloak-dialog__description">
            {models.length > 1
              ? `${models.length} models load together — about ${formatApproxSize(totalBytes)} total. All run on your device; your PDFs are never uploaded.`
              : "Runs on your device; your PDFs are never uploaded."}
          </p>
        </div>
        <ModalCloseButton onClick={onClose} disabled={busy} initialFocus={!showStorageActions} />
      </header>

      <div className="cloak-dialog__body thin-scrollbar space-y-3">
        <RequirementsLine totalBytes={totalBytes} />

        {models.map((info, i) => (
          <ModelCard key={info.id} info={info} role={roles?.[i]} />
        ))}

        <div className="flex items-start gap-2.5 pt-1 text-xs leading-relaxed text-[var(--color-ink-2)]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" />
          <p>
            Model files are downloaded once from Hugging Face's CDN and cached in your browser.
            After that, everything runs entirely on your device.
          </p>
        </div>

        {actionError && (
          <div className="cloak-notice cloak-notice--danger text-xs" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{actionError}</span>
          </div>
        )}

        {showStorageActions && (
          <StorageActions
            totalBytes={totalBytes}
            onFreeMemory={showFreeMemory ? onFreeMemory : undefined}
            onDelete={showDelete ? onDelete : undefined}
            deleteArmed={deleteArmed}
            onDeleteClick={handleDeleteClick}
            onCancelDelete={() => setDeleteArmed(false)}
            onFreeMemoryClick={handleFreeMemory}
            disabled={Boolean(storageActionsDisabled) || busy}
            busy={busy}
            confirmDeleteRef={confirmDeleteRef}
          />
        )}
      </div>
    </ModalShell>
  );
}

/**
 * Plain informational strip showing the model bundle's peak-RAM
 * footprint and the recommended baseline. **We deliberately do not
 * read `navigator.deviceMemory`** — Chrome caps it at 8 GB for
 * fingerprinting privacy (so 16 GB and 32 GB desktops both report 8),
 * Firefox/Safari don't expose it at all, and any "Detected on your
 * device: X GB" line we'd render from that signal is at best
 * uninformative and at worst self-contradictory.
 *
 * The deal we offer the user instead: tell them what the models need,
 * and trust them to know whether their machine has it. A single
 * neutral tone, no amber/slate split based on a signal we don't
 * trust, no per-user diagnosis.
 *
 * The dialog only renders on desktop — the Ask PDF tool is gated to
 * non-mobile devices upstream (see `tool.desktopOnly` in
 * `tool-registry.ts`), so we don't need a phone-specific branch here.
 */
function RequirementsLine({ totalBytes }: { totalBytes: number }) {
  const totalGb = totalBytes / (1024 * 1024 * 1024);
  return (
    <div className="flex items-start gap-2.5 border-y border-[var(--color-rule)] py-3 text-xs leading-relaxed text-[var(--color-ink)]">
      <MemoryStick
        className="w-4 h-4 shrink-0 mt-0.5 text-primary-600 dark:text-primary-400"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Memory requirement</p>
        <p className="opacity-80 mt-0.5">
          These models load about {totalGb.toFixed(1)} GB into memory at the same time. At least 16
          GB of RAM is recommended for smooth performance.
        </p>
      </div>
    </div>
  );
}

/**
 * Footer panel offering the two storage knobs: a soft "Free memory"
 * (release RAM, keep the downloaded weights cached on disk so the
 * next use warm-loads in seconds) and a destructive "Delete cached
 * models" (also evict the CacheStorage bytes — roughly 1.2 GB on the
 * Compact tier, 1.9 GB on Quality).
 *
 * The destructive action goes through a two-step confirm: the first
 * click swaps the button into an "armed" state with a red warning
 * blurb and a "Cancel" escape hatch; the second click actually fires
 * the evict. This is cheaper than a separate confirm modal and
 * harder to dismiss by accident than `window.confirm` (whose dialog
 * placement varies wildly across browsers/OS).
 *
 * Both buttons disable while a task is running (`disabled` from the
 * host) and while either operation is in flight (`busy`) — frees the
 * caller from having to model the two-state dance themselves.
 */
function StorageActions({
  totalBytes,
  onFreeMemory,
  onDelete,
  deleteArmed,
  onDeleteClick,
  onCancelDelete,
  onFreeMemoryClick,
  disabled,
  busy,
  confirmDeleteRef,
}: {
  totalBytes: number;
  onFreeMemory?: () => void | Promise<unknown>;
  onDelete?: () => void | Promise<unknown>;
  deleteArmed: boolean;
  onDeleteClick: () => void;
  onCancelDelete: () => void;
  onFreeMemoryClick: () => void;
  disabled: boolean;
  busy: boolean;
  confirmDeleteRef: RefObject<HTMLButtonElement | null>;
}) {
  const totalGb = totalBytes / (1024 * 1024 * 1024);
  return (
    <section className="border-y border-[var(--color-rule)] py-3.5 text-xs">
      <div className="flex items-start gap-2.5">
        <HardDrive
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ink-3)]"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[var(--color-ink)]">Storage</p>
          <p className="mt-0.5 leading-relaxed text-[var(--color-ink-2)]">
            The models sit in two places: loaded in RAM while you're using AI, and cached on disk (~
            {totalGb.toFixed(1)} GB) so future sessions skip the download.
          </p>
          <ul className="mt-2 space-y-1 leading-relaxed text-[var(--color-ink-2)]">
            <li className="flex gap-1.5">
              <span aria-hidden="true">·</span>
              <span>
                <strong className="text-[var(--color-ink)]">Free memory</strong> — releases RAM
                only. The disk cache stays, so re-opening Ask&nbsp;PDF re-loads in seconds.
              </span>
            </li>
            <li className="flex gap-1.5">
              <span aria-hidden="true">·</span>
              <span>
                <strong className="text-[var(--color-ink)]">Delete cached models</strong> — frees
                RAM <em>and</em> the disk cache. Next use redownloads the full ~{totalGb.toFixed(1)}{" "}
                GB.
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        {onFreeMemory && (
          <button
            type="button"
            onClick={onFreeMemoryClick}
            disabled={disabled}
            data-dialog-initial-focus="true"
            className="cloak-focus inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-[var(--color-rule)] bg-[var(--color-surface)] px-3 py-2 font-mono text-xxs font-semibold uppercase tracking-wide text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-rule-strong)] hover:bg-[var(--color-paper)] disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11"
          >
            <MemoryStick className="w-3.5 h-3.5" aria-hidden="true" />
            {busy ? "Working…" : "Free memory"}
          </button>
        )}
        {onDelete && !deleteArmed && (
          <button
            type="button"
            onClick={onDeleteClick}
            disabled={disabled}
            data-dialog-initial-focus={!onFreeMemory ? "true" : undefined}
            className="cloak-focus inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-[var(--color-rule)] bg-[var(--color-surface)] px-3 py-2 font-mono text-xxs font-semibold uppercase tracking-wide text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-status-danger)] hover:bg-[var(--color-status-danger-soft)] disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11"
          >
            <Trash2 className="h-3.5 w-3.5 text-[var(--color-status-danger)]" aria-hidden="true" />
            Delete cached models
          </button>
        )}
      </div>

      {onDelete && deleteArmed && (
        <div className="cloak-notice cloak-notice--danger mt-3 flex-col p-3" role="alert">
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-status-danger)]"
              aria-hidden="true"
            />
            <p className="font-medium leading-relaxed">
              Delete the cached models? You'll need to redownload ~{totalGb.toFixed(1)} GB to use AI
              features again.
            </p>
          </div>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <button
              ref={confirmDeleteRef}
              type="button"
              onClick={onCancelDelete}
              disabled={busy}
              className="cloak-focus inline-flex min-h-10 flex-1 items-center justify-center rounded-md border border-[var(--color-rule)] bg-[var(--color-surface)] px-3 py-2 font-mono text-xxs font-semibold uppercase tracking-wide text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-rule-strong)] hover:bg-[var(--color-paper)] disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDeleteClick}
              disabled={busy}
              className="cloak-focus inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md bg-[var(--color-status-danger)] px-3 py-2 font-mono text-xxs font-semibold uppercase tracking-wide text-[var(--color-accent-ink)] transition-[background-color,opacity] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              {busy ? "Deleting…" : "Confirm delete"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
