import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runWithFakeGh, scriptPath } from "./testing/harness.ts";

/**
 * The half of `report_config_findings.ts` that starts the agent.
 *
 * The finding's parsing, its marker and its title have their own reason to exist and
 * are read by nothing else; what this covers is the step that used to be a `/<agent>`
 * comment. GitHub delivers no workflow run for a comment written with the job's own
 * token, so that comment asked for a run nobody ever got — the issue stayed open
 * carrying a command, with `agents.on_config_finding` required, validated, and read by
 * nothing that started anything.
 */
const SCRIPT = scriptPath("report_config_findings.ts");

const FINDING = "ATOMA_CONFIG_FINDING: kind=dead_guard severity=warn server=web pattern=webhooks tools=fetch,hooks";

/** A log file holding one finding. */
function logFile(): { dir: string; path: string } {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-finding-"));
  const path = join(dir, "run.log");
  writeFileSync(path, `starting\n${FINDING}\ncontinuing\n`);
  return { dir, path };
}

/** The directive the dispatch posted, from the fake `gh` log. */
function directiveIn(calls: string[][]): string {
  const posted = calls.find((argv) => argv[0] === "api" && argv.includes("POST")) ?? [];
  return posted[posted.indexOf("-f") + 1] ?? "";
}

function run(path: string, rules: { match: string[]; stdout?: string; code?: number }[]) {
  return runWithFakeGh(SCRIPT, ["--repo", "o/r", "--logs-file", path, "--agent", "engineer"], { rules });
}

describe("report_config_findings starting the agent", () => {
  test("dispatches the agent the config named, on the issue it opened", () => {
    const { dir, path } = logFile();
    try {
      const r = run(path, [
        { match: ["issue", "list"], stdout: "" },
        { match: ["issue", "create"], stdout: "https://github.com/o/r/issues/321" },
        { match: ["api", "issues/321/comments", "POST"], stdout: "700" },
        { match: ["api", "issues/321/comments"], stdout: JSON.stringify([{ id: 700, body: "<!-- atomaton:dispatch=engineer -->" }]) },
        { match: ["api", "issues/321"], stdout: JSON.stringify({ state: "open" }) },
        { match: ["workflow", "run"], stdout: "" },
      ]);
      expect(r.status, r.stderr).toBe(0);

      const dispatched = r.ghCalls.find((argv) => argv[0] === "workflow") ?? [];
      expect(dispatched.join(" "), "the run this issue needs is started by name, not by a comment").toContain("agent=engineer");
      expect(dispatched.join(" ")).toContain("number=321");

      const directive = directiveIn(r.ghCalls);
      expect(directive).toContain("<!-- atomaton:llm-context=include -->");
      expect(directive).toContain("<!-- atomaton:dispatch=engineer -->");
      expect(directive).toContain("Repair the configuration defect described above");

      // Nothing posts a slash command any more: it was the half that never worked.
      expect(r.ghCalls.some((argv) => argv[0] === "issue" && argv[1] === "comment")).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // The issue exists by then, so the defect is on the record either way — and the step
  // this runs in is not the failure the workflow should report. A warning names the
  // issue so a person can put an agent on it.
  test("a dispatch that does not go out warns, and the job still passes", () => {
    const { dir, path } = logFile();
    try {
      const r = run(path, [
        { match: ["issue", "list"], stdout: "" },
        { match: ["issue", "create"], stdout: "https://github.com/o/r/issues/321" },
      ]);
      expect(r.status).toBe(0);
      expect(r.stderr).toContain("::warning::opened #321 but could not start engineer on it");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // An open issue already carrying this finding's marker is left alone: every run until
  // somebody fixes it reports the same line, and a run per report is a repository
  // buried in duplicates.
  test("an open issue already reporting this finding is left alone", () => {
    const { dir, path } = logFile();
    try {
      const r = run(path, [{ match: ["issue", "list"], stdout: "321" }]);
      expect(r.status).toBe(0);
      expect(r.ghCalls.some((argv) => argv[0] === "issue" && argv[1] === "create")).toBe(false);
      expect(r.ghCalls.some((argv) => argv[0] === "workflow")).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
