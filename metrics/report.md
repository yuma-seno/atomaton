# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-25.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 180 | 3.3% | 214 | 9,689 | 15 | 16.8 |
| Last 30 days | 293 | 6.1% | 355 | 10,246 | 17 | 23.9 |
| Last year | 293 | 6.1% | 355 | 10,246 | 17 | 23.9 |
| All time | 293 | 6.1% | 355 | 10,246 | 17 | 23.9 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 275 |
| `failed` | 14 |
| `stopped` | 4 |

## Last 7 days

84 sessions.

**Ran to an end without a report:** 11 of 83 sessions whose last run the core recorded as `completed` — 13.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**210,070,050 tokens** over 122 runs that reported them, **98.8% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,143,930 | 4,615,931 | 8,400,110 | 8,676,293 | 210,070,050 |
| messages per session | 102 | 290 | 731 | 731 | 12,150 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 41 | 48.8% |
| `atomaton` | 30 | 35.7% |
| `engineer` | 13 | 15.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,799 | 11 | 0 | 0.6% |
| `bash` | 1,382 | 11 | 16 | 0.8% |
| `grep` | 1,317 | 39 | 0 | 3% |
| `edit` | 730 | 13 | 0 | 1.8% |
| `fetch` | 143 | 10 | 0 | 7% |
| `glob` | 111 | 0 | 0 | 0% |
| `get_pr` | 107 | 4 | 0 | 3.7% |
| `get_issue` | 101 | 0 | 4 | 0% |
| `get_check_runs` | 99 | 4 | 0 | 4% |
| `get_issue_comments` | 97 | 0 | 2 | 0% |
| `list` | 91 | 2 | 0 | 2.2% |
| `atoma_builtin__load_skill` | 71 | 0 | 0 | 0% |
| `check_merge_readiness` | 70 | 0 | 0 | 0% |
| `get_branch` | 60 | 0 | 0 | 0% |
| `commit_and_push` | 51 | 3 | 0 | 5.9% |
| `get_pr_diff` | 50 | 2 | 0 | 4% |
| `create_pr` | 43 | 13 | 0 | 30.2% |
| `write` | 36 | 0 | 0 | 0% |
| `request_close_issue` | 32 | 1 | 0 | 3.1% |
| `search_issues` | 23 | 0 | 0 | 0% |
| `list_prs` | 22 | 0 | 0 | 0% |
| `delegate` | 17 | 0 | 0 | 0% |
| `search_remote_code` | 15 | 4 | 0 | 26.7% |
| `search_code` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `create_root_issue` | 12 | 1 | 0 | 8.3% |
| `create_sub_issue` | 9 | 0 | 0 | 0% |
| `delegate_readonly` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `get_pr_reviews` | 8 | 0 | 0 | 0% |
| `merge_pr` | 8 | 0 | 0 | 0% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 2 | 0 | 33.3% |
| `sync_branch` | 6 | 2 | 0 | 33.3% |
| `delegate_large` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `create_issue` | 4 | 0 | 0 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `close_issue` | 2 | 0 | 0 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `list_issues` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 769 | 55.6% |
| `search` | 230 | 16.6% |
| `verify` | 181 | 13.1% |
| `edit` | 113 | 8.2% |
| `open` | 89 | 6.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 69 | 94.5% |
| `delivery/pipeline-setup` | 2 | 2.7% |
| `engineering/secrets-in-a-check` | 1 | 1.4% |
| `research/web-search` | 1 | 1.4% |

## Last 30 days

133 sessions.

**Ran to an end without a report:** 26 of 130 sessions whose last run the core recorded as `completed` — 20%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**555,848,646 tokens** over 178 runs that reported them, **97.6% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 5,864,765 | 39,097,860 | 73,718,100 | 555,848,646 |
| messages per session | 135 | 388 | 715 | 731 | 24,071 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 55 | 41.4% |
| `atomaton` | 52 | 39.1% |
| `engineer` | 26 | 19.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,267 | 21 | 4 | 0.6% |
| `bash` | 2,724 | 44 | 47 | 1.6% |
| `grep` | 2,378 | 57 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,095 | 16 | 0 | 1.5% |
| `fetch` | 363 | 37 | 0 | 10.2% |
| `list` | 229 | 3 | 0 | 1.3% |
| `get_issue` | 210 | 13 | 4 | 6.2% |
| `get_issue_comments` | 183 | 0 | 10 | 0% |
| `glob` | 167 | 1 | 1 | 0.6% |
| `get_pr` | 156 | 9 | 0 | 5.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_check_runs` | 146 | 6 | 0 | 4.1% |
| `atoma_builtin__load_skill` | 127 | 0 | 0 | 0% |
| `get_branch` | 113 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `check_merge_readiness` | 90 | 0 | 0 | 0% |
| `write` | 86 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr_diff` | 67 | 3 | 0 | 4.5% |
| `commit_and_push` | 65 | 5 | 0 | 7.7% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 62 | 22 | 0 | 35.5% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `request_close_issue` | 39 | 1 | 0 | 2.6% |
| `list_prs` | 38 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `delegate` | 19 | 0 | 0 | 0% |
| `get_pr_reviews` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `merge_pr` | 14 | 0 | 0 | 0% |
| `create_root_issue` | 13 | 1 | 0 | 7.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `create_sub_issue` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 8 | 2 | 0 | 25% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,768 | 64.9% |
| `search` | 375 | 13.8% |
| `verify` | 219 | 8% |
| `edit` | 215 | 7.9% |
| `open` | 147 | 5.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 110 | 85.3% |
| `delivery/pipeline-setup` | 7 | 5.4% |
| `engineering/environment` | 6 | 4.7% |
| `engineering/secrets-in-a-check` | 3 | 2.3% |
| `research/web-search` | 2 | 1.6% |
| `docs/design-doc` | 1 | 0.8% |

