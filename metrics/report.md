# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-27.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 159 | 25.8% | 77 | 3,219 | 9 | 7.4 |
| Last 30 days | 516 | 14.3% | 244 | 6,099 | 11 | 19.4 |
| Last year | 942 | 10.5% | 248 | 10,246 | 13 | 18.3 |
| All time | 942 | 10.5% | 248 | 10,246 | 13 | 18.3 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 843 |
| `failed` | 88 |
| `stopped` | 11 |

## Last 7 days

60 sessions.

**Ran to an end without a report:** 19 of 59 sessions whose last run the core recorded as `completed` — 32.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**84,234,145 tokens** over 60 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 771,671 | 3,400,391 | 7,840,910 | 7,840,910 | 84,234,145 |
| messages per session | 93 | 198 | 293 | 293 | 6,783 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 24 | 40% |
| `reviewer` | 24 | 40% |
| `atomaton` | 12 | 20% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,110 | 22 | 9 | 2% |
| `read` | 929 | 7 | 0 | 0.8% |
| `grep` | 544 | 10 | 1 | 1.8% |
| `edit` | 273 | 14 | 0 | 5.1% |
| `fetch` | 70 | 1 | 0 | 1.4% |
| `list` | 63 | 1 | 0 | 1.6% |
| `load_skill` | 63 | 0 | 0 | 0% |
| `get_check_runs` | 44 | 1 | 0 | 2.3% |
| `get_issue_comments` | 44 | 0 | 0 | 0% |
| `get_pr` | 40 | 0 | 0 | 0% |
| `check_merge_readiness` | 38 | 0 | 0 | 0% |
| `create_pr` | 35 | 10 | 0 | 28.6% |
| `commit_and_push` | 33 | 1 | 0 | 3% |
| `glob` | 31 | 0 | 0 | 0% |
| `search_code` | 30 | 0 | 0 | 0% |
| `get_issue` | 29 | 0 | 0 | 0% |
| `write` | 27 | 0 | 0 | 0% |
| `get_pr_reviews` | 26 | 0 | 0 | 0% |
| `request_close_issue` | 25 | 0 | 0 | 0% |
| `search_issues` | 20 | 0 | 0 | 0% |
| `get_pr_diff` | 19 | 0 | 0 | 0% |
| `merge_pr` | 19 | 0 | 0 | 0% |
| `list_pr_review_comments` | 18 | 0 | 0 | 0% |
| `get_branch` | 16 | 0 | 0 | 0% |
| `delegate_readonly` | 11 | 0 | 0 | 0% |
| `list_prs` | 7 | 0 | 0 | 0% |
| `search_remote_code` | 7 | 5 | 0 | 71.4% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 3 | 0 | 0 | 0% |
| `sync_branch` | 2 | 1 | 0 | 50% |
| `delegate` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 822 | 74.1% |
| `edit` | 186 | 16.8% |
| `search` | 51 | 4.6% |
| `open` | 31 | 2.8% |
| `verify` | 20 | 1.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `conventions` | 26 | 41.3% |
| `japanese` | 18 | 28.6% |
| `project/conventions` | 15 | 23.8% |
| `research/web-search` | 2 | 3.2% |
| `on-demand-audit` | 1 | 1.6% |
| `web-search` | 1 | 1.6% |

## Last 30 days

176 sessions.

