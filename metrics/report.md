# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-27.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 95 | 26.3% | 42 | 1,230 | 8 | 6.7 |
| Last 30 days | 450 | 12.9% | 248 | 6,099 | 11 | 20.6 |
| Last year | 876 | 9.5% | 255 | 10,246 | 13 | 19.0 |
| All time | 876 | 9.5% | 255 | 10,246 | 13 | 19.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 793 |
| `failed` | 72 |
| `stopped` | 11 |

## Last 7 days

34 sessions.

**Ran to an end without a report:** 11 of 34 sessions whose last run the core recorded as `completed` — 32.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**55,332,786 tokens** over 38 runs that reported them, **98.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 663,589 | 3,832,760 | 7,840,910 | 7,840,910 | 55,332,786 |
| messages per session | 103 | 198 | 293 | 293 | 3,865 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 17 | 50% |
| `reviewer` | 15 | 44.1% |
| `atomaton` | 2 | 5.9% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 676 | 14 | 2 | 2.1% |
| `read` | 540 | 3 | 0 | 0.6% |
| `grep` | 320 | 4 | 0 | 1.3% |
| `edit` | 165 | 10 | 0 | 6.1% |
| `fetch` | 37 | 1 | 0 | 2.7% |
| `list` | 36 | 0 | 0 | 0% |
| `load_skill` | 26 | 0 | 0 | 0% |
| `get_check_runs` | 25 | 0 | 0 | 0% |
| `commit_and_push` | 23 | 1 | 0 | 4.3% |
| `get_pr` | 23 | 0 | 0 | 0% |
| `check_merge_readiness` | 22 | 0 | 0 | 0% |
| `create_pr` | 22 | 6 | 0 | 27.3% |
| `write` | 20 | 0 | 0 | 0% |
| `get_issue_comments` | 17 | 0 | 0 | 0% |
| `glob` | 17 | 0 | 0 | 0% |
| `get_pr_reviews` | 14 | 0 | 0 | 0% |
| `request_close_issue` | 14 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 9 | 0 | 0 | 0% |
| `search_issues` | 9 | 0 | 0 | 0% |
| `get_branch` | 8 | 0 | 0 | 0% |
| `get_issue` | 8 | 0 | 0 | 0% |
| `get_pr_diff` | 8 | 0 | 0 | 0% |
| `search_code` | 6 | 0 | 0 | 0% |
| `search_remote_code` | 5 | 3 | 0 | 60% |
| `create_root_issue` | 3 | 0 | 0 | 0% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 0 | 0% |
| `list_prs` | 2 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 549 | 81.2% |
| `edit` | 97 | 14.3% |
| `search` | 14 | 2.1% |
| `open` | 10 | 1.5% |
| `verify` | 6 | 0.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 15 | 57.7% |
| `conventions` | 6 | 23.1% |
| `japanese` | 2 | 7.7% |
| `research/web-search` | 2 | 7.7% |
| `writing/japanese` | 1 | 3.8% |

## Last 30 days

149 sessions.

