import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { WORKSPACE_PATH } from "../../src/domain/work/workspace.ts";

describe("agent prompt contracts", () => {
  test("uses decompose-first delegation with an explicit engineer leaf gate", () => {
    const atomaton = readFileSync("src/content/agent-definitions/atomaton.md", "utf8");
    expect(atomaton).toContain("assign them to `atomaton` by default");
    expect(atomaton).toContain("only when it satisfies every leaf condition");
    expect(atomaton).toContain("File count and apparent effort do not determine leaf status");
  });

  /**
   * An opinion asked for is answered, and nothing is started for it.
   *
   * The shared template already says a question is an outcome (`What was asked is a
   * question`), and it was not enough. #220 reports the crossing on #204: a comment
   * asking what it thought came back as sub-issues and dispatched work. #209 is the
   * same boundary at the end of a run — asked to investigate, the orchestrator had no
   * row for a report and reached for the close, which #209's own investigation traced
   * to this table as well as to the tool's "only correct way"; that report is on the
   * thread, and this change is the table half. The table is the last thing a run in
   * this role reads before choosing how to end, so the boundary is stated beside it
   * rather than only in the shared exit three sections up.
   *
   * The close rule is the same boundary seen from the end of the run: an issue whose
   * deliverable is the answer is not the issue `request_close_issue` was written for,
   * and the issue stays open for the person who asked. The tool half -- its description
   * stopped calling itself the only correct way -- is pinned in `mcp/mcp.test.ts` as
   * "request_close_issue is for delivered work, and names the exit it is not".
   *
   * Pinned as single-line fragments, because these files are wrapped prose and a phrase
   * spanning a line break also picks up whatever indentation wraps it.
   */
  test("an opinion asked of the orchestrator is answered rather than acted on", () => {
    const atomaton = readFileSync("src/content/agent-definitions/atomaton.md", "utf8");
    expect(atomaton, "the boundary needs a section of its own").toContain(
      "## What the person asked for",
    );
    expect(atomaton, "an ask for an opinion is answered by the answer").toContain(
      "is answered by the answer",
    );
    expect(atomaton, "and nothing is created or dispatched for it").toContain(
      "no sub-issue, dispatch nobody, and start none of the work",
    );
    expect(atomaton, "an investigation is reported, and the issue is left open").toContain(
      "leave the issue open",
    );
    expect(
      atomaton,
      "but a sub-issue's answer goes back to the parent that asked, so it closes",
    ).toContain("the close is how the answer travels back");
    expect(
      atomaton,
      "the general rule has to include that close, or the row above it reads as forbidden",
    ).toContain("a child issue's report on its way back");
    expect(atomaton, "a person's question stays open until they decide").toContain(
      "It is not for a question a person asked",
    );
  });

  /**
   * The orchestrator's first move is a hand-off, and its own hands are for the
   * mechanical parts.
   *
   * #212: it split the work and then wrote the larger changes itself instead of
   * handing them to `engineer`. The definition was not silent — it said "you may do
   * it yourself" and put "do it yourself" in the outcome table — so the permission was
   * the instruction. The role statement, the section that carried it and the row that
   * chose it now point one way.
   */
  test("the orchestrator hands implementation to the engineer and keeps the mechanical edits", () => {
    const atomaton = readFileSync("src/content/agent-definitions/atomaton.md", "utf8");
    expect(atomaton, "the role statement says whose code it is").toContain(
      "Code that changes behaviour is not yours to write",
    );
    expect(atomaton, "an engineer-ready leaf is handed over, not done here").toContain(
      "do it yourself only when the change is small and mechanical",
    );
    expect(atomaton, "including the leaf that is already one child's worth").toContain(
      "hand it to `engineer` when it is one",
    );
  });

  /**
   * The one-line role summary says the same thing as the contract under it.
   *
   * That line is not a summary nobody reads: it is the briefing the other agents get
   * when they are told who they can hand work to, which is the list a handoff line is
   * written from (`docs/agents/reference.md:118`). It said "does the work when it is
   * one leaf" while the body had just been changed to hand the leaf to `engineer` --
   * the same permission-outranks-the-rule shape #212 was opened for, in the one place
   * the restoring agent does not read.
   *
   * Both copies, because there are two: the frontmatter YAML the core parses, and the
   * table row `src/content/README.md` shows a reader. They drift silently, so what is
   * pinned is the sentence they share rather than either file's punctuation around it.
   */
  test("the role summary matches the contract it summarises", () => {
    const atomaton = readFileSync("src/content/agent-definitions/atomaton.md", "utf8");
    const frontmatter = atomaton.split(/^---$/m)[1] ?? "";
    const description = /^description:\s*(.+)$/m.exec(frontmatter)?.[1]?.trim() ?? "";
    const summary =
      "decomposes work into sub-issues, hands implementation to `engineer`, and aggregates what its children deliver";
    expect(description, "the frontmatter the core reads").toContain(summary);
    expect(
      readFileSync("src/content/README.md", "utf8"),
      "and the table row a reader sees, carrying the same sentence",
    ).toContain(summary);
    for (const [what, text] of [
      ["the frontmatter", description],
      ["the README row", readFileSync("src/content/README.md", "utf8")],
    ] as const) {
      expect(text, `${what} must not restore the default #212 measured`).not.toContain(
        "does the work when it is one leaf",
      );
    }
  });

  /**
   * The outcome that did not exist, and the run that measured its absence.
   *
   * The engineer's `Outcome` table was five rows, all of them "implement and open a
   * pull request" or "refuse". Asked for an inventory, it spent 200 iterations and
   * 324 shell calls and posted nothing -- because there was no outcome to arrive at.
   * The shared template says a run asked to investigate is not blocked on anything;
   * the engineer's own contract overrode that with a seven-step pipeline to a PR.
   *
   * Pinned because the failure is invisible: a run that never arrives looks like a
   * run that is still working, right up to the iteration limit.
   *
   * ## Why this now reads the template rather than `engineer.md`
   *
   * Because the same failure was then measured on an agent that never had the row.
   * An orchestrator asked to explain something built a sub-issue and dispatched an
   * engineer at it, and ten orchestrator sessions ended by answering a question its
   * outcome table had no line for. The exit is not the engineer's; it belongs to
   * any run that can be asked a question, which is all three. So it is stated once,
   * in the shared template, beside the two other exits every role shares -- and
   * what this guards is that it exists somewhere an agent reads, not which file
   * that is.
   */
  test("an agent asked a question has somewhere to arrive", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    expect(prompt, "the shared exits must offer answering as an outcome").toContain(
      "What was asked is a question",
    );
    // And a rule for when to stop looking, which is the other half: an outcome you
    // can reach is no use if nothing says when you have enough to reach it.
    expect(prompt).toContain("An investigation ends when you can answer what was asked");
    expect(prompt).toContain("write what you have and name what you could not establish");
    // The role contracts must not answer it a second time in their own words. Three
    // vocabularies for one exit is what put the reviewer's outcomes under a heading
    // the other two do not have, and left the orchestrator's table a row short.
    for (const role of ["engineer", "atomaton", "reviewer"]) {
      const text = readFileSync(`src/content/agent-definitions/${role}.md`, "utf8");
      expect(text, `${role}.md must point at the shared exits rather than restating them`).toContain(
        "The three outcomes every role shares are in `Ending a run` above",
      );
    }
  });

  test("prevents engineers from implementing unresolved non-leaf work", () => {
    const engineer = readFileSync("src/content/agent-definitions/engineer.md", "utf8");
    expect(engineer).toContain("If it is not engineer-ready, do not edit");
    expect(engineer).toContain("Return `/atomaton` on the first line");
  });

  /**
   * The three properties of the skill wording, rather than the sentence carrying them.
   * This test used to pin "Load each relevant skill with ..." word for word, which said
   * nothing about why that sentence had to be there and broke on the rewrite that fixed
   * it.
   *
   * Each is a measured failure. A run that needed `research/web-search` read the skill
   * file with `sed` instead of loading it, then spent 240 shell searches inside a
   * repository that did not hold the answer -- so the prompt has to name the tool, say a
   * skill replaces your own approach rather than informing it, and say to look at the
   * catalog again when the work changes shape. That run loaded skills twice, both times
   * in its first minute.
   *
   * ## What it no longer pins
   *
   * `reviewer.md` used to be read here for `Load \`review/quick-quality-gate\``, as the
   * one instruction to load a skill that was not optional. It is not an instruction any
   * more: the mandatory checks are in `reviewer.md` itself. Two lines of the same file
   * asked for the same step by two mechanisms and were obeyed 224/227 and 43/227 -- the
   * difference being the mechanism rather than the wording -- so the required half moved
   * to where the obeyed half already was. What replaced this assertion is the test below
   * that reads those checks in the definition.
   */
  test("loads procedures as skills without requesting visible chain of thought", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    expect(prompt).toContain("atoma_builtin__load_skill");
    expect(prompt).toContain("in place of your own approach");
    expect(prompt).toContain("Check the catalog again");
    expect(prompt).toContain("Reason privately");
    expect(prompt).not.toContain("Before taking action or generating final output, always use the `<thought>` tag");
  });

  /**
   * The directive line is described, and never spelled.
   *
   * This pinned the opposite: that the template said "the directive line must contain
   * only `/agent-name`". The sentence is correct and the string in it is not a name --
   * `extract_directive.ts` resolves a directive against the agent definitions on disk,
   * so `/agent-name` dispatches nobody.
   *
   * Ten runs posted it literally, nine of them on the first line of their final message,
   * and nine of those were holding the warning that follows it -- "never the placeholder
   * itself" -- while they did. Six had a failing required check and a contract row
   * saying to hand the work to the engineer; no engineer was started, and every one of
   * those runs was recorded as finished.
   *
   * A warning cannot beat the prompt supplying the string, so the string is gone. The
   * shape is described in words and the real names arrive immediately after it, from
   * `{{COLLEAGUES_LIST}}`, which the template now places at the point of use rather than
   * in a context block far above it. What this guards is that neither half comes back:
   * no literal placeholder anywhere in the template, and the colleague list still
   * rendered where the directive is explained.
   */
  test("the template describes the directive line without supplying a placeholder to copy", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    const atomaton = readFileSync("src/content/agent-definitions/atomaton.md", "utf8");
    expect(prompt, "a placeholder in the prompt is a string a run can post verbatim").not.toContain(
      "/agent-name",
    );
    expect(prompt).toContain("a line that holds nothing but a slash and");
    // The names themselves, beside the sentence that asks for one.
    const directive = prompt.indexOf("a line that holds nothing but a slash and");
    const colleagues = prompt.indexOf("{{COLLEAGUES_LIST}}");
    expect(colleagues, "the colleague list must be rendered").toBeGreaterThan(-1);
    expect(colleagues, "the names belong at the point of use, not in a block above").toBeGreaterThan(directive);
    expect(atomaton).toContain("Return `/engineer` on its own line");
  });

  /**
   * The report is a contract with four parts, and one of them is where the run's only
   * copy of something lives.
   *
   * What the prompt used to say about reporting was a subordinate clause inside a
   * paragraph about how comments are delivered -- "That is how you report: findings,
   * measurements, what you could not do, what a person should look at" -- under a
   * heading that said "Ending a Run". Measured over 362 reports: 9 said anything about
   * what they could not confirm, 27 of the 30 runs whose own tools reported a fault
   * discarded it with the run, and 111 of 246 reviews discussed nothing but merge state
   * GitHub was already displaying beside them.
   *
   * So the parts are named and ordered, and the part that goes missing is the one with
   * an explicit floor: write that there is nothing rather than leaving it out. What is
   * pinned is the four headings and that floor -- not the prose around them.
   */
  test("the report contract names its parts and refuses an empty one", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    for (const part of [
      "What you concluded",
      "How you know",
      "What you could not establish",
      "What happens next",
    ]) {
      expect(prompt, `the report contract must name "${part}"`).toContain(part);
    }
    expect(prompt, "the part that goes missing needs a floor, not an encouragement").toContain(
      "leaving the part out is itself a claim",
    );
  });

  /**
   * The four parts need ceilings, because the contract said where the parts go but never
   * where the work itself goes.
   *
   * Measured from `origin/atomaton-data` sessions (`sessions/issue-N/engineer.json`) and
   * comment bodies from the GitHub API. Lengths are characters.
   *
   * The engineer's whole four-part report:
   *
   *   issue  whole   What I concluded  How I know  could not establish  next
   *   #2     23,895  17,983            2,435       2,770                707
   *   #3     12,517  (no four headings at all)
   *   #4     11,191  (no four headings at all)
   *
   * #2's `What I concluded` was `## 1. What it is` through `## Atoma core, and where the
   * line falls` -- six headings, and the deliverable the issue asked for. #3 and #4 put
   * the deliverable outside the four parts and barely wrote the headings at all, so the
   * contract never decided where the artifact goes. That is what "The work itself is not
   * one of the parts" fixes.
   *
   * The atomaton close comment, back when `conclude_issue.ts` printed a one-sentence
   * `reason` directly above `summary` (that argument is gone, #15 — the summary is the
   * comment):
   *
   *   issue  whole  reason  conclusion  evidence  could not establish  next
   *   #2     6,301  795     700         2,524     1,608                581
   *   #3     3,087  181     178         1,657     643                  335
   *   #4     2,947  1,320   243         857       266                  168
   *
   * On #4 `reason` was 44.8% of the comment and restated the 243-character conclusion
   * below it -- the same judgement written twice. That is the measurement behind the
   * one-sentence `reason`, and also behind removing it: a ceiling on the second copy
   * was a weaker answer than not asking for one.
   *
   * Checkable-sentence share by part, #2's engineer, with a regex close to the one used
   * earlier: `What I concluded` 63/94 = 67% (17,964 chars), `How I know` 10/11 = 91%
   * (2,422), `What you could not establish` 6/13 = 46% (2,741), `What happens next` 3/5 =
   * 60% (687). Across whole reports, #3's engineer was 34/44 = 77% and #4's 36/40 = 90%.
   * The anchor requirement is doing its work in `How I know` (91%) and the thinnest part
   * is `What you could not establish` (46%) -- so the part worth narrowing and the part
   * worth protecting are not the same part. Hence the five-item ceiling on one and the
   * floor-with-no-ceiling on the other.
   *
   * The share metric cannot be compared across this change: narrowing `How I know` shrinks
   * its own denominator, so its share can fall without anything getting worse. What to
   * compare before and after is anchored claims per report, not their ratio -- and the
   * failure condition is not a falling ratio but (a) a claim the conclusion rests on
   * having no anchor, and (b) a report saying it measured something it did not measure.
   *
   * Two alternatives were rejected and are not worth re-opening. A character ceiling in
   * the tool schema: `request_close_issue` ends the session, so an over-length argument
   * would be a tool error demanding a rewrite as the last thing a run does, and the
   * numbers worth capping are per part, which a schema cannot see. Dropping the fixed four
   * parts: the `no-report` mechanism depends on that shape.
   *
   * The heading spelling is `How you know`, not `How I know`. The wording this change was
   * specified from wrote the part as `**How I know.**` in its replacement block, but the
   * same specification says the four heading strings do not change by one character and
   * that the test above pins them. That test pins `How you know`, so the pinned spelling
   * wins and only the ceiling sentence was added.
   *
   * Pinned as single-line fragments, because these files are wrapped prose and a phrase
   * spanning a line break also picks up whatever indentation wraps it.
   */
  test("the report contract puts a ceiling on three of its parts and says where the work goes", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    expect(
      prompt,
      "the artifact belongs in the message body, not in a part that reports on the run",
    ).toContain("not one of the parts");
    expect(prompt, "a ceiling is a limit, and the conclusion's is two sentences").toContain(
      "is the ceiling, not the opening move",
    );
    // The exact phrase, because the wrap decides whether it is a phrase at all: it was
    // split across a line break when this was written, and a rewrap could split it again.
    expect(prompt, "the conclusion's ceiling must stay on one line").toContain(
      "Two sentences is the ceiling",
    );
    expect(prompt, "How you know carries only the claims the conclusion rests on").toContain(
      "Five items at most.",
    );
    expect(prompt, "What happens next is bounded too").toContain("Three sentences at most.");
    expect(
      prompt,
      "the part that goes missing keeps its floor and no ceiling",
    ).toContain("with no ceiling, because it is the one that goes missing.");

    const atomaton = readFileSync("src/content/agent-definitions/atomaton.md", "utf8");
    expect(
      atomaton,
      "the close call must add a judgement rather than restate the thread",
    ).toContain("The conclusion is written once.");
  });

  /**
   * And it has to say where the report goes when there is no turn left to write it in.
   *
   * A session-ending tool call stops the inference loop the moment it returns, so a run
   * that meant to report afterwards never does. Measured: 27 of 108 engineer runs left
   * no report at all, and the shape they share is the successful one -- the run opened
   * its pull request and stopped. The report is not missing from those runs, it is in a
   * tool argument, and nothing said so.
   *
   * This used to pin the argument NAMES -- `body`, `summary`, `reason` -- because a run
   * that had to get the name right is what the measurement was about. Naming them in the
   * prompt is what went wrong (#15): the paragraph grew an entry per tool, and each name
   * was a second place for the same claim. So the prompt now says the call carries the
   * report and points at the tool's description for which argument that is, and this
   * pins the rule without re-listing them.
   */
  test("the report has a named place in every call that ends the session", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    expect(prompt).toContain("the report goes in that");
    expect(prompt, "and before the call, because there is no after").toContain(
      "before you make the call",
    );
    expect(
      prompt,
      "which argument carries it is the tool's own description's, not this paragraph's",
    ).toContain("said by that tool's own description");
    for (const argument of ["`body`", "`summary`", "`reason`"]) {
      expect(prompt, `the prompt must not enumerate the argument: ${argument}`).not.toContain(argument);
    }
  });

  // Pins the two rules the agents were observed breaking, because each failure
  // looked like success: the reviewer answered `LGTM` in prose and merged nothing,
  // and it announced that it would wait for a check with nothing able to resume
  // the run. Both are properties of the wording, so they belong in a test.
  test("tells every agent that an outcome is a tool call and that it cannot wait", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    // Single-line substrings on purpose: these files are wrapped prose, and a
    // phrase spanning a line break also picks up whatever indentation wraps it.
    expect(prompt).toContain("outcome means making that call");
    expect(prompt).toContain("You cannot wait");
  });

  /**
   * The reviewer reaches its verdict before it asks who may merge.
   *
   * This pinned the reverse -- "Do this before deciding" -- which put
   * `check_merge_readiness` at step 1 of the review. What that produced is a review
   * that never happens: 107 of the runs that called it made no other operational call
   * at all, and 95 of those were pull requests a person had opened, where the answer to
   * "who merges this" was settled before the reviewer was ever dispatched. Of 246
   * reviews, 111 discussed nothing but merge machinery that GitHub was displaying beside
   * them, and 169 named no file.
   *
   * The call is not wrong and has not moved out of the contract; its position has. It
   * answers who may merge and under what conditions, never whether the change is sound,
   * and a contract that asks it first turns a review into merge administration. So what
   * is pinned now is the order: the verdict comes from what was read, and the readiness
   * call comes after it.
   */
  test("the reviewer decides from what it read, then asks who may merge", () => {
    const reviewer = readFileSync("src/content/agent-definitions/reviewer.md", "utf8");
    expect(reviewer).toContain("Decide from what you read");
    expect(reviewer, "the readiness call must not come first again").toContain(
      "once you have a verdict, not before",
    );
    expect(reviewer).not.toContain("Do this before deciding");
    // The outcome is the call, not the sentence that describes it. Was two calls
    // until `submit_pr_review` was removed -- a review the shared identity can
    // neither approve nor request changes with said what the final message says.
    expect(reviewer).toContain("without making the merge call merges");
    // `checks-missing` used to say "call check_merge_readiness again", which no
    // agent can do usefully -- the check it is waiting on outlives the run.
    expect(reviewer).toContain("you cannot wait for it");
  });

  /**
   * The mandatory checks are in the definition, not behind a load.
   *
   * They were the body of `review/quick-quality-gate`, and the reviewer was told to load
   * it as step 1. Two lines of that same file asked for a step apiece: the tool call was
   * made in 224 of 227 reviews and the skill was loaded in 43, with 154 never attempting
   * it. Same agent, same file, adjacent lines -- so what differs is the mechanism, and a
   * check that is not optional does not belong behind an optional one.
   *
   * Each check exists because its evidence is, by definition, in a file the diff does not
   * contain: the callers of a deleted name, the definitions that still name a renamed
   * server, the source a generated file came from. A review that only reads the diff
   * cannot reach any of them, which is why the budget they were weighed against is gone
   * too.
   */
  test("the reviewer's mandatory checks are in its own definition", () => {
    const reviewer = readFileSync("src/content/agent-definitions/reviewer.md", "utf8");
    expect(reviewer).toContain("## Mandatory checks");
    expect(reviewer, "a removal is the check the diff cannot answer").toContain("Anything removed");
    expect(reviewer).toContain("agent-definitions/");
    expect(reviewer, "generated output is a defect even when its content is right").toContain(
      "Generated output touched",
    );
    // No budget to weigh them against. "Four operational tool calls is the target" was
    // the one number in the prompt layer with no measurement behind it, and it was met
    // by not reading anything.
    expect(reviewer).not.toContain("operational tool calls is the target");
  });

  /**
   * The sentence this turns on, in both places an agent reads it.
   *
   * A tool server can now say it answered worse than it should have, and
   * the same warning produces two very different runs depending on what the agent
   * concludes: "my query was poor" ends in trying again differently, and "the
   * reranker is not running" ends in an issue. The second was the truth when it happened and
   * the first is what an agent asked whether something went badly reaches for, because
   * its own conduct is what it has been told to examine.
   *
   * So the attribution is not a nicety of wording -- it is the whole mechanism. Pinned
   * the way the reviewer's two rules above are pinned: the failure looks like success,
   * because a run that files an apology instead of a defect still reads as a run that
   * noticed something.
   */
  test("says a problem a tool reported about itself is not the agent's failure", () => {
    // One file now, where it was two. It was in the template AND in
    // `engineering/environment`, and the skill was the half carrying the procedure --
    // so the template asked the agent to load a skill to find out what to do about a
    // block that had already arrived in a tool result. Of 30 runs that met one, 4
    // loaded it. The trigger is a result every agent can receive and the response is
    // three steps long, so both are in the template, beside the tool descriptions the
    // block is attached to, and the skill keeps only the dependency questions its
    // description names.
    const file = "src/content/prompt-template.md";
    const text = readFileSync(file, "utf8");
    expect(text, `${file} must not let a tool's degradation read as the agent's fault`).toContain(
      "not a failure of your work",
    );
    // And the procedure has to travel with it, or the attribution is advice with
    // nowhere to go. The tool is the ROOT one: a defect is nobody's child, and the
    // sub-issue tool is refused on a pull request run, which is where these are
    // most often found (#178/#179/#192).
    expect(text, "the run that saw it is the only one that can file it").toContain("create_root_issue");
  });

  /**
   * The first thing a re-invoked agent reads, and the paragraph it has to agree with.
   *
   * After a merge, `dispatchPostMergeAgent` posts a comment on the issue and then starts
   * an agent on it. That comment is a user message, ahead of the system prompt in the
   * only ordering a model has -- and it said "Please confirm completion and close this
   * sub-task", which is an answer, not a question. An agent told to confirm has no
   * remaining reason to read the issue.
   *
   * What the re-invocation is for is the opposite: deciding whether what merged
   * satisfies what the issue asked for, and carrying on when it does not. A merge is
   * evidence that a change was accepted, not that a requirement was satisfied.
   *
   * Pinned as a pair because either half alone is worse than neither. The prompt asking
   * for a judgement while the trigger asks for a closure is a contradiction the trigger
   * wins; the trigger asking for a judgement with no contract behind it is a run with no
   * outcome to reach.
   */
  test("the post-merge trigger and the prompt ask for the same thing", () => {
    const trigger = readFileSync("src/adapters/actions/dispatch-targets.ts", "utf8");
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    expect(trigger, "the trigger comment must not prejudge the answer").not.toContain(
      "Your PR was merged",
    );
    expect(trigger).toContain("Decide whether what merged satisfies what");
    expect(prompt).toContain("After a pull request you opened has merged");
    expect(prompt, "the contract has to say a merge is not the question").toContain(
      "a merge is evidence that a change was accepted, not that a requirement was satisfied",
    );
  });

  /**
   * #80: a sub-issue's close condition must be checkable where its work lands.
   *
   * A child's pull request is cut from and merges back into its PARENT's branch, so the
   * default branch has none of it until the parent delivers -- and the parent is gated
   * on the child closing. A close condition written over the default branch therefore
   * waits on a state the child cannot reach until after it closes, which is a deadlock.
   * Measured on #17: its condition named `main`, its work was on `atomaton/issue-16`,
   * and the engineer correctly refused to close it.
   *
   * Both halves are pinned because either alone leaves the deadlock: the dispatch
   * contract says how to WRITE the condition, and the post-merge paragraph says how to
   * READ one that named the wrong branch.
   */
  test("the close-condition contract names the branch the work lands on, not the default one", () => {
    const atomaton = readFileSync("src/content/agent-definitions/atomaton.md", "utf8");
    expect(atomaton, "the close condition is checked against the branch the work lands on").toContain(
      "the branch the child's work lands on",
    );
    expect(atomaton, "and that is not the default branch").toContain(
      "which is this issue's own branch, not the default branch",
    );

    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    expect(prompt, "the reader is told which branch to read").toContain(
      "The branch to read is the one the pull request merged into",
    );
    expect(prompt, "and the parent's branch is named as the one it is").toContain(
      "sub-issue is its parent's branch, not the default branch",
    );
  });

  /**
   * And the template has to close the loop, not just absolve the agent.
   * `docs/method/edd.md` names the failure this is against: "Whoever observed the gap
   * cannot propose the fix, so it waits until someone else notices." The run that saw
   * the warning is the only one holding it, so filing is part of seeing it.
   *
   * This read `engineering/environment`, which held the procedure until the template
   * absorbed it -- see the test above for why. It reads the template now, and what it
   * guards is unchanged: the filing call, and that the run says so where the next
   * reader looks.
   */
  test("a reported problem turns into a filed issue that outlives the work", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    expect(prompt).toContain("create_root_issue");
    expect(prompt, "and the run has to say so where the next reader looks").toContain(
      "Say so in your report",
    );
  });

  /**
   * The scratch workspace's path is stated in three places and has to be one path.
   *
   * `domain/work/workspace.ts` holds it, the runner mounts it there, the prompt template
   * tells the agent about it, and `bash`'s description repeats it. Both of
   * the last two, because a tool's own description was measured to carry more weight
   * than the same words in the system prompt -- and this sentence has to hold
   * at the moment the agent is deciding where to put a file, which is when it is
   * reading the tool.
   *
   * A path that drifted in one of them would be an agent writing somewhere real,
   * being told it persists, and finding it gone -- the exact shape of failure the
   * workspace exists to remove.
   */
  test("the scratch workspace is named identically wherever an agent reads about it", () => {
    for (const file of ["src/content/prompt-template.md", "src/entrypoints/tools/mcp/shell.ts"]) {
      const text = readFileSync(file, "utf8");
      expect(text, `${file} must name the workspace`).toContain(WORKSPACE_PATH);
      // Both halves. "This survives" alone invites leaving working files in the
      // repository as well; "nothing else survives" alone does not say where to
      // put them.
      expect(text.toLowerCase(), `${file} must say it survives`).toMatch(/survive/);
      expect(text, `${file} must say what happens to files left in the repository`).toMatch(/committed/);
    }
  });

  /**
   * And nothing may tell an agent to expand a variable to find it. `ls
   * $SOMETHING_WORKSPACE` with the variable unset returns nothing, which reads
   * exactly like an empty directory -- so the failure and the ordinary case become
   * indistinguishable in the one place a model is looking. The path is written out.
   *
   * This watched for one spelling, `ATOMA_WORKSPACE`, which is the name the
   * variable would have had. Renaming the project left it watching for a string
   * nobody would write, which is a guard that cannot fail rather than a guard that
   * passes. The mistake has a shape -- a variable expansion with WORKSPACE in its
   * name -- and the shape is what is checked now, whatever the project is called.
   */
  test("the workspace is never named through a variable", () => {
    for (const file of ["src/content/prompt-template.md", "src/entrypoints/tools/mcp/shell.ts"]) {
      const expansions = readFileSync(file, "utf8").match(
        /\$\{?[A-Za-z_]*WORKSPACE[A-Za-z_]*\}?/g,
      );
      expect(
        expansions ?? [],
        `${file} names the workspace through a variable. Unset, it expands to nothing and ` +
          `reads as an empty directory; write the path out`,
      ).toEqual([]);
    }
  });

  /**
   * The delegate paragraph keeps the boundary that makes the examples safe to sharpen.
   *
   * #216 asked the delegate descriptions to name the reads worth delegating, and they
   * now do (`mcp/delegate.ts`). What must not travel with them is breadth: a file about
   * to be edited, or one consulted again during the run, is read here. Without that
   * sentence the description's examples read as an instruction to delegate more, and a
   * run that delegates one of those edits a file it has never read — a worse outcome
   * than the reading it saved.
   */
  test("the shared prompt says which reads stay inline", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8").replace(/\s+/g, " ");
    expect(prompt, "the trigger the examples extend").toContain(
      "Reading you will not use again belongs in a sub-run",
    );
    expect(prompt, "the file being edited is read here").toContain(
      "What stays here is the file you are about to edit",
    );
    expect(prompt, "and so is anything the run returns to").toContain(
      "anything you will read again during this run",
    );
  });

  /**
   * The tree, in the shared prompt, because every role acts on a node and means the work
   * under it.
   *
   * This lived in `docs/work/how-it-works/work-is-a-tree-of-issues.md`, which an adopter's
   * tree does not have: the documentation is this repository's, and the prompt is what
   * every agent actually reads. So the shape of the work was described in the one place
   * no agent looks, and each role was left to infer it -- which is how #80's deadlock
   * (a close condition naming the default branch) could be written in good faith.
   *
   * The branch half is pinned because it is the operational consequence: a sub-issue's PR
   * merges into its parent's branch, so the close condition is checkable there and not on
   * the default branch.
   */
  test("the shared prompt says work is a tree and where a branch merges back to", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    expect(prompt, "work is a tree, and a pull request is a leaf").toContain(
      "Work is a tree of issues, and a pull request is a leaf",
    );
    expect(prompt, "a sub-issue's branch merges back into its parent's").toContain(
      "A sub-issue's branch is cut from its parent's and merges back into it",
    );
    expect(prompt, "so the default branch has none of it yet").toContain(
      "the top of your part of the tree delivers it",
    );
  });

  /**
   * How much a change should carry -- stated once, as fixed text.
   *
   * #216, and the decision on it: the pull is to make a run bolder about deleting what
   * no longer earns its place, without leaving "throw away backward compatibility" in a
   * prompt that is read by projects whose compatibility is the point. So the stance is
   * the general one -- unreadable code is a defect of the same kind as a bug, both being
   * how the next change goes wrong, so the shape with less in it wins -- and
   * compatibility, fallbacks and workarounds survive only as trade-offs taken on
   * purpose.
   *
   * The price of taking one is pinned with the stance, because without it the paragraph
   * reads as permission: kept small, explained where it lives, and reported as a cost
   * the next reader pays.
   *
   * And the section must carry no placeholder. The philosophy is fixed: an adopter able
   * to swap it could swap the half that makes the rest of the prompt cohere, and a slot
   * invites the wording to drift into whatever each project calls clean.
   */
  test("the shared prompt says how much to change, as fixed text with no slot to swap it", () => {
    const raw = readFileSync("src/content/prompt-template.md", "utf8");
    const heading = "# How much to change";
    const start = raw.indexOf(heading);
    expect(start, "the section has to exist").toBeGreaterThan(-1);
    const after = raw.slice(start + heading.length);
    const end = after.indexOf("\n# ");
    const sectionRaw = end === -1 ? after : after.slice(0, end);
    // Whitespace collapsed: the section is wrapped prose, so an assertion spanning a
    // line break would fail over where the wrap fell rather than over what it says.
    const section = sectionRaw.replace(/\s+/g, " ");

    expect(section, "the defect, as the same kind as a bug").toContain(
      "Unreadable code is a defect of the same kind as a bug",
    );
    expect(section, "and why: it is what makes the next change go wrong").toContain(
      "Both are how the next change goes wrong",
    );
    expect(section, "the default is the shape with less in it").toContain(
      "Prefer the shape with less in it over the one with more",
    );
    expect(section, "which is not timidity about the size of the diff").toContain(
      "the change that deletes code is worth more than the change that adds it",
    );
    expect(section, "compatibility and fallbacks are exceptions, not the default").toContain(
      "are not the default",
    );
    expect(section, "an exception needs a reason this project actually has").toContain(
      "for a reason this project actually has",
    );
    // What an exception costs, or the paragraph is permission rather than a trade-off.
    expect(section, "kept small").toContain("keep it small");
    expect(section, "explained where it lives").toContain("write why it is there at the place");
    expect(section, "and reported as a cost the next reader pays").toContain(
      "what it costs the next reader",
    );
    expect(sectionRaw, "the philosophy is not an adopter's setting").not.toMatch(/\{\{/);
  });

  /**
   * Who is asked, and who is not -- the split that stops a design question reaching a
   * person who cannot answer it.
   *
   * Measured: a person asking for retries does not know the backoff, the error classes,
   * or whether the operation is idempotent. Asking them puts a design decision in front
   * of somebody who cannot make it and gets a guess back. The purpose is the other half,
   * and only they own it.
   *
   * The three sentences are pinned together because the split only holds as a whole:
   * what to ask (the purpose), what not to (the design), and what to do when the answer
   * is wrong (say so rather than build it or hand it back).
   */
  test("the shared prompt splits what to ask from what to derive, and forbids agreement", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    // The phrasing these pin is on one line. These files are wrapped prose, and a
    // phrase spanning a break also picks up whatever indentation wraps it -- so what
    // is asserted is the part that is genuinely one line, and it is asserted for the
    // meaning rather than the wrapping.
    expect(prompt, "the goal is the asker's").toContain("Ask about the goal, never about the means");
    expect(prompt, "the means is not a question they can answer").toContain(
      "is not a question they can answer",
    );
    expect(prompt, "a question about the means is a decision put to the wrong person").toContain(
      "a question about those puts a",
    );
    expect(prompt, "who cannot make it").toContain("decision in front of somebody who cannot make it");
    expect(prompt, "and a wrong diagnosis is corrected, not agreed with").toContain(
      "Their answer can be wrong",
    );
    expect(prompt, "agreeing with a diagnosis that is wrong helps nobody").toContain(
      "Agreeing with a diagnosis you can see is wrong helps nobody",
    );
    expect(prompt, "the correction says what to do instead").toContain("what you would do instead");
    // The purpose comes first, and the enquiry is a thing the run does rather than a
    // rule it reads -- measured: an agent asked for retries does not know the backoff,
    // and a person asked for one does not either.
    expect(prompt, "what it is for is established before what to do").toContain(
      "Work out what it is for before you work out what to do",
    );
    expect(prompt, "and an answer already written down is read rather than asked for").toContain(
      "Read before you ask",
    );
  });

  /**
   * `architect` exists, is reachable, and is told to read through a delegate rather than
   * itself.
   *
   * The whole reason it is a separate agent is cost: it is the most expensive model in
   * the tree, and a prompt token is resent on every turn of the session. So what it
   * reads with `files_readonly` stays in the session and is paid for repeatedly, while a
   * `delegate_readonly` summary is one paragraph. The definition has to say which is the
   * habit, or the model with the most context to gain is the one that fills it fastest.
   *
   * Pinned as a set because each alone is not the design: the agent must exist, be
   * dispatchable by name from `atomaton`, hold the read-only servers, and be told to
   * prefer the delegate.
   */
  test("architect exists, reads through the delegate, and is handed work by atomaton", () => {
    const architect = readFileSync("src/content/agent-definitions/architect.md", "utf8");
    expect(architect, "the read-only pair, and nothing that writes").toContain("- files_readonly");
    expect(architect, "the delegate is the habit, not the fallback").toContain("delegate_readonly");
    expect(architect, "and the reason is the session it would otherwise carry").toContain(
      "one summary",
    );
    // No shell: it decides, and a shell is a way to act on the decision.
    expect(architect, "an architect that can run things is an engineer").not.toContain("- shell");

    const atomaton = readFileSync("src/content/agent-definitions/atomaton.md", "utf8");
    expect(atomaton, "atomaton has to know the name to dispatch it").toContain("  - architect");
    expect(atomaton, "and the contract says what to hand up").toContain(
      "When to hand a decision to `architect`",
    );
    expect(atomaton, "the purpose is explicitly not the thing to hand up").toContain(
      "Do not hand up what the work is *for*",
    );
    expect(atomaton, "the outcome row is the architect's own bar, not 'being unsure'").toContain(
      "one decision would move several parts at once",
    );
    expect(atomaton, "and an implementation without such a choice goes to the engineer").toContain(
      "An implementation that holds no such choice goes to `/engineer` instead",
    );
  });

  /**
   * The four places a written thing goes, in the engineer's own contract.
   *
   * Not style advice: each line is a fact that has exactly one place it can live. The
   * reason a change was made is not in the diff, which is why it is in the commit; the
   * alternative somebody ruled out is in no artifact at all, which is why it is the
   * comment. Without this, the pull is to write the same thing in all four.
   */
  test("the engineer is told what belongs in code, tests, commits and comments", () => {
    const engineer = readFileSync("src/content/agent-definitions/engineer.md", "utf8");
    expect(engineer).toContain("Code says how");
    expect(engineer).toContain("A test says what");
    expect(engineer).toContain("A commit says why");
    expect(engineer).toContain("A comment says why not");
  });

  /**
   * A path with a line is written the way GitHub links it.
   *
   * `path/to/file.ts:42` is a link in a comment, and prose about where something is is
   * not. The report contract already asked for "a path with a line number"; what it did
   * not say is the one spelling the page can follow, which is the difference between an
   * anchor a reader clicks and one they search for by hand.
   */
  test("the report writes an anchor in the form the page turns into a link", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8");
    expect(prompt).toContain("`path/to/file.ts:42`");
    expect(prompt, "and says why that spelling rather than another").toContain(
      "GitHub turns that into a link to",
    );
  });

  /**
   * Folds lower the visible cost of a comment without throwing anything away.
   *
   * #210: a report whose conclusion carried the vocabulary of the implementation.
   * #16/#17 capped the length of each part; neither touched how much of the
   * comment sits open on the page. The machinery already folds the report a finished
   * child leaves on its parent's thread (`adapters/github/sub-issue-report.ts`) — the
   * prompt now asks the same of the agent's own text.
   *
   * The line is "what verifies folds, what acts stays open": a reader acting on the
   * comment should not have to open anything, and the next run reads the full text
   * either way, so nothing is lost to the model. Pinned per claim: the criterion,
   * what folding does not cost, and the two things that must never fold — a fold
   * holding the conclusion is a comment a reader cannot act on without opening.
   */
  test("the report folds what verifies and keeps the conclusion and next step open", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8").replace(/\s+/g, " ");
    // The criterion, in the terms a reader acts against.
    expect(prompt, "acting must not require opening a fold").toContain(
      "act without opening a fold",
    );
    expect(prompt, "the kinds of content the fold is for").toContain(
      "What exists to be checked rather than read",
    );
    // The cost claim, so nobody later "optimizes" the fold into deletion.
    expect(prompt, "the next run reads the full text").toContain(
      "nothing is lost to the model",
    );
    // The two things that never fold.
    expect(prompt, "the conclusion stays open").toContain(
      "the conclusion and the next step are never folded",
    );
    // And the fold names what it hides.
    expect(prompt, "a summary line that names what is inside").toContain(
      "the summary line names what is inside",
    );
  });

  /**
   * A handoff to a colleague leads with the ask, not the grounds.
   *
   * The handoff is the one piece of agent-to-agent prose on a thread a person also
   * reads, and it used to be shaped like a report — constraints and files first,
   * the actual request buried under them. The request is the part the next agent
   * acts on; the grounds are the part it checks when it acts. Same fold rule as
   * the report, applied to the other direction of writing.
   */
  test("the handoff leads with the request and folds the grounds", () => {
    const prompt = readFileSync("src/content/prompt-template.md", "utf8").replace(/\s+/g, " ");
    expect(prompt, "the ask comes first").toContain("Lead with the request itself");
    expect(prompt, "the grounds fold").toContain(
      "fold the grounds for it, the files and the constraints",
    );
  });

  /**
   * A check that needs a real secret is made after the merge, and the prompt has to
   * say so *before* the run starts.
   *
   * #109 was dispatched to answer one question — whether the attachment endpoint
   * accepts the credential a run holds — and could not answer it where it was asked:
   * `curl` is refused, and even with it there is no token in the shell to send. The
   * run found that out one refusal at a time, and then proposed building a tool server
   * so the check would be possible at all. That is a reasonable reply to an impossible
   * task and a whole run spent on the wrong one.
   *
   * What the prompt owes a run instead is the boundary, stated once, so the plan it
   * makes at the start is one it can carry out. Three claims have to survive editing:
   * that the check belongs after the merge, that a tool which would make it possible
   * earlier is the wrong thing to ask for, and what a run can do here instead.
   */
  test("the prompt says a check needing a real secret happens after the merge", () => {
    // Whitespace collapsed before asserting, because this file is wrapped prose: a
    // sentence breaks across a line at a column, so an assertion written against the
    // whole sentence holds only until the paragraph around it is re-flowed -- and then
    // it fails over where a line ended rather than over anything it is about. The same
    // lesson the e2e suite learned about `prompt-template.md`.
    const prompt = readFileSync("src/content/prompt-template.md", "utf8").replace(/\s+/g, " ");

    expect(prompt, "the boundary, in the terms a run plans against").toContain(
      "A check that needs a real secret is made after the merge, not before.",
    );
    expect(prompt, "and why no rearrangement of the tools closes it").toContain(
      "a tool that would make it askable is the wrong thing to ask for",
    );
    expect(prompt, "what the pull request's own checks are for instead").toContain(
      "What you can do here is verify the **shape**",
    );
    expect(prompt, "and that a question the shape cannot settle is a decision").toContain(
      "say so and hand it up, instead of building the machinery",
    );
    // The reason, not just the rule: a run that reads only "you cannot" looks for a way.
    expect(prompt).toContain("it would be a credential in the hands of code nobody has read yet");
  });
});
