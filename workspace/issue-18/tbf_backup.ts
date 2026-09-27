/**
 * test-builds-first.test.ts — a script that runs tests reading `dist/` builds it first.
 *
 * ## The failure this exists for
 *
 * `dist/` is this repository's build output and is gitignored, so a checkout does not
 * have it. Twelve suites under the `test` and `test:e2e` paths read it — the generated
 * workflows, the release ruleset, the bundled tool servers — because the built artifact
 * is what they are about.
 *
 * CI was never affected, which is the whole problem. `checks.from_pull_request` in
 * `.github/atomaton/config.yaml` runs `synth` before `test`, so the build happened in
 * the one place somebody was watching. An agent's run does not build: the runner runs
 * `environment.setup_commands` and nothing else, and that list is install-only.
 *
 * So `bun run test` was `0 fail` in CI and red inside every agent's run. Measured on
 * this tree with `dist/` deleted:
 *
 *     rm -rf dist && bun run test                          -> 1399 pass / 62 fail
 *     rm -rf dist && env -u ATOMATON_MACHINERY_ROOT bun run test -> 1409 pass / 59 fail
 *     rm -rf dist && bun run test:e2e                      -> 0 pass / 5 skip / 3 fail
 *
 * Every one of those failures is an `ENOENT` under `dist/` — 51 `open`, 8 `scandir` —
 * and none of them is under any other path. The count does not depend on the
 * environment, which is how we know it is the missing directory rather than the
 * inherited variables the test beside this one is about.
 *
 * `bun run synth` takes 0.4s. An agent that does not already know to type it cannot
 * tell those failures from ones its own change caused, and the run this issue was
 * opened by spent its time on exactly that.
 *
 * ## Why the build is in `package.json` and not in `environment.setup_commands`
 *
 * Both were open in the issue, and this is the one that can be verified by the pull
 * request that makes it. `setup_commands` is read from the DEFAULT BRANCH, so a
 * command added there is not in the environment of the run reviewing the change — a
 * person reading that pull request has only the old list and cannot reproduce the fix.
 * A `pre<name>` script is in the tree under test, so the same command CI will run is
 * the command the reviewer can run.
 *
 * It also covers every caller rather than the jobs this repository happens to have:
 * `test` and `test:e2e` build before they read whether the caller is an agent's run, a
 * laptop, or a check invoking the script directly. CI pays a second build for that,
 * which is the cost of the two environments agreeing.
 *
 * ## How the wiring is established, given that a test here cannot run `bun run test`
 *
 * Spawning `bun run test` from a suite that `bun run test` runs is an infinite
 * recursion, and spawning it with a recursion guard would double the suite's runtime to
 * prove one line of package.json. So the wiring is split into the two halves that can
 * each be checked cheaply:
 *
 *  - `pre<name>` is the key bun looks for, and it is declared for every script that
 *    reads the artifact (test 1). Delete it and this file fails.
 *  - That bun RUNS `pre<name>` before `run <name>` is measured here on a throwaway
 *    package rather than asserted (test 3). It is bun's behaviour, not this
 *    repository's, so it is measured against bun and the measurement says so.
 *  - The command that key names really builds the artifact from nothing is measured
 *    against THIS repository's package.json (test 4): `bun run pretest` is exactly what
 *    `bun run test` runs first.
 *
 * ## What this can see, and what it cannot
 *
 * A `dist/` path assembled from pieces (`join("dist", ...)`) reads the artifact without
 * naming it, and a file that reads one through a helper in another file is seen only in
 * the helper. Comments are excluded, because a header explaining `dist/` is not a file
 * reading it — this file is one, and so are three of the suites it guards. This is a
 * text scan in the same shape as `machinery-root.test.ts` beside it, with the same
 * limits.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv } from "../../src/entrypoints/machinery/testing/harness.ts";

/** The artifact the suites read, as the file that proves the build ran. */
const BUILT_WORKFLOW = "dist/.github/workflows/atomaton-runner.yml";

