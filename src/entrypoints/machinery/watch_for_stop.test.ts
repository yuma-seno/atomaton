import { describe, expect, test } from "bun:test";
import { stopRequested, type StopComment } from "./watch_for_stop.ts";
import { STOP_TAG, LLM_CONTEXT_TAG, QUOTES_TAG } from "../../adapters/github/tags.ts";

const REQUEST = `${STOP_TAG.write("requested")}\n@someone Atomaton: stop requested.`;

describe("watch_for_stop.ts", () => {
  const since = new Date("2026-09-06T12:00:00Z");

  test("finds a stop request posted after the run started", () => {
    const comments: StopComment[] = [{ body: REQUEST, created_at: "2026-09-06T12:00:30Z" }];
    expect(stopRequested(comments, since)).toBe(true);
  });

  // Without the cutoff an issue that was ever stopped could never be worked on
  // again: every later run would find the old request on its first poll.
  test("ignores a stop request from an earlier run", () => {
    const comments: StopComment[] = [{ body: REQUEST, created_at: "2026-09-01T09:00:00Z" }];
    expect(stopRequested(comments, since)).toBe(false);
  });

  test("ignores ordinary comments", () => {
    const comments: StopComment[] = [
      { body: "please stop", created_at: "2026-09-06T12:00:30Z" },
      { body: "/stop", created_at: "2026-09-06T12:00:31Z" },
    ];
    expect(stopRequested(comments, since)).toBe(false);
  });

  // A stop somebody asked for must not be dropped because a timestamp was
  // unreadable. Stopping one run early is recoverable with a comment; the other
  // direction is a run nobody can interrupt.
  test("acts on a request whose timestamp cannot be read", () => {
    expect(stopRequested([{ body: REQUEST, created_at: "not a date" }], since)).toBe(true);
    expect(stopRequested([{ body: REQUEST }], since)).toBe(true);
  });

  test("nothing at all is not a stop", () => {
    expect(stopRequested([], since)).toBe(false);
  });

  // The guard's notice preserving a removed comment carries that comment verbatim, and
  // machinery text quotes machinery text: a stop tag inside the quoted text is the
  // DELETED author's words, on a notice whose own line says the comment will not be
  // acted on. Reading it would stop a run that nobody asked to stop.
  test("a stop tag inside a quoted notice is not a stop request", () => {
    const notice = [
      "<!-- atomaton:llm-context=exclude -->",
      "<!-- atomaton:quotes=7 -->",
      "@octocat Your comment was removed because the ball is with an agent on this issue/PR.",
      "<details><summary>Your comment, as you wrote it</summary>",
      "",
      "```",
      REQUEST,
      "```",
      "",
      "</details>",
    ].join("\n");
    expect(stopRequested([{ body: notice, created_at: "2026-09-06T12:00:30Z" }], since)).toBe(false);
  });

  // The rule is about whose words the tag is in, not about the body quoting anybody: a
  // stop receipt quotes the removed comment AND carries the stop tag in its own prose,
  // and it is a stop (#297). `proseOnly` is what separates them -- preserved text is
  // fenced, the notice's own speech is not.
  test("a stop tag in a notice's own prose is a request, even when it quotes", () => {
    const receipt = [
      LLM_CONTEXT_TAG.write("exclude"),
      QUOTES_TAG.write(77),
      STOP_TAG.write("requested"),
      "Atomaton: stop requested.",
      "```",
      "/stop",
      "/reviewer",
      "```",
    ].join("\n");
    expect(stopRequested([{ body: receipt, created_at: "2026-09-06T12:00:30Z" }], since)).toBe(true);
  });
});
