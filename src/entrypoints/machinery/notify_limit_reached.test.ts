import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { runWithFakeGh, scriptPath } from "./testing/harness.ts";

describe("notify_limit_reached.ts", () => {
  test("mentions the notify login when given", () => {
    const r = runWithFakeGh(
      scriptPath("notify_limit_reached.ts"),
      ["--number", "7", "--agent", "engineer", "--notify", "octocat"],
      { rules: [{ match: ["issue", "comment"] }] },
    );
    expect(r.status).toBe(0);
    const commentCall = r.ghCalls.find((c) => c.includes("comment"));
    expect(commentCall?.join(" ")).toContain("@octocat");
    expect(commentCall?.join(" ")).toContain("engineer");
  });

  test("omits the mention when notify is not given", () => {
    const r = runWithFakeGh(scriptPath("notify_limit_reached.ts"), ["--number", "7", "--agent", "engineer"], {
      rules: [{ match: ["issue", "comment"] }],
    });
    expect(r.status).toBe(0);
    const commentCall = r.ghCalls.find((c) => c.includes("comment"));
    expect(commentCall?.join(" ")).not.toContain("@");
  });

  /**
   * The three ways a run stops itself are one event to this notice -- the session
   * survives and a person decides whether to retry -- and three sentences, because
   * what they do next differs. A run that looped is the one where retrying is most
   * likely to work, and "ran out of time" would send them to re-scope instead.
   */
  test("names the repetition loop rather than saying it ran out of time", () => {
    const r = runWithFakeGh(
      scriptPath("notify_limit_reached.ts"),
      ["--number", "7", "--agent", "engineer", "--notify", "octocat", "--ended-because", "loop"],
      { rules: [{ match: ["issue", "comment"] }] },
    );
    expect(r.status).toBe(0);
    const commentCall = r.ghCalls.find((c) => c.includes("comment"))?.join(" ");
    expect(commentCall).toContain("got stuck repeating itself");
    expect(commentCall).not.toContain("ran out of time");
  });

  /**
   * One sentence, and nothing else. The tally lives on the result comment's footer
   * (`post_result_comment.ts`), computed once: a second script reading the same session
   * to say the same thing is the duplication this repository keeps deleting, and this
   * copy would be the one nobody reads. Pinned as the shape of the body, so re-adding
   * it here is a test failure rather than a quiet second carrier on the thread.
   */
  test("carries the sentence a person acts on, and no tally", () => {
    const r = runWithFakeGh(
      scriptPath("notify_limit_reached.ts"),
      ["--number", "7", "--agent", "engineer", "--notify", "octocat", "--ended-because", "iterations"],
      { rules: [{ match: ["issue", "comment"] }] },
    );
    expect(r.status).toBe(0);
    const call = r.ghCalls.find((c) => c.includes("comment")) ?? [];
    const text = call[call.indexOf("--body") + 1] ?? "";
    expect(text).toContain("ran out of iterations");
    expect(text).toContain("@octocat");
    expect(text).not.toContain("Spent on");
    // The tag, then the one line: no third line for a tally to live on.
    expect(text.split("\n").length).toBe(2);
  });

  test("still says ran out of time for the clock", () => {
    const r = runWithFakeGh(
      scriptPath("notify_limit_reached.ts"),
      ["--number", "7", "--agent", "engineer", "--ended-because", "runtime"],
      { rules: [{ match: ["issue", "comment"] }] },
    );
    expect(r.status).toBe(0);
    const commentCall = r.ghCalls.find((c) => c.includes("comment"))?.join(" ");
    expect(commentCall).toContain("ran out of time");
  });
});
