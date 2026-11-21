# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-21.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 34 | 17.6% | 667 | 5,064 | 19 | 30.8 |
| Last 30 days | 567 | 7.9% | 252 | 9,689 | 13 | 19.0 |
| Last year | 784 | 7.5% | 291 | 10,246 | 15 | 21.1 |
| All time | 784 | 7.5% | 291 | 10,246 | 15 | 21.1 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 725 |
| `failed` | 48 |
| `stopped` | 11 |

## Last 7 days

16 sessions.

**Ran to an end without a report:** 3 of 13 sessions whose last run the core recorded as `completed` — 23.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**60,488,025 tokens** over 16 runs that reported them, **96.2% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.4% of that prompt was served from cache**, over the 15 of 16 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 660,317 | 12,751,838 | 13,863,651 | 13,863,651 | 60,488,025 |
| messages per session | 167 | 347 | 394 | 394 | 2,911 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 7 | 43.8% |
| `engineer` | 5 | 31.3% |
| `atomaton` | 3 | 18.8% |
| `architect` | 1 | 6.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 524 | 8 | 7 | 1.5% |
| `read` | 351 | 2 | 0 | 0.6% |
| `grep` | 345 | 3 | 2 | 0.9% |
| `fetch` | 136 | 33 | 0 | 24.3% |
| `edit` | 56 | 0 | 0 | 0% |
| `glob` | 31 | 0 | 0 | 0% |
| `list` | 25 | 0 | 0 | 0% |
| `load_skill` | 23 | 0 | 0 | 0% |
| `get_issue_comments` | 21 | 0 | 0 | 0% |
| `get_pr` | 20 | 0 | 0 | 0% |
| `get_issue` | 14 | 0 | 0 | 0% |
| `get_branch` | 13 | 0 | 0 | 0% |
| `get_check_runs` | 13 | 1 | 0 | 7.7% |
| `check_merge_readiness` | 11 | 0 | 0 | 0% |
| `commit_and_push` | 7 | 0 | 0 | 0% |
| `get_pr_reviews` | 6 | 0 | 0 | 0% |
| `list_prs` | 6 | 0 | 0 | 0% |
| `search_issues` | 6 | 0 | 0 | 0% |
| `create_pr` | 5 | 0 | 0 | 0% |
| `get_pr_diff` | 5 | 0 | 0 | 0% |
| `list_pr_review_comments` | 5 | 0 | 0 | 0% |
| `request_close_issue` | 5 | 0 | 0 | 0% |
| `write` | 5 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
| `delegate_readonly` | 2 | 0 | 0 | 0% |
| `merge_pr` | 2 | 0 | 0 | 0% |
| `search_code` | 2 | 0 | 0 | 0% |
| `search_remote_code` | 2 | 2 | 0 | 100% |
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
| `writing/japanese` | 12 | 52.2% |
| `project/conventions` | 10 | 43.5% |
| `research/web-search` | 1 | 4.3% |

## Last 30 days

208 sessions.

