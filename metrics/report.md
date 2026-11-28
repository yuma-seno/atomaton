# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-28.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 193 | 23.3% | 89 | 3,219 | 9 | 7.8 |
| Last 30 days | 538 | 14.3% | 231 | 6,099 | 10 | 19.1 |
| Last year | 976 | 10.6% | 244 | 10,246 | 13 | 18.2 |
| All time | 976 | 10.6% | 244 | 10,246 | 13 | 18.2 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 873 |
| `failed` | 92 |
| `stopped` | 11 |

## Last 7 days

76 sessions.

**Ran to an end without a report:** 24 of 74 sessions whose last run the core recorded as `completed` — 32.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**117,185,322 tokens** over 77 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 904,960 | 3,818,849 | 8,244,501 | 8,244,501 | 117,185,322 |
| messages per session | 93 | 207 | 293 | 293 | 8,744 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 29 | 38.2% |
| `engineer` | 28 | 36.8% |
| `atomaton` | 19 | 25% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,517 | 24 | 13 | 1.6% |
| `read` | 1,123 | 7 | 0 | 0.6% |
| `grep` | 693 | 14 | 2 | 2% |
| `edit` | 305 | 15 | 0 | 4.9% |
| `fetch` | 91 | 1 | 0 | 1.1% |
| `load_skill` | 86 | 0 | 0 | 0% |
| `list` | 71 | 1 | 0 | 1.4% |
| `get_issue_comments` | 57 | 0 | 0 | 0% |
| `get_pr` | 54 | 0 | 0 | 0% |
| `search_code` | 54 | 0 | 0 | 0% |
| `get_check_runs` | 52 | 1 | 0 | 1.9% |
| `get_issue` | 52 | 0 | 0 | 0% |
| `check_merge_readiness` | 47 | 0 | 0 | 0% |
| `glob` | 45 | 0 | 0 | 0% |
| `commit_and_push` | 43 | 4 | 0 | 9.3% |
| `create_pr` | 40 | 10 | 0 | 25% |
| `write` | 38 | 0 | 0 | 0% |
| `get_pr_reviews` | 32 | 0 | 0 | 0% |
| `request_close_issue` | 28 | 0 | 0 | 0% |
| `get_pr_diff` | 26 | 0 | 0 | 0% |
| `search_issues` | 25 | 0 | 0 | 0% |
| `merge_pr` | 23 | 0 | 0 | 0% |
| `list_pr_review_comments` | 22 | 0 | 0 | 0% |
| `get_branch` | 19 | 0 | 0 | 0% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
| `list_prs` | 9 | 0 | 0 | 0% |
| `search_remote_code` | 9 | 5 | 0 | 55.6% |
| `create_root_issue` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 6 | 0 | 0 | 0% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `sync_branch` | 2 | 1 | 0 | 50% |
| `delegate` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,067 | 70.3% |
| `edit` | 257 | 16.9% |
| `search` | 117 | 7.7% |
| `open` | 40 | 2.6% |
| `verify` | 36 | 2.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `conventions` | 35 | 40.7% |
| `japanese` | 32 | 37.2% |
| `project/conventions` | 15 | 17.4% |
| `research/web-search` | 2 | 2.3% |
| `on-demand-audit` | 1 | 1.2% |
| `web-search` | 1 | 1.2% |

## Last 30 days

187 sessions.

