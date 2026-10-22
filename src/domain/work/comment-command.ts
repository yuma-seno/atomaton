/**
 * comment-command.ts — what counts as a command to Atomaton, in any text.
 *
 * A command is a line that asks for an agent (`/engineer`, `/engineer recover`, or the
 * `atomaton:dispatch` marker the machinery writes) or acts on a run (`/stop`,
 * `/resume`). This is the one definition of that syntax, and three readers share it:
 *
 *   - `parse_comment_command.ts` reads a person's comment to decide what to start
 *   - `domain/work/thread.ts`, through the thread reader, reads a thread to decide
 *     whose turn it is
 *   - `create_pr`, `create_sub_issue` and `create_root_issue` read an agent's body to refuse one
 *
 * They used to be two: the parser had its own patterns, and `extract_directive.ts` had
 * another idea of what a command line looks like. Three readers with two definitions is
 * how a body ends up refused by one and dispatched by another.
 *
 * ## Why an agent's body may not contain one
 *
 * A command is a request from someone entitled to make it. An agent writing
 * `/engineer` into a pull request body or an issue body is not asking; it is putting
 * words on a page that the next reader — `extract_directive.ts` on a pull request,
 * `resolve_entry_agent.ts` on an issue — will take for a request. The route an agent
 * has to start someone is a tool argument (`reviewer`, `launch_sub_agent`), which the
 * machinery writes in the form it reads and which the hand-off limit counts.
 *
 * Pure: text in, text out.
 */
import { AGENT_NAME_PATTERN } from "./agent-name.ts";
import { isControlCommand, type ControlCommand } from "./control-commands.ts";

const COMMAND_RE = new RegExp(`^\\/(${AGENT_NAME_PATTERN})(?:\\s+(.*))?$`);
// Deliberately NOT `DISPATCH_TAG.read` from `adapters/github/tags.ts`, and the
// difference is load-bearing: this must be anchored to the start of a line so a
// dispatch marker quoted inside a human's comment cannot trigger a run, whereas
// `DISPATCH_TAG` matches anywhere in a body by design. The whitespace tolerance around
// `=` is likewise wider than the tag writer ever emits -- it costs nothing and this is
// the one place reading a marker a human may have retyped by hand.
const DISPATCH_RE = new RegExp(`^<!--\\s*atomaton:dispatch\\s*=\\s*(${AGENT_NAME_PATTERN})\\s*-->`);

/**
 * How a run starts: continuing the saved session, or rebuilding it.
 *
 * Exported as a list, because the same two words are validated in three places — the
 * parser here, `restore_agent_session.ts`, and a bash `[[ ... ]]` in
 * `atomaton-runner.wac.ts` that is generated from this list rather than hand-kept in
 * step. A third mode added here reaches all three.
 */
export const SESSION_MODES = ["continue", "recover"] as const;

export type SessionMode = (typeof SESSION_MODES)[number];

/**
 * The two ways a person restarts work after a run that ended, as the notices say them.
 *
 * Every notice that hands a node back to a person after a run that left no usable
 * report — the failure notice (`report_run_failure.ts`), the run watch's notice
 * (`reconcile_run_ending.ts`) — says the same two things next, because the person
 * reading it has the same decision: carry the history, or archive it and start
 * clean. Which of those is right is a judgement about the work, and it belongs to
 * the person rather than to the machinery, so the notices name both and decide
 * nothing.
 *
 * Here rather than in either script, because the lines spell the two commands this
 * file is the one definition of — `/<agent>` and `/<agent> recover`, the two
 * `SESSION_MODES` — and a second copy of them beside the parser is a second
 * definition of the syntax waiting to disagree with it.
 */
export function recoveryLines(agent: string): string[] {
  return [
    `- Continue: comment \`/${agent}\` and put what to do next on the following lines.`,
    `- Start clean: comment \`/${agent} recover\`, which archives this session and rebuilds`,
    "  it from the issue.",
  ];
}

export interface ParsedCommentCommand {
  agent: string;
  control: ControlCommand;
  sessionMode: SessionMode;
  error: string;
}

const NOTHING: ParsedCommentCommand = { agent: "", control: "", sessionMode: "continue", error: "" };

/** The first command in a comment, or nothing. Any line may carry it. */
export function parseCommentCommand(body: string): ParsedCommentCommand {
  if (!body) return NOTHING;
  for (const rawLine of body.split("\n")) {
    const parsed = parseCommandLine(rawLine);
    if (parsed !== undefined) return parsed;
  }
  return NOTHING;
}

/** One line that reads as a command, with the line itself for telling a person what it was. */
export interface CommentCommandLine {
  /** The line as it was written, trimmed. */
  line: string;
  /** What the parser makes of it — a command, or the error that stops it. */
  command: ParsedCommentCommand;
}

/**
 * Every command a comment asks for, in the order they appear.
 *
 * `parseCommentCommand` answers "what does this comment ask for" and returns the first,
 * because the machinery acts on one request per comment. This answers "how many", so a
 * guard can refuse a comment that asks for two: the second would be read by nobody, and
 * which one wins is not visible on the page.
 *
 * A line the parser rejects is counted too. `parseCommentCommand` stops at the FIRST
 * command line, so a malformed one above a valid one loses the valid one as thoroughly
 * as a well-formed one above it would — only the error on the first line is reported,
 * and the person is never told the second request existed. Counting it is what lets the
 * guard say so.
 *
 * Strict, like the parser it shares its line reader with — a command is a line that
 * begins with one. A directive quoted inside somebody's prose (`> /engineer`) is not a
 * request the machinery would act on, so it is not a second command here either.
 */
