# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-21.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 40 | 17.5% | 357 | 5,064 | 17 | 27.7 |
| Last 30 days | 558 | 8.1% | 255 | 9,689 | 13 | 18.7 |
| Last year | 790 | 7.6% | 283 | 10,246 | 15 | 21.0 |
| All time | 790 | 7.6% | 283 | 10,246 | 15 | 21.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 730 |
| `failed` | 49 |
| `stopped` | 11 |

## Last 7 days

17 sessions.

**Ran to an end without a report:** 3 of 15 sessions whose last run the core recorded as `completed` — 20%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**68,359,212 tokens** over 19 runs that reported them, **96.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.1% of that prompt was served from cache**, over the 18 of 19 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,977,743 | 12,751,838 | 13,863,651 | 13,863,651 | 68,359,212 |
| messages per session | 177 | 347 | 394 | 394 | 3,246 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 8 | 47.1% |
| `engineer` | 5 | 29.4% |
| `atomaton` | 3 | 17.6% |
| `architect` | 1 | 5.9% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 524 | 8 | 7 | 1.5% |
| `read` | 467 | 3 | 0 | 0.6% |
| `grep` | 416 | 3 | 2 | 0.7% |
| `fetch` | 143 | 33 | 0 | 23.1% |
| `edit` | 56 | 0 | 0 | 0% |
| `list` | 37 | 0 | 0 | 0% |
| `glob` | 35 | 0 | 0 | 0% |
| `load_skill` | 25 | 0 | 0 | 0% |
| `get_issue_comments` | 21 | 0 | 0 | 0% |
| `get_pr` | 20 | 0 | 0 | 0% |
| `get_check_runs` | 17 | 1 | 0 | 5.9% |
| `get_branch` | 16 | 0 | 0 | 0% |
| `get_issue` | 14 | 0 | 0 | 0% |
| `check_merge_readiness` | 13 | 0 | 0 | 0% |
| `commit_and_push` | 7 | 0 | 0 | 0% |
| `get_pr_reviews` | 6 | 0 | 0 | 0% |
| `list_prs` | 6 | 0 | 0 | 0% |
| `search_issues` | 6 | 0 | 0 | 0% |
| `create_pr` | 5 | 0 | 0 | 0% |
| `get_pr_diff` | 5 | 0 | 0 | 0% |
| `list_pr_review_comments` | 5 | 0 | 0 | 0% |
| `request_close_issue` | 5 | 0 | 0 | 0% |
| `write` | 5 | 0 | 0 | 0% |
| `search_remote_code` | 4 | 4 | 0 | 100% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
| `delegate_readonly` | 2 | 0 | 0 | 0% |
| `merge_pr` | 2 | 0 | 0 | 0% |
| `search_code` | 2 | 0 | 0 | 0% |
| `create_root_issue` | 1 | 0 | 0 | 0% |
| `delegate` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 459 | 87.6% |
| `open` | 24 | 4.6% |
| `search` | 23 | 4.4% |
| `edit` | 15 | 2.9% |
| `verify` | 3 | 0.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `writing/japanese` | 12 | 48% |
| `project/conventions` | 10 | 40% |
| `research/web-search` | 3 | 12% |

## Last 30 days

203 sessions.

