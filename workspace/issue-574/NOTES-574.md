# Issue 574 — the release's check dispatch, ready but unpublishable

## State

The fix is written, validated and committed on the local branch
`atomaton/issue-574` as commit **e46277b**. It is NOT on the remote: the push was
refused by GitHub, not by the tool.

```
! [remote rejected] atomaton/issue-574 -> atomaton/issue-574
(refusing to allow a GitHub App to create or update workflow
`.github/workflows/release.yml` without `workflows` permission)
```

`git format-patch -1 --stdout` of that commit is `574-release-validation-bridge.patch`
beside this file, so the work is recoverable if the worktree is discarded.

## What the commit does

- `.github/workflows/release.yml`: the `release` job's "Open the pull request, and
  start its check" step now runs
  `bun src/entrypoints/machinery/dispatch_pr_validation.ts --repo ... --number "$PR"
  --branch "$BRANCH" --asked-by-person true` instead of `dispatch_ci.ts`. Header and
  step comments say why the validator and not the CI bridge.
- `src/entrypoints/machinery/dispatch_ci.ts`: header records what it does NOT do
  (register a required status check). No behaviour change.
- `tests/contract/release.test.ts`: expects `dispatch_pr_validation.ts`, refuses
  `dispatch_ci.ts`, and pins `--asked-by-person true`.
- `src/entrypoints/machinery/dispatch_pr_validation.test.ts`: new test running the
  release's exact argv (a branch, no `--ask`, `--asked-by-person true`).
- `CONTRIBUTING.md`: the release description names the validator as the bridge.

Validation: `bun run test` → 2519 pass, 0 fail; `bun run typecheck` clean;
`bun run synth` run by pretest wrote nothing tracked.

## Verified on the way (what the issue asked to confirm)

- The required context is `atomaton-check` (`.github/atomaton/rulesets/main.json`),
  and `validate_pull_request.ts:628` writes one check run per context it reads from
  the live branch rules (`src/adapters/github/branch-rules.ts:99-102`), so the name
  matches the merge job's selector by construction.
- A check derived from a `workflow_dispatch` run does not count toward a required
  status check; only the Checks-API mirror does (`validate_pull_request.ts:23-29`).
  Measured confirmation: `get_check_runs("release/v0.24.0")` lists
  `atomaton-check` success from run 44919950633 (Atomaton Check, "Manually
  triggered", total duration 2m 26s) while PR #573's rollup gave the merge job
  nothing for fifteen minutes.
- An empty ask is accepted: `dispatch_pr_validation.ts:106` normalises it to
  undefined, and only `dispatch_agent.ts:177-180` requires one, on a step gated by
  `next_agent != ''` (`atomaton-validate-pr.wac.ts:217`), which is empty because the
  release body names no `/<agent>`.
- **The write-up's bare `--asked-by-person` would have aborted the step**:
  `parseArgs` types it as a string and throws `ERR_PARSE_ARGS_INVALID_OPTION_VALUE
  Option '--asked-by-person <value>' argument missing`. The workflow therefore
  passes `--asked-by-person true`, and a test pins it.

## What is left

1. Grant the atomaton GitHub App the `workflows` permission on this repository (or
   push the patch by hand). Root issue filed for the gap.
2. Then re-run this issue's engineer run: it can `git am` the patch, push, and open
   the pull request — or open the pull request directly from the patch.
3. After that pull request merges, re-dispatch Release on main with `bump=minor`:
   main still declares 0.23.0, so it recomputes 0.24.0, finds PR #573 by head
   branch, force-pushes the branch, and dispatches the validator. The merge job then
   waits for a context that is actually written.
