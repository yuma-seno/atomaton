# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-22.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 119 | 8.4% | 383 | 9,859 | 15 | 29.9 |
| Last 30 days | 184 | 7.6% | 542 | 10,246 | 21 | 30.6 |
| Last year | 184 | 7.6% | 542 | 10,246 | 21 | 30.6 |
| All time | 184 | 7.6% | 542 | 10,246 | 21 | 30.6 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 170 |
| `failed` | 11 |
| `stopped` | 3 |

## Last 7 days

49 sessions.

**Ran to an end without a report:** 11 of 48 sessions whose last run the core recorded as `completed` — 22.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**138,824,652 tokens** over 66 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 906,491 | 5,619,407 | 39,097,860 | 39,097,860 | 138,824,652 |
| messages per session | 135 | 384 | 571 | 571 | 8,570 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 25 | 51% |
| `reviewer` | 18 | 36.7% |
| `engineer` | 6 | 12.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,276 | 11 | 1 | 0.9% |
| `bash` | 1,143 | 18 | 18 | 1.6% |
| `grep` | 895 | 14 | 0 | 1.6% |
| `edit` | 484 | 6 | 0 | 1.2% |
| `fetch` | 206 | 32 | 0 | 15.5% |
| `get_issue` | 131 | 13 | 4 | 9.9% |
| `list` | 79 | 0 | 0 | 0% |
| `get_issue_comments` | 78 | 0 | 2 | 0% |
| `search_issues` | 63 | 0 | 0 | 0% |
| `glob` | 61 | 1 | 0 | 1.6% |
| `get_pr` | 58 | 5 | 0 | 8.6% |
| `get_check_runs` | 54 | 1 | 0 | 1.9% |
| `atoma_builtin__load_skill` | 41 | 0 | 0 | 0% |
| `get_branch` | 40 | 0 | 0 | 0% |
| `create_pr` | 33 | 16 | 0 | 48.5% |
| `commit_and_push` | 28 | 3 | 0 | 10.7% |
| `check_merge_readiness` | 23 | 0 | 0 | 0% |
| `get_pr_diff` | 22 | 2 | 0 | 9.1% |
| `request_close_issue` | 20 | 0 | 0 | 0% |
| `write` | 16 | 0 | 0 | 0% |
| `search_code` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `search_remote_code` | 13 | 4 | 0 | 30.8% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `delegate` | 10 | 0 | 0 | 0% |
| `get_pr_reviews` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `list_prs` | 8 | 0 | 0 | 0% |
| `create_root_issue` | 7 | 0 | 0 | 0% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 2 | 0 | 33.3% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `create_issue` | 5 | 0 | 0 | 0% |
| `list_issues` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 2 | 0 | 50% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 1 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 674 | 59% |
| `search` | 219 | 19.2% |
| `verify` | 115 | 10.1% |
| `edit` | 82 | 7.2% |
| `open` | 53 | 4.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 39 | 95.1% |
| `delivery/pipeline-setup` | 1 | 2.4% |
| `research/web-search` | 1 | 2.4% |

## Last 30 days

85 sessions.

