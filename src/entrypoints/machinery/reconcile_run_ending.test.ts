import { describe, expect, test } from "bun:test";
import { runWithFakeGh, scriptPath, makeConfigDir, removeTemp } from "./testing/harness.ts";

/**
 * The run watch's reconciliation, asked of the script the workflow actually runs,
 * with the fake `gh` answering. The pure judgement lives in
 * `domain/work/run-report.test.ts`; what is pinned here is the FLOW — that the
 * gates come before the reads, that a notice carries the turn tags, and that the
 * label follows the rule the thread states.
 */

const REPO = "o/r";
const START = "2026-10-22T10:00:00Z";
const AGENT = "engineer";
const NUMBER = 7;
const RUN_URL = "https://github.com/o/r/actions/runs/123";

/** The arguments the workflow passes, as the step builds them. */
function argv(overrides: Record<string, string> = {}): string[] {
  return [
    "--display-title", overrides["display-title"] ?? `${AGENT} on #${NUMBER}`,
    "--run-started-at", overrides["run-started-at"] ?? START,
    "--run-url", overrides["run-url"] ?? RUN_URL,
    ...(overrides.conclusion === undefined ? [] : ["--conclusion", overrides.conclusion]),
    ...(overrides["run-event"] === undefined ? [] : ["--run-event", overrides["run-event"]]),
  ];
}

/** A comment as the Issues API returns it. */
function apiComment(body: string, createdAt: string, isHuman = false): Record<string, unknown> {
  return { body, created_at: createdAt, user: { type: isHuman ? "User" : "Bot" } };
}

const BEFORE = "2026-10-20T09:00:00Z";
const DURING = "2026-10-22T11:00:00Z";
const AFTER = "2026-10-23T09:00:00Z";

