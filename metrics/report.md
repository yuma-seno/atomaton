# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-13.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 147 | 13.6% | 409 | 4,065 | 18 | 24.8 |
| Last 30 days | 667 | 7% | 255 | 9,859 | 14 | 18.9 |
| Last year | 732 | 7% | 278 | 10,246 | 15 | 20.6 |
| All time | 732 | 7% | 278 | 10,246 | 15 | 20.6 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 681 |
| `failed` | 40 |
| `stopped` | 11 |

## Last 7 days

46 sessions.

**Ran to an end without a report:** 5 of 45 sessions whose last run the core recorded as `completed` — 11.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**215,439,830 tokens** over 68 runs that reported them, **97.6% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,550,158 | 8,779,638 | 20,308,488 | 20,308,488 | 215,439,830 |
| messages per session | 242 | 374 | 439 | 439 | 10,472 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 19 | 41.3% |
| `engineer` | 18 | 39.1% |
| `atomaton` | 9 | 19.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,246 | 50 | 29 | 2.2% |
| `read` | 1,037 | 4 | 0 | 0.4% |
| `grep` | 1,021 | 24 | 9 | 2.4% |
| `edit` | 340 | 8 | 0 | 2.4% |
| `fetch` | 302 | 17 | 0 | 5.6% |
| `get_pr` | 68 | 0 | 0 | 0% |
| `write` | 66 | 0 | 0 | 0% |
| `glob` | 65 | 0 | 0 | 0% |
| `get_check_runs` | 60 | 0 | 0 | 0% |
| `list` | 59 | 2 | 0 | 3.4% |
| `get_issue_comments` | 50 | 0 | 0 | 0% |
| `commit_and_push` | 45 | 1 | 0 | 2.2% |
| `get_issue` | 45 | 1 | 0 | 2.2% |
| `load_skill` | 45 | 1 | 0 | 2.2% |
| `check_merge_readiness` | 34 | 0 | 0 | 0% |
| `create_pr` | 34 | 13 | 0 | 38.2% |
| `get_branch` | 22 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `get_pr_reviews` | 20 | 0 | 0 | 0% |
| `get_pr_diff` | 19 | 0 | 0 | 0% |
| `list_pr_review_comments` | 16 | 0 | 0 | 0% |
| `request_close_issue` | 15 | 0 | 0 | 0% |
| `search_issues` | 12 | 0 | 0 | 0% |
| `search_remote_code` | 11 | 3 | 0 | 27.3% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `list_prs` | 8 | 0 | 0 | 0% |
| `delegate` | 5 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 4 | 1 | 0 | 25% |
| `create_root_issue` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `delegate_readonly` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `sync_branch` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,924 | 85.7% |
| `edit` | 195 | 8.7% |
| `open` | 64 | 2.8% |
| `search` | 58 | 2.6% |
| `verify` | 5 | 0.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 28 | 57.1% |
| `writing/japanese` | 16 | 32.7% |
| `research/web-search` | 3 | 6.1% |
| `engineering/secrets-in-a-check` | 2 | 4.1% |

## Last 30 days

246 sessions.

**Ran to an end without a report:** 41 of 236 sessions whose last run the core recorded as `completed` — 17.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**764,268,684 tokens** over 330 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,221,174 | 5,707,358 | 20,308,488 | 39,097,860 | 764,268,684 |
| messages per session | 120 | 327 | 463 | 731 | 38,947 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 105 | 42.7% |
| `engineer` | 80 | 32.5% |
| `atomaton` | 61 | 24.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,822 | 132 | 94 | 1.9% |
| `read` | 4,631 | 21 | 4 | 0.5% |
| `grep` | 3,588 | 96 | 11 | 2.7% |
| `edit` | 1,871 | 34 | 0 | 1.8% |
| `fetch` | 781 | 59 | 0 | 7.6% |
| `get_issue` | 306 | 14 | 5 | 4.6% |
| `get_check_runs` | 293 | 10 | 0 | 3.4% |
| `get_pr` | 292 | 5 | 3 | 1.7% |
| `get_issue_comments` | 275 | 0 | 2 | 0% |
| `glob` | 238 | 1 | 0 | 0.4% |
| `list` | 229 | 4 | 0 | 1.7% |
| `check_merge_readiness` | 179 | 0 | 0 | 0% |
| `commit_and_push` | 178 | 7 | 0 | 3.9% |
| `atoma_builtin__load_skill` | 164 | 1 | 0 | 0.6% |
| `create_pr` | 155 | 51 | 0 | 32.9% |
| `get_branch` | 151 | 0 | 0 | 0% |
| `write` | 143 | 2 | 0 | 1.4% |
| `get_pr_diff` | 119 | 2 | 0 | 1.7% |
| `search_issues` | 101 | 0 | 1 | 0% |
| `request_close_issue` | 93 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 65 | 0 | 0 | 0% |
| `merge_pr` | 58 | 0 | 0 | 0% |
| `load_skill` | 53 | 9 | 0 | 17% |
| `list_pr_review_comments` | 49 | 0 | 0 | 0% |
| `list_prs` | 46 | 0 | 0 | 0% |
| `search_code` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 38 | 11 | 0 | 28.9% |
| `create_root_issue` | 32 | 1 | 0 | 3.1% |
| `delegate` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `list_issues` | 12 | 0 | 0 | 0% |
| `sync_branch` | 11 | 6 | 0 | 54.5% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `delegate_large` | 6 | 0 | 0 | 0% |
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
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,461 | 80% |
| `edit` | 527 | 7.7% |
| `search` | 428 | 6.3% |
| `verify` | 213 | 3.1% |
| `open` | 193 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 183 | 84.3% |
| `writing/japanese` | 16 | 7.4% |
| `delivery/pipeline-setup` | 5 | 2.3% |
| `research/web-search` | 5 | 2.3% |
| `engineering/secrets-in-a-check` | 4 | 1.8% |
| `docs/customer-doc` | 3 | 1.4% |
| `engineering/environment` | 1 | 0.5% |

