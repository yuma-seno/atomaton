p='tests/contract/attachments-publish.test.ts'
s=open(p).read()
anchor = '''  test("publishing onto the remote's default branch is refused, and nothing is pushed", async () => {'''
new = '''  /**
   * The whole tool, on a real image: bytes land on the branch, and the answer carries a
   * raw URL and markdown a comment renders.
   *
   * The blob URL is asserted beside it, because the promise is that an image GAINS two
   * fields rather than trading one for the others — a caller publishing a mix of files
   * gets one shape back with the image's two extra keys on it.
   */
  test("an image is published with the raw URL and markdown a comment renders", async () => {
    const { root, remote, work } = makeGitFixture();
    try {
      // A one-pixel PNG's opening bytes: enough that the round trip is bytes rather
      // than text, which is the part a text-shaped publish would damage.
      const bytes = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
      const image = join(root, "shot.png");
      const document = join(root, "report.pdf");
      writeFileSync(image, bytes);
      writeFileSync(document, "%PDF-1.4\\n");

      const published = payloadOf(
        await callPublish(work, {
          files: [
            { path: image, target: "designs/12/shot.png" },
            { path: document, target: "designs/12/report.pdf" },
          ],
          message: "publish an image",
        }),
      );

      expect(git(root, "--git-dir", remote, "ls-tree", "-r", "--name-only", DEFAULT_DOCS_BRANCH).split("\\n").sort()).toEqual([
        "designs/12/report.pdf",
        "designs/12/shot.png",
      ]);

      const [shot, report] = published.files;
      expect(shot.blob_url).toBe(`https://github.com/owner/repo/blob/${DEFAULT_DOCS_BRANCH}/designs/12/shot.png`);
      expect(shot.raw_url).toBe(
        `https://raw.githubusercontent.com/owner/repo/${DEFAULT_DOCS_BRANCH}/designs/12/shot.png`,
      );
      expect(shot.markdown).toBe(`![shot](${shot.raw_url})`);
      expect(isSingleImage(shot.markdown, shot.raw_url)).toBe(true);

      // A document's answer is unchanged: no new keys, which is the minimal-change half
      // of the contract.
      expect(report.blob_url).toContain("/designs/12/report.pdf");
      expect(report.raw_url).toBeUndefined();
      expect(report.markdown).toBeUndefined();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);

''' + anchor
assert s.count(anchor)==1
s=s.replace(anchor,new)
open(p,'w').write(s)
print("ok")
