# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-19.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 102 | 9.8% | 529 | 9,859 | 16 | 39.2 |
| Last 30 days | 151 | 8.6% | 723 | 10,246 | 21 | 36.5 |
| Last year | 151 | 8.6% | 723 | 10,246 | 21 | 36.5 |
| All time | 151 | 8.6% | 723 | 10,246 | 21 | 36.5 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 138 |
| `failed` | 11 |
| `stopped` | 2 |

## Last 7 days

45 sessions.

**Ran to an end without a report:** 12 of 44 sessions whose last run the core recorded as `completed` — 27.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**161,612,591 tokens** over 55 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,024,843 | 6,183,128 | 39,097,860 | 39,097,860 | 161,612,591 |
| messages per session | 162 | 384 | 571 | 571 | 8,309 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 22 | 48.9% |
| `reviewer` | 16 | 35.6% |
| `engineer` | 7 | 15.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,364 | 32 | 31 | 2.3% |
| `read` | 1,083 | 13 | 1 | 1.2% |
| `grep` | 802 | 15 | 3 | 1.9% |
| `fetch` | 279 | 35 | 0 | 12.5% |
| `edit` | 263 | 4 | 0 | 1.5% |
| `get_issue` | 148 | 13 | 0 | 8.8% |
| `get_issue_comments` | 116 | 0 | 10 | 0% |
| `list` | 88 | 0 | 0 | 0% |
| `search_issues` | 67 | 0 | 0 | 0% |
| `get_pr` | 64 | 4 | 0 | 6.3% |
| `get_check_runs` | 59 | 2 | 0 | 3.4% |
| `glob` | 56 | 1 | 1 | 1.8% |
| `get_branch` | 55 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 38 | 0 | 0 | 0% |
| `create_pr` | 29 | 15 | 0 | 51.7% |
| `check_merge_readiness` | 25 | 0 | 0 | 0% |
| `get_pr_diff` | 22 | 1 | 0 | 4.5% |
| `commit_and_push` | 20 | 2 | 0 | 10% |
| `list_prs` | 17 | 0 | 0 | 0% |
| `request_close_issue` | 16 | 0 | 0 | 0% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
| `search_code` | 14 | 0 | 0 | 0% |
| `search_remote_code` | 14 | 5 | 0 | 35.7% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `write` | 14 | 0 | 0 | 0% |
| `create_issue` | 12 | 3 | 0 | 25% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `list_pr_review_comments` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `merge_pr` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `sync_branch` | 6 | 2 | 0 | 33.3% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `probe` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `delegate_readonly_large` | 3 | 0 | 2 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
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
| `other` | 891 | 65.3% |
| `search` | 223 | 16.3% |
| `edit` | 89 | 6.5% |
| `verify` | 82 | 6% |
| `open` | 79 | 5.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 35 | 92.1% |
| `delivery/pipeline-setup` | 1 | 2.6% |
| `docs/design-doc` | 1 | 2.6% |
| `research/web-search` | 1 | 2.6% |

## Last 30 days

71 sessions.

**Ran to an end without a report:** 19 of 69 sessions whose last run the core recorded as `completed` — 27.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**372,732,182 tokens** over 81 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,413,053 | 8,400,110 | 73,718,100 | 73,718,100 | 372,732,182 |
| messages per session | 162 | 463 | 715 | 715 | 15,164 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 33 | 46.5% |
| `reviewer` | 22 | 31% |
| `engineer` | 16 | 22.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,941 | 16 | 4 | 0.8% |
| `bash` | 1,733 | 40 | 40 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,322 | 25 | 7 | 1.9% |
| `edit` | 442 | 5 | 0 | 1.1% |
| `fetch` | 303 | 35 | 0 | 11.6% |
| `list` | 165 | 1 | 0 | 0.6% |
| `get_issue` | 156 | 13 | 0 | 8.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 123 | 0 | 10 | 0% |
| `glob` | 85 | 1 | 1 | 1.2% |
| `search_issues` | 85 | 0 | 2 | 0% |
| `atoma_builtin__load_skill` | 75 | 0 | 0 | 0% |
| `get_pr` | 72 | 6 | 0 | 8.3% |
| `get_check_runs` | 68 | 3 | 0 | 4.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_branch` | 66 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 56 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_pr` | 32 | 16 | 0 | 50% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `check_merge_readiness` | 27 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `commit_and_push` | 24 | 4 | 0 | 16.7% |
| `get_pr_diff` | 24 | 1 | 0 | 4.2% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_prs` | 19 | 0 | 0 | 0% |
| `request_close_issue` | 18 | 0 | 0 | 0% |
| `delegate_readonly` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `get_pr_reviews` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `search_code` | 15 | 0 | 0 | 0% |
| `search_remote_code` | 14 | 5 | 0 | 35.7% |
| `list_pr_review_comments` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `sync_branch` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_readonly_large` | 4 | 0 | 3 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
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
| `other` | 1,191 | 68.7% |
| `search` | 226 | 13% |
| `edit` | 146 | 8.4% |
| `verify` | 90 | 5.2% |
| `open` | 80 | 4.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 58 | 77.3% |
| `delivery/pipeline-setup` | 6 | 8% |
| `engineering/environment` | 6 | 8% |
| `engineering/secrets-in-a-check` | 2 | 2.7% |
| `research/web-search` | 2 | 2.7% |
| `docs/design-doc` | 1 | 1.3% |

