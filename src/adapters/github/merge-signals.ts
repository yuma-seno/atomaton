/**
 * merge-signals.ts — reads GitHub's view of a pull request into the input
 * `domain/delivery/merge-readiness.ts` decides on.
 *
 * The adapter half of that pair: everything here is I/O and shape-mapping,
 * everything there is decision. Keeping them apart is what lets the whole merge
 * truth table be tested against plain objects with no `gh` in the loop, and it is
 * the same split `domain/work/handoff.ts` already uses.
 *
 * It lived inside mcp/github.ts, which had grown to 870 lines and was by then the
 * gh plumbing, the tool schemas, the tool handlers, the dispatch helpers AND this.
 * Three GitHub calls that exist only to feed one pure function do not belong in a
 * server's tool registry.
 */
import { ghRead } from "./gh.ts";
import { readPullRequest } from "./pull-request.ts";
import { readBranchRules } from "./branch-rules.ts";
import { isIssueBranch } from "./branch-names.ts";
import { getGovernedPaths, getMergeGates, getMergePolicy } from "../../adapters/runner/config.ts";
import { governedPathsIn, type ActiveRun, type MergeSignals } from "../../domain/delivery/merge-readiness.ts";
import { isHumanAuthor } from "../../domain/work/actor.ts";
import { pathPatternProblem } from "../../domain/delivery/path-patterns.ts";
import {
  matchMergeGates,
  type ChangedFile,
  type FileStatus,
  type MergeGateMatch,
} from "../../domain/delivery/merge-gates.ts";

export interface PullRequestRefs {
  headRefName: string;
  baseRefName: string;
}

interface PullRequestView {
  isDraft?: boolean;
  /** `is_bot` distinguishes an agent's pull request from a person's. */
  author?: { is_bot?: boolean };
  state?: string;
  headRefOid?: string;
  headRefName?: string;
  baseRefName?: string;
  /** Both read only for `merge.gates` conditions; nothing else consults them. */
  title?: string;
  labels?: { name?: string }[];
}

interface CheckRunsResponse {
  check_runs?: { name: string; status: string; conclusion: string | null; details_url?: string }[];
}

interface WorkflowRunsResponse {
  workflow_runs?: { name?: string; status?: string }[];
}

function log(message: string): void {
  console.error(`[atomaton-merge-signals] ${message}`);
}

/**
 * Why this project's `merge.governed_paths` cannot be honoured as written.
 *
 * The same check `merge.gates` patterns get, on the gate that matters more.
 * `merge.governed_paths` decides which changes to the agent's own limits fall to a
 * person, so a pattern that matches nothing hands the agent exactly what the
 * setting was written to withhold — and does it in silence.
 *
 * Reported through the same `gate-config-invalid` blocker as a bad `merge.gates`
 * entry, because it is the same sentence to the person reading it: a gate this
 * project declared could not be evaluated, so the merge is theirs.
 */
function governedPathProblems(): string[] {
  return getGovernedPaths()
    .map((pattern) => pathPatternProblem(pattern))
    .filter((problem) => problem !== "")
    .map((problem) => `\`merge.governed_paths\`: ${problem}`);
}

/**
 * GitHub's per-file statuses, reduced to the three a gate can name.
 *
 * `copied` is an addition. `renamed` is an addition at the new path, and the
 * removal at the old one is added separately below. `changed` is GitHub's word
 * for a mode or type change, which is a modification.
 */
const STATUS_MAP: Record<string, FileStatus> = {
  added: "added",
  copied: "added",
  renamed: "added",
  removed: "removed",
  modified: "modified",
  changed: "modified",
};

/**
 * Statuses that are not a change at all.
 *
 * `unchanged` appears when GitHub lists a file whose content is identical to the
 * base. Mapping it to `modified` would fire a gate over a file nobody touched.
 */
const NOT_A_CHANGE = new Set(["unchanged"]);

interface ChangedFilesRead {
  readonly files: readonly ChangedFile[];
  /** Why the read cannot be trusted, or "" when it can. */
  readonly problem: string;
}

