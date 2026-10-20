# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-20.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 94 | 9.6% | 521 | 9,859 | 15 | 39.2 |
| Last 30 days | 152 | 8.6% | 728 | 10,246 | 21 | 36.5 |
| Last year | 152 | 8.6% | 728 | 10,246 | 21 | 36.5 |
| All time | 152 | 8.6% | 728 | 10,246 | 21 | 36.5 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 139 |
| `failed` | 11 |
| `stopped` | 2 |

## Last 7 days

41 sessions.

**Ran to an end without a report:** 10 of 40 sessions whose last run the core recorded as `completed` — 25%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**117,454,362 tokens** over 50 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 886,875 | 5,758,740 | 39,097,860 | 39,097,860 | 117,454,362 |
| messages per session | 151 | 327 | 571 | 571 | 7,086 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 21 | 51.2% |
| `reviewer` | 14 | 34.1% |
| `engineer` | 6 | 14.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,018 | 10 | 0 | 1% |
| `bash` | 973 | 16 | 22 | 1.6% |
| `grep` | 726 | 14 | 3 | 1.9% |
| `edit` | 253 | 4 | 0 | 1.6% |
| `fetch` | 230 | 33 | 0 | 14.3% |
| `get_issue` | 134 | 13 | 2 | 9.7% |
| `get_issue_comments` | 94 | 0 | 8 | 0% |
| `list` | 73 | 0 | 0 | 0% |
| `search_issues` | 64 | 0 | 0 | 0% |
| `get_check_runs` | 49 | 1 | 0 | 2% |
| `get_pr` | 49 | 3 | 0 | 6.1% |
| `glob` | 46 | 1 | 1 | 2.2% |
| `get_branch` | 37 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 35 | 0 | 0 | 0% |
| `create_pr` | 28 | 15 | 0 | 53.6% |
| `commit_and_push` | 19 | 3 | 0 | 15.8% |
| `check_merge_readiness` | 18 | 0 | 0 | 0% |
| `get_pr_diff` | 15 | 0 | 0 | 0% |
| `request_close_issue` | 15 | 0 | 0 | 0% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
| `search_code` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `search_remote_code` | 13 | 4 | 0 | 30.8% |
| `create_issue` | 12 | 3 | 0 | 25% |
| `list_prs` | 11 | 0 | 0 | 0% |
| `write` | 11 | 0 | 0 | 0% |
| `get_pr_reviews` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `merge_pr` | 7 | 0 | 0 | 0% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `list_issues` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 2 | 0 | 50% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `delegate_readonly_large` | 3 | 0 | 2 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `close_issue` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 602 | 61.9% |
| `search` | 182 | 18.7% |
| `verify` | 80 | 8.2% |
| `edit` | 68 | 7% |
| `open` | 41 | 4.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 32 | 91.4% |
| `delivery/pipeline-setup` | 1 | 2.9% |
| `docs/design-doc` | 1 | 2.9% |
| `research/web-search` | 1 | 2.9% |

## Last 30 days

72 sessions.

