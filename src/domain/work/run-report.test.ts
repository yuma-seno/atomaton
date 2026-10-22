import { describe, expect, test } from "bun:test";
import {
  parseRunTitle,
  needsEnding,
  lastEndingComment,
  releasesLabel,
  tookTurn,
  type DatedComment,
  type WatchComment,
} from "./run-report.ts";
import { endingWalkReaders, readers } from "../../adapters/github/thread.ts";

/**
 * The run watch's judgement, asked of strings alone. The readers are the REAL
 * ones (`endingWalkReaders`), because the mapping under test — that `done`,
 * `stopped` and `limit` return the node, that `handoff` keeps it, that a guard
 * quotation is nobody's ending — is the mapping the thread machinery itself
 * uses, and a test's own copy of it would test the copy.
 */

const START = "2026-10-22T10:00:00Z";

function comment(body: string, createdAt: string): DatedComment {
  return { body, createdAt };
}

function commentsWith(...bodies: string[]): DatedComment[] {
  // Timestamped a full day BEFORE the usual run start, unless a test names its own.
  return bodies.map((body, index) => comment(body, `2026-10-2${index}T09:00:00Z`));
}

describe("parseRunTitle", () => {
  test("reads the runner's run-name shape", () => {
    expect(parseRunTitle("engineer on #252")).toEqual({ agent: "engineer", number: 252 });
  });

  test("tolerates surrounding whitespace", () => {
    expect(parseRunTitle("  reviewer on #17 \n")).toEqual({ agent: "reviewer", number: 17 });
  });

  test("reads nothing in the runner's own name, which every run carried before run-name", () => {
    expect(parseRunTitle("Atomaton Runner")).toBeUndefined();
  });

  test("reads nothing in a title that is not this machinery's", () => {
    expect(parseRunTitle("deploy: apply v0.21.22 to .github/")).toBeUndefined();
    expect(parseRunTitle("engineer on #abc")).toBeUndefined();
    expect(parseRunTitle("on #252")).toBeUndefined();
    expect(parseRunTitle("engineer on #252 extra")).toBeUndefined();
    expect(parseRunTitle("")).toBeUndefined();
    expect(parseRunTitle(undefined)).toBeUndefined();
  });

  test("reads the entry workflows' agent-less shape, which their run-name writes", () => {
    expect(parseRunTitle("#252")).toEqual({ agent: undefined, number: 252 });
  });

  test("reads nothing in a node number that cannot exist", () => {
    expect(parseRunTitle("engineer on #0")).toBeUndefined();
    expect(parseRunTitle("engineer on #-3")).toBeUndefined();
    expect(parseRunTitle("#0")).toBeUndefined();
  });
});

