# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-15.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 110 | 22.7% | 440 | 5,064 | 18 | 31.7 |
| Last 30 days | 682 | 7.2% | 257 | 9,859 | 14 | 19.0 |
| Last year | 767 | 7.4% | 291 | 10,246 | 15 | 20.7 |
| All time | 767 | 7.4% | 291 | 10,246 | 15 | 20.7 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 710 |
| `failed` | 46 |
| `stopped` | 11 |

## Last 7 days

32 sessions.

**Ran to an end without a report:** 4 of 29 sessions whose last run the core recorded as `completed` — 13.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**129,229,125 tokens** over 43 runs that reported them, **97.3% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.2% of that prompt was served from cache**, over the 41 of 43 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,224,669 | 8,209,387 | 13,863,651 | 13,863,651 | 129,229,125 |
| messages per session | 215 | 366 | 387 | 387 | 7,073 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 15 | 46.9% |
| `engineer` | 12 | 37.5% |
| `atomaton` | 4 | 12.5% |
| `architect` | 1 | 3.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,454 | 29 | 19 | 2% |
| `grep` | 800 | 9 | 2 | 1.1% |
| `read` | 772 | 4 | 0 | 0.5% |
| `fetch` | 258 | 43 | 0 | 16.7% |
| `edit` | 169 | 5 | 0 | 3% |
| `load_skill` | 53 | 0 | 0 | 0% |
| `glob` | 48 | 0 | 0 | 0% |
| `get_check_runs` | 44 | 0 | 0 | 0% |
| `get_issue_comments` | 37 | 0 | 0 | 0% |
| `get_pr` | 36 | 0 | 0 | 0% |
| `list` | 33 | 2 | 0 | 6.1% |
| `get_issue` | 27 | 0 | 0 | 0% |
| `check_merge_readiness` | 26 | 0 | 0 | 0% |
| `write` | 26 | 0 | 0 | 0% |
| `commit_and_push` | 24 | 1 | 0 | 4.2% |
| `create_pr` | 23 | 9 | 0 | 39.1% |
| `get_pr_diff` | 17 | 0 | 0 | 0% |
| `get_pr_reviews` | 15 | 0 | 0 | 0% |
| `get_branch` | 14 | 0 | 0 | 0% |
| `list_pr_review_comments` | 11 | 0 | 0 | 0% |
| `search_code` | 11 | 0 | 0 | 0% |
| `request_close_issue` | 10 | 0 | 0 | 0% |
| `search_issues` | 10 | 0 | 0 | 0% |
| `list_prs` | 7 | 0 | 0 | 0% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `create_root_issue` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
| `delegate_readonly` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `delegate` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `search_remote_code` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,195 | 82.2% |
| `edit` | 138 | 9.5% |
| `open` | 68 | 4.7% |
| `search` | 52 | 3.6% |
| `verify` | 1 | 0.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `writing/japanese` | 28 | 52.8% |
| `project/conventions` | 21 | 39.6% |
| `research/web-search` | 3 | 5.7% |
| `engineering/secrets-in-a-check` | 1 | 1.9% |

## Last 30 days

254 sessions.

