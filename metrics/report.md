# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-06.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 132 | 3.8% | 230 | 5,105 | 6 | 36.0 |
| Last 30 days | 542 | 5.4% | 240 | 9,859 | 12 | 18.2 |
| Last year | 572 | 5.4% | 248 | 10,246 | 14 | 19.0 |
| All time | 572 | 5.4% | 248 | 10,246 | 14 | 19.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 541 |
| `failed` | 20 |
| `stopped` | 11 |

## Last 7 days

46 sessions.

**Ran to an end without a report:** 4 of 42 sessions whose last run the core recorded as `completed` — 9.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**112,308,364 tokens** over 53 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 805,003 | 2,871,819 | 29,805,044 | 29,805,044 | 112,308,364 |
| messages per session | 105 | 190 | 366 | 366 | 5,570 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 17 | 37% |
| `atomaton` | 15 | 32.6% |
| `reviewer` | 14 | 30.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 987 | 31 | 20 | 3.1% |
| `read` | 635 | 2 | 0 | 0.3% |
| `grep` | 400 | 16 | 0 | 4% |
| `edit` | 205 | 4 | 0 | 2% |
| `fetch` | 119 | 5 | 0 | 4.2% |
| `list` | 45 | 0 | 0 | 0% |
| `glob` | 38 | 0 | 0 | 0% |
| `get_pr` | 36 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 35 | 0 | 0 | 0% |
| `get_check_runs` | 35 | 2 | 0 | 5.7% |
| `get_issue_comments` | 34 | 0 | 0 | 0% |
| `get_issue` | 29 | 0 | 0 | 0% |
| `check_merge_readiness` | 28 | 0 | 0 | 0% |
| `commit_and_push` | 27 | 0 | 0 | 0% |
| `create_pr` | 27 | 9 | 0 | 33.3% |
| `get_branch` | 22 | 0 | 0 | 0% |
| `get_pr_diff` | 19 | 0 | 0 | 0% |
| `request_close_issue` | 18 | 0 | 0 | 0% |
| `create_sub_issue` | 16 | 0 | 0 | 0% |
| `write` | 16 | 1 | 0 | 6.3% |
| `get_pr_reviews` | 14 | 0 | 0 | 0% |
| `merge_pr` | 14 | 0 | 0 | 0% |
| `launch_sub_agent` | 12 | 0 | 0 | 0% |
| `list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `create_root_issue` | 6 | 0 | 0 | 0% |
| `list_prs` | 6 | 0 | 0 | 0% |
| `delegate` | 5 | 0 | 0 | 0% |
| `load_skill` | 5 | 5 | 0 | 100% |
| `search_code` | 5 | 0 | 0 | 0% |
| `search_issues` | 5 | 0 | 0 | 0% |
| `search_remote_code` | 5 | 1 | 0 | 20% |
| `delegate_large` | 4 | 0 | 0 | 0% |
| `delegate_readonly` | 4 | 0 | 0 | 0% |
| `sync_branch` | 3 | 3 | 0 | 100% |
| `list_issues` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 787 | 79.7% |
| `edit` | 86 | 8.7% |
| `search` | 69 | 7% |
| `open` | 36 | 3.6% |
| `verify` | 9 | 0.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 31 | 77.5% |
| `delivery/pipeline-setup` | 3 | 7.5% |
| `docs/customer-doc` | 3 | 7.5% |
| `engineering/environment` | 1 | 2.5% |
| `engineering/secrets-in-a-check` | 1 | 2.5% |
| `research/web-search` | 1 | 2.5% |

## Last 30 days

220 sessions.

**Ran to an end without a report:** 40 of 210 sessions whose last run the core recorded as `completed` — 19%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**694,475,912 tokens** over 278 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,146,525 | 5,246,133 | 29,805,044 | 73,718,100 | 694,475,912 |
| messages per session | 110 | 293 | 705 | 731 | 33,155 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 92 | 41.8% |
| `engineer` | 66 | 30% |
| `atomaton` | 62 | 28.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,287 | 104 | 89 | 2% |
| `read` | 4,132 | 21 | 6 | 0.5% |
| `grep` | 2,943 | 81 | 7 | 2.8% |
| `edit` | 1,630 | 28 | 0 | 1.7% |
| `fetch` | 564 | 45 | 0 | 8% |
| `shell__shell_execute` | 548 | 4 | 5 | 0.7% |
| `get_issue` | 300 | 13 | 5 | 4.3% |
| `get_issue_comments` | 284 | 0 | 10 | 0% |
| `get_pr` | 254 | 9 | 3 | 3.5% |
| `get_check_runs` | 249 | 12 | 0 | 4.8% |
| `list` | 235 | 2 | 0 | 0.9% |
| `glob` | 206 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 185 | 0 | 0 | 0% |
| `get_branch` | 165 | 0 | 0 | 0% |
| `check_merge_readiness` | 157 | 0 | 0 | 0% |
| `commit_and_push` | 138 | 8 | 0 | 5.8% |
| `create_pr` | 128 | 41 | 0 | 32% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 110 | 3 | 0 | 2.7% |
| `write` | 99 | 2 | 0 | 2% |
| `request_close_issue` | 81 | 1 | 0 | 1.2% |
| `get_pr_reviews` | 51 | 0 | 0 | 0% |
| `merge_pr` | 51 | 0 | 0 | 0% |
| `list_prs` | 50 | 0 | 0 | 0% |
| `list_pr_review_comments` | 37 | 0 | 0 | 0% |
| `web__fetch` | 31 | 5 | 0 | 16.1% |
| `create_root_issue` | 29 | 1 | 0 | 3.4% |
| `search_code` | 29 | 0 | 0 | 0% |
| `search_remote_code` | 28 | 7 | 0 | 25% |
| `delegate` | 25 | 0 | 0 | 0% |
| `delegate_readonly` | 25 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `list_issues` | 15 | 0 | 0 | 0% |
| `sync_branch` | 14 | 6 | 0 | 42.9% |
| `github__get_issue_comments` | 10 | 0 | 0 | 0% |
| `github__get_issue` | 9 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `github__get_check_runs` | 7 | 0 | 0 | 0% |
| `load_skill` | 7 | 7 | 0 | 100% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `github__get_pr` | 5 | 0 | 0 | 0% |
| `github__list_prs` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_branch` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `search__search_issues` | 4 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 3 | 0 | 0 | 0% |
| `github__commit_and_push` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__create_pr` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,989 | 75.4% |
| `search` | 467 | 8.8% |
| `edit` | 409 | 7.7% |
| `verify` | 233 | 4.4% |
| `open` | 189 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 170 | 88.5% |
| `delivery/pipeline-setup` | 6 | 3.1% |
| `engineering/environment` | 4 | 2.1% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `research/web-search` | 4 | 2.1% |
| `docs/customer-doc` | 3 | 1.6% |
| `docs/design-doc` | 1 | 0.5% |

## Last year

237 sessions.

**Ran to an end without a report:** 46 of 227 sessions whose last run the core recorded as `completed` — 20.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**770,300,027 tokens** over 293 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,221,174 | 5,484,738 | 29,805,044 | 73,718,100 | 770,300,027 |
| messages per session | 113 | 306 | 705 | 731 | 36,922 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 95 | 40.1% |
| `engineer` | 72 | 30.4% |
| `atomaton` | 70 | 29.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,287 | 104 | 89 | 2% |
| `read` | 4,642 | 24 | 8 | 0.5% |
| `grep` | 3,215 | 85 | 8 | 2.6% |
| `edit` | 1,711 | 28 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 564 | 45 | 0 | 8% |
| `get_issue` | 300 | 13 | 5 | 4.3% |
| `get_issue_comments` | 284 | 0 | 10 | 0% |
| `list` | 284 | 3 | 0 | 1.1% |
| `get_pr` | 254 | 9 | 3 | 3.5% |
| `get_check_runs` | 249 | 12 | 0 | 4.8% |
| `glob` | 219 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 206 | 0 | 0 | 0% |
| `get_branch` | 165 | 0 | 0 | 0% |
| `check_merge_readiness` | 157 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 138 | 8 | 0 | 5.8% |
| `create_pr` | 128 | 41 | 0 | 32% |
| `write` | 128 | 2 | 0 | 1.6% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 110 | 3 | 0 | 2.7% |
| `request_close_issue` | 81 | 1 | 0 | 1.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 51 | 0 | 0 | 0% |
| `merge_pr` | 51 | 0 | 0 | 0% |
| `list_prs` | 50 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 37 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `create_root_issue` | 29 | 1 | 0 | 3.4% |
| `search_code` | 29 | 0 | 0 | 0% |
| `search_remote_code` | 28 | 7 | 0 | 25% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate` | 25 | 0 | 0 | 0% |
| `delegate_readonly` | 25 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 15 | 0 | 0 | 0% |
| `sync_branch` | 14 | 6 | 0 | 42.9% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `load_skill` | 7 | 7 | 0 | 100% |
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
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,989 | 75.4% |
| `search` | 467 | 8.8% |
| `edit` | 409 | 7.7% |
| `verify` | 233 | 4.4% |
| `open` | 189 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 184 | 86.4% |
| `delivery/pipeline-setup` | 10 | 4.7% |
| `engineering/environment` | 7 | 3.3% |
| `engineering/secrets-in-a-check` | 4 | 1.9% |
| `research/web-search` | 4 | 1.9% |
| `docs/customer-doc` | 3 | 1.4% |
| `docs/design-doc` | 1 | 0.5% |

