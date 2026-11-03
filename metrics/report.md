# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-03.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 82 | 1.2% | 238 | 2,509 | 7 | 19.1 |
| Last 30 days | 487 | 5.3% | 244 | 9,859 | 14 | 17.0 |
| Last year | 508 | 5.1% | 248 | 10,246 | 15 | 17.6 |
| All time | 508 | 5.1% | 248 | 10,246 | 15 | 17.6 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 482 |
| `failed` | 16 |
| `stopped` | 10 |

## Last 7 days

30 sessions.

**Ran to an end without a report:** 2 of 30 sessions whose last run the core recorded as `completed` — 6.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**59,066,207 tokens** over 39 runs that reported them, **98.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,105,637 | 3,138,778 | 8,959,867 | 8,959,867 | 59,066,207 |
| messages per session | 97 | 239 | 292 | 292 | 3,200 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 11 | 36.7% |
| `reviewer` | 11 | 36.7% |
| `atomaton` | 8 | 26.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 563 | 23 | 10 | 4.1% |
| `read` | 361 | 2 | 0 | 0.6% |
| `grep` | 235 | 9 | 0 | 3.8% |
| `edit` | 78 | 1 | 0 | 1.3% |
| `fetch` | 68 | 2 | 0 | 2.9% |
| `list` | 29 | 0 | 0 | 0% |
| `glob` | 25 | 0 | 0 | 0% |
| `get_check_runs` | 24 | 1 | 0 | 4.2% |
| `get_pr` | 24 | 0 | 0 | 0% |
| `check_merge_readiness` | 21 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 20 | 0 | 0 | 0% |
| `commit_and_push` | 20 | 0 | 0 | 0% |
| `get_issue_comments` | 18 | 0 | 0 | 0% |
| `create_pr` | 13 | 3 | 0 | 23.1% |
| `get_branch` | 13 | 0 | 0 | 0% |
| `get_issue` | 10 | 0 | 0 | 0% |
| `get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `write` | 10 | 0 | 0 | 0% |
| `get_pr_diff` | 9 | 0 | 0 | 0% |
| `request_close_issue` | 9 | 0 | 0 | 0% |
| `create_sub_issue` | 7 | 0 | 0 | 0% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 0 | 0 | 0% |
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
| `other` | 439 | 78% |
| `edit` | 82 | 14.6% |
| `search` | 22 | 3.9% |
| `open` | 13 | 2.3% |
| `verify` | 7 | 1.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 15 | 71.4% |
| `docs/customer-doc` | 2 | 9.5% |
| `research/web-search` | 2 | 9.5% |
| `engineering/environment` | 1 | 4.8% |
| `engineering/secrets-in-a-check` | 1 | 4.8% |

## Last 30 days

204 sessions.

**Ran to an end without a report:** 40 of 198 sessions whose last run the core recorded as `completed` — 20.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**636,317,031 tokens** over 259 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,191,474 | 5,175,119 | 28,119,706 | 73,718,100 | 636,317,031 |
| messages per session | 110 | 303 | 705 | 731 | 31,367 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 88 | 43.1% |
| `engineer` | 59 | 28.9% |
| `atomaton` | 57 | 27.9% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,765 | 93 | 79 | 2% |
| `read` | 3,879 | 22 | 7 | 0.6% |
| `grep` | 2,748 | 70 | 8 | 2.5% |
| `edit` | 1,524 | 25 | 0 | 1.6% |
| `shell__shell_execute` | 895 | 13 | 13 | 1.5% |
| `fetch` | 494 | 41 | 0 | 8.3% |
| `get_issue` | 281 | 13 | 5 | 4.6% |
| `get_issue_comments` | 266 | 0 | 10 | 0% |
| `get_pr` | 240 | 9 | 3 | 3.8% |
| `get_check_runs` | 236 | 11 | 0 | 4.7% |
| `list` | 224 | 2 | 0 | 0.9% |
| `glob` | 190 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 175 | 0 | 0 | 0% |
| `get_branch` | 156 | 0 | 0 | 0% |
| `check_merge_readiness` | 149 | 0 | 0 | 0% |
| `commit_and_push` | 127 | 8 | 0 | 6.3% |
| `create_pr` | 113 | 35 | 0 | 31% |
| `search_issues` | 111 | 0 | 3 | 0% |
| `write` | 102 | 1 | 0 | 1% |
| `get_pr_diff` | 99 | 3 | 0 | 3% |
| `web__fetch` | 87 | 8 | 0 | 9.2% |
| `request_close_issue` | 72 | 1 | 0 | 1.4% |
| `get_pr_reviews` | 46 | 0 | 0 | 0% |
| `list_prs` | 46 | 0 | 0 | 0% |
| `merge_pr` | 46 | 0 | 0 | 0% |
| `list_pr_review_comments` | 36 | 0 | 0 | 0% |
| `github__get_issue_comments` | 34 | 0 | 0 | 0% |
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
| `other` | 3,562 | 74.8% |
| `search` | 417 | 8.8% |
| `edit` | 389 | 8.2% |
| `verify` | 231 | 4.8% |
| `open` | 166 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 158 | 88.8% |
| `engineering/environment` | 5 | 2.8% |
| `delivery/pipeline-setup` | 4 | 2.2% |
| `engineering/secrets-in-a-check` | 4 | 2.2% |
| `research/web-search` | 4 | 2.2% |
| `docs/customer-doc` | 2 | 1.1% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

217 sessions.

**Ran to an end without a report:** 44 of 211 sessions whose last run the core recorded as `completed` — 20.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**695,175,720 tokens** over 270 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 5,255,408 | 28,119,706 | 73,718,100 | 695,175,720 |
| messages per session | 111 | 323 | 705 | 731 | 33,953 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 90 | 41.5% |
| `engineer` | 64 | 29.5% |
| `atomaton` | 63 | 29% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,765 | 93 | 79 | 2% |
| `read` | 4,276 | 23 | 8 | 0.5% |
| `grep` | 2,978 | 74 | 8 | 2.5% |
| `edit` | 1,576 | 25 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 494 | 41 | 0 | 8.3% |
| `get_issue` | 281 | 13 | 5 | 4.6% |
| `list` | 268 | 3 | 0 | 1.1% |
| `get_issue_comments` | 266 | 0 | 10 | 0% |
| `get_pr` | 240 | 9 | 3 | 3.8% |
| `get_check_runs` | 236 | 11 | 0 | 4.7% |
| `glob` | 200 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 190 | 0 | 0 | 0% |
| `get_branch` | 156 | 0 | 0 | 0% |
| `check_merge_readiness` | 149 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 127 | 8 | 0 | 6.3% |
| `write` | 122 | 1 | 0 | 0.8% |
| `create_pr` | 113 | 35 | 0 | 31% |
| `search_issues` | 111 | 0 | 3 | 0% |
| `get_pr_diff` | 99 | 3 | 0 | 3% |
| `request_close_issue` | 72 | 1 | 0 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 46 | 0 | 0 | 0% |
| `list_prs` | 46 | 0 | 0 | 0% |
| `merge_pr` | 46 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 36 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
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
| `other` | 3,562 | 74.8% |
| `search` | 417 | 8.8% |
| `edit` | 389 | 8.2% |
| `verify` | 231 | 4.8% |
| `open` | 166 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 168 | 87% |
| `delivery/pipeline-setup` | 7 | 3.6% |
| `engineering/environment` | 7 | 3.6% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `research/web-search` | 4 | 2.1% |
| `docs/customer-doc` | 2 | 1% |
| `docs/design-doc` | 1 | 0.5% |

## All time

221 sessions.

**Ran to an end without a report:** 44 of 211 sessions whose last run the core recorded as `completed` — 20.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 4 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**695,175,720 tokens** over 270 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 5,255,408 | 28,119,706 | 73,718,100 | 695,175,720 |
| messages per session | 110 | 306 | 705 | 731 | 33,972 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 90 | 40.7% |
| `engineer` | 66 | 29.9% |
| `atomaton` | 65 | 29.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,765 | 93 | 79 | 2% |
| `read` | 4,276 | 23 | 8 | 0.5% |
| `grep` | 2,978 | 74 | 8 | 2.5% |
| `edit` | 1,576 | 25 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 494 | 41 | 0 | 8.3% |
| `get_issue` | 281 | 13 | 5 | 4.6% |
| `list` | 268 | 3 | 0 | 1.1% |
| `get_issue_comments` | 266 | 0 | 10 | 0% |
| `get_pr` | 240 | 9 | 3 | 3.8% |
| `get_check_runs` | 236 | 11 | 0 | 4.7% |
| `glob` | 200 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 190 | 0 | 0 | 0% |
| `get_branch` | 156 | 0 | 0 | 0% |
| `check_merge_readiness` | 149 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 127 | 8 | 0 | 6.3% |
| `write` | 122 | 1 | 0 | 0.8% |
| `create_pr` | 113 | 35 | 0 | 31% |
| `search_issues` | 111 | 0 | 3 | 0% |
| `get_pr_diff` | 99 | 3 | 0 | 3% |
| `request_close_issue` | 72 | 1 | 0 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 46 | 0 | 0 | 0% |
| `list_prs` | 46 | 0 | 0 | 0% |
| `merge_pr` | 46 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 36 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
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
| `other` | 3,562 | 74.8% |
| `search` | 417 | 8.8% |
| `edit` | 389 | 8.2% |
| `verify` | 231 | 4.8% |
| `open` | 166 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 168 | 87% |
| `delivery/pipeline-setup` | 7 | 3.6% |
| `engineering/environment` | 7 | 3.6% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `research/web-search` | 4 | 2.1% |
| `docs/customer-doc` | 2 | 1% |
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