**Ran to an end without a report:** 41 of 243 sessions whose last run the core recorded as `completed` — 16.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**762,002,061 tokens** over 340 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.5% of that prompt was served from cache**, over the 338 of 340 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,211,508 | 5,758,740 | 17,629,142 | 29,805,044 | 762,002,061 |
| messages per session | 121 | 327 | 445 | 731 | 40,054 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 110 | 43.3% |
| `engineer` | 84 | 33.1% |
| `atomaton` | 59 | 23.2% |
| `architect` | 1 | 0.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,063 | 138 | 96 | 2% |
| `read` | 4,706 | 22 | 4 | 0.5% |
| `grep` | 3,821 | 93 | 13 | 2.4% |
| `edit` | 1,807 | 32 | 0 | 1.8% |
| `fetch` | 832 | 72 | 0 | 8.7% |
| `get_check_runs` | 298 | 10 | 0 | 3.4% |
| `get_pr` | 296 | 4 | 3 | 1.4% |
| `get_issue_comments` | 280 | 0 | 2 | 0% |
| `get_issue` | 270 | 1 | 5 | 0.4% |
| `glob` | 255 | 1 | 0 | 0.4% |
| `list` | 244 | 4 | 0 | 1.6% |
| `check_merge_readiness` | 185 | 0 | 0 | 0% |
| `commit_and_push` | 178 | 7 | 0 | 3.9% |
| `atoma_builtin__load_skill` | 158 | 1 | 0 | 0.6% |
| `create_pr` | 153 | 49 | 0 | 32% |
| `get_branch` | 152 | 0 | 0 | 0% |
| `write` | 149 | 2 | 0 | 1.3% |
| `get_pr_diff` | 123 | 2 | 0 | 1.6% |
| `request_close_issue` | 93 | 1 | 0 | 1.1% |
| `load_skill` | 75 | 9 | 0 | 12% |
| `get_pr_reviews` | 69 | 0 | 0 | 0% |
| `search_issues` | 68 | 0 | 1 | 0% |
| `merge_pr` | 58 | 0 | 0 | 0% |
| `list_pr_review_comments` | 50 | 0 | 0 | 0% |
| `list_prs` | 50 | 0 | 0 | 0% |
| `search_code` | 44 | 0 | 0 | 0% |
| `search_remote_code` | 39 | 12 | 0 | 30.8% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `delegate` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `delegate_readonly` | 19 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `sync_branch` | 11 | 6 | 0 | 54.5% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `create_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,716 | 80.9% |
| `edit` | 536 | 7.6% |
| `search` | 401 | 5.7% |
| `open` | 210 | 3% |
| `verify` | 200 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 185 | 79.4% |
| `writing/japanese` | 28 | 12% |
| `research/web-search` | 7 | 3% |
| `delivery/pipeline-setup` | 5 | 2.1% |
| `engineering/secrets-in-a-check` | 4 | 1.7% |
| `docs/customer-doc` | 3 | 1.3% |
| `engineering/environment` | 1 | 0.4% |

## Last year

297 sessions.

**Ran to an end without a report:** 55 of 284 sessions whose last run the core recorded as `completed` — 19.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,085,033,551 tokens** over 384 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the 382 of 384 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 6,181,709 | 28,119,706 | 73,718,100 | 1,085,033,551 |
| messages per session | 136 | 347 | 705 | 731 | 50,674 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 122 | 41.1% |
| `engineer` | 96 | 32.3% |
| `atomaton` | 78 | 26.3% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,207 | 166 | 124 | 2% |
| `read` | 6,006 | 31 | 8 | 0.5% |
| `grep` | 4,650 | 110 | 20 | 2.4% |
| `edit` | 2,148 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,010 | 98 | 0 | 9.7% |
| `get_issue` | 358 | 14 | 5 | 3.9% |
| `list` | 357 | 5 | 0 | 1.4% |
| `get_issue_comments` | 349 | 0 | 10 | 0% |
| `get_pr` | 339 | 9 | 3 | 2.7% |
| `get_check_runs` | 334 | 12 | 0 | 3.6% |
| `glob` | 305 | 1 | 1 | 0.3% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 203 | 0 | 0 | 0% |
| `get_branch` | 200 | 0 | 0 | 0% |
| `write` | 199 | 2 | 0 | 1% |
| `commit_and_push` | 191 | 9 | 0 | 4.7% |
| `create_pr` | 167 | 55 | 0 | 32.9% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 137 | 3 | 0 | 2.2% |
| `search_issues` | 131 | 0 | 3 | 0% |
| `request_close_issue` | 99 | 1 | 0 | 1% |
| `get_pr_reviews` | 80 | 0 | 0 | 0% |
| `load_skill` | 75 | 9 | 0 | 12% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 66 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 64 | 0 | 0 | 0% |
| `list_pr_review_comments` | 60 | 0 | 0 | 0% |
| `search_code` | 50 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 42 | 13 | 0 | 31% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `delegate_readonly` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
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
| `other` | 6,549 | 79.8% |
| `edit` | 630 | 7.7% |
| `search` | 527 | 6.4% |
| `open` | 263 | 3.2% |
| `verify` | 238 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 222 | 77.9% |
| `writing/japanese` | 28 | 9.8% |
| `delivery/pipeline-setup` | 10 | 3.5% |
| `research/web-search` | 8 | 2.8% |
| `engineering/environment` | 7 | 2.5% |
| `engineering/secrets-in-a-check` | 6 | 2.1% |
| `docs/customer-doc` | 3 | 1.1% |
| `docs/design-doc` | 1 | 0.4% |

## All time

315 sessions.

**Ran to an end without a report:** 55 of 284 sessions whose last run the core recorded as `completed` — 19.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 18 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,085,033,551 tokens** over 384 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the 382 of 384 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 6,181,709 | 28,119,706 | 73,718,100 | 1,085,033,551 |
| messages per session | 123 | 339 | 583 | 731 | 50,768 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 127 | 40.3% |
| `engineer` | 106 | 33.7% |
| `atomaton` | 81 | 25.7% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,207 | 166 | 124 | 2% |
| `read` | 6,006 | 31 | 8 | 0.5% |
| `grep` | 4,650 | 110 | 20 | 2.4% |
| `edit` | 2,148 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,010 | 98 | 0 | 9.7% |
| `get_issue` | 358 | 14 | 5 | 3.9% |
| `list` | 357 | 5 | 0 | 1.4% |
| `get_issue_comments` | 349 | 0 | 10 | 0% |
| `get_pr` | 339 | 9 | 3 | 2.7% |
| `get_check_runs` | 334 | 12 | 0 | 3.6% |
| `glob` | 305 | 1 | 1 | 0.3% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 203 | 0 | 0 | 0% |
| `get_branch` | 200 | 0 | 0 | 0% |
| `write` | 199 | 2 | 0 | 1% |
| `commit_and_push` | 191 | 9 | 0 | 4.7% |
| `create_pr` | 167 | 55 | 0 | 32.9% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 137 | 3 | 0 | 2.2% |
| `search_issues` | 131 | 0 | 3 | 0% |
| `request_close_issue` | 99 | 1 | 0 | 1% |
| `get_pr_reviews` | 80 | 0 | 0 | 0% |
| `load_skill` | 75 | 9 | 0 | 12% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 66 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 64 | 0 | 0 | 0% |
| `list_pr_review_comments` | 60 | 0 | 0 | 0% |
| `search_code` | 50 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 42 | 13 | 0 | 31% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `delegate_readonly` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
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
| `other` | 6,549 | 79.8% |
| `edit` | 630 | 7.7% |
| `search` | 527 | 6.4% |
| `open` | 263 | 3.2% |
| `verify` | 238 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 222 | 77.9% |
| `writing/japanese` | 28 | 9.8% |
| `delivery/pipeline-setup` | 10 | 3.5% |
| `research/web-search` | 8 | 2.8% |
| `engineering/environment` | 7 | 2.5% |
| `engineering/secrets-in-a-check` | 6 | 2.1% |
| `docs/customer-doc` | 3 | 1.1% |
| `docs/design-doc` | 1 | 0.4% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-15 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/agent-prompt-surface`
- `security/atomaton-surface`
- `security/gh-actions-surface`
- `security/on-demand-audit`
