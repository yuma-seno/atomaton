# Merge with a merge commit

Three settings on the repository decide this, and nothing in the deliverable can
set any of them: a merge method is a repository setting, and the file that
declares one — `.github/atomaton/rulesets/main.json` — has to be imported by a
person. It is the same shape as [make a branch ruleset work with
agents](make-a-branch-ruleset-work-with-agents.md), with the same failure mode:
skip it and nothing goes wrong yet, it goes wrong later and somewhere else.

## The three settings

**Settings > General > Pull Requests**, with the merge method pinned to **Create a
merge commit**:

| Setting | Value | What breaks otherwise |
| --- | --- | --- |
| Allow merge commits | **on** | Atomaton's own `merge_pr` asks for one, and GitHub refuses a pull request whose method is not allowed |
| Allow squash merging | **off** | the branch's commits are collapsed into one new commit, so a tag on one of them can never deploy |
| Allow rebase merging | **off** | the branch's commits are re-created with new SHAs, with the same effect on tags |
| **Automatically delete head branches** | **on** | merged branches accumulate; one per issue, forever |

The ruleset declares the same restriction independently —
`allowed_merge_methods: ["merge"]` on its pull request rule — so importing the
shipped file with the merge commit switch off is a state GitHub will not let you
merge through. Keep the two in step the way the ruleset page says to: edit the
file, re-import it.

Automatically deleting head branches is the one setting here that the deliverable
does **not** restate, because it cannot. A ruleset has a `deletion` rule and it
means the opposite — *restrict* deletions — so there is no way to express "delete
after merging" as a rule. Atomaton's own `merge_pr` deletes the branch it merged
anyway, which covers the merges it makes; the setting is what covers the ones a
person makes.

## Why a merge commit, and not the tidier histories

Because the commit that is released has to be the commit that was reviewed.

Squash and rebase both build **new** commits for the base. A squash collapses the
branch into one; a rebase puts each commit across with a new SHA and new committer
information. A squashed pull request lands with an identical tree, identical author
and identical message, and a different SHA, committer and timestamp — measured,
`625a156` became `2f208c8`. Nothing is lost except the identity of what was
approved.

Two things follow from that, and both are why this is a setting rather than a
preference:

- **A tag on a branch's commit never becomes reachable.** [A merge deploys the
  tags it just made reachable](../../pipeline/how-it-works.md), and the branch's
  commits are not among them. A release that tags the delivered commit hits this
  directly.
- **The approval is attached to a commit that does not ship.** The ruleset's check
  runs against the head commit; with a rewritten method, the tree that lands is
  one nobody has a check on.

A merge commit keeps both: the branch's commits arrive unchanged, and the merge
commit is the only new object. Its ancestry is not linear, which is the price, and
for a repository whose pull requests are usually one commit it is a small one.

**A fast-forward merge is not the way out**, though it looks like one — it would
put the branch's commits in the base under their own SHAs, with no merge commit
and no rewrite. GitHub simply does not offer it as a method: there is no setting
for it. Anyone who wants one does it by hand and pushes, which is a push to the
default branch and is what the ruleset exists to prevent.
