/** Shared model metadata and explicit RAM/cache actions, before and after loading. */
import { AlertTriangle, MemoryStick, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type AiModelInfo, formatApproxSize } from "../utils/ai-models.ts";
import { ModelCard } from "./ModelCard.tsx";
import { ModalCloseButton, ModalShell } from "./ModalShell.tsx";

interface AiModelDetailsModalProps {
  open: boolean;
  onClose: () => void;
  models: AiModelInfo[];
  roles?: string[];
  onFreeMemory?: () => void | Promise<unknown>;
  onDelete?: () => void | Promise<unknown>;
  storageActionsDisabled?: boolean;
  canFreeMemory: boolean;
  canDelete: boolean;
}

export function AiModelDetailsModal({
  open,
  onClose,
  models,
  roles,
  onFreeMemory,
  onDelete,
  storageActionsDisabled,
  canFreeMemory,
  canDelete,
}: AiModelDetailsModalProps) {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [busy, setBusy] = useState<"free" | "delete" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const generation = useRef(0);
  const safeAction = useRef<HTMLButtonElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    generation.current++;
    busyRef.current = false;
    setDeleteArmed(false);
    setBusy(null);
    setActionError(null);
    return () => {
      generation.current++;
    };
  }, [open]);
  useEffect(() => {
    if (deleteArmed) safeAction.current?.focus();
  }, [deleteArmed]);

  function cancelDelete() {
    setDeleteArmed(false);
    requestAnimationFrame(() => deleteTrigger.current?.focus());
  }
  function dismiss() {
    if (busyRef.current) return;
    if (deleteArmed) cancelDelete();
    else onClose();
  }
  async function run(action: "free" | "delete") {
    const callback = action === "free" ? onFreeMemory : onDelete;
    if (!callback || busyRef.current || storageActionsDisabled) return;
    busyRef.current = true;
    setBusy(action);
    setActionError(null);
    const current = generation.current;
    try {
      await callback();
      if (current === generation.current) onClose();
    } catch {
      if (current === generation.current)
        setActionError(
          action === "free"
            ? "Could not release the models. Try again."
            : "Could not delete all cached models. Try again.",
        );
    } finally {
      if (current === generation.current) {
        busyRef.current = false;
        setBusy(null);
      }
    }
  }
  const total = models.reduce((sum, info) => sum + info.approxSizeBytes, 0);
  const ram = models.reduce((sum, info) => sum + info.approxPeakRamBytes, 0);
  const showFree = Boolean(onFreeMemory) && canFreeMemory;
  const showDelete = Boolean(onDelete) && canDelete;
  const disabled = Boolean(storageActionsDisabled || busy);

  return (
    <ModalShell
      open={open}
      onClose={dismiss}
      labelledBy="ai-model-details-title"
      describedBy="ai-model-details-description"
      dismissOnBackdrop={!busy && !deleteArmed}
      dismissOnEscape={!busy}
      testId="ai-model-details-dialog"
    >
      <header className="pdf-dialog__header">
        <div className="min-w-0 flex-1">
          <h2 id="ai-model-details-title" className="pdf-dialog__title">
            Your AI models
          </h2>
          <p id="ai-model-details-description" className="pdf-dialog__description">
            {models.length} models, {formatApproxSize(total)} to download. Your PDFs stay on your
            device.
          </p>
        </div>
        <ModalCloseButton onClick={dismiss} disabled={Boolean(busy)} initialFocus />
      </header>
      <div className="pdf-dialog__body pdf-ai-dialog-stack">
        <div className="air-notice">
          <MemoryStick size={18} strokeWidth={1.6} aria-hidden="true" />
          <p>
            Estimated peak model memory: {formatApproxSize(ram)}. Leave extra room for your PDF,
            browser and other apps. Actual use varies.
          </p>
        </div>
        {models.map((info, index) => (
          <ModelCard key={info.id} info={info} role={roles?.[index]} />
        ))}
        <p className="air-help">
          Models download from Hugging Face and remain cached in this browser, subject to browser
          storage limits. Your documents are never sent with those requests.
        </p>
        {(showFree || showDelete) && (
          <section className="pdf-model-storage" aria-labelledby="ai-storage-title">
            <h3 id="ai-storage-title">Memory and storage</h3>
            <p>
              Free memory unloads the models but keeps their downloaded files. Delete cached models
              also removes all downloaded tiers and saved document indexes. Your original PDFs are
              untouched.
            </p>
            {storageActionsDisabled && (
              <p className="air-help">Available when the current AI task finishes.</p>
            )}
            {!deleteArmed ? (
              <div className="pdf-ai-actions">
                {showFree && (
                  <button
                    type="button"
                    className="air-button"
                    onClick={() => void run("free")}
                    disabled={disabled}
                  >
                    <MemoryStick size={18} strokeWidth={1.6} aria-hidden="true" />
                    {busy === "free" ? "Freeing memory…" : "Free memory"}
                  </button>
                )}
                {showDelete && (
                  <button
                    type="button"
                    ref={deleteTrigger}
                    className="air-button air-button--danger"
                    onClick={() => setDeleteArmed(true)}
                    disabled={disabled}
                  >
                    <Trash2 size={18} strokeWidth={1.6} aria-hidden="true" />
                    Delete cached models
                  </button>
                )}
              </div>
            ) : (
              <div className="air-notice air-notice--warning pdf-ai-delete-confirm">
                <h4>Delete all cached models and document indexes?</h4>
                <p>
                  To use this tier again, you’ll need to download {formatApproxSize(total)} and
                  reopen your PDF. Other cached tiers will also be removed.
                </p>
                <div className="pdf-ai-actions">
                  <button
                    type="button"
                    ref={safeAction}
                    onClick={cancelDelete}
                    disabled={Boolean(busy)}
                    className="air-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void run("delete")}
                    disabled={disabled}
                    className="air-button air-button--danger"
                  >
                    {busy === "delete" ? "Deleting…" : "Confirm delete"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
        {actionError && (
          <div className="air-notice air-notice--error" role="alert">
            <AlertTriangle size={18} strokeWidth={1.6} aria-hidden="true" />
            <p>{actionError}</p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
