import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FAKE_GH_IMPL } from "./testing/fake-gh-env.ts";
import { LLM_CONTEXT_TAG } from "../../adapters/github/tags.ts";
import { parseGithubOutput, removeTemp, runWithFakeGh, scriptPath } from "./testing/harness.ts";
import { countPriorRetries, findExistingCiRun, pickDispatchedRun } from "./validate_pull_request.ts";

type Run = Parameters<typeof pickDispatchedRun>[0][number];
type CiRun = Parameters<typeof findExistingCiRun>[0][number];

function run(overrides: Partial<Run> = {}): Run {
  return {
    id: 1,
    status: "completed",
    conclusion: "success",
    head_sha: "abc123",
    created_at: "2026-08-15T10:00:00Z",
    event: "workflow_dispatch",
    ...overrides,
  };
}

function ciRun(overrides: Partial<CiRun> = {}): CiRun {
  return {
    ...run(),
    path: ".github/workflows/atomaton-check.yml",
    ...overrides,
  };
}

// `gh workflow run` returns nothing identifying the run it started, so it has to
// be recognised afterwards. Everything here is about not adopting the wrong one.
describe("pickDispatchedRun", () => {
  test("finds the run dispatched for this commit", () => {
    const picked = pickDispatchedRun([run({ id: 7 })], "abc123", "2026-08-15T09:59:00Z");
    expect(picked?.id).toBe(7);
  });

  // The case that makes matching on SHA rather than branch worth it: a human
  // pushing to the same branch while an agent works produces a different commit,
  // and its run must not be read as this validation's result.
  test("ignores a run for a different commit on the same branch", () => {
    const picked = pickDispatchedRun([run({ head_sha: "def456" })], "abc123", "2026-08-15T09:59:00Z");
    expect(picked).toBeUndefined();
  });

  test("ignores runs that predate the dispatch", () => {
    const earlier = run({ created_at: "2026-08-15T09:00:00Z" });
    expect(pickDispatchedRun([earlier], "abc123", "2026-08-15T09:59:00Z")).toBeUndefined();
  });

  // A `pull_request` run sits on the same commit, held at `action_required`.
  // Adopting it would read the hold as this validation's verdict.
  test("ignores runs from other events", () => {
    const held = run({ event: "pull_request", status: "completed", conclusion: "action_required" });
    expect(pickDispatchedRun([held], "abc123", "2026-08-15T09:59:00Z")).toBeUndefined();
  });

  test("takes the newest when a commit was validated more than once", () => {
    const runs = [
      run({ id: 1, created_at: "2026-08-15T10:00:00Z" }),
      run({ id: 2, created_at: "2026-08-15T10:05:00Z" }),
    ];
    expect(pickDispatchedRun(runs, "abc123", "2026-08-15T09:59:00Z")?.id).toBe(2);
  });

  test("reports a run that is still going rather than hiding it", () => {
    const picked = pickDispatchedRun([run({ status: "in_progress", conclusion: null })], "abc123", "2026-08-15T09:59:00Z");
    expect(picked?.status).toBe("in_progress");
    expect(picked?.conclusion).toBeNull();
  });
});

/**
 * CI is dispatched more than once for the same commit -- `create_pr`,
 * `commit_and_push`, and a person's `/agent` comment each start a validation -- and
 * each used to run CI again from scratch. The commit has not changed between them,
 * so the verdict cannot have, and the second and third runs bought nothing but
 * runner time. This is the reader that lets a validation reuse what is already there.
 */
