import { readingRect, type FracRect, type SelWord } from "./text-select.ts";

export function tableLines(words: SelWord[], area: FracRect, rotation: number) {
  const inside = words
    .filter(({ rect: r }) => {
      const x = r.xPct + r.wPct / 2,
        y = r.yPct + r.hPct / 2;
      return (
        x >= area.xPct && x <= area.xPct + area.wPct && y >= area.yPct && y <= area.yPct + area.hPct
      );
    })
    .map((word) => ({ ...word, rect: readingRect(word.rect, rotation) }));
  const middle = (w: SelWord) => w.rect.yPct + w.rect.hPct / 2;
  inside.sort((a, b) => middle(a) - middle(b));
  const lines: SelWord[][] = [];
  for (const word of inside) {
    const line = lines.at(-1);
    if (
      line &&
      middle(word) - middle(line[0]) <= 0.55 * Math.max(line[0].rect.hPct, word.rect.hPct)
    )
      line.push(word);
    else lines.push([word]);
  }
  return lines.map((line) => line.sort((a, b) => a.rect.xPct - b.rect.xPct));
}

/** Gutters must be wider than normal word spacing and clear across the selected rows. */
export function suggestDividers(lines: SelWord[][], bounds: FracRect): number[] {
  const words = lines.flat().sort((a, b) => a.rect.xPct - b.rect.xPct);
  if (!words.length) return [];
  const widths = words
    .map((w) => w.rect.wPct / Math.max(1, Array.from(w.text).length))
    .sort((a, b) => a - b);
  const minGap = Math.max(bounds.wPct * 0.014, widths[Math.floor(widths.length / 2)] * 1.45);
  let right = words[0].rect.xPct + words[0].rect.wPct;
  const cuts: number[] = [];
  for (const { rect } of words.slice(1)) {
    if (rect.xPct - right > minGap) cuts.push((right + rect.xPct) / 2);
    right = Math.max(right, rect.xPct + rect.wPct);
  }
  return cuts;
}

export function tableCells(lines: SelWord[][], cuts: number[]) {
  return lines.map((line) => {
    const cells: string[][] = Array.from({ length: cuts.length + 1 }, () => []);
    let column = 0;
    for (const { text, rect } of line) {
      while (column < cuts.length && rect.xPct + rect.wPct / 2 > cuts[column]) column++;
      cells[column].push(text);
    }
    return cells.map((words) => words.join(" ").replace(/\s+/gu, " ").trim());
  });
}

export function spreadsheetText(rows: string[][]) {
  // Spreadsheet apps evaluate formula-like text even when pasted as plain TSV.
  return rows
    .map((row) =>
      row
        .map((cell) =>
          /^[=+@-]/u.test(cell) && !/^[+-]?\d+(?:\.\d+)?%?$/u.test(cell) ? "'" + cell : cell,
        )
        .join("\t"),
    )
    .join("\n");
}
