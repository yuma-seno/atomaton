import { describe, expect, test } from "bun:test";
import {
  commandInBodyRefusal,
  commandLinesIn,
  commandsIn,
  lineForms,
  parseCommentCommand,
  parseMangledCommand,
  recoveryLines,
} from "./comment-command.ts";

describe("parseCommentCommand", () => {
  test("accepts a standalone agent command followed by instructions", () => {
    expect(parseCommentCommand("/engineer\n作業をお願いします")).toEqual({
      agent: "engineer",
      control: "",
      sessionMode: "continue",
      error: "",
    });
  });

  test("accepts recover as the only command-line modifier", () => {
    expect(parseCommentCommand("/engineer recover\n作業を続けてください")).toEqual({
      agent: "engineer",
      control: "",
      sessionMode: "recover",
      error: "",
    });
  });

  test("rejects instructions on the command line", () => {
    const result = parseCommentCommand("/engineer 作業をお願いします");
    expect(result.agent).toBe("");
    expect(result.error).toContain("Unknown command syntax");
  });

  test("parses the atomaton:dispatch= comment form", () => {
    expect(parseCommentCommand("<!-- atomaton:dispatch=engineer -->")).toEqual({
      agent: "engineer",
      control: "",
      sessionMode: "continue",
      error: "",
    });
  });

  // `/stop` reaching the agent branch would dispatch a run looking for stop.md,
  // which is a failed run rather than a stopped one.
  test("a control command is taken out of the agent namespace", () => {
    expect(parseCommentCommand("/stop")).toEqual({
      agent: "",
      control: "stop",
      sessionMode: "continue",
      error: "",
    });
    expect(parseCommentCommand("/resume")).toEqual({
      agent: "",
      control: "resume",
      sessionMode: "continue",
      error: "",
    });
  });

  // The thing the person wanted exists and is one line away, so the error names it
  // rather than saying the syntax is wrong.
  test("a control command refuses an argument and points at the agent command", () => {
    const result = parseCommentCommand("/resume 続きをお願いします");
    expect(result.control).toBe("");
    expect(result.agent).toBe("");
    expect(result.error).toContain("'/<agent>'");
  });

  test("ignores a non-command comment", () => {
    expect(parseCommentCommand("please help").agent).toBe("");
  });

  test("ignores an invalid (uppercase) agent name", () => {
    expect(parseCommentCommand("/Engineer uppercase").agent).toBe("");
  });
});

/**
 * The spellings a model's markdown gives a bare command. The reader of an agent's
 * output tolerates them, so the refusal has to see the same lines.
 */
describe("lineForms", () => {
  test("a bare line is itself", () => {
    expect(lineForms("/engineer")).toEqual(["/engineer"]);
  });

  test("a list bullet and a quote marker are stripped", () => {
    expect(lineForms("- /engineer")).toEqual(["/engineer"]);
    expect(lineForms("> /engineer")).toEqual(["/engineer"]);
  });

  test("backticks around the whole line or around the name are seen through", () => {
    expect(lineForms("`/engineer`")).toContain("/engineer");
    expect(lineForms("/`engineer`")).toContain("/engineer");
  });

  test("a blank line has no forms", () => {
    expect(lineForms("   ")).toEqual([]);
  });
});

/**
 * The reader for an agent's own output, which the runner posts back to the thread
 * verbatim. It has to yield the directive the runner dispatched from, or the ask a
 * push answered is invisible and the agent the push already answered is dispatched
 * again (#219).
 */
describe("parseMangledCommand", () => {
  test("a bare command is read as it is", () => {
    expect(parseMangledCommand("/engineer").agent).toBe("engineer");
  });

  test("a bullet, a quote marker and backticks each still yield the directive", () => {
    expect(parseMangledCommand("- /engineer").agent).toBe("engineer");
    expect(parseMangledCommand("> /engineer").agent).toBe("engineer");
    expect(parseMangledCommand("`/engineer`").agent).toBe("engineer");
    expect(parseMangledCommand("/`engineer`").agent).toBe("engineer");
  });

  // The shape a result comment actually has: prose, then the directive on its own
  // line at the end.
  test("finds the directive at the end of a result comment", () => {
    const result = "Review found two problems.\n\n<details><summary>how</summary>x</details>\n\n- /engineer\n";
    expect(parseMangledCommand(result).agent).toBe("engineer");
  });

  test("a command inside a sentence is still prose", () => {
    expect(parseMangledCommand("Use `/reviewer` to ask for a review.").agent).toBe("");
  });

  // The tolerance is the ask reader's, not the definition's: a dispatch and the guard
  // keep reading a person's line strictly.
  test("the strict parse of a mangled line still finds nothing", () => {
    expect(parseCommentCommand("- /engineer").agent).toBe("");
    expect(parseCommentCommand("> /engineer").agent).toBe("");
    expect(parseCommentCommand("`/engineer`").agent).toBe("");
  });
});

