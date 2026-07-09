/**
 * Minimal, dependency-free QR Code (Model 2) encoder.
 *
 * We used to pull in the `qrcode-generator` package for this; the encoder is
 * small and well-specified, so we do it ourselves and drop the dependency. The
 * only thing the app needs is "turn a short URL / case number / hash into a
 * scannable matrix", so this implements exactly that and no more:
 *
 *   - **Byte mode only** (ISO/IEC 18004 mode `0100`, UTF-8 bytes). Numeric and
 *     alphanumeric modes would pack a few more chars per version, but byte mode
 *     encodes *anything* and every payload we stamp (URLs, IDs, hashes) is a
 *     mix of characters that would fall back to byte mode anyway.
 *   - **Versions 1–40**, auto-selected as the smallest that fits.
 *   - **All four EC levels**, callers pick (the app uses "M").
 *   - **Automatic mask selection** by the standard penalty rules, so the output
 *     is robust for real scanners.
 *
 * The algorithm follows ISO/IEC 18004. The structure (Galois-field maths,
 * Reed-Solomon divisor/remainder, the ECC/interleave tables, and the module
 * layout with penalty-based masking) mirrors the canonical reference designs
 * for QR generation. Output is verified end-to-end by decoding it back to the
 * source string in tests/unit/qr.test.ts.
 */

export type QrEcl = "L" | "M" | "Q" | "H";

export interface QrMatrix {
  /** Modules per side: 21 (version 1) … 177 (version 40). */
  size: number;
  /** Whether the module at (row = y, col = x) is dark. */
  isDark(row: number, col: number): boolean;
}

// ── Galois field GF(256), primitive polynomial 0x11d ─────────────────────────

const GF_EXP = new Uint8Array(256);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  GF_EXP[255] = GF_EXP[0]; // α^255 == α^0 == 1, lets us index without a modulo edge case
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
}

// ── Reed-Solomon error correction ────────────────────────────────────────────

/** Coefficients of the degree-`n` RS generator polynomial (leading 1 implied). */
function rsDivisor(degree: number): Uint8Array {
  const result = new Uint8Array(degree);
  result[degree - 1] = 1; // start with the monomial x^0
  let root = 1;
  for (let i = 0; i < degree; i++) {
    // Multiply the current product by (x − α^i).
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 2);
  }
  return result;
}

/** RS remainder (the EC codewords) of `data` divided by `divisor`. */
function rsRemainder(data: Uint8Array, divisor: Uint8Array): Uint8Array {
  const result = new Uint8Array(divisor.length);
  for (const b of data) {
    const factor = b ^ result[0];
    result.copyWithin(0, 1);
    result[result.length - 1] = 0;
    for (let i = 0; i < result.length; i++) result[i] ^= gfMul(divisor[i], factor);
  }
  return result;
}

// ── Per-version / per-level capacity tables (ISO/IEC 18004 Annex) ─────────────
// Indexed [version], version 1..40 (index 0 is an unused placeholder).

