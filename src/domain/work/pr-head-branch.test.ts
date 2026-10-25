import { describe, expect, test } from "bun:test";
import { describePrHeadRefusal, validationNotDispatchedNotice } from "./pr-head-branch.ts";

/**
 * What a person is told when the run they asked for was not started (#344).
 *
 * A member can comment `/<agent>` on a pull request from a fork, and validation cannot
 * run CI against the fork's branch. The refusal is the only thing that person reads, so
 * what it must carry is: this names them, this is the pull request, nothing is coming,
 * and here is what would make a run happen.
 */
describe("pr-head-branch.ts", () => {
  test("a fork's head is described as belonging to the fork, not to this repository", () => {
    expect(describePrHeadRefusal(12, { kind: "fork" })).toContain("comes from a fork");
  });

  test("a refusal names the person, the pull request, and says nothing is coming", () => {
    const notice = validationNotDispatchedNotice("octocat", 12, { kind: "fork" });
    expect(notice).toContain("@octocat");
    expect(notice).toContain("#12");
    expect(notice).toContain("was not started");
    expect(notice).toContain("Nothing was dispatched");
  });

  /**
   * The fork is the one refusal a person can act on by moving the branch, and it is the
   * one that used to arrive as a red job: the advice has to be the action, not a retry.
   */
  test("a fork is told to push the branch here rather than to try again", () => {
    const notice = validationNotDispatchedNotice("octocat", 12, { kind: "fork" });
    expect(notice).toContain("Push the branch into this repository");
  });

  /**
   * A transient read is the opposite case: nothing is wrong with the pull request, so
   * "push the branch here" would be advice about a problem that does not exist.
   */
  test("a pull request that could not be read is told to try again, not to move a branch", () => {
    const notice = validationNotDispatchedNotice("octocat", 12, {
      kind: "unreadable",
      detail: "gh: 504",
    });
    expect(notice).toContain("gh: 504");
    expect(notice).toContain("Comment again once #12 can be read");
    expect(notice).not.toContain("Push the branch");
  });

  test("a name git would refuse is described with the name it refused", () => {
    expect(describePrHeadRefusal(12, { kind: "not-a-branch-name", branch: "HEAD" })).toContain(
      "names 'HEAD', which is not a branch name",
    );
  });

  /**
   * An `origin` that could not be read is not "this repository does not have the
   * branch": that sentence sends a person whose branch is fine to move it again. It is
   * a retry, and it says why (#346).
   */
  test("an unreadable origin is a retry, not a branch this repository lacks", () => {
    const refusal = { kind: "origin-unreadable", detail: "could not read 'x' from origin: 502" } as const;
    const notice = validationNotDispatchedNotice("octocat", 12, refusal);
    expect(notice).toContain("could not be checked against this repository");
    expect(notice).toContain("could not read 'x' from origin: 502");
    expect(notice).toContain("Comment again once this repository's branches can be read");
    expect(notice).not.toContain("Push the branch");
    expect(describePrHeadRefusal(12, refusal)).not.toContain("is not a branch of this repository");
  });

  /** With no comment author to name, the notice still reads as a sentence. */
  test("a notice without a commenter does not open on a stray space", () => {
    const notice = validationNotDispatchedNotice("", 12, { kind: "no-branch" });
    expect(notice.startsWith("Atomaton:")).toBe(true);
  });
});
