# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-28.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 194 | 22.2% | 90 | 3,219 | 9 | 7.8 |
| Last 30 days | 541 | 14.2% | 230 | 6,099 | 10 | 19.1 |
| Last year | 979 | 10.5% | 244 | 10,246 | 13 | 18.2 |
| All time | 979 | 10.5% | 244 | 10,246 | 13 | 18.2 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 876 |
| `failed` | 92 |
| `stopped` | 11 |

## Last 7 days

77 sessions.

**Ran to an end without a report:** 24 of 75 sessions whose last run the core recorded as `completed` — 32%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**118,108,039 tokens** over 78 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 922,717 | 3,818,849 | 8,244,501 | 8,244,501 | 118,108,039 |
| messages per session | 93 | 207 | 293 | 293 | 8,918 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 29 | 37.7% |
| `reviewer` | 29 | 37.7% |
| `atomaton` | 19 | 24.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,588 | 25 | 13 | 1.6% |
| `read` | 1,116 | 7 | 0 | 0.6% |
| `grep` | 684 | 14 | 2 | 2% |
| `edit` | 313 | 15 | 0 | 4.8% |
| `fetch` | 92 | 1 | 0 | 1.1% |
| `load_skill` | 86 | 0 | 0 | 0% |
| `list` | 71 | 1 | 0 | 1.4% |
| `get_issue_comments` | 63 | 0 | 0 | 0% |
| `get_issue` | 56 | 0 | 0 | 0% |
| `get_pr` | 55 | 0 | 0 | 0% |
| `get_check_runs` | 54 | 2 | 0 | 3.7% |
| `search_code` | 54 | 0 | 0 | 0% |
| `check_merge_readiness` | 48 | 0 | 0 | 0% |
| `glob` | 45 | 0 | 0 | 0% |
| `commit_and_push` | 44 | 4 | 0 | 9.1% |
| `write` | 43 | 1 | 0 | 2.3% |
| `create_pr` | 41 | 10 | 0 | 24.4% |
| `get_pr_reviews` | 31 | 0 | 0 | 0% |
| `request_close_issue` | 29 | 0 | 0 | 0% |
| `get_pr_diff` | 26 | 0 | 0 | 0% |
| `search_issues` | 26 | 0 | 0 | 0% |
| `merge_pr` | 24 | 0 | 0 | 0% |
| `list_pr_review_comments` | 21 | 0 | 0 | 0% |
| `get_branch` | 19 | 0 | 0 | 0% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
| `list_prs` | 9 | 0 | 0 | 0% |
| `search_remote_code` | 9 | 5 | 0 | 55.6% |
| `create_root_issue` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 6 | 0 | 0 | 0% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `sync_branch` | 2 | 1 | 0 | 50% |
| `delegate` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,130 | 71.2% |
| `edit` | 260 | 16.4% |
| `search` | 119 | 7.5% |
| `open` | 40 | 2.5% |
| `verify` | 39 | 2.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `conventions` | 35 | 40.7% |
| `japanese` | 32 | 37.2% |
| `project/conventions` | 15 | 17.4% |
| `research/web-search` | 2 | 2.3% |
| `on-demand-audit` | 1 | 1.2% |
| `web-search` | 1 | 1.2% |

## Last 30 days

188 sessions.

