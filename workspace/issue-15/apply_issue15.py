import sys

REPO = "/home/runner/work/atomaton/atomaton/"
pending = {}

def load(path):
    if path not in pending:
        pending[path] = open(REPO + path).read()
    return pending[path]

def sub(path, old, new, label):
    s = load(path)
    n = s.count(old)
    if n != 1:
        print(f"FAIL [{label}] {path}: {n} occurrences")
        print("----- old -----")
        print(old)
        sys.exit(1)
    pending[path] = s.replace(old, new)

# ---------------------------------------------------------------- atomaton.ts
P = "src/entrypoints/tools/mcp/atomaton.ts"

sub(P, '''  /**
   * Where the report goes for the one exit that had nowhere to put it.
   *
   * Four calls end a session. `create_pr` carries the report in `body`,
   * `request_close_issue` in `summary`, `reload_environment` in `reason` -- and
   * this one carried nothing, while being the atomaton's most frequent exit.
   * The session stops the moment it returns, so there is no later turn to write
   * in: a run that meant to report after dispatching never reports at all.
   *
   * Optional rather than required, and deliberately so: a partial dispatch leaves
   * the session OPEN (see `handleLaunchSubAgent`), and on that path the closing
   * text is still the report. Required here would make the failure path demand
   * the report twice.
   *
   * Same shape as `REQUEST_CLOSE_ISSUE_SCHEMA.summary` below, because it is the
   * same fact -- what this run concluded -- reaching the thread the same way.
   */
  summary: z
    .string()
    .optional()
    .describe(
      "Your report for this run. It is folded into the dispatch comment on the issue you are on, " +
        "behind a `<details>`, so keep it short: what you concluded and what happens next, not the " +
        "full four-part report. This call ends your session when every dispatch succeeds, so there " +
        "is no turn after it to write one in.",
    ),
});

const REQUEST_CLOSE_ISSUE_SCHEMA = z.object({
  reason: z
    .string()
    .min(1)
    .describe(
      "Why this issue's work is considered complete — one sentence. It is printed directly " +
        "above `summary`, so anything longer is the same judgement written twice.",
    ),
  summary: z.string().optional().describe("Final summary to include in the posted comment (e.g. an aggregation report)."),
});''', '''  // No report argument, deliberately.
  //
  // This call ends the session once every dispatch succeeds, and the comment it leaves
  // on the issue is the record: what was launched, and nothing else. Text typed into a
  // report argument here had one reader -- a person opening a fold -- while the next run
  // reads the task list back off the session, and each child's own report arrives on the
  // thread when that child closes. An argument that carries text nothing is handed is the
  // argument the next one gets added beside.
});

const REQUEST_CLOSE_ISSUE_SCHEMA = z.object({
  summary: z
    .string()
    .min(1)
    .describe(
      "The comment this call posts, as its body: what you concluded, and why the work is complete. " +
        "The parent's aggregation reads this same text.",
    ),
});''', "launch+close schema")

sub(P, '''  // One comment on the PARENT issue, not two -- and only when something was dispatched.
  //
  // The audit line and the report used to be separate comments: the machine's
  // list of what it dispatched, and the report the run concluded. Two comments
  // for one event read as two events, and the report -- four sections, written
  // for the next run -- dominated the thread a person scrolls past. Folded into
  // one comment with the report behind a `<details>`, the thread shows what was
  // launched and the report is one click away.
  //
  // The report is not lost to the next run by being folded in here. It travels
  // twice: as this comment, and as the `summary` argument of the `launch_sub_agent`
  // call itself, which the session keeps as a tool call. The comment is the copy a
  // person reads; the tool call is the copy the next run is handed. So the exclude
  // tag below -- which keeps this comment out of the next run's context -- costs
  // the next run nothing.
  //
  // Posted even on a partial dispatch: the session stays open there, but a report
  // the agent has already written is not worth discarding for that.
  //
  // NOT posted when nothing was dispatched (#231). The tool refuses below and the
  // session stays open, so the report still reaches the thread -- as the agent's own
  // result comment on the next turn. Posted here it landed BEFORE that comment, as a
  // summary with no dispatch line above it, and read as a conclusion the next comment
  // then contradicted.
  const summary = (args.summary ?? "").trim();
''', '''  // One comment on the PARENT issue, not two -- and only when something was dispatched.
  //
  // What it carries is the dispatch list, because that is the whole of what this call
  // records. It used to fold the run's report in behind a `<details>` as well, and that
  // report had exactly one reader: the comment is tagged `exclude` (below), so the next
  // run never read it, and the run's own text had no other copy to reach the thread.
  //
  // Posted even on a partial dispatch: the session stays open there, and the list of what
  // did go out is not worth discarding for that.
  //
  // NOT posted when nothing was dispatched (#231). The tool refuses below and the session
  // stays open, so the agent's own result comment on the next turn is where the thread
  // learns what happened. Posted here it landed BEFORE that comment, as a notice with no
  // dispatch line above it, and read as a conclusion the next comment then contradicted.
''', "launch handler comment")

