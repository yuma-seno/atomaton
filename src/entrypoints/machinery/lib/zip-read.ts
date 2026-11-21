/**
 * zip-read.ts — the release asset's entries as UTF-8 text, without a zip binary.
 *
 * The delivery asset is produced by `publish-release.sh` and read back here. The
 * reader is in this tree rather than delegated to `unzip` because the reader is
 * load-bearing in both directions at once now: the notice and the update both
 * answer "what does this release actually hold", and an environment without the
 * binary would silently degrade every one of those answers into "not computed".
 * Bun ships `zlib`, so the archive's two methods — STORED (0) and DEFLATE (8) —
 * cover every zip `zip` and `publish-release.sh` write, on every platform this
 * runs on. One definition of "read this archive", no dependency on what a runner
 * image happens to have installed.
 *
 * The zip format here is only what such a file can contain: local file headers,
 * one central directory, and an end record. Encrypted and multi-disk archives are
 * out of scope by construction — `publish-release.sh` writes a plain zip — so an
 * entry that claims either is refused rather than half-read.
 */
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;
/** The EOCD is at most 22 bytes plus a comment; the comment field may hold 64Ki. */
const EOCD_MAX_SEARCH = 22 + 0xffff;

/** An entry as read: the name, the method, and the compressed bytes, ready to expand. */
interface ZipEntry {
  readonly name: string;
  readonly method: number;
  readonly compressed: Uint8Array;
}

/**
 * Every text entry of the zip at `path`, name → content.
 *
 * Directories are not entries here even when the archive carries them — a
 * directory member is a zero-byte entry with a trailing slash, and the update
 * machinery only answers questions about files. Repeated names keep the first
 * (the format allows duplicates; archives in the wild practically never carry
 * them, and if one turns up it means the producer was rerun over itself).
 */
export function zipEntries(path: string): { entries: Map<string, string> } | { why: string } {
  let buf: Buffer;
  try {
    buf = readFileSync(path);
  } catch (error) {
    return { why: `could not read the archive at ${path}: ${(error as Error).message}` };
  }

  // Scanning backwards for the EOCD signature: the comment is unbounded from the
  // format's point of view, so the record's position is found, not computed.
  const floor = Math.max(0, buf.length - EOCD_MAX_SEARCH);
  let eocd = -1;
  for (let at = buf.length - 22; at >= floor; at--) {
    if (buf.readUInt32LE(at) === EOCD_SIG) {
      eocd = at;
      break;
    }
  }
  if (eocd === -1) {
    return { why: `${path} does not end like a zip archive (no end-of-central-directory record)` };
  }

  const entryCount = buf.readUInt16LE(eocd + 10);
  const centralOffset = buf.readUInt32LE(eocd + 16);

  const raw: ZipEntry[] = [];
  let at = centralOffset;
  for (let index = 0; index < entryCount; index++) {
    if (at + 46 > buf.length || buf.readUInt32LE(at) !== CENTRAL_SIG) {
      return { why: `${path}'s central directory ends after ${index} of ${entryCount} entries` };
    }
    const method = buf.readUInt16LE(at + 10);
    const compressedSize = buf.readUInt32LE(at + 20);
    const nameLength = buf.readUInt16LE(at + 28);
    const extraLength = buf.readUInt16LE(at + 30);
    const commentLength = buf.readUInt16LE(at + 32);
    const localOffset = buf.readUInt32LE(at + 42);
    const name = buf.subarray(at + 46, at + 46 + nameLength).toString("utf8");

    // A comment on an entry is not in scope; claiming one means an archive this
    // producer does not write, so it is refused rather than half-understood.
    if (commentLength !== 0) {
      return { why: `${path}'s entry ${name} carries a central-directory comment, which this reader does not handle` };
    }

    // The local header holds the size fields again; where they differ, the central
    // values win (that is what the format says a streaming writer leaves zero).
    if (localOffset + 30 > buf.length || buf.readUInt32LE(localOffset) !== LOCAL_SIG) {
      return { why: `${path}'s entry ${name} points at a local header that is not one` };
    }
    const localNameLength = buf.readUInt16LE(localOffset + 26);
    const localExtraLength = buf.readUInt16LE(localOffset + 28);
    const dataAt = localOffset + 30 + localNameLength + localExtraLength;
    if (dataAt + compressedSize > buf.length) {
      return { why: `${path}'s entry ${name} claims more bytes than the archive holds` };
    }

    raw.push({ name, method, compressed: buf.subarray(dataAt, dataAt + compressedSize) });
    at += 46 + nameLength + extraLength + commentLength;
  }

  const entries = new Map<string, string>();
  for (const entry of raw) {
    if (entry.name.endsWith("/")) continue; // a directory member
    let content: string;
    try {
      content = entry.method === 0
        ? Buffer.from(entry.compressed).toString("utf8")
        : inflateRawSync(entry.compressed).toString("utf8");
    } catch (error) {
      return { why: `${path}'s entry ${entry.name} could not be expanded: ${(error as Error).message}` };
    }
    if (!entries.has(entry.name)) entries.set(entry.name, content);
  }
  return { entries };
}
