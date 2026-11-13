import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { crc32 } from "node:zlib";
import {
  ASSET_NAME,
  MAX_RELEASES,
  NOTICE_MARKER,
  releaseWindow,
  UPSTREAM_REPOSITORY,
  type ReleaseNote,
} from "./notify_new_release.ts";
import { RELEASE_MANIFEST } from "../../domain/machinery/machinery-layout.ts";
import { removeTemp, runWithFakeGh, scriptPath, type FakeGhRule } from "./testing/harness.ts";

/**
 * The announcement, against the fake `gh`.
 *
 * Two behaviours are the whole of it and both are silent when wrong: a tree that
 * is up to date must write NOTHING (a scheduled run that writes every time is a
 * repository with one issue per day), and a tree that is behind must leave exactly
 * ONE notice behind however many times it runs.
 *
 * ## Where the upstream manifest comes from, and why the fixture says so twice
 *
 * The deletion list is the difference between two manifests, and WHICH copy of the
 * newer one is read is the defect this file was rewritten for. The tree served at a
 * tag carries the previous release's manifest — self-deploy commits it a release
 * late — so a fixture that only ever had one upstream manifest passed whichever copy
 * the code read.
 *
 * So `reads()` writes two, deliberately different, and only one of them belongs to
 * the release:
 *
 *   - the ASSET carries it, built from `package.json` at build time, and it cannot
 *     lag: `publish-release.sh` refuses to publish unless the tag equals that version;
 *   - the committed copy at the tag is the previous release's, and a regression that
 *     read it would report NOTHING as deleted where this asset reports a path.
 *
 * Every fixture is a checkout-shaped temp directory — the script reads the local
 * manifest off the disk it is run in — and a `gh` that answers the reads it makes.
 * A read that fails is a case of its own, because "could not read" and "nothing
 * newer" are the two answers that must never be confused.
 */

/** Temp directories this file made, removed in one place rather than at every call site. */
const MADE: string[] = [];
afterAll(() => {
  for (const dir of MADE) removeTemp(dir);
});

function temp(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  MADE.push(dir);
  return dir;
}

/** A `.github/atomaton-release.json`, as a release writes one, in a fresh temp directory. */
function checkout(files: string[], version = "v0.1.0"): string {
  const dir = temp("atomaton-new-release-");
  mkdirSync(join(dir, ".github"), { recursive: true });
  writeFileSync(
    join(dir, RELEASE_MANIFEST),
    `${JSON.stringify({ version, files: [RELEASE_MANIFEST, ...files] }, null, 2)}\n`,
  );
  return dir;
}

/**
 * A one-entry zip holding `content` at `name`, built byte for byte.
 *
 * STORED rather than deflated on purpose: an entry with method 0 needs no inflate
 * table to be written, so this stays a plain byte layout rather than an
 * implementation of DEFLATE in a test. `unzip` reads it like any other archive —
 * which is the point, because the script prints one member out of a real release
 * asset and a fixture that faked that would be testing a decoder against a picture
 * of itself.
 */
function oneEntryZip(name: string, content: string): Uint8Array {
  const data = new TextEncoder().encode(content);
  const nameBytes = new TextEncoder().encode(name);
  const crc = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 8); // method 0 = stored
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBytes.length, 28);

  const localRecord = Buffer.concat([local, Buffer.from(nameBytes), data]);
  const centralRecord = Buffer.concat([central, Buffer.from(nameBytes)]);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(centralRecord.length, 12);
  eocd.writeUInt32LE(localRecord.length, 16);

  return Buffer.concat([localRecord, centralRecord, eocd]);
}

/** The release asset a `gh release download` leaves behind: a real zip the script can print from. */
function asset(manifest: { version: string; files: string[] }): string {
  const path = join(temp("atomaton-asset-"), ASSET_NAME);
  writeFileSync(path, oneEntryZip(RELEASE_MANIFEST, JSON.stringify(manifest)));
  return path;
}

/** A manifest as the contents API serves the copy committed at a tag. */
const atTag = (version: string, files: string[]): string =>
  JSON.stringify({ version, files: [RELEASE_MANIFEST, ...files] });

/** One release, as the releases list returns it. */
const release = (tag: string, body = `notes for ${tag}`): ReleaseNote => ({
  tag,
  body,
  url: `https://example.test/${tag}`,
});

