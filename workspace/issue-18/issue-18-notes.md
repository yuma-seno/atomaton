# Issue #18 — hermetic env for spawned tests

## What was done
- `hermeticEnv()` (src/entrypoints/machinery/testing/harness.ts:58) passed as `env` at every
  `spawnSync("bun", ...)` call site that lacked it: 11 files.
- New ratchet: tests/contract/test-hermetic-env.test.ts — a text scan plus a behavioural
  test that runs run_environment_setup.test.ts with ATOMATON_MACHINERY_ROOT pointing at a
  decoy machinery tree (setup command `exit 1`).

## Measured
- Before: `bun run test` in the agent env → 1458 pass / 3 fail. After: 1463 pass / 0 fail
  (125 files), also green with a hostile env (MACHINERY_ROOT, RUN_TYPE, ISSUE_NUMBER,
  ISSUE_NOTIFY, OPS_LOG, RELOAD_COUNT, DISPATCHED_BY, AGENT, BRANCH all set).
- Negative control: reverting run_environment_setup.test.ts fails both new contract tests.
- shell_guard.test.ts was NOT in the issue's list but had the same hole and worse: it
  inherited ATOMATON_OPS_LOG, so with the run's live streak at 18 it failed
  "a path that merely contains a routed name is not the program" and wrote 3 into the
  run's own streak. Fixed; now green at streak 0 and 18, and the streak is left alone.
- write_credentials_file.test.ts read the run's ATOMATON_SECRET_NAMES slots; invisible only
  because this repository declares none.

## Not investigated to a conclusion
- tests/e2e/*: run-atoma.ts spreads `...process.env` into the real atoma binary. Not run by
  `bun run test`, skipped without a binary. Left alone: out of the issue's close condition.
- tests/contract/env coverage is file-granular (a file that calls hermeticEnv once and spawns
  raw elsewhere passes). Documented in the new test's header.
