p='src/entrypoints/tools/mcp/attachments.ts'
s=open(p).read()
old = '''const PUBLISH_DRAFT_DESCRIPTION =
  "Publish documents onto an orphan branch and report the branch, the commit and a blob URL per file. " +'''
new = '''const PUBLISH_DRAFT_DESCRIPTION =
  "Publish documents onto an orphan branch and report the branch, the commit and a blob URL per file. An IMAGE " +
  `(${INLINE_IMAGE_EXTENSIONS.join(", ")}) also gets \\`raw_url\\` and \\`markdown\\`: a comment renders " +
  "`![alt](raw_url)` in place, so the picture shows the way a native attachment does — where the blob URL is a link " +
  "labelled with itself. Paste that markdown, not the blob one. A VIDEO gets neither: a raw URL is an image reference " +
  "and GitHub turns a URL into a player only for its own attachment host, so publish a video and link its blob URL. " +
  "A raw URL is not as stable as a native attachment: the same path always resolves to what the branch holds now, so " +
  "replacing the file changes what an old comment shows and rewriting the branch breaks the link. " +'''
assert s.count(old)==1
s=s.replace(old,new)
old2='''  "The branch is created as a root commit the first time and appended to by fast-forward afterwards, so a document's " +'''
assert s.count(old2)==1
open(p,'w').write(s)
print("ok")
