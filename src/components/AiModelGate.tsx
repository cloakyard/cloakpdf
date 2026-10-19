/** Setup presents the bundle; useRagModels alone owns its loading lifecycle. */
import { Download, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { AiModelStatus } from "../hooks/useAiModel.ts";
import { type AiModelInfo, type ChatVariantId, formatApproxSize } from "../utils/ai-models.ts";
import { ChatModelPicker } from "./ChatModelPicker.tsx";

interface AiModelGateProps {
  status: AiModelStatus;
  cached: boolean;
  models: AiModelInfo[];
  chatVariant: ChatVariantId;
  onChatVariantChange: (next: ChatVariantId) => void;
  onDownload: () => void;
  onViewDetails: () => void;
  children: ReactNode;
}

export function AiModelGate({
  status,
  cached,
  models,
  chatVariant,
  onChatVariantChange,
  onDownload,
  onViewDetails,
  children,
}: AiModelGateProps) {
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
          onClick={(event) => {
            event.currentTarget.focus();
            onViewDetails();
          }}
          data-dialog-return-focus="ai-model-details"
          disabled={busy}
        >
          View details
        </button>
      </div>
      <div className="pdf-ai-setup-footer">
        <p className="pdf-ai-privacy">
          <ShieldCheck size={18} strokeWidth={1.6} aria-hidden="true" />
          <span>
            Models download from Hugging Face and are cached in this browser. Your PDFs stay on your
            device.
          </span>
        </p>
        <button
          type="button"
          className="air-button air-button--primary"
          data-ai-load-models="true"
          onClick={(event) => {
            event.currentTarget.focus();
            onDownload();
          }}
          disabled={busy}
        >
          <Download size={18} strokeWidth={1.6} aria-hidden="true" />
          {status === "loading"
            ? "Loading models…"
            : status === "downloading"
              ? "Downloading models…"
              : status === "awaiting-consent"
                ? "Awaiting permission…"
                : cached
                  ? "Load models"
                  : "Download models"}
        </button>
      </div>
    </section>
  );
}
