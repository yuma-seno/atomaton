# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-14.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 121 | 16.5% | 426 | 3,691 | 18 | 31.7 |
| Last 30 days | 676 | 7% | 257 | 9,859 | 14 | 19.0 |
| Last year | 741 | 6.9% | 283 | 10,246 | 15 | 20.6 |
| All time | 741 | 6.9% | 283 | 10,246 | 15 | 20.6 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 690 |
| `failed` | 40 |
| `stopped` | 11 |

## Last 7 days

35 sessions.

**Ran to an end without a report:** 3 of 34 sessions whose last run the core recorded as `completed` — 8.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**136,108,593 tokens** over 53 runs that reported them, **97.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.4% of that prompt was served from cache**, over the 52 of 53 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,309,906 | 6,808,572 | 12,553,063 | 12,553,063 | 136,108,593 |
| messages per session | 188 | 366 | 439 | 439 | 7,340 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 15 | 42.9% |
| `engineer` | 11 | 31.4% |
| `atomaton` | 9 | 25.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,449 | 30 | 20 | 2.1% |
| `read` | 815 | 4 | 0 | 0.5% |
| `grep` | 808 | 14 | 10 | 1.7% |
| `fetch` | 230 | 12 | 0 | 5.2% |
| `edit` | 207 | 5 | 0 | 2.4% |
| `list` | 63 | 2 | 0 | 3.2% |
| `get_pr` | 57 | 0 | 0 | 0% |
| `glob` | 57 | 0 | 0 | 0% |
| `get_check_runs` | 48 | 0 | 0 | 0% |
| `load_skill` | 45 | 0 | 0 | 0% |
| `write` | 38 | 0 | 0 | 0% |
| `get_issue` | 36 | 1 | 0 | 2.8% |
| `get_issue_comments` | 30 | 0 | 0 | 0% |
| `check_merge_readiness` | 29 | 0 | 0 | 0% |
| `commit_and_push` | 29 | 1 | 0 | 3.4% |
| `create_pr` | 28 | 11 | 0 | 39.3% |
| `search_code` | 19 | 0 | 0 | 0% |
| `get_pr_diff` | 17 | 0 | 0 | 0% |
| `get_pr_reviews` | 16 | 0 | 0 | 0% |
| `get_branch` | 14 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `request_close_issue` | 13 | 0 | 0 | 0% |
| `search_issues` | 9 | 0 | 0 | 0% |
| `merge_pr` | 8 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `list_prs` | 4 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `create_root_issue` | 2 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 1 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `delegate_readonly` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,203 | 83% |
| `edit` | 144 | 9.9% |
| `search` | 50 | 3.5% |
| `open` | 47 | 3.2% |
| `verify` | 5 | 0.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 21 | 45.7% |
| `writing/japanese` | 20 | 43.5% |
| `research/web-search` | 4 | 8.7% |
| `engineering/secrets-in-a-check` | 1 | 2.2% |

## Last 30 days

250 sessions.

**Ran to an end without a report:** 41 of 240 sessions whose last run the core recorded as `completed` — 17.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**778,217,854 tokens** over 335 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the 334 of 335 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,221,174 | 5,707,358 | 20,308,488 | 39,097,860 | 778,217,854 |
| messages per session | 120 | 327 | 463 | 731 | 39,613 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 107 | 42.8% |
| `engineer` | 81 | 32.4% |
| `atomaton` | 62 | 24.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,902 | 136 | 94 | 2% |
| `read` | 4,747 | 22 | 4 | 0.5% |
| `grep` | 3,697 | 97 | 12 | 2.6% |
| `edit` | 1,887 | 34 | 0 | 1.8% |
| `fetch` | 803 | 62 | 0 | 7.7% |
| `get_issue` | 311 | 14 | 5 | 4.5% |
| `get_check_runs` | 296 | 10 | 0 | 3.4% |
| `get_pr` | 296 | 5 | 3 | 1.7% |
| `get_issue_comments` | 281 | 0 | 2 | 0% |
| `glob` | 240 | 1 | 0 | 0.4% |
| `list` | 239 | 4 | 0 | 1.7% |
| `check_merge_readiness` | 182 | 0 | 0 | 0% |
| `commit_and_push` | 179 | 7 | 0 | 3.9% |
| `atoma_builtin__load_skill` | 164 | 1 | 0 | 0.6% |
| `create_pr` | 156 | 52 | 0 | 33.3% |
| `get_branch` | 153 | 0 | 0 | 0% |
| `write` | 144 | 2 | 0 | 1.4% |
| `get_pr_diff` | 122 | 2 | 0 | 1.6% |
| `search_issues` | 102 | 0 | 1 | 0% |
| `request_close_issue` | 94 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 68 | 0 | 0 | 0% |
| `load_skill` | 60 | 9 | 0 | 15% |
| `merge_pr` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 51 | 0 | 0 | 0% |
| `list_prs` | 47 | 0 | 0 | 0% |
| `search_code` | 45 | 0 | 0 | 0% |
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
| `other` | 5,531 | 80.1% |
| `edit` | 537 | 7.8% |
| `search` | 428 | 6.2% |
| `verify` | 213 | 3.1% |
| `open` | 193 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 185 | 82.6% |
| `writing/japanese` | 20 | 8.9% |
| `research/web-search` | 6 | 2.7% |
| `delivery/pipeline-setup` | 5 | 2.2% |
| `engineering/secrets-in-a-check` | 4 | 1.8% |
| `docs/customer-doc` | 3 | 1.3% |
| `engineering/environment` | 1 | 0.4% |

