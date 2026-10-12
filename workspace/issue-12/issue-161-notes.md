# Issue #161 — notes for the next run

## What shipped
- `docs/tools/boundaries.md:56-59`: the list in "Protected" now reads
  `files`, `github`, `web`, `search`, `atomaton`, `attachments`, `delegate`.
  (`atoma` → `atomaton`; `attachments` added; `files` added.)
- `tests/contract/hardened-servers.test.ts` (new): holds that list to
  `src/entrypoints/tools/defaults.yaml` + whether the program an entry starts
  calls `hardenCredentialHolder(`.

## The premise in the issue is short by one server
The issue's "実物" list has six: github, web, search, delegate, atomaton, attachments.
Its own command (`grep -n 'hardenCredentialHolder(' src/entrypoints/tools/mcp/*.ts`)
also returns `files.ts:48`. Measured again on this checkout:

    atomaton.ts:48 attachments.ts:70 delegate.ts:75 files.ts:48
    github.ts:59 search.ts:134 web.ts:86      (shell.ts: none)

Seven programs, not six. So the list has seven names, and the issue's literal
close condition ("6 servers: github/web/search/atomaton/attachments/delegate")
is a miscount. `files` has called it since the InitialCommit
(37f1c44006d1c8fecb0b8b1b36d40b6ce22755c6) — it was never in any version of the list.

## Three pairs are one program
`files`/`files_readonly`, `atomaton`/`atomaton_env`, `delegate`/`delegate_readonly`
are the same script started twice. The list names one entry of each pair; the test
accepts either entry of a pair and refuses a name whose program does not harden.

## Environment note (not a blocker)
There is no `gh`/`git fetch` in the shell and the checkout is shallow
(`git log | wc -l` = 1, `git rev-parse --is-shallow-repository` = true), so
"when did this line last change" had to be answered from the GitHub API, which is
fine. `git branch -a` is refused by the shell guard (correctly).
