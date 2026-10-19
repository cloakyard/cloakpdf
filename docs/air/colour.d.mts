export function hsvToHex(h: number, s: number, v: number): string;
export function hexToHsv(hex: string): { h: number; s: number; v: number };
export function wheelPosition(h: number, s: number): { x: number; y: number };
export function wheelValue(x: number, y: number, previousHue: number): { h: number; s: number };
