/**
 * tags.ts — canonical encode/decode for every `<!-- atomaton:xxx=... -->`
 * HTML-comment marker Atomaton embeds in issue/PR bodies and comments to carry
 * state across otherwise-stateless GitHub Actions workflow runs.
 *
 * This is the ONE place each tag's
 * wire format is defined; every reader/writer imports from here instead of
 * re-deriving its own regex.
 */
import { AGENT_NAME_PATTERN } from "../../domain/work/agent-name.ts";
import { LOGIN_PATTERN } from "../../domain/work/mention.ts";

/**
 * The prefix every tag carries, written once.
 *
 * It was written twice -- once in the regex and once in the renderer -- and the
 * two agreed, so a rename that moved every literal `atoma:<key>` in the codebase
 * left both of these behind: `atoma:${key}` has a `$` after the colon, not a
 * letter, so a pattern written for the literals could not see them. The readers
 * then expected one prefix and the writer produced the other.
 */
const TAG_PREFIX = `atomaton:`;

export interface AtomatonTag<T> {
  /**
   * The tag's name with the prefix but no value or wrapper, e.g. `atomaton:dispatch`.
   *
   * A workflow `if:` that only asks whether a comment carries the tag cannot call
   * `has` — it is a GitHub expression, not TypeScript — so it writes
   * `contains(body, 'atomaton:dispatch')` by hand. That literal is the one place a
   * rename of the key would not follow, so the workflow builds it from here.
   */
  readonly marker: string;
  /** Render this tag's HTML-comment form, ready to prepend/embed in a body or comment. */
  write(value: T): string;
  /**
   * Extract this tag's value from anywhere in `text`, or undefined if absent.
   *
   * Raw: it sees a tag inside a fenced code block as readily as one in prose. Right
   * for text this machinery assembled itself — a string `write` just built, a test
   * fixture — and wrong for anything GitHub handed over, where the fence makes the
   * tag a sample rather than a record. Those go through `readProse`.
   */
  read(text: string): T | undefined;
  /**
   * Extract this tag's value from a GitHub body or comment, or undefined if absent.
   *
   * The ONE way a tag is read out of text GitHub wrote back: through `proseOnly`
   * first, so a tag inside a fenced code block is not read. The machinery writes
   * tags in prose — every `write` call site prepends one to a body or comment — so
   * nothing it wrote is lost, and a person quoting the format in a fence (this
   * issue tracker does it constantly) is not taken for the machinery speaking (#304).
   */
  readProse(text: string): T | undefined;
  /** True if `text` contains this tag at all, regardless of its value. */
  has(text: string): boolean;
  /** True if a GitHub body or comment carries this tag at all, outside fenced code. See `readProse`. */
  hasProse(text: string): boolean;
  /**
   * What to put in a GitHub search to find bodies carrying this tag with this value.
   *
   * The tag's own text without the comment wrapper, because GitHub's search does not
   * match `<!-- ... -->` — measured: a tree walk searching for `write()`'s output found
   * none of its children, on a repository where every one of them carried the tag.
   *
   * Never the predicate. GitHub tokenizes, so a search for `atomaton:parent-issue=5`
   * also returns the pull requests of #50; every hit is confirmed with `read`
   * afterwards.
   */
  search(value: T): string;
}

/**
 * The wire form of every tag defined below, collected as each one is made.
 *
 * `withoutTags` reads this rather than a second list, so a tag added later is
 * stripped from the moment it exists. A list written by hand would be the same
 * fact in two places, and the half that falls behind is the half that leaks.
 */
const EVERY_TAG_PATTERN: string[] = [];

