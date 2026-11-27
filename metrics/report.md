# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-27.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 143 | 25.2% | 77 | 3,219 | 9 | 7.7 |
| Last 30 days | 500 | 13.8% | 246 | 6,099 | 11 | 20.2 |
| Last year | 926 | 10.2% | 253 | 10,246 | 13 | 18.9 |
| All time | 926 | 10.2% | 253 | 10,246 | 13 | 18.9 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 832 |
| `failed` | 83 |
| `stopped` | 11 |

## Last 7 days

54 sessions.

**Ran to an end without a report:** 18 of 52 sessions whose last run the core recorded as `completed` — 34.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**79,006,094 tokens** over 56 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**90.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 669,076 | 3,400,391 | 7,840,910 | 7,840,910 | 79,006,094 |
| messages per session | 96 | 193 | 293 | 293 | 6,104 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 22 | 40.7% |
| `reviewer` | 20 | 37% |
| `atomaton` | 12 | 22.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,009 | 19 | 8 | 1.9% |
| `read` | 866 | 7 | 0 | 0.8% |
| `grep` | 479 | 11 | 1 | 2.3% |
| `edit` | 216 | 11 | 0 | 5.1% |
| `fetch` | 68 | 1 | 0 | 1.5% |
| `list` | 57 | 0 | 0 | 0% |
| `load_skill` | 53 | 0 | 0 | 0% |
| `get_issue_comments` | 44 | 0 | 0 | 0% |
| `get_check_runs` | 39 | 1 | 0 | 2.6% |
| `get_pr` | 36 | 0 | 0 | 0% |
| `check_merge_readiness` | 33 | 0 | 0 | 0% |
| `create_pr` | 33 | 10 | 0 | 30.3% |
| `get_issue` | 32 | 0 | 0 | 0% |
| `commit_and_push` | 31 | 1 | 0 | 3.2% |
| `glob` | 31 | 0 | 0 | 0% |
| `search_code` | 29 | 0 | 0 | 0% |
| `write` | 25 | 0 | 0 | 0% |
| `get_pr_reviews` | 22 | 0 | 0 | 0% |
| `search_issues` | 22 | 0 | 0 | 0% |
| `request_close_issue` | 20 | 0 | 0 | 0% |
| `get_pr_diff` | 17 | 0 | 0 | 0% |
| `get_branch` | 16 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `merge_pr` | 14 | 0 | 0 | 0% |
| `search_remote_code` | 7 | 5 | 0 | 71.4% |
| `delegate_readonly` | 6 | 0 | 0 | 0% |
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
| `other` | 724 | 71.8% |
| `edit` | 183 | 18.1% |
| `search` | 51 | 5.1% |
| `open` | 31 | 3.1% |
| `verify` | 20 | 2% |

| skill | loads | share |
| --- | ---: | ---: |
| `conventions` | 21 | 39.6% |
| `project/conventions` | 15 | 28.3% |
| `japanese` | 13 | 24.5% |
| `research/web-search` | 2 | 3.8% |
| `on-demand-audit` | 1 | 1.9% |
| `web-search` | 1 | 1.9% |

## Last 30 days

170 sessions.

**Ran to an end without a report:** 31 of 161 sessions whose last run the core recorded as `completed` — 19.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**554,518,678 tokens** over 217 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.5% of that prompt was served from cache**, over the 215 of 217 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,266,684 | 7,133,020 | 20,308,488 | 29,805,044 | 554,518,678 |
| messages per session | 137 | 330 | 425 | 439 | 26,941 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 66 | 38.8% |
| `reviewer` | 65 | 38.2% |
| `atomaton` | 38 | 22.4% |
| `architect` | 1 | 0.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,083 | 117 | 65 | 2.3% |
| `read` | 3,116 | 18 | 0 | 0.6% |
| `grep` | 2,523 | 58 | 14 | 2.3% |
| `edit` | 878 | 22 | 0 | 2.5% |
| `fetch` | 684 | 60 | 0 | 8.8% |
| `list` | 189 | 2 | 0 | 1.1% |
| `glob` | 176 | 0 | 0 | 0% |
| `get_pr` | 170 | 0 | 0 | 0% |
| `get_check_runs` | 166 | 4 | 0 | 2.4% |
| `get_issue_comments` | 152 | 0 | 0 | 0% |
| `load_skill` | 135 | 7 | 0 | 5.2% |
| `get_issue` | 126 | 1 | 0 | 0.8% |
| `commit_and_push` | 120 | 2 | 0 | 1.7% |
| `check_merge_readiness` | 112 | 0 | 0 | 0% |
| `write` | 112 | 1 | 0 | 0.9% |
| `create_pr` | 103 | 33 | 0 | 32% |
| `get_branch` | 78 | 0 | 0 | 0% |
| `get_pr_reviews` | 68 | 0 | 0 | 0% |
| `get_pr_diff` | 66 | 0 | 0 | 0% |
| `request_close_issue` | 60 | 0 | 0 | 0% |
| `search_code` | 57 | 0 | 0 | 0% |
| `list_pr_review_comments` | 48 | 0 | 0 | 0% |
| `search_issues` | 46 | 0 | 0 | 0% |
| `merge_pr` | 43 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 40 | 1 | 0 | 2.5% |
| `list_prs` | 29 | 0 | 0 | 0% |
| `search_remote_code` | 27 | 13 | 0 | 48.1% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 14 | 0 | 0 | 0% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
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
| `other` | 4,214 | 82.9% |
| `edit` | 508 | 10% |
| `search` | 183 | 3.6% |
| `open` | 141 | 2.8% |
| `verify` | 37 | 0.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 50.3% |
| `writing/japanese` | 33 | 18.9% |
| `conventions` | 21 | 12% |
| `japanese` | 13 | 7.4% |
| `research/web-search` | 8 | 4.6% |
| `delivery/pipeline-setup` | 3 | 1.7% |
| `docs/customer-doc` | 3 | 1.7% |
| `engineering/secrets-in-a-check` | 3 | 1.7% |
| `engineering/environment` | 1 | 0.6% |
| `on-demand-audit` | 1 | 0.6% |
| `web-search` | 1 | 0.6% |

