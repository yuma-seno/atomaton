#!/usr/bin/env bun
/**
 * parse_pr_metadata.ts — Parse the `<!-- atomaton:parent-issue=N -->` tag from a
 * merged PR's body: the issue this pull request belongs to.
 *
 * That one number is the whole output, and it used to be two. See the comment at
 * the write below, and #171.
 *
 * Env: PR_BODY, PR_NUMBER
 * Writes `parent_number=<N-or-empty>` to $GITHUB_OUTPUT.
 */
import { appendFileSync } from "node:fs";
import { PARENT_ISSUE_TAG } from "../../adapters/github/tags.ts";
import { defineScript } from "./lib/script-ref.ts";

export const ref = defineScript(import.meta.url);

function main(): void {
  const body = process.env.PR_BODY ?? "";
  const prNumber = process.env.PR_NUMBER ?? "";
  const githubOutput = process.env.GITHUB_OUTPUT;

  // Kept as a string: it is written straight to $GITHUB_OUTPUT, and an absent
  // tag has to render as empty so the caller's `if: ... != ''` stays false.
  // Prose only: a pull request body quoting the tag in a fenced sample does not
  // carry the link (#304).
  const parentIssue = PARENT_ISSUE_TAG.readProse(body);
  const parent = parentIssue === undefined ? "" : String(parentIssue);
  if (parent) console.error(`PR #${prNumber} belongs to issue #${parent}`);
  else console.error(`PR #${prNumber} has no parent-issue metadata`);

  // One output, where there used to be two.
  //
  // `sub_number` was `closedIssueNumber(body)` and `parent_number` was this tag —
  // and the two were the SAME NUMBER every time, because `injectParentIssue` wrote
  // both from the run's one issue number. The only consumer fed `sub_number` to
  // `parentIssueOf` to find the issue's own parent, so which of the two it was
  // handed made no difference.
  //
  // Both halves of the old pair are gone with it: the `Closes` line no longer
  // exists to be read (#171), and a second spelling of one number is the shape
  // this repository keeps removing. See `issue-links.ts`'s `partOfLine`.
  if (githubOutput) appendFileSync(githubOutput, `parent_number=${parent}\n`);
}

if (import.meta.main) main();