/**
 * The reads, as rules — with the two upstream manifests told apart.
 *
 * `shipped` is what the ASSET carries. `committed` is what the tree at the tag
 * serves, and it defaults to the EMPTY list: the previous release's manifest does
 * not carry a path the newest release dropped, which is why reading it reported
 * nothing.
 *
 * ## Why the download rule matches `-D`
 *
 * The fake matches a rule by substring across argv, and the notice BODY quotes the
 * very command being faked — `gh release download <tag> …` sits in the fenced block
 * a person copies. So `["release", "download"]` matches `issue create` too, and a
 * failed-download fixture would silently make the write fail instead. `-D` is the
 * flag only the real call passes, and it makes the rule order-independent.
 */
function reads(
  latest: string,
  options: {
    notes?: ReleaseNote[];
    shipped?: string[];
    committed?: string[];
    notesFail?: boolean;
    assetFail?: boolean;
  } = {},
): FakeGhRule[] {
  return [
    {
      match: [`repos/${UPSTREAM_REPOSITORY}/releases/latest`],
      stdout: JSON.stringify({ tag: latest, url: `https://example.test/${latest}` }),
    },
    {
      match: ["release", "download", "-D", ASSET_NAME],
      ...(options.assetFail
        ? { code: 1, stdout: "no such asset" }
        : {
            writes: [
              {
                name: ASSET_NAME,
                from: asset({
                  version: latest,
                  files: [RELEASE_MANIFEST, ...(options.shipped ?? [".github/workflows/atomaton-check.yml"])],
                }),
              },
            ],
          }),
    },
    {
      match: [`contents/${RELEASE_MANIFEST}`],
      stdout: atTag("v0.1.5", options.committed ?? []),
    },
    {
      match: ["releases?per_page"],
      ...(options.notesFail
        ? { code: 1, stdout: "boom" }
        : { stdout: JSON.stringify(options.notes ?? [release(latest)]) }),
    },
  ];
}

/** A search answering with the open notice's number, or with none. */
const search = (number: number): FakeGhRule => ({
  match: ["issue", "list"],
  stdout: JSON.stringify(
    number === 0
      ? []
      : [{ number, state: "OPEN", body: `${NOTICE_MARKER}\nTemplate release v0.2.0 is available.` }],
  ),
});

/** The `--body` of the one write this run made, or "". */
function writeBody(call: string[]): string {
  const at = call.indexOf("--body");
  return at === -1 ? "" : (call[at + 1] ?? "");
}

/** The value of `flag` in an argv array, or "". */
function flagValue(call: string[], flag: string): string {
  const at = call.indexOf(flag);
  return at === -1 ? "" : (call[at + 1] ?? "");
}

/** A checkout that is behind, with one path the newer release drops. */
function behind(): string {
  return checkout([".github/workflows/atomaton-check.yml", ".github/workflows/atomaton-gone.yml"], "v0.1.0");
}

describe("when a tree is up to date", () => {
  test("nothing is written at all", () => {
    const dir = checkout([".github/workflows/atomaton-check.yml"], "v0.2.0");
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [...reads("v0.2.0"), search(0)],
    });
    expect(r.status).toBe(0);
    const wrote = r.ghCalls.filter((call) => call[1] === "create" || call[1] === "edit" || call[1] === "close");
    expect(wrote, "a run that finds nothing newer must not touch the tracker").toEqual([]);
  });

  /**
   * Catching up is the only way a notice stops being true, and a notice that
   * outlives its comparison is worse than none: the next release would be
   * announced by editing an issue about a version that is no longer waiting.
   */
  test("a notice left open after the upgrade is closed, and no new one is opened", () => {
    const dir = checkout([".github/workflows/atomaton-check.yml"], "v0.2.0");
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [...reads("v0.2.0"), search(7), { match: ["issue", "close"] }],
    });
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((call) => call[1] === "create" || call[1] === "edit")).toEqual([]);

    const closed = r.ghCalls.filter((call) => call[1] === "close");
    expect(closed).toHaveLength(1);
    expect(closed[0]).toContain("7");
    // The closing comment says which machinery did it, and carries the marker so a
    // reopened issue is still findable the same way.
    const comment = flagValue(closed[0] ?? [], "--comment");
    expect(comment).toContain(NOTICE_MARKER);
    expect(comment).toContain("v0.2.0");
  });
});