/** Every script in package.json, by name. */
function scripts(): Record<string, string> {
  return (JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> }).scripts;
}

/** The arguments to `bun test`, which are paths. The command itself is not. */
function pathsOf(command: string): string[] {
  return command
    .split(/\s+/)
    .slice(2)
    .filter((word) => word.startsWith("./") || word.startsWith("src/") || word.startsWith("tests/"));
}

/** Every `.ts` under a path a script names, at any depth. */
function typescriptFilesUnder(path: string): string[] {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return path.endsWith(".ts") ? [path] : [];
  return readdirSync(path, { recursive: true })
    .map(String)
    .map((name) => join(path, name).replaceAll("\\", "/"))
    .filter((file) => file.endsWith(".ts") && statSync(file).isFile());
}

/** The lines of a file that are code, so a header about `dist/` is not a read of it. */
function codeLines(source: string): string {
  const kept: string[] = [];
  let inBlock = false;
  for (const line of source.split("\n")) {
    const trimmed = line.trim();
    if (inBlock) {
      if (trimmed.includes("*/")) inBlock = false;
      continue;
    }
    if (trimmed.startsWith("/*")) {
      if (!trimmed.includes("*/")) inBlock = true;
      continue;
    }
    if (trimmed.startsWith("*") || trimmed.startsWith("//")) continue;
    kept.push(line);
  }
  return kept.join("\n");
}

