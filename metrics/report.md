# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-13.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 162 | 12.3% | 440 | 6,099 | 19 | 26.1 |
| Last 30 days | 664 | 7.1% | 255 | 9,859 | 13 | 18.9 |
| Last year | 729 | 7% | 272 | 10,246 | 15 | 20.4 |
| All time | 729 | 7% | 272 | 10,246 | 15 | 20.4 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 678 |
| `failed` | 40 |
| `stopped` | 11 |

## Last 7 days

49 sessions.

**Ran to an end without a report:** 6 of 48 sessions whose last run the core recorded as `completed` — 12.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**290,435,068 tokens** over 74 runs that reported them, **97.6% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,895,877 | 10,626,209 | 29,805,044 | 29,805,044 | 290,435,068 |
| messages per session | 242 | 374 | 439 | 439 | 11,324 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 20 | 40.8% |
| `reviewer` | 19 | 38.8% |
| `atomaton` | 10 | 20.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,504 | 52 | 34 | 2.1% |
| `grep` | 1,065 | 26 | 10 | 2.4% |
| `read` | 1,059 | 4 | 0 | 0.4% |
| `edit` | 405 | 7 | 0 | 1.7% |
| `fetch` | 311 | 14 | 0 | 4.5% |
| `get_check_runs` | 72 | 0 | 0 | 0% |
| `get_pr` | 71 | 0 | 0 | 0% |
| `glob` | 66 | 0 | 0 | 0% |
| `write` | 60 | 0 | 0 | 0% |
| `list` | 59 | 2 | 0 | 3.4% |
| `get_issue_comments` | 54 | 0 | 0 | 0% |
| `get_issue` | 53 | 1 | 0 | 1.9% |
| `commit_and_push` | 47 | 1 | 0 | 2.1% |
| `load_skill` | 45 | 3 | 0 | 6.7% |
| `check_merge_readiness` | 36 | 0 | 0 | 0% |
| `create_pr` | 34 | 12 | 0 | 35.3% |
| `get_branch` | 25 | 0 | 0 | 0% |
| `get_pr_reviews` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `get_pr_diff` | 20 | 0 | 0 | 0% |
| `list_pr_review_comments` | 18 | 0 | 0 | 0% |
| `request_close_issue` | 16 | 0 | 0 | 0% |
| `search_issues` | 13 | 0 | 0 | 0% |
| `search_remote_code` | 13 | 5 | 0 | 38.5% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `list_prs` | 10 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 8 | 1 | 0 | 12.5% |
| `delegate` | 6 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `create_root_issue` | 4 | 0 | 0 | 0% |
| `delegate_large` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `delegate_readonly` | 1 | 0 | 0 | 0% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `sync_branch` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 2,189 | 87.4% |
| `edit` | 188 | 7.5% |
| `open` | 64 | 2.6% |
| `search` | 58 | 2.3% |
| `verify` | 5 | 0.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 33 | 62.3% |
| `writing/japanese` | 15 | 28.3% |
| `research/web-search` | 3 | 5.7% |
| `engineering/secrets-in-a-check` | 2 | 3.8% |

## Last 30 days

244 sessions.

**Ran to an end without a report:** 41 of 234 sessions whose last run the core recorded as `completed` — 17.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**745,298,033 tokens** over 328 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,211,508 | 5,255,408 | 20,308,488 | 39,097,860 | 745,298,033 |
| messages per session | 117 | 327 | 463 | 731 | 38,404 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 104 | 42.6% |
| `engineer` | 79 | 32.4% |
| `atomaton` | 61 | 25% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,710 | 128 | 94 | 1.9% |
| `read` | 4,551 | 21 | 4 | 0.5% |
| `grep` | 3,554 | 96 | 11 | 2.7% |
| `edit` | 1,839 | 33 | 0 | 1.8% |
| `fetch` | 763 | 56 | 0 | 7.3% |
| `get_issue` | 306 | 14 | 5 | 4.6% |
| `get_check_runs` | 292 | 10 | 0 | 3.4% |
| `get_pr` | 291 | 5 | 3 | 1.7% |
| `get_issue_comments` | 274 | 0 | 2 | 0% |
| `glob` | 234 | 1 | 0 | 0.4% |
| `list` | 228 | 4 | 0 | 1.8% |
| `check_merge_readiness` | 179 | 0 | 0 | 0% |
| `commit_and_push` | 176 | 7 | 0 | 4% |
| `atoma_builtin__load_skill` | 164 | 1 | 0 | 0.6% |
| `create_pr` | 153 | 50 | 0 | 32.7% |
| `get_branch` | 151 | 0 | 0 | 0% |
| `write` | 137 | 2 | 0 | 1.5% |
| `get_pr_diff` | 118 | 2 | 0 | 1.7% |
| `search_issues` | 101 | 0 | 1 | 0% |
| `request_close_issue` | 93 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 64 | 0 | 0 | 0% |
| `merge_pr` | 58 | 0 | 0 | 0% |
| `load_skill` | 51 | 9 | 0 | 17.6% |
| `list_pr_review_comments` | 48 | 0 | 0 | 0% |
| `list_prs` | 46 | 0 | 0 | 0% |
| `search_code` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 38 | 11 | 0 | 28.9% |
| `create_root_issue` | 32 | 1 | 0 | 3.1% |
| `delegate` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `delegate_readonly` | 20 | 0 | 0 | 0% |
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
| `other` | 5,361 | 79.9% |
| `edit` | 515 | 7.7% |
| `search` | 428 | 6.4% |
| `verify` | 213 | 3.2% |
| `open` | 193 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 182 | 84.7% |
| `writing/japanese` | 15 | 7% |
| `delivery/pipeline-setup` | 5 | 2.3% |
| `research/web-search` | 5 | 2.3% |
| `engineering/secrets-in-a-check` | 4 | 1.9% |
| `docs/customer-doc` | 3 | 1.4% |
| `engineering/environment` | 1 | 0.5% |

