# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-12.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 23 | 8.7% | 1,109 | 8,481 | 32 | 40.2 |
| Last 30 days | 46 | 6.5% | 1,109 | 10,246 | 36 | 36.1 |
| Last year | 46 | 6.5% | 1,109 | 10,246 | 36 | 36.1 |
| All time | 46 | 6.5% | 1,109 | 10,246 | 36 | 36.1 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 43 |
| `failed` | 3 |

## Last 7 days

13 sessions.

**Ran to an end without a report:** 5 of 12 sessions whose last run the core recorded as `completed` — 41.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**138,674,163 tokens** over 12 runs that reported them, **97.6% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,244,375 | 27,846,035 | 73,718,100 | 73,718,100 | 138,674,163 |
| messages per session | 208 | 705 | 715 | 715 | 3,806 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 6 | 46.2% |
| `reviewer` | 4 | 30.8% |
| `engineer` | 3 | 23.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 720 | 10 | 11 | 1.4% |
| `read` | 422 | 2 | 2 | 0.5% |
| `bash` | 367 | 7 | 9 | 1.9% |
| `grep` | 281 | 6 | 4 | 2.1% |
| `edit` | 98 | 1 | 0 | 1% |
| `web__fetch` | 78 | 7 | 0 | 9% |
| `list` | 41 | 0 | 0 | 0% |
| `github__get_issue` | 24 | 0 | 0 | 0% |
| `github__get_issue_comments` | 23 | 0 | 0 | 0% |
| `fetch` | 22 | 0 | 0 | 0% |
| `glob` | 21 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 20 | 0 | 0 | 0% |
| `search_issues` | 18 | 0 | 2 | 0% |
| `write` | 18 | 0 | 0 | 0% |
| `get_issue` | 13 | 0 | 0 | 0% |
| `github__get_branch` | 12 | 0 | 0 | 0% |
| `github__list_prs` | 12 | 0 | 0 | 0% |
| `search__search_issues` | 12 | 0 | 0 | 0% |
| `get_issue_comments` | 10 | 0 | 0 | 0% |
| `get_branch` | 9 | 0 | 0 | 0% |
| `github__get_pr` | 9 | 1 | 0 | 11.1% |
| `github__get_check_runs` | 8 | 0 | 0 | 0% |
| `get_pr` | 7 | 2 | 0 | 28.6% |
| `github__create_issue` | 7 | 0 | 0 | 0% |
| `create_issue` | 6 | 1 | 0 | 16.7% |
| `get_check_runs` | 6 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 5 | 0 | 0 | 0% |
| `commit_and_push` | 4 | 2 | 0 | 50% |
| `github__check_merge_readiness` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `create_pr` | 3 | 1 | 0 | 33.3% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `get_pr_reviews` | 3 | 0 | 0 | 0% |
| `github__commit_and_push` | 3 | 0 | 0 | 0% |
| `github__list_issues` | 3 | 0 | 0 | 0% |
| `probe` | 3 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 2 | 0 | 0 | 0% |
| `check_merge_readiness` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `get_pr_diff` | 2 | 0 | 0 | 0% |
| `github__create_pr` | 2 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 2 | 0 | 0 | 0% |
| `launch_sub_agent` | 2 | 0 | 0 | 0% |
| `list_pr_review_comments` | 2 | 0 | 0 | 0% |
| `list_prs` | 2 | 0 | 0 | 0% |
| `merge_pr` | 2 | 0 | 0 | 0% |
| `request_close_issue` | 2 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `delegate_readonly__run` | 1 | 0 | 0 | 0% |
| `delegate_readonly_large` | 1 | 0 | 1 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |
| `search_code` | 1 | 0 | 0 | 0% |
| `sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 298 | 81.2% |
| `edit` | 57 | 15.5% |
| `verify` | 8 | 2.2% |
| `search` | 3 | 0.8% |
| `open` | 1 | 0.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 12 | 60% |
| `engineering/environment` | 3 | 15% |
| `engineering/secrets-in-a-check` | 2 | 10% |
| `research/web-search` | 2 | 10% |
| `delivery/pipeline-setup` | 1 | 5% |

## Last 30 days

27 sessions.

**Ran to an end without a report:** 9 of 26 sessions whose last run the core recorded as `completed` — 34.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**208,599,987 tokens** over 24 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 16,895,165 | 73,718,100 | 73,718,100 | 208,599,987 |
| messages per session | 157 | 583 | 715 | 715 | 6,975 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 12 | 44.4% |
| `engineer` | 9 | 33.3% |
| `reviewer` | 6 | 22.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 871 | 3 | 3 | 0.3% |
| `grep` | 526 | 10 | 4 | 1.9% |
| `bash` | 367 | 7 | 9 | 1.9% |
| `edit` | 179 | 1 | 0 | 0.6% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 85 | 1 | 0 | 1.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `write` | 42 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `glob` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `fetch` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_issues` | 18 | 0 | 2 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `get_issue` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `get_issue_comments` | 10 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `get_branch` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `get_pr` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `create_issue` | 6 | 1 | 0 | 16.7% |
| `get_check_runs` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `commit_and_push` | 4 | 2 | 0 | 50% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_pr` | 3 | 1 | 0 | 33.3% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `get_pr_reviews` | 3 | 0 | 0 | 0% |
| `probe` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `check_merge_readiness` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `get_pr_diff` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `launch_sub_agent` | 2 | 0 | 0 | 0% |
| `list_pr_review_comments` | 2 | 0 | 0 | 0% |
| `list_prs` | 2 | 0 | 0 | 0% |
| `merge_pr` | 2 | 0 | 0 | 0% |
| `request_close_issue` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 1 | 0 | 1 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `search_code` | 1 | 0 | 0 | 0% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |
| `sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 298 | 81.2% |
| `edit` | 57 | 15.5% |
| `verify` | 8 | 2.2% |
| `search` | 3 | 0.8% |
| `open` | 1 | 0.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 24 | 61.5% |
| `engineering/environment` | 6 | 15.4% |
| `delivery/pipeline-setup` | 5 | 12.8% |
| `engineering/secrets-in-a-check` | 2 | 5.1% |
| `research/web-search` | 2 | 5.1% |

