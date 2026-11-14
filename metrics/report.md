# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-14.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 126 | 16.7% | 410 | 3,691 | 17 | 31.7 |
| Last 30 days | 688 | 7.1% | 257 | 9,859 | 14 | 19.0 |
| Last year | 753 | 7% | 283 | 10,246 | 15 | 20.6 |
| All time | 753 | 7% | 283 | 10,246 | 15 | 20.6 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 700 |
| `failed` | 42 |
| `stopped` | 11 |

## Last 7 days

38 sessions.

**Ran to an end without a report:** 4 of 37 sessions whose last run the core recorded as `completed` — 10.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**155,681,858 tokens** over 58 runs that reported them, **97.3% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.4% of that prompt was served from cache**, over the 57 of 58 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,291,903 | 8,209,387 | 13,863,651 | 13,863,651 | 155,681,858 |
| messages per session | 183 | 347 | 374 | 374 | 7,415 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 17 | 44.7% |
| `atomaton` | 10 | 26.3% |
| `engineer` | 10 | 26.3% |
| `architect` | 1 | 2.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,309 | 25 | 17 | 1.9% |
| `grep` | 967 | 14 | 10 | 1.4% |
| `read` | 863 | 5 | 0 | 0.6% |
| `fetch` | 254 | 40 | 0 | 15.7% |
| `edit` | 183 | 5 | 0 | 2.7% |
| `glob` | 68 | 0 | 0 | 0% |
| `list` | 68 | 2 | 0 | 2.9% |
| `load_skill` | 52 | 0 | 0 | 0% |
| `get_check_runs` | 45 | 0 | 0 | 0% |
| `get_pr` | 42 | 0 | 0 | 0% |
| `write` | 39 | 0 | 0 | 0% |
| `get_issue_comments` | 35 | 0 | 0 | 0% |
| `check_merge_readiness` | 30 | 0 | 0 | 0% |
| `get_issue` | 30 | 1 | 0 | 3.3% |
| `commit_and_push` | 27 | 1 | 0 | 3.7% |
| `create_pr` | 25 | 10 | 0 | 40% |
| `search_code` | 20 | 0 | 0 | 0% |
| `get_pr_diff` | 16 | 0 | 0 | 0% |
| `get_pr_reviews` | 16 | 0 | 0 | 0% |
| `get_branch` | 13 | 0 | 0 | 0% |
| `list_pr_review_comments` | 13 | 0 | 0 | 0% |
| `request_close_issue` | 12 | 0 | 0 | 0% |
| `search_issues` | 10 | 0 | 0 | 0% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `list_prs` | 4 | 0 | 0 | 0% |
| `create_root_issue` | 3 | 0 | 0 | 0% |
| `delegate` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 1 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `delegate_readonly` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,073 | 82% |
| `edit` | 133 | 10.2% |
| `search` | 50 | 3.8% |
| `open` | 47 | 3.6% |
| `verify` | 6 | 0.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `writing/japanese` | 24 | 45.3% |
| `project/conventions` | 23 | 43.4% |
| `research/web-search` | 5 | 9.4% |
| `engineering/secrets-in-a-check` | 1 | 1.9% |

## Last 30 days

255 sessions.

