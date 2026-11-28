/**
 * dispatch-targets.ts — the workflows an agent's own actions have to start.
 *
 * One fact, and this is where it is written down: **GitHub starts no workflow run
 * for an event its own token triggered.** An agent opening a pull request fires no
 * `pull_request.opened`; an agent merging fires no `push`; a deployment tagging a
 * release fires no `push` for the tag. Anything that would have chained off those
 * events has to be dispatched explicitly, and `workflow_dispatch` is the documented
 * exception that still runs.
 *
 * Every stand-in for a suppressed event is here, or is `dispatch.ts`'s
 * `dispatchRunner`, and each names the event it replaces:
 *
 * | stand-in | the event GitHub did not deliver |
 * |---|---|
 * | `dispatchPrValidation` | `pull_request.opened`, for an agent's pull request |
 * | `dispatchCi` | `push` to a pull request's head branch |
 * | `dispatchCd` | `push` to the branch a merge landed on |
 * | `dispatchTagDeploy` | `push` of a tag a deployment created, and the publish that follows |
 * | `dispatchPostMergeAgent` | `pull_request.closed`, when an agent did the merging |
 * | `dispatchUpdate` | `!upgrade`, and the release the notice just announced |
 * | `dispatchUpdateConflictAgent` | `update.on_new_release: pr-agent` — nothing fires for a pull request that stopped |
 * | `dispatchAgentOnFiledIssue` | `issues.opened`, which GitHub does not deliver for an issue `create_root_issue` creates with the run's own token |
 * | `dispatchConfigFindingAgent` | `issue_comment.created`, which GitHub does not deliver for the `/agent` comment `report_config_findings.ts` used to post |
 * | `dispatchRunner` (`dispatch.ts`) | every hand-off from one agent to the next |
 *
 * A pull request closed without merging dispatches nobody: the close is told to a
 * person instead (`notify_pr_rejected.ts`), naming the agent whose branch is still
 * there to resume. It is not in this table, because the table's job is "who starts
 * runs from here" -- and starting runs from a close is what the machinery no
 * longer does.
 *
 * This header said "All four" while there were five, and three more had been
 * written outside it — two of those in a workflow's own bash, so they ran without
 * `dispatchRunner`'s closed-target guard and wrote no ops-log entry, which is the
 * exact failure `dispatch.ts` was written to make impossible. A count that goes
 * stale is the symptom; `tests/contract/dispatch-sites.test.ts` is what stops the
 * next one being written elsewhere: nothing outside these two modules may start a
 * workflow run.
 *
 * None of them throws, and each returns whether GitHub accepted it. A dispatch that
 * fails must not fail the action that prompted it — a pull request that exists
 * without its CI started is recoverable, one that was never created is not. Whether
 * a refusal is fatal is the CALLER's to decide, and one caller decides it is:
 * `scripts/dispatch_new_tags.ts` fails its job, because a deployment nobody starts
 * is one nobody notices.
 */
import { dispatchWorkflow } from "../../adapters/github/gh.ts";
import { runWaitOptions, waitForDispatchRun, type WorkflowRun } from "../../adapters/github/workflow-runs.ts";
import { DISPATCH_TAG, LLM_CONTEXT_TAG } from "../../adapters/github/tags.ts";
import { commentOnWithId } from "../../adapters/github/work-tree.ts";
import { getDeploySection, getWorkflowName } from "../../adapters/runner/config.ts";
import { dispatchRunner, type DispatchOutcome } from "./dispatch.ts";
import { reportedFromLine, type ReportingRun } from "../../domain/work/filed-issue.ts";
import { mentionPrefix } from "../../domain/work/mention.ts";
import { resolveNotify } from "../../adapters/github/notify.ts";
import { isIssueBranch } from "../../adapters/github/branch-placement.ts";
import { mergeMightDeploy, resolveDeployJobs, type DeployTrigger } from "../../domain/delivery/deploy-jobs.ts";
import { DEFAULT_CD_WORKFLOW, DEFAULT_CI_WORKFLOW } from "../../domain/delivery/shipped-workflows.ts";

