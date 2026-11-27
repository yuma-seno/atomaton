# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-27.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 123 | 23.6% | 45 | 1,413 | 8 | 7.0 |
| Last 30 days | 480 | 12.9% | 244 | 6,099 | 11 | 19.7 |
| Last year | 906 | 9.6% | 248 | 10,246 | 13 | 18.5 |
| All time | 906 | 9.6% | 248 | 10,246 | 13 | 18.5 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 819 |
| `failed` | 76 |
| `stopped` | 11 |

## Last 7 days

44 sessions.

**Ran to an end without a report:** 15 of 44 sessions whose last run the core recorded as `completed` — 34.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**73,009,944 tokens** over 49 runs that reported them, **98.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 663,589 | 3,832,760 | 7,840,910 | 7,840,910 | 73,009,944 |
| messages per session | 105 | 198 | 293 | 293 | 5,189 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 21 | 47.7% |
| `reviewer` | 18 | 40.9% |
| `atomaton` | 5 | 11.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 926 | 19 | 4 | 2.1% |
| `read` | 687 | 7 | 0 | 1% |
| `grep` | 405 | 7 | 1 | 1.7% |
| `edit` | 194 | 11 | 0 | 5.7% |
| `fetch` | 51 | 1 | 0 | 2% |
| `list` | 43 | 0 | 0 | 0% |
| `load_skill` | 39 | 0 | 0 | 0% |
| `get_issue_comments` | 35 | 0 | 0 | 0% |
| `get_check_runs` | 34 | 0 | 0 | 0% |
| `get_pr` | 33 | 0 | 0 | 0% |
| `check_merge_readiness` | 30 | 0 | 0 | 0% |
| `create_pr` | 29 | 9 | 0 | 31% |
| `commit_and_push` | 27 | 1 | 0 | 3.7% |
| `search_code` | 27 | 0 | 0 | 0% |
| `write` | 25 | 0 | 0 | 0% |
| `glob` | 24 | 0 | 0 | 0% |
| `get_pr_reviews` | 19 | 0 | 0 | 0% |
| `get_issue` | 18 | 0 | 0 | 0% |
| `request_close_issue` | 18 | 0 | 0 | 0% |
| `get_branch` | 14 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `merge_pr` | 14 | 0 | 0 | 0% |
| `search_issues` | 14 | 0 | 0 | 0% |
| `get_pr_diff` | 11 | 0 | 0 | 0% |
| `search_remote_code` | 7 | 5 | 0 | 71.4% |
| `delegate_readonly` | 5 | 0 | 0 | 0% |
| `create_root_issue` | 4 | 0 | 0 | 0% |
| `delegate_readonly_large` | 3 | 0 | 0 | 0% |
| `list_prs` | 3 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 688 | 74.3% |
| `edit` | 175 | 18.9% |
| `search` | 36 | 3.9% |
| `open` | 15 | 1.6% |
| `verify` | 12 | 1.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 15 | 38.5% |
| `conventions` | 13 | 33.3% |
| `japanese` | 7 | 17.9% |
| `research/web-search` | 2 | 5.1% |
| `on-demand-audit` | 1 | 2.6% |
| `web-search` | 1 | 2.6% |

## Last 30 days

160 sessions.

