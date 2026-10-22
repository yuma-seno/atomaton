# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-22.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 124 | 8.1% | 386 | 9,859 | 15 | 29.8 |
| Last 30 days | 189 | 7.4% | 542 | 10,246 | 21 | 30.5 |
| Last year | 189 | 7.4% | 542 | 10,246 | 21 | 30.5 |
| All time | 189 | 7.4% | 542 | 10,246 | 21 | 30.5 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 175 |
| `failed` | 11 |
| `stopped` | 3 |

## Last 7 days

52 sessions.

**Ran to an end without a report:** 12 of 51 sessions whose last run the core recorded as `completed` — 23.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**147,377,210 tokens** over 68 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,032,533 | 5,758,740 | 39,097,860 | 39,097,860 | 147,377,210 |
| messages per session | 141 | 327 | 571 | 571 | 9,064 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 27 | 51.9% |
| `reviewer` | 19 | 36.5% |
| `engineer` | 6 | 11.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,337 | 10 | 0 | 0.7% |
| `bash` | 1,197 | 19 | 21 | 1.6% |
| `grep` | 937 | 14 | 0 | 1.5% |
| `edit` | 558 | 7 | 0 | 1.3% |
| `fetch` | 210 | 32 | 0 | 15.2% |
| `get_issue` | 133 | 13 | 4 | 9.8% |
| `list` | 81 | 0 | 0 | 0% |
| `get_issue_comments` | 78 | 0 | 2 | 0% |
| `glob` | 67 | 1 | 0 | 1.5% |
| `search_issues` | 63 | 0 | 0 | 0% |
| `get_pr` | 61 | 5 | 0 | 8.2% |
| `get_check_runs` | 56 | 1 | 0 | 1.8% |
| `atoma_builtin__load_skill` | 44 | 0 | 0 | 0% |
| `get_branch` | 42 | 0 | 0 | 0% |
| `create_pr` | 36 | 17 | 0 | 47.2% |
| `commit_and_push` | 31 | 3 | 0 | 9.7% |
| `check_merge_readiness` | 25 | 0 | 0 | 0% |
| `get_pr_diff` | 23 | 2 | 0 | 8.7% |
| `request_close_issue` | 21 | 0 | 0 | 0% |
| `write` | 20 | 0 | 0 | 0% |
| `search_code` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `delegate_readonly` | 13 | 0 | 0 | 0% |
| `search_remote_code` | 13 | 4 | 0 | 30.8% |
| `delegate` | 10 | 0 | 0 | 0% |
| `list_prs` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `get_pr_reviews` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 2 | 0 | 33.3% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `create_issue` | 5 | 0 | 0 | 0% |
| `list_issues` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 2 | 0 | 50% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `delegate_readonly_large` | 3 | 0 | 1 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 688 | 57.5% |
| `search` | 232 | 19.4% |
| `verify` | 128 | 10.7% |
| `edit` | 83 | 6.9% |
| `open` | 66 | 5.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 42 | 95.5% |
| `delivery/pipeline-setup` | 1 | 2.3% |
| `research/web-search` | 1 | 2.3% |

## Last 30 days

88 sessions.

