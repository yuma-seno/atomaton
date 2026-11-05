# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-05.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 123 | 1.6% | 225 | 1,454 | 4 | 57.5 |
| Last 30 days | 535 | 5% | 235 | 9,859 | 11 | 18.6 |
| Last year | 560 | 5% | 244 | 10,246 | 13 | 19.0 |
| All time | 560 | 5% | 244 | 10,246 | 13 | 19.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 532 |
| `failed` | 18 |
| `stopped` | 10 |

## Last 7 days

32 sessions.

**Ran to an end without a report:** 2 of 30 sessions whose last run the core recorded as `completed` — 6.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**45,268,805 tokens** over 39 runs that reported them, **98.6% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**92% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 696,776 | 2,359,968 | 5,175,119 | 5,175,119 | 45,268,805 |
| messages per session | 97 | 188 | 292 | 292 | 3,453 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 11 | 34.4% |
| `engineer` | 11 | 34.4% |
| `reviewer` | 10 | 31.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 571 | 23 | 15 | 4% |
| `read` | 350 | 1 | 0 | 0.3% |
| `grep` | 189 | 9 | 0 | 4.8% |
| `edit` | 122 | 4 | 0 | 3.3% |
| `fetch` | 90 | 5 | 0 | 5.6% |
| `list` | 38 | 0 | 0 | 0% |
| `get_pr` | 26 | 0 | 0 | 0% |
| `commit_and_push` | 25 | 0 | 0 | 0% |
| `get_check_runs` | 23 | 1 | 0 | 4.3% |
| `check_merge_readiness` | 22 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 21 | 0 | 0 | 0% |
| `create_pr` | 21 | 6 | 0 | 28.6% |
| `get_pr_diff` | 20 | 0 | 0 | 0% |
| `glob` | 20 | 0 | 0 | 0% |
| `get_issue_comments` | 19 | 0 | 0 | 0% |
| `get_branch` | 17 | 0 | 0 | 0% |
| `create_sub_issue` | 16 | 0 | 0 | 0% |
| `request_close_issue` | 16 | 0 | 0 | 0% |
| `write` | 15 | 1 | 0 | 6.7% |
| `get_issue` | 13 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
| `get_pr_reviews` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 7 | 0 | 0 | 0% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `list_prs` | 5 | 0 | 0 | 0% |
| `search_code` | 4 | 0 | 0 | 0% |
| `search_issues` | 4 | 0 | 0 | 0% |
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
| `other` | 437 | 76.5% |
| `edit` | 76 | 13.3% |
| `search` | 35 | 6.1% |
| `open` | 15 | 2.6% |
| `verify` | 8 | 1.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 16 | 72.7% |
| `docs/customer-doc` | 3 | 13.6% |
| `engineering/environment` | 1 | 4.5% |
| `engineering/secrets-in-a-check` | 1 | 4.5% |
| `research/web-search` | 1 | 4.5% |

## Last 30 days

206 sessions.

**Ran to an end without a report:** 39 of 198 sessions whose last run the core recorded as `completed` — 19.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**626,506,703 tokens** over 263 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,173,182 | 4,919,495 | 28,119,706 | 73,718,100 | 626,506,703 |
| messages per session | 110 | 293 | 705 | 731 | 31,099 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 88 | 42.7% |
| `atomaton` | 59 | 28.6% |
| `engineer` | 59 | 28.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,857 | 96 | 84 | 2% |
| `read` | 3,871 | 22 | 7 | 0.6% |
| `grep` | 2,743 | 74 | 8 | 2.7% |
| `edit` | 1,547 | 28 | 0 | 1.8% |
| `shell__shell_execute` | 555 | 4 | 8 | 0.7% |
| `fetch` | 535 | 45 | 0 | 8.4% |
| `get_issue` | 284 | 13 | 5 | 4.6% |
| `get_issue_comments` | 269 | 0 | 10 | 0% |
| `get_pr` | 244 | 9 | 3 | 3.7% |
| `get_check_runs` | 237 | 11 | 0 | 4.6% |
| `list` | 228 | 2 | 0 | 0.9% |
| `glob` | 191 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 171 | 0 | 0 | 0% |
| `get_branch` | 160 | 0 | 0 | 0% |
| `check_merge_readiness` | 151 | 0 | 0 | 0% |
| `commit_and_push` | 136 | 8 | 0 | 5.9% |
| `create_pr` | 122 | 38 | 0 | 31.1% |
| `search_issues` | 112 | 0 | 3 | 0% |
| `get_pr_diff` | 111 | 3 | 0 | 2.7% |
| `write` | 98 | 2 | 0 | 2% |
| `request_close_issue` | 79 | 1 | 0 | 1.3% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `get_pr_reviews` | 47 | 0 | 0 | 0% |
| `merge_pr` | 47 | 0 | 0 | 0% |
| `list_pr_review_comments` | 36 | 0 | 0 | 0% |
| `web__fetch` | 32 | 5 | 0 | 15.6% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `search_code` | 28 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `search_remote_code` | 24 | 6 | 0 | 25% |
| `delegate` | 21 | 0 | 0 | 0% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
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
| `other` | 3,626 | 74.7% |
| `search` | 433 | 8.9% |
| `edit` | 398 | 8.2% |
| `verify` | 232 | 4.8% |
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

