# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-03.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 41 | 2.4% | 258 | 2,509 | 12 | 19.0 |
| Last 30 days | 445 | 5.8% | 256 | 9,859 | 16 | 16.9 |
| Last year | 465 | 5.6% | 261 | 10,246 | 16 | 17.5 |
| All time | 465 | 5.6% | 261 | 10,246 | 16 | 17.5 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 439 |
| `failed` | 16 |
| `stopped` | 10 |

## Last 7 days

17 sessions.

**Ran to an end without a report:** 3 of 17 sessions whose last run the core recorded as `completed` — 17.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**46,085,928 tokens** over 24 runs that reported them, **98.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,495,022 | 5,175,119 | 8,959,867 | 8,959,867 | 46,085,928 |
| messages per session | 97 | 239 | 292 | 292 | 1,979 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 6 | 35.3% |
| `reviewer` | 6 | 35.3% |
| `atomaton` | 5 | 29.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 333 | 17 | 7 | 5.1% |
| `read` | 260 | 2 | 0 | 0.8% |
| `grep` | 152 | 7 | 0 | 4.6% |
| `edit` | 56 | 0 | 0 | 0% |
| `fetch` | 36 | 1 | 0 | 2.8% |
| `list` | 23 | 0 | 0 | 0% |
| `glob` | 20 | 0 | 0 | 0% |
| `get_pr` | 13 | 0 | 0 | 0% |
| `commit_and_push` | 12 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 10 | 0 | 0 | 0% |
| `check_merge_readiness` | 10 | 0 | 0 | 0% |
| `get_check_runs` | 10 | 1 | 0 | 10% |
| `get_issue_comments` | 10 | 0 | 0 | 0% |
| `get_issue` | 7 | 0 | 0 | 0% |
| `create_pr` | 6 | 1 | 0 | 16.7% |
| `get_branch` | 6 | 0 | 0 | 0% |
| `write` | 6 | 0 | 0 | 0% |
| `get_pr_diff` | 5 | 0 | 0 | 0% |
| `get_pr_reviews` | 5 | 0 | 0 | 0% |
| `merge_pr` | 5 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `launch_sub_agent` | 4 | 0 | 0 | 0% |
| `request_close_issue` | 4 | 0 | 0 | 0% |
| `list_pr_review_comments` | 3 | 0 | 0 | 0% |
| `search_code` | 3 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `create_root_issue` | 1 | 0 | 0 | 0% |
| `delegate_readonly` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `load_skill` | 1 | 1 | 0 | 100% |
| `search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 263 | 79% |
| `edit` | 43 | 12.9% |
| `search` | 11 | 3.3% |
| `open` | 10 | 3% |
| `verify` | 6 | 1.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 7 | 63.6% |
| `research/web-search` | 2 | 18.2% |
| `engineering/environment` | 1 | 9.1% |
| `engineering/secrets-in-a-check` | 1 | 9.1% |

## Last 30 days

193 sessions.

**Ran to an end without a report:** 41 of 187 sessions whose last run the core recorded as `completed` — 21.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**628,250,925 tokens** over 245 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,221,174 | 5,246,133 | 28,119,706 | 73,718,100 | 628,250,925 |
| messages per session | 111 | 323 | 715 | 731 | 30,736 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 84 | 43.5% |
| `atomaton` | 55 | 28.5% |
| `engineer` | 54 | 28% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,535 | 87 | 76 | 1.9% |
| `read` | 3,822 | 22 | 7 | 0.6% |
| `grep` | 2,707 | 70 | 8 | 2.6% |
| `edit` | 1,502 | 24 | 0 | 1.6% |
| `shell__shell_execute` | 1,094 | 13 | 15 | 1.2% |
| `fetch` | 474 | 40 | 0 | 8.4% |
| `get_issue` | 278 | 13 | 5 | 4.7% |
| `get_issue_comments` | 260 | 0 | 10 | 0% |
| `get_pr` | 231 | 9 | 3 | 3.9% |
| `get_check_runs` | 224 | 11 | 0 | 4.9% |
| `list` | 220 | 2 | 0 | 0.9% |
| `glob` | 187 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 169 | 0 | 0 | 0% |
| `get_branch` | 149 | 0 | 0 | 0% |
| `check_merge_readiness` | 139 | 0 | 0 | 0% |
| `commit_and_push` | 119 | 8 | 0 | 6.7% |
| `search_issues` | 110 | 0 | 3 | 0% |
| `create_pr` | 106 | 33 | 0 | 31.1% |
| `write` | 99 | 1 | 0 | 1% |
| `get_pr_diff` | 97 | 3 | 0 | 3.1% |
| `web__fetch` | 93 | 8 | 0 | 8.6% |
| `request_close_issue` | 67 | 1 | 0 | 1.5% |
| `list_prs` | 44 | 0 | 0 | 0% |
| `get_pr_reviews` | 41 | 0 | 0 | 0% |
| `merge_pr` | 41 | 0 | 0 | 0% |
| `github__get_issue_comments` | 40 | 0 | 0 | 0% |
| `github__get_issue` | 38 | 0 | 0 | 0% |
| `list_pr_review_comments` | 32 | 0 | 0 | 0% |
| `search__search_issues` | 28 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `github__get_check_runs` | 26 | 0 | 0 | 0% |
| `create_root_issue` | 24 | 1 | 0 | 4.2% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
| `delegate_readonly` | 22 | 0 | 0 | 0% |
| `delegate` | 20 | 0 | 0 | 0% |
| `github__list_prs` | 19 | 0 | 0 | 0% |
| `github__get_branch` | 17 | 0 | 0 | 0% |
| `launch_sub_agent` | 17 | 2 | 0 | 11.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__get_pr` | 15 | 1 | 0 | 6.7% |
| `list_issues` | 14 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__check_merge_readiness` | 10 | 0 | 0 | 0% |
| `github__create_issue` | 10 | 0 | 0 | 0% |
| `create_sub_issue` | 8 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `github__commit_and_push` | 7 | 1 | 0 | 14.3% |
| `github__get_pr_diff` | 6 | 0 | 0 | 0% |
| `github__list_issues` | 6 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `github__create_pr` | 4 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 3 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `search__search_code` | 2 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `delegate_readonly__run` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,386 | 74.7% |
| `search` | 406 | 9% |
| `edit` | 350 | 7.7% |
| `verify` | 230 | 5.1% |
| `open` | 163 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 152 | 88.4% |
| `engineering/environment` | 6 | 3.5% |
| `delivery/pipeline-setup` | 5 | 2.9% |
| `engineering/secrets-in-a-check` | 4 | 2.3% |
| `research/web-search` | 4 | 2.3% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

205 sessions.

**Ran to an end without a report:** 45 of 199 sessions whose last run the core recorded as `completed` — 22.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**682,195,441 tokens** over 255 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,307,949 | 5,484,738 | 28,119,706 | 73,718,100 | 682,195,441 |
| messages per session | 113 | 323 | 705 | 731 | 32,872 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 86 | 42% |
| `atomaton` | 60 | 29.3% |
| `engineer` | 59 | 28.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,535 | 87 | 76 | 1.9% |
| `read` | 4,189 | 23 | 8 | 0.5% |
| `grep` | 2,928 | 74 | 8 | 2.5% |
| `edit` | 1,554 | 24 | 0 | 1.5% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 474 | 40 | 0 | 8.4% |
| `get_issue` | 278 | 13 | 5 | 4.7% |
| `list` | 264 | 3 | 0 | 1.1% |
| `get_issue_comments` | 260 | 0 | 10 | 0% |
| `get_pr` | 231 | 9 | 3 | 3.9% |
| `get_check_runs` | 224 | 11 | 0 | 4.9% |
| `glob` | 197 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 181 | 0 | 0 | 0% |
| `get_branch` | 149 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `check_merge_readiness` | 139 | 0 | 0 | 0% |
| `commit_and_push` | 119 | 8 | 0 | 6.7% |
| `write` | 118 | 1 | 0 | 0.8% |
| `search_issues` | 110 | 0 | 3 | 0% |
| `create_pr` | 106 | 33 | 0 | 31.1% |
| `get_pr_diff` | 97 | 3 | 0 | 3.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `request_close_issue` | 67 | 1 | 0 | 1.5% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_reviews` | 41 | 0 | 0 | 0% |
| `merge_pr` | 41 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `list_pr_review_comments` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `create_root_issue` | 24 | 1 | 0 | 4.2% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
| `delegate_readonly` | 22 | 0 | 0 | 0% |
| `delegate` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 17 | 2 | 0 | 11.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 14 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `create_sub_issue` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,386 | 74.7% |
| `search` | 406 | 9% |
| `edit` | 350 | 7.7% |
| `verify` | 230 | 5.1% |
| `open` | 163 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 161 | 87.5% |
| `delivery/pipeline-setup` | 7 | 3.8% |
| `engineering/environment` | 7 | 3.8% |
| `engineering/secrets-in-a-check` | 4 | 2.2% |
| `research/web-search` | 4 | 2.2% |
| `docs/design-doc` | 1 | 0.5% |