// The two shipped workflow names now live in `domain/delivery/shipped-workflows.ts`. They were
// declared here, in a module that runs `gh` and reads config.yaml, and re-exported from
// here to a workflow generator and — once `deliverable-integrity.ts` needed them — to a
// module that must stay pure. The constants are facts about what this template ships, not
// about dispatching, so they moved to where a pure module can reach them.

function log(message: string): void {
  console.error(`[atomaton-github] ${message}`);
}

/**
 * Run CI on a pull request, and hand it to whoever the pull request names.
 *
 * Validation rather than a reviewer directly: the reviewer used to be dispatched
 * from here and arrived before CI had a verdict, so it either reported that it
 * would wait -- with nothing able to wake it -- or merged without one. Validation
 * runs CI first and dispatches what the result calls for: the agent the pull
 * request names when it passes, the agent that opened it when it does not. See
 * `scripts/validate_pull_request.ts`.
 *
 * Returns whether the dispatch was sent. `create_pr` ends the engineer's session
 * on success, so nothing is left running to notice a failure here: the pull request
 * would sit with no CI, no required check and no agent scheduled, while the tool
 * reported success. The caller keeps the session open instead.
 *
 * ## Which agent names are passed, and which are read
 *
 * It used to send `reviewer=<the caller's argument>` and `engineer=engineer`, and
 * the second was a literal -- so a project that renamed its engineer got a CI
 * failure handed to an agent with no definition, from a workflow nobody was
 * watching. Both names are now read from the pull request itself: the agent its
 * thread asks for, and the `atomaton:origin-agent` tag naming whoever opened it. A
 * pull request that names nobody is left for a person, and told so.
 *
 * The reviewer is read from the pull request's THREAD rather than its body alone,
 * because the body is the oldest entry in its own thread: a person commenting
 * `/reviewer` on a pull request whose body says `/engineer` asked for the reviewer,
 * and reading the body would dispatch the engineer instead. See
 * `latestRequestOn` in `adapters/github/thread.ts`.
 */
export function dispatchPrValidation(
  repo: string,
  prNumber: number,
  branch: string,
  options: { askedByPerson?: boolean; /** The ask comment id the dispatched run claims (#285) — see `RunnerDispatch.ask`. */ ask?: string | number } = {},
): boolean {
  return dispatchWorkflow(
    `dispatchPrValidation: validating PR #${prNumber}`,
    "atomaton-validate-pr.yml",
    [
      "--repo", repo,
      "-f", `number=${prNumber}`,
      "-f", `branch=${branch}`,
      "-f", `asked_by_person=${options.askedByPerson === true ? "true" : "false"}`,
      // The ask the run the validation dispatches should claim (#285): the
      // person's command comment, or the `waiting` ending that opened the pull
      // request. Empty is refused downstream — an answers-request dispatch with
      // no ask has nothing to verify its wait against.
      "-f", `ask=${options.ask ?? ""}`,
    ],
    log,
  );
}

/**
 * After a pull request merges, re-invoke the agent that created it on the linked
 * sub-issue, instead of silently closing that sub-issue here.
 *
 * The agent is named by the `atomaton:origin-agent` tag the pull request body
 * carries. Returns whether the dispatch was sent; the caller falls back to
 * closing the issue directly when it was not.
 *
 * ## The comment asks for a judgement, not for a closure
 *
 * It said "Please confirm completion and close this sub-task", and that is the
 * first user message the re-invoked agent reads -- ahead of its system prompt in
 * the only ordering a model has. So whatever the prompt layer says about weighing
 * what merged against what the issue asked for, this line told it the answer
 * before it looked. A merge is evidence that a change was accepted, not that a
 * requirement was satisfied, and the two come apart often enough that deciding is
 * the reason to re-invoke anybody at all: an agent asked only to confirm has no
 * remaining reason to read the issue.
 *
 * Both halves move together or neither holds. `prompt-template.md`'s "After a
 * pull request you opened has merged" paragraph is the other half.
 */