function makeTag<T>(key: string, valuePattern: string, parse: (raw: string) => T, render: (value: T) => string): AtomatonTag<T> {
  const pattern = `<!--\\s*${TAG_PREFIX}${key}=(?:${valuePattern})\\s*-->`;
  EVERY_TAG_PATTERN.push(pattern);
  const re = new RegExp(`<!--\\s*${TAG_PREFIX}${key}=(${valuePattern})\\s*-->`);
  const read = (text: string): T | undefined => {
    const m = re.exec(text);
    return m ? parse(m[1]!) : undefined;
  };
  return {
    marker: `${TAG_PREFIX}${key}`,
    write: (value) => `<!-- ${TAG_PREFIX}${key}=${render(value)} -->`,
    read,
    readProse: (text) => read(proseOnly(text)),
    has: (text) => re.test(text),
    hasProse: (text) => re.test(proseOnly(text)),
    search: (value) => `${TAG_PREFIX}${key}=${render(value)}`,
  };
}

/** Numeric-valued tag, e.g. `atomaton:foo=42`. */
function numericTag(key: string): AtomatonTag<number> {
  return makeTag(key, "\\d+", Number, String);
}

/** String-valued tag, e.g. `atomaton:foo=bar-baz`. */
function stringTag(key: string, valuePattern: string): AtomatonTag<string> {
  return makeTag(key, valuePattern, (raw) => raw, (value) => value);
}

/**
 * A tag whose value is several named fields on one line, e.g.
 * `atomaton:ended=done answers=12 run=34`.
 *
 * The wire form is still one comment line and still registered in
 * `EVERY_TAG_PATTERN`, so `withoutTags` strips it like any other tag; what the
 * compound maker adds is that the fields are parsed and rendered as one record,
 * because the turn-identity tags (#285) carry an ask id and a run id TOGETHER —
 * a reader that got them from two tags could not tell which run a lone ask
 * belonged to, which is the ambiguity this identity exists to end.
 *
 * `parse` receives the full match so it can re-read the value string field by
 * field; returning `undefined` makes the comment unreadable, which for these tags
 * is the honest answer — an ending whose ask and run are not both on it is not an
 * ending this machinery can reason about.
 */
function makeCompoundTag<T>(
  key: string,
  valuePattern: string,
  parse: (match: RegExpExecArray) => T | undefined,
  render: (value: T) => string,
  searchValue: (value: T) => string,
): AtomatonTag<T> {
  const pattern = `<!--\\s*${TAG_PREFIX}${key}=(?:${valuePattern})\\s*-->`;
  EVERY_TAG_PATTERN.push(pattern);
  // The whole value is NOT captured — the value pattern's own groups are the fields,
  // and a wrapping capture would shift every one of them by one. `parse` reads the
  // field groups straight off the match.
  const re = new RegExp(`<!--\\s*${TAG_PREFIX}${key}=(?:${valuePattern})\\s*-->`);
  const read = (text: string): T | undefined => {
    const m = re.exec(text);
    return m ? parse(m) : undefined;
  };
  return {
    marker: `${TAG_PREFIX}${key}`,
    write: (value) => `<!-- ${TAG_PREFIX}${key}=${render(value)} -->`,
    read,
    readProse: (text) => read(proseOnly(text)),
    has: (text) => re.test(text),
    hasProse: (text) => re.test(proseOnly(text)),
    search: searchValue,
  };
}

/**
 * A human asked the run on this issue/PR to stop.
 *
 * Written by `request_stop.ts` on the comment it posts, and polled for by the running
 * job itself -- which is the whole reason it is a comment and not a label or a file.
 * Nothing outside a job can reach into that job's filesystem, so the signal has to be
 * somewhere both sides can see, and a comment is also the record of who asked and
 * when.
 *
 * The reader must ignore requests older than its own run. A stop from last week is
 * not a stop of this run, and a job that read one would refuse to start work.
 */
export const STOP_TAG = stringTag("stop", "requested");

