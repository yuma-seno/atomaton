# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-21.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 104 | 8.7% | 415 | 9,859 | 15 | 35.9 |
| Last 30 days | 169 | 7.7% | 610 | 10,246 | 21 | 34.2 |
| Last year | 169 | 7.7% | 610 | 10,246 | 21 | 34.2 |
| All time | 169 | 7.7% | 610 | 10,246 | 21 | 34.2 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 156 |
| `failed` | 11 |
| `stopped` | 2 |

## Last 7 days

45 sessions.

**Ran to an end without a report:** 10 of 44 sessions whose last run the core recorded as `completed` — 22.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**123,254,208 tokens** over 57 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 906,491 | 4,919,495 | 39,097,860 | 39,097,860 | 123,254,208 |
| messages per session | 117 | 327 | 571 | 571 | 7,624 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 23 | 51.1% |
| `reviewer` | 16 | 35.6% |
| `engineer` | 6 | 13.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,125 | 9 | 0 | 0.8% |
| `bash` | 1,037 | 17 | 17 | 1.6% |
| `grep` | 757 | 14 | 0 | 1.8% |
| `edit` | 363 | 4 | 0 | 1.1% |
| `fetch` | 204 | 32 | 0 | 15.7% |
| `get_issue` | 127 | 13 | 4 | 10.2% |
| `get_issue_comments` | 77 | 0 | 2 | 0% |
| `list` | 72 | 0 | 0 | 0% |
| `search_issues` | 63 | 0 | 0 | 0% |
| `glob` | 56 | 1 | 0 | 1.8% |
| `get_pr` | 50 | 4 | 0 | 8% |
| `get_check_runs` | 49 | 1 | 0 | 2% |
| `atoma_builtin__load_skill` | 37 | 0 | 0 | 0% |
| `get_branch` | 33 | 0 | 0 | 0% |
| `create_pr` | 31 | 16 | 0 | 51.6% |
| `commit_and_push` | 24 | 3 | 0 | 12.5% |
| `check_merge_readiness` | 18 | 0 | 0 | 0% |
| `get_pr_diff` | 17 | 1 | 0 | 5.9% |
| `request_close_issue` | 17 | 0 | 0 | 0% |
| `search_code` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `write` | 14 | 0 | 0 | 0% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `search_remote_code` | 11 | 4 | 0 | 36.4% |
| `delegate` | 10 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `get_pr_reviews` | 7 | 0 | 0 | 0% |
| `list_prs` | 7 | 0 | 0 | 0% |
| `create_root_issue` | 6 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 2 | 0 | 33.3% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `create_issue` | 5 | 0 | 0 | 0% |
| `list_issues` | 5 | 0 | 0 | 0% |
| `list_pr_review_comments` | 5 | 0 | 0 | 0% |
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
| `other` | 642 | 61.9% |
| `search` | 186 | 17.9% |
| `verify` | 97 | 9.4% |
| `edit` | 72 | 6.9% |
| `open` | 40 | 3.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 35 | 94.6% |
| `delivery/pipeline-setup` | 1 | 2.7% |
| `research/web-search` | 1 | 2.7% |

## Last 30 days

81 sessions.

**Ran to an end without a report:** 21 of 79 sessions whose last run the core recorded as `completed` — 26.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**392,657,613 tokens** over 92 runs that reported them, **97.2% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,420,558 | 8,138,470 | 73,718,100 | 73,718,100 | 392,657,613 |
| messages per session | 152 | 450 | 715 | 715 | 16,537 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 38 | 46.9% |
| `reviewer` | 26 | 32.1% |
| `engineer` | 17 | 21% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,174 | 16 | 4 | 0.7% |
| `bash` | 1,886 | 41 | 42 | 2.2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,449 | 26 | 7 | 1.8% |
| `edit` | 575 | 5 | 0 | 0.9% |
| `fetch` | 306 | 35 | 0 | 11.4% |
| `list` | 177 | 1 | 0 | 0.6% |
| `get_issue` | 166 | 13 | 4 | 7.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 130 | 0 | 10 | 0% |
| `glob` | 101 | 1 | 1 | 1% |
| `search_issues` | 87 | 0 | 2 | 0% |
| `get_pr` | 84 | 8 | 0 | 9.5% |
| `atoma_builtin__load_skill` | 83 | 0 | 0 | 0% |
| `get_check_runs` | 78 | 3 | 0 | 3.8% |
| `get_branch` | 72 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_pr` | 40 | 19 | 0 | 47.5% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `commit_and_push` | 33 | 5 | 0 | 15.2% |
| `check_merge_readiness` | 32 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `get_pr_diff` | 29 | 2 | 0 | 6.9% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 21 | 0 | 0 | 0% |
| `list_prs` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate_readonly` | 18 | 0 | 0 | 0% |
| `search_code` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `get_pr_reviews` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `search_remote_code` | 14 | 5 | 0 | 35.7% |
| `list_pr_review_comments` | 12 | 0 | 0 | 0% |
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
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `create_root_issue` | 6 | 0 | 0 | 0% |
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
| `other` | 1,265 | 67.1% |
| `search` | 262 | 13.9% |
| `edit` | 152 | 8.1% |
| `verify` | 121 | 6.4% |
| `open` | 86 | 4.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 66 | 79.5% |
| `delivery/pipeline-setup` | 6 | 7.2% |
| `engineering/environment` | 6 | 7.2% |
| `engineering/secrets-in-a-check` | 2 | 2.4% |
| `research/web-search` | 2 | 2.4% |
| `docs/design-doc` | 1 | 1.2% |

