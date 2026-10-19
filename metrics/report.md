# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-19.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 102 | 9.8% | 630 | 9,859 | 16 | 41.3 |
| Last 30 days | 142 | 9.2% | 785 | 10,246 | 21 | 39.0 |
| Last year | 142 | 9.2% | 785 | 10,246 | 21 | 39.0 |
| All time | 142 | 9.2% | 785 | 10,246 | 21 | 39.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 129 |
| `failed` | 11 |
| `stopped` | 2 |

## Last 7 days

43 sessions.

**Ran to an end without a report:** 13 of 42 sessions whose last run the core recorded as `completed` — 31%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**163,816,497 tokens** over 52 runs that reported them, **96.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,173,182 | 6,183,128 | 39,097,860 | 39,097,860 | 163,816,497 |
| messages per session | 167 | 384 | 571 | 571 | 8,454 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 22 | 51.2% |
| `reviewer` | 15 | 34.9% |
| `engineer` | 6 | 14% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,396 | 34 | 33 | 2.4% |
| `read` | 1,130 | 13 | 1 | 1.2% |
| `grep` | 885 | 13 | 3 | 1.5% |
| `fetch` | 299 | 35 | 0 | 11.7% |
| `edit` | 228 | 2 | 0 | 0.9% |
| `get_issue` | 151 | 13 | 0 | 8.6% |
| `get_issue_comments` | 114 | 0 | 9 | 0% |
| `list` | 98 | 0 | 0 | 0% |
| `search_issues` | 69 | 0 | 0 | 0% |
| `get_pr` | 66 | 6 | 0 | 9.1% |
| `get_branch` | 59 | 0 | 0 | 0% |
| `get_check_runs` | 59 | 3 | 0 | 5.1% |
| `glob` | 59 | 1 | 1 | 1.7% |
| `atoma_builtin__load_skill` | 38 | 0 | 0 | 0% |
| `create_pr` | 30 | 15 | 0 | 50% |
| `check_merge_readiness` | 25 | 0 | 0 | 0% |
| `get_pr_diff` | 22 | 1 | 0 | 4.5% |
| `commit_and_push` | 19 | 2 | 0 | 10.5% |
| `list_prs` | 18 | 0 | 0 | 0% |
| `request_close_issue` | 16 | 0 | 0 | 0% |
| `write` | 15 | 0 | 0 | 0% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
| `get_pr_reviews` | 14 | 0 | 0 | 0% |
| `search_code` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `create_issue` | 13 | 4 | 0 | 30.8% |
| `search_remote_code` | 12 | 3 | 0 | 25% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `merge_pr` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `sync_branch` | 6 | 2 | 0 | 33.3% |
| `probe` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `create_root_issue` | 2 | 0 | 0 | 0% |
| `delegate_readonly_large` | 2 | 0 | 2 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 922 | 66% |
| `search` | 226 | 16.2% |
| `verify` | 86 | 6.2% |
| `edit` | 84 | 6% |
| `open` | 78 | 5.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 34 | 89.5% |
| `delivery/pipeline-setup` | 2 | 5.3% |
| `docs/design-doc` | 1 | 2.6% |
| `research/web-search` | 1 | 2.6% |

## Last 30 days

65 sessions.

**Ran to an end without a report:** 19 of 63 sessions whose last run the core recorded as `completed` — 30.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**357,795,190 tokens** over 74 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,420,558 | 11,067,135 | 73,718,100 | 73,718,100 | 357,795,190 |
| messages per session | 167 | 482 | 715 | 715 | 14,555 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 32 | 49.2% |
| `reviewer` | 19 | 29.2% |
| `engineer` | 14 | 21.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,859 | 16 | 4 | 0.9% |
| `bash` | 1,647 | 38 | 38 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,276 | 22 | 7 | 1.7% |
| `edit` | 401 | 3 | 0 | 0.7% |
| `fetch` | 301 | 35 | 0 | 11.6% |
| `list` | 161 | 1 | 0 | 0.6% |
| `get_issue` | 153 | 13 | 0 | 8.5% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 117 | 0 | 9 | 0% |
| `search_issues` | 84 | 0 | 2 | 0% |
| `glob` | 79 | 1 | 1 | 1.3% |
| `atoma_builtin__load_skill` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr` | 66 | 6 | 0 | 9.1% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_branch` | 62 | 0 | 0 | 0% |
| `get_check_runs` | 59 | 3 | 0 | 5.1% |
| `write` | 54 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_pr` | 30 | 15 | 0 | 50% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `check_merge_readiness` | 25 | 0 | 0 | 0% |
| `get_pr_diff` | 22 | 1 | 0 | 4.5% |
| `commit_and_push` | 21 | 4 | 0 | 19% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_prs` | 19 | 0 | 0 | 0% |
| `request_close_issue` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
| `get_pr_reviews` | 14 | 0 | 0 | 0% |
| `search_code` | 14 | 0 | 0 | 0% |
| `search_remote_code` | 12 | 3 | 0 | 25% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `merge_pr` | 9 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `sync_branch` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `create_root_issue` | 2 | 0 | 0 | 0% |
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
| `other` | 1,119 | 67.9% |
| `search` | 226 | 13.7% |
| `edit` | 138 | 8.4% |
| `verify` | 86 | 5.2% |
| `open` | 78 | 4.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 53 | 75.7% |
| `delivery/pipeline-setup` | 6 | 8.6% |
| `engineering/environment` | 6 | 8.6% |
| `engineering/secrets-in-a-check` | 2 | 2.9% |
| `research/web-search` | 2 | 2.9% |
| `docs/design-doc` | 1 | 1.4% |

