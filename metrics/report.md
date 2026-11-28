# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-28.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 188 | 23.4% | 89 | 3,219 | 9 | 7.7 |
| Last 30 days | 533 | 14.3% | 235 | 6,099 | 10 | 19.3 |
| Last year | 971 | 10.5% | 245 | 10,246 | 13 | 18.3 |
| All time | 971 | 10.5% | 245 | 10,246 | 13 | 18.3 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 869 |
| `failed` | 91 |
| `stopped` | 11 |

## Last 7 days

74 sessions.

**Ran to an end without a report:** 23 of 73 sessions whose last run the core recorded as `completed` — 31.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**117,185,322 tokens** over 77 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 904,960 | 3,818,849 | 8,244,501 | 8,244,501 | 117,185,322 |
| messages per session | 93 | 206 | 293 | 293 | 8,497 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 28 | 37.8% |
| `reviewer` | 28 | 37.8% |
| `atomaton` | 18 | 24.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,494 | 24 | 12 | 1.6% |
| `read` | 1,096 | 7 | 0 | 0.6% |
| `grep` | 661 | 13 | 2 | 2% |
| `edit` | 302 | 15 | 0 | 5% |
| `load_skill` | 82 | 0 | 0 | 0% |
| `fetch` | 76 | 1 | 0 | 1.3% |
| `list` | 69 | 1 | 0 | 1.4% |
| `get_issue_comments` | 57 | 0 | 0 | 0% |
| `get_issue` | 51 | 0 | 0 | 0% |
| `get_pr` | 50 | 0 | 0 | 0% |
| `get_check_runs` | 49 | 1 | 0 | 2% |
| `search_code` | 46 | 0 | 0 | 0% |
| `check_merge_readiness` | 45 | 0 | 0 | 0% |
| `glob` | 44 | 0 | 0 | 0% |
| `commit_and_push` | 41 | 3 | 0 | 7.3% |
| `create_pr` | 39 | 10 | 0 | 25.6% |
| `write` | 38 | 0 | 0 | 0% |
| `get_pr_reviews` | 30 | 0 | 0 | 0% |
| `request_close_issue` | 28 | 0 | 0 | 0% |
| `search_issues` | 25 | 0 | 0 | 0% |
| `get_pr_diff` | 23 | 0 | 0 | 0% |
| `merge_pr` | 22 | 0 | 0 | 0% |
| `list_pr_review_comments` | 21 | 0 | 0 | 0% |
| `get_branch` | 18 | 0 | 0 | 0% |
| `delegate_readonly` | 13 | 0 | 0 | 0% |
| `list_prs` | 8 | 0 | 0 | 0% |
| `search_remote_code` | 8 | 5 | 0 | 62.5% |
| `create_root_issue` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 0 | 0% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `sync_branch` | 2 | 1 | 0 | 50% |
| `delegate` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,061 | 71% |
| `edit` | 253 | 16.9% |
| `search` | 110 | 7.4% |
| `open` | 39 | 2.6% |
| `verify` | 31 | 2.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `conventions` | 33 | 40.2% |
| `japanese` | 30 | 36.6% |
| `project/conventions` | 15 | 18.3% |
| `research/web-search` | 2 | 2.4% |
| `on-demand-audit` | 1 | 1.2% |
| `web-search` | 1 | 1.2% |

## Last 30 days

185 sessions.

