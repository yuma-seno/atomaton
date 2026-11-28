# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-28.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 198 | 21.7% | 90 | 3,219 | 9 | 7.8 |
| Last 30 days | 547 | 14.1% | 230 | 6,099 | 10 | 19.0 |
| Last year | 985 | 10.5% | 244 | 10,246 | 13 | 18.2 |
| All time | 985 | 10.5% | 244 | 10,246 | 13 | 18.2 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 882 |
| `failed` | 92 |
| `stopped` | 11 |

## Last 7 days

79 sessions.

**Ran to an end without a report:** 25 of 78 sessions whose last run the core recorded as `completed` — 32.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**118,788,215 tokens** over 81 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**90.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 776,544 | 3,174,001 | 8,244,501 | 8,244,501 | 118,788,215 |
| messages per session | 93 | 235 | 293 | 293 | 9,317 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 30 | 38% |
| `reviewer` | 30 | 38% |
| `atomaton` | 19 | 24.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,684 | 27 | 15 | 1.6% |
| `read` | 1,135 | 7 | 0 | 0.6% |
| `grep` | 698 | 14 | 2 | 2% |
| `edit` | 346 | 15 | 0 | 4.3% |
| `fetch` | 106 | 3 | 0 | 2.8% |
| `load_skill` | 89 | 0 | 0 | 0% |
| `list` | 72 | 1 | 0 | 1.4% |
| `get_issue_comments` | 67 | 0 | 0 | 0% |
| `get_pr` | 60 | 0 | 0 | 0% |
| `get_check_runs` | 59 | 2 | 0 | 3.4% |
| `get_issue` | 58 | 0 | 0 | 0% |
| `search_code` | 57 | 0 | 0 | 0% |
| `check_merge_readiness` | 49 | 0 | 0 | 0% |
| `commit_and_push` | 47 | 4 | 0 | 8.5% |
| `glob` | 46 | 0 | 0 | 0% |
| `write` | 43 | 1 | 0 | 2.3% |
| `create_pr` | 42 | 10 | 0 | 23.8% |
| `get_pr_reviews` | 32 | 0 | 0 | 0% |
| `request_close_issue` | 30 | 0 | 0 | 0% |
| `search_issues` | 29 | 0 | 0 | 0% |
| `get_pr_diff` | 27 | 0 | 0 | 0% |
| `merge_pr` | 25 | 0 | 0 | 0% |
| `list_pr_review_comments` | 21 | 0 | 0 | 0% |
| `get_branch` | 20 | 0 | 0 | 0% |
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
| `other` | 1,219 | 72.4% |
| `edit` | 266 | 15.8% |
| `search` | 119 | 7.1% |
| `open` | 41 | 2.4% |
| `verify` | 39 | 2.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `conventions` | 37 | 41.6% |
| `japanese` | 33 | 37.1% |
| `project/conventions` | 15 | 16.9% |
| `research/web-search` | 2 | 2.2% |
| `on-demand-audit` | 1 | 1.1% |
| `web-search` | 1 | 1.1% |

## Last 30 days

190 sessions.

**Ran to an end without a report:** 38 of 182 sessions whose last run the core recorded as `completed` — 20.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**576,460,686 tokens** over 236 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.2% of that prompt was served from cache**, over the 234 of 236 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,224,669 | 6,417,588 | 20,308,488 | 29,805,044 | 576,460,686 |
| messages per session | 131 | 307 | 425 | 439 | 29,524 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 73 | 38.4% |
| `engineer` | 72 | 37.9% |
| `atomaton` | 44 | 23.2% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,660 | 122 | 72 | 2.2% |
| `read` | 3,290 | 17 | 0 | 0.5% |
| `grep` | 2,668 | 57 | 15 | 2.1% |
| `edit` | 1,000 | 26 | 0 | 2.6% |
| `fetch` | 703 | 61 | 0 | 8.7% |
| `list` | 203 | 3 | 0 | 1.5% |
| `get_pr` | 192 | 0 | 0 | 0% |
| `get_check_runs` | 184 | 5 | 0 | 2.7% |
| `glob` | 184 | 0 | 0 | 0% |
| `get_issue_comments` | 172 | 0 | 0 | 0% |
| `load_skill` | 171 | 7 | 0 | 4.1% |
| `get_issue` | 151 | 1 | 0 | 0.7% |
| `commit_and_push` | 132 | 5 | 0 | 3.8% |
| `write` | 130 | 2 | 0 | 1.5% |
| `check_merge_readiness` | 127 | 0 | 0 | 0% |
| `create_pr` | 111 | 33 | 0 | 29.7% |
| `search_code` | 85 | 0 | 0 | 0% |
| `get_branch` | 82 | 0 | 0 | 0% |
| `get_pr_reviews` | 77 | 0 | 0 | 0% |
| `get_pr_diff` | 75 | 0 | 0 | 0% |
| `request_close_issue` | 70 | 0 | 0 | 0% |
| `list_pr_review_comments` | 54 | 0 | 0 | 0% |
| `merge_pr` | 53 | 0 | 0 | 0% |
| `search_issues` | 53 | 0 | 0 | 0% |
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
| `other` | 4,630 | 81.8% |
| `edit` | 575 | 10.2% |
| `search` | 248 | 4.4% |
| `open` | 151 | 2.7% |
| `verify` | 56 | 1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 41.9% |
| `conventions` | 37 | 17.6% |
| `japanese` | 33 | 15.7% |
| `writing/japanese` | 33 | 15.7% |
| `research/web-search` | 7 | 3.3% |
| `delivery/pipeline-setup` | 3 | 1.4% |
| `docs/customer-doc` | 3 | 1.4% |
| `engineering/secrets-in-a-check` | 3 | 1.4% |
| `engineering/environment` | 1 | 0.5% |
| `on-demand-audit` | 1 | 0.5% |
| `web-search` | 1 | 0.5% |

