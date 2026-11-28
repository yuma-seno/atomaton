# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-28.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 184 | 23.4% | 90 | 3,219 | 9 | 7.7 |
| Last 30 days | 529 | 14.2% | 237 | 6,099 | 11 | 19.4 |
| Last year | 967 | 10.4% | 246 | 10,246 | 13 | 18.3 |
| All time | 967 | 10.4% | 246 | 10,246 | 13 | 18.3 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 866 |
| `failed` | 90 |
| `stopped` | 11 |

## Last 7 days

73 sessions.

**Ran to an end without a report:** 22 of 71 sessions whose last run the core recorded as `completed` — 31%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**115,200,533 tokens** over 75 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 904,960 | 3,818,849 | 8,244,501 | 8,244,501 | 115,200,533 |
| messages per session | 93 | 206 | 293 | 293 | 8,412 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 28 | 38.4% |
| `reviewer` | 27 | 37% |
| `atomaton` | 18 | 24.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,488 | 24 | 12 | 1.6% |
| `read` | 1,086 | 7 | 0 | 0.6% |
| `grep` | 658 | 13 | 2 | 2% |
| `edit` | 302 | 15 | 0 | 5% |
| `load_skill` | 81 | 0 | 0 | 0% |
| `fetch` | 75 | 1 | 0 | 1.3% |
| `list` | 69 | 1 | 0 | 1.4% |
| `get_issue_comments` | 57 | 0 | 0 | 0% |
| `get_issue` | 50 | 0 | 0 | 0% |
| `get_check_runs` | 48 | 1 | 0 | 2.1% |
| `get_pr` | 47 | 0 | 0 | 0% |
| `glob` | 44 | 0 | 0 | 0% |
| `check_merge_readiness` | 43 | 0 | 0 | 0% |
| `search_code` | 42 | 0 | 0 | 0% |
| `commit_and_push` | 41 | 3 | 0 | 7.3% |
| `create_pr` | 39 | 10 | 0 | 25.6% |
| `write` | 38 | 0 | 0 | 0% |
| `get_pr_reviews` | 28 | 0 | 0 | 0% |
| `request_close_issue` | 27 | 0 | 0 | 0% |
| `search_issues` | 25 | 0 | 0 | 0% |
| `get_pr_diff` | 22 | 0 | 0 | 0% |
| `list_pr_review_comments` | 20 | 0 | 0 | 0% |
| `merge_pr` | 20 | 0 | 0 | 0% |
| `get_branch` | 17 | 0 | 0 | 0% |
| `delegate_readonly` | 13 | 0 | 0 | 0% |
| `list_prs` | 8 | 0 | 0 | 0% |
| `search_remote_code` | 8 | 5 | 0 | 62.5% |
| `create_root_issue` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 0 | 0% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `sync_branch` | 2 | 1 | 0 | 50% |
| `delegate` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,060 | 71.2% |
| `edit` | 253 | 17% |
| `search` | 107 | 7.2% |
| `open` | 39 | 2.6% |
| `verify` | 29 | 1.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `conventions` | 33 | 40.7% |
| `japanese` | 29 | 35.8% |
| `project/conventions` | 15 | 18.5% |
| `research/web-search` | 2 | 2.5% |
| `on-demand-audit` | 1 | 1.2% |
| `web-search` | 1 | 1.2% |

## Last 30 days

184 sessions.

