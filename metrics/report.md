# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-27.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 150 | 26% | 77 | 3,219 | 9 | 7.3 |
| Last 30 days | 507 | 14.2% | 244 | 6,099 | 11 | 19.9 |
| Last year | 933 | 10.4% | 248 | 10,246 | 13 | 18.7 |
| All time | 933 | 10.4% | 248 | 10,246 | 13 | 18.7 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 836 |
| `failed` | 86 |
| `stopped` | 11 |

## Last 7 days

58 sessions.

**Ran to an end without a report:** 19 of 55 sessions whose last run the core recorded as `completed` — 34.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**81,151,908 tokens** over 58 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**90.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 733,423 | 3,400,391 | 7,840,910 | 7,840,910 | 81,151,908 |
| messages per session | 96 | 193 | 293 | 293 | 6,459 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 24 | 41.4% |
| `reviewer` | 22 | 37.9% |
| `atomaton` | 12 | 20.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,072 | 21 | 8 | 2% |
| `read` | 916 | 7 | 0 | 0.8% |
| `grep` | 501 | 11 | 1 | 2.2% |
| `edit` | 241 | 12 | 0 | 5% |
| `fetch` | 68 | 1 | 0 | 1.5% |
| `list` | 59 | 0 | 0 | 0% |
| `load_skill` | 57 | 0 | 0 | 0% |
| `get_issue_comments` | 45 | 0 | 0 | 0% |
| `get_check_runs` | 41 | 1 | 0 | 2.4% |
| `get_pr` | 38 | 0 | 0 | 0% |
| `check_merge_readiness` | 35 | 0 | 0 | 0% |
| `create_pr` | 34 | 10 | 0 | 29.4% |
| `get_issue` | 33 | 0 | 0 | 0% |
| `commit_and_push` | 32 | 1 | 0 | 3.1% |
| `glob` | 32 | 0 | 0 | 0% |
| `search_code` | 29 | 0 | 0 | 0% |
| `write` | 25 | 0 | 0 | 0% |
| `get_pr_reviews` | 24 | 0 | 0 | 0% |
| `search_issues` | 22 | 0 | 0 | 0% |
| `request_close_issue` | 21 | 0 | 0 | 0% |
| `get_pr_diff` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `get_branch` | 16 | 0 | 0 | 0% |
| `merge_pr` | 16 | 0 | 0 | 0% |
| `delegate_readonly` | 7 | 0 | 0 | 0% |
| `search_remote_code` | 7 | 5 | 0 | 71.4% |
| `list_prs` | 6 | 0 | 0 | 0% |
| `create_root_issue` | 4 | 0 | 0 | 0% |
| `delegate_readonly_large` | 3 | 0 | 0 | 0% |
| `delegate` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 786 | 73.3% |
| `edit` | 184 | 17.2% |
| `search` | 51 | 4.8% |
| `open` | 31 | 2.9% |
| `verify` | 20 | 1.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `conventions` | 24 | 42.1% |
| `project/conventions` | 15 | 26.3% |
| `japanese` | 14 | 24.6% |
| `research/web-search` | 2 | 3.5% |
| `on-demand-audit` | 1 | 1.8% |
| `web-search` | 1 | 1.8% |

## Last 30 days

174 sessions.

