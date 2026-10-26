# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-26.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 285 | 4.2% | 191 | 9,689 | 15 | 12.1 |
| Last 30 days | 423 | 5.9% | 261 | 10,246 | 16 | 17.5 |
| Last year | 423 | 5.9% | 261 | 10,246 | 16 | 17.5 |
| All time | 423 | 5.9% | 261 | 10,246 | 16 | 17.5 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 398 |
| `failed` | 15 |
| `stopped` | 10 |

## Last 7 days

126 sessions.

**Ran to an end without a report:** 23 of 122 sessions whose last run the core recorded as `completed` — 18.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**278,463,981 tokens** over 158 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,135,650 | 4,615,931 | 8,400,110 | 8,676,293 | 278,463,981 |
| messages per session | 101 | 268 | 445 | 731 | 16,820 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 62 | 49.2% |
| `engineer` | 39 | 31% |
| `atomaton` | 25 | 19.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,594 | 32 | 32 | 1.2% |
| `read` | 2,147 | 5 | 4 | 0.2% |
| `grep` | 1,558 | 47 | 1 | 3% |
| `edit` | 1,104 | 21 | 0 | 1.9% |
| `fetch` | 159 | 10 | 0 | 6.3% |
| `get_check_runs` | 157 | 7 | 0 | 4.5% |
| `get_pr` | 154 | 3 | 3 | 1.9% |
| `get_issue_comments` | 144 | 0 | 2 | 0% |
| `get_issue` | 123 | 0 | 5 | 0% |
| `check_merge_readiness` | 105 | 0 | 0 | 0% |
| `glob` | 104 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 103 | 0 | 0 | 0% |
| `commit_and_push` | 87 | 4 | 0 | 4.6% |
| `list` | 87 | 2 | 0 | 2.3% |
| `get_branch` | 81 | 0 | 0 | 0% |
| `create_pr` | 71 | 17 | 0 | 23.9% |
| `get_pr_diff` | 70 | 2 | 0 | 2.9% |
| `write` | 60 | 1 | 0 | 1.7% |
| `request_close_issue` | 48 | 1 | 0 | 2.1% |
| `merge_pr` | 27 | 0 | 0 | 0% |
| `list_prs` | 26 | 0 | 0 | 0% |
| `search_issues` | 25 | 0 | 1 | 0% |
| `get_pr_reviews` | 22 | 0 | 0 | 0% |
| `create_root_issue` | 21 | 1 | 0 | 4.8% |
| `list_pr_review_comments` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 17 | 4 | 0 | 23.5% |
| `delegate` | 11 | 0 | 0 | 0% |
| `search_code` | 10 | 0 | 0 | 0% |
| `delegate_readonly` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `list_issues` | 5 | 0 | 0 | 0% |
| `sync_branch` | 4 | 1 | 0 | 25% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `create_sub_issue` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 2,018 | 77.8% |
| `edit` | 183 | 7.1% |
| `search` | 174 | 6.7% |
| `verify` | 141 | 5.4% |
| `open` | 78 | 3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 103 | 98.1% |
| `delivery/pipeline-setup` | 1 | 1% |
| `engineering/secrets-in-a-check` | 1 | 1% |

## Last 30 days

188 sessions.