export function dispatchPostMergeAgent(repo: string, subIssueNum: number, agent: string): boolean {
  return (
    dispatchDirective(repo, subIssueNum, agent, {
      context: `the pull request for #${subIssueNum} was merged, so ${agent} was to judge whether it satisfies the issue`,
      notify: resolveNotify(repo, subIssueNum),
      directive:
        "Atomaton: the pull request for this issue merged. Decide whether what merged satisfies what " +
        "this issue asked for. Say which acceptance criteria are met and which are not; conclude the " +
        "issue when they are met, and carry on with the work when they are not.",
      // This dispatch is the merging run's own conclusion. The run sits on the pull
      // request and the run it wakes sits on this issue, so the node comparison alone
      // would log `dispatch-elsewhere` — and the merged pull request's result comment
      // would then claim no agent will run next while one has just been started. See
      // `RunnerDispatch.continuesChain`.
      continuesChain: true,
    }) === "dispatched"
  );
}

/** Kick off the CI workflow against a branch, so a fresh agent pull request gets a check run. */
export function dispatchCi(branch: string): boolean {
  return dispatchWorkflow("dispatchCi", getWorkflowName("ci", DEFAULT_CI_WORKFLOW), ["--ref", branch], log);
}

/**
 * Take a newer template release onto this repository — the doing half of the
 * machinery the notice serves (`scripts/update_atomaton.ts`).
 *
 * `!upgrade` is a comment command, and a comment fires no push and no issue event
 * GitHub would act on, so the update has to be started by name — which is why it
 * is in this table at all. `source` is the thread the command came from, so the
 * run answers where it was asked; empty means the Actions button, and the run then
 * reports only where the machinery reports anyway: the pull request, and the
 * notice when one stands open.
 */
export function dispatchUpdate(repo: string, source: number): boolean {
  return dispatchWorkflow(
    `dispatchUpdate: taking a newer release onto ${repo}`,
    "atomaton-update.yml",
    ["--repo", repo, "-f", `source=${source > 0 ? String(source) : ""}`],
    log,
  );
}

/**
 * Start the agent `update.on_new_release: pr-agent` names, on the update pull
 * request that stopped on a conflict.
 *
 * The mode is a policy for the collision, so this is called by the update run itself
 * -- whoever started it. A person's `!upgrade` that collides starts the agent on a
 * repository that chose `pr-agent`, because the repository chose what happens on a
 * collision, not what happens on a comment.
 *
 * `plan.kept` never reaches here: the plan declined to decide, and a person decides.
 * Only actual conflict markers do, which is the same line the update already draws
 * between the two kinds of stop.
 *
 * The directive comment is this dispatch's marker AND its run's ask, the way the
 * post-merge re-invocation does it -- tagged `include`, because it is the first
 * message the resolving agent reads and it is what tells it what to do.
 */
export function dispatchUpdateConflictAgent(repo: string, prNumber: number, agent: string): boolean {
  return (
    dispatchDirective(repo, prNumber, agent, {
      context: `the update pull request #${prNumber} stopped on a conflict, so ${agent} was to resolve it`,
      type: "pr",
      directive:
        "Atomaton: this pull request takes a newer release onto this tree and stopped where the two " +
        "sides disagree — the files listed above carry conflict markers naming both. Resolve them, " +
        "keeping what this repository wrote where it was deliberate and taking what the release " +
        "changed everywhere else, and say in your report which side you took for each file and why. " +
        "Nothing merges from here: the repository's checks run on the resolved tree, and the merge is " +
        "a person's.",
    }) === "dispatched"
  );
}

