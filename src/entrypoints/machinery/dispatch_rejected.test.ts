import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeConfigDir, runWithFakeGh, scriptPath } from "./testing/harness.ts";

/**
 * `dispatch_rejected.ts` is the workflow half of the rejection hand-off (#267):
 * a pull request closed WITHOUT merging is returned to its origin agent, as a
 * judgement for it to make -- the machine closes nothing on this path. The
 * tests here pin the four answers of `decideRejectionHandoff` as the script
 * carries them, the shape of the directive (tagged for the model, carrying the
 * situation and not the verdict), and the one thing this route has that the
 * merge route does not: no fallback, so a dispatch that did not go out fails
 * the job instead of ending it silently.
 */
function run(body: string, rules: { match: string[]; stdout?: string; code?: number }[], issueNumber = "17") {
  const configDir = makeConfigDir({});
  try {
    return runWithFakeGh(scriptPath("dispatch_rejected.ts"), [], {
      cwd: configDir,
      rules,
      env: {
        PR_BODY: body,
        PR_NUMBER: "20",
        ISSUE_NUMBER: issueNumber,
        OWNER: "owner",
        REPO: "repo",
      },
    });
  } finally {
    rmSync(configDir, { recursive: true, force: true });
  }
}

const open = { match: ["api", "issues/"], stdout: JSON.stringify({ state: "open" }) };
const closed = { match: ["api", "issues/"], stdout: JSON.stringify({ state: "closed", state_reason: "completed" }) };

/** A PR body from an issue run: the two tags `create_pr` injects. */
const BODY = [
  "<!-- atomaton:parent-issue=17 -->",
  "<!-- atomaton:origin-agent=engineer -->",
].join("\n");

/** The argv of the API write that posts the rejection directive (also its marker). */
function directiveComment(ghCalls: string[][]): string[] | undefined {
  return ghCalls.find(
    (c) => c.some((a) => a.includes("issues/17/comments")) && c.includes("POST") &&
      (c[c.indexOf("-f") + 1] ?? "").includes("closed without merging"),
  );
}

describe("dispatch_rejected.ts", () => {
  test("returns the close to the origin agent when the issue is still open", () => {
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

    // The directive is the first thing posted, and it is tagged for the model:
    // it is the first user message the re-invoked agent reads, so it must reach
    // it -- and it names the situation, not the verdict.
    const comment = directiveComment(r.ghCalls);
    expect(comment, "the rejection directive is posted before anything is dispatched").toBeDefined();
    const body = comment?.[comment.indexOf("-f") + 1] ?? "";
    expect(body).toContain("atomaton:llm-context=include");
    expect(body).toContain("atomaton:dispatch=engineer");
    expect(body).toContain("closed without merging");
    expect(body).toContain("#20");

    const dispatch = r.ghCalls.find((c) => c[0] === "workflow" && c[1] === "run") ?? [];
    expect(dispatch.join(" ")).toContain("agent=engineer");
    expect(dispatch.join(" ")).toContain("type=issue");
    expect(dispatch.join(" ")).toContain("number=17");
    // The directive's id is the ask: one comment serves as the first user message,
    // the dispatch marker, and the turn the run claims.
    expect(dispatch.join(" ")).toContain("ask=555");
    expect(r.ghCalls.filter((c) => c.some((a) => a.includes("issues/17/comments")) && c.includes("POST"))).toHaveLength(1);
    // The thread walk names nobody in this fixture, so the field is sent empty
    // -- the point is that notify travels with the dispatch, not who it is here.
    expect(dispatch.join(" ")).toContain("notify=");
  });

  test("dispatches nothing when posting the directive fails, and fails the job", () => {
    const r = run(BODY, [{ match: ["api", "issues/17/comments", "POST"], code: 1 }, open]);
    // No fallback exists on this side. The merge route stands the aggregate job
    // up; here a hand-off that did not happen must be visible, so the job goes
    // red rather than ending silently.
    expect(r.status).toBe(1);
    expect(r.ghCalls.some((c) => c[0] === "workflow")).toBe(false);
  });

  test("does nothing when the issue is already closed", () => {
    const r = run(BODY, [closed]);
    expect(r.status).toBe(0);
    // Not even the directive: an issue a person closed stays a person's.
    expect(directiveComment(r.ghCalls)).toBeUndefined();
    expect(r.ghCalls.some((c) => c[0] === "workflow")).toBe(false);
  });

  test("does nothing when no origin agent is tagged", () => {
    const r = run("<!-- atomaton:parent-issue=17 -->", [open]);
    expect(r.status).toBe(0);
    expect(directiveComment(r.ghCalls)).toBeUndefined();
    expect(r.ghCalls.some((c) => c[0] === "workflow")).toBe(false);
  });

  test("does nothing when the pull request has no linked issue at all", () => {
    const r = run("just a body with no tags", [{ match: ["api", "issues/"] }], "");
    expect(r.status).toBe(0);
    // The state read is skipped with it: there is no number to read.
    expect(r.ghCalls).toHaveLength(0);
  });
});
