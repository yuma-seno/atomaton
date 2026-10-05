# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-05.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 2 | 0% | 3,364 | 3,364 | 63 | 60.7 |
| Last 30 days | 22 | 0% | 1,078 | 10,246 | 41 | 28.0 |
| Last year | 22 | 0% | 1,078 | 10,246 | 41 | 28.0 |
| All time | 22 | 0% | 1,078 | 10,246 | 41 | 28.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 22 |

## Last 7 days

2 sessions.

**Ran to an end without a report:** 0 of 2 sessions whose last run the core recorded as `completed` — 0%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**15,981,308 tokens** over 2 runs that reported them, **94.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 11,067,135 | 11,067,135 | 11,067,135 | 11,067,135 | 15,981,308 |
| messages per session | 583 | 583 | 583 | 583 | 1,033 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 1 | 50% |
| `engineer` | 1 | 50% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 374 | 3 | 5 | 0.8% |
| `read` | 82 | 0 | 0 | 0% |
| `edit` | 29 | 0 | 0 | 0% |
| `grep` | 24 | 0 | 0 | 0% |
| `github__get_check_runs` | 18 | 0 | 0 | 0% |
| `github__get_issue_comments` | 17 | 0 | 0 | 0% |
| `search__search_issues` | 16 | 0 | 0 | 0% |
| `web__fetch` | 15 | 2 | 0 | 13.3% |
| `github__get_issue` | 14 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 7 | 0 | 0 | 0% |
| `github__list_prs` | 7 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 6 | 0 | 0 | 0% |
| `github__get_pr` | 6 | 0 | 0 | 0% |
| `github__get_branch` | 5 | 0 | 0 | 0% |
| `write` | 5 | 0 | 0 | 0% |
| `github__commit_and_push` | 4 | 1 | 0 | 25% |
| `github__list_pr_review_comments` | 4 | 0 | 0 | 0% |
| `github__create_issue` | 3 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 3 | 0 | 0 | 0% |
| `github__list_issues` | 3 | 0 | 0 | 0% |
| `github__create_pr` | 2 | 0 | 0 | 0% |
| `github__get_pr_diff` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 325 | 86.9% |
| `edit` | 38 | 10.2% |
| `verify` | 6 | 1.6% |
| `open` | 3 | 0.8% |
| `search` | 2 | 0.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 3 | 42.9% |
| `delivery/pipeline-setup` | 2 | 28.6% |
| `engineering/environment` | 2 | 28.6% |

## Last 30 days

15 sessions.

