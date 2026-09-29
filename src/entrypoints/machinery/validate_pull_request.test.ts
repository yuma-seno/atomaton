import { describe, expect, test } from "bun:test";
import { findExistingCiRun, pickDispatchedRun } from "./validate_pull_request.ts";

type Run = Parameters<typeof pickDispatchedRun>[0][number];
type CiRun = Parameters<typeof findExistingCiRun>[0][number];

function run(overrides: Partial<Run> = {}): Run {
  return {
    id: 1,
    status: "completed",
    conclusion: "success",
    head_sha: "abc123",
    created_at: "2026-08-15T10:00:00Z",
    event: "workflow_dispatch",
    ...overrides,
  };
}

function ciRun(overrides: Partial<CiRun> = {}): CiRun {
  return {
    ...run(),
    path: ".github/workflows/atomaton-check.yml",
    ...overrides,
  };
}

// `gh workflow run` returns nothing identifying the run it started, so it has to
// be recognised afterwards. Everything here is about not adopting the wrong one.
describe("pickDispatchedRun", () => {
  test("finds the run dispatched for this commit", () => {
    const picked = pickDispatchedRun([run({ id: 7 })], "abc123", "2026-08-15T09:59:00Z");
    expect(picked?.id).toBe(7);
  });

  // The case that makes matching on SHA rather than branch worth it: a human
  // pushing to the same branch while an agent works produces a different commit,
  // and its run must not be read as this validation's result.
  test("ignores a run for a different commit on the same branch", () => {
    const picked = pickDispatchedRun([run({ head_sha: "def456" })], "abc123", "2026-08-15T09:59:00Z");
    expect(picked).toBeUndefined();
  });

  test("ignores runs that predate the dispatch", () => {
    const earlier = run({ created_at: "2026-08-15T09:00:00Z" });
    expect(pickDispatchedRun([earlier], "abc123", "2026-08-15T09:59:00Z")).toBeUndefined();
  });

  // A `pull_request` run sits on the same commit, held at `action_required`.
  // Adopting it would read the hold as this validation's verdict.
  test("ignores runs from other events", () => {
    const held = run({ event: "pull_request", status: "completed", conclusion: "action_required" });
    expect(pickDispatchedRun([held], "abc123", "2026-08-15T09:59:00Z")).toBeUndefined();
  });

  test("takes the newest when a commit was validated more than once", () => {
    const runs = [
      run({ id: 1, created_at: "2026-08-15T10:00:00Z" }),
      run({ id: 2, created_at: "2026-08-15T10:05:00Z" }),
    ];
    expect(pickDispatchedRun(runs, "abc123", "2026-08-15T09:59:00Z")?.id).toBe(2);
  });

  test("reports a run that is still going rather than hiding it", () => {
    const picked = pickDispatchedRun([run({ status: "in_progress", conclusion: null })], "abc123", "2026-08-15T09:59:00Z");
    expect(picked?.status).toBe("in_progress");
    expect(picked?.conclusion).toBeNull();
  });
});

/**
 * CI is dispatched more than once for the same commit -- `create_pr`,
 * `commit_and_push`, and a person's `/agent` comment each start a validation -- and
 * each used to run CI again from scratch. The commit has not changed between them,
 * so the verdict cannot have, and the second and third runs bought nothing but
 * runner time. This is the reader that lets a validation reuse what is already there.
 */
describe("findExistingCiRun", () => {
  const ci = "atomaton-check.yml";

  test("finds a completed run for this commit and workflow", () => {
    const found = findExistingCiRun([ciRun({ id: 9 })], ci, "abc123");
    expect(found?.id).toBe(9);
    expect(found?.conclusion).toBe("success");
  });

  // The whole point: a run that already exists is reused rather than duplicated.
  test("finds a run that is still going, so it can be waited for", () => {
    const found = findExistingCiRun([ciRun({ status: "in_progress", conclusion: null })], ci, "abc123");
    expect(found?.status).toBe("in_progress");
  });

  // A different commit is a different verdict, and reusing it would report the
  // previous head's result as this one's.
  test("ignores a run for a different commit", () => {
    expect(findExistingCiRun([ciRun({ head_sha: "def456" })], ci, "abc123")).toBeUndefined();
  });

  // A repository with its own CI names it in `checks.your_workflow`; a run of the
  // shipped workflow is not that project's verdict.
  test("ignores a run of a different workflow", () => {
    const other = ciRun({ path: ".github/workflows/other.yml" });
    expect(findExistingCiRun([other], ci, "abc123")).toBeUndefined();
  });

  // A `pull_request` run sits on the same commit held at `action_required` -- GitHub
  // holds a workflow a bot's pull request triggered. Adopting it would read the hold
  // as a verdict.
  test("ignores a held pull_request run on the same commit", () => {
    const held = ciRun({ event: "pull_request", conclusion: "action_required" });
    expect(findExistingCiRun([held], ci, "abc123")).toBeUndefined();
  });

  test("takes the newest when the commit has several runs", () => {
    const runs = [
      ciRun({ id: 1, created_at: "2026-08-15T10:00:00Z" }),
      ciRun({ id: 2, created_at: "2026-08-15T10:05:00Z" }),
    ];
    expect(findExistingCiRun(runs, ci, "abc123")?.id).toBe(2);
  });
});
