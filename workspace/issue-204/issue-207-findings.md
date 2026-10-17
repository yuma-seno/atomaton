# Issue #207 (yuma-seno/atomaton) — findings from the 2026-10-17 run

Scope of #207 is explicitly the **atoma CLI repo (yuma-seno/atoma, Rust)**, not this
delivery-template checkout. This run cannot reach that repo (no cross-repo push,
shell guard refuses git mutations/gh), so no PR was opened here.

## What is ALREADY shipped in the installed binary (v0.4.0 = main, verified identical via compare API)

`src/application/runner/execution.rs` on yuma-seno/atoma@main (13d99d9):

- `MAX_EMPTY_COMPLETION_RETRIES: u8 = 2` — a contentless completion (no text, no
  tool calls) is re-requested twice, then `bail!("LLM returned empty response
  (finish_reason: {}) 3 times in a row")` → `ended_because: failed` → exit non-zero.
  Covers both empty `tool_calls` arrays and `Stop` with empty text.
- The failure lands in the machinery's existing failed path: `read_run_ending` reads
  `failed` from `atoma_runs`, the step exits non-zero, `report_run_failure.ts` posts
  "did not finish — the run failed" with a log excerpt matching
  `Run failed: LLM returned empty response (finish_reason: …)`.
  → Acceptance criterion 3 (連続空応答で run が失敗終了し、結果コメントが投稿される) is
  met by the installed v0.4.0 default (`.github/workflows/atomaton-runner.yml:43`).
- The error message names finish_reason → scope 3 met for this path.

## Remaining gaps (all in yuma-seno/atoma, Rust)

1. **finish_reason is NOT persisted on session messages.** `Message`
   (src/domain/session.rs) has no finish_reason field; `inference_loop` takes
   `choice.finish_reason` and drops it. `RunRecord`/`atoma_runs` has none either.
   Needed: `finish_reason: Option<String>` on assistant messages
   (`#[serde(default, skip_serializing_if = "Option::is_none")]` for backward
   compat), plus the Responses `incomplete_details.reason` when status is
   incomplete. No migration (repo convention).
2. **Partial-empty is still a false success.** The `FinishReason::Length` arm in
   `inference_loop` appends `content.unwrap_or("")` and returns
   `Completed { reason: Length }` even when text is EMPTY — i.e. a reasoning model
   that consumed the budget (`finish_reason: length` chat-completions, or
   Responses `status: incomplete` + `max_output_tokens`, both mapped to Length)
   is recorded as a successful `completed` run with an empty assistant message.
   That is the exact #194 shape. Fix: route Length-with-empty-text into the same
   `consecutive_empty` retry/bail path as the Stop arm.
3. **The retry is invisible in the session.** The empty-completion retry appends
   nothing (unlike the loop re-ask and the StreamInterrupted re-ask, which append
   user notes). Acceptance criterion 2's "セッションに再試行が記録される" needs a
   marker message, e.g. the same user-note shape the other two re-asks use.

## Sequenced follow-up in THIS repo (yuma-seno/atomaton) — only AFTER the core release exists

- Raise `ATOMA_DEFAULT_VERSION` in `src/workflows/actions/atoma-cli.ts:135`
  (currently "v0.4.0") and add the coupling entry to its checklist doc comment.
- Declare `finish_reason?: string` (and the incomplete-reason field once named)
  on `SessionMessage` in `src/domain/work/session.ts` — not before, or the type
  guesses at an interface that does not exist (the index signature
  `[key: string]: unknown` round-trips it meanwhile).
- Optional machinery follow-up: once messages carry finish_reason, a reader can
  put "the model returned finish_reason=length with no text" into the no-report
  notice (pairs with sibling #205).

## Tool notes

- `delegate`/`delegate_large` fail in this environment (sub-run hits a 402
  quota error on orcarouter/free — the sub-run's own model call fails); do the
  reading in-run with `fetch` on raw.githubusercontent.com / the GitHub blobs API.
- `search_remote_code` timed out once; `fetch` on github.com blob pages works.
