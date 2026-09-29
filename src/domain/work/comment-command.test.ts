import { describe, expect, test } from "bun:test";
import { commandInBodyRefusal, commandLinesIn, lineForms, parseCommentCommand } from "./comment-command.ts";

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
