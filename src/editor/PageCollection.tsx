// One density and responsive geometry for browsing and organizing pages.
import type { CSSProperties, ReactNode } from "react";

export function PageCollection({
  columns,
  label,
  children,
}: {
  columns: number;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="editor-page-collection thin-scrollbar">
      <ul
        className="editor-page-grid"
        role="list"
        aria-label={label}
        style={{ "--page-columns": columns } as CSSProperties}
      >
        {children}
      </ul>
    </div>
  );
}
