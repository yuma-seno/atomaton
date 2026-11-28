# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-28.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 217 | 20.7% | 100 | 3,219 | 9 | 7.8 |
| Last 30 days | 569 | 13.9% | 230 | 6,099 | 11 | 18.8 |
| Last year | 1,007 | 10.4% | 244 | 10,246 | 13 | 18.1 |
| All time | 1,007 | 10.4% | 244 | 10,246 | 13 | 18.1 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 902 |
| `failed` | 94 |
| `stopped` | 11 |

## Last 7 days

90 sessions.

**Ran to an end without a report:** 30 of 88 sessions whose last run the core recorded as `completed` — 34.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**131,203,727 tokens** over 87 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 904,960 | 3,818,849 | 8,244,501 | 8,244,501 | 131,203,727 |
| messages per session | 98 | 235 | 293 | 293 | 10,528 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 35 | 38.9% |
| `reviewer` | 32 | 35.6% |
| `atomaton` | 23 | 25.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,031 | 31 | 22 | 1.5% |
| `read` | 1,177 | 7 | 0 | 0.6% |
| `grep` | 715 | 15 | 3 | 2.1% |
| `edit` | 426 | 16 | 0 | 3.8% |
| `fetch` | 105 | 3 | 0 | 2.9% |
| `load_skill` | 102 | 0 | 0 | 0% |
| `get_issue_comments` | 91 | 0 | 0 | 0% |
| `get_issue` | 77 | 0 | 0 | 0% |
| `get_pr` | 69 | 0 | 0 | 0% |
| `search_code` | 68 | 0 | 0 | 0% |
| `list` | 64 | 1 | 0 | 1.6% |
| `get_check_runs` | 61 | 2 | 0 | 3.3% |
| `commit_and_push` | 54 | 4 | 0 | 7.4% |
| `check_merge_readiness` | 52 | 0 | 0 | 0% |
| `create_pr` | 47 | 10 | 0 | 21.3% |
| `write` | 47 | 1 | 0 | 2.1% |
| `glob` | 45 | 0 | 0 | 0% |
| `get_pr_reviews` | 35 | 0 | 0 | 0% |
| `request_close_issue` | 34 | 0 | 0 | 0% |
| `search_issues` | 31 | 0 | 0 | 0% |
| `get_pr_diff` | 29 | 0 | 0 | 0% |
| `merge_pr` | 28 | 0 | 0 | 0% |
| `get_branch` | 21 | 0 | 0 | 0% |
| `list_pr_review_comments` | 20 | 0 | 0 | 0% |
| `delegate_readonly` | 15 | 0 | 0 | 0% |
| `list_prs` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 0 | 0% |
| `search_remote_code` | 7 | 3 | 0 | 42.9% |
| `sync_branch` | 4 | 2 | 0 | 50% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `launch_sub_agent` | 2 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,487 | 73.2% |
| `edit` | 292 | 14.4% |
| `search` | 157 | 7.7% |
| `open` | 50 | 2.5% |
| `verify` | 45 | 2.2% |

| skill | loads | share |
| --- | ---: | ---: |
| `conventions` | 46 | 45.1% |
| `japanese` | 40 | 39.2% |
| `project/conventions` | 14 | 13.7% |
| `on-demand-audit` | 1 | 1% |
| `web-search` | 1 | 1% |

## Last 30 days

203 sessions.