**Ran to an end without a report:** 42 of 245 sessions whose last run the core recorded as `completed` — 17.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**809,617,614 tokens** over 344 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the 343 of 344 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,224,669 | 5,781,615 | 20,308,488 | 39,097,860 | 809,617,614 |
| messages per session | 120 | 327 | 463 | 731 | 40,339 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 110 | 43.1% |
| `engineer` | 81 | 31.8% |
| `atomaton` | 63 | 24.7% |
| `architect` | 1 | 0.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,904 | 136 | 94 | 2% |
| `read` | 4,844 | 23 | 4 | 0.5% |
| `grep` | 3,894 | 98 | 12 | 2.5% |
| `edit` | 1,892 | 34 | 0 | 1.8% |
| `fetch` | 869 | 91 | 0 | 10.5% |
| `get_issue` | 311 | 14 | 5 | 4.5% |
| `get_pr` | 300 | 5 | 3 | 1.7% |
| `get_check_runs` | 298 | 10 | 0 | 3.4% |
| `get_issue_comments` | 286 | 0 | 2 | 0% |
| `glob` | 254 | 1 | 0 | 0.4% |
| `list` | 245 | 4 | 0 | 1.6% |
| `check_merge_readiness` | 186 | 0 | 0 | 0% |
| `commit_and_push` | 180 | 7 | 0 | 3.9% |
| `atoma_builtin__load_skill` | 164 | 1 | 0 | 0.6% |
| `create_pr` | 156 | 52 | 0 | 33.3% |
| `get_branch` | 155 | 0 | 0 | 0% |
| `write` | 146 | 2 | 0 | 1.4% |
| `get_pr_diff` | 123 | 2 | 0 | 1.6% |
| `search_issues` | 105 | 0 | 1 | 0% |
| `request_close_issue` | 94 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 70 | 0 | 0 | 0% |
| `load_skill` | 68 | 9 | 0 | 13.2% |
| `merge_pr` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 52 | 0 | 0 | 0% |
| `list_prs` | 50 | 0 | 0 | 0% |
| `search_code` | 46 | 0 | 0 | 0% |
| `search_remote_code` | 38 | 11 | 0 | 28.9% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `delegate` | 28 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `list_issues` | 13 | 0 | 0 | 0% |
| `sync_branch` | 11 | 6 | 0 | 54.5% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `create_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,532 | 80.1% |
| `edit` | 537 | 7.8% |
| `search` | 428 | 6.2% |
| `verify` | 214 | 3.1% |
| `open` | 193 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 188 | 81% |
| `writing/japanese` | 24 | 10.3% |
| `research/web-search` | 7 | 3% |
| `delivery/pipeline-setup` | 5 | 2.2% |
| `engineering/secrets-in-a-check` | 4 | 1.7% |
| `docs/customer-doc` | 3 | 1.3% |
| `engineering/environment` | 1 | 0.4% |

## Last year

291 sessions.

**Ran to an end without a report:** 53 of 280 sessions whose last run the core recorded as `completed` — 18.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,079,021,019 tokens** over 379 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the 378 of 379 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,337,902 | 6,183,128 | 28,119,706 | 73,718,100 | 1,079,021,019 |
| messages per session | 135 | 339 | 705 | 731 | 49,252 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 120 | 41.2% |
| `engineer` | 92 | 31.6% |
| `atomaton` | 78 | 26.8% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,753 | 160 | 119 | 2.1% |
| `read` | 5,893 | 30 | 8 | 0.5% |
| `grep` | 4,586 | 110 | 19 | 2.4% |
| `edit` | 2,104 | 35 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 971 | 94 | 0 | 9.7% |
| `get_issue` | 350 | 14 | 5 | 4% |
| `list` | 350 | 5 | 0 | 1.4% |
| `get_issue_comments` | 339 | 0 | 10 | 0% |
| `get_pr` | 334 | 9 | 3 | 2.7% |
| `get_check_runs` | 327 | 12 | 0 | 3.7% |
| `glob` | 299 | 1 | 1 | 0.3% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 200 | 0 | 0 | 0% |
| `write` | 196 | 2 | 0 | 1% |
| `get_branch` | 194 | 0 | 0 | 0% |
| `commit_and_push` | 189 | 9 | 0 | 4.8% |
| `create_pr` | 165 | 55 | 0 | 33.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 135 | 3 | 0 | 2.2% |
| `search_issues` | 129 | 0 | 3 | 0% |
| `request_close_issue` | 98 | 1 | 0 | 1% |
| `get_pr_reviews` | 78 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `load_skill` | 68 | 9 | 0 | 13.2% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 63 | 0 | 0 | 0% |
| `merge_pr` | 63 | 0 | 0 | 0% |
| `list_pr_review_comments` | 59 | 0 | 0 | 0% |
| `search_code` | 50 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `delegate_readonly` | 27 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
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
| `other` | 6,155 | 79.4% |
| `edit` | 617 | 8% |
| `search` | 504 | 6.5% |
| `open` | 239 | 3.1% |
| `verify` | 238 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 219 | 78.8% |
| `writing/japanese` | 24 | 8.6% |
| `delivery/pipeline-setup` | 10 | 3.6% |
| `research/web-search` | 8 | 2.9% |
| `engineering/environment` | 7 | 2.5% |
| `engineering/secrets-in-a-check` | 6 | 2.2% |
| `docs/customer-doc` | 3 | 1.1% |
| `docs/design-doc` | 1 | 0.4% |

## All time

308 sessions.

**Ran to an end without a report:** 53 of 280 sessions whose last run the core recorded as `completed` — 18.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 17 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,079,021,019 tokens** over 379 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the 378 of 379 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,337,902 | 6,183,128 | 28,119,706 | 73,718,100 | 1,079,021,019 |
| messages per session | 120 | 334 | 583 | 731 | 49,343 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 125 | 40.6% |
| `engineer` | 101 | 32.8% |
| `atomaton` | 81 | 26.3% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,753 | 160 | 119 | 2.1% |
| `read` | 5,893 | 30 | 8 | 0.5% |
| `grep` | 4,586 | 110 | 19 | 2.4% |
| `edit` | 2,104 | 35 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 971 | 94 | 0 | 9.7% |
| `get_issue` | 350 | 14 | 5 | 4% |
| `list` | 350 | 5 | 0 | 1.4% |
| `get_issue_comments` | 339 | 0 | 10 | 0% |
| `get_pr` | 334 | 9 | 3 | 2.7% |
| `get_check_runs` | 327 | 12 | 0 | 3.7% |
| `glob` | 299 | 1 | 1 | 0.3% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 200 | 0 | 0 | 0% |
| `write` | 196 | 2 | 0 | 1% |
| `get_branch` | 194 | 0 | 0 | 0% |
| `commit_and_push` | 189 | 9 | 0 | 4.8% |
| `create_pr` | 165 | 55 | 0 | 33.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 135 | 3 | 0 | 2.2% |
| `search_issues` | 129 | 0 | 3 | 0% |
| `request_close_issue` | 98 | 1 | 0 | 1% |
| `get_pr_reviews` | 78 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `load_skill` | 68 | 9 | 0 | 13.2% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 63 | 0 | 0 | 0% |
| `merge_pr` | 63 | 0 | 0 | 0% |
| `list_pr_review_comments` | 59 | 0 | 0 | 0% |
| `search_code` | 50 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `delegate_readonly` | 27 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
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
| `other` | 6,155 | 79.4% |
| `edit` | 617 | 8% |
| `search` | 504 | 6.5% |
| `open` | 239 | 3.1% |
| `verify` | 238 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 219 | 78.8% |
| `writing/japanese` | 24 | 8.6% |
| `delivery/pipeline-setup` | 10 | 3.6% |
| `research/web-search` | 8 | 2.9% |
| `engineering/environment` | 7 | 2.5% |
| `engineering/secrets-in-a-check` | 6 | 2.2% |
| `docs/customer-doc` | 3 | 1.1% |
| `docs/design-doc` | 1 | 0.4% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-14 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/agent-prompt-surface`
- `security/atomaton-surface`
- `security/gh-actions-surface`
- `security/on-demand-audit`
