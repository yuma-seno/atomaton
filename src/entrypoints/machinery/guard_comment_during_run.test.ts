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
            ...thread("", ["/engineer"]),
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
          rules: thread("", ["/engineer"]),
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
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE"))).toBe(false);
      // The guard reads comments alone: the body read it used to make is gone.
      expect(r.ghCalls.some((c) => c.includes("--jq"))).toBe(false);
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
        ["--number", "9", "--comment-id", "101", "--commenter", "octocat"],
        {
          cwd: configDir,
          env: { GITHUB_REPOSITORY: "owner/repo" },
          rules: [
            ...threadAs([
              ["/engineer", true],
              ["just a remark", true],
            ]),
            readBack(101, "just a remark"),
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE") && c.join(" ").includes("comments/101"))).toBe(true);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  // A pull request body naming a reviewer is a request the validation dispatch is
  // already handling. The guard reads comments alone — it does not read the body at
  // all — so it does not delete a person's comment on the strength of it, which would
  // tell them to wait for a run their comment was not racing.
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
            ...thread("", ["/engineer"]),
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
            ...thread("", ["/engineer"]),
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
            ...thread("", ["/engineer"]),
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
            ...thread("", ["/engineer"]),
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
            ...thread("", ["/engineer"]),
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
            ...thread("", ["/engineer"]),
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
