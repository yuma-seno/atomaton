# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-28.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 208 | 20.7% | 108 | 3,219 | 9 | 7.8 |
| Last 30 days | 560 | 13.8% | 231 | 6,099 | 10 | 19.0 |
| Last year | 998 | 10.3% | 244 | 10,246 | 13 | 18.2 |
| All time | 998 | 10.3% | 244 | 10,246 | 13 | 18.2 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 895 |
| `failed` | 92 |
| `stopped` | 11 |

## Last 7 days

85 sessions.

**Ran to an end without a report:** 29 of 84 sessions whose last run the core recorded as `completed` — 34.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**125,251,800 tokens** over 84 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 922,717 | 3,174,001 | 8,244,501 | 8,244,501 | 125,251,800 |
| messages per session | 93 | 219 | 293 | 293 | 9,874 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 33 | 38.8% |
| `reviewer` | 30 | 35.3% |
| `atomaton` | 22 | 25.9% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,882 | 29 | 18 | 1.5% |
| `read` | 1,091 | 7 | 0 | 0.6% |
| `grep` | 683 | 15 | 3 | 2.2% |
| `edit` | 393 | 16 | 0 | 4.1% |
| `fetch` | 102 | 3 | 0 | 2.9% |
| `load_skill` | 97 | 0 | 0 | 0% |
| `get_issue_comments` | 85 | 0 | 0 | 0% |
| `get_issue` | 73 | 0 | 0 | 0% |
| `search_code` | 68 | 0 | 0 | 0% |
| `get_pr` | 64 | 0 | 0 | 0% |
| `list` | 63 | 1 | 0 | 1.6% |
| `get_check_runs` | 59 | 2 | 0 | 3.4% |
| `commit_and_push` | 51 | 4 | 0 | 7.8% |
| `check_merge_readiness` | 49 | 0 | 0 | 0% |
| `create_pr` | 45 | 10 | 0 | 22.2% |
| `write` | 45 | 1 | 0 | 2.2% |
| `glob` | 42 | 0 | 0 | 0% |
| `get_pr_reviews` | 33 | 0 | 0 | 0% |
| `request_close_issue` | 32 | 0 | 0 | 0% |
| `search_issues` | 31 | 0 | 0 | 0% |
| `get_pr_diff` | 28 | 0 | 0 | 0% |
| `merge_pr` | 26 | 0 | 0 | 0% |
| `list_pr_review_comments` | 20 | 0 | 0 | 0% |
| `get_branch` | 19 | 0 | 0 | 0% |
| `delegate_readonly` | 15 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 0 | 0 | 0% |
| `list_prs` | 9 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 0 | 0% |
| `search_remote_code` | 7 | 3 | 0 | 42.9% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `launch_sub_agent` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `sync_branch` | 2 | 1 | 0 | 50% |
| `delegate_large` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,372 | 72.9% |
| `edit` | 277 | 14.7% |
| `search` | 148 | 7.9% |
| `open` | 46 | 2.4% |
| `verify` | 39 | 2.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `conventions` | 44 | 45.4% |
| `japanese` | 37 | 38.1% |
| `project/conventions` | 14 | 14.4% |
| `on-demand-audit` | 1 | 1% |
| `web-search` | 1 | 1% |

## Last 30 days

198 sessions.

