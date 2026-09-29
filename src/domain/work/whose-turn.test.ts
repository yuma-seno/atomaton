import { describe, expect, test } from "bun:test";
import { requestOutstanding, turnEvents, whoseTurn, type TurnReaders } from "./whose-turn.ts";

/**
 * The readers, stubbed. The real ones live in `adapters/github/tags.ts` and
 * `parse_comment_command.ts`; what this module owns is the fold over their answers,
 * so the tests hand it the answers directly.
 */
const readers: TurnReaders = {
  isAgentResult: (body) => body.startsWith("RESULT"),
  handedOff: (body) => body.includes("handoff"),
  asksForAgent: (body) => body.startsWith("/"),
};

const events = (bodies: string[]) => turnEvents(bodies, readers);

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