**Ran to an end without a report:** 28 of 153 sessions whose last run the core recorded as `completed` — 18.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**548,522,528 tokens** over 210 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.6% of that prompt was served from cache**, over the 208 of 210 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,279,746 | 7,840,910 | 20,308,488 | 29,805,044 | 548,522,528 |
| messages per session | 147 | 334 | 425 | 439 | 26,026 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 65 | 40.6% |
| `reviewer` | 63 | 39.4% |
| `atomaton` | 31 | 19.4% |
| `architect` | 1 | 0.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,000 | 117 | 61 | 2.3% |
| `read` | 2,937 | 18 | 0 | 0.6% |
| `grep` | 2,449 | 54 | 14 | 2.2% |
| `edit` | 856 | 22 | 0 | 2.6% |
| `fetch` | 667 | 60 | 0 | 9% |
| `list` | 175 | 2 | 0 | 1.1% |
| `glob` | 169 | 0 | 0 | 0% |
| `get_pr` | 167 | 0 | 0 | 0% |
| `get_check_runs` | 161 | 3 | 0 | 1.9% |
| `get_issue_comments` | 143 | 0 | 0 | 0% |
| `load_skill` | 121 | 7 | 0 | 5.8% |
| `commit_and_push` | 116 | 2 | 0 | 1.7% |
| `get_issue` | 112 | 1 | 0 | 0.9% |
| `write` | 112 | 1 | 0 | 0.9% |
| `check_merge_readiness` | 109 | 0 | 0 | 0% |
| `create_pr` | 99 | 32 | 0 | 32.3% |
| `get_branch` | 76 | 0 | 0 | 0% |
| `get_pr_reviews` | 65 | 0 | 0 | 0% |
| `get_pr_diff` | 60 | 0 | 0 | 0% |
| `request_close_issue` | 58 | 0 | 0 | 0% |
| `search_code` | 55 | 0 | 0 | 0% |
| `list_pr_review_comments` | 47 | 0 | 0 | 0% |
| `merge_pr` | 43 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 40 | 1 | 0 | 2.5% |
| `search_issues` | 38 | 0 | 0 | 0% |
| `search_remote_code` | 27 | 13 | 0 | 48.1% |
| `list_prs` | 26 | 0 | 0 | 0% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 14 | 0 | 0 | 0% |
| `delegate_readonly` | 13 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
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
| `other` | 4,178 | 83.6% |
| `edit` | 500 | 10% |
| `search` | 168 | 3.4% |
| `open` | 125 | 2.5% |
| `verify` | 29 | 0.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 54.7% |
| `writing/japanese` | 33 | 20.5% |
| `conventions` | 13 | 8.1% |
| `research/web-search` | 8 | 5% |
| `japanese` | 7 | 4.3% |
| `delivery/pipeline-setup` | 3 | 1.9% |
| `docs/customer-doc` | 3 | 1.9% |
| `engineering/secrets-in-a-check` | 3 | 1.9% |
| `engineering/environment` | 1 | 0.6% |
| `on-demand-audit` | 1 | 0.6% |
| `web-search` | 1 | 0.6% |

## Last year

346 sessions.

**Ran to an end without a report:** 70 of 333 sessions whose last run the core recorded as `completed` — 21%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,184,632,041 tokens** over 441 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the 439 of 441 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,279,073 | 6,056,423 | 27,846,035 | 73,718,100 | 1,184,632,041 |
| messages per session | 129 | 330 | 583 | 731 | 56,748 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 142 | 41% |
| `engineer` | 118 | 34.1% |
| `atomaton` | 85 | 24.6% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,202 | 187 | 130 | 2% |
| `read` | 6,849 | 39 | 8 | 0.6% |
| `grep` | 5,190 | 119 | 22 | 2.3% |
| `edit` | 2,354 | 46 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,093 | 99 | 0 | 9.1% |
| `list` | 413 | 5 | 0 | 1.2% |
| `get_issue_comments` | 390 | 0 | 10 | 0% |
| `get_pr` | 383 | 9 | 3 | 2.3% |
| `get_issue` | 382 | 14 | 5 | 3.7% |
| `get_check_runs` | 373 | 13 | 0 | 3.5% |
| `glob` | 343 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 237 | 0 | 0 | 0% |
| `write` | 224 | 2 | 0 | 0.9% |
| `commit_and_push` | 223 | 10 | 0 | 4.5% |
| `get_branch` | 219 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 199 | 64 | 0 | 32.2% |
| `get_pr_diff` | 150 | 3 | 0 | 2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `search_issues` | 146 | 0 | 3 | 0% |
| `load_skill` | 123 | 9 | 0 | 7.3% |
| `request_close_issue` | 121 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 101 | 0 | 0 | 0% |
| `merge_pr` | 79 | 0 | 0 | 0% |
| `search_code` | 79 | 0 | 0 | 0% |
| `list_pr_review_comments` | 76 | 0 | 0 | 0% |
| `list_prs` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 50 | 19 | 0 | 38% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 37 | 1 | 0 | 2.7% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `delegate_readonly` | 34 | 0 | 0 | 0% |
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
| `other` | 7,301 | 79.3% |
| `edit` | 807 | 8.8% |
| `search` | 563 | 6.1% |
| `open` | 278 | 3% |
| `verify` | 253 | 2.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 72.4% |
| `writing/japanese` | 33 | 9.9% |
| `conventions` | 13 | 3.9% |
| `delivery/pipeline-setup` | 10 | 3% |
| `research/web-search` | 10 | 3% |
| `engineering/environment` | 7 | 2.1% |
| `japanese` | 7 | 2.1% |
| `engineering/secrets-in-a-check` | 6 | 1.8% |
| `docs/customer-doc` | 3 | 0.9% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## All time

