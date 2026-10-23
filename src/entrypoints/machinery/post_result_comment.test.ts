import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildCommentBody, buildFooter, endedWithToolCalls, lastAgentText } from "./post_result_comment.ts";
import type { Session } from "../../domain/work/session.ts";
import { runWithFakeGh, scriptPath } from "./testing/harness.ts";

describe("post_result_comment.ts buildCommentBody", () => {
  test("mentions notify when there is no directive and the chain does not continue", () => {
    const body = buildCommentBody({
      agent: "atomaton",
      notify: "octocat",
      runUrl: "http://example.com/run/1",
      output: "All done.",
    });
    expect(body).toContain("<!-- atomaton:agent=atomaton -->");
    expect(body).toContain("All done.");
    expect(body).toContain("@octocat");
    expect(body).toContain("_run by [atomaton](http://example.com/run/1)_");
  });

  /**
   * The escaped-mention notice belongs with what the agent wrote, and above the
   * run footer -- somebody scanning the comment for what happened reads the top,
   * and reads the footer only when they want the run.
   */
  test("says so when a mention was defused, between the report and the footer", () => {
    const body = buildCommentBody({
      agent: "engineer",
      runUrl: "http://example.com/run/1",
      output: "Following `@torvalds`' approach.",
      escapedMentions: ["torvalds"],
    });
    expect(body).toContain("Nobody was notified");
    expect(body.indexOf("Nobody was notified")).toBeGreaterThan(body.indexOf("Following"));
    expect(body.indexOf("Nobody was notified")).toBeLessThan(body.indexOf("_run by"));
  });

  test("and says nothing when nothing was defused", () => {
    const body = buildCommentBody({
      agent: "engineer",
      runUrl: "http://example.com/run/1",
      output: "All done.",
    });
    expect(body).not.toContain("Nobody was notified");
  });

  /**
   * The directive names a run that a stop cancelled, so it is a plan rather than a
   * fact and silences nothing. Without this the comment believed the handoff it
   * could see over the stop it could not: nothing ran next, and nobody was told.
   */
  test("keeps the mention when a stop cancelled the directive's handoff", () => {
    const body = buildCommentBody({
      agent: "atomaton",
      notify: "octocat",
      directive: "engineer",
      endedBecause: "stopped",
      runUrl: "http://example.com/run/1",
      output: "Handing off.",
    });
    expect(body).toContain("@octocat");
    expect(body).toContain("Stopped on request");
  });

  test("and when a spent time budget cancelled it", () => {
    const body = buildCommentBody({
      agent: "atomaton",
      notify: "octocat",
      directive: "engineer",
      endedBecause: "runtime",
      runUrl: "http://example.com/run/1",
      output: "Handing off.",
    });
    expect(body).toContain("@octocat");
  });

  /**
   * A stop lands at a turn boundary, so a run reading files when it arrives has said
   * nothing and there is nothing to salvage either. The comment is then entirely the
   * machinery's: that it stopped, that the session survived, and how to resume.
   * Saying so outright matters, because a report-shaped comment with no report in it
   * otherwise reads as a run that finished with nothing to say.
   */
  test("says outright when the run was cut short having said nothing", () => {
    const body = buildCommentBody({
      agent: "engineer",
      notify: "octocat",
      wroteNothing: true,
      endedBecause: "stopped",
      runUrl: "http://example.com/run/1",
      output: "_This run was stopped before it said anything._",
    });
    expect(body).toContain("ended before it said anything at all");
    expect(body).toContain("saved session");
    expect(body).toContain("/resume");
    expect(body).toContain("@octocat");
    // Not the salvage warning: that one promises a sentence from the middle of the
    // work, and there is none.
    expect(body).not.toContain("Below is the last thing it said");
  });

  /**
   * Observed in production on #839, on the first run that reached this line after a
   * stop: the comment told the person who had just stopped the run that it had
   * completed. It had said nothing at all.
   */
  test("does not tell someone who stopped a run that it completed", () => {
    const body = buildCommentBody({
      agent: "engineer",
      notify: "octocat",
      wroteNothing: true,
      endedBecause: "stopped",
      runUrl: "http://example.com/run/1",
      output: "_This run was stopped before it said anything._",
    });
    expect(body).toContain("@octocat");
    expect(body).toContain("was stopped before it finished");
    expect(body).not.toContain("task completed");
  });

  test("nor that one which ran out of time completed", () => {
    const body = buildCommentBody({
      agent: "engineer",
      notify: "octocat",
      endedBecause: "runtime",
      runUrl: "http://example.com/run/1",
      output: "Got partway.",
    });
    expect(body).toContain("ran out of time before it finished");
    expect(body).not.toContain("task completed");
  });

  /** The ordinary ending keeps the sentence it always had. */
  test("a run that finished still says so", () => {
    const body = buildCommentBody({
      agent: "engineer",
      notify: "octocat",
      reported: true,
      runUrl: "http://example.com/run/1",
      output: "All done.",
    });
    expect(body).toContain("task completed");
  });

  /**
   * And a run that ended of its own accord without writing one does not get it. Three
   * of 396 sessions ended this way with the core recording `completed`, after 313, 173
   * and 110 tool calls -- and each was told "task completed. Please review the
   * results", over a comment holding no results to review.
   */
  test("a run that ended without writing a report is not told it completed", () => {
    const body = buildCommentBody({
      agent: "engineer",
      notify: "octocat",
      reported: false,
      runUrl: "http://example.com/run/1",
      output: "",
    });
    expect(body).toContain("@octocat");
    expect(body).toContain("ended without writing a report");
    expect(body).not.toContain("task completed");
  });

  /**
   * `atomaton:ended` answers one question -- was this node INTERRUPTED -- because
   * `/resume` is its only reader and that is what it picks nodes by. A run that
   * reported nothing was not interrupted: it ended believing itself done, so resuming
   * it would restart an agent with nothing left to do. The person the mention fetches
   * is what it needs instead.
   */
  test("a run that said nothing is not tagged as one to resume", () => {
    const body = buildCommentBody({
      agent: "engineer",
      reported: false,
      runUrl: "http://example.com/run/1",
      output: "",
    });
    expect(body).toContain("<!-- atomaton:ended=done answers=0 run=0 -->");
  });

  test("omits the mention when a directive is present", () => {
    const body = buildCommentBody({
      agent: "atomaton",
      notify: "octocat",
      directive: "engineer",
      runUrl: "http://example.com/run/1",
      output: "Handing off.",
    });
    expect(body).not.toContain("@octocat");
  });

  test("omits the mention when the chain already continues", () => {
    const body = buildCommentBody({
      agent: "atomaton",
      notify: "octocat",
      chainContinues: "true",
      runUrl: "http://example.com/run/1",
      output: "Dispatched.",
    });
    expect(body).not.toContain("@octocat");
  });

  // Closing a sub-issue is what wakes its parent, in a later workflow run that
  // this one cannot see -- so `chainContinues` is false here and the mention
  // would otherwise ask a person to act on work that is still moving.
  test("omits the mention when a closed sub-issue hands back to its parent", () => {
    const body = buildCommentBody({
      agent: "engineer",
      notify: "octocat",
      reported: true,
      isSubIssue: true,
      issueClosed: true,
      runUrl: "http://example.com/run/1",
      output: "Merged in PR #173. Closing this sub-task.",
    });
    expect(body).not.toContain("@octocat");
  });

  /**
   * The same hand-back, by a child that wrote nothing. The parent is woken to
   * aggregate what its children found and this one left it nothing to find, so the
   * silence has nobody left to hand to.
   */
  test("keeps it when the closed sub-issue's run left nothing to hand back", () => {
    const body = buildCommentBody({
      agent: "engineer",
      notify: "octocat",
      reported: false,
      isSubIssue: true,
      issueClosed: true,
      runUrl: "http://example.com/run/1",
      output: "",
    });
    expect(body).toContain("@octocat");
  });

  test("keeps the mention when a sub-issue run ends with the sub-issue open", () => {
    const body = buildCommentBody({
      agent: "engineer",
      notify: "octocat",
      reported: true,
      isSubIssue: true,
      issueClosed: false,
      runUrl: "http://example.com/run/1",
      output: "I could not finish this.",
    });
    expect(body).toContain("@octocat");
  });

  test("appends the ran-out warning", () => {
    const body = buildCommentBody({
      agent: "engineer",
      endedBecause: "runtime",
      runUrl: "http://example.com/run/1",
      output: "Still working.",
    });
    expect(body).toContain("The run ran out of time");
    expect(body).toContain("`/engineer`");
  });
  // The line has to say the session survived: that is the entire difference between
  // a stop and cancelling the workflow run, and the person who asked cannot tell
  // which one they got from anywhere else.
  test("a stop says the session is saved and how to continue", () => {
    const body = buildCommentBody({
      agent: "engineer",
      endedBecause: "stopped",
      runUrl: "http://example.com/run/1",
      output: "Halfway through.",
    });
    expect(body).toContain("Stopped on request");
    expect(body).toContain("session is saved");
    expect(body).toContain("`/resume`");
  });

  /**
   * There used to be a test here for a stop and a limit arriving together, with a
   * rule about which won. Both were booleans the runner set by guessing, and it
   * could set both.
   *
   * It cannot now: the core records ONE word for how the run ended, and this reads
   * it. The case the test covered is gone rather than handled, which is the better
   * outcome and worth saying rather than leaving as a test that vanished.
   */
  test("the ceiling a run hit is named, and this runner only ever hits the clock", () => {
    const outOfTime = buildCommentBody({
      agent: "engineer",
      endedBecause: "runtime",
      notify: "alice",
      runUrl: "http://example.com/run/1",
      output: "Halfway through.",
    });
    expect(outOfTime).toContain("ran out of time");
    // The sentence this replaces. `--max-iterations` is never passed, so a run that
    // hit a ceiling always hit the clock — and it was told it had run out of
    // iterations every time.
    expect(outOfTime).not.toContain("ran out of iterations");
  });

  test("an iteration ceiling, which a project can still set, is named as one", () => {
    const body = buildCommentBody({
      agent: "engineer",
      endedBecause: "iterations",
      notify: "alice",
      runUrl: "http://example.com/run/1",
      output: "Halfway through.",
    });
    expect(body).toContain("ran out of iterations");
  });

  /**
   * The repetition circuit breaker is a third way a run stops itself, and it gets its
   * own sentence: "ran out of time" would send a person to re-scope a task that was
   * never too big, when the thing to do is simply ask the same turn again.
   */
  test("a run cut off for repeating itself says so, not that it ran out of time", () => {
    const body = buildCommentBody({
      agent: "engineer",
      endedBecause: "loop",
      notify: "alice",
      runUrl: "http://example.com/run/1",
      output: "Halfway through.",
    });
    expect(body).toContain("got stuck repeating itself");
    expect(body).not.toContain("ran out of time");
  });

  /**
   * In the footer, where the machine's own facts about the run already are. Said
   * there rather than left to the agent because asking did not work: over 396
   * sessions, 30 runs carried a problem a server reported about itself and 3
   * mentioned it (#940). A reader has to be able to see that this sentence is the
   * machinery's -- an agent's own report of a broken tool is worth more, and the two
   * must not be mistaken for each other.
   *
   * Plain italic, in the voice of the token line and the run link, and deliberately
   * not a `⚠️`. That marker means one thing in this footer -- the run was cut off and
   * a person has to continue it -- and that notice is the one line here anybody has
   * to act on. This one is a count, and most of what it counts is a guard doing its
   * job: 107 of 396 runs carried a refused or errored call, so marking it would put a
   * warning sign on a quarter of all comments and the meaningful one would stop being
   * read.
   */
  test("what the tools did to the run reads as the machine's, under the run link", () => {
    const body = buildCommentBody({
      agent: "engineer",
      endedBecause: "runtime",
      runUrl: "http://example.com/run/1",
      output: "LGTM.",
      toolTrouble: "Counted from the session: 1 problem a server reported about itself (`search`).",
    });
    expect(body).toContain("\n_Counted from the session: 1 problem a server reported about itself (`search`)._");
    expect(body.indexOf("Counted from the session")).toBeGreaterThan(body.indexOf("_run by"));
    expect(body.indexOf("Counted from the session")).toBeGreaterThan(body.indexOf("LGTM."));
    // Above the continuation notice: the count is a fact, the notice is the action,
    // and the action reads last.
    expect(body.indexOf("Counted from the session")).toBeLessThan(body.indexOf("The run ran out of time"));
    // And the notice keeps the only warning sign in the footer, which is what makes
    // it findable at a glance.
    expect(body.split("⚠️").length - 1, "one ⚠️ in the footer, on the line that needs a person").toBe(1);
  });

  /** The ordinary run. Nothing to count is nothing to say. */
  test("and is absent when the tools gave the run no trouble", () => {
    const body = buildCommentBody({
      agent: "engineer",
      runUrl: "http://example.com/run/1",
      output: "LGTM.",
    });
    expect(body).not.toContain("Counted from the session");
  });
});

