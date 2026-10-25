# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-25.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 231 | 2.6% | 196 | 9,689 | 13 | 14.4 |
| Last 30 days | 348 | 5.2% | 301 | 10,246 | 17 | 21.0 |
| Last year | 348 | 5.2% | 301 | 10,246 | 17 | 21.0 |
| All time | 348 | 5.2% | 301 | 10,246 | 17 | 21.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 330 |
| `failed` | 14 |
| `stopped` | 4 |

## Last 7 days

104 sessions.

**Ran to an end without a report:** 16 of 103 sessions whose last run the core recorded as `completed` — 15.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**238,407,360 tokens** over 139 runs that reported them, **98.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,062,161 | 4,615,931 | 8,400,110 | 8,676,293 | 238,407,360 |
| messages per session | 102 | 283 | 445 | 731 | 14,663 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 51 | 49% |
| `atomaton` | 32 | 30.8% |
| `engineer` | 21 | 20.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,063 | 11 | 0 | 0.5% |
| `bash` | 1,864 | 23 | 29 | 1.2% |
| `grep` | 1,490 | 42 | 0 | 2.8% |
| `edit` | 859 | 18 | 0 | 2.1% |
| `fetch` | 207 | 12 | 0 | 5.8% |
| `get_pr` | 133 | 4 | 0 | 3% |
| `get_issue` | 132 | 0 | 4 | 0% |
| `get_issue_comments` | 124 | 0 | 2 | 0% |
| `get_check_runs` | 118 | 6 | 0 | 5.1% |
| `glob` | 115 | 0 | 0 | 0% |
| `list` | 92 | 2 | 0 | 2.2% |
| `check_merge_readiness` | 86 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 84 | 0 | 0 | 0% |
| `get_branch` | 80 | 0 | 0 | 0% |
| `commit_and_push` | 70 | 6 | 0 | 8.6% |
| `get_pr_diff` | 63 | 2 | 0 | 3.2% |
| `create_pr` | 57 | 16 | 0 | 28.1% |
| `write` | 51 | 0 | 0 | 0% |
| `request_close_issue` | 41 | 1 | 0 | 2.4% |
| `list_prs` | 27 | 0 | 0 | 0% |
| `search_issues` | 25 | 0 | 1 | 0% |
| `create_root_issue` | 17 | 1 | 0 | 5.9% |
| `delegate` | 16 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 5 | 0 | 31.3% |
| `merge_pr` | 15 | 0 | 0 | 0% |
| `search_code` | 15 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `launch_sub_agent` | 11 | 2 | 0 | 18.2% |
| `list_pr_review_comments` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `delegate_readonly` | 8 | 0 | 0 | 0% |
| `sync_branch` | 6 | 2 | 0 | 33.3% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `create_issue` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `list_issues` | 4 | 0 | 0 | 0% |
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
| `other` | 1,196 | 64.2% |
| `search` | 234 | 12.6% |
| `verify` | 186 | 10% |
| `edit` | 157 | 8.4% |
| `open` | 91 | 4.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 82 | 95.3% |
| `delivery/pipeline-setup` | 2 | 2.3% |
| `engineering/secrets-in-a-check` | 1 | 1.2% |
| `research/web-search` | 1 | 1.2% |

## Last 30 days

155 sessions.

