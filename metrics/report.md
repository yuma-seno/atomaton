# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-07.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 7 | 14.3% | 2,124 | 3,364 | 31 | 53.5 |
| Last 30 days | 27 | 3.7% | 1,078 | 10,246 | 38 | 30.8 |
| Last year | 27 | 3.7% | 1,078 | 10,246 | 38 | 30.8 |
| All time | 27 | 3.7% | 1,078 | 10,246 | 38 | 30.8 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 26 |
| `failed` | 1 |

## Last 7 days

5 sessions.

**Ran to an end without a report:** 2 of 5 sessions whose last run the core recorded as `completed` — 40%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**20,427,571 tokens** over 4 runs that reported them, **94.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,914,173 | 11,067,135 | 11,067,135 | 11,067,135 | 20,427,571 |
| messages per session | 388 | 583 | 583 | 583 | 1,646 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 3 | 60% |
| `engineer` | 1 | 20% |
| `reviewer` | 1 | 20% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 553 | 9 | 8 | 1.6% |
| `read` | 131 | 0 | 0 | 0% |
| `web__fetch` | 70 | 4 | 0 | 5.7% |
| `grep` | 45 | 0 | 0 | 0% |
| `github__get_issue` | 30 | 0 | 0 | 0% |
| `edit` | 29 | 0 | 0 | 0% |
| `github__get_issue_comments` | 29 | 0 | 0 | 0% |
| `search__search_issues` | 25 | 0 | 0 | 0% |
| `github__get_check_runs` | 19 | 0 | 0 | 0% |
| `github__list_prs` | 14 | 0 | 0 | 0% |
| `list` | 13 | 0 | 0 | 0% |
| `github__get_branch` | 12 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 10 | 0 | 0 | 0% |
| `github__create_issue` | 10 | 0 | 0 | 0% |
| `github__get_pr` | 10 | 1 | 0 | 10% |
| `write` | 10 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 7 | 0 | 0 | 0% |
| `github__list_issues` | 6 | 0 | 0 | 0% |
| `github__commit_and_push` | 5 | 1 | 0 | 20% |
| `github__list_pr_review_comments` | 5 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 3 | 0 | 0 | 0% |
| `github__create_pr` | 3 | 0 | 0 | 0% |
| `github__get_pr_diff` | 2 | 0 | 0 | 0% |
| `glob` | 2 | 0 | 0 | 0% |
| `delegate_readonly__run` | 1 | 0 | 0 | 0% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 479 | 86.6% |
| `edit` | 53 | 9.6% |
| `search` | 8 | 1.4% |
| `open` | 7 | 1.3% |
| `verify` | 6 | 1.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 5 | 50% |
| `delivery/pipeline-setup` | 2 | 20% |
| `engineering/environment` | 2 | 20% |
| `research/web-search` | 1 | 10% |

## Last 30 days

17 sessions.

**Ran to an end without a report:** 6 of 17 sessions whose last run the core recorded as `completed` — 35.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**74,372,087 tokens** over 14 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 11,220,302 | 16,895,165 | 16,895,165 | 74,372,087 |
| messages per session | 151 | 557 | 583 | 583 | 3,782 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 8 | 47.1% |
| `engineer` | 6 | 35.3% |
| `reviewer` | 3 | 17.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,007 | 15 | 15 | 1.5% |
| `read` | 498 | 1 | 1 | 0.2% |
| `grep` | 266 | 4 | 0 | 1.5% |
| `web__fetch` | 125 | 6 | 0 | 4.8% |
| `edit` | 81 | 0 | 0 | 0% |
| `github__get_issue` | 60 | 0 | 0 | 0% |
| `list` | 57 | 1 | 0 | 1.8% |
| `github__get_issue_comments` | 53 | 0 | 0 | 0% |
| `search__search_issues` | 40 | 0 | 0 | 0% |
| `write` | 29 | 0 | 0 | 0% |
| `github__get_check_runs` | 28 | 0 | 0 | 0% |
| `github__get_branch` | 27 | 0 | 0 | 0% |
| `github__get_pr` | 25 | 3 | 0 | 12% |
| `atoma_builtin__load_skill` | 22 | 0 | 0 | 0% |
| `github__list_prs` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 12 | 0 | 0 | 0% |
| `glob` | 12 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 8 | 1 | 0 | 12.5% |
| `github__create_pr` | 7 | 2 | 0 | 28.6% |
| `github__get_pr_diff` | 7 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
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
| `other` | 828 | 82.1% |
| `edit` | 97 | 9.6% |
| `search` | 52 | 5.2% |
| `open` | 23 | 2.3% |
| `verify` | 8 | 0.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 14 | 63.6% |
| `delivery/pipeline-setup` | 4 | 18.2% |
| `engineering/environment` | 3 | 13.6% |
| `research/web-search` | 1 | 4.5% |

