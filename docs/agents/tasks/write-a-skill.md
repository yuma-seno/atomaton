# Write a skill

A skill is a set of instructions this project has written for a particular kind of
work, loaded on demand rather than carried by every run. It is a directory holding a
`SKILL.md`, under `.github/atomaton/skills/<category>/<name>/`, and `<name>` — the
directory's own name — is what an agent asks for with `load_skill`.

## When a skill rather than the role prompt

The role prompt is what every run of an agent carries. A skill is what only some
runs need. So the test is whether the work in front of a run is of a kind the
instructions cover:

- **A skill** — a procedure for a situation that arises sometimes: a dependency is
  missing, the answer is not in the repository, a pipeline has to be set up.
- **The role prompt** — what is true of every run of that agent: what it is for,
  what it must not do, which outcome ends a run.

A check that is not optional does not belong behind an optional load. The
reviewer's mandatory checks are in its definition for exactly that reason: two
lines of one file asked for the same step by two mechanisms, and the one behind
the load was obeyed 43 times out of 227.

## The folder

```text
.github/atomaton/skills/research/web-search/
├── SKILL.md
├── scripts/     # only if the skill needs one
└── assets/      # only if the skill needs one
```

```markdown
---
name: web-search
description: Load when the answer is not in your repository — fetching a page whose address you know, and running a general search when you do not.
---

# Looking outside your repository

...
```

**`name` has to be the directory's own name, with the category left out of it.** The
folder above holds a skill called `web-search` — not `research/web-search`, which
was the name the flat layout used. The loader validates the file against the
format's specification and rejects it otherwise, so a name carrying its category is
not an odd name but a skill no run can load, and nothing else reports that.

The rest of what is checked, on every file:

- `name` is 1–64 characters of lowercase letters, digits and single hyphens, with no
  hyphen at either end and never two in a row. It is the skill's identity, so no two
  skills under `skills/` may share one, whatever category they sit in — the category
  is a shelf, not part of the name.
- `description` is non-empty and at most 1024 characters. It is the whole of what an
  agent sees before loading, so it has to say when to load the skill, not what the
  skill contains.
- the body is the instructions, and it arrives only when the agent asks.

A `.md` file that is not named `SKILL.md` is not a skill at all: the loader ignores
it, it never appears in the catalog, and no run can ask for it.

## A skill that needs scripts or assets

Put them in its own folder — `scripts/` and `assets/` beside the `SKILL.md` — and
reach for them by a path from there. The loader stops descending at a directory
holding a `SKILL.md`, so everything beside it is a resource rather than another
definition, and the skill moves, upgrades and is deleted as one unit instead of a
body that points at files somebody else may have replaced.

`docs/customer-doc` is the shipped example: `scripts/customer-doc.mjs` and
`scripts/deps.mjs` are its commands, and `assets/templates/` holds the three default
templates they fill.

## What ships, and what is yours

The template ships a few skills as a starting point, and `skills/project/` is
yours outright — an upgrade will not fight you for it. A skill there is a directory
of its own, `skills/project/<name>/SKILL.md` with `name: <name>`, exactly like any
other: the folder layout is what makes it a skill, not the category it sits under.
The shipped ones are
defaults the template also expects you to tune, so a change there is either an
improvement you have not taken or a change you made on purpose, and the two look
identical. [What an upgrade replaces, and what is
yours](../../runtime/boundaries.md) is the whole rule.

## Checking it

Every skill needs a `name`, a `description` and a non-empty body; its `name` must
equal the directory it sits in; and no two may share a name. `bun test` holds that,
and the pull request's own check runs it.

If you wrote skills under the older flat layout — `skills/<category>/<name>.md` —
they are the one thing an upgrade cannot move for you. [Move to a newer
release](../../runtime/tasks/move-to-a-newer-release.md) says what to do.
