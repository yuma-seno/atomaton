# Issue 222 — run notes (2026-10-18)

## State at end of run

Implementation complete, committed as `b8d6df0` on local branch
`atomaton/issue-222` (parent `01c068e` = current `main`). **Push refused by the
remote; branch does not exist on origin; no PR could be opened.** Work tree is
discarded when this run ends — the patch below is the recovery path.

## The refusal (verbatim, from `commit_and_push`)

```
 ! [remote rejected] atomaton/issue-222 -> atomaton/issue-222 (refusing to allow a GitHub App to create or update workflow `.github/workflows/atomaton-release.yml` without `workflows` permission)
```

Same shape as #156/#152, except this run's diff **does** contain the workflow
file — the change itself is to `.github/workflows/atomaton-release.yml` (+ its
`self/` overlay + CONTRIBUTING.md). This is the ordinary case the machinery has
no route for: `GITHUB_TOKEN` cannot write `.github/workflows/**` on identity,
and no agent holds `SELF_DEPLOY_TOKEN`. A person's PAT is the only credential
GitHub accepts for this push.

## Recovery (verified in this run)

1. Patch: `/tmp/atomaton-workspace/0001-release-allow-an-empty-version-input-defaulting-to-a.patch`
   (10,558 B, sha256 `be0f69f8…2bb3d5eea`, `git format-patch -1` of `b8d6df0`).
   Applying it with `patch -p1` over the three files' content at `01c068e`
   reproduces byte-identical files (checked with diff).
2. Fresh run on this issue: cut branch from current `main`, `patch -p1 < <the
   patch>`, then `commit_and_push` + `create_pr`. If `main` moved and the patch
   does not apply, re-apply the three hunks by hand — the change is small (see
   below).
3. Alternative a person may prefer: check out `main`, `git cherry-pick
   b8d6df0` … but `b8d6df0` exists only in the discarded run, so the patch in
   `/tmp/atomaton-workspace/` is the only carrier.

## What the change is (so it can be re-applied by hand if the patch is lost)

- `.github/workflows/atomaton-release.yml` AND `self/workflows/atomaton-release.yml`
  (must stay byte-identical, `tests/contract/self-overlay.test.ts`):
  - input `version`: `required: false`, `default: ''`, description names the
    empty-input behavior;
  - "Validate the version" step: `CURRENT` is read first; when `REQUESTED` is
    empty → error if `CURRENT` empty ("the first release names its version"),
    else `NEW="${CURRENT%.*}.$(( ${CURRENT##*.} + 1 ))"` + `::notice`; else
    existing `v`-strip + semver regex unchanged. Everything after the
    derivation (downgrade, already-released, tagged-not-released, write, PR)
    untouched;
  - header comment gained a "## What an empty input means" section.
- `CONTRIBUTING.md`: two short paragraphs under "Cutting a release" — empty
  `version` = next patch; prerelease increments its own last segment; first
  release names its version.

## Validation already done on this tree (all exit 0)

- `bunx js-yaml .github/workflows/atomaton-release.yml` — parses.
- bump arithmetic over `0.2.9→0.2.10`, `1.0.0→1.0.1`, `0.3.0-rc.1→0.3.0-rc.2`;
  `v`-strip + regex over `v0.2.9` OK / `1.2` REJECTED / `abc` REJECTED.
- `bun run typecheck`; `bun run test` → **1703 pass / 0 fail** (135 files),
  including `self-overlay.test.ts`.
- overlay diff `self/` vs `.github/` for the workflow — byte-identical.
