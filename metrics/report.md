# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-28.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 229 | 20.1% | 111 | 3,219 | 9 | 7.8 |
| Last 30 days | 583 | 13.9% | 230 | 6,099 | 10 | 18.3 |
| Last year | 1,021 | 10.5% | 244 | 10,246 | 13 | 18.0 |
| All time | 1,021 | 10.5% | 244 | 10,246 | 13 | 18.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 914 |
| `failed` | 96 |
| `stopped` | 11 |

## Last 7 days

92 sessions.

**Ran to an end without a report:** 28 of 90 sessions whose last run the core recorded as `completed` — 31.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**135,594,628 tokens** over 90 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**91.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 935,640 | 3,818,849 | 8,244,501 | 8,244,501 | 135,594,628 |
| messages per session | 101 | 235 | 315 | 315 | 10,910 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 35 | 38% |
| `reviewer` | 34 | 37% |
| `atomaton` | 23 | 25% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,063 | 37 | 22 | 1.8% |
| `read` | 1,234 | 7 | 0 | 0.6% |
| `grep` | 773 | 17 | 4 | 2.2% |
| `edit` | 415 | 16 | 0 | 3.9% |
| `fetch` | 108 | 3 | 0 | 2.8% |
| `load_skill` | 104 | 0 | 0 | 0% |
| `get_issue_comments` | 94 | 0 | 0 | 0% |
| `get_issue` | 81 | 0 | 0 | 0% |
| `get_pr` | 72 | 1 | 0 | 1.4% |
| `search_code` | 69 | 0 | 0 | 0% |
| `get_check_runs` | 67 | 2 | 0 | 3% |
| `list` | 67 | 1 | 0 | 1.5% |
| `commit_and_push` | 57 | 3 | 0 | 5.3% |
| `check_merge_readiness` | 53 | 0 | 0 | 0% |
| `glob` | 50 | 0 | 0 | 0% |
| `create_pr` | 49 | 10 | 0 | 20.4% |
| `write` | 46 | 1 | 0 | 2.2% |
| `request_close_issue` | 37 | 0 | 0 | 0% |
| `get_pr_reviews` | 36 | 0 | 0 | 0% |
| `get_pr_diff` | 31 | 0 | 0 | 0% |
| `search_issues` | 31 | 0 | 0 | 0% |
| `merge_pr` | 29 | 0 | 0 | 0% |
| `get_branch` | 23 | 0 | 0 | 0% |
| `list_pr_review_comments` | 21 | 0 | 0 | 0% |
| `delegate_readonly` | 16 | 0 | 0 | 0% |
| `list_prs` | 11 | 0 | 0 | 0% |
| `create_root_issue` | 8 | 0 | 0 | 0% |
| `search_remote_code` | 8 | 4 | 0 | 50% |
| `delegate_readonly_large` | 7 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 2 | 0 | 50% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `launch_sub_agent` | 2 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,529 | 74.1% |
| `edit` | 276 | 13.4% |
| `search` | 161 | 7.8% |
| `open` | 50 | 2.4% |
| `verify` | 47 | 2.3% |

| skill | loads | share |
| --- | ---: | ---: |
| `conventions` | 47 | 45.2% |
| `japanese` | 42 | 40.4% |
| `project/conventions` | 13 | 12.5% |
| `on-demand-audit` | 1 | 1% |
| `web-search` | 1 | 1% |

## Last 30 days

206 sessions.

