/**
 * types.ts — shared type definitions, the one canonical copy used by every
 * script and MCP server in this repo.
 */

// `AutoTrigger` was re-exported from here. It and its module are gone: nothing read
// the setting at run time. See `AtomaConfig` below for what it used to mean.
// `AutoTrigger` belonged to `domain/auto-triggers.ts`, which owned the rules that
// give `condition` its meaning. It used to be declared here, in a file with no
// way to evaluate it — so the type listed three condition values while the
// matcher implemented two, and nothing connected the two lists.
//
// Re-exported so the many callers that import their config types from one place
// keep working. `domain/` is the definition; this is a doorway to it, not a
// second copy.
/**
 * `.github/atomaton/config.yaml`, as the readers in `adapters/runner/config.ts` see it.
 *
 * Grouped by who consumes the value. Every field is optional because a project
 * that declares nothing still runs -- the readers carry the defaults, in one place
 * each, so two callers cannot disagree about what an absent setting means.
 *
 * The reasons are in `docs/` rather than here, one entry per key, indexed by
 * `docs/config/reference.md`. They used to be in both, and a reason written twice
 * is a reason that will disagree with itself.
 */
/**
 * The three modes `update.on_new_release` accepts.
 *
 * One list, so the interface, the runtime schema's check and the reader cannot
 * disagree about what a mode is called. Written in the child's own words
 * deliberately: `pr-agent` is a mode, and the agent's name is not part of it --
 * naming one is `agents.on_update_conflict`'s job, the same way
 * `agents.on_config_finding` names the agent for a config finding.
 */
export const NEW_RELEASE_MODES = ["issue", "pr", "pr-agent"] as const;

/** One of [`NEW_RELEASE_MODES`]. */
export type NewReleaseMode = (typeof NEW_RELEASE_MODES)[number];

/**
 * Whether a value read out of YAML is one of the modes.
 *
 * Both ends ask this of the same list: `configProblems` reports a value that is not
 * a mode, and the reader falls back to the default rather than acting on one it does
 * not understand. A type predicate rather than a cast at each call site, because the
 * narrowing is the point.
 */
export function isNewReleaseMode(value: unknown): value is NewReleaseMode {
  return typeof value === "string" && (NEW_RELEASE_MODES as readonly string[]).includes(value);
}

/**
 * The two scopes `update.detection_scope` accepts.
 *
 * `all` is every release newer than the tree's own, which is what every adoption
 * noticed before this key existed. `marked` is only the releases whose own notes
 * carry the adoption mark.
 *
 * Not a version-bump width, deliberately. patch/minor says what the change is
 * compatible with and nothing about whether it matters: a patch can close a
 * vulnerability and a minor can be a feature nobody is waiting for. Whether a
 * release is worth interrupting every adopter for is the release's claim to make.
 */
export const NEW_RELEASE_SCOPES = ["all", "marked"] as const;

/** One of [`NEW_RELEASE_SCOPES`]. */
export type NewReleaseScope = (typeof NEW_RELEASE_SCOPES)[number];

/** Whether a value read out of YAML is one of the scopes. Same both-ends rule as [`isNewReleaseMode`]. */
export function isNewReleaseScope(value: unknown): value is NewReleaseScope {
  return typeof value === "string" && (NEW_RELEASE_SCOPES as readonly string[]).includes(value);
}

export interface AtomaConfig {
  /** Where work branches from and merges back to. Empty means the default branch. */
  base_branch?: string;

  /** What has to be installed before checks, deployments and agent runs. */
  environment?: {
    setup_commands?: string[];
    /** Bounds environment rebuilds. The refusal goes to the agent, which carries on. */
    max_reloads?: unknown;
  };