**Ran to an end without a report:** 36 of 177 sessions whose last run the core recorded as `completed` — 20.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**571,457,402 tokens** over 231 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.3% of that prompt was served from cache**, over the 229 of 231 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,560 | 6,417,588 | 20,308,488 | 29,805,044 | 571,457,402 |
| messages per session | 131 | 307 | 425 | 439 | 28,704 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 71 | 38.4% |
| `engineer` | 70 | 37.8% |
| `atomaton` | 43 | 23.2% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,470 | 119 | 69 | 2.2% |
| `read` | 3,251 | 17 | 0 | 0.5% |
| `grep` | 2,631 | 56 | 15 | 2.1% |
| `edit` | 956 | 26 | 0 | 2.7% |
| `fetch` | 673 | 59 | 0 | 8.8% |
| `list` | 200 | 3 | 0 | 1.5% |
| `get_pr` | 182 | 0 | 0 | 0% |
| `glob` | 182 | 0 | 0 | 0% |
| `get_check_runs` | 174 | 4 | 0 | 2.3% |
| `load_skill` | 164 | 7 | 0 | 4.3% |
| `get_issue_comments` | 162 | 0 | 0 | 0% |
| `get_issue` | 144 | 1 | 0 | 0.7% |
| `commit_and_push` | 126 | 4 | 0 | 3.2% |
| `write` | 125 | 1 | 0 | 0.8% |
| `check_merge_readiness` | 123 | 0 | 0 | 0% |
| `create_pr` | 108 | 33 | 0 | 30.6% |
| `get_branch` | 80 | 0 | 0 | 0% |
| `get_pr_reviews` | 75 | 0 | 0 | 0% |
| `search_code` | 74 | 0 | 0 | 0% |
| `get_pr_diff` | 71 | 0 | 0 | 0% |
| `request_close_issue` | 68 | 0 | 0 | 0% |
| `list_pr_review_comments` | 54 | 0 | 0 | 0% |
| `merge_pr` | 50 | 0 | 0 | 0% |
| `search_issues` | 49 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `list_prs` | 31 | 0 | 0 | 0% |
| `search_remote_code` | 28 | 13 | 0 | 46.4% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 17 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
| `delegate` | 10 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `sync_branch` | 7 | 5 | 0 | 71.4% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 0 | 0% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,472 | 81.8% |
| `edit` | 562 | 10.3% |
| `search` | 239 | 4.4% |
| `open` | 149 | 2.7% |
| `verify` | 48 | 0.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 43.3% |
| `conventions` | 33 | 16.3% |
| `writing/japanese` | 33 | 16.3% |
| `japanese` | 30 | 14.8% |
| `research/web-search` | 7 | 3.4% |
| `delivery/pipeline-setup` | 3 | 1.5% |
| `docs/customer-doc` | 3 | 1.5% |
| `engineering/secrets-in-a-check` | 3 | 1.5% |
| `engineering/environment` | 1 | 0.5% |
| `on-demand-audit` | 1 | 0.5% |
| `web-search` | 1 | 0.5% |

## Last year

376 sessions.

**Ran to an end without a report:** 78 of 362 sessions whose last run the core recorded as `completed` — 21.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,228,807,419 tokens** over 469 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 467 of 469 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 6,011,188 | 27,846,035 | 73,718,100 | 1,228,807,419 |
| messages per session | 125 | 327 | 583 | 731 | 60,056 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 152 | 40.4% |
| `engineer` | 125 | 33.2% |
| `atomaton` | 98 | 26.1% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,770 | 192 | 138 | 2% |
| `read` | 7,258 | 39 | 8 | 0.5% |
| `grep` | 5,446 | 125 | 23 | 2.3% |
| `edit` | 2,462 | 50 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,118 | 99 | 0 | 8.9% |
| `list` | 439 | 6 | 0 | 1.4% |
| `get_issue` | 415 | 14 | 5 | 3.4% |
| `get_issue_comments` | 412 | 0 | 10 | 0% |
| `get_pr` | 400 | 9 | 3 | 2.3% |
| `get_check_runs` | 388 | 14 | 0 | 3.6% |
| `glob` | 363 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 252 | 0 | 0 | 0% |
| `commit_and_push` | 237 | 12 | 0 | 5.1% |
| `write` | 237 | 2 | 0 | 0.8% |
| `get_branch` | 223 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 209 | 65 | 0 | 31.1% |
| `load_skill` | 166 | 9 | 0 | 5.4% |
| `get_pr_diff` | 162 | 3 | 0 | 1.9% |
| `search_issues` | 157 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 131 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 112 | 0 | 0 | 0% |
| `search_code` | 98 | 0 | 0 | 0% |
| `merge_pr` | 87 | 0 | 0 | 0% |
| `list_pr_review_comments` | 83 | 0 | 0 | 0% |
| `list_prs` | 75 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 51 | 19 | 0 | 37.3% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `delegate_readonly` | 42 | 0 | 0 | 0% |
| `create_root_issue` | 40 | 1 | 0 | 2.5% |
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
| `delegate_readonly_large` | 12 | 0 | 3 | 0% |
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
| `other` | 7,674 | 78.5% |
| `edit` | 885 | 9.1% |
| `search` | 637 | 6.5% |
| `open` | 302 | 3.1% |
| `verify` | 272 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 64.1% |
| `conventions` | 33 | 8.8% |
| `writing/japanese` | 33 | 8.8% |
| `japanese` | 30 | 8% |
| `delivery/pipeline-setup` | 10 | 2.7% |
| `research/web-search` | 10 | 2.7% |
| `engineering/environment` | 7 | 1.9% |
| `engineering/secrets-in-a-check` | 6 | 1.6% |
| `docs/customer-doc` | 3 | 0.8% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## All time

