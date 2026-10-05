# issue-17 notes (run after PR #20 merged)

## What happened

- PR #20 merged into `atomaton/issue-16`, its **base was the parent branch**, not
  `main`. So the four-file change is on `atomaton/issue-16` (`30e3ab6`) and `main`
  (`44234b1`, the v0.16.0 deploy) has none of it:
  - `grep -c -F 'Two sentences is the ceiling' src/content/prompt-template.md` on
    main → 0; raw fetch of `atomaton/issue-16/src/content/prompt-template.md` → 1.
  - same for `Five items at most.`, `with no ceiling, because it is the one that
    goes missing.`, and `The conclusion is written once.`
- **The deadlock.** #17's close condition names `main`. #16 will not deliver its
  branch while a launched child is open (`countOpenSiblings`), and #17 cannot close
  until main has the change. Neither moves.
- So this run re-applied the same four-file change onto current `main` and opened a
  PR **with base `main`** (the omission default would have resolved to
  `atomaton/issue-16` again — set it explicitly).

## State after this run

- Branch carries: `src/content/prompt-template.md`, `src/content/agent-definitions/atomaton.md`,
  `src/entrypoints/tools/mcp/atomaton.ts`, `tests/contract/agent-prompts.test.ts`.
- `.github/atomaton/config.yaml` and `self/atomaton/config.yaml` are **not** touched:
  main already has `agents:` at line 139 (the #22 drift was fixed on main by #21/#24).

## Verification run here (all on main + the four files)

- `bun run typecheck` exit 0; `bun run synth` exit 0.
- `env -u ATOMATON_MACHINERY_ROOT bun run test` → `1555 pass / 0 fail`, 4417 expect, exit 0.
- `bun run test` with `ATOMATON_MACHINERY_ROOT=/home/runner/work/_temp/atomaton-machinery`
  set → `1555 pass / 0 fail` (the #18/#23 fixes reached main, so the suite is green
  in the agent's own environment now).
- `bun run .github/atomaton-runtime/scripts/validate_deliverable.ts --root .` → internally
  consistent, exit 0.
- Negative control for the new contract test: replacing the pinned fragments with
  `XXX` → `15 pass / 1 fail` (the new test); restored → `16 pass / 0 fail`.

## Known future friction

- The test file's comment wording here differs from `atomaton/issue-16`'s copy (this
  one also pins `Two sentences is the ceiling` and records the heading-spelling
  decision). Whichever of the two lands second may conflict on that test. Not a
  blocker: #16's branch is ~40 commits behind main and needs a person either way.
- Do not "fix" the three `run_environment_setup` failures from #18 — they are already
  fixed on main.
