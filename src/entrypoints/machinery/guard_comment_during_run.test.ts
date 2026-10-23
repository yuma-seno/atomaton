import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { makeConfigDir, runWithFakeGh, scriptPath } from "./testing/harness.ts";

/**
 * The thread the guard reads, as the fake `gh` returns it.
 *
 * The guard reads the node's comments — never the body, which cannot race a run — and
 * folds them into "whose turn is it". The body rule stays in the fixture so that a
 * reintroduced body read either answers harmlessly or is caught by the assertions; the
 * fold itself is tested in `domain/work/thread.test.ts`.
 */
/**
 * A thread whose ball is with an agent, in the #285 wire: a claim is open. The old
 * fixture was a bare `/engineer` command, whose last event read `asked` — the event
 * rule the guard no longer uses. An unclaimed command is a run that has not started,
 * and the guard keeps a person's comment there.
 */
const OPEN_CLAIM = "<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:took=55 run=7 -->";
const thread = (body: string, comments: string[]) => [
  { match: ["api", "/issues/9", "--jq"], stdout: body },
  { match: ["api", "/issues/9/comments"], stdout: JSON.stringify(comments.map((b, i) => ({ id: 100 + i, body: b }))) },
];

/**
 * The same comment list, with each comment's author named, for the tests that need the
 * walk to know who wrote what. Ids are 100 + index, like `thread`.
 */
const threadAs = (specs: ReadonlyArray<readonly [string, boolean]>) => [
  {
    match: ["api", "/issues/9/comments"],
    stdout: JSON.stringify(
      specs.map(([body, human], i) => ({ id: 100 + i, body, user: { type: human ? "User" : "Bot" } })),
    ),
  },
];

/**
 * The one comment the guard reads back before deleting it, as
 * `gh api repos/.../issues/comments/{id} --jq .body` returns it. `--jq` is in the
 * match so the rule cannot catch the DELETE to the same id -- the fake's first
 * matching rule wins, and the DELETE carries no `--jq`.
 */
const readBack = (id: number, body: string, code = 0) => ({
  match: ["api", `issues/comments/${id}`, "--jq"],
  stdout: body,
  code,
});

/** The exact `--body` of the notice the guard posted, or "" when it posted none. */
const noticeOf = (calls: string[][]): string => {
  const call = calls.find((c) => c.includes("comment"));
  if (!call) return "";
  return call[call.indexOf("--body") + 1] ?? "";
};