## All time

249 sessions.

**Ran to an end without a report:** 46 of 227 sessions whose last run the core recorded as `completed` — 20.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 12 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**770,300,027 tokens** over 293 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,221,174 | 5,484,738 | 29,805,044 | 73,718,100 | 770,300,027 |
| messages per session | 110 | 303 | 705 | 731 | 36,984 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 96 | 38.6% |
| `engineer` | 80 | 32.1% |
| `atomaton` | 73 | 29.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,287 | 104 | 89 | 2% |
| `read` | 4,642 | 24 | 8 | 0.5% |
| `grep` | 3,215 | 85 | 8 | 2.6% |
| `edit` | 1,711 | 28 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 564 | 45 | 0 | 8% |
| `get_issue` | 300 | 13 | 5 | 4.3% |
| `get_issue_comments` | 284 | 0 | 10 | 0% |
| `list` | 284 | 3 | 0 | 1.1% |
| `get_pr` | 254 | 9 | 3 | 3.5% |
| `get_check_runs` | 249 | 12 | 0 | 4.8% |
| `glob` | 219 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 206 | 0 | 0 | 0% |
| `get_branch` | 165 | 0 | 0 | 0% |
| `check_merge_readiness` | 157 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 138 | 8 | 0 | 5.8% |
| `create_pr` | 128 | 41 | 0 | 32% |
| `write` | 128 | 2 | 0 | 1.6% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 110 | 3 | 0 | 2.7% |
| `request_close_issue` | 81 | 1 | 0 | 1.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 51 | 0 | 0 | 0% |
| `merge_pr` | 51 | 0 | 0 | 0% |
| `list_prs` | 50 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 37 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `create_root_issue` | 29 | 1 | 0 | 3.4% |
| `search_code` | 29 | 0 | 0 | 0% |
| `search_remote_code` | 28 | 7 | 0 | 25% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate` | 25 | 0 | 0 | 0% |
| `delegate_readonly` | 25 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 15 | 0 | 0 | 0% |
| `sync_branch` | 14 | 6 | 0 | 42.9% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `load_skill` | 7 | 7 | 0 | 100% |
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
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,989 | 75.4% |
| `search` | 467 | 8.8% |
| `edit` | 409 | 7.7% |
| `verify` | 233 | 4.4% |
| `open` | 189 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 184 | 86.4% |
| `delivery/pipeline-setup` | 10 | 4.7% |
| `engineering/environment` | 7 | 3.3% |
| `engineering/secrets-in-a-check` | 4 | 1.9% |
| `research/web-search` | 4 | 1.9% |
| `docs/customer-doc` | 3 | 1.4% |
| `docs/design-doc` | 1 | 0.5% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-06 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
