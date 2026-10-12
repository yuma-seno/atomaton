# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-12.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 17 | 17.6% | 1,123 | 4,335 | 28 | 44.3 |
| Last 30 days | 39 | 7.7% | 1,078 | 10,246 | 35 | 36.1 |
| Last year | 39 | 7.7% | 1,078 | 10,246 | 35 | 36.1 |
| All time | 39 | 7.7% | 1,078 | 10,246 | 35 | 36.1 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 36 |
| `failed` | 3 |

## Last 7 days

8 sessions.

**Ran to an end without a report:** 3 of 7 sessions whose last run the core recorded as `completed` — 42.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**50,334,769 tokens** over 9 runs that reported them, **96.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 3,047,517 | 27,846,035 | 27,846,035 | 27,846,035 | 50,334,769 |
| messages per session | 323 | 715 | 715 | 715 | 2,359 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 5 | 62.5% |
| `reviewer` | 2 | 25% |
| `engineer` | 1 | 12.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 720 | 10 | 11 | 1.4% |
| `read` | 250 | 2 | 1 | 0.8% |
| `grep` | 150 | 5 | 4 | 3.3% |
| `web__fetch` | 78 | 7 | 0 | 9% |
| `edit` | 38 | 1 | 0 | 2.6% |
| `list` | 27 | 0 | 0 | 0% |
| `github__get_issue` | 24 | 0 | 0 | 0% |
| `github__get_issue_comments` | 23 | 0 | 0 | 0% |
| `github__get_branch` | 12 | 0 | 0 | 0% |
| `github__list_prs` | 12 | 0 | 0 | 0% |
| `glob` | 12 | 0 | 0 | 0% |
| `search__search_issues` | 12 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 11 | 0 | 0 | 0% |
| `write` | 11 | 0 | 0 | 0% |
| `github__get_pr` | 9 | 1 | 0 | 11.1% |
| `github__get_check_runs` | 8 | 0 | 0 | 0% |
| `github__create_issue` | 7 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 5 | 0 | 0 | 0% |
| `get_issue` | 4 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `create_issue` | 3 | 0 | 0 | 0% |
| `get_issue_comments` | 3 | 0 | 0 | 0% |
| `github__commit_and_push` | 3 | 0 | 0 | 0% |
| `github__list_issues` | 3 | 0 | 0 | 0% |
| `probe` | 3 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 2 | 0 | 0 | 0% |
| `bash` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__create_pr` | 2 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 2 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `delegate_readonly__run` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `request_close_issue` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 2 | 100% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 7 | 63.6% |
| `engineering/environment` | 2 | 18.2% |
| `engineering/secrets-in-a-check` | 1 | 9.1% |
| `research/web-search` | 1 | 9.1% |

## Last 30 days

22 sessions.

**Ran to an end without a report:** 7 of 21 sessions whose last run the core recorded as `completed` — 33.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**120,260,593 tokens** over 21 runs that reported them, **96.2% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,244,375 | 11,220,302 | 27,846,035 | 27,846,035 | 120,260,593 |
| messages per session | 152 | 557 | 715 | 715 | 5,528 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 11 | 50% |
| `engineer` | 7 | 31.8% |
| `reviewer` | 4 | 18.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 699 | 3 | 2 | 0.4% |
| `grep` | 395 | 9 | 4 | 2.3% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `edit` | 119 | 1 | 0 | 0.8% |
| `list` | 71 | 1 | 0 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `write` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `glob` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `get_issue` | 4 | 0 | 0 | 0% |
| `create_issue` | 3 | 0 | 0 | 0% |
| `get_issue_comments` | 3 | 0 | 0 | 0% |
| `probe` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `bash` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `request_close_issue` | 1 | 0 | 0 | 0% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 2 | 100% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 19 | 63.3% |
| `engineering/environment` | 5 | 16.7% |
| `delivery/pipeline-setup` | 4 | 13.3% |
| `engineering/secrets-in-a-check` | 1 | 3.3% |
| `research/web-search` | 1 | 3.3% |

## Last year

22 sessions.

**Ran to an end without a report:** 7 of 21 sessions whose last run the core recorded as `completed` — 33.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**120,260,593 tokens** over 21 runs that reported them, **96.2% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,244,375 | 11,220,302 | 27,846,035 | 27,846,035 | 120,260,593 |
| messages per session | 152 | 557 | 715 | 715 | 5,528 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 11 | 50% |
| `engineer` | 7 | 31.8% |
| `reviewer` | 4 | 18.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 699 | 3 | 2 | 0.4% |
| `grep` | 395 | 9 | 4 | 2.3% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `edit` | 119 | 1 | 0 | 0.8% |
| `list` | 71 | 1 | 0 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `write` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `glob` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `get_issue` | 4 | 0 | 0 | 0% |
| `create_issue` | 3 | 0 | 0 | 0% |
| `get_issue_comments` | 3 | 0 | 0 | 0% |
| `probe` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `bash` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `request_close_issue` | 1 | 0 | 0 | 0% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 2 | 100% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 19 | 63.3% |
| `engineering/environment` | 5 | 16.7% |
| `delivery/pipeline-setup` | 4 | 13.3% |
| `engineering/secrets-in-a-check` | 1 | 3.3% |
| `research/web-search` | 1 | 3.3% |

## All time

22 sessions.

**Ran to an end without a report:** 7 of 21 sessions whose last run the core recorded as `completed` — 33.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**120,260,593 tokens** over 21 runs that reported them, **96.2% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,244,375 | 11,220,302 | 27,846,035 | 27,846,035 | 120,260,593 |
| messages per session | 152 | 557 | 715 | 715 | 5,528 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 11 | 50% |
| `engineer` | 7 | 31.8% |
| `reviewer` | 4 | 18.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 699 | 3 | 2 | 0.4% |
| `grep` | 395 | 9 | 4 | 2.3% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `edit` | 119 | 1 | 0 | 0.8% |
| `list` | 71 | 1 | 0 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `write` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `glob` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `get_issue` | 4 | 0 | 0 | 0% |
| `create_issue` | 3 | 0 | 0 | 0% |
| `get_issue_comments` | 3 | 0 | 0 | 0% |
| `probe` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `bash` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `request_close_issue` | 1 | 0 | 0 | 0% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 2 | 100% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 19 | 63.3% |
| `engineering/environment` | 5 | 16.7% |
| `delivery/pipeline-setup` | 4 | 13.3% |
| `engineering/secrets-in-a-check` | 1 | 3.3% |
| `research/web-search` | 1 | 3.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
