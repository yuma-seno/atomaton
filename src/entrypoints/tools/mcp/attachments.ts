#!/usr/bin/env bun
/**
 * attachments.ts — the two things about files a run cannot do through the shell:
 * read a document a person attached to an issue (`fetch_attachment`), and put a
 * document where a person can open it (`publish_draft`, onto an orphan branch).
 *
 * ## Why a server, and not the shell
 *
 * Both are refused there. `curl` and `wget` are routed away from the shell by
 * `shell_guard`, so a GET has no way to run at all — measured, the command is
 * refused before a request is built. Every mutating `git` subcommand is refused
 * the same way, and `commit_and_push` names a branch from the work-branch
 * convention and can build no other.
 *
 * ## `fetch_attachment` writes the bytes instead of the conversation
 *
 * Handing a document back through the conversation does not work: measured, one
 * pasted that way arrives as 8,000 characters of mojibake and is cut off. So the
 * body is written under `/tmp` and the answer is a path, which the run can then
 * open, edit and publish.
 *
 * It sends no credential. A public asset answers an anonymous GET with the bytes,
 * and there a token accepted and a token ignored are the same response — so there
 * is no observation the credential buys here, and one fewer place it goes. What
 * that costs is in the refusal a `404` produces: "not there" and "not visible to
 * this run" are the same answer. The redirect GitHub answers with is followed
 * inside the same call, because the signed URL behind it expires in five minutes
 * and a `Location` handed back would be dead by the second call.
 *
 * ## Why an orphan branch is published from here too
 *
 * The other half of the same question — where a document that is not a
 * deliverable lives — is an orphan branch, and it is reached from here because
 * the shell cannot do it either. What makes it a *credential* question is that
 * this is a tool server: it runs `git` in its own process, and the checkout it
 * inherits already carries what `actions/checkout` wrote into `.git/config`. No
 * token is read here and none is passed — the point is that the command runs
 * where the run's own credential is, rather than in a shell that has none.
 */
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, resolve, sep } from "node:path";
import { buildMcpTools, defineMcpTool, serveMcpServer, z } from "../../../adapters/mcp/mcp-tool.ts";
import { getDocsBranch } from "../../../adapters/runner/config.ts";
import { gitRun, gitRunWith } from "../../../adapters/github/gh.ts";
import {
  checkedOutBranch,
  readOriginBranch,
  readRemoteDefaultBranch,
} from "../../../adapters/github/branch-reads.ts";
import { hardenCredentialHolder } from "../lib/harden.ts";

/** The environment that puts one `git` command in this call's index rather than the run's. */
function indexEnv(indexPath: string): { env: Record<string, string> } {
  return { env: { GIT_INDEX_FILE: indexPath } };
}

function log(message: string): void {
  console.error(`[atomaton-attachments] ${message}`);
}

// Same OS user as every other tool server, including the one that runs arbitrary
// commands -- so this process makes itself unreadable to its peers and drops
// writable directories from its PATH. See `../lib/harden.ts`.
hardenCredentialHolder(log);

/** The documented ceiling for Office, PDF and zip attachments; images and video are lower. */
export const UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024;

/**
 * The largest draft this server will hand to `git`.
 *
 * Far above the 25MB attachment ceiling, so this bound is about not being handed an
 * accident — a log, an image dump — rather than about that limit.
 */
const MAX_READ_BYTES = 128 * 1024 * 1024;

/**
 * How long this server waits on the network before giving up.
 *
 * Exported because it is only useful in relation to something outside this file:
 * `defaults.yaml` must allow a longer `tools/call` than this, or atoma discards the
 * call first and the server's own answer arrives after nobody is waiting for it.
 * `attachments-fetch.test.ts` reads both and holds them in that order.
 */
export const REQUEST_ABORT_MS = 120_000;

/**
 * The one directory outside the checkout a run may write to.
 *
 * `/tmp/atomaton-workspace` is the part of it that survives into the next run on an
 * issue, and nothing else here survives at all — which is why a fetched attachment is
 * written under this and not beside the code.
 */
const TMP_ROOT = "/tmp";

/** Where a fetched attachment lands when the caller names no directory. */
export const ATTACHMENT_DIR = "/tmp/atomaton-workspace/attachments";

