import { describe, expect, test } from "bun:test";
import {
  AGENT_ISSUE_OFF,
  duplicateIssueOf,
  filedFromLine,
  normaliseIssueTitle,
  resolveAgentIssueLauncher,
} from "./filed-issue.ts";

describe("agents.on_agent_issue", () => {
  test("a name is the agent to start", () => {
    expect(resolveAgentIssueLauncher("atomaton")).toEqual({ agent: "atomaton" });
    expect(resolveAgentIssueLauncher("  engineer ")).toEqual({ agent: "engineer" });
  });

  test("off starts nobody, and is not a problem", () => {
    expect(resolveAgentIssueLauncher(AGENT_ISSUE_OFF)).toEqual({ agent: "" });
  });

  // Required by the pull request's own check, so reaching the runtime without it means
  // the config was changed outside one. There is nothing to start and nothing to
  // report: a filed issue is still a real report.
  test("an absent or empty value starts nobody and says nothing", () => {
    expect(resolveAgentIssueLauncher(undefined)).toEqual({ agent: "" });
    expect(resolveAgentIssueLauncher("   ")).toEqual({ agent: "" });
    expect(resolveAgentIssueLauncher(7)).toEqual({ agent: "" });
  });

  // Dispatched as-is it would be `gh workflow run --field agent=<typo>`, which GitHub
  // accepts and which starts a run that aborts on a missing definition.
  test("a value that is not a name starts nobody and says why", () => {
    const setting = resolveAgentIssueLauncher("Engineer");
    expect(setting.agent).toBe("");
    expect(setting.problem).toContain("agents.on_agent_issue");
    expect(setting.problem).toContain("`off`");
  });
});

describe("normaliseIssueTitle", () => {
  // Case and white space only. Punctuation and wording are the reporter's, and a
  // comparison cleverer than this starts refusing genuinely different reports.
  test("folds case and runs of white space", () => {
    expect(normaliseIssueTitle("  The  Search \t  Server  ")).toBe("the search server");
  });

  test("leaves punctuation alone, so two different reports stay different", () => {
    expect(normaliseIssueTitle("Bug: search (tool)")).not.toBe(normaliseIssueTitle("Bug: search tool"));
  });
});

describe("duplicateIssueOf", () => {
  const open = [
    { number: 12, title: "Search server reports no results" },
    { number: 40, title: "An unrelated report" },
  ];

  test("finds the open issue carrying the same title", () => {
    expect(duplicateIssueOf("search   SERVER reports no results", open)).toBe(12);
  });

  test("answers 0 for none", () => {
    expect(duplicateIssueOf("A defect nobody filed yet", open)).toBe(0);
  });

  // An empty title matches nothing rather than everything: the normalised form of every
  // blank string is the same blank string, and a caller that passed one would otherwise
  // be pointed at whichever open issue came first.
  test("an empty title duplicates nothing", () => {
    expect(duplicateIssueOf("   ", open)).toBe(0);
  });
});

describe("filedFromLine", () => {
  test("names the node, the agent and the run", () => {
    expect(filedFromLine({ node: 644, agent: "reviewer", runUrl: "https://example.test/runs/1" })).toBe(
      "Filed from #644 by `reviewer` (https://example.test/runs/1).",
    );
  });

  test("says only what it knows", () => {
    expect(filedFromLine({ node: 644 })).toBe("Filed from #644.");
    expect(filedFromLine({ runUrl: "https://example.test/runs/1" })).toBe("Filed from a run (https://example.test/runs/1).");
  });

  // A git hook or a hand-run script has neither, and a sentence saying "Filed from ."
  // is worse than no sentence.
  test("says nothing when nothing is known", () => {
    expect(filedFromLine({})).toBe("");
  });
});