describe("when a tree is behind", () => {
  test("one issue is opened, naming both versions", () => {
    const dir = behind();
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [
        ...reads("v0.2.0", { notes: [release("v0.2.0"), release("v0.1.5"), release("v0.1.0")] }),
        search(0),
        { match: ["issue", "create"], stdout: "https://example.test/issues/9" },
      ],
    });
    expect(r.status).toBe(0);

    const created = r.ghCalls.filter((call) => call[1] === "create");
    expect(created).toHaveLength(1);
    const title = flagValue(created[0] ?? [], "--title");
    expect(title).toContain("v0.2.0");
    expect(title).toContain("v0.1.0");

    const body = writeBody(created[0] ?? []);
    expect(body, "the marker is what keeps this to one notice").toContain(NOTICE_MARKER);
    // Both versions, and the command that takes it.
    expect(body).toContain("v0.1.0");
    expect(body).toContain("v0.2.0");
    expect(body).toContain(`${UPSTREAM_REPOSITORY} -p ${ASSET_NAME}`);
  });

  test("the notes carried are the ones between the two, and no others", () => {
    const dir = behind();
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [
        ...reads("v0.2.0", { notes: [release("v0.2.0"), release("v0.1.5"), release("v0.1.0"), release("v0.0.9")] }),
        search(0),
        { match: ["issue", "create"] },
      ],
    });
    expect(r.status).toBe(0);
    const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
    expect(body).toContain("notes for v0.2.0");
    expect(body).toContain("notes for v0.1.5");
    // Every release already here, and older ones, stay out of it.
    expect(body).not.toContain("notes for v0.1.0");
    expect(body).not.toContain("notes for v0.0.9");
  });

  /**
   * The fixture the previous version of this file could not have written, and the
   * defect it exists for.
   *
   * The release's own asset does NOT carry `atomaton-gone.yml`; the manifest
   * committed at the tag DOES. Reading the committed copy — which is what this
   * script did — finds nothing missing and renders an empty section that reads
   * exactly like a release that dropped nothing. Only reading the asset reports it.
   */
  test("a path only the ASSET knows was dropped is listed", () => {
    const dir = behind();
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [
        ...reads("v0.2.0", {
          shipped: [".github/workflows/atomaton-check.yml"],
          committed: [".github/workflows/atomaton-check.yml", ".github/workflows/atomaton-gone.yml"],
        }),
        search(0),
        { match: ["issue", "create"] },
      ],
    });
    expect(r.status).toBe(0);
    const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
    expect(
      body,
      "the committed copy at the tag is a release behind, so its list hides this deletion",
    ).toContain("`.github/workflows/atomaton-gone.yml`");
    expect(body, "a file both releases ship is not a deletion").not.toContain("`.github/workflows/atomaton-check.yml`");
    expect(body, "nothing the adopter wrote can be on it").toContain("nothing you wrote is on it");
  });

  test("an open notice is updated rather than a second one opened", () => {
    const dir = behind();
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [...reads("v0.2.0"), search(7), { match: ["issue", "edit"] }],
    });
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((call) => call[1] === "create"), "a second notice buries the repository").toEqual([]);
    const edited = r.ghCalls.filter((call) => call[1] === "edit");
    expect(edited).toHaveLength(1);
    expect(edited[0]).toContain("7");
    expect(writeBody(edited[0] ?? [])).toContain(NOTICE_MARKER);
  });

  /**
   * The marker decides, not the title. A search returns titles that share words, and
   * an issue somebody else wrote about releases is not this script's to rewrite.
   */
  test("an issue that is not a notice is left alone", () => {
    const dir = behind();
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [
        ...reads("v0.2.0"),
        {
          match: ["issue", "list"],
          // The title matched the search; the body is somebody else's issue.
          stdout: JSON.stringify([{ number: 3, state: "OPEN", body: "A person's own note about template releases." }]),
        },
        { match: ["issue", "create"], stdout: "https://example.test/issues/11" },
      ],
    });
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((call) => call[1] === "edit"), "somebody else's issue").toEqual([]);
    expect(r.ghCalls.filter((call) => call[1] === "create")).toHaveLength(1);
  });

  /**
   * A CLOSED notice wearing the marker is not reused. Closing it is the owner saying
   * they have read it, and editing it from under them would make the picker's close
   * mean nothing.
   *
   * This is checked here rather than left to `--state open`, because whether `gh`
   * applies a state filter alongside `--search` is not measurable from this
   * repository — the fake matches argv and knows nothing of the search API. The
   * answer is filtered instead, so the behaviour is correct whichever way the flag
   * behaves.
   */
  test("a closed notice is not edited; a new one is opened instead", () => {
    const dir = behind();
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [
        ...reads("v0.2.0"),
        {
          match: ["issue", "list"],
          // The search answered with the settled notice anyway.
          stdout: JSON.stringify([
            { number: 4, state: "CLOSED", body: `${NOTICE_MARKER}\nTemplate release v0.1.5 is available.` },
          ]),
        },
        { match: ["issue", "create"], stdout: "https://example.test/issues/12" },
      ],
    });
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((call) => call[1] === "edit"), "a closed notice is settled").toEqual([]);
    expect(r.ghCalls.filter((call) => call[1] === "create")).toHaveLength(1);
  });
});