**Ran to an end without a report:** 35 of 175 sessions whose last run the core recorded as `completed` — 20%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**569,472,613 tokens** over 229 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.3% of that prompt was served from cache**, over the 227 of 229 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,560 | 6,808,572 | 20,308,488 | 29,805,044 | 569,472,613 |
| messages per session | 131 | 307 | 425 | 439 | 28,619 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 70 | 38% |
| `reviewer` | 70 | 38% |
| `atomaton` | 43 | 23.4% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,464 | 119 | 69 | 2.2% |
| `read` | 3,241 | 17 | 0 | 0.5% |
| `grep` | 2,628 | 56 | 15 | 2.1% |
| `edit` | 956 | 26 | 0 | 2.7% |
| `fetch` | 672 | 59 | 0 | 8.8% |
| `list` | 200 | 3 | 0 | 1.5% |
| `glob` | 182 | 0 | 0 | 0% |
| `get_pr` | 179 | 0 | 0 | 0% |
| `get_check_runs` | 173 | 4 | 0 | 2.3% |
| `load_skill` | 163 | 7 | 0 | 4.3% |
| `get_issue_comments` | 162 | 0 | 0 | 0% |
| `get_issue` | 143 | 1 | 0 | 0.7% |
| `commit_and_push` | 126 | 4 | 0 | 3.2% |
| `write` | 125 | 1 | 0 | 0.8% |
| `check_merge_readiness` | 121 | 0 | 0 | 0% |
| `create_pr` | 108 | 33 | 0 | 30.6% |
| `get_branch` | 79 | 0 | 0 | 0% |
| `get_pr_reviews` | 73 | 0 | 0 | 0% |
| `get_pr_diff` | 70 | 0 | 0 | 0% |
| `search_code` | 70 | 0 | 0 | 0% |
| `request_close_issue` | 67 | 0 | 0 | 0% |
| `list_pr_review_comments` | 53 | 0 | 0 | 0% |
| `search_issues` | 49 | 0 | 0 | 0% |
| `merge_pr` | 48 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `list_prs` | 31 | 0 | 0 | 0% |
| `search_remote_code` | 28 | 13 | 0 | 46.4% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 17 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
| `delegate` | 10 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `sync_branch` | 7 | 5 | 0 | 71.4% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 0 | 0% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,471 | 81.8% |
| `edit` | 562 | 10.3% |
| `search` | 236 | 4.3% |
| `open` | 149 | 2.7% |
| `verify` | 46 | 0.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 43.6% |
| `conventions` | 33 | 16.3% |
| `writing/japanese` | 33 | 16.3% |
| `japanese` | 29 | 14.4% |
| `research/web-search` | 7 | 3.5% |
| `delivery/pipeline-setup` | 3 | 1.5% |
| `docs/customer-doc` | 3 | 1.5% |
| `engineering/secrets-in-a-check` | 3 | 1.5% |
| `engineering/environment` | 1 | 0.5% |
| `on-demand-audit` | 1 | 0.5% |
| `web-search` | 1 | 0.5% |

## Last year

375 sessions.

