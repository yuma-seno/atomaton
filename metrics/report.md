# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-12.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 112 | 4.5% | 499 | 6,099 | 23 | 21.2 |
| Last 30 days | 613 | 5.1% | 244 | 9,859 | 13 | 18.3 |
| Last year | 671 | 5.2% | 257 | 10,246 | 15 | 19.2 |
| All time | 671 | 5.2% | 257 | 10,246 | 15 | 19.2 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 636 |
| `failed` | 24 |
| `stopped` | 11 |

## Last 7 days

45 sessions.

**Ran to an end without a report:** 7 of 43 sessions whose last run the core recorded as `completed` — 16.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**249,754,424 tokens** over 61 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,895,877 | 10,626,209 | 29,805,044 | 29,805,044 | 249,754,424 |
| messages per session | 212 | 374 | 439 | 439 | 9,591 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 20 | 44.4% |
| `reviewer` | 16 | 35.6% |
| `atomaton` | 9 | 20% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,222 | 47 | 30 | 2.1% |
| `read` | 858 | 5 | 0 | 0.6% |
| `grep` | 791 | 22 | 10 | 2.8% |
| `edit` | 402 | 7 | 0 | 1.7% |
| `fetch` | 236 | 13 | 0 | 5.5% |
| `get_check_runs` | 61 | 0 | 0 | 0% |
| `get_pr` | 59 | 0 | 0 | 0% |
| `get_issue_comments` | 53 | 0 | 0 | 0% |
| `glob` | 53 | 0 | 0 | 0% |
| `write` | 53 | 0 | 0 | 0% |
| `list` | 52 | 0 | 0 | 0% |
| `get_issue` | 46 | 1 | 0 | 2.2% |
| `commit_and_push` | 37 | 1 | 0 | 2.7% |
| `load_skill` | 34 | 6 | 0 | 17.6% |
| `check_merge_readiness` | 31 | 0 | 0 | 0% |
| `create_pr` | 24 | 7 | 0 | 29.2% |
| `get_branch` | 23 | 0 | 0 | 0% |
| `get_pr_reviews` | 18 | 0 | 0 | 0% |
| `get_pr_diff` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `search_code` | 15 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 13 | 1 | 0 | 7.7% |
| `request_close_issue` | 13 | 0 | 0 | 0% |
| `search_issues` | 13 | 0 | 0 | 0% |
| `search_remote_code` | 13 | 5 | 0 | 38.5% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `list_prs` | 10 | 0 | 0 | 0% |
| `delegate` | 6 | 0 | 0 | 0% |
| `delegate_large` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `create_root_issue` | 2 | 0 | 0 | 0% |
| `delegate_readonly` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `publish_draft` | 1 | 0 | 0 | 0% |
| `sync_branch` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,996 | 89.8% |
| `edit` | 130 | 5.9% |
| `open` | 47 | 2.1% |
| `search` | 44 | 2% |
| `verify` | 5 | 0.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 33 | 70.2% |
| `writing/japanese` | 6 | 12.8% |
| `delivery/pipeline-setup` | 3 | 6.4% |
| `research/web-search` | 3 | 6.4% |
| `engineering/secrets-in-a-check` | 2 | 4.3% |

## Last 30 days

241 sessions.

**Ran to an end without a report:** 43 of 231 sessions whose last run the core recorded as `completed` — 18.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**711,988,552 tokens** over 316 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,221,174 | 5,175,119 | 20,308,488 | 39,097,860 | 711,988,552 |
| messages per session | 113 | 306 | 463 | 731 | 36,872 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 101 | 41.9% |
| `engineer` | 78 | 32.4% |
| `atomaton` | 62 | 25.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,402 | 122 | 95 | 1.9% |
| `read` | 4,386 | 22 | 4 | 0.5% |
| `grep` | 3,323 | 92 | 14 | 2.8% |
| `edit` | 1,844 | 33 | 0 | 1.8% |
| `fetch` | 705 | 56 | 0 | 7.9% |
| `get_issue` | 313 | 14 | 5 | 4.5% |
| `get_issue_comments` | 295 | 0 | 8 | 0% |
| `get_check_runs` | 288 | 10 | 0 | 3.5% |
| `get_pr` | 286 | 6 | 3 | 2.1% |
| `list` | 232 | 2 | 0 | 0.9% |
| `glob` | 225 | 1 | 1 | 0.4% |
| `check_merge_readiness` | 177 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 169 | 1 | 0 | 0.6% |
| `commit_and_push` | 166 | 7 | 0 | 4.2% |
| `get_branch` | 158 | 0 | 0 | 0% |
| `create_pr` | 142 | 44 | 0 | 31% |
| `write` | 132 | 2 | 0 | 1.5% |
| `get_pr_diff` | 115 | 2 | 0 | 1.7% |
| `search_issues` | 104 | 0 | 1 | 0% |
| `request_close_issue` | 89 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 62 | 0 | 0 | 0% |
| `merge_pr` | 58 | 0 | 0 | 0% |
| `list_prs` | 50 | 0 | 0 | 0% |
| `list_pr_review_comments` | 47 | 0 | 0 | 0% |
| `search_remote_code` | 40 | 11 | 0 | 27.5% |
| `search_code` | 39 | 0 | 0 | 0% |
| `load_skill` | 37 | 9 | 0 | 24.3% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `delegate` | 28 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `delegate_readonly` | 23 | 0 | 0 | 0% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `create_issue` | 12 | 3 | 0 | 25% |
| `list_issues` | 12 | 0 | 0 | 0% |
| `sync_branch` | 12 | 7 | 0 | 58.3% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 6 | 0 | 2 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,093 | 79.6% |
| `edit` | 456 | 7.1% |
| `search` | 446 | 7% |
| `verify` | 224 | 3.5% |
| `open` | 183 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 181 | 87.9% |
| `writing/japanese` | 6 | 2.9% |
| `delivery/pipeline-setup` | 5 | 2.4% |
| `research/web-search` | 5 | 2.4% |
| `engineering/secrets-in-a-check` | 4 | 1.9% |
| `docs/customer-doc` | 3 | 1.5% |
| `docs/design-doc` | 1 | 0.5% |
| `engineering/environment` | 1 | 0.5% |

