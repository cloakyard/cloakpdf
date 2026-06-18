// MetadataTool.tsx — The document's properties panel. Two parts:
//   1. A read-only "Document" report (version, page count, size, encryption,
//      page size) — folded in from the former standalone PDF Inspector tool.
//   2. Editable standard metadata (title/author/…/dates) written back via
//      setPdfMetadata, or cleared all for privacy.
// Panel-only — no canvas interaction, so it's identical on desktop + mobile.

import {
  BookOpen,
  Building2,
  Calendar,
  CalendarClock,
  FileCode2,
  FileText,
  HardDrive,
  Hash,
  Lock,
  LockOpen,
  type LucideIcon,
  Ruler,
  Tag,
  Type,
  User,
  Wrench,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { DateTimeInput } from "../../components/DateTimeInput.tsx";
import type { PdfMetadata } from "../../types.ts";
import { formatFileSize } from "../../utils/file-helpers.ts";
import { getPdfInfo, getPdfMetadata, setPdfMetadata } from "../../utils/pdf-operations.ts";
import type { PdfInfo } from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead } from "../EditorContext.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";
import { Labeled, TextField } from "./controls.tsx";

function DateField({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: LucideIcon;
}) {
  return (
    <Labeled label={label} icon={icon}>
      <DateTimeInput value={value} onChange={onChange} />
    </Labeled>
  );
}

/** A read-only fact row in the Document report (icon + label + value). */
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-dark-text-muted">
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary-500 dark:text-primary-400" />
        {label}
      </span>
      <span className="min-w-0 truncate text-right text-sm text-slate-700 dark:text-dark-text">
        {value}
      </span>
    </div>
  );
}

const EMPTY: PdfMetadata = {
  title: "",
  author: "",
  subject: "",
  keywords: "",
  creator: "",
  producer: "",
  creationDate: "",
  modificationDate: "",
};

const TEXT_FIELDS: { key: keyof PdfMetadata; label: string; icon: LucideIcon }[] = [
  { key: "title", label: "Title", icon: Type },
  { key: "author", label: "Author", icon: User },
  { key: "subject", label: "Subject", icon: Tag },
  { key: "keywords", label: "Keywords", icon: Hash },
  { key: "creator", label: "Creator", icon: Wrench },
  { key: "producer", label: "Producer", icon: Building2 },
];

/** Format the page-size fact: the first page's dimensions, noting if pages vary. */
function pageSizeLabel(pages: PdfInfo["pages"]): string | null {
  if (pages.length === 0) return null;
  const round = (p: { width: number; height: number }) =>
    `${Math.round(p.width)} × ${Math.round(p.height)}`;
  const first = round(pages[0]);
  const uniform = pages.every((p) => round(p) === first);
  return uniform ? `${first} pt` : `${first} pt · varies`;
}

export function Panel() {
  const { doc } = useEditorRead();
  const { applyTransform } = useEditorActions();
  const [fields, setFields] = useState<PdfMetadata | null>(null);
  const [info, setInfo] = useState<PdfInfo | null>(null);

  // (Re)load the current metadata + technical report whenever the document
  // changes. The `live` flag ignores a stale result — and is StrictMode-safe
  // (a ref guard here would bail on the second mount and never load).
  useEffect(() => {
    if (!doc) return;
    let live = true;
    const file = docToFile(doc);
    void getPdfMetadata(file).then(
      (m) => {
        if (live) setFields(m);
      },
      () => {
        if (live) setFields({ ...EMPTY });
      },
    );
    void getPdfInfo(file).then(
      (i) => {
        if (live) setInfo(i);
      },
      () => {
        if (live) setInfo(null);
      },
    );
    return () => {
      live = false;
    };
  }, [doc]);

  if (!fields) {
    return <p className="text-sm text-slate-500 dark:text-dark-text-muted">Reading metadata…</p>;
  }

  const set = (key: keyof PdfMetadata, value: string) => setFields({ ...fields, [key]: value });
  const pageSize = info ? pageSizeLabel(info.pages) : null;

  const apply = () =>
    void applyTransform(async (d) => ({
      bytes: await setPdfMetadata(docToFile(d), fields),
      label: "Edit metadata",
    }));

  return (
    <div className="flex flex-col gap-4">
      {/* Read-only document report (folded in from the old PDF Inspector). */}
      {info && (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface divide-y divide-slate-100 dark:divide-dark-border">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-dark-surface-alt px-3 py-2">
            <FileText className="h-3.5 w-3.5 text-primary-500 dark:text-primary-400" />
            <p className="text-xxs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-dark-text-muted">
              Document
            </p>
          </div>
          {doc && <InfoRow icon={FileText} label="File name" value={doc.fileName} />}
          <InfoRow
            icon={HardDrive}
            label="File size"
            value={<span className="tabular-nums">{formatFileSize(info.fileSize)}</span>}
          />
          <InfoRow
            icon={FileCode2}
            label="PDF version"
            value={<span className="tabular-nums">{info.version}</span>}
          />
          <InfoRow
            icon={BookOpen}
            label="Pages"
            value={<span className="tabular-nums">{info.pageCount}</span>}
          />
          {pageSize && (
            <InfoRow
              icon={Ruler}
              label="Page size"
              value={<span className="tabular-nums">{pageSize}</span>}
            />
          )}
          <InfoRow
            icon={info.isEncrypted ? Lock : LockOpen}
            label="Encrypted"
            value={info.isEncrypted ? "Yes" : "No"}
          />
        </div>
      )}

      {/* Editable standard metadata. */}
      <p className="text-sm text-slate-500 dark:text-dark-text-muted">
        Edit the document properties, or clear them all to strip identifying metadata.
      </p>
      {TEXT_FIELDS.map((f) => (
        <TextField
          key={f.key}
          label={f.label}
          icon={f.icon}
          value={fields[f.key]}
          onChange={(v) => set(f.key, v)}
        />
      ))}
      <div className="grid grid-cols-2 gap-2">
        <DateField
          label="Created"
          icon={Calendar}
          value={fields.creationDate}
          onChange={(v) => set("creationDate", v)}
        />
        <DateField
          label="Modified"
          icon={CalendarClock}
          value={fields.modificationDate}
          onChange={(v) => set("modificationDate", v)}
        />
      </div>

      <div className="mt-1 flex flex-col gap-2">
        <PrimaryAction label="Save metadata" onApply={apply} />
        <button
          type="button"
          onClick={() => setFields({ ...EMPTY })}
          className="self-start rounded px-1 py-0.5 text-xs text-slate-500 hover:text-red-600 dark:text-dark-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Clear all fields
        </button>
      </div>
    </div>
  );
}
