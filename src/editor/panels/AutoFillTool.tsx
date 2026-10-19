// Printed-form answers stay scoped to the exact bytes used for detection.
import { AlertTriangle, ChevronDown, ScanLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { canvasAccent } from "../../config/theme.ts";
import { extractTextGeometry } from "../../utils/layout-extract.ts";
import {
  detectFlatFields,
  fillFlatFormFields,
  type FlatField,
  type ProfileKey,
} from "../../utils/pdf-operations.ts";
import { flatFieldLayout } from "../../utils/pdf/form-detect.ts";
import { docToFile, hasPendingDestructive } from "../doc.ts";
import { useEditorActions, useEditorRead, useToolSlice } from "../EditorContext.tsx";
import { useStageProps } from "../stage.tsx";
import { PrimaryAction } from "./PrimaryAction.tsx";

const TOOL_ID = "auto-fill";
const PROFILE_STORAGE = "cloakpdf-autofill-profile";
type Profile = Partial<Record<ProfileKey, string>>;
const PROFILE_FIELDS = [
  ["name", "Full name", "Avery Chen"],
  ["email", "Email", "avery@example.com"],
  ["phone", "Phone", "+1 555 0100"],
  ["address", "Address", "1 Main St, Anytown"],
  ["date", "Date", "15 October 2026"],
  ["company", "Company", "Northline Studio"],
] as const;

function loadProfile(): Profile {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(PROFILE_STORAGE) ?? "{}");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return Object.fromEntries(
      PROFILE_FIELDS.flatMap(([key]) => {
        const value = (raw as Record<string, unknown>)[key];
        return typeof value === "string" ? [[key, value]] : [];
      }),
    );
  } catch {
    return {};
  }
}

interface Answers {
  sourceBytes: Uint8Array;
  fields: FlatField[];
  values: Record<number, string>;
  hadText: boolean;
}
const fieldKey = (f: FlatField) =>
  `${f.pageIndex}:${f.label}:${f.rect.xPct}:${f.rect.yPct}:${f.rect.wPct}:${f.rect.hPct}`;

export function Stage() {
  const { doc } = useEditorRead();
  const saved = useToolSlice(TOOL_ID).answers as Answers | undefined;
  const answers = saved?.sourceBytes === doc?.bytes ? saved : undefined;
  const blocked = hasPendingDestructive(doc);
  const paintOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, pageIndex: number) => {
      const page = doc?.pages[pageIndex];
      if (!answers || !page || blocked) return;
      ctx.save();
      const accent = canvasAccent(ctx);
      const scale = w / page.widthPt;
      for (let i = 0; i < answers.fields.length; i++) {
        const f = answers.fields[i];
        if (f.pageIndex !== pageIndex) continue;
        const x = f.rect.xPct * w,
          y = f.rect.yPct * h;
        const bw = f.rect.wPct * w,
          bh = f.rect.hPct * h;
        ctx.fillStyle = `color-mix(in srgb, ${accent} 10%, transparent)`;
        ctx.fillRect(x, y, bw, bh);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        ctx.strokeRect(x, y, bw, bh);
        ctx.setLineDash([]);
        const value = answers.values[i];
        if (!value?.trim()) continue;
        const run = flatFieldLayout(value, f.rect, page.widthPt, page.heightPt, (text, size) => {
          ctx.font = `${size}px Helvetica, Arial, sans-serif`;
          return ctx.measureText(text).width;
        });
        ctx.fillStyle = "rgb(15.3, 22.95, 40.8)";
        ctx.font = `${run.size * scale}px Helvetica, Arial, sans-serif`;
        ctx.textBaseline = "alphabetic";
        ctx.fillText(run.text, run.x * scale, run.y * scale);
      }
      ctx.restore();
    },
    [answers, doc?.pages, blocked],
  );
  useStageProps({ cursor: "default", paintOverlay });
  return null;
}

