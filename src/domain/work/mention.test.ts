import { describe, expect, test } from "bun:test";
import { escapedMentionNotice, escapeUnknownMentions, mentionsIn } from "./mention.ts";

const KNOWN = ["hws-yuma-seno", "Some-Reviewer"];

describe("checking who an agent tried to notify", () => {
  test("a participant is left alone", () => {
    const result = escapeUnknownMentions("@hws-yuma-seno please look at this", KNOWN);
    expect(result.text).toBe("@hws-yuma-seno please look at this");
    expect(result.escaped).toEqual([]);
  });

  /** GitHub logins are case-insensitive, so the check has to be. */
  test("case does not decide whether a person gets notified", () => {
    const result = escapeUnknownMentions("@SOME-reviewer take a look", KNOWN);
    expect(result.escaped).toEqual([]);
  });

  /**
   * The failure this exists for: a name read out of a commit log or a dependency's
   * README, repeated into a comment, notifying a stranger with nothing on this side
   * to show it happened.
   */
  test("a stranger is escaped, and still readable", () => {
    const result = escapeUnknownMentions("Based on @torvalds' advice", KNOWN);
    expect(result.text).toBe("Based on `@torvalds`' advice");
    expect(result.escaped).toEqual(["torvalds"]);
  });

  test("several strangers are reported once each", () => {
    const result = escapeUnknownMentions("@a and @b and @a again", KNOWN);
    expect(result.escaped).toEqual(["a", "b"]);
    expect(result.text).toBe("`@a` and `@b` and `@a` again");
  });

  /**
   * Escaping inside a code block would change code somebody is meant to read, and
   * GitHub does not notify from there anyway -- so the safe-looking thing is the
   * destructive one.
   */
  test("a fenced code block is left exactly as written", () => {
    const text = ["Here is the log:", "```", "commit by @torvalds", "```", "and @stranger outside"].join("\n");
    const result = escapeUnknownMentions(text, KNOWN);
    expect(result.text).toContain("commit by @torvalds");
    expect(result.text).toContain("`@stranger` outside");
    expect(result.escaped).toEqual(["stranger"]);
  });

  test("an inline code span is left alone too", () => {
    const result = escapeUnknownMentions("run `npm i @scope/pkg` then ask @stranger", KNOWN);
    expect(result.text).toContain("`npm i @scope/pkg`");
    expect(result.text).toContain("`@stranger`");
  });

  /**
   * A four-backtick fence holding a three-backtick sample is how a draft quotes a
   * Markdown file, and GitHub renders the whole thing as one code block. Pairing
   * three backticks wherever it found them read it as code, prose, code -- so the
   * sample was rewritten while it was still displayed as code, which is the loss
   * this whole module exists to avoid (#488).
   */
  test("a fence nested inside a longer fence is one code block, not two", () => {
    const text = [
      "Draft below, with @stranger named in prose.",
      "",
      "````markdown",
      "```text",
      "commit by @torvalds",
      "```",
      "````",
      "",
      "and @another outside.",
    ].join("\n");
    const result = escapeUnknownMentions(text, KNOWN);
    // Byte for byte: the inner sample is code, so nothing in it is touched.
    expect(result.text).toContain("```text\ncommit by @torvalds\n```");
    expect(result.text).toContain("`@stranger`");
    expect(result.text).toContain("`@another`");
    expect(result.escaped).toEqual(["stranger", "another"]);
  });

  /** A fence that never closes is code to the end, which is the safe direction. */
  test("an unclosed fence protects the rest of the comment", () => {
    const text = ["```", "commit by @torvalds", "and @another line"].join("\n");
    const result = escapeUnknownMentions(text, KNOWN);
    expect(result.text).toBe(text);
    expect(result.escaped).toEqual([]);
  });

  test("a tilde fence is a code block too", () => {
    const text = ["~~~", "commit by @torvalds", "~~~", "but @stranger here"].join("\n");
    const result = escapeUnknownMentions(text, KNOWN);
    expect(result.text).toContain("commit by @torvalds");
    expect(result.text).toContain("`@stranger`");
    expect(result.escaped).toEqual(["stranger"]);
  });

  /**
   * The shape of the comment that opened #488: prose naming an account, a draft
   * quoted in a four-backtick block, and a closing mention. Only the prose is
   * rewritten, and the draft reaches GitHub exactly as the run wrote it.
   */
  test("the issue-436 draft survives with only its prose escaped", () => {
    const draft = ["ここに説明です。通知@0 の話。", "", "````markdown", "```text", "@torvalds が書いた", "```", "````", "", "おわり"].join("\n");
    const result = escapeUnknownMentions(draft, KNOWN);
    expect(result.text).toBe(draft.replace("通知@0", "通知`@0`"));
    expect(result.escaped).toEqual(["0"]);
  });

  test("an already escaped mention is not escaped twice", () => {
    const result = escapeUnknownMentions("see `@stranger` above", KNOWN);
    expect(result.text).toBe("see `@stranger` above");
    expect(result.escaped).toEqual([]);
  });

  /** An email address is not a mention, and neither is a scoped package. */
  test("what looks like a mention and is not", () => {
    const text = "mail me at yuma@example.com, install @types/node, see docs@v2";
    const result = escapeUnknownMentions(text, KNOWN);
    expect(result.text).toBe(text);
    expect(result.escaped).toEqual([]);
  });

  /**
   * Fail closed. Not being pinged when you should have been is a comment you can
   * still read; being pinged by a machine you have nothing to do with is not
   * something anyone here would find out about.
   */
  test("with no known participants, everything is escaped", () => {
    const result = escapeUnknownMentions("@hws-yuma-seno look", []);
    expect(result.text).toBe("`@hws-yuma-seno` look");
    expect(result.escaped).toEqual(["hws-yuma-seno"]);
  });

  test("text with no mentions is returned unchanged", () => {
    const text = "Nothing to see here.\n\n```\ncode\n```\n";
    expect(escapeUnknownMentions(text, KNOWN).text).toBe(text);
  });

  test("a mention at the very start is still caught", () => {
    const result = escapeUnknownMentions("@stranger hello", KNOWN);
    expect(result.text).toBe("`@stranger` hello");
  });
});

