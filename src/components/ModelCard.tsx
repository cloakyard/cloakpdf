/**
 * Read-only metadata card for a single AI model: name, role badge,
 * one-paragraph description, then a dl of repo / size / licence /
 * "used for" / Hugging Face source link.
 *
 * Shared between {@link AiModelDetailsModal} (purely informational,
 * reachable from a "View details" link) and {@link AiConsentModal}
 * (the consent + download flow). Keeping a single card definition
 * means the two modals read as one system instead of two
 * gently-diverging variants of the same content.
 */
import { ExternalLink } from "lucide-react";
import type { AiModelInfo } from "../utils/ai-models.ts";
import { formatFileSize } from "../utils/file-helpers.ts";

interface ModelCardProps {
  info: AiModelInfo;
  /**
   * Optional operational role label in the top-right of the
   * card — e.g. `"chat"` / `"retrieval"`. Use when the surrounding
   * context shows multiple models and the user needs to tell them
   * apart quickly.
   */
  role?: string;
}

export function ModelCard({ info, role }: ModelCardProps) {
  return (
    <section className="border-t border-[var(--color-rule)] py-4 text-sm">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="font-semibold text-[var(--color-ink)] wrap-anywhere">
          {info.displayName}
        </span>
        {role && (
          <span className="shrink-0 border-l border-[var(--color-rule)] pl-2 font-mono text-xxs font-semibold uppercase tracking-wider text-primary-600">
            {role}
          </span>
        )}
      </div>

      {/* Plain-prose lead so users see *why* this model is loaded before
          they scan the technical metadata table below. */}
      <p className="mb-3 text-xs leading-relaxed text-[var(--color-ink-2)]">{info.description}</p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs text-[var(--color-ink-2)]">
        {info.bestFor && (
          <>
            <dt className="font-medium text-[var(--color-ink-3)]">Used for</dt>
            <dd className="leading-relaxed text-[var(--color-ink)]">{info.bestFor}</dd>
          </>
        )}
        <dt className="font-medium text-[var(--color-ink-3)]">Repo</dt>
        <dd className="font-mono text-[var(--color-ink)] wrap-anywhere">{info.repo}</dd>
        <dt className="font-medium text-[var(--color-ink-3)]">Size</dt>
        <dd className="tabular-nums text-[var(--color-ink)]">
          {formatFileSize(info.approxSizeBytes)}
        </dd>
        <dt className="font-medium text-[var(--color-ink-3)]">Licence</dt>
        <dd className="text-[var(--color-ink)]">{info.license}</dd>
        <dt className="font-medium text-[var(--color-ink-3)]">Source</dt>
        <dd>
          <a
            href={info.modelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cloak-focus -my-1 inline-flex min-h-6 items-center gap-1 rounded-sm py-1 text-primary-600 transition-colors hover:text-primary-700 pointer-coarse:-mx-2 pointer-coarse:min-h-11 pointer-coarse:px-2 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Model source
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </dd>
      </dl>
    </section>
  );
}