## Last year

27 sessions.

**Ran to an end without a report:** 9 of 26 sessions whose last run the core recorded as `completed` — 34.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**208,599,987 tokens** over 24 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 16,895,165 | 73,718,100 | 73,718,100 | 208,599,987 |
| messages per session | 157 | 583 | 715 | 715 | 6,975 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 12 | 44.4% |
| `engineer` | 9 | 33.3% |
| `reviewer` | 6 | 22.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 871 | 3 | 3 | 0.3% |
| `grep` | 526 | 10 | 4 | 1.9% |
| `bash` | 367 | 7 | 9 | 1.9% |
| `edit` | 179 | 1 | 0 | 0.6% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 85 | 1 | 0 | 1.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `write` | 42 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `glob` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `fetch` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_issues` | 18 | 0 | 2 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `get_issue` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `get_issue_comments` | 10 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `get_branch` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `get_pr` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `create_issue` | 6 | 1 | 0 | 16.7% |
| `get_check_runs` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `commit_and_push` | 4 | 2 | 0 | 50% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_pr` | 3 | 1 | 0 | 33.3% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `get_pr_reviews` | 3 | 0 | 0 | 0% |
| `probe` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `check_merge_readiness` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `get_pr_diff` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `launch_sub_agent` | 2 | 0 | 0 | 0% |
| `list_pr_review_comments` | 2 | 0 | 0 | 0% |
| `list_prs` | 2 | 0 | 0 | 0% |
| `merge_pr` | 2 | 0 | 0 | 0% |
| `request_close_issue` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 1 | 0 | 1 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `search_code` | 1 | 0 | 0 | 0% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |
| `sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 298 | 81.2% |
| `edit` | 57 | 15.5% |
| `verify` | 8 | 2.2% |
| `search` | 3 | 0.8% |
| `open` | 1 | 0.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 24 | 61.5% |
| `engineering/environment` | 6 | 15.4% |
| `delivery/pipeline-setup` | 5 | 12.8% |
| `engineering/secrets-in-a-check` | 2 | 5.1% |
| `research/web-search` | 2 | 5.1% |

## All time

27 sessions.

**Ran to an end without a report:** 9 of 26 sessions whose last run the core recorded as `completed` — 34.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**208,599,987 tokens** over 24 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 16,895,165 | 73,718,100 | 73,718,100 | 208,599,987 |
| messages per session | 157 | 583 | 715 | 715 | 6,975 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 12 | 44.4% |
| `engineer` | 9 | 33.3% |
| `reviewer` | 6 | 22.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 871 | 3 | 3 | 0.3% |
| `grep` | 526 | 10 | 4 | 1.9% |
| `bash` | 367 | 7 | 9 | 1.9% |
| `edit` | 179 | 1 | 0 | 0.6% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 85 | 1 | 0 | 1.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `write` | 42 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `glob` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `fetch` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_issues` | 18 | 0 | 2 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `get_issue` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `get_issue_comments` | 10 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `get_branch` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `get_pr` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `create_issue` | 6 | 1 | 0 | 16.7% |
| `get_check_runs` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `commit_and_push` | 4 | 2 | 0 | 50% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_pr` | 3 | 1 | 0 | 33.3% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `get_pr_reviews` | 3 | 0 | 0 | 0% |
| `probe` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `check_merge_readiness` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `get_pr_diff` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `launch_sub_agent` | 2 | 0 | 0 | 0% |
| `list_pr_review_comments` | 2 | 0 | 0 | 0% |
| `list_prs` | 2 | 0 | 0 | 0% |
| `merge_pr` | 2 | 0 | 0 | 0% |
| `request_close_issue` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 1 | 0 | 1 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `search_code` | 1 | 0 | 0 | 0% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |
| `sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 298 | 81.2% |
| `edit` | 57 | 15.5% |
| `verify` | 8 | 2.2% |
| `search` | 3 | 0.8% |
| `open` | 1 | 0.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 24 | 61.5% |
| `engineering/environment` | 6 | 15.4% |
| `delivery/pipeline-setup` | 5 | 12.8% |
| `engineering/secrets-in-a-check` | 2 | 5.1% |
| `research/web-search` | 2 | 5.1% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
