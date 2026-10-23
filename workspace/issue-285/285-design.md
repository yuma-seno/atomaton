# #285 turn identity — implementation design (settled 2026-10-23)

Version target: 0.21.35. One PR. No back-compat (old-format endings unreadable → silence, per issue).

## Vocabulary
- `TOOK_TAG`: `<!-- atomaton:took=<ask comment id> run=<run id> -->` — one comment, written by the RUNNER at start (new workflow input `ask`, default ""). Empty ask → no claim comment (new-issue entry path: ask is the body, not a comment).
- `ENDED_TAG` extended: `<!-- atomaton:ended=<verb> answers=<ask comment id> run=<run id> -->`. Ask-less endings write `answers=0` (matches no real comment id). Old shape unreadable.

## Ask kinds (comment ids)
person's command comment; dispatch marker comment (postDispatchMarker already returns its id); an ending quoted as the ask by an answers-request dispatch: reload's handoff comment, create_pr's `waiting` turn comment (posted on the PARENT; referenced cross-node by id — comment ids are repo-global).

## The four replacements (design table → code)
1. Watch `tookTurn` → ∃ took with `run=<watched run id>` (github.event.workflow_run.id, new `--run-id` arg). The 3-condition estimation dies.
2. Watch `needsEnding` → ∃ ended with `run=<watched id>`. Time comparison dies.
   Notice when took(mine) && !ending(mine): find the claim's ask A; if A still unanswered → post ask-subject notice that IS the ending (`ended=done answers=A run=<watch id>`) → heals thread → exactly one notice (#252). If A answered → silent.
3. `refuseResolvedWait` → ask-state comparison ("refuseSupersededDispatch"). Given quoted ask A: REFUSE iff
   (i) an ending answers A whose verb is handoff/waiting (ball moved to a run delivering the answer — #283), or
   (ii) an ending answers A carrying AGENT_TAG == dispatched agent and verdictPassed !== false (own verdict already delivered — #282; red retry escapes), or
   (iii) an ask NEWER than A is open (no ending answers it — someone else's live request).
   Else GO. Asks in the check = person commands + markers only (ending-asks referenced by id, not discovered). No "A unclaimed" branch at check time — the claim RACE closes the two-validation residue (see dispatch.ts's own comment).
4. Guard/shaping (`shapedThread`, `whoseTurn`) → claim walk oldest-first: track newest claim (took) and whether an ending answers its ask; drop a person's comment iff a claim is open at its position. Unclaimed window and post-ending = person's turn (person comments during runner startup now KEPT — deliberate). `requestOutstanding` (marker ordering check) UNCHANGED — markers stay load-bearing (decision #2).

## Claim race (acceptance #1)
Runner claim step: post claim → poll until visible → re-read → another took for the SAME ask with smaller comment id → delete own, output claimed=false → gate Run agent / post result / report failure / dispatch-next on claimed=='true'. Backed-off run ends silently (no ending — it took no turn; watch: no took(mine) → silent).

## Plumbing
- Runner input `ask`; exports ATOMATON_ASK_ID (+ GITHUB_RUN_ID already there) into agent step env so tools write answers/run.
- manual-comment: passes `github.event.comment.id` as ask to runner (issue path) and to dispatchPrValidation (pr path).
- dispatch_agent.ts: new `--ask` flag. dispatchRunner: marker dispatches → ask = marker id; answersRequest → caller's ask.
- dispatchPrValidation callers pass ask: manual-comment (command id), create_pr (waiting ending id), commit_and_push (ATOMATON_ASK_ID env = the pushing run's claim).
- validate-pr wac: pass ask through to dispatch step.
- run-watch wac: pass run id; reconcile_run_ending gates unified (took(mine) && !ending(mine)) for runner- AND entry-titled runs; title still parses the node only.
- report_run_failure/post_result_comment: `--ask`/`--run-id` args; machinery notices carry answers+run (no agent tag — preserved).
- The notice wording becomes ask-subject: "this request was taken up, but no answer was posted for it" (was: "run ended without posting its result"). report_run_failure aligned.

## Case battery (all verified in analysis)
(a) quiet command validation GO; (b) handoff+reviewer during wait REFUSE (handoff answers the quoted ask / newer open marker ask); (c) quiet fresh-PR GO (quoted waiting ending, no asks on PR); (d) incident (create_pr path) REFUSE (newer open marker); (e) fix-push cycle GO (engineer's own done ≠ dispatched agent); (f) push+handoff incident REFUSE; (g) red retry GO (verdictPassed=false); (h/k) two validations → claim race; (i) reload GO (quoted handoff unclaimed+unanswered); (j) #282 REFUSE (own verdict on quoted ask).
