# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-27.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 136 | 25.7% | 67 | 3,219 | 9 | 7.4 |
| Last 30 days | 493 | 13.8% | 244 | 6,099 | 11 | 20.0 |
| Last year | 919 | 10.1% | 249 | 10,246 | 13 | 18.8 |
| All time | 919 | 10.1% | 249 | 10,246 | 13 | 18.8 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 826 |
| `failed` | 82 |
| `stopped` | 11 |

## Last 7 days

51 sessions.

**Ran to an end without a report:** 16 of 46 sessions whose last run the core recorded as `completed` — 34.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**74,941,625 tokens** over 52 runs that reported them, **98.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**90.9% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 663,589 | 3,400,391 | 7,840,910 | 7,840,910 | 74,941,625 |
| messages per session | 96 | 193 | 293 | 293 | 5,714 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 21 | 41.2% |
| `reviewer` | 19 | 37.3% |
| `atomaton` | 11 | 21.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 958 | 19 | 8 | 2% |
| `read` | 797 | 7 | 0 | 0.9% |
| `grep` | 444 | 10 | 1 | 2.3% |
| `edit` | 208 | 11 | 0 | 5.3% |
| `fetch` | 67 | 1 | 0 | 1.5% |
| `list` | 56 | 0 | 0 | 0% |
| `load_skill` | 47 | 0 | 0 | 0% |
| `get_issue_comments` | 41 | 0 | 0 | 0% |
| `get_check_runs` | 38 | 1 | 0 | 2.6% |
| `get_pr` | 35 | 0 | 0 | 0% |
| `check_merge_readiness` | 32 | 0 | 0 | 0% |
| `create_pr` | 30 | 9 | 0 | 30% |
| `commit_and_push` | 29 | 1 | 0 | 3.4% |
| `glob` | 28 | 0 | 0 | 0% |
| `search_code` | 28 | 0 | 0 | 0% |
| `get_issue` | 27 | 0 | 0 | 0% |
| `write` | 25 | 0 | 0 | 0% |
| `get_pr_reviews` | 21 | 0 | 0 | 0% |
| `request_close_issue` | 20 | 0 | 0 | 0% |
| `search_issues` | 18 | 0 | 0 | 0% |
| `get_branch` | 16 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `merge_pr` | 14 | 0 | 0 | 0% |
| `get_pr_diff` | 12 | 0 | 0 | 0% |
| `search_remote_code` | 7 | 5 | 0 | 71.4% |
| `delegate_readonly` | 5 | 0 | 0 | 0% |
| `list_prs` | 5 | 0 | 0 | 0% |
| `create_root_issue` | 4 | 0 | 0 | 0% |
| `delegate_readonly_large` | 3 | 0 | 0 | 0% |
| `delegate` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 706 | 73.7% |
| `edit` | 177 | 18.5% |
| `search` | 41 | 4.3% |
| `verify` | 19 | 2% |
| `open` | 15 | 1.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `conventions` | 18 | 38.3% |
| `project/conventions` | 15 | 31.9% |
| `japanese` | 10 | 21.3% |
| `research/web-search` | 2 | 4.3% |
| `on-demand-audit` | 1 | 2.1% |
| `web-search` | 1 | 2.1% |

## Last 30 days

167 sessions.

