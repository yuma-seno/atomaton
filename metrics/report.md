# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-08.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 212 | 2.8% | 246 | 6,099 | 10 | 26.1 |
| Last 30 days | 615 | 4.7% | 245 | 9,859 | 13 | 18.3 |
| Last year | 652 | 4.9% | 256 | 10,246 | 15 | 19.0 |
| All time | 652 | 4.9% | 256 | 10,246 | 15 | 19.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 620 |
| `failed` | 21 |
| `stopped` | 11 |

## Last 7 days

74 sessions.

**Ran to an end without a report:** 8 of 70 sessions whose last run the core recorded as `completed` — 11.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**291,336,107 tokens** over 98 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,375,816 | 9,342,774 | 29,805,044 | 29,805,044 | 291,336,107 |
| messages per session | 144 | 330 | 439 | 439 | 12,338 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 30 | 40.5% |
| `reviewer` | 26 | 35.1% |
| `atomaton` | 18 | 24.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,494 | 63 | 36 | 2.5% |
| `read` | 1,227 | 5 | 0 | 0.4% |
| `grep` | 1,032 | 32 | 10 | 3.1% |
| `edit` | 482 | 7 | 0 | 1.5% |
| `fetch` | 306 | 15 | 0 | 4.9% |
| `get_pr` | 85 | 0 | 0 | 0% |
| `list` | 85 | 0 | 0 | 0% |
| `get_check_runs` | 77 | 2 | 0 | 2.6% |
| `glob` | 75 | 0 | 0 | 0% |
| `write` | 62 | 1 | 0 | 1.6% |
| `get_issue` | 58 | 1 | 0 | 1.7% |
| `get_issue_comments` | 58 | 0 | 0 | 0% |
| `commit_and_push` | 57 | 0 | 0 | 0% |
| `check_merge_readiness` | 49 | 0 | 0 | 0% |
| `create_pr` | 44 | 14 | 0 | 31.8% |
| `get_branch` | 43 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `get_pr_diff` | 29 | 0 | 0 | 0% |
| `get_pr_reviews` | 28 | 0 | 0 | 0% |
| `request_close_issue` | 25 | 0 | 0 | 0% |
| `merge_pr` | 21 | 0 | 0 | 0% |
| `list_pr_review_comments` | 20 | 0 | 0 | 0% |
| `load_skill` | 20 | 7 | 0 | 35% |
| `search_remote_code` | 18 | 6 | 0 | 33.3% |
| `create_sub_issue` | 16 | 0 | 0 | 0% |
| `list_prs` | 15 | 0 | 0 | 0% |
| `search_code` | 14 | 0 | 0 | 0% |
| `search_issues` | 13 | 0 | 0 | 0% |
| `launch_sub_agent` | 12 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `create_root_issue` | 7 | 0 | 0 | 0% |
| `delegate_readonly` | 5 | 0 | 0 | 0% |
| `delegate_large` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 4 | 0 | 100% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 2,169 | 87% |
| `edit` | 173 | 6.9% |
| `search` | 85 | 3.4% |
| `open` | 54 | 2.2% |
| `verify` | 13 | 0.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 49 | 83.1% |
| `delivery/pipeline-setup` | 3 | 5.1% |
| `docs/customer-doc` | 3 | 5.1% |
| `engineering/secrets-in-a-check` | 2 | 3.4% |
| `engineering/environment` | 1 | 1.7% |
| `research/web-search` | 1 | 1.7% |

## Last 30 days

245 sessions.

