/**
 * post-merge-reinvoke.test.ts — `reinvoke-origin-agent` waits on nothing it does not
 * read, and keeps the merge gate it must not lose with the wait.
 *
 * `reinvoke-origin-agent` reads the pull request body itself (`atomaton:parent-issue`,
 * `atomaton:origin-agent`) and uses nothing `resolve-parent` answers. Gating it on that
 * resolution meant a root issue -- which has no parent, so the answer is "" -- was never
 * re-invoked after its pull request merged: `Atomaton PR Closed`'s earlier self, run
 * 39274230329, succeeded with `reinvoke-origin-agent`, `notify-parent` and
 * `aggregate-sub-issues` all skipped (#203, observed on #206 / pull request #233).
 *
 * The merge gate is a separate question. It used to be inherited from `parse` through
 * `needs` -- GitHub skips a job whose needed job was skipped -- and `parse` was the only
 * job testing the event. Since #267 `parse` runs for BOTH outcomes of `closed` (the
 * rejection side reads its output), so no gate can be inherited any more and every
 * merge-side job states its own -- which is also what keeps a close that merged nothing
 * from commenting on the parent about a merge that did not happen, or aggregating one.
 *
 * The other two still need the parent: one writes to it, the other aggregates into it.
 * That difference is the thing worth holding -- a job may be free of an answer only
 * when it does not use it.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

interface Job {
  needs?: string | string[];
  if?: string;
}

function jobs(): Record<string, Job> {
  const workflow = Bun.YAML.parse(readFileSync("dist/.github/workflows/atomaton-pr-closed.yml", "utf8")) as {
    jobs: Record<string, Job>;
  };
  return workflow.jobs;
}

/** `needs` as a list, whichever shape the generator wrote. */
function needs(job: Job | undefined): string[] {
  return [job?.needs ?? []].flat();
}

describe("post-merge re-invocation", () => {
  test("does not wait on the resolved parent, but still only runs for a merge", () => {
    const reinvoke = jobs()["reinvoke-origin-agent"];
    expect(reinvoke, "run `bun run synth` first").toBeDefined();
    expect(reinvoke?.if ?? "", "the decision belongs to dispatch_post_merge.ts").not.toContain("parent_issue");
    expect(needs(reinvoke), "it uses nothing that resolution answers").not.toContain("resolve-parent");
    expect(reinvoke?.if ?? "", "a close that merged nothing must not re-invoke anybody").toContain(
      "github.event.pull_request.merged == true",
    );
  });

  test("the jobs that use the parent still wait for it", () => {
    const all = jobs();
    for (const name of ["notify-parent", "aggregate-sub-issues"]) {
      expect(needs(all[name]), `${name} needs the resolved parent`).toContain("resolve-parent");
      expect(all[name]?.if ?? "", `${name} must not run without one`).toContain(
        "resolve-parent.outputs.parent_issue",
      );
    }
  });

  /**
   * Every merge-side job now states the merge itself, because the gate it used
   * to inherit from `parse` is gone: parse runs for both outcomes of `closed`
   * so the rejection side can read its output (#267). A close that merged
   * nothing must not reach any of these three.
   */
  test("the merge-side jobs still test the merge themselves", () => {
    const all = jobs();
    for (const name of ["notify-parent", "reinvoke-origin-agent", "aggregate-sub-issues"]) {
      expect(all[name]?.if ?? "", `${name} must not run for a close that merged nothing`).toContain(
        "github.event.pull_request.merged == true",
      );
    }
  });

  /**
   * The rejection half (#267): the close that merged nothing is returned to the
   * origin agent, and only that close -- the merged outcome belongs to the
   * three jobs above. It reads the issue from `parse` and decides everything
   * else itself, so `parse` is the one thing it waits on.
   */
  test("the close that merged nothing goes to dispatch-rejected, and only that close", () => {
    const rejected = jobs()["dispatch-rejected"];
    expect(rejected, "run `bun run synth` first").toBeDefined();
    expect(rejected?.if ?? "").toContain("github.event.pull_request.merged == false");
    expect(needs(rejected), "it reads the linked issue from parse").toContain("parse");
    expect(needs(rejected), "it uses nothing that resolution answers").not.toContain("resolve-parent");
  });

  /**
   * The membership gate the reviewer required on #269, and the one test that
   * catches its absence: this is the only event-driven dispatch in the
   * repository that fires on an outcome an outside contributor can produce, so
   * without this test the boundary in `docs/work/boundaries.md` -- an agent
   * only starts when a repository member triggered it -- is a paragraph, not a
   * property. A fork's pull request closed unmerged must start nothing,
   * however its body is written.
   *
   * The signal is the head repository, not `author_association`: an agent's
   * pull request is authored by `github-actions[bot]`, association `NONE`, so
   * an association test would be false for every pull request the machinery
   * opened (the trap recorded on `atomaton-sub-issue-closed.wac.ts`).
   */
  test("dispatch-rejected fires only for a pull request whose head branch is this repository's", () => {
    const rejected = jobs()["dispatch-rejected"];
    expect(rejected, "run `bun run synth` first").toBeDefined();
    expect(rejected?.if ?? "").toContain("github.event.pull_request.head.repo.full_name == github.repository");
  });
});