**Ran to an end without a report:** 32 of 164 sessions whose last run the core recorded as `completed` — 19.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**556,664,492 tokens** over 219 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.5% of that prompt was served from cache**, over the 217 of 219 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,645 | 7,133,020 | 20,308,488 | 29,805,044 | 556,664,492 |
| messages per session | 136 | 328 | 425 | 439 | 27,296 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 68 | 39.1% |
| `reviewer` | 67 | 38.5% |
| `atomaton` | 38 | 21.8% |
| `architect` | 1 | 0.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,146 | 119 | 65 | 2.3% |
| `read` | 3,166 | 18 | 0 | 0.6% |
| `grep` | 2,545 | 58 | 14 | 2.3% |
| `edit` | 903 | 23 | 0 | 2.5% |
| `fetch` | 684 | 60 | 0 | 8.8% |
| `list` | 191 | 2 | 0 | 1% |
| `glob` | 177 | 0 | 0 | 0% |
| `get_pr` | 172 | 0 | 0 | 0% |
| `get_check_runs` | 168 | 4 | 0 | 2.4% |
| `get_issue_comments` | 153 | 0 | 0 | 0% |
| `load_skill` | 139 | 7 | 0 | 5% |
| `get_issue` | 127 | 1 | 0 | 0.8% |
| `commit_and_push` | 121 | 2 | 0 | 1.7% |
| `check_merge_readiness` | 114 | 0 | 0 | 0% |
| `write` | 112 | 1 | 0 | 0.9% |
| `create_pr` | 104 | 33 | 0 | 31.7% |
| `get_branch` | 78 | 0 | 0 | 0% |
| `get_pr_reviews` | 70 | 0 | 0 | 0% |
| `get_pr_diff` | 67 | 0 | 0 | 0% |
| `request_close_issue` | 61 | 0 | 0 | 0% |
| `search_code` | 57 | 0 | 0 | 0% |
| `list_pr_review_comments` | 50 | 0 | 0 | 0% |
| `search_issues` | 46 | 0 | 0 | 0% |
| `merge_pr` | 45 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 40 | 1 | 0 | 2.5% |
| `list_prs` | 29 | 0 | 0 | 0% |
| `search_remote_code` | 27 | 13 | 0 | 48.1% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `delegate_readonly` | 15 | 0 | 0 | 0% |
| `create_root_issue` | 14 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `sync_branch` | 6 | 4 | 0 | 66.7% |
| `list_issues` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 3 | 0 | 0 | 0% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,276 | 83.1% |
| `edit` | 509 | 9.9% |
| `search` | 183 | 3.6% |
| `open` | 141 | 2.7% |
| `verify` | 37 | 0.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 49.2% |
| `writing/japanese` | 33 | 18.4% |
| `conventions` | 24 | 13.4% |
| `japanese` | 14 | 7.8% |
| `research/web-search` | 8 | 4.5% |
| `delivery/pipeline-setup` | 3 | 1.7% |
| `docs/customer-doc` | 3 | 1.7% |
| `engineering/secrets-in-a-check` | 3 | 1.7% |
| `engineering/environment` | 1 | 0.6% |
| `on-demand-audit` | 1 | 0.6% |
| `web-search` | 1 | 0.6% |

## Last year

360 sessions.

**Ran to an end without a report:** 74 of 344 sessions whose last run the core recorded as `completed` — 21.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,192,774,005 tokens** over 450 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 448 of 450 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 6,056,423 | 27,846,035 | 73,718,100 | 1,192,774,005 |
| messages per session | 125 | 328 | 583 | 731 | 58,018 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 146 | 40.6% |
| `engineer` | 121 | 33.6% |
| `atomaton` | 92 | 25.6% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,348 | 189 | 134 | 2% |
| `read` | 7,078 | 39 | 8 | 0.6% |
| `grep` | 5,286 | 123 | 22 | 2.3% |
| `edit` | 2,401 | 47 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,110 | 99 | 0 | 8.9% |
| `list` | 429 | 5 | 0 | 1.2% |
| `get_issue_comments` | 400 | 0 | 10 | 0% |
| `get_issue` | 397 | 14 | 5 | 3.5% |
| `get_pr` | 388 | 9 | 3 | 2.3% |
| `get_check_runs` | 380 | 14 | 0 | 3.7% |
| `glob` | 351 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 242 | 0 | 0 | 0% |
| `commit_and_push` | 228 | 10 | 0 | 4.4% |
| `write` | 224 | 2 | 0 | 0.9% |
| `get_branch` | 221 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 204 | 65 | 0 | 31.9% |
| `get_pr_diff` | 157 | 3 | 0 | 1.9% |
| `search_issues` | 154 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `load_skill` | 141 | 9 | 0 | 6.4% |
| `request_close_issue` | 124 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 106 | 0 | 0 | 0% |
| `merge_pr` | 81 | 0 | 0 | 0% |
| `search_code` | 81 | 0 | 0 | 0% |
| `list_pr_review_comments` | 79 | 0 | 0 | 0% |
| `list_prs` | 73 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 50 | 19 | 0 | 38% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 37 | 1 | 0 | 2.7% |
| `delegate_readonly` | 36 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 18 | 0 | 0 | 0% |
| `sync_branch` | 17 | 7 | 0 | 41.2% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `delegate_readonly_large` | 10 | 0 | 3 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `delegate_large` | 9 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
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
| `other` | 7,399 | 79.2% |
| `edit` | 816 | 8.7% |
| `search` | 578 | 6.2% |
| `open` | 294 | 3.1% |
| `verify` | 261 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 68.7% |
| `writing/japanese` | 33 | 9.4% |
| `conventions` | 24 | 6.8% |
| `japanese` | 14 | 4% |
| `delivery/pipeline-setup` | 10 | 2.8% |
| `research/web-search` | 10 | 2.8% |
| `engineering/environment` | 7 | 2% |
| `engineering/secrets-in-a-check` | 6 | 1.7% |
| `docs/customer-doc` | 3 | 0.9% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## All time

