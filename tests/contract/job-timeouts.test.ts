/**
 * job-timeouts.test.ts — no generated job is bounded only by GitHub's default.
 *
 * A job that declares no `timeout-minutes` runs under a **six-hour** default. A
 * step that then hangs — a network call with no timeout, a script waiting on
 * something that never answers — holds that job, and everything queued behind it,
 * for six hours. For the jobs that decide what happens next (the post-merge
 * re-invocation, the aggregation that starts the parent, the trigger after a
 * sub-issue closes) the hang costs the same as a wrong answer: a continuation that
 * never arrives, with nothing saying so until the default finally fires.
 *
 * `atomaton-pr-closed`, `atomaton-sub-issue-closed`, `atomaton-entry` and
 * `atomaton-manual-comment` shipped that way — eleven of their thirteen jobs
 * (#237). The missing
 * value was never a deliberate budget; it was nobody having said one, because the
 * job file that would have carried the default is the one place the question never
 * comes up.
 *
 * ## Why this is two tests
 *
 * A job is bounded in one of two places, and it depends on its shape:
 *
 * - a `runs-on:` job carries `timeout-minutes` itself (`SCRIPT_JOB_TIMEOUT_MINUTES`
 *   for the ones that are one script long, a considered value for the rest)
 * - a job that calls a reusable workflow (`uses: ./.github/workflows/x.yml`)
 *   **cannot** carry one — GitHub rejects the key — so its bound is the callee's,
 *   and the callee has to have declared it
 *
 * Checking only the first shape would let the second shape's bound go missing
 * silently: the callee's own timeout is the whole reason `entry.run` and
 * `manual-comment.run` are allowed to be unbounded here.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";

interface Job {
  "timeout-minutes"?: number;
  uses?: string;
}

const WORKFLOWS = "dist/.github/workflows";

function jobsOf(file: string): [string, Job][] {
  const workflow = Bun.YAML.parse(readFileSync(`${WORKFLOWS}/${file}`, "utf8")) as {
    jobs?: Record<string, Job>;
  };
  return Object.entries(workflow.jobs ?? {});
}

function generatedWorkflows(): string[] {
  return readdirSync(WORKFLOWS)
    .filter((name) => name.endsWith(".yml"))
    .sort();
}

describe("generated jobs", () => {
  test("each one is bounded, by itself or by the workflow it calls", () => {
    const all = generatedWorkflows().flatMap((file) =>
      jobsOf(file).map(([name, job]) => ({ file, name, job })),
    );
    expect(all.length).toBeGreaterThan(0);

    const unbounded = all
      .filter(({ job }) => job["timeout-minutes"] === undefined && job.uses === undefined)
      .map(({ file, name }) => `${file}: ${name}`);

    expect(unbounded, "bounded only by GitHub's six-hour default").toEqual([]);
  });

  test("a job that calls a reusable workflow finds the bound there", () => {
    const callers = generatedWorkflows().flatMap((file) =>
      jobsOf(file)
        .filter(([, job]) => job.uses !== undefined)
        .map(([name, job]) => ({ file, name, uses: job.uses as string })),
    );

    for (const { file, name, uses } of callers) {
      // `owner/repo/.github/workflows/x.yml@ref` and `./.github/workflows/x.yml`
      // both end in the callee's filename.
      const callee = uses.slice(uses.lastIndexOf("/") + 1);
      expect(generatedWorkflows(), `${file}: ${name} calls a workflow nothing generates`).toContain(callee);

      const bounded = jobsOf(callee).every(([, job]) => job["timeout-minutes"] !== undefined);
      expect(bounded, `${file}: ${name} is only bounded by GitHub's default`).toBe(true);
    }
  });
});