222 sessions.

**Ran to an end without a report:** 44 of 214 sessions whose last run the core recorded as `completed` — 20.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**699,480,044 tokens** over 276 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,232,143 | 5,246,133 | 28,119,706 | 73,718,100 | 699,480,044 |
| messages per session | 111 | 306 | 705 | 731 | 34,775 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 91 | 41% |
| `atomaton` | 66 | 29.7% |
| `engineer` | 65 | 29.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,857 | 96 | 84 | 2% |
| `read` | 4,357 | 23 | 8 | 0.5% |
| `grep` | 3,004 | 78 | 8 | 2.6% |
| `edit` | 1,628 | 28 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 535 | 45 | 0 | 8.4% |
| `get_issue` | 284 | 13 | 5 | 4.6% |
| `list` | 277 | 3 | 0 | 1.1% |
| `get_issue_comments` | 269 | 0 | 10 | 0% |
| `get_pr` | 244 | 9 | 3 | 3.7% |
| `get_check_runs` | 237 | 11 | 0 | 4.6% |
| `glob` | 201 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 192 | 0 | 0 | 0% |
| `get_branch` | 160 | 0 | 0 | 0% |
| `check_merge_readiness` | 151 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 136 | 8 | 0 | 5.9% |
| `write` | 127 | 2 | 0 | 1.6% |
| `create_pr` | 122 | 38 | 0 | 31.1% |
| `search_issues` | 112 | 0 | 3 | 0% |
| `get_pr_diff` | 111 | 3 | 0 | 2.7% |
| `request_close_issue` | 79 | 1 | 0 | 1.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `get_pr_reviews` | 47 | 0 | 0 | 0% |
| `merge_pr` | 47 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 36 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `search_code` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `search_remote_code` | 24 | 6 | 0 | 25% |
| `delegate` | 21 | 0 | 0 | 0% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
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
| `other` | 3,626 | 74.7% |
| `search` | 433 | 8.9% |
| `edit` | 398 | 8.2% |
| `verify` | 232 | 4.8% |
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

226 sessions.

**Ran to an end without a report:** 44 of 214 sessions whose last run the core recorded as `completed` — 20.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 4 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**699,480,044 tokens** over 276 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,232,143 | 5,246,133 | 28,119,706 | 73,718,100 | 699,480,044 |
| messages per session | 111 | 306 | 705 | 731 | 34,794 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 91 | 40.3% |
| `atomaton` | 68 | 30.1% |
| `engineer` | 67 | 29.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,857 | 96 | 84 | 2% |
| `read` | 4,357 | 23 | 8 | 0.5% |
| `grep` | 3,004 | 78 | 8 | 2.6% |
| `edit` | 1,628 | 28 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 535 | 45 | 0 | 8.4% |
| `get_issue` | 284 | 13 | 5 | 4.6% |
| `list` | 277 | 3 | 0 | 1.1% |
| `get_issue_comments` | 269 | 0 | 10 | 0% |
| `get_pr` | 244 | 9 | 3 | 3.7% |
| `get_check_runs` | 237 | 11 | 0 | 4.6% |
| `glob` | 201 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 192 | 0 | 0 | 0% |
| `get_branch` | 160 | 0 | 0 | 0% |
| `check_merge_readiness` | 151 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 136 | 8 | 0 | 5.9% |
| `write` | 127 | 2 | 0 | 1.6% |
| `create_pr` | 122 | 38 | 0 | 31.1% |
| `search_issues` | 112 | 0 | 3 | 0% |
| `get_pr_diff` | 111 | 3 | 0 | 2.7% |
| `request_close_issue` | 79 | 1 | 0 | 1.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `get_pr_reviews` | 47 | 0 | 0 | 0% |
| `merge_pr` | 47 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 36 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `search_code` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `search_remote_code` | 24 | 6 | 0 | 25% |
| `delegate` | 21 | 0 | 0 | 0% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
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
| `other` | 3,626 | 74.7% |
| `search` | 433 | 8.9% |
| `edit` | 398 | 8.2% |
| `verify` | 232 | 4.8% |
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
| 2026-11-05 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