**Ran to an end without a report:** 77 of 360 sessions whose last run the core recorded as `completed` — 21.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,226,822,630 tokens** over 467 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 465 of 467 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 6,011,188 | 27,846,035 | 73,718,100 | 1,226,822,630 |
| messages per session | 124 | 327 | 583 | 731 | 59,971 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 151 | 40.3% |
| `engineer` | 125 | 33.3% |
| `atomaton` | 98 | 26.1% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,764 | 192 | 138 | 2% |
| `read` | 7,248 | 39 | 8 | 0.5% |
| `grep` | 5,443 | 125 | 23 | 2.3% |
| `edit` | 2,462 | 50 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,117 | 99 | 0 | 8.9% |
| `list` | 439 | 6 | 0 | 1.4% |
| `get_issue` | 414 | 14 | 5 | 3.4% |
| `get_issue_comments` | 412 | 0 | 10 | 0% |
| `get_pr` | 397 | 9 | 3 | 2.3% |
| `get_check_runs` | 387 | 14 | 0 | 3.6% |
| `glob` | 363 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 250 | 0 | 0 | 0% |
| `commit_and_push` | 237 | 12 | 0 | 5.1% |
| `write` | 237 | 2 | 0 | 0.8% |
| `get_branch` | 222 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 209 | 65 | 0 | 31.1% |
| `load_skill` | 165 | 9 | 0 | 5.5% |
| `get_pr_diff` | 161 | 3 | 0 | 1.9% |
| `search_issues` | 157 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 130 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 110 | 0 | 0 | 0% |
| `search_code` | 94 | 0 | 0 | 0% |
| `merge_pr` | 85 | 0 | 0 | 0% |
| `list_pr_review_comments` | 82 | 0 | 0 | 0% |
| `list_prs` | 75 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 51 | 19 | 0 | 37.3% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `delegate_readonly` | 42 | 0 | 0 | 0% |
| `create_root_issue` | 40 | 1 | 0 | 2.5% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `list_issues` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `sync_branch` | 18 | 8 | 0 | 44.4% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly_large` | 12 | 0 | 3 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `delegate_large` | 9 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `merge_base_into_branch` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
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
| `other` | 7,673 | 78.6% |
| `edit` | 885 | 9.1% |
| `search` | 634 | 6.5% |
| `open` | 302 | 3.1% |
| `verify` | 270 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 64.3% |
| `conventions` | 33 | 8.8% |
| `writing/japanese` | 33 | 8.8% |
| `japanese` | 29 | 7.7% |
| `delivery/pipeline-setup` | 10 | 2.7% |
| `research/web-search` | 10 | 2.7% |
| `engineering/environment` | 7 | 1.9% |
| `engineering/secrets-in-a-check` | 6 | 1.6% |
| `docs/customer-doc` | 3 | 0.8% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## All time

396 sessions.

**Ran to an end without a report:** 77 of 360 sessions whose last run the core recorded as `completed` — 21.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 21 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,226,822,630 tokens** over 467 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 465 of 467 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 6,011,188 | 27,846,035 | 73,718,100 | 1,226,822,630 |
| messages per session | 117 | 323 | 583 | 731 | 60,104 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 157 | 39.6% |
| `engineer` | 136 | 34.3% |
| `atomaton` | 102 | 25.8% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,764 | 192 | 138 | 2% |
| `read` | 7,248 | 39 | 8 | 0.5% |
| `grep` | 5,443 | 125 | 23 | 2.3% |
| `edit` | 2,462 | 50 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,117 | 99 | 0 | 8.9% |
| `list` | 439 | 6 | 0 | 1.4% |
| `get_issue` | 414 | 14 | 5 | 3.4% |
| `get_issue_comments` | 412 | 0 | 10 | 0% |
| `get_pr` | 397 | 9 | 3 | 2.3% |
| `get_check_runs` | 387 | 14 | 0 | 3.6% |
| `glob` | 363 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 250 | 0 | 0 | 0% |
| `commit_and_push` | 237 | 12 | 0 | 5.1% |
| `write` | 237 | 2 | 0 | 0.8% |
| `get_branch` | 222 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 209 | 65 | 0 | 31.1% |
| `load_skill` | 165 | 9 | 0 | 5.5% |
| `get_pr_diff` | 161 | 3 | 0 | 1.9% |
| `search_issues` | 157 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 130 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 110 | 0 | 0 | 0% |
| `search_code` | 94 | 0 | 0 | 0% |
| `merge_pr` | 85 | 0 | 0 | 0% |
| `list_pr_review_comments` | 82 | 0 | 0 | 0% |
| `list_prs` | 75 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 51 | 19 | 0 | 37.3% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `delegate_readonly` | 42 | 0 | 0 | 0% |
| `create_root_issue` | 40 | 1 | 0 | 2.5% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `list_issues` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `sync_branch` | 18 | 8 | 0 | 44.4% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly_large` | 12 | 0 | 3 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `delegate_large` | 9 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `merge_base_into_branch` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
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
| `other` | 7,673 | 78.6% |
| `edit` | 885 | 9.1% |
| `search` | 634 | 6.5% |
| `open` | 302 | 3.1% |
| `verify` | 270 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 64.3% |
| `conventions` | 33 | 8.8% |
| `writing/japanese` | 33 | 8.8% |
| `japanese` | 29 | 7.7% |
| `delivery/pipeline-setup` | 10 | 2.7% |
| `research/web-search` | 10 | 2.7% |
| `engineering/environment` | 7 | 1.9% |
| `engineering/secrets-in-a-check` | 6 | 1.6% |
| `docs/customer-doc` | 3 | 0.8% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-28 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `agent-prompt-surface`
- `atomaton-surface`
- `customer-doc`
- `environment`
- `gh-actions-surface`
- `pipeline-setup`
- `secrets-in-a-check`
