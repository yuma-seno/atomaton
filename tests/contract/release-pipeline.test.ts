import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * release-pipeline.test.ts — a release is one button, and every merge it makes is
 * still gated by checks.
 *
 * The pipeline exists so a person does not carry a release from one workflow to the
 * next by hand: it declares the version, merges that pull request, waits for the
 * release to be published, applies the release to this repository's own `.github/`,
 * and merges that too.
 *
 * Three things about it are easy to lose in an edit and expensive to lose in
 * production, so they are pinned here rather than left to a reader:
 *
 * - the jobs are chained by `needs`, so a merge cannot run before the pull request
 *   it merges exists;
 * - checks are watched before the merge. "Machine-generated, so no review" is not
 *   "no checks", and a red change must stay open;
 * - the merge itself carries `SELF_DEPLOY_TOKEN`. A merge made with `GITHUB_TOKEN`
 *   starts no `push`, so the deploy would never run.
 *
 * `self-overlay.test.ts` holds this file to its `.github/` copy; this one holds the
 * copy to what the pipeline is supposed to do.
 */
type Job = {
  needs?: string | string[];
  uses?: string;
  if?: string;
  with?: Record<string, unknown>;
  steps?: { env?: Record<string, string>; run?: string }[];
};

const text = readFileSync("self/workflows/release-pipeline.yml", "utf8");
const pipeline = Bun.YAML.parse(text) as { name?: string; jobs?: Record<string, Job> };
const jobs = pipeline.jobs ?? {};
const script = (job: Job | undefined) => (job?.steps ?? []).map((step) => step.run ?? "").join("\n");
const env = (job: Job | undefined) => Object.assign({}, ...(job?.steps ?? []).map((step) => step.env ?? {}));

const needs = (job: Job | undefined): string[] => {
  const declared = job?.needs;
  return declared === undefined ? [] : Array.isArray(declared) ? declared : [declared];
};

describe("Release Pipeline", () => {
  test("it is dispatched by a person, and only by a person", () => {
    expect(pipeline.name).toBe("Release Pipeline");
    expect(text, "the trigger a person presses").toContain("workflow_dispatch:");
    // A called workflow would be reachable by an `actions: write` token. The
    // pipeline is the thing that decides a release may happen, so it is
    // dispatch-only and refuses a bot in its first job.
    expect(text, "nothing may call the pipeline itself").not.toContain("workflow_call:");
    expect(script(jobs["refuse-bot"])).toContain("[bot]");
  });

  test("the stages are chained, so each merge has the pull request it merges", () => {
    expect(Object.keys(jobs)).toEqual([
      "refuse-bot",
      "release",
      "merge-release",
      "self-deploy",
      "merge-self-deploy",
    ]);
    expect(needs(jobs.release)).toEqual(["refuse-bot"]);
    expect(needs(jobs["merge-release"])).toEqual(["release"]);
    // `release` as well as `merge-release`, because the tag comes from its output.
    expect(needs(jobs["self-deploy"])).toEqual(["release", "merge-release"]);
    expect(needs(jobs["merge-self-deploy"])).toEqual(["self-deploy"]);

    expect(jobs.release?.uses).toBe("./.github/workflows/release.yml");
    expect(jobs["self-deploy"]?.uses).toBe("./.github/workflows/self-deploy.yml");
    // The exact tag that was published, never `latest`: a delayed or concurrent
    // release could make `latest` something else by the time it is read.
    expect(jobs["self-deploy"]?.with?.version).toBe("${{ needs.release.outputs.tag }}");
  });

  test("each merge waits for the checks, and does not fall back to --admin", () => {
    for (const name of ["merge-release", "merge-self-deploy"]) {
      const merged = script(jobs[name]);
      const checks = merged.indexOf("gh pr checks");
      const merge = merged.indexOf("gh pr merge");
      expect(checks, `${name} must watch the checks`).toBeGreaterThan(-1);
      expect(merge, `${name} must merge`).toBeGreaterThan(-1);
      expect(checks, `${name} must not merge before the checks have passed`).toBeLessThan(merge);
      expect(merged, `${name} must not bypass the ruleset`).not.toContain("--admin");
    }
  });

  /**
   * This failed the first time the pipeline ran: `self-deploy` read
   * `needs.release.outputs.tag` while naming only `merge-release` in `needs`, so
   * the tag evaluated to empty and the branch became `self-deploy/`, which git
   * refuses. GitHub exposes a job's outputs only to jobs that name it directly.
   */
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

  test("it waits for the push-triggered Deploy run, not a later one on the same commit", () => {
    const merged = script(jobs["merge-release"]);
    // The tag run names the same commit and is newer once tag-release.sh has run.
    // Watching it instead would skip the run whose success says a tag was cut.
    expect(merged).toContain("--event push");
    expect(merged).toContain("gh run watch");
    expect(merged).toContain("gh release view");
  });

  test("the merge carries SELF_DEPLOY_TOKEN, because a GITHUB_TOKEN merge starts no push", () => {
    for (const name of ["merge-release", "merge-self-deploy"]) {
      const variables = env(jobs[name]);
      expect(variables.MERGE_TOKEN, `${name} merges as the PAT`).toBe("${{ secrets.SELF_DEPLOY_TOKEN }}");
      expect(variables.GH_TOKEN, `${name} reads as the workflow token`).toBe("${{ github.token }}");
      expect(script(jobs[name]), `${name} overrides the token for the merge only`).toContain(
        'GH_TOKEN="$MERGE_TOKEN" gh pr merge',
      );
    }
  });
});
