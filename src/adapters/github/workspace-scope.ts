/**
 * workspace-scope.ts — walk to the root issue whose workspace a run shares.
 *
 * The I/O half of `domain/work/workspace.ts`'s `workspaceScope`, which holds the rule.
 * Here is the walking: one hop at a time through `parentIssueOf`, and for a pull
 * request one extra hop first, because a pull request's link to its issue is the
 * `atomaton:parent-issue` tag rather than a sub-issue relationship.
 */
import { gh } from "./gh.ts";
import { parentChain, parentIssueOf, type ParentIssue } from "./parent-issue.ts";
import { PARENT_ISSUE_TAG } from "./tags.ts";
import { workspaceScope, type WorkspaceScope } from "../../domain/work/workspace.ts";

function log(message: string): void {
  console.error(`[atomaton-workspace] ${message}`);
}

/** The issue a pull request was opened for, or undefined when it says nothing. */
function issueOfPullRequest(repo: string, number: number): number | undefined {
  const { code, stdout } = gh("pr", "view", String(number), "--repo", repo, "--json", "body", "--jq", ".body");
  if (code) {
    log(`WARN could not read pull request #${number}`);
    return undefined;
  }
  return PARENT_ISSUE_TAG.read(stdout);
}

/**
 * Which issue's workspace this run shares.
 *
 * A read that fails is reported and turns into a private workspace rather than a
 * borrowed one -- see `domain/work/workspace.ts` for why that direction. The `why` it
 * returns is what the caller logs, so a run working alone when it should have been
 * sharing says so instead of looking normal.
 */
export function resolveWorkspaceScope(repo: string, type: string, number: string | number): WorkspaceScope {
  const target = Number(number);
  if (!Number.isFinite(target) || target <= 0) {
    return workspaceScope(number, [], `"${number}" is not an issue or pull request number`);
  }

  const chain: number[] = [];
  let start = target;

  if (type === "pr") {
    const issue = issueOfPullRequest(repo, target);
    if (issue === undefined) {
      // A pull request with no issue tag is its own root. Ordinary for one a person
      // opened, so it is not a failure -- but it also means no sharing, which is
      // why it is said out loud.
      log(`#${target} names no parent issue; its workspace is its own`);
      return workspaceScope(number, []);
    }
    chain.push(issue);
    start = issue;
  }

  // The walk is `parentChain`'s, so the depth limit and the cycle guard are the same
  // ones `notify.ts` uses. It used to be written out here with its own `MAX_HOPS = 6`
  // and a comment claiming it matched `notify.ts`, which had 10.
  for (const hop of parentChain(start, (current) => ({ data: undefined, parent: parentIssueOf(repo, current) }))) {
    if (!hop.parent.known) {
      // Everything read so far still counts. A chain that broke three hops up is
      // more precise than falling all the way back to the target, and the tests
      // pin that: the root reached is the answer, not the failure.
      return workspaceScope(number, chain, chain.length > 0 ? "" : hop.parent.why);
    }
    if (hop.parent.parent === 0) break;
    chain.push(hop.parent.parent);
  }

  const scope = workspaceScope(number, chain);
  if (!scope.resolved) log(`WARN ${scope.why}; using this target's own workspace`);
  else if (scope.rootIssue !== String(number)) log(`sharing issue #${scope.rootIssue}'s workspace`);
  return scope;
}
