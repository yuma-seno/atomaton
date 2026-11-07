# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-07.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 140 | 3.6% | 235 | 6,099 | 7 | 35.5 |
| Last 30 days | 549 | 5.1% | 243 | 9,859 | 13 | 18.3 |
| Last year | 580 | 5.3% | 249 | 10,246 | 15 | 19.0 |
| All time | 580 | 5.3% | 249 | 10,246 | 15 | 19.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 549 |
| `failed` | 20 |
| `stopped` | 11 |

## Last 7 days

50 sessions.

**Ran to an end without a report:** 5 of 46 sessions whose last run the core recorded as `completed` — 10.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**162,252,969 tokens** over 58 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,337,902 | 9,658,210 | 29,805,044 | 29,805,044 | 162,252,969 |
| messages per session | 113 | 292 | 423 | 423 | 6,832 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 20 | 40% |
| `atomaton` | 15 | 30% |
| `reviewer` | 15 | 30% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,368 | 37 | 23 | 2.7% |
| `read` | 700 | 2 | 0 | 0.3% |
| `grep` | 467 | 17 | 1 | 3.6% |
| `edit` | 269 | 4 | 0 | 1.5% |
| `fetch` | 146 | 5 | 0 | 3.4% |
| `get_check_runs` | 48 | 2 | 0 | 4.2% |
| `list` | 46 | 0 | 0 | 0% |
| `get_pr` | 40 | 0 | 0 | 0% |
| `get_issue_comments` | 38 | 0 | 0 | 0% |
| `glob` | 38 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 37 | 0 | 0 | 0% |
| `get_issue` | 33 | 0 | 0 | 0% |
| `commit_and_push` | 31 | 0 | 0 | 0% |
| `check_merge_readiness` | 30 | 0 | 0 | 0% |
| `create_pr` | 29 | 9 | 0 | 31% |
| `get_branch` | 25 | 0 | 0 | 0% |
| `write` | 25 | 1 | 0 | 4% |
| `get_pr_diff` | 21 | 0 | 0 | 0% |
| `request_close_issue` | 19 | 0 | 0 | 0% |
| `create_sub_issue` | 16 | 0 | 0 | 0% |
| `get_pr_reviews` | 16 | 0 | 0 | 0% |
| `merge_pr` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 12 | 0 | 0 | 0% |
| `list_pr_review_comments` | 11 | 0 | 0 | 0% |
| `list_prs` | 8 | 0 | 0 | 0% |
| `search_remote_code` | 7 | 3 | 0 | 42.9% |
| `create_root_issue` | 6 | 0 | 0 | 0% |
| `load_skill` | 6 | 6 | 0 | 100% |
| `search_issues` | 6 | 0 | 0 | 0% |
| `delegate` | 5 | 0 | 0 | 0% |
| `search_code` | 5 | 0 | 0 | 0% |
| `delegate_large` | 4 | 0 | 0 | 0% |
| `delegate_readonly` | 4 | 0 | 0 | 0% |
| `sync_branch` | 3 | 3 | 0 | 100% |
| `list_issues` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,153 | 84.3% |
| `edit` | 101 | 7.4% |
| `search` | 69 | 5% |
| `open` | 36 | 2.6% |
| `verify` | 9 | 0.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 34 | 79.1% |
| `delivery/pipeline-setup` | 3 | 7% |
| `docs/customer-doc` | 3 | 7% |
| `engineering/environment` | 1 | 2.3% |
| `engineering/secrets-in-a-check` | 1 | 2.3% |
| `research/web-search` | 1 | 2.3% |

## Last 30 days

223 sessions.

