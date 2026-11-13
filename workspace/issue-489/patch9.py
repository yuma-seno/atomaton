p='tests/contract/attachments-attach.test.ts'
s=open(p).read()

anchor = '''describe("the interface the agents are handed", () => {'''
new = '''/**
 * The call's own bound, and what survives a failure inside it.
 *
 * The inequality this pins is the one `attachments-fetch.test.ts` already holds for the
 * two one-round-trip tools, applied to the tool that makes N+1 requests: atoma discards a
 * `tools/call` past the entry's `request_timeout_secs`, and a discarded call is one whose
 * answer nobody reads while the server keeps uploading — so the assets are created,
 * cannot be deleted, and their URLs are never delivered. A per-request timeout is not
 * enough to prevent that; the budget has to be the call's.
 */
describe("attach_file finishes before atoma gives up on it", () => {
  const defaults = Bun.YAML.parse(readFileSync("src/entrypoints/tools/defaults.yaml", "utf8")) as {
    servers?: Record<string, { request_timeout_secs?: number }>;
  };

  test("one call's budget sits below the entry's timeout, so the server answers first", () => {
    const allowed = defaults.servers?.attachments?.request_timeout_secs;
    expect(allowed, "the attachments entry declares no request_timeout_secs, so atoma's 60-second default applies").toBeDefined();
    expect(
      ATTACH_BUDGET_MS,
      "the call's own budget must be smaller than the timeout atoma discards it at",
    ).toBeLessThan(allowed! * 1000);
    // And below the sum of one read plus one upload at the per-request bound, which is
    // the number that made a per-request timeout insufficient: 2 x REQUEST_ABORT_MS.
    expect(ATTACH_BUDGET_MS, "a per-request bound is not a call bound").toBeLessThan(2 * REQUEST_ABORT_MS);
  });

  test("a call may not name more files than the budget can carry", () => {
    expect(MAX_ATTACH_FILES).toBeGreaterThan(0);
    expect(() =>
      ATTACH_SCHEMA.parse({ files: Array.from({ length: MAX_ATTACH_FILES + 1 }, () => ({ path: "/tmp/a.png" })) }),
    ).toThrow();
  });

  test("a budget that is already spent refuses before a request is made, and says so", async () => {
    const dir = scratch();
    const [file] = resolveAttachFiles([{ path: fileOf(dir, "shot.png", 32) }]);
    // A stub that must not be reached: the deadline is checked before the first request.
    let reached = 0;
    const hosts = { api: "http://127.0.0.1:1", uploads: "http://127.0.0.1:1" };
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      reached += 1;
      throw new Error("the stub was reached");
    }) as unknown as typeof fetch;
    try {
      await expect(
        attachFile({ files: [{ path: file!.path }] }, { hosts, budgetMs: 0 }),
      ).rejects.toThrow(/budget for one attach_file call ran out/);
    } finally {
      globalThis.fetch = realFetch;
    }
    expect(reached, "the deadline has to fire before the request, not after it").toBe(0);
  }, 30_000);

  /**
   * A failure part-way through keeps the URLs that already exist.
   *
   * An upload cannot be deleted, so a URL that was created and then dropped is a file on
   * GitHub nothing knows the address of. The refusal therefore carries them, and the
   * test drives it: the first file uploads, the second is answered 422.
   */
  test("a failure part-way into the loop still reports the URLs already made", async () => {
    const dir = scratch();
    const first = fileOf(dir, "one.png", 64);
    const second = fileOf(dir, "two.png", 64);

    let uploads = 0;
    const server = Bun.serve({
      port: 0,
      hostname: "127.0.0.1",
      fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === "/repos/owner/repo") return Response.json({ id: 7 });
        uploads += 1;
        if (uploads === 1) return Response.json({ url: "https://github.com/user-attachments/assets/one" });
        return new Response("no", { status: 422 });
      },
    });
    process.env.GH_TOKEN = "t0ken";
    process.env.GITHUB_REPOSITORY = "owner/repo";
    try {
      const failure = await attachFile(
        { files: [{ path: first }, { path: second }] },
        { hosts: { api: `http://127.0.0.1:${server.port}`, uploads: `http://127.0.0.1:${server.port}` } },
      ).then(
        () => null,
        (error: Error) => error,
      );
      expect(failure, "the second upload was refused, so the call must fail").not.toBeNull();
      expect(failure!.message).toContain("422");
      expect(failure!.message, "the URL that exists is the one thing a caller cannot recover").toContain(
        "https://github.com/user-attachments/assets/one",
      );
      expect(failure!.message).toContain("one.png");
    } finally {
      server.stop(true);
    }
  }, 30_000);
});

''' + anchor
assert s.count(anchor)==1
s=s.replace(anchor,new)
open(p,'w').write(s)
print("ok")
