/**
 * request-close-issue-aggregation.e2e.test.ts — the branch the other close test does
 * not reach, which is the one where aggregation runs.
 *
 * ## Why this file exists
 *
 * `request-close-issue.e2e.test.ts` covers the human-authored branch, and its own header
 * says so: on that path `concludeIssue` comments and returns `close-requested`, and
 * `dispatchOrchestratorIfSubIssueReady` is never called. Aggregation runs **only** on the
 * bot-authored branch.
 *
 * That gap is not theoretical. The aggregation marker was written with
 * `gh issue comment ... --jq .id` for a release — a call the real `gh` refuses, so the
 * marker was never written and parents stopped being aggregated (#143). Nothing failed:
 * the unit tests had a fake `gh` that answered any argv, and the e2e suite had no test
 * that walked this branch, so the one layer that could have seen it had nothing to look
 * at (#145).
 *
 * ## What this test is, and what it is not
 *
 * It is a **contract test**: the real `atoma` binary, its real inference loop and real
 * MCP client against the compiled server, with a fake `gh` standing in for the CLI.
 * What it proves is the contract on this side of that seam — that the tool is reached,
 * that `_meta.session_ends` is returned, and that the `gh` invocations carry the shape
 * the real CLI accepts.
 *
 * It is NOT an end-to-end test in the sense of Issue → comment → workflow → state. The
 * fake `gh` holds no state, so ordering guarantees ("a later read sees an earlier
 * write") cannot be exercised here at all. There is no OSS substitute that would fix
 * that: `gh` reaches GitHub.com and GHES, the sub-issue link is GraphQL that Gitea does
 * not implement, and `gh`'s own client-side token checks (`uploadTokenTypes`, measured
 * in #109) refuse a token regardless of what server answers. Real acceptance is what the
 * dogfooding runs do; this covers the seam, and says so.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setupFakeGh } from "./fake-gh.ts";
import { startMockLlmServer } from "./mock-llm-server.ts";
import { atomaAvailable, posixPath, REPO_ROOT, runAtoma } from "./run-atoma.ts";

const ATOMA_MCP_SCRIPT = join(REPO_ROOT, "dist/.github/atomaton-runtime/tools/mcp/atomaton.ts");

/** The parent whose children are all done, and the child being concluded. */
const PARENT = 5;
const CHILD = 99;

