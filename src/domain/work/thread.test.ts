import { describe, expect, test } from "bun:test";
import { parseMangledCommand } from "./comment-command.ts";
import {
  latestAsk,
  latestRequestedAgent,
  requestOutstanding,
  shapedThread,
  turnEvents,
  whoseTurn,
  type AskReaders,
  type ThreadEntry,
  type TurnReaders,
} from "./thread.ts";

/**
 * The readers, stubbed. The real ones live in `adapters/github/tags.ts` and
 * `parse_comment_command.ts`; what this module owns is the fold over their answers,
 * so the tests hand it the answers directly.
 */
const readers: TurnReaders = {
  // `RESULT ...` simulates a result comment: it carries an ending AND the result tag.
  // `ENDED ...` simulates a body with an ending and NO result tag -- the failure
  // notice, or a `launch_sub_agent` comment. Both are endings, which is the point.
  ending: (body) => {
    if (body.startsWith("RESULT handoff") || body.startsWith("ENDED handoff")) return "handed-off";
    if (body.startsWith("WAITING")) return "waiting";
    if (body.startsWith("RESULT") || body.startsWith("ENDED")) return "returned";
    return "";
  },
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

  // The session-ending tools' own comment. It carries `waiting` and no result tag --
  // those runs post no result comment, so tagging theirs as one would file a hand-off
  // with the runs that reported.
  test("the machinery's own waiting comment is a waiting event", () => {
    expect(events(["WAITING\nAtomaton: Launched sub-agent(s):"])).toEqual(["waiting"]);
  });

  /**
   * #90: a failed run's notice ends the turn and is NOT a result comment.
   *
   * It used to be read from `isAgentResult` (`atomaton:agent`), which the failure notice
   * does not carry -- so the body was not an event at all, the node's last event stayed
   * the `asked` that started the run, and the guard deleted the very comment the notice
   * told the reader to post. The ending tag is what decides, so a body with an ending
   * and no result tag is still an ending.
   */
  test("an ending with no result tag is still an ending", () => {
    expect(events(["ENDED done -- run failed, session saved"])).toEqual(["returned"]);
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

  // The node's own run is over and the ball is with a child, not with this node's
  // agent -- so a comment here is a person's, and the guard keeps it.
  test("waiting on a child gives the node back to a person", () => {
    expect(whoseTurn(["asked", "waiting"])).toBe("person");
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

  // The defect this fixes: a run ends inside `launch_sub_agent`, posting a `waiting`
  // comment and no result. The `asked` that started it is still in the thread, but the
  // run took it up -- so the aggregation gate may start the parent again. Reading the
  // old `asked` was what refused it with `parent-busy`.
  test("a request a waiting run took up is not outstanding", () => {
    expect(requestOutstanding(["asked", "waiting"])).toBe(false);
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

/**
 * The newest ask somebody stands behind, for the question "was this request answered
 * by a push".
 *
 * The readers are stubbed the way the real ones behave: a command is a line anywhere
 * in a body (a result comment carries its directive at the end), a dispatch marker is
 * a request, and the machinery names its author with a tag the real adapter reads
 * from `atomaton:agent`.
 */
describe("latestAsk", () => {
  const askReaders: AskReaders = {
    ...readers,
    // The real parser is `parseCommentCommand`, which scans every line and reads the
    // dispatch marker as a request. The stub keeps that shape.
    requestedAgent: (body) => {
      for (const raw of body.split("\n")) {
        const line = raw.trim();
        if (line.startsWith("/")) return line.slice(1).split(/\s/)[0]!;
        if (line.startsWith("DISPATCH ")) return line.slice("DISPATCH ".length).split(/\s/)[0]!;
      }
      return "";
    },
    authoringAgent: (body) => /BY (\S+)/.exec(body)?.[1] ?? "",
  };

  /** A comment with a time, as the adapter's read carries it. */
  const timed = (t: string, entry: ThreadEntry): ThreadEntry & { at: string } => ({ ...entry, at: t });

  // #211's thread, end to end: the reviewer's directive, the machinery's marker
  // taking it up, the engineer's result. The newest REQUEST is the marker -- and the
  // marker is the take-up, not the ask, so the ask underneath is what comes back.
  test("the ask a dispatch marker took up is what it finds, and its author wrote it", () => {
    const thread = [
      timed("08:40:00", machine("RESULT handoff BY reviewer\nreview found problems\n/engineer")),
      timed("08:40:20", machine("DISPATCH engineer")),
      timed("08:44:00", machine("RESULT done BY engineer\npushed the fix")),
    ];
    expect(latestAsk("/reviewer", thread, askReaders)).toEqual({
      agent: "engineer",
      author: { kind: "agent", agent: "reviewer" },
      at: "08:40:00",
    });
  });

  test("a person's command is an ask by a person", () => {
    expect(latestAsk("/reviewer", [timed("09:00:00", human("/engineer"))], askReaders)).toEqual({
      agent: "engineer",
      author: { kind: "person" },
      at: "09:00:00",
    });
  });

  // The directive the runner extracted and posted back may have been mangled by the
  // model's markdown. `extract_directive` dispatched it through `lineForms`, so the
  // ask reader must see the same line: otherwise the ask disappears, `latestAsk`
  // returns undefined, and the green verdict re-dispatches the agent the push already
  // answered (#219).
  test("a directive the model's markdown mangled is still an ask", () => {
    const real: AskReaders = { ...askReaders, requestedAgent: (body) => parseMangledCommand(body).agent };
    for (const form of ["- /engineer", "> /engineer", "`/engineer`"]) {
      const thread = [timed("08:40:00", machine(`RESULT handoff BY reviewer\nreview found problems\n\n${form}`))];
      expect(latestAsk("/reviewer", thread, real), form).toEqual({
        agent: "engineer",
        author: { kind: "agent", agent: "reviewer" },
        at: "08:40:00",
      });
    }
  });

  // The body's `/<agent>` line is the node's standing request: a push is part of the
  // work it asked for, not an answer to it. Consuming it would hand the pull request
  // back to its opener on every push.
  test("the body's own line is not an ask a push can answer", () => {
    expect(latestAsk("/reviewer", [], askReaders)).toBeUndefined();
  });

  test("a thread whose only request is a dispatch marker has no ask", () => {
    expect(latestAsk("", [timed("08:40:20", machine("DISPATCH engineer"))], askReaders)).toBeUndefined();
  });

  // The one comment that stops the walk. Routing a newer push's answer to an OLDER
  // asker would be wrong in a way dispatching nobody is not, so an ask the thread
  // cannot attribute ends the search rather than being stepped over.
  test("machinery that asks without naming its author is not routable", () => {
    const thread = [timed("08:30:00", human("/reviewer")), timed("08:35:00", machine("/engineer"))];
    expect(latestAsk("", thread, askReaders)).toBeUndefined();
  });

  // The shaping is the same one every reader uses, so a comment the guard is
  // removing cannot answer this question either.
  test("a person's comment the guard is removing cannot become the ask", () => {
    const thread = [
      timed("08:40:00", machine("RESULT handoff BY reviewer\n/engineer")),
      timed("08:41:00", human("/atomaton")),
    ];
    expect(latestAsk("", thread, askReaders)).toEqual({
      agent: "engineer",
      author: { kind: "agent", agent: "reviewer" },
      at: "08:40:00",
    });
  });

  test("an entry with no time yields an ask with none", () => {
    expect(latestAsk("", [human("/engineer")], askReaders)).toEqual({
      agent: "engineer",
      author: { kind: "person" },
      at: "",
    });
  });

  test("an ordinary comment is not an ask", () => {
    expect(latestAsk("", [timed("08:00:00", human("looks good"))], askReaders)).toBeUndefined();
  });

  // The machinery's notice preserving a removed comment: the words inside it are the
  // removed author's, and the machinery already told that author the comment would not
  // be acted on. So the walk steps over the notice and finds the ask underneath — the
  // one the removed comment raced. Without `quoted`, the notice's own `/engineer` line
  // reads as an ask with no authoring tag, and the walk stops there (undefined) —
  // which is the behaviour `quoted` exists to correct.
  test("the walk finds the ask underneath a quotation", () => {
    const notice: ThreadEntry & { at: string } = {
      body: "A comment was removed. As it was written:\n\n/engineer",
      isHuman: false,
      quoted: true,
      at: "08:41:00",
    };
    const thread = [timed("08:40:00", machine("RESULT handoff BY reviewer\n/engineer")), notice];
    expect(latestAsk("", thread, askReaders)).toEqual({
      agent: "engineer",
      author: { kind: "agent", agent: "reviewer" },
      at: "08:40:00",
    });
    expect(latestAsk("", [thread[0]!, { ...notice, quoted: undefined }], askReaders)).toBeUndefined();
  });
});

/**
 * The machinery's notice that preserves a removed person's comment, as a quotation.
 *
 * The guard deleted the comment so it could not name an agent or end a turn; the
 * notice quoting it verbatim must not give that back. Everything in these tests rides
 * on the quoted text being verbatim: it can carry a `/agent` line, or -- if it quoted
 * machinery output -- the tags machinery output carries.
 */
describe("quoted entries", () => {
  const quoted = (body: string): ThreadEntry => ({ body, isHuman: false, quoted: true });

  /**
   * The stubs here mirror the REAL readers' shapes, which the ones at the top of this
   * file deliberately narrow: the ending tag is read ANYWHERE in a body, and a command
   * is ANY line, not the body's start. The quoted text is verbatim, so a tag or a
   * command line sits mid-body where the top stubs cannot see it -- and neither can a
   * test written against them, which would pass for the wrong reason.
   */
  const lineReaders: TurnReaders = {
    ending: (body) => {
      if (body.includes("atomaton:ended=handoff")) return "handed-off";
      if (body.includes("atomaton:ended=done")) return "returned";
      return "";
    },
    requestedAgent: (body) => {
      for (const raw of body.split("\n")) {
        const line = raw.trim();
        if (line.startsWith("/")) return line.slice(1).split(/\s/)[0]!;
      }
      return "";
    },
    isDispatchMarker: (body) => body.startsWith("DISPATCH"),
  };

  // A `/agent` line inside the quoted text must not name the next agent: that would
  // make the deleted comment the request the fold acts on, handing it back the power
  // the guard removed it to take away.
  test("a quotation does not name the next agent, even when the quoted text carries a command", () => {
    const notice = quoted("A comment was removed. As it was written:\n\n/engineer");
    expect(latestRequestedAgent("/reviewer", [machine("RESULT handoff"), notice], lineReaders)).toBe("reviewer");
  });

  // The quoted text is verbatim: if it quoted machinery output, it carries the tags
  // machinery output carries. Reading the ending before the quotation would take the
  // notice for the turn the quoted text names — which the second assertion shows is
  // what an unquoted copy of the same body does.
  test("a quotation is not an event, even when the quoted text carries an ending tag", () => {
    const notice = quoted("A comment was removed. It said:\n\n<!-- atomaton:ended=done -->");
    const shaped = shapedThread([human("/engineer"), notice], lineReaders);
    expect(shaped.events).toEqual(["asked"]);
    expect(shaped.comments).toHaveLength(2);
    expect(shapedThread([human("/engineer"), { ...notice, quoted: undefined }], lineReaders).events).toEqual([
      "asked",
      "returned",
    ]);
  });
});
