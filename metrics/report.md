# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-03.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 76 | 1.3% | 240 | 2,509 | 7 | 27.6 |
| Last 30 days | 481 | 5.4% | 246 | 9,859 | 15 | 17.0 |
| Last year | 502 | 5.2% | 253 | 10,246 | 15 | 17.6 |
| All time | 502 | 5.2% | 253 | 10,246 | 15 | 17.6 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 476 |
| `failed` | 16 |
| `stopped` | 10 |

## Last 7 days

27 sessions.

**Ran to an end without a report:** 3 of 27 sessions whose last run the core recorded as `completed` — 11.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**56,595,053 tokens** over 35 runs that reported them, **98.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 3,138,778 | 8,959,867 | 8,959,867 | 56,595,053 |
| messages per session | 89 | 239 | 292 | 292 | 2,956 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 10 | 37% |
| `reviewer` | 9 | 33.3% |
| `atomaton` | 8 | 29.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 501 | 20 | 9 | 4% |
| `read` | 337 | 2 | 0 | 0.6% |
| `grep` | 226 | 9 | 0 | 4% |
| `edit` | 70 | 1 | 0 | 1.4% |
| `fetch` | 67 | 2 | 0 | 3% |
| `list` | 27 | 0 | 0 | 0% |
| `glob` | 24 | 0 | 0 | 0% |
| `get_check_runs` | 22 | 1 | 0 | 4.5% |
| `get_pr` | 21 | 0 | 0 | 0% |
| `check_merge_readiness` | 19 | 0 | 0 | 0% |
| `commit_and_push` | 18 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 17 | 0 | 0 | 0% |
| `get_issue_comments` | 17 | 0 | 0 | 0% |
| `create_pr` | 12 | 3 | 0 | 25% |
| `get_branch` | 12 | 0 | 0 | 0% |
| `write` | 9 | 0 | 0 | 0% |
| `get_issue` | 8 | 0 | 0 | 0% |
| `get_pr_diff` | 8 | 0 | 0 | 0% |
| `get_pr_reviews` | 8 | 0 | 0 | 0% |
| `merge_pr` | 8 | 0 | 0 | 0% |
| `request_close_issue` | 8 | 0 | 0 | 0% |
| `create_sub_issue` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 0 | 0 | 0% |
| `list_pr_review_comments` | 5 | 0 | 0 | 0% |
| `delegate` | 3 | 0 | 0 | 0% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `search_code` | 3 | 0 | 0 | 0% |
| `create_root_issue` | 2 | 0 | 0 | 0% |
| `list_prs` | 2 | 0 | 0 | 0% |
| `search_issues` | 2 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `load_skill` | 1 | 1 | 0 | 100% |
| `publish_draft` | 1 | 0 | 0 | 0% |
| `search_remote_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 396 | 79% |
| `edit` | 70 | 14% |
| `search` | 19 | 3.8% |
| `open` | 10 | 2% |
| `verify` | 6 | 1.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 12 | 66.7% |
| `docs/customer-doc` | 2 | 11.1% |
| `research/web-search` | 2 | 11.1% |
| `engineering/environment` | 1 | 5.6% |
| `engineering/secrets-in-a-check` | 1 | 5.6% |

## Last 30 days

201 sessions.

**Ran to an end without a report:** 41 of 195 sessions whose last run the core recorded as `completed` — 21%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**633,845,877 tokens** over 255 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,201,847 | 5,175,119 | 28,119,706 | 73,718,100 | 633,845,877 |
| messages per session | 110 | 303 | 705 | 731 | 31,123 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 86 | 42.8% |
| `engineer` | 58 | 28.9% |
| `atomaton` | 57 | 28.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,703 | 90 | 78 | 1.9% |
| `read` | 3,855 | 22 | 7 | 0.6% |
| `grep` | 2,739 | 70 | 8 | 2.6% |
| `edit` | 1,516 | 25 | 0 | 1.6% |
| `shell__shell_execute` | 895 | 13 | 13 | 1.5% |
| `fetch` | 493 | 41 | 0 | 8.3% |
| `get_issue` | 279 | 13 | 5 | 4.7% |
| `get_issue_comments` | 265 | 0 | 10 | 0% |
| `get_pr` | 237 | 9 | 3 | 3.8% |
| `get_check_runs` | 234 | 11 | 0 | 4.7% |
| `list` | 222 | 2 | 0 | 0.9% |
| `glob` | 189 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 172 | 0 | 0 | 0% |
| `get_branch` | 155 | 0 | 0 | 0% |
| `check_merge_readiness` | 147 | 0 | 0 | 0% |
| `commit_and_push` | 125 | 8 | 0 | 6.4% |
| `create_pr` | 112 | 35 | 0 | 31.3% |
| `search_issues` | 111 | 0 | 3 | 0% |
| `write` | 101 | 1 | 0 | 1% |
| `get_pr_diff` | 98 | 3 | 0 | 3.1% |
| `web__fetch` | 87 | 8 | 0 | 9.2% |
| `request_close_issue` | 71 | 1 | 0 | 1.4% |
| `list_prs` | 46 | 0 | 0 | 0% |
| `get_pr_reviews` | 44 | 0 | 0 | 0% |
| `merge_pr` | 44 | 0 | 0 | 0% |
| `github__get_issue_comments` | 34 | 0 | 0 | 0% |
| `list_pr_review_comments` | 34 | 0 | 0 | 0% |
| `github__get_issue` | 31 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `create_root_issue` | 25 | 1 | 0 | 4% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `search_remote_code` | 24 | 6 | 0 | 25% |
| `github__get_check_runs` | 22 | 0 | 0 | 0% |
| `delegate` | 21 | 0 | 0 | 0% |
| `search__search_issues` | 21 | 0 | 0 | 0% |
| `launch_sub_agent` | 19 | 2 | 0 | 10.5% |
| `github__get_branch` | 17 | 0 | 0 | 0% |
| `github__list_prs` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `list_issues` | 14 | 0 | 0 | 0% |
| `github__get_pr` | 12 | 1 | 0 | 8.3% |
| `create_sub_issue` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__create_issue` | 9 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `github__commit_and_push` | 7 | 1 | 0 | 14.3% |
| `github__get_pr_reviews` | 6 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `github__get_pr_diff` | 5 | 0 | 0 | 0% |
| `github__list_issues` | 5 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 5 | 0 | 0 | 0% |
| `github__create_pr` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `publish_draft` | 3 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `delegate_readonly__run` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,519 | 74.8% |
| `search` | 414 | 8.8% |
| `edit` | 377 | 8% |
| `verify` | 230 | 4.9% |
| `open` | 163 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 155 | 88.6% |
| `engineering/environment` | 5 | 2.9% |
| `delivery/pipeline-setup` | 4 | 2.3% |
| `engineering/secrets-in-a-check` | 4 | 2.3% |
| `research/web-search` | 4 | 2.3% |
| `docs/customer-doc` | 2 | 1.1% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

