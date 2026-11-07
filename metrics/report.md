# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-07.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 143 | 3.5% | 230 | 6,099 | 7 | 34.3 |
| Last 30 days | 552 | 5.1% | 243 | 9,859 | 13 | 18.2 |
| Last year | 583 | 5.3% | 248 | 10,246 | 15 | 19.0 |
| All time | 583 | 5.3% | 248 | 10,246 | 15 | 19.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 552 |
| `failed` | 20 |
| `stopped` | 11 |

## Last 7 days

51 sessions.

**Ran to an end without a report:** 5 of 47 sessions whose last run the core recorded as `completed` — 10.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**163,495,529 tokens** over 59 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,560 | 9,658,210 | 29,805,044 | 29,805,044 | 163,495,529 |
| messages per session | 113 | 292 | 425 | 425 | 7,274 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 21 | 41.2% |
| `atomaton` | 15 | 29.4% |
| `reviewer` | 15 | 29.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,513 | 41 | 25 | 2.7% |
| `read` | 727 | 2 | 0 | 0.3% |
| `grep` | 467 | 17 | 1 | 3.6% |
| `edit` | 317 | 4 | 0 | 1.3% |
| `fetch` | 146 | 5 | 0 | 3.4% |
| `get_check_runs` | 48 | 2 | 0 | 4.2% |
| `list` | 46 | 0 | 0 | 0% |
| `get_pr` | 40 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 38 | 0 | 0 | 0% |
| `get_issue_comments` | 38 | 0 | 0 | 0% |
| `glob` | 38 | 0 | 0 | 0% |
| `get_issue` | 33 | 0 | 0 | 0% |
| `commit_and_push` | 31 | 0 | 0 | 0% |
| `check_merge_readiness` | 30 | 0 | 0 | 0% |
| `create_pr` | 29 | 9 | 0 | 31% |
| `write` | 27 | 1 | 0 | 3.7% |
| `get_branch` | 25 | 0 | 0 | 0% |
| `get_pr_diff` | 21 | 0 | 0 | 0% |
| `request_close_issue` | 19 | 0 | 0 | 0% |
| `create_sub_issue` | 16 | 0 | 0 | 0% |
| `get_pr_reviews` | 16 | 0 | 0 | 0% |
| `merge_pr` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 12 | 0 | 0 | 0% |
| `list_pr_review_comments` | 11 | 0 | 0 | 0% |
| `list_prs` | 8 | 0 | 0 | 0% |
| `load_skill` | 7 | 7 | 0 | 100% |
| `search_remote_code` | 7 | 3 | 0 | 42.9% |
| `create_root_issue` | 6 | 0 | 0 | 0% |
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
| `other` | 1,295 | 85.6% |
| `edit` | 104 | 6.9% |
| `search` | 69 | 4.6% |
| `open` | 36 | 2.4% |
| `verify` | 9 | 0.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 36 | 80% |
| `delivery/pipeline-setup` | 3 | 6.7% |
| `docs/customer-doc` | 3 | 6.7% |
| `engineering/environment` | 1 | 2.2% |
| `engineering/secrets-in-a-check` | 1 | 2.2% |
| `research/web-search` | 1 | 2.2% |

## Last 30 days

224 sessions.

**Ran to an end without a report:** 41 of 215 sessions whose last run the core recorded as `completed` — 19.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**745,663,077 tokens** over 284 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,191,474 | 5,530,003 | 29,805,044 | 73,718,100 | 745,663,077 |
| messages per session | 111 | 303 | 705 | 731 | 34,796 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 93 | 41.5% |
| `engineer` | 70 | 31.3% |
| `atomaton` | 61 | 27.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,813 | 114 | 94 | 2% |
| `read` | 4,220 | 21 | 6 | 0.5% |
| `grep` | 3,010 | 82 | 8 | 2.7% |
| `edit` | 1,742 | 28 | 0 | 1.6% |
| `fetch` | 591 | 45 | 0 | 7.6% |
| `shell__shell_execute` | 518 | 4 | 0 | 0.8% |
| `get_issue` | 304 | 13 | 5 | 4.3% |
| `get_issue_comments` | 288 | 0 | 10 | 0% |
| `get_check_runs` | 262 | 12 | 0 | 4.6% |
| `get_pr` | 258 | 9 | 3 | 3.5% |
| `list` | 236 | 2 | 0 | 0.8% |
| `glob` | 206 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 186 | 0 | 0 | 0% |
| `get_branch` | 168 | 0 | 0 | 0% |
| `check_merge_readiness` | 159 | 0 | 0 | 0% |
| `commit_and_push` | 142 | 8 | 0 | 5.6% |
| `create_pr` | 130 | 41 | 0 | 31.5% |
| `search_issues` | 114 | 0 | 3 | 0% |
| `get_pr_diff` | 112 | 3 | 0 | 2.7% |
| `write` | 110 | 2 | 0 | 1.8% |
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
| `load_skill` | 9 | 9 | 0 | 100% |
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
| `other` | 4,497 | 77.4% |
| `search` | 467 | 8% |
| `edit` | 427 | 7.3% |
| `verify` | 233 | 4% |
| `open` | 189 | 3.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 174 | 89.2% |
| `delivery/pipeline-setup` | 6 | 3.1% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `research/web-search` | 4 | 2.1% |
| `docs/customer-doc` | 3 | 1.5% |
| `engineering/environment` | 3 | 1.5% |
| `docs/design-doc` | 1 | 0.5% |

