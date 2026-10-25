# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-25.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 255 | 2.7% | 198 | 9,689 | 14 | 13.2 |
| Last 30 days | 372 | 5.1% | 274 | 10,246 | 17 | 19.0 |
| Last year | 372 | 5.1% | 274 | 10,246 | 17 | 19.0 |
| All time | 372 | 5.1% | 274 | 10,246 | 17 | 19.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 353 |
| `failed` | 14 |
| `stopped` | 5 |

## Last 7 days

119 sessions.

**Ran to an end without a report:** 22 of 117 sessions whose last run the core recorded as `completed` — 18.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**249,747,736 tokens** over 148 runs that reported them, **98.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,062,161 | 4,544,302 | 8,400,110 | 8,676,293 | 249,747,736 |
| messages per session | 100 | 276 | 445 | 731 | 16,035 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 57 | 47.9% |
| `atomaton` | 33 | 27.7% |
| `engineer` | 29 | 24.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,178 | 11 | 0 | 0.5% |
| `bash` | 2,174 | 28 | 33 | 1.3% |
| `grep` | 1,580 | 46 | 0 | 2.9% |
| `edit` | 918 | 18 | 0 | 2% |
| `fetch` | 213 | 12 | 0 | 5.6% |
| `get_pr` | 152 | 4 | 0 | 2.6% |
| `get_issue` | 145 | 0 | 4 | 0% |
| `get_issue_comments` | 138 | 0 | 2 | 0% |
| `get_check_runs` | 130 | 6 | 0 | 4.6% |
| `glob` | 118 | 0 | 0 | 0% |
| `list` | 101 | 2 | 0 | 2% |
| `atoma_builtin__load_skill` | 96 | 0 | 0 | 0% |
| `check_merge_readiness` | 96 | 0 | 0 | 0% |
| `get_branch` | 83 | 0 | 0 | 0% |
| `commit_and_push` | 77 | 6 | 0 | 7.8% |
| `create_pr` | 69 | 21 | 0 | 30.4% |
| `get_pr_diff` | 66 | 2 | 0 | 3% |
| `write` | 58 | 1 | 0 | 1.7% |
| `request_close_issue` | 48 | 1 | 0 | 2.1% |
| `list_prs` | 27 | 0 | 0 | 0% |
| `search_issues` | 27 | 0 | 1 | 0% |
| `merge_pr` | 23 | 0 | 0 | 0% |
| `create_root_issue` | 20 | 1 | 0 | 5% |
| `delegate` | 16 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 5 | 0 | 31.3% |
| `search_code` | 15 | 0 | 0 | 0% |
| `get_pr_reviews` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `launch_sub_agent` | 11 | 2 | 0 | 18.2% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
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
| `other` | 1,472 | 67.7% |
| `search` | 241 | 11.1% |
| `verify` | 186 | 8.6% |
| `edit` | 180 | 8.3% |
| `open` | 95 | 4.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 94 | 95.9% |
| `delivery/pipeline-setup` | 2 | 2% |
| `engineering/secrets-in-a-check` | 1 | 1% |
| `research/web-search` | 1 | 1% |

## Last 30 days

170 sessions.

**Ran to an end without a report:** 37 of 166 sessions whose last run the core recorded as `completed` — 22.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**598,656,732 tokens** over 207 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,393,286 | 5,758,740 | 28,119,706 | 73,718,100 | 598,656,732 |
| messages per session | 117 | 350 | 715 | 731 | 28,092 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 72 | 42.4% |
| `atomaton` | 55 | 32.4% |
| `engineer` | 43 | 25.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,662 | 21 | 4 | 0.6% |
| `bash` | 3,542 | 61 | 64 | 1.7% |
| `grep` | 2,652 | 64 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,285 | 21 | 0 | 1.6% |
| `fetch` | 433 | 39 | 0 | 9% |
| `get_issue` | 255 | 13 | 4 | 5.1% |
| `list` | 239 | 3 | 0 | 1.3% |
| `get_issue_comments` | 225 | 0 | 10 | 0% |
| `get_pr` | 203 | 9 | 0 | 4.4% |
| `get_check_runs` | 180 | 8 | 0 | 4.4% |
| `glob` | 174 | 1 | 1 | 0.6% |
| `atoma_builtin__load_skill` | 154 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 136 | 0 | 0 | 0% |
| `check_merge_readiness` | 116 | 0 | 0 | 0% |
| `write` | 108 | 1 | 0 | 0.9% |
| `search_issues` | 96 | 0 | 3 | 0% |
| `commit_and_push` | 92 | 8 | 0 | 8.7% |
| `create_pr` | 88 | 30 | 0 | 34.1% |
| `get_pr_diff` | 84 | 3 | 0 | 3.6% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 55 | 1 | 0 | 1.8% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `merge_pr` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `get_pr_reviews` | 25 | 0 | 0 | 0% |
| `search_code` | 22 | 0 | 0 | 0% |
| `create_root_issue` | 21 | 1 | 0 | 4.8% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 21 | 6 | 0 | 28.6% |
| `list_pr_review_comments` | 20 | 0 | 0 | 0% |
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
| `other` | 2,497 | 70.5% |
| `search` | 386 | 10.9% |
| `edit` | 282 | 8% |
| `verify` | 224 | 6.3% |
| `open` | 153 | 4.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 137 | 87.8% |
| `delivery/pipeline-setup` | 7 | 4.5% |
| `engineering/environment` | 6 | 3.8% |
| `engineering/secrets-in-a-check` | 3 | 1.9% |
| `research/web-search` | 2 | 1.3% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

