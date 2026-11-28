# Move to a newer release

An adopted tree is a copy, and the machinery is what keeps it current. Taking a
release is one comment or one button; resolving a collision is a judgement only
you (or an agent acting for you) can make. This page covers both, and the by-hand
procedure is in the appendix at the end.

**You do not have to watch for it.** `atomaton-new-release.yml`, which ships with
the release, runs once a day and compares `.github/atomaton-release.json` against
the latest release. When they differ it does what `update.on_new_release` says —
and that setting decides whether you are reading an issue at all.

In `issue` mode it opens one issue — updated in place rather than opened again
— carrying both versions, the release notes in between, a preview of what taking
the release would do to your tree (files updated, added, removed, and — most useful
— files you changed AND upstream changed), and the paths upstream no longer ships.
Once a notice's version is the one you are on, it closes itself, so an open one
always means an upgrade is still waiting. It needs no secret of its own:
`contents: read` to read the releases and `issues: write` to write the notice. Run
it by hand from the Actions tab if you would rather ask now than wait for the next
day.

**It can also take the release for you.** `update.on_new_release` decides what
happens when the comparison finds a newer release, and what an unset key means
is the notice alone:

- `issue` — what this page has described so far, and what an unset key means.
  Nothing is taken until somebody says so.
- `pr` — no notice is written: the update is started instead, and the pull request
  it opens is the thread. A clean plan merges itself once your checks pass; a
  collision stops at the pull request, whose body names the files.
- `pr-agent` — the same, and
  [`agents.on_update_conflict`](../../work/reference.md#agentson_update_conflict)
  is started on the pull request that stopped, to resolve the conflict markers it can.
  A conflicted path under `.github/workflows/` is a person's — GitHub refuses a
  workflow file written with the agent's token — so the agent leaves those markers in
  place and names the paths in its report, and a pull request mixing the two kinds
  stops half-resolved.

The template itself ships `pr-agent`, the agent name included. A repository that
would rather read the notice first deletes the line, or sets `issue` — which is
also what an absent key means.

**Which releases are noticed at all** is
[`update.detection_scope`](../../work/reference.md#updatedetection_scope). An absent
key means every one — what repositories noticed before the key existed — and the
shipped template states `marked` outright. At `marked`, only the releases whose notes
carry `atomaton:adopt` are noticed: a newer release with no mark in its notes writes no
notice and starts nothing, and the daily run stays green. The template marks a release
when a stale tree should stop waiting for it, which is a judgement about the release
rather than about how far its version number moved.

`pr` and `pr-agent` need `ATOMATON_UPDATE_TOKEN`, which the update needs anyway.
Without it nothing can be started, so the run settles for the notice it would have
written in `issue` mode — headed by a warning that says so — rather than leaving a
green run with nothing to show for it. The same happens, with a different sentence,
if GitHub refuses the dispatch.

The mode is a policy for the collision, not for the command that started the run:
on a `pr-agent` repository, `!upgrade` that collides gets the agent too.

## Taking it

Two ways, same machinery:

- Comment **`!upgrade`** on the notice (or any thread), or
- run **Atomaton Update** from the Actions tab.

The run reads your tree and the releases, applies the plan — the one the notice
previewed — on a branch, pushes it, and opens a pull request. What happens next
is decided by what the merge measured, not by a flag:

- **Nothing collided.** The pull request requests the auto-merge; your
  repository's own checks run first, and when they pass it merges itself. The
  notice closes.
- **You changed a file upstream also changed.** The pull request stands with
  conflict markers in those files, naming both sides. Nothing merges until
  someone resolves them: comment on that pull request and ask an agent, or edit
  the files yourself. The checks run on the resolved tree, and then it can merge.
- **Upstream adds, removes or rewrites a path your tree stands differently on.**
  Not a collision, and no markers: the plan leaves that path as your tree has it
  and lists it, so the pull request stands and does not merge itself. Read it, and
  merge by hand when it reads right — or comment on that pull request and ask an
  agent to help.

The update cannot run without `ATOMATON_UPDATE_TOKEN`, a repository secret holding
a token with `repo` and `workflow` scope — or, fine-grained, `Contents` and
`Pull requests` read and write, plus `Workflows` write. That is deliberate: a push
made with the workflow's own token starts no checks, so a merge gated on them
would gate on nothing. Starting the update is not something this token does: the
notice workflow dispatches it with its own `GITHUB_TOKEN`, so `Actions` is not a
scope you need to add. The second scope is not optional: the release ships
workflows, and GitHub refuses any push that changes a file under
`.github/workflows/` without it. If the secret is missing the run fails loudly and
changes nothing — set the secret and run it again.

## What it does not touch

The plan classifies every path the two releases ship; paths in neither release —
your own workflows, your project skills — are invisible to it and are never
written or deleted. One list is reported but never acted on: paths you have under
`.github/` that the target release no longer ships.

**Your own skills may need a rename before they load again.** A skill is a directory
holding a `SKILL.md`, and that is what the runtime loads. If you wrote skills under
the older flat layout — `skills/<category>/<name>.md` — then from the first run on a
release carrying that loader they are files it ignores: they stay in your tree,
nothing reports them, and the catalog simply stops listing them. The update cannot
move them for you, because your own skills are paths the release does not ship and
its plan never names them.

Moving one is a rename plus the name in its own frontmatter:

```bash
mkdir -p .github/atomaton/skills/<your-name>
git mv .github/atomaton/skills/<where-it-was>.md \
       .github/atomaton/skills/<your-name>/SKILL.md
# then set `name: <your-name>` in the frontmatter — the directory's own name, with
# no category in front of it
```

[Write a skill](../../agents/tasks/write-a-skill.md) is the layout, and the rules the
name is checked against.

**What did upstream delete?** Extracting never deletes, so a file the template
dropped stays in your tree — and that is not cosmetic. Two workflows were removed
in v0.1.71 because work should start only when somebody asks; keeping them keeps
the triggers. The update names them on its pull request, and by hand they are:

```bash
# Paths you have under .github/ that this release no longer ships.
# Your own files appear here too, which is why it is a list to read, not to pipe
# into rm.
comm -23 \
  <(git ls-files '.github/*' | sort) \
  <(jq -r '.files[]' .github/atomaton-release.json | sort)
```

Read it rather than acting on it: your own workflows and your own project skills are
files the template never shipped, and they are supposed to be there.

## Which release do I have?

`.github/atomaton-release.json` says. It ships with the release and records the
version and every path the release contains:

```bash
jq -r .version .github/atomaton-release.json
```

How the machinery decides what replaces what is [what an upgrade
replaces](../boundaries.md): in one sentence, the ordinary three-way merge between
the release you took, your tree, and the release you are taking.

## Appendix: by hand

The workflow automates the procedure below. Doing it by hand is equivalent, and
sometimes preferable when the machinery itself is what you want to change:

```bash
gh release download v0.1.115 -R yuma-seno/atomaton -p atomaton-delivery.zip
unzip -o atomaton-delivery.zip   # the archive holds .github/, so run this at the repo root
rm atomaton-delivery.zip
git diff .github/            # every difference is now a decision
git checkout -- .github/atomaton/config.yaml    # for anything you meant to keep
```

Name the version rather than taking `latest`, and read the upstream changes between
yours and the next one (`gh release view`, or compare the two tags) rather than
rediscovering them in a diff. The habit the machinery codifies is the same one:
keep your customisation in `config.yaml` and under `skills/project/`, where a
collision means an edit you remember making.
