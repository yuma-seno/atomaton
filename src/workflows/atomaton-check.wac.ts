import { Workflow, type GeneratedWorkflowTypes as GWT } from "@github-actions-workflow-ts/lib";
import { ActionsCheckoutV4 } from "@github-actions-workflow-ts/actions";
import { DefinedJob, JobCondition, TypedOutputsStep } from "./actions/base.ts";
import { COMMANDS_VAR, matrixJob, matrixSecretEnv, RUN_DECLARED_COMMANDS } from "./actions/declared-job.ts";
import { MACHINERY_ROOT, scriptCommand } from "./actions/script-call.ts";
import { ATOMA_DEFAULT_VERSION, installAtomaCliStep } from "./actions/atoma-cli.ts";
import { renameSecretSlots } from "./actions/secret-slots.ts";
import { SetupBunAction } from "./actions/third-party.ts";
import { environmentSetupStep } from "./actions/environment-setup.ts";
import { MACHINERY_ROOT_VAR } from "../domain/machinery/machinery-layout.ts";
import { ref as checkLiveToolsRef } from "../entrypoints/machinery/check_live_tools.ts";
import { ref as planChecksRef } from "../entrypoints/machinery/plan_checks.ts";

// Runs whatever config.yaml's `checks` says verifies this project.
//
// It exists so that a project's verification is something an agent can write.
// GITHUB_TOKEN is refused on `.github/workflows/**` by identity -- on every path
// and every branch, measured -- so an agent asked to set up CI for a new
// repository cannot author a workflow. It can author configuration, and this
// workflow is the fixed shell that runs it. Nothing here changes per project;
// everything that does lives in config.yaml.
//
// A repository that already has CI does not need this: name that workflow in
// `checks.your_workflow` instead, and the jobs say so and pass rather than failing
// over an empty list. The two are alternatives -- declaring both is a configuration
// error, not a precedence rule.
//
// ## One list, read from the default branch, run in two kinds of job
//
// The commands always come from the default branch. The planning job checks that
// branch out and reads `checks` from it, and each check runs in the pull request's
// tree. Nothing here DECIDES anything from that tree, which is what a pull request
// cannot change: it cannot add a check, rename one, or widen the secrets one
// receives.
//
// An entry that named `secrets` becomes a job in `credentialled-checks`, holding the
// ones that entry named and no others. An entry that named none becomes a job in
// `checks`, whose step has nowhere to put a credential at all -- not an empty slot
// list, which is a fact about today's configuration rather than a property of the
// workflow. See `runWithoutCredentials`.
//
// ## Two triggers, because the two kinds of pull request arrive differently
//
// An agent's pull request is opened with GITHUB_TOKEN. For its own token's events
// GitHub still creates the `pull_request` run, but an approval-required one: it sits
// at `action_required`, never executes, and settles as `failure` if the pull request
// merges unapproved. That run is not CI. The real check is the `workflow_dispatch`
// run `validate_pull_request.ts` starts, mirrored onto the head commit where a
// ruleset can see it; approving the held one just runs the same jobs again.
// (GitHub Actions docs: "Triggering a workflow".)
//
// A person's pull request does fire `pull_request`, and nothing was dispatching
// this workflow for one. Since this is what `checks.your_workflow` defaults to, that
// left a repository with no CI at all for its human contributors -- a required check
// that never ran, and a merge refused for a missing check until someone dispatched it
// by hand. So `pull_request` stays listed: dropping `opened` would silence a person's
// first check, the failure this workflow exists to prevent.

/** The name a required status check refers to. Pinned to the shipped ruleset by a contract test. */
export const CHECK_JOB_NAME = "atomaton-check";

/** One matrix entry per `checks` entry that names no secret. */
const CHECKS_JOB_NAME = "checks";
/** One matrix entry per `checks` entry that named its own secrets. */
const CREDENTIALLED_CHECKS_JOB_NAME = "credentialled-checks";
/** Atomaton's own check, which is nobody's configuration to remove. */
const TOOLS_JOB_NAME = "atomaton-tools";

