# Issue #18 (+ the CI blocker found on PR #21)

Branch `atomaton/issue-18`, PR #21. HEAD `27d89c8`.

## Commit 1 (aa921cb) — the issue itself
`hermeticEnv()` passed as `env` at every `spawnSync("bun", ...)` call site that
lacked it: 11 files. Plus ratchet `tests/contract/test-hermetic-env.test.ts`.
Green: 1463 pass / 0 fail in the agent env and with all run vars forced on.

## Commit 2 (27d89c8) — the reason CI never ran on PR #21
`.github/atomaton/config.yaml` and `self/atomaton/config.yaml` were missing
`agents.on_config_finding`, which `configProblems` (src/domain/delivery/
deliverable-integrity.ts:344-352) REQUIRES. `validate_pull_request.ts` reads the
PR's own tree, so every PR here got `deliverable-invalid` and CI was never
dispatched. Reproduced locally:
`bun run .github/atomaton-runtime/scripts/validate_deliverable.ts --root . --report /tmp/r.txt`
→ exit 1, report on one line before; exit 0, empty report after.
The key was present in `src/content/config.yaml` only. Both copies edited
(byte-identical, per tests/contract/self-overlay.test.ts).
New ratchet: `tests/contract/deployed-config.test.ts` (5 tests; 3 fail on the
reverted configs).

## Verified
- `bun run test` = 1468 pass / 0 fail (126 files) in the agent env, and with
  ATOMATON_MACHINERY_ROOT/RUN_TYPE/ISSUE_NUMBER/ISSUE_NOTIFY/OPS_LOG/RELOAD_COUNT/
  DISPATCHED_BY/AGENT all forced on.
- CI order locally: scan_secrets 0, typecheck 0, synth 0, test 0.
- `validate_deliverable.ts --root .` exit 0, empty report.
- Negative controls: reverted run_environment_setup.test.ts fails both new
  hermetic-env tests; reverted configs fail 3 of 5 deployed-config tests.
- `git status --porcelain` empty; local HEAD == remote.

## Open for the next reader
- PR #21 touches `.github/**` (governed path): a person merges it.
- `merge.readiness` still listed checks-missing at the time of writing; CI was
  dispatched for 27d89c8.
- tests/e2e/run-atoma.ts:62 still spreads ...process.env; not on the `bun run test`
  path, left alone deliberately.

---

# 2026-09-27 late run (atomaton on PR #21) — a second reason the suite is red for
# the agent, which PR #21 does NOT fix

`dist/` is gitignored (`gitignore:15`) and nothing builds it in the agent's job:
`grep -c "synth\|build-dist" .github/workflows/atomaton-runner.yml` → 0, and
`.github/atomaton/config.yaml:19-21` `environment.setup_commands` is only
`bun install --frozen-lockfile` (same in the machinery checkout). CI runs
`bun run synth` as a check command before `bun run test`; the agent's shell does
not. So on a fresh work tree:

    $ rm -rf dist && bun run test          # ATOMATON_MACHINERY_ROOT set
    1409 pass / 59 fail, 3675 expect() calls, 126 files
    (identical with the variable unset — it is not environment-dependent)

All 59 are `ENOENT` under `dist/`: 51 `open` + 8 `scandir`. Measured per file:
generated-workflows 33, provider-credential-check 11, reserved-names 6,
environment-setup 5, workflow-sources 1, dispatch-sites 1, config-contract 1,
agent-environment 1. `bun run synth && bun run test` → 1468 pass / 0 fail
(synth is 0.36s). Pre-existing, not from PR #21: `git archive origin/main`
unpacked with no dist → the same three files give 19 pass / 35 fail of 54.

