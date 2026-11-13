// ---------------------------------------------------------------------------
// attach_file — the native attachment, uploaded rather than linked
// ---------------------------------------------------------------------------

/**
 * How the endpoint renders a type, which decides both the markdown and the ceiling.
 *
 * - `image` renders in place, so its markdown is an image and it may carry alt text;
 * - `video` has no markdown syntax at all — GitHub promotes a bare URL that is the
 *   whole content of a paragraph — so its markdown is the URL alone;
 * - `file` renders as a link, and the name is what a person clicks.
 */
type Rendering = "image" | "video" | "file";

/** One accepted extension, the content type the endpoint expects for it, and how it renders. */
interface AttachType {
  extension: string;
  contentType: string;
  rendering: Rendering;
}

/** The Office content types, named because each is long enough to bury the line it is on. */
const OFFICE_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const OFFICE_PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const OFFICE_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Every extension this tool accepts, taken from GitHub's own list of supported types
 * rather than guessed.
 *
 * The first group is the image and media set GitHub renders in place; the rest are the
 * additional types it accepts in a comment. SVG is in the first group deliberately: the
 * documentation lists it, and the sanitising is GitHub's. `.webp` is here because gh's
 * own uploader accepts it although the documentation's table omits it.
 *
 * **The extension is the whole check, and the bytes are not inspected.** That is gh's
 * judgement, made for the same endpoint: the far end accepts mislabelled bytes, so a
 * PNG named `.png` and a ZIP named `.png` both upload, and inspecting here would refuse
 * files the endpoint would have taken without protecting anything the endpoint does not
 * already decide. What it costs is that a wrong name produces a wrong render rather than
 * a refusal, and the caller can see that in the URL it gets back.
 */