sub(P, '''    if (dispatched.length) {
      bodyLines.push("Atomaton: Launched sub-agent(s):", ...dispatched.map((d) => `- ${d}`));
    }
    if (summary) {
      bodyLines.push("", "<details><summary>Report</summary>", "", summary, "", "</details>");
    }
''', '''    if (dispatched.length) {
      bodyLines.push("Atomaton: Launched sub-agent(s):", ...dispatched.map((d) => `- ${d}`));
    }
''', "launch fold")

sub(P, '''  const reason = args.reason.trim();
  const summary = (args.summary ?? "").trim();

  if (!reason) mcpFail("reason must be a non-empty string");
''', '''  const summary = args.summary.trim();
  if (!summary) mcpFail("summary must be a non-empty string");
''', "close handler args")

sub(P, '''  log(`Concluding issue #${issueNumber}: reason=${JSON.stringify(reason)}`);''',
       '''  log(`Concluding issue #${issueNumber}: summary=${JSON.stringify(summary)}`);''', "close log")

sub(P, '''    result = await concludeIssue(issueNumber, reason, summary);''',
       '''    result = await concludeIssue(issueNumber, summary);''', "concludeIssue call")

sub(P, '''  const concluded = `Issue #${issueNumber} is concluded: your reason and summary are on the issue.`;''',
       '''  const concluded = `Issue #${issueNumber} is concluded: your summary is on the issue.`;''', "concluded text")

sub(P, '''  reason: z
    .string()
    .min(1)
    .describe(
      "What you need the environment to have that it does not, in one sentence. Recorded on the issue so a " +
        "person reading it later can see why the run restarted.",
    ),''', '''  reason: z
    .string()
    .min(1)
    .describe(
      "What you need the environment to have that it does not, in one sentence — and the report this " +
        "run leaves, because the session ends on this call. Recorded on the issue in the handoff comment, " +
        "so a person reading it later can see why the run restarted.",
    ),''', "reload reason describe")

sub(P, '''      "Each sub-issue's body is the hand-off: write there how the work divides among its siblings, " +
      "any interface they share, and what has already been decided — the child starts from its own " +
      "issue's thread, not from this one's. " +
      "Put your report in `summary`: the atomaton session ends immediately after this call " +
      "returns, so there is no turn afterwards in which to write one. " +
      "The atomaton will be automatically re-invoked when ALL sub-issues are closed.",
    schema: LAUNCH_SUB_AGENT_SCHEMA,
    handler: handleLaunchSubAgent,
  }),
  defineMcpTool({
    name: "request_close_issue",
    description:
      "Conclude work on YOUR CURRENT issue and end your session. This is the ONLY " +
      "correct way to finish an issue -- do NOT just stop responding without calling " +
      "this. Your reason and summary are posted to the issue, and phase-gating/" +
      "aggregation is triggered for its parent when this is a sub-issue. Whether the " +
      "close happens now or the issue's author is asked to make it is this tool's " +
      "decision and not yours -- it is the same call either way, and your session " +
      "ends when it returns. The call is refused on a pull request run: a pull " +
      "request has no issue to conclude, and its outcome is merge_pr and the " +
      "post-merge dispatch, not this tool.",
    schema: REQUEST_CLOSE_ISSUE_SCHEMA,
    handler: handleRequestCloseIssue,
  }),''', '''      "Each sub-issue's body is the hand-off: write there how the work divides among its siblings, " +
      "any interface they share, and what has already been decided — the child starts from its own " +
      "issue's thread, not from this one's. " +
      "This call takes no report: it ends the session, and the dispatch comment is its record. " +
      "The atomaton will be automatically re-invoked when ALL sub-issues are closed.",
    schema: LAUNCH_SUB_AGENT_SCHEMA,
    handler: handleLaunchSubAgent,
    guidance: (args) =>
      "summary" in args
        ? "`summary` is gone: this call takes no report, and the dispatch comment is its record. " +
          "The refusal keeps your turn — write the report as your closing message instead."
        : undefined,
  }),
  defineMcpTool({
    name: "request_close_issue",
    description:
      "Conclude work on YOUR CURRENT issue and end your session. This is the ONLY " +
      "correct way to finish an issue -- do NOT just stop responding without calling " +
      "this. Your summary is posted to the issue as the comment body, and phase-gating/" +
      "aggregation is triggered for its parent when this is a sub-issue. Whether the " +
      "close happens now or the issue's author is asked to make it is this tool's " +
      "decision and not yours -- it is the same call either way, and your session " +
      "ends when it returns. The call is refused on a pull request run: a pull " +
      "request has no issue to conclude, and its outcome is merge_pr and the " +
      "post-merge dispatch, not this tool.",
    schema: REQUEST_CLOSE_ISSUE_SCHEMA,
    handler: handleRequestCloseIssue,
    guidance: (args) =>
      "reason" in args
        ? "`reason` is gone: put that sentence at the start of `summary`, which is now the whole " +
          "comment body."
        : undefined,
  }),''', "descriptions+guidance")