## Last year

282 sessions.

**Ran to an end without a report:** 52 of 271 sessions whose last run the core recorded as `completed` — 19.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,033,672,089 tokens** over 365 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,337,902 | 6,099,372 | 28,119,706 | 73,718,100 | 1,033,672,089 |
| messages per session | 135 | 341 | 705 | 731 | 47,860 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 115 | 40.8% |
| `engineer` | 91 | 32.3% |
| `atomaton` | 76 | 27% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,671 | 156 | 119 | 2% |
| `read` | 5,680 | 28 | 8 | 0.5% |
| `grep` | 4,280 | 108 | 18 | 2.5% |
| `edit` | 2,083 | 35 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 883 | 62 | 0 | 7% |
| `get_issue` | 345 | 14 | 5 | 4.1% |
| `list` | 334 | 5 | 0 | 1.5% |
| `get_issue_comments` | 328 | 0 | 10 | 0% |
| `get_pr` | 326 | 9 | 3 | 2.8% |
| `get_check_runs` | 322 | 12 | 0 | 3.7% |
| `glob` | 283 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 193 | 0 | 0 | 0% |
| `write` | 193 | 2 | 0 | 1% |
| `get_branch` | 190 | 0 | 0 | 0% |
| `commit_and_push` | 187 | 9 | 0 | 4.8% |
| `create_pr` | 164 | 54 | 0 | 32.9% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 131 | 3 | 0 | 2.3% |
| `search_issues` | 125 | 0 | 3 | 0% |
| `request_close_issue` | 97 | 1 | 0 | 1% |
| `get_pr_reviews` | 73 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 62 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 56 | 0 | 0 | 0% |
| `load_skill` | 53 | 9 | 0 | 17% |
| `search_code` | 47 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 32 | 1 | 0 | 3.1% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 28 | 0 | 0 | 0% |
| `delegate_readonly` | 27 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
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
| `publish_draft` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
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
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 6,084 | 79.3% |
| `edit` | 607 | 7.9% |
| `search` | 504 | 6.6% |
| `open` | 239 | 3.1% |
| `verify` | 237 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 214 | 81.4% |
| `writing/japanese` | 16 | 6.1% |
| `delivery/pipeline-setup` | 10 | 3.8% |
| `engineering/environment` | 7 | 2.7% |
| `engineering/secrets-in-a-check` | 6 | 2.3% |
| `research/web-search` | 6 | 2.3% |
| `docs/customer-doc` | 3 | 1.1% |
| `docs/design-doc` | 1 | 0.4% |

## All time

298 sessions.

**Ran to an end without a report:** 52 of 271 sessions whose last run the core recorded as `completed` — 19.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 16 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,033,672,089 tokens** over 365 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,337,902 | 6,099,372 | 28,119,706 | 73,718,100 | 1,033,672,089 |
| messages per session | 120 | 339 | 705 | 731 | 47,947 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 119 | 39.9% |
| `engineer` | 100 | 33.6% |
| `atomaton` | 79 | 26.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,671 | 156 | 119 | 2% |
| `read` | 5,680 | 28 | 8 | 0.5% |
| `grep` | 4,280 | 108 | 18 | 2.5% |
| `edit` | 2,083 | 35 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 883 | 62 | 0 | 7% |
| `get_issue` | 345 | 14 | 5 | 4.1% |
| `list` | 334 | 5 | 0 | 1.5% |
| `get_issue_comments` | 328 | 0 | 10 | 0% |
| `get_pr` | 326 | 9 | 3 | 2.8% |
| `get_check_runs` | 322 | 12 | 0 | 3.7% |
| `glob` | 283 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 193 | 0 | 0 | 0% |
| `write` | 193 | 2 | 0 | 1% |
| `get_branch` | 190 | 0 | 0 | 0% |
| `commit_and_push` | 187 | 9 | 0 | 4.8% |
| `create_pr` | 164 | 54 | 0 | 32.9% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 131 | 3 | 0 | 2.3% |
| `search_issues` | 125 | 0 | 3 | 0% |
| `request_close_issue` | 97 | 1 | 0 | 1% |
| `get_pr_reviews` | 73 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 62 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 56 | 0 | 0 | 0% |
| `load_skill` | 53 | 9 | 0 | 17% |
| `search_code` | 47 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 32 | 1 | 0 | 3.1% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 28 | 0 | 0 | 0% |
| `delegate_readonly` | 27 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
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
| `publish_draft` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
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
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 6,084 | 79.3% |
| `edit` | 607 | 7.9% |
| `search` | 504 | 6.6% |
| `open` | 239 | 3.1% |
| `verify` | 237 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 214 | 81.4% |
| `writing/japanese` | 16 | 6.1% |
| `delivery/pipeline-setup` | 10 | 3.8% |
| `engineering/environment` | 7 | 2.7% |
| `engineering/secrets-in-a-check` | 6 | 2.3% |
| `research/web-search` | 6 | 2.3% |
| `docs/customer-doc` | 3 | 1.1% |
| `docs/design-doc` | 1 | 0.4% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-13 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/agent-prompt-surface`
- `security/atomaton-surface`
- `security/gh-actions-surface`
- `security/on-demand-audit`