describe("guard_comment_during_run.ts", () => {
  // The window this exists to close: a person asked for an agent, and before the
  // runner started another person commented. The ball is still the agent's.
  //
  // The comment being judged (123) is NOT in the listing — GitHub does not guarantee
  // read-after-write, so a comment just posted can be missing from it. The comment is
  // newer than everything the listing shows, so the fallback judges it as the latest
  // arrival over the whole listed thread.
  test("deletes the comment and notifies the commenter when the ball is with an agent", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "123", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...thread("", ["/engineer", OPEN_CLAIM]),
            readBack(123, "my careful note"),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE") && c.join(" ").includes("comments/123"))).toBe(true);
      const notice = noticeOf(r.ghCalls);
      expect(notice).toContain("@octocat");
      // The text somebody spent time writing is folded into the notice, tagged as a
      // quotation of the deleted comment. See the tests below for each half.
      expect(notice).toContain("atomaton:quotes=123");
      expect(notice).toContain("<details>");
      expect(notice).toContain("my careful note");
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("leaves the comment alone when the ball is with a person", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "123", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: thread("", []),
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE"))).toBe(false);
      expect(r.ghCalls.some((c) => c.includes("comment"))).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // A person's own `/engineer` is the request that STARTS the turn, not a comment made
  // mid-turn: in the walk it arrives while the ball is still the person's, so the
  // shaping keeps it. The old exclusion-based check answered the same thing by removing
  // the comment before folding; the walk answers it without the special case.
  test("does not delete a person's own command — it is the request that starts the turn", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "100", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: thread("", ["/engineer", OPEN_CLAIM]),
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE"))).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // The incident the walk-at-its-position rule fixes (#206): a person wrote an ordinary
  // comment while the ball was theirs, and seconds later typed `/atomaton`. Judged by
  // exclusion, the later command moved the turn first and the ordinary comment was
  // deleted for racing a run that started after it was written — and, being gone, it
  // never reached the run's context either. Judged in the walk, it arrived on a
  // person's turn and stays.
  test("keeps a comment that arrived on a person's turn, even when a command follows it", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "101", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...threadAs([
              ["<!-- atomaton:ended=done -->\nDone.", false],
              ["just a remark", true],
              ["/atomaton", true],
            ]),
            readBack(101, "just a remark"),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE"))).toBe(false);
      // The body is read to count commands (#217) — one command here, so the reason to
      // take it away never arises. It is not the thread that decides this one.
      expect(noticeOf(r.ghCalls)).toBe("");
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // The other half of the same rule: a comment that arrives while the ball IS with the
  // agent is still removed. The walk judges each comment at its own arrival — this one
  // arrives after the command, so it goes.
  test("deletes a comment that arrives while the ball is with an agent", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "102", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...threadAs([
              ["/engineer", true],
              [OPEN_CLAIM, false],
              ["just a remark", true],
            ]),
            readBack(102, "just a remark"),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE") && c.join(" ").includes("comments/102"))).toBe(true);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // #217: a comment asking for two agents starts one and silently loses the other. The
  // machinery reads the first command and takes the rest for prose, so which request won
  // is invisible on the page. Refused on a person's turn too: nothing about the turn
  // makes the second request reachable.
  test("deletes a comment carrying more than one command, and says which", () => {
    const configDir = makeConfigDir({});
    try {
      const body = "/engineer\n直してほしい\n\n/reviewer\nも見てほしい";
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "101", "--commenter", "octocat", "--parsed", "true", "--state", "open"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...threadAs([["<!-- atomaton:ended=done -->\nDone.", false]]),
            readBack(101, body),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE") && c.join(" ").includes("comments/101"))).toBe(true);
      const notice = noticeOf(r.ghCalls);
      expect(notice).toContain("more than one command");
      expect(notice).toContain("/engineer");
      expect(notice).toContain("/reviewer");
      // The text survives on the page, like the in-progress notice's does.
      expect(notice).toContain("直してほしい");
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // The strict reader, so a request written in reply to a quotation stays one request:
  // `> /engineer` is prose here, and the machinery would not act on it either.
  test("a quoted command is not a second command", () => {
    const configDir = makeConfigDir({});
    try {
      const body = "> /engineer で始めてください\n\n/reviewer";
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "101", "--commenter", "octocat", "--parsed", "true", "--state", "open"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...threadAs([["<!-- atomaton:ended=done -->\nDone.", false]]),
            readBack(101, body),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE"))).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // The parse step does not run for somebody who is not a repository member, so their
  // comment is never dispatched: deleting it and saying "it would have started the
  // first" would be a lie about a comment nobody was going to read.
  test("does not refuse two commands when the parse step never ran", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "101", "--commenter", "outsider", "--state", "open"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...threadAs([["<!-- atomaton:ended=done -->\nDone.", false]]),
            readBack(101, "/engineer\n/reviewer"),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE"))).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // A closed node's commands are the closed guard's to answer, and its answer is to keep
  // the comment: nothing is running, so the deletion costs and gains nothing.
  test("does not refuse two commands on a closed node", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "101", "--commenter", "octocat", "--parsed", "true", "--state", "closed"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...threadAs([["<!-- atomaton:ended=done -->\nDone.", false]]),
            readBack(101, "/engineer\n/reviewer"),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE"))).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // Both reasons in one notice, so the person does not split the comment, post the first
  // half, and get a second notice for the reason they could have been told now.
  test("says the ball is with an agent too when both rules hold", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "123", "--commenter", "octocat", "--parsed", "true", "--state", "open"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...threadAs([["/engineer", true], [OPEN_CLAIM, false]]),
            readBack(123, "/engineer\n/reviewer"),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE") && c.join(" ").includes("comments/123"))).toBe(true);
      const notice = noticeOf(r.ghCalls);
      expect(notice).toContain("more than one command");
      expect(notice).toContain("atomaton:quotes=123");
      expect(notice).toContain("A run also holds the turn");
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // A pull request body naming a reviewer is a request the validation dispatch is
  // already handling. The guard reads comments alone — it never reads the node's body —
  // so it does not delete a person's comment on the strength of it, which would tell
  // them to wait for a run their comment was not racing.
  test("a pull request body naming a reviewer does not block a comment", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "123", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: thread("/reviewer\n\nCloses #1", []),
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE"))).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // The notice used to name the `atomaton/in-progress` label and tell the person to
  // wait for it to come off. The decision never read the label — it reads the thread —
  // so removing the label changed nothing and the next comment was deleted the same
  // way. Observed on #17. The notice now says what the decision actually looked at.
  test("the notice says the ball is with an agent, not that a label is active", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "123", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...thread("", ["/engineer", OPEN_CLAIM]),
            readBack(123, "my careful note"),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      const notice = r.ghCalls.find((c) => c.includes("comment"))?.join(" ") ?? "";
      expect(notice).toContain("the ball is with an agent");
      expect(notice).not.toContain("label");
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // A failed read is not "the ball is with a person". The guard exists to keep a
  // comment out of a race, so an answer it could not determine must not be the one
  // that lets the comment through.
  test("fails closed when the thread cannot be read", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "123", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [{ match: ["api", "/issues/9"], code: 1 }],
        },
      );
      expect(r.status).toBe(1);
      expect(r.ghCalls.some((c) => c.includes("DELETE"))).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // The body has to be read back BEFORE the delete: afterwards the id is gone and the
  // read 404s. The content somebody spent time writing is only retrievable while the
  // comment still exists.
  test("reads the comment's body back before deleting it", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "123", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...thread("", ["/engineer", OPEN_CLAIM]),
            readBack(123, "my careful note"),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      const calls = r.ghCalls.map((c) => c.join(" "));
      const readAt = calls.findIndex((c) => c.includes("--jq") && c.includes("issues/comments/123"));
      const deleteAt = calls.findIndex((c) => c.includes("DELETE"));
      expect(readAt).toBeGreaterThanOrEqual(0);
      expect(deleteAt).toBeGreaterThan(readAt);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // The quotation is kept verbatim, and a comment that itself carries a code fence —
  // somebody's own code block, exactly the thing worth preserving — must not close the
  // fence around it: everything after would leave the block and be read as this
  // notice's speech. The fence is one run longer than the longest run in the text.
  test("the preserved body is fenced one longer than any fence inside it", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "123", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...thread("", ["/engineer", OPEN_CLAIM]),
            readBack(123, "look:\n\n```\nsome code\n```\n\ndone"),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      const notice = noticeOf(r.ghCalls);
      expect(notice).toContain("````");
      expect(notice).toContain("some code");
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // A read-back that failed is said, not papered over: presenting the notice as
  // complete when the text is gone would be the loss the notice exists to prevent,
  // wearing a message that claims otherwise. The tag is absent too — nothing was
  // preserved, so the notice is not a quotation.
  test("says the text could not be preserved when the read-back fails", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "123", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...thread("", ["/engineer", OPEN_CLAIM]),
            readBack(123, "", 1),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      const notice = noticeOf(r.ghCalls);
      expect(notice).toContain("could not be read back");
      expect(notice).not.toContain("<details>");
      expect(notice).not.toContain("atomaton:quotes=");
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // A delete that failed leaves the comment on the page: quoting it in the notice
  // would be showing it twice. The notice still goes out — it says "could not be
  // removed", which is the case it names.
  test("does not quote the body when the deletion failed", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "123", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...thread("", ["/engineer", OPEN_CLAIM]),
            readBack(123, "my careful note"),
            { match: ["api", "DELETE"], code: 1 },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      const notice = noticeOf(r.ghCalls);
      expect(notice).toContain("could not be removed");
      expect(notice).not.toContain("<details>");
      expect(notice).not.toContain("my careful note");
      expect(notice).not.toContain("atomaton:quotes=");
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // The ceiling keeps the notice under GitHub's 65,536-character limit on a comment
  // body, so a very long comment cannot turn the notice itself into the thing that
  // fails. The cut is said.
  test("truncates a body over the ceiling, and says so", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("guard_comment_during_run.ts"),
        ["--number", "9", "--comment-id", "123", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...thread("", ["/engineer", OPEN_CLAIM]),
            readBack(123, "x".repeat(30_001)),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      const notice = noticeOf(r.ghCalls);
      expect(notice).toContain("longer than 30,000 characters");
      expect(notice.length).toBeLessThan(65_536);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });
});