/** The blob mode every published draft gets: an ordinary, non-executable file. */
const DRAFT_FILE_MODE = "100644";

/**
 * The commit identity for a published draft, as `git -c` pairs.
 *
 * Passed per command rather than read from configuration, because the runner's own
 * `git config user.name` is a shell step that may or may not have run by the time a
 * server is started — and a commit that cannot be created for want of an identity is
 * work silently not published. The value is the one that step writes, so a run that
 * built the commit on the command line and one that did not are the same commit
 * either way.
 */
function commitIdentity(): string[] {
  const agent = (process.env.AGENT ?? "").trim() || "engineer";
  const name = `atomaton-${agent}`;
  return ["-c", `user.name=${name}`, "-c", `user.email=${name}@users.noreply.github.com`];
}

/**
 * A path a caller wants on the branch, resolved against a local original.
 *
 * `path` and `target` are separate because they are different questions: where the
 * draft is on disk (which the run's own tools can reach) and where it goes on the
 * branch (which is a URL a person reads).
 */
const DRAFT_FILE_SCHEMA = z.object({
  path: z
    .string()
    .min(1)
    .describe("A local draft file: a path inside this run's checkout, or an absolute one under /tmp."),
  target: z
    .string()
    .min(1)
    .describe("Where it goes on the branch, such as `designs/12/overview.md`. A relative path; no leading slash and no `..`."),
});

export const PUBLISH_DRAFT_SCHEMA = z.object({
  files: z
    .array(DRAFT_FILE_SCHEMA)
    .min(1)
    .describe("The drafts to publish, each as a local `path` and the `target` it takes on the branch."),
  message: z.string().min(1).describe("Commit message for this publication."),
});

export const FETCH_ATTACHMENT_SCHEMA = z.object({
  url: z
    .string()
    .min(1)
    .describe(
      "The attachment URL to fetch: `https://github.com/user-attachments/files/<id>/<name>`, or a " +
        "`private-user-images.githubusercontent.com` URL. Every other host is refused.",
    ),
  filename: z
    .string()
    .min(1)
    .optional()
    .describe(
      "What to save it as, such as `ペダル.docx`. Defaults to the URL's last segment, which is often a generic " +
        "`default.docx` rather than the name the comment shows. A file name, not a path.",
    ),
  dir: z
    .string()
    .min(1)
    .optional()
    .describe(
      `The directory to save into. Defaults to \`${ATTACHMENT_DIR}\`, which survives into the next run on this ` +
        `issue; an absolute path under ${TMP_ROOT} only.`,
    ),
});

/**
 * Where a published draft is read as a document: the blob URL a person pastes.
 *
 * Deliberately not the raw URL. A raw URL is for a program to fetch; what goes into
 * an issue comment is a link somebody clicks, and the blob view renders the markdown.
 * Measured on #12's thread against a real file on `main`.
 *
 * The path is percent-encoded per segment. A target is allowed to contain a space and
 * a `#`, both of which end the path in a URL — an unencoded `#` would make the link
 * open the branch at a fragment that does not exist, and a space is not even a legal
 * URL character. `encodeURIComponent` per segment rather than once over the whole
 * path, so the `/` separators survive.
 */
export function blobUrlFor(repo: string, branch: string, target: string): string {
  const path = target
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://github.com/${repo}/blob/${encodeURIComponent(branch)}/${path}`;
}

/**
 * What `git update-index --index-info` is fed, in the `-z` form.
 *
 * Exported because it is the one string whose exact shape decides what lands on the
 * branch: a tab between the object id and the path, a NUL after each record. The `-z`
 * form is what makes a path with a space survive — the newline form would split it.
 */
export function indexInfoFor(entries: { blob: string; target: string }[]): string {
  return entries.map((entry) => `${DRAFT_FILE_MODE} blob ${entry.blob}\t${entry.target}\0`).join("");
}

/** What one published draft resolves to before anything is pushed. */
export interface DraftFile {
  /** Absolute path of the local original, checked for readability. */
  source: string;
  /** Path on the branch, checked for the shape git accepts. */
  target: string;
}

