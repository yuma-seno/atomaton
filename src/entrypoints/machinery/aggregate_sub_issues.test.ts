import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { hermeticEnv, makeConfigDir, runWithFakeGh, scriptPath } from "./testing/harness.ts";
import { subIssueReportBody } from "../../adapters/github/sub-issue-report.ts";

describe("aggregate_sub_issues.ts", () => {
  test("posts a progress comment and returns early when siblings remain open", () => {
    // Needs BOTH a real git repo (the gitRun("config", ...) calls at the top
    // of main() need one) AND a .github/atomaton/config.yaml (the nested
    // check_open_siblings.ts call inherits this same cwd and reads config.yaml
    // via getLabel()) in the SAME directory.
    const dir = makeConfigDir({});
    spawnSync("git", ["init"], { cwd: dir, env: hermeticEnv() });
    try {
      const r = runWithFakeGh(
        scriptPath("aggregate_sub_issues.ts"),
        ["--repo", "owner/repo", "--parent", "5", "--closed-num", "9"],
        {
          cwd: dir,
          // The siblings come from GitHub's own sub-issue links now, with their
          // labels in the same request. See `adapters/github/parent-issue.ts`.
          //
          // "Launched" is read from each child's thread now, not the
          // `atomaton/launched` label, so child #1 needs a comment read answered.
          rules: [
            {
              match: ["graphql"],
              stdout: JSON.stringify({
                data: {
                  repository: {
                    issueOrPullRequest: {
                      __typename: "Issue",
                      subIssues: {
                        nodes: [
                          {
                            number: 1,
                            title: "#1",
                            state: "OPEN",
                            labels: { nodes: [{ name: "atomaton/sub-issue" }] },
                          },
                        ],
                      },
                    },
                  },
                },
              }),
            },
            {
              match: ["api", "issues/1/comments"],
              stdout: JSON.stringify([{ id: 1, body: "<!-- atomaton:dispatch=engineer -->", user: { type: "Bot" } }]),
            },
          ],
        },
      );
      expect(r.status).toBe(0);
      // stderr, not stdout: every diagnostic in this script goes to stderr so
      // that stdout stays free for data a caller may consume.
      // The property, not the wording. This used to pin the exact sentence "Not all
      // sub-tasks done yet", which said nothing about how many remained -- the gate
      // now reports the count, and a test that pins prose blocks that kind of
      // improvement while catching none of the defects that matter.
      expect(r.stderr).toContain("1 sibling(s)");
      expect(r.stderr).toContain("No action needed");
      const commentCall = r.ghCalls.find((c) => c.includes("comment"));
      expect(commentCall?.join(" ")).toContain("atomaton:sub-result=9");
      // The full aggregation path (siblingCount === 0) is not covered here. It posts
      // the `atomaton:aggregated` marker and starts a run, so a fixture for it has to
      // answer the comment POST, the dispatch and its marker read -- and since this
      // script no longer writes the parent's session (#149) there is nothing about it
      // that this early-return path leaves untested.
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("edits the child's report instead of posting a second comment when the report is there", () => {
    // The case the merge exists for: the child's closing run has already posted its
    // report on the parent's thread, so the "still in progress" line is edited into it.
    // One completion, one comment -- and an edit notifies nobody, where a second comment
    // would notify everyone watching.
    const dir = makeConfigDir({});
    spawnSync("git", ["init"], { cwd: dir, env: hermeticEnv() });
    try {
      const r = runWithFakeGh(
        scriptPath("aggregate_sub_issues.ts"),
        ["--repo", "owner/repo", "--parent", "5", "--closed-num", "9"],
        {
          cwd: dir,
          rules: [
            {
              match: ["api", "issues/5/comments"],
              stdout: JSON.stringify([
                {
                  id: 88,
                  user: { type: "Bot" },
                  body: subIssueReportBody({ child: 9, report: "It landed in #34.", pullRequests: [] }),
                },
              ]),
            },
            { match: ["--method", "PATCH"], stdout: "{}" },
            {
              match: ["graphql"],
              stdout: JSON.stringify({
                data: {
                  repository: {
                    issueOrPullRequest: {
                      __typename: "Issue",
                      subIssues: {
                        nodes: [
                          {
                            number: 1,
                            title: "#1",
                            state: "OPEN",
                            labels: { nodes: [{ name: "atomaton/sub-issue" }] },
                          },
                        ],
                      },
                    },
                  },
                },
              }),
            },
            {
              match: ["api", "issues/1/comments"],
              stdout: JSON.stringify([{ id: 1, body: "<!-- atomaton:dispatch=engineer -->", user: { type: "Bot" } }]),
            },
          ],
        },
      );

      expect(r.status).toBe(0);
      expect(r.stderr).toContain("1 sibling(s)");

      const patches = r.ghCalls.filter((c) => c.includes("PATCH"));
      expect(patches.length).toBe(1);
      expect(patches[0]?.join(" ")).toContain("repos/owner/repo/issues/comments/88");
      const body = patches[0]?.find((a) => a.startsWith("body=")) ?? "";
      expect(body).toContain("It landed in #34.");
      expect(body).toContain("1 sub-task(s) still in progress.");
      // What the fallback comment used to be, and what must not be posted beside the
      // report: a comment on the parent.
      expect(r.ghCalls.filter((c) => c.slice(0, 2).join(" ") === "issue comment").length).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
