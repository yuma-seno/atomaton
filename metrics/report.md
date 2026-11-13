# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-13.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 114 | 7.9% | 499 | 6,099 | 21 | 22.3 |
| Last 30 days | 612 | 5.7% | 244 | 9,859 | 13 | 18.3 |
| Last year | 677 | 5.8% | 258 | 10,246 | 15 | 19.5 |
| All time | 677 | 5.8% | 258 | 10,246 | 15 | 19.5 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 638 |
| `failed` | 28 |
| `stopped` | 11 |

## Last 7 days

44 sessions.

**Ran to an end without a report:** 8 of 43 sessions whose last run the core recorded as `completed` — 18.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**244,107,848 tokens** over 60 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,895,877 | 10,836,578 | 29,805,044 | 29,805,044 | 244,107,848 |
| messages per session | 225 | 374 | 439 | 439 | 9,655 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 19 | 43.2% |
| `reviewer` | 16 | 36.4% |
| `atomaton` | 9 | 20.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,261 | 48 | 29 | 2.1% |
| `read` | 858 | 4 | 0 | 0.5% |
| `grep` | 789 | 22 | 10 | 2.8% |
| `edit` | 406 | 7 | 0 | 1.7% |
| `fetch` | 231 | 14 | 0 | 6.1% |
| `get_check_runs` | 61 | 0 | 0 | 0% |
| `get_pr` | 59 | 0 | 0 | 0% |
| `glob` | 56 | 0 | 0 | 0% |
| `write` | 56 | 0 | 0 | 0% |
| `get_issue_comments` | 54 | 0 | 0 | 0% |
| `list` | 53 | 0 | 0 | 0% |
| `get_issue` | 46 | 1 | 0 | 2.2% |
| `commit_and_push` | 37 | 1 | 0 | 2.7% |
| `load_skill` | 34 | 4 | 0 | 11.8% |
| `check_merge_readiness` | 30 | 0 | 0 | 0% |
| `create_pr` | 24 | 7 | 0 | 29.2% |
| `get_branch` | 23 | 0 | 0 | 0% |
| `get_pr_reviews` | 19 | 0 | 0 | 0% |
| `get_pr_diff` | 16 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `search_code` | 15 | 0 | 0 | 0% |
| `search_issues` | 13 | 0 | 0 | 0% |
| `search_remote_code` | 13 | 5 | 0 | 38.5% |
| `request_close_issue` | 12 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 11 | 1 | 0 | 9.1% |
| `list_prs` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `delegate` | 6 | 0 | 0 | 0% |
| `delegate_large` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `create_root_issue` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `delegate_readonly` | 1 | 0 | 0 | 0% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `publish_draft` | 1 | 0 | 0 | 0% |
| `sync_branch` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 2,001 | 88.5% |
| `edit` | 133 | 5.9% |
| `open` | 64 | 2.8% |
| `search` | 58 | 2.6% |
| `verify` | 5 | 0.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 32 | 71.1% |
| `writing/japanese` | 7 | 15.6% |
| `research/web-search` | 3 | 6.7% |
| `engineering/secrets-in-a-check` | 2 | 4.4% |
| `delivery/pipeline-setup` | 1 | 2.2% |

## Last 30 days

237 sessions.

