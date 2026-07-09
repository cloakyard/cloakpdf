/**
 * Minimal, dependency-free ZIP writer (STORED / no compression).
 *
 * We used to pull in JSZip just to bundle a handful of files into one download.
 * Every payload we zip is *already-compressed* data — rendered PNG page images
 * or PDF pages — so DEFLATE buys essentially nothing, and JSZip was already
 * storing them uncompressed at its default level. That makes the job a plain
 * STORED-method ZIP (PKZIP APPNOTE): per-file local headers, a central
 * directory, and an end-of-central-directory record. No compression, no ZIP64
 * (guarded — these archives are a few MB), so it's ~100 lines we can own.
 *
 * Output is verified by extracting it with the system `unzip` and byte-diffing
 * against the inputs; the structure is also pinned in tests/unit/zip.test.ts.
 */

export type ZipData = Uint8Array | ArrayBuffer | Blob;

export interface ZipEntry {
  /** File name inside the archive (UTF-8; forward slashes for folders). */
  name: string;
  data: ZipData;
}

// CRC-32 (IEEE 802.3, reflected polynomial 0xEDB88320) — required per ZIP entry.
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function toBytes(data: ZipData): Promise<Uint8Array> {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(await data.arrayBuffer()); // Blob
}

const U32_MAX = 0xffffffff;
// Fixed, deterministic DOS timestamp = 1980-01-01 00:00:00 (the ZIP epoch).
const DOS_DATE = 0x21;
const DOS_TIME = 0x00;
const UTF8_FLAG = 0x0800; // general-purpose bit 11: file names are UTF-8

/**
 * Build a STORED (uncompressed) ZIP archive from `entries` and return it as a
 * `application/zip` Blob. Throws if the archive would exceed 4 GB (needs ZIP64)
 * or hold more than 65 535 entries.
 */
export async function makeZip(entries: ZipEntry[]): Promise<Blob> {
  const encoder = new TextEncoder();
  const files = await Promise.all(
    entries.map(async (e) => {
      const data = await toBytes(e.data);
      return { name: encoder.encode(e.name), data, crc: crc32(data) };
    }),
  );
  if (files.length > 0xffff) throw new Error("ZIP holds too many entries (max 65535).");

  let localSize = 0;
  let centralSize = 0;
  for (const f of files) {
    if (f.data.length > U32_MAX) throw new Error("ZIP entry too large (ZIP64 unsupported).");
    localSize += 30 + f.name.length + f.data.length;
    centralSize += 46 + f.name.length;
  }
  const total = localSize + centralSize + 22;
  if (total > U32_MAX) throw new Error("ZIP too large (ZIP64 unsupported).");

  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  const offsets: number[] = [];
  let off = 0;

  // Local file header + stored data, one per entry.
  for (const f of files) {
    offsets.push(off);
    view.setUint32(off, 0x04034b50, true); // local file header signature
    view.setUint16(off + 4, 20, true); // version needed to extract (2.0)
    view.setUint16(off + 6, UTF8_FLAG, true);
    view.setUint16(off + 8, 0, true); // method: 0 = stored
    view.setUint16(off + 10, DOS_TIME, true);
    view.setUint16(off + 12, DOS_DATE, true);
    view.setUint32(off + 14, f.crc, true);
    view.setUint32(off + 18, f.data.length, true); // compressed size == size
    view.setUint32(off + 22, f.data.length, true); // uncompressed size
    view.setUint16(off + 26, f.name.length, true);
    view.setUint16(off + 28, 0, true); // extra field length
    out.set(f.name, off + 30);
    out.set(f.data, off + 30 + f.name.length);
    off += 30 + f.name.length + f.data.length;
  }

  // Central directory.
  const centralStart = off;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    view.setUint32(off, 0x02014b50, true); // central directory header signature
    view.setUint16(off + 4, 20, true); // version made by
    view.setUint16(off + 6, 20, true); // version needed
    view.setUint16(off + 8, UTF8_FLAG, true);
    view.setUint16(off + 10, 0, true); // method: stored
    view.setUint16(off + 12, DOS_TIME, true);
    view.setUint16(off + 14, DOS_DATE, true);
    view.setUint32(off + 16, f.crc, true);
    view.setUint32(off + 20, f.data.length, true);
    view.setUint32(off + 24, f.data.length, true);
    view.setUint16(off + 28, f.name.length, true);
    view.setUint16(off + 30, 0, true); // extra length
    view.setUint16(off + 32, 0, true); // comment length
    view.setUint16(off + 34, 0, true); // disk number start
    view.setUint16(off + 36, 0, true); // internal attributes
    view.setUint32(off + 38, 0, true); // external attributes
    view.setUint32(off + 42, offsets[i], true); // local header offset
    out.set(f.name, off + 46);
    off += 46 + f.name.length;
  }

  // End of central directory record.
  view.setUint32(off, 0x06054b50, true);
  view.setUint16(off + 4, 0, true); // this disk number
  view.setUint16(off + 6, 0, true); // disk with central directory
  view.setUint16(off + 8, files.length, true); // entries on this disk
  view.setUint16(off + 10, files.length, true); // total entries
  view.setUint32(off + 12, off - centralStart, true); // central directory size
  view.setUint32(off + 16, centralStart, true); // central directory offset
  view.setUint16(off + 20, 0, true); // comment length

  return new Blob([out], { type: "application/zip" });
}