**Ran to an end without a report:** 37 of 178 sessions whose last run the core recorded as `completed` — 20.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**571,457,402 tokens** over 231 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.3% of that prompt was served from cache**, over the 229 of 231 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,560 | 6,417,588 | 20,308,488 | 29,805,044 | 571,457,402 |
| messages per session | 131 | 307 | 425 | 439 | 28,951 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 72 | 38.5% |
| `engineer` | 70 | 37.4% |
| `atomaton` | 44 | 23.5% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,493 | 119 | 70 | 2.2% |
| `read` | 3,278 | 17 | 0 | 0.5% |
| `grep` | 2,663 | 57 | 15 | 2.1% |
| `edit` | 959 | 26 | 0 | 2.7% |
| `fetch` | 688 | 59 | 0 | 8.6% |
| `list` | 202 | 3 | 0 | 1.5% |
| `get_pr` | 186 | 0 | 0 | 0% |
| `glob` | 183 | 0 | 0 | 0% |
| `get_check_runs` | 177 | 4 | 0 | 2.3% |
| `load_skill` | 168 | 7 | 0 | 4.2% |
| `get_issue_comments` | 162 | 0 | 0 | 0% |
| `get_issue` | 145 | 1 | 0 | 0.7% |
| `commit_and_push` | 128 | 5 | 0 | 3.9% |
| `check_merge_readiness` | 125 | 0 | 0 | 0% |
| `write` | 125 | 1 | 0 | 0.8% |
| `create_pr` | 109 | 33 | 0 | 30.3% |
| `search_code` | 82 | 0 | 0 | 0% |
| `get_branch` | 81 | 0 | 0 | 0% |
| `get_pr_reviews` | 77 | 0 | 0 | 0% |
| `get_pr_diff` | 74 | 0 | 0 | 0% |
| `request_close_issue` | 68 | 0 | 0 | 0% |
| `list_pr_review_comments` | 55 | 0 | 0 | 0% |
| `merge_pr` | 51 | 0 | 0 | 0% |
| `search_issues` | 49 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `list_prs` | 32 | 0 | 0 | 0% |
| `search_remote_code` | 29 | 13 | 0 | 44.8% |
| `delegate_readonly` | 22 | 0 | 0 | 0% |
| `create_root_issue` | 18 | 0 | 0 | 0% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
| `delegate` | 10 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `sync_branch` | 7 | 5 | 0 | 71.4% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `delegate_readonly_large` | 6 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,478 | 81.5% |
| `edit` | 566 | 10.3% |
| `search` | 246 | 4.5% |
| `open` | 150 | 2.7% |
| `verify` | 53 | 1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 42.5% |
| `conventions` | 35 | 16.9% |
| `writing/japanese` | 33 | 15.9% |
| `japanese` | 32 | 15.5% |
| `research/web-search` | 7 | 3.4% |
| `delivery/pipeline-setup` | 3 | 1.4% |
| `docs/customer-doc` | 3 | 1.4% |
| `engineering/secrets-in-a-check` | 3 | 1.4% |
| `engineering/environment` | 1 | 0.5% |
| `on-demand-audit` | 1 | 0.5% |
| `web-search` | 1 | 0.5% |

## Last year

378 sessions.