/**
 * Resolve the drafts a caller named, or say which one is unusable.
 *
 * Every refusal below is a hole that would otherwise be found after a push: a path
 * resolved against the wrong directory, a target that git will not accept, and two
 * drafts writing the same path — which would publish one file and report two.
 *
 * A relative `path` is resolved against `process.cwd()`, which is the work tree for
 * the same reason it is in `mcp/files.ts`: atoma starts every server as a child of the
 * run and inherits the directory the run was started in, which the runner starts at
 * the workspace root. A server started anywhere else resolves relative paths there,
 * and the refusal below says which directory that was rather than leaving the caller
 * to guess.
 */
export function resolveDraftFiles(files: { path: string; target: string }[]): DraftFile[] {
  const base = resolve(process.cwd());
  // The work tree and /tmp — the pinned interface: a draft is either a file in the
  // checkout or an absolute path under /tmp, which is where a conversion step puts its
  // output. `/tmp/atomaton-workspace` is the one subdirectory of it that survives a run.
  const roots = [base, TMP_ROOT];
  const seen = new Set<string>();
  const out: DraftFile[] = [];

  for (const file of files) {
    const source = isAbsolute(file.path) ? resolve(file.path) : resolve(base, file.path);
    if (!roots.some((root) => source === root || source.startsWith(root + sep))) {
      throw new Error(
        `'${file.path}' resolves to '${source}', which is outside the places a draft may be read from ` +
          `(${roots.join(", ")}). Pass an absolute path, or one relative to ${base}.`,
      );
    }
    let size: number;
    try {
      const stats = statSync(source);
      if (!stats.isFile()) {
        throw new Error(`'${file.path}' is not a file (${source}); a draft is one file per target.`);
      }
      size = stats.size;
    } catch (error) {
      if (error instanceof Error && error.message.includes("is not a file")) throw error;
      throw new Error(`could not read '${file.path}': no such file at ${source}`);
    }
    if (size > MAX_READ_BYTES) {
      throw new Error(`${source} is ${size} bytes, past the ${MAX_READ_BYTES}-byte ceiling this tool publishes.`);
    }
    const target = normalizeTarget(file.target);
    if (seen.has(target)) {
      throw new Error(`two drafts target '${target}'; one would overwrite the other and the result would report both.`);
    }
    seen.add(target);
    out.push({ source, target });
  }
  return out;
}

/**
 * The target as git will accept it, or the reason it will not.
 *
 * Checked here rather than left to `git update-index`, because git's answer to a bad
 * path is a warning on stderr and exit code 0 in one case (`Ignoring path /etc/x`):
 * the push would then succeed with the file simply absent, and the tool would report
 * a URL for a document that is not on the branch.
 */
function normalizeTarget(target: string): string {
  const trimmed = target.replace(/^\/+/, "");
  if (!trimmed) throw new Error("a draft's target cannot be empty.");
  if (isAbsolute(target) || target.startsWith("/")) {
    throw new Error(`target '${target}' must be relative to the branch, not absolute.`);
  }
  if (trimmed.startsWith("-")) {
    throw new Error(`target '${target}' starts with '-', which the index listing would read as an argument.`);
  }
  if (trimmed.includes("\\")) {
    throw new Error(`target '${target}' contains a backslash; branch paths are separated by '/'.`);
  }
  if (/[\t\n\r\0]/.test(trimmed)) {
    throw new Error(`target '${target}' contains a tab, newline or NUL, which the index listing cannot express.`);
  }
  const parts = trimmed.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) {
    throw new Error(`target '${target}' has an empty, '.' or '..' path segment, which git will not accept.`);
  }
  if (parts.some((part) => part.toLowerCase() === ".git")) {
    throw new Error(`target '${target}' is under .git, which git refuses to write a blob into.`);
  }
  return trimmed;
}

/**
 * Build the tree this call pushes, in an index of its own.
 *
 * `GIT_INDEX_FILE` is set for these commands and never on `process.env`: the run's own
 * checkout has an index, and a tool call that left the variable set would silently
 * redirect the next `git` in the same process — a `commit_and_push`, say — at a tree
 * holding nothing but drafts. Each helper below is one step of the same shape: read a
 * tree into the temporary index, change one thing, write it back out.
 */
function gitInIndex(indexPath: string, args: string[]): ReturnType<typeof gitRunWith> {
  return gitRunWith(indexEnv(indexPath), ...args);
}

