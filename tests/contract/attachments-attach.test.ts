import { afterAll, describe, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hermeticEnv } from "../../src/entrypoints/machinery/testing/harness.ts";
import {
  ATTACH_BUDGET_MS,
  ATTACH_SCHEMA,
  IMAGE_LIMIT_BYTES,
  MAX_ATTACH_FILES,
  REQUEST_ABORT_MS,
  UPLOAD_LIMIT_BYTES,
  VIDEO_LIMIT_BYTES,
  attachFile,
  attachTypeFor,
  isSingleImage,
  markdownFor,
  repositoryIdFor,
  resolveAttachFiles,
  supportedExtensions,
  uploadAttachment,
  uploadRefusal,
} from "../../src/entrypoints/tools/mcp/attachments.ts";

/**
 * `attach_file`, held to what it will send, what it refuses, and what shape comes back.
 *
 * The far end is measured on #489's thread, not here: an upload is reached with the run's
 * own GitHub token, and a pull request has neither the token nor a guarantee that the
 * endpoint accepts its kind — `shell` has no credential at all and `fetch` cannot set an
 * Authorization header. What a pull request CAN hold is everything that does not need
 * GitHub to answer: the allowlist, the size table, the markdown shapes, the error mapping,
 * and the host check on the returned URL. Those are exactly the parts that decide whether
 * a real call attaches a picture or something else.
 *
 * The requests are driven against a local server — the endpoint and the repository-id read
 * are arguments for precisely that reason — so the shapes are real: a streamed body with
 * its byte count, a query string, a header, and a returned URL that is not an attachment
 * address.
 *
 * The facts this rests on are gh's own uploader (cli/cli `internal/attachments/client.go`
 * and `userasset.go`, read on #489): one POST to
 * `https://uploads.github.com/user-attachments/assets` with `name`, `content_type` and
 * `repository_id` in the query and the bytes as the body, a JSON `{"url": ...}` back, 404
 * for "cannot write" rather than 403, 422 for a file the server refuses, and 429 with
 * `Retry-After`. What makes all of the validation happen before the first byte is gh's own
 * comment: there is no endpoint to delete an asset.
 */

/** The directories this test makes, removed in `afterAll`. */
const made: string[] = [];

function scratch(): string {
  const dir = mkdtempSync(join("/tmp", "atomaton-attach-"));
  made.push(dir);
  return dir;
}

/** A file of `bytes` bytes with the given name, in a directory under `/tmp`. */
function fileOf(dir: string, name: string, bytes: number): string {
  const path = join(dir, name);
  writeFileSync(path, Buffer.alloc(bytes, 7));
  return path;
}

afterAll(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});

describe("attach_file accepts what GitHub renders and refuses the rest", () => {
  test("every documented image and media type is accepted, with the type the endpoint expects", () => {
    const media: [string, string][] = [
      ["png", "image/png"],
      ["gif", "image/gif"],
      ["jpg", "image/jpeg"],
      ["jpeg", "image/jpeg"],
      ["svg", "image/svg+xml"],
      ["mp4", "video/mp4"],
      ["mov", "video/quicktime"],
      ["webm", "video/webm"],
    ];
    for (const [extension, contentType] of media) {
      const type = attachTypeFor(`a.${extension}`);
      expect(type.contentType, extension).toBe(contentType);
      expect(type.rendering, `${extension} renders in place, so it is not a link`).not.toBe("file");
    }
  });

  /**
   * The other half of the documentation's list, held as a sample rather than in full: a
   * type dropped from the table is a file a run can produce and cannot attach, and the
   * refusal names the whole list so the caller can see what is missing.
   */
  test("a non-media document is accepted and renders as a link", () => {
    for (const extension of ["pdf", "docx", "xlsx", "csv", "zip", "txt", "md", "json", "yaml", "py", "sh", "mp3"]) {
      expect(attachTypeFor(`a.${extension}`).rendering, extension).toBe("file");
    }
  });

  test("an unsupported extension is refused, and the refusal says what would work", () => {
    expect(() => attachTypeFor("a.exe")).toThrow(/not a file type this tool attaches/);
    expect(() => attachTypeFor("a.exe")).toThrow(/\.png/);
    expect(supportedExtensions()).toContain(".mp4");
    // A name with no extension is its own message: the extension is what decides, not the bytes.
    expect(() => attachTypeFor("Makefile")).toThrow(/has no extension/);
    // Case is folded, because a `.PNG` off a camera is still a PNG.
    expect(attachTypeFor("a.PNG").contentType).toBe("image/png");
  });

  test("the size ceilings are GitHub's, and video is the one the server decides", () => {
    expect(IMAGE_LIMIT_BYTES).toBe(10 * 1024 * 1024);
    expect(VIDEO_LIMIT_BYTES).toBe(100 * 1024 * 1024);
    expect(UPLOAD_LIMIT_BYTES).toBe(25 * 1024 * 1024);
  });
});

