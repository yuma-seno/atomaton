import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Session } from "../../domain/work/session.ts";
import { AGENT_TAG, DISPATCH_TAG, LLM_CONTEXT_TAG, PARENT_ISSUE_TAG } from "../../adapters/github/tags.ts";
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

  // #293. GitHub's diff endpoint was checked directly with `Accept:
  // application/vnd.github.v3.diff` and returns the tag-shaped literal intact, so
  // the loss was here: every event went through `withoutTags`. What a reviewer got
  // was a test asserting `commandsIn("")`, and it reviewed a change that did not
  // exist. The tag on its own line is the worse shape -- the old code also read
  // `agent` from it and attributed the diff to an agent that never wrote it.
  test("a diff arrives byte for byte, tags and all", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    try {
      const outFile = join(dir, "events.json");
      const outputFile = join(dir, "out");
      writeFileSync(outputFile, "");
      const diff = [
        "diff --git a/comment-command.test.ts b/comment-command.test.ts",
        "--- a/comment-command.test.ts",
        "+++ b/comment-command.test.ts",
        "@@ -1,2 +1,3 @@",
        `+    expect(commandsIn(${JSON.stringify(DISPATCH_TAG.write("reviewer"))}).map((c) => c.agent)).toEqual(["reviewer"]);`,
        `+${AGENT_TAG.write("engineer")}`,
        "+    // and the fence below is a sample, not bookkeeping",
      ].join("\n");
      const sample = ["A person quoting the format:", "", "```html", LLM_CONTEXT_TAG.write("exclude"), "```", "", "This comment is conversation."].join("\n");
      const r = runWithFakeGh(
        scriptPath("fetch_events.ts"),
        ["--type", "pr", "--number", "9", "--out", outFile],
        {
          env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: outputFile },
          rules: [
            { match: ["pulls/9", "application/vnd.github.v3.diff"], stdout: diff },
            { match: ["pulls/9/reviews"], stdout: "[]" },
            { match: ["pulls/9/comments"], stdout: "[]" },
            {
              match: ["issues/9/comments"],
              stdout: JSON.stringify([
                { id: 900, body: sample, user: { login: "alice" }, created_at: "2026-01-02T00:00:00Z" },
                { id: 901, body: `${LLM_CONTEXT_TAG.write("exclude")}\ninternal note`, user: { login: "bob" }, created_at: "2026-01-03T00:00:00Z" },
              ]),
            },
            {
              match: ["pulls/9"],
              stdout: JSON.stringify({
                number: 9,
                title: "Make the guard refuse two commands",
                body: "Closes #8",
                user: { login: "engineer" },
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-02T00:00:00Z",
                labels: [],
                head: { sha: "abcd1234" },
              }),
            },
          ],
        },
      );

      expect(r.status).toBe(0);
      const events = JSON.parse(readFileSync(outFile, "utf8")) as {
        id: string | number;
        event_type: string;
        content: string;
        llm_context?: string;
        agent?: string;
      }[];
      const diffEvent = events.find((e) => e.event_type === "pr_diff");
      expect(diffEvent?.content).toContain(`commandsIn(${JSON.stringify(DISPATCH_TAG.write("reviewer"))})`);
      expect(diffEvent?.content).toContain(AGENT_TAG.write("engineer"));
      // A literal on its own line inside the change is not a record of who wrote it.
      expect(diffEvent?.agent).toBeUndefined();
      expect(diffEvent?.llm_context).toBeUndefined();

      const quoted = events.find((e) => String(e.id) === "900");
      expect(quoted?.content).toBe(sample);
      expect(quoted?.llm_context).toBeUndefined();

      const excluded = events.find((e) => String(e.id) === "901");
      expect(excluded?.llm_context).toBe("exclude");
      expect(excluded?.content).toBe("internal note");
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

  // #270: GitHub tokenizes a search, so the bare tag term matched PR #269 — its
  // body says "Version 0.21.21 — 0.21.20 is held by #263's PR" — and #269's whole
  // context joined #266's run, whose reviewer then reviewed #269. The search names
  // candidates; the tag on each candidate's body decides. The fake does not model
  // GitHub's tokenizer and answers the search with both PRs, so this passes only
  // when the candidate without the tag is confirmed away BEFORE its events are
  // fetched: under the old code PR 12's body, diff and comment entered the
  // context, and the `pulls/12` call was made.
  test("a candidate that only mentions the issue number is not a linked PR", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-fetch-mention-"));
    const eventsFile = join(dir, "events.json");
    const outputFile = join(dir, "output.txt");
    writeFileSync(outputFile, "");
    try {
      const r = runWithFakeGh(
        scriptPath("fetch_events.ts"),
        ["--type", "issue", "--number", "5", "--out", eventsFile],
        {
          env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: outputFile },
          rules: [
            // The search: PR 10 carries the tag, PR 12 only mentions "#5" in
            // prose — the shape of #269's body that started this.
            {
              match: ["pr", "list"],
              stdout: JSON.stringify([
                { number: 10, body: "<!-- atomaton:parent-issue=5 -->" },
                { number: 12, body: "Version 0.21.21 — 0.21.20 is held by #5's PR, which merges first." },
              ]),
            },
            // PR 12 has a full answer waiting, so the old code's `pulls/12`
            // call would have succeeded and its events would have entered the
            // context. The fix must never make the call. Diff and reviews
            // first: both also match the plain `pulls/12` rule below, and the
            // first rule in array order wins.
            { match: ["pulls/12", "application/vnd.github.v3.diff"], stdout: "diff --git a/wrong b/wrong\n+wrong change" },
            { match: ["pulls/12/reviews"], stdout: JSON.stringify([{ id: 1201, body: "reviewing the wrong PR", state: "APPROVED", user: { login: "bob" }, submitted_at: "2026-01-04T00:00:00Z" }]) },
            { match: ["pulls/12/comments"], stdout: JSON.stringify([{ id: 1200, path: "wrong", line: 1, original_line: 1, body: "inline on the wrong PR", user: { login: "carol" }, created_at: "2026-01-04T00:00:00Z" }]) },
            { match: ["issues/12/comments"], stdout: "[]" },
            {
              match: ["pulls/12"],
              stdout: JSON.stringify({
                number: 12,
                title: "Return closed PRs as rejections",
                body: "Version 0.21.21 — 0.21.20 is held by #5's PR, which merges first.",
                user: { login: "engineer" },
                created_at: "2026-01-04T00:00:00Z",
                updated_at: "2026-01-04T01:00:00Z",
                labels: [],
                head: { sha: "ffffffff" },
              }),
            },
            // PR 10 is the real linked PR, and it must still arrive whole.
            { match: ["pulls/10", "application/vnd.github.v3.diff"], stdout: "diff --git a/a b/a\n+the fix" },
            { match: ["pulls/10/reviews"], stdout: JSON.stringify([{ id: 1001, body: "looks good", state: "APPROVED", user: { login: "bob" }, submitted_at: "2026-01-03T00:00:00Z" }]) },
            { match: ["pulls/10/comments"], stdout: "[]" },
            { match: ["issues/10/comments"], stdout: "[]" },
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
            { match: ["issues/5/comments"], stdout: "[]" },
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
      // The candidate cut is the quoted phrase, the decision in #270: the bare
      // term also matches a PR that merely mentions the number.
      const listCall = r.ghCalls.find((argv) => argv.includes("--search"));
      const searchArg = listCall ? listCall[listCall.indexOf("--search") + 1] ?? "" : "";
      expect(searchArg).toBe(`"${PARENT_ISSUE_TAG.search(5)}" in:body`);
      // PR 10 was fetched, so the pipeline ran end to end...
      expect(r.ghCalls.some((argv) => argv.some((a) => a.includes("pulls/10")))).toBe(true);
      // ...and PR 12 was never fetched at all, let alone taken into the context.
      expect(r.ghCalls.some((argv) => argv.some((a) => a.includes("pulls/12")))).toBe(false);
      const events = JSON.parse(readFileSync(eventsFile, "utf8")) as { content: string }[];
      const context = events.map((e) => e.content).join("\n");
      expect(context).toContain("Implement fix");
      expect(context).not.toContain("held by #5's PR");
      expect(context).not.toContain("wrong change");
      expect(parseGithubOutput(readFileSync(outputFile, "utf8"))).toMatchObject({ session_type: "issue", session_number: "5" });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The confirmation reads the candidate's body, and a body can QUOTE the tag
  // inside a fenced sample -- an issue explaining the wire format, or a PR pasting
  // the marker it is discussing. A quoted example is not a link: joining that PR's
  // events to this run would be #270 with a different trigger (#293).
  test("a candidate that quotes the tag inside a fence is not a linked PR", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    try {
      const outFile = join(dir, "events.json");
      const outputFile = join(dir, "out");
      writeFileSync(outputFile, "");
      const quoted = ["The format, for reference:", "", "```html", PARENT_ISSUE_TAG.write(5), "```"].join("\n");
      const r = runWithFakeGh(
        scriptPath("fetch_events.ts"),
        ["--type", "issue", "--number", "5", "--out", outFile],
        {
          env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: outputFile },
          rules: [
            { match: ["pr", "list"], stdout: JSON.stringify([{ number: 13, body: quoted }]) },
            { match: ["issues/5/comments"], stdout: "[]" },
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
      expect(r.ghCalls.some((argv) => argv.some((a) => a.includes("pulls/13")))).toBe(false);
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
      // The search response carries the body: `linkedPrNumbers` confirms each
      // candidate's tag from it before that PR's events are fetched at all.
      {
        match: ["pr", "list"],
        stdout: JSON.stringify([
          { number: 10, body: "<!-- atomaton:parent-issue=5 -->" },
          { number: 11, body: "<!-- atomaton:parent-issue=5 -->" },
        ]),
      },
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
