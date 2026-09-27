# Issue #23 — `dist/` missing in an agent's work tree

Delivered on branch `atomaton/issue-23`, cut by `commit_and_push` from the
PARENT branch `origin/atomaton/issue-18` (issue #18 is #23's parent), so the PR
targets `atomaton/issue-18` and carries only my three files.

## What I changed — option B of the two the issue offered

`package.json`:
    "pretest": "bun run synth",
    "pretest:e2e": "bun run synth",

`tests/contract/test-builds-first.test.ts` (new, 5 tests):
  1. ratchet: every `test*` script whose files name a `dist/` path in code has a
     `pre<name>` running `synth` (message names the script and an example file);
  2. that scan is looking at files that really name one;
  3. bun runs `pre<name>` before `run <name>` — measured on a throwaway package,
     because a test inside `bun run test` cannot spawn `bun run test`;
  4. `bun run pretest` / `pretest:e2e` build `dist/.github/workflows/atomaton-runner.yml`
     from nothing, in a COPY of the tree (dist/ deleted in place would race the
     other 13 suites that read it — bun test files run in parallel, verified).

`CONTRIBUTING.md` — the paragraph that said `bun run synth` has to come first.

## Measured (all in this run)

BEFORE — main's content in the tree, no hooks, new test file moved aside, `dist/` deleted:
- `bun run test`                                    → 1399 pass / 62 fail, 1461 tests / 124 files
- `env -u ATOMATON_MACHINERY_ROOT bun run test`     → 1402 pass / 59 fail, 1461 tests / 124 files
- `bun run test:e2e`                                → 0 pass / 5 skip / 3 fail
- ENOENT forms: 50 `open 'dist/.github/workflows/...'`, 1 `open
  'dist/.github/atomaton/rulesets/...'`, 8 `scandir 'dist/.github/workflows'`.
  Nothing outside `dist/`. The first line's 3 extra failures are
  `run_environment_setup.ts` (#18's subject, not here).

AFTER — with the hooks and the new test in the tree:
- `rm -rf dist && bun run test`                     → 1463 pass / 3 fail  (the #18 three)
- `rm -rf dist && env -u ATOMATON_MACHINERY_ROOT bun run test` → 1466 pass / 0 fail
- `rm -rf dist && bun run test:e2e`                 → 3 pass / 5 skip / 0 fail (either env)
- `bun run typecheck`                               → exit 0
- `bun run synth` idempotent: `git status --porcelain` shows only my 3 files

SIMULATED STACK — #18's one-line `env: hermeticEnv()` applied by hand to
`run_environment_setup.test.ts` (all three sites), then reverted:
- `rm -rf dist && bun run test`                     → 1466 pass / 0 fail
- same with `ATOMATON_MACHINERY_ROOT` unset         → 1466 pass / 0 fail
- `rm -rf dist && bun run test:e2e`                 → 3 pass / 5 skip / 0 fail

NEGATIVE CONTROLS (`/tmp/atomaton-workspace/negctl.mjs`):
- `pre` hooks deleted from package.json → 3 of 5 fail (the ratchet names the
  script, the reader count and an example file; the two behavioural tests report
  "package.json has no `pretest` script")
- `pre` hooks present but `"true"`      → 3 of 5 fail, ratchet message names the
  hook's value, behavioural message says it exited 0 without writing dist/

## Why B and not A (`environment.setup_commands`)

- B is verifiable on the branch that makes it; A's commands come from the
  DEFAULT BRANCH, so the run reviewing the PR has the old list and cannot
  reproduce the fix.
- B covers every caller, not only the three jobs here.
- Residual gap B does NOT cover, named rather than left implied: a bare
  `bun test <path>` typed by hand on a cold tree still sees ENOENT until
  something runs `bun run test`. A would have covered that. Left out to keep one
  mechanism and stay off the governed paths.
- CI still runs `synth` before `test`; the second build costs ~0.36s.
