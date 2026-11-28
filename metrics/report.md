# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-28.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 173 | 23.7% | 90 | 3,219 | 10 | 7.8 |
| Last 30 days | 518 | 14.1% | 240 | 6,099 | 11 | 19.7 |
| Last year | 956 | 10.4% | 248 | 10,246 | 13 | 18.4 |
| All time | 956 | 10.4% | 248 | 10,246 | 13 | 18.4 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 857 |
| `failed` | 88 |
| `stopped` | 11 |

## Last 7 days

69 sessions.

**Ran to an end without a report:** 22 of 68 sessions whose last run the core recorded as `completed` — 32.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**103,313,784 tokens** over 68 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 776,544 | 3,818,849 | 8,244,501 | 8,244,501 | 103,313,784 |
| messages per session | 93 | 207 | 293 | 293 | 8,009 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 27 | 39.1% |
| `reviewer` | 25 | 36.2% |
| `atomaton` | 17 | 24.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,458 | 24 | 12 | 1.6% |
| `read` | 1,027 | 7 | 0 | 0.7% |
| `grep` | 594 | 13 | 1 | 2.2% |
| `edit` | 298 | 15 | 0 | 5% |
| `load_skill` | 74 | 0 | 0 | 0% |
| `fetch` | 72 | 1 | 0 | 1.4% |
| `list` | 68 | 1 | 0 | 1.5% |
| `get_issue_comments` | 54 | 0 | 0 | 0% |
| `get_check_runs` | 45 | 1 | 0 | 2.2% |
| `get_issue` | 44 | 0 | 0 | 0% |
| `get_pr` | 42 | 0 | 0 | 0% |
| `check_merge_readiness` | 40 | 0 | 0 | 0% |
| `glob` | 40 | 0 | 0 | 0% |
| `commit_and_push` | 39 | 2 | 0 | 5.1% |
| `create_pr` | 39 | 10 | 0 | 25.6% |
| `search_code` | 37 | 0 | 0 | 0% |
| `write` | 37 | 0 | 0 | 0% |
| `get_pr_reviews` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 26 | 0 | 0 | 0% |
| `search_issues` | 24 | 0 | 0 | 0% |
| `get_pr_diff` | 20 | 0 | 0 | 0% |
| `list_pr_review_comments` | 19 | 0 | 0 | 0% |
| `merge_pr` | 19 | 0 | 0 | 0% |
| `get_branch` | 17 | 0 | 0 | 0% |
| `delegate_readonly` | 11 | 0 | 0 | 0% |
| `list_prs` | 8 | 0 | 0 | 0% |
| `search_remote_code` | 7 | 5 | 0 | 71.4% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 4 | 0 | 0 | 0% |
| `list_issues` | 2 | 0 | 0 | 0% |
| `sync_branch` | 2 | 1 | 0 | 50% |
| `delegate` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,046 | 71.7% |
| `edit` | 247 | 16.9% |
| `search` | 100 | 6.9% |
| `open` | 39 | 2.7% |
| `verify` | 26 | 1.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `conventions` | 30 | 40.5% |
| `japanese` | 25 | 33.8% |
| `project/conventions` | 15 | 20.3% |
| `research/web-search` | 2 | 2.7% |
| `on-demand-audit` | 1 | 1.4% |
| `web-search` | 1 | 1.4% |

## Last 30 days

180 sessions.