**Ran to an end without a report:** 19 of 70 sessions whose last run the core recorded as `completed` — 27.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**372,732,182 tokens** over 81 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,413,053 | 8,400,110 | 73,718,100 | 73,718,100 | 372,732,182 |
| messages per session | 162 | 463 | 715 | 715 | 15,261 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 34 | 47.2% |
| `reviewer` | 22 | 30.6% |
| `engineer` | 16 | 22.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,961 | 16 | 4 | 0.8% |
| `bash` | 1,743 | 40 | 41 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,329 | 25 | 7 | 1.9% |
| `edit` | 448 | 5 | 0 | 1.1% |
| `fetch` | 303 | 35 | 0 | 11.6% |
| `list` | 167 | 1 | 0 | 0.6% |
| `get_issue` | 158 | 13 | 2 | 8.2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 123 | 0 | 10 | 0% |
| `glob` | 85 | 1 | 1 | 1.2% |
| `search_issues` | 85 | 0 | 2 | 0% |
| `atoma_builtin__load_skill` | 76 | 0 | 0 | 0% |
| `get_pr` | 72 | 6 | 0 | 8.3% |
| `get_check_runs` | 68 | 3 | 0 | 4.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_branch` | 67 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 59 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_pr` | 34 | 17 | 0 | 50% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `check_merge_readiness` | 27 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `commit_and_push` | 26 | 5 | 0 | 19.2% |
| `get_pr_diff` | 24 | 1 | 0 | 4.2% |
| `list_prs` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `request_close_issue` | 18 | 0 | 0 | 0% |
| `delegate_readonly` | 17 | 0 | 0 | 0% |
| `search_code` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `get_pr_reviews` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `search_remote_code` | 14 | 5 | 0 | 35.7% |
| `list_pr_review_comments` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `sync_branch` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_readonly_large` | 4 | 0 | 3 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
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
| `other` | 1,198 | 68.7% |
| `search` | 226 | 13% |
| `edit` | 146 | 8.4% |
| `verify` | 93 | 5.3% |
| `open` | 80 | 4.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 59 | 77.6% |
| `delivery/pipeline-setup` | 6 | 7.9% |
| `engineering/environment` | 6 | 7.9% |
| `engineering/secrets-in-a-check` | 2 | 2.6% |
| `research/web-search` | 2 | 2.6% |
| `docs/design-doc` | 1 | 1.3% |

## Last year

72 sessions.

**Ran to an end without a report:** 19 of 70 sessions whose last run the core recorded as `completed` — 27.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**372,732,182 tokens** over 81 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,413,053 | 8,400,110 | 73,718,100 | 73,718,100 | 372,732,182 |
| messages per session | 162 | 463 | 715 | 715 | 15,261 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 34 | 47.2% |
| `reviewer` | 22 | 30.6% |
| `engineer` | 16 | 22.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,961 | 16 | 4 | 0.8% |
| `bash` | 1,743 | 40 | 41 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,329 | 25 | 7 | 1.9% |
| `edit` | 448 | 5 | 0 | 1.1% |
| `fetch` | 303 | 35 | 0 | 11.6% |
| `list` | 167 | 1 | 0 | 0.6% |
| `get_issue` | 158 | 13 | 2 | 8.2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 123 | 0 | 10 | 0% |
| `glob` | 85 | 1 | 1 | 1.2% |
| `search_issues` | 85 | 0 | 2 | 0% |
| `atoma_builtin__load_skill` | 76 | 0 | 0 | 0% |
| `get_pr` | 72 | 6 | 0 | 8.3% |
| `get_check_runs` | 68 | 3 | 0 | 4.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_branch` | 67 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 59 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_pr` | 34 | 17 | 0 | 50% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `check_merge_readiness` | 27 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `commit_and_push` | 26 | 5 | 0 | 19.2% |
| `get_pr_diff` | 24 | 1 | 0 | 4.2% |
| `list_prs` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `request_close_issue` | 18 | 0 | 0 | 0% |
| `delegate_readonly` | 17 | 0 | 0 | 0% |
| `search_code` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `get_pr_reviews` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `search_remote_code` | 14 | 5 | 0 | 35.7% |
| `list_pr_review_comments` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `sync_branch` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_readonly_large` | 4 | 0 | 3 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
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
| `other` | 1,198 | 68.7% |
| `search` | 226 | 13% |
| `edit` | 146 | 8.4% |
| `verify` | 93 | 5.3% |
| `open` | 80 | 4.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 59 | 77.6% |
| `delivery/pipeline-setup` | 6 | 7.9% |
| `engineering/environment` | 6 | 7.9% |
| `engineering/secrets-in-a-check` | 2 | 2.6% |
| `research/web-search` | 2 | 2.6% |
| `docs/design-doc` | 1 | 1.3% |

## All time

72 sessions.

**Ran to an end without a report:** 19 of 70 sessions whose last run the core recorded as `completed` — 27.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**372,732,182 tokens** over 81 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,413,053 | 8,400,110 | 73,718,100 | 73,718,100 | 372,732,182 |
| messages per session | 162 | 463 | 715 | 715 | 15,261 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 34 | 47.2% |
| `reviewer` | 22 | 30.6% |
| `engineer` | 16 | 22.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,961 | 16 | 4 | 0.8% |
| `bash` | 1,743 | 40 | 41 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,329 | 25 | 7 | 1.9% |
| `edit` | 448 | 5 | 0 | 1.1% |
| `fetch` | 303 | 35 | 0 | 11.6% |
| `list` | 167 | 1 | 0 | 0.6% |
| `get_issue` | 158 | 13 | 2 | 8.2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 123 | 0 | 10 | 0% |
| `glob` | 85 | 1 | 1 | 1.2% |
| `search_issues` | 85 | 0 | 2 | 0% |
| `atoma_builtin__load_skill` | 76 | 0 | 0 | 0% |
| `get_pr` | 72 | 6 | 0 | 8.3% |
| `get_check_runs` | 68 | 3 | 0 | 4.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_branch` | 67 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 59 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_pr` | 34 | 17 | 0 | 50% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `check_merge_readiness` | 27 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `commit_and_push` | 26 | 5 | 0 | 19.2% |
| `get_pr_diff` | 24 | 1 | 0 | 4.2% |
| `list_prs` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `request_close_issue` | 18 | 0 | 0 | 0% |
| `delegate_readonly` | 17 | 0 | 0 | 0% |
| `search_code` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `get_pr_reviews` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `search_remote_code` | 14 | 5 | 0 | 35.7% |
| `list_pr_review_comments` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `sync_branch` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_readonly_large` | 4 | 0 | 3 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
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
| `other` | 1,198 | 68.7% |
| `search` | 226 | 13% |
| `edit` | 146 | 8.4% |
| `verify` | 93 | 5.3% |
| `open` | 80 | 4.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 59 | 77.6% |
| `delivery/pipeline-setup` | 6 | 7.9% |
| `engineering/environment` | 6 | 7.9% |
| `engineering/secrets-in-a-check` | 2 | 2.6% |
| `research/web-search` | 2 | 2.6% |
| `docs/design-doc` | 1 | 1.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