**Ran to an end without a report:** 32 of 192 sessions whose last run the core recorded as `completed` — 16.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**657,505,076 tokens** over 265 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 263 of 265 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,300,539 | 6,181,709 | 20,308,488 | 29,805,044 | 657,505,076 |
| messages per session | 126 | 323 | 425 | 731 | 31,856 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 90 | 44.3% |
| `engineer` | 79 | 38.9% |
| `atomaton` | 33 | 16.3% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,999 | 125 | 81 | 2.1% |
| `read` | 3,619 | 15 | 4 | 0.4% |
| `grep` | 3,014 | 76 | 14 | 2.5% |
| `edit` | 1,212 | 25 | 0 | 2.1% |
| `fetch` | 719 | 63 | 0 | 8.8% |
| `get_check_runs` | 239 | 10 | 0 | 4.2% |
| `get_pr` | 231 | 0 | 3 | 0% |
| `get_issue_comments` | 216 | 0 | 0 | 0% |
| `glob` | 191 | 0 | 0 | 0% |
| `list` | 180 | 3 | 0 | 1.7% |
| `get_issue` | 172 | 1 | 1 | 0.6% |
| `check_merge_readiness` | 148 | 0 | 0 | 0% |
| `commit_and_push` | 142 | 4 | 0 | 2.8% |
| `write` | 121 | 2 | 0 | 1.7% |
| `create_pr` | 115 | 35 | 0 | 30.4% |
| `get_branch` | 112 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 107 | 1 | 0 | 0.9% |
| `get_pr_diff` | 95 | 0 | 0 | 0% |
| `load_skill` | 87 | 9 | 0 | 10.3% |
| `request_close_issue` | 70 | 1 | 0 | 1.4% |
| `get_pr_reviews` | 65 | 0 | 0 | 0% |
| `merge_pr` | 54 | 0 | 0 | 0% |
| `list_pr_review_comments` | 48 | 0 | 0 | 0% |
| `search_issues` | 43 | 0 | 1 | 0% |
| `list_prs` | 37 | 0 | 0 | 0% |
| `search_code` | 32 | 0 | 0 | 0% |
| `search_remote_code` | 26 | 11 | 0 | 42.3% |
| `create_root_issue` | 24 | 0 | 0 | 0% |
| `create_sub_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 19 | 0 | 0 | 0% |
| `delegate` | 17 | 0 | 0 | 0% |
| `delegate_readonly` | 9 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `sync_branch` | 5 | 4 | 0 | 80% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,162 | 86% |
| `edit` | 462 | 7.7% |
| `search` | 190 | 3.2% |
| `open` | 138 | 2.3% |
| `verify` | 47 | 0.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 141 | 72.7% |
| `writing/japanese` | 33 | 17% |
| `research/web-search` | 8 | 4.1% |
| `delivery/pipeline-setup` | 4 | 2.1% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `docs/customer-doc` | 3 | 1.5% |
| `engineering/environment` | 1 | 0.5% |

## Last year

304 sessions.

**Ran to an end without a report:** 55 of 291 sessions whose last run the core recorded as `completed` — 18.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,119,493,284 tokens** over 395 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 393 of 395 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 6,183,128 | 28,119,706 | 73,718,100 | 1,119,493,284 |
| messages per session | 142 | 341 | 583 | 731 | 51,922 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 126 | 41.4% |
| `engineer` | 97 | 31.9% |
| `atomaton` | 80 | 26.3% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,276 | 168 | 126 | 2% |
| `read` | 6,284 | 33 | 8 | 0.5% |
| `grep` | 4,856 | 112 | 21 | 2.3% |
| `edit` | 2,160 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,050 | 98 | 0 | 9.3% |
| `list` | 384 | 5 | 0 | 1.3% |
| `get_issue` | 364 | 14 | 5 | 3.8% |
| `get_issue_comments` | 356 | 0 | 10 | 0% |
| `get_pr` | 351 | 9 | 3 | 2.6% |
| `get_check_runs` | 343 | 13 | 0 | 3.8% |
| `glob` | 323 | 1 | 1 | 0.3% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 209 | 0 | 0 | 0% |
| `get_branch` | 208 | 0 | 0 | 0% |
| `write` | 199 | 2 | 0 | 1% |
| `commit_and_push` | 196 | 9 | 0 | 4.6% |
| `create_pr` | 170 | 55 | 0 | 32.4% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 140 | 3 | 0 | 2.1% |
| `search_issues` | 132 | 0 | 3 | 0% |
| `request_close_issue` | 103 | 1 | 0 | 1% |
| `load_skill` | 87 | 9 | 0 | 10.3% |
| `get_pr_reviews` | 83 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 67 | 0 | 0 | 0% |
| `merge_pr` | 65 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_pr_review_comments` | 63 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search_remote_code` | 45 | 16 | 0 | 35.6% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `delegate_readonly` | 29 | 0 | 0 | 0% |
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
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
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
| `other` | 6,613 | 79.9% |
| `edit` | 632 | 7.6% |
| `search` | 527 | 6.4% |
| `open` | 263 | 3.2% |
| `verify` | 241 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 227 | 76.4% |
| `writing/japanese` | 33 | 11.1% |
| `delivery/pipeline-setup` | 10 | 3.4% |
| `research/web-search` | 10 | 3.4% |
| `engineering/environment` | 7 | 2.4% |
| `engineering/secrets-in-a-check` | 6 | 2% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## All time

323 sessions.

**Ran to an end without a report:** 55 of 291 sessions whose last run the core recorded as `completed` — 18.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,119,493,284 tokens** over 395 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 393 of 395 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 6,183,128 | 28,119,706 | 73,718,100 | 1,119,493,284 |
| messages per session | 126 | 334 | 583 | 731 | 52,046 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 132 | 40.9% |
| `engineer` | 107 | 33.1% |
| `atomaton` | 83 | 25.7% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,276 | 168 | 126 | 2% |
| `read` | 6,284 | 33 | 8 | 0.5% |
| `grep` | 4,856 | 112 | 21 | 2.3% |
| `edit` | 2,160 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,050 | 98 | 0 | 9.3% |
| `list` | 384 | 5 | 0 | 1.3% |
| `get_issue` | 364 | 14 | 5 | 3.8% |
| `get_issue_comments` | 356 | 0 | 10 | 0% |
| `get_pr` | 351 | 9 | 3 | 2.6% |
| `get_check_runs` | 343 | 13 | 0 | 3.8% |
| `glob` | 323 | 1 | 1 | 0.3% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 209 | 0 | 0 | 0% |
| `get_branch` | 208 | 0 | 0 | 0% |
| `write` | 199 | 2 | 0 | 1% |
| `commit_and_push` | 196 | 9 | 0 | 4.6% |
| `create_pr` | 170 | 55 | 0 | 32.4% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 140 | 3 | 0 | 2.1% |
| `search_issues` | 132 | 0 | 3 | 0% |
| `request_close_issue` | 103 | 1 | 0 | 1% |
| `load_skill` | 87 | 9 | 0 | 10.3% |
| `get_pr_reviews` | 83 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 67 | 0 | 0 | 0% |
| `merge_pr` | 65 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_pr_review_comments` | 63 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search_remote_code` | 45 | 16 | 0 | 35.6% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `delegate_readonly` | 29 | 0 | 0 | 0% |
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
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
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
| `other` | 6,613 | 79.9% |
| `edit` | 632 | 7.6% |
| `search` | 527 | 6.4% |
| `open` | 263 | 3.2% |
| `verify` | 241 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 227 | 76.4% |
| `writing/japanese` | 33 | 11.1% |
| `delivery/pipeline-setup` | 10 | 3.4% |
| `research/web-search` | 10 | 3.4% |
| `engineering/environment` | 7 | 2.4% |
| `engineering/secrets-in-a-check` | 6 | 2% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-21 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/agent-prompt-surface`
- `security/atomaton-surface`
- `security/gh-actions-surface`
- `security/on-demand-audit`
