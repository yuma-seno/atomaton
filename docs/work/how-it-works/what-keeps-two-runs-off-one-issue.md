# What keeps two runs off one issue

One issue or pull request holds one run. The runner takes a workflow concurrency
group per `<type>-<number>`, so a second dispatch for the same node waits rather
than starting beside the first, and the `atomaton/in-progress` label goes on before
the agent starts so that the state is visible without reading the Actions tab —
[the labels Atomaton applies](the-labels-atomaton-applies.md).

The turn itself carries identity, written on the thread in two comments. At start
the runner posts one line — `atomaton:took=<ask> run=<run>` — saying which run
took up which request; when it stops it posts the ending, whose tag names the same
ask back (`ended=... answers=<ask> run=<run>`). The pair is what every reader
compares against: the run watch's "did this run report", the guard's "is a comment
arriving mid-turn", and a dispatch that waited minutes for CI all read the same
ids instead of estimating who took the turn from timestamps and event shapes.

A hand-off is a promise, and the thread holds it open: after
`ended=handoff answers=<ask> run=<run>` every reader treats the node as "a run
working or coming". When the dispatch of that successor is refused — the target
closed, the marker unconfirmable, GitHub rejecting the call — the refusal writes
the ending itself (`ended=refused`, answering the ask the successor was to claim,
carrying the promising run's id) and the label comes off with it. Without that
write the node would look busy to every later reader, forever, on work that was
never started.

The label comes off when the work hands back to a person. Which endings count as
handing back is a rule of the machinery rather than a condition written into a
workflow, so every path out of a run releases the guard the same way.

The hand-back is written on the thread: a run that gets to report ends by posting
one turn-ending comment, a failed one included —
[how a run ends, and what a failure leaves behind](how-a-run-ends.md). A run that
dies before it can report leaves its claim unanswered, and the next section of
that page is what that looks like from the thread.

**A comment made while a run is going is deleted.** It would otherwise reach the
agent mid-turn as though it had been part of the conversation all along, so the
machinery removes it and tells whoever wrote it to say it again once the run ends.
"With a run going" reads the claim: between a person's request and the runner
starting, nothing has claimed the turn yet, so a comment made in that window is
kept — and reaches the run that does start. The removed text is not lost with the
comment: the notice reads it back before the
delete and folds it in inside a `<details>` block, tagged
`atomaton:quotes=<comment-id>` as a quotation. The thread reads a quotation as
somebody else's words rather than as the machinery speaking, so a command line in
the preserved text cannot name an agent or end the turn — the deletion stays the
deletion, and what was written stays readable.

`/stop` is the one exemption, and it has to be: its whole meaning is "act on the
run happening right now", so guarding it would make it unusable exactly when it is
needed — [stop a run and pick it up again](../tasks/stop-a-run-and-pick-it-up-again.md).