describe("nothing is uploaded until every file has passed", () => {
  test("a refused file names itself, and the whole call is refused", () => {
    const dir = scratch();
    const good = fileOf(dir, "shot.png", 64);
    const bad = fileOf(dir, "installer.exe", 64);
    expect(() => resolveAttachFiles([{ path: good }, { path: bad }])).toThrow(/installer\.exe/);
    expect(() => resolveAttachFiles([{ path: good }, { path: bad }])).toThrow(/not a file type/);
  });

  test("an empty file, a directory and a path that is not a file are all refused", () => {
    const dir = scratch();
    expect(() => resolveAttachFiles([{ path: fileOf(dir, "empty.txt", 0) }])).toThrow(/is empty/);
    expect(() => resolveAttachFiles([{ path: dir }])).toThrow(/is a directory/);
    expect(() => resolveAttachFiles([{ path: join(dir, "missing.png") }])).toThrow(/no such file/);
  });

  /** Outside the work tree and `/tmp` there is no file a run may hand to GitHub. */
  test("a path outside the work tree and /tmp is refused", () => {
    expect(() => resolveAttachFiles([{ path: "/etc/hostname" }])).toThrow(
      /outside the places an attachment may be read from/,
    );
  });

  test("a size over the ceiling for its kind is refused, and the message names the kind", () => {
    const dir = scratch();
    const big = fileOf(dir, "big.png", IMAGE_LIMIT_BYTES + 1);
    expect(() => resolveAttachFiles([{ path: big }])).toThrow(/10485760 bytes/);
    expect(() => resolveAttachFiles([{ path: big }])).toThrow(/ceiling for an image/);

    // A video of the same size is fine: the endpoint is the authority on the plan's limit.
    const video = fileOf(dir, "clip.mp4", IMAGE_LIMIT_BYTES + 1);
    expect(resolveAttachFiles([{ path: video }])[0]!.size).toBe(IMAGE_LIMIT_BYTES + 1);
  });

  test("the name GitHub receives is the caller's, and cannot be a path", () => {
    const dir = scratch();
    const file = fileOf(dir, "shot.png", 32);
    expect(resolveAttachFiles([{ path: file, name: "before-and-after.png" }])[0]!.name).toBe("before-and-after.png");
    expect(resolveAttachFiles([{ path: file }])[0]!.name).toBe("shot.png");
    expect(() => resolveAttachFiles([{ path: file, name: "../shot.png" }])).toThrow(/is not a file name/);
  });

  /**
   * Alt text exists on an image and nowhere else. Refused rather than dropped, because a
   * caller that passed one meant it to appear, and it will not.
   */
  test("alt text is kept on an image and refused where it cannot render", () => {
    const dir = scratch();
    expect(resolveAttachFiles([{ path: fileOf(dir, "shot.png", 16) }])[0]!.alt).toBe("shot");
    expect(resolveAttachFiles([{ path: fileOf(dir, "shot.png", 16), alt: "before" }])[0]!.alt).toBe("before");
    expect(() => resolveAttachFiles([{ path: fileOf(dir, "clip.mp4", 16), alt: "x" }])).toThrow(/no alt attribute/);
    expect(() => resolveAttachFiles([{ path: fileOf(dir, "report.pdf", 16), alt: "x" }])).toThrow(/renders as a link/);
  });
});

describe("the markdown a caller pastes", () => {
  test("an image is an image, a video is the bare URL, anything else is a link", () => {
    const url = "https://github.com/user-attachments/assets/9f6c";
    expect(markdownFor({ rendering: "image", name: "shot.png", alt: "before" }, url)).toBe(`![before](${url})`);
    expect(markdownFor({ rendering: "video", name: "clip.mp4", alt: null }, url)).toBe(url);
    expect(markdownFor({ rendering: "file", name: "report.pdf", alt: null }, url)).toBe(`[report.pdf](${url})`);
  });

  /**
   * Two characters are the whole of this rule: `]` closes the bracket early and `(` would
   * start a URL the caller did not choose, so alt text carrying either is escaped rather
   * than rendered as markup. `isSingleImage` is the check that the escaping worked, and it
   * is the same check `resolveAttachFiles` runs before uploading — an upload cannot be
   * undone, so a broken render has to be caught on this side.
   */
  test("alt text cannot close the image early", () => {
    const url = "https://github.com/user-attachments/assets/1";
    const rendered = markdownFor({ rendering: "image", name: "a.png", alt: "a](https://evil.example/b)" }, url);
    expect(rendered).not.toContain("](https://evil.example/b)(");
    expect(isSingleImage(rendered, url), `${rendered} must parse as one image at ${url}`).toBe(true);

    const dir = scratch();
    expect(
      resolveAttachFiles([{ path: fileOf(dir, "shot.png", 16), alt: "a](https://evil.example/b)" }])[0]!.alt,
    ).toBe("a](https://evil.example/b)");
  });

  test("a link's own text is escaped the same way", () => {
    const url = "https://github.com/user-attachments/assets/2";
    expect(markdownFor({ rendering: "file", name: "notes[1].txt", alt: null }, url)).toBe(`[notes\\[1\\].txt](${url})`);
  });
});

