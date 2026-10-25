# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-25.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 275 | 4.7% | 198 | 9,689 | 15 | 12.5 |
| Last 30 days | 400 | 6.3% | 270 | 10,246 | 17 | 18.0 |
| Last year | 400 | 6.3% | 270 | 10,246 | 17 | 18.0 |
| All time | 400 | 6.3% | 270 | 10,246 | 17 | 18.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 375 |
| `failed` | 15 |
| `stopped` | 10 |

## Last 7 days

125 sessions.

**Ran to an end without a report:** 21 of 120 sessions whose last run the core recorded as `completed` — 17.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**265,590,899 tokens** over 155 runs that reported them, **98.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,062,161 | 4,544,302 | 8,400,110 | 8,676,293 | 265,590,899 |
| messages per session | 101 | 268 | 445 | 731 | 16,809 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 59 | 47.2% |
| `engineer` | 36 | 28.8% |
| `atomaton` | 30 | 24% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,521 | 31 | 35 | 1.2% |
| `read` | 2,188 | 10 | 4 | 0.5% |
| `grep` | 1,556 | 45 | 1 | 2.9% |
| `edit` | 1,068 | 21 | 0 | 2% |
| `fetch` | 157 | 10 | 0 | 6.4% |
| `get_pr` | 152 | 3 | 3 | 2% |
| `get_issue` | 146 | 0 | 5 | 0% |
| `get_issue_comments` | 142 | 0 | 2 | 0% |
| `get_check_runs` | 137 | 5 | 0 | 3.6% |
| `glob` | 114 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 101 | 0 | 0 | 0% |
| `check_merge_readiness` | 100 | 0 | 0 | 0% |
| `list` | 97 | 2 | 0 | 2.1% |
| `commit_and_push` | 82 | 6 | 0 | 7.3% |
| `get_branch` | 80 | 0 | 0 | 0% |
| `create_pr` | 68 | 18 | 0 | 26.5% |
| `get_pr_diff` | 66 | 2 | 0 | 3% |
| `write` | 60 | 1 | 0 | 1.7% |
| `request_close_issue` | 46 | 1 | 0 | 2.2% |
| `search_issues` | 35 | 0 | 1 | 0% |
| `list_prs` | 25 | 0 | 0 | 0% |
| `merge_pr` | 23 | 0 | 0 | 0% |
| `create_root_issue` | 21 | 1 | 0 | 4.8% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `search_remote_code` | 15 | 4 | 0 | 26.7% |
| `delegate` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `search_code` | 13 | 0 | 0 | 0% |
| `launch_sub_agent` | 10 | 2 | 0 | 20% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `delegate_readonly` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `list_issues` | 5 | 0 | 0 | 0% |
| `sync_branch` | 5 | 1 | 0 | 20% |
| `create_issue` | 4 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
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
| `other` | 1,876 | 74.4% |
| `search` | 223 | 8.8% |
| `edit` | 176 | 7% |
| `verify` | 154 | 6.1% |
| `open` | 92 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 100 | 97.1% |
| `delivery/pipeline-setup` | 1 | 1% |
| `engineering/secrets-in-a-check` | 1 | 1% |
| `research/web-search` | 1 | 1% |

## Last 30 days

181 sessions.

**Ran to an end without a report:** 39 of 174 sessions whose last run the core recorded as `completed` — 22.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**616,698,212 tokens** over 217 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,361,854 | 5,707,358 | 28,119,706 | 73,718,100 | 616,698,212 |
| messages per session | 119 | 327 | 715 | 731 | 29,894 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 76 | 42% |
| `atomaton` | 55 | 30.4% |
| `engineer` | 50 | 27.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,006 | 66 | 69 | 1.6% |
| `read` | 3,825 | 21 | 8 | 0.5% |
| `grep` | 2,717 | 64 | 8 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,453 | 24 | 0 | 1.7% |
| `fetch` | 436 | 39 | 0 | 8.9% |
| `get_issue` | 269 | 13 | 5 | 4.8% |
| `get_issue_comments` | 239 | 0 | 10 | 0% |
| `list` | 239 | 3 | 0 | 1.3% |
| `get_pr` | 211 | 9 | 3 | 4.3% |
| `get_check_runs` | 192 | 8 | 0 | 4.2% |
| `glob` | 177 | 1 | 1 | 0.6% |
| `atoma_builtin__load_skill` | 165 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 138 | 0 | 0 | 0% |
| `check_merge_readiness` | 123 | 0 | 0 | 0% |
| `write` | 111 | 1 | 0 | 0.9% |
| `search_issues` | 104 | 0 | 3 | 0% |
| `commit_and_push` | 99 | 8 | 0 | 8.1% |
| `create_pr` | 94 | 31 | 0 | 33% |
| `get_pr_diff` | 88 | 3 | 0 | 3.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 58 | 1 | 0 | 1.7% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `merge_pr` | 31 | 0 | 0 | 0% |
| `get_pr_reviews` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `list_pr_review_comments` | 25 | 0 | 0 | 0% |
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
| `other` | 2,945 | 73.5% |
| `search` | 389 | 9.7% |
| `edit` | 295 | 7.4% |
| `verify` | 224 | 5.6% |
| `open` | 153 | 3.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 148 | 88.6% |
| `delivery/pipeline-setup` | 7 | 4.2% |
| `engineering/environment` | 6 | 3.6% |
| `engineering/secrets-in-a-check` | 3 | 1.8% |
| `research/web-search` | 2 | 1.2% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

