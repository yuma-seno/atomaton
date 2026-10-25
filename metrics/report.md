# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-25.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 183 | 3.3% | 215 | 9,689 | 15 | 16.7 |
| Last 30 days | 296 | 6.1% | 351 | 10,246 | 17 | 23.4 |
| Last year | 296 | 6.1% | 351 | 10,246 | 17 | 23.4 |
| All time | 296 | 6.1% | 351 | 10,246 | 17 | 23.4 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 278 |
| `failed` | 14 |
| `stopped` | 4 |

## Last 7 days

86 sessions.

**Ran to an end without a report:** 12 of 85 sessions whose last run the core recorded as `completed` — 14.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**212,432,565 tokens** over 123 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,143,930 | 4,615,931 | 8,400,110 | 8,676,293 | 212,432,565 |
| messages per session | 102 | 290 | 731 | 731 | 12,224 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 42 | 48.8% |
| `atomaton` | 30 | 34.9% |
| `engineer` | 14 | 16.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,772 | 11 | 0 | 0.6% |
| `bash` | 1,442 | 12 | 16 | 0.8% |
| `grep` | 1,323 | 39 | 0 | 2.9% |
| `edit` | 734 | 13 | 0 | 1.8% |
| `fetch` | 144 | 10 | 0 | 6.9% |
| `get_pr` | 108 | 4 | 0 | 3.7% |
| `glob` | 107 | 0 | 0 | 0% |
| `get_issue` | 103 | 0 | 4 | 0% |
| `get_check_runs` | 101 | 4 | 0 | 4% |
| `get_issue_comments` | 100 | 0 | 2 | 0% |
| `list` | 81 | 2 | 0 | 2.5% |
| `atoma_builtin__load_skill` | 73 | 0 | 0 | 0% |
| `check_merge_readiness` | 71 | 0 | 0 | 0% |
| `get_branch` | 61 | 0 | 0 | 0% |
| `commit_and_push` | 52 | 3 | 0 | 5.8% |
| `get_pr_diff` | 50 | 2 | 0 | 4% |
| `create_pr` | 45 | 14 | 0 | 31.1% |
| `write` | 38 | 0 | 0 | 0% |
| `request_close_issue` | 32 | 1 | 0 | 3.1% |
| `list_prs` | 23 | 0 | 0 | 0% |
| `search_issues` | 23 | 0 | 0 | 0% |
| `delegate` | 16 | 0 | 0 | 0% |
| `search_remote_code` | 15 | 4 | 0 | 26.7% |
| `search_code` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `create_root_issue` | 12 | 1 | 0 | 8.3% |
| `delegate_readonly` | 9 | 0 | 0 | 0% |
| `merge_pr` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `get_pr_reviews` | 8 | 0 | 0 | 0% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 2 | 0 | 33.3% |
| `sync_branch` | 6 | 2 | 0 | 33.3% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `create_issue` | 4 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `list_issues` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 830 | 57.6% |
| `search` | 229 | 15.9% |
| `verify` | 181 | 12.6% |
| `edit` | 113 | 7.8% |
| `open` | 89 | 6.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 71 | 94.7% |
| `delivery/pipeline-setup` | 2 | 2.7% |
| `engineering/secrets-in-a-check` | 1 | 1.3% |
| `research/web-search` | 1 | 1.3% |

## Last 30 days

135 sessions.

**Ran to an end without a report:** 27 of 132 sessions whose last run the core recorded as `completed` — 20.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**558,211,161 tokens** over 179 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 5,864,765 | 39,097,860 | 73,718,100 | 558,211,161 |
| messages per session | 135 | 388 | 715 | 731 | 24,145 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 56 | 41.5% |
| `atomaton` | 52 | 38.5% |
| `engineer` | 27 | 20% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,240 | 21 | 4 | 0.6% |
| `bash` | 2,784 | 45 | 47 | 1.6% |
| `grep` | 2,384 | 57 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,099 | 16 | 0 | 1.5% |
| `fetch` | 364 | 37 | 0 | 10.2% |
| `list` | 219 | 3 | 0 | 1.4% |
| `get_issue` | 212 | 13 | 4 | 6.1% |
| `get_issue_comments` | 186 | 0 | 10 | 0% |
| `glob` | 163 | 1 | 1 | 0.6% |
| `get_pr` | 157 | 9 | 0 | 5.7% |
| `get_check_runs` | 148 | 6 | 0 | 4.1% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 129 | 0 | 0 | 0% |
| `get_branch` | 114 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `check_merge_readiness` | 91 | 0 | 0 | 0% |
| `write` | 88 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr_diff` | 67 | 3 | 0 | 4.5% |
| `commit_and_push` | 66 | 5 | 0 | 7.6% |
| `create_pr` | 64 | 23 | 0 | 35.9% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_prs` | 39 | 0 | 0 | 0% |
| `request_close_issue` | 39 | 1 | 0 | 2.6% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `get_pr_reviews` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `merge_pr` | 15 | 0 | 0 | 0% |
| `create_root_issue` | 13 | 1 | 0 | 7.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 8 | 2 | 0 | 25% |
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
| `other` | 1,829 | 65.7% |
| `search` | 374 | 13.4% |
| `verify` | 219 | 7.9% |
| `edit` | 215 | 7.7% |
| `open` | 147 | 5.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 112 | 85.5% |
| `delivery/pipeline-setup` | 7 | 5.3% |
| `engineering/environment` | 6 | 4.6% |
| `engineering/secrets-in-a-check` | 3 | 2.3% |
| `research/web-search` | 2 | 1.5% |
| `docs/design-doc` | 1 | 0.8% |

