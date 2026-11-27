import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { claimCommentBody, claimOnMarkerBody, raceOutcome } from "./claim_turn.ts";
import { readers } from "../../adapters/github/thread.ts";
import { DISPATCH_TAG, LLM_CONTEXT_TAG, TOOK_TAG } from "../../adapters/github/tags.ts";
import { runWithFakeGh, scriptPath, type FakeGhRule } from "./testing/harness.ts";

/**
 * The claim's race check (#285): two runs reaching for one ask are separated by
 * the claim comment ids themselves — the older claim holds the turn, the newer run
 * backs off. Per-node concurrency serialises the two runners, so the check cannot
 * itself race; what is pinned here is the comparison and the wire format the
 * watch's gates read back.
 */

const body = (id: number, ask: number, run: number) => ({ id, body: claimCommentBody({ ask, run }) });

describe("raceOutcome", () => {
  test("a claim with nothing older on the same ask holds the turn", () => {
    expect(raceOutcome([body(10, 55, 7)], { id: 10, ask: 55 })).toBe("held");
    expect(raceOutcome([], { id: 11, ask: 55 })).toBe("held");
  });

  test("an older claim on the same ask wins, and this run backs off", () => {
    // The acceptance condition: two runs processing one ask, one proceeds.
    const comments = [body(10, 55, 7), body(11, 55, 8)];
    expect(raceOutcome(comments, { id: 11, ask: 55 })).toBe("backed-off");
    expect(raceOutcome(comments, { id: 10, ask: 55 })).toBe("held");
  });

  test("a claim on a DIFFERENT ask does not back this one off", () => {
    const comments = [body(10, 55, 7), body(11, 56, 8)];
    expect(raceOutcome(comments, { id: 11, ask: 56 })).toBe("held");
  });

  test("a claim newer than mine is not consulted — only the older one holds", () => {
    expect(raceOutcome([body(10, 55, 7), body(11, 55, 8)], { id: 10, ask: 55 })).toBe("held");
  });

  test("the fix cycle: the re-validated run claims the fresh push comment, not the pushing run's ask", () => {
    // The thread a fix push leaves: the person's command (the engineer's ask, which
    // the engineer claimed and answered by pushing), and the push comment
    // `commit_and_push` posts for the re-validated run to claim. The engineer's
    // claim is OLDER but holds a DIFFERENT ask — the comparison is per-ask, so the
    // reviewer's claim of the push comment holds and the cycle goes. (Quoting the
    // engineer's own ask here was the first cut: the reviewer lost this race every
    // time and the fix cycle was dead.)
    const comments = [
      { id: 10, body: "/engineer fix CI" },
      body(11, 10, 7),
      { id: 12, body: "<!-- atomaton:ended=done answers=10 run=7 -->" },
      body(13, 13, 8), // the push comment, claimed by the run validation dispatches
    ];
    expect(raceOutcome(comments, { id: 13, ask: 13 })).toBe("held");
  });

  test("two runs for one push comment race on it the way they race on a command", () => {
    const comments = [body(13, 13, 8)];
    expect(raceOutcome(comments, { id: 14, ask: 13 })).toBe("backed-off");
    expect(raceOutcome(comments, { id: 13, ask: 13 })).toBe("held");
  });

  test("only took tags count: a remark that mentions an ask is not a claim", () => {
    const comments = [
      { id: 10, body: "about ask 55: the took tag is prose here" },
      body(11, 55, 7),
    ];
    expect(raceOutcome(comments, { id: 11, ask: 55 })).toBe("held");
  });

  // The tag decides a claim, and the fence decides it is a sample (#304): a comment
  // quoting a took tag inside a code block has claimed nothing, so this run holds.
  test("a took tag quoted in a fenced sample does not back this run off", () => {
    const comments = [
      { id: 10, body: ["The claim format:", "```html", "<!-- atomaton:took=55 run=7 -->", "```"].join("\n") },
      body(11, 55, 8),
    ];
    expect(raceOutcome(comments, { id: 11, ask: 55 })).toBe("held");
  });

  // The heal-on-read exception: a claim blocks only while its RUN can still be working.
  // A claim whose run finished and never answered is a dead claim — the state a
  // cancelled or vanished run leaves — and backing off to it would wedge the ask,
  // because nothing was ever coming to answer it.
  test("an older claim whose run has finished does not back this run off", () => {
    const comments = [body(10, 55, 7), body(11, 55, 8)];
    expect(raceOutcome(comments, { id: 11, ask: 55 }, (run) => run === 7)).toBe("held");
  });

  test("an older claim whose run may still be working backs this run off", () => {
    const comments = [body(10, 55, 7), body(11, 55, 8)];
    expect(raceOutcome(comments, { id: 11, ask: 55 }, (run) => run === 999)).toBe("backed-off");
  });

  test("a claim that names no run, or a run nobody could ask about, still blocks", () => {
    // The conservative side is the one that does not release a working run's turn: a
    // claim without a run id is an older format, and an unreadable status is not an
    // answer.
    const noRun = { id: 10, body: claimCommentBody({ ask: 55, run: 0 }) };
    expect(raceOutcome([noRun, body(11, 55, 8)], { id: 11, ask: 55 }, () => false)).toBe("backed-off");
    expect(raceOutcome([body(10, 55, 7), body(11, 55, 8)], { id: 11, ask: 55 }, () => false)).toBe("backed-off");
  });

  test("without the lookup the comparison is the strict older-id one", () => {
    // The callers that have not been healed yet, and every test above: no lookup, no
    // exception.
    const comments = [body(10, 55, 7), body(11, 55, 8)];
    expect(raceOutcome(comments, { id: 11, ask: 55 })).toBe("backed-off");
  });
});

