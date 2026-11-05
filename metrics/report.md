# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-05.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 104 | 1% | 225 | 1,656 | 4 | 50.3 |
| Last 30 days | 517 | 5% | 238 | 9,859 | 12 | 17.6 |
| Last year | 542 | 5% | 246 | 10,246 | 14 | 18.6 |
| All time | 542 | 5% | 246 | 10,246 | 14 | 18.6 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 515 |
| `failed` | 17 |
| `stopped` | 10 |

## Last 7 days

32 sessions.

**Ran to an end without a report:** 2 of 31 sessions whose last run the core recorded as `completed` — 6.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**51,788,237 tokens** over 39 runs that reported them, **98.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**92.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 696,776 | 2,359,968 | 9,658,210 | 9,658,210 | 51,788,237 |
| messages per session | 97 | 188 | 292 | 292 | 3,372 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 12 | 37.5% |
| `engineer` | 10 | 31.3% |
| `reviewer` | 10 | 31.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 560 | 23 | 14 | 4.1% |
| `read` | 347 | 1 | 0 | 0.3% |
| `grep` | 191 | 9 | 0 | 4.7% |
| `edit` | 112 | 3 | 0 | 2.7% |
| `fetch` | 85 | 4 | 0 | 4.7% |
| `list` | 39 | 0 | 0 | 0% |
| `get_pr` | 27 | 0 | 0 | 0% |
| `commit_and_push` | 23 | 0 | 0 | 0% |
| `get_check_runs` | 23 | 1 | 0 | 4.3% |
| `check_merge_readiness` | 22 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 21 | 0 | 0 | 0% |
| `create_pr` | 20 | 6 | 0 | 30% |
| `glob` | 20 | 0 | 0 | 0% |
| `get_issue_comments` | 19 | 0 | 0 | 0% |
| `get_branch` | 18 | 0 | 0 | 0% |
| `get_pr_diff` | 16 | 0 | 0 | 0% |
| `get_issue` | 15 | 0 | 0 | 0% |
| `write` | 15 | 1 | 0 | 6.7% |
| `request_close_issue` | 14 | 0 | 0 | 0% |
| `create_sub_issue` | 12 | 0 | 0 | 0% |
| `get_pr_reviews` | 10 | 0 | 0 | 0% |
| `launch_sub_agent` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `list_prs` | 5 | 0 | 0 | 0% |
| `search_issues` | 5 | 0 | 0 | 0% |
| `search_code` | 4 | 0 | 0 | 0% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `sync_branch` | 3 | 3 | 0 | 100% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `delegate` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `load_skill` | 1 | 1 | 0 | 100% |
| `search_remote_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 427 | 76.3% |
| `edit` | 74 | 13.2% |
| `search` | 35 | 6.3% |
| `open` | 15 | 2.7% |
| `verify` | 9 | 1.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 16 | 72.7% |
| `docs/customer-doc` | 3 | 13.6% |
| `engineering/environment` | 1 | 4.5% |
| `engineering/secrets-in-a-check` | 1 | 4.5% |
| `research/web-search` | 1 | 4.5% |

## Last 30 days

207 sessions.

**Ran to an end without a report:** 39 of 200 sessions whose last run the core recorded as `completed` — 19.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**636,164,913 tokens** over 264 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,189,880 | 4,948,355 | 28,119,706 | 73,718,100 | 636,164,913 |
| messages per session | 107 | 293 | 705 | 731 | 31,048 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 88 | 42.5% |
| `atomaton` | 60 | 29% |
| `engineer` | 59 | 28.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,860 | 96 | 83 | 2% |
| `read` | 3,868 | 22 | 7 | 0.6% |
| `grep` | 2,745 | 74 | 8 | 2.7% |
| `edit` | 1,537 | 27 | 0 | 1.8% |
| `shell__shell_execute` | 555 | 4 | 8 | 0.7% |
| `fetch` | 530 | 44 | 0 | 8.3% |
| `get_issue` | 286 | 13 | 5 | 4.5% |
| `get_issue_comments` | 269 | 0 | 10 | 0% |
| `get_pr` | 245 | 9 | 3 | 3.7% |
| `get_check_runs` | 237 | 11 | 0 | 4.6% |
| `list` | 229 | 2 | 0 | 0.9% |
| `glob` | 191 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 171 | 0 | 0 | 0% |
| `get_branch` | 161 | 0 | 0 | 0% |
| `check_merge_readiness` | 151 | 0 | 0 | 0% |
| `commit_and_push` | 134 | 8 | 0 | 6% |
| `create_pr` | 121 | 38 | 0 | 31.4% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 107 | 3 | 0 | 2.8% |
| `write` | 98 | 2 | 0 | 2% |
| `request_close_issue` | 77 | 1 | 0 | 1.3% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `get_pr_reviews` | 47 | 0 | 0 | 0% |
| `merge_pr` | 47 | 0 | 0 | 0% |
| `list_pr_review_comments` | 36 | 0 | 0 | 0% |
| `web__fetch` | 32 | 5 | 0 | 15.6% |
| `create_root_issue` | 28 | 1 | 0 | 3.6% |
| `search_code` | 28 | 0 | 0 | 0% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `search_remote_code` | 24 | 6 | 0 | 25% |
| `launch_sub_agent` | 23 | 2 | 0 | 8.7% |
| `delegate` | 21 | 0 | 0 | 0% |
| `create_sub_issue` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `list_issues` | 14 | 0 | 0 | 0% |
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
| `other` | 3,629 | 74.7% |
| `search` | 433 | 8.9% |
| `edit` | 397 | 8.2% |
| `verify` | 233 | 4.8% |
| `open` | 168 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 155 | 89.1% |
| `engineering/environment` | 4 | 2.3% |
| `engineering/secrets-in-a-check` | 4 | 2.3% |
| `research/web-search` | 4 | 2.3% |
| `delivery/pipeline-setup` | 3 | 1.7% |
| `docs/customer-doc` | 3 | 1.7% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

223 sessions.

**Ran to an end without a report:** 44 of 216 sessions whose last run the core recorded as `completed` — 20.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**709,138,254 tokens** over 277 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,232,143 | 5,255,408 | 28,119,706 | 73,718,100 | 709,138,254 |
| messages per session | 111 | 306 | 705 | 731 | 34,724 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 91 | 40.8% |
| `atomaton` | 67 | 30% |
| `engineer` | 65 | 29.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,860 | 96 | 83 | 2% |
| `read` | 4,354 | 23 | 8 | 0.5% |
| `grep` | 3,006 | 78 | 8 | 2.6% |
| `edit` | 1,618 | 27 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 530 | 44 | 0 | 8.3% |
| `get_issue` | 286 | 13 | 5 | 4.5% |
| `list` | 278 | 3 | 0 | 1.1% |
| `get_issue_comments` | 269 | 0 | 10 | 0% |
| `get_pr` | 245 | 9 | 3 | 3.7% |
| `get_check_runs` | 237 | 11 | 0 | 4.6% |
| `glob` | 201 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 192 | 0 | 0 | 0% |
| `get_branch` | 161 | 0 | 0 | 0% |
| `check_merge_readiness` | 151 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 134 | 8 | 0 | 6% |
| `write` | 127 | 2 | 0 | 1.6% |
| `create_pr` | 121 | 38 | 0 | 31.4% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 107 | 3 | 0 | 2.8% |
| `request_close_issue` | 77 | 1 | 0 | 1.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `get_pr_reviews` | 47 | 0 | 0 | 0% |
| `merge_pr` | 47 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 36 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `create_root_issue` | 28 | 1 | 0 | 3.6% |
| `search_code` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `search_remote_code` | 24 | 6 | 0 | 25% |
| `launch_sub_agent` | 23 | 2 | 0 | 8.7% |
| `delegate` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_sub_issue` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 14 | 0 | 0 | 0% |
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
| `other` | 3,629 | 74.7% |
| `search` | 433 | 8.9% |
| `edit` | 397 | 8.2% |
| `verify` | 233 | 4.8% |
| `open` | 168 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 169 | 86.7% |
| `delivery/pipeline-setup` | 7 | 3.6% |
| `engineering/environment` | 7 | 3.6% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `research/web-search` | 4 | 2.1% |
| `docs/customer-doc` | 3 | 1.5% |
| `docs/design-doc` | 1 | 0.5% |

