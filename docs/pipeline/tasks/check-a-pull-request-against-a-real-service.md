# Check a pull request against a service that needs a credential

A check that talks to a real service — an API you hold a token for, a staging
environment, a registry — needs a credential to say anything. The half of
`checks` that runs against a pull request cannot carry one:
`checks.from_pull_request` has no `secrets` key and cannot have one, because its
commands are the pull request's own and the change being judged can rewrite them
into anything that reads what the job was handed.

So the check goes in the other half. `checks.from_default_branch` takes the same
entry shape with `secrets` on it, runs its commands from your default branch, and
gives those commands `$ATOMATON_PR_TREE`, a path to a checkout of the pull
request.

## The entry

```yaml
checks:
  from_default_branch:
    - name: integration
      secrets: [STAGING_TOKEN]
      commands:
        - ./scripts/check-against-staging.sh "$ATOMATON_PR_TREE"
```

`name` is the job's name, and `commands` run in order until one fails. `secrets`
names repository secrets; add the secret to the repository first, because the
entry names it and does not create it. The checkout the commands are handed is
the pull request, so read it and do not execute it — the commands themselves are
yours, read from the default branch, and cannot be edited by the change they are
judging.

## The credential belongs to that entry

Each job receives the secrets its own entry named and no others, so a staging
token is in the job that uses it and not in the job beside it.

## It judges a pull request after the merge, not this one

Commands and secrets both come from the default branch, so the entry does nothing
for the pull request that adds it: the branch that pull request is judged against
does not carry the entry yet. The first pull request it can judge is one opened
after the merge. That is a planning fact rather than a caveat — it decides what
the change adding the entry should be. Write the entry so that it is right on
arrival, land it on its own, and let the next pull request be the first one it
sees.

Why a credential is safe in this half is [a check that needs a
credential](../boundaries.md#a-check-that-needs-a-credential). Every key an entry
accepts is [`checks` and `deploy`](../reference.md).