describe("needsEnding", () => {
  test("a thread with no ending at all needs one", () => {
    expect(needsEnding([], START, endingWalkReaders)).toBe(true);
    expect(needsEnding(commentsWith("just a remark", "/engineer"), START, endingWalkReaders)).toBe(true);
  });

  test("an ending at or after the run's start means the run reported", () => {
    const comments = commentsWith("<!-- atomaton:ended=done -->\nDone.");
    // One-turn-per-node: the newest ending is the only one that can answer for
    // this run, so "at the start" and "after it" are the same answer.
    expect(needsEnding(comments, "2026-10-20T09:00:00Z", endingWalkReaders)).toBe(false);
    expect(needsEnding(comments, "2026-10-20T08:59:59Z", endingWalkReaders)).toBe(false);
  });

  test("an ending from before the run does not count for it", () => {
    const comments = commentsWith("<!-- atomaton:ended=done -->\nDone.");
    expect(needsEnding(comments, START, endingWalkReaders)).toBe(true);
  });

  test("the newest ending is the one asked", () => {
    const comments = [
      comment("<!-- atomaton:ended=done -->\nOld.", "2026-10-19T09:00:00Z"),
      comment("<!-- atomaton:ended=waiting -->\nChild running.", "2026-10-23T09:00:00Z"),
    ];
    expect(needsEnding(comments, START, endingWalkReaders)).toBe(false);
  });

  test("an ended tag inside a guard quotation is the deleted author's words, not an ending", () => {
    const quotation = [
      "<!-- atomaton:llm-context=exclude -->",
      "<!-- atomaton:quotes=123 -->",
      "Your comment was removed because the ball is with an agent on this issue/PR.",
      "<details><summary>Your comment, as you wrote it</summary>",
      "",
      "```",
      "<!-- atomaton:ended=done -->",
      "```",
      "",
      "</details>",
    ].join("\n");
    // The quotation is the only thing on the thread that looks like an ending, and
    // it came from the run's own lifetime — a walk that read it would stay silent
    // on the jam this module exists to end.
    expect(needsEnding(commentsWith(quotation), START, endingWalkReaders)).toBe(true);
    expect(lastEndingComment(commentsWith(quotation), endingWalkReaders)).toBeUndefined();
  });

  test("an ending whose time cannot be read does not excuse the run", () => {
    expect(needsEnding(commentsWith("<!-- atomaton:ended=done -->"), START, endingWalkReaders)).toBe(true);
    const comments = [comment("<!-- atomaton:ended=done -->\nDone.", START)];
    expect(needsEnding(comments, undefined, endingWalkReaders)).toBe(true);
    expect(needsEnding(comments, "not a timestamp", endingWalkReaders)).toBe(true);
  });
});