**Ran to an end without a report:** 41 of 197 sessions whose last run the core recorded as `completed` — 20.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**605,578,805 tokens** over 248 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.2% of that prompt was served from cache**, over the 246 of 248 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,645 | 6,399,907 | 20,308,488 | 29,805,044 | 605,578,805 |
| messages per session | 129 | 299 | 408 | 439 | 31,678 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 79 | 38.3% |
| `engineer` | 78 | 37.9% |
| `atomaton` | 48 | 23.3% |
| `architect` | 1 | 0.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,110 | 132 | 79 | 2.2% |
| `read` | 3,518 | 18 | 0 | 0.5% |
| `grep` | 2,814 | 60 | 17 | 2.1% |
| `edit` | 1,083 | 27 | 0 | 2.5% |
| `fetch` | 716 | 61 | 0 | 8.5% |
| `list` | 212 | 3 | 0 | 1.4% |
| `get_pr` | 206 | 1 | 0 | 0.5% |
| `get_issue_comments` | 201 | 0 | 0 | 0% |
| `get_check_runs` | 199 | 5 | 0 | 2.5% |
| `glob` | 192 | 0 | 0 | 0% |
| `load_skill` | 190 | 7 | 0 | 3.7% |
| `get_issue` | 175 | 1 | 0 | 0.6% |
| `commit_and_push` | 143 | 5 | 0 | 3.5% |
| `check_merge_readiness` | 134 | 0 | 0 | 0% |
| `write` | 134 | 2 | 0 | 1.5% |
| `create_pr` | 118 | 33 | 0 | 28% |
| `search_code` | 97 | 0 | 0 | 0% |
| `get_branch` | 88 | 0 | 0 | 0% |
| `get_pr_reviews` | 82 | 0 | 0 | 0% |
| `get_pr_diff` | 80 | 0 | 0 | 0% |
| `request_close_issue` | 77 | 0 | 0 | 0% |
| `merge_pr` | 57 | 0 | 0 | 0% |
| `list_pr_review_comments` | 55 | 0 | 0 | 0% |
| `search_issues` | 55 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `list_prs` | 34 | 0 | 0 | 0% |
| `search_remote_code` | 30 | 14 | 0 | 46.7% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `create_root_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 15 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `sync_branch` | 9 | 6 | 0 | 66.7% |
| `delegate_readonly_large` | 7 | 0 | 0 | 0% |
| `list_issues` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `merge_base_into_branch` | 6 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `bun` | 1 | 1 | 0 | 100% |
| `reload_environment` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,988 | 81.6% |
| `edit` | 608 | 10% |
| `search` | 290 | 4.7% |
| `open` | 160 | 2.6% |
| `verify` | 64 | 1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 88 | 38.4% |
| `conventions` | 47 | 20.5% |
| `japanese` | 42 | 18.3% |
| `writing/japanese` | 33 | 14.4% |
| `research/web-search` | 7 | 3.1% |
| `delivery/pipeline-setup` | 3 | 1.3% |
| `docs/customer-doc` | 3 | 1.3% |
| `engineering/secrets-in-a-check` | 3 | 1.3% |
| `engineering/environment` | 1 | 0.4% |
| `on-demand-audit` | 1 | 0.4% |
| `web-search` | 1 | 0.4% |

## Last year

397 sessions.

**Ran to an end without a report:** 83 of 382 sessions whose last run the core recorded as `completed` — 21.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,262,928,822 tokens** over 486 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the 484 of 486 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,266,684 | 5,864,765 | 27,846,035 | 73,718,100 | 1,262,928,822 |
| messages per session | 125 | 323 | 583 | 731 | 63,030 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 160 | 40.3% |
| `engineer` | 133 | 33.5% |
| `atomaton` | 103 | 25.9% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 10,410 | 205 | 148 | 2% |
| `read` | 7,525 | 40 | 8 | 0.5% |
| `grep` | 5,629 | 129 | 25 | 2.3% |
| `edit` | 2,589 | 51 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,161 | 101 | 0 | 8.7% |
| `get_issue_comments` | 451 | 0 | 10 | 0% |
| `list` | 451 | 6 | 0 | 1.3% |
| `get_issue` | 446 | 14 | 5 | 3.1% |
| `get_pr` | 424 | 10 | 3 | 2.4% |
| `get_check_runs` | 413 | 15 | 0 | 3.6% |
| `glob` | 373 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 263 | 0 | 0 | 0% |
| `commit_and_push` | 254 | 13 | 0 | 5.1% |
| `write` | 246 | 3 | 0 | 1.2% |
| `get_branch` | 231 | 0 | 0 | 0% |
| `create_pr` | 219 | 65 | 0 | 29.7% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `load_skill` | 192 | 9 | 0 | 4.7% |
| `get_pr_diff` | 171 | 3 | 0 | 1.8% |
| `search_issues` | 163 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 140 | 1 | 0 | 0.7% |
| `search_code` | 121 | 0 | 0 | 0% |
| `get_pr_reviews` | 119 | 0 | 0 | 0% |
| `merge_pr` | 94 | 0 | 0 | 0% |
| `list_pr_review_comments` | 84 | 0 | 0 | 0% |
| `list_prs` | 78 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 53 | 20 | 0 | 37.7% |
| `delegate_readonly` | 45 | 0 | 0 | 0% |
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
| `merge_base_into_branch` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
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
| `other` | 8,190 | 78.7% |
| `edit` | 931 | 8.9% |
| `search` | 688 | 6.6% |
| `open` | 313 | 3% |
| `verify` | 288 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 60% |
| `conventions` | 47 | 11.7% |
| `japanese` | 42 | 10.4% |
| `writing/japanese` | 33 | 8.2% |
| `delivery/pipeline-setup` | 10 | 2.5% |
| `research/web-search` | 10 | 2.5% |
| `engineering/environment` | 7 | 1.7% |
| `engineering/secrets-in-a-check` | 6 | 1.5% |
| `docs/customer-doc` | 3 | 0.7% |
| `docs/design-doc` | 1 | 0.2% |
| `on-demand-audit` | 1 | 0.2% |
| `web-search` | 1 | 0.2% |

## All time

420 sessions.

**Ran to an end without a report:** 83 of 382 sessions whose last run the core recorded as `completed` — 21.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 23 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,262,928,822 tokens** over 486 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the 484 of 486 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,266,684 | 5,864,765 | 27,846,035 | 73,718,100 | 1,262,928,822 |
| messages per session | 119 | 307 | 571 | 731 | 63,169 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 166 | 39.5% |
| `engineer` | 146 | 34.8% |
| `atomaton` | 107 | 25.5% |
| `architect` | 1 | 0.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 10,410 | 205 | 148 | 2% |
| `read` | 7,525 | 40 | 8 | 0.5% |
| `grep` | 5,629 | 129 | 25 | 2.3% |
| `edit` | 2,589 | 51 | 0 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,161 | 101 | 0 | 8.7% |
| `get_issue_comments` | 451 | 0 | 10 | 0% |
| `list` | 451 | 6 | 0 | 1.3% |
| `get_issue` | 446 | 14 | 5 | 3.1% |
| `get_pr` | 424 | 10 | 3 | 2.4% |
| `get_check_runs` | 413 | 15 | 0 | 3.6% |
| `glob` | 373 | 1 | 1 | 0.3% |
| `check_merge_readiness` | 263 | 0 | 0 | 0% |
| `commit_and_push` | 254 | 13 | 0 | 5.1% |
| `write` | 246 | 3 | 0 | 1.2% |
| `get_branch` | 231 | 0 | 0 | 0% |
| `create_pr` | 219 | 65 | 0 | 29.7% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `load_skill` | 192 | 9 | 0 | 4.7% |
| `get_pr_diff` | 171 | 3 | 0 | 1.8% |
| `search_issues` | 163 | 0 | 3 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `request_close_issue` | 140 | 1 | 0 | 0.7% |
| `search_code` | 121 | 0 | 0 | 0% |
| `get_pr_reviews` | 119 | 0 | 0 | 0% |
| `merge_pr` | 94 | 0 | 0 | 0% |
| `list_pr_review_comments` | 84 | 0 | 0 | 0% |
| `list_prs` | 78 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `search_remote_code` | 53 | 20 | 0 | 37.7% |
| `delegate_readonly` | 45 | 0 | 0 | 0% |
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
| `merge_base_into_branch` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
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
| `other` | 8,190 | 78.7% |
| `edit` | 931 | 8.9% |
| `search` | 688 | 6.6% |
| `open` | 313 | 3% |
| `verify` | 288 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 241 | 60% |
| `conventions` | 47 | 11.7% |
| `japanese` | 42 | 10.4% |
| `writing/japanese` | 33 | 8.2% |
| `delivery/pipeline-setup` | 10 | 2.5% |
| `research/web-search` | 10 | 2.5% |
| `engineering/environment` | 7 | 1.7% |
| `engineering/secrets-in-a-check` | 6 | 1.5% |
| `docs/customer-doc` | 3 | 0.7% |
| `docs/design-doc` | 1 | 0.2% |
| `on-demand-audit` | 1 | 0.2% |
| `web-search` | 1 | 0.2% |

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
