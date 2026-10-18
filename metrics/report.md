# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-18.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 86 | 10.5% | 924 | 9,859 | 19 | 41.3 |
| Last 30 days | 123 | 9.8% | 1,018 | 10,246 | 25 | 38.0 |
| Last year | 123 | 9.8% | 1,018 | 10,246 | 25 | 38.0 |
| All time | 123 | 9.8% | 1,018 | 10,246 | 25 | 38.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 111 |
| `failed` | 11 |
| `stopped` | 1 |

## Last 7 days

42 sessions.

**Ran to an end without a report:** 17 of 41 sessions whose last run the core recorded as `completed` — 41.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**231,194,570 tokens** over 41 runs that reported them, **97.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,408,541 | 8,138,470 | 73,718,100 | 73,718,100 | 231,194,570 |
| messages per session | 178 | 463 | 715 | 715 | 9,372 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 22 | 52.4% |
| `reviewer` | 13 | 31% |
| `engineer` | 7 | 16.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,577 | 35 | 35 | 2.2% |
| `read` | 1,159 | 12 | 2 | 1% |
| `grep` | 846 | 13 | 3 | 1.5% |
| `fetch` | 300 | 35 | 0 | 11.7% |
| `shell__shell_execute` | 279 | 3 | 0 | 1.1% |
| `edit` | 278 | 3 | 0 | 1.1% |
| `get_issue` | 145 | 13 | 0 | 9% |
| `get_issue_comments` | 112 | 0 | 9 | 0% |
| `list` | 100 | 0 | 0 | 0% |
| `search_issues` | 82 | 0 | 2 | 0% |
| `get_pr` | 62 | 6 | 0 | 9.7% |
| `get_branch` | 59 | 0 | 0 | 0% |
| `glob` | 56 | 1 | 1 | 1.8% |
| `get_check_runs` | 55 | 3 | 0 | 5.5% |
| `atoma_builtin__load_skill` | 42 | 0 | 0 | 0% |
| `create_pr` | 26 | 13 | 0 | 50% |
| `check_merge_readiness` | 23 | 0 | 0 | 0% |
| `write` | 23 | 0 | 0 | 0% |
| `get_pr_diff` | 22 | 1 | 0 | 4.5% |
| `web__fetch` | 22 | 1 | 0 | 4.5% |
| `list_prs` | 18 | 0 | 0 | 0% |
| `commit_and_push` | 17 | 2 | 0 | 11.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
| `request_close_issue` | 14 | 0 | 0 | 0% |
| `get_pr_reviews` | 13 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `search_code` | 10 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `merge_pr` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate` | 6 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 1 | 0 | 16.7% |
| `search_remote_code` | 6 | 2 | 0 | 33.3% |
| `sync_branch` | 6 | 2 | 0 | 33.3% |
| `github__get_issue` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_issue_comments` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
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
| `other` | 1,089 | 69.1% |
| `search` | 214 | 13.6% |
| `edit` | 133 | 8.4% |
| `open` | 71 | 4.5% |
| `verify` | 70 | 4.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 33 | 78.6% |
| `delivery/pipeline-setup` | 2 | 4.8% |
| `engineering/environment` | 2 | 4.8% |
| `engineering/secrets-in-a-check` | 2 | 4.8% |
| `research/web-search` | 2 | 4.8% |
| `docs/design-doc` | 1 | 2.4% |

## Last 30 days

62 sessions.

**Ran to an end without a report:** 23 of 60 sessions whose last run the core recorded as `completed` — 38.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**351,013,247 tokens** over 61 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,666,158 | 11,220,302 | 73,718,100 | 73,718,100 | 351,013,247 |
| messages per session | 169 | 482 | 715 | 715 | 14,053 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 31 | 50% |
| `reviewer` | 17 | 27.4% |
| `engineer` | 14 | 22.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,810 | 15 | 4 | 0.8% |
| `bash` | 1,577 | 35 | 35 | 2.2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,230 | 21 | 7 | 1.7% |
| `edit` | 385 | 3 | 0 | 0.8% |
| `fetch` | 300 | 35 | 0 | 11.7% |
| `list` | 157 | 1 | 0 | 0.6% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue` | 145 | 13 | 0 | 9% |
| `get_issue_comments` | 112 | 0 | 9 | 0% |
| `search_issues` | 82 | 0 | 2 | 0% |
| `glob` | 73 | 1 | 1 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 67 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr` | 62 | 6 | 0 | 9.7% |
| `get_branch` | 59 | 0 | 0 | 0% |
| `get_check_runs` | 55 | 3 | 0 | 5.5% |
| `write` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `create_pr` | 26 | 13 | 0 | 50% |
| `check_merge_readiness` | 23 | 0 | 0 | 0% |
| `get_pr_diff` | 22 | 1 | 0 | 4.5% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_prs` | 18 | 0 | 0 | 0% |
| `commit_and_push` | 17 | 2 | 0 | 11.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
| `request_close_issue` | 14 | 0 | 0 | 0% |
| `get_pr_reviews` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `search_code` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `merge_pr` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate` | 6 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 1 | 0 | 16.7% |
| `search_remote_code` | 6 | 2 | 0 | 33.3% |
| `sync_branch` | 6 | 2 | 0 | 33.3% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
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
| `other` | 1,089 | 69.1% |
| `search` | 214 | 13.6% |
| `edit` | 133 | 8.4% |
| `open` | 71 | 4.5% |
| `verify` | 70 | 4.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 50 | 74.6% |
| `delivery/pipeline-setup` | 6 | 9% |
| `engineering/environment` | 6 | 9% |
| `engineering/secrets-in-a-check` | 2 | 3% |
| `research/web-search` | 2 | 3% |
| `docs/design-doc` | 1 | 1.5% |

