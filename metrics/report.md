# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-06.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 126 | 3.2% | 229 | 4,277 | 5 | 36.0 |
| Last 30 days | 536 | 5.2% | 240 | 9,859 | 12 | 18.1 |
| Last year | 566 | 5.3% | 247 | 10,246 | 14 | 18.9 |
| All time | 566 | 5.3% | 247 | 10,246 | 14 | 18.9 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 536 |
| `failed` | 20 |
| `stopped` | 10 |

## Last 7 days

42 sessions.

**Ran to an end without a report:** 4 of 39 sessions whose last run the core recorded as `completed` — 10.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**66,274,707 tokens** over 49 runs that reported them, **98.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 696,776 | 2,480,201 | 9,658,210 | 9,658,210 | 66,274,707 |
| messages per session | 103 | 188 | 292 | 292 | 4,714 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 15 | 35.7% |
| `atomaton` | 14 | 33.3% |
| `reviewer` | 13 | 31% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 786 | 27 | 17 | 3.4% |
| `read` | 521 | 2 | 0 | 0.4% |
| `grep` | 361 | 14 | 0 | 3.9% |
| `edit` | 140 | 3 | 0 | 2.1% |
| `fetch` | 115 | 5 | 0 | 4.3% |
| `list` | 45 | 0 | 0 | 0% |
| `get_check_runs` | 34 | 2 | 0 | 5.9% |
| `get_pr` | 34 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 31 | 0 | 0 | 0% |
| `glob` | 31 | 0 | 0 | 0% |
| `check_merge_readiness` | 27 | 0 | 0 | 0% |
| `commit_and_push` | 27 | 0 | 0 | 0% |
| `create_pr` | 27 | 9 | 0 | 33.3% |
| `get_issue_comments` | 24 | 0 | 0 | 0% |
| `get_issue` | 23 | 0 | 0 | 0% |
| `get_branch` | 22 | 0 | 0 | 0% |
| `get_pr_diff` | 18 | 0 | 0 | 0% |
| `request_close_issue` | 18 | 0 | 0 | 0% |
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
| `load_skill` | 4 | 4 | 0 | 100% |
| `sync_branch` | 3 | 3 | 0 | 100% |
| `delegate` | 2 | 0 | 0 | 0% |
| `list_issues` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 607 | 77.2% |
| `edit` | 84 | 10.7% |
| `search` | 62 | 7.9% |
| `open` | 24 | 3.1% |
| `verify` | 9 | 1.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 26 | 74.3% |
| `delivery/pipeline-setup` | 3 | 8.6% |
| `docs/customer-doc` | 3 | 8.6% |
| `engineering/environment` | 1 | 2.9% |
| `engineering/secrets-in-a-check` | 1 | 2.9% |
| `research/web-search` | 1 | 2.9% |

## Last 30 days

216 sessions.

