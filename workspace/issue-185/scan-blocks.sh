#!/bin/bash
# Runs of consecutive //-comment lines (>=6) that contain a #NNN reference, in tracked src/**/*.ts
git ls-files 'src/*.ts' 'src/**/*.ts' | sort -u | while read -r f; do
  awk -v file="$f" '
  function flush() {
    if (n >= 6) {
      block = ""
      for (i = 0; i < n; i++) block = block txt[i] "\n"
      if (block ~ /#[0-9]+/) {
        nums = ""
        s = block
        while (match(s, /#[0-9]+/)) { nums = nums substr(s, RSTART, RLENGTH) " "; s = substr(s, RSTART + RLENGTH) }
        printf "%s:%d len=%d nums=[%s]\n", file, first, n, nums
      }
    }
    n = 0; delete txt
  }
  /^[[:space:]]*\/\// { if (n == 0) first = NR; txt[n++] = $0; next }
  { flush() }
  END { flush() }
  ' "$f"
done
