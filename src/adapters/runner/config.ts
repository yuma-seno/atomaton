/**
 * config.ts — shared helper for reading .github/atomaton/config.yaml. The one
 * canonical copy used by every script and MCP server in this repo.
 *
 * Resolved through `adapters/runner/machinery.ts`, which is the one place that knows which tree
 * the machinery is in -- and `MACHINERY_ROOT_VAR`'s comment is the one place that
 * says which job sets it, and why the three jobs differ.
 */
import { readFileSync } from "node:fs";
import { DEFAULT_GOVERNED_PATHS } from "../../domain/delivery/merge-readiness.ts";
import { CHECKS_FROM_DEFAULT_BRANCH, CHECKS_FROM_PULL_REQUEST } from "../../domain/delivery/check-jobs.ts";
import { resolveDeclaredJobs, type DeclaredJobsResolution } from "../../domain/delivery/declared-jobs.ts";
import { resolveMergeGates, type MergeGatesResolution } from "../../domain/delivery/merge-gates.ts";
import type { AtomaConfig, NewReleaseMode, NewReleaseScope } from "../../domain/delivery/declared-config.ts";
import { isNewReleaseMode, isNewReleaseScope } from "../../domain/delivery/declared-config.ts";
import { resolveAgentIssueLauncher, type AgentIssueSetting } from "../../domain/work/filed-issue.ts";
import { CONFIG_FILE } from "../../domain/machinery/machinery-layout.ts";
import { machineryPath } from "./machinery.ts";

/**
 * Where this project's configuration is read from.
 *
 * Through `machineryPath`, which is the one place that knows what an unset
 * `MACHINERY_ROOT_VAR` means, and whose comment holds the table of which job sets it
 * and why. This function used to resolve it itself, as one of three hand-written
 * copies of that rule.
 */
function configPath(): string {
  return machineryPath(CONFIG_FILE);
}

let cached: AtomaConfig | undefined;

/**
 * The line of a `git merge-file` collision in `text`, or null when there is none.
 *
 * A marker is the one thing in this file that no setting can survive: YAML's own
 * complaint about the line after `<<<<<<<` is `Multiline implicit key`, which names
 * a token and not a cause — the run that reads it learns nothing about what to do.
 * The update no longer writes markers here (`lib/update-apply.ts` says why), so what
 * this catches is a tree that arrived holding one: a person's half-resolved edit, or
 * a branch from before that rule. Its job is to say so in words the reader can act
 * on. #668 is the incident that made the message worth writing.
 */
function conflictMarker(text: string): string | null {
  return /^(?:<{7}|>{7})(?: |$)/m.exec(text)?.[0] ?? null;
}

/**
 * Load and parse the configuration, cached after the first read in a process.
 *
 * YAML rather than JSON so a setting can carry its reason beside it. `Bun.YAML`
 * follows YAML 1.2, where `no`, `on` and `y` are strings and only `true`/`false`
 * are booleans -- the coercion trap that makes YAML risky for a file full of branch
 * and label names is not present here. Measured, not assumed.
 */
export function loadConfig(): AtomaConfig {
  if (!cached) {
    const text = readFileSync(configPath(), "utf8");
    const marker = conflictMarker(text);
    if (marker !== null) {
      throw new Error(
        `${CONFIG_FILE} carries a conflict marker ('${marker.trim()} ...'): an update merge collided here and the file ` +
          "was never resolved. Both sides are named in the markers — resolve them, then run this again.",
      );
    }
    cached = Bun.YAML.parse(text) as AtomaConfig;
  }
  return cached;
}

/**
 * The label each key means when `config.yaml` does not say.
 *
 * One place, because a default written at the call site is written at every call site: the
 * sub-issue label's fallback appeared in `sibling-check.ts` and in `mcp/github.ts`, the
 * launched one in `sibling-check.ts` and `dispatch_sub_agent.ts`, the in-progress one in
 * two scripts. Change the writer's and not the reader's and `countOpenSiblings` filters on
 * a label nothing applies, so the sibling count never reaches zero and the parent is never
 * dispatched — with every run green.
 */
export const DEFAULT_LABELS = {
  sub_issue: "atomaton/sub-issue",
  launched: "atomaton/launched",
  in_progress: "atomaton/in-progress",
  /** The complement of `in_progress`: the turn came back and a person holds it (#223). */
  waiting_for_person: "atomaton/waiting-for-person",
} as const;

/** A label key that has a default. */
export type LabelKey = keyof typeof DEFAULT_LABELS;

/**
 * Look up a label from the `chain.labels` section of config.yaml.
 *
 * The fallback comes from [`DEFAULT_LABELS`] rather than from the caller, so two callers
 * asking for the same label cannot disagree about what it is called.
 */