**Ran to an end without a report:** 32 of 168 sessions whose last run the core recorded as `completed` — 19%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**559,746,729 tokens** over 221 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.5% of that prompt was served from cache**, over the 219 of 221 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,645 | 6,808,572 | 20,308,488 | 29,805,044 | 559,746,729 |
| messages per session | 136 | 328 | 425 | 439 | 27,620 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 69 | 39.2% |
| `engineer` | 68 | 38.6% |
| `atomaton` | 38 | 21.6% |
| `architect` | 1 | 0.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,184 | 120 | 66 | 2.3% |
| `read` | 3,179 | 18 | 0 | 0.6% |
| `grep` | 2,588 | 57 | 14 | 2.2% |
| `edit` | 935 | 25 | 0 | 2.7% |
| `fetch` | 686 | 60 | 0 | 8.7% |
| `list` | 195 | 3 | 0 | 1.5% |
| `glob` | 176 | 0 | 0 | 0% |
| `get_pr` | 174 | 0 | 0 | 0% |
| `get_check_runs` | 171 | 4 | 0 | 2.3% |
| `get_issue_comments` | 152 | 0 | 0 | 0% |
| `load_skill` | 145 | 7 | 0 | 4.8% |
| `get_issue` | 123 | 1 | 0 | 0.8% |
| `commit_and_push` | 122 | 2 | 0 | 1.6% |
| `check_merge_readiness` | 117 | 0 | 0 | 0% |
| `write` | 114 | 1 | 0 | 0.9% |
| `create_pr` | 105 | 33 | 0 | 31.4% |
| `get_branch` | 78 | 0 | 0 | 0% |
| `get_pr_reviews` | 72 | 0 | 0 | 0% |
| `get_pr_diff` | 68 | 0 | 0 | 0% |
| `request_close_issue` | 65 | 0 | 0 | 0% |
| `search_code` | 58 | 0 | 0 | 0% |
| `list_pr_review_comments` | 51 | 0 | 0 | 0% |
| `merge_pr` | 48 | 0 | 0 | 0% |
| `search_issues` | 44 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 40 | 1 | 0 | 2.5% |
| `list_prs` | 30 | 0 | 0 | 0% |
| `search_remote_code` | 27 | 13 | 0 | 48.1% |
| `delegate_readonly` | 19 | 0 | 0 | 0% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `sync_branch` | 7 | 5 | 0 | 71.4% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `list_issues` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 3 | 0 | 0 | 0% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,312 | 83.2% |
| `edit` | 511 | 9.9% |
| `search` | 183 | 3.5% |
| `open` | 141 | 2.7% |
| `verify` | 37 | 0.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 47.6% |
| `writing/japanese` | 33 | 17.8% |
| `conventions` | 26 | 14.1% |
| `japanese` | 18 | 9.7% |
| `research/web-search` | 8 | 4.3% |
| `delivery/pipeline-setup` | 3 | 1.6% |
| `docs/customer-doc` | 3 | 1.6% |
| `engineering/secrets-in-a-check` | 3 | 1.6% |
| `engineering/environment` | 1 | 0.5% |
| `on-demand-audit` | 1 | 0.5% |
| `web-search` | 1 | 0.5% |

## Last year

362 sessions.

**Ran to an end without a report:** 74 of 348 sessions whose last run the core recorded as `completed` — 21.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,195,856,242 tokens** over 452 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 450 of 452 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 6,011,188 | 27,846,035 | 73,718,100 | 1,195,856,242 |
| messages per session | 125 | 327 | 583 | 731 | 58,342 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 148 | 40.9% |
| `engineer` | 121 | 33.4% |
| `atomaton` | 92 | 25.4% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,386 | 190 | 135 | 2% |
| `read` | 7,091 | 39 | 8 | 0.5% |
| `grep` | 5,329 | 122 | 22 | 2.3% |
| `edit` | 2,433 | 49 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,112 | 99 | 0 | 8.9% |
| `list` | 433 | 6 | 0 | 1.4% |
| `get_issue_comments` | 399 | 0 | 10 | 0% |
| `get_issue` | 393 | 14 | 5 | 3.6% |
| `get_pr` | 390 | 9 | 3 | 2.3% |
| `get_check_runs` | 383 | 14 | 0 | 3.7% |
| `glob` | 350 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 245 | 0 | 0 | 0% |
| `commit_and_push` | 229 | 10 | 0 | 4.4% |
| `write` | 226 | 2 | 0 | 0.9% |
| `get_branch` | 221 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 205 | 65 | 0 | 31.7% |
| `get_pr_diff` | 158 | 3 | 0 | 1.9% |
| `search_issues` | 152 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `load_skill` | 147 | 9 | 0 | 6.1% |
| `request_close_issue` | 128 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 108 | 0 | 0 | 0% |
| `merge_pr` | 84 | 0 | 0 | 0% |
| `search_code` | 82 | 0 | 0 | 0% |
| `list_pr_review_comments` | 80 | 0 | 0 | 0% |
| `list_prs` | 74 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 50 | 19 | 0 | 38% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `delegate_readonly` | 40 | 0 | 0 | 0% |
| `create_root_issue` | 38 | 1 | 0 | 2.6% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 18 | 0 | 0 | 0% |
| `sync_branch` | 18 | 8 | 0 | 44.4% |
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
| `other` | 7,435 | 79.2% |
| `edit` | 818 | 8.7% |
| `search` | 578 | 6.2% |
| `open` | 294 | 3.1% |
| `verify` | 261 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 67.5% |
| `writing/japanese` | 33 | 9.2% |
| `conventions` | 26 | 7.3% |
| `japanese` | 18 | 5% |
| `delivery/pipeline-setup` | 10 | 2.8% |
| `research/web-search` | 10 | 2.8% |
| `engineering/environment` | 7 | 2% |
| `engineering/secrets-in-a-check` | 6 | 1.7% |
| `docs/customer-doc` | 3 | 0.8% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## All time

