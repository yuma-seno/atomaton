# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-07.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 178 | 2.8% | 240 | 6,099 | 9 | 26.9 |
| Last 30 days | 587 | 4.8% | 245 | 9,859 | 14 | 18.1 |
| Last year | 618 | 5% | 253 | 10,246 | 15 | 18.9 |
| All time | 618 | 5% | 253 | 10,246 | 15 | 18.9 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 587 |
| `failed` | 20 |
| `stopped` | 11 |

## Last 7 days

61 sessions.

**Ran to an end without a report:** 7 of 57 sessions whose last run the core recorded as `completed` — 12.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**233,212,515 tokens** over 76 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,505,571 | 9,658,210 | 29,805,044 | 29,805,044 | 233,212,515 |
| messages per session | 136 | 330 | 425 | 425 | 9,729 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 26 | 42.6% |
| `reviewer` | 20 | 32.8% |
| `atomaton` | 15 | 24.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,029 | 57 | 31 | 2.8% |
| `read` | 924 | 3 | 0 | 0.3% |
| `grep` | 719 | 25 | 1 | 3.5% |
| `edit` | 386 | 6 | 0 | 1.6% |
| `fetch` | 233 | 13 | 0 | 5.6% |
| `get_check_runs` | 63 | 2 | 0 | 3.2% |
| `get_issue_comments` | 55 | 0 | 0 | 0% |
| `get_pr` | 55 | 0 | 0 | 0% |
| `list` | 52 | 0 | 0 | 0% |
| `commit_and_push` | 48 | 0 | 0 | 0% |
| `get_issue` | 45 | 0 | 0 | 0% |
| `glob` | 45 | 0 | 0 | 0% |
| `write` | 44 | 1 | 0 | 2.3% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `check_merge_readiness` | 37 | 0 | 0 | 0% |
| `create_pr` | 36 | 12 | 0 | 33.3% |
| `get_branch` | 35 | 0 | 0 | 0% |
| `get_pr_diff` | 26 | 0 | 0 | 0% |
| `get_pr_reviews` | 23 | 0 | 0 | 0% |
| `request_close_issue` | 22 | 0 | 0 | 0% |
| `merge_pr` | 18 | 0 | 0 | 0% |
| `search_remote_code` | 18 | 6 | 0 | 33.3% |
| `create_sub_issue` | 16 | 0 | 0 | 0% |
| `list_pr_review_comments` | 15 | 0 | 0 | 0% |
| `load_skill` | 13 | 7 | 0 | 53.8% |
| `launch_sub_agent` | 12 | 0 | 0 | 0% |
| `list_prs` | 12 | 0 | 0 | 0% |
| `search_issues` | 10 | 0 | 0 | 0% |
| `search_code` | 9 | 0 | 0 | 0% |
| `create_root_issue` | 7 | 0 | 0 | 0% |
| `delegate` | 6 | 0 | 0 | 0% |
| `delegate_readonly` | 5 | 0 | 0 | 0% |
| `delegate_large` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 4 | 0 | 100% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,759 | 86.7% |
| `edit` | 150 | 7.4% |
| `search` | 70 | 3.4% |
| `open` | 41 | 2% |
| `verify` | 9 | 0.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 42 | 80.8% |
| `delivery/pipeline-setup` | 3 | 5.8% |
| `docs/customer-doc` | 3 | 5.8% |
| `engineering/secrets-in-a-check` | 2 | 3.8% |
| `engineering/environment` | 1 | 1.9% |
| `research/web-search` | 1 | 1.9% |

## Last 30 days

234 sessions.

