/**
 * workflow-runs.ts — find the run a dispatch started, and wait for it to finish.
 *
 * `dispatchWorkflow` says GitHub accepted a `workflow_dispatch`. That is not the
 * same as the deployment having happened: it is a receipt for the request. A
 * deployment that creates a release tag dispatches the tag's own deployment and,
 * before this module existed, returned success the moment the request was
 * accepted. The merge-side run went green while the release it was supposed to
 * produce did not exist yet, and the next step in the chain failed looking for it.
 *
 * ## Which run is the one that was just asked for
 *
 * `gh workflow run` prints the run URL when it can, but not reliably and not as
 * machine-readable output. So the run is found by asking for the newest
 * `workflow_dispatch` run of that workflow on that ref. A tag is immutable and is
 * dispatched once, so for the tag bridge there is no older run for the same ref to
 * confuse it with. The ref is also what `gh run list --branch` matches for a tag:
 * GitHub reports a tag run's `headBranch` as the tag name.
 *
 * ## Why polling rather than `gh run watch`
 *
 * `gh run watch` refuses to authenticate with a fine-grained PAT, because it wants
 * `checks: read` and no such fine-grained permission exists. The job that dispatches
 * holds an Actions token, which would work, but the helper stays a plain poll so a
 * different caller is not tied to that. It also makes the two questions separate:
 * "did the run appear" and "how did it end".
 */
import { gh, ghRead } from "./gh.ts";

/** A workflow run, as much of it as the wait needs. */
export interface WorkflowRun {
  readonly id: number;
  readonly status: string;
  readonly conclusion: string | null;
}

/** How long a wait may last, and how often it asks. */
export interface RunWaitOptions {
  /** Number of reads, one after the first. */
  readonly attempts: number;
  /** Milliseconds between reads. */
  readonly intervalMs: number;
}

/**
 * Test seam and operational bound, in the same shape as `ATOMATON_FAKE_GH`.
 *
 * The default is calibrated against a release publish: the tag deployment has a
 * sixty-minute job timeout, and the merge-side run holds its runner while it waits.
 * A test sets both to one attempt and no interval, so it exercises the answer
 * rather than the clock.
 */
export const RUN_WAIT_ATTEMPTS_VAR = "ATOMATON_RUN_WAIT_ATTEMPTS";
export const RUN_WAIT_INTERVAL_MS_VAR = "ATOMATON_RUN_WAIT_INTERVAL_MS";

const DEFAULT_ATTEMPTS = 420;
const DEFAULT_INTERVAL_MS = 10_000;

function positiveInt(raw: string | undefined, fallback: number): number {
  const value = Number((raw ?? "").trim());
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function nonNegativeInt(raw: string | undefined, fallback: number): number {
  const value = Number((raw ?? "").trim());
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

/** The wait bounds this process was configured with. */
export function runWaitOptions(env: NodeJS.ProcessEnv = process.env): RunWaitOptions {
  return {
    attempts: positiveInt(env[RUN_WAIT_ATTEMPTS_VAR], DEFAULT_ATTEMPTS),
    intervalMs: nonNegativeInt(env[RUN_WAIT_INTERVAL_MS_VAR], DEFAULT_INTERVAL_MS),
  };
}

function parseRun(raw: unknown): WorkflowRun | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.databaseId !== "number" || typeof record.status !== "string") return null;
  return {
    id: record.databaseId,
    status: record.status,
    conclusion: typeof record.conclusion === "string" ? record.conclusion : null,
  };
}

/**
 * The newest `workflow_dispatch` run of `workflow` on `ref`, or null when there is
 * none yet.
 *
 * Null rather than throwing for the same reason `readTagNames` returns null: "no run
 * yet" and "the question could not be asked" are both non-answers, and the caller
 * retries either.
 */
export function newestDispatchRun(repo: string, workflow: string, ref: string): WorkflowRun | null {
  const { code, stdout } = ghRead(
    "run",
    "list",
    "--repo",
    repo,
    "--workflow",
    workflow,
    "--branch",
    ref,
    "--event",
    "workflow_dispatch",
    "--limit",
    "1",
    "--json",
    "databaseId,status,conclusion",
  );
  if (code !== 0) return null;
  try {
    const runs = JSON.parse(stdout || "[]") as unknown;
    if (!Array.isArray(runs)) return null;
    return parseRun(runs[0]);
  } catch {
    return null;
  }
}

/** Wait for the run a dispatch started to appear. */
export function waitForDispatchRun(
  repo: string,
  workflow: string,
  ref: string,
  options: RunWaitOptions = runWaitOptions(),
): WorkflowRun | null {
  for (let attempt = 0; attempt < options.attempts; attempt += 1) {
    const run = newestDispatchRun(repo, workflow, ref);
    if (run) return run;
    if (attempt + 1 < options.attempts) Bun.sleepSync(options.intervalMs);
  }
  return null;
}

/**
 * Wait for `runId` to finish, and return how it ended.
 *
 * A run that has completed is returned even when its conclusion is not `success`;
 * deciding what a failure means belongs to the caller, and the dispatch script is
 * the one that fails its job over it.
 */
export function waitForRunCompletion(
  repo: string,
  runId: number,
  options: RunWaitOptions = runWaitOptions(),
): WorkflowRun | null {
  for (let attempt = 0; attempt < options.attempts; attempt += 1) {
    const { code, stdout } = ghRead(
      "run",
      "view",
      String(runId),
      "--repo",
      repo,
      "--json",
      "databaseId,status,conclusion",
    );
    if (code === 0) {
      try {
        const run = parseRun(JSON.parse(stdout || "{}") as unknown);
        if (run && run.status === "completed") return run;
      } catch {
        // A malformed answer is not the run having finished; ask again.
      }
    }
    if (attempt + 1 < options.attempts) Bun.sleepSync(options.intervalMs);
  }
  return null;
}
