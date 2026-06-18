// StampTools.tsx — Content-additive overlay tools that place repeating text on
// every page: page numbers, header/footer, Bates numbering, and watermark. Each
// is an option form + Apply (reusing WholeDocPanel for the busy-aware button)
// with a visual position picker so the layout is obvious without freeform drag.
// All are additive (page count/geometry unchanged) so overlay objects are
// preserved. The result shows on the canvas immediately after Apply.

import { useState } from "react";
import type {
  BatesNumberOptions,
  HeaderFooterOptions,
  PageNumberFormat,
  PageNumberOptions,
  WatermarkOptions,
} from "../../types.ts";
import {
  addBatesNumbers,
  addHeaderFooter,
  addPageNumbers,
  addWatermark,
} from "../../utils/pdf-operations.ts";
import { docToFile } from "../doc.ts";
import { useEditorActions } from "../EditorContext.tsx";
import { ColorRow, Labeled, PositionGrid, RangeField, TextField, Toggle } from "./controls.tsx";
import { Segmented, WholeDocPanel } from "./WholeDocPanel.tsx";

const INK = { r: 30, g: 41, b: 59 };
const GREY = { r: 100, g: 116, b: 139 };

export function PageNumbersPanel() {
  const { applyTransform } = useEditorActions();
  const [o, setO] = useState<PageNumberOptions>({
    position: "bottom-center",
    format: "1",
    fontSize: 12,
    color: INK,
    margin: 36,
    startNumber: 1,
    firstPage: 1,
  });
  const set = (p: Partial<PageNumberOptions>) => setO({ ...o, ...p });
  return (
    <WholeDocPanel
      blurb="Stamp page numbers in a corner of every page."
      applyLabel="Add page numbers"
      onApply={() =>
        void applyTransform(async (d) => ({
          bytes: await addPageNumbers(docToFile(d), o),
          label: "Page numbers",
        }))
      }
    >
      <PositionGrid value={o.position} onChange={(position) => set({ position })} />
      <Labeled label="Format">
        <Segmented<PageNumberFormat>
          value={o.format}
          onChange={(format) => set({ format })}
          options={[
            { value: "1", label: "1" },
            { value: "Page 1", label: "Page 1" },
            { value: "1 / N", label: "1 / N" },
            { value: "Page 1 of N", label: "of N" },
          ]}
        />
      </Labeled>
      <ColorRow value={o.color} onChange={(color) => set({ color })} />
      <RangeField
        label="Size"
        value={o.fontSize}
        min={8}
        max={24}
        suffix="pt"
        onChange={(fontSize) => set({ fontSize })}
      />
      <RangeField
        label="Margin"
        value={o.margin}
        min={12}
        max={72}
        suffix="pt"
        onChange={(margin) => set({ margin })}
      />
    </WholeDocPanel>
  );
}

function TripleRow({
  label,
  values,
  onChange,
}: {
  label: string;
  values: [string, string, string];
  onChange: (v: [string, string, string]) => void;
}) {
  const cls =
    "w-full rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface px-2 py-1.5 text-sm text-slate-800 dark:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";
  return (
    <Labeled label={label}>
      <div className="grid grid-cols-3 gap-1.5">
        {(["Left", "Center", "Right"] as const).map((ph, i) => (
          <input
            key={ph}
            type="text"
            placeholder={ph}
            value={values[i]}
            aria-label={`${label} ${ph}`}
            onChange={(e) => {
              const next: [string, string, string] = [...values];
              next[i] = e.target.value;
              onChange(next);
            }}
            className={cls}
          />
        ))}
      </div>
    </Labeled>
  );
}

