/**
 * check-jobs.ts — the one list `checks` is made of, and the two spellings it replaced.
 *
 * Every entry is a `domain/delivery/declared-jobs.ts` list entry. What an entry names
 * no longer chooses a LIST — there is one — it chooses a JOB, and the two jobs differ
 * in one thing: where the pull request is.
 *
 * An entry that names no secret runs in the pull request's tree, executing the change
 * in place, with no secret slot in the job at all. An entry that names one runs in the
 * default branch's tree and reads the pull request at `$ATOMATON_PR_TREE`, so a relative
 * path in its commands is a file a person released rather than one the change wrote.
 *
 * The rule underneath is a sentence: **the list and the commands are the default
 * branch's; a pull request's tree is data.** A pull request cannot add a check, rename
 * one, or widen the secrets one receives, because the list it could edit is not the
 * list that runs. That is what makes an entry naming `secrets` safe anywhere in it.
 *
 * `from_pull_request` and `from_default_branch` were the two arms this replaced. They
 * are still read, into this list, because the release that carries this reader reaches
 * a repository through an update that stops at a conflict for a person: until that
 * merge lands, `.github/atomaton/config.yaml` holds the old spelling and every pull
 * request's check has to stay green against it.
 */
import type { DeclaredJob, DeclaredJobsResolution, DeclaredJobsRules } from "./declared-jobs.ts";
import { resolveDeclaredJobs } from "./declared-jobs.ts";
import { CHECK_JOB_RESERVED } from "./declared-secrets.ts";

/**
 * The list of checks.
 *
 * Read from the default branch, always — the planning job checks that branch out and
 * nothing reads a pull request's copy — so an entry may name its own `secrets`, and the
 * job that takes it runs in the default branch's tree.
 */
export const CHECKS: DeclaredJobsRules = { where: "checks.jobs", secrets: CHECK_JOB_RESERVED };

/**
 * The two keys this list replaced, in the order they are read.
 *
 * Both are read under the same rules as `checks.jobs`, including the right to name a
 * credential: the reason `from_pull_request` refused one — its commands were the pull
 * request's own — is the reason the arm no longer exists.
 */
export const LEGACY_CHECK_KEYS = ["from_pull_request", "from_default_branch"] as const;

export interface ChecksResolution extends DeclaredJobsResolution {
  /**
   * The keys an old config used, as `checks.from_pull_request` and friends.
   *
   * Returned rather than printed here: this module is a pure function of a config, and
   * the reader that talks to a person is what says so — once, however many entries the
   * old spelling held.
   */
  readonly deprecated: readonly string[];
}

/**
 * Every check this configuration declares, from either spelling.
 *
 * One list out, because that is what runs: the two arms were two shapes of one answer,
 * and the workflow that consumes this has no use for the one they came from.
 */
export function resolveChecks(section: unknown): ChecksResolution {
  const container = typeof section === "object" && section !== null ? (section as Record<string, unknown>) : {};
  const problems: string[] = [];
  const jobs: DeclaredJob[] = [];
  const declaredIn = new Map<string, string>();
  const deprecated: string[] = [];

  for (const key of ["jobs", ...LEGACY_CHECK_KEYS]) {
    const raw = container[key];
    if (raw === undefined) continue;
    const rules: DeclaredJobsRules = key === "jobs" ? CHECKS : { where: `checks.${key}`, secrets: CHECK_JOB_RESERVED };
    if (key !== "jobs") deprecated.push(rules.where);

    const resolved = resolveDeclaredJobs(raw, rules);
    problems.push(...resolved.problems);
    // Across the keys as well as within one, because a name is a job name wherever it
    // sits: the config most likely to hold two of them is one halfway through the move,
    // with the entries under `jobs` and the old key not deleted yet.
    for (const job of resolved.jobs) {
      const already = declaredIn.get(job.name);
      if (already !== undefined) {
        problems.push(`\`${rules.where}\`: '${job.name}' is already declared in \`${already}\`.`);
        continue;
      }
      declaredIn.set(job.name, rules.where);
      jobs.push(job);
    }
  }

  return { jobs, problems, deprecated };
}

/**
 * Said once, by the reader, for a config still holding the old spelling.
 *
 * Names the new spelling rather than only the old one: the reader of this line is being
 * told what to write, and "the old key is deprecated" leaves them looking for the new
 * one. It also says the two spellings now behave alike, because the thing an author of
 * the old config most needs to know is that nothing about their checks changed.
 */
export function deprecatedCheckNotice(keys: readonly string[]): string {
  const named = keys.map((key) => `\`${key}\``).join(" and ");
  return (
    `${named} ${keys.length === 1 ? "is" : "are"} read into \`checks.jobs\`, the one list of checks. ` +
    "An entry from either spelling now runs the same way: the list comes from the default branch, and " +
    "each entry may name its own `secrets`. Move the entries under `checks.jobs` when convenient."
  );
}

/**
 * Whether the notice has been said in this process.
 *
 * Per process because that is the scope a person reads: one planning job, or one
 * deliverable check, says it once rather than once per entry or once per call.
 */
let saidDeprecated = false;

/** Say, once in a process, that the old spelling was read into the one list. */
export function announceDeprecatedChecks(keys: readonly string[], log: (line: string) => void = console.error): void {
  if (saidDeprecated || keys.length === 0) return;
  saidDeprecated = true;
  log(`::warning::${deprecatedCheckNotice(keys)}`);
}

/**
 * Said when the list is empty, and only then.
 *
 * A project that declares nothing to verify a change with has a required check that
 * passes every pull request without looking at it, which is the shape this repository
 * keeps finding: cover that is not. A project that named `your_workflow` has its own
 * check and this one is not dispatched for it, so it is not surprising there.
 */
export const NO_CHECKS =
  "This check verified nothing: `checks.jobs` in .github/atomaton/config.yaml is empty, " +
  "so a pull request satisfying it has not been tested. Add the commands that check this project, " +
  "or point `checks.your_workflow` at a workflow of your own.";
