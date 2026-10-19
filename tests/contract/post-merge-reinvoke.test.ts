/**
 * post-merge-reinvoke.test.ts — `reinvoke-origin-agent` waits on nothing it does not
 * read, and keeps the merge gate it must not lose with the wait.
 *
 * `reinvoke-origin-agent` reads the pull request body itself (`atomaton:parent-issue`,
 * `atomaton:origin-agent`) and uses nothing `resolve-parent` answers. Gating it on that
 * resolution meant a root issue -- which has no parent, so the answer is "" -- was never
 * re-invoked after its pull request merged: `Atomaton PR Merged` run 39274230329
 * succeeded with `reinvoke-origin-agent`, `notify-parent` and `aggregate-sub-issues`
 * all skipped (#203, observed on #206 / pull request #233).
 *
 * The merge gate is a separate question. It used to be inherited from `parse` through
 * `needs` -- GitHub skips a job whose needed job was skipped -- so dropping `needs`
 * dropped it too, and `pull_request_target: closed` fires for a close that merged
 * nothing. A closed-unmerged pull request would then post "the pull request for this
 * issue merged" on its issue and start a run on it.
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
  const workflow = Bun.YAML.parse(readFileSync("dist/.github/workflows/atomaton-pr-merged.yml", "utf8")) as {
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
});