describe.skipIf(!atomaAvailable)("E2E: the aggregation branch of request_close_issue", () => {
  test("a bot-authored close walks the aggregation gate, and writes its marker the way gh accepts", async () => {
    const mock = startMockLlmServer([
      { toolCalls: [{ id: "call_1", name: "request_close_issue", arguments: { reason: "All done", summary: "Shipped it." } }] },
      // A second turn, with no tool call. `request_close_issue` is session-ending only
      // on the outcomes that `needsAttention` excludes, and `dispatched` is one of
      // those -- so the run is handed one more turn and then ends. A queue of one
      // response leaves that turn unanswered, and the run fails on a 500 from the mock
      // rather than on anything this file is about.
      { content: "Done." },
    ]);

    const fakeGh = setupFakeGh([
      // ## Why every `match` here starts with `"issue"` or `"api"`
      //
      // A rule's matchers are SUBSTRINGS of any argv element, so a rule that names the
      // subcommand loosely matches calls it has nothing to do with. Both of these bit
      // this file:
      //
      //   `["issue", "close"]` matches `gh api graphql -f query=...` whenever the query
      //   text happens to contain both words — and the sibling-links query contains
      //   `issueOrPullRequest` and `includeClosedPrs`, so it did. The gate's second read
      //   was answered with the close rule's empty stdout, and the failure surfaced as
      //   "JSON Parse error: Unexpected EOF" three frames away.
      //
      //   `["graphql"]` alone matches BOTH GraphQL reads, so each was answered with the
      //   other's shape.
      //
      // Anchoring on the subcommand and on the query's own text is what keeps them
      // apart. The fake's header says the same thing: list more specific rules first.

      // concludeIssue's author read. `is_bot: true` is what routes this into the
      // aggregation branch — the whole reason this file exists.
      {
        match: ["issue", "view"],
        stdout: JSON.stringify({ author: { id: "1", is_bot: true, login: "atomaton[bot]", name: "Atomaton" } }),
      },
      // The conclusion comment and the close, both on the child.
      //
      // Anchored on `--repo`, which is what a `gh issue` subcommand carries and what no
      // `gh api` call does. Without it, `["issue", "close", "99"]` matches the marker
      // POST — whose URL is `.../issues/5/comments`, and both `issues` and `comments`
      // are substrings of `issue` and `comment`. That is the collision the fake's header
      // warns about, and it answered the marker write with this rule's empty stdout.
      { match: ["issue", "comment", "--repo", String(CHILD)] },
      { match: ["issue", "close", "--repo", String(CHILD)] },

      // --- the aggregation gate, in the order it asks ---

      // Two GraphQL reads, and they are told apart by their own query TEXT — the only
      // thing in an argv string that says what the read is for.
      //
      //   `query($owner:String!,$repo:String!,$num:Int!){repository(...){issue(number:$num){parent{number}}}}`
      //     -- `parentIssueOf`, asked about the CHILD; the answer is the parent to
      //        aggregate. Distinguished by `{parent{number}}`, which no other query
      //        contains.
      //   `query($owner:String!, $name:String!, $number:Int!, $limit:Int!, $labelLimit:Int!) ... issueOrPullRequest ... subIssues`
      //     -- `issueLinks`, asked about the PARENT; the answer is the children to count.
      //        Distinguished by `subIssues`, and by the SPACES after its commas, which
      //        the single-line query above does not have.
      //
      // A rule keyed on `["graphql"]` alone answers whichever runs first, which is how
      // this file first reported "could not read the parent of #99" and then "could not
      // read links for #5" — each read getting the other's answer.
      //
      // The child's parent is PARENT. `null` here would be a real answer — `not-tracked`
      // — and the gate would stop before writing the marker, which is the opposite of
      // what this file is testing.
      //
      // `{data: ...}`, and that is not decoration: `ghGraphqlRead` unwraps `.data`
      // itself (`adapters/github/gh.ts`), so the fake answers with the envelope `gh api`
      // really prints. A rule that returns the inner object instead fails as
      // "undefined is not an object", which reads like a broken fake rather than a
      // wrong shape.
      {
        match: ["graphql", "parent{number}"],
        stdout: JSON.stringify({ data: { repository: { issue: { parent: { number: PARENT } } } } }),
      },
      // PARENT itself, so the gate has somewhere to aggregate to. Zero sub-issues is
      // what lets it proceed to dispatch rather than answer `waiting`.
      {
        match: ["graphql", "subIssues"],
        stdout: JSON.stringify({
          data: {
            repository: {
              issueOrPullRequest: {
                __typename: "Issue",
                subIssues: { nodes: [] },
              },
            },
          },
        }),
      },
      // The marker write itself: `gh api --method POST .../issues/5/comments -f body=...
      // --jq .id`. Anchored on the AGGREGATED tag, because two different markers are
      // written to this path — this one and the dispatch marker `dispatchRunner` posts a
      // moment later — and each has its own id.
      {
        match: ["api", `issues/${PARENT}/comments`, "--method", "POST", "atomaton:aggregated"],
        stdout: "777",
      },
      // `postDispatchMarker`'s write, to the same path. Anchored on its own tag for the
      // same reason.
      {
        match: ["api", `issues/${PARENT}/comments`, "--method", "POST", "atomaton:dispatch"],
        stdout: "555",
      },
      // The parent's comments, read THREE times — the aggregation marker check, the
      // dispatch freshness probe, and `mostRecentAgentOn` — and since the comment read
      // was unified those three are ONE call: `listComments`, `--paginate`, whole
      // comment objects. So one rule answers all three and its bodies serve all three:
      // the dispatch marker names the agent, and its id 555 is the comment the probe
      // confirms GitHub's read-after-write caught up with — the gate is ordered against
      // that, so an empty listing is a refusal rather than a pass. No `atomaton:aggregated`
      // marker here, which is what makes this the "claim it" branch.
      {
        match: ["api", `issues/${PARENT}/comments`, "--paginate"],
        stdout: JSON.stringify([{ id: 555, body: "<!-- atomaton:dispatch=atomaton -->" }]),
      },
      // `resolveNotify`'s read of PARENT, which needs a user to address and gets one
      // from the repository owner fallback. `--jq` is what that read carries and what
      // no other `issues/5` read does.
      {
        match: ["api", `issues/${PARENT}`, "--jq"],
        stdout: JSON.stringify({ body: "no tag", login: "owner", type: "User", is_pr: false, state: "open" }),
      },
      // The dispatch itself.
      { match: ["workflow", "run"] },
      // The refusal notice, for the branch that does not dispatch.
      { match: ["issue", "comment", "--repo", String(PARENT)] },
      // Taking a marker back when the dispatch did not go out. Answered so that failure
      // does not also surface as an unmatched call — the assertions below decide whether
      // the take-back should have happened at all.
      { match: ["api", "--method", "DELETE"] },
      // `readTargetState`'s read: `gh api repos/owner/repo/issues/5`, bare. `dispatchRunner`
      // refuses to start an agent on anything it cannot confirm is open, and this is the
      // answer that lets it.
      //
      // **Last of the `issues/5` rules, by necessity.** Its argv carries nothing that
      // distinguishes it — no `--jq`, no `--paginate`, no `--method` — so it can only be
      // reached by being the rule nothing more specific matched first. Its path is a
      // PREFIX of `/comments`, so placed earlier it answers the reads above with a state
      // object where an agent name or a comment id belongs.
      {
        match: ["api", `repos/owner/repo/issues/${PARENT}`],
        stdout: JSON.stringify({ state: "open" }),
      },
    ]);

    const dir = mkdtempSync(join(tmpdir(), "atomaton-e2e-agg-"));
    try {
      writeFileSync(
        join(dir, "agent.md"),
        `---
name: e2e-test-orchestrator
description: Minimal orchestrator agent for E2E testing.
model: test-model
provider: openai
mcp_servers: ["atomaton"]
---
You are a test orchestrator agent.
`,
      );
      writeFileSync(
        join(dir, "tools.yaml"),
        `atomaton:
  unprefixed: true
  command: bun
  args: ["run", "${posixPath(ATOMA_MCP_SCRIPT)}"]
`,
      );
      writeFileSync(join(dir, "prompt.txt"), "Please conclude this issue.");

      const { exitCode, stderr } = await runAtoma({
        agentDefPath: join(dir, "agent.md"),
        toolsFilePath: join(dir, "tools.yaml"),
        promptFilePath: join(dir, "prompt.txt"),
        outSessionPath: join(dir, "session.json"),
        env: {
          ...fakeGh.env,
          GITHUB_REPOSITORY: "owner/repo",
          NUMBER: String(CHILD),
          TYPE: "issue",
          GITHUB_EVENT_NAME: "issues",
          OPENAI_BASE_URL: mock.url,
          OPENAI_API_KEY: "dummy-test-key",
          ATOMA_PROVIDER: "openai",
        },
      });

      if (exitCode !== 0) console.error("atoma stderr:", stderr);
      expect(exitCode).toBe(0);

      const calls = fakeGh.calls();

      // Dumped on failure, because the echo of what the gate decided lives in the
      // server's stderr and a bare "no marker" says nothing about why. Cheap, and it
      // only prints when something is already wrong.
      const why = () => `gh calls:\n${calls.map((c) => `  gh ${c.join(" ")}`).join("\n")}\natoma stderr:\n${stderr}`;
      console.error(`DIAG: ${why()}`);

      // --- the branch was reached at all ---
      const closed = calls.find((c) => c[0] === "issue" && c[1] === "close");

      // --- the marker, and the shape of the call that writes it ---
      //
      // This is the assertion that would have caught #143. The marker must be written
      // through `gh api --method POST`, because `gh issue comment` has no `--jq` and
      // exits before posting — which is how the marker came to be missing from every
      // parent whose children finished.
      //
      // The fake `gh` refuses a flag a subcommand does not accept, so a regression here
      // fails twice: once on the missing marker below, and once because the fake exits 1
      // on the unknown flag. Both are wanted; the second is what makes the failure say
      // `unknown flag: --jq` rather than "no marker".
      const marker = calls.find((c) => c.some((a) => a.includes("atomaton:aggregated")));
      expect(marker, why()).toBeDefined();
      expect(marker?.join(" "), "the marker goes through gh api, not gh issue comment").toContain("api");
      expect(marker?.join(" "), "and POSTs a body").toContain("--method");
      expect(marker?.join(" "), "asking for the id, so a failed dispatch can take it back").toContain("--jq");

      // `gh issue comment` must NOT be carrying a `--jq`: that is the exact defect.
      for (const call of calls.filter((c) => c[0] === "issue" && c[1] === "comment")) {
        expect(call.join(" "), "gh issue comment has no --jq flag").not.toContain("--jq");
      }

      // The marker names the child that completed, so a second close of the same
      // completion is recognised as `already-aggregated`.
      expect(marker?.join(" ")).toContain(`atomaton:aggregated=${CHILD}`);

      // --- and the run continued into the dispatch ---
      expect(
        calls.some((c) => c[0] === "workflow" && c[1] === "run"),
        "the parent's agent is re-invoked once the marker is written",
      ).toBe(true);

      // --- what the agent is told ---
      const session = JSON.parse(readFileSync(join(dir, "session.json"), "utf8")) as {
        messages: { role: string; content: string }[];
      };
      const toolMessage = session.messages.find((m) => m.role === "tool");
      // `dispatched` is not a `needsAttention` outcome, so the session ends and the
      // agent is told there is nothing left. The opposite branch — where something
      // needs a person — is the one whose wording was wrong (#143), and it is a unit
      // test's subject rather than this one's.
      expect(toolMessage?.content).toContain("is concluded");
      expect(toolMessage?.content).toContain("Nothing else is yours to do here");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
