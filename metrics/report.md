# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-22.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 135 | 7.4% | 383 | 9,859 | 15 | 27.0 |
| Last 30 days | 200 | 7% | 529 | 10,246 | 20 | 30.3 |
| Last year | 200 | 7% | 529 | 10,246 | 20 | 30.3 |
| All time | 200 | 7% | 529 | 10,246 | 20 | 30.3 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 186 |
| `failed` | 11 |
| `stopped` | 3 |

## Last 7 days

55 sessions.

**Ran to an end without a report:** 12 of 54 sessions whose last run the core recorded as `completed` — 22.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**163,186,119 tokens** over 77 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,032,533 | 5,619,407 | 39,097,860 | 39,097,860 | 163,186,119 |
| messages per session | 135 | 350 | 571 | 571 | 9,539 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 28 | 50.9% |
| `reviewer` | 21 | 38.2% |
| `engineer` | 6 | 10.9% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,405 | 10 | 0 | 0.7% |
| `bash` | 1,227 | 18 | 19 | 1.5% |
| `grep` | 993 | 17 | 0 | 1.7% |
| `edit` | 598 | 7 | 0 | 1.2% |
| `fetch` | 217 | 32 | 0 | 14.7% |
| `get_issue` | 140 | 13 | 4 | 9.3% |
| `list` | 86 | 0 | 0 | 0% |
| `get_issue_comments` | 80 | 0 | 2 | 0% |
| `glob` | 76 | 1 | 0 | 1.3% |
| `get_pr` | 67 | 5 | 0 | 7.5% |
| `search_issues` | 66 | 0 | 0 | 0% |
| `get_check_runs` | 63 | 1 | 0 | 1.6% |
| `atoma_builtin__load_skill` | 47 | 0 | 0 | 0% |
| `get_branch` | 47 | 0 | 0 | 0% |
| `create_pr` | 37 | 16 | 0 | 43.2% |
| `commit_and_push` | 34 | 3 | 0 | 8.8% |
| `check_merge_readiness` | 31 | 0 | 0 | 0% |
| `get_pr_diff` | 29 | 2 | 0 | 6.9% |
| `request_close_issue` | 22 | 0 | 0 | 0% |
| `write` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 15 | 4 | 0 | 26.7% |
| `search_code` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `delegate_readonly` | 13 | 0 | 0 | 0% |
| `list_prs` | 11 | 0 | 0 | 0% |
| `delegate` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `get_pr_reviews` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 2 | 0 | 33.3% |
| `list_issues` | 6 | 0 | 0 | 0% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `create_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 4 | 0 | 1 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 2 | 0 | 50% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 696 | 56.7% |
| `search` | 241 | 19.6% |
| `verify` | 136 | 11.1% |
| `edit` | 84 | 6.8% |
| `open` | 70 | 5.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 45 | 95.7% |
| `delivery/pipeline-setup` | 1 | 2.1% |
| `research/web-search` | 1 | 2.1% |

## Last 30 days

91 sessions.

**Ran to an end without a report:** 23 of 89 sessions whose last run the core recorded as `completed` — 25.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**432,589,524 tokens** over 112 runs that reported them, **97.3% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,413,053 | 6,743,981 | 39,097,860 | 73,718,100 | 432,589,524 |
| messages per session | 152 | 445 | 715 | 715 | 18,452 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 43 | 47.3% |
| `reviewer` | 31 | 34.1% |
| `engineer` | 17 | 18.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,454 | 17 | 4 | 0.7% |
| `bash` | 2,076 | 42 | 44 | 2% |
| `grep` | 1,685 | 29 | 7 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 810 | 8 | 0 | 1% |
| `fetch` | 319 | 35 | 0 | 11% |
| `list` | 191 | 1 | 0 | 0.5% |
| `get_issue` | 179 | 13 | 4 | 7.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 133 | 0 | 10 | 0% |
| `glob` | 121 | 1 | 1 | 0.8% |
| `get_pr` | 101 | 9 | 0 | 8.9% |
| `atoma_builtin__load_skill` | 93 | 0 | 0 | 0% |
| `get_check_runs` | 92 | 3 | 0 | 3.3% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `get_branch` | 86 | 0 | 0 | 0% |
| `write` | 71 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 46 | 19 | 0 | 41.3% |
| `check_merge_readiness` | 45 | 0 | 0 | 0% |
| `commit_and_push` | 43 | 5 | 0 | 11.6% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_diff` | 41 | 3 | 0 | 7.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 26 | 0 | 0 | 0% |
| `list_prs` | 24 | 0 | 0 | 0% |
| `delegate_readonly` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_code` | 18 | 0 | 0 | 0% |
| `search_remote_code` | 18 | 5 | 0 | 27.8% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate_readonly_large` | 6 | 0 | 3 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
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
| `other` | 1,319 | 63.5% |
| `search` | 317 | 15.3% |
| `edit` | 164 | 7.9% |
| `verify` | 160 | 7.7% |
| `open` | 116 | 5.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 76 | 81.7% |
| `delivery/pipeline-setup` | 6 | 6.5% |
| `engineering/environment` | 6 | 6.5% |
| `engineering/secrets-in-a-check` | 2 | 2.2% |
| `research/web-search` | 2 | 2.2% |
| `docs/design-doc` | 1 | 1.1% |

