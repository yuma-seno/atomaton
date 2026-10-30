# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-30.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 194 | 4.6% | 190 | 9,689 | 15 | 10.7 |
| Last 30 days | 417 | 6.2% | 258 | 9,859 | 16 | 17.0 |
| Last year | 437 | 5.9% | 271 | 10,246 | 17 | 17.6 |
| All time | 437 | 5.9% | 271 | 10,246 | 17 | 17.6 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 411 |
| `failed` | 16 |
| `stopped` | 10 |

## Last 7 days

89 sessions.

**Ran to an end without a report:** 18 of 85 sessions whose last run the core recorded as `completed` — 21.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**178,643,870 tokens** over 102 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,111,996 | 4,615,931 | 8,676,293 | 8,959,867 | 178,643,870 |
| messages per session | 89 | 250 | 731 | 731 | 10,971 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 44 | 49.4% |
| `engineer` | 37 | 41.6% |
| `atomaton` | 8 | 9% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,977 | 30 | 24 | 1.5% |
| `read` | 1,296 | 4 | 4 | 0.3% |
| `grep` | 928 | 34 | 1 | 3.7% |
| `edit` | 529 | 13 | 0 | 2.5% |
| `fetch` | 129 | 5 | 0 | 3.9% |
| `get_check_runs` | 110 | 7 | 0 | 6.4% |
| `get_issue_comments` | 103 | 0 | 0 | 0% |
| `get_pr` | 96 | 0 | 3 | 0% |
| `get_issue` | 75 | 0 | 1 | 0% |
| `atoma_builtin__load_skill` | 68 | 0 | 0 | 0% |
| `check_merge_readiness` | 66 | 0 | 0 | 0% |
| `commit_and_push` | 55 | 3 | 0 | 5.5% |
| `glob` | 47 | 0 | 0 | 0% |
| `get_pr_diff` | 46 | 0 | 0 | 0% |
| `create_pr` | 45 | 12 | 0 | 26.7% |
| `get_branch` | 44 | 0 | 0 | 0% |
| `list` | 42 | 1 | 0 | 2.4% |
| `write` | 34 | 1 | 0 | 2.9% |
| `request_close_issue` | 29 | 1 | 0 | 3.4% |
| `merge_pr` | 26 | 0 | 0 | 0% |
| `search_issues` | 20 | 0 | 1 | 0% |
| `get_pr_reviews` | 19 | 0 | 0 | 0% |
| `create_root_issue` | 14 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `list_prs` | 12 | 0 | 0 | 0% |
| `delegate` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 0 | 0 | 0% |
| `search_code` | 6 | 0 | 0 | 0% |
| `search_remote_code` | 4 | 1 | 0 | 25% |
| `list_issues` | 3 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `create_sub_issue` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,743 | 88.2% |
| `edit` | 153 | 7.7% |
| `search` | 45 | 2.3% |
| `verify` | 19 | 1% |
| `open` | 17 | 0.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 66 | 94.3% |
| `research/web-search` | 2 | 2.9% |
| `delivery/pipeline-setup` | 1 | 1.4% |
| `engineering/secrets-in-a-check` | 1 | 1.4% |

## Last 30 days

182 sessions.