## Last year

272 sessions.

**Ran to an end without a report:** 52 of 261 sessions whose last run the core recorded as `completed` — 19.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**967,266,372 tokens** over 347 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,337,902 | 5,781,615 | 28,119,706 | 73,718,100 | 967,266,372 |
| messages per session | 123 | 331 | 705 | 731 | 45,047 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 109 | 40.1% |
| `engineer` | 88 | 32.4% |
| `atomaton` | 75 | 27.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,172 | 146 | 114 | 2% |
| `read` | 5,329 | 28 | 8 | 0.5% |
| `grep` | 3,926 | 103 | 18 | 2.6% |
| `edit` | 2,039 | 34 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 778 | 58 | 0 | 7.5% |
| `get_issue` | 337 | 14 | 5 | 4.2% |
| `list` | 326 | 3 | 0 | 0.9% |
| `get_issue_comments` | 324 | 0 | 10 | 0% |
| `get_pr` | 309 | 9 | 3 | 2.9% |
| `get_check_runs` | 307 | 12 | 0 | 3.9% |
| `glob` | 264 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 188 | 0 | 0 | 0% |
| `check_merge_readiness` | 186 | 0 | 0 | 0% |
| `write` | 180 | 2 | 0 | 1.1% |
| `commit_and_push` | 173 | 9 | 0 | 5.2% |
| `create_pr` | 148 | 46 | 0 | 31.1% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `search_issues` | 125 | 0 | 3 | 0% |
| `get_pr_diff` | 124 | 3 | 0 | 2.4% |
| `request_close_issue` | 92 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 68 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 61 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_code` | 41 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `load_skill` | 37 | 9 | 0 | 24.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,689 | 79.3% |
| `edit` | 534 | 7.4% |
| `search` | 490 | 6.8% |
| `verify` | 237 | 3.3% |
| `open` | 222 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 208 | 84.2% |
| `delivery/pipeline-setup` | 10 | 4% |
| `engineering/environment` | 7 | 2.8% |
| `engineering/secrets-in-a-check` | 6 | 2.4% |
| `research/web-search` | 6 | 2.4% |
| `writing/japanese` | 6 | 2.4% |
| `docs/customer-doc` | 3 | 1.2% |
| `docs/design-doc` | 1 | 0.4% |

## All time

287 sessions.

**Ran to an end without a report:** 52 of 261 sessions whose last run the core recorded as `completed` — 19.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 15 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**967,266,372 tokens** over 347 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,337,902 | 5,781,615 | 28,119,706 | 73,718,100 | 967,266,372 |
| messages per session | 114 | 330 | 705 | 731 | 45,125 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 113 | 39.4% |
| `engineer` | 96 | 33.4% |
| `atomaton` | 78 | 27.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,172 | 146 | 114 | 2% |
| `read` | 5,329 | 28 | 8 | 0.5% |
| `grep` | 3,926 | 103 | 18 | 2.6% |
| `edit` | 2,039 | 34 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 778 | 58 | 0 | 7.5% |
| `get_issue` | 337 | 14 | 5 | 4.2% |
| `list` | 326 | 3 | 0 | 0.9% |
| `get_issue_comments` | 324 | 0 | 10 | 0% |
| `get_pr` | 309 | 9 | 3 | 2.9% |
| `get_check_runs` | 307 | 12 | 0 | 3.9% |
| `glob` | 264 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 188 | 0 | 0 | 0% |
| `check_merge_readiness` | 186 | 0 | 0 | 0% |
| `write` | 180 | 2 | 0 | 1.1% |
| `commit_and_push` | 173 | 9 | 0 | 5.2% |
| `create_pr` | 148 | 46 | 0 | 31.1% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `search_issues` | 125 | 0 | 3 | 0% |
| `get_pr_diff` | 124 | 3 | 0 | 2.4% |
| `request_close_issue` | 92 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 68 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 61 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_code` | 41 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `load_skill` | 37 | 9 | 0 | 24.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,689 | 79.3% |
| `edit` | 534 | 7.4% |
| `search` | 490 | 6.8% |
| `verify` | 237 | 3.3% |
| `open` | 222 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 208 | 84.2% |
| `delivery/pipeline-setup` | 10 | 4% |
| `engineering/environment` | 7 | 2.8% |
| `engineering/secrets-in-a-check` | 6 | 2.4% |
| `research/web-search` | 6 | 2.4% |
| `writing/japanese` | 6 | 2.4% |
| `docs/customer-doc` | 3 | 1.2% |
| `docs/design-doc` | 1 | 0.4% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-12 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/agent-prompt-surface`
- `security/atomaton-surface`
- `security/gh-actions-surface`
- `security/on-demand-audit`
