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
