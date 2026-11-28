import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FAKE_GH_IMPL } from "../../entrypoints/machinery/testing/fake-gh-env.ts";

/**
 * `findOpenIssueWithTitle` through the real adapter with a fake `gh` answering.
 *
 * The two things that are easy to get wrong here are not the comparison — that is
 * `duplicateIssueOf`'s, and it has its own tests — but which question is asked of
 * GitHub, and what a failed answer means. A search for a CLOSED issue would refuse to
 * file a report about a defect that came back; a failed search read as "no duplicate"
 * silently turns the check off, and one read as "duplicate" loses the report.
 */
const SRC = join(import.meta.dir, "duplicate-issue.ts");

function find(title: string, rules: { match: string[]; stdout?: string; code?: number }[]): { number: number | null; calls: string[][] } {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-duplicate-"));
  const logPath = join(dir, "calls.jsonl");
  const script = `
    const { findOpenIssueWithTitle } = await import(${JSON.stringify(SRC)});
    process.stdout.write(JSON.stringify(findOpenIssueWithTitle("o/r", ${JSON.stringify(title)})));
  `;
  const proc = Bun.spawnSync({
    cmd: [process.execPath, "-e", script],
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      ATOMATON_FAKE_GH: FAKE_GH_IMPL,
      FAKE_GH_RESPONSES: JSON.stringify(rules),
      FAKE_GH_LOG: logPath,
      // Nothing here may reach the real CLI; see `fake-gh-env.ts`.
      GH_TOKEN: "fake-gh-must-be-used",
      GITHUB_TOKEN: "fake-gh-must-be-used",
    },
  });
  const out = proc.stdout.toString();
  if (proc.exitCode !== 0) throw new Error(`child failed: ${proc.stderr.toString() || out}`);
  try {
    const calls = readFileSync(logPath, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as string[]);
    return { number: JSON.parse(out) as number | null, calls };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("findOpenIssueWithTitle", () => {
  test("asks for OPEN issues, by title, and answers the number", () => {
    const { number, calls } = find("Search server reports nothing", [
      {
        match: ["issue", "list"],
        stdout: JSON.stringify([
          { number: 40, title: "An unrelated report" },
          { number: 12, title: "search  SERVER reports nothing" },
        ]),
      },
    ]);
    expect(number).toBe(12);

    const argv = calls.find((call) => call[0] === "issue" && call[1] === "list") ?? [];
    expect(argv.join(" ")).toContain("--state open");
    expect(argv.join(" ")).toContain("in:title");
    // The id is read back, not the whole issue: the comparison needs a title and a
    // number, and a listing of bodies is the expensive answer to a cheap question.
    expect(argv.join(" ")).toContain("--json number,title");
  });

  test("answers 0 when the open issues hold no such title", () => {
    expect(find("A defect nobody filed yet", [{ match: ["issue", "list"], stdout: "[]" }]).number).toBe(0);
  });

  // `null`, not `0`: the caller files the report anyway and says the check did not run.
  test("a search that could not be read is null, not none", () => {
    expect(find("A defect", [{ match: ["issue", "list"], code: 1, stdout: "" }]).number).toBeNull();
  });

  test("an answer that is not JSON is null too", () => {
    expect(find("A defect", [{ match: ["issue", "list"], stdout: "not json" }]).number).toBeNull();
  });

  // A title carrying the search syntax's own quote would make the whole query
  // malformed, and a malformed query is a search that answers nothing.
  test("a quote in the title does not break the query", () => {
    const { number, calls } = find('The "search" server', [{ match: ["issue", "list"], stdout: "[]" }]);
    expect(number).toBe(0);
    const query = (calls[0] ?? []).join(" ");
    expect(query).toContain('"The search server" in:title');
  });
});
