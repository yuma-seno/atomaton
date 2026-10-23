# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-23.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 163 | 5.5% | 291 | 9,859 | 14 | 21.4 |
| Last 30 days | 248 | 6.9% | 455 | 10,246 | 18 | 28.1 |
| Last year | 248 | 6.9% | 455 | 10,246 | 18 | 28.1 |
| All time | 248 | 6.9% | 455 | 10,246 | 18 | 28.1 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 231 |
| `failed` | 14 |
| `stopped` | 3 |

## Last 7 days

66 sessions.

**Ran to an end without a report:** 10 of 65 sessions whose last run the core recorded as `completed` — 15.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**169,192,323 tokens** over 98 runs that reported them, **98.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**92.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,173,182 | 5,619,407 | 8,400,110 | 8,400,110 | 169,192,323 |
| messages per session | 117 | 327 | 463 | 463 | 10,462 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 31 | 47% |
| `reviewer` | 28 | 42.4% |
| `engineer` | 7 | 10.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,551 | 10 | 0 | 0.6% |
| `bash` | 1,221 | 15 | 18 | 1.2% |
| `grep` | 1,161 | 23 | 0 | 2% |
| `edit` | 636 | 8 | 0 | 1.3% |
| `fetch` | 159 | 10 | 0 | 6.3% |
| `get_issue` | 112 | 0 | 4 | 0% |
| `list` | 95 | 1 | 0 | 1.1% |
| `glob` | 90 | 1 | 0 | 1.1% |
| `get_issue_comments` | 85 | 0 | 2 | 0% |
| `get_pr` | 85 | 4 | 0 | 4.7% |
| `get_check_runs` | 75 | 1 | 0 | 1.3% |
| `atoma_builtin__load_skill` | 56 | 0 | 0 | 0% |
| `get_branch` | 55 | 0 | 0 | 0% |
| `check_merge_readiness` | 50 | 0 | 0 | 0% |
| `commit_and_push` | 43 | 3 | 0 | 7% |
| `create_pr` | 42 | 14 | 0 | 33.3% |
| `get_pr_diff` | 35 | 2 | 0 | 5.7% |
| `write` | 31 | 0 | 0 | 0% |
| `request_close_issue` | 28 | 0 | 0 | 0% |
| `search_issues` | 27 | 0 | 0 | 0% |
| `list_prs` | 18 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 4 | 0 | 25% |
| `search_code` | 15 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `create_root_issue` | 10 | 1 | 0 | 10% |
| `delegate` | 10 | 0 | 0 | 0% |
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
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 665 | 54.5% |
| `search` | 227 | 18.6% |
| `verify` | 167 | 13.7% |
| `open` | 83 | 6.8% |
| `edit` | 79 | 6.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 54 | 96.4% |
| `delivery/pipeline-setup` | 1 | 1.8% |
| `research/web-search` | 1 | 1.8% |

## Last 30 days

109 sessions.

**Ran to an end without a report:** 24 of 106 sessions whose last run the core recorded as `completed` — 22.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**492,223,813 tokens** over 142 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,408,541 | 6,181,709 | 39,097,860 | 73,718,100 | 492,223,813 |
| messages per session | 151 | 402 | 705 | 715 | 21,082 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 50 | 45.9% |
| `reviewer` | 40 | 36.7% |
| `engineer` | 19 | 17.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,851 | 19 | 4 | 0.7% |
| `bash` | 2,365 | 43 | 46 | 1.8% |
| `grep` | 1,990 | 40 | 7 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 977 | 11 | 0 | 1.1% |
| `fetch` | 337 | 36 | 0 | 10.7% |
| `list` | 208 | 2 | 0 | 1% |
| `get_issue` | 200 | 13 | 4 | 6.5% |
| `get_issue_comments` | 154 | 0 | 10 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `glob` | 140 | 1 | 1 | 0.7% |
| `get_pr` | 128 | 9 | 0 | 7% |
| `get_check_runs` | 111 | 3 | 0 | 2.7% |
| `atoma_builtin__load_skill` | 108 | 0 | 0 | 0% |
| `get_branch` | 103 | 0 | 0 | 0% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `write` | 81 | 0 | 0 | 0% |
| `check_merge_readiness` | 68 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `commit_and_push` | 56 | 5 | 0 | 8.9% |
| `create_pr` | 56 | 20 | 0 | 35.7% |
| `get_pr_diff` | 49 | 3 | 0 | 6.1% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `list_prs` | 34 | 0 | 0 | 0% |
| `request_close_issue` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `get_pr_reviews` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `create_root_issue` | 10 | 1 | 0 | 10% |
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
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,498 | 63.3% |
| `search` | 353 | 14.9% |
| `verify` | 205 | 8.7% |
| `edit` | 173 | 7.3% |
| `open` | 136 | 5.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 91 | 84.3% |
| `delivery/pipeline-setup` | 6 | 5.6% |
| `engineering/environment` | 6 | 5.6% |
| `engineering/secrets-in-a-check` | 2 | 1.9% |
| `research/web-search` | 2 | 1.9% |
| `docs/design-doc` | 1 | 0.9% |

