# #16 delivery run — notes for the next run on this node

## Where the work was

- `atomaton/issue-16` at `30e3ab6` = "Bound the report contract's parts and write the
  conclusion once (#20)". Its parent is `37f1c44` (InitialCommit, v0.1.0), which is
  **not an ancestor of `main`**. GitHub compare: `status: diverged, ahead_by: 1,
  behind_by: 61`, `merge_base_commit: 37f1c44`.
- So the old branch head had **none** of #17's change relative to `main`: the four
  files differed from `main` by 60 other files' worth of stale release (v0.15.0 vs
  v0.19.0) and by the change itself.
- Merging `30e3ab6` into `main` (base `37f1c44`) is not possible: `git merge-tree`
  reports conflicts on ~45 distinct paths, including all four intended files.

## What this run did

Rebuilt the branch's tree in place to **current `main` + the four #17 files**, then
committed it on top of `30e3ab6`. `commit_and_push` runs `git add -A` and commits to
the checked-out branch, so the commit's tree is what the worktree holds.

The worktree was made by `git archive origin/main | tar -x -C .` followed by
`patch -p1 < /tmp/atomaton-workspace/issue-17-on-main.patch`, and the index was then
rebuilt with `git read-tree origin/main` + `git update-index --add --cacheinfo` for
the four files. Both give tree `06e13adcd592343e94d5dad7e1a75f482295cdc6`.

Verified before committing:

- `git diff --cached --name-status origin/main` → exactly the four files.
- `git diff --cached --shortstat origin/main` → `4 files changed, 127 insertions(+), 9 deletions(-)`.
- `git diff --name-only` (index vs worktree) → empty.
- `git merge-tree --write-tree --merge-base=37f1c44 origin/main <tree>` → exit 0,
  zero conflicts, and the result tree is **byte-identical to** `06e13adc…` for every
  path. So merging this commit into `main` lands exactly `main` + the four changes,
  and nothing else.
- `bun run typecheck` exit 0; `bun run synth` exit 0;
  `bun run .github/atomaton-runtime/scripts/validate_deliverable.ts --root .` →
  `The deliverable in . is internally consistent.` exit 0.
- `bun run test` with the runner's `ATOMATON_MACHINERY_ROOT` set → `1563 pass / 0 fail`,
  4433 expect() calls, exit 0.
- Negative control for the new contract test: `sed` each pinned fragment to `XXX`/`YYY`
  → `16 pass / 1 fail`; restored → `17 pass / 0 fail`.

## The one thing to know about the pull request

`create_pr` will show GitHub's **three-dot** diff (`merge-base 37f1c44 … head`), which
is ~156 files even though the merge changes four. If a reviewer reads the file list,
say plainly that the merge result is four files and that the display is the stale
merge base, not the change. `github__check_merge_readiness` may report
`governance-change` because the displayed list contains `.github/**`; the merge does
not actually touch it.

## Things already fixed on main, do not re-fix

- #18 / #23 (`hermeticEnv`, `pretest`) are on `main`; `bun run test` is green in the
  agent's own environment now. The old branch was red only because it was stale.
- `agents.on_config_finding` is on `main` (`.github/atomaton/config.yaml:139`,
  `self/atomaton/config.yaml:139`) — the #22 drift was repaired by #21/#24. PR #20's
  extra config hunk is therefore not part of this change.

## Recovery copy

`/tmp/recover-30e3ab6/` is `git archive 30e3ab6` (the branch tree before the rebuild),
if anything about the rebuild needs undoing. The commit itself stays in history as
the parent of the new one.