describe("what the thread is told", () => {
  test("nothing escaped, nothing said", () => {
    expect(escapedMentionNotice([])).toBeUndefined();
  });

  test("the notice names them and says nobody was notified", () => {
    const notice = escapedMentionNotice(["torvalds"]) ?? "";
    expect(notice).toContain("`@torvalds`");
    expect(notice).toContain("Nobody was notified");
    // "could not confirm" rather than "is not": the list is sometimes unreadable,
    // and a notice that overstates what was checked is a notice a person then has
    // to go and check.
    expect(notice).toContain("could not confirm");
    expect(notice, "singular reads as English").toContain("was written as a mention");
  });

  test("and reads as English in the plural", () => {
    const notice = escapedMentionNotice(["a", "b"]) ?? "";
    expect(notice).toContain("were written as mentions");
    expect(notice).toContain("those accounts");
  });
});

describe("reading who was named", () => {
  test("every login in prose, in order, once each", () => {
    expect(mentionsIn("@a then @b then @A again")).toEqual(["a", "b"]);
  });

  /** Code is where a name is quoted rather than called. */
  test("code spans and fenced blocks are not prose", () => {
    expect(mentionsIn("ask `@a` or see:\n```\n@b\n```\n")).toEqual([]);
  });

  /** The nested shape is the one the old regex got wrong (#488). */
  test("a sample inside a longer fence is not prose either", () => {
    expect(mentionsIn(["see:", "````markdown", "```text", "@b", "```", "````"].join("\n"))).toEqual([]);
  });

  test("an email address and a scoped package are not mentions", () => {
    expect(mentionsIn("write to foo@example.com about @org/team")).toEqual([]);
  });

  /**
   * Prose on either side of a code span is still prose: the span is skipped, not a
   * boundary that can hide a name written next to it.
   */
  test("a name written against a code span still counts", () => {
    expect(mentionsIn("see `x`@baz")).toEqual(["baz"]);
  });
});