## Last year

242 sessions.

**Ran to an end without a report:** 47 of 232 sessions whose last run the core recorded as `completed` — 20.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**821,487,192 tokens** over 299 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 5,707,358 | 29,805,044 | 73,718,100 | 821,487,192 |
| messages per session | 115 | 323 | 705 | 731 | 38,626 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 96 | 39.7% |
| `engineer` | 76 | 31.4% |
| `atomaton` | 70 | 28.9% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,813 | 114 | 94 | 2% |
| `read` | 4,734 | 24 | 8 | 0.5% |
| `grep` | 3,282 | 86 | 9 | 2.6% |
| `edit` | 1,823 | 28 | 0 | 1.5% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 591 | 45 | 0 | 7.6% |
| `get_issue` | 304 | 13 | 5 | 4.3% |
| `get_issue_comments` | 288 | 0 | 10 | 0% |
| `list` | 285 | 3 | 0 | 1.1% |
| `get_check_runs` | 262 | 12 | 0 | 4.6% |
| `get_pr` | 258 | 9 | 3 | 3.5% |
| `glob` | 219 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 209 | 0 | 0 | 0% |
| `get_branch` | 168 | 0 | 0 | 0% |
| `check_merge_readiness` | 159 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 142 | 8 | 0 | 5.6% |
| `write` | 139 | 2 | 0 | 1.4% |
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
| `load_skill` | 9 | 9 | 0 | 100% |
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
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,497 | 77.4% |
| `search` | 467 | 8% |
| `edit` | 427 | 7.3% |
| `verify` | 233 | 4% |
| `open` | 189 | 3.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 189 | 86.7% |
| `delivery/pipeline-setup` | 10 | 4.6% |
| `engineering/environment` | 7 | 3.2% |
| `engineering/secrets-in-a-check` | 4 | 1.8% |
| `research/web-search` | 4 | 1.8% |
| `docs/customer-doc` | 3 | 1.4% |
| `docs/design-doc` | 1 | 0.5% |

## All time

254 sessions.

**Ran to an end without a report:** 47 of 232 sessions whose last run the core recorded as `completed` — 20.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 12 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**821,487,192 tokens** over 299 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 5,707,358 | 29,805,044 | 73,718,100 | 821,487,192 |
| messages per session | 111 | 323 | 705 | 731 | 38,688 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 97 | 38.2% |
| `engineer` | 84 | 33.1% |
| `atomaton` | 73 | 28.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,813 | 114 | 94 | 2% |
| `read` | 4,734 | 24 | 8 | 0.5% |
| `grep` | 3,282 | 86 | 9 | 2.6% |
| `edit` | 1,823 | 28 | 0 | 1.5% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 591 | 45 | 0 | 7.6% |
| `get_issue` | 304 | 13 | 5 | 4.3% |
| `get_issue_comments` | 288 | 0 | 10 | 0% |
| `list` | 285 | 3 | 0 | 1.1% |
| `get_check_runs` | 262 | 12 | 0 | 4.6% |
| `get_pr` | 258 | 9 | 3 | 3.5% |
| `glob` | 219 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 209 | 0 | 0 | 0% |
| `get_branch` | 168 | 0 | 0 | 0% |
| `check_merge_readiness` | 159 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 142 | 8 | 0 | 5.6% |
| `write` | 139 | 2 | 0 | 1.4% |
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
| `load_skill` | 9 | 9 | 0 | 100% |
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
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,497 | 77.4% |
| `search` | 467 | 8% |
| `edit` | 427 | 7.3% |
| `verify` | 233 | 4% |
| `open` | 189 | 3.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 189 | 86.7% |
| `delivery/pipeline-setup` | 10 | 4.6% |
| `engineering/environment` | 7 | 3.2% |
| `engineering/secrets-in-a-check` | 4 | 1.8% |
| `research/web-search` | 4 | 1.8% |
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
