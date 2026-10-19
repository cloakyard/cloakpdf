/** Shared metadata in consent and model details. Estimates remain distinct from usage. */
import { ExternalLink } from "lucide-react";
import { type AiModelInfo, formatApproxSize } from "../utils/ai-models.ts";

export function ModelCard({ info, role }: { info: AiModelInfo; role?: string }) {
  return (
    <section className="pdf-model-card">
      <div className="pdf-model-heading">
        <h3>{info.displayName}</h3>
        {role && <span className="pdf-model-role">{role}</span>}
      </div>
      <p>{info.description}</p>
      <dl className="pdf-model-facts">
        {info.bestFor && (
          <div>
            <dt>Used for</dt>
            <dd>{info.bestFor}</dd>
          </div>
        )}
        <div>
          <dt>Repository</dt>
          <dd className="pdf-model-repo">{info.repo}</dd>
        </div>
        <div>
          <dt>Download</dt>
          <dd>{formatApproxSize(info.approxSizeBytes)}</dd>
        </div>
        <div>
          <dt>Peak RAM</dt>
          <dd>{formatApproxSize(info.approxPeakRamBytes)}</dd>
        </div>
        <div>
          <dt>Licence</dt>
          <dd>{info.license}</dd>
        </div>
      </dl>
      <a
        href={info.modelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="air-button air-button--quiet"
      >
        Model source <ExternalLink size={16} strokeWidth={1.6} aria-hidden="true" />
      </a>
    </section>
  );
}
