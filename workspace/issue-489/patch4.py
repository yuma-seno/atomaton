p='src/entrypoints/tools/mcp/attachments.ts'
s=open(p).read()
start = s.index('''/**
 * Attach files to the thread: this is the tool that spends the token.''')
end = s.index('''/** The branch's current tip on the remote, or `undefined` when it does not exist yet. */''')
new = '''/**
 * Attach files to the thread: this is the tool that spends the token.
 *
 * ## One deadline for the whole call
 *
 * Every request here is given `min(REQUEST_ABORT_MS, time left)` out of one
 * `ATTACH_BUDGET_MS`, rather than each getting its own two-minute timeout. The reason is
 * in `ATTACH_BUDGET_MS`: a call that outlives the entry's `request_timeout_secs` is
 * discarded by atoma while this process keeps uploading, which leaves undeletable assets
 * and delivers no URL. So the bound is the call's, and a request that would run past it
 * is refused before it is sent rather than cut off half way through a body.
 *
 * ## Validation first, then uploads
 *
 * Every file is validated by `resolveAttachFiles` before the first byte. The loop then
 * stops at the first failure — gh's behaviour — and the error carries the URLs already
 * returned: an asset cannot be deleted, so dropping a URL that exists would leave a file
 * on GitHub that nothing knows the address of.
 *
 * Exported because both of those are contracts rather than details: a test drives the
 * deadline and the partial-failure return against a stub instead of taking gh's word for
 * them.
 */
export async function attachFile(a: z.infer<typeof ATTACH_SCHEMA>): Promise<string> {
  const token = (process.env.GH_TOKEN ?? "").trim();
  if (!token) {
    throw new Error(
      "GH_TOKEN is not in this server's environment, so nothing can be uploaded. This is the one tool here that " +
        "sends a credential; the server receives it through `tools.servers.attachments.env` in tools.yaml, which " +
        "the runner writes from the run's own token.",
    );
  }

  const deadline = Date.now() + ATTACH_BUDGET_MS;
  /** The abort for one request: the server's own bound, or what is left of the call's budget. */
  const signalFor = (what: string): AbortSignal => {
    const left = deadline - Date.now();
    if (left <= 0) {
      throw new Error(
        `the ${ATTACH_BUDGET_MS}-millisecond budget for one attach_file call ran out before ${what}, so nothing ` +
          "more was sent. Attach fewer files at once; each upload is a separate request and this bound exists so " +
          "atoma does not discard the call, which would leave undeletable assets and return no URLs.",
      );
    }
    return AbortSignal.timeout(Math.min(REQUEST_ABORT_MS, left));
  };

  const repo = resolveRepo();
  const files = resolveAttachFiles(a.files);

  const uploaded: { path: string; url: string; markdown: string; contentType: string }[] = [];
  try {
    const id = await repositoryIdFor(repo, token, PRODUCTION_HOSTS, signalFor("the repository was read"));
    for (const file of files) {
      const url = await uploadAttachment(file, id, token, PRODUCTION_HOSTS, signalFor(`'${file.name}' was uploaded`));
      uploaded.push({ path: file.path, url, markdown: markdownFor(file, url), contentType: file.contentType });
    }
  } catch (error) {
    const kept =
      uploaded.length === 0
        ? "Nothing was uploaded before it."
        : `The ${uploaded.length} uploaded before it cannot be deleted from GitHub, so their URLs are still worth ` +
          `having: ${uploaded.map((entry) => `${entry.path} -> ${entry.url}`).join("; ")}`;
    throw new Error(`${(error as Error).message} ${kept}`);
  }

  return JSON.stringify({ files: uploaded, uploaded: uploaded.length }, null, 2);
}

'''
s = s[:start] + new + s[end:]
open(p,'w').write(s)
print("ok")
