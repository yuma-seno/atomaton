import { afterAll, describe, expect, test } from "bun:test";
import { crc32 } from "node:zlib";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import {
  ADOPT_MARKER,
  ASSET_NAME,
  MAX_RELEASES,
  NOTICE_MARKER,
  markedReleases,
  releaseWindow,
  UPSTREAM_REPOSITORY,
  type ReleaseNote,
} from "./notify_new_release.ts";
import { RELEASE_MANIFEST } from "../../domain/machinery/machinery-layout.ts";
import { removeTemp, runWithFakeGh, scriptPath, type FakeGhRule } from "./testing/harness.ts";

/**
 * The announcement, against the fake `gh`.
 *
 * Three behaviours are the whole of it and all are silent when wrong: a tree that
 * is up to date must write NOTHING (a scheduled run that writes every time is a
 * repository with one issue per day); a tree that is behind must leave exactly ONE
 * notice behind however many times it runs; and the notice must answer what taking
 * the release would do to THIS tree, not announce a version number.
 *
 * ## Three content maps, not one manifest
 *
 * The notice's plan needs file contents on all three sides — the release the tree
 * came from, the release being taken, and the tree itself. So every fixture is a
 * checkout whose files actually exist on disk, and TWO release assets, one per
 * download, with contents the fixture chooses. A read that fails is a case of its
 * own, because "could not read" and "nothing newer" are the two answers that must
 * never be confused.
 *
 * ## Why the download rules match on the tag AND `-D`
 *
 * The fake matches a rule by substring across argv, and the notice BODY quotes the
 * very command being faked — `gh release download <tag> …` sits in the fenced block
 * a person copies. That quotation is why every download rule also carries `-D`: the
 * quoted command has no `-D`, so the notice's own write call can never satisfy a
 * download rule (a failed-download fixture once silently failed the write instead).
 * Within the two downloads, the tag is its own argv element, so the tag anchor is
 * what tells them apart; order still matters because a tree already on the latest
 * would match the target's rule and quietly download the wrong release.
 *
 * The `releases/latest` rule returns the BARE tag, because that is what a real
 * `gh api … --jq .tag_name` prints — the fixture pretends the jq ran, not gh.
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

/** A tree's files beyond the manifest itself. */
type Tree = Record<string, string>;

const CHECK = ".github/workflows/atomaton-check.yml";
const GONE = ".github/workflows/atomaton-gone.yml";
/** Every fixture tree is behind by this much: a check the release changed, and one it dropped. */
const BASE_FILES: Tree = { [CHECK]: "check: one\n", [GONE]: "gone: one\n" };
const TARGET_FILES: Tree = { [CHECK]: "check: two\n" };

/** The manifest as both the tree's copy and the asset's copy write it — byte for byte the same. */
const manifestJson = (version: string, files: string[]): string =>
  JSON.stringify({ version, files: [RELEASE_MANIFEST, ...files] });

