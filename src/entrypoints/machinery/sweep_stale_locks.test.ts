import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { makeConfigDir, runWithFakeGh, scriptPath } from "./testing/harness.ts";

/**
 * The scheduled sweep, end to end against the fake `gh`.
 *
 * What a sweep is FOR is the state `reconcile_run_ending.ts` cannot reach: a run that took
 * a turn and died, whose completion never fired a `workflow_run` because the machinery
 * dispatched it with `GITHUB_TOKEN`. So the fixtures here are threads, not events — a claim
 * with no ending after it, and whatever `actions/runs/{id}` says about the run the claim
 * names.
 *
 * The assertions are about WRITES. A sweep over a node whose run is still going must make
 * none at all, because running every fifteen minutes means a sweep that writes
 * speculatively writes constantly, on nodes that are fine.
 */

/** A claim on ask 55 by run 7, as the runner posts it at start. */
const CLAIM = "<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:took=55 run=7 -->\nAtomaton: claimed this turn.";

/** A `waiting` ending — the parked turn a run leaves when it starts work under its node. */
const PARKED =
  "<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:ended=waiting answers=55 run=7 -->\n" +
  "Atomaton: parked the turn on the agents working under it.";

/**
 * A comment as the issues API returns it.
 *
 * `user.type: "Bot"` on the machinery's own comments, and it is load-bearing: the shaping
 * drops a HUMAN comment once a claim is open, so a fixture that left the type off would
 * have its park (written after the claim) read as a person's remark and disappear from the
 * walk.
 */
const machinery = (id: number, body: string, minutes = 90) => ({
  id,
  body,
  user: { type: "Bot" },
  created_at: new Date(Date.now() - minutes * 60_000).toISOString(),
});

/** A claim comment, written `minutes` before the sweep runs. */
const claimComment = (body = CLAIM, minutes = 90, id = 101) => machinery(id, body, minutes);

/** The ending a sweep writes, as the thread carries it afterwards. */
const endingFor = (ask: number) =>
  machinery(999, `<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:ended=done answers=${ask} run=4242 -->\nhealed`, 0);

/**
 * The list the sweep enumerates: `api repos/.../issues?state=open&labels=...`, one JSON array
 * per page.
 *
 * The REST issues endpoint rather than `gh issue list --label`, which goes to the search API
 * with `type:issue` and therefore never returns a pull request. The numbers here are whatever
 * GitHub's list holds, and pull requests are in it.
 */
const listed = (numbers: number[]) => ({
  match: ["api", "/issues?state=open", "--paginate"],
  stdout: JSON.stringify(numbers.map((n) => ({ number: n }))),
});

/** One node's thread, as the comments endpoint returns it. */
const threadOf = (number: number, comments: unknown[]) => ({
  match: ["api", `issues/${number}/comments`],
  stdout: JSON.stringify(comments),
});

/**
 * A thread that changes under the sweep, which is what a correct release looks like: the
 * FIRST read is what the sweep judges, and the read it makes after posting the ending is
 * how it proves the release took. A static fixture answers both the same way, so the
 * sweep's own self-check reports a release that did not take — the behaviour the dedicated
 * red-run test pins.
 */
const threadTwice = (number: number, before: unknown[], after: unknown[]) => [
  { match: ["api", `issues/${number}/comments`], stdout: JSON.stringify(before), attempt: 1 },
  { match: ["api", `issues/${number}/comments`], stdout: JSON.stringify(after), attempt: 2 },
];

/** What GitHub says about the run a claim names. */
const runStatus = (id: number, status: string, code = 0) => ({
  match: ["actions/runs", String(id)],
  stdout: status,
  code,
});

/**
 * The links read, which only a park asks for: the sub-issues it started AND the pull
 * requests linked to it.
 *
 * Both, because a park waits on whichever it started — `launch_sub_agent` starts an issue
 * under this node, `create_pr` opens a pull request from it. A leaf issue has no sub-issues
 * at all, so a fixture that only ever set `openChildren` could not have caught a
 * `create_pr` park being released while its pull request was in review.
 */
