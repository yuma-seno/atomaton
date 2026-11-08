/**
 * security-audit.test.ts — the audit an agent runs on request is wired together.
 *
 * ## What this holds
 *
 * The pieces exist and point at each other, which is the failure this file is for.
 * Three of them are silent when they break:
 *
 * - a skill named by an agent definition that no file answers — `load_skill` comes
 *   back empty and the run proceeds without the procedure it was told to follow;
 * - an `auditor` that names a writing server, which turns a report-only role into a
 *   run that can change the tree it is judging;
 * - a report format that lost the part somebody acts on — the location, the separate
 *   confidence, the advisory a dependency finding rests on — because nothing fails
 *   when a paragraph is deleted from a prompt.
 *
 * ## Why it reads for these strings rather than for a structure
 *
 * The instructions are prose, and prose has to be pinned where it is load-bearing:
 * each assertion below is a fact some later edit could remove while leaving a
 * perfectly valid Markdown file behind. What is not pinned is wording — a sentence
 * reworded for clarity must not fail this.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const AGENT_DIR = "src/content/agent-definitions";

function frontmatterOf(document: string): string {
  return document.replaceAll("\r\n", "\n").split(/^---$/m)[1] ?? "";
}
const SKILL_DIR = "src/content/skills";

const read = (path: string): string => readFileSync(path, "utf8").replace(/\s+/g, " ");

/**
 * The YAML between the two `---` fences, line endings normalised.
 *
 * Splitting on `/^---$/m` reads a CRLF checkout as a file with no frontmatter at
 * all — the fence is `---\r` there — so a test written that way passes on Linux and
 * silently checks an empty string for anyone on Windows.
 */

const auditorRaw = readFileSync(join(AGENT_DIR, "auditor.md"), "utf8");
const auditor = auditorRaw.replace(/\s+/g, " ");
const procedure = read(join(SKILL_DIR, "security/on-demand-audit.md"));
const reviewer = read(join(AGENT_DIR, "reviewer.md"));

describe("the auditor", () => {
  /**
   * The role is report-only, and `mcp_servers` is what makes that true rather than
   * the prompt. `files` writes; `delegate` holds a sub-run that writes.
   */
  test("holds no server that can change the tree", () => {
    const frontmatter = frontmatterOf(auditorRaw);
    const servers = /mcp_servers:\r?\n((?:\s*(?:#.*)?\r?\n|\s*-.*\r?\n)*)/.exec(frontmatter)?.[1] ?? "";
    const named = [...servers.matchAll(/^\s*-\s*(\S+)/gm)].map((m) => m[1]!);

    expect(named, "an auditor with no tools cannot audit").not.toEqual([]);
    expect(named, "`files` writes, and this role makes no change").not.toContain("files");
    expect(named, "the writing delegate is a write one tool call away").not.toContain("delegate");
    // Reading, a scanner, and the thread it reports on -- plus the read-only pair.
    for (const server of ["files_readonly", "shell", "github", "web", "search", "delegate_readonly"]) {
      expect(named, `${server} is what this role does its work with`).toContain(server);
    }
  });

  /** Without this it cannot close the area it was dispatched on, and the dispatcher never wakes. */
  test("can close the area it reported on", () => {
    const frontmatter = frontmatterOf(auditorRaw);
    expect(frontmatter, "`request_close_issue` lives here").toContain("atomaton_env");
    expect(auditor, "and the close is how a dispatched area reports back").toContain("request_close_issue");
  });

  /**
   * Findings are filed by the dispatcher, not by the run that found them: one
   * weakness is often visible from two areas, and two runs filing it make two issues.
   */
  test("is told not to file findings itself", () => {
    expect(auditor).toContain("Do not file the findings as issues");
  });
});

describe("the audit procedure", () => {
  test("is a skill an agent can load, with the two surface playbooks beside it", () => {
    for (const name of ["security/on-demand-audit", "security/gh-actions-surface", "security/agent-prompt-surface"]) {
      const path = join(SKILL_DIR, `${name}.md`);
      expect(existsSync(path), `${path} is a skill no run can load`).toBe(true);
      expect(read(path), `${path} is not registered under the name agents ask for`).toContain(`name: ${name}`);
    }
  });

  /**
   * The step that makes a whole-codebase audit worth reading. A report without it is
   * every candidate the reader found, which is how a report stops being read at all.
   */
  test("requires a refutation pass before anything is reported", () => {
    expect(procedure, "the step has to be named as required").toContain("Refute every candidate");
    expect(procedure, "and the delegate is where a long candidate list goes").toContain("delegate_readonly");
  });

  /**
   * The report's fields are what a reader acts on. `Severity` and `Confidence` are
   * separate because they lead to different actions, and the source is what makes a
   * dependency claim checkable.
   */
  test("carries the fields a finding is decided from", () => {
    for (const field of ["Class:", "Location:", "Evidence:", "Impact:", "Severity:", "Confidence:", "Fix:", "Source:"]) {
      expect(procedure, `a finding without ${field} is not finished`).toContain(field);
    }
  });

  /** Verified against a primary advisory, never a remembered one. */
  test("says where a claim about the outside world comes from", () => {
    expect(procedure).toContain("osv.dev");
    expect(procedure, "a model's memory is a hypothesis, not a finding").toContain("A hypothesis, and nothing else");
  });

  /** The prefix is the only identifying contract, so it is stated where findings are written. */
  test("names the title prefix a later round compares against", () => {
    expect(procedure).toContain("security-finding:");
    expect(procedure, "and the three verdicts a previous finding gets").toContain("no longer applies");
  });

  /**
   * A public repository's issues are public. The default is the minimum that can be
   * acted on, and the place for the rest is a draft advisory nothing here can create
   * — which the procedure has to say, or a run writes a reproduction into an issue
   * trying to be helpful.
   */
  test("keeps a reproduction off a public thread, and names where it goes", () => {
    expect(procedure).toContain("draft security advisory");
    expect(procedure, "no tool here creates one, and a run must not try").toContain("No tool in this toolset creates one");
    expect(procedure, "a live credential is named, never quoted").toContain("never repeated anywhere");
  });
});

describe("the reviewer's own guard", () => {
  /**
   * The lightweight half, in the definition rather than behind a skill load: the
   * mandatory checks are the mechanism that was obeyed, and a check that is not
   * optional does not belong behind an optional load.
   */
  test("has the security checklist, and leaves the audit to the audit", () => {
    expect(reviewer).toContain("A security-relevant line changed");
    // Not by naming `auditor`: it is absent from the reviewer's colleague list, so a
    // directive line naming it would dispatch nothing. The review says where the deep
    // pass lives without pretending it can hand off to it.
    expect(reviewer, "the deep pass is on request, not here").toContain("a separate audit");
    expect(reviewer, "and the review does not turn itself into a scan").toContain("widening this gate into a scan");
  });
});
