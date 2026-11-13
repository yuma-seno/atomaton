old = '''tools:
  # Repository secrets the servers may reach. Separate from the ones a check or a
  # deployment names on its own entry: only these enter an agent's own environment.
  secrets: []

  # Your own tool servers, and overrides of the ones Atomaton ships.
  #
  # A name Atomaton does not ship is added. A name it does ship is overridden field by
  # field, so raising one timeout does not mean copying an argv. The shipped set is
  # listed in .github/atomaton/README.md and in docs/tools/reference.md; it is not here
  # because deleting one breaks a run, and an agent only starts the servers its own
  # `mcp_servers` names.
  servers: {}
'''

new = '''tools:
  # Repository secrets the servers may reach. Separate from the ones a check or a
  # deployment names on its own entry: only these enter an agent's own environment.
  #
  # `GH_ATTACHMENT_TOKEN` is a fine-grained PAT rather than the run's own token. The
  # upload endpoint `attach_file` posts to answers 404 for a github-actions[bot]
  # installation token -- measured on #489's thread -- and a dedicated credential
  # routed to one server is the fallback the approved design named for that answer
  # (§7). Until the repository holds a secret by this name the run logs a warning and
  # `attach_file` keeps answering 404: the routing is in place and the value is not.
  secrets:
    - GH_ATTACHMENT_TOKEN

  # Your own tool servers, and overrides of the ones Atomaton ships.
  #
  # A name Atomaton does not ship is added. A name it does ship is overridden field by
  # field, so raising one timeout does not mean copying an argv. The shipped set is
  # listed in .github/atomaton/README.md and in docs/tools/reference.md; it is not here
  # because deleting one breaks a run, and an agent only starts the servers its own
  # `mcp_servers` names.
  servers:
    # `attach_file` reads its credential from `GH_TOKEN`, so naming that here is the
    # whole of the change: no code, no release. Of the three tools on this server only
    # `attach_file` spends it -- `fetch_attachment` reads anonymously and
    # `publish_draft` uses the credential already in the checkout's `.git/config`.
    #
    # A credential declared for a shipped server lands on `atomaton-tools`, which the
    # shell and every third-party server cannot read. So this is not the "reachable
    # from the shell" cost that `docs/tools/boundaries.md` gives for a server a project
    # adds: it reaches a server that hardens itself and nothing else.
    attachments:
      env:
        GH_TOKEN: "${GH_ATTACHMENT_TOKEN}"
'''

for path in ("self/atomaton/config.yaml", ".github/atomaton/config.yaml"):
    text = open(path).read()
    assert text.count(old) == 1, path
    open(path, "w").write(text.replace(old, new))
    print("edited", path)
