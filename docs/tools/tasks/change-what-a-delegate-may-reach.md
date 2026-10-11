# Change what a delegate may reach

`delegate` and `delegate_readonly` are one program, `mcp/delegate.ts`, started with
a different roster key. What a sub-run may reach is the `servers:` block in the
tools file of the folder it is started from, under
`.github/atomaton/delegates/<name>/`:

```yaml
# .github/atomaton/delegates/delegate/tools.yaml
watch: {}
servers:
  files:
    command: bun
    args:
      - run
      - "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton-runtime/tools/mcp/files.ts"
    env: {}
    hooks: {}
  shell:
    command: bun
    args:
      - run
      - "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton-runtime/tools/mcp/shell.ts"
    env: {}
    request_timeout_secs: 3600
    hooks: {}
```

**This file is yours, and an upgrade will not fight you for it.** It used to live
under `.github/atomaton-runtime/`, which is a build output an upgrade replaces
wholesale — so a reach you narrowed was one the next release undid, silently.

**The list and the definition have to agree.** Atoma resolves the definition's
`mcp_servers` against the tools file the sub-run is handed, and a name in one that
is not in the other is a server that does not start. So changing the `servers:`
block means changing the matching `mcp_servers` in the `agent.md` beside it, in the
same change — and `mcp/delegate.ts` refuses to start when they disagree, naming both
files rather than leaving it to be discovered mid-run.

**A sub-run's servers must be a subset of its caller's.** That is why there are two
roster keys rather than one: the reviewer holds `files_readonly`, and a delegate that
could write would put a writing server one tool call away from an agent whose whole
tool set says it cannot change anything. If you add a third key, give it the servers
of the agents that will name it and no more.

**Never add `github`.** A delegate that can open an issue or a pull request is a
second agent, and the reason this tool exists is that it is not one. `atomaton` is
the same: a delegate that could dispatch is a delegate that can start work nobody
asked for. `delegate` itself is the third: a sub-run that can delegate again is a
recursion with no bound but the time limit.

**Never add `GH_TOKEN` to the entry's `env:`.** The sub-run has no `github` server,
so it has nothing to authenticate with it, and a token it cannot use is a token
that can only leak. The provider keys are there because the sub-run calls a model;
see [delegating a piece of work](../how-it-works/delegating-a-piece-of-work.md) for
how they reach it without entering its environment.

**Do not add `ATOMA_PROVIDER` either**, and for the opposite reason: it is not a
credential, so it is inherited rather than stripped, and writing it in `env:` would
expand it against the credentials — where it is not — to an empty string and
overwrite the inherited value.

To change how long a sub-run may take, see
[let a tool run longer than a minute](let-a-tool-run-longer-than-a-minute.md): the
`request_timeout_secs` beside the entry has to stay above the sub-run's own limit,
so the sub-run stops itself and reports why rather than being killed mid-inference.
