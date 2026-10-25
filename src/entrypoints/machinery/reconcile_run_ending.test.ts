import { describe, expect, test } from "bun:test";
import { runWithFakeGh, scriptPath, makeConfigDir, removeTemp } from "./testing/harness.ts";

/**
 * The run watch's reconciliation, asked of the script the workflow actually runs,
 * with the fake `gh` answering. The pure judgement lives in
 * `domain/work/run-report.test.ts`; what is pinned here is the FLOW — that the
 * gates come before the reads, that a notice carries the turn tags AND closes the
 * ask it reports (#285: the notice is the ending), and that the label follows the
 * rule the thread states.
 *
 * #285 replaced the two time-based gates with one identity rule: the watched run's
 * id is compared against the claims (`atomaton:took`) and the endings
 * (`atomaton:ended`) the thread carries. A run that claimed an ask and left no
 * ending with its own id on the thread is the notice; everything else is silence.
 */

const REPO = "o/r";
const AGENT = "engineer";
const NUMBER = 7;
const RUN_URL = "https://github.com/o/r/actions/runs/123";
/** The watched run's id — `github.event.workflow_run.id` in the workflow. */
const RUN_ID = 424242;
/** The ask the watched run claimed. */
const ASK = 55;

/** The arguments the workflow passes, as the step builds them. */
function argv(overrides: Record<string, string> = {}): string[] {
  return [
    "--display-title", overrides["display-title"] ?? `${AGENT} on #${NUMBER}`,
    "--run-id", overrides["run-id"] ?? String(RUN_ID),
    "--run-url", overrides["run-url"] ?? RUN_URL,
    ...(overrides.conclusion === undefined ? [] : ["--conclusion", overrides.conclusion]),
  ];
}

/** A comment as the Issues API returns it. */
function apiComment(body: string, id?: number): Record<string, unknown> {
  return { id, body, user: { type: "Bot" } };
}

/** The claim the watched run's runner wrote at start (#285), including the line a person reads (#349). */
function claim(ask = ASK, run = RUN_ID): string {
  return `<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:took=${ask} run=${run} -->\nAtomaton: claimed this turn.`;
}

/** An ending in the #285 wire format. */
function ending(verb: string, answers: number, run: number, agent?: string): string {
  return [
    ...(agent ? [`<!-- atomaton:agent=${agent} -->`] : []),
    `<!-- atomaton:ended=${verb} answers=${answers} run=${run} -->`,
  ].join("\n");
}

/** A person's command as the Issues API returns it. */
function command(body: string, id?: number): Record<string, unknown> {
  return { id, body, user: { type: "User" } };
}

function configDir(): string {
  // The label's name read from a config this test wrote, not from whichever
  // checkout the suite happens to run in.
  return makeConfigDir({ chain: { labels: { in_progress: "atomaton/in-progress" } } });
}

const LABELS_ON = JSON.stringify(["atomaton/in-progress", "other"]);
const LABELS_OFF = JSON.stringify(["other"]);

type FakeGhRules = NonNullable<Parameters<typeof runWithFakeGh>[2]>["rules"];

function rulesFor(opts: { comments?: Record<string, unknown>[]; commentsStdout?: string; labels?: string; postCode?: number } = {}): FakeGhRules {
  return [
    // Order matters: the comments path CONTAINS the issue path, so the more
    // specific rule is listed first. The `--jq` form is `mostRecentAgentOn`'s
    // read, which asks for the bodies alone and only fires on the notice path.
    {
      match: ["api", `repos/${REPO}/issues/${NUMBER}/comments`, "--jq"],
      stdout: JSON.stringify(["<!-- atomaton:agent=engineer -->", "/engineer continue here"]),
    },
    {
      match: ["api", `repos/${REPO}/issues/${NUMBER}/comments`],
      stdout: opts.commentsStdout ?? JSON.stringify(opts.comments ?? []),
    },
    { match: [`repos/${REPO}/issues/${NUMBER}`, "--jq"], stdout: opts.labels ?? LABELS_ON },
    { match: ["issue", "comment"], ...(opts.postCode === undefined ? {} : { code: opts.postCode }) },
    { match: ["label"] },
    { match: ["issue", "edit"] },
  ];
}

function run(args: string[], rules: ReturnType<typeof rulesFor>): ReturnType<typeof runWithFakeGh> {
  const dir = configDir();
  try {
    return runWithFakeGh(scriptPath("reconcile_run_ending.ts"), args, { rules, env: { GITHUB_REPOSITORY: REPO }, cwd: dir });
  } finally {
    removeTemp(dir);
  }
}

function postedNotice(result: ReturnType<typeof runWithFakeGh>): string | undefined {
  const call = result.ghCalls.find((argv) => argv.includes("comment"));
  const at = call?.indexOf("--body");
  return at !== undefined && at >= 0 ? call?.[at + 1] : undefined;
}

