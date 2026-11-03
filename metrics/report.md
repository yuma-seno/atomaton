# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-03.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 32 | 3.1% | 380 | 2,509 | 15 | 19.0 |
| Last 30 days | 436 | 6% | 258 | 9,859 | 16 | 17.0 |
| Last year | 456 | 5.7% | 270 | 10,246 | 16 | 17.6 |
| All time | 456 | 5.7% | 270 | 10,246 | 16 | 17.6 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 430 |
| `failed` | 16 |
| `stopped` | 10 |

## Last 7 days

16 sessions.

**Ran to an end without a report:** 3 of 16 sessions whose last run the core recorded as `completed` — 18.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**38,770,187 tokens** over 19 runs that reported them, **98.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,488,275 | 5,255,408 | 8,959,867 | 8,959,867 | 38,770,187 |
| messages per session | 86 | 239 | 250 | 250 | 1,734 |

| agent | sessions | share |
| --- | ---: | ---: |
| `engineer` | 6 | 37.5% |
| `atomaton` | 5 | 31.3% |
| `reviewer` | 5 | 31.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 305 | 15 | 5 | 4.9% |
| `read` | 229 | 2 | 0 | 0.9% |
| `grep` | 137 | 6 | 0 | 4.4% |
| `edit` | 43 | 0 | 0 | 0% |
| `fetch` | 33 | 1 | 0 | 3% |
| `list` | 19 | 0 | 0 | 0% |
| `glob` | 17 | 0 | 0 | 0% |
| `commit_and_push` | 10 | 0 | 0 | 0% |
| `get_issue_comments` | 10 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 9 | 0 | 0 | 0% |
| `get_pr` | 9 | 0 | 0 | 0% |
| `get_check_runs` | 7 | 0 | 0 | 0% |
| `get_issue` | 7 | 0 | 0 | 0% |
| `check_merge_readiness` | 6 | 0 | 0 | 0% |
| `write` | 6 | 0 | 0 | 0% |
| `create_pr` | 5 | 1 | 0 | 20% |
| `get_branch` | 5 | 0 | 0 | 0% |
| `get_pr_diff` | 4 | 0 | 0 | 0% |
| `get_pr_reviews` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `launch_sub_agent` | 3 | 0 | 0 | 0% |
| `merge_pr` | 3 | 0 | 0 | 0% |
| `search_code` | 3 | 0 | 0 | 0% |
| `delegate` | 2 | 0 | 0 | 0% |
| `list_pr_review_comments` | 2 | 0 | 0 | 0% |
| `request_close_issue` | 2 | 0 | 0 | 0% |
| `delegate_readonly` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `load_skill` | 1 | 1 | 0 | 100% |
| `search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 241 | 79% |
| `edit` | 37 | 12.1% |
| `search` | 11 | 3.6% |
| `open` | 10 | 3.3% |
| `verify` | 6 | 2% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 6 | 60% |
| `research/web-search` | 2 | 20% |
| `engineering/environment` | 1 | 10% |
| `engineering/secrets-in-a-check` | 1 | 10% |

## Last 30 days

192 sessions.

**Ran to an end without a report:** 41 of 186 sessions whose last run the core recorded as `completed` — 22%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**620,935,184 tokens** over 240 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,221,174 | 5,255,408 | 28,119,706 | 73,718,100 | 620,935,184 |
| messages per session | 111 | 323 | 715 | 731 | 30,491 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 83 | 43.2% |
| `atomaton` | 55 | 28.6% |
| `engineer` | 54 | 28.1% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,507 | 85 | 74 | 1.9% |
| `read` | 3,791 | 22 | 7 | 0.6% |
| `grep` | 2,692 | 69 | 8 | 2.6% |
| `edit` | 1,489 | 24 | 0 | 1.6% |
| `shell__shell_execute` | 1,094 | 13 | 15 | 1.2% |
| `fetch` | 471 | 40 | 0 | 8.5% |
| `get_issue` | 278 | 13 | 5 | 4.7% |
| `get_issue_comments` | 260 | 0 | 10 | 0% |
| `get_pr` | 227 | 9 | 3 | 4% |
| `get_check_runs` | 221 | 10 | 0 | 4.5% |
| `list` | 216 | 2 | 0 | 0.9% |
| `glob` | 184 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 168 | 0 | 0 | 0% |
| `get_branch` | 148 | 0 | 0 | 0% |
| `check_merge_readiness` | 135 | 0 | 0 | 0% |
| `commit_and_push` | 117 | 8 | 0 | 6.8% |
| `search_issues` | 110 | 0 | 3 | 0% |
| `create_pr` | 105 | 33 | 0 | 31.4% |
| `write` | 99 | 1 | 0 | 1% |
| `get_pr_diff` | 96 | 3 | 0 | 3.1% |
| `web__fetch` | 93 | 8 | 0 | 8.6% |
| `request_close_issue` | 65 | 1 | 0 | 1.5% |
| `list_prs` | 44 | 0 | 0 | 0% |
| `get_pr_reviews` | 40 | 0 | 0 | 0% |
| `github__get_issue_comments` | 40 | 0 | 0 | 0% |
| `merge_pr` | 39 | 0 | 0 | 0% |
| `github__get_issue` | 38 | 0 | 0 | 0% |
| `list_pr_review_comments` | 31 | 0 | 0 | 0% |
| `search__search_issues` | 28 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `github__get_check_runs` | 26 | 0 | 0 | 0% |
| `create_root_issue` | 23 | 1 | 0 | 4.3% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
| `delegate_readonly` | 22 | 0 | 0 | 0% |
| `delegate` | 20 | 0 | 0 | 0% |
| `github__list_prs` | 19 | 0 | 0 | 0% |
| `github__get_branch` | 17 | 0 | 0 | 0% |
| `launch_sub_agent` | 16 | 2 | 0 | 12.5% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__get_pr` | 15 | 1 | 0 | 6.7% |
| `list_issues` | 14 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__check_merge_readiness` | 10 | 0 | 0 | 0% |
| `github__create_issue` | 10 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `create_sub_issue` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `github__commit_and_push` | 7 | 1 | 0 | 14.3% |
| `github__get_pr_diff` | 6 | 0 | 0 | 0% |
| `github__list_issues` | 6 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 6 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `github__create_pr` | 4 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 3 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `delegate__run` | 2 | 0 | 0 | 0% |
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
| `other` | 3,364 | 74.6% |
| `search` | 406 | 9% |
| `edit` | 344 | 7.6% |
| `verify` | 230 | 5.1% |
| `open` | 163 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 151 | 88.3% |
| `engineering/environment` | 6 | 3.5% |
| `delivery/pipeline-setup` | 5 | 2.9% |
| `engineering/secrets-in-a-check` | 4 | 2.3% |
| `research/web-search` | 4 | 2.3% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

204 sessions.

**Ran to an end without a report:** 45 of 198 sessions whose last run the core recorded as `completed` — 22.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**674,879,700 tokens** over 250 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,307,949 | 5,530,003 | 28,119,706 | 73,718,100 | 674,879,700 |
| messages per session | 117 | 323 | 705 | 731 | 32,627 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 85 | 41.7% |
| `atomaton` | 60 | 29.4% |
| `engineer` | 59 | 28.9% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,507 | 85 | 74 | 1.9% |
| `read` | 4,158 | 23 | 8 | 0.6% |
| `grep` | 2,913 | 73 | 8 | 2.5% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,541 | 24 | 0 | 1.6% |
| `fetch` | 471 | 40 | 0 | 8.5% |
| `get_issue` | 278 | 13 | 5 | 4.7% |
| `get_issue_comments` | 260 | 0 | 10 | 0% |
| `list` | 260 | 3 | 0 | 1.2% |
| `get_pr` | 227 | 9 | 3 | 4% |
| `get_check_runs` | 221 | 10 | 0 | 4.5% |
| `glob` | 194 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 180 | 0 | 0 | 0% |
| `get_branch` | 148 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `check_merge_readiness` | 135 | 0 | 0 | 0% |
| `write` | 118 | 1 | 0 | 0.8% |
| `commit_and_push` | 117 | 8 | 0 | 6.8% |
| `search_issues` | 110 | 0 | 3 | 0% |
| `create_pr` | 105 | 33 | 0 | 31.4% |
| `get_pr_diff` | 96 | 3 | 0 | 3.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `request_close_issue` | 65 | 1 | 0 | 1.5% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_reviews` | 40 | 0 | 0 | 0% |
| `merge_pr` | 39 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `list_pr_review_comments` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `create_root_issue` | 23 | 1 | 0 | 4.3% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
| `delegate_readonly` | 22 | 0 | 0 | 0% |
| `delegate` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 16 | 2 | 0 | 12.5% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 14 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `create_sub_issue` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
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
| `other` | 3,364 | 74.6% |
| `search` | 406 | 9% |
| `edit` | 344 | 7.6% |
| `verify` | 230 | 5.1% |
| `open` | 163 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 160 | 87.4% |
| `delivery/pipeline-setup` | 7 | 3.8% |
| `engineering/environment` | 7 | 3.8% |
| `engineering/secrets-in-a-check` | 4 | 2.2% |
| `research/web-search` | 4 | 2.2% |
| `docs/design-doc` | 1 | 0.5% |

