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
 */
import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";
import { buildMcpTools, defineMcpTool, positiveInt, serveMcpServer, z } from "../../../adapters/mcp/mcp-tool.ts";
import { gh, gitRun } from "../../../adapters/github/gh.ts";
import { hardenCredentialHolder } from "../lib/harden.ts";

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

/** Past this size the file is not read into memory at all, whatever the mode. */
const MAX_READ_BYTES = 128 * 1024 * 1024;

/** How much of a response body reaches the result. The status decides the design; the body records why. */
const BODY_EXCERPT_CHARS = 2_000;

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
 * numbers. The expected values are the ones measured by hand on #12's thread:
 * 404 for a request without repository_id, 400 "Invalid name for request" for
 * one with an empty name, against a token the endpoint accepted.
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
      return "the credential was rejected by the endpoint. gh already refuses a ghs_ token client-side; an endpoint-side rejection closes the direct-POST path too, and the design needs a different credential (a PAT declared in tools.secrets). This is the answer that reopens #12's design.";
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
      return "the endpoint did not route for this credential: gh's source says a token without write access on the repository gets 404, not 403.";
    }
    if (status === 401) {
      return "the credential was rejected by the endpoint — the direct-POST design needs a different credential, and #12's design reopens.";
    }
    if (status === 403) {
      return "the credential is recognised but forbidden — policy rather than role, since a low role gets 404 here.";
    }
    if (status === 422) {
      return "refused as unprocessable — the endpoint's own message is in the body. This is the shape a validation rule (a format the endpoint rejects) takes.";
    }
    return "unexpected: the measured expectation is 201 with an asset URL. Record the status and body.";
  }

  // oversize
  if (status === 413) {
    return "the ceiling is enforced server-side: a file over 25MB cannot be attached whole. The design question — split the artifact, or regenerate a smaller one from the source — is settled toward pieces at or under the limit.";
  }
  if (status === 201) {
    return "the over-limit file WAS stored: the documented 25MB ceiling did not fire for this content type. Record the URL — this contradicts the premise the design rests on, and #12's design reopens.";
  }
  if (status === 422 || status === 400) {
    return `refused with ${status}: the ceiling may be reported as a validation message rather than 413. The body is the record; either way the file was not stored whole.`;
  }
  if (status === 404) {
    return "the endpoint did not route for this credential: gh's source says a token without write access on the repository gets 404. The size question was not reached.";
  }
  if (status === 401) {
    return "the credential was rejected before the size question was reached — the direct-POST design needs a different credential, and #12's design reopens.";
  }
  return "unexpected: the measured expectation is a refusal (413, or 422 carrying the ceiling as a validation message). Record the status and body.";
}

async function probe(a: z.infer<typeof PROBE_SCHEMA>): Promise<string> {
  const { token, kind } = credential();
  const mode = a.mode as ProbeMode;
  const contentType = a.content_type ?? "application/octet-stream";

  const needsRepo = mode !== "routing";
  const repositoryId = a.repository_id ?? (needsRepo ? resolveRepositoryId(resolveRepo()) : undefined);
  const name = mode === "upload" || mode === "oversize" ? basename(a.file ?? "") : undefined;

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
    signal: AbortSignal.timeout(120_000),
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

const { tools, dispatch } = buildMcpTools([
  defineMcpTool({
    name: "probe",
    description:
      "Measure GitHub's user-asset upload endpoint (the one `gh --attach` uses) and report what it said, as data. " +
      "Default mode `endpoint` sends a request that cannot store anything (empty name) and distinguishes 404/400/401/201, so it answers whether the endpoint is real and whether the run's credential is accepted — without saving a file. " +
      "Mode `routing` omits repository_id; mode `oversize` sends a file over the 25MB ceiling and records the refusal; mode `upload` is the only mode that stores, sends one file at or under 25MB, and returns the permanent asset URL. " +
      "The status, the response body and what the status means for the design are all in the result; nothing is stored unless mode is `upload`.",
    schema: PROBE_SCHEMA,
    handler: probe,
  }),
]);

async function main(): Promise<void> {
  await serveMcpServer({ name: "atomaton-attachments-mcp", version: "1.0.0", tools, dispatch, log });
}
if (import.meta.main) void main();
