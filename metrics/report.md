# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-03.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 44 | 2.3% | 258 | 2,509 | 12 | 15.0 |
| Last 30 days | 448 | 5.8% | 256 | 9,859 | 16 | 16.9 |
| Last year | 468 | 5.6% | 261 | 10,246 | 16 | 17.2 |
| All time | 468 | 5.6% | 261 | 10,246 | 16 | 17.2 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 442 |
| `failed` | 16 |
| `stopped` | 10 |

## Last 7 days

19 sessions.

**Ran to an end without a report:** 3 of 19 sessions whose last run the core recorded as `completed` — 15.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**49,872,040 tokens** over 26 runs that reported them, **98.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,671,616 | 5,175,119 | 8,959,867 | 8,959,867 | 49,872,040 |
| messages per session | 97 | 269 | 292 | 292 | 2,328 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 7 | 36.8% |
| `reviewer` | 7 | 36.8% |
| `atomaton` | 5 | 26.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 429 | 18 | 8 | 4.2% |
| `read` | 289 | 2 | 0 | 0.7% |
| `grep` | 177 | 7 | 0 | 4% |
| `edit` | 65 | 1 | 0 | 1.5% |
| `fetch` | 42 | 2 | 0 | 4.8% |
| `list` | 24 | 0 | 0 | 0% |
| `glob` | 22 | 0 | 0 | 0% |
| `commit_and_push` | 15 | 0 | 0 | 0% |
| `get_issue_comments` | 15 | 0 | 0 | 0% |
| `get_pr` | 15 | 0 | 0 | 0% |
| `get_check_runs` | 13 | 1 | 0 | 7.7% |
| `atoma_builtin__load_skill` | 11 | 0 | 0 | 0% |
| `check_merge_readiness` | 11 | 0 | 0 | 0% |
| `create_pr` | 9 | 3 | 0 | 33.3% |
| `get_issue` | 8 | 0 | 0 | 0% |
| `write` | 8 | 0 | 0 | 0% |
| `get_pr_reviews` | 7 | 0 | 0 | 0% |
| `get_branch` | 6 | 0 | 0 | 0% |
| `get_pr_diff` | 6 | 0 | 0 | 0% |
| `list_pr_review_comments` | 5 | 0 | 0 | 0% |
| `merge_pr` | 5 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `launch_sub_agent` | 4 | 0 | 0 | 0% |
| `request_close_issue` | 4 | 0 | 0 | 0% |
| `delegate` | 3 | 0 | 0 | 0% |
| `search_code` | 3 | 0 | 0 | 0% |
| `delegate_readonly` | 2 | 0 | 0 | 0% |
| `search_issues` | 2 | 0 | 0 | 0% |
| `create_root_issue` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `list_prs` | 1 | 0 | 0 | 0% |
| `load_skill` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 346 | 80.7% |
| `edit` | 49 | 11.4% |
| `search` | 18 | 4.2% |
| `open` | 10 | 2.3% |
| `verify` | 6 | 1.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 8 | 66.7% |
| `research/web-search` | 2 | 16.7% |
| `engineering/environment` | 1 | 8.3% |
| `engineering/secrets-in-a-check` | 1 | 8.3% |

## Last 30 days

195 sessions.

**Ran to an end without a report:** 41 of 189 sessions whose last run the core recorded as `completed` — 21.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**632,037,037 tokens** over 247 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,232,143 | 5,246,133 | 28,119,706 | 73,718,100 | 632,037,037 |
| messages per session | 111 | 323 | 715 | 731 | 31,085 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 85 | 43.6% |
| `atomaton` | 55 | 28.2% |
| `engineer` | 55 | 28.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,631 | 88 | 77 | 1.9% |
| `read` | 3,851 | 22 | 7 | 0.6% |
| `grep` | 2,732 | 70 | 8 | 2.6% |
| `edit` | 1,511 | 25 | 0 | 1.7% |
| `shell__shell_execute` | 1,094 | 13 | 15 | 1.2% |
| `fetch` | 480 | 41 | 0 | 8.5% |
| `get_issue` | 279 | 13 | 5 | 4.7% |
| `get_issue_comments` | 265 | 0 | 10 | 0% |
| `get_pr` | 233 | 9 | 3 | 3.9% |
| `get_check_runs` | 227 | 11 | 0 | 4.8% |
| `list` | 221 | 2 | 0 | 0.9% |
| `glob` | 189 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 170 | 0 | 0 | 0% |
| `get_branch` | 149 | 0 | 0 | 0% |
| `check_merge_readiness` | 140 | 0 | 0 | 0% |
| `commit_and_push` | 122 | 8 | 0 | 6.6% |
| `search_issues` | 111 | 0 | 3 | 0% |
| `create_pr` | 109 | 35 | 0 | 32.1% |
| `write` | 101 | 1 | 0 | 1% |
| `get_pr_diff` | 98 | 3 | 0 | 3.1% |
| `web__fetch` | 93 | 8 | 0 | 8.6% |
| `request_close_issue` | 67 | 1 | 0 | 1.5% |
| `list_prs` | 45 | 0 | 0 | 0% |
| `get_pr_reviews` | 43 | 0 | 0 | 0% |
| `merge_pr` | 41 | 0 | 0 | 0% |
| `github__get_issue_comments` | 40 | 0 | 0 | 0% |
| `github__get_issue` | 38 | 0 | 0 | 0% |
| `list_pr_review_comments` | 34 | 0 | 0 | 0% |
| `search__search_issues` | 28 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `github__get_check_runs` | 26 | 0 | 0 | 0% |
| `create_root_issue` | 24 | 1 | 0 | 4.2% |
| `delegate_readonly` | 23 | 0 | 0 | 0% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
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
| `other` | 3,469 | 74.9% |
| `search` | 413 | 8.9% |
| `edit` | 356 | 7.7% |
| `verify` | 230 | 5% |
| `open` | 163 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 153 | 88.4% |
| `engineering/environment` | 6 | 3.5% |
| `delivery/pipeline-setup` | 5 | 2.9% |
| `engineering/secrets-in-a-check` | 4 | 2.3% |
| `research/web-search` | 4 | 2.3% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