/**
 * What this pull request changes, and what happened to each file.
 *
 * Fails CLOSED, unlike `readBranchRules` in `branch-rules.ts`, and the two differ because of
 * what each failure costs. An unreadable rule list only makes a refusal less
 * specific; an unreadable file list, treated as empty, would let an agent merge
 * exactly the change the governance gate and every declared merge gate exist to
 * stop. So a failure here comes back as a problem, and a problem blocks.
 *
 * One read serves both gates. They ask different questions of the same list, and
 * two calls would be two chances for one of them to silently see nothing.
 */
function readChangedFiles(repo: string, num: number): ChangedFilesRead {
  // `--jq` rather than parsing the response: with `--paginate` the pages arrive
  // as separate JSON documents, which `JSON.parse` cannot read, and dropping
  // `--paginate` would silently stop at 100 files — a large pull request could
  // then hide a workflow change on page two.
  //
  // One JSON array per line rather than `@tsv`, because a tracked path may
  // legitimately contain a tab or a newline and `@tsv` renders both as escapes
  // that split into the wrong fields — a file whose name held a tab would arrive
  // as a status with no path, which `readChangedFiles` reports as unrecognised
  // and turns into a blocker on an honest pull request.
  //
  // `@json` escapes them inside the string, so one file stays one line and
  // `JSON.parse` gives the exact bytes back. `previous_filename` is absent on all
  // but a rename, hence the `//` default.
  // Not `pull-request.ts`'s read, and the reason is the question: the list of files a
  // pull request changes is a paginated sub-resource (`pulls/<n>/files`), not a field of
  // the request, so it has its own endpoint, its own page loop, and its own failure
  // policy — this one fails CLOSED, where every projection of the request itself degrades.
  //
  // `ghRead`, like the pull-request reads in `gatherMergeSignals`: a transient failure
  // here is not an answer either. It comes back as `problem`, and a problem blocks the
  // merge — so on plain `gh` one `HTTP 504` refused a merge that was fine, which is the
  // same false refusal the retry on `mergeStateStatus` exists to prevent.
  const { code, stdout } = ghRead(
    "api",
    `repos/${repo}/pulls/${num}/files?per_page=100`,
    "--paginate",
    "--jq",
    '.[] | [.status, .filename, (.previous_filename // "")] | @json',
  );
  if (code) {
    log(`WARN could not read changed files for #${num}; treating the merge as a person's`);
    return { files: [], problem: `the changed files of #${num} could not be read` };
  }

  const files: ChangedFile[] = [];
  for (const line of stdout.split("\n")) {
    if (line.trim() === "") continue;
    let status = "";
    let path = "";
    let previous = "";
    try {
      [status, path, previous] = JSON.parse(line) as [string, string, string];
    } catch {
      // Fail closed, like every other unreadable answer here. A line this cannot
      // parse means the list is not the list, and guessing at the rest of it
      // would be guessing at which files a gate should have seen.
      return { files: [], problem: `the changed-file list of #${num} could not be parsed` };
    }
    if (NOT_A_CHANGE.has((status ?? "").trim())) continue;
    const mapped = STATUS_MAP[(status ?? "").trim()];
    if (!mapped || !path) {
      // Not a case to guess at. Treating an unrecognised status as "modified"
      // would let a `files_added` gate be walked past by whatever GitHub starts
      // calling an addition next, and the failure would be invisible.
      return {
        files: [],
        problem: `GitHub reported file status '${status}' for #${num}, which Atomaton does not recognise`,
      };
    }
    // A rename is an addition at the new path and a removal at the old one. Read
    // as a bare "renamed" it would be neither, and `git mv` into a gated
    // directory would add a file no `files_added` gate could see.
    files.push({ path, status: mapped });
    if ((status ?? "").trim() === "renamed" && previous) {
      files.push({ path: previous, status: "removed" });
    }
  }
  return { files, problem: "" };
}

/**
 * The workflow runs for a commit that have not finished.
 *
 * A second read of the same commit, and not a second spelling of the check-run one.
 * GitHub creates a status context when the job producing it starts, so between a run
 * starting and its first job registering there is a run and no context of that name.
 * `check-runs` cannot answer that question — the absence it reports is the very thing
 * being questioned.
 *
 * Degrades to an empty list rather than failing the call. Empty reads as "no run is
 * known to be going", which is what this module answered before the read existed: a
 * `checks-missing` blocker and one dispatch attempt. So a failure costs a duplicate run
 * at worst, where throwing would refuse a merge over a read that only refines a blocker.
 */