describe("findExistingCiRun", () => {
  const ci = "atomaton-check.yml";

  test("finds a completed run for this commit and workflow", () => {
    const found = findExistingCiRun([ciRun({ id: 9 })], ci, "abc123");
    expect(found?.id).toBe(9);
    expect(found?.conclusion).toBe("success");
  });

  // The whole point: a run that already exists is reused rather than duplicated.
  test("finds a run that is still going, so it can be waited for", () => {
    const found = findExistingCiRun([ciRun({ status: "in_progress", conclusion: null })], ci, "abc123");
    expect(found?.status).toBe("in_progress");
  });

  // A different commit is a different verdict, and reusing it would report the
  // previous head's result as this one's.
  test("ignores a run for a different commit", () => {
    expect(findExistingCiRun([ciRun({ head_sha: "def456" })], ci, "abc123")).toBeUndefined();
  });

  // A repository with its own CI names it in `checks.your_workflow`; a run of the
  // shipped workflow is not that project's verdict.
  test("ignores a run of a different workflow", () => {
    const other = ciRun({ path: ".github/workflows/other.yml" });
    expect(findExistingCiRun([other], ci, "abc123")).toBeUndefined();
  });

  // A `pull_request` run sits on the same commit held at `action_required` -- GitHub
  // holds a workflow a bot's pull request triggered. Adopting it would read the hold
  // as a verdict.
  test("ignores a held pull_request run on the same commit", () => {
    const held = ciRun({ event: "pull_request", conclusion: "action_required" });
    expect(findExistingCiRun([held], ci, "abc123")).toBeUndefined();
  });

  test("takes the newest when the commit has several runs", () => {
    const runs = [
      ciRun({ id: 1, created_at: "2026-08-15T10:00:00Z" }),
      ciRun({ id: 2, created_at: "2026-08-15T10:05:00Z" }),
    ];
    expect(findExistingCiRun(runs, ci, "abc123")?.id).toBe(2);
  });
});

/**
 * The retry count, as the real script reads it with a fake `gh` answering. The count
 * is the retry bound, and the notice the guard posts preserving a removed comment is
 * on the same page as this script's own markers: its text is VERBATIM, so a `ci-retry`
 * marker inside the quoted text would be counted as a retry this script never made --
 * firing the limit early, on a turn the notice's own line says will not be acted on.
 */
const VALIDATE_SRC = join(import.meta.dir, "validate_pull_request.ts");

function retries(bodies: string[]): number {
  const script = `
    const { countPriorRetries } = await import(${JSON.stringify(VALIDATE_SRC)});
    process.stdout.write(String(countPriorRetries("o/r", "7")));
  `;
  const proc = Bun.spawnSync({
    cmd: [process.execPath, "-e", script],
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      ATOMATON_FAKE_GH: FAKE_GH_IMPL,
      FAKE_GH_RESPONSES: JSON.stringify([
        // The shared `listComments` returns whole comment objects, so the fixture is
        // the API's shape and the bodies sit inside it.
        { match: ["repos/o/r/issues/7/comments"], stdout: JSON.stringify(bodies.map((body, i) => ({ id: i + 1, body }))) },
      ]),
      // Nothing here may reach the real CLI; see `fake-gh-env.ts`.
      GH_TOKEN: "fake-gh-must-be-used",
      GITHUB_TOKEN: "fake-gh-must-be-used",
    },
  });
  const out = proc.stdout.toString();
  if (proc.exitCode !== 0) throw new Error(`child failed: ${proc.stderr.toString() || out}`);
  return Number(out.trim());
}

/**
 * The same run with the comment read failing, reporting the child's exit code and
 * stderr instead of a count.
 */
function failingRetries(): { code: number; stderr: string } {
  const script = `
    const { countPriorRetries } = await import(${JSON.stringify(VALIDATE_SRC)});
    process.stdout.write(String(countPriorRetries("o/r", "7")));
  `;
  const proc = Bun.spawnSync({
    cmd: [process.execPath, "-e", script],
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      ATOMATON_FAKE_GH: FAKE_GH_IMPL,
      // A 404 is an answer, not a blip: `ghRead` does not retry it, so this fails at once.
      FAKE_GH_RESPONSES: JSON.stringify([
        { match: ["repos/o/r/issues/7/comments"], code: 1, stdout: "gh: Not Found (HTTP 404)" },
      ]),
      // Nothing here may reach the real CLI; see `fake-gh-env.ts`.
      GH_TOKEN: "fake-gh-must-be-used",
      GITHUB_TOKEN: "fake-gh-must-be-used",
    },
  });
  return { code: proc.exitCode ?? 0, stderr: proc.stderr.toString() };
}

