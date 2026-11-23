# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-23.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 52 | 26.9% | 56 | 696 | 10 | 6.5 |
| Last 30 days | 559 | 9.7% | 240 | 6,099 | 12 | 17.6 |
| Last year | 832 | 8.7% | 259 | 10,246 | 14 | 19.7 |
| All time | 832 | 8.7% | 259 | 10,246 | 14 | 19.7 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 760 |
| `failed` | 61 |
| `stopped` | 11 |

## Last 7 days

23 sessions.

**Ran to an end without a report:** 7 of 22 sessions whose last run the core recorded as `completed` — 31.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**23,307,448 tokens** over 18 runs that reported them, **98.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**92.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 610,350 | 3,400,391 | 7,840,910 | 7,840,910 | 23,307,448 |
| messages per session | 69 | 177 | 198 | 198 | 2,068 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 11 | 47.8% |
| `engineer` | 10 | 43.5% |
| `atomaton` | 2 | 8.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 351 | 2 | 0 | 0.6% |
| `bash` | 304 | 4 | 2 | 1.3% |
| `grep` | 206 | 0 | 0 | 0% |
| `edit` | 73 | 3 | 0 | 4.1% |
| `list` | 30 | 0 | 0 | 0% |
| `load_skill` | 20 | 0 | 0 | 0% |
| `fetch` | 19 | 0 | 0 | 0% |
| `get_check_runs` | 16 | 0 | 0 | 0% |
| `get_pr` | 16 | 0 | 0 | 0% |
| `check_merge_readiness` | 14 | 0 | 0 | 0% |
| `glob` | 14 | 0 | 0 | 0% |
| `commit_and_push` | 12 | 1 | 0 | 8.3% |
| `create_pr` | 12 | 3 | 0 | 25% |
| `get_pr_reviews` | 10 | 0 | 0 | 0% |
| `get_issue_comments` | 9 | 0 | 0 | 0% |
| `request_close_issue` | 9 | 0 | 0 | 0% |
| `get_branch` | 8 | 0 | 0 | 0% |
| `get_issue` | 7 | 0 | 0 | 0% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `write` | 6 | 0 | 0 | 0% |
| `search_remote_code` | 5 | 3 | 0 | 60% |
| `get_pr_diff` | 4 | 0 | 0 | 0% |
| `search_issues` | 3 | 0 | 0 | 0% |
| `create_root_issue` | 2 | 0 | 0 | 0% |
| `list_prs` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 236 | 77.6% |
| `edit` | 41 | 13.5% |
| `open` | 10 | 3.3% |
| `search` | 10 | 3.3% |
| `verify` | 7 | 2.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 16 | 80% |
| `research/web-search` | 2 | 10% |
| `writing/japanese` | 2 | 10% |

## Last 30 days

202 sessions.

**Ran to an end without a report:** 37 of 191 sessions whose last run the core recorded as `completed` — 19.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**600,417,128 tokens** over 246 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the 244 of 246 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,201,847 | 6,417,588 | 20,308,488 | 29,805,044 | 600,417,128 |
| messages per session | 120 | 307 | 408 | 439 | 30,596 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 86 | 42.6% |
| `engineer` | 85 | 42.1% |
| `atomaton` | 30 | 14.9% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,928 | 128 | 83 | 2.2% |
| `read` | 3,395 | 13 | 4 | 0.4% |
| `grep` | 2,785 | 63 | 14 | 2.3% |
| `edit` | 1,155 | 22 | 0 | 1.9% |
| `fetch` | 719 | 62 | 0 | 8.6% |
| `get_check_runs` | 223 | 8 | 0 | 3.6% |
| `get_pr` | 222 | 0 | 3 | 0% |
| `get_issue_comments` | 196 | 0 | 0 | 0% |
| `list` | 181 | 3 | 0 | 1.7% |
| `glob` | 179 | 0 | 0 | 0% |
| `get_issue` | 163 | 1 | 1 | 0.6% |
| `commit_and_push` | 145 | 5 | 0 | 3.4% |
| `check_merge_readiness` | 139 | 0 | 0 | 0% |
| `create_pr` | 122 | 37 | 0 | 30.3% |
| `write` | 119 | 2 | 0 | 1.7% |
| `get_branch` | 104 | 0 | 0 | 0% |
| `load_skill` | 101 | 9 | 0 | 8.9% |
| `atoma_builtin__load_skill` | 92 | 1 | 0 | 1.1% |
| `get_pr_diff` | 83 | 0 | 0 | 0% |
| `request_close_issue` | 75 | 1 | 0 | 1.3% |
| `get_pr_reviews` | 74 | 0 | 0 | 0% |
| `merge_pr` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 54 | 0 | 0 | 0% |
| `search_issues` | 44 | 0 | 1 | 0% |
| `list_prs` | 33 | 0 | 0 | 0% |
| `search_code` | 31 | 0 | 0 | 0% |
| `search_remote_code` | 28 | 12 | 0 | 42.9% |
| `create_root_issue` | 22 | 0 | 0 | 0% |
| `create_sub_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 19 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `delegate_readonly` | 8 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `delegate_large` | 5 | 0 | 0 | 0% |
| `sync_branch` | 5 | 4 | 0 | 80% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,151 | 86.9% |
| `edit` | 459 | 7.7% |
| `search` | 163 | 2.7% |
| `open` | 127 | 2.1% |
| `verify` | 28 | 0.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 140 | 72.5% |
| `writing/japanese` | 33 | 17.1% |
| `research/web-search` | 8 | 4.1% |
| `delivery/pipeline-setup` | 4 | 2.1% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `docs/customer-doc` | 3 | 1.6% |
| `engineering/environment` | 1 | 0.5% |

## Last year

323 sessions.

**Ran to an end without a report:** 62 of 309 sessions whose last run the core recorded as `completed` — 20.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,134,242,465 tokens** over 408 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 406 of 408 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,291,903 | 6,183,128 | 27,846,035 | 73,718,100 | 1,134,242,465 |
| messages per session | 129 | 334 | 583 | 731 | 53,542 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 135 | 41.8% |
| `engineer` | 107 | 33.1% |
| `atomaton` | 80 | 24.8% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,575 | 172 | 128 | 2% |
| `read` | 6,492 | 34 | 8 | 0.5% |
| `grep` | 4,980 | 112 | 21 | 2.2% |
| `edit` | 2,233 | 38 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,061 | 98 | 0 | 9.2% |
| `list` | 392 | 5 | 0 | 1.3% |
| `get_issue` | 367 | 14 | 5 | 3.8% |
| `get_pr` | 365 | 9 | 3 | 2.5% |
| `get_issue_comments` | 362 | 0 | 10 | 0% |
| `get_check_runs` | 355 | 13 | 0 | 3.7% |
| `glob` | 332 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 221 | 0 | 0 | 0% |
| `get_branch` | 213 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `commit_and_push` | 208 | 10 | 0 | 4.8% |
| `write` | 205 | 2 | 0 | 1% |
| `create_pr` | 182 | 58 | 0 | 31.9% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 143 | 3 | 0 | 2.1% |
| `search_issues` | 134 | 0 | 3 | 0% |
| `request_close_issue` | 111 | 1 | 0 | 0.9% |
| `load_skill` | 101 | 9 | 0 | 8.9% |
| `get_pr_reviews` | 92 | 0 | 0 | 0% |
| `merge_pr` | 71 | 0 | 0 | 0% |
| `list_pr_review_comments` | 69 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search_remote_code` | 48 | 17 | 0 | 35.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 35 | 1 | 0 | 2.9% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `delegate_readonly` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 17 | 0 | 0 | 0% |
| `sync_branch` | 16 | 7 | 0 | 43.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `merge_base_into_branch` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 6,845 | 79.8% |
| `edit` | 673 | 7.8% |
| `search` | 537 | 6.3% |
| `open` | 273 | 3.2% |
| `verify` | 247 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 77.5% |
| `writing/japanese` | 33 | 10.6% |
| `delivery/pipeline-setup` | 10 | 3.2% |
| `research/web-search` | 10 | 3.2% |
| `engineering/environment` | 7 | 2.3% |
| `engineering/secrets-in-a-check` | 6 | 1.9% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## All time

