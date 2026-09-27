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
