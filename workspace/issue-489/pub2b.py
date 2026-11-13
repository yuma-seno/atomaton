p='src/entrypoints/tools/mcp/attachments.ts'
s=open(p).read()
old = '''  "Publish documents onto an orphan branch and report the branch, the commit and a blob URL per file. An IMAGE " +
  `(${INLINE_IMAGE_EXTENSIONS.join(", ")}) also gets \\`raw_url\\` and \\`markdown\\`: a comment renders " +
  "`![alt](raw_url)` in place, so the picture shows the way a native attachment does — where the blob URL is a link " +'''
new = '''  "Publish documents onto an orphan branch and report the branch, the commit and a blob URL per file. An IMAGE " +
  `(${INLINE_IMAGE_EXTENSIONS.join(", ")}) also gets ` +
  "`raw_url` and `markdown`: a comment renders " +
  "`![alt](raw_url)` in place, so the picture shows the way a native attachment does — where the blob URL is a link " +'''
assert s.count(old)==1
open(p,'w').write(s.replace(old,new))
print("ok")
