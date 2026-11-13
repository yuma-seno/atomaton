# The single sentence that was wrong, and the replacement that names both hosts and
# which of them this change added.
wrong_sub = ("it is the one tool here that sends the run's GitHub token, to `uploads.github.com` only.")
right_sub = ("it is the one tool here that sends the run's GitHub token: to `api.github.com` for the repository's "
             "numeric id, and to `uploads.github.com` for the upload itself, which is the one host this change added.")

p='src/entrypoints/tools/mcp/attachments.ts'
s=open(p).read()
old = '''  "Upload files to GitHub's attachment store and return a URL and pasteable markdown for each, so an image, a video " +'''
assert s.count(old)==1
# replace the tail sentence of ATTACH_DESCRIPTION
old_tail = '''  "a failure part-way returns the URLs already made. Sends the run's GitHub token to uploads.github.com, which is " +
  "the only host this server sends a credential to.";'''
new_tail = '''  "a failure part-way returns the URLs already made, so put the files that matter first. Sends the run's GitHub " +
  "token to two hosts: api.github.com, for the repository's numeric id, and uploads.github.com, where the bytes go. " +
  `The whole call shares one ${ATTACH_BUDGET_MS}-millisecond budget and takes at most ${MAX_ATTACH_FILES} files, ` +
  "because a call atoma discards would leave assets that cannot be deleted and return no URL.";'''
assert s.count(old_tail)==1
s=s.replace(old_tail,new_tail)
open(p,'w').write(s)

for p in ('src/entrypoints/tools/defaults.yaml','docs/tools/reference.md','src/content/README.md'):
    s=open(p).read()
    assert s.count(wrong_sub)==1, p
    open(p,'w').write(s.replace(wrong_sub,right_sub))

# routing-a-credential.md: the paragraph the reviewer named
p='docs/tools/how-it-works/routing-a-credential.md'
s=open(p).read()
old='''Declaring it and spending it are two decisions. Within `attachments`, only
`attach_file` sends the token — to `uploads.github.com`, the endpoint GitHub CLI's
own `--attach` posts to — while `fetch_attachment` reads anonymously and
`publish_draft` uses the credential already in the checkout's `.git/config`. Each
tool's description says which it is.
'''
new='''Declaring it and spending it are two decisions. Within `attachments`, only
`attach_file` sends the token, and it sends it to two hosts: `api.github.com`, to
read the repository's numeric id, and `uploads.github.com`, where the bytes go —
the endpoint GitHub CLI's own `--attach` posts to. The other two tools there are
`fetch_attachment`, which reads anonymously, and `publish_draft`, which uses the
credential already in the checkout's `.git/config`. Each tool's description says
which it is.
'''
assert s.count(old)==1
open(p,'w').write(s.replace(old,new))

# defaults.yaml comment paragraph
p='src/entrypoints/tools/defaults.yaml'
s=open(p).read()
old='''  # `GH_TOKEN` is declared below and exactly ONE tool sends it: `attach_file`, to
  # `uploads.github.com`, which is the endpoint GitHub CLI's own `--attach` posts
  # to. `fetch_attachment` reads anonymously and `publish_draft` uses the
  # credential already in `.git/config`, so the tools of one server differ in
  # whether they spend it and each description says which it is.
'''
new='''  # `GH_TOKEN` is declared below and exactly ONE tool sends it: `attach_file`, and
  # it sends it to two hosts -- `api.github.com` for the repository's numeric id,
  # and `uploads.github.com` for the bytes, which is the endpoint GitHub CLI's own
  # `--attach` posts to and the only host this change added. `fetch_attachment`
  # reads anonymously and `publish_draft` uses the credential already in
  # `.git/config`, so the tools of one server differ in whether they spend it and
  # each description says which it is.
'''
assert s.count(old)==1
open(p,'w').write(s.replace(old,new))

# module docstring in attachments.ts
p='src/entrypoints/tools/mcp/attachments.ts'
s=open(p).read()
old=''' * It POSTs the bytes to `uploads.github.com`, the single endpoint gh's own `--attach`
 * uses, and that request is authenticated: `GH_TOKEN` is read from this process's
 * environment — which the runner routes to this server alone — and sent to that one
 * host. The other two deliberately send nothing, so the boundary comment in
 * `defaults.yaml` names which tool spends it.
'''
new=''' * It sends the token to two hosts, and both are names rather than anything derived
 * from a caller's argument: `api.github.com`, for the one read of the repository's
 * numeric id the upload requires, and `uploads.github.com`, where the bytes go — the
 * single endpoint gh's own `--attach` uses. `uploads.github.com` is the host this
 * change added. The other two tools deliberately send nothing, so the boundary
 * comment in `defaults.yaml` names which one spends it and where.
'''
assert s.count(old)==1
open(p,'w').write(s.replace(old,new))
print("ok")
