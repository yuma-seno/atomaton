# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-08.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 224 | 2.7% | 248 | 6,099 | 11 | 26.1 |
| Last 30 days | 627 | 4.6% | 246 | 9,859 | 14 | 18.4 |
| Last year | 664 | 4.8% | 257 | 10,246 | 15 | 19.0 |
| All time | 664 | 4.8% | 257 | 10,246 | 15 | 19.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 632 |
| `failed` | 21 |
| `stopped` | 11 |

## Last 7 days

80 sessions.

**Ran to an end without a report:** 11 of 76 sessions whose last run the core recorded as `completed` — 14.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**308,972,596 tokens** over 105 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.8% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,375,816 | 8,779,638 | 21,812,397 | 29,805,044 | 308,972,596 |
| messages per session | 144 | 347 | 439 | 439 | 13,458 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 32 | 40% |
| `reviewer` | 28 | 35% |
| `atomaton` | 20 | 25% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 2,795 | 68 | 43 | 2.4% |
| `read` | 1,310 | 5 | 0 | 0.4% |
| `grep` | 1,107 | 34 | 10 | 3.1% |
| `edit` | 530 | 10 | 0 | 1.9% |
| `fetch` | 326 | 17 | 0 | 5.2% |
| `get_check_runs` | 90 | 2 | 0 | 2.2% |
| `get_pr` | 90 | 0 | 0 | 0% |
| `list` | 87 | 0 | 0 | 0% |
| `glob` | 83 | 0 | 0 | 0% |
| `get_issue_comments` | 71 | 0 | 0 | 0% |
| `write` | 68 | 1 | 0 | 1.5% |
| `get_issue` | 63 | 1 | 0 | 1.6% |
| `commit_and_push` | 61 | 1 | 0 | 1.6% |
| `check_merge_readiness` | 56 | 0 | 0 | 0% |
| `create_pr` | 46 | 14 | 0 | 30.4% |
| `get_branch` | 45 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 39 | 1 | 0 | 2.6% |
| `load_skill` | 33 | 7 | 0 | 21.2% |
| `get_pr_diff` | 32 | 0 | 0 | 0% |
| `get_pr_reviews` | 30 | 0 | 0 | 0% |
| `request_close_issue` | 28 | 0 | 0 | 0% |
| `merge_pr` | 23 | 0 | 0 | 0% |
| `list_pr_review_comments` | 22 | 0 | 0 | 0% |
| `search_remote_code` | 18 | 6 | 0 | 33.3% |
| `search_code` | 17 | 0 | 0 | 0% |
| `search_issues` | 17 | 0 | 0 | 0% |
| `create_sub_issue` | 16 | 0 | 0 | 0% |
| `list_prs` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 12 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `create_root_issue` | 7 | 0 | 0 | 0% |
| `delegate_readonly` | 5 | 0 | 0 | 0% |
| `delegate_large` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 4 | 0 | 100% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `publish_draft` | 3 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 2,440 | 87.3% |
| `edit` | 202 | 7.2% |
| `search` | 85 | 3% |
| `open` | 55 | 2% |
| `verify` | 13 | 0.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 54 | 75% |
| `writing/japanese` | 5 | 6.9% |
| `delivery/pipeline-setup` | 3 | 4.2% |
| `docs/customer-doc` | 3 | 4.2% |
| `engineering/secrets-in-a-check` | 3 | 4.2% |
| `research/web-search` | 3 | 4.2% |
| `engineering/environment` | 1 | 1.4% |

## Last 30 days

251 sessions.

