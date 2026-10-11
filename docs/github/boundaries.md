# What GitHub's own settings protect

Three of the things a run depends on are not in `config.yaml`, are not in the
working tree, and — for one of them — cannot be declared anywhere at all. They are
settings on the repository. The deliverable ships a *declaration* for two of them
and nothing for the third, and none of the three takes effect by being merged:
a declaration is a file, not an effect.

## A workflow cannot grant itself what the repository withholds

The generated workflows declare their own `permissions` — `actions`, `issues`,
`pull-requests` and `contents`, set to write where a job needs it. That block
narrows what the job's `GITHUB_TOKEN` may do. It does not widen it.

So **Settings > Actions > General > Workflow permissions** is above all of them,
and reading the declared block is not evidence that the repository-level setting
is on. A workflow that asks for `pull-requests: write` in a repository that
allows Actions no pull requests gets a token that cannot open one, and the
failure arrives where the agent tried to use it rather than where the permission
was refused.

That is one setting, and one more sits beside it in the same file. **Allow GitHub
Actions to create and approve pull requests** is a switch of its own, and it is
checked *as well as* the workflow permissions above: a repository can grant
`pull-requests: write` and still refuse the action, so neither setting is evidence
of the other. It is what lets an agent open a pull request at all — [setup](../setup.md)
is the procedure.

The pull request an agent opens carries a further surprise that no setting
disables: GitHub holds its `pull_request` runs for human approval, so a check can
sit at `action_required` forever. That is expected and harmless here, and
deleting the held run is the one action that breaks it for good — [when a check
will not settle](when-it-breaks.md).

## The merge method is a setting, and only one of them keeps the commit that was reviewed

The deliverable cannot choose how a pull request merges. `merge_pr` asks for a
merge commit, and GitHub refuses a method the repository does not allow, so the
request and the setting have to agree or no agent merge happens at all. The ruleset
can pin the method (`allowed_merge_methods` on its pull request rule, which the
shipped file declares), but three of the four relevant switches are plain
repository settings with no declaration route:

| Setting | Value | What breaks otherwise |
| --- | --- | --- |
| Allow merge commits | on | `merge_pr` asks for one and is refused |
| Allow squash merging | off | a tag on the branch's own commits can never deploy |
| Allow rebase merging | off | the same — a rebase re-creates those commits with new SHAs |
| Automatically delete head branches | on | a merged branch per issue stays forever |

The last is not a ruleset rule and cannot be one: the only deletion rule a ruleset
has is *Restrict deletions*, which is its opposite. [Merge with a merge
commit](tasks/merge-with-a-merge-commit.md) is the procedure and the reasoning.

## No job can apply a branch ruleset, and none can report that it was not applied

A ruleset is not read from the repository. It is a server-side setting, and
`.github/atomaton/rulesets/main.json` is the reviewed declaration of what that
setting should be — a file, not an effect. Something has to carry it across, and
that something is a person with admin:

- Creating or updating a ruleset goes through the repository administration API,
  and `administration` is not a permission a workflow can grant `GITHUB_TOKEN`.
  There is no job that could do it, whatever it was allowed to declare.
- A check could only report it, never enforce it — and it could not even report
  it usefully. If the ruleset were missing then `atomaton-check` would no longer
  be a required context either, so a check that went red would block nothing.

That is the one step of adoption with no failure mode: it does not go wrong, it
goes unnoticed. [Make a branch ruleset work with
agents](tasks/make-a-branch-ruleset-work-with-agents.md) is the procedure, and
what the rules decide once they are in place is [what the merge gate
stops](../pull-requests/boundaries.md).
