# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-16.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 40 | 5% | 1,115 | 8,481 | 29 | 37.8 |
| Last 30 days | 77 | 6.5% | 1,115 | 10,246 | 34 | 35.0 |
| Last year | 77 | 6.5% | 1,115 | 10,246 | 34 | 35.0 |
| All time | 77 | 6.5% | 1,115 | 10,246 | 34 | 35.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 72 |
| `failed` | 5 |

## Last 7 days

25 sessions.

**Ran to an end without a report:** 7 of 24 sessions whose last run the core recorded as `completed` — 29.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**203,120,636 tokens** over 22 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 3,311,047 | 28,119,706 | 73,718,100 | 73,718,100 | 203,120,636 |
| messages per session | 168 | 571 | 715 | 715 | 5,846 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 12 | 48% |
| `reviewer` | 8 | 32% |
| `engineer` | 5 | 20% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,088 | 28 | 27 | 2.6% |
| `read` | 617 | 6 | 2 | 1% |
| `grep` | 451 | 9 | 3 | 2% |
| `shell__shell_execute` | 279 | 3 | 1 | 1.1% |
| `edit` | 209 | 2 | 0 | 1% |
| `fetch` | 177 | 26 | 0 | 14.7% |
| `get_issue` | 97 | 13 | 0 | 13.4% |
| `get_issue_comments` | 72 | 0 | 8 | 0% |
| `list` | 64 | 0 | 0 | 0% |
| `search_issues` | 64 | 0 | 2 | 0% |
| `get_branch` | 45 | 0 | 0 | 0% |
| `get_pr` | 45 | 5 | 0 | 11.1% |
| `get_check_runs` | 36 | 2 | 0 | 5.6% |
| `glob` | 35 | 0 | 1 | 0% |
| `atoma_builtin__load_skill` | 28 | 0 | 0 | 0% |
| `web__fetch` | 22 | 2 | 0 | 9.1% |
| `write` | 21 | 0 | 0 | 0% |
| `check_merge_readiness` | 18 | 0 | 0 | 0% |
| `list_prs` | 16 | 0 | 0 | 0% |
| `create_issue` | 14 | 4 | 0 | 28.6% |
| `create_pr` | 14 | 6 | 0 | 42.9% |
| `get_pr_diff` | 14 | 1 | 0 | 7.1% |
| `commit_and_push` | 12 | 2 | 0 | 16.7% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `delegate_readonly` | 9 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `request_close_issue` | 6 | 0 | 0 | 0% |
| `search_code` | 6 | 0 | 0 | 0% |
| `github__get_issue` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_issue_comments` | 4 | 0 | 0 | 0% |
| `launch_sub_agent` | 4 | 1 | 0 | 25% |
| `sync_branch` | 4 | 1 | 0 | 25% |
| `search_remote_code` | 3 | 1 | 0 | 33.3% |
| `close_issue` | 2 | 0 | 0 | 0% |
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
| `other` | 826 | 75.9% |
| `edit` | 93 | 8.5% |
| `search` | 88 | 8.1% |
| `open` | 49 | 4.5% |
| `verify` | 32 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 20 | 71.4% |
| `engineering/environment` | 2 | 7.1% |
| `engineering/secrets-in-a-check` | 2 | 7.1% |
| `research/web-search` | 2 | 7.1% |
| `delivery/pipeline-setup` | 1 | 3.6% |
| `docs/design-doc` | 1 | 3.6% |

## Last 30 days

45 sessions.

**Ran to an end without a report:** 13 of 43 sessions whose last run the core recorded as `completed` — 30.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**322,939,313 tokens** over 42 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,244,375 | 16,895,165 | 73,718,100 | 73,718,100 | 322,939,313 |
| messages per session | 167 | 557 | 715 | 715 | 10,527 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 21 | 46.7% |
| `engineer` | 12 | 26.7% |
| `reviewer` | 12 | 26.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 1,268 | 9 | 4 | 0.7% |
| `bash` | 1,088 | 28 | 27 | 2.6% |
| `grep` | 835 | 17 | 7 | 2% |
| `edit` | 316 | 2 | 0 | 0.6% |
| `fetch` | 177 | 26 | 0 | 14.7% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 121 | 1 | 0 | 0.8% |
| `get_issue` | 97 | 13 | 0 | 13.4% |
| `get_issue_comments` | 72 | 0 | 8 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_issues` | 64 | 0 | 2 | 0% |
| `atoma_builtin__load_skill` | 53 | 0 | 0 | 0% |
| `glob` | 52 | 0 | 1 | 0% |
| `write` | 50 | 0 | 0 | 0% |
| `get_branch` | 45 | 0 | 0 | 0% |
| `get_pr` | 45 | 5 | 0 | 11.1% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_check_runs` | 36 | 2 | 0 | 5.6% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `check_merge_readiness` | 18 | 0 | 0 | 0% |
| `list_prs` | 16 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `create_issue` | 14 | 4 | 0 | 28.6% |
| `create_pr` | 14 | 6 | 0 | 42.9% |
| `get_pr_diff` | 14 | 1 | 0 | 7.1% |
| `commit_and_push` | 12 | 2 | 0 | 16.7% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `delegate_readonly` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `request_close_issue` | 6 | 0 | 0 | 0% |
| `search_code` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `launch_sub_agent` | 4 | 1 | 0 | 25% |
| `sync_branch` | 4 | 1 | 0 | 25% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `search_remote_code` | 3 | 1 | 0 | 33.3% |
| `close_issue` | 2 | 0 | 0 | 0% |
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
| `other` | 826 | 75.9% |
| `edit` | 93 | 8.5% |
| `search` | 88 | 8.1% |
| `open` | 49 | 4.5% |
| `verify` | 32 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 37 | 69.8% |
| `engineering/environment` | 6 | 11.3% |
| `delivery/pipeline-setup` | 5 | 9.4% |
| `engineering/secrets-in-a-check` | 2 | 3.8% |
| `research/web-search` | 2 | 3.8% |
| `docs/design-doc` | 1 | 1.9% |

## Last year

45 sessions.

**Ran to an end without a report:** 13 of 43 sessions whose last run the core recorded as `completed` — 30.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**322,939,313 tokens** over 42 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,244,375 | 16,895,165 | 73,718,100 | 73,718,100 | 322,939,313 |
| messages per session | 167 | 557 | 715 | 715 | 10,527 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 21 | 46.7% |
| `engineer` | 12 | 26.7% |
| `reviewer` | 12 | 26.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 1,268 | 9 | 4 | 0.7% |
| `bash` | 1,088 | 28 | 27 | 2.6% |
| `grep` | 835 | 17 | 7 | 2% |
| `edit` | 316 | 2 | 0 | 0.6% |
| `fetch` | 177 | 26 | 0 | 14.7% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 121 | 1 | 0 | 0.8% |
| `get_issue` | 97 | 13 | 0 | 13.4% |
| `get_issue_comments` | 72 | 0 | 8 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_issues` | 64 | 0 | 2 | 0% |
| `atoma_builtin__load_skill` | 53 | 0 | 0 | 0% |
| `glob` | 52 | 0 | 1 | 0% |
| `write` | 50 | 0 | 0 | 0% |
| `get_branch` | 45 | 0 | 0 | 0% |
| `get_pr` | 45 | 5 | 0 | 11.1% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_check_runs` | 36 | 2 | 0 | 5.6% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `check_merge_readiness` | 18 | 0 | 0 | 0% |
| `list_prs` | 16 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `create_issue` | 14 | 4 | 0 | 28.6% |
| `create_pr` | 14 | 6 | 0 | 42.9% |
| `get_pr_diff` | 14 | 1 | 0 | 7.1% |
| `commit_and_push` | 12 | 2 | 0 | 16.7% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `delegate_readonly` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `request_close_issue` | 6 | 0 | 0 | 0% |
| `search_code` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `launch_sub_agent` | 4 | 1 | 0 | 25% |
| `sync_branch` | 4 | 1 | 0 | 25% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `search_remote_code` | 3 | 1 | 0 | 33.3% |
| `close_issue` | 2 | 0 | 0 | 0% |
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
| `other` | 826 | 75.9% |
| `edit` | 93 | 8.5% |
| `search` | 88 | 8.1% |
| `open` | 49 | 4.5% |
| `verify` | 32 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 37 | 69.8% |
| `engineering/environment` | 6 | 11.3% |
| `delivery/pipeline-setup` | 5 | 9.4% |
| `engineering/secrets-in-a-check` | 2 | 3.8% |
| `research/web-search` | 2 | 3.8% |
| `docs/design-doc` | 1 | 1.9% |

## All time

45 sessions.

**Ran to an end without a report:** 13 of 43 sessions whose last run the core recorded as `completed` — 30.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**322,939,313 tokens** over 42 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**97.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 4,244,375 | 16,895,165 | 73,718,100 | 73,718,100 | 322,939,313 |
| messages per session | 167 | 557 | 715 | 715 | 10,527 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 21 | 46.7% |
| `engineer` | 12 | 26.7% |
| `reviewer` | 12 | 26.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `shell__shell_execute` | 1,548 | 19 | 23 | 1.2% |
| `read` | 1,268 | 9 | 4 | 0.7% |
| `bash` | 1,088 | 28 | 27 | 2.6% |
| `grep` | 835 | 17 | 7 | 2% |
| `edit` | 316 | 2 | 0 | 0.6% |
| `fetch` | 177 | 26 | 0 | 14.7% |
| `web__fetch` | 148 | 11 | 0 | 7.4% |
| `list` | 121 | 1 | 0 | 0.8% |
| `get_issue` | 97 | 13 | 0 | 13.4% |
| `get_issue_comments` | 72 | 0 | 8 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_issues` | 64 | 0 | 2 | 0% |
| `atoma_builtin__load_skill` | 53 | 0 | 0 | 0% |
| `glob` | 52 | 0 | 1 | 0% |
| `write` | 50 | 0 | 0 | 0% |
| `get_branch` | 45 | 0 | 0 | 0% |
| `get_pr` | 45 | 5 | 0 | 11.1% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_check_runs` | 36 | 2 | 0 | 5.6% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `check_merge_readiness` | 18 | 0 | 0 | 0% |
| `list_prs` | 16 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `create_issue` | 14 | 4 | 0 | 28.6% |
| `create_pr` | 14 | 6 | 0 | 42.9% |
| `get_pr_diff` | 14 | 1 | 0 | 7.1% |
| `commit_and_push` | 12 | 2 | 0 | 16.7% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `delegate_readonly` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `request_close_issue` | 6 | 0 | 0 | 0% |
| `search_code` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `launch_sub_agent` | 4 | 1 | 0 | 25% |
| `sync_branch` | 4 | 1 | 0 | 25% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `search_remote_code` | 3 | 1 | 0 | 33.3% |
| `close_issue` | 2 | 0 | 0 | 0% |
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
| `other` | 826 | 75.9% |
| `edit` | 93 | 8.5% |
| `search` | 88 | 8.1% |
| `open` | 49 | 4.5% |
| `verify` | 32 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 37 | 69.8% |
| `engineering/environment` | 6 | 11.3% |
| `delivery/pipeline-setup` | 5 | 9.4% |
| `engineering/secrets-in-a-check` | 2 | 3.8% |
| `research/web-search` | 2 | 3.8% |
| `docs/design-doc` | 1 | 1.9% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
