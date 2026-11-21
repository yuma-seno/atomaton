import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * hand-written-workflows.test.ts — the workflows a person writes directly under
 * `.github/workflows/`, and the two that must never come back.
 *
 * ## What this replaced
 *
 * `self-overlay.test.ts`, which held a mirror in `self/` byte-identical to its
 * deployed copy. The mirror existed because the self-deploy rebuilt `.github/`
 * from scratch: anything hand-written left in place would be silently deleted,
 * so every hand-written file needed a second copy that survived the rebuild.
 *
 * The rebuild is gone. The update machinery merges three-way against the
 * manifest, and a path it does not ship is a path it never touches, so
 * hand-written files now live in `.github/` directly -- one copy, no mirror, no
 * sync to hold. The machinery's own deliverable is held by its own tests; what
 * is held here is the person's half of the directory.
 *
 * ## The one failure this keeps, because it happened here
 *
 * A hand-written workflow whose YAML does not parse is not an error GitHub
 * reports. It registers the file, shows the PATH where the name should be, and
 * registers no triggers. The only symptom was `gh workflow run` answering
 * `HTTP 422: Workflow does not have 'workflow_dispatch' trigger` about a file
 * that plainly has one -- and everything else stayed green while a release
 * button silently stopped existing.
 */
const DEPLOYED = ".github/workflows";

describe("the hand-written half of .github/workflows", () => {
  test("every workflow file in .github/workflows is valid YAML with a trigger", () => {
    const workflows = readdirSync(DEPLOYED).filter((file) => /\.ya?ml$/.test(file));
    expect(workflows.length, "the deployed directory should hold workflows").toBeGreaterThan(0);

    for (const file of workflows) {
      const path = join(DEPLOYED, file);
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

  test("the self-hosting workflows are the ones the machinery replaced", () => {
    // The one hand-written workflow: the release button.
    expect(existsSync(join(DEPLOYED, "release.yml")), "release.yml is this repository's own").toBe(true);

    // Both are gone on purpose, and their return would mean the old world came
    // back with them: `self-deploy.yml` rebuilt `.github/` and needed the `self/`
    // mirror; `release-pipeline.yml` was the second declaration of release's
    // inputs, whose `type: choice` in a `workflow_call` invalidated the file.
    // The update machinery is the application; `release.yml` is the whole button.
    for (const gone of ["self-deploy.yml", "release-pipeline.yml"]) {
      expect(existsSync(join(DEPLOYED, gone)), `${gone} was replaced by the update machinery and must not return`).toBe(
        false,
      );
    }

    // The mirror's directory itself. Recreating it politely -- "just a folder for
    // agent-editable sources" -- re-creates the two-copy disease this test
    // exists to keep dead: agents cannot write `.github/` (governed paths), and
    // a workflow they can edit is one whose deployed copy drifts from its source.
    expect(existsSync("self"), "self/ was the self-deploy's mirror; the machinery needs no mirror").toBe(false);
  });

  test("nothing in the deliverable's sources names this repository's own secret", () => {
    // `RELEASE_TOKEN` is a person's PAT, set in this repository's Settings, and
    // known only to the hand-written workflows. A source file naming it would
    // ship a reference to a secret no adopter has -- and, worse, a name
    // suggesting Atomaton expects a PAT of its adopters.
    const offenders = readdirSync("src", { recursive: true })
      .map(String)
      .filter((path) => /\.(ts|yml|yaml|md|json)$/.test(path))
      .filter((path) => readFileSync(join("src", path), "utf8").includes("RELEASE_TOKEN"));
    expect(offenders, `src/${offenders.join(", src/")} names RELEASE_TOKEN; that secret is this repository's own`).toEqual(
      [],
    );
  });
});
