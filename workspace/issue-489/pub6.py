p='tests/contract/attachments-publish.test.ts'
s=open(p).read()
anchor = '''    test("an image gets raw_url and markdown, and the markdown is one whole image", () => {'''
new = '''    test("a parenthesis in a name is encoded, so CommonMark does not end the image there", () => {
      // `encodeURIComponent` leaves `(` and `)` alone. CommonMark ends a link destination
      // at an unbalanced `)`, so an unencoded one in `a).png` closes the image early and
      // the comment shows the markdown instead of the picture. `isSingleImage` cannot see
      // this — it compares the tail against the URL it was handed — so assert on the URL.
      const stray = inlineImageFor("owner/repo", "business-docs", "designs/12/a).png")!;
      expect(stray.raw_url).not.toContain(")");
      expect(stray.markdown).not.toContain(")(");
      expect(stray.raw_url).toContain("a%29.png");
      // A balanced pair is harmless to CommonMark, and encoded anyway: one rule for the
      // path, rather than one that depends on what the rest of the name happens to be.
      expect(rawUrlFor("o/r", "b", "designs/1/a(1).png")).toContain("a%281%29.png");
      expect(blobUrlFor("o/r", "b", "designs/1/a(1).png")).toContain("a%281%29.png");
    });

''' + anchor
assert s.count(anchor)==1
s=s.replace(anchor,new)
open(p,'w').write(s)
print("ok")
