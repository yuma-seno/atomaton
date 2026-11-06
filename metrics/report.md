# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-06.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 125 | 3.2% | 225 | 4,277 | 5 | 40.1 |
| Last 30 days | 537 | 5.4% | 240 | 9,859 | 12 | 18.3 |
| Last year | 563 | 5.3% | 246 | 10,246 | 14 | 19.0 |
| All time | 563 | 5.3% | 246 | 10,246 | 14 | 19.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 533 |
| `failed` | 20 |
| `stopped` | 10 |

## Last 7 days

41 sessions.

**Ran to an end without a report:** 3 of 38 sessions whose last run the core recorded as `completed` — 7.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**66,722,903 tokens** over 50 runs that reported them, **98.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 696,776 | 2,480,201 | 9,658,210 | 9,658,210 | 66,722,903 |
| messages per session | 99 | 187 | 292 | 292 | 4,518 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 14 | 34.1% |
| `engineer` | 14 | 34.1% |
| `reviewer` | 13 | 31.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 710 | 27 | 17 | 3.8% |
| `read` | 518 | 2 | 0 | 0.4% |
| `grep` | 361 | 14 | 0 | 3.9% |
| `edit` | 139 | 3 | 0 | 2.2% |
| `fetch` | 115 | 5 | 0 | 4.3% |
| `list` | 45 | 0 | 0 | 0% |
| `get_check_runs` | 33 | 2 | 0 | 6.1% |
| `get_pr` | 33 | 0 | 0 | 0% |
| `glob` | 31 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 29 | 0 | 0 | 0% |
| `check_merge_readiness` | 27 | 0 | 0 | 0% |
| `commit_and_push` | 26 | 0 | 0 | 0% |
| `create_pr` | 25 | 8 | 0 | 32% |
| `get_issue_comments` | 23 | 0 | 0 | 0% |
| `get_branch` | 22 | 0 | 0 | 0% |
| `get_issue` | 22 | 0 | 0 | 0% |
| `get_pr_diff` | 18 | 0 | 0 | 0% |
| `request_close_issue` | 17 | 0 | 0 | 0% |
| `write` | 15 | 1 | 0 | 6.7% |
| `merge_pr` | 14 | 0 | 0 | 0% |
| `create_sub_issue` | 13 | 0 | 0 | 0% |
| `get_pr_reviews` | 13 | 0 | 0 | 0% |
| `launch_sub_agent` | 11 | 0 | 0 | 0% |
| `list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `list_prs` | 5 | 0 | 0 | 0% |
| `search_code` | 5 | 0 | 0 | 0% |
| `search_issues` | 5 | 0 | 0 | 0% |
| `search_remote_code` | 5 | 1 | 0 | 20% |
| `delegate_readonly` | 4 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `sync_branch` | 3 | 3 | 0 | 100% |
| `delegate` | 2 | 0 | 0 | 0% |
| `list_issues` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 534 | 75.2% |
| `edit` | 81 | 11.4% |
| `search` | 62 | 8.7% |
| `open` | 24 | 3.4% |
| `verify` | 9 | 1.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 24 | 75% |
| `docs/customer-doc` | 3 | 9.4% |
| `delivery/pipeline-setup` | 2 | 6.3% |
| `engineering/environment` | 1 | 3.1% |
| `engineering/secrets-in-a-check` | 1 | 3.1% |
| `research/web-search` | 1 | 3.1% |

## Last 30 days

216 sessions.

**Ran to an end without a report:** 40 of 207 sessions whose last run the core recorded as `completed` — 19.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**649,700,833 tokens** over 274 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,146,525 | 4,948,355 | 28,119,706 | 73,718,100 | 649,700,833 |
| messages per session | 110 | 292 | 705 | 731 | 32,194 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 91 | 42.1% |
| `engineer` | 63 | 29.2% |
| `atomaton` | 62 | 28.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,010 | 100 | 86 | 2% |
| `read` | 4,039 | 23 | 7 | 0.6% |
| `grep` | 2,915 | 79 | 8 | 2.7% |
| `edit` | 1,564 | 27 | 0 | 1.7% |
| `fetch` | 560 | 45 | 0 | 8% |
| `shell__shell_execute` | 555 | 4 | 8 | 0.7% |
| `get_issue` | 293 | 13 | 5 | 4.4% |
| `get_issue_comments` | 273 | 0 | 10 | 0% |
| `get_pr` | 251 | 9 | 3 | 3.6% |
| `get_check_runs` | 247 | 12 | 0 | 4.9% |
| `list` | 235 | 2 | 0 | 0.9% |
| `glob` | 202 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 179 | 0 | 0 | 0% |
| `get_branch` | 165 | 0 | 0 | 0% |
| `check_merge_readiness` | 156 | 0 | 0 | 0% |
| `commit_and_push` | 137 | 8 | 0 | 5.8% |
| `create_pr` | 126 | 40 | 0 | 31.7% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 109 | 3 | 0 | 2.8% |
| `write` | 98 | 2 | 0 | 2% |
| `request_close_issue` | 80 | 1 | 0 | 1.3% |
| `merge_pr` | 51 | 0 | 0 | 0% |
| `get_pr_reviews` | 50 | 0 | 0 | 0% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `list_pr_review_comments` | 37 | 0 | 0 | 0% |
| `web__fetch` | 32 | 5 | 0 | 15.6% |
| `search_code` | 29 | 0 | 0 | 0% |
| `create_root_issue` | 28 | 1 | 0 | 3.6% |
| `search_remote_code` | 28 | 7 | 0 | 25% |
| `delegate_readonly` | 25 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `delegate` | 22 | 0 | 0 | 0% |
| `create_sub_issue` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `list_issues` | 15 | 0 | 0 | 0% |
| `sync_branch` | 14 | 6 | 0 | 42.9% |
| `github__get_issue_comments` | 12 | 0 | 0 | 0% |
| `github__get_issue` | 10 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `github__get_check_runs` | 7 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `github__get_branch` | 5 | 0 | 0 | 0% |
| `github__get_pr` | 5 | 0 | 0 | 0% |
| `github__list_prs` | 5 | 0 | 0 | 0% |
| `load_skill` | 5 | 5 | 0 | 100% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `search__search_issues` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__commit_and_push` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__create_pr` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,736 | 74.6% |
| `search` | 460 | 9.2% |
| `edit` | 404 | 8.1% |
| `verify` | 233 | 4.7% |
| `open` | 177 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 163 | 88.6% |
| `delivery/pipeline-setup` | 5 | 2.7% |
| `engineering/environment` | 4 | 2.2% |
| `engineering/secrets-in-a-check` | 4 | 2.2% |
| `research/web-search` | 4 | 2.2% |
| `docs/customer-doc` | 3 | 1.6% |
| `docs/design-doc` | 1 | 0.5% |

## Last year

232 sessions.

**Ran to an end without a report:** 45 of 223 sessions whose last run the core recorded as `completed` — 20.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**724,072,920 tokens** over 288 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,221,174 | 5,255,408 | 28,119,706 | 73,718,100 | 724,072,920 |
| messages per session | 111 | 303 | 705 | 731 | 35,870 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 94 | 40.5% |
| `atomaton` | 69 | 29.7% |
| `engineer` | 69 | 29.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,010 | 100 | 86 | 2% |
| `read` | 4,525 | 24 | 8 | 0.5% |
| `grep` | 3,176 | 83 | 8 | 2.6% |
| `edit` | 1,645 | 27 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 560 | 45 | 0 | 8% |
| `get_issue` | 293 | 13 | 5 | 4.4% |
| `list` | 284 | 3 | 0 | 1.1% |
| `get_issue_comments` | 273 | 0 | 10 | 0% |
| `get_pr` | 251 | 9 | 3 | 3.6% |
| `get_check_runs` | 247 | 12 | 0 | 4.9% |
| `glob` | 212 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 200 | 0 | 0 | 0% |
| `get_branch` | 165 | 0 | 0 | 0% |
| `check_merge_readiness` | 156 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 137 | 8 | 0 | 5.8% |
| `write` | 127 | 2 | 0 | 1.6% |
| `create_pr` | 126 | 40 | 0 | 31.7% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 109 | 3 | 0 | 2.8% |
| `request_close_issue` | 80 | 1 | 0 | 1.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 51 | 0 | 0 | 0% |
| `get_pr_reviews` | 50 | 0 | 0 | 0% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 37 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `search_code` | 29 | 0 | 0 | 0% |
| `create_root_issue` | 28 | 1 | 0 | 3.6% |
| `search_remote_code` | 28 | 7 | 0 | 25% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 25 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `delegate` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_sub_issue` | 17 | 0 | 0 | 0% |
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
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `load_skill` | 5 | 5 | 0 | 100% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
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
| `other` | 3,736 | 74.6% |
| `search` | 460 | 9.2% |
| `edit` | 404 | 8.1% |
| `verify` | 233 | 4.7% |
| `open` | 177 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 177 | 86.3% |
| `delivery/pipeline-setup` | 9 | 4.4% |
| `engineering/environment` | 7 | 3.4% |
| `engineering/secrets-in-a-check` | 4 | 2% |
| `research/web-search` | 4 | 2% |
| `docs/customer-doc` | 3 | 1.5% |
| `docs/design-doc` | 1 | 0.5% |