365 sessions.

**Ran to an end without a report:** 70 of 333 sessions whose last run the core recorded as `completed` — 21%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,184,632,041 tokens** over 441 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the 439 of 441 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,279,073 | 6,056,423 | 27,846,035 | 73,718,100 | 1,184,632,041 |
| messages per session | 120 | 327 | 583 | 731 | 56,872 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 148 | 40.5% |
| `engineer` | 128 | 35.1% |
| `atomaton` | 88 | 24.1% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,202 | 187 | 130 | 2% |
| `read` | 6,849 | 39 | 8 | 0.6% |
| `grep` | 5,190 | 119 | 22 | 2.3% |
| `edit` | 2,354 | 46 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,093 | 99 | 0 | 9.1% |
| `list` | 413 | 5 | 0 | 1.2% |
| `get_issue_comments` | 390 | 0 | 10 | 0% |
| `get_pr` | 383 | 9 | 3 | 2.3% |
| `get_issue` | 382 | 14 | 5 | 3.7% |
| `get_check_runs` | 373 | 13 | 0 | 3.5% |
| `glob` | 343 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 237 | 0 | 0 | 0% |
| `write` | 224 | 2 | 0 | 0.9% |
| `commit_and_push` | 223 | 10 | 0 | 4.5% |
| `get_branch` | 219 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 199 | 64 | 0 | 32.2% |
| `get_pr_diff` | 150 | 3 | 0 | 2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `search_issues` | 146 | 0 | 3 | 0% |
| `load_skill` | 123 | 9 | 0 | 7.3% |
| `request_close_issue` | 121 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 101 | 0 | 0 | 0% |
| `merge_pr` | 79 | 0 | 0 | 0% |
| `search_code` | 79 | 0 | 0 | 0% |
| `list_pr_review_comments` | 76 | 0 | 0 | 0% |
| `list_prs` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 50 | 19 | 0 | 38% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 37 | 1 | 0 | 2.7% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `delegate_readonly` | 34 | 0 | 0 | 0% |
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
| `other` | 7,301 | 79.3% |
| `edit` | 807 | 8.8% |
| `search` | 563 | 6.1% |
| `open` | 278 | 3% |
| `verify` | 253 | 2.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 72.4% |
| `writing/japanese` | 33 | 9.9% |
| `conventions` | 13 | 3.9% |
| `delivery/pipeline-setup` | 10 | 3% |
| `research/web-search` | 10 | 3% |
| `engineering/environment` | 7 | 2.1% |
| `japanese` | 7 | 2.1% |
| `engineering/secrets-in-a-check` | 6 | 1.8% |
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
