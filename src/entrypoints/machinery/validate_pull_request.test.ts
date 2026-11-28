import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { FAKE_GH_IMPL } from "./testing/fake-gh-env.ts";
import { LLM_CONTEXT_TAG } from "../../adapters/github/tags.ts";
import { parseGithubOutput, removeTemp, runWithFakeGh, scriptPath, type FakeGhRule } from "./testing/harness.ts";
import { findExistingCiRun, pickDispatchedRun } from "./validate_pull_request.ts";

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
 *
 * Its candidate list spans two events, and #471 is why. A person's `/reviewer` on a
 * pull request whose own `pull_request` run had already gone green dispatched a
 * second run for the same commit and posted "CI is running" under a page of green
 * checks. The green was there; this reader was looking at one event only.
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

  // #471: a person's `/reviewer` arrived on a pull request whose own `pull_request`
  // run was already green. Only `workflow_dispatch` runs were candidates, so that
  // green was invisible, CI was dispatched a second time, and the thread said "CI is
  // running" under a page of green checks.
  test("reuses a green pull_request run for this commit", () => {
    const green = ciRun({ id: 4, event: "pull_request", status: "completed", conclusion: "success" });
    expect(findExistingCiRun([green], ci, "abc123")?.conclusion).toBe("success");
  });

  // A red pull_request run is a verdict too, and reusing it is what keeps a second
  // run from re-running the same failure.
  test("reuses a failed pull_request run for this commit", () => {
    const red = ciRun({ id: 5, event: "pull_request", status: "completed", conclusion: "failure" });
    expect(findExistingCiRun([red], ci, "abc123")?.conclusion).toBe("failure");
  });

  // A cancelled run was superseded, not judged, so it is no verdict. It must not be
  // waited for either: it is already completed, so there is nothing left to wait on.
  test("ignores a cancelled run", () => {
    const cancelled = ciRun({ event: "pull_request", status: "completed", conclusion: "cancelled" });
    expect(findExistingCiRun([cancelled], ci, "abc123")).toBeUndefined();
  });

  // A `pull_request` run in flight is not waited for. The held one never counts down,
  // so waiting on it would burn the whole timeout and report no conclusion where a
  // dispatch would have answered in minutes.
  test("does not wait for a pull_request run in flight", () => {
    const running = ciRun({ event: "pull_request", status: "in_progress", conclusion: null });
    expect(findExistingCiRun([running], ci, "abc123")).toBeUndefined();
  });

  // A concluded run answers the question whether or not something else is still
  // going: waiting for a second run of the same workflow on the same commit learns
  // nothing.
  test("prefers a concluded run to one still going, whichever is newer", () => {
    const runs = [
      ciRun({ id: 1, event: "pull_request", status: "completed", conclusion: "success", created_at: "2026-08-15T09:00:00Z" }),
      ciRun({ id: 2, status: "in_progress", conclusion: null, created_at: "2026-08-15T10:00:00Z" }),
    ];
    expect(findExistingCiRun(runs, ci, "abc123")?.id).toBe(1);
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
  function ciActionRun(status: string, conclusion: string | null, event = "workflow_dispatch"): Record<string, unknown> {
    return {
      id: RUN_ID,
      status,
      conclusion,
      head_sha: HEAD,
      path: ".github/workflows/ci.yml",
      // Far past any test's clock: `pickDispatchedRun` filters `created_at >= since`,
      // and `since` is the script's own start time.
      created_at: "2099-01-01T00:00:00Z",
      event,
    };
  }

  interface Validation {
    status: number | null;
    /** Every comment posted, as the `--body` each `gh issue comment` carried. */
    comments: string[];
    /** Every argv `gh` was invoked with, so a missing dispatch is assertable. */
    ghCalls: string[][];
    /** The script's own log, where its warnings and error annotations land. */
    stderr: string;
    out: Record<string, string>;
  }

  /**
   * Run the whole script once.
   *
   * `existingRun` is what the reuse check (the first runs-list read) sees: a run to
   * reuse or wait for, or nothing when CI must be dispatched. The second read (the
   * first poll) always sees the run still going, and the third completed -- never
   * reached here, because the 1s timeout ends the wait after one poll.
   *
   * `thread` is what the comments read answers, and defaults to an empty thread:
   * hold `free`, no reviewer named. The hold gate's other arms are reached by
   * passing a thread with the tags that produce them.
   */
  function runValidation(
    existingRun: Record<string, unknown> | undefined,
    askedByPerson: boolean,
    thread: unknown[] = [],
    agents: string[] = [],
    extraRules: FakeGhRule[] = [],
    headTreeFiles: Record<string, string> = {},
  ): Validation {
    const runsRule = { match: ["actions/runs?head_sha="] };
    const runs = (list: Record<string, unknown>[]) => JSON.stringify({ total_count: list.length, workflow_runs: list });
    const rules = [
      // A test's own answers come first: first-match-wins, so an override of one of the
      // fixtures below has to be in front of it.
      ...extraRules,
      // First-match-wins in the fake, so the more specific rules come first: the
      // comments URL contains `issues/7` as a substring, and the runs URL contains
      // both `workflow` and `run`.
      { ...runsRule, stdout: runs(existingRun ? [existingRun] : []), attempt: 1 },
      { ...runsRule, stdout: runs([ciActionRun("in_progress", null)]), attempt: 2 },
      { ...runsRule, stdout: runs([ciActionRun("completed", "success")]), attempt: 3 },
      { match: ["repos/o/r/issues/7/comments"], stdout: JSON.stringify(thread) },
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
      // whose URL carries `head_sha` -- the words the obvious `["workflow", "run"]`
      // rule would also match.
      { match: ["--ref", "ci.yml"], stdout: "" },
    ];
    const dir = mkdtempSync(join(tmpdir(), "atomaton-validate-"));
    try {
      const report = join(dir, "deliverable-report");
      writeFileSync(report, "");
      const defDir = join(dir, "agent-definitions");
      mkdirSync(defDir);
      // A `/<agent>` line is only a request when a definition exists for it, so a
      // test that expects a dispatch has to give the name one.
      for (const agent of agents) writeFileSync(join(defDir, `${agent}.md`), "");
      // The pull request's own tree, as the workflow checks it out. Empty unless a
      // test is about what a tree carrying conflict markers does.
      const headTreeDir = join(dir, "pr-head");
      mkdirSync(headTreeDir);
      for (const [path, content] of Object.entries(headTreeFiles)) {
        mkdirSync(dirname(join(headTreeDir, path)), { recursive: true });
        writeFileSync(join(headTreeDir, path), content);
      }
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
          "--head-tree", headTreeDir,
          "--asked-by-person", askedByPerson ? "true" : "false",
          "--timeout-seconds", "1",
        ],
        { rules, env: { GITHUB_OUTPUT: outputFile } },
      );
      if (result.status !== 0) throw new Error(`script failed: ${result.stderr}`);
      const comments = result.ghCalls
        .filter((call) => call[0] === "issue" && call[1] === "comment")
        .map((call) => call[call.indexOf("--body") + 1] ?? "");
      return {
        status: result.status,
        comments,
        ghCalls: result.ghCalls,
        stderr: result.stderr,
        out: parseGithubOutput(readFileSync(outputFile, "utf8")),
      };
    } finally {
      removeTemp(dir);
    }
  }

  const waiting = (bodies: string[]): string | undefined =>
    bodies.find((body) => body.includes("CI is running on this pull request"));

  const dispatchedCi = (calls: string[][]): boolean =>
    calls.some((call) => call[0] === "workflow" && call[1] === "run" && call.includes("--ref"));

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

  // Each test below that reaches the poll loop waits out one 10s interval inside the
  // script -- the sleep is hardcoded, so the bound here is 3x it plus startup.
  const WAIT = 30_000;

  // #471, as the whole script meets it: a person's `/reviewer` on a pull request
  // whose own `pull_request` run was already green. Nothing is dispatched, nothing is
  // announced, and the green decides the verdict -- where before, that run was not a
  // candidate, CI was started a second time, and "CI is running" appeared under a page
  // of green checks.
  test("a green pull_request run on the head is reused instead of dispatched again", () => {
    const v = runValidation(ciActionRun("completed", "success", "pull_request"), true);
    expect(waiting(v.comments), "no wait is left to describe").toBeUndefined();
    expect(v.comments).toEqual([]);
    expect(dispatchedCi(v.ghCalls), "the same head is not run twice").toBe(false);
    expect(v.out.conclusion).toBe("success");
  });

  // The held run is the one shape that must not be mistaken for a verdict: it never
  // executed, so whatever its conclusion says, CI has not judged this commit. It must
  // also not be waited on -- it never counts down -- so this dispatches and waits for
  // its own run.
  test("a held pull_request run is not a verdict and does not block a dispatch", () => {
    const v = runValidation(ciActionRun("completed", "action_required", "pull_request"), true);
    expect(dispatchedCi(v.ghCalls), "the hold is not a verdict, so CI is dispatched").toBe(true);
  }, WAIT);

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

  /**
   * A green verdict on a thread a run already holds starts nothing. The thread's
   * next word is that run's own report, and this workflow posts nothing on the
   * verdict -- no dispatch, and no notice either.
   *
   * The in-flight thread is the #546 shape: a chain dispatch the run claimed and
   * has not reported on.
   */
  test("a run already holding the thread dispatches nobody and posts nothing", () => {
    const v = runValidation(ciActionRun("completed", "success"), true, [
      { id: 1, body: "<!-- atomaton:dispatch=engineer -->\nAtomaton: `engineer` starting.", user: { type: "Bot" } },
      { id: 2, body: "<!-- atomaton:took=1 run=4 -->", user: { type: "Bot" } },
    ]);
    expect(v.out.conclusion).toBe("success");
    expect(v.out.next_agent).toBe("");
    expect(v.comments).toEqual([]);
  }, WAIT);

  /**
   * A red verdict posts its brief -- what CI concluded, and the failing run's URL --
   * and nothing else. It used to be followed by a second comment telling a person
   * that no agent had been dispatched; that comment is gone, and the brief is the
   * one thing left on the pull request.
   */
  test("a red verdict posts its brief and nothing else", () => {
    const v = runValidation(ciActionRun("completed", "failure"), true);
    expect(v.out.next_agent).toBe("");
    expect(v.comments.length).toBe(1);
    expect(v.comments[0]).toContain("CI concluded failure");
  }, WAIT);

  /**
   * Red meets the same gate as green, through the whole script (#616).
   *
   * A call waiting on the pull request is what a red verdict dispatches, and the
   * name is the thread's -- here a person's `/engineer` comment -- not the opener's.
   * The brief is still posted, once: the run that starts reads what failed from it,
   * and its summary carries no line addressed to a person, because that summary is
   * the context a run starts with.
   */
  test("a red verdict dispatches the call the thread is waiting with", () => {
    const v = runValidation(
      ciActionRun("completed", "failure"),
      true,
      [{ id: 1, body: "/engineer", user: { type: "User" } }],
      ["engineer"],
    );
    expect(v.out.next_agent).toBe("engineer");
    expect(v.out.summary).not.toContain("Comment /");
    expect(v.comments.length).toBe(1);
    expect(v.comments[0]).toContain("CI concluded failure");
  }, WAIT);

  /**
   * A tree carrying conflict markers is waiting, not failing (#674).
   *
   * The update machinery leaves markers where a release and this tree both changed a
   * file, and the checks then report on a half-merged tree -- which reads on the pull
   * request as an unexplained red. The comment says which of the two it is, names the
   * files, and leaves the verdict alone: the check stays red, because a tree with
   * markers must not be mergeable.
   */
  describe("a tree carrying conflict markers", () => {
    /** What `git merge-file` writes, which is what the update machinery commits. */
    const MARKED = "<<<<<<< ours\nbase_branch: main\n=======\nbase_branch: trunk\n>>>>>>> theirs\n";
    const required = {
      match: ["repos/o/r/rules/branches/main"],
      stdout: JSON.stringify([
        { type: "required_status_checks", parameters: { required_status_checks: [{ context: "atomaton-check" }] } },
      ]),
    };
    const markerComment = (bodies: string[]): string | undefined =>
      bodies.find((body) => body.includes("waiting for its conflict markers"));

    test("says it is waiting and names the files, instead of reporting a failure", () => {
      const v = runValidation(ciActionRun("completed", "failure"), true, [], [], [], {
        "src/marked.ts": `const a = 1;\n${MARKED}`,
      });
      const notice = markerComment(v.comments);
      expect(notice, "the waiting comment is posted").toBeDefined();
      expect(notice).toContain("`src/marked.ts`");
      expect(notice).toContain("the checks run their real judgement on the resolved tree");
      // One comment, and it is not the failure brief: what broke and which agent to ask
      // for a fix are not the next things here.
      expect(v.comments.length).toBe(1);
      expect(v.comments[0]).not.toContain("CI concluded failure");
      // The verdict is untouched: the checks still say the tree failed.
      expect(v.out.conclusion).toBe("failure");
      expect(v.out.verdict_passed).toBe("false");
    }, WAIT);

    // The scan changes what is said, not what runs: a marker tree still gets a real
    // check, so it is red rather than merely unjudged.
    test("CI is still dispatched for a marker tree", () => {
      const v = runValidation(undefined, true, [], [], [], { "src/marked.ts": MARKED });
      expect(dispatchedCi(v.ghCalls), "the check still runs").toBe(true);
      expect(markerComment(v.comments), "the waiting comment is posted").toBeDefined();
      // The brief for a run that never reported is replaced, not joined.
      expect(v.comments.some((body) => body.includes("CI never reported a conclusion"))).toBe(false);
    }, WAIT);

    test("the mirrored check is still written as failing", () => {
      const v = runValidation(
        ciActionRun("completed", "failure"),
        true,
        [],
        [],
        [required, { match: ["POST", "check-runs"], stdout: "{}" }],
        { "src/marked.ts": MARKED },
      );
      const written = v.ghCalls.filter((call) => call.includes("POST") && call.join(" ").includes("check-runs"));
      expect(written.length).toBe(1);
      expect(written[0]?.join(" ")).toContain("conclusion=failure");
      expect(markerComment(v.comments)).toBeDefined();
    }, WAIT);

    // Green is not a reason to stay quiet: a tree that can merge with markers in it is
    // worse than a red one, and the person reading the pull request needs to know the
    // check they are looking at did not judge the work.
    test("says it is waiting even when the check passed", () => {
      const v = runValidation(ciActionRun("completed", "success"), true, [], [], [], {
        "docs/guide.md": MARKED,
      });
      const notice = markerComment(v.comments);
      expect(notice).toBeDefined();
      expect(notice).toContain("`docs/guide.md`");
      expect(notice).not.toContain("Failing run:");
    }, WAIT);

    // A file that only quotes a marker line is prose about conflicts, not a conflict.
    test("a tree with no markers gets the failure brief as before", () => {
      const v = runValidation(ciActionRun("completed", "failure"), true, [], [], [], {
        "README.md": "Resolve the `<<<<<<< ours` lines first.\n",
      });
      expect(markerComment(v.comments)).toBeUndefined();
      expect(v.comments.length).toBe(1);
      expect(v.comments[0]).toContain("CI concluded failure");
    }, WAIT);
  });

  /**
   * The mirror is the only check a ruleset accepts (see the script's header), and a
   * write that failed used to be a warning with a green exit: the run looked fine, the
   * head commit carried no required check, and the pull request went to a person who
   * could not merge it (#632). It is retried once now, and a second failure is an error
   * annotation naming the check.
   *
   * The exit code still does not follow the failure. The steps after this one read this
   * script's outputs through `if:`, so a red step would take the verdict with it — and
   * the verdict is written either way.
   */
  describe("the mirrored check", () => {
    /** One required context on the base branch, so the mirror loop writes exactly one. */
    const required = {
      match: ["repos/o/r/rules/branches/main"],
      stdout: JSON.stringify([
        { type: "required_status_checks", parameters: { required_status_checks: [{ context: "atomaton-check" }] } },
      ]),
    };

    const posts = (v: Validation): string[][] =>
      v.ghCalls.filter((call) => call.includes("POST") && call.join(" ").includes("check-runs"));

    test("a write that fails once is retried, and the check is written", () => {
      const v = runValidation(ciActionRun("completed", "success"), false, [], [], [
        required,
        { match: ["POST", "check-runs"], code: 1, stdout: "HTTP 502", attempt: 1 },
        { match: ["POST", "check-runs"], stdout: "{}" },
      ]);
      expect(posts(v).length).toBe(2);
      expect(v.stderr).toContain("retrying once");
      expect(v.stderr).toContain('wrote check "atomaton-check" as success');
    }, WAIT);

    test("a write that keeps failing is an error naming the check, and the run still ends green", () => {
      const v = runValidation(ciActionRun("completed", "success"), false, [], [], [
        required,
        { match: ["POST", "check-runs"], code: 1, stdout: "HTTP 500" },
      ]);
      expect(v.status).toBe(0);
      expect(posts(v).length).toBe(2);
      expect(v.stderr).toContain("::error::");
      expect(v.stderr).toContain('"atomaton-check"');
      // The outputs the steps after this one read are still written.
      expect(v.out.conclusion).toBe("success");
      expect(v.out.verdict_passed).toBe("true");
    }, WAIT);
  });
});
