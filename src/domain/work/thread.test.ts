import { describe, expect, test } from "bun:test";
import {
  latestRequestedAgent,
  requestOutstanding,
  shapedThread,
  turnEvents,
  whoseTurn,
  type ThreadEntry,
  type TurnReaders,
} from "./thread.ts";

/**
 * The readers, stubbed. The real ones live in `adapters/github/tags.ts` and
 * `parse_comment_command.ts`; what this module owns is the fold over their answers,
 * so the tests hand it the answers directly.
 */
const readers: TurnReaders = {
  isAgentResult: (body) => body.startsWith("RESULT"),
  handedOff: (body) => body.includes("handoff"),
  requestedAgent: (body) => (body.startsWith("/") ? body.slice(1).split(/\s/)[0]! : ""),
  isDispatchMarker: (body) => body.startsWith("DISPATCH"),
};

const events = (bodies: string[]) => turnEvents(bodies, readers);

/** A person's comment, or the machinery's, as the shaping needs them. */
const human = (body: string): ThreadEntry => ({ body, isHuman: true });
const machine = (body: string): ThreadEntry => ({ body, isHuman: false });

describe("turnEvents", () => {
  test("a person's command is the node being handed to an agent", () => {
    expect(events(["/engineer"])).toEqual(["asked"]);
  });

  test("an agent's result that handed off is a hand-off", () => {
    expect(events(["RESULT handoff"])).toEqual(["handed-off"]);
  });

  test("an agent's result that did not is the node coming back", () => {
    expect(events(["RESULT done"])).toEqual(["returned"]);
  });

  // Ordinary discussion does not move the turn. Reading it as though it did would
  // hand the node back to a person every time somebody said anything.
  test("a comment that is neither is not an event", () => {
    expect(events(["looks good to me", "thanks"])).toEqual([]);
  });

  // A result comment may quote a command in its report. The tag is the stronger
  // claim about what the body is, so it is read first.
  test("a result that quotes a command is still a result", () => {
    expect(events(["RESULT done\n\n/engineer was the command"])).toEqual(["returned"]);
  });

  test("the events keep their order", () => {
    expect(events(["/engineer", "RESULT handoff", "RESULT done"])).toEqual([
      "asked",
      "handed-off",
      "returned",
    ]);
  });
});

describe("whoseTurn", () => {
  test("an empty thread is a person's", () => {
    expect(whoseTurn([])).toBe("person");
  });

  test("a command with nothing after it leaves the node with the agent", () => {
    expect(whoseTurn(["asked"])).toBe("agent");
  });

  // The window this exists to close: a person asks, and before the runner starts
  // another person comments. The node is still the agent's.
  test("a hand-off leaves the node with the agent", () => {
    expect(whoseTurn(["asked", "handed-off"])).toBe("agent");
  });

  test("a result that did not hand off gives the node back", () => {
    expect(whoseTurn(["asked", "returned"])).toBe("person");
  });

  // The whole point of reading the last event rather than any of them.
  test("a later command takes the node back from a person", () => {
    expect(whoseTurn(["asked", "returned", "asked"])).toBe("agent");
  });

  test("a later result gives it back again", () => {
    expect(whoseTurn(["asked", "returned", "asked", "returned"])).toBe("person");
  });
});

/**
 * The question a dispatch asks before it starts a run: is there a request nobody has
 * taken up yet?
 *
 * Narrower than `whoseTurn` in one place that matters. A hand-off leaves the node with
 * the agent, so `whoseTurn` reads it as the agent's — but the dispatch that follows a
 * hand-off IS that hand-off being taken up, so it is not outstanding.
 */
describe("requestOutstanding", () => {
  test("nothing asked for, nothing outstanding", () => {
    expect(requestOutstanding([])).toBe(false);
  });

  test("a command nobody has taken up is outstanding", () => {
    expect(requestOutstanding(["asked"])).toBe(true);
  });

  // The dispatch that follows a hand-off is that hand-off being taken up.
  test("a hand-off is not outstanding", () => {
    expect(requestOutstanding(["asked", "handed-off"])).toBe(false);
  });

  test("a result that came back is not outstanding", () => {
    expect(requestOutstanding(["asked", "returned"])).toBe(false);
  });

  test("a command after a result is outstanding again", () => {
    expect(requestOutstanding(["asked", "returned", "asked"])).toBe(true);
  });
});

