# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-27.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 106 | 25.5% | 42 | 1,230 | 8 | 6.9 |
| Last 30 days | 463 | 13% | 246 | 6,099 | 11 | 20.2 |
| Last year | 889 | 9.6% | 253 | 10,246 | 13 | 18.9 |
| All time | 889 | 9.6% | 253 | 10,246 | 13 | 18.9 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 804 |
| `failed` | 74 |
| `stopped` | 11 |

## Last 7 days

38 sessions.

**Ran to an end without a report:** 13 of 38 sessions whose last run the core recorded as `completed` — 34.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**63,759,067 tokens** over 42 runs that reported them, **98.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 663,589 | 3,832,760 | 7,840,910 | 7,840,910 | 63,759,067 |
| messages per session | 103 | 219 | 293 | 293 | 4,418 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 19 | 50% |
| `reviewer` | 15 | 39.5% |
| `atomaton` | 4 | 10.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 801 | 16 | 2 | 2% |
| `read` | 610 | 6 | 0 | 1% |
| `grep` | 349 | 5 | 0 | 1.4% |
| `edit` | 183 | 11 | 0 | 6% |
| `fetch` | 37 | 1 | 0 | 2.7% |
| `list` | 37 | 0 | 0 | 0% |
| `load_skill` | 31 | 0 | 0 | 0% |
| `get_issue_comments` | 28 | 0 | 0 | 0% |
| `get_check_runs` | 26 | 0 | 0 | 0% |
| `check_merge_readiness` | 24 | 0 | 0 | 0% |
| `commit_and_push` | 24 | 1 | 0 | 4.2% |
| `create_pr` | 24 | 7 | 0 | 29.2% |
| `get_pr` | 24 | 0 | 0 | 0% |
| `write` | 24 | 0 | 0 | 0% |
| `glob` | 20 | 0 | 0 | 0% |
| `request_close_issue` | 15 | 0 | 0 | 0% |
| `get_pr_reviews` | 14 | 0 | 0 | 0% |
| `get_issue` | 13 | 0 | 0 | 0% |
| `search_issues` | 13 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 9 | 0 | 0 | 0% |
| `get_branch` | 8 | 0 | 0 | 0% |
| `get_pr_diff` | 8 | 0 | 0 | 0% |
| `search_code` | 7 | 0 | 0 | 0% |
| `search_remote_code` | 5 | 3 | 0 | 60% |
| `create_root_issue` | 3 | 0 | 0 | 0% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 0 | 0% |
| `list_prs` | 2 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 611 | 76.3% |
| `edit` | 147 | 18.4% |
| `search` | 24 | 3% |
| `open` | 13 | 1.6% |
| `verify` | 6 | 0.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 15 | 48.4% |
| `conventions` | 8 | 25.8% |
| `japanese` | 5 | 16.1% |
| `research/web-search` | 2 | 6.5% |
| `on-demand-audit` | 1 | 3.2% |

## Last 30 days

154 sessions.

