# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-25.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 191 | 3.1% | 214 | 9,689 | 15 | 15.8 |
| Last 30 days | 304 | 5.9% | 344 | 10,246 | 17 | 22.6 |
| Last year | 304 | 5.9% | 344 | 10,246 | 17 | 22.6 |
| All time | 304 | 5.9% | 344 | 10,246 | 17 | 22.6 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 286 |
| `failed` | 14 |
| `stopped` | 4 |

## Last 7 days

90 sessions.

**Ran to an end without a report:** 13 of 89 sessions whose last run the core recorded as `completed` — 14.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**217,605,649 tokens** over 126 runs that reported them, **98.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,143,930 | 4,615,931 | 8,400,110 | 8,676,293 | 217,605,649 |
| messages per session | 102 | 290 | 731 | 731 | 12,690 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 44 | 48.9% |
| `atomaton` | 31 | 34.4% |
| `engineer` | 15 | 16.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,843 | 11 | 0 | 0.6% |
| `bash` | 1,519 | 16 | 17 | 1.1% |
| `grep` | 1,365 | 41 | 0 | 3% |
| `edit` | 747 | 13 | 0 | 1.7% |
| `fetch` | 144 | 10 | 0 | 6.9% |
| `get_pr` | 113 | 4 | 0 | 3.5% |
| `get_issue` | 110 | 0 | 4 | 0% |
| `glob` | 110 | 0 | 0 | 0% |
| `get_issue_comments` | 105 | 0 | 2 | 0% |
| `get_check_runs` | 103 | 4 | 0 | 3.9% |
| `list` | 84 | 2 | 0 | 2.4% |
| `atoma_builtin__load_skill` | 76 | 0 | 0 | 0% |
| `check_merge_readiness` | 74 | 0 | 0 | 0% |
| `get_branch` | 62 | 0 | 0 | 0% |
| `commit_and_push` | 55 | 3 | 0 | 5.5% |
| `get_pr_diff` | 51 | 2 | 0 | 3.9% |
| `create_pr` | 48 | 14 | 0 | 29.2% |
| `write` | 38 | 0 | 0 | 0% |
| `request_close_issue` | 34 | 1 | 0 | 2.9% |
| `list_prs` | 24 | 0 | 0 | 0% |
| `search_issues` | 23 | 0 | 0 | 0% |
| `delegate` | 16 | 0 | 0 | 0% |
| `search_remote_code` | 15 | 4 | 0 | 26.7% |
| `search_code` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `create_root_issue` | 13 | 1 | 0 | 7.7% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `delegate_readonly` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `get_pr_reviews` | 8 | 0 | 0 | 0% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 2 | 0 | 33.3% |
| `sync_branch` | 6 | 2 | 0 | 33.3% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `create_issue` | 4 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `list_issues` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 899 | 59.2% |
| `search` | 229 | 15.1% |
| `verify` | 182 | 12% |
| `edit` | 119 | 7.8% |
| `open` | 90 | 5.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 74 | 94.9% |
| `delivery/pipeline-setup` | 2 | 2.6% |
| `engineering/secrets-in-a-check` | 1 | 1.3% |
| `research/web-search` | 1 | 1.3% |

## Last 30 days

139 sessions.

**Ran to an end without a report:** 28 of 136 sessions whose last run the core recorded as `completed` — 20.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**563,384,245 tokens** over 182 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 5,781,615 | 39,097,860 | 73,718,100 | 563,384,245 |
| messages per session | 132 | 388 | 715 | 731 | 24,611 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 58 | 41.7% |
| `atomaton` | 53 | 38.1% |
| `engineer` | 28 | 20.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,311 | 21 | 4 | 0.6% |
| `bash` | 2,861 | 49 | 48 | 1.7% |
| `grep` | 2,426 | 59 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,112 | 16 | 0 | 1.4% |
| `fetch` | 364 | 37 | 0 | 10.2% |
| `list` | 222 | 3 | 0 | 1.4% |
| `get_issue` | 219 | 13 | 4 | 5.9% |
| `get_issue_comments` | 191 | 0 | 10 | 0% |
| `glob` | 166 | 1 | 1 | 0.6% |
| `get_pr` | 162 | 9 | 0 | 5.6% |
| `get_check_runs` | 150 | 6 | 0 | 4% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 132 | 0 | 0 | 0% |
| `get_branch` | 115 | 0 | 0 | 0% |
| `check_merge_readiness` | 94 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `write` | 88 | 0 | 0 | 0% |
| `commit_and_push` | 69 | 5 | 0 | 7.2% |
| `get_pr_diff` | 68 | 3 | 0 | 4.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `create_pr` | 67 | 23 | 0 | 34.3% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `request_close_issue` | 41 | 1 | 0 | 2.4% |
| `list_prs` | 40 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `get_pr_reviews` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `merge_pr` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `create_root_issue` | 14 | 1 | 0 | 7.1% |
| `list_issues` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 8 | 2 | 0 | 25% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,898 | 66.3% |
| `search` | 374 | 13.1% |
| `edit` | 221 | 7.7% |
| `verify` | 220 | 7.7% |
| `open` | 148 | 5.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 115 | 85.8% |
| `delivery/pipeline-setup` | 7 | 5.2% |
| `engineering/environment` | 6 | 4.5% |
| `engineering/secrets-in-a-check` | 3 | 2.2% |
| `research/web-search` | 2 | 1.5% |
| `docs/design-doc` | 1 | 0.7% |

