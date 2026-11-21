import { describe, expect, test } from "bun:test";
import { planUpdate, verdictSentence } from "./update-plan.ts";

/** Fixture builders: content is just text; equality is what the plan reads. */
const base = (content: string) => new Map([["in", content]]);
const target = (content: string) => new Map([["in", content]]);
const ours = (content: string | undefined) => (content === undefined ? new Map() : new Map([["in", content]]));

describe("the plan for one path", () => {
  test("an untouched file takes the new release", () => {
    const plan = planUpdate("v1", "v2", base("old"), target("new"), ours("old"));
    expect(plan.take).toEqual(["in"]);
    expect(plan.merge).toEqual([]);
    expect(plan.kept).toEqual([]);
  });

  test("an adopter-edited file upstream did not touch stays theirs", () => {
    const plan = planUpdate("v1", "v2", base("old"), target("old"), ours("theirs-edit"));
    expect(plan.entries[0]!.outcome).toBe("skip");
    expect(plan.take).toEqual([]);
    expect(plan.kept).toEqual([]);
  });

  test("a file both sides changed is a merge for the run to resolve", () => {
    const plan = planUpdate("v1", "v2", base("old"), target("new"), ours("theirs-edit"));
    expect(plan.merge).toEqual(["in"]);
    expect(plan.take).toEqual([]);
  });

  test("a file the adopter changed to exactly the target's content needs nothing", () => {
    const plan = planUpdate("v1", "v2", base("old"), target("new"), ours("new"));
    expect(plan.entries[0]!.outcome).toBe("skip");
  });

  test("an upstream addition lands cleanly on a tree that lacks the path", () => {
    const plan = planUpdate("v1", "v2", new Map(), new Map([["new.ts", "hi"]]), new Map());
    expect(plan.add).toEqual(["new.ts"]);
  });

  test("an upstream addition never overwrites a file of the adopter's own", () => {
    const plan = planUpdate("v1", "v2", new Map(), new Map([["new.ts", "hi"]]), new Map([["new.ts", "mine"]]));
    expect(plan.add).toEqual([]);
    expect(plan.kept.map((e) => e.path)).toEqual(["new.ts"]);
    expect(plan.entries[0]!.outcome).toBe("keep");
  });

  test("a path upstream deleted goes from a tree that did not touch it", () => {
    const plan = planUpdate("v1", "v2", new Map([["gone.yml", "x"]]), new Map(), new Map([["gone.yml", "x"]]));
    expect(plan.delete).toEqual(["gone.yml"]);
  });

  test("a path upstream deleted but adopter-edited is kept for a person", () => {
    const plan = planUpdate("v1", "v2", new Map([["gone.yml", "x"]]), new Map(), new Map([["gone.yml", "edited"]]));
    expect(plan.delete).toEqual([]);
    expect(plan.kept.map((e) => e.path)).toEqual(["gone.yml"]);
  });

  test("a path the adopter already deleted stays deleted, even though upstream still ships it", () => {
    const plan = planUpdate("v1", "v2", new Map([["gone.yml", "x"]]), new Map([["gone.yml", "x"]]), new Map());
    expect(plan.entries[0]!.outcome).toBe("skip");
    expect(plan.take).toEqual([]);
  });

  test("an upstream fix does not resurrect a file the adopter deleted", () => {
    const plan = planUpdate("v1", "v2", new Map([["gone.yml", "x"]]), new Map([["gone.yml", "fixed"]]), new Map());
    expect(plan.kept.map((e) => e.path)).toEqual(["gone.yml"]);
    expect(plan.take).toEqual([]);
  });

  test("a path neither release changed is skipped however much the adopter changed it", () => {
    const plan = planUpdate("v1", "v2", base("x"), target("x"), ours("theirs"));
    expect(plan.entries[0]!.outcome).toBe("skip");
  });
});

describe("the plan as a whole", () => {
  const baseFiles = new Map([
    ["keep.yml", "same"],
    ["update.yml", "old"],
    ["both.yml", "old"],
    ["dropped.yml", "old"],
  ]);
  const targetFiles = new Map([
    ["keep.yml", "same"],
    ["update.yml", "new"],
    ["both.yml", "new"],
    ["added.yml", "hi"],
  ]);
  const oursFiles = new Map([
    ["keep.yml", "same"],
    ["update.yml", "old"],
    ["both.yml", "mine"],
    ["dropped.yml", "old"],
    ["mine-own.yml", "never in any release"],
  ]);

  test("a path in neither release is invisible to the plan", () => {
    const plan = planUpdate("v1", "v2", baseFiles, targetFiles, oursFiles);
    expect(plan.entries.map((e) => e.path)).not.toContain("mine-own.yml");
  });

  test("every path in either release appears exactly once, sorted", () => {
    const plan = planUpdate("v1", "v2", baseFiles, targetFiles, oursFiles);
    expect(plan.entries.map((e) => e.path)).toEqual([
      "added.yml",
      "both.yml",
      "dropped.yml",
      "keep.yml",
      "update.yml",
    ]);
  });

  test("the buckets agree with the entries", () => {
    const plan = planUpdate("v1", "v2", baseFiles, targetFiles, oursFiles);
    expect(plan.take).toEqual(["update.yml"]);
    expect(plan.add).toEqual(["added.yml"]);
    expect(plan.delete).toEqual(["dropped.yml"]);
    expect(plan.merge).toEqual(["both.yml"]);
  });

  test("the verdict says what kind of update this is", () => {
    const plan = planUpdate("v1", "v2", baseFiles, targetFiles, oursFiles);
    expect(verdictSentence(plan.base, plan.target, plan.merge.length, plan.kept.length)).toContain("needs a decision");
  });

  test("the verdict says a clean tree applies itself", () => {
    expect(verdictSentence("v1", "v2", 0, 0)).toContain("applies itself");
  });
});
