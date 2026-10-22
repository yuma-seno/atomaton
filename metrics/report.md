# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-22.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 150 | 6.7% | 370 | 9,859 | 15 | 25.6 |
| Last 30 days | 215 | 6.5% | 491 | 10,246 | 20 | 30.0 |
| Last year | 215 | 6.5% | 491 | 10,246 | 20 | 30.0 |
| All time | 215 | 6.5% | 491 | 10,246 | 20 | 30.0 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 201 |
| `failed` | 11 |
| `stopped` | 3 |

## Last 7 days

62 sessions.

**Ran to an end without a report:** 12 of 61 sessions whose last run the core recorded as `completed` — 19.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**177,344,443 tokens** over 85 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,036,761 | 5,619,407 | 39,097,860 | 39,097,860 | 177,344,443 |
| messages per session | 135 | 327 | 571 | 571 | 10,538 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 31 | 50% |
| `reviewer` | 24 | 38.7% |
| `engineer` | 7 | 11.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,540 | 10 | 0 | 0.6% |
| `bash` | 1,354 | 18 | 19 | 1.3% |
| `grep` | 1,099 | 24 | 0 | 2.2% |
| `edit` | 664 | 8 | 0 | 1.2% |
| `fetch` | 229 | 32 | 0 | 14% |
| `get_issue` | 148 | 13 | 4 | 8.8% |
| `list` | 97 | 1 | 0 | 1% |
| `get_issue_comments` | 84 | 0 | 2 | 0% |
| `glob` | 82 | 1 | 0 | 1.2% |
| `get_pr` | 76 | 5 | 0 | 6.6% |
| `get_check_runs` | 70 | 1 | 0 | 1.4% |
| `search_issues` | 66 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 54 | 0 | 0 | 0% |
| `get_branch` | 52 | 0 | 0 | 0% |
| `create_pr` | 43 | 17 | 0 | 39.5% |
| `commit_and_push` | 39 | 3 | 0 | 7.7% |
| `check_merge_readiness` | 36 | 0 | 0 | 0% |
| `get_pr_diff` | 32 | 2 | 0 | 6.3% |
| `write` | 27 | 0 | 0 | 0% |
| `request_close_issue` | 25 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 4 | 0 | 25% |
| `list_prs` | 15 | 0 | 0 | 0% |
| `search_code` | 15 | 0 | 0 | 0% |
| `delegate_readonly` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `get_pr_reviews` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `merge_pr` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 2 | 0 | 33.3% |
| `list_issues` | 6 | 0 | 0 | 0% |
| `create_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 2 | 0 | 50% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 790 | 58.3% |
| `search` | 250 | 18.5% |
| `verify` | 151 | 11.2% |
| `edit` | 86 | 6.4% |
| `open` | 77 | 5.7% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 52 | 96.3% |
| `delivery/pipeline-setup` | 1 | 1.9% |
| `research/web-search` | 1 | 1.9% |

## Last 30 days

98 sessions.

**Ran to an end without a report:** 23 of 96 sessions whose last run the core recorded as `completed` — 24%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**446,747,848 tokens** over 120 runs that reported them, **97.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,408,541 | 6,743,981 | 39,097,860 | 73,718,100 | 446,747,848 |
| messages per session | 152 | 445 | 715 | 715 | 19,451 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 46 | 46.9% |
| `reviewer` | 34 | 34.7% |
| `engineer` | 18 | 18.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,589 | 17 | 4 | 0.7% |
| `bash` | 2,203 | 42 | 44 | 1.9% |
| `grep` | 1,791 | 36 | 7 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 876 | 9 | 0 | 1% |
| `fetch` | 331 | 35 | 0 | 10.6% |
| `list` | 202 | 2 | 0 | 1% |
| `get_issue` | 187 | 13 | 4 | 7% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 137 | 0 | 10 | 0% |
| `glob` | 127 | 1 | 1 | 0.8% |
| `get_pr` | 110 | 9 | 0 | 8.2% |
| `atoma_builtin__load_skill` | 100 | 0 | 0 | 0% |
| `get_check_runs` | 99 | 3 | 0 | 3% |
| `get_branch` | 91 | 0 | 0 | 0% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `write` | 77 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 52 | 20 | 0 | 38.5% |
| `check_merge_readiness` | 50 | 0 | 0 | 0% |
| `commit_and_push` | 48 | 5 | 0 | 10.4% |
| `get_pr_diff` | 44 | 3 | 0 | 6.8% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `request_close_issue` | 29 | 0 | 0 | 0% |
| `list_prs` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_code` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
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
| `other` | 1,413 | 64.1% |
| `search` | 326 | 14.8% |
| `verify` | 175 | 7.9% |
| `edit` | 166 | 7.5% |
| `open` | 123 | 5.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 83 | 83% |
| `delivery/pipeline-setup` | 6 | 6% |
| `engineering/environment` | 6 | 6% |
| `engineering/secrets-in-a-check` | 2 | 2% |
| `research/web-search` | 2 | 2% |
| `docs/design-doc` | 1 | 1% |