## Last year

356 sessions.

**Ran to an end without a report:** 73 of 341 sessions whose last run the core recorded as `completed` — 21.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,190,628,191 tokens** over 448 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 446 of 448 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,266,684 | 6,056,423 | 27,846,035 | 73,718,100 | 1,190,628,191 |
| messages per session | 126 | 328 | 583 | 731 | 57,663 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 144 | 40.4% |
| `engineer` | 119 | 33.4% |
| `atomaton` | 92 | 25.8% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,285 | 187 | 134 | 2% |
| `read` | 7,028 | 39 | 8 | 0.6% |
| `grep` | 5,264 | 123 | 22 | 2.3% |
| `edit` | 2,376 | 46 | 0 | 1.9% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,110 | 99 | 0 | 8.9% |
| `list` | 427 | 5 | 0 | 1.2% |
| `get_issue_comments` | 399 | 0 | 10 | 0% |
| `get_issue` | 396 | 14 | 5 | 3.5% |
| `get_pr` | 386 | 9 | 3 | 2.3% |
| `get_check_runs` | 378 | 14 | 0 | 3.7% |
| `glob` | 350 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 240 | 0 | 0 | 0% |
| `commit_and_push` | 227 | 10 | 0 | 4.4% |
| `write` | 224 | 2 | 0 | 0.9% |
| `get_branch` | 221 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 203 | 65 | 0 | 32% |
| `get_pr_diff` | 156 | 3 | 0 | 1.9% |
| `search_issues` | 154 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `load_skill` | 137 | 9 | 0 | 6.6% |
| `request_close_issue` | 123 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 104 | 0 | 0 | 0% |
| `search_code` | 81 | 0 | 0 | 0% |
| `merge_pr` | 79 | 0 | 0 | 0% |
| `list_pr_review_comments` | 77 | 0 | 0 | 0% |
| `list_prs` | 73 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 50 | 19 | 0 | 38% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 37 | 1 | 0 | 2.7% |
| `delegate_readonly` | 35 | 0 | 0 | 0% |
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
| `other` | 7,337 | 79% |
| `edit` | 815 | 8.8% |
| `search` | 578 | 6.2% |
| `open` | 294 | 3.2% |
| `verify` | 261 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 69.5% |
| `writing/japanese` | 33 | 9.5% |
| `conventions` | 21 | 6.1% |
| `japanese` | 13 | 3.7% |
| `delivery/pipeline-setup` | 10 | 2.9% |
| `research/web-search` | 10 | 2.9% |
| `engineering/environment` | 7 | 2% |
| `engineering/secrets-in-a-check` | 6 | 1.7% |
| `docs/customer-doc` | 3 | 0.9% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## All time

375 sessions.

**Ran to an end without a report:** 73 of 341 sessions whose last run the core recorded as `completed` — 21.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,190,628,191 tokens** over 448 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 446 of 448 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,266,684 | 6,056,423 | 27,846,035 | 73,718,100 | 1,190,628,191 |
| messages per session | 119 | 327 | 583 | 731 | 57,787 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 150 | 40% |
| `engineer` | 129 | 34.4% |
| `atomaton` | 95 | 25.3% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,285 | 187 | 134 | 2% |
| `read` | 7,028 | 39 | 8 | 0.6% |
| `grep` | 5,264 | 123 | 22 | 2.3% |
| `edit` | 2,376 | 46 | 0 | 1.9% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,110 | 99 | 0 | 8.9% |
| `list` | 427 | 5 | 0 | 1.2% |
| `get_issue_comments` | 399 | 0 | 10 | 0% |
| `get_issue` | 396 | 14 | 5 | 3.5% |
| `get_pr` | 386 | 9 | 3 | 2.3% |
| `get_check_runs` | 378 | 14 | 0 | 3.7% |
| `glob` | 350 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 240 | 0 | 0 | 0% |
| `commit_and_push` | 227 | 10 | 0 | 4.4% |
| `write` | 224 | 2 | 0 | 0.9% |
| `get_branch` | 221 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 203 | 65 | 0 | 32% |
| `get_pr_diff` | 156 | 3 | 0 | 1.9% |
| `search_issues` | 154 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `load_skill` | 137 | 9 | 0 | 6.6% |
| `request_close_issue` | 123 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 104 | 0 | 0 | 0% |
| `search_code` | 81 | 0 | 0 | 0% |
| `merge_pr` | 79 | 0 | 0 | 0% |
| `list_pr_review_comments` | 77 | 0 | 0 | 0% |
| `list_prs` | 73 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 50 | 19 | 0 | 38% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 37 | 1 | 0 | 2.7% |
| `delegate_readonly` | 35 | 0 | 0 | 0% |
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
| `other` | 7,337 | 79% |
| `edit` | 815 | 8.8% |
| `search` | 578 | 6.2% |
| `open` | 294 | 3.2% |
| `verify` | 261 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 69.5% |
| `writing/japanese` | 33 | 9.5% |
| `conventions` | 21 | 6.1% |
| `japanese` | 13 | 3.7% |
| `delivery/pipeline-setup` | 10 | 2.9% |
| `research/web-search` | 10 | 2.9% |
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
