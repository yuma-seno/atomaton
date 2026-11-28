# Where work branches from, and when a chain stops

## `agents.on_config_finding`

```yaml
agents:
  on_config_finding: engineer
```

The agent started on the issue opened for an `ATOMA_CONFIG_FINDING` line.

`atoma` checks the tools file it is handed before it starts any server, and a
defect it finds — a guard pattern matching none of its server's tools, two servers
claiming one tool name — is written to the run log as one machine-readable line
and the run carries on. Stopping would not close a guard that has stopped
guarding; it would only remove the agent's ability to repair the configuration.
So something has to read that line, open an issue about it, and put an agent on
that issue. This key names that agent.

**It is required.** Every other run is started by something that already knows who it
wants — a person types `/<agent>`, an agent writes a handoff, a pull request carries
the agent that opened it, a parent issue carries the agent that was working on it —
and those are read from the thread at run time. This one has no thread to read: it is
a workflow reacting to a condition. A default here would be the deliverable naming an
agent, which is the hardcoding this section exists to remove, and a project that
renamed its engineer would get a run for an agent that does not exist. A missing key
fails the pull request's own check.

`on_config_finding` and [`agents.on_agent_issue`](#agentson_agent_issue) are the two
names `config.yaml` requires outright. The third name,
[`agents.on_update_conflict`](#agentson_update_conflict), is required by a setting
rather than by the file: `update.on_new_release` at `pr-agent` makes a configuration
without it invalid, because the mode is the repository asking for a run nobody is
watching. `issue` and `pr` owe no name.

Nothing else belongs in this section. A name that a thread can answer is answered
from the thread.

## `agents.on_agent_issue`

```yaml
agents:
  on_agent_issue: atomaton
```

The agent started on a root issue an agent files while it works, or `off` to file the
issue and start nobody.

`create_root_issue` is the one tool that makes an issue with no parent: a defect in
the machinery, or a decision somebody has to make before there is any work to
decompose. The issue it makes is created with the run's own `GITHUB_TOKEN`, and
GitHub delivers no workflow run for an event its own token caused — so
`issues.opened` never fires for it, and without this key the issue sits open until a
person asks for a run on it. That is the gap this setting closes, and it is closed in
the tool rather than by a workflow watching for new issues: a workflow of that shape
waits to be scheduled, and a run that already has the credential can dispatch the
next one directly.

An earlier release deleted `atoma-auto-trigger.yml`, because work should start only when
somebody asks. This is not that workflow coming back: it starts nobody on an issue a
person filed, and it acts only where a run has just decided that something needs doing —
a report that run filed about its own finding, which nobody else is going to notice.

Every root issue an agent files is in scope. There is no separate category for "this
one is worth acting on": a defect an agent found and a decision it wanted a person to
make are both reports from a run, and which of them needs work is what the started
run finds out. Sub-issues are not in scope — a child is started by whoever decomposed
the parent, when the parent is ready for it — and neither is the one notice a newer
release leaves on the repository, which is a document with a person as its reader.

The started run begins with the reproduction. If the report no longer reproduces, or
the defect is already fixed, it comments the evidence and proposes closing, and the
decision to close stays with the person who was told. Otherwise it works the issue as
any other run does: investigate, fix, open a pull request, and let the reviewer judge
it.

`off` is the one off switch in this section. A report nobody asked to be acted on is a
project's call whether to act on; the other keys in this section name a run that
always happens.

There is no depth limit on what this starts, and none is wanted: a run that files an
issue starts a run, and if that run files another issue the machinery has made a loop
rather than a chain to be capped — which is a bug to find, not a setting to add.
[`chain.after_handoffs`](#chainafter_handoffs) and
[`chain.after_runs_without_change`](#chainafter_runs_without_change) still bound how
far any unattended chain drifts before a person is asked, and they are the only
bounds.

A second filing of a title an open issue already carries is not a second issue: the
tool puts the new report on the existing issue as a comment and starts at most the one
run that issue needs. That is what keeps one defect from becoming two runs.

## `agents.on_update_conflict`

```yaml
update:
  on_new_release: pr-agent
agents:
  on_update_conflict: engineer
```

The agent started on an update pull request that stopped on a conflict — the third
of the [ways to take a newer release](../runtime/tasks/move-to-a-newer-release.md),
and the one place where a run nobody asked for is started on work that has to be
judged.

It is required only when `update.on_new_release` is `pr-agent`, and it is the only
key in this section that is not required outright: until the mode asks for an agent,
nothing reads a name. Set it and leave the mode alone and it is still checked against
the definitions that exist, because a name that resolves to nothing is the same
failure whenever the mode is turned on. The pair is checked as a pair — a `pr-agent`
mode with no name fails the pull request's own check, and the sentence names both
keys, because either one is the edit that fixes it.

It is a different question from `on_config_finding`, and the difference is the shape
of the condition: that one is `atoma` reporting a defect in a tools file, which
happens on any repository at any time; this one is a collision between your tree and
a release, which happens only when you have asked for updates to be taken for you.
A project that never sets `pr-agent` never needs this key.

`plan.kept` does not start an agent, whatever the mode. The plan declining to touch a
path is it asking a person, and a mode decides what happens when two edits actually
collide — not who answers a question the plan refused to answer.

A conflicted path under `.github/workflows/` is a person's, not the agent's: GitHub
refuses a workflow file written with a token that holds no `workflow` scope, and the
agent's holds none. The agent is told this and started anyway, because the conflicts
are the input it resolves from — it leaves those markers where they are, resolves the
rest, and names the workflow paths in its report. A pull request whose conflicts mix
the two kinds therefore stops half-resolved: the ordinary files for the agent, the
workflow files for a person. Nothing here withholds a path from the agent before it
has read the conflict.

## `base_branch`

Where agent branches start from and where their pull requests target. Empty means
the repository's default branch, which is almost always right — a repository
developing on `main` wants exactly that.

Set it if you develop on an integration branch and release by merging that branch
elsewhere — `develop` → `main`, say. Without it every agent pull request aims at
`main`, so ordinary work lands straight in what you release from.

## `chain.after_handoffs`

```yaml
chain:
  after_handoffs: 5
```

How many agent-to-agent handoffs may happen with nobody else commenting. A person
joining the thread resets it.

Five is the default. `0` means the default rather than "no handoffs"; `1` is how
you say that an agent finishes its own turn and hands off to nobody. Five is
chosen against a repository where a person intervenes often, so
[running autonomously you will want a larger number](how-it-works/why-there-are-two-counters.md).

## `chain.after_runs_without_change`

```yaml
chain:
  after_runs_without_change: 2
```

How many consecutive runs may push no commit, open no pull request and merge
none. Two is the default: one run that changes nothing is ordinary — an agent
asked a question, or investigated and reported. `0` means the default.

It fires sooner than `after_handoffs` on repetition, and never on a long piece of
real work, because [length is not what it measures](how-it-works/why-there-are-two-counters.md).

How both counters are counted, what you see when either fires, and how to resume
are in
[what bounds a chain of runs](boundaries.md#what-bounds-a-chain-of-runs).

## `chain.labels`

```yaml
chain:
  labels:
    in_progress: atomaton/in-progress
    waiting_for_person: atomaton/waiting-for-person
    sub_issue: atomaton/sub-issue
    launched: atomaton/launched
```

Four names, and the machinery is their only writer: `in_progress` while a run
holds an issue, `waiting_for_person` once that run has handed the turn back to
a person, `sub_issue` on the issues it opened, and `launched` on the children a
parent agent started through `launch_sub_agent`. They are created on first use.
What each one means, and which of them the machinery actually reads, is in
[the labels Atomaton applies](how-it-works/the-labels-atomaton-applies.md).

They are in this section rather than somewhere presentational because that is
what the labels are for: state one run leaves for the next to read. They are not
`merge.gates[].when.labels`, which are labels a **person** applies to a pull
request. Change these only on a name collision —
[use your own label names](tasks/use-your-own-label-names.md).

This level accepts names of your own, so a misspelling here is not caught by the
check that reads your config.

## `update.on_new_release`

```yaml
update:
  on_new_release: pr-agent
agents:
  on_update_conflict: engineer
```

This is what the template ships — the mode and, because the mode asks for one, the
name. Omit both and an absent key means `issue`.

What the machinery does when its daily comparison finds a newer release of the
template. Three values, and the file itself carries the one-line difference between
them.

`issue` — what an absent key means — opens the notice and stops
there. Taking the release is a person's decision, made with **`!upgrade`** or the
Actions button, and nothing in the tree changes until somebody makes it.

`pr` starts the update instead of writing the notice: no notice is opened at all, and
the pull request the update opens is the one thread. It applies the release on a
branch and merges it itself when nothing collided. A collision stops that pull
request with markers in the files, where resolving it is a person's; its body names
the files.

`pr-agent` is `pr` plus `agents.on_update_conflict` above, started on that pull
request. It resolves the markers it can and stops there: a conflicted path under
`.github/workflows/` cannot be written with the agent's token, so it is left for a
person and named in the agent's report — see
[`agents.on_update_conflict`](#agentson_update_conflict). The run that started the
update has already ended, the checks run on the resolved tree, and the merge is a
person's.

This is the mode this template ships, the name shipped beside it as one pair.

Two things this setting does **not** do. It does not decide who may start an update:
`pr-agent` on a repository where a person typed `!upgrade` still starts the agent if
that run collides, because the mode is a policy for the collision and not a property
of the command that started the run. And it does not apply to `plan.kept`, which is
never something an agent is started for.

`pr` and `pr-agent` need the `ATOMATON_UPDATE_TOKEN` secret — the same one the update
needs to push and merge at all. Without it nothing is started, and the machinery
writes the notice after all, headed by a warning that says why. A dispatch GitHub
refuses ends the same way, with the reason left in the run log rather than in the
notice. Neither makes the daily run fail.

An unrecognised value is not a mode: it is reported by the check that reads your
config, and until it is fixed the machinery behaves as though the key were unset.

## `update.detection_scope`

```yaml
update:
  detection_scope: marked
```

Which newer releases are noticed at all. Two values, and an absent key means `all`.

`all` is every release newer than the one your tree came from. It is what an absent key
means, and what every project noticed before this key existed, so a repository that
writes nothing keeps the behaviour it had.

`marked` is only the releases whose own notes carry `atomaton:adopt`. The daily
comparison still runs, finds a newer release, and then finds no mark behind its notes:
no notice is written, no update is dispatched, and the run stays green. Silence is the
answer here and not a failure — a release nobody flagged is the ordinary case.

The mark is the release's own claim, which is the point of the setting. How far a
version number moves is a statement about compatibility and nothing about importance: a
patch can close a vulnerability, and a minor can be a feature nobody is waiting for.

The shipped template states `marked` outright, because the mark is what the setting is
for. The absent-key reading stays `all`: it is what every repository noticed before the
key existed, and changing the reading would rewrite the behaviour of a config that never
named the key. The line reaches such a repository through an update merge, and that is
the moment its scope narrows — releases whose notes carry no mark stop being noticed. A
project that wants its previous breadth sets `all` here; for the rest, marking a release
is how its notes say it should be taken promptly.

`marked` reads the release list before it does anything else, so a list that cannot be
read stops the run with an error rather than reading as "nothing is marked". Reading it
the other way would be a watch that silently stopped for as long as the API was
blipping.

A value that is not one of the two is not a scope: it is reported by the check that
reads your config, and until it is fixed the machinery behaves as though the key were
unset — that is, `all`.
