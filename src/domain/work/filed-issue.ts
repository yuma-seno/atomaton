/**
 * filed-issue.ts — the root issue an agent files, the run it starts, and the
 * second filing of the same thing it has to recognise.
 *
 * ## Why there is anything to decide here
 *
 * `create_root_issue` is the one tool that makes an issue with no parent: a defect in
 * the machinery, or a decision somebody has to make before work exists to decompose.
 * It used to leave the issue alone after creating it — an agent found something, a
 * person was told, and nothing started until that person asked for a run. Two agents
 * doing the same job at the same time also filed the same defect twice, because
 * nothing compared a new title with the open ones.
 *
 * So the tool now starts a run itself, and refuses to file a title an open issue
 * already carries. Both are decisions rather than mechanics, and both are pure
 * functions here: `adapters/actions/dispatch-targets.ts` posts the comment and sends
 * the dispatch, `adapters/github/duplicate-issue.ts` reads the candidates, and
 * neither of those can be tested against a wording or a title rule without this.
 *
 * ## What is deliberately not here
 *
 * No depth counter, no per-issue memory of how many runs it has started. The chain
 * this starts is one link long by construction: a run that files an issue starts a
 * run, and if that run files another issue the machine has made a loop — which is a
 * bug to find, not a depth to cap. `chain.after_handoffs` and
 * `chain.after_runs_without_change` still bound how far an unattended chain drifts
 * before a person is asked, and they are the only bounds.
 */
import { isAgentName } from "./agent-name.ts";

/**
 * The one value that means "file the issue and start nobody".
 *
 * A word rather than an empty value, because this key is required and
 * `on_agent_issue:` with nothing after it is a YAML null: indistinguishable from the
 * key being absent, which the pull request's own check refuses. `off` is a decision
 * somebody wrote down.
 */
export const AGENT_ISSUE_OFF = "off";

/** What `agents.on_agent_issue` came to: an agent, nobody, or nobody with a reason. */
export interface AgentIssueSetting {
  /** The agent to start on a filed root issue, or `""` for none. */
  readonly agent: string;
  /**
   * The configured value the runtime could not use, when there was one.
   *
   * Carried rather than thrown or swallowed: the pull request that ships such a value
   * fails its own check, so reaching this means the config was changed outside one.
   * An issue an agent filed is still a real report, so the filing goes ahead with no
   * run — and the caller writes this to the ops log, which is the only place anybody
   * would look for why no run started.
   */
  readonly problem?: string;
}

/**
 * Whether an issue an agent files starts a run, read from `agents.on_agent_issue`.
 *
 * Unset, empty and `off` all start nobody, and none of them is a problem: the key is
 * required, so an absent one already failed a pull request's check, and a repository
 * that reached the default branch without it still files its issues.
 *
 * Anything that is neither `off` nor a well-formed agent name is treated the same way
 * and reported, because there is nothing better to do with it here. Dispatching it
 * would be `gh workflow run --field agent=<typo>`, which GitHub accepts and which
 * starts a run that aborts on a missing definition — a failure a person reads as "the
 * feature is broken" rather than as the typo it is.
 */
export function resolveAgentIssueLauncher(value: unknown): AgentIssueSetting {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw === "" || raw === AGENT_ISSUE_OFF) return { agent: "" };
  if (isAgentName(raw)) return { agent: raw };
  return {
    agent: "",
    problem: `\`agents.on_agent_issue\` is '${raw}', which is neither an agent name nor \`${AGENT_ISSUE_OFF}\``,
  };
}

/**
 * A title as two filings of the same report are compared.
 *
 * Case and white space, and nothing else. Punctuation, wording and the order of the
 * words are the reporter's, and two agents describing one defect will differ in all
 * three — so a comparison that tried to be cleverer than this would start refusing
 * genuinely different reports, which is the expensive direction: a defect nobody
 * filed is worse than a defect filed twice.
 *
 * The comparison is exact on what is left, because a partial match is a question
 * ("is this the same?") and a machine answering it wrongly is what the run exists to
 * avoid.
 */
export function normaliseIssueTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

/** An open issue, as little of it as the duplicate check needs. */
export interface OpenIssueTitle {
  readonly number: number;
  readonly title: string;
}

/**
 * The open issue already carrying this title, or `0` for none.
 *
 * `0` rather than `undefined` so the caller has one shape to branch on and no
 * optional chain to write; issue numbers start at 1, so it cannot collide with a real
 * one.
 */
export function duplicateIssueOf(title: string, open: readonly OpenIssueTitle[]): number {
  const wanted = normaliseIssueTitle(title);
  if (wanted === "") return 0;
  return open.find((issue) => normaliseIssueTitle(issue.title) === wanted)?.number ?? 0;
}

/** The run a report came from, when the environment says. All of it is optional. */
export interface ReportingRun {
  /** The node the reporting run sits on: the issue or pull request number it was working. */
  readonly node?: number;
  /** The reporting run's own URL. */
  readonly runUrl?: string;
  /** The agent that filed it. */
  readonly agent?: string;
}

/**
 * The "reported from" sentence the started run reads, or `""` when nothing is known.
 *
 * Prose rather than dispatch inputs, because the started run learns what to do from
 * its thread: a run that cannot see where the report came from has no way to go and
 * read the pull request or the run that found the defect. "Reported", not "filed": the
 * issue may have been filed by an earlier run entirely, and what this line says is
 * where the report the agent is about to read came from.
 */
export function reportedFromLine(report: ReportingRun): string {
  const where = report.node === undefined ? "" : `#${report.node}`;
  const by = (report.agent ?? "").trim();
  const url = (report.runUrl ?? "").trim();
  const origin = [where, by === "" ? "" : `by \`${by}\``].filter((part) => part !== "").join(" ");
  if (origin === "" && url === "") return "";
  const link = url === "" ? "" : ` (${url})`;
  return `Reported from ${origin === "" ? "a run" : origin}${link}.`;
}