describe("countPriorRetries", () => {
  /**
   * The count is the retry BOUND, so a read that failed must not answer a number: 0
   * means "this pull request has not been sent back yet", which lets the engineer/CI
   * loop run past its limit at one model run per turn. The function used to
   * `catch { return 0; }` exactly here, while the comment above it said why not.
   */
  test("a failed read is not zero retries", () => {
    const { code, stderr } = failingRetries();
    expect(code, "a count it could not determine must stop the script, not become 0").not.toBe(0);
    expect(stderr).toContain("could not read comments on #7");
  });

  test("counts this script's own markers", () => {
    expect(retries(["<!-- atomaton:ci-retry=1 -->\nCI failed.", "<!-- atomaton:ci-retry=2 -->\nCI failed."])).toBe(2);
  });

  // The quoted text is verbatim: if it quoted a CI failure comment, it carries the
  // `ci-retry` marker that comment carried. Counting it would fire the retry limit
  // early.
  test("the notice quoting a removed comment is not a retry", () => {
    const notice = [
      "<!-- atomaton:llm-context=exclude -->",
      "<!-- atomaton:quotes=5 -->",
      "@octocat Your comment was removed because the ball is with an agent on this issue/PR.",
      "<details><summary>Your comment, as you wrote it</summary>",
      "",
      "```",
      "<!-- atomaton:ci-retry=1 -->",
      "CI failed.",
      "```",
      "",
      "</details>",
    ].join("\n");
    expect(retries([notice])).toBe(0);
    expect(retries([notice, "<!-- atomaton:ci-retry=2 -->\nCI failed."])).toBe(1);
  });
});

/**
 * The "CI is running" comment, as the whole script posts it with a fake `gh`
 * answering.
 *
 * Neither half of the behaviour is reachable from the pure functions: the reuse
 * decision and the post live in `runCiAndWait`'s poll loop, so these run the script
 * the way the validate workflow does. `--timeout-seconds 1` bounds the wait -- the
 * poll interval is 10s, so one loop iteration is one test's worth, and the timeout
 * path reports "no conclusion" rather than hanging.
 *
 * The runs-list answer is read more than once -- the reuse check, then a poll -- and
 * `attempt` is what makes those different answers: first read, then poll. It is
 * counted per rule in the fake, so the fixtures here are per-test and exact.
 */
