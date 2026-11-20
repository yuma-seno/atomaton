# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-20.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 98 | 12.2% | 440 | 5,064 | 17 | 29.2 |
| Last 30 days | 629 | 7.2% | 249 | 9,689 | 13 | 18.9 |
| Last year | 782 | 7.4% | 296 | 10,246 | 15 | 21.1 |
| All time | 782 | 7.4% | 296 | 10,246 | 15 | 21.1 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 724 |
| `failed` | 47 |
| `stopped` | 11 |

## Last 7 days

32 sessions.

**Ran to an end without a report:** 3 of 29 sessions whose last run the core recorded as `completed` — 10.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**144,278,995 tokens** over 44 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.8% of that prompt was served from cache**, over the 42 of 44 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,224,669 | 8,506,017 | 13,863,651 | 13,863,651 | 144,278,995 |
| messages per session | 189 | 347 | 394 | 394 | 6,654 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 15 | 46.9% |
| `engineer` | 10 | 31.3% |
| `atomaton` | 6 | 18.8% |
| `architect` | 1 | 3.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,132 | 23 | 13 | 2% |
| `grep` | 863 | 9 | 3 | 1% |
| `read` | 850 | 4 | 0 | 0.5% |
| `fetch` | 282 | 42 | 0 | 14.9% |
| `edit` | 121 | 1 | 0 | 0.8% |
| `glob` | 58 | 0 | 0 | 0% |
| `load_skill` | 51 | 0 | 0 | 0% |
| `list` | 46 | 2 | 0 | 4.3% |
| `get_pr` | 41 | 0 | 0 | 0% |
| `get_check_runs` | 32 | 1 | 0 | 3.1% |
| `get_issue_comments` | 32 | 0 | 0 | 0% |
| `get_issue` | 28 | 0 | 0 | 0% |
| `commit_and_push` | 23 | 0 | 0 | 0% |
| `create_pr` | 22 | 9 | 0 | 40.9% |
| `check_merge_readiness` | 21 | 0 | 0 | 0% |
| `write` | 20 | 0 | 0 | 0% |
| `get_branch` | 17 | 0 | 0 | 0% |
| `get_pr_diff` | 15 | 0 | 0 | 0% |
| `get_pr_reviews` | 14 | 0 | 0 | 0% |
| `search_code` | 12 | 0 | 0 | 0% |
| `request_close_issue` | 11 | 0 | 0 | 0% |
| `list_pr_review_comments` | 10 | 0 | 0 | 0% |
| `list_prs` | 8 | 0 | 0 | 0% |
| `search_issues` | 7 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `merge_pr` | 4 | 0 | 0 | 0% |
| `create_root_issue` | 3 | 0 | 0 | 0% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
| `search_remote_code` | 2 | 2 | 0 | 100% |
| `delegate` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 931 | 82.2% |
| `edit` | 98 | 8.7% |
| `open` | 55 | 4.9% |
| `search` | 44 | 3.9% |
| `verify` | 4 | 0.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `writing/japanese` | 27 | 52.9% |
| `project/conventions` | 20 | 39.2% |
| `research/web-search` | 3 | 5.9% |
| `engineering/secrets-in-a-check` | 1 | 2% |

## Last 30 days

231 sessions.

