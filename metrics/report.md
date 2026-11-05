# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-05.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 110 | 0.9% | 225 | 1,656 | 4 | 42.5 |
| Last 30 days | 523 | 5% | 240 | 9,859 | 13 | 17.8 |
| Last year | 548 | 4.9% | 246 | 10,246 | 14 | 18.7 |
| All time | 548 | 4.9% | 246 | 10,246 | 14 | 18.7 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 521 |
| `failed` | 17 |
| `stopped` | 10 |

## Last 7 days

35 sessions.

**Ran to an end without a report:** 3 of 34 sessions whose last run the core recorded as `completed` — 8.8%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**55,534,658 tokens** over 42 runs that reported them, **98.6% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**92.1% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 790,315 | 2,106,061 | 9,658,210 | 9,658,210 | 55,534,658 |
| messages per session | 99 | 188 | 292 | 292 | 3,838 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 13 | 37.1% |
| `engineer` | 11 | 31.4% |
| `reviewer` | 11 | 31.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 621 | 26 | 16 | 4.2% |
| `read` | 394 | 1 | 0 | 0.3% |
| `grep` | 267 | 11 | 0 | 4.1% |
| `edit` | 125 | 3 | 0 | 2.4% |
| `fetch` | 103 | 5 | 0 | 4.9% |
| `list` | 42 | 0 | 0 | 0% |
| `get_pr` | 30 | 0 | 0 | 0% |
| `get_check_runs` | 29 | 2 | 0 | 6.9% |
| `glob` | 26 | 0 | 0 | 0% |
| `check_merge_readiness` | 24 | 0 | 0 | 0% |
| `commit_and_push` | 24 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 23 | 0 | 0 | 0% |
| `create_pr` | 22 | 7 | 0 | 31.8% |
| `get_issue_comments` | 21 | 0 | 0 | 0% |
| `get_branch` | 20 | 0 | 0 | 0% |
| `get_issue` | 19 | 0 | 0 | 0% |
| `get_pr_diff` | 17 | 0 | 0 | 0% |
| `request_close_issue` | 15 | 0 | 0 | 0% |
| `write` | 15 | 1 | 0 | 6.7% |
| `create_sub_issue` | 13 | 0 | 0 | 0% |
| `merge_pr` | 12 | 0 | 0 | 0% |
| `get_pr_reviews` | 11 | 0 | 0 | 0% |
| `launch_sub_agent` | 11 | 0 | 0 | 0% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `create_root_issue` | 5 | 0 | 0 | 0% |
| `list_prs` | 5 | 0 | 0 | 0% |
| `search_code` | 5 | 0 | 0 | 0% |
| `search_issues` | 5 | 0 | 0 | 0% |
| `search_remote_code` | 5 | 1 | 0 | 20% |
| `delegate_readonly` | 3 | 0 | 0 | 0% |
| `sync_branch` | 3 | 3 | 0 | 100% |
| `list_issues` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `delegate` | 1 | 0 | 0 | 0% |
| `load_skill` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 472 | 76% |
| `edit` | 81 | 13% |
| `search` | 42 | 6.8% |
| `open` | 17 | 2.7% |
| `verify` | 9 | 1.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 18 | 75% |
| `docs/customer-doc` | 3 | 12.5% |
| `engineering/environment` | 1 | 4.2% |
| `engineering/secrets-in-a-check` | 1 | 4.2% |
| `research/web-search` | 1 | 4.2% |

## Last 30 days

210 sessions.

