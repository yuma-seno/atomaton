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
            // One comment per completion: the aggregation marker IS the dispatch's
            // marker and ask now, so there is one POST and it carries both tags. Its id
            // 555 is what the freshness probe looks for, and the thread read below shows
            // it — a marker the listing does not yet show is retried with backoff and
            // then stood down from, which is the dispatch's own behaviour rather than a
            // fixture property.
            //
            // The three readers of the parent's thread — the dispatch freshness probe,
            // the aggregation marker check and `mostRecentAgentOn` — are ONE call, the
            // shared `listComments`: `--paginate`, whole comment objects. So there is one
            // read rule, and its bodies serve all three.
            { match: ["api", "issues/5/comments", "--method", "POST", "atomaton:aggregated"], stdout: "556" },
            {
              match: ["api", "issues/5/comments", "--paginate"],
              stdout: JSON.stringify([
                { id: 1, body: "<!-- atomaton:dispatch=atomaton -->" },
                { id: 2, body: "<!-- atomaton:ended=waiting answers=0 run=0 -->" },
                // The marker this gate is about to write, id 556, as the freshness
                // probe must find it. Neutral: a body claiming `atomaton:aggregated`
                // would be the idempotency read answering `already-aggregated` first.
                { id: 556, body: "a comment with no tag on it" },
              ]),
            },
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
      const writes = r.ghCalls.filter(
        (c) => c.includes("api") && c.some((a) => a.includes("issues/5/comments")) && c.includes("--method"),
      );
      expect(writes, "one comment per completion: the marker is also the dispatch's ask").toHaveLength(1);
      const body = writes[0]?.find((a) => a.startsWith("body=")) ?? "";
      expect(body, "the completion must be claimed by writing the aggregation marker").toContain("atomaton:aggregated=9");
      expect(body, "and the tag that keeps it one comment").toContain("atomaton:dispatch=atomaton");
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
            // The shared read: whole comment objects, no jq projection.
            {
              match: ["api", "issues/5/comments", "--paginate"],
              stdout: JSON.stringify([
                { id: 1, body: "<!-- atomaton:aggregated=9 -->" },
                { id: 2, body: "Atomaton: All sub-tasks completed." },
              ]),
            },
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
