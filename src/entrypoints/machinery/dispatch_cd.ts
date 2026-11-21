#!/usr/bin/env bun
/**
 * dispatch_cd.ts — start the deploy workflow for a merge that fired no push.
 *
 * A merge performed with `GITHUB_TOKEN` fires no `push`, so `deploy.on_merge`
 * never runs on its own. The bridge for that is `dispatchCd` in
 * `adapters/actions/dispatch-targets.ts`, which is also what the machinery's own
 * merges call; this script is the thin shell between a workflow's step and the
 * bridge, the way `dispatch_update.ts` is for `!upgrade`.
 *
 * The ref is the branch the merge landed on, not the merge commit: the deploy
 * runs against the branch's tip, which is what a push would have delivered. A
 * caller that needs the exact commit passes the branch it merged into and reads
 * the run's head SHA back from GitHub.
 *
 * Usage:
 *   dispatch_cd.ts --repo OWNER/REPO --ref BRANCH
 */
import { parseArgs } from "node:util";
import { dispatchCd } from "../../adapters/actions/dispatch-targets.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface DispatchCdArgs {
  /** `owner/name` of the repository — this one. */
  repo: string;
  /** The branch the merge landed on; the deploy runs against its tip. */
  ref: string;
}

export const ref = defineScript<DispatchCdArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      repo: { type: "string" },
      ref: { type: "string" },
    },
  });

  const repo = (values.repo ?? process.env.GITHUB_REPOSITORY ?? "").trim();
  const ref = (values.ref ?? "").trim();
  if (!repo || !ref) {
    console.error("usage: dispatch_cd.ts --repo OWNER/REPO --ref BRANCH  (or set GITHUB_REPOSITORY)");
    process.exit(2);
  }

  const sent = dispatchCd(ref);
  if (!sent) {
    console.error(
      `::error::could not dispatch the deploy workflow for ${ref}. Nothing was started — ` +
        "check the deploy section of the configuration and the workflow name, then re-run this step.",
    );
    process.exit(1);
  }
  console.error(`[dispatch-cd] the deploy workflow was started for ${ref}`);
}

if (import.meta.main) main();
