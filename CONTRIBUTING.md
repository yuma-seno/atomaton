# Contributing

## Source-of-truth map

Everything here divides into two kinds: **the deliverable**, which adopters
receive, and **this repository's own tooling**, which they must never see.

The deliverable:

- `src/`: hand-authored source for the template — agent definitions, skills, MCP
  servers, workflow definitions. Adopter-agnostic by rule: no reference to this
  repository's build pipeline, no incident history, no PR numbers.
- `dist/.github/`: generated from `src/` by `bun run synth`. This is what adopters
  receive. **Not tracked in git** — it is a pure function of `src/`, and the
  release deployment publishes it as a release asset rather than committing it.
- `.github/atomaton/scripts/`: this project's own pipeline. `tag-release.sh` is what
  `deploy.on_merge` names. These are the reason there are no hand-written workflows
  left beyond `release.yml`, and they live directly under `.github/` because they
  are this repository's rather than the template's — the update machinery never
  proposes touching a path the release does not ship, so nothing copies them
  anywhere. Governed, like `.github/`. The secret scan used to live here
  too and now ships to every adopter as
  `.github/atomaton-runtime/scripts/scan_secrets.ts`; this repository runs the shipped
  one, so a defect in it fails here before it reaches anybody else.

This repository's own:

- `self/`: this repository's own files rather than the template's, laid out to mirror
  `.github/`. Nothing else in `.github/` is ours. See
  [Applying a release](#applying-a-release-to-this-repository).
- top-level `.github/`: this repository's adoption of the deliverable. Exactly two
  sources, and nothing kept alive by remembering: a release archive, with `self/`
  copied over it. Upgraded deliberately rather than on merge — that lag is what
  stops a change to `src/` from reconfiguring the live agents the moment it
  merges. Adopters upgrade as a git-mediated merge instead, since they have tuned
  files to lose; see [docs/runtime/tasks/move-to-a-newer-release.md](docs/runtime/tasks/move-to-a-newer-release.md), "Move to a newer release".
- `tests/`: tests of the build-and-deploy machinery. Tests of *shipped behaviour*
  live beside the shipped code instead.
- `docs/`: adopter-facing documentation.

Nothing this repository needs for itself belongs under `src/`. That includes
tests of the pipeline, operational scripts, and any rule phrased in terms of
`dist/`, `synth`, or this repository's CI — adopters have none of those.

When changing template behavior, treat `src/` as canonical.

## Branch protection

What may reach `main` is declared in `.github/atomaton/rulesets/main.json`: no direct
pushes, no force-pushes, no branch deletion, and a pull request that cannot merge
until the `atomaton-check` job passes.

How an adopter applies that file, and the two settings they must get right, are in
[make a branch ruleset work with agents](docs/github/tasks/make-a-branch-ruleset-work-with-agents.md) — it is their work, not
a contributor's. What follows is this repository's own, and the reasoning behind
what the shipped file contains.

**The required context is a string, matched by hand.** `atomaton-check` is the job name
in `atomaton-check.yml`, and the two are joined by nothing else.
`generated-workflows.test.ts` holds the shipped pair together; this repository's copy
of the ruleset is applied by hand, so renaming either side means applying it again:

```bash
gh api -X PUT repos/{owner}/{repo}/rulesets/{id} --input .github/atomaton/rulesets/main.json
```

**Nothing needs a bypass.** No workflow writes to `main` — the release deployment
attaches the deliverable to a release instead, which is why `dist/` is no longer
tracked. An agent merging a pull request needs no bypass either: it satisfies the
rules like anyone else.

That is deliberate, and it is what keeps the ruleset file self-contained. Granting a
bypass would mean naming either a GitHub App's ID or a deploy key — values that only
exist after manual setup elsewhere, so the reviewed declaration would stop describing
the whole configuration.

`bypass_actors` is present and empty rather than absent, so that the intent reads as
a decision rather than an omission. It once named the built-in GitHub Actions app,
which is not an app installable on a repository and therefore not a valid
`Integration` actor — the import failed with `The ruleset you are importing contains
an invalid actor`, and the entry was never applied at all.

**There is deliberately no workflow checking that the ruleset is in place.** A check
could only report, never enforce: if the ruleset were missing then `atomaton-check`
would no longer be a required context either, so a failing check would block nothing
— a permanently red mark that stops nobody, which is worse than no mark at all.

Nothing detects a ruleset edited in the UI without a matching change to the file, so
keeping the two together is a discipline rather than something enforced.

## Cutting a release

Merging an ordinary change publishes nothing. The release is declared **separately,
on purpose**: deciding that a set of work is ready to ship is a judgement about the
whole of `main`, not about the pull request that happened to merge last, and no work
pull request carries that judgement in it. `version` in `package.json` is the single
declaration, and `.github/atomaton/scripts/tag-release.sh` derives the tag from it — so
there is no tag to push and nothing that can disagree.

The ordinary route is **Release**. One button: it declares the version, opens the
pull request that declares it, starts that pull request's check itself (a pull
request opened with the workflow's own token fires no event, so the check is
dispatched through the bridge rather than waited for), waits for the required
check to exist and pass, merges, waits for the release to be published, and then
dispatches the update machinery to take the release onto this repository's own
`.github/` — the same three-way plan an adopter gets, which applies itself when it
is clean and stops at a pull request when it needs a person:

```bash
gh workflow run release.yml --ref main -f bump=minor
```

Or press **Run workflow** on **Release** in the Actions tab. Both pull requests it
merges are generated from the version declaration, so neither is a change someone
wrote and neither needs someone to read it. The application is opt-out
(`deploy: false` stops after publishing), never opt-in: a release that forgot to
apply itself would leave this repository behind its own releases.

`version` and `bump` share one job: naming the number. Type a `version` to name it
directly (a leading `v` is accepted), or leave it empty and pick `bump` — which
segment moves is the pick, patch, minor or major, because which part changes is
still the person's to say. A run that guessed would release under a number nobody
chose, so picking nothing is refused. There is nothing to bump on the first
release, when `package.json` declares no version yet, so that one names a version.

The mirror of that rule is for every other pull request: **do not edit `version` in
one.** A work change merged without a version edit publishes nothing, and that is the
normal case — the release follows when a person declares it. A pull request that
arrives with a version change in it is a defect to flag before merge, not a favour to
the next release: the edit would silently publish whatever the branch carried at the
moment of its merge.

It refuses two things, and only two:

- **a downgrade** — the new version must not be below the declared one. This is the
  one check that is not a judgement, so it is the one check made.
- **a version already released** — the tag and the release exist, so there is
  nothing to do.

Everything else is left to the person merging. A version equal to the declared one
is not an error: it means a publish did not finish, and the fix is to re-run the
deploy rather than open a pull request for no diff.