**Ran to an end without a report:** 43 of 194 sessions whose last run the core recorded as `completed` — 22.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**593,346,994 tokens** over 244 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.2% of that prompt was served from cache**, over the 242 of 244 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,560 | 6,399,907 | 20,308,488 | 29,805,044 | 593,346,994 |
| messages per session | 125 | 293 | 408 | 439 | 31,098 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 77 | 37.9% |
| `reviewer` | 77 | 37.9% |
| `atomaton` | 48 | 23.6% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,007 | 126 | 79 | 2.1% |
| `read` | 3,454 | 18 | 0 | 0.5% |
| `grep` | 2,756 | 58 | 16 | 2.1% |
| `edit` | 1,080 | 27 | 0 | 2.5% |
| `fetch` | 710 | 61 | 0 | 8.6% |
| `list` | 209 | 3 | 0 | 1.4% |
| `get_pr` | 202 | 0 | 0 | 0% |
| `get_issue_comments` | 197 | 0 | 0 | 0% |
| `get_check_runs` | 190 | 5 | 0 | 2.6% |
| `glob` | 187 | 0 | 0 | 0% |
| `load_skill` | 187 | 7 | 0 | 3.7% |
| `get_issue` | 170 | 1 | 0 | 0.6% |
| `commit_and_push` | 139 | 5 | 0 | 3.6% |
| `write` | 134 | 2 | 0 | 1.5% |
| `check_merge_readiness` | 132 | 0 | 0 | 0% |
| `create_pr` | 116 | 33 | 0 | 28.4% |
| `search_code` | 96 | 0 | 0 | 0% |
| `get_branch` | 86 | 0 | 0 | 0% |
| `get_pr_reviews` | 81 | 0 | 0 | 0% |
| `get_pr_diff` | 78 | 0 | 0 | 0% |
| `request_close_issue` | 74 | 0 | 0 | 0% |
| `merge_pr` | 56 | 0 | 0 | 0% |
| `search_issues` | 55 | 0 | 0 | 0% |
| `list_pr_review_comments` | 54 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `list_prs` | 33 | 0 | 0 | 0% |
| `search_remote_code` | 29 | 13 | 0 | 44.8% |
| `delegate_readonly` | 23 | 0 | 0 | 0% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `create_root_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 15 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `sync_branch` | 9 | 6 | 0 | 66.7% |
| `delegate_readonly_large` | 7 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `merge_base_into_branch` | 5 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,898 | 81.5% |
| `edit` | 601 | 10% |
| `search` | 286 | 4.8% |
| `open` | 160 | 2.7% |
| `verify` | 62 | 1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 38.9% |
| `conventions` | 46 | 20.4% |
| `japanese` | 40 | 17.7% |
| `writing/japanese` | 33 | 14.6% |
| `research/web-search` | 7 | 3.1% |
| `delivery/pipeline-setup` | 3 | 1.3% |
| `docs/customer-doc` | 3 | 1.3% |
| `engineering/secrets-in-a-check` | 3 | 1.3% |
| `engineering/environment` | 1 | 0.4% |
| `on-demand-audit` | 1 | 0.4% |
| `web-search` | 1 | 0.4% |

## Last year

394 sessions.

**Ran to an end without a report:** 85 of 379 sessions whose last run the core recorded as `completed` — 22.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,250,697,011 tokens** over 482 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the 480 of 482 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 5,813,909 | 27,846,035 | 73,718,100 | 1,250,697,011 |
| messages per session | 124 | 323 | 583 | 731 | 62,450 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 158 | 40.1% |
| `engineer` | 132 | 33.5% |
| `atomaton` | 103 | 26.1% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 10,307 | 199 | 148 | 1.9% |
| `read` | 7,461 | 40 | 8 | 0.5% |
| `grep` | 5,571 | 127 | 24 | 2.3% |
| `edit` | 2,586 | 51 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,155 | 101 | 0 | 8.7% |
| `list` | 448 | 6 | 0 | 1.3% |
| `get_issue_comments` | 447 | 0 | 10 | 0% |
| `get_issue` | 441 | 14 | 5 | 3.2% |
| `get_pr` | 420 | 9 | 3 | 2.1% |
| `get_check_runs` | 404 | 15 | 0 | 3.7% |
| `glob` | 368 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 261 | 0 | 0 | 0% |
| `commit_and_push` | 250 | 13 | 0 | 5.2% |
| `write` | 246 | 3 | 0 | 1.2% |
| `get_branch` | 229 | 0 | 0 | 0% |
| `create_pr` | 217 | 65 | 0 | 30% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `load_skill` | 189 | 9 | 0 | 4.8% |
| `get_pr_diff` | 169 | 3 | 0 | 1.8% |
| `search_issues` | 163 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 137 | 1 | 0 | 0.7% |
| `search_code` | 120 | 0 | 0 | 0% |
| `get_pr_reviews` | 118 | 0 | 0 | 0% |
| `merge_pr` | 93 | 0 | 0 | 0% |
| `list_pr_review_comments` | 83 | 0 | 0 | 0% |
| `list_prs` | 77 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 52 | 19 | 0 | 36.5% |
| `delegate_readonly` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 42 | 1 | 0 | 2.4% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `launch_sub_agent` | 28 | 2 | 0 | 7.1% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `create_sub_issue` | 24 | 0 | 0 | 0% |
| `list_issues` | 20 | 0 | 0 | 0% |
| `sync_branch` | 20 | 9 | 0 | 45% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly_large` | 14 | 0 | 3 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `delegate_large` | 9 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `merge_base_into_branch` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
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
| `other` | 8,100 | 78.6% |
| `edit` | 924 | 9% |
| `search` | 684 | 6.6% |
| `open` | 313 | 3% |
| `verify` | 286 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 60.4% |
| `conventions` | 46 | 11.5% |
| `japanese` | 40 | 10% |
| `writing/japanese` | 33 | 8.3% |
| `delivery/pipeline-setup` | 10 | 2.5% |
| `research/web-search` | 10 | 2.5% |
| `engineering/environment` | 7 | 1.8% |
| `engineering/secrets-in-a-check` | 6 | 1.5% |
| `docs/customer-doc` | 3 | 0.8% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## All time