**Ran to an end without a report:** 43 of 225 sessions whose last run the core recorded as `completed` — 19.1%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**815,380,063 tokens** over 301 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,645 | 5,707,358 | 28,119,706 | 73,718,100 | 815,380,063 |
| messages per session | 115 | 323 | 705 | 731 | 37,251 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 98 | 41.9% |
| `engineer` | 75 | 32.1% |
| `atomaton` | 61 | 26.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,329 | 130 | 100 | 2.1% |
| `read` | 4,417 | 22 | 6 | 0.5% |
| `grep` | 3,262 | 90 | 8 | 2.8% |
| `edit` | 1,811 | 30 | 0 | 1.7% |
| `fetch` | 678 | 53 | 0 | 7.8% |
| `shell__shell_execute` | 518 | 4 | 0 | 0.8% |
| `get_issue` | 316 | 13 | 5 | 4.1% |
| `get_issue_comments` | 305 | 0 | 10 | 0% |
| `get_check_runs` | 277 | 12 | 0 | 4.3% |
| `get_pr` | 273 | 9 | 3 | 3.3% |
| `list` | 242 | 2 | 0 | 0.8% |
| `glob` | 213 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 187 | 1 | 0 | 0.5% |
| `get_branch` | 178 | 0 | 0 | 0% |
| `check_merge_readiness` | 166 | 0 | 0 | 0% |
| `commit_and_push` | 159 | 8 | 0 | 5% |
| `create_pr` | 137 | 44 | 0 | 32.1% |
| `write` | 127 | 2 | 0 | 1.6% |
| `search_issues` | 118 | 0 | 3 | 0% |
| `get_pr_diff` | 117 | 3 | 0 | 2.6% |
| `request_close_issue` | 85 | 1 | 0 | 1.2% |
| `get_pr_reviews` | 60 | 0 | 0 | 0% |
| `list_prs` | 56 | 0 | 0 | 0% |
| `merge_pr` | 55 | 0 | 0 | 0% |
| `list_pr_review_comments` | 44 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `search_code` | 33 | 0 | 0 | 0% |
| `web__fetch` | 31 | 5 | 0 | 16.1% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `delegate` | 26 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `load_skill` | 15 | 9 | 0 | 60% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `github__get_issue_comments` | 10 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `github__get_check_runs` | 7 | 0 | 0 | 0% |
| `github__get_issue` | 7 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `github__get_pr` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_branch` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `github__list_prs` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `search__search_issues` | 4 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 3 | 0 | 0 | 0% |
| `github__commit_and_push` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__create_pr` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,961 | 78.4% |
| `edit` | 473 | 7.5% |
| `search` | 468 | 7.4% |
| `verify` | 233 | 3.7% |
| `open` | 194 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 180 | 89.1% |
| `delivery/pipeline-setup` | 6 | 3% |
| `engineering/secrets-in-a-check` | 5 | 2.5% |
| `research/web-search` | 4 | 2% |
| `docs/customer-doc` | 3 | 1.5% |
| `engineering/environment` | 3 | 1.5% |
| `docs/design-doc` | 1 | 0.5% |

## Last year

252 sessions.

