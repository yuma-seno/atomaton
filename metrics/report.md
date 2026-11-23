# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-23.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 39 | 28.2% | 76 | 696 | 11 | 5.6 |
| Last 30 days | 554 | 9.2% | 243 | 6,099 | 12 | 17.6 |
| Last year | 819 | 8.4% | 266 | 10,246 | 15 | 19.9 |
| All time | 819 | 8.4% | 266 | 10,246 | 15 | 19.9 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 750 |
| `failed` | 58 |
| `stopped` | 11 |

## Last 7 days

19 sessions.

**Ran to an end without a report:** 5 of 17 sessions whose last run the core recorded as `completed` — 29.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**21,887,839 tokens** over 13 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 771,671 | 3,400,391 | 7,840,910 | 7,840,910 | 21,887,839 |
| messages per session | 67 | 186 | 198 | 198 | 1,615 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 9 | 47.4% |
| `engineer` | 8 | 42.1% |
| `atomaton` | 2 | 10.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 311 | 2 | 0 | 0.6% |
| `bash` | 196 | 3 | 1 | 1.5% |
| `grep` | 189 | 0 | 0 | 0% |
| `edit` | 53 | 3 | 0 | 5.7% |
| `list` | 28 | 0 | 0 | 0% |
| `load_skill` | 18 | 0 | 0 | 0% |
| `get_check_runs` | 13 | 0 | 0 | 0% |
| `get_pr` | 13 | 0 | 0 | 0% |
| `fetch` | 12 | 0 | 0 | 0% |
| `glob` | 10 | 0 | 0 | 0% |
| `check_merge_readiness` | 9 | 0 | 0 | 0% |
| `commit_and_push` | 9 | 1 | 0 | 11.1% |
| `create_pr` | 9 | 2 | 0 | 22.2% |
| `get_branch` | 8 | 0 | 0 | 0% |
| `get_issue_comments` | 8 | 0 | 0 | 0% |
| `get_pr_reviews` | 8 | 0 | 0 | 0% |
| `request_close_issue` | 6 | 0 | 0 | 0% |
| `get_issue` | 5 | 0 | 0 | 0% |
| `list_pr_review_comments` | 5 | 0 | 0 | 0% |
| `merge_pr` | 4 | 0 | 0 | 0% |
| `search_remote_code` | 4 | 3 | 0 | 75% |
| `write` | 4 | 0 | 0 | 0% |
| `get_pr_diff` | 3 | 0 | 0 | 0% |
| `create_root_issue` | 1 | 0 | 0 | 0% |
| `search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 138 | 70.4% |
| `edit` | 33 | 16.8% |
| `open` | 9 | 4.6% |
| `search` | 9 | 4.6% |
| `verify` | 7 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 14 | 77.8% |
| `research/web-search` | 2 | 11.1% |
| `writing/japanese` | 2 | 11.1% |

## Last 30 days

204 sessions.

**Ran to an end without a report:** 35 of 192 sessions whose last run the core recorded as `completed` — 18.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**614,952,627 tokens** over 249 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the 247 of 249 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,224,669 | 6,417,588 | 20,308,488 | 29,805,044 | 614,952,627 |
| messages per session | 120 | 307 | 408 | 439 | 30,651 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 89 | 43.6% |
| `engineer` | 84 | 41.2% |
| `atomaton` | 30 | 14.7% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,820 | 127 | 82 | 2.2% |
| `read` | 3,436 | 14 | 4 | 0.4% |
| `grep` | 2,895 | 70 | 14 | 2.4% |
| `edit` | 1,135 | 22 | 0 | 1.9% |
| `fetch` | 714 | 62 | 0 | 8.7% |
| `get_check_runs` | 229 | 10 | 0 | 4.4% |
| `get_pr` | 225 | 0 | 3 | 0% |
| `get_issue_comments` | 201 | 0 | 0 | 0% |
| `glob` | 185 | 0 | 0 | 0% |
| `list` | 181 | 3 | 0 | 1.7% |
| `get_issue` | 161 | 1 | 1 | 0.6% |
| `commit_and_push` | 142 | 5 | 0 | 3.5% |
| `check_merge_readiness` | 140 | 0 | 0 | 0% |
| `create_pr` | 119 | 36 | 0 | 30.3% |
| `write` | 117 | 2 | 0 | 1.7% |
| `get_branch` | 105 | 0 | 0 | 0% |
| `load_skill` | 99 | 9 | 0 | 9.1% |
| `atoma_builtin__load_skill` | 96 | 1 | 0 | 1% |
| `get_pr_diff` | 86 | 0 | 0 | 0% |
| `get_pr_reviews` | 72 | 0 | 0 | 0% |
| `request_close_issue` | 72 | 1 | 0 | 1.4% |
| `merge_pr` | 57 | 0 | 0 | 0% |
| `list_pr_review_comments` | 52 | 0 | 0 | 0% |
| `search_issues` | 43 | 0 | 1 | 0% |
| `list_prs` | 32 | 0 | 0 | 0% |
| `search_code` | 31 | 0 | 0 | 0% |
| `search_remote_code` | 28 | 12 | 0 | 42.9% |
| `create_root_issue` | 21 | 0 | 0 | 0% |
| `create_sub_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 19 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `delegate_readonly` | 8 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `delegate_large` | 5 | 0 | 0 | 0% |
| `sync_branch` | 5 | 4 | 0 | 80% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,053 | 86.8% |
| `edit` | 451 | 7.7% |
| `search` | 162 | 2.8% |
| `open` | 126 | 2.2% |
| `verify` | 28 | 0.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 142 | 72.8% |
| `writing/japanese` | 33 | 16.9% |
| `research/web-search` | 8 | 4.1% |
| `delivery/pipeline-setup` | 4 | 2.1% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `docs/customer-doc` | 3 | 1.5% |
| `engineering/environment` | 1 | 0.5% |