/**
 * Kick off the deployment workflow after a merge.
 *
 * Required, not a nicety: this merge is performed with GITHUB_TOKEN, so it fires
 * no `push` on the base branch and a deployment waiting on that chain never
 * runs.
 *
 * A project either names its own workflow in `deploy.your_workflow`, or declares
 * `deploy.on_merge` and lets `atomaton-deploy.yml` run it. In the second case the
 * decision is made HERE rather than in the workflow: a dispatch that starts a runner
 * only to discover that nothing deploys on merge is a wasted run on every single
 * merge, and this is the one trigger where the question can be answered before
 * starting anything. The tag trigger has no such luxury -- `on:` takes no expression
 * -- so that one filters after the fact.
 *
 * It asks the weaker of the two questions -- `mergeMightDeploy`, not
 * `selectDeployJobs` -- because it knows less than the run does: the config it reads
 * predates the merge it is reacting to, and the repository's default branch is not
 * visible from here. An entry that might apply counts as one that does.
 *
 * A declaration that does not parse is not this function's to report. It fails
 * loudly inside the deploy run, where the log belongs to the deployment; here it
 * would fail a merge that is otherwise complete.
 */
export function dispatchCd(baseRef: string): boolean {
  // Only a merge that actually lands work deploys. A sub-issue's pull request
  // merges into its parent's branch, which is still in progress — deploying
  // there would ship half a feature, once per child.
  if (isIssueBranch(baseRef)) {
    log(`dispatchCd: merged into ${baseRef}, which is work in progress; not deploying`);
    return false;
  }

  // Asked only when Atomaton's own workflow is the one that would run: a project
  // naming its own deployment workflow has told us nothing about when it deploys,
  // so there is no question to answer here and the dispatch goes out.
  if (!getWorkflowName("cd")) {
    const { jobs, problems } = resolveDeployJobs(getDeploySection());
    if (problems.length === 0 && !mergeMightDeploy(jobs, baseRef)) {
      log(
        `dispatchCd: nothing in deploy.on_merge covers ${baseRef || "this branch"}, and deploy.your_workflow is unset; nothing to dispatch`,
      );
      return false;
    }
  }

  return dispatchDeploy("dispatchCd", "merge", baseRef);
}

/**
 * Deploy a tag one of this run's deployments just created, and return the run that
 * was started.
 *
 * The same hole as `dispatchCd`, one event along: a deployment that cuts a release
 * creates its tag with GITHUB_TOKEN, so no `push` arrives for it and `on_tag` never
 * fires. See `scripts/dispatch_new_tags.ts` for how a run knows which tags are new,
 * and why the dispatching is a job of its own.
 *
 * The run is returned rather than a boolean because the caller has to WAIT for it.
 * A dispatch that GitHub accepted is not a deployment that happened: `Deploy` on the
 * merge went green before the release it was supposed to publish existed, and the
 * release application that followed it failed looking for a release not yet created.
 * The caller waits for this run and fails its job if it did not succeed, so green means
 * published.
 *
 * `repo` is required rather than optional: the only caller runs in a job checked out
 * for the scripts, not for the repository being deployed.
 */
export function dispatchTagDeploy(repo: string, tag: string): WorkflowRun | null {
  const { workflow, args } = deployDispatch("tag", tag, repo);
  if (!dispatchWorkflow(`dispatchTagDeploy: ${tag}`, workflow, args, log)) return null;
  // The run appearing and the run finishing are different waits. A dispatch that
  // has not shown up in ten minutes is a wrong workflow name or a broken API, not
  // a slow build, so that wait is capped well below the publish's.
  const wait = runWaitOptions();
  return waitForDispatchRun(repo, workflow, tag, { ...wait, attempts: Math.min(wait.attempts, 60) });
}

/**
 * Start the deployment workflow for one ref, whatever stood in for the `push`.
 *
 * One place, because it is one fact: a project either names its own workflow in
 * `deploy.your_workflow` or lets `atomaton-deploy.yml` run its declarations, and
 * only the shipped one understands the `trigger` input. It was written twice, and
 * the second copy — the tag one, written last — named `atomaton-deploy.yml`
 * outright and sent `trigger=tag` unconditionally. A project that had named its own
 * deployment workflow would have had the wrong workflow started, with an input it
 * does not declare.
 *
 * `trigger` is `DeployTrigger` rather than a string, so the value the workflow
 * branches on and the value sent here are the same three names.
 */