/**
 * The thread as the guard will leave it, and the agent it asks for.
 *
 * The guard deletes a person's comment made while the ball is with an agent, and the
 * deletion is not instant. Every reader in that window — the guard's own next turn,
 * the validation that resolves who a pull request asks for — has to see the thread the
 * guard is producing, not the one still on the page. So the shaping is one function
 * and both sides use it.
 */
describe("shapedThread", () => {
  const bodies = (entries: ThreadEntry[]) => shapedThread(entries, readers).comments.map((entry) => entry.body);

  test("a person's comment while the ball is with an agent is removed", () => {
    expect(bodies([machine("/engineer"), human("wait, actually")])).toEqual(["/engineer"]);
  });

  test("a person's comment while the ball is with a person is kept", () => {
    expect(bodies([human("please look at this")])).toEqual(["please look at this"]);
  });

  // The machinery's own comments are never removed, whatever they say: a dispatch
  // marker is the machinery taking up a request, and an agent's result is the turn
  // ending. Neither is a person racing a run.
  test("the machinery's comments are never removed", () => {
    expect(bodies([machine("/engineer"), machine("RESULT done")])).toEqual(["/engineer", "RESULT done"]);
  });

  // The whole point of walking in order: the first comment is kept (it starts the
  // turn), the second is removed (the ball is now with the agent).
  test("only the comments that arrived mid-turn are removed", () => {
    expect(bodies([human("/engineer"), human("one more thing")])).toEqual(["/engineer"]);
  });

  // A result gives the ball back, so a comment after it is kept again.
  test("a comment after the ball comes back is kept", () => {
    expect(bodies([human("/engineer"), machine("RESULT done"), human("/reviewer")])).toEqual([
      "/engineer",
      "RESULT done",
      "/reviewer",
    ]);
  });

  // The events come out of the same walk, so a caller never folds them a second time.
  // They are the events of the KEPT comments, which is what makes the shaping and the
  // answer agree.
  test("the events are those of the comments that survived", () => {
    const shaped = shapedThread([human("/engineer"), human("one more thing"), machine("RESULT done")], readers);
    expect(shaped.events).toEqual(["asked", "returned"]);
  });
});

/**
 * Who the node asks for next, from the newest request that survives the shaping.
 *
 * The body is the oldest entry in its own thread, so a person's later comment wins
 * over it — which is the whole point: the body is what the node was opened asking for,
 * and a comment is what somebody is asking for now.
 */
describe("latestRequestedAgent", () => {
  test("nothing asks for an agent", () => {
    expect(latestRequestedAgent("", [human("looks good")], readers)).toBe("");
  });

  test("the body's request is the answer when nobody has commented", () => {
    expect(latestRequestedAgent("/engineer", [], readers)).toBe("engineer");
  });

  // The bug this exists to fix: a person commenting `/reviewer` on a pull request
  // whose body says `/engineer` asked for the reviewer, and reading the body would
  // dispatch the engineer instead.
  test("a person's later comment wins over the body's line", () => {
    expect(latestRequestedAgent("/engineer", [human("/reviewer")], readers)).toBe("reviewer");
  });

  // Read from the SHAPED thread, so a comment the guard is removing does not get to
  // name the next agent in the window before it disappears.
  test("a comment the guard is removing does not name the next agent", () => {
    // `/reviewer` is kept (the ball was with a person when it arrived), `never mind`
    // is removed (the ball is now with the agent).
    expect(latestRequestedAgent("/engineer", [human("/reviewer"), human("never mind")], readers)).toBe("reviewer");
  });

  test("a request that arrived mid-turn is ignored", () => {
    // `/reviewer` starts the turn; `/atomaton` arrives while the ball is with the
    // agent, so it is removed and does not become the answer.
    expect(latestRequestedAgent("/engineer", [human("/reviewer"), human("/atomaton")], readers)).toBe("reviewer");
  });

  // The body is the fallback, not an event: a comment that moves nothing does not
  // displace it.
  test("an ordinary comment leaves the body's request standing", () => {
    expect(latestRequestedAgent("/engineer", [human("looks good")], readers)).toBe("engineer");
  });
});