/** A `dist/...` path written out in code, rather than one assembled from pieces. */
const DIST_LITERAL = /["'`]dist\/[^"'`\n]*["'`]/;

/** The files under a `bun test` path that name a `dist/` path in code. */
function readersOf(name: string): string[] {
  return pathsOf(scripts()[name]!)
    .flatMap(typescriptFilesUnder)
    .filter((file) => DIST_LITERAL.test(codeLines(readFileSync(file, "utf8"))));
}

/** The `test*` scripts, which are the ones whose files read what `synth` writes. */
function testScripts(): string[] {
  return Object.keys(scripts()).filter((name) => /^test(:|$)/.test(name));
}

describe("a script that runs tests reading the build output", () => {
  /**
   * The ratchet. `dist/` is gitignored, so a suite reading it is broken on every
   * checkout until something builds it — and CI, which does build, is the one place
   * that cannot tell.
   */
  test("builds it first, whatever the caller set up", () => {
    const table = scripts();
    const offenders: string[] = [];

    for (const name of testScripts()) {
      const readers = readersOf(name);
      if (readers.length === 0) continue;

      const hook = table[`pre${name}`];
      if (!hook?.includes("synth")) {
        offenders.push(
          `\`${name}\` reads dist/ in ${readers.length} file(s), e.g. ${readers[0]}, and ` +
            (hook ? `\`pre${name}\` is \`${hook}\`, which does not run \`synth\`` : `there is no \`pre${name}\` script`),
        );
      }
    }

    expect(
      offenders,
      "`bun test` exits 0 on a path that does not exist, so a missing `dist/` is not an error there — " +
        "it is 59 ENOENT failures in an agent's run, which never built it, while CI stays green because " +
        "its check runs `synth` first. Give the script a `pre<name>` running `bun run synth`:\n" +
        offenders.join("\n"),
    ).toEqual([]);
  });

  /** The scan above is a claim that these files really do name the artifact. */
  test("the scan is looking at files that name a dist/ path in code", () => {
    const found = testScripts().flatMap(readersOf);
    expect(
      found.length,
      "nothing under a `test*` path names a `dist/` path in code, so the test above checks nothing",
    ).toBeGreaterThan(0);
  });

  /**
   * The premise the two assertions above rest on, measured against bun itself rather
   * than assumed. A throwaway package with the same two script names: if bun ever stops
   * running `pre<name>`, this fails here instead of the build silently not happening in
   * every agent's run.
   */
  test("bun runs `pre<name>` before `run <name>`, which is what the keys above rely on", () => {
    const dir = mkdtempSync(join(tmpdir(), "atomaton-pre-hook-"));
    try {
      writeFileSync(
        join(dir, "package.json"),
        `${JSON.stringify(
          {
            name: "pre-hook-probe",
            scripts: {
              synth: "echo ATOMATON_SYNTH_RAN",
              pretest: "bun run synth",
              "pretest:e2e": "bun run synth",
              test: "echo ATOMATON_TEST_RAN",
              "test:e2e": "echo ATOMATON_TEST_RAN",
            },
          },
          null,
          2,
        )}\n`,
      );
      for (const name of ["test", "test:e2e"]) {
        const r = spawnSync("bun", ["run", name], { encoding: "utf8", cwd: dir, env: hermeticEnv(), timeout: 60_000 });
        expect(r.status, `\`bun run ${name}\` in a throwaway package failed:\n${r.stderr}`).toBe(0);
        const out = `${r.stdout}${r.stderr}`;
        expect(out, `bun no longer runs \`pre${name}\`, so nothing builds dist/ in an agent's run`).toContain(
          "ATOMATON_SYNTH_RAN",
        );
        expect(
          out.indexOf("ATOMATON_SYNTH_RAN"),
          `bun runs \`pre${name}\` after \`${name}\`, which is too late`,
        ).toBeLessThan(out.indexOf("ATOMATON_TEST_RAN"));
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});

/**
 * This tree's own build inputs, in a directory of its own.
 *
 * In a COPY and not in place, which is a decision about the OTHER suites rather than
 * about this one: `bun test` runs files in parallel and twelve of them read `dist/`, so
 * a test that deleted the real `dist/` and rebuilt it would be handing an occasional
 * `ENOENT` to a file running beside it -- the flaky failure this whole file exists to
 * make unnecessary. The copy holds the same `package.json`, `src/` and `wac.config.ts`
 * this tree has, so the commands measured are this tree's commands; only the tree they
 * write into is a throwaway one.
 *
 * `node_modules` is a symlink, because `synth` bundles the dependencies of the entry
 * points it builds and a copy of 76MB per test would be the slowest thing here.
 */
function coldCopy(): string {
  const dir = mkdtempSync(join(tmpdir(), "atomaton-cold-tree-"));
  cpSync("package.json", join(dir, "package.json"));
  cpSync("wac.config.ts", join(dir, "wac.config.ts"));
  cpSync("src", join(dir, "src"), { recursive: true });
  symlinkSync(join(process.cwd(), "node_modules"), join(dir, "node_modules"), "junction");
  return dir;
}

describe("the commands those hooks name", () => {
  /**
   * The behavioural half: `bun run pretest` is the first thing `bun run test` does, so
   * it has to leave the artifact behind from a tree that has none. `rm -rf dist` on the
   * real tree is the measurement in the pull request; this is the same command and the
   * same absence, one directory over.
   */
  for (const [hook, script] of [
    ["pretest", "test"],
    ["pretest:e2e", "test:e2e"],
  ] as const) {
    test(`\`${hook}\` builds dist/ from nothing, so \`bun run ${script}\` can read it`, () => {
      const command = scripts()[hook];
      expect(command, `package.json has no \`${hook}\` script`).toBeDefined();

      const dir = coldCopy();
      try {
        expect(existsSync(join(dir, "dist")), "the precondition: nothing built yet").toBe(false);
        const r = spawnSync("bun", ["run", hook], { encoding: "utf8", cwd: dir, env: hermeticEnv(), timeout: 300_000 });
        expect(r.status, `\`bun run ${hook}\` (\`${command}\`) failed:\n${r.stdout}\n${r.stderr}`).toBe(0);
        expect(
          existsSync(join(dir, BUILT_WORKFLOW)),
          `\`bun run ${hook}\` exited 0 without writing ${BUILT_WORKFLOW}, so the suites that read ` +
            `dist/ still report ENOENT in an agent's run`,
        ).toBe(true);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }, 300_000);
  }
});