/**
 * How a run ended, written on its own result comment — with what the run was
 * answering and which run wrote it (#285).
 *
 * Asked by `/resume` over a work tree: "which nodes under this one were stopped?" is
 * a question about the thread, and without this it could only be guessed from the
 * presence of a session — which almost every node that ever ran has. The thread
 * already carries `AGENT_TAG` for the same kind of question (`resolve_resume_agent.ts`
 * reads it to name the agent), so the ending goes beside it rather than into a store
 * that would have to be kept in sync.
 *
 * `stopped` is a person's stop or a closed issue's; `limit` is a spent iteration or
 * time budget; `done` is every ordinary ending. Only the first is resumed
 * automatically, because only it was interrupted rather than finished.
 *
 * `handoff` is the one ending that leaves the node with an agent rather than giving
 * it back, and it is what `domain/work/thread.ts` reads to answer "is a comment
 * arriving mid-turn". It is a fourth value rather than a second tag because it is the
 * same fact -- how this turn ended -- and a reader that wants only the three older
 * answers still gets them: `/resume` looks for `stopped` and nothing else.
 *
 * `waiting` is the same fact for the OTHER way a run leaves work behind: not the next
 * agent on this node (`handoff`), but a child started under it (`launch_sub_agent`,
 * `create_pr`). The run ends inside that call, so no result comment of the usual kind
 * follows -- this is how that ending reaches the thread. `thread.ts` reads it to keep
 * the node off the `asked` that started the run, which the aggregation gate would
 * otherwise read as a request nobody had taken up.
 *
 * `refused` is the ending a REFUSED dispatch writes (#194): a run ended `handoff`,
 * promising a successor, and the dispatch of that successor did not happen. The
 * promise is the only thing keeping the thread's newest word "a hand-off" -- the state
 * every reader after that treats as "a run is working or coming" -- so the refusal
 * writes the ending itself and gives the node back. Written by the dispatch step of
 * the run that made the promise, never by the run's own report: the report said
 * "handed off" and was true when it was written.
 *
 * ## `answers` and `run`
 *
 * The ending is an ANSWER: `answers` names the ask comment id it answers, and `run`
 * names the run that wrote it. Both are comparisons' inputs, not prose — the run
 * watch asks "does an ending with MY run id exist", and the thread fold asks "does
 * an ending answering THIS claim's ask exist", and neither can be answered from a
 * verb alone. `answers=0` means the run was answering no comment — the body of a
 * new issue is the ask there, and the body is not a comment — and matches no real
 * comment id, which is the honest encoding of "answered nothing".
 *
 * An ending without both fields does not parse, and a comment that does not parse as
 * an ending is not an ending: the machinery reads its own wire format strictly, so a
 * partially-written ending is silence rather than a half-truth.
 */
export const ENDED_TAG = makeCompoundTag<{ verb: string; answers: number; run: number }>(
  "ended",
  String.raw`(stopped|limit|done|handoff|waiting|refused) answers=(\d+) run=(\d+)`,
  (match) => {
    const verb = match[1];
    const answers = match[2];
    const run = match[3];
    if (verb === undefined || answers === undefined || run === undefined) return undefined;
    return { verb, answers: Number(answers), run: Number(run) };
  },
  ({ verb, answers, run }) => `${verb} answers=${answers} run=${run}`,
  ({ verb }) => `atomaton:ended=${verb}`,
);

/**
 * The claim of a turn: which run took up which ask, written when the run STARTS (#285).
 *
 * This is the identity the ending (`ENDED_TAG`) answers: `ask` is the comment id of
 * the ask the run took up — a person's command, a dispatch marker, or the ending
 * another run left as its directive — and `run` is the run id of the taker, the same
 * value the run watch receives as `github.event.workflow_run.id`, so "did THIS run
 * take a turn" and "does THIS run have an ending" are both reads of the thread and
 * never a guess from times or titles.
 *
 * The claim is written by the runner at start, so the window between a comment
 * landing and a run claiming it is visible as exactly that — unclaimed — rather
 * than being folded into "some run is working". Two runs reaching for one ask are
 * separated by the ids themselves: the claim comment with the smaller id holds the
 * turn, and the other run backs off. `ask=0` is never written — a run with no ask
 * comment (a new issue's body) writes no claim at all.
 */
export const TOOK_TAG = makeCompoundTag<{ ask: number; run: number }>(
  "took",
  String.raw`(\d+) run=(\d+)`,
  (match) => {
    const ask = match[1];
    const run = match[2];
    if (ask === undefined || run === undefined) return undefined;
    return { ask: Number(ask), run: Number(run) };
  },
  ({ ask, run }) => `${ask} run=${run}`,
  ({ ask }) => `atomaton:took=${ask}`,
);