214 sessions.

**Ran to an end without a report:** 45 of 208 sessions whose last run the core recorded as `completed` — 21.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**692,704,566 tokens** over 266 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 5,255,408 | 28,119,706 | 73,718,100 | 692,704,566 |
| messages per session | 111 | 323 | 705 | 731 | 33,709 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 88 | 41.1% |
| `atomaton` | 63 | 29.4% |
| `engineer` | 63 | 29.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,703 | 90 | 78 | 1.9% |
| `read` | 4,252 | 23 | 8 | 0.5% |
| `grep` | 2,969 | 74 | 8 | 2.5% |
| `edit` | 1,568 | 25 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 493 | 41 | 0 | 8.3% |
| `get_issue` | 279 | 13 | 5 | 4.7% |
| `list` | 266 | 3 | 0 | 1.1% |
| `get_issue_comments` | 265 | 0 | 10 | 0% |
| `get_pr` | 237 | 9 | 3 | 3.8% |
| `get_check_runs` | 234 | 11 | 0 | 4.7% |
| `glob` | 199 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 187 | 0 | 0 | 0% |
| `get_branch` | 155 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `check_merge_readiness` | 147 | 0 | 0 | 0% |
| `commit_and_push` | 125 | 8 | 0 | 6.4% |
| `write` | 121 | 1 | 0 | 0.8% |
| `create_pr` | 112 | 35 | 0 | 31.3% |
| `search_issues` | 111 | 0 | 3 | 0% |
| `get_pr_diff` | 98 | 3 | 0 | 3.1% |
| `request_close_issue` | 71 | 1 | 0 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 46 | 0 | 0 | 0% |
| `get_pr_reviews` | 44 | 0 | 0 | 0% |
| `merge_pr` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `list_pr_review_comments` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `create_root_issue` | 25 | 1 | 0 | 4% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `search_remote_code` | 24 | 6 | 0 | 25% |
| `delegate` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 19 | 2 | 0 | 10.5% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 14 | 0 | 0 | 0% |
| `create_sub_issue` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
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
| `publish_draft` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,519 | 74.8% |
| `search` | 414 | 8.8% |
| `edit` | 377 | 8% |
| `verify` | 230 | 4.9% |
| `open` | 163 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 165 | 86.8% |
| `delivery/pipeline-setup` | 7 | 3.7% |
| `engineering/environment` | 7 | 3.7% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `research/web-search` | 4 | 2.1% |
| `docs/customer-doc` | 2 | 1.1% |
| `docs/design-doc` | 1 | 0.5% |