## Last year

109 sessions.

**Ran to an end without a report:** 24 of 106 sessions whose last run the core recorded as `completed` — 22.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**492,223,813 tokens** over 142 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,408,541 | 6,181,709 | 39,097,860 | 73,718,100 | 492,223,813 |
| messages per session | 151 | 402 | 705 | 715 | 21,082 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 50 | 45.9% |
| `reviewer` | 40 | 36.7% |
| `engineer` | 19 | 17.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,851 | 19 | 4 | 0.7% |
| `bash` | 2,365 | 43 | 46 | 1.8% |
| `grep` | 1,990 | 40 | 7 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 977 | 11 | 0 | 1.1% |
| `fetch` | 337 | 36 | 0 | 10.7% |
| `list` | 208 | 2 | 0 | 1% |
| `get_issue` | 200 | 13 | 4 | 6.5% |
| `get_issue_comments` | 154 | 0 | 10 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `glob` | 140 | 1 | 1 | 0.7% |
| `get_pr` | 128 | 9 | 0 | 7% |
| `get_check_runs` | 111 | 3 | 0 | 2.7% |
| `atoma_builtin__load_skill` | 108 | 0 | 0 | 0% |
| `get_branch` | 103 | 0 | 0 | 0% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `write` | 81 | 0 | 0 | 0% |
| `check_merge_readiness` | 68 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `commit_and_push` | 56 | 5 | 0 | 8.9% |
| `create_pr` | 56 | 20 | 0 | 35.7% |
| `get_pr_diff` | 49 | 3 | 0 | 6.1% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `list_prs` | 34 | 0 | 0 | 0% |
| `request_close_issue` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `get_pr_reviews` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `create_root_issue` | 10 | 1 | 0 | 10% |
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
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,498 | 63.3% |
| `search` | 353 | 14.9% |
| `verify` | 205 | 8.7% |
| `edit` | 173 | 7.3% |
| `open` | 136 | 5.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 91 | 84.3% |
| `delivery/pipeline-setup` | 6 | 5.6% |
| `engineering/environment` | 6 | 5.6% |
| `engineering/secrets-in-a-check` | 2 | 1.9% |
| `research/web-search` | 2 | 1.9% |
| `docs/design-doc` | 1 | 0.9% |

## All time

111 sessions.

**Ran to an end without a report:** 24 of 106 sessions whose last run the core recorded as `completed` — 22.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**492,223,813 tokens** over 142 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,408,541 | 6,181,709 | 39,097,860 | 73,718,100 | 492,223,813 |
| messages per session | 151 | 396 | 705 | 715 | 21,086 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 52 | 46.8% |
| `reviewer` | 40 | 36% |
| `engineer` | 19 | 17.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,851 | 19 | 4 | 0.7% |
| `bash` | 2,365 | 43 | 46 | 1.8% |
| `grep` | 1,990 | 40 | 7 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 977 | 11 | 0 | 1.1% |
| `fetch` | 337 | 36 | 0 | 10.7% |
| `list` | 208 | 2 | 0 | 1% |
| `get_issue` | 200 | 13 | 4 | 6.5% |
| `get_issue_comments` | 154 | 0 | 10 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `glob` | 140 | 1 | 1 | 0.7% |
| `get_pr` | 128 | 9 | 0 | 7% |
| `get_check_runs` | 111 | 3 | 0 | 2.7% |
| `atoma_builtin__load_skill` | 108 | 0 | 0 | 0% |
| `get_branch` | 103 | 0 | 0 | 0% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `write` | 81 | 0 | 0 | 0% |
| `check_merge_readiness` | 68 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `commit_and_push` | 56 | 5 | 0 | 8.9% |
| `create_pr` | 56 | 20 | 0 | 35.7% |
| `get_pr_diff` | 49 | 3 | 0 | 6.1% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `list_prs` | 34 | 0 | 0 | 0% |
| `request_close_issue` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `get_pr_reviews` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `create_root_issue` | 10 | 1 | 0 | 10% |
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
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,498 | 63.3% |
| `search` | 353 | 14.9% |
| `verify` | 205 | 8.7% |
| `edit` | 173 | 7.3% |
| `open` | 136 | 5.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 91 | 84.3% |
| `delivery/pipeline-setup` | 6 | 5.6% |
| `engineering/environment` | 6 | 5.6% |
| `engineering/secrets-in-a-check` | 2 | 1.9% |
| `research/web-search` | 2 | 1.9% |
| `docs/design-doc` | 1 | 0.9% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
