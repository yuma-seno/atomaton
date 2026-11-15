---
name: project/conventions
description: Load before making, reviewing, or committing any change here — conventions specific to THIS repository, which override the generic defaults.
---

# Repository conventions

This repository builds Atomaton, the delivery template. It is both the producer of
that template and an adopter of it, which creates rules that do not apply
anywhere else.

This file is not part of the template. Its source is `self/atomaton/skills/project/`,
and it is deliberately absent from `src/` so adopters never receive it.

## The four trees

| Tree | What it is | Who writes it |
| --- | --- | --- |
| `src/**` | Source of the deliverable | You |
| `dist/.github/**` | The deliverable adopters receive | The build |
| `self/**` | This repository's own files, the ones that are not the template's | You |
| `.github/**` | This repository's running configuration | The self-deploy job, from a release plus `self/` |

Two different activities live in this table, and which one you are doing decides
which rules apply:

- **improving the deliverable** — `src/**`. It affects every adopter, and it
  reaches this repository only after a release and a self-deploy.
- **improving this repository's own operation** — `self/**`. It affects nobody
  else, and it applies as soon as it merges.

The rest of this file does not separate them cleanly. That is a known gap, tracked
in the documentation restructure; until then, read each rule and ask which of the two it is about.

`src/content/**` is mirrored verbatim into `dist/.github/atomaton/` and from there
into an adopter's repository. **It may only contain content that holds for any
project using Atomaton.** No reference to this repository's build pipeline, no
mention of `dist/`, `bun run synth`, or `build-dist.ts`, and no incident history
or PR numbers. If a rule is about developing *this* repository, it belongs in
this file instead.

## Generated output is not tracked

Change `src/**` only. `dist/**` is gitignored, so there is nothing generated to
commit and nothing to keep in sync.

Run `bun run synth` freely to inspect what adopters would receive. It writes only
into the ignored `dist/`, so it cannot dirty your commit.

Adopters receive the deliverable from a release, not from a merge, so nothing you
merge needs to carry it.

**Never touch `version` in `package.json`.** The version is the release declaration:
merging an edit to it publishes to adopters, and that decision belongs to a person,
made on the pull request **Release Pipeline** opens — never inside a
work pull request. A version left alone is a merge that publishes nothing, which is
the normal case. A work pull request that arrives with a version change in it is a
merge-blocking defect: flag it, and have the edit taken back out before merge.

`.github/**` is a different matter — see below. It is tracked, and every file in it
comes from either the release or `self/`.

## main is protected; everything lands by pull request

`.github/atomaton/rulesets/main.json` is the source of truth for what may reach main:
direct pushes are refused, and a pull request cannot merge until the `check` job
passes. It is applied by hand from an account with admin, and taken as correctly
configured thereafter — nothing verifies it, because a check could only report and
never enforce: with no ruleset, `check` would not be a required context either.

Changing the rule is a pull request against the JSON, followed by one `gh api`
call from an account with admin (see CONTRIBUTING.md). CI cannot make that call —
`administration` is not a permission a workflow can hold.

`check_merge_readiness` reports against whatever the ruleset currently
requires, so it follows the file rather than holding a second opinion.

Nothing bypasses it. No workflow writes to main — the release job attaches the deliverable
to a release instead — and your merge satisfies the rules like anyone else's. Do
not propose a bypass actor: it would mean naming a GitHub App ID or a deploy key,
values that exist only after manual setup, so the JSON would stop describing the
whole configuration.

The workflows that run agents are generated from `src/workflows/` and shipped.
`self/workflows/` holds the three that are not: `release.yml`, `self-deploy.yml`,
and `release-pipeline.yml`.

## Adding a static file to the deliverable

A new non-code file under `src/content/` must also be added to `build-dist.ts`'s
verbatim-copy list, or it never reaches `dist/` at all.
`tests/contract/deployment-contract.test.ts` enforces this.

## `atoma validate` is on the CLI

The `atoma` binary is on the agent's PATH — the runner installs it at
`/usr/local/bin/atoma` — and it has a `validate` subcommand that checks an agent
definition against a tools file without starting a run:

```bash
atoma validate --agent-def .github/atomaton/agent-definitions/engineer.md \
               --tools-file /tmp/tools.yaml
```

It resolves every name in the definition's `mcp_servers` against the tools file,
checks the template's placeholders, and reports what it finds. `atomaton-validate-pr`
runs it on every pull request that touches an agent definition, so a definition
that names a server `tools.yaml` does not define is a red check rather than a run
that aborts before a single tool starts.

There is no MCP tool for it, and that is deliberate: it is a check a person or a
workflow runs, not something an agent needs mid-run. Use it from the shell when
you are changing a definition and want the same answer CI will give.

## `.github/` is an adoption, not a mirror

