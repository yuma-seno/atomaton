/**
 * new-release-notice.test.ts — the workflow that says a newer release exists
 * stays the one thing it was built to be: a notice.
 *
 * ## Why this is pinned
 *
 * It is a generated workflow that runs unattended, on a cron, in every adopter's
 * repository, and it writes to their issue tracker. Three things about it are one
 * edit away from being lost and none of them fail loudly:
 *
 * - **the permission set.** Broadening it costs nothing visible. `contents: read` +
 *   `issues: write` is also the whole argument for shipping this half of the
 *   upgrade problem before the sync half, so losing it silently withdraws the
 *   reason.
 * - **no dispatch, no checkout of anything else.** The notice is a read of two
 *   release tags and one issue write. Anything that starts a run, writes a
 *   workflow or opens a pull request from here is the capability this was designed
 *   NOT to need.
 * - **the schedule, and its absence in the other direction.** A cron is easy to
 *   delete while tidying and impossible to notice afterwards: the workflow stays
 *   green and simply never runs.
 *
 * `notify_new_release.test.ts` beside the script holds the behaviour; this holds
 * the wiring, which the script cannot see.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { UPSTREAM_REPOSITORY } from "../../src/entrypoints/machinery/notify_new_release.ts";

type Step = { name?: string; uses?: string; run?: string; env?: Record<string, string>; with?: Record<string, string> };
type Document = {
  on?: { schedule?: { cron?: string }[]; workflow_dispatch?: unknown; [trigger: string]: unknown };
  permissions?: Record<string, string>;
  jobs?: Record<string, { "timeout-minutes"?: number; steps?: Step[] }>;
};

const WORKFLOW = "dist/.github/workflows/atomaton-new-release.yml";
const document = Bun.YAML.parse(readFileSync(WORKFLOW, "utf8")) as Document;
const jobs = Object.entries(document.jobs ?? {});

/** Every step of every job. */
const steps = jobs.flatMap(([, job]) => job.steps ?? []);

describe("the new-release notice", () => {
  test("it runs on a schedule, and a person can press it", () => {
    // Both halves: a cron is what reaches a repository nobody is looking at, and
    // the dispatch is what lets somebody who IS looking ask now.
    expect(document.on?.schedule?.[0]?.cron, "without a cron this never fires on its own").toBeTruthy();
    expect(document.on).toHaveProperty("workflow_dispatch");
  });

  /**
   * Nothing else triggers it. An `issues` or `push` trigger here would re-post the
   * notice on every comment and every merge -- and in an adopted repository that is
   * every event its own agents generate.
   */
  test("nothing else triggers it", () => {
    expect(Object.keys(document.on ?? {}).sort()).toEqual(["schedule", "workflow_dispatch"]);
  });

  /**
   * The permission set, exactly. Read on releases and write on issues is the whole
   * of what the notice needs, and it is what makes this shippable without asking an
   * adopter for a secret.
   */
  test("it holds `contents: read` and `issues: write` and nothing else", () => {
    expect(document.permissions).toEqual({ contents: "read", issues: "write" });
  });

  test("one job, bounded", () => {
    expect(jobs).toHaveLength(1);
    for (const [name, job] of jobs) {
      expect(job["timeout-minutes"], `${name} is bounded only by GitHub's default`).toBeGreaterThan(0);
    }
  });

  /**
   * It reads the adopted tree's own checkout and nothing else, and it writes no
   * workflow: `.github/workflows/**` is refused to `GITHUB_TOKEN` on identity, so a
   * step here that tried would fail in the adopter's repository rather than in
   * this one.
   */
  test("it writes nothing but an issue", () => {
    const writes = steps
      .map((step) => step.run ?? "")
      .flatMap((body) => [...body.matchAll(/bun run "[^"]*\/([a-z_]+\.ts)"/g)].map((m) => m[1] ?? ""));
    expect(writes, "the step that writes the notice").toContain("notify_new_release.ts");
    expect(writes, "one script, so the whole behaviour is in one place").toEqual(["notify_new_release.ts"]);
  });

  /**
   * The step's own bash does nothing else either. A `gh pr create` or a
   * `gh workflow run` beside the notice would be the automatic-update capability
   * this workflow was deliberately not given.
   */
  test("its shell opens no pull request and starts no run", () => {
    const bodies = steps.map((step) => step.run ?? "").join("\n");
    expect(bodies).not.toMatch(/gh\s+pr\s+create/);
    expect(bodies).not.toMatch(/gh\s+workflow\s+run/);
  });

  /** The repository travels as an env value, so the one source of it is the context. */
  test("the repository it writes to comes from the workflow context", () => {
    const step = steps.find((candidate) => (candidate.run ?? "").includes("notify_new_release.ts"));
    expect(step).toBeDefined();
    expect(step?.env?.GH_TOKEN, "the notice needs a token with `issues: write`").toBe("${{ github.token }}");
    expect(step?.env?.REPO).toBe("${{ github.repository }}");
    expect(step?.run).toContain('--repo "${REPO}"');
  });

  /**
   * And no secret. A `secrets.` anywhere in this file would mean an adopter has to
   * configure something before they are told there is an upgrade -- which is the
   * ordering this whole half exists to avoid.
   */
  test("no secret is named anywhere in it", () => {
    const text = readFileSync(WORKFLOW, "utf8");
    expect(text).not.toContain("${{ secrets.");
  });

  /** The upstream it compares against, so the workflow and the script cannot disagree. */
  test("it compares against the template, through the one module that names it", () => {
    expect(UPSTREAM_REPOSITORY).toBe("yuma-seno/atomaton");
  });
});
