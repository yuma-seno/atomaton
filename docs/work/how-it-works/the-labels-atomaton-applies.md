# The labels Atomaton applies

Three labels, and only the first is about the guard that keeps two runs off one
issue.

| label | what it means |
| --- | --- |
| `atomaton/in-progress` | work is in flight under this issue or pull request: a run is executing on it, or its agent parked the turn on agents working under it. Applied before the agent starts, removed only when the turn comes back to a person or the node closes |
| `atomaton/waiting-for-person` | the turn came back to a person and the machinery is waiting for them — the complement of `in-progress`, applied and removed at the same moments. Both labels come off when the node closes: the turn is over, and a label naming whose ball it is names nobody. A close event strips them whoever closed it, and a run that ends after closing its own node strips them at its end, so neither label survives on closed work |
| `atomaton/sub-issue` | this issue is a child delivery task Atomaton created. Which issue it is under is GitHub's own sub-issue link, not a marker in the body |
| `atomaton/launched` | an agent has actually been dispatched on this sub-issue. A child that exists but has not been started yet does not carry it |

Rename any of them under [`chain.labels`](../reference.md#chainlabels).

## How a parent learns its children are done

The last two labels are read together, and that is why there are two. A parent is
re-invoked once no open sibling carries **both**: a sub-issue created as a later
phase of a plan and never launched must not hold the parent back, or the count
could never reach zero.

Two paths reach that count. The merged pull request is the primary one — a child's
delivery landing is what makes the question worth asking — and a person closing the
sub-issue by hand is the fallback, which skips itself when the closure already came
from a merge. Both write a marker tag on the parent before dispatching, so two
paths racing on the same child cannot start the atomaton twice.

If the parent has been closed meanwhile, nothing starts, and the notice says so
rather than retrying —
[commands and dispatches on something already closed](../when-it-breaks.md#commands-and-dispatches-on-something-already-closed).