## All time

228 sessions.

**Ran to an end without a report:** 44 of 216 sessions whose last run the core recorded as `completed` — 20.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 5 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**709,138,254 tokens** over 277 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,232,143 | 5,255,408 | 28,119,706 | 73,718,100 | 709,138,254 |
| messages per session | 110 | 306 | 705 | 731 | 34,746 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 91 | 39.9% |
| `atomaton` | 70 | 30.7% |
| `engineer` | 67 | 29.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,860 | 96 | 83 | 2% |
| `read` | 4,354 | 23 | 8 | 0.5% |
| `grep` | 3,006 | 78 | 8 | 2.6% |
| `edit` | 1,618 | 27 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 530 | 44 | 0 | 8.3% |
| `get_issue` | 286 | 13 | 5 | 4.5% |
| `list` | 278 | 3 | 0 | 1.1% |
| `get_issue_comments` | 269 | 0 | 10 | 0% |
| `get_pr` | 245 | 9 | 3 | 3.7% |
| `get_check_runs` | 237 | 11 | 0 | 4.6% |
| `glob` | 201 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 192 | 0 | 0 | 0% |
| `get_branch` | 161 | 0 | 0 | 0% |
| `check_merge_readiness` | 151 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 134 | 8 | 0 | 6% |
| `write` | 127 | 2 | 0 | 1.6% |
| `create_pr` | 121 | 38 | 0 | 31.4% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 107 | 3 | 0 | 2.8% |
| `request_close_issue` | 77 | 1 | 0 | 1.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `get_pr_reviews` | 47 | 0 | 0 | 0% |
| `merge_pr` | 47 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 36 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `create_root_issue` | 28 | 1 | 0 | 3.6% |
| `search_code` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `search_remote_code` | 24 | 6 | 0 | 25% |
| `launch_sub_agent` | 23 | 2 | 0 | 8.7% |
| `delegate` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_sub_issue` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 14 | 0 | 0 | 0% |
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
| `other` | 3,629 | 74.7% |
| `search` | 433 | 8.9% |
| `edit` | 397 | 8.2% |
| `verify` | 233 | 4.8% |
| `open` | 168 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 169 | 86.7% |
| `delivery/pipeline-setup` | 7 | 3.6% |
| `engineering/environment` | 7 | 3.6% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `research/web-search` | 4 | 2.1% |
| `docs/customer-doc` | 3 | 1.5% |
| `docs/design-doc` | 1 | 0.5% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-03 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
