# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-17.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 65 | 9.2% | 1,023 | 8,481 | 19 | 46.0 |
| Last 30 days | 102 | 8.8% | 1,078 | 10,246 | 29 | 39.0 |
| Last year | 102 | 8.8% | 1,078 | 10,246 | 29 | 39.0 |
| All time | 102 | 8.8% | 1,078 | 10,246 | 29 | 39.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 93 |
| `failed` | 9 |

## Last 7 days

32 sessions.

**Ran to an end without a report:** 12 of 31 sessions whose last run the core recorded as `completed` — 38.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**221,351,153 tokens** over 32 runs that reported them, **97.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,525,516 | 11,776,383 | 73,718,100 | 73,718,100 | 221,351,153 |
| messages per session | 182 | 482 | 715 | 715 | 7,761 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 16 | 50% |
| `reviewer` | 10 | 31.3% |
| `engineer` | 6 | 18.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,369 | 33 | 31 | 2.4% |
| `read` | 894 | 8 | 2 | 0.9% |
| `grep` | 733 | 10 | 3 | 1.4% |
| `shell__shell_execute` | 279 | 3 | 0 | 1.1% |
| `edit` | 258 | 3 | 0 | 1.2% |
| `fetch` | 230 | 27 | 0 | 11.7% |
| `get_issue` | 125 | 13 | 0 | 10.4% |
| `get_issue_comments` | 97 | 0 | 9 | 0% |
| `list` | 90 | 0 | 0 | 0% |
| `search_issues` | 69 | 0 | 2 | 0% |
| `get_branch` | 54 | 0 | 0 | 0% |
| `get_pr` | 52 | 5 | 0 | 9.6% |
| `get_check_runs` | 48 | 2 | 0 | 4.2% |
| `glob` | 42 | 1 | 1 | 2.4% |
| `atoma_builtin__load_skill` | 33 | 0 | 0 | 0% |
| `web__fetch` | 22 | 1 | 0 | 4.5% |
| `write` | 21 | 0 | 0 | 0% |
| `check_merge_readiness` | 20 | 0 | 0 | 0% |
| `create_pr` | 19 | 9 | 0 | 47.4% |
| `get_pr_diff` | 17 | 1 | 0 | 5.9% |
| `list_prs` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `commit_and_push` | 14 | 2 | 0 | 14.3% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `request_close_issue` | 9 | 0 | 0 | 0% |
| `search_code` | 9 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `github__get_issue` | 5 | 0 | 0 | 0% |
| `launch_sub_agent` | 5 | 1 | 0 | 20% |
| `search_remote_code` | 5 | 1 | 0 | 20% |
| `sync_branch` | 5 | 1 | 0 | 20% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_issue_comments` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `create_root_issue` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `github__commit_and_push` | 1 | 0 | 0 | 0% |
| `github__create_pr` | 1 | 0 | 0 | 0% |
| `github__get_branch` | 1 | 0 | 0 | 0% |
| `github__get_check_runs` | 1 | 0 | 0 | 0% |
| `github__get_pr` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `github__list_prs` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,008 | 73.6% |
| `search` | 151 | 11% |
| `edit` | 108 | 7.9% |
| `open` | 59 | 4.3% |
| `verify` | 43 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 25 | 75.8% |
| `engineering/environment` | 2 | 6.1% |
| `engineering/secrets-in-a-check` | 2 | 6.1% |
| `research/web-search` | 2 | 6.1% |
| `delivery/pipeline-setup` | 1 | 3% |
| `docs/design-doc` | 1 | 3% |

## Last 30 days

52 sessions.

**Ran to an end without a report:** 18 of 50 sessions whose last run the core recorded as `completed` — 36%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**341,169,830 tokens** over 52 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 3,080,188 | 11,776,383 | 73,718,100 | 73,718,100 | 341,169,830 |
| messages per session | 175 | 528 | 715 | 715 | 12,442 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 25 | 48.1% |
| `reviewer` | 14 | 26.9% |
| `engineer` | 13 | 25% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `read` | 1,545 | 11 | 4 | 0.7% |
| `bash` | 1,369 | 33 | 31 | 2.4% |
| `grep` | 1,117 | 18 | 7 | 1.6% |
| `edit` | 365 | 3 | 0 | 0.8% |
| `fetch` | 230 | 27 | 0 | 11.7% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `list` | 147 | 1 | 0 | 0.7% |
| `get_issue` | 125 | 13 | 0 | 10.4% |
| `get_issue_comments` | 97 | 0 | 9 | 0% |
| `search_issues` | 69 | 0 | 2 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `glob` | 59 | 1 | 1 | 1.7% |
| `atoma_builtin__load_skill` | 58 | 0 | 0 | 0% |
| `get_branch` | 54 | 0 | 0 | 0% |
| `get_pr` | 52 | 5 | 0 | 9.6% |
| `write` | 50 | 0 | 0 | 0% |
| `get_check_runs` | 48 | 2 | 0 | 4.2% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `check_merge_readiness` | 20 | 0 | 0 | 0% |
| `create_pr` | 19 | 9 | 0 | 47.4% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `get_pr_diff` | 17 | 1 | 0 | 5.9% |
| `list_prs` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `commit_and_push` | 14 | 2 | 0 | 14.3% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `request_close_issue` | 9 | 0 | 0 | 0% |
| `search_code` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `launch_sub_agent` | 5 | 1 | 0 | 20% |
| `search_remote_code` | 5 | 1 | 0 | 20% |
| `sync_branch` | 5 | 1 | 0 | 20% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `create_root_issue` | 1 | 0 | 0 | 0% |
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
| `other` | 1,008 | 73.6% |
| `search` | 151 | 11% |
| `edit` | 108 | 7.9% |
| `open` | 59 | 4.3% |
| `verify` | 43 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 42 | 72.4% |
| `engineering/environment` | 6 | 10.3% |
| `delivery/pipeline-setup` | 5 | 8.6% |
| `engineering/secrets-in-a-check` | 2 | 3.4% |
| `research/web-search` | 2 | 3.4% |
| `docs/design-doc` | 1 | 1.7% |

## Last year

52 sessions.

**Ran to an end without a report:** 18 of 50 sessions whose last run the core recorded as `completed` — 36%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**341,169,830 tokens** over 52 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 3,080,188 | 11,776,383 | 73,718,100 | 73,718,100 | 341,169,830 |
| messages per session | 175 | 528 | 715 | 715 | 12,442 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 25 | 48.1% |
| `reviewer` | 14 | 26.9% |
| `engineer` | 13 | 25% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `read` | 1,545 | 11 | 4 | 0.7% |
| `bash` | 1,369 | 33 | 31 | 2.4% |
| `grep` | 1,117 | 18 | 7 | 1.6% |
| `edit` | 365 | 3 | 0 | 0.8% |
| `fetch` | 230 | 27 | 0 | 11.7% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `list` | 147 | 1 | 0 | 0.7% |
| `get_issue` | 125 | 13 | 0 | 10.4% |
| `get_issue_comments` | 97 | 0 | 9 | 0% |
| `search_issues` | 69 | 0 | 2 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `glob` | 59 | 1 | 1 | 1.7% |
| `atoma_builtin__load_skill` | 58 | 0 | 0 | 0% |
| `get_branch` | 54 | 0 | 0 | 0% |
| `get_pr` | 52 | 5 | 0 | 9.6% |
| `write` | 50 | 0 | 0 | 0% |
| `get_check_runs` | 48 | 2 | 0 | 4.2% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `check_merge_readiness` | 20 | 0 | 0 | 0% |
| `create_pr` | 19 | 9 | 0 | 47.4% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `get_pr_diff` | 17 | 1 | 0 | 5.9% |
| `list_prs` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `commit_and_push` | 14 | 2 | 0 | 14.3% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `request_close_issue` | 9 | 0 | 0 | 0% |
| `search_code` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `launch_sub_agent` | 5 | 1 | 0 | 20% |
| `search_remote_code` | 5 | 1 | 0 | 20% |
| `sync_branch` | 5 | 1 | 0 | 20% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `create_root_issue` | 1 | 0 | 0 | 0% |
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
| `other` | 1,008 | 73.6% |
| `search` | 151 | 11% |
| `edit` | 108 | 7.9% |
| `open` | 59 | 4.3% |
| `verify` | 43 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 42 | 72.4% |
| `engineering/environment` | 6 | 10.3% |
| `delivery/pipeline-setup` | 5 | 8.6% |
| `engineering/secrets-in-a-check` | 2 | 3.4% |
| `research/web-search` | 2 | 3.4% |
| `docs/design-doc` | 1 | 1.7% |

## All time

52 sessions.

**Ran to an end without a report:** 18 of 50 sessions whose last run the core recorded as `completed` — 36%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**341,169,830 tokens** over 52 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 3,080,188 | 11,776,383 | 73,718,100 | 73,718,100 | 341,169,830 |
| messages per session | 175 | 528 | 715 | 715 | 12,442 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 25 | 48.1% |
| `reviewer` | 14 | 26.9% |
| `engineer` | 13 | 25% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `read` | 1,545 | 11 | 4 | 0.7% |
| `bash` | 1,369 | 33 | 31 | 2.4% |
| `grep` | 1,117 | 18 | 7 | 1.6% |
| `edit` | 365 | 3 | 0 | 0.8% |
| `fetch` | 230 | 27 | 0 | 11.7% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `list` | 147 | 1 | 0 | 0.7% |
| `get_issue` | 125 | 13 | 0 | 10.4% |
| `get_issue_comments` | 97 | 0 | 9 | 0% |
| `search_issues` | 69 | 0 | 2 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `glob` | 59 | 1 | 1 | 1.7% |
| `atoma_builtin__load_skill` | 58 | 0 | 0 | 0% |
| `get_branch` | 54 | 0 | 0 | 0% |
| `get_pr` | 52 | 5 | 0 | 9.6% |
| `write` | 50 | 0 | 0 | 0% |
| `get_check_runs` | 48 | 2 | 0 | 4.2% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `check_merge_readiness` | 20 | 0 | 0 | 0% |
| `create_pr` | 19 | 9 | 0 | 47.4% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `get_pr_diff` | 17 | 1 | 0 | 5.9% |
| `list_prs` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `commit_and_push` | 14 | 2 | 0 | 14.3% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `request_close_issue` | 9 | 0 | 0 | 0% |
| `search_code` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `launch_sub_agent` | 5 | 1 | 0 | 20% |
| `search_remote_code` | 5 | 1 | 0 | 20% |
| `sync_branch` | 5 | 1 | 0 | 20% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `create_root_issue` | 1 | 0 | 0 | 0% |
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
| `other` | 1,008 | 73.6% |
| `search` | 151 | 11% |
| `edit` | 108 | 7.9% |
| `open` | 59 | 4.3% |
| `verify` | 43 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 42 | 72.4% |
| `engineering/environment` | 6 | 10.3% |
| `delivery/pipeline-setup` | 5 | 8.6% |
| `engineering/secrets-in-a-check` | 2 | 3.4% |
| `research/web-search` | 2 | 3.4% |
| `docs/design-doc` | 1 | 1.7% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
