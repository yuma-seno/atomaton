#!/usr/bin/env bun
/**
 * attachments.ts — the one server that reaches GitHub's user-asset upload
 * endpoint, and the probe that answers what that endpoint accepts.
 *
 * ## Why a server, when `gh --attach` exists
 *
 * `gh issue comment --attach` refuses the Actions token client-side: the
 * allowlist in `internal/attachments/client.go` at v2.101.0 is
 * `gho_`/`ghp_`/`github_pat_`, so a `ghs_` token never reaches the wire. And
 * the shell cannot make the POST either — `curl` is refused by `shell_guard`,
 * and the shell server declares no credentials, so there would be nothing to
 * send. Measured, not reasoned: three runs each hit a refusal before any
 * request was built.
 *
 * What is left is the shape every credentialed check here takes: the token
 * lives in a tool server (`env: GH_TOKEN`), the agent calls the tool, and the
 * tool reports what the far end said. The check runs where the credential
 * runs — which is after a person merged the change that declares the server,
 * never inside the pull request that proposes it.
 *
 * ## `probe` stores nothing by default
 *
 * Three of its four modes send requests the endpoint cannot fulfil into an
 * asset: `routing` omits `repository_id`, `endpoint` empties `name`, and
 * `oversize` sends past the size ceiling. Each answer still settles one design
 * question — that the route exists, that the credential is accepted, that the
 * ceiling is enforced. `upload` is the one mode that stores, because a 201 is
 * only obtainable by storing, and it is opt-in by name.
 *
 * A stored user-attachment asset has no documented deletion API. The URL is
 * the artifact and it is permanent; that is part of why storing is not the
 * default.
 *
 * ## Why an orphan branch is published from here too
 *
 * The other half of the same design question — where a document that is not a
 * deliverable lives — is an orphan branch, and it is reached from here for the
 * same reason the POST is: the shell cannot do it. `git switch`, `git push` and
 * every other mutating subcommand are refused by `shell_guard`, and
 * `commit_and_push` names a branch from the work-branch convention and can
 * build no other. Measured, both, rather than reasoned about.
 *
 * What makes it a *credential* question at all is that this server is a tool
 * server: it runs `git` in its own process, and the checkout it inherits
 * already carries the credential `actions/checkout` wrote into `.git/config`.
 * No token is read here and none is passed — the point is that the command
 * runs where the run's own credential is, rather than in a shell that has
 * none. `GH_TOKEN` is declared for `probe` alone.
 */
import { readFileSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, isAbsolute, join, resolve, sep } from "node:path";
import { buildMcpTools, defineMcpTool, positiveInt, serveMcpServer, z } from "../../../adapters/mcp/mcp-tool.ts";
import { getDocsBranch } from "../../../adapters/runner/config.ts";
import { gh, gitRun, gitRunWith } from "../../../adapters/github/gh.ts";
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

/** The endpoint gh's `internal/attachments/client.go` posts to, on github.com. */
const UPLOAD_ENDPOINT = "https://uploads.github.com/user-attachments/assets";

/** The documented ceiling for Office, PDF and zip attachments; images and video are lower. */
export const UPLOAD_LIMIT_BYTES = 25 * 1024 * 1024;

/**
 * The largest file either tool will handle at all.
 *
 * For `probe` it is the point past which the file is not read into memory; for
 * `publish_draft` it is the point past which it is not handed to `git`. Both are far
 * above the 25MB attachment ceiling, so this bound is about not being handed an
 * accident — a log, an image dump — rather than about either limit.
 */
const MAX_READ_BYTES = 128 * 1024 * 1024;

/**
 * How long this server waits for the endpoint before giving up.
 *
 * Exported because it is only useful in relation to something outside this file:
 * `defaults.yaml` must allow a longer `tools/call` than this, or atoma discards the
 * call first and the server's own answer arrives after nobody is waiting for it —
 * and in `upload` mode the file may already have been stored. `attachments-shape.test.ts`
 * reads both and holds them in that order.
 */
export const REQUEST_ABORT_MS = 120_000;

/** How much of a response body reaches the result. The status decides the design; the body records why. */
const BODY_EXCERPT_CHARS = 2_000;

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
  const roots = [base, "/tmp"];
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

export type ProbeMode = "routing" | "endpoint" | "oversize" | "upload";

