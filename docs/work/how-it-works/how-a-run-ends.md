# How a run ends, and what a failure leaves behind

A run that gets to report ends with exactly one turn-ending comment on the issue or
pull request it worked on. That comment is how the thread learns the turn is over —
the guard reads the thread, not the Actions tab.

## The two ways the comment is written

**The agent's own last message.** A run that finishes by saying something has that
message posted as the turn-ending comment, footer attached.

**A session-ending tool.** `create_pr`, `launch_sub_agent`, `request_close_issue`
and `reload_environment` end the session while doing their work, and the comment
such a call left on the thread is the ending: the footer is appended onto it, so
the run still has exactly one.

The footer is the record of a run that reported — the run's link, its token count,
its metrics link — and it goes on those two comments and no others. The failure
notice below is a turn-ending comment without one: it links the run's log itself,
and a run that failed mid-turn has no token tally worth recording.

## A failure that gets reported is also an ending

When the agent itself fails, the failure is converted into the comment it owed the
thread. The failure notice IS the turn-ending comment: it says the session was
saved, names the two ways forward — continue with `/agent`, or start clean with
`/agent recover` — and links the run's log. The node is back with a person, so the
next comment on the thread resumes normally.

The colour follows what the comment says, because the thing that reports is a step
inside the run:

- **The agent's own failure, reported — green.** The notice is the run's report;
  a red run beside it would only repeat that news in Notifications, where it
  drowns the runs whose red is their only signal.
- **The machinery's failure — red, ending or not.** A machinery failure inside the
  run itself (the tools file it could not write, a `sudo` it was refused, an
  ending it could not read) still posts the notice, so the thread is healed — but
  the run goes red, because red is the machinery's signal and the thread is healed
  beside it, not instead of it.
- **A failure that could not be reported — red, and no ending.** The machinery
  died before the reporter could run (the checkout, the tool installs, the session
  save), or `gh` refused the comment. Red is then the only signal the run leaves,
  and the workflow log says what the thread does not.

## When a run leaves no ending at all

A run that died before it could report — the third case above — leaves the
thread's last turn event saying the ball is still with an agent. The guard reads
that the same way it reads a live run —
[what keeps two runs off one issue](what-keeps-two-runs-off-one-issue.md) — so it
keeps removing what a person writes next, and it suppresses the dispatch as well:
no run arrives to heal the thread. Comments that keep vanishing with no run behind
them are this shape.

**The run watch is the outside check for exactly this.** When a run completes,
`Atomaton Run Watch` reads the node's thread and asks whether an ending comment
was written at or after that run started. A run that reported has one — the two
above are steps of the run itself, which finished before the watch could ever
look — so the watch stays silent. A run that never got to write one gets a
notice: the turn-ending header that puts the node back with a person, the fact
that nothing was decided, the run's link, and the two ways forward. The watch
also removes the `atomaton/in-progress` label the dead run left, by the same
turn rule the runner itself applies. It cannot double-post: the watched run's
completion fires only after its own steps are done, so a report that landed at
all landed first.

The watch triggers on three workflows: `Atomaton Runner` itself — the
continuations a chain dispatches — and `Atomaton Entry` and `Atomaton Manual
Comment`, because GitHub records no run for a **called** workflow: those two
execute the runner as a reusable workflow, so the first run of every chain —
the one a person's command or a new issue starts — exists only as its caller's
run. Most entry runs dispatch nothing (an ordinary remark, a comment the guard
removed), so the watch posts on one only when the thread is stuck at an ask AND
that ask is that run's doing — a dispatch marker posted inside it, or the
person's own command, when three things hold: the run was started by a comment
the run could consume, the run did not end successfully, and the command was
written before the run started. A command written while a run is already going
belongs to the run that command itself starts; an entry run started by a new
issue consumes no comment at all — its ask is the issue's body, so a command
sitting on that thread is never its doing; and a run that ended successfully
carried its own judgment all the way through — it dispatched, and its marker is
on the thread, or it decided there was nothing to do — so only a run that died
before posting any marker may fall back to the command. Those distinctions are
what keep the watch silent while the command's own run works: opening an issue
and commenting seconds later must not make the issue's entry run claim the
command, and a run that decided not to dispatch must not post a notice beside
the run a later command started. A run that completed without taking the turn
leaves the thread as it was, and the watch has nothing to say.

The watch reads which node a run worked on out of the run's title. The runner
writes `run-name: "agent on #N"`; the two entry workflows write `#N` alone,
because `run-name` is evaluated before any job runs and the agent is a route's
decision — the notice reads the agent off the thread. One exception: a
manual-comment run for a comment on a **pull request** keeps the workflow's own
name, because `issue_comment` fires on pull requests too and a PR command
dispatches validation rather than calling the runner — that run takes no turn,
and a `#N` title there would draw a false notice while validation and the
runner were still to come. The PR chain is watched through the runner run that
validation eventually starts, whose title carries the agent. Titles matching
neither shape — runs from before this existed — are left alone.

The restore is the same for every kind of death: **re-run the failed run**.
"Re-run failed jobs" from the run's page, or by hand:

```bash
gh workflow run atomaton-runner.yml -f number=N -f agent=X -f type=issue
```

The job runs again from the saved session and writes the ending it owed — and once
the ending is on the thread, comments go through again. The watch is what makes
the thread survivable in the meantime; only the re-run makes the work continue.
Three deaths it cannot cover, because nothing outside GitHub can: GitHub itself
down (nobody can write anything), a run queued forever (its completion never
fires), and a deleted node (nowhere to post). There the red run is the only
signal, and re-running it is the recovery.
