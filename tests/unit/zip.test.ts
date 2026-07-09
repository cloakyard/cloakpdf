/**
 * Unit tests for the self-contained STORED ZIP writer (zip.ts).
 *
 * Real-decoder round-tripping (system `unzip -t` + `ditto` extraction, byte
 * diff) was verified out-of-band. Here we parse the archive back with a tiny
 * independent reader and pin the structure: correct signatures, entry names,
 * byte-identical STORED payloads, CRC-32s, the UTF-8 name flag, and that the
 * three accepted input shapes (Uint8Array / ArrayBuffer / Blob) all work.
 */
import { describe, expect, it } from "vitest";
import { makeZip, type ZipEntry } from "../../src/utils/zip.ts";

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

interface ReadEntry {
  name: string;
  data: Uint8Array;
  crc: number;
  flags: number;
}

/** Minimal STORED-only reader used purely to validate the writer's output. */
function readZip(buf: Uint8Array): ReadEntry[] {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const dec = new TextDecoder();
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  expect(eocd).toBeGreaterThanOrEqual(0);
  const count = view.getUint16(eocd + 10, true);
  let off = view.getUint32(eocd + 16, true);
  const out: ReadEntry[] = [];
  for (let e = 0; e < count; e++) {
    expect(view.getUint32(off, true)).toBe(0x02014b50); // central dir signature
    const crc = view.getUint32(off + 16, true);
    const size = view.getUint32(off + 24, true);
    const nameLen = view.getUint16(off + 28, true);
    const extraLen = view.getUint16(off + 30, true);
    const commentLen = view.getUint16(off + 32, true);
    const localOff = view.getUint32(off + 42, true);
    const name = dec.decode(buf.subarray(off + 46, off + 46 + nameLen));
    expect(view.getUint32(localOff, true)).toBe(0x04034b50); // local header signature
    const flags = view.getUint16(localOff + 6, true);
    const lNameLen = view.getUint16(localOff + 26, true);
    const lExtraLen = view.getUint16(localOff + 28, true);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    out.push({
      name,
      data: buf.subarray(dataStart, dataStart + size),
      crc,
      flags,
    });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

async function toBytes(entries: ZipEntry[]): Promise<Uint8Array> {
  const blob = await makeZip(entries);
  expect(blob.type).toBe("application/zip");
  return new Uint8Array(await blob.arrayBuffer());
}

describe("makeZip", () => {
  it("stores every entry byte-identically with a correct CRC-32", async () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array(1000).map((_, i) => (i * 37) & 0xff);
    const zip = await toBytes([
      { name: "a.pdf", data: a },
      { name: "sub/b.png", data: b },
    ]);
    const read = readZip(zip);
    expect(read.map((e) => e.name)).toEqual(["a.pdf", "sub/b.png"]);
    expect(read[0].data).toEqual(a);
    expect(read[1].data).toEqual(b);
    expect(read[0].crc).toBe(crc32(a));
    expect(read[1].crc).toBe(crc32(b));
  });

  it("handles empty files and marks names UTF-8", async () => {
    const zip = await toBytes([
      { name: "empty.txt", data: new Uint8Array(0) },
      { name: "café.png", data: new Uint8Array([9]) },
    ]);
    const read = readZip(zip);
    expect(read[0].data.length).toBe(0);
    expect(read[0].crc).toBe(0); // CRC-32 of nothing is 0
    for (const e of read) expect(e.flags & 0x0800).toBe(0x0800); // UTF-8 flag
    expect(read[1].name).toBe("café.png");
  });

  it("accepts Uint8Array, ArrayBuffer, and Blob payloads", async () => {
    const raw = new Uint8Array([10, 20, 30]);
    const zip = await toBytes([
      { name: "u8.bin", data: raw },
      { name: "ab.bin", data: raw.buffer.slice(0) },
      { name: "blob.bin", data: new Blob([raw]) },
    ]);
    const read = readZip(zip);
    expect(read).toHaveLength(3);
    for (const e of read) expect(new Uint8Array(e.data)).toEqual(raw);
  });

  it("records the entry count in the end-of-central-directory record", async () => {
    const zip = await toBytes(
      Array.from({ length: 12 }, (_, i) => ({ name: `p${i}.pdf`, data: new Uint8Array([i]) })),
    );
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    let eocd = -1;
    for (let i = zip.length - 22; i >= 0; i--)
      if (view.getUint32(i, true) === 0x06054b50) {
        eocd = i;
        break;
      }
    expect(view.getUint16(eocd + 10, true)).toBe(12);
  });
});
