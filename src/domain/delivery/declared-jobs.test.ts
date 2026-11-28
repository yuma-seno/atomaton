import { describe, expect, test } from "bun:test";
import { DEFAULT_RUNNER, resolveDeclaredJobs, type DeclaredJobsRules } from "./declared-jobs.ts";

const CHECKED: DeclaredJobsRules = {
  where: "checks.jobs",
  secrets: new Set(["GH_TOKEN"]),
};

/**
 * These decide what a token can reach and what a check is allowed to skip, so every
 * refusal below is a job that would otherwise have run.
 */
describe("resolveDeclaredJobs", () => {
  test("a declared job keeps its name, commands and secrets", () => {
    const { jobs, problems } = resolveDeclaredJobs(
      [{ name: "cloud-names", commands: ["./check.sh"], secrets: ["AWS_ROLE_ARN"] }],
      CHECKED,
    );
    expect(problems).toEqual([]);
    expect(jobs).toEqual([
      { name: "cloud-names", runsOn: [DEFAULT_RUNNER], commands: ["./check.sh"], secrets: ["AWS_ROLE_ARN"] },
    ]);
  });

  /** Declaring none is the shipped default, and it is an answer rather than a fault. */
  test("no jobs is not a problem", () => {
    expect(resolveDeclaredJobs(undefined, CHECKED)).toEqual({ jobs: [], problems: [] });
    expect(resolveDeclaredJobs([], CHECKED)).toEqual({ jobs: [], problems: [] });
  });

  test("a list that is not a list says so, and names itself", () => {
    const { problems } = resolveDeclaredJobs("cloud-names", CHECKED);
    expect(problems[0]).toContain("must be an array");
    expect(problems[0]).toContain("checks.jobs");
  });

  test("naming no secret is ordinary, and writing the key out empty is the same thing", () => {
    for (const secrets of [undefined, []]) {
      const { jobs, problems } = resolveDeclaredJobs([{ name: "lint", commands: ["x"], secrets }], CHECKED);
      expect(problems).toEqual([]);
      expect(jobs[0]?.secrets).toEqual([]);
    }
  });

  /**
   * The same validator `tools.secrets` gets. It used to be a shape check and nothing
   * more: a check could name `GH_TOKEN` and replace the run's own token, or name
   * eleven secrets and silently receive ten.
   */
  describe("the credentials an entry names", () => {
    test("a name the job's own environment already uses is refused", () => {
      const { jobs, problems } = resolveDeclaredJobs(
        [{ name: "ship", commands: ["x"], secrets: ["GH_TOKEN"] }],
        CHECKED,
      );
      expect(jobs).toEqual([]);
      expect(problems[0]).toContain("already part of the environment");
    });

    test("a problem names the entry, because that is the line to go and edit", () => {
      const { problems } = resolveDeclaredJobs(
        [{ name: "a", commands: ["x"] }, { name: "b", commands: ["x"], secrets: ["not a name"] }],
        CHECKED,
      );
      expect(problems[0]).toContain("checks.jobs[1].secrets");
    });

    test("a secrets list that is not a list says so", () => {
      expect(resolveDeclaredJobs([{ name: "a", commands: ["x"], secrets: "X" }], CHECKED).problems).toHaveLength(1);
    });
  });

  describe("where it runs", () => {
    test("omitted is the default runner, so an ordinary entry says nothing about machines", () => {
      const { jobs } = resolveDeclaredJobs([{ name: "lint", commands: ["x"] }], CHECKED);
      expect(jobs[0]?.runsOn).toEqual([DEFAULT_RUNNER]);
    });

    test("a string is one label", () => {
      const { jobs } = resolveDeclaredJobs([{ name: "mac", runs_on: "macos-latest", commands: ["x"] }], CHECKED);
      expect(jobs[0]?.runsOn).toEqual(["macos-latest"]);
    });

    /** A self-hosted runner is addressed by a set of labels one machine must have all of. */
    test("a list is one runner that must carry every label", () => {
      const { jobs } = resolveDeclaredJobs(
        [{ name: "gpu", runs_on: ["self-hosted", "linux", "gpu"], commands: ["x"] }],
        CHECKED,
      );
      expect(jobs[0]?.runsOn).toEqual(["self-hosted", "linux", "gpu"]);
    });

    /**
     * An unusable value still produces a job, on the default runner, and says so. A
     * workflow that cannot start reports nothing about why it could not.
     */
    test("an unusable value falls back and is reported rather than failing the list", () => {
      const { jobs, problems } = resolveDeclaredJobs([{ name: "odd", runs_on: 7, commands: ["x"] }], CHECKED);
      expect(jobs[0]?.runsOn).toEqual([DEFAULT_RUNNER]);
      expect(problems[0]).toContain("runs_on must be a string or a list");
    });
  });

  describe("what makes an entry unusable", () => {
    /**
     * A job with nothing to run passes, and something that always passes is the shape
     * every guard here has failed in: it looks like cover and is not.
     */
    test("a job with no commands is refused rather than left to pass", () => {
      const { jobs, problems } = resolveDeclaredJobs([{ name: "empty", commands: [] }], CHECKED);
      expect(jobs).toEqual([]);
      expect(problems[0]).toContain("report success");
    });

    /**
     * The name becomes a GitHub job name, and two entries sharing one would leave a
     * person unable to tell which failed.
     */
    test("two jobs cannot share a name", () => {
      const { problems } = resolveDeclaredJobs(
        [{ name: "same", commands: ["a"] }, { name: "same", commands: ["b"] }],
        CHECKED,
      );
      expect(problems[0]).toContain("declared more than once");
    });

    test("a name GitHub cannot show as written is refused", () => {
      expect(resolveDeclaredJobs([{ name: "Cloud Names", commands: ["a"] }], CHECKED).problems[0]).toContain(
        "lowercase",
      );
    });

    /**
     * A misspelled key is silently nothing, and the job then runs without whatever it
     * was meant to carry — `secret:` for `secrets:` starts a job with no credential
     * and fails somewhere further in, for a reason nothing names.
     */
    test("an unknown key is a typo, and is refused as one", () => {
      const { jobs, problems } = resolveDeclaredJobs(
        [{ name: "x", commands: ["a"], secret: ["NPM_TOKEN"] }],
        CHECKED,
      );
      expect(jobs).toEqual([]);
      expect(problems[0]).toContain("unknown key");
      expect(problems[0]).toContain("`secret`");
    });

    /**
     * One malformed entry does not hide the rest: somebody fixing their configuration
     * should see everything wrong with it, not the first thing.
     */
    test("every problem is reported, not the first", () => {
      const { problems } = resolveDeclaredJobs(
        [{ name: "UPPER", commands: ["a"] }, { name: "fine", commands: [] }],
        CHECKED,
      );
      expect(problems).toHaveLength(2);
    });
  });

  /**
   * A list with keys of its own supplies both the names and the reader, so everything
   * it did not name stays a typo and its own fields arrive validated in the same pass.
   */
  describe("keys a list owns", () => {
    const WITH_BRANCHES: DeclaredJobsRules<{ branches: readonly string[] }> = {
      where: "deploy.on_merge",
      secrets: new Set(),
      extra: {
        keys: ["branches"],
        read: (entry, where, problems) => {
          if (entry.branches !== undefined && !Array.isArray(entry.branches)) {
            problems.push(`${where}: \`branches\` must be an array.`);
            return null;
          }
          return { branches: (entry.branches as string[]) ?? [] };
        },
      },
    };

    test("its keys are read onto the job", () => {
      const { jobs, problems } = resolveDeclaredJobs(
        [{ name: "staging", commands: ["a"], branches: ["develop"] }],
        WITH_BRANCHES,
      );
      expect(problems).toEqual([]);
      expect(jobs[0]?.branches).toEqual(["develop"]);
    });

    test("a key no list owns is still a typo", () => {
      const { problems } = resolveDeclaredJobs([{ name: "staging", commands: ["a"], tags: ["v*"] }], WITH_BRANCHES);
      expect(problems[0]).toContain("unknown key");
      expect(problems[0]).toContain("`tags`");
    });

    test("a reader that refuses drops the entry", () => {
      const { jobs, problems } = resolveDeclaredJobs(
        [{ name: "staging", commands: ["a"], branches: "develop" }],
        WITH_BRANCHES,
      );
      expect(jobs).toEqual([]);
      expect(problems[0]).toContain("`branches` must be an array");
    });
  });
});