**Ran to an end without a report:** 44 of 236 sessions whose last run the core recorded as `completed` — 18.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**829,509,093 tokens** over 318 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,232,143 | 5,707,358 | 28,119,706 | 73,718,100 | 829,509,093 |
| messages per session | 120 | 306 | 705 | 731 | 39,009 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 103 | 42% |
| `engineer` | 78 | 31.8% |
| `atomaton` | 64 | 26.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,794 | 136 | 105 | 2% |
| `read` | 4,583 | 24 | 6 | 0.5% |
| `grep` | 3,463 | 93 | 14 | 2.7% |
| `edit` | 1,881 | 31 | 0 | 1.6% |
| `fetch` | 751 | 55 | 0 | 7.3% |
| `get_issue` | 329 | 14 | 5 | 4.3% |
| `get_issue_comments` | 308 | 0 | 10 | 0% |
| `get_pr` | 303 | 9 | 3 | 3% |
| `get_check_runs` | 291 | 12 | 0 | 4.1% |
| `shell__shell_execute` | 279 | 3 | 0 | 1.1% |
| `list` | 267 | 2 | 0 | 0.7% |
| `glob` | 239 | 1 | 1 | 0.4% |
| `get_branch` | 186 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 185 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 178 | 0 | 0 | 0% |
| `commit_and_push` | 168 | 8 | 0 | 4.8% |
| `create_pr` | 145 | 46 | 0 | 31.7% |
| `write` | 145 | 2 | 0 | 1.4% |
| `search_issues` | 121 | 0 | 3 | 0% |
| `get_pr_diff` | 120 | 3 | 0 | 2.5% |
| `request_close_issue` | 88 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 65 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `merge_pr` | 58 | 0 | 0 | 0% |
| `list_pr_review_comments` | 49 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `search_code` | 38 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `delegate` | 28 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `load_skill` | 22 | 9 | 0 | 40.9% |
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
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_issue_comments` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
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
| `other` | 5,371 | 79.1% |
| `edit` | 496 | 7.3% |
| `search` | 483 | 7.1% |
| `verify` | 237 | 3.5% |
| `open` | 207 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 185 | 89.4% |
| `delivery/pipeline-setup` | 6 | 2.9% |
| `engineering/secrets-in-a-check` | 5 | 2.4% |
| `research/web-search` | 4 | 1.9% |
| `docs/customer-doc` | 3 | 1.4% |
| `engineering/environment` | 3 | 1.4% |
| `docs/design-doc` | 1 | 0.5% |

## Last year

265 sessions.

**Ran to an end without a report:** 50 of 255 sessions whose last run the core recorded as `completed` — 19.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**949,327,770 tokens** over 338 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 5,781,615 | 28,119,706 | 73,718,100 | 949,327,770 |
| messages per session | 123 | 327 | 705 | 731 | 43,690 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 107 | 40.4% |
| `engineer` | 85 | 32.1% |
| `atomaton` | 73 | 27.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,794 | 136 | 105 | 2% |
| `read` | 5,234 | 27 | 8 | 0.5% |
| `grep` | 3,847 | 101 | 18 | 2.6% |
| `edit` | 1,988 | 31 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 751 | 55 | 0 | 7.3% |
| `get_issue` | 329 | 14 | 5 | 4.3% |
| `list` | 324 | 3 | 0 | 0.9% |
| `get_issue_comments` | 308 | 0 | 10 | 0% |
| `get_pr` | 303 | 9 | 3 | 3% |
| `get_check_runs` | 291 | 12 | 0 | 4.1% |
| `glob` | 256 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 186 | 0 | 0 | 0% |
| `check_merge_readiness` | 178 | 0 | 0 | 0% |
| `write` | 174 | 2 | 0 | 1.1% |
| `commit_and_push` | 168 | 8 | 0 | 4.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `create_pr` | 145 | 46 | 0 | 31.7% |
| `search_issues` | 121 | 0 | 3 | 0% |
| `get_pr_diff` | 120 | 3 | 0 | 2.5% |
| `request_close_issue` | 88 | 1 | 0 | 1.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr_reviews` | 65 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `merge_pr` | 58 | 0 | 0 | 0% |
| `list_pr_review_comments` | 49 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `search_code` | 38 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `load_skill` | 22 | 9 | 0 | 40.9% |
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
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
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
| `other` | 5,371 | 79.1% |
| `edit` | 496 | 7.3% |
| `search` | 483 | 7.1% |
| `verify` | 237 | 3.5% |
| `open` | 207 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 202 | 87.1% |
| `delivery/pipeline-setup` | 10 | 4.3% |
| `engineering/environment` | 7 | 3% |
| `engineering/secrets-in-a-check` | 5 | 2.2% |
| `research/web-search` | 4 | 1.7% |
| `docs/customer-doc` | 3 | 1.3% |
| `docs/design-doc` | 1 | 0.4% |

## All time

280 sessions.

**Ran to an end without a report:** 50 of 255 sessions whose last run the core recorded as `completed` — 19.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 15 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**949,327,770 tokens** over 338 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 5,781,615 | 28,119,706 | 73,718,100 | 949,327,770 |
| messages per session | 115 | 327 | 705 | 731 | 43,768 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 111 | 39.6% |
| `engineer` | 93 | 33.2% |
| `atomaton` | 76 | 27.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,794 | 136 | 105 | 2% |
| `read` | 5,234 | 27 | 8 | 0.5% |
| `grep` | 3,847 | 101 | 18 | 2.6% |
| `edit` | 1,988 | 31 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 751 | 55 | 0 | 7.3% |
| `get_issue` | 329 | 14 | 5 | 4.3% |
| `list` | 324 | 3 | 0 | 0.9% |
| `get_issue_comments` | 308 | 0 | 10 | 0% |
| `get_pr` | 303 | 9 | 3 | 3% |
| `get_check_runs` | 291 | 12 | 0 | 4.1% |
| `glob` | 256 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 186 | 0 | 0 | 0% |
| `check_merge_readiness` | 178 | 0 | 0 | 0% |
| `write` | 174 | 2 | 0 | 1.1% |
| `commit_and_push` | 168 | 8 | 0 | 4.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `create_pr` | 145 | 46 | 0 | 31.7% |
| `search_issues` | 121 | 0 | 3 | 0% |
| `get_pr_diff` | 120 | 3 | 0 | 2.5% |
| `request_close_issue` | 88 | 1 | 0 | 1.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr_reviews` | 65 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `merge_pr` | 58 | 0 | 0 | 0% |
| `list_pr_review_comments` | 49 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `search_code` | 38 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `load_skill` | 22 | 9 | 0 | 40.9% |
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
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
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
| `other` | 5,371 | 79.1% |
| `edit` | 496 | 7.3% |
| `search` | 483 | 7.1% |
| `verify` | 237 | 3.5% |
| `open` | 207 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 202 | 87.1% |
| `delivery/pipeline-setup` | 10 | 4.3% |
| `engineering/environment` | 7 | 3% |
| `engineering/secrets-in-a-check` | 5 | 2.2% |
| `research/web-search` | 4 | 1.7% |
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