const linksOf = (number: number, openChildren: number, openPrs = 0) => ({
  match: ["graphql"],
  stdout: JSON.stringify({
    data: {
      repository: {
        issueOrPullRequest: {
          __typename: "Issue",
          subIssues: {
            nodes: Array.from({ length: openChildren }, (_, index) => ({
              number: 900 + index,
              title: "child",
              state: "OPEN",
              stateReason: null,
              labels: { nodes: [] },
            })),
          },
          // `closedByPullRequestsReferences` is where an issue's closing pull requests are
          // read from, and `create_pr` links the PR to its issue.
          closedByPullRequestsReferences: {
            nodes: Array.from({ length: openPrs }, (_, index) => ({
              number: 500 + index,
              title: "the pull request",
              state: "OPEN",
              merged: false,
              body: "",
            })),
          },
          timelineItems: { nodes: [] },
        },
      },
    },
  }),
});

/** Whether the sweep wrote anything at all. */
const wrote = (calls: string[][]): boolean =>
  calls.some((call) => call.includes("comment") || call.includes("edit") || call.includes("DELETE"));

/** The body of the first comment the sweep posted, or "". */
function postedBody(calls: string[][]): string {
  const call = calls.find((c) => c[0] === "issue" && c[1] === "comment");
  if (!call) return "";
  return call[call.indexOf("--body") + 1] ?? "";
}