export function getLabel(key: LabelKey): string {
  return loadConfig().chain?.labels?.[key] ?? DEFAULT_LABELS[key];
}

/** Look up `merge.policy` from config.yaml. The fallback is the shipped default. */
export function getMergePolicy(fallback = "auto"): string {
  return loadConfig().merge?.policy ?? fallback;
}

/**
 * What the machinery does when it notices a newer release: `issue`, `pr` or
 * `pr-agent`.
 *
 * `issue` is the default, and it is also what an absent key, an unreadable value and
 * a value that is not a mode all answer. That is deliberate for the same reason
 * `getMergePolicy` defaults rather than throws: the notice-only behaviour changes
 * nothing in the tree, so a project that misspelled the key learns about it from
 * `configProblems` on its pull request rather than from a run that took the release
 * on its behalf.
 */
export function getNewReleaseMode(fallback: NewReleaseMode = "issue"): NewReleaseMode {
  const mode = loadConfig().update?.on_new_release;
  return isNewReleaseMode(mode) ? mode : fallback;
}

/**
 * Whether a root issue an agent files starts a run, and which agent.
 *
 * Resolved here rather than at the tool, for the reason every reader in this file
 * exists: two callers asking what the setting means cannot disagree about it.
 * `off`, an absent key and a value that is not an agent name all answer "nobody" --
 * `resolveAgentIssueLauncher` owns that decision, and the caller passes its `problem`
 * on to the ops log, which is the only place somebody would look for why no run
 * started on the issue they filed.
 */
export function getAgentIssueLauncher(): AgentIssueSetting {
  return resolveAgentIssueLauncher(loadConfig().agents?.on_agent_issue);
}

/**
 * Which newer releases are noticed: `all` or `marked`.
 *
 * `all` is the default, and it is what an absent key, a value that is not a scope and
 * an unreadable value all answer. The trade is the same one `getNewReleaseMode`
 * makes and lands the other way round on purpose: a setting that cannot be read
 * notices MORE than it asked to, and a project that misspelled the key learns about
 * it from `configProblems` rather than by silently missing the release it wanted.
 */
export function getNewReleaseScope(fallback: NewReleaseScope = "all"): NewReleaseScope {
  const scope = loadConfig().update?.detection_scope;
  return isNewReleaseScope(scope) ? scope : fallback;
}

/**
 * The agent `update.on_new_release: pr-agent` starts on a conflicted update pull
 * request, or "" when the repository names none.
 *
 * Empty rather than a default, for the reason `AtomaConfig.agents` gives: a default
 * would be this file naming an agent. `configProblems` reports the pair when the
 * mode is `pr-agent` and this is unset, so the empty answer is a tree that never
 * passed its own check -- and the update then stops for a person, which is what
 * `issue` and `pr` do.
 */
export function getUpdateConflictAgent(): string {
  return (loadConfig().agents?.on_update_conflict ?? "").trim();
}

/**
 * The collision policy, read from a tree this run has just written itself.
 *
 * Every other reader in this file throws on a config.yaml that exists and will not
 * parse, and that is right for a caller deciding what to do before anything is
 * written. The update is the one caller that reads the file AFTER it has applied the
 * plan, committed and pushed: a throw there lands between the push and the pull
 * request, so the pushed branch is all that survives — no pull request, no comment,
 * nobody told (#638). The apply no longer writes markers into this file, but a tree
 * can still arrive with a config nothing can parse — a person's edit in progress, a
 * release whose own copy does not parse — and none of those are a reason to lose the
 * pull request.
 *
 * So this answers instead of throwing. `readable: false` means the policy could not
 * be read, and the only honest use of it is what the default mode does: stop at the
 * pull request and leave the decision to a person.
 */
export function tryGetUpdateConflictPolicy(): { agent: string; readable: boolean } {
  try {
    return {
      agent: getNewReleaseMode() === "pr-agent" ? getUpdateConflictAgent() : "",
      readable: true,
    };
  } catch {
    return { agent: "", readable: false };
  }
}

/**
 * Branch an issue's work starts from and targets, or "" for the default branch.
 *
 * Empty is deliberately the normal answer: callers pass it straight to `gh`,
 * which falls back to the repository's default branch on its own, so a project
 * that never sets this needs no special case anywhere.
 */
export function getBaseBranch(fallback = ""): string {
  // The one reader here that tolerates a MISSING config.yaml. No config means no
  // base branch, which is the same answer as a config without the key, so
  // `create_pr` should not start failing over a setting whose absence is the
  // normal case. The others deliberately still throw: defaulting a merge policy
  // or a label because a file could not be read would act on a guess.
  //
  // Narrowed to ENOENT, having been a bare `catch`. That caught a config.yaml
  // that exists and will not parse as well — the one case where every other
  // reader in this file throws, and where this one quietly aimed `create_pr` at
  // the default branch instead. "The file is not there" and "the file is broken"
  // are different facts and only the first is ordinary.
  try {
    return loadConfig().base_branch?.trim() || fallback;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw error;
  }
}

