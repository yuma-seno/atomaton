# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-06.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 5 | 20% | 2,318 | 3,364 | 35 | 60.7 |
| Last 30 days | 25 | 4% | 1,123 | 10,246 | 39 | 28.3 |
| Last year | 25 | 4% | 1,123 | 10,246 | 39 | 28.3 |
| All time | 25 | 4% | 1,123 | 10,246 | 39 | 28.3 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 24 |
| `failed` | 1 |

## Last 7 days

4 sessions.

**Ran to an end without a report:** 1 of 4 sessions whose last run the core recorded as `completed` — 25%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**19,028,825 tokens** over 3 runs that reported them, **94.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,914,173 | 11,067,135 | 11,067,135 | 11,067,135 | 19,028,825 |
| messages per session | 450 | 583 | 583 | 583 | 1,540 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 2 | 50% |
| `engineer` | 1 | 25% |
| `reviewer` | 1 | 25% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 539 | 9 | 7 | 1.7% |
| `read` | 119 | 0 | 0 | 0% |
| `web__fetch` | 61 | 3 | 0 | 4.9% |
| `grep` | 40 | 0 | 0 | 0% |
| `edit` | 29 | 0 | 0 | 0% |
| `github__get_issue` | 28 | 0 | 0 | 0% |
| `github__get_issue_comments` | 28 | 0 | 0 | 0% |
| `search__search_issues` | 24 | 0 | 0 | 0% |
| `github__get_check_runs` | 19 | 0 | 0 | 0% |
| `github__list_prs` | 14 | 0 | 0 | 0% |
| `github__get_branch` | 12 | 0 | 0 | 0% |
| `github__get_pr` | 10 | 1 | 0 | 10% |
| `write` | 10 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 9 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 7 | 0 | 0 | 0% |
| `github__create_issue` | 6 | 0 | 0 | 0% |
| `github__commit_and_push` | 5 | 1 | 0 | 20% |
| `github__list_issues` | 5 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 5 | 0 | 0 | 0% |
| `list` | 5 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `github__create_pr` | 3 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 2 | 0 | 0 | 0% |
| `github__get_pr_diff` | 2 | 0 | 0 | 0% |
| `delegate_readonly__run` | 1 | 0 | 0 | 0% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 473 | 87.8% |
| `edit` | 53 | 9.8% |
| `verify` | 6 | 1.1% |
| `open` | 5 | 0.9% |
| `search` | 2 | 0.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 5 | 55.6% |
| `delivery/pipeline-setup` | 2 | 22.2% |
| `engineering/environment` | 2 | 22.2% |

## Last 30 days

16 sessions.

**Ran to an end without a report:** 5 of 16 sessions whose last run the core recorded as `completed` — 31.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**72,973,341 tokens** over 13 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 11,220,302 | 16,895,165 | 16,895,165 | 72,973,341 |
| messages per session | 152 | 557 | 583 | 583 | 3,676 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 7 | 43.8% |
| `engineer` | 6 | 37.5% |
| `reviewer` | 3 | 18.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 993 | 15 | 14 | 1.5% |
| `read` | 486 | 1 | 1 | 0.2% |
| `grep` | 261 | 4 | 0 | 1.5% |
| `web__fetch` | 116 | 5 | 0 | 4.3% |
| `edit` | 81 | 0 | 0 | 0% |
| `github__get_issue` | 58 | 0 | 0 | 0% |
| `github__get_issue_comments` | 52 | 0 | 0 | 0% |
| `list` | 49 | 1 | 0 | 2% |
| `search__search_issues` | 39 | 0 | 0 | 0% |
| `write` | 29 | 0 | 0 | 0% |
| `github__get_check_runs` | 28 | 0 | 0 | 0% |
| `github__get_branch` | 27 | 0 | 0 | 0% |
| `github__get_pr` | 25 | 3 | 0 | 12% |
| `github__list_prs` | 22 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 12 | 0 | 0 | 0% |
| `github__list_issues` | 10 | 0 | 0 | 0% |
| `glob` | 10 | 0 | 0 | 0% |
| `github__commit_and_push` | 8 | 1 | 0 | 12.5% |
| `github__create_pr` | 7 | 2 | 0 | 28.6% |
| `github__get_pr_diff` | 7 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 6 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `atomaton__launch_sub_agent` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
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
| `other` | 822 | 82.7% |
| `edit` | 97 | 9.8% |
| `search` | 46 | 4.6% |
| `open` | 21 | 2.1% |
| `verify` | 8 | 0.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 14 | 66.7% |
| `delivery/pipeline-setup` | 4 | 19% |
| `engineering/environment` | 3 | 14.3% |