**Ran to an end without a report:** 40 of 207 sessions whose last run the core recorded as `completed` — 19.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**648,442,255 tokens** over 274 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,143,930 | 4,948,355 | 28,119,706 | 73,718,100 | 648,442,255 |
| messages per session | 110 | 292 | 705 | 731 | 32,299 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 91 | 42.1% |
| `engineer` | 64 | 29.6% |
| `atomaton` | 61 | 28.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,086 | 100 | 86 | 2% |
| `read` | 4,018 | 21 | 6 | 0.5% |
| `grep` | 2,904 | 79 | 7 | 2.7% |
| `edit` | 1,565 | 27 | 0 | 1.7% |
| `fetch` | 560 | 45 | 0 | 8% |
| `shell__shell_execute` | 548 | 4 | 5 | 0.7% |
| `get_issue` | 294 | 13 | 5 | 4.4% |
| `get_issue_comments` | 274 | 0 | 10 | 0% |
| `get_pr` | 252 | 9 | 3 | 3.6% |
| `get_check_runs` | 248 | 12 | 0 | 4.8% |
| `list` | 235 | 2 | 0 | 0.9% |
| `glob` | 199 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 181 | 0 | 0 | 0% |
| `get_branch` | 165 | 0 | 0 | 0% |
| `check_merge_readiness` | 156 | 0 | 0 | 0% |
| `commit_and_push` | 138 | 8 | 0 | 5.8% |
| `create_pr` | 128 | 41 | 0 | 32% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 109 | 3 | 0 | 2.8% |
| `write` | 98 | 2 | 0 | 2% |
| `request_close_issue` | 81 | 1 | 0 | 1.2% |
| `merge_pr` | 51 | 0 | 0 | 0% |
| `get_pr_reviews` | 50 | 0 | 0 | 0% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `list_pr_review_comments` | 37 | 0 | 0 | 0% |
| `web__fetch` | 31 | 5 | 0 | 16.1% |
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
| `github__get_issue_comments` | 10 | 0 | 0 | 0% |
| `github__get_issue` | 9 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `github__get_check_runs` | 7 | 0 | 0 | 0% |
| `load_skill` | 6 | 6 | 0 | 100% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `github__get_pr` | 5 | 0 | 0 | 0% |
| `github__list_prs` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_branch` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `search__search_issues` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
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
| `other` | 3,809 | 74.9% |
| `search` | 460 | 9% |
| `edit` | 407 | 8% |
| `verify` | 233 | 4.6% |
| `open` | 177 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 165 | 88.2% |
| `delivery/pipeline-setup` | 6 | 3.2% |
| `engineering/environment` | 4 | 2.1% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `research/web-search` | 4 | 2.1% |
| `docs/customer-doc` | 3 | 1.6% |
| `docs/design-doc` | 1 | 0.5% |

## Last year

233 sessions.

**Ran to an end without a report:** 46 of 224 sessions whose last run the core recorded as `completed` — 20.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**724,266,370 tokens** over 289 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,211,508 | 5,255,408 | 28,119,706 | 73,718,100 | 724,266,370 |
| messages per session | 111 | 303 | 705 | 731 | 36,066 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 94 | 40.3% |
| `engineer` | 70 | 30% |
| `atomaton` | 69 | 29.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,086 | 100 | 86 | 2% |
| `read` | 4,528 | 24 | 8 | 0.5% |
| `grep` | 3,176 | 83 | 8 | 2.6% |
| `edit` | 1,646 | 27 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 560 | 45 | 0 | 8% |
| `get_issue` | 294 | 13 | 5 | 4.4% |
| `list` | 284 | 3 | 0 | 1.1% |
| `get_issue_comments` | 274 | 0 | 10 | 0% |
| `get_pr` | 252 | 9 | 3 | 3.6% |
| `get_check_runs` | 248 | 12 | 0 | 4.8% |
| `glob` | 212 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 202 | 0 | 0 | 0% |
| `get_branch` | 165 | 0 | 0 | 0% |
| `check_merge_readiness` | 156 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 138 | 8 | 0 | 5.8% |
| `create_pr` | 128 | 41 | 0 | 32% |
| `write` | 127 | 2 | 0 | 1.6% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 109 | 3 | 0 | 2.8% |
| `request_close_issue` | 81 | 1 | 0 | 1.2% |
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
| `load_skill` | 6 | 6 | 0 | 100% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
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
| `other` | 3,809 | 74.9% |
| `search` | 460 | 9% |
| `edit` | 407 | 8% |
| `verify` | 233 | 4.6% |
| `open` | 177 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 179 | 86.1% |
| `delivery/pipeline-setup` | 10 | 4.8% |
| `engineering/environment` | 7 | 3.4% |
| `engineering/secrets-in-a-check` | 4 | 1.9% |
| `research/web-search` | 4 | 1.9% |
| `docs/customer-doc` | 3 | 1.4% |
| `docs/design-doc` | 1 | 0.5% |

## All time

242 sessions.

**Ran to an end without a report:** 46 of 224 sessions whose last run the core recorded as `completed` — 20.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 9 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**724,266,370 tokens** over 289 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,211,508 | 5,255,408 | 28,119,706 | 73,718,100 | 724,266,370 |
| messages per session | 110 | 301 | 705 | 731 | 36,119 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 95 | 39.3% |
| `engineer` | 75 | 31% |
| `atomaton` | 72 | 29.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,086 | 100 | 86 | 2% |
| `read` | 4,528 | 24 | 8 | 0.5% |
| `grep` | 3,176 | 83 | 8 | 2.6% |
| `edit` | 1,646 | 27 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 560 | 45 | 0 | 8% |
| `get_issue` | 294 | 13 | 5 | 4.4% |
| `list` | 284 | 3 | 0 | 1.1% |
| `get_issue_comments` | 274 | 0 | 10 | 0% |
| `get_pr` | 252 | 9 | 3 | 3.6% |
| `get_check_runs` | 248 | 12 | 0 | 4.8% |
| `glob` | 212 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 202 | 0 | 0 | 0% |
| `get_branch` | 165 | 0 | 0 | 0% |
| `check_merge_readiness` | 156 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 138 | 8 | 0 | 5.8% |
| `create_pr` | 128 | 41 | 0 | 32% |
| `write` | 127 | 2 | 0 | 1.6% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 109 | 3 | 0 | 2.8% |
| `request_close_issue` | 81 | 1 | 0 | 1.2% |
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
| `load_skill` | 6 | 6 | 0 | 100% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
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
| `other` | 3,809 | 74.9% |
| `search` | 460 | 9% |
| `edit` | 407 | 8% |
| `verify` | 233 | 4.6% |
| `open` | 177 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 179 | 86.1% |
| `delivery/pipeline-setup` | 10 | 4.8% |
| `engineering/environment` | 7 | 3.4% |
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
