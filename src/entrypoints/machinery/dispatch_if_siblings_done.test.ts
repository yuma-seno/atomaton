import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { makeConfigDir, runWithFakeGh, scriptPath, type FakeGhRule } from "./testing/harness.ts";

/**
 * The sub-issue links, which is where siblings come from now. `atomaton:parent=N
 * in:body` and the tag behind it are gone -- see `adapters/github/parent-issue.ts`.
 *
 * "Launched" is read from each child's thread now, not the `atomaton/launched` label,
 * so every child also needs a comment read answered. These children are launched.
 */
const subIssues = (...numbers: number[]): FakeGhRule[] => [
  {
    match: ["graphql"],
    stdout: JSON.stringify({
      data: {
        repository: {
          issueOrPullRequest: {
            __typename: "Issue",
            subIssues: {
              nodes: numbers.map((number) => ({
                number,
                title: `#`,
                state: "OPEN",
                labels: { nodes: [{ name: "atomaton/sub-issue" }] },
              })),
            },
          },
        },
      },
    }),
  },
  ...numbers.map((number): FakeGhRule => ({
    match: ["api", `issues/${number}/comments`],
    stdout: JSON.stringify([{ id: 1, body: "<!-- atomaton:dispatch=engineer -->", user: { type: "Bot" } }]),
  })),
];

describe("dispatch_if_siblings_done.ts", () => {
  test("dispatches the atomaton once all siblings are done", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("dispatch_if_siblings_done.ts"),
        ["--repo", "owner/repo", "--parent", "5", "--closed-num", "9"],
        {
          cwd: configDir,
          rules: [
            ...subIssues(),
            // The dispatch marker and the aggregation marker, then the thread read that
            // follows. Every write goes through `gh api --method POST .../comments`, so
            // each POST rule is keyed on the BODY it carries -- `atomaton:dispatch` here,
            // `atomaton:aggregated` below. A rule matching only the path and method
            // answers whichever write runs first, and did.
            //
            // The read rules carry `--paginate` (the thread listing, made by
            // `checkDispatchMarker`) or `[.[].body]` (the bodies-only read made by
            // `mostRecentAgentOn`); the writes carry neither, which is what tells the
            // three apart on one path.
            { match: ["api", "issues/5/comments", "--method", "POST", "atomaton:dispatch"], stdout: "555" },
            { match: ["api", "issues/5/comments", "--method", "POST", "atomaton:aggregated"], stdout: "556" },
            // `[.[].body]` BEFORE the plain `--paginate` rule, because both reads carry
            // `--paginate` and only this one carries the jq expression. Listing the
            // broader rule first answers the bodies read with comment OBJECTS where the
            // code expects strings, and the agent name comes out empty.
            { match: ["api", "issues/5/comments", "[.[].body]"], stdout: JSON.stringify(["<!-- atomaton:dispatch=atomaton -->"]) },
            { match: ["api", "issues/5/comments", "--paginate"], stdout: JSON.stringify([{ id: 555, body: "<!-- atomaton:dispatch=atomaton -->" }]) },
            { match: ["api", "comments", "--paginate", ".[].body"], stdout: JSON.stringify([]) },
            { match: ["workflow", "run"] },
            // The parent's state. `dispatchRunner` refuses to start an agent on
            // anything it cannot confirm is open, so the happy path has to say so.
            { match: ["api", "issues"], stdout: JSON.stringify({ state: "open" }) },
          ],
        },
      );
      expect(r.status).toBe(0);
      // The aggregation marker, written as a body on the parent. Asserted on the body
      // rather than on a `comment` argv element: the write is `api .../comments
      // -f body=...` now, which is the only form that returns the new comment's id.
      expect(
        r.ghCalls.some((c) => c.some((a) => a.includes("atomaton:aggregated"))),
        "the completion must be claimed by writing the aggregation marker",
      ).toBe(true);
      expect(r.ghCalls.some((c) => c[0] === "workflow" && c[1] === "run")).toBe(true);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("skips dispatch when the aggregation marker is already present", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("dispatch_if_siblings_done.ts"),
        ["--repo", "owner/repo", "--parent", "5", "--closed-num", "9"],
        {
          cwd: configDir,
          rules: [
            ...subIssues(),
            { match: ["api", "comments", "--jq"], stdout: JSON.stringify(["<!-- atomaton:aggregated=9 -->", "Atomaton: All sub-tasks completed."]) },
          ],
        },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("comment"))).toBe(false);
      expect(r.ghCalls.some((c) => c[0] === "workflow")).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });

  test("does nothing when siblings are still open", () => {
    const configDir = makeConfigDir({});
    try {
      const r = runWithFakeGh(
        scriptPath("dispatch_if_siblings_done.ts"),
        ["--repo", "owner/repo", "--parent", "5", "--closed-num", "9"],
        { cwd: configDir, rules: [...subIssues(1)] },
      );
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((c) => c.includes("comment"))).toBe(false);
      expect(r.ghCalls.some((c) => c[0] === "workflow")).toBe(false);
    } finally {
      rmSync(configDir, { recursive: true, force: true });
    }
  });
});
