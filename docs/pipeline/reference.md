# `checks` and `deploy`

Two arms, and exactly one of them. Fill in Atomaton's lists and the shipped
workflow runs your commands; name `your_workflow` instead and it dispatches that,
and the lists are read by nothing. Declaring both is a configuration error rather
than a precedence puzzle you have to remember the answer to.

Atomaton's side is a list of **entries**, and an entry is the same thing in both
sections: a name, the commands that are it, the machine it runs on, and the
credentials those commands may reach. Each entry becomes one GitHub job, so it
picks its own runner and a failure names itself.

```yaml
- name: cloud-names          # its job name; lowercase, digits and hyphens
  runs_on: ubuntu-latest     # a label, or a list of labels one runner must have
  secrets: [AWS_ROLE_ARN]    # repository secrets this entry — and only it — receives
  commands:                  # in order, stopping at the first failure
    - ./scripts/check-env-names.sh
```

Which list an entry goes in is what differs. `checks` has one. `deploy` has three,
named for the event that ships it.

## `checks.jobs`

Every check this project runs on a pull request.

```yaml
checks:
  jobs:
    - name: test
      commands: ["bun test"]
    - name: cloud-names
      secrets: [AWS_ROLE_ARN]
      commands: ["./scripts/check-env-names.sh"]
```

Each entry becomes its own job. An entry that names `secrets` is handed those and
no others; an entry that names none runs in a job with nowhere to put one, which
is the ordinary case and the reason saying nothing is worth preferring.

**The commands come from your default branch, and the tree under test is the pull
request's.** The pull request is the job's working tree, so a command reads it in
place; `checks` is read from the default branch. So a pull request cannot add a
check, rename one, or widen the secrets one receives — which is what makes a
credential safe on any entry here. See
[what a check may reach](boundaries.md#a-check-that-needs-a-credential).

**It ships with one entry**, a gitleaks scan, which is the template's only
default check. It is safe to inherit on a repository with years of history
because it scans the range the branch **adds**, not the history: an old finding
is not something this pull request can fix, and failing every pull request over
one teaches people to ignore the check. If it cannot reach gitleaks — a rate
limit, an outage — it warns rather than fails, because "GitHub was busy" must not
read as "this pull request added a credential".

Why a credential is safe on any entry is
[three separate facts](boundaries.md#a-check-that-needs-a-credential), and the
list is meant to stay short for the third of them.

## `checks.from_pull_request` and `checks.from_default_branch`

The two keys `checks.jobs` replaced, and both still read into it: an entry from
either spelling runs the same way, including the right to name `secrets`. They
exist so a configuration written before the release that unified the list keeps
working. Write `checks.jobs`.

## `deploy.on_merge`

Ships when a change lands on a branch, whether an agent merged it or you did.
`branches` says which; leave it out and it means your default branch, whatever
that branch is called. A pattern is a literal name or a prefix and a `*`, so
`release/*` covers the lot.

## `deploy.on_tag`

Ships when a matching tag is pushed. `tags` is required — an entry claiming every
tag is never what anyone meant — and takes the same patterns. `tags` exists here
and nowhere else: a tag pattern on a merge deployment is a deployment that never
happens.

It has `branches` too, and that one is the guard: a tag names a **commit**, not a
branch, so `branches` says which branch that commit has to be inside.

`branches` means the same thing in both lists that have it: **which branch's
reviewed content this deployment ships.** The list says which event releases it,
`branches` says whose content it is, and the two are independent.

## `deploy.on_demand`

Never ships by itself. Run one by name, from the Actions tab or with
`gh workflow run atomaton-deploy.yml -f target=rollback` — which works for any
entry in any of the three lists. This list exists so a rollback has somewhere
honest to live: it answers to no event, and putting it in `on_merge` would run it
on every merge.

## Credentials, and the name of the entry

`secrets` goes on the entry that needs them, beside its commands. Add the secret
to the repository first; `secrets` names it, it does not create it. Inside a
deployment, `$ATOMATON_DEPLOY_TARGET` holds that entry's name, so one script can
serve several. `atomaton-deploy.yml` declares `id-token: write`, so a cloud
provider's OIDC login works and is worth preferring over storing a long-lived key
at all.

## `runs_on`

```yaml
checks:
  jobs:
    - name: test-macos
      runs_on: macos-latest
      commands: ["bun test"]
deploy:
  on_tag:
    - name: firmware
      runs_on: ["self-hosted", "linux", "gpu"]
      tags: ["fw-*"]
      commands: ["./build-and-flash.sh"]
```

A string is one runner label. A list is the set of labels one runner must have —
which is how a self-hosted runner is addressed. Unset takes `ubuntu-latest`.

It sits on the entry because the machine is a property of that piece of work: a
macOS test and a Linux lint are two jobs, and so are a release and a cloud
rollout. A project that names `your_workflow` instead declares its runners in
that workflow, where the rest of its pipeline already is.

**One runner per entry, however many labels. Not several runners.** Several would
be a matrix inside a matrix; write a second entry instead, which is what gives
each one a name and a failure of its own.

This applies to the jobs that run **your** commands. The agent's own run
[stays on Linux](../tools/boundaries.md#why-the-agents-own-run-is-linux).

## `checks.your_workflow`

```yaml
checks:
  your_workflow: ci.yml
```

The workflow Atomaton runs against an agent's pull request before anyone reviews
it. Defaults to `atomaton-check.yml`. Name yours exactly as the file is called, or
the dispatch fails silently and every merge is refused for a missing check.

Its result decides what happens next: the agent the calls name runs, but only
where a call is waiting for one — green or red alike, so a person who asked for the
fix gets it instead of being told CI failed. Where no call is waiting — a run
already holding the turn, a chain carrying it, or the turn handed back to a person
— nothing is dispatched and nothing is posted on the verdict, because that run's
own report is the thread's next word. A red verdict posts what failed first, which
is the one thing a person reads there.

## `deploy.your_workflow`

```yaml
deploy:
  your_workflow: deploy.yml
```

Dispatched after a successful merge — required rather than optional if your
deployment is chained off CI or off a push to the base branch, because
[nothing downstream of an agent's merge fires by itself](how-it-works.md#what-an-agents-own-merge-does-not-start).
Defaults to `atomaton-deploy.yml`, which does nothing when nothing deploys on that
merge.

**Delete Atomaton's lists in the section you name a workflow in.** The two are
alternatives: declaring both fails the pull request's check, naming the section
and every list you left behind, rather than resolving by a precedence rule — so
an entry left over is reported instead of sitting there reading as live.

A workflow Atomaton is to start must accept `workflow_dispatch`, and a workflow
that reads the pull request from the event payload gets nothing on a dispatched
run. Both are in
[make a workflow of your own work when Atomaton starts it](tasks/make-a-workflow-of-your-own-work-when-atomaton-starts-it.md).