function gitInIndexStdin(indexPath: string, args: string[], input: string): ReturnType<typeof gitRunWith> {
  return gitRunWith({ ...indexEnv(indexPath), stdin: input }, ...args);
}

/** The repository whose blob URLs a published draft is reported against, as `owner/name`. */
function resolveRepo(): string {
  const fromEnv = (process.env.GITHUB_REPOSITORY ?? "").trim();
  if (fromEnv) return fromEnv;
  // Same fallback `mcp/github.ts` uses: the checkout's own remote.
  const { code, stdout } = gitRun("remote", "get-url", "origin");
  if (code === 0 && stdout) {
    const match = /github\.com[/:](.+\/.+?)(?:\.git)?$/.exec(stdout.trim());
    if (match) return match[1]!;
  }
  throw new Error(
    "GITHUB_REPOSITORY is unset and no GitHub remote could be read, so there is no repository to report a published draft against.",
  );
}

/**
 * The hosts `fetch_attachment` reads.
 *
 * It is not a token guard — this tool sends no credential. It keeps a tool whose
 * whole job is to write a file under `/tmp` from being aimed at any host on the
 * internet: the caller chooses the URL, and the answer is written to disk. The two
 * addresses that carry a chat attachment are
 * `github.com/user-attachments/files/<id>/<name>` and the `private-user-images` host
 * a private repository's asset redirects through.
 */
export function attachmentUrlAllowed(url: URL): boolean {
  if (url.protocol !== "https:") return false;
  if (url.hostname === "github.com") return url.pathname.startsWith("/user-attachments/");
  return url.hostname === "private-user-images.githubusercontent.com";
}

/** The URL as an attachment address, or the refusal naming what this tool does read. */
export function attachmentUrlFrom(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`${raw} is not an absolute URL.`);
  }
  if (!attachmentUrlAllowed(url)) {
    throw new Error(
      `${raw} is not an attachment this tool fetches. It reads ` +
        "`https://github.com/user-attachments/files/<id>/<name>` and " +
        "`https://private-user-images.githubusercontent.com/...`, and refuses every other host: what it does with " +
        "the answer is write a file, and the URL is the caller's.",
    );
  }
  return url;
}

/**
 * The file to save into — the caller's name, or the URL's last segment.
 *
 * `filename` is an argument because the two names differ: an asset URL's last segment
 * is a generic `default.docx`, while the comment the file was attached in shows the
 * name the person gave it (`ペダル.docx`). `dir` is an argument for the same kind of
 * reason: the default is the one directory under `/tmp` that survives into the next
 * run on an issue, and a caller that means a different one says so.
 *
 * Nothing outside `/tmp` is written, and the refusal says why: a file inside the
 * checkout is this run's work and would be committed as part of it.
 */