## All time

218 sessions.

**Ran to an end without a report:** 45 of 208 sessions whose last run the core recorded as `completed` — 21.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 4 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**692,704,566 tokens** over 266 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 5,255,408 | 28,119,706 | 73,718,100 | 692,704,566 |
| messages per session | 110 | 323 | 705 | 731 | 33,728 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 88 | 40.4% |
| `atomaton` | 65 | 29.8% |
| `engineer` | 65 | 29.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,703 | 90 | 78 | 1.9% |
| `read` | 4,252 | 23 | 8 | 0.5% |
| `grep` | 2,969 | 74 | 8 | 2.5% |
| `edit` | 1,568 | 25 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 493 | 41 | 0 | 8.3% |
| `get_issue` | 279 | 13 | 5 | 4.7% |
| `list` | 266 | 3 | 0 | 1.1% |
| `get_issue_comments` | 265 | 0 | 10 | 0% |
| `get_pr` | 237 | 9 | 3 | 3.8% |
| `get_check_runs` | 234 | 11 | 0 | 4.7% |
| `glob` | 199 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 187 | 0 | 0 | 0% |
| `get_branch` | 155 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `check_merge_readiness` | 147 | 0 | 0 | 0% |
| `commit_and_push` | 125 | 8 | 0 | 6.4% |
| `write` | 121 | 1 | 0 | 0.8% |
| `create_pr` | 112 | 35 | 0 | 31.3% |
| `search_issues` | 111 | 0 | 3 | 0% |
| `get_pr_diff` | 98 | 3 | 0 | 3.1% |
| `request_close_issue` | 71 | 1 | 0 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 46 | 0 | 0 | 0% |
| `get_pr_reviews` | 44 | 0 | 0 | 0% |
| `merge_pr` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `list_pr_review_comments` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `create_root_issue` | 25 | 1 | 0 | 4% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `search_remote_code` | 24 | 6 | 0 | 25% |
| `delegate` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 19 | 2 | 0 | 10.5% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 14 | 0 | 0 | 0% |
| `create_sub_issue` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
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
| `publish_draft` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,519 | 74.8% |
| `search` | 414 | 8.8% |
| `edit` | 377 | 8% |
| `verify` | 230 | 4.9% |
| `open` | 163 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 165 | 86.8% |
| `delivery/pipeline-setup` | 7 | 3.7% |
| `engineering/environment` | 7 | 3.7% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `research/web-search` | 4 | 2.1% |
| `docs/customer-doc` | 2 | 1.1% |
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
