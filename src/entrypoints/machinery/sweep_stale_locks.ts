#!/usr/bin/env bun
/**
 * sweep_stale_locks.ts — the scheduled outside check on locks nobody released.
 *
 * See `lib/stale-sweep.ts` for what a sweep does and why it is a schedule rather than an
 * event. This file is the part that reads the run's own environment and turns the summary
 * into an exit code.
 *
 *     sweep_stale_locks.ts [--repo OWNER/REPO] [--run-id N]
 *
 * ## Why it fails only when a release did not take
 *
 * A node that could not be read, or whose run status came back unreadable, is not a failure
 * of the sweep: the next sweep is fifteen minutes away and the node is exactly as it was. A
 * release that was posted and did NOT clear the claim is different — the node now carries a
 * comment saying the turn came back beside a thread that says it did not, and nothing but a
 * person can fix it. That is the one state worth a red run.
 */
import { parseArgs } from "node:util";
import { sweepStaleLocks } from "./lib/stale-sweep.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface SweepStaleLocksArgs {
  repo?: string;
  "run-id"?: string;
}

export const ref = defineScript<SweepStaleLocksArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: { repo: { type: "string" }, "run-id": { type: "string" } },
  });

  // The repository the run is in. No placeholder fallback: a sweep that guessed would read
  // some other repository's labels and write endings onto its nodes.
  const repo = values.repo ?? process.env.GITHUB_REPOSITORY ?? "";
  if (!repo) {
    console.error("usage: sweep_stale_locks.ts [--repo OWNER/REPO] [--run-id N]  (or set GITHUB_REPOSITORY)");
    process.exit(2);
  }

  const runId = Number(values["run-id"] ?? process.env.GITHUB_RUN_ID ?? 0);
  const summary = sweepStaleLocks({
    repo,
    runId: Number.isInteger(runId) && runId > 0 ? runId : 0,
    nowMs: Date.now(),
  });

  if (summary.failed > 0) {
    // The failing nodes are named in the log above, which is where a person looks; this
    // line is what makes the run red and says why it is.
    console.error(
      `::error::stale sweep: ${summary.failed} release(s) did not take effect and were left for a person; ` +
        `see the lines above for the nodes`,
    );
    process.exitCode = 1;
  }
}

if (import.meta.main) main();