## Last year

91 sessions.

**Ran to an end without a report:** 23 of 89 sessions whose last run the core recorded as `completed` — 25.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**432,589,524 tokens** over 112 runs that reported them, **97.3% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,413,053 | 6,743,981 | 39,097,860 | 73,718,100 | 432,589,524 |
| messages per session | 152 | 445 | 715 | 715 | 18,452 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 43 | 47.3% |
| `reviewer` | 31 | 34.1% |
| `engineer` | 17 | 18.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,454 | 17 | 4 | 0.7% |
| `bash` | 2,076 | 42 | 44 | 2% |
| `grep` | 1,685 | 29 | 7 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 810 | 8 | 0 | 1% |
| `fetch` | 319 | 35 | 0 | 11% |
| `list` | 191 | 1 | 0 | 0.5% |
| `get_issue` | 179 | 13 | 4 | 7.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 133 | 0 | 10 | 0% |
| `glob` | 121 | 1 | 1 | 0.8% |
| `get_pr` | 101 | 9 | 0 | 8.9% |
| `atoma_builtin__load_skill` | 93 | 0 | 0 | 0% |
| `get_check_runs` | 92 | 3 | 0 | 3.3% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `get_branch` | 86 | 0 | 0 | 0% |
| `write` | 71 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 46 | 19 | 0 | 41.3% |
| `check_merge_readiness` | 45 | 0 | 0 | 0% |
| `commit_and_push` | 43 | 5 | 0 | 11.6% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_diff` | 41 | 3 | 0 | 7.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 26 | 0 | 0 | 0% |
| `list_prs` | 24 | 0 | 0 | 0% |
| `delegate_readonly` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_code` | 18 | 0 | 0 | 0% |
| `search_remote_code` | 18 | 5 | 0 | 27.8% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate_readonly_large` | 6 | 0 | 3 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
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
| `other` | 1,319 | 63.5% |
| `search` | 317 | 15.3% |
| `edit` | 164 | 7.9% |
| `verify` | 160 | 7.7% |
| `open` | 116 | 5.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 76 | 81.7% |
| `delivery/pipeline-setup` | 6 | 6.5% |
| `engineering/environment` | 6 | 6.5% |
| `engineering/secrets-in-a-check` | 2 | 2.2% |
| `research/web-search` | 2 | 2.2% |
| `docs/design-doc` | 1 | 1.1% |

## All time

91 sessions.

**Ran to an end without a report:** 23 of 89 sessions whose last run the core recorded as `completed` — 25.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**432,589,524 tokens** over 112 runs that reported them, **97.3% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,413,053 | 6,743,981 | 39,097,860 | 73,718,100 | 432,589,524 |
| messages per session | 152 | 445 | 715 | 715 | 18,452 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 43 | 47.3% |
| `reviewer` | 31 | 34.1% |
| `engineer` | 17 | 18.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,454 | 17 | 4 | 0.7% |
| `bash` | 2,076 | 42 | 44 | 2% |
| `grep` | 1,685 | 29 | 7 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 810 | 8 | 0 | 1% |
| `fetch` | 319 | 35 | 0 | 11% |
| `list` | 191 | 1 | 0 | 0.5% |
| `get_issue` | 179 | 13 | 4 | 7.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 133 | 0 | 10 | 0% |
| `glob` | 121 | 1 | 1 | 0.8% |
| `get_pr` | 101 | 9 | 0 | 8.9% |
| `atoma_builtin__load_skill` | 93 | 0 | 0 | 0% |
| `get_check_runs` | 92 | 3 | 0 | 3.3% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `get_branch` | 86 | 0 | 0 | 0% |
| `write` | 71 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 46 | 19 | 0 | 41.3% |
| `check_merge_readiness` | 45 | 0 | 0 | 0% |
| `commit_and_push` | 43 | 5 | 0 | 11.6% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_diff` | 41 | 3 | 0 | 7.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 26 | 0 | 0 | 0% |
| `list_prs` | 24 | 0 | 0 | 0% |
| `delegate_readonly` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_code` | 18 | 0 | 0 | 0% |
| `search_remote_code` | 18 | 5 | 0 | 27.8% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate_readonly_large` | 6 | 0 | 3 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
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
| `other` | 1,319 | 63.5% |
| `search` | 317 | 15.3% |
| `edit` | 164 | 7.9% |
| `verify` | 160 | 7.7% |
| `open` | 116 | 5.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 76 | 81.7% |
| `delivery/pipeline-setup` | 6 | 6.5% |
| `engineering/environment` | 6 | 6.5% |
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
