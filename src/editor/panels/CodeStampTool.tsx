// CodeStampTool.tsx — Stamp a scannable QR code or Code 128 barcode onto the
// document from a URL, case number, or hash. An options-only Panel (no canvas
// interaction) so it reads identically in the desktop right panel and the mobile
// bottom sheet. A live preview renders the actual code as you type, and the page
// scope lets you place it on every page, the cover only, or just the current
// page. Apply burns it in as crisp vector graphics via addCodeStamp.

import { useEffect, useMemo, useRef, useState } from "react";
import qrcode from "qrcode-generator";
import {
  addCodeStamp,
  type CodeStampOptions,
  type CodeStampType,
  encodeCode128B,
} from "../../utils/pdf-operations.ts";
import type { PageNumberPosition } from "../../types.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions, useEditorRead } from "../EditorContext.tsx";
import { ColorRow, Labeled, PositionGrid, RangeField, TextField, Toggle } from "./controls.tsx";
import { Segmented, WholeDocPanel } from "./WholeDocPanel.tsx";

const BLACK = { r: 17, g: 24, b: 39 };

type PageScope = "every" | "first" | "this";

/** QR preview as a data-URL (sync + cheap); null if encoding fails. */
function useQrPreview(content: string): string | null {
  return useMemo(() => {
    const text = content.trim();
    if (!text) return null;
    try {
      const qr = qrcode(0, "M");
      qr.addData(text);
      qr.make();
      return qr.createDataURL(4, 2);
    } catch {
      return null;
    }
  }, [content]);
}

/** Draw the Code 128 barcode preview into a canvas — mirrors addCodeStamp's bar
 *  layout (10-module quiet zones, alternating bar/space starting with a bar). */
function BarcodePreview({ content, valid }: { content: string; valid: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    if (!valid) return;
    try {
      const pattern = encodeCode128B(content.trim());
      let totalModules = 20; // quiet zones
      for (const ch of pattern) totalModules += Number(ch);
      const moduleW = W / totalModules;
      ctx.fillStyle = "#111827";
      let cursor = 10 * moduleW;
      let isBar = true;
      for (const ch of pattern) {
        const runW = Number(ch) * moduleW;
        // Snap both edges to integer pixels so sub-pixel bars (long payloads on
        // the fixed-width canvas) don't overlap and eat the quiet zone — ceiling
        // each width independently drifted the layout rightward.
        if (isBar) {
          const x0 = Math.round(cursor);
          ctx.fillRect(x0, 0, Math.max(1, Math.round(cursor + runW) - x0), H);
        }
        cursor += runW;
        isBar = !isBar;
      }
    } catch {
      /* invalid content — leave blank */
    }
  }, [content, valid]);
  return (
    <canvas
      ref={ref}
      width={240}
      height={72}
      className="h-16 w-full"
      aria-label="Barcode preview"
    />
  );
}

export function Panel() {
  const { applyTransform } = useEditorActions();
  const { selectedPage } = useEditorRead();
  const [type, setType] = useState<CodeStampType>("qr");
  const [content, setContent] = useState("");
  const [position, setPosition] = useState<PageNumberPosition>("bottom-right");
  const [size, setSize] = useState(96);
  const [color, setColor] = useState(BLACK);
  const [caption, setCaption] = useState(true);
  const [scope, setScope] = useState<PageScope>("every");

  const trimmed = content.trim();
  // Code 128-B only encodes printable ASCII; flag anything outside so Apply is
  // blocked with a clear reason rather than throwing at burn time.
  const barcodeValid = useMemo(() => {
    if (!trimmed) return false;
    return /^[\x20-\x7e]+$/.test(trimmed);
  }, [trimmed]);

  const qrPreview = useQrPreview(content);
  const canApply = type === "qr" ? !!qrPreview : barcodeValid;

  const pageIndices = scope === "every" ? undefined : scope === "first" ? [0] : [selectedPage];

  const apply = () => {
    const options: CodeStampOptions = {
      type,
      content: trimmed,
      position,
      size,
      margin: 24,
      color,
      caption,
    };
    void applyTransform(async (d) => ({
      bytes: await addCodeStamp(docToFile(d), options, pageIndices),
      label: type === "qr" ? "QR code" : "Barcode",
    }));
  };

  return (
    <WholeDocPanel
      blurb="Stamp a scannable QR code or barcode — a verification URL, case number, or hash."
      applyLabel={type === "qr" ? "Add QR code" : "Add barcode"}
      disabled={!canApply}
      onApply={apply}
      note={
        type === "barcode" && trimmed && !barcodeValid
          ? "Barcodes support printable ASCII only — remove emoji or accented characters."
          : undefined
      }
    >
      <Segmented<CodeStampType>
        value={type}
        onChange={setType}
        options={[
          { value: "qr", label: "QR code" },
          { value: "barcode", label: "Barcode" },
        ]}
      />

      <TextField
        label="Content"
        value={content}
        onChange={setContent}
        placeholder={type === "qr" ? "https://example.com" : "ABC-0001"}
      />

      {/* Live preview — the actual encoded code, centred on a white card. */}
      <Labeled label="Preview">
        <div className="flex items-center justify-center rounded-lg border border-slate-200 dark:border-dark-border bg-white p-3">
          {type === "qr" ? (
            qrPreview ? (
              <img src={qrPreview} alt="QR code preview" className="h-28 w-28" />
            ) : (
              <span className="py-8 text-xs text-slate-400">Enter content to preview</span>
            )
          ) : barcodeValid ? (
            <BarcodePreview content={content} valid={barcodeValid} />
          ) : (
            <span className="py-8 text-xs text-slate-400">Enter content to preview</span>
          )}
        </div>
      </Labeled>

      <PositionGrid value={position} onChange={setPosition} />

      <Labeled label="Pages">
        <Segmented<PageScope>
          value={scope}
          onChange={setScope}
          options={[
            { value: "every", label: "Every" },
            { value: "first", label: "First" },
            { value: "this", label: "This page" },
          ]}
        />
      </Labeled>

      <RangeField
        label={type === "qr" ? "Size" : "Height"}
        value={size}
        min={48}
        max={200}
        suffix="pt"
        onChange={setSize}
      />

      <ColorRow value={color} onChange={setColor} />

      {type === "barcode" && (
        <Toggle label="Show text under barcode" checked={caption} onChange={setCaption} />
      )}
    </WholeDocPanel>
  );
}
