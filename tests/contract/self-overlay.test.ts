import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { CONFIG_FILE } from "../../src/domain/machinery/machinery-layout.ts";
import { hermeticEnv } from "../../src/entrypoints/machinery/testing/harness.ts";

/**
 * `self/` and `.github/` do not drift apart.
 *
 * ## What this replaced
 *
 * `.github/` used to be the release archive extracted over the previous contents,
 * with three files kept alive by remembering to run `git checkout --` on them
 * afterwards. Two things went wrong with that, and both were silent:
 *
 * - a file the upstream release had **deleted** stayed in the tree. `unzip -o`
 *   overwrites and never removes, so there was no diff to notice it by. The old
 *   `conventions.md` said to "look for orphans under `.github/atomaton/` yourself".
 * - the preserve list lived in a person's memory. `config.yaml` was restored every
 *   time because it was remembered, not because anything checked.
 *
 * `self/` mirrors `.github/`, so the deploy became `rm -rf .github`, extract, copy
 * `self/` over it. An upstream removal is now ordinary -- the file is not recreated
 * -- and the preserve list is a directory rather than a habit.
 *
 * ## What these tests hold
 *
 * That the two copies of every overlay file agree, in both directions: the file
 * exists in both places, and holds the same bytes.
 *
 * An overlay entry needs no release to take effect -- it is a copy, not a build --
 * so a change to `self/X` belongs in the same pull request as the identical change
 * to `.github/X`. This is what turns "remember to change both" into a failing
 * check, and it is why an agent improving `config.yaml` cannot half-apply it.
 *
 * Workflows are the one exception, and the token model is why: GitHub refuses to
 * let a GitHub App token write `.github/workflows/**` at all, so an agent can
 * change `self/workflows/**` and cannot change the deployed copy. Requiring both
 * halves in one pull request would make a workflow change something no agent could
 * ever finish. `self/` leads, the deployed copy catches up at the next self-deploy,
 * and the test below holds the direction that matters: the deployed copy may not
 * be edited on its own.
 *
 * ## Why there is no "every file in `.github/` is accounted for" test
 *
 * There was one, and it was wrong. It required every file under `.github/` to
 * exist in `dist/.github/` or `self/`, meaning to catch a file that accumulated.
 *
 * Nothing accumulates any more. The deploy runs `rm -rf .github` first, so a file
 * the release stopped shipping is simply not recreated -- which is the whole reason
 * `self/` exists. There is nothing left for that test to find.
 *
 * Worse, it was a false alarm waiting to happen. `dist/` is built from the CURRENT
 * `src/`, while `.github/` holds an older release, and the lag between them is
 * deliberate: a change to `src/` must not reconfigure the live agents the moment it
 * merges, and two breakages reached the running system exactly that way. So merge a
 * change that DELETES a file from `src/`, then deploy a release that predates it,
 * and the test fails on a correct deploy pull request.
 *
 * The one case it did cover on its own -- a file added to `.github/` with no
 * counterpart in `self/`, which the next deploy would silently remove -- is already
 * in front of a person. `.github/**` is in `merge.governed_paths`, so any pull request
 * touching it carries the blocker "this pull request changes how agents themselves
 * run" and cannot be merged by an agent at all.
 *
 * These tests likewise do not check that `.github/` matches the current `src/`, for
 * the same reason: the lag is the design, not a defect to detect.
 */
const OVERLAY = "self";
const DEPLOYED = ".github";
const BUILT = "dist/.github";

/**
 * The one path `self/` is allowed to shadow, as a path under `.github/` rather
 * than as a second spelling of it. It was spelled out, and renaming the layout
 * turned the deliberate exception into a violation of the rule it exempts.
 */
const OVERRIDABLE = relative(DEPLOYED, CONFIG_FILE).replaceAll("\\", "/");

function filesUnder(root: string): string[] {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else out.push(relative(root, path).replaceAll("\\", "/"));
    }
  };
  walk(root);
  return out.sort();
}

/**
 * Line endings normalised, because this repository is developed on Windows and
 * `.github/` is checked out CRLF while `dist/` is written LF by the build. A
 * comparison that called every file different would report nothing.
 */
function body(path: string): string {
  return readFileSync(path, "utf8").replaceAll("\r\n", "\n");
}

/**
 * `git`, run in this checkout, returning stdout or `undefined` when it fails.
 *
 * stderr is swallowed: a fetch that cannot reach the remote is an answer here, not
 * something to print. Nothing here stages, commits or writes -- only reads.
 */