## Last year

139 sessions.

**Ran to an end without a report:** 28 of 136 sessions whose last run the core recorded as `completed` — 20.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**563,384,245 tokens** over 182 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 5,781,615 | 39,097,860 | 73,718,100 | 563,384,245 |
| messages per session | 132 | 388 | 715 | 731 | 24,611 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 58 | 41.7% |
| `atomaton` | 53 | 38.1% |
| `engineer` | 28 | 20.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,311 | 21 | 4 | 0.6% |
| `bash` | 2,861 | 49 | 48 | 1.7% |
| `grep` | 2,426 | 59 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,112 | 16 | 0 | 1.4% |
| `fetch` | 364 | 37 | 0 | 10.2% |
| `list` | 222 | 3 | 0 | 1.4% |
| `get_issue` | 219 | 13 | 4 | 5.9% |
| `get_issue_comments` | 191 | 0 | 10 | 0% |
| `glob` | 166 | 1 | 1 | 0.6% |
| `get_pr` | 162 | 9 | 0 | 5.6% |
| `get_check_runs` | 150 | 6 | 0 | 4% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 132 | 0 | 0 | 0% |
| `get_branch` | 115 | 0 | 0 | 0% |
| `check_merge_readiness` | 94 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `write` | 88 | 0 | 0 | 0% |
| `commit_and_push` | 69 | 5 | 0 | 7.2% |
| `get_pr_diff` | 68 | 3 | 0 | 4.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `create_pr` | 67 | 23 | 0 | 34.3% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `request_close_issue` | 41 | 1 | 0 | 2.4% |
| `list_prs` | 40 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `get_pr_reviews` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `merge_pr` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `create_root_issue` | 14 | 1 | 0 | 7.1% |
| `list_issues` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 8 | 2 | 0 | 25% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,898 | 66.3% |
| `search` | 374 | 13.1% |
| `edit` | 221 | 7.7% |
| `verify` | 220 | 7.7% |
| `open` | 148 | 5.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 115 | 85.8% |
| `delivery/pipeline-setup` | 7 | 5.2% |
| `engineering/environment` | 6 | 4.5% |
| `engineering/secrets-in-a-check` | 3 | 2.2% |
| `research/web-search` | 2 | 1.5% |
| `docs/design-doc` | 1 | 0.7% |

## All time

141 sessions.

**Ran to an end without a report:** 28 of 136 sessions whose last run the core recorded as `completed` — 20.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**563,384,245 tokens** over 182 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 5,781,615 | 39,097,860 | 73,718,100 | 563,384,245 |
| messages per session | 129 | 384 | 715 | 731 | 24,615 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 58 | 41.1% |
| `atomaton` | 55 | 39% |
| `engineer` | 28 | 19.9% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,311 | 21 | 4 | 0.6% |
| `bash` | 2,861 | 49 | 48 | 1.7% |
| `grep` | 2,426 | 59 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,112 | 16 | 0 | 1.4% |
| `fetch` | 364 | 37 | 0 | 10.2% |
| `list` | 222 | 3 | 0 | 1.4% |
| `get_issue` | 219 | 13 | 4 | 5.9% |
| `get_issue_comments` | 191 | 0 | 10 | 0% |
| `glob` | 166 | 1 | 1 | 0.6% |
| `get_pr` | 162 | 9 | 0 | 5.6% |
| `get_check_runs` | 150 | 6 | 0 | 4% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 132 | 0 | 0 | 0% |
| `get_branch` | 115 | 0 | 0 | 0% |
| `check_merge_readiness` | 94 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `write` | 88 | 0 | 0 | 0% |
| `commit_and_push` | 69 | 5 | 0 | 7.2% |
| `get_pr_diff` | 68 | 3 | 0 | 4.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `create_pr` | 67 | 23 | 0 | 34.3% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `request_close_issue` | 41 | 1 | 0 | 2.4% |
| `list_prs` | 40 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `get_pr_reviews` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `merge_pr` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `create_root_issue` | 14 | 1 | 0 | 7.1% |
| `list_issues` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 8 | 2 | 0 | 25% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,898 | 66.3% |
| `search` | 374 | 13.1% |
| `edit` | 221 | 7.7% |
| `verify` | 220 | 7.7% |
| `open` | 148 | 5.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 115 | 85.8% |
| `delivery/pipeline-setup` | 7 | 5.2% |
| `engineering/environment` | 6 | 4.5% |
| `engineering/secrets-in-a-check` | 3 | 2.2% |
| `research/web-search` | 2 | 1.5% |
| `docs/design-doc` | 1 | 0.7% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