describe("commandLinesIn", () => {
  test("finds a command on a line of its own", () => {
    expect(commandLinesIn("Some prose.\n\n/reviewer\n\nMore prose.")).toEqual(["/reviewer"]);
  });

  test("finds every command, in order", () => {
    expect(commandLinesIn("/engineer\n/reviewer")).toEqual(["/engineer", "/reviewer"]);
  });

  test("finds the dispatch marker the machinery writes", () => {
    expect(commandLinesIn("<!-- atomaton:dispatch=engineer -->")).toEqual(["<!-- atomaton:dispatch=engineer -->"]);
  });

  // `/stop` and `/resume` act on a run, and an agent writing one into a body is the
  // same mistake as writing an agent name.
  test("finds a control command too", () => {
    expect(commandLinesIn("/stop")).toEqual(["/stop"]);
  });

  test("finds the forms a model's markdown gives it", () => {
    expect(commandLinesIn("- /reviewer")).toEqual(["- /reviewer"]);
    expect(commandLinesIn("`/reviewer`")).toEqual(["`/reviewer`"]);
  });

  // The point of "on a line of its own": prose that mentions a command is not one.
  test("a command inside a sentence is prose", () => {
    expect(commandLinesIn("Comment /reviewer to have it reviewed.")).toEqual([]);
    expect(commandLinesIn("Use `/reviewer` to ask for a review.")).toEqual([]);
  });

  // No reader takes this for a request: the parser reports it as an error and starts
  // nothing.
  test("a command with instructions after the name is not a command", () => {
    expect(commandLinesIn("/engineer fix the bug")).toEqual([]);
  });

  test("an ordinary body has none", () => {
    expect(commandLinesIn("## What changed\n\nAdded a thing.\n\nCloses #1")).toEqual([]);
  });

  test("handles CRLF, which a body edited in the browser comes back with", () => {
    expect(commandLinesIn("prose\r\n/reviewer\r\nprose")).toEqual(["/reviewer"]);
  });
});

describe("commandsIn", () => {
  // The same reader the parser uses, so the count and the dispatch cannot disagree.
  test("counts every command, in the order they appear", () => {
    expect(commandsIn("/engineer\n\n/reviewer").map((c) => c.agent)).toEqual(["engineer", "reviewer"]);
  });

  test("counts control commands, which are commands too", () => {
    expect(commandsIn("/engineer\n/stop").map((c) => c.control || c.agent)).toEqual(["engineer", "stop"]);
  });

  // A quoted or otherwise embedded command is not one the machinery would act on, so
  // it is not a second request either.
  test("a command that is prose is not counted", () => {
    expect(commandsIn("> /engineer\n\n/reviewer").map((c) => c.agent)).toEqual(["reviewer"]);
    expect(commandsIn("Comment /reviewer to have it reviewed.")).toEqual([]);
  });

  // The parser reports these and starts nothing, so a second command cannot lose them.
  test("a malformed command is not counted", () => {
    expect(commandsIn("/engineer fix the bug\n/reviewer").map((c) => c.agent)).toEqual(["reviewer"]);
  });

  test("the dispatch marker counts, because it is a request", () => {
    expect(commandsIn("<!-- atomaton:dispatch=reviewer -->").map((c) => c.agent)).toEqual(["reviewer"]);
  });

  test("an empty body has none", () => {
    expect(commandsIn("")).toEqual([]);
  });
});

describe("commandInBodyRefusal", () => {
  test("nothing found, nothing said", () => {
    expect(commandInBodyRefusal([], "pull request body", "Use reviewer.")).toBeUndefined();
  });

  test("it quotes what it found and says what to do instead", () => {
    const refusal = commandInBodyRefusal(["/reviewer"], "pull request body", "Pass it as the `reviewer` argument.")!;
    expect(refusal).toContain('"/reviewer"');
    expect(refusal).toContain("pull request body");
    expect(refusal).toContain("Pass it as the `reviewer` argument.");
  });

  test("it says how to mention a command without it being one", () => {
    const refusal = commandInBodyRefusal(["/reviewer"], "issue body", "Use launch_sub_agent.")!;
    expect(refusal).toContain("inside a sentence");
  });
});

describe("recoveryLines", () => {
  /** The syntax these lines spell is this file's own; the lines must stay pronounceable by the parser. */
  test("both ways forward, for the agent they name", () => {
    const lines = recoveryLines("engineer");
    expect(lines.join("\n")).toContain("`/engineer` and put what to do next on the following lines");
    expect(lines.join("\n")).toContain("`/engineer recover`");
  });

  test("each line it suggests is a command the parser accepts", () => {
    for (const line of recoveryLines("reviewer")) {
      const bare = line.replace(/^[^`]*`\/([a-z-]+)[^`]*`.*$/, "/$1");
      if (bare === line) continue;
      const parsed = parseCommentCommand(bare);
      expect(parsed.agent, bare).toBe("reviewer");
  }
  });

  test("the recover line parses with the recover session mode", () => {
    expect(parseCommentCommand("/engineer recover").sessionMode).toBe("recover");
  });
});