describe("post_result_comment.ts main", () => {
  /**
   * The path is required, and this is why.
   *
   * It used to open `atomaton_output.txt` relative to the working directory. A change
   * moved the run's files out of the work tree and the read went to a path that no
   * longer existed -- landing in the "empty output" branch, whose message reads
   * like a session that ended via a tool call. Two releases shipped where no
   * agent's report reached anyone, with every step reporting success.
   *
   * A default would put that back for any caller that forgot the argument. Exiting
   * non-zero instead makes a missing argument a failed step, which is the one thing
   * the original could not be.
   */
  test("refuses to run without --output rather than guessing a path", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    try {
      // A file the old relative read would have found and posted from.
      writeFileSync(join(dir, "atomaton_output.txt"), "All done.");
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        ["--number", "5", "--agent", "engineer", "--run-url", "http://example.com/run/1"],
        { cwd: dir, rules: [{ match: ["api", "comments"] }] },
      );
      expect(r.status, "a missing --output is a failed step, not a silent skip").not.toBe(0);
      expect(r.ghCalls.length).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * The same empty output, and the opposite answer, because the two empties mean
   * opposite things.
   *
   * A session-ending tool call chose to end and posted its own comment. A stop did
   * not choose anything: it arrives at a turn boundary, so a run reading files when
   * it lands has said nothing and has nothing to salvage. Measured on #831 -- nine
   * iterations, every one a tool call, no assistant text at all. Skipping there
   * drops the machinery's own sentence along with the agent's silence.
   */
  test("posts for a stopped run that said nothing, rather than skipping with it", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    try {
      writeFileSync(join(dir, "atomaton_output.txt"), "");
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        [
          "--number", "831", "--type", "issue", "--agent", "engineer", "--notify", "octocat",
          "--ended-because", "stopped", "--run-url", "http://example.com/run/1",
          "--output", join(dir, "atomaton_output.txt"),
        ],
        { cwd: dir, env: { GITHUB_REPOSITORY: "owner/repo" }, rules: [{ match: ["api"], stdout: "{}" }] },
      );
      expect(r.status).toBe(0);
      const posted = r.ghCalls.find((c) => c.some((a) => a.includes("Stopped on request")));
      expect(posted, "a stopped run has to say that it stopped").toBeDefined();
      const body = posted?.join(" ") ?? "";
      expect(body).toContain("ended before it said anything at all");
      expect(body).toContain("/resume");
      expect(body).toContain("@octocat");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * An empty output file with no session to read proves nothing about how the
   * run ended, so the run posts the no-report notice instead of skipping. These
   * two are #186's shape exactly -- an empty file and no session anywhere --
   * where the old skip fired on the file's emptiness alone. The proven
   * session-ending tool call, the only shape that still skips, is the pair
   * further down.
   */
  test("posts a no-report notice when the output file is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    try {
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        ["--number", "5", "--type", "issue", "--agent", "atomaton", "--notify", "octocat", "--run-url", "http://example.com/run/1", "--output", join(dir, "atomaton_output.txt")],
        { cwd: dir, env: { GITHUB_REPOSITORY: "owner/repo" }, rules: [{ match: ["api", "comments"], stdout: "42" }] },
      );
      expect(r.status).toBe(0);
      const posted = r.ghCalls.find((c) => c.join(" ").includes("_run by"))?.join(" ") ?? "";
      expect(posted, "a missing output file proves nothing about a tool call").toContain("This run ended without saying anything.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("posts a no-report notice when atomaton_output.txt is blank", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    writeFileSync(join(dir, "atomaton_output.txt"), "   \n");
    try {
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        ["--number", "5", "--type", "issue", "--agent", "atomaton", "--run-url", "http://example.com/run/1", "--output", join(dir, "atomaton_output.txt")],
        { cwd: dir, env: { GITHUB_REPOSITORY: "owner/repo" }, rules: [{ match: ["api", "comments"], stdout: "42" }] },
      );
      expect(r.status).toBe(0);
      const posted = r.ghCalls.find((c) => c.join(" ").includes("_run by"))?.join(" ") ?? "";
      expect(posted).toContain("This run ended without saying anything.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * The skip needs the session's own proof, not just an empty file.
   *
   * #194 was this shape: the core recorded `completed`, the last assistant message
   * was an empty string with no tool calls, and the skip fired -- deleting the
   * result comment, the `atomaton:ended` tag under it, and with them the guard
   * release, so the thread's `atomaton/in-progress` label deleted every person's
   * later comment. The file being empty proves nothing on its own.
   *
   * (Two older tests asserted a skip for "output file missing" and "output file
   * blank" with no session handed in. Both were this shape -- an empty file and
   * nothing to prove a tool call with -- and both now post; the tests below
   * carry their names.)
   */
  test("posts a no-report notice for a completed run whose last turn made no tool calls", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    writeFileSync(join(dir, "atomaton_output.txt"), "");
    writeFileSync(
      join(dir, "session.json"),
      JSON.stringify({
        messages: [
          { role: "user", content: "finish the work" },
          // The measured shape of #194: the model answered silence.
          { role: "assistant", content: "" },
        ],
      }),
    );
    try {
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        // prettier-ignore
        ["--number", "194", "--type", "issue", "--agent", "engineer", "--notify", "octocat", "--run-url", "http://example.com/run/1",
         "--session", join(dir, "session.json"), "--output", join(dir, "atomaton_output.txt")],
        { cwd: dir, env: { GITHUB_REPOSITORY: "owner/repo" }, rules: [{ match: ["api", "comments"], stdout: "42" }] },
      );
      expect(r.status).toBe(0);
      const posted = r.ghCalls.find((c) => c.join(" ").includes("_run by"))?.join(" ") ?? "";
      expect(posted, "an empty completed run still leaves its ending comment").toContain("_run by");
      expect(posted).toContain("This run ended without saying anything.");
      expect(posted).toContain("<!-- atomaton:ended=done answers=0 run=0 -->");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * #186's shape: no session file anywhere. Nothing can prove a session-ending
   * tool call spoke instead, so the run speaks -- the no-report notice.
   */
  test("posts a no-report notice when the session is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    writeFileSync(join(dir, "atomaton_output.txt"), "");
    try {
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        // prettier-ignore
        ["--number", "186", "--type", "issue", "--agent", "engineer", "--notify", "octocat", "--run-url", "http://example.com/run/1",
         "--session", join(dir, "not-there.json"), "--output", join(dir, "atomaton_output.txt")],
        { cwd: dir, env: { GITHUB_REPOSITORY: "owner/repo" }, rules: [{ match: ["api", "comments"], stdout: "42" }] },
      );
      expect(r.status).toBe(0);
      const posted = r.ghCalls.find((c) => c.join(" ").includes("_run by"))?.join(" ") ?? "";
      expect(posted, "no session to prove the skip still posts").toContain("This run ended without saying anything.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /** Unreadable JSON is as good as no session: nothing is proven either way. */
  test("posts a no-report notice when the session is not readable JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    writeFileSync(join(dir, "atomaton_output.txt"), "");
    writeFileSync(join(dir, "session.json"), "not a session at all");
    try {
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        // prettier-ignore
        ["--number", "5", "--type", "issue", "--agent", "engineer", "--run-url", "http://example.com/run/1",
         "--session", join(dir, "session.json"), "--output", join(dir, "atomaton_output.txt")],
        { cwd: dir, env: { GITHUB_REPOSITORY: "owner/repo" }, rules: [{ match: ["api", "comments"], stdout: "42" }] },
      );
      expect(r.status).toBe(0);
      const posted = r.ghCalls.find((c) => c.join(" ").includes("_run by"))?.join(" ") ?? "";
      expect(posted).toContain("This run ended without saying anything.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * The skip survives, narrowed: where the session DOES show the last assistant
   * turn making tool calls, the session-ending tool posted its own comment and a
   * second content-free one would be noise. This is the only shape that skips.
   */
  test("still skips when the session proves the last turn made tool calls", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    writeFileSync(join(dir, "atomaton_output.txt"), "");
    writeFileSync(
      join(dir, "session.json"),
      JSON.stringify({
        messages: [
          { role: "user", content: "hand this off" },
          { role: "assistant", content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "request_close_issue", arguments: "{}" } }] },
        ],
      }),
    );
    try {
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        // prettier-ignore
        ["--number", "5", "--agent", "atomaton", "--run-url", "http://example.com/run/1",
         "--session", join(dir, "session.json"), "--output", join(dir, "atomaton_output.txt")],
        { cwd: dir, rules: [{ match: ["api", "comments"] }] },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.length).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * A tool message AFTER the calls is how a real session ends that way -- the
   * result of the session-ending call, then the loop's stop. The search walks
   * back over it to the assistant turn that made the calls; this is the shape
   * the skip was written for, verified against the session as it is actually
   * written, not as the test above types it.
   */
  test("skips on the real end-of-session shape: calls, then the call's result", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    writeFileSync(join(dir, "atomaton_output.txt"), "");
    writeFileSync(
      join(dir, "session.json"),
      JSON.stringify({
        messages: [
          { role: "user", content: "hand this off" },
          { role: "assistant", content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "request_close_issue", arguments: "{}" } }] },
          { role: "tool", tool_call_id: "c1", content: "issue closed" },
        ],
      }),
    );
    try {
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        // prettier-ignore
        ["--number", "5", "--agent", "atomaton", "--run-url", "http://example.com/run/1",
         "--session", join(dir, "session.json"), "--output", join(dir, "atomaton_output.txt")],
        { cwd: dir, rules: [{ match: ["api", "comments"] }] },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.length).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * The skip, where the tool that did the talking recorded its comment: the
   * footer is appended onto THAT comment -- the one that ended the run's turn --
   * instead of a second, content-free one posted beside it. No second POST, and
   * the tokens reach the metrics report, which counts token lines off comment
   * bodies and never saw them from these runs before.
   */
  test("appends the footer onto the tool's recorded ending comment", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    try {
      writeFileSync(join(dir, "atomaton_output.txt"), "");
      writeFileSync(join(dir, "session.json"), JSON.stringify({
        messages: [
          { role: "user", content: "open the pr" },
          { role: "assistant", content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "create_pr", arguments: "{}" } }] },
          { role: "tool", tool_call_id: "c1", content: "created" },
        ],
      }));
      writeFileSync(join(dir, "ending-comment.json"), JSON.stringify({ commentId: "42", node: "5" }));
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        [
          "--number", "5", "--type", "issue", "--agent", "atomaton", "--run-url", "http://example.com/run/1",
          "--session", join(dir, "session.json"),
          "--output", join(dir, "atomaton_output.txt"),
          "--ending-comment", join(dir, "ending-comment.json"),
        ],
        {
          cwd: dir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [{ match: ["issues/comments/42"], stdout: "<!-- atomaton:ended=waiting -->\nAtomaton: PR #123 created. Running CI." }],
        },
      );
      expect(r.status).toBe(0);
      // The PATCH happened, and no second comment was posted beside it.
      expect(r.ghCalls.some((c) => c.includes("PATCH"))).toBe(true);
      expect(r.ghCalls.some((c) => c.includes("POST"))).toBe(false);
      const patched = (r.ghCalls.find((c) => c.includes("PATCH")) ?? []).join(" ");
      // The appended footer is the same one any result comment carries.
      expect(patched).toContain(
        "_run by [atomaton](http://example.com/run/1) · [metrics](https://github.com/owner/repo/blob/atomaton-data/metrics/report.md)_",
      );
      expect(patched).toContain("Atomaton: PR #123 created");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * An assistant turn whose `tool_calls` is an empty array proves nothing: a
   * call that is not a call is not a session-ending tool call, and the empty
   * output is then the run's own silence.
   */
  test("posts when the last turn's tool_calls is an empty array", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    writeFileSync(join(dir, "atomaton_output.txt"), "");
    writeFileSync(
      join(dir, "session.json"),
      JSON.stringify({
        messages: [
          { role: "assistant", content: "", tool_calls: [] },
        ],
      }),
    );
    try {
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        // prettier-ignore
        ["--number", "5", "--type", "issue", "--agent", "engineer", "--run-url", "http://example.com/run/1",
         "--session", join(dir, "session.json"), "--output", join(dir, "atomaton_output.txt")],
        { cwd: dir, env: { GITHUB_REPOSITORY: "owner/repo" }, rules: [{ match: ["api", "comments"], stdout: "42" }] },
      );
      expect(r.status).toBe(0);
      const posted = r.ghCalls.find((c) => c.join(" ").includes("_run by"))?.join(" ") ?? "";
      expect(posted).toContain("This run ended without saying anything.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * A session whose messages hold no assistant message at all -- a run cut
   * before its first turn, or a session written by something else entirely --
   * cannot prove the skip either. The run's own notice is what posts.
   */
  test("posts when the session holds no assistant message", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    writeFileSync(join(dir, "atomaton_output.txt"), "");
    writeFileSync(
      join(dir, "session.json"),
      JSON.stringify({ messages: [{ role: "user", content: "begin" }] }),
    );
    try {
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        // prettier-ignore
        ["--number", "5", "--type", "issue", "--agent", "engineer", "--run-url", "http://example.com/run/1",
         "--session", join(dir, "session.json"), "--output", join(dir, "atomaton_output.txt")],
        { cwd: dir, env: { GITHUB_REPOSITORY: "owner/repo" }, rules: [{ match: ["api", "comments"], stdout: "42" }] },
      );
      expect(r.status).toBe(0);
      const posted = r.ghCalls.find((c) => c.join(" ").includes("_run by"))?.join(" ") ?? "";
      expect(posted).toContain("This run ended without saying anything.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("posts normally when atomaton_output.txt has real content", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    writeFileSync(join(dir, "atomaton_output.txt"), "All done.");
    try {
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        ["--number", "5", "--agent", "atomaton", "--run-url", "http://example.com/run/1", "--output", join(dir, "atomaton_output.txt")],
        { cwd: dir, env: { GITHUB_REPOSITORY: "owner/repo" }, rules: [{ match: ["api", "comments"], stdout: "42" }] },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.join(" ").includes("comments"))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * The wiring, which is where this can fail invisibly: the session and the boundary
   * are already passed for the salvage, and a count taken without the boundary would
   * report the previous run's trouble under this run's comment and still look right.
   *
   * The report here says nothing about either, which is the measured normal case --
   * 30 runs carried a self-reported problem and 3 mentioned it (#940).
   */
  test("counts what the tools did to this run, out of the session it was handed", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    writeFileSync(join(dir, "atomaton_output.txt"), "Reviewed and merged PR #240.");
    writeFileSync(
      join(dir, "session.json"),
      JSON.stringify({
        messages: [
          // An earlier run's trouble, below the boundary.
          { role: "tool", tool_call_id: "old", content: "Error: ENOENT" },
          { role: "user", content: "/reviewer" },
          {
            role: "tool",
            tool_call_id: "c1",
            content: [
              "3 results",
              "--- 1 problem reported by the 'search' server, not part of the answer above ---",
              "warning: could not preload the reranker (EACCES)",
            ].join("\n"),
          },
          { role: "tool", tool_call_id: "c2", content: "Error: `curl` is blocked by denylist pattern" },
        ],
      }),
    );
    try {
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        // prettier-ignore
        ["--number", "240", "--agent", "reviewer", "--run-url", "http://example.com/run/1",
         "--session", join(dir, "session.json"), "--messages-before", "1",
         "--output", join(dir, "atomaton_output.txt")],
        { cwd: dir, env: { GITHUB_REPOSITORY: "owner/repo" }, rules: [{ match: ["api", "comments"], stdout: "42" }] },
      );
      expect(r.status).toBe(0);
      // The POST, marked by the footer line the test looks for.
      const posted = r.ghCalls.find((c) => c.join(" ").includes("_run by"))?.join(" ") ?? "";
      expect(posted).toContain("1 problem a server reported about itself (`search`)");
      expect(posted).toContain("1 refused or errored tool call");
      // Not 2: the `ENOENT` belongs to the run before this one.
      expect(posted).not.toContain("2 refused or errored tool calls");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("reads the issue's own state to decide the mention, and only for an issue run", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    writeFileSync(join(dir, "atomaton_output.txt"), "Merged and closed.");
    try {
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        // prettier-ignore
        ["--number", "5", "--type", "issue", "--agent", "engineer", "--notify", "octocat", "--reported", "true", "--run-url", "http://example.com/run/1", "--output", join(dir, "atomaton_output.txt")],
        {
          cwd: dir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            // The POST first: its body is prose, and a shorter pattern would match it
            // too -- this assertion is about what the script decided, so it has to be
            // the POST that is captured, not whichever call happened to include the
            // word.
            { match: ["comments", "POST"], stdout: "42" },
            { match: ["api", "repos/owner/repo/issues/5"], stdout: JSON.stringify({ state: "closed" }) },
            // Whether it is a sub-issue comes from GitHub's own link now, not from a
            // marker in the body. See `adapters/github/parent-issue.ts`.
            {
              match: ["graphql", "parent{number}"],
              stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: 4 } } } } }),
            },
          ],
        },
      );
      expect(r.status).toBe(0);
      const posted = r.ghCalls.find((c) => c.join(" ").includes("POST"))?.join(" ") ?? "";
      expect(posted).not.toContain("@octocat");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // A pull request run's `--number` is a PR number, and `gh issue view` on one
  // is an error rather than an answer.
  test("does not look the number up as an issue on a pull request run", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    writeFileSync(join(dir, "atomaton_output.txt"), "Reviewed.");
    try {
      const r = runWithFakeGh(
        scriptPath("post_result_comment.ts"),
        ["--number", "7", "--type", "pr", "--agent", "reviewer", "--run-url", "http://example.com/run/1", "--output", join(dir, "atomaton_output.txt")],
        { cwd: dir, env: { GITHUB_REPOSITORY: "owner/repo" }, rules: [{ match: ["api", "comments"], stdout: "42" }] },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("view"))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

/**
 * What a run that ran out of iterations leaves behind.
 *
 * Measured: 17 minutes, 154k tokens, 352 tool calls, and the thread received
 * a one-line notice saying the limit was reached. Everything the run had worked out
 * was in the session, where nobody looks.
 */
describe("salvaging a run that ended before it reported", () => {
  const write = (session: unknown): string => {
    const dir = mkdtempSync(join(tmpdir(), "salvage-"));
    const path = join(dir, "session.json");
    writeFileSync(path, JSON.stringify(session));
    return path;
  };

  test("the last thing the agent said, not the last message", () => {
    const path = write({
      messages: [
        { role: "assistant", content: "I checked config.json and found 13 keys." },
        { role: "assistant", content: "", tool_calls: [{ id: "c1" }] },
        { role: "tool", tool_call_id: "c1", content: "grep output" },
      ],
    });
    expect(lastAgentText(path, 0)).toBe("I checked config.json and found 13 keys.");
  });

  /**
   * The defect this boundary exists for, measured in production.
   *
   * A session accumulates across runs, and these models write prose exactly once, in
   * their final turn. So a run that is stopped has no assistant text of its own at
   * all, and the newest one in the session belongs to whichever earlier run finished
   * -- which the salvage then published under "this run ended before it wrote a
   * report, below is the last thing it said, from the middle of the work". Every
   * clause of that was false about the text it showed.
   */
  test("an earlier run's conclusion is not this run's fragment", () => {
    const path = write({
      messages: [
        { role: "user", content: "read src/domain" },
        { role: "assistant", content: "Done. Here is the full report on all 32 modules." },
        // This run starts here, and never says anything in words.
        { role: "user", content: "now read src/scripts" },
        { role: "assistant", content: "", tool_calls: [{ id: "c1" }] },
        { role: "tool", tool_call_id: "c1", content: "file contents" },
      ],
    });
    expect(lastAgentText(path, 2), "the previous report is out of reach").toBeUndefined();
    expect(lastAgentText(path, 0), "and reachable only by looking below the boundary").toBe(
      "Done. Here is the full report on all 32 modules.",
    );
  });

  /**
   * A boundary nobody supplied means nothing is salvaged. Showing a person less than
   * they could have had is a smaller failure than showing them an old conclusion
   * labelled as a new fragment.
   */
  test("no boundary salvages nothing", () => {
    const path = write({
      messages: [{ role: "assistant", content: "something" }],
    });
    expect(lastAgentText(path)).toBeUndefined();
    expect(lastAgentText(path, Number.NaN)).toBeUndefined();
  });

  /**
   * The common shape: the last turns of a run that ran out are tool calls with no
   * words, which is exactly why the output file was empty.
   */
  test("nothing to salvage is a real answer", () => {
    const path = write({
      messages: [
        { role: "user", content: "do the thing" },
        { role: "assistant", content: "", tool_calls: [{ id: "c1" }] },
      ],
    });
    expect(lastAgentText(path, 0)).toBeUndefined();
  });

  test("a missing or unreadable session salvages nothing rather than failing", () => {
    expect(lastAgentText(undefined, 0)).toBeUndefined();
    expect(lastAgentText("/definitely/not/here.json", 0)).toBeUndefined();
    const path = write("not a session at all");
    expect(lastAgentText(path, 0)).toBeUndefined();
  });

  /**
   * Presenting a sentence from the middle of the work as a conclusion is worse than
   * posting nothing, because a reader would act on it.
   */
  test("the comment says it is not a report", () => {
    const body = buildCommentBody({
      agent: "engineer",
      runUrl: "http://example.com/run/1",
      output: "Now checking whether auto_triggers is read anywhere.",
      salvaged: true,
    });
    expect(body).toContain("ended before it wrote a report");
    expect(body).toContain("not a conclusion");
    expect(body.indexOf("ended before it wrote a report")).toBeLessThan(body.indexOf("Now checking"));
  });

  test("an ordinary report carries no such warning", () => {
    const body = buildCommentBody({
      agent: "engineer",
      runUrl: "http://example.com/run/1",
      output: "Done.",
    });
    expect(body).not.toContain("ended before it wrote a report");
  });
});

/**
 * The skip's judge, unit-tested where the script-level tests above can only show
 * its verdict through a `gh` call count. Every direction of `false` here is a
 * comment that posts; the one `true` is the only shape that may skip.
 */
describe("endedWithToolCalls", () => {
  const write = (session: unknown): string => {
    const dir = mkdtempSync(join(tmpdir(), "ended-with-tool-calls-"));
    const path = join(dir, "session.json");
    writeFileSync(path, JSON.stringify(session));
    return path;
  };

  test("the last assistant turn carrying tool calls is the proof", () => {
    const path = write({
      messages: [
        { role: "user", content: "go" },
        { role: "assistant", content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "bash", arguments: "{}" } }] },
      ],
    });
    expect(endedWithToolCalls(path)).toBe(true);
  });

  test("the call's result after the calls does not hide the proof", () => {
    const path = write({
      messages: [
        { role: "assistant", content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "bash", arguments: "{}" } }] },
        { role: "tool", tool_call_id: "c1", content: "ok" },
      ],
    });
    expect(endedWithToolCalls(path)).toBe(true);
  });

  // The measured shape of #194: the model answered silence, the core wrote
  // `completed`, and the old skip fired on the empty output file alone.
  test("an empty final response with no calls is not the proof", () => {
    const path = write({
      messages: [
        { role: "user", content: "go" },
        { role: "assistant", content: "" },
      ],
    });
    expect(endedWithToolCalls(path)).toBe(false);
  });

  test("a final response with words and no calls is not the proof", () => {
    const path = write({
      messages: [{ role: "assistant", content: "All done." }],
    });
    expect(endedWithToolCalls(path)).toBe(false);
  });

  /** A call that is not a call: the field is there and empty. */
  test("an empty tool_calls array is not the proof", () => {
    const path = write({
      messages: [{ role: "assistant", content: "", tool_calls: [] }],
    });
    expect(endedWithToolCalls(path)).toBe(false);
  });

  test("no assistant message at all is not the proof", () => {
    const path = write({ messages: [{ role: "user", content: "begin" }] });
    expect(endedWithToolCalls(path)).toBe(false);
  });

  test("an empty session is not the proof", () => {
    const path = write({ messages: [] });
    expect(endedWithToolCalls(path)).toBe(false);
  });

  test("a missing, unreadable or unsupplied session is not the proof", () => {
    expect(endedWithToolCalls(undefined)).toBe(false);
    expect(endedWithToolCalls("/definitely/not/here.json")).toBe(false);
    expect(endedWithToolCalls(write("not a session at all"))).toBe(false);
  });

  /**
   * Earlier tool calls under a later silent turn do not make the last turn a
   * tool call. The skip is about the run's LAST act, and an older turn's calls
   * cannot vouch for what the run did after them.
   */
  test("tool calls from an earlier turn are not the proof", () => {
    const path = write({
      messages: [
        { role: "assistant", content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "bash", arguments: "{}" } }] },
        { role: "tool", tool_call_id: "c1", content: "ok" },
        { role: "assistant", content: "" },
      ],
    });
    expect(endedWithToolCalls(path)).toBe(false);
  });
});

