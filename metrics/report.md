# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-23.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 172 | 5.8% | 278 | 9,859 | 14 | 21.2 |
| Last 30 days | 257 | 7% | 426 | 10,246 | 18 | 27.4 |
| Last year | 257 | 7% | 426 | 10,246 | 18 | 27.4 |
| All time | 257 | 7% | 426 | 10,246 | 18 | 27.4 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 239 |
| `failed` | 14 |
| `stopped` | 4 |

## Last 7 days

71 sessions.

**Ran to an end without a report:** 10 of 70 sessions whose last run the core recorded as `completed` — 14.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**182,747,554 tokens** over 105 runs that reported them, **98.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**92.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,036,761 | 5,619,407 | 8,400,110 | 8,676,293 | 182,747,554 |
| messages per session | 108 | 327 | 680 | 680 | 11,395 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 31 | 43.7% |
| `reviewer` | 31 | 43.7% |
| `engineer` | 9 | 12.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,649 | 11 | 0 | 0.7% |
| `bash` | 1,449 | 18 | 19 | 1.2% |
| `grep` | 1,209 | 24 | 0 | 2% |
| `edit` | 683 | 10 | 0 | 1.5% |
| `fetch` | 160 | 10 | 0 | 6.3% |
| `get_issue` | 115 | 0 | 4 | 0% |
| `list` | 95 | 1 | 0 | 1.1% |
| `glob` | 93 | 1 | 0 | 1.1% |
| `get_pr` | 92 | 4 | 0 | 4.3% |
| `get_issue_comments` | 90 | 0 | 2 | 0% |
| `get_check_runs` | 81 | 1 | 0 | 1.2% |
| `atoma_builtin__load_skill` | 60 | 0 | 0 | 0% |
| `get_branch` | 58 | 0 | 0 | 0% |
| `check_merge_readiness` | 55 | 0 | 0 | 0% |
| `commit_and_push` | 47 | 3 | 0 | 6.4% |
| `create_pr` | 44 | 15 | 0 | 34.1% |
| `get_pr_diff` | 41 | 2 | 0 | 4.9% |
| `write` | 36 | 0 | 0 | 0% |
| `request_close_issue` | 28 | 0 | 0 | 0% |
| `search_issues` | 27 | 0 | 0 | 0% |
| `list_prs` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 4 | 0 | 25% |
| `delegate` | 15 | 0 | 0 | 0% |
| `search_code` | 15 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `create_root_issue` | 12 | 1 | 0 | 8.3% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `get_pr_reviews` | 7 | 0 | 0 | 0% |
| `sync_branch` | 7 | 2 | 0 | 28.6% |
| `launch_sub_agent` | 6 | 2 | 0 | 33.3% |
| `create_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `list_pr_review_comments` | 5 | 0 | 0 | 0% |
| `merge_pr` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 840 | 58% |
| `search` | 235 | 16.2% |
| `verify` | 170 | 11.7% |
| `edit` | 117 | 8.1% |
| `open` | 87 | 6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 58 | 96.7% |
| `delivery/pipeline-setup` | 1 | 1.7% |
| `research/web-search` | 1 | 1.7% |

## Last 30 days

114 sessions.

**Ran to an end without a report:** 24 of 111 sessions whose last run the core recorded as `completed` — 21.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**505,779,044 tokens** over 149 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 6,183,128 | 39,097,860 | 73,718,100 | 505,779,044 |
| messages per session | 151 | 402 | 705 | 715 | 22,015 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 50 | 43.9% |
| `reviewer` | 43 | 37.7% |
| `engineer` | 21 | 18.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,949 | 20 | 4 | 0.7% |
| `bash` | 2,593 | 46 | 47 | 1.8% |
| `grep` | 2,038 | 41 | 7 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,024 | 13 | 0 | 1.3% |
| `fetch` | 338 | 36 | 0 | 10.7% |
| `list` | 208 | 2 | 0 | 1% |
| `get_issue` | 203 | 13 | 4 | 6.4% |
| `get_issue_comments` | 159 | 0 | 10 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `glob` | 143 | 1 | 1 | 0.7% |
| `get_pr` | 135 | 9 | 0 | 6.7% |
| `get_check_runs` | 117 | 3 | 0 | 2.6% |
| `atoma_builtin__load_skill` | 112 | 0 | 0 | 0% |
| `get_branch` | 106 | 0 | 0 | 0% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `write` | 86 | 0 | 0 | 0% |
| `check_merge_readiness` | 73 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `commit_and_push` | 60 | 5 | 0 | 8.3% |
| `create_pr` | 58 | 21 | 0 | 36.2% |
| `get_pr_diff` | 55 | 3 | 0 | 5.5% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `list_prs` | 35 | 0 | 0 | 0% |
| `request_close_issue` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `get_pr_reviews` | 18 | 0 | 0 | 0% |
| `delegate` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `create_root_issue` | 12 | 1 | 0 | 8.3% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,673 | 64.5% |
| `search` | 361 | 13.9% |
| `edit` | 211 | 8.1% |
| `verify` | 208 | 8% |
| `open` | 140 | 5.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 95 | 84.8% |
| `delivery/pipeline-setup` | 6 | 5.4% |
| `engineering/environment` | 6 | 5.4% |
| `engineering/secrets-in-a-check` | 2 | 1.8% |
| `research/web-search` | 2 | 1.8% |
| `docs/design-doc` | 1 | 0.9% |

## Last year

114 sessions.

**Ran to an end without a report:** 24 of 111 sessions whose last run the core recorded as `completed` — 21.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**505,779,044 tokens** over 149 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 6,183,128 | 39,097,860 | 73,718,100 | 505,779,044 |
| messages per session | 151 | 402 | 705 | 715 | 22,015 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 50 | 43.9% |
| `reviewer` | 43 | 37.7% |
| `engineer` | 21 | 18.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,949 | 20 | 4 | 0.7% |
| `bash` | 2,593 | 46 | 47 | 1.8% |
| `grep` | 2,038 | 41 | 7 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,024 | 13 | 0 | 1.3% |
| `fetch` | 338 | 36 | 0 | 10.7% |
| `list` | 208 | 2 | 0 | 1% |
| `get_issue` | 203 | 13 | 4 | 6.4% |
| `get_issue_comments` | 159 | 0 | 10 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `glob` | 143 | 1 | 1 | 0.7% |
| `get_pr` | 135 | 9 | 0 | 6.7% |
| `get_check_runs` | 117 | 3 | 0 | 2.6% |
| `atoma_builtin__load_skill` | 112 | 0 | 0 | 0% |
| `get_branch` | 106 | 0 | 0 | 0% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `write` | 86 | 0 | 0 | 0% |
| `check_merge_readiness` | 73 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `commit_and_push` | 60 | 5 | 0 | 8.3% |
| `create_pr` | 58 | 21 | 0 | 36.2% |
| `get_pr_diff` | 55 | 3 | 0 | 5.5% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `list_prs` | 35 | 0 | 0 | 0% |
| `request_close_issue` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `get_pr_reviews` | 18 | 0 | 0 | 0% |
| `delegate` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `create_root_issue` | 12 | 1 | 0 | 8.3% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,673 | 64.5% |
| `search` | 361 | 13.9% |
| `edit` | 211 | 8.1% |
| `verify` | 208 | 8% |
| `open` | 140 | 5.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 95 | 84.8% |
| `delivery/pipeline-setup` | 6 | 5.4% |
| `engineering/environment` | 6 | 5.4% |
| `engineering/secrets-in-a-check` | 2 | 1.8% |
| `research/web-search` | 2 | 1.8% |
| `docs/design-doc` | 1 | 0.9% |

## All time

116 sessions.

**Ran to an end without a report:** 24 of 111 sessions whose last run the core recorded as `completed` — 21.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**505,779,044 tokens** over 149 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 6,183,128 | 39,097,860 | 73,718,100 | 505,779,044 |
| messages per session | 151 | 402 | 705 | 715 | 22,019 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 52 | 44.8% |
| `reviewer` | 43 | 37.1% |
| `engineer` | 21 | 18.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,949 | 20 | 4 | 0.7% |
| `bash` | 2,593 | 46 | 47 | 1.8% |
| `grep` | 2,038 | 41 | 7 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,024 | 13 | 0 | 1.3% |
| `fetch` | 338 | 36 | 0 | 10.7% |
| `list` | 208 | 2 | 0 | 1% |
| `get_issue` | 203 | 13 | 4 | 6.4% |
| `get_issue_comments` | 159 | 0 | 10 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `glob` | 143 | 1 | 1 | 0.7% |
| `get_pr` | 135 | 9 | 0 | 6.7% |
| `get_check_runs` | 117 | 3 | 0 | 2.6% |
| `atoma_builtin__load_skill` | 112 | 0 | 0 | 0% |
| `get_branch` | 106 | 0 | 0 | 0% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `write` | 86 | 0 | 0 | 0% |
| `check_merge_readiness` | 73 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `commit_and_push` | 60 | 5 | 0 | 8.3% |
| `create_pr` | 58 | 21 | 0 | 36.2% |
| `get_pr_diff` | 55 | 3 | 0 | 5.5% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `list_prs` | 35 | 0 | 0 | 0% |
| `request_close_issue` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `get_pr_reviews` | 18 | 0 | 0 | 0% |
| `delegate` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `create_root_issue` | 12 | 1 | 0 | 8.3% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,673 | 64.5% |
| `search` | 361 | 13.9% |
| `edit` | 211 | 8.1% |
| `verify` | 208 | 8% |
| `open` | 140 | 5.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 95 | 84.8% |
| `delivery/pipeline-setup` | 6 | 5.4% |
| `engineering/environment` | 6 | 5.4% |
| `engineering/secrets-in-a-check` | 2 | 1.8% |
| `research/web-search` | 2 | 1.8% |
| `docs/design-doc` | 1 | 0.9% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
