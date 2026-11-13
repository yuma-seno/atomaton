# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-13.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 150 | 12% | 451 | 6,099 | 21 | 22.9 |
| Last 30 days | 648 | 6.8% | 253 | 9,859 | 14 | 18.7 |
| Last year | 713 | 6.7% | 271 | 10,246 | 15 | 19.9 |
| All time | 713 | 6.7% | 271 | 10,246 | 15 | 19.9 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 665 |
| `failed` | 37 |
| `stopped` | 11 |

## Last 7 days

47 sessions.

**Ran to an end without a report:** 7 of 46 sessions whose last run the core recorded as `completed` — 15.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**274,619,410 tokens** over 72 runs that reported them, **97.6% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**96.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,584,100 | 10,626,209 | 29,805,044 | 29,805,044 | 274,619,410 |
| messages per session | 226 | 374 | 439 | 439 | 10,687 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 21 | 44.7% |
| `reviewer` | 17 | 36.2% |
| `atomaton` | 9 | 19.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,526 | 54 | 33 | 2.1% |
| `read` | 910 | 4 | 0 | 0.4% |
| `grep` | 875 | 23 | 10 | 2.6% |
| `edit` | 407 | 7 | 0 | 1.7% |
| `fetch` | 243 | 14 | 0 | 5.8% |
| `get_check_runs` | 73 | 0 | 0 | 0% |
| `get_pr` | 71 | 0 | 0 | 0% |
| `glob` | 61 | 0 | 0 | 0% |
| `write` | 58 | 0 | 0 | 0% |
| `get_issue_comments` | 57 | 0 | 0 | 0% |
| `list` | 55 | 0 | 0 | 0% |
| `get_issue` | 51 | 1 | 0 | 2% |
| `commit_and_push` | 46 | 1 | 0 | 2.2% |
| `load_skill` | 40 | 4 | 0 | 10% |
| `check_merge_readiness` | 39 | 0 | 0 | 0% |
| `create_pr` | 32 | 11 | 0 | 34.4% |
| `get_branch` | 23 | 0 | 0 | 0% |
| `get_pr_reviews` | 22 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `search_issues` | 21 | 0 | 0 | 0% |
| `get_pr_diff` | 18 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `request_close_issue` | 14 | 0 | 0 | 0% |
| `search_remote_code` | 13 | 5 | 0 | 38.5% |
| `merge_pr` | 12 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 11 | 1 | 0 | 9.1% |
| `list_prs` | 11 | 0 | 0 | 0% |
| `delegate` | 6 | 0 | 0 | 0% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `delegate_large` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `attach_file` | 1 | 1 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `delegate_readonly` | 1 | 0 | 0 | 0% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `sync_branch` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 2,223 | 88% |
| `edit` | 176 | 7% |
| `open` | 64 | 2.5% |
| `search` | 58 | 2.3% |
| `verify` | 5 | 0.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 33 | 64.7% |
| `writing/japanese` | 12 | 23.5% |
| `research/web-search` | 3 | 5.9% |
| `engineering/secrets-in-a-check` | 2 | 3.9% |
| `delivery/pipeline-setup` | 1 | 2% |

## Last 30 days

240 sessions.