**Ran to an end without a report:** 36 of 220 sessions whose last run the core recorded as `completed` — 16.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**736,163,781 tokens** over 309 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.6% of that prompt was served from cache**, over the 307 of 309 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,279,073 | 5,864,765 | 17,629,142 | 29,805,044 | 736,163,781 |
| messages per session | 123 | 323 | 439 | 731 | 36,332 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 101 | 43.7% |
| `engineer` | 81 | 35.1% |
| `atomaton` | 48 | 20.8% |
| `architect` | 1 | 0.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,543 | 128 | 86 | 2% |
| `read` | 4,208 | 16 | 4 | 0.4% |
| `grep` | 3,445 | 86 | 14 | 2.5% |
| `edit` | 1,718 | 30 | 0 | 1.7% |
| `fetch` | 739 | 63 | 0 | 8.5% |
| `get_pr` | 276 | 2 | 3 | 0.7% |
| `get_check_runs` | 270 | 10 | 0 | 3.7% |
| `get_issue_comments` | 231 | 0 | 0 | 0% |
| `glob` | 231 | 0 | 0 | 0% |
| `get_issue` | 207 | 1 | 3 | 0.5% |
| `list` | 205 | 4 | 0 | 2% |
| `check_merge_readiness` | 179 | 0 | 0 | 0% |
| `commit_and_push` | 172 | 5 | 0 | 2.9% |
| `write` | 143 | 2 | 0 | 1.4% |
| `get_branch` | 139 | 0 | 0 | 0% |
| `create_pr` | 138 | 39 | 0 | 28.3% |
| `atoma_builtin__load_skill` | 134 | 1 | 0 | 0.7% |
| `get_pr_diff` | 113 | 1 | 0 | 0.9% |
| `request_close_issue` | 85 | 1 | 0 | 1.2% |
| `load_skill` | 84 | 9 | 0 | 10.7% |
| `get_pr_reviews` | 67 | 0 | 0 | 0% |
| `merge_pr` | 55 | 0 | 0 | 0% |
| `list_pr_review_comments` | 50 | 0 | 0 | 0% |
| `list_prs` | 48 | 0 | 0 | 0% |
| `search_issues` | 46 | 0 | 1 | 0% |
| `search_code` | 37 | 0 | 0 | 0% |
| `search_remote_code` | 29 | 9 | 0 | 31% |
| `create_root_issue` | 27 | 1 | 0 | 3.7% |
| `delegate` | 21 | 0 | 0 | 0% |
| `create_sub_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 19 | 0 | 0 | 0% |
| `delegate_readonly` | 12 | 0 | 0 | 0% |
| `list_issues` | 9 | 0 | 0 | 0% |
| `sync_branch` | 9 | 5 | 0 | 55.6% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `delegate_readonly_large` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,422 | 82.9% |
| `edit` | 486 | 7.4% |
| `search` | 301 | 4.6% |
| `open` | 183 | 2.8% |
| `verify` | 151 | 2.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 167 | 76.6% |
| `writing/japanese` | 33 | 15.1% |
| `research/web-search` | 6 | 2.8% |
| `delivery/pipeline-setup` | 4 | 1.8% |
| `engineering/secrets-in-a-check` | 4 | 1.8% |
| `docs/customer-doc` | 3 | 1.4% |
| `engineering/environment` | 1 | 0.5% |

## Last year

302 sessions.

**Ran to an end without a report:** 55 of 289 sessions whose last run the core recorded as `completed` — 19%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,111,545,367 tokens** over 391 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 389 of 391 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,309,906 | 6,183,128 | 28,119,706 | 73,718,100 | 1,111,545,367 |
| messages per session | 141 | 341 | 583 | 731 | 51,556 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 124 | 41.1% |
| `engineer` | 97 | 32.1% |
| `atomaton` | 80 | 26.5% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,276 | 168 | 126 | 2% |
| `read` | 6,162 | 32 | 8 | 0.5% |
| `grep` | 4,785 | 112 | 21 | 2.3% |
| `edit` | 2,160 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,042 | 98 | 0 | 9.4% |
| `list` | 370 | 5 | 0 | 1.4% |
| `get_issue` | 364 | 14 | 5 | 3.8% |
| `get_issue_comments` | 355 | 0 | 10 | 0% |
| `get_pr` | 350 | 9 | 3 | 2.6% |
| `get_check_runs` | 339 | 13 | 0 | 3.8% |
| `glob` | 319 | 1 | 1 | 0.3% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 207 | 0 | 0 | 0% |
| `get_branch` | 205 | 0 | 0 | 0% |
| `write` | 199 | 2 | 0 | 1% |
| `commit_and_push` | 196 | 9 | 0 | 4.6% |
| `create_pr` | 170 | 55 | 0 | 32.4% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 139 | 3 | 0 | 2.2% |
| `search_issues` | 132 | 0 | 3 | 0% |
| `request_close_issue` | 103 | 1 | 0 | 1% |
| `load_skill` | 84 | 9 | 0 | 10.7% |
| `get_pr_reviews` | 82 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 67 | 0 | 0 | 0% |
| `merge_pr` | 65 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_pr_review_comments` | 62 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 43 | 14 | 0 | 32.6% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
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
| `other` | 6,613 | 79.9% |
| `edit` | 632 | 7.6% |
| `search` | 527 | 6.4% |
| `open` | 263 | 3.2% |
| `verify` | 241 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 226 | 76.9% |
| `writing/japanese` | 33 | 11.2% |
| `delivery/pipeline-setup` | 10 | 3.4% |
| `research/web-search` | 8 | 2.7% |
| `engineering/environment` | 7 | 2.4% |
| `engineering/secrets-in-a-check` | 6 | 2% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## All time

321 sessions.

**Ran to an end without a report:** 55 of 289 sessions whose last run the core recorded as `completed` — 19%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,111,545,367 tokens** over 391 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the 389 of 391 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,309,906 | 6,183,128 | 28,119,706 | 73,718,100 | 1,111,545,367 |
| messages per session | 125 | 334 | 583 | 731 | 51,680 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 130 | 40.5% |
| `engineer` | 107 | 33.3% |
| `atomaton` | 83 | 25.9% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,276 | 168 | 126 | 2% |
| `read` | 6,162 | 32 | 8 | 0.5% |
| `grep` | 4,785 | 112 | 21 | 2.3% |
| `edit` | 2,160 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,042 | 98 | 0 | 9.4% |
| `list` | 370 | 5 | 0 | 1.4% |
| `get_issue` | 364 | 14 | 5 | 3.8% |
| `get_issue_comments` | 355 | 0 | 10 | 0% |
| `get_pr` | 350 | 9 | 3 | 2.6% |
| `get_check_runs` | 339 | 13 | 0 | 3.8% |
| `glob` | 319 | 1 | 1 | 0.3% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 207 | 0 | 0 | 0% |
| `get_branch` | 205 | 0 | 0 | 0% |
| `write` | 199 | 2 | 0 | 1% |
| `commit_and_push` | 196 | 9 | 0 | 4.6% |
| `create_pr` | 170 | 55 | 0 | 32.4% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 139 | 3 | 0 | 2.2% |
| `search_issues` | 132 | 0 | 3 | 0% |
| `request_close_issue` | 103 | 1 | 0 | 1% |
| `load_skill` | 84 | 9 | 0 | 10.7% |
| `get_pr_reviews` | 82 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 67 | 0 | 0 | 0% |
| `merge_pr` | 65 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_pr_review_comments` | 62 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 43 | 14 | 0 | 32.6% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
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
| `other` | 6,613 | 79.9% |
| `edit` | 632 | 7.6% |
| `search` | 527 | 6.4% |
| `open` | 263 | 3.2% |
| `verify` | 241 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 226 | 76.9% |
| `writing/japanese` | 33 | 11.2% |
| `delivery/pipeline-setup` | 10 | 3.4% |
| `research/web-search` | 8 | 2.7% |
| `engineering/environment` | 7 | 2.4% |
| `engineering/secrets-in-a-check` | 6 | 2% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-16 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/agent-prompt-surface`
- `security/atomaton-surface`
- `security/gh-actions-surface`
- `security/on-demand-audit`