Filed as its own issue (not a sub-issue of #18) with the two fix directions;
**no code changed for it in this run** — it changes what `bun run test` does for
every context, and one of the directions is a governed path.

PR #21 state at the end of that run: all checks success on 27d89c8, sole
merge-readiness blocker `governance-change`. Not merged, so #18 stays open.

## Correction to issue #23's acceptance criteria (found after filing it)

#23's body says "either A or B satisfies the acceptance criteria", and that is
wrong for **A alone**: `environment.setup_commands` reaches the agent's job from
the DEFAULT BRANCH (`ATOMATON_MACHINERY_ROOT` -> machinery checkout), and `#23`'s
own PR does not change the default branch, so with A alone `rm -rf dist && bun run
test` on the branch is still 59 fail — criterion 1 is not satisfiable pre-merge.
The branch-verifiable route is B (`pretest` / `pretest:e2e` in package.json), or B
in addition to A. The sibling facts:

- `bun run synth` is 0.36s and writes only the ignored `dist/`.
- `bun run test` with a `pretest` hook: exit 0 green, exit 1 red (measured in
  /tmp/pre-hook/pkg's minimal reproduction) — the failure signal survives.
- `bun run test:e2e` gets the same treatment from `pretest:e2e`.
- CONTRIBUTING.md:241-243 explains that synth must precede test:e2e; if B lands,
  that sentence becomes stale and should be updated in the same change.
- PR #21's own verification was measured in a tree where synth had already run
  (its session: synth before the suite run), which is why it reports 0 fail while
  a fresh agent tree on the same commit is 59 fail.

## Dispatched in the same run

#23 was created as a sub-issue of #18 and dispatched to `engineer` in the same
`atomaton__launch_sub_agent` call. The launch summary carries the correction that
route B (`pretest`/`pretest:e2e`) is the required route, because #23's own body
wrongly says route A alone is equally acceptable while also requiring the close
condition to be verifiable on the PR's own branch.

---
# State of PR #21 at the end of the atomaton run (2026-09-27, second entry)

- `github__get_check_runs(ref="27d89c8")`: `atomaton-check` ×3, `pull-request-checks
  (verify)` ×2, `plan-*` ×4, `atomaton-tools` ×2 all `success`; `default-branch-checks`
  `skipped`. `github__check_merge_readiness(21)`: sole blocker `governance-change`
  (`.github/atomaton/config.yaml`, `self/atomaton/config.yaml`), `ci_dispatched: false`.
- Local HEAD == `refs/heads/atomaton/issue-18` == `27d89c8`; `git status --porcelain`
  empty. No code was changed by the atomaton run.

---

# 2026-10-04 (third atomaton entry on #18) — aggregation judgement: NOT closeable

## What forced this run
yuma-seno manually resumed the parent (#18) because the aggregation marker was
written without the parent being re-invoked (their words; fixed in v0.14.0).

## State measured this run
- `orig/main` = `66bca29` "deploy: apply v0.14.0 to .github/ (#71)" (2026-10-04).
- Branch `atomaton/issue-18` = `b861570` (aa921cb -> 27d89c8 -> b861570).
- GitHub compare `main...atomaton/issue-18`: `status: diverged`, `ahead_by: 3`,
  `behind_by: 42`, merge_base `37f1c44` (InitialCommit).
- `github__check_merge_readiness(21)`: blockers = `conflicting` ("branch conflicts
  with the base") + `governance-change`; `merge_state_status: DIRTY`;
  `required_checks: ["atomaton-check"]`, `checks: []`;
  `github__get_check_runs("b861570")` -> `[]` (no checks on the head).
  So PR #21 is unmergeable AND unverified.

## #18's fix is NOT on main (reproduced)
`git archive origin/main` into /tmp/main-v14 (no dist), then:
- `ATOMATON_MACHINERY_ROOT=... bun test ./src/entrypoints/machinery/run_environment_setup.test.ts`
  -> `0 pass / 3 fail`
- `env -u ATOMATON_MACHINERY_ROOT bun test ...` -> `3 pass / 0 fail`
main's `run_environment_setup.test.ts` has `hermeticEnv` count 0 (main's
harness.ts does have the function, used by runWithFakeGh).

## #23's fix is NOT on main either
main's `package.json` (v0.14.0) has no `pretest`/`pretest:e2e`. Fresh main tree,
no dist: `bun run test` -> 64 fail (var set) / 59 fail (unset) - all under dist/.
Branch `b861570` in this run: `bun run test` -> `1473 pass / 0 fail`
(4278 expect calls, 127 files) WITH the var set AND unset. So both close
conditions hold on the branch, neither on main.

## NEW: main is deliverable-invalid again (the #22 drift, re-materialised)
`/tmp/main-v14`: `bun run .github/atomaton-runtime/scripts/validate_deliverable.ts
--root .` -> exit 1:
    `agents.on_config_finding` is required in config.yaml. It names the agent a
    workflow starts when no issue or pull request can name one, so there is
    nothing to fall back to.
main's `.github/atomaton/config.yaml` has no `agents:` (grep "agents" -> only
line 85 `policy: auto`) and `self/atomaton/config.yaml` has none either, while
`src/content/config.yaml:135-138` has the key. The v0.14.0 self-deploy deletes
`.github/` and copies `self/` over it, so #21's second commit was wiped.
=> ANY PR against main fails validation before CI is dispatched, including the
   PR that re-lands #18. The repair must ride in the same PR (#22 is the guard,
   still open, untouched).

## NOT established
- Whether main's 3 remaining failures are exactly #18's (I ran main's file
  directly: 3 fail with the var; 1533 pass/3 fail for the whole suite with dist
  built and the var set - the 4th failure I saw was `own-pipeline.test.ts`
  reading `git ls-files -s`, an artifact of my `git archive` extraction having
  no index; `git ls-tree origin/main self/atomaton/scripts/` shows `100755`, so
  it is not a real main failure).
- Whether the engineer can get onto a base cut from current main: raw git
  mutations are blocked and there is no MCP rebase. The only route I can see is
  a content sync (see the handoff brief).

---

# DECISION (third entry): hand #18 to /engineer to re-apply onto current main

Routes closed:
- `github__sync_branch("atomaton/issue-18")` -> `{"status":"up_to_date","ahead":0,"behind":0}`.
  Useless here: the remote branch itself is `b861570`, and the divergence is against
  `main` (ahead 3 / behind 42), which sync_branch never rebases.
- Raw `git merge|rebase|checkout|switch|reset|restore|branch` are all refused by
  `/home/runner/work/_temp/atomaton-machinery/.github/atomaton-runtime/tools/hooks/
  shell_guard.ts` (`MUTATING_GIT_COMMANDS`, lines 141-168). Verified: `git switch -c`
  -> "Raw 'git switch' is disabled. Use the github__* MCP tools..."
- The runner puts an issue run on the newest *unmerged* `atomaton/issue-18*` branch
  (`resolve_issue_branch.ts` -> `resume_subtree`), i.e. the stale `b861570` tip, so the
  engineer starts there too and must not build on it.

The route the engineer should take (only one that does not need a blocked command):
`git archive origin/main | tar -x -C .` in the checkout (archive is not a mutating
git command; `tar -x` writes inside the repo), then delete the files main no longer
has, then apply the changes, then `github__commit_and_push`. That is a fast-forward
on top of `b861570` whose TREE equals main + the fixes, so PR #21's diff against
main becomes exactly the fixes and its `conflicting` blocker goes away.

Files main has that the branch does not (must be deleted after the extract):
  .github/workflows/atomaton-release.yml        self/workflows/atomaton-release.yml
  src/adapters/github/issue-index.test.ts       src/adapters/github/thread.ts
  src/domain/machinery/data-layout.ts           src/domain/work/actor.ts
  src/domain/work/comment-command.test.ts       src/domain/work/comment-command.ts
  src/domain/work/limits.ts                     src/domain/work/node-type.ts
  src/domain/work/thread.test.ts                src/domain/work/thread.ts
  src/entrypoints/machinery/lib/flags.ts

Three changes to re-apply (all are absent from main - verified):
1. #18  `hermeticEnv()` at every `spawnSync("bun", ...)` that lacks `env` on CURRENT
        main + the ratchet `tests/contract/test-hermetic-env.test.ts`. main's
        `run_environment_setup.test.ts` spawns at lines 10/22/32 with no `env`
        (`hermeticEnv` count 0); main's `harness.ts:58` already exports it.
        Files on main still spreading process.env into a bun spawn: read_run_ending,
        write_credentials_file, resolve_entry_agent, parse_pr_metadata,
        read_secret_names, decide_turn_ending, shell_guard (7).
2. #23  `pretest`/`pretest:e2e` in package.json + `tests/contract/test-builds-first.
        test.ts` + the CONTRIBUTING paragraph (main still carries "test:e2e runs
        against the built tree, so `bun run synth` has to come first").
3. MANDATORY, or the PR cannot get CI: `agents.on_config_finding: engineer` into
        `.github/atomaton/config.yaml` AND `self/atomaton/config.yaml` (byte-identical),
        mirroring `src/content/config.yaml:135-138`.