/** The dispatch marker the machinery posts when it is about to start a run. */
const MARKER = "<!-- atomaton:dispatch=engineer -->";

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
      stdout: JSON.stringify([MARKER, "/engineer continue here"]),
    },
    {
      match: ["api", `repos/${REPO}/issues/${NUMBER}/comments`],
      stdout: opts.commentsStdout ?? JSON.stringify(opts.comments ?? []),
    },
    { match: [`repos/${REPO}/issues/${NUMBER}`, "--jq"], stdout: opts.labels ?? LABELS_ON },
    { match: ["issue", "comment"], ...(opts.postCode === undefined ? {} : { code: opts.postCode }) },
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
    const comments = [apiComment("<!-- atomaton:ended=done -->\nDone.", AFTER)];
    const r = run(argv(), rulesFor({ comments }));
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((argv) => argv.includes("comment"))).toEqual([]);
  });

  test("a run that left no ending gets the notice, and the label the run left comes off", () => {
    // The thread as a jammed node has it: an earlier turn's ending (`done`, before
    // this run started), this run's dispatch, and nothing since — the label is the
    // dead run's leftover, and the ending predates the run, so it cannot excuse it.
    const comments = [apiComment("<!-- atomaton:ended=done -->\nDone.", BEFORE), apiComment("just a remark", "2026-10-21T09:00:00Z")];
    const r = run(argv(), rulesFor({ comments }));
    expect(r.status).toBe(0);

    const body = postedNotice(r);
    expect(body).toContain("atomaton:ended=done");
    expect(body).toContain("atomaton:llm-context=exclude");
    expect(body).toContain(AGENT);
    expect(body).toContain(RUN_URL);
    // The two ways forward, and none of the claim the deaths this covers cannot
    // back: the report step that would know is the one that never ran.
    expect(body).toContain("`/engineer` and put what to do next on the following lines");
    expect(body).toContain("`/engineer recover`");
    expect(body).not.toMatch(/session was saved/i);

    expect(r.ghCalls.some((argv) => argv.includes("--remove-label"))).toBe(true);
  });

  test("a waiting ending still releases the label; a hand-off keeps it", () => {
    const waiting = [apiComment("<!-- atomaton:ended=waiting -->", BEFORE)];
    const rWaiting = run(argv(), rulesFor({ comments: waiting }));
    expect(rWaiting.status).toBe(0);
    expect(rWaiting.ghCalls.some((argv) => argv.includes("--remove-label"))).toBe(true);

    const handoff = [apiComment("<!-- atomaton:ended=handoff -->", BEFORE)];
    const rHandoff = run(argv(), rulesFor({ comments: handoff }));
    expect(rHandoff.status).toBe(0);
    expect(rHandoff.ghCalls.some((argv) => argv.includes("--remove-label"))).toBe(false);
  });

  test("the label is left alone when the issue carries none", () => {
    const r = run(argv(), rulesFor({ comments: [apiComment("remark", BEFORE)], labels: LABELS_OFF }));
    expect(r.status).toBe(0);
    expect(r.ghCalls.some((argv) => argv.includes("--remove-label"))).toBe(false);
  });

  test("a thread past one page still names its ending", () => {
    // What `gh api --paginate` writes past one page: one array per page, back to
    // back, and the ending only on the second.
    const stdout = JSON.stringify([apiComment("early remark", BEFORE)]) + JSON.stringify([
      apiComment("later remark", "2026-10-24T09:00:00Z"),
      apiComment("<!-- atomaton:ended=done -->\nDone.", AFTER),
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

  test("an entry run that dispatched inside its own lifetime gets the notice, naming the thread's agent", () => {
    // The entry path: the title carries the node alone, and the marker the
    // machinery posted during the run is the proof it took the turn. The entry
    // run here is one a NEW ISSUE started (`run-event: issues`) that ended
    // `success` — which also pins that the marker branch of the gate is gated
    // on neither flag: a successful run that dispatched is answered by its
    // marker. The ending from the turn BEFORE is what answers the label rule —
    // a thread with no readable ending keeps its label.
    const comments = [
      apiComment("<!-- atomaton:ended=done -->\nDone.", BEFORE),
      apiComment(MARKER, AFTER),
    ];
    const r = run(argv({ "display-title": `#${NUMBER}`, "run-event": "issues", conclusion: "success" }), rulesFor({ comments }));
    expect(r.status).toBe(0);
    const body = postedNotice(r);
    expect(body).toContain("atomaton:ended=done");
    expect(body).toContain(AGENT);
    expect(r.ghCalls.some((argv) => argv.includes("--remove-label"))).toBe(true);
  });

  test("an entry run that died before any marker still gets the notice, off the person's command", () => {
    // The command's own run (started by that comment, `run-event:
    // issue_comment`), dead between the parse and the dispatch: the command —
    // written before the run started, because it is what started it — is the
    // thread's only record that a run was asked for. GitHub reports the death
    // as `cancelled`; anything but `success` opens the fallback.
    const command = apiComment("/engineer\nfix the flake please", BEFORE, true);
    const r = run(argv({ "display-title": `#${NUMBER}`, "run-event": "issue_comment", conclusion: "cancelled" }), rulesFor({ comments: [command] }));
    expect(r.status).toBe(0);
    expect(postedNotice(r)).toContain(AGENT);
  });

  test("an entry run a new issue started never claims a person's command — the command is the run it started's ask (#281, first)", () => {
    // The incident, both directions of the same thread. The entry run
    // (`issues: opened`) completed `success` while the command's own run was
    // still working; before the fix it claimed the command and posted the
    // notice beside a live run. The event that started the run is what
    // separates the two watches below — the passing of `--run-event` is the
    // point of the test.
    const command = apiComment("/atomaton\nplease look", DURING, true);
    const issueRun = run(
      argv({ "display-title": `#${NUMBER}`, "run-event": "issues", conclusion: "success" }),
      rulesFor({ comments: [command] }),
    );
    expect(issueRun.status).toBe(0);
    expect(issueRun.ghCalls.filter((call) => call.includes("comment"))).toEqual([]);

    // The same thread watched for the command's OWN run — which started after
    // the command — still gets the notice when that run dies without one.
    const commandRun = run(
      argv({ "display-title": `#${NUMBER}`, "run-started-at": AFTER, "run-event": "issue_comment", conclusion: "cancelled" }),
      rulesFor({ comments: [command] }),
    );
    expect(commandRun.status).toBe(0);
    expect(postedNotice(commandRun)).toBeDefined();
  });

  test("a command-consuming run that ended success stays silent on the command it never consumed (#281, second)", () => {
    // The second measurement, the same thread watched twice. A plan comment
    // started run A (`issue_comment`); the person's command landed one second
    // later and started run B. Run A decided at parse that nothing was to
    // dispatch and ended `success` — carrying its own judgment through — yet
    // its watch still found the command as the thread's newest ask, written
    // before run A started, and posted the notice with run A's URL while run B
    // was working. The conclusion is what separates the two watches: the same
    // thread, watched for run B — started after the command, dead `cancelled`
    // before any marker — still gets the notice.
    const command = apiComment("/atomaton\nplease look", BEFORE, true);
    const silent = run(
      argv({ "display-title": `#${NUMBER}`, "run-event": "issue_comment", conclusion: "success" }),
      rulesFor({ comments: [command] }),
    );
    expect(silent.status).toBe(0);
    expect(silent.ghCalls.filter((call) => call.includes("comment"))).toEqual([]);

    const notice = run(
      argv({ "display-title": `#${NUMBER}`, "run-started-at": AFTER, "run-event": "issue_comment", conclusion: "cancelled" }),
      rulesFor({ comments: [command] }),
    );
    expect(notice.status).toBe(0);
    expect(postedNotice(notice)).toBeDefined();
  });

  test("a command written during a cancelled run is the next run's ask, not this run's", () => {
    // The time condition at the script level: the command arrived while the run
    // was going, so it started the run that follows, and this run's death —
    // even a `cancelled` one, the shape the fallback exists for — must not
    // claim it.
    const command = apiComment("/engineer\nalso this", DURING, true);
    const r = run(
      argv({ "display-title": `#${NUMBER}`, "run-event": "issue_comment", conclusion: "cancelled" }),
      rulesFor({ comments: [command] }),
    );
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((call) => call.includes("comment"))).toEqual([]);
  });

  test("a watch run whose conclusion never arrived stays silent", () => {
    // The workflow always passes `--conclusion`, so an absent one answers a
    // caller from before the field existed — and an unreadable fact lands on
    // silence, the direction every unreadable input here takes.
    const command = apiComment("/engineer\nfix the flake please", BEFORE, true);
    const r = run(argv({ "display-title": `#${NUMBER}`, "run-event": "issue_comment" }), rulesFor({ comments: [command] }));
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((call) => call.includes("comment"))).toEqual([]);
  });

  test("an entry run that took no turn stays silent — a notice there would unjam a LIVE run", () => {
    // The guard-only completion: a person's remark raced a run in flight, the
    // guard removed it, and this run completed `cancelled`. The thread's marker
    // is an OLDER run's — posting here would hand the turn back while that run
    // still holds it.
    const r = run(argv({ "display-title": `#${NUMBER}`, "run-event": "issue_comment", conclusion: "cancelled" }), rulesFor({ comments: [apiComment(MARKER, BEFORE)] }));
    expect(r.status).toBe(0);
    expect(r.ghCalls.filter((argv) => argv.includes("comment"))).toEqual([]);
  });

  test("a manual-comment run on a pull request keeps the workflow's name and stays silent", () => {
    // The second reviewer finding: `issue_comment` fires for pull requests too, and
    // a PR command dispatches validation instead of calling the runner — the run
    // completes without ever taking the turn. Its run-name is the workflow's own
    // name (the PR case of the expression), which no title shape reads as a node,
    // so the watch does nothing — not even the read. The PR chain is watched
    // through the runner run validation eventually starts.
    const command = apiComment("/reviewer ship it", BEFORE, true);
    const r = run(argv({ "display-title": "Atomaton Manual Comment" }), rulesFor({ comments: [command] }));
    expect(r.status).toBe(0);
    expect(r.ghCalls).toEqual([]);
  });

  test("an entry run over an untouched thread stays silent", () => {
    const r = run(argv({ "display-title": `#${NUMBER}`, "run-event": "issues" }), rulesFor({ comments: [apiComment("just a remark", AFTER, true)] }));
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
        "<!-- atomaton:ended=done -->",
        "```",
        "</details>",
      ].join("\n"),
      AFTER,
    );
    const r = run(argv(), rulesFor({ comments: [quotation] }));
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
    const r = run(argv(), rulesFor({ comments: [apiComment("remark", BEFORE)], postCode: 1 }));
    expect(r.status).toBe(1);
    expect(r.ghCalls.some((argv) => argv.includes("--remove-label"))).toBe(false);
  });
});
