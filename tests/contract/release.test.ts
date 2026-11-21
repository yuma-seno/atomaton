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
 * - the merge waits for the required check to EXIST before watching anything.
 *   The check workflow runs in two phases -- plan jobs first, and they dispatch
 *   the real check -- so on a fresh pull request the deciding check does not
 *   exist yet, and a merge fired when the visible checks are green races that
 *   dispatch and loses (measured: the base branch policy refused the merge);
 * - the workflow runs on `GITHUB_TOKEN` alone, and the three events that token
 *   suppresses are each dispatched through a bridge (`dispatch_ci.ts`,
 *   `dispatch_cd.ts`, `dispatch_update.ts`). A secret here would be one a person
 *   has to set, and the machinery's own push already travels under its own;
 * - the application dispatches through the bridge (`dispatch_update.ts`), the same
 *   script the `!upgrade` comment command runs. The contract that keeps dispatch
 *   calls in one module is not suspended for the button that releases the
 *   machinery itself.
 */
type Job = {
  needs?: string | string[];
  if?: string;
  permissions?: Record<string, string>;
  steps?: { env?: Record<string, string>; run?: string }[];
};

const text = readFileSync(".github/workflows/release.yml", "utf8");
const workflow = Bun.YAML.parse(text) as { name?: string; jobs?: Record<string, Job> };
const jobs = workflow.jobs ?? {};
const script = (job: Job | undefined) => (job?.steps ?? []).map((step) => step.run ?? "").join("\n");

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

  test("the merge waits for the required check to exist, then watches, and never bypasses the ruleset", () => {
    const merged = script(jobs["merge-release"]);
    const wait = merged.indexOf('select(.name == "atomaton-check")');
    const checks = merged.indexOf("gh pr checks");
    const merge = merged.indexOf("gh pr merge");
    expect(wait, "the merge waits for the REQUIRED check to be registered, not for the visible checks to finish")
      .toBeGreaterThan(-1);
    expect(checks, "the merge must watch the checks").toBeGreaterThan(-1);
    expect(merge, "the merge must merge").toBeGreaterThan(-1);
    expect(wait, "the wait comes before the watch").toBeLessThan(checks);
    expect(checks, "the merge must not merge before the checks have passed").toBeLessThan(merge);
    // --auto would depend on the repository having auto-merge enabled, and the
    // wait it stands in for is one this workflow can make itself: it started
    // the check, so it can wait for its existence and then watch it.
    expect(merged, "the merge does not lean on an auto-merge setting").not.toContain("--auto");
    expect(merged, "a ruleset bypass is never acceptable").not.toContain("--admin");
    expect(merged).toContain("--event workflow_dispatch");
    expect(merged).toContain("gh run watch");
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

  test("it runs on GITHUB_TOKEN alone, and bridges the three events that token suppresses", () => {
    // No secret is read anywhere: a PAT is not needed, because every event
    // `GITHUB_TOKEN` suppresses is bridged explicitly, the same way the
    // machinery bridges an agent's own merges. Naming a secret here would make
    // a person set one, and the update's push already travels under the
    // machinery's own.
    expect(text, "no secret is read; the bridges cover the suppressed events").not.toContain("secrets.");
    const prepared = script(jobs.release);
    const merged = script(jobs["merge-release"]);
    const applied = script(jobs["apply-to-self"]);
    // The pull request fires no event: the check is started through the bridge.
    expect(prepared, "the check a ruleset requires is dispatched, not waited for").toContain("dispatch_ci.ts");
    // The merge fires no push: the deploy is dispatched through the bridge.
    expect(merged, "the deploy a merge would have started is dispatched").toContain("dispatch_cd.ts");
    // The application is the machinery's own bridge, the `!upgrade` route.
    expect(applied).toContain("dispatch_update.ts");
    // And each dispatching job holds the permission the dispatch needs, or it
    // fails after doing the work that came before it: `gh workflow run` under
    // the hood is an `actions: write` call, and a job granted only reads gets
    // all the way to a red step after the release is already published.
    for (const name of ["release", "merge-release", "apply-to-self"]) {
      expect(jobs[name]?.permissions?.["actions"], `${name} may dispatch`).toBe("write");
    }
    // And no raw dispatch hides in the step bodies. The same rule as
    // `dispatch-sites.test.ts`, tuned for this file's remediation messages: a
    // `#` line explains why a run is dispatched without being one, and a
    // `::error::` line tells a person the command to re-run a failed publish —
    // a message, not a dispatch. Everything else naming the command is one.
    for (const [name, job] of Object.entries(jobs)) {
      const body = script(job)
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("#"))
        .filter((line) => !line.includes("::error::") && !line.includes("::notice::"))
        .join("\n");
      expect(body, `${name} dispatches through the bridge`).not.toMatch(/gh\s+workflow\s+run/);
    }
  });

  test("the application goes through the bridge, and never dispatches from bash", () => {
    const applied = script(jobs["apply-to-self"]);
    expect(applied, "the same bridge the !upgrade command runs").toContain("dispatch_update.ts");
    expect(applied, "the contract on dispatch sites is not suspended for this file").not.toContain(
      "gh workflow run",
    );
  });
});
