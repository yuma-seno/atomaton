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

  /**
   * The routing question, reachable at last.
   *
   * Measured on a real run: with an empty `name` the endpoint answers 400
   * `Invalid name for request` BEFORE it looks at `repository_id`, so `routing`
   * measured the name rule and nothing about routing. A non-empty name with no
   * repository_id is the request that asks the routing question, and it is the one
   * the caller's optional `name` exists to make possible — a file is not needed for
   * it, which is what the other modes cannot offer.
   */
  test("routing with a name, and without repository_id, is the pure routing request", () => {
    const url = requestUrlFor("routing", { repositoryId: undefined, name: "probe.md", contentType: "application/octet-stream" });
    expect(url).toContain("name=probe.md");
    expect(url).not.toContain("repository_id");
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
  /**
   * A `400` is what a route that parsed the parameters answers — and what a proxy
   * or an authentication layer in front of a different route answers too. The
   * message used to call it proof that the endpoint is real; a status read as
   * proof of a route is the inference `engineering/secrets-in-a-check` removes,
   * and this is the tool that skill now points at for a re-measurement, so the
   * two cannot disagree.
   */
  test("endpoint: 400 reports the parse rather than the route, and names the measured message when it matches", () => {
    const match = interpret("endpoint", 400, '{"message":"Invalid name for request"}');
    expect(match).toContain("read and rejected for its name");
    expect(match).toContain("not proof the route exists");
    expect(match).toContain("the body matches the message measured by hand");

    const other = interpret("endpoint", 400, '{"message":"something else"}');
    expect(other).toContain("read and rejected for its name");
    expect(other).not.toContain("matches the message measured by hand");
  });

  test("endpoint: the statuses that change the answer are distinct", () => {
    const rejected = interpret("endpoint", 401, "");
    expect(rejected).toContain("rejected by the endpoint");
    // The design does not reopen on a 401 any more: the route was settled on
    // the orphan branch, and a 401 is a credential fact inside a closed
    // question. Held so the "reopens" wording cannot drift back.
    expect(rejected).not.toContain("reopens");
    expect(rejected).toContain("publish_draft");
    expect(interpret("endpoint", 404, "")).toContain("did not route");
    expect(interpret("endpoint", 403, "")).toContain("policy");
    expect(interpret("endpoint", 201, "")).toContain("no documented deletion API");
  });

  test("routing: 404 is the answer gh's source predicts, and nothing else is", () => {
    expect(interpret("routing", 404, "")).toContain("matches the measured expectation");
    expect(interpret("routing", 500, "")).toContain("unexpected");
  });

  /**
   * Measured on a real run, and the reason the `name` argument exists.
   *
   * `routing` with an empty name came back 400 `Invalid name for request` — the same
   * answer `endpoint` gives — so the mode reported a name validation while the agent
   * believed it had measured routing. The interpretation now says so rather than
   * calling it unexpected, and points at the call that does ask the routing question.
   */
  test("routing: a name validation is reported as having measured nothing about routing", () => {
    const named = interpret("routing", 400, '{"message":"Invalid name for request"}');
    expect(named).toContain("before it ever routed");
    expect(named).toContain("non-empty `name`");
    // Any other 400 is not this, and stays "unexpected".
    expect(interpret("routing", 400, '{"message":"something else"}')).toContain("unexpected");
  });

  test("oversize: 413 settles the ceiling as server-side, 201 contradicts it", () => {
    const over = interpret("oversize", 413, "");
    expect(over).toContain("enforced server-side");
    // The ceiling is a fact about this endpoint, not a plan for how a document
    // is delivered: the upload route carries no files, so nothing published is
    // weighed against 25MB. Held so the split-or-regenerate reading — which
    // named an action no run takes any more — cannot drift back.
    expect(over).not.toContain("settled toward pieces");
    expect(over).toContain("carries no files");
    expect(over).toContain("publish_draft");
    const stored = interpret("oversize", 201, "");
    expect(stored).toContain("WAS stored");
    expect(stored).not.toContain("reopens");
    expect(interpret("oversize", 422, "")).toContain("validation message");
  });

  /**
   * The correction #109's measurement started and #111's contrast trial settled,
   * held so it cannot drift back.
   *
   * A 27MB body came back 404 `Not Found`, not 413 — the old text read that as
   * "a token without write access", which its own `endpoint` 400 already ruled
   * out. #111 then posted bodies UNDER the ceiling with the same write-capable
   * `ghs_` token and got the same 404, at three sizes and MIME types: so the
   * cause is the credential's kind, the size reading is dead, and what a reader
   * does with any 404 on this endpoint is deliver by `publish_draft` instead.
   */
  test("oversize: the measured 404 is the credential kind, settled by the under-ceiling trial", () => {
    const text = interpret("oversize", 404, '{"message":"Not Found"}');
    expect(text, "the measured status is named").toContain("404 `Not Found`");
    expect(text, "the settled cause is the credential's kind").toContain("credential kind, not the size");
    expect(text, "the trial that settled it is named").toContain("issues #111 and #164");
    expect(text, "the design consequence, which is what the reader acts on").toContain("publish_draft");
    expect(text, "the old cannot-tell reading is gone").not.toContain("cannot be separated");
    expect(text, "the old size reading is gone").not.toContain("Split or regenerate");
  });

  test("upload: 201 is the only storing answer, and says the URL is permanent", () => {
    expect(interpret("upload", 201, "")).toContain("permanent");
  });

  /**
   * The same contrast trial, on the mode a delivery would have used: a write-capable
   * `ghs_` token gets 404 on every body-bearing POST, so the gh-source role reading
   * is not just uncertain but false, and the text says where files go instead.
   */
  test("upload: the measured 404 is the credential kind, and points at the file route", () => {
    const text = interpret("upload", 404, '{"message":"Not Found"}');
    expect(text, "the settled cause").toContain("refuses real uploads from this credential kind");
    expect(text, "the write access that rules the role reading out is stated").toContain("with write access");
    expect(text, "the delivery route is named").toContain("publish_draft");
    expect(text, "the gh-source reading is gone").not.toContain("without write access on the repository gets 404");
  });

  test("upload: a 401 names the closed route rather than a reopening", () => {
    const text = interpret("upload", 401, "");
    expect(text).toContain("rejected by the endpoint");
    expect(text, "the design does not reopen on a credential fact").not.toContain("reopens");
    expect(text).toContain("publish_draft");
  });

  test("a redirect is reported as a route that moves, and 429 as not-yet", () => {
    expect(interpret("endpoint", 301, "", "https://example.com/elsewhere")).toContain("redirected");
    expect(interpret("endpoint", 429, "")).toContain("rate limited");
  });
});
