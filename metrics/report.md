# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-13.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 35 | 8.6% | 1,109 | 8,481 | 33 | 34.2 |
| Last 30 days | 60 | 6.7% | 1,123 | 10,246 | 35 | 34.2 |
| Last year | 60 | 6.7% | 1,123 | 10,246 | 35 | 34.2 |
| All time | 60 | 6.7% | 1,123 | 10,246 | 35 | 34.2 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 56 |
| `failed` | 4 |

## Last 7 days

19 sessions.

**Ran to an end without a report:** 6 of 18 sessions whose last run the core recorded as `completed` — 33.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**185,615,526 tokens** over 19 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 3,311,047 | 28,119,706 | 73,718,100 | 73,718,100 | 185,615,526 |
| messages per session | 168 | 705 | 715 | 715 | 4,995 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 9 | 47.4% |
| `reviewer` | 6 | 31.6% |
| `engineer` | 4 | 21.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 788 | 24 | 22 | 3% |
| `shell__shell_execute` | 555 | 4 | 9 | 0.7% |
| `read` | 523 | 6 | 3 | 1.1% |
| `grep` | 406 | 8 | 7 | 2% |
| `edit` | 125 | 1 | 0 | 0.8% |
| `fetch` | 73 | 2 | 0 | 2.7% |
| `list` | 58 | 0 | 0 | 0% |
| `get_issue_comments` | 47 | 0 | 5 | 0% |
| `get_issue` | 45 | 0 | 0 | 0% |
| `glob` | 37 | 0 | 1 | 0% |
| `get_branch` | 35 | 0 | 0 | 0% |
| `web__fetch` | 32 | 6 | 0 | 18.8% |
| `get_pr` | 28 | 3 | 0 | 10.7% |
| `atoma_builtin__load_skill` | 24 | 0 | 0 | 0% |
| `search_issues` | 24 | 0 | 2 | 0% |
| `get_check_runs` | 21 | 2 | 0 | 9.5% |
| `write` | 19 | 0 | 0 | 0% |
| `github__get_issue_comments` | 12 | 0 | 0 | 0% |
| `check_merge_readiness` | 11 | 0 | 0 | 0% |
| `create_issue` | 10 | 2 | 0 | 20% |
| `get_pr_diff` | 10 | 1 | 0 | 10% |
| `github__get_issue` | 10 | 0 | 0 | 0% |
| `list_prs` | 10 | 0 | 0 | 0% |
| `commit_and_push` | 8 | 2 | 0 | 25% |
| `create_pr` | 8 | 3 | 0 | 37.5% |
| `probe` | 8 | 0 | 0 | 0% |
| `get_pr_reviews` | 7 | 0 | 0 | 0% |
| `github__get_check_runs` | 7 | 0 | 0 | 0% |
| `list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `delegate_readonly` | 5 | 0 | 0 | 0% |
| `github__get_branch` | 5 | 0 | 0 | 0% |
| `github__get_pr` | 5 | 0 | 0 | 0% |
| `github__list_prs` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `launch_sub_agent` | 4 | 1 | 0 | 25% |
| `list_issues` | 4 | 0 | 0 | 0% |
| `search__search_issues` | 4 | 0 | 0 | 0% |
| `search_code` | 4 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 3 | 0 | 0 | 0% |
| `merge_pr` | 3 | 0 | 0 | 0% |
| `request_close_issue` | 3 | 0 | 0 | 0% |
| `sync_branch` | 3 | 0 | 0 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `github__commit_and_push` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__create_pr` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |
| `search_remote_code` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 606 | 76.9% |
| `edit` | 78 | 9.9% |
| `search` | 44 | 5.6% |
| `open` | 41 | 5.2% |
| `verify` | 19 | 2.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 16 | 66.7% |
| `engineering/environment` | 3 | 12.5% |
| `engineering/secrets-in-a-check` | 2 | 8.3% |
| `research/web-search` | 2 | 8.3% |
| `delivery/pipeline-setup` | 1 | 4.2% |

## Last 30 days

35 sessions.

**Ran to an end without a report:** 11 of 34 sessions whose last run the core recorded as `completed` — 32.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**258,588,867 tokens** over 32 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,244,375 | 16,895,165 | 73,718,100 | 73,718,100 | 258,588,867 |
| messages per session | 162 | 557 | 715 | 715 | 8,671 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 16 | 45.7% |
| `engineer` | 10 | 28.6% |
| `reviewer` | 9 | 25.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 1,009 | 7 | 4 | 0.7% |
| `bash` | 788 | 24 | 22 | 3% |
| `grep` | 667 | 12 | 7 | 1.8% |
| `edit` | 206 | 1 | 0 | 0.5% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 107 | 1 | 0 | 0.9% |
| `fetch` | 73 | 2 | 0 | 2.7% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 48 | 0 | 0 | 0% |
| `get_issue_comments` | 47 | 0 | 5 | 0% |
| `glob` | 47 | 0 | 1 | 0% |
| `atoma_builtin__load_skill` | 45 | 0 | 0 | 0% |
| `get_issue` | 45 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_branch` | 35 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `get_pr` | 28 | 3 | 0 | 10.7% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_issues` | 24 | 0 | 2 | 0% |
| `get_check_runs` | 21 | 2 | 0 | 9.5% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `check_merge_readiness` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `create_issue` | 10 | 2 | 0 | 20% |
| `get_pr_diff` | 10 | 1 | 0 | 10% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_prs` | 10 | 0 | 0 | 0% |
| `commit_and_push` | 8 | 2 | 0 | 25% |
| `create_pr` | 8 | 3 | 0 | 37.5% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `get_pr_reviews` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `launch_sub_agent` | 4 | 1 | 0 | 25% |
| `list_issues` | 4 | 0 | 0 | 0% |
| `search_code` | 4 | 0 | 0 | 0% |
| `merge_pr` | 3 | 0 | 0 | 0% |
| `request_close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `sync_branch` | 3 | 0 | 0 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `search_remote_code` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 606 | 76.9% |
| `edit` | 78 | 9.9% |
| `search` | 44 | 5.6% |
| `open` | 41 | 5.2% |
| `verify` | 19 | 2.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 30 | 66.7% |
| `engineering/environment` | 6 | 13.3% |
| `delivery/pipeline-setup` | 5 | 11.1% |
| `engineering/secrets-in-a-check` | 2 | 4.4% |
| `research/web-search` | 2 | 4.4% |

