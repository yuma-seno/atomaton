import { describe, expect, test } from "bun:test";
import { runWithFakeGh, scriptPath } from "./testing/harness.ts";

/**
 * `stop_on_pr_close.ts` — a pull request's close asks its run to stop.
 *
 * The measured defect (#455): a reviewer was reviewing a pull request when the pull
 * request merged. Nothing reached the run; it kept going for another nine minutes and
 * stopped only because an unrelated issue closed and the issue path's subtree propagation
 * happened to reach it.
 *
 * What these assert is the three halves of the fix, and the gate between them:
 *
 *   - a run holding the pull request is told to stop, through the tag the running job
 *     already polls for, and told what became of the pull request;
 *   - a pull request nobody is holding is left alone, so an ordinary close cannot invent
 *     a stop;
 *   - a stop already on the thread suppresses the second write, because an issue close
 *     propagates one onto a running node in the same seconds — and a stop OLDER than the
 *     claim does not, because the watcher cannot see it.
 *
 * The gate is the thread's open CLAIM, and the reason it is not `runInFlight` is why the
 * merged cases here are the ones that matter: that reader answers "no run" for a merged
 * pull request by design (#449), so a test that reached the merged case through it would
 * pass while writing nothing.
 */
describe("stop_on_pr_close.ts", () => {
  const MERGED_ARGS = ["--number", "455", "--merged", "true"];
  const CLOSED_ARGS = ["--number", "455", "--merged", "false"];

  /** A run holding the pull request: the ask, and the claim it wrote at start. */
  const CLAIMED_THREAD = JSON.stringify([
    { id: 10, body: "/reviewer", user: { type: "User" } },
    { id: 11, body: "<!-- atomaton:took=10 run=7 -->", user: { type: "Bot" } },
  ]);

  /** The same thread with the run's own ending on it: the turn is back with the person. */
  const ANSWERED_THREAD = JSON.stringify([
    { id: 10, body: "/reviewer", user: { type: "User" } },
    { id: 11, body: "<!-- atomaton:took=10 run=7 -->", user: { type: "Bot" } },
    {
      id: 12,
      body: "<!-- atomaton:agent=reviewer -->\n<!-- atomaton:ended=done answers=10 run=7 -->\nReviewed.",
      user: { type: "Bot" },
    },
  ]);

  /**
   * A stop the issue close propagated onto this pull request before this job ran.
   *
   * Newer than the claim, so the watcher will act on it and this job has nothing to add.
   */
  const STOPPED_SINCE_CLAIM = JSON.stringify([
    { id: 10, body: "/reviewer", user: { type: "User" } },
    { id: 11, body: "<!-- atomaton:took=10 run=7 -->", user: { type: "Bot" } },
    {
      id: 13,
      body: "<!-- atomaton:stop=requested -->\nAtomaton: #441 was closed, so the run here has been asked to stop.",
      user: { type: "Bot" },
    },
  ]);

  /**
   * A stop OLDER than the claim, left by an earlier run on this pull request.
   *
   * The watcher polls one page since its own start, so it cannot see this one. Treating it
   * as "already asked" would suppress the request and leave the live run unstoppable — the
   * failure that makes the comparison positional rather than "any stop at all".
   */
  const STOP_BEFORE_CLAIM = JSON.stringify([
    { id: 5, body: "<!-- atomaton:stop=requested -->\nAtomaton: an earlier run was asked to stop." },
    { id: 10, body: "/reviewer", user: { type: "User" } },
    { id: 11, body: "<!-- atomaton:took=10 run=7 -->", user: { type: "Bot" } },
  ]);

  /**
   * A stop inside a quotation of somebody else's words.
   *
   * The guard preserves a removed person's comment verbatim, tags and all. That is not the
   * machinery asking, and reading it as one would let the guard's own deletion notice
   * suppress a stop that was never written.
   */
  const QUOTED_STOP = JSON.stringify([
    { id: 10, body: "/reviewer", user: { type: "User" } },
    { id: 11, body: "<!-- atomaton:took=10 run=7 -->", user: { type: "Bot" } },
    {
      id: 14,
      body: "<!-- atomaton:quotes=13 -->\n<details>\n<summary>A comment removed while a run was working</summary>\n\n<!-- atomaton:stop=requested -->\n\n</details>",
      user: { type: "Bot" },
    },
  ]);

  function run(args: string[], thread: string) {
    return runWithFakeGh(scriptPath("stop_on_pr_close.ts"), args, {
      env: { GITHUB_REPOSITORY: "owner/repo" },
      rules: [
        { match: ["api", "comments"], code: 0, stdout: thread },
        { match: ["issue", "comment"] },
      ],
    });
  }

  /** The call the script posted with, or "" when it posted nothing. */
  function posted(r: ReturnType<typeof run>): string {
    const call = r.ghCalls.find((c) => c[0] === "issue" && c[1] === "comment");
    return call?.join(" ") ?? "";
  }

  describe("a run holding the pull request", () => {
    test("is asked to stop through the tag the running job polls for", () => {
      const r = run(MERGED_ARGS, CLAIMED_THREAD);
      expect(r.status).toBe(0);
      // The tag IS the request. Without it this is a notice telling a person a stop is
      // coming that never arrives.
      expect(posted(r)).toContain("atomaton:stop=requested");
      // One comment, not two: the tag and the sentence belong to the same post.
      expect(r.ghCalls.filter((c) => c[0] === "issue" && c[1] === "comment").length).toBe(1);
    });

    test("is kept out of the next session's context", () => {
      // Addressed to a person. An agent reading it would take it as an instruction, and the
      // run it was written for is the one being stopped.
      expect(posted(run(MERGED_ARGS, CLAIMED_THREAD))).toContain("atomaton:llm-context=exclude");
    });

    test("a merge says the work is already in, and offers no resume", () => {
      const comment = posted(run(MERGED_ARGS, CLAIMED_THREAD));
      expect(comment).toContain("merged while an agent was working on it");
      expect(comment).toContain("nothing here to resume");
      // `/resume` on a merged pull request starts a run whose review target is already on
      // the default branch — the advice #455 recorded as false.
      expect(comment).not.toContain("/resume");
    });

    test("a close that merged nothing does not claim the work landed", () => {
      const comment = posted(run(CLOSED_ARGS, CLAIMED_THREAD));
      expect(comment).toContain("#455 was closed while an agent was working on it");
      expect(comment).not.toContain("was merged");
      // Neither outcome offers the way back: the run's own report says that, once it has
      // actually stopped.
      expect(comment).not.toContain("/resume");
    });
  });

  describe("a pull request nobody is holding", () => {
    test("the run already reported: nothing to stop", () => {
      const r = run(MERGED_ARGS, ANSWERED_THREAD);
      expect(r.status).toBe(0);
      expect(posted(r)).toBe("");
    });

    test("an empty thread: nothing to stop, and nothing else read", () => {
      const r = run(MERGED_ARGS, "[]");
      expect(r.status).toBe(0);
      expect(posted(r)).toBe("");
    });
  });

  describe("a stop already on the thread", () => {
    test("newer than the claim is not repeated", () => {
      const r = run(MERGED_ARGS, STOPPED_SINCE_CLAIM);
      expect(r.status).toBe(0);
      expect(posted(r)).toBe("");
    });

    /**
     * The watcher honours only what arrived after it began watching, so a stop from an
     * earlier run on this node is invisible to the live one. Suppressing here would leave
     * a run nobody can stop, which is worse than the duplicate comment it avoids.
     */
    test("older than the claim does not suppress anything", () => {
      const r = run(MERGED_ARGS, STOP_BEFORE_CLAIM);
      expect(r.status).toBe(0);
      expect(posted(r)).toContain("atomaton:stop=requested");
    });

    test("inside a quotation is not a request", () => {
      const r = run(MERGED_ARGS, QUOTED_STOP);
      expect(r.status).toBe(0);
      expect(posted(r)).toContain("atomaton:stop=requested");
    });
  });

  test("a thread that cannot be read fails rather than staying quiet", () => {
    const r = runWithFakeGh(scriptPath("stop_on_pr_close.ts"), MERGED_ARGS, {
      env: { GITHUB_REPOSITORY: "owner/repo" },
      rules: [{ match: ["api", "comments"], code: 1, stdout: "" }],
    });
    // Exit 1, not 0: a close nobody could look at is not a close with nothing to stop, and
    // a green job would say the first while meaning the second.
    expect(r.status).toBe(1);
    expect(r.ghCalls.some((c) => c[0] === "issue" && c[1] === "comment")).toBe(false);
  });

  test("a stop that did not land fails, because the comment IS the stop", () => {
    const r = runWithFakeGh(scriptPath("stop_on_pr_close.ts"), MERGED_ARGS, {
      env: { GITHUB_REPOSITORY: "owner/repo" },
      rules: [
        { match: ["api", "comments"], code: 0, stdout: CLAIMED_THREAD },
        { match: ["issue", "comment"], code: 1, stdout: "" },
      ],
    });
    // It would otherwise poll, find nothing, and keep going — while the person who merged
    // has every reason to believe it is winding down.
    expect(r.status).toBe(1);
  });

  test("a missing --number is a usage error, not a silent success", () => {
    const r = runWithFakeGh(scriptPath("stop_on_pr_close.ts"), ["--merged", "true"], {
      env: { GITHUB_REPOSITORY: "owner/repo" },
      rules: [],
    });
    expect(r.status).toBe(2);
    expect(r.ghCalls).toEqual([]);
  });
});