# ------------------------------------------------------------ conclude_issue.ts
P = "src/entrypoints/tools/lib/conclude_issue.ts"

sub(P, '''export async function concludeIssue(issue: number, reason: string, summary: string): Promise<ConcludeIssueResult> {''',
       '''export async function concludeIssue(issue: number, summary: string): Promise<ConcludeIssueResult> {''', "conclude signature")

sub(P, '''  let body = `Atomaton: the agent on this issue considers its work complete.\\n\\n**Reason:** ${reason}`;
  if (summary) {
    body += `\\n\\n${summary}`;
  }

  if (!isBot) {
    // The request goes above the reason and summary, not after them. It is the
    // only sentence in the comment addressed to the person reading it.''',
       '''  // The summary IS the comment body. It used to sit under one `**Reason:**` line that
  // said the same judgement in a second sentence -- measured at 44.8% of a close comment
  // on #4, restating the conclusion printed below it. One body, written once.
  const body = `Atomaton: the agent on this issue considers its work complete.\\n\\n${summary}`;

  if (!isBot) {
    // The request goes above the summary, not after it. It is the only sentence in the
    // comment addressed to the person reading it.''', "conclude body")

sub(P, '''  // The conclusion itself. `audience: "model"` because this is what the parent agent
  // reads when it aggregates what its children found — the reason and the summary are
  // written for that reader, and were reaching it only because an untagged comment is
  // included by default rather than by anybody deciding.''',
       '''  // The conclusion itself. `audience: "model"` because this is what the parent agent
  // reads when it aggregates what its children found — the summary is written for that
  // reader, and was reaching it only because an untagged comment is included by default
  // rather than by anybody deciding.''', "conclude audience comment")

sub(P, '''  // dispatches the parent or stands down with an outcome a person has to resolve.
  // `reason` as well as `summary`: the reason is the one sentence saying what kind of
  // completion this is, and it is already written for the same reader.
  reportSubIssueToParent(repo, issue, [reason, summary].filter(Boolean).join("\\n\\n"));''',
       '''  // dispatches the parent or stands down with an outcome a person has to resolve.
  reportSubIssueToParent(repo, issue, summary);''', "conclude parent report")

# -------------------------------------------------------------------- github.ts
sub("src/entrypoints/tools/mcp/github.ts",
    '''  body: z.string().optional().describe("Pull request body in GitHub-flavored Markdown. Atomaton adds issue traceability metadata automatically."),''',
    '''  body: z.string().optional().describe("Pull request body in GitHub-flavored Markdown — and where your report goes when this call ends the session. Atomaton adds issue traceability metadata automatically."),''',
    "create_pr body describe")

