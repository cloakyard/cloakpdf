// AutoFillTool.tsx — Fill forms that have NO interactive fields. It reads the
// page text layer, finds the blanks (underline runs + "Label:" + space), lists
// them as editable inputs, and draws your answers back into the PDF. A saved
// profile (name / email / phone / address / date / company) fills the matching
// blanks in one tap. The companion Fill-form tool handles real AcroForm fields;
// this is for printed / exported / (OCR'd) scanned forms. Detected fields +
// values live in the tool slice so the Stage can outline them on the page.

import { Loader2, ScanLine, UserCog } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { extractTextGeometry } from "../../utils/layout-extract.ts";
import {
  detectFlatFields,
  fillFlatFormFields,
  type FieldFill,
  type FlatField,
  type ProfileKey,
} from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { useStageProps } from "../stage.tsx";
import { Labeled, TextField } from "./controls.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

const TOOL_ID = "auto-fill";
const PROFILE_STORAGE = "cloakpdf-autofill-profile";

type Profile = Partial<Record<ProfileKey, string>>;

const PROFILE_FIELDS: { key: ProfileKey; label: string; placeholder: string }[] = [
  { key: "name", label: "Full name", placeholder: "Jane Doe" },
  { key: "email", label: "Email", placeholder: "jane@example.com" },
  { key: "phone", label: "Phone", placeholder: "+1 555 0100" },
  { key: "address", label: "Address", placeholder: "1 Main St, Anytown" },
  { key: "date", label: "Date", placeholder: "2026-06-20" },
  { key: "company", label: "Company", placeholder: "Acme Inc." },
];

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE);
    return raw ? (JSON.parse(raw) as Profile) : {};
  } catch {
    return {};
  }
}

function saveProfile(p: Profile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE, JSON.stringify(p));
  } catch {
    /* storage unavailable — ignore */
  }
}

interface AutoFillSlice {
  fields: FlatField[];
  /** Field index → entered value. */
  values: Record<number, string>;
  searched: boolean;
}

function readSlice(slice: Record<string, unknown>): AutoFillSlice {
  return {
    fields: (slice.fields as FlatField[]) ?? [],
    values: (slice.values as Record<number, string>) ?? {},
    searched: (slice.searched as boolean) ?? false,
  };
}

export function Stage() {
  const { fields, values } = readSlice(useToolSlice(TOOL_ID));
  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, pageIndex: number) => {
      ctx.save();
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        if (f.pageIndex !== pageIndex) continue;
        const x = f.rect.xPct * w;
        const y = f.rect.yPct * h;
        const bw = f.rect.wPct * w;
        const bh = f.rect.hPct * h;
        // A tinted blank with a dashed outline so empty fields are visible.
        ctx.fillStyle = "rgba(37, 99, 235, 0.10)";
        ctx.fillRect(x, y, bw, bh);
        ctx.strokeStyle = "rgba(37, 99, 235, 0.7)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        ctx.strokeRect(x, y, bw, bh);
        ctx.setLineDash([]);
        const val = values[i];
        if (val) {
          ctx.fillStyle = "#0f172a";
          const size = Math.max(9, Math.min(16, bh * 0.85));
          ctx.font = `${size}px Helvetica, Arial, sans-serif`;
          ctx.textBaseline = "middle";
          ctx.fillText(val, x + 2, y + bh / 2, bw - 4);
        }
      }
      ctx.restore();
    },
    [fields, values],
  );
  useStageProps({ cursor: "default", paintOverlay });
  return null;
}

