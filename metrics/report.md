# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-03.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 57 | 1.8% | 240 | 2,509 | 11 | 15.2 |
| Last 30 days | 463 | 5.6% | 246 | 9,859 | 15 | 16.8 |
| Last year | 483 | 5.4% | 256 | 10,246 | 16 | 17.1 |
| All time | 483 | 5.4% | 256 | 10,246 | 16 | 17.1 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 457 |
| `failed` | 16 |
| `stopped` | 10 |

## Last 7 days

23 sessions.

**Ran to an end without a report:** 2 of 23 sessions whose last run the core recorded as `completed` — 8.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**54,494,539 tokens** over 33 runs that reported them, **98.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 3,138,778 | 8,959,867 | 8,959,867 | 54,494,539 |
| messages per session | 99 | 239 | 292 | 292 | 2,651 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 9 | 39.1% |
| `engineer` | 8 | 34.8% |
| `atomaton` | 6 | 26.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 437 | 19 | 9 | 4.3% |
| `read` | 315 | 2 | 0 | 0.6% |
| `grep` | 226 | 9 | 0 | 4% |
| `edit` | 66 | 1 | 0 | 1.5% |
| `fetch` | 63 | 2 | 0 | 3.2% |
| `list` | 27 | 0 | 0 | 0% |
| `glob` | 24 | 0 | 0 | 0% |
| `get_check_runs` | 22 | 1 | 0 | 4.5% |
| `get_pr` | 21 | 0 | 0 | 0% |
| `check_merge_readiness` | 18 | 0 | 0 | 0% |
| `get_issue_comments` | 17 | 0 | 0 | 0% |
| `commit_and_push` | 16 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 13 | 0 | 0 | 0% |
| `get_branch` | 11 | 0 | 0 | 0% |
| `create_pr` | 10 | 3 | 0 | 30% |
| `get_issue` | 8 | 0 | 0 | 0% |
| `get_pr_diff` | 8 | 0 | 0 | 0% |
| `get_pr_reviews` | 8 | 0 | 0 | 0% |
| `write` | 8 | 0 | 0 | 0% |
| `merge_pr` | 7 | 0 | 0 | 0% |
| `request_close_issue` | 6 | 0 | 0 | 0% |
| `list_pr_review_comments` | 5 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `launch_sub_agent` | 4 | 0 | 0 | 0% |
| `delegate` | 3 | 0 | 0 | 0% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `search_code` | 3 | 0 | 0 | 0% |
| `search_issues` | 2 | 0 | 0 | 0% |
| `create_root_issue` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `list_prs` | 1 | 0 | 0 | 0% |
| `load_skill` | 1 | 1 | 0 | 100% |
| `search_remote_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 354 | 81% |
| `edit` | 49 | 11.2% |
| `search` | 18 | 4.1% |
| `open` | 10 | 2.3% |
| `verify` | 6 | 1.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 10 | 71.4% |
| `research/web-search` | 2 | 14.3% |
| `engineering/environment` | 1 | 7.1% |
| `engineering/secrets-in-a-check` | 1 | 7.1% |

## Last 30 days

198 sessions.

**Ran to an end without a report:** 40 of 192 sessions whose last run the core recorded as `completed` — 20.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**636,659,536 tokens** over 254 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,211,508 | 5,175,119 | 28,119,706 | 73,718,100 | 636,659,536 |
| messages per session | 111 | 323 | 715 | 731 | 31,268 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 86 | 43.4% |
| `atomaton` | 56 | 28.3% |
| `engineer` | 56 | 28.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,639 | 89 | 78 | 1.9% |
| `read` | 3,863 | 22 | 7 | 0.6% |
| `grep` | 2,748 | 70 | 8 | 2.5% |
| `edit` | 1,512 | 25 | 0 | 1.7% |
| `shell__shell_execute` | 1,094 | 13 | 15 | 1.2% |
| `fetch` | 489 | 41 | 0 | 8.4% |
| `get_issue` | 279 | 13 | 5 | 4.7% |
| `get_issue_comments` | 265 | 0 | 10 | 0% |
| `get_pr` | 237 | 9 | 3 | 3.8% |
| `get_check_runs` | 234 | 11 | 0 | 4.7% |
| `list` | 222 | 2 | 0 | 0.9% |
| `glob` | 189 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 171 | 0 | 0 | 0% |
| `get_branch` | 154 | 0 | 0 | 0% |
| `check_merge_readiness` | 146 | 0 | 0 | 0% |
| `commit_and_push` | 123 | 8 | 0 | 6.5% |
| `search_issues` | 111 | 0 | 3 | 0% |
| `create_pr` | 110 | 35 | 0 | 31.8% |
| `write` | 101 | 1 | 0 | 1% |
| `get_pr_diff` | 98 | 3 | 0 | 3.1% |
| `web__fetch` | 93 | 8 | 0 | 8.6% |
| `request_close_issue` | 69 | 1 | 0 | 1.4% |
| `list_prs` | 45 | 0 | 0 | 0% |
| `get_pr_reviews` | 44 | 0 | 0 | 0% |
| `merge_pr` | 43 | 0 | 0 | 0% |
| `github__get_issue_comments` | 40 | 0 | 0 | 0% |
| `github__get_issue` | 38 | 0 | 0 | 0% |
| `list_pr_review_comments` | 34 | 0 | 0 | 0% |
| `search__search_issues` | 28 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `github__get_check_runs` | 26 | 0 | 0 | 0% |
| `create_root_issue` | 24 | 1 | 0 | 4.2% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `search_remote_code` | 24 | 6 | 0 | 25% |
| `delegate` | 21 | 0 | 0 | 0% |
| `github__list_prs` | 19 | 0 | 0 | 0% |
| `github__get_branch` | 17 | 0 | 0 | 0% |
| `launch_sub_agent` | 17 | 2 | 0 | 11.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__get_pr` | 15 | 1 | 0 | 6.7% |
| `list_issues` | 14 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__check_merge_readiness` | 10 | 0 | 0 | 0% |
| `github__create_issue` | 10 | 0 | 0 | 0% |
| `create_sub_issue` | 8 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `github__commit_and_push` | 7 | 1 | 0 | 14.3% |
| `github__get_pr_diff` | 6 | 0 | 0 | 0% |
| `github__list_issues` | 6 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `github__create_pr` | 4 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 3 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `search__search_code` | 2 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `delegate_readonly__run` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,477 | 75% |
| `search` | 413 | 8.9% |
| `edit` | 356 | 7.7% |
| `verify` | 230 | 5% |
| `open` | 163 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 154 | 88.5% |
| `engineering/environment` | 6 | 3.4% |
| `delivery/pipeline-setup` | 5 | 2.9% |
| `engineering/secrets-in-a-check` | 4 | 2.3% |
| `research/web-search` | 4 | 2.3% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

210 sessions.

**Ran to an end without a report:** 44 of 204 sessions whose last run the core recorded as `completed` — 21.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**690,604,052 tokens** over 264 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 5,255,408 | 28,119,706 | 73,718,100 | 690,604,052 |
| messages per session | 112 | 323 | 705 | 731 | 33,404 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 88 | 41.9% |
| `atomaton` | 61 | 29% |
| `engineer` | 61 | 29% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,639 | 89 | 78 | 1.9% |
| `read` | 4,230 | 23 | 8 | 0.5% |
| `grep` | 2,969 | 74 | 8 | 2.5% |
| `edit` | 1,564 | 25 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 489 | 41 | 0 | 8.4% |
| `get_issue` | 279 | 13 | 5 | 4.7% |
| `list` | 266 | 3 | 0 | 1.1% |
| `get_issue_comments` | 265 | 0 | 10 | 0% |
| `get_pr` | 237 | 9 | 3 | 3.8% |
| `get_check_runs` | 234 | 11 | 0 | 4.7% |
| `glob` | 199 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 183 | 0 | 0 | 0% |
| `get_branch` | 154 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `check_merge_readiness` | 146 | 0 | 0 | 0% |
| `commit_and_push` | 123 | 8 | 0 | 6.5% |
| `write` | 120 | 1 | 0 | 0.8% |
| `search_issues` | 111 | 0 | 3 | 0% |
| `create_pr` | 110 | 35 | 0 | 31.8% |
| `get_pr_diff` | 98 | 3 | 0 | 3.1% |
| `request_close_issue` | 69 | 1 | 0 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 45 | 0 | 0 | 0% |
| `get_pr_reviews` | 44 | 0 | 0 | 0% |
| `merge_pr` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `list_pr_review_comments` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `create_root_issue` | 24 | 1 | 0 | 4.2% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `search_remote_code` | 24 | 6 | 0 | 25% |
| `delegate` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 17 | 2 | 0 | 11.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 14 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `create_sub_issue` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,477 | 75% |
| `search` | 413 | 8.9% |
| `edit` | 356 | 7.7% |
| `verify` | 230 | 5% |
| `open` | 163 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 163 | 87.6% |
| `delivery/pipeline-setup` | 7 | 3.8% |
| `engineering/environment` | 7 | 3.8% |
| `engineering/secrets-in-a-check` | 4 | 2.2% |
| `research/web-search` | 4 | 2.2% |
| `docs/design-doc` | 1 | 0.5% |

## All time

214 sessions.

**Ran to an end without a report:** 44 of 204 sessions whose last run the core recorded as `completed` — 21.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 4 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**690,604,052 tokens** over 264 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 5,255,408 | 28,119,706 | 73,718,100 | 690,604,052 |
| messages per session | 111 | 323 | 705 | 731 | 33,423 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 88 | 41.1% |
| `atomaton` | 63 | 29.4% |
| `engineer` | 63 | 29.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,639 | 89 | 78 | 1.9% |
| `read` | 4,230 | 23 | 8 | 0.5% |
| `grep` | 2,969 | 74 | 8 | 2.5% |
| `edit` | 1,564 | 25 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 489 | 41 | 0 | 8.4% |
| `get_issue` | 279 | 13 | 5 | 4.7% |
| `list` | 266 | 3 | 0 | 1.1% |
| `get_issue_comments` | 265 | 0 | 10 | 0% |
| `get_pr` | 237 | 9 | 3 | 3.8% |
| `get_check_runs` | 234 | 11 | 0 | 4.7% |
| `glob` | 199 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 183 | 0 | 0 | 0% |
| `get_branch` | 154 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `check_merge_readiness` | 146 | 0 | 0 | 0% |
| `commit_and_push` | 123 | 8 | 0 | 6.5% |
| `write` | 120 | 1 | 0 | 0.8% |
| `search_issues` | 111 | 0 | 3 | 0% |
| `create_pr` | 110 | 35 | 0 | 31.8% |
| `get_pr_diff` | 98 | 3 | 0 | 3.1% |
| `request_close_issue` | 69 | 1 | 0 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 45 | 0 | 0 | 0% |
| `get_pr_reviews` | 44 | 0 | 0 | 0% |
| `merge_pr` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `list_pr_review_comments` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `create_root_issue` | 24 | 1 | 0 | 4.2% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `search_remote_code` | 24 | 6 | 0 | 25% |
| `delegate` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 17 | 2 | 0 | 11.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 14 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `create_sub_issue` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,477 | 75% |
| `search` | 413 | 8.9% |
| `edit` | 356 | 7.7% |
| `verify` | 230 | 5% |
| `open` | 163 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 163 | 87.6% |
| `delivery/pipeline-setup` | 7 | 3.8% |
| `engineering/environment` | 7 | 3.8% |
| `engineering/secrets-in-a-check` | 4 | 2.2% |
| `research/web-search` | 4 | 2.2% |
| `docs/design-doc` | 1 | 0.5% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-03 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