/** A checkout-shaped temp directory: the manifest, and every file it lists, on disk. */
function checkout(entries: Tree, version = "v0.1.0"): string {
  const dir = temp("atomaton-new-release-");
  for (const [path, content] of Object.entries(entries)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  mkdirSync(dirname(join(dir, RELEASE_MANIFEST)), { recursive: true });
  writeFileSync(join(dir, RELEASE_MANIFEST), `${manifestJson(version, Object.keys(entries))}\n`);
  // Every adopted tree carries this file, and the notice reads it -- for
  // `update.on_new_release` only. A fixture without one would be a tree the
  // deliverable does not ship.
  mkdirSync(dirname(join(dir, ".github/atomaton/config.yaml")), { recursive: true });
  writeFileSync(join(dir, ".github/atomaton/config.yaml"), 'base_branch: ""\n');
  return dir;
}

/**
 * A zip holding the manifest and `entries` beside it, in the checkout's own shape.
 *
 * STORED rather than deflated on purpose: an entry with method 0 needs no inflate
 * table to be written, so this stays a plain byte layout rather than an
 * implementation of DEFLATE in a test. The reader under test handles both methods
 * — a deflated entry is its own test in `lib/zip-read.test.ts` — and the point here
 * is that the notice genuinely downloads an archive and reads members out of it.
 */
function treeZip(name: string, version: string, entries: Tree): string {
  const listed = Object.keys(entries);
  const members = new Map<string, string>([
    [RELEASE_MANIFEST, `${manifestJson(version, listed)}\n`],
    ...Object.entries(entries),
  ]);
  const bytes: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [entry, content] of members) {
    const data = Buffer.from(content, "utf8");
    const nameBytes = Buffer.from(entry, "utf8");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt32LE(crc32(data), 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    bytes.push(local, nameBytes, data);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt32LE(crc32(data), 16);
    header.writeUInt32LE(data.length, 20);
    header.writeUInt32LE(data.length, 24);
    header.writeUInt16LE(nameBytes.length, 28);
    header.writeUInt32LE(offset, 42);
    central.push(header, nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const directory = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(members.size, 8);
  eocd.writeUInt16LE(members.size, 10);
  eocd.writeUInt32LE(directory.length, 12);
  eocd.writeUInt32LE(offset, 16);

  const path = join(temp("atomaton-asset-"), name);
  writeFileSync(path, Buffer.concat([...bytes, directory, eocd]));
  return path;
}

/** One release, as the releases list returns it. */
const release = (tag: string, body = `notes for ${tag}`): ReleaseNote => ({
  tag,
  body,
  url: `https://example.test/${tag}`,
});

/**
 * The reads, as rules — one download per release, told apart by the tag.
 *
 * Rule order matters: the base rule comes first, because a tree already on the
 * latest would match the target's rule and quietly download the wrong release.
 * That tree never downloads at all (it is caught up), so this is belt only.
 */
function reads(
  latest: string,
  options: {
    notes?: ReleaseNote[];
    notesFail?: boolean;
    /** What the base release's asset carries beyond its manifest. */
    base?: Tree;
    /** What the target release's asset carries beyond its manifest. */
    target?: Tree;
    /** Which download to fail. Failing both degrades the plan and the deletion list. */
    downloadFail?: "base" | "target" | "both";
    /** The tree's own release, when it is not the default one behind. */
    baseTag?: string;
  } = {},
): FakeGhRule[] {
  const baseTag = options.baseTag ?? "v0.1.0";
  const fail = options.downloadFail;
  const download = (tag: string, entries: Tree): FakeGhRule =>
    fail === "both" || fail === (tag === baseTag ? "base" : "target")
      ? { match: [tag, "release", "download", "-D"], code: 1, stdout: "no such asset" }
      : {
          match: [tag, "release", "download", "-D"],
          writes: [{ name: ASSET_NAME, from: treeZip(`${tag}.zip`, tag, entries) }],
        };
  return [
    {
      match: [`repos/${UPSTREAM_REPOSITORY}/releases/latest`],
      stdout: latest,
    },
    download(baseTag, options.base ?? BASE_FILES),
    download(latest, options.target ?? TARGET_FILES),
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
  // Anchored on the search string as well: an edit or create call carries the
  // notice's whole body on its argv, and a body that happens to contain the word
  // "list" would otherwise be answered with a search result. Pinned to the exact
  // query so a title renamed without its search is a failing test, not a run that
  // opens a second notice beside the one it cannot find.
  match: ["issue", "list", `"Atomaton release" in:title`],
  stdout: JSON.stringify(
    number === 0
      ? []
      : [{ number, state: "OPEN", body: `${NOTICE_MARKER}\nAtomaton release v0.2.0 is available.` }],
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

/** A checkout that is behind, matching the base release's own contents. */
function behind(): string {
  return checkout(BASE_FILES, "v0.1.0");
}

/**
 * The same tree, with the one setting this file is about written into it.
 *
 * `config.yaml` is in neither release, so the plan never proposes touching it -- the
 * notice only reads it, and only for `update.on_new_release`.
 */
function behindWith(config: string): string {
  const dir = behind();
  mkdirSync(dirname(join(dir, ".github/atomaton/config.yaml")), { recursive: true });
  writeFileSync(join(dir, ".github/atomaton/config.yaml"), config);
  return dir;
}

/** The `gh` calls that would start the update, as argv arrays. */
const started = (calls: string[][]): string[][] => calls.filter((call) => call[0] === "workflow");

describe("when a tree is up to date", () => {
  test("nothing is written at all", () => {
    const dir = checkout(BASE_FILES, "v0.2.0");
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
    const dir = checkout(BASE_FILES, "v0.2.0");
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
            { number: 4, state: "CLOSED", body: `${NOTICE_MARKER}\nAtomaton release v0.1.5 is available.` },
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

describe("the plan inside the notice", () => {
  /**
   * On the default fixture, the untouched check flows through as a take, the
   * dropped file as a deletion, and nothing collides — which is the one state
   * under which the notice may say the update applies itself.
   */
  test("a tree nothing collides with is told so, with the plan's counts", () => {
    const dir = behind();
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [...reads("v0.2.0"), search(0), { match: ["issue", "create"] }],
    });
    expect(r.status).toBe(0);
    const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
    expect(body).toContain("the update applies itself");
    expect(body).toContain("| Files updated (this tree never changed them) | 2 |");
    expect(body).toContain(`| Files removed (unmodified here) | 1 |`);
    expect(body).toContain("| Files changed on **both** sides | 0 |");
    expect(body).not.toContain("both-sides files are where");
  });

  /** The file both sides changed is the whole reason an update stops at a pull request. */
  test("a both-sides change is named in the verdict, as the decision to make", () => {
    const dir = checkout({ ...BASE_FILES, [CHECK]: "check: customised by the adopter\n" }, "v0.1.0");
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [...reads("v0.2.0"), search(0), { match: ["issue", "create"] }],
    });
    expect(r.status).toBe(0);
    const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
    expect(body).toContain("needs a decision");
    expect(body).toContain(`\`${CHECK}\``);
  });

  /** A path the plan will not touch without a person is listed, not silently kept. */
  test("a file the adopter edited where upstream added nothing new is left for the notice to name", () => {
    const dir = checkout({ ...BASE_FILES, [GONE]: "gone: customised\n" }, "v0.1.0");
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [...reads("v0.2.0"), search(0), { match: ["issue", "create"] }],
    });
    expect(r.status).toBe(0);
    const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
    expect(body).toContain("leaves these alone until a person says otherwise");
    expect(body).toContain(`\`${GONE}\``);
  });

  /**
   * The base release failing to read is the plan going dark while the announcement
   * still stands: the notice says what it could not compute and why, and still says
   * the rest — a missing table must never read as "nothing would change".
   */
  test("the base release failing to read degrades the plan but keeps the notice", () => {
    const dir = behind();
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [...reads("v0.2.0", { downloadFail: "base" }), search(0), { match: ["issue", "create"] }],
    });
    expect(r.status).toBe(0);
    const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
    expect(body).toContain("not computed");
    expect(body).toContain("this tree's own release (v0.1.0) could not be read");
    // The deletion list — which needs only the target's manifest — still stands.
    expect(body).toContain(`\`${GONE}\``);
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
   * The notes and the plan degrade; the decision does not. A failed download leaves
   * the notice without its table and its deletion list, which a person can still
   * act on, rather than leaving no notice at all.
   */
  test("unreadable notes and unreadable assets still leave a notice, saying what is missing", () => {
    const dir = behind();
    const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      rules: [
        ...reads("v0.2.0", { notesFail: true, downloadFail: "both" }),
        search(0),
        { match: ["issue", "create"] },
      ],
    });
    expect(r.status).toBe(0);
    const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
    expect(body).toContain("Not read:");
    expect(body).toContain("Not computed:");
    // The plan's degraded line is its own sentence — a missing table must never
    // read as an empty one.
    expect(body).toContain("not computed");
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

/**
 * `update.on_new_release`, from the noticing side.
 *
 * A `pr` or `pr-agent` repository takes the release itself: the update is dispatched
 * from here, and the pull request it opens is the one thread its report lands on. A
 * notice beside it would be a second thread about the same release, so none is
 * written -- and none of the notice's comparisons run either.
 *
 * The exception is the case a person has to act on: no `ATOMATON_UPDATE_TOKEN`, or a
 * dispatch GitHub refused. Then the notice IS written, opening with a warning, and
 * the daily run stays green. `issue` mode is untouched, down to the `gh` calls it
 * makes.
 */
describe("when the repository asked for the update to be taken", () => {
  const PR_MODE = "base_branch: main\nupdate:\n  on_new_release: pr\n";
  const AGENT_MODE = "base_branch: main\nupdate:\n  on_new_release: pr-agent\n";

  /** The answers a dispatched update needs: no pull request yet, and the dispatch landing. */
  const dispatchable: FakeGhRule[] = [
    { match: ["pr", "list"], stdout: "[]" },
    // Matched on the workflow's name too: `workflow` and `run` appear inside the
    // notice's own body (the paths it lists), and a rule that answers `issue create`
    // with this one is a test measuring itself.
    { match: ["workflow", "run", "atomaton-update.yml"], stdout: "" },
  ];

  const announce = (dir: string, rules: FakeGhRule[], env: Record<string, string>) =>
    runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      env,
      rules: [
        ...reads("v0.2.0"),
        search(0),
        { match: ["issue", "create"], stdout: "https://example.test/owner/repo/issues/9" },
        ...rules,
      ],
    });

  /** The calls that would write a notice. On the automatic path there must be none. */
  const notices = (calls: string[][]): string[][] =>
    calls.filter((call) => call[0] === "issue" && (call[1] === "create" || call[1] === "edit"));

  /**
   * The default, and the pin the whole change rests on: a repository that set nothing
   * is a repository where nothing is taken. A token in the environment does not change
   * that -- unset means `issue`, and `issue` means the notice and no more.
   */
  test("an unset mode dispatches nothing, even with a token in the environment", () => {
    const r = announce(behind(), dispatchable, { ATOMATON_UPDATE_TOKEN: "tok" });
    expect(r.status).toBe(0);
    expect(started(r.ghCalls), "the notice must start no run").toEqual([]);
    expect(r.ghCalls.filter((call) => call[0] === "pr"), "and must not go looking for one").toEqual([]);
    expect(writeBody(r.ghCalls.find((call) => call[1] === "create") ?? [])).not.toContain("update.on_new_release");
  });

  test("`issue` behaves exactly as the unset default does", () => {
    const r = announce(behindWith("base_branch: main\nupdate:\n  on_new_release: issue\n"), dispatchable, {
      ATOMATON_UPDATE_TOKEN: "tok",
    });
    expect(r.status).toBe(0);
    expect(started(r.ghCalls)).toEqual([]);
    expect(notices(r.ghCalls)).toHaveLength(1);
  });

  /**
   * The change this block is about: the update IS the announcement. `source` is empty,
   * which is the Actions-button run -- no thread asked for it -- so the pull request
   * the update opens is where everything is reported.
   *
   * And the notice's own work is skipped: no download, because the update is about to
   * do the same comparison on the same tree a moment later.
   */
  test("`pr` starts the update and writes no notice at all", () => {
    const r = announce(behindWith(PR_MODE), dispatchable, { ATOMATON_UPDATE_TOKEN: "tok" });
    expect(r.status).toBe(0);

    const sent = started(r.ghCalls);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain("atomaton-update.yml");
    expect(flagValue(sent[0] ?? [], "-f"), "no thread asked for this run").toBe("source=");

    expect(notices(r.ghCalls), "the pull request is the announcement").toEqual([]);
    expect(r.ghCalls.filter((call) => call[0] === "release"), "the update does the comparing").toEqual([]);
  });

  test("`pr-agent` starts the update the same way", () => {
    const r = announce(behindWith(AGENT_MODE), dispatchable, { ATOMATON_UPDATE_TOKEN: "tok" });
    expect(r.status).toBe(0);
    expect(started(r.ghCalls)).toHaveLength(1);
    expect(notices(r.ghCalls)).toEqual([]);
  });

  /**
   * The exception. Without the secret nothing can be started, and failing the run
   * would announce nothing at all -- so the notice is written and opens with the
   * warning that says why, which is the one place the person who can set the secret
   * will look.
   */
  test("no update token is a notice whose first line is the warning", () => {
    const r = announce(behindWith(PR_MODE), dispatchable, {});
    expect(r.status, "a repository with no secret still learns there is a release").toBe(0);
    expect(started(r.ghCalls)).toEqual([]);
    expect(r.stderr).toContain("WARN");
    // And no search: the only identity available to it is this workflow's own, which
    // a private repository refuses a pull-request read to -- and the refusal would
    // come back as "no pull request is open", the answer that dispatches.
    expect(r.ghCalls.filter((call) => call[0] === "pr"), "no token, no question to ask").toEqual([]);

    const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
    const lines = body.split("\n");
    expect(lines[0], "the marker keeps the notice findable").toBe(NOTICE_MARKER);
    expect(lines[1], "and the warning is what a person reads first").toBe("> [!WARNING]");
    expect(body).toContain("ATOMATON_UPDATE_TOKEN");
    expect(body).toContain("nothing was started");
  });

  /**
   * A dispatch GitHub refused is the other case somebody has to be told about, and it
   * lands in the same warning -- with the reason left in the run log, because what
   * `gh` answers here can name a credential and an issue body is not where that goes.
   */
  test("a refused dispatch is a notice that points at the run log", () => {
    const r = announce(
      behindWith(PR_MODE),
      [
        { match: ["pr", "list"], stdout: "[]" },
        { match: ["workflow", "run", "atomaton-update.yml"], code: 1, stdout: "boom: 403" },
      ],
      { ATOMATON_UPDATE_TOKEN: "tok" },
    );
    expect(r.status).toBe(0);
    expect(notices(r.ghCalls)).toHaveLength(1);

    const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
    expect(body.split("\n")[1]).toBe("> [!WARNING]");
    expect(body).toContain("refused");
    expect(body, "the stderr names a credential, so it stays in the log").not.toContain("boom");
  });

  /**
   * One pull request per release, which is what the update itself enforces by editing
   * the pull request it already made -- but a daily cron would dispatch a run every
   * day to find that out. Nothing is dispatched and no notice is written either: the
   * pull request already standing is the thread.
   */
  test("an update pull request already open is neither dispatched nor announced", () => {
    const r = announce(behindWith(PR_MODE), [{ match: ["pr", "list"], stdout: JSON.stringify([{ number: 4 }]) }], {
      ATOMATON_UPDATE_TOKEN: "tok",
    });
    expect(r.status).toBe(0);
    expect(started(r.ghCalls)).toEqual([]);
    expect(notices(r.ghCalls), "the pull request is already the thread").toEqual([]);
  });

  /** The read that decides it is the head branch, not a title or a search. */
  test("the pull request it looks for is the one on this release's update branch", () => {
    const r = announce(behindWith(PR_MODE), dispatchable, { ATOMATON_UPDATE_TOKEN: "tok" });
    const listed = r.ghCalls.find((call) => call[0] === "pr" && call[1] === "list") ?? [];
    expect(listed[listed.indexOf("--head") + 1]).toBe("atomaton/update-v0.2.0");
  });
});

/**
 * `update.detection_scope`, from the noticing side.
 *
 * `marked` narrows the comparison to the releases whose own notes carry
 * `atomaton:adopt`. This is a gate and not a filter on what the notice prints: a
 * window with no marked release produces no notice at all, in every mode, and the run
 * stays green -- a daily cron that failed because nothing was flagged would be red in
 * the ordinary case, which is every release nobody flagged.
 */
describe("when update.detection_scope is marked", () => {
  const MARKED = "base_branch: main\nupdate:\n  detection_scope: marked\n";
  const ALL = "base_branch: main\nupdate:\n  detection_scope: all\n";

  const announce = (dir: string, rules: FakeGhRule[], env: Record<string, string> = {}) =>
    runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
      cwd: dir,
      env,
      rules: [search(0), { match: ["issue", "create"], stdout: "https://example.test/issues/9" }, ...rules],
    });

  /** What the fixture's releases list answers: the target, one in between, and the tree's own. */
  const unmarked = [release("v0.2.0"), release("v0.1.5"), release("v0.1.0")];
  const oneMarked = [release("v0.2.0"), release("v0.1.5", `\`${ADOPT_MARKER}\` — take this one`), release("v0.1.0")];

  const notices = (calls: string[][]) =>
    calls.filter((call) => call[0] === "issue" && (call[1] === "create" || call[1] === "edit"));
  const downloads = (calls: string[][]) => calls.filter((call) => call[0] === "release");

  test("nothing marked is no notice, and the gate runs before the downloads", () => {
    const r = announce(behindWith(MARKED), reads("v0.2.0", { notes: unmarked }));
    expect(r.status, "a release nobody flagged is the ordinary case, not a failure").toBe(0);
    expect(notices(r.ghCalls), "an unflagged window announces nothing").toEqual([]);
    expect(downloads(r.ghCalls), "and nothing is downloaded for a notice that will not be written").toEqual([]);
    expect(r.stderr).toContain("nothing to announce");
  });

  test("a marked release is announced, and the body says which one made it", () => {
    const r = announce(behindWith(MARKED), reads("v0.2.0", { notes: oneMarked }));
    expect(r.status).toBe(0);
    const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
    expect(body, "the mark is why this notice exists").toContain(ADOPT_MARKER);
    expect(body, "and the release carrying it is named").toContain("`v0.1.5`");
    expect(body, "the notice is still about the latest release").toContain("v0.2.0");
  });

  test("`all` notices both windows, and says nothing about marks", () => {
    for (const notes of [unmarked, oneMarked]) {
      const r = announce(behindWith(ALL), reads("v0.2.0", { notes }));
      expect(r.status).toBe(0);
      expect(notices(r.ghCalls), "`all` notices a release whether or not it is marked").toHaveLength(1);
      const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
      expect(body, "`all` never mentions the setting").not.toContain("update.detection_scope");
    }
  });

  /**
   * The one read that cannot degrade. "Could not read" and "nothing is marked" are the
   * two answers this gate must never confuse: reading a failed list as an unmarked
   * window would stop the watch for as long as the API was blipping, silently.
   */
  test("a failed release read stops the run rather than reading as unmarked", () => {
    const r = announce(behindWith(MARKED), reads("v0.2.0", { notesFail: true }));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("::error::");
    expect(notices(r.ghCalls)).toEqual([]);
  });

  test("an unmarked window takes nothing even in `pr` mode", () => {
    const r = announce(
      behindWith("base_branch: main\nupdate:\n  detection_scope: marked\n  on_new_release: pr\n"),
      [
        ...reads("v0.2.0", { notes: unmarked }),
        { match: ["pr", "list"], stdout: "[]" },
        { match: ["workflow", "run", "atomaton-update.yml"] },
      ],
      { ATOMATON_UPDATE_TOKEN: "tok" },
    );
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((call) => call[0] === "workflow"), "nothing is taken").toEqual([]);
    expect(notices(r.ghCalls)).toEqual([]);
  });
});

describe("markedReleases", () => {
  const note = (tag: string, body = ""): ReleaseNote => ({ tag, body, url: "" });

  test("only the marked ones newer than the tree's own version", () => {
    const notes = [note("v0.3.0"), note("v0.2.0", `\`${ADOPT_MARKER}\``), note("v0.1.5"), note("v0.1.0", ADOPT_MARKER)];
    expect(markedReleases(notes, "v0.1.5")).toEqual(["v0.2.0"]);
  });

  test("a version the page does not reach keeps every mark the page carries", () => {
    const notes = [note("v0.3.0", ADOPT_MARKER), note("v0.2.0")];
    expect(markedReleases(notes, "v0.0.1")).toEqual(["v0.3.0"]);
  });
});