describe("notifyCiWaiting, through the whole script", () => {
  const RUN_ID = 4242;
  const HEAD = "abc123def4567890abcdef1234567890abcdef12";

  /** One run as the Actions API lists it. */
  function ciActionRun(status: string, conclusion: string | null): Record<string, unknown> {
    return {
      id: RUN_ID,
      status,
      conclusion,
      head_sha: HEAD,
      path: ".github/workflows/ci.yml",
      // Far past any test's clock: `pickDispatchedRun` filters `created_at >= since`,
      // and `since` is the script's own start time.
      created_at: "2099-01-01T00:00:00Z",
      event: "workflow_dispatch",
    };
  }

  interface Validation {
    status: number | null;
    /** Every comment posted, as the `--body` each `gh issue comment` carried. */
    comments: string[];
    out: Record<string, string>;
  }

  /**
   * Run the whole script once.
   *
   * `existingRun` is what the reuse check (the first runs-list read) sees: a run to
   * reuse or wait for, or nothing when CI must be dispatched. The second read (the
   * first poll) always sees the run still going, and the third completed -- never
   * reached here, because the 1s timeout ends the wait after one poll.
   */
  function runValidation(existingRun: Record<string, unknown> | undefined, askedByPerson: boolean): Validation {
    const runsRule = { match: ["actions/runs?event=workflow_dispatch"] };
    const runs = (list: Record<string, unknown>[]) => JSON.stringify({ total_count: list.length, workflow_runs: list });
    const rules = [
      // First-match-wins in the fake, so the more specific rules come first: the
      // comments URL contains `issues/7` as a substring, and the runs URL contains
      // both `workflow` and `run`.
      { ...runsRule, stdout: runs(existingRun ? [existingRun] : []), attempt: 1 },
      { ...runsRule, stdout: runs([ciActionRun("in_progress", null)]), attempt: 2 },
      { ...runsRule, stdout: runs([ciActionRun("completed", "success")]), attempt: 3 },
      { match: ["repos/o/r/issues/7/comments"], stdout: "[]" },
      { match: ["repos/o/r/issues/7"], stdout: "just a body" },
      // Two projections of one pull request, so two rules: the commit and base branch
      // this validation works against, and the body the origin agent is read out of.
      {
        match: ["pr", "view", "7", "headRefOid"],
        stdout: JSON.stringify({ headRefOid: HEAD, baseRefName: "main" }),
      },
      { match: ["pr", "view", "7", "body"], stdout: JSON.stringify({ body: "" }) },
      { match: ["repos/o/r/rules/branches/main"], stdout: "[]" },
      { match: ["repos/o/r/commits/"], stdout: "2099-01-01T00:00:00Z" },
      // The dispatch itself. `--ref` is what keeps this rule off the runs-list call,
      // whose URL carries `workflow_dispatch` -- the words the obvious
      // `["workflow", "run"]` rule would also match.
      { match: ["--ref", "ci.yml"], stdout: "" },
    ];
    const dir = mkdtempSync(join(tmpdir(), "atomaton-validate-"));
    try {
      const report = join(dir, "deliverable-report");
      writeFileSync(report, "");
      const defDir = join(dir, "agent-definitions");
      mkdirSync(defDir);
      const outputFile = join(dir, "out");
      writeFileSync(outputFile, "");
      const result = runWithFakeGh(
        scriptPath("validate_pull_request.ts"),
        [
          "--repo", "o/r",
          "--number", "7",
          "--branch", "atomaton/issue-7",
          "--workflow", "ci.yml",
          "--def-dir", defDir,
          "--deliverable-report", report,
          "--asked-by-person", askedByPerson ? "true" : "false",
          "--timeout-seconds", "1",
        ],
        { rules, env: { GITHUB_OUTPUT: outputFile } },
      );
      if (result.status !== 0) throw new Error(`script failed: ${result.stderr}`);
      const comments = result.ghCalls
        .filter((call) => call[0] === "issue" && call[1] === "comment")
        .map((call) => call[call.indexOf("--body") + 1] ?? "");
      return { status: result.status, comments, out: parseGithubOutput(readFileSync(outputFile, "utf8")) };
    } finally {
      removeTemp(dir);
    }
  }

  const waiting = (bodies: string[]): string | undefined =>
    bodies.find((body) => body.includes("CI is running on this pull request"));

  // The whole point of moving the comment off the workflow side: the most common
  // case for a person's `/agent` on a pull request was a CI run that had already
  // finished, and the old comment promised a wait that did not exist. A reused run
  // says nothing -- the person's command is the record, and the verdict is seconds
  // old.
  test("a reused run posts nothing", () => {
    const v = runValidation(ciActionRun("completed", "success"), true);
    expect(v.comments).toEqual([]);
    expect(v.out.conclusion).toBe("success");
  });

  // Each of the three slow tests below waits out one 10s poll interval inside the
  // script -- the sleep is hardcoded, so the bound here is 3x it plus startup.
  const WAIT = 30_000;

  test("a run dispatched by this validation is announced, with its run URL", () => {
    const v = runValidation(undefined, true);
    const notice = waiting(v.comments);
    expect(notice, "the waiting comment is posted").toBeDefined();
    expect(notice).toContain(LLM_CONTEXT_TAG.write("exclude"));
    expect(notice).toContain(`https://github.com/o/r/actions/runs/${RUN_ID}`);
    expect(notice).toContain("Its result decides who works next");
    // The sentence is the fact, not a promise: what the result dispatches is
    // decided by the result.
    expect(notice).not.toContain("reviewer");
    expect(notice).not.toContain("engineer");
  }, WAIT);

  test("a run already going for this commit is announced, with its run URL", () => {
    const v = runValidation(ciActionRun("in_progress", null), true);
    const notice = waiting(v.comments);
    expect(notice, "the waiting comment is posted").toBeDefined();
    expect(notice).toContain(`https://github.com/o/r/actions/runs/${RUN_ID}`);
  }, WAIT);

  // An agent's push starts the same validation and must not get the comment: the
  // tool that started the validation already told the agent, and a comment per push
  // would be noise on the thread the agent is working in.
  test("the same run asked for by an agent posts no waiting comment", () => {
    const v = runValidation(undefined, false);
    expect(waiting(v.comments)).toBeUndefined();
    // What is suppressed is the waiting comment only -- the no-conclusion verdict
    // still reports.
    expect(v.comments.length).toBe(1);
    expect(v.comments[0]).toContain("CI never reported a conclusion");
  }, WAIT);
});