  /**
   * How a change is verified: one list of checks, or a workflow of your own.
   * Declaring both is a configuration error.
   *
   * Every check runs commands read from the DEFAULT BRANCH, against the pull request's
   * tree. So an entry may name its own `secrets` — a pull request cannot add a check,
   * rename one, or widen one, because the list it could edit is not the list that runs.
   */
  checks?: {
    /**
     * The checks, each entry its own job.
     *
     * Validated by `resolveChecks`, which owns what a malformed entry means, what a
     * duplicate name means, and which names an entry may not use because its job
     * environment already holds them.
     */
    jobs?: unknown;
    /**
     * Read into `jobs`. The arm the commands' owner used to be named for.
     *
     * @deprecated Write `checks.jobs` instead: an entry is read the same way from
     * either key, including the right to name `secrets`.
     */
    from_pull_request?: unknown;
    /** @deprecated Read into `jobs`; see `from_pull_request`. */
    from_default_branch?: unknown;
    your_workflow?: string;
  };

  /**
   * How a merged change ships: one list per event that ships it, or a workflow of
   * your own. Declaring both is a configuration error.
   *
   * Three lists rather than one with an `on:` key, because the entries are not the
   * same shape — a merge deployment is selected by branch and a tag deployment by
   * tag pattern. `resolveDeployJobs` owns their interior, including which of
   * `branches:` and `tags:` each list has; see `domain/delivery/deploy-jobs.ts` for why the
   * combination nobody should write has no spelling.
   */
  deploy?: {
    /** Deploys when a change lands on a branch. Naming none means the default branch. */
    on_merge?: unknown;
    /** Deploys when a matching tag is pushed. */
    on_tag?: unknown;
    /** Deploys only when someone dispatches the workflow. */
    on_demand?: unknown;
    your_workflow?: string;
  };

  /** When a person, not an agent, performs the merge. Any member firing is enough. */
  merge?: {
    policy?: "auto" | "manual" | string;
    governed_paths?: string[];
    /** Validated by `resolveMergeGates`, which owns what a malformed one means. */
    gates?: unknown;
  };

  /**
   * What the machinery does when it notices a newer release of the template.
   *
   * `issue` is the notice and nothing else: a person decides when to take the
   * release, with `!upgrade` or the Actions button. `pr` takes it as soon as it is
   * noticed -- the update applies the plan, opens its pull request, and merges it
   * itself when nothing collided. `pr-agent` is `pr` plus an agent on the pull
   * request when it stops on a conflict.
   *
   * A mode is a policy for the COLLISION, not a property of how the update was
   * started: `pr-agent` on a repository where a person typed `!upgrade` still starts
   * the agent if that run stops on a conflict, and `issue` starts none however the
   * run was started. `plan.kept` is not a collision -- the plan declined to decide,
   * and a person decides -- so no mode starts an agent for it.
   */
  update?: {
    /**
     * `issue` (default), `pr` or `pr-agent`. An unset key means `issue`, and any
     * other value is a configuration problem rather than a mode.
     */
    on_new_release?: NewReleaseMode;

    /**
     * Which newer releases are noticed at all: `all` (default) or `marked`.
     *
     * `marked` narrows the comparison to releases whose notes carry the adoption
     * mark, so a project that only wants the releases the template flagged as
     * important can say so. An unset key means `all`, which is what every adoption
     * noticed before this key existed.
     */
    detection_scope?: NewReleaseScope;
  };

  /** When a chain of runs stops and asks a person. */
  chain?: {
    after_handoffs?: unknown;
    after_runs_without_change?: unknown;
    /** State one run leaves for the next, not presentation. */
    labels?: {
      in_progress?: string;
      sub_issue?: string;
      launched?: string;
      [key: string]: string | undefined;
    };
  };

