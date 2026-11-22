# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-22.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 28 | 17.9% | 153 | 4,256 | 9 | 23.3 |
| Last 30 days | 549 | 8.4% | 248 | 9,689 | 13 | 18.7 |
| Last year | 797 | 7.9% | 277 | 10,246 | 15 | 20.7 |
| All time | 797 | 7.9% | 277 | 10,246 | 15 | 20.7 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 734 |
| `failed` | 52 |
| `stopped` | 11 |

## Last 7 days

11 sessions.

**Ran to an end without a report:** 2 of 11 sessions whose last run the core recorded as `completed` — 18.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**43,072,314 tokens** over 13 runs that reported them, **96.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,977,743 | 8,391,640 | 12,751,838 | 12,751,838 | 43,072,314 |
| messages per session | 177 | 219 | 286 | 286 | 1,651 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 5 | 45.5% |
| `atomaton` | 3 | 27.3% |
| `engineer` | 3 | 27.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 315 | 2 | 0 | 0.6% |
| `grep` | 218 | 2 | 1 | 0.9% |
| `bash` | 163 | 2 | 3 | 1.2% |
| `fetch` | 44 | 0 | 0 | 0% |
| `edit` | 30 | 0 | 0 | 0% |
| `list` | 30 | 0 | 0 | 0% |
| `glob` | 20 | 0 | 0 | 0% |
| `get_pr` | 15 | 0 | 0 | 0% |
| `load_skill` | 15 | 0 | 0 | 0% |
| `get_check_runs` | 13 | 1 | 0 | 7.7% |
| `get_branch` | 9 | 0 | 0 | 0% |
| `check_merge_readiness` | 8 | 0 | 0 | 0% |
| `get_issue_comments` | 8 | 0 | 0 | 0% |
| `commit_and_push` | 7 | 1 | 0 | 14.3% |
| `get_issue` | 7 | 0 | 0 | 0% |
| `request_close_issue` | 5 | 0 | 0 | 0% |
| `search_remote_code` | 5 | 4 | 0 | 80% |
| `create_pr` | 4 | 0 | 0 | 0% |
| `get_pr_reviews` | 4 | 0 | 0 | 0% |
| `list_pr_review_comments` | 4 | 0 | 0 | 0% |
| `get_pr_diff` | 3 | 0 | 0 | 0% |
| `write` | 3 | 0 | 0 | 0% |
| `create_root_issue` | 2 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
| `list_prs` | 2 | 0 | 0 | 0% |
| `merge_pr` | 2 | 0 | 0 | 0% |
| `search_code` | 2 | 0 | 0 | 0% |
| `delegate` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `delegate_readonly` | 1 | 0 | 0 | 0% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `search_issues` | 1 | 0 | 0 | 0% |
| `sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 130 | 79.8% |
| `edit` | 26 | 16% |
| `verify` | 4 | 2.5% |
| `open` | 3 | 1.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 7 | 46.7% |
| `writing/japanese` | 6 | 40% |
| `research/web-search` | 2 | 13.3% |

## Last 30 days

201 sessions.

**Ran to an end without a report:** 32 of 190 sessions whose last run the core recorded as `completed` — 16.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**635,882,052 tokens** over 255 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the 253 of 255 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,560 | 6,417,588 | 20,308,488 | 29,805,044 | 635,882,052 |
| messages per session | 125 | 323 | 425 | 731 | 31,415 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 88 | 43.8% |
| `engineer` | 80 | 39.8% |
| `atomaton` | 32 | 15.9% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,015 | 125 | 82 | 2.1% |
| `read` | 3,532 | 14 | 4 | 0.4% |
| `grep` | 2,898 | 72 | 14 | 2.5% |
| `edit` | 1,201 | 24 | 0 | 2% |
| `fetch` | 717 | 62 | 0 | 8.6% |
| `get_check_runs` | 237 | 10 | 0 | 4.2% |
| `get_pr` | 227 | 0 | 3 | 0% |
| `get_issue_comments` | 205 | 0 | 0 | 0% |
| `glob` | 185 | 0 | 0 | 0% |
| `list` | 181 | 3 | 0 | 1.7% |
| `get_issue` | 166 | 1 | 1 | 0.6% |
| `check_merge_readiness` | 144 | 0 | 0 | 0% |
| `commit_and_push` | 142 | 5 | 0 | 3.5% |
| `write` | 119 | 2 | 0 | 1.7% |
| `create_pr` | 115 | 35 | 0 | 30.4% |
| `get_branch` | 106 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 104 | 1 | 0 | 1% |
| `get_pr_diff` | 91 | 0 | 0 | 0% |
| `load_skill` | 89 | 9 | 0 | 10.1% |
| `request_close_issue` | 70 | 1 | 0 | 1.4% |
| `get_pr_reviews` | 66 | 0 | 0 | 0% |
| `merge_pr` | 55 | 0 | 0 | 0% |
| `list_pr_review_comments` | 49 | 0 | 0 | 0% |
| `search_issues` | 43 | 0 | 1 | 0% |
| `list_prs` | 34 | 0 | 0 | 0% |
| `search_code` | 32 | 0 | 0 | 0% |
| `search_remote_code` | 28 | 12 | 0 | 42.9% |
| `create_root_issue` | 24 | 0 | 0 | 0% |
| `create_sub_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 19 | 0 | 0 | 0% |
| `delegate` | 17 | 0 | 0 | 0% |
| `delegate_readonly` | 8 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `sync_branch` | 5 | 4 | 0 | 80% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,191 | 86.3% |
| `edit` | 483 | 8% |
| `search` | 174 | 2.9% |
| `open` | 130 | 2.2% |
| `verify` | 37 | 0.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 140 | 72.5% |
| `writing/japanese` | 33 | 17.1% |
| `research/web-search` | 8 | 4.1% |
| `delivery/pipeline-setup` | 4 | 2.1% |
| `engineering/secrets-in-a-check` | 4 | 2.1% |
| `docs/customer-doc` | 3 | 1.6% |
| `engineering/environment` | 1 | 0.5% |

