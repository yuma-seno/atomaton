# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-07.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 11 | 27.3% | 1,123 | 3,364 | 28 | 53.5 |
| Last 30 days | 31 | 9.7% | 1,059 | 10,246 | 35 | 34.2 |
| Last year | 31 | 9.7% | 1,059 | 10,246 | 35 | 34.2 |
| All time | 31 | 9.7% | 1,059 | 10,246 | 35 | 34.2 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 28 |
| `failed` | 3 |

## Last 7 days

7 sessions.

**Ran to an end without a report:** 3 of 6 sessions whose last run the core recorded as `completed` — 50%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**21,879,599 tokens** over 5 runs that reported them, **94.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 3,047,517 | 11,067,135 | 11,067,135 | 11,067,135 | 21,879,599 |
| messages per session | 119 | 583 | 583 | 583 | 1,800 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 5 | 71.4% |
| `engineer` | 1 | 14.3% |
| `reviewer` | 1 | 14.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 590 | 9 | 16 | 1.5% |
| `read` | 159 | 2 | 1 | 1.3% |
| `web__fetch` | 71 | 4 | 0 | 5.6% |
| `grep` | 56 | 0 | 1 | 0% |
| `github__get_issue` | 33 | 0 | 0 | 0% |
| `github__get_issue_comments` | 31 | 0 | 0 | 0% |
| `edit` | 29 | 0 | 0 | 0% |
| `search__search_issues` | 25 | 0 | 0 | 0% |
| `github__get_check_runs` | 19 | 0 | 0 | 0% |
| `github__list_prs` | 15 | 0 | 0 | 0% |
| `github__get_branch` | 13 | 0 | 0 | 0% |
| `list` | 13 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 12 | 0 | 0 | 0% |
| `github__create_issue` | 10 | 0 | 0 | 0% |
| `github__get_pr` | 10 | 1 | 0 | 10% |
| `write` | 10 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 7 | 0 | 0 | 0% |
| `github__list_issues` | 6 | 0 | 0 | 0% |
| `github__commit_and_push` | 5 | 1 | 0 | 20% |
| `github__list_pr_review_comments` | 5 | 0 | 0 | 0% |
| `glob` | 5 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 3 | 0 | 0 | 0% |
| `github__create_pr` | 3 | 0 | 0 | 0% |
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
| `other` | 499 | 84.6% |
| `edit` | 55 | 9.3% |
| `search` | 17 | 2.9% |
| `verify` | 10 | 1.7% |
| `open` | 9 | 1.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 6 | 50% |
| `engineering/environment` | 3 | 25% |
| `delivery/pipeline-setup` | 2 | 16.7% |
| `research/web-search` | 1 | 8.3% |

## Last 30 days

19 sessions.

**Ran to an end without a report:** 7 of 18 sessions whose last run the core recorded as `completed` — 38.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**75,824,115 tokens** over 15 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,068,104 | 11,220,302 | 16,895,165 | 16,895,165 | 75,824,115 |
| messages per session | 135 | 557 | 583 | 583 | 3,936 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 10 | 52.6% |
| `engineer` | 6 | 31.6% |
| `reviewer` | 3 | 15.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,044 | 15 | 23 | 1.4% |
| `read` | 526 | 3 | 2 | 0.6% |
| `grep` | 277 | 4 | 1 | 1.4% |
| `web__fetch` | 126 | 6 | 0 | 4.8% |
| `edit` | 81 | 0 | 0 | 0% |
| `github__get_issue` | 63 | 0 | 0 | 0% |
| `list` | 57 | 1 | 0 | 1.8% |
| `github__get_issue_comments` | 55 | 0 | 0 | 0% |
| `search__search_issues` | 40 | 0 | 0 | 0% |
| `write` | 29 | 0 | 0 | 0% |
| `github__get_branch` | 28 | 0 | 0 | 0% |
| `github__get_check_runs` | 28 | 0 | 0 | 0% |
| `github__get_pr` | 25 | 3 | 0 | 12% |
| `atoma_builtin__load_skill` | 24 | 0 | 0 | 0% |
| `github__list_prs` | 23 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `glob` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 12 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 8 | 1 | 0 | 12.5% |
| `github__create_pr` | 7 | 2 | 0 | 28.6% |
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
| `other` | 848 | 81.1% |
| `edit` | 99 | 9.5% |
| `search` | 61 | 5.8% |
| `open` | 25 | 2.4% |
| `verify` | 12 | 1.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 15 | 62.5% |
| `delivery/pipeline-setup` | 4 | 16.7% |
| `engineering/environment` | 4 | 16.7% |
| `research/web-search` | 1 | 4.2% |