**Ran to an end without a report:** 35 of 172 sessions whose last run the core recorded as `completed` — 20.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**557,585,864 tokens** over 222 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.3% of that prompt was served from cache**, over the 220 of 222 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,645 | 6,808,572 | 20,308,488 | 29,805,044 | 557,585,864 |
| messages per session | 135 | 328 | 425 | 439 | 28,216 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 69 | 38.3% |
| `reviewer` | 68 | 37.8% |
| `atomaton` | 42 | 23.3% |
| `architect` | 1 | 0.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,434 | 119 | 69 | 2.2% |
| `read` | 3,182 | 17 | 0 | 0.5% |
| `grep` | 2,564 | 56 | 14 | 2.2% |
| `edit` | 952 | 26 | 0 | 2.7% |
| `fetch` | 669 | 59 | 0 | 8.8% |
| `list` | 199 | 3 | 0 | 1.5% |
| `glob` | 178 | 0 | 0 | 0% |
| `get_pr` | 174 | 0 | 0 | 0% |
| `get_check_runs` | 170 | 4 | 0 | 2.4% |
| `get_issue_comments` | 159 | 0 | 0 | 0% |
| `load_skill` | 156 | 7 | 0 | 4.5% |
| `get_issue` | 137 | 1 | 0 | 0.7% |
| `commit_and_push` | 124 | 3 | 0 | 2.4% |
| `write` | 124 | 1 | 0 | 0.8% |
| `check_merge_readiness` | 118 | 0 | 0 | 0% |
| `create_pr` | 108 | 33 | 0 | 30.6% |
| `get_branch` | 79 | 0 | 0 | 0% |
| `get_pr_reviews` | 72 | 0 | 0 | 0% |
| `get_pr_diff` | 68 | 0 | 0 | 0% |
| `request_close_issue` | 66 | 0 | 0 | 0% |
| `search_code` | 65 | 0 | 0 | 0% |
| `list_pr_review_comments` | 52 | 0 | 0 | 0% |
| `search_issues` | 48 | 0 | 0 | 0% |
| `merge_pr` | 47 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `list_prs` | 31 | 0 | 0 | 0% |
| `search_remote_code` | 27 | 13 | 0 | 48.1% |
| `delegate_readonly` | 19 | 0 | 0 | 0% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
| `delegate` | 10 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `sync_branch` | 7 | 5 | 0 | 71.4% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `list_issues` | 6 | 0 | 0 | 0% |
| `delegate_readonly_large` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,457 | 82% |
| `edit` | 556 | 10.2% |
| `search` | 229 | 4.2% |
| `open` | 149 | 2.7% |
| `verify` | 43 | 0.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 45.1% |
| `writing/japanese` | 33 | 16.9% |
| `conventions` | 30 | 15.4% |
| `japanese` | 25 | 12.8% |
| `research/web-search` | 7 | 3.6% |
| `delivery/pipeline-setup` | 3 | 1.5% |
| `docs/customer-doc` | 3 | 1.5% |
| `engineering/secrets-in-a-check` | 3 | 1.5% |
| `engineering/environment` | 1 | 0.5% |
| `on-demand-audit` | 1 | 0.5% |
| `web-search` | 1 | 0.5% |

## Last year

371 sessions.

