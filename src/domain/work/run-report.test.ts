import { describe, expect, test } from "bun:test";
import {
  askUnanswered,
  endingLeftBy,
  lastEndingComment,
  parseRunTitle,
  releasesLabel,
  turnClaimedBy,
  type DatedComment,
} from "./run-report.ts";
import { endingWalkReaders, readers } from "../../adapters/github/thread.ts";

/**
 * The run watch's judgement, asked of strings alone. The readers are the REAL
 * ones (`endingWalkReaders`), because the mapping under test — that `done`,
 * `stopped` and `limit` return the node, that `handoff` keeps it, that a guard
 * quotation is nobody's ending — is the mapping the thread machinery itself
 * uses, and a test's own copy of it would test the copy.
 *
 * #285 replaced the two time gates with the thread's own identity: the claim
 * (`turnClaimedBy`) and the ending (`endingLeftBy`) are compared BY RUN ID, and
 * `askUnanswered` is what makes the watch's notice a once-per-ask event. The
 * time gates' tests — the marker-inside-lifetime branches, the command fallback's
 * four conditions — died with them; what stands here is the comparison and the
 * quotation rule the walks share.
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

/**
 * The identity gates (#285): the claim and the ending are compared BY RUN ID — the
 * watch's two questions are now reads of the thread, and the tests fix the
 * comparisons the estimations replaced.
 */
describe("turnClaimedBy / endingLeftBy", () => {
  const RUN = 424242;
  const OTHER = 999999;
  const ASK = 55;
  const claim = (ask = ASK, run = RUN) => `<!-- atomaton:llm-context=exclude -->\n<!-- atomaton:took=${ask} run=${run} -->`;
  const ended = (verb: string, answers: number, run: number, agent?: string) =>
    [...(agent ? [`<!-- atomaton:agent=${agent} -->`] : []), `<!-- atomaton:ended=${verb} answers=${answers} run=${run} -->`].join("\n");

  test("the claim names the ask the run took, by run id", () => {
    expect(turnClaimedBy(commentsWith(claim()), RUN, endingWalkReaders)).toBe(ASK);
    expect(turnClaimedBy(commentsWith(claim(ASK, OTHER)), RUN, endingWalkReaders)).toBeUndefined();
    expect(turnClaimedBy(commentsWith("just a remark"), RUN, endingWalkReaders)).toBeUndefined();
  });

  test("the ending is the run's own, by run id", () => {
    expect(endingLeftBy(commentsWith(ended("done", ASK, RUN)), RUN, endingWalkReaders)).toBe(true);
    expect(endingLeftBy(commentsWith(ended("done", ASK, OTHER)), RUN, endingWalkReaders)).toBe(false);
    // An old-format ending does not parse, and an unreadable ending is not an
    // ending: the watch keeps its silence on a thread it cannot read.
    expect(endingLeftBy(commentsWith("<!-- atomaton:ended=done -->"), RUN, endingWalkReaders)).toBe(false);
  });

  test("an ended tag inside a guard quotation is the deleted author's words, not an ending", () => {
    const quotation = [
      "<!-- atomaton:llm-context=exclude -->",
      "<!-- atomaton:quotes=123 -->",
      "Your comment was removed because a run holds the turn on this issue/PR.",
      "<details><summary>Your comment, as you wrote it</summary>",
      "",
      "```",
      ended("done", ASK, RUN),
      "```",
      "",
      "</details>",
    ].join("\n");
    // The quotation carries the watched run's own ids — a walk that read it would
    // excuse the run for an ending that is a deleted person's comment.
    expect(endingLeftBy(commentsWith(quotation), RUN, endingWalkReaders)).toBe(false);
    expect(turnClaimedBy(commentsWith(quotation), RUN, endingWalkReaders)).toBeUndefined();
    expect(lastEndingComment(commentsWith(quotation), endingWalkReaders)).toBeUndefined();
  });

  test("the watch notices only the claimed-and-unanswered pair", () => {
    // Claimed and answered: the run reported, silence.
    const reported = commentsWith(claim(), ended("done", ASK, RUN));
    expect(turnClaimedBy(reported, RUN, endingWalkReaders)).toBe(ASK);
    expect(endingLeftBy(reported, RUN, endingWalkReaders)).toBe(true);
    // Claimed and unanswered: the notice.
    const dead = commentsWith(claim());
    expect(turnClaimedBy(dead, RUN, endingWalkReaders)).toBe(ASK);
    expect(endingLeftBy(dead, RUN, endingWalkReaders)).toBe(false);
    // Neither: no turn the thread names, silence whatever the conclusion was.
    expect(turnClaimedBy(commentsWith("just a remark"), RUN, endingWalkReaders)).toBeUndefined();
  });

  test("the healed thread reads as answered — the notice is a once-per-ask event", () => {
    // The watch's notice carries `answers=<claimed ask> run=<watch id>`; after it,
    // the ask no longer reads as unanswered, so no later watch posts it again.
    const healed = commentsWith(claim(), ended("done", ASK, 9));
    expect(askUnanswered(healed, ASK, endingWalkReaders)).toBe(false);
    expect(askUnanswered(commentsWith(claim()), ASK, endingWalkReaders)).toBe(true);
    // An old-format ending does not parse, so it answers nothing — and the
    // machinery's `answers=0` matches no ask by construction.
    expect(askUnanswered(commentsWith("<!-- atomaton:ended=done -->"), ASK, endingWalkReaders)).toBe(true);
    expect(askUnanswered(commentsWith(ended("done", 0, 9)), ASK, endingWalkReaders)).toBe(true);
  });
});

describe("releasesLabel", () => {
  const at = "2026-10-22T09:00:00Z";

  test("releases on every ending that returned the node or left it waiting on a child", () => {
    for (const ended of ["done", "stopped", "limit", "waiting"]) {
      expect(releasesLabel(comment(`<!-- atomaton:ended=${ended} answers=0 run=0 -->`, at), endingWalkReaders), ended).toBe(true);
    }
  });

  test("holds on a hand-off, the one ending that leaves the turn with an agent", () => {
    expect(releasesLabel(comment("<!-- atomaton:ended=handoff answers=0 run=0 -->", at), endingWalkReaders)).toBe(false);
  });

  test("holds when the thread names no ending this rule can read", () => {
    expect(releasesLabel(undefined, endingWalkReaders)).toBe(false);
    expect(releasesLabel(comment("just a remark", at), endingWalkReaders)).toBe(false);
  });
});