417 sessions.

**Ran to an end without a report:** 85 of 379 sessions whose last run the core recorded as `completed` — 22.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 23 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,250,697,011 tokens** over 482 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the 480 of 482 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 5,813,909 | 27,846,035 | 73,718,100 | 1,250,697,011 |
| messages per session | 115 | 306 | 571 | 731 | 62,589 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 164 | 39.3% |
| `engineer` | 145 | 34.8% |
| `atomaton` | 107 | 25.7% |
| `architect` | 1 | 0.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 10,307 | 199 | 148 | 1.9% |
| `read` | 7,461 | 40 | 8 | 0.5% |
| `grep` | 5,571 | 127 | 24 | 2.3% |
| `edit` | 2,586 | 51 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,155 | 101 | 0 | 8.7% |
| `list` | 448 | 6 | 0 | 1.3% |
| `get_issue_comments` | 447 | 0 | 10 | 0% |
| `get_issue` | 441 | 14 | 5 | 3.2% |
| `get_pr` | 420 | 9 | 3 | 2.1% |
| `get_check_runs` | 404 | 15 | 0 | 3.7% |
| `glob` | 368 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 261 | 0 | 0 | 0% |
| `commit_and_push` | 250 | 13 | 0 | 5.2% |
| `write` | 246 | 3 | 0 | 1.2% |
| `get_branch` | 229 | 0 | 0 | 0% |
| `create_pr` | 217 | 65 | 0 | 30% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `load_skill` | 189 | 9 | 0 | 4.8% |
| `get_pr_diff` | 169 | 3 | 0 | 1.8% |
| `search_issues` | 163 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 137 | 1 | 0 | 0.7% |
| `search_code` | 120 | 0 | 0 | 0% |
| `get_pr_reviews` | 118 | 0 | 0 | 0% |
| `merge_pr` | 93 | 0 | 0 | 0% |
| `list_pr_review_comments` | 83 | 0 | 0 | 0% |
| `list_prs` | 77 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 52 | 19 | 0 | 36.5% |
| `delegate_readonly` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 42 | 1 | 0 | 2.4% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `launch_sub_agent` | 28 | 2 | 0 | 7.1% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `create_sub_issue` | 24 | 0 | 0 | 0% |
| `list_issues` | 20 | 0 | 0 | 0% |
| `sync_branch` | 20 | 9 | 0 | 45% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `delegate_readonly_large` | 14 | 0 | 3 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `delegate_large` | 9 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `merge_base_into_branch` | 7 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
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
| `other` | 8,100 | 78.6% |
| `edit` | 924 | 9% |
| `search` | 684 | 6.6% |
| `open` | 313 | 3% |
| `verify` | 286 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 60.4% |
| `conventions` | 46 | 11.5% |
| `japanese` | 40 | 10% |
| `writing/japanese` | 33 | 8.3% |
| `delivery/pipeline-setup` | 10 | 2.5% |
| `research/web-search` | 10 | 2.5% |
| `engineering/environment` | 7 | 1.8% |
| `engineering/secrets-in-a-check` | 6 | 1.5% |
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