**Ran to an end without a report:** 41 of 214 sessions whose last run the core recorded as `completed` — 19.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**744,420,517 tokens** over 283 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,189,880 | 5,530,003 | 29,805,044 | 73,718,100 | 744,420,517 |
| messages per session | 111 | 303 | 705 | 731 | 34,354 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 93 | 41.7% |
| `engineer` | 69 | 30.9% |
| `atomaton` | 61 | 27.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,668 | 110 | 92 | 1.9% |
| `read` | 4,193 | 21 | 6 | 0.5% |
| `grep` | 3,010 | 82 | 8 | 2.7% |
| `edit` | 1,694 | 28 | 0 | 1.7% |
| `fetch` | 591 | 45 | 0 | 7.6% |
| `shell__shell_execute` | 518 | 4 | 0 | 0.8% |
| `get_issue` | 304 | 13 | 5 | 4.3% |
| `get_issue_comments` | 288 | 0 | 10 | 0% |
| `get_check_runs` | 262 | 12 | 0 | 4.6% |
| `get_pr` | 258 | 9 | 3 | 3.5% |
| `list` | 236 | 2 | 0 | 0.8% |
| `glob` | 206 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 185 | 0 | 0 | 0% |
| `get_branch` | 168 | 0 | 0 | 0% |
| `check_merge_readiness` | 159 | 0 | 0 | 0% |
| `commit_and_push` | 142 | 8 | 0 | 5.6% |
| `create_pr` | 130 | 41 | 0 | 31.5% |
| `search_issues` | 114 | 0 | 3 | 0% |
| `get_pr_diff` | 112 | 3 | 0 | 2.7% |
| `write` | 108 | 2 | 0 | 1.9% |
| `request_close_issue` | 82 | 1 | 0 | 1.2% |
| `get_pr_reviews` | 53 | 0 | 0 | 0% |
| `list_prs` | 52 | 0 | 0 | 0% |
| `merge_pr` | 52 | 0 | 0 | 0% |
| `list_pr_review_comments` | 40 | 0 | 0 | 0% |
| `web__fetch` | 31 | 5 | 0 | 16.1% |
| `search_remote_code` | 30 | 9 | 0 | 30% |
| `create_root_issue` | 29 | 1 | 0 | 3.4% |
| `search_code` | 29 | 0 | 0 | 0% |
| `delegate` | 25 | 0 | 0 | 0% |
| `delegate_readonly` | 25 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `list_issues` | 15 | 0 | 0 | 0% |
| `sync_branch` | 14 | 6 | 0 | 42.9% |
| `github__get_issue_comments` | 10 | 0 | 0 | 0% |
| `load_skill` | 8 | 8 | 0 | 100% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `github__get_check_runs` | 7 | 0 | 0 | 0% |
| `github__get_issue` | 7 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `github__get_pr` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_branch` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `github__list_prs` | 4 | 0 | 0 | 0% |
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
| `other` | 4,355 | 76.8% |
| `search` | 467 | 8.2% |
| `edit` | 424 | 7.5% |
| `verify` | 233 | 4.1% |
| `open` | 189 | 3.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 172 | 89.1% |
| `delivery/pipeline-setup` | 6 | 3.1% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `research/web-search` | 4 | 2.1% |
| `docs/customer-doc` | 3 | 1.6% |
| `engineering/environment` | 3 | 1.6% |
| `docs/design-doc` | 1 | 0.5% |

## Last year

241 sessions.

**Ran to an end without a report:** 47 of 231 sessions whose last run the core recorded as `completed` — 20.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**820,244,632 tokens** over 298 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 5,707,358 | 29,805,044 | 73,718,100 | 820,244,632 |
| messages per session | 114 | 323 | 705 | 731 | 38,184 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 96 | 39.8% |
| `engineer` | 75 | 31.1% |
| `atomaton` | 70 | 29% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,668 | 110 | 92 | 1.9% |
| `read` | 4,707 | 24 | 8 | 0.5% |
| `grep` | 3,282 | 86 | 9 | 2.6% |
| `edit` | 1,775 | 28 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 591 | 45 | 0 | 7.6% |
| `get_issue` | 304 | 13 | 5 | 4.3% |
| `get_issue_comments` | 288 | 0 | 10 | 0% |
| `list` | 285 | 3 | 0 | 1.1% |
| `get_check_runs` | 262 | 12 | 0 | 4.6% |
| `get_pr` | 258 | 9 | 3 | 3.5% |
| `glob` | 219 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 208 | 0 | 0 | 0% |
| `get_branch` | 168 | 0 | 0 | 0% |
| `check_merge_readiness` | 159 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 142 | 8 | 0 | 5.6% |
| `write` | 137 | 2 | 0 | 1.5% |
| `create_pr` | 130 | 41 | 0 | 31.5% |
| `search_issues` | 114 | 0 | 3 | 0% |
| `get_pr_diff` | 112 | 3 | 0 | 2.7% |
| `request_close_issue` | 82 | 1 | 0 | 1.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 53 | 0 | 0 | 0% |
| `list_prs` | 52 | 0 | 0 | 0% |
| `merge_pr` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 40 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `search_remote_code` | 30 | 9 | 0 | 30% |
| `create_root_issue` | 29 | 1 | 0 | 3.4% |
| `search_code` | 29 | 0 | 0 | 0% |
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
| `load_skill` | 8 | 8 | 0 | 100% |
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
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,355 | 76.8% |
| `search` | 467 | 8.2% |
| `edit` | 424 | 7.5% |
| `verify` | 233 | 4.1% |
| `open` | 189 | 3.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 187 | 86.6% |
| `delivery/pipeline-setup` | 10 | 4.6% |
| `engineering/environment` | 7 | 3.2% |
| `engineering/secrets-in-a-check` | 4 | 1.9% |
| `research/web-search` | 4 | 1.9% |
| `docs/customer-doc` | 3 | 1.4% |
| `docs/design-doc` | 1 | 0.5% |

## All time

253 sessions.

**Ran to an end without a report:** 47 of 231 sessions whose last run the core recorded as `completed` — 20.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 12 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**820,244,632 tokens** over 298 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 5,707,358 | 29,805,044 | 73,718,100 | 820,244,632 |
| messages per session | 110 | 306 | 705 | 731 | 38,246 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 97 | 38.3% |
| `engineer` | 83 | 32.8% |
| `atomaton` | 73 | 28.9% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,668 | 110 | 92 | 1.9% |
| `read` | 4,707 | 24 | 8 | 0.5% |
| `grep` | 3,282 | 86 | 9 | 2.6% |
| `edit` | 1,775 | 28 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 591 | 45 | 0 | 7.6% |
| `get_issue` | 304 | 13 | 5 | 4.3% |
| `get_issue_comments` | 288 | 0 | 10 | 0% |
| `list` | 285 | 3 | 0 | 1.1% |
| `get_check_runs` | 262 | 12 | 0 | 4.6% |
| `get_pr` | 258 | 9 | 3 | 3.5% |
| `glob` | 219 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 208 | 0 | 0 | 0% |
| `get_branch` | 168 | 0 | 0 | 0% |
| `check_merge_readiness` | 159 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 142 | 8 | 0 | 5.6% |
| `write` | 137 | 2 | 0 | 1.5% |
| `create_pr` | 130 | 41 | 0 | 31.5% |
| `search_issues` | 114 | 0 | 3 | 0% |
| `get_pr_diff` | 112 | 3 | 0 | 2.7% |
| `request_close_issue` | 82 | 1 | 0 | 1.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 53 | 0 | 0 | 0% |
| `list_prs` | 52 | 0 | 0 | 0% |
| `merge_pr` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 40 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `search_remote_code` | 30 | 9 | 0 | 30% |
| `create_root_issue` | 29 | 1 | 0 | 3.4% |
| `search_code` | 29 | 0 | 0 | 0% |
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
| `load_skill` | 8 | 8 | 0 | 100% |
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
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,355 | 76.8% |
| `search` | 467 | 8.2% |
| `edit` | 424 | 7.5% |
| `verify` | 233 | 4.1% |
| `open` | 189 | 3.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 187 | 86.6% |
| `delivery/pipeline-setup` | 10 | 4.6% |
| `engineering/environment` | 7 | 3.2% |
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