describe("a read that fails is not an answer", () => {
  test("a latest release that could not be read fails the run and writes nothing", () => {
    const dir = behind();
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      // No rule for `releases/latest`, so the read fails.
      rules: [{ match: ["releases?per_page"], stdout: JSON.stringify([release("v0.2.0")]) }],
    });
    expect(r.status).toBe(1);
    expect(r.ghCalls.filter((call) => call[1] === "create" || call[1] === "edit")).toEqual([]);
  });

  /**
   * The search failing is told apart from "there is no notice". Collapsing the two
   * opens a fresh issue every time the search blips.
   */
  test("a search that could not be made stops rather than opening a new issue", () => {
    const dir = behind();
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: reads("v0.2.0"),
    });
    expect(r.status).toBe(1);
    expect(r.ghCalls.filter((call) => call[1] === "create")).toEqual([]);
  });

  test("a tree with no manifest fails, rather than reading as up to date", () => {
    const bare = temp("atomaton-new-release-bare-");
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: bare,
      rules: reads("v0.2.0"),
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("cannot say which release it came from");
    expect(r.ghCalls.filter((call) => call[1] === "create")).toEqual([]);
  });

  /**
   * The notes and the deleted list degrade; the decision does not. A failed download
   * leaves the notice without the deletion list, which a person can still act on,
   * rather than leaving no notice at all.
   */
  test("unreadable notes and an unreadable asset still leave a notice, saying what is missing", () => {
    const dir = behind();
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [
        ...reads("v0.2.0", { notesFail: true, assetFail: true }),
        search(0),
        { match: ["issue", "create"] },
      ],
    });
    expect(r.status).toBe(0);
    const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
    expect(body).toContain("Not read:");
    expect(body).toContain("Not computed:");
    expect(body, "the versions are the part that cannot be missing").toContain("v0.2.0");
  });
});

describe("which releases are in the window", () => {
  const notes = [release("v0.3.0"), release("v0.2.5"), release("v0.2.0"), release("v0.1.0")];

  test("everything newer than the tree's own version", () => {
    const window = releaseWindow(notes, "v0.2.0");
    expect(window.newer.map((note) => note.tag)).toEqual(["v0.3.0", "v0.2.5"]);
    expect(window.found).toBe(true);
  });

  /** A version the returned page does not reach: the notes are the newest, not all of them. */
  test("a version older than the page says so rather than claiming to be complete", () => {
    const window = releaseWindow(notes, "v0.0.1");
    expect(window.newer).toHaveLength(notes.length);
    expect(window.found).toBe(false);
  });

  test("the list is bounded, and what is left out is counted", () => {
    // Oldest first as a person would read them, newest first as the API answers.
    const many = Array.from({ length: MAX_RELEASES + 5 }, (_, index) => release(`v1.${index}.0`)).reverse();
    const window = releaseWindow([...many, release("v0.0.1")], "v0.0.1");
    expect(window.newer).toHaveLength(MAX_RELEASES);
    expect(window.omitted).toBe(5);
  });
});
