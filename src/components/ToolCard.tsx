/** Compact utility entry used by the landing-page toolkit ledger. */

import { ArrowRight, MemoryStick } from "lucide-react";
import { memo } from "react";
import type { ToolId } from "../config/tool-registry.ts";
import type { Tool } from "../types.ts";

interface ToolCardProps {
  tool: Tool;
  onSelect: (id: ToolId) => void;
}

export const ToolCard = memo(function ToolCard({ tool, onSelect }: ToolCardProps) {
  const Icon = tool.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(tool.id as ToolId)}
      className="cloak-tool-card group flex w-full flex-col p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="cloak-tool-card__index uppercase">Utility / {tool.id}</span>
        <Icon
          className="cloak-tool-card__icon size-4.5 shrink-0 text-primary-600"
          aria-hidden="true"
        />
      </div>

      <div className="mt-8">
        <h3 className="flex flex-wrap items-center gap-2 text-[17px] font-semibold leading-tight tracking-[-0.015em] text-[var(--color-ink)]">
          {tool.title}
          {tool.beta && (
            <span className="rounded-sm border border-primary-200 bg-primary-50 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
              Beta
            </span>
          )}
        </h3>
        <p className="mt-2 max-w-prose text-[13px] leading-[1.55] text-[var(--color-ink-3)]">
          {tool.description}
        </p>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
        {tool.requirements ? (
          <span className="inline-flex items-start gap-2 font-mono text-[10px] leading-snug text-[var(--color-ink-3)]">
            <MemoryStick className="mt-1 size-3 shrink-0" aria-hidden="true" />
            {tool.requirements}
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--color-ink-3)]">
            Runs in browser
          </span>
        )}
        <ArrowRight
          className="cloak-tool-card__arrow size-4 shrink-0 text-[var(--color-ink-3)] group-hover:text-primary-600"
          aria-hidden="true"
        />
      </div>
    </button>
  );
});
