# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-17.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 72 | 11.1% | 1,023 | 8,481 | 19 | 46.0 |
| Last 30 days | 109 | 10.1% | 1,059 | 10,246 | 28 | 40.2 |
| Last year | 109 | 10.1% | 1,059 | 10,246 | 28 | 40.2 |
| All time | 109 | 10.1% | 1,059 | 10,246 | 28 | 40.2 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 98 |
| `failed` | 10 |
| `stopped` | 1 |

## Last 7 days

36 sessions.

**Ran to an end without a report:** 15 of 34 sessions whose last run the core recorded as `completed` — 44.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**224,614,343 tokens** over 34 runs that reported them, **97.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,525,516 | 11,776,383 | 73,718,100 | 73,718,100 | 224,614,343 |
| messages per session | 182 | 482 | 715 | 715 | 8,352 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 20 | 55.6% |
| `reviewer` | 10 | 27.8% |
| `engineer` | 6 | 16.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,431 | 35 | 34 | 2.4% |
| `read` | 980 | 8 | 2 | 0.8% |
| `grep` | 777 | 13 | 3 | 1.7% |
| `fetch` | 285 | 35 | 0 | 12.3% |
| `shell__shell_execute` | 279 | 3 | 0 | 1.1% |
| `edit` | 258 | 3 | 0 | 1.2% |
| `get_issue` | 132 | 13 | 0 | 9.8% |
| `get_issue_comments` | 104 | 0 | 9 | 0% |
| `list` | 96 | 0 | 0 | 0% |
| `search_issues` | 79 | 0 | 2 | 0% |
| `get_branch` | 55 | 0 | 0 | 0% |
| `glob` | 54 | 1 | 1 | 1.9% |
| `get_pr` | 53 | 5 | 0 | 9.4% |
| `get_check_runs` | 48 | 2 | 0 | 4.2% |
| `atoma_builtin__load_skill` | 37 | 0 | 0 | 0% |
| `write` | 23 | 0 | 0 | 0% |
| `web__fetch` | 22 | 1 | 0 | 4.5% |
| `check_merge_readiness` | 20 | 0 | 0 | 0% |
| `create_pr` | 19 | 9 | 0 | 47.4% |
| `list_prs` | 18 | 0 | 0 | 0% |
| `get_pr_diff` | 17 | 1 | 0 | 5.9% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `commit_and_push` | 14 | 2 | 0 | 14.3% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `request_close_issue` | 11 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `search_code` | 9 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate` | 6 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 1 | 0 | 16.7% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `search_remote_code` | 6 | 2 | 0 | 33.3% |
| `github__get_issue` | 5 | 0 | 0 | 0% |
| `sync_branch` | 5 | 1 | 0 | 20% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_issue_comments` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `create_root_issue` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `github__commit_and_push` | 1 | 0 | 0 | 0% |
| `github__create_pr` | 1 | 0 | 0 | 0% |
| `github__get_branch` | 1 | 0 | 0 | 0% |
| `github__get_check_runs` | 1 | 0 | 0 | 0% |
| `github__get_pr` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `github__list_prs` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,034 | 72.3% |
| `search` | 161 | 11.3% |
| `edit` | 128 | 8.9% |
| `open` | 60 | 4.2% |
| `verify` | 48 | 3.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 29 | 78.4% |
| `engineering/environment` | 2 | 5.4% |
| `engineering/secrets-in-a-check` | 2 | 5.4% |
| `research/web-search` | 2 | 5.4% |
| `delivery/pipeline-setup` | 1 | 2.7% |
| `docs/design-doc` | 1 | 2.7% |

## Last 30 days

56 sessions.