**Ran to an end without a report:** 29 of 155 sessions whose last run the core recorded as `completed` — 18.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**550,454,209 tokens** over 213 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.5% of that prompt was served from cache**, over the 211 of 213 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,266,684 | 7,133,020 | 20,308,488 | 29,805,044 | 550,454,209 |
| messages per session | 137 | 330 | 425 | 439 | 26,551 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 65 | 38.9% |
| `reviewer` | 64 | 38.3% |
| `atomaton` | 37 | 22.2% |
| `architect` | 1 | 0.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 5,032 | 117 | 65 | 2.3% |
| `read` | 3,047 | 18 | 0 | 0.6% |
| `grep` | 2,488 | 57 | 14 | 2.3% |
| `edit` | 870 | 22 | 0 | 2.5% |
| `fetch` | 683 | 60 | 0 | 8.8% |
| `list` | 188 | 2 | 0 | 1.1% |
| `glob` | 173 | 0 | 0 | 0% |
| `get_pr` | 169 | 0 | 0 | 0% |
| `get_check_runs` | 165 | 4 | 0 | 2.4% |
| `get_issue_comments` | 149 | 0 | 0 | 0% |
| `load_skill` | 129 | 7 | 0 | 5.4% |
| `get_issue` | 121 | 1 | 0 | 0.8% |
| `commit_and_push` | 118 | 2 | 0 | 1.7% |
| `write` | 112 | 1 | 0 | 0.9% |
| `check_merge_readiness` | 111 | 0 | 0 | 0% |
| `create_pr` | 100 | 32 | 0 | 32% |
| `get_branch` | 78 | 0 | 0 | 0% |
| `get_pr_reviews` | 67 | 0 | 0 | 0% |
| `get_pr_diff` | 61 | 0 | 0 | 0% |
| `request_close_issue` | 60 | 0 | 0 | 0% |
| `search_code` | 56 | 0 | 0 | 0% |
| `list_pr_review_comments` | 47 | 0 | 0 | 0% |
| `merge_pr` | 43 | 0 | 0 | 0% |
| `search_issues` | 42 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 40 | 1 | 0 | 2.5% |
| `list_prs` | 28 | 0 | 0 | 0% |
| `search_remote_code` | 27 | 13 | 0 | 48.1% |
| `create_sub_issue` | 18 | 0 | 0 | 0% |
| `create_root_issue` | 14 | 0 | 0 | 0% |
| `delegate_readonly` | 13 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `sync_branch` | 6 | 4 | 0 | 66.7% |
| `list_issues` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 3 | 0 | 0 | 0% |
| `merge_base_into_branch` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,196 | 83.4% |
| `edit` | 502 | 10% |
| `search` | 173 | 3.4% |
| `open` | 125 | 2.5% |
| `verify` | 36 | 0.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 52.1% |
| `writing/japanese` | 33 | 19.5% |
| `conventions` | 18 | 10.7% |
| `japanese` | 10 | 5.9% |
| `research/web-search` | 8 | 4.7% |
| `delivery/pipeline-setup` | 3 | 1.8% |
| `docs/customer-doc` | 3 | 1.8% |
| `engineering/secrets-in-a-check` | 3 | 1.8% |
| `engineering/environment` | 1 | 0.6% |
| `on-demand-audit` | 1 | 0.6% |
| `web-search` | 1 | 0.6% |

## Last year

353 sessions.

**Ran to an end without a report:** 71 of 335 sessions whose last run the core recorded as `completed` — 21.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,186,563,722 tokens** over 444 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the 442 of 444 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,266,684 | 6,056,423 | 27,846,035 | 73,718,100 | 1,186,563,722 |
| messages per session | 126 | 328 | 583 | 731 | 57,273 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 143 | 40.5% |
| `engineer` | 118 | 33.4% |
| `atomaton` | 91 | 25.8% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,234 | 187 | 134 | 2% |
| `read` | 6,959 | 39 | 8 | 0.6% |
| `grep` | 5,229 | 122 | 22 | 2.3% |
| `edit` | 2,368 | 46 | 0 | 1.9% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,109 | 99 | 0 | 8.9% |
| `list` | 426 | 5 | 0 | 1.2% |
| `get_issue_comments` | 396 | 0 | 10 | 0% |
| `get_issue` | 391 | 14 | 5 | 3.6% |
| `get_pr` | 385 | 9 | 3 | 2.3% |
| `get_check_runs` | 377 | 14 | 0 | 3.7% |
| `glob` | 347 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 239 | 0 | 0 | 0% |
| `commit_and_push` | 225 | 10 | 0 | 4.4% |
| `write` | 224 | 2 | 0 | 0.9% |
| `get_branch` | 221 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 200 | 64 | 0 | 32% |
| `get_pr_diff` | 151 | 3 | 0 | 2% |
| `search_issues` | 150 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `load_skill` | 131 | 9 | 0 | 6.9% |
| `request_close_issue` | 123 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 103 | 0 | 0 | 0% |
| `search_code` | 80 | 0 | 0 | 0% |
| `merge_pr` | 79 | 0 | 0 | 0% |
| `list_pr_review_comments` | 76 | 0 | 0 | 0% |
| `list_prs` | 72 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 50 | 19 | 0 | 38% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 37 | 1 | 0 | 2.7% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `delegate_readonly` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 18 | 0 | 0 | 0% |
| `sync_branch` | 17 | 7 | 0 | 41.2% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `delegate_readonly_large` | 10 | 0 | 3 | 0% |
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
| `other` | 7,319 | 79.3% |
| `edit` | 809 | 8.8% |
| `search` | 568 | 6.2% |
| `open` | 278 | 3% |
| `verify` | 260 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 70.7% |
| `writing/japanese` | 33 | 9.7% |
| `conventions` | 18 | 5.3% |
| `delivery/pipeline-setup` | 10 | 2.9% |
| `japanese` | 10 | 2.9% |
| `research/web-search` | 10 | 2.9% |
| `engineering/environment` | 7 | 2.1% |
| `engineering/secrets-in-a-check` | 6 | 1.8% |
| `docs/customer-doc` | 3 | 0.9% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## All time