export const ATTACH_TYPES: readonly AttachType[] = [
  { extension: "png", contentType: "image/png", rendering: "image" },
  { extension: "gif", contentType: "image/gif", rendering: "image" },
  { extension: "jpg", contentType: "image/jpeg", rendering: "image" },
  { extension: "jpeg", contentType: "image/jpeg", rendering: "image" },
  { extension: "svg", contentType: "image/svg+xml", rendering: "image" },
  { extension: "webp", contentType: "image/webp", rendering: "image" },
  { extension: "mp4", contentType: "video/mp4", rendering: "video" },
  { extension: "mov", contentType: "video/quicktime", rendering: "video" },
  { extension: "webm", contentType: "video/webm", rendering: "video" },

  { extension: "pdf", contentType: "application/pdf", rendering: "file" },
  { extension: "docx", contentType: OFFICE_DOCX, rendering: "file" },
  { extension: "pptx", contentType: OFFICE_PPTX, rendering: "file" },
  { extension: "xlsx", contentType: OFFICE_XLSX, rendering: "file" },
  { extension: "xls", contentType: "application/vnd.ms-excel", rendering: "file" },
  { extension: "xlsm", contentType: "application/vnd.ms-excel.sheet.macroEnabled.12", rendering: "file" },
  { extension: "odt", contentType: "application/vnd.oasis.opendocument.text", rendering: "file" },
  { extension: "fodt", contentType: "application/vnd.oasis.opendocument.text-flat-xml", rendering: "file" },
  { extension: "ods", contentType: "application/vnd.oasis.opendocument.spreadsheet", rendering: "file" },
  { extension: "fods", contentType: "application/vnd.oasis.opendocument.spreadsheet-flat-xml", rendering: "file" },
  { extension: "odp", contentType: "application/vnd.oasis.opendocument.presentation", rendering: "file" },
  { extension: "fodp", contentType: "application/vnd.oasis.opendocument.presentation-flat-xml", rendering: "file" },
  { extension: "odg", contentType: "application/vnd.oasis.opendocument.graphics", rendering: "file" },
  { extension: "fodg", contentType: "application/vnd.oasis.opendocument.graphics-flat-xml", rendering: "file" },
  { extension: "odf", contentType: "application/vnd.oasis.opendocument.formula", rendering: "file" },
  { extension: "rtf", contentType: "application/rtf", rendering: "file" },
  { extension: "doc", contentType: "application/msword", rendering: "file" },

  { extension: "txt", contentType: "text/plain", rendering: "file" },
  { extension: "md", contentType: "text/markdown", rendering: "file" },
  { extension: "copilotmd", contentType: "text/markdown", rendering: "file" },
  { extension: "csv", contentType: "text/csv", rendering: "file" },
  { extension: "tsv", contentType: "text/tab-separated-values", rendering: "file" },
  { extension: "log", contentType: "text/plain", rendering: "file" },
  { extension: "json", contentType: "application/json", rendering: "file" },
  { extension: "jsonc", contentType: "application/json", rendering: "file" },

  { extension: "c", contentType: "text/x-c", rendering: "file" },
  { extension: "cs", contentType: "text/plain", rendering: "file" },
  { extension: "cpp", contentType: "text/x-c++", rendering: "file" },
  { extension: "css", contentType: "text/css", rendering: "file" },
  { extension: "drawio", contentType: "application/xml", rendering: "file" },
  { extension: "dmp", contentType: "application/octet-stream", rendering: "file" },
  { extension: "html", contentType: "text/html", rendering: "file" },
  { extension: "htm", contentType: "text/html", rendering: "file" },
  { extension: "java", contentType: "text/x-java", rendering: "file" },
  { extension: "js", contentType: "text/javascript", rendering: "file" },
  { extension: "ipynb", contentType: "application/json", rendering: "file" },
  { extension: "patch", contentType: "text/x-diff", rendering: "file" },
  { extension: "php", contentType: "application/x-httpd-php", rendering: "file" },
  { extension: "cpuprofile", contentType: "application/json", rendering: "file" },
  { extension: "pdb", contentType: "application/octet-stream", rendering: "file" },
  { extension: "py", contentType: "text/x-python", rendering: "file" },
  { extension: "sh", contentType: "text/x-sh", rendering: "file" },
  { extension: "sql", contentType: "text/plain", rendering: "file" },
  { extension: "ts", contentType: "text/typescript", rendering: "file" },
  { extension: "tsx", contentType: "text/typescript", rendering: "file" },
  { extension: "xml", contentType: "application/xml", rendering: "file" },
  { extension: "yaml", contentType: "text/yaml", rendering: "file" },
  { extension: "yml", contentType: "text/yaml", rendering: "file" },

  { extension: "zip", contentType: "application/zip", rendering: "file" },
  { extension: "gz", contentType: "application/gzip", rendering: "file" },
  { extension: "tgz", contentType: "application/gzip", rendering: "file" },

  { extension: "debug", contentType: "text/plain", rendering: "file" },
  { extension: "msg", contentType: "application/vnd.ms-outlook", rendering: "file" },
  { extension: "eml", contentType: "message/rfc822", rendering: "file" },

  { extension: "bmp", contentType: "image/bmp", rendering: "file" },
  { extension: "tif", contentType: "image/tiff", rendering: "file" },
  { extension: "tiff", contentType: "image/tiff", rendering: "file" },

  { extension: "mp3", contentType: "audio/mpeg", rendering: "file" },
  { extension: "wav", contentType: "audio/wav", rendering: "file" },
];

/** The largest image this tool sends, which is GitHub's own ceiling for one. */
export const IMAGE_LIMIT_BYTES = 10 * 1024 * 1024;

/**
 * The largest video this tool sends.
 *
 * The real limit is the account plan's — 10MB on free, 100MB on paid — which this tool
 * cannot know before the request. So this is the generous bound and the endpoint refuses
 * the rest, exactly as gh does it.
 */
export const VIDEO_LIMIT_BYTES = 100 * 1024 * 1024;

/** The ceiling for a file of this kind: an image and a video are lower, everything else is the attachment limit. */
function ceilingFor(rendering: Rendering): number {
  if (rendering === "image") return IMAGE_LIMIT_BYTES;
  if (rendering === "video") return VIDEO_LIMIT_BYTES;
  return UPLOAD_LIMIT_BYTES;
}

