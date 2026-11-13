import { deflateSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";

function crc32(buf: Uint8Array): number {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]!) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), Buffer.from(data)]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

const w = 200, h = 140;
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(w, 0);
ihdr.writeUInt32BE(h, 4);
ihdr[8] = 8;
ihdr[9] = 2;

const raw = Buffer.alloc(h * (1 + w * 3));
let off = 0;
const cx = w / 2, cy = h / 2, r = 48;
for (let y = 0; y < h; y++) {
  raw[off++] = 0;
  for (let x = 0; x < w; x++) {
    const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    if (Math.abs(d - r) <= 3) {
      raw[off++] = 245; raw[off++] = 245; raw[off++] = 245;
    } else {
      raw[off++] = Math.floor(40 + 100 * x / w);
      raw[off++] = Math.floor(180 - 120 * y / h);
      raw[off++] = Math.floor(140 + 80 * Math.sin((x + y) / 30));
    }
  }
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", new Uint8Array(0)),
]);
const dest = "/tmp/atomaton-workspace/attach-test/final-check.png";
writeFileSync(dest, png);

const back = readFileSync(dest);
const sig = back.subarray(0, 8).toString("hex");
const type = back.subarray(12, 16).toString("ascii");
const width = back.readUInt32BE(16);
const height = back.readUInt32BE(20);
console.log(`signature=${sig} firstChunk=${type} ${width}x${height} bytes=${back.length}`);
if (sig !== "89504e470d0a1a0a" || type !== "IHDR" || width !== w || height !== h) {
  throw new Error("PNG validation failed");
}
console.log("OK");
