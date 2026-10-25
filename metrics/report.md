# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-25.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 240 | 2.5% | 196 | 9,689 | 14 | 13.9 |
| Last 30 days | 357 | 5% | 291 | 10,246 | 17 | 20.4 |
| Last year | 357 | 5% | 291 | 10,246 | 17 | 20.4 |
| All time | 357 | 5% | 291 | 10,246 | 17 | 20.4 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 339 |
| `failed` | 14 |
| `stopped` | 4 |

## Last 7 days

110 sessions.

**Ran to an end without a report:** 19 of 109 sessions whose last run the core recorded as `completed` — 17.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**241,765,653 tokens** over 142 runs that reported them, **98.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,062,161 | 4,544,302 | 8,400,110 | 8,676,293 | 241,765,653 |
| messages per session | 101 | 283 | 445 | 731 | 15,180 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 54 | 49.1% |
| `atomaton` | 32 | 29.1% |
| `engineer` | 24 | 21.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,113 | 11 | 0 | 0.5% |
| `bash` | 1,968 | 27 | 30 | 1.4% |
| `grep` | 1,531 | 43 | 0 | 2.8% |
| `edit` | 880 | 18 | 0 | 2% |
| `fetch` | 207 | 12 | 0 | 5.8% |
| `get_pr` | 138 | 4 | 0 | 2.9% |
| `get_issue` | 135 | 0 | 4 | 0% |
| `get_issue_comments` | 130 | 0 | 2 | 0% |
| `get_check_runs` | 121 | 6 | 0 | 5% |
| `glob` | 116 | 0 | 0 | 0% |
| `list` | 96 | 2 | 0 | 2.1% |
| `check_merge_readiness` | 92 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 90 | 0 | 0 | 0% |
| `get_branch` | 80 | 0 | 0 | 0% |
| `commit_and_push` | 73 | 6 | 0 | 8.2% |
| `get_pr_diff` | 64 | 2 | 0 | 3.1% |
| `create_pr` | 62 | 18 | 0 | 29% |
| `write` | 53 | 0 | 0 | 0% |
| `request_close_issue` | 44 | 1 | 0 | 2.3% |
| `list_prs` | 27 | 0 | 0 | 0% |
| `search_issues` | 25 | 0 | 1 | 0% |
| `merge_pr` | 19 | 0 | 0 | 0% |
| `create_root_issue` | 17 | 1 | 0 | 5.9% |
| `delegate` | 16 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 5 | 0 | 31.3% |
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
| `other` | 1,282 | 65.1% |
| `search` | 241 | 12.2% |
| `verify` | 186 | 9.5% |
| `edit` | 167 | 8.5% |
| `open` | 92 | 4.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 95.7% |
| `delivery/pipeline-setup` | 2 | 2.2% |
| `engineering/secrets-in-a-check` | 1 | 1.1% |
| `research/web-search` | 1 | 1.1% |

## Last 30 days

161 sessions.

**Ran to an end without a report:** 34 of 158 sessions whose last run the core recorded as `completed` — 21.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**590,674,649 tokens** over 201 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,396,082 | 5,758,740 | 28,119,706 | 73,718,100 | 590,674,649 |
| messages per session | 119 | 350 | 715 | 731 | 27,237 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 69 | 42.9% |
| `atomaton` | 54 | 33.5% |
| `engineer` | 38 | 23.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,597 | 21 | 4 | 0.6% |
| `bash` | 3,336 | 60 | 61 | 1.8% |
| `grep` | 2,603 | 61 | 7 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,247 | 21 | 0 | 1.7% |
| `fetch` | 427 | 39 | 0 | 9.1% |
| `get_issue` | 245 | 13 | 4 | 5.3% |
| `list` | 234 | 3 | 0 | 1.3% |
| `get_issue_comments` | 217 | 0 | 10 | 0% |
| `get_pr` | 189 | 9 | 0 | 4.8% |
| `glob` | 172 | 1 | 1 | 0.6% |
| `get_check_runs` | 171 | 8 | 0 | 4.7% |
| `atoma_builtin__load_skill` | 148 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 133 | 0 | 0 | 0% |
| `check_merge_readiness` | 112 | 0 | 0 | 0% |
| `write` | 103 | 0 | 0 | 0% |
| `search_issues` | 94 | 0 | 3 | 0% |
| `commit_and_push` | 88 | 8 | 0 | 9.1% |
| `get_pr_diff` | 82 | 3 | 0 | 3.7% |
| `create_pr` | 81 | 27 | 0 | 33.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 51 | 1 | 0 | 2% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `merge_pr` | 25 | 0 | 0 | 0% |
| `get_pr_reviews` | 22 | 0 | 0 | 0% |
| `search_code` | 22 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
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
| `other` | 2,307 | 69.2% |
| `search` | 386 | 11.6% |
| `edit` | 269 | 8.1% |
| `verify` | 224 | 6.7% |
| `open` | 150 | 4.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 131 | 87.3% |
| `delivery/pipeline-setup` | 7 | 4.7% |
| `engineering/environment` | 6 | 4% |
| `engineering/secrets-in-a-check` | 3 | 2% |
| `research/web-search` | 2 | 1.3% |
| `docs/design-doc` | 1 | 0.7% |

