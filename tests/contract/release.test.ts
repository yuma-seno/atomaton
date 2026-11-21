import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * release.test.ts — a release is one button, and what it applies to this
 * repository it applies through the machinery.
 *
 * `release.yml` used to be two files: `release.yml` prepared the pull request and
 * stopped, and `release-pipeline.yml` called it (`workflow_call`), merged, waited
 * for the publish, and applied the release with a rebuild of `.github/`. The
 * application became the update machinery's three-way plan, the rebuild -- and the
 * `self/` mirror it needed -- went away, and with them the reason a release was
 * two files declaring its inputs twice. That duplication was not free: a
 * `workflow_call` that declared `type: choice` (a dispatch-only shape) was an
 * invalid workflow file, and GitHub answered every push with a run that failed to
 * parse it. One file, one declaration, is the fix this test pins.
 *
 * Three things about the merged workflow are easy to lose in an edit and expensive
 * to lose in production, so they are pinned here rather than left to a reader:
 *
 * - the jobs are chained by `needs`, and `apply-to-self` names BOTH of its
 *   predecessors, because the tag it announces is `release`'s output and GitHub
 *   exposes outputs only to a job that names their job directly;
 * - the merge is `--auto`, not a watched merge. The ruleset requires
 *   `atomaton-check`, which the plan job dispatches -- so on a fresh pull request
 *   the deciding check does not exist yet, and a merge fired when the visible
 *   checks are green races that dispatch and loses (measured: the base branch
 *   policy refused the merge). A watched fallback may exist for repositories
 *   without auto-merge, but `--auto` is the primary path;
 * - the application dispatches through the bridge (`dispatch_update.ts`), the same
 *   script the `!upgrade` comment command runs. The contract that keeps dispatch
 *   calls in one module is not suspended for the button that releases the
 *   machinery itself.
 */
type Job = {
  needs?: string | string[];
  if?: string;
  steps?: { env?: Record<string, string>; run?: string }[];
};

const text = readFileSync(".github/workflows/release.yml", "utf8");
const workflow = Bun.YAML.parse(text) as { name?: string; jobs?: Record<string, Job> };
const jobs = workflow.jobs ?? {};
const script = (job: Job | undefined) => (job?.steps ?? []).map((step) => step.run ?? "").join("\n");
const env = (job: Job | undefined) => Object.assign({}, ...(job?.steps ?? []).map((step) => step.env ?? {}));

const needs = (job: Job | undefined): string[] => {
  const declared = job?.needs;
  return declared === undefined ? [] : Array.isArray(declared) ? declared : [declared];
};

describe("Release", () => {
  test("it is dispatched by a person, and only by a person", () => {
    expect(workflow.name).toBe("Release");
    expect(text, "the trigger a person presses").toContain("workflow_dispatch:");
    // A called workflow is reachable by an `actions: write` token, and a second
    // input declaration was how `type: choice` reached a `workflow_call` and
    // invalidated the file. Dispatch-only is both the audience and the ratchet.
    expect(text, "nothing may call the release itself").not.toContain("workflow_call:");
    expect(script(jobs["refuse-bot"])).toContain("[bot]");
  });

  test("the stages are chained, and the application reads only what it needs", () => {
    expect(Object.keys(jobs)).toEqual(["refuse-bot", "release", "merge-release", "apply-to-self"]);
    expect(needs(jobs.release)).toEqual(["refuse-bot"]);
    expect(needs(jobs["merge-release"])).toEqual(["release"]);
    // BOTH predecessors: the tag is `release`'s output, `merge-release`'s success
    // is the gate. Naming only one was the bug that once made a tag empty.
    expect(needs(jobs["apply-to-self"])).toEqual(["release", "merge-release"]);
    // The application is opt-out (`deploy: false`), never opt-in: a release that
    // forgot to apply itself would leave this repository behind its own releases.
    expect(jobs["apply-to-self"]?.if).toContain("inputs.deploy");
    expect(jobs["apply-to-self"]?.if).toContain("needs.merge-release.result == 'success'");
  });

  test("the merge waits for the whole ruleset via --auto, and never falls back to --admin", () => {
    const merged = script(jobs["merge-release"]);
    const merge = merged.indexOf("gh pr merge");
    const deployWait = merged.indexOf("gh run watch");
    expect(merged, "the primary path is auto-merge, so the late-arriving required check is waited for").toContain(
      "--merge --auto",
    );
    expect(merged, "a refusal must say the race it reopens").toContain("::warning::");
    expect(merged, "the merge must be confirmed by reading the merge commit back").toContain("mergeCommit");
    expect(deployWait, "the publish is waited for after the merge").toBeGreaterThan(merge);
    expect(merged, "a ruleset bypass is never acceptable").not.toContain("--admin");
    expect(merged).toContain("--event push");
    expect(merged).toContain("gh release view");
  });

  test("a job reads outputs only from a job it needs", () => {
    const references = (value: unknown): string[] => {
      if (typeof value === "string") {
        return [...value.matchAll(/\bneeds\.([A-Za-z0-9_-]+)\.(?:outputs|result)\b/g)]
          .map((match) => match[1] ?? "")
          .filter((name) => name !== "");
      }
      if (Array.isArray(value)) return value.flatMap(references);
      if (typeof value === "object" && value !== null) return Object.values(value).flatMap(references);
      return [];
    };

    for (const [name, job] of Object.entries(jobs)) {
      for (const dependency of references(job)) {
        expect(needs(job), `${name} reads needs.${dependency} but does not list it in needs`).toContain(dependency);
      }
    }
  });

  test("the merge carries RELEASE_TOKEN, because a GITHUB_TOKEN merge starts no push", () => {
    const variables = env(jobs["merge-release"]);
    expect(variables.MERGE_TOKEN, "merge-release merges as the PAT").toBe("${{ secrets.RELEASE_TOKEN }}");
    expect(variables.GH_TOKEN, "merge-release reads as the workflow token").toBe("${{ github.token }}");
    expect(script(jobs["merge-release"]), "the PAT is overridden for the merge only").toContain(
      'GH_TOKEN="$MERGE_TOKEN" gh pr merge',
    );
    // The old name is the old concept: a token whose whole job was a rebuild that
    // no longer exists. Its survival here would mean the rebuild came back with it.
    expect(text).not.toContain("SELF_DEPLOY_TOKEN");
  });

  test("the application goes through the bridge, and never dispatches from bash", () => {
    const applied = script(jobs["apply-to-self"]);
    expect(applied, "the same bridge the !upgrade command runs").toContain("dispatch_update.ts");
    expect(applied, "the contract on dispatch sites is not suspended for this file").not.toContain(
      "gh workflow run",
    );
  });
});