The workflow is hand-written and lives in `.github/workflows/` — not in the
deliverable, so no adopter receives it, and `.github/**` is in
`merge.governed_paths`, so an agent cannot merge the pull request that edits it.
It runs on the workflow's own token throughout: the three events `GITHUB_TOKEN`
suppresses — the pull request's checks, the merge's push, and the tag's push — are
each bridged explicitly (`dispatch_ci.ts`, `dispatch_cd.ts`, and the deploy
workflow's own `dispatch-new-tags` job), the same pattern the machinery uses for
an agent's merges. No PAT is named and no secret is read.

It happens in two halves, and the second is triggered by the first:

1. **`deploy.on_merge` → `.github/atomaton/scripts/tag-release.sh`.** Runs after every merge and is
   idempotent: it reads the declared version, finds a release already exists for
   it, and stops. Only a merge that changes the version creates the tag.
2. **`deploy.on_tag` → `.github/atomaton/scripts/publish-release.sh`.** Runs off that tag. It
   builds, runs the live tool check, packages `dist/` as `atomaton-delivery.zip`
   with `.github/` at the archive root, and creates the release.

**Why two, when one script did both.** A tag used to be only an output here, so
this repository shipped `on_tag` and never once used it — and the path that carries
a tag into a deployment had no traffic on it to show it was broken. Now every
release goes through it, and a human pushing `v1.2.3` at a commit on `main` gets
the same publish.

The cost is a window: between the tag and a successful publish, a tag exists with
no release. `tag-release.sh` will not create it twice, so that state is reported
rather than papered over, and the publish is idempotent:

```sh
gh workflow run atomaton-deploy.yml --ref v1.2.3 -f target=publish
```

Nothing writes to main, so none of this needs a ruleset bypass.

**`publish-release.sh` also runs `.github/atomaton/scripts/check-live-tools.sh`**, between building `dist/`
and creating the release. That script starts every tool server the artifact would
ship and asks `atoma validate --with-live-tools` what each server actually
advertises — which is what says whether a `tool_allowlist` pattern still names a
tool that exists, and whether any server has stopped starting. The same question is
asked earlier, on every pull request, by `atomaton-tools` in `atomaton-check.yml`;
this is the last place it can withhold something, because `dist/` is the tree about
to be published.

It runs here, on the default branch and against `dist/`, and deliberately not on
the pull request: it starts processes, and `tools.servers` lets a pull request name
any `command`. `validate_deliverable.ts` reads a pull request's `.github/atomaton/`
as data and runs nothing under `--root`, and that guarantee is not tradeable. The
cost is that a guard which has stopped guarding is found after the merge that broke
it rather than as a red check on its pull request.

Both kinds of merge reach it, by different routes. Yours fires `push` on the
default branch, which `atomaton-deploy.yml` listens for. An agent's fires nothing —
GitHub starts no workflow run for events its own token triggers — so `mergePr`
dispatches the workflow explicitly.

To publish by hand, or to retry a failed run:

```bash
gh workflow run atomaton-deploy.yml --ref v1.2.3 -f target=publish
```

## Applying a release to this repository

A release does not change how this repository's own agents run — the `.github/`
the release publishes is the template's, and this repository is an adopter of its
own machinery. **Release** applies it as part of the button (`deploy: true`, the
default): after the publish it dispatches the update machinery, which opens the
pull request and merges it when the plan is clean.

To apply a release on your own — an older one, or after a run with `deploy: false`:

```bash
gh workflow run atomaton-update.yml --ref main
```

What runs is the same machinery an adopter's `!upgrade` runs. The manifest records
the release this tree came from, the plan is a three-way merge against that release
and the new one, and a path this repository edited and upstream changed opens a
pull request with conflict markers and stops for a person. A clean application
merges itself; a conflicted one waits. Files the release does not ship — this
repository's own `release.yml`, the customized skills — are not manifest paths and
are never touched.

The old self-deploy rebuilt `.github/` from the release (`rm -rf .github`, unzip,
copy `self/` over it). It deleted first so an upstream removal would be ordinary
rather than orphaned — and that deletion was also why every hand-written file
needed a mirror in `self/`. Three-way merging makes upstream removals ordinary too
(a shipped file the release dropped is a `delete` entry while your copy still
matches), and needs no mirror, so `self/` is gone with the rebuild that required
it.

### The token, and why the update is the only one

`GITHUB_TOKEN` cannot write `.github/workflows/**`. Not by path rule and not by
branch: the push is refused on **identity**, measured here. The update machinery
replaces those files, so the one secret this repository needs is the same one an
adopter sets:

- `ATOMATON_UPDATE_TOKEN` — a fine-grained or classic PAT with repo scope, set as
  an Actions secret. The update workflow pushes `.github/` under it, including the
  workflow files the release carries. Set it:

  ```bash
  gh secret set ATOMATON_UPDATE_TOKEN
  ```

The release button needs no secret of its own. Its pull request, its merge, and
its deploy dispatch all run on the workflow's own token, with the events that
token suppresses bridged explicitly; nothing about the release depends on a
person's identity beyond the person pressing the button.

**No agent can reach it.** `ATOMATON_UPDATE_TOKEN` is named by the update workflow
and read there as a secret; `atomaton-runner.yml` does not mention it, and `atoma`
hands a tool server only the credentials that server's own `env` declares. The
release workflow
also
refuses a bot as `triggering_actor`, because the agent runner's token carries
`actions: write` and could therefore dispatch a workflow in principle —
an agent has no route to it today (`gh` and `curl` are both refused by the shell
guard, and no MCP tool dispatches anything), but that is a denylist, and this token
can rewrite workflows.

A PAT is acceptable here and not inside Atomaton because what holds it is the
update workflow that a person's button started. The line in #353 — a pull request
may not decide its own execution environment — is not crossed: nothing an agent
produces reaches it.

### Changing something in `.github/`

What is genuinely this repository's own lives directly in `.github/`: `release.yml`,
`config.yaml`, the customized skills under `.github/atomaton/skills/`. No copy step
and no mirror: the machinery's plan never proposes touching a path the release does
not ship, so these survive every update untouched. `.github/**` is in
`merge.governed_paths`, so the pull request that edits them is one an agent cannot
merge — a person is already reading it.

Files the release also ships are ordinary customizations, held by the same rule as
any adopter's: the next update three-way merges them, and where both sides changed
a file, the pull request it opens stops for a person rather than picking a winner.
Nothing checks that every file in `.github/` is accounted for, because the plan
does not enumerate the tree — it enumerates the release, and the tree's other
files are invisible to it by construction.

## Setup (Bun)

```bash
bun install
```

Required engine in this repository is Bun `>=1.2.0`.

## Validation commands

```bash
bun run typecheck
bun run synth
bun run test
bun run test:e2e
```

What each command proves:

- `typecheck`: static type contract for scripts/workflows/shared libs.
- `synth`: workflow generation and deliverable build to `dist/.github`.
- `test`: unit-level behavior across `src/domain`, `src/shared`, `src/adapters`, `src/app`, `src/entrypoints/machinery`, and the MCP servers and hooks.
- `test:e2e`: end-to-end checks in `tests/e2e`.

Seventeen files across those two commands name a `dist/` path besides the contract test
below, and `dist/` is gitignored and so absent from a checkout. `test` and `test:e2e`
therefore each build it first through a `pre<name>` script, which is why `bun run synth`
is no longer a step you have to remember before either of them. It matters most where
nobody is watching: CI runs `synth` before `test` anyway, but an agent's run does not, and
a missing `dist/` there is 59 `ENOENT` failures an agent cannot tell from ones its own
change caused. `tests/contract/test-builds-first.test.ts` is the guard: it fails when a
`test*` script whose files name a `dist/` path has no `pre<name>` running `synth`, and it
fails on a `pre` hook that is present but does not build. The `synth` check command CI
runs stays, because it is what proves the build works before the tests read it.

### Supported platform

**Linux.** CI runs on `ubuntu-latest` and the agents run on GitHub-hosted runners,
so that is the environment these commands are expected to be green in. `typecheck`
and `synth` work anywhere; **`test` is expected to have failures on Windows.**

Exactly one file does, and its header says so:
`tests/contract/attachments-publish.test.ts`, nine tests. The cause is a path that
is POSIX by design rather than by oversight — `attachments.ts` accepts a draft under
the work tree or under `/tmp`, and `/tmp/atomaton-workspace` is the one directory of
it that survives a run — while the fixture builds its directories in `os.tmpdir()`.
`resolveDraftFiles` compares a `resolve()`d path against that literal, and on Windows
`resolve("/tmp/x")` is `C:\tmp\x` while the root it is compared to is still `/tmp`,
so nothing under it can ever match. The tool is not broken there; it is unreachable
there, which is the same thing for this purpose: `publish_draft` is reached from an
agent's run, and an agent's run is a GitHub-hosted runner.

**The exceptions are deliberate, and must stay deliberate rather than accumulate.**
A test that fails on Windows names its reason in its own comment, the way
`skill-catalog.test.ts` does for CRLF — a choice made in the opposite direction for
the same reason: it failed for anyone on Windows while passing in CI, which is the
least useful place for a check to disagree with the person it is checking. A Windows
failure **without** a reason written down is a bug in the test, not a platform
licence.

The rule that matters is not "it is green here" but that a reader can tell the two
apart. `bun run test` failing on Windows in `attachments-publish.test.ts` is the
expected result; failing anywhere else is not. See #169.

### Green does not mean it ran

`bun test <path that does not exist>` does not fail: it runs the paths it finds,
reports them, and exits 0. So a `test` script that names a directory which has
moved runs a smaller suite than it says it does, CI stays green, and nothing
compares the count against anything — nobody knows what the number should be.
`tests/contract/test-script.test.ts` is the guard: it asserts that every path the
`test` scripts name actually exists, which is the check that has an answer. If you
move test files, update the `test` script in the same change.

### Green does not mean it was tested

The same failure one layer up, and it has cost this repository twice.

`tests/e2e/` runs the real `atoma` binary against the compiled servers with a fake
`gh`, so `gh` is stubbed everywhere the code reaches it. That makes the suite's
value precise and narrow: it proves the **contract at that seam** — that a tool is
reached, that `_meta.session_ends` is honoured, that the argv carries the shape the
real CLI accepts. It cannot prove anything about GitHub, because nothing in it
holds state.

Measured, on the release that wrote the aggregation marker with
`gh issue comment ... --jq .id`:

- the **unit tests passed**, because the fake `gh` answered any argv it was asked
  about — including one the real CLI refuses;
- the **e2e suite passed**, because the only test covering `request_close_issue`
  walked the human-authored branch, and aggregation runs only on the bot-authored
  one;
- **production failed**, and a person found it.

So: a test that exists is not a test that covers the path. When you add a branch
to a tool, check that something reaches it — `grep` for the branch's own guard, and
if nothing does, say so in the issue rather than assuming a nearby test is it.

### What each layer can see

| Layer | `gh` | What it proves | What it cannot |
| --- | --- | --- | --- |
| `src/**/*.test.ts` | faked | This repository's logic | Any argv the fake accepts |
| `tests/e2e/` | faked, real `atoma` | The MCP contract, end to end through the binary | GitHub; ordering; state |
| a dogfooding run | real | All of it | Nothing — it is the only layer that sees the far end |

**There is no OSS substitute for the third row**, and it is worth writing down
before somebody spends a week on one. `gh` reaches `github.com` and a subdomain of
`ghe.com`; a GitHub-compatible forge implements REST but not the GraphQL
sub-issue link, not the `user-attachments` endpoint, and not Actions; and some
failures are in `gh` itself rather than in any server — `uploadTokenTypes` refuses
an Actions `ghs_` token client-side, so no server can make that call work.

Which leaves dogfooding as the acceptance test, and it is the one this repository
already relies on. What it needs from a change is therefore not more CI: it is that
a failure is **readable** when it arrives. See `docs/pipeline/` for how a run
reports, and prefer a message a person can act on over a green that proves nothing.

### What `synth` reads

Workflow generation reads `src/workflows/` and nothing else on the disk, which is
`src/synth-workflows.ts`'s only reason to exist. The
`github-actions-workflow-ts` CLI finds its input by globbing the whole working
directory for `*.wac.ts`, dotfiles included, with no setting that narrows it —
so a sibling agent worktree under `.claude/worktrees/` was another branch's copy
of every workflow, writing over `dist/.github/workflows/` with no error and no
warning. `tests/contract/workflow-sources.test.ts` holds the bound.

This is also why `bun run synth` works on Windows: nothing spawns `node` through
a shell any more.

## Generated-file discipline

- **`dist/` is gitignored.** There is nothing generated to commit, and nothing to
  keep in sync with `src/`. Change `src/*` and let a release build it.
- Run `bun run synth` locally whenever you want to inspect what adopters will
  receive. CI runs it on every pull request, before `test`, to prove the
  deliverable still builds.
- `dist/.github/*` is generated: never hand-edit it.
- `.github/*` is *deployed*, not generated on merge. It is a release applied by
  the update machinery, so a change under `src/` does not reach the live agents
  until the next release is applied. CI does not reject a diff that touches
  `.github/`.
- What is genuinely this repository's own lives directly in `.github/` —
  `release.yml`, `config.yaml`, the customized skills. The machinery's plan never
  touches a path the release does not ship, so hand-written files need no mirror
  and no copy step; `self/` is gone with the rebuild that needed one. Editing a
  file the release also ships is an ordinary customization: the next update
  three-way merges around it, and stops for a person where both sides changed.

## PR checklist

- Describe behavior changes from an adopter perspective.
- Include exact commands you ran and outcomes.
- Do not include `.github/atomaton`; it is upgraded deliberately, not per pull
  request. `dist/` cannot appear at all — it is gitignored.
- Avoid unrelated refactors in the same PR.
- If you changed workflow dispatch semantics, call out backward compatibility impact explicitly.
