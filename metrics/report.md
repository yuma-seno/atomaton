# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-07.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 187 | 3.2% | 244 | 6,099 | 10 | 26.1 |
| Last 30 days | 594 | 4.9% | 246 | 9,859 | 14 | 18.3 |
| Last year | 627 | 5.1% | 255 | 10,246 | 15 | 18.9 |
| All time | 627 | 5.1% | 255 | 10,246 | 15 | 18.9 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 595 |
| `failed` | 21 |
| `stopped` | 11 |

## Last 7 days

64 sessions.

**Ran to an end without a report:** 7 of 60 sessions whose last run the core recorded as `completed` — 11.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**265,347,498 tokens** over 81 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,584,100 | 9,658,210 | 29,805,044 | 29,805,044 | 265,347,498 |
| messages per session | 144 | 341 | 439 | 439 | 10,645 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 27 | 42.2% |
| `reviewer` | 22 | 34.4% |
| `atomaton` | 15 | 23.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,171 | 62 | 34 | 2.9% |
| `read` | 1,048 | 3 | 0 | 0.3% |
| `grep` | 813 | 28 | 1 | 3.4% |
| `edit` | 415 | 6 | 0 | 1.4% |
| `fetch` | 282 | 14 | 0 | 5% |
| `get_pr` | 74 | 0 | 0 | 0% |
| `get_check_runs` | 68 | 2 | 0 | 2.9% |
| `get_issue_comments` | 55 | 0 | 0 | 0% |
| `list` | 53 | 0 | 0 | 0% |
| `commit_and_push` | 51 | 0 | 0 | 0% |
| `get_issue` | 51 | 0 | 0 | 0% |
| `glob` | 50 | 0 | 0 | 0% |
| `write` | 45 | 1 | 0 | 2.2% |
| `check_merge_readiness` | 41 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `create_pr` | 39 | 13 | 0 | 33.3% |
| `get_branch` | 38 | 0 | 0 | 0% |
| `get_pr_diff` | 28 | 0 | 0 | 0% |
| `get_pr_reviews` | 25 | 0 | 0 | 0% |
| `request_close_issue` | 23 | 0 | 0 | 0% |
| `merge_pr` | 20 | 0 | 0 | 0% |
| `search_remote_code` | 18 | 6 | 0 | 33.3% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `create_sub_issue` | 16 | 0 | 0 | 0% |
| `list_prs` | 15 | 0 | 0 | 0% |
| `load_skill` | 14 | 7 | 0 | 50% |
| `launch_sub_agent` | 12 | 0 | 0 | 0% |
| `search_issues` | 12 | 0 | 0 | 0% |
| `search_code` | 9 | 0 | 0 | 0% |
| `create_root_issue` | 7 | 0 | 0 | 0% |
| `delegate` | 6 | 0 | 0 | 0% |
| `delegate_readonly` | 5 | 0 | 0 | 0% |
| `delegate_large` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 4 | 0 | 100% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,890 | 87.1% |
| `edit` | 161 | 7.4% |
| `search` | 70 | 3.2% |
| `open` | 41 | 1.9% |
| `verify` | 9 | 0.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 43 | 81.1% |
| `delivery/pipeline-setup` | 3 | 5.7% |
| `docs/customer-doc` | 3 | 5.7% |
| `engineering/secrets-in-a-check` | 2 | 3.8% |
| `engineering/environment` | 1 | 1.9% |
| `research/web-search` | 1 | 1.9% |

## Last 30 days

237 sessions.

**Ran to an end without a report:** 43 of 228 sessions whose last run the core recorded as `completed` — 18.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**841,985,043 tokens** over 305 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,279,073 | 5,758,740 | 28,119,706 | 73,718,100 | 841,985,043 |
| messages per session | 117 | 323 | 705 | 731 | 38,167 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 100 | 42.2% |
| `engineer` | 76 | 32.1% |
| `atomaton` | 61 | 25.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,471 | 135 | 103 | 2.1% |
| `read` | 4,541 | 22 | 6 | 0.5% |
| `grep` | 3,356 | 93 | 8 | 2.8% |
| `edit` | 1,840 | 30 | 0 | 1.6% |
| `fetch` | 727 | 54 | 0 | 7.4% |
| `shell__shell_execute` | 518 | 4 | 0 | 0.8% |
| `get_issue` | 322 | 13 | 5 | 4% |
| `get_issue_comments` | 305 | 0 | 10 | 0% |
| `get_pr` | 292 | 9 | 3 | 3.1% |
| `get_check_runs` | 282 | 12 | 0 | 4.3% |
| `list` | 243 | 2 | 0 | 0.8% |
| `glob` | 218 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 187 | 1 | 0 | 0.5% |
| `get_branch` | 181 | 0 | 0 | 0% |
| `check_merge_readiness` | 170 | 0 | 0 | 0% |
| `commit_and_push` | 162 | 8 | 0 | 4.9% |
| `create_pr` | 140 | 45 | 0 | 32.1% |
| `write` | 128 | 2 | 0 | 1.6% |
| `search_issues` | 120 | 0 | 3 | 0% |
| `get_pr_diff` | 119 | 3 | 0 | 2.5% |
| `request_close_issue` | 86 | 1 | 0 | 1.2% |
| `get_pr_reviews` | 62 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `merge_pr` | 57 | 0 | 0 | 0% |
| `list_pr_review_comments` | 46 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `search_code` | 33 | 0 | 0 | 0% |
| `web__fetch` | 31 | 5 | 0 | 16.1% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `delegate` | 26 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `load_skill` | 16 | 9 | 0 | 56.3% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
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
| `other` | 5,092 | 78.7% |
| `edit` | 484 | 7.5% |
| `search` | 468 | 7.2% |
| `verify` | 233 | 3.6% |
| `open` | 194 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 181 | 89.2% |
| `delivery/pipeline-setup` | 6 | 3% |
| `engineering/secrets-in-a-check` | 5 | 2.5% |
| `research/web-search` | 4 | 2% |
| `docs/customer-doc` | 3 | 1.5% |
| `engineering/environment` | 3 | 1.5% |
| `docs/design-doc` | 1 | 0.5% |