# ---------------------------------------------------------- prompt-template.md
sub("src/content/prompt-template.md",
'''Some outcomes end the session inside a tool call, because something else starts
the moment it returns. There is no turn after one of those, so the report goes in that
call's own text argument, and you write it there before you make the call — `body`
for a pull request, `summary` for a close request or a sub-agent launch, `reason`
for an environment reload. A report you meant to write afterwards is never written.''',
'''Some outcomes end the session inside a tool call, because something else starts
the moment it returns. There is no turn after one of those, so what you have to
say goes in the call itself, and you write it there before you make the call.
Which argument carries it belongs to the tool: its description says so, and a
call whose own work is the record — a dispatch — takes no report at all. A report
you meant to write afterwards is never written.''', "prompt paragraph")

# --------------------------------------------------------------- atomaton.md
sub("src/content/agent-definitions/atomaton.md",
'''`request_close_issue` carries the consolidated result in `summary`. Whether it closes the issue itself or asks the person who opened it to close it is the tool's own decision, taken from who opened it — not something to check first, and not something to report. Never replace the call with a plain final response.

**The conclusion is written once.** Whatever this run was waiting on is on the
thread above it — a child's report, a merged pull request, the comment the issue
asked for. `summary` adds what that does not already say: what you verified, and
the judgement you reached from verifying it. It points at the artifact instead of
repeating it. `reason` is one sentence, because it is printed directly above the
summary; anything longer is the same judgement written twice.''',
'''`request_close_issue` carries the consolidated result in `summary`. Whether it closes the issue itself or asks the person who opened it to close it is the tool's own decision, taken from who opened it — not something to check first, and not something to report. Never replace the call with a plain final response.

`launch_sub_agent` takes no report. It ends the session, and the dispatch comment on this issue is its record. What a conclusion is for here belongs in the sub-issue bodies, because that is where each child starts.

**The conclusion is written once.** Whatever this run was waiting on is on the
thread above it — a child's report, a merged pull request, the comment the issue
asked for. `summary` adds what that does not already say: what you verified, and
the judgement you reached from verifying it. It points at the artifact instead of
repeating it, and it is the whole comment this call posts.''', "atomaton definition")

# --------------------------------------------------------------- close-request
sub("src/domain/work/close-request.test.ts",
'''    const comment = closeRequestComment({ notify: "alice", body: "Atomaton: work complete.\\n\\n**Reason:** merged" });
    const [first] = comment.split("\\n");
    expect(first).toBe(`@alice ${CLOSE_REQUEST_LINE}`);
    // The report follows it rather than burying it.
    expect(comment.indexOf(CLOSE_REQUEST_LINE)).toBeLessThan(comment.indexOf("**Reason:**"));''',
'''    const comment = closeRequestComment({ notify: "alice", body: "Atomaton: work complete.\\n\\nIt landed." });
    const [first] = comment.split("\\n");
    expect(first).toBe(`@alice ${CLOSE_REQUEST_LINE}`);
    // The report follows it rather than burying it.
    expect(comment.indexOf(CLOSE_REQUEST_LINE)).toBeLessThan(comment.indexOf("It landed."));''',
    "close-request fixture")

# ------------------------------------------------------------------- e2e x2
for p in ("tests/e2e/request-close-issue.e2e.test.ts", "tests/e2e/request-close-issue-aggregation.e2e.test.ts"):
    sub(p, 'arguments: { reason: "All done", summary: "Shipped it." }',
           'arguments: { summary: "All done. Shipped it." }', "e2e " + p)

# ---------------------------------------------------------------- mcp.test.ts
P = "src/entrypoints/tools/mcp/mcp.test.ts"

# schema test + guidance tests
sub(P, '''  test("launch_sub_agent rejects empty tasks", async () => {''',
'''  /**
   * No report argument, and the schema says so.
   *
   * A report typed here had one reader -- a person opening a fold in the dispatch
   * comment -- while the next run reads the task list back off the session, and each
   * child's own report arrives on the thread when it closes. Pinned by name, because an
   * argument is where the next report gets added.
   */
  test("launch_sub_agent advertises no report argument", async () => {
    const r = await sendRequest("atomaton.ts", {
      jsonrpc: "2.0", id: 8, method: "tools/list", params: {},
    });
    const tool = r.result.tools.find((t: { name: string }) => t.name === "launch_sub_agent");
    expect(tool.inputSchema.properties).not.toHaveProperty("summary");
  });

  test("launch_sub_agent rejects empty tasks", async () => {''', "mcp schema test")