## Last year

17 sessions.

**Ran to an end without a report:** 6 of 17 sessions whose last run the core recorded as `completed` — 35.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**74,372,087 tokens** over 14 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 11,220,302 | 16,895,165 | 16,895,165 | 74,372,087 |
| messages per session | 151 | 557 | 583 | 583 | 3,782 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 8 | 47.1% |
| `engineer` | 6 | 35.3% |
| `reviewer` | 3 | 17.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,007 | 15 | 15 | 1.5% |
| `read` | 498 | 1 | 1 | 0.2% |
| `grep` | 266 | 4 | 0 | 1.5% |
| `web__fetch` | 125 | 6 | 0 | 4.8% |
| `edit` | 81 | 0 | 0 | 0% |
| `github__get_issue` | 60 | 0 | 0 | 0% |
| `list` | 57 | 1 | 0 | 1.8% |
| `github__get_issue_comments` | 53 | 0 | 0 | 0% |
| `search__search_issues` | 40 | 0 | 0 | 0% |
| `write` | 29 | 0 | 0 | 0% |
| `github__get_check_runs` | 28 | 0 | 0 | 0% |
| `github__get_branch` | 27 | 0 | 0 | 0% |
| `github__get_pr` | 25 | 3 | 0 | 12% |
| `atoma_builtin__load_skill` | 22 | 0 | 0 | 0% |
| `github__list_prs` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 12 | 0 | 0 | 0% |
| `glob` | 12 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 8 | 1 | 0 | 12.5% |
| `github__create_pr` | 7 | 2 | 0 | 28.6% |
| `github__get_pr_diff` | 7 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
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
| `other` | 828 | 82.1% |
| `edit` | 97 | 9.6% |
| `search` | 52 | 5.2% |
| `open` | 23 | 2.3% |
| `verify` | 8 | 0.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 14 | 63.6% |
| `delivery/pipeline-setup` | 4 | 18.2% |
| `engineering/environment` | 3 | 13.6% |
| `research/web-search` | 1 | 4.5% |

## All time

17 sessions.

**Ran to an end without a report:** 6 of 17 sessions whose last run the core recorded as `completed` — 35.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**74,372,087 tokens** over 14 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 11,220,302 | 16,895,165 | 16,895,165 | 74,372,087 |
| messages per session | 151 | 557 | 583 | 583 | 3,782 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 8 | 47.1% |
| `engineer` | 6 | 35.3% |
| `reviewer` | 3 | 17.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,007 | 15 | 15 | 1.5% |
| `read` | 498 | 1 | 1 | 0.2% |
| `grep` | 266 | 4 | 0 | 1.5% |
| `web__fetch` | 125 | 6 | 0 | 4.8% |
| `edit` | 81 | 0 | 0 | 0% |
| `github__get_issue` | 60 | 0 | 0 | 0% |
| `list` | 57 | 1 | 0 | 1.8% |
| `github__get_issue_comments` | 53 | 0 | 0 | 0% |
| `search__search_issues` | 40 | 0 | 0 | 0% |
| `write` | 29 | 0 | 0 | 0% |
| `github__get_check_runs` | 28 | 0 | 0 | 0% |
| `github__get_branch` | 27 | 0 | 0 | 0% |
| `github__get_pr` | 25 | 3 | 0 | 12% |
| `atoma_builtin__load_skill` | 22 | 0 | 0 | 0% |
| `github__list_prs` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 12 | 0 | 0 | 0% |
| `glob` | 12 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 8 | 1 | 0 | 12.5% |
| `github__create_pr` | 7 | 2 | 0 | 28.6% |
| `github__get_pr_diff` | 7 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
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
| `other` | 828 | 82.1% |
| `edit` | 97 | 9.6% |
| `search` | 52 | 5.2% |
| `open` | 23 | 2.3% |
| `verify` | 8 | 0.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 14 | 63.6% |
| `delivery/pipeline-setup` | 4 | 18.2% |
| `engineering/environment` | 3 | 13.6% |
| `research/web-search` | 1 | 4.5% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
