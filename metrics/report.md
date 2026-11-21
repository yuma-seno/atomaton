# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-21.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 40 | 20% | 337 | 5,064 | 13 | 27.0 |
| Last 30 days | 553 | 8.3% | 253 | 9,689 | 13 | 18.7 |
| Last year | 791 | 7.7% | 283 | 10,246 | 15 | 20.8 |
| All time | 791 | 7.7% | 283 | 10,246 | 15 | 20.8 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 730 |
| `failed` | 50 |
| `stopped` | 11 |

## Last 7 days

18 sessions.

**Ran to an end without a report:** 3 of 15 sessions whose last run the core recorded as `completed` — 20%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**54,495,561 tokens** over 18 runs that reported them, **96.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**92.8% of that prompt was served from cache**, over the 17 of 18 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,977,743 | 8,391,640 | 12,751,838 | 12,751,838 | 54,495,561 |
| messages per session | 177 | 347 | 394 | 394 | 3,275 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 8 | 44.4% |
| `engineer` | 6 | 33.3% |
| `atomaton` | 3 | 16.7% |
| `architect` | 1 | 5.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 528 | 8 | 7 | 1.5% |
| `read` | 474 | 3 | 0 | 0.6% |
| `grep` | 416 | 3 | 2 | 0.7% |
| `fetch` | 143 | 33 | 0 | 23.1% |
| `edit` | 56 | 0 | 0 | 0% |
| `list` | 37 | 0 | 0 | 0% |
| `glob` | 35 | 0 | 0 | 0% |
| `load_skill` | 26 | 0 | 0 | 0% |
| `get_issue_comments` | 22 | 0 | 0 | 0% |
| `get_pr` | 20 | 0 | 0 | 0% |
| `get_check_runs` | 17 | 1 | 0 | 5.9% |
| `get_branch` | 16 | 0 | 0 | 0% |
| `get_issue` | 15 | 0 | 0 | 0% |
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
| `other` | 463 | 87.7% |
| `open` | 24 | 4.5% |
| `search` | 23 | 4.4% |
| `edit` | 15 | 2.8% |
| `verify` | 3 | 0.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `writing/japanese` | 12 | 46.2% |
| `project/conventions` | 11 | 42.3% |
| `research/web-search` | 3 | 11.5% |

## Last 30 days

202 sessions.

