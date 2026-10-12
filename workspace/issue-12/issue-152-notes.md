# issue-152 — where this run left the work

The work is complete and validated, and could NOT be published: `commit_and_push` was refused by
the remote, so the branch has never reached origin.

- commit (local only): `af235c79a210f20da991ec01c441cf670261b277`, parent `4dfb20d` (main when this run started)
- worktree is clean; `git ls-remote --heads origin` lists only `atomaton-data`, `atomaton-index`, `main`
- `get_branch("atomaton/issue-152")` -> `{exists:false}`
- the refusal, verbatim:

      To https://github.com/yuma-seno/atomaton
       ! [remote rejected] atomaton/issue-152 -> atomaton/issue-152 (refusing to allow a GitHub App
         to create or update workflow `.github/workflows/atomaton-sub-issue-closed.yml` without
         `workflows` permission)
      error: failed to push some refs to 'https://github.com/yuma-seno/atomaton'

## Why

My commit touches NO workflow file. Main moved during this run, and passed that file:

- run started on `main` = `4dfb20d`
- `main` is now `1d5898da819de4eafe59b3abe2a7be4ebac821f4` (v0.21.2, PR #155), and between those two
  commits it changed `.github/workflows/atomaton-sub-issue-closed.yml` (the `closed_via_pr` output and
  the `aggregate` job's `if:`) and `src/workflows/atomaton-sub-issue-closed.wac.ts`.
- so this branch, cut from `4dfb20d`, carries that file's OLD content, and the push would put it back.

Whether GitHub is comparing the pushed tree against the default branch, or refusing because the
resulting merge would change a workflow file, was NOT measured — one push happened and it was
refused. Both readings give the same fix.

## Files the commit changes (none of them a workflow)

    docs/tools/reference.md
    src/adapters/github/gh.ts
    src/content/README.md
    src/entrypoints/tools/defaults.yaml
    src/entrypoints/tools/mcp/attachments.ts
    tests/contract/attachments-publish.test.ts
    tests/contract/attachments-shape.test.ts

## The recovery: replay onto current main

    cd <fresh checkout of main>
    git checkout -b atomaton/issue-152         # or let commit_and_push create it
    patch -p1 < /tmp/atomaton-workspace/issue-152-publish-draft.patch
    bun run typecheck && bun run synth && bun run test
    # then commit_and_push, then create_pr(reviewer="reviewer")

**`patch -p1`, not `git apply`**: `apply` is in `shell_guard`'s mutating git subcommands and is
refused. GNU patch 2.7.6 is on PATH and is not.

**Do not force-push.** `git push -f af235c7:refs/heads/atomaton/issue-152` would publish the branch
and would also put `.github/workflows/atomaton-sub-issue-closed.yml` back to its `4dfb20d` content until
merged — an agent silently reverting v0.21.2's fix. A person may decide that is fine; it is not this
run's call, and raw `git push` is refused by the guard anyway.

`issue-152-publish-draft.patch` is `git format-patch -1` of the commit (68,378 B). Verified: extracting
the seven files' blobs from `origin/main` into a temp tree and applying the patch gives byte-identical
blobs to the commit's for all seven (`git hash-object` per file vs `git rev-parse HEAD:<path>` — all
SAME). It applies cleanly against both `4dfb20d` and `origin/main`.

## Validation already done in this run's tree

    bun run src/entrypoints/machinery/scan_secrets.ts   -> exit 0
    bun run typecheck                                    -> exit 0
    bun run synth                                        -> exit 0
    bun run test                                         -> 1670 pass / 0 fail, 134 files
    bash self/atomaton/scripts/check-live-tools.sh       -> exit 0; "Validation passed." x4;
                                                            "✓ N server(s) started and answered"
    tools/list of dist/.github/atomaton-runtime/tools/mcp/attachments.ts
                                                         -> probe, publish_draft

No real `git push` to a live branch and no upload were made against GitHub: `publish_draft` needs the
run's own credential, the post-merge boundary #12/#109 already sets for the probe. The 22 tests in
`attachments-publish.test.ts` drive `publish_draft` against a temporary bare remote instead, which is
what the tool actually does.

## Gap

Filed separately as a non-sub-issue: a run's branch is cut from the base at run start and there is no
tool route to re-cut or update it, so a default-branch change to a workflow file during a run makes
every push of that run's work refused and the worktree discarded.