// `PARENT_TAG` (`atomaton:parent`, sub-issue -> parent issue) was here. GitHub's own
// sub-issue link answers the same question and a person can change it, while this was
// written once at creation and never rewritten -- so re-parenting in the web UI left
// two answers in the system with nothing to say they differed. `adapters/github/parent-issue.ts`
// carries the argument.

/**
 * PR -> the issue it was created to deliver (set via `create_pr`).
 *
 * ## Why this one stays when the issue-to-issue tag went
 *
 * Not symmetry, and not habit: GitHub's own PR-to-issue link does not survive in this
 * design, and that was measured rather than assumed. Of the nine pull requests this
 * repository had tagged, SEVEN carried a correct `Closes #N` line and only TWO
 * appeared in `closingIssuesReferences`.
 *
 * GitHub drops the link once the issue is closed by anything other than that pull
 * request's merge, and two things here do exactly that:
 *
 *   - A sub-issue's pull request merges into its PARENT's branch, not the default
 *     one, so GitHub's auto-close never fires for it at all. That is the stacking
 *     design in `branch-placement.ts`, chosen so sub-issues can see each other's work.
 *   - After a merge, `dispatchPostMergeAgent` re-invokes the agent to confirm and
 *     close the sub-issue. By the time it does, the link is gone.
 *
 * So the edge exists and GitHub will not keep it. Making it keepable means giving up
 * stacking or giving up the post-merge confirmation, which is a larger question than
 * where a number is written down.
 */
export const PARENT_ISSUE_TAG = numericTag("parent-issue");
/** Who to `@mention` on completion/escalation. */
export const NOTIFY_TAG = stringTag("notify", LOGIN_PATTERN);
/** Which agent originally created a PR (for post-merge/rejection re-invocation). */
export const ORIGIN_AGENT_TAG = stringTag("origin-agent", AGENT_NAME_PATTERN);
/** Slash-command-equivalent dispatch marker on a bot-authored comment. */
export const DISPATCH_TAG = stringTag("dispatch", AGENT_NAME_PATTERN);
/** Tags a posted result comment with which agent generated it (used by reconcile_github_session.ts to exclude an agent's own past comments from its future shared context). */
export const AGENT_TAG = stringTag("agent", AGENT_NAME_PATTERN);

/**
 * Whether the run that posted this comment changed anything.
 *
 * `yes` when it pushed a commit, opened a pull request or merged one; `no` when it
 * ran and left the repository as it found it. Read by `domain/work/progress.ts`, which
 * counts consecutive `no`s rather than keeping a counter -- see `dispatch-chain.ts`
 * for why a counter in the session could not work.
 */
export const CHANGED_TAG = stringTag("changed", "yes|no");
/** Marks a GitHub comment as human-visible operational audit only; excluded from future LLM context reconciliation. */
export const LLM_CONTEXT_TAG = stringTag("llm-context", "include|exclude");
/** Idempotency marker: atomaton dispatch was already triggered for a given closed sub-issue's completion (see lib/aggregation.ts). Fresh tag with no pre-existing data, written as plain `N`. */
export const AGGREGATED_TAG = numericTag("aggregated");
/** Progress marker: which sub-issue's completion a progress comment reports on. Write-only (nothing parses it back); written as plain `N`. */
export const SUB_RESULT_TAG = numericTag("sub-result");
/**
 * Counts how many times validation has sent a pull request back to the engineer.
 *
 * The auto-dispatch counter in `manage_dispatch_loop.ts` cannot bound this loop:
 * it only advances on a directive the agent itself wrote, and here the engineer
 * is dispatched by the validation workflow instead. So CI failing, the engineer
 * pushing, and CI failing again would repeat without limit, each turn costing a
 * model run. Counting the comments validation leaves is what stops it, and the
 * comments are worth leaving anyway -- they are where the engineer reads which
 * job failed.
 */
export const CI_RETRY_TAG = numericTag("ci-retry");

