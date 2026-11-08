# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-08.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 216 | 2.8% | 246 | 6,099 | 11 | 26.1 |
| Last 30 days | 619 | 4.7% | 246 | 9,859 | 13 | 18.4 |
| Last year | 656 | 4.9% | 257 | 10,246 | 15 | 19.0 |
| All time | 656 | 4.9% | 257 | 10,246 | 15 | 19.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 624 |
| `failed` | 21 |
| `stopped` | 11 |

## Last 7 days

76 sessions.

**Ran to an end without a report:** 9 of 72 sessions whose last run the core recorded as `completed` — 12.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**297,812,763 tokens** over 101 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,375,816 | 8,779,638 | 21,812,397 | 29,805,044 | 297,812,763 |
| messages per session | 144 | 341 | 439 | 439 | 12,596 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 30 | 39.5% |
| `reviewer` | 26 | 34.2% |
| `atomaton` | 20 | 26.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,561 | 66 | 38 | 2.6% |
| `read` | 1,244 | 5 | 0 | 0.4% |
| `grep` | 1,039 | 32 | 10 | 3.1% |
| `edit` | 482 | 7 | 0 | 1.5% |
| `fetch` | 323 | 17 | 0 | 5.3% |
| `list` | 87 | 0 | 0 | 0% |
| `get_pr` | 86 | 0 | 0 | 0% |
| `get_check_runs` | 81 | 2 | 0 | 2.5% |
| `glob` | 79 | 0 | 0 | 0% |
| `write` | 64 | 1 | 0 | 1.6% |
| `get_issue_comments` | 63 | 0 | 0 | 0% |
| `get_issue` | 61 | 1 | 0 | 1.6% |
| `commit_and_push` | 58 | 0 | 0 | 0% |
| `check_merge_readiness` | 52 | 0 | 0 | 0% |
| `create_pr` | 44 | 14 | 0 | 31.8% |
| `get_branch` | 43 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `get_pr_diff` | 29 | 0 | 0 | 0% |
| `get_pr_reviews` | 28 | 0 | 0 | 0% |
| `request_close_issue` | 26 | 0 | 0 | 0% |
| `load_skill` | 24 | 7 | 0 | 29.2% |
| `merge_pr` | 21 | 0 | 0 | 0% |
| `list_pr_review_comments` | 20 | 0 | 0 | 0% |
| `search_remote_code` | 18 | 6 | 0 | 33.3% |
| `create_sub_issue` | 16 | 0 | 0 | 0% |
| `search_code` | 16 | 0 | 0 | 0% |
| `list_prs` | 15 | 0 | 0 | 0% |
| `search_issues` | 13 | 0 | 0 | 0% |
| `launch_sub_agent` | 12 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `create_root_issue` | 7 | 0 | 0 | 0% |
| `delegate_readonly` | 5 | 0 | 0 | 0% |
| `delegate_large` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 4 | 0 | 100% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `publish_draft` | 3 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 2,230 | 87.1% |
| `edit` | 179 | 7% |
| `search` | 85 | 3.3% |
| `open` | 54 | 2.1% |
| `verify` | 13 | 0.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 50 | 79.4% |
| `delivery/pipeline-setup` | 3 | 4.8% |
| `docs/customer-doc` | 3 | 4.8% |
| `engineering/secrets-in-a-check` | 3 | 4.8% |
| `research/web-search` | 3 | 4.8% |
| `engineering/environment` | 1 | 1.6% |

## Last 30 days

247 sessions.