describe("tookTurn", () => {
  /** The dispatch marker the machinery posts when it is about to start a run. */
  const MARKER = "<!-- atomaton:dispatch=engineer -->";
  const BEFORE = "2026-10-20T09:00:00Z";
  const DURING = "2026-10-22T11:00:00Z";

  /**
   * The two kinds of watched run the caller distinguishes, by the event that
   * started the run: one whose trigger consumes a person's command (a comment's
   * own run), and one that never consumes one (a run a new issue started — the
   * shape that mistook the command for its own). The event names stay with the
   * caller; the domain sees only this flag.
   */
  const CONSUMES_COMMANDS = true;
  const CONSUMES_NONE = false;
  /** Ended other than by carrying its judgment through — cancelled, failed, timed out. */
  const DIED = true;
  /** Ended `success`: it dispatched, or it decided there was nothing to do. */
  const SUCCEEDED = false;

  function entry(body: string, isHuman: boolean, createdAt: string): WatchComment {
    return { body, isHuman, createdAt };
  }

  test("a marker posted inside the run is the run taking the turn — ungated by either flag", () => {
    // A successful run that dispatched is answered by its marker: the entry run
    // here is one a new issue started (the trigger consumes no command) and it
    // ended `success`, and the marker inside its lifetime still takes the turn.
    expect(tookTurn([entry(MARKER, false, DURING)], START, readers, CONSUMES_NONE, SUCCEEDED)).toBe(true);
  });

  test("a marker older than the run is another run's", () => {
    expect(tookTurn([entry(MARKER, false, BEFORE)], START, readers, CONSUMES_COMMANDS, DIED)).toBe(false);
  });

  test("a person's command written before a dead run started is the run's doing — the cancel case the watch exists for", () => {
    // The command alone on its line, instructions below — what the parser reads.
    // The run died without posting any marker (cancelled, failed, timed out), so
    // the command is the thread's only record that a run was asked for.
    expect(tookTurn([entry("/engineer\nplease fix it", true, BEFORE)], START, readers, CONSUMES_COMMANDS, DIED)).toBe(true);
  });

  test("a person's command is not a successful run's ask — it decided something, and silence is what it decided (#281, second)", () => {
    // A command-consuming run that ended `success` carried its own judgment all
    // the way through: it either dispatched (its marker answers, branch above)
    // or decided there was nothing to do. Either way the command beside it is
    // another run's — here, the one the command itself started and which was
    // still working when this run's watch fired.
    expect(tookTurn([entry("/atomaton\nplease look", true, BEFORE)], START, readers, CONSUMES_COMMANDS, SUCCEEDED)).toBe(false);
  });

  test("a person's command is not a run's ask when that run's trigger consumes no command — at any command time (#281, first)", () => {
    // The watch fired for an entry run a new issue started, three seconds before
    // the person commented; the command's own run was still working. The command
    // was the LIVE ask, but it was not THIS run's doing — the flag alone says so,
    // and success beside it changes nothing.
    expect(tookTurn([entry("/atomaton\nplease look", true, DURING)], START, readers, CONSUMES_NONE, SUCCEEDED)).toBe(false);
    expect(tookTurn([entry("/atomaton\nplease look", true, BEFORE)], START, readers, CONSUMES_NONE, SUCCEEDED)).toBe(false);
  });

  test("a command written during a command-consuming run is the next run's ask, dead or not", () => {
    // With only "the newest ask wins" to go by, a command that raced the run from
    // inside its own lifetime was handed back to it; it belongs to the run it
    // itself starts.
    expect(tookTurn([entry("/engineer\nplease fix it", true, DURING)], START, readers, CONSUMES_COMMANDS, DIED)).toBe(false);
  });

  test("a command that raced a live run does not survive the shaping, so it cannot claim the turn", () => {
    // The person commanded mid-run: the machinery's marker was the live ask, so
    // the shaping drops their comment — the same walk the guard deletes by.
    const comments = [
      entry(MARKER, false, BEFORE),
      entry("/reviewer sneak in", true, "2026-10-21T09:00:00Z"),
    ];
    expect(tookTurn(comments, START, readers, CONSUMES_COMMANDS, DIED)).toBe(false);
  });

  test("an ordinary remark asks for nothing and takes no turn", () => {
    expect(tookTurn([entry("looks broken to me", true, DURING)], START, readers, CONSUMES_COMMANDS, DIED)).toBe(false);
    expect(tookTurn([], START, readers, CONSUMES_COMMANDS, DIED)).toBe(false);
  });

  test("a quotation's ask is the deleted author's, not the machinery's", () => {
    // The quoted flag is the adapter's (`entryOf` reads the tag); the domain folds
    // on the flag, so the test sets it the way the real entry would arrive.
    const quoted: WatchComment = {
      body: ["<!-- atomaton:quotes=9 -->", "<details><summary>Your comment</summary>", "```", "/engineer", "```", "</details>"].join("\n"),
      isHuman: false,
      quoted: true,
      createdAt: DURING,
    };
    expect(tookTurn([quoted], START, readers, CONSUMES_COMMANDS, DIED)).toBe(false);
  });

  test("an unreadable time on a machinery marker lands on silence", () => {
    expect(tookTurn([entry(MARKER, false, "")], START, readers, CONSUMES_COMMANDS, DIED)).toBe(false);
    expect(tookTurn([entry(MARKER, false, DURING)], undefined, readers, CONSUMES_COMMANDS, DIED)).toBe(false);
  });

  test("an unreadable time on a person's command lands on silence too", () => {
    expect(tookTurn([entry("/engineer", true, "")], START, readers, CONSUMES_COMMANDS, DIED)).toBe(false);
    expect(tookTurn([entry("/engineer", true, BEFORE)], undefined, readers, CONSUMES_COMMANDS, DIED)).toBe(false);
  });
});

describe("releasesLabel", () => {
  const at = "2026-10-22T09:00:00Z";

  test("releases on every ending that returned the node or left it waiting on a child", () => {
    for (const ended of ["done", "stopped", "limit", "waiting"]) {
      expect(releasesLabel(comment(`<!-- atomaton:ended=${ended} -->`, at), endingWalkReaders), ended).toBe(true);
    }
  });

  test("holds on a hand-off, the one ending that leaves the turn with an agent", () => {
    expect(releasesLabel(comment("<!-- atomaton:ended=handoff -->", at), endingWalkReaders)).toBe(false);
  });

  test("holds when the thread names no ending this rule can read", () => {
    expect(releasesLabel(undefined, endingWalkReaders)).toBe(false);
    expect(releasesLabel(comment("just a remark", at), endingWalkReaders)).toBe(false);
  });
});