export function commandsIn(body: string): CommentCommandLine[] {
  const found: CommentCommandLine[] = [];
  if (!body) return found;
  for (const rawLine of body.split("\n")) {
    const parsed = parseCommandLine(rawLine);
    if (parsed !== undefined) found.push({ line: rawLine.trim(), command: parsed });
  }
  return found;
}

/** One line read as a command, or `undefined` when it is not one. The one scan. */
function parseCommandLine(rawLine: string): ParsedCommentCommand | undefined {
  const line = rawLine.trim();
  const commandMatch = COMMAND_RE.exec(line);
  if (commandMatch) {
    const name = commandMatch[1]!;
    const modifier = commandMatch[2]?.trim() ?? "";

    // Before the agent branch, so a control command never reaches it. See
    // `domain/work/control-commands.ts`.
    if (isControlCommand(name)) {
      if (!modifier) return { ...NOTHING, control: name };
      // `/resume 直して` is the one mistake worth naming, because the thing the
      // person wanted exists and is one line away: an ordinary agent command
      // resumes the same session AND carries the instruction, which is why
      // `/resume` deliberately takes none.
      return {
        ...NOTHING,
        error: `'/${name}' takes nothing after it. To resume with an instruction, use '/<agent>' and put the instruction on the following lines.`,
      };
    }

    if (!modifier) return { ...NOTHING, agent: name };
    if (modifier === "recover") return { ...NOTHING, agent: name, sessionMode: "recover" };
    return {
      ...NOTHING,
      error: `Unknown command syntax: '/${name} ${modifier}'. Put instructions on the lines after '/${name}', or use '/${name} recover'.`,
    };
  }
  const dispatchMatch = DISPATCH_RE.exec(line);
  if (dispatchMatch) return { ...NOTHING, agent: dispatchMatch[1]! };
  return undefined;
}

/**
 * The spellings one line may be read under.
 *
 * A model's markdown mangles a bare `/engineer` in a few ordinary ways — a list bullet,
 * a quote marker, backticks around all of it or around the name — and the reader of an
 * agent's output tolerates them, because a backtick makes a real handoff disappear
 * while accepting one costs nothing. See `extract_directive.ts`.
 *
 * Shared so the refusal below sees the same lines that reader accepts. A body refused
 * for `/engineer` and dispatched for `- /engineer` would be two definitions of one
 * thing.
 */
export function lineForms(rawLine: string): string[] {
  let line = rawLine.trim();
  if (!line) return [];
  line = line.replace(/^(?:[-*+]\s+|>\s*)+/, "");
  const variants = [line];
  if (line.startsWith("`") && line.endsWith("`") && line.length > 2) {
    variants.push(line.slice(1, -1).trim());
  }
  if (line.startsWith("/`") && line.endsWith("`") && line.length > 3) {
    variants.push("/" + line.slice(2, -1).trim());
  }
  return variants;
}

/**
 * The first command in text a model wrote, where markdown may have mangled it.
 *
 * `parseCommentCommand` is anchored on a line that begins with `/` — what a person
 * types and what the machinery writes. A model's markdown turns the same directive
 * into a list bullet (`- /engineer`), a quote marker (`> /engineer`), or wraps it in
 * backticks, and `extract_directive.ts` accepts every one of those as a real handoff
 * through `lineForms`. The runner then posts the model's final text back as the
 * result comment verbatim, so a directive dispatched from `- /engineer` sits in the
 * thread as a line the strict parser cannot see.
 *
 * That gap matters to a reader of the THREAD asking "what was asked here, so a push
 * can be recognised as the answer": the ask disappears, and the agent the push
 * already answered is dispatched again. See `latestAsk`.
 *
 * Not a looser definition of a command, and not used wherever `parseCommentCommand`
 * is: a command a person typed is read strictly, because a bullet in a person's
 * prose was never a request the machinery acted on. Only the ask path needs the
 * tolerance the handoff path already has.
 */
export function parseMangledCommand(body: string): ParsedCommentCommand {
  if (!body) return NOTHING;
  for (const rawLine of body.split("\n")) {
    for (const form of lineForms(rawLine)) {
      const parsed = parseCommentCommand(form);
      if (parsed.agent !== "" || parsed.control !== "") return parsed;
    }
  }
  return NOTHING;
}

function isCommand(form: string): boolean {
  const parsed = parseCommentCommand(form);
  return parsed.agent !== "" || parsed.control !== "";
}

/**
 * The lines of `text` that a reader would take for a command.
 *
 * Code fences are not excluded. The readers this guards against do not skip them
 * either — `extract_directive.ts` takes a `/engineer` line from inside one — so a rule
 * that did would refuse less than the thing it protects against acts on.
 *
 * A line with instructions after the name (`/engineer fix it`) is not a command to any
 * reader: it is a malformed one, which the parser reports as an error and starts
 * nothing from. It is not returned here.
 */
export function commandLinesIn(text: string): string[] {
  const found: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line && lineForms(line).some(isCommand)) found.push(line);
  }
  return found;
}

/**
 * Why an agent-written body cannot be sent as it stands, or nothing.
 *
 * `instead` is the route that does work, and it is required rather than optional:
 * measured three times in this project on three different guards, a refusal that says
 * what to do instead is followed and one that only states a rule is not.
 */
export function commandInBodyRefusal(found: readonly string[], what: string, instead: string): string | undefined {
  if (found.length === 0) return undefined;
  const quoted = found.map((line) => `"${line}"`).join(", ");
  return (
    `This ${what} has ${quoted} on a line of its own, which Atomaton reads as a command to start an ` +
    `agent. A command is a request from someone entitled to make it, and a body an agent wrote is ` +
    `not one. ${instead} To mention a command in prose, put it inside a sentence rather than alone ` +
    "on its line."
  );
}