379 sessions.

**Ran to an end without a report:** 74 of 344 sessions whose last run the core recorded as `completed` — 21.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,192,774,005 tokens** over 450 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 448 of 450 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 6,056,423 | 27,846,035 | 73,718,100 | 1,192,774,005 |
| messages per session | 119 | 327 | 583 | 731 | 58,142 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 152 | 40.1% |
| `engineer` | 131 | 34.6% |
| `atomaton` | 95 | 25.1% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,348 | 189 | 134 | 2% |
| `read` | 7,078 | 39 | 8 | 0.6% |
| `grep` | 5,286 | 123 | 22 | 2.3% |
| `edit` | 2,401 | 47 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,110 | 99 | 0 | 8.9% |
| `list` | 429 | 5 | 0 | 1.2% |
| `get_issue_comments` | 400 | 0 | 10 | 0% |
| `get_issue` | 397 | 14 | 5 | 3.5% |
| `get_pr` | 388 | 9 | 3 | 2.3% |
| `get_check_runs` | 380 | 14 | 0 | 3.7% |
| `glob` | 351 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 242 | 0 | 0 | 0% |
| `commit_and_push` | 228 | 10 | 0 | 4.4% |
| `write` | 224 | 2 | 0 | 0.9% |
| `get_branch` | 221 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 204 | 65 | 0 | 31.9% |
| `get_pr_diff` | 157 | 3 | 0 | 1.9% |
| `search_issues` | 154 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `load_skill` | 141 | 9 | 0 | 6.4% |
| `request_close_issue` | 124 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 106 | 0 | 0 | 0% |
| `merge_pr` | 81 | 0 | 0 | 0% |
| `search_code` | 81 | 0 | 0 | 0% |
| `list_pr_review_comments` | 79 | 0 | 0 | 0% |
| `list_prs` | 73 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 50 | 19 | 0 | 38% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 37 | 1 | 0 | 2.7% |
| `delegate_readonly` | 36 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 18 | 0 | 0 | 0% |
| `sync_branch` | 17 | 7 | 0 | 41.2% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `delegate_readonly_large` | 10 | 0 | 3 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `delegate_large` | 9 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
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
| `other` | 7,399 | 79.2% |
| `edit` | 816 | 8.7% |
| `search` | 578 | 6.2% |
| `open` | 294 | 3.1% |
| `verify` | 261 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 68.7% |
| `writing/japanese` | 33 | 9.4% |
| `conventions` | 24 | 6.8% |
| `japanese` | 14 | 4% |
| `delivery/pipeline-setup` | 10 | 2.8% |
| `research/web-search` | 10 | 2.8% |
| `engineering/environment` | 7 | 2% |
| `engineering/secrets-in-a-check` | 6 | 1.7% |
| `docs/customer-doc` | 3 | 0.9% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-27 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `agent-prompt-surface`
- `atomaton-surface`
- `customer-doc`
- `environment`
- `gh-actions-surface`
- `pipeline-setup`
- `secrets-in-a-check`