**Ran to an end without a report:** 22 of 83 sessions whose last run the core recorded as `completed` — 26.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**408,228,057 tokens** over 101 runs that reported them, **97.2% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,408,541 | 7,169,420 | 39,097,860 | 73,718,100 | 408,228,057 |
| messages per session | 157 | 450 | 715 | 715 | 17,483 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 40 | 47.1% |
| `reviewer` | 28 | 32.9% |
| `engineer` | 17 | 20% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,325 | 18 | 5 | 0.8% |
| `bash` | 1,992 | 42 | 43 | 2.1% |
| `grep` | 1,587 | 26 | 7 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 696 | 7 | 0 | 1% |
| `fetch` | 308 | 35 | 0 | 11.4% |
| `list` | 184 | 1 | 0 | 0.5% |
| `get_issue` | 170 | 13 | 4 | 7.6% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 131 | 0 | 10 | 0% |
| `glob` | 106 | 1 | 1 | 0.9% |
| `get_pr` | 92 | 9 | 0 | 9.8% |
| `atoma_builtin__load_skill` | 87 | 0 | 0 | 0% |
| `search_issues` | 87 | 0 | 2 | 0% |
| `get_check_runs` | 83 | 3 | 0 | 3.6% |
| `get_branch` | 79 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `write` | 66 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_pr` | 42 | 19 | 0 | 45.2% |
| `check_merge_readiness` | 37 | 0 | 0 | 0% |
| `commit_and_push` | 37 | 5 | 0 | 13.5% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `get_pr_diff` | 34 | 3 | 0 | 8.8% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 24 | 0 | 0 | 0% |
| `list_prs` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate_readonly` | 18 | 0 | 0 | 0% |
| `search_code` | 18 | 0 | 0 | 0% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 5 | 0 | 31.3% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `list_issues` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `create_root_issue` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_readonly_large` | 4 | 0 | 3 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,297 | 65.1% |
| `search` | 295 | 14.8% |
| `edit` | 162 | 8.1% |
| `verify` | 139 | 7% |
| `open` | 99 | 5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 70 | 80.5% |
| `delivery/pipeline-setup` | 6 | 6.9% |
| `engineering/environment` | 6 | 6.9% |
| `engineering/secrets-in-a-check` | 2 | 2.3% |
| `research/web-search` | 2 | 2.3% |
| `docs/design-doc` | 1 | 1.1% |

## Last year

85 sessions.

**Ran to an end without a report:** 22 of 83 sessions whose last run the core recorded as `completed` — 26.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**408,228,057 tokens** over 101 runs that reported them, **97.2% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,408,541 | 7,169,420 | 39,097,860 | 73,718,100 | 408,228,057 |
| messages per session | 157 | 450 | 715 | 715 | 17,483 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 40 | 47.1% |
| `reviewer` | 28 | 32.9% |
| `engineer` | 17 | 20% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,325 | 18 | 5 | 0.8% |
| `bash` | 1,992 | 42 | 43 | 2.1% |
| `grep` | 1,587 | 26 | 7 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 696 | 7 | 0 | 1% |
| `fetch` | 308 | 35 | 0 | 11.4% |
| `list` | 184 | 1 | 0 | 0.5% |
| `get_issue` | 170 | 13 | 4 | 7.6% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 131 | 0 | 10 | 0% |
| `glob` | 106 | 1 | 1 | 0.9% |
| `get_pr` | 92 | 9 | 0 | 9.8% |
| `atoma_builtin__load_skill` | 87 | 0 | 0 | 0% |
| `search_issues` | 87 | 0 | 2 | 0% |
| `get_check_runs` | 83 | 3 | 0 | 3.6% |
| `get_branch` | 79 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `write` | 66 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_pr` | 42 | 19 | 0 | 45.2% |
| `check_merge_readiness` | 37 | 0 | 0 | 0% |
| `commit_and_push` | 37 | 5 | 0 | 13.5% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `get_pr_diff` | 34 | 3 | 0 | 8.8% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 24 | 0 | 0 | 0% |
| `list_prs` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate_readonly` | 18 | 0 | 0 | 0% |
| `search_code` | 18 | 0 | 0 | 0% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 5 | 0 | 31.3% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `list_issues` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `create_root_issue` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_readonly_large` | 4 | 0 | 3 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,297 | 65.1% |
| `search` | 295 | 14.8% |
| `edit` | 162 | 8.1% |
| `verify` | 139 | 7% |
| `open` | 99 | 5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 70 | 80.5% |
| `delivery/pipeline-setup` | 6 | 6.9% |
| `engineering/environment` | 6 | 6.9% |
| `engineering/secrets-in-a-check` | 2 | 2.3% |
| `research/web-search` | 2 | 2.3% |
| `docs/design-doc` | 1 | 1.1% |

## All time

85 sessions.

**Ran to an end without a report:** 22 of 83 sessions whose last run the core recorded as `completed` — 26.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**408,228,057 tokens** over 101 runs that reported them, **97.2% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,408,541 | 7,169,420 | 39,097,860 | 73,718,100 | 408,228,057 |
| messages per session | 157 | 450 | 715 | 715 | 17,483 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 40 | 47.1% |
| `reviewer` | 28 | 32.9% |
| `engineer` | 17 | 20% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,325 | 18 | 5 | 0.8% |
| `bash` | 1,992 | 42 | 43 | 2.1% |
| `grep` | 1,587 | 26 | 7 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 696 | 7 | 0 | 1% |
| `fetch` | 308 | 35 | 0 | 11.4% |
| `list` | 184 | 1 | 0 | 0.5% |
| `get_issue` | 170 | 13 | 4 | 7.6% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 131 | 0 | 10 | 0% |
| `glob` | 106 | 1 | 1 | 0.9% |
| `get_pr` | 92 | 9 | 0 | 9.8% |
| `atoma_builtin__load_skill` | 87 | 0 | 0 | 0% |
| `search_issues` | 87 | 0 | 2 | 0% |
| `get_check_runs` | 83 | 3 | 0 | 3.6% |
| `get_branch` | 79 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `write` | 66 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_pr` | 42 | 19 | 0 | 45.2% |
| `check_merge_readiness` | 37 | 0 | 0 | 0% |
| `commit_and_push` | 37 | 5 | 0 | 13.5% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `get_pr_diff` | 34 | 3 | 0 | 8.8% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 24 | 0 | 0 | 0% |
| `list_prs` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate_readonly` | 18 | 0 | 0 | 0% |
| `search_code` | 18 | 0 | 0 | 0% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 5 | 0 | 31.3% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `list_issues` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `create_root_issue` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_readonly_large` | 4 | 0 | 3 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,297 | 65.1% |
| `search` | 295 | 14.8% |
| `edit` | 162 | 8.1% |
| `verify` | 139 | 7% |
| `open` | 99 | 5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 70 | 80.5% |
| `delivery/pipeline-setup` | 6 | 6.9% |
| `engineering/environment` | 6 | 6.9% |
| `engineering/secrets-in-a-check` | 2 | 2.3% |
| `research/web-search` | 2 | 2.3% |
| `docs/design-doc` | 1 | 1.1% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