## Last year

161 sessions.

**Ran to an end without a report:** 34 of 158 sessions whose last run the core recorded as `completed` — 21.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**590,674,649 tokens** over 201 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,396,082 | 5,758,740 | 28,119,706 | 73,718,100 | 590,674,649 |
| messages per session | 119 | 350 | 715 | 731 | 27,237 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 69 | 42.9% |
| `atomaton` | 54 | 33.5% |
| `engineer` | 38 | 23.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,597 | 21 | 4 | 0.6% |
| `bash` | 3,336 | 60 | 61 | 1.8% |
| `grep` | 2,603 | 61 | 7 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,247 | 21 | 0 | 1.7% |
| `fetch` | 427 | 39 | 0 | 9.1% |
| `get_issue` | 245 | 13 | 4 | 5.3% |
| `list` | 234 | 3 | 0 | 1.3% |
| `get_issue_comments` | 217 | 0 | 10 | 0% |
| `get_pr` | 189 | 9 | 0 | 4.8% |
| `glob` | 172 | 1 | 1 | 0.6% |
| `get_check_runs` | 171 | 8 | 0 | 4.7% |
| `atoma_builtin__load_skill` | 148 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 133 | 0 | 0 | 0% |
| `check_merge_readiness` | 112 | 0 | 0 | 0% |
| `write` | 103 | 0 | 0 | 0% |
| `search_issues` | 94 | 0 | 3 | 0% |
| `commit_and_push` | 88 | 8 | 0 | 9.1% |
| `get_pr_diff` | 82 | 3 | 0 | 3.7% |
| `create_pr` | 81 | 27 | 0 | 33.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 51 | 1 | 0 | 2% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `merge_pr` | 25 | 0 | 0 | 0% |
| `get_pr_reviews` | 22 | 0 | 0 | 0% |
| `search_code` | 22 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
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
| `other` | 2,307 | 69.2% |
| `search` | 386 | 11.6% |
| `edit` | 269 | 8.1% |
| `verify` | 224 | 6.7% |
| `open` | 150 | 4.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 131 | 87.3% |
| `delivery/pipeline-setup` | 7 | 4.7% |
| `engineering/environment` | 6 | 4% |
| `engineering/secrets-in-a-check` | 3 | 2% |
| `research/web-search` | 2 | 1.3% |
| `docs/design-doc` | 1 | 0.7% |

## All time

163 sessions.

**Ran to an end without a report:** 34 of 158 sessions whose last run the core recorded as `completed` — 21.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**590,674,649 tokens** over 201 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,396,082 | 5,758,740 | 28,119,706 | 73,718,100 | 590,674,649 |
| messages per session | 117 | 350 | 715 | 731 | 27,241 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 69 | 42.3% |
| `atomaton` | 56 | 34.4% |
| `engineer` | 38 | 23.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,597 | 21 | 4 | 0.6% |
| `bash` | 3,336 | 60 | 61 | 1.8% |
| `grep` | 2,603 | 61 | 7 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,247 | 21 | 0 | 1.7% |
| `fetch` | 427 | 39 | 0 | 9.1% |
| `get_issue` | 245 | 13 | 4 | 5.3% |
| `list` | 234 | 3 | 0 | 1.3% |
| `get_issue_comments` | 217 | 0 | 10 | 0% |
| `get_pr` | 189 | 9 | 0 | 4.8% |
| `glob` | 172 | 1 | 1 | 0.6% |
| `get_check_runs` | 171 | 8 | 0 | 4.7% |
| `atoma_builtin__load_skill` | 148 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 133 | 0 | 0 | 0% |
| `check_merge_readiness` | 112 | 0 | 0 | 0% |
| `write` | 103 | 0 | 0 | 0% |
| `search_issues` | 94 | 0 | 3 | 0% |
| `commit_and_push` | 88 | 8 | 0 | 9.1% |
| `get_pr_diff` | 82 | 3 | 0 | 3.7% |
| `create_pr` | 81 | 27 | 0 | 33.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 51 | 1 | 0 | 2% |
| `list_prs` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `merge_pr` | 25 | 0 | 0 | 0% |
| `get_pr_reviews` | 22 | 0 | 0 | 0% |
| `search_code` | 22 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
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
| `other` | 2,307 | 69.2% |
| `search` | 386 | 11.6% |
| `edit` | 269 | 8.1% |
| `verify` | 224 | 6.7% |
| `open` | 150 | 4.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 131 | 87.3% |
| `delivery/pipeline-setup` | 7 | 4.7% |
| `engineering/environment` | 6 | 4% |
| `engineering/secrets-in-a-check` | 3 | 2% |
| `research/web-search` | 2 | 1.3% |
| `docs/design-doc` | 1 | 0.7% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
