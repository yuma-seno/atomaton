# What a check and a deployment refuse to do

## A check that needs a credential

**The commands come from the default branch.** A pull request cannot add a check,
rename one, change what one runs, or widen which secret a job receives —
[which ref a pipeline is read from](how-it-works.md). That is the one thing a
credential rests on, and it holds for every entry in `checks.jobs` alike. The
values stay in GitHub either way; only the names are ever in the config.

**Each job names its own secrets.** A job is handed the ones its own entry named
and no others, so a staging credential does not sit in the job that checks
something else. An entry that names none runs in a job with no secret slots in it
at all — not empty ones — so "this check cannot reach a credential" is a property
of the workflow rather than of today's configuration.

**The pull request is the working tree.** Every check runs with the pull request
checked out, reading it in place. This is the one thing that was stronger before
the list was unified: a check that named a credential used to run in the default
branch's tree with the pull request beside it, and now it runs in the pull
request's. So a credentialed entry whose commands compile or test the change puts
a credential in the environment of code the change wrote.

Nothing mechanical enforces the difference, and it did not before either — an
interpreter reads a file rather than executing it, but nothing stopped
`bash "$ATOMATON_PR_TREE/x.sh"` when that path existed. It rests on how the entry
is written, which is why it is worth writing patiently:

- An entry that runs the project's own tests names **no** secret. It is the
  ordinary entry, and its job has nowhere to put one.
- An entry that names a secret is for talking to something outside the repository
  — a service, a registry, a cloud account — and is worth keeping to that.

A check that needs both at once belongs after the merge, or wants a credential you
would not mind losing.

The other direction is worth knowing: a tool that needs a credential you would
rather not route into an agent's environment can be a step in `checks.jobs`
instead, because that list runs in its own job. What routing does and does not
protect is
[what a tool can and cannot be protected from](../tools/boundaries.md#what-a-tool-can-and-cannot-be-protected-from).

## A deployment refuses a branch anyone can push to

A branch anyone can push to is a deployment anyone can run, with its credentials,
on a commit nobody read. So before a deployment starts, the branch its entry
named is checked against the rulesets in effect on it, and the run is **refused**
— not warned — when no ruleset requires a pull request there. The shipped ruleset
covers `~DEFAULT_BRANCH` and nothing else, so `branches: [develop]` needs one of
your own covering `develop`.

A refusal is also what you get when the rules could not be read at all, and on a
repository where rulesets are unavailable — a private repository on a free plan.
"Could not be checked" is not "is protected", and a deployment is not the place to
guess. What is left on such a repository is
[what `merge` decides](../pull-requests/boundaries.md), which is then the whole of
the gate.

`on_merge` and `on_tag` are both checked this way, because both name a branch.
`on_demand` is not: it answers to no event, so reaching it already took someone
with write access naming it by hand.

**A tag is checked twice, and the second one is the point.** Its entry's
`branches` must require a pull request, *and* the tag's commit must actually be
inside one of them. Measured: `compare/main...v1.0.0` answers `behind` when the
commit is in `main` and `diverged` when it is not.

A tag that matches your pattern but sits outside the branch deploys nothing, and
says so in the log — it is not an error, because tagging something that is not
ready is an ordinary thing to do. What it is not is silent.

## What commands cannot express

Where you still need a workflow of your own, through `deploy.your_workflow` or
`checks.your_workflow`:

- a job's `permissions` beyond what the shipped workflows declare.
  `atomaton-check.yml` runs with `contents: read` plus a `GITHUB_TOKEN` in
  `GH_TOKEN`; `atomaton-deploy.yml` with `contents: write` and `id-token: write`,
  so it can cut a release and can exchange its identity for cloud credentials
- a deployment approval gate — `environment:` takes no expression, so nothing in
  configuration can reach it
- GitHub's own artifact store and cache
- any trigger outside merge, tag and manual dispatch — including a schedule,
  since a cron expression can only be written in a workflow's `on:`, and
  including a default branch named neither `main` nor `master`, for your own
  merges

Most of the limits people expect are not real. Service containers work through
`docker run`, and a matrix works as a loop, losing only parallelism. Both are
commands.

## Nothing checks that your tool servers still start

`deploy` ships empty, so nothing verifies that the tool servers a run would start
actually start — that an allowlist pattern still names a tool that exists, that two
`unprefixed` servers do not claim one name, that a server runs at all. Answering any
of those means executing the configuration.

**Atomaton's own check does it, on every pull request.** `atomaton-tools` is a job
of its own in `atomaton-check.yml`, and it starts every server the pull request's
definitions name. It is not yours to configure and not part of `checks`: it runs
whether or not you declared anything, and it holds no repository secret — which is
what makes starting a pull request's servers safe there.
[What a pull request is checked against](../pull-requests/boundaries.md#what-a-pull-request-is-checked-against)
is the whole of it.

What is left for you is the other half: a server that starts and advertises the
right tools can still fail on a *call*, and nothing here calls one. A package a
server needs only in order to answer is not installed by this check, and a
credential it needs only in order to answer is not routed to it. Those are found by
the run that needed them, which is why
[what a tool can and cannot be protected from](../tools/boundaries.md#what-a-tool-can-and-cannot-be-protected-from)
is worth reading before adding a server of your own.