export function Panel() {
  const { doc, busyLabel } = useEditorRead();
  const { applyTransform, patchToolState, setSelectedPage, setViewMode } = useEditorActions();
  const slice = useToolSlice(TOOL_ID);
  const saved = slice.answers as Answers | undefined;
  const answers = saved?.sourceBytes === doc?.bytes ? saved : undefined;
  const [initialProfile] = useState(loadProfile);
  const profile = (slice.profile as Profile | undefined) ?? initialProfile;
  const [detecting, setDetecting] = useState(false);
  const [progress, setProgress] = useState("");
  const [note, setNote] = useState<{ text: string; failed: boolean; sourceBytes?: Uint8Array }>({
    text: "",
    failed: false,
  });
  // The editor copies writer output; retain the committed byte identity for Undo.
  useEffect(() => {
    if (note.text && !note.failed && !note.sourceBytes && doc)
      setNote({ ...note, sourceBytes: doc.bytes });
  }, [doc, note]);
  const request = useRef<AbortController | null>(null);
  const applying = useRef(false);
  const current = useRef(doc);
  current.current = doc;
  const scanButton = useRef<HTMLButtonElement>(null);
  const busy = busyLabel !== null;
  const blocked = hasPendingDestructive(doc);

  useEffect(() => {
    setDetecting(false);
    setProgress("");
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [doc?.bytes, doc?.objects]);

  const detect = async () => {
    if (!doc || busy || blocked || request.current || applying.current) return;
    const controller = new AbortController();
    request.current = controller;
    const ownsRequest = () =>
      !controller.signal.aborted &&
      request.current === controller &&
      current.current?.bytes === doc.bytes &&
      current.current.objects === doc.objects;
    setDetecting(true);
    setProgress("Reading pages…");
    setNote({ text: "", failed: false });
    try {
      const pages = await extractTextGeometry(docToFile(doc), {
        ocr: false,
        signal: controller.signal,
        onProgress: (done, total) => {
          if (ownsRequest()) setProgress(`Reading pages… ${done} of ${total}`);
        },
      });
      if (!ownsRequest()) return;
      const fields = detectFlatFields(pages);
      const previous = new Map(
        answers?.fields.map((f, i) => [fieldKey(f), answers.values[i] ?? ""]),
      );
      const values = Object.fromEntries(
        fields.map((f, i) => [
          i,
          previous.get(fieldKey(f)) ?? (f.profileKey ? (profile[f.profileKey] ?? "") : ""),
        ]),
      );
      // Failed or empty rescans must not discard an existing answer draft.
      if (fields.length || !answers?.fields.length) {
        patchToolState(TOOL_ID, {
          answers: {
            sourceBytes: doc.bytes,
            fields,
            values,
            hadText: pages.some((p) => p.items.length > 0),
          } satisfies Answers,
        });
      } else
        setNote({
          text: "No new fields found. Your existing answers are unchanged.",
          failed: false,
        });
    } catch {
      if (ownsRequest())
        setNote({
          text: "Couldn't read the fields. Your document and answers are unchanged. Try detecting again.",
          failed: true,
        });
    } finally {
      if (ownsRequest()) {
        request.current = null;
        setDetecting(false);
        setProgress("");
      }
    }
  };

  const setValue = (i: number, value: string) => {
    if (!answers || busy || detecting) return;
    setNote({ text: "", failed: false });
    patchToolState(TOOL_ID, { answers: { ...answers, values: { ...answers.values, [i]: value } } });
  };
  const setProfileField = (key: ProfileKey, value: string) => {
    const next = { ...profile, [key]: value };
    let profileSaved = true;
    try {
      localStorage.setItem(PROFILE_STORAGE, JSON.stringify(next));
    } catch {
      profileSaved = false;
    }
    patchToolState(TOOL_ID, { profile: next, profileSaved });
  };
  const filledCount = answers?.fields.filter((_, i) => answers.values[i]?.trim()).length ?? 0;
  const hasProfileMatch = answers?.fields.some(
    (f) => f.profileKey && profile[f.profileKey]?.trim(),
  );
  const profileMatches =
    answers?.fields.filter(
      (f, i) => !answers.values[i]?.trim() && f.profileKey && profile[f.profileKey]?.trim(),
    ).length ?? 0;
  const apply = async () => {
    if (!answers || !filledCount || busy || blocked || request.current || applying.current) return;
    applying.current = true;
    setNote({ text: "", failed: false });
    try {
      await applyTransform(async (d) => {
        if (d.bytes !== answers.sourceBytes)
          throw new Error("The document changed. Detect its fields again before applying answers.");
        const fills = answers.fields
          .map((f, i) => ({ ...f, text: answers.values[i] ?? "" }))
          .filter((f) => f.text.trim());
        const appliedBytes = await fillFlatFormFields(docToFile(d), fills);
        return {
          bytes: appliedBytes,
          label: `Fill ${fills.length} field${fills.length === 1 ? "" : "s"}`,
        };
      });
      patchToolState(TOOL_ID, { answers: undefined });
      setNote({
        text: "Answers added to the PDF. Undo restores the previous document.",
        failed: false,
      });
    } catch (error) {
      setNote({
        text: `Couldn't add the answers. Your draft is preserved. ${error instanceof Error ? error.message : "Try again."}`,
        failed: true,
      });
      throw error;
    } finally {
      applying.current = false;
    }
  };

  return (
    <div className="pdf-mark-panel pdf-autofill-panel">
      <section aria-label="Detect printed fields">
        <p>
          Find the blanks, review your answers, then add them to the PDF. For scanned pages, run OCR
          first.
        </p>
        <button
          type="button"
          ref={scanButton}
          data-busy-focus-fallback
          className={`air-button ${answers?.fields.length ? "" : "air-button--primary"}`}
          aria-disabled={!doc || busy || blocked || detecting}
          aria-busy={detecting}
          onClick={() => void detect()}
        >
          <ScanLine size={18} aria-hidden="true" />
          <span className="air-action-labels">
            {["Detect fields", "Detect fields again", "Reading fields…"].map((label) => (
              <span
                key={label}
                aria-hidden={
                  label !==
                  (detecting
                    ? "Reading fields…"
                    : answers
                      ? "Detect fields again"
                      : "Detect fields")
                }
                data-active={
                  label ===
                    (detecting
                      ? "Reading fields…"
                      : answers
                        ? "Detect fields again"
                        : "Detect fields") || undefined
                }
              >
                {label}
              </span>
            ))}
          </span>
        </button>
        {detecting && (
          <>
            <p className="air-help" role="status">
              {progress}
            </p>
            <button
              type="button"
              className="air-button air-button--quiet"
              onClick={() => {
                request.current?.abort();
                request.current = null;
                setDetecting(false);
                setProgress("");
                setNote({
                  text: "Detection cancelled. Your answers are unchanged.",
                  failed: false,
                });
                scanButton.current?.focus();
              }}
            >
              Cancel detection
            </button>
          </>
        )}
        {blocked && (
          <p className="air-notice">
            Apply or remove pending redaction and erase marks before detecting or filling fields.
          </p>
        )}
        {saved && !answers && (
          <p className="air-help">
            The document changed. Detect fields again to use its current pages.
          </p>
        )}
        {answers && !answers.fields.length && !detecting && (
          <p className="air-notice" role="status">
            {answers.hadText
              ? "No blank fields found. Use Annotate to place text where you need it."
              : "No selectable text found. Run OCR, then detect fields again."}
          </p>
        )}
      </section>

      <section aria-label="Saved profile">
        <button
          type="button"
          className="air-button air-button--quiet pdf-autofill-profile-toggle"
          aria-expanded={!!slice.profileOpen}
          aria-controls="autofill-profile"
          onClick={() => patchToolState(TOOL_ID, { profileOpen: !slice.profileOpen })}
        >
          Your profile <ChevronDown size={16} aria-hidden="true" />
        </button>
        {slice.profileOpen === true && (
          <div id="autofill-profile" className="pdf-autofill-profile">
            <p className="air-help">
              Used for matching fields. Changes save on this device only, independently of the PDF.
            </p>
            {PROFILE_FIELDS.map(([key, label, placeholder]) => (
              <div className="pdf-property-field" key={key}>
                <label className="air-label" htmlFor={`autofill-profile-${key}`}>
                  {label}
                </label>
                <input
                  className="air-field"
                  id={`autofill-profile-${key}`}
                  name={`autofill-profile-${key}`}
                  value={profile[key] ?? ""}
                  placeholder={placeholder}
                  autoComplete="off"
                  disabled={busy || detecting}
                  inputMode={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                  onChange={(e) => setProfileField(key, e.target.value)}
                />
              </div>
            ))}
            {slice.profileSaved === false && (
              <p className="air-notice air-notice--error" role="alert">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>
                  Couldn't save on this device. Your profile remains available while this tool draft
                  is open. Try editing again to retry.
                </span>
              </p>
            )}
          </div>
        )}
      </section>

      {!!answers?.fields.length && (
        <section aria-label="Detected answers">
          <div className="pdf-form-heading">
            <h3>Answers</h3>
            <span className="air-help">
              {filledCount} of {answers.fields.length} filled
            </span>
          </div>
          {hasProfileMatch && (
            <button
              type="button"
              className="air-button"
              disabled={busy || detecting || blocked}
              aria-disabled={profileMatches === 0 || busy || detecting || blocked}
              onClick={() => {
                if (!profileMatches || busy || detecting || blocked) return;
                const values = { ...answers.values };
                answers.fields.forEach((f, i) => {
                  if (!values[i]?.trim() && f.profileKey && profile[f.profileKey]?.trim())
                    values[i] = profile[f.profileKey]!;
                });
                patchToolState(TOOL_ID, { answers: { ...answers, values } });
                setNote({
                  text: "Matching empty answers filled from your profile. Review them before applying.",
                  failed: false,
                });
              }}
            >
              Fill empty answers from profile
            </button>
          )}
          <ol className="pdf-form-fields">
            {answers.fields.map((f, i) => (
              <li key={fieldKey(f)} className="pdf-property-field">
                <div className="pdf-form-heading">
                  <label className="air-label" htmlFor={`autofill-answer-${i}`}>
                    {f.label || "Field"}
                  </label>
                  <button
                    type="button"
                    className="air-button air-button--quiet"
                    disabled={busy}
                    aria-label={`Show ${f.label || "field"} on page ${f.pageIndex + 1}`}
                    onClick={() => {
                      setSelectedPage(f.pageIndex);
                      setViewMode("focus");
                    }}
                  >
                    Page {f.pageIndex + 1}
                  </button>
                </div>
                <input
                  className="air-field"
                  id={`autofill-answer-${i}`}
                  name={`autofill-field-${f.pageIndex}-${i}`}
                  autoComplete="off"
                  value={answers.values[i] ?? ""}
                  disabled={busy || detecting || blocked}
                  onChange={(e) => setValue(i, e.target.value)}
                />
              </li>
            ))}
          </ol>
          <p className="air-help">
            Review each page. Long answers shrink to fit and may be shortened with an ellipsis.
            Original page text stays selectable.
          </p>
        </section>
      )}
      <section aria-label="Apply answers">
        {note.text && (!note.sourceBytes || note.sourceBytes === doc?.bytes) && (
          <p
            role={note.failed ? "alert" : "status"}
            className={note.failed ? "air-notice air-notice--error" : "air-help"}
          >
            {note.failed && <AlertTriangle size={16} aria-hidden="true" />}
            <span>{note.text}</span>
          </p>
        )}
        {!!answers?.fields.length && (
          <PrimaryAction
            label={`Fill ${filledCount} field${filledCount === 1 ? "" : "s"}`}
            onApply={apply}
            disabled={!filledCount || detecting || blocked}
          />
        )}
      </section>
    </div>
  );
}
