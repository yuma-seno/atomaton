# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-25.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 268 | 2.6% | 198 | 9,689 | 15 | 13.0 |
| Last 30 days | 385 | 4.9% | 271 | 10,246 | 17 | 18.9 |
| Last year | 385 | 4.9% | 271 | 10,246 | 17 | 18.9 |
| All time | 385 | 4.9% | 271 | 10,246 | 17 | 18.9 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 366 |
| `failed` | 14 |
| `stopped` | 5 |

## Last 7 days

125 sessions.

**Ran to an end without a report:** 24 of 123 sessions whose last run the core recorded as `completed` — 19.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**255,876,260 tokens** over 153 runs that reported them, **98.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,036,761 | 4,038,003 | 8,400,110 | 8,676,293 | 255,876,260 |
| messages per session | 99 | 276 | 445 | 731 | 16,675 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 60 | 48% |
| `atomaton` | 33 | 26.4% |
| `engineer` | 32 | 25.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,298 | 30 | 36 | 1.3% |
| `read` | 2,259 | 11 | 3 | 0.5% |
| `grep` | 1,615 | 46 | 1 | 2.8% |
| `edit` | 966 | 18 | 0 | 1.9% |
| `fetch` | 216 | 12 | 0 | 5.6% |
| `get_pr` | 156 | 4 | 1 | 2.6% |
| `get_issue` | 147 | 0 | 5 | 0% |
| `get_issue_comments` | 140 | 0 | 2 | 0% |
| `get_check_runs` | 136 | 6 | 0 | 4.4% |
| `glob` | 119 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 102 | 0 | 0 | 0% |
| `list` | 101 | 2 | 0 | 2% |
| `check_merge_readiness` | 100 | 0 | 0 | 0% |
| `get_branch` | 84 | 0 | 0 | 0% |
| `commit_and_push` | 81 | 6 | 0 | 7.4% |
| `create_pr` | 73 | 22 | 0 | 30.1% |
| `get_pr_diff` | 67 | 2 | 0 | 3% |
| `write` | 60 | 1 | 0 | 1.7% |
| `request_close_issue` | 50 | 1 | 0 | 2% |
| `list_prs` | 27 | 0 | 0 | 0% |
| `search_issues` | 27 | 0 | 1 | 0% |
| `merge_pr` | 23 | 0 | 0 | 0% |
| `create_root_issue` | 21 | 1 | 0 | 4.8% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `delegate` | 16 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 5 | 0 | 31.3% |
| `search_code` | 15 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `list_pr_review_comments` | 13 | 0 | 0 | 0% |
| `launch_sub_agent` | 11 | 2 | 0 | 18.2% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `delegate_readonly` | 8 | 0 | 0 | 0% |
| `sync_branch` | 6 | 2 | 0 | 33.3% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `list_issues` | 5 | 0 | 0 | 0% |
| `create_issue` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
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
| `other` | 1,585 | 69% |
| `search` | 241 | 10.5% |
| `edit` | 191 | 8.3% |
| `verify` | 186 | 8.1% |
| `open` | 95 | 4.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 100 | 96.2% |
| `delivery/pipeline-setup` | 2 | 1.9% |
| `engineering/secrets-in-a-check` | 1 | 1% |
| `research/web-search` | 1 | 1% |

## Last 30 days

176 sessions.

**Ran to an end without a report:** 39 of 172 sessions whose last run the core recorded as `completed` — 22.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**604,785,256 tokens** over 212 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,361,854 | 5,707,358 | 28,119,706 | 73,718,100 | 604,785,256 |
| messages per session | 113 | 331 | 715 | 731 | 28,732 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 75 | 42.6% |
| `atomaton` | 55 | 31.3% |
| `engineer` | 46 | 26.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,743 | 21 | 7 | 0.6% |
| `bash` | 3,666 | 63 | 67 | 1.7% |
| `grep` | 2,687 | 64 | 8 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,333 | 21 | 0 | 1.6% |
| `fetch` | 436 | 39 | 0 | 8.9% |
| `get_issue` | 257 | 13 | 5 | 5.1% |
| `list` | 239 | 3 | 0 | 1.3% |
| `get_issue_comments` | 227 | 0 | 10 | 0% |
| `get_pr` | 207 | 9 | 1 | 4.3% |
| `get_check_runs` | 186 | 8 | 0 | 4.3% |
| `glob` | 175 | 1 | 1 | 0.6% |
| `atoma_builtin__load_skill` | 160 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 137 | 0 | 0 | 0% |
| `check_merge_readiness` | 120 | 0 | 0 | 0% |
| `write` | 110 | 1 | 0 | 0.9% |
| `commit_and_push` | 96 | 8 | 0 | 8.3% |
| `search_issues` | 96 | 0 | 3 | 0% |
| `create_pr` | 92 | 31 | 0 | 33.7% |
| `get_pr_diff` | 85 | 3 | 0 | 3.5% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 57 | 1 | 0 | 1.8% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `merge_pr` | 29 | 0 | 0 | 0% |
| `get_pr_reviews` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `list_pr_review_comments` | 23 | 0 | 0 | 0% |
| `create_root_issue` | 22 | 1 | 0 | 4.5% |
| `search_code` | 22 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 21 | 6 | 0 | 28.6% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 2 | 0 | 15.4% |
| `list_issues` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
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
| `other` | 2,610 | 71.2% |
| `search` | 386 | 10.5% |
| `edit` | 293 | 8% |
| `verify` | 224 | 6.1% |
| `open` | 153 | 4.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 143 | 88.3% |
| `delivery/pipeline-setup` | 7 | 4.3% |
| `engineering/environment` | 6 | 3.7% |
| `engineering/secrets-in-a-check` | 3 | 1.9% |
| `research/web-search` | 2 | 1.2% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