sub(P, '''    // And names the route the pull request run has instead.
    expect(r.result.content[0].text).toContain("merge_pr");
  });''',
'''    // And names the route the pull request run has instead.
    expect(r.result.content[0].text).toContain("merge_pr");
  });

  /**
   * A prompt that still writes a retired argument gets told what to do with the
   * sentence, not only that the key is unknown. The schema is strict, and both calls
   * end a session -- so this refusal is the one turn in which the agent can still move
   * what it wrote somewhere it is read.
   */
  test("request_close_issue's refusal moves a retired `reason` into `summary`", async () => {
    const r = await sendRequest(
      "atomaton.ts",
      {
        jsonrpc: "2.0", id: 35, method: "tools/call",
        params: { name: "request_close_issue", arguments: { reason: "done" } },
      },
      { ...fakeGhSeam(), NUMBER: "5" },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("`reason` is gone");
    expect(r.result.content[0].text).toContain("start of `summary`");
  });

  test("launch_sub_agent's refusal names the retired `summary` and keeps the turn", async () => {
    const r = await sendRequest(
      "atomaton.ts",
      {
        jsonrpc: "2.0", id: 36, method: "tools/call",
        params: {
          name: "launch_sub_agent",
          arguments: { tasks: [{ issue: 7, agent: "engineer" }], summary: "Split the work." },
        },
      },
      { ...fakeGhSeam(), NUMBER: "3" },
    );
    expect(r.result.isError).toBe(true);
    expect(r.result.content[0].text).toContain("`summary` is gone");
    expect(r.result.content[0].text).toContain("keeps your turn");
  });''', "mcp guidance tests")

# human close path: args + assertions (unique block with NUMBER 12)
sub(P, '''            name: "request_close_issue",
            arguments: { reason: "the work is delivered", summary: "It landed in #123." },
          },
        },
        {
          ...fakeGhSeam(),
          NUMBER: "12",''',
'''            name: "request_close_issue",
            arguments: { summary: "The work is delivered — it landed in #123." },
          },
        },
        {
          ...fakeGhSeam(),
          NUMBER: "12",''', "mcp human close args")

sub(P, '''      expect(body).toContain("please close it yourself");
      // The reason and summary ride on the request: they are what the person reads
      // to decide whether the work is done.
      expect(body).toContain("**Reason:** the work is delivered");
      expect(body).toContain("It landed in #123.");
      // The ask comes before the report, because it is the sentence the reader acts on.
      expect(body.indexOf("please close it yourself")).toBeLessThan(body.indexOf("**Reason:**"));''',
'''      expect(body).toContain("please close it yourself");
      // The summary is the whole body the person reads to decide whether the work is
      // done — there is no second line restating it above.
      expect(body).toContain("The work is delivered — it landed in #123.");
      expect(body).not.toContain("**Reason:**");
      // The ask comes before the report, because it is the sentence the reader acts on.
      expect(body.indexOf("please close it yourself")).toBeLessThan(body.indexOf("The work is delivered"));''',
    "mcp human close assertions")

# PR refusal test arg
sub(P, '''        params: { name: "request_close_issue", arguments: { reason: "done" } },''',
       '''        params: { name: "request_close_issue", arguments: { summary: "done" } },''',
    "mcp pr refusal arg")

# #231 docstring
sub(P, '''   * #231: a dispatch that refused every task still posted the report on the parent.
   *
   * The run's own report is not this call's to post when nothing was dispatched: the
   * tool refuses, the session stays OPEN, and the agent writes its result comment on
   * the next turn. Posted here it landed BEFORE that comment, as a summary with no
   * dispatch line above it, and read as a conclusion the next comment contradicted.''',
'''   * #231: a dispatch that refused every task still posted a comment on the parent.
   *
   * The run's own words are not this call's to post when nothing was dispatched: the
   * tool refuses, the session stays OPEN, and the agent writes its result comment on
   * the next turn. Posted here it landed BEFORE that comment, as a notice with no
   * dispatch line above it, and read as a conclusion the next comment contradicted.''',
    "mcp 231 docstring")

# launch fixture with summary (nothing dispatched)
sub(P, '''            arguments: {
              tasks: [{ issue: 7, agent: "engineer" }],
              summary: "Created #230 as a root issue and started it there.",
            },''',
'''            arguments: {
              tasks: [{ issue: 7, agent: "engineer" }],
            },''', "mcp launch fixture one")