## Last year

19 sessions.

**Ran to an end without a report:** 7 of 18 sessions whose last run the core recorded as `completed` — 38.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**75,824,115 tokens** over 15 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,068,104 | 11,220,302 | 16,895,165 | 16,895,165 | 75,824,115 |
| messages per session | 135 | 557 | 583 | 583 | 3,936 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 10 | 52.6% |
| `engineer` | 6 | 31.6% |
| `reviewer` | 3 | 15.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,044 | 15 | 23 | 1.4% |
| `read` | 526 | 3 | 2 | 0.6% |
| `grep` | 277 | 4 | 1 | 1.4% |
| `web__fetch` | 126 | 6 | 0 | 4.8% |
| `edit` | 81 | 0 | 0 | 0% |
| `github__get_issue` | 63 | 0 | 0 | 0% |
| `list` | 57 | 1 | 0 | 1.8% |
| `github__get_issue_comments` | 55 | 0 | 0 | 0% |
| `search__search_issues` | 40 | 0 | 0 | 0% |
| `write` | 29 | 0 | 0 | 0% |
| `github__get_branch` | 28 | 0 | 0 | 0% |
| `github__get_check_runs` | 28 | 0 | 0 | 0% |
| `github__get_pr` | 25 | 3 | 0 | 12% |
| `atoma_builtin__load_skill` | 24 | 0 | 0 | 0% |
| `github__list_prs` | 23 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `glob` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 12 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 8 | 1 | 0 | 12.5% |
| `github__create_pr` | 7 | 2 | 0 | 28.6% |
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
| `other` | 848 | 81.1% |
| `edit` | 99 | 9.5% |
| `search` | 61 | 5.8% |
| `open` | 25 | 2.4% |
| `verify` | 12 | 1.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 15 | 62.5% |
| `delivery/pipeline-setup` | 4 | 16.7% |
| `engineering/environment` | 4 | 16.7% |
| `research/web-search` | 1 | 4.2% |

## All time

19 sessions.

**Ran to an end without a report:** 7 of 18 sessions whose last run the core recorded as `completed` — 38.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**75,824,115 tokens** over 15 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,068,104 | 11,220,302 | 16,895,165 | 16,895,165 | 75,824,115 |
| messages per session | 135 | 557 | 583 | 583 | 3,936 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 10 | 52.6% |
| `engineer` | 6 | 31.6% |
| `reviewer` | 3 | 15.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,044 | 15 | 23 | 1.4% |
| `read` | 526 | 3 | 2 | 0.6% |
| `grep` | 277 | 4 | 1 | 1.4% |
| `web__fetch` | 126 | 6 | 0 | 4.8% |
| `edit` | 81 | 0 | 0 | 0% |
| `github__get_issue` | 63 | 0 | 0 | 0% |
| `list` | 57 | 1 | 0 | 1.8% |
| `github__get_issue_comments` | 55 | 0 | 0 | 0% |
| `search__search_issues` | 40 | 0 | 0 | 0% |
| `write` | 29 | 0 | 0 | 0% |
| `github__get_branch` | 28 | 0 | 0 | 0% |
| `github__get_check_runs` | 28 | 0 | 0 | 0% |
| `github__get_pr` | 25 | 3 | 0 | 12% |
| `atoma_builtin__load_skill` | 24 | 0 | 0 | 0% |
| `github__list_prs` | 23 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `glob` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 12 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 8 | 1 | 0 | 12.5% |
| `github__create_pr` | 7 | 2 | 0 | 28.6% |
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
| `other` | 848 | 81.1% |
| `edit` | 99 | 9.5% |
| `search` | 61 | 5.8% |
| `open` | 25 | 2.4% |
| `verify` | 12 | 1.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 15 | 62.5% |
| `delivery/pipeline-setup` | 4 | 16.7% |
| `engineering/environment` | 4 | 16.7% |
| `research/web-search` | 1 | 4.2% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
