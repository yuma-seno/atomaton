# Issue #23 — verified against the merged tree, 2026-09-27 (second run)

## Where the work landed

* `atomaton/issue-23` no longer exists as a branch (`github__get_branch` → `{exists:false}`).
  PR #24 merged into its BASE, `atomaton/issue-18`, at
  `b861570043c408385c717d3b5e401f8a40b7731a` (parent `27d89c8`, the head of PR #21).
* So `atomaton/issue-18` @ `b8615700` now carries BOTH PR #21 (#18's fix) and PR #24
  (#23's fix). PR #21 is still OPEN and now shows both changes in its diff, because
  #24 merged into its branch.
* `main` is unchanged: the local checkout is `37f1c44 InitialCommit` = `origin/main`,
  and none of PR #21 / #24 has reached it.

## How I measured the merged tree (reproducible)

The checkout only has `main`'s content, so I reconstructed `b8615700` at `/tmp/merged-tree`:

    bun run /tmp/atomaton-workspace/reconstruct-merged.mjs

It copies the working tree (minus node_modules/.git/dist), then overwrites the 19
files the two PRs touched with the bytes fetched from
`raw.githubusercontent.com/.../b8615700/<path>`, and prints the git blob SHA-1 of
each. Four of them were cross-checked against GitHub's tree API `sha` field and
match exactly: `.github/atomaton/config.yaml` `043da19…`, `CONTRIBUTING.md`
`9127a69…`, `package.json` `f8a4725…`, `tests/contract/test-builds-first.test.ts`
`e8834e2…`.

`/tmp/merged-tree/.git` was copied from the checkout, because
`tests/contract/own-pipeline.test.ts` reads `git ls-files -s` to check a mode —
without a git dir that ONE test fails for a reason that has nothing to do with #23
(measured: `1472 pass / 1 fail`, the fail being `tag-release.sh is executed as a
command but is not executable in git`). With `.git`, 0 fail.

## Acceptance criteria at `b8615700` (MACHINERY_ROOT=/home/runner/work/_temp/atomaton-machinery, set)

| criterion | command | result |
| --- | --- | --- |
| 1 (var set) | `rm -rf dist && bun run test` | `1473 pass / 0 fail`, `4278 expect() calls`, `Ran 1473 tests across 127 files` |
| 1 (var unset) | `rm -rf dist && env -u ATOMATON_MACHINERY_ROOT bun run test` | `1473 pass / 0 fail` |
| 2 (var set) | `rm -rf dist && bun run test:e2e` | `3 pass / 5 skip / 0 fail` |
| 2 (var unset) | same with `env -u ATOMATON_MACHINERY_ROOT` | `3 pass / 5 skip / 0 fail` |
| 3 | `tests/contract/test-builds-first.test.ts` present, 5 tests | 5 pass; negative control below |
| 4 | `bun run typecheck` | exit 0 |
| 4 | commit `b8615700`'s own file list | `CONTRIBUTING.md`, `package.json`, `tests/contract/test-builds-first.test.ts`; 311 additions / 3 deletions; no `dist/**` |

Negative control on the merged tree (`/tmp/merged-negative`, `/tmp/atomaton-workspace/negctl-merged.mjs`):
`pretest` + `pretest:e2e` deleted → `2 pass / 3 fail` of the 5.
(Same control on the unmerged branch gave the same 3 failures.)

## Loose ends

* `bun run test` in the REPO checkout is not a valid measurement of the issue until
  PR #21 merges to `main`: `main` has #18's three `run_environment_setup` failures,
  and #23's branch is gone. The merged tree above is the measurement.
* `tools`-related scratch dirs `/tmp/merged-tree`, `/tmp/merged-negative` do not
  survive; the scripts in this dir do.