/**
 * The no-report notice, for the silence the run itself owns: a `completed` run
 * whose last assistant message was an empty string with no tool calls (#194),
 * or whose session is missing or unreadable (#186). The old skip deleted these
 * runs' comments entirely, and with them the `atomaton:ended` tag that lets a
 * thread's guard release.
 */
describe("the no-report notice for a run whose silence is its own", () => {
  test("says the run said nothing, without the cut-short machinery around it", () => {
    const body = buildCommentBody({
      agent: "engineer",
      notify: "octocat",
      wroteNothing: true,
      runUrl: "http://example.com/run/1",
      output: "_This run ended without saying anything._",
    });
    expect(body).toContain("ended before it said anything at all");
    expect(body).toContain("saved session");
    expect(body).toContain("@octocat");
    // Not tagged as one to resume: the run was not interrupted, it ended
    // believing itself done. Resuming it would restart an agent with nothing
    // left to do; what it needs is the person the mention fetches.
    expect(body).toContain("<!-- atomaton:ended=done answers=0 run=0 -->");
    expect(body).not.toContain("/resume");
    // No cut-short warning either: nothing ran out and nothing was stopped.
    expect(body).not.toContain("⚠️");
  });
});

/**
 * The footer is the one line of every comment somebody actually reads twice, and the
 * report it links to is written on a branch nobody browses by accident.
 */