describe("claimCommentBody", () => {
  test("the claim is machinery bookkeeping: excluded from the model's context", () => {
    const body = claimCommentBody({ ask: 55, run: 7 });
    expect(body).toContain("atomaton:llm-context=exclude");
    expect(body).toContain("<!-- atomaton:took=55 run=7 -->");
  });

  test("the claim also carries a line a person can read, under the tags (#349)", () => {
    // GitHub renders neither tag, so tags alone reached the page as a comment with
    // an empty body — the record has to stay and something visible has to join it.
    expect(claimCommentBody({ ask: 55, run: 7 })).toBe(
      [
        "<!-- atomaton:llm-context=exclude -->",
        "<!-- atomaton:took=55 run=7 -->",
        "Atomaton: claimed this turn.",
      ].join("\n"),
    );
  });

  test("the visible line is prose only: it claims the turn and moves nothing else", () => {
    // The trap the line could have set: prose that reads as a request for an agent
    // or as an ending would make the claim itself a turn-changing event.
    const body = claimCommentBody({ ask: 55, run: 7 });
    expect(readers.claim(body)).toEqual({ ask: 55, run: 7 });
    expect(readers.requestedAgent(body)).toBe("");
    expect(readers.ending(body)).toBe("");
    expect(readers.isDispatchMarker(body)).toBe(false);
  });
});

describe("claimOnMarkerBody", () => {
  const marker = (context: string) =>
    [LLM_CONTEXT_TAG.write(context), DISPATCH_TAG.write("engineer"), "Atomaton: `engineer` starting on this issue."].join("\n");

  test("appends the claim under the marker instead of writing a second comment", () => {
    const body = claimOnMarkerBody(marker("exclude"), { ask: 55, run: 7 });
    expect(body).toBe(`${marker("exclude")}\n<!-- atomaton:took=55 run=7 -->`);
    // One comment can carry both roles: the marker a later dispatch is ordered
    // against, and the claim the guard and the run watch read.
    expect(readers.isDispatchMarker(body)).toBe(true);
    expect(readers.claim(body)).toEqual({ ask: 55, run: 7 });
  });

  test("the marker's llm-context stays exactly as its writer set it", () => {
    // The post-merge and rejection directives are written `include`: they are the
    // first user message the re-invoked run reads. The claim used to carry its own
    // `exclude` because it was its own comment, and bringing that line onto the
    // marker would delete the directive from the model's context. Only the took
    // line is added.
    const include = claimOnMarkerBody(marker("include"), { ask: 55, run: 7 });
    expect(LLM_CONTEXT_TAG.readProse(include)).toBe("include");
    expect(include.match(/llm-context/g)).toHaveLength(1);

    const exclude = claimOnMarkerBody(marker("exclude"), { ask: 55, run: 7 });
    expect(LLM_CONTEXT_TAG.readProse(exclude)).toBe("exclude");
    expect(exclude.match(/llm-context/g)).toHaveLength(1);
  });

  test("a claim on one marker does not read as a claim on another ask", () => {
    const body = claimOnMarkerBody(marker("exclude"), { ask: 55, run: 7 });
    expect(readers.claim(body)?.ask).toBe(55);
  });
});

/**
 * The script itself, against a fake `gh`: the branch that edits the ask's dispatch
 * marker is the one that changed what the thread receives, so its wire traffic is
 * pinned here rather than only through the pure body helper.
 */