const PROBE_SCHEMA = z.object({
  mode: z
    .enum(["routing", "endpoint", "oversize", "upload"])
    .optional()
    .default("endpoint")
    .describe(
      "What to measure. `endpoint` (default): POST with repository_id and an empty name — a request that cannot store, whose 400 proves the endpoint is real and the credential was accepted. " +
        "`routing`: the same without repository_id — the 404 shape gh's source predicts. " +
        "`oversize`: send a file over the 25MB ceiling and record how the endpoint refuses it. " +
        "`upload`: the only mode that stores — one file up to 25MB, returning the asset URL. A stored user-attachment has no documented deletion API, so treat the URL as permanent.",
    ),
  file: z
    .string()
    .optional()
    .describe("Path to the file to send. Required for oversize and upload; ignored by the other two."),
  content_type: z
    .string()
    .optional()
    .default("application/octet-stream")
    .describe("Content-Type declared for the body. Defaults to application/octet-stream, which is what gh sends."),
  repository_id: positiveInt(
    "Numeric REST id of the repository to upload against. Looked up from the current repository when omitted.",
  ).optional(),
  name: z
    .string()
    .optional()
    .describe(
      "The `name` parameter to send, when a probe needs a specific one. Omitted entirely leaves the name the mode " +
        "decides: empty for `routing` and `endpoint` — which is what makes their 400 the endpoint's answer rather " +
        "than a missing parameter — and the file's basename for `oversize` and `upload`. Set it on `routing` to " +
        "measure the route with a valid name and no `repository_id`, which is the only way that measurement is " +
        "reachable: a non-empty name on the other modes is the file's, and those modes require one.",
    ),
});

/**
 * The credential, and the four characters that say what kind it is.
 *
 * A prefix is not a secret — it is the identifier of the token's kind, and it
 * is what makes a 401 readable: `ghs_` refused by the endpoint is a different
 * design answer from `gho_` refused for being expired.
 */
function credential(): { token: string; kind: string } {
  const token = (process.env.GH_TOKEN ?? "").trim();
  if (!token) {
    throw new Error(
      "GH_TOKEN was not delivered to this server. It reaches the server only through its `env:` entry " +
        '(`GH_TOKEN: "${GH_TOKEN}"` under tools.servers) — check the entry this server is declared by.',
    );
  }
  return { token, kind: token.slice(0, 4) };
}

/** The repository to upload against, as `owner/name`. */
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
    "GITHUB_REPOSITORY is unset and no GitHub remote could be read, so there is no repository to upload against.",
  );
}

/** The repository's numeric REST id, which is what the endpoint routes by. */
function resolveRepositoryId(repo: string): number {
  const { code, stdout, stderr } = gh("api", `repos/${repo}`, "--jq", ".id");
  if (code !== 0) {
    throw new Error(`could not read the repository id for ${repo}: ${stderr || stdout}`);
  }
  const id = Number(stdout.trim());
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(`could not read the repository id for ${repo}: got ${stdout.trim().slice(0, 80)}`);
  }
  return id;
}

/**
 * The request each mode sends, as a URL.
 *
 * Separate from the send so the shape a mode produces is testable without a
 * credential — this is the "verify the shape here, the far end there" half of
 * a check that can only mean something after a merge.
 */
export function requestUrlFor(
  mode: ProbeMode,
  parts: { repositoryId?: number; name?: string; contentType: string },
): string {
  const query = new URLSearchParams();
  // The order gh uses: name, content_type, repository_id. An empty `name` is a
  // value, not an omission — it is what makes the 400 the endpoint's own
  // answer rather than a missing parameter.
  query.set("name", parts.name ?? "");
  query.set("content_type", parts.contentType);
  if (parts.repositoryId !== undefined) query.set("repository_id", String(parts.repositoryId));
  return `${UPLOAD_ENDPOINT}?${query.toString()}`;
}

/**
 * Read the file a mode sends, or say which rule refused it.
 *
 * The refusals are the measurement's own guardrails: an `upload` over the
 * documented ceiling would measure nothing but a longer wait, and an `oversize`
 * under it would measure nothing at all.
 */
