# Agent metrics

Read from the sessions stored on this branch. Nothing here is recorded specially: every number is something the agents already wrote down while working.

Generated 2026-09-22.

A session appears in a dated window only if it recorded when its runs ended. Sessions from before run recording existed are counted under All time alone, so the dated windows are thinner than the project was — that gap closes as new sessions arrive, not by anything changing here.

## Runs

| window | runs | gave up | median seconds | longest | median round trips | median seconds each |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Last 7 days | 1 | 0% | 737 | 737 | 17 | 43.4 |
| Last 30 days | 1 | 0% | 737 | 737 | 17 | 43.4 |
| Last year | 1 | 0% | 737 | 737 | 17 | 43.4 |
| All time | 1 | 0% | 737 | 737 | 17 | 43.4 |

**Gave up** is every ending that is not `completed` — a ceiling reached, a person asking, a provider hanging up, a loop cut short. Each one is a mechanism deciding the run should not continue, which is worth watching whether or not it was right.

What is left over is not the same as work delivered. `completed` is the core saying its own loop ended rather than being stopped — it says nothing about whether the run produced a report. **Ran to an end without a report**, in each window below, is that question asked separately.

| ended because | runs |
| --- | ---: |
| `completed` | 1 |

## Last 7 days

1 session.

**Ran to an end without a report:** 1 of 1 session whose last run the core recorded as `completed` — 100%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| messages per session | 121 | 121 | 121 | 121 | 121 |

| agent | sessions | share |
| --- | ---: | ---: |
| `orchestrator` | 1 | 100% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 51 | 1 | 0 | 2% |
| `list` | 25 | 0 | 0 | 0% |
| `glob` | 9 | 0 | 0 | 0% |
| `web__fetch` | 6 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 2 | 0 | 0 | 0% |
| `grep` | 2 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `github__get_issue` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

No act recorded.

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 1 | 50% |
| `research/web-search` | 1 | 50% |

## Last 30 days

1 session.

**Ran to an end without a report:** 1 of 1 session whose last run the core recorded as `completed` — 100%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| messages per session | 121 | 121 | 121 | 121 | 121 |

| agent | sessions | share |
| --- | ---: | ---: |
| `orchestrator` | 1 | 100% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 51 | 1 | 0 | 2% |
| `list` | 25 | 0 | 0 | 0% |
| `glob` | 9 | 0 | 0 | 0% |
| `web__fetch` | 6 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 2 | 0 | 0 | 0% |
| `grep` | 2 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `github__get_issue` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

No act recorded.

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 1 | 50% |
| `research/web-search` | 1 | 50% |

## Last year

1 session.

**Ran to an end without a report:** 1 of 1 session whose last run the core recorded as `completed` — 100%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| messages per session | 121 | 121 | 121 | 121 | 121 |

| agent | sessions | share |
| --- | ---: | ---: |
| `orchestrator` | 1 | 100% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 51 | 1 | 0 | 2% |
| `list` | 25 | 0 | 0 | 0% |
| `glob` | 9 | 0 | 0 | 0% |
| `web__fetch` | 6 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 2 | 0 | 0 | 0% |
| `grep` | 2 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `github__get_issue` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

No act recorded.

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 1 | 50% |
| `research/web-search` | 1 | 50% |

## All time

1 session.

**Ran to an end without a report:** 1 of 1 session whose last run the core recorded as `completed` — 100%. These are not runs that gave up: nothing stopped them, they simply ended without writing a closing line, so the work is in a saved session and nowhere a person or the next agent reads.

| | p50 | p90 | p99 | max | total |
| --- | ---: | ---: | ---: | ---: | ---: |
| messages per session | 121 | 121 | 121 | 121 | 121 |

| agent | sessions | share |
| --- | ---: | ---: |
| `orchestrator` | 1 | 100% |

**Refused** is the machinery saying no — a denylist, an allowlist, a hook. A guard working is not a tool breaking, and a reader cannot act on the two the same way, so they are counted apart. **Failed** is everything else that came back as an error, by string match, so it is an estimate.

| tool | calls | failed | refused | failure rate |
| --- | ---: | ---: | ---: | ---: |
| `read` | 51 | 1 | 0 | 2% |
| `list` | 25 | 0 | 0 | 0% |
| `glob` | 9 | 0 | 0 | 0% |
| `web__fetch` | 6 | 0 | 0 | 0% |
| `atoma_builtin__load_skill` | 2 | 0 | 0 | 0% |
| `grep` | 2 | 0 | 0 | 0% |
| `atomaton__request_close_issue` | 1 | 0 | 0 | 0% |
| `github__get_issue` | 1 | 0 | 0 | 0% |
| `github__get_issue_comments` | 1 | 0 | 0 | 0% |
| `search__search_issues` | 1 | 0 | 0 | 0% |

What the agents do when they reach for a shell. `search` without a matching `open` is the shape that produced this project's most expensive runs; `edit` against `verify` is the shape that turned out not to occur at all.

No act recorded.

| skill | loads | share |
| --- | ---: | ---: |
| `project/conventions` | 1 | 50% |
| `research/web-search` | 1 | 50% |

## Degraded answers

A tool can answer and report that it answered badly — a search that came back unranked, a log that went nowhere. The call succeeded, so it is neither a failure nor a refusal, and it is easy for one of these to run for months with nobody reading it. **Read `last seen` before `reports`**: an old count is a fixed fault. That date is when the session file was last written, which is the run that touched it last and not necessarily the run that reported the problem — so it errs recent.

Nothing reported a problem alongside an answer.

## Never used

Over all time, because something used once a year is still used. Each of these sits in the prompt of every run and returns nothing.

Every declared server has been called at least once.

Skills never loaded:

- `delivery/pipeline-setup`
- `engineering/environment`