**Ran to an end without a report:** 42 of 228 sessions whose last run the core recorded as `completed` — 18.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**698,777,363 tokens** over 313 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,201,847 | 5,067,507 | 20,308,488 | 39,097,860 | 698,777,363 |
| messages per session | 111 | 307 | 463 | 731 | 36,410 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 100 | 42.2% |
| `engineer` | 77 | 32.5% |
| `atomaton` | 60 | 25.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,391 | 124 | 89 | 1.9% |
| `read` | 4,306 | 21 | 4 | 0.5% |
| `grep` | 3,254 | 92 | 11 | 2.8% |
| `edit` | 1,839 | 33 | 0 | 1.8% |
| `fetch` | 679 | 56 | 0 | 8.2% |
| `get_issue` | 298 | 14 | 5 | 4.7% |
| `get_check_runs` | 279 | 10 | 0 | 3.6% |
| `get_pr` | 276 | 5 | 3 | 1.8% |
| `get_issue_comments` | 272 | 0 | 2 | 0% |
| `glob` | 222 | 1 | 0 | 0.5% |
| `list` | 222 | 2 | 0 | 0.9% |
| `check_merge_readiness` | 172 | 0 | 0 | 0% |
| `commit_and_push` | 165 | 7 | 0 | 4.2% |
| `atoma_builtin__load_skill` | 164 | 1 | 0 | 0.6% |
| `get_branch` | 149 | 0 | 0 | 0% |
| `create_pr` | 141 | 44 | 0 | 31.2% |
| `write` | 133 | 2 | 0 | 1.5% |
| `get_pr_diff` | 113 | 2 | 0 | 1.8% |
| `search_issues` | 101 | 0 | 1 | 0% |
| `request_close_issue` | 88 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 61 | 0 | 0 | 0% |
| `merge_pr` | 57 | 0 | 0 | 0% |
| `list_prs` | 46 | 0 | 0 | 0% |
| `list_pr_review_comments` | 45 | 0 | 0 | 0% |
| `load_skill` | 39 | 9 | 0 | 23.1% |
| `search_remote_code` | 38 | 11 | 0 | 28.9% |
| `search_code` | 37 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `delegate` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `delegate_readonly` | 20 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `list_issues` | 12 | 0 | 0 | 0% |
| `sync_branch` | 11 | 6 | 0 | 54.5% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `create_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `publish_draft` | 3 | 0 | 0 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,100 | 79.8% |
| `edit` | 457 | 7.2% |
| `search` | 428 | 6.7% |
| `verify` | 213 | 3.3% |
| `open` | 193 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 178 | 87.7% |
| `writing/japanese` | 7 | 3.4% |
| `delivery/pipeline-setup` | 5 | 2.5% |
| `research/web-search` | 5 | 2.5% |
| `engineering/secrets-in-a-check` | 4 | 2% |
| `docs/customer-doc` | 3 | 1.5% |
| `engineering/environment` | 1 | 0.5% |

## Last year

273 sessions.

**Ran to an end without a report:** 53 of 263 sessions whose last run the core recorded as `completed` — 20.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**968,180,768 tokens** over 348 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,337,902 | 5,781,615 | 28,119,706 | 73,718,100 | 968,180,768 |
| messages per session | 123 | 331 | 705 | 731 | 45,323 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 110 | 40.3% |
| `engineer` | 88 | 32.2% |
| `atomaton` | 75 | 27.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,240 | 148 | 114 | 2% |
| `read` | 5,355 | 28 | 8 | 0.5% |
| `grep` | 3,946 | 104 | 18 | 2.6% |
| `edit` | 2,051 | 34 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 781 | 59 | 0 | 7.6% |
| `get_issue` | 337 | 14 | 5 | 4.2% |
| `list` | 327 | 3 | 0 | 0.9% |
| `get_issue_comments` | 325 | 0 | 10 | 0% |
| `get_pr` | 310 | 9 | 3 | 2.9% |
| `get_check_runs` | 308 | 12 | 0 | 3.9% |
| `glob` | 267 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 188 | 0 | 0 | 0% |
| `check_merge_readiness` | 186 | 0 | 0 | 0% |
| `write` | 183 | 2 | 0 | 1.1% |
| `commit_and_push` | 174 | 9 | 0 | 5.2% |
| `create_pr` | 150 | 47 | 0 | 31.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 125 | 3 | 0 | 2.4% |
| `search_issues` | 125 | 0 | 3 | 0% |
| `request_close_issue` | 92 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 69 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 61 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_code` | 41 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `load_skill` | 39 | 9 | 0 | 23.1% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
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
| `publish_draft` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,723 | 79% |
| `edit` | 537 | 7.4% |
| `search` | 504 | 7% |
| `open` | 239 | 3.3% |
| `verify` | 237 | 3.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 209 | 83.9% |
| `delivery/pipeline-setup` | 10 | 4% |
| `engineering/environment` | 7 | 2.8% |
| `writing/japanese` | 7 | 2.8% |
| `engineering/secrets-in-a-check` | 6 | 2.4% |
| `research/web-search` | 6 | 2.4% |
| `docs/customer-doc` | 3 | 1.2% |
| `docs/design-doc` | 1 | 0.4% |

## All time

288 sessions.

**Ran to an end without a report:** 53 of 263 sessions whose last run the core recorded as `completed` — 20.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 15 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**968,180,768 tokens** over 348 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,337,902 | 5,781,615 | 28,119,706 | 73,718,100 | 968,180,768 |
| messages per session | 115 | 330 | 705 | 731 | 45,401 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 114 | 39.6% |
| `engineer` | 96 | 33.3% |
| `atomaton` | 78 | 27.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,240 | 148 | 114 | 2% |
| `read` | 5,355 | 28 | 8 | 0.5% |
| `grep` | 3,946 | 104 | 18 | 2.6% |
| `edit` | 2,051 | 34 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 781 | 59 | 0 | 7.6% |
| `get_issue` | 337 | 14 | 5 | 4.2% |
| `list` | 327 | 3 | 0 | 0.9% |
| `get_issue_comments` | 325 | 0 | 10 | 0% |
| `get_pr` | 310 | 9 | 3 | 2.9% |
| `get_check_runs` | 308 | 12 | 0 | 3.9% |
| `glob` | 267 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 188 | 0 | 0 | 0% |
| `check_merge_readiness` | 186 | 0 | 0 | 0% |
| `write` | 183 | 2 | 0 | 1.1% |
| `commit_and_push` | 174 | 9 | 0 | 5.2% |
| `create_pr` | 150 | 47 | 0 | 31.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 125 | 3 | 0 | 2.4% |
| `search_issues` | 125 | 0 | 3 | 0% |
| `request_close_issue` | 92 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 69 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 61 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_code` | 41 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `load_skill` | 39 | 9 | 0 | 23.1% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
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
| `publish_draft` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,723 | 79% |
| `edit` | 537 | 7.4% |
| `search` | 504 | 7% |
| `open` | 239 | 3.3% |
| `verify` | 237 | 3.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 209 | 83.9% |
| `delivery/pipeline-setup` | 10 | 4% |
| `engineering/environment` | 7 | 2.8% |
| `writing/japanese` | 7 | 2.8% |
| `engineering/secrets-in-a-check` | 6 | 2.4% |
| `research/web-search` | 6 | 2.4% |
| `docs/customer-doc` | 3 | 1.2% |
| `docs/design-doc` | 1 | 0.4% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-13 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/agent-prompt-surface`
- `security/atomaton-surface`
- `security/gh-actions-surface`
- `security/on-demand-audit`