**Ran to an end without a report:** 38 of 176 sessions whose last run the core recorded as `completed` — 21.6%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**603,967,654 tokens** over 229 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,211,508 | 5,530,003 | 28,119,706 | 73,718,100 | 603,967,654 |
| messages per session | 111 | 323 | 715 | 731 | 29,435 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 80 | 44% |
| `atomaton` | 52 | 28.6% |
| `engineer` | 50 | 27.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,301 | 73 | 69 | 1.7% |
| `read` | 3,669 | 21 | 7 | 0.6% |
| `grep` | 2,630 | 67 | 8 | 2.5% |
| `edit` | 1,454 | 24 | 0 | 1.7% |
| `shell__shell_execute` | 1,094 | 13 | 15 | 1.2% |
| `fetch` | 460 | 40 | 0 | 8.7% |
| `get_issue` | 273 | 13 | 5 | 4.8% |
| `get_issue_comments` | 254 | 0 | 10 | 0% |
| `get_pr` | 220 | 9 | 3 | 4.1% |
| `get_check_runs` | 216 | 10 | 0 | 4.6% |
| `list` | 205 | 2 | 0 | 1% |
| `glob` | 174 | 1 | 1 | 0.6% |
| `atoma_builtin__load_skill` | 161 | 0 | 0 | 0% |
| `get_branch` | 143 | 0 | 0 | 0% |
| `check_merge_readiness` | 130 | 0 | 0 | 0% |
| `commit_and_push` | 111 | 8 | 0 | 7.2% |
| `search_issues` | 110 | 0 | 3 | 0% |
| `create_pr` | 101 | 32 | 0 | 31.7% |
| `get_pr_diff` | 93 | 3 | 0 | 3.2% |
| `web__fetch` | 93 | 8 | 0 | 8.6% |
| `write` | 93 | 1 | 0 | 1.1% |
| `request_close_issue` | 63 | 1 | 0 | 1.6% |
| `list_prs` | 44 | 0 | 0 | 0% |
| `github__get_issue_comments` | 40 | 0 | 0 | 0% |
| `github__get_issue` | 38 | 0 | 0 | 0% |
| `get_pr_reviews` | 37 | 0 | 0 | 0% |
| `merge_pr` | 37 | 0 | 0 | 0% |
| `list_pr_review_comments` | 29 | 0 | 0 | 0% |
| `search__search_issues` | 28 | 0 | 0 | 0% |
| `github__get_check_runs` | 26 | 0 | 0 | 0% |
| `search_code` | 26 | 0 | 0 | 0% |
| `create_root_issue` | 23 | 1 | 0 | 4.3% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `delegate` | 20 | 0 | 0 | 0% |
| `github__list_prs` | 19 | 0 | 0 | 0% |
| `github__get_branch` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__get_pr` | 15 | 1 | 0 | 6.7% |
| `launch_sub_agent` | 13 | 2 | 0 | 15.4% |
| `list_issues` | 13 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__check_merge_readiness` | 10 | 0 | 0 | 0% |
| `github__create_issue` | 10 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `github__commit_and_push` | 7 | 1 | 0 | 14.3% |
| `github__get_pr_diff` | 6 | 0 | 0 | 0% |
| `github__list_issues` | 6 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `github__create_pr` | 4 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 3 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `search__search_code` | 2 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `delegate_readonly__run` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__close_issue` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,203 | 74.5% |
| `search` | 398 | 9.3% |
| `edit` | 323 | 7.5% |
| `verify` | 224 | 5.2% |
| `open` | 153 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 145 | 89% |
| `delivery/pipeline-setup` | 5 | 3.1% |
| `engineering/environment` | 5 | 3.1% |
| `research/web-search` | 4 | 2.5% |
| `engineering/secrets-in-a-check` | 3 | 1.8% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

194 sessions.

**Ran to an end without a report:** 42 of 188 sessions whose last run the core recorded as `completed` — 22.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**657,912,170 tokens** over 239 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 5,619,407 | 28,119,706 | 73,718,100 | 657,912,170 |
| messages per session | 119 | 327 | 715 | 731 | 31,571 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 82 | 42.3% |
| `atomaton` | 57 | 29.4% |
| `engineer` | 55 | 28.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,301 | 73 | 69 | 1.7% |
| `read` | 4,036 | 22 | 8 | 0.5% |
| `grep` | 2,851 | 71 | 8 | 2.5% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,506 | 24 | 0 | 1.6% |
| `fetch` | 460 | 40 | 0 | 8.7% |
| `get_issue` | 273 | 13 | 5 | 4.8% |
| `get_issue_comments` | 254 | 0 | 10 | 0% |
| `list` | 249 | 3 | 0 | 1.2% |
| `get_pr` | 220 | 9 | 3 | 4.1% |
| `get_check_runs` | 216 | 10 | 0 | 4.6% |
| `glob` | 184 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 173 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 143 | 0 | 0 | 0% |
| `check_merge_readiness` | 130 | 0 | 0 | 0% |
| `write` | 112 | 1 | 0 | 0.9% |
| `commit_and_push` | 111 | 8 | 0 | 7.2% |
| `search_issues` | 110 | 0 | 3 | 0% |
| `create_pr` | 101 | 32 | 0 | 31.7% |
| `get_pr_diff` | 93 | 3 | 0 | 3.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 63 | 1 | 0 | 1.6% |
| `list_prs` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_reviews` | 37 | 0 | 0 | 0% |
| `merge_pr` | 37 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `list_pr_review_comments` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 26 | 0 | 0 | 0% |
| `create_root_issue` | 23 | 1 | 0 | 4.3% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `delegate` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 2 | 0 | 15.4% |
| `list_issues` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,203 | 74.5% |
| `search` | 398 | 9.3% |
| `edit` | 323 | 7.5% |
| `verify` | 224 | 5.2% |
| `open` | 153 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 154 | 88% |
| `delivery/pipeline-setup` | 7 | 4% |
| `engineering/environment` | 6 | 3.4% |
| `research/web-search` | 4 | 2.3% |
| `engineering/secrets-in-a-check` | 3 | 1.7% |
| `docs/design-doc` | 1 | 0.6% |

