# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-07.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 176 | 2.8% | 240 | 6,099 | 9 | 26.9 |
| Last 30 days | 585 | 4.8% | 244 | 9,859 | 13 | 18.1 |
| Last year | 616 | 5% | 252 | 10,246 | 15 | 18.9 |
| All time | 616 | 5% | 252 | 10,246 | 15 | 18.9 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 585 |
| `failed` | 20 |
| `stopped` | 11 |

## Last 7 days

59 sessions.

**Ran to an end without a report:** 6 of 55 sessions whose last run the core recorded as `completed` — 10.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**215,583,373 tokens** over 75 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,370,053 | 9,342,774 | 29,805,044 | 29,805,044 | 215,583,373 |
| messages per session | 120 | 341 | 425 | 425 | 9,201 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 25 | 42.4% |
| `reviewer` | 19 | 32.2% |
| `atomaton` | 15 | 25.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,937 | 55 | 29 | 2.8% |
| `read` | 860 | 3 | 0 | 0.3% |
| `grep` | 624 | 23 | 1 | 3.7% |
| `edit` | 371 | 6 | 0 | 1.6% |
| `fetch` | 224 | 9 | 0 | 4% |
| `get_check_runs` | 62 | 2 | 0 | 3.2% |
| `get_pr` | 53 | 0 | 0 | 0% |
| `get_issue_comments` | 51 | 0 | 0 | 0% |
| `list` | 51 | 0 | 0 | 0% |
| `commit_and_push` | 47 | 0 | 0 | 0% |
| `write` | 43 | 1 | 0 | 2.3% |
| `get_issue` | 42 | 0 | 0 | 0% |
| `glob` | 42 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `check_merge_readiness` | 36 | 0 | 0 | 0% |
| `create_pr` | 35 | 12 | 0 | 34.3% |
| `get_branch` | 33 | 0 | 0 | 0% |
| `get_pr_diff` | 25 | 0 | 0 | 0% |
| `get_pr_reviews` | 23 | 0 | 0 | 0% |
| `request_close_issue` | 22 | 0 | 0 | 0% |
| `merge_pr` | 18 | 0 | 0 | 0% |
| `search_remote_code` | 18 | 6 | 0 | 33.3% |
| `create_sub_issue` | 16 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 12 | 0 | 0 | 0% |
| `list_prs` | 12 | 0 | 0 | 0% |
| `load_skill` | 11 | 7 | 0 | 63.6% |
| `search_issues` | 10 | 0 | 0 | 0% |
| `search_code` | 8 | 0 | 0 | 0% |
| `create_root_issue` | 7 | 0 | 0 | 0% |
| `delegate` | 5 | 0 | 0 | 0% |
| `delegate_large` | 4 | 0 | 0 | 0% |
| `delegate_readonly` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 4 | 0 | 100% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,674 | 86.4% |
| `edit` | 149 | 7.7% |
| `search` | 69 | 3.6% |
| `open` | 36 | 1.9% |
| `verify` | 9 | 0.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 40 | 80% |
| `delivery/pipeline-setup` | 3 | 6% |
| `docs/customer-doc` | 3 | 6% |
| `engineering/secrets-in-a-check` | 2 | 4% |
| `engineering/environment` | 1 | 2% |
| `research/web-search` | 1 | 2% |

## Last 30 days

232 sessions.

**Ran to an end without a report:** 42 of 223 sessions whose last run the core recorded as `completed` — 18.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**797,750,921 tokens** over 300 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,645 | 5,707,358 | 29,805,044 | 73,718,100 | 797,750,921 |
| messages per session | 114 | 323 | 705 | 731 | 36,723 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 97 | 41.8% |
| `engineer` | 74 | 31.9% |
| `atomaton` | 61 | 26.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,237 | 128 | 98 | 2.1% |
| `read` | 4,353 | 22 | 6 | 0.5% |
| `grep` | 3,167 | 88 | 8 | 2.8% |
| `edit` | 1,796 | 30 | 0 | 1.7% |
| `fetch` | 669 | 49 | 0 | 7.3% |
| `shell__shell_execute` | 518 | 4 | 0 | 0.8% |
| `get_issue` | 313 | 13 | 5 | 4.2% |
| `get_issue_comments` | 301 | 0 | 10 | 0% |
| `get_check_runs` | 276 | 12 | 0 | 4.3% |
| `get_pr` | 271 | 9 | 3 | 3.3% |
| `list` | 241 | 2 | 0 | 0.8% |
| `glob` | 210 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 187 | 1 | 0 | 0.5% |
| `get_branch` | 176 | 0 | 0 | 0% |
| `check_merge_readiness` | 165 | 0 | 0 | 0% |
| `commit_and_push` | 158 | 8 | 0 | 5.1% |
| `create_pr` | 136 | 44 | 0 | 32.4% |
| `write` | 126 | 2 | 0 | 1.6% |
| `search_issues` | 118 | 0 | 3 | 0% |
| `get_pr_diff` | 116 | 3 | 0 | 2.6% |
| `request_close_issue` | 85 | 1 | 0 | 1.2% |
| `get_pr_reviews` | 60 | 0 | 0 | 0% |
| `list_prs` | 56 | 0 | 0 | 0% |
| `merge_pr` | 55 | 0 | 0 | 0% |
| `list_pr_review_comments` | 44 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `search_code` | 32 | 0 | 0 | 0% |
| `web__fetch` | 31 | 5 | 0 | 16.1% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `delegate` | 25 | 0 | 0 | 0% |
| `delegate_readonly` | 25 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `load_skill` | 13 | 9 | 0 | 69.2% |
| `github__get_issue_comments` | 10 | 0 | 0 | 0% |
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
| `other` | 4,876 | 78.2% |
| `edit` | 472 | 7.6% |
| `search` | 467 | 7.5% |
| `verify` | 233 | 3.7% |
| `open` | 189 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 178 | 89% |
| `delivery/pipeline-setup` | 6 | 3% |
| `engineering/secrets-in-a-check` | 5 | 2.5% |
| `research/web-search` | 4 | 2% |
| `docs/customer-doc` | 3 | 1.5% |
| `engineering/environment` | 3 | 1.5% |
| `docs/design-doc` | 1 | 0.5% |