**Ran to an end without a report:** 23 of 86 sessions whose last run the core recorded as `completed` — 26.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**416,780,615 tokens** over 103 runs that reported them, **97.3% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,413,053 | 7,169,420 | 39,097,860 | 73,718,100 | 416,780,615 |
| messages per session | 157 | 450 | 715 | 715 | 17,977 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 42 | 47.7% |
| `reviewer` | 29 | 33% |
| `engineer` | 17 | 19.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,386 | 17 | 4 | 0.7% |
| `bash` | 2,046 | 43 | 46 | 2.1% |
| `grep` | 1,629 | 26 | 7 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 770 | 8 | 0 | 1% |
| `fetch` | 312 | 35 | 0 | 11.2% |
| `list` | 186 | 1 | 0 | 0.5% |
| `get_issue` | 172 | 13 | 4 | 7.6% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 131 | 0 | 10 | 0% |
| `glob` | 112 | 1 | 1 | 0.9% |
| `get_pr` | 95 | 9 | 0 | 9.5% |
| `atoma_builtin__load_skill` | 90 | 0 | 0 | 0% |
| `search_issues` | 87 | 0 | 2 | 0% |
| `get_check_runs` | 85 | 3 | 0 | 3.5% |
| `get_branch` | 81 | 0 | 0 | 0% |
| `write` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 45 | 20 | 0 | 44.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `commit_and_push` | 40 | 5 | 0 | 12.5% |
| `check_merge_readiness` | 39 | 0 | 0 | 0% |
| `get_pr_diff` | 35 | 3 | 0 | 8.6% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 25 | 0 | 0 | 0% |
| `list_prs` | 23 | 0 | 0 | 0% |
| `delegate_readonly` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_code` | 18 | 0 | 0 | 0% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 5 | 0 | 31.3% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `list_issues` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 3 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
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
| `other` | 1,311 | 64.1% |
| `search` | 308 | 15.1% |
| `edit` | 163 | 8% |
| `verify` | 152 | 7.4% |
| `open` | 112 | 5.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 73 | 81.1% |
| `delivery/pipeline-setup` | 6 | 6.7% |
| `engineering/environment` | 6 | 6.7% |
| `engineering/secrets-in-a-check` | 2 | 2.2% |
| `research/web-search` | 2 | 2.2% |
| `docs/design-doc` | 1 | 1.1% |

## Last year

88 sessions.

**Ran to an end without a report:** 23 of 86 sessions whose last run the core recorded as `completed` — 26.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**416,780,615 tokens** over 103 runs that reported them, **97.3% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,413,053 | 7,169,420 | 39,097,860 | 73,718,100 | 416,780,615 |
| messages per session | 157 | 450 | 715 | 715 | 17,977 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 42 | 47.7% |
| `reviewer` | 29 | 33% |
| `engineer` | 17 | 19.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,386 | 17 | 4 | 0.7% |
| `bash` | 2,046 | 43 | 46 | 2.1% |
| `grep` | 1,629 | 26 | 7 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 770 | 8 | 0 | 1% |
| `fetch` | 312 | 35 | 0 | 11.2% |
| `list` | 186 | 1 | 0 | 0.5% |
| `get_issue` | 172 | 13 | 4 | 7.6% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 131 | 0 | 10 | 0% |
| `glob` | 112 | 1 | 1 | 0.9% |
| `get_pr` | 95 | 9 | 0 | 9.5% |
| `atoma_builtin__load_skill` | 90 | 0 | 0 | 0% |
| `search_issues` | 87 | 0 | 2 | 0% |
| `get_check_runs` | 85 | 3 | 0 | 3.5% |
| `get_branch` | 81 | 0 | 0 | 0% |
| `write` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 45 | 20 | 0 | 44.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `commit_and_push` | 40 | 5 | 0 | 12.5% |
| `check_merge_readiness` | 39 | 0 | 0 | 0% |
| `get_pr_diff` | 35 | 3 | 0 | 8.6% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 25 | 0 | 0 | 0% |
| `list_prs` | 23 | 0 | 0 | 0% |
| `delegate_readonly` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_code` | 18 | 0 | 0 | 0% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 5 | 0 | 31.3% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `list_issues` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 3 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
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
| `other` | 1,311 | 64.1% |
| `search` | 308 | 15.1% |
| `edit` | 163 | 8% |
| `verify` | 152 | 7.4% |
| `open` | 112 | 5.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 73 | 81.1% |
| `delivery/pipeline-setup` | 6 | 6.7% |
| `engineering/environment` | 6 | 6.7% |
| `engineering/secrets-in-a-check` | 2 | 2.2% |
| `research/web-search` | 2 | 2.2% |
| `docs/design-doc` | 1 | 1.1% |

## All time

88 sessions.

**Ran to an end without a report:** 23 of 86 sessions whose last run the core recorded as `completed` — 26.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**416,780,615 tokens** over 103 runs that reported them, **97.3% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,413,053 | 7,169,420 | 39,097,860 | 73,718,100 | 416,780,615 |
| messages per session | 157 | 450 | 715 | 715 | 17,977 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 42 | 47.7% |
| `reviewer` | 29 | 33% |
| `engineer` | 17 | 19.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,386 | 17 | 4 | 0.7% |
| `bash` | 2,046 | 43 | 46 | 2.1% |
| `grep` | 1,629 | 26 | 7 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 770 | 8 | 0 | 1% |
| `fetch` | 312 | 35 | 0 | 11.2% |
| `list` | 186 | 1 | 0 | 0.5% |
| `get_issue` | 172 | 13 | 4 | 7.6% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 131 | 0 | 10 | 0% |
| `glob` | 112 | 1 | 1 | 0.9% |
| `get_pr` | 95 | 9 | 0 | 9.5% |
| `atoma_builtin__load_skill` | 90 | 0 | 0 | 0% |
| `search_issues` | 87 | 0 | 2 | 0% |
| `get_check_runs` | 85 | 3 | 0 | 3.5% |
| `get_branch` | 81 | 0 | 0 | 0% |
| `write` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 45 | 20 | 0 | 44.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `commit_and_push` | 40 | 5 | 0 | 12.5% |
| `check_merge_readiness` | 39 | 0 | 0 | 0% |
| `get_pr_diff` | 35 | 3 | 0 | 8.6% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 25 | 0 | 0 | 0% |
| `list_prs` | 23 | 0 | 0 | 0% |
| `delegate_readonly` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_code` | 18 | 0 | 0 | 0% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 5 | 0 | 31.3% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `list_issues` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 3 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
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
| `other` | 1,311 | 64.1% |
| `search` | 308 | 15.1% |
| `edit` | 163 | 8% |
| `verify` | 152 | 7.4% |
| `open` | 112 | 5.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 73 | 81.1% |
| `delivery/pipeline-setup` | 6 | 6.7% |
| `engineering/environment` | 6 | 6.7% |
| `engineering/secrets-in-a-check` | 2 | 2.2% |
| `research/web-search` | 2 | 2.2% |
| `docs/design-doc` | 1 | 1.1% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
