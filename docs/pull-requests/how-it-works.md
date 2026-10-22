# What an agent's pull request meets

Opening one starts nothing by itself — [GitHub raises no event for its own
token](../work/how-it-works/github-raises-no-event-for-its-own-token.md) — so
`create_pr` dispatches `atomaton-validate-pr.yml` as its last act. That workflow
runs the configured CI on the branch, writes the result as a check run, and then
dispatches whoever the result calls for: the reviewer **named in the call** when it
is green, the engineer when it is not.

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
on the pull request, and the engineer is dispatched to fix them — the same handling
as failing CI, including the retry limit. The agent sent to fix it is unaffected by
the breakage, because a run reads its machinery from
[the default branch](../pipeline/how-it-works.md) rather than from the pull request.

## When a person closes it without merging

A close that merged nothing used to start nothing at all: every job in the
workflow listening for a pull request's close was gated on `merged == true`
(`atomaton-pr-closed.yml`, before it carried that name), so a rejected pull
request left its branch behind, its issue open, and nobody told.

The close is now returned to the agent tagged `atomaton:origin-agent` in the
pull request's body — as a judgement for that agent to make, not a verdict the
machine has reached. A close is a person's decision, but whether it means
"rejected" or "shipped some other way" is not readable from the event, so the
machine closes nothing: the agent decides whether what the issue asked for is
settled, concludes the issue when the close settled it, and carries on from
where the pull request left off when the work is still needed.

Three closes return nothing. The linked issue is already closed — the person
closing the pull request is saying the issue is finished. A pull request with no
`atomaton:origin-agent` tag — a person's own — gets no directive written for it:
the machinery does not post instructions on work no run of its own opened. And a
pull request whose head branch is not the repository's own — a fork — starts
nothing at all, however its body is written: an agent only starts when a
repository member triggered it, and closing a fork's pull request is not that.

A rejected branch is not deleted. It is where the agent resumes when it decides
the work is still needed, and a second pull request can be opened from it.