/**
 * Default cross encoder for issue search.
 *
 * Multilingual, and chosen on measurement rather than on the language this
 * repository happens to be written in: on a Japanese corpus it reached 91% top-1
 * against 86% for the Japanese-specialised model it was compared with. A
 * multilingual default costs nothing here and is the only sensible default for
 * a template that ships to repositories in languages nobody here anticipated.
 *
 * This is the one model choice that changes the answer. Swapping the first
 * stage's model moved nothing; swapping this one moved top-1 from 27% to 91%.
 */
// Exported because the runner needs it too: it keys the model cache on the model
// name, and a fallback of its own would key on a different name than the one the
// server then loads -- so the cache would never hit and nothing would say why.
export const DEFAULT_RERANKER = "onnx-community/bge-reranker-v2-m3-ONNX";

/**
 * The cross encoder issue search ranks with.
 *
 * Configurable because the default was picked by measuring one repository, and
 * a repository in another language — or one that would rather not download 600MB
 * on the first search — should be able to say so.
 */
export function getRerankerModel(): string {
  // Narrowed here rather than in `AtomaConfig`, which passes a server entry through
  // untyped so the schema and the interface agree about what a known key is. This is
  // the one reader of the one reserved key, so the cast lives with it.
  const settings = loadConfig().tools?.servers?.search?.settings as { reranker_model?: string } | undefined;
  return settings?.reranker_model?.trim() || DEFAULT_RERANKER;
}

/** The orphan branch documents are published onto, and its default. */
export const DEFAULT_DOCS_BRANCH = "business-docs";

/**
 * The branch `publish_draft` puts documents onto.
 *
 * Configurable because the default was picked for this template, and an adopter
 * whose document branch is named differently should be able to say so without
 * forking anything. It is also the ONLY way the branch is chosen: the tool takes no
 * branch argument, because naming a branch from the outside is what let a publish
 * land on somebody's work branch (#254). A settings mistake then surfaces on the
 * pull request that tried to publish — refused by the tool's own default-branch and
 * work-branch guards — rather than as a document in the tree people review.
 */