## Last year

81 sessions.

**Ran to an end without a report:** 21 of 79 sessions whose last run the core recorded as `completed` — 26.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**392,657,613 tokens** over 92 runs that reported them, **97.2% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,420,558 | 8,138,470 | 73,718,100 | 73,718,100 | 392,657,613 |
| messages per session | 152 | 450 | 715 | 715 | 16,537 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 38 | 46.9% |
| `reviewer` | 26 | 32.1% |
| `engineer` | 17 | 21% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,174 | 16 | 4 | 0.7% |
| `bash` | 1,886 | 41 | 42 | 2.2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,449 | 26 | 7 | 1.8% |
| `edit` | 575 | 5 | 0 | 0.9% |
| `fetch` | 306 | 35 | 0 | 11.4% |
| `list` | 177 | 1 | 0 | 0.6% |
| `get_issue` | 166 | 13 | 4 | 7.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 130 | 0 | 10 | 0% |
| `glob` | 101 | 1 | 1 | 1% |
| `search_issues` | 87 | 0 | 2 | 0% |
| `get_pr` | 84 | 8 | 0 | 9.5% |
| `atoma_builtin__load_skill` | 83 | 0 | 0 | 0% |
| `get_check_runs` | 78 | 3 | 0 | 3.8% |
| `get_branch` | 72 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_pr` | 40 | 19 | 0 | 47.5% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `commit_and_push` | 33 | 5 | 0 | 15.2% |
| `check_merge_readiness` | 32 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `get_pr_diff` | 29 | 2 | 0 | 6.9% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 21 | 0 | 0 | 0% |
| `list_prs` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate_readonly` | 18 | 0 | 0 | 0% |
| `search_code` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `get_pr_reviews` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `search_remote_code` | 14 | 5 | 0 | 35.7% |
| `list_pr_review_comments` | 12 | 0 | 0 | 0% |
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
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `create_root_issue` | 6 | 0 | 0 | 0% |
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
| `other` | 1,265 | 67.1% |
| `search` | 262 | 13.9% |
| `edit` | 152 | 8.1% |
| `verify` | 121 | 6.4% |
| `open` | 86 | 4.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 66 | 79.5% |
| `delivery/pipeline-setup` | 6 | 7.2% |
| `engineering/environment` | 6 | 7.2% |
| `engineering/secrets-in-a-check` | 2 | 2.4% |
| `research/web-search` | 2 | 2.4% |
| `docs/design-doc` | 1 | 1.2% |

## All time

81 sessions.

**Ran to an end without a report:** 21 of 79 sessions whose last run the core recorded as `completed` — 26.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**392,657,613 tokens** over 92 runs that reported them, **97.2% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,420,558 | 8,138,470 | 73,718,100 | 73,718,100 | 392,657,613 |
| messages per session | 152 | 450 | 715 | 715 | 16,537 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 38 | 46.9% |
| `reviewer` | 26 | 32.1% |
| `engineer` | 17 | 21% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,174 | 16 | 4 | 0.7% |
| `bash` | 1,886 | 41 | 42 | 2.2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `grep` | 1,449 | 26 | 7 | 1.8% |
| `edit` | 575 | 5 | 0 | 0.9% |
| `fetch` | 306 | 35 | 0 | 11.4% |
| `list` | 177 | 1 | 0 | 0.6% |
| `get_issue` | 166 | 13 | 4 | 7.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 130 | 0 | 10 | 0% |
| `glob` | 101 | 1 | 1 | 1% |
| `search_issues` | 87 | 0 | 2 | 0% |
| `get_pr` | 84 | 8 | 0 | 9.5% |
| `atoma_builtin__load_skill` | 83 | 0 | 0 | 0% |
| `get_check_runs` | 78 | 3 | 0 | 3.8% |
| `get_branch` | 72 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `write` | 64 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_pr` | 40 | 19 | 0 | 47.5% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `commit_and_push` | 33 | 5 | 0 | 15.2% |
| `check_merge_readiness` | 32 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `get_pr_diff` | 29 | 2 | 0 | 6.9% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 21 | 0 | 0 | 0% |
| `list_prs` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate_readonly` | 18 | 0 | 0 | 0% |
| `search_code` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `get_pr_reviews` | 15 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `search_remote_code` | 14 | 5 | 0 | 35.7% |
| `list_pr_review_comments` | 12 | 0 | 0 | 0% |
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
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `create_root_issue` | 6 | 0 | 0 | 0% |
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
| `other` | 1,265 | 67.1% |
| `search` | 262 | 13.9% |
| `edit` | 152 | 8.1% |
| `verify` | 121 | 6.4% |
| `open` | 86 | 4.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 66 | 79.5% |
| `delivery/pipeline-setup` | 6 | 7.2% |
| `engineering/environment` | 6 | 7.2% |
| `engineering/secrets-in-a-check` | 2 | 2.4% |
| `research/web-search` | 2 | 2.4% |
| `docs/design-doc` | 1 | 1.2% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