/** Why the ceiling for this kind is the number it is, for the refusal to carry. */
function ceilingReason(rendering: Rendering, ceiling: number): string {
  if (rendering === "image") return `GitHub's ceiling for an image is ${ceiling} bytes`;
  if (rendering === "video") {
    return `a video is sent up to ${ceiling} bytes, which is a paid plan's limit; the endpoint is what refuses a free plan's`;
  }
  return `GitHub's ceiling for a file that is not an image or a video is ${ceiling} bytes`;
}

/** Every extension this tool accepts, as a sentence for a refusal to carry. */
export function supportedExtensions(): string {
  return ATTACH_TYPES.map((type) => `.${type.extension}`).join(", ");
}

/** The type entry for a file name, or the refusal naming every extension that would work. */
export function attachTypeFor(name: string): AttachType {
  const dot = name.lastIndexOf(".");
  const extension = dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
  const found = ATTACH_TYPES.find((type) => type.extension === extension);
  if (!found) {
    const named = dot === -1 ? `${name} has no extension` : `'${name}' is not a file type this tool attaches`;
    throw new Error(`${named}. Supported: ${supportedExtensions()}`);
  }
  return found;
}

/**
 * The characters that would end an alt text or a link label early.
 *
 * Without this, alt text containing `](url)` closes the image and points it somewhere the
 * caller did not choose — the picture renders, and it is a link. gh escapes exactly these.
 */
function escapeLabel(text: string): string {
  return text.replace(/[\\[\]\n\r]/g, (character) =>
    character === "\n" || character === "\r" ? " " : `\\${character}`,
  );
}

/**
 * Whether `markdown` is one image, pointing at `url`, and nothing else.
 *
 * Rendered and parsed back rather than trusted, because escaping and parsing have to
 * agree: a character `escapeLabel` does not neutralise is an upload that cannot be undone
 * and a picture that links elsewhere. The URL is a stand-in — the real one does not exist
 * until the asset has uploaded, and only the alt text varies.
 */
export function isSingleImage(markdown: string, url: string): boolean {
  if (!markdown.startsWith("![")) return false;
  let index = 2;
  while (index < markdown.length) {
    const character = markdown[index]!;
    if (character === "\\") {
      index += 2;
      continue;
    }
    if (character === "]") break;
    index += 1;
  }
  if (markdown[index] !== "]") return false;
  return markdown.slice(index + 1) === `(${url})`;
}

/** The URL a validated image is rendered against while checking that its alt text stays inside. */
const ALT_PROBE_URL = "https://example.invalid/probe";

/** What one attachment resolves to before anything is uploaded. */
export interface AttachFile {
  /** The path as the caller wrote it, so it is named back the way they typed it. */
  path: string;
  /** The absolute path the bytes are read from. */
  source: string;
  /** The name GitHub receives, which is what a person sees on a linked file. */
  name: string;
  /** The alt text of an image; `null` for everything else, which has nowhere to put one. */
  alt: string | null;
  size: number;
  rendering: Rendering;
  contentType: string;
}

/** A local file's absolute path, refused if it lies outside the two places a run may read from. */
function sourceWithinRun(filePath: string): string {
  const base = resolve(process.cwd());
  // The work tree and /tmp, the same pair `resolveDraftFiles` allows and for the same
  // reason: `/tmp/atomaton-workspace` is where a producer puts output the checkout must
  // not carry.
  const roots = [base, TMP_ROOT];
  const source = isAbsolute(filePath) ? resolve(filePath) : resolve(base, filePath);
  if (!roots.some((root) => source === root || source.startsWith(root + sep))) {
    throw new Error(
      `'${filePath}' resolves to '${source}', which is outside the places an attachment may be read from ` +
        `(${roots.join(", ")}). Pass an absolute path, or one relative to ${base}.`,
    );
  }
  return source;
}

/** A file name GitHub can receive: one segment, with nothing that ends a URL path. */
function assertFileName(name: string, filePath: string): void {
  if (name === "." || name === ".." || /[/\\\0]/.test(name)) {
    throw new Error(
      `'${name}' is not a file name for '${filePath}'. Pass the name alone — an attachment is uploaded under one ` +
        "name, and a slash would be read as a path.",
    );
  }
}