181 sessions.

**Ran to an end without a report:** 39 of 174 sessions whose last run the core recorded as `completed` — 22.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**616,698,212 tokens** over 217 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,361,854 | 5,707,358 | 28,119,706 | 73,718,100 | 616,698,212 |
| messages per session | 119 | 327 | 715 | 731 | 29,894 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 76 | 42% |
| `atomaton` | 55 | 30.4% |
| `engineer` | 50 | 27.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,006 | 66 | 69 | 1.6% |
| `read` | 3,825 | 21 | 8 | 0.5% |
| `grep` | 2,717 | 64 | 8 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,453 | 24 | 0 | 1.7% |
| `fetch` | 436 | 39 | 0 | 8.9% |
| `get_issue` | 269 | 13 | 5 | 4.8% |
| `get_issue_comments` | 239 | 0 | 10 | 0% |
| `list` | 239 | 3 | 0 | 1.3% |
| `get_pr` | 211 | 9 | 3 | 4.3% |
| `get_check_runs` | 192 | 8 | 0 | 4.2% |
| `glob` | 177 | 1 | 1 | 0.6% |
| `atoma_builtin__load_skill` | 165 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 138 | 0 | 0 | 0% |
| `check_merge_readiness` | 123 | 0 | 0 | 0% |
| `write` | 111 | 1 | 0 | 0.9% |
| `search_issues` | 104 | 0 | 3 | 0% |
| `commit_and_push` | 99 | 8 | 0 | 8.1% |
| `create_pr` | 94 | 31 | 0 | 33% |
| `get_pr_diff` | 88 | 3 | 0 | 3.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 58 | 1 | 0 | 1.7% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `merge_pr` | 31 | 0 | 0 | 0% |
| `get_pr_reviews` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `list_pr_review_comments` | 25 | 0 | 0 | 0% |
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
| `other` | 2,945 | 73.5% |
| `search` | 389 | 9.7% |
| `edit` | 295 | 7.4% |
| `verify` | 224 | 5.6% |
| `open` | 153 | 3.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 148 | 88.6% |
| `delivery/pipeline-setup` | 7 | 4.2% |
| `engineering/environment` | 6 | 3.6% |
| `engineering/secrets-in-a-check` | 3 | 1.8% |
| `research/web-search` | 2 | 1.2% |
| `docs/design-doc` | 1 | 0.6% |

## All time

183 sessions.

**Ran to an end without a report:** 39 of 174 sessions whose last run the core recorded as `completed` — 22.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**616,698,212 tokens** over 217 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,361,854 | 5,707,358 | 28,119,706 | 73,718,100 | 616,698,212 |
| messages per session | 117 | 327 | 715 | 731 | 29,898 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 76 | 41.5% |
| `atomaton` | 57 | 31.1% |
| `engineer` | 50 | 27.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,006 | 66 | 69 | 1.6% |
| `read` | 3,825 | 21 | 8 | 0.5% |
| `grep` | 2,717 | 64 | 8 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,453 | 24 | 0 | 1.7% |
| `fetch` | 436 | 39 | 0 | 8.9% |
| `get_issue` | 269 | 13 | 5 | 4.8% |
| `get_issue_comments` | 239 | 0 | 10 | 0% |
| `list` | 239 | 3 | 0 | 1.3% |
| `get_pr` | 211 | 9 | 3 | 4.3% |
| `get_check_runs` | 192 | 8 | 0 | 4.2% |
| `glob` | 177 | 1 | 1 | 0.6% |
| `atoma_builtin__load_skill` | 165 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 138 | 0 | 0 | 0% |
| `check_merge_readiness` | 123 | 0 | 0 | 0% |
| `write` | 111 | 1 | 0 | 0.9% |
| `search_issues` | 104 | 0 | 3 | 0% |
| `commit_and_push` | 99 | 8 | 0 | 8.1% |
| `create_pr` | 94 | 31 | 0 | 33% |
| `get_pr_diff` | 88 | 3 | 0 | 3.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 58 | 1 | 0 | 1.7% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `merge_pr` | 31 | 0 | 0 | 0% |
| `get_pr_reviews` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `list_pr_review_comments` | 25 | 0 | 0 | 0% |
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
| `other` | 2,945 | 73.5% |
| `search` | 389 | 9.7% |
| `edit` | 295 | 7.4% |
| `verify` | 224 | 5.6% |
| `open` | 153 | 3.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 148 | 88.6% |
| `delivery/pipeline-setup` | 7 | 4.2% |
| `engineering/environment` | 6 | 3.6% |
| `engineering/secrets-in-a-check` | 3 | 1.8% |
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
