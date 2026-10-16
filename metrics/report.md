# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-16.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 50 | 10% | 1,152 | 8,481 | 25 | 41.3 |
| Last 30 days | 87 | 9.2% | 1,123 | 10,246 | 33 | 36.1 |
| Last year | 87 | 9.2% | 1,123 | 10,246 | 33 | 36.1 |
| All time | 87 | 9.2% | 1,123 | 10,246 | 33 | 36.1 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 79 |
| `failed` | 8 |

## Last 7 days

28 sessions.

**Ran to an end without a report:** 9 of 27 sessions whose last run the core recorded as `completed` — 33.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**212,876,799 tokens** over 26 runs that reported them, **97.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 2,844,911 | 28,119,706 | 73,718,100 | 73,718,100 | 212,876,799 |
| messages per session | 182 | 571 | 715 | 715 | 7,037 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 13 | 46.4% |
| `reviewer` | 9 | 32.1% |
| `engineer` | 6 | 21.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,325 | 32 | 30 | 2.4% |
| `read` | 780 | 7 | 2 | 0.9% |
| `grep` | 607 | 10 | 3 | 1.6% |
| `shell__shell_execute` | 279 | 3 | 1 | 1.1% |
| `edit` | 258 | 3 | 0 | 1.2% |
| `fetch` | 203 | 26 | 0 | 12.8% |
| `get_issue` | 107 | 13 | 0 | 12.1% |
| `get_issue_comments` | 80 | 0 | 8 | 0% |
| `list` | 77 | 0 | 0 | 0% |
| `search_issues` | 67 | 0 | 2 | 0% |
| `get_branch` | 52 | 0 | 0 | 0% |
| `get_pr` | 48 | 5 | 0 | 10.4% |
| `get_check_runs` | 42 | 2 | 0 | 4.8% |
| `glob` | 38 | 1 | 1 | 2.6% |
| `atoma_builtin__load_skill` | 32 | 0 | 0 | 0% |
| `web__fetch` | 22 | 2 | 0 | 9.1% |
| `write` | 21 | 0 | 0 | 0% |
| `check_merge_readiness` | 19 | 0 | 0 | 0% |
| `create_pr` | 16 | 7 | 0 | 43.8% |
| `get_pr_diff` | 16 | 1 | 0 | 6.3% |
| `list_prs` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `commit_and_push` | 14 | 2 | 0 | 14.3% |
| `delegate_readonly` | 11 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `search_code` | 7 | 0 | 0 | 0% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `request_close_issue` | 6 | 0 | 0 | 0% |
| `github__get_issue` | 5 | 0 | 0 | 0% |
| `launch_sub_agent` | 5 | 1 | 0 | 20% |
| `search_remote_code` | 5 | 1 | 0 | 20% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_issue_comments` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 1 | 0 | 25% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
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
| `other` | 988 | 74.6% |
| `search` | 140 | 10.6% |
| `edit` | 102 | 7.7% |
| `open` | 57 | 4.3% |
| `verify` | 38 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 24 | 75% |
| `engineering/environment` | 2 | 6.3% |
| `engineering/secrets-in-a-check` | 2 | 6.3% |
| `research/web-search` | 2 | 6.3% |
| `delivery/pipeline-setup` | 1 | 3.1% |
| `docs/design-doc` | 1 | 3.1% |

## Last 30 days

48 sessions.

**Ran to an end without a report:** 15 of 46 sessions whose last run the core recorded as `completed` — 32.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**332,695,476 tokens** over 46 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,068,104 | 16,895,165 | 73,718,100 | 73,718,100 | 332,695,476 |
| messages per session | 168 | 557 | 715 | 715 | 11,718 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 22 | 45.8% |
| `engineer` | 13 | 27.1% |
| `reviewer` | 13 | 27.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 1,431 | 10 | 4 | 0.7% |
| `bash` | 1,325 | 32 | 30 | 2.4% |
| `grep` | 991 | 18 | 7 | 1.8% |
| `edit` | 365 | 3 | 0 | 0.8% |
| `fetch` | 203 | 26 | 0 | 12.8% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 134 | 1 | 0 | 0.7% |
| `get_issue` | 107 | 13 | 0 | 12.1% |
| `get_issue_comments` | 80 | 0 | 8 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `search_issues` | 67 | 0 | 2 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 57 | 0 | 0 | 0% |
| `glob` | 55 | 1 | 1 | 1.8% |
| `get_branch` | 52 | 0 | 0 | 0% |
| `write` | 50 | 0 | 0 | 0% |
| `get_pr` | 48 | 5 | 0 | 10.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_check_runs` | 42 | 2 | 0 | 4.8% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `check_merge_readiness` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_pr` | 16 | 7 | 0 | 43.8% |
| `get_pr_diff` | 16 | 1 | 0 | 6.3% |
| `list_prs` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `commit_and_push` | 14 | 2 | 0 | 14.3% |
| `delegate_readonly` | 11 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `search_code` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `request_close_issue` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `launch_sub_agent` | 5 | 1 | 0 | 20% |
| `search_remote_code` | 5 | 1 | 0 | 20% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 1 | 0 | 25% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
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
| `other` | 988 | 74.6% |
| `search` | 140 | 10.6% |
| `edit` | 102 | 7.7% |
| `open` | 57 | 4.3% |
| `verify` | 38 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 41 | 71.9% |
| `engineering/environment` | 6 | 10.5% |
| `delivery/pipeline-setup` | 5 | 8.8% |
| `engineering/secrets-in-a-check` | 2 | 3.5% |
| `research/web-search` | 2 | 3.5% |
| `docs/design-doc` | 1 | 1.8% |

## Last year

48 sessions.

**Ran to an end without a report:** 15 of 46 sessions whose last run the core recorded as `completed` — 32.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**332,695,476 tokens** over 46 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,068,104 | 16,895,165 | 73,718,100 | 73,718,100 | 332,695,476 |
| messages per session | 168 | 557 | 715 | 715 | 11,718 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 22 | 45.8% |
| `engineer` | 13 | 27.1% |
| `reviewer` | 13 | 27.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 1,431 | 10 | 4 | 0.7% |
| `bash` | 1,325 | 32 | 30 | 2.4% |
| `grep` | 991 | 18 | 7 | 1.8% |
| `edit` | 365 | 3 | 0 | 0.8% |
| `fetch` | 203 | 26 | 0 | 12.8% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 134 | 1 | 0 | 0.7% |
| `get_issue` | 107 | 13 | 0 | 12.1% |
| `get_issue_comments` | 80 | 0 | 8 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `search_issues` | 67 | 0 | 2 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 57 | 0 | 0 | 0% |
| `glob` | 55 | 1 | 1 | 1.8% |
| `get_branch` | 52 | 0 | 0 | 0% |
| `write` | 50 | 0 | 0 | 0% |
| `get_pr` | 48 | 5 | 0 | 10.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_check_runs` | 42 | 2 | 0 | 4.8% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `check_merge_readiness` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_pr` | 16 | 7 | 0 | 43.8% |
| `get_pr_diff` | 16 | 1 | 0 | 6.3% |
| `list_prs` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `commit_and_push` | 14 | 2 | 0 | 14.3% |
| `delegate_readonly` | 11 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `search_code` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `request_close_issue` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `launch_sub_agent` | 5 | 1 | 0 | 20% |
| `search_remote_code` | 5 | 1 | 0 | 20% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 1 | 0 | 25% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
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
| `other` | 988 | 74.6% |
| `search` | 140 | 10.6% |
| `edit` | 102 | 7.7% |
| `open` | 57 | 4.3% |
| `verify` | 38 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 41 | 71.9% |
| `engineering/environment` | 6 | 10.5% |
| `delivery/pipeline-setup` | 5 | 8.8% |
| `engineering/secrets-in-a-check` | 2 | 3.5% |
| `research/web-search` | 2 | 3.5% |
| `docs/design-doc` | 1 | 1.8% |

## All time

48 sessions.

**Ran to an end without a report:** 15 of 46 sessions whose last run the core recorded as `completed` — 32.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**332,695,476 tokens** over 46 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,068,104 | 16,895,165 | 73,718,100 | 73,718,100 | 332,695,476 |
| messages per session | 168 | 557 | 715 | 715 | 11,718 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 22 | 45.8% |
| `engineer` | 13 | 27.1% |
| `reviewer` | 13 | 27.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 1,431 | 10 | 4 | 0.7% |
| `bash` | 1,325 | 32 | 30 | 2.4% |
| `grep` | 991 | 18 | 7 | 1.8% |
| `edit` | 365 | 3 | 0 | 0.8% |
| `fetch` | 203 | 26 | 0 | 12.8% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 134 | 1 | 0 | 0.7% |
| `get_issue` | 107 | 13 | 0 | 12.1% |
| `get_issue_comments` | 80 | 0 | 8 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `search_issues` | 67 | 0 | 2 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 57 | 0 | 0 | 0% |
| `glob` | 55 | 1 | 1 | 1.8% |
| `get_branch` | 52 | 0 | 0 | 0% |
| `write` | 50 | 0 | 0 | 0% |
| `get_pr` | 48 | 5 | 0 | 10.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_check_runs` | 42 | 2 | 0 | 4.8% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `check_merge_readiness` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_pr` | 16 | 7 | 0 | 43.8% |
| `get_pr_diff` | 16 | 1 | 0 | 6.3% |
| `list_prs` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `commit_and_push` | 14 | 2 | 0 | 14.3% |
| `delegate_readonly` | 11 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `search_code` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `request_close_issue` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `launch_sub_agent` | 5 | 1 | 0 | 20% |
| `search_remote_code` | 5 | 1 | 0 | 20% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 1 | 0 | 25% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
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
| `other` | 988 | 74.6% |
| `search` | 140 | 10.6% |
| `edit` | 102 | 7.7% |
| `open` | 57 | 4.3% |
| `verify` | 38 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 41 | 71.9% |
| `engineering/environment` | 6 | 10.5% |
| `delivery/pipeline-setup` | 5 | 8.8% |
| `engineering/secrets-in-a-check` | 2 | 3.5% |
| `research/web-search` | 2 | 3.5% |
| `docs/design-doc` | 1 | 1.8% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
