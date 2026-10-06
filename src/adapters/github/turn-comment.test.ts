import { describe, expect, test } from "bun:test";
import { turnCommentBody, turnHeader } from "./turn-comment.ts";
import { ENDED_TAG, LLM_CONTEXT_TAG } from "./tags.ts";
import { readers } from "./thread.ts";
import { whoseTurn, turnEvents } from "../../domain/work/thread.ts";

/**
 * The rule, and the bug it comes from.
 *
 * A comment that ends a turn has to carry the ending, because the only thing that
 * answers "is a comment arriving mid-turn?" is the thread's last turn event. #90 was a
 * failure notice with no ending (the guard then deleted the person's `/agent` comment);
 * the close-request path had the same hole, in code written to fix #90, and its comment
 * is the one that ASKS A PERSON TO CLOSE the issue — so a person who agreed and
 * commented had their comment removed and the issue stayed open.
 *
 * The tests below hold both halves of the fix: the tags are written, and the tags READ
 * as a turn ending through the same reader the guard uses. The second is the one that
 * mattered — a comment could carry a tag nobody read, and the first test would pass.
 */
describe("turnCommentBody", () => {
  test("writes the audience as llm-context and the ending as atomaton:ended", () => {
    const forPerson = turnCommentBody({ ended: "done", audience: "person", body: "Ask them to close it." });
    expect(forPerson).toContain(LLM_CONTEXT_TAG.write("exclude"));
    expect(forPerson).toContain(ENDED_TAG.write("done"));
    expect(forPerson.endsWith("Ask them to close it.")).toBe(true);

    const forModel = turnCommentBody({ ended: "waiting", audience: "model", body: "Report." });
    expect(forModel).toContain(LLM_CONTEXT_TAG.write("include"));
    expect(forModel).toContain(ENDED_TAG.write("waiting"));
  });

  test("the two tags lead, in the one order every comment here uses", () => {
    const body = turnCommentBody({ ended: "handoff", audience: "person", body: "line one\nline two" });
    const lines = body.split("\n");
    expect(lines[0]).toBe(LLM_CONTEXT_TAG.write("exclude"));
    expect(lines[1]).toBe(ENDED_TAG.write("handoff"));
    expect(lines[2]).toBe("line one");
  });

  /** The bug, stated as the guard would see it. */
  test("a comment that ends a turn hands the node back to a person, as the guard reads it", () => {
    const askToClose = turnCommentBody({
      ended: "done",
      audience: "person",
      body: "**This issue was opened by a person, so please close it yourself.**",
    });
    // The thread is: a person asked for an agent, then the agent's turn ended here.
    const events = turnEvents(["/engineer", askToClose], readers);
    expect(whoseTurn(events)).toBe("person");
    // Without the ending, the same thread reads as the agent's — which is exactly what
    // deleted the person's agreement to close the issue.
    const withoutEnding = [LLM_CONTEXT_TAG.write("exclude"), "**...please close it yourself.**"].join("\n");
    expect(whoseTurn(turnEvents(["/engineer", withoutEnding], readers))).toBe("agent");
  });

  test("waiting is a handback to a person too, so a comment on it survives", () => {
    const awaitingChildren = turnCommentBody({ ended: "waiting", audience: "person", body: "Launched: #7, #8" });
    expect(whoseTurn(turnEvents(["/atomaton", awaitingChildren], readers))).toBe("person");
  });

  test("handoff keeps the node with the agent, because the next one is on this node", () => {
    const restartedHere = turnCommentBody({ ended: "handoff", audience: "person", body: "Restarting." });
    expect(whoseTurn(turnEvents(["/engineer", restartedHere], readers))).toBe("agent");
  });

  test("turnHeader is the same two lines, for a caller building a body itself", () => {
    const header = turnHeader({ ended: "limit", audience: "person" });
    expect(header).toEqual([LLM_CONTEXT_TAG.write("exclude"), ENDED_TAG.write("limit")]);
  });
});