## Last year

98 sessions.

**Ran to an end without a report:** 23 of 96 sessions whose last run the core recorded as `completed` — 24%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**446,747,848 tokens** over 120 runs that reported them, **97.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,408,541 | 6,743,981 | 39,097,860 | 73,718,100 | 446,747,848 |
| messages per session | 152 | 445 | 715 | 715 | 19,451 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 46 | 46.9% |
| `reviewer` | 34 | 34.7% |
| `engineer` | 18 | 18.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,589 | 17 | 4 | 0.7% |
| `bash` | 2,203 | 42 | 44 | 1.9% |
| `grep` | 1,791 | 36 | 7 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 876 | 9 | 0 | 1% |
| `fetch` | 331 | 35 | 0 | 10.6% |
| `list` | 202 | 2 | 0 | 1% |
| `get_issue` | 187 | 13 | 4 | 7% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 137 | 0 | 10 | 0% |
| `glob` | 127 | 1 | 1 | 0.8% |
| `get_pr` | 110 | 9 | 0 | 8.2% |
| `atoma_builtin__load_skill` | 100 | 0 | 0 | 0% |
| `get_check_runs` | 99 | 3 | 0 | 3% |
| `get_branch` | 91 | 0 | 0 | 0% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `write` | 77 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 52 | 20 | 0 | 38.5% |
| `check_merge_readiness` | 50 | 0 | 0 | 0% |
| `commit_and_push` | 48 | 5 | 0 | 10.4% |
| `get_pr_diff` | 44 | 3 | 0 | 6.8% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `request_close_issue` | 29 | 0 | 0 | 0% |
| `list_prs` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_code` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
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
| `other` | 1,413 | 64.1% |
| `search` | 326 | 14.8% |
| `verify` | 175 | 7.9% |
| `edit` | 166 | 7.5% |
| `open` | 123 | 5.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 83 | 83% |
| `delivery/pipeline-setup` | 6 | 6% |
| `engineering/environment` | 6 | 6% |
| `engineering/secrets-in-a-check` | 2 | 2% |
| `research/web-search` | 2 | 2% |
| `docs/design-doc` | 1 | 1% |

## All time

98 sessions.

**Ran to an end without a report:** 23 of 96 sessions whose last run the core recorded as `completed` — 24%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**446,747,848 tokens** over 120 runs that reported them, **97.4% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.5% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,408,541 | 6,743,981 | 39,097,860 | 73,718,100 | 446,747,848 |
| messages per session | 152 | 445 | 715 | 715 | 19,451 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 46 | 46.9% |
| `reviewer` | 34 | 34.7% |
| `engineer` | 18 | 18.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,589 | 17 | 4 | 0.7% |
| `bash` | 2,203 | 42 | 44 | 1.9% |
| `grep` | 1,791 | 36 | 7 | 2% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 876 | 9 | 0 | 1% |
| `fetch` | 331 | 35 | 0 | 10.6% |
| `list` | 202 | 2 | 0 | 1% |
| `get_issue` | 187 | 13 | 4 | 7% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 137 | 0 | 10 | 0% |
| `glob` | 127 | 1 | 1 | 0.8% |
| `get_pr` | 110 | 9 | 0 | 8.2% |
| `atoma_builtin__load_skill` | 100 | 0 | 0 | 0% |
| `get_check_runs` | 99 | 3 | 0 | 3% |
| `get_branch` | 91 | 0 | 0 | 0% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `write` | 77 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 52 | 20 | 0 | 38.5% |
| `check_merge_readiness` | 50 | 0 | 0 | 0% |
| `commit_and_push` | 48 | 5 | 0 | 10.4% |
| `get_pr_diff` | 44 | 3 | 0 | 6.8% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `request_close_issue` | 29 | 0 | 0 | 0% |
| `list_prs` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `delegate_readonly` | 20 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_code` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 12 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `merge_pr` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `delegate_large` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
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
| `other` | 1,413 | 64.1% |
| `search` | 326 | 14.8% |
| `verify` | 175 | 7.9% |
| `edit` | 166 | 7.5% |
| `open` | 123 | 5.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 83 | 83% |
| `delivery/pipeline-setup` | 6 | 6% |
| `engineering/environment` | 6 | 6% |
| `engineering/secrets-in-a-check` | 2 | 2% |
| `research/web-search` | 2 | 2% |
| `docs/design-doc` | 1 | 1% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