**Ran to an end without a report:** 24 of 142 sessions whose last run the core recorded as `completed` — 16.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**530,158,290 tokens** over 197 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 195 of 197 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,291,903 | 8,209,387 | 21,812,397 | 29,805,044 | 530,158,290 |
| messages per session | 151 | 339 | 425 | 439 | 24,644 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 61 | 40.9% |
| `reviewer` | 60 | 40.3% |
| `atomaton` | 27 | 18.1% |
| `architect` | 1 | 0.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,748 | 112 | 59 | 2.4% |
| `read` | 2,773 | 14 | 0 | 0.5% |
| `grep` | 2,355 | 51 | 13 | 2.2% |
| `edit` | 827 | 21 | 0 | 2.5% |
| `fetch` | 653 | 60 | 0 | 9.2% |
| `glob` | 162 | 0 | 0 | 0% |
| `list` | 160 | 2 | 0 | 1.3% |
| `get_pr` | 157 | 0 | 0 | 0% |
| `get_check_runs` | 152 | 3 | 0 | 2% |
| `get_issue_comments` | 124 | 0 | 0 | 0% |
| `commit_and_push` | 112 | 2 | 0 | 1.8% |
| `load_skill` | 107 | 7 | 0 | 6.5% |
| `write` | 107 | 1 | 0 | 0.9% |
| `check_merge_readiness` | 101 | 0 | 0 | 0% |
| `get_issue` | 100 | 1 | 0 | 1% |
| `create_pr` | 92 | 29 | 0 | 31.5% |
| `get_branch` | 70 | 0 | 0 | 0% |
| `get_pr_reviews` | 60 | 0 | 0 | 0% |
| `get_pr_diff` | 57 | 0 | 0 | 0% |
| `request_close_issue` | 54 | 0 | 0 | 0% |
| `list_pr_review_comments` | 42 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 40 | 1 | 0 | 2.5% |
| `merge_pr` | 39 | 0 | 0 | 0% |
| `search_code` | 34 | 0 | 0 | 0% |
| `search_issues` | 32 | 0 | 0 | 0% |
| `list_prs` | 25 | 0 | 0 | 0% |
| `search_remote_code` | 25 | 11 | 0 | 44% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 13 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `delegate_readonly` | 11 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `delegate_large` | 5 | 0 | 0 | 0% |
| `list_issues` | 5 | 0 | 0 | 0% |
| `sync_branch` | 5 | 4 | 0 | 80% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `delegate_readonly_large` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,037 | 85% |
| `edit` | 422 | 8.9% |
| `search` | 146 | 3.1% |
| `open` | 120 | 2.5% |
| `verify` | 23 | 0.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 59.9% |
| `writing/japanese` | 33 | 22.4% |
| `research/web-search` | 8 | 5.4% |
| `conventions` | 6 | 4.1% |
| `delivery/pipeline-setup` | 3 | 2% |
| `docs/customer-doc` | 3 | 2% |
| `engineering/secrets-in-a-check` | 3 | 2% |
| `japanese` | 2 | 1.4% |
| `engineering/environment` | 1 | 0.7% |

## Last year

335 sessions.

