p='src/entrypoints/tools/mcp/attachments.ts'
s=open(p).read()

# --- (a) hosts docstring: two hosts, both authenticated ---
old = '''/**
 * The two hosts `attach_file` talks to, kept as one value so the pairing cannot drift.
 *
 * These are arguments only so a contract test can point them at a local server; a run
 * always gets the constants. The upload host is `uploads.github.com` — the one endpoint
 * gh's own `--attach` posts to — and it is never derived from a URL a caller supplies.
 */'''
new = '''/**
 * The two hosts `attach_file` talks to, kept as one value so the pairing cannot drift.
 *
 * Both receive the token: `api.github.com` for the one-off read of the repository's
 * numeric id, and `uploads.github.com` for the upload itself — the endpoint gh's own
 * `--attach` posts to. Neither is derived from a URL a caller supplies.
 *
 * These are arguments only so a contract test can point them at a local server; a run
 * always gets the constants.
 */'''
assert s.count(old)==1
s=s.replace(old,new)

# --- (b) headers docstring ---
old = '''/** The headers both calls carry. The token is the run's, and this is the only tool here that sends it. */'''
new = '''/** The headers both calls carry, to both hosts. The token is the run's, and this is the only tool here that sends it. */'''
assert s.count(old)==1
s=s.replace(old,new)

open(p,'w').write(s)
print("ok")
