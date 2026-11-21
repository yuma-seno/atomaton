# What an upgrade replaces, and what is yours

What you receive has **two roots**, and which one a file is under is the whole
rule. `.github/atomaton/` is yours: the config, the agent definitions, the prompt
template, the skills, the rulesets. `.github/atomaton-runtime/` is Atomaton's: the
tool servers, their hooks, the defaults they start from, the packages they need,
and the scripts the workflows run. Nothing in it is a setting. `.github/workflows/`
is generated as well; GitHub decides where that lives. `.github/atomaton/README.md`
walks both directories from inside them, and says why the line falls where it does.

## How an upgrade decides, file by file

There used to be a table here saying which paths were yours outright, which were
replaced wholesale, and which were both. The table was a hand-written answer to a
question the machinery can measure, and a layout change upstream would have needed
it rewritten. It is gone, and what replaces it is the ordinary git three-way merge:

- **A file you never touched takes the new version, silently.** Whatever upstream
  did — added, changed, deleted — happens to your tree as if you had done it.
- **A file you edited, upstream did not touch, keeps your words.** The upgrade
  does not restore a default over your work.
- **A file you both changed is the one thing that stops.** The update applies the
  release on a branch, runs the merge, and where your edit and upstream's change
  land on the same lines the file comes out carrying conflict markers that name
  both sides. The pull request stands, nothing merges, and resolving it is
  [yours to make](tasks/move-to-a-newer-release.md) — by hand, or by asking an
  agent on that pull request.

No path is special-cased. Whether something collides is measured from what your
tree actually holds, at update time — so a file you customised in a directory the
template mostly owns behaves exactly like one in a directory you own outright, and
a directory upstream adds needs no new rule to be handled correctly.

**Paths are not settings.** No key says where any of this lives, and that is a
decision rather than an omission: `.github/atomaton/README.md` gives the three
mechanisms that depend on these two directories being roots.