# launch fixture with summary (dispatch comment ends turn)
sub(P, '''arguments: { tasks: [{ issue: 7, agent: "engineer" }], summary: "Split the work." },''',
       '''arguments: { tasks: [{ issue: 7, agent: "engineer" }] },''', "mcp launch fixture two")

# remaining two ending-comment tests: same 12-space pattern (2 occurrences -> replace all)
s = load(P)
old = '''            arguments: { reason: "the work is delivered", summary: "It landed in #123." },'''
new = '''            arguments: { summary: "The work is delivered. It landed in #123." },'''
n = s.count(old)
if n != 2:
    print(f"FAIL mcp ending-comment args: {n}")
    sys.exit(1)
pending[P] = s.replace(old, new)

# parent-report test args
sub(P, '''              reason: "the work is delivered",
              // A directive line, because that is how an agent's report ordinarily ends
              // and it must not reach the parent as a request for an agent — see the
              // assertion below.
              summary: "It landed in #123.\\n\\n/atomaton",''',
'''              // A directive line, because that is how an agent's report ordinarily ends
              // and it must not reach the parent as a request for an agent — see the
              // assertion below.
              summary: "The work is delivered. It landed in #123.\\n\\n/atomaton",''',
    "mcp parent report args")

sub(P, '''      expect(body).toContain("Sub-issue #5");
      expect(body).toContain("the work is delivered");
      expect(body).toContain("It landed in #123.");''',
'''      expect(body).toContain("Sub-issue #5");
      expect(body).toContain("The work is delivered. It landed in #123.");''',
    "mcp parent report assertions")

# ------------------------------------------------------- agent-prompts.test.ts
sub("tests/contract/agent-prompts.test.ts",
'''  /**
   * And it has to say where the report goes when there is no turn left to write it in.
   *
   * A session-ending tool call stops the inference loop the moment it returns, so a run
   * that meant to report afterwards never does. Measured: 27 of 108 engineer runs left
   * no report at all, and the shape they share is the successful one -- the run opened
   * its pull request and stopped. The report is not missing from those runs, it is in a
   * tool argument, and nothing said so.
   *
   * Every one of those calls carries a text argument now, `launch_sub_agent` included.
   * That one had none until this change: three of the four session-ending calls carried
   * the report and the fourth did not, which is an exception rather than a gap in the
   * contract. Pinned by argument name, because the name is the part a run has to get
   * right.
   */
  test("the report has a named place in every call that ends the session", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    expect(prompt).toContain("the report goes in that");
    expect(prompt, "and before the call, because there is no after").toContain(
      "before you make the call",
    );
    for (const argument of ["`body`", "`summary`", "`reason`"]) {
      expect(prompt, `the report's place must be named: ${argument}`).toContain(argument);
    }
  });''',
'''  /**
   * And it has to say where what a run has to say goes, when there is no turn left to
   * write it in.
   *
   * A session-ending tool call stops the inference loop the moment it returns, so a run
   * that meant to report afterwards never does. Measured: 27 of 108 engineer runs left
   * no report at all, and the shape they share is the successful one -- the run opened
   * its pull request and stopped. The report is not missing from those runs, it is in the
   * call, and nothing said so.
   *
   * Two things changed since that measurement. The names of the arguments are no longer
   * the prompt's to write down: the prompt is adopted by a project and the tool schemas
   * are not, so a paragraph that lists them goes stale in an adopter's tree the moment an
   * argument is renamed. The tool's own description carries the name, and this test holds
   * the general sentence that sends a run there. And a call whose work IS the record (a
   * dispatch) carries no report at all, so the contract cannot promise one everywhere --
   * only that no run loses what it meant to say inside a call.
   */
  test("the report's place in a session-ending call is the tool's to name", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    expect(prompt, "what a run has to say goes in the call itself").toContain(
      "goes in the call itself",
    );
    expect(prompt, "and before the call, because there is no after").toContain(
      "before you make the call",
    );
    expect(prompt, "which argument carries it is the tool's answer").toContain(
      "its description says so",
    );
    // The retired enumeration, pinned by the phrase that opened it: a prompt that lists
    // argument names is one that has to be edited in every adopter's tree.
    expect(prompt, "the prompt must not enumerate the argument names").not.toContain(
      "for a pull request,",
    );
  });''', "agent-prompts contract test")

for path, text in pending.items():
    open(REPO + path, "w").write(text)
    print("wrote", path)
print("ALL OK")
