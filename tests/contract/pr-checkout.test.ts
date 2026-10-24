/**
 * Pins the pull-request checkout to the tip it fetches itself (#301).
 *
 * The step fetches the head branch and then re-labels a commit with its name. When
 * the re-label target was the job-start snapshot (`HEAD`, the detached
 * `refs/pull/N/head` that `actions/checkout` took), a push landing between job start
 * and this step left the worktree on the stale head while `fetch_events` built the
 * diff from the API's current head — the reviewer's two halves of one evidence base,
 * disagreeing within one run. The re-label target must be the tip this step fetched,
 * the same shape the issue path's checkout has always used.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

type Step = { name?: string; run?: string };
type WorkflowDocument = { jobs?: Record<string, { steps?: Step[] }> };

describe("the pull-request checkout matches the diff it will be read against (#301)", () => {
  const workflow = Bun.YAML.parse(
    readFileSync("dist/.github/workflows/atomaton-runner.yml", "utf8"),
  ) as WorkflowDocument;

  const steps = Object.values(workflow.jobs ?? {}).flatMap((job) => job.steps ?? []);
  const checkout = steps.find((s) => s.name === "Check out the pull request's head branch");

  test("the re-label target is the fetched tip, not the job-start snapshot", () => {
    expect(checkout, "the PR checkout step must exist").toBeDefined();
    expect(checkout?.run ?? "").toContain(
      'git checkout -B "${BRANCH_NAME}" "refs/remotes/origin/${BRANCH_NAME}"',
    );
    expect(checkout?.run ?? "").not.toContain('git checkout -B "${BRANCH_NAME}" HEAD');
    // The fetch that feeds the re-label is the step's own, against the same branch.
    expect(checkout?.run ?? "").toContain('git fetch origin "refs/heads/${BRANCH_NAME}');
  });
});