/** Publishes both matrices. One job, because there is one list to read. */
const PLAN_JOB = "plan-checks";
const PLAN_STEP_ID = "plan";
const SPLIT_STEP_ID = "split";

/** Where the machinery is checked out, before it is moved out of the work tree. */
const MACHINERY_DIR = "atomaton-machinery";
/** Where it ends up: outside the work tree, so a project's own commands cannot see it. */
const MACHINERY_ABS = "\${RUNNER_TEMP}/atomaton-machinery";

/**
 * Read `checks` from the default branch and publish it as a step output.
 *
 * The planner is the machinery's, from the same checkout the config comes from: the
 * workflow file that runs is the pull request's (a `workflow_dispatch` run takes its
 * workflow from the ref it was dispatched at), and running the pull request's copy of
 * the planner would be the pull request deciding what runs.
 */
const planStep = new TypedOutputsStep<"jobs">(
  {
    name: "Read `checks`",
    id: PLAN_STEP_ID,
    shell: "bash",
    run: [
      `PLANNER="${MACHINERY_ROOT}/${planChecksRef.runtimePath}"`,
      // The default branch may predate this script, and says so rather than answering
      // as though it had looked. It happens once, in the repository that builds the
      // deliverable: the workflow and the script arrive in one release for everyone
      // else, but here the pull request carrying both is checked by a default branch
      // that has neither yet.
      //
      // `[]` is what it publishes, because there is nothing to run and the job that
      // collects verdicts reads a skipped matrix as a pass. The warning is what keeps
      // that from being silent: an empty answer and an unaskable question look
      // identical afterwards, and only one of them is a project with no such check.
      'if [ ! -f "$PLANNER" ]; then',
      '  echo "::warning::$PLANNER is not on the default branch yet, so no check could be planned. This is expected once, on the change that adds it."',
      `  echo "jobs=[]" >> "\$GITHUB_OUTPUT"`,
      "  exit 0",
      "fi",
      // The same window one step further on: the default branch may hold the PREVIOUS
      // release's planner, which planned one arm per call and takes `--arm`. That
      // planner is what this repository's own pull requests run against until the
      // release carrying this file is applied, so the retry asks for the arm whose
      // entries carry no credential -- where a pull request's own commands lived, and
      // which the split below sends to the job with no secret slots. Once the release
      // lands the first call succeeds and this is never reached.
      'if bun run "$PLANNER"; then',
      "  exit 0",
      "fi",
      'bun run "$PLANNER" --arm pull-request',
      "",
    ].join("\n"),
  },
  ["jobs"],
);

/**
 * The one list, split by whether an entry has anywhere to put a credential.
 *
 * The split lives here rather than in the planner so that what a planner publishes
 * stays one list: the same shape `deploy` publishes, read by the same `matrixJob`, and
 * a planner from the previous release — which published one arm per call — is still
 * something this step can read.
 */
const splitStep = new TypedOutputsStep<"uncredentialled" | "credentialled">(
  {
    name: "Split the list by whether an entry names a secret",
    id: SPLIT_STEP_ID,
    shell: "bash",
    env: { JOBS: planStep.outputs.jobs },
    run: [
      `uncredentialled=$(jq -c '[.[] | select((.secrets // []) | length == 0)]' <<<"$JOBS")`,
      `credentialled=$(jq -c '[.[] | select((.secrets // []) | length > 0)]' <<<"$JOBS")`,
      `echo "uncredentialled=$uncredentialled" >> "\$GITHUB_OUTPUT"`,
      `echo "credentialled=$credentialled" >> "\$GITHUB_OUTPUT"`,
      'echo "$(jq length <<<"$uncredentialled") check(s) named no secret; $(jq length <<<"$credentialled") named their own"',
      "",
    ].join("\n"),
  },
  ["uncredentialled", "credentialled"],
);

