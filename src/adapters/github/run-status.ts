/**
 * run-status.ts — has this run finished, according to GitHub?
 *
 * The claim a run writes at start names it (`atomaton:took=<ask> run=<run>`), and that id
 * is the only thing that can answer "is anybody still working here" from outside a run. A
 * thread that says an agent holds the turn is telling the truth about who TOOK it and
 * nothing about who is still there — a run killed by its context budget, a lost runner, a
 * timeout leaves the claim standing and no step inside the run can say so.
 *
 * `actions/runs/{id}` is the outside answer, and it is the same fact a run's own
 * `workflow_run` completion carries — only fetched rather than delivered. That difference
 * is the whole point: GitHub starts no workflow run for an event its own token triggered,
 * so a runner dispatched by the machinery never fires a `workflow_run` at all, which is why
 * the watch that listens for one has never seen the runs it exists for.
 *
 * Read-only, retried (a `ghRead`), and never throws: a status that could not be read is
 * reported as such, and the callers treat it as "not an answer" rather than as "not
 * running" — releasing a live run's lock is the harm, so the unreadable case must not
 * resolve to it.
 */
import { ghRead } from "./gh.ts";
import type { RunStatusRead } from "../../domain/work/stale-lock.ts";

/** GitHub's own answer for one run, as `--jq .status` prints it. */
export function readRunStatus(repo: string, runId: number): RunStatusRead {
  const read = ghRead("api", `repos/${repo}/actions/runs/${runId}`, "--jq", ".status");
  if (read.code !== 0) {
    return { read: false, why: (read.stderr || read.stdout || `gh exited ${read.code}`).trim().split("\n")[0] ?? "" };
  }
  const status = (read.stdout ?? "").trim();
  // An empty answer is not a status. GitHub's "resource not accessible" is a 403 and lands
  // above; this is the other shape of "nobody told me" — a projection that matched nothing.
  // Reading it as a live run would hold a dead lock forever, and reading it as finished
  // would release a live one, so it is neither.
  if (status === "") return { read: false, why: "the run read returned no status" };
  return { read: true, status };
}
