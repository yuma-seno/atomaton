# Move to a newer release

An adopted tree is a copy, and the machinery is what keeps it current. Taking a
release is one comment or one button; resolving a collision is a judgement only
you (or an agent acting for you) can make. This page covers both, and the by-hand
procedure is in the appendix at the end.

**You do not have to watch for it.** `atomaton-new-release.yml`, which ships with
the release, runs once a day and compares `.github/atomaton-release.json` against
the latest release. When they differ it opens one issue — updated in place rather
than opened again — carrying both versions, the release notes in between, a
preview of what taking the release would do to your tree (files updated, added,
removed, and — most useful — files you changed AND upstream changed), and the
paths upstream no longer ships. Once a notice's version is the one you are on, it
closes itself, so an open one always means an upgrade is still waiting. It needs
no secret: `contents: read` to read the releases and `issues: write` to write the
notice. Run it by hand from the Actions tab if you would rather ask now than wait
for the next day.

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

The update cannot run without `ATOMATON_UPDATE_TOKEN`, a repository secret holding
a token with repo scope. That is deliberate: a push made with the workflow's own
token starts no checks, so a merge gated on them would gate on nothing. If the
secret is missing the run fails loudly and changes nothing — set the secret and
run it again.

## What it does not touch

The plan classifies every path the two releases ship; paths in neither release —
your own workflows, your project skills — are invisible to it and are never
written or deleted. One list is reported but never acted on: paths you have under
`.github/` that the target release no longer ships.

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
