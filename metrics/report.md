# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-25.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 212 | 2.8% | 207 | 9,689 | 15 | 14.9 |
| Last 30 days | 325 | 5.5% | 327 | 10,246 | 17 | 21.8 |
| Last year | 325 | 5.5% | 327 | 10,246 | 17 | 21.8 |
| All time | 325 | 5.5% | 327 | 10,246 | 17 | 21.8 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 307 |
| `failed` | 14 |
| `stopped` | 4 |

## Last 7 days

99 sessions.

**Ran to an end without a report:** 16 of 98 sessions whose last run the core recorded as `completed` — 16.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**226,846,660 tokens** over 133 runs that reported them, **98.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,135,650 | 4,544,302 | 8,400,110 | 8,676,293 | 226,846,660 |
| messages per session | 102 | 290 | 731 | 731 | 14,030 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 48 | 48.5% |
| `atomaton` | 31 | 31.3% |
| `engineer` | 20 | 20.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,005 | 11 | 0 | 0.5% |
| `bash` | 1,756 | 19 | 26 | 1.1% |
| `grep` | 1,431 | 42 | 0 | 2.9% |
| `edit` | 838 | 16 | 0 | 1.9% |
| `fetch` | 181 | 11 | 0 | 6.1% |
| `get_issue` | 128 | 0 | 4 | 0% |
| `get_pr` | 124 | 4 | 0 | 3.2% |
| `get_issue_comments` | 116 | 0 | 2 | 0% |
| `get_check_runs` | 111 | 5 | 0 | 4.5% |
| `glob` | 110 | 0 | 0 | 0% |
| `list` | 87 | 2 | 0 | 2.3% |
| `atoma_builtin__load_skill` | 83 | 0 | 0 | 0% |
| `check_merge_readiness` | 79 | 0 | 0 | 0% |
| `get_branch` | 72 | 0 | 0 | 0% |
| `commit_and_push` | 67 | 6 | 0 | 9% |
| `get_pr_diff` | 57 | 2 | 0 | 3.5% |
| `create_pr` | 55 | 16 | 0 | 29.1% |
| `write` | 48 | 0 | 0 | 0% |
| `request_close_issue` | 39 | 1 | 0 | 2.6% |
| `list_prs` | 25 | 0 | 0 | 0% |
| `search_issues` | 23 | 0 | 0 | 0% |
| `delegate` | 16 | 0 | 0 | 0% |
| `create_root_issue` | 15 | 1 | 0 | 6.7% |
| `search_remote_code` | 15 | 4 | 0 | 26.7% |
| `merge_pr` | 14 | 0 | 0 | 0% |
| `search_code` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `get_pr_reviews` | 10 | 0 | 0 | 0% |
| `launch_sub_agent` | 10 | 2 | 0 | 20% |
| `delegate_readonly` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `list_pr_review_comments` | 8 | 0 | 0 | 0% |
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
| `other` | 1,117 | 63.6% |
| `search` | 229 | 13% |
| `verify` | 184 | 10.5% |
| `edit` | 136 | 7.7% |
| `open` | 90 | 5.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 81 | 95.3% |
| `delivery/pipeline-setup` | 2 | 2.4% |
| `engineering/secrets-in-a-check` | 1 | 1.2% |
| `research/web-search` | 1 | 1.2% |

## Last 30 days

148 sessions.

