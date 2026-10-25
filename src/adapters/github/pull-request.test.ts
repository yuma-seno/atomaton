import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { importable, runWithFakeGh, type FakeGhRule } from "../../entrypoints/machinery/testing/harness.ts";

/**
 * `pull-request.ts` — one read of a pull request, and the four things a caller can be
 * told about it.
 *
 * The cost this file exists for (#345): twelve reads of "this pull request" across
 * seven files, eight of them spelling their own `--json` list. The projection differing
 * was fine and stays a parameter; what could not be seen was that two of them retried a
 * transient failure and the rest did not, so the same blip degraded one answer and ended
 * another. These tests pin the I/O that is now shared — the argv, the retry, and the
 * difference between "GitHub answered", "GitHub could not be read" and "the answer was
 * not a pull request".
 *
 * A child process with a fake `gh`, like `branch-reads.test.ts`: the `gh` seam is an
 * environment variable read when `gh` is spawned, and this file runs inside an Atomaton
 * run whose own `ATOMATON_*` variables would otherwise decide what `gh` is.
 */
const HERE = import.meta.dir;

type Rules = FakeGhRule[];

/** Runs `body` with this module imported, and returns what it printed. */
function run<T>(body: string, rules: Rules): { value: T; ghCalls: string[][] } {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-pull-request-"));
  const file = join(dir, "shim.ts");
  writeFileSync(
    file,
    [
      `const reads = await import(${JSON.stringify(importable(join(HERE, "pull-request.ts")))});`,
      "try {",
      body,
      "} catch (e) {",
      "  process.stdout.write(JSON.stringify({ threw: (e as Error).message }));",
      "}",
    ].join("\n"),
  );
  try {
    const r = runWithFakeGh(file, [], { rules });
    if (r.status !== 0) throw new Error(`shim failed: ${r.stderr || r.stdout}`);
    return { value: JSON.parse(r.stdout) as T, ghCalls: r.ghCalls };
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  }
}

describe("reading a pull request by number", () => {
  test("the projection is the argument, and it is the only thing that varies", () => {
    const { value, ghCalls } = run<{ read: { known: boolean; value?: unknown } }>(
      `const read = reads.readPullRequest("o/r", 7, ["headRefName", "isCrossRepository"]);
       process.stdout.write(JSON.stringify({ read }));`,
      [{ match: ["pr", "view", "7"], stdout: JSON.stringify({ headRefName: "b", isCrossRepository: false }) }],
    );
    expect(value.read).toEqual({ known: true, value: { headRefName: "b", isCrossRepository: false } });
    // The fields arrive as the comma-separated list `gh --json` takes, built in one place
    // from whatever the caller named.
    expect(ghCalls).toEqual([["pr", "view", "7", "--repo", "o/r", "--json", "headRefName,isCrossRepository"]]);
  }, 30_000);

  test("a transient failure is retried, not handed to the caller", () => {
    const { value, ghCalls } = run<{ read: { known: boolean } }>(
      `const read = reads.readPullRequest("o/r", 7, "body");
       process.stdout.write(JSON.stringify({ read }));`,
      [
        // Exactly the blob that used to end a run: one slot of `HTTP 504`.
        { match: ["pr", "view", "7"], attempt: 1, code: 1, stdout: "gh: Server Error (HTTP 504)" },
        { match: ["pr", "view", "7"], stdout: JSON.stringify({ body: "the pull request" }) },
      ],
    );
    expect(value.read.known).toBe(true);
    expect(ghCalls).toHaveLength(2);
  }, 30_000);

  test("a refusal is not an answer, and it names the read", () => {
    const { value } = run<{ read: { known: boolean; why?: string } }>(
      `const read = reads.readPullRequest("o/r", 7, "body");
       process.stdout.write(JSON.stringify({ read }));`,
      [{ match: ["pr", "view", "7"], code: 1, stdout: "gh: Not Found (HTTP 404)" }],
    );
    expect(value.read.known).toBe(false);
    // Named, because GitHub's message does not name it, and a 404 is not retried: it is
    // a real answer about a pull request that is not there.
    expect(value.read.why).toContain("gh pr view 7 --repo o/r");
    expect(value.read.why).toContain("HTTP 404");
  }, 30_000);

  test("an answer that is not JSON is an unknown read, not an exception", () => {
    const { value } = run<{ read: { known: boolean; why?: string } }>(
      `const read = reads.readPullRequest("o/r", 7, "body");
       process.stdout.write(JSON.stringify({ read }));`,
      [{ match: ["pr", "view", "7"], stdout: "[not json" }],
    );
    expect(value.read.known).toBe(false);
    expect(value.read.why).toContain("the answer was not JSON");
  }, 30_000);

  test("the whole object and the diff are the other two projections, each read once", () => {
    const { value, ghCalls } = run<{ object: { known: boolean }; diff: { known: boolean; diff?: string } }>(
      `const object = reads.readPullRequestObject("o/r", 7);
       const diff = reads.readPullRequestDiff("o/r", 7);
       process.stdout.write(JSON.stringify({ object, diff }));`,
      [
        { match: ["api", "repos/o/r/pulls/7", "Accept: application/vnd.github.v3.diff"], stdout: "diff --git a/x b/x" },
        { match: ["api", "repos/o/r/pulls/7"], stdout: JSON.stringify({ title: "t", user: { login: "someone" } }) },
      ],
    );
    expect(value.object.known).toBe(true);
    expect(value.diff).toEqual({ known: true, diff: "diff --git a/x b/x" });
    // Both go to the pull request's own endpoint, and the diff is the same read with a
    // media type — a diff is not JSON, which is the only reason it is a second function.
    expect(ghCalls.map((argv) => argv.slice(0, 4))).toEqual([
      ["api", "repos/o/r/pulls/7"],
      ["api", "repos/o/r/pulls/7", "-H", "Accept: application/vnd.github.v3.diff"],
    ]);
  }, 30_000);
});
