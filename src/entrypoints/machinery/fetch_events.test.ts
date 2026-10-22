import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Session } from "../../domain/work/session.ts";
import { parseGithubOutput, runWithFakeGh, scriptPath } from "./testing/harness.ts";

describe("fetch_events.ts", () => {
  test("fetches issue events (body + comments) sorted by created_at", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    try {
      const outFile = join(dir, "events.json");
      const outputFile = join(dir, "out");
      writeFileSync(outputFile, "");
      const r = runWithFakeGh(
        scriptPath("fetch_events.ts"),
        ["--type", "issue", "--number", "5", "--out", outFile],
        {
          env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: outputFile },
          rules: [
            { match: ["pr", "list"], stdout: "[]" },
            {
              // More specific match listed first: "issues/5/comments" is
              // also a substring-superset of "issues/5", so it must be
              // checked before the plain issue-lookup rule below or that
              // one would win instead.
              match: ["issues/5/comments"],
              stdout: JSON.stringify([{ id: 1, body: "on it", user: { login: "bob" }, created_at: "2026-01-02T00:00:00Z" }]),
            },
            {
              match: ["issues/5"],
              stdout: JSON.stringify({
                number: 5,
                title: "Fix the bug",
                body: "Please fix it.",
                labels: [{ name: "bug" }],
                user: { login: "alice" },
                created_at: "2026-01-01T00:00:00Z",
              }),
            },
          ],
        },
      );

      expect(r.status).toBe(0);
      const events = JSON.parse(readFileSync(outFile, "utf8")) as { event_type: string; content: string }[];
      expect(events.map((e) => e.event_type)).toEqual(["issue_opened", "issue_comment"]);
      expect(events[0]?.content).toContain("Fix the bug");
      expect(events[0]?.content).toContain("**Labels:** bug");
      expect(events[1]?.content).toBe("on it");
      const out = parseGithubOutput(readFileSync(outputFile, "utf8"));
      expect(out.session_type).toBe("issue");
      expect(out.session_number).toBe("5");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // A sub-issue's run context is built from its own issue's events alone, so the
  // parent has to be ON the body event for the child to see it at all — the same
  // reason a PR body event carries `**Linked Issue:** #N`. The parent comes from
  // GitHub's native sub-issue link (`parentIssueOf`), so the fake answers the
  // GraphQL query, distinguished by `{parent{number}}`, which no other query in
  // this script contains.
  test("a sub-issue's body event names its parent", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    try {
      const outFile = join(dir, "events.json");
      const outputFile = join(dir, "out");
      writeFileSync(outputFile, "");
      const r = runWithFakeGh(
        scriptPath("fetch_events.ts"),
        ["--type", "issue", "--number", "5", "--out", outFile],
        {
          env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: outputFile },
          rules: [
            { match: ["pr", "list"], stdout: "[]" },
            { match: ["issues/5/comments"], stdout: "[]" },
            {
              match: ["graphql", "parent{number}"],
              stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: 3 } } } } }),
            },
            {
              match: ["issues/5"],
              stdout: JSON.stringify({
                number: 5,
                title: "Fix the bug",
                body: "Please fix it.",
                labels: [{ name: "bug" }],
                user: { login: "alice" },
                created_at: "2026-01-01T00:00:00Z",
              }),
            },
          ],
        },
      );

      expect(r.status).toBe(0);
      const events = JSON.parse(readFileSync(outFile, "utf8")) as { event_type: string; content: string }[];
      // Same block the PR body event arranges its metadata into: title, labels,
      // the line that says where the node sits, then the body.
      expect(events[0]?.content).toContain("Issue #5: Fix the bug\n**Labels:** bug\n**Sub-issue of:** #3\n\nPlease fix it.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a root issue carries no parent line", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    try {
      const outFile = join(dir, "events.json");
      const outputFile = join(dir, "out");
      writeFileSync(outputFile, "");
      const r = runWithFakeGh(
        scriptPath("fetch_events.ts"),
        ["--type", "issue", "--number", "5", "--out", outFile],
        {
          env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: outputFile },
          rules: [
            { match: ["pr", "list"], stdout: "[]" },
            { match: ["issues/5/comments"], stdout: "[]" },
            // `parent: null` is GitHub's answer for a root: an answer, not a failure.
            { match: ["graphql", "parent{number}"], stdout: JSON.stringify({ data: { repository: { issue: { parent: null } } } }) },
            {
              match: ["issues/5"],
              stdout: JSON.stringify({
                number: 5,
                title: "Fix the bug",
                body: "Please fix it.",
                labels: [],
                user: { login: "alice" },
                created_at: "2026-01-01T00:00:00Z",
              }),
            },
          ],
        },
      );

      expect(r.status).toBe(0);
      const events = JSON.parse(readFileSync(outFile, "utf8")) as { content: string }[];
      expect(events[0]?.content).not.toContain("Sub-issue of");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The half that keeps the line honest: a parent that could not be read is not a
  // parent that does not exist, and the line must not be added as if it were. The
  // read is enrichment, so the run still succeeds — and it says why, via
  // `parentIssueOf`'s own log, rather than quietly shipping a context with the
  // tree missing.
  test("a parent that could not be read adds no line and does not fail the run", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    try {
      const outFile = join(dir, "events.json");
      const outputFile = join(dir, "out");
      writeFileSync(outputFile, "");
      const r = runWithFakeGh(
        scriptPath("fetch_events.ts"),
        ["--type", "issue", "--number", "5", "--out", outFile],
        {
          env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: outputFile },
          rules: [
            { match: ["pr", "list"], stdout: "[]" },
            { match: ["issues/5/comments"], stdout: "[]" },
            { match: ["graphql", "parent{number}"], code: 1, stdout: "boom" },
            {
              match: ["issues/5"],
              stdout: JSON.stringify({
                number: 5,
                title: "Fix the bug",
                body: "Please fix it.",
                labels: [],
                user: { login: "alice" },
                created_at: "2026-01-01T00:00:00Z",
              }),
            },
          ],
        },
      );

      expect(r.status).toBe(0);
      const events = JSON.parse(readFileSync(outFile, "utf8")) as { content: string }[];
      expect(events[0]?.content).not.toContain("Sub-issue of");
      expect(r.stderr).toContain("[atomaton-parent] WARN");
      expect(r.stderr).toContain("could not read the parent of #5");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // Reproduces the 2026-08-17 outage: `pulls/{n}/reviews` returned 404 for every
  // pull request in the repository while every other endpoint answered normally.
  // `ghPaginated` throws on any non-zero exit, so that one endpoint took down
  // every agent run at this step -- and a pull request an agent opened was
  // therefore never reviewed.
  test("a degraded context endpoint costs context, not the run", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    try {
      const outFile = join(dir, "events.json");
      const outputFile = join(dir, "out");
      writeFileSync(outputFile, "");
      const r = runWithFakeGh(
        scriptPath("fetch_events.ts"),
        ["--type", "pr", "--number", "9", "--out", outFile],
        {
          env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: outputFile },
          rules: [
            // The endpoint that failed. 404 with a body, exactly as gh reported it.
            { match: ["pulls/9/reviews"], stdout: "gh: Not Found (HTTP 404)", code: 1 },
            // And the inline comments, to show the tolerance is not one-off.
            { match: ["pulls/9/comments"], stdout: "gh: Not Found (HTTP 404)", code: 1 },
            {
              match: ["issues/9/comments"],
              stdout: JSON.stringify([
                { id: 7, body: "please take a look", user: { login: "bob" }, created_at: "2026-01-02T00:00:00Z" },
              ]),
            },
            {
              match: ["pulls/9"],
              stdout: JSON.stringify({
                number: 9,
                title: "Add the thing",
                body: "Adds it.",
                labels: [],
                user: { login: "alice" },
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
                head: { sha: "abcdef1234567890" },
              }),
            },
          ],
        },
      );

      expect(r.status).toBe(0);
      const events = JSON.parse(readFileSync(outFile, "utf8")) as { event_type: string }[];
      // The pull request and the comment that did arrive are still there; the
      // reviews simply are not.
      expect(events.map((e) => e.event_type)).toContain("pr_opened");
      expect(events.map((e) => e.event_type)).toContain("pr_comment");
      expect(events.map((e) => e.event_type)).not.toContain("pr_review");
      // And it says so, so a human is not left guessing whose fault it was.
      expect(r.stderr).toContain("::warning::");
      expect(r.stderr).toContain("reviews on #9");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The other half of the judgement: what the run has no subject without still
  // fails, and says which call failed rather than reporting a JSON parse error
  // about the empty output of that call.
  test("a missing pull request still fails, and names the call", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    try {
      const outputFile = join(dir, "out");
      writeFileSync(outputFile, "");
      const r = runWithFakeGh(
        scriptPath("fetch_events.ts"),
        ["--type", "pr", "--number", "9", "--out", join(dir, "events.json")],
        {
          env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: outputFile },
          rules: [{ match: ["pulls/9"], stdout: "gh: Not Found (HTTP 404)", code: 1 }],
        },
      );

      expect(r.status).not.toBe(0);
      expect(r.stderr).toContain("pull request #9");
      expect(r.stderr).not.toContain("JSON");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("keeps Issue-local context when linked PR search fails", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-fetch-search-failure-"));
    const eventsFile = join(dir, "events.json");
    const outputFile = join(dir, "output.txt");
    writeFileSync(outputFile, "");

    try {
      const result = runWithFakeGh(
        scriptPath("fetch_events.ts"),
        ["--type", "issue", "--number", "5", "--out", eventsFile],
        {
          env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: outputFile },
          rules: [
            { match: ["issues/5/comments"], stdout: "[]" },
            {
              match: ["issues/5"],
              stdout: JSON.stringify({
                number: 5,
                title: "Fix the bug",
                body: "Please fix it.",
                labels: [],
                user: { login: "alice" },
                created_at: "2026-01-01T00:00:00Z",
              }),
            },
          ],
        },
      );

      expect(result.status).toBe(0);
      expect(JSON.parse(readFileSync(eventsFile, "utf8"))).toHaveLength(1);
      expect(result.stderr).toContain("Could not search linked PRs for Issue #5");
      expect(parseGithubOutput(readFileSync(outputFile, "utf8"))).toMatchObject({ session_type: "issue", session_number: "5" });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // Two whole runs of the script, each making a dozen or so `gh` calls, and every one
  // of those spawns the fake as its own process. Bun`s default 5s is not enough for
  // that on a cold Windows spawn -- and until the fake was actually reachable this
  // test never got far enough to find out.
  test("Issue and linked PR runs produce the same serial context and canonical key", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-fetch-linked-"));
    const issueEventsFile = join(dir, "issue-events.json");
    const prEventsFile = join(dir, "pr-events.json");
    const issueOutput = join(dir, "issue-output.txt");
    const prOutput = join(dir, "pr-output.txt");
    writeFileSync(issueOutput, "");
    writeFileSync(prOutput, "");
    const rules = [
      { match: ["pr", "list"], stdout: JSON.stringify([{ number: 10 }, { number: 11 }]) },
      { match: ["pulls/10", "application/vnd.github.v3.diff"], stdout: "diff --git a/a b/a\n+change" },
      { match: ["pulls/10/comments"], stdout: JSON.stringify([{ id: 1002, path: "a", line: 1, original_line: 1, body: "inline", user: { login: "carol" }, created_at: "2026-01-04T00:00:00Z" }]) },
      { match: ["pulls/10/reviews"], stdout: JSON.stringify([{ id: 1001, body: "looks good", state: "APPROVED", user: { login: "bob" }, submitted_at: "2026-01-03T00:00:00Z" }]) },
      { match: ["issues/10/comments"], stdout: JSON.stringify([{ id: 1000, body: "PR discussion", user: { login: "alice" }, created_at: "2026-01-02T12:00:00Z" }]) },
      {
        match: ["pulls/10"],
        stdout: JSON.stringify({
          number: 10,
          title: "Implement fix",
          body: "<!-- atomaton:parent-issue=5 -->\nCloses #5",
          user: { login: "engineer" },
          created_at: "2026-01-02T00:00:00Z",
          updated_at: "2026-01-02T06:00:00Z",
          labels: [],
          head: { sha: "1234567890" },
        }),
      },
      { match: ["pulls/11", "application/vnd.github.v3.diff"], stdout: "" },
      { match: ["pulls/11/comments"], stdout: "[]" },
      { match: ["pulls/11/reviews"], stdout: "[]" },
      { match: ["issues/11/comments"], stdout: "[]" },
      {
        match: ["pulls/11"],
        stdout: JSON.stringify({
          number: 11,
          title: "Follow-up fix",
          body: "<!-- atomaton:parent-issue=5 -->\nFollow-up",
          user: { login: "engineer" },
          created_at: "2026-01-05T00:00:00Z",
          updated_at: "2026-01-05T01:00:00Z",
          labels: [],
          head: { sha: "abcdefghij" },
        }),
      },
      { match: ["issues/5/comments"], stdout: JSON.stringify([{ id: 500, body: "Issue discussion", user: { login: "alice" }, created_at: "2026-01-01T12:00:00Z" }]) },
      {
        match: ["issues/5"],
        stdout: JSON.stringify({
          number: 5,
          title: "Fix the bug",
          body: "Please fix it.",
          labels: [],
          user: { login: "alice" },
          created_at: "2026-01-01T00:00:00Z",
        }),
      },
    ];

    try {
      const issueRun = runWithFakeGh(
        scriptPath("fetch_events.ts"),
        ["--type", "issue", "--number", "5", "--out", issueEventsFile],
        { env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: issueOutput }, rules },
      );
      const prRun = runWithFakeGh(
        scriptPath("fetch_events.ts"),
        ["--type", "pr", "--number", "10", "--out", prEventsFile],
        { env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: prOutput }, rules },
      );

      expect(issueRun.status).toBe(0);
      expect(prRun.status).toBe(0);
      expect(JSON.parse(readFileSync(issueEventsFile, "utf8"))).toEqual(JSON.parse(readFileSync(prEventsFile, "utf8")));
      expect(parseGithubOutput(readFileSync(issueOutput, "utf8"))).toMatchObject({ session_type: "issue", session_number: "5" });
      expect(parseGithubOutput(readFileSync(prOutput, "utf8"))).toMatchObject({ session_type: "issue", session_number: "5" });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