const ECC_CODEWORDS_PER_BLOCK: Record<QrEcl, readonly number[]> = {
  L: [
    -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30,
    30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  M: [
    -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
  Q: [
    -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30,
    30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  H: [
    -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
};

const NUM_EC_BLOCKS: Record<QrEcl, readonly number[]> = {
  L: [
    -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14,
    15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  M: [
    -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23,
    25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
  Q: [
    -1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34,
    34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  H: [
    -1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35,
    37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
};

/** 2-bit format code carried in the format-information area. */
const ECL_FORMAT_BITS: Record<QrEcl, number> = { L: 1, M: 0, Q: 3, H: 2 };

/** Total data-plus-EC modules available for a version (before the /8 to codewords). */
function numRawDataModules(ver: number): number {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (ver >= 7) result -= 36; // version-information modules
  }
  return result;
}

/** Number of usable data codewords (8-bit) for a version at an EC level. */
function numDataCodewords(ver: number, ecl: QrEcl): number {
  return (
    Math.floor(numRawDataModules(ver) / 8) -
    ECC_CODEWORDS_PER_BLOCK[ecl][ver] * NUM_EC_BLOCKS[ecl][ver]
  );
}

/** Centre coordinates of the alignment patterns for a version (empty for v1). */
function alignmentPositions(ver: number): number[] {
  if (ver === 1) return [];
  const size = ver * 4 + 17;
  const numAlign = Math.floor(ver / 7) + 2;
  const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}

// ── Bit helpers ──────────────────────────────────────────────────────────────

function getBit(value: number, i: number): boolean {
  return ((value >>> i) & 1) !== 0;
}

// ── Encoder ──────────────────────────────────────────────────────────────────

/**
 * Encode `text` (UTF-8, byte mode) as a QR matrix at EC level `ecl` (default M).
 * Throws if the payload is too long for the largest QR version at that level.
 */
export function encodeQr(text: string, ecl: QrEcl = "M"): QrMatrix {
  const bytes = new TextEncoder().encode(text);

  // Smallest version whose data capacity holds mode + char-count + payload.
  let version = 1;
  for (; ; version++) {
    if (version > 40) throw new Error("QR payload too long to encode.");
    const capacityBits = numDataCodewords(version, ecl) * 8;
    const charCountBits = version <= 9 ? 8 : 16; // byte mode
    const usedBits = 4 + charCountBits + bytes.length * 8;
    if (usedBits <= capacityBits) break;
  }

  const size = version * 4 + 17;
  const dataCapacity = numDataCodewords(version, ecl);
  const charCountBits = version <= 9 ? 8 : 16;

  // 1. Build the bit stream: mode (byte=0100), char count, payload bytes.
  const bits: number[] = [];
  const appendBits = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  appendBits(0b0100, 4);
  appendBits(bytes.length, charCountBits);
  for (const b of bytes) appendBits(b, 8);

  // 2. Terminator + pad to a byte boundary + alternating pad bytes.
  const capacityBits = dataCapacity * 8;
  appendBits(0, Math.min(4, capacityBits - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  const dataCodewords = new Uint8Array(dataCapacity);
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    dataCodewords[i / 8] = byte;
  }
  for (let i = bits.length / 8, pad = 0xec; i < dataCapacity; i++, pad ^= 0xec ^ 0x11) {
    dataCodewords[i] = pad;
  }

  // 3. Split into blocks, compute EC codewords, interleave.
  const allCodewords = addEccAndInterleave(dataCodewords, version, ecl);

  // 4. Lay out the matrix and pick the best mask.
  return buildMatrix(allCodewords, version, ecl, size);
}

/** Split data into EC blocks, append Reed-Solomon codewords, and interleave. */
function addEccAndInterleave(data: Uint8Array, version: number, ecl: QrEcl): Uint8Array {
  const numBlocks = NUM_EC_BLOCKS[ecl][version];
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl][version];
  const rawCodewords = Math.floor(numRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockDataLen = Math.floor(rawCodewords / numBlocks) - blockEccLen;

  const divisor = rsDivisor(blockEccLen);
  const blocks: Uint8Array[] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dataLen = shortBlockDataLen + (i < numShortBlocks ? 0 : 1);
    const dat = data.slice(k, k + dataLen);
    k += dataLen;
    const ecc = rsRemainder(dat, divisor);
    const block = new Uint8Array(dataLen + blockEccLen);
    block.set(dat, 0);
    block.set(ecc, dataLen);
    blocks.push(block);
  }

  // Interleave: column-major over data codewords, then over EC codewords.
  const result = new Uint8Array(rawCodewords);
  let idx = 0;
  const maxData = shortBlockDataLen + 1;
  for (let i = 0; i < maxData; i++) {
    for (let b = 0; b < numBlocks; b++) {
      // Short blocks are one data codeword shorter — skip their missing column.
      if (i < shortBlockDataLen + (b < numShortBlocks ? 0 : 1)) {
        result[idx++] = blocks[b][i];
      }
    }
  }
  for (let i = 0; i < blockEccLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      result[idx++] = blocks[b][blocks[b].length - blockEccLen + i];
    }
  }
  return result;
}

/** Draw function patterns, place data, choose the lowest-penalty mask. */
function buildMatrix(codewords: Uint8Array, version: number, ecl: QrEcl, size: number): QrMatrix {
  const grid = (): boolean[][] =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  const modules: boolean[][] = grid();
  const isFunction: boolean[][] = grid();

  const setFn = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };

  // Timing patterns.
  for (let i = 0; i < size; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }

  // Finder patterns (+ their separators) at the three corners.
  const drawFinder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, dist !== 2 && dist !== 4);
      }
    }
  };
  drawFinder(3, 3);
  drawFinder(size - 4, 3);
  drawFinder(3, size - 4);

  // Alignment patterns (skip the three overlapping the finder corners).
  const align = alignmentPositions(version);
  const n = align.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
      const cx = align[i];
      const cy = align[j];
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          setFn(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }

  // Reserve the format-info area (real bits written after masking) and, for
  // v7+, write the version-information blocks.
  drawFormatBits(0, size, setFn, ecl);
  drawVersion(version, size, setFn);

  // Zig-zag data placement over the non-function modules.
  let bitIdx = 0;
  const totalBits = codewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip the vertical timing column
    for (let v = 0; v < size; v++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - v : v;
        if (!isFunction[y][x] && bitIdx < totalBits) {
          modules[y][x] = getBit(codewords[bitIdx >>> 3], 7 - (bitIdx & 7));
          bitIdx++;
        }
      }
    }
  }

  // Try all eight masks, keep the lowest penalty.
  let bestMask = 0;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(mask, modules, isFunction, size);
    drawFormatBits(mask, size, setFn, ecl);
    const penalty = penaltyScore(modules, size);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
    }
    applyMask(mask, modules, isFunction, size); // XOR again to undo
  }
  applyMask(bestMask, modules, isFunction, size);
  drawFormatBits(bestMask, size, setFn, ecl);

  return { size, isDark: (row, col) => modules[row][col] };
}

