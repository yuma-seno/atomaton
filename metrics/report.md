# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-09-27.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 17 | 0% | 785 | 10,246 | 41 | 25.7 |
| Last 30 days | 17 | 0% | 785 | 10,246 | 41 | 25.7 |
| Last year | 17 | 0% | 785 | 10,246 | 41 | 25.7 |
| All time | 17 | 0% | 785 | 10,246 | 41 | 25.7 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 17 |

## Last 7 days

14 sessions.

**Ran to an end without a report:** 7 of 14 sessions whose last run the core recorded as `completed` — 50%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**35,363,170 tokens** over 7 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 11,220,302 | 11,220,302 | 11,220,302 | 35,363,170 |
| messages per session | 157 | 362 | 383 | 383 | 2,665 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 7 | 50% |
| `engineer` | 6 | 42.9% |
| `reviewer` | 1 | 7.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 701 | 18 | 5 | 2.6% |
| `read` | 410 | 1 | 0 | 0.2% |
| `grep` | 204 | 3 | 0 | 1.5% |
| `edit` | 70 | 0 | 0 | 0% |
| `web__fetch` | 45 | 2 | 0 | 4.4% |
| `list` | 37 | 1 | 0 | 2.7% |
| `github__get_issue` | 35 | 0 | 0 | 0% |
| `github__get_issue_comments` | 34 | 0 | 0 | 0% |
| `search__search_issues` | 30 | 0 | 0 | 0% |
| `write` | 20 | 2 | 0 | 10% |
| `github__get_check_runs` | 18 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 17 | 0 | 0 | 0% |
| `github__get_pr` | 14 | 2 | 0 | 14.3% |
| `github__create_issue` | 13 | 0 | 0 | 0% |
| `github__get_branch` | 10 | 0 | 0 | 0% |
| `github__list_prs` | 9 | 0 | 0 | 0% |
| `glob` | 9 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 8 | 0 | 0 | 0% |
| `github__list_issues` | 7 | 0 | 0 | 0% |
| `github__commit_and_push` | 6 | 0 | 0 | 0% |
| `github__create_pr` | 6 | 3 | 0 | 50% |
| `github__list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `atomaton__launch_sub_agent` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `search__search_code` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 564 | 80.5% |
| `edit` | 65 | 9.3% |
| `search` | 46 | 6.6% |
| `open` | 18 | 2.6% |
| `verify` | 8 | 1.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 11 | 64.7% |
| `delivery/pipeline-setup` | 4 | 23.5% |
| `engineering/environment` | 2 | 11.8% |

## Last 30 days

14 sessions.

**Ran to an end without a report:** 7 of 14 sessions whose last run the core recorded as `completed` — 50%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**35,363,170 tokens** over 7 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 11,220,302 | 11,220,302 | 11,220,302 | 35,363,170 |
| messages per session | 157 | 362 | 383 | 383 | 2,665 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 7 | 50% |
| `engineer` | 6 | 42.9% |
| `reviewer` | 1 | 7.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 701 | 18 | 5 | 2.6% |
| `read` | 410 | 1 | 0 | 0.2% |
| `grep` | 204 | 3 | 0 | 1.5% |
| `edit` | 70 | 0 | 0 | 0% |
| `web__fetch` | 45 | 2 | 0 | 4.4% |
| `list` | 37 | 1 | 0 | 2.7% |
| `github__get_issue` | 35 | 0 | 0 | 0% |
| `github__get_issue_comments` | 34 | 0 | 0 | 0% |
| `search__search_issues` | 30 | 0 | 0 | 0% |
| `write` | 20 | 2 | 0 | 10% |
| `github__get_check_runs` | 18 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 17 | 0 | 0 | 0% |
| `github__get_pr` | 14 | 2 | 0 | 14.3% |
| `github__create_issue` | 13 | 0 | 0 | 0% |
| `github__get_branch` | 10 | 0 | 0 | 0% |
| `github__list_prs` | 9 | 0 | 0 | 0% |
| `glob` | 9 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 8 | 0 | 0 | 0% |
| `github__list_issues` | 7 | 0 | 0 | 0% |
| `github__commit_and_push` | 6 | 0 | 0 | 0% |
| `github__create_pr` | 6 | 3 | 0 | 50% |
| `github__list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `atomaton__launch_sub_agent` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `search__search_code` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 564 | 80.5% |
| `edit` | 65 | 9.3% |
| `search` | 46 | 6.6% |
| `open` | 18 | 2.6% |
| `verify` | 8 | 1.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 11 | 64.7% |
| `delivery/pipeline-setup` | 4 | 23.5% |
| `engineering/environment` | 2 | 11.8% |