## Last year

135 sessions.

**Ran to an end without a report:** 27 of 132 sessions whose last run the core recorded as `completed` — 20.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**558,211,161 tokens** over 179 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 5,864,765 | 39,097,860 | 73,718,100 | 558,211,161 |
| messages per session | 135 | 388 | 715 | 731 | 24,145 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 56 | 41.5% |
| `atomaton` | 52 | 38.5% |
| `engineer` | 27 | 20% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,240 | 21 | 4 | 0.6% |
| `bash` | 2,784 | 45 | 47 | 1.6% |
| `grep` | 2,384 | 57 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,099 | 16 | 0 | 1.5% |
| `fetch` | 364 | 37 | 0 | 10.2% |
| `list` | 219 | 3 | 0 | 1.4% |
| `get_issue` | 212 | 13 | 4 | 6.1% |
| `get_issue_comments` | 186 | 0 | 10 | 0% |
| `glob` | 163 | 1 | 1 | 0.6% |
| `get_pr` | 157 | 9 | 0 | 5.7% |
| `get_check_runs` | 148 | 6 | 0 | 4.1% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 129 | 0 | 0 | 0% |
| `get_branch` | 114 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `check_merge_readiness` | 91 | 0 | 0 | 0% |
| `write` | 88 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr_diff` | 67 | 3 | 0 | 4.5% |
| `commit_and_push` | 66 | 5 | 0 | 7.6% |
| `create_pr` | 64 | 23 | 0 | 35.9% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_prs` | 39 | 0 | 0 | 0% |
| `request_close_issue` | 39 | 1 | 0 | 2.6% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `get_pr_reviews` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `merge_pr` | 15 | 0 | 0 | 0% |
| `create_root_issue` | 13 | 1 | 0 | 7.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 8 | 2 | 0 | 25% |
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
| `other` | 1,829 | 65.7% |
| `search` | 374 | 13.4% |
| `verify` | 219 | 7.9% |
| `edit` | 215 | 7.7% |
| `open` | 147 | 5.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 112 | 85.5% |
| `delivery/pipeline-setup` | 7 | 5.3% |
| `engineering/environment` | 6 | 4.6% |
| `engineering/secrets-in-a-check` | 3 | 2.3% |
| `research/web-search` | 2 | 1.5% |
| `docs/design-doc` | 1 | 0.8% |

## All time

137 sessions.

**Ran to an end without a report:** 27 of 132 sessions whose last run the core recorded as `completed` — 20.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**558,211,161 tokens** over 179 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 5,864,765 | 39,097,860 | 73,718,100 | 558,211,161 |
| messages per session | 132 | 388 | 715 | 731 | 24,149 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 56 | 40.9% |
| `atomaton` | 54 | 39.4% |
| `engineer` | 27 | 19.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,240 | 21 | 4 | 0.6% |
| `bash` | 2,784 | 45 | 47 | 1.6% |
| `grep` | 2,384 | 57 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,099 | 16 | 0 | 1.5% |
| `fetch` | 364 | 37 | 0 | 10.2% |
| `list` | 219 | 3 | 0 | 1.4% |
| `get_issue` | 212 | 13 | 4 | 6.1% |
| `get_issue_comments` | 186 | 0 | 10 | 0% |
| `glob` | 163 | 1 | 1 | 0.6% |
| `get_pr` | 157 | 9 | 0 | 5.7% |
| `get_check_runs` | 148 | 6 | 0 | 4.1% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `atoma_builtin__load_skill` | 129 | 0 | 0 | 0% |
| `get_branch` | 114 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `check_merge_readiness` | 91 | 0 | 0 | 0% |
| `write` | 88 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr_diff` | 67 | 3 | 0 | 4.5% |
| `commit_and_push` | 66 | 5 | 0 | 7.6% |
| `create_pr` | 64 | 23 | 0 | 35.9% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_prs` | 39 | 0 | 0 | 0% |
| `request_close_issue` | 39 | 1 | 0 | 2.6% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `get_pr_reviews` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `merge_pr` | 15 | 0 | 0 | 0% |
| `create_root_issue` | 13 | 1 | 0 | 7.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 8 | 2 | 0 | 25% |
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
| `other` | 1,829 | 65.7% |
| `search` | 374 | 13.4% |
| `verify` | 219 | 7.9% |
| `edit` | 215 | 7.7% |
| `open` | 147 | 5.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 112 | 85.5% |
| `delivery/pipeline-setup` | 7 | 5.3% |
| `engineering/environment` | 6 | 4.6% |
| `engineering/secrets-in-a-check` | 3 | 2.3% |
| `research/web-search` | 2 | 1.5% |
| `docs/design-doc` | 1 | 0.8% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