describe("the metrics link in the footer", () => {
  const base = {
    agent: "engineer",
    runUrl: "https://example.com/run",
    output: "done",
  };

  test("it points at the report on atomaton-data", () => {
    expect(buildCommentBody({ ...base, repo: "acme/widgets" })).toContain(
      "[metrics](https://github.com/acme/widgets/blob/atomaton-data/metrics/report.md)",
    );
  });

  /** A broken link in every comment is worse than no link in any of them. */
  test("an unknown repository means no link rather than a guessed one", () => {
    const body = buildCommentBody(base);
    expect(body).toContain("_run by [engineer](https://example.com/run)_");
    expect(body).not.toContain("metrics");
  });

  /**
   * The footer is one block below the mention, not two blocks with it between
   * them. It used to sit with the run link only, with the token line above the
   * mention — which made the footer two pieces to assemble and left the comment a
   * session-ending tool posted nothing to copy. One block is what the appended
   * footer (`appendFooter`) and this one are made of, from one function.
   */
  test("one block, below the mention, carrying the token line with it", () => {
    const body = buildCommentBody({
      ...base,
      tokenLine: "_Tokens: 100 total (90 prompt + 10 completion)_",
    });
    expect(body.indexOf("@octocat")).toBeLessThan(body.indexOf("---"));
    expect(body.indexOf("_Tokens:")).toBeGreaterThan(body.indexOf("---"));
    expect(body.indexOf("_Tokens:")).toBeLessThan(body.indexOf("_run by"));
  });
});

