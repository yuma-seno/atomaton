# What routing a credential protects

`tools.secrets` is separate from the credentials a check or a deployment names on
its own entry, because that separation **is** the boundary: only these enter an
agent's own environment, so a prompt injection carried in an issue body reaches
them and no deployment credential. Collapsing them into one list would put every
credential in every destination while still looking like a boundary, which is
worse than having no boundary at all.

The declaration is in the config rather than in a repository variable because it
is the most security-relevant setting this project has. In the config it is
versioned, it shows up in a diff, and it passes
[the governance gate](../pull-requests/boundaries.md) that already covers
`.github/**`. In repository settings it would be invisible to everyone reviewing
the repository — precisely the audience for "what credentials can this reach".

What the routing then does **not** protect you from — which credentials a tool
server can reach in practice, and which are deliberately left exposed to the
shell — is
[what a tool can and cannot be protected from](#what-a-tool-can-and-cannot-be-protected-from),
below. Read it before routing a credential to a third-party server.

## What a tool can and cannot be protected from

Every tool server runs as one of **two OS users, and neither has sudo**. The
servers this project ships — the ones that hold credentials — run as
`atomaton-tools`. The `shell` server and every server a project adds run as
`atomaton-untrusted`. The only sudoers entry lets the first run a command as the
second: downward, to that user, and to nobody else.

Both users see the same work tree and the same `/tmp`, so an agent still writes
one file and every tool reads it at the same path. What the split buys is the
`/proc/<pid>/environ` channel: one user cannot read another's environment block.

That is a deliberate trade, and knowing which way it went is more useful than a
claim of full isolation.

**Three things cannot all be true.**

1. every tool sees the same filesystem
2. a credential in one tool is hidden from the shell tool
3. any third-party MCP server works

(3) means a server takes its credential the way it was written to, which is an
environment variable. (1) means the shell can write any file a trusted tool later
executes, and can read anything those tools leave in the tree. (2) is true of the
environment channel and **not** of the shared workspace: the shell cannot read a
server's environment block, but it can leave a `.git/hooks/pre-push` that `github`
runs with `GH_TOKEN`, or a configuration file a server reads. The filesystem
channels are not enumerable, so closing the one that was open is not a guarantee.

**What was chosen:** (1), (2) for the channels a uid can close, and (3) as a
documented limit rather than a guarantee.

### Protected

**The provider API key.** It is never in a tool server at all. Atoma holds it, and
makes itself unreadable to processes of the same user, so no tool can reach it.

**Credentials in the servers this project ships** — `files`, `github`, `web`,
`search`, `atomaton`, `attachments`, `delegate`. They run as `atomaton-tools`; the
shell and third-party servers run as `atomaton-untrusted` and cannot read their
environment blocks or the 0700 credentials directory. Within the trusted class,
each server still makes itself unreadable at startup and removes world-writable
directories from its own PATH, so neither reading its environment nor planting a
binary it would run works from a peer there either.

**The provider key in a delegated sub-run.** `delegate` holds the provider keys,
because a tool server receives a credential only through its `env:` block. It
hands them to the sub-run through `--credentials-file` rather than the
environment, and spawns the sub-run with every credential name removed — so the
key is never in the sub-run's environment block, and `atoma` deletes the file
before starting any tool server. The sub-run's own `files`/`shell` servers run as
`atomaton-untrusted` and hold no credential, exactly as they do in the outer run.
See [delegating a piece of work](how-it-works/delegating-a-piece-of-work.md).

### Not protected, deliberately

**The workspace is shared, and that is a code-execution channel.** The shell and
the credential-holding tools write the same files at the same paths. A command can
leave something the trusted class later runs: `.git/hooks/pre-push` executed by
`github` with `GH_TOKEN` in its environment is the known case, and repository
configuration under `.git/` reaches the same class. The uid split does not close
this, and neither does the shell guard; what limits it is that `github` holds only
`GH_TOKEN`, which the shell can already use through the github tools.

**`GH_TOKEN`, from the shell tool.** It expires when the job ends, the agent can
already use it through the github server's tools, and `actions/checkout` leaves the
same value in `.git/config` inside the work tree — so a boundary around the
server's environment would not have covered it anyway.

**A credential you route to a THIRD-PARTY server** through `tools.secrets`. That
server cannot be made to protect itself — the mechanism has to be called by the
process it protects, and nothing can call it on another program's behalf. It runs
as `atomaton-untrusted`, so assume the shell tool can read its environment. It
cannot read the credentials of the servers shipped here, which is the part the
second user bought.

**Two third-party servers share one uid.** They are both in the untrusted class,
so one can read the other's environment block if it is actively trying. Treat a
credential given to one third-party server as reachable by every other, and by the
shell.

If that matters for a particular credential, the options are to give it only to a
server shipped here, or not to route it at all and let the tool that needs it be a
step in [`checks.from_pull_request`](../pipeline/boundaries.md#a-check-that-needs-a-credential),
which runs in its own job.

**The shell guard is not a boundary either.** It is a text match over a command
line that redirects the agent to the MCP tool which does the job properly, not a
sandbox, and nothing about it is load-bearing. The three controls that are: the two
users, per-tool credential confinement below, and
[the governed-paths merge gate](../pull-requests/boundaries.md).

### What the filesystem does

Writes outside the repository **fail** rather than appearing to work. `$HOME` is
read-only, the same for both tool users, and package-manager caches are redirected
to a writable directory by the runner. An error an agent can read beats a success
it cannot trust.

### Which credentials a tool server can reach

A credential reaches the Atoma process and the servers that name it. Nothing else
— not a later workflow step, and not a server in the other class. The classes
differ in what the limit means inside them.

**A credential declared for a shipped server** is on `atomaton-tools`. The shell
and third-party servers cannot read it. Another shipped server can reach it only
by a deliberate attempt, which is what the servers' own hardening and the PATH
narrowing are for.

**A credential declared for a third-party server** is on `atomaton-untrusted`.
Treat it as reachable by the shell and by every other third-party server. That is
the cost of running a program whose implementation cannot be changed.

**None of this stops intent, only accident.** An agent reads issue text written by
anyone who can open an issue, and a prompt injection can ask it to do whatever a
tool allows. What remains is the controls that always mattered: declare only the
credentials a tool genuinely needs, and read the diff when a governed file
changes.

Which of your secrets a run is handed is settled before any of this, by
[the ref a declaration is read from](../pipeline/how-it-works.md). Four things
fail the run rather than being quietly dropped, and a fifth is only a warning;
[`tools.secrets`](reference.md#toolssecrets) lists them.

### What a shell command may print

A shell command's output is redacted before the agent, the run log, the session,
or an issue comment ever sees it. Two things are removed: text shaped like a
vendor credential (`sk-`, `ghp_`, `AKIA`, a PEM header, and similar), and the
exact values of the API key and tokens the run itself holds.

This is a net, not a control. A value *derived* from a secret — a slice of a key,
a base64 of one — is indistinguishable from ordinary text and gets through. Keep
secrets your agents do not need out of their environment, and treat this as the
thing that catches the accident rather than the thing that makes it safe.

It exists because two of the three places a run's output lands are otherwise
unprotected: GitHub Actions substitutes `***` for registered secrets in the
workflow log, and does nothing for the issue comment a run posts or for the
session JSON on the `atomaton-data` branch.

**How much it may print** is a separate limit, and it is not configurable. A long
stdout or stderr keeps its beginning and its **end**, with a marker naming how
much went from the middle and `output_truncated` set on the result. Both ends,
because command output is both kinds of text at once: a header or a command echo
worth seeing, and a failure at the bottom.

That end used to be the part that was dropped — the cap was a million bytes and it
kept the head, so a build log that overran returned its banner rather than its
error. A million bytes is also about 250k tokens, more than a context window, from
one call. See [writing a tool](tasks/write-a-tool.md) for why that matters beyond
the one run, and [what a record does not keep](../records/boundaries.md) for the
second cap the same text meets on its way into a session.

## Why the agent's own run is Linux

`runs_on` sets the machine for the jobs that run **your** commands. It does not
reach the agent's own run, which stays on Linux, because what isolates a tool
server from the others is Linux-only top to bottom: `useradd` for the two users
with no sudo, one sudoers rule for the downward drop, `setfacl` for the ACLs,
`prctl(PR_SET_DUMPABLE)`, `/proc/<pid>/environ` being the thing closed. Making that
configurable would mean an agent's shell running with every one of those
protections silently absent.

## The three facts the arrangement rests on

Each was measured on the runner rather than reasoned about, and each is why one of
the alternatives was not taken. They are stated here because the design depends on
them and nothing else says so.

**`PR_SET_DUMPABLE(0)` does not survive `execve`.** A process can make its own
`/proc/<pid>/environ` unreadable to the same user, but the flag is cleared when it
execs something else. So nothing can set it on another program's behalf — the
program has to call it in its own process. That is why the servers this project
ships call it themselves, and why a third-party server cannot be made to.

**`LD_PRELOAD` would have closed both holes and does not work here.** A shared
library's constructor runs after `exec`, inside the new process, so the flag would
stick — and `LD_PRELOAD` is itself an environment variable, so every descendant
would inherit it. It fails on `gh`, which is written in Go and statically linked: a
static binary ignores `LD_PRELOAD` entirely. The `github` server runs `gh` with
`GH_TOKEN` in its environment, so the child-process hole would have stayed open.

**A different uid closes the environ hole outright.** That is the mechanism taken,
and it is why there are two users rather than a container: the container answered
the same question with `--user 1234:0`, which is the same problem without the
container.
