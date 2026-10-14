/** One permission/progress/recovery surface for Ask PDF's complete model bundle. */
import { AlertTriangle } from "lucide-react";
import type { AiModelStatus } from "../hooks/useAiModel.ts";
import { type AiModelInfo, formatApproxSize } from "../utils/ai-models.ts";
import type { AiProgress } from "../utils/ai-runtime.ts";
import { formatFileSize } from "../utils/file-helpers.ts";
import { ModelCard } from "./ModelCard.tsx";
import { ModalCloseButton, ModalShell } from "./ModalShell.tsx";

interface AiConsentModalProps {
  open: boolean;
  models: AiModelInfo[];
  roles: string[];
  status: AiModelStatus;
  perModelStatus: AiModelStatus[];
  perModelProgress: Array<AiProgress | null>;
  error: string | null;
  onConfirm: () => void;
  onRetry: () => void;
  onCancel: () => void;
}

export function AiConsentModal({
  open,
  models,
  roles,
  status,
  perModelStatus,
  perModelProgress,
  error,
  onConfirm,
  onRetry,
  onCancel,
}: AiConsentModalProps) {
  const busy = status === "downloading" || status === "loading";
  const consent = status === "idle" || status === "awaiting-consent";
  const completed = perModelStatus.filter((item) => item === "ready").length;
  const title =
    status === "loading"
      ? "Loading your saved models"
      : status === "downloading"
        ? "Downloading your models"
        : status === "error"
          ? "Models couldn’t load"
          : "Use these AI models?";
  return (
    <ModalShell
      open={open}
      onClose={onCancel}
      labelledBy="ai-consent-title"
      describedBy="ai-consent-description"
      dismissOnBackdrop={!busy}
      dismissOnEscape={!busy}
      testId="ai-consent-dialog"
    >
      <header className="pdf-dialog__header">
        <div className="min-w-0 flex-1">
          <h2 id="ai-consent-title" className="pdf-dialog__title">
            {title}
          </h2>
          <p id="ai-consent-description" className="pdf-dialog__description">
            {status === "loading"
              ? "Preparing the models saved in your browser. You can cancel while they load."
              : "The models run on your device. Your PDFs and questions are never uploaded."}
          </p>
        </div>
        <ModalCloseButton onClick={onCancel} disabled={busy} />
      </header>
      <div className="pdf-dialog__body pdf-ai-dialog-stack">
        {consent ? (
          <>
            <p>
              Download{" "}
              {formatApproxSize(models.reduce((sum, info) => sum + info.approxSizeBytes, 0))} from
              Hugging Face. Files are cached in this browser for future use, subject to storage
              limits.
            </p>
            {models.map((info, index) => (
              <ModelCard key={info.id} info={info} role={roles[index]} />
            ))}
          </>
        ) : (
          <>
            {status === "error" && (
              <div className="air-notice air-notice--error" role="alert">
                <AlertTriangle size={18} strokeWidth={1.6} aria-hidden="true" />
                <p>
                  {error ??
                    "The models could not be loaded. Check your connection and available memory, then try again."}
                </p>
              </div>
            )}
            <p role="status" aria-atomic="true">
              {completed} of {models.length} models ready
            </p>
            <div
              className="pdf-model-progress"
              role="progressbar"
              aria-label="Models ready"
              aria-valuemin={0}
              aria-valuemax={models.length}
              aria-valuenow={completed}
              aria-valuetext={`${completed} of ${models.length} models ready`}
            >
              <span
                style={{ transform: `scaleX(${models.length ? completed / models.length : 0})` }}
              />
            </div>
            <ul className="pdf-model-downloads">
              {models.map((info, index) => {
                const state = perModelStatus[index] ?? "idle";
                const progress = perModelProgress[index];
                const label =
                  state === "ready"
                    ? "Ready"
                    : state === "error"
                      ? "Couldn’t load"
                      : state === "loading"
                        ? "Loading from cache"
                        : state === "downloading"
                          ? "Downloading"
                          : "Waiting";
                return (
                  <li key={info.id}>
                    <div className="pdf-model-heading">
                      <h3>{info.displayName}</h3>
                      <span>{label}</span>
                    </div>
                    {/* Reported file totals can grow as new files are discovered. Never turn
                    a registry estimate or a failed model into a completed percentage. */}
                    {state === "downloading" && (
                      <>
                        <p>
                          {progress?.loaded
                            ? `${formatFileSize(progress.loaded)} received across reported files`
                            : "Preparing the download…"}
                        </p>
                        {progress?.file && <p className="pdf-model-repo">{progress.file}</p>}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="air-help">
              Completed files stay cached if you cancel or retry. An interrupted file may need to
              download again. Loading finishes when each model is ready.
            </p>
          </>
        )}
      </div>
      <footer className="pdf-dialog__footer">
        <button
          type="button"
          onClick={onCancel}
          className="air-button"
          data-dialog-initial-focus="true"
        >
          Cancel
        </button>
        {status === "error" ? (
          <button type="button" onClick={onRetry} className="air-button air-button--primary">
            Retry download
          </button>
        ) : (
          consent && (
            <button type="button" onClick={onConfirm} className="air-button air-button--primary">
              Download models
            </button>
          )
        )}
      </footer>
    </ModalShell>
  );
}