## All time

240 sessions.

**Ran to an end without a report:** 45 of 223 sessions whose last run the core recorded as `completed` — 20.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 8 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**724,072,920 tokens** over 288 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,221,174 | 5,255,408 | 28,119,706 | 73,718,100 | 724,072,920 |
| messages per session | 110 | 303 | 705 | 731 | 35,915 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 95 | 39.6% |
| `engineer` | 73 | 30.4% |
| `atomaton` | 72 | 30% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,010 | 100 | 86 | 2% |
| `read` | 4,525 | 24 | 8 | 0.5% |
| `grep` | 3,176 | 83 | 8 | 2.6% |
| `edit` | 1,645 | 27 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 560 | 45 | 0 | 8% |
| `get_issue` | 293 | 13 | 5 | 4.4% |
| `list` | 284 | 3 | 0 | 1.1% |
| `get_issue_comments` | 273 | 0 | 10 | 0% |
| `get_pr` | 251 | 9 | 3 | 3.6% |
| `get_check_runs` | 247 | 12 | 0 | 4.9% |
| `glob` | 212 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 200 | 0 | 0 | 0% |
| `get_branch` | 165 | 0 | 0 | 0% |
| `check_merge_readiness` | 156 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 137 | 8 | 0 | 5.8% |
| `write` | 127 | 2 | 0 | 1.6% |
| `create_pr` | 126 | 40 | 0 | 31.7% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 109 | 3 | 0 | 2.8% |
| `request_close_issue` | 80 | 1 | 0 | 1.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 51 | 0 | 0 | 0% |
| `get_pr_reviews` | 50 | 0 | 0 | 0% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 37 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `search_code` | 29 | 0 | 0 | 0% |
| `create_root_issue` | 28 | 1 | 0 | 3.6% |
| `search_remote_code` | 28 | 7 | 0 | 25% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 25 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `delegate` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_sub_issue` | 17 | 0 | 0 | 0% |
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
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `load_skill` | 5 | 5 | 0 | 100% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
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
| `other` | 3,736 | 74.6% |
| `search` | 460 | 9.2% |
| `edit` | 404 | 8.1% |
| `verify` | 233 | 4.7% |
| `open` | 177 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 177 | 86.3% |
| `delivery/pipeline-setup` | 9 | 4.4% |
| `engineering/environment` | 7 | 3.4% |
| `engineering/secrets-in-a-check` | 4 | 2% |
| `research/web-search` | 4 | 2% |
| `docs/customer-doc` | 3 | 1.5% |
| `docs/design-doc` | 1 | 0.5% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-05 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
