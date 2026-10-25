import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FAKE_GH_IMPL } from "../../entrypoints/machinery/testing/fake-gh-env.ts";
import { hermeticEnv, makeConfigDir, removeTemp } from "../../entrypoints/machinery/testing/harness.ts";

/**
 * What `gatherMergeSignals` does when GitHub fails one of its reads.
 *
 * The module had two answers to that question. `json` — the pull request itself, and
 * the check runs — ran plain `gh` with no retry, so one slot of `HTTP 504` killed
 * `merge_pr`; `tryJson` — `mergeStateStatus` — had been given `ghRead` and a reason,
 * so the same slot merely degraded to `UNKNOWN`. Which of the two a blip hit decided
 * whether the reviewer got an error or a refusal, for no reason either half could
 * state. These tests pin the policy that replaced it: every read of the pull request
 * outlasts a transient failure, and what still differs is only what a FAILURE means —
 * an absent answer where one is representable, an error where it is not.
 *
 * A child process, like `participants.test.ts`: the `gh` seam is an environment
 * variable read when `gh` is spawned, and this runs inside an Atomaton run whose own
 * `ATOMATON_*` variables would otherwise leak into it.
 */
const SRC = join(import.meta.dir, "merge-signals.ts");

/** The fields `gatherMergeSignals` asks for, as GitHub answers them. */
const PR_VIEW = {
  isDraft: false,
  author: { is_bot: true, login: "engineer" },
  state: "OPEN",
  headRefOid: "abc123",
  headRefName: "atomaton/issue-7",
  baseRefName: "main",
  title: "Deliver #7",
  labels: [],
};

/** Every read `gatherMergeSignals` makes after the pull request view, answered. */
const REST_OF_THE_READS = [
  { match: ["pr", "view", "7", "mergeStateStatus"], stdout: JSON.stringify({ mergeStateStatus: "CLEAN" }) },
  { match: ["commits/abc123/check-runs"], stdout: JSON.stringify({ check_runs: [] }) },
  { match: ["rules/branches/main"], stdout: "[]" },
  { match: ["pulls/7/files"], stdout: "" },
];

interface Answer {
  ok: boolean;
  error?: string;
  refs?: { headRefName: string; baseRefName: string };
  mergeStateStatus?: string;
  governanceUnknown?: string;
}

function gather(rules: unknown[], env: Record<string, string>): Answer {
  const script = `
    const { gatherMergeSignals } = await import(${JSON.stringify(SRC)});
    let answer;
    try {
      const r = gatherMergeSignals("o/r", 7, (message) => { throw new Error(message); });
      answer = { ok: true, refs: r.refs, ...r.signals };
    } catch (error) {
      answer = { ok: false, error: String((error && error.message) || error) };
    }
    process.stdout.write(JSON.stringify(answer));
  `;
  const proc = Bun.spawnSync({
    cmd: [process.execPath, "-e", script],
    stdout: "pipe",
    stderr: "pipe",
    env: { ...hermeticEnv(), ATOMATON_FAKE_GH: FAKE_GH_IMPL, FAKE_GH_RESPONSES: JSON.stringify(rules), ...env },
  });
  const out = proc.stdout.toString();
  if (proc.exitCode !== 0) throw new Error(`child failed: ${proc.stderr.toString() || out}`);
  return JSON.parse(out) as Answer;
}

/** One test's own temp directories: a config to read, and a log the fake appends to. */
function fixture(): { configDir: string; log: string; cleanUp: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-merge-signals-"));
  const configDir = makeConfigDir({});
  return {
    configDir,
    log: join(dir, "gh.log"),
    cleanUp: () => {
      removeTemp(dir);
      removeTemp(configDir);
    },
  };
}

function ghCalls(log: string): string[][] {
  return readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as string[]);
}

describe("how gatherMergeSignals reads one pull request", () => {
  test("a transient failure reading the pull request is retried, not fatal", () => {
    const { configDir, log, cleanUp } = fixture();
    try {
      const answer = gather(
        [
          // First is a blip, exactly the shape that used to end `merge_pr`.
          { match: ["pr", "view", "7", "isDraft,author"], attempt: 1, code: 1, stdout: "gh: Server Error (HTTP 504)" },
          { match: ["pr", "view", "7", "isDraft,author"], stdout: JSON.stringify(PR_VIEW) },
          ...REST_OF_THE_READS,
        ],
        { ATOMATON_MACHINERY_ROOT: configDir, FAKE_GH_LOG: log },
      );
      expect(answer.error).toBeUndefined();
      expect(answer.ok).toBe(true);
      expect(answer.refs).toEqual({ headRefName: "atomaton/issue-7", baseRefName: "main" });
      // Asked twice, which is the whole point: the failure was outlasted rather than
      // handed to the caller.
      expect(ghCalls(log).filter((argv) => argv.join(" ").includes("isDraft,author"))).toHaveLength(2);
    } finally {
      cleanUp();
    }
  }, 30_000);

  test("a transient failure reading the changed files is retried too", () => {
    const { configDir, log, cleanUp } = fixture();
    try {
      const answer = gather(
        [
          { match: ["pr", "view", "7", "isDraft,author"], stdout: JSON.stringify(PR_VIEW) },
          ...REST_OF_THE_READS.filter((rule) => !rule.match.includes("pulls/7/files")),
          { match: ["pulls/7/files"], attempt: 1, code: 1, stdout: "gh: Server Error (HTTP 502)" },
          { match: ["pulls/7/files"], stdout: "" },
        ],
        { ATOMATON_MACHINERY_ROOT: configDir, FAKE_GH_LOG: log },
      );
      expect(answer.ok).toBe(true);
      // Absent means the list was read. Set means the read failed, which blocks the
      // merge — a false refusal if the failure was a blip.
      expect(answer.governanceUnknown).toBeUndefined();
    } finally {
      cleanUp();
    }
  }, 30_000);

  test("a failure reading mergeStateStatus degrades to UNKNOWN instead of failing", () => {
    const { configDir, log, cleanUp } = fixture();
    try {
      const answer = gather(
        [
          { match: ["pr", "view", "7", "isDraft,author"], stdout: JSON.stringify(PR_VIEW) },
          {
            match: ["pr", "view", "7", "mergeStateStatus"],
            code: 1,
            stdout: "gh: Resource not accessible by integration (HTTP 403)",
          },
          ...REST_OF_THE_READS.filter((rule) => !rule.match.includes("mergeStateStatus")),
        ],
        { ATOMATON_MACHINERY_ROOT: configDir, FAKE_GH_LOG: log },
      );
      expect(answer.ok).toBe(true);
      // The one read whose absence is representable: `UNKNOWN` blocks the merge and
      // says mergeability could not be determined.
      expect(answer.mergeStateStatus).toBe("UNKNOWN");
    } finally {
      cleanUp();
    }
  }, 30_000);

  test("a real failure reading the pull request still fails the call, naming the read", () => {
    const { configDir, log, cleanUp } = fixture();
    try {
      const answer = gather(
        [
          {
            match: ["pr", "view", "7", "isDraft,author"],
            code: 1,
            stdout: "gh: Resource not accessible by integration (HTTP 403)",
          },
          ...REST_OF_THE_READS,
        ],
        { ATOMATON_MACHINERY_ROOT: configDir, FAKE_GH_LOG: log },
      );
      expect(answer.ok).toBe(false);
      // Named, because GitHub's message does not say which call it came from.
      expect(answer.error).toContain("pr view 7");
    } finally {
      cleanUp();
    }
  }, 30_000);
});
