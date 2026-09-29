import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { makeConfigDir, runWithFakeGh, scriptPath } from "./testing/harness.ts";

/** The target's state, which `dispatchRunner` reads before starting anything. */
const open = { match: ["api", "issues"], stdout: JSON.stringify({ state: "open" }) };
const closed = { match: ["api", "issues"], stdout: JSON.stringify({ state: "closed" }) };

/**
 * The dispatch marker, and the thread read that follows it.
 *
 * `dispatchRunner` posts the marker first so the ordering check has something to be
 * ordered against, then reads the comments with the marker excluded. An empty thread
 * means no request came first, so the dispatch proceeds.
 *
 * Listed BEFORE the state rule, because the fake takes the first match and the state
 * rule's `["api", "issues"]` is a substring of these paths too.
 */
const marker = { match: ["api", "issues/12/comments", "POST"], stdout: "555" };
const noRequest = { match: ["api", "issues/12/comments"], stdout: "[]" };
const openTarget = [marker, noRequest, open];

function run(args: string[], rules: { match: string[]; stdout?: string; code?: number }[]) {
  const configDir = makeConfigDir({});
  try {
    return runWithFakeGh(scriptPath("dispatch_agent.ts"), args, { cwd: configDir, rules });
  } finally {
    rmSync(configDir, { recursive: true, force: true });
  }
}

const HANDOFF = ["--agent", "reviewer", "--number", "12", "--type", "pr", "--context", "the engineer handed off"];

/**
 * The two workflow steps this replaces wrote their own `gh workflow run
 * atomaton-runner.yml` in bash, so neither refused a closed target nor wrote an
 * ops-log entry — the guarantees `adapters/actions/dispatch.ts` exists to make unforgettable,
 * missing from the busiest hand-off in the system.
 */
describe("dispatch_agent.ts", () => {
  test("an open target is dispatched, with every field the runner takes", () => {
    const r = run(HANDOFF, [...openTarget, { match: ["workflow", "run"] }]);
    expect(r.status).toBe(0);

    const dispatch = r.ghCalls.find((call) => call[0] === "workflow") ?? [];
    expect(dispatch).toContain("atomaton-runner.yml");
    expect(dispatch.join(" ")).toContain("agent=reviewer");
    expect(dispatch.join(" ")).toContain("number=12");
    expect(dispatch.join(" ")).toContain("type=pr");
    // Sent on every path, so the input never defaults in one place and is absent in
    // another. The bash this replaces sent it on no path at all.
    expect(dispatch.join(" ")).toContain("reload_count=0");
  });

  /**
   * A node holds one turn. A request that came before this dispatch — a person's
   * command, or a marker from a dispatch that already went out — means nobody has
   * taken it up, so this would be a second run on a node that already has one.
   */
  test("a request already outstanding is refused, and the marker is removed", () => {
    const r = run(HANDOFF, [
      marker,
      { match: ["api", "issues/12/comments"], stdout: JSON.stringify([{ id: 1, body: "/engineer" }]) },
      open,
      { match: ["api", "DELETE"] },
      { match: ["workflow", "run"] },
    ]);
    expect(r.status).toBe(0);
    expect(r.ghCalls.some((call) => call[0] === "workflow")).toBe(false);
    // The marker was the second one, so it is removed rather than left saying two
    // agents were asked for.
    expect(r.ghCalls.some((call) => call.includes("DELETE") && call.join(" ").includes("comments/555"))).toBe(true);
  });

  /**
   * #827: an atomaton was dispatched onto an issue closed eighteen seconds
   * earlier, ran for five minutes and opened a pull request nobody was waiting for.
   * The step this replaces would still do that.
   */
  test("a closed target is refused, and the refusal is not a failure", () => {
    const r = run(HANDOFF, [closed, { match: ["issue", "comment"] }, { match: ["workflow", "run"] }]);

    expect(r.ghCalls.some((call) => call[0] === "workflow")).toBe(false);
    // Zero, deliberately: nothing is running and a person has been told on the target
    // itself. Failing the step would report a refusal as a broken workflow.
    expect(r.status).toBe(0);
    const notice = r.ghCalls.find((call) => call[0] === "issue" && call[1] === "comment") ?? [];
    expect(notice.join(" ")).toContain("was not started");
  });

  /** Nothing is running and nothing will retry, which is what a failing step is for. */
  test("a dispatch GitHub rejects fails the step", () => {
    const r = run(HANDOFF, [...openTarget, { match: ["workflow", "run"], code: 1, stdout: "refused" }]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("::error::");
  });

  /**
   * The name usually comes from another agent's output. The step this replaces
   * checked it against a copy of `AGENT_NAME_PATTERN` spliced into bash; the check
   * moved here so there is one of it.
   */
  describe("what it refuses to dispatch", () => {
    const cases: [string, string[]][] = [
      ["a name that is not an agent name", ["--agent", "Reviewer!", "--number", "1", "--type", "pr", "--context", "x"]],
      ["a type that is neither issue nor pr", ["--agent", "reviewer", "--number", "1", "--type", "branch", "--context", "x"]],
      ["a number that is not one", ["--agent", "reviewer", "--number", "zero", "--type", "pr", "--context", "x"]],
      ["no context for a person to read", ["--agent", "reviewer", "--number", "1", "--type", "pr"]],
    ];

    for (const [name, args] of cases) {
      test(name, () => {
        const r = run(args, [open, { match: ["workflow", "run"] }]);
        expect(r.status).toBe(1);
        expect(r.stderr).toContain("::error::");
        expect(r.ghCalls.some((call) => call[0] === "workflow")).toBe(false);
      });
    }
  });
});
