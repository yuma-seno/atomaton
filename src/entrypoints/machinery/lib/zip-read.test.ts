import { describe, expect, test } from "bun:test";
import { crc32, deflateRawSync } from "node:zlib";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { zipEntries } from "./zip-read.ts";

/**
 * A zip laid out byte for byte, so the reader is tested against the format itself
 * rather than against this tree's own writer. STORED entries need no deflate
 * table; a DEFLATED one comes from `zlib.deflateRawSync`, which is the format's
 * method 8 with no wrapper — the same bytes `zip` writes.
 */
function zip(name: string, entries: Array<{ name: string; content: string; deflate?: boolean }>): string {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  const count = entries.length;

  for (const entry of entries) {
    const raw = Buffer.from(entry.content, "utf8");
    const data = entry.deflate ? Buffer.from(deflateRaw(raw)) : raw;
    const crc = crc32(data);
    const nameBytes = Buffer.from(entry.name, "utf8");
    const method = entry.deflate ? 8 : 0;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    parts.push(local, nameBytes, data);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(method, 10);
    header.writeUInt32LE(crc, 16);
    header.writeUInt32LE(data.length, 20);
    header.writeUInt32LE(raw.length, 24);
    header.writeUInt16LE(nameBytes.length, 28);
    header.writeUInt32LE(offset, 42);
    central.push(header, nameBytes);

    offset += local.length + nameBytes.length + data.length;
  }

  const directory = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(count, 8);
  eocd.writeUInt16LE(count, 10);
  eocd.writeUInt32LE(directory.length, 12);
  eocd.writeUInt32LE(offset, 16);

  const path = join(mkdtempSync(join(tmpdir(), "zip-read-")), name);
  writeFileSync(path, Buffer.concat([...parts, directory, eocd]));
  return path;
}

/** Raw DEFLATE, as the zip format stores it — no zlib header or checksum. */
function deflateRaw(data: Buffer): Uint8Array {
  return deflateRawSync(data);
}

describe("zipEntries", () => {
  test("reads every stored entry, in a subdirectory too", () => {
    const path = zip("stored.zip", [
      { name: "a.yaml", content: "key: one\n" },
      { name: "dir/b.yaml", content: "key: two\n" },
    ]);
    const result = zipEntries(path);
    if (!("entries" in result)) throw new Error("expected entries");
    expect(result.entries.get("a.yaml")).toBe("key: one\n");
    expect(result.entries.get("dir/b.yaml")).toBe("key: two\n");
  });

  test("a deflated entry expands to its original bytes", () => {
    const path = zip("deflated.zip", [{ name: "text.md", content: "# header\n\nsome body\n", deflate: true }]);
    const result = zipEntries(path);
    if (!("entries" in result)) throw new Error("expected entries");
    expect(result.entries.get("text.md")).toBe("# header\n\nsome body\n");
  });

  test("a directory member is not an entry", () => {
    const path = zip("dirs.zip", [
      { name: "dir/", content: "" },
      { name: "dir/f.txt", content: "x\n" },
    ]);
    const result = zipEntries(path);
    if (!("entries" in result)) throw new Error("expected entries");
    expect([...result.entries.keys()]).toEqual(["dir/f.txt"]);
  });

  test("not a zip at all is a reason, not an empty map", () => {
    const path = join(mkdtempSync(join(tmpdir(), "zip-read-")), "plain.txt");
    writeFileSync(path, "just some text");
    const result = zipEntries(path);
    expect("why" in result).toBe(true);
    if ("why" in result) expect(result.why).toContain("does not end like a zip");
  });

  /**
   * The entry count is the one field a truncated write corrupts cheaply, and the
   * failure must be loud: an archive read as FEWER entries than it holds is how
   * "the release did not ship this" could be invented out of thin air.
   */
  test("a central directory that lies about its count is refused", () => {
    const path = zip("lied.zip", [{ name: "a", content: "1\n" }, { name: "b", content: "2\n" }]);
    const buf = readFileSync(path);
    // The EOCD sits 22 bytes up from the end of a comment-less archive.
    buf.writeUInt16LE(99, buf.length - 22 + 10);
    writeFileSync(path, buf);
    const result = zipEntries(path);
    expect("why" in result).toBe(true);
    if ("why" in result) expect(result.why).toContain("central directory ends");
  });
});
