import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { planUpdate } from "../../../domain/machinery/update-plan.ts";
import { applyPlan } from "./update-apply.ts";

/**
 * The apply engine, against a temp tree.
 *
 * The plan's words — take, add, delete, merge — are only words until something
 * writes a file; this is where the writes are. The two interesting assertions are
 * about the `merge` bucket, because that is where the machinery's own judgement
 * lives: a file both sides changed either merges free of markers (which is why an
 * update may merge itself) or comes out carrying markers whose labels name both
 * sides (which is why it stops at a pull request).
 */

function tree(): string {
  return mkdtempSync(join(tmpdir(), "update-apply-"));
}
const cleanup = (dir: string): void => rmSync(dir, { recursive: true, force: true });
const onDisk = (dir: string, path: string): string | null =>
  existsSync(join(dir, path)) ? readFileSync(join(dir, path), "utf8") : null;

describe("the mechanical outcomes", () => {
  test("take writes the target's content over the adopter's untouched copy", () => {
    const dir = tree();
    try {
      writeFileSync(join(dir, "a.yml"), "old\n");
      const plan = planUpdate("v1", "v2", new Map([["a.yml", "old\n"]]), new Map([["a.yml", "new\n"]]), new Map([["a.yml", "old\n"]]));
      const applied = applyPlan(dir, plan, new Map([["a.yml", "old\n"]]), new Map([["a.yml", "new\n"]]), new Map([["a.yml", "old\n"]]));
      if (!("result" in applied)) throw new Error(applied.why);
      expect(applied.result.taken).toEqual(["a.yml"]);
      expect(onDisk(dir, "a.yml")).toBe("new\n");
    } finally {
      cleanup(dir);
    }
  });

  test("add creates nested directories the release needs", () => {
    const dir = tree();
    try {
      const target = new Map([[".github/atomaton-runtime/scripts/new.sh", "hi\n"]]);
      const plan = planUpdate("v1", "v2", new Map(), target, new Map());
      const applied = applyPlan(dir, plan, new Map(), target, new Map());
      if (!("result" in applied)) throw new Error(applied.why);
      expect(applied.result.added).toEqual([".github/atomaton-runtime/scripts/new.sh"]);
      expect(onDisk(dir, ".github/atomaton-runtime/scripts/new.sh")).toBe("hi\n");
    } finally {
      cleanup(dir);
    }
  });

  test("delete removes a path the plan dropped", () => {
    const dir = tree();
    try {
      writeFileSync(join(dir, "gone.yml"), "x\n");
      const plan = planUpdate("v1", "v2", new Map([["gone.yml", "x"]]), new Map(), new Map([["gone.yml", "x"]]));
      const applied = applyPlan(dir, plan, new Map([["gone.yml", "x"]]), new Map(), new Map([["gone.yml", "x"]]));
      if (!("result" in applied)) throw new Error(applied.why);
      expect(applied.result.removed).toEqual(["gone.yml"]);
      expect(existsSync(join(dir, "gone.yml"))).toBe(false);
    } finally {
      cleanup(dir);
    }
  });

  test("kept and skipped paths are left exactly as they stand", () => {
    const dir = tree();
    try {
      writeFileSync(join(dir, "mine.yml"), "mine\n");
      // `mine.yml` is in the base release and the adopter changed it; upstream
      // did not, so the plan skips it entirely.
      const plan = planUpdate("v1", "v2", new Map([["mine.yml", "base"]]), new Map([["mine.yml", "base"]]), new Map([["mine.yml", "mine\n"]]));
      const applied = applyPlan(dir, plan, new Map([["mine.yml", "base"]]), new Map([["mine.yml", "base"]]), new Map([["mine.yml", "mine\n"]]));
      if (!("result" in applied)) throw new Error(applied.why);
      expect(applied.result.taken).toEqual([]);
      expect(onDisk(dir, "mine.yml")).toBe("mine\n");
    } finally {
      cleanup(dir);
    }
  });
});