## Last year

16 sessions.

**Ran to an end without a report:** 5 of 16 sessions whose last run the core recorded as `completed` — 31.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**72,973,341 tokens** over 13 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 11,220,302 | 16,895,165 | 16,895,165 | 72,973,341 |
| messages per session | 152 | 557 | 583 | 583 | 3,676 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 7 | 43.8% |
| `engineer` | 6 | 37.5% |
| `reviewer` | 3 | 18.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 993 | 15 | 14 | 1.5% |
| `read` | 486 | 1 | 1 | 0.2% |
| `grep` | 261 | 4 | 0 | 1.5% |
| `web__fetch` | 116 | 5 | 0 | 4.3% |
| `edit` | 81 | 0 | 0 | 0% |
| `github__get_issue` | 58 | 0 | 0 | 0% |
| `github__get_issue_comments` | 52 | 0 | 0 | 0% |
| `list` | 49 | 1 | 0 | 2% |
| `search__search_issues` | 39 | 0 | 0 | 0% |
| `write` | 29 | 0 | 0 | 0% |
| `github__get_check_runs` | 28 | 0 | 0 | 0% |
| `github__get_branch` | 27 | 0 | 0 | 0% |
| `github__get_pr` | 25 | 3 | 0 | 12% |
| `github__list_prs` | 22 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 12 | 0 | 0 | 0% |
| `github__list_issues` | 10 | 0 | 0 | 0% |
| `glob` | 10 | 0 | 0 | 0% |
| `github__commit_and_push` | 8 | 1 | 0 | 12.5% |
| `github__create_pr` | 7 | 2 | 0 | 28.6% |
| `github__get_pr_diff` | 7 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 6 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `atomaton__launch_sub_agent` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
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
| `other` | 822 | 82.7% |
| `edit` | 97 | 9.8% |
| `search` | 46 | 4.6% |
| `open` | 21 | 2.1% |
| `verify` | 8 | 0.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 14 | 66.7% |
| `delivery/pipeline-setup` | 4 | 19% |
| `engineering/environment` | 3 | 14.3% |

## All time

16 sessions.

**Ran to an end without a report:** 5 of 16 sessions whose last run the core recorded as `completed` — 31.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**72,973,341 tokens** over 13 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 11,220,302 | 16,895,165 | 16,895,165 | 72,973,341 |
| messages per session | 152 | 557 | 583 | 583 | 3,676 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 7 | 43.8% |
| `engineer` | 6 | 37.5% |
| `reviewer` | 3 | 18.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 993 | 15 | 14 | 1.5% |
| `read` | 486 | 1 | 1 | 0.2% |
| `grep` | 261 | 4 | 0 | 1.5% |
| `web__fetch` | 116 | 5 | 0 | 4.3% |
| `edit` | 81 | 0 | 0 | 0% |
| `github__get_issue` | 58 | 0 | 0 | 0% |
| `github__get_issue_comments` | 52 | 0 | 0 | 0% |
| `list` | 49 | 1 | 0 | 2% |
| `search__search_issues` | 39 | 0 | 0 | 0% |
| `write` | 29 | 0 | 0 | 0% |
| `github__get_check_runs` | 28 | 0 | 0 | 0% |
| `github__get_branch` | 27 | 0 | 0 | 0% |
| `github__get_pr` | 25 | 3 | 0 | 12% |
| `github__list_prs` | 22 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 12 | 0 | 0 | 0% |
| `github__list_issues` | 10 | 0 | 0 | 0% |
| `glob` | 10 | 0 | 0 | 0% |
| `github__commit_and_push` | 8 | 1 | 0 | 12.5% |
| `github__create_pr` | 7 | 2 | 0 | 28.6% |
| `github__get_pr_diff` | 7 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 6 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `atomaton__launch_sub_agent` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
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
| `other` | 822 | 82.7% |
| `edit` | 97 | 9.8% |
| `search` | 46 | 4.6% |
| `open` | 21 | 2.1% |
| `verify` | 8 | 0.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 14 | 66.7% |
| `delivery/pipeline-setup` | 4 | 19% |
| `engineering/environment` | 3 | 14.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `research/web-search`