export function attachmentPathFor(url: URL, parts: { filename?: string; dir?: string } = {}): string {
  const root = resolve(TMP_ROOT);
  const requested = parts.dir ?? ATTACHMENT_DIR;
  const dir = resolve(requested);
  if (!(dir === root || dir.startsWith(root + sep))) {
    throw new Error(
      `'${requested}' resolves to '${dir}', outside ${TMP_ROOT}. An attachment is written under ${TMP_ROOT} only: ` +
        "a file inside the checkout would be committed as this run's work.",
    );
  }
  const name = parts.filename ?? decodeSegment(url.pathname.split("/").filter(Boolean).pop() ?? "");
  if (!name) {
    throw new Error(`${url.href} names no file, so pass \`filename\` to say what to save it as.`);
  }
  if (name === "." || name === ".." || /[/\\\0]/.test(name)) {
    throw new Error(`'${name}' is not a file name. Pass the name alone — the directory is \`dir\`.`);
  }
  return join(dir, name);
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * GET one attachment and write it to `dest`.
 *
 * ## The redirect is followed inside this call
 *
 * Measured on #415's thread: `github.com/user-attachments/files/<id>/<name>` answers
 * 302 to a signed `objects.githubusercontent.com` URL whose `X-Amz-Expires` is 300
 * seconds. A tool that reported the `Location` and left the second call to its caller
 * would hand back an address that is dead by the time anyone uses it, so the hop
 * happens here — and the body written is the target's, which is also why
 * `content_type` is read off the final response.
 *
 * ## Why the ceiling is enforced on the bytes and not on the header
 *
 * `content-length` is checked first because it is free. It is not sufficient: it is the
 * ENCODED length — measured on #415's thread as 40 bytes declaring a 9-byte body — so
 * a header under the ceiling does not mean a body under it. The count is therefore
 * kept as the body streams, the read stops at the ceiling rather than after it, and
 * nothing is written when it is crossed: a truncated document at the destination is
 * worse than none, because the caller cannot tell it from a whole one.
 */
export async function downloadAttachment(
  source: string,
  dest: string,
): Promise<{ bytes: number; contentType: string | null }> {
  const started = Date.now();
  log(`fetch_attachment ${source} -> ${dest}`);
  const response = await fetch(source, {
    method: "GET",
    // No Authorization header, and no argument that would add one. Measured on #415's
    // thread: a public asset answers an anonymous GET with the bytes, and on a public
    // asset a token that was accepted and one that was ignored are the same response —
    // so there is no observation this credential buys here, and one fewer place it goes.
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_ABORT_MS),
  });
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    throw new Error(refusalFor(response.status, source));
  }

  // The content type before the bytes, because a `200` is not by itself a document.
  // A page is served with HTML, and saving one would report a path to a document that
  // is a web page. Which answer a private repository's asset gives — that page or a
  // `404` — has not been measured.
  const contentType = response.headers.get("content-type");
  if (isMarkup(contentType)) {
    await response.body?.cancel().catch(() => {});
    throw new Error(markupRefusal(source, contentType));
  }

  const declared = Number(response.headers.get("content-length") ?? "");
  if (declared > UPLOAD_LIMIT_BYTES) {
    await response.body?.cancel().catch(() => {});
    throw new Error(overTheCeiling(source, declared));
  }

  const chunks: Uint8Array[] = [];
  let bytes = 0;
  const stream = response.body as unknown as AsyncIterable<Uint8Array> | null;
  if (stream) {
    for await (const chunk of stream) {
      bytes += chunk.length;
      // Leaving the loop this way cancels the body: the rest of it is not wanted, and
      // this is the point the ceiling exists for rather than a limit checked at the end.
      if (bytes > UPLOAD_LIMIT_BYTES) throw new Error(overTheCeiling(source, bytes));
      chunks.push(chunk);
    }
  }

  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, Buffer.concat(chunks));

  log(`fetch_attachment ${bytes}B ${contentType ?? "(no content-type)"} in ${Date.now() - started}ms`);
  return { bytes, contentType };
}

/** The types that say "a page rather than a file": what a refusal has to catch. */
function isMarkup(contentType: string | null): boolean {
  return /^(text\/html|application\/xhtml\+xml)\b/i.test((contentType ?? "").trim());
}

/**
 * The refusal, and why the rule is a list of what is not a document rather than of
 * what is.
 *
 * The set of files a person attaches is open — flat ODF arrives as XML, a template as
 * `application/octet-stream` — so an allowlist would refuse the formats this project's
 * own templates use. The wrong answer is narrower than that: it is a web page served
 * with `200`, which is what a login wall answers with. Whether an attachment on a
 * private repository gets that page or a `404` has not been measured, so this refuses
 * the page without claiming to know which one arrives.
 */
function markupRefusal(source: string, contentType: string | null): string {
  return (
    `${source} answered 200 as ${contentType}, which is a page rather than a document, and nothing was written. ` +
    "A login wall answers that way, and a path to it would be a path to a web page. Whether an attachment on a private " +
    "repository answers this page or a 404 has not been measured. Check the URL opens in a browser that is signed " +
    "in, or attach the file to the issue again."
  );
}

function overTheCeiling(source: string, bytes: number): string {
  return (
    `${source} is ${bytes} bytes, over the ${UPLOAD_LIMIT_BYTES}-byte limit an attachment is saved at, so the read ` +
    "stopped there and nothing was written. A partial file would be indistinguishable from a whole one."
  );
}

