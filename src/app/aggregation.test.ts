import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeConfigDir, runWithFakeGh, type FakeGhRule, importable } from "../entrypoints/machinery/testing/harness.ts";
import { describeGateResult, type DispatchGateResult } from "./aggregation.ts";

const LIB_DIR = import.meta.dir;

/**
 * Run the gate against a faked `gh` and report what it decided and what it did.
 *
 * The subprocess is not optional: mutating PATH and calling a `gh`-shelling
 * function in the long-lived bun:test process has given wrong results before.
 * See this file's sibling, `lib.test.ts`, for the same harness and the same rule.
 */
function runGate(rules: FakeGhRule[]): { kind: string; ghCalls: string[][]; stderr: string } {
  return runGateDetailed(rules);
}

/**
 * The same run, keeping the field this file mostly calls `kind` out of its other name.
 *
 * `dispatchOrchestratorIfReady` returns a `DispatchGateResult` whose discriminant is
 * `kind`; the shim prints it, and `runGate` calls the printed value `kind` because that
 * is what every test asserts against. Named twice because the closed-parent test reads
 * a call log AND an outcome, and calling both `kind` there would be one name for two
 * things.
 */
function runGateDetailed(rules: FakeGhRule[]): { outcome: string; kind: string; ghCalls: string[][]; stderr: string } {
  const configDir = makeConfigDir({});
  const dir = mkdtempSync(join(tmpdir(), "atomaton-gate-"));
  const file = join(dir, "shim.ts");
  writeFileSync(
    file,
    `import { dispatchOrchestratorIfReady } from "${importable(join(LIB_DIR, "aggregation.ts"))}";
const result = await dispatchOrchestratorIfReady({ repo: "owner/repo", parent: 5, closedNum: 10 });
console.log(result.kind);
`,
  );
  try {
    const r = runWithFakeGh(file, [], { cwd: configDir, rules });
    const kind = r.stdout.trim().split("\n").pop() ?? "";
    return { outcome: kind, kind, ghCalls: r.ghCalls, stderr: r.stderr };
  } finally {
    rmSync(configDir, { recursive: true, force: true });
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Did the gate start the atomaton? That is a `workflow run` dispatch. */
const dispatched = (calls: string[][]) => calls.some((c) => c.includes("workflow") && c.includes("run"));

/** Did it claim the completion by writing the idempotency marker? */
const wroteMarker = (calls: string[][]) =>
  calls.some(
    (c) =>
      c.includes("api") &&
      c.some((a) => a.includes("issues/5/comments")) &&
      c.some((a) => a.includes("atomaton:aggregated")),
  );

/**
 * The sub-issue links, which is where siblings come from now -- `atomaton:parent=N
 * in:body` and the tag behind it are gone. See `adapters/github/parent-issue.ts`.
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

const NO_SIBLINGS: FakeGhRule[] = subIssues();

/**
 * A thread fixture in the shape the API returns and `listComments` reads: whole
 * comment objects, ids in order.
 *
 * Three readers ask the PARENT's thread a question — the dispatch freshness probe
 * (`checkDispatchMarker`), the aggregation marker check, and `mostRecentAgentOn` — and
 * since the comment read was unified they are one call: `gh api
 * .../issues/5/comments --paginate`. Rules are first-match, so the first comment-read
 * rule a test lists answers all three, and its bodies have to serve all three.
 *
 * `firstId` starts at the id the fake gives the aggregation marker's own write (777 is
 * `MARKER_ID`, added at the end of every list): the freshness probe looks for THAT id,
 * and a thread that must let a dispatch through has to show it. That the marker is
 * already in the listing models the read-after-write lag resolved, and it keeps the
 * fixture independent of how many reads the gate makes before its write.
 *
 * The `match` carries `--paginate`, never the path alone: the marker WRITE goes to the
 * same path without it, and a rule that answered the POST handed back a comment object
 * where an id belongs — the take-back then deleted a comment that does not exist while
 * the tests still passed.
 */
const MARKER_ID = 777;

function thread(bodies: string[], firstId = 555): FakeGhRule {
  return {
    match: ["api", "issues/5/comments", "--paginate"],
    stdout: JSON.stringify([
      ...bodies.map((body, i) => ({ id: firstId + i, body })),
      // The aggregation marker, as the freshness probe must find it. Neutral on
      // purpose: a body claiming `atomaton:aggregated` here would be the gate's own
      // idempotency read answering `already-aggregated` before the gate ever ran.
      { id: MARKER_ID, body: "a comment with no tag on it" },
    ]),
  };
}

// The parent's own thread as an orchestrated parent's really looks: a request that
// named its agent, and then the run it started ending `waiting` — parked on the
// children, which is the state the gate exists to end. A `waiting` ending is not an
// outstanding request (the request was taken up), so the dispatch may go. Without the
// ending the newest event would be the request and the gate would answer `parent-busy`.
const PARKED = "<!-- atomaton:ended=waiting answers=0 run=0 -->";
const PARENT_AGENT: FakeGhRule = thread(["<!-- atomaton:dispatch=atomaton -->", PARKED]);

// The same read, answered with a thread that names nobody: `dispatchRunner` refuses an
// empty agent, which is what `dispatch-failed` means.
const NAMES_NOBODY: FakeGhRule = thread(["a comment that names nobody"]);

// The aggregation marker read when the thread carries no marker — the ordinary gate
// answer, in tests where a dispatch has to go through.
const NO_MARKER: FakeGhRule = thread(["some unrelated comment"]);

/**
 * The fake `gh` exits 1 for any call no rule matches, which is the right
 * default -- a test should not accidentally succeed through a call it never
 * described. These two are the calls the happy path makes after the checks:
 * claiming the completion, and starting the atomaton.
 *
 * The marker is written with `gh api --method POST ... --jq .id`, which is the only
 * way to learn the new comment's id -- `gh issue comment` has no `--jq` flag and exits
 * on it before posting anything (#143). The id the fake returns is 777, and the
 * take-back tests below delete exactly that.
 *
 * It is keyed on `atomaton:aggregated` because that is the tag the gate's marker always
 * carries. The same body also carries `atomaton:dispatch`, which is what makes it the
 * dispatch's marker as well — see the "one comment" tests below.
 */
const AGGREGATION_MARKER_POST: FakeGhRule = {
  match: ["api", "issues/5/comments", "--method", "POST", "atomaton:aggregated"],
  stdout: String(MARKER_ID),
  code: 0,
};
const DISPATCH_WORKS: FakeGhRule = { match: ["workflow", "run"], code: 0 };
// Two calls read the parent through this endpoint, and only one of them is
// optional. `resolveNotify` looks it up to find someone to mention and tolerates
// a failure; `dispatchRunner` reads its state and refuses to dispatch onto
// anything it cannot confirm is open. So this answers with a state -- `{}` used
// to be enough, and would now make every test below report a closed parent.
const PARENT_IS_OPEN: FakeGhRule = { match: ["api", "issues"], stdout: JSON.stringify({ state: "open" }) };

describe("aggregation.ts dispatch gate", () => {
  test("dispatches once when the siblings are done and nobody claimed it", () => {
    const { kind, ghCalls } = runGate([...NO_SIBLINGS, PARENT_AGENT, NO_MARKER, AGGREGATION_MARKER_POST, DISPATCH_WORKS, PARENT_IS_OPEN]);
    expect(kind).toBe("dispatched");
    expect(wroteMarker(ghCalls)).toBe(true);
    expect(dispatched(ghCalls)).toBe(true);
  });

  /**
   * One completion, one comment.
   *
   * The gate has always written the `atomaton:aggregated` marker, and the dispatch used
   * to post an `atomaton:dispatch` marker of its own beside it — two comments saying one
   * thing, and the second one the run's ask. The marker is the ask now, which means the
   * comment count is the thing to pin: a regression that put the second POST back would
   * leave every aggregation as two comments again, and nothing else would notice.
   */
  test("an aggregation posts exactly one comment, and it is both the marker and the ask", () => {
    const { kind, ghCalls } = runGate([...NO_SIBLINGS, PARENT_AGENT, NO_MARKER, AGGREGATION_MARKER_POST, DISPATCH_WORKS, PARENT_IS_OPEN]);
    expect(kind).toBe("dispatched");

    // Every write to the parent's thread, which is the whole question: reads carry
    // `--paginate`, writes carry `--method`.
    const writes = ghCalls.filter(
      (c) => c.includes("api") && c.some((a) => a.includes("issues/5/comments")) && c.includes("--method"),
    );
    expect(writes, "one comment per completion: the marker IS the dispatch's ask").toHaveLength(1);

    const body = writes[0]?.find((a) => a.startsWith("body=")) ?? "";
    expect(body, "the idempotency claim every later caller reads").toContain("atomaton:aggregated=10");
    expect(body, "and the tag that makes the run's claim land on this comment").toContain("atomaton:dispatch=atomaton");
    // The dispatch's ask is this comment, so the run claims the marker rather than a
    // second comment: `claim_turn.ts` appends its took line to a marker in place.
    const dispatch = ghCalls.find((c) => c[0] === "workflow" && c[1] === "run") ?? [];
    expect(dispatch.join(" ")).toContain(`ask=${MARKER_ID}`);
  });

  // The case `dispatchRunner` refuses and the gate has to report as a failure: the
  // marker is written, but the thread never shows it, so the ordering check has nothing
  // to be ordered against. The refusal removes the marker, so a later close retries.
  test(
    "a dispatch the thread cannot confirm is not sent, and the marker comes back",
    () => {
      const { kind, ghCalls } = runGate([
        ...NO_SIBLINGS,
        // A thread that never shows the marker: no `MARKER_ID` in it, so the freshness
        // probe widens and then stands down. The read has to answer every time, or the
        // probe refuses for the other reason (an unreadable thread).
        { match: ["api", "issues/5/comments", "--paginate"], stdout: JSON.stringify([{ id: 555, body: "<!-- atomaton:dispatch=atomaton -->" }, { id: 556, body: PARKED }]) },
        AGGREGATION_MARKER_POST,
        DISPATCH_WORKS,
        PARENT_IS_OPEN,
      ]);
      expect(kind).toBe("dispatch-failed");
      expect(dispatched(ghCalls), "no workflow_dispatch: the evidence never appeared").toBe(false);
      // Removed by the refusal that adopted it, so the idempotency read finds nothing
      // next time — which is what makes `dispatch-failed` a retryable answer.
      const deletes = ghCalls.filter((c) => c.includes("DELETE") && c.join(" ").includes(`comments/${MARKER_ID}`));
      expect(deletes, "the marker is taken back so a later close can retry").toHaveLength(1);
      // Exactly one: the gate must not delete it a second time. A 404 there would be
      // logged as "the marker could not be removed, so nothing will retry", which is
      // the opposite of what happened.
    },
    15_000,
  );

  /**
   * The case this gate walked into on #803: the last sibling lands, and the parent
   * somebody closed in the meantime is not something to start an atomaton on.
   *
   * The marker is already written by then, so nothing else will pick this up -- which
   * is why the answer has to be its own kind rather than `dispatch-failed`. Nothing
   * malfunctioned, and work is still left undone.
   */
  test("a closed parent is not dispatched onto, and says so as its own answer", () => {
    const { kind, ghCalls } = runGate([
      ...NO_SIBLINGS,
      PARENT_AGENT,
      NO_MARKER,
      AGGREGATION_MARKER_POST,
      DISPATCH_WORKS,
      { match: ["api", "issues"], stdout: JSON.stringify({ state: "closed" }) },
    ]);
    expect(kind).toBe("parent-closed");
    expect(dispatched(ghCalls)).toBe(false);
    // The person who asked for the run is told on the issue, by `dispatchRunner`.
    const notice = ghCalls.find((c) => c.includes("comment") && c.some((a) => a.includes("was not started")));
    expect(notice?.join(" ")).toContain("Nothing will retry");
  });

  test("siblings still open is `waiting`, and nothing is claimed", () => {
    const { kind, ghCalls } = runGate([
      ...subIssues(11),
    ]);
    expect(kind).toBe("waiting");
    expect(wroteMarker(ghCalls)).toBe(false);
    expect(dispatched(ghCalls)).toBe(false);
  });

  test("another caller's marker makes this one a no-op", () => {
    const { kind, ghCalls } = runGate([
      ...NO_SIBLINGS,
      thread(["<!-- atomaton:aggregated=10 -->"]),
    ]);
    expect(kind).toBe("already-aggregated");
    expect(dispatched(ghCalls)).toBe(false);
  });

  /**
   * #304, at the gate. The marker read used to test `commentsOut.includes(marker)`
   * over the raw bodies, so a comment quoting the marker inside a fenced sample --
   * which is exactly how this tracker documents the format -- answered
   * `already-aggregated`: no dispatch, no notice, and nobody told. The read is
   * per-body prose now, so a quoted sample claims nothing and the gate still runs.
   */
  test("a marker quoted in a fenced sample does not stop the aggregation", () => {
    const { kind, ghCalls } = runGate([
      ...NO_SIBLINGS,
      // Serves all three reads: the quoted sample claims nothing, the dispatch marker
      // names the agent, and the `waiting` ending is what makes the newest turn event
      // "taken up" rather than an outstanding request the dispatch would refuse over.
      // The gate's own marker is appended by `thread()` (id 777), and that is the id
      // the freshness probe looks for.
      thread([
        "<!-- atomaton:dispatch=atomaton -->",
        PARKED,
        ["For the record, the marker looks like:", "```html", "<!-- atomaton:aggregated=10 -->", "```"].join("\n"),
      ]),
      AGGREGATION_MARKER_POST,
      DISPATCH_WORKS,
      PARENT_IS_OPEN,
    ]);
    expect(kind).toBe("dispatched");
    expect(wroteMarker(ghCalls)).toBe(true);
  });

  // The complement, in the same thread shape: a marker in PROSE is the machinery's
  // own record and must still be honoured. If the fence rule ever grew into
  // ignoring markers wholesale, this is the test that catches it.
  test("a marker written in prose still makes this one a no-op", () => {
    const { kind } = runGate([
      ...NO_SIBLINGS,
      thread([
        "<!-- atomaton:aggregated=10 -->\nAtomaton: All sub-tasks completed (last: #10). Re-invoking the parent's agent for aggregation.",
      ]),
    ]);
    expect(kind).toBe("already-aggregated");
  });

  // The defect this issue was filed for. The marker IS the idempotency claim, so
  // failing to write it and dispatching anyway means the other racer -- which by
  // construction is running right now -- finds no marker, decides it is first,
  // and dispatches the atomaton a second time. A missed aggregation is
  // recoverable by that racer; a double dispatch is not.
  test("a failed marker write stops the dispatch rather than racing on", () => {
    const { kind, ghCalls, stderr } = runGate([
      ...NO_SIBLINGS,
      // Listed before the read rule, and keyed on the body: the write and the read share
      // a path, so a rule that matches either must say which one it is for.
      { match: ["api", "issues/5/comments", "--method", "POST", "atomaton:aggregated"], code: 1, stdout: "API rate limit exceeded" },
      NO_MARKER,
    ]);
    expect(kind).toBe("undetermined");
    expect(dispatched(ghCalls)).toBe(false);
    expect(stderr).toContain("aggregation marker");
  });

  /**
   * #18: an atomaton that decomposes work ends by calling `launch_sub_agent`, a
   * session-ending tool, so it posts no result comment and leaves no `atomaton:agent`
   * on the parent. The gate read `""` and dispatched an agent called "", which GitHub
   * refused with `HTTP 422: Required input 'agent' not provided`.
   *
   * The request that started the run is the fallback, so a parent whose thread carries
   * only a dispatch marker still names its agent. This is the regression test for that
   * fallback: the parent's thread has the marker and nothing else.
   */
  test("the parent's agent is read from the request when no result comment exists", () => {
    const { kind, ghCalls } = runGate([
      ...NO_SIBLINGS,
      PARENT_AGENT,
      NO_MARKER,
      AGGREGATION_MARKER_POST,
      DISPATCH_WORKS,
      PARENT_IS_OPEN,
    ]);
    expect(kind).toBe("dispatched");
    const dispatch = ghCalls.find((c) => c.includes("workflow") && c.includes("run")) ?? [];
    expect(dispatch.join(" ")).toContain("agent=atomaton");
  });

  /**
   * The other half: a parent whose thread names no agent at all is not dispatched onto
   * with an empty name. `dispatchRunner` refuses it, and the gate reports
   * `dispatch-failed` -- the work is done and nobody was started to aggregate it.
   */
  test("a parent that names no agent is not dispatched onto with an empty name", () => {
    const { kind, ghCalls } = runGate([
      ...NO_SIBLINGS,
      NAMES_NOBODY,
      NO_MARKER,
      AGGREGATION_MARKER_POST,
      DISPATCH_WORKS,
      PARENT_IS_OPEN,
    ]);
    expect(kind).toBe("dispatch-failed");
    expect(dispatched(ghCalls)).toBe(false);
  });

  /**
   * #7: the marker is a claim that this completion was aggregated, and the claim is
   * only true if a run started. A failed dispatch leaves it false, and the marker is
   * exactly what makes every later caller answer `already-aggregated` -- so leaving it
   * is how a parent ends up open with every child closed and no path back in.
   *
   * Taking it back is what reopens the retry. The id the write returns (`--jq .id`) is
   * what the delete needs, so this also pins that the two calls agree on it.
   */
  test("a failed dispatch takes the aggregation marker back, so a later close retries", () => {
    const { kind, ghCalls } = runGate([
      ...NO_SIBLINGS,
      NAMES_NOBODY,
      NO_MARKER,
      AGGREGATION_MARKER_POST,
      DISPATCH_WORKS,
      PARENT_IS_OPEN,
    ]);
    expect(kind).toBe("dispatch-failed");
    const removed = ghCalls.find((c) => c.includes("DELETE") && c.join(" ").includes("comments/777"));
    expect(removed, "the marker written as id 777 must be deleted").toBeDefined();
  });

  /**
   * A closed parent keeps the marker: the parent is closed, so a retry could start
   * nothing, and the claim "this completion was dealt with" is true.
   */
  test("a closed parent keeps the marker rather than taking it back", () => {
    const { kind, ghCalls } = runGate([
      ...NO_SIBLINGS,
      PARENT_AGENT,
      NO_MARKER,
      AGGREGATION_MARKER_POST,
      DISPATCH_WORKS,
      { match: ["api", "issues"], stdout: JSON.stringify({ state: "closed" }) },
    ]);
    expect(kind).toBe("parent-closed");
    expect(ghCalls.some((c) => c.includes("DELETE") && c.join(" ").includes("comments/777"))).toBe(false);
  });

  /**
   * The other half of that argument, and the one that only exists because the marker is
   * now also the dispatch's ask: the KEPT marker must not keep `atomaton:dispatch` on it.
   *
   * The tag is a promise that a run is coming. On a closed parent no run will ever claim
   * it, and `runInFlight` reads a standing request as a run working or coming — forever.
   * That is the shape #449 was made of, where merged pull requests read as live runs, and
   * it also means `prune_atomaton_data` would never prune the node.
   *
   * So the marker is edited back to the idempotency line alone: "this completion was
   * dealt with" is true, "an agent is coming" is not.
   */
  test("a closed parent's marker keeps the aggregation claim and loses the dispatch tag", () => {
    const { outcome, ghCalls } = runGateDetailed([
      ...NO_SIBLINGS,
      PARENT_AGENT,
      NO_MARKER,
      AGGREGATION_MARKER_POST,
      DISPATCH_WORKS,
      { match: ["api", "issues"], stdout: JSON.stringify({ state: "closed" }) },
      { match: ["api", "issues/5/comments/777"], stdout: "{}" },
      { match: ["issue", "comment"], stdout: "" },
    ]);
    expect(outcome).toBe("parent-closed");

    // Written with both tags, then edited to just the claim.
    const write = ghCalls.find(
      (c) => c.some((a) => a.includes("issues/5/comments")) && c.includes("POST"),
    );
    expect(write?.find((a) => a.startsWith("body=")) ?? "").toContain("atomaton:dispatch=");

    const edit = ghCalls.find((c) => c.includes("PATCH") && c.join(" ").includes("comments/777"));
    expect(edit, "the tag has to come off, or the thread promises a run forever").toBeDefined();
    const body = edit?.find((a) => a.startsWith("body=")) ?? "";
    expect(body, "the idempotency claim stays: the completion was dealt with").toContain("atomaton:aggregated=10");
    expect(body, "and the promise goes").not.toContain("atomaton:dispatch");
  });

  // The read half of the same argument, which was already guarded. Kept so the
  // two halves cannot drift apart again.
  test("an unreadable comment list stops the dispatch too", () => {
    const { kind, ghCalls } = runGate([
      ...NO_SIBLINGS,
      { match: ["api", "issues/5/comments", "--paginate"], code: 1, stdout: "not found" },
    ]);
    expect(kind).toBe("undetermined");
    expect(wroteMarker(ghCalls)).toBe(false);
    expect(dispatched(ghCalls)).toBe(false);
  });

  // `countOpenSiblings` throws rather than returning, and that exception used to
  // escape the gate entirely -- one call site wrapped it in try/catch and the
  // other did not, which was not a policy.
  test("an unreadable sibling list is undetermined, not an escaping exception", () => {
    const { kind, ghCalls } = runGate([{ match: ["graphql"], code: 1, stdout: "gh: not found" }]);
    expect(kind).toBe("undetermined");
    expect(dispatched(ghCalls)).toBe(false);
  });

  /**
   * #143, from the side that made it invisible.
   *
   * `undetermined` is the one `needsAttention` outcome that told nobody. It wrote a log
   * line and returned; `dispatch-failed` and `parent-busy` take their marker back so a
   * retry speaks, and `parent-closed` posts a refusal notice on the parent. Three runs
   * hit `undetermined` on the release whose marker write was broken, the parent was
   * never aggregated, and the thread said nothing — a person found it by noticing an
   * ABSENT sentence on the sub-issue.
   *
   * So the notice is asserted against the fake's call log: a comment on the PARENT,
   * carrying the reason, and tagged so it cannot be read as a turn.
   */
  test("an undetermined gate leaves a notice on the parent, so a person finds out", () => {
    const { kind, ghCalls } = runGate([
      ...NO_SIBLINGS,
      NO_MARKER,
      { match: ["api", "issues/5/comments", "--method", "POST", "atomaton:aggregated"], code: 1, stdout: "API rate limit exceeded" },
    ]);
    expect(kind).toBe("undetermined");

    const notice = ghCalls.find(
      (c) => c[0] === "issue" && c[1] === "comment" && c.join(" ").includes("aggregation marker"),
    );
    expect(notice, "the parent must be told, or nothing says the work is stuck").toBeDefined();
    const text = notice?.join(" ") ?? "";
    expect(text, "it goes on the PARENT, which is where the stuck work is").toContain("issue comment 5");
    expect(text, "the reason travels, so it is actionable").toContain("aggregation marker");
    expect(text, "it tells a person what to do").toContain("/atomaton");
    expect(text, "and it is not a turn: a reader must not take it for a request").toContain("llm-context=exclude");
  });

  /**
   * The other side of the same rule: an outcome that tells somebody is not told twice.
   * `dispatch-failed` already speaks through the marker take-back, and a notice here
   * would be a second comment about one failure.
   */
  test("an outcome that already speaks does not also post a notice", () => {
    const { kind, ghCalls } = runGate([
      ...NO_SIBLINGS,
      NAMES_NOBODY,
      NO_MARKER,
      AGGREGATION_MARKER_POST,
      DISPATCH_WORKS,
      PARENT_IS_OPEN,
    ]);
    expect(kind).toBe("dispatch-failed");
    expect(
      ghCalls.some((c) => c[0] === "issue" && c[1] === "comment" && c.join(" ").includes("could not be aggregated")),
      "the take-back already says what happened; a notice would be a second comment",
    ).toBe(false);
  });
});

/**
 * What each outcome tells a READER, which is a different question from what the gate
 * did, and the one that misled a model into a second comment on #109.
 *
 * Two readers: the run log, and — for three of these — the model that called
 * `request_close_issue`, which is handed `describeGateResult`'s sentence in the tool
 * result. When the sentence said "closing a sub-issue again retries it" and the run was
 * an `undetermined`, the model acted on a retry that the marker's absence of a take-back
 * had already ruled out.
 *
 * The invariant is narrow and worth stating: **a sentence may promise a retry only for
 * the outcomes whose marker is actually taken back.**
 */
describe("describeGateResult", () => {
  /**
   * The retry is real for these two, and the gate's own body is the evidence: both
   * reach `takeBackMarker`, which DELETEs the comment so the idempotency read finds
   * nothing next time. A sentence promising a retry is a claim about that DELETE.
   */
  test("the two outcomes that take the marker back promise a retry", () => {
    for (const kind of ["dispatch-failed", "parent-busy"] as const) {
      const text = describeGateResult({ kind } as DispatchGateResult, 10, 5);
      expect(text, `${kind} takes the marker back, so a retry does happen`).toMatch(/retr/i);
    }
  });

  /**
   * And these two must NOT, because nothing takes the marker back — `undetermined`
   * returns before the write, and `parent-closed` returns with the marker deliberately
   * left in place. A reader told "close it again to retry" would close it again and
   * find the same answer, forever.
   */
  test("the two outcomes that keep the marker never promise one", () => {
    const closed = describeGateResult({ kind: "parent-closed" }, 10, 5);
    expect(closed, "the marker stays, so nothing retries").toContain("no other caller will retry");
    expect(closed, "and the reader is told what to do instead").toMatch(/reopen it and run .* by hand/);

    const unknown = describeGateResult({ kind: "undetermined", why: "gh failed" }, 10, 5);
    expect(unknown, "the reason travels, or the sentence is not actionable").toContain("gh failed");
    expect(unknown, "nothing was written, so nothing retries").toContain("nothing will retry");
  });

  /**
   * `which` is what a reader locates the problem by. A close that reaches the gate
   * through the sub-issue's own link cannot know the parent's number, so it passes
   * none, and printing `#undefined` or `#0` would name a different issue.
   */
  test("a caller that does not know the parent names it in words", () => {
    expect(describeGateResult({ kind: "dispatched" }, 10)).toContain("the parent issue");
    expect(describeGateResult({ kind: "dispatched" }, 10)).not.toContain("#undefined");
    expect(describeGateResult({ kind: "dispatched" }, 10, 5)).toContain("#5");
  });
});
