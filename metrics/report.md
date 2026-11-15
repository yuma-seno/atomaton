# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-11-15.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 115 | 22.6% | 448 | 5,064 | 18 | 31.5 |
| Last 30 days | 687 | 7.3% | 257 | 9,859 | 14 | 19.0 |
| Last year | 772 | 7.5% | 296 | 10,246 | 15 | 20.8 |
| All time | 772 | 7.5% | 296 | 10,246 | 15 | 20.8 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 714 |
| `failed` | 47 |
| `stopped` | 11 |

## Last 7 days

34 sessions.

**Ran to an end without a report:** 4 of 31 sessions whose last run the core recorded as `completed` — 12.9%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**137,620,765 tokens** over 44 runs that reported them, **97.1% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.1% of that prompt was served from cache**, over the 42 of 44 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,291,903 | 8,391,640 | 13,863,651 | 13,863,651 | 137,620,765 |
| messages per session | 215 | 366 | 394 | 394 | 7,503 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 16 | 47.1% |
| `engineer` | 13 | 38.2% |
| `atomaton` | 4 | 11.8% |
| `architect` | 1 | 2.9% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 1,513 | 31 | 21 | 2% |
| `grep` | 847 | 11 | 3 | 1.3% |
| `read` | 841 | 5 | 0 | 0.6% |
| `fetch` | 281 | 43 | 0 | 15.3% |
| `edit` | 171 | 5 | 0 | 2.9% |
| `load_skill` | 57 | 0 | 0 | 0% |
| `glob` | 55 | 0 | 0 | 0% |
| `get_check_runs` | 49 | 1 | 0 | 2% |
| `get_pr` | 42 | 0 | 0 | 0% |
| `get_issue_comments` | 38 | 0 | 0 | 0% |
| `list` | 36 | 2 | 0 | 5.6% |
| `check_merge_readiness` | 28 | 0 | 0 | 0% |
| `get_issue` | 28 | 0 | 0 | 0% |
| `write` | 26 | 0 | 0 | 0% |
| `commit_and_push` | 25 | 1 | 0 | 4% |
| `create_pr` | 25 | 9 | 0 | 36% |
| `get_pr_diff` | 19 | 0 | 0 | 0% |
| `get_branch` | 16 | 0 | 0 | 0% |
| `get_pr_reviews` | 16 | 0 | 0 | 0% |
| `search_code` | 13 | 0 | 0 | 0% |
| `list_pr_review_comments` | 12 | 0 | 0 | 0% |
| `request_close_issue` | 11 | 0 | 0 | 0% |
| `search_issues` | 10 | 0 | 0 | 0% |
| `list_prs` | 8 | 0 | 0 | 0% |
| `merge_pr` | 7 | 0 | 0 | 0% |
| `publish_draft` | 5 | 0 | 0 | 0% |
| `create_root_issue` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `create_sub_issue` | 2 | 0 | 0 | 0% |
| `delegate_readonly` | 2 | 0 | 0 | 0% |
| `merge_base_into_branch` | 2 | 0 | 0 | 0% |
| `delegate` | 1 | 0 | 0 | 0% |
| `delegate_large` | 1 | 0 | 0 | 0% |
| `launch_sub_agent` | 1 | 0 | 0 | 0% |
| `list_issues` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `search_remote_code` | 1 | 1 | 0 | 100% |
| `sync_branch` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 1,252 | 82.7% |
| `edit` | 140 | 9.3% |
| `open` | 68 | 4.5% |
| `search` | 52 | 3.4% |
| `verify` | 1 | 0.1% |

| skill | loads | share |
| --- | ---: | ---: |
| `writing/japanese` | 30 | 52.6% |
| `project/conventions` | 23 | 40.4% |
| `research/web-search` | 3 | 5.3% |
| `engineering/secrets-in-a-check` | 1 | 1.8% |

## Last 30 days

256 sessions.

