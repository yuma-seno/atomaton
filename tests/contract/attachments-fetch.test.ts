import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  ATTACHMENT_DIR,
  FETCH_ATTACHMENT_SCHEMA,
  attachmentPathFor,
  attachmentUrlAllowed,
  attachmentUrlFrom,
  downloadAttachment,
} from "../../src/entrypoints/tools/mcp/attachments.ts";

/**
 * `fetch_attachment`, held to what it saves, where it saves it, and what it will not
 * be aimed at.
 *
 * The far end is measured on the issue, not here: a pull request has no credential and
 * the deployed server has no `fetch_attachment` until this merges. What a pull request
 * CAN hold is everything that does not need GitHub to answer — the allowlist, the
 * destination rule, the ceiling, and that a redirect is followed inside the one call —
 * and those are exactly the parts that decide whether a real fetch saves a document
 * or something else entirely. The redirect and the ceiling are driven against a local
 * server, so the shapes are real: a 302 in the same call, and a body that is not
 * buffered past the limit.
 *
 * The measured facts this rests on are #415's, recorded on #12's thread: an anonymous
 * GET of the real asset URL is 302 to a signed `objects.githubusercontent.com` URL that
 * expires in five minutes, and the followed response is 5,867,214 bytes of docx
 * beginning `50 4b 03 04`.
 */
describe("fetch_attachment reads a chat attachment and nothing else", () => {
  test("the two addresses that carry an attachment are the whole allowlist", () => {
    expect(attachmentUrlAllowed(new URL("https://github.com/user-attachments/files/34306035/default.docx"))).toBe(true);
    expect(attachmentUrlAllowed(new URL("https://private-user-images.githubusercontent.com/1/2-a.docx"))).toBe(true);

    expect(attachmentUrlAllowed(new URL("https://example.com/a.docx")), "any other host").toBe(false);
    expect(
      attachmentUrlAllowed(new URL("https://github.com/user/repo/raw/main/a.docx")),
      "github.com, but a repository file — a `git` read, not a chat attachment",
    ).toBe(false);
    expect(attachmentUrlAllowed(new URL("https://github.com.evil.example/user-attachments/files/1/a"))).toBe(false);
    expect(attachmentUrlAllowed(new URL("http://github.com/user-attachments/files/1/a")), "not https").toBe(false);
  });

  test("a refused URL says what it would have read, rather than that it failed", () => {
    expect(() => attachmentUrlFrom("https://example.com/a.docx")).toThrow(/is not an attachment this tool fetches/);
    expect(() => attachmentUrlFrom("https://example.com/a.docx")).toThrow(/github\.com\/user-attachments/);
    expect(() => attachmentUrlFrom("not a url")).toThrow(/is not an absolute URL/);
  });

  /**
   * The two names, which is why `filename` is an argument at all: the URL's last
   * segment is what GitHub generated, and the comment shows what the person attached.
   */
  test("the saved name is the caller's, and the URL's last segment when none is given", () => {
    const url = new URL("https://github.com/user-attachments/files/34306035/default.docx");
    expect(attachmentPathFor(url)).toBe(join(ATTACHMENT_DIR, "default.docx"));
    expect(attachmentPathFor(url, { filename: "ペダル.docx" })).toBe(join(ATTACHMENT_DIR, "ペダル.docx"));
    expect(attachmentPathFor(url, { dir: "/tmp/atomaton-workspace/elsewhere" })).toBe(
      "/tmp/atomaton-workspace/elsewhere/default.docx",
    );
  });

  /**
   * The destination is under `/tmp` or it is refused. A file inside the checkout is
   * this run's work: it would be committed by `commit_and_push` as part of the change
   * nobody reviewed, which is the failure the refusal exists to make impossible.
   */
  test("a directory outside /tmp, or a name that is a path, is refused", () => {
    const url = new URL("https://github.com/user-attachments/files/34306035/default.docx");
    expect(() => attachmentPathFor(url, { dir: ".github" })).toThrow(/outside \/tmp/);
    expect(() => attachmentPathFor(url, { filename: "../escape.docx" })).toThrow(/is not a file name/);
  });

  test("the advertised schema takes a url and an optional name", () => {
    const parsed = FETCH_ATTACHMENT_SCHEMA.parse({ url: "https://github.com/user-attachments/files/1/a.docx" });
    expect(parsed.filename).toBeUndefined();
    expect(parsed.dir).toBeUndefined();
    expect(() => FETCH_ATTACHMENT_SCHEMA.parse({})).toThrow();
  });
});