**Ran to an end without a report:** 42 of 190 sessions whose last run the core recorded as `completed` — 22.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**587,395,067 tokens** over 241 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.2% of that prompt was served from cache**, over the 239 of 241 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,560 | 6,399,907 | 20,308,488 | 29,805,044 | 587,395,067 |
| messages per session | 126 | 299 | 425 | 439 | 30,444 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 75 | 37.9% |
| `reviewer` | 75 | 37.9% |
| `atomaton` | 47 | 23.7% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,858 | 124 | 75 | 2.1% |
| `read` | 3,368 | 18 | 0 | 0.5% |
| `grep` | 2,724 | 58 | 16 | 2.1% |
| `edit` | 1,047 | 27 | 0 | 2.6% |
| `fetch` | 707 | 61 | 0 | 8.6% |
| `list` | 208 | 3 | 0 | 1.4% |
| `get_pr` | 197 | 0 | 0 | 0% |
| `get_issue_comments` | 191 | 0 | 0 | 0% |
| `get_check_runs` | 188 | 5 | 0 | 2.7% |
| `glob` | 184 | 0 | 0 | 0% |
| `load_skill` | 182 | 7 | 0 | 3.8% |
| `get_issue` | 166 | 1 | 0 | 0.6% |
| `commit_and_push` | 136 | 5 | 0 | 3.7% |
| `write` | 132 | 2 | 0 | 1.5% |
| `check_merge_readiness` | 129 | 0 | 0 | 0% |
| `create_pr` | 114 | 33 | 0 | 28.9% |
| `search_code` | 96 | 0 | 0 | 0% |
| `get_branch` | 84 | 0 | 0 | 0% |
| `get_pr_reviews` | 79 | 0 | 0 | 0% |
| `get_pr_diff` | 77 | 0 | 0 | 0% |
| `request_close_issue` | 72 | 0 | 0 | 0% |
| `search_issues` | 55 | 0 | 0 | 0% |
| `list_pr_review_comments` | 54 | 0 | 0 | 0% |
| `merge_pr` | 54 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `list_prs` | 32 | 0 | 0 | 0% |
| `search_remote_code` | 29 | 13 | 0 | 44.8% |
| `delegate_readonly` | 23 | 0 | 0 | 0% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `create_root_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 15 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `sync_branch` | 7 | 5 | 0 | 71.4% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,783 | 81.6% |
| `edit` | 586 | 10% |
| `search` | 277 | 4.7% |
| `open` | 156 | 2.7% |
| `verify` | 56 | 1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 39.8% |
| `conventions` | 44 | 19.9% |
| `japanese` | 37 | 16.7% |
| `writing/japanese` | 33 | 14.9% |
| `research/web-search` | 7 | 3.2% |
| `delivery/pipeline-setup` | 3 | 1.4% |
| `docs/customer-doc` | 3 | 1.4% |
| `engineering/secrets-in-a-check` | 3 | 1.4% |
| `engineering/environment` | 1 | 0.5% |
| `on-demand-audit` | 1 | 0.5% |
| `web-search` | 1 | 0.5% |

## Last year

389 sessions.

**Ran to an end without a report:** 84 of 375 sessions whose last run the core recorded as `completed` — 22.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,244,745,084 tokens** over 479 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the 477 of 479 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 5,864,765 | 27,846,035 | 73,718,100 | 1,244,745,084 |
| messages per session | 124 | 323 | 583 | 731 | 61,796 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 156 | 40.1% |
| `engineer` | 130 | 33.4% |
| `atomaton` | 102 | 26.2% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 10,158 | 197 | 144 | 1.9% |
| `read` | 7,375 | 40 | 8 | 0.5% |
| `grep` | 5,539 | 127 | 24 | 2.3% |
| `edit` | 2,553 | 51 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,152 | 101 | 0 | 8.8% |
| `list` | 447 | 6 | 0 | 1.3% |
| `get_issue_comments` | 441 | 0 | 10 | 0% |
| `get_issue` | 437 | 14 | 5 | 3.2% |
| `get_pr` | 415 | 9 | 3 | 2.2% |
| `get_check_runs` | 402 | 15 | 0 | 3.7% |
| `glob` | 365 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 258 | 0 | 0 | 0% |
| `commit_and_push` | 247 | 13 | 0 | 5.3% |
| `write` | 244 | 3 | 0 | 1.2% |
| `get_branch` | 227 | 0 | 0 | 0% |
| `create_pr` | 215 | 65 | 0 | 30.2% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `load_skill` | 184 | 9 | 0 | 4.9% |
| `get_pr_diff` | 168 | 3 | 0 | 1.8% |
| `search_issues` | 163 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 135 | 1 | 0 | 0.7% |
| `search_code` | 120 | 0 | 0 | 0% |
| `get_pr_reviews` | 116 | 0 | 0 | 0% |
| `merge_pr` | 91 | 0 | 0 | 0% |
| `list_pr_review_comments` | 83 | 0 | 0 | 0% |
| `list_prs` | 76 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 52 | 19 | 0 | 36.5% |
| `delegate_readonly` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 42 | 1 | 0 | 2.4% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `launch_sub_agent` | 28 | 2 | 0 | 7.1% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `create_sub_issue` | 24 | 0 | 0 | 0% |
| `list_issues` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `sync_branch` | 18 | 8 | 0 | 44.4% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly_large` | 14 | 0 | 3 | 0% |
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
| `other` | 7,985 | 78.6% |
| `edit` | 909 | 8.9% |
| `search` | 675 | 6.6% |
| `open` | 309 | 3% |
| `verify` | 280 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 61.2% |
| `conventions` | 44 | 11.2% |
| `japanese` | 37 | 9.4% |
| `writing/japanese` | 33 | 8.4% |
| `delivery/pipeline-setup` | 10 | 2.5% |
| `research/web-search` | 10 | 2.5% |
| `engineering/environment` | 7 | 1.8% |
| `engineering/secrets-in-a-check` | 6 | 1.5% |
| `docs/customer-doc` | 3 | 0.8% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## All time