**Ran to an end without a report:** 31 of 152 sessions whose last run the core recorded as `completed` — 20.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**587,316,356 tokens** over 198 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,397,770 | 5,781,615 | 39,097,860 | 73,718,100 | 587,316,356 |
| messages per session | 123 | 362 | 715 | 731 | 26,720 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 66 | 42.6% |
| `atomaton` | 54 | 34.8% |
| `engineer` | 35 | 22.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,547 | 21 | 4 | 0.6% |
| `bash` | 3,232 | 56 | 60 | 1.7% |
| `grep` | 2,562 | 60 | 7 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,226 | 21 | 0 | 1.7% |
| `fetch` | 427 | 39 | 0 | 9.1% |
| `get_issue` | 242 | 13 | 4 | 5.4% |
| `list` | 230 | 3 | 0 | 1.3% |
| `get_issue_comments` | 211 | 0 | 10 | 0% |
| `get_pr` | 184 | 9 | 0 | 4.9% |
| `glob` | 171 | 1 | 1 | 0.6% |
| `get_check_runs` | 168 | 8 | 0 | 4.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 142 | 0 | 0 | 0% |
| `get_branch` | 133 | 0 | 0 | 0% |
| `check_merge_readiness` | 106 | 0 | 0 | 0% |
| `write` | 101 | 0 | 0 | 0% |
| `search_issues` | 94 | 0 | 3 | 0% |
| `commit_and_push` | 85 | 8 | 0 | 9.4% |
| `get_pr_diff` | 81 | 3 | 0 | 3.7% |
| `create_pr` | 76 | 25 | 0 | 32.9% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 48 | 1 | 0 | 2.1% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `get_pr_reviews` | 22 | 0 | 0 | 0% |
| `search_code` | 22 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `merge_pr` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 21 | 6 | 0 | 28.6% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_pr_review_comments` | 19 | 0 | 0 | 0% |
| `create_root_issue` | 18 | 1 | 0 | 5.6% |
| `delegate` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 2 | 0 | 15.4% |
| `list_issues` | 12 | 0 | 0 | 0% |
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
| `other` | 2,221 | 68.7% |
| `search` | 379 | 11.7% |
| `edit` | 259 | 8% |
| `verify` | 224 | 6.9% |
| `open` | 149 | 4.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 125 | 86.8% |
| `delivery/pipeline-setup` | 7 | 4.9% |
| `engineering/environment` | 6 | 4.2% |
| `engineering/secrets-in-a-check` | 3 | 2.1% |
| `research/web-search` | 2 | 1.4% |
| `docs/design-doc` | 1 | 0.7% |

## Last year

155 sessions.

**Ran to an end without a report:** 31 of 152 sessions whose last run the core recorded as `completed` — 20.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**587,316,356 tokens** over 198 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,397,770 | 5,781,615 | 39,097,860 | 73,718,100 | 587,316,356 |
| messages per session | 123 | 362 | 715 | 731 | 26,720 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 66 | 42.6% |
| `atomaton` | 54 | 34.8% |
| `engineer` | 35 | 22.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,547 | 21 | 4 | 0.6% |
| `bash` | 3,232 | 56 | 60 | 1.7% |
| `grep` | 2,562 | 60 | 7 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,226 | 21 | 0 | 1.7% |
| `fetch` | 427 | 39 | 0 | 9.1% |
| `get_issue` | 242 | 13 | 4 | 5.4% |
| `list` | 230 | 3 | 0 | 1.3% |
| `get_issue_comments` | 211 | 0 | 10 | 0% |
| `get_pr` | 184 | 9 | 0 | 4.9% |
| `glob` | 171 | 1 | 1 | 0.6% |
| `get_check_runs` | 168 | 8 | 0 | 4.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 142 | 0 | 0 | 0% |
| `get_branch` | 133 | 0 | 0 | 0% |
| `check_merge_readiness` | 106 | 0 | 0 | 0% |
| `write` | 101 | 0 | 0 | 0% |
| `search_issues` | 94 | 0 | 3 | 0% |
| `commit_and_push` | 85 | 8 | 0 | 9.4% |
| `get_pr_diff` | 81 | 3 | 0 | 3.7% |
| `create_pr` | 76 | 25 | 0 | 32.9% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 48 | 1 | 0 | 2.1% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `get_pr_reviews` | 22 | 0 | 0 | 0% |
| `search_code` | 22 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `merge_pr` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 21 | 6 | 0 | 28.6% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_pr_review_comments` | 19 | 0 | 0 | 0% |
| `create_root_issue` | 18 | 1 | 0 | 5.6% |
| `delegate` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 2 | 0 | 15.4% |
| `list_issues` | 12 | 0 | 0 | 0% |
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
| `other` | 2,221 | 68.7% |
| `search` | 379 | 11.7% |
| `edit` | 259 | 8% |
| `verify` | 224 | 6.9% |
| `open` | 149 | 4.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 125 | 86.8% |
| `delivery/pipeline-setup` | 7 | 4.9% |
| `engineering/environment` | 6 | 4.2% |
| `engineering/secrets-in-a-check` | 3 | 2.1% |
| `research/web-search` | 2 | 1.4% |
| `docs/design-doc` | 1 | 0.7% |

## All time

157 sessions.

**Ran to an end without a report:** 31 of 152 sessions whose last run the core recorded as `completed` — 20.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**587,316,356 tokens** over 198 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,397,770 | 5,781,615 | 39,097,860 | 73,718,100 | 587,316,356 |
| messages per session | 120 | 362 | 715 | 731 | 26,724 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 66 | 42% |
| `atomaton` | 56 | 35.7% |
| `engineer` | 35 | 22.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,547 | 21 | 4 | 0.6% |
| `bash` | 3,232 | 56 | 60 | 1.7% |
| `grep` | 2,562 | 60 | 7 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,226 | 21 | 0 | 1.7% |
| `fetch` | 427 | 39 | 0 | 9.1% |
| `get_issue` | 242 | 13 | 4 | 5.4% |
| `list` | 230 | 3 | 0 | 1.3% |
| `get_issue_comments` | 211 | 0 | 10 | 0% |
| `get_pr` | 184 | 9 | 0 | 4.9% |
| `glob` | 171 | 1 | 1 | 0.6% |
| `get_check_runs` | 168 | 8 | 0 | 4.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 142 | 0 | 0 | 0% |
| `get_branch` | 133 | 0 | 0 | 0% |
| `check_merge_readiness` | 106 | 0 | 0 | 0% |
| `write` | 101 | 0 | 0 | 0% |
| `search_issues` | 94 | 0 | 3 | 0% |
| `commit_and_push` | 85 | 8 | 0 | 9.4% |
| `get_pr_diff` | 81 | 3 | 0 | 3.7% |
| `create_pr` | 76 | 25 | 0 | 32.9% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 48 | 1 | 0 | 2.1% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `get_pr_reviews` | 22 | 0 | 0 | 0% |
| `search_code` | 22 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `merge_pr` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 21 | 6 | 0 | 28.6% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_pr_review_comments` | 19 | 0 | 0 | 0% |
| `create_root_issue` | 18 | 1 | 0 | 5.6% |
| `delegate` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 2 | 0 | 15.4% |
| `list_issues` | 12 | 0 | 0 | 0% |
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
| `other` | 2,221 | 68.7% |
| `search` | 379 | 11.7% |
| `edit` | 259 | 8% |
| `verify` | 224 | 6.9% |
| `open` | 149 | 4.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 125 | 86.8% |
| `delivery/pipeline-setup` | 7 | 4.9% |
| `engineering/environment` | 6 | 4.2% |
| `engineering/secrets-in-a-check` | 3 | 2.1% |
| `research/web-search` | 2 | 1.4% |
| `docs/design-doc` | 1 | 0.7% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
