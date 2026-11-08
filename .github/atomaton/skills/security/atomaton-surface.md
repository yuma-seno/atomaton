---
name: security/atomaton-surface
description: Load on top of `security/on-demand-audit` when auditing THIS repository — where its surfaces are, which decisions already constrain them, and which of its own findings are known.
---

# This repository's own surface

`security/on-demand-audit` is the procedure, and it ships to everyone who adopts this
template. This file does not replace it: it is what the procedure cannot know,
because it is particular to the repository that builds Atomaton.

Nothing here ships. It is the answer to "what are the areas" for this tree, so the
dispatcher does not invent them afresh each round and so an area's run does not go
looking in the wrong half.

## Where the areas are

The natural cut is not by directory — it is by what each part is trusted with:

| Area | What is in it | What makes it its own area |
| --- | --- | --- |
| `src/workflows/` | the workflow generator, and the YAML it emits | it decides `${{ }}` expansion, triggers, `permissions` and `uses:` for every workflow an adopter runs. Read with `security/gh-actions-surface` |
| `self/workflows/` | the two hand-written workflows, one holding `SELF_DEPLOY_TOKEN` | the only workflows no generator produces, and the only place a token this repository owns is written down |
| `src/entrypoints/machinery/` | the glue each generated step runs | it runs on the default branch with a write token and treats the pull request's tree as data. The whole trust story is which tree a script is executed from and which one it merely reads |
| `src/adapters/` | GitHub, actions and MCP adapters, including dispatch | the boundary between "we decided" and "GitHub did it": dispatch, the closed-target guard, the ops log |
| `src/entrypoints/tools/mcp/` | the tool servers an agent is handed | credential routing, the hook layer, and the hooks that can and cannot be a boundary |
| `src/domain/delivery/` | merge gates, governed paths, declared secrets, config validation | the merge gate is a decision surface: a bypass here is worth more than a bug anywhere else |
| `src/content/` | agents, skills, prompt template, config, skills | the instructions every run of every adopter follows. Read with `security/agent-prompt-surface` |
| `self/` | this repository's overlay onto `.github/` | applied as soon as it merges, unlike `src/` |
| `package.json` + `bun.lock` | the toolchain every run installs | supply chain, structurally — `bun audit` for the advisory half |

`src/lib/` is a kernel both halves import, and it is not an area of its own: its
weaknesses show up at the boundary that uses it, where the input and the sink are.

## Decisions that already constrain a finding

Some of what looks like a weakness is settled, with the reason written where the
code is. Read the reasoning before reporting any of these:

- **The shell guard is not a security boundary, and says so.** It is a text match
  over a command line, and its own header says an agent is not an adversary. A
  finding that it can be evaded reports what the file already states; a finding that
  something *relies* on it as a boundary is a real one.
- **Machinery always runs from the default branch**, never from a pull request's
  tree. That is the answer to the whole class of "a pull request rewrites the check
  that judges it", and it is deliberate rather than incidental.
- **A pull request may not decide its own execution environment**, which is why no
  secret reaches a check's commands and why `checks.from_pull_request` has nowhere to
  name one.
- **`.github/**` is in `merge.governed_paths`** by default: a change to how agents
  themselves run is a person's merge, and that is what holds the audit skills, the
  agent definitions and this overlay.
- **A fork's head is refused** before a run is dispatched against it. The reasoning
  lives with the code that does the refusing, and `docs/work/boundaries.md` states
  the trust model an extension would have to review.

Where the reason no longer holds, that is the finding — not the arrangement.

## The comparison, and where findings live

Findings are filed as root issues titled `security-finding: …`, which is the only
identifying contract there is. Do not depend on a label: this repository's
`chain.labels` does not declare one, and a round that filtered by a label nobody has
created would find nothing and conclude the previous round had found nothing.

If a project wants the cheaper filter, `chain.labels` in `config.yaml` is where the
name goes — and that is a person's change, since a finding is not the audit's issue to
open label policy on. Use the label when it is there and the title prefix always.

## What is this repository's, and what is the template's

A weakness in `src/` is a weakness in something every adopter receives; a weakness
in `self/` and `.github/` is this repository's own running configuration. The report
says which, because the fix and who merges it differ:

- `src/**` reaches this repository only through a release and a self-deploy, so a
  fix there is ordinary work on the deliverable;
- `self/**` and `.github/**` apply on merge, and `.github/**` is a person's merge.

The one rule that catches everybody out: a change to `self/X` belongs in the same
pull request as the identical change to `.github/X`, or the next self-deploy
overwrites it with no diff to notice it by.
