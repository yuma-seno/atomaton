#!/usr/bin/env bash
# Reproduces issue #389 against the SOURCE guard:
#   bun run src/entrypoints/tools/hooks/shell_guard.ts   (JSON on stdin)
# Writes nothing; prints labels + the guard's verdict for each shape.
set -u
cd /home/runner/work/atomaton/atomaton || exit 1

run() {
  printf '%-46s %s\n' "$1" "$(printf '%s' "$2" | bun run src/entrypoints/tools/hooks/shell_guard.ts)"
}

q() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

cmd() {
  run "$1" "{\"arguments\":{\"command\":\"$(q "$2")\"}}"
}

cmd 'call 1 (do curl ...)'        'cd /tmp && for n in 363; do curl -s "https://api.github.com/repos/o/r/issues/$n/events?per_page=100" -o ev-$n.json && echo ok; done'
cmd 'call 2 (do curl only)'       'cd /tmp && for n in 348 371; do curl -s "https://api.github.com/repos/o/r/pulls/$n" -o pr-$n.json; done; command -v jq'
cmd 'call 5 (do sha=$(...); curl)' 'cd /tmp && for n in 348 359 361; do sha=$(jq -r .head.sha pr-$n.json); curl -s "https://api.github.com/repos/o/r/commits/$sha/check-runs?per_page=100" -o cr-$n.json; done'
echo
cmd 'minimal: for ... do CURL'    'for n in 1; do curl -s https://example.com -o x; done'
cmd 'minimal: do echo; CURL'      'for n in 1; do echo hi; curl -s https://example.com -o x; done'
cmd 'minimal: if true; then CURL' 'if true; then curl -s https://example.com; fi'
cmd 'minimal: brace group'        '{ curl -s https://example.com; }'
cmd 'minimal: subshell'           '( curl -s https://example.com )'
cmd 'minimal: newline-separated'  'cd /tmp
curl -s https://example.com'
cmd 'minimal: background &'       'sleep 1 & curl -s https://example.com'
cmd 'minimal: assignment subst'   'x=$(curl -s https://example.com)'
echo
cmd 'control: plain CURL'         'curl -s https://example.com'
cmd 'control: do CURL, separated' 'for n in 1; do echo hi; curl -s https://example.com; done'