## Last year

71 sessions.

**Ran to an end without a report:** 19 of 69 sessions whose last run the core recorded as `completed` — 27.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**372,732,182 tokens** over 81 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,413,053 | 8,400,110 | 73,718,100 | 73,718,100 | 372,732,182 |
| messages per session | 162 | 463 | 715 | 715 | 15,164 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 33 | 46.5% |
| `reviewer` | 22 | 31% |
| `engineer` | 16 | 22.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,941 | 16 | 4 | 0.8% |
| `bash` | 1,733 | 40 | 40 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,322 | 25 | 7 | 1.9% |
| `edit` | 442 | 5 | 0 | 1.1% |
| `fetch` | 303 | 35 | 0 | 11.6% |
| `list` | 165 | 1 | 0 | 0.6% |
| `get_issue` | 156 | 13 | 0 | 8.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 123 | 0 | 10 | 0% |
| `glob` | 85 | 1 | 1 | 1.2% |
| `search_issues` | 85 | 0 | 2 | 0% |
| `atoma_builtin__load_skill` | 75 | 0 | 0 | 0% |
| `get_pr` | 72 | 6 | 0 | 8.3% |
| `get_check_runs` | 68 | 3 | 0 | 4.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_branch` | 66 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 56 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_pr` | 32 | 16 | 0 | 50% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `check_merge_readiness` | 27 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `commit_and_push` | 24 | 4 | 0 | 16.7% |
| `get_pr_diff` | 24 | 1 | 0 | 4.2% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_prs` | 19 | 0 | 0 | 0% |
| `request_close_issue` | 18 | 0 | 0 | 0% |
| `delegate_readonly` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `get_pr_reviews` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `search_code` | 15 | 0 | 0 | 0% |
| `search_remote_code` | 14 | 5 | 0 | 35.7% |
| `list_pr_review_comments` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `sync_branch` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_readonly_large` | 4 | 0 | 3 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
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
| `other` | 1,191 | 68.7% |
| `search` | 226 | 13% |
| `edit` | 146 | 8.4% |
| `verify` | 90 | 5.2% |
| `open` | 80 | 4.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 58 | 77.3% |
| `delivery/pipeline-setup` | 6 | 8% |
| `engineering/environment` | 6 | 8% |
| `engineering/secrets-in-a-check` | 2 | 2.7% |
| `research/web-search` | 2 | 2.7% |
| `docs/design-doc` | 1 | 1.3% |

## All time

71 sessions.

**Ran to an end without a report:** 19 of 69 sessions whose last run the core recorded as `completed` — 27.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**372,732,182 tokens** over 81 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,413,053 | 8,400,110 | 73,718,100 | 73,718,100 | 372,732,182 |
| messages per session | 162 | 463 | 715 | 715 | 15,164 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 33 | 46.5% |
| `reviewer` | 22 | 31% |
| `engineer` | 16 | 22.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,941 | 16 | 4 | 0.8% |
| `bash` | 1,733 | 40 | 40 | 2.3% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,322 | 25 | 7 | 1.9% |
| `edit` | 442 | 5 | 0 | 1.1% |
| `fetch` | 303 | 35 | 0 | 11.6% |
| `list` | 165 | 1 | 0 | 0.6% |
| `get_issue` | 156 | 13 | 0 | 8.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 123 | 0 | 10 | 0% |
| `glob` | 85 | 1 | 1 | 1.2% |
| `search_issues` | 85 | 0 | 2 | 0% |
| `atoma_builtin__load_skill` | 75 | 0 | 0 | 0% |
| `get_pr` | 72 | 6 | 0 | 8.3% |
| `get_check_runs` | 68 | 3 | 0 | 4.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_branch` | 66 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 56 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_pr` | 32 | 16 | 0 | 50% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `check_merge_readiness` | 27 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `commit_and_push` | 24 | 4 | 0 | 16.7% |
| `get_pr_diff` | 24 | 1 | 0 | 4.2% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_prs` | 19 | 0 | 0 | 0% |
| `request_close_issue` | 18 | 0 | 0 | 0% |
| `delegate_readonly` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `get_pr_reviews` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `search_code` | 15 | 0 | 0 | 0% |
| `search_remote_code` | 14 | 5 | 0 | 35.7% |
| `list_pr_review_comments` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `list_issues` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `sync_branch` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_readonly_large` | 4 | 0 | 3 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
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
| `other` | 1,191 | 68.7% |
| `search` | 226 | 13% |
| `edit` | 146 | 8.4% |
| `verify` | 90 | 5.2% |
| `open` | 80 | 4.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 58 | 77.3% |
| `delivery/pipeline-setup` | 6 | 8% |
| `engineering/environment` | 6 | 8% |
| `engineering/secrets-in-a-check` | 2 | 2.7% |
| `research/web-search` | 2 | 2.7% |
| `docs/design-doc` | 1 | 1.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