## All time

197 sessions.

**Ran to an end without a report:** 42 of 188 sessions whose last run the core recorded as `completed` — 22.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 3 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**657,912,170 tokens** over 239 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,286,863 | 5,619,407 | 28,119,706 | 73,718,100 | 657,912,170 |
| messages per session | 113 | 327 | 715 | 731 | 31,587 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 82 | 41.6% |
| `atomaton` | 59 | 29.9% |
| `engineer` | 56 | 28.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,301 | 73 | 69 | 1.7% |
| `read` | 4,036 | 22 | 8 | 0.5% |
| `grep` | 2,851 | 71 | 8 | 2.5% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,506 | 24 | 0 | 1.6% |
| `fetch` | 460 | 40 | 0 | 8.7% |
| `get_issue` | 273 | 13 | 5 | 4.8% |
| `get_issue_comments` | 254 | 0 | 10 | 0% |
| `list` | 249 | 3 | 0 | 1.2% |
| `get_pr` | 220 | 9 | 3 | 4.1% |
| `get_check_runs` | 216 | 10 | 0 | 4.6% |
| `glob` | 184 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 173 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_branch` | 143 | 0 | 0 | 0% |
| `check_merge_readiness` | 130 | 0 | 0 | 0% |
| `write` | 112 | 1 | 0 | 0.9% |
| `commit_and_push` | 111 | 8 | 0 | 7.2% |
| `search_issues` | 110 | 0 | 3 | 0% |
| `create_pr` | 101 | 32 | 0 | 31.7% |
| `get_pr_diff` | 93 | 3 | 0 | 3.2% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `request_close_issue` | 63 | 1 | 0 | 1.6% |
| `list_prs` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_reviews` | 37 | 0 | 0 | 0% |
| `merge_pr` | 37 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `list_pr_review_comments` | 29 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 26 | 0 | 0 | 0% |
| `create_root_issue` | 23 | 1 | 0 | 4.3% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `delegate` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `launch_sub_agent` | 13 | 2 | 0 | 15.4% |
| `list_issues` | 13 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `create_sub_issue` | 4 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,203 | 74.5% |
| `search` | 398 | 9.3% |
| `edit` | 323 | 7.5% |
| `verify` | 224 | 5.2% |
| `open` | 153 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 154 | 88% |
| `delivery/pipeline-setup` | 7 | 4% |
| `engineering/environment` | 6 | 3.4% |
| `research/web-search` | 4 | 2.3% |
| `engineering/secrets-in-a-check` | 3 | 1.7% |
| `docs/design-doc` | 1 | 0.6% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-10-29 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
