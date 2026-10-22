# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-10-22.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 139 | 7.2% | 376 | 9,859 | 15 | 27.0 |
| Last 30 days | 204 | 6.9% | 522 | 10,246 | 20 | 30.3 |
| Last year | 204 | 6.9% | 522 | 10,246 | 20 | 30.3 |
| All time | 204 | 6.9% | 522 | 10,246 | 20 | 30.3 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 190 |
| `failed` | 11 |
| `stopped` | 3 |

## Last 7 days

57 sessions.

**Ran to an end without a report:** 12 of 56 sessions whose last run the core recorded as `completed` — 21.4%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**164,579,405 tokens** over 78 runs that reported them, **97.9% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**93.4% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,173,182 | 5,619,407 | 39,097,860 | 39,097,860 | 164,579,405 |
| messages per session | 135 | 350 | 571 | 571 | 9,785 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 29 | 50.9% |
| `reviewer` | 22 | 38.6% |
| `engineer` | 6 | 10.5% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 1,441 | 10 | 0 | 0.7% |
| `bash` | 1,241 | 18 | 18 | 1.5% |
| `grep` | 1,036 | 18 | 0 | 1.7% |
| `edit` | 613 | 8 | 0 | 1.3% |
| `fetch` | 224 | 32 | 0 | 14.3% |
| `get_issue` | 142 | 13 | 4 | 9.2% |
| `list` | 89 | 1 | 0 | 1.1% |
| `get_issue_comments` | 81 | 0 | 2 | 0% |
| `glob` | 77 | 1 | 0 | 1.3% |
| `get_pr` | 69 | 5 | 0 | 7.2% |
| `get_check_runs` | 66 | 1 | 0 | 1.5% |
| `search_issues` | 66 | 0 | 0 | 0% |
| `get_branch` | 50 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 49 | 0 | 0 | 0% |
| `create_pr` | 38 | 16 | 0 | 42.1% |
| `commit_and_push` | 35 | 3 | 0 | 8.6% |
| `check_merge_readiness` | 32 | 0 | 0 | 0% |
| `get_pr_diff` | 29 | 2 | 0 | 6.9% |
| `request_close_issue` | 24 | 0 | 0 | 0% |
| `write` | 21 | 0 | 0 | 0% |
| `search_remote_code` | 16 | 4 | 0 | 25% |
| `search_code` | 14 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `delegate_readonly` | 13 | 0 | 0 | 0% |
| `list_prs` | 12 | 0 | 0 | 0% |
| `delegate` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `get_pr_reviews` | 9 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `list_pr_review_comments` | 7 | 0 | 0 | 0% |
| `launch_sub_agent` | 6 | 2 | 0 | 33.3% |
| `list_issues` | 6 | 0 | 0 | 0% |
| `merge_pr` | 6 | 0 | 0 | 0% |
| `create_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 4 | 0 | 1 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `sync_branch` | 4 | 2 | 0 | 50% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 704 | 56.7% |
| `search` | 242 | 19.5% |
| `verify` | 141 | 11.4% |
| `edit` | 84 | 6.8% |
| `open` | 70 | 5.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 47 | 95.9% |
| `delivery/pipeline-setup` | 1 | 2% |
| `research/web-search` | 1 | 2% |

## Last 30 days

93 sessions.

**Ran to an end without a report:** 23 of 91 sessions whose last run the core recorded as `completed` — 25.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**433,982,810 tokens** over 113 runs that reported them, **97.3% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,408,541 | 6,743,981 | 39,097,860 | 73,718,100 | 433,982,810 |
| messages per session | 151 | 445 | 715 | 715 | 18,698 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 44 | 47.3% |
| `reviewer` | 32 | 34.4% |
| `engineer` | 17 | 18.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,490 | 17 | 4 | 0.7% |
| `bash` | 2,090 | 42 | 43 | 2% |
| `grep` | 1,728 | 30 | 7 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 825 | 9 | 0 | 1.1% |
| `fetch` | 326 | 35 | 0 | 10.7% |
| `list` | 194 | 2 | 0 | 1% |
| `get_issue` | 181 | 13 | 4 | 7.2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 134 | 0 | 10 | 0% |
| `glob` | 122 | 1 | 1 | 0.8% |
| `get_pr` | 103 | 9 | 0 | 8.7% |
| `atoma_builtin__load_skill` | 95 | 0 | 0 | 0% |
| `get_check_runs` | 95 | 3 | 0 | 3.2% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `get_branch` | 89 | 0 | 0 | 0% |
| `write` | 71 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 47 | 19 | 0 | 40.4% |
| `check_merge_readiness` | 46 | 0 | 0 | 0% |
| `commit_and_push` | 44 | 5 | 0 | 11.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_diff` | 41 | 3 | 0 | 7.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `request_close_issue` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `list_prs` | 25 | 0 | 0 | 0% |
| `delegate_readonly` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `search_code` | 18 | 0 | 0 | 0% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate_readonly_large` | 6 | 0 | 3 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,327 | 63.5% |
| `search` | 318 | 15.2% |
| `verify` | 165 | 7.9% |
| `edit` | 164 | 7.8% |
| `open` | 116 | 5.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 78 | 82.1% |
| `delivery/pipeline-setup` | 6 | 6.3% |
| `engineering/environment` | 6 | 6.3% |
| `engineering/secrets-in-a-check` | 2 | 2.1% |
| `research/web-search` | 2 | 2.1% |
| `docs/design-doc` | 1 | 1.1% |

## Last year

93 sessions.

**Ran to an end without a report:** 23 of 91 sessions whose last run the core recorded as `completed` — 25.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**433,982,810 tokens** over 113 runs that reported them, **97.3% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,408,541 | 6,743,981 | 39,097,860 | 73,718,100 | 433,982,810 |
| messages per session | 151 | 445 | 715 | 715 | 18,698 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 44 | 47.3% |
| `reviewer` | 32 | 34.4% |
| `engineer` | 17 | 18.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,490 | 17 | 4 | 0.7% |
| `bash` | 2,090 | 42 | 43 | 2% |
| `grep` | 1,728 | 30 | 7 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 825 | 9 | 0 | 1.1% |
| `fetch` | 326 | 35 | 0 | 10.7% |
| `list` | 194 | 2 | 0 | 1% |
| `get_issue` | 181 | 13 | 4 | 7.2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 134 | 0 | 10 | 0% |
| `glob` | 122 | 1 | 1 | 0.8% |
| `get_pr` | 103 | 9 | 0 | 8.7% |
| `atoma_builtin__load_skill` | 95 | 0 | 0 | 0% |
| `get_check_runs` | 95 | 3 | 0 | 3.2% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `get_branch` | 89 | 0 | 0 | 0% |
| `write` | 71 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 47 | 19 | 0 | 40.4% |
| `check_merge_readiness` | 46 | 0 | 0 | 0% |
| `commit_and_push` | 44 | 5 | 0 | 11.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_diff` | 41 | 3 | 0 | 7.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `request_close_issue` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `list_prs` | 25 | 0 | 0 | 0% |
| `delegate_readonly` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `search_code` | 18 | 0 | 0 | 0% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate_readonly_large` | 6 | 0 | 3 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,327 | 63.5% |
| `search` | 318 | 15.2% |
| `verify` | 165 | 7.9% |
| `edit` | 164 | 7.8% |
| `open` | 116 | 5.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 78 | 82.1% |
| `delivery/pipeline-setup` | 6 | 6.3% |
| `engineering/environment` | 6 | 6.3% |
| `engineering/secrets-in-a-check` | 2 | 2.1% |
| `research/web-search` | 2 | 2.1% |
| `docs/design-doc` | 1 | 1.1% |

## All time

93 sessions.

**Ran to an end without a report:** 23 of 91 sessions whose last run the core recorded as `completed` — 25.3%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**433,982,810 tokens** over 113 runs that reported them, **97.3% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.6% of that prompt was served from cache**, over the runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,408,541 | 6,743,981 | 39,097,860 | 73,718,100 | 433,982,810 |
| messages per session | 151 | 445 | 715 | 715 | 18,698 |

| agent | sessions | share |
| --- | ---: | ---: |
| `atomaton` | 44 | 47.3% |
| `reviewer` | 32 | 34.4% |
| `engineer` | 17 | 18.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 2,490 | 17 | 4 | 0.7% |
| `bash` | 2,090 | 42 | 43 | 2% |
| `grep` | 1,728 | 30 | 7 | 1.7% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `edit` | 825 | 9 | 0 | 1.1% |
| `fetch` | 326 | 35 | 0 | 10.7% |
| `list` | 194 | 2 | 0 | 1% |
| `get_issue` | 181 | 13 | 4 | 7.2% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_issue_comments` | 134 | 0 | 10 | 0% |
| `glob` | 122 | 1 | 1 | 0.8% |
| `get_pr` | 103 | 9 | 0 | 8.7% |
| `atoma_builtin__load_skill` | 95 | 0 | 0 | 0% |
| `get_check_runs` | 95 | 3 | 0 | 3.2% |
| `search_issues` | 90 | 0 | 2 | 0% |
| `get_branch` | 89 | 0 | 0 | 0% |
| `write` | 71 | 0 | 0 | 0% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `create_pr` | 47 | 19 | 0 | 40.4% |
| `check_merge_readiness` | 46 | 0 | 0 | 0% |
| `commit_and_push` | 44 | 5 | 0 | 11.4% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `get_pr_diff` | 41 | 3 | 0 | 7.3% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `request_close_issue` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `list_prs` | 25 | 0 | 0 | 0% |
| `delegate_readonly` | 19 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `search_remote_code` | 19 | 5 | 0 | 26.3% |
| `search_code` | 18 | 0 | 0 | 0% |
| `get_pr_reviews` | 17 | 0 | 0 | 0% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `list_pr_review_comments` | 14 | 0 | 0 | 0% |
| `delegate` | 11 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `merge_pr` | 10 | 0 | 0 | 0% |
| `create_root_issue` | 9 | 1 | 0 | 11.1% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `sync_branch` | 8 | 3 | 0 | 37.5% |
| `launch_sub_agent` | 7 | 2 | 0 | 28.6% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `delegate_readonly_large` | 6 | 0 | 3 | 0% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `create_sub_issue` | 3 | 0 | 0 | 0% |
| `search__search_code` | 3 | 0 | 0 | 0% |
| `delegate__run` | 2 | 0 | 0 | 0% |
| `github__close_issue` | 2 | 0 | 0 | 0% |
| `github__merge_pr` | 2 | 0 | 0 | 0% |
| `github__search_code` | 2 | 0 | 0 | 0% |
| `publish_draft` | 2 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `dev_null` | 1 | 1 | 0 | 100% |
| `github__sync_branch` | 1 | 0 | 0 | 0% |
| `render</｜｜DSML｜｜ parameter>
<｜｜DSML｜｜ parameter name=` | 1 | 1 | 0 | 100% |
| `shell__execute_code` | 1 | 1 | 0 | 100% |
| `shell_execute` | 1 | 1 | 0 | 100% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,327 | 63.5% |
| `search` | 318 | 15.2% |
| `verify` | 165 | 7.9% |
| `edit` | 164 | 7.8% |
| `open` | 116 | 5.6% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 78 | 82.1% |
| `delivery/pipeline-setup` | 6 | 6.3% |
| `engineering/environment` | 6 | 6.3% |
| `engineering/secrets-in-a-check` | 2 | 2.1% |
| `research/web-search` | 2 | 2.1% |
| `docs/design-doc` | 1 | 1.1% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Every skill has been loaded at least once.