## Last year

62 sessions.

**Ran to an end without a report:** 23 of 60 sessions whose last run the core recorded as `completed` — 38.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**351,013,247 tokens** over 61 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,666,158 | 11,220,302 | 73,718,100 | 73,718,100 | 351,013,247 |
| messages per session | 169 | 482 | 715 | 715 | 14,053 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 31 | 50% |
| `reviewer` | 17 | 27.4% |
| `engineer` | 14 | 22.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,810 | 15 | 4 | 0.8% |
| `bash` | 1,577 | 35 | 35 | 2.2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,230 | 21 | 7 | 1.7% |
| `edit` | 385 | 3 | 0 | 0.8% |
| `fetch` | 300 | 35 | 0 | 11.7% |
| `list` | 157 | 1 | 0 | 0.6% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue` | 145 | 13 | 0 | 9% |
| `get_issue_comments` | 112 | 0 | 9 | 0% |
| `search_issues` | 82 | 0 | 2 | 0% |
| `glob` | 73 | 1 | 1 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 67 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr` | 62 | 6 | 0 | 9.7% |
| `get_branch` | 59 | 0 | 0 | 0% |
| `get_check_runs` | 55 | 3 | 0 | 5.5% |
| `write` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `create_pr` | 26 | 13 | 0 | 50% |
| `check_merge_readiness` | 23 | 0 | 0 | 0% |
| `get_pr_diff` | 22 | 1 | 0 | 4.5% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_prs` | 18 | 0 | 0 | 0% |
| `commit_and_push` | 17 | 2 | 0 | 11.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
| `request_close_issue` | 14 | 0 | 0 | 0% |
| `get_pr_reviews` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `search_code` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `merge_pr` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate` | 6 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 1 | 0 | 16.7% |
| `search_remote_code` | 6 | 2 | 0 | 33.3% |
| `sync_branch` | 6 | 2 | 0 | 33.3% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
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
| `other` | 1,089 | 69.1% |
| `search` | 214 | 13.6% |
| `edit` | 133 | 8.4% |
| `open` | 71 | 4.5% |
| `verify` | 70 | 4.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 50 | 74.6% |
| `delivery/pipeline-setup` | 6 | 9% |
| `engineering/environment` | 6 | 9% |
| `engineering/secrets-in-a-check` | 2 | 3% |
| `research/web-search` | 2 | 3% |
| `docs/design-doc` | 1 | 1.5% |

## All time

62 sessions.

**Ran to an end without a report:** 23 of 60 sessions whose last run the core recorded as `completed` — 38.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**351,013,247 tokens** over 61 runs that reported them, **97% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,666,158 | 11,220,302 | 73,718,100 | 73,718,100 | 351,013,247 |
| messages per session | 169 | 482 | 715 | 715 | 14,053 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 31 | 50% |
| `reviewer` | 17 | 27.4% |
| `engineer` | 14 | 22.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,810 | 15 | 4 | 0.8% |
| `bash` | 1,577 | 35 | 35 | 2.2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,230 | 21 | 7 | 1.7% |
| `edit` | 385 | 3 | 0 | 0.8% |
| `fetch` | 300 | 35 | 0 | 11.7% |
| `list` | 157 | 1 | 0 | 0.6% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue` | 145 | 13 | 0 | 9% |
| `get_issue_comments` | 112 | 0 | 9 | 0% |
| `search_issues` | 82 | 0 | 2 | 0% |
| `glob` | 73 | 1 | 1 | 1.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 67 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr` | 62 | 6 | 0 | 9.7% |
| `get_branch` | 59 | 0 | 0 | 0% |
| `get_check_runs` | 55 | 3 | 0 | 5.5% |
| `write` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `create_pr` | 26 | 13 | 0 | 50% |
| `check_merge_readiness` | 23 | 0 | 0 | 0% |
| `get_pr_diff` | 22 | 1 | 0 | 4.5% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_prs` | 18 | 0 | 0 | 0% |
| `commit_and_push` | 17 | 2 | 0 | 11.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
| `request_close_issue` | 14 | 0 | 0 | 0% |
| `get_pr_reviews` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `search_code` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `merge_pr` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate` | 6 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 1 | 0 | 16.7% |
| `search_remote_code` | 6 | 2 | 0 | 33.3% |
| `sync_branch` | 6 | 2 | 0 | 33.3% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
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
| `other` | 1,089 | 69.1% |
| `search` | 214 | 13.6% |
| `edit` | 133 | 8.4% |
| `open` | 71 | 4.5% |
| `verify` | 70 | 4.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 50 | 74.6% |
| `delivery/pipeline-setup` | 6 | 9% |
| `engineering/environment` | 6 | 9% |
| `engineering/secrets-in-a-check` | 2 | 3% |
| `research/web-search` | 2 | 3% |
| `docs/design-doc` | 1 | 1.5% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