/** Publishes each matrix. A separate job, because `strategy` is read before any step runs. */
const planChecksJob = new DefinedJob<{ uncredentialled: string; credentialled: string }>(
  PLAN_JOB,
  {
    "runs-on": "ubuntu-latest",
    "timeout-minutes": 5,
    permissions: { contents: "read" },
    outputs: {
      uncredentialled: `\${{ steps.${SPLIT_STEP_ID}.outputs.uncredentialled }}`,
      credentialled: `\${{ steps.${SPLIT_STEP_ID}.outputs.credentialled }}`,
    },
  },
  [
    new ActionsCheckoutV4({
      name: "Checkout the default branch, which decides what runs",
      with: { ref: "${{ github.event.repository.default_branch }}" },
    }),
    new SetupBunAction({ name: "Setup Bun" }),
    planStep,
    splitStep,
  ],
);

/**
 * The machinery, for a job whose working tree is the pull request.
 *
 * Two checkouts, because the two trees play two parts: the pull request's is where the
 * project's commands run, and the default branch's — the machinery — is what
 * `environment.setup_commands` are read from and where the tool servers' own files
 * live. This is the shape `atomaton-runner` already had for the same reason.
 *
 * Straight back out of the work tree, as the runner does: `actions/checkout` cannot
 * write outside `GITHUB_WORKSPACE`, and a project's own commands (`git status`, a
 * linter run over `.`) must see the repository and nothing else.
 */
function machinerySteps() {
  return [
    new ActionsCheckoutV4({
      name: "Checkout the delivery machinery from the default branch",
      with: { ref: "${{ github.event.repository.default_branch }}", path: MACHINERY_DIR },
    }),
    new TypedOutputsStep({
      name: "Move the machinery out of the work tree",
      shell: "bash",
      run: `rm -rf "${MACHINERY_ABS}"\nmv "${MACHINERY_DIR}" "${MACHINERY_ABS}"\necho "${MACHINERY_ROOT_VAR}=${MACHINERY_ABS}" >> "\$GITHUB_ENV"\n`,
    }),
  ];
}

/**
 * Checks routinely need a token: `gh` for anything, a package manager reaching a
 * registry that authenticates with it, a submodule. Without one a project's commands
 * are the only ones in the system that cannot talk to GitHub, and the failure reads as
 * a broken command rather than a missing token.
 *
 * It grants no more than the job already holds. `contents: read` is what the checkout
 * used, so on a public repository this is what any visitor has, and on a private one it
 * is what the code being tested was fetched with.
 */
const CHECK_ENV = {
  [COMMANDS_VAR]: "${{ toJSON(matrix.commands) }}",
  GH_TOKEN: "${{ github.token }}",
};

/**
 * An entry that named no secret, and a step with nowhere to put one.
 *
 * Two steps rather than one shared by both kinds of entry, and the duplication is the
 * point. A single step carrying the secret slots would have held them empty here,
 * because this entry named none — which makes the guarantee "the list happens to be
 * empty" instead of "there is nowhere to write one". The first is a fact about today's
 * configuration; the second is a property of the workflow, and it is the one
 * `reserved-names.test.ts` holds this to.
 */
function runWithoutCredentials() {
  return new TypedOutputsStep({
    name: "Run this check's commands",
    shell: "bash",
    env: CHECK_ENV,
    run: RUN_DECLARED_COMMANDS,
  });
}

/** An entry that named secrets, handed those and no others. */
function runCredentialledChecks() {
  return new TypedOutputsStep({
    name: "Run this check's commands",
    shell: "bash",
    env: {
      ...matrixSecretEnv(),
      ...CHECK_ENV,
    },
    run: renameSecretSlots() + "\n" + RUN_DECLARED_COMMANDS,
  });
}

/** One check's problem should not hide another's, so neither job stops at the first. */
const CHECK_MATRIX = { timeoutMinutes: 30, failFast: false, permissions: { contents: "read" } } as const;

/**
 * The checks that name no secret: the pull request's tree is the working tree, so a
 * project's own commands run against the change being judged.
 */
const checksJob = matrixJob(
  CHECKS_JOB_NAME,
  planChecksJob,
  { ...CHECK_MATRIX, output: "uncredentialled" },
  [
    new ActionsCheckoutV4({ name: "Checkout the pull request" }),
    ...machinerySteps(),
    new SetupBunAction({ name: "Setup Bun" }),
    environmentSetupStep(),
    runWithoutCredentials(),
  ],
);