describe("buildFooter", () => {
  test("assembles every piece the run knows, in one block", () => {
    const footer = buildFooter({
      agent: "engineer",
      runUrl: "https://example.com/run",
      repo: "acme/widgets",
      tokenLine: "_Tokens: 100 total (90 prompt + 10 completion)_",
      toolTrouble: "Counted from the session: 1 refused or errored tool call.",
    });
    expect(footer).toContain("_Tokens: 100 total (90 prompt + 10 completion)_");
    expect(footer).toContain(
      "_run by [engineer](https://example.com/run) · [metrics](https://github.com/acme/widgets/blob/atomaton-data/metrics/report.md)_",
    );
    expect(footer).toContain("_Counted from the session: 1 refused or errored tool call._");
  });

  test("an absent piece is an absent line, not a guess at it", () => {
    const footer = buildFooter({ agent: "engineer", runUrl: "https://example.com/run" });
    expect(footer).toContain("---");
    expect(footer).toContain("_run by [engineer](https://example.com/run)_");
    expect(footer).not.toContain("metrics");
    expect(footer).not.toContain("Tokens");
    expect(footer).not.toContain("Counted from the session");
  });
});

describe("a closing message that was not a call", () => {
  /**
   * The ending the runner refuses. It is posted so that the work in it is not lost,
   * and it says why nothing in it was made -- without that sentence a reader would
   * take the text for a hand-off that happened.
   */
  test("says the message called more than one thing, and makes the machinery's own call", () => {
    const body = buildCommentBody({
      agent: "engineer",
      notify: "octocat",
      runUrl: "http://example.com/run/1",
      output: "Done.\n\n/engineer",
      endingInvalid: true,
      // Escaped by the caller, which is what the flag means.
      escapedMentions: ["alice"],
      escapedMentionsReason: "not-a-call",
    });
    expect(body).toContain("called more than one thing");
    expect(body).toContain("none of its calls");
    // The mention is the machinery's, because the agent's calls were refused.
    expect(body).toContain("@octocat");
    // And the notice says the notification was refused rather than unknown.
    expect(body).toContain("this run's text was not a call");
    expect(body).not.toContain("could not confirm");
  });

  /**
   * The valid case that must stay quiet: the agent handed the work to a person, so
   * the machinery's "no agent will run next" would ask a second person for a turn
   * that is not theirs.
   */
  test("stays quiet when the agent called the person itself", () => {
    const body = buildCommentBody({
      agent: "engineer",
      notify: "octocat",
      runUrl: "http://example.com/run/1",
      output: "Over to you, @alice.",
      reported: true,
      agentCalledHuman: true,
    });
    expect(body).toContain("@alice");
    expect(body).not.toContain("@octocat");
    expect(body).not.toContain("No agent will be automatically executed next");
  });

  /** Nobody called and nothing following: the machinery speaks, as it always has. */
  test("speaks when the agent called nobody", () => {
    const body = buildCommentBody({
      agent: "engineer",
      notify: "octocat",
      runUrl: "http://example.com/run/1",
      output: "Done.",
      agentCalledHuman: false,
    });
    expect(body).toContain("@octocat");
  });
});