**Ran to an end without a report:** 21 of 53 sessions whose last run the core recorded as `completed` — 39.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**344,433,020 tokens** over 54 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 3,047,517 | 11,776,383 | 73,718,100 | 73,718,100 | 344,433,020 |
| messages per session | 175 | 528 | 715 | 715 | 13,033 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 29 | 51.8% |
| `reviewer` | 14 | 25% |
| `engineer` | 13 | 23.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,631 | 11 | 4 | 0.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `bash` | 1,431 | 35 | 34 | 2.4% |
| `grep` | 1,161 | 21 | 7 | 1.8% |
| `edit` | 365 | 3 | 0 | 0.8% |
| `fetch` | 285 | 35 | 0 | 12.3% |
| `list` | 153 | 1 | 0 | 0.7% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue` | 132 | 13 | 0 | 9.8% |
| `get_issue_comments` | 104 | 0 | 9 | 0% |
| `search_issues` | 79 | 0 | 2 | 0% |
| `glob` | 71 | 1 | 1 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 62 | 0 | 0 | 0% |
| `get_branch` | 55 | 0 | 0 | 0% |
| `get_pr` | 53 | 5 | 0 | 9.4% |
| `write` | 52 | 0 | 0 | 0% |
| `get_check_runs` | 48 | 2 | 0 | 4.2% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `check_merge_readiness` | 20 | 0 | 0 | 0% |
| `create_pr` | 19 | 9 | 0 | 47.4% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_prs` | 18 | 0 | 0 | 0% |
| `get_pr_diff` | 17 | 1 | 0 | 5.9% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `commit_and_push` | 14 | 2 | 0 | 14.3% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `request_close_issue` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `search_code` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate` | 6 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 1 | 0 | 16.7% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `search_remote_code` | 6 | 2 | 0 | 33.3% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `sync_branch` | 5 | 1 | 0 | 20% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `create_root_issue` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,034 | 72.3% |
| `search` | 161 | 11.3% |
| `edit` | 128 | 8.9% |
| `open` | 60 | 4.2% |
| `verify` | 48 | 3.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 46 | 74.2% |
| `engineering/environment` | 6 | 9.7% |
| `delivery/pipeline-setup` | 5 | 8.1% |
| `engineering/secrets-in-a-check` | 2 | 3.2% |
| `research/web-search` | 2 | 3.2% |
| `docs/design-doc` | 1 | 1.6% |

## Last year

56 sessions.

**Ran to an end without a report:** 21 of 53 sessions whose last run the core recorded as `completed` — 39.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**344,433,020 tokens** over 54 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 3,047,517 | 11,776,383 | 73,718,100 | 73,718,100 | 344,433,020 |
| messages per session | 175 | 528 | 715 | 715 | 13,033 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 29 | 51.8% |
| `reviewer` | 14 | 25% |
| `engineer` | 13 | 23.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,631 | 11 | 4 | 0.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `bash` | 1,431 | 35 | 34 | 2.4% |
| `grep` | 1,161 | 21 | 7 | 1.8% |
| `edit` | 365 | 3 | 0 | 0.8% |
| `fetch` | 285 | 35 | 0 | 12.3% |
| `list` | 153 | 1 | 0 | 0.7% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue` | 132 | 13 | 0 | 9.8% |
| `get_issue_comments` | 104 | 0 | 9 | 0% |
| `search_issues` | 79 | 0 | 2 | 0% |
| `glob` | 71 | 1 | 1 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 62 | 0 | 0 | 0% |
| `get_branch` | 55 | 0 | 0 | 0% |
| `get_pr` | 53 | 5 | 0 | 9.4% |
| `write` | 52 | 0 | 0 | 0% |
| `get_check_runs` | 48 | 2 | 0 | 4.2% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `check_merge_readiness` | 20 | 0 | 0 | 0% |
| `create_pr` | 19 | 9 | 0 | 47.4% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_prs` | 18 | 0 | 0 | 0% |
| `get_pr_diff` | 17 | 1 | 0 | 5.9% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `commit_and_push` | 14 | 2 | 0 | 14.3% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `request_close_issue` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `search_code` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate` | 6 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 1 | 0 | 16.7% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `search_remote_code` | 6 | 2 | 0 | 33.3% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `sync_branch` | 5 | 1 | 0 | 20% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `create_root_issue` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,034 | 72.3% |
| `search` | 161 | 11.3% |
| `edit` | 128 | 8.9% |
| `open` | 60 | 4.2% |
| `verify` | 48 | 3.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 46 | 74.2% |
| `engineering/environment` | 6 | 9.7% |
| `delivery/pipeline-setup` | 5 | 8.1% |
| `engineering/secrets-in-a-check` | 2 | 3.2% |
| `research/web-search` | 2 | 3.2% |
| `docs/design-doc` | 1 | 1.6% |

## All time

56 sessions.

**Ran to an end without a report:** 21 of 53 sessions whose last run the core recorded as `completed` — 39.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**344,433,020 tokens** over 54 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 3,047,517 | 11,776,383 | 73,718,100 | 73,718,100 | 344,433,020 |
| messages per session | 175 | 528 | 715 | 715 | 13,033 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 29 | 51.8% |
| `reviewer` | 14 | 25% |
| `engineer` | 13 | 23.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,631 | 11 | 4 | 0.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `bash` | 1,431 | 35 | 34 | 2.4% |
| `grep` | 1,161 | 21 | 7 | 1.8% |
| `edit` | 365 | 3 | 0 | 0.8% |
| `fetch` | 285 | 35 | 0 | 12.3% |
| `list` | 153 | 1 | 0 | 0.7% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue` | 132 | 13 | 0 | 9.8% |
| `get_issue_comments` | 104 | 0 | 9 | 0% |
| `search_issues` | 79 | 0 | 2 | 0% |
| `glob` | 71 | 1 | 1 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 62 | 0 | 0 | 0% |
| `get_branch` | 55 | 0 | 0 | 0% |
| `get_pr` | 53 | 5 | 0 | 9.4% |
| `write` | 52 | 0 | 0 | 0% |
| `get_check_runs` | 48 | 2 | 0 | 4.2% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `check_merge_readiness` | 20 | 0 | 0 | 0% |
| `create_pr` | 19 | 9 | 0 | 47.4% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_prs` | 18 | 0 | 0 | 0% |
| `get_pr_diff` | 17 | 1 | 0 | 5.9% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `commit_and_push` | 14 | 2 | 0 | 14.3% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `request_close_issue` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `search_code` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate` | 6 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 1 | 0 | 16.7% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `search_remote_code` | 6 | 2 | 0 | 33.3% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `sync_branch` | 5 | 1 | 0 | 20% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `create_root_issue` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,034 | 72.3% |
| `search` | 161 | 11.3% |
| `edit` | 128 | 8.9% |
| `open` | 60 | 4.2% |
| `verify` | 48 | 3.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 46 | 74.2% |
| `engineering/environment` | 6 | 9.7% |
| `delivery/pipeline-setup` | 5 | 8.1% |
| `engineering/secrets-in-a-check` | 2 | 3.2% |
| `research/web-search` | 2 | 3.2% |
| `docs/design-doc` | 1 | 1.6% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