## Last year

133 sessions.

**Ran to an end without a report:** 26 of 130 sessions whose last run the core recorded as `completed` — 20%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**555,848,646 tokens** over 178 runs that reported them, **97.6% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 5,864,765 | 39,097,860 | 73,718,100 | 555,848,646 |
| messages per session | 135 | 388 | 715 | 731 | 24,071 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 55 | 41.4% |
| `atomaton` | 52 | 39.1% |
| `engineer` | 26 | 19.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,267 | 21 | 4 | 0.6% |
| `bash` | 2,724 | 44 | 47 | 1.6% |
| `grep` | 2,378 | 57 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,095 | 16 | 0 | 1.5% |
| `fetch` | 363 | 37 | 0 | 10.2% |
| `list` | 229 | 3 | 0 | 1.3% |
| `get_issue` | 210 | 13 | 4 | 6.2% |
| `get_issue_comments` | 183 | 0 | 10 | 0% |
| `glob` | 167 | 1 | 1 | 0.6% |
| `get_pr` | 156 | 9 | 0 | 5.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_check_runs` | 146 | 6 | 0 | 4.1% |
| `atoma_builtin__load_skill` | 127 | 0 | 0 | 0% |
| `get_branch` | 113 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `check_merge_readiness` | 90 | 0 | 0 | 0% |
| `write` | 86 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr_diff` | 67 | 3 | 0 | 4.5% |
| `commit_and_push` | 65 | 5 | 0 | 7.7% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 62 | 22 | 0 | 35.5% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `request_close_issue` | 39 | 1 | 0 | 2.6% |
| `list_prs` | 38 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `delegate` | 19 | 0 | 0 | 0% |
| `get_pr_reviews` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `merge_pr` | 14 | 0 | 0 | 0% |
| `create_root_issue` | 13 | 1 | 0 | 7.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `create_sub_issue` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 8 | 2 | 0 | 25% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,768 | 64.9% |
| `search` | 375 | 13.8% |
| `verify` | 219 | 8% |
| `edit` | 215 | 7.9% |
| `open` | 147 | 5.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 110 | 85.3% |
| `delivery/pipeline-setup` | 7 | 5.4% |
| `engineering/environment` | 6 | 4.7% |
| `engineering/secrets-in-a-check` | 3 | 2.3% |
| `research/web-search` | 2 | 1.6% |
| `docs/design-doc` | 1 | 0.8% |

## All time

135 sessions.

**Ran to an end without a report:** 26 of 130 sessions whose last run the core recorded as `completed` — 20%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 2 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**555,848,646 tokens** over 178 runs that reported them, **97.6% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.3% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,398,746 | 5,864,765 | 39,097,860 | 73,718,100 | 555,848,646 |
| messages per session | 135 | 388 | 715 | 731 | 24,075 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 55 | 40.7% |
| `atomaton` | 54 | 40% |
| `engineer` | 26 | 19.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 3,267 | 21 | 4 | 0.6% |
| `bash` | 2,724 | 44 | 47 | 1.6% |
| `grep` | 2,378 | 57 | 7 | 2.4% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 1,095 | 16 | 0 | 1.5% |
| `fetch` | 363 | 37 | 0 | 10.2% |
| `list` | 229 | 3 | 0 | 1.3% |
| `get_issue` | 210 | 13 | 4 | 6.2% |
| `get_issue_comments` | 183 | 0 | 10 | 0% |
| `glob` | 167 | 1 | 1 | 0.6% |
| `get_pr` | 156 | 9 | 0 | 5.8% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_check_runs` | 146 | 6 | 0 | 4.1% |
| `atoma_builtin__load_skill` | 127 | 0 | 0 | 0% |
| `get_branch` | 113 | 0 | 0 | 0% |
| `search_issues` | 92 | 0 | 2 | 0% |
| `check_merge_readiness` | 90 | 0 | 0 | 0% |
| `write` | 86 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `get_pr_diff` | 67 | 3 | 0 | 4.5% |
| `commit_and_push` | 65 | 5 | 0 | 7.7% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 62 | 22 | 0 | 35.5% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `request_close_issue` | 39 | 1 | 0 | 2.6% |
| `list_prs` | 38 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 21 | 0 | 0 | 0% |
| `search_code` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 20 | 5 | 0 | 25% |
| `delegate` | 19 | 0 | 0 | 0% |
| `get_pr_reviews` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_pr_review_comments` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `merge_pr` | 14 | 0 | 0 | 0% |
| `create_root_issue` | 13 | 1 | 0 | 7.7% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `sync_branch` | 11 | 3 | 0 | 27.3% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `create_sub_issue` | 9 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `launch_sub_agent` | 8 | 2 | 0 | 25% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate_large` | 6 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `load_skill` | 2 | 2 | 0 | 100% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `merge_base_into_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,768 | 64.9% |
| `search` | 375 | 13.8% |
| `verify` | 219 | 8% |
| `edit` | 215 | 7.9% |
| `open` | 147 | 5.4% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 110 | 85.3% |
| `delivery/pipeline-setup` | 7 | 5.4% |
| `engineering/environment` | 6 | 4.7% |
| `engineering/secrets-in-a-check` | 3 | 2.3% |
| `research/web-search` | 2 | 1.6% |
| `docs/design-doc` | 1 | 0.8% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