/**
 * The machinery's notice that preserves a removed person's comment, and the id of the
 * comment it quotes.
 *
 * Written by the two notices that remove a person's comment. The mid-run guard
 * (`guard_comment_during_run.ts`) replaces a deleted comment with one that reads its body
 * back before the delete and folds it in inside a `<details>` block, so what somebody
 * spent time writing survives on the page. The stop receipt (`request_stop.ts`) does the
 * same with the rest of a comment that began with `/stop`. The value is the deleted
 * comment's id -- the record of what the notice is quoting, though the comment it names
 * is gone.
 *
 * Read by `adapters/github/thread.ts` when it builds a thread entry: a comment carrying
 * this tag is a QUOTATION of a person's words, and the fold must not take what is
 * inside it for the machinery speaking. See `domain/work/thread.ts`'s `quoted`, which
 * is what this tag becomes -- a `/agent` line in the quoted text must not name an agent
 * and a tag the quoted text carries must not end the turn, or the notice hands the
 * deleted comment back the power the guard removed it to take away.
 */
export const QUOTES_TAG = numericTag("quotes");

/**
 * Whether this body is the machinery's notice that preserves a removed person's
 * comment.
 *
 * The domain reads the same fact as `ThreadEntry.quoted`, through the one entry
 * builder (`adapters/github/thread.ts`'s `entryOf`). But agent routing is not decided
 * by the thread fold alone: several readers scan RAW comment bodies -- `mostRecentAgent`
 * for `/resume` and the aggregation gate, `lastEnding` for a subtree resume,
 * `stopRequested` for the stop poll, the CI-retry count and the dispatch-chain tally.
 * None of them builds an entry, so none of them can see `quoted` -- and the quoted
 * text is verbatim, so a `/agent` line or a tag inside it would be taken for this
 * repository's own speech, handing the deleted comment back the power the guard
 * removed it to take away. They ask the tag here instead.
 *
 * The tag is written only by the machinery -- the guard's notice and the stop receipt --
 * so on a raw body it marks a quotation. A person writing the same tag in their own text
 * is prose about the machinery, and their command was already acted on when the comment
 * was posted; a reader that steps over the body falls through to the record underneath
 * rather than losing anything that has not already been spent.
 *
 * Stepping over the WHOLE body is right for a reader asking whose words a tag is: the
 * quoted text is the deleted author's, and these notices write no such tag in their own
 * prose. It is wrong where the notice's own prose IS the signal -- a stop receipt quotes
 * the removed comment and carries the stop tag in its prose -- so `watch_for_stop.ts`
 * asks `proseOnly` instead (#297).
 *
 * Read raw rather than `hasProse`, deliberately (#304's boundary). The tag is written
 * only by the machinery, in prose, so the fence rule buys nothing on the notices -- and
 * the failure directions are not symmetric. A quotation notice whose tag line sat inside
 * a fence would stop being a quotation, and the deleted comment preserved inside it
 * would speak again: the exact power the guard removed it to take away. A person quoting
 * the tag in a fence of their own comment is skipped by these readers, which is the
 * safer loss -- one ask to re-post, not a deleted comment back in the machinery's mouth.
 */
export function isQuotation(body: string): boolean {
  return QUOTES_TAG.has(body);
}

// `readAnyParentTag` was here: `PARENT_TAG.read(text) ?? PARENT_ISSUE_TAG.read(text)`,
// for a walk that did not know whether it held an issue or a pull request. With one
// tag left there is nothing to choose between, and the one caller that walks upward
// asks GitHub which kind it is looking at -- see `adapters/github/notify.ts`.