## Last year

286 sessions.

**Ran to an end without a report:** 52 of 275 sessions whose last run the core recorded as `completed` — 18.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,047,621,259 tokens** over 370 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the 369 of 370 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 6,181,709 | 28,119,706 | 73,718,100 | 1,047,621,259 |
| messages per session | 135 | 341 | 705 | 731 | 48,526 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 117 | 40.9% |
| `engineer` | 92 | 32.2% |
| `atomaton` | 77 | 26.9% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,751 | 160 | 119 | 2.1% |
| `read` | 5,796 | 29 | 8 | 0.5% |
| `grep` | 4,389 | 109 | 19 | 2.5% |
| `edit` | 2,099 | 35 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 905 | 65 | 0 | 7.2% |
| `get_issue` | 350 | 14 | 5 | 4% |
| `list` | 344 | 5 | 0 | 1.5% |
| `get_issue_comments` | 334 | 0 | 10 | 0% |
| `get_pr` | 330 | 9 | 3 | 2.7% |
| `get_check_runs` | 325 | 12 | 0 | 3.7% |
| `glob` | 285 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 196 | 0 | 0 | 0% |
| `write` | 194 | 2 | 0 | 1% |
| `get_branch` | 192 | 0 | 0 | 0% |
| `commit_and_push` | 188 | 9 | 0 | 4.8% |
| `create_pr` | 165 | 55 | 0 | 33.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 134 | 3 | 0 | 2.2% |
| `search_issues` | 126 | 0 | 3 | 0% |
| `request_close_issue` | 98 | 1 | 0 | 1% |
| `get_pr_reviews` | 76 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 63 | 0 | 0 | 0% |
| `list_prs` | 60 | 0 | 0 | 0% |
| `load_skill` | 60 | 9 | 0 | 15% |
| `list_pr_review_comments` | 58 | 0 | 0 | 0% |
| `search_code` | 49 | 0 | 0 | 0% |
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
| `other` | 6,154 | 79.4% |
| `edit` | 617 | 8% |
| `search` | 504 | 6.5% |
| `open` | 239 | 3.1% |
| `verify` | 237 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 216 | 80% |
| `writing/japanese` | 20 | 7.4% |
| `delivery/pipeline-setup` | 10 | 3.7% |
| `engineering/environment` | 7 | 2.6% |
| `research/web-search` | 7 | 2.6% |
| `engineering/secrets-in-a-check` | 6 | 2.2% |
| `docs/customer-doc` | 3 | 1.1% |
| `docs/design-doc` | 1 | 0.4% |

## All time

302 sessions.

**Ran to an end without a report:** 52 of 275 sessions whose last run the core recorded as `completed` — 18.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 16 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,047,621,259 tokens** over 370 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the 369 of 370 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 6,181,709 | 28,119,706 | 73,718,100 | 1,047,621,259 |
| messages per session | 121 | 334 | 583 | 731 | 48,613 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 121 | 40.1% |
| `engineer` | 101 | 33.4% |
| `atomaton` | 80 | 26.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,751 | 160 | 119 | 2.1% |
| `read` | 5,796 | 29 | 8 | 0.5% |
| `grep` | 4,389 | 109 | 19 | 2.5% |
| `edit` | 2,099 | 35 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 905 | 65 | 0 | 7.2% |
| `get_issue` | 350 | 14 | 5 | 4% |
| `list` | 344 | 5 | 0 | 1.5% |
| `get_issue_comments` | 334 | 0 | 10 | 0% |
| `get_pr` | 330 | 9 | 3 | 2.7% |
| `get_check_runs` | 325 | 12 | 0 | 3.7% |
| `glob` | 285 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 196 | 0 | 0 | 0% |
| `write` | 194 | 2 | 0 | 1% |
| `get_branch` | 192 | 0 | 0 | 0% |
| `commit_and_push` | 188 | 9 | 0 | 4.8% |
| `create_pr` | 165 | 55 | 0 | 33.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 134 | 3 | 0 | 2.2% |
| `search_issues` | 126 | 0 | 3 | 0% |
| `request_close_issue` | 98 | 1 | 0 | 1% |
| `get_pr_reviews` | 76 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 63 | 0 | 0 | 0% |
| `list_prs` | 60 | 0 | 0 | 0% |
| `load_skill` | 60 | 9 | 0 | 15% |
| `list_pr_review_comments` | 58 | 0 | 0 | 0% |
| `search_code` | 49 | 0 | 0 | 0% |
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
| `other` | 6,154 | 79.4% |
| `edit` | 617 | 8% |
| `search` | 504 | 6.5% |
| `open` | 239 | 3.1% |
| `verify` | 237 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 216 | 80% |
| `writing/japanese` | 20 | 7.4% |
| `delivery/pipeline-setup` | 10 | 3.7% |
| `engineering/environment` | 7 | 2.6% |
| `research/web-search` | 7 | 2.6% |
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
