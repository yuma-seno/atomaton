/**
 * update-workflow.test.ts — the update workflow's permission set, pinned.
 *
 * `update.on_new_release: pr-agent` makes this run start the agent that resolves the
 * pull request a collision stopped it at, and `workflow_dispatch` is the exception a
 * `GITHUB_TOKEN` can still make — so `actions: write` is what makes that dispatch
 * work. Nothing fails loudly when it goes missing: the run logs a WARN and leaves the
 * pull request standing for a person, which is exactly the outcome a repository that
 * asked for `pr-agent` did not ask for. That silence is why the set is pinned here
 * rather than left to the prose in `src/workflows/atomaton-update.wac.ts`;
 * `new-release-notice.test.ts` holds the same pin for the notice's own dispatch.
 *
 * `checks: write` must stay absent, and it is the key somebody could add innocently:
 * it is what would let this job produce a check result of its own, and the checks the
 * merge waits behind would stop being the ones the update token's push started.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const WORKFLOW = "dist/.github/workflows/atomaton-update.yml";
const document = Bun.YAML.parse(readFileSync(WORKFLOW, "utf8")) as {
  permissions?: Record<string, string>;
};

describe("the update workflow", () => {
  test("it holds exactly the permissions its one dispatch needs", () => {
    expect(document.permissions).toEqual({
      contents: "read",
      issues: "write",
      "pull-requests": "write",
      checks: "read",
      actions: "write",
    });
  });
});
