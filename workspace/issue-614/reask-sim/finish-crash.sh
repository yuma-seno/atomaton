
EXIT_CODE=''
ENDING_INVALID=''

# Nothing published means the step above never reached an ending, so the machinery
# is what failed and not atoma. The boundary flag stays unwritten, and "Post result
# comment" reads that as red.
if [ -z "$EXIT_CODE" ]; then
  echo "::error::the run never reached an ending; the machinery failed before it did"
  exit 1
fi

# The watcher has nothing left to watch for here, and only here: the second turn was
# a turn a person could still stop, and the file it writes is what atoma is handed.
# Killed rather than left to the job, because a poller that outlives the run it was
# polling for spends API budget on an answer nobody will read.
if [ -f "${RUNNER_TEMP}/atomaton-run/stop-watch.pid" ]; then
  kill "$(cat "${RUNNER_TEMP}/atomaton-run/stop-watch.pid")" 2>/dev/null || true
fi

# How the run ended, asked of the run. The core classifies its own ending and
# writes it into the session it just saved; this reads that record. It used to be
# guessed here -- status 2 and then a test for the stop file -- which collapsed two
# different ceilings into one and raced the watcher that writes that file. See
# read_run_ending.ts.
#
# A non-zero status that is not the soft stop is still a failure and still ends the
# step, so none of the run's own outputs are written: the turn failed, and
# decide_turn_ending.ts reads that from the step's outcome. "Post result comment" turns
# that failure into the ending it owes the thread, and the colour it leaves behind is
# decided by the flag the failure branch below publishes.
if [ "$EXIT_CODE" = "2" ] || [ "$EXIT_CODE" = "0" ]; then
  bun run "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton-runtime/scripts/read_run_ending.ts" --session "${RUNNER_TEMP}/atomaton-run/session.json" --exit-code "${EXIT_CODE}" --stop-file "${RUNNER_TEMP}/atomaton-run/stop-requested"
elif [ "$EXIT_CODE" != "0" ]; then
  # atoma's own failure — neither success nor the soft stop — published for
  # "Post result comment", which leaves the run green only for this case. Everything
  # the machinery does around atoma — and the reads that turn a 0/2 exit into an
  # ending, which this bash runs with `-e` — leaves the flag unwritten, and
  # unwritten is red: the machinery's. The residue is a machinery failure that
  # arrives as atoma's exit code (a sudo that passed the preflight and failed inside
  # the real invocation), which nothing here can tell from atoma's own; the log will
  # say.
  echo "atoma_failed=true" >> "$GITHUB_OUTPUT"
  exit $EXIT_CODE
fi

# The step outputs the post steps consume -- the report under a delimiter it
# cannot contain, the directive (empty when the closing message's calls were
# refused), and the three facts read from the ops log -- are `summarize_run.ts`
# now. The greps there carry weights: `"op":"dispatch"` ends in a quote so it
# cannot match `"op":"dispatch-elsewhere"`, which is what keeps one run from
# reading as both handing off and parking.
bun run "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton-runtime/scripts/summarize_run.ts" --run-dir "${RUNNER_TEMP}/atomaton-run" --ending-invalid "${ENDING_INVALID}"