**Ran to an end without a report:** 41 of 245 sessions whose last run the core recorded as `completed` — 16.7%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**770,393,701 tokens** over 341 runs that reported them, **98% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**94.4% of that prompt was served from cache**, over the 339 of 341 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,211,508 | 5,758,740 | 17,629,142 | 29,805,044 | 770,393,701 |
| messages per session | 123 | 327 | 445 | 731 | 40,484 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 111 | 43.4% |
| `engineer` | 85 | 33.2% |
| `atomaton` | 59 | 23% |
| `architect` | 1 | 0.4% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 7,122 | 140 | 98 | 2% |
| `read` | 4,775 | 23 | 4 | 0.5% |
| `grep` | 3,868 | 95 | 14 | 2.5% |
| `edit` | 1,809 | 32 | 0 | 1.8% |
| `fetch` | 855 | 72 | 0 | 8.4% |
| `get_check_runs` | 303 | 11 | 0 | 3.6% |
| `get_pr` | 302 | 4 | 3 | 1.3% |
| `get_issue_comments` | 281 | 0 | 2 | 0% |
| `get_issue` | 271 | 1 | 5 | 0.4% |
| `glob` | 262 | 1 | 0 | 0.4% |
| `list` | 247 | 4 | 0 | 1.6% |
| `check_merge_readiness` | 187 | 0 | 0 | 0% |
| `commit_and_push` | 179 | 7 | 0 | 3.9% |
| `atoma_builtin__load_skill` | 158 | 1 | 0 | 0.6% |
| `create_pr` | 155 | 49 | 0 | 31.6% |
| `get_branch` | 154 | 0 | 0 | 0% |
| `write` | 149 | 2 | 0 | 1.3% |
| `get_pr_diff` | 125 | 2 | 0 | 1.6% |
| `request_close_issue` | 94 | 1 | 0 | 1.1% |
| `load_skill` | 79 | 9 | 0 | 11.4% |
| `get_pr_reviews` | 70 | 0 | 0 | 0% |
| `search_issues` | 68 | 0 | 1 | 0% |
| `merge_pr` | 59 | 0 | 0 | 0% |
| `list_pr_review_comments` | 51 | 0 | 0 | 0% |
| `list_prs` | 51 | 0 | 0 | 0% |
| `search_code` | 46 | 0 | 0 | 0% |
| `search_remote_code` | 39 | 12 | 0 | 30.8% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `delegate` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 25 | 2 | 0 | 8% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `delegate_readonly` | 19 | 0 | 0 | 0% |
| `shell__shell_execute` | 14 | 0 | 0 | 0% |
| `sync_branch` | 12 | 6 | 0 | 50% |
| `list_issues` | 10 | 0 | 0 | 0% |
| `web__fetch` | 9 | 0 | 0 | 0% |
| `delegate_large` | 7 | 0 | 0 | 0% |
| `publish_draft` | 7 | 0 | 0 | 0% |
| `create_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly_large` | 5 | 0 | 1 | 0% |
| `github__create_issue` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
| `close_issue` | 3 | 0 | 0 | 0% |
| `attach_file` | 2 | 2 | 0 | 100% |
| `github__get_issue` | 2 | 0 | 0 | 0% |
| `atomaton__launch_sub_agent` | 1 | 0 | 0 | 0% |
| `bun` | 1 | 1 | 0 | 100% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `github__list_issues` | 1 | 0 | 0 | 0% |
| `reload_environment` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

| act | calls | share |
| --- | ---: | ---: |
| `other` | 5,773 | 81.1% |
| `edit` | 538 | 7.6% |
| `search` | 401 | 5.6% |
| `open` | 210 | 2.9% |
| `verify` | 200 | 2.8% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 187 | 78.9% |
| `writing/japanese` | 30 | 12.7% |
| `research/web-search` | 7 | 3% |
| `delivery/pipeline-setup` | 5 | 2.1% |
| `engineering/secrets-in-a-check` | 4 | 1.7% |
| `docs/customer-doc` | 3 | 1.3% |
| `engineering/environment` | 1 | 0.4% |

## Last year

299 sessions.

**Ran to an end without a report:** 55 of 286 sessions whose last run the core recorded as `completed` — 19.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