**Ran to an end without a report:** 33 of 196 sessions whose last run the core recorded as `completed` — 16.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**663,919,283 tokens** over 271 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the 269 of 271 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,560 | 6,181,709 | 20,308,488 | 29,805,044 | 663,919,283 |
| messages per session | 126 | 327 | 425 | 731 | 32,711 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 91 | 43.8% |
| `engineer` | 80 | 38.5% |
| `atomaton` | 36 | 17.3% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,183 | 126 | 83 | 2% |
| `read` | 3,647 | 15 | 4 | 0.4% |
| `grep` | 3,021 | 81 | 14 | 2.7% |
| `edit` | 1,333 | 26 | 0 | 2% |
| `fetch` | 717 | 63 | 0 | 8.8% |
| `get_pr` | 241 | 0 | 3 | 0% |
| `get_check_runs` | 240 | 10 | 0 | 4.2% |
| `get_issue_comments` | 221 | 0 | 0 | 0% |
| `glob` | 194 | 0 | 0 | 0% |
| `get_issue` | 181 | 1 | 1 | 0.6% |
| `list` | 178 | 3 | 0 | 1.7% |
| `check_merge_readiness` | 157 | 0 | 0 | 0% |
| `commit_and_push` | 151 | 4 | 0 | 2.6% |
| `write` | 127 | 2 | 0 | 1.6% |
| `create_pr` | 122 | 36 | 0 | 29.5% |
| `get_branch` | 115 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 112 | 1 | 0 | 0.9% |
| `get_pr_diff` | 97 | 0 | 0 | 0% |
| `load_skill` | 85 | 9 | 0 | 10.6% |
| `request_close_issue` | 74 | 1 | 0 | 1.4% |
| `get_pr_reviews` | 66 | 0 | 0 | 0% |
| `merge_pr` | 54 | 0 | 0 | 0% |
| `list_pr_review_comments` | 49 | 0 | 0 | 0% |
| `search_issues` | 43 | 0 | 1 | 0% |
| `list_prs` | 42 | 0 | 0 | 0% |
| `search_code` | 34 | 0 | 0 | 0% |
| `create_root_issue` | 24 | 0 | 0 | 0% |
| `search_remote_code` | 24 | 9 | 0 | 37.5% |
| `create_sub_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 19 | 0 | 0 | 0% |
| `delegate` | 17 | 0 | 0 | 0% |
| `delegate_readonly` | 10 | 0 | 0 | 0% |
| `sync_branch` | 8 | 4 | 0 | 50% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `delegate_readonly_large` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,284 | 85.5% |
| `edit` | 468 | 7.6% |
| `search` | 209 | 3.4% |
| `open` | 147 | 2.4% |
| `verify` | 75 | 1.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 146 | 74.1% |
| `writing/japanese` | 33 | 16.8% |
| `research/web-search` | 6 | 3% |
| `delivery/pipeline-setup` | 4 | 2% |
| `engineering/secrets-in-a-check` | 4 | 2% |
| `docs/customer-doc` | 3 | 1.5% |
| `engineering/environment` | 1 | 0.5% |

## Last year

303 sessions.

**Ran to an end without a report:** 55 of 289 sessions whose last run the core recorded as `completed` — 19%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,111,622,097 tokens** over 392 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 390 of 392 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,309,906 | 6,183,128 | 28,119,706 | 73,718,100 | 1,111,622,097 |
| messages per session | 137 | 341 | 583 | 731 | 51,587 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 125 | 41.3% |
| `engineer` | 97 | 32% |
| `atomaton` | 80 | 26.4% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,276 | 168 | 126 | 2% |
| `read` | 6,168 | 32 | 8 | 0.5% |
| `grep` | 4,785 | 112 | 21 | 2.3% |
| `edit` | 2,160 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,043 | 98 | 0 | 9.4% |
| `list` | 372 | 5 | 0 | 1.3% |
| `get_issue` | 364 | 14 | 5 | 3.8% |
| `get_issue_comments` | 356 | 0 | 10 | 0% |
| `get_pr` | 351 | 9 | 3 | 2.6% |
| `get_check_runs` | 339 | 13 | 0 | 3.8% |
| `glob` | 319 | 1 | 1 | 0.3% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 207 | 0 | 0 | 0% |
| `get_branch` | 205 | 0 | 0 | 0% |
| `write` | 199 | 2 | 0 | 1% |
| `commit_and_push` | 196 | 9 | 0 | 4.6% |
| `create_pr` | 170 | 55 | 0 | 32.4% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 140 | 3 | 0 | 2.1% |
| `search_issues` | 132 | 0 | 3 | 0% |
| `request_close_issue` | 103 | 1 | 0 | 1% |
| `load_skill` | 85 | 9 | 0 | 10.6% |
| `get_pr_reviews` | 83 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 67 | 0 | 0 | 0% |
| `merge_pr` | 65 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_pr_review_comments` | 63 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 43 | 14 | 0 | 32.6% |
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
| `project/conventions` | 227 | 76.9% |
| `writing/japanese` | 33 | 11.2% |
| `delivery/pipeline-setup` | 10 | 3.4% |
| `research/web-search` | 8 | 2.7% |
| `engineering/environment` | 7 | 2.4% |
| `engineering/secrets-in-a-check` | 6 | 2% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## All time

322 sessions.

**Ran to an end without a report:** 55 of 289 sessions whose last run the core recorded as `completed` — 19%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,111,622,097 tokens** over 392 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 390 of 392 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,309,906 | 6,183,128 | 28,119,706 | 73,718,100 | 1,111,622,097 |
| messages per session | 125 | 334 | 583 | 731 | 51,711 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 131 | 40.7% |
| `engineer` | 107 | 33.2% |
| `atomaton` | 83 | 25.8% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,276 | 168 | 126 | 2% |
| `read` | 6,168 | 32 | 8 | 0.5% |
| `grep` | 4,785 | 112 | 21 | 2.3% |
| `edit` | 2,160 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,043 | 98 | 0 | 9.4% |
| `list` | 372 | 5 | 0 | 1.3% |
| `get_issue` | 364 | 14 | 5 | 3.8% |
| `get_issue_comments` | 356 | 0 | 10 | 0% |
| `get_pr` | 351 | 9 | 3 | 2.6% |
| `get_check_runs` | 339 | 13 | 0 | 3.8% |
| `glob` | 319 | 1 | 1 | 0.3% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 207 | 0 | 0 | 0% |
| `get_branch` | 205 | 0 | 0 | 0% |
| `write` | 199 | 2 | 0 | 1% |
| `commit_and_push` | 196 | 9 | 0 | 4.6% |
| `create_pr` | 170 | 55 | 0 | 32.4% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 140 | 3 | 0 | 2.1% |
| `search_issues` | 132 | 0 | 3 | 0% |
| `request_close_issue` | 103 | 1 | 0 | 1% |
| `load_skill` | 85 | 9 | 0 | 10.6% |
| `get_pr_reviews` | 83 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 67 | 0 | 0 | 0% |
| `merge_pr` | 65 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_pr_review_comments` | 63 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 43 | 14 | 0 | 32.6% |
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
| `project/conventions` | 227 | 76.9% |
| `writing/japanese` | 33 | 11.2% |
| `delivery/pipeline-setup` | 10 | 3.4% |
| `research/web-search` | 8 | 2.7% |
| `engineering/environment` | 7 | 2.4% |
| `engineering/secrets-in-a-check` | 6 | 2% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-20 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/agent-prompt-surface`
- `security/atomaton-surface`
- `security/gh-actions-surface`
- `security/on-demand-audit`