**Ran to an end without a report:** 31 of 190 sessions whose last run the core recorded as `completed` — 16.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**645,551,494 tokens** over 261 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 259 of 261 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,291,903 | 6,181,709 | 20,308,488 | 29,805,044 | 645,551,494 |
| messages per session | 125 | 323 | 425 | 731 | 31,462 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 89 | 44.1% |
| `engineer` | 80 | 39.6% |
| `atomaton` | 32 | 15.8% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,956 | 125 | 81 | 2.1% |
| `read` | 3,567 | 15 | 4 | 0.4% |
| `grep` | 2,959 | 75 | 14 | 2.5% |
| `edit` | 1,183 | 24 | 0 | 2% |
| `fetch` | 719 | 63 | 0 | 8.8% |
| `get_check_runs` | 237 | 10 | 0 | 4.2% |
| `get_pr` | 228 | 0 | 3 | 0% |
| `get_issue_comments` | 209 | 0 | 0 | 0% |
| `glob` | 187 | 0 | 0 | 0% |
| `list` | 180 | 3 | 0 | 1.7% |
| `get_issue` | 169 | 1 | 1 | 0.6% |
| `check_merge_readiness` | 146 | 0 | 0 | 0% |
| `commit_and_push` | 140 | 4 | 0 | 2.9% |
| `write` | 121 | 2 | 0 | 1.7% |
| `create_pr` | 114 | 35 | 0 | 30.7% |
| `get_branch` | 109 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 106 | 1 | 0 | 0.9% |
| `get_pr_diff` | 93 | 0 | 0 | 0% |
| `load_skill` | 88 | 9 | 0 | 10.2% |
| `request_close_issue` | 69 | 1 | 0 | 1.4% |
| `get_pr_reviews` | 65 | 0 | 0 | 0% |
| `merge_pr` | 54 | 0 | 0 | 0% |
| `list_pr_review_comments` | 48 | 0 | 0 | 0% |
| `search_issues` | 43 | 0 | 1 | 0% |
| `list_prs` | 36 | 0 | 0 | 0% |
| `search_code` | 32 | 0 | 0 | 0% |
| `search_remote_code` | 26 | 11 | 0 | 42.3% |
| `create_root_issue` | 24 | 0 | 0 | 0% |
| `create_sub_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 19 | 0 | 0 | 0% |
| `delegate` | 17 | 0 | 0 | 0% |
| `delegate_readonly` | 8 | 0 | 0 | 0% |
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
| `other` | 5,157 | 86.6% |
| `edit` | 462 | 7.8% |
| `search` | 174 | 2.9% |
| `open` | 127 | 2.1% |
| `verify` | 36 | 0.6% |

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

305 sessions.

**Ran to an end without a report:** 55 of 291 sessions whose last run the core recorded as `completed` — 18.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,119,493,284 tokens** over 395 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 393 of 395 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 6,183,128 | 28,119,706 | 73,718,100 | 1,119,493,284 |
| messages per session | 141 | 341 | 583 | 731 | 51,951 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 126 | 41.3% |
| `engineer` | 98 | 32.1% |
| `atomaton` | 80 | 26.2% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,280 | 168 | 126 | 2% |
| `read` | 6,291 | 33 | 8 | 0.5% |
| `grep` | 4,856 | 112 | 21 | 2.3% |
| `edit` | 2,160 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,050 | 98 | 0 | 9.3% |
| `list` | 384 | 5 | 0 | 1.3% |
| `get_issue` | 365 | 14 | 5 | 3.8% |
| `get_issue_comments` | 357 | 0 | 10 | 0% |
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
| `load_skill` | 88 | 9 | 0 | 10.2% |
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
| `other` | 6,617 | 79.9% |
| `edit` | 632 | 7.6% |
| `search` | 527 | 6.4% |
| `open` | 263 | 3.2% |
| `verify` | 241 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 228 | 76.5% |
| `writing/japanese` | 33 | 11.1% |
| `delivery/pipeline-setup` | 10 | 3.4% |
| `research/web-search` | 10 | 3.4% |
| `engineering/environment` | 7 | 2.3% |
| `engineering/secrets-in-a-check` | 6 | 2% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## All time

324 sessions.

**Ran to an end without a report:** 55 of 291 sessions whose last run the core recorded as `completed` — 18.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,119,493,284 tokens** over 395 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 393 of 395 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 6,183,128 | 28,119,706 | 73,718,100 | 1,119,493,284 |
| messages per session | 126 | 334 | 583 | 731 | 52,075 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 132 | 40.7% |
| `engineer` | 108 | 33.3% |
| `atomaton` | 83 | 25.6% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,280 | 168 | 126 | 2% |
| `read` | 6,291 | 33 | 8 | 0.5% |
| `grep` | 4,856 | 112 | 21 | 2.3% |
| `edit` | 2,160 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,050 | 98 | 0 | 9.3% |
| `list` | 384 | 5 | 0 | 1.3% |
| `get_issue` | 365 | 14 | 5 | 3.8% |
| `get_issue_comments` | 357 | 0 | 10 | 0% |
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
| `load_skill` | 88 | 9 | 0 | 10.2% |
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
| `other` | 6,617 | 79.9% |
| `edit` | 632 | 7.6% |
| `search` | 527 | 6.4% |
| `open` | 263 | 3.2% |
| `verify` | 241 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 228 | 76.5% |
| `writing/japanese` | 33 | 11.1% |
| `delivery/pipeline-setup` | 10 | 3.4% |
| `research/web-search` | 10 | 3.4% |
| `engineering/environment` | 7 | 2.3% |
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