**1,093,425,191 tokens** over 385 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the 383 of 385 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 6,183,128 | 28,119,706 | 73,718,100 | 1,093,425,191 |
| messages per session | 137 | 347 | 705 | 731 | 51,104 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 123 | 41.1% |
| `engineer` | 97 | 32.4% |
| `atomaton` | 78 | 26.1% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,266 | 168 | 126 | 2% |
| `read` | 6,075 | 32 | 8 | 0.5% |
| `grep` | 4,697 | 112 | 21 | 2.4% |
| `edit` | 2,150 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,033 | 98 | 0 | 9.5% |
| `list` | 360 | 5 | 0 | 1.4% |
| `get_issue` | 359 | 14 | 5 | 3.9% |
| `get_issue_comments` | 350 | 0 | 10 | 0% |
| `get_pr` | 345 | 9 | 3 | 2.6% |
| `get_check_runs` | 339 | 13 | 0 | 3.8% |
| `glob` | 312 | 1 | 1 | 0.3% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 205 | 0 | 0 | 0% |
| `get_branch` | 202 | 0 | 0 | 0% |
| `write` | 199 | 2 | 0 | 1% |
| `commit_and_push` | 192 | 9 | 0 | 4.7% |
| `create_pr` | 169 | 55 | 0 | 32.5% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 139 | 3 | 0 | 2.2% |
| `search_issues` | 131 | 0 | 3 | 0% |
| `request_close_issue` | 100 | 1 | 0 | 1% |
| `get_pr_reviews` | 81 | 0 | 0 | 0% |
| `load_skill` | 79 | 9 | 0 | 11.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 67 | 0 | 0 | 0% |
| `merge_pr` | 65 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_pr_review_comments` | 61 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 42 | 13 | 0 | 31% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `delegate_readonly` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 17 | 0 | 0 | 0% |
| `sync_branch` | 16 | 7 | 0 | 43.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
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
| `other` | 6,606 | 79.9% |
| `edit` | 632 | 7.6% |
| `search` | 527 | 6.4% |
| `open` | 263 | 3.2% |
| `verify` | 238 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 224 | 77.5% |
| `writing/japanese` | 30 | 10.4% |
| `delivery/pipeline-setup` | 10 | 3.5% |
| `research/web-search` | 8 | 2.8% |
| `engineering/environment` | 7 | 2.4% |
| `engineering/secrets-in-a-check` | 6 | 2.1% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## All time

317 sessions.

**Ran to an end without a report:** 55 of 286 sessions whose last run the core recorded as `completed` — 19.2%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

Neither figure covers 18 sessions with no run record at all — without one, neither question can be asked. Everything from before atoma recorded its runs is in there.

**1,093,425,191 tokens** over 385 runs that reported them, **97.7% of it prompt** — what the agents were made to read, not what they wrote. Anything spent on making runs cheaper belongs on that side. No money here, deliberately: of the four providers only one reports a cost, and a price table goes quietly stale and then prints confident wrong numbers.

**95.2% of that prompt was served from cache**, over the 383 of 385 runs whose provider reported it. A cached prompt token costs a fraction of a fresh one, so this is most of what separates the counts above from the bill — and it is the figure that moves when what gets resent changes.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| tokens per run | 1,335,493 | 6,183,128 | 28,119,706 | 73,718,100 | 1,093,425,191 |
| messages per session | 125 | 339 | 583 | 731 | 51,198 |

| agent | sessions | share |
| --- | ---: | ---: |
| `reviewer` | 128 | 40.4% |
| `engineer` | 107 | 33.8% |
| `atomaton` | 81 | 25.6% |
| `architect` | 1 | 0.3% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `bash` | 8,266 | 168 | 126 | 2% |
| `read` | 6,075 | 32 | 8 | 0.5% |
| `grep` | 4,697 | 112 | 21 | 2.4% |
| `edit` | 2,150 | 35 | 0 | 1.6% |
| `shell__shell_execute` | 1,548 | 19 | 22 | 1.2% |
| `fetch` | 1,033 | 98 | 0 | 9.5% |
| `list` | 360 | 5 | 0 | 1.4% |
| `get_issue` | 359 | 14 | 5 | 3.9% |
| `get_issue_comments` | 350 | 0 | 10 | 0% |
| `get_pr` | 345 | 9 | 3 | 2.6% |
| `get_check_runs` | 339 | 13 | 0 | 3.8% |
| `glob` | 312 | 1 | 1 | 0.3% |
| `atoma_builtin__load_skill` | 210 | 1 | 0 | 0.5% |
| `check_merge_readiness` | 205 | 0 | 0 | 0% |
| `get_branch` | 202 | 0 | 0 | 0% |
| `write` | 199 | 2 | 0 | 1% |
| `commit_and_push` | 192 | 9 | 0 | 4.7% |
| `create_pr` | 169 | 55 | 0 | 32.5% |
| `web__fetch` | 148 | 10 | 0 | 6.8% |
| `get_pr_diff` | 139 | 3 | 0 | 2.2% |
| `search_issues` | 131 | 0 | 3 | 0% |
| `request_close_issue` | 100 | 1 | 0 | 1% |
| `get_pr_reviews` | 81 | 0 | 0 | 0% |
| `load_skill` | 79 | 9 | 0 | 11.4% |
| `github__get_issue` | 68 | 0 | 0 | 0% |
| `list_prs` | 67 | 0 | 0 | 0% |
| `merge_pr` | 65 | 0 | 0 | 0% |
| `github__get_issue_comments` | 64 | 0 | 0 | 0% |
| `list_pr_review_comments` | 61 | 0 | 0 | 0% |
| `search_code` | 52 | 0 | 0 | 0% |
| `search__search_issues` | 43 | 0 | 0 | 0% |
| `search_remote_code` | 42 | 13 | 0 | 31% |
| `github__get_check_runs` | 35 | 0 | 0 | 0% |
| `create_root_issue` | 33 | 1 | 0 | 3% |
| `github__get_branch` | 32 | 0 | 0 | 0% |
| `github__get_pr` | 30 | 3 | 0 | 10% |
| `delegate` | 29 | 0 | 0 | 0% |
| `delegate_readonly` | 28 | 0 | 0 | 0% |
| `github__list_prs` | 27 | 0 | 0 | 0% |
| `launch_sub_agent` | 26 | 2 | 0 | 7.7% |
| `create_sub_issue` | 22 | 0 | 0 | 0% |
| `github__create_issue` | 19 | 0 | 0 | 0% |
| `list_issues` | 17 | 0 | 0 | 0% |
| `sync_branch` | 16 | 7 | 0 | 43.8% |
| `create_issue` | 15 | 4 | 0 | 26.7% |
| `github__check_merge_readiness` | 15 | 0 | 0 | 0% |
| `github__get_pr_diff` | 11 | 0 | 0 | 0% |
| `github__list_issues` | 11 | 0 | 0 | 0% |
| `github__commit_and_push` | 10 | 1 | 0 | 10% |
| `github__get_pr_reviews` | 10 | 0 | 0 | 0% |
| `publish_draft` | 9 | 0 | 0 | 0% |
| `delegate_large` | 8 | 0 | 0 | 0% |
| `github__create_pr` | 8 | 2 | 0 | 25% |
| `github__list_pr_review_comments` | 8 | 0 | 0 | 0% |
| `probe` | 8 | 0 | 0 | 0% |
| `delegate_readonly_large` | 7 | 0 | 3 | 0% |
| `atomaton__request_close_issue` | 6 | 1 | 0 | 16.7% |
| `atomaton__launch_sub_agent` | 5 | 0 | 0 | 0% |
| `close_issue` | 5 | 0 | 0 | 0% |
| `delegate_readonly__run` | 4 | 0 | 0 | 0% |
| `merge_base_into_branch` | 4 | 0 | 0 | 0% |
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
| `other` | 6,606 | 79.9% |
| `edit` | 632 | 7.6% |
| `search` | 527 | 6.4% |
| `open` | 263 | 3.2% |
| `verify` | 238 | 2.9% |

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 224 | 77.5% |
| `writing/japanese` | 30 | 10.4% |
| `delivery/pipeline-setup` | 10 | 3.5% |
| `research/web-search` | 8 | 2.8% |
| `engineering/environment` | 7 | 2.4% |
| `engineering/secrets-in-a-check` | 6 | 2.1% |
| `docs/customer-doc` | 3 | 1% |
| `docs/design-doc` | 1 | 0.3% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

| last seen | server | reports | sessions | problem |
| --- | --- | ---: | ---: | --- |
| 2026-11-15 | `search` | 1 | 1 | could not preload the reranker (EACCES), results are first-stage ordered |

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `security/agent-prompt-surface`
- `security/atomaton-surface`
- `security/gh-actions-surface`
- `security/on-demand-audit`
