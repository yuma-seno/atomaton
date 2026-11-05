# The labels Atomaton applies

Four labels, and they are one thing: the machinery's record of a node's work
state. None of them is a vocabulary a person or an agent reaches for. **The
machinery is the only writer, and an agent never applies one of these labels to
an issue it creates.**

| label | who writes it | when it goes on | when it comes off | what it is for |
| --- | --- | --- | --- | --- |
| `atomaton/in-progress` | the machinery only, as the node's claim | just before a run takes this node's turn | when the turn goes back to a person, or when the node closes | "work moving right now" — and it doubles as the guard that keeps two runs off one node, so a comment telling an agent to do something does not become a second run |
| `atomaton/waiting-for-person` | the machinery only: a release, a refused dispatch, a park coming undone | the node's turn came back into a person's hands | when the next run takes the turn (the two move together), or when the node closes | "the machinery has stopped and only a person's reply moves this on" |
| `atomaton/sub-issue` | the machinery only — `create_sub_issue` adds it automatically | once, when the child is created | never; `countOpenSiblings` reads it when the parent aggregates | structural: this issue was born as a delivery task under a parent |
| `atomaton/launched` | the machinery only, on dispatch | when an agent has actually been dispatched on this child | never | distinguishes a child that was started from one that was only planned |

Rename any of them under [`chain.labels`](../reference.md#chainlabels).

## A turn label records a turn that happened

`in-progress` and `waiting-for-person` are the two halves of one state, and the
machinery moves them as a pair — a writer that remembered one half would leave a
node wearing both or neither, and neither is readable. That complement is the
invariant: at any moment an open node with a live turn carries exactly one of the
two, and a closed node carries neither, because a closed issue cannot be replied
to and a label naming whose ball it is names nobody.

What follows from the pair being a record rather than a setting is the rule:

> A turn label says a turn existed on this node. A node on which no turn has ever
> run carries neither, and an issue created in the middle of somebody else's turn
> is exactly such a node.

So an issue filed by `create_sub_issue` or `create_root_issue` is born with no
turn label at all — the only label either tool adds on its own is
`atomaton/sub-issue`, and that one is structural. Both tools refuse a `labels`
argument that names either turn label, and say why, rather than creating the
issue and leaving the machinery reading a turn that never took place.

The route for an agent that wants to hand a person the ball is not a label: it is
prose in the body, and the notify tag the body already carries. The labels are
applied when the run holding the node ends, by the machinery, to the node it was
holding.

An agent that does apply one by hand is not corrupting a filter, it is writing a
turn that never took place — and the machinery reads its own state wrong for as
long as the label survives. That is why the tools refuse it rather than relying on
this page.

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