/**
 * The request itself, against a local server.
 *
 * `hosts` is an argument for exactly this: the endpoint's address and the repository-id
 * read are the two things this test cannot get from GitHub, and everything around them —
 * the query, the header, the streamed body, the reading of the answer — is real.
 */
describe("attach_file's request and its answer", () => {
  const seen: {
    path: string;
    query: Record<string, string>;
    authorization: string | null;
    contentType: string | null;
    bytes: number;
    method: string;
  }[] = [];
  let next: () => Response = () => Response.json({ url: "https://github.com/user-attachments/assets/abc123" });

  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    async fetch(request) {
      const url = new URL(request.url);
      const bytes = request.body ? (await new Response(request.body).arrayBuffer()).byteLength : 0;
      seen.push({
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
        authorization: request.headers.get("authorization"),
        contentType: request.headers.get("content-type"),
        bytes,
        method: request.method,
      });
      return next();
    },
  });
  const origin = `http://127.0.0.1:${server.port}`;
  const hosts = { api: origin, uploads: origin };

  afterAll(() => server.stop(true));

  test("the repository's numeric id is read from the API, with the token", async () => {
    seen.length = 0;
    next = () => Response.json({ id: 424242 });
    expect(await repositoryIdFor("owner/repo", "t0ken", hosts)).toBe(424242);
    expect(seen[0]!.path).toBe("/repos/owner/repo");
    expect(seen[0]!.method).toBe("GET");
    expect(seen[0]!.authorization).toBe("token t0ken");
  }, 30_000);

  test("the upload is one POST with name, content_type and repository_id, and the bytes as the body", async () => {
    seen.length = 0;
    next = () => Response.json({ url: "https://github.com/user-attachments/assets/abc123" });
    const dir = scratch();
    const [file] = resolveAttachFiles([{ path: fileOf(dir, "shot.png", 4096) }]);

    const url = await uploadAttachment(file!, 424242, "t0ken", hosts);

    expect(url).toBe("https://github.com/user-attachments/assets/abc123");
    expect(seen.length).toBe(1);
    const request = seen[0]!;
    expect(request.method).toBe("POST");
    expect(request.path).toBe("/user-attachments/assets");
    expect(request.query.name).toBe("shot.png");
    expect(request.query.content_type).toBe("image/png");
    expect(request.query.repository_id).toBe("424242");
    expect(request.authorization).toBe("token t0ken");
    expect(request.contentType).toBe("application/octet-stream");
    // Streamed from disk rather than read into memory, and still the whole file.
    expect(request.bytes).toBe(4096);
  }, 30_000);

  /** The URL is pasted into a comment, so it is held to the allowlist `fetch_attachment` reads through. */
  test("an asset URL on another host is refused rather than returned", async () => {
    next = () => Response.json({ url: "https://evil.example/user-attachments/assets/1" });
    const dir = scratch();
    const [file] = resolveAttachFiles([{ path: fileOf(dir, "shot.png", 32) }]);
    await expect(uploadAttachment(file!, 1, "t", hosts)).rejects.toThrow(/is not an attachment address/);
  }, 30_000);

  test("an answer that carries no asset URL at all is refused", async () => {
    next = () => Response.json({ nope: true });
    const dir = scratch();
    const [file] = resolveAttachFiles([{ path: fileOf(dir, "shot.png", 32) }]);
    await expect(uploadAttachment(file!, 1, "t", hosts)).rejects.toThrow(/without an asset URL/);
  }, 30_000);
});

/**
 * The status codes, which are the whole of what a caller can act on.
 *
 * gh's table, one for one, and the 404 is the reason this is written out: the endpoint
 * answers 404 rather than 403 when the credential may not write, so the status alone points
 * at the wrong problem. The run's token is a github-actions[bot] installation token, and
 * whether the endpoint accepts that kind is the one thing #489 could not measure — so the
 * refusal names both readings instead of choosing one.
 */