describe("claim_turn.ts on a dispatch marker", () => {
  const MARKER = [
    LLM_CONTEXT_TAG.write("exclude"),
    DISPATCH_TAG.write("engineer"),
    "Atomaton: `engineer` starting on this issue.",
  ].join("\n");

  function run(rules: FakeGhRule[]) {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-claim-"));
    const outputFile = join(dir, "github_output");
    try {
      const result = runWithFakeGh(scriptPath("claim_turn.ts"), ["--number", "5", "--ask", "55", "--run-id", "7"], {
        rules,
        env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: outputFile },
      });
      const output = readFileSync(outputFile, "utf8");
      return { ...result, output };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  const listing = (body: string) =>
    JSON.stringify([{ id: 55, body, user: { type: "Bot" } }]);

  test("appends the claim to the marker and posts no second comment", () => {
    const claimed = claimOnMarkerBody(MARKER, { ask: 55, run: 7 });
    const r = run([
      // 1. the thread before the claim, 2. the read-back of the edit, 3. the race read.
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 1, stdout: listing(MARKER) },
      { match: ["api", "issues/comments/55", "--method", "PATCH"], stdout: "" },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 2, stdout: listing(claimed) },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 3, stdout: listing(claimed) },
    ]);
    expect(r.status).toBe(0);
    expect(r.output).toContain("claimed=true");

    // The dispatch marker's own line stays, and the claim is the only new comment
    // content: nothing was POSTed, because the marker became the claim's carrier.
    expect(r.ghCalls.some((c) => c.includes("--method") && c.includes("POST"))).toBe(false);
    const patch = r.ghCalls.find((c) => c.includes("PATCH")) ?? [];
    const body = patch[patch.indexOf("-f") + 1] ?? "";
    expect(body).toContain("starting on this issue");
    expect(body).toContain("atomaton:took=55 run=7");
    expect(body.match(/llm-context/g)).toHaveLength(1);
  });

  test("backs off without touching a marker another run already claimed", () => {
    const r = run([
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 1, stdout: listing(claimOnMarkerBody(MARKER, { ask: 55, run: 9 })) },
    ]);
    expect(r.status).toBe(0);
    expect(r.output).toContain("claimed=false");
    expect(r.ghCalls.some((c) => c.includes("PATCH"))).toBe(false);
  });

  test("leaves an earlier attempt's claim in place when the same run is re-run", () => {
    // A re-run keeps `github.run_id` (a re-execution is a new attempt of the SAME run),
    // so the took line already on the marker names this run and is an earlier attempt's.
    // It is the only record that a run took this ask and never reported, which is the
    // state the run watch heals; taking it back here would delete it on the way in.
    // The separate-claim path never did this — it deleted the comment IT had posted and
    // left every older claim standing.
    const r = run([
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 1, stdout: listing(claimOnMarkerBody(MARKER, { ask: 55, run: 7 })) },
    ]);
    expect(r.status).toBe(0);
    expect(r.output).toContain("claimed=false");
    expect(r.ghCalls.some((c) => c.includes("PATCH"))).toBe(false);
  });

  test("backs off when another run's claim overwrote this one between the edit and the read", () => {
    const r = run([
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 1, stdout: listing(MARKER) },
      { match: ["api", "issues/comments/55", "--method", "PATCH"], stdout: "" },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 2, stdout: listing(claimOnMarkerBody(MARKER, { ask: 55, run: 9 })) },
    ]);
    expect(r.status).toBe(0);
    expect(r.output).toContain("claimed=false");
    // The other run's claim is the one that landed: it is not restored away.
    const patches = r.ghCalls.filter((c) => c.includes("PATCH"));
    expect(patches).toHaveLength(1);
  });

  test("a person's comment is never edited: the claim is still posted as its own comment", () => {
    const withClaim = JSON.stringify([
      { id: 55, body: "/engineer please fix this", user: { type: "User" } },
      { id: 77, body: claimCommentBody({ ask: 55, run: 7 }) },
    ]);
    const r = run([
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 1, stdout: listing("/engineer please fix this") },
      { match: ["api", "issues/5/comments", "--method", "POST"], stdout: "77" },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 2, stdout: withClaim },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 3, stdout: withClaim },
    ]);
    expect(r.status).toBe(0);
    expect(r.output).toContain("claimed=true");
    expect(r.ghCalls.some((c) => c.includes("PATCH"))).toBe(false);
  });
});

/**
 * The minted ask (#636): a run started by a new issue's body has no comment to
 * claim, so it mints a dispatch marker of its own and claims that. What is pinned
 * here is the shape the thread receives — byte-compatible with
 * `postDispatchMarker`'s marker, because every reader treats the two as the same
 * kind of comment — and the `ask=` output the runner carries to its ending writers,
 * so the ending answers the minted ask and the claim does not stand unclosed.
 */