**Ran to an end without a report:** 26 of 147 sessions whose last run the core recorded as `completed` — 17.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**539,271,651 tokens** over 203 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.6% of that prompt was served from cache**, over the 201 of 203 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,279,746 | 7,840,910 | 20,308,488 | 29,805,044 | 539,271,651 |
| messages per session | 151 | 334 | 425 | 439 | 25,255 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 63 | 40.9% |
| `reviewer` | 60 | 39% |
| `atomaton` | 30 | 19.5% |
| `architect` | 1 | 0.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,875 | 114 | 59 | 2.3% |
| `read` | 2,860 | 17 | 0 | 0.6% |
| `grep` | 2,393 | 52 | 13 | 2.2% |
| `edit` | 845 | 22 | 0 | 2.6% |
| `fetch` | 653 | 60 | 0 | 9.2% |
| `list` | 169 | 2 | 0 | 1.2% |
| `glob` | 165 | 0 | 0 | 0% |
| `get_pr` | 158 | 0 | 0 | 0% |
| `get_check_runs` | 153 | 3 | 0 | 2% |
| `get_issue_comments` | 136 | 0 | 0 | 0% |
| `commit_and_push` | 113 | 2 | 0 | 1.8% |
| `load_skill` | 113 | 7 | 0 | 6.2% |
| `write` | 111 | 1 | 0 | 0.9% |
| `get_issue` | 107 | 1 | 0 | 0.9% |
| `check_merge_readiness` | 103 | 0 | 0 | 0% |
| `create_pr` | 94 | 30 | 0 | 31.9% |
| `get_branch` | 70 | 0 | 0 | 0% |
| `get_pr_reviews` | 60 | 0 | 0 | 0% |
| `get_pr_diff` | 57 | 0 | 0 | 0% |
| `request_close_issue` | 55 | 0 | 0 | 0% |
| `list_pr_review_comments` | 42 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 40 | 1 | 0 | 2.5% |
| `merge_pr` | 39 | 0 | 0 | 0% |
| `search_issues` | 37 | 0 | 0 | 0% |
| `search_code` | 35 | 0 | 0 | 0% |
| `list_prs` | 25 | 0 | 0 | 0% |
| `search_remote_code` | 25 | 11 | 0 | 44% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 13 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `delegate_readonly` | 11 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `delegate_large` | 5 | 0 | 0 | 0% |
| `list_issues` | 5 | 0 | 0 | 0% |
| `sync_branch` | 5 | 4 | 0 | 80% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `delegate_readonly_large` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,101 | 84.1% |
| `edit` | 472 | 9.7% |
| `search` | 156 | 3.2% |
| `open` | 123 | 2.5% |
| `verify` | 23 | 0.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 57.5% |
| `writing/japanese` | 33 | 21.6% |
| `conventions` | 8 | 5.2% |
| `research/web-search` | 8 | 5.2% |
| `japanese` | 5 | 3.3% |
| `delivery/pipeline-setup` | 3 | 2% |
| `docs/customer-doc` | 3 | 2% |
| `engineering/secrets-in-a-check` | 3 | 2% |
| `engineering/environment` | 1 | 0.7% |
| `on-demand-audit` | 1 | 0.7% |

## Last year

340 sessions.