describe("what each refusal from the endpoint means", () => {
  const file = { name: "a.png" };
  const url = "https://uploads.github.com/user-attachments/assets?name=a.png";

  test("404 names both readings: no write access, and a token kind the endpoint may refuse", () => {
    const text = uploadRefusal(404, new Headers(), file, url, "");
    expect(text).toContain("404");
    expect(text).toContain("write access");
    expect(text).toContain("github-actions[bot]");
    expect(text).toMatch(/not been measured/);
  });

  test("422 passes the endpoint's own message through", () => {
    expect(uploadRefusal(422, new Headers(), file, url, "file is too large")).toContain("file is too large");
  });

  test("429 carries Retry-After and says nothing was retried", () => {
    const text = uploadRefusal(429, new Headers({ "retry-after": "30" }), file, url, "");
    expect(text).toContain("Retry after 30 seconds");
    expect(text).toContain("does not retry");
    expect(uploadRefusal(429, new Headers(), file, url, "")).toContain("wait and try again");
  });

  test("a redirect is reported rather than followed", () => {
    const text = uploadRefusal(302, new Headers({ location: "https://elsewhere.example/x" }), file, url, "");
    expect(text).toContain("redirect");
    expect(text).toContain("https://elsewhere.example/x");
    expect(text).toContain("nothing was attached");
  });

  test("anything else reports its status", () => {
    expect(uploadRefusal(500, new Headers(), file, url, "")).toContain("answered 500");
  });
});

/**
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
    process.env.GH_TOKEN = "t0ken";
    process.env.GITHUB_REPOSITORY = "owner/repo";
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

describe("the interface the agents are handed", () => {
  test("the schema takes files, each with an optional name and alt", () => {
    const parsed = ATTACH_SCHEMA.parse({ files: [{ path: "/tmp/a.png" }] });
    expect(parsed.files).toHaveLength(1);
    expect(parsed.files[0]!.name).toBeUndefined();
    expect(() => ATTACH_SCHEMA.parse({ files: [] })).toThrow();
    expect(() => ATTACH_SCHEMA.parse({})).toThrow();
  });

  /**
   * `tools/list`, from the server itself.
   *
   * The schema test above reads the definition; this reads what an agent is actually
   * handed, including the description — which is where a model learns that a video's
   * markdown is a bare URL on its own paragraph, and a wrong description there is a video
   * that renders as a link.
   */
  test("attach_file is offered, and its description says what comes back", async () => {
    const response = await sendRequest({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
    const tools = response.result.tools as { name: string; description: string; inputSchema: any }[];
    const tool = tools.find((candidate) => candidate.name === "attach_file");
    expect(tool, "no attach_file tool").toBeDefined();
    expect(Object.keys(tool!.inputSchema.properties).sort()).toEqual(["files"]);
    expect(tool!.inputSchema.properties.files.items.required).toEqual(["path"]);
    expect(tool!.description).toContain("markdown");
    expect(tool!.description, "a video renders only on its own paragraph").toMatch(
      /own paragraph|whole content of a paragraph/,
    );
    expect(tool!.description, "an upload cannot be undone").toContain("deleted");
  }, 30_000);

  /**
   * A call with no token fails before it can reach GitHub, and says why.
   *
   * The runner routes `GH_TOKEN` to this server through `tools.servers.attachments.env` in
   * `tools.yaml`. A server started by hand without it is the case that would otherwise
   * produce an unauthenticated request and a bare `401`.
   */
  test("without GH_TOKEN the call is refused, and the refusal says where the token comes from", async () => {
    const dir = scratch();
    const response = await sendRequest(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "attach_file", arguments: { files: [{ path: fileOf(dir, "shot.png", 32) }] } },
      },
      { GH_TOKEN: "" },
    );
    expect(response.result.isError).toBe(true);
    expect(response.result.content[0].text).toContain("GH_TOKEN");
    expect(response.result.content[0].text).toContain("tools.servers.attachments.env");
  }, 30_000);
});

/** Send one JSON-RPC request to the attachments server and resolve its first response line. */
function sendRequest(request: Record<string, unknown>, env: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    // `process.execPath` rather than `"bun"`: importing the server here runs its own
    // hardening, which drops world-writable directories from PATH — a place a `bun`
    // installed through npm lives.
    const child = spawn(process.execPath, ["run", join(process.cwd(), "src/entrypoints/tools/mcp/attachments.ts")], {
      env: { ...hermeticEnv(), GITHUB_REPOSITORY: "owner/repo", ...env },
      cwd: process.cwd(),
    });
    let out = "";
    let err = "";
    child.stderr.on("data", (d) => (err += d.toString()));
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`timed out waiting for a response; stderr=${err}`));
    }, 20_000);
    child.stdout.on("data", (d) => {
      out += d.toString();
      const line = out.split("\n").find((candidate) => candidate.trim());
      if (!line) return;
      clearTimeout(timer);
      child.kill();
      try {
        resolve(JSON.parse(line));
      } catch (error) {
        reject(error);
      }
    });
    child.stdin.write(JSON.stringify(request) + "\n");
  });
}
