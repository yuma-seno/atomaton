# Audit a repository for security weaknesses

Ask for an audit on an issue, and `atomaton` cuts it into areas, has each one audited,
and reports what was found. The audit reads your repository and verifies what it
finds. It changes nothing and opens no pull request.

```text
/atomaton
Audit the API layer: src/api/, and the boundary between it and the database.
```

**Ask with `/atomaton`, even when it is one area.** Each area is dispatched as its own
sub-issue, and that is what brings the findings back: the run that audited an area
closes it, and the close re-invokes `atomaton` to file the findings and write the
reconciled report. Naming `/auditor` yourself skips that — you get the report as that
issue's closing comment, and filing and reconciliation are then yours. That is a
reasonable way to re-run one area you already know how to handle, and the wrong way to
run a round you want recorded.

The area is yours to name. Name paths, a boundary, a concern — "the authentication
path", "how we deploy", "everything under `services/billing/`". With no area named,
the agent establishes the scope from what your repository answers and says what it
took to be in scope, so you can correct it before the next round.

## What it looks at

Six lenses, on the same code from different directions: input injection, workflow and
CI trust, authorization gates, secrets and their routing, supply chain structure, and
ordering assumptions. Each needs a location and a flow before it is anything, and a
candidate has to survive being refuted — several do not, which is the point of running
that step.

Two pages are loaded beside the procedure when the area reaches them: one for
workflows, one for agents and prompts. Nothing in any of them is language-specific.

## What you get back

Every finding carries the class, the location as `path:line`, the evidence, the
impact, a severity, a separate confidence, the correction it proposes, and the source
it rests on. Above them the report says what was in scope, what came back clean, and
what could not be settled.

The report is a decision, not a change. A fix goes to `engineer` with the finding's
location, and whether to fix it is yours.

## On a public repository

Findings are written with the class, location, evidence and impact — and without a
payload, a triggering request, or the reproduction steps that would make it one. A
live credential is named by its file and line and never quoted.

The place for the full detail is a draft security advisory, which your maintainers can
open privately and publish when they choose. Nothing here creates one for you, so the
detail stays with whoever holds it until they do.

## A second round

Findings are filed as issues titled `security-finding: …`. A later audit lists the
open and closed ones and says, for each, whether it is still present, fixed, or no
longer applies — so the second round costs a comparison rather than the whole
codebase again. A finding accepted as a risk stays open with the reason on it, and is
not re-argued.

## What this does not do

It is not a gate on a change, and it does not run on every pull request. Asked that
question every time, a whole-codebase audit is expensive and its findings repeat. The
every-change question belongs to your checks — a secret scan, a dependency audit —
which are exact and free and cannot be argued out of a finding. [Give a repository a
pipeline an agent can write and maintain](../../pipeline/tasks/give-a-repository-a-pipeline-an-agent-can-write-and-maintain.md)
is where those go.

The skills the auditor loads are `security/on-demand-audit`,
`security/gh-actions-surface` and `security/agent-prompt-surface`; [write a
skill](write-a-skill.md) is how they are shaped, and how to change what one of them
says.
