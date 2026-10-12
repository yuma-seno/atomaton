# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-12.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 31 | 6.5% | 1,059 | 8,481 | 32 | 34.2 |
| Last 30 days | 54 | 5.6% | 1,078 | 10,246 | 35 | 32.6 |
| Last year | 54 | 5.6% | 1,078 | 10,246 | 35 | 32.6 |
| All time | 54 | 5.6% | 1,078 | 10,246 | 35 | 32.6 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 51 |
| `failed` | 3 |

## Last 7 days

16 sessions.

**Ran to an end without a report:** 4 of 15 sessions whose last run the core recorded as `completed` — 26.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**183,690,864 tokens** over 18 runs that reported them, **97.6% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,244,375 | 28,119,706 | 73,718,100 | 73,718,100 | 183,690,864 |
| messages per session | 242 | 705 | 715 | 715 | 4,886 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 7 | 43.8% |
| `reviewer` | 5 | 31.3% |
| `engineer` | 4 | 25% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 723 | 20 | 16 | 2.8% |
| `shell__shell_execute` | 720 | 10 | 11 | 1.4% |
| `read` | 479 | 3 | 3 | 0.6% |
| `grep` | 333 | 7 | 4 | 2.1% |
| `edit` | 113 | 1 | 0 | 0.9% |
| `web__fetch` | 78 | 7 | 0 | 9% |
| `fetch` | 70 | 0 | 0 | 0% |
| `list` | 47 | 0 | 0 | 0% |
| `get_issue` | 27 | 0 | 0 | 0% |
| `get_issue_comments` | 27 | 0 | 1 | 0% |
| `get_branch` | 24 | 0 | 0 | 0% |
| `github__get_issue` | 24 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 23 | 0 | 0 | 0% |
| `github__get_issue_comments` | 23 | 0 | 0 | 0% |
| `glob` | 23 | 0 | 0 | 0% |
| `get_pr` | 21 | 3 | 0 | 14.3% |
| `write` | 21 | 0 | 0 | 0% |
| `search_issues` | 19 | 0 | 2 | 0% |
| `get_check_runs` | 16 | 1 | 0 | 6.3% |
| `github__get_branch` | 12 | 0 | 0 | 0% |
| `github__list_prs` | 12 | 0 | 0 | 0% |
| `search__search_issues` | 12 | 0 | 0 | 0% |
| `github__get_pr` | 9 | 1 | 0 | 11.1% |
| `check_merge_readiness` | 8 | 0 | 0 | 0% |
| `github__get_check_runs` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `create_issue` | 7 | 1 | 0 | 14.3% |
| `get_pr_diff` | 7 | 1 | 0 | 14.3% |
| `github__create_issue` | 7 | 0 | 0 | 0% |
| `commit_and_push` | 6 | 2 | 0 | 33.3% |
| `create_pr` | 5 | 2 | 0 | 40% |
| `get_pr_reviews` | 5 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 5 | 0 | 0 | 0% |
| `list_prs` | 5 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `list_pr_review_comments` | 4 | 0 | 0 | 0% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `github__commit_and_push` | 3 | 0 | 0 | 0% |
| `github__list_issues` | 3 | 0 | 0 | 0% |
| `launch_sub_agent` | 3 | 1 | 0 | 33.3% |
| `merge_pr` | 3 | 0 | 0 | 0% |
| `request_close_issue` | 3 | 0 | 0 | 0% |
| `sync_branch` | 3 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 2 | 0 | 0 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__create_pr` | 2 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 2 | 0 | 0 | 0% |
| `list_issues` | 2 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `delegate_readonly__run` | 1 | 0 | 0 | 0% |
| `delegate_readonly_large` | 1 | 0 | 1 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |
| `search_code` | 1 | 0 | 0 | 0% |
| `search_remote_code` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 583 | 80.6% |
| `edit` | 78 | 10.8% |
| `open` | 26 | 3.6% |
| `search` | 23 | 3.2% |
| `verify` | 13 | 1.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 15 | 65.2% |
| `engineering/environment` | 3 | 13% |
| `engineering/secrets-in-a-check` | 2 | 8.7% |
| `research/web-search` | 2 | 8.7% |
| `delivery/pipeline-setup` | 1 | 4.3% |

## Last 30 days

30 sessions.

**Ran to an end without a report:** 8 of 29 sessions whose last run the core recorded as `completed` — 27.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**253,616,688 tokens** over 30 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 27,846,035 | 73,718,100 | 73,718,100 | 253,616,688 |
| messages per session | 219 | 583 | 715 | 715 | 8,055 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 13 | 43.3% |
| `engineer` | 10 | 33.3% |
| `reviewer` | 7 | 23.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 928 | 4 | 4 | 0.4% |
| `bash` | 723 | 20 | 16 | 2.8% |
| `grep` | 578 | 11 | 4 | 1.9% |
| `edit` | 194 | 1 | 0 | 0.5% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 91 | 1 | 0 | 1.1% |
| `fetch` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 45 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 42 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `glob` | 33 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `get_issue` | 27 | 0 | 0 | 0% |
| `get_issue_comments` | 27 | 0 | 1 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `get_branch` | 24 | 0 | 0 | 0% |
| `get_pr` | 21 | 3 | 0 | 14.3% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_issues` | 19 | 0 | 2 | 0% |
| `get_check_runs` | 16 | 1 | 0 | 6.3% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `check_merge_readiness` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `create_issue` | 7 | 1 | 0 | 14.3% |
| `get_pr_diff` | 7 | 1 | 0 | 14.3% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `commit_and_push` | 6 | 2 | 0 | 33.3% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `create_pr` | 5 | 2 | 0 | 40% |
| `get_pr_reviews` | 5 | 0 | 0 | 0% |
| `list_prs` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `list_pr_review_comments` | 4 | 0 | 0 | 0% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `launch_sub_agent` | 3 | 1 | 0 | 33.3% |
| `merge_pr` | 3 | 0 | 0 | 0% |
| `request_close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `sync_branch` | 3 | 0 | 0 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `list_issues` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 1 | 0 | 1 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `search_code` | 1 | 0 | 0 | 0% |
| `search_remote_code` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 583 | 80.6% |
| `edit` | 78 | 10.8% |
| `open` | 26 | 3.6% |
| `search` | 23 | 3.2% |
| `verify` | 13 | 1.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 27 | 64.3% |
| `engineering/environment` | 6 | 14.3% |
| `delivery/pipeline-setup` | 5 | 11.9% |
| `engineering/secrets-in-a-check` | 2 | 4.8% |
| `research/web-search` | 2 | 4.8% |

## Last year

30 sessions.

**Ran to an end without a report:** 8 of 29 sessions whose last run the core recorded as `completed` — 27.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**253,616,688 tokens** over 30 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 27,846,035 | 73,718,100 | 73,718,100 | 253,616,688 |
| messages per session | 219 | 583 | 715 | 715 | 8,055 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 13 | 43.3% |
| `engineer` | 10 | 33.3% |
| `reviewer` | 7 | 23.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 928 | 4 | 4 | 0.4% |
| `bash` | 723 | 20 | 16 | 2.8% |
| `grep` | 578 | 11 | 4 | 1.9% |
| `edit` | 194 | 1 | 0 | 0.5% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 91 | 1 | 0 | 1.1% |
| `fetch` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 45 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 42 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `glob` | 33 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `get_issue` | 27 | 0 | 0 | 0% |
| `get_issue_comments` | 27 | 0 | 1 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `get_branch` | 24 | 0 | 0 | 0% |
| `get_pr` | 21 | 3 | 0 | 14.3% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_issues` | 19 | 0 | 2 | 0% |
| `get_check_runs` | 16 | 1 | 0 | 6.3% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `check_merge_readiness` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `create_issue` | 7 | 1 | 0 | 14.3% |
| `get_pr_diff` | 7 | 1 | 0 | 14.3% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `commit_and_push` | 6 | 2 | 0 | 33.3% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `create_pr` | 5 | 2 | 0 | 40% |
| `get_pr_reviews` | 5 | 0 | 0 | 0% |
| `list_prs` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `list_pr_review_comments` | 4 | 0 | 0 | 0% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `launch_sub_agent` | 3 | 1 | 0 | 33.3% |
| `merge_pr` | 3 | 0 | 0 | 0% |
| `request_close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `sync_branch` | 3 | 0 | 0 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `list_issues` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 1 | 0 | 1 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `search_code` | 1 | 0 | 0 | 0% |
| `search_remote_code` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 583 | 80.6% |
| `edit` | 78 | 10.8% |
| `open` | 26 | 3.6% |
| `search` | 23 | 3.2% |
| `verify` | 13 | 1.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 27 | 64.3% |
| `engineering/environment` | 6 | 14.3% |
| `delivery/pipeline-setup` | 5 | 11.9% |
| `engineering/secrets-in-a-check` | 2 | 4.8% |
| `research/web-search` | 2 | 4.8% |

## All time

30 sessions.

**Ran to an end without a report:** 8 of 29 sessions whose last run the core recorded as `completed` — 27.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**253,616,688 tokens** over 30 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,260,768 | 27,846,035 | 73,718,100 | 73,718,100 | 253,616,688 |
| messages per session | 219 | 583 | 715 | 715 | 8,055 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 13 | 43.3% |
| `engineer` | 10 | 33.3% |
| `reviewer` | 7 | 23.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 928 | 4 | 4 | 0.4% |
| `bash` | 723 | 20 | 16 | 2.8% |
| `grep` | 578 | 11 | 4 | 1.9% |
| `edit` | 194 | 1 | 0 | 0.5% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 91 | 1 | 0 | 1.1% |
| `fetch` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 45 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 42 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `glob` | 33 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `get_issue` | 27 | 0 | 0 | 0% |
| `get_issue_comments` | 27 | 0 | 1 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `get_branch` | 24 | 0 | 0 | 0% |
| `get_pr` | 21 | 3 | 0 | 14.3% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_issues` | 19 | 0 | 2 | 0% |
| `get_check_runs` | 16 | 1 | 0 | 6.3% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `check_merge_readiness` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `create_issue` | 7 | 1 | 0 | 14.3% |
| `get_pr_diff` | 7 | 1 | 0 | 14.3% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `commit_and_push` | 6 | 2 | 0 | 33.3% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `create_pr` | 5 | 2 | 0 | 40% |
| `get_pr_reviews` | 5 | 0 | 0 | 0% |
| `list_prs` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `list_pr_review_comments` | 4 | 0 | 0 | 0% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `launch_sub_agent` | 3 | 1 | 0 | 33.3% |
| `merge_pr` | 3 | 0 | 0 | 0% |
| `request_close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `sync_branch` | 3 | 0 | 0 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `list_issues` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 1 | 0 | 1 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `search_code` | 1 | 0 | 0 | 0% |
| `search_remote_code` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 583 | 80.6% |
| `edit` | 78 | 10.8% |
| `open` | 26 | 3.6% |
| `search` | 23 | 3.2% |
| `verify` | 13 | 1.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 27 | 64.3% |
| `engineering/environment` | 6 | 14.3% |
| `delivery/pipeline-setup` | 5 | 11.9% |
| `engineering/secrets-in-a-check` | 2 | 4.8% |
| `research/web-search` | 2 | 4.8% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
