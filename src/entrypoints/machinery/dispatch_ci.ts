#!/usr/bin/env bun
/**
 * dispatch_ci.ts — start the repository's check workflow against a branch.
 *
 * A pull request opened with `GITHUB_TOKEN` fires no `pull_request` event, so the
 * checks it requires never start on their own. This is the same hole
 * `adapters/actions/dispatch-targets.ts` states once — GitHub starts no workflow
 * run for an event its own token triggered — and the bridge there (`dispatchCi`)
 * is what closes it for an agent's pull request. This script is the thin shell
 * between a workflow's step and that bridge, the way `dispatch_update.ts` is for
 * `!upgrade`: the arguments come from the caller, the decision is the bridge's.
 *
 * Usage:
 *   dispatch_ci.ts --repo OWNER/REPO --branch BRANCH
 */
import { parseArgs } from "node:util";
import { dispatchCi } from "../../adapters/actions/dispatch-targets.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface DispatchCiArgs {
  /** `owner/name` of the repository — this one. */
  repo: string;
  /** The branch whose head the checks should run against. */
  branch: string;
}

export const ref = defineScript<DispatchCiArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      repo: { type: "string" },
      branch: { type: "string" },
    },
  });

  const repo = (values.repo ?? process.env.GITHUB_REPOSITORY ?? "").trim();
  const branch = (values.branch ?? "").trim();
  if (!repo || !branch) {
    console.error("usage: dispatch_ci.ts --repo OWNER/REPO --branch BRANCH  (or set GITHUB_REPOSITORY)");
    process.exit(2);
  }

  const sent = dispatchCi(branch);
  if (!sent) {
    console.error(
      `::error::could not dispatch the check workflow against ${branch}. Nothing was started — ` +
        "check the workflow name, then re-run this step.",
    );
    process.exit(1);
  }
  console.error(`[dispatch-ci] the check workflow was started against ${branch}`);
}

if (import.meta.main) main();