410 sessions.

**Ran to an end without a report:** 84 of 375 sessions whose last run the core recorded as `completed` — 22.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 21 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,244,745,084 tokens** over 479 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the 477 of 479 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 5,864,765 | 27,846,035 | 73,718,100 | 1,244,745,084 |
| messages per session | 115 | 307 | 571 | 731 | 61,929 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 162 | 39.5% |
| `engineer` | 141 | 34.4% |
| `atomaton` | 106 | 25.9% |
| `architect` | 1 | 0.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 10,158 | 197 | 144 | 1.9% |
| `read` | 7,375 | 40 | 8 | 0.5% |
| `grep` | 5,539 | 127 | 24 | 2.3% |
| `edit` | 2,553 | 51 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,152 | 101 | 0 | 8.8% |
| `list` | 447 | 6 | 0 | 1.3% |
| `get_issue_comments` | 441 | 0 | 10 | 0% |
| `get_issue` | 437 | 14 | 5 | 3.2% |
| `get_pr` | 415 | 9 | 3 | 2.2% |
| `get_check_runs` | 402 | 15 | 0 | 3.7% |
| `glob` | 365 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 258 | 0 | 0 | 0% |
| `commit_and_push` | 247 | 13 | 0 | 5.3% |
| `write` | 244 | 3 | 0 | 1.2% |
| `get_branch` | 227 | 0 | 0 | 0% |
| `create_pr` | 215 | 65 | 0 | 30.2% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `load_skill` | 184 | 9 | 0 | 4.9% |
| `get_pr_diff` | 168 | 3 | 0 | 1.8% |
| `search_issues` | 163 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 135 | 1 | 0 | 0.7% |
| `search_code` | 120 | 0 | 0 | 0% |
| `get_pr_reviews` | 116 | 0 | 0 | 0% |
| `merge_pr` | 91 | 0 | 0 | 0% |
| `list_pr_review_comments` | 83 | 0 | 0 | 0% |
| `list_prs` | 76 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 52 | 19 | 0 | 36.5% |
| `delegate_readonly` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 42 | 1 | 0 | 2.4% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `launch_sub_agent` | 28 | 2 | 0 | 7.1% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `create_sub_issue` | 24 | 0 | 0 | 0% |
| `list_issues` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `sync_branch` | 18 | 8 | 0 | 44.4% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly_large` | 14 | 0 | 3 | 0% |
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
| `other` | 7,985 | 78.6% |
| `edit` | 909 | 8.9% |
| `search` | 675 | 6.6% |
| `open` | 309 | 3% |
| `verify` | 280 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 61.2% |
| `conventions` | 44 | 11.2% |
| `japanese` | 37 | 9.4% |
| `writing/japanese` | 33 | 8.4% |
| `delivery/pipeline-setup` | 10 | 2.5% |
| `research/web-search` | 10 | 2.5% |
| `engineering/environment` | 7 | 1.8% |
| `engineering/secrets-in-a-check` | 6 | 1.5% |
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
