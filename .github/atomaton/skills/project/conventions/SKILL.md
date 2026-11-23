---
name: conventions
description: Load before making, reviewing, or committing any change here — conventions specific to THIS repository, which override the generic defaults.
---

# Repository conventions

This repository builds Atomaton, the delivery template. It is both the producer of
that template and an adopter of it, which creates rules that do not apply
anywhere else.

This file is not part of the template. It lives in
`.github/atomaton/skills/project/conventions/`, and it is deliberately absent from `src/` so
adopters never receive it.

## The three trees

| Tree | What it is | Who writes it |
| --- | --- | --- |
| `src/**` | Source of the deliverable | You |
| `dist/.github/**` | The deliverable adopters receive | The build |
| `.github/**` | This repository's running configuration | The update machinery, from a release; this repository's own files in it stay |

Two different activities live in this table, and which one you are doing decides
which rules apply:

- **improving the deliverable** — `src/**`. It affects every adopter, and it
  reaches this repository only after the next release is applied.
- **improving this repository's own operation** — the files directly under
  `.github/` that no release ships (`release.yml`, the release scripts, the
  customized skills). They affect nobody else, and they apply as soon as the pull
  request merges.

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
made on the pull request **Release** opens — never inside a
work pull request. A version left alone is a merge that publishes nothing, which is
the normal case. A work pull request that arrives with a version change in it is a
merge-blocking defect: flag it, and have the edit taken back out before merge.

`.github/**` is a different matter — see below. It is tracked; the files the
release ships arrive from the release through the update machinery, and this
repository's own files in it survive every update untouched.

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
`release.yml` — the release button — is the one that is not: hand-written, living
directly in `.github/workflows/`, outside the manifest the update machinery merges
against.

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

The ordinary route is **Release**, which publishes the release and then dispatches
the update machinery to take it onto this repository's own `.github/` — the same
three-way plan an adopter gets. To apply a release on its own — an older one, or
after a run with `deploy: false` — dispatch **Atomaton Update**
(`.github/workflows/atomaton-update.yml`) from the Actions tab. The machinery
opens the pull request and merges it when the plan is clean; where the tree and
the release both changed a file, it stops there for a person. `.github/**` is in
`merge.governed_paths`, so what it cannot decide is a person's to review.

The application is a three-way merge against the manifest, not a rebuild: a file
the release ships takes the new version, a file this repository edited keeps its
words, and a path the release does not ship — `release.yml`, the release scripts,
the customized skills — is never proposed for an update at all.

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
| A skill or the prompt template, as this repository runs it | the tool, on its `.github/atomaton/` path | one commit of its own; CI and a reviewer; no issue entanglement. Live from the next run, and durable: the update machinery never touches a path the release does not ship |
| The same fix, made to outlive the next deploy for every adopter | a normal pull request against `src/content/skills/` or `src/content/prompt-template.md` | the deployed copies are release output; the durable master is `src/content/` |
| `config.yaml`, `package.json`, machinery code, workflows | a normal issue-tree pull request | governed or gated, and none of it is prose |

The tool refuses `config.yaml` itself: it decides which credentials a run may
reach, and that boundary is not an agent's to move. A skill living under
`.github/atomaton/skills/` is durable by construction: the update machinery's plan
never names a path the release does not ship, so the exemption is not carved away
by the next update.

What happens when the fix lands, in three parts:

- **A merged prose edit is read by the next run.** Runs read `.github/atomaton/`
  straight off the default branch — there is nothing to build or restart — so the
  fix is live for every agent that starts after the merge. It never reaches the
  run that wrote it.
- **An update merges three-way around it, and never reverts it.** The update
  machinery's plan enumerates the release, never the tree: a path the release does
  not ship — this repository's own skills among them — is never proposed for an
  update, so a fix living directly under `.github/` survives every update. A file
  the release also ships is three-way merged, and where both sides changed, the
  update stops at its pull request rather than picking a winner.
- **The tool and the matcher behind it are code, and code ships with the
  release.** `open_base_edit_pr` lives in the generated runtime, which the next
  applied release replaces — until that has happened, a run has no such tool, and a
  prose-fix pull request meets the old matcher, which cannot read the `!`
  exemptions, and stops with a governance blocker left for a person. That window
  closes by itself when the next release is applied.

Merging here: once the new matcher is live, `merge.policy` is `auto` and the
prompt template and skills are exempt from `governed_paths`, so a prose-fix pull
request merges without a person once CI is green and review passes. Everything
else under `.github/` stays a person's merge.