**Ran to an end without a report:** 77 of 357 sessions whose last run the core recorded as `completed` — 21.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,214,935,881 tokens** over 460 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 458 of 460 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,266,684 | 6,056,423 | 27,846,035 | 73,718,100 | 1,214,935,881 |
| messages per session | 125 | 327 | 583 | 731 | 59,568 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 149 | 40.2% |
| `engineer` | 124 | 33.4% |
| `atomaton` | 97 | 26.1% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,734 | 192 | 138 | 2% |
| `read` | 7,189 | 39 | 8 | 0.5% |
| `grep` | 5,379 | 125 | 22 | 2.3% |
| `edit` | 2,458 | 50 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,114 | 99 | 0 | 8.9% |
| `list` | 438 | 6 | 0 | 1.4% |
| `get_issue_comments` | 409 | 0 | 10 | 0% |
| `get_issue` | 408 | 14 | 5 | 3.4% |
| `get_pr` | 392 | 9 | 3 | 2.3% |
| `get_check_runs` | 384 | 14 | 0 | 3.6% |
| `glob` | 359 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 247 | 0 | 0 | 0% |
| `write` | 236 | 2 | 0 | 0.8% |
| `commit_and_push` | 235 | 11 | 0 | 4.7% |
| `get_branch` | 222 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 209 | 65 | 0 | 31.1% |
| `get_pr_diff` | 159 | 3 | 0 | 1.9% |
| `load_skill` | 158 | 9 | 0 | 5.7% |
| `search_issues` | 156 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 129 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 109 | 0 | 0 | 0% |
| `search_code` | 89 | 0 | 0 | 0% |
| `merge_pr` | 84 | 0 | 0 | 0% |
| `list_pr_review_comments` | 81 | 0 | 0 | 0% |
| `list_prs` | 75 | 0 | 0 | 0% |
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
| `list_issues` | 19 | 0 | 0 | 0% |
| `sync_branch` | 18 | 8 | 0 | 44.4% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly_large` | 11 | 0 | 3 | 0% |
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
| `other` | 7,659 | 78.7% |
| `edit` | 879 | 9% |
| `search` | 627 | 6.4% |
| `open` | 302 | 3.1% |
| `verify` | 267 | 2.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 65.5% |
| `writing/japanese` | 33 | 9% |
| `conventions` | 30 | 8.2% |
| `japanese` | 25 | 6.8% |
| `delivery/pipeline-setup` | 10 | 2.7% |
| `research/web-search` | 10 | 2.7% |
| `engineering/environment` | 7 | 1.9% |
| `engineering/secrets-in-a-check` | 6 | 1.6% |
| `docs/customer-doc` | 3 | 0.8% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## All time

392 sessions.

**Ran to an end without a report:** 77 of 357 sessions whose last run the core recorded as `completed` — 21.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 21 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,214,935,881 tokens** over 460 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 458 of 460 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,266,684 | 6,056,423 | 27,846,035 | 73,718,100 | 1,214,935,881 |
| messages per session | 119 | 323 | 583 | 731 | 59,701 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 155 | 39.5% |
| `engineer` | 135 | 34.4% |
| `atomaton` | 101 | 25.8% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,734 | 192 | 138 | 2% |
| `read` | 7,189 | 39 | 8 | 0.5% |
| `grep` | 5,379 | 125 | 22 | 2.3% |
| `edit` | 2,458 | 50 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,114 | 99 | 0 | 8.9% |
| `list` | 438 | 6 | 0 | 1.4% |
| `get_issue_comments` | 409 | 0 | 10 | 0% |
| `get_issue` | 408 | 14 | 5 | 3.4% |
| `get_pr` | 392 | 9 | 3 | 2.3% |
| `get_check_runs` | 384 | 14 | 0 | 3.6% |
| `glob` | 359 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 247 | 0 | 0 | 0% |
| `write` | 236 | 2 | 0 | 0.8% |
| `commit_and_push` | 235 | 11 | 0 | 4.7% |
| `get_branch` | 222 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 209 | 65 | 0 | 31.1% |
| `get_pr_diff` | 159 | 3 | 0 | 1.9% |
| `load_skill` | 158 | 9 | 0 | 5.7% |
| `search_issues` | 156 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 129 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 109 | 0 | 0 | 0% |
| `search_code` | 89 | 0 | 0 | 0% |
| `merge_pr` | 84 | 0 | 0 | 0% |
| `list_pr_review_comments` | 81 | 0 | 0 | 0% |
| `list_prs` | 75 | 0 | 0 | 0% |
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
| `list_issues` | 19 | 0 | 0 | 0% |
| `sync_branch` | 18 | 8 | 0 | 44.4% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly_large` | 11 | 0 | 3 | 0% |
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
| `other` | 7,659 | 78.7% |
| `edit` | 879 | 9% |
| `search` | 627 | 6.4% |
| `open` | 302 | 3.1% |
| `verify` | 267 | 2.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 65.5% |
| `writing/japanese` | 33 | 9% |
| `conventions` | 30 | 8.2% |
| `japanese` | 25 | 6.8% |
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
