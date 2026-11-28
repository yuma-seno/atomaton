#!/usr/bin/env bun
/**
 * plan_checks.ts — `checks` as a matrix.
 *
 * A workflow cannot read a file to decide its own jobs, so the list is published as a
 * job output and consumed with `fromJSON`. Each entry becomes one GitHub job, which is
 * what lets a job carry its own runner and its own secrets.
 *
 * ## Which configuration this reads
 *
 * The DEFAULT BRANCH's, and that is the whole design. The job that runs this checks
 * that branch out, so a pull request cannot add a check, rename one, or widen the
 * secrets one receives. The pull request's tree is where a project's own commands run
 * afterwards; it is never what decides which commands those are.
 *
 * ## An empty list is an answer
 *
 * A project with no checks publishes `[]`, GitHub skips the matrix jobs, and the job
 * that aggregates the verdicts treats `skipped` as a pass. A malformed list is NOT the
 * same thing: it fails here, because a check that could not be planned must not read as
 * a check that found nothing to do.
 *
 * Usage:
 *   plan_checks.ts
 */
import { getChecks } from "../../adapters/runner/config.ts";
import { NO_CHECKS } from "../../domain/delivery/check-jobs.ts";
import { publishMatrix } from "./lib/publish-matrix.ts";
import { defineScript } from "./lib/script-ref.ts";

export const ref = defineScript(import.meta.url);

export function main(): void {
  const { jobs, problems } = getChecks();
  if (problems.length > 0) {
    for (const problem of problems) console.error(`::error::${problem}`);
    console.error("::error::`checks` could not be read, so none of its entries ran.");
    process.exit(1);
  }

  publishMatrix(jobs, { what: "`checks` job", warnWhenEmpty: NO_CHECKS });
}

if (import.meta.main) main();
