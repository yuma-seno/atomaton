# Take over an existing CI/CD

[Setup](../../setup.md) takes an empty repository to a first agent run, and both
pipeline pages assume the pipeline is being written for the first time. This is for
the state you are more likely to be in: a `ci.yml` that runs the tests, a
`release.yml` that publishes, and a ruleset that will not let a pull request merge
until `ci.yml` has reported its `Test` check. All three already work. What changes
is who owns them, and the order you change it in.

## The request is one issue

On a repository that already has a pipeline, the whole ask is this:

```text
/engineer

Move what `.github/workflows/ci.yml` does into `checks.jobs`, and what
`.github/workflows/release.yml` does into `deploy`. Decide between `on_merge` and
`on_tag`, and say why in the pull request.
```

You do not write the commands. What `ci.yml` does becomes entries under
[`checks.jobs`](../reference.md#checksjobs), and a
`release.yml` that tags a version on merge and builds that tag usually becomes two
arms — [`on_merge`](../reference.md#deployon_merge) for the tag decision,
[`on_tag`](../reference.md#deployon_tag) for the build and the publish. Asking for
the reasoning in the pull request is what lets you disagree with the split before a
release depends on it.

## The half the agent cannot do

The agent writes `config.yaml`, and it may add scripts under `.github/atomaton/`. It
cannot write or delete anything under `.github/workflows/**`: GitHub refuses
`GITHUB_TOKEN` there by identity, on every path and every branch, and no permission
grants it. **Deleting the two workflows is your step**, and the migration pull request
arrives with them untouched. That is what looks unfinished about it, and it is not:
[a repository whose pipeline lives in `config.yaml` is one an agent can maintain](give-a-repository-a-pipeline-an-agent-can-write-and-maintain.md).

## The order, which is not a free choice

Two constraints, and taking either one in the other order leaves `main` with merges it
cannot finish.

**The required check has to move to `atomaton-check` before the old workflow is
deleted.** A pull request that deletes `ci.yml` has no `ci.yml` in its merge commit, so
nothing on that commit can produce the `Test` context the ruleset requires. It is
unmergeable under its own ruleset, and permanently: the rules it has to satisfy are the
rules it is changing. The same trap in another costume is a check that never reports at
all — GitHub holds a `pull_request`-triggered run for approval on a pull request opened
with the bot's own token, and a `ci.yml` with no `workflow_dispatch` cannot be started
by hand either. That is [a check that will not
settle](../../github/when-it-breaks.md).

**`atomaton-check` has to be green before it becomes required.** A required check that
goes red for a reason unrelated to the change freezes every merge, and
`.github/atomaton/rulesets/main.json` ships with an empty `bypass_actors`, so the way
out runs through a person editing the ruleset while `main` is closed to everyone. Wait
for one green run first, on a change that had nothing to do with this migration if you
can get one.

So the order is:

```text
land the migration → one green atomaton-check → apply the ruleset → delete the old workflows
```

## Applying the ruleset replaces it, it does not add one

The shipped file already requires the `atomaton-check` context, and [importing
it](../../github/tasks/make-a-branch-ruleset-work-with-agents.md) is the same procedure
as on an empty repository. The difference is what it lands on: put it **over** the
ruleset you already have rather than beside it. Two active rulesets both apply and
their requirements are combined, so an old `Test` requirement survives the import, and
every pull request then waits forever on a workflow that is about to be deleted.

The file also pins `allowed_merge_methods: ["merge"]`, which is a second change to the
same setting — [merge with a merge
commit](../../github/tasks/merge-with-a-merge-commit.md) is why. Expect both to move
together, and say so in the change rather than leaving it to be discovered when a
squash-merge stops being offered.

If your ruleset is declared in the tree as well — a `.github/rulesets/main.json`, next
to the one Atomaton ships — update that declaration in the same breath. Nothing
compares the two, so a file left behind disagrees with what GitHub enforces and quietly
stays wrong.

## Two pipelines, for a while

Between the migration landing and the workflows being deleted, both pipelines run on
every merge. Both ask the same question — does this version have a tag already — so one
creates it and the other finds it and does nothing. The window is safe for as long as
you leave it open.

Do not delete `release.yml` before one release has actually shipped through the new
`deploy`. The migration is the moment the release path stops being the one that has
always worked, and a release that has gone out once is the only thing that says the new
one is right. The merge that carries the migration proves nothing about the deploy; the
first tag after it does.

## If you are keeping the workflows

A repository that wants to keep `ci.yml` and `release.yml` uses `checks.your_workflow`
and `deploy.your_workflow` instead of commands, and [that page](have-agents-start-your-own-ci-and-deployment.md)
is where it is written down. The difference is one sentence: with `your_workflow` the
machinery dispatches your workflow — which then needs `workflow_dispatch` — and mirrors
its result into `atomaton-check`; with commands the machinery runs them itself. In both
cases the ruleset ends up requiring `atomaton-check` and not `Test`, so the order above
is the same either way; what changes is whether a person still has to open a pull
request to change a step.
