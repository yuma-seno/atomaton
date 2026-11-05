# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-05.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 119 | 1.7% | 225 | 1,656 | 4 | 40.4 |
| Last 30 days | 532 | 5.1% | 238 | 9,859 | 12 | 18.3 |
| Last year | 557 | 5% | 246 | 10,246 | 14 | 18.9 |
| All time | 557 | 5% | 246 | 10,246 | 14 | 18.9 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 529 |
| `failed` | 18 |
| `stopped` | 10 |

## Last 7 days

38 sessions.

**Ran to an end without a report:** 3 of 36 sessions whose last run the core recorded as `completed` — 8.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**60,161,931 tokens** over 48 runs that reported them, **98.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 696,776 | 2,359,968 | 9,658,210 | 9,658,210 | 60,161,931 |
| messages per session | 99 | 188 | 292 | 292 | 4,163 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 14 | 36.8% |
| `engineer` | 12 | 31.6% |
| `reviewer` | 12 | 31.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 650 | 26 | 16 | 4% |
| `read` | 455 | 1 | 0 | 0.2% |
| `grep` | 330 | 13 | 0 | 3.9% |
| `edit` | 130 | 3 | 0 | 2.3% |
| `fetch` | 107 | 5 | 0 | 4.7% |
| `list` | 45 | 0 | 0 | 0% |
| `get_check_runs` | 32 | 2 | 0 | 6.3% |
| `get_pr` | 32 | 0 | 0 | 0% |
| `glob` | 30 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 26 | 0 | 0 | 0% |
| `check_merge_readiness` | 26 | 0 | 0 | 0% |
| `commit_and_push` | 25 | 0 | 0 | 0% |
| `create_pr` | 23 | 7 | 0 | 30.4% |
| `get_branch` | 22 | 0 | 0 | 0% |
| `get_issue` | 22 | 0 | 0 | 0% |
| `get_issue_comments` | 22 | 0 | 0 | 0% |
| `get_pr_diff` | 18 | 0 | 0 | 0% |
| `request_close_issue` | 16 | 0 | 0 | 0% |
| `write` | 15 | 1 | 0 | 6.7% |
| `create_sub_issue` | 13 | 0 | 0 | 0% |
| `get_pr_reviews` | 13 | 0 | 0 | 0% |
| `merge_pr` | 13 | 0 | 0 | 0% |
| `launch_sub_agent` | 11 | 0 | 0 | 0% |
| `list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `list_prs` | 5 | 0 | 0 | 0% |
| `search_code` | 5 | 0 | 0 | 0% |
| `search_issues` | 5 | 0 | 0 | 0% |
| `search_remote_code` | 5 | 1 | 0 | 20% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `sync_branch` | 3 | 3 | 0 | 100% |
| `delegate` | 2 | 0 | 0 | 0% |
| `list_issues` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `load_skill` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 500 | 76.9% |
| `edit` | 81 | 12.5% |
| `search` | 43 | 6.6% |
| `open` | 17 | 2.6% |
| `verify` | 9 | 1.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 21 | 77.8% |
| `docs/customer-doc` | 3 | 11.1% |
| `engineering/environment` | 1 | 3.7% |
| `engineering/secrets-in-a-check` | 1 | 3.7% |
| `research/web-search` | 1 | 3.7% |

## Last 30 days

213 sessions.

**Ran to an end without a report:** 40 of 205 sessions whose last run the core recorded as `completed` — 19.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**644,538,607 tokens** over 273 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,146,525 | 4,919,495 | 28,119,706 | 73,718,100 | 644,538,607 |
| messages per session | 108 | 292 | 705 | 731 | 31,839 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 90 | 42.3% |
| `atomaton` | 62 | 29.1% |
| `engineer` | 61 | 28.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,950 | 99 | 85 | 2% |
| `read` | 3,976 | 22 | 7 | 0.6% |
| `grep` | 2,884 | 78 | 8 | 2.7% |
| `edit` | 1,555 | 27 | 0 | 1.7% |
| `shell__shell_execute` | 555 | 4 | 8 | 0.7% |
| `fetch` | 552 | 45 | 0 | 8.2% |
| `get_issue` | 293 | 13 | 5 | 4.4% |
| `get_issue_comments` | 272 | 0 | 10 | 0% |
| `get_pr` | 250 | 9 | 3 | 3.6% |
| `get_check_runs` | 246 | 12 | 0 | 4.9% |
| `list` | 235 | 2 | 0 | 0.9% |
| `glob` | 201 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 176 | 0 | 0 | 0% |
| `get_branch` | 165 | 0 | 0 | 0% |
| `check_merge_readiness` | 155 | 0 | 0 | 0% |
| `commit_and_push` | 136 | 8 | 0 | 5.9% |
| `create_pr` | 124 | 39 | 0 | 31.5% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 109 | 3 | 0 | 2.8% |
| `write` | 98 | 2 | 0 | 2% |
| `request_close_issue` | 79 | 1 | 0 | 1.3% |
| `get_pr_reviews` | 50 | 0 | 0 | 0% |
| `merge_pr` | 50 | 0 | 0 | 0% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `list_pr_review_comments` | 37 | 0 | 0 | 0% |
| `web__fetch` | 32 | 5 | 0 | 15.6% |
| `search_code` | 29 | 0 | 0 | 0% |
| `create_root_issue` | 28 | 1 | 0 | 3.6% |
| `search_remote_code` | 28 | 7 | 0 | 25% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `delegate` | 22 | 0 | 0 | 0% |
| `create_sub_issue` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `list_issues` | 15 | 0 | 0 | 0% |
| `sync_branch` | 14 | 6 | 0 | 42.9% |
| `github__get_issue_comments` | 12 | 0 | 0 | 0% |
| `github__get_issue` | 10 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `github__get_check_runs` | 7 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `github__get_branch` | 5 | 0 | 0 | 0% |
| `github__get_pr` | 5 | 0 | 0 | 0% |
| `github__list_prs` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `search__search_issues` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__commit_and_push` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__create_pr` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,702 | 74.8% |
| `search` | 441 | 8.9% |
| `edit` | 404 | 8.2% |
| `verify` | 233 | 4.7% |
| `open` | 170 | 3.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 160 | 89.4% |
| `engineering/environment` | 4 | 2.2% |
| `engineering/secrets-in-a-check` | 4 | 2.2% |
| `research/web-search` | 4 | 2.2% |
| `delivery/pipeline-setup` | 3 | 1.7% |
| `docs/customer-doc` | 3 | 1.7% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

229 sessions.

**Ran to an end without a report:** 45 of 221 sessions whose last run the core recorded as `completed` — 20.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**717,511,948 tokens** over 286 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,221,174 | 5,246,133 | 28,119,706 | 73,718,100 | 717,511,948 |
| messages per session | 111 | 306 | 705 | 731 | 35,515 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 93 | 40.6% |
| `atomaton` | 69 | 30.1% |
| `engineer` | 67 | 29.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,950 | 99 | 85 | 2% |
| `read` | 4,462 | 23 | 8 | 0.5% |
| `grep` | 3,145 | 82 | 8 | 2.6% |
| `edit` | 1,636 | 27 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 552 | 45 | 0 | 8.2% |
| `get_issue` | 293 | 13 | 5 | 4.4% |
| `list` | 284 | 3 | 0 | 1.1% |
| `get_issue_comments` | 272 | 0 | 10 | 0% |
| `get_pr` | 250 | 9 | 3 | 3.6% |
| `get_check_runs` | 246 | 12 | 0 | 4.9% |
| `glob` | 211 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 197 | 0 | 0 | 0% |
| `get_branch` | 165 | 0 | 0 | 0% |
| `check_merge_readiness` | 155 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 136 | 8 | 0 | 5.9% |
| `write` | 127 | 2 | 0 | 1.6% |
| `create_pr` | 124 | 39 | 0 | 31.5% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 109 | 3 | 0 | 2.8% |
| `request_close_issue` | 79 | 1 | 0 | 1.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 50 | 0 | 0 | 0% |
| `merge_pr` | 50 | 0 | 0 | 0% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 37 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `search_code` | 29 | 0 | 0 | 0% |
| `create_root_issue` | 28 | 1 | 0 | 3.6% |
| `search_remote_code` | 28 | 7 | 0 | 25% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `delegate` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_sub_issue` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 15 | 0 | 0 | 0% |
| `sync_branch` | 14 | 6 | 0 | 42.9% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,702 | 74.8% |
| `search` | 441 | 8.9% |
| `edit` | 404 | 8.2% |
| `verify` | 233 | 4.7% |
| `open` | 170 | 3.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 174 | 87% |
| `delivery/pipeline-setup` | 7 | 3.5% |
| `engineering/environment` | 7 | 3.5% |
| `engineering/secrets-in-a-check` | 4 | 2% |
| `research/web-search` | 4 | 2% |
| `docs/customer-doc` | 3 | 1.5% |
| `docs/design-doc` | 1 | 0.5% |