**Ran to an end without a report:** 40 of 203 sessions whose last run the core recorded as `completed` — 19.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**639,911,334 tokens** over 267 runs that reported them, **98.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.7% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,189,880 | 4,948,355 | 28,119,706 | 73,718,100 | 639,911,334 |
| messages per session | 110 | 293 | 705 | 731 | 31,514 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 89 | 42.4% |
| `atomaton` | 61 | 29% |
| `engineer` | 60 | 28.6% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,921 | 99 | 85 | 2% |
| `read` | 3,915 | 22 | 7 | 0.6% |
| `grep` | 2,821 | 76 | 8 | 2.7% |
| `edit` | 1,550 | 27 | 0 | 1.7% |
| `shell__shell_execute` | 555 | 4 | 8 | 0.7% |
| `fetch` | 548 | 45 | 0 | 8.2% |
| `get_issue` | 290 | 13 | 5 | 4.5% |
| `get_issue_comments` | 271 | 0 | 10 | 0% |
| `get_pr` | 248 | 9 | 3 | 3.6% |
| `get_check_runs` | 243 | 12 | 0 | 4.9% |
| `list` | 232 | 2 | 0 | 0.9% |
| `glob` | 197 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 173 | 0 | 0 | 0% |
| `get_branch` | 163 | 0 | 0 | 0% |
| `check_merge_readiness` | 153 | 0 | 0 | 0% |
| `commit_and_push` | 135 | 8 | 0 | 5.9% |
| `create_pr` | 123 | 39 | 0 | 31.7% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 108 | 3 | 0 | 2.8% |
| `write` | 98 | 2 | 0 | 2% |
| `request_close_issue` | 78 | 1 | 0 | 1.3% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `merge_pr` | 49 | 0 | 0 | 0% |
| `get_pr_reviews` | 48 | 0 | 0 | 0% |
| `list_pr_review_comments` | 36 | 0 | 0 | 0% |
| `web__fetch` | 32 | 5 | 0 | 15.6% |
| `search_code` | 29 | 0 | 0 | 0% |
| `create_root_issue` | 28 | 1 | 0 | 3.6% |
| `search_remote_code` | 28 | 7 | 0 | 25% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `delegate` | 21 | 0 | 0 | 0% |
| `create_sub_issue` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `list_issues` | 15 | 0 | 0 | 0% |
| `sync_branch` | 14 | 6 | 0 | 42.9% |
| `github__get_issue_comments` | 12 | 0 | 0 | 0% |
| `github__get_issue` | 10 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `github__get_check_runs` | 7 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `github__get_branch` | 5 | 0 | 0 | 0% |
| `github__get_pr` | 5 | 0 | 0 | 0% |
| `github__list_prs` | 5 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `github__get_pr_diff` | 4 | 0 | 0 | 0% |
| `github__get_pr_reviews` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `search__search_issues` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `github__check_merge_readiness` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__commit_and_push` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__create_pr` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `github__list_pr_review_comments` | 1 | 0 | 0 | 0% |
| `github__merge_pr` | 1 | 0 | 0 | 0% |
| `search__search_code` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 3,674 | 74.7% |
| `search` | 440 | 8.9% |
| `edit` | 404 | 8.2% |
| `verify` | 233 | 4.7% |
| `open` | 170 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 157 | 89.2% |
| `engineering/environment` | 4 | 2.3% |
| `engineering/secrets-in-a-check` | 4 | 2.3% |
| `research/web-search` | 4 | 2.3% |
| `delivery/pipeline-setup` | 3 | 1.7% |
| `docs/customer-doc` | 3 | 1.7% |
| `docs/design-doc` | 1 | 0.6% |

## Last year

226 sessions.