describe("reconcile_run_ending.ts", () => {
  test("a run that posted its ending leaves the thread alone", () => {
    const comments = [apiComment(claim()), apiComment(ending("done", ASK, RUN_ID, AGENT))];
    const r = run(argv(), rulesFor({ comments }));
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((argv) => argv.includes("comment"))).toEqual([]);
  });

  test("a run that claimed and left no ending gets the notice — and the notice IS the ending", () => {
    // The thread as a dead run leaves it: its claim, an older turn's ending, and
    // nothing answering the claim. The notice carries `answers=<claimed ask>
    // run=<watch>` — it closes the ask it reports, which is what makes it a
    // once-per-ask event (#252's residue) — and the subject is the ASK, not the
    // run: what a reader needs is that the request went unanswered.
    const comments = [apiComment(ending("done", 41, 9, "engineer")), apiComment(claim())];
    const r = run(argv(), rulesFor({ comments }));
    expect(r.status).toBe(0);

    const body = postedNotice(r);
    expect(body).toContain(`atomaton:ended=done answers=${ASK} run=${RUN_ID}`);
    expect(body).toContain("atomaton:llm-context=exclude");
    expect(body).toContain("no answer was posted for it");
    expect(body).toContain(AGENT);
    expect(body).toContain(RUN_URL);
    // The two ways forward, and none of the claim the deaths this covers cannot
    // back: the report step that would know is the one that never ran.
    expect(body).toContain("`/engineer` and put what to do next on the following lines");
    expect(body).toContain("`/engineer recover`");
    expect(body).not.toMatch(/session was saved/i);

    expect(r.ghCalls.some((argv) => argv.includes("--remove-label"))).toBe(true);
  });

  test("the healed thread stays silent: a second watch for the same run posts nothing", () => {
    // The notice above is on the thread now, carrying the answer to the claim's
    // ask. The watch firing again — the run's own re-run, another watch's pass —
    // reads the ask as answered and says nothing, which is the "exactly once" of
    // #252's acceptance.
    const comments = [apiComment(claim()), apiComment(ending("done", ASK, 9)) ];
    const r = run(argv(), rulesFor({ comments }));
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((argv) => argv.includes("comment"))).toEqual([]);
  });

  test("a waiting ending still releases the label; a hand-off keeps it", () => {
    // The label follows the turn the thread had BEFORE the dead run took the ball:
    // the last ending that is not the notice's own.
    const waiting = [apiComment(ending("waiting", 41, 9)), apiComment(claim())];
    const rWaiting = run(argv(), rulesFor({ comments: waiting }));
    expect(rWaiting.status).toBe(0);
    expect(postedNotice(rWaiting)).toBeDefined();
    expect(rWaiting.ghCalls.some((argv) => argv.includes("--remove-label"))).toBe(true);

    const handoff = [apiComment(ending("handoff", 41, 9)), apiComment(claim())];
    const rHandoff = run(argv(), rulesFor({ comments: handoff }));
    expect(rHandoff.status).toBe(0);
    expect(rHandoff.ghCalls.some((argv) => argv.includes("--remove-label"))).toBe(false);
  });

  // #223's review removed the hasLabel early return: a run that fell over BEFORE
  // its labels were applied still ends with a person waiting, and the waiting side
  // is what that node is missing. The turn handed back, so both labels move — the
  // stale in-progress comes off (a warning when it was not there) and the
  // waiting-for-person goes on.
  test("a node that carried no label still gets the waiting-for-person one", () => {
    const comments = [apiComment(ending("done", 41, 9, "engineer")), apiComment(claim())];
    const r = run(argv(), rulesFor({ comments, labels: LABELS_OFF }));
    expect(r.status).toBe(0);
    const edits = r.ghCalls.filter((argv) => argv[0] === "issue" && argv[1] === "edit").map((a) => a.join(" "));
    expect(edits.some((c) => c.includes("--remove-label") && c.includes("atomaton/in-progress"))).toBe(true);
    expect(edits.some((c) => c.includes("--add-label") && c.includes("atomaton/waiting-for-person"))).toBe(true);
  });

  test("a thread past one page still names its ending", () => {
    // What `gh api --paginate` writes past one page: one array per page, back to
    // back, and the ending only on the second.
    const stdout = JSON.stringify([apiComment("early remark")]) + JSON.stringify([
      apiComment("later remark"),
      apiComment(claim()),
      apiComment(ending("done", ASK, RUN_ID)),
    ]);
    const r = run(argv(), rulesFor({ commentsStdout: stdout }));
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((argv) => argv.includes("comment"))).toEqual([]);
  });

  test("a title that names no node does nothing at all, not even the read", () => {
    for (const title of ["Atomaton Runner", "deploy: apply v0.21.22", ""]) {
      const r = run(argv({ "display-title": title }), rulesFor());
      expect(r.status, title).toBe(0);
      expect(r.ghCalls, title).toEqual([]);
    }
  });

  test("a run id that cannot be read stays silent — the comparison has nothing to compare", () => {
    const r = run(argv({ "run-id": "" }), rulesFor({ comments: [apiComment(claim())] }));
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((argv) => argv.includes("comment"))).toEqual([]);
  });

  test("an entry run that never claimed stays silent, whatever its conclusion", () => {
    // The body of a new issue is the ask of the run it starts, and the body is not
    // a comment: no claim can name it, so the run took no turn the thread can
    // name. The old gate estimated this from the run's event and conclusion
    // (#281's two measurements both lived there); the identity rule answers it
    // without either — a run with no claim is silent, success or cancelled.
    for (const conclusion of ["success", "cancelled", "(absent)"]) {
      const r = run(
        argv({ "display-title": `#${NUMBER}`, ...(conclusion === "(absent)" ? {} : { conclusion }) }),
        rulesFor({ comments: [command("/engineer fix the flake", 55)] }),
      );
      expect(r.status, conclusion).toBe(0);
      expect(r.ghCalls.filter((call) => call.includes("comment"))).toEqual([]);
    }
  });

  test("the command's own run — it claimed the command — gets the notice when it dies", () => {
    // The manual-comment path: the command IS the ask, the runner claimed it at
    // start, and a death before the report leaves the claim open. The watch fires
    // for that run's completion and closes the ask with the notice.
    const comments = [command("/engineer\nfix the flake please", 55), apiComment(claim())];
    const r = run(argv({ "display-title": `#${NUMBER}` }), rulesFor({ comments }));
    expect(r.status).toBe(0);
    expect(postedNotice(r)).toContain("no answer was posted for it");
  });

  test("a run that claimed no ask stays silent — another run's claim is not its doing", () => {
    // The guard-only completion: a run whose own claim never went out (its ask was
    // the body, or it backed off the claim race) completes beside ANOTHER run's
    // open claim. The identity comparison names the claims by run id, so the
    // notice goes only to the run that claimed — the mix-up #281 measured twice
    // is not available to this gate.
    const r = run(argv(), rulesFor({ comments: [apiComment(claim(ASK, 999999)) ] }));
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((argv) => argv.includes("comment"))).toEqual([]);
  });

  test("a backed-off run's green completion is silence", () => {
    // The claim race's loser: it posted a claim, found an older one, took it back,
    // and ended having taken no turn. No claim, no ending — silence, which is what
    // losing a race looks like.
    const r = run(argv(), rulesFor({ comments: [] }));
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((argv) => argv.includes("comment"))).toEqual([]);
  });

  test("a manual-comment run on a pull request keeps the workflow's name and stays silent", () => {
    // A PR command dispatches validation instead of calling the runner — the run
    // completes without ever taking the turn. Its run-name is the workflow's own
    // name (the PR case of the expression), which no title shape reads as a node,
    // so the watch does nothing — not even the read. The PR chain is watched
    // through the runner run validation eventually starts.
    const r = run(argv({ "display-title": "Atomaton Manual Comment" }), rulesFor({ comments: [command("/reviewer ship it")] }));
    expect(r.status).toBe(0);
    expect(r.ghCalls).toEqual([]);
  });

  test("an entry run over an untouched thread stays silent", () => {
    const r = run(argv({ "display-title": `#${NUMBER}` }), rulesFor({ comments: [command("just a remark")] }));
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((argv) => argv.includes("comment"))).toEqual([]);
  });

  test("a skipped run is not a run to reconcile", () => {
    const r = run(argv({ conclusion: "skipped" }), rulesFor());
    expect(r.status).toBe(0);
    expect(r.ghCalls).toEqual([]);
  });

  test("an ending whose only evidence is a quotation does not excuse the run", () => {
    const quotation = apiComment(
      [
        "<!-- atomaton:llm-context=exclude -->",
        "<!-- atomaton:quotes=123 -->",
        "<details><summary>Your comment, as you wrote it</summary>",
        "",
        "```",
        "<!-- atomaton:ended=done answers=0 run=0 -->",
        "```",
        "</details>",
      ].join("\n"),
    );
    const r = run(argv(), rulesFor({ comments: [apiComment(claim()), quotation] }));
    expect(r.status).toBe(0);
    expect(postedNotice(r)).toBeDefined();
  });

  test("a thread that cannot be read fails the watch instead of answering no", () => {
    const rules: FakeGhRules = [
      { match: ["api", `repos/${REPO}/issues/${NUMBER}/comments`], code: 1 },
      { match: ["issue", "comment"] },
      { match: ["issue", "edit"] },
    ];
    const r = run(argv(), rules);
    expect(r.status).toBe(1);
    expect(r.ghCalls.filter((argv) => argv.includes("comment"))).toEqual([]);
  });

  test("a comment GitHub refuses fails the watch: the red run is the signal", () => {
    const r = run(argv(), rulesFor({ comments: [apiComment(claim())], postCode: 1 }));
    expect(r.status).toBe(1);
    expect(r.ghCalls.some((argv) => argv.includes("--remove-label"))).toBe(false);
  });
});
