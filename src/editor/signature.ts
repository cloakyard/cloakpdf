import type { FractionRect } from "./types.ts";

export interface SignatureImage {
  dataUrl: string;
  aspect: number;
}

/** Keep the entire image on the visible page, including very tall uploads. */
export function signatureRect(
  aspect: number,
  page: { widthPt: number; heightPt: number },
  x = 0.5,
  y = 0.5,
): FractionRect {
  const height = (0.28 * page.widthPt) / page.heightPt / aspect;
  const scale = Math.min(1, 0.8 / height);
  const wPct = 0.28 * scale;
  const hPct = height * scale;
  return {
    xPct: Math.max(0, Math.min(x - wPct / 2, 1 - wPct)),
    yPct: Math.max(0, Math.min(y - hPct / 2, 1 - hPct)),
    wPct,
    hPct,
  };
}

/** Decode once, normalize paper or add an opaque backing, and release the scratch
 * canvas on every path. Existing alpha (including white ink) stays intact. */
export async function prepareSignature(
  source: File | string,
  options: { signal?: AbortSignal; background?: string } = {},
): Promise<SignatureImage> {
  const { signal, background } = options;
  signal?.throwIfAborted();
  if (
    source instanceof File &&
    (source.size > 20 * 1024 * 1024 || !/^image\/(png|jpeg)$/.test(source.type))
  ) {
    throw new Error("Choose a PNG or JPEG image up to 20 MB.");
  }
  const url = source instanceof File ? URL.createObjectURL(source) : source;
  const img = new Image();
  const canvas = document.createElement("canvas");
  let abort: (() => void) | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error("This image could not be opened. Choose another PNG or JPEG."));
      abort = () => reject(new DOMException("Image read cancelled", "AbortError"));
      signal?.addEventListener("abort", abort, { once: true });
      img.src = url;
    });
    signal?.throwIfAborted();
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h || w * h > 16_000_000)
      throw new Error("Choose an image with up to 16 million pixels.");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: !background });
    if (!ctx) throw new Error("Image preparation is unavailable. Try again.");
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0);
    if (!background) {
      const image = ctx.getImageData(0, 0, w, h);
      const px = image.data;
      let translucent = 0;
      for (let i = 3; i < px.length; i += 4) if (px[i] < 250) translucent++;
      if (translucent / (w * h) <= 0.005) {
        for (let i = 0; i < px.length; i += 4) {
          const min = Math.min(px[i], px[i + 1], px[i + 2]);
          if (min > 210) px[i + 3] = Math.round(px[i + 3] * Math.max(0, (245 - min) / 35));
        }
        ctx.putImageData(image, 0, 0);
      }
    }
    return { dataUrl: canvas.toDataURL("image/png"), aspect: w / h };
  } finally {
    if (abort) signal?.removeEventListener("abort", abort);
    img.onload = img.onerror = null;
    img.src = "";
    if (source instanceof File) URL.revokeObjectURL(url);
    canvas.width = canvas.height = 0;
  }
}
