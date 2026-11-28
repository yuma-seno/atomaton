/**
 * The one list, and the two keys it replaced.
 *
 * The read-through is not a courtesy to an old file: `.github/atomaton/config.yaml` is
 * applied by an update whose pull request stops at a conflict for a person, so between
 * the release that carries this reader and that merge, the config on the default
 * branch still spells the two arms. Every check in every pull request runs against
 * that file, so reading it has to mean exactly what writing the new spelling means.
 */
import { describe, expect, test } from "bun:test";
import {
  announceDeprecatedChecks,
  CHECKS,
  deprecatedCheckNotice,
  LEGACY_CHECK_KEYS,
  NO_CHECKS,
  resolveChecks,
} from "./check-jobs.ts";

const ONE = { name: "verify", commands: ["bun test"] };

describe("resolveChecks", () => {
  test("reads the one list", () => {
    const { jobs, problems, deprecated } = resolveChecks({ jobs: [ONE] });
    expect(problems).toEqual([]);
    expect(jobs.map((job) => job.name)).toEqual(["verify"]);
    expect(deprecated).toEqual([]);
  });

  test("declaring none is not a fault, in either spelling", () => {
    for (const section of [undefined, null, {}, { jobs: [] }]) {
      expect(resolveChecks(section)).toEqual({ jobs: [], problems: [], deprecated: [] });
    }
  });

  /**
   * An old spelling that is present and EMPTY is still an old spelling: it is what
   * this repository's own config holds today (`from_default_branch: []`), and the
   * notice is what tells somebody to move the key rather than delete the list.
   */
  test("an empty legacy list is still a key that needs moving", () => {
    const { jobs, problems, deprecated } = resolveChecks({ from_pull_request: [], from_default_branch: [] });
    expect(jobs).toEqual([]);
    expect(problems).toEqual([]);
    expect(deprecated).toEqual(["checks.from_pull_request", "checks.from_default_branch"]);
  });

  /**
   * Both old keys, read in the order the config was written in. The order is the
   * order the jobs appear in the matrix, so it is the order a failure is listed in.
   */
  test("the legacy keys are merged into it, in a fixed order", () => {
    const { jobs, problems, deprecated } = resolveChecks({
      from_pull_request: [{ name: "lint", commands: ["bun run lint"] }],
      from_default_branch: [{ name: "cloud", commands: ["./check.sh"], secrets: ["AWS_ROLE_ARN"] }],
    });
    expect(problems).toEqual([]);
    expect(jobs.map((job) => job.name)).toEqual(["lint", "cloud"]);
    expect(deprecated).toEqual(["checks.from_pull_request", "checks.from_default_branch"]);
  });

  /**
   * `from_pull_request` refused `secrets` because its commands were the pull
   * request's own. The list is the default branch's now, both spellings alike, so the
   * refusal has nothing left to protect — and an entry that carried one would
   * otherwise be rejected by an upgrade it did not ask for.
   */
  test("an old spelling may name a secret, because the list is no longer the pull request's", () => {
    const { jobs, problems } = resolveChecks({
      from_pull_request: [{ name: "cloud", commands: ["./check.sh"], secrets: ["AWS_ROLE_ARN"] }],
    });
    expect(problems).toEqual([]);
    expect(jobs[0]?.secrets).toEqual(["AWS_ROLE_ARN"]);
  });

  /**
   * The config most likely to hold one name twice: the entries moved to `jobs`, and the
   * old key not deleted yet. Reported across the keys exactly as `resolveDeclaredJobs`
   * reports it within one — two jobs with one name is a check nobody can attribute a
   * failure to, and choosing one of them would be this reader deciding what runs.
   */
  test("a name under both spellings is reported, and names both", () => {
    const { jobs, problems } = resolveChecks({
      jobs: [{ name: "lint", commands: ["bun run lint"] }],
      from_pull_request: [{ name: "lint", commands: ["bun run lint"] }, { name: "test", commands: ["bun test"] }],
    });
    expect(jobs.map((job) => job.name)).toEqual(["lint", "test"]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("'lint' is already declared");
    expect(problems[0]).toContain("checks.from_pull_request");
    expect(problems[0]).toContain("checks.jobs");
  });

  /** A problem names the line the author has to go and edit, not the portability name. */
  test("a malformed entry is reported under the key it was written in", () => {
    const { problems } = resolveChecks({ from_default_branch: [{ name: "Cloud Names", commands: ["x"] }] });
    expect(problems[0]).toContain("checks.from_default_branch[0]");
  });

  test("the section is named once, not once per list", () => {
    expect(CHECKS.where).toBe("checks.jobs");
    expect([...LEGACY_CHECK_KEYS]).toEqual(["from_pull_request", "from_default_branch"]);
  });
});

describe("saying the old spelling is deprecated", () => {
  test("the notice names the new spelling, and says the two behave alike", () => {
    const notice = deprecatedCheckNotice(["checks.from_pull_request"]);
    expect(notice).toContain("`checks.from_pull_request`");
    expect(notice).toContain("`checks.jobs`");
    expect(notice).toContain("`secrets`");
  });

  test("two keys read as one sentence rather than two", () => {
    const notice = deprecatedCheckNotice(["checks.from_pull_request", "checks.from_default_branch"]);
    expect(notice).toContain("`checks.from_pull_request` and `checks.from_default_branch` are");
  });

  /**
   * Once per process, which is the scope a person reads: one planning job, or one
   * deliverable check. Repeated per entry, a list migrating entry by entry would say
   * it as many times as it had entries.
   */
  test("it is said once however many times it is asked to be said", () => {
    const said: string[] = [];
    for (let call = 0; call < 3; call++) {
      announceDeprecatedChecks(["checks.from_pull_request"], (line) => said.push(line));
    }
    expect(said).toHaveLength(1);
    expect(said[0]).toStartWith("::warning::");
  });

  test("nothing to say is said as nothing", () => {
    const said: string[] = [];
    announceDeprecatedChecks([], (line) => said.push(line));
    expect(said).toEqual([]);
  });
});

/**
 * The line an adopter reads when their required check has been passing every pull
 * request without looking at one. Said as what it costs them, and with the two ways
 * out, because that is the moment they are looking.
 */
test("the empty-list warning names the file, the key and both exits", () => {
  expect(NO_CHECKS).toContain(".github/atomaton/config.yaml");
  expect(NO_CHECKS).toContain("checks.jobs");
  expect(NO_CHECKS).toContain("checks.your_workflow");
});