## All time

209 sessions.

**Ran to an end without a report:** 45 of 199 sessions whose last run the core recorded as `completed` — 22.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 4 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**682,195,441 tokens** over 255 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,307,949 | 5,484,738 | 28,119,706 | 73,718,100 | 682,195,441 |
| messages per session | 111 | 323 | 705 | 731 | 32,891 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 86 | 41.1% |
| `atomaton` | 62 | 29.7% |
| `engineer` | 61 | 29.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,535 | 87 | 76 | 1.9% |
| `read` | 4,189 | 23 | 8 | 0.5% |
| `grep` | 2,928 | 74 | 8 | 2.5% |
| `edit` | 1,554 | 24 | 0 | 1.5% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 474 | 40 | 0 | 8.4% |
| `get_issue` | 278 | 13 | 5 | 4.7% |
| `list` | 264 | 3 | 0 | 1.1% |
| `get_issue_comments` | 260 | 0 | 10 | 0% |
| `get_pr` | 231 | 9 | 3 | 3.9% |
| `get_check_runs` | 224 | 11 | 0 | 4.9% |
| `glob` | 197 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 181 | 0 | 0 | 0% |
| `get_branch` | 149 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `check_merge_readiness` | 139 | 0 | 0 | 0% |
| `commit_and_push` | 119 | 8 | 0 | 6.7% |
| `write` | 118 | 1 | 0 | 0.8% |
| `search_issues` | 110 | 0 | 3 | 0% |
| `create_pr` | 106 | 33 | 0 | 31.1% |
| `get_pr_diff` | 97 | 3 | 0 | 3.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `request_close_issue` | 67 | 1 | 0 | 1.5% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_reviews` | 41 | 0 | 0 | 0% |
| `merge_pr` | 41 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `list_pr_review_comments` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `create_root_issue` | 24 | 1 | 0 | 4.2% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
| `delegate_readonly` | 22 | 0 | 0 | 0% |
| `delegate` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 17 | 2 | 0 | 11.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 14 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `create_sub_issue` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,386 | 74.7% |
| `search` | 406 | 9% |
| `edit` | 350 | 7.7% |
| `verify` | 230 | 5.1% |
| `open` | 163 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 161 | 87.5% |
| `delivery/pipeline-setup` | 7 | 3.8% |
| `engineering/environment` | 7 | 3.8% |
| `engineering/secrets-in-a-check` | 4 | 2.2% |
| `research/web-search` | 4 | 2.2% |
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
