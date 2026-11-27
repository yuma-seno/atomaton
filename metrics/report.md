# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-27.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 117 | 23.9% | 42 | 1,230 | 8 | 7.0 |
| Last 30 days | 474 | 12.9% | 244 | 6,099 | 11 | 19.9 |
| Last year | 900 | 9.6% | 249 | 10,246 | 13 | 18.7 |
| All time | 900 | 9.6% | 249 | 10,246 | 13 | 18.7 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 814 |
| `failed` | 75 |
| `stopped` | 11 |

## Last 7 days

41 sessions.

**Ran to an end without a report:** 14 of 41 sessions whose last run the core recorded as `completed` — 34.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**70,296,815 tokens** over 46 runs that reported them, **98.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 663,589 | 3,832,760 | 7,840,910 | 7,840,910 | 70,296,815 |
| messages per session | 105 | 198 | 293 | 293 | 4,843 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 20 | 48.8% |
| `reviewer` | 17 | 41.5% |
| `atomaton` | 4 | 9.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 875 | 17 | 4 | 1.9% |
| `read` | 652 | 6 | 0 | 0.9% |
| `grep` | 386 | 6 | 1 | 1.6% |
| `edit` | 183 | 11 | 0 | 6% |
| `fetch` | 41 | 1 | 0 | 2.4% |
| `list` | 39 | 0 | 0 | 0% |
| `load_skill` | 35 | 0 | 0 | 0% |
| `get_check_runs` | 31 | 0 | 0 | 0% |
| `get_issue_comments` | 29 | 0 | 0 | 0% |
| `get_pr` | 29 | 0 | 0 | 0% |
| `create_pr` | 28 | 9 | 0 | 32.1% |
| `check_merge_readiness` | 27 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `commit_and_push` | 26 | 1 | 0 | 3.8% |
| `write` | 25 | 0 | 0 | 0% |
| `glob` | 23 | 0 | 0 | 0% |
| `request_close_issue` | 17 | 0 | 0 | 0% |
| `get_pr_reviews` | 16 | 0 | 0 | 0% |
| `get_issue` | 15 | 0 | 0 | 0% |
| `search_issues` | 13 | 0 | 0 | 0% |
| `merge_pr` | 12 | 0 | 0 | 0% |
| `get_branch` | 11 | 0 | 0 | 0% |
| `list_pr_review_comments` | 11 | 0 | 0 | 0% |
| `get_pr_diff` | 10 | 0 | 0 | 0% |
| `search_remote_code` | 5 | 3 | 0 | 60% |
| `delegate_readonly` | 4 | 0 | 0 | 0% |
| `create_root_issue` | 3 | 0 | 0 | 0% |
| `delegate_readonly_large` | 3 | 0 | 0 | 0% |
| `list_prs` | 3 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 657 | 75.1% |
| `edit` | 175 | 20% |
| `search` | 24 | 2.7% |
| `open` | 13 | 1.5% |
| `verify` | 6 | 0.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 15 | 42.9% |
| `conventions` | 11 | 31.4% |
| `japanese` | 6 | 17.1% |
| `research/web-search` | 2 | 5.7% |
| `on-demand-audit` | 1 | 2.9% |

## Last 30 days

157 sessions.

