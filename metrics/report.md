# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-25.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 202 | 3% | 209 | 9,689 | 15 | 15.6 |
| Last 30 days | 315 | 5.7% | 335 | 10,246 | 17 | 22.5 |
| Last year | 315 | 5.7% | 335 | 10,246 | 17 | 22.5 |
| All time | 315 | 5.7% | 335 | 10,246 | 17 | 22.5 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 297 |
| `failed` | 14 |
| `stopped` | 4 |

## Last 7 days

94 sessions.

**Ran to an end without a report:** 14 of 93 sessions whose last run the core recorded as `completed` — 15.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**221,983,462 tokens** over 130 runs that reported them, **98.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,143,930 | 4,615,931 | 8,400,110 | 8,676,293 | 221,983,462 |
| messages per session | 102 | 283 | 731 | 731 | 13,197 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 46 | 48.9% |
| `atomaton` | 31 | 33% |
| `engineer` | 17 | 18.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,900 | 11 | 0 | 0.6% |
| `bash` | 1,604 | 17 | 21 | 1.1% |
| `grep` | 1,391 | 42 | 0 | 3% |
| `edit` | 766 | 13 | 0 | 1.7% |
| `fetch` | 168 | 10 | 0 | 6% |
| `get_pr` | 119 | 4 | 0 | 3.4% |
| `get_issue` | 116 | 0 | 4 | 0% |
| `glob` | 110 | 0 | 0 | 0% |
| `get_issue_comments` | 109 | 0 | 2 | 0% |
| `get_check_runs` | 105 | 4 | 0 | 3.8% |
| `list` | 86 | 2 | 0 | 2.3% |
| `atoma_builtin__load_skill` | 79 | 0 | 0 | 0% |
| `check_merge_readiness` | 77 | 0 | 0 | 0% |
| `get_branch` | 67 | 0 | 0 | 0% |
| `commit_and_push` | 60 | 4 | 0 | 6.7% |
| `get_pr_diff` | 55 | 2 | 0 | 3.6% |
| `create_pr` | 51 | 15 | 0 | 29.4% |
| `write` | 44 | 0 | 0 | 0% |
| `request_close_issue` | 37 | 1 | 0 | 2.7% |
| `list_prs` | 24 | 0 | 0 | 0% |
| `search_issues` | 23 | 0 | 0 | 0% |
| `delegate` | 16 | 0 | 0 | 0% |
| `search_remote_code` | 15 | 4 | 0 | 26.7% |
| `create_root_issue` | 14 | 1 | 0 | 7.1% |
| `search_code` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `merge_pr` | 13 | 0 | 0 | 0% |
| `delegate_readonly` | 9 | 0 | 0 | 0% |
| `get_pr_reviews` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `launch_sub_agent` | 8 | 2 | 0 | 25% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `sync_branch` | 6 | 2 | 0 | 33.3% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `create_issue` | 4 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `list_issues` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 976 | 60.8% |
| `search` | 229 | 14.3% |
| `verify` | 184 | 11.5% |
| `edit` | 125 | 7.8% |
| `open` | 90 | 5.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 77 | 95.1% |
| `delivery/pipeline-setup` | 2 | 2.5% |
| `engineering/secrets-in-a-check` | 1 | 1.2% |
| `research/web-search` | 1 | 1.2% |

## Last 30 days

143 sessions.