**Ran to an end without a report:** 42 of 182 sessions whose last run the core recorded as `completed` — 23.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**635,248,565 tokens** over 230 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 5,619,407 | 28,119,706 | 73,718,100 | 635,248,565 |
| messages per session | 119 | 327 | 715 | 731 | 30,893 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 80 | 42.6% |
| `atomaton` | 55 | 29.3% |
| `engineer` | 53 | 28.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,202 | 70 | 69 | 1.7% |
| `read` | 3,929 | 21 | 8 | 0.5% |
| `grep` | 2,776 | 67 | 8 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,498 | 24 | 0 | 1.6% |
| `fetch` | 438 | 39 | 0 | 8.9% |
| `get_issue` | 271 | 13 | 5 | 4.8% |
| `get_issue_comments` | 250 | 0 | 10 | 0% |
| `list` | 241 | 3 | 0 | 1.2% |
| `get_pr` | 218 | 9 | 3 | 4.1% |
| `get_check_runs` | 214 | 10 | 0 | 4.7% |
| `glob` | 177 | 1 | 1 | 0.6% |
| `atoma_builtin__load_skill` | 171 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 143 | 0 | 0 | 0% |
| `check_merge_readiness` | 129 | 0 | 0 | 0% |
| `write` | 112 | 1 | 0 | 0.9% |
| `search_issues` | 109 | 0 | 3 | 0% |
| `commit_and_push` | 107 | 8 | 0 | 7.5% |
| `create_pr` | 100 | 32 | 0 | 32% |
| `get_pr_diff` | 92 | 3 | 0 | 3.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 63 | 1 | 0 | 1.6% |
| `list_prs` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_reviews` | 36 | 0 | 0 | 0% |
| `merge_pr` | 36 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `list_pr_review_comments` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 24 | 0 | 0 | 0% |
| `create_root_issue` | 23 | 1 | 0 | 4.3% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 2 | 0 | 15.4% |
| `list_issues` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
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
| `other` | 3,123 | 74.3% |
| `search` | 395 | 9.4% |
| `edit` | 307 | 7.3% |
| `verify` | 224 | 5.3% |
| `open` | 153 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 154 | 89% |
| `delivery/pipeline-setup` | 7 | 4% |
| `engineering/environment` | 6 | 3.5% |
| `engineering/secrets-in-a-check` | 3 | 1.7% |
| `research/web-search` | 2 | 1.2% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

188 sessions.

**Ran to an end without a report:** 42 of 182 sessions whose last run the core recorded as `completed` — 23.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**635,248,565 tokens** over 230 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 5,619,407 | 28,119,706 | 73,718,100 | 635,248,565 |
| messages per session | 119 | 327 | 715 | 731 | 30,893 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 80 | 42.6% |
| `atomaton` | 55 | 29.3% |
| `engineer` | 53 | 28.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,202 | 70 | 69 | 1.7% |
| `read` | 3,929 | 21 | 8 | 0.5% |
| `grep` | 2,776 | 67 | 8 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,498 | 24 | 0 | 1.6% |
| `fetch` | 438 | 39 | 0 | 8.9% |
| `get_issue` | 271 | 13 | 5 | 4.8% |
| `get_issue_comments` | 250 | 0 | 10 | 0% |
| `list` | 241 | 3 | 0 | 1.2% |
| `get_pr` | 218 | 9 | 3 | 4.1% |
| `get_check_runs` | 214 | 10 | 0 | 4.7% |
| `glob` | 177 | 1 | 1 | 0.6% |
| `atoma_builtin__load_skill` | 171 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 143 | 0 | 0 | 0% |
| `check_merge_readiness` | 129 | 0 | 0 | 0% |
| `write` | 112 | 1 | 0 | 0.9% |
| `search_issues` | 109 | 0 | 3 | 0% |
| `commit_and_push` | 107 | 8 | 0 | 7.5% |
| `create_pr` | 100 | 32 | 0 | 32% |
| `get_pr_diff` | 92 | 3 | 0 | 3.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 63 | 1 | 0 | 1.6% |
| `list_prs` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_reviews` | 36 | 0 | 0 | 0% |
| `merge_pr` | 36 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `list_pr_review_comments` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 24 | 0 | 0 | 0% |
| `create_root_issue` | 23 | 1 | 0 | 4.3% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 2 | 0 | 15.4% |
| `list_issues` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
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
| `other` | 3,123 | 74.3% |
| `search` | 395 | 9.4% |
| `edit` | 307 | 7.3% |
| `verify` | 224 | 5.3% |
| `open` | 153 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 154 | 89% |
| `delivery/pipeline-setup` | 7 | 4% |
| `engineering/environment` | 6 | 3.5% |
| `engineering/secrets-in-a-check` | 3 | 1.7% |
| `research/web-search` | 2 | 1.2% |
| `docs/design-doc` | 1 | 0.6% |

## All time

190 sessions.

**Ran to an end without a report:** 42 of 182 sessions whose last run the core recorded as `completed` — 23.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**635,248,565 tokens** over 230 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 5,619,407 | 28,119,706 | 73,718,100 | 635,248,565 |
| messages per session | 117 | 327 | 715 | 731 | 30,897 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 80 | 42.1% |
| `atomaton` | 57 | 30% |
| `engineer` | 53 | 27.9% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,202 | 70 | 69 | 1.7% |
| `read` | 3,929 | 21 | 8 | 0.5% |
| `grep` | 2,776 | 67 | 8 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,498 | 24 | 0 | 1.6% |
| `fetch` | 438 | 39 | 0 | 8.9% |
| `get_issue` | 271 | 13 | 5 | 4.8% |
| `get_issue_comments` | 250 | 0 | 10 | 0% |
| `list` | 241 | 3 | 0 | 1.2% |
| `get_pr` | 218 | 9 | 3 | 4.1% |
| `get_check_runs` | 214 | 10 | 0 | 4.7% |
| `glob` | 177 | 1 | 1 | 0.6% |
| `atoma_builtin__load_skill` | 171 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 143 | 0 | 0 | 0% |
| `check_merge_readiness` | 129 | 0 | 0 | 0% |
| `write` | 112 | 1 | 0 | 0.9% |
| `search_issues` | 109 | 0 | 3 | 0% |
| `commit_and_push` | 107 | 8 | 0 | 7.5% |
| `create_pr` | 100 | 32 | 0 | 32% |
| `get_pr_diff` | 92 | 3 | 0 | 3.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 63 | 1 | 0 | 1.6% |
| `list_prs` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_reviews` | 36 | 0 | 0 | 0% |
| `merge_pr` | 36 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `list_pr_review_comments` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 24 | 0 | 0 | 0% |
| `create_root_issue` | 23 | 1 | 0 | 4.3% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `delegate` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 2 | 0 | 15.4% |
| `list_issues` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
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
| `other` | 3,123 | 74.3% |
| `search` | 395 | 9.4% |
| `edit` | 307 | 7.3% |
| `verify` | 224 | 5.3% |
| `open` | 153 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 154 | 89% |
| `delivery/pipeline-setup` | 7 | 4% |
| `engineering/environment` | 6 | 3.5% |
| `engineering/secrets-in-a-check` | 3 | 1.7% |
| `research/web-search` | 2 | 1.2% |
| `docs/design-doc` | 1 | 0.6% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-10-26 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