## Last year

381 sessions.

**Ran to an end without a report:** 80 of 367 sessions whose last run the core recorded as `completed` — 21.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,233,810,703 tokens** over 474 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the 472 of 474 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,645 | 5,864,765 | 27,846,035 | 73,718,100 | 1,233,810,703 |
| messages per session | 124 | 323 | 583 | 731 | 60,876 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 154 | 40.4% |
| `engineer` | 127 | 33.3% |
| `atomaton` | 99 | 26% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,960 | 195 | 141 | 2% |
| `read` | 7,297 | 39 | 8 | 0.5% |
| `grep` | 5,483 | 126 | 23 | 2.3% |
| `edit` | 2,506 | 50 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,148 | 101 | 0 | 8.8% |
| `list` | 442 | 6 | 0 | 1.4% |
| `get_issue` | 422 | 14 | 5 | 3.3% |
| `get_issue_comments` | 422 | 0 | 10 | 0% |
| `get_pr` | 410 | 9 | 3 | 2.2% |
| `get_check_runs` | 398 | 15 | 0 | 3.8% |
| `glob` | 365 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 256 | 0 | 0 | 0% |
| `commit_and_push` | 243 | 13 | 0 | 5.3% |
| `write` | 242 | 3 | 0 | 1.2% |
| `get_branch` | 225 | 0 | 0 | 0% |
| `create_pr` | 212 | 65 | 0 | 30.7% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `load_skill` | 173 | 9 | 0 | 5.2% |
| `get_pr_diff` | 166 | 3 | 0 | 1.8% |
| `search_issues` | 161 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 133 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 114 | 0 | 0 | 0% |
| `search_code` | 109 | 0 | 0 | 0% |
| `merge_pr` | 90 | 0 | 0 | 0% |
| `list_pr_review_comments` | 83 | 0 | 0 | 0% |
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
| `other` | 7,832 | 78.6% |
| `edit` | 898 | 9% |
| `search` | 646 | 6.5% |
| `open` | 304 | 3.1% |
| `verify` | 280 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 62.9% |
| `conventions` | 37 | 9.7% |
| `japanese` | 33 | 8.6% |
| `writing/japanese` | 33 | 8.6% |
| `delivery/pipeline-setup` | 10 | 2.6% |
| `research/web-search` | 10 | 2.6% |
| `engineering/environment` | 7 | 1.8% |
| `engineering/secrets-in-a-check` | 6 | 1.6% |
| `docs/customer-doc` | 3 | 0.8% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## All time

402 sessions.

**Ran to an end without a report:** 80 of 367 sessions whose last run the core recorded as `completed` — 21.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 21 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,233,810,703 tokens** over 474 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the 472 of 474 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,645 | 5,864,765 | 27,846,035 | 73,718,100 | 1,233,810,703 |
| messages per session | 117 | 307 | 571 | 731 | 61,009 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 160 | 39.8% |
| `engineer` | 138 | 34.3% |
| `atomaton` | 103 | 25.6% |
| `architect` | 1 | 0.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,960 | 195 | 141 | 2% |
| `read` | 7,297 | 39 | 8 | 0.5% |
| `grep` | 5,483 | 126 | 23 | 2.3% |
| `edit` | 2,506 | 50 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,148 | 101 | 0 | 8.8% |
| `list` | 442 | 6 | 0 | 1.4% |
| `get_issue` | 422 | 14 | 5 | 3.3% |
| `get_issue_comments` | 422 | 0 | 10 | 0% |
| `get_pr` | 410 | 9 | 3 | 2.2% |
| `get_check_runs` | 398 | 15 | 0 | 3.8% |
| `glob` | 365 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 256 | 0 | 0 | 0% |
| `commit_and_push` | 243 | 13 | 0 | 5.3% |
| `write` | 242 | 3 | 0 | 1.2% |
| `get_branch` | 225 | 0 | 0 | 0% |
| `create_pr` | 212 | 65 | 0 | 30.7% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `load_skill` | 173 | 9 | 0 | 5.2% |
| `get_pr_diff` | 166 | 3 | 0 | 1.8% |
| `search_issues` | 161 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 133 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 114 | 0 | 0 | 0% |
| `search_code` | 109 | 0 | 0 | 0% |
| `merge_pr` | 90 | 0 | 0 | 0% |
| `list_pr_review_comments` | 83 | 0 | 0 | 0% |
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
| `other` | 7,832 | 78.6% |
| `edit` | 898 | 9% |
| `search` | 646 | 6.5% |
| `open` | 304 | 3.1% |
| `verify` | 280 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 62.9% |
| `conventions` | 37 | 9.7% |
| `japanese` | 33 | 8.6% |
| `writing/japanese` | 33 | 8.6% |
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
| 2026-10-25 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

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