/**
 * The checks that named secrets: the same shape, plus the credentials their own entry
 * declared. What they run is decided by the default branch like every other entry, so
 * the tree under test is the pull request's and the commands are not.
 */
const credentialledChecksJob = matrixJob(
  CREDENTIALLED_CHECKS_JOB_NAME,
  planChecksJob,
  { ...CHECK_MATRIX, output: "credentialled" },
  [
    new ActionsCheckoutV4({ name: "Checkout the pull request" }),
    ...machinerySteps(),
    new SetupBunAction({ name: "Setup Bun" }),
    environmentSetupStep(),
    runCredentialledChecks(),
  ],
);

/**
 * Atomaton's own check: start the tool servers this repository's agents would use and
 * ask what they offer, so a guard that has stopped guarding fails here rather than
 * going unnoticed.
 *
 * Its own job rather than a step in the checks' matrix, and the reason is the matrix:
 * it would otherwise run once per declared check, installing the CLI each time, to ask
 * a question that has one answer. It is also not the project's check --
 * `validate_deliverable.ts` is separate for the same reason. A project that could
 * delete it would be a project that can stop being told.
 *
 * The servers it starts are the ones `.github/atomaton/tools/` holds on the DEFAULT
 * BRANCH: the pull request's tools file, config and definitions are the change being
 * judged, and starting them would be the change deciding what this check is allowed to
 * see. The pull request's tree is checked out beside it because the end-to-end suite
 * below runs there.
 */
const toolsJob = new DefinedJob(
  TOOLS_JOB_NAME,
  {
    "runs-on": "ubuntu-latest",
    "timeout-minutes": 30,
    permissions: { contents: "read" },
  },
  [
    new ActionsCheckoutV4({ name: "Checkout the pull request, as the tree under test" }),
    ...machinerySteps(),
    new SetupBunAction({ name: "Setup Bun" }),
    environmentSetupStep(),
    installAtomaCliStep(ATOMA_DEFAULT_VERSION),
    new TypedOutputsStep({
      name: "Check the tool servers against their guards",
      shell: "bash",
      run: `${scriptCommand(checkLiveToolsRef)}\n`,
    }),
    // The end-to-end suite, in the one job that has the CLI installed.
    //
    // `bun run test` does not include `tests/e2e`, and until this step NOTHING ran it:
    // the suite skips itself without `ATOMA_BIN`, `atoma-cli.ts` installs to
    // `/usr/local/bin`, and the helper looks beside the checkout. So the one part of
    // the suite that starts a real sub-run and reads a real tool result had never run
    // anywhere -- which is why #25 (a delegate that could not read a file) could only
    // be argued about from the outside.
    //
    // Here rather than in the checks' own matrix, and for the reason this job exists at
    // all: it is the one job that installs the CLI, and the matrix would install it once
    // per declared check to run the same suite against the same tree. This job holds no
    // repository secret, so nothing here is a credential a pull request could reach.
    //
    // Guarded, because this workflow SHIPS. The suite and its `test:e2e` script are
    // this template's own, and an adopter's tree usually has neither -- Rust, Go,
    // Python, anything not bun -- where `bun run test:e2e` fails with `Script not
    // found` and turns the required context red over a suite that is not theirs. So
    // the step reports what was verified instead of assuming: the suite where the
    // script exists, and a stated skip where it does not.
    //
    // `grep` rather than `bun run --dry-run`, so a repository with no bun at all is
    // answered by the same shell test rather than failing on a missing binary.
    new TypedOutputsStep({
      name: "Run the end-to-end suite against the real CLI",
      shell: "bash",
      // `ATOMA_BIN` is what the helper looks for, and `/usr/local/bin/atoma` is where
      // the install step puts it. Both platforms: the helper's default is the
      // sibling checkout, which only exists on a developer's machine.
      env: { ATOMA_BIN: "/usr/local/bin/atoma" },
      run: [
        `if [ -f package.json ] && grep -q '"test:e2e"' package.json; then`,
        "  bun run test:e2e",
        "else",
        `  echo "this repository does not carry the template's e2e suite (no test:e2e script in package.json); Atomaton's own suite is verified upstream, not here"`,
        "fi",
        "",
      ].join("\n"),
    }),
    // Nothing here runs `.github/atomaton/scripts/check-live-tools.sh`, and that is a
    // decision rather than an omission. The script builds `dist/` from the checkout,
    // so on a pull request it was the one step that checked the tree a release would
    // ship -- but it lives in a directory no release delivers, so a shipped workflow
    // naming it fails on every adopter with `No such file or directory`. Dropping it
    // costs this repository the pull-request-time answer and nothing else: the
    // release-time run in `publish-release.sh` covers the tree after the merge, and
    // that cost is stated in `CONTRIBUTING.md`. An adopter loses nothing, because on
    // their tree the step above reads the deliverable itself.
  ],
);