**Ran to an end without a report:** 29 of 140 sessions whose last run the core recorded as `completed` — 20.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**567,762,058 tokens** over 186 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 5,781,615 | 39,097,860 | 73,718,100 | 567,762,058 |
| messages per session | 129 | 384 | 715 | 731 | 25,118 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 60 | 42% |
| `atomaton` | 53 | 37.1% |
| `engineer` | 30 | 21% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,368 | 21 | 4 | 0.6% |
| `bash` | 2,946 | 50 | 52 | 1.7% |
| `grep` | 2,452 | 60 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,131 | 16 | 0 | 1.4% |
| `fetch` | 388 | 37 | 0 | 9.5% |
| `get_issue` | 225 | 13 | 4 | 5.8% |
| `list` | 224 | 3 | 0 | 1.3% |
| `get_issue_comments` | 195 | 0 | 10 | 0% |
| `get_pr` | 168 | 9 | 0 | 5.4% |
| `glob` | 166 | 1 | 1 | 0.6% |
| `get_check_runs` | 152 | 6 | 0 | 3.9% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 135 | 0 | 0 | 0% |
| `get_branch` | 120 | 0 | 0 | 0% |
| `check_merge_readiness` | 97 | 0 | 0 | 0% |
| `write` | 94 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `commit_and_push` | 74 | 6 | 0 | 8.1% |
| `get_pr_diff` | 72 | 3 | 0 | 4.2% |
| `create_pr` | 70 | 24 | 0 | 34.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 44 | 1 | 0 | 2.3% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_prs` | 40 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `get_pr_reviews` | 20 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `merge_pr` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `create_root_issue` | 15 | 1 | 0 | 6.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `launch_sub_agent` | 10 | 2 | 0 | 20% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
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
| `load_skill` | 2 | 2 | 0 | 100% |
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
| `other` | 1,975 | 67% |
| `search` | 374 | 12.7% |
| `edit` | 227 | 7.7% |
| `verify` | 222 | 7.5% |
| `open` | 148 | 5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 118 | 86.1% |
| `delivery/pipeline-setup` | 7 | 5.1% |
| `engineering/environment` | 6 | 4.4% |
| `engineering/secrets-in-a-check` | 3 | 2.2% |
| `research/web-search` | 2 | 1.5% |
| `docs/design-doc` | 1 | 0.7% |

## Last year

143 sessions.

**Ran to an end without a report:** 29 of 140 sessions whose last run the core recorded as `completed` — 20.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**567,762,058 tokens** over 186 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 5,781,615 | 39,097,860 | 73,718,100 | 567,762,058 |
| messages per session | 129 | 384 | 715 | 731 | 25,118 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 60 | 42% |
| `atomaton` | 53 | 37.1% |
| `engineer` | 30 | 21% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,368 | 21 | 4 | 0.6% |
| `bash` | 2,946 | 50 | 52 | 1.7% |
| `grep` | 2,452 | 60 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,131 | 16 | 0 | 1.4% |
| `fetch` | 388 | 37 | 0 | 9.5% |
| `get_issue` | 225 | 13 | 4 | 5.8% |
| `list` | 224 | 3 | 0 | 1.3% |
| `get_issue_comments` | 195 | 0 | 10 | 0% |
| `get_pr` | 168 | 9 | 0 | 5.4% |
| `glob` | 166 | 1 | 1 | 0.6% |
| `get_check_runs` | 152 | 6 | 0 | 3.9% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 135 | 0 | 0 | 0% |
| `get_branch` | 120 | 0 | 0 | 0% |
| `check_merge_readiness` | 97 | 0 | 0 | 0% |
| `write` | 94 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `commit_and_push` | 74 | 6 | 0 | 8.1% |
| `get_pr_diff` | 72 | 3 | 0 | 4.2% |
| `create_pr` | 70 | 24 | 0 | 34.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 44 | 1 | 0 | 2.3% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_prs` | 40 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `get_pr_reviews` | 20 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `merge_pr` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `create_root_issue` | 15 | 1 | 0 | 6.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `launch_sub_agent` | 10 | 2 | 0 | 20% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
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
| `load_skill` | 2 | 2 | 0 | 100% |
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
| `other` | 1,975 | 67% |
| `search` | 374 | 12.7% |
| `edit` | 227 | 7.7% |
| `verify` | 222 | 7.5% |
| `open` | 148 | 5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 118 | 86.1% |
| `delivery/pipeline-setup` | 7 | 5.1% |
| `engineering/environment` | 6 | 4.4% |
| `engineering/secrets-in-a-check` | 3 | 2.2% |
| `research/web-search` | 2 | 1.5% |
| `docs/design-doc` | 1 | 0.7% |

## All time

145 sessions.

**Ran to an end without a report:** 29 of 140 sessions whose last run the core recorded as `completed` — 20.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**567,762,058 tokens** over 186 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 5,781,615 | 39,097,860 | 73,718,100 | 567,762,058 |
| messages per session | 126 | 384 | 715 | 731 | 25,122 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 60 | 41.4% |
| `atomaton` | 55 | 37.9% |
| `engineer` | 30 | 20.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,368 | 21 | 4 | 0.6% |
| `bash` | 2,946 | 50 | 52 | 1.7% |
| `grep` | 2,452 | 60 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,131 | 16 | 0 | 1.4% |
| `fetch` | 388 | 37 | 0 | 9.5% |
| `get_issue` | 225 | 13 | 4 | 5.8% |
| `list` | 224 | 3 | 0 | 1.3% |
| `get_issue_comments` | 195 | 0 | 10 | 0% |
| `get_pr` | 168 | 9 | 0 | 5.4% |
| `glob` | 166 | 1 | 1 | 0.6% |
| `get_check_runs` | 152 | 6 | 0 | 3.9% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 135 | 0 | 0 | 0% |
| `get_branch` | 120 | 0 | 0 | 0% |
| `check_merge_readiness` | 97 | 0 | 0 | 0% |
| `write` | 94 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `commit_and_push` | 74 | 6 | 0 | 8.1% |
| `get_pr_diff` | 72 | 3 | 0 | 4.2% |
| `create_pr` | 70 | 24 | 0 | 34.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 44 | 1 | 0 | 2.3% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_prs` | 40 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `get_pr_reviews` | 20 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `merge_pr` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `create_root_issue` | 15 | 1 | 0 | 6.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `launch_sub_agent` | 10 | 2 | 0 | 20% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
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
| `load_skill` | 2 | 2 | 0 | 100% |
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
| `other` | 1,975 | 67% |
| `search` | 374 | 12.7% |
| `edit` | 227 | 7.7% |
| `verify` | 222 | 7.5% |
| `open` | 148 | 5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 118 | 86.1% |
| `delivery/pipeline-setup` | 7 | 5.1% |
| `engineering/environment` | 6 | 4.4% |
| `engineering/secrets-in-a-check` | 3 | 2.2% |
| `research/web-search` | 2 | 1.5% |
| `docs/design-doc` | 1 | 0.7% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