**Ran to an end without a report:** 27 of 150 sessions whose last run the core recorded as `completed` — 18%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**545,809,399 tokens** over 207 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.6% of that prompt was served from cache**, over the 205 of 207 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,279,746 | 7,840,910 | 20,308,488 | 29,805,044 | 545,809,399 |
| messages per session | 144 | 334 | 425 | 439 | 25,680 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 64 | 40.8% |
| `reviewer` | 62 | 39.5% |
| `atomaton` | 30 | 19.1% |
| `architect` | 1 | 0.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,949 | 115 | 61 | 2.3% |
| `read` | 2,902 | 17 | 0 | 0.6% |
| `grep` | 2,430 | 53 | 14 | 2.2% |
| `edit` | 845 | 22 | 0 | 2.6% |
| `fetch` | 657 | 60 | 0 | 9.1% |
| `list` | 171 | 2 | 0 | 1.2% |
| `glob` | 168 | 0 | 0 | 0% |
| `get_pr` | 163 | 0 | 0 | 0% |
| `get_check_runs` | 158 | 3 | 0 | 1.9% |
| `get_issue_comments` | 137 | 0 | 0 | 0% |
| `load_skill` | 117 | 7 | 0 | 6% |
| `commit_and_push` | 115 | 2 | 0 | 1.7% |
| `write` | 112 | 1 | 0 | 0.9% |
| `get_issue` | 109 | 1 | 0 | 0.9% |
| `check_merge_readiness` | 106 | 0 | 0 | 0% |
| `create_pr` | 98 | 32 | 0 | 32.7% |
| `get_branch` | 73 | 0 | 0 | 0% |
| `get_pr_reviews` | 62 | 0 | 0 | 0% |
| `get_pr_diff` | 59 | 0 | 0 | 0% |
| `request_close_issue` | 57 | 0 | 0 | 0% |
| `search_code` | 55 | 0 | 0 | 0% |
| `list_pr_review_comments` | 44 | 0 | 0 | 0% |
| `merge_pr` | 41 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 40 | 1 | 0 | 2.5% |
| `search_issues` | 37 | 0 | 0 | 0% |
| `list_prs` | 26 | 0 | 0 | 0% |
| `search_remote_code` | 25 | 11 | 0 | 44% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 13 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `sync_branch` | 6 | 4 | 0 | 66.7% |
| `delegate_large` | 5 | 0 | 0 | 0% |
| `list_issues` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 3 | 0 | 0 | 0% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,147 | 83.8% |
| `edit` | 500 | 10.1% |
| `search` | 156 | 3.2% |
| `open` | 123 | 2.5% |
| `verify` | 23 | 0.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 56.1% |
| `writing/japanese` | 33 | 21% |
| `conventions` | 11 | 7% |
| `research/web-search` | 8 | 5.1% |
| `japanese` | 6 | 3.8% |
| `delivery/pipeline-setup` | 3 | 1.9% |
| `docs/customer-doc` | 3 | 1.9% |
| `engineering/secrets-in-a-check` | 3 | 1.9% |
| `engineering/environment` | 1 | 0.6% |
| `on-demand-audit` | 1 | 0.6% |

## Last year

343 sessions.

**Ran to an end without a report:** 69 of 330 sessions whose last run the core recorded as `completed` — 20.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,181,918,912 tokens** over 438 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the 436 of 438 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,279,746 | 6,099,372 | 27,846,035 | 73,718,100 | 1,181,918,912 |
| messages per session | 126 | 330 | 583 | 731 | 56,402 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 141 | 41.1% |
| `engineer` | 117 | 34.1% |
| `atomaton` | 84 | 24.5% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,151 | 185 | 130 | 2% |
| `read` | 6,814 | 38 | 8 | 0.6% |
| `grep` | 5,171 | 118 | 22 | 2.3% |
| `edit` | 2,343 | 46 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,083 | 99 | 0 | 9.1% |
| `list` | 409 | 5 | 0 | 1.2% |
| `get_issue_comments` | 384 | 0 | 10 | 0% |
| `get_issue` | 379 | 14 | 5 | 3.7% |
| `get_pr` | 379 | 9 | 3 | 2.4% |
| `get_check_runs` | 370 | 13 | 0 | 3.5% |
| `glob` | 342 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 234 | 0 | 0 | 0% |
| `write` | 224 | 2 | 0 | 0.9% |
| `commit_and_push` | 222 | 10 | 0 | 4.5% |
| `get_branch` | 216 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 198 | 64 | 0 | 32.3% |
| `get_pr_diff` | 149 | 3 | 0 | 2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `search_issues` | 145 | 0 | 3 | 0% |
| `request_close_issue` | 120 | 1 | 0 | 0.8% |
| `load_skill` | 119 | 9 | 0 | 7.6% |
| `get_pr_reviews` | 98 | 0 | 0 | 0% |
| `search_code` | 79 | 0 | 0 | 0% |
| `merge_pr` | 77 | 0 | 0 | 0% |
| `list_pr_review_comments` | 73 | 0 | 0 | 0% |
| `list_prs` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 48 | 17 | 0 | 35.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 36 | 1 | 0 | 2.8% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `delegate_readonly` | 33 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
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
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
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
| `other` | 7,270 | 79.4% |
| `edit` | 807 | 8.8% |
| `search` | 551 | 6% |
| `open` | 276 | 3% |
| `verify` | 247 | 2.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 73.3% |
| `writing/japanese` | 33 | 10% |
| `conventions` | 11 | 3.3% |
| `delivery/pipeline-setup` | 10 | 3% |
| `research/web-search` | 10 | 3% |
| `engineering/environment` | 7 | 2.1% |
| `engineering/secrets-in-a-check` | 6 | 1.8% |
| `japanese` | 6 | 1.8% |
| `docs/customer-doc` | 3 | 0.9% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |

## All time

362 sessions.

**Ran to an end without a report:** 69 of 330 sessions whose last run the core recorded as `completed` — 20.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,181,918,912 tokens** over 438 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the 436 of 438 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,279,746 | 6,099,372 | 27,846,035 | 73,718,100 | 1,181,918,912 |
| messages per session | 120 | 327 | 583 | 731 | 56,526 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 147 | 40.6% |
| `engineer` | 127 | 35.1% |
| `atomaton` | 87 | 24% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,151 | 185 | 130 | 2% |
| `read` | 6,814 | 38 | 8 | 0.6% |
| `grep` | 5,171 | 118 | 22 | 2.3% |
| `edit` | 2,343 | 46 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,083 | 99 | 0 | 9.1% |
| `list` | 409 | 5 | 0 | 1.2% |
| `get_issue_comments` | 384 | 0 | 10 | 0% |
| `get_issue` | 379 | 14 | 5 | 3.7% |
| `get_pr` | 379 | 9 | 3 | 2.4% |
| `get_check_runs` | 370 | 13 | 0 | 3.5% |
| `glob` | 342 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 234 | 0 | 0 | 0% |
| `write` | 224 | 2 | 0 | 0.9% |
| `commit_and_push` | 222 | 10 | 0 | 4.5% |
| `get_branch` | 216 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 198 | 64 | 0 | 32.3% |
| `get_pr_diff` | 149 | 3 | 0 | 2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `search_issues` | 145 | 0 | 3 | 0% |
| `request_close_issue` | 120 | 1 | 0 | 0.8% |
| `load_skill` | 119 | 9 | 0 | 7.6% |
| `get_pr_reviews` | 98 | 0 | 0 | 0% |
| `search_code` | 79 | 0 | 0 | 0% |
| `merge_pr` | 77 | 0 | 0 | 0% |
| `list_pr_review_comments` | 73 | 0 | 0 | 0% |
| `list_prs` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 48 | 17 | 0 | 35.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 36 | 1 | 0 | 2.8% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `delegate_readonly` | 33 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
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
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
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
| `other` | 7,270 | 79.4% |
| `edit` | 807 | 8.8% |
| `search` | 551 | 6% |
| `open` | 276 | 3% |
| `verify` | 247 | 2.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 73.3% |
| `writing/japanese` | 33 | 10% |
| `conventions` | 11 | 3.3% |
| `delivery/pipeline-setup` | 10 | 3% |
| `research/web-search` | 10 | 3% |
| `engineering/environment` | 7 | 2.1% |
| `engineering/secrets-in-a-check` | 6 | 1.8% |
| `japanese` | 6 | 1.8% |
| `docs/customer-doc` | 3 | 0.9% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |

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
- `web-search`