## Last year

280 sessions.

**Ran to an end without a report:** 52 of 269 sessions whose last run the core recorded as `completed` — 19.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,014,701,438 tokens** over 363 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 5,864,765 | 28,119,706 | 73,718,100 | 1,014,701,438 |
| messages per session | 132 | 341 | 705 | 731 | 47,317 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 114 | 40.7% |
| `engineer` | 90 | 32.1% |
| `atomaton` | 76 | 27.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,559 | 152 | 119 | 2% |
| `read` | 5,600 | 28 | 8 | 0.5% |
| `grep` | 4,246 | 108 | 18 | 2.5% |
| `edit` | 2,051 | 34 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 865 | 59 | 0 | 6.8% |
| `get_issue` | 345 | 14 | 5 | 4.1% |
| `list` | 333 | 5 | 0 | 1.5% |
| `get_issue_comments` | 327 | 0 | 10 | 0% |
| `get_pr` | 325 | 9 | 3 | 2.8% |
| `get_check_runs` | 321 | 12 | 0 | 3.7% |
| `glob` | 279 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 193 | 0 | 0 | 0% |
| `get_branch` | 190 | 0 | 0 | 0% |
| `write` | 187 | 2 | 0 | 1.1% |
| `commit_and_push` | 185 | 9 | 0 | 4.9% |
| `create_pr` | 162 | 53 | 0 | 32.7% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 130 | 3 | 0 | 2.3% |
| `search_issues` | 125 | 0 | 3 | 0% |
| `request_close_issue` | 97 | 1 | 0 | 1% |
| `get_pr_reviews` | 72 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 62 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 55 | 0 | 0 | 0% |
| `load_skill` | 51 | 9 | 0 | 17.6% |
| `search_code` | 47 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 32 | 1 | 0 | 3.1% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
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
| `other` | 5,984 | 79.2% |
| `edit` | 595 | 7.9% |
| `search` | 504 | 6.7% |
| `open` | 239 | 3.2% |
| `verify` | 237 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 213 | 81.6% |
| `writing/japanese` | 15 | 5.7% |
| `delivery/pipeline-setup` | 10 | 3.8% |
| `engineering/environment` | 7 | 2.7% |
| `engineering/secrets-in-a-check` | 6 | 2.3% |
| `research/web-search` | 6 | 2.3% |
| `docs/customer-doc` | 3 | 1.1% |
| `docs/design-doc` | 1 | 0.4% |

## All time

295 sessions.

**Ran to an end without a report:** 52 of 269 sessions whose last run the core recorded as `completed` — 19.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 15 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,014,701,438 tokens** over 363 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 5,864,765 | 28,119,706 | 73,718,100 | 1,014,701,438 |
| messages per session | 120 | 334 | 705 | 731 | 47,395 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 118 | 40% |
| `engineer` | 98 | 33.2% |
| `atomaton` | 79 | 26.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,559 | 152 | 119 | 2% |
| `read` | 5,600 | 28 | 8 | 0.5% |
| `grep` | 4,246 | 108 | 18 | 2.5% |
| `edit` | 2,051 | 34 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 865 | 59 | 0 | 6.8% |
| `get_issue` | 345 | 14 | 5 | 4.1% |
| `list` | 333 | 5 | 0 | 1.5% |
| `get_issue_comments` | 327 | 0 | 10 | 0% |
| `get_pr` | 325 | 9 | 3 | 2.8% |
| `get_check_runs` | 321 | 12 | 0 | 3.7% |
| `glob` | 279 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 193 | 0 | 0 | 0% |
| `get_branch` | 190 | 0 | 0 | 0% |
| `write` | 187 | 2 | 0 | 1.1% |
| `commit_and_push` | 185 | 9 | 0 | 4.9% |
| `create_pr` | 162 | 53 | 0 | 32.7% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 130 | 3 | 0 | 2.3% |
| `search_issues` | 125 | 0 | 3 | 0% |
| `request_close_issue` | 97 | 1 | 0 | 1% |
| `get_pr_reviews` | 72 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 62 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 55 | 0 | 0 | 0% |
| `load_skill` | 51 | 9 | 0 | 17.6% |
| `search_code` | 47 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 32 | 1 | 0 | 3.1% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
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
| `other` | 5,984 | 79.2% |
| `edit` | 595 | 7.9% |
| `search` | 504 | 6.7% |
| `open` | 239 | 3.2% |
| `verify` | 237 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 213 | 81.6% |
| `writing/japanese` | 15 | 5.7% |
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
