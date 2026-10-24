import { describe, expect, test } from "bun:test";
import { commandsAfterStop, parkEndedNotice, parkExit, stopRequestedNotice } from "./request_stop.ts";
import { stopRequested } from "./watch_for_stop.ts";
import { ENDED_TAG, LLM_CONTEXT_TAG, QUOTES_TAG, STOP_TAG } from "../../adapters/github/tags.ts";

describe("request_stop.ts", () => {
  // The notice IS the request: the running job polls for this tag. A notice that
  // reads well and carries no tag would tell the person a stop is coming and stop
  // nothing.
  test("carries the tag the running job polls for", () => {
    expect(STOP_TAG.has(stopRequestedNotice("octocat", true, []))).toBe(true);
  });

  // A stop must not become the next run's context, and neither must the notice
  // about it.
  test("is excluded from the agent's context", () => {
    expect(stopRequestedNotice("octocat", true, [])).toContain(LLM_CONTEXT_TAG.write("exclude"));
  });

  // A receipt, not a call to action. The run posts its own result comment seconds
  // later and mentions them there; a mention here would be a second notification for
  // one event, saying what the other one is about to say.
  test("names whose comment it was, and notifies nobody", () => {
    const notice = stopRequestedNotice("octocat", true, []);
    expect(notice).toContain("octocat's");
    expect(notice).not.toContain("@octocat");
    expect(stopRequestedNotice("", true, [])).toContain("The `/stop` comment");
  });

  // The existing in-progress guard also deletes comments. Someone whose `/stop`
  // vanished with no explanation could not tell which of the two happened.
  test("says what became of the comment, either way", () => {
    expect(stopRequestedNotice("octocat", true, [])).toContain("was removed");
    expect(stopRequestedNotice("octocat", false, [])).toContain("could not be removed");
  });

  // The lag is what people will misread: a stop is picked up on the next poll and
  // taken at the next turn, so the agent can finish a tool call and start another.
  test("says the stop is not immediate, and that the run will report", () => {
    const notice = stopRequestedNotice("octocat", true, []);
    expect(notice).toContain("current step");
    expect(notice).toContain("report here");
    // The run saves the session; until it has, this cannot say so.
    expect(notice).not.toContain("session is saved");
    expect(notice).not.toContain("/resume");
  });

  // A stop reaches the work under the issue it was typed on, so the notice names
  // what it reached. It used to name the opposite -- the work it could NOT reach,
  // with instructions to go and stop each piece by hand.
  test("names the work under this issue that the stop also reached", () => {
    const notice = stopRequestedNotice("octocat", true, [12, 13]);
    expect(notice).toContain("#12, #13");
    expect(notice).toContain("also reached");
    expect(notice).not.toContain("does not reach");
    // One command brings all of it back, which is the half that makes the reach fair.
    expect(notice).toContain("/resume");
  });

  test("says nothing about other work when the stop reached none", () => {
    expect(stopRequestedNotice("octocat", true, [])).not.toContain("also reached");
  });
});

/**
 * #297: a comment whose first command is `/stop` skips the in-progress/commands guard,
 * because a stop has to reach the running agent. The parser then acts on the stop and
 * drops the rest, and until this existed the person was never told.
 */
describe("stopRequestedNotice on a comment that also carried commands", () => {
  const extra = { commands: ["/reviewer"], original: "/stop\n/reviewer", commentId: 77 };

  test("names what it carried, and says it did not run", () => {
    const notice = stopRequestedNotice("octocat", true, [], extra);
    expect(notice).toContain("It also carried `/reviewer`");
    expect(notice).toContain("not acted on");
    expect(notice).toContain("once the run has reported");
    // The tag is on the receipt; whether that tag is READ is a separate question, and the
    // one that was wrong -- see "is a stop the running job acts on" below.
    expect(STOP_TAG.has(notice)).toBe(true);
    expect(notice).toContain("was removed");
  });

  /**
   * The regression for #297's review. Deleted-and-quoted is the one receipt shape that
   * carries BOTH tags, and the stop poll refused every body that quoted anybody -- so
   * `/stop` + `/reviewer` removed the comment, said the run would stop, and stopped
   * nothing. Asserting on the reader is the point: asserting the tag exists was what
   * let this through.
   */
  test("is a stop the running job acts on", () => {
    const notice = stopRequestedNotice("octocat", true, [], extra);
    const since = new Date("2026-09-06T12:00:00Z");
    expect(stopRequested([{ body: notice, created_at: "2026-09-06T12:00:30Z" }], since)).toBe(true);
  });

  test("keeps the words, tagged as a quotation", () => {
    const original = "/stop\n/reviewer\n\nLook at the tests first, then the error paths.";
    const notice = stopRequestedNotice("octocat", true, [], { commands: ["/reviewer"], original, commentId: 77 });
    expect(notice).toContain(QUOTES_TAG.write(77));
    expect(notice).toContain("<details>");
    expect(notice).toContain("Look at the tests first, then the error paths.");
    // The receipt is not model context; the quotation inside it must not become context
    // either, and the quoted command lines must not read as fresh requests.
    expect(LLM_CONTEXT_TAG.has(notice)).toBe(true);
  });

  test("does not quote a comment it could not remove", () => {
    const notice = stopRequestedNotice("octocat", false, [], extra);
    expect(notice).toContain("could not be removed");
    expect(notice).not.toContain("<details>");
    expect(notice).not.toContain(QUOTES_TAG.write(77));
    // The person still has to know the second command did not run.
    expect(notice).toContain("/reviewer");
  });

  test("says each one, for more than two commands", () => {
    const notice = stopRequestedNotice("octocat", true, [], {
      commands: ["/reviewer", "/engineer"],
      original: "/stop\n/reviewer\n/engineer",
      commentId: 78,
    });
    expect(notice).toContain("`/reviewer`, `/engineer`");
    expect(notice).toContain("each of them");
  });
});

