# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-08.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 12 | 25% | 2,124 | 3,364 | 31 | 53.5 |
| Last 30 days | 32 | 9.4% | 1,078 | 10,246 | 36 | 34.2 |
| Last year | 32 | 9.4% | 1,078 | 10,246 | 36 | 34.2 |
| All time | 32 | 9.4% | 1,078 | 10,246 | 36 | 34.2 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 29 |
| `failed` | 3 |

## Last 7 days

8 sessions.

**Ran to an end without a report:** 4 of 7 sessions whose last run the core recorded as `completed` — 57.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**21,879,599 tokens** over 5 runs that reported them, **94.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 3,047,517 | 11,067,135 | 11,067,135 | 11,067,135 | 21,879,599 |
| messages per session | 388 | 651 | 651 | 651 | 2,451 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 6 | 75% |
| `engineer` | 1 | 12.5% |
| `reviewer` | 1 | 12.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 841 | 17 | 22 | 2% |
| `read` | 195 | 2 | 1 | 1% |
| `web__fetch` | 81 | 5 | 0 | 6.2% |
| `grep` | 61 | 1 | 1 | 1.6% |
| `edit` | 41 | 1 | 0 | 2.4% |
| `github__get_issue` | 35 | 0 | 0 | 0% |
| `github__get_issue_comments` | 32 | 0 | 1 | 0% |
| `search__search_issues` | 25 | 0 | 0 | 0% |
| `github__get_check_runs` | 19 | 0 | 0 | 0% |
| `list` | 19 | 0 | 0 | 0% |
| `github__list_prs` | 16 | 0 | 0 | 0% |
| `write` | 16 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 15 | 0 | 0 | 0% |
| `github__get_branch` | 13 | 0 | 0 | 0% |
| `github__create_issue` | 10 | 0 | 0 | 0% |
| `github__get_pr` | 10 | 1 | 0 | 10% |
| `glob` | 8 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 7 | 0 | 0 | 0% |
| `github__commit_and_push` | 6 | 1 | 0 | 16.7% |
| `github__list_issues` | 6 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 5 | 0 | 0 | 0% |
| `github__create_pr` | 4 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__get_pr_diff` | 2 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `delegate_readonly__run` | 1 | 0 | 0 | 0% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 540 | 64.2% |
| `search` | 159 | 18.9% |
| `edit` | 62 | 7.4% |
| `open` | 58 | 6.9% |
| `verify` | 22 | 2.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 7 | 46.7% |
| `engineering/environment` | 4 | 26.7% |
| `delivery/pipeline-setup` | 2 | 13.3% |
| `engineering/secrets-in-a-check` | 1 | 6.7% |
| `research/web-search` | 1 | 6.7% |

## Last 30 days

20 sessions.

**Ran to an end without a report:** 8 of 19 sessions whose last run the core recorded as `completed` — 42.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**75,824,115 tokens** over 15 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,068,104 | 11,220,302 | 16,895,165 | 16,895,165 | 75,824,115 |
| messages per session | 151 | 583 | 651 | 651 | 4,587 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 11 | 55% |
| `engineer` | 6 | 30% |
| `reviewer` | 3 | 15% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,295 | 23 | 29 | 1.8% |
| `read` | 562 | 3 | 2 | 0.5% |
| `grep` | 282 | 5 | 1 | 1.8% |
| `web__fetch` | 136 | 7 | 0 | 5.1% |
| `edit` | 93 | 1 | 0 | 1.1% |
| `github__get_issue` | 65 | 0 | 0 | 0% |
| `list` | 63 | 1 | 0 | 1.6% |
| `github__get_issue_comments` | 56 | 0 | 1 | 0% |
| `search__search_issues` | 40 | 0 | 0 | 0% |
| `write` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 28 | 0 | 0 | 0% |
| `github__get_check_runs` | 28 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 27 | 0 | 0 | 0% |
| `github__get_pr` | 25 | 3 | 0 | 12% |
| `github__list_prs` | 24 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `glob` | 18 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 12 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__get_pr_diff` | 7 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `github__get_pr_reviews` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `search__search_code` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 889 | 68.6% |
| `search` | 203 | 15.7% |
| `edit` | 106 | 8.2% |
| `open` | 74 | 5.7% |
| `verify` | 24 | 1.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 16 | 59.3% |
| `engineering/environment` | 5 | 18.5% |
| `delivery/pipeline-setup` | 4 | 14.8% |
| `engineering/secrets-in-a-check` | 1 | 3.7% |
| `research/web-search` | 1 | 3.7% |