## Last year

250 sessions.

**Ran to an end without a report:** 48 of 240 sessions whose last run the core recorded as `completed` — 20%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**873,575,036 tokens** over 315 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,337,902 | 5,758,740 | 28,119,706 | 73,718,100 | 873,575,036 |
| messages per session | 120 | 330 | 705 | 731 | 40,553 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 100 | 40% |
| `engineer` | 80 | 32% |
| `atomaton` | 70 | 28% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,237 | 128 | 98 | 2.1% |
| `read` | 4,867 | 25 | 8 | 0.5% |
| `grep` | 3,439 | 92 | 9 | 2.7% |
| `edit` | 1,877 | 30 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 669 | 49 | 0 | 7.3% |
| `get_issue` | 313 | 13 | 5 | 4.2% |
| `get_issue_comments` | 301 | 0 | 10 | 0% |
| `list` | 290 | 3 | 0 | 1% |
| `get_check_runs` | 276 | 12 | 0 | 4.3% |
| `get_pr` | 271 | 9 | 3 | 3.3% |
| `glob` | 223 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 176 | 0 | 0 | 0% |
| `check_merge_readiness` | 165 | 0 | 0 | 0% |
| `commit_and_push` | 158 | 8 | 0 | 5.1% |
| `write` | 155 | 2 | 0 | 1.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `create_pr` | 136 | 44 | 0 | 32.4% |
| `search_issues` | 118 | 0 | 3 | 0% |
| `get_pr_diff` | 116 | 3 | 0 | 2.6% |
| `request_close_issue` | 85 | 1 | 0 | 1.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 60 | 0 | 0 | 0% |
| `list_prs` | 56 | 0 | 0 | 0% |
| `merge_pr` | 55 | 0 | 0 | 0% |
| `list_pr_review_comments` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `search_code` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate` | 25 | 0 | 0 | 0% |
| `delegate_readonly` | 25 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `load_skill` | 13 | 9 | 0 | 69.2% |
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
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,876 | 78.2% |
| `edit` | 472 | 7.6% |
| `search` | 467 | 7.5% |
| `verify` | 233 | 3.7% |
| `open` | 189 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 193 | 86.5% |
| `delivery/pipeline-setup` | 10 | 4.5% |
| `engineering/environment` | 7 | 3.1% |
| `engineering/secrets-in-a-check` | 5 | 2.2% |
| `research/web-search` | 4 | 1.8% |
| `docs/customer-doc` | 3 | 1.3% |
| `docs/design-doc` | 1 | 0.4% |

## All time

264 sessions.

**Ran to an end without a report:** 48 of 240 sessions whose last run the core recorded as `completed` — 20%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 14 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**873,575,036 tokens** over 315 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,337,902 | 5,758,740 | 28,119,706 | 73,718,100 | 873,575,036 |
| messages per session | 111 | 327 | 705 | 731 | 40,627 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 103 | 39% |
| `engineer` | 88 | 33.3% |
| `atomaton` | 73 | 27.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,237 | 128 | 98 | 2.1% |
| `read` | 4,867 | 25 | 8 | 0.5% |
| `grep` | 3,439 | 92 | 9 | 2.7% |
| `edit` | 1,877 | 30 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 669 | 49 | 0 | 7.3% |
| `get_issue` | 313 | 13 | 5 | 4.2% |
| `get_issue_comments` | 301 | 0 | 10 | 0% |
| `list` | 290 | 3 | 0 | 1% |
| `get_check_runs` | 276 | 12 | 0 | 4.3% |
| `get_pr` | 271 | 9 | 3 | 3.3% |
| `glob` | 223 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 176 | 0 | 0 | 0% |
| `check_merge_readiness` | 165 | 0 | 0 | 0% |
| `commit_and_push` | 158 | 8 | 0 | 5.1% |
| `write` | 155 | 2 | 0 | 1.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `create_pr` | 136 | 44 | 0 | 32.4% |
| `search_issues` | 118 | 0 | 3 | 0% |
| `get_pr_diff` | 116 | 3 | 0 | 2.6% |
| `request_close_issue` | 85 | 1 | 0 | 1.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 60 | 0 | 0 | 0% |
| `list_prs` | 56 | 0 | 0 | 0% |
| `merge_pr` | 55 | 0 | 0 | 0% |
| `list_pr_review_comments` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `search_code` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate` | 25 | 0 | 0 | 0% |
| `delegate_readonly` | 25 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `load_skill` | 13 | 9 | 0 | 69.2% |
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
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,876 | 78.2% |
| `edit` | 472 | 7.6% |
| `search` | 467 | 7.5% |
| `verify` | 233 | 3.7% |
| `open` | 189 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 193 | 86.5% |
| `delivery/pipeline-setup` | 10 | 4.5% |
| `engineering/environment` | 7 | 3.1% |
| `engineering/secrets-in-a-check` | 5 | 2.2% |
| `research/web-search` | 4 | 1.8% |
| `docs/customer-doc` | 3 | 1.3% |
| `docs/design-doc` | 1 | 0.4% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-07 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