**Ran to an end without a report:** 49 of 242 sessions whose last run the core recorded as `completed` — 20.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**891,204,178 tokens** over 316 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 5,781,615 | 28,119,706 | 73,718,100 | 891,204,178 |
| messages per session | 120 | 327 | 705 | 731 | 41,081 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 101 | 40.1% |
| `engineer` | 81 | 32.1% |
| `atomaton` | 70 | 27.8% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,329 | 130 | 100 | 2.1% |
| `read` | 4,931 | 25 | 8 | 0.5% |
| `grep` | 3,534 | 94 | 9 | 2.7% |
| `edit` | 1,892 | 30 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 678 | 53 | 0 | 7.8% |
| `get_issue` | 316 | 13 | 5 | 4.1% |
| `get_issue_comments` | 305 | 0 | 10 | 0% |
| `list` | 291 | 3 | 0 | 1% |
| `get_check_runs` | 277 | 12 | 0 | 4.3% |
| `get_pr` | 273 | 9 | 3 | 3.3% |
| `glob` | 226 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 178 | 0 | 0 | 0% |
| `check_merge_readiness` | 166 | 0 | 0 | 0% |
| `commit_and_push` | 159 | 8 | 0 | 5% |
| `write` | 156 | 2 | 0 | 1.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `create_pr` | 137 | 44 | 0 | 32.1% |
| `search_issues` | 118 | 0 | 3 | 0% |
| `get_pr_diff` | 117 | 3 | 0 | 2.6% |
| `request_close_issue` | 85 | 1 | 0 | 1.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 60 | 0 | 0 | 0% |
| `list_prs` | 56 | 0 | 0 | 0% |
| `merge_pr` | 55 | 0 | 0 | 0% |
| `list_pr_review_comments` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `search_code` | 33 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate` | 26 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `load_skill` | 15 | 9 | 0 | 60% |
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
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,961 | 78.4% |
| `edit` | 473 | 7.5% |
| `search` | 468 | 7.4% |
| `verify` | 233 | 3.7% |
| `open` | 194 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 195 | 86.7% |
| `delivery/pipeline-setup` | 10 | 4.4% |
| `engineering/environment` | 7 | 3.1% |
| `engineering/secrets-in-a-check` | 5 | 2.2% |
| `research/web-search` | 4 | 1.8% |
| `docs/customer-doc` | 3 | 1.3% |
| `docs/design-doc` | 1 | 0.4% |

## All time

267 sessions.

**Ran to an end without a report:** 49 of 242 sessions whose last run the core recorded as `completed` — 20.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 15 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**891,204,178 tokens** over 316 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 5,781,615 | 28,119,706 | 73,718,100 | 891,204,178 |
| messages per session | 111 | 327 | 705 | 731 | 41,159 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 105 | 39.3% |
| `engineer` | 89 | 33.3% |
| `atomaton` | 73 | 27.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 6,329 | 130 | 100 | 2.1% |
| `read` | 4,931 | 25 | 8 | 0.5% |
| `grep` | 3,534 | 94 | 9 | 2.7% |
| `edit` | 1,892 | 30 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 678 | 53 | 0 | 7.8% |
| `get_issue` | 316 | 13 | 5 | 4.1% |
| `get_issue_comments` | 305 | 0 | 10 | 0% |
| `list` | 291 | 3 | 0 | 1% |
| `get_check_runs` | 277 | 12 | 0 | 4.3% |
| `get_pr` | 273 | 9 | 3 | 3.3% |
| `glob` | 226 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 178 | 0 | 0 | 0% |
| `check_merge_readiness` | 166 | 0 | 0 | 0% |
| `commit_and_push` | 159 | 8 | 0 | 5% |
| `write` | 156 | 2 | 0 | 1.3% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `create_pr` | 137 | 44 | 0 | 32.1% |
| `search_issues` | 118 | 0 | 3 | 0% |
| `get_pr_diff` | 117 | 3 | 0 | 2.6% |
| `request_close_issue` | 85 | 1 | 0 | 1.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `get_pr_reviews` | 60 | 0 | 0 | 0% |
| `list_prs` | 56 | 0 | 0 | 0% |
| `merge_pr` | 55 | 0 | 0 | 0% |
| `list_pr_review_comments` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `search_code` | 33 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate` | 26 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `load_skill` | 15 | 9 | 0 | 60% |
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
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 4,961 | 78.4% |
| `edit` | 473 | 7.5% |
| `search` | 468 | 7.4% |
| `verify` | 233 | 3.7% |
| `open` | 194 | 3.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 195 | 86.7% |
| `delivery/pipeline-setup` | 10 | 4.4% |
| `engineering/environment` | 7 | 3.1% |
| `engineering/secrets-in-a-check` | 5 | 2.2% |
| `research/web-search` | 4 | 1.8% |
| `docs/customer-doc` | 3 | 1.3% |
| `docs/design-doc` | 1 | 0.4% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-10-25 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