export function readFileFor(mode: "oversize" | "upload", path: string): { bytes: Uint8Array; size: number } {
  let size: number;
  try {
    size = statSync(path).size;
  } catch {
    throw new Error(`could not read ${path}: no such file`);
  }
  if (mode === "upload" && size > UPLOAD_LIMIT_BYTES) {
    throw new Error(
      `${path} is ${size} bytes, over the ${UPLOAD_LIMIT_BYTES}-byte attachment ceiling. ` +
        "upload mode is for a file that fits; run probe with mode oversize to measure how the endpoint refuses a larger one.",
    );
  }
  if (mode === "oversize" && size <= UPLOAD_LIMIT_BYTES) {
    throw new Error(
      `${path} is ${size} bytes, at or under the ${UPLOAD_LIMIT_BYTES}-byte ceiling, so an oversize run would measure nothing. ` +
        "Make a file over the limit first, or run probe with mode upload.",
    );
  }
  if (size > MAX_READ_BYTES) {
    throw new Error(`${path} is ${size} bytes, past the ${MAX_READ_BYTES}-byte ceiling this tool reads into memory.`);
  }
  const bytes = new Uint8Array(readFileSync(path));
  return { bytes, size };
}

/**
 * What a status means, per mode — the probe's whole output beyond the raw
 * numbers. The expected values are the ones measured by hand on #12's thread
 * and settled by the contrast trial on #111's: 404 for a request without
 * repository_id, 400 "Invalid name for request" for one with an empty name,
 * against a token the endpoint accepted — and 404 with nothing stored for any
 * body-bearing POST from an Actions token, which is why the file route is
 * `publish_draft` onto the orphan branch rather than this endpoint.
 */