342 sessions.

**Ran to an end without a report:** 62 of 309 sessions whose last run the core recorded as `completed` — 20.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,134,242,465 tokens** over 408 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 406 of 408 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,291,903 | 6,183,128 | 27,846,035 | 73,718,100 | 1,134,242,465 |
| messages per session | 119 | 330 | 583 | 731 | 53,666 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 141 | 41.2% |
| `engineer` | 117 | 34.2% |
| `atomaton` | 83 | 24.3% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,575 | 172 | 128 | 2% |
| `read` | 6,492 | 34 | 8 | 0.5% |
| `grep` | 4,980 | 112 | 21 | 2.2% |
| `edit` | 2,233 | 38 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,061 | 98 | 0 | 9.2% |
| `list` | 392 | 5 | 0 | 1.3% |
| `get_issue` | 367 | 14 | 5 | 3.8% |
| `get_pr` | 365 | 9 | 3 | 2.5% |
| `get_issue_comments` | 362 | 0 | 10 | 0% |
| `get_check_runs` | 355 | 13 | 0 | 3.7% |
| `glob` | 332 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 221 | 0 | 0 | 0% |
| `get_branch` | 213 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `commit_and_push` | 208 | 10 | 0 | 4.8% |
| `write` | 205 | 2 | 0 | 1% |
| `create_pr` | 182 | 58 | 0 | 31.9% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 143 | 3 | 0 | 2.1% |
| `search_issues` | 134 | 0 | 3 | 0% |
| `request_close_issue` | 111 | 1 | 0 | 0.9% |
| `load_skill` | 101 | 9 | 0 | 8.9% |
| `get_pr_reviews` | 92 | 0 | 0 | 0% |
| `merge_pr` | 71 | 0 | 0 | 0% |
| `list_pr_review_comments` | 69 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search_remote_code` | 48 | 17 | 0 | 35.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 35 | 1 | 0 | 2.9% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `delegate_readonly` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 17 | 0 | 0 | 0% |
| `sync_branch` | 16 | 7 | 0 | 43.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `merge_base_into_branch` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 6,845 | 79.8% |
| `edit` | 673 | 7.8% |
| `search` | 537 | 6.3% |
| `open` | 273 | 3.2% |
| `verify` | 247 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 77.5% |
| `writing/japanese` | 33 | 10.6% |
| `delivery/pipeline-setup` | 10 | 3.2% |
| `research/web-search` | 10 | 3.2% |
| `engineering/environment` | 7 | 2.3% |
| `engineering/secrets-in-a-check` | 6 | 1.9% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-23 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `agent-prompt-surface`
- `customer-doc`
- `environment`
- `gh-actions-surface`
- `japanese`
- `on-demand-audit`
- `pipeline-setup`
- `secrets-in-a-check`
- `web-search`
