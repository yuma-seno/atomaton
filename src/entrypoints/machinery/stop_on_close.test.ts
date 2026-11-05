import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { makeConfigDir, runWithFakeGh, scriptPath } from "./testing/harness.ts";

/**
 * Closing ends a line of work, not one node. What these assert is the reach: the right
 * closes stop and close everything under them, and the wrong ones touch nothing.
 *
 * The pull request rule names the tag it searches for, and that is not decoration. The
 * fake `gh` matches a rule when each string appears somewhere in the argv, and the
 * pull request search carries `atomaton:parent-issue=` — which contains "issue". A bare
 * `["issue", "list"]` rule therefore swallowed the `gh pr list` call as well, and the
 * pull request half of the tree came back empty while every assertion about it still
 * read as if it had been looked for. Two tests passed that way before this was written.
 */
describe("stop_on_close.ts", () => {
  const RUNNING_ROOT = JSON.stringify({ state: "open", labels: [] });
  const CLOSED_ARGS = ["--number", "803", "--closer", "octocat", "--closer-type", "User"];

  /**
   * A thread whose last turn-changing event is a request for an agent -- a run is in
   * flight. `running` is read from the thread now, not the `atomaton/in-progress`
   * label, so a fixture that wants a live node says so with a comment.
   */
  const RUNNING_THREAD = JSON.stringify([
    { id: 1, body: "<!-- atomaton:dispatch=engineer -->", user: { type: "Bot" } },
  ]);
  /** A thread with nothing asked for: no run is in flight. */
  const IDLE_THREAD = "[]";
  /**
   * The thread a merged pull request was left holding (#449, measured on #442/#445/#446).
   *
   * A merged pull request re-invokes the issue it delivers; the runner wrote that
   * dispatch onto the PULL REQUEST as `ended=handoff`, a promise that the next agent
   * runs here — on a node nothing can ever run on again. Every such pull request read
   * as "a run is working or coming" forever, and a close listed it among the runs it
   * was stopping.
   */
  const MERGED_PR_HANDOFF_THREAD = JSON.stringify([
    { id: 10, body: "/engineer", user: { type: "User" } },
    { id: 11, body: "<!-- atomaton:took=10 run=5 -->", user: { type: "Bot" } },
    {
      id: 12,
      body: "<!-- atomaton:agent=reviewer -->\n<!-- atomaton:ended=handoff answers=10 run=5 -->\nMerged.",
      user: { type: "Bot" },
    },
  ]);

  /**
   * The sub-issues under a node, as GitHub's own links report them.
   *
   * They used to come from an `atomaton:parent=N in:body` search, and these fixtures
   * were about that half with the native half answering empty. The tag is gone and
   * the link is the record — see `adapters/github/parent-issue.ts`. Pull requests are still found
   * by their own tag, because GitHub does not keep its PR-to-issue link in this
   * design.
   */
  const subIssues = (...children: { number: number; state?: string }[]) => ({
    match: ["api", "graphql"],
    stdout: JSON.stringify({
      data: {
        repository: {
          issueOrPullRequest: {
            __typename: "Issue",
            parent: null,
            subIssues: {
              nodes: children.map((child) => ({
                number: child.number,
                title: `#${child.number}`,
                state: child.state ?? "OPEN",
                labels: { nodes: [] },
              })),
            },
            closedByPullRequestsReferences: { nodes: [] },
            timelineItems: { nodes: [] },
          },
        },
      },
    }),
  });
  const NO_NATIVE_LINKS = subIssues();

  function run(args: string[], rules: { match: string[]; stdout?: string; code?: number }[]) {
    const configDir = makeConfigDir({});
    try {
      return runWithFakeGh(scriptPath("stop_on_close.ts"), args, {
        cwd: configDir,
        env: { GITHUB_REPOSITORY: "owner/repo" },
        rules,
      });
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  }

  test("asks the run to stop, and says so where the run is looking", () => {
    const r = run(CLOSED_ARGS, [
      { match: ["api", "issues/803/comments"], stdout: RUNNING_THREAD },
      { match: ["api", "issues/803"], stdout: RUNNING_ROOT },
      { match: ["pr", "list", "parent-issue="], stdout: "[]" },
      NO_NATIVE_LINKS,
      { match: ["issue", "comment"] },
    ]);
    expect(r.status).toBe(0);
    const comment = r.ghCalls.find((c) => c.includes("comment"))?.join(" ") ?? "";
    // The stop tag is the request: the running job polls for it. Without it this is a
    // notice telling somebody a stop is coming that never arrives.
    expect(comment).toContain("atomaton:stop=requested");
    expect(comment).toContain("Closing does not stop a run by itself");
    // The run's own result comment says those, seconds later, and mentions them there.
    expect(comment).not.toContain("@octocat");
    expect(comment).not.toContain("/resume");
  });

  /**
   * An agent closing the issue it is working on is how it finishes. The workflow gates
   * on this too; the script refuses as well, so the rule survives being called from
   * somewhere else.
   */
  test("a bot's close reaches nothing, and reads nothing to find that out", () => {
    const r = run(["--number", "803", "--closer", "atomaton-bot", "--closer-type", "Bot"], []);
    expect(r.status).toBe(0);
    expect(r.ghCalls).toEqual([]);
  });

  /**
   * The case the old shape got wrong. It read the root's label, found none, and
   * returned — right about the root and wrong about the work, because an issue can be
   * closed with nothing running on it and a live chain underneath.
   */
  test("closes the work under an issue even when nothing was running on it", () => {
    const r = run(CLOSED_ARGS, [
      { match: ["api", "issues/803/comments"], stdout: IDLE_THREAD },
      { match: ["api", "issues/807/comments"], stdout: IDLE_THREAD },
      { match: ["api", "issues/803"], stdout: JSON.stringify({ state: "closed", labels: [] }) },
      { match: ["pr", "list", "parent-issue="], stdout: "[]" },
      subIssues({ number: 807 }),
      { match: ["issue", "comment"] },
      { match: ["issue", "close"] },
    ]);
    expect(r.status).toBe(0);
    expect(r.ghCalls.some((c) => c[0] === "issue" && c[1] === "close" && c.includes("807"))).toBe(true);
  });

  test("nothing running and nothing open under it is nothing to do", () => {
    const r = run(CLOSED_ARGS, [
      { match: ["api", "issues/803/comments"], stdout: IDLE_THREAD },
      { match: ["api", "issues/803"], stdout: JSON.stringify({ state: "closed", labels: [] }) },
      { match: ["pr", "list", "parent-issue="], stdout: "[]" },
      NO_NATIVE_LINKS,
    ]);
    expect(r.status).toBe(0);
    expect(r.ghCalls.some((c) => c.includes("comment"))).toBe(false);
    expect(r.ghCalls.some((c) => c.includes("close"))).toBe(false);
  });

  /**
   * A failed read is not "nothing to do". Answering it as one would close an issue and
   * leave the chain under it running, with nobody told.
   */
  test("a tree it could not read fails loudly rather than staying quiet", () => {
    const r = run(CLOSED_ARGS, [{ match: ["api", "issues/803"], code: 1, stdout: "gh: not found" }]);
    expect(r.status).not.toBe(0);
    expect(r.stderr).toContain("::error::");
    expect(r.ghCalls.some((c) => c.includes("close"))).toBe(false);
  });

  /**
   * A stop reaches every running node under the closed one, and each is told where it
   * came from — nobody typed anything there, and an unexplained stop reads as a
   * malfunction.
   */
  test("a running sub-issue is stopped and told why", () => {
    const r = run(CLOSED_ARGS, [
      { match: ["api", "issues/803/comments"], stdout: RUNNING_THREAD },
      { match: ["api", "issues/807/comments"], stdout: RUNNING_THREAD },
      { match: ["api", "issues/803"], stdout: RUNNING_ROOT },
      { match: ["pr", "list", "parent-issue="], stdout: "[]" },
      subIssues({ number: 807 }),
      { match: ["issue", "comment"] },
      { match: ["issue", "close"] },
    ]);
    expect(r.status).toBe(0);
    const toChild = r.ghCalls.find((c) => c.includes("comment") && c.includes("807"))?.join(" ") ?? "";
    expect(toChild).toContain("atomaton:stop=requested");
    expect(toChild).toContain("#803 was closed");
  });

  /**
   * A merged pull request has left the tree: GitHub cannot close one, and attempting it
   * would report a failure that is not one.
   */
  test("a merged pull request under the issue is left alone", () => {
    const r = run(CLOSED_ARGS, [
      { match: ["api", "issues/803/comments"], stdout: RUNNING_THREAD },
      { match: ["api", "issues/817/comments"], stdout: IDLE_THREAD },
      { match: ["api", "issues/803"], stdout: RUNNING_ROOT },
      {
        match: ["pr", "list", "parent-issue="],
        stdout: JSON.stringify([
          { number: 817, body: "<!-- atomaton:parent-issue=803 -->", state: "MERGED", labels: [] },
        ]),
      },
      NO_NATIVE_LINKS,
      { match: ["issue", "comment"] },
    ]);
    expect(r.status).toBe(0);
    expect(r.ghCalls.some((c) => c[0] === "pr" && c[1] === "close")).toBe(false);
  });

  /**
   * The observed defect (#443, 2026-11-05): a parent whose work had all landed was
   * closed and the machinery announced stopping two runs — on #445 and #446, pull
   * requests that had merged hours before and had had no run since.
   *
   * The cause was a reader, not a racer: every merged pull request's thread ended
   * `ended=handoff` (the post-merge dispatch of the issue it delivers, written onto the
   * pull request), and `runInFlight` reads a hand-off as a run working or coming. So
   * the assertion is the whole criterion — neither the sentence about runs nor the
   * stop request appears, because there was nothing to stop.
   */
  describe("closing a parent whose only children are merged pull requests", () => {
    const MERGED_PR = {
      number: 817,
      body: "<!-- atomaton:parent-issue=803 -->",
      state: "MERGED",
      labels: [] as string[],
    };

    test("says nothing about stopping runs, and does not ask anything to stop", () => {
      const r = run(CLOSED_ARGS, [
        { match: ["api", "issues/803/comments"], stdout: IDLE_THREAD },
        // The pull request's own thread, still carrying the hand-off the old shape wrote.
        { match: ["api", "issues/817/comments"], stdout: MERGED_PR_HANDOFF_THREAD },
        { match: ["api", "issues/803"], stdout: JSON.stringify({ state: "closed", labels: [] }) },
        {
          match: ["pr", "list", "parent-issue="],
          stdout: JSON.stringify([MERGED_PR]),
        },
        NO_NATIVE_LINKS,
        { match: ["issue", "comment"] },
      ]);
      expect(r.status).toBe(0);
      const commented = r.ghCalls.filter((c) => c.includes("comment")).map((c) => c.join(" "));
      expect(commented, JSON.stringify(commented)).toEqual([]);
      expect(r.ghCalls.some((c) => c.join(" ").includes("atomaton:stop=requested"))).toBe(false);
    });

    /**
     * And the same close, where something under it IS open and does need closing: the
     * comment that gets posted is about the close, not about a run. This is the pair
     * that matters — the fix must not silence a close that has real work to report, it
     * must stop inventing runs.
     */
    test("with an open sub-issue, the receipt is about the close and not about a run", () => {
      const r = run(CLOSED_ARGS, [
        { match: ["api", "issues/803/comments"], stdout: IDLE_THREAD },
        { match: ["api", "issues/807/comments"], stdout: IDLE_THREAD },
        { match: ["api", "issues/817/comments"], stdout: MERGED_PR_HANDOFF_THREAD },
        { match: ["api", "issues/803"], stdout: JSON.stringify({ state: "closed", labels: [] }) },
        {
          match: ["pr", "list", "parent-issue="],
          stdout: JSON.stringify([MERGED_PR]),
        },
        subIssues({ number: 807 }),
        { match: ["issue", "comment"] },
        { match: ["issue", "close"] },
      ]);
      expect(r.status).toBe(0);
      const toRoot = r.ghCalls.find((c) => c.includes("comment") && c.includes("803"))?.join(" ") ?? "";
      expect(toRoot).toContain("#803 stays closed");
      // The two claims #443 got wrong: nothing was running on the root, and #817 was
      // not a run being stopped.
      expect(toRoot).not.toContain("an agent was working on it");
      expect(toRoot).not.toContain("Runs were going on");
      expect(toRoot).not.toContain("atomaton:stop=requested");
      // The close itself still reaches the open child.
      expect(r.ghCalls.some((c) => c[0] === "issue" && c[1] === "close" && c.includes("807"))).toBe(true);
    });
  });

  /**
   * A close whose root is idle while a CHILD is live. The root's receipt is about the
   * root, so it must not claim a run was working there; the child is what gets the
   * stop request, and it gets it on its own node.
   */
  test("an idle root and a running child: the receipt is the root's, the stop is the child's", () => {
    const r = run(CLOSED_ARGS, [
      { match: ["api", "issues/803/comments"], stdout: IDLE_THREAD },
      { match: ["api", "issues/807/comments"], stdout: RUNNING_THREAD },
      { match: ["api", "issues/803"], stdout: JSON.stringify({ state: "closed", labels: [] }) },
      { match: ["pr", "list", "parent-issue="], stdout: "[]" },
      subIssues({ number: 807 }),
      { match: ["issue", "comment"] },
      { match: ["issue", "close"] },
    ]);
    expect(r.status).toBe(0);
    const toRoot = r.ghCalls.find((c) => c.includes("comment") && c.includes("803"))?.join(" ") ?? "";
    expect(toRoot).not.toContain("an agent was working on it");
    expect(toRoot).not.toContain("atomaton:stop=requested");
    // The child is named as what was stopped, and the tag is where its job polls.
    expect(toRoot).toContain("Runs were going on #807");
    const toChild = r.ghCalls.find((c) => c.includes("comment") && c.includes("807"))?.join(" ") ?? "";
    expect(toChild).toContain("atomaton:stop=requested");
  });

  /** An open pull request is a node like any other, and closes with its issue. */
  test("an open pull request under the issue is closed with it", () => {
    const r = run(CLOSED_ARGS, [
      { match: ["api", "issues/803/comments"], stdout: RUNNING_THREAD },
      { match: ["api", "issues/826/comments"], stdout: IDLE_THREAD },
      { match: ["api", "issues/803"], stdout: RUNNING_ROOT },
      {
        match: ["pr", "list", "parent-issue="],
        stdout: JSON.stringify([
          { number: 826, body: "<!-- atomaton:parent-issue=803 -->", state: "OPEN", labels: [] },
        ]),
      },
      NO_NATIVE_LINKS,
      { match: ["issue", "comment"] },
      { match: ["pr", "close"] },
    ]);
    expect(r.status).toBe(0);
    expect(r.ghCalls.some((c) => c[0] === "pr" && c[1] === "close" && c.includes("826"))).toBe(true);
  });
});