372 sessions.

**Ran to an end without a report:** 71 of 335 sessions whose last run the core recorded as `completed` — 21.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 19 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,186,563,722 tokens** over 444 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.9% of that prompt was served from cache**, over the 442 of 444 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,266,684 | 6,056,423 | 27,846,035 | 73,718,100 | 1,186,563,722 |
| messages per session | 120 | 327 | 583 | 731 | 57,397 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 149 | 40.1% |
| `engineer` | 128 | 34.4% |
| `atomaton` | 94 | 25.3% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 9,234 | 187 | 134 | 2% |
| `read` | 6,959 | 39 | 8 | 0.6% |
| `grep` | 5,229 | 122 | 22 | 2.3% |
| `edit` | 2,368 | 46 | 0 | 1.9% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,109 | 99 | 0 | 8.9% |
| `list` | 426 | 5 | 0 | 1.2% |
| `get_issue_comments` | 396 | 0 | 10 | 0% |
| `get_issue` | 391 | 14 | 5 | 3.6% |
| `get_pr` | 385 | 9 | 3 | 2.3% |
| `get_check_runs` | 377 | 14 | 0 | 3.7% |
| `glob` | 347 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 239 | 0 | 0 | 0% |
| `commit_and_push` | 225 | 10 | 0 | 4.4% |
| `write` | 224 | 2 | 0 | 0.9% |
| `get_branch` | 221 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `create_pr` | 200 | 64 | 0 | 32% |
| `get_pr_diff` | 151 | 3 | 0 | 2% |
| `search_issues` | 150 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `load_skill` | 131 | 9 | 0 | 6.9% |
| `request_close_issue` | 123 | 1 | 0 | 0.8% |
| `get_pr_reviews` | 103 | 0 | 0 | 0% |
| `search_code` | 80 | 0 | 0 | 0% |
| `merge_pr` | 79 | 0 | 0 | 0% |
| `list_pr_review_comments` | 76 | 0 | 0 | 0% |
| `list_prs` | 72 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 50 | 19 | 0 | 38% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `create_root_issue` | 37 | 1 | 0 | 2.7% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `delegate_readonly` | 34 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `delegate` | 30 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 18 | 0 | 0 | 0% |
| `sync_branch` | 17 | 7 | 0 | 41.2% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `delegate_readonly_large` | 10 | 0 | 3 | 0% |
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
| `other` | 7,319 | 79.3% |
| `edit` | 809 | 8.8% |
| `search` | 568 | 6.2% |
| `open` | 278 | 3% |
| `verify` | 260 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 70.7% |
| `writing/japanese` | 33 | 9.7% |
| `conventions` | 18 | 5.3% |
| `delivery/pipeline-setup` | 10 | 2.9% |
| `japanese` | 10 | 2.9% |
| `research/web-search` | 10 | 2.9% |
| `engineering/environment` | 7 | 2.1% |
| `engineering/secrets-in-a-check` | 6 | 1.8% |
| `docs/customer-doc` | 3 | 0.9% |
| `docs/design-doc` | 1 | 0.3% |
| `on-demand-audit` | 1 | 0.3% |
| `web-search` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-27 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

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
