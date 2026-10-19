/** Controlled page navigation; moving the preview never changes page selection. */
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PagePreviewNavProps {
  /** Zero-based preview index. */
  page: number;
  total: number;
  onChange: (next: number) => void;
  /** Short count for constrained editor chrome. */
  compact?: boolean;
}

export function PagePreviewNav({ page, total, onChange, compact = false }: PagePreviewNavProps) {
  if (total <= 1) return null;
  return (
    <nav className="pdf-page-nav" aria-label="Preview pages">
      <button
        type="button"
        className="air-icon-button air-button--quiet"
        aria-label="Previous page"
        disabled={page <= 0}
        onClick={() => onChange(Math.max(0, page - 1))}
      >
        <ChevronLeft size={18} strokeWidth={1.6} aria-hidden="true" />
      </button>
      <span role="status" aria-label={`Page ${page + 1} of ${total}`}>
        {compact ? `${page + 1}/${total}` : `Page ${page + 1} of ${total}`}
      </span>
      <button
        type="button"
        className="air-icon-button air-button--quiet"
        aria-label="Next page"
        disabled={page >= total - 1}
        onClick={() => onChange(Math.min(total - 1, page + 1))}
      >
        <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" />
      </button>
    </nav>
  );
}
