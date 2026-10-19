/** Shared author-colour math. Hue starts at the top and turns clockwise. */
export function hsvToHex(h, s, v) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const r = Math.round(f(5) * 255);
  const g = Math.round(f(3) * 255);
  const b = Math.round(f(1) * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function hexToHsv(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

export function wheelPosition(h, s) {
  const angle = (h * Math.PI) / 180;
  return { x: 50 + Math.sin(angle) * s * 50, y: 50 - Math.cos(angle) * s * 50 };
}

export function wheelValue(x, y, previousHue) {
  const radius = Math.hypot(x, y);
  return {
    h: radius < 0.001 ? previousHue : ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360,
    s: Math.min(1, radius),
  };
}