function dispatchDeploy(context: string, trigger: DeployTrigger, ref: string, repo?: string): boolean {
  const { workflow, args } = deployDispatch(trigger, ref, repo);
  return dispatchWorkflow(context, workflow, args, log);
}

/** The workflow and argv a deployment dispatch uses, shared by both callers. */
function deployDispatch(
  trigger: DeployTrigger,
  ref: string,
  repo?: string,
): { readonly workflow: string; readonly args: string[] } {
  const configured = getWorkflowName("cd");
  return {
    workflow: configured || DEFAULT_CD_WORKFLOW,
    args: [
      ...(repo ? ["--repo", repo] : []),
      // No `--ref` rather than a guessed one. This used to fall back to `"main"`,
      // in a file that argues a hundred lines above that guessing a workflow name
      // "would dispatch a workflow that does not exist" -- and on a repository whose
      // default branch is `develop`, the guess made the dispatch fail, logged as a
      // WARN, so the merge landed and nothing deployed. Omitted, `gh workflow run`
      // uses the repository's real default branch, which is what `getBaseBranch()`
      // already relies on for the same reason.
      ...(ref ? ["--ref", ref] : []),
      // Only the shipped workflow understands why it was started. A project's own
      // deployment workflow gets the bare dispatch it has always got.
      ...(configured ? [] : ["-f", `trigger=${trigger}`]),
    ],
  };
}

/**
 * Start an agent on a root issue an agent filed, or on the open issue that already
 * carried the report.
 *
 * `create_root_issue` is the one tool that files an issue with no parent — a defect in
 * the machinery, or a decision somebody has to make — and the issue it creates with the
 * run's own `GITHUB_TOKEN` fires no `issues.opened`. So no entry workflow ever sees it,
 * and before this the issue waited for a person to ask for a run on it. That is the
 * suppressed event this stands in for, and the reason it is here rather than in the
 * creating tool.
 *
 * Two callers, one comment. `create_root_issue` reaches it after filing, and again when
 * a title an open issue already carries sends the report there instead — and on that
 * second path the issue was filed by an earlier run, and the dispatch may be refused
 * because a request is already standing. So the directive asks rather than announces:
 * `is asked to take up this issue`, never "starting on this issue", and `Reported from`,
 * which is true of whichever run produced the report. That is also why this takes a
 * `ReportingRun` rather than a filing context: what it describes is the report.
 *
 * The directive comment is also this dispatch's marker and the run's ask, the way
 * `dispatchPostMergeAgent` does it. Tagged `include`: it is the first thing the started
 * agent reads, and it is where it learns that nobody asked for this run, where the
 * report came from, and that the reproduction comes first.
 *
 * The notify login is mentioned in the comment itself. A run nobody asked for is
 * exactly the kind a person should hear about, and the mention is the only part of this
 * that reaches them without them opening the issue.
 *
 * Returns the outcome rather than a boolean because `create_root_issue` reports it: the
 * issue exists whatever happens here, and "no run started, and which kind of no" is what
 * the filing agent can still act on.
 */
export function dispatchAgentOnFiledIssue(
  repo: string,
  issue: number,
  agent: string,
  options: { notify?: string; report?: ReportingRun } = {},
): DispatchOutcome {
  const notify = (options.notify ?? "").trim();
  const from = reportedFromLine(options.report ?? {});
  return dispatchDirective(repo, issue, agent, {
    context: `a report on root issue #${issue} was filed during a run, so ${agent} was asked to take it up`,
    notify,
    directive:
      `${mentionPrefix(notify)}\`${agent}\` is asked to take up this issue.\n\n` +
      "The machinery put this report here during a run, and no person asked for a run on it.\n" +
      (from === "" ? "" : `${from}\n`) +
      "\n" +
      "Start with the reproduction. If it no longer reproduces, or the defect is already fixed, " +
      "comment the evidence and propose closing — the decision to close is the notifying " +
      "person's. Otherwise take it as a normal run: investigate, fix, open a pull request, and " +
      "let the reviewer judge it.",
  });
}

