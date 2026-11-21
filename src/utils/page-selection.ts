/** Parse one-based page labels into distinct zero-based indices. Invalid input never partially applies. */
export function parsePageSelection(input: string, count: number): number[] | null {
  if (!input.trim()) return [];
  const pages = new Set<number>();
  for (const part of input.split(",")) {
    const match = /^\s*(\d+)\s*(?:[-–]\s*(\d+)\s*)?$/.exec(part);
    if (!match) return null;
    const first = Number(match[1]),
      last = Number(match[2] ?? match[1]);
    if (first < 1 || last < first || last > count) return null;
    for (let i = first; i <= last; i++) pages.add(i - 1);
  }
  return [...pages];
}
