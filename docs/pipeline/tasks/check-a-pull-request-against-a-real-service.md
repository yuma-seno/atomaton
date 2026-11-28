# Check a pull request against a service that needs a credential

A check that talks to a real service — an API you hold a token for, a staging
environment, a registry — needs a credential to say anything. Name it on the entry
that needs it: a check that names `secrets` is handed those and no others, and one
that names none runs in a job with nowhere to put a credential at all.

What makes that safe is not the entry but where the list comes from.
`atomaton-check.yml` reads `checks` from your **default branch**, so a pull request
cannot add a check, rename one, or widen the secrets one receives — it cannot edit
the list that is reading it.

## The entry

```yaml
checks:
  jobs:
    - name: integration
      secrets: [STAGING_TOKEN]
      commands:
        - ./scripts/check-against-staging.sh
```

`name` is the job's name, and `commands` run in order until one fails. `secrets`
names repository secrets; add the secret to the repository first, because the
entry names it and does not create it.

The pull request is the job's working tree, so the script reads the change in
place — no path to it is passed. It is worth knowing what that means: the code
under test is in the same job as the credential. Keep an entry that names a
secret to talking to something outside the repository, and let the entry that
runs the project's own tests name none. [A check that needs a
credential](../boundaries.md#a-check-that-needs-a-credential) is the reasoning.

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

Every key an entry accepts is [`checks` and `deploy`](../reference.md).
