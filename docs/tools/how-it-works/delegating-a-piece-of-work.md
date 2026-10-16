# Delegating a piece of work

`delegate` does one small piece of work in a separate run of `atoma` and
returns what it found. It is for the work whose transcript you do not want in your
own session: reading a handful of files to find where a symbol is defined, searching
a tree for a call site, running one command to answer a question.

## Why it exists

A tool result is not read once and discarded. It joins the session and is resent on
every later inference in that session, across runs — see
[how much of a tool's result may enter the session](../reference.md). So an agent
that reads six files to answer one question pays for those six files for the rest
of the issue's life, and the answer is one line of it.

A delegate does the reading in a run whose transcript is thrown away, and hands
back one paragraph. The cost is one extra inference loop; the saving is everything
the delegate read.

## What it is not

It is not a second agent and it is not a sub-issue. There is no session, nothing
resumes it, and it cannot hand work on. It runs once, returns one report, and ends.

It cannot reach GitHub. The sub-run is given `files` and `shell` and nothing else,
so there is no `github` tool in it: no issues, no pull requests, no comments, no
merge. It cannot dispatch anything either — no `atomaton` tool — and it cannot
delegate again, because it has no `delegate` tool of its own.

## The two entries

| Server | Sub-run gets | Offers |
| --- | --- | --- |
| `delegate` | `files`, `shell` | `delegate`, `delegate_large` |
| `delegate_readonly` | `files_readonly` | `delegate_readonly`, `delegate_readonly_large` |

Each FOLDER the roster names becomes one TOOL, named after the folder. That is how
the two tiers are chosen between: they are two tools, not two servers.

They are one program, `mcp/delegate.ts`, started with a different roster key. The
pair exists because **a sub-run's servers must be a subset of its caller's**. The
reviewer holds `files_readonly` and nothing that writes; if it could delegate to a
sub-run holding `files`, the read-only promise would be one tool call away from
being false. So the reviewer is given `delegate_readonly`, and the rule is visible
in `tools/defaults.yaml` rather than enforced by a check at run time.

`delegate_readonly`'s sub-run has no `shell` either, and that is the same rule
rather than an omission: a shell is a way to write.

## Where the delegate's own files live

Under `.github/atomaton/`, which is **yours** — one folder per delegate, holding
`agent.md` and `tools.yaml`, with a roster beside them that says which server offers
which:

```
.github/atomaton/delegates/
  delegates.yaml            which server offers which folders
  delegate/
    agent.md                the model, and the role prompt
    tools.yaml              the servers this sub-run is handed
  delegate_large/…
  delegate_readonly/…
  delegate_readonly_large/…
```

A folder is the unit because **its name is the tool name**: `delegate/tools.yaml`
cannot disagree with `delegate/agent.md` about which delegate they describe, where a
`.tools.yaml` beside a `.md` had to be derived from it and could be derived wrongly.

They are **not** under `.github/atomaton-runtime/`, which is a build output an
upgrade replaces wholesale. A `model:` line is the thing a project most wants to
change about a delegate, and it used to be in a file the next release overwrote.

And they are not under `agent-definitions/` either. That is the namespace a PERSON
dispatches from: a `.md` file there is a `/<name>` a person can type on an issue, an
entry in every agent's `{{COLLEAGUES_LIST}}`, a name `extract_directive.ts` accepts as
a handoff, and a valid value for `agents.on_config_finding`. A delegate is none of
those — it is started by `mcp/delegate.ts` and by nothing else.

The two files have to agree, because atoma resolves the definition's `mcp_servers`
against the tools file the sub-run is handed, and a name in one that is not in the
other is a server that does not start. `mcp/delegate.ts` checks this at startup and
names both files when they disagree.

The sub-run's tools file is its own, and is **not** selected out of
`tools/defaults.yaml`. That file is the servers every agent run starts with, hooks
and all, and a sub-run that inherited them would inherit the next routing rule
added there — `shell_guard` sends `gh` to the `github` server's tools, which a delegate does not
have, so the first such rule would break every delegate.

## The credentials

This is the part worth reading before changing anything here.

The `delegate` server holds the provider keys, because a tool server receives a
credential only through its `env:` block in `tools/defaults.yaml`. It hardens
itself at startup for that reason — see
[what a tool can and cannot be protected from](../boundaries.md).

The sub-run is handed the keys through `--credentials-file`, **not** through the
environment, and the environment it is spawned with has every credential name
removed. That is the whole point: `atoma` reads the file and deletes it before
starting any tool server, so the key is never in the sub-run's environment block
and `/proc/<pid>/environ` has no window in which to read it. Inheriting the
environment instead would put the key there for the sub-run's whole lifetime.

`GH_TOKEN` is deliberately not written to the file. The sub-run has no `github`
server, so it has nothing to authenticate with it, and a token it cannot use is a
token that can only leak.

`ATOMA_PROVIDER` is deliberately not declared in the server's `env:` either, and
for the opposite reason: it is not a credential, so it is inherited rather than
stripped, and writing it there would expand it against the credentials — where it
is not — to an empty string and overwrite the inherited value.

## The time budget

The sub-run has a ten-minute limit, and the number is a budget rather than a
preference. The outer run is blocked for the whole of it, and its own time limit is
checked only at iteration boundaries — so a sub-run that runs long is time the
outer run cannot get back. Ten minutes is enough for reading and one command, and
small enough that an outer run with a normal budget survives it.

The server's own `request_timeout_secs` is 660, above the sub-run's limit, so the
sub-run stops itself and reports why rather than being killed mid-inference with
nothing to say.

## Changing it

- **The model a delegate runs on** — `provider:` and `model:` in
  `delegates/<name>/agent.md`. This is the field a project most wants to change, and
  it is why the folder is under `.github/atomaton/` rather than under the runtime
  root. `extra_headers:` and `extra_body:` are the same file and are passed through
  to the provider untouched — see [every setting in an agent
  definition](../../agents/reference.md), which is the same frontmatter.
- **The tier a caller is told about** — nothing. It is read from the `model:` line:
  a folder whose model ends in `/free` is described as free, with a shared limit, and
  the caller is told to try it and read a refusal as an answer. Point the folder at
  another model and the description moves with it, without an agent definition being
  edited.
- **Which servers a sub-run gets** — the `servers:` block in
  `delegates/<name>/tools.yaml`, and the matching `mcp_servers` in the `agent.md`
  beside it. The two have to agree, and `mcp/delegate.ts` refuses to start when they
  do not.
- **Which delegates a server offers, and what they are called** — `delegates.yaml`.
  The folder name is the tool name, so adding a delegate is a folder and a line.
- **What the delegate is told it is for** — the role prompt in
  `delegates/<name>/agent.md`.
- **The time limit** — `SUB_RUN_MAX_RUNTIME_SECS` in `mcp/delegate.ts`, and the
  `request_timeout_secs` beside the entry in `tools/defaults.yaml`.

## Setting the model

One provider is not another's. Which provider you can reach is decided by the key
you hold, and which model is worth paying for is your call rather than this
template's. What ships is OrcaRouter because that is what the template was built
against, and both tiers are one line each to move:

```yaml
# .github/atomaton/delegates/delegate/agent.md
provider: orcarouter          # or `openai`, `anthropic`, `openrouter` — the
model: orcarouter/free        # credential you hold decides
```

[Every setting in an agent definition](../../agents/reference.md) lists the
providers, what each one's credential is named, and the two extra keys
(`extra_headers`, `extra_body`) that go straight to the request. Nothing about the
delegate changes any of it: the frontmatter is the same format an agent under
`agent-definitions/` uses, read by the same core.