describe("the merge bucket", () => {
  test("a merge both sides made in different places resolves with no conflict", () => {
    const dir = tree();
    try {
      // Different ends of the file: git merges both without asking anybody.
      const base = "one\ntwo\nthree\n";
      const ours = "one\ntwo\nthree\nfour (ours)\n";
      const theirs = "zero (theirs)\none\ntwo\nthree\n";
      const baseMap = new Map([["shared.md", base]]);
      const theirsMap = new Map([["shared.md", theirs]]);
      writeFileSync(join(dir, "shared.md"), ours);
      const plan = planUpdate("v1", "v2", baseMap, theirsMap, new Map([["shared.md", ours]]));
      const applied = applyPlan(dir, plan, baseMap, theirsMap, new Map([["shared.md", ours]]));
      if (!("result" in applied)) throw new Error(applied.why);
      expect(applied.result.merged).toEqual(["shared.md"]);
      expect(applied.result.conflicts).toEqual([]);
      expect(onDisk(dir, "shared.md")).toBe("zero (theirs)\none\ntwo\nthree\nfour (ours)\n");
    } finally {
      cleanup(dir);
    }
  });

  /**
   * The stop condition, measured: the file comes out carrying markers whose labels
   * name both sides, and the result says so — which is what turns into "a person is
   * needed on this pull request" rather than a merge.
   */
  test("a real collision comes out wirh both sides named in the markers", () => {
    const dir = tree();
    try {
      const base = "one\ntwo\n";
      const ours = "one\nours\n";
      const theirs = "one\ntheirs\n";
      const baseMap = new Map([["collide.md", base]]);
      const theirsMap = new Map([["collide.md", theirs]]);
      writeFileSync(join(dir, "collide.md"), ours);
      const plan = planUpdate("v1", "v2", baseMap, theirsMap, new Map([["collide.md", ours]]));
      const applied = applyPlan(dir, plan, baseMap, theirsMap, new Map([["collide.md", ours]]));
      if (!("result" in applied)) throw new Error(applied.why);
      expect(applied.result.conflicts).toEqual(["collide.md"]);
      const content = onDisk(dir, "collide.md") ?? "";
      expect(content).toContain("<<<<<<<");
      expect(content).toContain("(ours)");
      expect(content).toContain("(theirs)");
      expect(content).toContain(">>>>>>>");
    } finally {
      cleanup(dir);
    }
  });
});

describe("what it refuses", () => {
  test("a path that resolves outside the tree is refused before anything is written", () => {
    const dir = tree();
    try {
      const baseMap = new Map([[".github/x", "1"], ["evil", "2"]]);
      const targetMap = new Map([[".github/x", "2"], ["../../../../outside", "3"]]);
      mkdirSync(join(dir, ".github"), { recursive: true });
      writeFileSync(join(dir, ".github", "x"), "1");
      const plan = planUpdate("v1", "v2", baseMap, targetMap, new Map([[".github/x", "1"]]));
      const applied = applyPlan(dir, plan, baseMap, targetMap, new Map([[".github/x", "1"]]));
      expect("why" in applied).toBe(true);
      // Nothing else has been written yet: the refusal is total, not partial.
      expect(onDisk(dir, ".github/x")).toBe("1");
    } finally {
      cleanup(dir);
    }
  });

  test("a take whose content the target does not carry is refused", () => {
    const dir = tree();
    try {
      const plan = planUpdate("v1", "v2", new Map([["a", "x"]]), new Map([["a", "y"]]), new Map([["a", "x"]]));
      // The plan came from these maps, so this cannot happen in production; the
      // check exists because a caller could pass maps that disagree.
      const applied = applyPlan(dir, plan, new Map([["a", "x"]]), new Map(), new Map([["a", "x"]]));
      expect("why" in applied).toBe(true);
    } finally {
      cleanup(dir);
    }
  });
});
