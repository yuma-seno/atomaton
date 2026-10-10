import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeConfigDir, runWithFakeGh, scriptPath } from "./testing/harness.ts";

/**
 * `dispatch_post_merge.ts` is the workflow half of the post-merge judgement: it reads
 * the same two body tags `merge_pr` reads, applies the same
 * `decidePostMergeHandoff`, and dispatches the same `dispatchPostMergeAgent`. The
 * tests here pin that it decides the same way the tool does — a person's merge used to
 * skip the judgement entirely, aggregating the parent with the sub-issue still open.
 *
 * Its answer is written to `$GITHUB_OUTPUT` as `reinvoked=`, which is what the
 * aggregate job's `if:` reads, so that is what these assert.
 */
function run(body: string, rules: { match: string[]; stdout?: string; code?: number }[]) {
  const configDir = makeConfigDir({});
  const outDir = mkdtempSync(join(tmpdir(), "atomaton-post-merge-"));
  const outputFile = join(outDir, "github_output");
  try {
    const result = runWithFakeGh(scriptPath("dispatch_post_merge.ts"), [], {
      cwd: configDir,
      rules,
      env: {
        PR_BODY: body,
        PR_NUMBER: "20",
        OWNER: "owner",
        REPO: "repo",
        GITHUB_OUTPUT: outputFile,
      },
    });
    const output = readFileSync(outputFile, "utf8");
    return { ...result, output };
  } finally {
    rmSync(configDir, { recursive: true, force: true });
    rmSync(outDir, { recursive: true, force: true });
  }
}

const open = { match: ["api", "issues/"], stdout: JSON.stringify({ state: "open" }) };
const closed = { match: ["api", "issues/"], stdout: JSON.stringify({ state: "closed", state_reason: "completed" }) };

/** A PR body from an issue run: the two tags `create_pr` injects. */
const BODY = [
  "<!-- atomaton:parent-issue=17 -->",
  "<!-- atomaton:origin-agent=engineer -->",
  "Closes #17",
].join("\n");

describe("dispatch_post_merge.ts", () => {
  test("re-invokes the origin agent when the parent is open", () => {
    const r = run(BODY, [
      // The trigger comment, then the dispatch. `dispatchRunner` posts its marker
      // (`--jq .id`), reads the thread to confirm it (`--paginate`), then dispatches.
      // The thread read must SHOW the marker id 555: that is the freshness probe, and
      // a read that omits it is refused as `unconfirmed`.
      //
      // The specific comment rules come BEFORE the state rule: the fake takes the
      // first match, and the state rule's `["api", "issues/"]` is a substring of every
      // comment path here.
      { match: ["api", "issues/17/comments", "POST"], stdout: "555" },
      { match: ["api", "issues/17/comments", "--paginate"], stdout: JSON.stringify([{ id: 555, body: "<!-- atomaton:dispatch=engineer -->", user: { type: "Bot" } }]) },
      { match: ["issue", "comment"] },
      { match: ["workflow", "run"] },
      open,
    ]);
    expect(r.status).toBe(0);
    expect(r.output).toContain("reinvoked=true");
    const dispatch = r.ghCalls.find((c) => c[0] === "workflow" && c[1] === "run") ?? [];
    expect(dispatch.join(" ")).toContain("agent=engineer");
    expect(dispatch.join(" ")).toContain("number=17");
  });

  test("does not re-invoke anyone when the pull request has no parent", () => {
    const r = run("just a body with no tags", [{ match: ["api", "issues/"] }]);
    expect(r.status).toBe(0);
    expect(r.output).toContain("reinvoked=false");
    expect(r.ghCalls.some((c) => c[0] === "workflow")).toBe(false);
  });

  // The parent already closed (native "Closes #N" beat us to it). Re-invoking an agent
  // to close an already-closed issue is a pointless extra call.
  test("does not re-invoke anyone when the parent is already closed", () => {
    const r = run(BODY, [closed]);
    expect(r.status).toBe(0);
    expect(r.output).toContain("reinvoked=false");
    expect(r.ghCalls.some((c) => c[0] === "workflow")).toBe(false);
  });

  // No origin agent tagged: the aggregate job is the fallback, so this stands down and
  // lets it run -- the same fallback `mergePr`'s `close-directly` case is.
  test("stands down so the aggregate job runs when no origin agent is tagged", () => {
    const r = run("<!-- atomaton:parent-issue=17 -->\nCloses #17", [open]);
    expect(r.status).toBe(0);
    expect(r.output).toContain("reinvoked=false");
    expect(r.ghCalls.some((c) => c[0] === "workflow")).toBe(false);
  });
});
