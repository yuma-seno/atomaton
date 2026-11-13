import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  MAX_RELEASES,
  NOTICE_MARKER,
  releaseWindow,
  UPSTREAM_REPOSITORY,
  type ReleaseNote,
} from "./notify_new_release.ts";
import { removeTemp, runWithFakeGh, scriptPath, type FakeGhRule } from "./testing/harness.ts";

/**
 * The announcement, against the fake `gh`.
 *
 * Two behaviours are the whole of it and both are silent when wrong: a tree that
 * is up to date must write NOTHING (a scheduled run that writes every time is a
 * repository with one issue per day), and a tree that is behind must leave exactly
 * ONE notice behind however many times it runs.
 *
 * The fixtures are a checkout-shaped temp directory — the script reads the
 * manifest off the disk it is run in — and a `gh` that answers the three reads the
 * script makes. A read that fails is a case of its own, because "could not read"
 * and "nothing newer" are the two answers that must never be confused.
 */

/** A `.github/atomaton-release.json`, as a release writes one, in a fresh temp directory. */
function checkout(files: string[], version = "v0.1.0"): string {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-new-release-"));
  mkdirSync(join(dir, ".github"), { recursive: true });
  writeFileSync(
    join(dir, ".github", "atomaton-release.json"),
    `${JSON.stringify({ version, files: [".github/atomaton-release.json", ...files] }, null, 2)}\n`,
  );
  return dir;
}

/** The upstream manifest as the contents API returns it, raw. */
function manifestAt(tag: string, files: string[]): string {
  return JSON.stringify({ version: tag, files: [".github/atomaton-release.json", ...files] });
}

/** One release, as the releases list returns it. */
const release = (tag: string, body = `notes for ${tag}`): ReleaseNote => ({
  tag,
  body,
  url: `https://example.test/${tag}`,
});

/**
 * The three reads, as rules.
 *
 * Listed before the search rule at every call site, because the fake resolves a
 * rule list in order and `issue list` shares no word with any of these.
 */
function reads(
  latest: string,
  options: { notes?: ReleaseNote[]; upstreamFiles?: string[]; notesFail?: boolean; manifestFail?: boolean } = {},
): FakeGhRule[] {
  return [
    {
      match: [`repos/${UPSTREAM_REPOSITORY}/releases/latest`],
      stdout: JSON.stringify({ tag: latest, url: `https://example.test/${latest}` }),
    },
    {
      match: ["contents/.github/atomaton-release.json"],
      ...(options.manifestFail
        ? { code: 1, stdout: "not found" }
        : { stdout: manifestAt(latest, options.upstreamFiles ?? [".github/workflows/atomaton-check.yml"]) }),
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
    number === 0 ? [] : [{ number, body: `${NOTICE_MARKER}\nTemplate release v0.2.0 is available.` }],
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
    try {
      const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
        cwd: dir,
        rules: [...reads("v0.2.0"), search(0)],
      });
      expect(r.status).toBe(0);
      const wrote = r.ghCalls.filter((call) => call[1] === "create" || call[1] === "edit" || call[1] === "close");
      expect(wrote, "a run that finds nothing newer must not touch the tracker").toEqual([]);
    } finally {
      removeTemp(dir);
    }
  });

  /**
   * Catching up is the only way a notice stops being true, and a notice that
   * outlives its comparison is worse than none: the next release would be
   * announced by editing an issue about a version that is no longer waiting.
   */
  test("a notice left open after the upgrade is closed, and no new one is opened", () => {
    const dir = checkout([".github/workflows/atomaton-check.yml"], "v0.2.0");
    try {
      const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
        cwd: dir,
        rules: [...reads("v0.2.0"), search(7), { match: ["issue", "close"] }],
      });
      expect(r.status).toBe(0);
      expect(r.ghCalls.filter((call) => call[1] === "create" || call[1] === "edit")).toEqual([]);

      const closed = r.ghCalls.filter((call) => call[1] === "close");
      expect(closed).toHaveLength(1);
      expect(closed[0]).toContain("7");
      // The closing comment says which machinery did it, and carries the marker so
      // a reopened issue is still findable the same way.
      const comment = flagValue(closed[0] ?? [], "--comment");
      expect(comment).toContain(NOTICE_MARKER);
      expect(comment).toContain("v0.2.0");
    } finally {
      removeTemp(dir);
    }
  });
});

