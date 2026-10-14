/** Setup presents the bundle; useRagModels alone owns its loading lifecycle. */
import { Download, ShieldCheck } from "lucide-react";
import { type ReactNode, useState } from "react";
import type { AiModelStatus } from "../hooks/useAiModel.ts";
import { type AiModelInfo, type ChatVariantId, formatApproxSize } from "../utils/ai-models.ts";
import { AiModelDetailsModal } from "./AiModelDetailsModal.tsx";
import { ChatModelPicker } from "./ChatModelPicker.tsx";

interface AiModelGateProps {
  status: AiModelStatus;
  models: AiModelInfo[];
  roles: string[];
  chatVariant: ChatVariantId;
  onChatVariantChange: (next: ChatVariantId) => void;
  onFreeMemory: () => Promise<void>;
  onDeleteCachedModels: () => Promise<unknown>;
  canFreeMemory: boolean;
  canDelete: boolean;
  onDownload: () => void;
  children: ReactNode;
}

export function AiModelGate({
  status,
  models,
  roles,
  chatVariant,
  onChatVariantChange,
  onFreeMemory,
  onDeleteCachedModels,
  canFreeMemory,
  canDelete,
  onDownload,
  children,
}: AiModelGateProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  if (status === "ready") return <>{children}</>;

  const busy = status === "downloading" || status === "loading" || status === "awaiting-consent";
  const totalBytes = models.reduce((sum, model) => sum + model.approxSizeBytes, 0);
  const peakRam = models.reduce((sum, model) => sum + model.approxPeakRamBytes, 0);
  const headline =
    status === "loading"
      ? "Loading your saved models"
      : status === "downloading"
        ? "Downloading your models"
        : "Make room for a conversation";

  return (
    <>
      <section className="pdf-ai-setup" aria-labelledby="ai-setup-title">
        <header>
          <h2 id="ai-setup-title">{headline}</h2>
          <p>
            Choose a chat model, then open a PDF. Answers are generated on your device, with two
            supporting models to find the relevant pages.
          </p>
        </header>
        <ChatModelPicker value={chatVariant} onChange={onChatVariantChange} disabled={busy} />
        <div className="pdf-ai-setup-summary">
          <dl className="pdf-ai-metrics" aria-label="Complete model bundle estimates">
            <div>
              <dt>Total download</dt>
              <dd>{formatApproxSize(totalBytes)}</dd>
            </div>
            <div>
              <dt>Estimated peak RAM</dt>
              <dd>{formatApproxSize(peakRam)}</dd>
            </div>
          </dl>
          <p className="air-help">
            Includes all {models.length} models. Leave extra memory for your PDF, browser and other
            apps. Actual use varies with the document and question.
          </p>
          <button
            type="button"
            className="air-button air-button--quiet"
            onClick={() => setDetailsOpen(true)}
            disabled={busy}
          >
            View details
          </button>
        </div>
        <div className="pdf-ai-setup-footer">
          <p className="pdf-ai-privacy">
            <ShieldCheck size={18} strokeWidth={1.6} aria-hidden="true" />
            <span>
              Models download from Hugging Face and are cached in this browser. Your PDFs stay on
              your device.
            </span>
          </p>
          <button
            type="button"
            className="air-button air-button--primary"
            onClick={onDownload}
            disabled={busy}
          >
            <Download size={18} strokeWidth={1.6} aria-hidden="true" />
            {status === "loading"
              ? "Loading models…"
              : status === "downloading"
                ? "Downloading models…"
                : status === "awaiting-consent"
                  ? "Awaiting permission…"
                  : "Download models"}
          </button>
        </div>
      </section>
      <AiModelDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        models={models}
        roles={roles}
        onFreeMemory={onFreeMemory}
        onDelete={onDeleteCachedModels}
        canFreeMemory={canFreeMemory}
        canDelete={canDelete}
        storageActionsDisabled={busy}
      />
    </>
  );
}