## Last year

255 sessions.

**Ran to an end without a report:** 49 of 245 sessions whose last run the core recorded as `completed` — 20%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**923,339,161 tokens** over 321 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,370,053 | 5,781,615 | 28,119,706 | 73,718,100 | 923,339,161 |
| messages per session | 120 | 330 | 705 | 731 | 41,997 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 103 | 40.4% |
| `engineer` | 82 | 32.2% |
| `atomaton` | 70 | 27.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,471 | 135 | 103 | 2.1% |
| `read` | 5,055 | 25 | 8 | 0.5% |
| `grep` | 3,628 | 97 | 9 | 2.7% |
| `edit` | 1,921 | 30 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 727 | 54 | 0 | 7.4% |
| `get_issue` | 322 | 13 | 5 | 4% |
| `get_issue_comments` | 305 | 0 | 10 | 0% |
| `get_pr` | 292 | 9 | 3 | 3.1% |
| `list` | 292 | 3 | 0 | 1% |
| `get_check_runs` | 282 | 12 | 0 | 4.3% |
| `glob` | 231 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 181 | 0 | 0 | 0% |
| `check_merge_readiness` | 170 | 0 | 0 | 0% |
| `commit_and_push` | 162 | 8 | 0 | 4.9% |
| `write` | 157 | 2 | 0 | 1.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `create_pr` | 140 | 45 | 0 | 32.1% |
| `search_issues` | 120 | 0 | 3 | 0% |
| `get_pr_diff` | 119 | 3 | 0 | 2.5% |
| `request_close_issue` | 86 | 1 | 0 | 1.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 62 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `merge_pr` | 57 | 0 | 0 | 0% |
| `list_pr_review_comments` | 46 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `search_code` | 33 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate` | 26 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `load_skill` | 16 | 9 | 0 | 56.3% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
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
| `other` | 5,092 | 78.7% |
| `edit` | 484 | 7.5% |
| `search` | 468 | 7.2% |
| `verify` | 233 | 3.6% |
| `open` | 194 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 196 | 86.7% |
| `delivery/pipeline-setup` | 10 | 4.4% |
| `engineering/environment` | 7 | 3.1% |
| `engineering/secrets-in-a-check` | 5 | 2.2% |
| `research/web-search` | 4 | 1.8% |
| `docs/customer-doc` | 3 | 1.3% |
| `docs/design-doc` | 1 | 0.4% |

## All time

270 sessions.

**Ran to an end without a report:** 49 of 245 sessions whose last run the core recorded as `completed` — 20%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 15 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**923,339,161 tokens** over 321 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,370,053 | 5,781,615 | 28,119,706 | 73,718,100 | 923,339,161 |
| messages per session | 113 | 327 | 705 | 731 | 42,075 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 107 | 39.6% |
| `engineer` | 90 | 33.3% |
| `atomaton` | 73 | 27% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,471 | 135 | 103 | 2.1% |
| `read` | 5,055 | 25 | 8 | 0.5% |
| `grep` | 3,628 | 97 | 9 | 2.7% |
| `edit` | 1,921 | 30 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 727 | 54 | 0 | 7.4% |
| `get_issue` | 322 | 13 | 5 | 4% |
| `get_issue_comments` | 305 | 0 | 10 | 0% |
| `get_pr` | 292 | 9 | 3 | 3.1% |
| `list` | 292 | 3 | 0 | 1% |
| `get_check_runs` | 282 | 12 | 0 | 4.3% |
| `glob` | 231 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 181 | 0 | 0 | 0% |
| `check_merge_readiness` | 170 | 0 | 0 | 0% |
| `commit_and_push` | 162 | 8 | 0 | 4.9% |
| `write` | 157 | 2 | 0 | 1.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `create_pr` | 140 | 45 | 0 | 32.1% |
| `search_issues` | 120 | 0 | 3 | 0% |
| `get_pr_diff` | 119 | 3 | 0 | 2.5% |
| `request_close_issue` | 86 | 1 | 0 | 1.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 62 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `merge_pr` | 57 | 0 | 0 | 0% |
| `list_pr_review_comments` | 46 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `search_code` | 33 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate` | 26 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `load_skill` | 16 | 9 | 0 | 56.3% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
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
| `other` | 5,092 | 78.7% |
| `edit` | 484 | 7.5% |
| `search` | 468 | 7.2% |
| `verify` | 233 | 3.6% |
| `open` | 194 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 196 | 86.7% |
| `delivery/pipeline-setup` | 10 | 4.4% |
| `engineering/environment` | 7 | 3.1% |
| `engineering/secrets-in-a-check` | 5 | 2.2% |
| `research/web-search` | 4 | 1.8% |
| `docs/customer-doc` | 3 | 1.3% |
| `docs/design-doc` | 1 | 0.4% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-10-25 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