function readActiveRuns(repo: string, sha: string): ActiveRun[] {
  const { code, stdout, stderr } = ghRead("api", `repos/${repo}/actions/runs?head_sha=${sha}`);
  if (code) {
    log(`WARN could not list the workflow runs for ${sha}: ${stderr || stdout}`);
    return [];
  }
  let answer: WorkflowRunsResponse;
  try {
    answer = stdout ? (JSON.parse(stdout) as WorkflowRunsResponse) : {};
  } catch {
    log(`WARN could not parse the workflow runs for ${sha}`);
    return [];
  }
  // Anything not `completed` may still register a context: GitHub reports `queued`,
  // `in_progress` and, on some paths, `requested`, `waiting` or `pending`. Naming the
  // one value that is finished is what keeps a status this file has not seen from
  // reading as "there is nothing running here".
  return (answer?.workflow_runs ?? [])
    .filter((run) => (run.status ?? "completed") !== "completed")
    .map((run) => ({ name: run.name ?? "(unnamed workflow)", status: run.status ?? "unknown" }));
}

/**
 * GitHub's view of one pull request, plus the check runs on its head commit.
 *
 * `throwOnFailure` is injected rather than imported so the caller keeps ownership
 * of how a hard failure surfaces — an MCP server turns it into a tool error.
 */