**Ran to an end without a report:** 79 of 363 sessions whose last run the core recorded as `completed` — 21.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,228,807,419 tokens** over 469 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 467 of 469 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 6,011,188 | 27,846,035 | 73,718,100 | 1,228,807,419 |
| messages per session | 125 | 327 | 583 | 731 | 60,303 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 153 | 40.5% |
| `engineer` | 125 | 33.1% |
| `atomaton` | 99 | 26.2% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,793 | 192 | 139 | 2% |
| `read` | 7,285 | 39 | 8 | 0.5% |
| `grep` | 5,478 | 126 | 23 | 2.3% |
| `edit` | 2,465 | 50 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,133 | 99 | 0 | 8.7% |
| `list` | 441 | 6 | 0 | 1.4% |
| `get_issue` | 416 | 14 | 5 | 3.4% |
| `get_issue_comments` | 412 | 0 | 10 | 0% |
| `get_pr` | 404 | 9 | 3 | 2.2% |
| `get_check_runs` | 391 | 14 | 0 | 3.6% |
| `glob` | 364 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 254 | 0 | 0 | 0% |
| `commit_and_push` | 239 | 13 | 0 | 5.4% |
| `write` | 237 | 2 | 0 | 0.8% |
| `get_branch` | 224 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 210 | 65 | 0 | 31% |
| `load_skill` | 170 | 9 | 0 | 5.3% |
| `get_pr_diff` | 165 | 3 | 0 | 1.8% |
| `search_issues` | 157 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 131 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 114 | 0 | 0 | 0% |
| `search_code` | 106 | 0 | 0 | 0% |
| `merge_pr` | 88 | 0 | 0 | 0% |
| `list_pr_review_comments` | 84 | 0 | 0 | 0% |
| `list_prs` | 76 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 52 | 19 | 0 | 36.5% |
| `delegate_readonly` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 41 | 1 | 0 | 2.4% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `list_issues` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `sync_branch` | 18 | 8 | 0 | 44.4% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly_large` | 13 | 0 | 3 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `delegate_large` | 9 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `merge_base_into_branch` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
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
| `other` | 7,680 | 78.4% |
| `edit` | 889 | 9.1% |
| `search` | 644 | 6.6% |
| `open` | 303 | 3.1% |
| `verify` | 277 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 63.4% |
| `conventions` | 35 | 9.2% |
| `writing/japanese` | 33 | 8.7% |
| `japanese` | 32 | 8.4% |
| `delivery/pipeline-setup` | 10 | 2.6% |
| `research/web-search` | 10 | 2.6% |
| `engineering/environment` | 7 | 1.8% |
| `engineering/secrets-in-a-check` | 6 | 1.6% |
| `docs/customer-doc` | 3 | 0.8% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## All time

399 sessions.

**Ran to an end without a report:** 79 of 363 sessions whose last run the core recorded as `completed` — 21.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 21 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,228,807,419 tokens** over 469 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 467 of 469 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 6,011,188 | 27,846,035 | 73,718,100 | 1,228,807,419 |
| messages per session | 115 | 323 | 583 | 731 | 60,436 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 159 | 39.8% |
| `engineer` | 136 | 34.1% |
| `atomaton` | 103 | 25.8% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,793 | 192 | 139 | 2% |
| `read` | 7,285 | 39 | 8 | 0.5% |
| `grep` | 5,478 | 126 | 23 | 2.3% |
| `edit` | 2,465 | 50 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,133 | 99 | 0 | 8.7% |
| `list` | 441 | 6 | 0 | 1.4% |
| `get_issue` | 416 | 14 | 5 | 3.4% |
| `get_issue_comments` | 412 | 0 | 10 | 0% |
| `get_pr` | 404 | 9 | 3 | 2.2% |
| `get_check_runs` | 391 | 14 | 0 | 3.6% |
| `glob` | 364 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 254 | 0 | 0 | 0% |
| `commit_and_push` | 239 | 13 | 0 | 5.4% |
| `write` | 237 | 2 | 0 | 0.8% |
| `get_branch` | 224 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 210 | 65 | 0 | 31% |
| `load_skill` | 170 | 9 | 0 | 5.3% |
| `get_pr_diff` | 165 | 3 | 0 | 1.8% |
| `search_issues` | 157 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 131 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 114 | 0 | 0 | 0% |
| `search_code` | 106 | 0 | 0 | 0% |
| `merge_pr` | 88 | 0 | 0 | 0% |
| `list_pr_review_comments` | 84 | 0 | 0 | 0% |
| `list_prs` | 76 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 52 | 19 | 0 | 36.5% |
| `delegate_readonly` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 41 | 1 | 0 | 2.4% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `list_issues` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `sync_branch` | 18 | 8 | 0 | 44.4% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly_large` | 13 | 0 | 3 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `delegate_large` | 9 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `merge_base_into_branch` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
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
| `other` | 7,680 | 78.4% |
| `edit` | 889 | 9.1% |
| `search` | 644 | 6.6% |
| `open` | 303 | 3.1% |
| `verify` | 277 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 63.4% |
| `conventions` | 35 | 9.2% |
| `writing/japanese` | 33 | 8.7% |
| `japanese` | 32 | 8.4% |
| `delivery/pipeline-setup` | 10 | 2.6% |
| `research/web-search` | 10 | 2.6% |
| `engineering/environment` | 7 | 1.8% |
| `engineering/secrets-in-a-check` | 6 | 1.6% |
| `docs/customer-doc` | 3 | 0.8% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-28 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

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