## All time

234 sessions.

**Ran to an end without a report:** 45 of 221 sessions whose last run the core recorded as `completed` — 20.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 5 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**717,511,948 tokens** over 286 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,221,174 | 5,246,133 | 28,119,706 | 73,718,100 | 717,511,948 |
| messages per session | 110 | 303 | 705 | 731 | 35,537 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 93 | 39.7% |
| `atomaton` | 72 | 30.8% |
| `engineer` | 69 | 29.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,950 | 99 | 85 | 2% |
| `read` | 4,462 | 23 | 8 | 0.5% |
| `grep` | 3,145 | 82 | 8 | 2.6% |
| `edit` | 1,636 | 27 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 552 | 45 | 0 | 8.2% |
| `get_issue` | 293 | 13 | 5 | 4.4% |
| `list` | 284 | 3 | 0 | 1.1% |
| `get_issue_comments` | 272 | 0 | 10 | 0% |
| `get_pr` | 250 | 9 | 3 | 3.6% |
| `get_check_runs` | 246 | 12 | 0 | 4.9% |
| `glob` | 211 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 197 | 0 | 0 | 0% |
| `get_branch` | 165 | 0 | 0 | 0% |
| `check_merge_readiness` | 155 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 136 | 8 | 0 | 5.9% |
| `write` | 127 | 2 | 0 | 1.6% |
| `create_pr` | 124 | 39 | 0 | 31.5% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 109 | 3 | 0 | 2.8% |
| `request_close_issue` | 79 | 1 | 0 | 1.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 50 | 0 | 0 | 0% |
| `merge_pr` | 50 | 0 | 0 | 0% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 37 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `search_code` | 29 | 0 | 0 | 0% |
| `create_root_issue` | 28 | 1 | 0 | 3.6% |
| `search_remote_code` | 28 | 7 | 0 | 25% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `delegate` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_sub_issue` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 15 | 0 | 0 | 0% |
| `sync_branch` | 14 | 6 | 0 | 42.9% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,702 | 74.8% |
| `search` | 441 | 8.9% |
| `edit` | 404 | 8.2% |
| `verify` | 233 | 4.7% |
| `open` | 170 | 3.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 174 | 87% |
| `delivery/pipeline-setup` | 7 | 3.5% |
| `engineering/environment` | 7 | 3.5% |
| `engineering/secrets-in-a-check` | 4 | 2% |
| `research/web-search` | 4 | 2% |
| `docs/customer-doc` | 3 | 1.5% |
| `docs/design-doc` | 1 | 0.5% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-05 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