207 sessions.

**Ran to an end without a report:** 45 of 201 sessions whose last run the core recorded as `completed` — 22.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**685,981,553 tokens** over 257 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 5,484,738 | 28,119,706 | 73,718,100 | 685,981,553 |
| messages per session | 113 | 323 | 705 | 731 | 33,221 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 87 | 42% |
| `atomaton` | 60 | 29% |
| `engineer` | 60 | 29% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,631 | 88 | 77 | 1.9% |
| `read` | 4,218 | 23 | 8 | 0.5% |
| `grep` | 2,953 | 74 | 8 | 2.5% |
| `edit` | 1,563 | 25 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 480 | 41 | 0 | 8.5% |
| `get_issue` | 279 | 13 | 5 | 4.7% |
| `get_issue_comments` | 265 | 0 | 10 | 0% |
| `list` | 265 | 3 | 0 | 1.1% |
| `get_pr` | 233 | 9 | 3 | 3.9% |
| `get_check_runs` | 227 | 11 | 0 | 4.8% |
| `glob` | 199 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 182 | 0 | 0 | 0% |
| `get_branch` | 149 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `check_merge_readiness` | 140 | 0 | 0 | 0% |
| `commit_and_push` | 122 | 8 | 0 | 6.6% |
| `write` | 120 | 1 | 0 | 0.8% |
| `search_issues` | 111 | 0 | 3 | 0% |
| `create_pr` | 109 | 35 | 0 | 32.1% |
| `get_pr_diff` | 98 | 3 | 0 | 3.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `request_close_issue` | 67 | 1 | 0 | 1.5% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 45 | 0 | 0 | 0% |
| `get_pr_reviews` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `merge_pr` | 41 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `list_pr_review_comments` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `create_root_issue` | 24 | 1 | 0 | 4.2% |
| `delegate_readonly` | 23 | 0 | 0 | 0% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
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
| `other` | 3,469 | 74.9% |
| `search` | 413 | 8.9% |
| `edit` | 356 | 7.7% |
| `verify` | 230 | 5% |
| `open` | 163 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 162 | 87.6% |
| `delivery/pipeline-setup` | 7 | 3.8% |
| `engineering/environment` | 7 | 3.8% |
| `engineering/secrets-in-a-check` | 4 | 2.2% |
| `research/web-search` | 4 | 2.2% |
| `docs/design-doc` | 1 | 0.5% |

## All time

211 sessions.

**Ran to an end without a report:** 45 of 201 sessions whose last run the core recorded as `completed` — 22.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 4 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**685,981,553 tokens** over 257 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 5,484,738 | 28,119,706 | 73,718,100 | 685,981,553 |
| messages per session | 111 | 323 | 705 | 731 | 33,240 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 87 | 41.2% |
| `atomaton` | 62 | 29.4% |
| `engineer` | 62 | 29.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,631 | 88 | 77 | 1.9% |
| `read` | 4,218 | 23 | 8 | 0.5% |
| `grep` | 2,953 | 74 | 8 | 2.5% |
| `edit` | 1,563 | 25 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 480 | 41 | 0 | 8.5% |
| `get_issue` | 279 | 13 | 5 | 4.7% |
| `get_issue_comments` | 265 | 0 | 10 | 0% |
| `list` | 265 | 3 | 0 | 1.1% |
| `get_pr` | 233 | 9 | 3 | 3.9% |
| `get_check_runs` | 227 | 11 | 0 | 4.8% |
| `glob` | 199 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 182 | 0 | 0 | 0% |
| `get_branch` | 149 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `check_merge_readiness` | 140 | 0 | 0 | 0% |
| `commit_and_push` | 122 | 8 | 0 | 6.6% |
| `write` | 120 | 1 | 0 | 0.8% |
| `search_issues` | 111 | 0 | 3 | 0% |
| `create_pr` | 109 | 35 | 0 | 32.1% |
| `get_pr_diff` | 98 | 3 | 0 | 3.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `request_close_issue` | 67 | 1 | 0 | 1.5% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 45 | 0 | 0 | 0% |
| `get_pr_reviews` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `merge_pr` | 41 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `list_pr_review_comments` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `create_root_issue` | 24 | 1 | 0 | 4.2% |
| `delegate_readonly` | 23 | 0 | 0 | 0% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
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
| `other` | 3,469 | 74.9% |
| `search` | 413 | 8.9% |
| `edit` | 356 | 7.7% |
| `verify` | 230 | 5% |
| `open` | 163 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 162 | 87.6% |
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