**Ran to an end without a report:** 45 of 238 sessions whose last run the core recorded as `completed` — 18.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**835,985,749 tokens** over 321 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,560 | 5,619,407 | 28,119,706 | 73,718,100 | 835,985,749 |
| messages per session | 117 | 307 | 705 | 731 | 39,267 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 103 | 41.7% |
| `engineer` | 78 | 31.6% |
| `atomaton` | 66 | 26.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,861 | 139 | 107 | 2% |
| `read` | 4,600 | 24 | 6 | 0.5% |
| `grep` | 3,470 | 93 | 14 | 2.7% |
| `edit` | 1,881 | 31 | 0 | 1.6% |
| `fetch` | 768 | 57 | 0 | 7.4% |
| `get_issue` | 332 | 14 | 5 | 4.2% |
| `get_issue_comments` | 313 | 0 | 10 | 0% |
| `get_pr` | 304 | 9 | 3 | 3% |
| `get_check_runs` | 295 | 12 | 0 | 4.1% |
| `shell__shell_execute` | 279 | 3 | 0 | 1.1% |
| `list` | 269 | 2 | 0 | 0.7% |
| `glob` | 243 | 1 | 1 | 0.4% |
| `get_branch` | 186 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 185 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 181 | 0 | 0 | 0% |
| `commit_and_push` | 169 | 8 | 0 | 4.7% |
| `write` | 147 | 2 | 0 | 1.4% |
| `create_pr` | 145 | 46 | 0 | 31.7% |
| `search_issues` | 121 | 0 | 3 | 0% |
| `get_pr_diff` | 120 | 3 | 0 | 2.5% |
| `request_close_issue` | 89 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 65 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `merge_pr` | 58 | 0 | 0 | 0% |
| `list_pr_review_comments` | 49 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `search_code` | 40 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `delegate` | 28 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `load_skill` | 26 | 9 | 0 | 34.6% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `web__fetch` | 22 | 1 | 0 | 4.5% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `github__get_issue` | 5 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_issue_comments` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `github__commit_and_push` | 1 | 0 | 0 | 0% |
| `github__create_pr` | 1 | 0 | 0 | 0% |
| `github__get_branch` | 1 | 0 | 0 | 0% |
| `github__get_check_runs` | 1 | 0 | 0 | 0% |
| `github__get_pr` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `github__list_prs` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,432 | 79.2% |
| `edit` | 502 | 7.3% |
| `search` | 483 | 7% |
| `verify` | 237 | 3.5% |
| `open` | 207 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 186 | 88.2% |
| `delivery/pipeline-setup` | 6 | 2.8% |
| `engineering/secrets-in-a-check` | 6 | 2.8% |
| `research/web-search` | 6 | 2.8% |
| `docs/customer-doc` | 3 | 1.4% |
| `engineering/environment` | 3 | 1.4% |
| `docs/design-doc` | 1 | 0.5% |

## Last year

267 sessions.

**Ran to an end without a report:** 51 of 257 sessions whose last run the core recorded as `completed` — 19.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**955,804,426 tokens** over 341 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 5,758,740 | 28,119,706 | 73,718,100 | 955,804,426 |
| messages per session | 121 | 330 | 705 | 731 | 43,948 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 107 | 40.1% |
| `engineer` | 85 | 31.8% |
| `atomaton` | 75 | 28.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,861 | 139 | 107 | 2% |
| `read` | 5,251 | 27 | 8 | 0.5% |
| `grep` | 3,854 | 101 | 18 | 2.6% |
| `edit` | 1,988 | 31 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 768 | 57 | 0 | 7.4% |
| `get_issue` | 332 | 14 | 5 | 4.2% |
| `list` | 326 | 3 | 0 | 0.9% |
| `get_issue_comments` | 313 | 0 | 10 | 0% |
| `get_pr` | 304 | 9 | 3 | 3% |
| `get_check_runs` | 295 | 12 | 0 | 4.1% |
| `glob` | 260 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 186 | 0 | 0 | 0% |
| `check_merge_readiness` | 181 | 0 | 0 | 0% |
| `write` | 176 | 2 | 0 | 1.1% |
| `commit_and_push` | 169 | 8 | 0 | 4.7% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `create_pr` | 145 | 46 | 0 | 31.7% |
| `search_issues` | 121 | 0 | 3 | 0% |
| `get_pr_diff` | 120 | 3 | 0 | 2.5% |
| `request_close_issue` | 89 | 1 | 0 | 1.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr_reviews` | 65 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `merge_pr` | 58 | 0 | 0 | 0% |
| `list_pr_review_comments` | 49 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `search_code` | 40 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `load_skill` | 26 | 9 | 0 | 34.6% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,432 | 79.2% |
| `edit` | 502 | 7.3% |
| `search` | 483 | 7% |
| `verify` | 237 | 3.5% |
| `open` | 207 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 203 | 86% |
| `delivery/pipeline-setup` | 10 | 4.2% |
| `engineering/environment` | 7 | 3% |
| `engineering/secrets-in-a-check` | 6 | 2.5% |
| `research/web-search` | 6 | 2.5% |
| `docs/customer-doc` | 3 | 1.3% |
| `docs/design-doc` | 1 | 0.4% |

## All time

282 sessions.

**Ran to an end without a report:** 51 of 257 sessions whose last run the core recorded as `completed` — 19.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 15 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**955,804,426 tokens** over 341 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 5,758,740 | 28,119,706 | 73,718,100 | 955,804,426 |
| messages per session | 114 | 327 | 705 | 731 | 44,026 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 111 | 39.4% |
| `engineer` | 93 | 33% |
| `atomaton` | 78 | 27.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,861 | 139 | 107 | 2% |
| `read` | 5,251 | 27 | 8 | 0.5% |
| `grep` | 3,854 | 101 | 18 | 2.6% |
| `edit` | 1,988 | 31 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 768 | 57 | 0 | 7.4% |
| `get_issue` | 332 | 14 | 5 | 4.2% |
| `list` | 326 | 3 | 0 | 0.9% |
| `get_issue_comments` | 313 | 0 | 10 | 0% |
| `get_pr` | 304 | 9 | 3 | 3% |
| `get_check_runs` | 295 | 12 | 0 | 4.1% |
| `glob` | 260 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 186 | 0 | 0 | 0% |
| `check_merge_readiness` | 181 | 0 | 0 | 0% |
| `write` | 176 | 2 | 0 | 1.1% |
| `commit_and_push` | 169 | 8 | 0 | 4.7% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `create_pr` | 145 | 46 | 0 | 31.7% |
| `search_issues` | 121 | 0 | 3 | 0% |
| `get_pr_diff` | 120 | 3 | 0 | 2.5% |
| `request_close_issue` | 89 | 1 | 0 | 1.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr_reviews` | 65 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `merge_pr` | 58 | 0 | 0 | 0% |
| `list_pr_review_comments` | 49 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `search_code` | 40 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `load_skill` | 26 | 9 | 0 | 34.6% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,432 | 79.2% |
| `edit` | 502 | 7.3% |
| `search` | 483 | 7% |
| `verify` | 237 | 3.5% |
| `open` | 207 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 203 | 86% |
| `delivery/pipeline-setup` | 10 | 4.2% |
| `engineering/environment` | 7 | 3% |
| `engineering/secrets-in-a-check` | 6 | 2.5% |
| `research/web-search` | 6 | 2.5% |
| `docs/customer-doc` | 3 | 1.3% |
| `docs/design-doc` | 1 | 0.4% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-08 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/atomaton-surface`