**Ran to an end without a report:** 5 of 15 sessions whose last run the core recorded as `completed` — 33.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**69,925,824 tokens** over 12 runs that reported them, **95.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,295,912 | 11,220,302 | 16,895,165 | 16,895,165 | 69,925,824 |
| messages per session | 152 | 557 | 583 | 583 | 3,340 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 7 | 46.7% |
| `engineer` | 6 | 40% |
| `reviewer` | 2 | 13.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 899 | 11 | 12 | 1.2% |
| `read` | 465 | 1 | 1 | 0.2% |
| `grep` | 247 | 4 | 0 | 1.6% |
| `edit` | 81 | 0 | 0 | 0% |
| `web__fetch` | 72 | 4 | 0 | 5.6% |
| `github__get_issue` | 47 | 0 | 0 | 0% |
| `github__get_issue_comments` | 45 | 0 | 0 | 0% |
| `list` | 45 | 1 | 0 | 2.2% |
| `search__search_issues` | 34 | 0 | 0 | 0% |
| `write` | 28 | 0 | 0 | 0% |
| `github__get_check_runs` | 27 | 0 | 0 | 0% |
| `github__get_pr` | 21 | 2 | 0 | 9.5% |
| `atoma_builtin__load_skill` | 20 | 0 | 0 | 0% |
| `github__get_branch` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 15 | 0 | 0 | 0% |
| `github__list_prs` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 11 | 0 | 0 | 0% |
| `glob` | 10 | 0 | 0 | 0% |
| `github__list_issues` | 9 | 0 | 0 | 0% |
| `github__commit_and_push` | 7 | 1 | 0 | 14.3% |
| `github__get_pr_diff` | 7 | 0 | 0 | 0% |
| `github__create_pr` | 6 | 2 | 0 | 33.3% |
| `github__list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `github__get_pr_reviews` | 5 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 3 | 0 | 0 | 0% |
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
| `other` | 740 | 82.2% |
| `edit` | 86 | 9.6% |
| `search` | 46 | 5.1% |
| `open` | 20 | 2.2% |
| `verify` | 8 | 0.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 13 | 65% |
| `delivery/pipeline-setup` | 4 | 20% |
| `engineering/environment` | 3 | 15% |

## Last year

15 sessions.

**Ran to an end without a report:** 5 of 15 sessions whose last run the core recorded as `completed` — 33.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**69,925,824 tokens** over 12 runs that reported them, **95.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,295,912 | 11,220,302 | 16,895,165 | 16,895,165 | 69,925,824 |
| messages per session | 152 | 557 | 583 | 583 | 3,340 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 7 | 46.7% |
| `engineer` | 6 | 40% |
| `reviewer` | 2 | 13.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 899 | 11 | 12 | 1.2% |
| `read` | 465 | 1 | 1 | 0.2% |
| `grep` | 247 | 4 | 0 | 1.6% |
| `edit` | 81 | 0 | 0 | 0% |
| `web__fetch` | 72 | 4 | 0 | 5.6% |
| `github__get_issue` | 47 | 0 | 0 | 0% |
| `github__get_issue_comments` | 45 | 0 | 0 | 0% |
| `list` | 45 | 1 | 0 | 2.2% |
| `search__search_issues` | 34 | 0 | 0 | 0% |
| `write` | 28 | 0 | 0 | 0% |
| `github__get_check_runs` | 27 | 0 | 0 | 0% |
| `github__get_pr` | 21 | 2 | 0 | 9.5% |
| `atoma_builtin__load_skill` | 20 | 0 | 0 | 0% |
| `github__get_branch` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 15 | 0 | 0 | 0% |
| `github__list_prs` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 11 | 0 | 0 | 0% |
| `glob` | 10 | 0 | 0 | 0% |
| `github__list_issues` | 9 | 0 | 0 | 0% |
| `github__commit_and_push` | 7 | 1 | 0 | 14.3% |
| `github__get_pr_diff` | 7 | 0 | 0 | 0% |
| `github__create_pr` | 6 | 2 | 0 | 33.3% |
| `github__list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `github__get_pr_reviews` | 5 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 3 | 0 | 0 | 0% |
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
| `other` | 740 | 82.2% |
| `edit` | 86 | 9.6% |
| `search` | 46 | 5.1% |
| `open` | 20 | 2.2% |
| `verify` | 8 | 0.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 13 | 65% |
| `delivery/pipeline-setup` | 4 | 20% |
| `engineering/environment` | 3 | 15% |

## All time

15 sessions.

**Ran to an end without a report:** 5 of 15 sessions whose last run the core recorded as `completed` — 33.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**69,925,824 tokens** over 12 runs that reported them, **95.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,295,912 | 11,220,302 | 16,895,165 | 16,895,165 | 69,925,824 |
| messages per session | 152 | 557 | 583 | 583 | 3,340 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 7 | 46.7% |
| `engineer` | 6 | 40% |
| `reviewer` | 2 | 13.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 899 | 11 | 12 | 1.2% |
| `read` | 465 | 1 | 1 | 0.2% |
| `grep` | 247 | 4 | 0 | 1.6% |
| `edit` | 81 | 0 | 0 | 0% |
| `web__fetch` | 72 | 4 | 0 | 5.6% |
| `github__get_issue` | 47 | 0 | 0 | 0% |
| `github__get_issue_comments` | 45 | 0 | 0 | 0% |
| `list` | 45 | 1 | 0 | 2.2% |
| `search__search_issues` | 34 | 0 | 0 | 0% |
| `write` | 28 | 0 | 0 | 0% |
| `github__get_check_runs` | 27 | 0 | 0 | 0% |
| `github__get_pr` | 21 | 2 | 0 | 9.5% |
| `atoma_builtin__load_skill` | 20 | 0 | 0 | 0% |
| `github__get_branch` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 15 | 0 | 0 | 0% |
| `github__list_prs` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 11 | 0 | 0 | 0% |
| `glob` | 10 | 0 | 0 | 0% |
| `github__list_issues` | 9 | 0 | 0 | 0% |
| `github__commit_and_push` | 7 | 1 | 0 | 14.3% |
| `github__get_pr_diff` | 7 | 0 | 0 | 0% |
| `github__create_pr` | 6 | 2 | 0 | 33.3% |
| `github__list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `github__get_pr_reviews` | 5 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 3 | 0 | 0 | 0% |
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
| `other` | 740 | 82.2% |
| `edit` | 86 | 9.6% |
| `search` | 46 | 5.1% |
| `open` | 20 | 2.2% |
| `verify` | 8 | 0.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 13 | 65% |
| `delivery/pipeline-setup` | 4 | 20% |
| `engineering/environment` | 3 | 15% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `research/web-search`