/**
 * Resolve the files a caller named, or say which one is unusable — before anything is
 * uploaded.
 *
 * **All of them, before the first byte goes out.** An upload cannot be undone — there is
 * no endpoint to delete an asset — so a validation that ran per file would leave the
 * earlier ones on GitHub for nothing, permanently. That is why this is a separate pass
 * rather than a check inside the upload loop.
 *
 * The refusals are gh's, one for one: a directory, a file that is not regular (a named
 * pipe would block the read forever), an empty file (nothing downstream objects, so it
 * uploads and renders broken), an extension that is not on the list, and a size over the
 * ceiling for its kind. `statSync` follows a symlink, which is also gh's rule: the tool
 * reads what the path names.
 */
export function resolveAttachFiles(files: { path: string; name?: string; alt?: string }[]): AttachFile[] {
  const out: AttachFile[] = [];

  for (const file of files) {
    const source = sourceWithinRun(file.path);
    let size: number;
    try {
      const stats = statSync(source);
      if (stats.isDirectory()) {
        throw new Error(`'${file.path}' is a directory (${source}); an attachment is one regular file.`);
      }
      if (!stats.isFile()) {
        throw new Error(
          `'${file.path}' is not a regular file (${source}); a pipe or a device is read forever rather than uploaded.`,
        );
      }
      size = stats.size;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("is a directory") || message.includes("is not a regular file")) throw error;
      throw new Error(`could not read '${file.path}': no such file at ${source}`);
    }
    if (size === 0) {
      throw new Error(`'${file.path}' is empty (${source}); an empty file uploads and renders as a broken attachment.`);
    }

    const name = file.name ?? basename(source);
    assertFileName(name, file.path);
    const type = attachTypeFor(name);
    const ceiling = ceilingFor(type.rendering);
    if (size > ceiling) {
      throw new Error(
        `${source} is ${size} bytes, and ${ceilingReason(type.rendering, ceiling)}. ` +
          `'.${type.extension}' is a ${type.rendering}, so nothing was uploaded.`,
      );
    }

    out.push({
      path: file.path,
      source,
      name,
      alt: altFor(file, name, type),
      size,
      rendering: type.rendering,
      contentType: type.contentType,
    });
  }

  return out;
}

/** The alt text an image carries, or the refusal of one given to a file that has nowhere to put it. */
function altFor(file: { path: string; alt?: string }, name: string, type: AttachType): string | null {
  if (type.rendering === "video" && file.alt !== undefined) {
    throw new Error(
      `'${file.path}' is a video, and a video renders as a player with no alt attribute, so \`alt\` is refused ` +
        "rather than silently dropped.",
    );
  }
  if (type.rendering === "file" && file.alt !== undefined) {
    throw new Error(
      `'${file.path}' renders as a link, not an image, so \`alt\` would be dropped. The link text is the file's ` +
        "`name`; drop the alt text.",
    );
  }
  if (type.rendering !== "image") return null;

  // gh's fallback, and the web uploader's: the name without its extension, with the
  // remaining dots read as spaces.
  const alt = file.alt ?? name.replace(/\.[^.]*$/, "").replaceAll(".", " ");
  if (!isSingleImage(`![${escapeLabel(alt)}](${ALT_PROBE_URL})`, ALT_PROBE_URL)) {
    throw new Error(
      `'${file.path}': alt text '${alt}' cannot be rendered into an image without closing it early, so nothing ` +
        "was uploaded. Remove the brackets and backslashes from `alt`.",
    );
  }
  return alt;
}

/**
 * The markdown a caller can paste so the file appears the way it does when a person
 * attaches one.
 *
 * A video is the URL ALONE. That is not an omission: markdown has no video syntax, and
 * GitHub promotes a bare URL into a player only when it is the whole content of a
 * paragraph — which is why the tool description says so, and why wrapping it in a link
 * would render as a link.
 */
export function markdownFor(file: Pick<AttachFile, "rendering" | "name" | "alt">, url: string): string {
  if (file.rendering === "image") return `![${escapeLabel(file.alt ?? "")}](${url})`;
  if (file.rendering === "video") return url;
  return `[${escapeLabel(file.name)}](${url})`;
}

