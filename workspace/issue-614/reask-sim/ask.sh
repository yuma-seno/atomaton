
export AGENT="engineer"
EXIT_CODE='0'
ENDING_INVALID='false'
REASK='ending'
REASK_BUDGET='300'

if [ "$REASK" != "" ]; then
  # atoma read the first file and deleted it, so the second turn gets its own.
  bun run "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton-runtime/scripts/write_credentials_file.ts" --out "$RUNNER_TEMP/atomaton-credentials/credentials.json"
  sudo chown atomaton-tools "$RUNNER_TEMP/atomaton-credentials/credentials.json"
  # The reason travels in rather than being looked for again: `decide_reask.ts` is
  # where two turns and no more is held.
  ASK_RESULT=$(bun run "${ATOMATON_MACHINERY_ROOT:-.}/.github/atomaton-runtime/scripts/ask_again.ts" --run-dir "${RUNNER_TEMP}/atomaton-run" --tool-cache "${RUNNER_TEMP}/atomaton-tool-cache" --tools-file "${RUNNER_TEMP}/atomaton-run/tools.yaml" --credentials-file "$RUNNER_TEMP/atomaton-credentials/credentials.json" --stop-file "${RUNNER_TEMP}/atomaton-run/stop-requested" --reask "${REASK}" --budget-secs "${REASK_BUDGET}" --exit-code "${EXIT_CODE}") || { echo "::error::the second turn could not be run; the run's ending is unknown"; exit 1; }
  EXIT_CODE=$(printf '%s' "$ASK_RESULT" | sed -n 's/^exit_code=//p')
  ENDING_INVALID=$(printf '%s' "$ASK_RESULT" | sed -n 's/^ending_invalid=//p')
fi

{
  echo "exit_code=$EXIT_CODE"
  echo "ending_invalid=$ENDING_INVALID"
} >> "$GITHUB_OUTPUT"