**Ran to an end without a report:** 66 of 322 sessions whose last run the core recorded as `completed` — 20.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,166,267,803 tokens** over 428 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the 426 of 428 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 6,099,372 | 27,846,035 | 73,718,100 | 1,166,267,803 |
| messages per session | 129 | 331 | 583 | 731 | 55,366 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 139 | 41.5% |
| `engineer` | 114 | 34% |
| `atomaton` | 81 | 24.2% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,950 | 182 | 128 | 2% |
| `read` | 6,685 | 35 | 8 | 0.5% |
| `grep` | 5,096 | 116 | 21 | 2.3% |
| `edit` | 2,325 | 45 | 0 | 1.9% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,079 | 99 | 0 | 9.2% |
| `list` | 398 | 5 | 0 | 1.3% |
| `get_pr` | 373 | 9 | 3 | 2.4% |
| `get_issue_comments` | 371 | 0 | 10 | 0% |
| `get_issue` | 370 | 14 | 5 | 3.8% |
| `get_check_runs` | 364 | 13 | 0 | 3.6% |
| `glob` | 336 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 229 | 0 | 0 | 0% |
| `commit_and_push` | 219 | 10 | 0 | 4.6% |
| `write` | 219 | 2 | 0 | 0.9% |
| `get_branch` | 213 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 192 | 61 | 0 | 31.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 147 | 3 | 0 | 2% |
| `search_issues` | 140 | 0 | 3 | 0% |
| `request_close_issue` | 117 | 1 | 0 | 0.9% |
| `load_skill` | 109 | 9 | 0 | 8.3% |
| `get_pr_reviews` | 96 | 0 | 0 | 0% |
| `merge_pr` | 75 | 0 | 0 | 0% |
| `list_pr_review_comments` | 71 | 0 | 0 | 0% |
| `list_prs` | 69 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_code` | 58 | 0 | 0 | 0% |
| `search_remote_code` | 48 | 17 | 0 | 35.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 36 | 1 | 0 | 2.8% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `delegate_readonly` | 32 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 18 | 0 | 0 | 0% |
| `sync_branch` | 16 | 7 | 0 | 43.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `delegate_readonly_large` | 9 | 0 | 3 | 0% |
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
| `other` | 7,160 | 80% |
| `edit` | 729 | 8.1% |
| `search` | 541 | 6% |
| `open` | 273 | 3.1% |
| `verify` | 247 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 75.5% |
| `writing/japanese` | 33 | 10.3% |
| `delivery/pipeline-setup` | 10 | 3.1% |
| `research/web-search` | 10 | 3.1% |
| `engineering/environment` | 7 | 2.2% |
| `conventions` | 6 | 1.9% |
| `engineering/secrets-in-a-check` | 6 | 1.9% |
| `docs/customer-doc` | 3 | 0.9% |
| `japanese` | 2 | 0.6% |
| `docs/design-doc` | 1 | 0.3% |

## All time

354 sessions.

**Ran to an end without a report:** 66 of 322 sessions whose last run the core recorded as `completed` — 20.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,166,267,803 tokens** over 428 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the 426 of 428 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 6,099,372 | 27,846,035 | 73,718,100 | 1,166,267,803 |
| messages per session | 120 | 328 | 583 | 731 | 55,490 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 145 | 41% |
| `engineer` | 124 | 35% |
| `atomaton` | 84 | 23.7% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,950 | 182 | 128 | 2% |
| `read` | 6,685 | 35 | 8 | 0.5% |
| `grep` | 5,096 | 116 | 21 | 2.3% |
| `edit` | 2,325 | 45 | 0 | 1.9% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,079 | 99 | 0 | 9.2% |
| `list` | 398 | 5 | 0 | 1.3% |
| `get_pr` | 373 | 9 | 3 | 2.4% |
| `get_issue_comments` | 371 | 0 | 10 | 0% |
| `get_issue` | 370 | 14 | 5 | 3.8% |
| `get_check_runs` | 364 | 13 | 0 | 3.6% |
| `glob` | 336 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 229 | 0 | 0 | 0% |
| `commit_and_push` | 219 | 10 | 0 | 4.6% |
| `write` | 219 | 2 | 0 | 0.9% |
| `get_branch` | 213 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 192 | 61 | 0 | 31.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 147 | 3 | 0 | 2% |
| `search_issues` | 140 | 0 | 3 | 0% |
| `request_close_issue` | 117 | 1 | 0 | 0.9% |
| `load_skill` | 109 | 9 | 0 | 8.3% |
| `get_pr_reviews` | 96 | 0 | 0 | 0% |
| `merge_pr` | 75 | 0 | 0 | 0% |
| `list_pr_review_comments` | 71 | 0 | 0 | 0% |
| `list_prs` | 69 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_code` | 58 | 0 | 0 | 0% |
| `search_remote_code` | 48 | 17 | 0 | 35.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 36 | 1 | 0 | 2.8% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `delegate_readonly` | 32 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 18 | 0 | 0 | 0% |
| `sync_branch` | 16 | 7 | 0 | 43.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `delegate_readonly_large` | 9 | 0 | 3 | 0% |
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
| `other` | 7,160 | 80% |
| `edit` | 729 | 8.1% |
| `search` | 541 | 6% |
| `open` | 273 | 3.1% |
| `verify` | 247 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 75.5% |
| `writing/japanese` | 33 | 10.3% |
| `delivery/pipeline-setup` | 10 | 3.1% |
| `research/web-search` | 10 | 3.1% |
| `engineering/environment` | 7 | 2.2% |
| `conventions` | 6 | 1.9% |
| `engineering/secrets-in-a-check` | 6 | 1.9% |
| `docs/customer-doc` | 3 | 0.9% |
| `japanese` | 2 | 0.6% |
| `docs/design-doc` | 1 | 0.3% |

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
- `on-demand-audit`
- `pipeline-setup`
- `secrets-in-a-check`
- `web-search`