/**
 * The one job a ruleset names, and all it does is agree with the jobs before it.
 *
 * A required context has to be a fixed string, and the jobs doing the work are not:
 * a matrix entry is reported as `credentialled-checks (cloud-names)`. A required
 * context that stops existing is not a check that fails — it is every pull request
 * waiting on a name nothing reports, and an administrator is needed to undo it. So
 * the name lives here, where nothing can rename it.
 *
 * `if: always()`, because a job skipped by a failed dependency reports nothing, which
 * a required check cannot distinguish from success that has not arrived yet. The
 * verdict is read from the results instead, and `skipped` is a pass: it is what an
 * empty matrix produces, and an empty matrix is a project that declared no such
 * check rather than a check that did not run.
 */
export const checkResultJob = new DefinedJob(
  CHECK_JOB_NAME,
  {
    // The planning job too. A list that could not be read is not a project with no
    // checks: the two matrices are skipped either way, and a verdict that read only
    // them would call a malformed `checks` a pass.
    needs: [planChecksJob, checksJob, credentialledChecksJob, toolsJob],
    if: JobCondition.always(),
    "runs-on": "ubuntu-latest",
    "timeout-minutes": 5,
    permissions: { contents: "read" },
  },
  [
    new TypedOutputsStep({
      name: "Report the verdict of every check job",
      shell: "bash",
      env: {
        PLAN_RESULT: `\${{ needs.${PLAN_JOB}.result }}`,
        CHECKS_RESULT: `\${{ needs.${CHECKS_JOB_NAME}.result }}`,
        CREDENTIALLED_CHECKS_RESULT: `\${{ needs.${CREDENTIALLED_CHECKS_JOB_NAME}.result }}`,
        TOOLS_RESULT: `\${{ needs.${TOOLS_JOB_NAME}.result }}`,
      },
      run: [
        'echo "reading the list of checks:      $PLAN_RESULT"',
        'echo "the checks that named no secret:  $CHECKS_RESULT"',
        'echo "the checks that named secrets:   $CREDENTIALLED_CHECKS_RESULT"',
        'echo "Atomaton\'s own tool check:        $TOOLS_RESULT"',
        'for result in "$PLAN_RESULT" "$CHECKS_RESULT" "$CREDENTIALLED_CHECKS_RESULT" "$TOOLS_RESULT"; do',
        '  case "$result" in',
        "    success|skipped) ;;",
        '    *) echo "::error::a check job reported \'$result\'"; exit 1 ;;',
        "  esac",
        "done",
        "",
      ].join("\n"),
    }),
  ],
);

export const atomaCheck = new Workflow("atomaton-check", {
  name: "Atomaton Check",
  on: {
    workflow_dispatch: {},
    // The default set, written out: a person's pull request when it opens, when
    // it is pushed to, and when it comes back from closed. Marking a draft ready
    // changes no code, so the check already on that commit still stands.
    pull_request: { types: ["opened", "synchronize", "reopened"] },
  } as unknown as GWT.Workflow["on"],
  // Reading the repository and running commands in it. Nothing here writes to
  // GitHub: the check run a ruleset reads is written by atomaton-validate-pr, which
  // holds `checks: write` for that one purpose.
  permissions: { contents: "read" },
}).addJobs([planChecksJob, checksJob, credentialledChecksJob, toolsJob, checkResultJob]);