## Last year

307 sessions.

**Ran to an end without a report:** 56 of 294 sessions whose last run the core recorded as `completed` — 19%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,128,105,865 tokens** over 397 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 395 of 397 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 6,399,907 | 28,119,706 | 73,718,100 | 1,128,105,865 |
| messages per session | 141 | 341 | 583 | 731 | 52,280 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 127 | 41.4% |
| `engineer` | 99 | 32.2% |
| `atomaton` | 80 | 26.1% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,369 | 168 | 127 | 2% |
| `read` | 6,319 | 33 | 8 | 0.5% |
| `grep` | 4,866 | 112 | 21 | 2.3% |
| `edit` | 2,178 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,054 | 98 | 0 | 9.3% |
| `list` | 387 | 5 | 0 | 1.3% |
| `get_issue` | 365 | 14 | 5 | 3.8% |
| `get_issue_comments` | 357 | 0 | 10 | 0% |
| `get_pr` | 354 | 9 | 3 | 2.5% |
| `get_check_runs` | 347 | 13 | 0 | 3.7% |
| `glob` | 324 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 211 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 209 | 0 | 0 | 0% |
| `write` | 200 | 2 | 0 | 1% |
| `commit_and_push` | 198 | 10 | 0 | 5.1% |
| `create_pr` | 171 | 55 | 0 | 32.2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 140 | 3 | 0 | 2.1% |
| `search_issues` | 132 | 0 | 3 | 0% |
| `request_close_issue` | 104 | 1 | 0 | 1% |
| `load_skill` | 89 | 9 | 0 | 10.1% |
| `get_pr_reviews` | 84 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 67 | 0 | 0 | 0% |
| `merge_pr` | 66 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_pr_review_comments` | 64 | 0 | 0 | 0% |
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
| `other` | 6,678 | 79.8% |
| `edit` | 656 | 7.8% |
| `search` | 527 | 6.3% |
| `open` | 266 | 3.2% |
| `verify` | 242 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 229 | 76.6% |
| `writing/japanese` | 33 | 11% |
| `delivery/pipeline-setup` | 10 | 3.3% |
| `research/web-search` | 10 | 3.3% |
| `engineering/environment` | 7 | 2.3% |
| `engineering/secrets-in-a-check` | 6 | 2% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## All time

326 sessions.

**Ran to an end without a report:** 56 of 294 sessions whose last run the core recorded as `completed` — 19%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,128,105,865 tokens** over 397 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 395 of 397 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 6,399,907 | 28,119,706 | 73,718,100 | 1,128,105,865 |
| messages per session | 126 | 334 | 583 | 731 | 52,404 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 133 | 40.8% |
| `engineer` | 109 | 33.4% |
| `atomaton` | 83 | 25.5% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,369 | 168 | 127 | 2% |
| `read` | 6,319 | 33 | 8 | 0.5% |
| `grep` | 4,866 | 112 | 21 | 2.3% |
| `edit` | 2,178 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,054 | 98 | 0 | 9.3% |
| `list` | 387 | 5 | 0 | 1.3% |
| `get_issue` | 365 | 14 | 5 | 3.8% |
| `get_issue_comments` | 357 | 0 | 10 | 0% |
| `get_pr` | 354 | 9 | 3 | 2.5% |
| `get_check_runs` | 347 | 13 | 0 | 3.7% |
| `glob` | 324 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 211 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 209 | 0 | 0 | 0% |
| `write` | 200 | 2 | 0 | 1% |
| `commit_and_push` | 198 | 10 | 0 | 5.1% |
| `create_pr` | 171 | 55 | 0 | 32.2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 140 | 3 | 0 | 2.1% |
| `search_issues` | 132 | 0 | 3 | 0% |
| `request_close_issue` | 104 | 1 | 0 | 1% |
| `load_skill` | 89 | 9 | 0 | 10.1% |
| `get_pr_reviews` | 84 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 67 | 0 | 0 | 0% |
| `merge_pr` | 66 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_pr_review_comments` | 64 | 0 | 0 | 0% |
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
| `other` | 6,678 | 79.8% |
| `edit` | 656 | 7.8% |
| `search` | 527 | 6.3% |
| `open` | 266 | 3.2% |
| `verify` | 242 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 229 | 76.6% |
| `writing/japanese` | 33 | 11% |
| `delivery/pipeline-setup` | 10 | 3.3% |
| `research/web-search` | 10 | 3.3% |
| `engineering/environment` | 7 | 2.3% |
| `engineering/secrets-in-a-check` | 6 | 2% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-22 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/agent-prompt-surface`
- `security/atomaton-surface`
- `security/gh-actions-surface`
- `security/on-demand-audit`