**Ran to an end without a report:** 37 of 179 sessions whose last run the core recorded as `completed` — 20.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**572,380,119 tokens** over 232 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.2% of that prompt was served from cache**, over the 230 of 232 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,560 | 6,417,588 | 20,308,488 | 29,805,044 | 572,380,119 |
| messages per session | 131 | 307 | 425 | 439 | 29,125 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 72 | 38.3% |
| `engineer` | 71 | 37.8% |
| `atomaton` | 44 | 23.4% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,564 | 120 | 70 | 2.2% |
| `read` | 3,271 | 17 | 0 | 0.5% |
| `grep` | 2,654 | 57 | 15 | 2.1% |
| `edit` | 967 | 26 | 0 | 2.7% |
| `fetch` | 689 | 59 | 0 | 8.6% |
| `list` | 202 | 3 | 0 | 1.5% |
| `get_pr` | 187 | 0 | 0 | 0% |
| `glob` | 183 | 0 | 0 | 0% |
| `get_check_runs` | 179 | 5 | 0 | 2.8% |
| `get_issue_comments` | 168 | 0 | 0 | 0% |
| `load_skill` | 168 | 7 | 0 | 4.2% |
| `get_issue` | 149 | 1 | 0 | 0.7% |
| `write` | 130 | 2 | 0 | 1.5% |
| `commit_and_push` | 129 | 5 | 0 | 3.9% |
| `check_merge_readiness` | 126 | 0 | 0 | 0% |
| `create_pr` | 110 | 33 | 0 | 30% |
| `search_code` | 82 | 0 | 0 | 0% |
| `get_branch` | 81 | 0 | 0 | 0% |
| `get_pr_reviews` | 76 | 0 | 0 | 0% |
| `get_pr_diff` | 74 | 0 | 0 | 0% |
| `request_close_issue` | 69 | 0 | 0 | 0% |
| `list_pr_review_comments` | 54 | 0 | 0 | 0% |
| `merge_pr` | 52 | 0 | 0 | 0% |
| `search_issues` | 50 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `list_prs` | 32 | 0 | 0 | 0% |
| `search_remote_code` | 29 | 13 | 0 | 44.8% |
| `delegate_readonly` | 22 | 0 | 0 | 0% |
| `create_root_issue` | 18 | 0 | 0 | 0% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
| `delegate` | 10 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `sync_branch` | 7 | 5 | 0 | 71.4% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `delegate_readonly_large` | 6 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,541 | 81.6% |
| `edit` | 569 | 10.2% |
| `search` | 248 | 4.5% |
| `open` | 150 | 2.7% |
| `verify` | 56 | 1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 42.5% |
| `conventions` | 35 | 16.9% |
| `writing/japanese` | 33 | 15.9% |
| `japanese` | 32 | 15.5% |
| `research/web-search` | 7 | 3.4% |
| `delivery/pipeline-setup` | 3 | 1.4% |
| `docs/customer-doc` | 3 | 1.4% |
| `engineering/secrets-in-a-check` | 3 | 1.4% |
| `engineering/environment` | 1 | 0.5% |
| `on-demand-audit` | 1 | 0.5% |
| `web-search` | 1 | 0.5% |

## Last year

379 sessions.

**Ran to an end without a report:** 79 of 364 sessions whose last run the core recorded as `completed` — 21.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,229,730,136 tokens** over 470 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 468 of 470 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 6,011,188 | 27,846,035 | 73,718,100 | 1,229,730,136 |
| messages per session | 124 | 327 | 583 | 731 | 60,477 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 153 | 40.4% |
| `engineer` | 126 | 33.2% |
| `atomaton` | 99 | 26.1% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,864 | 193 | 139 | 2% |
| `read` | 7,278 | 39 | 8 | 0.5% |
| `grep` | 5,469 | 126 | 23 | 2.3% |
| `edit` | 2,473 | 50 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,134 | 99 | 0 | 8.7% |
| `list` | 441 | 6 | 0 | 1.4% |
| `get_issue` | 420 | 14 | 5 | 3.3% |
| `get_issue_comments` | 418 | 0 | 10 | 0% |
| `get_pr` | 405 | 9 | 3 | 2.2% |
| `get_check_runs` | 393 | 15 | 0 | 3.8% |
| `glob` | 364 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 255 | 0 | 0 | 0% |
| `write` | 242 | 3 | 0 | 1.2% |
| `commit_and_push` | 240 | 13 | 0 | 5.4% |
| `get_branch` | 224 | 0 | 0 | 0% |
| `create_pr` | 211 | 65 | 0 | 30.8% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `load_skill` | 170 | 9 | 0 | 5.3% |
| `get_pr_diff` | 165 | 3 | 0 | 1.8% |
| `search_issues` | 158 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 132 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 113 | 0 | 0 | 0% |
| `search_code` | 106 | 0 | 0 | 0% |
| `merge_pr` | 89 | 0 | 0 | 0% |
| `list_pr_review_comments` | 83 | 0 | 0 | 0% |
| `list_prs` | 76 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 52 | 19 | 0 | 36.5% |
| `delegate_readonly` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 41 | 1 | 0 | 2.4% |
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
| `delegate_readonly_large` | 13 | 0 | 3 | 0% |
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
| `merge_base_into_branch` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
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
| `other` | 7,743 | 78.5% |
| `edit` | 892 | 9% |
| `search` | 646 | 6.5% |
| `open` | 303 | 3.1% |
| `verify` | 280 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 63.4% |
| `conventions` | 35 | 9.2% |
| `writing/japanese` | 33 | 8.7% |
| `japanese` | 32 | 8.4% |
| `delivery/pipeline-setup` | 10 | 2.6% |
| `research/web-search` | 10 | 2.6% |
| `engineering/environment` | 7 | 1.8% |
| `engineering/secrets-in-a-check` | 6 | 1.6% |
| `docs/customer-doc` | 3 | 0.8% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## All time