## Last year

14 sessions.

**Ran to an end without a report:** 7 of 14 sessions whose last run the core recorded as `completed` — 50%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**35,363,170 tokens** over 7 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 11,220,302 | 11,220,302 | 11,220,302 | 35,363,170 |
| messages per session | 157 | 362 | 383 | 383 | 2,665 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 7 | 50% |
| `engineer` | 6 | 42.9% |
| `reviewer` | 1 | 7.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 701 | 18 | 5 | 2.6% |
| `read` | 410 | 1 | 0 | 0.2% |
| `grep` | 204 | 3 | 0 | 1.5% |
| `edit` | 70 | 0 | 0 | 0% |
| `web__fetch` | 45 | 2 | 0 | 4.4% |
| `list` | 37 | 1 | 0 | 2.7% |
| `github__get_issue` | 35 | 0 | 0 | 0% |
| `github__get_issue_comments` | 34 | 0 | 0 | 0% |
| `search__search_issues` | 30 | 0 | 0 | 0% |
| `write` | 20 | 2 | 0 | 10% |
| `github__get_check_runs` | 18 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 17 | 0 | 0 | 0% |
| `github__get_pr` | 14 | 2 | 0 | 14.3% |
| `github__create_issue` | 13 | 0 | 0 | 0% |
| `github__get_branch` | 10 | 0 | 0 | 0% |
| `github__list_prs` | 9 | 0 | 0 | 0% |
| `glob` | 9 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 8 | 0 | 0 | 0% |
| `github__list_issues` | 7 | 0 | 0 | 0% |
| `github__commit_and_push` | 6 | 0 | 0 | 0% |
| `github__create_pr` | 6 | 3 | 0 | 50% |
| `github__list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `atomaton__launch_sub_agent` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `search__search_code` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 564 | 80.5% |
| `edit` | 65 | 9.3% |
| `search` | 46 | 6.6% |
| `open` | 18 | 2.6% |
| `verify` | 8 | 1.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 11 | 64.7% |
| `delivery/pipeline-setup` | 4 | 23.5% |
| `engineering/environment` | 2 | 11.8% |

## All time

14 sessions.

**Ran to an end without a report:** 7 of 14 sessions whose last run the core recorded as `completed` — 50%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**35,363,170 tokens** over 7 runs that reported them, **95.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 11,220,302 | 11,220,302 | 11,220,302 | 35,363,170 |
| messages per session | 157 | 362 | 383 | 383 | 2,665 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 7 | 50% |
| `engineer` | 6 | 42.9% |
| `reviewer` | 1 | 7.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 701 | 18 | 5 | 2.6% |
| `read` | 410 | 1 | 0 | 0.2% |
| `grep` | 204 | 3 | 0 | 1.5% |
| `edit` | 70 | 0 | 0 | 0% |
| `web__fetch` | 45 | 2 | 0 | 4.4% |
| `list` | 37 | 1 | 0 | 2.7% |
| `github__get_issue` | 35 | 0 | 0 | 0% |
| `github__get_issue_comments` | 34 | 0 | 0 | 0% |
| `search__search_issues` | 30 | 0 | 0 | 0% |
| `write` | 20 | 2 | 0 | 10% |
| `github__get_check_runs` | 18 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 17 | 0 | 0 | 0% |
| `github__get_pr` | 14 | 2 | 0 | 14.3% |
| `github__create_issue` | 13 | 0 | 0 | 0% |
| `github__get_branch` | 10 | 0 | 0 | 0% |
| `github__list_prs` | 9 | 0 | 0 | 0% |
| `glob` | 9 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 8 | 0 | 0 | 0% |
| `github__list_issues` | 7 | 0 | 0 | 0% |
| `github__commit_and_push` | 6 | 0 | 0 | 0% |
| `github__create_pr` | 6 | 3 | 0 | 50% |
| `github__list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `atomaton__launch_sub_agent` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `search__search_code` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 564 | 80.5% |
| `edit` | 65 | 9.3% |
| `search` | 46 | 6.6% |
| `open` | 18 | 2.6% |
| `verify` | 8 | 1.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 11 | 64.7% |
| `delivery/pipeline-setup` | 4 | 23.5% |
| `engineering/environment` | 2 | 11.8% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `research/web-search`
