p='src/entrypoints/tools/mcp/attachments.ts'
s=open(p).read()

old = '''export const REQUEST_ABORT_MS = 120_000;
'''
new = '''export const REQUEST_ABORT_MS = 120_000;

/**
 * How long `attach_file` may spend in total, counting every request it makes.
 *
 * The other two tools make one round trip each, so `REQUEST_ABORT_MS` is the whole of
 * their budget. `attach_file` makes one read plus one POST per file, so without a shared
 * deadline it has no bound worth the name: at `REQUEST_ABORT_MS` per request a single
 * file can take 240 seconds, which is past the entry's `request_timeout_secs` — and a
 * call atoma discards is a call whose answer nobody reads while the server keeps
 * uploading, so the assets it creates cannot be deleted and nothing ever learns their
 * URLs. That is the exact damage the all-or-nothing validation exists to prevent.
 *
 * The margin below is what makes this server's own answer arrive first. The inequality
 * `attachments-fetch.test.ts` holds for the entry — its `request_timeout_secs` above the
 * server's own bound, in seconds — is read against this number too.
 */
export const ATTACH_BUDGET_MS = 150_000;

/**
 * How many files one call may attach.
 *
 * The deadline above bounds the time; this bounds the request count inside it, so a call
 * cannot spend the budget on twenty handshakes and report that the twenty-first was out
 * of time. Ten is well past what a comment needs and keeps the worst case two requests
 * per file inside a budget a person will wait for.
 */
export const MAX_ATTACH_FILES = 10;
'''
assert s.count(old)==1
s=s.replace(old,new)

# schema cap
old = '''export const ATTACH_SCHEMA = z.object({
  files: z
    .array(ATTACH_FILE_SCHEMA)
    .min(1)
    .describe("The files to attach. Every one is validated before any is uploaded, because an upload cannot be undone."),
});'''
new = '''export const ATTACH_SCHEMA = z.object({
  files: z
    .array(ATTACH_FILE_SCHEMA)
    .min(1)
    .max(MAX_ATTACH_FILES)
    .describe(
      `The files to attach, at most ${MAX_ATTACH_FILES}. Every one is validated before any is uploaded, because an ` +
        "upload cannot be undone.",
    ),
});'''
assert s.count(old)==1
s=s.replace(old,new)
open(p,'w').write(s)
print("ok")