export function gatherMergeSignals(
  repo: string,
  num: number,
  throwOnFailure: (message: string) => never,
): { signals: MergeSignals; refs: PullRequestRefs } {
  /**
   * The check runs' read — the one `gh` call left in this module that is not the pull
   * request itself.
   *
   * The pull request is `pull-request.ts`'s read now, so the retry it used to share
   * with this helper lives there. This one is a sub-resource of the head commit: a
   * different endpoint, a different question, and the same retrying `ghRead` because a
   * blip here must not read as "this commit has no check runs".
   */
  const json = <T>(...args: string[]): T => {
    const { code, stdout, stderr } = ghRead(...args);
    // Named, because the message GitHub sends does not name it. `Resource not
    // accessible by integration (HTTP 403)` says nothing about which call produced it,
    // and an error a reader cannot act on is worth as little here as it is in a tool
    // description.
    if (code) throwOnFailure(`gh ${args.slice(0, 3).join(" ")}: ${stderr || stdout}`);
    return stdout ? (JSON.parse(stdout) as T) : (null as T);
  };

  const pr = readPullRequest<PullRequestView>(repo, num, [
    // `mergeable` is deliberately absent: `mergeStateStatus` is the verdict, and
    // requesting it is already what makes GitHub compute mergeability, so asking
    // for both only produced a field nothing read.
    //
    // `isDraft` is not that: it is an attribute of the pull request, not a second
    // opinion on mergeability. It is here because `mergeStateStatus` came back
    // `CLEAN` for a draft, so the verdict alone reported one as ready to merge.
    //
    // `title` and `labels` are here for `merge.gates` only. They ride along on a
    // call already being made, so a project that declares no gate pays nothing
    // for the ones it could have declared.
    "isDraft",
    "author",
    "state",
    "headRefOid",
    "headRefName",
    "baseRefName",
    "title",
    "labels",
  ]);
  // The one read whose failure ends the call. Naming the read is `pull-request.ts`'s
  // now, so the message an agent sees still says which call refused it.
  if (!pr.known) return throwOnFailure(pr.why);
  const view = pr.value;

  // Asked for on its own, because it is the field GitHub is most willing to refuse and
  // the only one whose refusal used to take the whole tool down with it. The reviewer
  // got `Resource not accessible by integration` here and returned nothing at all --
  // no draft check, no human-author check, no governed-path check, none of which need
  // this field.
  //
  // Missing reads as `UNKNOWN`, which `decideMergeReadiness` already treats as a
  // blocker. So the degraded answer refuses the merge and says it could not determine
  // mergeability, which is the honest answer and the safe one; it does not quietly
  // become a yes. That is the whole difference between this read and the one above:
  // not whether a failure is retried — `pull-request.ts` retries both — but what it
  // means.
  const mergeState = readPullRequest<{ mergeStateStatus?: string }>(repo, num, "mergeStateStatus");
  if (!mergeState.known) log(`WARN ${mergeState.why}`);
  const mergeStateStatus = mergeState.known ? (mergeState.value.mergeStateStatus ?? "UNKNOWN") : "UNKNOWN";

  // Check runs hang off the commit, so a `workflow_dispatch` run against the
  // branch registers here exactly as a `pull_request` run would. That is what
  // makes the reviewer's pre-merge CI dispatch visible to this gate at all.
  const sha = view.headRefOid ?? "";
  const runs = sha ? json<CheckRunsResponse>("api", `repos/${repo}/commits/${sha}/check-runs`) : null;
  // Read every time, not only when a required context is absent: the question it
  // answers — is anything still running on this commit — is the one that turns an
  // absence into `checks-pending`, and a conditional read would put the condition in
  // two places. `signals.checks` is what the caller reads; this is what decides
  // whether an absence there is a missing run or a run that has not registered.
  const activeRuns = sha ? readActiveRuns(repo, sha) : [];

  const baseRefName = view.baseRefName ?? "";

  // One read, two gates. A failure to read it is a problem rather than an empty
  // list, so both gates block instead of quietly finding nothing.
  const required = readBranchRules(repo, baseRefName);
  if (!required.known) log(`WARN ${required.why}; blockers will be less specific`);

  const changed = readChangedFiles(repo, num);
  const gates = getMergeGates();
  const gateProblems = [...gates.problems, ...governedPathProblems()];
  if (changed.problem) gateProblems.push(changed.problem);

  const gateMatches: MergeGateMatch[] = changed.problem
    ? []
    : [
        ...matchMergeGates(gates.gates, {
          changedFiles: changed.files,
          labels: (view.labels ?? []).map((label) => label.name ?? "").filter(Boolean),
          title: view.title ?? "",
        }),
      ];

  return {
    signals: {
      mergeStateStatus,
      isDraft: view.isDraft ?? false,
      // Defaults to treating the author as a person. If the field is missing the
      // safe reading is "do not merge this for someone", not "merge it". The rule
      // is `domain/work/actor.ts`'s, shared with every other reader of the fact.
      authoredByAgent: !isHumanAuthor(view.author?.is_bot),
      state: view.state ?? "UNKNOWN",
      // Unknown reads as enforceable, which is the cautious direction: it keeps Atomaton
      // from standing in for GitHub on a repository where GitHub is in fact blocking,
      // and so from reporting one refusal twice.
      requiredChecksEnforceable: required.known ? required.enforceable : true,
      checks: (runs?.check_runs ?? []).map((run) => ({
        name: run.name,
        status: run.status,
        conclusion: run.conclusion,
        ...(run.details_url ? { detailsUrl: run.details_url } : {}),
      })),
      activeRuns,
      // An unreadable rule list only costs specificity here: `mergeStateStatus`
      // is still GitHub's verdict, and `decideMergeReadiness` falls back to its
      // generic `blocked` blocker. So this is the one caller for which "unknown"
      // and "none required" lead to the same place, and it says so rather than
      // relying on a shared empty list to mean both.
      requiredChecks: required.known ? required.contexts : [],
      // The same predicate `dispatchCd` asks before deploying a merge, because it is
      // the same question: is this merge a delivery, or a checkpoint inside the tree?
      // (A merge into an issue branch deploys nothing — `actions/dispatch-targets.ts`
      // skips it — and it does not reach the base branch either.) One spelling of the
      // convention, so `merge-readiness.ts` needs no second one.
      //
      // Read from the name, and `isIssueBranch("")` is false: a base that could not
      // be read leaves these checks ON rather than exempting a merge nobody knows
      // the target of.
      stackedMerge: isIssueBranch(baseRefName),
      mergePolicy: getMergePolicy(),
      // Still fail-closed, and now truthfully. This used to put the literal
      // string "(could not read the changed files)" into `governancePaths`,
      // which blocked the merge -- correctly -- with the sentence "this pull
      // request changes how agents themselves run ((could not read the changed
      // files))". It may change nothing of the sort. `governanceUnknown` gets
      // its own blocker saying what is actually true.
      governancePaths: changed.problem
        ? []
        : governedPathsIn(
            changed.files.map((file) => file.path),
            getGovernedPaths(),
          ),
      governanceUnknown: changed.problem || undefined,
      gateMatches,
      gateProblems,
    },
    refs: { headRefName: view.headRefName ?? "", baseRefName },
  };
}
