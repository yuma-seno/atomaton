import { describe, expect, test } from "bun:test";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  REQUEST_ABORT_MS,
  UPLOAD_LIMIT_BYTES,
  interpret,
  readFileFor,
  requestUrlFor,
} from "../../src/entrypoints/tools/mcp/attachments.ts";

/**
 * The shape the probe sends, held here because the endpoint's meaning depends on
 * it exactly: an empty `name` that is PRESENT is what makes the 400 an answer
 * about the endpoint rather than about a missing parameter, and `repository_id`
 * being absent is what the routing answer is about. The far end is measured
 * after a merge — this is the half of the check that can run on a pull request,
 * with no credential and nothing stored.
 */
describe("the probe's request shape", () => {
  test("endpoint mode sends name, content_type and repository_id, with an empty name", () => {
    const url = requestUrlFor("endpoint", { repositoryId: 1234, name: undefined, contentType: "application/octet-stream" });
    expect(url).toContain("name=");
    expect(url).toContain("content_type=application%2Foctet-stream");
    expect(url).toContain("repository_id=1234");
    // Empty, not absent: the difference between a validation error the endpoint
    // sends and a parameter gh would never have omitted.
    expect(url).not.toContain("name=%22%22");
    expect(url.startsWith("https://uploads.github.com/user-attachments/assets?")).toBe(true);
  });

  test("routing mode omits repository_id, which is what its 404 answer is about", () => {
    const url = requestUrlFor("routing", { repositoryId: undefined, name: undefined, contentType: "application/octet-stream" });
    expect(url).not.toContain("repository_id");
  });

  test("upload and oversize name the file", () => {
    expect(requestUrlFor("upload", { repositoryId: 1, name: "a.png", contentType: "image/png" })).toContain("name=a.png");
  });
});

describe("the probe refuses to measure nothing", () => {
  test("an upload over the ceiling is refused before any request is built", () => {
    const path = join(import.meta.dir, "over-limit.tmp");
    writeFileSync(path, Buffer.alloc(UPLOAD_LIMIT_BYTES + 1));
    try {
      expect(() => readFileFor("upload", path)).toThrow(/over the .* ceiling/);
    } finally {
      rmSync(path);
    }
  });

  test("an oversize run under the ceiling would measure nothing, and is refused", () => {
    const path = join(import.meta.dir, "under-limit.tmp");
    writeFileSync(path, "small");
    try {
      expect(() => readFileFor("oversize", path)).toThrow(/would measure nothing/);
    } finally {
      rmSync(path);
    }
  });
});

/**
 * This server's own abort has to be the one that fires.
 *
 * atoma cuts a `tools/call` off at the server entry's `request_timeout_secs`, and a
 * call cut off there is DISCARDED — the server keeps working, `upload` mode may still
 * store the file, and nobody is waiting for the answer. So the entry must allow more
 * time than the POST this file sends, which is the same relationship `delegate`'s
 * 660 has to its sub-run's 600-second limit.
 */
describe("the endpoint POST gets to time out before atoma gives up on it", () => {
  test("the shipped entry allows longer than the server's own abort", () => {
    const defaults = Bun.YAML.parse(readFileSync("src/entrypoints/tools/defaults.yaml", "utf8")) as {
      servers?: Record<string, { request_timeout_secs?: number }>;
    };
    const allowed = defaults.servers?.attachments?.request_timeout_secs;
    expect(allowed, "the attachments entry declares no request_timeout_secs, so atoma's 60-second default applies").toBeDefined();
    expect(
      allowed! * 1000,
      "atoma would discard the call before this server's own abort, and in upload mode the file may already be stored",
    ).toBeGreaterThan(REQUEST_ABORT_MS);
  });
});

describe("what each status means, per mode", () => {
  test("endpoint: 400 is the expected answer, and the measured message is named when it matches", () => {
    const match = interpret("endpoint", 400, '{"message":"Invalid name for request"}');
    expect(match).toContain("matches the measured expectation");
    expect(match).toContain("the body matches the message measured by hand");

    const other = interpret("endpoint", 400, '{"message":"something else"}');
    expect(other).toContain("matches the measured expectation");
    expect(other).not.toContain("matches the message measured by hand");
  });

  test("endpoint: the statuses that would reopen the design are distinct", () => {
    expect(interpret("endpoint", 401, "")).toContain("reopens");
    expect(interpret("endpoint", 404, "")).toContain("did not route");
    expect(interpret("endpoint", 403, "")).toContain("policy");
    expect(interpret("endpoint", 201, "")).toContain("no documented deletion API");
  });

  test("routing: 404 is the answer gh's source predicts, and nothing else is", () => {
    expect(interpret("routing", 404, "")).toContain("matches the measured expectation");
    expect(interpret("routing", 500, "")).toContain("unexpected");
  });

  test("oversize: 413 settles the ceiling as server-side, 201 contradicts it", () => {
    expect(interpret("oversize", 413, "")).toContain("enforced server-side");
    expect(interpret("oversize", 201, "")).toContain("reopens");
    expect(interpret("oversize", 422, "")).toContain("validation message");
  });

  test("upload: 201 is the only storing answer, and says the URL is permanent", () => {
    expect(interpret("upload", 201, "")).toContain("permanent");
  });

  test("a redirect is reported as a route that moves, and 429 as not-yet", () => {
    expect(interpret("endpoint", 301, "", "https://example.com/elsewhere")).toContain("redirected");
    expect(interpret("endpoint", 429, "")).toContain("rate limited");
  });
});