function git(...args: string[]): string | undefined {
  const run = spawnSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    // `hermeticEnv()` because GIT_DIR and GIT_WORK_TREE OVERRIDE `cwd`: a child
    // started here would run against whatever repository the caller pointed it at
    // rather than this checkout. `test-hermetic-env.test.ts` requires it of any test
    // that spawns git, and it is the same helper the machinery's own scripts use.
    env: hermeticEnv(),
  });
  return run.status === 0 ? run.stdout : undefined;
}

/**
 * The commit this work branched from, or `undefined` when nothing could say.
 *
 * The same shape as `scan_secrets.ts`. A pull request sets `GITHUB_BASE_REF`, and
 * `atomaton-check.yml` checks out shallow, so unshallow before asking for a merge
 * base; a repository that is already complete refuses that, which is not a
 * failure. A dispatch, and a local run, have no `GITHUB_BASE_REF`: there the base
 * is `origin/main`, read from what the checkout already holds rather than fetched,
 * so a local run does not reach the network to answer a question about the tree.
 *
 * Tolerated rather than required, as it is there: no base is not a finding, and
 * the caller says so rather than guessing at one.
 */
function baseCommit(): string | undefined {
  const named = (process.env.GITHUB_BASE_REF ?? "").trim();

  if (!named) {
    for (const ref of ["origin/main", "origin/HEAD"]) {
      const base = git("merge-base", ref, "HEAD");
      if (base?.trim()) return base.trim();
    }
    return undefined;
  }

  git("fetch", "--quiet", "--unshallow", "origin");
  if (git("fetch", "--quiet", "origin", named) === undefined) return undefined;
  const base = git("merge-base", "FETCH_HEAD", "HEAD");
  return base?.trim() ? base.trim() : undefined;
}

/** The bytes of `path` at `commit`, line endings normalised like `body`. */
function bodyAt(commit: string, path: string): string | undefined {
  const out = git("show", `${commit}:${path}`);
  return out === undefined ? undefined : out.replaceAll("\r\n", "\n");
}

