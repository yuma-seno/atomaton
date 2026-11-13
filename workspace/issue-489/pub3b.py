old = "`publish_draft` puts drafts on a branch and returns a blob URL for each."
new = ("`publish_draft` puts drafts on a branch and returns a blob URL for each — plus, for an image, a raw URL and the "
       "`![alt](raw_url)` markdown that a comment renders in place.")
for p in ('docs/tools/reference.md','src/content/README.md'):
    s=open(p).read()
    assert s.count(old)==1, p
    open(p,'w').write(s.replace(old,new))
    print("edited", p)