## Last year

65 sessions.

**Ran to an end without a report:** 19 of 63 sessions whose last run the core recorded as `completed` — 30.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**357,795,190 tokens** over 74 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,420,558 | 11,067,135 | 73,718,100 | 73,718,100 | 357,795,190 |
| messages per session | 167 | 482 | 715 | 715 | 14,555 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 32 | 49.2% |
| `reviewer` | 19 | 29.2% |
| `engineer` | 14 | 21.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,859 | 16 | 4 | 0.9% |
| `bash` | 1,647 | 38 | 38 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,276 | 22 | 7 | 1.7% |
| `edit` | 401 | 3 | 0 | 0.7% |
| `fetch` | 301 | 35 | 0 | 11.6% |
| `list` | 161 | 1 | 0 | 0.6% |
| `get_issue` | 153 | 13 | 0 | 8.5% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 117 | 0 | 9 | 0% |
| `search_issues` | 84 | 0 | 2 | 0% |
| `glob` | 79 | 1 | 1 | 1.3% |
| `atoma_builtin__load_skill` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr` | 66 | 6 | 0 | 9.1% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_branch` | 62 | 0 | 0 | 0% |
| `get_check_runs` | 59 | 3 | 0 | 5.1% |
| `write` | 54 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_pr` | 30 | 15 | 0 | 50% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `check_merge_readiness` | 25 | 0 | 0 | 0% |
| `get_pr_diff` | 22 | 1 | 0 | 4.5% |
| `commit_and_push` | 21 | 4 | 0 | 19% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_prs` | 19 | 0 | 0 | 0% |
| `request_close_issue` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
| `get_pr_reviews` | 14 | 0 | 0 | 0% |
| `search_code` | 14 | 0 | 0 | 0% |
| `search_remote_code` | 12 | 3 | 0 | 25% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `merge_pr` | 9 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `sync_branch` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `create_root_issue` | 2 | 0 | 0 | 0% |
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
| `other` | 1,119 | 67.9% |
| `search` | 226 | 13.7% |
| `edit` | 138 | 8.4% |
| `verify` | 86 | 5.2% |
| `open` | 78 | 4.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 53 | 75.7% |
| `delivery/pipeline-setup` | 6 | 8.6% |
| `engineering/environment` | 6 | 8.6% |
| `engineering/secrets-in-a-check` | 2 | 2.9% |
| `research/web-search` | 2 | 2.9% |
| `docs/design-doc` | 1 | 1.4% |

## All time

65 sessions.

**Ran to an end without a report:** 19 of 63 sessions whose last run the core recorded as `completed` — 30.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**357,795,190 tokens** over 74 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,420,558 | 11,067,135 | 73,718,100 | 73,718,100 | 357,795,190 |
| messages per session | 167 | 482 | 715 | 715 | 14,555 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 32 | 49.2% |
| `reviewer` | 19 | 29.2% |
| `engineer` | 14 | 21.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,859 | 16 | 4 | 0.9% |
| `bash` | 1,647 | 38 | 38 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,276 | 22 | 7 | 1.7% |
| `edit` | 401 | 3 | 0 | 0.7% |
| `fetch` | 301 | 35 | 0 | 11.6% |
| `list` | 161 | 1 | 0 | 0.6% |
| `get_issue` | 153 | 13 | 0 | 8.5% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 117 | 0 | 9 | 0% |
| `search_issues` | 84 | 0 | 2 | 0% |
| `glob` | 79 | 1 | 1 | 1.3% |
| `atoma_builtin__load_skill` | 70 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr` | 66 | 6 | 0 | 9.1% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_branch` | 62 | 0 | 0 | 0% |
| `get_check_runs` | 59 | 3 | 0 | 5.1% |
| `write` | 54 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_pr` | 30 | 15 | 0 | 50% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `check_merge_readiness` | 25 | 0 | 0 | 0% |
| `get_pr_diff` | 22 | 1 | 0 | 4.5% |
| `commit_and_push` | 21 | 4 | 0 | 19% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_prs` | 19 | 0 | 0 | 0% |
| `request_close_issue` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
| `get_pr_reviews` | 14 | 0 | 0 | 0% |
| `search_code` | 14 | 0 | 0 | 0% |
| `search_remote_code` | 12 | 3 | 0 | 25% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `merge_pr` | 9 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `sync_branch` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `create_root_issue` | 2 | 0 | 0 | 0% |
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
| `other` | 1,119 | 67.9% |
| `search` | 226 | 13.7% |
| `edit` | 138 | 8.4% |
| `verify` | 86 | 5.2% |
| `open` | 78 | 4.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 53 | 75.7% |
| `delivery/pipeline-setup` | 6 | 8.6% |
| `engineering/environment` | 6 | 8.6% |
| `engineering/secrets-in-a-check` | 2 | 2.9% |
| `research/web-search` | 2 | 2.9% |
| `docs/design-doc` | 1 | 1.4% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