400 sessions.

**Ran to an end without a report:** 79 of 364 sessions whose last run the core recorded as `completed` — 21.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 21 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,229,730,136 tokens** over 470 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.8% of that prompt was served from cache**, over the 468 of 470 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 6,011,188 | 27,846,035 | 73,718,100 | 1,229,730,136 |
| messages per session | 117 | 323 | 583 | 731 | 60,610 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 159 | 39.8% |
| `engineer` | 137 | 34.3% |
| `atomaton` | 103 | 25.8% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,864 | 193 | 139 | 2% |
| `read` | 7,278 | 39 | 8 | 0.5% |
| `grep` | 5,469 | 126 | 23 | 2.3% |
| `edit` | 2,473 | 50 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,134 | 99 | 0 | 8.7% |
| `list` | 441 | 6 | 0 | 1.4% |
| `get_issue` | 420 | 14 | 5 | 3.3% |
| `get_issue_comments` | 418 | 0 | 10 | 0% |
| `get_pr` | 405 | 9 | 3 | 2.2% |
| `get_check_runs` | 393 | 15 | 0 | 3.8% |
| `glob` | 364 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 255 | 0 | 0 | 0% |
| `write` | 242 | 3 | 0 | 1.2% |
| `commit_and_push` | 240 | 13 | 0 | 5.4% |
| `get_branch` | 224 | 0 | 0 | 0% |
| `create_pr` | 211 | 65 | 0 | 30.8% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `load_skill` | 170 | 9 | 0 | 5.3% |
| `get_pr_diff` | 165 | 3 | 0 | 1.8% |
| `search_issues` | 158 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 132 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 113 | 0 | 0 | 0% |
| `search_code` | 106 | 0 | 0 | 0% |
| `merge_pr` | 89 | 0 | 0 | 0% |
| `list_pr_review_comments` | 83 | 0 | 0 | 0% |
| `list_prs` | 76 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 52 | 19 | 0 | 36.5% |
| `delegate_readonly` | 43 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 41 | 1 | 0 | 2.4% |
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
| `delegate_readonly_large` | 13 | 0 | 3 | 0% |
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
| `merge_base_into_branch` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
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
| `other` | 7,743 | 78.5% |
| `edit` | 892 | 9% |
| `search` | 646 | 6.5% |
| `open` | 303 | 3.1% |
| `verify` | 280 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 63.4% |
| `conventions` | 35 | 9.2% |
| `writing/japanese` | 33 | 8.7% |
| `japanese` | 32 | 8.4% |
| `delivery/pipeline-setup` | 10 | 2.6% |
| `research/web-search` | 10 | 2.6% |
| `engineering/environment` | 7 | 1.8% |
| `engineering/secrets-in-a-check` | 6 | 1.6% |
| `docs/customer-doc` | 3 | 0.8% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-10-25 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

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