function refusalFor(status: number, source: string): string {
  if (status === 404) {
    return (
      `${source} answered 404 and nothing was written. The case this tool does not cover is an attachment on a ` +
      "private repository: it sends no credential, and whether an anonymous GET of a private asset is refused has " +
      "not been measured — so a 404 here may be a visibility answer rather than an absence."
    );
  }
  if (status === 401 || status === 403) {
    return (
      `${source} answered ${status} and nothing was written. That is a refusal rather than an absence, and an ` +
      "attachment on a private repository read without a credential is the likely cause: this tool sends none."
    );
  }
  return `${source} answered ${status} and nothing was written.`;
}

async function fetchAttachment(a: z.infer<typeof FETCH_ATTACHMENT_SCHEMA>): Promise<string> {
  const url = attachmentUrlFrom(a.url);
  const dest = attachmentPathFor(url, { filename: a.filename, dir: a.dir });
  const { bytes, contentType } = await downloadAttachment(url.href, dest);
  return JSON.stringify(
    { path: dest, bytes, content_type: contentType, source_url: url.href },
    null,
    2,
  );
}

/** The branch's current tip on the remote, or `undefined` when it does not exist yet. */
function remoteTip(branch: string): string | undefined {
  // `branch-reads.ts`'s read, so "origin has no such branch" and "origin could not be
  // reached" stay different answers: only the first means this publish creates the
  // branch, and the second is refused rather than turned into a root commit.
  const read = readOriginBranch(branch);
  if (!read.known) {
    throw new Error(
      `could not read '${branch}' from origin, so it is unknown whether publishing would create it or append to ` +
        `it: ${read.why}`,
    );
  }
  return read.present ? read.sha : undefined;
}

/** The commit that a leaf tree names, so its contents can be carried onto the new one. */
function commitAt(treeish: string): string {
  const { code, stdout, stderr } = gitRun("rev-parse", `${treeish}^{commit}`);
  if (code !== 0) throw new Error(`could not resolve '${treeish}': ${stderr || stdout}`);
  return stdout.trim();
}

/**
 * Publish drafts onto a branch, creating it as an orphan the first time.
 *
 * ## Why plumbing, and why this does not check anything out
 *
 * A run's checkout is the work tree the pull request is about. A branch switch in
 * it — `git switch --orphan`, or a second worktree rooted at the same place — is a
 * way to lose uncommitted work that has nothing to do with this call. So the commit
 * is built out of objects instead: `hash-object -w` for each draft,
 * `update-index --index-info -z` into a temporary index for the tree,
 * `commit-tree` for the commit, and one `push` of a raw refspec. Nothing touches
 * HEAD, the shared index, or the working tree — the second index has its own path
 * and `GIT_INDEX_FILE` is set for those commands alone.
 *
 * ## Creating versus appending
 *
 * The branch exists → its remote tip is the parent, and the push is a fast-forward,
 * so the drafts accumulate as history rather than replacing each other. It does not
 * exist → the commit has no parent and the push creates a root commit on a branch
 * unrelated to `main`, which is what keeps documents out of the tree people review.
 *
 * Publishing onto the remote's default branch is refused outright. An orphan branch
 * is safe precisely because it is not the reviewed one; a tool that could write to
 * `main` would be a way around every rule that guards it.
 */