describe("claim_turn.ts with no ask comment (a body-started run mints its ask)", () => {
  function runMint(rules: FakeGhRule[], extraArgs: string[] = []) {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-claim-"));
    const outputFile = join(dir, "github_output");
    try {
      const result = runWithFakeGh(
        scriptPath("claim_turn.ts"),
        ["--number", "5", "--run-id", "7", ...extraArgs],
        { rules, env: { GITHUB_REPOSITORY: "owner/repo", GITHUB_OUTPUT: outputFile } },
      );
      return {
        ...result,
        // A run that failed before its first `record` wrote nothing: absent is
        // the shape, not an error.
        output: existsSync(outputFile) ? readFileSync(outputFile, "utf8") : "",
      };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  const MINTED = [
    LLM_CONTEXT_TAG.write("exclude"),
    DISPATCH_TAG.write("atomaton"),
    "Atomaton: `atomaton` starting on this issue.",
  ].join("\n");
  const MINTED_CLAIMED = claimOnMarkerBody(MINTED, { ask: 90, run: 7 });

  test("mints a dispatch marker and claims it in place; the ask output names the minted id", () => {
    const mint = claimOnMarkerBody(MINTED, { ask: 90, run: 7 });
    const listed = (body: string) => JSON.stringify([{ id: 90, body, user: { type: "Bot" } }]);
    const r = runMint([
      // 1. the mint POST, then the reads in wire order: 2./3. the marker-visibility
      // poll (empty, then the marker, 1s apart), 4. the pre-claim listing, 5. the
      // read-back of the PATCH, 6. the race read.
      { match: ["api", "issues/5/comments", "--method", "POST"], stdout: "90" },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 1, stdout: "[]" },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 2, stdout: listed(MINTED) },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 3, stdout: listed(MINTED) },
      { match: ["api", "issues/comments/90", "--method", "PATCH"], stdout: "" },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 4, stdout: listed(mint) },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 5, stdout: listed(mint) },
    ], ["--agent", "atomaton", "--type", "issue"]);
    expect(r.status).toBe(0);
    expect(r.output).toContain("claimed=true");
    expect(r.output).toContain("ask=90");

    // The marker's own shape: the same three lines a machinery dispatch writes, and
    // the claim appended to it rather than posted beside it.
    const post = r.ghCalls.find((c) => c.includes("--method") && c.includes("POST")) ?? [];
    // `-f body=<the body>`: the value element carries the flag's name.
    const postedBody = (post[post.indexOf("-f") + 1] ?? "").slice("body=".length);
    expect(postedBody).toBe(MINTED);
    const patch = r.ghCalls.find((c) => c.includes("PATCH")) ?? [];
    const patchedBody = patch[patch.indexOf("-f") + 1] ?? "";
    expect(patchedBody).toContain("atomaton:took=90 run=7");
    expect(readers.claim(patchedBody)).toEqual({ ask: 90, run: 7 });
    expect(patchedBody).toContain("atomaton:dispatch=atomaton");
  });

  test("a pull request run mints a marker that says pull request", () => {
    const r = runMint([
      { match: ["api", "issues/5/comments", "--method", "POST"], stdout: "90" },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 1, stdout: JSON.stringify([{ id: 90, body: MINTED, user: { type: "Bot" } }]) },
      { match: ["api", "issues/comments/90", "--method", "PATCH"], stdout: "" },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 2, stdout: JSON.stringify([{ id: 90, body: MINTED_CLAIMED, user: { type: "Bot" } }]) },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 3, stdout: JSON.stringify([{ id: 90, body: MINTED_CLAIMED, user: { type: "Bot" } }]) },
    ], ["--agent", "reviewer", "--type", "pr"]);
    expect(r.status).toBe(0);
    const post = r.ghCalls.find((c) => c.includes("--method") && c.includes("POST")) ?? [];
    const postedBody = post[post.indexOf("-f") + 1] ?? "";
    expect(postedBody).toContain("starting on this pull request");
    expect(postedBody).toContain("atomaton:dispatch=reviewer");
  });

  test("refuses to mint without an agent: an ask no reader could route is not minted", () => {
    const r = runMint([
      { match: ["api", "issues/5/comments", "--method", "POST"], stdout: "90" },
    ]);
    expect(r.status).not.toBe(0);
    expect(r.ghCalls.some((c) => c.includes("PATCH"))).toBe(false);
  });

  test("a marker that never becomes visible fails the step rather than claiming blind", () => {
    const r = runMint([
      { match: ["api", "issues/5/comments", "--method", "POST"], stdout: "90" },
      // Never visible in any listing.
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 1, stdout: "[]" },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 2, stdout: "[]" },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 3, stdout: "[]" },
      { match: ["api", "issues/5/comments", "--paginate"], attempt: 4, stdout: "[]" },
    ], ["--agent", "atomaton", "--type", "issue"]);
    expect(r.status).not.toBe(0);
    expect(r.ghCalls.some((c) => c.includes("PATCH"))).toBe(false);
  }, 20_000);
});