export function interpret(mode: ProbeMode, status: number, body: string, location?: string): string {
  if (status >= 300 && status < 400) {
    return `redirected (${status}): the endpoint did not answer the POST directly${location ? ` — Location: ${location}` : ""}. Record this as a route that moves rather than one that answers.`;
  }
  if (status === 429) {
    return "rate limited: wait and run the same probe again. The answer it exists for has not arrived yet.";
  }

  if (mode === "routing") {
    if (status === 404) {
      return "matches the measured expectation: without repository_id the endpoint does not route. On its own a 404 does not prove the endpoint exists — endpoint mode's 400 is that proof.";
    }
    if (status === 400 && body.includes("Invalid name for request")) {
      return (
        "the request was rejected for its name before it ever routed, so this measured nothing about routing. " +
        "Measured: an empty `name` is answered 400 this way whether or not repository_id is present. Send this mode " +
        "with a non-empty `name` to reach the routing question."
      );
    }
    return "unexpected: the measured expectation for a request without repository_id is 404. Record the status and body.";
  }

  if (mode === "endpoint") {
    if (status === 400) {
      const exact = body.includes("Invalid name for request") ? " — the body matches the message measured by hand" : "";
      return (
        "matches the measured expectation: the endpoint is real and the credential was accepted. " +
        "A rejected credential would be 401, and a token without write access would be 404 (gh's source says READ and TRIAGE get 404, not 403). " +
        `Nothing was stored: name was empty${exact}.`
      );
    }
    if (status === 401) {
      return (
        "the credential was rejected by the endpoint. gh already refuses a ghs_ token client-side; an endpoint-side " +
        "rejection closes the direct-POST path too. The design does not reopen on this: the attachment route was " +
        "narrowed to the orphan branch (publish_draft), which reaches the repository with the credential the run " +
        "already has, and #12's attachment question is settled on that route. A different credential (a PAT in " +
        "tools.secrets) would be a new design question, not a reopening of this one."
      );
    }
    if (status === 403) {
      return "the credential is recognised but forbidden. gh's source says a token without write access gets 404 here, so a 403 points at policy — an app not authorised, or SSO — rather than at the repository role.";
    }
    if (status === 404) {
      return "the endpoint did not route for this credential. gh's source says READ and TRIAGE roles get 404 — check the token's permission on the repository before concluding the endpoint is gone.";
    }
    if (status === 201) {
      return "the endpoint ignored the empty name and stored an asset anyway. There is no documented deletion API for a user-attachment asset — record the URL and treat the file as permanent.";
    }
    return "unexpected: the measured expectation is 400. Record the status and body.";
  }

  if (mode === "upload") {
    if (status === 201) {
      return "stored: the URL in the result is the attachment reference for markdown. There is no documented API to delete a user-attachment asset, so this URL is permanent — weigh that before the next upload.";
    }
    if (status === 413) {
      return "over the size ceiling: the upload was refused and nothing was stored.";
    }
    if (status === 404) {
      // Measured on #111's run, the contrast trial that settled what this answer
      // means. The same session, the same `ghs_` token — one with write on the
      // repository — and a correct repository_id: the empty-name request came
      // back 400 (route real, credential accepted) and every body-bearing POST
      // came back 404 — a 20,898-byte pdf, the same bytes as octet-stream, a
      // 5-byte text. Size and MIME are ruled out by the spread; the role reading
      // is ruled out by the write access. What a 404 on a body-bearing POST
      // means here is therefore settled as far as a single credential kind can
      // settle it: the endpoint refuses real uploads from Actions tokens, and
      // whether it would refuse another kind is a trial with a different token
      // — a person's procedure, not this tool's.
      return (
        "the endpoint refuses real uploads from this credential kind: measured, a `ghs_` token with write access " +
        "gets 404 on every body-bearing POST, whatever the size or MIME type (issues #111 and #164). The gh-source " +
        "reading of a low role is ruled out by that write access, and the route is real — the same session's " +
        "`endpoint` 400 proved the credential was accepted. Deliver the file another way: `publish_draft` onto the " +
        "orphan branch, which is the route the attachment design settled on. Whether a different token kind would " +
        "be stored is a trial with that token, not a question this mode can answer."
      );
    }
    if (status === 401) {
      return (
        "the credential was rejected by the endpoint. The design does not reopen on this: the attachment route is " +
        "the orphan branch (publish_draft), which does not POST here at all. A credential that would make this " +
        "mode work is a PAT — a new credential in tools.secrets, a decision taken on its own if a requirement " +
        "ever demands it (#164 chose not to)."
      );
    }
    if (status === 403) {
      return "the credential is recognised but forbidden — policy rather than role, since a low role gets 404 here.";
    }
    if (status === 422) {
      return "refused as unprocessable — the endpoint's own message is in the body. This is the shape a validation rule (a format the endpoint rejects) takes.";
    }
    return "unexpected: the measured expectation is 404 with nothing stored — this credential kind is refused at the body stage. Record the status and body.";
  }

  // oversize
  if (status === 413) {
    // A fact about this endpoint, and only this one: the upload route carries no
    // files any more (`upload` mode's 404 says why), so the ceiling bounds
    // nothing a run delivers. Sizes are bounded where the files actually go —
    // `publish_draft`'s own read ceiling, MAX_READ_BYTES.
    return "the ceiling is enforced server-side: a body over 25MB is not attached whole. That is a fact about this endpoint alone — the upload route carries no files any more, so nothing delivered is weighed against it. A published document is bounded by `publish_draft`'s own read ceiling instead.";
  }
  if (status === 201) {
    return "the over-limit file WAS stored: the documented 25MB ceiling did not fire for this content type. Record the URL — the premise is contradicted, and the finding goes to the attachment design's thread rather than reopening it.";
  }
  if (status === 422 || status === 400) {
    return `refused with ${status}: the ceiling may be reported as a validation message rather than 413. The body is the record; either way the file was not stored whole.`;
  }
  if (status === 404) {
    // Measured on #109's run, and settled by #111's: a 27MB body came back 404
    // `Not Found` and nothing was stored — and #111's contrast trial then
    // established the cause. The same `ghs_` token, same session, correct
    // repository_id, bodies UNDER the ceiling (a 20KB pdf, the same bytes as
    // octet-stream, a 5-byte text) also came back 404, so size is not the
    // cause: the credential's kind is. The endpoint refuses body-bearing POSTs
    // from Actions tokens at any size, which is the same refusal `upload`
    // mode's 404 describes, and the same answer's consequence: the file goes
    // by `publish_draft` onto the orphan branch, not by POST here.
    return (
      "the credential kind, not the size: measured, every body-bearing POST from a `ghs_` token is refused with " +
      "404 `Not Found` — over the ceiling (this mode) and under it (issues #111 and #164) alike — so the " +
      "permission reading and the size reading are both ruled out. The route and the credential were proven by " +
      "the same session's `endpoint` 400. Nothing was stored. Deliver the file by `publish_draft` onto the " +
      "orphan branch; the 25MB ceiling is a fact about the upload route, which no longer carries files."
    );
  }
  if (status === 401) {
    return (
      "the credential was rejected before the size question was reached. The design does not reopen on this: the " +
      "attachment route is the orphan branch (publish_draft), which does not POST here at all. A credential that " +
      "would be accepted here is a PAT — a new credential in tools.secrets, a decision taken on its own if a " +
      "requirement ever demands it (#164 chose not to)."
    );
  }
  return "unexpected: the measured expectation is a refusal (413, or 422 carrying the ceiling as a validation message). Record the status and body.";
}

