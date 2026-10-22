# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-22.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 173 | 6.4% | 316 | 9,859 | 14 | 23.9 |
| Last 30 days | 238 | 6.3% | 467 | 10,246 | 18 | 29.0 |
| Last year | 238 | 6.3% | 467 | 10,246 | 18 | 29.0 |
| All time | 238 | 6.3% | 467 | 10,246 | 18 | 29.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 223 |
| `failed` | 12 |
| `stopped` | 3 |

## Last 7 days

68 sessions.

**Ran to an end without a report:** 13 of 67 sessions whose last run the core recorded as `completed` — 19.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**204,538,385 tokens** over 99 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,032,533 | 5,707,358 | 39,097,860 | 39,097,860 | 204,538,385 |
| messages per session | 143 | 350 | 571 | 571 | 11,607 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 34 | 50% |
| `reviewer` | 27 | 39.7% |
| `engineer` | 7 | 10.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,678 | 11 | 0 | 0.7% |
| `bash` | 1,475 | 19 | 20 | 1.3% |
| `grep` | 1,207 | 25 | 0 | 2.1% |
| `edit` | 765 | 10 | 0 | 1.3% |
| `fetch` | 229 | 32 | 0 | 14% |
| `get_issue` | 158 | 13 | 4 | 8.2% |
| `list` | 100 | 1 | 0 | 1% |
| `get_issue_comments` | 96 | 0 | 2 | 0% |
| `glob` | 92 | 1 | 0 | 1.1% |
| `get_pr` | 89 | 5 | 0 | 5.6% |
| `get_check_runs` | 77 | 1 | 0 | 1.3% |
| `search_issues` | 66 | 0 | 0 | 0% |
| `get_branch` | 60 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 58 | 0 | 0 | 0% |
| `check_merge_readiness` | 49 | 0 | 0 | 0% |
| `commit_and_push` | 47 | 3 | 0 | 6.4% |
| `create_pr` | 47 | 17 | 0 | 36.2% |
| `get_pr_diff` | 35 | 2 | 0 | 5.7% |
| `request_close_issue` | 30 | 0 | 0 | 0% |
| `write` | 28 | 0 | 0 | 0% |
| `list_prs` | 18 | 0 | 0 | 0% |
| `search_code` | 16 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 4 | 0 | 25% |
| `delegate_readonly` | 15 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `get_pr_reviews` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `merge_pr` | 7 | 0 | 0 | 0% |
| `sync_branch` | 7 | 2 | 0 | 28.6% |
| `launch_sub_agent` | 6 | 2 | 0 | 33.3% |
| `list_issues` | 6 | 0 | 0 | 0% |
| `create_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 837 | 56.7% |
| `search` | 277 | 18.8% |
| `verify` | 181 | 12.3% |
| `edit` | 90 | 6.1% |
| `open` | 90 | 6.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 56 | 96.6% |
| `delivery/pipeline-setup` | 1 | 1.7% |
| `research/web-search` | 1 | 1.7% |

## Last 30 days

104 sessions.

**Ran to an end without a report:** 24 of 102 sessions whose last run the core recorded as `completed` — 23.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**473,941,790 tokens** over 134 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,397,770 | 6,183,128 | 39,097,860 | 73,718,100 | 473,941,790 |
| messages per session | 157 | 402 | 705 | 715 | 20,520 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 49 | 47.1% |
| `reviewer` | 37 | 35.6% |
| `engineer` | 18 | 17.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,727 | 18 | 4 | 0.7% |
| `bash` | 2,324 | 43 | 45 | 1.9% |
| `grep` | 1,899 | 37 | 7 | 1.9% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 977 | 11 | 0 | 1.1% |
| `fetch` | 331 | 35 | 0 | 10.6% |
| `list` | 205 | 2 | 0 | 1% |
| `get_issue` | 197 | 13 | 4 | 6.6% |
| `get_issue_comments` | 149 | 0 | 10 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `glob` | 137 | 1 | 1 | 0.7% |
| `get_pr` | 123 | 9 | 0 | 7.3% |
| `get_check_runs` | 106 | 3 | 0 | 2.8% |
| `atoma_builtin__load_skill` | 104 | 0 | 0 | 0% |
| `get_branch` | 99 | 0 | 0 | 0% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `write` | 78 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `check_merge_readiness` | 63 | 0 | 0 | 0% |
| `commit_and_push` | 56 | 5 | 0 | 8.9% |
| `create_pr` | 56 | 20 | 0 | 35.7% |
| `get_pr_diff` | 47 | 3 | 0 | 6.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `request_close_issue` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `list_prs` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `get_pr_reviews` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
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
| `other` | 1,460 | 62.8% |
| `search` | 353 | 15.2% |
| `verify` | 205 | 8.8% |
| `edit` | 170 | 7.3% |
| `open` | 136 | 5.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 87 | 83.7% |
| `delivery/pipeline-setup` | 6 | 5.8% |
| `engineering/environment` | 6 | 5.8% |
| `engineering/secrets-in-a-check` | 2 | 1.9% |
| `research/web-search` | 2 | 1.9% |
| `docs/design-doc` | 1 | 1% |

## Last year

104 sessions.

**Ran to an end without a report:** 24 of 102 sessions whose last run the core recorded as `completed` — 23.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**473,941,790 tokens** over 134 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,397,770 | 6,183,128 | 39,097,860 | 73,718,100 | 473,941,790 |
| messages per session | 157 | 402 | 705 | 715 | 20,520 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 49 | 47.1% |
| `reviewer` | 37 | 35.6% |
| `engineer` | 18 | 17.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,727 | 18 | 4 | 0.7% |
| `bash` | 2,324 | 43 | 45 | 1.9% |
| `grep` | 1,899 | 37 | 7 | 1.9% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 977 | 11 | 0 | 1.1% |
| `fetch` | 331 | 35 | 0 | 10.6% |
| `list` | 205 | 2 | 0 | 1% |
| `get_issue` | 197 | 13 | 4 | 6.6% |
| `get_issue_comments` | 149 | 0 | 10 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `glob` | 137 | 1 | 1 | 0.7% |
| `get_pr` | 123 | 9 | 0 | 7.3% |
| `get_check_runs` | 106 | 3 | 0 | 2.8% |
| `atoma_builtin__load_skill` | 104 | 0 | 0 | 0% |
| `get_branch` | 99 | 0 | 0 | 0% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `write` | 78 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `check_merge_readiness` | 63 | 0 | 0 | 0% |
| `commit_and_push` | 56 | 5 | 0 | 8.9% |
| `create_pr` | 56 | 20 | 0 | 35.7% |
| `get_pr_diff` | 47 | 3 | 0 | 6.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `request_close_issue` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `list_prs` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `get_pr_reviews` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
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
| `other` | 1,460 | 62.8% |
| `search` | 353 | 15.2% |
| `verify` | 205 | 8.8% |
| `edit` | 170 | 7.3% |
| `open` | 136 | 5.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 87 | 83.7% |
| `delivery/pipeline-setup` | 6 | 5.8% |
| `engineering/environment` | 6 | 5.8% |
| `engineering/secrets-in-a-check` | 2 | 1.9% |
| `research/web-search` | 2 | 1.9% |
| `docs/design-doc` | 1 | 1% |

## All time

106 sessions.

**Ran to an end without a report:** 24 of 102 sessions whose last run the core recorded as `completed` — 23.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**473,941,790 tokens** over 134 runs that reported them, **97.5% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,397,770 | 6,183,128 | 39,097,860 | 73,718,100 | 473,941,790 |
| messages per session | 152 | 402 | 705 | 715 | 20,524 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 51 | 48.1% |
| `reviewer` | 37 | 34.9% |
| `engineer` | 18 | 17% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,727 | 18 | 4 | 0.7% |
| `bash` | 2,324 | 43 | 45 | 1.9% |
| `grep` | 1,899 | 37 | 7 | 1.9% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 977 | 11 | 0 | 1.1% |
| `fetch` | 331 | 35 | 0 | 10.6% |
| `list` | 205 | 2 | 0 | 1% |
| `get_issue` | 197 | 13 | 4 | 6.6% |
| `get_issue_comments` | 149 | 0 | 10 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `glob` | 137 | 1 | 1 | 0.7% |
| `get_pr` | 123 | 9 | 0 | 7.3% |
| `get_check_runs` | 106 | 3 | 0 | 2.8% |
| `atoma_builtin__load_skill` | 104 | 0 | 0 | 0% |
| `get_branch` | 99 | 0 | 0 | 0% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `write` | 78 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `check_merge_readiness` | 63 | 0 | 0 | 0% |
| `commit_and_push` | 56 | 5 | 0 | 8.9% |
| `create_pr` | 56 | 20 | 0 | 35.7% |
| `get_pr_diff` | 47 | 3 | 0 | 6.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `request_close_issue` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `list_prs` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `get_pr_reviews` | 18 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
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
| `other` | 1,460 | 62.8% |
| `search` | 353 | 15.2% |
| `verify` | 205 | 8.8% |
| `edit` | 170 | 7.3% |
| `open` | 136 | 5.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 87 | 83.7% |
| `delivery/pipeline-setup` | 6 | 5.8% |
| `engineering/environment` | 6 | 5.8% |
| `engineering/secrets-in-a-check` | 2 | 1.9% |
| `research/web-search` | 2 | 1.9% |
| `docs/design-doc` | 1 | 1% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