/** Write the 15-bit BCH-protected format information for a given mask. */
function drawFormatBits(
  mask: number,
  size: number,
  setFn: (x: number, y: number, dark: boolean) => void,
  ecl: QrEcl,
): void {
  const data = (ECL_FORMAT_BITS[ecl] << 3) | mask; // 5 bits
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412; // 15-bit format string

  // First copy, wrapping the top-left finder.
  for (let i = 0; i <= 5; i++) setFn(8, i, getBit(bits, i));
  setFn(8, 7, getBit(bits, 6));
  setFn(8, 8, getBit(bits, 7));
  setFn(7, 8, getBit(bits, 8));
  for (let i = 9; i < 15; i++) setFn(14 - i, 8, getBit(bits, i));

  // Second copy, split under the top-right and left of the bottom-left finder.
  for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, getBit(bits, i));
  for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, getBit(bits, i));
  setFn(8, size - 8, true); // always-dark module
}

/** Write the 18-bit version information (versions 7 and up). */
function drawVersion(
  version: number,
  size: number,
  setFn: (x: number, y: number, dark: boolean) => void,
): void {
  if (version < 7) return;
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  const bits = (version << 12) | rem; // 18 bits
  for (let i = 0; i < 18; i++) {
    const bit = getBit(bits, i);
    const a = size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    setFn(a, b, bit);
    setFn(b, a, bit);
  }
}

/** XOR the mask pattern over data modules (idempotent — call twice to undo). */
function applyMask(
  mask: number,
  modules: boolean[][],
  isFunction: boolean[][],
  size: number,
): void {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (isFunction[y][x]) continue;
      let invert = false;
      switch (mask) {
        case 0:
          invert = (x + y) % 2 === 0;
          break;
        case 1:
          invert = y % 2 === 0;
          break;
        case 2:
          invert = x % 3 === 0;
          break;
        case 3:
          invert = (x + y) % 3 === 0;
          break;
        case 4:
          invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
          break;
        case 5:
          invert = ((x * y) % 2) + ((x * y) % 3) === 0;
          break;
        case 6:
          invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
          break;
        case 7:
          invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
          break;
      }
      if (invert) modules[y][x] = !modules[y][x];
    }
  }
}

/** The four standard penalty rules used to pick the least-disruptive mask. */
function penaltyScore(modules: boolean[][], size: number): number {
  let penalty = 0;
  const N1 = 3;
  const N2 = 3;
  const N3 = 40;
  const N4 = 10;

  // Rule 1: runs of 5+ same-colour modules in each row and column.
  for (let y = 0; y < size; y++) {
    let runColor = false;
    let runLen = 0;
    for (let x = 0; x < size; x++) {
      if (modules[y][x] === runColor) {
        runLen++;
        if (runLen === 5) penalty += N1;
        else if (runLen > 5) penalty++;
      } else {
        runColor = modules[y][x];
        runLen = 1;
      }
    }
  }
  for (let x = 0; x < size; x++) {
    let runColor = false;
    let runLen = 0;
    for (let y = 0; y < size; y++) {
      if (modules[y][x] === runColor) {
        runLen++;
        if (runLen === 5) penalty += N1;
        else if (runLen > 5) penalty++;
      } else {
        runColor = modules[y][x];
        runLen = 1;
      }
    }
  }

  // Rule 2: 2x2 blocks of the same colour.
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) {
        penalty += N2;
      }
    }
  }

  // Rule 3: finder-like 1:1:3:1:1 patterns (with a 4-module light margin).
  const hasPattern = (get: (i: number) => boolean, i: number): boolean => {
    // dark light dark dark dark light dark, bordered one side by 4 light.
    const p = [true, false, true, true, true, false, true];
    for (let k = 0; k < 7; k++) if (get(i + k) !== p[k]) return false;
    return true;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x <= size - 7; x++) {
      if (hasPattern((i) => modules[y][i], x)) {
        if (x - 4 < 0 || allLight((i) => modules[y][i], x - 4, x)) penalty += N3;
        if (x + 7 + 4 > size || allLight((i) => modules[y][i], x + 7, x + 11)) penalty += N3;
      }
    }
  }
  for (let x = 0; x < size; x++) {
    for (let y = 0; y <= size - 7; y++) {
      if (hasPattern((i) => modules[i][x], y)) {
        if (y - 4 < 0 || allLight((i) => modules[i][x], y - 4, y)) penalty += N3;
        if (y + 7 + 4 > size || allLight((i) => modules[i][x], y + 7, y + 11)) penalty += N3;
      }
    }
  }

  // Rule 4: overall dark/light balance.
  let dark = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (modules[y][x]) dark++;
  const total = size * size;
  const ratio = (dark * 20) / total; // 0..20
  const dev = Math.floor(Math.abs(ratio - 10)); // steps of 5% from 50%
  penalty += dev * N4;

  return penalty;
}

/** True if [from, to) modules under `get` are all light (used by penalty rule 3). */
function allLight(get: (i: number) => boolean, from: number, to: number): boolean {
  for (let i = from; i < to; i++) if (get(i)) return false;
  return true;
}