/**
 * `text` with every Atomaton tag removed.
 *
 * These markers exist to carry state between workflow runs through GitHub, which
 * means they live in issue bodies, pull request bodies and comments -- exactly the
 * text that becomes an agent's context. Nothing removed them on the way in, so an
 * agent read its own delivery machinery's bookkeeping as part of the conversation:
 * who to mention, whether the last run changed anything, and -- the one that gives
 * the shape away -- `llm-context=exclude`, a note saying this must not reach the
 * model, reaching the model.
 *
 * A tag on a line of its own takes the whole line with it, line ending included.
 * `
` as well as `
`: the machinery writes its comments through `gh --body` and gets
 * `
`, but an issue or pull request body a person edited in the browser comes back
 * with `
`, and those are the bodies `parent`, `notify` and `origin-agent` live in.
 * Matching only `
` left a stray carriage return and a blank line at the top of exactly
 * the text a person had touched.
 *
 * A tag inside a line takes the spacing on its right, so removing it reads as removing
 * a word rather than leaving a gap where one was.
 *
 * The line ending may also arrive written rather than typed. A tool server hands a
 * pull request body back inside a JSON document, where the newline after a tag is
 * the two characters `\` and `n`; matching only a real one left those behind as
 * escapes, so the body read as starting with blank lines.
 *
 * Only a tag with a real value is removed. Prose about the tags -- an issue
 * discussing `<!-- atomaton:parent=N -->` -- does not match the value patterns and
 * survives, which is what keeps this from quietly editing a conversation about
 * itself.
 *
 * A fenced code block is left alone. A tag-shaped literal inside one is a code
 * sample -- the text is about the machinery, not the machinery speaking -- and the
 * same argument holds for a diff, where the literal is part of a change under
 * review. Stripping those made a reviewer read `commandsIn("")` where the
 * committed line was `commandsIn("<!-- atomaton:dispatch=reviewer -->")`: a diff
 * that was not the diff (#293). The machinery only writes tags in prose, so
 * nothing is lost by stepping over fences.
 */
export function withoutTags(text: string): string {
  return fenceSegments(text)
    .map((segment) => (segment.code ? segment.text : stripTags(segment.text)))
    .join("");
}

function stripTags(text: string): string {
  const tags = EVERY_TAG_PATTERN.join("|");
  const lineEnd = String.raw`(?:\r?\n|(?:\\r)?\\n)?`;
  return text.replace(new RegExp(String.raw`(?:^[ \t]*)?(?:${tags})[ \t]*${lineEnd}`, "gm"), "");
}

/**
 * `text` with every fenced code block blanked out, for the tag readers.
 *
 * `read` scans anywhere in its argument, so a fenced sample carrying
 * `<!-- atomaton:llm-context=exclude -->` would drop the comment that quotes it
 * from an agent's context, and one carrying `agent=engineer` would mark it as
 * that agent's own result. The readers ask this first and see only prose.
 */
export function proseOnly(text: string): string {
  return fenceSegments(text)
    .map((segment) => (segment.code ? "\n" : segment.text))
    .join("");
}

interface TextSegment {
  text: string;
  /** Inside a fenced block: code, not prose. */
  code: boolean;
}

/**
 * `text` in alternating runs of prose and fenced code, by CommonMark's rule:
 * a fence opens with at least three backticks or tildes (up to three spaces of
 * indent) and closes with the same character, at least as many of them, and
 * nothing else on the line. A fence never closed runs to the end of the text,
 * which is the safe direction -- the rest is evidence rather than bookkeeping.
 *
 * Backtick fences may not carry backticks in their info string; that rule is what
 * keeps an inline `` `a` `` inside a sentence from opening a block.
 */
function fenceSegments(text: string): TextSegment[] {
  const lines = text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  const segments: TextSegment[] = [];
  let open: { char: string; length: number } | null = null;
  let current: TextSegment = { text: "", code: false };

  for (const line of lines) {
    const bare = line.replace(/\r?\n$/, "");
    const fence = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(bare);
    if (open === null) {
      const opens = fence !== null && (fence[1]![0] !== "`" || !fence[2]!.includes("`"));
      if (opens) {
        if (current.text) segments.push(current);
        open = { char: fence[1]![0]!, length: fence[1]!.length };
        current = { text: line, code: true };
      } else {
        current.text += line;
      }
      continue;
    }

    current.text += line;
    if (fence && fence[1]![0] === open.char && fence[1]!.length >= open.length && fence[2]!.trim() === "") {
      segments.push(current);
      current = { text: "", code: false };
      open = null;
    }
  }

  if (current.text) segments.push(current);
  return segments;
}
