/**
 * agent-env.ts — the environment a tool server runs under, and the two facts the
 * runner computes about the run around it.
 *
 * ## Why this lives in a module now
 *
 * The environment was an inline bash array in the agent step, and the step had
 * grown past GitHub's 21,000-character bound on one expression — every
 * workflow_dispatch was refused at parse time, so no agent run could start
 * (measured: HTTP 422, "Exceeded max expression length 21000"). Building the
 * entries here moves the list into a file that can be unit-tested, and puts
 * GitHub's bound behind code that no longer grows when the run's behaviour does.
 *
 * ## The contract the entries are
 *
 * Adding a name here means adding it to `AGENT_ENV_NAMES` in
 * `domain/delivery/declared-secrets.ts` as well: a name the agent's process
 * already means something by is a name `tools.secrets` must not be able to mean
 * something else by. This is not an import — the values come from the step's own
 * environment — so `agent-environment.test.ts` is what holds the two together,
 * by calling `buildAgentEnv` and comparing the names it produces. It has caught
 * this drifting twice.
 */
import { readFileSync } from "node:fs";
import { MACHINERY_ROOT_VAR } from "../../../domain/machinery/machinery-layout.ts";
/** What a server sees, spelled as `NAME=VALUE` strings, in the order they are declared. */
export function buildAgentEnv(
  source: Record<string, string | undefined>,
  paths: { toolCache: string; runDir: string },
): string[] {
  const entries: Array<[string, string]> = [
    ["HOME", source.HOME ?? ""],
    ["PATH", source.PATH ?? ""],
    ["AGENT", source.AGENT ?? ""],
    // The name is the layout's, and the value arrives under the same name: the
    // variable is spelled nowhere but the layout, and resolved nowhere but
    // `adapters/runner/machinery.ts` — see `machinery-root.test.ts`.
    [MACHINERY_ROOT_VAR, source[MACHINERY_ROOT_VAR] ?? ""],
    // The uid `run_as_untrusted.sh` drops each untrusted server to. The sudo rule
    // and both users are created in the step that prepares the tool servers.
    ["ATOMATON_UNTRUSTED_USER", source.ATOMATON_UNTRUSTED_USER ?? ""],
    ["GITHUB_REPOSITORY", source.GITHUB_REPOSITORY ?? ""],
    ["BRANCH", source.BRANCH ?? ""],
    ["NUMBER", source.NUMBER ?? ""],
    ["NOTIFY", source.NOTIFY ?? ""],
    ["TYPE", source.TYPE ?? ""],
    // The tally this run arrived with. `reload_environment` reads it to decide
    // whether it may rebuild again — a missing one reads as zero and silently
    // buys extra reloads.
    ["ATOMATON_RELOAD_COUNT", source.ATOMATON_RELOAD_COUNT ?? ""],
    // The agent that started this run, or empty when a person or the machinery did.
    ["ATOMATON_DISPATCHED_BY", source.ATOMATON_DISPATCHED_BY ?? ""],
    // The ask this run claimed (#285). Empty for a body-started run.
    ["ATOMATON_ASK_ID", source.ATOMATON_ASK_ID ?? ""],
    // The run's own id, beside the ask: the tools write both onto their endings
    // (#285), and the pair is what the watch compares.
    ["GITHUB_RUN_ID", source.GITHUB_RUN_ID ?? ""],
    ["ATOMATON_OPS_LOG", source.ATOMATON_OPS_LOG ?? ""],
    // This run's own directory, and the URL for the run itself. The tools use the
    // first to record which comment ended the run's turn, and the second to link
    // the artifacts they leave back to the run that made them.
    ["ATOMATON_RUN_DIR", paths.runDir],
    ["ATOMATON_RUN_URL", `${source.GITHUB_SERVER_URL ?? ""}/${source.GITHUB_REPOSITORY ?? ""}/actions/runs/${source.GITHUB_RUN_ID ?? ""}`],
    // Caches, because $HOME is read-only to this user. CARGO_HOME is not a cache
    // directory — redirecting it also hides ~/.cargo/config.toml — but cargo has no
    // separate cache variable, and a project needing that config can commit
    // .cargo/config.toml, which cargo reads from the work tree.
    ["XDG_CACHE_HOME", paths.toolCache],
    ["XDG_CONFIG_HOME", `${paths.toolCache}/config`],
    ["XDG_DATA_HOME", `${paths.toolCache}/data`],
    ["BUN_INSTALL_CACHE_DIR", `${paths.toolCache}/bun`],
    ["npm_config_cache", `${paths.toolCache}/npm`],
    ["PIP_CACHE_DIR", `${paths.toolCache}/pip`],
    ["CARGO_HOME", `${paths.toolCache}/cargo`],
  ];

  // Repository VARIABLES, not credentials: which provider to use and which host to
  // reach. Each is included only when non-empty — an empty ATOMA_PROVIDER would
  // defeat Atoma's provider auto-detection, and an empty base URL would point
  // every request at "/chat/completions".
  for (const name of ["OPENAI_BASE_URL", "ATOMA_PROVIDER"] as const) {
    const value = source[`${name}_IN`];
    if (value !== undefined && value !== "") entries.push([name, value]);
  }

  return entries.map(([name, value]) => `${name}=${value}`);
}

/**
 * What is left of the job, handed to atoma as its own limit. The agent stops
 * itself with time to spare instead of being killed mid-call, which is the
 * difference between a session saved for the next run and one that never was.
 *
 * A floor, not a ceiling: when the job is already at its end the agent gets the
 * minimum anyway, with a warning, rather than a budget it cannot act inside.
 */
export function agentBudget(
  deadlineAt: number,
  now: number,
  minBudgetSecs: number,
): { budget: number; floored: boolean } {
  const left = Math.floor(deadlineAt - now);
  if (left < minBudgetSecs) return { budget: minBudgetSecs, floored: true };
  return { budget: left, floored: false };
}

/**
 * Whether this run changed anything, read from the structured ops log.
 *
 * A commit is the obvious one; opening a pull request and merging one both move
 * the work along without necessarily pushing during THIS run, and reading either
 * as "changed nothing" would stop a chain at the moment it was working.
 *
 * `merge_base_into_branch` is the fourth, and it is only progress in its
 * `merged` outcome: a reviewer sees `behind` or `conflicting`, the engineer
 * brings the base in, the merge is clean and pushed, and no commit_and_push
 * follows because there is nothing left to commit — so without this the whole
 * point of the route is recorded as a run that changed nothing. Its other
 * outcomes pushed nothing and must keep counting as nothing.
 */
export function changedSoFar(opsLogPath: string | undefined): boolean {
  if (!opsLogPath) return false;
  let content: string;
  try {
    content = readFileSync(opsLogPath, "utf8");
  } catch {
    return false;
  }
  return content.split("\n").some(
    (line) =>
      /"op":"(commit_and_push|create_pr|merge_pr)"/.test(line) || /"op":"merge_base_into_branch".*"status":"merged"/.test(line),
  );
}