**Ran to an end without a report:** 47 of 242 sessions whose last run the core recorded as `completed` — 19.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**847,145,582 tokens** over 325 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,242,645 | 5,707,358 | 28,119,706 | 73,718,100 | 847,145,582 |
| messages per session | 117 | 323 | 705 | 731 | 40,129 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 105 | 41.8% |
| `engineer` | 80 | 31.9% |
| `atomaton` | 66 | 26.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,095 | 141 | 112 | 2% |
| `read` | 4,666 | 24 | 6 | 0.5% |
| `grep` | 3,538 | 95 | 14 | 2.7% |
| `edit` | 1,929 | 34 | 0 | 1.8% |
| `fetch` | 771 | 57 | 0 | 7.4% |
| `get_issue` | 334 | 14 | 5 | 4.2% |
| `get_issue_comments` | 321 | 0 | 10 | 0% |
| `get_pr` | 308 | 9 | 3 | 2.9% |
| `get_check_runs` | 304 | 12 | 0 | 3.9% |
| `shell__shell_execute` | 279 | 3 | 0 | 1.1% |
| `list` | 269 | 2 | 0 | 0.7% |
| `glob` | 247 | 1 | 1 | 0.4% |
| `get_branch` | 188 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 185 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 185 | 0 | 0 | 0% |
| `commit_and_push` | 172 | 9 | 0 | 5.2% |
| `write` | 151 | 2 | 0 | 1.3% |
| `create_pr` | 147 | 46 | 0 | 31.3% |
| `search_issues` | 125 | 0 | 3 | 0% |
| `get_pr_diff` | 123 | 3 | 0 | 2.4% |
| `request_close_issue` | 91 | 1 | 0 | 1.1% |
| `get_pr_reviews` | 67 | 0 | 0 | 0% |
| `merge_pr` | 60 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 51 | 0 | 0 | 0% |
| `search_code` | 41 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `load_skill` | 35 | 9 | 0 | 25.7% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
| `delegate` | 28 | 0 | 0 | 0% |
| `delegate_readonly` | 26 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `web__fetch` | 22 | 1 | 0 | 4.5% |
| `create_sub_issue` | 20 | 0 | 0 | 0% |
| `list_issues` | 16 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `sync_branch` | 15 | 7 | 0 | 46.7% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `github__get_issue` | 5 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_issue_comments` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `github__commit_and_push` | 1 | 0 | 0 | 0% |
| `github__create_pr` | 1 | 0 | 0 | 0% |
| `github__get_branch` | 1 | 0 | 0 | 0% |
| `github__get_check_runs` | 1 | 0 | 0 | 0% |
| `github__get_pr` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `github__list_prs` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,642 | 79.5% |
| `edit` | 525 | 7.4% |
| `search` | 483 | 6.8% |
| `verify` | 237 | 3.3% |
| `open` | 208 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 190 | 86.4% |
| `delivery/pipeline-setup` | 6 | 2.7% |
| `engineering/secrets-in-a-check` | 6 | 2.7% |
| `research/web-search` | 6 | 2.7% |
| `writing/japanese` | 5 | 2.3% |
| `docs/customer-doc` | 3 | 1.4% |
| `engineering/environment` | 3 | 1.4% |
| `docs/design-doc` | 1 | 0.5% |

## Last year

271 sessions.

**Ran to an end without a report:** 53 of 261 sessions whose last run the core recorded as `completed` — 20.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**966,964,259 tokens** over 345 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 5,781,615 | 28,119,706 | 73,718,100 | 966,964,259 |
| messages per session | 121 | 330 | 705 | 731 | 44,810 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 109 | 40.2% |
| `engineer` | 87 | 32.1% |
| `atomaton` | 75 | 27.7% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,095 | 141 | 112 | 2% |
| `read` | 5,317 | 27 | 8 | 0.5% |
| `grep` | 3,922 | 103 | 18 | 2.6% |
| `edit` | 2,036 | 34 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 771 | 57 | 0 | 7.4% |
| `get_issue` | 334 | 14 | 5 | 4.2% |
| `list` | 326 | 3 | 0 | 0.9% |
| `get_issue_comments` | 321 | 0 | 10 | 0% |
| `get_pr` | 308 | 9 | 3 | 2.9% |
| `get_check_runs` | 304 | 12 | 0 | 3.9% |
| `glob` | 264 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 188 | 0 | 0 | 0% |
| `check_merge_readiness` | 185 | 0 | 0 | 0% |
| `write` | 180 | 2 | 0 | 1.1% |
| `commit_and_push` | 172 | 9 | 0 | 5.2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `create_pr` | 147 | 46 | 0 | 31.3% |
| `search_issues` | 125 | 0 | 3 | 0% |
| `get_pr_diff` | 123 | 3 | 0 | 2.4% |
| `request_close_issue` | 91 | 1 | 0 | 1.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr_reviews` | 67 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 60 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 51 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_code` | 41 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `load_skill` | 35 | 9 | 0 | 25.7% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
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
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
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
| `other` | 5,642 | 79.5% |
| `edit` | 525 | 7.4% |
| `search` | 483 | 6.8% |
| `verify` | 237 | 3.3% |
| `open` | 208 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 207 | 84.5% |
| `delivery/pipeline-setup` | 10 | 4.1% |
| `engineering/environment` | 7 | 2.9% |
| `engineering/secrets-in-a-check` | 6 | 2.4% |
| `research/web-search` | 6 | 2.4% |
| `writing/japanese` | 5 | 2% |
| `docs/customer-doc` | 3 | 1.2% |
| `docs/design-doc` | 1 | 0.4% |

## All time

286 sessions.

**Ran to an end without a report:** 53 of 261 sessions whose last run the core recorded as `completed` — 20.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 15 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**966,964,259 tokens** over 345 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,346,638 | 5,781,615 | 28,119,706 | 73,718,100 | 966,964,259 |
| messages per session | 114 | 328 | 705 | 731 | 44,888 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 113 | 39.5% |
| `engineer` | 95 | 33.2% |
| `atomaton` | 78 | 27.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,095 | 141 | 112 | 2% |
| `read` | 5,317 | 27 | 8 | 0.5% |
| `grep` | 3,922 | 103 | 18 | 2.6% |
| `edit` | 2,036 | 34 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 771 | 57 | 0 | 7.4% |
| `get_issue` | 334 | 14 | 5 | 4.2% |
| `list` | 326 | 3 | 0 | 0.9% |
| `get_issue_comments` | 321 | 0 | 10 | 0% |
| `get_pr` | 308 | 9 | 3 | 2.9% |
| `get_check_runs` | 304 | 12 | 0 | 3.9% |
| `glob` | 264 | 1 | 1 | 0.4% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `get_branch` | 188 | 0 | 0 | 0% |
| `check_merge_readiness` | 185 | 0 | 0 | 0% |
| `write` | 180 | 2 | 0 | 1.1% |
| `commit_and_push` | 172 | 9 | 0 | 5.2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `create_pr` | 147 | 46 | 0 | 31.3% |
| `search_issues` | 125 | 0 | 3 | 0% |
| `get_pr_diff` | 123 | 3 | 0 | 2.4% |
| `request_close_issue` | 91 | 1 | 0 | 1.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr_reviews` | 67 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `merge_pr` | 60 | 0 | 0 | 0% |
| `list_prs` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 51 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_code` | 41 | 0 | 0 | 0% |
| `search_remote_code` | 41 | 12 | 0 | 29.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `load_skill` | 35 | 9 | 0 | 25.7% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `create_root_issue` | 30 | 1 | 0 | 3.3% |
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
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
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
| `other` | 5,642 | 79.5% |
| `edit` | 525 | 7.4% |
| `search` | 483 | 6.8% |
| `verify` | 237 | 3.3% |
| `open` | 208 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 207 | 84.5% |
| `delivery/pipeline-setup` | 10 | 4.1% |
| `engineering/environment` | 7 | 2.9% |
| `engineering/secrets-in-a-check` | 6 | 2.4% |
| `research/web-search` | 6 | 2.4% |
| `writing/japanese` | 5 | 2% |
| `docs/customer-doc` | 3 | 1.2% |
| `docs/design-doc` | 1 | 0.4% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-08 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/agent-prompt-surface`
- `security/atomaton-surface`
- `security/gh-actions-surface`
- `security/on-demand-audit`