async function probe(a: z.infer<typeof PROBE_SCHEMA>): Promise<string> {
  const { token, kind } = credential();
  const mode = a.mode as ProbeMode;
  const contentType = a.content_type ?? "application/octet-stream";

  const needsRepo = mode !== "routing";
  const repositoryId = a.repository_id ?? (needsRepo ? resolveRepositoryId(resolveRepo()) : undefined);
  // A caller's own `name` wins; without one the mode decides, which is what keeps
  // every existing call identical. `routing` with a name and no repository_id is the
  // measurement the empty-name form could not reach — measured, the endpoint answers
  // `Invalid name for request` 400 for an empty one before it ever routes, so the
  // routing question was never asked.
  const name = a.name ?? (mode === "upload" || mode === "oversize" ? basename(a.file ?? "") : undefined);

  let body: Uint8Array | undefined;
  if (mode === "upload" || mode === "oversize") {
    if (!a.file) throw new Error(`mode ${mode} needs a file to send`);
    ({ bytes: body } = readFileFor(mode, a.file));
  }

  const url = requestUrlFor(mode, { repositoryId, name, contentType });

  const started = Date.now();
  log(`probe ${mode} ${body ? `${body.length}B` : "(no body)"}`);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      // `token`, not `Bearer` — the prefix gh's own client sends, so the probe
      // measures the endpoint against the credential shape gh would have used.
      Authorization: `token ${token}`,
      "Content-Type": contentType,
      Accept: "application/vnd.github+json",
    },
    ...(body ? { body } : {}),
    // A redirect is a finding, not a route to follow: following one would turn
    // the POST into a GET and report the wrong endpoint's answer as the answer.
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_ABORT_MS),
  });
  const responseText = await response.text();
  const location = response.headers.get("location") ?? undefined;
  log(`probe ${mode} -> ${response.status} in ${Date.now() - started}ms`);

  const interpretation = interpret(mode, response.status, responseText, location);
  return JSON.stringify(
    {
      mode,
      sent: url,
      content_length: body ? body.length : 0,
      credential: `present, prefix ${kind}`,
      status: response.status,
      location: location ?? null,
      body_excerpt: responseText.slice(0, BODY_EXCERPT_CHARS) || null,
      interpretation,
    },
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
  // The same resolution `probe` uses, and used here only to spell the URLs: `git`
  // finds its own remote. `GITHUB_REPOSITORY` is what the runner sets; the fallback
  // reads the checkout's remote for a hand-run server.
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

const { tools, dispatch } = buildMcpTools([
  defineMcpTool({
    name: "probe",
    description:
      "Measure GitHub's user-asset upload endpoint (the one `gh --attach` uses) and report what it said, as data. " +
      "Default mode `endpoint` sends a request that cannot store anything (empty name) and distinguishes 404/400/401/201, so it answers whether the endpoint is real and whether the run's credential is accepted — without saving a file. " +
      "Mode `routing` omits repository_id — an empty name is rejected before it routes, so pass `name` as well for that measurement; mode `oversize` sends a file over the 25MB ceiling and records the refusal; mode `upload` is the only mode that stores, sends one file at or under 25MB, and returns the permanent asset URL — though measured, the Actions token this run carries is refused at the body stage (404, nothing stored), so delivering a file is `publish_draft`'s job and this tool's job is to measure. " +
      "The status, the response body and what the status means for the design are all in the result; nothing is stored unless mode is `upload`.",
    schema: PROBE_SCHEMA,
    handler: probe,
  }),
  defineMcpTool({
    name: "publish_draft",
    description: PUBLISH_DRAFT_DESCRIPTION,
    schema: PUBLISH_DRAFT_SCHEMA,
    handler: publishDraft,
  }),
]);

async function main(): Promise<void> {
  await serveMcpServer({ name: "atomaton-attachments-mcp", version: "1.0.0", tools, dispatch, log });
}
if (import.meta.main) void main();