381 sessions.

**Ran to an end without a report:** 74 of 348 sessions whose last run the core recorded as `completed` — 21.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,195,856,242 tokens** over 452 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 450 of 452 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 6,011,188 | 27,846,035 | 73,718,100 | 1,195,856,242 |
| messages per session | 119 | 323 | 583 | 731 | 58,466 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 154 | 40.4% |
| `engineer` | 131 | 34.4% |
| `atomaton` | 95 | 24.9% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,386 | 190 | 135 | 2% |
| `read` | 7,091 | 39 | 8 | 0.5% |
| `grep` | 5,329 | 122 | 22 | 2.3% |
| `edit` | 2,433 | 49 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,112 | 99 | 0 | 8.9% |
| `list` | 433 | 6 | 0 | 1.4% |
| `get_issue_comments` | 399 | 0 | 10 | 0% |
| `get_issue` | 393 | 14 | 5 | 3.6% |
| `get_pr` | 390 | 9 | 3 | 2.3% |
| `get_check_runs` | 383 | 14 | 0 | 3.7% |
| `glob` | 350 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 245 | 0 | 0 | 0% |
| `commit_and_push` | 229 | 10 | 0 | 4.4% |
| `write` | 226 | 2 | 0 | 0.9% |
| `get_branch` | 221 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 205 | 65 | 0 | 31.7% |
| `get_pr_diff` | 158 | 3 | 0 | 1.9% |
| `search_issues` | 152 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `load_skill` | 147 | 9 | 0 | 6.1% |
| `request_close_issue` | 128 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 108 | 0 | 0 | 0% |
| `merge_pr` | 84 | 0 | 0 | 0% |
| `search_code` | 82 | 0 | 0 | 0% |
| `list_pr_review_comments` | 80 | 0 | 0 | 0% |
| `list_prs` | 74 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 50 | 19 | 0 | 38% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `delegate_readonly` | 40 | 0 | 0 | 0% |
| `create_root_issue` | 38 | 1 | 0 | 2.6% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 18 | 0 | 0 | 0% |
| `sync_branch` | 18 | 8 | 0 | 44.4% |
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
| `other` | 7,435 | 79.2% |
| `edit` | 818 | 8.7% |
| `search` | 578 | 6.2% |
| `open` | 294 | 3.1% |
| `verify` | 261 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 67.5% |
| `writing/japanese` | 33 | 9.2% |
| `conventions` | 26 | 7.3% |
| `japanese` | 18 | 5% |
| `delivery/pipeline-setup` | 10 | 2.8% |
| `research/web-search` | 10 | 2.8% |
| `engineering/environment` | 7 | 2% |
| `engineering/secrets-in-a-check` | 6 | 1.7% |
| `docs/customer-doc` | 3 | 0.8% |
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
