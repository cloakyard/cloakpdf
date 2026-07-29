import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "../..");

function read(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

function readPng(relativePath: string): {
  width: number;
  height: number;
  hasTransparency: boolean;
} {
  const bytes = readFileSync(resolve(ROOT, relativePath));
  expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG");

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const colorType = bytes[25];
  let hasTransparencyChunk = false;

  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "tRNS") hasTransparencyChunk = true;
    offset += length + 12;
  }

  return {
    width,
    height,
    hasTransparency: colorType === 4 || colorType === 6 || hasTransparencyChunk,
  };
}

async function readCornerPixels(relativePath: string): Promise<number[][]> {
  const { data, info } = await sharp(resolve(ROOT, relativePath))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const points = [
    [0, 0],
    [info.width - 1, 0],
    [0, info.height - 1],
    [info.width - 1, info.height - 1],
  ] as const;
  return points.map(([x, y]) => {
    const offset = (y * info.width + x) * 4;
    return Array.from(data.subarray(offset, offset + 4));
  });
}

describe("Cloakyard family logo contract", () => {
  it("pins the circular assets to the v1 70% keyline", () => {
    for (const path of ["public/cloakpdf-mark.svg", "public/icons/favicon.svg"]) {
      const svg = read(path);
      expect(svg).toContain('viewBox="0 0 64 64"');
      expect(svg).toContain('data-logo-spec="cloakyard-mark-v1"');
      expect(svg).toContain('data-glyph-keyline="42"');
      expect(svg).toContain('<circle cx="32" cy="32" r="30"');
      expect(svg).toContain('stroke-width="3"');
    }
  });

  it("keeps the installed-app master full bleed and maskable", () => {
    const svg = read("public/icons/cloakpdf-app-icon.svg");
    expect(svg).toContain('viewBox="0 0 64 64"');
    expect(svg).toContain('data-logo-spec="cloakyard-app-icon-v1"');
    expect(svg).toContain('data-glyph-keyline="42"');
    expect(svg).toContain('<rect width="64" height="64"');
    expect(svg).toContain('stroke-width="3"');
  });

  it("ships the expected raster sizes with opaque phone icons", () => {
    const expectedSizes = [
      ["public/icons/pwa-64x64.png", 64],
      ["public/icons/pwa-192x192.png", 192],
      ["public/icons/pwa-512x512.png", 512],
      ["public/icons/maskable-icon-512x512.png", 512],
      ["public/icons/apple-touch-icon.png", 180],
    ] as const;

    for (const [path, size] of expectedSizes) {
      const png = readPng(path);
      expect([png.width, png.height]).toEqual([size, size]);
    }

    expect(readPng("public/icons/maskable-icon-512x512.png").hasTransparency).toBe(false);
    expect(readPng("public/icons/apple-touch-icon.png").hasTransparency).toBe(false);
  });

  it("keeps every installed-icon corner opaque and free of white framing", async () => {
    for (const path of [
      "public/icons/pwa-64x64.png",
      "public/icons/pwa-192x192.png",
      "public/icons/pwa-512x512.png",
      "public/icons/maskable-icon-512x512.png",
      "public/icons/apple-touch-icon.png",
    ]) {
      for (const [red, green, blue, alpha] of await readCornerPixels(path)) {
        expect(alpha, `${path} must be full bleed`).toBe(255);
        expect(red > 245 && green > 245 && blue > 245, `${path} must not have a white frame`).toBe(
          false,
        );
      }
    }
  });

  it("declares the maskable launcher asset and removes the generic logo name", () => {
    const viteConfig = read("vite.config.ts");
    expect(viteConfig).toContain('src: "icons/maskable-icon-512x512.png"');
    expect(viteConfig).toContain('purpose: "maskable"');
    expect(read("pwa-assets.config.ts")).toContain("padding: 0");
    expect(existsSync(resolve(ROOT, "public/icons/logo.svg"))).toBe(false);
  });
});
