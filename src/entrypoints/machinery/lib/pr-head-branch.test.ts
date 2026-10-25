import { describe, expect, test } from "bun:test";
import { isBranchName, prHead } from "./pr-head-branch.ts";

/**
 * The two answers this module reads out of other programs, kept apart from the decision
 * that composes them: `prHead` is what `gh pr view` said, and `isBranchName` is git's
 * own rule for what may be a branch.
 *
 * Both are pure here, so the guarantees they carry can be stated without a remote or a
 * fake `gh` — and so a caller that reads a branch name out of either one inherits the
 * same answers rather than a copy of them. The script-level tests that exercise the
 * whole gate on a real repository live in `resolve_pr_branch.test.ts` and
 * `dispatch_pr_validation.test.ts`.
 */
describe("lib/pr-head-branch.ts", () => {
  test("prHead reads the head branch and the fork flag", () => {
    expect(prHead('{"headRefName":"atomaton/issue-9","isCrossRepository":false}')).toEqual({
      branch: "atomaton/issue-9",
      crossRepository: false,
    });
    expect(prHead('{"headRefName":" main ","isCrossRepository":true}')).toEqual({
      branch: "main",
      crossRepository: true,
    });
    // Absent, null and malformed all mean the same thing here: nothing to name. An
    // answer that cannot be parsed is a refusal, not an exception -- the caller has
    // something to tell a person either way.
    expect(prHead("{}").branch).toBe("");
    expect(prHead('{"headRefName":null}').branch).toBe("");
    expect(prHead("[").branch).toBe("");
    expect(prHead("[").crossRepository).toBe(false);
  });

  test("isBranchName is git's rule, not a pattern of our own", () => {
    expect(isBranchName("atomaton/issue-9")).toBe(true);
    expect(isBranchName("feature/x-1.2")).toBe(true);
    for (const bad of ["", "HEAD", "has space", "a..b", "x.lock", "-x", "a:b", "x~y", "x^y"]) {
      expect(isBranchName(bad), `${bad} must not be usable as a branch`).toBe(false);
    }
  });
});