export function Panel() {
  const { doc } = useEditorRead();
  const { applyTransform, patchToolState, setSelectedPage, setViewMode } = useEditorActions();
  const { fields, values, searched } = readSlice(useToolSlice(TOOL_ID));

  const [detecting, setDetecting] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>({});
  useEffect(() => setProfile(loadProfile()), []);

  const detect = useCallback(async () => {
    if (!doc) return;
    setDetecting(true);
    try {
      const pages = await extractTextGeometry(docToFile(doc), { ocr: false });
      const found = detectFlatFields(pages);
      // Pre-fill any field whose label maps to a saved profile value.
      const saved = loadProfile();
      const seed: Record<number, string> = {};
      found.forEach((f, i) => {
        if (f.profileKey && saved[f.profileKey]) seed[i] = saved[f.profileKey] as string;
      });
      patchToolState(TOOL_ID, { fields: found, values: seed, searched: true });
    } catch {
      patchToolState(TOOL_ID, { fields: [], values: {}, searched: true });
    } finally {
      setDetecting(false);
    }
  }, [doc, patchToolState]);

  const autofill = useCallback(() => {
    const saved = loadProfile();
    const next = { ...values };
    fields.forEach((f, i) => {
      if (f.profileKey && saved[f.profileKey]) next[i] = saved[f.profileKey] as string;
    });
    patchToolState(TOOL_ID, { values: next });
  }, [fields, values, patchToolState]);

  const setValue = (i: number, v: string) =>
    patchToolState(TOOL_ID, { values: { ...values, [i]: v } });

  const setProfileField = (key: ProfileKey, v: string) => {
    const next = { ...profile, [key]: v };
    setProfile(next);
    saveProfile(next);
  };

  const filledCount = fields.filter((_, i) => (values[i] ?? "").trim()).length;
  // Read from the in-memory profile state (kept in sync on edit) rather than
  // hitting localStorage on every render.
  const hasProfileMatch = fields.some((f) => f.profileKey && profile[f.profileKey]);

  const apply = () => {
    const fills: FieldFill[] = fields
      .map((f, i) => ({ pageIndex: f.pageIndex, rect: f.rect, text: values[i] ?? "" }))
      .filter((f) => f.text.trim());
    if (fills.length === 0) return;
    void applyTransform(async (d) => ({
      bytes: await fillFlatFormFields(docToFile(d), fills),
      label: `Fill ${fills.length} field${fills.length === 1 ? "" : "s"}`,
    })).then(() => patchToolState(TOOL_ID, { fields: [], values: {}, searched: false }));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-dark-text-muted">
        Fill a printed form that has no interactive fields. Detect the blanks, type your answers (or
        autofill from your profile), then apply. Scanned forms: run OCR first.
      </p>

      <button
        type="button"
        onClick={() => void detect()}
        disabled={detecting || !doc}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        {detecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ScanLine className="h-4 w-4" />
        )}
        {detecting ? "Scanning…" : searched ? "Detect fields again" : "Detect fields"}
      </button>

      {/* Saved profile editor */}
      <div className="rounded-lg border border-slate-200 dark:border-dark-border">
        <button
          type="button"
          onClick={() => setProfileOpen((o) => !o)}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
        >
          <UserCog className="h-4 w-4 text-primary-600" />
          Your profile
          <span className="ml-auto text-xs text-slate-400">{profileOpen ? "Hide" : "Edit"}</span>
        </button>
        {profileOpen && (
          <div className="flex flex-col gap-2 border-t border-slate-200 dark:border-dark-border p-3">
            {PROFILE_FIELDS.map((pf) => (
              <TextField
                key={pf.key}
                label={pf.label}
                value={profile[pf.key] ?? ""}
                onChange={(v) => setProfileField(pf.key, v)}
                placeholder={pf.placeholder}
              />
            ))}
            <p className="text-xs text-slate-400 dark:text-dark-text-muted">
              Saved only on this device, for autofill. Never uploaded.
            </p>
          </div>
        )}
      </div>

      {searched && !detecting && (
        <>
          {fields.length === 0 ? (
            <div className="rounded-lg bg-slate-50 dark:bg-dark-bg px-3 py-3 text-xs text-slate-500 dark:text-dark-text-muted">
              No blank fields detected on this document's text layer. If it's a scan, run OCR first.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400 dark:text-dark-text-muted">
                  {fields.length} field{fields.length === 1 ? "" : "s"} · {filledCount} filled
                </span>
                {hasProfileMatch && (
                  <button
                    type="button"
                    onClick={autofill}
                    className="text-xs font-medium text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                  >
                    Autofill from profile
                  </button>
                )}
              </div>

              <div className="thin-scrollbar flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
                {fields.map((f, i) => (
                  <Labeled key={`${f.pageIndex}-${i}`} label={f.label || "Field"} normalCase>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={values[i] ?? ""}
                        onChange={(e) => setValue(i, e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface px-2.5 py-1.5 text-sm text-slate-800 dark:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPage(f.pageIndex);
                          setViewMode("focus");
                        }}
                        className="shrink-0 rounded px-1.5 text-xs text-slate-400 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      >
                        p{f.pageIndex + 1}
                      </button>
                    </div>
                  </Labeled>
                ))}
              </div>

              <PrimaryAction
                label={`Fill ${filledCount} field${filledCount === 1 ? "" : "s"}`}
                onApply={apply}
                disabled={filledCount === 0}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