/**
 * The two behaviours a local server can settle: the redirect hop and the ceiling.
 *
 * Both are things the shape of a URL cannot show. A redirect kept for a second call is
 * a dead signed URL five minutes later, and a ceiling checked after the body has been
 * buffered is a ceiling that costs 25MB of memory it was meant to save.
 */
describe("fetch_attachment's redirect and ceiling", () => {
  const created: string[] = [];
  const seen: { authorization: string | null }[] = [];

  /** A scratch directory under `/tmp`, which is the only place the tool writes. */
  function scratch(): string {
    const dir = mkdtempSync(join("/tmp", "atomaton-fetch-"));
    created.push(dir);
    return dir;
  }

  const body = Buffer.concat([Buffer.from("504b0304", "hex"), Buffer.from("a docx, for this test's purposes")]);

  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch(request) {
      // Every request's credentials, which is the other half of "this tool sends no
      // token": a header added later would be caught here rather than in a claim.
      seen.push({ authorization: request.headers.get("authorization") });
      const path = new URL(request.url).pathname;
      if (path === "/user-attachments/files/1/a.docx") {
        // The shape measured on #415's thread: an asset URL answers a redirect to a
        // signed host, and the bytes are only behind it.
        return new Response(null, { status: 302, headers: { location: "/signed/asset" } });
      }
      if (path === "/signed/asset") {
        return new Response(body, { headers: { "content-type": "application/octet-stream" } });
      }
      if (path === "/big") {
        const chunk = new Uint8Array(1024 * 1024);
        let sent = 0;
        return new Response(
          new ReadableStream({
            pull(controller) {
              // No content-length, so the ceiling is enforced while the body streams —
              // the header check cannot help here, which is the point.
              if (sent > 26) {
                controller.close();
                return;
              }
              sent += 1;
              controller.enqueue(chunk);
            },
          }),
        );
      }
      return new Response("not found", { status: 404 });
    },
  });
  const origin = `http://127.0.0.1:${server.port}`;

  afterAll(() => {
    server.stop(true);
    for (const dir of created) rmSync(dir, { recursive: true, force: true });
  });

  test("the redirect is followed inside the call, and the target's bytes are what is saved", async () => {
    const dir = scratch();
    const dest = attachmentPathFor(new URL("https://github.com/user-attachments/files/1/a.docx"), {
      dir,
      filename: "ペダル.docx",
    });

    const saved = await downloadAttachment(`${origin}/user-attachments/files/1/a.docx`, dest);

    expect(saved.bytes).toBe(body.length);
    expect(saved.contentType).toBe("application/octet-stream");
    const written = readFileSync(dest);
    expect(written.equals(body)).toBe(true);
    expect(written.subarray(0, 2).toString("latin1"), "the zip signature a docx begins with").toBe("PK");
  });

  test("no Authorization header reaches the host, whatever the URL", async () => {
    const dir = scratch();
    seen.length = 0;
    await downloadAttachment(
      `${origin}/signed/asset`,
      attachmentPathFor(new URL("https://github.com/user-attachments/files/1/a.docx"), { dir }),
    );
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((request) => request.authorization === null)).toBe(true);
  });

  test("a body past the 25MB ceiling stops the read and writes nothing", async () => {
    const dir = scratch();
    const dest = join(dir, "big.bin");
    await expect(downloadAttachment(`${origin}/big`, dest)).rejects.toThrow(/over the 26214400-byte limit/);
    expect(existsSync(dest), "a truncated file would be indistinguishable from a whole one").toBe(false);
  });

  test("a refusal is reported as one, and nothing is written", async () => {
    const dir = scratch();
    const dest = join(dir, "missing.docx");
    await expect(downloadAttachment(`${origin}/nothing`, dest)).rejects.toThrow(/answered 404/);
    expect(existsSync(dest)).toBe(false);
  });
});
