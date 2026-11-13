p='tests/contract/attachments-publish.test.ts'
s=open(p).read()

s=s.replace('''import {
  blobUrlFor,
  indexInfoFor,
  resolveDraftFiles,
} from "../../src/entrypoints/tools/mcp/attachments.ts";''','''import {
  INLINE_IMAGE_EXTENSIONS,
  blobUrlFor,
  extensionOf,
  indexInfoFor,
  inlineImageFor,
  isSingleImage,
  rawUrlFor,
  resolveDraftFiles,
} from "../../src/entrypoints/tools/mcp/attachments.ts";''')

anchor = '''  test("the URL a person pastes is the blob view, which renders the document", () => {'''
new = '''  /**
   * An image gets a second URL, because a blob URL renders as a link labelled with
   * itself and a picture is supposed to be seen.
   *
   * Measured on #489's thread: `![描画テスト](https://raw.githubusercontent.com/.../attach-render-test.png)`
   * renders in place in a comment on this private repository, because GitHub proxies the
   * raw host through camo. That is the fact this rests on, and it is the reason
   * `attach_file` is not the only way a run can put a picture in a comment.
   */
  describe("an image is published so a comment renders it", () => {
    test("the raw URL is the same path on the host a comment renders from", () => {
      expect(rawUrlFor("owner/repo", "business-docs", "designs/12/shot.png")).toBe(
        "https://raw.githubusercontent.com/owner/repo/business-docs/designs/12/shot.png",
      );
    });

    test("a target with a space or a # is encoded here too, and its separators are not", () => {
      expect(rawUrlFor("owner/repo", "business-docs", "designs/12/a b.png")).toBe(
        "https://raw.githubusercontent.com/owner/repo/business-docs/designs/12/a%20b.png",
      );
      expect(rawUrlFor("owner/repo", "business-docs", "designs/12/a#b.png")).toContain("a%23b.png");
      expect(rawUrlFor("owner/repo", "business-docs", "a/b/c.png").split("/business-docs/")[1]).toBe("a/b/c.png");
    });

    test("an image gets raw_url and markdown, and the markdown is one whole image", () => {
      const image = inlineImageFor("owner/repo", "business-docs", "designs/12/shot.png");
      expect(image).not.toBeNull();
      expect(image!.raw_url).toBe("https://raw.githubusercontent.com/owner/repo/business-docs/designs/12/shot.png");
      // The alt text is the file's name without its extension.
      expect(image!.markdown).toBe(`![shot](${image!.raw_url})`);
      // Parsed back rather than trusted: escaping and parsing have to agree, or the
      // picture renders as a link to somewhere else.
      expect(isSingleImage(image!.markdown, image!.raw_url)).toBe(true);
    });

    test("every documented image extension is offered a raw URL, and nothing else is", () => {
      for (const extension of INLINE_IMAGE_EXTENSIONS) {
        expect(inlineImageFor("o/r", "b", `designs/1/a.${extension}`), extension).not.toBeNull();
        // Case is folded: a `.PNG` off a camera is still a PNG.
        expect(inlineImageFor("o/r", "b", `designs/1/a.${extension.toUpperCase()}`), extension).not.toBeNull();
      }
      // A video is the case worth naming: a raw URL is an image reference, and a player
      // only comes from GitHub's own attachment host, so this stays a blob link.
      for (const target of ["designs/1/report.pdf", "designs/1/clip.mp4", "designs/1/notes.md", "Makefile"]) {
        expect(inlineImageFor("o/r", "b", target), target).toBeNull();
      }
    });

    test("an alt text that would close the image early is escaped instead", () => {
      const image = inlineImageFor("owner/repo", "business-docs", "designs/12/a](https://evil.example/b).png");
      expect(image).not.toBeNull();
      expect(isSingleImage(image!.markdown, image!.raw_url), image!.markdown).toBe(true);
      expect(image!.markdown).not.toContain("](https://evil.example/b)(");
    });

    test("the extension is read from the last segment, and a dotfile has none", () => {
      expect(extensionOf("designs/12/shot.PNG")).toBe("png");
      expect(extensionOf("a.b/shot")).toBe("");
      expect(extensionOf(".png")).toBe("");
      expect(extensionOf("no/extension")).toBe("");
    });
  });

''' + anchor
assert s.count(anchor)==1
s=s.replace(anchor,new)
open(p,'w').write(s)
print("ok")