describe("commandsAfterStop", () => {
  test("is empty for a comment that only stops", () => {
    expect(commandsAfterStop("/stop")).toEqual([]);
    expect(commandsAfterStop("")).toEqual([]);
  });

  test("names the rest in the order they were written", () => {
    expect(commandsAfterStop("/stop\n/reviewer\n/engineer")).toEqual(["/reviewer", "/engineer"]);
  });

  // A malformed line is what the person has to rewrite, so the receipt shows it as it
  // was written -- the same choice the commands guard makes.
  test("shows a malformed line as it was written", () => {
    expect(commandsAfterStop("/stop\n/engineer fix it")).toEqual(["/engineer fix it"]);
  });

  test("does not count a command quoted inside prose", () => {
    expect(commandsAfterStop("/stop\n> /reviewer")).toEqual([]);
  });

  // #311: a fenced sample is not a request anywhere -- the entry and the thread do not
  // take it -- so the receipt must not name it as something "not acted on".
  test("does not name a command quoted inside a fence", () => {
    const body = ["/stop", "", "The format:", "", "```html", "/reviewer", "```"].join("\n");
    expect(commandsAfterStop(body)).toEqual([]);
  });
});

/**
 * 判断4's exit, as the reviewer of the first cut forced into shape: a park's claim
 * has no run left to answer it, so the person's stop writes the ending — but only
 * when the hold really is a park. Both gates exist because an ending written in the
 * wrong state is a lie with the guard's weight behind it: on a live run it releases
 * the guard mid-turn, reopening the interruption window 案1 closed, and on a
 * re-invoked parent it pre-empts the ending that run will write itself.
 */
describe("parkExit", () => {
  test("a park ends: the ending closes the claim the waiting ending held open", () => {
    expect(parkExit({ ask: 5, run: 7, parked: true, claimed: false })).toEqual({ ask: 5, run: 0 });
  });

  test("a live run's claim is never ended by a stop receipt", () => {
    // Not a park: the newest event is an `asked` or nothing, because a running
    // claim writes no turn event.
    expect(parkExit({ ask: 5, run: 7, parked: false, claimed: false })).toBeUndefined();
  });

  test("a re-invoked parent working on the parked ask is not ended either", () => {
    // The newest event is still the park's `waiting`, but the newest comment is
    // the re-invoked run's claim: a live run holds the ball, and its own ending
    // will answer it.
    expect(parkExit({ ask: 12, run: 9, parked: true, claimed: true })).toBeUndefined();
  });

  test("no claim, no exit", () => {
    expect(parkExit(undefined)).toBeUndefined();
  });
});

describe("parkEndedNotice", () => {
  test("carries the ending that closes the parked claim", () => {
    const notice = parkEndedNotice({ ask: 5, run: 0 });
    expect(notice).toContain(ENDED_TAG.write({ verb: "stopped", answers: 5, run: 0 }));
    // Out of the model's context, like every notice addressed to a person.
    expect(notice).toContain(LLM_CONTEXT_TAG.write("exclude"));
    expect(notice).toContain("came back to you");
  });

  // The ending is its own comment rather than a line on the receipt: a receipt that
  // quotes the stopped comment carries `atomaton:quotes`, and the thread skips a
  // quotation whole — an ending inside one would reach no reader and the park would
  // stay shut.
  test("is not a quotation, so the readers see the ending", () => {
    expect(parkEndedNotice({ ask: 5, run: 0 })).not.toContain(QUOTES_TAG.marker);
  });
});