## Last year

319 sessions.

**Ran to an end without a report:** 60 of 304 sessions whose last run the core recorded as `completed` — 19.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,132,822,856 tokens** over 403 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 401 of 403 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,307,949 | 6,183,128 | 27,846,035 | 73,718,100 | 1,132,822,856 |
| messages per session | 131 | 339 | 583 | 731 | 53,089 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 133 | 41.7% |
| `engineer` | 105 | 32.9% |
| `atomaton` | 80 | 25.1% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,467 | 171 | 127 | 2% |
| `read` | 6,452 | 34 | 8 | 0.5% |
| `grep` | 4,963 | 112 | 21 | 2.3% |
| `edit` | 2,213 | 38 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,054 | 98 | 0 | 9.3% |
| `list` | 390 | 5 | 0 | 1.3% |
| `get_issue` | 365 | 14 | 5 | 3.8% |
| `get_pr` | 362 | 9 | 3 | 2.5% |
| `get_issue_comments` | 361 | 0 | 10 | 0% |
| `get_check_runs` | 352 | 13 | 0 | 3.7% |
| `glob` | 328 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 216 | 0 | 0 | 0% |
| `get_branch` | 213 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `commit_and_push` | 205 | 10 | 0 | 4.9% |
| `write` | 203 | 2 | 0 | 1% |
| `create_pr` | 179 | 57 | 0 | 31.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 142 | 3 | 0 | 2.1% |
| `search_issues` | 132 | 0 | 3 | 0% |
| `request_close_issue` | 108 | 1 | 0 | 0.9% |
| `load_skill` | 99 | 9 | 0 | 9.1% |
| `get_pr_reviews` | 90 | 0 | 0 | 0% |
| `merge_pr` | 69 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_pr_review_comments` | 67 | 0 | 0 | 0% |
| `list_prs` | 67 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search_remote_code` | 47 | 17 | 0 | 36.2% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 34 | 1 | 0 | 2.9% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `delegate_readonly` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 17 | 0 | 0 | 0% |
| `sync_branch` | 16 | 7 | 0 | 43.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 6,747 | 79.7% |
| `edit` | 665 | 7.9% |
| `search` | 536 | 6.3% |
| `open` | 272 | 3.2% |
| `verify` | 247 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 239 | 77.3% |
| `writing/japanese` | 33 | 10.7% |
| `delivery/pipeline-setup` | 10 | 3.2% |
| `research/web-search` | 10 | 3.2% |
| `engineering/environment` | 7 | 2.3% |
| `engineering/secrets-in-a-check` | 6 | 1.9% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## All time

338 sessions.

**Ran to an end without a report:** 60 of 304 sessions whose last run the core recorded as `completed` — 19.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,132,822,856 tokens** over 403 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 401 of 403 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,307,949 | 6,183,128 | 27,846,035 | 73,718,100 | 1,132,822,856 |
| messages per session | 120 | 331 | 583 | 731 | 53,213 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 139 | 41.1% |
| `engineer` | 115 | 34% |
| `atomaton` | 83 | 24.6% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,467 | 171 | 127 | 2% |
| `read` | 6,452 | 34 | 8 | 0.5% |
| `grep` | 4,963 | 112 | 21 | 2.3% |
| `edit` | 2,213 | 38 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,054 | 98 | 0 | 9.3% |
| `list` | 390 | 5 | 0 | 1.3% |
| `get_issue` | 365 | 14 | 5 | 3.8% |
| `get_pr` | 362 | 9 | 3 | 2.5% |
| `get_issue_comments` | 361 | 0 | 10 | 0% |
| `get_check_runs` | 352 | 13 | 0 | 3.7% |
| `glob` | 328 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 216 | 0 | 0 | 0% |
| `get_branch` | 213 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `commit_and_push` | 205 | 10 | 0 | 4.9% |
| `write` | 203 | 2 | 0 | 1% |
| `create_pr` | 179 | 57 | 0 | 31.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 142 | 3 | 0 | 2.1% |
| `search_issues` | 132 | 0 | 3 | 0% |
| `request_close_issue` | 108 | 1 | 0 | 0.9% |
| `load_skill` | 99 | 9 | 0 | 9.1% |
| `get_pr_reviews` | 90 | 0 | 0 | 0% |
| `merge_pr` | 69 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_pr_review_comments` | 67 | 0 | 0 | 0% |
| `list_prs` | 67 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search_remote_code` | 47 | 17 | 0 | 36.2% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 34 | 1 | 0 | 2.9% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `delegate_readonly` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 17 | 0 | 0 | 0% |
| `sync_branch` | 16 | 7 | 0 | 43.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 6,747 | 79.7% |
| `edit` | 665 | 7.9% |
| `search` | 536 | 6.3% |
| `open` | 272 | 3.2% |
| `verify` | 247 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 239 | 77.3% |
| `writing/japanese` | 33 | 10.7% |
| `delivery/pipeline-setup` | 10 | 3.2% |
| `research/web-search` | 10 | 3.2% |
| `engineering/environment` | 7 | 2.3% |
| `engineering/secrets-in-a-check` | 6 | 1.9% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-23 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/agent-prompt-surface`
- `security/atomaton-surface`
- `security/gh-actions-surface`
- `security/on-demand-audit`
