# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-26.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 74 | 27% | 45 | 696 | 9 | 6.7 |
| Last 30 days | 429 | 12.4% | 255 | 6,099 | 11 | 21.2 |
| Last year | 855 | 9.1% | 257 | 10,246 | 14 | 19.0 |
| All time | 855 | 9.1% | 257 | 10,246 | 14 | 19.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 777 |
| `failed` | 67 |
| `stopped` | 11 |

## Last 7 days

29 sessions.

**Ran to an end without a report:** 9 of 27 sessions whose last run the core recorded as `completed` — 33.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**31,359,690 tokens** over 25 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 610,350 | 2,512,747 | 7,840,910 | 7,840,910 | 31,359,690 |
| messages per session | 83 | 186 | 219 | 219 | 2,822 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 15 | 51.7% |
| `reviewer` | 13 | 44.8% |
| `atomaton` | 1 | 3.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 463 | 7 | 2 | 1.5% |
| `read` | 440 | 2 | 0 | 0.5% |
| `grep` | 247 | 0 | 0 | 0% |
| `edit` | 87 | 4 | 0 | 4.6% |
| `fetch` | 37 | 1 | 0 | 2.7% |
| `list` | 31 | 0 | 0 | 0% |
| `load_skill` | 22 | 0 | 0 | 0% |
| `create_pr` | 20 | 6 | 0 | 30% |
| `get_check_runs` | 20 | 0 | 0 | 0% |
| `check_merge_readiness` | 19 | 0 | 0 | 0% |
| `get_pr` | 19 | 0 | 0 | 0% |
| `commit_and_push` | 18 | 1 | 0 | 5.6% |
| `glob` | 15 | 0 | 0 | 0% |
| `request_close_issue` | 13 | 0 | 0 | 0% |
| `get_pr_reviews` | 12 | 0 | 0 | 0% |
| `write` | 12 | 0 | 0 | 0% |
| `get_issue_comments` | 9 | 0 | 0 | 0% |
| `merge_pr` | 9 | 0 | 0 | 0% |
| `get_branch` | 8 | 0 | 0 | 0% |
| `list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `get_pr_diff` | 6 | 0 | 0 | 0% |
| `get_issue` | 5 | 0 | 0 | 0% |
| `search_remote_code` | 5 | 3 | 0 | 60% |
| `create_root_issue` | 3 | 0 | 0 | 0% |
| `search_issues` | 3 | 0 | 0 | 0% |
| `delegate_readonly` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 1 | 0 | 0 | 0% |
| `list_prs` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 378 | 81.6% |
| `edit` | 59 | 12.7% |
| `open` | 10 | 2.2% |
| `search` | 10 | 2.2% |
| `verify` | 6 | 1.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 15 | 68.2% |
| `conventions` | 4 | 18.2% |
| `research/web-search` | 2 | 9.1% |
| `writing/japanese` | 1 | 4.5% |

## Last 30 days

144 sessions.

**Ran to an end without a report:** 22 of 135 sessions whose last run the core recorded as `completed` — 16.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**506,185,194 tokens** over 184 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the 182 of 184 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,300,539 | 8,271,355 | 21,812,397 | 29,805,044 | 506,185,194 |
| messages per session | 144 | 339 | 425 | 439 | 23,601 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 59 | 41% |
| `reviewer` | 58 | 40.3% |
| `atomaton` | 26 | 18.1% |
| `architect` | 1 | 0.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,535 | 105 | 59 | 2.3% |
| `read` | 2,673 | 13 | 0 | 0.5% |
| `grep` | 2,282 | 47 | 13 | 2.1% |
| `edit` | 749 | 15 | 0 | 2% |
| `fetch` | 653 | 60 | 0 | 9.2% |
| `glob` | 160 | 0 | 0 | 0% |
| `list` | 155 | 2 | 0 | 1.3% |
| `get_pr` | 153 | 0 | 0 | 0% |
| `get_check_runs` | 147 | 3 | 0 | 2% |
| `get_issue_comments` | 116 | 0 | 0 | 0% |
| `commit_and_push` | 107 | 2 | 0 | 1.9% |
| `load_skill` | 103 | 7 | 0 | 6.8% |
| `write` | 99 | 1 | 0 | 1% |
| `check_merge_readiness` | 98 | 0 | 0 | 0% |
| `get_issue` | 97 | 1 | 0 | 1% |
| `create_pr` | 90 | 29 | 0 | 32.2% |
| `get_branch` | 70 | 0 | 0 | 0% |
| `get_pr_reviews` | 58 | 0 | 0 | 0% |
| `get_pr_diff` | 55 | 0 | 0 | 0% |
| `request_close_issue` | 53 | 0 | 0 | 0% |
| `list_pr_review_comments` | 41 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 40 | 1 | 0 | 2.5% |
| `merge_pr` | 38 | 0 | 0 | 0% |
| `search_code` | 28 | 0 | 0 | 0% |
| `search_issues` | 26 | 0 | 0 | 0% |
| `search_remote_code` | 25 | 11 | 0 | 44% |
| `list_prs` | 24 | 0 | 0 | 0% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 13 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `delegate_readonly` | 10 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `delegate_large` | 5 | 0 | 0 | 0% |
| `sync_branch` | 5 | 4 | 0 | 80% |
| `list_issues` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `delegate_readonly_large` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,866 | 85.2% |
| `edit` | 384 | 8.5% |
| `search` | 142 | 3.1% |
| `open` | 120 | 2.6% |
| `verify` | 23 | 0.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 61.5% |
| `writing/japanese` | 33 | 23.1% |
| `research/web-search` | 8 | 5.6% |
| `conventions` | 4 | 2.8% |
| `delivery/pipeline-setup` | 3 | 2.1% |
| `docs/customer-doc` | 3 | 2.1% |
| `engineering/secrets-in-a-check` | 3 | 2.1% |
| `engineering/environment` | 1 | 0.7% |

## Last year

330 sessions.

**Ran to an end without a report:** 64 of 315 sessions whose last run the core recorded as `completed` — 20.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,142,294,707 tokens** over 415 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 413 of 415 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 6,181,709 | 27,846,035 | 73,718,100 | 1,142,294,707 |
| messages per session | 126 | 334 | 583 | 731 | 54,323 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 137 | 41.5% |
| `engineer` | 112 | 33.9% |
| `atomaton` | 80 | 24.2% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,737 | 175 | 128 | 2% |
| `read` | 6,585 | 34 | 8 | 0.5% |
| `grep` | 5,023 | 112 | 21 | 2.2% |
| `edit` | 2,247 | 39 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,079 | 99 | 0 | 9.2% |
| `list` | 393 | 5 | 0 | 1.3% |
| `get_pr` | 369 | 9 | 3 | 2.4% |
| `get_issue` | 367 | 14 | 5 | 3.8% |
| `get_issue_comments` | 363 | 0 | 10 | 0% |
| `get_check_runs` | 359 | 13 | 0 | 3.6% |
| `glob` | 334 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 226 | 0 | 0 | 0% |
| `commit_and_push` | 214 | 10 | 0 | 4.7% |
| `get_branch` | 213 | 0 | 0 | 0% |
| `write` | 211 | 2 | 0 | 0.9% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 190 | 61 | 0 | 32.1% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 145 | 3 | 0 | 2.1% |
| `search_issues` | 134 | 0 | 3 | 0% |
| `request_close_issue` | 116 | 1 | 0 | 0.9% |
| `load_skill` | 105 | 9 | 0 | 8.6% |
| `get_pr_reviews` | 94 | 0 | 0 | 0% |
| `merge_pr` | 74 | 0 | 0 | 0% |
| `list_pr_review_comments` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search_remote_code` | 48 | 17 | 0 | 35.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 36 | 1 | 0 | 2.8% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate_readonly` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 17 | 0 | 0 | 0% |
| `sync_branch` | 16 | 7 | 0 | 43.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 8 | 0 | 3 | 0% |
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
| `other` | 6,989 | 80% |
| `edit` | 691 | 7.9% |
| `search` | 537 | 6.1% |
| `open` | 273 | 3.1% |
| `verify` | 247 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 76.5% |
| `writing/japanese` | 33 | 10.5% |
| `delivery/pipeline-setup` | 10 | 3.2% |
| `research/web-search` | 10 | 3.2% |
| `engineering/environment` | 7 | 2.2% |
| `engineering/secrets-in-a-check` | 6 | 1.9% |
| `conventions` | 4 | 1.3% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## All time

349 sessions.

**Ran to an end without a report:** 64 of 315 sessions whose last run the core recorded as `completed` — 20.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,142,294,707 tokens** over 415 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 413 of 415 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 6,181,709 | 27,846,035 | 73,718,100 | 1,142,294,707 |
| messages per session | 119 | 330 | 583 | 731 | 54,447 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 143 | 41% |
| `engineer` | 122 | 35% |
| `atomaton` | 83 | 23.8% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,737 | 175 | 128 | 2% |
| `read` | 6,585 | 34 | 8 | 0.5% |
| `grep` | 5,023 | 112 | 21 | 2.2% |
| `edit` | 2,247 | 39 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,079 | 99 | 0 | 9.2% |
| `list` | 393 | 5 | 0 | 1.3% |
| `get_pr` | 369 | 9 | 3 | 2.4% |
| `get_issue` | 367 | 14 | 5 | 3.8% |
| `get_issue_comments` | 363 | 0 | 10 | 0% |
| `get_check_runs` | 359 | 13 | 0 | 3.6% |
| `glob` | 334 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 226 | 0 | 0 | 0% |
| `commit_and_push` | 214 | 10 | 0 | 4.7% |
| `get_branch` | 213 | 0 | 0 | 0% |
| `write` | 211 | 2 | 0 | 0.9% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 190 | 61 | 0 | 32.1% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 145 | 3 | 0 | 2.1% |
| `search_issues` | 134 | 0 | 3 | 0% |
| `request_close_issue` | 116 | 1 | 0 | 0.9% |
| `load_skill` | 105 | 9 | 0 | 8.6% |
| `get_pr_reviews` | 94 | 0 | 0 | 0% |
| `merge_pr` | 74 | 0 | 0 | 0% |
| `list_pr_review_comments` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search_remote_code` | 48 | 17 | 0 | 35.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 36 | 1 | 0 | 2.8% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate_readonly` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 17 | 0 | 0 | 0% |
| `sync_branch` | 16 | 7 | 0 | 43.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 8 | 0 | 3 | 0% |
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
| `other` | 6,989 | 80% |
| `edit` | 691 | 7.9% |
| `search` | 537 | 6.1% |
| `open` | 273 | 3.1% |
| `verify` | 247 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 76.5% |
| `writing/japanese` | 33 | 10.5% |
| `delivery/pipeline-setup` | 10 | 3.2% |
| `research/web-search` | 10 | 3.2% |
| `engineering/environment` | 7 | 2.2% |
| `engineering/secrets-in-a-check` | 6 | 1.9% |
| `conventions` | 4 | 1.3% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-26 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `agent-prompt-surface`
- `atomaton-surface`
- `customer-doc`
- `environment`
- `gh-actions-surface`
- `japanese`
- `on-demand-audit`
- `pipeline-setup`
- `secrets-in-a-check`
- `web-search`