**Ran to an end without a report:** 45 of 219 sessions whose last run the core recorded as `completed` — 20.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**712,884,675 tokens** over 280 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 5,255,408 | 28,119,706 | 73,718,100 | 712,884,675 |
| messages per session | 111 | 306 | 705 | 731 | 35,190 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 92 | 40.7% |
| `atomaton` | 68 | 30.1% |
| `engineer` | 66 | 29.2% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,921 | 99 | 85 | 2% |
| `read` | 4,401 | 23 | 8 | 0.5% |
| `grep` | 3,082 | 80 | 8 | 2.6% |
| `edit` | 1,631 | 27 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 548 | 45 | 0 | 8.2% |
| `get_issue` | 290 | 13 | 5 | 4.5% |
| `list` | 281 | 3 | 0 | 1.1% |
| `get_issue_comments` | 271 | 0 | 10 | 0% |
| `get_pr` | 248 | 9 | 3 | 3.6% |
| `get_check_runs` | 243 | 12 | 0 | 4.9% |
| `glob` | 207 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 194 | 0 | 0 | 0% |
| `get_branch` | 163 | 0 | 0 | 0% |
| `check_merge_readiness` | 153 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 135 | 8 | 0 | 5.9% |
| `write` | 127 | 2 | 0 | 1.6% |
| `create_pr` | 123 | 39 | 0 | 31.7% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 108 | 3 | 0 | 2.8% |
| `request_close_issue` | 78 | 1 | 0 | 1.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `merge_pr` | 49 | 0 | 0 | 0% |
| `get_pr_reviews` | 48 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 36 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `search_code` | 29 | 0 | 0 | 0% |
| `create_root_issue` | 28 | 1 | 0 | 3.6% |
| `search_remote_code` | 28 | 7 | 0 | 25% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `delegate` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_sub_issue` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 15 | 0 | 0 | 0% |
| `sync_branch` | 14 | 6 | 0 | 42.9% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
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
| `other` | 3,674 | 74.7% |
| `search` | 440 | 8.9% |
| `edit` | 404 | 8.2% |
| `verify` | 233 | 4.7% |
| `open` | 170 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 171 | 86.8% |
| `delivery/pipeline-setup` | 7 | 3.6% |
| `engineering/environment` | 7 | 3.6% |
| `engineering/secrets-in-a-check` | 4 | 2% |
| `research/web-search` | 4 | 2% |
| `docs/customer-doc` | 3 | 1.5% |
| `docs/design-doc` | 1 | 0.5% |

## All time

231 sessions.

**Ran to an end without a report:** 45 of 219 sessions whose last run the core recorded as `completed` — 20.5%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 5 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**712,884,675 tokens** over 280 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,251,353 | 5,255,408 | 28,119,706 | 73,718,100 | 712,884,675 |
| messages per session | 110 | 303 | 705 | 731 | 35,212 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 92 | 39.8% |
| `atomaton` | 71 | 30.7% |
| `engineer` | 68 | 29.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 4,921 | 99 | 85 | 2% |
| `read` | 4,401 | 23 | 8 | 0.5% |
| `grep` | 3,082 | 80 | 8 | 2.6% |
| `edit` | 1,631 | 27 | 0 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 548 | 45 | 0 | 8.2% |
| `get_issue` | 290 | 13 | 5 | 4.5% |
| `list` | 281 | 3 | 0 | 1.1% |
| `get_issue_comments` | 271 | 0 | 10 | 0% |
| `get_pr` | 248 | 9 | 3 | 3.6% |
| `get_check_runs` | 243 | 12 | 0 | 4.9% |
| `glob` | 207 | 1 | 1 | 0.5% |
| `atoma_builtin__load_skill` | 194 | 0 | 0 | 0% |
| `get_branch` | 163 | 0 | 0 | 0% |
| `check_merge_readiness` | 153 | 0 | 0 | 0% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `commit_and_push` | 135 | 8 | 0 | 5.9% |
| `write` | 127 | 2 | 0 | 1.6% |
| `create_pr` | 123 | 39 | 0 | 31.7% |
| `search_issues` | 113 | 0 | 3 | 0% |
| `get_pr_diff` | 108 | 3 | 0 | 2.8% |
| `request_close_issue` | 78 | 1 | 0 | 1.3% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_prs` | 49 | 0 | 0 | 0% |
| `merge_pr` | 49 | 0 | 0 | 0% |
| `get_pr_reviews` | 48 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `list_pr_review_comments` | 36 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `search_code` | 29 | 0 | 0 | 0% |
| `create_root_issue` | 28 | 1 | 0 | 3.6% |
| `search_remote_code` | 28 | 7 | 0 | 25% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 24 | 0 | 0 | 0% |
| `launch_sub_agent` | 24 | 2 | 0 | 8.3% |
| `delegate` | 21 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `create_sub_issue` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_issues` | 15 | 0 | 0 | 0% |
| `sync_branch` | 14 | 6 | 0 | 42.9% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `publish_draft` | 4 | 0 | 0 | 0% |
| `delegate_large` | 3 | 0 | 0 | 0% |
| `load_skill` | 3 | 3 | 0 | 100% |
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
| `other` | 3,674 | 74.7% |
| `search` | 440 | 8.9% |
| `edit` | 404 | 8.2% |
| `verify` | 233 | 4.7% |
| `open` | 170 | 3.5% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 171 | 86.8% |
| `delivery/pipeline-setup` | 7 | 3.6% |
| `engineering/environment` | 7 | 3.6% |
| `engineering/secrets-in-a-check` | 4 | 2% |
| `research/web-search` | 4 | 2% |
| `docs/customer-doc` | 3 | 1.5% |
| `docs/design-doc` | 1 | 0.5% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-05 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