describe("`self/` and `.github/` hold the same overlay", () => {
  test("every file in self/ has a counterpart in .github/", () => {
    const missing = filesUnder(OVERLAY).filter((file) => !existsSync(join(DEPLOYED, file)));
    expect(
      missing,
      `these are in ${OVERLAY}/ but not in ${DEPLOYED}/. The overlay is a copy and needs no ` +
        `release to apply, so add them in this same change`,
    ).toEqual([]);
  });

  test("self/ and .github/ hold the same bytes", () => {
    const differing = filesUnder(OVERLAY).filter(
      // `workflows/` is held by the next test instead, and in one direction only:
      // an agent can write the source and not the deployed copy, so they are
      // allowed to differ there. Every other file is a copy both ways.
      (file) =>
        !file.startsWith("workflows/") &&
        existsSync(join(DEPLOYED, file)) &&
        body(join(OVERLAY, file)) !== body(join(DEPLOYED, file)),
    );
    expect(
      differing,
      `${OVERLAY}/ is the source for these and ${DEPLOYED}/ is a copy of it, so they must match. ` +
        `Editing ${DEPLOYED}/ alone is worse than not editing it: the next self-deploy overwrites ` +
        `it from ${OVERLAY}/ and the change disappears with no diff to notice it by`,
    ).toEqual([]);
  });

  /**
   * The overlay may lead `.github/workflows/`, and the token model is why: a
   * GitHub App token cannot write `.github/workflows/**` at all, so an agent can
   * write `self/workflows/**` and cannot write the deployed copy. The deployed
   * copy is a copy, and self-deploy copies `self/` over it, so it is allowed to
   * lag until the next deploy.
   *
   * The other direction is not allowed, is not forced by any token, and is what a
   * person slips into by hand. The next self-deploy overwrites `.github/` from
   * `self/`, so an edit made there alone is gone with nothing to notice it by.
   * That is caught against the base the pull request branched from: if the
   * deployed copy moved, `self/` has to have moved with it, to the same bytes.
   */
  test("the overlay may lead .github/workflows, but .github/workflows may not move alone", () => {
    const base = baseCommit();
    if (base === undefined) {
      console.warn(
        `no base commit could be read (set GITHUB_BASE_REF, or have origin/main), so the workflow ` +
          `drift check cannot tell which copy moved; skipping rather than guessing`,
      );
      return;
    }

    for (const file of filesUnder(join(OVERLAY, "workflows"))) {
      const lead = body(join(OVERLAY, "workflows", file));
      const deployed = body(join(DEPLOYED, "workflows", file));
      if (!existsSync(join(DEPLOYED, "workflows", file)) || deployed === lead) continue;

      // The deployed copy as the base holds it. Unchanged means `self/` is the one
      // that moved, which is the allowed direction.
      const atBase = bodyAt(base, `${DEPLOYED}/workflows/${file}`);
      if (deployed === atBase) continue;

      expect(
        deployed,
        `${DEPLOYED}/workflows/${file} moved on its own. ${OVERLAY}/ is the source and the next ` +
          `self-deploy reverts ${DEPLOYED}/, so edit ${OVERLAY}/workflows/${file} instead; the ` +
          `deployed copy catches up when Atomaton Self Deploy runs`,
      ).toBe(lead);
    }
  });

  /**
   * The overlay must not shadow a file the deliverable also ships. Two copies of
   * one path, one of which always wins, is the situation `self/` exists to end --
   * and it would look like a working customisation right up to the release that
   * changed the shipped copy.
   *
   * `config.yaml` is the deliberate exception and the only one: the release
   * carries an example, every adopter replaces it, and this repository is an
   * adopter.
   */
  test("the overlay does not shadow the deliverable, except config.yaml", () => {
    // Unlike the membership test this replaced, comparing against `dist/` is right
    // here: the question is whether what `src/` ships TODAY is also overridden in
    // `self/`, and `dist/` is exactly that. No lag is involved.
    if (!existsSync(BUILT)) {
      console.warn(`${BUILT} is absent; run \`bun run synth\` for this test to mean anything`);
      return;
    }
    const shadowed = filesUnder(OVERLAY)
      .filter((file) => existsSync(join(BUILT, file)))
      .filter((file) => file !== OVERRIDABLE);
    expect(
      shadowed,
      `the deliverable ships these too, so ${OVERLAY}/ silently overrides them. If the intent is ` +
        `to change them for everyone, change src/; if only for this repository, that is a fork of ` +
        `a shipped file and needs saying out loud`,
    ).toEqual([]);
  });

  /**
   * Every hand-written workflow in the overlay must parse, and must declare a
   * trigger.
   *
   * This is the test that was missing when it mattered. `atomaton-self-deploy.yml`
   * shipped with a `git commit -m` whose continuation lines started at column 0 --
   * which leaves the block scalar and makes the file invalid YAML. Everything
   * passed: typecheck, synth, all four overlay tests, all of CI.
   *
   * GitHub's response to an unparseable workflow is not an error. It registers the
   * file, shows the PATH where the name should be, and registers no triggers. The
   * only symptom was `gh workflow run` answering
   * `HTTP 422: Workflow does not have 'workflow_dispatch' trigger` about a file
   * that plainly has one.
   *
   * The generated workflows cannot fail this way -- the synth tool builds them from
   * TypeScript and would not emit invalid YAML. Only the hand-written ones can, and
   * they are exactly the ones nothing was checking.
   */
  test("every hand-written workflow in the overlay is valid YAML with a trigger", () => {
    const workflows = filesUnder(join(OVERLAY, "workflows")).filter((file) => /\.ya?ml$/.test(file));
    expect(workflows.length, "the overlay should hold at least one hand-written workflow").toBeGreaterThan(0);

    for (const file of workflows) {
      const path = join(OVERLAY, "workflows", file);
      let document: unknown;
      expect(() => {
        document = Bun.YAML.parse(readFileSync(path, "utf8"));
      }, `${path} is not valid YAML -- GitHub would register it with no triggers and say nothing`).not.toThrow();

      const workflow = document as { name?: string; on?: unknown; true?: unknown; jobs?: Record<string, unknown> };
      // `on` is the YAML 1.1 boolean, so some parsers hand it back under `true`.
      // Accepting either keeps this about the workflow rather than the parser.
      const triggers = workflow.on ?? workflow.true;
      expect(triggers, `${path} declares no triggers, so nothing can start it`).toBeDefined();
      expect(typeof workflow.name, `${path} has no name`).toBe("string");
      expect(Object.keys(workflow.jobs ?? {}).length, `${path} has no jobs`).toBeGreaterThan(0);
    }
  });

  /**
   * The self-deploy workflow is the one thing here that cannot be regenerated, and
   * the one holding a token. Pinning both facts: it exists in the overlay, and
   * nothing in the deliverable knows about the secret.
   */
  test("the self-deploy workflow is this repository's own, and the deliverable never names its token", () => {
    expect(existsSync(join(OVERLAY, "workflows/atomaton-self-deploy.yml"))).toBe(true);
    expect(existsSync(join(BUILT, "workflows/atomaton-self-deploy.yml")), "it must not be shipped").toBe(false);

    // An adopter receiving a reference to this secret would get a workflow that
    // cannot run, and -- worse -- a name suggesting Atomaton expects a PAT.
    for (const file of filesUnder("src")) {
      if (!/\.(ts|yml|yaml|md|json)$/.test(file)) continue;
      expect(
        body(join("src", file)),
        `src/${file} names SELF_DEPLOY_TOKEN; that secret is this repository's own`,
      ).not.toContain("SELF_DEPLOY_TOKEN");
    }
  });
});