describe("when a tree is behind", () => {
  test("one issue is opened, naming both versions", () => {
    const dir = behind();
    try {
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
      expect(body).toContain(`${UPSTREAM_REPOSITORY} -p atomaton-delivery.zip`);
    } finally {
      removeTemp(dir);
    }
  });

  test("the notes carried are the ones between the two, and no others", () => {
    const dir = behind();
    try {
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
    } finally {
      removeTemp(dir);
    }
  });

  test("a file the latest release no longer ships is listed", () => {
    const dir = behind();
    try {
      const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
        cwd: dir,
        // The release kept atomaton-check.yml and dropped atomaton-gone.yml.
        rules: [
          ...reads("v0.2.0", { upstreamFiles: [".github/workflows/atomaton-check.yml"] }),
          search(0),
          { match: ["issue", "create"] },
        ],
      });
      expect(r.status).toBe(0);
      const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
      expect(body).toContain("`.github/workflows/atomaton-gone.yml`");
      expect(body, "a file both releases ship is not a deletion").not.toContain("`.github/workflows/atomaton-check.yml`");
      // And nothing the adopter wrote can be on it: the comparison is between two
      // manifests, so the list holds paths the previous release shipped.
      expect(body).toContain("nothing you wrote is on it");
    } finally {
      removeTemp(dir);
    }
  });

  test("an open notice is updated rather than a second one opened", () => {
    const dir = behind();
    try {
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
    } finally {
      removeTemp(dir);
    }
  });

  /**
   * The marker decides, not the title. A search returns titles that share words, and
   * an issue somebody else wrote about releases is not this script's to rewrite.
   */
  test("an issue that is not a notice is left alone", () => {
    const dir = behind();
    try {
      const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
        cwd: dir,
        rules: [
          ...reads("v0.2.0"),
          {
            match: ["issue", "list"],
            // The title matched the search; the body is somebody else's issue.
            stdout: JSON.stringify([{ number: 3, body: "A person's own note about template releases." }]),
          },
          { match: ["issue", "create"], stdout: "https://example.test/issues/11" },
        ],
      });
      expect(r.status).toBe(0);
      expect(r.ghCalls.filter((call) => call[1] === "edit"), "somebody else's issue").toEqual([]);
      expect(r.ghCalls.filter((call) => call[1] === "create")).toHaveLength(1);
    } finally {
      removeTemp(dir);
    }
  });
});

describe("a read that fails is not an answer", () => {
  test("a latest release that could not be read fails the run and writes nothing", () => {
    const dir = behind();
    try {
      const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
        cwd: dir,
        // No rule for `releases/latest`, so the read fails.
        rules: [{ match: ["releases?per_page"], stdout: JSON.stringify([release("v0.2.0")]) }],
      });
      expect(r.status).toBe(1);
      expect(r.ghCalls.filter((call) => call[1] === "create" || call[1] === "edit")).toEqual([]);
    } finally {
      removeTemp(dir);
    }
  });

  /**
   * The search failing is told apart from "there is no notice". Collapsing the two
   * opens a fresh issue every time the search blips.
   */
  test("a search that could not be made stops rather than opening a new issue", () => {
    const dir = behind();
    try {
      const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
        cwd: dir,
        rules: reads("v0.2.0"),
      });
      expect(r.status).toBe(1);
      expect(r.ghCalls.filter((call) => call[1] === "create")).toEqual([]);
    } finally {
      removeTemp(dir);
    }
  });

  test("a tree with no manifest fails, rather than reading as up to date", () => {
    const empty = mkdtempSync(join(tmpdir(), "atomaton-new-release-bare-"));
    try {
      const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
        cwd: empty,
        rules: reads("v0.2.0"),
      });
      expect(r.status).toBe(1);
      expect(r.stderr).toContain("cannot say which release it came from");
      expect(r.ghCalls.filter((call) => call[1] === "create")).toEqual([]);
    } finally {
      removeTemp(empty);
    }
  });

  /**
   * The notes and the deleted list degrade; the decision does not. A release list
   * that 502s leaves the notice without notes, which a person can still act on,
   * rather than leaving no notice at all.
   */
  test("unreadable notes and an unreadable manifest still leave a notice, saying what is missing", () => {
    const dir = behind();
    try {
      const r = runWithFakeGh(scriptPath("notify_new_release.ts"), ["--repo", "owner/repo"], {
        cwd: dir,
        rules: [
          ...reads("v0.2.0", { notesFail: true, manifestFail: true }),
          search(0),
          { match: ["issue", "create"] },
        ],
      });
      expect(r.status).toBe(0);
      const body = writeBody(r.ghCalls.find((call) => call[1] === "create") ?? []);
      expect(body).toContain("Not read:");
      expect(body).toContain("Not computed:");
      expect(body, "the versions are the part that cannot be missing").toContain("v0.2.0");
    } finally {
      removeTemp(dir);
    }
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