export function getDocsBranch(): string {
  // Tolerant of a MISSING config.yaml for the same reason `getBaseBranch` is: no
  // config means no override, which is the same answer as a config without the
  // key, and the tool should not start failing over a setting whose absence is
  // the normal case. A config that exists and will not parse still throws.
  // Narrowed here rather than in `AtomaConfig`, like `getRerankerModel` above: the
  // cast lives with the one reader of the one reserved key.
  let branch: string | undefined;
  try {
    const settings = loadConfig().tools?.servers?.attachments?.settings as { branch?: string } | undefined;
    branch = settings?.branch;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  // `refs/heads/x` and `x` are the same branch, and the push below adds the prefix
  // itself — normalised rather than refused, because it is the spelling somebody
  // reading `ls-remote` output has in front of them.
  return branch?.trim().replace(/^refs\/heads\//, "") || DEFAULT_DOCS_BRANCH;
}

/**
 * Paths whose change makes a merge a person's to perform.
 *
 * Configurable because "how agents run here" is not the same set of files in
 * every repository — one that keeps its workflows generated from source has a
 * second place to name. An empty array in config.yaml is a deliberate choice to
 * turn the gate off, and is honoured; an absent key takes the default.
 */
export function getGovernedPaths(): readonly string[] {
  return loadConfig().merge?.governed_paths ?? DEFAULT_GOVERNED_PATHS;
}

/**
 * This project's conditional merge gates, validated.
 *
 * Problems come back rather than throwing, like the deploy lists do, because the
 * caller turns them into a blocker: a gate that cannot be read must stop the
 * merge, and a thrown error at this depth would surface as a tool failure that
 * loses the verdict instead of reporting it.
 */
export function getMergeGates(): MergeGatesResolution {
  return resolveMergeGates(loadConfig().merge?.gates);
}

// `getTriggerAgent` was here: it read which agent an unconditional `auto_triggers`
// entry routed an event to, and had exactly one caller -- `dispatchPrValidation`,
// asking who reviews a pull request.
//
// That coupling was removed. Which agent reviews is now a parameter the
// caller passes, because opening a pull request no longer starts anyone by itself.
// Nothing else ever asked this question, so the function went with the trigger.

// No `getDeclaredSecrets()` here on purpose, though every other setting has a
// reader in this file.
//
// The credential declaration is read from the default branch by
// `read_secret_names.ts`, which loads that file itself and refuses to guess a
// path. A convenience wrapper here would be a second route to the same answer,
// and the next caller would find it first.
//
// `configPath()` above now sends every other setting to the default branch too on
// a runner, which makes the two consistent -- but not interchangeable. That one
// resolves a path it was handed; this one resolves one from the environment. The
// separation is what keeps a missing `ATOMATON_MACHINERY_ROOT` from silently
// downgrading a credential decision to the working tree.

/**
 * The checks whose commands the pull request itself declares.
 *
 * Empty means this project runs nothing through `atomaton-check.yml`, which is the
 * normal state for a repository pointing `checks.your_workflow` at its own workflow.
 *
 * `secretsAllowed: false` is the trust boundary, not a setting: a pull request may
 * rewrite any command it declares, so a credential named beside one is a credential
 * the change being judged can read.
 */
export function getPullRequestChecks(): DeclaredJobsResolution {
  return resolveDeclaredJobs(loadConfig().checks?.from_pull_request, CHECKS_FROM_PULL_REQUEST);
}

/**
 * The checks that run the default branch's commands and may hold credentials.
 *
 * Read from whichever config the caller was pointed at, and the workflow points the
 * planning job at the DEFAULT BRANCH's copy. That is what makes the promise true: a
 * pull request cannot add a job, rename one, or change which secret one receives.
 */
export function getDefaultBranchChecks(): DeclaredJobsResolution {
  return resolveDeclaredJobs(loadConfig().checks?.from_default_branch, CHECKS_FROM_DEFAULT_BRANCH);
}

/**
 * This project's whole `deploy` section, unvalidated.
 *
 * `resolveDeployJobs` is what reads it, and it lives in `domain/` so that
 * `deliverable-integrity.ts` can run the same reader over a pull request's config
 * without a file on disk. Handing back the raw section rather than the resolution
 * keeps one reader rather than two that can disagree about what a malformed list
 * means.
 */
export function getDeploySection(): unknown {
  return loadConfig().deploy;
}

/**
 * Look up one of this project's own workflow names — `checks.your_workflow` for
 * ci, `deploy.your_workflow` for cd.
 *
 * Lives in config.yaml rather than in a repository variable because it is
 * project configuration: versioned, reviewable in a pull request, and one fewer
 * thing to remember when setting a repository up. That only works because
 * config.yaml is yours — the documented upgrade deliberately does not overwrite
 * it, unlike everything else under `.github/atomaton/`.
 */
export function getWorkflowName(kind: "ci" | "cd", fallback = ""): string {
  // `checks.your_workflow` and `deploy.your_workflow` are the other arm of those two
  // sections, not a third place that names a workflow. A project either hands Atomaton
  // its commands or hands it a workflow; there is no order of precedence to remember.
  const section = kind === "ci" ? loadConfig().checks : loadConfig().deploy;
  return (section?.your_workflow ?? "").trim() || fallback;
}

/**
 * How many agent handoffs may happen with nobody else commenting.
 *
 * Returned raw for `resolveHandoffLimit` to interpret, rather than defaulted here.
 * The domain module owns what an absent, zero or nonsense value means, and it owns
 * the default that the escalation comment quotes back to a person -- two places
 * deciding that is how the old limit's message came to name a number that was not
 * the limit.
 */
export function getHandoffLimit(): unknown {
  return loadConfig().chain?.after_handoffs;
}

/**
 * How many consecutive runs may change nothing before a person is asked.
 *
 * Raw, like the handoff limit above and for the same reason: `domain/work/progress.ts`
 * owns what an absent or nonsense value means, and owns the default the escalation
 * comment quotes back.
 */
export function getNoProgressLimit(): unknown {
  return loadConfig().chain?.after_runs_without_change;
}

/**
 * How many times one piece of work may rebuild its environment.
 *
 * Raw, for `resolveReloadLimit` to interpret. The domain module owns what absent,
 * zero and nonsense mean, and it owns the default the refusal message quotes back
 * to the agent -- two places deciding that is how the old handoff limit came to
 * name a number that was not the limit.
 */
export function getReloadLimit(): unknown {
  return loadConfig().environment?.max_reloads;
}

// `getRunsOn` and `runsOnPath` were here, reading a single `deploy.atomaton_runs.runs_on`
// (as `deploy` was spelled then)
// for one job that ran every deployment. The machine moved onto the entry -- see
// `domain/delivery/declared-jobs.ts` -- because one runner for every deployment is what made a
// release and a cloud rollout the same job, exactly as it had made a macOS test and a
// Linux lint the same check.
//
// What they were guarding against survives in `config-paths.test.ts`: the warning they
// produced named `checks.runs_on`, a key that has never existed, because the message was
// assembled where it was used and could not notice that the reader had moved.