Nothing regenerates `.github/` automatically. It is this repository's deliberate
adoption of the deliverable, so it lags `src/` until someone applies a release.

**That lag is the point.** A change to `src/` must not reconfigure the live agents
the moment it merges. Two breakages reached the running system exactly that way.

### Applying a release

The ordinary route is **Release Pipeline**, which publishes the release and then
opens and merges the deploy pull request. To apply a release on its own, dispatch
**Self Deploy** (`self/workflows/self-deploy.yml`) from the Actions tab. It opens a
pull request and merges nothing. `.github/**` is in `merge.governed_paths`, so a
person reviews it.

What it does:

```bash
rm -rf .github            # so a file the release DELETED is gone, not orphaned
unzip release.zip         # the deliverable
cp -r self/. .github/     # this repository's own, at the same paths
```

`.github/` is therefore exactly those two sources, with nothing kept alive by
remembering to. Before `self/` existed this was a `cp -r` followed by
`git checkout -- .github/atomaton/config.yaml`, and a file the template had removed
stayed in the tree with no diff to notice it by.

It needs `SELF_DEPLOY_TOKEN`, a PAT with the `workflow` scope, because
`GITHUB_TOKEN` cannot write `.github/workflows/**` — refused on identity, not by
path. No agent can reach that token: it is named in one file outside the
deliverable, and `atomaton-runner.yml` does not mention it.

### Changing something in `self/`

An overlay entry is a copy, not a build, so it needs no release. Change
`self/X` and `.github/X` **in the same pull request**, identically.

`tests/contract/self-overlay.test.ts` requires them byte-identical, in both
directions. Editing `.github/X` alone is worse than not editing it at all: the next
self-deploy overwrites it from `self/` and the change disappears without a diff.

A file added to `.github/` that is in no release and not in `self/` is not checked
for, because the next deploy removes it anyway. `.github/**` is in
`merge.governed_paths` and stays a person's merge — except for the prose carve-out
below, which is the one deliberate exception.

## Fixing the machinery prose from inside a run

You are not merely allowed to fix the prose you find wrong mid-run — you are asked
to. A prompt that misleads, a skill that is out of date, a definition that names
something stale: each one reaches every future run, so a fix beats a report. The
route is the `open_base_edit_pr` tool on the github server. It builds one commit
from git objects on the base branch's current tree, pushes it to
`atomaton/amend-<id>`, and opens a pull request against the base branch — so the
fix is reviewed on its own instead of riding the issue's pull request and vanishing
with it. Your checkout, HEAD, index and session are untouched, the run does not end
for it, and the replacement has to match what the base holds now exactly once: if
the base has moved, nothing is pushed rather than a stale overwrite.

What to point it at:

| What you found | Where the fix goes | Why |
| --- | --- | --- |
| A skill or the prompt template, as this repository runs it | the tool, on its `.github/atomaton/` path | one commit of its own; CI and a reviewer; no issue entanglement. Live from the next run. Durable only where a `self/` twin carries it — the prompt template and the shipped skills have none, and their durable fix is `src/content/` |
| The same fix, made to outlive the next deploy for every adopter | a normal pull request against `src/content/skills/` or `src/content/prompt-template.md` | the deployed copies are release output; the durable master is `src/content/` |
| `config.yaml`, `package.json`, machinery code, workflows | a normal issue-tree pull request | governed or gated, and none of it is prose |

The tool refuses `config.yaml` itself: it decides which credentials a run may
reach, and that boundary is not an agent's to move. A `self/` twin on the base
branch is staged into the same commit automatically — which is what makes the two
skills in `self/atomaton/skills/` durable under the exemption.

What happens when the fix lands, in three parts:

- **A merged prose edit is read by the next run.** Runs read `.github/atomaton/`
  straight off the default branch — there is nothing to build or restart — so the
  fix is live for every agent that starts after the merge. It never reaches the
  run that wrote it.
- **The next self-deploy is what can take it back, not what applies it.** It
  rebuilds `.github/` from the release and `self/`, so an edit whose durable copy
  — the `self/` twin, or `src/content/` — does not hold the same text is wiped
  then. The two `self/atomaton/skills/` skills survive every deploy; the prompt
  template and the shipped skills do not.
- **The tool and the matcher behind it are code, and code ships with the
  release.** `open_base_edit_pr` lives in the generated runtime, which a
  self-deploy replaces — until that has happened, a run has no such tool, and a
  prose-fix pull request meets the old matcher, which cannot read the `!`
  exemptions, and stops with a governance blocker left for a person. That window
  closes by itself on the next release and self-deploy.

Merging here: once the new matcher is live, `merge.policy` is `auto` and the
prompt template and skills are exempt from `governed_paths`, so a prose-fix pull
request merges without a person once CI is green and review passes. Everything
else under `.github/` stays a person's merge.

