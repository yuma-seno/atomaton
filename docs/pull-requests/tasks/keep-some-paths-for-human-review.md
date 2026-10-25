# Keep some paths for human review

Add the paths to `merge.governed_paths`:

```yaml
merge:
  governed_paths:
    - ".github/**"
    - "db/migrations/**"
```

An agent will not merge a pull request that touches one **into the base branch**. It
reviews it and reports, and the merge is yours. A sub-issue's pull request merges into
its parent issue's branch instead, which is not this merge: it is not stopped here, and
the change reaches you on the pull request that carries the parent's branch to the base
branch.

`.github/**` is covered by default, because that is where an agent's limits live — which
credentials reach a run, the scripts the runner executes to decide when a run may
continue, which commands the shell hook refuses, what a ruleset requires before a merge.
An agent that could merge a change to them into the base branch could widen its own
reach, and nothing later catches it, because the next run already obeys the new file.
That is the merge this gate governs. A stacked merge widens nothing yet — the agent's
configuration, definitions and tool servers are read from the default branch — and the
parent's pull request is where the change meets this gate.

For a condition that a path cannot express — a label, a title, how many files changed —
use `merge.gates`, in [the pull request reference](../reference.md#mergegates).