176 sessions.

**Ran to an end without a report:** 39 of 172 sessions whose last run the core recorded as `completed` — 22.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**604,785,256 tokens** over 212 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,361,854 | 5,707,358 | 28,119,706 | 73,718,100 | 604,785,256 |
| messages per session | 113 | 331 | 715 | 731 | 28,732 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 75 | 42.6% |
| `atomaton` | 55 | 31.3% |
| `engineer` | 46 | 26.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,743 | 21 | 7 | 0.6% |
| `bash` | 3,666 | 63 | 67 | 1.7% |
| `grep` | 2,687 | 64 | 8 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,333 | 21 | 0 | 1.6% |
| `fetch` | 436 | 39 | 0 | 8.9% |
| `get_issue` | 257 | 13 | 5 | 5.1% |
| `list` | 239 | 3 | 0 | 1.3% |
| `get_issue_comments` | 227 | 0 | 10 | 0% |
| `get_pr` | 207 | 9 | 1 | 4.3% |
| `get_check_runs` | 186 | 8 | 0 | 4.3% |
| `glob` | 175 | 1 | 1 | 0.6% |
| `atoma_builtin__load_skill` | 160 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 137 | 0 | 0 | 0% |
| `check_merge_readiness` | 120 | 0 | 0 | 0% |
| `write` | 110 | 1 | 0 | 0.9% |
| `commit_and_push` | 96 | 8 | 0 | 8.3% |
| `search_issues` | 96 | 0 | 3 | 0% |
| `create_pr` | 92 | 31 | 0 | 33.7% |
| `get_pr_diff` | 85 | 3 | 0 | 3.5% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 57 | 1 | 0 | 1.8% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `merge_pr` | 29 | 0 | 0 | 0% |
| `get_pr_reviews` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `list_pr_review_comments` | 23 | 0 | 0 | 0% |
| `create_root_issue` | 22 | 1 | 0 | 4.5% |
| `search_code` | 22 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 21 | 6 | 0 | 28.6% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 2 | 0 | 15.4% |
| `list_issues` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
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
| `other` | 2,610 | 71.2% |
| `search` | 386 | 10.5% |
| `edit` | 293 | 8% |
| `verify` | 224 | 6.1% |
| `open` | 153 | 4.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 143 | 88.3% |
| `delivery/pipeline-setup` | 7 | 4.3% |
| `engineering/environment` | 6 | 3.7% |
| `engineering/secrets-in-a-check` | 3 | 1.9% |
| `research/web-search` | 2 | 1.2% |
| `docs/design-doc` | 1 | 0.6% |

## All time

178 sessions.

**Ran to an end without a report:** 39 of 172 sessions whose last run the core recorded as `completed` — 22.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**604,785,256 tokens** over 212 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,361,854 | 5,707,358 | 28,119,706 | 73,718,100 | 604,785,256 |
| messages per session | 111 | 331 | 715 | 731 | 28,736 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 75 | 42.1% |
| `atomaton` | 57 | 32% |
| `engineer` | 46 | 25.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,743 | 21 | 7 | 0.6% |
| `bash` | 3,666 | 63 | 67 | 1.7% |
| `grep` | 2,687 | 64 | 8 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,333 | 21 | 0 | 1.6% |
| `fetch` | 436 | 39 | 0 | 8.9% |
| `get_issue` | 257 | 13 | 5 | 5.1% |
| `list` | 239 | 3 | 0 | 1.3% |
| `get_issue_comments` | 227 | 0 | 10 | 0% |
| `get_pr` | 207 | 9 | 1 | 4.3% |
| `get_check_runs` | 186 | 8 | 0 | 4.3% |
| `glob` | 175 | 1 | 1 | 0.6% |
| `atoma_builtin__load_skill` | 160 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 137 | 0 | 0 | 0% |
| `check_merge_readiness` | 120 | 0 | 0 | 0% |
| `write` | 110 | 1 | 0 | 0.9% |
| `commit_and_push` | 96 | 8 | 0 | 8.3% |
| `search_issues` | 96 | 0 | 3 | 0% |
| `create_pr` | 92 | 31 | 0 | 33.7% |
| `get_pr_diff` | 85 | 3 | 0 | 3.5% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 57 | 1 | 0 | 1.8% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `merge_pr` | 29 | 0 | 0 | 0% |
| `get_pr_reviews` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `list_pr_review_comments` | 23 | 0 | 0 | 0% |
| `create_root_issue` | 22 | 1 | 0 | 4.5% |
| `search_code` | 22 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 21 | 6 | 0 | 28.6% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 2 | 0 | 15.4% |
| `list_issues` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
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
| `other` | 2,610 | 71.2% |
| `search` | 386 | 10.5% |
| `edit` | 293 | 8% |
| `verify` | 224 | 6.1% |
| `open` | 153 | 4.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 143 | 88.3% |
| `delivery/pipeline-setup` | 7 | 4.3% |
| `engineering/environment` | 6 | 3.7% |
| `engineering/secrets-in-a-check` | 3 | 1.9% |
| `research/web-search` | 2 | 1.2% |
| `docs/design-doc` | 1 | 0.6% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-10-25 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
