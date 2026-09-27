# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-09-27.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 12 | 0% | 604 | 3,923 | 39 | 21.9 |
| Last 30 days | 12 | 0% | 604 | 3,923 | 39 | 21.9 |
| Last year | 12 | 0% | 604 | 3,923 | 39 | 21.9 |
| All time | 12 | 0% | 604 | 3,923 | 39 | 21.9 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 12 |

## Last 7 days

10 sessions.

**Ran to an end without a report:** 6 of 10 sessions whose last run the core recorded as `completed` — 60%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**21,321,752 tokens** over 4 runs that reported them, **97.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,068,104 | 11,220,302 | 11,220,302 | 11,220,302 | 21,321,752 |
| messages per session | 151 | 383 | 383 | 383 | 1,504 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 5 | 50% |
| `engineer` | 5 | 50% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 386 | 8 | 0 | 2.1% |
| `read` | 266 | 0 | 1 | 0% |
| `grep` | 93 | 2 | 0 | 2.2% |
| `edit` | 46 | 0 | 0 | 0% |
| `list` | 30 | 0 | 0 | 0% |
| `github__get_issue_comments` | 25 | 0 | 0 | 0% |
| `github__get_issue` | 21 | 0 | 0 | 0% |
| `web__fetch` | 21 | 0 | 0 | 0% |
| `search__search_issues` | 16 | 0 | 0 | 0% |
| `github__get_check_runs` | 12 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 10 | 0 | 0 | 0% |
| `github__create_issue` | 10 | 0 | 0 | 0% |
| `write` | 9 | 1 | 0 | 11.1% |
| `github__list_issues` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `github__list_prs` | 5 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 4 | 0 | 0 | 0% |
| `github__commit_and_push` | 4 | 0 | 0 | 0% |
| `github__create_pr` | 4 | 2 | 0 | 50% |
| `atomaton__launch_sub_agent` | 3 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 3 | 0 | 0 | 0% |
| `github__get_pr` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 1 | 0 | 0 | 0% |
| `glob` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 294 | 76.2% |
| `search` | 44 | 11.4% |
| `edit` | 26 | 6.7% |
| `open` | 15 | 3.9% |
| `verify` | 7 | 1.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 7 | 70% |
| `delivery/pipeline-setup` | 2 | 20% |
| `engineering/environment` | 1 | 10% |

## Last 30 days

10 sessions.

**Ran to an end without a report:** 6 of 10 sessions whose last run the core recorded as `completed` — 60%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**21,321,752 tokens** over 4 runs that reported them, **97.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,068,104 | 11,220,302 | 11,220,302 | 11,220,302 | 21,321,752 |
| messages per session | 151 | 383 | 383 | 383 | 1,504 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 5 | 50% |
| `engineer` | 5 | 50% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 386 | 8 | 0 | 2.1% |
| `read` | 266 | 0 | 1 | 0% |
| `grep` | 93 | 2 | 0 | 2.2% |
| `edit` | 46 | 0 | 0 | 0% |
| `list` | 30 | 0 | 0 | 0% |
| `github__get_issue_comments` | 25 | 0 | 0 | 0% |
| `github__get_issue` | 21 | 0 | 0 | 0% |
| `web__fetch` | 21 | 0 | 0 | 0% |
| `search__search_issues` | 16 | 0 | 0 | 0% |
| `github__get_check_runs` | 12 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 10 | 0 | 0 | 0% |
| `github__create_issue` | 10 | 0 | 0 | 0% |
| `write` | 9 | 1 | 0 | 11.1% |
| `github__list_issues` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `github__list_prs` | 5 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 4 | 0 | 0 | 0% |
| `github__commit_and_push` | 4 | 0 | 0 | 0% |
| `github__create_pr` | 4 | 2 | 0 | 50% |
| `atomaton__launch_sub_agent` | 3 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 3 | 0 | 0 | 0% |
| `github__get_pr` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 1 | 0 | 0 | 0% |
| `glob` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 294 | 76.2% |
| `search` | 44 | 11.4% |
| `edit` | 26 | 6.7% |
| `open` | 15 | 3.9% |
| `verify` | 7 | 1.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 7 | 70% |
| `delivery/pipeline-setup` | 2 | 20% |
| `engineering/environment` | 1 | 10% |

