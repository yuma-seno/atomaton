#!/usr/bin/env bun
/**
 * dispatch_update.ts — the `!upgrade` bridge, as a script the workflow can run.
 *
 * A control command on a thread has to start a workflow by name — a comment fires
 * no event GitHub would act on — and the one module allowed to build that call is
 * `adapters/actions/dispatch-targets.ts` (see `tests/contract/dispatch-sites.test.ts`).
 * This script is the thin shell between the workflow's step and the bridge there:
 * the arguments come from the comment that asked, the decision is the bridge's.
 *
 * The caller's own token (`GH_TOKEN`) is what GitHub refuses to chain a run from —
 * that fact is the reason this file exists — and the bridge's dispatch is made
 * with it anyway, because `workflow_dispatch` is the documented exception that
 * still runs. A dispatch GitHub refuses is a red step, not a silent skip: a person
 * typed `!upgrade` and deserves to see that nothing started.
 *
 * Usage:
 *   dispatch_update.ts --repo OWNER/REPO [--source N]
 */
import { parseArgs } from "node:util";
import { dispatchUpdate } from "../../adapters/actions/dispatch-targets.ts";
import { defineScript } from "./lib/script-ref.ts";

export interface DispatchUpdateArgs {
  /** `owner/name` of the repository to update — this one. */
  repo: string;
  /** The thread `!upgrade` came from, or nothing when started from the button. */
  source?: string;
}

export const ref = defineScript<DispatchUpdateArgs>(import.meta.url);

function main(): void {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      repo: { type: "string" },
      source: { type: "string" },
    },
  });

  const repo = (values.repo ?? process.env.GITHUB_REPOSITORY ?? "").trim();
  if (!repo) {
    console.error("usage: dispatch_update.ts --repo OWNER/REPO [--source N]  (or set GITHUB_REPOSITORY)");
    process.exit(2);
  }
  const source = Number((values.source ?? "").trim() || "0");

  const sent = dispatchUpdate(repo, Number.isInteger(source) ? source : 0);
  if (!sent) {
    console.error(
      `::error::could not dispatch the update workflow in ${repo}. Nothing was started — ` +
        "check the workflow name and the token, then run `!upgrade` again.",
    );
    process.exit(1);
  }
  console.error(`[dispatch-update] the update workflow was started${source > 0 ? ` and will answer in #${source}` : ""}`);
}

if (import.meta.main) main();