/**
 * The two hosts `attach_file` talks to, kept as one value so the pairing cannot drift.
 *
 * These are arguments only so a contract test can point them at a local server; a run
 * always gets the constants. The upload host is `uploads.github.com` — the one endpoint
 * gh's own `--attach` posts to — and it is never derived from a URL a caller supplies.
 */
export interface AttachHosts {
  api: string;
  uploads: string;
}

const PRODUCTION_HOSTS: AttachHosts = { api: "https://api.github.com", uploads: "https://uploads.github.com" };

/** The headers both calls carry. The token is the run's, and this is the only tool here that sends it. */
function attachHeaders(token: string): Record<string, string> {
  return { authorization: `token ${token}`, accept: "application/vnd.github+json" };
}

/**
 * The repository's numeric id, which the upload endpoint requires.
 *
 * Not the `owner/name` it is spelled with everywhere else: `repository_id` is the REST
 * `id`, and that is what ties the asset to the repository it was attached in.
 */
export async function repositoryIdFor(repo: string, token: string, hosts: AttachHosts = PRODUCTION_HOSTS): Promise<number> {
  const url = `${hosts.api.replace(/\/+$/, "")}/repos/${repo}`;
  const response = await fetch(url, {
    method: "GET",
    headers: attachHeaders(token),
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_ABORT_MS),
  });
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    if (response.status === 404) {
      throw new Error(
        `GET ${url} answered 404, so the repository's numeric id could not be read and nothing was uploaded. Either ` +
          "the token cannot see this repository, or GITHUB_REPOSITORY names one that does not exist.",
      );
    }
    throw new Error(`GET ${url} answered ${response.status}, so nothing was uploaded.`);
  }
  const body = (await response.json()) as { id?: unknown };
  if (typeof body.id !== "number" || body.id <= 0) {
    throw new Error(`GET ${url} answered without a numeric repository id, so nothing was uploaded.`);
  }
  return body.id;
}

/**
 * POST one file's bytes to the upload endpoint and return the asset URL.
 *
 * The body is a `Bun.file`, so the bytes stream from disk instead of being held in memory
 * — a video may be 100MB. `redirect: "manual"` because a hop is not expected and a
 * followed one would send the bytes somewhere unchosen.
 */
export async function uploadAttachment(
  file: AttachFile,
  repositoryId: number,
  token: string,
  hosts: AttachHosts = PRODUCTION_HOSTS,
): Promise<string> {
  const url = new URL("/user-attachments/assets", `${hosts.uploads.replace(/\/+$/, "")}/`);
  url.searchParams.set("name", file.name);
  url.searchParams.set("content_type", file.contentType);
  url.searchParams.set("repository_id", String(repositoryId));

  const started = Date.now();
  log(`attach_file ${file.source} ${file.size}B as ${file.name}`);
  const response = await fetch(url.href, {
    method: "POST",
    headers: { ...attachHeaders(token), "content-type": "application/octet-stream" },
    body: Bun.file(file.source),
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_ABORT_MS),
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).trim().slice(0, 500);
    throw new Error(uploadRefusal(response.status, response.headers, file, url.href, detail));
  }

  let asset: { url?: unknown };
  try {
    asset = (await response.json()) as { url?: unknown };
  } catch {
    throw new Error(`${url.href} answered 200 with a body that is not JSON, so the asset URL could not be read.`);
  }
  if (typeof asset.url !== "string" || !asset.url) {
    throw new Error(`${url.href} answered 200 without an asset URL.`);
  }
  // The URL is returned to a caller that pastes it into a comment, so the same two-host
  // allowlist `fetch_attachment` reads through holds it: an answer naming any other host
  // is not an attachment address, whatever it says.
  let parsed: URL;
  try {
    parsed = new URL(asset.url);
  } catch {
    throw new Error(`${url.href} answered with '${asset.url}', which is not an absolute URL.`);
  }
  if (!attachmentUrlAllowed(parsed)) {
    throw new Error(
      `${url.href} answered with '${asset.url}', which is not an attachment address — this tool returns only ` +
        "`https://github.com/user-attachments/...` and `https://private-user-images.githubusercontent.com/...`.",
    );
  }

  log(`attach_file ${file.name} ${file.size}B in ${Date.now() - started}ms`);
  return asset.url;
}