describe("sweep_stale_locks.ts", () => {
  test("releases a claim whose run has finished, and hands the node to a person", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("sweep_stale_locks.ts"), [], {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_RUN_ID: "4242" },
        rules: [
          listed([9]),
          ...threadTwice(9, [claimComment()], [claimComment(), endingFor(55)]),
          runStatus(7, "completed"),
          // The label write reads the node's state first (#352).
          { match: ["api", "repos/owner/repo/issues/9"], stdout: JSON.stringify({ state: "open", labels: [] }) },
          { match: ["issue", "comment"] },
          { match: ["issue", "edit"] },
          { match: ["label", "create"] },
        ],
      });
      expect(r.stderr).toContain("released a dead claim");

      // The ending: it answers the ask the dead run claimed, and names the SWEEP's run,
      // because the sweep is what wrote it. Nothing else would make the next sweep and the
      // guard read this thread as healed.
      const body = postedBody(r.ghCalls);
      expect(body).toContain("<!-- atomaton:ended=done answers=55 run=4242 -->");
      expect(body).toContain("no answer was posted for it");
      // The two ways forward, named for the agent read off the thread.
      expect(body).toContain("/atomaton");

      // And the labels moved with it — the claim is off and the node reads as the person's,
      // which is what stops every later sweep reading it again.
      const added = r.ghCalls.find((call) => call.includes("--add-label"));
      expect(added?.join(" ")).toContain("atomaton/waiting-for-person");
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("writes nothing at all for a node whose run is still going", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("sweep_stale_locks.ts"), [], {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_RUN_ID: "4242" },
        rules: [listed([9]), threadOf(9, [claimComment("", 1)]), runStatus(7, "in_progress")],
      });
      expect(r.stderr).toContain("held 1");
      // Not one write: this sweep runs every fifteen minutes, and a sweep that comments or
      // relabels a working node writes constantly on nodes that are fine.
      expect(wrote(r.ghCalls)).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("writes nothing for a run whose status could not be read", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("sweep_stale_locks.ts"), [], {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_RUN_ID: "4242" },
        // The one shape that must never resolve to "release": an unreadable run is not a
        // finished one, and releasing here hands a live run's node to a person.
        rules: [listed([9]), threadOf(9, [claimComment()]), runStatus(7, "", 1)],
      });
      expect(r.stderr).toContain("undetermined 1");
      expect(wrote(r.ghCalls)).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("a node whose thread holds no claim is nobody's to release", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("sweep_stale_locks.ts"), [], {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_RUN_ID: "4242" },
        // The label is the run's own cache and it lags: a node can wear `in-progress` with
        // a thread that says the turn came back. The thread decides.
        rules: [listed([9]), threadOf(9, [{ id: 100, body: "just a remark" }])],
      });
      expect(r.stderr).toContain("held 1");
      expect(wrote(r.ghCalls)).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("a node whose thread cannot be read is reported and left alone", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("sweep_stale_locks.ts"), [], {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_RUN_ID: "4242" },
        rules: [listed([9]), { match: ["api", "issues/9/comments"], code: 1 }],
      });
      expect(r.stderr).toContain("could not read #9's thread");
      expect(r.stderr).toContain("undetermined 1");
      expect(wrote(r.ghCalls)).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("releases a park whose collection never came, and says so rather than \"no answer\"", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("sweep_stale_locks.ts"), [], {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_RUN_ID: "4242" },
        rules: [
          listed([9]),
          ...threadTwice(
            9,
            [claimComment(CLAIM, 120), machinery(102, PARKED, 120)],
            [claimComment(CLAIM, 120), machinery(102, PARKED, 120), endingFor(55)],
          ),
          // The run finished — it had to: a park is written when the run ENDS. What is
          // missing is the aggregation's resume, so the children read is what decides, and
          // here nothing is left open under the node.
          runStatus(7, "completed"),
          linksOf(9, 0),
          { match: ["api", "repos/owner/repo/issues/9"], stdout: JSON.stringify({ state: "open", labels: [] }) },
          { match: ["issue", "comment"] },
          { match: ["issue", "edit"] },
          { match: ["label", "create"] },
        ],
      });
      expect(r.stderr).toContain("released a missed park");
      const body = postedBody(r.ghCalls);
      // The park's own wording. "no answer was posted" would be false here: the run
      // answered, and the collection is what went missing.
      expect(body).toContain("the resume that");
      expect(body).not.toContain("no answer was posted");
      expect(body).toContain("<!-- atomaton:ended=done answers=55 run=4242 -->");
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("holds a park while work under it is still open", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("sweep_stale_locks.ts"), [], {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_RUN_ID: "4242" },
        rules: [
          listed([9]),
          threadOf(9, [claimComment(CLAIM, 120), machinery(102, PARKED, 120)]),
          runStatus(7, "completed"),
          // Still working, however long it has been: releasing this would post "nothing
          // was decided" over a subtree that is deciding something.
          linksOf(9, 2),
        ],
      });
      expect(r.stderr).toContain("held 1");
      expect(wrote(r.ghCalls)).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("a second sweep over the healed thread writes nothing", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("sweep_stale_locks.ts"), [], {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_RUN_ID: "4242" },
        // The thread after the first sweep: the claim is answered by the ending it posted,
        // so the shaping opens no claim and there is nothing left to release. A sweep that
        // kept posting would put one notice per quarter hour on the node.
        rules: [listed([9]), threadOf(9, [claimComment(), endingFor(55)])],
      });
      expect(r.stderr).toContain("held 1");
      expect(r.stderr).toContain("released 0");
      expect(wrote(r.ghCalls)).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("reports red when the ending it posted did not clear the claim", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("sweep_stale_locks.ts"), [], {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_RUN_ID: "4242" },
        rules: [
          listed([9]),
          // Every read of the thread says the same thing, including the read AFTER the
          // ending was posted — so the sweep's own self-check is what catches it. That is
          // the one state worth a red run: the node now carries a comment saying the turn
          // came back beside a thread that says it did not.
          threadOf(9, [claimComment()]),
          runStatus(7, "completed"),
          { match: ["issue", "comment"] },
        ],
      });
      expect(r.status).toBe(1);
      expect(r.stderr).toContain("still holds a claim after the ending was posted");
      // Not relabelled: the label follows a release that took, never one that did not.
      expect(r.ghCalls.some((call) => call.includes("--add-label"))).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  /**
   * A pull request carrying the label is a node like any other, and it is the node kind a
   * runner run jams on most often — every reviewer and engineer run works a PR. The
   * enumeration used to be `gh issue list --label`, which goes to the search API with
   * `type:issue` and never returns a pull request, so this case could not have passed.
   */
  test("a pull request wearing the label is swept like an issue", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("sweep_stale_locks.ts"), [], {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_RUN_ID: "4242" },
        rules: [
          listed([469]),
          ...threadTwice(469, [claimComment()], [claimComment(), endingFor(55)]),
          runStatus(7, "completed"),
          { match: ["api", "repos/owner/repo/issues/469"], stdout: JSON.stringify({ state: "open", labels: [] }) },
          { match: ["issue", "comment"] },
          { match: ["issue", "edit"] },
          { match: ["label", "create"] },
        ],
      });
      expect(r.stderr).toContain("released a dead claim on #469");
      expect(postedBody(r.ghCalls)).toContain("<!-- atomaton:ended=done answers=55 run=4242 -->");
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  /**
   * `create_pr` parks on the PULL REQUEST it opened — it posts `ended=waiting` on the issue
   * and hands the pull request to validation. A leaf issue has no sub-issues, so a rule that
   * counted only sub-issues would read "nothing is open under this node" while a reviewer was
   * still working, and release the park mid-review with a notice saying nothing was running.
   */
  test("holds a park whose pull request is still open", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("sweep_stale_locks.ts"), [], {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_RUN_ID: "4242" },
        rules: [
          listed([462]),
          threadOf(462, [claimComment(CLAIM, 120), machinery(102, PARKED, 120)]),
          runStatus(7, "completed"),
          // No sub-issues at all — the shape a `create_pr` park leaves — and one open PR.
          linksOf(462, 0, 1),
        ],
      });
      expect(r.stderr).toContain("held 1");
      expect(r.stderr).toContain("released 0");
      expect(wrote(r.ghCalls)).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  /**
   * A person commenting while the sweep is in flight opens a NEW claim, under a new run id.
   * The release still took, and the proof has to ask the question the judgement answered —
   * this ask, this run — rather than "is any claim open", which would call a healed node
   * red and skip its label write.
   */
  test("a comment that arrives mid-sweep does not turn a healed node red", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("sweep_stale_locks.ts"), [], {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_RUN_ID: "4242" },
        rules: [
          listed([9]),
          // THREE reads of this thread, in this order — the sweep judges (1), names the
          // agent for the notice (2), and proves the release (3). The third is the one under
          // test: the ending is there, and a NEW run has claimed a different ask because
          // somebody commented while the sweep was working.
          { match: ["api", "issues/9/comments"], stdout: JSON.stringify([claimComment()]), attempt: 1 },
          { match: ["api", "issues/9/comments"], stdout: JSON.stringify([claimComment()]), attempt: 2 },
          {
            match: ["api", "issues/9/comments"],
            stdout: JSON.stringify([
              claimComment(),
              endingFor(55),
              machinery(200, "<!-- atomaton:took=201 run=9999 -->", 0),
            ]),
            attempt: 3,
          },
          runStatus(7, "completed"),
          { match: ["api", "repos/owner/repo/issues/9"], stdout: JSON.stringify({ state: "open", labels: [] }) },
          { match: ["issue", "comment"] },
          { match: ["issue", "edit"] },
          { match: ["label", "create"] },
        ],
      });
      expect(r.status).toBe(0);
      expect(r.stderr).toContain("released 1");
      expect(r.stderr).toContain("failed 0");
      // And the label moved, because the release was verified.
      expect(r.ghCalls.some((call) => call.includes("--add-label"))).toBe(true);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("refuses to run with no repository named", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(scriptPath("sweep_stale_locks.ts"), [], { cwd: configDir, env: { GITHUB_REPOSITORY: "" } });
      expect(r.status).toBe(2);
      expect(r.stderr).toContain("usage: sweep_stale_locks.ts");
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });
});