/**
 * What to tell the caller when the run on a just-filed issue did not start.
 *
 * The outcome alone is not enough for the agent that filed the issue: three of these
 * four mean "nothing will ever happen here unless a person acts", and the fourth means
 * "a run is already asked for". A caller that read them as one failure would either
 * announce a retry that cannot help or offer to file the issue again.
 */
export function filedIssueStartNote(outcome: DispatchOutcome, agent: string): string {
  switch (outcome) {
    case "dispatched":
      return "";
    case "refused-outstanding":
      return "A run on this issue had already been asked for, so nobody was started twice.";
    case "refused-closed":
      return "The issue is closed, so nothing was started on it and nothing will be.";
    case "unconfirmed":
      return `The start could not be confirmed, so nothing may be running: a person can start it by commenting \`/${agent}\` on the issue.`;
    case "superseded":
    case "failed":
      return `GitHub did not accept the start: a person can start it by commenting \`/${agent}\` on the issue.`;
  }
}

/**
 * Start the agent `agents.on_config_finding` names, on the issue opened for an
 * `ATOMA_CONFIG_FINDING` line.
 *
 * It used to post `/<agent>` as a comment and leave the entry workflow to read it. A
 * comment written with the job's own `GITHUB_TOKEN` fires no `issue_comment.created`,
 * so no run arrived: the issue sat open carrying a command that looked like it had
 * asked for one, and `agents.on_config_finding` was required, checked, and read by
 * nothing that started anything. `report_config_findings.ts` calls this instead.
 */
export function dispatchConfigFindingAgent(repo: string, issue: number, agent: string): DispatchOutcome {
  return dispatchDirective(repo, issue, agent, {
    context: `config finding #${issue} was opened, so ${agent} was to repair it`,
    directive:
      `\`${agent}\` starting on this issue.\n\n` +
      "Repair the configuration defect described above, and say in your report which guard or " +
      "tool name the tools file had wrong.",
  });
}

/**
 * The comment a dispatch like this writes, and the dispatch itself.
 *
 * One function because the two halves are one decision. The directive IS the marker
 * the ordering check reads and the ask the run claims: the `include` tag comes first
 * because the context reader takes the first one, so the directive stays in the
 * model's context; the `dispatch` tag after it is what makes the comment a marker at
 * all; and the comment's id is passed back rather than a second marker being posted
 * beside it, which is what left every restart with two comments saying one thing.
 *
 * `notify` is empty for the dispatches nobody is waiting on, and named for the ones a
 * person is: a comment that mentions them is how they learn a run started.
 */
function dispatchDirective(
  repo: string,
  number: number,
  agent: string,
  request: {
    context: string;
    directive: string;
    notify?: string;
    type?: "issue" | "pr";
    token?: string;
    continuesChain?: boolean;
  },
): DispatchOutcome {
  const body = `${LLM_CONTEXT_TAG.write("include")}\n${DISPATCH_TAG.write(agent)}\n\n${request.directive}`;
  const markerCommentId = commentOnWithId(repo, number, body);
  if (markerCommentId === null) {
    log(`${request.context}: could not post the directive on #${number}, so ${agent} was not started`);
    return "failed";
  }
  return dispatchRunner({
    context: request.context,
    agent,
    type: request.type ?? "issue",
    number,
    notify: request.notify ?? "",
    repo,
    markerCommentId,
    ...(request.token === undefined ? {} : { token: request.token }),
    ...(request.continuesChain === true ? { continuesChain: true } : {}),
    log,
  });
}
