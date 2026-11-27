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

**It is required, and it is the only required key in `config.yaml`.** Every other
run is started by something that already knows who it wants — a person types
`/<agent>`, an agent writes a handoff, a pull request carries the agent that
opened it, a parent issue carries the agent that was working on it — and those are
read from the thread at run time. This one has no thread to read: it is a workflow
reacting to a condition. A default here would be the deliverable naming an agent,
which is the hardcoding this section exists to remove, and a project that renamed
its engineer would get a run for an agent that does not exist. A missing key fails
the pull request's own check.

Nothing else belongs in this section. A name that a thread can answer is answered
from the thread.

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
  on_new_release: issue
```

What the machinery does when its daily comparison finds a newer release of the
template. Three values, and the file itself carries the one-line difference between
them.

`issue` — the default, and what an absent key means — opens the notice and stops
there. Taking the release is a person's decision, made with **`!upgrade`** or the
Actions button, and nothing in the tree changes until somebody makes it.

`pr` starts the update instead of writing the notice: no notice is opened at all, and
the pull request the update opens is the one thread. It applies the release on a
branch and merges it itself when nothing collided. A collision stops that pull
request with markers in the files, where resolving it is a person's; its body names
the files.

`pr-agent` is `pr` plus `agents.on_update_conflict` above, started on that pull
request. It resolves the markers and stops there: the run that started the update has
already ended, the checks run on the resolved tree, and the merge is a person's.

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