## All time

208 sessions.

**Ran to an end without a report:** 45 of 198 sessions whose last run the core recorded as `completed` — 22.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 4 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**674,879,700 tokens** over 250 runs that reported them, **97.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,307,949 | 5,530,003 | 28,119,706 | 73,718,100 | 674,879,700 |
| messages per session | 111 | 323 | 705 | 731 | 32,646 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 85 | 40.9% |
| `atomaton` | 62 | 29.8% |
| `engineer` | 61 | 29.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,507 | 85 | 74 | 1.9% |
| `read` | 4,158 | 23 | 8 | 0.6% |
| `grep` | 2,913 | 73 | 8 | 2.5% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,541 | 24 | 0 | 1.6% |
| `fetch` | 471 | 40 | 0 | 8.5% |
| `get_issue` | 278 | 13 | 5 | 4.7% |
| `get_issue_comments` | 260 | 0 | 10 | 0% |
| `list` | 260 | 3 | 0 | 1.2% |
| `get_pr` | 227 | 9 | 3 | 4% |
| `get_check_runs` | 221 | 10 | 0 | 4.5% |
| `glob` | 194 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 180 | 0 | 0 | 0% |
| `get_branch` | 148 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `check_merge_readiness` | 135 | 0 | 0 | 0% |
| `write` | 118 | 1 | 0 | 0.8% |
| `commit_and_push` | 117 | 8 | 0 | 6.8% |
| `search_issues` | 110 | 0 | 3 | 0% |
| `create_pr` | 105 | 33 | 0 | 31.4% |
| `get_pr_diff` | 96 | 3 | 0 | 3.1% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `request_close_issue` | 65 | 1 | 0 | 1.5% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 44 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_reviews` | 40 | 0 | 0 | 0% |
| `merge_pr` | 39 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `list_pr_review_comments` | 31 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `search_code` | 27 | 0 | 0 | 0% |
| `create_root_issue` | 23 | 1 | 0 | 4.3% |
| `search_remote_code` | 23 | 6 | 0 | 26.1% |
| `delegate_readonly` | 22 | 0 | 0 | 0% |
| `delegate` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `launch_sub_agent` | 16 | 2 | 0 | 12.5% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 14 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `create_sub_issue` | 7 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
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
| `other` | 3,364 | 74.6% |
| `search` | 406 | 9% |
| `edit` | 344 | 7.6% |
| `verify` | 230 | 5.1% |
| `open` | 163 | 3.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 160 | 87.4% |
| `delivery/pipeline-setup` | 7 | 3.8% |
| `engineering/environment` | 7 | 3.8% |
| `engineering/secrets-in-a-check` | 4 | 2.2% |
| `research/web-search` | 4 | 2.2% |
| `docs/design-doc` | 1 | 0.5% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-03 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
