import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { carriesConflictMarkers, findConflictMarkers } from "./conflict-markers.ts";
import { removeTemp } from "../testing/harness.ts";

/** One tree per test, cleaned up whatever the test does. */
function withTree(build: (root: string) => void, check: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "atomaton-markers-"));
  try {
    build(root);
    check(root);
  } finally {
    removeTemp(root);
  }
}

/** The shape `git merge-file` writes, which is what the update machinery commits. */
const HUNK = "<<<<<<< ours\nleft\n=======\nright\n>>>>>>> theirs\n";

describe("carriesConflictMarkers", () => {
  test("a hunk with both ends is a conflict", () => {
    expect(carriesConflictMarkers(`before\n${HUNK}after\n`)).toBe(true);
  });

  // Prose about conflicts quotes one line at a time, and a pull request that only
  // mentions a marker has no conflict in it. Requiring both ends is the line this
  // draws; without it this repository's own documentation reads as a conflict.
  test("one end quoted on its own is not", () => {
    expect(carriesConflictMarkers("a line starting with <<<<<<< is the first half\n")).toBe(false);
    expect(carriesConflictMarkers("and >>>>>>> closes it\n")).toBe(false);
  });

  test("the separator alone is not", () => {
    expect(carriesConflictMarkers("a\n=======\nb\n")).toBe(false);
  });

  // `<<<<<<<abc` is not git's marker: git writes the label after a space, or nothing.
  test("a marker must own its line and its label boundary", () => {
    expect(carriesConflictMarkers("<<<<<<<abc\n>>>>>>>abc\n")).toBe(false);
  });

  test("a marker at the very start and end of the file is found", () => {
    expect(carriesConflictMarkers("<<<<<<<\nleft\n=======\nright\n>>>>>>>\n")).toBe(true);
  });
});

describe("findConflictMarkers", () => {
  test("names every file carrying a conflict, relative to the root", () => {
    withTree(
      (root) => {
        writeFileSync(join(root, "src.ts"), `const a = 1;\n${HUNK}`);
        mkdirSync(join(root, "docs"));
        writeFileSync(join(root, "docs", "guide.md"), HUNK);
        writeFileSync(join(root, "clean.ts"), "const b = 2;\n");
      },
      (root) => {
        expect(findConflictMarkers(root)).toEqual(["docs/guide.md", "src.ts"]);
      },
    );
  });

  test("a clean tree finds nothing", () => {
    withTree(
      (root) => writeFileSync(join(root, "clean.ts"), "const b = 2;\n"),
      (root) => expect(findConflictMarkers(root)).toEqual([]),
    );
  });

  // The checkout's own history holds the branch's earlier commits, markers and all.
  // Reading it would report a conflict for a tree that has none.
  test("the git directory is not read", () => {
    withTree(
      (root) => {
        mkdirSync(join(root, ".git", "objects"), { recursive: true });
        writeFileSync(join(root, ".git", "objects", "blob"), HUNK);
      },
      (root) => expect(findConflictMarkers(root)).toEqual([]),
    );
  });

  test("a dependency tree is not read", () => {
    withTree(
      (root) => {
        mkdirSync(join(root, "node_modules", "dep"), { recursive: true });
        writeFileSync(join(root, "node_modules", "dep", "index.js"), HUNK);
      },
      (root) => expect(findConflictMarkers(root)).toEqual([]),
    );
  });

  // A resolved binary holds one side's bytes; nothing in it is a marker, and decoding
  // it as UTF-8 would be inventing text to search.
  test("a binary file is not decoded", () => {
    withTree(
      (root) => writeFileSync(join(root, "asset.bin"), Buffer.concat([Buffer.from([0, 1, 2]), Buffer.from(HUNK)])),
      (root) => expect(findConflictMarkers(root)).toEqual([]),
    );
  });

  test("a marker quoted in prose is not a conflict", () => {
    withTree(
      (root) => writeFileSync(join(root, "README.md"), "Resolve the `<<<<<<< ours` lines first.\n"),
      (root) => expect(findConflictMarkers(root)).toEqual([]),
    );
  });
});
