/**
 * turn-identity.ts — the ask/run identity a session-ending tool writes onto its ending (#285).
 *
 * A tool that ends the run's turn (`create_pr`, `launch_sub_agent`,
 * `request_close_issue`, `reload_environment`) posts a turn comment whose ending tag
 * carries `answers=<ask id> run=<run id>` — the same identity the runner writes when
 * it claims the turn at start, so the thread's claims and endings name the same turn
 * from both ends.
 *
 * The runner exports both into the agent's environment before the session starts
 * (`ATOMATON_ASK_ID`, and `GITHUB_RUN_ID` which Actions provides); the tool reads
 * them here rather than threading two more values through every tool's schema, which
 * would put a bookkeeping question in front of a model. Absent or unreadable on
 * either is `0` — an answer to no ask, from no run — which matches no real comment
 * or run id and is the honest record for a turn that claimed nothing (a run started
 * by a new issue's body, whose ask is not a comment).
 */
export function endingIdentity(): { answers?: number; run?: number } {
  const ask = Number(process.env.ATOMATON_ASK_ID ?? "");
  const run = Number(process.env.GITHUB_RUN_ID ?? "");
  return {
    ...(Number.isFinite(ask) && ask > 0 ? { answers: ask } : {}),
    ...(Number.isFinite(run) && run > 0 ? { run } : {}),
  };
}