**Ran to an end without a report:** 68 of 327 sessions whose last run the core recorded as `completed` — 20.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,175,381,164 tokens** over 434 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the 432 of 434 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,279,746 | 6,099,372 | 27,846,035 | 73,718,100 | 1,175,381,164 |
| messages per session | 129 | 331 | 583 | 731 | 55,977 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 139 | 40.9% |
| `engineer` | 116 | 34.1% |
| `atomaton` | 84 | 24.7% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,077 | 184 | 128 | 2% |
| `read` | 6,772 | 38 | 8 | 0.6% |
| `grep` | 5,134 | 117 | 21 | 2.3% |
| `edit` | 2,343 | 46 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,079 | 99 | 0 | 9.2% |
| `list` | 407 | 5 | 0 | 1.2% |
| `get_issue_comments` | 383 | 0 | 10 | 0% |
| `get_issue` | 377 | 14 | 5 | 3.7% |
| `get_pr` | 374 | 9 | 3 | 2.4% |
| `get_check_runs` | 365 | 13 | 0 | 3.6% |
| `glob` | 339 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 231 | 0 | 0 | 0% |
| `write` | 223 | 2 | 0 | 0.9% |
| `commit_and_push` | 220 | 10 | 0 | 4.5% |
| `get_branch` | 213 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 194 | 62 | 0 | 32% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 147 | 3 | 0 | 2% |
| `search_issues` | 145 | 0 | 3 | 0% |
| `request_close_issue` | 118 | 1 | 0 | 0.8% |
| `load_skill` | 115 | 9 | 0 | 7.8% |
| `get_pr_reviews` | 96 | 0 | 0 | 0% |
| `merge_pr` | 75 | 0 | 0 | 0% |
| `list_pr_review_comments` | 71 | 0 | 0 | 0% |
| `list_prs` | 69 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_code` | 59 | 0 | 0 | 0% |
| `search_remote_code` | 48 | 17 | 0 | 35.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 36 | 1 | 0 | 2.8% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `delegate_readonly` | 32 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 18 | 0 | 0 | 0% |
| `sync_branch` | 16 | 7 | 0 | 43.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `delegate_readonly_large` | 9 | 0 | 3 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `merge_base_into_branch` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 7,224 | 79.6% |
| `edit` | 779 | 8.6% |
| `search` | 551 | 6.1% |
| `open` | 276 | 3% |
| `verify` | 247 | 2.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 74.2% |
| `writing/japanese` | 33 | 10.2% |
| `delivery/pipeline-setup` | 10 | 3.1% |
| `research/web-search` | 10 | 3.1% |
| `conventions` | 8 | 2.5% |
| `engineering/environment` | 7 | 2.2% |
| `engineering/secrets-in-a-check` | 6 | 1.8% |
| `japanese` | 5 | 1.5% |
| `docs/customer-doc` | 3 | 0.9% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |

## All time

359 sessions.

**Ran to an end without a report:** 68 of 327 sessions whose last run the core recorded as `completed` — 20.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,175,381,164 tokens** over 434 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the 432 of 434 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,279,746 | 6,099,372 | 27,846,035 | 73,718,100 | 1,175,381,164 |
| messages per session | 120 | 328 | 583 | 731 | 56,101 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 145 | 40.4% |
| `engineer` | 126 | 35.1% |
| `atomaton` | 87 | 24.2% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,077 | 184 | 128 | 2% |
| `read` | 6,772 | 38 | 8 | 0.6% |
| `grep` | 5,134 | 117 | 21 | 2.3% |
| `edit` | 2,343 | 46 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,079 | 99 | 0 | 9.2% |
| `list` | 407 | 5 | 0 | 1.2% |
| `get_issue_comments` | 383 | 0 | 10 | 0% |
| `get_issue` | 377 | 14 | 5 | 3.7% |
| `get_pr` | 374 | 9 | 3 | 2.4% |
| `get_check_runs` | 365 | 13 | 0 | 3.6% |
| `glob` | 339 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 231 | 0 | 0 | 0% |
| `write` | 223 | 2 | 0 | 0.9% |
| `commit_and_push` | 220 | 10 | 0 | 4.5% |
| `get_branch` | 213 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 194 | 62 | 0 | 32% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 147 | 3 | 0 | 2% |
| `search_issues` | 145 | 0 | 3 | 0% |
| `request_close_issue` | 118 | 1 | 0 | 0.8% |
| `load_skill` | 115 | 9 | 0 | 7.8% |
| `get_pr_reviews` | 96 | 0 | 0 | 0% |
| `merge_pr` | 75 | 0 | 0 | 0% |
| `list_pr_review_comments` | 71 | 0 | 0 | 0% |
| `list_prs` | 69 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_code` | 59 | 0 | 0 | 0% |
| `search_remote_code` | 48 | 17 | 0 | 35.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 36 | 1 | 0 | 2.8% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `delegate_readonly` | 32 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 18 | 0 | 0 | 0% |
| `sync_branch` | 16 | 7 | 0 | 43.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `delegate_readonly_large` | 9 | 0 | 3 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `merge_base_into_branch` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 7,224 | 79.6% |
| `edit` | 779 | 8.6% |
| `search` | 551 | 6.1% |
| `open` | 276 | 3% |
| `verify` | 247 | 2.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 74.2% |
| `writing/japanese` | 33 | 10.2% |
| `delivery/pipeline-setup` | 10 | 3.1% |
| `research/web-search` | 10 | 3.1% |
| `conventions` | 8 | 2.5% |
| `engineering/environment` | 7 | 2.2% |
| `engineering/secrets-in-a-check` | 6 | 1.8% |
| `japanese` | 5 | 1.5% |
| `docs/customer-doc` | 3 | 0.9% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-10-25 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `agent-prompt-surface`
- `atomaton-surface`
- `customer-doc`
- `environment`
- `gh-actions-surface`
- `pipeline-setup`
- `secrets-in-a-check`
- `web-search`