  /**
   * The agents a workflow starts when no issue or pull request can name one.
   *
   * ## Why this exists, and what does not belong in it
   *
   * Almost every run is started by something that already knows who it wants: a
   * person types `/<agent>`, an agent writes a handoff, a pull request carries the
   * agent that opened it, a parent issue carries the agent that was working on it.
   * Those are resolved from the thread at run time, and naming one here would be a
   * second answer to a question the thread already answers -- the kind that goes
   * stale the moment somebody renames an agent.
   *
   * What is left is the handful of runs with no thread to read: a workflow that
   * reacts to a condition rather than to a request. `on_config_finding` is one --
   * `atoma` reports a defect in the tools file it was handed as an
   * `ATOMA_CONFIG_FINDING` line and carries on, and something has to open an issue
   * about it and put an agent on that issue. `on_agent_issue` is the other: an issue
   * an agent files with `create_root_issue` carries no request, because the machinery
   * created it with the token whose own events GitHub does not deliver.
   *
   * ## Required, or required when its mode is on
   *
   * The keys a workflow always starts have no default: a default would be this file
   * naming an agent, which is the hardcoding this section exists to remove -- and a
   * project that renamed its engineer would get a run for an agent that does not
   * exist. `configProblems` reports a missing key, so the pull request that would
   * ship it fails its check instead of the run failing later.
   *
   * `on_update_conflict` is required only when `update.on_new_release` is
   * `pr-agent`: that setting is the repository asking for a run on a collision, and
   * nothing else needs a name until it is set.
   */
  agents?: {
    /** The agent to start on an issue opened for an `ATOMA_CONFIG_FINDING`. */
    on_config_finding?: string;
    /**
     * The agent to start on a root issue an agent filed with `create_root_issue`, or
     * `off` to file the issue and start nobody.
     *
     * Required, and the one key in this section whose value is not only a name: the
     * machinery filing an issue is a report nobody asked to be acted on, and a project
     * that wants to triage those itself says `off` rather than leaving the key out.
     * `configProblems` refuses an absent key, an empty value and anything that is
     * neither `off` nor a name with a definition behind it.
     */
    on_agent_issue?: string;
    /**
     * The agent to start on an update pull request that stopped on a conflict.
     *
     * Required only when `update.on_new_release` is `pr-agent` -- the mode is the
     * repository saying a run should take the collision, and this names which one.
     * `configProblems` reports the pair when the mode is set and this is not.
     *
     * No default, for the reason above: a default would be this file naming an
     * agent, and only the project knows what its engineer is called.
     */
    on_update_conflict?: string;
  };

  /**
   * What an agent can reach beyond what Atomaton ships, and under what extra watch.
   *
   * Additive. The eight servers a run starts with and the hooks that watch all of
   * them are in `domain/machinery/shipped-servers.ts`, not here: deleting one breaks a run, and
   * the file this interface describes is the one an adopter is told is theirs. See
   * that module for the line -- hide what breaks when edited wrong, show what
   * degrades.
   *
   * `servers` is passed through to the core's own tools-file format verbatim, so a
   * key the core gains works here the day it ships. A name Atomaton ships is overridden
   * field by field; a name it does not is added. `settings` is the one key this
   * project reserves inside a server entry: the generator strips it, and the server
   * reads it back through `adapters/runner/config.ts`.
   */
  tools?: {
    secrets?: string[];
    /**
     * Hooks appended to the machinery's, per hook key.
     *
     * A string or a list of them. Both reach the core, which has accepted both since
     * v0.1.33 -- its `Hooks` always held a list and only the tools file's shape was
     * singular, which left a delivery shipping a required hook with no way to let a
     * project add one beside it.
     */
    watch?: Record<string, string | string[]>;
    // Not enumerated, and `settings` is not either: the runtime schema passes every
    // key inside a server entry through, so naming them here would make the two
    // disagree about what a known key is -- which a contract test catches, and which
    // would otherwise surface as an adopter's valid config being refused.
    servers?: Record<string, Record<string, unknown>>;
    /**
     * Packages a server of YOUR OWN needs, installed before a run.
     *
     * The shipped servers name theirs in the deliverable, beside their own
     * declarations, because they are not a project's decision. This is the other
     * half: a server you added under `servers` that is started by a binary, or that
     * imports something the bundle cannot carry.
     *
     * Both lists are installed as one set, and both are hashed into the cache key.
     */
    packages?: { npm?: string[]; bun?: string[]; pip?: string[] };
  };
}