async function publishDraft(a: z.infer<typeof PUBLISH_DRAFT_SCHEMA>): Promise<string> {
  // Only to spell the URLs the result carries: `git` finds its own remote.
  // `GITHUB_REPOSITORY` is what the runner sets; the fallback reads the checkout's
  // remote for a hand-run server.
  const repo = resolveRepo();
  // The branch is the repository's own setting (`getDocsBranch`), not an argument:
  // naming a branch from the outside is what let a publish land on somebody's work
  // branch (#254). The tool's guards below hold it away from the default branch and
  // from the branch this run is delivering, so a settings mistake surfaces as a
  // refusal rather than as a document in a tree people review.
  const branch = getDocsBranch();

  // git's own rule, asked rather than restated: it refuses `HEAD`, a name with a space,
  // a trailing `.lock` and the rest, and its message says which.
  const format = gitRun("check-ref-format", "--branch", branch);
  if (format.code !== 0) {
    throw new Error(`'${branch}' is not a branch name git accepts: ${format.stderr || format.stdout}`);
  }

  const defaultBranch = readRemoteDefaultBranch();
  if (!defaultBranch.known) {
    throw new Error(`could not read origin, so the default branch could not be checked: ${defaultBranch.why}`);
  }
  if (branch === defaultBranch.branch) {
    throw new Error(
      `'${branch}' is the default branch of origin. A draft published there would go straight into the tree people ` +
        `review, which is the one thing an orphan branch exists to avoid — and nothing here opens a pull request. ` +
        `Set \`tools.servers.attachments.settings.branch\` in this repository's config.yaml to an orphan branch, not the default branch.`,
    );
  }

  // And the branch this run is checked out on, for the same reason one step closer: a
  // document pushed onto the work branch is a document in the pull request being
  // reviewed, which is the outcome an orphan branch was chosen to avoid. A detached
  // HEAD answers nothing here, which is right — it is not a work branch.
  const current = checkedOutBranch();
  if (current && current === branch) {
    throw new Error(
      `'${branch}' is the branch this run has checked out, so publishing there would put the drafts into the work ` +
        `this run is delivering. Set \`tools.servers.attachments.settings.branch\` in this repository's config.yaml to the orphan branch the documents belong on.`,
    );
  }

  const drafts = resolveDraftFiles(a.files);

  const tmp = mkdtempSync(join(tmpdir(), "atomaton-publish-"));
  try {
    const index = join(tmp, "index");

    // Omit `--no-filters` and git would apply `.gitattributes` and `core.autocrlf`
    // to the blob, so a document published from a Windows-configured checkout would
    // arrive with its bytes rewritten. The document is the artifact here, not a
    // source file, so the bytes on disk are the bytes on the branch. Measured: a
    // `\r\n` file under `core.autocrlf=true` hashes to a different object with and
    // without this flag, and only one of the two round-trips byte for byte.
    const blobs: { blob: string; target: string }[] = [];
    for (const draft of drafts) {
      const hashed = gitRun("hash-object", "-w", "--no-filters", "--", draft.source);
      if (hashed.code !== 0) {
        throw new Error(`could not write ${draft.source} into the object store: ${hashed.stderr || hashed.stdout}`);
      }
      blobs.push({ blob: hashed.stdout.trim(), target: draft.target });
    }

    const parent = remoteTip(branch);
    let base: string | undefined;
    if (parent) {
      const fetched = gitRun("fetch", "--no-tags", "--no-write-fetch-head", "origin", `refs/heads/${branch}`);
      if (fetched.code !== 0) {
        throw new Error(`could not fetch '${branch}' from origin: ${fetched.stderr || fetched.stdout}`);
      }
      base = commitAt(parent);
      const read = gitInIndex(index, ["read-tree", base]);
      if (read.code !== 0) throw new Error(`could not read the tip of '${branch}': ${read.stderr || read.stdout}`);
    } else {
      const read = gitInIndex(index, ["read-tree", "--empty"]);
      if (read.code !== 0) throw new Error(`could not start an empty tree: ${read.stderr || read.stdout}`);
    }

    const staged = gitInIndexStdin(index, ["update-index", "-z", "--index-info"], indexInfoFor(blobs));
    if (staged.code !== 0) {
      throw new Error(`could not stage the drafts: ${staged.stderr || staged.stdout}`);
    }
    const tree = gitInIndex(index, ["write-tree"]);
    if (tree.code !== 0) throw new Error(`could not write the tree: ${tree.stderr || tree.stdout}`);

    // Every target is read back out of the tree that is about to be pushed, because
    // `git update-index` reports some unwritable paths with a warning on stderr and
    // exit code 0. A push that dropped a file would otherwise be reported as success,
    // with a URL for a document that is not on the branch.
    //
    // One `cat-file -e` per target rather than a listing of the tree: the question is
    // "is this exact path in there", and a NUL-separated listing read back through
    // `gitRun` — which trims its stdout and hands it back as one string — is a
    // re-encoding of the answer rather than the answer.
    const missing = drafts.filter((draft) => gitRun("cat-file", "-e", `${tree.stdout}:${draft.target}`).code !== 0);
    if (missing.length > 0) {
      throw new Error(
        `git did not accept ${missing.map((draft) => `'${draft.target}'`).join(", ")} into the tree, so nothing ` +
          `was pushed. A target must be a relative path with no '..' and nothing under .git.`,
      );
    }

    const commitArgs = [
      ...commitIdentity(),
      "commit-tree",
      tree.stdout,
      ...(base ? ["-p", base] : []),
      "-m",
      a.message,
    ];
    const commit = gitRun(...commitArgs);
    if (commit.code !== 0) throw new Error(`could not create the commit: ${commit.stderr || commit.stdout}`);
    const commitSha = commit.stdout.trim();

    const pushed = gitRun("push", "origin", `${commitSha}:refs/heads/${branch}`);
    if (pushed.code !== 0) {
      const raced = /non-fast-forward|fetch first|rejected/i.test(`${pushed.stderr} ${pushed.stdout}`);
      throw new Error(
        raced
          ? `something else pushed to '${branch}' between the read and the write, so this commit was refused ` +
              `rather than dropping theirs. Run it again; the drafts are still on disk.`
          : `could not push '${branch}': ${pushed.stderr || pushed.stdout}`,
      );
    }

    log(`publish ${branch} ${commitSha.slice(0, 12)} ${drafts.length} file(s)`);
    return JSON.stringify(
      {
        branch,
        commit_sha: commitSha,
        created: base === undefined,
        files: drafts.map((draft) => ({ target: draft.target, blob_url: blobUrlFor(repo, branch, draft.target) })),
      },
      null,
      2,
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

const PUBLISH_DRAFT_DESCRIPTION =
  "Publish documents onto an orphan branch and report the branch, the commit and a blob URL per file. " +
  "The branch is this repository's own setting — `tools.servers.attachments.settings.branch` in config.yaml, " +
  "default `business-docs` — and is deliberately not an argument: naming a branch from the outside is what let a " +
  "publish land on somebody's work branch. " +
  "The branch is created as a root commit the first time and appended to by fast-forward afterwards, so a document's " +
  "history accumulates and a diff can be read. Nothing is checked out: the commit is built from objects and pushed as " +
  "a refspec, so the run's work tree, HEAD and index are untouched. Publishing onto the remote's default branch is " +
  "refused — an orphan branch is safe because it is not the reviewed one.";

const FETCH_ATTACHMENT_DESCRIPTION =
  "Fetch one file a person attached to an issue and save it under /tmp, so a document can be opened, edited and " +
  "delivered (`publish_draft`) instead of pasted into the conversation. It reads " +
  "`https://github.com/user-attachments/files/<id>/<name>` and `https://private-user-images.githubusercontent.com/...` " +
  "and refuses every other host. It carries no credential — what it fetches is what an anonymous reader gets — and " +
  "the 302 GitHub answers is followed inside this call, because the signed URL it points at expires in five minutes " +
  "and a Location kept for a second call would already be dead. Returns the saved `path`, the decoded `bytes`, the " +
  "`content_type` and the `source_url`. A body over 25MB — the attachment ceiling — is refused and nothing is " +
  "written: `content-length` is checked first and the count is kept as the body streams, so up to the ceiling is held " +
  "in memory and the read is abandoned at the first chunk past it. A 200 carrying HTML is refused the same way — a " +
  "page rather than a document, and a path to it would be a path to a web page. `filename` names the saved file, since " +
  "an asset URL's last segment is often a generic `default.docx` while the comment shows the name it was attached as. " +
  "An attachment on a private repository is not measured: no credential is sent, so it comes back refused, and whether " +
  "GitHub answers a 404 or a page is unknown.";

const { tools, dispatch } = buildMcpTools([
  defineMcpTool({
    name: "publish_draft",
    description: PUBLISH_DRAFT_DESCRIPTION,
    schema: PUBLISH_DRAFT_SCHEMA,
    handler: publishDraft,
  }),
  defineMcpTool({
    name: "fetch_attachment",
    description: FETCH_ATTACHMENT_DESCRIPTION,
    schema: FETCH_ATTACHMENT_SCHEMA,
    handler: fetchAttachment,
  }),
]);

async function main(): Promise<void> {
  await serveMcpServer({ name: "atomaton-attachments-mcp", version: "1.0.0", tools, dispatch, log });
}
if (import.meta.main) void main();