**Ran to an end without a report:** 31 of 145 sessions whose last run the core recorded as `completed` — 21.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**572,625,256 tokens** over 189 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,397,770 | 5,781,615 | 39,097,860 | 73,718,100 | 572,625,256 |
| messages per session | 129 | 384 | 715 | 731 | 25,951 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 62 | 41.9% |
| `atomaton` | 53 | 35.8% |
| `engineer` | 33 | 22.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,473 | 21 | 4 | 0.6% |
| `bash` | 3,098 | 52 | 57 | 1.7% |
| `grep` | 2,492 | 60 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,203 | 19 | 0 | 1.6% |
| `fetch` | 401 | 38 | 0 | 9.5% |
| `get_issue` | 237 | 13 | 4 | 5.5% |
| `list` | 225 | 3 | 0 | 1.3% |
| `get_issue_comments` | 202 | 0 | 10 | 0% |
| `get_pr` | 173 | 9 | 0 | 5.2% |
| `glob` | 166 | 1 | 1 | 0.6% |
| `get_check_runs` | 158 | 7 | 0 | 4.4% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 139 | 0 | 0 | 0% |
| `get_branch` | 125 | 0 | 0 | 0% |
| `check_merge_readiness` | 99 | 0 | 0 | 0% |
| `write` | 98 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `commit_and_push` | 81 | 8 | 0 | 9.9% |
| `create_pr` | 74 | 25 | 0 | 33.8% |
| `get_pr_diff` | 74 | 3 | 0 | 4.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 46 | 1 | 0 | 2.2% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_prs` | 41 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `get_pr_reviews` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `merge_pr` | 20 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 16 | 1 | 0 | 6.3% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 12 | 2 | 0 | 16.7% |
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
| `other` | 2,116 | 68.3% |
| `search` | 374 | 12.1% |
| `edit` | 238 | 7.7% |
| `verify` | 222 | 7.2% |
| `open` | 148 | 4.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 122 | 86.5% |
| `delivery/pipeline-setup` | 7 | 5% |
| `engineering/environment` | 6 | 4.3% |
| `engineering/secrets-in-a-check` | 3 | 2.1% |
| `research/web-search` | 2 | 1.4% |
| `docs/design-doc` | 1 | 0.7% |

## Last year

148 sessions.

**Ran to an end without a report:** 31 of 145 sessions whose last run the core recorded as `completed` — 21.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**572,625,256 tokens** over 189 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,397,770 | 5,781,615 | 39,097,860 | 73,718,100 | 572,625,256 |
| messages per session | 129 | 384 | 715 | 731 | 25,951 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 62 | 41.9% |
| `atomaton` | 53 | 35.8% |
| `engineer` | 33 | 22.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,473 | 21 | 4 | 0.6% |
| `bash` | 3,098 | 52 | 57 | 1.7% |
| `grep` | 2,492 | 60 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,203 | 19 | 0 | 1.6% |
| `fetch` | 401 | 38 | 0 | 9.5% |
| `get_issue` | 237 | 13 | 4 | 5.5% |
| `list` | 225 | 3 | 0 | 1.3% |
| `get_issue_comments` | 202 | 0 | 10 | 0% |
| `get_pr` | 173 | 9 | 0 | 5.2% |
| `glob` | 166 | 1 | 1 | 0.6% |
| `get_check_runs` | 158 | 7 | 0 | 4.4% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 139 | 0 | 0 | 0% |
| `get_branch` | 125 | 0 | 0 | 0% |
| `check_merge_readiness` | 99 | 0 | 0 | 0% |
| `write` | 98 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `commit_and_push` | 81 | 8 | 0 | 9.9% |
| `create_pr` | 74 | 25 | 0 | 33.8% |
| `get_pr_diff` | 74 | 3 | 0 | 4.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 46 | 1 | 0 | 2.2% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_prs` | 41 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `get_pr_reviews` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `merge_pr` | 20 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 16 | 1 | 0 | 6.3% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 12 | 2 | 0 | 16.7% |
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
| `other` | 2,116 | 68.3% |
| `search` | 374 | 12.1% |
| `edit` | 238 | 7.7% |
| `verify` | 222 | 7.2% |
| `open` | 148 | 4.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 122 | 86.5% |
| `delivery/pipeline-setup` | 7 | 5% |
| `engineering/environment` | 6 | 4.3% |
| `engineering/secrets-in-a-check` | 3 | 2.1% |
| `research/web-search` | 2 | 1.4% |
| `docs/design-doc` | 1 | 0.7% |

## All time

150 sessions.

**Ran to an end without a report:** 31 of 145 sessions whose last run the core recorded as `completed` — 21.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**572,625,256 tokens** over 189 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,397,770 | 5,781,615 | 39,097,860 | 73,718,100 | 572,625,256 |
| messages per session | 129 | 384 | 715 | 731 | 25,955 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 62 | 41.3% |
| `atomaton` | 55 | 36.7% |
| `engineer` | 33 | 22% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,473 | 21 | 4 | 0.6% |
| `bash` | 3,098 | 52 | 57 | 1.7% |
| `grep` | 2,492 | 60 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,203 | 19 | 0 | 1.6% |
| `fetch` | 401 | 38 | 0 | 9.5% |
| `get_issue` | 237 | 13 | 4 | 5.5% |
| `list` | 225 | 3 | 0 | 1.3% |
| `get_issue_comments` | 202 | 0 | 10 | 0% |
| `get_pr` | 173 | 9 | 0 | 5.2% |
| `glob` | 166 | 1 | 1 | 0.6% |
| `get_check_runs` | 158 | 7 | 0 | 4.4% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 139 | 0 | 0 | 0% |
| `get_branch` | 125 | 0 | 0 | 0% |
| `check_merge_readiness` | 99 | 0 | 0 | 0% |
| `write` | 98 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `commit_and_push` | 81 | 8 | 0 | 9.9% |
| `create_pr` | 74 | 25 | 0 | 33.8% |
| `get_pr_diff` | 74 | 3 | 0 | 4.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 46 | 1 | 0 | 2.2% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_prs` | 41 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `get_pr_reviews` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `merge_pr` | 20 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 16 | 1 | 0 | 6.3% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 12 | 2 | 0 | 16.7% |
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
| `other` | 2,116 | 68.3% |
| `search` | 374 | 12.1% |
| `edit` | 238 | 7.7% |
| `verify` | 222 | 7.2% |
| `open` | 148 | 4.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 122 | 86.5% |
| `delivery/pipeline-setup` | 7 | 5% |
| `engineering/environment` | 6 | 4.3% |
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