## Last year

10 sessions.

**Ran to an end without a report:** 6 of 10 sessions whose last run the core recorded as `completed` — 60%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**21,321,752 tokens** over 4 runs that reported them, **97.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,068,104 | 11,220,302 | 11,220,302 | 11,220,302 | 21,321,752 |
| messages per session | 151 | 383 | 383 | 383 | 1,504 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 5 | 50% |
| `engineer` | 5 | 50% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 386 | 8 | 0 | 2.1% |
| `read` | 266 | 0 | 1 | 0% |
| `grep` | 93 | 2 | 0 | 2.2% |
| `edit` | 46 | 0 | 0 | 0% |
| `list` | 30 | 0 | 0 | 0% |
| `github__get_issue_comments` | 25 | 0 | 0 | 0% |
| `github__get_issue` | 21 | 0 | 0 | 0% |
| `web__fetch` | 21 | 0 | 0 | 0% |
| `search__search_issues` | 16 | 0 | 0 | 0% |
| `github__get_check_runs` | 12 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 10 | 0 | 0 | 0% |
| `github__create_issue` | 10 | 0 | 0 | 0% |
| `write` | 9 | 1 | 0 | 11.1% |
| `github__list_issues` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `github__list_prs` | 5 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 4 | 0 | 0 | 0% |
| `github__commit_and_push` | 4 | 0 | 0 | 0% |
| `github__create_pr` | 4 | 2 | 0 | 50% |
| `atomaton__launch_sub_agent` | 3 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 3 | 0 | 0 | 0% |
| `github__get_pr` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 1 | 0 | 0 | 0% |
| `glob` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 294 | 76.2% |
| `search` | 44 | 11.4% |
| `edit` | 26 | 6.7% |
| `open` | 15 | 3.9% |
| `verify` | 7 | 1.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 7 | 70% |
| `delivery/pipeline-setup` | 2 | 20% |
| `engineering/environment` | 1 | 10% |

## All time

10 sessions.

**Ran to an end without a report:** 6 of 10 sessions whose last run the core recorded as `completed` — 60%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**21,321,752 tokens** over 4 runs that reported them, **97.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,068,104 | 11,220,302 | 11,220,302 | 11,220,302 | 21,321,752 |
| messages per session | 151 | 383 | 383 | 383 | 1,504 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 5 | 50% |
| `engineer` | 5 | 50% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 386 | 8 | 0 | 2.1% |
| `read` | 266 | 0 | 1 | 0% |
| `grep` | 93 | 2 | 0 | 2.2% |
| `edit` | 46 | 0 | 0 | 0% |
| `list` | 30 | 0 | 0 | 0% |
| `github__get_issue_comments` | 25 | 0 | 0 | 0% |
| `github__get_issue` | 21 | 0 | 0 | 0% |
| `web__fetch` | 21 | 0 | 0 | 0% |
| `search__search_issues` | 16 | 0 | 0 | 0% |
| `github__get_check_runs` | 12 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 10 | 0 | 0 | 0% |
| `github__create_issue` | 10 | 0 | 0 | 0% |
| `write` | 9 | 1 | 0 | 11.1% |
| `github__list_issues` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 5 | 1 | 0 | 20% |
| `github__list_prs` | 5 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 4 | 0 | 0 | 0% |
| `github__commit_and_push` | 4 | 0 | 0 | 0% |
| `github__create_pr` | 4 | 2 | 0 | 50% |
| `atomaton__launch_sub_agent` | 3 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 3 | 0 | 0 | 0% |
| `github__get_pr` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 1 | 0 | 0 | 0% |
| `glob` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 294 | 76.2% |
| `search` | 44 | 11.4% |
| `edit` | 26 | 6.7% |
| `open` | 15 | 3.9% |
| `verify` | 7 | 1.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 7 | 70% |
| `delivery/pipeline-setup` | 2 | 20% |
| `engineering/environment` | 1 | 10% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `research/web-search`