## Last year

35 sessions.

**Ran to an end without a report:** 11 of 34 sessions whose last run the core recorded as `completed` — 32.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**258,588,867 tokens** over 32 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,244,375 | 16,895,165 | 73,718,100 | 73,718,100 | 258,588,867 |
| messages per session | 162 | 557 | 715 | 715 | 8,671 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 16 | 45.7% |
| `engineer` | 10 | 28.6% |
| `reviewer` | 9 | 25.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 1,009 | 7 | 4 | 0.7% |
| `bash` | 788 | 24 | 22 | 3% |
| `grep` | 667 | 12 | 7 | 1.8% |
| `edit` | 206 | 1 | 0 | 0.5% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 107 | 1 | 0 | 0.9% |
| `fetch` | 73 | 2 | 0 | 2.7% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 48 | 0 | 0 | 0% |
| `get_issue_comments` | 47 | 0 | 5 | 0% |
| `glob` | 47 | 0 | 1 | 0% |
| `atoma_builtin__load_skill` | 45 | 0 | 0 | 0% |
| `get_issue` | 45 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_branch` | 35 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `get_pr` | 28 | 3 | 0 | 10.7% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_issues` | 24 | 0 | 2 | 0% |
| `get_check_runs` | 21 | 2 | 0 | 9.5% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `check_merge_readiness` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `create_issue` | 10 | 2 | 0 | 20% |
| `get_pr_diff` | 10 | 1 | 0 | 10% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_prs` | 10 | 0 | 0 | 0% |
| `commit_and_push` | 8 | 2 | 0 | 25% |
| `create_pr` | 8 | 3 | 0 | 37.5% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `get_pr_reviews` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `launch_sub_agent` | 4 | 1 | 0 | 25% |
| `list_issues` | 4 | 0 | 0 | 0% |
| `search_code` | 4 | 0 | 0 | 0% |
| `merge_pr` | 3 | 0 | 0 | 0% |
| `request_close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `sync_branch` | 3 | 0 | 0 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `search_remote_code` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 606 | 76.9% |
| `edit` | 78 | 9.9% |
| `search` | 44 | 5.6% |
| `open` | 41 | 5.2% |
| `verify` | 19 | 2.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 30 | 66.7% |
| `engineering/environment` | 6 | 13.3% |
| `delivery/pipeline-setup` | 5 | 11.1% |
| `engineering/secrets-in-a-check` | 2 | 4.4% |
| `research/web-search` | 2 | 4.4% |

## All time

35 sessions.

**Ran to an end without a report:** 11 of 34 sessions whose last run the core recorded as `completed` — 32.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**258,588,867 tokens** over 32 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,244,375 | 16,895,165 | 73,718,100 | 73,718,100 | 258,588,867 |
| messages per session | 162 | 557 | 715 | 715 | 8,671 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 16 | 45.7% |
| `engineer` | 10 | 28.6% |
| `reviewer` | 9 | 25.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 1,009 | 7 | 4 | 0.7% |
| `bash` | 788 | 24 | 22 | 3% |
| `grep` | 667 | 12 | 7 | 1.8% |
| `edit` | 206 | 1 | 0 | 0.5% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 107 | 1 | 0 | 0.9% |
| `fetch` | 73 | 2 | 0 | 2.7% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 48 | 0 | 0 | 0% |
| `get_issue_comments` | 47 | 0 | 5 | 0% |
| `glob` | 47 | 0 | 1 | 0% |
| `atoma_builtin__load_skill` | 45 | 0 | 0 | 0% |
| `get_issue` | 45 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_branch` | 35 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `get_pr` | 28 | 3 | 0 | 10.7% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_issues` | 24 | 0 | 2 | 0% |
| `get_check_runs` | 21 | 2 | 0 | 9.5% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `check_merge_readiness` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `create_issue` | 10 | 2 | 0 | 20% |
| `get_pr_diff` | 10 | 1 | 0 | 10% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_prs` | 10 | 0 | 0 | 0% |
| `commit_and_push` | 8 | 2 | 0 | 25% |
| `create_pr` | 8 | 3 | 0 | 37.5% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `get_pr_reviews` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `launch_sub_agent` | 4 | 1 | 0 | 25% |
| `list_issues` | 4 | 0 | 0 | 0% |
| `search_code` | 4 | 0 | 0 | 0% |
| `merge_pr` | 3 | 0 | 0 | 0% |
| `request_close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `sync_branch` | 3 | 0 | 0 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `search_remote_code` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 606 | 76.9% |
| `edit` | 78 | 9.9% |
| `search` | 44 | 5.6% |
| `open` | 41 | 5.2% |
| `verify` | 19 | 2.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 30 | 66.7% |
| `engineering/environment` | 6 | 13.3% |
| `delivery/pipeline-setup` | 5 | 11.1% |
| `engineering/secrets-in-a-check` | 2 | 4.4% |
| `research/web-search` | 2 | 4.4% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
