p='src/entrypoints/tools/defaults.yaml'
s=open(p).read()
old='''    # Every tool is served by the same value: `fetch_attachment` moves up to 25MB
    # over the network, `attach_file` up to 100MB (a video on a paid plan), and
    # `publish_draft` runs a handful of `git` commands (two `ls-remote`s, a `fetch`,
    # a `push`), which is seconds on a repository of any ordinary size -- and unlike
    # a transfer a push is safe to be cut off, because it either happened or did not
    # and the answer is in the ref.
    request_timeout_secs: 180
'''
new='''    # Every tool is served by the same value. `fetch_attachment` moves up to 25MB
    # over the network; `publish_draft` runs a handful of `git` commands (two
    # `ls-remote`s, a `fetch`, a `push`), which is seconds on a repository of any
    # ordinary size -- and unlike a transfer a push is safe to be cut off, because it
    # either happened or did not and the answer is in the ref. `attach_file` is the
    # one that needs headroom: it makes one read plus one POST per file, so it holds
    # its own ATTACH_BUDGET_MS (150 seconds) across all of them. The entry has to sit
    # above that, or atoma discards the call while the server is still uploading and
    # the assets it creates can be neither deleted nor reported.
    request_timeout_secs: 180
'''
assert s.count(old)==1
open(p,'w').write(s.replace(old,new))
print("ok")
