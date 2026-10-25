# The branch a run commits to

- A branch is created at the first commit, not at the start of a run. A run that
  only reports, confirms a merge, or closes an issue leaves no branch behind.
- The name is `atomaton/issue-N`. A merge deletes the branch, so the same issue's
  next piece of work takes that name again, cut fresh from the base branch.
- If a merged branch is still there — a deletion that failed, or a merge made
  some other way — the next name counts up instead: `atomaton/issue-N-2`, then
  `atomaton/issue-N-3`. Work never resumes on merged history.
- When an unmerged branch is left behind, the issue's next run resumes it
  instead of starting from the base branch.
- A sub-issue's branch is cut from its parent's and merges back into it, so
  sibling tasks see each other's work as it lands. The parent's branch is created
  from the base branch when the first child commits — until then it does not
  exist — and reaches the base branch as one pull request once every child is
  done. Deployment is not dispatched for a merge into a parent branch: that work
  is still in progress, and only the final pull request into the base branch
  carries it to release. `merge.policy`, `merge.governed_paths` and `merge.gates`
  are not applied to that merge either, for the same reason: they describe the
  merge into the base branch, and the parent's own pull request is judged against
  all three on the whole aggregate.
- The run is checked out on the base branch, so it learns where its work goes only
  at the first commit — by which time the parent's branch may have moved in the
  same files. The work is carried across as a three-way merge: the changes are
  stashed, the branch is cut from the parent, and `git stash pop` applies them to
  it. A file both sides changed is a conflict in the worktree, named, for the run
  to resolve before it commits; it is not a checkout that refuses because the tree
  is dirty, and no file the run did not touch keeps a base-branch version over the
  parent's. Both sides of a conflicted path are in git's index — `git show
  :2:<path>` is the version already on the branch, `git show :3:<path>` the one
  this run brings — and a text file holds git's markers in the worktree while a
  binary does not, so the run writes the side it wants into the file and names the
  path in `resolved_paths` on `commit_and_push`.
- A node's base is exactly one branch: its parent's, or the base branch for a root
  issue. When that branch moves ahead, the node brings it into its own branch with
  `merge_base_into_branch`. The direction is always a pull — nothing writes to a
  child's or a sibling's branch and nothing cascades, so two siblings catching up
  with the same parent never touch each other's work, and there is no shared state
  to keep consistent. A pull request run brings in the base its own pull request
  aims at, which is the same branch. It is also the route a stacked child takes to
  its parent's newer commits — the one it did not have before this.
- The base arrives as a merge commit, never as a rebase: the branch's own commits
  keep their hashes, and the merge records where it came from. A conflict stops it
  — nothing is committed, and both sides of each conflicted path stay in git's
  index — and the run resolves them and calls `commit_and_push` with
  `resolved_paths` naming each path to close the merge. Which side wins is
  the agent's decision; a version in `package.json` is the case that shows why no
  rule belongs there, since a machine choosing one could roll a release back
  quietly.
- A run's checkout is shallow — `actions/checkout` at its default
  `fetch-depth: 1` — so the branch's own ancestry stops at the one commit it
  checked out. `merge_base_into_branch` deepens the checkout to where the two
  histories meet before merging, so `refusing to merge unrelated histories` is
  never the answer to a merge base that only this clone had truncated.
- `sync_branch` is the other question and does not answer this one: it
  fast-forwards a branch to its own remote branch, and brings no base in.

Which branch the first of these is cut from is
[`base_branch`](../reference.md#base_branch), and the tree these branches follow is
[work is a tree of issues](work-is-a-tree-of-issues.md).