## Last year

20 sessions.

**Ran to an end without a report:** 8 of 19 sessions whose last run the core recorded as `completed` — 42.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**75,824,115 tokens** over 15 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,068,104 | 11,220,302 | 16,895,165 | 16,895,165 | 75,824,115 |
| messages per session | 151 | 583 | 651 | 651 | 4,587 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 11 | 55% |
| `engineer` | 6 | 30% |
| `reviewer` | 3 | 15% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,295 | 23 | 29 | 1.8% |
| `read` | 562 | 3 | 2 | 0.5% |
| `grep` | 282 | 5 | 1 | 1.8% |
| `web__fetch` | 136 | 7 | 0 | 5.1% |
| `edit` | 93 | 1 | 0 | 1.1% |
| `github__get_issue` | 65 | 0 | 0 | 0% |
| `list` | 63 | 1 | 0 | 1.6% |
| `github__get_issue_comments` | 56 | 0 | 1 | 0% |
| `search__search_issues` | 40 | 0 | 0 | 0% |
| `write` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 28 | 0 | 0 | 0% |
| `github__get_check_runs` | 28 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 27 | 0 | 0 | 0% |
| `github__get_pr` | 25 | 3 | 0 | 12% |
| `github__list_prs` | 24 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `glob` | 18 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 12 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__get_pr_diff` | 7 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `github__get_pr_reviews` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `search__search_code` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 889 | 68.6% |
| `search` | 203 | 15.7% |
| `edit` | 106 | 8.2% |
| `open` | 74 | 5.7% |
| `verify` | 24 | 1.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 16 | 59.3% |
| `engineering/environment` | 5 | 18.5% |
| `delivery/pipeline-setup` | 4 | 14.8% |
| `engineering/secrets-in-a-check` | 1 | 3.7% |
| `research/web-search` | 1 | 3.7% |

## All time

20 sessions.

**Ran to an end without a report:** 8 of 19 sessions whose last run the core recorded as `completed` — 42.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**75,824,115 tokens** over 15 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,068,104 | 11,220,302 | 16,895,165 | 16,895,165 | 75,824,115 |
| messages per session | 151 | 583 | 651 | 651 | 4,587 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 11 | 55% |
| `engineer` | 6 | 30% |
| `reviewer` | 3 | 15% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,295 | 23 | 29 | 1.8% |
| `read` | 562 | 3 | 2 | 0.5% |
| `grep` | 282 | 5 | 1 | 1.8% |
| `web__fetch` | 136 | 7 | 0 | 5.1% |
| `edit` | 93 | 1 | 0 | 1.1% |
| `github__get_issue` | 65 | 0 | 0 | 0% |
| `list` | 63 | 1 | 0 | 1.6% |
| `github__get_issue_comments` | 56 | 0 | 1 | 0% |
| `search__search_issues` | 40 | 0 | 0 | 0% |
| `write` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 28 | 0 | 0 | 0% |
| `github__get_check_runs` | 28 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 27 | 0 | 0 | 0% |
| `github__get_pr` | 25 | 3 | 0 | 12% |
| `github__list_prs` | 24 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `glob` | 18 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 12 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__get_pr_diff` | 7 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `github__get_pr_reviews` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `search__search_code` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 889 | 68.6% |
| `search` | 203 | 15.7% |
| `edit` | 106 | 8.2% |
| `open` | 74 | 5.7% |
| `verify` | 24 | 1.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 16 | 59.3% |
| `engineering/environment` | 5 | 18.5% |
| `delivery/pipeline-setup` | 4 | 14.8% |
| `engineering/secrets-in-a-check` | 1 | 3.7% |
| `research/web-search` | 1 | 3.7% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
