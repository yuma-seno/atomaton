# What an agent's pull request meets

Opening one starts nothing by itself — [GitHub raises no event for its own
token](../work/how-it-works/github-raises-no-event-for-its-own-token.md) — so
`create_pr` dispatches `atomaton-validate-pr.yml` as its last act. That workflow
runs the configured CI on the branch, writes the result as a check run, and then
acts on the result. The machinery starts an agent only where a call is waiting
for one: when CI is green and the pull request carries a `/<agent>` line (or a
comment named one), that agent runs. When CI is red, or the thread's turn was
handed back to a person, nothing is dispatched, and a person is told instead,
with the agent they can ask for named in the mention. Where the turn is held by
a run in flight, or by a chain already carrying the call, the workflow posts
nothing at all: that run's own report is the thread's next word.

## When nobody is named to look at it

Asking explicitly means it can be forgotten. An agent that opens a pull request with
no `reviewer` and mentions nobody leaves work that nothing is scheduled to look at —
CI runs, the check goes green, and it waits.

So the machinery checks and says so, on the pull request:

> This pull request was opened by `engineer` with no reviewer named and nobody
> mentioned, so nothing is scheduled to look at it. CI still runs and its result
> stands. Comment `/reviewer` to have it reviewed, or take it from here.

Addressed to whoever the run resolves as the person to notify.

## When the check on the deliverable fails

Before your CI is asked to run at all, the pull request is checked for whether the
`.github/atomaton/` it would merge can still start a run —
[what a pull request is checked against](boundaries.md#what-a-pull-request-is-checked-against).

When that fails, the required check goes red, the problems are listed in a comment
on the pull request, and a person is told — with the agent that opened the pull
request named, so asking for the fix is one comment. Nothing is dispatched on
this verdict either: a run reads its machinery from
[the default branch](../pipeline/how-it-works.md) rather than from the pull
request, so an agent asked to fix the breakage is unaffected by it.

## When a person closes it without merging

A close that merged nothing used to start nothing at all: every job in the
workflow listening for a pull request's close was gated on `merged == true`
(`atomaton-pr-closed.yml`, before it carried that name), so a rejected pull
request left its branch behind, its issue open, and nobody told.

The close is now told to a person on the linked issue, and the machinery starts
nothing and closes nothing on this path. Whether the close means "rejected" or
"shipped some other way" is not readable from the event, so deciding it is the
person's, not the machine's. The mention names the agent tagged
`atomaton:origin-agent` in the pull request's body — the one whose branch is
still there to resume — so carrying on is one comment: ask that agent on the
issue, or close the issue if the close settled it.

Three closes say nothing. The linked issue is already closed — the person
closing the pull request is saying the issue is finished. A pull request with no
`atomaton:origin-agent` tag — a person's own — gets no notice: there is no agent
to name for work no run of the machinery's opened. And a pull request whose head
branch is not the repository's own — a fork — writes nothing at all, however its
body is written: the gate that used to bound starting an agent on a close still
bounds the notice that names one, because an agent only works where a
repository member asked for it.

A rejected branch is not deleted. It is where the agent resumes when the person
asks for the work to carry on, and a second pull request can be opened from it.
