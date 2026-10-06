import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { makeConfigDir, runWithFakeGh, scriptPath } from "./testing/harness.ts";

/**
 * The thread the guard reads, as the fake `gh` returns it.
 *
 * The guard asks for the node's body and its comments, then folds them into "whose
 * turn is it". These rules answer those two reads; the fold itself is tested in
 * `domain/work/thread.test.ts`.
 */
const thread = (body: string, comments: string[]) => [
  { match: ["api", "/issues/9", "--jq"], stdout: body },
  { match: ["api", "/issues/9/comments"], stdout: JSON.stringify(comments.map((b, i) => ({ id: 100 + i, body: b }))) },
];

describe("guard_comment_during_run.ts", () => {
  // The window this exists to close: a person asked for an agent, and before the
  // runner started another person commented. The ball is still the agent's.
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
            { match: ["api", "DELETE"] },
            { match: ["issue", "comment"] },
          ],
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("DELETE") && c.join(" ").includes("comments/123"))).toBe(true);
      const commentCall = r.ghCalls.find((c) => c.includes("comment"));
      expect(commentCall?.join(" ")).toContain("@octocat");
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

  // The comment being judged is excluded, so a person's own `/engineer` does not
  // count as the node already being the agent's -- which would block the very
  // command that is starting a run.
  test("does not count the comment being judged as a request", () => {
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

  // A pull request body naming a reviewer is a request the validation dispatch is
  // already handling. The guard reads comments alone, so it does not delete a
  // person's comment on the strength of it -- which would tell them to wait for a run
  // their comment was not racing.
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
});