**Ran to an end without a report:** 41 of 231 sessions whose last run the core recorded as `completed` — 17.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**729,288,925 tokens** over 325 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,201,847 | 5,067,507 | 20,308,488 | 39,097,860 | 729,288,925 |
| messages per session | 115 | 327 | 463 | 731 | 37,442 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 101 | 42.1% |
| `engineer` | 79 | 32.9% |
| `atomaton` | 60 | 25% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,656 | 130 | 93 | 2% |
| `read` | 4,358 | 21 | 4 | 0.5% |
| `grep` | 3,340 | 93 | 11 | 2.8% |
| `edit` | 1,840 | 33 | 0 | 1.8% |
| `fetch` | 691 | 56 | 0 | 8.1% |
| `get_issue` | 303 | 14 | 5 | 4.6% |
| `get_check_runs` | 291 | 10 | 0 | 3.4% |
| `get_pr` | 288 | 5 | 3 | 1.7% |
| `get_issue_comments` | 275 | 0 | 2 | 0% |
| `glob` | 227 | 1 | 0 | 0.4% |
| `list` | 224 | 2 | 0 | 0.9% |
| `check_merge_readiness` | 181 | 0 | 0 | 0% |
| `commit_and_push` | 174 | 7 | 0 | 4% |
| `atoma_builtin__load_skill` | 164 | 1 | 0 | 0.6% |
| `create_pr` | 149 | 48 | 0 | 32.2% |
| `get_branch` | 149 | 0 | 0 | 0% |
| `write` | 135 | 2 | 0 | 1.5% |
| `get_pr_diff` | 115 | 2 | 0 | 1.7% |
| `search_issues` | 109 | 0 | 1 | 0% |
| `request_close_issue` | 90 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 64 | 0 | 0 | 0% |
| `merge_pr` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 47 | 0 | 0 | 0% |
| `list_prs` | 47 | 0 | 0 | 0% |
| `load_skill` | 45 | 9 | 0 | 20% |
| `search_code` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 38 | 11 | 0 | 28.9% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `delegate` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `delegate_readonly` | 20 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `list_issues` | 12 | 0 | 0 | 0% |
| `sync_branch` | 11 | 6 | 0 | 54.5% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `create_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `attach_file` | 1 | 1 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,322 | 80% |
| `edit` | 500 | 7.5% |
| `search` | 428 | 6.4% |
| `verify` | 213 | 3.2% |
| `open` | 193 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 179 | 85.6% |
| `writing/japanese` | 12 | 5.7% |
| `delivery/pipeline-setup` | 5 | 2.4% |
| `research/web-search` | 5 | 2.4% |
| `engineering/secrets-in-a-check` | 4 | 1.9% |
| `docs/customer-doc` | 3 | 1.4% |
| `engineering/environment` | 1 | 0.5% |

## Last year

276 sessions.

**Ran to an end without a report:** 52 of 266 sessions whose last run the core recorded as `completed` — 19.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**998,692,330 tokens** over 360 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 5,781,615 | 28,119,706 | 73,718,100 | 998,692,330 |
| messages per session | 129 | 339 | 705 | 731 | 46,355 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 111 | 40.2% |
| `engineer` | 90 | 32.6% |
| `atomaton` | 75 | 27.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,505 | 154 | 118 | 2.1% |
| `read` | 5,407 | 28 | 8 | 0.5% |
| `grep` | 4,032 | 105 | 18 | 2.6% |
| `edit` | 2,052 | 34 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 793 | 59 | 0 | 7.4% |
| `get_issue` | 342 | 14 | 5 | 4.1% |
| `list` | 329 | 3 | 0 | 0.9% |
| `get_issue_comments` | 328 | 0 | 10 | 0% |
| `get_pr` | 322 | 9 | 3 | 2.8% |
| `get_check_runs` | 320 | 12 | 0 | 3.8% |
| `glob` | 272 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 195 | 0 | 0 | 0% |
| `get_branch` | 188 | 0 | 0 | 0% |
| `write` | 185 | 2 | 0 | 1.1% |
| `commit_and_push` | 183 | 9 | 0 | 4.9% |
| `create_pr` | 158 | 51 | 0 | 32.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `search_issues` | 133 | 0 | 3 | 0% |
| `get_pr_diff` | 127 | 3 | 0 | 2.4% |
| `request_close_issue` | 94 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 72 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 63 | 0 | 0 | 0% |
| `list_prs` | 60 | 0 | 0 | 0% |
| `list_pr_review_comments` | 54 | 0 | 0 | 0% |
| `search_code` | 47 | 0 | 0 | 0% |
| `load_skill` | 45 | 9 | 0 | 20% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `publish_draft` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `attach_file` | 1 | 1 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,945 | 79.2% |
| `edit` | 580 | 7.7% |
| `search` | 504 | 6.7% |
| `open` | 239 | 3.2% |
| `verify` | 237 | 3.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 210 | 82.4% |
| `writing/japanese` | 12 | 4.7% |
| `delivery/pipeline-setup` | 10 | 3.9% |
| `engineering/environment` | 7 | 2.7% |
| `engineering/secrets-in-a-check` | 6 | 2.4% |
| `research/web-search` | 6 | 2.4% |
| `docs/customer-doc` | 3 | 1.2% |
| `docs/design-doc` | 1 | 0.4% |

## All time

291 sessions.

**Ran to an end without a report:** 52 of 266 sessions whose last run the core recorded as `completed` — 19.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 15 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**998,692,330 tokens** over 360 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 5,781,615 | 28,119,706 | 73,718,100 | 998,692,330 |
| messages per session | 120 | 331 | 705 | 731 | 46,433 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 115 | 39.5% |
| `engineer` | 98 | 33.7% |
| `atomaton` | 78 | 26.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,505 | 154 | 118 | 2.1% |
| `read` | 5,407 | 28 | 8 | 0.5% |
| `grep` | 4,032 | 105 | 18 | 2.6% |
| `edit` | 2,052 | 34 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 793 | 59 | 0 | 7.4% |
| `get_issue` | 342 | 14 | 5 | 4.1% |
| `list` | 329 | 3 | 0 | 0.9% |
| `get_issue_comments` | 328 | 0 | 10 | 0% |
| `get_pr` | 322 | 9 | 3 | 2.8% |
| `get_check_runs` | 320 | 12 | 0 | 3.8% |
| `glob` | 272 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 195 | 0 | 0 | 0% |
| `get_branch` | 188 | 0 | 0 | 0% |
| `write` | 185 | 2 | 0 | 1.1% |
| `commit_and_push` | 183 | 9 | 0 | 4.9% |
| `create_pr` | 158 | 51 | 0 | 32.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `search_issues` | 133 | 0 | 3 | 0% |
| `get_pr_diff` | 127 | 3 | 0 | 2.4% |
| `request_close_issue` | 94 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 72 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 63 | 0 | 0 | 0% |
| `list_prs` | 60 | 0 | 0 | 0% |
| `list_pr_review_comments` | 54 | 0 | 0 | 0% |
| `search_code` | 47 | 0 | 0 | 0% |
| `load_skill` | 45 | 9 | 0 | 20% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `publish_draft` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `attach_file` | 1 | 1 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,945 | 79.2% |
| `edit` | 580 | 7.7% |
| `search` | 504 | 6.7% |
| `open` | 239 | 3.2% |
| `verify` | 237 | 3.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 210 | 82.4% |
| `writing/japanese` | 12 | 4.7% |
| `delivery/pipeline-setup` | 10 | 3.9% |
| `engineering/environment` | 7 | 2.7% |
| `engineering/secrets-in-a-check` | 6 | 2.4% |
| `research/web-search` | 6 | 2.4% |
| `docs/customer-doc` | 3 | 1.2% |
| `docs/design-doc` | 1 | 0.4% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-10-25 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/agent-prompt-surface`
- `security/atomaton-surface`
- `security/gh-actions-surface`
- `security/on-demand-audit`