export function HeaderFooterPanel() {
  const { applyTransform } = useEditorActions();
  const [o, setO] = useState<HeaderFooterOptions>({
    headerLeft: "",
    headerCenter: "",
    headerRight: "",
    footerLeft: "",
    footerCenter: "",
    footerRight: "",
    fontSize: 10,
    color: GREY,
    margin: 36,
    skipFirstPage: false,
  });
  const set = (p: Partial<HeaderFooterOptions>) => setO({ ...o, ...p });
  const empty =
    !o.headerLeft &&
    !o.headerCenter &&
    !o.headerRight &&
    !o.footerLeft &&
    !o.footerCenter &&
    !o.footerRight;
  return (
    <WholeDocPanel
      blurb="Add repeating text to the top and/or bottom of every page."
      applyLabel="Add header & footer"
      disabled={empty}
      onApply={() =>
        void applyTransform(async (d) => ({
          bytes: await addHeaderFooter(docToFile(d), o),
          label: "Header & footer",
        }))
      }
    >
      <TripleRow
        label="Header"
        values={[o.headerLeft, o.headerCenter, o.headerRight]}
        onChange={([l, c, r]) => set({ headerLeft: l, headerCenter: c, headerRight: r })}
      />
      <TripleRow
        label="Footer"
        values={[o.footerLeft, o.footerCenter, o.footerRight]}
        onChange={([l, c, r]) => set({ footerLeft: l, footerCenter: c, footerRight: r })}
      />
      <ColorRow value={o.color} onChange={(color) => set({ color })} />
      <RangeField
        label="Size"
        value={o.fontSize}
        min={7}
        max={18}
        suffix="pt"
        onChange={(fontSize) => set({ fontSize })}
      />
      <Toggle
        label="Skip first page"
        checked={o.skipFirstPage}
        onChange={(skipFirstPage) => set({ skipFirstPage })}
      />
    </WholeDocPanel>
  );
}

export function BatesPanel() {
  const { applyTransform } = useEditorActions();
  const [o, setO] = useState<BatesNumberOptions>({
    prefix: "",
    suffix: "",
    startNumber: 1,
    digits: 6,
    position: "bottom-right",
    fontSize: 10,
    color: INK,
    margin: 36,
  });
  const set = (p: Partial<BatesNumberOptions>) => setO({ ...o, ...p });
  return (
    <WholeDocPanel
      blurb="Stamp sequential identifiers for legal & compliance workflows."
      applyLabel="Add Bates numbers"
      onApply={() =>
        void applyTransform(async (d) => ({
          bytes: await addBatesNumbers(docToFile(d), o),
          label: "Bates numbering",
        }))
      }
    >
      <div className="grid grid-cols-2 gap-2">
        <TextField
          label="Prefix"
          value={o.prefix}
          onChange={(prefix) => set({ prefix })}
          placeholder="ABC-"
        />
        <TextField
          label="Suffix"
          value={o.suffix}
          onChange={(suffix) => set({ suffix })}
          placeholder="-X"
        />
      </div>
      <RangeField
        label="Start at"
        value={o.startNumber}
        min={1}
        max={1000}
        onChange={(startNumber) => set({ startNumber })}
      />
      <Labeled label="Digits">
        <Segmented
          value={String(o.digits)}
          onChange={(v) => set({ digits: Number(v) })}
          options={[
            { value: "4", label: "4" },
            { value: "6", label: "6" },
            { value: "8", label: "8" },
          ]}
        />
      </Labeled>
      <PositionGrid value={o.position} onChange={(position) => set({ position })} />
      <ColorRow value={o.color} onChange={(color) => set({ color })} />
    </WholeDocPanel>
  );
}

export function WatermarkPanel() {
  const { applyTransform } = useEditorActions();
  const [o, setO] = useState<WatermarkOptions>({
    text: "CONFIDENTIAL",
    fontSize: 48,
    color: GREY,
    opacity: 0.3,
    rotation: -45,
  });
  const set = (p: Partial<WatermarkOptions>) => setO({ ...o, ...p });
  return (
    <WholeDocPanel
      blurb="Stamp a diagonal text watermark across every page."
      applyLabel="Add watermark"
      disabled={!o.text.trim()}
      onApply={() =>
        void applyTransform(async (d) => ({
          bytes: await addWatermark(docToFile(d), o),
          label: "Watermark",
        }))
      }
    >
      <TextField
        label="Text"
        value={o.text}
        onChange={(text) => set({ text })}
        placeholder="CONFIDENTIAL"
      />
      <ColorRow value={o.color} onChange={(color) => set({ color })} />
      <RangeField
        label="Size"
        value={o.fontSize}
        min={16}
        max={120}
        suffix="pt"
        onChange={(fontSize) => set({ fontSize })}
      />
      <RangeField
        label="Opacity"
        value={Math.round(o.opacity * 100)}
        min={5}
        max={100}
        step={5}
        suffix="%"
        onChange={(v) => set({ opacity: v / 100 })}
      />
      <RangeField
        label="Angle"
        value={o.rotation}
        min={-90}
        max={90}
        step={5}
        suffix="°"
        onChange={(rotation) => set({ rotation })}
      />
    </WholeDocPanel>
  );
}