/**
 * What to say when the endpoint refuses a file.
 *
 * The 404 is the one worth writing out: this endpoint answers 404 rather than 403 when
 * the credential may not write, so the status code alone points at the wrong problem. The
 * token's own kind is the second reading, because since gh 2.103 the question of which
 * GitHub App installation may attach is settled by the server and not by the client — the
 * run's token is github-actions[bot]'s, and whether that installation may upload has not
 * been measured.
 *
 * Takes the status and headers rather than a `Response`, so the whole mapping is checkable
 * without a server.
 */
export function uploadRefusal(
  status: number,
  headers: Headers,
  file: Pick<AttachFile, "name">,
  url: string,
  detail: string,
): string {
  if (status === 404) {
    return (
      `${url} answered 404 for '${file.name}', so nothing was attached. This endpoint answers 404 rather than 403 ` +
      "when the credential cannot write, so it means one of two things: the run's token has no write access to the " +
      "repository, or this token's kind — a github-actions[bot] installation token — is not one the endpoint accepts " +
      "for attachments. Which of the two it is has not been measured; if the github tools can write to this " +
      "repository, the token's kind is the answer."
    );
  }
  if (status === 422) {
    return (
      `${url} answered 422 for '${file.name}', so nothing was attached: the endpoint refused the file itself. ` +
      `Its message: ${detail || "(none)"}`
    );
  }
  if (status === 429) {
    const retryAfter = headers.get("retry-after");
    return (
      `${url} answered 429 for '${file.name}': rate limited, and nothing was attached. ` +
      (retryAfter ? `Retry after ${retryAfter} seconds.` : "No Retry-After header was sent, so wait and try again.") +
      " This tool does not retry on its own."
    );
  }
  if (status >= 300 && status < 400) {
    return (
      `${url} answered ${status} with a redirect to '${headers.get("location") ?? "(no location)"}'. This tool does ` +
      "not follow redirects on an upload, so nothing was attached."
    );
  }
  return `${url} answered ${status} for '${file.name}', so nothing was attached. ${detail}`.trim();
}

/**
 * Attach files to the thread: this is the tool that spends the token.
 *
 * Every file is validated first (`resolveAttachFiles`), then uploaded one at a time. A
 * failure stops the loop — gh's behaviour — and the error carries the URLs already
 * returned, because an asset cannot be deleted and dropping the URL would leave a file on
 * GitHub that nothing knows the address of.
 */
async function attachFile(a: z.infer<typeof ATTACH_SCHEMA>): Promise<string> {
  const token = (process.env.GH_TOKEN ?? "").trim();
  if (!token) {
    throw new Error(
      "GH_TOKEN is not in this server's environment, so nothing can be uploaded. This is the one tool here that " +
        "sends a credential; the server receives it through `tools.servers.attachments.env` in tools.yaml, which " +
        "the runner writes from the run's own token.",
    );
  }
  const repo = resolveRepo();
  const files = resolveAttachFiles(a.files);
  const id = await repositoryIdFor(repo, token);

  const uploaded: { path: string; url: string; markdown: string; contentType: string }[] = [];
  for (const file of files) {
    try {
      const url = await uploadAttachment(file, id, token);
      uploaded.push({ path: file.path, url, markdown: markdownFor(file, url), contentType: file.contentType });
    } catch (error) {
      const kept =
        uploaded.length === 0
          ? "Nothing was uploaded before it."
          : `The ${uploaded.length} uploaded before it cannot be deleted from GitHub, so their URLs are still worth ` +
            `having: ${uploaded.map((entry) => `${entry.path} -> ${entry.url}`).join("; ")}`;
      throw new Error(`${(error as Error).message} ${kept}`);
    }
  }

  return JSON.stringify({ files: uploaded, uploaded: uploaded.length }, null, 2);
}

