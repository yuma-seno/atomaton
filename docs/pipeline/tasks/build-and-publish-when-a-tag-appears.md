# Build and publish when a tag appears

A release asks two questions, and different runs answer them. The first is what
this release is: which version, and the tag that names it. The second is what the
tag points at: build the artifacts for that commit and publish them. An arm that
does both has no way to rebuild a release whose publish failed without deciding a
new version first, and no way for a tag you pushed later to be built by the same
commands a release is.

[`deploy.on_merge`](../reference.md#deployon_merge) answers the first and
[`deploy.on_tag`](../reference.md#deployon_tag) the second. Both lists go in the
same `deploy` block, and the deployment that makes the tag is not the one that
builds it.

```yaml
deploy:
  on_merge:
    - name: version-and-tag
      branches: [main]
      commands:
        - ./scripts/tag-next-version.sh
  on_tag:
    - name: publish-linux
      tags: ["v*"]
      branches: [main]
      runs_on: ubuntu-latest
      commands:
        - ./scripts/build.sh
        - ./scripts/publish.sh
```

The merge arm ends when the tag exists. The tag arm is a separate run on a separate
event, and what the two share is the commit the tag names, not an environment.

## `tags` is required, and `branches` is the guard

`tags` has no default, because an entry that claims every tag is never what anyone
meant. It takes patterns — a literal name, or a prefix and a `*` — and it exists on
`on_tag` and nowhere else. A tag pattern on `on_merge` is a deployment that never
happens: that list is released by a merge, and a merge is not a tag.

`branches` on `on_tag` is not a second filter over the tag. A tag names a **commit**
rather than a branch, so there is nothing for a branch pattern to match; `branches`
says which branch that commit has to be inside. It means the same thing here as on
`on_merge` — **which branch's reviewed content this deployment ships** — and with a
tag it is the only thing saying so.

## One entry per platform

An entry is one job on one runner, and `runs_on` sits on the entry because the
machine is a property of that piece of work. Three platforms are therefore three
entries, each naming its own runner, not one entry carrying a matrix:

```yaml
deploy:
  on_tag:
    - name: publish-linux
      tags: ["v*"]
      branches: [main]
      runs_on: ubuntu-latest
      commands: ["./scripts/build-and-publish.sh"]
    - name: publish-macos
      tags: ["v*"]
      branches: [main]
      runs_on: macos-latest
      commands: ["./scripts/build-and-publish.sh"]
    - name: publish-windows
      tags: ["v*"]
      branches: [main]
      runs_on: windows-latest
      commands: ["./scripts/build-and-publish.sh"]
```

`tags` and `branches` are repeated on each entry because they belong to the entry,
not to the list. `runs_on` takes a single label, or the set of labels one runner
must have — which is how a self-hosted machine is addressed — and either way it is
one machine per entry, however many labels.

What the split buys shows up in the failure. Deployments run one at a time in
declared order and the first failure stops the rest, so a red run names the platform
that broke, and the entries after it did not run at all.

## The tag your deployment makes does not start this by itself

The merge arm creates the tag with the run's own token, and GitHub raises no event
for its own token. Left alone, `on_tag` would fire for a tag you pushed by hand and
never for the one your release just made. The run that created the tag closes that
gap: it dispatches the tag deployment, once per new tag.

A run that was itself started by a tag does not, or a deployment that tags on its
way through publishing would start itself forever.

So the first arm's whole job is to decide the version and make the tag. It does not
build, and it does not have to dispatch anything.

## Where this starts from

Everything above assumes the pipeline is already written as commands in
`config.yaml`. A repository whose `release.yml` still does the version bump, the tag
and the build is [taking over an existing CI/CD](take-over-an-existing-ci-cd.md),
and that is the page for the order to change it in.