397 sessions.

**Ran to an end without a report:** 78 of 362 sessions whose last run the core recorded as `completed` — 21.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 21 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,228,807,419 tokens** over 469 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 467 of 469 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 6,011,188 | 27,846,035 | 73,718,100 | 1,228,807,419 |
| messages per session | 115 | 323 | 583 | 731 | 60,189 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 158 | 39.8% |
| `engineer` | 136 | 34.3% |
| `atomaton` | 102 | 25.7% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,770 | 192 | 138 | 2% |
| `read` | 7,258 | 39 | 8 | 0.5% |
| `grep` | 5,446 | 125 | 23 | 2.3% |
| `edit` | 2,462 | 50 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,118 | 99 | 0 | 8.9% |
| `list` | 439 | 6 | 0 | 1.4% |
| `get_issue` | 415 | 14 | 5 | 3.4% |
| `get_issue_comments` | 412 | 0 | 10 | 0% |
| `get_pr` | 400 | 9 | 3 | 2.3% |
| `get_check_runs` | 388 | 14 | 0 | 3.6% |
| `glob` | 363 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 252 | 0 | 0 | 0% |
| `commit_and_push` | 237 | 12 | 0 | 5.1% |
| `write` | 237 | 2 | 0 | 0.8% |
| `get_branch` | 223 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 209 | 65 | 0 | 31.1% |
| `load_skill` | 166 | 9 | 0 | 5.4% |
| `get_pr_diff` | 162 | 3 | 0 | 1.9% |
| `search_issues` | 157 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 131 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 112 | 0 | 0 | 0% |
| `search_code` | 98 | 0 | 0 | 0% |
| `merge_pr` | 87 | 0 | 0 | 0% |
| `list_pr_review_comments` | 83 | 0 | 0 | 0% |
| `list_prs` | 75 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 51 | 19 | 0 | 37.3% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `delegate_readonly` | 42 | 0 | 0 | 0% |
| `create_root_issue` | 40 | 1 | 0 | 2.5% |
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
| `delegate_readonly_large` | 12 | 0 | 3 | 0% |
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
| `other` | 7,674 | 78.5% |
| `edit` | 885 | 9.1% |
| `search` | 637 | 6.5% |
| `open` | 302 | 3.1% |
| `verify` | 272 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 64.1% |
| `conventions` | 33 | 8.8% |
| `writing/japanese` | 33 | 8.8% |
| `japanese` | 30 | 8% |
| `delivery/pipeline-setup` | 10 | 2.7% |
| `research/web-search` | 10 | 2.7% |
| `engineering/environment` | 7 | 1.9% |
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