/**
 * What the comment does with the list the run was given: who a mention may notify,
 * and who a mention counts as calling.
 *
 * They were two reads of GitHub once — the escape set was the participants, the call
 * set was the participants plus `--notify` — and the gap was the worst shape this
 * machinery has: the owner's mention escaped, the machinery's own sentence suppressed
 * because the run had "called somebody", and nothing left that notified anyone. Now
 * both come out of one file, so the first time they can disagree is never.
 */
describe("post_result_comment.ts on a closing message", () => {
  const rules = [{ match: ["api", "comments"], stdout: "42" }];

  const PEOPLE = JSON.stringify({
    humans: ["owner", "octocat"],
    participants: ["owner", "octocat", "stranger"],
    notify: "owner",
  });

  function post(dir: string, args: string[]) {
    writeFileSync(join(dir, "callees.json"), PEOPLE);
    const r = runWithFakeGh(
      scriptPath("post_result_comment.ts"),
      [
        "--number", "9", "--type", "issue", "--agent", "engineer",
        "--run-url", "http://example.com/run/1",
        "--output", join(dir, "atomaton_output.txt"),
        "--people-file", join(dir, "callees.json"),
        ...args,
      ],
      { cwd: dir, env: { GITHUB_REPOSITORY: "owner/repo" }, rules },
    );
    expect(r.status, r.stderr).toBe(0);
    return r.ghCalls.find((c) => c.join(" ").includes("_run by"))?.join(" ") ?? "";
  }

  /**
   * `resolveNotify` can name the parent issue's requester or the repository owner, and
   * neither has to appear on the thread. The run was told it may call that login, so
   * calling it has to reach them — and then the machinery must not ask a second time.
   */
  test("the owner it was told to call is neither escaped nor asked again", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    try {
      writeFileSync(join(dir, "atomaton_output.txt"), "Over to you, @owner.\n");
      const body = post(dir, ["--notify", "owner"]);
      expect(body, "the owner is callable even when the thread never saw them").toContain("@owner");
      expect(body).not.toContain("`@owner`");
      expect(body).not.toContain("No agent will be automatically executed next");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * Refused calls: the text is kept, every mention in it is left as text, and the
   * machinery makes the one call it still can. Without the warning a reader would take
   * the `/engineer` line for a hand-off that happened.
   */
  test("a refused message keeps its text, makes no calls, and says so", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    try {
      writeFileSync(join(dir, "atomaton_output.txt"), "Done.\n\n/engineer\n\n@stranger, your call.\n");
      const body = post(dir, ["--notify", "owner", "--ending-invalid", "true"]);
      expect(body).toContain("`@stranger`");
      expect(body).toContain("called more than one thing");
      expect(body).toContain("@owner");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /**
   * The owner is in the call list, so a refused message that ends `@owner` was the one
   * case where the escape list and the call list could disagree and let a live mention
   * through: "none of its calls was made" would be false, and the owner would be told
   * "your turn" by the text while the sentence under it says nothing is running.
   */
  test("a refused message escapes even the owner it would have been allowed to call", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-post-result-"));
    try {
      writeFileSync(join(dir, "atomaton_output.txt"), "Done.\n\n/engineer\n\n@owner, your call.\n");
      const body = post(dir, ["--notify", "owner", "--reported", "true", "--ending-invalid", "true"]);
      expect(body).toContain("`@owner`");
      expect(body).toContain("called more than one thing");
      // The machinery's own sentence still reaches them: the turn comes back to a
      // person, it is only the refused text's own call that is not made.
      expect(body).toContain("No agent will be automatically executed next");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