170 sessions.

**Ran to an end without a report:** 37 of 166 sessions whose last run the core recorded as `completed` — 22.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**598,656,732 tokens** over 207 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,393,286 | 5,758,740 | 28,119,706 | 73,718,100 | 598,656,732 |
| messages per session | 117 | 350 | 715 | 731 | 28,092 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 72 | 42.4% |
| `atomaton` | 55 | 32.4% |
| `engineer` | 43 | 25.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,662 | 21 | 4 | 0.6% |
| `bash` | 3,542 | 61 | 64 | 1.7% |
| `grep` | 2,652 | 64 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,285 | 21 | 0 | 1.6% |
| `fetch` | 433 | 39 | 0 | 9% |
| `get_issue` | 255 | 13 | 4 | 5.1% |
| `list` | 239 | 3 | 0 | 1.3% |
| `get_issue_comments` | 225 | 0 | 10 | 0% |
| `get_pr` | 203 | 9 | 0 | 4.4% |
| `get_check_runs` | 180 | 8 | 0 | 4.4% |
| `glob` | 174 | 1 | 1 | 0.6% |
| `atoma_builtin__load_skill` | 154 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 136 | 0 | 0 | 0% |
| `check_merge_readiness` | 116 | 0 | 0 | 0% |
| `write` | 108 | 1 | 0 | 0.9% |
| `search_issues` | 96 | 0 | 3 | 0% |
| `commit_and_push` | 92 | 8 | 0 | 8.7% |
| `create_pr` | 88 | 30 | 0 | 34.1% |
| `get_pr_diff` | 84 | 3 | 0 | 3.6% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 55 | 1 | 0 | 1.8% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `merge_pr` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `get_pr_reviews` | 25 | 0 | 0 | 0% |
| `search_code` | 22 | 0 | 0 | 0% |
| `create_root_issue` | 21 | 1 | 0 | 4.8% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 21 | 6 | 0 | 28.6% |
| `list_pr_review_comments` | 20 | 0 | 0 | 0% |
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
| `other` | 2,497 | 70.5% |
| `search` | 386 | 10.9% |
| `edit` | 282 | 8% |
| `verify` | 224 | 6.3% |
| `open` | 153 | 4.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 137 | 87.8% |
| `delivery/pipeline-setup` | 7 | 4.5% |
| `engineering/environment` | 6 | 3.8% |
| `engineering/secrets-in-a-check` | 3 | 1.9% |
| `research/web-search` | 2 | 1.3% |
| `docs/design-doc` | 1 | 0.6% |

## All time

172 sessions.

**Ran to an end without a report:** 37 of 166 sessions whose last run the core recorded as `completed` — 22.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**598,656,732 tokens** over 207 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,393,286 | 5,758,740 | 28,119,706 | 73,718,100 | 598,656,732 |
| messages per session | 113 | 331 | 715 | 731 | 28,096 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 72 | 41.9% |
| `atomaton` | 57 | 33.1% |
| `engineer` | 43 | 25% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,662 | 21 | 4 | 0.6% |
| `bash` | 3,542 | 61 | 64 | 1.7% |
| `grep` | 2,652 | 64 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,285 | 21 | 0 | 1.6% |
| `fetch` | 433 | 39 | 0 | 9% |
| `get_issue` | 255 | 13 | 4 | 5.1% |
| `list` | 239 | 3 | 0 | 1.3% |
| `get_issue_comments` | 225 | 0 | 10 | 0% |
| `get_pr` | 203 | 9 | 0 | 4.4% |
| `get_check_runs` | 180 | 8 | 0 | 4.4% |
| `glob` | 174 | 1 | 1 | 0.6% |
| `atoma_builtin__load_skill` | 154 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 136 | 0 | 0 | 0% |
| `check_merge_readiness` | 116 | 0 | 0 | 0% |
| `write` | 108 | 1 | 0 | 0.9% |
| `search_issues` | 96 | 0 | 3 | 0% |
| `commit_and_push` | 92 | 8 | 0 | 8.7% |
| `create_pr` | 88 | 30 | 0 | 34.1% |
| `get_pr_diff` | 84 | 3 | 0 | 3.6% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 55 | 1 | 0 | 1.8% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `merge_pr` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `get_pr_reviews` | 25 | 0 | 0 | 0% |
| `search_code` | 22 | 0 | 0 | 0% |
| `create_root_issue` | 21 | 1 | 0 | 4.8% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 21 | 6 | 0 | 28.6% |
| `list_pr_review_comments` | 20 | 0 | 0 | 0% |
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
| `other` | 2,497 | 70.5% |
| `search` | 386 | 10.9% |
| `edit` | 282 | 8% |
| `verify` | 224 | 6.3% |
| `open` | 153 | 4.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 137 | 87.8% |
| `delivery/pipeline-setup` | 7 | 4.5% |
| `engineering/environment` | 6 | 3.8% |
| `engineering/secrets-in-a-check` | 3 | 1.9% |
| `research/web-search` | 2 | 1.3% |
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
